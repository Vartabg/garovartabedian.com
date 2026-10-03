import type { Metadata } from "next";
import Link from "next/link";
import {
  getAfterlifeCardSummaries,
  TRADITION_FAMILIES,
  type TraditionFamily,
} from "@/lib/evidence/afterlife";
import { AfterlifeExplorer } from "./AfterlifeExplorer";

export const metadata: Metadata = {
  title: "The Afterlife Atlas — 54 World Traditions",
  description:
    "A source-led comparative register of 54 afterlife frameworks across religions, philosophies, and ancient myths — analyzed through observation, inference, and limit.",
  alternates: { canonical: "/evidence/frameworks" },
};

export default async function AfterlifeAtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string }>;
}) {
  const { family } = await searchParams;
  const allBeliefs = getAfterlifeCardSummaries();

  const selectedFamily = TRADITION_FAMILIES.includes(family as TraditionFamily)
    ? (family as TraditionFamily)
    : undefined;

  return (
    <div className="hw-atlas-container" style={{ maxWidth: "78rem", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <header className="hw-atlas-header">
        <p className="hw-kicker">
          <Link href="/evidence">← How We Know</Link> · Comparative Inquiry
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)", letterSpacing: "-0.03em" }}>
          The Afterlife Atlas
        </h1>
        <p className="hw-lede" style={{ fontSize: "1.15rem", color: "var(--muted)", maxWidth: "52rem", lineHeight: 1.6 }}>
          54 world traditions mapped across four millennia. Each dossier documents primary texts, funerary archaeology, and ritual practices before separating what adherents observed from what their theology inferred.
        </p>
      </header>

      <AfterlifeExplorer
        initialBeliefs={allBeliefs}
        initialFamily={selectedFamily}
      />
    </div>
  );
}
