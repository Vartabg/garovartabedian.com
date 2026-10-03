import Link from "next/link";
import type { ChainLink, FreeChainView, HostedTextView } from "@/lib/word/types";
import SourceBasis from "../../_components/SourceBasis";

const number = new Intl.NumberFormat("en-US");
const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

function ExternalLink({ link }: { link: ChainLink }) {
  const internal = link.href.startsWith("/");
  return (
    <a
      href={link.href}
      className="textlink"
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
    >
      {link.label}
    </a>
  );
}

/** One hosted text: four numbered links from the file to the reader. */
function ChainCard({ text }: { text: HostedTextView }) {
  return (
    <article className="wd-chain-card" id={`text-${text.id}`}>
      <header>
        <span className="wd-abbr">{text.abbr}</span>
        <span className="wd-badge free">Public domain</span>
      </header>
      <h3>{text.name}</h3>
      <p className="wd-chain-meta">
        {text.edition} · {text.year} · {number.format(text.books)} books,{" "}
        {number.format(text.chapters)} chapters hosted
      </p>
      <ol className="wd-chain-steps">
        <li>
          <strong>Source file</strong>
          {text.sources.map((source) => (
            <p key={source.href}>
              <ExternalLink link={source} />
              {source.note ? <> — {source.note}</> : null}
            </p>
          ))}
          {text.retrieved ? <p className="scr-meta">Retrieved {text.retrieved}.</p> : null}
        </li>
        <li>
          <strong>Rights record</strong>
          <p>{text.basis}</p>
          <p>
            <ExternalLink link={text.license} />
            {text.license.note ? <> — {text.license.note}</> : null}
          </p>
        </li>
        <li>
          <strong>What the processing did</strong>
          <p>{text.processing}</p>
          {text.review ? (
            <p>
              <ExternalLink link={text.review} />
              {text.review.note ? <> — {text.review.note}</> : null}
            </p>
          ) : null}
        </li>
        <li>
          <strong>In the reader</strong>
          <p>
            <Link href={text.sample.href} className="textlink">
              {text.sample.label}
            </Link>
          </p>
          {text.shelves.length > 0 ? (
            <ul className="wd-chain-shelves" aria-label={`Shelves where ${text.abbr} is the default text`}>
              <li className="wd-chain-shelves-lead">Default on</li>
              {text.shelves.map((shelf) => (
                <li key={shelf.tradition}>
                  {shelf.label}: {number.format(shelf.books)} {shelf.books === 1 ? "book" : "books"}
                </li>
              ))}
            </ul>
          ) : null}
          {text.alternateShelves.length > 0 ? (
            <ul className="wd-chain-shelves" aria-label={`Shelves where ${text.abbr} can be selected`}>
              <li className="wd-chain-shelves-lead">Selectable on</li>
              {text.alternateShelves.map((shelf) => (
                <li key={shelf.tradition}>
                  {shelf.label}: {number.format(shelf.books)} {shelf.books === 1 ? "book" : "books"}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      </ol>
    </article>
  );
}

export default function FreeRoom({ data }: { data: FreeChainView }) {
  const count = COUNT_WORDS[data.hosted.count] ?? String(data.hosted.count);
  // The live counts belong beside the apparatus they describe, not in the data file.
  const countLine: Record<string, string> = {
    tsk: `${number.format(data.stats.crossReferenceTargets)} cross-reference targets.`,
    nave: `${number.format(data.stats.topics)} topics.`,
    semantic: `${number.format(data.stats.semanticVerses)} verses indexed with ${data.stats.semanticModel}.`,
    narration: `${number.format(data.stats.narrationChapters)} chapters so far.`,
  };

  return (
    <>
      <p className="kicker">
        <Link href="/word">Who Owns the Word?</Link>
      </p>
      <h1>The free way, checked.</h1>
      <p className="lede">{data.intro}</p>

      <SourceBasis id="word-free" />

      <h2 className="world-lane" id="texts">
        The {count} hosted texts
      </h2>
      <p>
        Each card is one chain. Follow it link by link: the archive the site
        downloaded, the page that says the text is free, what was done to it on
        the way in, and the shelf it serves on.
      </p>
      <div className="wd-chain">
        {data.texts.map((text) => (
          <ChainCard key={text.id} text={text} />
        ))}
      </div>

      <h2 className="world-lane" id="apparatus">
        Also on the shelf
      </h2>
      <p>
        The reader is more than verse text. These are the other things it hosts,
        each with the license it actually carries — and two of them are open
        licenses, not public domain.
      </p>
      <ul className="wd-chain-apparatus">
        {data.apparatus.map((item) => (
          <li key={item.id} id={`apparatus-${item.id}`}>
            <strong>{item.name}</strong>
            <span className="wd-chain-basis">{item.basis}</span>
            <p>
              {item.note}
              {countLine[item.id] ? <> {countLine[item.id]}</> : null}
            </p>
            <p className="world-cite">
              {item.links.map((link, index) => (
                <span key={link.href}>
                  {index > 0 ? " · " : null}
                  <ExternalLink link={link} />
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="world-lane" id="boundary">
        Where the claim stops
      </h2>
      <ul className="wd-practice">
        {data.boundary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p className="world-close">
        The raw manifest behind this page is{" "}
        <a href="/scriptures/SOURCES.md" className="textlink">
          public/scriptures/SOURCES.md
        </a>
        , and the site-wide standard is on the{" "}
        <Link href="/sources#scripture-texts" className="textlink">
          Sources page
        </Link>
        . If a link in a chain ever breaks, the claim it supports should be read
        as unverified until it is fixed.
      </p>
    </>
  );
}
