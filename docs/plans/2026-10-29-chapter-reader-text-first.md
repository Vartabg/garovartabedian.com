# Chapter reader: text first

Garo, 2026-10-29: "navigating the text for each book is difficult and
laborious, so many unnecessary text onscreen taking away from the reader's
attention to what really matters."

## What was measured (before)

| Page | Viewport | First verse at | Next-chapter link after last verse |
| --- | --- | ---: | ---: |
| Mark 1 | 375×812 phone | 654px | 1,531px further down |
| Leviticus 16 | 375×812 phone | 1,035px (no Scripture on the first screen) | — |
| Mark 1 | 1024×768 | 484px | — |

Above verse 1 sat: Save chapter offline, a Word Bridge button with a hint
line, four study tabs (Read / Understand / Trace connections / Source), a
provenance line repeating the header, and on 167 chapters a "Before you read"
box. The reading bar wrapped "Listen" and "Worlds" onto two lines on a phone.

## Decision

The chapter text is the first thing under the chapter title. Nothing study-
related sits above it. Same rule the reader was rebuilt around on 2026-07-25
("Verse 1 is on the first screen"), which had drifted.

- Header: title, the edition name, and the breadcrumb back to the book.
  Verse count and "N questions below" removed.
- Directly after the last verse: previous / next chapter (the previous or
  next book at a book's edge).
- Below that, "Go deeper": chapter context, cheat sheet, cross-reference map,
  Word Bridge, related chapters, unseen record, parallels, and a source line
  with save-offline. The four study tabs are removed; each led to one of these.
- Removed the "tap any verse number" hint line (same kind of hint line Garo
  rejected on 2026-10-03).
- Reading bar: "Worlds" removed (the site menu already links the worlds);
  buttons no longer wrap.

## After (measured in the dev preview)

| Page | Viewport | First verse at | Next-chapter link after last verse |
| --- | --- | ---: | ---: |
| Leviticus 16 | 375×812 phone | 324px | 28px |

The reading bar keeps ←, the chapter picker, →, Listen and Aa on one 48px
line, and no longer overlaps the floating Aa control. At a book's last
chapter → opens the next book's first chapter (Malachi 4 → Matthew 1),
keeping the version when that book has it.

Verification: typecheck; lint (0 errors, no warnings in changed files);
1,002 unit tests; production build (8,315 pages); 79 browser cases across
the ten affected specs (chromium, phone, tablet), 4 intentional viewport
skips. Playwright then exited 1 on worker cleanup after all cases passed,
the same stall noted in `docs/reading/shared-reader.md`.

## Not decided / not changed

- Book pages (chapter grid split by "shape of the book" sections) — chapter
  27 of Leviticus sits ~2,566px down on a phone. Open question for Garo.
- Site-wide header and the floating Aa control.
