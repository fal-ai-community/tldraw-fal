import { FrameShapeTool, useEditor } from "@tldraw/tldraw";
import { useCallback } from "react";

export class LiveImageTool extends FrameShapeTool {
  static override id = "live-image";
  static override initial = "idle";
  override shapeType = "live-image";
}

export function MakeLiveButton() {
  const editor = useEditor();
  const makeLive = useCallback(() => {
    editor.setCurrentTool("live-image");
  }, [editor]);

  return (
    <button
      onClick={makeLive}
      className="p-2"
      style={{ cursor: "pointer", zIndex: 100000, pointerEvents: "all" }}
    >
      <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Draw Fast
      </div>
    </button>
  );
}
