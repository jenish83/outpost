import type { Models } from "@/src/prisma/contract.d";

export type WorkspaceStatus = Models.public_Workspace["status"];

const STATUS_TITLES: Record<WorkspaceStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export function statusTitle(status: WorkspaceStatus) {
  return STATUS_TITLES[status];
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

export function formatLastActivity(date: Date, now = Date.now()) {
  const deltaSeconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(deltaSeconds);
  const match = RELATIVE_UNITS.find((unit) => abs >= unit.seconds) ?? RELATIVE_UNITS.at(-1)!;
  const value = Math.round(deltaSeconds / match.seconds);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, match.unit);
}

type ActivitySource = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  updatedAt: Date;
  creator: { name: string | null; imageUrl: string | null } | null;
  doc: { updatedAt: Date } | null;
  canvas: { updatedAt: Date } | null;
};

// Last edit across the workspace, its doc, and its canvas — the card footer sorts on this.
export function withLastActivity(workspace: ActivitySource) {
  const lastActivity = [workspace.updatedAt, workspace.doc?.updatedAt, workspace.canvas?.updatedAt].reduce<Date>(
    (latest, stamp) => (stamp && stamp > latest ? stamp : latest),
    workspace.updatedAt,
  );
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    status: workspace.status,
    lastActivity,
    creator: workspace.creator ?? { name: null, imageUrl: null },
  };
}
