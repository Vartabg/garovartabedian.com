import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RisenRoom from "../src/app/jesus/risen/RisenRoom";
import { getRisen } from "../src/lib/jesus/server";
import { parseRef } from "../src/lib/scriptures/refs";
import { canons } from "../src/lib/scriptures/server/canons";
import type { RisenData } from "../src/lib/jesus/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const data = getRisen();

const fixture: RisenData = {
  movements: ["death", "tomb", "forty", "ascension"].map((id) => ({
    id,
    name: `The ${id} movement`,
    window: "A test window",
    question: "What do the sources report?",
    line: "A test movement.",
  })),
  moments: [
    {
      id: "test-moment",
      movement: "death",
      clock: "The third hour",
      title: "A test moment",
      line: "A test line.",
      attestation: "Matthew only",
      refs: [{ ref: "MAT 27:45" }],
      tension: "A test difference between accounts.",
    },
    {
      id: "orphan-moment",
      movement: "no-such-movement",
      clock: "The sabbath",
      title: "Should not render",
      line: "Belongs to a movement the room does not have.",
      attestation: "Luke only",
      refs: [{ ref: "LUK 23:56" }],
    },
  ],
  appearances: [
    {
      id: "test-appearance",
      who: "A test witness",
      where: "A test place",
      when: "Sunday",
      line: "A test appearance line.",
      sources: [{ book: "MAT", ref: "MAT 28:9-10" }],
      note: "A test note.",
    },
  ],
  descent: [
    {
      id: "test-record",
      name: "A test text",
      date: "2nd century",
      kind: "Legend",
      claim: "A test claim.",
      establishes: "A limited historical point.",
      limits: "It does not establish the event.",
      sourceUrl: "https://example.com/text",
      sourceLabel: "Test translation",
    },
  ],
  outsideCanon: [
    {
      id: "test-apocryphon",
      group: "risen-dialogues",
      name: "A test apocryphon",
      date: "2nd century",
      survives: "One test manuscript.",
      kind: "Revelatory dialogue",
      claim: "A test continuation of the story.",
      establishes: "It establishes that later readers continued the story.",
      limits: "It does not establish another eyewitness to the event.",
      sourceUrl: "https://example.com/catalog",
      sourceLabel: "Test scholarly catalog",
    },
  ],
  questions: [
    {
      id: "test-question",
      question: "A test question?",
      answer: "A test answer.",
      refs: [{ ref: "MRK 16:8" }],
    },
  ],
};

test("the room leads with the boundary and keeps each moment's attestation visible", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /From the cross to the ascension/);
  assert.match(markup, /No source describes the resurrection itself/);
  assert.match(markup, /Matthew only/);
  assert.match(markup, /Where the accounts differ/);
  assert.match(markup, /A test difference between accounts\./);
  assert.match(markup, /What this shows/);
  assert.match(markup, /Where it stops/);
  assert.match(markup, /A test question\?/);
});

test("the room labels its five narrative plates as interpretive artwork", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);
  const labels = markup.match(/Interpretive illumination/g) ?? [];

  assert.equal(labels.length, 5);
  assert.match(markup, /open-tomb\.jpg/);
  assert.match(markup, /death-hours\.jpg/);
  assert.match(markup, /sabbath-silence\.jpg/);
  assert.match(markup, /appearances-triptych\.jpg/);
  assert.match(markup, /olivet-witnesses\.jpg/);
});

test("moments render only under their own movement", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /A test moment/);
  assert.doesNotMatch(markup, /Should not render/);
});

test("the primary story and the evidence lanes are visibly distinct", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /<details class="jsu-risen-method">/);
  assert.match(markup, /<details class="jsu-risen-disclosure">/);
  assert.match(markup, /<details class="jsu-risen-question-disclosure">/);
  assert.match(markup, /What happens next/);
  assert.match(markup, /Source matrix/);
  assert.match(markup, /Compare 1 question the sources leave open/);
  assert.match(markup, /The shared claim is clear\. The sequence is not\./);
});

test("the noncanonical archive follows the event timeline as reception history", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);
  const ascension = markup.indexOf('id="ascension"');
  const archive = markup.indexOf('id="outside-canon"');
  const questions = markup.indexOf('id="open-questions"');

  assert.ok(archive > ascension);
  assert.ok(questions > archive);
  assert.match(markup, /Reception history/);
  assert.match(markup, /Outside the canon: how later Christians continued the story/);
  assert.match(markup, /Explore 1 text, with dates and historical limits/);
  assert.match(markup, /A test apocryphon/);
});

test("the appearance grid marks reported and unreported sources distinctly", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /<table/);
  assert.match(markup, /class="is-reported"/);
  assert.match(markup, /Not reported here/);
  assert.match(markup, /28:9–10/);
});

test("scripture references link into the hosted reader", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /href="\/scriptures\/[a-z]+\/MAT\/27#v45"/);
  assert.match(markup, /href="\/scriptures\/[a-z]+\/MRK\/16#v8"/);
});

test("external records open in a new tab, hosted texts stay internal", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={fixture} />);

  assert.match(markup, /rel="noopener noreferrer"/);
});

test("the shipped dataset covers all four movements in order", () => {
  assert.deepEqual(
    data.movements.map((movement) => movement.id),
    ["death", "tomb", "forty", "ascension"],
  );

  for (const movement of data.movements) {
    const own = data.moments.filter((moment) => moment.movement === movement.id);
    assert.ok(own.length > 0, `${movement.id} has no moments`);
  }
});

test("the next-day guard belongs to the tomb sequence", () => {
  const guard = data.moments.find((moment) => moment.id === "guard");
  const crucified = data.moments.find((moment) => moment.id === "crucified");

  assert.equal(crucified?.movement, "death");
  assert.equal(guard?.movement, "tomb");
});

test("Paul's later appearance is separated from the forty-day matrix", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={data} />);

  assert.match(markup, /Beyond the forty days/);
  assert.match(markup, /Paul, years later/);
  assert.match(markup, /12 reports across 6 books/);
});

test("Mark's longer-ending summary stays in the ascension evidence lane", () => {
  const markup = renderToStaticMarkup(<RisenRoom data={data} />);
  const ascension = markup.slice(markup.indexOf('id="ascension"'));
  const evidenceLane = ascension.indexOf("Compare Mark&#x27;s later ending");
  const markSummary = ascension.indexOf("Mark&#x27;s one-line ascension");

  assert.ok(evidenceLane >= 0);
  assert.ok(markSummary > evidenceLane);
});

test("the shipped noncanonical archive contains every reviewed text", () => {
  assert.deepEqual(
    data.outsideCanon.map((record) => record.id),
    [
      "apocrypha-gospel-peter",
      "apocrypha-epistle-apostles",
      "apocrypha-james",
      "apocrypha-gospel-mary",
      "apocrypha-wisdom-jesus",
      "apocrypha-peter-philip",
      "apocrypha-questions-bartholomew",
      "apocrypha-pistis-sophia",
    ],
  );
  assert.deepEqual(
    [...new Set(data.outsideCanon.map((record) => record.group))],
    ["event-retellings", "risen-dialogues", "expanded-worlds"],
  );
});

test("every noncanonical record names its evidence and its limit", () => {
  for (const record of data.outsideCanon) {
    assert.ok(record.survives.length > 30, `${record.id} has no manuscript context`);
    assert.ok(record.claim.length > 30, `${record.id} has no stated contribution`);
    assert.ok(record.establishes.length > 30, `${record.id} has no stated value`);
    assert.ok(record.limits.length > 30, `${record.id} has no stated limit`);
    assert.match(record.sourceUrl, /^https:\/\/www\.nasscal\.com\//);
  }
});

test("every shipped reference parses and resolves to a real chapter", () => {
  const refs = [
    ...data.moments.flatMap((moment) => moment.refs.map((entry) => entry.ref)),
    ...data.questions.flatMap((question) => question.refs.map((entry) => entry.ref)),
    ...data.appearances.flatMap((appearance) =>
      appearance.sources.map((source) => source.ref),
    ),
  ];

  assert.ok(refs.length > 50);
  for (const ref of refs) {
    const parsed = parseRef(ref);
    assert.ok(parsed, `unparseable reference: ${ref}`);
    const meta = canons.books[parsed.book];
    assert.ok(meta, `unknown book in reference: ${ref}`);
    assert.ok(parsed.chapter <= meta.chapters, `chapter out of range: ${ref}`);
  }
});

test("every appearance source names the book its reference belongs to", () => {
  for (const appearance of data.appearances) {
    for (const source of appearance.sources) {
      assert.ok(
        source.ref.startsWith(`${source.book} `),
        `${appearance.id}: ${source.ref} is not a ${source.book} reference`,
      );
    }
  }
});

test("every record on the descent shelf states what it cannot establish", () => {
  assert.ok(data.descent.length >= 5);
  for (const record of data.descent) {
    assert.ok(record.limits.length > 20, `${record.id} has no stated limit`);
    assert.ok(record.establishes.length > 20, `${record.id} has no stated value`);
  }
});
