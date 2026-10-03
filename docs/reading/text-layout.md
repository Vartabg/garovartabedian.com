# Downloaded-text reading layout

The shared readers now format the hosted downloads without rewriting their source files. This is an editorial reading layout, not a reconstruction of ancient manuscript paragraphs or a newly collated edition. Production publication remains separate.

## Coverage

| Collection | Coverage | Treatment |
| --- | ---: | --- |
| Original early-writing shelf | 23 works; 778 source paragraphs | Existing chapter/paragraph anchors retained; 2,326 reading fragments and 119 marked quotation blocks |
| Hosted edition library | 88 editions; 4,511 sections; 32,446 blocks | All primary text and edition commentary use the shared formatter; 48,795 reading fragments and 2,151 marked quotation blocks |
| Scripture | Five translations; 275 book files; 5,200 chapters; 136,321 verses | Existing verse structure, numbering, edition selection, red letters and original-language alignment retained |
| Isaiah–Clement reading path | Complete hosted Clement 16, including expanded note context | Same layout; existing annotated source offsets and note links retained |
| Unpublished library records | 19 reference-only/deferred records | Remain unpublished; no import or rights decisions changed |

The edition library includes 15,219 primary-text blocks and 17,227 commentary blocks. Commentary keeps its own label and copper/dashed treatment. A quotation inside commentary is labeled accordingly; it is not reclassified as ancient text. Published catalog records that point to another hosted reader are covered by that reader rather than counted as another hosted edition.

## Formatting rules

`src/lib/reading-layout.ts`, version 1, returns exact UTF-16 slices of each source block. Concatenation reproduces the original string, including spaces, quotation marks, fragment markers and footnote syntax. It never rewrites source JSON, allusion offsets, embeddings, source hashes or review records.

- Existing paragraph boundaries remain. Blank lines create reading paragraphs; single supplied newlines stay visible. All 1,938 supplied newlines in the original shelf survive. The edition-library and Scripture downloads contain no embedded line breaks; the formatter does not invent poetic lineation for them.
- Complete double-quoted spans of at least 180 characters become labeled quotation blocks. Unbalanced/ambiguous quotes remain inline. Attached footnote markers stay with a closing quotation. No attribution, support judgment or historical connection is inferred from quotation punctuation.
- Long English prose gains reading breaks at sentence boundaries, targeting about 500 characters with at least 250 left for the next paragraph. Abbreviated names, numbered markers and immediately attached note markers are protected. Very long single sentences remain intact; this is deliberately not a maximum-length rule.
- Non-English inputs retain their supplied structure without English sentence splitting or quotation classification. Paragraph direction follows the text. No ancient-language layout quality claim is made.
- An expandable “About this reading layout” note explains which breaks are editorial. Monochrome retains quotation labels and line patterns. Formatting is server-rendered on collection pages and works without JavaScript.

The existing paragraph citation remains on its wrapper. New `-r<source-offset>` fragment anchors let the reader restore a specific place inside a long source paragraph after changing type size. Glossary terms and edition-note controls retain their original metadata. The Isaiah–Clement path preserves each annotated span, even when it crosses a reading break.

## Reproducible audit

Run `npm run reading:audit`. It visits every hosted early-writing/library block and verifies exact round trips, contiguous offsets and intact footnote markers. It also inventories every downloaded Scripture translation. It makes no network/provider request and writes no source data. The same corpus audit runs in the unit suite.

Source digest for the current catalog and audited files: `746d444a7301d102e4993260b93520fca55202ee2fc58cef24d455d93d8ff302` (ordered file paths, NUL separators and file bytes, SHA-256).

Browser coverage checks Clement 16, Enoch lineation, Gospel of Mary gaps, long Tertullian prose, edition notes, source equality, no-JavaScript output, original citation anchors, fragment navigation after a size change, enlarged type and spacing at 320/390/768/1440px, monochrome and a bounded accessibility audit. Existing shared-reader and reading-path suites remain the regression checks for themes, source notes and comparison loading.

These are engineering checks. Editorial paragraph grouping, reading comfort and comprehension still need reader feedback. No AI or paid assessment is used to format a passage.

Verification for this change passed the corpus audit, 711 unit tests, 46 smoke tests, and 41 reader/browser cases. The browser checks include all four layout widths, theme contrast, no-JavaScript reading and restoration after changing text size. Native same-document fragment entries now preserve the router’s existing state and receive separate reading bookmarks, preventing a reload from discarding the saved position on Back.
