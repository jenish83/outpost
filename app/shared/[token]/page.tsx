import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Block } from "@blocknote/core";
import { DocViewer } from "@/components/DocViewer";
import { db } from "@/lib/prisma";
import { canvasNotes, docBlocks, docText } from "@/lib/workspace-document";

export default function SharedWorkspacePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading shared workspace…</div>}>
      <SharedWorkspace params={params} />
    </Suspense>
  );
}

async function SharedWorkspace({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const workspace = await db.orm.public.Workspace.where({ shareToken: token })
    .select("name")
    .include("doc", (doc) => doc.select("content"))
    .include("canvas", (canvas) => canvas.select("content"))
    .first();
  if (!workspace) notFound();

  const notes = canvasNotes(workspace.canvas?.content);
  const blocks = docBlocks(workspace.doc?.content) as Block[] | null;
  const text = docText(workspace.doc?.content);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">Shared workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">{workspace.name}</h1>
      <article className="mt-8">
        {blocks ? (
          <DocViewer content={blocks} />
        ) : (
          <p className="text-sm leading-7 whitespace-pre-wrap">
            {text || <span className="text-muted-foreground">This document is empty.</span>}
          </p>
        )}
      </article>
      {notes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium">Canvas</h2>
          <ul className="mt-3 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                {note.text || "Empty note"}
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link href="/" className="mt-12 text-sm text-muted-foreground hover:text-foreground">
        Outpost
      </Link>
    </main>
  );
}
