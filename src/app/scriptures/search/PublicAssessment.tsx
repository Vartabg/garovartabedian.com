"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { PublicSource, PublicPassage } from "@/lib/find-server/sources";
import type { FindReply } from "@/lib/find-server/evaluation";
export const PublicAssessmentEnabled = createContext(false);
type Job = {
  id: string;
  status: string;
  passages: PublicPassage[];
  items: {
    position: number;
    state: string;
    reply: FindReply | null;
    error: string | null;
  }[];
};
const names: Record<string, string> = {
  "directly-relevant": "Directly relevant",
  "indirectly-relevant": "Related theme",
  "insufficient-context": "Needs more context",
  unrelated: "Unrelated",
  "close-wording": "Close wording",
  "substantial-paraphrase": "Substantial paraphrase",
  "thematic-overlap": "Thematic overlap only",
};
async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Assessment request failed.");
  return result;
}
export default function PublicAssessment({
  query,
  sources,
  anchor,
}: {
  query: string;
  sources: PublicSource[];
  anchor?: PublicSource;
}) {
  const enabled = useContext(PublicAssessmentEnabled);
  const [id, setId] = useState(""),
    [job, setJob] = useState<Job | null>(null),
    [error, setError] = useState(""),
    [starting, setStarting] = useState(false);
  const key = "find-assessment:" + JSON.stringify(anchor ? [query, sources, anchor] : [query, sources]);
  useEffect(() => {
    setId("");
    setJob(null);
    setError("");
    if (enabled)
      try {
        setId(localStorage.getItem(key) ?? "");
      } catch {}
  }, [key, enabled]);
  useEffect(() => {
    if (!id || !enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = (await request(
          `/api/find/jobs/${encodeURIComponent(id)}`,
          { signal: controller.signal },
        )) as Job;
        setJob(data);
        if (data.status === "running") timer = setTimeout(poll, 2500);
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, enabled]);
  if (!enabled || !sources.length) return null;
  async function start() {
    setStarting(true);
    setError("");
    try {
      await request("/api/find/session", { method: "POST" });
      const next = await request("/api/find/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sources, ...(anchor ? { anchor } : {}) }),
      });
      try {
        localStorage.setItem(key, next.id);
      } catch {}
      setJob(null);
      setId("");
      setTimeout(() => setId(next.id), 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }
  async function cancel() {
    try {
      await request(`/api/find/jobs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setJob((j) => (j ? { ...j, status: "cancelled" } : null));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="scr-related scr-relevance" aria-label={anchor ? "Connection check" : "Find relevance check"}>
      <div className="scr-relevance-heading">
        <h3>{anchor ? "Connection check" : "Find relevance check"}</h3>
        <span>Experimental AI</span>
      </div>
      <p>
        {anchor
          ? "Compare the selected Scripture passage with the full early-writing paragraph, using their context. Similarity does not establish historical borrowing, agreement, or proof."
          : <>Check how {sources.length === 1 ? "this passage relates" : `the first ${sources.length} passages relate`}{" "}to your search, using the surrounding text.</>}
      </p>
      <p className="scr-relevance-allowance">
        10 checks per day in this browser · Up to 20 passages per check
      </p>
      {(!job || job.status !== "running" || error) && (
        <button
          className="scr-btn"
          type="button"
          disabled={starting}
          onClick={start}
        >
          {starting
            ? "Starting check…"
            : job && job.status !== "running"
              ? "Reload saved check"
            : id
              ? "Resume check"
              : anchor ? "Check this connection" : "Check relevance"}
        </button>
      )}
      {job?.status === "running" && (
        <button className="scr-btn" type="button" onClick={cancel}>
          Cancel check
        </button>
      )}
      <p role="status">
        {error ||
          (job
            ? `${job.items.filter((i) => ["complete", "incomplete"].includes(i.state)).length} of ${job.items.length} processed · ${job.status}`
            : starting
              ? anchor ? "Starting your connection check…" : "Starting your relevance check…"
              : "")}
      </p>
      <details className="scr-relevance-about">
        <summary>How it works and privacy</summary>
        <p>
          Choosing a check sends {anchor ? "the selected passages" : "your search and the selected passages"} and
          their context to an external AI service. Only these passages are
          checked. Judgments are unreviewed, and their accuracy for this task
          has not been established. Read the sources alongside the results.
        </p>
        <p>
          A browser cookie keeps your checks private to this guest session.
          Saved checks expire after seven days. Reopening the same saved check
          does not use another daily check. The allowance resets at midnight UTC;
          shared network and site limits may also apply. Regular search stays
          available when the allowance is used.
        </p>
      </details>
      {job && (
        <ol className="scr-relevance-results">
          {job.items.map((item) => {
            const p = job.passages[item.position];
            const answer = item.reply && ("judgment" in item.reply.answers ? item.reply.answers.judgment : item.reply.answers.relation);
            return (
              <li key={item.position}>
                <div className="scr-relevance-result-head">
                  <a href={p.href}>{p.title}</a>
                  <span>
                    {answer
                      ? names[answer.choice]
                      : (item.error ?? item.state)}
                  </span>
                  {answer && <strong className="scr-relevance-review">Unreviewed</strong>}
                </div>
                <details>
                  <summary>Passage and context</summary>
                  <p>
                    {p.edition} · {p.role === "translated-scripture" ? "Translated Scripture" : p.role === "legacy-edition; may include translator/editorial material" ? "Hosted edition; may include translator or editorial material" : p.role}
                  </p>
                  <blockquote>{p.text}</blockquote>
                  <p style={{ whiteSpace: "pre-wrap" }}>{p.context}</p>
                </details>
                {answer && (
                  <details>
                    <summary>How certain is this result?</summary>
                    <p>
                      These values show the AI model’s uncertainty across{" "}
                      {anchor ? "relationship" : "relevance"} labels. They do not measure whether a historical
                      or theological claim is true.
                    </p>
                    <ul>
                      {Object.entries(
                        answer.probabilities,
                      ).map(([label, value]) => (
                        <li key={label}>
                          {names[label as keyof typeof names]}:{" "}
                          {(value * 100).toFixed(1)}%
                        </li>
                      ))}
                    </ul>
                    <p>AI assessment · Not reviewed by an editor</p>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
