import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { scriptureCanonicalPath } from "@/lib/scriptures/canonical";
import {
  canons,
  getBookText,
  getBookBriefing,
  getChapterGuide,
  getChapterNeighbours,
  getChapterXray,
  hasOriginalChapter,
  pickTranslation,
} from "@/lib/scriptures/server";
import { ORIGINAL_EDITION_DISPLAY } from "@/lib/scriptures/original-editions";
import { SCRIPTURE_SOURCES } from "@/lib/scriptures/sources";
import { chapterXrayTags } from "@/lib/scriptures/xray-tags";
import { CORPUS_HEALTH } from "@/lib/site/corpus-health";
import { getUnseenForChapter } from "@/lib/angels/chapter-index";
import { chapterContinuation } from "@/lib/scriptures/chapter-continuation";
import ReaderClient from "./ReaderClient";

type PageProps = {
  params: Promise<{ tradition: string; book: string; chapter: string }>;
};

export function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildPage(params).then(([tradition, bookId, chapterNumber]) => {
    if (!tradition) return { title: "Scripture chapter" };
    const title = `${canons.books[bookId].name} ${chapterNumber}`;
    const description = `Read ${title} with verse links, listening controls, cross-references, and public-domain translation options.`;
    const url = `/scriptures/${tradition.id}/${bookId}/${chapterNumber}`;
    return {
      title,
      description,
      alternates: { canonical: scriptureCanonicalPath(tradition.id, bookId, chapterNumber) },
      openGraph: {
        title: `${title} — Scriptures`,
        description,
        type: "article",
        url,
      },
    };
  });
}

/** Validate (tradition, book, chapter) against the canons; null tradition = invalid. */
async function buildPage(
  params: PageProps["params"],
): Promise<
  [tradition: (typeof canons.traditions)[number] | null, bookId: string, chapter: number]
> {
  const { tradition: traditionId, book, chapter } = await params;
  const bookId = book.toUpperCase();
  const chapterNumber = Number(chapter);
  const tradition = canons.traditions.find((item) => item.id === traditionId);
  const meta = canons.books[bookId];
  if (
    !tradition ||
    !meta ||
    !tradition.books.includes(bookId) ||
    !Number.isInteger(chapterNumber) ||
    chapterNumber < 1 ||
    chapterNumber > meta.chapters
  ) {
    return [null, bookId, chapterNumber];
  }
  return [tradition, bookId, chapterNumber];
}

/**
 * Every chapter of every tradition, pre-rendered. 6,680 reading pages were
 * previously server-rendered per request because the translation, comparison,
 * and original-language views came from search params; the page now bakes the
 * tradition's default translation and the client swaps variants from the
 * cached per-book JSON — so every chapter is a static shell served from the
 * CDN, with daily ISR picking up guide/text rebuilds. Unknown params (a canon
 * that changed after a deploy) still render on demand and cache from then on.
 */
export function generateStaticParams() {
  return canons.traditions.flatMap((tradition) =>
    tradition.books.flatMap((bookId) => {
      const meta = canons.books[bookId];
      return Array.from({ length: meta.chapters }, (_, i) => ({
        tradition: tradition.id,
        book: bookId,
        chapter: String(i + 1),
      }));
    }),
  );
}

export const revalidate = 86400;

export default async function ChapterPage({ params }: PageProps) {
  const [tradition, bookId, chapterNumber] = await buildPage(params);
  if (!tradition) notFound();

  const trans = pickTranslation(tradition.transPreference, bookId);
  if (!trans) notFound();
  const originalTranslations = canons.books[bookId].trans.filter((translation) =>
    hasOriginalChapter(bookId, chapterNumber, translation),
  );
  const [text, guide, neighbours, briefing] = await Promise.all([
    getBookText(trans, bookId),
    getChapterGuide(bookId, chapterNumber),
    getChapterNeighbours(bookId, chapterNumber),
    getBookBriefing(bookId),
  ]);
  if (!text) notFound();
  // Serialize only the viewed chapter into the client payload. Passing the
  // whole BookText put every other chapter of the book (Psalms ≈ 226 KB) into
  // the RSC/hydration payload of all ~150 of its chapter pages.
  const verses = text.chapters[chapterNumber - 1] ?? null;
  const unseen = getUnseenForChapter(bookId, chapterNumber);
  // The Engineer lens's facts about this chapter, computed from the same
  // files the regions render, then worded once here so the client gets text.
  const xray = await getChapterXray({ bookId, chapter: chapterNumber, translation: trans, verses, originalTranslations, guide, neighbours, unseen });
  const guides = CORPUS_HEALTH.corpus.guides;
  const xrayTags = chapterXrayTags(xray, {
    translationName: canons.translations[trans].name,
    bookId,
    bookName: canons.books[bookId].name,
    bookNameFor: (id) => canons.books[id]?.name ?? id,
    source: SCRIPTURE_SOURCES[trans],
    originalName: (edition) => (edition in ORIGINAL_EDITION_DISPLAY ? ORIGINAL_EDITION_DISPLAY[edition as keyof typeof ORIGINAL_EDITION_DISPLAY].name : edition),
    guides: { files: guides.files, chapterSlots: CORPUS_HEALTH.corpus.books.unionChapterSlots, agentReviewed: guides.review.agentReviewed, humanReviewed: guides.review.humanReviewed, untracked: guides.review.untracked, batchTemplate: guides.batchTemplateGuides },
  });

  return (
    <ReaderClient
      canons={canons}
      initialTrans={trans}
      initialVerses={verses}
      chapterCount={text.chapters.length}
      traditionId={tradition.id}
      bookId={bookId}
      chapter={chapterNumber}
      originalTranslations={originalTranslations}
      initialGuide={guide}
      guideSources={briefing?.sources ?? []}
      neighbours={neighbours}
      unseen={unseen}
      continuation={chapterContinuation(bookId, chapterNumber)}
      xrayTags={xrayTags}
    />
  );
}
