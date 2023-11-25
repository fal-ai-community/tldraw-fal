import { LiveImageShape } from '@/components/LiveImageShapeUtil'
import { blobToDataUri } from '@/utils/blob'
import * as fal from '@fal-ai/serverless-client'
import {
	AssetRecordType,
	TLShape,
	TLShapeId,
	debounce,
	getHashForObject,
	getSvgAsImage,
	throttle,
	useEditor,
} from '@tldraw/tldraw'
import { useEffect, useRef } from 'react'

export function useFal(
	shapeId: TLShapeId,
	opts: {
		debounceTime?: number
		throttleTime?: number
		appId: string
	}
) {
	const { appId, throttleTime = 500, debounceTime = 0 } = opts
	const editor = useEditor()
	const startedIteration = useRef<number>(0)
	const finishedIteration = useRef<number>(0)

	const prevHash = useRef<string | null>(null)

	useEffect(() => {
		function updateImage(url: string | null) {
			const shape = editor.getShape<LiveImageShape>(shapeId)!
			const id = AssetRecordType.createId(shape.id.split(':')[1])

			const asset = editor.getAsset(id)

			if (!asset) {
				editor.createAssets([
					AssetRecordType.create({
						id,
						type: 'image',
						props: {
							name: shape.props.name,
							w: shape.props.w,
							h: shape.props.h,
							src: url,
							isAnimated: false,
							mimeType: 'image/jpeg',
						},
					}),
				])
			} else {
				editor.updateAssets([
					{
						...asset,
						type: 'image',
						props: {
							...asset.props,
							w: shape.props.w,
							h: shape.props.h,
							src: url,
						},
					},
				])
			}
		}

		const { send: sendCurrentData, close } = fal.realtime.connect(appId, {
			connectionKey: 'fal-realtime-example',
			clientOnly: false,
			throttleInterval: 1000,
			onError: (error) => {
				console.log(`Received error!`)
				console.error(error)
			},
			onResult: (result) => {
				console.log(`Received result!`)
				if (result.images && result.images[0]) {
					updateImage(result.images[0].url)
				}
			},
		})

		async function updateDrawing() {
			const iteration = startedIteration.current++

			const shapes = Array.from(editor.getShapeAndDescendantIds([shapeId])).map((id) =>
				editor.getShape(id)
			) as TLShape[]

			const hash = getHashForObject(shapes)
			if (hash === prevHash.current) return

			const shape = editor.getShape<LiveImageShape>(shapeId)!

			const svg = await editor.getSvg([shape], {
				background: true,
				padding: 0,
				darkMode: editor.user.getIsDarkMode(),
			})
			if (!svg) {
				console.error('No SVG')
				updateImage('')
				return
			}

			// We might be stale
			if (iteration <= finishedIteration.current) return

			const image = await getSvgAsImage(svg, editor.environment.isSafari, {
				type: 'png',
				quality: 1,
				scale: 1,
			})
			if (!image) {
				console.error('No image')
				updateImage('')
				return
			}

			// We might be stale
			if (iteration <= finishedIteration.current) return

			const prompt = shape.props.name
				? shape.props.name + ' hd award-winning impressive'
				: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'
			const imageDataUri = await blobToDataUri(image)
			// We might be stale
			if (iteration <= finishedIteration.current) return

			try {
				console.log('Sending data...')
				sendCurrentData(
					JSON.stringify({
						prompt,
						image_url: imageDataUri,
						sync_mode: true,
						strength: 0.7,
						seed: 11252023, // TODO make this configurable in the UI
						enable_safety_checks: false,
					})
				)
				finishedIteration.current = iteration
			} catch (e) {
				console.error(e)
			}
		}

		const onDrawingChange = debounceTime
			? debounce(updateDrawing, debounceTime)
			: throttleTime
			  ? throttle(updateDrawing, throttleTime)
			  : debounce(updateDrawing, 16)

		editor.on('update-drawings' as any, onDrawingChange)

		return () => {
			// close()
			editor.off('update-drawings' as any, onDrawingChange)
		}
	}, [editor, shapeId, throttleTime, debounceTime, appId])
}
