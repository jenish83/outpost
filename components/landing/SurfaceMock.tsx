import type { ReactNode } from "react";
import type { landing } from "@/app/_data/landing";

type MockKind = (typeof landing.features.surfaces)[number]["mock"];

function MockFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span aria-hidden className="size-1.5 rotate-45 bg-primary" />
        <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function FlowNode({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <div
      className={`flex w-28 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        accent ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-background text-foreground"
      }`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
      {label}
    </div>
  );
}

function FlowchartMock() {
  return (
    <MockFrame label="Canvas">
      <div className="bg-[radial-gradient(circle,oklch(1_0_0/0.14)_1px,transparent_1px)] [background-size:16px_16px] px-4 py-8">
        <div className="mx-auto grid w-fit grid-cols-[7rem_3.5rem_7rem] grid-rows-[auto_2rem_auto_2rem_auto] items-center justify-items-center">
          <div className="col-start-2">
            <FlowNode label="Browser" />
          </div>
          <div className="col-start-2 row-start-2 h-full w-px bg-primary/80" />
          <div className="col-start-1 row-start-3">
            <FlowNode label="Next.js" />
          </div>
          <div className="relative col-start-2 row-start-3 flex h-full w-full items-center self-stretch">
            <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-primary/80" />
            <div className="relative h-px flex-1 bg-primary/80" />
            <span aria-hidden className="relative size-1.5 shrink-0 rotate-45 bg-primary" />
            <div className="relative h-px flex-1 bg-primary/80" />
          </div>
          <div className="col-start-3 row-start-3">
            <FlowNode label="Agent" accent />
          </div>
          <div className="col-start-2 row-start-4 h-full w-px bg-primary/80" />
          <div className="col-start-2 row-start-5">
            <FlowNode label="Prisma" />
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function DocMock() {
  return (
    <MockFrame label="Doc">
      <div className="space-y-4 px-5 py-5">
        <div>
          <p className="text-sm font-medium text-foreground">Launch spec</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The diagram and the write-up stay in one place, so the spec follows the board.
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-foreground/10" />
          <div className="h-1.5 w-11/12 rounded-full bg-foreground/10" />
          <div className="h-1.5 w-3/4 rounded-full bg-foreground/10" />
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-3">
          <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">Rewritten</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground">
            Auth covers sign-in, orgs, and a personal account for solo use.
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-foreground/10" />
          <div className="h-1.5 w-2/3 rounded-full bg-foreground/10" />
        </div>
      </div>
    </MockFrame>
  );
}

const boardColumns = [
  {
    name: "Backlog",
    cards: ["Onboarding", "Pricing page"],
  },
  {
    name: "In progress",
    cards: ["Auth flow", "Billing spec"],
    cursor: { name: "Alex", className: "bg-primary text-primary-foreground" },
  },
  {
    name: "Review",
    cards: ["Launch plan"],
    cursor: { name: "Sam", className: "bg-foreground text-background" },
  },
] as const;

function KanbanMock() {
  return (
    <MockFrame label="Team board">
      <div className="grid grid-cols-3 gap-2 px-3 py-3">
        {boardColumns.map((column) => (
          <div key={column.name} className="rounded-lg bg-background/60 p-2">
            <p className="px-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {column.name}
            </p>
            <div className="mt-2 space-y-2">
              {column.cards.map((card) => {
                const showCursor = "cursor" in column && card === column.cards[0];
                return (
                  <div
                    key={card}
                    className={`relative rounded-md border border-border bg-card px-2 py-2 text-xs leading-snug text-foreground ${
                      showCursor ? "mt-3" : ""
                    }`}
                  >
                    {card}
                    {showCursor && "cursor" in column && (
                      <span
                        className={`absolute -top-2.5 right-1 z-10 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${column.cursor.className}`}
                      >
                        <span className="size-1 rounded-full bg-current" />
                        {column.cursor.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

export function SurfaceMock({ kind }: { kind: MockKind }) {
  if (kind === "flowchart") return <FlowchartMock />;
  if (kind === "doc") return <DocMock />;
  return <KanbanMock />;
}
