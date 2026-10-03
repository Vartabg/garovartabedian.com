import { GlossSegments } from "../../_components/Gloss";
import InlineMediaPlate from "../../_components/InlineMediaPlate";
import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import type { StonePlateMeta } from "@/lib/jesus/stone-plates";
import type { StoneItem } from "@/lib/jesus/types";
import HistoryEvidenceBoundary from "./HistoryEvidenceBoundary";

export default function StoneEvidenceCard({ stone, plate, seen }: {
  stone: StoneItem;
  plate?: StonePlateMeta;
  seen: GlossSeen;
}) {
  return (
    <details className="jsu-evidence-record" id={stone.id}>
      <summary>
        <span className="jsu-evidence-assessment">{stone.assessment}</span>
        <strong>{stone.name}</strong>
        <span>{stone.artifactDate}</span>
        <span className="jsu-evidence-distance">Found {stone.found}</span>
      </summary>
      <div className="jsu-evidence-body">
        {plate ? <InlineMediaPlate plate={plate} /> : null}
        {stone.inscription ? (
          <blockquote className="jsu-quote">
            <GlossSegments segments={segmentText(stone.inscription, seen)} />
          </blockquote>
        ) : null}
        {stone.inscriptionNote ? (
          <p className="jsu-cite">
            <GlossSegments
              segments={segmentText(stone.inscriptionNote, seen)}
            />
          </p>
        ) : null}
        <p>
          <GlossSegments segments={segmentText(stone.note, seen)} />
        </p>
        <HistoryEvidenceBoundary establishes={stone.attests} limits={stone.limits} />
        <p className="jsu-cite">
          Now: {stone.location} ·{" "}
          <a href={stone.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">source</a>
        </p>
      </div>
    </details>
  );
}
