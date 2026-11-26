import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Block } from "@blocknote/core";
import type { TLEditorSnapshot } from "tldraw";
import { db } from "@/lib/prisma";
import { getEntitlements, workspaceOwnerId } from "@/lib/billing";
import { canvasSnapshot, docBlocks } from "@/lib/workspace-document";
import { DocViewer } from "@/components/DocEditorLoader";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasViewer } from "./_components/CanvasViewer";

// Shared links are meant for people you send them to, not search engines.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SharedWorkspacePage(props: PageProps<"/shared/[token]">) {
  return (
    <Suspense fallback={<SharedFallback />}>
      <SharedWorkspace {...props} />
    </Suspense>
  );
}

function SharedFallback() {
  return (
    <div className="flex h-dvh flex-col" aria-busy="true" aria-label="Loading shared workspace">
      <div className="h-14 shrink-0 border-b border-white/6" />
      <div className="flex-1 animate-pulse bg-white/3" />
    </div>
  );
}

async function SharedWorkspace({ params }: PageProps<"/shared/[token]">) {
  // The database client calls crypto.randomUUID() while running a query. That has to happen
  // at request time, after the static shell is ready.
  await connection();
  const { token } = await params;

  const workspace = await db.orm.public.Workspace.where({ shareToken: token })
    .select("name", "clerkOrgId")
    .include("creator", (creator) => creator.select("clerkId"))
    .include("doc", (doc) => doc.select("content"))
    .include("canvas", (canvas) => canvas.select("content"))
    .first();
  if (!workspace) notFound();

  const creator = workspace.creator;
  if (!creator) notFound();

  // Downgrade removes publicSharing — old links should stop working even if the token remains.
  const entitlements = await getEntitlements(
    workspaceOwnerId({ clerkOrgId: workspace.clerkOrgId, creator }),
  );
  if (!entitlements.publicSharing) notFound();

  // Saved Postgres copies only — never the live collab rooms.
  const blocks = docBlocks(workspace.doc?.content) as Block[] | null;
  const snapshot = canvasSnapshot(workspace.canvas?.content) as TLEditorSnapshot | null;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/6 bg-background px-4">
        <Link
          href="/"
          className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/mascot-dark.png"
            alt="Outpost home"
            width={24}
            height={24}
            className="size-6"
          />
        </Link>
        <h1 className="min-w-0 truncate text-sm font-medium">{workspace.name}</h1>
        <Badge variant="secondary">View only</Badge>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="38" minSize="20" className="relative min-w-0">
          <div className="absolute inset-0 overflow-hidden">
            <DocViewer content={blocks} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="62" minSize="20" className="relative min-w-0">
          <div className="absolute inset-0 overflow-hidden">
            <CanvasViewer snapshot={snapshot} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
