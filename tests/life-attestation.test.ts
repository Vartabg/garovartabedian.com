import test from "node:test";
import assert from "node:assert/strict";

import life from "../public/jesus/life.json" with { type: "json" };
import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import {
  GOSPELS,
  MIN_PARALLEL_SCORE,
  parallelScore,
  passageText,
  verifyEvents,
} from "../scripts/jesus/verify-attestation.mjs";
import type { LifeEvent } from "../src/lib/jesus/types";

const events = life.events as LifeEvent[];
const canons = canonsData as { books: Record<string, { chapters: number }> };
const gospelsFor = (event: LifeEvent) =>
  [...new Set(event.refs.map((entry) => entry.ref.split(" ")[0]))].filter((book) =>
    GOSPELS.includes(book),
  );

test("every claimed parallel really is a parallel account", () => {
  // The matrix turns these references into a visible claim about the record —
  // "only John tells this". A misremembered reference there is a false
  // statement that looks authoritative, so each cross-Gospel pair must share
  // the distinctive vocabulary parallel accounts share.
  const { failures } = verifyEvents(events);
  assert.deepEqual(failures, []);
});

test("every reference resolves in the hosted text", () => {
  for (const event of events) {
    assert.ok(event.refs.length > 0, `${event.id} cites nothing`);
    for (const entry of event.refs) {
      assert.ok(passageText(entry.ref), `${event.id}: ${entry.ref} does not resolve`);
      const match = /^([A-Z0-9]{3})\s+(\d+):/.exec(entry.ref);
      assert.ok(match, `${event.id}: unparseable ref ${entry.ref}`);
      const meta = canons.books[match[1]];
      assert.ok(meta, `${event.id}: unknown book ${match[1]}`);
      assert.ok(
        Number(match[2]) >= 1 && Number(match[2]) <= meta.chapters,
        `${event.id}: ${entry.ref} is outside the book`,
      );
    }
  }
});

test("no event repeats a reference", () => {
  for (const event of events) {
    const refs = event.refs.map((entry) => entry.ref);
    assert.equal(new Set(refs).size, refs.length, `${event.id} lists a reference twice`);
  }
});

test("the matrix would tell the truth about the shape of the record", () => {
  // The point of the row is that single-attested and four-fold events look
  // different. If the data collapsed to one shape the row would say nothing.
  const counts = new Map<number, number>();
  for (const event of events) {
    const n = gospelsFor(event).length;
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  assert.ok((counts.get(4) ?? 0) >= 5, "too few events attested by all four");
  assert.ok((counts.get(1) ?? 0) >= 10, "too few single-Gospel events");
  assert.ok(counts.size >= 3, "the record should not look uniform");

  // The famous single-witness cases must stay single-witness.
  for (const [id, only] of [
    ["wedding-at-cana", "JHN"],
    ["raising-lazarus", "JHN"],
    ["samaritan-woman", "JHN"],
    ["zacchaeus", "LUK"],
    ["emmaus-road", "LUK"],
  ] as const) {
    const event = events.find((entry) => entry.id === id);
    assert.ok(event, `${id} is gone from the map`);
    assert.deepEqual(gospelsFor(event), [only], `${id} should be ${only} alone`);
  }
});

test("events in all four Gospels really are the ones told four times", () => {
  const fourfold = events.filter((event) => gospelsFor(event).length === 4).map((e) => e.id);
  for (const id of ["baptism", "feeding-5000", "triumphal-entry", "crucifixion"]) {
    assert.ok(fourfold.includes(id), `${id} should be attested by all four`);
  }
});

test("a disputed ordering is named rather than resolved away", () => {
  // The temple cleansing is the textbook case: John puts it at the start of the
  // ministry, the Synoptics at the end, and the wording is close enough that
  // they describe one scene. Harmonising that silently would be the site
  // choosing a side without saying so.
  const cleansing = events.find((event) => event.id === "temple-cleansing");
  assert.ok(cleansing?.orderingNote, "the temple cleansing lost its ordering note");
  assert.match(cleansing.orderingNote.note, /John/);
  assert.ok(cleansing.orderingNote.refs.some((entry) => entry.ref.startsWith("JHN 2")));

  // And the note's own claim is checkable: John 2 and Mark 11 do read as the
  // same scene, which is exactly why the ordering is disputed rather than
  // simply two different events.
  const johannine = passageText("JHN 2:13-22");
  const synoptic = passageText("MRK 11:15-17");
  assert.ok(johannine && synoptic);
  assert.ok(
    parallelScore(johannine, synoptic).score > MIN_PARALLEL_SCORE,
    "John 2 and Mark 11 should read as the same scene",
  );
});

test("a composite entry is not passed off as corroboration", () => {
  const composites = events.filter((event) => event.composite);
  assert.ok(composites.length > 0);
  for (const event of composites) {
    assert.ok(
      gospelsFor(event).length >= 2,
      `${event.id} is marked composite but cites one Gospel`,
    );
  }
});
