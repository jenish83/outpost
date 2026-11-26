"use server";

import { db } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export async function saveDocContent(workspaceId: string, content: string, yjsState: string){
    if(!(await canAccessWorkspace(workspaceId))) {
        throw new Error("You are not authorized to access this workspace");
    }

    const snapshot = JSON.parse(content) as JsonValue;
    // A fresh Uint8Array, not a Buffer: the bytea column reads the bytes back as a Uint8Array.
    const yjsBytes = Uint8Array.from(Buffer.from(yjsState, "base64"));
    const updated = await db.orm.public.Doc.where({ workspaceId }).update({
        content: snapshot,
        yjsState: yjsBytes,
    });
    if (!updated) throw new Error("Doc not found");
}