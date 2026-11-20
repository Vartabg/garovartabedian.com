import act from "../../../public/scriptures/text/web/ACT.json";
import jhn from "../../../public/scriptures/text/web/JHN.json";
import luk from "../../../public/scriptures/text/web/LUK.json";
import mat from "../../../public/scriptures/text/web/MAT.json";
import mrk from "../../../public/scriptures/text/web/MRK.json";
import { canons } from "@/lib/scriptures/server/canons";
import { parseScriptureQueryRef } from "@/lib/scriptures/refs";

type HostedBook = { chapters: string[][] };

const BOOKS: Record<string, HostedBook> = {
  MAT: mat as HostedBook,
  MRK: mrk as HostedBook,
  LUK: luk as HostedBook,
  JHN: jhn as HostedBook,
  ACT: act as HostedBook,
};

export type MomentOpening = { text: string; cite: string };

/**
 * The first hosted verse of each moment's first reference. The summary line
 * stays; this is the sentence the Gospels already wrote.
 */
export function momentOpenings(moments: { id: string; refs: string[] }[]): Record<string, MomentOpening> {
  const openings: Record<string, MomentOpening> = {};
  for (const moment of moments) {
    const ref = moment.refs[0];
    if (!ref) continue;
    const parsed = parseScriptureQueryRef(ref, canons);
    const chapters = parsed ? BOOKS[parsed.book]?.chapters : undefined;
    const text = parsed && chapters ? chapters[parsed.chapter - 1]?.[parsed.verse - 1] : undefined;
    if (!parsed || !text) continue;
    openings[moment.id] = {
      text,
      cite: `${canons.books[parsed.book].name} ${parsed.chapter}:${parsed.verse}`,
    };
  }
  return openings;
}
