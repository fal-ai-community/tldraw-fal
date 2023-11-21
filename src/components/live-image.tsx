/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/rules-of-hooks */
import {
  FrameShapeUtil,
  getSvgAsImage,
  HTMLContainer,
  TLEventMapHandler,
  TLFrameShape,
  TLShape,
  useEditor,
} from "@tldraw/tldraw";

import { blobToDataUri } from "@/utils/blob";
import { debounce } from "@/utils/debounce";
import * as fal from "@fal-ai/serverless-client";
import { useCallback, useEffect, useRef, useState } from "react";

// See https://www.fal.ai/models/latent-consistency-sd

const LatentConsistency = "110602490-lcm-sd15-i2i";

type Input = {
  prompt: string;
  image_url: string;
  sync_mode: boolean;
  seed: number;
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  enable_safety_checks?: boolean;
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

export class LiveImageShapeUtil extends FrameShapeUtil {
  static override type = "live-image" as any;

  override getDefaultProps(): { w: number; h: number; name: string } {
    return {
      w: 512,
      h: 512,
      name: "a city skyline",
    };
  }

  override component(shape: TLFrameShape) {
    const editor = useEditor();
    const component = super.component(shape);
    const [image, setImage] = useState<string | null>(null);

    const imageDigest = useRef<string | null>(null);
    const startedIteration = useRef<number>(0);
    const finishedIteration = useRef<number>(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onDrawingChange = useCallback(
      debounce(async () => {
        // TODO get actual drawing bounds
        // const bounds = new Box2d(120, 180, 512, 512);

        const iteration = startedIteration.current++;

        const shapes = Array.from(editor.getShapeAndDescendantIds([shape.id]))
          .filter((id) => id !== shape.id)
          .map((id) => editor.getShape(id)) as TLShape[];

        // Check if should submit request
        const shapesDigest = JSON.stringify(shapes);
        if (shapesDigest === imageDigest.current) {
          return;
        }
        imageDigest.current = shapesDigest;

        const svg = await editor.getSvg(shapes, { background: true });
        if (iteration <= finishedIteration.current) return;

        if (!svg) {
          return;
        }
        const image = await getSvgAsImage(svg, editor.environment.isSafari, {
          type: "png",
          quality: 1,
          scale: 1,
        });

        if (iteration <= finishedIteration.current) return;

        if (!image) {
          return;
        }

        const prompt =
          editor.getShape<TLFrameShape>(shape.id)?.props.name ?? "";
        const imageDataUri = await blobToDataUri(image);
        if (iteration <= finishedIteration.current) return;

        const result = await fal.run<Input, Output>(LatentConsistency, {
          input: {
            image_url: imageDataUri,
            prompt,
            sync_mode: true,
            strength: 0.6,
            seed: 42, // TODO make this configurable in the UI
            enable_safety_checks: false,
          },
          // Disable auto-upload so we can submit the data uri of the image as is
          autoUpload: true,
        });
        if (iteration <= finishedIteration.current) return;

        finishedIteration.current = iteration;
        if (result && result.images.length > 0) {
          setImage(result.images[0].url);
        }
      }, 32),
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
    }, [editor, onDrawingChange]);

    return (
      <HTMLContainer>
        <div
          style={{
            display: "flex",
          }}
        >
          {component}

          {image && (
            <img
              src={image}
              alt=""
              width={shape.props.w}
              height={shape.props.h}
              style={{
                position: "relative",
                left: shape.props.w,
                width: shape.props.w,
                height: shape.props.h,
              }}
            />
          )}
        </div>
      </HTMLContainer>
    );
  }
}
