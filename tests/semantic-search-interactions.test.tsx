import { dom } from "./fixtures/semantic-dom";
import assert from "node:assert/strict";
import { after, afterEach, beforeEach, test } from "node:test";
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import MeaningRail from "../src/app/_components/MeaningRail";
import ResonanceRadar from "../src/app/_components/ResonanceRadar";
import { MeaningMatches } from "../src/app/scriptures/search/SearchRoom";
import { AfterlifeExplorer } from "../src/app/evidence/frameworks/AfterlifeExplorer";
import { rememberMeaningSearchOptIn } from "../src/lib/semantic-opt-in";
import { abortError } from "../src/lib/scriptures/cancellation";
import type { searchCorpus, WordsEntry, AfterlifeEntry } from "../src/lib/semantic-corpus";
import type { searchSemantic } from "../src/lib/scriptures/semantic";
import { RESONANCE_SPARKS, type searchOmniResonance, type OmniResonanceResult } from "../src/lib/semantic-resonance";
import canonsData from "../public/scriptures/canons.json";
import type { Canons } from "../src/lib/scriptures/types";

let root: Root;
const host = dom.window.document.getElementById("root")!;
beforeEach(() => { dom.window.localStorage.clear(); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); });
after(() => dom.window.close());
const render = async (node: React.ReactNode) => { await act(async () => root.render(node)); };
const click = async (element: Element) => { await act(async () => {
  element.dispatchEvent(new MouseEvent("click", {bubbles:true}));
}); };
const button = (text: string) => [...host.querySelectorAll("button")].find(el => el.textContent === text)!;
const fill = async (text: string) => { await act(async () => {
  const input = host.querySelector("input")!;
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, text);
  input.dispatchEvent(new Event("input", {bubbles:true}));
}); };
function pending<T>() {
  let resolve!: (value:T) => void, reject!: (error:Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve=yes; reject=no; });
  return {promise, resolve, reject};
}
type Call<T> = ReturnType<typeof pending<T>> & {signal?:AbortSignal; progress?: (status:string) => void};

// Stubs deliberately ignore abort, allowing late callbacks to test UI guards.
test("MeaningRail survives StrictMode replay, replaces requests, and ignores stale progress/errors", async () => {
  const calls: Call<{model:string; hits:[]} >[] = [];
  const search: typeof searchCorpus<WordsEntry> = (_corpus, _query, options) => {
    const call = {...pending<{model:string; hits:[]}>(), signal:options?.signal, progress:options?.onProgress};
    calls.push(call); return call.promise;
  };
  const rail = (query:string) => <StrictMode><MeaningRail<WordsEntry> corpus="words" label="Ask" note="Scope"
    placeholder="Query" initialQuery={query} search={search} renderHit={() => null}/></StrictMode>;
  rememberMeaningSearchOptIn();
  await render(rail("old"));
  assert.equal(calls.length, 2); assert.equal(calls[0].signal?.aborted, true);
  assert.equal(calls[1].signal?.aborted, false);
  await render(rail("current"));
  assert.equal(calls[1].signal?.aborted, true);
  await act(async () => { calls[2].progress?.("current progress"); calls[1].progress?.("stale progress"); calls[1].reject(new Error("late failure")); });
  assert.match(host.textContent!, /current progress/); assert.equal(host.querySelector('[role="alert"]'), null);
  await act(async () => { calls[2].resolve({model:"fixture", hits:[]}); });
  assert.match(host.textContent!, /Nothing here ranked close to “current”/);
  await render(rail("pending"));
  await render(null); assert.equal(calls[3].signal?.aborted, true);
});

test("MeaningMatches ignores replacement aborts and displays genuine active errors", async () => {
  const calls: Call<{model:string; hits:[]; scannedBooks:[]}>[] = [];
  const search: typeof searchSemantic = (_query, progress, options) => {
    const call = {...pending<{model:string; hits:[]; scannedBooks:[]}>(), signal:options?.signal, progress};
    calls.push(call); return call.promise;
  };
  const exact = {hits:[], totalHits:0, books:[], translation:"web" as const, searched:[], dropped:[], missing:[]};
  const canons = {books:{},bookOrder:[],traditions:[],translations:{}} as unknown as Canons;
  const room = (query:string) => <MeaningMatches q={query} exact={exact} canons={canons} trans="web" search={search}/>;
  rememberMeaningSearchOptIn(); await render(room("old")); await render(room("new"));
  assert.equal(calls[0].signal?.aborted, true);
  await act(async () => { calls[0].reject(abortError()); calls[1].progress?.("active progress"); });
  assert.equal(host.querySelector('[role="alert"]'), null); assert.match(host.textContent!, /active progress/);
  await act(async () => { calls[1].reject(new Error("offline")); });
  assert.match(host.querySelector('[role="alert"]')!.textContent!, /couldn’t load/);
});

test("ResonanceRadar preset replacement keeps the newest result after older work resolves", async () => {
  const calls: Call<OmniResonanceResult>[] = [];
  const search: typeof searchOmniResonance = (_query, options) => {
    const call = {...pending<OmniResonanceResult>(), signal:options?.signal, progress:options?.onProgress};
    calls.push(call); return call.promise;
  };
  await render(<ResonanceRadar search={search}/>);
  await click(button(RESONANCE_SPARKS[0].label)); await click(button(RESONANCE_SPARKS[1].label));
  assert.equal(calls[0].signal?.aborted, true);
  const result = (query:string): OmniResonanceResult => ({query, model:"fixture", horizons:[], peakHorizon:null,
    highestScore:0, allByRelevance:[], coverage:{indexedChapters:0, assignedChapters:0, excludedChapters:[], unindexedBooks:[]}});
  await act(async () => { calls[1].resolve(result(RESONANCE_SPARKS[1].query)); });
  await act(async () => { calls[0].resolve(result("stale")); calls[0].progress?.("late progress"); });
  assert.match(host.querySelector('.scr-resonance-meta-bar')!.textContent!, new RegExp(RESONANCE_SPARKS[1].query));
  assert.doesNotMatch(host.textContent!, /late progress/);
  await click(button(RESONANCE_SPARKS[0].label)); await render(null);
  assert.equal(calls[2].signal?.aborted, true);
});

test("AfterlifeExplorer reset and clearing the query cancel pending work without late reentry", async () => {
  const calls: Call<{model:string; hits:[]}>[] = [];
  const search: typeof searchCorpus<AfterlifeEntry> = (_corpus, _query, options) => {
    const call = {...pending<{model:string; hits:[]}>(), signal:options?.signal, progress:options?.onProgress};
    calls.push(call); return call.promise;
  };
  await render(<AfterlifeExplorer initialBeliefs={[]} search={search}/>);
  await fill("water"); await click(button("Vector Search"));
  assert.equal(calls.length, 1);
  await click(button("Ranking…"));
  assert.equal(calls[0].signal?.aborted, true); assert.ok(button("Vector Search"));
  await act(async () => { calls[0].resolve({model:"fixture",hits:[]}); calls[0].progress?.("late"); });
  assert.doesNotMatch(host.textContent!, /ranked by vector|late/);
  await click(button("Vector Search")); await fill("");
  assert.equal(calls[1].signal?.aborted, true); assert.ok(button("Vector Search"));
  await act(async () => { calls[1].reject(abortError()); });
  assert.doesNotMatch(host.textContent!, /Ranking…|ranked by vector/);
  await fill("fire"); await click(button("Vector Search")); await render(null);
  assert.equal(calls[2].signal?.aborted, true);
});

test("meaning results retain WEB numbering, links and text when DRB is selected", async () => {
  const previous = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input); urls.push(url);
    return Response.json({book:"PSA", translation:"web", chapters:Array.from({length:23}, (_, i) =>
      i === 22 ? ["Yahweh is my shepherd; I shall lack nothing."] : [])});
  };
  try {
    const search: typeof searchSemantic = async () => ({model:"fixture", scannedBooks:["PSA"],
      hits:[{book:"PSA",chapter:23,verse:1,matched:0,score:.9}]});
    const exact = {hits:[{book:"PSA",chapter:23,verse:1,matched:1}],totalHits:1,books:[],translation:"drb" as const,searched:[],dropped:[],missing:[]};
    rememberMeaningSearchOptIn();
    await render(<MeaningMatches q="shepherd" exact={exact} canons={canonsData as Canons} trans="drb" search={search}/>);
    const link = host.querySelector('a[href*="/PSA/23"]');
    assert.ok(link, "a DRB result at the same numeric location must not hide a WEB result");
    assert.match(link.getAttribute("href")!, /t=web&find=shepherd&findTrans=drb#v1$/);
    assert.match(host.textContent!, /Meaning suggestions · WEB/);
    assert.match(host.textContent!, /Yahweh is my shepherd/);
    assert.ok(urls.some(url => url.includes("/text/web/PSA.json")));
    assert.ok(!urls.some(url => url.includes("/text/drb/")));
  } finally { globalThis.fetch = previous; }
});
