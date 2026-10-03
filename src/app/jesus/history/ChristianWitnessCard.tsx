import Link from "next/link";
import type { ChristianWitness } from "@/lib/jesus/types";
import HistoryEvidenceBoundary from "./HistoryEvidenceBoundary";

export default function ChristianWitnessCard({ witness }: { witness: ChristianWitness }) {
  return (
    <details className="jsu-evidence-record" id={witness.id}>
      <summary>
        <span className="jsu-evidence-assessment">{witness.assessment}</span>
        <strong>{witness.name}</strong>
        <span>{witness.date}</span>
        <span className="jsu-evidence-distance">Source distance: {witness.distance}</span>
      </summary>
      <div className="jsu-evidence-body">
        <p>{witness.summary}</p>
        <HistoryEvidenceBoundary establishes={witness.establishes} limits={witness.limits} />
        <p className="jsu-cite">
          {witness.sourceUrl.startsWith("/") ? (
            <Link href={witness.sourceUrl} className="textlink">Open source</Link>
          ) : (
            <a href={witness.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
              Academic context
            </a>
          )}
        </p>
      </div>
    </details>
  );
}
