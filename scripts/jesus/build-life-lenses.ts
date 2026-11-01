/**
 * Builds the data for the /jesus landing: the forty moments of his life, each
 * joined by Scripture reference to what the other rooms hold about it.
 *
 *   public/jesus/life-lenses.json         the index the page renders: moments,
 *                                         places, map paths and per-lens counts
 *   public/jesus/life-lenses-detail.json  what each lens shows, loaded by the
 *                                         page in the background
 *
 * Every join is a reference overlap (MAT 4:1-11 against MAT 4:4), so nothing
 * is matched by hand: his words come from public/jesus/words.json, prophecy
 * pairs from prophecies.json (by their New Testament readings), word-by-word
 * comparisons from synoptic-pericopes.json, and the hour-by-hour sources from
 * risen.json. Passage text is the hosted World English Bible.
 *
 * Run: npx tsx scripts/jesus/build-life-lenses.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ATLAS_LAND, ATLAS_WATER } from "../../src/app/jesus/life/atlas-geography";
import { PLACES, jordanRiverPath, ringPath } from "../../src/app/jesus/life/geo";
import type {
  LifeLensesDetail,
  LifeLensesIndex,
  LifeLensMomentDetail,
} from "../../src/lib/jesus/life-lenses";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LIFE_LENSES_PATH = "public/jesus/life-lenses.json";
export const LIFE_LENSES_DETAIL_PATH = "public/jesus/life-lenses-detail.json";

/** The four Gospels, in canonical order; other books follow them. */
const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

type Span = { book: string; from: [number, number]; to: [number, number] };
type Ref = { ref: string };

function parseRef(ref: string): Span {
  const m = ref.trim().match(/^([1-3A-Z]{3}) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m) throw new Error(`Unreadable reference: ${ref}`);
  const [, book, c1, v1, c2, v2] = m;
  return {
    book,
    from: [Number(c1), Number(v1)],
    to: [c2 ? Number(c2) : Number(c1), v2 ? Number(v2) : Number(v1)],
  };
}

const compare = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];
const contains = (s: Span, chapter: number, verse: number) =>
  compare(s.from, [chapter, verse]) <= 0 && compare([chapter, verse], s.to) <= 0;
const overlaps = (a: Span, b: Span) =>
  a.book === b.book && compare(a.to, b.from) >= 0 && compare(b.to, a.from) >= 0;

export function buildLifeLenses(root = ROOT): { index: LifeLensesIndex; detail: LifeLensesDetail } {
  const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
  const life = read("public/jesus/life.json") as {
    eras: { id: string; name: string }[];
    events: { id: string; era: string; title: string; place: string; line: string; refs: Ref[] }[];
  };
  const words = read("public/jesus/words.json").books as Record<string, Record<string, string>>;
  const prophecies = read("public/jesus/prophecies.json") as {
    id: string; theme: string; line: string; connection: string; prophecy: Ref; fulfillment: Ref[];
  }[];
  const pericopes = (read("public/jesus/synoptic-pericopes.json") as {
    pericopes: { id: string; title: string; witnesses: Record<string, Ref> }[];
  }).pericopes;
  const risen = read("public/jesus/risen.json") as {
    moments: { id: string; movement: string; refs: Ref[] }[];
  };
  const doorways = read("public/scriptures/doorways.json") as { books: Record<string, { name: string }> };
  const bookName = (id: string) => doorways.books[id]?.name ?? id;

  const texts = new Map<string, string[][]>();
  const chapters = (book: string) => {
    if (!texts.has(book)) texts.set(book, read(`public/scriptures/text/web/${book}.json`).chapters);
    return texts.get(book)!;
  };
  /** Verses in a span as [label, text]; labels carry the chapter only when the span crosses one. */
  const versesOf = (s: Span): [string, string][] => {
    const out: [string, string][] = [];
    for (let c = s.from[0]; c <= s.to[0]; c++) {
      (chapters(s.book)[c - 1] ?? []).forEach((text, i) => {
        if (contains(s, c, i + 1)) out.push([s.from[0] === s.to[0] ? `${i + 1}` : `${c}:${i + 1}`, text]);
      });
    }
    if (!out.length) throw new Error(`No hosted text for ${s.book} ${s.from.join(":")}`);
    return out;
  };
  const label = (ref: string) => {
    const s = parseRef(ref);
    return `${bookName(s.book)} ${ref.slice(s.book.length + 1)}`;
  };

  const placeIds = new Set(life.events.map((e) => e.place));
  const places = PLACES.filter((p) => placeIds.has(p.id)).map((p) => ({
    id: p.id,
    name: p.name,
    modern: p.modern,
    x: p.x,
    y: p.y,
  }));
  for (const e of life.events) {
    if (!places.some((p) => p.id === e.place)) throw new Error(`${e.id}: no map place "${e.place}"`);
  }
  // Atlas rings are [lng, lat]; ringPath projects [lat, lng].
  const flip = (ring: [number, number][]) => ring.map(([lng, lat]) => [lat, lng] as [number, number]);

  const index: LifeLensesIndex = {
    schemaVersion: 1,
    eras: life.eras,
    places,
    map: {
      land: ATLAS_LAND.map((r) => ringPath(flip(r))).join(" "),
      water: ATLAS_WATER.map((r) => ringPath(flip(r))).join(" "),
      jordan: jordanRiverPath(),
    },
    moments: [],
  };
  const detail: LifeLensesDetail = { schemaVersion: 1, moments: {} };

  for (const e of life.events) {
    const spans = e.refs.map((r) => parseRef(r.ref));
    const order = (book: string) => (GOSPELS.includes(book) ? GOSPELS.indexOf(book) : GOSPELS.length);
    const passages = spans
      .map((s, i) => ({ s, ref: e.refs[i].ref }))
      .sort((a, b) => order(a.s.book) - order(b.s.book))
      .map(({ s, ref }) => ({
        ref: label(ref),
        book: s.book,
        chapter: s.from[0],
        verse: s.from[1],
        verses: versesOf(s),
      }));

    const said: LifeLensMomentDetail["words"] = [];
    for (const s of spans) {
      const book = words[s.book] ?? {};
      for (const [key, text] of Object.entries(book)) {
        const [chapter, verse] = key.split(":").map(Number);
        if (contains(s, chapter, verse)) said.push({ ref: `${bookName(s.book)} ${key}`, text });
      }
    }

    const prophecy = prophecies
      .filter((p) => p.fulfillment.some((f) => spans.some((s) => overlaps(parseRef(f.ref), s))))
      .map((p) => ({
        id: p.id,
        theme: p.theme,
        line: p.line,
        connection: p.connection,
        from: { ref: label(p.prophecy.ref), text: versesOf(parseRef(p.prophecy.ref)).slice(0, 3).map(([, t]) => t).join(" ") },
        to: p.fulfillment.map((f) => label(f.ref)),
      }));

    const harmony = pericopes
      .filter((p) => p.id === e.id || Object.values(p.witnesses).some((w) => spans.some((s) => overlaps(parseRef(w.ref), s))))
      .map((p) => ({ id: p.id, title: p.title }));

    const witnesses = risen.moments.filter((m) => m.refs.some((r) => spans.some((s) => overlaps(parseRef(r.ref), s))));

    index.moments.push({
      id: e.id,
      era: e.era,
      title: e.title,
      line: e.line,
      place: e.place,
      refs: passages.map((p) => p.ref),
      books: [...new Set(passages.map((p) => p.book))],
      counts: { words: said.length, prophecy: prophecy.length },
      harmony,
      risen: witnesses.length ? { count: witnesses.length, section: witnesses[0].movement } : null,
    });
    detail.moments[e.id] = { passages, words: said, prophecy };
  }
  return { index, detail };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { index, detail } = buildLifeLenses();
  writeFileSync(path.join(ROOT, LIFE_LENSES_PATH), `${JSON.stringify(index)}\n`);
  writeFileSync(path.join(ROOT, LIFE_LENSES_DETAIL_PATH), `${JSON.stringify(detail)}\n`);
  const kb = (o: unknown) => `${Math.round(JSON.stringify(o).length / 1024)} KB`;
  console.log(`${LIFE_LENSES_PATH}: ${index.moments.length} moments, ${index.places.length} places, ${kb(index)}`);
  console.log(`${LIFE_LENSES_DETAIL_PATH}: ${kb(detail)}`);
}
