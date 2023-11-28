import { LiveImageShape } from '@/components/LiveImageShapeUtil'
import { blobToDataUri } from '@/utils/blob'
import * as fal from '@fal-ai/serverless-client'
import {
	AssetRecordType,
	Editor,
	TLShape,
	TLShapeId,
	debounce,
	getHashForObject,
	getSvgAsImage,
	rng,
	throttle,
	useEditor,
} from '@tldraw/tldraw'
import { useEffect, useRef } from 'react'

export function useLiveImage(
	shapeId: TLShapeId,
	opts: {
		debounceTime?: number
		throttleTime?: number
		appId: string
	}
) {
	const { appId, throttleTime = 100, debounceTime = 0 } = opts
	const editor = useEditor()
	const startedIteration = useRef<number>(0)
	const finishedIteration = useRef<number>(0)

	const prevHash = useRef<string | null>(null)
	const prevPrompt = useRef<string>('')

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
			throttleInterval: throttleTime,
			onError: (error) => {
				console.error(error)
			},
			onResult: (result) => {
				if (result.images && result.images[0]) {
					updateImage(result.images[0].url)
				}
			},
		})

		async function updateDrawing() {
			const iteration = startedIteration.current++

			const shapes = getShapesTouching(shapeId, editor)

			const shape = editor.getShape<LiveImageShape>(shapeId)!
			const hash = getHashForObject([...shapes])
			if (hash === prevHash.current && shape.props.name === prevPrompt.current) return
			prevHash.current = hash
			prevPrompt.current = shape.props.name

			const svg = await editor.getSvg([...shapes], {
				background: true,
				padding: 0,
				darkMode: editor.user.getIsDarkMode(),
				bounds: editor.getShapePageBounds(shapeId)!,
			})
			// We might be stale
			if (iteration <= finishedIteration.current) return
			if (!svg) {
				console.error('No SVG')
				updateImage('')
				return
			}

			const image = await getSvgAsImage(svg, editor.environment.isSafari, {
				type: 'png',
				quality: 1,
				scale: 512 / shape.props.w,
			})

			// We might be stale
			if (iteration <= finishedIteration.current) return
			if (!image) {
				console.error('No image')
				updateImage('')
				return
			}
			const prompt = shape.props.name
				? shape.props.name + ' hd award-winning impressive'
				: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'
			const imageDataUri = await blobToDataUri(image)
			// downloadDataURLAsFile(imageDataUri, 'test.png')
			// We might be stale
			if (iteration <= finishedIteration.current) return

			const random = rng(shapeId)

			try {
				sendCurrentData({
					prompt,
					image_url: imageDataUri,
					sync_mode: true,
					strength: 0.65,
					seed: Math.abs(random() * 10000), // TODO make this configurable in the UI
					enable_safety_checks: false,
				})
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
			try {
				close()
			} catch (e) {
				// noop
			}
			editor.off('update-drawings' as any, onDrawingChange)
		}
	}, [editor, shapeId, throttleTime, debounceTime, appId])
}

function getShapesTouching(shapeId: TLShapeId, editor: Editor) {
	const shapeIdsOnPage = editor.getCurrentPageShapeIds()
	const shapesTouching: TLShape[] = []
	const targetBounds = editor.getShapePageBounds(shapeId)
	if (!targetBounds) return shapesTouching
	for (const id of [...shapeIdsOnPage]) {
		if (id === shapeId) continue
		const bounds = editor.getShapePageBounds(id)!
		if (bounds.collides(targetBounds)) {
			shapesTouching.push(editor.getShape(id)!)
		}
	}
	return shapesTouching
}

function downloadDataURLAsFile(dataUrl: string, filename: string) {
	const link = document.createElement('a')
	link.href = dataUrl
	link.download = filename
	link.click()
}
