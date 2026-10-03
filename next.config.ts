import type { NextConfig } from "next";
import { CHRISTIANITY_ESSAY_PATH, EXCERPT_FRAME_ORIGIN } from "./src/lib/site/excerpt-video";

// Clean, fast portfolio. CSP is strict in production (the site loads only its own
// assets — system fonts, no webfonts). In dev we relax it: Next's HMR needs
// 'unsafe-eval', and upgrade-insecure-requests would force the http://localhost
// chunks to https and break hydration.
//
// CSP with nonce is generated per-request in middleware.ts (x-nonce). This
// buildCsp() is the fallback for requests that bypass middleware (static assets,
// health checks). When middleware runs it overwrites Content-Security-Policy
// with a nonce-based value that removes 'unsafe-inline'.
function buildCsp(isProd: boolean, allowExcerptVideo = false): string {
  return [
    "default-src 'self'",
    // 'wasm-unsafe-eval' lets the self-hosted onnxruntime WASM (semantic
    // search, /ort/) compile; it does not permit JS eval.
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    // Every artwork the site shows is a public-domain file on this disk
    // (scripts/site/vendor-museum-art.mjs), so no museum host needs allowing —
    // and a visitor reading about the church never calls a museum.
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://tiles.mapterhorn.com https://tiles.openfreemap.org${isProd ? "" : " ws: wss:"}`,
    "worker-src 'self' blob:",
    "child-src blob:",
    // The essay adds only YouTube's privacy-enhanced player origin. Other
    // routes continue to allow only the two live Lab demos.
    "frame-src https://eye-code-visualizer.vercel.app https://www.atxbro.com" + (allowExcerptVideo ? ` ${EXCERPT_FRAME_ORIGIN}` : ""),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Keep browser sessions and assessment origin checks on one public host.
  // Next preserves the incoming query string as well as the captured path.
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host" as const, value: "www.garovartabedian.com" }],
      destination: "https://garovartabedian.com/:path*",
      permanent: true,
    }];
  },
  // InlineMediaPlate requests quality 70; Next 16 makes declaring non-default
  // qualities mandatory. No remotePatterns: nothing on the site loads an image
  // from anywhere but here. 85 exists for the home frontispiece only: its
  // source is 1536x1024, so a wide retina viewport already upscales it, and
  // a second-generation q70 re-encode on top of that is what made it mush.
  // 85 recovers ~4 dB PSNR against the source for ~95 KB; past it the curve
  // charges more per dB than an upscale-limited plate can show.
  images: {
    qualities: [70, 85],
  },
  // Pin file-tracing to this project (a stray lockfile in $HOME otherwise
  // confuses Next's workspace-root inference).
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/find/*": ["./public/scriptures/canons.json", "./public/scriptures/text/{web,kjv,drb,brenton}/*.json", "./public/early/texts/*.json"],
    "/early/library/*": ["./content/early-library/catalog.json", "./content/early-library/readings/**/*.json"],
    "/early/search": ["./content/early-library/catalog.json", "./content/early-library/readings/**/*.json", "./public/early/texts/*.json"],
    "/api/library-search": ["./content/early-library/catalog.json", "./content/early-library/readings/**/*.json", "./public/early/texts/*.json"],
  },
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/onnxruntime-node/**",
      "./node_modules/@img/sharp-libvips*/**",
      "./node_modules/@huggingface/transformers/**",
      "./public/early/sections/**/*.jpg",
      "./public/early/plates/**",
      "./public/early/md/**",
      "./public/art/**",
      "./public/models/**",
      "./public/ort/**",
      "./public/scriptures/audio/**",
      "./public/scriptures/search/**",
      "./public/scriptures/semantic/**",
      "./public/early/semantic/**",
      "./public/semantic-corpora/**",
      "./public/social/**",
      "./public/angels/**",
      "./public/apostles/**",
      "./public/church/**",
      "./public/jesus/**",
      "node_modules/onnxruntime-node/**",
      "node_modules/@img/sharp-libvips*/**",
      "node_modules/@huggingface/transformers/**",
      "public/early/sections/**/*.jpg",
      "public/early/plates/**",
      "public/early/md/**",
      "public/early/semantic/**",
      "public/semantic-corpora/**",
      "public/art/**",
      "public/models/**",
      "public/ort/**",
      "public/scriptures/audio/**",
      "public/scriptures/search/**",
      "public/scriptures/semantic/**",
      "public/social/**",
      "public/angels/**",
      "public/apostles/**",
      "public/church/**",
      "public/jesus/**",
    ],
  },
  async rewrites() {
    // Version-segmented URLs for the in-browser AI runtime, rewritten to the
    // on-disk files. The version segment is what makes the one-year immutable
    // Cache-Control safe: bumping SEMANTIC_ASSETS_VERSION (semantic-model.ts)
    // invalidates every browser and CDN cache atomically on model/WASM
    // upgrades, without moving 46 MB of binaries in git. Files are checked
    // before rewrites, so only the /v1/ URLs fall through to these rules.
    return [
      ...(process.env.NODE_ENV === "development" && /^\d{4,5}$/.test(process.env.JEV_RESEARCH_BRIDGE_PORT ?? "") && /^\d{4,5}$/.test(process.env.JEV_RESEARCH_SITE_PORT ?? "") ? [
        {
          source: "/api/research/:path*",
          // Validate the incoming Host before the proxy replaces it with the bridge Host.
          has: [{ type: "header" as const, key: "host", value: `(?:127\\.0\\.0\\.1|localhost):${process.env.JEV_RESEARCH_SITE_PORT}` }],
          destination: `http://127.0.0.1:${process.env.JEV_RESEARCH_BRIDGE_PORT}/:path*`,
        },
      ] : []),
      { source: "/models/v1/:path+", destination: "/models/:path+" },
      { source: "/ort/v1/:path+", destination: "/ort/:path+" },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    // Version-segmented AI runtime assets (model + onnxruntime WASM): the URL
    // changes whenever the content does, so they cache immutable for a year.
    // Cross-Origin-Resource-Policy: same-site allows credentialless embedder
    // to fetch them without CORP blocking.
    const immutableAssetCache = ["/models/v1", "/ort/v1"].map((dir) => ({
      source: `${dir}/:path+`,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        {
          key: "Cross-Origin-Resource-Policy",
          value: "same-site",
        },
      ],
    }));
    // Unversioned copies stay reachable for one day (belt and braces for any
    // URL baked into an older deploy's HTML still in flight).
    const versionedParentCache = ["/models", "/ort"].map((dir) => ({
      source: `${dir}/:path+`,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400",
        },
        {
          key: "Cross-Origin-Resource-Policy",
          value: "same-site",
        },
      ],
    }));
    // Client-fetched scripture data (guides, cross-references, original
    // language, narration audio, Jesus words data, reader text shards):
    // rebuilds change content, so a day of freshness with a week of
    // stale-while-revalidate keeps in-session navigation instant without
    // serving stale study panels after a deploy. :path+ (not :path*) so the
    // directory root — the /scriptures/search page HTML — is never cached.
    const dataCache = [
      "/scriptures/search",
      "/scriptures/semantic",
      "/scriptures/guides",
      "/scriptures/xref",
      "/scriptures/original",
      "/scriptures/audio",
      "/scriptures/text",
      "/scriptures/neighbors",
      "/scriptures/nave",
      "/early/semantic",
    ].map((dir) => ({
      source: `${dir}/:path+`,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    }));
    // Later rules override earlier ones for the same path, so the order
    // below is load-bearing: the broad parent rules first, the versioned
    // immutable rules last so /models/v1/… wins over /models/….
    return [
      ...versionedParentCache,
      ...dataCache,
      ...immutableAssetCache,
      {
        source: "/semantic-corpora/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/semantic-corpora/objects/:path+",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp(isProd) },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Enable crossOriginIsolated for threaded WASM (SharedArrayBuffer).
          // credentialless keeps allowed frame-src embeds (eye/atxbro) working,
          // whereas require-corp would block them without CORP headers on those origins.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        source: CHRISTIANITY_ESSAY_PATH,
        headers: [
          { key: "Content-Security-Policy", value: buildCsp(isProd, true) },
          // The external player does not participate in cross-origin isolation.
          // Keep this exception on the article, away from the WASM readers.
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
        ],
      },
    ];
  },
};

export default nextConfig;
