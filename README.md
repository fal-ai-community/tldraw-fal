This is a [Next.js](https://nextjs.org/) app with [fal](https://fal.ai) and [tldraw](https://tldraw.dev) that demonstrates real-time AI image generation based on drawings in a canvas.

## Getting Started

1. First, you need to add the fal credentials to your environment. The recommended way is to create a `.env.local` file and add the key you obtained from `https://fal.ai/dashboard/keys`:

   ```bash
   FAL_KEY="key_id:key_secret"
   ```

2. Make sure you install the dependencies:

   ```bash
   npm install
   ```

3. Now you can run the Next.js project as usual:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Note:** although the commands above use `npm`, feel free to use your preferred package manager,

## What's next?

Real-time image generation is just one of the many cool things you can do with fal. Make sure you:

- Check all the available [Model APIs](https://fal.ai/models)
- Check our [Next.js integration guide](https://fal.ai/docs/integrations/nextjs)
- Learn how to write your own model APIs on [Introduction to serverless functions](https://fal.ai/docs/serverless-functions)
- Read more about function endpoints on [Serving functions](https://fal.ai/docs/function-endpoints)

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Make sure you read our [Code of Conduct](https://github.com/fal-ai/tldraw-fal/blob/main/CODE_OF_CONDUCT.md)
2. Fork the project and clone your fork
3. Setup the local environment with `npm install`
4. Create a feature branch (`git checkout -b feature/add-cool-thing`) or a bugfix branch (`git checkout -b fix/smash-that-bug`)
5. Commit the changes (`git commit -m 'feat(client): added a cool thing'`) - use [conventional commits](https://conventionalcommits.org)
6. Push to the branch (`git push --set-upstream origin feature/add-cool-thing`)
7. Open a Pull Request

## License

Distributed under the MIT License. See [LICENSE](https://github.com/fal-ai/tldraw-fal/blob/main/LICENSE) for more information.
