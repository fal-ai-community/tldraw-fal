import { LiveImageShape } from '@/components/LiveImageShapeUtil'
import { blobToDataUri } from '@/utils/blob'
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
import { useRef, useEffect } from 'react'

export function useFal(
	shapeId: TLShapeId,
	opts: {
		debounceTime?: number
		throttleTime?: number
		url: string
	}
) {
	const { url, throttleTime = 500, debounceTime = 0 } = opts
	const editor = useEditor()
	const startedIteration = useRef<number>(0)
	const finishedIteration = useRef<number>(0)

	const prevHash = useRef<string | null>(null)

	useEffect(() => {
		let socket: WebSocket | null = null

		let isReconnecting = false

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

		async function connect() {
			{
				socket = new WebSocket(url)
				socket.onopen = () => {
					// console.log("WebSocket Open");
				}

				socket.onclose = () => {
					// console.log("WebSocket Close");
				}

				socket.onerror = (error) => {
					// console.error("WebSocket Error:", error);
				}

				socket.onmessage = (message) => {
					try {
						const data = JSON.parse(message.data)
						// console.log("WebSocket Message:", data);
						if (data.images && data.images.length > 0) {
							updateImage(data.images[0].url ?? '')
						}
					} catch (e) {
						console.error('Error parsing the WebSocket response:', e)
					}
				}
			}
		}

		async function sendCurrentData(message: string) {
			if (!isReconnecting && socket?.readyState !== WebSocket.OPEN) {
				isReconnecting = true
				connect()
			}

			if (isReconnecting && socket?.readyState !== WebSocket.OPEN) {
				await new Promise<void>((resolve) => {
					const checkConnection = setInterval(() => {
						if (socket?.readyState === WebSocket.OPEN) {
							clearInterval(checkConnection)
							resolve()
						}
					}, 100)
				})
				isReconnecting = false
			}
			socket?.send(message)
		}

		async function updateDrawing() {
			const iteration = startedIteration.current++

			const shapes = Array.from(editor.getShapeAndDescendantIds([shapeId])).map(
				(id) => editor.getShape(id)
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
				updateImage('')
				return
			}

			// We might be stale
			if (iteration <= finishedIteration.current) return

			const prompt = shape.props.name
				? shape.props.name + ' hd award-winning impressive'
				: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'
			const imageDataUri = await blobToDataUri(image)
			const request = {
				image_url: imageDataUri,
				prompt,
				sync_mode: true,
				strength: 0.7,
				seed: 42, // TODO make this configurable in the UI
				enable_safety_checks: false,
			}

			// We might be stale
			if (iteration <= finishedIteration.current) return
			sendCurrentData(JSON.stringify(request))
			finishedIteration.current = iteration
		}

		const onDrawingChange = debounceTime
			? debounce(updateDrawing, debounceTime)
			: throttleTime
			  ? throttle(updateDrawing, throttleTime)
			  : debounce(updateDrawing, 16)

		editor.on('update-drawings' as any, onDrawingChange)

		return () => {
			editor.off('update-drawings' as any, onDrawingChange)
		}
	}, [editor, shapeId, throttleTime, debounceTime, url])
}
