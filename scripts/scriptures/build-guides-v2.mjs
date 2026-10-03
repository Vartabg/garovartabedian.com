#!/usr/bin/env node

/**
 * Build grounded chapter-guide drafts without publishing placeholders.
 *
 * The command is deliberately two-phase: every requested draft must pass the
 * v2 machine rubric before any public guide is replaced. Editorial review and
 * review-tier stamping remain a separate command. Guides are published as each
 * draft passes, so a run that throws on its first rejection keeps the guides
 * it already wrote.
 *
 * Prepare prompt bundles without an API call:
 *   node scripts/scriptures/build-guides-v2.mjs \
 *     --books LEV --chapters 1-27 --prepare-dir /tmp/leviticus-prompts
 *
 * Generate a complete validated batch, publishing each file atomically:
 *   OPENAI_API_KEY=... OPENAI_MODEL=... \
 *   node scripts/scriptures/build-guides-v2.mjs \
 *     --books LEV --chapters 1-27 --force
 *
 *   GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-pro \
 *   node scripts/scriptures/build-guides-v2.mjs --provider gemini \
 *     --books LEV --chapters 1-27 --force
 *
 *   OLLAMA_MODEL=kimi-k3:cloud node scripts/scriptures/build-guides-v2.mjs \
 *     --provider ollama --books PSA --only-template --continue-on-reject --retries 1 \
 *     --reject-dir /tmp/guide-rejects
 *
 *   node scripts/scriptures/build-guides-v2.mjs \
 *     --provider codex --model gpt-5.5 --books PSA --only-template --continue-on-reject --retries 1
 *
 * The provider is a transport choice, not a licence. Whichever model drafts a
 * guide, the same grounding bundle goes in, the same machine rubric decides
 * whether the draft may be published, and the model id is stamped into
 * `generation.model` so a reader can see which one wrote what they are reading.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GUIDE_RUBRIC_VERSION,
  hasTemplateSignature,
  isCanonicalIsoTimestamp,
  validateGuideV2,
} from "./guide-validation.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(SCRIPT_DIR, "../..");
const CANONS = JSON.parse(
  readFileSync(path.join(ROOT, "public/scriptures/canons.json"), "utf8"),
);
const MARK_EXEMPLAR = JSON.parse(
  readFileSync(path.join(ROOT, "public/scriptures/guides/MRK/1.json"), "utf8"),
);
const RUBRIC_PATH = path.join(SCRIPT_DIR, "GUIDE_RUBRIC_V2.md");
const PUBLISHED_GUIDES_ROOT = path.join(ROOT, "public/scriptures/guides");

const resolveThroughExistingAncestor = (value) => {
  const missingSegments = [];
  let existingAncestor = path.resolve(value);
  while (!existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) break;
    missingSegments.unshift(path.basename(existingAncestor));
    existingAncestor = parent;
  }
  return path.join(realpathSync(existingAncestor), ...missingSegments);
};

const isPathWithin = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};

const sha256 = (value) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const parseCsv = (value) =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function parseChapterSelection(value) {
  const chapters = new Set();
  for (const part of parseCsv(value)) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) throw new Error(`Invalid chapter selection: ${part}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start) throw new Error(`Invalid chapter range: ${part}`);
    for (let chapter = start; chapter <= end; chapter += 1) chapters.add(chapter);
  }
  if (chapters.size === 0) throw new Error("Chapter selection cannot be empty");
  return [...chapters].sort((a, b) => a - b);
}

export function parseArgs(argv) {
  const parsed = {
    books: [],
    chapters: null,
    force: false,
    onlyTemplate: false,
    continueOnReject: false,
    retries: 0,
    rejectDir: null,
    prepareDir: null,
    provider: process.env.GUIDE_PROVIDER ?? null,
    model: null,
    generatedAt: process.env.SOURCE_DATE_EPOCH
      ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
      : null,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    const [inlineName, inlineValue] = argument.split(/=(.*)/s, 2);
    const valueFor = (name) => {
      if (inlineName === `--${name}` && inlineValue !== undefined) return inlineValue;
      if (argument === `--${name}`) return argv[++index];
      return null;
    };

    let value;
    if ((value = valueFor("books")) !== null) {
      parsed.books = [
        ...new Set(parseCsv(value).map((book) => book.toUpperCase())),
      ];
    } else if ((value = valueFor("chapters")) !== null) {
      parsed.chapters = parseChapterSelection(value);
    } else if ((value = valueFor("prepare-dir")) !== null) {
      parsed.prepareDir = path.resolve(value);
    } else if ((value = valueFor("provider")) !== null) {
      parsed.provider = value;
    } else if ((value = valueFor("model")) !== null) {
      parsed.model = value;
    } else if ((value = valueFor("generated-at")) !== null) {
      if (!isCanonicalIsoTimestamp(value)) {
        throw new Error("--generated-at must be a real canonical ISO timestamp");
      }
      parsed.generatedAt = value;
    } else if ((value = valueFor("retries")) !== null) {
      const retries = Number(value);
      if (!Number.isInteger(retries) || retries < 0) {
        throw new Error("--retries must be a non-negative integer");
      }
      parsed.retries = retries;
    } else if ((value = valueFor("reject-dir")) !== null) {
      parsed.rejectDir = path.resolve(value);
    } else if (argument === "--force") {
      parsed.force = true;
    } else if (argument === "--only-template") {
      parsed.onlyTemplate = true;
    } else if (argument === "--continue-on-reject") {
      parsed.continueOnReject = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (parsed.books.length === 0) {
    throw new Error("--books is required; global generation must be split into reviewable book batches");
  }
  for (const book of parsed.books) {
    if (!CANONS.books[book]) throw new Error(`Unknown book: ${book}`);
  }
  if (parsed.prepareDir) {
    const canonicalPublishedGuides = realpathSync(PUBLISHED_GUIDES_ROOT);
    const canonicalPrepareDir = resolveThroughExistingAncestor(parsed.prepareDir);
    if (isPathWithin(canonicalPublishedGuides, canonicalPrepareDir)) {
      throw new Error(
        "--prepare-dir must not be the published guide directory or one of its descendants",
      );
    }
  }
  if (parsed.rejectDir) {
    const canonicalPublishedGuides = realpathSync(PUBLISHED_GUIDES_ROOT);
    const canonicalRejectDir = resolveThroughExistingAncestor(parsed.rejectDir);
    if (isPathWithin(canonicalPublishedGuides, canonicalRejectDir)) {
      throw new Error(
        "--reject-dir must not be the published guide directory or one of its descendants",
      );
    }
  }
  return parsed;
}

const referenceTouchesChapter = (reference, book, chapter) => {
  const match = /^([1-4]?[A-Z]+)\s+(\d+)(?::|$)/.exec(reference);
  return Boolean(match && match[1] === book && Number(match[2]) === chapter);
};

let naveCache;
function allNaveTopics() {
  if (naveCache) return naveCache;
  const directory = path.join(ROOT, "public/scriptures/nave");
  naveCache = readdirSync(directory)
    .filter((name) => /^[A-Z]\.json$/.test(name))
    .sort()
    .flatMap((name) => readJson(path.join(directory, name)).topics ?? []);
  return naveCache;
}

export function naveGroundingFor(book, chapter) {
  return allNaveTopics()
    .flatMap((topic) =>
      (topic.items ?? []).flatMap((item) => {
        const refs = (item.refs ?? []).filter((reference) =>
          referenceTouchesChapter(reference, book, chapter),
        );
        return refs.length
          ? [{ topic: topic.id, label: item.label || null, refs }]
          : [];
      }),
    )
    .slice(0, 36);
}

/**
 * Assemble the grounding bundle a guide is bound to. `bookBriefing` may be
 * supplied in memory (e.g. the briefing as committed at an earlier revision)
 * so a caller can compute what the bundle *was* without touching the disk;
 * by default the published briefing is read.
 */
export function buildGrounding(book, chapter, { bookBriefing } = {}) {
  const primaryTrans = CANONS.books[book]?.trans?.[0] ?? "web";
  const text = readJson(path.join(ROOT, "public/scriptures/text", primaryTrans, `${book}.json`));
  const verses = text.chapters[chapter - 1];
  if (!verses) throw new Error(`${book} ${chapter} is not in the hosted ${primaryTrans.toUpperCase()} text`);

  const briefingFile = path.join(ROOT, "public/scriptures/books", `${book}.json`);
  if (bookBriefing === undefined && !existsSync(briefingFile)) {
    throw new Error(`${book} needs a source-backed book briefing before guide generation`);
  }
  // TSK does not cover every hosted book. Absence is an empty finding aid;
  // an existing but malformed file still fails the build.
  const xrefFile = path.join(ROOT, "public/scriptures/xref", `${book}.json`);
  const xref = existsSync(xrefFile) ? readJson(xrefFile) : { refs: {} };
  const chapterXrefs = Object.fromEntries(
    Object.entries(xref.refs ?? {}).filter(([reference]) =>
      reference.startsWith(`${chapter}:`),
    ),
  );

  const { reviewStatus, reviewedAt, reviewer, sourceIds, generation, ...exemplar } =
    MARK_EXEMPLAR;
  void reviewStatus;
  void reviewedAt;
  void reviewer;
  void sourceIds;
  void generation;

  return {
    identity: {
      book,
      chapter,
      bookName: CANONS.books[book].name,
    },
    hostedTranslation: {
      id: primaryTrans,
      verses: verses.map((textValue, index) => ({
        verse: index + 1,
        text: textValue,
      })),
    },
    bookBriefing: bookBriefing ?? readJson(briefingFile),
    treasuryOfScriptureKnowledge: chapterXrefs,
    naveTopicalMatches: naveGroundingFor(book, chapter),
    markExemplar: exemplar,
  };
}

export function buildGuidePrompt(grounding) {
  const rubric = readFileSync(RUBRIC_PATH, "utf8").trim();
  // Published ENO guide-v2 hashes bind the historical prompt's WEB label,
  // despite its Charles grounding. Reproduce that record until a separately
  // reviewed prompt migration; never silently rewrite existing provenance.
  const editionLabel = grounding.identity.book === "ENO"
    ? "WEB"
    : grounding.hostedTranslation.id.toUpperCase();
  return [
    "Create one zero-background Scripture chapter guide as strict JSON.",
    `Use only the supplied grounding for concrete claims. The hosted ${editionLabel} lines are the authority for chapter content and every quotation.`,
    "TSK and Nave are finding aids, not proof of an interpretation. Do not turn a cross-reference into a settled claim.",
    "Separate what the chapter says from later Jewish or Christian reception. Where responsible readers differ, name the disagreement briefly and do not force a verdict.",
    "Do not preach, imitate Garo's voice, invent a historical detail, or promise certainty the sources do not provide.",
    "The Mark object is a shape and depth exemplar, never a factual source for this chapter.",
    `Rubric version: ${GUIDE_RUBRIC_VERSION}`,
    "\nAUTHORITATIVE RUBRIC\n",
    rubric,
    "\nGROUNDING BUNDLE\n",
    JSON.stringify(grounding, null, 2),
  ].join("\n");
}

const string = { type: "string" };
const stringArray = { type: "array", items: string };
export const GUIDE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "book",
    "chapter",
    "bookName",
    "summary",
    "whyItMatters",
    "context",
    "outline",
    "keyVerses",
    "themes",
    "questions",
    "glossary",
  ],
  properties: {
    book: string,
    chapter: { type: "integer" },
    bookName: string,
    summary: string,
    whyItMatters: string,
    context: {
      type: "object",
      additionalProperties: false,
      required: ["author", "audience", "date", "setting", "literaryForm"],
      properties: {
        author: string,
        audience: string,
        date: string,
        setting: string,
        literaryForm: string,
      },
    },
    outline: {
      type: "array",
      minItems: 3,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "verses", "note"],
        properties: { heading: string, verses: string, note: string },
      },
    },
    keyVerses: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ref", "text", "why"],
        properties: { ref: string, text: string, why: string },
      },
    },
    themes: { type: "array", minItems: 3, maxItems: 6, items: string },
    questions: {
      type: "array",
      minItems: 7,
      maxItems: 9,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "question",
          "answer",
          "verseRefs",
          "category",
          "relatedVerses",
        ],
        properties: {
          id: string,
          question: string,
          answer: string,
          verseRefs: stringArray,
          category: {
            type: "string",
            enum: ["context", "word", "theology", "history", "practical", "hard_verse"],
          },
          relatedVerses: { type: "array", items: { type: "integer" } },
        },
      },
    },
    glossary: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "def"],
        properties: { term: string, def: string },
      },
    },
  },
};

/**
 * Gemini validates `responseSchema` against an OpenAPI 3.0 subset, which has
 * no `additionalProperties`. Everything else in the guide schema — types,
 * required, enums, min/max items — it honours, so the two providers are held
 * to the same shape rather than to two schemas that could drift apart.
 * `propertyOrdering` is added because Gemini's own guidance is that ordering
 * the fields materially improves structured output quality.
 */
export function toGeminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== "object") return schema;

  const converted = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties") continue;
    converted[key] = toGeminiSchema(value);
  }
  if (converted.type === "object" && converted.properties) {
    converted.propertyOrdering = Object.keys(converted.properties);
  }
  return converted;
}

const readTimeoutMs = (name, fallback) => {
  const timeoutMs = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) {
    throw new Error(`${name} must be at least 1000 milliseconds`);
  }
  return timeoutMs;
};

const SYSTEM_INSTRUCTION =
  "You draft evidence-bounded Scripture orientation. Return only the requested JSON. " +
  "Every prose field is shown directly to readers. Write directly about the chapter; keep the prompt, supplied grounding bundle, validator, and editorial process out of the reader's prose. Keep self-talk, drafting or validation notes, output instructions, reasoning tags, code fences, and stray JSON delimiters out of those fields. " +
  "Hard validation rules the draft is rejected for breaking: every glossary term must be a word or phrase that appears verbatim in the supplied chapter text (never a critical term about the chapter such as 'superscription' or 'genre'); every key verse must quote the supplied text word for word; outline movements must cover every verse once, in order, with no gaps or overlaps; every verseRef must be inside this chapter.";

const extractOpenAiText = (response) => {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  throw new Error("OpenAI response did not contain output_text");
};

const extractGeminiText = (response) => {
  const candidate = response.candidates?.[0];
  // A truncated candidate would otherwise surface as a JSON parse error with
  // no explanation of the real cause, which is almost always the token budget.
  if (candidate?.finishReason && candidate.finishReason !== "STOP") {
    throw new Error(`Gemini stopped early: ${candidate.finishReason}`);
  }
  const text = (candidate?.content?.parts ?? [])
    .map((part) => part.text)
    .filter((part) => typeof part === "string")
    .join("");
  if (!text.trim()) throw new Error("Gemini response did not contain any text");
  return text;
};

async function generateWithOpenAi({ prompt, model, apiKey, fetchImpl }) {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(readTimeoutMs("OPENAI_TIMEOUT_MS", 180_000)),
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 12_000,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_INSTRUCTION }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "chapter_guide",
          description: "A grounded, zero-background Scripture chapter guide",
          strict: true,
          schema: GUIDE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`OpenAI ${response.status}: ${detail}`);
  }
  return JSON.parse(extractOpenAiText(await response.json()));
}

async function generateWithGemini({ prompt, model, apiKey, fetchImpl }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(readTimeoutMs("GEMINI_TIMEOUT_MS", 180_000)),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(GUIDE_SCHEMA),
        maxOutputTokens: 16_000,
        // The guide is a report on a supplied text, not a creative task. A low
        // temperature keeps drafts close to the grounding they were given.
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`Gemini ${response.status}: ${detail}`);
  }
  return JSON.parse(extractGeminiText(await response.json()));
}

async function generateWithOllama({ prompt, model, fetchImpl, env = process.env }) {
  const baseUrl = (env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
  const response = await fetchImpl(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(readTimeoutMs("OLLAMA_TIMEOUT_MS", 600_000)),
    body: JSON.stringify({
      model,
      stream: false,
      format: GUIDE_SCHEMA,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      options: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`Ollama ${response.status}: ${detail}`);
  }
  const data = await response.json();
  // A truncated draft would otherwise surface as a JSON parse error with no
  // explanation of the real cause, which is almost always the token budget.
  if (data.done_reason && data.done_reason !== "stop") {
    throw new Error(`Ollama stopped early: ${data.done_reason}`);
  }
  const text = data.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Ollama response did not contain any text");
  }
  return JSON.parse(text);
}

async function generateWithCodex({ prompt, model, env = process.env }) {
  const tmpDirectory = mkdtempSync(path.join(tmpdir(), "guide-codex-"));
  try {
    const schemaFile = path.join(tmpDirectory, "schema.json");
    const outFile = path.join(tmpDirectory, "out.json");
    writeFileSync(schemaFile, JSON.stringify(GUIDE_SCHEMA), "utf8");
    // codex exec has no separate system role, so the instruction is folded
    // into the prompt itself.
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${prompt}`;
    const result = spawnSync(
      env.CODEX_BIN ?? "codex",
      [
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        "-s",
        "read-only",
        "-m",
        model,
        "-c",
        `model_reasoning_effort=${env.CODEX_REASONING_EFFORT ?? "medium"}`,
        "--output-schema",
        schemaFile,
        "-o",
        outFile,
        "-",
      ],
      {
        input: fullPrompt,
        encoding: "utf8",
        timeout: readTimeoutMs("CODEX_TIMEOUT_MS", 900_000),
        maxBuffer: 64 * 1024 * 1024,
        cwd: tmpDirectory,
      },
    );
    if (result.status !== 0 || result.error) {
      // codex prints banners first, so only the tail of its output is useful.
      throw new Error(
        `Codex exit ${result.status}: ${(result.stderr || result.stdout || "").slice(-800)}`,
      );
    }
    if (!existsSync(outFile) || !readFileSync(outFile, "utf8").trim()) {
      throw new Error("Codex produced no final message");
    }
    return JSON.parse(readFileSync(outFile, "utf8"));
  } finally {
    rmSync(tmpDirectory, { recursive: true, force: true });
  }
}

/**
 * Each provider names the environment it reads, so a missing key fails with
 * the variable the operator actually has to set rather than a generic message.
 * A local provider lists no key environment and reads `OLLAMA_HOST` instead.
 */
export const PROVIDERS = {
  openai: {
    id: "openai",
    keyEnv: ["OPENAI_API_KEY"],
    modelEnv: "OPENAI_MODEL",
    generate: generateWithOpenAi,
  },
  gemini: {
    id: "gemini",
    keyEnv: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    modelEnv: "GEMINI_MODEL",
    generate: generateWithGemini,
  },
  ollama: {
    id: "ollama",
    keyEnv: [],
    modelEnv: "OLLAMA_MODEL",
    generate: generateWithOllama,
  },
  codex: {
    id: "codex",
    keyEnv: [],
    modelEnv: "CODEX_MODEL",
    generate: generateWithCodex,
  },
};

export function resolveProvider({ provider, model, env = process.env }) {
  const id = provider ?? "openai";
  const chosen = PROVIDERS[id];
  if (!chosen) {
    throw new Error(
      `Unknown provider "${id}"; expected one of ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  let apiKey = null;
  if (chosen.keyEnv.length > 0) {
    const keyName = chosen.keyEnv.find((name) => env[name]);
    if (!keyName) {
      throw new Error(
        `${chosen.keyEnv.join(" or ")} is required for provider "${id}"; v2 never writes placeholders`,
      );
    }
    apiKey = env[keyName];
  }
  const resolvedModel = model ?? env[chosen.modelEnv] ?? null;
  if (!resolvedModel) {
    throw new Error(
      `${chosen.modelEnv} (or --model) is required so every draft records its model`,
    );
  }
  return { provider: chosen, apiKey, model: resolvedModel };
}

async function generateGuide({ prompt, model, apiKey, provider, fetchImpl = fetch }) {
  return provider.generate({ prompt, model, apiKey, fetchImpl });
}

const atomicWriteJson = (file, value) => {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, file);
};

export function prepareTarget(book, chapter, options = {}) {
  const grounding = buildGrounding(book, chapter, options);
  const prompt = buildGuidePrompt(grounding);
  return { book, chapter, grounding, prompt, promptHash: sha256(prompt) };
}

async function main() {
  const args = parseArgs(process.argv);
  const targets = args.books.flatMap((book) => {
    const primaryTrans = CANONS.books[book]?.trans?.[0] ?? "web";
    const text = readJson(path.join(ROOT, "public/scriptures/text", primaryTrans, `${book}.json`));
    const chapters =
      args.chapters ?? Array.from({ length: text.chapters.length }, (_, index) => index + 1);
    return chapters.map((chapter) => ({ book, chapter }));
  });
  const prepared = targets.map(({ book, chapter }) => prepareTarget(book, chapter));

  if (args.prepareDir) {
    mkdirSync(args.prepareDir, { recursive: true });
    for (const item of prepared) {
      atomicWriteJson(path.join(args.prepareDir, item.book, `${item.chapter}.json`), item);
    }
    console.log(`Prepared ${prepared.length} grounded prompt bundle(s) in ${args.prepareDir}`);
    return;
  }

  const { provider, apiKey, model } = resolveProvider({
    provider: args.provider,
    model: args.model,
  });

  const generatedAt = args.generatedAt ?? new Date().toISOString();
  let outputTargets = prepared.map((item) => ({
    ...item,
    outputFile: path.join(
      ROOT,
      "public/scriptures/guides",
      item.book,
      `${item.chapter}.json`,
    ),
  }));
  if (args.onlyTemplate) {
    outputTargets = outputTargets.filter(
      ({ outputFile }) =>
        existsSync(outputFile) && hasTemplateSignature(readJson(outputFile)),
    );
    console.log(
      `Selected ${outputTargets.length} template guide(s) of ${prepared.length} in ${args.books.join(", ")}`,
    );
    if (outputTargets.length === 0) {
      console.log("Nothing to regenerate");
      return;
    }
  }
  if (!args.force && !args.onlyTemplate) {
    const existing = outputTargets.filter(({ outputFile }) => existsSync(outputFile));
    if (existing.length > 0) {
      throw new Error(
        `${existing.map(({ book, chapter }) => `${book}/${chapter}`).join(", ")} already exist; pass --force for an intentional replacement`,
      );
    }
  }

  let published = 0;
  let rejected = 0;
  for (const item of outputTargets) {
    let attempt = 0;
    let lastFailures = null;
    while (attempt <= args.retries) {
      attempt += 1;
      console.log(
        `Generating ${item.book} ${item.chapter} with ${model} (${provider.id})${attempt > 1 ? ` — attempt ${attempt}` : ""}`,
      );
      let guide;
      try {
        guide = await generateGuide({
          prompt: item.prompt,
          model,
          apiKey,
          provider,
        });
      } catch (error) {
        lastFailures = [`provider error: ${error.message}`];
        continue;
      }
      guide.generation = {
        model,
        promptHash: item.promptHash,
        generatedAt,
        rubricVersion: GUIDE_RUBRIC_VERSION,
        method: "direct-generation",
      };
      delete guide.reviewStatus;
      delete guide.reviewedAt;
      delete guide.reviewer;
      delete guide.sourceIds;

      const validation = validateGuideV2({
        guide,
        root: ROOT,
        canons: CANONS,
        book: item.book,
        chapter: item.chapter,
        expectedPromptHash: item.promptHash,
      });
      if (validation.failures.length === 0) {
        atomicWriteJson(item.outputFile, guide);
        published += 1;
        console.log(`Published ${item.book}/${item.chapter}`);
        lastFailures = null;
        break;
      }
      lastFailures = validation.failures;
      if (args.rejectDir) {
        atomicWriteJson(
          path.join(args.rejectDir, item.book, `${item.chapter}.attempt${attempt}.json`),
          { guide, failures: validation.failures },
        );
      }
    }
    if (lastFailures) {
      rejected += 1;
      const message = `Rejected ${item.book}/${item.chapter}:\n${lastFailures
        .map((failure) => `- ${failure}`)
        .join("\n")}`;
      if (!args.continueOnReject) throw new Error(message);
      console.error(message);
    }
  }
  console.log(
    `Published ${published} validated draft(s); rejected ${rejected}. Run stamp-guide-review.mjs only after editorial review.`,
  );
  if (rejected > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
