"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import type { Block } from "@blocknote/core";
import { withCollaboration } from "@blocknote/core/yjs";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import * as Y from "yjs";
import { saveDocContent } from "@/actions/doc";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorContext";
import { useCollaborativeDoc } from "@/hooks/use-collaborative-doc";
import { toBase64 } from "@/lib/base64";
import { outpostDarkTheme } from "@/lib/blocknote-theme";
import { colorForUser } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1000;

export function DocEditor({
  workspaceId,
  initialContent,
  initialState,
}: {
  workspaceId: string;
  initialContent: Block[] | null;
  initialState: string | null;
}) {
  const collab = useCollaborativeDoc(workspaceId, initialState);
  if (!collab) return <div className="h-full animate-pulse bg-white/3" />;
  return (
    <CollaborativeDoc
      workspaceId={workspaceId}
      doc={collab.doc}
      provider={collab.provider}
      initialContent={initialState ? null : initialContent}
    />
  );
}

function CollaborativeDoc({
  workspaceId,
  doc,
  provider,
  initialContent,
}: {
  workspaceId: string;
  doc: import("yjs").Doc;
  provider: import("@/lib/supabase-yjs-provider").SupabaseYjsProvider;
  initialContent: Block[] | null;
}) {
  const { user } = useUser();
  const { setDocEditor } = useWorkspaceEditors();
  const name = user?.fullName ?? user?.username ?? "You";
  const editor = useCreateBlockNote(
    withCollaboration({
      collaboration: {
        fragment: doc.getXmlFragment("document-store"),
        user: { name, color: colorForUser(user?.id ?? "local") },
        provider,
      },
      ...(initialContent?.length ? { initialContent } : {}),
    }),
    [doc]
  );
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDocEditor(editor);

    // Collaboration keeps the text in the Yjs doc and ignores initialContent, so a refresh
    // can only restore what was written to Postgres. The byte snapshot is what comes back.
    const persist = () => {
      const blocks = JSON.stringify(JSON.parse(JSON.stringify(editor.document)));
      void saveDocContent(workspaceId, blocks, toBase64(Y.encodeStateAsUpdate(doc))).catch(() => {
        // A failed autosave must not reject into the Next.js error overlay.
      });
    };
    const schedule = () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
    };
    
    doc.on("update", schedule);

    return () => {
      doc.off("update", schedule);
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        persist();
      }
      setDocEditor(null);
    };
  }, [doc, editor, setDocEditor, workspaceId]);

  return <BlockNoteView editor={editor} theme={outpostDarkTheme} className="h-full overflow-auto" />;
}
