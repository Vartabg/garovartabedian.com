"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { compareEvidenceRelevance } from "@/lib/evidence-explorer";
import type {
  EvidenceQuery,
  EvidenceRun,
  EvidenceHit,
} from "@/lib/evidence-explorer";
import type { WorkspaceSession } from "@/lib/research-workspace";
import { loadCanons } from "@/lib/scriptures/client";
import type { Canons } from "@/lib/scriptures/types";
import type { TextBlock } from "../../../../scripts/research/types";
import view from "./explorer.module.css";

type HistoryItem = {
  id: string;
  query: string;
  createdAt: string;
  status: string;
};
type ReadingTab = "passage" | "context" | "connections" | "assessment";
const tabs: { id: ReadingTab; label: string }[] = [
  { id: "passage", label: "Passage" },
  { id: "context", label: "Context" },
  { id: "connections", label: "Connections" },
  { id: "assessment", label: "Assessment" },
];
const examples = [
  {
    query: "loneliness",
    label: "Explore a feeling",
    hint: "Loneliness, belonging, and being seen",
    mark: "01",
  },
  {
    query: "love your enemies",
    label: "Follow an idea",
    hint: "Love your enemies",
    mark: "02",
  },
  {
    query: "Jesus wept",
    label: "Find the words",
    hint: "Jesus wept",
    mark: "03",
  },
];
const words = (s: string) => s.replaceAll("-", " ");
function titleFor(block: TextBlock, canons: Canons | null) {
  if (block.source.kind !== "scripture") return block.title;
  const code = block.source.book;
  return block.title.replace(code, canons?.books[code]?.name ?? code);
}
function retrievalLabel(hit: EvidenceHit) {
  if (hit.phrase) return "Phrase match";
  if (hit.channels.includes("Words") && hit.channels.includes("Meaning"))
    return "Words + meaning";
  return hit.channels
    .map(
      (c) =>
        ({
          Words: "Shared words",
          Meaning: "Related meaning",
          "Nave 1897": "Topic reference",
        })[c] ?? words(c),
    )
    .join(" · ");
}
function Distribution({ values }: { values: Record<string, number> }) {
  return (
    <dl className={view.distribution}>
      {Object.entries(values).map(([label, value]) => (
        <div key={label}>
          <dt>{words(label)}</dt>
          <dd>
            <span aria-hidden="true" className={view.meter}>
              <span style={{ width: value * 100 + "%" }} />
            </span>
            <span>{(value * 100).toFixed(1)}%</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SourceContext({
  text,
  canons,
}: {
  text: string;
  canons: Canons | null;
}) {
  return (
    <div className={view.context}>
      {text.split(/\n\n(?=\[)/).map((part, index) => {
        const match = /^\[([^\]]+)\]\n([\s\S]*)$/.exec(part);
        if (!match) return <p key={index}>{part}</p>;
        const divider = match[1].indexOf(": ");
        const role = divider >= 0 ? match[1].slice(0, divider) : "";
        const locator = divider >= 0 ? match[1].slice(divider + 2) : match[1];
        const name = locator.replace(
          /^([A-Z0-9]{3}) (?=\d)/,
          (whole, code: string) =>
            canons?.books[code] ? canons.books[code].name + " " : whole,
        );
        return (
          <section key={index}>
            <p className={view.contextLocator}>
              {name}
              <span>{words(role)}</span>
            </p>
            <p>{match[2]}</p>
          </section>
        );
      })}
    </div>
  );
}

export default function Explorer({
  initialQuery,
  initialTranslation,
  initialRun,
}: {
  initialQuery: string;
  initialTranslation: string;
  initialRun: string;
}) {
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [canons, setCanons] = useState<Canons | null>(null);
  const [draft, setDraft] = useState<EvidenceQuery>({
    query: initialQuery,
    scope: "scripture",
    translation: ["web", "kjv", "drb", "brenton"].includes(initialTranslation)
      ? (initialTranslation as EvidenceQuery["translation"])
      : "web",
    name: "notes.txt",
    text: "",
  });
  const [run, setRun] = useState<EvidenceRun | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [order, setOrder] = useState<"retrieval" | "jev">("retrieval");
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<ReadingTab>("passage");
  const [mobileReading, setMobileReading] = useState(false);
  const [filter, setFilter] = useState<"all" | "phrase" | "kept">("all");
  const [kept, setKept] = useState<string[]>([]);
  const pending = useRef<AbortController | null>(null);
  const readerTitle = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsTitle = useRef<HTMLHeadingElement>(null);
  const api = useCallback(
    async (route: string, data?: unknown, signal?: AbortSignal) => {
      const response = await fetch("/api/research" + route, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { "x-jev-session": session.token } : {}),
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        signal,
        cache: "no-store",
      });
      if (!response.ok) {
        let message = "The local workspace is unavailable.";
        try {
          message = (await response.json()).error ?? message;
        } catch {}
        throw new Error(message);
      }
      return response.json();
    },
    [session],
  );
  const loadHistory = useCallback(async () => {
    setHistory(await api("/find/runs"));
  }, [api]);
  const perform = useCallback(
    async (route: string, data: unknown, label: string) => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      setBusy(label);
      setError("");
      try {
        const next: EvidenceRun = await api(route, data, controller.signal);
        if (controller.signal.aborted) return;
        const sameRun = run?.id === next.id;
        setRun(next);
        setDraft(next.request);
        if (!sameRun) {
          setSelectedId("");
          setTab("passage");
          setMobileReading(false);
          setFilter("all");
          setKept([]);
          setOrder(next.hits.some((h) => h.judgment) ? "jev" : "retrieval");
        }
        if (route === "/find/evaluate") setOrder("jev");
        if (route === "/find/connect") setTab("connections");
        window.history.replaceState(
          window.history.state,
          "",
          "/scriptures/find?run=" + encodeURIComponent(next.id),
        );
        await loadHistory();
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (pending.current === controller) {
          pending.current = null;
          setBusy("");
        }
      }
    },
    [api, loadHistory, run?.id],
  );

  useEffect(() => {
    const c = new AbortController();
    void loadCanons()
      .then(setCanons)
      .catch(() => {
        /* Source locators remain available. */
      });
    fetch("/api/research/session", { signal: c.signal, cache: "no-store" })
      .then((r) => {
        if (!r.ok)
          throw new Error("Start the local research website to use Find.");
        return r.json();
      })
      .then(setSession)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => {
      c.abort();
      pending.current?.abort();
    };
  }, []);
  const initialized = useRef(false);
  useEffect(() => {
    if (!session || initialized.current) return;
    initialized.current = true;
    if (initialRun)
      void perform(
        "/find/" + encodeURIComponent(initialRun),
        undefined,
        "Opening saved search…",
      );
    else if (initialQuery.trim())
      void perform(
        "/find/search",
        { ...draft, query: initialQuery },
        "Searching words and meaning…",
      );
    else void loadHistory().catch((e) => setError(e.message));
  }, [session, initialRun, initialQuery, draft, perform, loadHistory]);

  // Selection is a local reading preference; source evidence remains in the saved run.
  useEffect(() => {
    if (!run?.id) return;
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("find-kept:" + run.id) ?? "[]",
      );
      if (Array.isArray(saved))
        setKept(
          saved.filter(
            (id): id is string =>
              typeof id === "string" && run.hits.some((h) => h.block.id === id),
          ),
        );
    } catch {
      /* Storage may be unavailable. */
    }
  }, [run?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  function toggleKeep(id: string) {
    const next = kept.includes(id)
      ? kept.filter((k) => k !== id)
      : [...kept, id];
    setKept(next);
    try {
      localStorage.setItem("find-kept:" + run!.id, JSON.stringify(next));
    } catch {}
  }
  const hits = run
    ? [...run.hits].sort((a, b) =>
        order === "jev"
          ? compareEvidenceRelevance(a, b)
          : a.rank - b.rank,
      )
    : [];
  const visible = hits.filter(
    (h) =>
      filter === "all" ||
      (filter === "phrase" ? h.phrase : kept.includes(h.block.id)),
  );
  const selected = visible.find((h) => h.block.id === selectedId) ?? visible[0];
  const block = selected?.block;
  const assessed = run?.hits.filter((h) => h.judgment).length ?? 0;
  const connections =
    run?.connections?.from === block?.id ? run?.connections : undefined;
  function selectHit(hit: EvidenceHit) {
    setSelectedId(hit.block.id);
    setMobileReading(true);
    setTab("passage");
    if (window.matchMedia("(max-width: 760px)").matches)
      requestAnimationFrame(() => {
        readerTitle.current?.focus({ preventScroll: true });
        document
          .getElementById("selected-passage")
          ?.scrollIntoView({ block: "start" });
      });
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              ...run,
              keptPassages: kept,
              publication:
                "Unreviewed research snapshot; not an approved finding",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = run!.id + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function search(query: EvidenceQuery) {
    void perform("/find/search", query, "Searching words and meaning…");
  }

  return (
    <div className={view.workspace} data-find-workspace="true">
      <header className={view.topbar}>
        <Link
          className={view.brand}
          href="/scriptures/find"
          onClick={(e) => {
            e.preventDefault();
            pending.current?.abort();
            setBusy("");
            setRun(null);
            setDraft({ ...draft, query: "" });
            setError("");
            window.history.replaceState(
              window.history.state,
              "",
              "/scriptures/find",
            );
            searchInput.current?.focus();
          }}
        >
          Find<span className={view.brandDot}>.</span>
        </Link>
        <nav aria-label="Find workspace">
          <span aria-current="page">Explore</span>
          <Link href="/scriptures/research">
            Compare & check claims <span aria-hidden="true">↗</span>
          </Link>
        </nav>
        <details className={view.history}>
          <summary>Recent searches </summary>
          <div>
            <p className={view.eyebrow}>Saved on this computer</p>
            {history.length ? (
              history.map((h) => (
                <button
                  type="button"
                  key={h.id}
                  disabled={!!busy}
                  onClick={(e) => {
                    e.currentTarget.closest("details")?.removeAttribute("open");
                    void perform(
                      "/find/" + h.id,
                      undefined,
                      "Opening saved search…",
                    );
                  }}
                >
                  <strong>{h.query}</strong>
                  <span>
                    {new Date(h.createdAt).toLocaleDateString()} ·{" "}
                    {h.status === "retrieved"
                      ? "Sources found"
                      : h.status === "complete"
                        ? "Assessed"
                        : "Incomplete"}
                  </span>
                </button>
              ))
            ) : (
              <p>Your searches will appear here.</p>
            )}
          </div>
        </details>
      </header>

      <section
        className={run ? view.searchArea : view.landing}
        aria-label="Evidence search"
      >
        {!run && (
          <div className={view.intro}>
            <p className={view.eyebrow}>
              Scripture · Early writings · Your texts
            </p>
            <h1>
              A question is
              <br />a place to begin.
            </h1>
            <p>
              Find the words. Read them in context.
              <br className={view.mobileBreak} /> See where they lead.
            </p>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(draft);
          }}
        >
          <fieldset disabled={!!busy || !session}>
            <div className={view.searchBox}>
              <span aria-hidden="true" className={view.searchIcon}>
                ⌕
              </span>
              <label className={view.srOnly} htmlFor="evidence-query">
                Question or words
              </label>
              <input
                ref={searchInput}
                id="evidence-query"
                type="search"
                required
                maxLength={500}
                value={draft.query}
                onChange={(e) => setDraft({ ...draft, query: e.target.value })}
                placeholder="A feeling, a question, a phrase…"
              />
              <button
                type="submit"
                aria-label="Find passages"
                className={view.primary}
              >
                <span className={view.submitText}>Find passages</span>{" "}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className={view.searchOptions}>
              <label>
                Search in
                <select
                  aria-label="Sources"
                  value={draft.scope}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      scope: e.target.value as EvidenceQuery["scope"],
                      name: draft.name ?? "notes.txt",
                      text: draft.text ?? "",
                    })
                  }
                >
                  <option value="scripture">Scripture</option>
                  <option value="early">Early writings</option>
                  <option value="all">Scripture + early writings</option>
                  <option value="text">My text</option>
                </select>
              </label>
              {(draft.scope === "scripture" || draft.scope === "all") && (
                <label>
                  Edition
                  <select
                    aria-label="Scripture edition"
                    value={draft.translation}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translation: e.target
                          .value as EvidenceQuery["translation"],
                      })
                    }
                  >
                    <option value="web">World English Bible</option>
                    <option value="kjv">King James Version</option>
                    <option value="drb">Douay–Rheims</option>
                    <option value="brenton">Brenton</option>
                  </select>
                </label>
              )}
              <span className={view.localStatus}>
                {session ? "Local search" : "Connecting…"}
              </span>
            </div>
            {draft.scope === "text" && (
              <details className={view.suppliedText} open>
                <summary>Your source text</summary>
                <p>
                  Paste an excerpt or choose a .txt / .md file. Up to 32,000
                  characters; stored locally.
                </p>
                <div className={view.fileRow}>
                  <label>
                    Text name
                    <input
                      required
                      maxLength={100}
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Choose a text file
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (
                            file.size > 128000 ||
                            !/\.(txt|md)$/i.test(file.name)
                          )
                            throw new Error(
                              "Choose a .txt or .md file under 128 KB.",
                            );
                          const text = new TextDecoder("utf-8", {
                            fatal: true,
                          }).decode(await file.arrayBuffer());
                          if (text.length > 32000 || text.includes("\0"))
                            throw new Error(
                              "Select at most 32,000 text characters.",
                            );
                          setDraft((current) => ({
                            ...current,
                            name: file.name,
                            text,
                          }));
                          setError("");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    />
                  </label>
                </div>
                <label>
                  Supplied text
                  <textarea
                    required
                    maxLength={32000}
                    rows={5}
                    value={draft.text}
                    onChange={(e) =>
                      setDraft({ ...draft, text: e.target.value })
                    }
                  />
                </label>
              </details>
            )}
          </fieldset>
        </form>
        {!run && (
          <div className={view.examples}>
            {examples.map((example) => (
              <button
                type="button"
                key={example.query}
                disabled={!!busy || !session}
                onClick={() => {
                  const next = {
                    ...draft,
                    scope: "scripture" as const,
                    query: example.query,
                  };
                  setDraft(next);
                  search(next);
                }}
              >
                <span className={view.exampleNumber}>{example.mark}</span>
                <strong>{example.label}</strong>
                <span>{example.hint}</span>
                <span className={view.exampleArrow} aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        )}
        {!run && (
          <p className={view.landingNote}>
            Start with sources. Jev can assess the passages you find.
            <br />
            Experimental English research · every finding remains yours to
            review.
          </p>
        )}
      </section>

      {busy && (
        <div className={view.progress}>
          <p role="status">
            <span className={view.spinner} aria-hidden="true" />
            {busy}
          </p>
          <button
            type="button"
            onClick={() => {
              pending.current?.abort();
              setBusy("");
              setError(
                "Operation canceled. Completed work is available in Recent searches.",
              );
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={view.notice}>
          {error}
        </p>
      )}

      {run && (
        <section
          aria-labelledby="evidence-results"
          className={view.exploration}
        >
          <header className={view.resultsHeader}>
            <div>
              <p className={view.eyebrow}>Follow the evidence</p>
              <h1 id="evidence-results">{run.request.query}</h1>
              <p>
                {run.hits.length} candidates from{" "}
                {run.coverage.passages.toLocaleString()} passages & excerpts
              </p>
            </div>
            <details className={view.coverage}>
              <summary>Search coverage & saved report</summary>
              <div>
                <h2>What this search covered</h2>
                <p>
                  {run.coverage.sources} sources ·{" "}
                  {run.coverage.semantic.toLocaleString()} passages ranked by
                  meaning.
                </p>
                {run.coverage.notes.map((n) => (
                  <p key={n}>{n}</p>
                ))}
                <p>
                  Jev assesses the shortlist, not passages outside it.{" "}
                  {assessed} of {run.hits.length} candidates assessed. Status:{" "}
                  {run.status}.
                </p>
                <p>
                  {run.attempts} Jev attempts ·{" "}
                  {run.inputTokens.toLocaleString()} input /{" "}
                  {run.outputTokens.toLocaleString()} output tokens.
                </p>
                <p className={view.meta}>
                  {run.id} · {run.model} · {run.rubric}
                </p>
                <button type="button" onClick={download}>
                  Download research JSON
                </button>
                <p>
                  Unreviewed snapshot. Keeping a passage does not approve it for
                  publication.
                </p>
              </div>
            </details>
          </header>
          {run.issues.map((issue, i) => (
            <p key={i} role="alert" className={view.notice}>
              {issue}
            </p>
          ))}
          <div className={view.assessBar}>
            <div>
              <strong>
                {assessed
                  ? assessed + " passages assessed by Jev"
                  : "Go beyond a search match"}
              </strong>
              <span>
                {session?.keyAvailable
                  ? "Optional review sends passages and context to TypeSafe. Findings remain unreviewed."
                  : "Local search is ready. Configure your TypeSafe key to assess relevance and connections."}
              </span>
            </div>
            <button
              type="button"
              disabled={!!busy || !session?.keyAvailable || !run.hits.length}
              onClick={() =>
                void perform(
                  "/find/evaluate",
                  { id: run.id },
                  "Assessing " + run.hits.length + " passages with Jev…",
                )
              }
            >
              {assessed ? "Refresh assessment" : "Assess relevance"}
              <span aria-hidden="true"> ↗</span>
            </button>
          </div>
          <div className={view.workbench} data-mobile-reading={mobileReading}>
            <section className={view.resultPane} aria-label="Passage results">
              <div className={view.listHead}>
                <h2 ref={resultsTitle} tabIndex={-1}>
                  Passages <span>{visible.length}</span>
                </h2>
                {assessed > 0 && (
                  <select
                    aria-label="Result order"
                    value={order}
                    onChange={(e) => setOrder(e.target.value as typeof order)}
                  >
                    <option value="retrieval">Search order</option>
                    <option value="jev">Jev relevance groups</option>
                  </select>
                )}
              </div>
              <div className={view.filters} aria-label="Filter passages">
                {(
                  [
                    ["all", "All passages"],
                    ["phrase", "Phrase matches"],
                    ["kept", "Kept (" + kept.length + ")"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={filter === id}
                    onClick={() => {
                      setFilter(id);
                      setMobileReading(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {order === "jev" && (
                <p className={view.quiet}>
                  Direct relevance, indirect relevance, needs context, then unrelated.
                  Unassessed passages follow. Estimates break ties within each group.
                </p>
              )}
              <ol className={view.resultList}>
                {visible.map((hit, index) => (
                  <li key={hit.block.id}>
                    <button
                      type="button"
                      aria-pressed={block?.id === hit.block.id}
                      className={view.resultButton}
                      onClick={() => selectHit(hit)}
                      onKeyDown={(e) => {
                        const move =
                          e.key === "ArrowDown"
                            ? index + 1
                            : e.key === "ArrowUp"
                              ? index - 1
                              : e.key === "Home"
                                ? 0
                                : e.key === "End"
                                  ? visible.length - 1
                                  : null;
                        if (move === null) return;
                        e.preventDefault();
                        const target =
                          visible[(move + visible.length) % visible.length];
                        setSelectedId(target.block.id);
                        setTab("passage");
                        const buttons = e.currentTarget
                          .closest("ol")
                          ?.querySelectorAll<HTMLButtonElement>("button");
                        buttons?.[
                          (move + visible.length) % visible.length
                        ]?.focus();
                      }}
                    >
                      <span className={view.resultNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={view.resultBody}>
                        <strong>
                          {titleFor(hit.block, canons)}
                          {kept.includes(hit.block.id) && (
                            <span aria-label="Kept"> ✦</span>
                          )}
                        </strong>
                        <span className={view.excerpt}>{hit.block.text}</span>
                        <span className={view.resultMeta}>
                          {hit.judgment
                            ? words(hit.judgment.answers.relation.choice)
                            : retrievalLabel(hit)}
                          {hit.error ? " · assessment incomplete" : ""}
                        </span>
                      </span>
                      <span className={view.rowArrow} aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              {!visible.length && (
                <div className={view.empty}>
                  <h3>
                    {filter === "kept"
                      ? "Keep a passage to return to it"
                      : filter === "phrase"
                        ? "No exact phrase matches"
                        : "No passages found"}
                  </h3>
                  <p>
                    {filter === "all"
                      ? "Try a shorter phrase or another source collection. Check coverage for unavailable sources."
                      : "Choose All passages to explore the other candidates."}
                  </p>
                  {filter !== "all" && (
                    <button type="button" onClick={() => setFilter("all")}>
                      Show all passages
                    </button>
                  )}
                </div>
              )}
            </section>

            {block && selected ? (
              <section
                id="selected-passage"
                className={view.reader}
                aria-label="Selected passage"
              >
                <button
                  type="button"
                  className={view.back}
                  onClick={() => {
                    setMobileReading(false);
                    requestAnimationFrame(() => resultsTitle.current?.focus());
                  }}
                >
                  ← All passages
                </button>
                <div className={view.readerTools}>
                  <span>
                    {block.edition} · {words(block.role)}
                  </span>
                  <button
                    type="button"
                    aria-pressed={kept.includes(block.id)}
                    onClick={() => toggleKeep(block.id)}
                  >
                    {kept.includes(block.id) ? "✦ Kept" : "+ Keep passage"}
                  </button>
                </div>
                <h2
                  ref={readerTitle}
                  tabIndex={-1}
                  className={view.passageTitle}
                >
                  {titleFor(block, canons)}
                </h2>
                <div
                  className={view.tabs}
                  role="tablist"
                  aria-label="Explore selected passage"
                >
                  {tabs.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      role="tab"
                      id={"tab-" + item.id}
                      aria-controls="reading-panel"
                      aria-selected={tab === item.id}
                      tabIndex={tab === item.id ? 0 : -1}
                      onClick={() => setTab(item.id)}
                      onKeyDown={(e) => {
                        const move =
                          e.key === "ArrowRight"
                            ? index + 1
                            : e.key === "ArrowLeft"
                              ? index - 1
                              : e.key === "Home"
                                ? 0
                                : e.key === "End"
                                  ? tabs.length - 1
                                  : null;
                        if (move === null) return;
                        e.preventDefault();
                        const next = tabs[(move + tabs.length) % tabs.length];
                        setTab(next.id);
                        document.getElementById("tab-" + next.id)?.focus();
                      }}
                    >
                      {item.label}
                      {item.id === "connections" && connections
                        ? " · " + connections.outcomes.length
                        : ""}
                    </button>
                  ))}
                </div>
                <div
                  id="reading-panel"
                  role="tabpanel"
                  aria-labelledby={"tab-" + tab}
                  tabIndex={0}
                  className={view.readingPanel}
                >
                  {tab === "passage" && (
                    <>
                      <p className={view.eyebrow}>{retrievalLabel(selected)}</p>
                      <blockquote className={view.passageText}>
                        {block.text}
                      </blockquote>
                      <div className={view.readingActions}>
                        <button type="button" onClick={() => setTab("context")}>
                          Read surrounding context →
                        </button>
                        {block.href && (
                          <a href={block.href} target="_blank" rel="noreferrer">
                            Open this edition ↗
                          </a>
                        )}
                      </div>
                      <p className={view.quiet}>
                        A search match is a starting point. Context can support,
                        qualify, or change its meaning.
                      </p>
                    </>
                  )}
                  {tab === "context" && (
                    <>
                      <p className={view.eyebrow}>Surrounding source text</p>
                      <SourceContext
                        text={block.context || block.text}
                        canons={canons}
                      />
                      {block.href && (
                        <a href={block.href} target="_blank" rel="noreferrer">
                          Continue in this edition ↗
                        </a>
                      )}
                    </>
                  )}
                  {tab === "connections" && (
                    <>
                      <h3>Where else does this lead?</h3>
                      <p>
                        Compare this passage with up to four candidates from
                        this search. Jev distinguishes similar wording,
                        paraphrase, and a shared theme.
                      </p>
                      {connections ? (
                        <>
                          <ul className={view.connections}>
                            {connections.outcomes.map((outcome) => (
                              <li key={outcome.unit.id}>
                                <p className={view.connectionLabel}>
                                  {outcome.answer
                                    ? words(outcome.answer.choice)
                                    : "Incomplete assessment"}
                                  {outcome.exactMatch
                                    ? " · exact text match"
                                    : ""}
                                </p>
                                <h4>{titleFor(outcome.unit.right, canons)}</h4>
                                <blockquote>
                                  {outcome.unit.right.text}
                                </blockquote>
                                <details>
                                  <summary>
                                    Compare both passages & judgment
                                  </summary>
                                  <p className={view.eyebrow}>
                                    {titleFor(block, canons)}
                                  </p>
                                  <blockquote>{block.text}</blockquote>
                                  <p>{outcome.unit.right.edition}</p>
                                  <SourceContext
                                    text={outcome.unit.right.context}
                                    canons={canons}
                                  />
                                  {outcome.answer && (
                                    <>
                                      <p>Model uncertainty across relationship labels; these percentages do not establish quotation or historical influence.</p>
                                      <Distribution values={outcome.answer.probabilities} />
                                    </>
                                  )}
                                  {outcome.error && <p>{outcome.error}</p>}
                                  {outcome.unit.right.href && (
                                    <a
                                      href={outcome.unit.right.href}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open connected passage ↗
                                    </a>
                                  )}
                                </details>
                              </li>
                            ))}
                          </ul>
                          <Link
                            className={view.reviewLink}
                            href={
                              "/scriptures/research?run=" + connections.runId
                            }
                          >
                            Review connections & approve findings →
                          </Link>
                          <p className={view.quiet}>
                            These unreviewed relationships do not establish
                            quotation, historical influence, or theological
                            agreement. Distributions express model uncertainty.
                          </p>
                        </>
                      ) : (
                        <div className={view.connectionPrompt}>
                          <span aria-hidden="true">↗</span>
                          <p>Follow a connection without losing your place.</p>
                          <button
                            type="button"
                            className={view.primary}
                            disabled={
                              !!busy ||
                              !session?.keyAvailable ||
                              run.hits.length < 2
                            }
                            onClick={() =>
                              void perform(
                                "/find/connect",
                                { id: run.id, sourceId: block.id },
                                "Assessing up to four connections…",
                              )
                            }
                          >
                            Explore connections
                          </button>
                          <small>
                            Sends the paired passages and context to TypeSafe.
                          </small>
                        </div>
                      )}
                    </>
                  )}
                  {tab === "assessment" && (
                    <>
                      {selected.judgment ? (
                        <>
                          <p className={view.eyebrow}>
                            Jev relevance assessment · unreviewed
                          </p>
                          <h3>
                            {words(selected.judgment.answers.relation.choice)}
                          </h3>
                          <p>
                            Assessment of this passage against “
                            {run.request.query}”. Relevant passages can include
                            contrary evidence.
                          </p>
                          <p className={view.quiet}>
                            This is an unreviewed model judgment. Its accuracy for
                            this research task has not been established.
                          </p>
                          <details>
                            <summary>Model uncertainty and ranking details</summary>
                            <p>
                              The percentages describe the model’s distribution
                              across relevance labels. They do not measure whether
                              a historical or theological claim is true.
                            </p>
                            <Distribution values={selected.judgment.answers.relation.probabilities} />
                            <p>
                              Helpfulness estimate (0–1):{" "}
                              {selected.judgment.answers.useful.noul.toFixed(2)}.
                              Jev estimates whether this passage helps investigate
                              your question. This breaks ties within a relevance
                              group; it is not a measured accuracy score.
                            </p>
                          </details>
                          <p className={view.meta}>
                            {selected.judgment.model} ·{" "}
                            {selected.cached ? "Cached assessment" : "New assessment"}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3>
                            {selected.error
                              ? "Assessment incomplete"
                              : "Read first. Then assess."}
                          </h3>
                          <p>
                            {selected.error ??
                              "This passage was found through search. Use Assess relevance above to ask Jev how it relates to your question."}
                          </p>
                        </>
                      )}
                    </>
                  )}
                  <details className={view.provenance}>
                    <summary>Source details</summary>
                    <p>
                      {block.edition} · {words(block.role)} · {block.language}
                    </p>
                    <p>
                      {block.path} · {JSON.stringify(block.pointer)}
                    </p>
                    <p>
                      Characters {block.start}–{block.end} (UTF-16). Exact
                      source fingerprint:
                    </p>
                    <code>{block.artifactHash}</code>
                  </details>
                </div>
              </section>
            ) : (
              <div className={view.readerEmpty}>
                <span aria-hidden="true">↗</span>
                <p>
                  A passage opens here.
                  <br />
                  Its context stays close.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
      <footer className={view.footer}>
        <span>Local research · Experimental</span>
        <Link href="/scriptures">Browse the Scripture library ↗</Link>
        <span>English pilot · Human review before publication</span>
      </footer>
    </div>
  );
}
