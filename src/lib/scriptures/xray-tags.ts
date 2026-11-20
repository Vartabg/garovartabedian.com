import type { SourceRow } from "./sources";
import type { ChapterXray, ChapterXrayTags, XrayTagSpec } from "./xray-types";

/**
 * The words on a chapter's Engineer tags. Every number comes from
 * ChapterXray or the corpus-health snapshot; nothing here is typed by hand,
 * and the verdict words are the ones the Word Bridge checker publishes.
 */
export type ChapterXrayContext = {
  translationName: string;
  bookId: string;
  bookName: string;
  bookNameFor: (id: string) => string;
  source: SourceRow;
  originalName: (edition: string) => string;
  guides: { files: number; agentReviewed: number; humanReviewed: number; untracked: number; batchTemplate: number };
};

const n = (value: number) => value.toLocaleString("en-US");
const plural = (count: number, one: string, many = `${one}s`) => `${n(count)} ${count === 1 ? one : many}`;

export function chapterXrayTags(xray: ChapterXray, ctx: ChapterXrayContext): ChapterXrayTags {
  const { source } = ctx;
  const bookOrigin = source.byBook?.[ctx.bookId]?.origin ?? source.origin;

  const text: XrayTagSpec = {
    id: "text",
    label: "Text",
    facts: [
      ctx.translationName,
      bookOrigin,
      ...(source.retrieved ? [`retrieved ${source.retrieved}`] : []),
      source.license,
      source.unmodified ? "served unmodified" : "verse boundaries reviewed against the printed edition",
      xray.text.emptySlots > 0
        ? `${plural(xray.text.verses, "verse slot")}, ${n(xray.text.emptySlots)} empty where the source has no verse`
        : plural(xray.text.verses, "verse"),
    ],
    detail: [
      `Hosted as text, ${xray.text.translation}, ${ctx.bookId}.json, and served as a static file.`,
      "Editions and licenses are listed on the Sources page.",
    ],
  };

  const original: XrayTagSpec = xray.original
    ? {
        id: "original",
        label: "Original and Word Bridge",
        facts: [
          ctx.originalName(xray.original.edition),
          plural(xray.original.verses, "verse"),
          ...(xray.bridge
            ? [
                `Word Bridge: ${plural(xray.bridge.links, "link")}, ${n(xray.bridge.ok)} supported, ${n(xray.bridge.plain)} other, ${n(xray.bridge.flag)} need review`,
                `${n(xray.bridge.drafted.ai)} of ${plural(xray.bridge.verses, "verse")} drafted by AI models (Claude, Codex), checked against the dictionaries`,
                ...(xray.bridge.drafted.ebible > 0 ? [`${n(xray.bridge.drafted.ebible)} from eBible word tags`] : []),
              ]
            : ["No Word Bridge for this chapter"]),
        ],
        detail: [
          ...(xray.bridge?.book
            ? [`${ctx.bookName} as a whole: ${n(xray.bridge.book.words)} words, ${n(xray.bridge.book.linked)} linked, ${n(xray.bridge.book.ok)} supported, ${n(xray.bridge.book.flag)} need review.`]
            : []),
          "The verdict words come from the same module the checker uses, so the page says what the checker decided.",
        ],
      }
    : { id: "original", label: "Original", facts: ["No Greek or Hebrew edition is hosted for this chapter"], detail: [] };

  const xref: XrayTagSpec = {
    id: "xref",
    label: "Cross-references",
    facts: ["Treasury of Scripture Knowledge", `${plural(xray.xref.links, "link")} from ${plural(xray.xref.verses, "verse")}`, "public domain"],
    detail: [`One file per book, ${ctx.bookId}.json, built from the public-domain Treasury.`, "The same links help rank the nearest chapters below."],
  };

  const g = ctx.guides;
  const guide: XrayTagSpec =
    xray.guide.kind === "published"
      ? {
          id: "guide",
          label: "Chapter guide",
          facts: [
            plural(xray.guide.questions, "question"),
            [xray.guide.status, xray.guide.reviewedOn].filter(Boolean).join(" ") || "review not recorded",
            ...(xray.guide.reviewer ? [xray.guide.reviewer] : []),
            `${n(g.humanReviewed)} human-reviewed guides on the site`,
          ],
          detail: [
            `Site-wide: ${n(g.files)} guides; ${n(g.agentReviewed)} agent-reviewed, ${n(g.humanReviewed)} human-reviewed, ${n(g.untracked)} untracked; ${n(g.batchTemplate)} still on the batch template.`,
          ],
        }
      : xray.guide.kind === "template"
        ? { id: "guide", label: "Chapter guide", facts: ["A guide file exists but is still the batch template, so it is not published"], detail: [`Site-wide: ${n(g.batchTemplate)} of ${n(g.files)} guides are still on the batch template.`] }
        : { id: "guide", label: "Chapter guide", facts: ["No guide file for this chapter"], detail: [] };

  const neighbours: XrayTagSpec = xray.neighbours
    ? {
        id: "neighbours",
        label: "Read next to it",
        facts: [
          `${plural(xray.neighbours.count, "nearest chapter")} by shared cross-references and meaning`,
          ...(xray.neighbours.top
            ? [`${ctx.bookNameFor(xray.neighbours.top.book)} ${xray.neighbours.top.chapter} shares ${plural(xray.neighbours.top.shared, "cross-reference")}`]
            : []),
        ],
        detail: ["Computed from the cross-reference file and chapter embeddings, then published as one neighbour record per chapter."],
      }
    : { id: "neighbours", label: "Read next to it", facts: ["No neighbour record for this chapter"], detail: [] };

  const unseen: XrayTagSpec = {
    id: "unseen",
    label: "Angels index",
    facts: [plural(xray.unseen.entries, "recorded encounter or named spirit", "recorded encounters or named spirits"), plural(xray.unseen.terms, "lexicon term") + " in the original text"],
    detail: ["Records are pages written about this chapter in Angels and Demons; terms are counted by machine from the tagged Hebrew or Greek."],
  };

  return { text, original, xref, guide, neighbours, unseen };
}
