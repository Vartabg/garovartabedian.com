import catalog from "../../../public/early/library-catalog.json";
import type { FindPlace } from "../site/find-catalog";

/** Only titles, edition identities and publication labels enter global Find. */
export const LIBRARY_FIND: FindPlace[] = catalog.entries.map(entry => ({
  id: `library-${entry.id}`, href: entry.href, title: `${entry.title} · ${entry.editionLabel}`,
  note: entry.publicationStatus === "published" ? "Readable edition · The Writings" : entry.publicationStatus === "deferred" ? "Full text not acquired · Catalog record" : "Reference only · Source access and publication limits",
  kind: "text", world: "early", keywords: [entry.workId, entry.group, entry.title, entry.editionLabel],
}));
