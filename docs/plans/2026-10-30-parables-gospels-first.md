# Parables: Gospels first

Branch `claude/parables-gospels-first`. Owner request, 2026-10-29: "focus on the
parables section also, its a new production". Shown three options on
2026-10-30, he picked "B, Gospels first".

## Decisions (owner)

| Decision | Status |
| --- | --- |
| A · Tidy in place (shorter labels, same page) | Not chosen |
| B · Gospels first (early writings in one fold; early parallels folded inside each parable) | Accepted |
| C · One telling at a time (tabs per account) | Not chosen |
| The five changes below (labels, "Also in" fold, early writings fold, label said once, method fold) | Shown with phone screenshots; "Keep all" |

## Problem (live site, 375×812 phone, 2026-10-30)

- Page 28,131px, about 35 screens; 186 rows in 8 sections.
- 101 rows are early writings outside the canon: 13,038px, 46% of the page.
- "(outside the canon)" printed 170 times, already said by the section headings.
- Opening "The sower" adds 10,667px (13 screens): six tellings stacked;
  closing it means scrolling back up.

## Research used (general findings, not tests of this site)

- NN/g, "Tabs, Used Right" (2024): tabs suit content users "don't need to
  simultaneously see"; otherwise they "must repeatedly switch between tabs to
  compare". Comparing tellings is the room's job, so option C was not picked.
- NN/g, "Accordions on Mobile" (Budiu, 2015): accordions "can effectively
  mitigate the common problem of overly long pages", but long expanded content
  forces scrolling to collapse it, which the opened sower shows today.

## Design

- The Gospel sections stay as they are, in the same order.
- Row labels name who tells it: "Matthew · Mark · Luke + 3 early writings".
  The verses appear on each panel when the parable opens.
- Opened Gospel parable: its Gospel panels, then a closed fold "Also in early
  writings outside the canon" naming the writings; their panels sit inside.
- The four early-writing sections sit in one closed fold, "Early writings
  outside the canon · N passages" (the count is computed: 101 when built,
  118 after early-figures round 5 landed). Their headings and rows no longer repeat
  "outside the canon"; every panel heading still says it.
- "How this list was made" is a closed fold.
- A link or Find result to an early entry opens the fold before scrolling.

## Failure behaviour

- No JavaScript: the folds are native `<details>` and still open; the
  `<noscript>` link lists are unchanged.
- The release, accessibility and browser checks open the "Also in" fold before
  reading early panels inside a Gospel parable.

## Measured after (375×812 phone, local production build)

- Page 10,724px, 13.2 screens (was 28,131px, 34.6 screens).
- Opening "The sower" adds 6,247px, 7.7 screens (was 10,667px, 13.1).
- The early writings fold sits after the John figures; every passage and
  its links are unchanged inside it.
