# AI-era transformation plan — 2026-08-28

**Provenance.** Ten-agent audit: 8 parallel subsystem readers → 1 strategist (dedup + rank) → 1 skeptic verifying the top 8 items against the actual code. Every file claim in items 1–8 was verified on disk. Audit run: 2026-08-28.

**Governing constraints (non-negotiable).** Faith dive first — Jesus is the interpretive standard; no gimmicks on sacred text. Voice rule — plain, factual, humble; no invented narrative, no year counts, no banned phrases. Static-first — build-time generation and in-browser AI preferred; any runtime API needs justification (this plan ships with **zero runtime API**: 14 of 15 items are build-time scripts + committed JSON; the only runtime code is client-side scoring and CSS). Solo-maintainable. a11y gates must pass. Vercel media quotas respected.

## The thesis

The site already accidentally built two reusable engines; this plan is them, applied everywhere.

1. **The house pipeline** — generate at build with an LLM, machine-check, stamp for humans, commit static JSON. It exists independently in five worlds already (guides, plates, evidence grades, originals, embeddings). Make it one documented pattern — provenance schema + stamp + corpus-health dashboard — so every item below is an instance, not an invention.
2. **The one meaning model** — the in-browser embedding store (Xenova/all-MiniLM-L6-v2, 15MB int8, self-hosted ONNX WASM) is the site's shared meaning infrastructure. Items 2, 3, 5, 8 reuse it at sub-MB marginal cost. Do them in sequence against one generalization of `build-embeddings.mjs`.

The voice is the moat: everything visitor-facing either quotes hosted text verbatim, shows a machine-checked grade/stamp, or defers to a visible human-review tier. Nothing in this plan generates prose in Garo's voice or synthesizes answers over sacred text.

## Ranked plan

Feasibility verdicts from the code-verification pass: [yes] = ready as described; [yes-with-changes] = core verified, named caveats apply.

### 1. Finish the record: rewrite the 1,199 Mad-Libs chapter guides to the Mark standard; grow book briefings 10 → 84
*high impact · weeks · [yes-with-changes]* — three auditors independently flagged this as THE gap.

**Visitor gets:** a first-time reader who opens Leviticus 11 or Psalm 88 gets the same honest, zero-background orientation that Mark readers get today — real briefings, debates, verbatim quotes — instead of sentence-salad filler.
**Mechanism:** new `scripts/scriptures/build-guides-v2.mjs`: per chapter, assemble grounding (verbatim WEB text, book briefing, TSK+Nave refs, README rubric + Mark as exemplar), generate at build, gate through `stamp-guide-review.mjs` checks + template-signature reject from `build-corpus-health.mjs`, stamp agent-reviewed with `{model, promptHash, generatedAt, rubricVersion}`. git-rm `gen_100.py`, `gen_next10*_handcraft.py`, `build-guides-agent.py` (archive read-only in docs/). Batch by book, Torah first; Garo diffs each PR batch.
**Why now:** 84% of the corpus is template filler (Proverbs 1 reads as self-referential word salad) while the gate, the human standard, and the health dashboard already exist — the pipeline is stalled at 16%.
**Faith/voice fit:** guides orient; quotes machine-verified verbatim; stamps make provenance plain.

### 2. One meaning web: extend the zero-API in-browser semantic search to every corpus on the site
*high impact · days · [yes-with-changes]*

**Visitor gets:** "taking care of my family" surfaces "Woman, behold your son" among his words; "don't let anyone stop my death" finds Ignatius to the Romans; "did Peter reach Rome?" lands on the evidence-graded apostle record — one private, on-device meaning search over the whole shelf.
**Mechanism:** generalize `scripts/scriptures/build-embeddings.mjs` into `--corpus` modes embedding words.json (~0.8MB), ~570 early-section shards (~220KB), and world records into `public/{jesus,early,worlds}/semantic/*.bin`. Reuse `semantic.ts` rankRows/loadQueryEmbedder verbatim; model already cached. Move pipeline+scoring into a Web Worker (CSP already allows `worker-src 'self' blob:` and `wasm-unsafe-eval`), widen the funnel to score all 1,189 chapter centroids, persist `semanticOptIn` in localStorage, thread the `?trans=` picker into VersePreview. Surface a meaning rail in WordsRoom, EarlyCatalog, WordLedger, EncountersRoom.
**Why now:** the expensive part (self-hosted quantized model, vendored WASM, CSP carve-out, tested ranking math) shipped in 3d24679; adding corpora is a build-script parameter, and the fixes remove the only reasons the feature hides.

### 3. "Passages that carry this idea": build-time verse-level semantic neighbors beside the 19th-century cross-references
*high impact · days · [yes]*

**Visitor gets:** on any verse, one tap shows where else the text itself says this — the text's own neighbors by meaning, plainly labeled as computed not curated, sitting beside the TSK cross-references as a second, transparent witness.
**Mechanism:** extend `build-embeddings.mjs` to compute per-verse top-8 nearest neighbors from `public/scriptures/semantic/verses/*.bin`, dedupe against `public/scriptures/xref` (TSK), emit per-chapter tiny JSON (~1–2MB total). Render in VersePanel/Threads-adjacent section, similarity scores visible. Reuse `semantic.ts` math in unit tests; no runtime model needed for display.
**Why now:** the 15MB embedding store is used by exactly one buried opt-in button today; emitting static neighbor JSON is the cheapest high-transformative use of an already-paid asset.

### 4. Chapter-level OG cards so sharing scripture spreads scripture
*high impact · week · [yes-with-changes]*

**Visitor gets:** pasting a John 3 link in a group chat unfurls a parchment card with its own drawn line; the Didache and each of 300 topic pages share as themselves, not the generic tomb photo.
**Mechanism:** add `opengraph-image.tsx` to `scriptures/[tradition]/[book]/[chapter]/`, `/early/[text]/`, `/scriptures/topics/[topic]/` reusing `renderOgImage` (src/lib/og.tsx) with each world's palette, all static via generateStaticParams. Per-chapter line derives from the guide's already-verified key verse. Extend `tests/e2e/og-images.spec.ts`. **Caveat from verification:** chapter pages currently have NO generateStaticParams and derive `translation/compare/original` from searchParams — the OG route must pick a canonical default rendering per chapter.
**Why now:** OG coverage is inverted against the site's purpose (10 hire-me routes have custom cards; ~6.7k chapter pages have none).

### 5. Original-language underlay: Greek beneath the red letters, MT vs LXX on prophecy pairs, Hebrew/Greek on the fall fragments
*high impact · week · [yes-with-changes]*

**Visitor gets:** every red-letter verse opens its own Greek line word-by-word with lemma and morphology; prophecy pairs show the actual Hebrew vs Septuagint wording where they diverge (Isa 7:14); "disputed reading" labels in the fall fragments finally show their working.
**Mechanism:** WordsRoom — on verse expand, fetch `/scriptures/original/{book}/{ch}.json`, slice to verse, render existing OriginalVerseLine/describeOriginalWord; words.json keys address files directly; honestly label numbering mismatches (Mark 16, pericope adulterae) as "nearest matching verse in the Greek edition." ProphecyRoom — optional `originalNote` + disclosure rendering OSHB and LXX lines side by side with bounded sourced notes, never settled-verdict language. Fall fragments — optional `originalText` populated by a build script from the same files.
**Why now:** SBLGNT/MorphGNT/OSHB and the Rahlfs LXX shipped in the last commits (afec478, df265c3) with a renderer proven in the reader — three worlds gain their promised depth from infrastructure bought and paid for.

### 6. Scripture allusion layer: the early writings' quotes and echoes become live doors into the hosted Bible reader
*high impact · week · [yes]*

**Visitor gets:** reading the Didache or Barnabas, quietly dotted phrases in the margin jump into the reader at the exact verse; the church road's martyrdom steps open the hosted texts they retell — five dead ends become one web.
**Mechanism:** `scripts/early/build-allusions.mjs` — exact/near-phrase match every paragraph of the 23 texts against verse data; LLM proposes paraphrase allusions gated by a deterministic n-gram-overlap verifier; human-reviewed output lands as `public/early/allusions/{textId}.json`. EarlyTextBody renders dotted marginal phrases linking to the reader. Same pass wires church road: add `seeAlso`/`textIds` to RoadStep, populate road.json (its 62 steps currently have zero internal links).
**Why now:** the ~992KB corpus is complete and hosted, the site's brand promise is that these texts quote scripture, and no text host links them at the phrase level.

### 7. One graded-claim ledger unifying the three parallel evidence vocabularies; /evidence becomes the live instrument panel
*high impact · week · [yes]*

**Visitor gets:** one browsable page shows every graded claim on the site; the same claim carries the same weight pill in every world; the Claim Lab finally runs the method it describes on the real corpus.
**Mechanism:** define `src/lib/evidence/claims.ts` — one Claim type `{id, world, text, grade (normalized 5-scale), sources[], refs[], limit}`. Build-time extraction drafts the registry from fall.json, twelve.json sent/death claims, ledger.json — AI extracts, machine checks ref/source resolution, Garo triages. Angels EvidenceNote and apostles WeightPill read from the single source. /evidence renders a browsable, grade-filterable claim index; Claim Lab becomes queries over the registry instead of six hardcoded `<details>`.
**Why now:** four worlds reinvented evidence grading into incompatible models (5 grades vs 4 lenses vs prose pills); unify while the corpus is ~110 claims, before item 8 adds records that would need re-migrating. Caveat: reconcile genuinely different grades carefully (angels 'disputed' ≠ apostles 'uncertain') — don't flatten.

### 8. Complete the survival panels and history records from the vetted NotebookLM scholarship troves
*high impact · days · [yes-with-changes]*

**Visitor gets:** the Didache's single-codex-found-in-Constantinople-1873 story and the Ascension of Isaiah's Ethiopic/Slavonic/Latin witness map appear on their pages; Tacitus is joined by Sanhedrin 43a, Mara bar Serapion, and Celsus — each dated, verbatim, bounded.
**Mechanism:** read `~/AI_Workspace/notebooklm_workspace` troves into the existing `EarlyText.survival` schema for the 14 texts missing it — `[text]/page.tsx:118-144` renders with zero code change. History records drafted from PD translations (Schaff ANF, Loeb) with a hard gate diffing excerpts character-by-character against the fetched source before merge. No UI work; WrittenWitnessCard renders as-is.
**Why now:** a vetted scholarship trove with bibliography sits on disk unused; schemas and renderers already exist — highest story-density-per-hour item on the list.

### 9. Guided reading paths on the front door: precomputed walks through the record
*high impact · week*

**Visitor gets:** the front door offers 4–6 named walks ("the last week: Mark 11–16 with his words on the map") chaining existing rooms into a start-to-finish reading — a zero-background visitor gets a path, not a directory.
**Mechanism:** build-time Node script composes paths from existing route/verse metadata into static JSON; a Paths section on StoryHome renders them, every step a plain Link — zero runtime. Copy goes through the guides' 7-panel review pattern plus Garo's triage. Pairs with the cleanup in item 12.
**Why now:** the rooms are all built; the front door's six doors are a menu with no sequence.

### 10. Grow the word studies from 6 sayings to ~50, AI-drafted against the existing tested contract
*high impact · weeks*

**Visitor gets:** kingdom parables, the I-am sayings, the woes, the Sermon antitheses each get a plain factual study — scene, Gospel parallels, scriptural roots, the Greek word behind it, and where to keep reading.
**Mechanism:** an agent script drafts WordStudy-conformant entries using only refs that resolve via parseRef; Greek lens fields auto-derived from in-house `original/{book}/{ch}.json` lemmas, replacing the STEP Bible link-outs. Garo reviews each entry before commit — the review is the gate. `jesus-words-study.test.tsx` enforces shape throughout.
**Why now:** 6 studies for 2,059 verses is the thinnest surface in the richest room; the contract and gate test already exist.

### 11. Full four-Gospel harmony on the life map with a Gospel-attestation matrix
*medium impact · weeks*

**Visitor gets:** the life map grows from 40 highlights toward ~150 pericopes; every event shows its Matthew/Mark/Luke/John attestation row, so "only John records this" is visible at a glance; disputed orderings are marked, not harmonized away.
**Mechanism:** extend LifeEvent with `sources: {book, ref}[]` (same shape as RisenAppearance) + optional `orderingNote`; LLM drafts pericope alignment from Robertson's public-domain harmony; every ref must resolve against hosted text; Garo verifies. New AttestationMatrix component reusing the AppearanceGrid pattern; era collapse or pagination since 150 events stress the single-list UI.
**Why now:** the proven format exists (AppearanceGrid), geo data is in geo.ts, and the PD harmony source is licensed and checkable.

### 12. Mechanize the pinned voice rule and bury the dead shape-shifter skeleton
*high impact · days*

**Visitor gets:** nothing visible — but the hire-me pages permanently cannot regain banned phrases or invented year-counts, and every future front-door edit stops tripping over 200 lines of corpse-copy and 1.3MB of orphaned photos.
**Mechanism:** new `scripts/check-voice.ts` in the test suite — regex ban-list over portfolio-content.ts + hire-cluster literals; a checked-in true-claims bank (AI-assisted authoring, deterministic checking — never AI at test time); drift warnings. Same pass: delete ROLES/NARRATIVE/POV/SPINE exports, `public/roles/` (1.3MB off every deploy), dead `.gv-name` view-transition CSS; fold WorldDockGate into its 8 importers; convert StoryHome to RSC with a small `<Reveal>` client island.
**Why now:** the 2026-06-27 cleanup was hand labor with zero regression guard, and the dead-engine rot is confirmed on disk, blocking every home-area polish item.

### 13. Make the site legible to AI crawlers: /llms.txt, corpus markdown mirrors, machine-readable candidate profile with evidence anchors
*medium impact · days*

**Visitor gets:** AI assistants quoting the Didache quote this site's hosted text; a recruiter's research agent opens one JSON and finds every hire-relevant claim with a link to its proof.
**Mechanism:** one `scripts/site` script walks the same sources sitemap.ts uses to emit `/llms.txt` + markdown mirrors of the hosted PD texts; extend robots.ts. A second script reads PROFILE/PROJECTS/ARC/SITE_CASE_STUDY + truth boundaries and emits `public/meta/profile-facts.json` `[{claim, evidence:[href], basis}]`, referenced from /hire JSON-LD, with a freshness test mirroring corpus-health. Navy/clearance rules apply — bank authored from verified atoms only.
**Why now:** the AI-crawler audience is the audience this transformation targets; cheapest item on the list, unblocked by everything.

### 14. Manuscript-witness lane on the early timeline: "when written" beside "when our oldest copy comes from"
*medium impact · week*

**Visitor gets:** next to each text's composition bar, a second bar shows when our oldest surviving copy was made — the gap between a text and its earliest witness, visible at a glance.
**Mechanism:** add a witness lane to TimelineItem + `public/early/timeline.json`, sourced from the same survival data as item 8 (P52, Sinaiticus, the 1873 Didache codex); Timeline.tsx's lane-packer already handles collision, so rendering is a small extension. Fix the Timeline.tsx:58 stale comment and TEXT_ERA misordering in the same pass.
**Why now:** item 8 produces the dataset this renders; the site's proven craft (WordFences, AppearanceGrid) replayed. Depends on item 8.

### 15. Single-source résumé pipeline with a drift test
*medium impact · days*

**Visitor gets:** the web page, the PDF download, and /hire quick-facts can never disagree again — one source of truth; stale copies fail CI instead of quietly drifting.
**Mechanism:** move the inline timeline out of resume/page.tsx into a single RESUME_TIMELINE export (or make ARC the source); build script renders `public/Garo-Vartabedian-Resume.pdf` via the hardened `~/job-search/make-pdf.sh` converter (timeout + watchdog, verify by output artifact — pinned guardrail), kept out of the Next build hot path. Add a hash/drift test mirroring corpus-health. Consolidate contact literals into PROFILE.links across contact/about/hire.
**Why now:** three parallel copies of the timeline exist today (ARC, inline JSX, a committed 5.7k binary PDF with no build script); the honesty brand the whole plan builds on is weakest exactly where a recruiter touches it.

## Cross-cutting themes

- The house pattern appears in five worlds independently; document it once as the canonical pipeline.
- The one shared embedding model powers items 2, 3, 5, 8 at near-zero marginal cost — do them in sequence against one generalization of `build-embeddings.mjs`.
- Zero runtime API held across the entire plan.
- Honesty made visible is the repeatable trick: evidence pills, attestation ghosts, "checked {date}" stamps, review tiers, witness lanes, half-empty maps — the plan keeps converting invisible data rigor into the thing a visitor can see.

## Rejected (flashy ideas, deliberately dead)

| Idea | Why rejected |
|---|---|
| On-device "continue your dive" personalization chips | Anything that reads as behavioral tracking on sacred text fights the reverent register; needs opt-out machinery. If wanted later, a bare text link in prefs — not a themed chip rail. |
| Seasonal verse rotation on the front door | A verse stripped of chapter context as decoration is the context-stripping the site's own method forbids. |
| Per-role hire variants (/hire/[lane]) | Three headline variants of one truth reads as marketing staging; JD-tailoring belongs in JobPilot, not the site. |
| "Ask the work" Q&A chat box on /hire | A dialog UI invites the generative slippage the voice rule exists to prevent; plain search already serves. |
| Quotation-allowance calculator for fenced translations | Legal-advice optics on a personal site; prose summaries already carry the information without the liability posture. |
| Sending-map century-attestation animation slider | Polish, not transformation; revisit after the claim-ledger work enriches the data. |
| Vision-model plate QA fleet over ~500 plates | A vision judge passing subtly anachronistic sacred art is exactly the risk it claims to catch; human spot-checks are the real gate. |
| Full multilingual site in 9 languages + cross-lingual search | Machine-translated theological vocabulary mangles meaning exactly where the site holds an honesty standard; ~120MB model; translate only after the English corpus is trustworthy (items 1, 5, 8) — translating debt is worse than admitting scope. |

## Bugs found in passing (fix alongside the plan)

1. Semantic search ignores the `?trans=` picker (WEB-only) — folded into item 2.
2. `semanticOptIn` is a module-level flag lost on reload — repeat visitors re-click the 23MB opt-in every session — folded into item 2.
3. Embedding inference runs on the main thread, blocking phones — workerize, item 2.
4. `Timeline.tsx:58` stale doc comment + TEXT_ERA misorders `apocalypse-paul` — item 14.
5. `AngelsHome.tsx` is `'use client'` while its own comment claims server-rendered — fold into item 12 cleanup.
6. Faces art runtime-hotlinks 13 museum-CDN images on a strict-CSP site — Met/Cleveland objects are public domain and commit-able.
7. `public/worlds/apostles.jpg` is the known 27KB placeholder and also serves as 3 layouts' OG image.
8. ChapterGuide empty state tells thousands of chapters a guide "is being generated" with no date or queue — an overpromise against the voice rule; retire with item 1.
9. ~2,717 guide questions have no verseRefs; guides don't link back to book briefings — item 1 gates.
10. Contact details duplicated as literals in contact/about/hire pages despite PROFILE.links — item 15.
11. Risen plates hardcoded in TSX break the plate pipeline's manifest pattern.
12. /labs iframes third-party deploys with no health check.

## Suggested sequencing

1. **Trust first (items 12, 15):** voice-rule test + dead-code burial + résumé single-sourcing. Days. The moat becomes unrotable.
2. **The big corpus fix (item 1):** weeks, batched by book, Garo diffs each batch. Everything else cites this corpus.
3. **The meaning web wave (items 2 → 3 → 5):** one `build-embeddings.mjs` generalization carries all three. Days each.
4. **Depth on existing data (items 8, 7, 6, 14):** survival panels feed the witness lane; the claim ledger precedes new records.
5. **The visible doors (items 4, 9, 13):** OG cards, front-door paths, AI-crawler legibility — the showcase surface for sophisticated visitors.
6. **Long-game depth (items 10, 11):** word studies and the full harmony, weeks each, gated by review.
