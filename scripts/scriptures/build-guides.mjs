#!/usr/bin/env node
/**
 * Build chapter cheat sheets — AI-generated at build, stored static.
 * Generates public/scriptures/guides/{BOOK}/{chapter}.json
 *
 * Usage:
 *  OPENAI_API_KEY=sk-... node scripts/scriptures/build-guides.mjs --books GEN,JHN --chapters 1,3
 *  node scripts/scriptures/build-guides.mjs --sample  # writes 5 sample guides without API
 *  node scripts/scriptures/build-guides.mjs --all      # every hosted WEB chapter (costly)
 *
 * Env:
 *  OPENAI_API_KEY — required for real generation. Placeholder publication is
 *  refused unless --sample or --allow-placeholders makes that intent explicit.
 *
 * Prompt: zero-background, top questions a first-time reader would ask.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  atomicWriteJsonSync,
  publishStagedEntriesSync,
} from "../lib/atomic-publication.mjs";
import { validateGuideContract } from "../lib/guide-validation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const CANONS_PATH = path.join(ROOT, "public/scriptures/canons.json");
const TEXT_DIR = path.join(ROOT, "public/scriptures/text/web");
const OUT_DIR = path.join(ROOT, "public/scriptures/guides");
const CACHE_DIR = path.join(__dirname, ".cache");

const canons = JSON.parse(fs.readFileSync(CANONS_PATH, "utf8"));
const args = process.argv.slice(2);

const flag = (name) => args.includes(name);
const opt = (name) => {
  const pref = `--${name}=`;
  const found = args.find((a) => a.startsWith(pref));
  return found ? found.slice(pref.length) : null;
};

const SAMPLE_BOOKS = ["GEN", "JHN", "MAT", "ROM", "1CO"];
const SAMPLE_CHAPTERS = { GEN: [1], JHN: [3], MAT: [5], ROM: [8], "1CO": [15] };

function parseList(str) {
  if (!str) return null;
  return str.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
}
function parseNumList(str) {
  if (!str) return null;
  return str.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
}

let books = parseList(opt("books"));
let chapters = parseNumList(opt("chapters"));

if (flag("--sample")) {
  books = SAMPLE_BOOKS;
}

if (flag("--all")) {
  books = Object.keys(canons.books);
  chapters = null;
}

if (!books) {
  books = SAMPLE_BOOKS;
  // if no explicit chapters, use sample chapters per book
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadText(book) {
  const p = path.join(TEXT_DIR, `${book}.json`);
  try {
    const text = JSON.parse(fs.readFileSync(p, "utf8"));
    if (text.book !== book || text.trans !== "web" || !Array.isArray(text.chapters)) {
      throw new Error("book, translation, or chapters do not match the expected WEB contract");
    }
    return text;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw new Error(
      `[guides] Invalid WEB source ${path.relative(ROOT, p)}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function makePrompt(bookName, bookId, chapter, verses) {
  const verseList = verses.map((t, i) => `[${i + 1}] ${t || "(no text)"}`).join("\n");
  return `You are a Bible study guide for a reader with ZERO background. No prior knowledge, no church context.

Book: ${bookName} (${bookId}) Chapter ${chapter}
Verses:
${verseList}

Task: Output STRICT JSON matching this schema (no markdown, no extra text):

{
  "book": "${bookId}",
  "chapter": ${chapter},
  "bookName": "${bookName}",
  "summary": "2-3 sentences plain English what happens in this chapter",
  "whyItMatters": "1-2 sentences why this chapter matters",
  "context": { "author": "maybe", "audience": "maybe", "date": "maybe", "setting": "maybe", "literaryForm": "letter|narrative|poetry|prophecy|gospel|wisdom..." },
  "outline": [ {"heading": "...", "verses": "1-4", "note": "optional"} ],
  "keyVerses": [ {"ref": "3:16", "text": "exact verse text from input", "why": "1 sentence"} ],
  "themes": ["theme1", "theme2", "theme3"],
  "questions": [
    {
      "id": "q1",
      "question": "Top question a first-time reader would ask",
      "answer": "Plain English answer 2-5 sentences, explain context, no preaching",
      "verseRefs": ["3:16"],
      "category": "context|word|theology|history|practical|hard_verse",
      "relatedVerses": [16]
    }
  ],
  "glossary": [ {"term": "word", "def": "plain def"} ]
}

Rules:
- 5-8 questions, focus on confusion points, cultural context, hard verses, why things happen, words that need defining.
- Categories: context=background, word=difficult term, theology=God/Jesus/Spirit concept, history=historical fact, practical=how to apply, hard_verse=verse hard to understand.
- Keep answers concise, factual, non-denominational, no preaching. If uncertain, say "tradition holds..." or "scholars debate".
- Use chapter-relative refs like "3:16" or "1-4".
- Outline headings: 3-6 sections covering chapter flow.
- Themes: 3-5 short phrases.
- Glossary: up to 5 difficult words actually in chapter.
- Output VALID JSON only.

Example question style: "Why does Nicodemus come at night?" / "What does 'born again' mean?" / "Why is this chapter famous?"`;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a careful Bible guide generating structured JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from OpenAI");
  return JSON.parse(content);
}

function placeholderGuide(bookName, bookId, chapter, verses) {
  return {
    book: bookId,
    chapter,
    bookName,
    summary: `${bookName} ${chapter} contains ${verses.length} verses. This placeholder will be replaced by an AI-generated guide covering background, outline, and top questions.`,
    whyItMatters: "This chapter is part of the larger story and introduces themes developed elsewhere.",
    context: {
      author: "See book overview",
      audience: "Original hearers in historical context",
      date: "See book overview",
      setting: "Historical setting varies by book",
      literaryForm: "varies",
    },
    outline: [
      { heading: `Start of chapter`, verses: `1-${Math.min(5, verses.length)}` },
      { heading: `Middle`, verses: `${Math.min(6, verses.length)}-${Math.max(6, verses.length - 5)}` },
      { heading: `End`, verses: `${Math.max(verses.length - 4, 1)}-${verses.length}` },
    ].filter((_, i, arr) => {
      // keep only valid ranges
      const [s, e] = arr[i].verses.split("-").map(Number);
      return s <= e && s <= verses.length;
    }),
    keyVerses: verses[0] ? [{ ref: `${chapter}:1`, text: verses[0].slice(0, 120), why: "Opening verse sets the context." }] : [],
    themes: ["context", "faith", "community"],
    questions: [
      {
        id: "q1",
        question: `What is happening in ${bookName} ${chapter}?`,
        answer: `This chapter has ${verses.length} verses. Read the summary above, then note who is speaking, who is listening, and any repeated words. The guide will be replaced with AI-generated questions like "What does this word mean?" or "Why did this event matter?"`,
        verseRefs: [`${chapter}:1`],
        category: "context",
        relatedVerses: [1],
      },
      {
        id: "q2",
        question: "Are there difficult words or customs here?",
        answer: "Look for names, places, or practices that sound unfamiliar. This guide will explain 3-5 of them in plain English with glossary entries.",
        verseRefs: [],
        category: "word",
      },
    ],
    glossary: [],
  };
}

async function main() {
  ensureDir(OUT_DIR);
  const allowPlaceholders = flag("--sample") || flag("--allow-placeholders");
  if (!process.env.OPENAI_API_KEY && !allowPlaceholders) {
    throw new Error(
      "[guides] Refusing to publish placeholders without explicit intent. Set OPENAI_API_KEY, use --sample, or pass --allow-placeholders.",
    );
  }

  ensureDir(CACHE_DIR);
  const staging = fs.mkdtempSync(path.join(CACHE_DIR, "build-guides-"));
  const stagedEntries = [];
  let total = 0;
  let generated = 0;

  try {
    for (const bookId of books) {
      const meta = canons.books[bookId];
      if (!meta) throw new Error(`[guides] Unknown book ${bookId}`);
      const text = loadText(bookId);
      if (!text) {
        if (meta.trans.includes("web")) {
          throw new Error(`[guides] Canon declares WEB text for ${bookId}, but its file is missing`);
        }
        console.warn(`[guides] No hosted WEB text for ${bookId}, skip`);
        continue;
      }
      const bookName = meta.name;
      const maxCh = text.chapters.length;
      const chapterList = chapters || SAMPLE_CHAPTERS[bookId] || [1];
      const targetChapters = flag("--all")
        ? Array.from({ length: maxCh }, (_, i) => i + 1)
        : chapterList.filter((chapter) => chapter >= 1 && chapter <= maxCh);

      for (const ch of targetChapters) {
        total++;
        const verses = text.chapters[ch - 1];
        if (!Array.isArray(verses)) {
          throw new Error(`[guides] WEB ${bookId} ${ch} is not a verse array`);
        }

        const relative = path.join(bookId, `${ch}.json`);
        const outPath = path.join(OUT_DIR, relative);

        if (!flag("--force") && fs.existsSync(outPath) && !flag("--sample")) {
          console.log(`[guides] Exists, skip ${bookId} ${ch} (use --force to overwrite)`);
          continue;
        }

        let guide;
        if (flag("--sample")) {
          // For --sample, provide a richer explicit placeholder for the five demo chapters.
          if (SAMPLE_CHAPTERS[bookId]?.includes(ch)) {
            guide = placeholderGuide(bookName, bookId, ch, verses);
            guide.summary = `Sample guide for ${bookName} ${ch} — this demonstrates the cheat-sheet format. Replace with AI generation via OPENAI_API_KEY.`;
            guide.questions = [
              {
                id: "q1",
                question: `What is ${bookName} ${ch} actually about?`,
                answer: `In plain terms: this chapter has ${verses.length} verses. The AI guide will summarize in 2-3 sentences what happens, who is speaking, and why it matters, so you can read with context even if you've never seen the Bible before.`,
                verseRefs: [`${ch}:1`],
                category: "context",
                relatedVerses: [1],
              },
              {
                id: "q2",
                question: "What questions do first-time readers usually have here?",
                answer: `Good questions often are: "Who are these people?", "Why does this matter?", "What does this word mean?", "Is this literal or figurative?". The AI-generated guide will list 5-8 such questions with concise answers tied to specific verses.`,
                verseRefs: [],
                category: "hard_verse",
              },
              {
                id: "q3",
                question: "How do I know what verses to pay attention to?",
                answer: `The guide highlights key verses and links each question to verse refs (e.g. ${ch}:16). Click a ref to jump to that verse in the reader.`,
                verseRefs: [`${ch}:${Math.min(3, verses.length)}`],
                category: "practical",
                relatedVerses: [Math.min(3, verses.length)],
              },
            ];
          } else {
            guide = placeholderGuide(bookName, bookId, ch, verses);
          }
        } else {
          const prompt = makePrompt(bookName, bookId, ch, verses);
          try {
            const ai = await callOpenAI(prompt);
            if (ai) {
              if (!Array.isArray(ai.questions)) {
                throw new Error("model response questions must be an array");
              }
              guide = {
                book: bookId,
                chapter: ch,
                bookName,
                summary: ai.summary || "",
                whyItMatters: ai.whyItMatters || "",
                context: ai.context || {},
                outline: ai.outline || [],
                keyVerses: ai.keyVerses || [],
                themes: ai.themes || [],
                questions: ai.questions.map((question, index) => ({
                  id: question.id || `q${index + 1}`,
                  question: question.question || "",
                  answer: question.answer || "",
                  verseRefs: question.verseRefs || [],
                  category: question.category || "context",
                  relatedVerses: question.relatedVerses || [],
                })),
                glossary: ai.glossary || [],
              };
              generated++;
            } else {
              guide = placeholderGuide(bookName, bookId, ch, verses);
            }
          } catch (error) {
            if (!allowPlaceholders) throw error;
            console.error(
              `[guides] Failed ${bookId} ${ch}; staging an explicitly allowed placeholder: ${error instanceof Error ? error.message : String(error)}`,
            );
            guide = placeholderGuide(bookName, bookId, ch, verses);
          }
          if (process.env.OPENAI_API_KEY) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }

        validateGuideContract(guide, {
          bookId,
          bookName,
          chapter: ch,
          hostedTexts: [{ translation: "web", text }],
        });
        atomicWriteJsonSync(path.join(staging, relative), guide);
        stagedEntries.push(relative);
        console.log(`[guides] Staged ${bookId} ${ch}`);
      }
    }

    publishStagedEntriesSync(staging, OUT_DIR, stagedEntries, {
      label: "chapter-guides",
    });
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }

  console.log(
    `[guides] Published ${stagedEntries.length} validated guides. Total targets ${total}, AI generated ${generated}, dir ${path.relative(ROOT, OUT_DIR)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
