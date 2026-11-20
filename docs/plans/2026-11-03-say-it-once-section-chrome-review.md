# Review record: Say it once, section chrome

## Reviewed

- Plan: `docs/plans/2026-11-03-say-it-once-section-chrome.md`, revision 1, against master `bba479b3` (no implementation yet).
- Reviewer: one fresh-context Claude subagent (general-purpose, no access to the planning conversation; told not to read memory or session logs). Read-only; evaluated `getNavigationCurrent` in-process.
- Completion evidence: full report returned (45 tool uses, about 6 minutes). The lead re-checked the cited lines before accepting.

## Verdict on revision 1

**Ready after blockers fixed.** Paths, names and the five `WorldHomeHero` call sites matched the source.

## Findings and dispositions

| # | Finding | Disposition in revision 2 |
| --- | --- | --- |
| B1 | "Delete the eyebrow lines and their CSS" would also hit the lower "Keep asking" label on `/scriptures`, the Apostles story-card eyebrows (shared rules), and the `WorldEntry` eyebrows. | Accepted. Only the element directly above each h1 goes; shared base rules and every `WorldEntry` eyebrow stay; only `.ap-home-hero-copy .ap-home-eyebrow` is deleted. |
| B2 | The group's place in the 4-column Menu grid was unspecified; 16 Scripture links would push the site groups below the fold; inserting into the `MENU_GROUPS` index would move `--worlds`. | Accepted. Full-width group, auto-fill columns, rendered outside the index mapping; the base link is dropped (brand link covers it). |
| B3 | Reading pages deliberately open the Menu on "From <page>" with the rest folded; an open group there undoes that unseen. | Accepted. The group goes first inside "Everything else"; added to Visible calls. |
| O4 | The Menu would repeat links (base link three times; Search/Topics on Scripture pages; two "Sources & method"). | Accepted. Base dropped; site-group links already in the section group are skipped; the section link is "Sources for <label>" with `/sources` fallback. |
| O5 | `getNavigationCurrent` marks parent and child together. | Accepted. Longest-match filter, one current link. |
| O6 | The `has-current` change was a no-op. | Accepted. Removed from the plan; logic unchanged. |
| O7 | Cleanup list incomplete (`continuity.css`, `worlds-shared.css`, more of `core.css`, the two `stories/*.css`, `eslint.config.mjs`, `.scr-hub-reading` offset); unused `source.text`. | Accepted list and the grep check. `source.text`/`hrefLabel` stay as data (separate cleanup). |
| O8 | Test notes: disputation Breadcrumb assertion, axe target, navigation specs to re-run. | Accepted. |
| O9 | The 90 px assertion is fragile and live-dependent. | Accepted. Structural check (h1 first in hero copy) plus room and reading pages; pixels reported against a local master build. |

Optional improvements not taken: none.
