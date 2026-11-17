import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { FREE_MONTHLY_PROMPTS } from "@/lib/plan-limits";

// Paid prompt allowances come from Clerk plan features (checked in order), per member for team plans.
const PROMPT_FEATURES = [
  { feature: "agents_prompts_2000", perMember: 2000 },
  { feature: "agents_prompt_500", perMember: 500 },
];

// Everything is scoped to an "owner": a Clerk org id for org workspaces, or a Clerk user id for
// personal ones. Clerk prefixes its ids, so they can't collide.
export const workspaceOwnerSelect = { clerkOrgId: true, creator: { select: { clerkId: true } } } as const;

export function workspaceOwnerId(workspace: { clerkOrgId: string | null; creator: { clerkId: string } }) {
  return workspace.clerkOrgId ?? workspace.creator.clerkId;
}

export async function getWorkspaceOwnerId(workspaceId: string) {
  const workspace = await db.orm.public.Workspace.where({ id: workspaceId }).include("creator").first();
  if (!workspace) {
    return null;
  }
  return workspaceOwnerId(workspace);
}

// The owner's plan features, looked up from Clerk on the server. This works for any owner, not
// just the org selected in the viewer's switcher, and even for signed-out viewers (shared links).
export async function getEntitlements(ownerId: string) {
  const clerk = await clerkClient();
  const isOrg = ownerId.startsWith("org_");
  const features = new Set<string>();

  try {
    const subscription = isOrg
      ? await clerk.billing.getOrganizationBillingSubscription(ownerId)
      : await clerk.billing.getUserBillingSubscription(ownerId);
    for (const item of subscription.subscriptionItems) {
      // past_due keeps access while Clerk retries the payment.
      if (item.status === "active" || item.status === "past_due") {
        item.plan?.features.forEach((feature) => features.add(feature.slug));
      }
    }
  } catch {
    // No subscription (or Clerk unreachable): treat as the free plan.
  }

  const paid = PROMPT_FEATURES.find(({ feature }) => features.has(feature));
  let promptLimit = FREE_MONTHLY_PROMPTS;
  if (paid) {
    const members = isOrg
      ? ((await clerk.organizations.getOrganization({ organizationId: ownerId, includeMembersCount: true }))
          .membersCount ?? 1)
      : 1;
    promptLimit = paid.perMember * members;
  }

  return {
    isPaid: !!paid,
    promptLimit,
    unlimitedWorkspaces: features.has("unlimited_workspaces"),
    publicSharing: features.has("public_share_links"),
    pdfExport: features.has("pdf_export"),
  };
}

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// This month's prompts against the owner's allowance.
export async function getPromptUsage(ownerId: string) {
  const monthStart = startOfMonthUtc();
  const [{ promptLimit, isPaid }, usage] = await Promise.all([
    getEntitlements(ownerId),
    db.orm.public.AgentPrompt.where((prompt) => prompt.ownerId.eq(ownerId))
      .where((prompt) => prompt.createdAt.gte(monthStart))
      .aggregate((agg) => ({ used: agg.count() })),
  ]);
  return { used: usage.used, limit: promptLimit, isPaid };
}

export async function recordPrompt(ownerId: string, userId: string, workspaceId: string) {
  await db.orm.public.AgentPrompt.create({ ownerId, userId, workspaceId });
}