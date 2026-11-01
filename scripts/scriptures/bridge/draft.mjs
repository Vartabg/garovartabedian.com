#!/usr/bin/env node
/**
 * Draft Word Bridge links with Claude.
 *
 * The model proposes which English words translate which Hebrew or Greek
 * words. It never decides whether a link is right — check.mjs does that,
 * against the dictionaries, in build.mjs. Drafts are committed under
 * scripts/scriptures/bridge/drafts/ so the published data can always be
 * rebuilt and re-checked without calling the model again.
 *
 *   node scripts/scriptures/bridge/draft.mjs estimate JHN GEN:1-3   count input tokens (no cost)
 *   node scripts/scriptures/bridge/draft.mjs pilot JHN:3:14-21      one live request, prints result
 *   node scripts/scriptures/bridge/draft.mjs submit JHN GEN:1-3     create a Message Batch (50% price)
 *   node scripts/scriptures/bridge/draft.mjs collect <batch_id>     save finished drafts
 *
 * Needs ANTHROPIC_API_KEY (or an `ant auth login` profile) for every command.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadChapter } from "./chapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DRAFTS = path.join(HERE, "drafts");
export const MODEL = "claude-opus-5-5";
export const PROMPT_VERSION = 1;
/** Verses per request: keeps each answer well under max_tokens. */
const CHUNK = 20;

export const SYSTEM = `You align a World English Bible verse with its Hebrew or Greek source, word by word, for readers who do not know the original languages.

For each verse you get the English words and the original words, both numbered. Each original word comes with its dictionary lemma and a short gloss. Return links of three kinds:
- "link": English word indices in "en" and the original words they translate in "og". Group a phrase when several English words render one original word ("only born" for μονογενῆ) or one English word renders several ("God" for ὁ θεὸς).
- "supplied": English words with no original word behind them, added by the translator. "og" is empty.
- "untranslated": original words the English leaves out, such as an article, a particle, or the Hebrew object marker. "en" is empty.

Every English word index appears in exactly one link. Every original word appears in at least one link.
Refer to an original word by its index as a string, such as "4". A Hebrew word may have parts (a prefix such as "and", "the", or "in" joined to the word). When the English renders one part on its own, refer to that part as "word.part", such as "4.0" for the prefix.
A Greek verb's ending carries its subject, so link "he" in "he gave" with the verb. A Hebrew pronoun suffix carries "my", "his", and the like, so link those with that word.

"note" is empty unless a reader would be surprised: the word order differs, a subject is inside a verb, or an idiom is rendered freely. Write one plain sentence of at most 20 words. Give no theology and no interpretation beyond the grammar.
"confidence" is "low" when you are unsure the link is right, otherwise "high".
Do not change or correct the English or the original. Use only the indices given.`;

export const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verses"],
  properties: {
    verses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["n", "links"],
        properties: {
          n: { type: "integer" },
          links: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["en", "og", "kind", "note", "confidence"],
              properties: {
                en: { type: "array", items: { type: "integer" } },
                og: { type: "array", items: { type: "string" } },
                kind: { type: "string", enum: ["link", "supplied", "untranslated"] },
                note: { type: "string" },
                confidence: { type: "string", enum: ["high", "low"] },
              },
            },
          },
        },
      },
    },
  },
};

/** "JHN" | "GEN:1-3" | "JHN:3:14-21" → { book, chapters, verses? } */
export function parseTarget(spec) {
  const [book, chapters, verses] = spec.split(":");
  const range = (s) => {
    const [a, b] = s.split("-").map(Number);
    return Array.from({ length: (b || a) - a + 1 }, (_, i) => a + i);
  };
  return { book: book.toUpperCase(), chapters: chapters ? range(chapters) : null, verses: verses ? range(verses) : null };
}

function chapterCount(book) {
  const web = JSON.parse(readFileSync(path.join(HERE, "..", "..", "..", "public", "scriptures", "text", "web", `${book}.json`), "utf8"));
  return web.chapters.length;
}

/** What the model sees for one verse. */
function verseInput(verse) {
  return {
    n: verse.n,
    english: verse.english.map((t, i) => (t.w ? [i, t.w] : null)).filter(Boolean),
    original: verse.original.map((w, i) => ({
      i,
      word: w.t,
      parts:
        w.parts.length > 1
          ? w.parts.map((p, j) => ({ part: `${i}.${j}`, lemma: p.lemma, gloss: p.dict?.brief ?? "" }))
          : undefined,
      lemma: w.parts.length === 1 ? w.parts[0].lemma : undefined,
      gloss: w.parts.length === 1 ? (w.parts[0].dict?.brief ?? "") : undefined,
    })),
  };
}

export function requestsFor(targets) {
  const out = [];
  for (const { book, chapters, verses } of targets) {
    for (const chapter of chapters ?? Array.from({ length: chapterCount(book) }, (_, i) => i + 1)) {
      const ch = loadChapter(book, chapter);
      const list = ch.verses.filter((v) => !verses || verses.includes(v.n));
      for (let i = 0; i < list.length; i += CHUNK) {
        const chunk = list.slice(i, i + CHUNK);
        const content = JSON.stringify({
          book,
          chapter,
          language: ch.lang,
          english: "World English Bible",
          original: ch.edition === "sblgnt" ? "SBL Greek New Testament" : "Open Scriptures Hebrew Bible",
          verses: chunk.map(verseInput),
        });
        out.push({
          custom_id: `${book}_${chapter}_${chunk[0].n}-${chunk.at(-1).n}`,
          params: {
            model: MODEL,
            max_tokens: 32000,
            system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content }],
            output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
          },
        });
      }
    }
  }
  return out;
}

function draftFile(book, chapter) {
  return path.join(DRAFTS, book, `${chapter}.json`);
}

/** Merge one answered chunk into the chapter's committed draft. */
export function saveChunk(customId, message, provenance) {
  const [book, chapter] = customId.split("_");
  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const parsed = JSON.parse(text);
  const file = draftFile(book, Number(chapter));
  const existing = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : { book, chapter: Number(chapter), model: MODEL, promptVersion: PROMPT_VERSION, chunks: [], verses: [] };
  const byN = new Map(existing.verses.map((v) => [v.n, v]));
  for (const v of parsed.verses) byN.set(v.n, { n: v.n, links: v.links });
  existing.verses = [...byN.values()].sort((a, b) => a.n - b.n);
  existing.chunks = [
    ...existing.chunks.filter((c) => c.customId !== customId),
    { customId, ...provenance, stopReason: message.stop_reason, usage: { input: message.usage.input_tokens, output: message.usage.output_tokens } },
  ].sort((a, b) => a.customId.localeCompare(b.customId, "en", { numeric: true }));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(existing, null, 1)}\n`);
  return { book, chapter: Number(chapter), verses: parsed.verses.length };
}

async function client() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic();
}

async function main([command, ...args]) {
  if (command === "estimate") {
    const requests = requestsFor(args.map(parseTarget));
    const api = await client();
    let input = 0;
    let verses = 0;
    let englishWords = 0;
    for (const r of requests) {
      const { input_tokens } = await api.messages.countTokens({ model: MODEL, system: r.params.system, messages: r.params.messages });
      input += input_tokens;
      const body = JSON.parse(r.params.messages[0].content);
      verses += body.verses.length;
      englishWords += body.verses.reduce((s, v) => s + v.english.length, 0);
    }
    console.log(JSON.stringify({ requests: requests.length, verses, englishWords, inputTokens: input }, null, 1));
    return;
  }
  if (command === "pilot") {
    const [request] = requestsFor(args.map(parseTarget));
    const api = await client();
    // Live request: opt into server-side fallback if a safeguard declines.
    const message = await api.beta.messages
      .stream({ ...request.params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
      .finalMessage();
    console.log(JSON.stringify({ customId: request.custom_id, stop: message.stop_reason, model: message.model, usage: message.usage }, null, 1));
    const saved = saveChunk(request.custom_id, message, { source: "pilot", collectedAt: new Date().toISOString().slice(0, 10) });
    console.log(`saved ${saved.verses} verses to drafts/${saved.book}/${saved.chapter}.json`);
    return;
  }
  if (command === "submit") {
    const requests = requestsFor(args.map(parseTarget));
    const api = await client();
    const batch = await api.messages.batches.create({ requests });
    const log = path.join(DRAFTS, "batches.json");
    const list = existsSync(log) ? JSON.parse(readFileSync(log, "utf8")) : [];
    list.push({ id: batch.id, createdAt: batch.created_at, targets: args, requests: requests.length });
    mkdirSync(DRAFTS, { recursive: true });
    writeFileSync(log, `${JSON.stringify(list, null, 1)}\n`);
    console.log(`batch ${batch.id}: ${requests.length} requests, ${batch.processing_status}`);
    return;
  }
  if (command === "collect") {
    const [id] = args;
    const api = await client();
    const batch = await api.messages.batches.retrieve(id);
    if (batch.processing_status !== "ended") {
      console.log(`batch ${id}: ${batch.processing_status} ${JSON.stringify(batch.request_counts)}`);
      process.exitCode = 2;
      return;
    }
    const failures = [];
    let saved = 0;
    for await (const result of await api.messages.batches.results(id)) {
      const r = result.result;
      if (r.type !== "succeeded") {
        failures.push({ customId: result.custom_id, type: r.type });
        continue;
      }
      if (r.message.stop_reason !== "end_turn") {
        failures.push({ customId: result.custom_id, type: r.message.stop_reason });
        continue;
      }
      try {
        saveChunk(result.custom_id, r.message, { source: id, collectedAt: new Date().toISOString().slice(0, 10) });
        saved += 1;
      } catch (error) {
        failures.push({ customId: result.custom_id, type: `unparseable: ${error.message}` });
      }
    }
    console.log(JSON.stringify({ batch: id, saved, failures }, null, 1));
    if (failures.length) process.exitCode = 1;
    return;
  }
  console.error("usage: draft.mjs estimate|pilot|submit <BOOK[:chapters[:verses]]>... | collect <batch_id>");
  process.exitCode = 64;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
