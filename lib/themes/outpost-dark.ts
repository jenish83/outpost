import type { Theme } from "@blocknote/mantine";

export const outpostDarkTheme: Theme = {
  colors: {
    editor: { text: "#f4f4f5", background: "#09090b" },
    menu: { text: "#f4f4f5", background: "#18181b" },
    tooltip: { text: "#f4f4f5", background: "#27272a" },
    hovered: { text: "#f4f4f5", background: "#27272a" },
    selected: { text: "#f4f4f5", background: "#3f3f46" },
    disabled: { text: "#a1a1aa", background: "#18181b" },
    shadow: "#000000",
    border: "#3f3f46",
    sideMenu: "#a1a1aa",
  },
  borderRadius: 8,
  fontFamily: "var(--font-geist-sans), sans-serif",
};
