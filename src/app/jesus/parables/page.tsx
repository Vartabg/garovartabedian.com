import { getParables } from "@/lib/jesus/server";
import { getThomasTexts } from "@/lib/jesus/thomas-parallels-server";
import { SYNOPTIC_FIGURES } from "@/lib/jesus/synoptic-figures";
import { THOMAS_PARABLES } from "@/lib/jesus/thomas-parables";
import { getJamesTexts } from "@/lib/jesus/james-parables-server";
import { getEarlyFigureTexts } from "@/lib/jesus/early-figures-server";
import { EARLY_FIGURES } from "@/lib/jesus/early-figures";
import { canons } from "@/lib/scriptures/server/canons";
import { getOriginalChapter, originalManifest } from "@/lib/scriptures/server";
import ParablesRoom, { type ParableWordCounts } from "./ParablesRoom";

const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

/** How often each Gospel uses parabolē and paroimia, counted in the hosted SBLGNT. */
async function countParableWords(): Promise<ParableWordCounts> {
  const counts: ParableWordCounts = {};
  for (const book of GOSPELS) {
    const tally = { parabole: 0, paroimia: 0 };
    for (let chapter = 1; chapter <= canons.books[book].chapters; chapter++) {
      const original = await getOriginalChapter(book, chapter);
      for (const verse of original?.verses ?? []) {
        for (const word of verse.words) {
          if (word.lemma === "παραβολή") tally.parabole++;
          if (word.lemma === "παροιμία") tally.paroimia++;
        }
      }
    }
    counts[book] = tally;
  }
  return counts;
}

/** Parables — the list from the server; passages load when one is opened. */
export default async function ParablesPage() {
  const parables = getParables();
  return (
    <ParablesRoom
      parables={parables}
      thomasStories={THOMAS_PARABLES}
      thomasTexts={await getThomasTexts([...parables, ...SYNOPTIC_FIGURES, ...EARLY_FIGURES, ...THOMAS_PARABLES.map(({ saying }) => ({ thomas: [{ saying }] }))])}
      jamesTexts={await getJamesTexts()}
      earlyFigureTexts={await getEarlyFigureTexts()}
      counts={await countParableWords()}
      canons={canons}
      originalEditions={originalManifest.books}
    />
  );
}
