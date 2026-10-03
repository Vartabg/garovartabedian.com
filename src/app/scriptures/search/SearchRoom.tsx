"use client";

import { SEMANTIC_DOWNLOAD_NOTICE } from "@/lib/scriptures/semantic-model";
import PublicAssessment, { PublicAssessmentEnabled } from "./PublicAssessment";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hasOptedIntoMeaningSearch,
  rememberMeaningSearchOptIn,
} from "@/lib/semantic-opt-in";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { loadBook, traditionFor } from "@/lib/scriptures/client";
import {
  parseScriptureQueryRef,
  searchVerses,
  type SearchResult,
} from "@/lib/scriptures/search";
import {
  searchRelatedPassages,
  type RelatedSearchResult,
} from "@/lib/scriptures/related";
import {
  searchSemantic,
  type SemanticResult,
} from "@/lib/scriptures/semantic";
import type { Canons, TranslationId } from "@/lib/scriptures/types";
import { wordingLabel } from "@/lib/scriptures/search-wording";
import { searchExpansion } from "@/lib/scriptures/search-expansion";
import { scriptureSearchHref, withFindContext } from "@/lib/scriptures/search-url";
import { findMatchingParallels } from "@/lib/parallels/search-match";
import WritingsMatches from "./WritingsMatches";
import AskBox from "../_components/AskBox";
import CanonStrip from "../_components/CanonStrip";
import ResonanceRadar from "@/app/_components/ResonanceRadar";
import { useSemanticRequest } from "@/lib/use-semantic-request";
import { isAbortError } from "@/lib/scriptures/cancellation";

const SHOWN = 40;
const OPEN_PREVIEWS = 5;

export default function SearchRoom({
  canons,
  publicAssessments = false,
}: {
  canons: Canons;
  publicAssessments?: boolean;
}) {
  return (
    <PublicAssessmentEnabled.Provider value={publicAssessments}>
      <p className="kicker">
        <Link href="/scriptures">Scriptures</Link>
      </p>
      <h1>Ask the text</h1>
      <p className="lede">
        Enter a reference, search words and phrases, or describe an idea. Word
        matches stay separate from related passages, and every result opens
        the hosted text — no generated answer in between.
      </p>
      <AskBox translations={canons.translations} />
      <Suspense fallback={<Results canons={canons} q="" trans="web" />}>
        <SearchQuery canons={canons} />
      </Suspense>
    </PublicAssessmentEnabled.Provider>
  );
}

function SearchQuery({ canons }: { canons: Canons }) {
  const params = useSearchParams();
  const q = params.get("q")?.trim().slice(0, 160) ?? "";
  const transParam = params.get("trans") ?? "web";
  const trans = (
    Object.hasOwn(canons.translations, transParam) ? transParam : "web"
  ) as TranslationId;
  return (
    <>
      <p className="scr-meta">
        <SearchTransPicker canons={canons} trans={trans} />
      </p>
      <WritingsMatches key={q} query={q} translation={trans} scope={params.get("scope") ?? undefined} />
      <Results key={`${q}::${trans}`} canons={canons} q={q} trans={trans} scope={params.get("scope") ?? undefined} />
    </>
  );
}

/** Translation picker for the search index — shareable via the ?trans= param. */
function SearchTransPicker({
  canons,
  trans,
}: {
  canons: Canons;
  trans: TranslationId;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="scr-trans-picker">
      {" Scripture edition: "}
      <select
        value={trans}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("trans", e.target.value);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }}
      >
        {Object.entries(canons.translations).map(([id, t]) => (
          <option key={id} value={id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchLens({ result, canons, q, scope }: { result: SearchResult; canons: Canons; q: string; scope?: string }) {
  const bars = result.books.slice(0, 8);
  const max = Math.max(1, ...bars.map((bar) => bar.count));

  if (result.totalHits === 0) return null;

  return (
    <section className="scr-search-lens" aria-label="Search result distribution">
      <div className="scr-search-lens-head">
        <strong>Where the search words occur</strong>
        <span>
          {result.totalHits.toLocaleString()} matches across {result.books.length} books
        </span>
      </div>
      <div className="scr-search-bars">
        {bars.map((bar) => {
          const meta = canons.books[bar.book];
          const name = meta?.name ?? bar.book;
          const href = `/scriptures/${traditionFor(canons, bar.book)}/${bar.book}/${bar.firstChapter}?t=${result.translation}#v${bar.firstVerse}`;
          return (
            <Link
              key={bar.book}
              href={withFindContext(href, q, result.translation, scope)}
              prefetch={false}
              className="scr-search-bar"
              style={{ "--w": `${(bar.count / max) * 100}%` } as CSSProperties}
              aria-label={`${name} ${bar.count} matches; open the highest-ranked match in this book`}
            >
              <span>{name}</span>
              <b>{bar.count}</b>
            </Link>
          );
        })}
      </div>
      <p className="scr-search-tokens">
        {result.searched.length > 0 && (
          <span>searched {result.searched.join(", ")}</span>
        )}
        {result.dropped.length > 0 && (
          <span>ignored common words {result.dropped.join(", ")}</span>
        )}
        {result.missing.length > 0 && (
          <span>not found in this index {result.missing.join(", ")}</span>
        )}
      </p>
    </section>
  );
}

function topicLabel(topicId: string): string {
  return topicId
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RelatedPassages({
  q,
  scope,
  trans,
  result,
  exact,
  canons,
}: {
  q: string;
  scope?: string;
  trans: TranslationId;
  result: RelatedSearchResult;
  exact: SearchResult | null;
  canons: Canons;
}) {
  const exactRefs = new Set(
    (trans === "kjv" ? exact?.hits.slice(0, SHOWN) ?? [] : []).map((hit) => `${hit.book}:${hit.chapter}:${hit.verse}`) ?? [],
  );
  const hits = result.hits.filter(
    (hit) => !exactRefs.has(`${hit.book}:${hit.chapter}:${hit.verse}`),
  );

  if (hits.length === 0) return null;

  return (
    <section
      className="scr-related"
      aria-labelledby="scr-related-heading"
    >
      <div className="scr-related-head">
        <div>
          <p className="scr-related-kicker">Curated subject connections</p>
          <h2 id="scr-related-heading">Related passages · KJV</h2>
        </div>
        <p>
          From Nave&rsquo;s Topical Bible, 1897, shown in the King James Version. These are index connections,
          not a generated answer.
        </p>
      </div>

      <nav className="scr-related-topics" aria-label="Matched Bible topics">
        {result.topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/scriptures/topics/${encodeURIComponent(topic.id)}`}
            prefetch={false}
          >
            {topicLabel(topic.id)}
          </Link>
        ))}
      </nav>

      <ol className="scr-related-list">
        {hits.map((hit, index) => {
          const name = canons.books[hit.book]?.name ?? hit.book;
          const label = `${name} ${hit.chapter}:${hit.verse}${
            hit.endVerse ? `–${hit.endVerse}` : ""
          }`;
          const href = `/scriptures/${traditionFor(canons, hit.book)}/${hit.book}/${hit.chapter}?t=kjv#v${hit.verse}`;
          return (
            <li
              className="scr-hit scr-related-hit"
              key={`${hit.book}${hit.chapter}:${hit.verse}`}
            >
              <div className="scr-hit-head">
                <Link className="scr-ref" href={withFindContext(href, q, trans, scope)} prefetch={false}>
                  {label}
                </Link>
                <span className="scr-related-via">
                  via {topicLabel(hit.topicId)}
                </span>
              </div>
              {hit.context && (
                <p className="scr-related-context">{hit.context}</p>
              )}
              <VersePreview
                hit={{ ...hit, matched: 0 }}
                canons={canons}
                searched={[]}
                preferredTranslation="kjv"
                defaultOpen={index < 3}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ParallelMatches({ q }: { q: string }) {
  const matches = useMemo(() => findMatchingParallels(q), [q]);
  if (matches.length === 0) return null;

  return (
    <section className="scr-related" aria-labelledby="scr-parallels-heading" style={{ borderLeft: "3px solid #f59e0b", paddingLeft: "1rem", marginBottom: "2rem" }}>
      <div className="scr-related-head">
        <div>
          <p className="scr-related-kicker" style={{ color: "#fbbf24" }}>Abrahamic Parallel Matrix</p>
          <h2 id="scr-parallels-heading">Comparative Claim Matches</h2>
        </div>
        <p>
          Source-anchored slot-diff matrices comparing Jewish, Christian, and Islamic textual traditions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {matches.map((m) => (
          <article key={m.id} style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(23, 23, 23, 0.7)", border: "1px solid #333" }}>
            <h3 style={{ fontSize: "1.125rem", margin: "0 0 0.25rem 0", color: "#fff" }}>
              <Link href={m.href} style={{ color: "#fcd34d", textDecoration: "none" }}>
                {m.title}
              </Link>
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#a3a3a3", margin: "0 0 0.5rem 0" }}>{m.subtitle}</p>
            <p style={{ fontSize: "0.8125rem", color: "#d4d4d4", margin: "0 0 0.75rem 0", lineHeight: 1.5 }}>{m.summary}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
              {m.witnesses.map((w) => (
                <span key={w} style={{ fontSize: "0.6875rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: "#0a0a0a", border: "1px solid #262626", color: "#d4d4d4" }}>
                  {w}
                </span>
              ))}
            </div>
            <Link href={m.href} style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#fbbf24", textDecoration: "none" }}>
              Open comparative slot-diff →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MeaningMatches({
  q,
  canons,
  trans,
  scope,
  search = searchSemantic,
}: {
  q: string;
  exact: SearchResult;
  canons: Canons;
  trans: TranslationId;
  scope?: string;
  search?: typeof searchSemantic;
}) {
  const { begin, cancel } = useSemanticRequest();
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<SemanticResult | null>(null);

  const run = useCallback(() => {
    const request = begin();
    rememberMeaningSearchOptIn();
    setPhase("loading");
    setStatus("Preparing the model...");
    search(q, status => { if (request.current()) setStatus(status); }, {signal:request.signal})
      .then((next) => {
        if (!request.current()) return;
        setResult(next);
        setPhase("done");
      })
      .catch(error => { if (request.current() && !isAbortError(error)) setPhase("error"); });
  }, [q, begin, search]);

  // The opt-in is remembered per browser, so a reader who agreed once — even in
  // an earlier visit — gets meaning matches without being asked again.
  useEffect(() => {
    if (hasOptedIntoMeaningSearch()) run();
    return cancel;
  }, [run, cancel]);

  const hits = result?.hits ?? [];

  return (
    <section className="scr-related" aria-labelledby="scr-meaning-heading">
      <div className="scr-related-head">
        <div>
          <p className="scr-related-kicker">Similarity suggestions; inspect the passage</p>
          <h2 id="scr-meaning-heading">Meaning suggestions · WEB</h2>
        </div>
        <p>
          Your original question is compared with every indexed World English Bible (WEB)
          verse on this device. These suggestions open WEB; word matches use your selected
          edition. Similarity can miss negation and context. It does not establish quotation,
          influence, agreement, or support for a claim.
        </p>
      </div>

      {phase === "idle" && (
        <div className="scr-search-more">
          <button type="button" className="scr-btn" onClick={run}>
            Search by meaning
          </button>
          <p>{SEMANTIC_DOWNLOAD_NOTICE} The complete WEB verse index adds about 15 MB on the first search.</p>
        </div>
      )}
      {phase === "loading" && (
        <p className="scr-empty" role="status" aria-live="polite">
          {status || "Searching by meaning..."}
        </p>
      )}
      {phase === "error" && (
        <p className="scr-empty" role="alert">
          The meaning search couldn&rsquo;t load. Check your connection and try
          again. <button type="button" className="scr-btn" onClick={run}>Retry meaning search</button>
        </p>
      )}
      {result && phase === "done" && <p className="scr-meta">Searched all {result.scannedBooks.length} indexed WEB books. Similarity scores are not confidence in a claim.</p>}
      {phase === "done" && hits.length === 0 && (
        <p className="scr-empty" role="status">
          No additional passages ranked close to this question.
        </p>
      )}
      {phase === "done" && hits.length > 0 && (
        <ol className="scr-related-list" aria-label="Verses ranked by meaning">
          {hits.map((hit, index) => {
            const name = canons.books[hit.book]?.name ?? hit.book;
            const href = `/scriptures/${traditionFor(canons, hit.book)}/${hit.book}/${hit.chapter}?t=web#v${hit.verse}`;
            return (
              <li
                className="scr-hit scr-related-hit"
                key={`${hit.book}${hit.chapter}:${hit.verse}`}
              >
                <div className="scr-hit-head">
                  <Link className="scr-ref" href={withFindContext(href, q, trans, scope)} prefetch={false}>
                    {name} {hit.chapter}:{hit.verse}
                  </Link>
                  <span className="scr-hit-match">
                    similarity {hit.score.toFixed(2)}
                  </span>
                </div>
                <VersePreview
                  hit={hit}
                  canons={canons}
                  searched={[]}
                  preferredTranslation="web"
                  defaultOpen={index < 3}
                />
              </li>
            );
          })}
        </ol>
      )}
      {hits.length > 0 && <PublicAssessment key={q} query={q} sources={hits.slice(0,20).map(h=>({kind:"scripture",translation:"web",book:h.book,chapter:h.chapter,verse:h.verse}))} />}

      {phase === "done" && (
        <div style={{ marginTop: "2.5rem" }}>
          <ResonanceRadar initialQuery={q} />
        </div>
      )}
    </section>
  );
}

function VersePreview({
  hit,
  canons,
  searched,
  preferredTranslation,
  defaultOpen = false,
}: {
  hit: SearchResult["hits"][number];
  canons: Canons;
  searched: string[];
  preferredTranslation?: TranslationId;
  defaultOpen?: boolean;
}) {
  const [text, setText] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const translation =
    preferredTranslation
      ? (canons.books[hit.book]?.trans.includes(preferredTranslation) ? preferredTranslation : undefined)
      : canons.books[hit.book]?.trans.includes("web")
        ? ("web" as const)
        : canons.books[hit.book]?.trans[0];

  const load = useCallback(async () => {
    if (text !== undefined || loading) return;
    setLoading(true);
    if (!translation) {
      setText(null);
      setLoading(false);
      return;
    }
    try {
      const book = await loadBook(translation, hit.book);
      setText(book.chapters[hit.chapter - 1]?.[hit.verse - 1] ?? null);
    } catch {
      setText(null);
    } finally {
      setLoading(false);
    }
  }, [hit.book, hit.chapter, hit.verse, loading, text, translation]);

  useEffect(() => {
    if (defaultOpen) void load();
  }, [defaultOpen, load]);

  const highlight =
    searched.length > 0
      ? new RegExp(`\\b((?:${searched.join("|")})\\w*)`, "gi")
      : null;
  const translationName = translation
    ? canons.translations[translation]?.name
    : null;

  return (
    <details
      className="scr-hit-preview"
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
        if (event.currentTarget.open) void load();
      }}
    >
      <summary>
        {defaultOpen ? "Verse text" : "Show verse text"}
        {translationName ? ` · ${translationName}` : ""}
      </summary>
      <span>
        {loading
          ? "Loading verse…"
          : text && highlight
            ? text
                .split(highlight)
                .map((part, index) =>
                  index % 2 === 1 ? (
                    <mark key={index} className="scr-hl">
                      {part}
                    </mark>
                  ) : (
                    part
                  ),
                )
            : (text ?? "Preview unavailable — open the verse to read it.")}
      </span>
    </details>
  );
}

function Results({
  canons,
  q,
  trans,
  scope,
}: {
  canons: Canons;
  q: string;
  trans: TranslationId;
  scope?: string;
}) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [related, setRelated] = useState<RelatedSearchResult | null>(null);
  const [visible, setVisible] = useState(SHOWN);
  const [error, setError] = useState(false);
  const directRef = useMemo(
    () => (q ? parseScriptureQueryRef(q, canons) : null),
    [canons, q],
  );

  useEffect(() => {
    if (!q || directRef) {
      setResult(null);
      setRelated(null);
      setVisible(SHOWN);
      setError(false);
      return;
    }
    let live = true;
    setResult(null);
    setRelated(null);
    setVisible(SHOWN);
    setError(false);
    searchVerses(q, trans)
      .then((nextResult) => {
        if (live) setResult(nextResult);
      })
      .catch(() => live && setError(true));
    searchRelatedPassages(q, canons)
      .then((nextRelated) => {
        if (live) setRelated(nextRelated);
      })
      .catch(() => {
        if (live) setRelated({ hits: [], topics: [] });
      });
    return () => {
      live = false;
    };
  }, [canons, directRef, q, trans]);

  const loadMore = () => {
    if (!result) return;
    setVisible((current) => Math.min(result.hits.length, current + SHOWN));
  };

  const indexedBooks = canons.bookOrder.filter((book) =>
    canons.books[book]?.trans.includes(trans),
  ).length;
  const hostedBooks = canons.bookOrder.length;
  const loading = Boolean(q && !directRef && !error && !result);
  const directName = directRef
    ? (canons.books[directRef.book]?.name ?? directRef.book)
    : "";
  const directLabel = directRef
    ? `${directName} ${directRef.chapter}:${directRef.verse}${
        directRef.endVerse ? `–${directRef.endVerse}` : ""
      }`
    : "";
  const directAvailable = directRef && canons.books[directRef.book]?.trans.includes(trans);
  const expansion = searchExpansion(q);
  const directHref = directRef
    ? `/scriptures/${traditionFor(canons, directRef.book)}/${directRef.book}/${directRef.chapter}?t=${trans}#v${directRef.verse}`
    : "";
  const firstHit = result?.hits[0];
  const firstGuideHref = firstHit
    ? `/scriptures/${traditionFor(canons, firstHit.book)}/${firstHit.book}/${firstHit.chapter}?t=${trans}#cheat-sheet`
    : null;

  return (
    <>
      <div
        className={`scr-search-stage${loading ? " is-loading" : ""}`}
        aria-busy={loading}
      >
        {!q && (
          <div className="scr-search-start">
            <p className="scr-empty" role="status">
              Search {indexedBooks} books in {canons.translations[trans].name}, or open a reference
              from any of {hostedBooks} hosted books.
            </p>
            <nav className="scr-search-examples" aria-label="Example scripture searches">
              <Link href={scriptureSearchHref("John 3:16", trans)} prefetch={false}>
                John 3:16
              </Link>
              <Link
                href={scriptureSearchHref("faith without works", trans)}
                prefetch={false}
              >
                faith without works
              </Link>
              <Link
                href={scriptureSearchHref("how can I forgive someone who hurt me", trans)}
                prefetch={false}
              >
                how can I forgive someone who hurt me?
              </Link>
            </nav>
          </div>
        )}

        {directRef && !directAvailable && <p className="scr-empty" role="status">{directLabel} is not hosted in {canons.translations[trans].name}. Choose an available edition to read it; verse numbering may differ.</p>}
        {directRef && directAvailable && (
          <section aria-label="Recognized passage">
            <p className="scr-meta" role="status" aria-live="polite">
              Passage recognized · {directLabel}
            </p>
            <div className="scr-hit scr-direct-hit">
              <Link className="scr-ref" href={withFindContext(directHref, q, trans, scope)} prefetch={false}>
                Open {directLabel} in context
              </Link>
              <VersePreview
                hit={{ ...directRef, matched: 0 }}
                preferredTranslation={trans}
                canons={canons}
                searched={[]}
                defaultOpen
              />
            </div>
          </section>
        )}

        {q && <ParallelMatches q={q} />}

        {error && (
          <p className="scr-empty" role="alert">
            The search index didn&rsquo;t load. Refresh the page to try again.
          </p>
        )}
        {error && q && <MeaningMatches q={q} exact={{hits:[],totalHits:0,books:[],translation:trans,searched:[],dropped:[],missing:[]}} canons={canons} trans={trans} scope={scope} />}
        {loading && (
          <p className="scr-empty" role="status" aria-live="polite">
            Searching the {canons.translations[trans].name} index…
          </p>
        )}

        {result && (
          <>
            <h2 className="scr-search-section-title">Words and phrases</h2>
            <p className="scr-meta">Complete phrases come first, followed by word overlap and related word forms. Case and punctuation are ignored; context still matters.</p>
            {result.warnings?.map(warning => <p key={warning} role="status">{warning}</p>)}
            {expansion.negated && <p className="scr-meta">Your negation stays in the query. Word overlap alone does not show whether a passage agrees with it.</p>}

            {result.hits.length > 0 && (
              <p className="scr-meta" role="status" aria-live="polite">
                {result.hits.length > visible
                  ? `Showing ${visible} of ${result.hits.length} ranked matches`
                  : `${result.hits.length} ranked match${
                      result.hits.length === 1 ? "" : "es"
                    }`}
                {result.totalHits > result.hits.length && (
                  <> · {result.totalHits.toLocaleString()} total matches</>
                )}
              </p>
            )}

            {result.hits.length > 0 && (
              <>
                <SearchLens result={result} canons={canons} q={q} scope={scope} />
                <CanonStrip
                  canons={canons}
                  refs={result.hits.map(
                    (hit) => `${hit.book} ${hit.chapter}:${hit.verse}`,
                  )}
                  noun={
                    result.totalHits > result.hits.length
                      ? "top-ranked matches"
                      : "matches"
                  }
                />
              </>
            )}

            {result.hits.length === 0 &&
              result.searched.length === 0 &&
              result.dropped.length > 0 && (
                <div className="scr-empty" role="status" aria-live="polite">
                  <p>
                    That query contains only common words omitted from the
                    concordance: {result.dropped.join(", ")}.
                  </p>
                  <p>Try adding a distinctive name, place, action, or theme.</p>
                </div>
              )}

            {result.hits.length === 0 && result.searched.length > 0 && (
              <div className="scr-empty" role="status" aria-live="polite">
                <p>
                  No word matches were found in the {canons.translations[trans].name} index for
                  &ldquo;{q}&rdquo;.
                </p>
                {result.missing.length > 0 && (
                  <p>
                    Not found in this index: {result.missing.join(", ")}. Try a
                    shorter form or another word.
                  </p>
                )}
              </div>
            )}


            {result.hits.length === 0 && <div className="scr-search-next">
              <p>Modern wording may differ from the text. {related?.hits.length ? "Explore the related topics below, or " : "Try another word or "}<a href="#scr-meaning-heading">search by meaning</a>.</p>
              {expansion.terms.length > 0 && <nav className="scr-search-examples" aria-label="Try related wording">
                {expansion.terms.map(term => <Link key={term} href={scriptureSearchHref(term, trans, scope)} prefetch={false}>Search “{term}”</Link>)}
              </nav>}
            </div>}

            {result.hits.length > 0 && (
              <ol
                className="scr-hits"
                aria-label="Ranked scripture word matches"
              >
                {result.hits.slice(0, visible).map((hit, index) => {
                  const name = canons.books[hit.book]?.name ?? hit.book;
                  const href = `/scriptures/${traditionFor(canons, hit.book)}/${hit.book}/${hit.chapter}?t=${trans}#v${hit.verse}`;
                  return (
                    <li
                      className="scr-hit"
                      key={`${hit.book}${hit.chapter}:${hit.verse}`}
                    >
                      <div className="scr-hit-head">
                        <Link
                          className="scr-ref"
                          href={withFindContext(href, q, trans, scope)}
                          prefetch={false}
                        >
                          {name} {hit.chapter}:{hit.verse}
                        </Link>
                        <span className="scr-hit-match">
                          {wordingLabel(hit)}
                        </span>
                      </div>
                      <VersePreview
                        hit={hit}
                        canons={canons}
                        searched={result.searched}
                        preferredTranslation={result.translation}
                        defaultOpen={index < OPEN_PREVIEWS}
                      />
                    </li>
                  );
                })}
              </ol>
            )}

            {result.hits.length > visible && (
              <div className="scr-search-more">
                <button type="button" className="scr-btn" onClick={loadMore}>
                  Load {Math.min(SHOWN, result.hits.length - visible)} more —{" "}
                  {visible} of {result.hits.length} ranked matches shown
                </button>
              </div>
            )}

            {related && (
              <RelatedPassages
                q={q}
                scope={scope}
                trans={trans}
                result={related}
                exact={result}
                canons={canons}
              />
            )}
            {["web","kjv","drb","brenton"].includes(trans) && <PublicAssessment key={`${q}:${trans}`} query={q} sources={result.hits.slice(0,20).map(h=>({kind:"scripture",translation:trans as "web"|"kjv"|"drb"|"brenton",book:h.book,chapter:h.chapter,verse:h.verse}))} />}
            <MeaningMatches q={q} exact={result} canons={canons} trans={trans} scope={scope} />

            {q && (
              <div className="scr-search-guides-hint">
                <p>
                  Related passages come from Nave&rsquo;s historical subject
                  index. Browse all{" "}
                  <Link href="/scriptures/topics">5,319 Bible topics</Link>
                  {firstGuideHref && firstHit ? (
                    <>
                      {" "}
                      or open the{" "}
                      <Link href={withFindContext(firstGuideHref, q, trans, scope)} prefetch={false}>
                        chapter guide for{" "}
                        {canons.books[firstHit.book]?.name ?? firstHit.book}{" "}
                        {firstHit.chapter}
                      </Link>
                    </>
                  ) : null}
                  .
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
