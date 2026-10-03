/** Edition identity is independent of the work, its parts, and manuscript witnesses. */
export const LIBRARY_GROUPS = [
  { id: "jewish", label: "Jewish writings" },
  { id: "fathers", label: "Apostolic Fathers" },
  { id: "apocrypha", label: "Christian apocrypha" },
  { id: "gnostic", label: "Gnostic writings" },
  { id: "interpreters", label: "Early interpreters" },
  { id: "historical", label: "Historical works" },
  { id: "orders", label: "Church orders and canon documents" },
] as const;

export type LibraryKind = "primary-text" | "commentary" | "mixed-edition" | "catalog-note" | "reference-only" | "legacy-edition";
export const KIND_LABELS: Record<LibraryKind, string> = {
  "primary-text": "Translated text",
  commentary: "Edition commentary",
  "mixed-edition": "Translated text with edition notes",
  "catalog-note": "Modern catalog record",
  "reference-only": "Reference only",
  "legacy-edition": "Existing edition",
};
export type LibrarySection = { id: string; label: string; context: string; kind: LibraryKind; chars: number };
export type LibraryRecord = {
  id: string; workId: string; editionId: string | null; editionLabel: string;
  edition: string; editionDate: string | null; compositionDate: string | null;
  compositionNote: string; existingTextId: string | null;
  reuseExistingText: boolean; editionRelation: string;
  group: typeof LIBRARY_GROUPS[number]["id"]; title: string;
  sourceSha256: string | null; sourceWords: number; sourceUrls: string[];
  language: string; coverage: string; sourceRights: string; rightsProfile: string;
  publicationStatus: "published" | "reference-only" | "deferred";
  publicationReason: string; caution: string; witnesses: string[]; provenance: string[];
  sourcePdfSha256?: string | null; sourcePdfPages?: string | null;
  rightsReview: { decision: string; evidence: string[] };
  sections: LibrarySection[]; primaryCharacters: number; commentaryCharacters: number;
};
export type LibraryPage = LibrarySection & {
  headingNoteRefs: string;
  blocks: { text: string; kind: LibraryKind; noteId?: string }[];
  notes: Record<string, { text?: string; href: string }>;
};
export type LibrarySearchRow = {
  id: string; recordId: string; title: string; edition: string; kind: LibraryKind;
  label: string; href: string; text: string;
};
/** Keep this sentence identical in scripts/early/import-library.mjs and content/early-library/report.json. */
export const LIBRARY_MEANING_NOTE = "Expanded editions: translated text is embedded for meaning search. Commentary, reference records, and editions that reuse the original shelf are not embedded again. Similarity is not evidence of historical dependence.";
export const recordHref = (record: Pick<LibraryRecord, "id">) => `/early/library/${record.id}`;
export const sectionHref = (record: Pick<LibraryRecord, "id">, section: Pick<LibrarySection, "id">) => `${recordHref(record)}/${section.id}`;
