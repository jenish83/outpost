import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { Button } from "@/components/ui/button";
import { DocEditor } from "@/components/DocEditorLoader";
import { CanvasEditor } from "./_components/CanvasEditor";
import { getEntitlements, workspaceOwnerId } from "@/lib/billing";
import { PlanButton } from "@/components/PlanButton";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { canvasSnapshot, docBlocks, yjsStateToBase64 } from "@/lib/workspace-document";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceEditorsProvider } from "@/components/WorkspaceEditorContext";
import { EditableWorkspaceName } from "./_components/EditableWorkspaceName";
import { ShareDialog } from "./_components/ShareDialog";
import { AgentToggleButton } from "./_components/AgentToggleButton";

type ViewMode = "doc" | "canvas" | "both";

function parseViewMode(value: string | string[] | undefined): ViewMode {
  return value === "doc" || value === "canvas" ? value : "both";
}

export default function WorkspacePage(props: PageProps<"/workspace/[id]">) {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceContent {...props} />
    </Suspense>
  );
}

function WorkspaceFallback() {
  return (
    <div className="flex h-dvh flex-col" aria-busy="true" aria-label="Loading workspace">
      <div className="h-14 shrink-0 border-b border-white/6" />
      <div className="flex-1 animate-pulse bg-white/3" />
    </div>
  );
}

async function WorkspaceContent({ params, searchParams }: PageProps<"/workspace/[id]">) {
  // The database client calls crypto.randomUUID() while running a query. That has to happen
  // at request time, after the static shell is ready.
  await connection();
  const { id } = await params;
  const { view: viewParam, prompt } = await searchParams;
  const view = parseViewMode(viewParam);

  // 404 rather than 403 so outsiders can't tell whether a workspace id exists.
  if (!(await canAccessWorkspace(id))) notFound();

  const workspace = await db.orm.public.Workspace.where({ id })
    .select("name", "shareToken", "clerkOrgId")
    .include("creator", (creator) => creator.select("clerkId"))
    .include("doc", (doc) => doc.select("content", "yjsState"))
    .include("canvas", (canvas) => canvas.select("content"))
    .first();
  if (!workspace) notFound();
  const creator = workspace.creator;
  if (!creator) notFound();

  const entitlements = await getEntitlements(workspaceOwnerId({ clerkOrgId: workspace.clerkOrgId, creator }));
  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";

  return (
    // Lets header UI (agent panel, Share dialog) reach the live doc and canvas editors.
    <WorkspaceEditorsProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        {/* Logo (back to dashboard) and name left, view switcher centered, actions right. */}
        <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/mascot-dark.png"
                alt="Back to dashboard"
                width={24}
                height={24}
                className="size-6"
              />
            </Link>
            <EditableWorkspaceName workspaceId={id} initialName={workspace.name} />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
            {(["doc", "both", "canvas"] as const).map((mode) => (
              <Button
                key={mode}
                asChild
                variant={view === mode ? "secondary" : "ghost"}
                size="sm"
                className="capitalize"
              >
                <Link href={mode === "both" ? `/workspace/${id}` : `/workspace/${id}?view=${mode}`}>
                  {mode === "doc" ? "Document" : mode}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <PlanButton upgradeOnlyWhenOut />
            <ShareDialog
              workspaceId={id}
              workspaceName={workspace.name}
              initialShareToken={workspace.shareToken}
              canShare={entitlements.publicSharing}
              canExportPdf={entitlements.pdfExport}
            />
            <AgentToggleButton workspaceId={id} initialPrompt={typeof prompt === "string" ? prompt : undefined} />
          </div>
        </header>

        {/* key gives each view a fresh panel group, so an old layout isn't applied to new panels.
            Sizes are percentages: this library treats bare numbers as pixels. */}
        <ResizablePanelGroup key={view} orientation="horizontal" className="min-h-0 flex-1">
          {showDoc && (
            <ResizablePanel defaultSize={showCanvas ? "38" : "100"} minSize="20" className="relative min-w-0">
              <div className="absolute inset-0 overflow-hidden">
                <DocEditor
                  workspaceId={id}
                  initialContent={docBlocks(workspace.doc?.content) as Block[] | null}
                  initialState={yjsStateToBase64(workspace.doc?.yjsState ?? null)}
                />
              </div>
            </ResizablePanel>
          )}
          {showDoc && showCanvas && <ResizableHandle withHandle />}
          {showCanvas && (
            <ResizablePanel defaultSize={showDoc ? "62" : "100"} minSize="20" className="relative min-w-0">
              <div className="absolute inset-0 overflow-hidden">
                <CanvasEditor
                  workspaceId={id}
                  initialSnapshot={canvasSnapshot(workspace.canvas?.content) as TLEditorSnapshot | null}
                />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </WorkspaceEditorsProvider>
  );
}
