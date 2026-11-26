"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { fromBase64, toBase64 } from "@/lib/base64";

// Broadcasts Yjs updates for one workspace. If Supabase isn't configured, the editor still opens
// from the saved state and just doesn't sync to other people.
export class SupabaseYjsProvider {
  readonly awareness: Awareness;
  private channel: RealtimeChannel | null = null;
  private onUpdate: ((update: Uint8Array, origin: unknown) => void) | null = null;
  private ready = false;
  private pending: Uint8Array[] = [];

  constructor(doc: Y.Doc, workspaceId: string, onReady: () => void) {
    this.awareness = new Awareness(doc);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      queueMicrotask(onReady);
      return;
    }

    // Broadcast-only client. A user session isn't needed, and starting one makes
    // GoTrue refresh a token (a fetch that rejects with "Failed to fetch").
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    this.onUpdate = (update, origin) => {
      if (origin === this) return;
      // Sending before the socket is open makes supabase fall back to a REST
      // request, which rejects with "Failed to fetch" when it can't connect.
      if (!this.ready) {
        this.pending.push(update);
        return;
      }
      this.publish(update);
    };
    doc.on("update", this.onUpdate);

    this.channel = supabase
      .channel(`doc:${workspaceId}`)
      .on("broadcast", { event: "yjs" }, ({ payload }) => {
        const update = payload && typeof payload === "object" && "update" in payload ? payload.update : null;
        if (typeof update !== "string") return;
        Y.applyUpdate(doc, fromBase64(update), this);
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        this.ready = true;
        const queued = this.pending.splice(0);
        for (const update of queued) this.publish(update);
        onReady();
      });
  }

  private publish(update: Uint8Array) {
    void this.channel
      ?.send({
        type: "broadcast",
        event: "yjs",
        payload: { update: toBase64(update) },
      })
      .catch(() => {
        // A dropped socket shouldn't surface as an unhandled rejection.
      });
  }

  destroy() {
    this.ready = false;
    this.pending = [];
    this.awareness.destroy();
    void this.channel?.unsubscribe();
  }
}
