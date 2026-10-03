"use client";

import { useEffect, useState } from "react";
import type { Canons } from "@/lib/scriptures/types";
import { loadBook } from "@/lib/scriptures/client";
import type { FindItem } from "@/lib/site/find-query";
import { previewTarget } from "@/lib/site/find-surface";

export default function FindPreview({
  item,
  canons,
  query,
  localEvidence,
  onOpen,
  onSearch,
}: {
  item?: FindItem;
  canons: Canons | null;
  query: string;
  localEvidence: boolean;
  onOpen: (item: FindItem) => void;
  onSearch: () => void;
}) {
  const target = item && canons ? previewTarget(item, canons) : null;
  const [preview, setPreview] = useState<{
    text: string;
    before?: string;
    after?: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const book = target?.book,
    chapter = target?.chapter,
    verse = target?.verse,
    translation = target?.translation;
  useEffect(() => {
    setPreview(null);
    setFailed(false);
    if (!book || !chapter || !verse || !translation) return;
    let cancelled = false;
    void loadBook(translation, book)
      .then((data) => {
        if (cancelled) return;
        const verses = data.chapters[chapter - 1];
        if (!verses?.[verse - 1]) {
          setFailed(true);
          return;
        }
        setPreview({
          text: verses[verse - 1],
          before: verses[verse - 2],
          after: verses[verse],
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verse, translation]);
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
            preview ? (
              <>
                <blockquote>{preview.text}</blockquote>
                {(preview.before || preview.after) && (
                  <details>
                    <summary>Surrounding verses</summary>
                    {preview.before && (
                      <p>
                        <sup>{target.verse - 1}</sup> {preview.before}
                      </p>
                    )}
                    {preview.after && (
                      <p>
                        <sup>{target.verse + 1}</sup> {preview.after}
                      </p>
                    )}
                  </details>
                )}
              </>
            ) : (
              <p role="status">
                {failed
                  ? "This preview couldn’t load. Open the passage to read its source."
                  : "Loading source text…"}
              </p>
            )
          ) : (
            <><p className="find-preview-note">{item.note}</p>{item.snippet && <blockquote dir="auto">{item.snippet}</blockquote>}</>
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
          <p className="find-preview-kicker">Follow your curiosity</p>
          <h3>
            {query ? "Start with the sources." : "A word can open a world."}
          </h3>
          <p className="find-preview-note">
            {query
              ? "Search the full text, or preview a result before you open it."
              : "Find a passage, discover a writing, or jump to a person or place. Choose a result to look closer."}
          </p>
          {query && (
            <button
              type="button"
              className="find-preview-open"
              onClick={onSearch}
            >
              Explore this question<span aria-hidden="true">↗</span>
            </button>
          )}
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
