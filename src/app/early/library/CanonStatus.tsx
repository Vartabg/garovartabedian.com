import Link from "next/link";
import { getLibrary } from "@/lib/early/library-server";
import type { LibraryRecord } from "@/lib/early/library";

/** Shown on the edition page and on every reading page, so a reader who lands on one saying still sees it. */
export default function CanonStatus({ record }: { record: Pick<LibraryRecord, "canonStatus"> }) {
  if (!record.canonStatus) return null;
  return <p className="ew-canon-status">{record.canonStatus} <Link className="textlink" href="/scriptures">The Scriptures shelf →</Link></p>;
}

/** A shelf text read in place of a labelled library edition carries that edition's label. */
export async function ShelfCanonStatus({ textId }: { textId: string }) {
  const record = (await getLibrary()).find(r => r.existingTextId === textId && r.canonStatus);
  return record ? <CanonStatus record={record} /> : null;
}
