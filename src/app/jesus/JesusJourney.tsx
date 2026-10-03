import Link from "next/link";
import {
  getChristianWitnesses,
  getHistory,
  getLensTexts,
  getLife,
  getPerspectives,
  getProphecies,
  getRisen,
  getStones,
  getWordCounts,
} from "@/lib/jesus/server";
import { buttonClassName } from "../_components/Button";

type Station = {
  id: string;
  stop: string;
  role: string;
  title: string;
  invitation: string;
  connector: string;
  meta: string;
  href: string;
  action: string;
};

type RoomCard = {
  href: string;
  title: string;
  note: string;
  meta: string;
};

export default function JesusJourney() {
  const life = getLife();
  const wordCounts = getWordCounts();
  const prophecies = getProphecies();
  const witnesses = getChristianWitnesses();
  const history = getHistory();
  const stones = getStones();
  const perspectives = getPerspectives();
  const lensTexts = getLensTexts();
  const risen = getRisen();

  const speakingVerseCount = Object.values(wordCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const bookCount = Object.keys(wordCounts).length;
  const historyRecordCount = witnesses.length + history.length + stones.length;
  const lifePlaceCount = new Set(life.events.map((event) => event.place)).size;

  const stations: Station[] = [
    {
      id: "station-words",
      stop: "01",
      role: "Where the record begins",
      title: "His own words",
      invitation:
        "The red-letter record, book by book — every saying linked back to the chapter that carries it.",
      connector:
        "Everything else in this world is a claim about him — so hear the man first.",
      meta: `${speakingVerseCount.toLocaleString()} speaking verses across ${bookCount} New Testament books`,
      href: "/jesus/words",
      action: "Read his words",
    },
    {
      id: "station-life",
      stop: "02",
      role: "Then the ground he walked",
      title: "His life, place by place",
      invitation:
        "Bethlehem to the ascension on a coordinate-based map — each event one click from the Gospel passages that tell it.",
      connector: "Words were spoken somewhere. See where.",
      meta: `${life.events.length} events · ${lifePlaceCount} places`,
      href: "/jesus/life",
      action: "Open the map",
    },
    {
      id: "station-prophecy",
      stop: "03",
      role: "Then the claims written before him",
      title: "Prophecy beside fulfillment",
      invitation:
        "Old Testament passages next to the New Testament readings that claim, echo, or interpret them — the connection labeled before you open it.",
      connector:
        "His followers said he was promised long before. Read the promise and the claim together.",
      meta: `${prophecies.length} classified pairs`,
      href: "/jesus/prophecy",
      action: "Compare the pairs",
    },
    {
      id: "station-history",
      stop: "04",
      role: "Then the people who wrote about him",
      title: "The historical record",
      invitation:
        "The earliest Christian testimony, Jewish and Roman witnesses, and archaeology — dated, sourced, and bounded by what each can establish.",
      connector: "After the life came the accounts. Weigh them with their dates.",
      meta: `${historyRecordCount} source records`,
      href: "/jesus/history",
      action: "Meet the witnesses",
    },
    {
      id: "station-risen",
      stop: "05",
      role: "Then the event everything turns on",
      title: "From the cross to the ascension",
      invitation:
        "The death, the three days in the tomb, the forty days of appearances, and the ascension — each moment labeled with the sources that report it, and the differences between them left visible.",
      connector: "Every account above eventually meets this week.",
      meta: `${risen.moments.length} moments · ${risen.appearances.length} appearances`,
      href: "/jesus/risen",
      action: "Read the account",
    },
    {
      id: "station-dossier",
      stop: "06",
      role: "Then synthesize with research AI",
      title: "NotebookLM research dossiers",
      invitation:
        "Hosted Scripture excerpts and curated notes from identified Jewish, Roman, and early Christian sources, formatted as research worksheets for Google NotebookLM.",
      connector: "Synthesize the witnesses, divergences, and claims with dialectical AI research.",
      meta: "8 curated presets · Multi-passage dossier compiler · Dialectical audio prompts",
      href: "/jesus/dossier",
      action: "Launch dossier studio",
    },
  ];

  const rooms: RoomCard[] = [
    {
      href: "/jesus/words",
      title: "His words",
      note: "The red-letter record, linked to its chapters.",
      meta: `${speakingVerseCount.toLocaleString()} verses · ${bookCount} books`,
    },
    {
      href: "/jesus/harmony",
      title: "Synoptic harmony",
      note: "Word-level diff engine across Greek and English.",
      meta: "12 pericopes · Triple & Double tradition",
    },
    {
      href: "/jesus/life",
      title: "His life",
      note: "Events and places on a coordinate map.",
      meta: `${life.events.length} events · ${lifePlaceCount} places`,
    },
    {
      href: "/jesus/prophecy",
      title: "Prophecy → fulfillment",
      note: "Paired passages with the connection labeled.",
      meta: `${prophecies.length} pairs`,
    },
    {
      href: "/jesus/history",
      title: "The historical record",
      note: "Christian, Jewish, Roman, and archaeological sources.",
      meta: `${historyRecordCount} records`,
    },
    {
      href: "/jesus/risen",
      title: "Cross to ascension",
      note: "The final week and the appearances that followed.",
      meta: `${risen.moments.length} moments · ${risen.appearances.length} appearances`,
    },
    {
      href: "/jesus/lens",
      title: "How the world sees him",
      note: "Six views, with evidence and later tradition kept distinct.",
      meta: `${perspectives.length} views · ${lensTexts.length} text records`,
    },
    {
      href: "/jesus/dossier",
      title: "NotebookLM dossier engine",
      note: "Hosted-text worksheets and Audio Overview prompts.",
      meta: "8 presets · Custom compiler",
    },
  ];

  return (
    <>
      <section className="jsu-wayfinding" aria-labelledby="jesus-wayfinding-title">
        <header>
          <p className="jsu-wayfinding-kicker">The way through</p>
          <h2 id="jesus-wayfinding-title">One path, six stops.</h2>
          <p className="jsu-wayfinding-lede">
            This world holds his words, his places, the prophecies read beside
            their claimed fulfillments, the people who wrote about him, and the
            answers that followed. Below is one path through all of it, in the
            order the record opens. Every stop is a door — walk in whenever you
            like. The full map waits at the end.
          </p>
        </header>

        <div className="jsu-wayfinding-rules" aria-label="Three rules for reading honestly">
          <div>
            <strong>Read the text</strong>
            <span>
              Sayings and paired passages link back to the hosted chapter, so no
              quotation has to stand alone.
            </span>
          </div>
          <div>
            <strong>Date the witness</strong>
            <span>
              Christian, Jewish, and Roman records show their distance,
              dependence, and source before making a claim.
            </span>
          </div>
          <div>
            <strong>Name the boundary</strong>
            <span>
              Confession, historical inference, later reception, and legend
              remain different kinds of evidence.
            </span>
          </div>
        </div>

        <p className="jsu-wayfinding-links">
          <Link href="/sources#jesus-history">Inspect the source standard</Link>
          <Link href="/jesus/history">See it applied to the historical record</Link>
        </p>

        <p className="jsu-wayfinding-cue">
          <a href="#station-words">
            Begin with his own words<span aria-hidden="true"> ↓</span>
          </a>
        </p>
      </section>

      <section aria-labelledby="jesus-journey-title" className="jsu-journey">
        <h2 id="jesus-journey-title" className="jsu-visually-hidden">
          The guided path through this world
        </h2>
        <ol className="jsu-stations">
          {stations.map((station) => (
            <li key={station.id} id={station.id} className="jsu-station">
              <span className="jsu-station-index" aria-hidden="true">
                {station.stop}
              </span>
              <div className="jsu-station-body">
                <p className="jsu-station-connector">
                  <span aria-hidden="true">↳</span> {station.connector}
                </p>
                <p className="jsu-station-role">{station.role}</p>
                <h3>{station.title}</h3>
                <p className="jsu-station-invite">{station.invitation}</p>
                <p className="jsu-station-meta">{station.meta}</p>
                <Link
                  href={station.href}
                  className={buttonClassName({
                    variant: "primary",
                    size: "md",
                    className: "jsu-station-cta",
                  })}
                >
                  <span>{station.action}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="jsu-threshold" aria-labelledby="jesus-threshold-title">
        <p className="jsu-threshold-kicker">Where this path leads</p>
        <h2 id="jesus-threshold-title">Back to you.</h2>
        <p>
          The path stops here on purpose. This world does not close the argument
          for you — it keeps the record, the claim, and the boundary in view,
          then hands the question back. Read his words again, see how others
          have answered, and check the standard every page here is held to.
        </p>
        <div className="jsu-threshold-actions">
          <Link
            href="/jesus/words"
            className={buttonClassName({
              variant: "primary",
              size: "lg",
              className: "jsu-threshold-primary",
            })}
          >
            <span>Read his words</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/jesus/dossier"
            className={buttonClassName({
              variant: "secondary",
              size: "lg",
              className: "jsu-threshold-lens",
            })}
          >
            <span>NotebookLM Research Studio</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="jsu-threshold-standard">
          <Link href="/sources#jesus-history">
            The source standard behind every page
          </Link>
        </p>
      </section>

      <nav className="jsu-all-paths" aria-labelledby="jesus-all-paths-title">
        <p className="jsu-all-paths-kicker">Off the path</p>
        <h2 id="jesus-all-paths-title">Every room, in any order.</h2>
        <ul>
          {rooms.map((room) => (
            <li key={room.href}>
              <Link href={room.href} className="jsu-all-paths-card">
                <span>
                  <strong>{room.title}</strong>
                  <small>{room.note}</small>
                </span>
                <span className="jsu-all-paths-end">
                  <em>{room.meta}</em>
                  <span aria-hidden="true">↗</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
