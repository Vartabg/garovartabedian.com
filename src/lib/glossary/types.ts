/**
 * Inline glossary — contracts.
 * Entries explain terms a modern reader stumbles on (ancient names, places,
 * offices, translation wording) in place, without leaving the page.
 */

export type GlossKind =
  | "person"
  | "place"
  | "group"
  | "text"
  | "office"
  | "concept"
  | "event"
  | "translation"
  | "object";

export type GlossEntry = {
  id: string;
  /** Display form shown in the popover title. */
  term: string;
  /** Surface forms to match in prose, as they appear in the texts. */
  variants: string[];
  kind: GlossKind;
  /** 1–2 plain sentences of neutral, consensus scholarship. */
  def: string;
  /** Rough pronunciation, only for genuinely hard names. */
  say?: string;
};

/** The subset of an entry a popover needs — embedded into segments so
 *  server-rendered pages don't ship the whole glossary to the client. */
export type GlossRef = Pick<GlossEntry, "id" | "term" | "kind" | "def" | "say">;

/** A run of plain text, or a matched term carrying its own definition. */
export type GlossSegment = string | { text: string; entry: GlossRef };
