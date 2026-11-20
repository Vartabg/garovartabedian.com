/**
 * Shapes for public/meta/guide-record.json (scripts/site/build-guide-record.mjs)
 * and the packed form the case study sends to the browser.
 *
 * This module holds no data, so the client component can import it without
 * pulling the record into its bundle. guide-record-data.ts imports the JSON
 * and stays on the server.
 */

export type GuideReview = "agent" | "human" | "none";

/** Index into `traditions`: one whose reader has text for this chapter. Null if none does. */
type Linked = { chapter: number; tradition: number | null };

export type GuideChecked = Linked & {
  /** current: passes every rule of the current rubric. earlier: passes the checks every guide must pass, and predates the rubric. */
  state: "current" | "earlier";
  keyVerses: number;
  questions: number;
  outlineParts: number;
  /** Verses in the text the rubric checks against; 0 when that text lacks the chapter. */
  verses: number;
  review: GuideReview;
  reviewer: number | null;
  reviewedAt: string | null;
  drafter: number | null;
  rebinds: number;
  /** Rubric failure messages; null where the rubric cannot run. */
  problems: number | null;
};

export type GuideRow = (Linked & { state: "none" }) | GuideChecked;

export type GuideDrafter = { kind: "measured" | "attributed"; label: string };

export type GuideTotals = {
  chapters: number;
  current: number;
  earlier: number;
  none: number;
  agentReviewed: number;
  humanReviewed: number;
  unreviewed: number;
};

export type GuideRecord = {
  schemaVersion: number;
  generatedBy: string;
  rubricVersion: string;
  totals: GuideTotals;
  traditions: string[];
  reviewers: string[];
  drafters: GuideDrafter[];
  books: { id: string; name: string; chapters: GuideRow[] }[];
};

/**
 * A chapter with no guide is its tradition index alone. A guide is, in order:
 * tradition, state (1 earlier, 2 current), key verses, questions, outline
 * parts, verses, review (0 none, 1 agent, 2 human), reviewer index, review
 * date index, drafter index, rebinds, problems. A missing index or count is -1.
 */
export type PackedRow = number | number[];

export type PackedGuideRecord = {
  traditions: string[];
  reviewers: string[];
  drafters: GuideDrafter[];
  dates: string[];
  books: { id: string; name: string; rows: PackedRow[] }[];
};

const REVIEWS: GuideReview[] = ["none", "agent", "human"];
const orMissing = (value: number | null) => value ?? -1;
const orNull = (value: number) => (value === -1 ? null : value);

/** The record without its keys: about a seventh of the JSON, for the page payload. */
export function packGuideRecord(record: GuideRecord): PackedGuideRecord {
  const dates: string[] = [];
  const dateIndex = (date: string | null) => {
    if (date === null) return -1;
    const found = dates.indexOf(date);
    return found === -1 ? dates.push(date) - 1 : found;
  };
  return {
    traditions: record.traditions,
    reviewers: record.reviewers,
    drafters: record.drafters,
    dates,
    books: record.books.map(({ id, name, chapters }) => ({
      id,
      name,
      rows: chapters.map((row) =>
        row.state === "none"
          ? orMissing(row.tradition)
          : [
              orMissing(row.tradition),
              row.state === "current" ? 2 : 1,
              row.keyVerses,
              row.questions,
              row.outlineParts,
              row.verses,
              REVIEWS.indexOf(row.review),
              orMissing(row.reviewer),
              dateIndex(row.reviewedAt),
              orMissing(row.drafter),
              row.rebinds,
              orMissing(row.problems),
            ],
      ),
    })),
  };
}

export function unpackRow(row: PackedRow, chapter: number, dates: string[]): GuideRow {
  if (typeof row === "number") return { chapter, state: "none", tradition: orNull(row) };
  const [tradition, state, keyVerses, questions, outlineParts, verses, review, reviewer, date, drafter, rebinds, problems] = row;
  return {
    chapter,
    state: state === 2 ? "current" : "earlier",
    tradition: orNull(tradition),
    keyVerses,
    questions,
    outlineParts,
    verses,
    review: REVIEWS[review],
    reviewer: orNull(reviewer),
    reviewedAt: date === -1 ? null : dates[date],
    drafter: orNull(drafter),
    rebinds,
    problems: orNull(problems),
  };
}

export const packedState = (row: PackedRow): GuideRow["state"] =>
  typeof row === "number" ? "none" : row[1] === 2 ? "current" : "earlier";
