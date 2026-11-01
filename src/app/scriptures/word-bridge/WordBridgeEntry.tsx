"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";
import { loadBook } from "@/lib/scriptures/client";
import { wordBridgeHref } from "@/lib/scriptures/word-bridge-url";
import type { Canons } from "@/lib/scriptures/types";

const EXAMPLES = [
  { book: "MAT", chapter: 28, verse: 1, label: "Matthew 28:1" },
  { book: "MRK", chapter: 16, verse: 1, label: "Mark 16:1" },
  { book: "LUK", chapter: 24, verse: 2, label: "Luke 24:2" },
  { book: "JHN", chapter: 3, verse: 16, label: "John 3:16" },
];

export default function WordBridgeEntry({ canons }: { canons: Canons }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  return <section className="scr-bridge-entry-form" aria-labelledby="bridge-entry-title">
    <h2 id="bridge-entry-title">Start with a verse</h2>
    <p>Word Bridge connects the World English Bible with its Hebrew or Greek source text. Your reading stays in view.</p>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const ref = parseScriptureQueryRef(query.slice(0, 160), canons);
      if (!ref || ref.endVerse) {
        setMessage("Enter one verse, such as John 3:16 or Matthew 28:1.");
        return;
      }
      if (!canons.books[ref.book].trans.includes("web")) {
        setMessage("Word Bridge is not available for this book in the World English Bible. Choose another verse or use Compare translations.");
        return;
      }
      setBusy(true);
      setMessage("Opening your verse…");
      try {
        const book = await loadBook("web", ref.book);
        if (!active.current) return;
        if (!book.chapters[ref.chapter - 1]?.[ref.verse - 1]) {
          setMessage("That verse is not present in this edition. Check the chapter and verse, then try again.");
          setBusy(false);
          return;
        }
        const tradition = canons.traditions.find(t => t.books.includes(ref.book))?.id;
        if (!tradition) throw new Error("No hosted tradition");
        router.push(wordBridgeHref(tradition, ref.book, ref.chapter, ref.verse));
      } catch {
        if (!active.current) return;
        setMessage("The verse could not load. Check your connection and try again.");
        setBusy(false);
      }
    }}>
      <label htmlFor="bridge-reference">Passage reference</label>
      <div className="scr-bridge-entry-controls">
        <input id="bridge-reference" name="reference" value={query} maxLength={160} placeholder="John 3:16" autoComplete="off" required onChange={event => setQuery(event.target.value)} aria-describedby="bridge-entry-status" />
        <button type="submit" className="scr-btn" disabled={busy}>{busy ? "Opening…" : "Open Word Bridge"}</button>
      </div>
      <p id="bridge-entry-status" role="status" aria-live="polite">{message}</p>
    </form>
    <nav aria-label="Word Bridge examples" className="scr-bridge-examples">
      <p>Or try a Gospel verse</p>
      {EXAMPLES.map(example => <a key={example.book} href={wordBridgeHref("protestant", example.book, example.chapter, example.verse)}>{example.label}<span aria-hidden="true"> →</span></a>)}
    </nav>
    <p><Link href="/scriptures">Choose a book and chapter</Link> · <Link href="/scriptures/polyglot">Compare translations</Link></p>
  </section>;
}
