import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SiteCaseStudy from "../src/app/work/garovartabedian/page";
import ReleaseRecordSection from "../src/app/work/garovartabedian/ReleaseRecordSection";
import type { ReleaseRecordData } from "../src/app/work/garovartabedian/ReleaseRecord";
import { releaseRecordFrom } from "../src/app/work/garovartabedian/release-record-data";
import { PROJECTS, SITE_CASE_STUDY, SITE_SOURCE_URL } from "../src/lib/portfolio-content";

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
