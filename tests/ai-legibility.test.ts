import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { EARLY_TEXTS } from "../src/lib/early/client";
import type { EarlyText } from "../src/lib/early/types";
import {
  ROOT,
  buildProfileFacts,
  renderEarlyMarkdown,
  renderLlmsTxt,
  stripLineEndSpaces,
} from "../scripts/site/build-ai-legibility";

const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

test("the committed llms.txt matches what the sources produce", () => {
  // Same guarantee corpus-health gives: a stale committed artefact fails CI
  // instead of quietly telling crawlers something the site no longer says.
  assert.equal(read("public/llms.txt"), renderLlmsTxt());
});

test("every hosted early text has a current markdown mirror", () => {
  const mirrorDir = path.join(ROOT, "public/early/md");
  const mirrors = readdirSync(mirrorDir).filter((f) => f.endsWith(".md"));
  assert.equal(mirrors.length, EARLY_TEXTS.length);

  for (const meta of EARLY_TEXTS) {
    const file = `public/early/md/${meta.id}.md`;
    assert.ok(existsSync(path.join(ROOT, file)), `missing mirror for ${meta.id}`);
    const source = JSON.parse(read(`public/early/texts/${meta.id}.json`)) as EarlyText;
    assert.equal(read(file), renderEarlyMarkdown(source), `${meta.id} mirror is stale`);
  }
});

test("each mirror names its translator and source before any of the text", () => {
  // The point of publishing a mirror is that a machine quoting it can say
  // where the words came from. A mirror without attribution is worse than none.
  for (const meta of EARLY_TEXTS) {
    const markdown = read(`public/early/md/${meta.id}.md`);
    const source = JSON.parse(read(`public/early/texts/${meta.id}.json`)) as EarlyText;
    const header = markdown.slice(0, markdown.indexOf("\n>"));
    assert.ok(header.includes(source.translator), `${meta.id} does not name its translator`);
    assert.ok(header.includes(source.sourceUrl), `${meta.id} does not name its source URL`);
  }
});

test("the mirrors reproduce the hosted paragraphs verbatim", () => {
  // "Verbatim" is held to exactly one documented exception: trailing spaces at
  // a line end are dropped, because in Markdown they are a hard line break and
  // keeping them would alter the rendering rather than preserve it. Every
  // other character of every hosted paragraph must survive.
  for (const meta of EARLY_TEXTS) {
    const markdown = read(`public/early/md/${meta.id}.md`);
    const source = JSON.parse(read(`public/early/texts/${meta.id}.json`)) as EarlyText;
    for (const section of source.sections) {
      for (const paragraph of section.paragraphs) {
        assert.ok(
          markdown.includes(stripLineEndSpaces(paragraph)),
          `${meta.id} mirror does not contain a hosted paragraph verbatim`,
        );
        assert.equal(
          stripLineEndSpaces(paragraph).replace(/[ \t]/g, ""),
          paragraph.replace(/[ \t]/g, ""),
          `${meta.id} normalisation removed more than line-end spaces`,
        );
      }
    }
  }
});

test("the committed profile facts match the truth bank", () => {
  const committed = JSON.parse(read("public/meta/profile-facts.json"));
  assert.deepEqual(committed.facts, buildProfileFacts());
});

// The pinned rule: branch, rating, and dates only. Platform classes,
// equipment, duty patterns, and clearance levels never appear in any
// artefact, and this bank is a machine-readable artefact like any other.
const PUBLIC_SERVICE_RECORD =
  "United States Navy Electronics Technician, February 2003 to August 2008.";
const SERVICE_MENTION = /\b(?:navy|naval|military|veteran|armed forces|enlisted)\b/i;

test("no profile fact publishes a service detail beyond the public record", () => {
  // Checked as an allowlist: the only fact that mentions service is the
  // public record, word for word, so nothing can be added beside it.
  const serviceClaims = buildProfileFacts()
    .map((fact) => fact.claim)
    .filter((claim) => SERVICE_MENTION.test(claim));
  assert.deepEqual(serviceClaims, [PUBLIC_SERVICE_RECORD]);

  for (const line of read("public/llms.txt").split("\n")) {
    if (SERVICE_MENTION.test(line)) {
      assert.ok(line.includes(PUBLIC_SERVICE_RECORD), `llms.txt adds service detail: ${line}`);
    }
  }
});

test("no artefact contains a private service term", (t) => {
  // The terms themselves stay in the private repository: listing them here
  // would publish exactly the details the rule keeps off the site.
  const termsFile = path.join(ROOT, "tests/private/service-terms.json");
  if (!existsSync(termsFile)) {
    t.skip("the private term list is kept out of the public copy");
    return;
  }
  const { patterns } = JSON.parse(readFileSync(termsFile, "utf8")) as { patterns: string[] };
  assert.ok(patterns.length > 0, "the private term list is empty");

  for (const relative of ["public/meta/profile-facts.json", "public/llms.txt"]) {
    const blob = read(relative);
    for (const source of patterns) {
      assert.ok(!new RegExp(source, "i").test(blob), `${relative} contains a private service term`);
    }
  }
});

test("every profile fact carries at least one evidence anchor that exists", () => {
  const facts = buildProfileFacts();
  assert.ok(facts.length > 0);
  for (const fact of facts) {
    assert.ok(fact.evidence.length > 0, `${fact.id} has no evidence`);
    assert.ok(fact.basis.trim().length > 20, `${fact.id} has no stated basis`);
    for (const href of fact.evidence) {
      assert.ok(href.startsWith("/"), `${fact.id} evidence ${href} is not a site path`);
      const [routePart] = href.split("#");
      if (routePart.endsWith(".json")) {
        assert.ok(
          existsSync(path.join(ROOT, "public", routePart)),
          `${fact.id} points at missing file ${routePart}`,
        );
        continue;
      }
      const segments = routePart.split("/").filter(Boolean);
      const page = path.join(ROOT, "src/app", ...segments, "page.tsx");
      assert.ok(existsSync(page), `${fact.id} points at missing route ${routePart}`);
    }
  }
});

test("llms.txt states the review tiers rather than implying human approval", () => {
  const llms = renderLlmsTxt();
  assert.match(llms, /agent-reviewed/);
  assert.match(llms, /human-reviewed/);
  assert.match(llms, /computed rather than curated/);
  assert.match(llms, /no runtime API/);
});
