import Link from "next/link";
import { GlossSegments } from "../../_components/Gloss";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import type { HistoryItem } from "@/lib/jesus/types";
import HistoryEvidenceBoundary from "./HistoryEvidenceBoundary";

export default function WrittenWitnessCard({ item, seen }: { item: HistoryItem; seen: GlossSeen }) {
  const isJosephus = item.id === "josephus-testimonium" || item.id === "josephus-agapius";
  const isRomanOrPagan =
    item.id === "tacitus-annals" ||
    item.id === "pliny-letters" ||
    item.id === "suetonius-claudius" ||
    item.id === "mara-bar-serapion";

  return (
    <details className="jsu-evidence-record" id={item.id}>
      <summary>
        <span className="jsu-evidence-assessment">{item.assessment}</span>
        <strong>{item.author}</strong>
        <span>{item.work} · {item.date}</span>
        <span className="jsu-evidence-distance">Source distance: {item.distance}</span>
      </summary>
      <div className="jsu-evidence-body">
        <p className="scr-meta">
          <GlossSegments segments={segmentText(item.authorNote, seen)} />
        </p>
        {item.excerptKind === "summary" ? (
          <p className="jsu-quote">
            <strong>Editorial summary:</strong>{" "}
            <GlossSegments segments={segmentText(item.excerpt, seen)} />
          </p>
        ) : (
          <blockquote className="jsu-quote">
            <GlossSegments segments={segmentText(item.excerpt, seen)} />
          </blockquote>
        )}
        <p className="jsu-cite">
          {item.excerptKind === "summary" ? "Source note" : "Translation"}: {item.translator} ·{" "}
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">source</a>
        </p>
        <p>
          <GlossSegments segments={segmentText(item.note, seen)} />
        </p>
        <HistoryEvidenceBoundary establishes={item.claimsAttested} limits={item.limits} />
        {isJosephus ? (
          <p style={{ marginTop: "1rem" }}>
            <Link
              href="/jesus/dossier?preset=testimonium-flavianum"
              className="textlink"
              style={{ fontWeight: 600 }}
            >
              Analyze this witness in the NotebookLM Research Dossier Engine →
            </Link>
          </p>
        ) : isRomanOrPagan ? (
          <p style={{ marginTop: "1rem" }}>
            <Link
              href="/jesus/dossier?preset=roman-historians-tacitus-pliny"
              className="textlink"
              style={{ fontWeight: 600 }}
            >
              Analyze Roman and other non-Christian witnesses in the NotebookLM Research Dossier Engine →
            </Link>
          </p>
        ) : null}
      </div>
    </details>
  );
}
