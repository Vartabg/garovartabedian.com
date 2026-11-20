"use client";

import { useEffect, useState } from "react";
import type { Canons } from "@/lib/scriptures/types";
import { loadBook } from "@/lib/scriptures/client";
import { highlightFindText } from "@/lib/site/find-highlight";
import type { FindItem } from "@/lib/site/find-query";
import { previewTarget } from "@/lib/site/find-surface";

export default function FindPreview({
  item,
  canons,
  query,
  localEvidence,
  onOpen,
}: {
  item?: FindItem;
  canons: Canons | null;
  query: string;
  localEvidence: boolean;
  onOpen: (item: FindItem) => void;
}) {
  const target = item && canons ? previewTarget(item, canons) : null;
  const book = target?.book;
  const chapter = target?.chapter;
  const verse = target?.verse;
  const translation = target?.translation;
  const targetKey =
    book && chapter && verse && translation
      ? `${translation}:${book}:${chapter}:${verse}`
      : "";

  const [loaded, setLoaded] = useState<{
    key: string;
    text?: string;
    before?: string;
    after?: string;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!book || !chapter || !verse || !translation) return;
    const key = `${translation}:${book}:${chapter}:${verse}`;
    let cancelled = false;
    void loadBook(translation, book)
      .then((data) => {
        if (cancelled) return;
        const verses = data.chapters[chapter - 1];
        if (!verses?.[verse - 1]) {
          setLoaded({ key, failed: true });
          return;
        }
        setLoaded({
          key,
          text: verses[verse - 1],
          before: verses[verse - 2],
          after: verses[verse],
          failed: false,
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verse, translation]);

  const current = targetKey && loaded?.key === targetKey ? loaded : null;

  return (
    <aside className="find-preview" aria-label="Result preview">
      {item ? (
        <>
          <p className="find-preview-kicker">
            {target
              ? "From the source"
              : item.kind === "action"
                ? "Command"
                : "A place in the record"}
          </p>
          <h3>{item.title}</h3>
          {target && (
            <p className="find-preview-edition">
              {target.edition}
              {!target.isVerse
                ? " · opening verse"
                : " · verse " + target.verse + " preview"}
            </p>
          )}
          {target ? (
            current && !current.failed && current.text ? (
              <>
                <blockquote>{highlightFindText(current.text, query)}</blockquote>
                {(current.before || current.after) && (
                  <details>
                    <summary>Surrounding verses</summary>
                    {current.before && (
                      <p>
                        <sup>{target.verse - 1}</sup> {current.before}
                      </p>
                    )}
                    {current.after && (
                      <p>
                        <sup>{target.verse + 1}</sup> {current.after}
                      </p>
                    )}
                  </details>
                )}
              </>
            ) : (
              <p role="status">
                {current?.failed
                  ? "This preview couldn’t load. Open the passage to read its source."
                  : "Loading source text…"}
              </p>
            )
          ) : (
            <>
              <p className="find-preview-note">{item.note}</p>
              {item.snippet && (
                <blockquote dir="auto">
                  {highlightFindText(item.snippet, query)}
                </blockquote>
              )}
            </>
          )}
          <button
            type="button"
            className="find-preview-open"
            onClick={() => onOpen(item)}
          >
            {item.kind === "action"
              ? "Run this command"
              : target
                ? "Read this passage"
                : "Open this page"}
            <span aria-hidden="true">↗</span>
          </button>
          <p className="find-preview-path">
            {item.href === "#"
              ? "Changes a site preference"
              : item.href.split("?")[0]}
          </p>
        </>
      ) : (
        <>
          <span className="find-preview-mark" aria-hidden="true">
            ↗
          </span>
          <p className="find-preview-kicker">Across the record</p>
          <h3>
            {query ? "Start with the sources." : "A word can open a world."}
          </h3>
          <p className="find-preview-note">
            {query
              ? "Try another word, reference, or switch scope above."
              : "Find a passage, discover a writing, or jump to a person or place."}
          </p>
          <p className="find-preview-footnote">
            {localEvidence
              ? "The full workspace adds context, saved passages, and optional relevance checks."
              : "Source text and catalog matches. No generated answers."}
          </p>
        </>
      )}
    </aside>
  );
}
