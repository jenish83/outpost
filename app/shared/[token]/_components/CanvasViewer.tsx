"use client";

import {
  Tldraw,
  type Editor,
  type TLComponents,
  type TLEditorSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { EntityTableShapeUtil } from "@/components/EntityTable";

const shapeUtils = [EntityTableShapeUtil];

// Shared links are view-only: no menus or tools, just the canvas content.
const components: TLComponents = {
  StylePanel: null,
  PageMenu: null,
  MainMenu: null,
  Toolbar: null,
  ActionsMenu: null,
  HelpMenu: null,
  ContextMenu: null,
};

export function CanvasViewer({ snapshot }: { snapshot: TLEditorSnapshot | null }) {
  const handleMount = (editor: Editor) => {
    editor.updateInstanceState({ isReadonly: true });
    editor.zoomToFit({ animation: { duration: 0 } });
  };

  return (
    // isolate keeps tldraw's high z-index layers inside the canvas (same as the editor).
    <div className="isolate h-full">
      <Tldraw
        snapshot={snapshot ?? undefined}
        onMount={handleMount}
        components={components}
        colorScheme="dark"
        shapeUtils={shapeUtils}
        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
      />
    </div>
  );
}
