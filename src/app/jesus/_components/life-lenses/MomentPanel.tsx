"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";
import {
  CONNECTION_LABELS,
  GOSPELS,
  LIFE_LENSES,
  lensCount,
  passageHref,
  type LifeLens,
  type LifeLensMoment,
  type LifeLensMomentDetail,
  type LifeLensPassage,
} from "@/lib/jesus/life-lenses";

function PassageText({ passage }: { passage: LifeLensPassage }) {
  return (
    <section className="jl-gospel">
      <h3>
        {passage.ref}
        <Link href={passageHref(passage)}>Read in context</Link>
      </h3>
      <p className="jl-gospel-text">
        {passage.verses.map(([n, text]) => (
          <span key={n}>
            <sup>{n}</sup>
            {text}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}

/** Why a birth-era moment has no words: before his birth there is no child yet. */
function birthNote(moment: LifeLensMoment) {
  if (moment.era !== "birth") return "";
  return moment.id === "annunciation" ? "He is not yet born here. " : "He is a child here. ";
}

function LensBody({ moment, lens, detail, onLens }: { moment: LifeLensMoment; lens: LifeLens; detail: LifeLensMomentDetail; onLens: (lens: LifeLens) => void }) {
  if (lens === "words") {
    if (!detail.words.length) {
      return (
        <div className="jl-empty">
          <p>{birthNote(moment)}None of his words are recorded in these passages.</p>
          <button type="button" className="jl-retry" onClick={() => onLens("gospels")}>Read the Gospel account</button>
        </div>
      );
    }
    return (
      <ul className="jl-words">
        {detail.words.map((w) => (
          <li key={w.ref}>
            <blockquote className="jsu-red">
              “{w.text}”<cite>{w.ref}</cite>
            </blockquote>
          </li>
        ))}
      </ul>
    );
  }
  if (lens === "gospels") {
    return (
      <div className="jl-gospels">
        {GOSPELS.map((g) => {
          const passages = detail.passages.filter((p) => p.book === g.id);
          return passages.length ? (
            passages.map((p) => <PassageText key={p.ref} passage={p} />)
          ) : (
            <p key={g.id} className="jl-gospel is-silent">Not told in {g.name}</p>
          );
        })}
        {detail.passages
          .filter((p) => !GOSPELS.some((g) => g.id === p.book))
          .map((p) => (
            <PassageText key={p.ref} passage={p} />
          ))}
      </div>
    );
  }
  if (!detail.prophecy.length) {
    return <p className="jl-empty">No prophecy pair on this site points to this moment.</p>;
  }
  return (
    <ul className="jl-prophecy">
      {detail.prophecy.map((p) => (
        <li key={p.id} className="jl-pair">
          <p className="jl-pair-kind">
            {CONNECTION_LABELS[p.connection] ?? p.connection} · {p.theme}
          </p>
          <p className="jl-pair-text">
            “{p.from.text}” <span>{p.from.ref}</span>
          </p>
          <p className="jl-pair-refs">
            Read in {p.to.join(", ")} ·{" "}
            <Link href={`/jesus/prophecy#prophecy-pair-${p.id}`}>In the prophecy room</Link>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** One moment, seen through the lens the reader chose; the lens stays as they move. */
export default function MomentPanel({
  moment,
  eraName,
  placeName,
  lens,
  onLens,
  detail,
  failed,
  onRetry,
  before,
  after,
  onChoose,
}: {
  moment: LifeLensMoment;
  eraName: string;
  placeName: string;
  lens: LifeLens;
  onLens: (lens: LifeLens) => void;
  detail: LifeLensMomentDetail | null;
  failed: boolean;
  onRetry: () => void;
  before: LifeLensMoment | null;
  after: LifeLensMoment | null;
  onChoose: (id: string) => void;
}) {
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const i = LIFE_LENSES.findIndex((l) => l.id === lens);
    const next = LIFE_LENSES[(i + (event.key === "ArrowRight" ? 1 : LIFE_LENSES.length - 1)) % LIFE_LENSES.length].id;
    onLens(next);
    document.getElementById(`jl-tab-${next}`)?.focus();
  };

  return (
    <article className="jl-moment" aria-labelledby="jl-moment-title">
      <p className="jl-where">
        {eraName} · {placeName}
      </p>
      <h2 className="jl-title" id="jl-moment-title">
        {moment.title}
      </h2>
      <p className="jl-summary">{moment.line}</p>
      <p className="jl-told">
        Told by{" "}
        {GOSPELS.map((g) => (
          <span key={g.id} className={moment.books.includes(g.id) ? "is-on" : "is-off"}>
            {g.name}
          </span>
        ))}
      </p>

      <div className="jl-lenses" role="tablist" aria-label="Ways to see this moment" onKeyDown={onTabKey}>
        {LIFE_LENSES.map((l) => {
          const n = lensCount(moment, l.id);
          return (
            <button
              key={l.id}
              id={`jl-tab-${l.id}`}
              type="button"
              role="tab"
              className={`jl-lens${n ? "" : " is-zero"}`}
              aria-selected={lens === l.id}
              aria-controls={lens === l.id ? "jl-panel" : undefined}
              tabIndex={lens === l.id ? 0 : -1}
              onClick={() => onLens(l.id)}
            >
              {l.label} <b>{n}</b>
            </button>
          );
        })}
      </div>
      <div className="jl-panel" role="tabpanel" id="jl-panel" aria-labelledby={`jl-tab-${lens}`}>
        {detail ? (
          <LensBody moment={moment} lens={lens} detail={detail} onLens={onLens} />
        ) : failed ? (
          <p className="jl-empty" role="status">
            The passages didn’t load.{" "}
            <button type="button" className="jl-retry" onClick={onRetry}>
              Try again
            </button>
          </p>
        ) : (
          <p className="jl-empty" role="status">
            Loading the passages…
          </p>
        )}
      </div>

      <ul className="jl-deeper">
        <li>
          <Link href={`/jesus/life#life-event-${moment.id}`}>On the full map</Link>
        </li>
        {moment.harmony.map((h) => (
          <li key={h.id}>
            <Link href={`/jesus/harmony?passage=${h.id}`}>{h.title}, word by word</Link>
          </li>
        ))}
        {moment.risen ? (
          <li>
            <Link href={`/jesus/risen#${moment.risen.section}`}>Hour by hour, with sources</Link>
          </li>
        ) : null}
      </ul>

      <nav className="jl-steps" aria-label="Neighbouring moments">
        {before ? (
          <button type="button" onClick={() => onChoose(before.id)}>
            <small>Before</small>
            {before.title}
          </button>
        ) : (
          <span />
        )}
        {after ? (
          <button type="button" onClick={() => onChoose(after.id)}>
            <small>After</small>
            {after.title}
          </button>
        ) : null}
      </nav>
    </article>
  );
}
