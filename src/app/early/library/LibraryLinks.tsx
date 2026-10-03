import Link from "next/link";
import { getLibrary } from "@/lib/early/library-server";
import { recordHref } from "@/lib/early/library";

export default async function LibraryLinks({ textId }: { textId: string }) {
  const records = (await getLibrary()).filter(record => record.existingTextId === textId);
  if (!records.length) return null;
  return <aside className="world-survival" aria-label="Other editions of this work">
    <h2 className="jsu-chapter">Other editions of this work</h2>
    <p>This page keeps its existing translation and passage links. Choose an edition with its own citations:</p>
    <ul>{records.map(record => <li key={record.id}><Link href={recordHref(record)} prefetch={false}>{record.editionLabel}</Link> — {record.coverage}</li>)}</ul>
    {textId === "1clement" && <p>The transcription on this page has 59 chapter headings. The complete Lightfoot edition has all 65.</p>}
  </aside>;
}
