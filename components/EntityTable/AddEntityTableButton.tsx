"use client";

import { createShapeId, TldrawUiToolbarButton, useEditor } from "tldraw";
import { createStarterEntityTableProps, ENTITY_TABLE_TYPE } from "./entity-table";

export function AddEntityTableButton() {
  const editor = useEditor();

  return (
    <TldrawUiToolbarButton
      type="tool"
      title="Add table"
      tooltip="Add table"
      onClick={() => {
        if (editor.getIsReadonly()) return;
        const props = createStarterEntityTableProps();
        const center = editor.getViewportPageBounds().center;
        const id = createShapeId();
        editor.markHistoryStoppingPoint("add entity table");
        editor.createShape({
          id,
          type: ENTITY_TABLE_TYPE,
          x: center.x - props.w / 2,
          y: center.y - props.h / 2,
          props,
        });
        editor.setCurrentTool("select");
        editor.select(id);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1.5" y="2" width="13" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 6.2h13M1.5 10h13" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </TldrawUiToolbarButton>
  );
}
