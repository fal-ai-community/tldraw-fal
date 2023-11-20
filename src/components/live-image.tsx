import {
  Box2d,
  getSvgAsImage,
  Rectangle2d,
  ShapeUtil,
  TLBaseShape,
  TLEventMapHandler,
  TLShape,
  useEditor,
} from "@tldraw/tldraw";

import { blobToDataUri } from "@/utils/blob";
import { debounce } from "@/utils/debounce";
import * as fal from "@fal-ai/serverless-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FalLogo } from "./fal-logo";

// See https://www.fal.ai/models/latent-consistency-sd

const LatentConsistency = "110602490-lcm-sd15-i2i";

type Input = {
  prompt: string;
  image_url: string;
  sync_mode: boolean;
  seed: number;
};

type Output = {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  seed: number;
  num_inference_steps: number;
};

// TODO make this an input on the canvas
const PROMPT = "a city skyline";

export function LiveImage() {
  const editor = useEditor();
  const [image, setImage] = useState<string | null>(null);

  // Used to prevent multiple requests from being sent at once for the same image
  // There's probably a better way to do this using TLDraw's state
  const imageDigest = useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDrawingChange = useCallback(
    debounce(async () => {
      // TODO get actual drawing bounds
      // const bounds = new Box2d(120, 180, 512, 512);

      const shapes = editor.getCurrentPageShapes().filter((shape) => {
        if (shape.type === "live-image") {
          return false;
        }
        return true;
        // const pageBounds = editor.getShapeMaskedPageBounds(shape);
        // if (!pageBounds) {
        //   return false;
        // }
        // return bounds.includes(pageBounds);
      });

      // Check if should submit request
      const shapesDigest = JSON.stringify(shapes);
      if (shapesDigest === imageDigest.current) {
        return;
      }
      imageDigest.current = shapesDigest;

      const svg = await editor.getSvg(shapes, { background: true });
      if (!svg) {
        return;
      }
      const image = await getSvgAsImage(svg, editor.environment.isSafari, {
        type: "png",
        quality: 0.5,
        scale: 1,
      });
      if (!image) {
        return;
      }

      const imageDataUri = await blobToDataUri(image);
      const result = await fal.run<Input, Output>(LatentConsistency, {
        input: {
          image_url: imageDataUri,
          prompt: PROMPT,
          sync_mode: true,
          seed: 42, // TODO make this configurable in the UI
        },
      });
      if (result && result.images.length > 0) {
        setImage(result.images[0].url);
      }
    }, 16),
    []
  );

  useEffect(() => {
    const onChange: TLEventMapHandler<"change"> = (event) => {
      if (event.source !== "user") {
        return;
      }
      if (
        Object.keys(event.changes.added).length ||
        Object.keys(event.changes.removed).length ||
        Object.keys(event.changes.updated).length
      ) {
        onDrawingChange();
      }
    };
    editor.addListener("change", onChange);
    return () => {
      editor.removeListener("change", onChange);
    };
  }, []);

  return (
    <div className="flex flex-row w-[1060px] h-[560px] absolute bg-indigo-200 border border-indigo-500 rounded space-x-4 p-4 pb-8">
      <div className="flex-1 h-[512px] bg-white border border-indigo-500">
        <div className="flex flex-row items-center px-4 py-2 space-x-2">
          <span className="font-mono text-indigo-900/50">/imagine</span>
          <input
            className="border-0 bg-transparent flex-1 text-base text-indigo-900"
            placeholder="something cool..."
            value={PROMPT}
          />
        </div>
      </div>
      <div className="flex-1 h-[512px] bg-white border border-indigo-500">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && <img src={image} alt="" width={512} height={512} />}
      </div>
      <span className="absolute bottom-1.5 right-4">
        <a
          href="https://fal.ai/models/latent-consistency"
          target="_blank"
          className="flex flex-row space-x-1"
        >
          <span className="text-xs text-indigo-900/50">powered by</span>
          <span className="w-[36px] opacity-50">
            <FalLogo />
          </span>
        </a>
      </span>
    </div>
  );
}

type LiveImageShape = TLBaseShape<"live-image", { w: number; h: number }>;

export class LiveImageShapeUtil extends ShapeUtil<LiveImageShape> {
  static override type = "live-image" as const;

  override canResize = () => false;

  getDefaultProps(): LiveImageShape["props"] {
    return {
      w: 1060,
      h: 560,
    };
  }

  getGeometry(shape: LiveImageShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: LiveImageShape) {
    return <LiveImage />;
  }

  indicator(shape: LiveImageShape) {
    return (
      <rect width={shape.props.w} height={shape.props.h} radius={4}></rect>
    );
  }
}
