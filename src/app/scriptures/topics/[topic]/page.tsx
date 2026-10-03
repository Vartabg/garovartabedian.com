import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ssgTopicIds, topicCanonicalPath } from "@/lib/scriptures/canonical";
import { canons, traditionFor } from "@/lib/scriptures/server/canons";
import { getNaveTopic, topicTitle } from "@/lib/scriptures/server/nave";
import { parseRef } from "@/lib/scriptures/refs";
import { segmentText } from "@/lib/glossary/segment";
import { GlossSegments } from "@/app/_components/Gloss";
import CanonStrip from "../../_components/CanonStrip";

type PageProps = {
  params: Promise<{ topic: string }>;
};

// Prerender only the most-referenced topics (refCount is a natural popularity
// proxy); the long tail renders on demand and is cached for a day via ISR.
// This keeps the build small (a few hundred pages, not ~5,300) while the
// popular topics stay instantly available and SEO-friendly.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return ssgTopicIds().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic } = await params;
  const id = decodeURIComponent(topic);
  const title = topicTitle(id);
  const description = `Nave's Topical Bible: every scripture reference on "${title}."`;
  const url = topicCanonicalPath(id);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Bible Topics`,
      description,
      type: "article",
      url,
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic } = await params;
  const id = decodeURIComponent(topic);
  const data = await getNaveTopic(id);
  if (!data) notFound();

  /** "BOOK C" or "BOOK C:V[-V2]" -> a reader link + display label. */
  const refLink = (ref: string) => {
    const meta = canons.books;
    const whole = /^([1-3]?[A-Z]{2,4})\s+(\d+)$/.exec(ref);
    if (whole) {
      const [, book, ch] = whole;
      const bm = meta[book];
      if (!bm) return null;
      return {
        label: `${bm.name} ${ch}`,
        href: `/scriptures/${traditionFor(book)}/${book}/${ch}`,
      };
    }
    const parsed = parseRef(ref);
    const bm = parsed && meta[parsed.book];
    if (!parsed || !bm) return null;
    return {
      label: `${bm.name} ${parsed.chapter}:${parsed.verse}${
        parsed.endVerse ? `–${parsed.endVerse}` : ""
      }`,
      href: `/scriptures/${traditionFor(parsed.book)}/${parsed.book}/${parsed.chapter}#v${parsed.verse}`,
    };
  };

  const title = topicTitle(id);
  // Glossary: dot a foreign term once per page.
  const glossSeen = new Map<string, string>();

  return (
    <>
      <p className="kicker">
        <Link href="/scriptures/topics">Topics</Link>
      </p>
      <h1>{title}</h1>
      <p className="world-cite">
        Nave&rsquo;s Topical Bible, 1897 ·{" "}
        <Link href="/sources#scripture-texts" className="textlink">
          source
        </Link>
      </p>

      <CanonStrip canons={canons} refs={data.items.flatMap((item) => item.refs)} />

      <ul className="scr-topic-items">
        {data.items.map((item, index) => (
          <li key={index} className={item.depth > 0 ? "is-sub" : ""}>
            {item.see ? (
              <>
                See{" "}
                <Link href={`/scriptures/topics/${encodeURIComponent(item.see)}`}>
                  {topicTitle(item.see)}
                </Link>
              </>
            ) : (
              <>
                <GlossSegments segments={segmentText(item.label, glossSeen)} />
                {item.refs.length > 0 && (
                  <span className="an-refs">
                    {" "}
                    {item.refs.map((ref) => {
                      const link = refLink(ref);
                      return link ? (
                        <Link key={ref} href={link.href}>
                          {link.label}
                        </Link>
                      ) : (
                        <span key={ref}>{ref}</span>
                      );
                    })}
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
