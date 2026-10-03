"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { NaveIndex } from "@/lib/scriptures/types";

function TopicAtlas({
  topics,
  sections,
  activeSection,
  setActiveSection,
}: {
  topics: NaveIndex["topics"];
  sections: string[];
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}) {
  const rows = sections.map((section) => {
    const group = topics.filter((t) => t.section === section);
    return {
      section,
      count: group.length,
      refs: group.reduce((sum, t) => sum + t.refCount, 0),
    };
  });
  const max = Math.max(1, ...rows.map((row) => row.count));
  const totalRefs = rows.reduce((sum, row) => sum + row.refs, 0);

  return (
    <section className="scr-topic-atlas" aria-label="Topic index density by letter">
      <div className="scr-search-lens-head">
        <strong>Index density</strong>
        <span>{totalRefs.toLocaleString()} scripture references</span>
      </div>
      <div className="scr-topic-bars">
        {rows.map((row) => (
          <button
            key={row.section}
            type="button"
            className={activeSection === row.section ? "is-active" : ""}
            aria-pressed={activeSection === row.section}
            onClick={() => setActiveSection(activeSection === row.section ? null : row.section)}
            style={{ "--h": `${Math.max(18, (row.count / max) * 100)}%` } as CSSProperties}
            aria-label={`${row.section}: ${row.count} topics`}
          >
            <span className="scr-topic-bar" />
            <span className="scr-topic-letter">{row.section}</span>
            <span className="scr-topic-count">{row.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function TopicsRoom({ data }: { data: NaveIndex }) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = useMemo(
    () => [...new Set(data.topics.map((t) => t.section))].sort(),
    [data],
  );

  const shown = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = data.topics;
    if (activeSection) list = list.filter((t) => t.section === activeSection);
    if (q) list = list.filter((t) => t.id.includes(q));
    return list.slice(0, 400);
  }, [data, query, activeSection]);

  return (
    <>
      <p className="kicker">Scriptures</p>
      <h1>Topics.</h1>
      <p className="lede">
        Nave&rsquo;s Topical Bible, 1897 — {data.topics.length.toLocaleString()}{" "}
        subjects, every scripture reference verified against the text hosted
        here. Long before software could search a Bible, this book already
        had.
      </p>

      <input
        type="text"
        className="scr-topics-search"
        placeholder="Search a topic — e.g. Faith, Forgiveness, Angels"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveSection(null);
        }}
        aria-label="Search topics"
      />

      <TopicAtlas
        topics={data.topics}
        sections={sections}
        activeSection={activeSection}
        setActiveSection={(section) => {
          setActiveSection(section);
          setQuery("");
        }}
      />

      <nav className="scr-topics-az" aria-label="Browse by letter">
        {sections.map((s) => (
          <button
            key={s}
            type="button"
            className={activeSection === s ? "is-active" : ""}
            aria-pressed={activeSection === s}
            onClick={() => {
              setActiveSection(activeSection === s ? null : s);
              setQuery("");
            }}
          >
            {s}
          </button>
        ))}
      </nav>

      {shown.length > 0 ? (
        <ul className="scr-topics-list">
          {shown.map((t) => (
            <li key={t.id}>
              <Link href={`/scriptures/topics/${encodeURIComponent(t.id)}`}>
                {t.id.charAt(0) + t.id.slice(1).toLowerCase()}
              </Link>
              <span>{t.refCount}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="scr-empty" role="status">
          <p>
            {query
              ? `No topics match “${query.trim()}”. Try another word or clear the search.`
              : `No topics are listed under ${activeSection}. Clear the filter to see every topic.`}
          </p>
          <button
            type="button"
            className="scr-btn"
            onClick={() => {
              setQuery("");
              setActiveSection(null);
            }}
          >
            Clear search
          </button>
        </div>
      )}
      {shown.length > 0 && data.topics.length > shown.length && (query || activeSection) && (
        <p className="scr-meta">Showing the first 400 matches — narrow your search for more.</p>
      )}
    </>
  );
}
