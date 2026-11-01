# Reading surfaces: text first

Garo, 2026-10-29, after the chapter-reader pass shipped: "lets expand this
effort and include approach across all the text-dependant areas".

Same rule as `2026-10-29-chapter-reader-text-first.md`: on a page whose
purpose is reading, the text comes first and the tools follow it.

## Audit (375×812 phone, before)

| Page type | Text starts at | Above the text |
| --- | ---: | --- |
| Early writing (`/early/1clement`) | 1,270px | Read/Trace, help line, Reading appearance, layout note, About this writing, citation, chapter jump, illustration note, heading, plate |
| Reading path (`/scriptures/read/isaiah-53-clement-16`) | 1,276px | intro line, status line, Read/Trace, help line, Reading appearance, legend, marks note, layout note |
| Apostle story (`/apostles/stories/come-and-eat`) | 1,417px | cover art, chapter nav, Reading appearance |
| Angels story (`/angels/stories/open-his-eyes`) | 1,369px | cover art, Reading appearance, chapter nav |
| Library section (`/early/library/1-clement/1-clem-prologue`) | 891px | Reading appearance, layout note, pager, 205px edition note |
| Essay (`/jesus/history/belief-and-growth`) | 850px | Read/Trace, help line, Reading appearance |
| Library edition index (`/early/library/1-clement`) | contents at 1,690px | 663px metadata list |
| Book page (`/scriptures/protestant/LEV`) | ch. 27 at 2,566px | section descriptions between chapter rows |

## This change (shared reading surface)

- "Reading appearance" removed from every page. The site-wide Aa opens the
  same `ReadingAppearance` panel, so it was a duplicate above the text on six
  page types.
- Read-mode help lines ("Quiet reading. References stay within reach.") and
  the reading path's intro line removed. The trace explanation and legend
  appear only once Trace is on.
- "About this reading layout" and the library's "Read in this edition…" note
  moved below the text. The library section's lower pager now follows the
  text directly.
- The early-writing illustration note is now its button alone.

- The early-writing "Jump to a chapter" bar is hidden when a text has no
  numbered chapter headings. 1 Clement's "Chapter I.—" headings left it an
  empty bordered box.

Cover art on the illustrated stories is part of the story and stays.

## After (375×812 phone, dev preview)

| Page | Before | After |
| --- | ---: | ---: |
| Library section | 891px | 501px |
| Reading path | 1,276px | 876px |
| Early writing (1 Clement) | 1,270px | 1,004px |
| Essay | 850px | 761px |
| Apostle story | 1,417px | 1,300px |
| Angels story | 1,369px | 1,236px |

Trace still shows its explanation and legend once switched on.

## Not changed yet (next units)

- Book pages: chapter grid split by section descriptions.
- Library edition index: metadata before contents.
- Early writing: "About this writing" disclosure and citation above the text.
