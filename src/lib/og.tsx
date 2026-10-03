import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Default parchment palette — used by every non-world route (/hire, /work,
 * /about, /resume, /services, /contact) so they get a branded card instead
 * of reusing the homepage photo. World routes pass their own door palette
 * from WORLDS.doors so each card reads like that world's threshold. */
export const OG_DEFAULT_PALETTE = {
  bg: "#f3e7cf",
  ink: "#2b241d",
  accent: "#765416",
};

/**
 * One shared card renderer behind every route's opengraph-image.tsx, so the
 * ~13 routes that need a page-specific preview can't drift into 13 slightly
 * different layouts. Kept deliberately plain — a kicker, a title, one line,
 * and the site's own double-rule motif in the page's accent color — since
 * Satori (the renderer behind ImageResponse) only supports a constrained
 * CSS subset, not the full site stylesheet.
 */
export function renderOgImage({
  kicker,
  title,
  line,
  bg = OG_DEFAULT_PALETTE.bg,
  ink = OG_DEFAULT_PALETTE.ink,
  accent = OG_DEFAULT_PALETTE.accent,
}: {
  kicker: string;
  title: string;
  line?: string;
  bg?: string;
  ink?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          color: ink,
          padding: "72px 88px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 160, gap: 5 }}>
          <div style={{ display: "flex", height: 4, background: accent }} />
          <div style={{ display: "flex", height: 4, background: accent }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              textTransform: "uppercase",
              letterSpacing: 3,
              fontSize: 26,
              fontWeight: 700,
              color: accent,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.12,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {line ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.4,
                maxWidth: 900,
                opacity: 0.82,
              }}
            >
              {line}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex" }}>Garo Vartabedian</div>
            <div style={{ display: "flex", opacity: 0.75 }}>
              garovartabedian.com
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", height: 4, background: accent }} />
            <div style={{ display: "flex", height: 4, background: accent }} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
