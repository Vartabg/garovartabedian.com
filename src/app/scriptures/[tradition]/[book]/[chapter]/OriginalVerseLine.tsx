"use client";

import { useState } from "react";
import { describeOriginalWord } from "@/lib/scriptures/morphology";
import { ORIGINAL_EDITION_DISPLAY } from "@/lib/scriptures/original-editions";
import type { OriginalChapter, OriginalVerse } from "@/lib/scriptures/types";

const LANGUAGE_NAMES = { hebrew: "Hebrew", aramaic: "Aramaic", greek: "Greek" } as const;
const LANGUAGE_CODES = { hebrew: "he", aramaic: "arc", greek: "grc" } as const;

function readableRef(ref: string) {
  const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)$/);
  return match ? `${match[1]} ${match[2]}:${match[3]}` : ref;
}

export default function OriginalVerseLine({
  chapter,
  verse,
}: {
  chapter: Pick<OriginalChapter, "edition" | "direction">;
  verse: OriginalVerse;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const edition = ORIGINAL_EDITION_DISPLAY[chapter.edition];
  const word = selected === null ? null : (verse.words[selected] ?? null);
  const description = word ? describeOriginalWord(word, chapter.edition) : null;

  return (
    <div className="scr-original">
      <div
        className="scr-original-line"
        dir={chapter.direction}
        lang={verse.languages.length === 1 ? LANGUAGE_CODES[verse.languages[0]] : undefined}
        aria-label={`${verse.languages.map((language) => LANGUAGE_NAMES[language]).join(" and ")} original text, verse ${verse.number}`}
      >
        {verse.words.map((item, index) => (
          <span
            className={`scr-original-token${item.after === "־" ? " is-joined" : ""}`}
            key={item.id ?? `${item.text}-${index}`}
            lang={
              verse.languages.length > 1
                ? item.morph.startsWith("A")
                  ? "arc"
                  : "he"
                : undefined
            }
          >
            <button
              type="button"
              className={selected === index ? "is-selected" : ""}
              aria-pressed={selected === index}
              aria-label={`Inspect ${item.text}`}
              onClick={() => setSelected(selected === index ? null : index)}
            >
              {item.text}
            </button>
            {item.after && <span aria-hidden="true">{item.after}</span>}
          </span>
        ))}
      </div>

      {word && description && (
        <div className="scr-word-inspector" dir="ltr">
          <div className="scr-word-inspector-head">
            <strong dir="auto">{word.text}</strong>
            <span>{LANGUAGE_NAMES[description.language]}</span>
            <button type="button" onClick={() => setSelected(null)} aria-label="Close word details">
              Close
            </button>
          </div>
          <dl>
            <div>
              <dt>{edition.lemmaLabel}</dt>
              <dd dir="auto">{word.lemma || "Not supplied"}</dd>
            </div>
            {word.ketiv && (
              <div>
                <dt>Written (ketiv)</dt>
                <dd dir="rtl" lang="he">{word.ketiv}</dd>
              </div>
            )}
            <div>
              <dt>Grammar</dt>
              <dd>{description.segments.join(" + ") || "Not parsed"}</dd>
            </div>
            {word.pos && (
              <div>
                <dt>Part of speech</dt>
                <dd>{word.pos}</dd>
              </div>
            )}
            <div>
              <dt>Inflection</dt>
              <dd className="scr-word-code">{word.morph || "Not supplied"}</dd>
            </div>
            {word.analysisConfidence && (
              <div>
                <dt>Source analysis</dt>
                <dd>
                  Confidence: {word.analysisConfidence.charAt(0).toUpperCase() + word.analysisConfidence.slice(1)}
                  {word.analysisSource
                    ? ` · Method: ${word.analysisSource.replaceAll("_", " ")}`
                    : ""}
                </dd>
              </div>
            )}
          </dl>
          <p>
            <a href={edition.href} target="_blank" rel="noreferrer">
              {edition.name} source ↗
            </a>
          </p>
        </div>
      )}

      {verse.sourceRefs && (
        <p className="scr-original-refnote">
          Masoretic numbering: {verse.sourceRefs.map(readableRef).join(", ")}
        </p>
      )}
    </div>
  );
}
