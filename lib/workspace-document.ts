export type CanvasNote = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export function docText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
    return content.text;
  }
  return "";
}

export function canvasNotes(content: unknown): CanvasNote[] {
  if (!content || typeof content !== "object" || !("notes" in content) || !Array.isArray(content.notes)) {
    return [];
  }
  return content.notes.flatMap((note) => {
    if (!note || typeof note !== "object") return [];
    if (typeof note.id !== "string" || typeof note.text !== "string") return [];
    return [
      {
        id: note.id,
        text: note.text,
        x: typeof note.x === "number" ? note.x : 32,
        y: typeof note.y === "number" ? note.y : 32,
      },
    ];
  });
}

export function docBlocks(content: unknown) {
  return Array.isArray(content) ? content : null;
}

export function yjsStateToBase64(state: Uint8Array | null) {
  if (!state?.length) return null;
  return Buffer.from(state).toString("base64");
}

export function canvasSnapshot(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  if ("store" in content || "document" in content) return content;
  return null;
}

export function docContent(text: string) {
  return { text };
}

export function canvasContent(notes: CanvasNote[]) {
  return { notes };
}
