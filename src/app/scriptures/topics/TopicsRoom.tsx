"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NaveIndex } from "@/lib/scriptures/types";
import { topicTitle } from "@/lib/scriptures/topic-title";
import {
  LARGER_MIN_REFS,
  MATCH_LIMIT,
  largestTopics,
  letterTopics,
  matchTopics,
  type IndexTopic,
} from "@/lib/scriptures/topics-index";

function TopicList({ topics }: { topics: IndexTopic[] }) {
  return (
    <ul className="scr-topics-list">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link href={`/scriptures/topics/${encodeURIComponent(topic.id)}`} prefetch={false}>
            {topicTitle(topic.id)}
          </Link>
          <span>{topic.refCount.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}

function ListHead({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="scr-search-lens-head scr-topics-head">
      <h2>{title}</h2>
      <span>{detail}</span>
    </div>
  );
}

/**
 * Nave's index. It opens on the topics with the most references; a letter lists its
 * larger topics first and keeps the rest one tap away; typing lists the matches.
 */
export default function TopicsRoom({ data }: { data: NaveIndex }) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const total = data.topics.length;

  const sections = useMemo(() => [...new Set(data.topics.map((t) => t.section))].sort(), [data]);
  const largest = useMemo(() => largestTopics(data.topics), [data]);
  const letter = useMemo(
    () => (activeSection ? letterTopics(data.topics, activeSection) : null),
    [data, activeSection],
  );
  const matches = useMemo(() => matchTopics(data.topics, query), [data, query]);
  const searching = Boolean(query.trim());

  const clear = () => {
    setQuery("");
    setActiveSection(null);
  };

  return (
    <>
      <h1>Topics.</h1>
      <p className="lede">
        Nave&rsquo;s Topical Bible, 1897 — {total.toLocaleString()} subjects, every scripture
        reference verified against the text hosted here. Long before software could search
        a Bible, this book already had.
      </p>
      {largest[0] && (
        <p>
          <Link href={`/scriptures/topics/${encodeURIComponent(largest[0].id)}`}>
            {topicTitle(largest[0].id)}
          </Link>
          {" "}is the largest subject here, with {largest[0].refCount.toLocaleString()} scripture references.
        </p>
      )}

      <input
        type="text"
        className="scr-topics-search"
        placeholder="Search a topic (e.g. Faith, Angels)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveSection(null);
        }}
        aria-label="Search topics"
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

      {searching ? (
        matches.length > 0 ? (
          <>
            <ListHead
              title={`${matches.length.toLocaleString()} ${matches.length === 1 ? "topic matches" : "topics match"}`}
              detail="scripture references"
            />
            <TopicList topics={matches.slice(0, MATCH_LIMIT)} />
            {matches.length > MATCH_LIMIT && (
              <p className="scr-meta">Showing the first {MATCH_LIMIT} matches — narrow your search for more.</p>
            )}
          </>
        ) : (
          <div className="scr-empty" role="status">
            <p>{`No topics match “${query.trim()}”. Try another word or clear the search.`}</p>
            <button type="button" className="scr-btn" onClick={clear}>
              Clear search
            </button>
          </div>
        )
      ) : letter && activeSection ? (
        letter.larger.length > 0 ? (
          <>
            <ListHead
              title={activeSection}
              detail={`${letter.larger.length} with ${LARGER_MIN_REFS} or more references`}
            />
            <TopicList topics={letter.larger} />
            <details className="scr-topics-fold" key={activeSection}>
              <summary>
                <span>
                  All {letter.all.length.toLocaleString()} topics under {activeSection}
                </span>
                <span className="scr-topics-fold-chevron" aria-hidden="true" />
              </summary>
              <TopicList topics={letter.all} />
            </details>
          </>
        ) : (
          <>
            <ListHead
              title={activeSection}
              detail={`${letter.all.length} ${letter.all.length === 1 ? "topic" : "topics"}`}
            />
            <TopicList topics={letter.all} />
          </>
        )
      ) : (
        <>
          <ListHead title={`The ${largest.length} largest topics`} detail="scripture references" />
          <TopicList topics={largest} />
          <p className="scr-meta scr-topics-note">
            {total.toLocaleString()} topics in all. Pick a letter or search to see the rest.
          </p>
        </>
      )}
    </>
  );
}
