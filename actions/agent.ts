"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { checkUser } from "@/actions/check-user";
import { getPromptUsage, getWorkspaceOwnerId, recordPrompt } from "@/lib/billing";
import type { LimitError } from "@/lib/plan-limits";
import { canAccessWorkspace } from "@/lib/workspace-access";
import type { CanvasNote } from "@/lib/workspace-document";

type AgentDraft = {
  reply: string;
  document: string;
  notes: { text: string }[];
};

export async function askWorkspaceAgent(
  workspaceId: string,
  prompt: string,
  document: string,
  notes: CanvasNote[]
): Promise<AgentDraft | { limit: LimitError }> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error("Prompt is required");
  if (!(await canAccessWorkspace(workspaceId))) throw new Error("Workspace not found");

  const user = await checkUser();
  if (!user) throw new Error("Not signed in");

  const ownerId = await getWorkspaceOwnerId(workspaceId);
  if (!ownerId) throw new Error("Workspace not found");

  const usage = await getPromptUsage(ownerId);
  if (usage.used >= usage.limit) return { limit: "prompts" };

  const canvas = notes.map((note) => `- ${note.text}`).join("\n");
  let text: string;
  try {
    const result = await generateText({
      model: google("gemini-3.5-flash"),
      system: [
        "You plan products inside a workspace that has one document and a canvas of short notes.",
        'Reply with JSON only: {"reply":"one or two sentences","document":"full markdown","notes":[{"text":"short label"}]}',
        "document is the full document after the request. Use an empty string to leave the document unchanged.",
        "notes replaces the canvas. Use an empty array to leave it unchanged. At most 6 notes.",
      ].join(" "),
      prompt: `Document:\n${document.slice(0, 12000) || "(empty)"}\n\nCanvas:\n${canvas || "(empty)"}\n\nRequest:\n${trimmed.slice(0, 8000)}`,
    });
    text = result.text;
  } catch (error) {
    console.error(error);
    throw new Error("The agent couldn't draft that. Try again.");
  }

  await recordPrompt(ownerId, user.id, workspaceId);
  return parseAgentReply(text);
}

function parseAgentReply(text: string): AgentDraft {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return { reply: text.trim() || "Done.", document: "", notes: [] };

  try {
    const value = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown;
      document?: unknown;
      notes?: unknown;
    };
    const notes = Array.isArray(value.notes)
      ? value.notes
          .flatMap((note) => {
            if (!note || typeof note !== "object" || !("text" in note) || typeof note.text !== "string") return [];
            const label = note.text.trim();
            return label ? [{ text: label.slice(0, 140) }] : [];
          })
          .slice(0, 6)
      : [];
    return {
      reply: typeof value.reply === "string" && value.reply.trim() ? value.reply.trim() : "Draft updated.",
      document: typeof value.document === "string" ? value.document : "",
      notes,
    };
  } catch {
    return { reply: text.trim() || "Done.", document: "", notes: [] };
  }
}
