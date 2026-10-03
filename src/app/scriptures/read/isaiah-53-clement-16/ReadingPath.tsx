"use client";

import { Fragment, useEffect, useRef, useState, type ComponentType, type MouseEvent } from "react";
import Link from "next/link";
import { passageSegments } from "@/lib/evidence/reading-journey";
import type { ConnectionPanelProps } from "./ConnectionPanel";
import styles from "./reading.module.css";
import ReadingAppearance from "@/app/_components/reading/ReadingAppearance";
import SourceNoteDialog from "@/app/_components/reading/SourceNoteDialog";
import FormattedText, { ReadingLayoutNote } from "@/app/_components/reading/FormattedText";

type Note = { id: string; kind: "source" | "interpretation" | "question"; title: string; quote: string; explanation: string; sourceIds: string[]; excerptId?: string };
const roleNames = { source: "Source", interpretation: "Editorial interpretation", question: "Open question" };

export default function ReadingPath({ journey, assessmentsEnabled }: ConnectionPanelProps) {
  const { packet } = journey;
  const [mode, setMode] = useState<"read" | "trace">("read");
  const [interactive, setInteractive] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [Comparison, setComparison] = useState<ComponentType<ConnectionPanelProps> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const returnPlace = useRef<{ control: HTMLElement; x: number; y: number } | null>(null);
  const notes: Note[] = [
    ...[packet.excerpts[0], packet.excerpts[2], packet.excerpts[1], packet.excerpts[3]].map(excerpt => ({
      id: excerpt.id, kind: "source" as const, title: excerpt.label, quote: excerpt.exact,
      explanation: "This is an exact quotation from the named hosted English edition. Read it alongside its surrounding passage. A matching quotation is a source check, not editorial approval.",
      sourceIds: [excerpt.sourceId], excerptId: excerpt.id,
    })),
    { id: "reading", kind: "interpretation", title: "From suffering to humility", quote: packet.claims[2].statement, explanation: packet.claims[2].limits, sourceIds: [packet.sources[1].id] },
    { id: "question", kind: "question", title: "What remains open", quote: packet.openQuestions[0], explanation: "These English translations do not identify the Greek or Hebrew wording behind the works. No original-language collation or independent editorial review has been completed for this reading path.", sourceIds: packet.sources.map(source => source.id) },
  ];
  const currentNote = notes.find(note => note.id === activeNote);

  useEffect(() => { setInteractive(true); }, []);

  async function loadComparison() {
    setMode("trace");
    setActiveNote("comparison");
    setLoadError(false);
    if (!Comparison) {
      try {
        // Native import here keeps comparison/assessment code out of Read mode.
        const loaded = await import("./ConnectionPanel");
        setComparison(() => loaded.default);
      } catch { setLoadError(true); }
    }
  }

  function open(event: MouseEvent<HTMLAnchorElement>, note: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    returnPlace.current = { control: event.currentTarget, x: window.scrollX, y: window.scrollY };
    if (note === "comparison") void loadComparison();
    else setActiveNote(note);
  }
  function noteLink(note: Note) {
    return <a className={styles.noteLink} data-kind={note.kind} href={`#note-${note.id}`} aria-haspopup={interactive ? "dialog" : undefined} aria-label={`${roleNames[note.kind]} note: ${note.title}`} onClick={event => open(event, note.id)}>
      {roleNames[note.kind]} · Note {notes.indexOf(note) + 1}
    </a>;
  }
  const compareLink = <a className={styles.compareLink} href={`/scriptures/investigations/${packet.id}`} aria-haspopup={interactive ? "dialog" : undefined} onClick={event => open(event, "comparison")}>Compare these passages <span aria-hidden="true">↗</span></a>;

  function earlyFragment(text: string, start: number, end: number, paragraph: number) {
    const excerpts = paragraph === 0 ? packet.excerpts.slice(1).filter(e => e.selector.start < end && e.selector.end > start) : [];
    const spans = excerpts.map(e => ({ id: e.id, start: Math.max(start, e.selector.start) - start, end: Math.min(end, e.selector.end) - start }));
    return passageSegments(text, spans).map((piece, i) => {
      const excerpt = excerpts.find(e => e.id === piece.note);
      return <Fragment key={i}>
        <span data-source-segment className={piece.note ? styles.marked : undefined} id={excerpt && excerpt.selector.start >= start ? `reading-${excerpt.id}` : undefined}>{piece.text}</span>
        {excerpt && excerpt.selector.end <= end && <span className={styles.inlineNote}>{noteLink(notes.find(note => note.id === excerpt.id)!)}</span>}
      </Fragment>;
    });
  }

  return <article className={styles.reader} data-reading-surface data-mode={mode}>
    <div className={styles.column}>
      <nav className={styles.breadcrumbs} aria-label="Reading path navigation"><Link href="/scriptures/search" prefetch={false}>Find</Link><span aria-hidden="true">/</span><span>Reading path · Preview</span></nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Isaiah 53 → 1 Clement 16</p>
        <h1>Wounds, healing,<br />and humility</h1>
        <p className={styles.intro}>Read the passages. Follow a phrase. Keep the sources close.</p>
        <p className={styles.muted}>Two hosted English translations · Editorial reading: unreviewed draft</p>
      </header>

      <div className={styles.tools}>
        <div className={styles.modes} role="group" aria-label="Reading mode">
          <button type="button" disabled={!interactive} aria-pressed={mode === "read"} onClick={() => setMode("read")}>Read</button>
          <button type="button" disabled={!interactive} aria-pressed={mode === "trace"} onClick={() => setMode("trace")}>Trace connections</button>
        </div>
        <p className={styles.modeHelp} role="status">{mode === "read" ? "Quiet reading. Source notes stay within reach." : "Marked phrases lead to source notes. Compare only when you choose."}</p>
        <details className={styles.options}>
          <summary>Reading appearance</summary>
          <ReadingAppearance />
        </details>
        <div className={styles.legend} aria-label="Passage roles">
          <span data-kind="source">Source · solid</span>
          <span data-kind="interpretation">Interpretation · dashed</span>
          <span data-kind="question">Open question · dotted</span>
        </div>
        <p className={styles.muted}>The marks describe a passage’s role, not its certainty.</p>
      </div>
      <ReadingLayoutNote />

      <section className={styles.chapter} aria-labelledby="isaiah-heading">
        <p className={styles.eyebrow}>01 / Read the Scripture</p>
        <h2 id="isaiah-heading">Isaiah 53:4–6</h2>
        <p className={styles.edition}>World English Bible · Source translation</p>
        {journey.scripture.slice(3, 6).map((text, index) => <div key={index} id={`isaiah-${index + 4}`} className={styles.passage} data-kind="source">
          <p className={styles.sourceText}><span className={styles.verseNumber} aria-label={`Verse ${index + 4}`}>{index + 4}</span><span data-source-segment className={index === 1 ? styles.marked : undefined}>{text}</span></p>
          {index === 1 && <div className={styles.nearby}>{noteLink(notes[0])}{compareLink}</div>}
        </div>)}
        <details className={styles.context}>
          <summary>Read all of Isaiah 53 · World English Bible</summary>
          {journey.scripture.map((text, index) => <p key={index} className={styles.sourceText}><span className={styles.verseNumber}>{index + 1}</span><span data-context-verse={index + 1}>{text}</span></p>)}
          <a href={packet.excerpts[0].href}>Open Isaiah 53 in the full reader</a>
        </details>
      </section>

      <div className={styles.bridge}><span aria-hidden="true">↓</span><p>Now read the early writing, including the introduction and the conclusion around its quotations.</p></div>

      <section className={styles.chapter} aria-labelledby="clement-heading">
        <p className={styles.eyebrow}>02 / Read the early writing</p>
        <h2 id="clement-heading">1 Clement 16</h2>
        <p className={styles.edition}>Ante-Nicene Fathers, Volume I (1885) · English translation</p>
        <p className={styles.muted}>The full hosted chapter follows. The edition’s printed heading is “Christ as an example of humility.” That heading is editorial material.</p>
        {journey.early.map((paragraph, index) => <div key={index} data-kind="source" data-early-paragraph={index}>
          <FormattedText text={paragraph} anchor={`clement-p${index + 1}`} renderText={(text, start, end) => earlyFragment(text, start, end, index)} />
        </div>)}
        <a href={packet.excerpts[1].href}>Open 1 Clement 16 in the full writing</a>
      </section>

      <section className={styles.reflection} data-kind="interpretation" aria-labelledby="reading-heading">
        <p className={styles.role}>Editorial interpretation · Unreviewed draft</p>
        <h2 id="reading-heading">From suffering to humility</h2>
        <p>{packet.claims[2].statement}</p>
        <p>{packet.claims[2].limits}</p>
        {noteLink(notes[4])}
        <div>{compareLink}</div>
      </section>
      <section className={styles.reflection} data-kind="question" aria-labelledby="question-heading">
        <p className={styles.role}>Open question</p>
        <h2 id="question-heading">What remains open?</h2>
        <p>{packet.openQuestions[0]}</p>
        {noteLink(notes[5])}
      </section>

      <footer className={styles.notes}>
        <h2>Notes and editions</h2>
        <p>Similarity alone does not establish historical borrowing, agreement, or proof. These translations remain distinct; no Greek or Hebrew text has been collated for this path.</p>
        <ol>{notes.map((note, index) => <li key={note.id} id={`note-${note.id}`} data-kind={note.kind}>
          <p className={styles.role}>{index + 1} / {roleNames[note.kind]}</p>
          <p>{note.title}. {note.explanation}</p>
          <a href={note.excerptId === "isaiah-suffering" ? "#isaiah-5" : note.excerptId ? `#reading-${note.excerptId}` : note.id === "reading" ? "#reading-heading" : "#question-heading"}>Return to this passage</a>
        </li>)}</ol>
        {packet.sources.map(source => <div key={source.id} className={styles.provenance}>
          <h3>{source.edition}</h3><p>{source.attribution} {source.rights}</p><a href={source.upstreamUrl}>Upstream edition</a>
        </div>)}
        <a href={`/scriptures/investigations/${packet.id}`}>Open the source investigation and evidence packet</a>
      </footer>
    </div>

    <SourceNoteDialog open={activeNote !== null} title={activeNote === "comparison" ? "Trace the connection" : `${currentNote ? roleNames[currentNote.kind] : "Source"} note`} kind={currentNote?.kind ?? "interpretation"} onClose={() => setActiveNote(null)} returnPlace={returnPlace}>
      {activeNote === "comparison" ? (Comparison ? <Comparison journey={journey} assessmentsEnabled={assessmentsEnabled} /> : <div role="status"><p>{loadError ? "The comparison could not load. Both source passages remain available in the reading." : "Opening the comparison…"}</p>{loadError && <><button type="button" onClick={() => void loadComparison()}>Try again</button><p><a href={`/scriptures/investigations/${packet.id}`}>Open the source investigation</a></p></>}</div>) : currentNote && <div className={styles.noteBody}>
        <p className={styles.role}>{roleNames[currentNote.kind]}{currentNote.kind === "interpretation" ? " · Unreviewed draft" : ""}</p>
        <h3>{currentNote.title}</h3>
        <blockquote>{currentNote.quote}</blockquote>
        <p>{currentNote.explanation}</p>
        {packet.sources.filter(source => currentNote.sourceIds.includes(source.id)).map(source => <section key={source.id} className={styles.provenance}>
          <h3>{source.edition}</h3><p>{source.attribution} {source.rights}</p><a href={source.kind === "scripture" ? packet.excerpts[0].href : packet.excerpts[1].href}>Open the hosted source</a>
        </section>)}
        {currentNote.excerptId && <details className={styles.context}>
          <summary>Read the surrounding context</summary>
          {currentNote.excerptId === "isaiah-suffering" ? journey.scripture.map((text, index) => <p className={styles.sourceText} key={index}><span className={styles.verseNumber}>{index + 1}</span>{text}</p>) : journey.early.map((text, i) => <FormattedText key={i} text={text} anchor={`context-clement-p${i + 1}`} />)}
        </details>}
        <button className={styles.compareLink} type="button" onClick={() => void loadComparison()}>Compare Isaiah and 1 Clement <span aria-hidden="true">↗</span></button>
      </div>}
    </SourceNoteDialog>
  </article>;
}
