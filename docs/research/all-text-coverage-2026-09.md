# Find and reading coverage across hosted texts

Preview work on `codex/jev-research`, September 26, 2026. Production publication is separate. No paid Jev requests or new model assessments are part of this change.

## Scope and behavior

- Scripture: the shared wording engine already searches all five hosted editions independently: WEB (81 books), KJV (66), Douay–Rheims (73), Brenton (53), and Charles (2). A result's edition is never replaced by another edition's text.
- Writings: the expanded library now uses the same phrase/negation evidence as Scripture. The index contains **33,332 entries**: 32,446 hosted library blocks, 778 original-shelf paragraphs, and 108 catalog records. Catalog records include 19 reference-only/deferred entries; their unavailable source text remains unavailable.
- Find's nav popup retrieves bounded writing excerpts alongside Scripture. `/scriptures/search` has an **Other writings** disclosure with the same results and a link to the full server-rendered writings search. `/early/search` retains its native GET form, edition/content-kind filters, and pagination.
- Complete phrases lead scattered word overlap, and contraction equivalents are labeled separately. Source phrases are checked within individual paragraphs or notes. No phrase can be invented by joining nonadjacent text around commentary. Case, accents and punctuation are folded only for matching; displayed source strings are untouched. Negation is retained and differing wording is labeled without asserting semantic agreement.
- Each writing hit pins its actual edition and an existing paragraph/note anchor. Return links preserve the original search, Scripture edition/scope or writing edition/content-kind/page. Catalog records remain identifiable as metadata, and historical notes remain identifiable as commentary.
- Optional general-vocabulary suggestions carry writing filters forward. They do not silently rewrite questions, particularly negated questions.

## Reading layout

The earlier lossless paragraph/quotation formatter remains in place for all 23 original works and 88 hosted library editions (4,511 sections). Scripture's former continuous flow joined whole chapters into a single block. It now groups **unchanged verses** into shorter reading units, preferring terminal punctuation after roughly 500 characters and using verse boundaries when a run reaches 1,000 characters. Very short tails stay with their preceding group. These are editorial spacing choices, not reconstructed ancient paragraphs or new interpretations.

New visitors receive the flowing reading layout. Valid saved verse-per-line preferences are retained, including an explicit `false` in `scr:easy`. Poetry/wisdom collections (Job, Psalms, Proverbs, Ecclesiastes, Song of Songs, Lamentations, Wisdom, Sirach, Odes and Psalms of Solomon where hosted) retain verse lines. Supplied lineation and gaps remain distinct. Original-language and translation-comparison views retain verse alignment. Every public verse ID and verse tool is retained. The layout note and reading settings explain these choices.

The full round-trip audit covers **275 book files, 5,200 chapters and 136,321 verses**, plus every downloaded writing block. It yields 51,798 Scripture reading groups. The combined hosted-source SHA-256 remains `746d444a7301d102e4993260b93520fca55202ee2fc58cef24d455d93d8ff302`, unchanged from the preceding formatting release. No hosted source, semantic corpus, public claim, or allusion file is rewritten.

## Diagnostic evidence and limits

Run `npm run research:find:all-text-benchmark`. It uses the existing benchmark's development queries plus the previously reported diagnostics: **58 queries**, each checked across all five Scripture editions (290 Scripture observations) and the full writings library. The compact observations are in [all-text-coverage-2026-09.json](all-text-coverage-2026-09.json); the full run stays in the ignored `.research/search-benchmark/all-text/` directory.

Examples:

| Query | Prior writings search | Current writings search |
| --- | --- | --- |
| love your enemies | Lightfoot 2 Clement 13, whole section | Same edition, exact matching paragraph `#p4`, Complete phrase |
| light of the world | First matching indexed section in import order | Individual phrase-bearing paragraphs ranked before overlap; Irenaeus IV.7 `#p3` first in this run |
| do not be afraid | Philo, Virtues VII, whole section | Same edition at `#p1`, with negation retained |
| loneliness | No literal match | Still no word match; related-word actions and explicitly limited meaning-search routes are available |

Old result counts are section-based, while new counts are block-based, so counts cannot be interpreted as improved recall. These are engineering diagnostics, not independently adjudicated relevance judgments. No human labels were invented; accepted labels and provider operations are both zero. The previously exposed held-out `lookup-02` group remains unsuitable for an untouched held-out evaluation. The adoption gate has not been evaluated or passed.

The local diagnostic index initialized in about one second, with warm query times around 146 ms median and 657 ms maximum in this run. These are single-machine measurements, not production performance promises. The Node process indexes source blocks once, limits simultaneous file reads to 16, and returns at most 30 snippets; the popup asks for four. The client debounces requests and cancels stale ones. The API does not accept source paths, use credentials, create visitor sessions, call providers, or publicly cache query responses. A failed index load is an explicit error and can be retried.

Meaning search remains limited to its verified editions: WEB Scripture and the original 23 writings. The expanded editions have wording search, not new embeddings or fabricated AI coverage. Everyday themes can still have weak retrieval; lexical overlap, negation presence, or semantic similarity is not evidence of quotation, influence, agreement or claim support. Existing hosted assessments, visitor limits, privacy controls and unreviewed/editorial status are unchanged.

## Verification

The production build and 100 focused browser checks passed, with three intentional phone-only skips. These cover the existing reader/source-note/navigation suites as well as the new collection search and all five Scripture editions. The new ten-case suite was rerun against the final build to verify same-origin preview authentication, enlarged text and mobile filter reflow. The repository lifecycle gate runs lint, typecheck, unit/smoke tests and both secret scans before the feature push; see the PR for final counts and the protected preview. New checks cover every source block/anchor, phrases beyond pagination, cross-block false phrases, Unicode snippets, negation, content-kind filtering, bounded API responses, filter-preserving return links, all five reading editions, saved verse layout, poetry, aligned comparisons, no-JavaScript reading/search, mobile reflow and bounded accessibility. Engineering checks do not establish improved comprehension; reader feedback is still needed.
