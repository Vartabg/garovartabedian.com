# Engineer lens, unit 2: the eight section homes

Branch `codex/section-homes-xray`, from master after PR #236 (the chapter-reader unit, live 2026-11-02). Plan revision 2 (after independent review; see `2026-11-02-engineer-xray-section-homes-review.md`).

## Owner decisions

| Decision | Status |
| --- | --- |
| Engineer mode annotates pages in place with facts computed from their own data; Reader is untouched (unit 1, `2026-11-02-engineer-xray.md`) | Live |
| Section homes are the next page kind | "Section homes", 2026-11-02 |
| One tag per home, placed above the home's content, saying what the world is built from | "Keep, ship it", 2026-11-02 |
| Exact wording and screenshots | Shown; "Keep, ship it", 2026-11-02 |

## Goal

With Engineer on, each of the eight world homes (`/scriptures`, `/jesus`, `/apostles`, `/early`, `/church`, `/word`, `/angels`, `/evidence`) carries one tag, **Built from**, whose facts are counted from the data the home already loads, plus one standard line from the site snapshot: how many generated files sit under that world's public folder and how many scripts in its script folder write them (or "edited by hand; no build script" when there are none). The foot from unit 1 is already on these pages.

## Facts per home (all computed; today's values shown so the reviewer can check them)

| Home | Source already loaded by the page | Facts |
| --- | --- | --- |
| `/scriptures` | `CORPUS_HEALTH` (`src/lib/site/corpus-health.ts`) | 86 hosted books · 5 traditions · 5 translations · 1,586 chapter slots · 376,117 cross-reference targets from 29,055 verses · 5,319 topics. Detail: guides 737 agent-reviewed, 0 human-reviewed, 849 untracked. |
| `/jesus` | `public/jesus/life-lenses.json` | 40 moments · 18 places · 6 eras |
| `/apostles` | `getTwelve()`, `getSent()` | 13 records: the Twelve and 1 chosen later · 4 New Testament lists · 10 sendings placed on the map, 3 unplaced · 15 cities · 9 routes |
| `/early` | `EARLY_TEXTS`, `getEarlyTimeline()`, `getLibrary()` (`src/lib/early/library-server.ts`) | N shelf texts · 33 dated items on the timeline · 123 library editions of 112 works · 4,114,119 source words · 118 editions carry a source checksum, 5 do not |
| `/church` | `getChurchRoad()`, `churchSpineForks()`, `public/church/road-links.json` | 9 eras · 62 steps on the road · 4 forks from the tree · checked links on 8 steps: Scripture on 5, hosted writings on 3 (counted from each step's `refs` and `textIds`). Detail: the `method` sentence from `road-links.json`. |
| `/word` | `getWordData()` | 26 translations in the ledger, 23 researched, 3 placeholders · 13 fenced, 10 free · 27 sources · 5 hosted here |
| `/angels` | the `stats` object `page.tsx` already computes | fall fragments · appearances · confrontations · named source entries (the page's own words; it never counts "demons") · vocabulary terms and occurrences |
| `/evidence` | `getEvidenceData()`, `getClaimRegistry()` | 50 claims in the registry · attestation 27 (late 13, early 11, scripture 3) · textual 23 (explicit 12, inferred 6, disputed 4, extra-canonical 1) · 8 rooms · 7 claim-lab cases · 9 sources. Each axis keeps its own grade vocabulary. Detail: `generatedBy` from the registry. |

Standard detail line, from `site-xray.json` (new `worlds` field): JSON files under `public/<world>` (recursive) and script files (`.mjs`, `.js`, `.ts`, `.py`, `.sh`, recursive) under `scripts/<world>`. Manifests and data inside the script folders are not counted. The committed snapshot carries today's values.

The standard line says only what was counted: "N JSON files published under its public folder; N script files under its scripts folder", or "no scripts folder of its own" when `scripts/<world>` does not exist. It never infers "edited by hand": `/evidence` has no folder of its own, yet its registry is written by `scripts/site/build-claims.mjs`, which the same tag's detail line says.

Unflattering numbers stay: 3 placeholder ledger entries, 5 editions without a checksum, two worlds with no scripts folder of their own.

## Data contract

- `scripts/site/build-site-xray.mjs` gains `worlds: Record<id, { publicJson: number; scripts: number }>` for the eight world ids, counted from the file system like the other counts. Same allowlist, same `deepEqual` snapshot test. `src/lib/site/site-xray.ts` types it.
- `src/lib/site/world-xray.ts` (pure, no node imports): one fact builder per world taking the already-loaded data and returning `{ facts, detail }`, and `worldXrayTag(id, built)` that appends the standard line and returns an `XrayTagSpec` with `id: "world"`. `XrayTagSpec.id` widens from the chapter union to `XrayTagId | "world"`; `ChapterXrayTags` keeps its keys.
- Each home's `page.tsx` renders `<XrayTag {...tag} />` as the first child of its returned tree, immediately before the home's content. A home's tag describes the page, not one region: four homes open with a hero fragment, so the unit-1 outline rule is switched off for `data-xray="world"` tags (`discovery.css`), and the browser spec asserts the sibling after the tag has no outline. The tag is centred at the content width and keeps the site's mono tag type even where a world restyles every `p`. `/early/page.tsx` becomes `async` to await `getLibrary()`; `next.config.ts` traces `content/early-library/catalog.json` for `/early` as insurance against a future `revalidate`.

## Implementation notes

- The reading-mode paragraph rule in `src/app/styles/reading.css` (`body .reading-narrative p:not(...)`) outranks the tag's type rule on every world home wrapped in `ReadingNarrative`; `.xray-tag p` is added to its exclusion list, next to `nav p` and `header p`, so the tag keeps the site's mono tag type. Found in the first screenshots, not by the reviewer.
- Screenshot check (acceptance 4) done against the live site on `/scriptures`, `/church` and `/word` in Reader at 390 and 1280 px, light and dark: 0 changed pixels in all twelve. `/angels` was not used for the comparison because its story card's reveal animation is caught at different frames between runs.

## Failure behaviour

| Situation | Result |
| --- | --- |
| `site-xray.json` stale | `tests/site-xray.test.ts` fails on `npm test` (unchanged guard). |
| A world folder missing | Count 0; the standard line says "no build script" or "no generated files"; never a crash. |
| A number drifts from the data | Impossible by construction; `tests/world-xray.test.ts` recomputes each fact from the JSON. |
| Reader mode | Unchanged: tags are `display: none` without the lens attribute. |

## Affected files

- New: `src/lib/site/world-xray.ts`, `tests/world-xray.test.ts`, `tests/e2e/section-homes-xray.spec.ts`.
- Changed: `scripts/site/build-site-xray.mjs`, `public/meta/site-xray.json`, `src/lib/site/site-xray.ts`, `src/lib/scriptures/xray-types.ts`, the eight `src/app/<world>/page.tsx`, `scripts/a11y/config.mjs` (adds `/scriptures#lens=engineer`), `tests/a11y-runner.test.ts` (74 → 75), `tests/site-xray.test.ts` (worlds field), `scripts/check-voice.ts` (adds `world-xray.ts`).

## Acceptance checks

1. Unit: for each world, the fact builder's numbers equal counts recomputed from the same JSON in the test; the standard line matches `site-xray.json`.
2. Browser: each of the eight homes shows exactly one visible `.xray-tag[data-xray="world"]` under Engineer, none under Reader, with no horizontal scroll at 390 px.
3. Accessibility: `test:a11y` with `/scriptures#lens=engineer` added (75 routes).
4. Reader regression: screenshots of `/angels` and `/scriptures` in Reader at 390 and 1280 px differ by 0 px from the live site.
5. Shown to the owner before commit: the eight tags' wording and screenshots.
