import { getParables } from "@/lib/jesus/server";
import { getThomasTexts } from "@/lib/jesus/thomas-parallels-server";
import { SYNOPTIC_FIGURES } from "@/lib/jesus/synoptic-figures";
import { JOHN_FIGURES } from "@/lib/jesus/john-figures";
import { THOMAS_PARABLES } from "@/lib/jesus/thomas-parables";
import { JAMES_PARABLES } from "@/lib/jesus/james-parables";
import { getJamesTexts } from "@/lib/jesus/james-parables-server";
import { getEarlyFigureTexts, getEarlyOriginalReaderAvailability } from "@/lib/jesus/early-figures-server";
import { EARLY_FIGURES } from "@/lib/jesus/early-figures";
import { canons } from "@/lib/scriptures/server/canons";
import { getOriginalChapter, originalManifest } from "@/lib/scriptures/server";
import ParableWalk from "./ParableWalk";
import ParablesRoom, { type ParableWordCounts } from "./ParablesRoom";
import { linkedThomasSayings, parablesXrayTags } from "@/lib/jesus/parables-xray";
import { hostedWebVerse } from "@/lib/scriptures/hosted-verse";

const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

/** How often each Gospel uses parabolē and paroimia, counted in the hosted SBLGNT. */
async function countParableWords(): Promise<{ counts: ParableWordCounts; scanned: { words: number; chapters: number } }> {
  const counts: ParableWordCounts = {};
  const scanned = { words: 0, chapters: 0 };
  for (const book of GOSPELS) {
    const tally = { parabole: 0, paroimia: 0 };
    for (let chapter = 1; chapter <= canons.books[book].chapters; chapter++) {
      const original = await getOriginalChapter(book, chapter);
      if (original) scanned.chapters++;
      for (const verse of original?.verses ?? []) {
        for (const word of verse.words) {
          scanned.words++;
          if (word.lemma === "παραβολή") tally.parabole++;
          if (word.lemma === "παροιμία") tally.paroimia++;
        }
      }
    }
    counts[book] = tally;
  }
  return { counts, scanned };
}

/** Parables — the list from the server; passages load when one is opened. */
export default async function ParablesPage({
  searchParams,
}: {
  searchParams: Promise<{ story?: string | string[] }>;
}) {
  const { story } = await searchParams;
  const parables = getParables();
  const jamesTexts = await getJamesTexts();
  const earlyFigureTexts = await getEarlyFigureTexts();
  const { counts, scanned } = await countParableWords();
  const xrayTags = parablesXrayTags(
    {
      parables,
      synoptic: SYNOPTIC_FIGURES,
      john: JOHN_FIGURES,
      thomas: THOMAS_PARABLES,
      checked: { ...jamesTexts, ...earlyFigureTexts },
      writings: new Set([...EARLY_FIGURES.map((figure) => figure.work), ...(JAMES_PARABLES.length ? ["Secret Book of James"] : [])]).size,
      counts,
      scanned,
    },
    linkedThomasSayings({ parables, synoptic: SYNOPTIC_FIGURES, john: JOHN_FIGURES, thomas: THOMAS_PARABLES }, [...JAMES_PARABLES, ...EARLY_FIGURES]),
  );
  return (
    <ParablesRoom
      parables={parables}
      thomasStories={THOMAS_PARABLES}
      thomasTexts={await getThomasTexts([...parables, ...SYNOPTIC_FIGURES, ...JOHN_FIGURES, ...EARLY_FIGURES, ...JAMES_PARABLES, ...THOMAS_PARABLES.map(({ saying }) => ({ thomas: [{ saying }] }))])}
      jamesTexts={jamesTexts}
      earlyFigureTexts={earlyFigureTexts}
      earlyReaderAvailability={await getEarlyOriginalReaderAvailability()}
      counts={counts}
      xrayTags={xrayTags}
      canons={canons}
      originalEditions={originalManifest.books}
      opening={[
        { cite: "Matthew 13:31", href: "/scriptures/protestant/MAT/13#v31", text: hostedWebVerse("MAT", 13, 31) },
        { cite: "Luke 13:18", href: "/scriptures/protestant/LUK/13#v18", text: hostedWebVerse("LUK", 13, 18) },
      ]}
    >
      <ParableWalk story={story} />
    </ParablesRoom>
  );
}
