import Image from "next/image";
import Link from "next/link";
import type {
  RisenAppearance,
  RisenData,
  RisenMoment,
  RisenMovement,
} from "@/lib/jesus/types";
import SourceBasis from "../../_components/SourceBasis";
import AppearanceGrid from "./AppearanceGrid";
import DescentShelf from "./DescentShelf";
import OutsideCanonArchive from "./OutsideCanonArchive";
import PassionClock from "./PassionClock";
import RefList from "./RefList";

const RISEN_PLATES = {
  hero: {
    src: "/jesus/risen/open-tomb.jpg",
    alt: "Illuminated-manuscript interpretation of an open rock-cut tomb at dawn, with burial linens resting inside.",
    caption:
      "The accounts begin after the event, at a tomb already open.",
  },
  death: {
    src: "/jesus/risen/death-hours.jpg",
    alt: "Illuminated-manuscript panorama of three distant crosses as daylight gives way to darkness over Jerusalem.",
    caption:
      "The reported hours, compressed from daylight into darkness.",
  },
  tomb: {
    src: "/jesus/risen/sabbath-silence.jpg",
    alt: "Illuminated-manuscript interpretation of a closed rock-cut tomb beneath a dark Sabbath sky.",
    caption:
      "The Sabbath day the Gospels leave unnarrated.",
  },
  forty: {
    src: "/jesus/risen/appearances-triptych.jpg",
    alt: "Three-panel illumination showing bread broken at Emmaus, Jesus offering his wounded hand indoors, and disciples beside a shore fire.",
    caption:
      "Three reported modes of recognition: broken bread, offered wounds, and a shared meal.",
  },
  ascension: {
    src: "/jesus/risen/olivet-witnesses.jpg",
    alt: "Illuminated-manuscript interpretation of the apostles looking into an empty sky on the Mount of Olives, with two figures in white nearby.",
    caption:
      "Acts turns the witnesses from an empty sky back toward Jerusalem.",
  },
} as const;

function RisenPlate({
  id,
  priority = false,
}: {
  id: keyof typeof RISEN_PLATES;
  priority?: boolean;
}) {
  const plate = RISEN_PLATES[id];

  return (
    <figure className={`jsu-risen-plate${priority ? " is-hero" : ""}`}>
      <span className="jsu-risen-plate-media">
        <Image
          src={plate.src}
          alt={plate.alt}
          fill
          priority={priority}
          sizes="(min-width: 1100px) 720px, (min-width: 760px) 68vw, 100vw"
        />
      </span>
      <figcaption>
        <strong>Interpretive illumination</strong>
        <span>{plate.caption}</span>
      </figcaption>
    </figure>
  );
}

const DEATH_EVIDENCE_IDS = new Set([
  "last-words",
  "tombs-opened",
  "centurion",
]);
const TOMB_INTERPRETATION_IDS = new Set([
  "paradise",
  "jonah",
  "spirits-in-prison",
  "descended",
  "not-abandoned",
  "keys",
  "abyss",
]);
const FORTY_SOURCE_IDS = new Set(["creed"]);
const FORTY_STORY_DUPLICATE_IDS = new Set(["eating", "still-doubting"]);
const ASCENSION_SOURCE_IDS = new Set(["mark-summary"]);
const APPEARANCE_STORY_EXCLUSIONS = new Set([
  "five-hundred",
  "james",
  "all-apostles",
  "forty-day-summary",
  "paul",
]);

function MomentEvidenceDisclosure({
  title,
  description,
  moments,
}: {
  title: string;
  description: string;
  moments: RisenMoment[];
}) {
  if (moments.length === 0) return null;

  return (
    <details className="jsu-risen-disclosure">
      <summary>
        <span>Evidence lane</span>
        <strong>{title}</strong>
      </summary>
      <div className="jsu-risen-disclosure-body">
        <p className="scr-meta">{description}</p>
        <div className="jsu-risen-evidence-items">
          {moments.map((moment) => (
            <article className="jsu-risen-evidence-item" key={moment.id}>
              <p className="jsu-risen-moment-clock">{moment.clock}</p>
              <h4>{moment.title}</h4>
              <p>{moment.line}</p>
              <p className="jsu-risen-attest">{moment.attestation}</p>
              {moment.tension ? (
                <p className="jsu-risen-tension">
                  <strong>What needs explaining</strong>
                  <span>{moment.tension}</span>
                </p>
              ) : null}
              <RefList refs={moment.refs} label={`Passages for ${moment.title}`} />
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}

function AppearanceStory({ appearances }: { appearances: RisenAppearance[] }) {
  if (appearances.length === 0) return null;

  return (
    <section className="jsu-risen-appearance-story" aria-labelledby="appearance-story">
      <p className="jsu-history-answer-kicker">What happens next</p>
      <h3 id="appearance-story">From the garden to Galilee</h3>
      <p className="scr-meta">
        The accounts do not supply one complete itinerary. Read in their broad
        sequence, the reports move from the tomb and Jerusalem toward Galilee.
      </p>
      <ol>
        {appearances.map((appearance) => (
          <li key={appearance.id}>
            <p className="jsu-risen-moment-clock">
              {appearance.when} · {appearance.where}
            </p>
            <h4>{appearance.who}</h4>
            <p>{appearance.line}</p>
            <RefList
              refs={appearance.sources.map((source) => ({ ref: source.ref }))}
              label={`Passages for ${appearance.who}`}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function EarliestAppearanceList({ moment }: { moment: RisenMoment | null }) {
  if (!moment) return null;

  return (
    <section className="jsu-risen-source-note" aria-labelledby="earliest-list">
      <p className="jsu-history-answer-kicker">Source clock</p>
      <h3 id="earliest-list">The earliest written list</h3>
      <p>{moment.line}</p>
      {moment.tension ? <p className="scr-meta">{moment.tension}</p> : null}
      <RefList refs={moment.refs} label={`Passages for ${moment.title}`} />
      <p style={{ marginTop: "0.85rem" }}>
        <Link
          href="/jesus/dossier?preset=resurrection-minimal-facts"
          className="textlink"
          style={{ fontSize: "0.85rem", fontWeight: 600 }}
        >
          Analyze the 1 Corinthians 15 creed in the NotebookLM Research Dossier Engine →
        </Link>
      </p>
    </section>
  );
}

function LaterAppearance({ appearance }: { appearance: RisenAppearance | null }) {
  if (!appearance) return null;

  return (
    <section className="jsu-risen-later" aria-labelledby="later-appearance">
      <p className="jsu-history-answer-kicker">Beyond the forty days</p>
      <h3 id="later-appearance">Paul, years later</h3>
      <p>{appearance.line}</p>
      {appearance.note ? <p className="scr-meta">{appearance.note}</p> : null}
      <RefList
        refs={appearance.sources.map((source) => ({ ref: source.ref }))}
        label="Passages for Paul's later appearance"
      />
    </section>
  );
}

function findMovement(movements: RisenMovement[], id: string): RisenMovement | null {
  return movements.find((movement) => movement.id === id) ?? null;
}

/**
 * The stretch the map compresses into seven pins: the death, the three days,
 * the forty days, and the ascension — read source by source.
 */
export default function RisenRoom({ data }: { data: RisenData }) {
  const { movements, moments, appearances, descent, outsideCanon, questions } = data;
  const death = findMovement(movements, "death");
  const tomb = findMovement(movements, "tomb");
  const forty = findMovement(movements, "forty");
  const ascension = findMovement(movements, "ascension");
  const deathStoryMoments = moments.filter(
    (moment) => moment.movement === "death" && !DEATH_EVIDENCE_IDS.has(moment.id),
  );
  const deathEvidence = moments.filter((moment) => DEATH_EVIDENCE_IDS.has(moment.id));
  const tombStoryMoments = moments.filter(
    (moment) =>
      moment.movement === "tomb" && !TOMB_INTERPRETATION_IDS.has(moment.id),
  );
  const tombInterpretations = moments.filter((moment) =>
    TOMB_INTERPRETATION_IDS.has(moment.id),
  );
  const fortyStoryMoments = moments.filter(
    (moment) =>
      moment.movement === "forty" &&
      !FORTY_SOURCE_IDS.has(moment.id) &&
      !FORTY_STORY_DUPLICATE_IDS.has(moment.id),
  );
  const ascensionStoryMoments = moments.filter(
    (moment) =>
      moment.movement === "ascension" && !ASCENSION_SOURCE_IDS.has(moment.id),
  );
  const appearanceStory = appearances.filter(
    (appearance) => !APPEARANCE_STORY_EXCLUSIONS.has(appearance.id),
  );
  const appearancesWithinForty = appearances.filter(
    (appearance) => appearance.id !== "paul",
  );
  const earliestList = moments.find((moment) => moment.id === "creed") ?? null;
  const markAscension = moments.filter((moment) => ASCENSION_SOURCE_IDS.has(moment.id));
  const paulAppearance = appearances.find((appearance) => appearance.id === "paul") ?? null;
  const sourceCount = new Set(
    appearancesWithinForty.flatMap((appearance) =>
      appearance.sources.map((source) => source.book),
    ),
  ).size;
  const appearanceReportLabel =
    appearancesWithinForty.length === 1 ? "report" : "reports";
  const sourceBookLabel = sourceCount === 1 ? "book" : "books";
  const questionLabel = questions.length === 1 ? "question" : "questions";

  return (
    <>
      <p className="kicker">
        <Link href="/jesus">Jesus Christ</Link>
      </p>
      <h1>From the cross to the ascension</h1>
      <p className="lede">
        The accounts do not tell one unbroken story. This room follows the
        events in order — death, burial, the silent sabbath, appearances, and
        ascension — then places the source differences beside them.
      </p>

      <RisenPlate id="hero" priority />

      <section className="jsu-history-answer" aria-labelledby="risen-short-answer">
        <p className="jsu-history-answer-kicker">Before you start</p>
        <h2 id="risen-short-answer">
          No source describes the resurrection itself. Every account begins at a
          tomb already open.
        </h2>
        <div className="jsu-history-answer-grid">
          <div>
            <strong>What the sources agree on</strong>
            <span>
              He was crucified, died, and was buried. His followers then reported
              encounters with him alive.
            </span>
          </div>
          <div>
            <strong>What they report differently</strong>
            <span>
              The hour, the last words, who reached the tomb, the messengers, and
              the order and location of the appearances.
            </span>
          </div>
          <div>
            <strong>The boundary</strong>
            <span>
              History can date the testimony, weigh the sources, and show what
              was claimed and how early. The act itself is confessed, not
              reconstructed.
            </span>
          </div>
        </div>
      </section>

      <nav className="jsu-risen-jumps" aria-label="Sections of this room">
        <a href="#death">The death</a>
        <a href="#tomb">The three days</a>
        <a href="#forty">The forty days</a>
        <a href="#ascension">The ascension</a>
        <a href="#outside-canon">Outside the canon</a>
        <a href="#open-questions">Where the accounts differ</a>
      </nav>

      <details className="jsu-risen-method">
        <summary>
          <span>Method</span>
          <strong>How this page handles sources</strong>
        </summary>
        <SourceBasis id="jesus-history" />
      </details>

      {death ? (
        <>
          <PassionClock
            movement={death}
            moments={deathStoryMoments}
            lead={<RisenPlate id="death" />}
          >
            <MomentEvidenceDisclosure
              title="Compare the death accounts"
              description="These details belong to the same afternoon, but they compare what individual writers include rather than advance the clock."
              moments={deathEvidence}
            />
          </PassionClock>
          <p className="jsu-risen-transition">
            By sunset the body is in a rock-cut tomb, and the women know where it
            has been laid. Then the narrative goes quiet.
          </p>
        </>
      ) : null}

      {tomb ? (
        <>
          <PassionClock
            movement={tomb}
            moments={tombStoryMoments}
            lead={<RisenPlate id="tomb" />}
          >
            <MomentEvidenceDisclosure
              title="Read the passages later used to describe the interval"
              description="These lines were spoken before the burial or interpreted afterward. They address the silence, but they are not events narrated during the sabbath."
              moments={tombInterpretations}
            />
            <section className="jsu-history-shelf" id="descent">
              <h3 className="jsu-lane">How later writers filled the silence</h3>
              <p className="scr-meta">
                Later Christian texts supplied the journey the Gospels leave out.
                Each record below states what it shows and where it stops.
              </p>
              <details className="jsu-risen-disclosure">
                <summary>
                  <span>Later tradition</span>
                  <strong>Read {descent.length} descent texts, oldest first</strong>
                </summary>
                <div className="jsu-risen-disclosure-body">
                  <DescentShelf records={descent} />
                </div>
              </details>
            </section>
          </PassionClock>
          <p className="jsu-risen-transition">
            When the story resumes before dawn, the tomb is open and the body is
            gone. The accounts now turn from absence to reported encounters.
          </p>
        </>
      ) : null}

      {forty ? (
        <>
          <PassionClock
            movement={forty}
            moments={fortyStoryMoments}
            lead={<RisenPlate id="forty" />}
          >
            <AppearanceStory appearances={appearanceStory} />
            <EarliestAppearanceList moment={earliestList} />
            <section className="jsu-history-shelf" id="appearances">
              <h3 className="jsu-lane">Compare the appearance reports, by source</h3>
              <details className="jsu-risen-disclosure">
                <summary>
                  <span>Source matrix</span>
                  <strong>
                    {appearancesWithinForty.length} {appearanceReportLabel} across{" "}
                    {sourceCount} {sourceBookLabel}
                  </strong>
                </summary>
                <div className="jsu-risen-disclosure-body">
                  <p className="scr-meta">
                    No source carries them all, and the earliest list is not a
                    Gospel. Open any reported cell to read the passage.
                  </p>
                  <AppearanceGrid appearances={appearancesWithinForty} />
                </div>
              </details>
            </section>
            <LaterAppearance appearance={paulAppearance} />
          </PassionClock>
          <p className="jsu-risen-transition">
            The reports move from one Sunday to repeated encounters over a span
            Acts alone numbers as forty days. Then Luke brings the witnesses to
            Olivet.
          </p>
        </>
      ) : null}

      {ascension ? (
        <PassionClock
          movement={ascension}
          moments={ascensionStoryMoments}
          lead={<RisenPlate id="ascension" />}
        >
          <MomentEvidenceDisclosure
            title="Compare Mark's later ending"
            description="Mark's one-line summary belongs to the longer ending, so it sits beside the event sequence rather than inside it."
            moments={markAscension}
          />
        </PassionClock>
      ) : null}

      <OutsideCanonArchive records={outsideCanon} />

      <section className="jsu-risen-questions" id="open-questions">
        <p className="jsu-history-answer-kicker">Where the accounts differ</p>
        <h2>The questions a careful reader hits first.</h2>
        <p className="scr-meta">
          These are not objections collected from outside. They are what the
          sources say when you lay them side by side, and every one of them has
          been argued over inside the church for as long as there has been one.
        </p>
        <details className="jsu-risen-question-disclosure">
          <summary>
            Compare {questions.length} {questionLabel} the sources leave open
          </summary>
          <div className="jsu-risen-question-list">
            {questions.map((question) => (
              <article className="jsu-risen-question" id={question.id} key={question.id}>
                <h3>{question.question}</h3>
                <p>{question.answer}</p>
                <RefList
                  refs={question.refs}
                  label={`Passages for: ${question.question}`}
                />
              </article>
            ))}
          </div>
        </details>
      </section>

      <section className="jsu-history-verdict">
        <p className="jsu-history-answer-kicker">Where the record lands</p>
        <h2>The shared claim is clear. The sequence is not.</h2>
        <p>
          Across the Gospels, Acts, and Paul, the shared claim is that Jesus died,
          was buried, and was afterward reported alive. The books differ over who
          arrived when, where appearances occurred, and how the sequence unfolded.
          History can date and compare those claims; it cannot reconstruct the
          resurrection itself.
        </p>
        <p className="jsu-history-answer-kicker">
          <Link href="/jesus/history">See how the outside witnesses are weighed</Link>
        </p>
      </section>

      <section
        className="jsu-risen-dossier-callout"
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
          Synthesize Passion &amp; Resurrection Evidence in Google NotebookLM
        </h3>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
          Examine the early tradition preserved in 1 Corinthians 15:3–8, the debated evidence concerning the empty tomb,
          the Seven Last Words from the cross, and noncanonical reception with hosted-text worksheets,
          curated source notes, and dialectical AI host prompts.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            href="/jesus/dossier?preset=resurrection-minimal-facts"
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
            <span>Early Resurrection Tradition Dossier</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/jesus/dossier?preset=seven-sayings-cross"
            className="jsu-station-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              textDecoration: "none",
            }}
          >
            <span>Seven Last Sayings from the Cross Dossier</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
