import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JesusDossierPage from "../src/app/jesus/dossier/page";
import InkAndStone from "../src/app/jesus/history/InkAndStone";
import {
  buildJesusNotebookLMDossier,
  splitJesusSourceQueries,
  type JesusNotebookLMDossier,
} from "../src/lib/jesus/notebooklm";
import { parseScriptureQueryRef } from "../src/lib/scriptures/refs";
import type { HistoryItem } from "../src/lib/jesus/types";
import type { Canons } from "../src/lib/scriptures/types";
import canonsData from "../public/scriptures/canons.json";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const canons = canonsData as Canons;

function findInitialDossier(node: React.ReactNode): JesusNotebookLMDossier | null {
  if (!React.isValidElement(node)) return null;
  const props = node.props as {
    children?: React.ReactNode;
    initialDossier?: JesusNotebookLMDossier;
  };
  if (props.initialDossier) return props.initialDossier;
  for (const child of React.Children.toArray(props.children)) {
    const dossier = findInitialDossier(child);
    if (dossier) return dossier;
  }
  return null;
}

function historyItem(
  id: string,
  author: string,
  sourceYear: number | null,
): HistoryItem {
  return {
    id,
    lane: "Roman",
    author,
    authorNote: "Test author note",
    work: "Test work",
    date: sourceYear === null ? "date uncertain" : `c. AD ${sourceYear}`,
    sourceYear,
    distance: "Test source distance",
    assessment: "Test assessment",
    excerpt: "Test source summary",
    excerptKind: "summary",
    translator: "Test editor",
    sourceUrl: "https://example.com/source",
    note: "Test note",
    claimsAttested: ["A bounded claim"],
    limits: "This fixture establishes no further claim.",
  };
}

describe("Jesus dossier release boundaries", () => {
  it("splits and parses every reference in a multi-source query", () => {
    const query =
      " Matthew 9:1-8, Mark 2:1-12; Luke 5:17-26 || John 5:1 ";
    const parts = splitJesusSourceQueries(query);

    assert.deepEqual(parts, [
      "Matthew 9:1-8",
      "Mark 2:1-12",
      "Luke 5:17-26",
      "John 5:1",
    ]);
    assert.deepEqual(
      parts.map((part) => parseScriptureQueryRef(part, canons)?.label),
      ["MAT 9:1-8", "MRK 2:1-12", "LUK 5:17-26", "JHN 5:1"],
    );
  });

  it("keeps an all-valid multi-reference request custom instead of aliasing it to one preset", () => {
    const dossier = buildJesusNotebookLMDossier({
      target: "Isaiah 53:5, Daniel 7:13",
      canons,
      primaryVerses: [
        { ref: "Isaiah 53:5", web: "Isaiah fixture" },
        { ref: "Daniel 7:13", web: "Daniel fixture" },
      ],
    });

    assert.equal(dossier.targetType, "passage");
    assert.equal(dossier.preset, undefined);
    assert.match(dossier.title, /Isaiah 53:5, Daniel 7:13/);
    assert.match(dossier.markdown, /^### Isaiah 53:5$/m);
    assert.match(dossier.markdown, /^### Daniel 7:13$/m);
  });

  it("loads a 200-verse custom request and rejects a 201-verse request", async () => {
    const allowedPage = await JesusDossierPage({
      searchParams: Promise.resolve({ target: "Psalms 119:1-200" }),
    });
    const blockedPage = await JesusDossierPage({
      searchParams: Promise.resolve({ target: "Psalms 119:1-201" }),
    });
    const allowed = findInitialDossier(allowedPage);
    const blocked = findInitialDossier(blockedPage);

    assert.ok(allowed);
    assert.equal(allowed.targetType, "passage");
    assert.ok(allowed.sourceEntryCount > 0);
    assert.match(allowed.markdown, /Psalms 119:176/);

    assert.ok(blocked);
    assert.equal(blocked.targetType, "passage");
    assert.equal(blocked.sourceEntryCount, 0);
    assert.match(blocked.markdown, /no hosted verse was loaded/i);
  });

  it("does not silently compile the valid half of a mixed valid and invalid query", async () => {
    const page = await JesusDossierPage({
      searchParams: Promise.resolve({ target: "John 3:16; unknown source" }),
    });
    const dossier = findInitialDossier(page);

    assert.ok(dossier);
    assert.equal(dossier.sourceEntryCount, 0);
    assert.match(dossier.markdown, /no source passage was resolved/i);
    assert.doesNotMatch(dossier.markdown, /^### John 3:16$/m);
  });

  it("omits late and uncertain-date records from the bounded history timeline", () => {
    const markup = renderToStaticMarkup(
      <InkAndStone
        christianWitnesses={[]}
        items={[
          historyItem("in-range", "In-range witness", 112),
          historyItem("late-record", "Late reception fixture", 200),
          historyItem("uncertain-record", "Uncertain reception fixture", null),
        ]}
        stones={[]}
      />,
    );

    assert.match(markup, /In-range witness/);
    assert.doesNotMatch(markup, /Late reception fixture/);
    assert.doesNotMatch(markup, /Uncertain reception fixture/);
    assert.match(markup, /Later or\s+uncertain-date reception records/);
  });
});
