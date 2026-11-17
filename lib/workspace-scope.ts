import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// The active org's workspaces, or the user's personal ones when no org is selected.
// creatorId is User.id. Clerk ids are stored on User.clerkId and do not match this column.
export function scopeWhere(orgId: string | null | undefined, creatorId: string) {
  return orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId };
}

// What the dashboard and the board list, plus the name to show above it.
// userId is the Clerk user id from auth().
export async function getWorkspaceScope(userId: string) {
  const { orgId } = await auth();
  const orgName = orgId
    ? (await (await clerkClient()).organizations.getOrganization({ organizationId: orgId })).name
    : "Personal";
  const user = await db.orm.public.User.where({ clerkId: userId }).first();
  return { orgName, where: scopeWhere(orgId, user?.id ?? "") };
}
