import type { Metadata } from "next";
import Link from "next/link";

const title = "Atlas Essays";
const description =
  "Long-form, source-led essays from garovartabedian.com's How We Know world — one sharp claim per piece, defended honestly.";

export const metadata: Metadata = {
  title: `${title} — The Afterlife Atlas`,
  description,
  alternates: { canonical: "/evidence/frameworks/essays" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://garovartabedian.com/evidence/frameworks/essays",
    siteName: "Garo Vartabedian",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const ESSAYS = [
  {
    href: "/evidence/frameworks/essays/bible-nobody-owns",
    kicker: "Essay No. 1 · November 5, 2026",
    title: "The Bible Nobody Owns — and the Empire That Publishes It",
    summary:
      "You cannot copyright the Word of God, but you can copyright the words it was just translated into. That one legal fact explains the Nashville tollbooth, the Murdoch family trust at the top of the bestselling book in history, and the open-licensing counter-movement believers are building as the exit.",
  },
  {
    href: "/evidence/frameworks/essays/esv-crossway",
    kicker: "Essay No. 2 · November 5, 2026",
    title: "The ESV Middle Case — Who Holds Crossway's Keys?",
    summary:
      "The ESV is the control case: a not-for-profit ministry that owns its own translation outright — no conglomerate, no Nashville pipeline. Its permissions fence turns out to measure almost exactly like Biblica's. What ownership changes, and what it does not, is the whole question.",
  },
];

export default function AtlasEssaysIndexPage() {
  return (
    <div style={{ maxWidth: "58rem", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <p className="hw-kicker">
        <Link href="/evidence/frameworks">← The Afterlife Atlas</Link> · Long-form
      </p>
      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 3.2rem)",
          margin: "0.25rem 0 0.5rem",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: "52rem",
          fontSize: "1.05rem",
          lineHeight: 1.7,
          color: "var(--muted)",
        }}
      >
        {description} Where an essay touches the atlas directly, it links back
        into the dossiers; the rest of the method is the same — sources first,
        observation, inference, and the stated limit.
      </p>

      <ul
        style={{
          listStyle: "none",
          margin: "2.5rem 0 0",
          padding: 0,
          display: "grid",
          gap: "1rem",
        }}
      >
        {ESSAYS.map((essay) => (
          <li key={essay.href}>
            <Link
              href={essay.href}
              style={{
                display: "block",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                background: "var(--surface)",
                padding: "1.5rem 1.75rem",
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <span className="hw-kicker" style={{ display: "block", marginBottom: "0.5rem" }}>
                {essay.kicker}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "1.4rem",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.2,
                }}
              >
                {essay.title}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: "0.6rem",
                  fontSize: "0.95rem",
                  lineHeight: 1.65,
                  color: "var(--muted)",
                  maxWidth: "44rem",
                }}
              >
                {essay.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
