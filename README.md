# draw fast

**Draw Fast** is a demo that shows how you can use the [**tldraw library**](https://tldraw.dev) with realtime image generation. The demo has now finished and we’ve taken it down. But you can still run it on your own machine and try it out.

Here’s how:

## 1. Clone the repo

Clone the [Draw Fast repo](https://github.com/tldraw/draw-fast) from github.

## 2. Get a Fal key

Go to [fal.ai](https://fal.ai)

Login with github, and get a key from the [keys page](https://www.fal.ai/dashboard/keys). (You can give it any name you want).

![1](https://github.com/tldraw/draw-fast/assets/15892272/992a8a90-9d72-4a28-aebe-921c3f82e4e9)

Copy your key.

![2](https://github.com/tldraw/draw-fast/assets/15892272/740118d6-a9e2-4320-b2f7-abb63f416c9f)

## 3. Setup environment variables

Create a `.env` file in the root folder of your repo.
Paste your key there as `FAL_KEY`

Your file should something like this:

```
FAL_KEY=8bf6c68d-8711-426b-90c6-0d9636909fce:b774f2a649cfecbf56dce57db7966a73
```

## 4. Run it locally

In your terminal…

```
npm install
npm run dev
```

And open `localhost:3000`

## 5. Draw fast

Draw something in the rectangle!
Double-clicking the prompt to change it.
Click the small arrow to enter *lens mode*.

## 6. Share!

Record your screen and show us what you draw fast.

We’re [@tldraw on twitter](https://twitter.com/tldraw).

## Troubleshooting

If the generated images don’t appear, try running `npm install` and `npm run dev` again, or try waiting a while for your key to activate.
