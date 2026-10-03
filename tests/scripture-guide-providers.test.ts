import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  GUIDE_SCHEMA,
  PROVIDERS,
  ROOT,
  prepareTarget,
  resolveProvider,
  toGeminiSchema,
} from "../scripts/scriptures/build-guides-v2.mjs";
import { validateGuideV2, GUIDE_RUBRIC_VERSION } from "../scripts/scriptures/guide-validation.mjs";
import canonsData from "../public/scriptures/canons.json" with { type: "json" };

const canons = canonsData as Record<string, unknown>;

/** resolveProvider defaults to process.env, so a stub env needs the same shape. */
const env = (values: Record<string, string>) => values as NodeJS.ProcessEnv;

test("all providers are addressable and name the environment they read", () => {
  assert.deepEqual(Object.keys(PROVIDERS).sort(), ["codex", "gemini", "ollama", "openai"]);
  assert.deepEqual(PROVIDERS.openai.keyEnv, ["OPENAI_API_KEY"]);
  assert.deepEqual(PROVIDERS.gemini.keyEnv, ["GEMINI_API_KEY", "GOOGLE_API_KEY"]);
  assert.equal(PROVIDERS.gemini.modelEnv, "GEMINI_MODEL");
  assert.deepEqual(PROVIDERS.ollama.keyEnv, []);
  assert.equal(PROVIDERS.ollama.modelEnv, "OLLAMA_MODEL");
  assert.deepEqual(PROVIDERS.codex.keyEnv, []);
  assert.equal(PROVIDERS.codex.modelEnv, "CODEX_MODEL");
});

test("a missing key fails with the variable the operator has to set", () => {
  assert.throws(
    () => resolveProvider({ provider: "gemini", model: null, env: env({}) }),
    /GEMINI_API_KEY or GOOGLE_API_KEY is required/,
  );
  assert.throws(
    () => resolveProvider({ provider: "gemini", model: null, env: env({ GEMINI_API_KEY: "k" }) }),
    /GEMINI_MODEL \(or --model\) is required/,
  );
  assert.throws(
    () => resolveProvider({ provider: "grok", model: "x", env: env({ OPENAI_API_KEY: "k" }) }),
    /Unknown provider "grok"/,
  );
});

test("either Google key satisfies the Gemini provider", () => {
  const viaGoogle = resolveProvider({
    provider: "gemini",
    model: null,
    env: env({ GOOGLE_API_KEY: "google", GEMINI_MODEL: "gemini-2.5-pro" }),
  });
  assert.equal(viaGoogle.apiKey, "google");
  assert.equal(viaGoogle.model, "gemini-2.5-pro");

  // GEMINI_API_KEY is listed first, so it wins when both are present.
  const both = resolveProvider({
    provider: "gemini",
    model: null,
    env: env({ GEMINI_API_KEY: "gemini", GOOGLE_API_KEY: "google", GEMINI_MODEL: "m" }),
  });
  assert.equal(both.apiKey, "gemini");
});

test("the Ollama provider needs no key and defaults its model from OLLAMA_MODEL", () => {
  const resolved = resolveProvider({
    provider: "ollama",
    model: "kimi-k3:cloud",
    env: env({}),
  });
  assert.equal(resolved.apiKey, null);
  assert.equal(resolved.model, "kimi-k3:cloud");

  assert.throws(
    () => resolveProvider({ provider: "ollama", model: null, env: env({}) }),
    /OLLAMA_MODEL \(or --model\) is required/,
  );
});

test("the Ollama transport posts the guide schema to the local chat endpoint", async () => {
  const draft = { book: "PSA", chapter: 1, ok: true };
  const sent: { url: string; body: Record<string, unknown> | null } = { url: "", body: null };
  const fetchImpl = async (url: string, init: { body: string }) => {
    sent.url = url;
    sent.body = JSON.parse(init.body) as Record<string, unknown>;
    return {
      ok: true,
      json: async () => ({ done_reason: "stop", message: { content: JSON.stringify(draft) } }),
      text: async () => "",
    };
  };

  const guide = await PROVIDERS.ollama.generate({
    prompt: "p",
    model: "kimi-k3:cloud",
    fetchImpl,
  });
  assert.equal(sent.url, "http://localhost:11434/api/chat");
  assert.equal(sent.body?.stream, false);
  assert.deepEqual(sent.body?.format, GUIDE_SCHEMA);
  assert.deepEqual(guide, draft);

  // OLLAMA_HOST is honoured when passed explicitly, trailing slash included.
  const hosted: { url: string } = { url: "" };
  const hostedFetch = async (url: string) => {
    hosted.url = url;
    return {
      ok: true,
      json: async () => ({ done_reason: "stop", message: { content: "{}" } }),
      text: async () => "",
    };
  };
  await PROVIDERS.ollama.generate({
    prompt: "p",
    model: "m",
    fetchImpl: hostedFetch,
    env: env({ OLLAMA_HOST: "http://ollama.example:1234/" }),
  });
  assert.equal(hosted.url, "http://ollama.example:1234/api/chat");
});

test("a truncated Ollama response fails loudly instead of as a parse error", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ done_reason: "length", message: { content: "{\"book\"" } }),
    text: async () => "",
  });

  await assert.rejects(
    () =>
      PROVIDERS.ollama.generate({
        prompt: "p",
        model: "m",
        fetchImpl,
      }),
    /Ollama stopped early: length/,
  );
});

test("the codex provider runs the CLI with a strict schema and reads the final message", async () => {
  const fakeDir = mkdtempSync(path.join(tmpdir(), "codex-fake-"));
  try {
    const fakePath = path.join(fakeDir, "codex-fake");
    writeFileSync(
      fakePath,
      [
        "#!/bin/sh",
        'schema=""',
        'out=""',
        'while [ "$#" -gt 0 ]; do',
        '  case "$1" in',
        '    --output-schema) schema="$2"; shift 2 ;;',
        '    -o) out="$2"; shift 2 ;;',
        '    *) shift ;;',
        '  esac',
        "done",
        'if [ -z "$schema" ] || [ -z "$out" ]; then',
        '  echo "missing --output-schema or -o" >&2',
        "  exit 3",
        "fi",
        'cat > "$(dirname "$0")/stdin-capture.txt"',
        'echo \'{"ok":true}\' > "$out"',
      ].join("\n"),
      { mode: 0o755 },
    );

    const guide = await PROVIDERS.codex.generate({
      prompt: "hello",
      model: "gpt-5.5",
      env: env({ CODEX_BIN: fakePath }),
    });
    assert.deepEqual(guide, { ok: true });
    const stdin = readFileSync(path.join(fakeDir, "stdin-capture.txt"), "utf8");
    assert.ok(stdin.includes("hello"), "the prompt must be forwarded on stdin");
    assert.match(stdin, /Every prose field is shown directly to readers/);
    assert.match(stdin, /Keep self-talk, drafting or validation notes/);

    const failingPath = path.join(fakeDir, "codex-fail");
    writeFileSync(
      failingPath,
      ["#!/bin/sh", 'echo "boom" >&2', "exit 2"].join("\n"),
      { mode: 0o755 },
    );
    await assert.rejects(
      () =>
        PROVIDERS.codex.generate({
          prompt: "hello",
          model: "gpt-5.5",
          env: env({ CODEX_BIN: failingPath }),
        }),
      /Codex exit 2.*boom/,
    );

    assert.equal(
      resolveProvider({ provider: "codex", model: "gpt-5.5", env: env({}) }).apiKey,
      null,
    );
  } finally {
    rmSync(fakeDir, { recursive: true, force: true });
  }
});

test("the Gemini schema keeps every constraint but drops what Gemini rejects", () => {
  const source = {
    type: "object",
    additionalProperties: false,
    required: ["a"],
    properties: {
      a: { type: "string" },
      b: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["c"],
          properties: { c: { type: "string", enum: ["x", "y"] } },
        },
      },
    },
  };
  const converted = toGeminiSchema(source) as {
    required: string[];
    propertyOrdering: string[];
  };
  const blob = JSON.stringify(converted);

  assert.ok(!blob.includes("additionalProperties"), "Gemini rejects additionalProperties");
  assert.ok(blob.includes('"minItems":2'), "item bounds must survive");
  assert.ok(blob.includes('"maxItems":4'));
  assert.ok(blob.includes('"enum":["x","y"]'), "the category enum must survive");
  assert.deepEqual(converted.required, ["a"]);
  assert.deepEqual(converted.propertyOrdering, ["a", "b"]);
  // Nothing is mutated in place: the OpenAI path still sees its own schema.
  assert.equal(source.additionalProperties, false);
});

test("a Gemini-shaped draft passes the same rubric an OpenAI draft must pass", async () => {
  // The point of the provider split is that the gate does not move. This
  // replays a real published guide back through the Gemini response envelope
  // and asserts the validator still accepts it — so the transport is proven
  // without a network call, an API key, or a token spend.
  const book = "LEV";
  const chapter = 11;
  const target = prepareTarget(book, chapter);
  const published = JSON.parse(
    readFileSync(path.join(ROOT, `public/scriptures/guides/${book}/${chapter}.json`), "utf8"),
  );

  const draft = { ...published };
  delete draft.generation;
  delete draft.reviewStatus;
  delete draft.reviewedAt;
  delete draft.reviewer;
  delete draft.sourceIds;

  const geminiEnvelope = {
    candidates: [
      { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(draft) }] } },
    ],
  };

  type GeminiRequest = {
    contents: { role: string; parts: { text: string }[] }[];
    generationConfig: { responseMimeType: string; responseSchema: unknown };
  };
  const sent: { url: string; body: GeminiRequest | null } = { url: "", body: null };
  const fetchImpl = async (url: string, init: { body: string; headers: Record<string, string> }) => {
    sent.url = url;
    sent.body = JSON.parse(init.body) as GeminiRequest;
    assert.equal(init.headers["x-goog-api-key"], "test-key");
    return {
      ok: true,
      json: async () => geminiEnvelope,
      text: async () => "",
    };
  };

  const guide = await PROVIDERS.gemini.generate({
    prompt: target.prompt,
    model: "gemini-2.5-pro",
    apiKey: "test-key",
    fetchImpl,
  });

  assert.match(sent.url, /generativelanguage\.googleapis\.com.*gemini-2\.5-pro:generateContent$/);
  const body = sent.body;
  assert.ok(body, "the transport never issued a request");
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.ok(body.generationConfig.responseSchema, "the schema must be sent");
  assert.equal(body.contents[0].parts[0].text, target.prompt);

  guide.generation = {
    model: "gemini-2.5-pro",
    promptHash: target.promptHash,
    generatedAt: "2026-08-29T00:00:00.000Z",
    rubricVersion: GUIDE_RUBRIC_VERSION,
    method: "direct-generation",
  };

  const validation = validateGuideV2({
    guide,
    root: ROOT,
    canons,
    book,
    chapter,
    expectedPromptHash: target.promptHash,
  });
  assert.deepEqual(validation.failures, []);
});

test("a truncated Gemini response fails loudly instead of as a parse error", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{\"book\"" }] } }],
    }),
    text: async () => "",
  });

  await assert.rejects(
    () =>
      PROVIDERS.gemini.generate({
        prompt: "p",
        model: "m",
        apiKey: "k",
        fetchImpl,
      }),
    /Gemini stopped early: MAX_TOKENS/,
  );
});

test("an HTTP failure carries the provider name and status", async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 400,
    text: async () => "API key not valid. Please pass a valid API key.",
    json: async () => ({}),
  });

  await assert.rejects(
    () =>
      PROVIDERS.gemini.generate({ prompt: "p", model: "m", apiKey: "k", fetchImpl }),
    /Gemini 400: API key not valid/,
  );
});
