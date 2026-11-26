"use client";

import { createContext, useContext, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import type { Editor } from "tldraw";

type WorkspaceEditorsContextValue = {
  canvasEditor: Editor | null;
  docEditor: BlockNoteEditor | null;
  setCanvasEditor: (editor: Editor | null) => void;
  setDocEditor: (editor: BlockNoteEditor | null) => void;
};

const WorkspaceEditorsContext = createContext<WorkspaceEditorsContextValue | null>(null);

// The doc and canvas register themselves here so Share and the agent can use the live editors.
export function WorkspaceEditorsProvider({ children }: { children: React.ReactNode }) {
  const [canvasEditor, setCanvasEditor] = useState<Editor | null>(null);
  const [docEditor, setDocEditor] = useState<BlockNoteEditor | null>(null);

  return (
    <WorkspaceEditorsContext.Provider value={{ canvasEditor, docEditor, setCanvasEditor, setDocEditor }}>
      {children}
    </WorkspaceEditorsContext.Provider>
  );
}

export function useWorkspaceEditors() {
  const editors = useContext(WorkspaceEditorsContext);
  if (!editors) throw new Error("useWorkspaceEditors must be used inside WorkspaceEditorsProvider");
  return editors;
}
