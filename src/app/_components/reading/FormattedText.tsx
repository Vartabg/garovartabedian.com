import React, { Fragment, type ReactNode } from "react";
import { formatReadingText, READING_LAYOUT_VERSION } from "@/lib/reading-layout";

/** Server-rendered layout; renderText preserves existing glossary/footnote links. */
export default function FormattedText({ text, anchor, sourceOffset = 0, language = "en", commentary = false, renderText = text => text }: {
  text: string;
  anchor: string;
  /** When the reader already hides a footnote-definition prefix, retain its source offset. */
  sourceOffset?: number;
  language?: string;
  commentary?: boolean;
  renderText?: (text: string, start: number, end: number) => ReactNode;
}) {
  return <div className="reading-formatted" data-reading-layout={READING_LAYOUT_VERSION}>
    {formatReadingText(text, { language }).map(block => {
      const start = block.fragments[0].start;
      const content = block.fragments.map(part => {
        // The paragraph margin already expresses a supplied blank-line boundary.
        // Retain its exact characters in the DOM without doubling the visible gap.
        const trailing = /[\r\n][\t \r\n]*$/.exec(part.text);
        const bodyEnd = trailing ? part.start + trailing.index : part.end;
        return <p key={part.start} id={`${anchor}-r${sourceOffset + part.start}`} dir="auto" data-reading-fragment={sourceOffset + part.start} data-reading-boundary={part.boundary}>
          {renderText(part.text.slice(0, bodyEnd - part.start), part.start, bodyEnd)}
          {trailing && <span className="reading-boundary-space">{renderText(trailing[0], bodyEnd, part.end)}</span>}
        </p>;
      });
      return block.kind === "quotation" ? <div key={start} className="reading-quotation" data-reading-role={commentary ? "interpretation" : "source"}>
        <span className="reading-quotation-label">{commentary ? "Quotation in edition commentary" : "Quotation in the text"}</span>
        <blockquote>{content}</blockquote>
      </div> : <Fragment key={start}>{content}</Fragment>;
    })}
  </div>;
}

export function ReadingLayoutNote() {
  return <details className="reading-layout-note reading-help">
    <summary>About this reading layout</summary>
    <p>Source wording, punctuation, paragraph boundaries and supplied line breaks are retained. Long prose also has editorial reading breaks at sentence boundaries. Substantial passages already enclosed in double quotation marks are set apart; this does not identify their source or establish a connection.</p>
    <p>These added breaks are reading aids, not claims about the original manuscript’s layout. Poetry is lineated only where the downloaded text supplies line breaks. References and edition notes remain with their text.</p>
  </details>;
}
