import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  GUIDE_TEMPLATE_SIGNATURES,
  isTemplateGuide,
} from "../src/lib/scriptures/guide-template";
import { hasTemplateSignature, TEMPLATE_SIGNATURES } from "../scripts/scriptures/guide-validation.mjs";
import { loadChapterGuide } from "../src/lib/scriptures/client";

const require = createRequire(import.meta.url);
const templateGuide = {
  book: "PSA",
  chapter: 117,
  summary: "Psalm 117 (2 verses) continues the story of Israel.",
  questions: [{
    question: "What is happening in Psalm 117?",
    answer: "Read the summary above, then note who is speaking.",
  }],
};

// These three consecutive questions came from a rejected PSA/22 draft. The
// old whole-guide regex joined q6's opening to q8's ending through their
// answers and refs, despite none of the individual values being boilerplate.
const authoredGuide = {
  book: "PSA",
  chapter: 22,
  questions: [
    {
      id: "q6",
      question: "What is happening in the lines about garments and clothing?",
      answer: "Verse 18 says the speaker's enemies divide his garments and cast lots for his clothing.",
      verseRefs: ["22:16", "22:17", "22:18"],
    },
    {
      id: "q7",
      question: "Does the psalm actually turn from suffering to rescue?",
      answer: "Yes. The appeal in verses 19-21 still asks for deliverance, but verse 21 also says, \"Yes, you have rescued me from the horns of the wild oxen.\"",
      verseRefs: ["22:19", "22:20", "22:21", "22:22", "22:24"],
    },
    {
      id: "q8",
      question: 'Who are "the humble" in verse 26?',
      answer: "The verse says the humble will eat, be satisfied, and praise Yahweh.",
      verseRefs: ["22:24", "22:26"],
    },
  ],
};

test("the client-side template signatures mirror the validator list", () => {
  assert.equal(GUIDE_TEMPLATE_SIGNATURES.length, TEMPLATE_SIGNATURES.length);
  GUIDE_TEMPLATE_SIGNATURES.forEach((signature, index) => {
    assert.equal(signature.source, TEMPLATE_SIGNATURES[index].source);
    assert.equal(signature.flags, TEMPLATE_SIGNATURES[index].flags);
  });
});

test("isTemplateGuide flags explicit v1 boilerplate and spares authored prose", () => {
  assert.equal(isTemplateGuide(templateGuide), true);
  assert.equal(isTemplateGuide(authoredGuide), false);
});

test("template detection cannot join unrelated Psalm 22 questions across fields", () => {
  assert.ok(TEMPLATE_SIGNATURES.some((signature) => signature.test(JSON.stringify(authoredGuide))),
    "fixture must reproduce the old cross-field false positive");
  assert.equal(hasTemplateSignature(authoredGuide), false);
  assert.equal(isTemplateGuide(authoredGuide), false);
});

test("each real boilerplate signature remains rejected inside nested text values", () => {
  for (const text of [
    "Psalm 117 (2 verses) continues the story of Israel.",
    "For a first-time reader, it answers: who is God in this moment?",
    "This placeholder will be replaced by an AI-generated guide.",
    "The guide will be replaced with AI-generated questions.",
    "What is happening in Psalm 117?",
    "Read the summary above, then note who is speaking.",
    "What is happening in Psalm\n chapter 117?",
    "What is happening in Daniel (Greek) 9?",
    "What is happening in 4 Maccabees 10?",
  ]) {
    const guide = { questions: [{ question: "An authored question" }, { answer: text }] };
    assert.equal(hasTemplateSignature(guide), true, text);
    assert.equal(isTemplateGuide(guide), true, text);
  }
});

test("nontext values and property names are not treated as guide prose", () => {
  for (const guide of [undefined, null, false, 22, [], {}, {
    "What is happening in Psalm 22?": "An ordinary value.",
  }]) {
    assert.equal(hasTemplateSignature(guide), false);
    assert.equal(isTemplateGuide(guide), false);
  }
});

test("getChapterGuide hides template fixtures and serves authored fixtures", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "guide-template-"));
  try {
    const directory = path.join(fixture, "public/scriptures/guides/PSA");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, "117.json"), JSON.stringify(templateGuide));
    writeFileSync(path.join(directory, "22.json"), JSON.stringify(authoredGuide));
    // The server resolves its data root when imported. A child process keeps
    // both that root and its cache isolated from the repository's live corpus.
    const script = `
      import assert from 'node:assert/strict';
      import * as entry from ${JSON.stringify(pathToFileURL(path.resolve("src/lib/scriptures/server/guides.ts")).href)};
      const server = entry.default ?? entry;
      assert.equal(await server.getChapterGuide('PSA', 117), null);
      assert.deepEqual(await server.getChapterGuide('PSA', 22), ${JSON.stringify(authoredGuide)});
    `;
    execFileSync(process.execPath, ["--import", require.resolve("tsx"), "--input-type=module", "-e", script], {
      cwd: fixture,
      env: { ...process.env, TSX_TSCONFIG_PATH: path.resolve("tsconfig.json") },
      stdio: "pipe",
      timeout: 30_000,
    });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("the browser loader hides template fixtures and serves authored fixtures", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.match(url, /^\/scriptures\/guides\/PSA\/(?:117|22)\.json$/);
    return new Response(JSON.stringify(url.endsWith("/117.json") ? templateGuide : authoredGuide));
  });
  assert.equal(await loadChapterGuide("PSA", 117), null);
  assert.deepEqual(await loadChapterGuide("PSA", 22), authoredGuide);
});
