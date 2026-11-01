# Review: "From here" site menu

Reviewer: independent general-purpose agent, fresh context (no conversation
history), read-only. Reviewed revision: `claude/menu-from-here` working tree
on 2026-10-29 against `origin/master` (872f9c1d). Reading list: the plan,
`git diff origin/master`, the touched sources, AGENTS.md and the bundled
Next.js "preserving UI state" guide. The reviewer listed every file read.

| # | Finding | Severity | Disposition |
| --- | --- | --- | --- |
| 1 | "The site's own translation" was false: the shelf hosts public-domain translations | Blocker | Fixed: "Another translation"; test updated |
| 2 | The plan's rule said From here never repeats links after the text, but it does | Blocker | Rule rewritten: best connections reachable while reading; only always-on-screen controls are excluded |
| 3 | Hiding `.world-continuation` also hid "More research tools", which is not in the menu | Blocker | Fixed: only `.world-continuation .world-next` hides; tools stay; e2e checks it |
| 4 | New helper and test were untracked and the plan did not list the helper | Blocker | Plan lists `src/lib/early/from-here.ts`; both files committed |
| 5 | "Every writing from this era" overstated the era page | Optional | Fixed: "Writings from this era" |
| 6 | "The apostle" was wrong for the Pentecost story | Optional | Fixed: "The record" for that story |
| 7 | "Cross-referenced N×" hid that the list is computed by wording | Optional | Fixed: "Similar wording · cross-referenced N×" |
| 8 | A server-rendered marker removed links for no-JS readers with no menu replacement | Optional | Fixed: marker renders after mount |
| 9 | One store per page; page-wide `:has()` risk under `cacheComponents` | Optional | Documented in the plan (one per page; future risk) |
| 10 | Folded groups kept `<h2>` beside the From-here `<h2>` | Optional | Fixed: `<h3>` under "Everything else" |
| 11 | The reader bar's Aa name omitted "accessibility" | Optional | Fixed: "Aa — Reading and accessibility settings…"; tests updated |
| 12 | Missing tests: client-side navigation, empty lists, no-JS, label truth; hard-coded reading-path labels | Optional | Added a click-through test that clears From here; reading-path labels come from the packet. Empty-list chapter and no-JS e2e not added (behaviour is the existing menu) |

No blockers remain open. Reviewer agreement is not owner approval: the owner
still judges the menu by using it.
