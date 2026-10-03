import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const source = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("the homepage keeps reveal behavior in one small client island", () => {
  const storyHome = source("src/app/_components/StoryHome.tsx");
  const reveal = source("src/app/_components/Reveal.tsx");

  assert.doesNotMatch(storyHome, /^"use client";/);
  assert.doesNotMatch(storyHome, /useReveal/);
  assert.match(storyHome, /<Reveal>/);
  assert.match(reveal, /^"use client";/);
  assert.match(reveal, /useReveal<HTMLDivElement>\(\)/);
});

test("angels prose is segmented on the server before glossary islands", () => {
  for (const relativePath of [
    "src/app/angels/AngelsHome.tsx",
    "src/app/angels/Descent.tsx",
  ]) {
    const contents = source(relativePath);

    assert.doesNotMatch(contents, /^"use client";/);
    assert.match(contents, /segmentText/);
    assert.match(contents, /GlossSegments/);
    assert.match(contents, /@\/lib\/scriptures\/server/);
    assert.doesNotMatch(contents, /import GlossText/);
    assert.doesNotMatch(contents, /@\/lib\/scriptures\/client/);
  }
});

test("each world layout mounts the switcher directly", () => {
  const worlds = [
    "scriptures",
    "jesus",
    "apostles",
    "early",
    "church",
    "angels",
    "word",
    "evidence",
  ];

  for (const world of worlds) {
    const layout = source(`src/app/${world}/layout.tsx`);

    assert.match(layout, /import WorldSwitcher from "\.\.\/_components\/WorldSwitcher";/);
    assert.match(layout, /<WorldSwitcher \/>/);
    assert.doesNotMatch(layout, /WorldDockGate/);
  }

  assert.equal(
    existsSync(path.join(process.cwd(), "src/app/_components/WorldDockGate.tsx")),
    false,
  );
});
