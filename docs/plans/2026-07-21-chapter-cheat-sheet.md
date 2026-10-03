# Plan: Chapter Cheat Sheet — zero-background deep dive

> Historical record: this plan describes the retired placeholder-writing v1
> generator. The current fail-closed pipeline and rubric live in
> `scripts/scriptures/build-guides-v2.mjs` and
> `scripts/scriptures/GUIDE_RUBRIC_V2.md`; the old one-off generators remain
> recoverable from Git history only.

**Goal:** Every `/scriptures/[tradition]/[book]/[chapter]` page offers an optional “Cheat Sheet” / “Deep Dive” that answers the top questions a first-time reader would have. AI-generated at build, stored as static JSON in `public/scriptures/guides/`, no runtime secrets.

**User intent (2026-07-21):**
- “provide a reader with zero background or context a sort of cheat sheet though one that explains more about the chapter and the verses in them”
- Scope: Full study guide
- Data source: AI generates top possible questions that arise from chapter+verses, with context — stored, not live.

## Context
Current reader: `src/app/scriptures/[tradition]/[book]/[chapter]/page.tsx` (server) → `ReaderClient.tsx` (client). It shows:
- toolbar (book/chapter/verse/version/compare)
- chapter ribbon
- sheet of verses with drop cap, red-letter, cross-ref popovers, Threads viz
- No summary or background.

Existing generated data lives in `public/scriptures/` (text, xref, search shards, nave). New guides will live alongside: `public/scriptures/guides/{BOOK}/{chapter}.json`.

## Data Model

`src/lib/scriptures/types.ts` addition:

```ts
export type ChapterGuideQuestion = {
  id: string; // q1, q2...
  question: string; // e.g. "Why does Paul mention baptism for the dead?"
  answer: string; // plain English, 2-5 sentences, zero-background friendly
  verseRefs: string[]; // ["15:29"] or ["15:12-19"] — chapter-relative
  category: "context" | "word" | "theology" | "history" | "practical" | "hard_verse";
  relatedVerses?: number[]; // [29]
};

export type ChapterGuide = {
  book: string; // "1CO"
  chapter: number; // 15
  bookName: string; // "1 Corinthians"
  summary: string; // 2-3 sentences, what happens
  whyItMatters: string; // 1-2 sentences
  context: {
    author?: string;
    audience?: string;
    date?: string;
    setting?: string;
    literaryForm?: string; // letter, narrative, poetry...
  };
  outline: { heading: string; verses: string; note?: string }[]; // e.g. {heading:"Resurrection denied", verses:"12-19"}
  keyVerses: { ref: string; text: string; why: string }[];
  themes: string[];
  questions: ChapterGuideQuestion[]; // 5-8 top questions
  glossary?: { term: string; def: string }[]; // difficult words in chapter
};
```

File: `public/scriptures/guides/{BOOK}/{chapter}.json` e.g. `public/scriptures/guides/1CO/15.json`

Storage: ~1189 chapters × ~4KB ≈ 5MB acceptable. Start with 300 popular (same as topics ISR top 300) then expand.

## Generation Script

`scripts/scriptures/build-guides.mjs`

- Reads `public/scriptures/canons.json` for book list, chapter counts
- For each book/chapter (or filtered list):
  - Loads `public/scriptures/text/web/{BOOK}.json` → picks chapters[chapter-1] verses
  - Builds prompt:
    ```
    You are a Bible guide for a reader with ZERO background. Book: {bookName} ({BOOK}) Chapter {chapter}. Verses: [1] "..." [2] "..."
    Task: Generate JSON matching ChapterGuide schema. Focus on top questions a first-time reader would ask (confusing words, cultural context, why it matters, hard verses). Plain English, no jargon unless explained. Avoid preaching; explain.
    Rules: ...
    ```
  - Calls OpenAI (gpt-4o-mini) via OPENAI_API_KEY env (never committed). If no key, writes placeholder or skips.
  - Validates JSON shape, writes to public/scriptures/guides/{BOOK}/{chapter}.json
  - Logs progress, rate-limits.

`package.json` script: `"data:guides": "node scripts/scriptures/build-guides.mjs"`

No runtime secrets: guides are static JSON.

## Loaders

`src/lib/scriptures/server.ts`:
- `getChapterGuide(book, chapter): ChapterGuide | null` — reads from `public/scriptures/guides/{BOOK}/{chapter}.json` via fs, like `getBookText`
- Used in `page.tsx` server component to pass to client

`src/lib/scriptures/client.ts`:
- `loadChapterGuide(book, chapter): Promise<ChapterGuide | null>` — fetch `/scriptures/guides/{BOOK}/{chapter}.json` with session cache, `.catch(() => null)`

## UI Component

New: `src/app/scriptures/[tradition]/[book]/[chapter]/ChapterGuide.tsx` (client)

Props: `guide: ChapterGuide | null`, `bookName`, `chapter`

States:
- If null → “Guide coming soon” with CTA to request
- If present → button “Cheat Sheet — what’s happening here?” toggles panel
- Panel sections:
  - Summary + Why it matters (always visible when open)
  - Context strip (author/audience/date/setting)
  - Outline (clickable verse anchors)
  - Key verses (highlight)
  - Top Questions — accordion: list of questions, each expandable to show answer + verseRefs linked to `#v{num}`
  - Glossary (if any)

Accessibility: button `aria-expanded`, accordion via `<details>/<summary>` or roving, keyboard nav.

Styling: reuse `.scr-*` tokens from `scriptures.css` — new classes `.scr-guide`, `.scr-guide-toggle`, `.scr-guide-panel`, `.scr-guide-q`, etc. Frosted surface like `scr-reader-ribbon`, no new deps.

## Integration into ReaderClient

In `ReaderClient.tsx`:
- Add state `showGuide`
- Toolbar: add button “Cheat Sheet” (next to Threads/Red letter)
- Below ribbon, above neighbor nav: render `<ChapterGuide guide={guide} />` when `showGuide` true or as collapsible
- Pass `guide` from `page.tsx` → `ReaderClient` props

Alternatively server component `page.tsx` loads guide and passes; client fetches on demand if not preloaded.

For MVP: server loads guide via `getChapterGuide`, passes to `ReaderClient`; if missing, client tries `loadChapterGuide` lazy.

## Verification

- `npm run lint`, `typecheck`, `test`
- `npm run build` — guides are static JSON, not part of SSG (fetched client or passed server)
- Manual check: `/scriptures/protestant/GEN/1` → toggle cheat sheet → questions accordion
- A11y: axe on `/scriptures/protestant/JHN/3` with guide open (one of test:a11y routes already includes `/scriptures`? Add guide route to a11y list)
- No secrets: `scripts/build-guides.mjs` reads `OPENAI_API_KEY` from env, never logs key

## Rollout Plan

1. **Types + loader** (server/client) — no UI yet
2. **UI component** with mock data (hardcode one guide JSON for GEN/1)
3. **Generation script** + `data:guides` npm script, README note
4. **Sample guides**: generate 5-10 popular chapters (GEN 1, JHN 3, ROM 8, 1CO 15, MAT 5) and commit
5. **Full integration**: wire toggle in ReaderClient, style pass, build verification
6. Ship to `master` → Vercel

## Risks / Open

- Cost of generating 1189 chapters: ~ $20-40 with gpt-4o-mini if 500 tokens/chapter. Mitigation: generate top 300 first (same as topics), then incremental.
- Quality: AI may hallucinate historical claims. Mitigation: prompt says “state uncertainty, cite public-domain sources, avoid denominational bias, plain summary”
- Storage: 1189 JSON files in public/ — okay, but git LFS? Keep under 100MB total → fine (<10MB)
- Maintenance: guides need versioning if text changes (WEB public-domain is stable)

## Future Ideas

- Verse-level inline “?” icon that jumps to relevant question
- Glossary linking from chapter text to guide term
- User feedback “Was this helpful?” → collect for regeneration
