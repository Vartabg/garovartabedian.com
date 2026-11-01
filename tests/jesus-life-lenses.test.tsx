import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import committedDetail from "../public/jesus/life-lenses-detail.json" with { type: "json" };
import committedIndex from "../public/jesus/life-lenses.json" with { type: "json" };
import { buildLifeLenses } from "../scripts/jesus/build-life-lenses";
import JesusHome from "../src/app/jesus/page";
import {
  findMoments,
  lensCount,
  passageHref,
  type LifeLensesDetail,
  type LifeLensesIndex,
} from "../src/lib/jesus/life-lenses";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const data = committedIndex as LifeLensesIndex;
// JSON imports widen the [label, text] verse tuples to string[][].
const detail = committedDetail as unknown as LifeLensesDetail;
const moment = (id: string) => {
  const found = data.moments.find((m) => m.id === id);
  assert.ok(found, id);
  return found;
};

test("the committed life data matches what the sources produce", () => {
  // A stale file fails here rather than showing words or passages the rooms no longer hold.
  const built = buildLifeLenses();
  assert.deepEqual(committedIndex, built.index);
  assert.deepEqual(committedDetail, built.detail);
});

test("every moment is joined to its passages, his words and prophecy by reference", () => {
  assert.equal(data.moments.length, 40);
  for (const m of data.moments) {
    const d = detail.moments[m.id];
    assert.ok(d.passages.length > 0, `${m.id} has passages`);
    assert.equal(m.counts.words, d.words.length, `${m.id} word count`);
    assert.equal(m.counts.prophecy, d.prophecy.length, `${m.id} prophecy count`);
    assert.ok(data.places.some((p) => p.id === m.place), `${m.id} is on the map`);
  }
  assert.equal(data.moments.filter((m) => m.counts.words).length, 29);
  assert.equal(data.moments.filter((m) => m.counts.prophecy).length, 15);

  assert.deepEqual(moment("baptism").books, ["MAT", "MRK", "LUK", "JHN"]);
  assert.equal(lensCount(moment("baptism"), "gospels"), 4);
  assert.deepEqual(detail.moments.baptism.words.map((w) => w.ref), ["Matthew 3:15"]);
  assert.equal(passageHref(detail.moments.baptism.passages[0]), "/scriptures/protestant/MAT/3?t=web#v13");
  assert.equal(moment("crucifixion").counts.prophecy, 7);
  assert.deepEqual(moment("crucifixion").risen, { count: 6, section: "death" });
  assert.deepEqual(moment("temptation").harmony, [{ id: "temptation", title: "The Temptation in the Wilderness" }]);
  // He is a child at the annunciation: no words, and no word-by-word comparison.
  assert.equal(moment("annunciation").counts.words, 0);
  assert.deepEqual(moment("annunciation").harmony, []);
});

test("finding a moment takes titles, places, phrases and references", () => {
  const ids = (q: string) => findMoments(data, q).map((m) => m.id);
  assert.equal(ids("lazarus")[0], "raising-lazarus");
  assert.ok(ids("John 11").includes("raising-lazarus"));
  assert.equal(ids("emmaus")[0], "emmaus-road");
  assert.ok(ids("jordan").includes("baptism"));
  assert.ok(ids("capernaum").includes("capernaum-ministry"));
  assert.deepEqual(ids("x"), []);
});

test("the Jesus page opens on his life, with nothing chosen for the visitor", () => {
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  const markup = renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <JesusHome />
    </AppRouterContext.Provider>,
  );

  assert.match(markup, /<h1[^>]*>The person himself\.<\/h1>/);
  for (const gone of ["One path, six stops", "guided path", "Every room, in any order", "Back to you"]) {
    assert.ok(!markup.includes(gone), `the page still says “${gone}”`);
  }

  // Forty moments on the line, in order; each is a real link to its place on the full map.
  const dots = [...markup.matchAll(/<a[^>]*href="\/jesus\/life#life-event-([a-z0-9-]+)"[^>]*class="jl-dot/g)].map((m) => m[1]);
  assert.equal(dots.length, 40);
  assert.deepEqual([dots[0], dots.at(-1)], ["annunciation", "ascension"]);
  assert.ok(!markup.includes('aria-current="true"'), "no moment is chosen before the visitor chooses one");
  assert.match(markup, /Choose a moment on the line or a place on the map\./);

  // The rooms, under names a reader recognizes.
  for (const label of ["All his words", "The full map", "Gospels word by word", "Research worksheets"]) {
    assert.match(markup, new RegExp(`>${label}</a>`));
  }
  assert.doesNotMatch(markup, />(Synoptic Harmony|NotebookLM)/);
});
