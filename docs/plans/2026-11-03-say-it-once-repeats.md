# Say it once: room labels and repeated lists

Branch `codex/say-it-once-repeats`, from master `9d608d16` (after PR #240, `2026-11-03-say-it-once-section-chrome.md`).

## Owner decisions

| Decision | Status |
| --- | --- |
| Next repeats after the section chrome: room labels and lists repeated inside pages | "Yes, next repeats", 2026-11-03 |
| 1. Drop the room label above the title when it repeats the header (same words, same link); drop "Scripture study" on the study tools | "Yes, all three", 2026-11-03 |
| 2. Drop the era cards on `/early`; the era filter buttons and the era headings stay | same |
| 3. Parables: the status line speaks only while searching; the group heading under the buttons is kept for screen readers only | same |
| Shown before approval: live-page mocks of all three at 390 px | shown |
| Kept on purpose: tables of contents, source links, deeper trails ("The library", "Topics", a tradition link), the Parables coverage table | proposed, not cut |

## What changed

- Room label: on every room page inside a section, the header brand already shows the section name and links to the section home. The `<p class="kicker">` that repeated it is gone from 26 room files. Where the label was a longer trail, only the repeated first part goes: `/scriptures/<tradition>/<book>` keeps its tradition link; `/scriptures/research` keeps "Local research · Experimental". `StudyPageHeader` drops "Scripture study".
- `/early`: `EarlyCatalog` no longer renders the "Jump to an era" card row. The filter buttons do the same job, and each era section keeps its heading, date range and "Open this era" link. The library's own collection nav (`/early/library`) is untouched and keeps the `.ew-era-nav` styles.
- Parables: `ParablesSearch` no longer takes `shown`; its `role="status"` line stays in the page (so screen readers hear search results) but is empty until a search runs, and collapses when empty. The visible group headings (`#parables-stories` and the rest) are visually hidden by CSS; they still label their sections.

## Checks

- `tests/e2e/worlds-responsive.spec.ts`: room pages have no leaf element above the title that repeats the header brand or says "Scripture study"; `/early` has the era filter group, no jump nav, and four era headings.
- `tests/jesus-parables.test.tsx`: the status line is empty before a search and the Stories heading is still in the page.
