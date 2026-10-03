import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canons } from "@/lib/scriptures/server/canons";
import { getTraditionBriefing } from "@/lib/scriptures/server/tradition-briefings";
import type { Tradition } from "@/lib/scriptures/types";
import BookList from "../_components/BookList";
import TraditionBriefingView, {
  TraditionBriefingDeep,
  TraditionBriefingLead,
} from "./TraditionBriefing";

type PageProps = {
  params: Promise<{ tradition: string }>;
};

export function generateStaticParams() {
  return canons.traditions.map((tradition) => ({ tradition: tradition.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tradition: traditionId } = await params;
  const tradition = canons.traditions.find((item) => item.id === traditionId);
  if (!tradition) return { title: "Scripture tradition" };
  const briefing = await getTraditionBriefing(tradition.id);
  const url = `/scriptures/${tradition.id}`;
  const description = briefing?.oneLine ?? tradition.blurb;
  return {
    title: tradition.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${tradition.name} — Scriptures`,
      description,
      type: "website",
      url,
    },
  };
}

export default async function TraditionBooks({ params }: PageProps) {
  const { tradition: traditionId } = await params;
  const tradition: Tradition | undefined = canons.traditions.find(
    (item) => item.id === traditionId,
  );
  if (!tradition) notFound();
  const briefing = await getTraditionBriefing(tradition.id);

  return (
    <>
      <p className="kicker">
        <Link href="/scriptures">Scriptures</Link>
      </p>
      <h1>{tradition.name}</h1>
      {!briefing && <p className="lede">{tradition.blurb}</p>}

      <nav className="scr-tradition-nav" aria-label="Change scripture tradition">
        <span>Traditions</span>
        {canons.traditions.map((item) =>
          item.id === tradition.id ? (
            <span key={item.id} aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link key={item.id} href={`/scriptures/${item.id}`}>
              {item.name}
            </Link>
          ),
        )}
      </nav>

      {!briefing && tradition.editorial && <p className="scr-note">{tradition.editorial}</p>}
      {!briefing && tradition.linkOut && (
        <p className="scr-note">
          <a
            href={tradition.linkOut.url}
            target="_blank"
            rel="noopener noreferrer"
            className="textlink"
          >
            {tradition.linkOut.label}
          </a>
        </p>
      )}

      {/* The books come before the briefing: a tradition page is how a reader
          gets to a book, and the briefing had grown to five screens above
          the list (seven on a phone). Nothing introduces the list — the title
          and the one line above it already say what shelf this is. */}
      {briefing && <TraditionBriefingLead briefing={briefing} />}

      <BookList tradition={tradition} canons={canons} />

      {briefing && (
        <TraditionBriefingView briefing={briefing} tradition={tradition} canons={canons} />
      )}
      {briefing && (
        <TraditionBriefingDeep briefing={briefing} tradition={tradition} canons={canons} />
      )}
    </>
  );
}
