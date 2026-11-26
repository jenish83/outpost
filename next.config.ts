import type { NextConfig } from "next";

// Turbopack doesn't resolve pdfkit's `standard-fonts/*` export map, so the
// doc-export chunk fails to compile and the browser reports "Failed to fetch".
// Aliases must be relative posix paths: absolute Windows paths are rejected.
const PDFKIT_FONTS = [
  "Courier",
  "CourierBold",
  "CourierBoldOblique",
  "CourierOblique",
  "Helvetica",
  "HelveticaBold",
  "HelveticaBoldOblique",
  "HelveticaOblique",
  "Symbol",
  "TimesBold",
  "TimesBoldItalic",
  "TimesItalic",
  "TimesRoman",
  "ZapfDingbats",
] as const;

const pdfkitFontAliases = Object.fromEntries(
  PDFKIT_FONTS.map((name) => [
    `pdfkit/standard-fonts/${name}`,
    `./node_modules/pdfkit/js/standard-fonts/${name}.mjs`,
  ])
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: pdfkitFontAliases,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
