import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import canonsData from "../public/scriptures/canons.json" with { type: "json" };
import committed from "../public/meta/reading-paths.json" with { type: "json" };
import { buildReadingPaths } from "../scripts/site/build-reading-paths.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const canons = canonsData as {
  books: Record<string, { name: string; chapters: number }>;
  traditions: { id: string; books: string[] }[];
};

type Step = { href: string; label: string; note: string };
type Path = { id: string; title: string; line: string; steps: Step[] };
const paths = committed.paths as Path[];

test("the front door offers several finishable walks", () => {
  assert.ok(paths.length >= 4, `only ${paths.length} paths`);
  assert.ok(paths.length <= 8, "more than a handful stops being a way in");
  for (const walk of paths) {
    assert.ok(walk.steps.length >= 3, `${walk.id} is too short to be a walk`);
    assert.ok(walk.steps.length <= 8, `${walk.id} is too long to finish`);
    assert.ok(walk.title.trim().length > 0);
    assert.ok(walk.line.trim().length > 20, `${walk.id} does not say what it is`);
  }
});

test("the committed paths match what the sources produce", () => {
  // Same guarantee as corpus-health: a stale file fails CI rather than quietly
  // pointing the front door at something that moved.
  assert.deepEqual(paths, buildReadingPaths());
});

test("every step goes somewhere the site actually goes", () => {
  // The whole risk of a guided path is a dead end on the first page a
  // first-time visitor sees.
  for (const walk of paths) {
    for (const step of walk.steps) {
      assert.ok(step.href.startsWith("/"), `${walk.id}: ${step.href} is not a site path`);
      assert.ok(step.note.trim().length > 10, `${walk.id}: ${step.label} has no note`);

      const scripture = /^\/scriptures\/([a-z-]+)\/([A-Z0-9]{3})\/(\d+)$/.exec(step.href);
      if (scripture) {
        const [, traditionId, book, chapter] = scripture;
        const tradition = canons.traditions.find((t) => t.id === traditionId);
        assert.ok(tradition, `${walk.id}: unknown tradition ${traditionId}`);
        assert.ok(tradition.books.includes(book), `${walk.id}: ${traditionId} has no ${book}`);
        const meta = canons.books[book];
        assert.ok(meta, `${walk.id}: unknown book ${book}`);
        assert.ok(
          Number(chapter) >= 1 && Number(chapter) <= meta.chapters,
          `${walk.id}: ${book} ${chapter} is outside the book`,
        );
        continue;
      }

      const early = /^\/early\/([a-z0-9-]+)$/.exec(step.href);
      if (early) {
        assert.ok(
          existsSync(path.join(ROOT, "public/early/texts", `${early[1]}.json`)),
          `${walk.id}: ${early[1]} is not a hosted writing`,
        );
        continue;
      }

      const segments = step.href.split("/").filter(Boolean);
      assert.ok(
        existsSync(path.join(ROOT, "src/app", ...segments, "page.tsx")),
        `${walk.id}: ${step.href} has no page`,
      );
    }
  }
});

test("a scripture step's label names the book it opens", () => {
  // A step reading "Mark 11-13" must not open Luke.
  for (const walk of paths) {
    for (const step of walk.steps) {
      const scripture = /^\/scriptures\/[a-z-]+\/([A-Z0-9]{3})\/\d+$/.exec(step.href);
      if (!scripture) continue;
      const name = canons.books[scripture[1]].name;
      assert.ok(
        step.label.startsWith(name),
        `${walk.id}: "${step.label}" opens ${name}`,
      );
    }
  }
});

test("the builder refuses a step that points nowhere", () => {
  // The gate itself. Authored data is only safe while the thing that publishes
  // it fails closed.
  const source = readFileSync(
    path.join(ROOT, "scripts/site/build-reading-paths.mjs"),
    "utf8",
  );
  assert.match(source, /failures\.push/);
  assert.match(source, /throw new Error\(/);
  assert.match(source, /has no page/);
});
