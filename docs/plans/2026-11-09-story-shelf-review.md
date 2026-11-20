# Story shelf, slice 1: independent plan review

Plan: `2026-11-09-story-shelf.md` · reviewed revision 1 · source baseline
`ef2ccee8` · 2026-11-09

## Reviewer and evidence

One reviewer: a fresh-context subagent started by the lead (Claude) with no
parent conversation, told not to read logs or agent memory, read-only. It
returned a full report listing the files it read (the 24 on the reading list
plus 22 opened to confirm a finding). 45 tool calls, about 10 minutes.

Limitation: the reviewer is the same model family as the author. The
configured Gemini/Antigravity route was not used.

Verdict on revision 1: not ready to build. Six material findings, seven
optional. The named exports, routes, query parameters and config values all
matched the source.

## Material findings and what was done

| # | Finding | Checked against source | Disposition |
| --- | --- | --- | --- |
| M1 | The order of the 27, the 11 id-to-label pairs and the 33 tags were not in the plan, so "33", "5 for far from home" and "the order the Bible tells them" could not be met on purpose. The stated order rule was also not true. | True. Canonical order would put four sayings before Luke 2. | Accepted. Revision 2 lists all three tables and states the rule. The count line now reads "from Genesis to Acts", which is true of the order. |
| M2 | Title, reference and picture cannot be read uniformly from the five modules: the parable walk has no title, path stories have no picture field, field names differ, picture shapes differ, and every other use labels the pictures as interpretive illustrations. | True (`parable-walks.ts:13-17`, `StoryReading.tsx:126`, `src/app/angels/stories/AGENTS.md`). | Accepted. Revision 2 adds the per-module mapping, a path helper in `src/lib`, a 4:3 picture box, and one label line for the page (owner decision 6). |
| M3 | The plan did not say how data reaches the client component; importing the lib there would pull every source module into the bundle. | True. | Accepted. The server page builds plain props; the client component imports nothing from `@/lib`; the lib imports neither `jesus/server.ts` nor `story-text.ts`. |
| M4 | "Disabled until hydrated" and "read on mount" written as `setState` in an effect fail lint for new components; the cited `EarlyCatalog` precedent uses `useSearchParams` in Suspense, which would take the cards out of the static HTML. | True (`eslint.config.mjs:26-63`; Next docs for `useSearchParams`). | Accepted. Both values use `useSyncExternalStore` (precedents `FromHere.tsx`, `ParablesRoom.tsx`); `replaceState(null, …)` so Next's patch updates the router's address (`app-router.js` patch read and confirmed). |
| M5 | The tag had no type; the hosted-text helper covers only nine books; two checks could pass while the tag rule was broken (a value compared with itself; a verse not tied to its line). | True (`story-text.ts:20-30`). | Accepted. Tags are a union of five kinds; the test re-derives line and verse from the source by kind and key, reads the hosted books directly, and checks quotes on word boundaries and verses inside the story's passage. |
| M6 | The browser checks did not test Back from a story, an unknown value, the page without script, or that the seven query links open their story; "inside the first screen" had no measure. | True. | Accepted. Revision 2 adds each check and defines the first-screen rule. |

## Optional findings

| # | Finding | Disposition |
| --- | --- | --- |
| O1 | "Show all 27" and the count line were under-specified against the button standard. | Accepted. Count line always mounted; the control is conditional and returns focus to the word that was chosen. |
| O2 | New description wording was not written or on the owner's list; a third description exists in `study-catalog.ts`. | Accepted in part. The sentence is in the plan as owner decision 7. The Scriptures home question still fits and is left alone. |
| O3 | `next/image` departs from the native-image choice in three source rooms. | Kept, with the reason stated in the plan: 27 originals of 80 to 450 KB are too heavy for a phone list, and two story collections already use the optimizer. |
| O4 | The gates omitted the accessibility gate and a lock on the removed label. | Accepted in part. The accessibility gate is run for the route if the local browser gate can run. The browser-spec route list is not edited in this slice; the label removal is an owner decision still to be ruled. |
| O5 | Container and breakpoints missing; `.scr-story-list` becomes dead. | Accepted. |
| O6 | Missing structural checks; the angel routes are fixed directories. | Accepted. |
| O7 | Sequence around owner review unclear. | Accepted. `agent-task finish` pushes the branch only; merge and release wait for the owner. |

No finding was rejected as wrong.

## Remaining limitations

- Revision 2 went back to the same reviewer for one targeted check. Its
  answer: all six material findings resolved; the order list, the 33-row tag
  table and the per-module mapping match the source with no mismatch; no new
  material problem. It could not settle from the plan that `agent-task finish`
  only pushes, or that the first picture row fits the first phone screen; the
  second is measured on the built page.
- Four optional notes from that second pass. Book names: a small map lives in
  `story-shelf.ts` and the unit test compares each with the hosted file's
  `name`. First-stop pictures: accepted, nine cover stops named (owner
  decision 8). Portrait crop of `bethel-dream.jpg`: checked on the built page.
  Sayings under "stories where people were …": recorded as owner decision 9.
- The eleven situation words and the 33 pairings are editorial judgments. The
  review did not assess them, by instruction; the owner rules on them.
