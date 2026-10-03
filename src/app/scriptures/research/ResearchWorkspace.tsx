"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Decision, Outcome, Run, TextBlock } from "../../../../scripts/research/types";
import type { WorkspaceRequest, WorkspaceRunSummary, WorkspaceSession, WorkspaceSource, WorkspaceTask } from "@/lib/research-workspace";
import styles from "./research.module.css";

const initial: WorkspaceRequest = { mode: "compare", left: { kind: "hosted", selector: "early:1clement:16" }, right: { kind: "hosted", selector: "scripture:web:ISA:53:4-6" }, claim: "Jesus wept.", wholeScripture: false };
const label = (value: string) => value.replaceAll("-", " ");
function download(text: string, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function SourceInput({ title, value, change }: { title: string; value: WorkspaceSource; change: (s: WorkspaceSource) => void }) {
  const [error, setError] = useState("");
  return <div className={styles.sourceInput}>
    <label>{title} — source type
      <select value={value.kind} onChange={e => { setError(""); change(e.target.value === "hosted" ? { kind: "hosted", selector: "scripture:web:JHN:11:35" } : { kind: "text", name: "excerpt.txt", text: "" }); }}>
        <option value="hosted">Hosted passage</option><option value="text">Supplied text or file</option>
      </select>
    </label>
    {value.kind === "hosted" ? <>
      <label>{title} — passage
        <input required value={value.selector} maxLength={180} onChange={e => change({ ...value, selector: e.target.value })} spellCheck={false} />
      </label>
      <small>Examples: scripture:web:ISA:53:4-6 · early:1clement:16 · early:barnabas:3</small>
    </> : <>
      <label>{title} — name<input required maxLength={100} value={value.name} onChange={e => change({ ...value, name: e.target.value })} /></label>
      <label>{title} — text<textarea required rows={7} maxLength={32000} value={value.text} onChange={e => change({ ...value, text: e.target.value })} /></label>
      <label>{title} — choose a .txt or .md file
        <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return;
          try {
            if (!/\.(txt|md)$/i.test(file.name) || file.size > 128000) throw new Error("Choose a .txt or .md file under 128 KB.");
            const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
            if (text.length > 32000 || text.includes("\0")) throw new Error("Choose a UTF-8 excerpt of at most 32,000 characters.");
            change({ kind: "text", text, name: file.name }); setError("");
          } catch (error) { setError((error as Error).message); }
        }} />
      </label>
      <small>English text, up to 32,000 characters. A private local copy preserves the exact input.</small>
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
function Passage({ block }: { block: TextBlock }) {
  return <section className={styles.passage}>
    <h4>{block.title}</h4><p className={styles.meta}>{block.edition} · {label(block.role)}</p>
    <blockquote>{block.text}</blockquote>
    {block.href && <a className="textlink" href={block.href} target="_blank" rel="noreferrer">Open source passage ↗</a>}
    <details><summary>Context and source location</summary><pre>{block.context}</pre>
      <p>{block.path} · {JSON.stringify(block.pointer)} · Characters {block.start}–{block.end} (UTF-16; end excluded)</p>
      <p>Source SHA-256: <code>{block.artifactHash}</code></p>
    </details>
  </section>;
}
function Finding({ outcome: o, decision, canReview, save }: { outcome: Outcome; decision?: Decision; canReview: boolean; save: (action: Decision["action"], notes: string) => Promise<void> }) {
  const [action, setAction] = useState<Decision["action"]>("defer"), [notes, setNotes] = useState("");
  return <article className={styles.finding}>
    <header className={styles.findingHead}><h3>{o.answer ? label(o.answer.choice) : o.error ? "Incomplete assessment" : "Ready for evaluation"}</h3>
      <span className={styles.badge}>{decision ? `Recorded: ${decision.action}` : "Awaiting review"}</span>
    </header>
    {o.error && <p role="alert" className={styles.error}>{o.error}</p>}
    <div className={styles.pair}>
      {o.unit.left ? <Passage block={o.unit.left} /> : <section className={styles.passage}><h4>Supplied claim</h4><blockquote>{o.unit.claim}</blockquote></section>}
      <Passage block={o.unit.right} />
    </div>
    <p className={styles.meta}>{o.exactMatch ? "Exact contained text found" : "No exact contained text"}{o.unit.explicit && " · Explicit citation candidate"}{o.answer && ` · ${o.cached ? "Cached result" : "New evaluation"} · ${Math.round(o.milliseconds)} ms`}</p>
    {o.answer && <details><summary>Model uncertainty and label distribution</summary>
      <p>The distribution describes the model’s judgment. It is not the probability that a historical or theological claim is true.</p>
      <dl className={styles.probabilities}>{Object.entries(o.answer.probabilities).map(([name, probability]) => <div key={name}>
        <dt>{label(name)}</dt><dd><meter min={0} max={1} value={probability} aria-label={`${label(name)} probability`} /> {(probability * 100).toFixed(1)}%</dd>
      </div>)}</dl><p>Model confidence: {(o.answer.confidence * 100).toFixed(1)}% · {o.model}</p>
    </details>}
    {decision && <aside className={styles.reviewNote}><strong>{decision.reviewer}</strong> · {new Date(decision.date).toLocaleString()}<p>{decision.notes}</p><small>Source and result validity are checked again on export.</small></aside>}
    {o.status === "complete" && <details><summary>Record an editorial decision</summary>
      <form className={styles.reviewForm} onSubmit={async e => { e.preventDefault(); await save(action, notes); }}>
        <label>Decision<select value={action} onChange={e => setAction(e.target.value as Decision["action"])}><option value="defer">Defer</option><option value="accept">Accept</option><option value="reject">Reject</option></select></label>
        <label>Review notes<textarea required maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></label>
        <button disabled={!canReview || !notes.trim()} type="submit">Save decision</button>
      </form>
    </details>}
  </article>;
}

export default function ResearchWorkspace() {
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [draft, setDraft] = useState<WorkspaceRequest>(initial);
  const [run, setRun] = useState<Run | null>(null), [decisions, setDecisions] = useState<Decision[]>([]);
  const [runs, setRuns] = useState<WorkspaceRunSummary[]>([]);
  const [task, setTask] = useState<WorkspaceTask | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [reviewer, setReviewer] = useState(""), [offline, setOffline] = useState(false);
  const working = busy || task?.state === "preparing" || task?.state === "evaluating";
  const api = useCallback(async (route: string, body?: unknown) => {
    const response = await fetch(`/api/research${route}`, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", "x-jev-session": session?.token ?? "" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error ?? "The local workspace is unavailable. Restart it and reload this page."); }
    return response;
  }, [session?.token]);
  const openRun = useCallback(async (id: string) => {
    const data = await (await api(`/runs/${id}`)).json(); setRun(data.run); setDecisions(data.decisions);
  }, [api]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/research/session", { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error("Start npm run research:jev:web to use the local workspace."); return r.json(); }).then(setSession).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!session) return;
    api("/runs").then(r => r.json()).then(setRuns).catch(e => setError(e.message));
  }, [api, session]);
  useEffect(() => {
    if (!session) return;
    const id = new URLSearchParams(window.location.search).get("run");
    if (id && /^[a-zA-Z0-9_-]+$/.test(id)) void openRun(id).catch(e => setError(e.message));
  }, [session, openRun]);
  const taskId = task?.id;
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false, timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next: WorkspaceTask = await (await api(`/tasks/${taskId}`)).json(); if (cancelled) return;
        setTask(next);
        if (next.state === "failed") { setError(next.error ?? "Research operation failed."); return; }
        if (next.state === "complete") { await openRun(next.runId); setRuns(await (await api("/runs")).json()); return; }
        timer = setTimeout(poll, 800);
      } catch (e) { if (!cancelled) { setError((e as Error).message); setTask(null); } }
    };
    void poll(); return () => { cancelled = true; clearTimeout(timer); };
  }, [taskId, api, openRun]);
  const edit = (patch: Partial<WorkspaceRequest>) => { setDraft(d => ({ ...d, ...patch })); setRun(null); setDecisions([]); setTask(null); setError(""); setNotice(""); };
  const perform = async (work: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice(""); try { await work(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const preview = (e: FormEvent) => { e.preventDefault(); void perform(async () => { setRun(null); setDecisions([]); setTask(await (await api("/preview", draft)).json()); }); };
  const latest = new Map(decisions.map(d => [d.unitId, d]));
  return <>
    <div className={styles.statusBar}><strong>{session ? session.keyAvailable ? "Saved key connected" : "Key setup needed" : "Connecting to local workspace…"}</strong><span>{session?.model ?? "Jev"} · English pilot</span></div>
    <p className={styles.disclosure}>Previewing uses local sources. Choosing Evaluate sends the selected text and context to TypeSafe. Similarity alone does not establish quotation, historical influence, or theological agreement.</p>
    <section className={styles.controls} aria-labelledby="choose-research"><h2 id="choose-research">Choose an investigation</h2>
      <div className={styles.presets}>
        <button type="button" disabled={!!working} onClick={() => edit(initial)}>1 Clement &amp; Isaiah</button>
        <button type="button" disabled={!!working} onClick={() => edit({ ...initial, mode: "discover", left: { kind: "hosted", selector: "early:barnabas:3" }, right: { kind: "hosted", selector: "scripture:web:ISA:58" } })}>Barnabas connections</button>
        <button type="button" disabled={!!working} onClick={() => edit({ ...initial, mode: "check-claim", right: { kind: "hosted", selector: "scripture:web:JHN:11:35" } })}>Check “Jesus wept”</button>
        <button type="button" disabled={!!working} onClick={() => edit({ ...initial, mode: "check-claim", claim: "The writer says gentle answers cause anger.", right: { kind: "text", name: "opposing-view.txt", text: 'A critic said, “Gentle answers always cause anger.” The writer rejects this view: gentle answers calm anger.' } })}>Try supplied text</button>
      </div>
      <form onSubmit={preview}><fieldset disabled={!!working || !session}>
        <legend className={styles.srOnly}>Research inputs</legend>
        <label>Research task<select value={draft.mode} onChange={e => edit({ mode: e.target.value as WorkspaceRequest["mode"] })}><option value="compare">Compare two passages</option><option value="discover">Discover connections</option><option value="check-claim">Check a supplied claim</option></select></label>
        <div className={styles.pair}>
          {draft.mode === "check-claim" ? <label className={styles.sourceInput}>Supplied claim<textarea required rows={5} maxLength={2000} value={draft.claim} onChange={e => edit({ claim: e.target.value })} /></label> : <SourceInput title="First passage" value={draft.left} change={left => edit({ left })} />}
          {draft.mode === "discover" && draft.wholeScripture ? <div className={styles.sourceInput}><h3>Hosted WEB Scripture</h3><p>Search the full local index. Jev assesses up to 20 candidates per source block, plus explicit citations. Omitted candidates remain unevaluated.</p></div> : <SourceInput title={draft.mode === "check-claim" ? "Evidence" : "Second passage"} value={draft.right} change={right => edit({ right })} />}
        </div>
        {draft.mode === "discover" && <label className={styles.check}><input type="checkbox" checked={draft.wholeScripture} onChange={e => edit({ wholeScripture: e.target.checked })} />Search all hosted WEB Scripture instead of the selected target</label>}
        <button className={styles.primary} type="submit">Preview sources and request count</button>
      </fieldset></form>
      {runs.length > 0 && <label className={styles.history}>Saved local runs<select disabled={!!working} value={run && runs.some(r => r.id === run.id) ? run.id : ""} onChange={e => { if (e.target.value) void perform(() => openRun(e.target.value)); }}><option value="">Choose a saved run…</option>{runs.map(r => <option key={r.id} value={r.id}>{r.status} · {r.planned} pairs · {r.title.slice(0, 70)} · {r.id.slice(-8)}</option>)}</select></label>}
    </section>
    {working && <p role="status" className={styles.progress}>{task?.state === "preparing" ? "Verifying sources and retrieving candidates…" : task?.state === "evaluating" ? `Evaluating… ${task.progress?.completed ?? 0} of ${task.progress?.planned ?? run?.planned ?? "…"} complete · ${task.progress?.attempts ?? 0} attempts` : "Saving…"}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
    {run && <section className={styles.results} aria-labelledby="results-title">
      <header><p className="kicker">{run.status === "dry-run" ? "SOURCE PREVIEW" : "RESEARCH RESULTS"}</p><h2 id="results-title">{run.planned} {run.planned === 1 ? "assessment" : "assessments"} · {label(run.status)}</h2>
        <p>{run.coverage.sourceBlocks} source blocks · {run.coverage.targetBlocks} target blocks · {run.attempts} API attempts · {run.outcomes.filter(o => o.cached).length} cached results</p>
        <p className={styles.meta}>Reported usage for this run: {run.usage?.inputTokens ?? 0} input / {run.usage?.outputTokens ?? 0} output tokens. Cached replay adds no new tokens.</p>
        <details><summary>Retrieval and context coverage</summary><p>{run.coverage.scope}</p><p>{run.coverage.explicitPairs} explicit-citation pairs. Run: <code>{run.id}</code></p></details>
        {run.issues.map((issue, i) => <p key={i} className={styles.error}>{issue}</p>)}
        <div className={styles.actions}>
          {run.id.startsWith("web-") && run.status !== "complete" && <>
            <label className={styles.check}><input disabled={!!working} type="checkbox" checked={offline} onChange={e => setOffline(e.target.checked)} />Use cached results only</label>
            <button type="button" className={styles.primary} disabled={!!working || !run.planned || run.status === "dry-run" && !!run.issues.length || !offline && !session?.keyAvailable} onClick={() => void perform(async () => { setTask(await (await api("/execute", { runId: run.id, offline })).json()); })}>{offline ? "Load cached judgments" : `Evaluate ${run.planned} ${run.planned === 1 ? "assessment" : "assessments"}`}</button>
          </>}
          <button type="button" disabled={!!working} onClick={() => download(JSON.stringify(run, null, 2), `${run.id}.json`)}>Download JSON</button>
          <button type="button" disabled={!!working} onClick={() => void perform(async () => download(await (await api(`/reports/${run.id}`)).text(), `${run.id}.html`, "text/html"))}>Download HTML report</button>
        </div>
      </header>
      <div className={styles.editorial}><label>Reviewer name<input maxLength={120} value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Enter your name before recording a decision" /></label>
        <p>{latest.size} of {run.outcomes.length} findings have a recorded decision. Accept only after inspecting the passages and context. Source changes invalidate approval.</p>
        <button type="button" disabled={!!working} onClick={() => void perform(async () => { const bundle = await (await api("/export", { runId: run.id })).json(); download(JSON.stringify(bundle, null, 2), `${run.id}-approved.json`); setNotice(`Exported ${bundle.findings.length} approved findings. Publication remains a separate editorial change.`); })}>Export approved findings</button>
      </div>
      {run.outcomes.map(o => <Finding key={`${run.id}-${o.unit.id}`} outcome={o} decision={latest.get(o.unit.id)} canReview={!!reviewer.trim() && !working} save={(action, notes) => perform(async () => { const data = await (await api("/review", { runId: run.id, finding: o.unit.id, action, notes, reviewer })).json(); setDecisions(data.decisions); setNotice("Editorial decision saved. Original model result retained."); })} />)}
    </section>}
  </>;
}
