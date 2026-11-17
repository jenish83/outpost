export const landing = {
  hero: {
    eyebrow: "Early access",
    headline: {
      before: "An",
      accent: "outpost",
      after: "for whatever you're building",
    },
    subtitle: "An AI agent that draws and writes alongside you and your team.",
    primaryCta: { label: "Start building free", href: "/sign-up" },
    secondaryCta: { label: "See how it works", href: "#how-it-works" },
    video: {
      webm: "/videos/hero.webm",
      mp4: "/videos/hero.mp4",
      poster: "/videos/hero-poster.jpg",
      label: "Outpost workspace preview",
    },
  },
  audience: {
    label: "Who it's for",
    groups: ["Product teams", "Founders", "Solo builders", "Agencies", "Consultants"],
  },
  features: {
    id: "product",
    heading: "One agent, one workspace, your whole team",
    surfaces: [
      {
        id: "canvas",
        title: "Canvas",
        description:
          "An infinite whiteboard where the agent draws flowcharts, ERDs, architecture diagrams, and org charts shape by shape, and edits them in place when you ask.",
        bullets: [
          "Flowcharts, ERDs, architecture diagrams, and org charts",
          "Drawn shape by shape on an infinite whiteboard",
          "Edited in place when you ask",
        ],
        mock: "flowchart",
      },
      {
        id: "docs",
        title: "Docs",
        description:
          "A block editor where the agent turns a diagram into a written spec, and rewrites or summarizes sections on command.",
        bullets: [
          "Turns a diagram into a written spec",
          "Rewrites a section on command",
          "Summarizes a section on command",
        ],
        mock: "doc",
      },
      {
        id: "board",
        title: "Team board",
        description:
          "A kanban board of every workspace in your org, with live cursors so teammates can jump in together.",
        bullets: [
          "Every workspace in your org, on one board",
          "Live cursors show who is in the room",
          "Teammates can jump in together",
        ],
        mock: "kanban",
      },
    ],
  },
  howItWorks: {
    id: "how-it-works",
    heading: "How it works",
    steps: [
      {
        title: "Describe It",
        description: "Tell the agent what you're building, from a product idea to the system behind it.",
      },
      {
        title: "Watch the Agent Draw",
        description: "It draws the diagram shape by shape, then turns it into a written spec.",
      },
      {
        title: "Keep Iterating Together",
        description: "Ask for changes, and stay in the same workspace with your team.",
      },
    ],
  },
  pricing: {
    id: "pricing",
    eyebrow: "Pricing",
    heading: "Start free, upgrade when it clicks",
    note: "Upgrade just yourself or your whole team. Billed per member.",
  },
  closing: {
    heading: "Start from a blank canvas",
    subtitle: "Describe what you're building. The agent draws the map and writes the spec with you.",
    cta: { label: "Start building free", href: "/sign-up" },
    mascot: { src: "/brand/mascot-dark.png", alt: "Outpost mascot" },
  },
  footer: "Made with 💗 by JenishPanchasara",
} as const;
