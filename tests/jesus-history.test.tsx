import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HistoryRoom from "../src/app/jesus/history/HistoryRoom";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const writtenBase = {
  authorNote: "A test author",
  work: "Test work",
  date: "c. AD 100",
  sourceYear: 100,
  distance: "about 70 years after the crucifixion",
  excerpt: "A test quotation.",
  translator: "Test translator",
  sourceUrl: "https://example.com/source",
  note: "A test note.",
  claimsAttested: ["A limited historical claim"],
  limits: "It does not establish a theological claim.",
};

test("history reads as an evidence investigation with explicit limits", () => {
  const markup = renderToStaticMarkup(
    <HistoryRoom
      christianWitnesses={[
        {
          id: "paul",
          name: "Paul's undisputed letters",
          date: "c. AD 50–60",
          sourceYear: 55,
          distance: "about 20–30 years after the crucifixion",
          assessment: "Earliest surviving Christian writings",
          summary: "A test Christian baseline.",
          establishes: ["An early Christian claim"],
          limits: "These are committed Christian testimony, not neutral reports.",
          sourceUrl: "/scriptures/protestant/1CO/15#v3",
        },
      ]}
      items={[
        {
          ...writtenBase,
          id: "jewish-source",
          author: "Jewish witness",
          lane: "Jewish",
          assessment: "Broadly accepted",
        },
        {
          ...writtenBase,
          id: "roman-source",
          author: "Roman witness",
          lane: "Roman",
          assessment: "Qualified",
        },
      ]}
      stones={[
        {
          id: "test-stone",
          name: "Test artifact",
          found: "in a test excavation",
          artifactDate: "1st century",
          attests: ["A real setting"],
          assessment: "Secure context",
          limits: "It does not name Jesus.",
          location: "Test museum",
          note: "A test artifact note.",
          sourceUrl: "https://example.com/artifact",
        },
      ]}
      plates={{}}
    />,
  );

  assert.match(markup, /What can history actually establish\?/);
  assert.match(markup, /The short answer/);
  assert.match(markup, /Source distance/);
  assert.match(markup, /What this establishes/);
  assert.match(markup, /What this does not establish/);

  const christianIndex = markup.indexOf('class="jsu-lane">Early Christian baseline');
  const jewishIndex = markup.indexOf('class="jsu-lane">Jewish sources and later reception');
  const romanIndex = markup.indexOf('class="jsu-lane">Roman and other non-Christian witnesses');
  const archaeologyIndex = markup.indexOf('class="jsu-lane">Archaeology and setting');
  assert.ok(christianIndex >= 0 && christianIndex < jewishIndex);
  assert.ok(jewishIndex < romanIndex);
  assert.ok(romanIndex < archaeologyIndex);
  assert.match(markup, /<details/);
});

test("history room renders synthesis essays and extended research corpus", () => {
  const markup = renderToStaticMarkup(
    <HistoryRoom
      christianWitnesses={[]}
      items={[]}
      stones={[]}
      plates={{}}
      essays={[
        {
          id: "grand",
          title: "The Grand Convergence",
          summary: "Infusing science, history, and faith",
          body: "# The Grand Convergence\n\nEpistemological convergence statement.",
        },
      ]}
      sources={[
        {
          id: 1,
          raw_title: "Test Academic Paper",
          clean_title: "Test Academic Paper",
          category: "Historical/Archaeological Evidence",
          source_type: "Academic Paper",
          url: "https://doi.org/10.1234/test",
          author: "Scholarly Author",
          year: "2024",
          _load: "real_doc",
          _tier: "A",
          _tier_rationale: "Primary excavation report",
          _title_needs_fix: false,
        },
      ]}
    />,
  );

  assert.match(markup, /Synthesis Essays/);
  assert.match(markup, /The Grand Convergence/);
  assert.match(markup, /Infusing science, history, and faith/);
  assert.match(markup, /Extended Research Corpus/);
  assert.match(markup, /Test Academic Paper/);
  assert.match(markup, /Tier A/);
});
