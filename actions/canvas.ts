"use server";

import { db } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export async function saveCanvasContent(workspaceId: string, content: string){
    if(!(await canAccessWorkspace(workspaceId))) {
        throw new Error("You are not authorized to access this workspace");
    }

    const snapshot = JSON.parse(content) as JsonValue;
    const updated = await db.orm.public.Canvas.where({ workspaceId }).update({
        content: snapshot,
    });
    if (!updated) throw new Error("Canvas not found");
}