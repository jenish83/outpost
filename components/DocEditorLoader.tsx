"use client";

import dynamic from "next/dynamic";

// BlockNote touches the DOM on create, so both stay client-only.
export const DocEditor = dynamic(
  () => import("@/components/DocEditor").then((mod) => mod.DocEditor),
  { ssr: false },
);

export const DocViewer = dynamic(
  () => import("@/components/DocViewer").then((mod) => mod.DocViewer),
  { ssr: false },
);
