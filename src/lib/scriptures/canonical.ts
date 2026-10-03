/**
 * Canonical URLs for hosted Scripture pages, plus the SSG param lists the
 * sitemap shares with generateStaticParams.
 *
 * Several traditions host the same World English Bible text for overlapping
 * books. Those pages must not look like five independent documents to crawlers.
 * Rewrite to the Protestant URL only when this tradition's default translation
 * for the book is WEB and the book exists on the Protestant shelf. Catholic
 * (DRB), Brenton-only Orthodox OT, and books that are not on the Protestant
 * shelf keep their own URL.
 */
import canonsData from "../../../public/scriptures/canons.json";
import naveIndexData from "../../../public/scriptures/nave/index.json";
import type { Canons, NaveIndex, TranslationId } from "./types";

const canons = canonsData as Canons;
const naveIndex = naveIndexData as NaveIndex;

export const PROTESTANT_ID = "protestant";

/** Same cap `src/app/scriptures/topics/[topic]/page.tsx` uses for SSG. */
export const PREVIEW_TOPIC_LIMIT = 300;

export function defaultTranslation(traditionId: string, bookId: string): TranslationId | null {
  const tradition = canons.traditions.find((item) => item.id === traditionId);
  const available = canons.books[bookId]?.trans ?? [];
  if (tradition) {
    for (const trans of tradition.transPreference) {
      if (available.includes(trans)) return trans;
    }
  }
  return available[0] ?? null;
}

function protestantHasBook(bookId: string): boolean {
  const protestant = canons.traditions.find((item) => item.id === PROTESTANT_ID);
  return protestant?.books.includes(bookId) ?? false;
}

/**
 * True when this tradition's hosted English for `bookId` is the same WEB text
 * Protestant serves (or when this already is the Protestant page).
 */
export function sharesProtestantWebText(traditionId: string, bookId: string): boolean {
  return defaultTranslation(traditionId, bookId) === "web" && protestantHasBook(bookId);
}

/** Tradition that should own the canonical URL for this book. */
export function canonicalTraditionId(traditionId: string, bookId: string): string {
  return sharesProtestantWebText(traditionId, bookId) ? PROTESTANT_ID : traditionId;
}

export function scriptureCanonicalPath(
  traditionId: string,
  bookId: string,
  chapter?: number,
): string {
  const host = canonicalTraditionId(traditionId, bookId);
  const base = `/scriptures/${host}/${bookId}`;
  return chapter == null ? base : `${base}/${chapter}`;
}

export function topicCanonicalPath(topicId: string): string {
  return `/scriptures/topics/${encodeURIComponent(topicId)}`;
}

/** Same tradition×book list as `generateStaticParams` on the book page. */
export function ssgBookParams(): { tradition: string; book: string }[] {
  const params: { tradition: string; book: string }[] = [];
  for (const tradition of canons.traditions) {
    for (const book of tradition.books) {
      params.push({ tradition: tradition.id, book });
    }
  }
  return params;
}

/** Same top-N topic ids as `generateStaticParams` on the topic page. */
export function ssgTopicIds(): string[] {
  return naveIndex.topics
    .slice()
    .sort((a, b) => b.refCount - a.refCount)
    .slice(0, PREVIEW_TOPIC_LIMIT)
    .map((topic) => topic.id);
}
