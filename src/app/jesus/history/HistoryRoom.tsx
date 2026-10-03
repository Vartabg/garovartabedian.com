import Link from "next/link";
import type { StonePlateMeta } from "@/lib/jesus/stone-plates";
import type {
  ChristianWitness,
  HistoryItem,
  JesusEssay,
  JesusHistorySource,
  StoneItem,
} from "@/lib/jesus/types";
import SourceBasis from "../../_components/SourceBasis";
import ChristianWitnessCard from "./ChristianWitnessCard";
import StoneEvidenceCard from "./StoneEvidenceCard";
import WrittenWitnessCard from "./WrittenWitnessCard";
import InkAndStone from "./InkAndStone";
import SynthesisEssays from "./SynthesisEssays";
import HistorySources from "./HistorySources";

function EvidenceShelf({
  id,
  label,
  intro,
  children,
}: {
  id: string;
  label: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="jsu-history-shelf" id={id}>
      <h2 className="jsu-lane">{label}</h2>
      <p className="scr-meta">{intro}</p>
      <div className="jsu-evidence-list">{children}</div>
    </section>
  );
}

export default function HistoryRoom({
  christianWitnesses,
  items,
  stones,
  plates,
  essays = [],
  sources = [],
}: {
  christianWitnesses: ChristianWitness[];
  items: HistoryItem[];
  stones: StoneItem[];
  plates: Record<string, StonePlateMeta>;
  essays?: JesusEssay[];
  sources?: JesusHistorySource[];
}) {
  const glossSeen = new Map<string, string>();
  const jewish = items.filter((item) => item.lane === "Jewish");
  const roman = items.filter((item) => item.lane === "Roman");

  return (
    <>
      <p className="kicker"><Link href="/jesus">Jesus Christ</Link></p>
      <h1>What can history actually establish?</h1>
      <p className="lede">
        Start with the earliest Christian testimony, then test it against Jewish
        and non-Christian writers and the objects still in the ground. Every record shows
        its distance from the events, the strength of the identification, and the
        line where history has to stop.
      </p>

      <section className="jsu-history-answer" aria-labelledby="history-short-answer">
        <p className="jsu-history-answer-kicker">The short answer</p>
        <h2 id="history-short-answer">A Jewish teacher was crucified under Pontius Pilate. His movement did not die with him.</h2>
        <div className="jsu-history-answer-grid">
          <div><strong>Broad historical ground</strong><span>Jesus lived in first-century Judea and Galilee and was executed by Roman crucifixion.</span></div>
          <div><strong>Early and later attestation</strong><span>Named followers and resurrection belief appear in early Christian sources; later Jewish and Roman notices attest Jesus or the movement with different dates, genres, and degrees of independence.</span></div>
          <div><strong>The boundary</strong><span>History can date testimony and test claims. It records resurrection belief; it cannot reproduce or disprove the act of God that faith confesses.</span></div>
        </div>
      </section>

      <SourceBasis id="jesus-history" />
      <InkAndStone christianWitnesses={christianWitnesses} items={items} stones={stones} />

      <nav className="jsu-history-jumps" aria-label="History evidence lanes">
        <a href="#early-christian">Early Christian baseline</a>
        <a href="#jewish-witnesses">Jewish sources and reception</a>
        <a href="#roman-witnesses">Roman and other witnesses</a>
        <a href="#archaeology">Archaeology and setting</a>
        <a href="#synthesis-essays">Synthesis essays</a>
        <a href="#research-corpus">Research corpus</a>
      </nav>

      <EvidenceShelf
        id="early-christian"
        label="Early Christian baseline"
        intro="These are committed sources, not neutral ones—but they are the earliest surviving evidence and must be dated before later outside witnesses are compared with them."
      >
        {christianWitnesses.map((witness) => <ChristianWitnessCard witness={witness} key={witness.id} />)}
      </EvidenceShelf>

      <EvidenceShelf
        id="jewish-witnesses"
        label="Jewish sources and later reception"
        intro="Josephus writes from outside the Jesus movement; later Christian and rabbinic transmission records require their own dates and limits."
      >
        {jewish.map((item) => <WrittenWitnessCard item={item} seen={glossSeen} key={item.id} />)}
      </EvidenceShelf>

      <EvidenceShelf
        id="roman-witnesses"
        label="Roman and other non-Christian witnesses"
        intro="Roman officials, historians, and a disputed Syriac witness are later than the earliest Christian sources. Each record is bounded by its genre, date, and identification."
      >
        {roman.map((item) => <WrittenWitnessCard item={item} seen={glossSeen} key={item.id} />)}
      </EvidenceShelf>

      <EvidenceShelf
        id="archaeology"
        label="Archaeology and setting"
        intro="These objects establish governors, names, practices, boats, synagogues, and places. None is presented as an object that directly belonged to Jesus."
      >
        {stones.map((stone) => (
          <StoneEvidenceCard stone={stone} plate={plates[stone.id]} seen={glossSeen} key={stone.id} />
        ))}
      </EvidenceShelf>

      <SynthesisEssays essays={essays} />

      <section className="jsu-history-shelf" aria-labelledby="belief-growth-essay">
        <p className="kicker">Essay · With playable source excerpts</p>
        <h2 id="belief-growth-essay"><Link href="/jesus/history/belief-and-growth">Belief belongs in the explanation</Link></h2>
        <p>Jesus, Paul, and Christianity’s growth. Hear Jared Diamond’s claims in their original context, then examine the historical evidence.</p>
        <Link href="/jesus/history/belief-and-growth" className="textlink">Read the essay and watch the excerpts →</Link>
      </section>

      <HistorySources sources={sources} />

      <section className="jsu-history-verdict">
        <p className="jsu-history-answer-kicker">Where the record lands</p>
        <h2>The sources overlap on a person, an execution, and a movement.</h2>
        <p>
          Christian texts arrive first and make the largest claims. Josephus and
          Tacitus supply the clearest outside lines; Pliny, Trajan, and Suetonius
          show what the movement became. Archaeology makes the setting tangible
          without pretending to prove more than it can.
        </p>
      </section>

      <section
        className="jsu-history-dossier-callout"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "1.75rem",
          margin: "2rem 0",
        }}
      >
        <p className="jsu-history-answer-kicker" style={{ margin: "0 0 0.4rem" }}>
          NotebookLM Deep Research &amp; Dialectical Podcasts
        </p>
        <h3 style={{ margin: "0 0 0.5rem", fontFamily: "Cinzel, serif", fontSize: "1.25rem", color: "var(--ink)" }}>
          Synthesize Historical Jesus Evidence in Google NotebookLM
        </h3>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
          Collate hosted Scripture text with English excerpts and curated notes from identified historical sources,
          including the received Greek Testimonium and later Arabic and Syriac forms. Export a research worksheet
          with questions for a NotebookLM Audio Overview.
        </p>
        <div>
          <Link
            href="/jesus/dossier"
            className="jsu-station-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              background: "var(--accent)",
              color: "var(--accent-ink, #ffffff)",
              textDecoration: "none",
            }}
          >
            <span>Open Jesus Research Dossier Engine</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
