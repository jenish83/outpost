"use server";

import { auth } from "@clerk/nextjs/server";
import { getPromptUsage } from "@/lib/billing";

// Prompts for the account currently selected in the header: the org, or the signed-in user.
export async function getActivePromptUsage() {
  const { userId, orgId } = await auth();
  const ownerId = orgId ?? userId;
  if (!ownerId) return null;
  return getPromptUsage(ownerId);
}
