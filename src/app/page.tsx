export default function Home() {
	return (
		<div className="sorry">
			<div className="sorry__inner">
				<p className="sorry__lockup">
					<a href="https://twitter.com/tldraw" target="_blank" rel="nofollow noopener">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img className="tldraw" src="/Lockup-Black.svg" alt="by tldraw" />
					</a>
				</p>
				<h1>Sorry!</h1>
				<p>We shut this project down on January 14th, 2024.</p>
				<p>Here are some things you can do:</p>
				<ol>
					<li>
						<a href="https://twitter.com/tldraw/status/1727728068968460778">Learn more</a> about
						what this project was.
					</li>
					<li>
						Visit <a href="https://tldraw.com">tldraw.com</a> for a free multiplayer whiteboard.
					</li>
					<li>
						Visit <a href="https://together.tldraw.com">together.tldraw.com</a> for the same
						collaborative scrolly drawing app (but without the AI stuff).
					</li>
				</ol>
				<p>Thank you!</p>
				<p>
					❤️ <a href="https://x.com/tldraw">tldraw</a>
				</p>
			</div>
		</div>
	)
}
