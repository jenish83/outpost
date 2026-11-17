import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { KanbanSquare, Plus } from "lucide-react";
import { checkUser } from "@/actions/check-user";
import { db } from "@/lib/prisma";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { withLastActivity } from "@/lib/workspace-status";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { RecentWorkspaces } from "./_components/RecentWorkspaces";
import { DashboardPrompt } from "./_components/DashboardPrompt";

const RECENT_COUNT = 4;

export default function DashboardPage() {
  return (
    <div className="p-8">
      <DashboardPrompt />
      <Suspense fallback={<RecentWorkspacesFallback />}>
        <RecentWorkspaceSection />
      </Suspense>
    </div>
  );
}

function RecentWorkspacesFallback() {
  return (
    <section className="mx-auto max-w-6xl" aria-busy="true" aria-label="Loading recent workspaces">
      <div className="mb-4">
        <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-6 w-44 animate-pulse rounded bg-white/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: RECENT_COUNT }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </section>
  );
}

async function RecentWorkspaceSection() {
  const user = await checkUser();
  if (!user) redirect("/sign-in");

  const { orgName, where } = await getWorkspaceScope(user.clerkId);
  const workspaces = await db.orm.public.Workspace.where(where)
    .select("id", "name", "description", "status", "updatedAt")
    .include("creator", (creator) => creator.select("name", "imageUrl"))
    .include("doc", (doc) => doc.select("updatedAt"))
    .include("canvas", (canvas) => canvas.select("updatedAt"))
    .all();
  const recent = workspaces
    .map(withLastActivity)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, RECENT_COUNT);

  return (
    <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{orgName}</p>
            <h2 className="text-lg font-semibold">Recent workspaces</h2>
          </div>
          <div className="flex items-center gap-2">
            {workspaces.length > 0 && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <Link href="/workspaces">
                  <KanbanSquare className="size-4" />
                  View board ({workspaces.length})
                </Link>
              </Button>
            )}
            <WorkspaceDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  New workspace
                </Button>
              }
            />
          </div>
        </div>

        {workspaces.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
            No workspaces yet. Describe what you want to plan above to start
            one.
          </p>
        ) : (
          <RecentWorkspaces workspaces={recent} />
        )}
      </section>
  );
}