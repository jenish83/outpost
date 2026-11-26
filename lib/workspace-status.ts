import { formatDistanceToNow, max } from "date-fns";
import type { Models } from "@/src/prisma/contract.d";

export type WorkspaceStatus = Models.public_Workspace["status"];

// Board columns, in order. Shared by the kanban board and the recent workspace cards.
export const WORKSPACE_STATUSES: { status: WorkspaceStatus; title: string }[] = [
  { status: "PLANNING", title: "Planning" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "IN_REVIEW", title: "In review" },
  { status: "DONE", title: "Done" },
];

export function statusTitle(status: WorkspaceStatus) {
  return WORKSPACE_STATUSES.find((column) => column.status === status)?.title ?? status;
}

export function formatLastActivity(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

type Dated = { updatedAt: Date } | null;

type ActivitySource = {
  updatedAt: Date;
  doc: Dated;
  canvas: Dated;
  creator: { name: string | null; imageUrl: string | null } | null;
};

// A workspace's own updatedAt only changes on rename or move, so real activity also counts
// edits to its doc and canvas.
export function withLastActivity<T extends ActivitySource>(workspace: T) {
  const lastActivity = max([
    workspace.updatedAt,
    workspace.doc?.updatedAt ?? new Date(0),
    workspace.canvas?.updatedAt ?? new Date(0),
  ]);
  return {
    ...workspace,
    creator: workspace.creator ?? { name: null, imageUrl: null },
    lastActivity,
  };
}
