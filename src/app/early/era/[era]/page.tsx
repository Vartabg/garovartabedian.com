import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ERAS, eraById, textsForEra } from "@/lib/early/client";
import EarlyTextCard from "../../EarlyTextCard";

type PageProps = { params: Promise<{ era: string }> };

export function generateStaticParams() {
  return ERAS.map((era) => ({ era: era.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { era: id } = await params;
  const era = eraById(id);
  return era
    ? {
        title: era.label,
        description: era.blurb,
        alternates: { canonical: `/early/era/${era.id}` },
        openGraph: {
          title: `${era.label} — The Writings`,
          description: era.blurb,
          type: "article",
          url: `/early/era/${era.id}`,
        },
      }
    : { title: "The Writings" };
}

export default async function EraPage({ params }: PageProps) {
  const { era: id } = await params;
  const era = eraById(id);
  if (!era) notFound();

  const texts = textsForEra(era.id);
  const index = ERAS.findIndex((e) => e.id === era.id);
  const prev = ERAS[index - 1];
  const next = ERAS[index + 1];

  return (
    <>
      <p className="kicker">
        <Link href="/early">The Writings</Link>
      </p>

      <header className="ew-era-header">
        <p className="ew-era-badge">Era</p>
        <h1>{era.label}</h1>
        <p className="world-cite">{era.range}</p>
      </header>

      <p className="lede">{era.blurb}</p>

      <p className="scr-meta">
        {texts.length} {texts.length === 1 ? "writing" : "writings"} in this era
      </p>
      <p><Link href={`/early/library?group=${era.id === "apologists" ? "interpreters" : era.id}`}>Explore additional editions and related works in the library →</Link></p>

      <div className="scr-cards">
        {texts.map((t) => (
          <EarlyTextCard key={t.id} text={t} />
        ))}
      </div>

      <nav className="ew-era-pager" aria-label="Move between eras">
        {prev ? (
          <Link href={`/early/era/${prev.id}`}>
            <span>← Earlier</span>
            <strong>{prev.label}</strong>
          </Link>
        ) : (
          <span />
        )}
        <Link href="/early" className="ew-era-pager-all">
          All eras
        </Link>
        {next ? (
          <Link href={`/early/era/${next.id}`}>
            <span>Later →</span>
            <strong>{next.label}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
