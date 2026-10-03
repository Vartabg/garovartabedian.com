import SourceNote from "../_components/reading/SourceNote";
import FormattedText from "../_components/reading/FormattedText";
import { sliceReadingRuns } from "@/lib/reading-layout";
import type { GlossSegment } from "@/lib/glossary/types";
import type { InlineMediaPlateMeta } from "../_components/InlineMediaPlate";
import { GlossSegments } from "../_components/Gloss";
import EarlySectionPlate from "./EarlySectionPlate";
import EarlyPlateDensityShell from "./EarlyPlateDensityShell";
import {
  defaultPlateDensity,
  shouldShowSectionPlate,
} from "@/lib/early/plate-density";

export type ParagraphAllusion = {
  paragraph: number;
  href: string;
  label: string;
  text?: string;
};

export type EarlySectionView = {
  id?: string;
  citationId?: string;
  heading?: string;
  isBookBoundary: boolean;
  plate: InlineMediaPlateMeta | null;
  paragraphs: GlossSegment[][];
  /** Deterministic candidate matches, keyed to their source paragraph. */
  allusions?: ParagraphAllusion[];
};

/**
 * Chapter stream for a hosted writing. Long texts start with sparse
 * illustrations; the reader can expand to every plate. Images still wait for
 * the viewport (see InlineMediaPlate).
 */
export default function EarlyTextBody({ sections }: { sections: EarlySectionView[] }) {
  const platedCount = sections.reduce((n, section) => n + (section.plate ? 1 : 0), 0);
  const canSparse = platedCount > 0 && defaultPlateDensity(platedCount) === "sparse";
  let platedIndex = 0;
  const body = sections.map((section, index) => {
    const currentPlateIndex = section.plate ? platedIndex++ : -1;
    const optional =
      canSparse &&
      !!section.plate &&
      !shouldShowSectionPlate("sparse", currentPlateIndex, section.isBookBoundary);

    return (
        <section key={index} className="ew-section" id={section.id}>
          {/* Positional anchor. The slug id above is derived from the heading,
              so headingless sections had no address at all and duplicate
              headings shared one. The meaning rail links by position, which is
              always present and always unique. */}
          <span className="ew-section-anchor" id={`s${index}`} aria-hidden="true" />
          {section.citationId && section.citationId !== section.id && (
            <span className="ew-section-anchor" id={section.citationId} aria-hidden="true" />
          )}
          {section.heading &&
            (section.isBookBoundary ? (
              <h2 className="jsu-chapter ew-book-divider">{section.heading}</h2>
            ) : (
              <h2 className="jsu-chapter">{section.heading}</h2>
            ))}
          {section.plate && (
            <div className={`ew-density-plate${optional ? " is-optional" : ""}`}>
              <EarlySectionPlate plate={section.plate} />
            </div>
          )}
          {section.paragraphs.map((segments, paragraphIndex) => {
            const quoted = (section.allusions ?? []).filter(
              (allusion) => allusion.paragraph === paragraphIndex,
            );
            return (
              <div className="ew-para" key={paragraphIndex} id={`s${index}-p${paragraphIndex + 1}`}>
                <FormattedText
                  text={segments.map(segment => typeof segment === "string" ? segment : segment.text).join("")}
                  anchor={`s${index}-p${paragraphIndex + 1}`}
                  renderText={(_text, start, end) => <GlossSegments segments={sliceReadingRuns(segments, start, end)} />}
                />
                {quoted.length > 0 && (
                  // A margin note rather than an inline decoration: the
                  // quotation is already marked in the text by the translator's
                  // own quotation marks, so what a reader lacks is the
                  // reference, not the boundary.
                  <aside className="ew-allusion reading-trace-only" aria-label="Suggested Scripture matches">
                    <span className="reading-help">Suggested match · Unreviewed</span>
                    {quoted.map((allusion) => (
                      <SourceNote key={allusion.href} label={allusion.label} annotation={{ role: "source", title: allusion.label, href: allusion.href, provenance: "deterministic-match", review: "unreviewed" }}>
                        <p>World English Bible · {allusion.label}</p>
                        {allusion.text && <blockquote>{allusion.text}</blockquote>}
                        <p>Read the full chapter for surrounding context.</p>
                      </SourceNote>
                    ))}
                  </aside>
                )}
              </div>
            );
          })}
        </section>
    );
  });

  return canSparse ? (
    <EarlyPlateDensityShell platedCount={platedCount}>{body}</EarlyPlateDensityShell>
  ) : (
    <>{body}</>
  );
}
