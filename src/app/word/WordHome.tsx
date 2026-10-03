"use client";

import Link from "next/link";
import type { WordData } from "@/lib/word/types";
import GlossText from "../_components/GlossText";
import WorldDisclosure from "../_components/WorldDisclosure";
import WorldEntry from "../_components/WorldEntry";
import WorldHomeHero from "../_components/WorldHomeHero";
import SourceBasis from "../_components/SourceBasis";
import WordFences, { type Fence } from "./WordFences";
import WordLedger from "./WordLedger";

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** Interactive body for the Word world home — data from the server. */
export default function WordHome({ data }: { data: WordData }) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  // The reader's own hosted-text count, so this sentence cannot go stale.
  const hostedCount = COUNT_WORDS[data.hosted.count] ?? String(data.hosted.count);
  // One chart row per card, fenced and free alike.
  const fences: Fence[] = [...data.fenced, ...data.free].map((t) => ({
    abbr: t.abbr,
    name: t.name,
    pub: t.life.pub,
    pd: t.life.free,
    note: t.life.note,
  }));

  return (
    <>
      <WorldHomeHero
        world="word"
        eyebrow="The ownership record"
        title="Who owns the Word?"
        facets={["Owners + policies", "Cases", "The free way"]}
      >
        No one owns the words of Jesus. They were spoken to crowds on
        hillsides, written down in common Greek, and handed on for free by
        people who were often killed for carrying them. But open nearly any
        modern English Bible and the second page answers this page&rsquo;s
        question in small print: <em>all rights reserved</em>. This is the
        factual story of how the Word acquired owners — and of the
        translators who refused to own it.
      </WorldHomeHero>

      <WorldEntry
        eyebrow="Start with one record"
        href="#word-ledger"
        title="Search the ownership ledger"
        note="Find a translation, inspect who holds the rights, follow the provenance, and open the source behind the claim."
        action="Search the record"
        paths={[
          {
            href: "#word-provenance",
            label: "Trace one translation",
            note: "Read the dated path from publication record to current policy.",
            meta: "Provenance",
          },
          {
            href: "#word-sources",
            label: "Open the source cards",
            note: "Keep rights-holder pages and public-domain records beside the claim.",
            meta: "Sources",
          },
          {
            href: "/word/cases",
            label: "When a fence gets tested",
            note: "Read the lawsuits, licensing fights, and public reversals.",
            meta: "Case studies",
          },
        ]}
      />

      <WordLedger ledger={data.ledger} />
      <SourceBasis id="word-ledger" />

      <WorldDisclosure
        label="Open the wider ownership record"
        note="Read the policies, history, arguments, timelines, and free alternatives."
        variant="deep"
      >
        <div className="wd-collision" aria-label="The collision">
        <blockquote className="wd-coll-side scripture">
          <p>&ldquo;Freely you received, freely give.&rdquo;</p>
          <footer>— Jesus of Nazareth, Matthew 10:8</footer>
        </blockquote>
        <span className="wd-coll-vs" aria-hidden="true">meets</span>
        <blockquote className="wd-coll-side legal">
          <p>
            THE HOLY BIBLE, NEW INTERNATIONAL VERSION®, NIV® Copyright ©
            1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All
            rights reserved worldwide.
          </p>
          <footer>— the notice required to quote his words from the NIV</footer>
        </blockquote>
        </div>

      <h2 className="world-lane" id="fenced">The fenced translations</h2>
      <p>
        Each of these is protected by copyright. The owner grants a
        &ldquo;gratis use&rdquo; allowance — quote inside it and you owe
        nothing; step past it and you need written permission, and sometimes a
        license fee. The allowances below are from the rights-holders&rsquo;
        own permission pages.
      </p>
      <div className="wd-grid">
        {data.fenced.map((t) => (
          <article className="wd-card fenced" key={t.id}>
            <header>
              <span className="wd-abbr">{t.abbr}</span>
              <span className="wd-badge fenced">© {t.year}</span>
            </header>
            <h3>{t.name}</h3>
            <p className="scr-meta">
              {t.owner}
              {t.publisher ? ` · published by ${t.publisher}` : ""}
            </p>
            <p className="wd-policy">{t.policy}</p>
            <p className="world-cite">
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                the policy, in their words
              </a>
            </p>
          </article>
        ))}
      </div>

      <h2 className="world-lane">What the fence means in practice</h2>
      <ul className="wd-practice">
        <li>
          Hand-copy the Gospel of John from the NIV and give it away? That is
          a complete book of the Bible — past the free allowance. Permission
          required.
        </li>
        <li>
          Quote verse number 501 in your own book? Permission required — and
          past a certain scale, royalties.
        </li>
        <li>
          Release the ESV under a Creative Commons license so others can
          share it freely? Forbidden — by name, in the permission terms.
        </li>
        <li>
          The Revised Standard Version was published in 1952. It stays fenced
          until 2048 — under copyright for ninety-six years, held by a council
          of churches.
        </li>
        <li>
          In England, the King James Version — the year is 1611 — may still
          be printed only by the Crown&rsquo;s licensees.
        </li>
        <li>
          And the best-selling English Bible in the world? Its copyright
          belongs to a nonprofit — but its North American publishing runs
          through Zondervan, part of HarperCollins, a News Corp company. The
          NIV and the Wall Street Journal share a corporate parent.
        </li>
      </ul>

      <h2 className="world-lane">How it happened</h2>
      <div className="wd-story">
        {data.story.map((b) => (
          <div className="wd-beat" key={b.year + b.title}>
            <span className="wd-year">{b.year}</span>
            <div>
              <strong>{b.title}</strong>
              <p>
                <GlossText text={b.note} seen={glossSeen} />
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="world-lane" id="fences">The life of every fence</h2>
      <p>
        Publication to public domain, translation by translation — when the
        fence goes up, and when it comes down.
      </p>
      <WordFences fences={fences} />

      <h2 className="world-lane">The case for the fence</h2>
      <p>
        Fairness requires their side. The rights-holders&rsquo; stated reasons,
        in their own words:
      </p>
      {data.theirCase.map((c) => (
        <blockquote className="world-quote" key={c.who}>
          <GlossText text={c.text} seen={glossSeen} />
          <footer className="world-cite">
            — {c.who} ·{" "}
            <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
              source
            </a>
          </footer>
        </blockquote>
      ))}
      <p>
        Those are real concerns — translation is years of scholarly labor, and
        a guarded text is harder to tamper with. Whether a fence around the
        Scriptures is the right answer to them is the question this page
        leaves with you.
      </p>

      <h2 className="world-lane" id="free-way">The free way</h2>
      <p>
        It has been done differently — by translators and publishers who
        finished the same years of labor and then gave the work away.
      </p>
      <div className="wd-grid">
        {data.free.map((t) => (
          <article className="wd-card free" key={t.id}>
            <header>
              <span className="wd-abbr">{t.abbr}</span>
              <span className="wd-badge free">{t.status}</span>
            </header>
            <h3>{t.name}</h3>
            <p className="scr-meta">{t.year}</p>
            <p className="wd-policy">
              <GlossText text={t.note} seen={glossSeen} />
            </p>
            <p className="world-cite">
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                source
              </a>
              {t.onSite && (
                <>
                  {" · "}
                  <Link href="/scriptures" className="textlink">
                    read it here
                  </Link>
                </>
              )}
            </p>
          </article>
        ))}
      </div>

        <p>
          <Link href="/word/free" className="textlink">
            Check the chain behind every hosted text →
          </Link>
        </p>

        <p className="world-close">
          Every word of Scripture on this site — {hostedCount} hosted texts, the
          cross-references, the search — is public domain. That is not an
          accident; it is the reason the{" "}
          <Link href="/scriptures" className="textlink">
            Scriptures world
          </Link>{" "}
          can exist at all. &ldquo;Freely you received, freely give&rdquo; is
          not this site&rsquo;s slogan. It is an instruction — from the one the
          Book is about.
        </p>
      </WorldDisclosure>
    </>
  );
}
