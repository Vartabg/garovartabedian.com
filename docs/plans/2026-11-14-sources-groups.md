# The Sources page opens on closed groups

Date: 2026-11-14. Branch: `codex/sources-groups`. Base: `c30a052b`.

## Who it is for and what they do

Most visitors reach `/sources` from a "Sources for ..." link that points at
one group. They should land on that group, open, and see the other eight as
one short list. A visitor who arrives cold should see what the nine groups
are on one or two screens.

## Where this came from

The phone review on 2026-11-11 measured this page at about 20 phone screens.
Measured on the live site on 2026-11-14 at 390 x 844: 16,997 px, 20.1
screens, 2,141 words. Nine groups, each fully open with a "Source group"
label, a summary, a method list and records with a note apiece. The first
group started 1,119 px down, under two paragraphs and nine jump buttons.

## Options shown

Two phone mocks, made from the live page, were shown on 2026-11-14.

| Option | What the visitor does | Whole page at 390 x 844 |
|---|---|---|
| 1. Groups you open | Taps a group to see its method and records | 2.4 screens |
| 2. Short records | Scrolls every group; record notes cut, method folded | 11.3 |

Owner's pick, 2026-11-14: **"Option 1"**. Option 2 was not chosen. I said I
could not find a third option that changed what the visitor does.

## What changed

1. Each group is a closed `<details>` row: its name, its number of records
   and one line of the first three record names. It opens in place and works
   without JavaScript.
2. A link to `/sources#<group>` opens that group and scrolls to it.
3. The nine jump buttons are gone; the closed groups do that job.
4. The "Source group" label that repeated on all nine groups is gone.
5. Nothing a group says was removed: summary, world link, method and every
   record with its note are inside the opened group. A test checks this
   against the source data.

Files: `src/app/sources/page.tsx`, `src/app/styles/core.css`,
`worlds-shared.css`, `tests/sources-groups.test.tsx`,
`tests/e2e/sources-groups.spec.ts`.

## Measured, this branch (production build)

| | 390 x 844 | 360 x 780 | 1440 x 900 |
|---|---|---|---|
| Whole page | 2,000 px, 2.4 screens (was 20.1) | 2.7 screens | 1,650 px, 1.8 screens (was 12.1) |
| First group starts at | 714 px (was 1,119 px) | 775 px | 506 px |
| One group open | 3.8 screens | | 2.7 screens |

The two opening paragraphs take 369 px on a phone, so one group is whole on
the first screen at 390 px and none at 360 px. They were not changed.

## Calls not in the mock

- Group names keep the site's heading face for this page (serif italic);
  the mock drew them in bold sans.
- A group opened by hand stays open when a link opens another one.

## Owner's rulings

Shown as a before-and-after picture with the calls below on 2026-11-14.
Answer the same day: "Keep, ship it".

| Call | Ruling |
|---|---|
| Nine closed groups, each with its name, record count and a names line | Accepted |
| A "Sources for ..." link opens its group and scrolls to it | Accepted |
| The nine jump buttons are gone | Accepted |
| The repeated "Source group" label is gone | Accepted |
| Nothing a group says is removed | Accepted |
| Group names in the page's serif italic heading face | Accepted |
| A group opened by hand stays open when a link opens another | Accepted |

He was told the two opening paragraphs take 369 px on a phone and were left
alone. Not decided: whether to trim them.

## Checks

Node 24.20.0. Lint, typecheck, 1,123 unit and 67 smoke tests, production
build. Browser tests: the new Sources spec, plus the responsive and
navigation files (61 passed, 4 skipped by design). The new spec failed once
on a wrong expectation of mine and passes since. axe in light and dark at
390, 360 and 1440 px, closed and with a group open: 9 runs, no violations.
Keyboard and no-JavaScript checks. Not loaded in Safari before release;
checked on the live site. No independent plan review. Not checked on a real
phone.
