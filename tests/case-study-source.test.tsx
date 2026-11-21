import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SiteCaseStudy from "../src/app/work/garovartabedian/page";
import { guideLines } from "../src/app/work/garovartabedian/GuideRecord";
import GuideRecordSection from "../src/app/work/garovartabedian/GuideRecordSection";
import ReleaseRecordSection from "../src/app/work/garovartabedian/ReleaseRecordSection";
import type { ReleaseRecordData } from "../src/app/work/garovartabedian/ReleaseRecord";
import { releaseRecordFrom } from "../src/app/work/garovartabedian/release-record-data";
import { PROJECTS, SITE_CASE_STUDY, SITE_SOURCE_URL } from "../src/lib/portfolio-content";
import type { GuideChecked, GuideRecord as GuideRecordData } from "../src/lib/site/guide-record";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Garo, 2026-10-03: the code is public so an engineer can check the work.
// The case study links it, the project cards carry it, and the page no longer
// says there is no public source.
test("the site case study links the public code", () => {
  assert.equal(SITE_SOURCE_URL, "https://github.com/Vartabg/garovartabedian.com");

  const markup = renderToStaticMarkup(<SiteCaseStudy />);
  assert.match(
    markup,
    new RegExp(
      `<a[^>]*href="${SITE_SOURCE_URL.replace(/\./g, "\\.")}"[^>]*>(?:<span[^>]*>)?View the code on GitHub(?:</span>)?</a>`,
    ),
  );

  const site = PROJECTS.find((project) => project.href === "/work/garovartabedian");
  assert.equal(site?.sourceHref, SITE_SOURCE_URL);

  const proof = SITE_CASE_STUDY.facts.find((fact) => fact.name === "Proof standard");
  assert.ok(proof?.note.includes("the public code"));
  assert.doesNotMatch(proof?.note ?? "", /public-source/);

  // The boundary line sits beside the GitHub button, so it must not deny the link.
  for (const boundary of SITE_CASE_STUDY.boundaries) {
    assert.doesNotMatch(boundary, /does not present a public source/i);
  }
  assert.ok(SITE_CASE_STUDY.boundaries.some((boundary) => boundary.includes("public copy of the code")));
});

// Garo, 2026-10-31: "actual proof not in words but being implemented in the portfolio".
// The case study draws the release record from the release script's own reports.
const record: ReleaseRecordData = {
  schemaVersion: 1,
  steps: ["Lint", "Browser tests", "Promote verified artifact"],
  attempts: [
    { date: "2026-09-07", outcome: "stopped", ran: [0, 1], stop: 1, minutes: 6 },
    { date: "2026-10-30", outcome: "live", ran: [0, 1, 2], stop: null, minutes: 30 },
  ],
};

test("the case study shows every earlier release attempt and where each one stopped", () => {
  const markup = renderToStaticMarkup(<ReleaseRecordSection record={record} />);
  assert.match(markup, /data-release-attempts="2"/);
  assert.match(markup, /there were 2 release attempts since Sep 7, 2026: 1 went live, 1 stopped before going live, and 0 ended early/);
  assert.match(markup, /stopped at “Browser tests”/);
  assert.match(markup, /role="slider"/);
  assert.doesNotMatch(markup, /Dossier Engine|Enterprise Knowledge/);
});

test("a build without the record says so instead of inventing one", () => {
  const markup = renderToStaticMarkup(<ReleaseRecordSection record={null} />);
  assert.match(markup, /added to this page during each production release/);
  assert.doesNotMatch(markup, /data-release-attempts/);
  assert.equal(releaseRecordFrom(null), null);
  assert.equal(releaseRecordFrom("{ not json"), null);
  assert.equal(releaseRecordFrom(JSON.stringify({ schemaVersion: 1, steps: [], attempts: [] })), null);
});

test("a production build without the record fails instead of showing the fallback", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    assert.throws(() => releaseRecordFrom(null), /Production builds need/);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

// Garo, 2026-11-20: "Yes, build it". Under the release record, the case study
// shows every hosted chapter and what was checked for its guide.
const checked: GuideChecked = {
  chapter: 1, state: "current", tradition: 0, keyVerses: 3, questions: 8, outlineParts: 6, verses: 31,
  review: "agent", reviewer: 0, reviewedAt: "2026-09-28", drafter: 0, rebinds: 0, problems: 0, rubric: 0,
};
const earlier: GuideChecked = { ...checked, state: "earlier", drafter: null, problems: 2, rubric: null };
const lookup = {
  rubrics: ["guide-v2", "guide-v3"],
  reviewers: ["agent editorial panel", "A. Reader"],
  drafters: [
    { kind: "measured" as const, label: "model-a" },
    { kind: "attributed" as const, label: "hand-authored" },
    { kind: "attributed" as const, label: "model-b" },
  ],
};
const guideRecord: GuideRecordData = {
  schemaVersion: 2,
  generatedBy: "test",
  totals: { chapters: 4, current: 1, earlier: 2, none: 1, agentReviewed: 3, humanReviewed: 0, unreviewed: 0 },
  traditions: ["protestant", "orthodox"],
  ...lookup,
  books: [
    { id: "GEN", name: "Genesis", chapters: [checked, { ...earlier, chapter: 2 }] },
    { id: "PSA", name: "Psalms", chapters: [{ chapter: 1, state: "none", tradition: 0 }, { ...earlier, chapter: 2, tradition: 1, verses: 0, problems: null }] },
  ],
};

test("the case study shows every chapter and the checks its guide passed", () => {
  const markup = renderToStaticMarkup(<GuideRecordSection record={guideRecord} />);
  assert.match(markup, /data-guide-chapters="4"/);
  assert.match(
    markup,
    /The Scripture section hosts 4 chapters\. 1 has a guide that passes every current check\. 2 have a guide that passes only the earlier checks\. 1 has no guide\.<\/p>/,
  );
  assert.match(markup, /An agent panel reviewed 3 guides\. No person has reviewed any\. On Nov 20, 2026, 829 batch-template guides were removed/);
  assert.match(markup, /role="slider"[^>]*aria-valuemax="4"/);
  assert.match(markup, /aria-valuetext="Genesis 1: passes every current check"/);
  // One mark per chapter, grouped by book, and it opens on the first chapter.
  const map = markup.slice(markup.indexOf("guide-record-map"), markup.indexOf("guide-record-step"));
  assert.equal(map.match(/<i /g)?.length, 4);
  assert.equal(map.match(/guide-record-book/g)?.length, 2);
  assert.equal(map.match(/is-on/g)?.length, 1);
  assert.match(markup, /<h3>Genesis 1<\/h3>/);
  assert.match(markup, /href="\/scriptures\/protestant\/GEN\/1"[^>]*>Open Genesis 1</);
  // The table is the same record by book, for a reader who cannot use the map.
  assert.match(markup, /<th scope="row">Psalms<\/th><td>2<\/td><td>0<\/td><td>1<\/td><td>1<\/td>/);
  assert.match(markup, /href="\/meta\/guide-record\.json"/);
  // One rubric has guides locked to it, so the page names one and says nothing of another.
  assert.match(markup, /scripts\/scriptures\/GUIDE_RUBRIC_V2\.md"[^>]*>Read the rubric<\/a>/);
  assert.doesNotMatch(markup, /GUIDE_RUBRIC_V3|Read the rubrics|locked to/);

  // Garo, 2026-11-21: a second rubric with wider limits. Once a guide is locked to it, the page says which is which.
  const both = renderToStaticMarkup(
    <GuideRecordSection
      record={{
        ...guideRecord,
        books: [...guideRecord.books, { id: "MRK", name: "Mark", chapters: [{ ...checked, drafter: 2, rubric: 1 }] }],
      }}
    />,
  );
  assert.match(both, /Guides are checked against the rubric they are locked to: 1 against guide-v2 and 1 against guide-v3\. guide-v3 has wider limits\. On Nov 20/);
  assert.match(both, /Read the rubrics: <span><a href="[^"]*GUIDE_RUBRIC_V2\.md"[^>]*>guide-v2<\/a><\/span><span> · <a href="[^"]*GUIDE_RUBRIC_V3\.md"[^>]*>guide-v3<\/a>/);

  const reviewed = renderToStaticMarkup(
    <GuideRecordSection record={{ ...guideRecord, totals: { ...guideRecord.totals, agentReviewed: 1, humanReviewed: 3 } }} />,
  );
  assert.match(reviewed, /An agent panel reviewed 1 guide\. A person has reviewed 3\./);
});

test("each chapter's record says only what was checked", () => {
  assert.deepEqual(guideLines({ chapter: 1, state: "none", tradition: 0 }, lookup), ["No guide for this chapter."]);

  assert.deepEqual(guideLines(checked, lookup), [
    "Key verses: 3, each a quotation from the hosted text.",
    "Questions: 8, each tied to a verse in this chapter.",
    "Outline: 6 parts that cover all 31 verses with no gaps.",
    "Rubric: guide-v2.",
    "Source lock: the saved fingerprint still matches the sources, instructions and rubric the guide was drafted from.",
    "Drafted by: model-a. The run recorded the model.",
    "Review: agent panel on Sep 28, 2026, recorded as “agent editorial panel”. No person has reviewed it.",
  ]);
  assert.match(guideLines({ ...checked, rebinds: 1 }, lookup)[4], /It was moved once after a citation’s link or name was corrected, with the reason on file\.$/);
  assert.match(guideLines({ ...checked, rebinds: 2 }, lookup)[4], /It was moved 2 times after/);
  assert.equal(guideLines({ ...checked, rubric: 1 }, lookup)[3], "Rubric: guide-v3.");
  // Only a run the build made can say what a guide was drafted from. One bound afterwards was locked at its review.
  for (const drafter of [1, 2]) {
    assert.equal(
      guideLines({ ...checked, drafter }, lookup)[4],
      "Source lock: the saved fingerprint still matches the sources, instructions and rubric the guide was bound to at review.",
    );
  }

  // A guide without the current rubric's record: no claim about when it was written.
  const second = (row: GuideChecked) => guideLines(row, lookup)[1];
  assert.equal(guideLines(earlier, lookup)[0], "Its verse references resolve, and its key verses quote a hosted translation.");
  assert.equal(second(earlier), "It has no record of being drafted under a current rubric. Run against it today, guide-v2 reports 2 problems.");
  assert.match(second({ ...earlier, problems: 1 }), /reports 1 problem\.$/);
  assert.equal(second({ ...earlier, problems: 0 }), "It has no record of being drafted under a current rubric, so it is not counted as current. Run against it today, guide-v2 reports no problems.");
  assert.equal(second({ ...earlier, verses: 0, problems: null }), "It has no record of being drafted under a current rubric, and guide-v2 cannot run here: the translation it checks against does not carry this chapter.");
  for (const row of [earlier, { ...earlier, problems: 0 }, { ...earlier, problems: null }]) assert.doesNotMatch(second(row), /predates|older|before/);

  // A model is named as measured only when a run recorded it.
  const drafted = (drafter: number | null) => guideLines({ ...checked, drafter }, lookup)[5];
  assert.equal(drafted(null), "Drafted by: not recorded.");
  assert.equal(drafted(1), "Written by hand. Stated at review, not recorded by a run.");
  assert.equal(drafted(2), "Drafted by: model-b. Stated at review, not recorded by a run.");

  const review = (row: GuideChecked) => guideLines(row, lookup)[6];
  assert.equal(review({ ...checked, review: "none", reviewer: null, reviewedAt: null }), "Review: none recorded.");
  assert.equal(review({ ...checked, review: "human", reviewer: 1 }), "Review: A. Reader on Sep 28, 2026.");
});
