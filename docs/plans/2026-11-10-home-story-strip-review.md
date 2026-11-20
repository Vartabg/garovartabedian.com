# Home page story strip: independent plan review

Plan: `2026-11-10-home-story-strip.md` · reviewed revision 1 · source baseline
`90c12172` · 2026-11-10

## Reviewer and evidence

One reviewer: a fresh-context subagent started by the lead (Claude) with no
parent conversation, read-only, asked to keep to about 15 tool calls. It read
the plan, the home page component, the shelf module, the lit-leaf component,
the hero styles, the home copy, the home page unit test, two browser specs and
the image config, and returned a report listing them. 14 tool calls, about 3
minutes.

Limitation: the reviewer is the same model family as the author. No second
pass was run; the one material finding was a missed file, fixed and covered
by running that spec.

## Findings and what was done

| # | Finding | Checked | Disposition |
| --- | --- | --- | --- |
| 1, material | `tests/e2e/discovery.spec.ts:11` clicks `a[href="#discover"]` on the home page; removing the link breaks it, and the plan's gates had no browser run. | True; the author's search had looked for the link's class and label, not its `href`. | Accepted. The spec scrolls the tools heading into view instead, and the touched browser specs are run locally. |
| 2 | `.skip-link` is absolutely positioned; inside the hero it would show at the hero's corner. | True. | Accepted. The strip's wrapper is `position: relative`; checked with real Tab focus: the link shows at the strip's top-left. |
| 3 | Axe scans the unfocused page, so the focused skip link and the lit-state text are never assessed. | True of the gate. | Accepted in part. The browser spec asserts the focused skip link is in the viewport. The strip's titles are in the lit-text halo list; their contrast over the lit leaf was looked at, not measured. |
| 4 | "Plate's top recorded" asserts nothing; "no page scroll" would pass if the list wrapped. | True. | Accepted. The spec asserts one row and `scrollWidth > clientWidth`; the plate's position is reported as a number, not asserted. |
| 5 | `.st-front-explore` sits in three selector lists, not two. | True. | Accepted; no reference remains. |
| 6 | Two comments described the removed link. | True. | Accepted; both rewritten. |

Confirmed by the reviewer as matching the source: the shelf exports, the hero
class names, that the three removed `HOME` fields have no other reader, the
image quality setting, that the lit canvas sizes itself from the hero with a
ResizeObserver, and that the `/#worlds` links elsewhere target the section,
which stays.

## Found while building, not by the review

The home page unit test holds a 520-word budget. The 27 story titles put the
page at 539 words. The budget now counts prose only and the titles are counted
apart (owner call 5 in the plan).
