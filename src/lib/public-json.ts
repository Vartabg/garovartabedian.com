/**
 * Typed static imports of world-home JSON under public/.
 * Server components import these so the first paint has real content —
 * no client useEffect spinner.
 */

import earlyTimeline from "../../public/early/timeline.json";
import earlyIgnatius from "../../public/early/ignatius.json";
import wordData from "../../public/word/data.json";
import wordCases from "../../public/word/cases.json";
import wordLedger from "../../public/word/ledger.json";
import wordFree from "../../public/word/free.json";
import canonsJson from "../../public/scriptures/canons.json";
import narrationManifest from "../../public/scriptures/audio/manifest.json";
import type { TimelineData, IgnatiusData } from "./early/types";
import type {
  CasesData,
  FreeChainData,
  FreeChainView,
  WordData,
  WordLedger,
} from "./word/types";
import type { Canons, TranslationId } from "./scriptures/types";
import { defaultTranslation } from "./scriptures/canonical";
import { CORPUS_HEALTH } from "./site/corpus-health";
import {
  getAngelsOrder,
  getTeaching,
} from "./angels/server";
import {
  getChurchRoad,
  getChurchTree,
  churchSpineForks as churchForksFromTree,
} from "./church/server";

export { getAngelsOrder, getTeaching, getChurchRoad, getChurchTree };

export const getEarlyTimeline = (): TimelineData => earlyTimeline as TimelineData;
export const getIgnatius = (): IgnatiusData => earlyIgnatius as IgnatiusData;
/**
 * The free-translation cards learn which texts the reader hosts from the
 * corpus-health snapshot, so a newly hosted text cannot silently go unrecorded
 * and the "hosted texts" count on the page never drifts from the reader.
 */
export const getWordData = (): WordData => {
  const base = wordData as Omit<WordData, "ledger" | "hosted">;
  const ids = CORPUS_HEALTH.corpus.translations.ids;
  return {
    ...base,
    free: base.free.map((t) => ({ ...t, onSite: ids.includes(t.readerId ?? t.id) })),
    hosted: { count: CORPUS_HEALTH.corpus.translations.count, ids },
    ledger: wordLedger as WordLedger,
  };
};
export const getCasesData = (): CasesData => wordCases as CasesData;

/**
 * The free way, checked: each hosted text's chain from the data file, with
 * its book and chapter counts and its shelf placement read from the reader's
 * own canon data — so the page cannot claim a shelf the reader does not serve,
 * and a text the reader hosts cannot go untraced (the test enforces that).
 */
export const getFreeChain = (): FreeChainView => {
  const base = wordFree as FreeChainData;
  const canons = canonsJson as Canons;
  const ids = CORPUS_HEALTH.corpus.translations.ids;
  const texts = base.texts.map((text) => {
    const id = text.id as TranslationId;
    const books = Object.values(canons.books).filter((book) => book.trans.includes(id));
    const placement = (isDefault: boolean) =>
      canons.traditions
        .map((tradition) => ({
          tradition: tradition.id,
          label: tradition.name,
          books: tradition.books.filter((book) => {
            const available = canons.books[book]?.trans.includes(id) ?? false;
            return available && (defaultTranslation(tradition.id, book) === id) === isDefault;
          }).length,
        }))
        .filter((shelf) => shelf.books > 0);
    return {
      ...text,
      books: books.length,
      chapters: books.reduce((sum, book) => sum + book.chapters, 0),
      shelves: placement(true),
      alternateShelves: placement(false),
    };
  });
  const semantic = CORPUS_HEALTH.coverage.semanticSearch;
  return {
    ...base,
    texts,
    hosted: { count: CORPUS_HEALTH.corpus.translations.count, ids },
    stats: {
      crossReferenceTargets: CORPUS_HEALTH.corpus.crossReferences.targets,
      topics: CORPUS_HEALTH.corpus.topics.count,
      semanticVerses: semantic?.verses ?? 0,
      semanticModel: semantic?.model ?? "no semantic index",
      narrationChapters: (narrationManifest as { chapters: unknown[] }).chapters.length,
    },
  };
};

/** Great-fork years for the church era spine (from the tree data). */
export function churchSpineForks(
  tree: ReturnType<typeof getChurchTree> = getChurchTree(),
): number[] {
  return churchForksFromTree(tree);
}
