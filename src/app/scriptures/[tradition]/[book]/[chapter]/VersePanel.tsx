"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadBook, pickTranslation, traditionFor } from "@/lib/scriptures/client";
import { parseRef } from "@/lib/scriptures/refs";
import { copyText, formatShareText, shareText } from "@/lib/scriptures/share";
import {
  buildVerseSpeechSegments,
  startSpeechPlayback,
  type SpeechPlayback,
} from "@/lib/scriptures/speech";
import type { Canons, Tradition, TranslationId } from "@/lib/scriptures/types";

type Preview = {
  key: string;
  label: string;
  href: string;
  text: string;
  edition: string;
};

/**
 * Everything you can do with one verse — opened by tapping that verse's
 * number, and rendered **inline, directly beneath the verse**.
 *
 * That placement is the whole point. The previous version was a fixed
 * bottom sheet over a blurred scrim: it hid the verse you were studying,
 * and (because its mobile rule used the non-existent `inset-x` property)
 * it overflowed the right edge of the phone with the close button off-screen.
 * In flow, the verse stays visible above its own tools, nothing can overflow,
 * and closing the panel costs no scroll position.
 */
export default function VersePanel({
  id,
  n,
  text,
  refs,
  canons,
  tradition,
  trans,
  transLabel,
  bookName,
  chapter,
  chapterHref,
  selected,
  speechVoice,
  speechRate,
  onToggleSelect,
  onClose,
}: {
  /** Element id, referenced by the verse number's aria-controls. */
  id: string;
  n: number;
  text: string;
  refs: string[];
  canons: Canons;
  tradition: Tradition;
  trans: TranslationId;
  /** Short version label for share copy — "WEB". */
  transLabel: string;
  bookName: string;
  chapter: number;
  /** Chapter URL with query, for building links (".../JHN/3?t=web"). */
  chapterHref: string;
  selected: boolean;
  speechVoice: string;
  speechRate: number;
  onToggleSelect: () => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingRef, setLoadingRef] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [allRefs, setAllRefs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<SpeechPlayback | null>(null);

  // Well-known verses carry a lot of threads — John 3:16 has 25. Showing all
  // of them by default buries the rest of the panel; the count stays honest
  // and the rest are one tap away.
  const REF_CAP = 12;
  const shown = allRefs ? refs : refs.slice(0, REF_CAP);

  // Feature-detect in an effect, not during render: this component is client
  // side but still prerendered on the server, where `window` does not exist.
  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(
    () => () => {
      const playback = playbackRef.current;
      playbackRef.current = null;
      playback?.cancel();
    },
    [],
  );

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2000);
    return () => clearTimeout(t);
  }, [note]);

  const refLabel = `${bookName} ${chapter}:${n}`;
  const verseUrl = () => `${window.location.origin}${chapterHref}#v${n}`;

  const shareBody = () =>
    formatShareText({
      bookName,
      chapter,
      verses: [{ n, text }],
      transLabel,
      url: verseUrl(),
    });

  const speak = () => {
    if (speaking) {
      playbackRef.current?.cancel();
      playbackRef.current = null;
      setSpeaking(false);
      return;
    }

    let playback: SpeechPlayback | null = null;
    const clear = () => {
      if (playback && playbackRef.current === playback) {
        playbackRef.current = null;
        setSpeaking(false);
      }
    };
    playback = startSpeechPlayback({
      segments: buildVerseSpeechSegments(bookName, chapter, n, text),
      voiceURI: speechVoice,
      rate: speechRate,
      onEnd: clear,
      onStop: clear,
      onError: clear,
    });
    if (!playback) return;
    playbackRef.current = playback;
    setSpeaking(true);
  };

  const togglePreview = async (r: string) => {
    if (preview?.key === r) {
      setPreview(null);
      return;
    }
    const p = parseRef(r);
    if (!p || !canons.books[p.book]) return;
    const label = `${canons.books[p.book].name} ${p.chapter}:${p.verse}${
      p.endVerse ? `\u2013${p.endVerse}` : ""
    }`;
    const tid = tradition.books.includes(p.book)
      ? tradition.id
      : traditionFor(canons, p.book);
    const meta = canons.books[p.book];
    const wanted = meta.trans.includes(trans) ? trans : pickTranslation(canons, tradition.transPreference, p.book);
    const href = `/scriptures/${tid}/${p.book}/${p.chapter}${wanted ? `?t=${wanted}` : ""}#v${p.verse}`;
    const edition = wanted ? (canons.translations[wanted]?.name ?? wanted) : "Edition unavailable";
    setLoadingRef(r);
    try {
      if (!wanted) throw new Error("no translation");
      const book = await loadBook(wanted, p.book);
      const arr = book.chapters[p.chapter - 1] ?? [];
      const slice = arr.slice(p.verse - 1, p.endVerse ?? p.verse).filter(Boolean);
      setPreview({ key: r, label, href, edition, text: slice.join(" ") });
    } catch {
      setPreview({ key: r, label, href, edition, text: "" });
    } finally {
      setLoadingRef(null);
    }
  };

  return (
    <div className="scr-vpanel" id={id} ref={rootRef}>
      <div className="scr-vpanel-tools" role="group" aria-label={`${refLabel} tools`}>
        {canSpeak && (
          <button
            type="button"
            className={`scr-btn${speaking ? " scr-btn-active" : ""}`}
            onClick={speak}
          >
            {speaking ? "Stop" : "Listen"}
          </button>
        )}
        <button
          type="button"
          className="scr-btn"
          onClick={async () =>
            setNote((await copyText(shareBody())) ? "Verse copied" : "Copy failed")
          }
        >
          Copy
        </button>
        <button
          type="button"
          className="scr-btn"
          onClick={async () =>
            setNote((await copyText(verseUrl())) ? "Link copied" : "Copy failed")
          }
        >
          Link
        </button>
        <button
          type="button"
          className="scr-btn"
          onClick={async () => {
            const outcome = await shareText({
              title: `${refLabel} (${transLabel})`,
              text: shareBody(),
              url: verseUrl(),
            });
            if (outcome === "copied") setNote("Copied");
          }}
        >
          Share
        </button>
        <button
          type="button"
          className={`scr-btn${selected ? " scr-btn-active" : ""}`}
          onClick={onToggleSelect}
          aria-pressed={selected}
        >
          Select
        </button>
        <button type="button" className="scr-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="scr-vpanel-note" role="status">
        {note ?? ""}
      </p>

      {refs.length > 0 ? (
        <div className="scr-vpanel-refs">
          <p className="scr-vpanel-heading" id={`${id}-refs`}>
            Where else this is said
          </p>
          <ul className="scr-refs" aria-labelledby={`${id}-refs`}>
            {shown.map((r) => {
              const p = parseRef(r);
              if (!p || !canons.books[p.book])
                return (
                  <li key={r}>
                    <span className="scr-ref scr-ref-plain">{r}</span>
                  </li>
                );
              const label = `${canons.books[p.book].name} ${p.chapter}:${p.verse}${
                p.endVerse ? `\u2013${p.endVerse}` : ""
              }`;
              const open = preview?.key === r;
              return (
                <li key={r}>
                  <button
                    type="button"
                    className={`scr-ref${open ? " is-open" : ""}`}
                    onClick={() => togglePreview(r)}
                    aria-expanded={open}
                  >
                    {label}
                    {loadingRef === r ? "\u2026" : ""}
                  </button>
                </li>
              );
            })}
          </ul>
          {refs.length > REF_CAP && (
            <button
              type="button"
              className="scr-refs-more"
              onClick={() => setAllRefs((a) => !a)}
              aria-expanded={allRefs}
            >
              {allRefs
                ? "Show fewer"
                : `Show all ${refs.length} cross-references`}
            </button>
          )}
          {preview && (
            <blockquote className="scr-refquote">
              <p>
                {preview.text || "That text is not hosted in this version yet."}
              </p>
              <footer>
                <span>{preview.edition} · </span><Link href={preview.href}>Go to {preview.label} &rarr;</Link>
              </footer>
            </blockquote>
          )}
        </div>
      ) : (
        <p className="scr-vpanel-empty">
          No cross-references recorded for this verse.
        </p>
      )}
    </div>
  );
}
