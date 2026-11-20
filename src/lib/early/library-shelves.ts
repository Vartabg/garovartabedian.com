import { LIBRARY_GROUPS, recordHref, type LibraryRecord } from "./library";

/** A shelf folds a name into one row once it leads this many of the shelf's entries. */
export const AUTHOR_FOLD_MIN = 3;
/** How many names a closed shelf lists under its label. */
export const SHELF_NAMES_SHOWN = 5;

export type ShelfEntry = {
  id: string;
  href: string;
  title: string;
  edition: string;
  status: LibraryRecord["publicationStatus"];
  workId: string;
};
export type ShelfData = { id: LibraryRecord["group"]; label: string; entries: ShelfEntry[] };
export type ShelfUnit =
  | { kind: "entry"; entry: ShelfEntry }
  | {
      kind: "author";
      name: string;
      /** Set when every entry under the name shares one edition label. */
      edition: string | null;
      entries: { entry: ShelfEntry; title: string }[];
    };

/** Said only when an entry cannot be read here; a readable entry carries no label. */
export const SHELF_STATUS_LABELS: Partial<Record<ShelfEntry["status"], string>> = {
  "reference-only": "Reference only",
  deferred: "Not yet acquired",
};

/** The catalog cut down to what a shelf row shows, in catalog order, empty shelves left out. */
export function buildShelves(catalog: LibraryRecord[]): ShelfData[] {
  return LIBRARY_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    entries: catalog
      .filter((record) => record.group === group.id)
      .map((record) => ({
        id: record.id,
        href: recordHref(record),
        title: record.title,
        edition: record.editionLabel,
        status: record.publicationStatus,
        workId: record.workId,
      })),
  })).filter((shelf) => shelf.entries.length > 0);
}

/** "Philo: On the Creation" -> ["Philo", "On the Creation"]; a title with no "Name: " lead -> null. */
function splitLead(title: string): [string, string] | null {
  const at = title.indexOf(": ");
  if (at < 2 || at > 28 || title.slice(0, at).includes("—")) return null;
  return [title.slice(0, at), title.slice(at + 2)];
}

/** One shelf's rows: entries in order, with a name that leads three or more of them folded into one row. */
export function shelfUnits(entries: ShelfEntry[]): ShelfUnit[] {
  const leads = entries.map((entry) => splitLead(entry.title));
  const size = new Map<string, number>();
  for (const lead of leads) if (lead) size.set(lead[0], (size.get(lead[0]) ?? 0) + 1);

  const units: ShelfUnit[] = [];
  const folds = new Map<string, Extract<ShelfUnit, { kind: "author" }>>();
  entries.forEach((entry, index) => {
    const lead = leads[index];
    if (!lead || (size.get(lead[0]) ?? 0) < AUTHOR_FOLD_MIN) {
      units.push({ kind: "entry", entry });
      return;
    }
    let fold = folds.get(lead[0]);
    if (!fold) {
      fold = { kind: "author", name: lead[0], edition: entry.edition, entries: [] };
      folds.set(lead[0], fold);
      units.push(fold);
    }
    if (fold.edition !== entry.edition) fold.edition = null;
    fold.entries.push({ entry, title: lead[1] });
  });
  return units;
}

/** The names a closed shelf lists: each folded name or short title once, in shelf order. */
export function shelfNames(units: ShelfUnit[]): string[] {
  const names = units.map((unit) =>
    unit.kind === "author"
      ? unit.name
      : unit.entry.title.replace(/^The /, "").replace(/ — .*$/, "").replace(/: .*$/, ""),
  );
  return [...new Set(names)];
}

/** Whether an entry matches what was typed into the find box (title or edition, any case). */
export function entryMatches(entry: ShelfEntry, query: string): boolean {
  const needle = query.trim().toLowerCase().slice(0, 160);
  return !needle || `${entry.title} ${entry.edition}`.toLowerCase().includes(needle);
}

/** Each shelf cut to its matching entries, shelves with none left out. */
export function filterShelves(shelves: ShelfData[], query: string, work = ""): ShelfData[] {
  return shelves
    .map((shelf) => ({
      ...shelf,
      entries: shelf.entries.filter((entry) => (!work || entry.workId === work) && entryMatches(entry, query)),
    }))
    .filter((shelf) => shelf.entries.length > 0);
}
