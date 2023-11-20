"use client";

import { LiveImageShapeUtil } from "@/components/live-image";
import * as fal from "@fal-ai/serverless-client";
import { Editor, Tldraw } from "@tldraw/tldraw";
import { useCallback } from "react";

fal.config({
  requestMiddleware: fal.withProxy({
    targetUrl: "/api/fal/proxy",
  }),
});

const shapeUtils = [LiveImageShapeUtil];

export default function Home() {
  const onEditorMount = useCallback((editor: Editor) => {
    // If there isn't a live image shape, create one
    const liveImage = editor.getCurrentPageShapes().find((shape) => {
      return shape.type === "live-image";
    });

    if (liveImage) {
      return;
    }

    editor.createShape({
      type: "live-image",
      x: 120,
      y: 180,
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="fixed inset-0">
        <Tldraw onMount={onEditorMount} shapeUtils={shapeUtils} />
      </div>
    </main>
  );
}
