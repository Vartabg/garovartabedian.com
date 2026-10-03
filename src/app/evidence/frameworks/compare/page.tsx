import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllBeliefSystems,
  COMPARATOR_PRESETS,
} from "@/lib/evidence/afterlife";
import { TraditionComparator } from "./TraditionComparator";

export const metadata: Metadata = {
  title: "Synoptic Berean Comparator — The Afterlife Atlas",
  description:
    "Side-by-side comparative analysis of 54 world afterlife frameworks. Aligned strictly by primary observed evidence, inferred architecture, interpreted doctrine, and stated limits.",
  alternates: { canonical: "/evidence/frameworks/compare" },
};

export default async function AfterlifeComparatorPage({
  searchParams,
}: {
  searchParams: Promise<{
    a?: string;
    b?: string;
    c?: string;
    preset?: string;
  }>;
}) {
  const { a, b, c, preset } = await searchParams;
  const allBeliefs = getAllBeliefSystems();

  // Determine initial ids from query params or active preset
  let initialIds: [string, string, string] = COMPARATOR_PRESETS[0].traditionIds;

  if (preset) {
    const foundPreset = COMPARATOR_PRESETS.find((p) => p.id === preset);
    if (foundPreset) {
      initialIds = foundPreset.traditionIds;
    }
  } else if (a && b) {
    const idA = allBeliefs.some((x) => x.id === a) ? a : initialIds[0];
    const idB = allBeliefs.some((x) => x.id === b) ? b : initialIds[1];
    const idC = c && allBeliefs.some((x) => x.id === c) ? c : initialIds[2];
    initialIds = [idA, idB, idC];
  }

  return (
    <div className="hw-comparator-container">
      <header style={{ marginBottom: "2rem" }}>
        <p className="hw-kicker">
          <Link href="/evidence/frameworks">← The Afterlife Atlas</Link> · Comparative Workbench
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", letterSpacing: "-0.03em", margin: "0.25rem 0 0.5rem" }}>
          Synoptic Berean Comparator
        </h1>
        <p style={{ fontSize: "1.15rem", color: "var(--muted)", maxWidth: "52rem", lineHeight: 1.6, margin: 0 }}>
          Compare world traditions in parallel columns. Observe how physical funerary archaeology, inferred cosmological architecture, and doctrinal interpretations diverge across human history while isolating their common limits.
        </p>
      </header>

      <TraditionComparator
        allBeliefs={allBeliefs}
        presets={COMPARATOR_PRESETS}
        initialTraditionIds={initialIds}
      />
    </div>
  );
}
