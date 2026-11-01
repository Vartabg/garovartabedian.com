import { accessibilityBootstrap } from "@/lib/accessibility-preferences";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import ReadingNavigation from "./_components/reading/ReadingNavigation";
import AccessibilityMenu from "./_components/AccessibilityMenu";
import FindOverlay from "./_components/FindOverlay";
import DocumentPolicyBoundary from "./_components/DocumentPolicyBoundary";
import PenWrites from "./_components/PenWrites";
import DiscoveryLens from "./_components/DiscoveryLens";
import IlluminatedEffects from "./_components/IlluminatedEffects";

const atkinson = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Verdana", "Arial", "sans-serif"],
  variable: "--font-atkinson",
});

const atkinsonMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-700-italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-monospace", "monospace"],
  preload: false,
  variable: "--font-atkinson-mono",
});

const openDyslexic = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-700-italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Verdana", "Arial", "sans-serif"],
  preload: false,
  variable: "--font-open-dyslexic",
});

const fraunces = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
  preload: false,
  variable: "--font-fraunces",
});

// The hands of the record (Garo picked "Titulus Type", 2026-10-16). Headlines
// take the letterform of the era their words come from: Roman inscriptional
// capitals, the uncial book hand, blackletter, Renaissance print, and today's
// Fraunces. All are open-license (OFL) designs drawn after those hands.
const cinzel = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/cinzel/files/cinzel-latin-wght-normal.woff2",
      weight: "400 900",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Times New Roman", "serif"],
  variable: "--font-cinzel",
});

const uncial = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/uncial-antiqua/files/uncial-antiqua-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  preload: false,
  variable: "--font-uncial",
});

const fraktur = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/unifrakturmaguntia/files/unifrakturmaguntia-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  preload: false,
  variable: "--font-fraktur",
});

const garamond = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-normal.woff2",
      weight: "400 800",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-italic.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  preload: false,
  variable: "--font-garamond",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ece4d0" },
    { media: "(prefers-color-scheme: dark)", color: "#120f1c" },
  ],
};
import { PROFILE } from "@/lib/portfolio-content";
// Cardo sets Scripture: one family for Latin, Greek, and pointed Hebrew, made
// for scholars of biblical texts. Fontsource's CSS keeps the per-script
// unicode-range subsets, so a page downloads only the scripts it shows.
import "@fontsource/cardo/400.css";
import "@fontsource/cardo/400-italic.css";
import "@fontsource/cardo/700.css";
import "./globals.css";

/** schema.org Person — feeds the Google knowledge panel and name searches. */
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PROFILE.name,
  jobTitle: PROFILE.role,
  url: "https://garovartabedian.com",
  email: `mailto:${PROFILE.links.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Austin",
    addressRegion: "TX",
    addressCountry: "US",
  },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Columbia University" },
  sameAs: [PROFILE.links.linkedin, PROFILE.links.github, PROFILE.links.atxbro],
  knowsAbout: [
    "Solutions Engineering",
    "Implementation Engineering",
    "Customer Engineering",
    "Python",
    "TypeScript",
    "Browser automation",
    "API integration",
    "LLM and agentic workflows",
    "Field service engineering",
  ],
};

/** schema.org WebSite identity. */
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jesus Christ, Scripture, and the Record",
  alternateName: "garovartabedian.com",
  url: "https://garovartabedian.com",
};



export const metadata: Metadata = {
  metadataBase: new URL("https://garovartabedian.com"),
  title: {
    default: "Jesus Christ, Scripture, and the Record",
    template: "%s — Scripture & the Record",
  },
  description:
    "The Scriptures cross-referenced, the record on Jesus Christ, the apostles, the early church, angels and demons, Bible ownership, and how claims are known — eight worlds built to be walked through, not scrolled past.",
  openGraph: {
    title: "Jesus Christ, Scripture, and the Record",
    description:
      "Scripture, history, evidence, and the facts of who owns them — eight worlds, built to be walked through, not scrolled past.",
    url: "https://garovartabedian.com",
    siteName: "garovartabedian.com",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "An empty first-century rock-cut tomb at dawn beside the words Jesus Christ. The tomb is empty.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      dir="ltr"
      data-a11y-theme="system"
      data-a11y-font="book"
      className={`${atkinson.variable} ${atkinsonMono.variable} ${openDyslexic.variable} ${fraunces.variable} ${cinzel.variable} ${uncial.variable} ${fraktur.variable} ${garamond.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          id="accessibility-preferences"
          dangerouslySetInnerHTML={{ __html: accessibilityBootstrap }}
        />
        {/* Without JS the IntersectionObserver never fires — keep .reveal content visible. */}
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}.discovery-lens{display:none}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}><DocumentPolicyBoundary /></Suspense>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <DiscoveryLens />
        {children}
        {/* The nav's Find button only flips a bridge flag; this is what listens
            for it and renders the dialog. The same 39-branch auto-merge that
            dropped the controls.css import left this component orphaned in the
            tree — imported by nothing — so every Find test failed on an element
            that was never mounted. */}
        <FindOverlay localEvidence={process.env.NODE_ENV === "development" && !!process.env.JEV_RESEARCH_BRIDGE_PORT} />
        <ReadingNavigation />
        <AccessibilityMenu />
        {/* The reading thread: a vermilion hairline across the top whose length
            follows the scroll (core.css, scroll-driven; hidden under reduced
            motion). The pen writes headings in as they come into view. */}
        <div className="reading-thread" aria-hidden="true" />
        <PenWrites />
        <IlluminatedEffects />
        <Analytics />
      </body>
    </html>
  );
}
