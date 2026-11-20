# Engineer lens: the page x-rays itself

Branch `codex/engineer-xray-plan`, from master `f6591f99`. Plan revision 2 (after independent review; see `2026-11-02-engineer-xray-review.md` beside this file).

## Owner decisions

| Decision | Status |
| --- | --- |
| The site serves engineers who are hiring first; the Scripture content stays as the body of work | Accepted 2026-10-31 |
| Proof on the portfolio must be working things built from real data, not sentences | Accepted 2026-10-31 |
| The Reader / Engineer toggle becomes an in-place x-ray: the page stays, and Engineer annotates each region with where its data came from and how it was checked (shown as a Mark 4 mock) | "Yes, plan it" 2026-11-02 |
| Six visible decisions (first unit = foot + chapter reader; six tags; generic strip removed; unflattering numbers stay; no URLs or paths leave the build; Reader untouched) | Shown 2026-11-02, answer pending |
| In Engineer mode the tags sit above their region, so content moves down; Reader stays pixel-identical to today (review blocker B3) | Proposed, owner to confirm |
| Exact tag wording, the foot sentence, and screenshots at phone and desktop | To be shown to the owner before commit |
| Independent plan review before building | Done (revision 1 reviewed; this is revision 2) |

## Problem

The Engineer lens today (`src/app/_components/DiscoveryLens.tsx`) shows one generic sentence per route family from `engineeringNote()` in `src/lib/discovery-content.ts` ("Hosted chapter data, original-language resources, and reading controls meet here…") plus a link to the case study. It describes the site in words. Nothing on the page itself changes, so a visitor cannot tell what is real.

## Goal

With Engineer on, every content region of a page carries a short tag with facts computed from the data that built that region. The foot of every page says how the page reached the visitor. With Reader on, the page is exactly as today: same DOM order, same pixels.

Facts only. No adjectives, no first person. When a number is unflattering (0 human-reviewed chapter guides; 2,370 Word Bridge links in Mark that need review) it is shown as is.

## Scope of this unit

1. **Site foot** (`XrayFoot`): on every page, replacing the current `engineering-notes` aside.
2. **Chapter reader tags** (`/scriptures/[tradition]/[book]/[chapter]`; `generateStaticParams` over `canons.json` yields 6,838 pages today): six tags, one per region, listed under Rendering.

Later units apply the same component to the other page kinds (section homes, shelves, side-by-side readers, records, maps, search and tools, the case study). Each is its own plan and merge. The tool cards on the home desk keep their `lens-engineer-copy` until the tools' own unit.

Not in scope: the stacked header bars above content (a separate decision), any change to Reader mode, any new build script beyond the one below.

## Data contract

Three sources. Nothing in a tag is hand-typed.

### A. Site facts: `public/meta/site-xray.json`

Written by a new `scripts/site/build-site-xray.mjs` (exporting `collectSiteXray()`), added to `prebuild` after `data:health` and as `data:xray`. Committed, like `corpus-health.json`.

```json
{
  "schemaVersion": 1,
  "counts": { "buildScripts": 34, "publicJson": 7672, "unitTestFiles": 156, "browserSpecs": 58, "smokeChecks": 16 },
  "routeTests": { "chapter": ["scripture-study.spec.ts", "shared-reading.spec.ts"], "home": ["navigation.spec.ts"] },
  "sources": {
    "web": { "label": "World English Bible", "origin": "eBible.org", "retrieved": "2026-07-01", "license": "Public domain", "unmodified": true },
    "charles": { "label": "R. H. Charles (1913)", "byBook": { "ENO": { "origin": "Wikisource" }, "JUB": { "origin": "CCEL" } }, "license": "Public domain" }
  }
}
```

- No date stamp in the file. `prebuild` regenerates it during `Build production locally`, and `Check generated source` fails on any diff, so the file must be a pure function of the repository. A unit test (`tests/site-xray.test.ts`) does `deepEqual(snapshot, collectSiteXray())`, the same guard `tests/corpus-health.test.ts:12` gives `corpus-health.json`, so a stale file fails `npm test` before any release.
- `counts` come from the file system: `scripts/**/build-*.{mjs,ts}`, `public/**/*.json`, `tests/*.test.{ts,tsx}`, `tests/e2e/*.spec.ts`, `scripts/smoke/*.test.mjs`.
- `routeTests` maps a route family to the browser spec basenames that contain a literal path of that family. Families and their path patterns live in one table in `src/lib/site/xray-families.ts`, shared with the client. The `home` family matches only the exact literal `"/"` inside `goto(`; every other family matches its path prefix. A spec that names no family is not listed.
- `sources` is a typed table in `src/lib/scriptures/sources.ts`, one row per key of `canons.translations` (`web`, `kjv`, `drb`, `brenton`, `charles`); `charles` carries `byBook` rows because `SOURCES.md` lists 1 Enoch and Jubilees separately. The retrieval date for the four eBible rows is the single date stated in `public/scriptures/SOURCES.md` line 3; Charles rows have none. A smoke test asserts every `canons.translations` key has a row and every row's `origin` word appears in `SOURCES.md`.
- **Allowlist, fail closed.** Every string in the file must match `^[A-Za-z0-9][A-Za-z0-9 .,:/()'-]{0,79}$`, contain no 7+ character hex run, no `/Users/`, no `http`. File names are allowed only as basenames. A violation throws, so `prebuild` fails and nothing is uploaded. No URLs leave the builder; the Sources page (`/sources`) already links the origins.

### B. Page facts, computed where the page already loads its data

For the chapter reader, `page.tsx` already loads text, guide, neighbours and briefing, and already computes `originalTranslations`. Add to `src/lib/scriptures/server/` (re-exported by `server.ts`):

- `getChapterXrefSummary(bookId, chapter)`: reads `public/scriptures/xref/{BOOK}.json`, counts `refs` keys that start with `${chapter}:` and the links under them. Mark 4 today: 41 verses with references, 570 links.
- Original: reuse `getOriginalChapter` (`server/originals.ts:95`) with the first of `originalTranslations`; `null` when `originalTranslations.length === 0`. Returns `{ edition, verses }`. Mark 4: `sblgnt`, 41.
- `getBridgeSummary(bookId, chapter)`: reads `public/scriptures/bridge/{BOOK}/{chapter}.json` (`RawChapter` in `src/lib/scriptures/word-bridge.ts:62`). Per link, `RawLink[2]` indexes `STATUS_CODES = ["ok", "plain", "flag"]` (`src/lib/scriptures/bridge-verdicts.mjs:10`). Per verse, `sources[n]` is `"c"` (drafted by AI models, checked against the dictionaries) or `"e"` (eBible Strong's tags), with the words from `SOURCES` in the same file; a verse with no entry is counted as neither. Returns `{ verses, links, ok, plain, flag, drafted: { ai, ebible, none } }`. Mark 4 today: 41 verses, 691 links, 615 ok / 39 plain / 37 flag, drafted 39 ai / 0 ebible / 2 none. Book totals (`public/scriptures/bridge/index.json`, `books.MRK`: 14,205 words, 13,395 linked, 7,557 ok, 1,677 plain, 2,370 flag) go in the tag's expandable detail. The tag uses the display words already in `bridge-verdicts.mjs` (`explain()` and `SOURCES`), never the raw codes.
- Guide: `getChapterGuide` returns `null` for template guides (`server/guides.ts:37`). The tag distinguishes "not published (template)" (a guide file exists, `isTemplateGuide` true) from "no guide file", using the same check `ChapterGuide.tsx:42` uses for its badge. For a published guide it reads `questions.length`, `reviewStatus`, `reviewedAt`, `reviewer` (Mark 4: 10, `agent-reviewed`, `2026-08-25`, "agent editorial panel (7-pass review, 2026-08-24)"). Site-wide review counts come from `CORPUS_HEALTH` in `src/lib/site/corpus-health.ts` (today 737 agent-reviewed, 0 human-reviewed, 849 untracked, 829 on the batch template) and appear in the tag's detail.
- Text: `verses.length` is the number of verse slots in the hosted WEB chapter (missing verses are kept as empty strings per `SOURCES.md` processing notes); the tag says "verse slots" when any slot is empty, "verses" otherwise.

These compose one `ChapterXray` object passed to `ReaderClient` as a prop:

```ts
type ChapterXray = {
  text: { translation: string; verses: number; emptySlots: number };
  original: { edition: string; verses: number } | null;
  bridge: { verses: number; links: number; ok: number; plain: number; flag: number; drafted: { ai: number; ebible: number; none: number } } | null;
  xref: { verses: number; links: number };
  neighbours: { count: number; top: { book: string; chapter: number; shared: number } | null };
  guide: { kind: "published"; questions: number; status: string; reviewedOn: string | null; reviewer: string | null } | { kind: "template" } | { kind: "none" };
  unseen: { entries: number; terms: number };
};
```

### C. Release record, inlined at build time

The root layout wraps ISR routes (`revalidate = 86400` on chapter and topic pages), so nothing in the layout may read `.release-record/record.json` from disk at render time: a Vercel function would not have the file traced and daily regeneration would throw. Instead:

- `next.config.ts` reads `.release-record/record.json` at build start (same guard as `release-record-data.ts`: throw when `VERCEL_ENV === "production"` and the file is absent; `null` otherwise) and sets `env.RELEASE_RECORD_SUMMARY` to a JSON string `{ "attempts": N, "steps": ["Scan source secrets", …] }`, where `attempts` is `attempts.length` and `steps` are the names in the latest `live` attempt's `ran` order (not the first-seen dictionary, which includes renamed steps). The string passes the release-record allowlist already enforced on step names.
- `XrayFoot` reads `process.env.RELEASE_RECORD_SUMMARY`, which Next inlines at build. With a record it shows "N earlier release attempts are recorded. Each one runs this gate:" followed by the step names; without one it shows "Local build; no release record."
- The case-study page keeps its own full-record loader unchanged.

## Rendering

- `XrayTag` (`src/app/_components/xray/XrayTag.tsx`, server-safe): `<p className="xray-tag">` with a bold label, facts separated by middle dots, and an optional `<details>` for file basenames and site-wide numbers. Always in the DOM; CSS shows it only under `html[data-site-lens="engineer"]` (the `.lens-engineer-copy` pattern in `discovery.css:13-15`). Reader mode therefore has no layout change and no hydration difference.
- `XrayFoot` (`src/app/_components/xray/XrayFoot.tsx`, client, because it needs `usePathname()` to pick the route family): heading "How this page reached you", the site counts, the browser specs for this family, the release line, and a link labelled "Full release record" to `/work/garovartabedian`. Rendered in `layout.tsx` after `{children}` and before `<ReadingNavigation />` (`layout.tsx:317-324`), always in the DOM, CSS-gated like the tags, and carrying `data-release-attempts="N"` when a record exists. `DiscoveryLens` loses its `aside` and the `aria-controls` on the Engineer button; `engineeringNote()` is deleted; `researchToolForPath` stays for the home desk.
- Chapter reader tags, in `ReaderClient.tsx`, each placed immediately before its region and rendered even when that region's component returns `null`:
  1. **Text**, before the verse `<article>` (`:768`).
  2. **Original and Word Bridge**, before the `.scr-chapter-source` block (`:967`), where "Show the original language" lives.
  3. **Cross-references**, before `<div id="connections">` (`:918`).
  4. **Chapter guide**, before `<ChapterGuide>` (`:908`).
  5. **Read next to it**, before `<ChapterNeighbours>` (`:947`).
  6. **Angels index**, before `<UnseenRecord>` (`:956`).
- In Engineer mode a region gets a 1px outline in the x-ray colour and its tag above it at every width; on wide screens the tag may sit in the left margin. Content below a tag moves down in Engineer mode (owner decision above). Two new colour tokens in `src/app/styles/core.css`; a unit test computes the WCAG contrast ratio of each against both page backgrounds and asserts at least 3:1.
- Styles live in `src/app/styles/discovery.css`. No new fonts; tags use the existing `--font-mono` (`globals.css:24`).
- `data-site-lens` is set in `useEffect` (`DiscoveryLens.tsx:13`), so on reload the tags appear after hydration; that is accepted.
- Copy rules: labels are the six nouns above; facts are values; no first person; the words "structure" and "digestible" do not appear. The final wording list is shown to the owner before commit.

## Failure behaviour

| Situation | Result |
| --- | --- |
| `site-xray.json` stale or missing | `tests/site-xray.test.ts` fails on `npm test`; the release stops at `Unit and smoke tests`. If it still reached the build, `Check generated source` fails on the regenerated diff. |
| A string fails the allowlist | The builder throws; `prebuild` fails; nothing is uploaded. |
| A per-chapter file is absent (no original, no bridge, no guide) | The summary returns `null` or `kind: "none"`; the tag states the absence. No crash, no blank. |
| Guide file exists but is a template | Tag says "not published (template)", matching the reader's own badge. |
| Release record missing in a production build | `next.config.ts` throws at build start; the release stops at `Build production locally`. Locally the foot says "Local build; no release record". |
| ISR regeneration or on-demand chapter render | Reads nothing from disk for the foot; the summary is inlined. No new failure path. |
| A count in a tag drifts from the data | Every number is computed at build or render from the same files the region renders. The browser check compares the rendered Cross-references number with the JSON. |
| Lens toggled with a screen reader | The toggle keeps focus; tags are ordinary text read in order. No `aria-live`. |

## Affected files

- New: `scripts/site/build-site-xray.mjs`, `src/lib/site/xray-families.ts`, `src/lib/scriptures/sources.ts`, `src/lib/scriptures/server/xray.ts`, `src/app/_components/xray/XrayTag.tsx`, `src/app/_components/xray/XrayFoot.tsx`, `public/meta/site-xray.json`, `tests/site-xray.test.ts`, `tests/chapter-xray.test.ts`, `tests/xray-contrast.test.ts`, `tests/e2e/engineer-xray.spec.ts`, `scripts/smoke/sources-table.test.mjs`.
- Changed: `package.json` (`prebuild`, `data:xray`), `next.config.ts` (`env.RELEASE_RECORD_SUMMARY`), `src/lib/scriptures/server.ts` (re-exports), `src/app/scriptures/[tradition]/[book]/[chapter]/page.tsx` and `ReaderClient.tsx` (prop and six tags), `src/app/_components/DiscoveryLens.tsx` (aside and `aria-controls` removed), `src/app/layout.tsx` (foot), `src/lib/discovery-content.ts` (`engineeringNote` removed), `src/app/styles/discovery.css`, `src/app/styles/core.css` (tokens), `scripts/check-voice.ts` (two new files in `PORTFOLIO_SOURCE_FILES`), `scripts/a11y/config.mjs`, `scripts/a11y/worker.mjs`, `tests/a11y-runner.test.ts`, `scripts/release/check-release-record.mjs`, `tests/release-record.test.ts`.
- Existing tests that change because of this: `tests/discovery.test.ts:4,14,32-33` (drop the `engineeringNote` assertions; keep `researchToolForPath`); `tests/e2e/discovery.spec.ts:14-42,111` (assert `.xray-tag` visibility and the foot heading instead of `#engineering-notes`); `tests/release-record.test.ts:96-98` (`checkReleaseRecord` gains the chapter page); `tests/a11y-runner.test.ts:50` (route count 72 → 74).

## Accessibility pass mechanism

Routes in `scripts/a11y/config.mjs` are unique plain strings (`pool.mjs:8-9` throws on duplicates), `runAxe` in `worker.mjs:50-54` has no storage preset, and Lighthouse runs with all storage cleared. Add two routes with the suffix `#lens=engineer`: `/#lens=engineer` and `/scriptures/protestant/MRK/4#lens=engineer`. `worker.mjs` strips the suffix for navigation and, when present, calls `context.addInitScript` to set `localStorage["garovartabedian:lens:v1"] = "engineer"` (key from `src/lib/discovery-lens.ts:2`) before `goto`, for both colour schemes. The Lighthouse pass stays Reader.

## Acceptance checks

1. Unit: `collectSiteXray()` equals the committed `site-xray.json`; the allowlist rejects `/Users/x`, a 40-hex string, and `https://`.
2. Unit: for Mark 4 the summaries return text 41 verse slots with 0 empty; xref 41 verses and 570 links; original `sblgnt` with 41 verses; bridge 41 verses, 691 links, 615 ok / 39 plain / 37 flag, drafted 39 ai / 0 ebible / 2 none; neighbours 6 with Matthew 13 sharing 50; guide published, 10 questions, `agent-reviewed`, `2026-08-25`; unseen 0 entries, 1 term. The test reads the same JSON, so it fails when the data changes, which is the point.
3. Smoke: every key of `canons.translations` has a row in `sources.ts`; each row's `origin` appears in `SOURCES.md`.
4. Browser (`tests/e2e/engineer-xray.spec.ts`), on `/scriptures/protestant/MRK/4`: in Reader no `.xray-tag` is visible and the foot is hidden; after clicking Engineer, six `.xray-tag` are visible and the foot heading is visible; the Cross-references tag's number equals the count the test computes from `public/scriptures/xref/MRK.json`; after reload, once `html[data-site-lens="engineer"]` is set, the tags are visible again; clicking Reader hides all; no tag overlaps its region's bounding box.
5. Reader regression: a screenshot of `/scriptures/protestant/MRK/4` and `/` in Reader at 390 px and 1280 px, light and dark, differs by 0 px from the same shots on `master` (`toHaveScreenshot` baselines captured from master in the same spec).
6. Accessibility: `test:a11y` passes with the two `#lens=engineer` routes added.
7. Release: `Verify release record` also reads `.next/server/app/scriptures/protestant/MRK/4.html` and fails unless it carries `data-release-attempts="<N>"`.
8. Voice: `npm run voice:check` covers both new components.
9. Shown to the owner before commit: the wording list and screenshots of Mark 4 in both modes at phone and desktop widths.

## Implementation notes (branch `codex/engineer-xray`)

Where the build departed from the text above, and why. None changes a reviewed decision.

- The source table lives only in `src/lib/scriptures/sources.ts`; it is not copied into `site-xray.json`. The chapter page reads it directly, so one copy instead of two. Its guard is `tests/sources-table.test.ts` (unit, not smoke, because the table is TypeScript).
- The page-kind table is `src/lib/site/xray-families.mjs` (JavaScript with JSDoc), so the build script and the client import the same file, as `bridge-verdicts.mjs` already does. Specs are classified by the literal paths in their source, with each path matched by the same table the client uses.
- The six tags are worded on the server (`chapterXrayTags` in `src/lib/scriptures/xray-tags.ts`) and passed to `ReaderClient` as text, so the client bundle carries no corpus-health import. `ChapterXray` stays the typed contract (`src/lib/scriptures/xray-types.ts`).
- The region outline uses the adjacent-sibling rule `.xray-tag + *`, since every tag is placed immediately before its region; no child component needed a new attribute.
- The release summary is read by `next.config.ts` through `src/lib/site/release-summary-node.ts`; the pure parser in `release-summary.ts` has no node imports so the client foot can use it.
- The chapter release check is the third argument of `checkReleaseRecord`, kept optional so the existing test still holds.
- Owner's calls on 2026-11-02 ("Build it"): content moves down in Engineer; the foot shows on the home page; the Word Bridge tag uses the checker's own words (supported, other, need review).

## Questions put to the owner, and the answers

Asked 2026-11-02 with the plan; answered "Build it" the same day, taking the recommendation on each:

- Content moves down in Engineer mode (tags above regions); Reader stays identical.
- The foot shows on the home page as well as inner pages.
- The Word Bridge tag uses the checker's own summary words (supported, other, need review) and names the drafting source.

Still to show before commit: the final tag wording as rendered on Mark 4, and screenshots in both modes at phone and desktop widths.
