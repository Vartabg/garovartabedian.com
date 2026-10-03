# Scripture data sources

All texts below are in the public domain. The eBible and TSK sources were
retrieved 2026-07-01; supplemental source records carry their own retrieval dates.

| Source | ID | URL | License |
| --- | --- | --- | --- |
| World English Bible (with Apocrypha/Deuterocanon) | eng-web | https://ebible.org/Scriptures/eng-web_vpl.zip | Public domain |
| King James Version (1769 Blayney, eBible 2006 ed.) | eng-kjv2006 | https://ebible.org/Scriptures/eng-kjv2006_vpl.zip | Public domain |
| Douay-Rheims 1899 American (Challoner) | engDRA | https://ebible.org/Scriptures/engDRA_vpl.zip | Public domain |
| Brenton Septuagint 1851 | eng-Brenton | https://ebible.org/Scriptures/eng-Brenton_vpl.zip | Public domain |
| 1 Enoch, R. H. Charles (1913) | charles/ENO | https://en.wikisource.org/wiki/The_Book_of_Enoch_(Charles) | Public domain |
| Jubilees, R. H. Charles, The Apocrypha and Pseudepigrapha of the Old Testament, vol. II (Oxford: Clarendon Press, 1913) | charles/JUB | https://www.ccel.org/c/charles/otpseudepig/jubilee/index.htm | Public domain |
| Treasury of Scripture Knowledge cross-references | tskxref.txt | https://raw.githubusercontent.com/ariseshinestudio/TSK/master/tskxref.txt | Public domain |
| Nave's Topical Bible (Orville J. Nave, 1897) | NavesTopicalDictionary.csv | https://raw.githubusercontent.com/BradyStephenson/bible-data/main/NavesTopicalDictionary.csv | Public domain (original work; see note below) |

## R. H. Charles supplements

- The existing 1 Enoch file and its attribution are retained unchanged; its
  ingestion is documented in scripts/scriptures/ingest-enoch.mjs.
- Jubilees uses CCEL's transcription of Charles's 1913 text, scanned and edited
  by Joshua Williams, Northwest Nazarene College. The printed volume is available
  at https://archive.org/details/apocryphapseudep02char .
- Jubilees preserves CCEL's wording and editorial dates. Review against the 1913
  marginal numbering and the 1917 edition's explicit numbering restored 34 verse
  boundaries and two missing verse markers; 20:9 retains the CCEL/1913 boundary.
- The prior Jubilees 17–18 comparison excerpt had omissions. Its source-reviewed
  corrections now match all 23 corresponding full-text verses exactly. See the
  [source review](https://github.com/Vartabg/garovartabedian/blob/master/docs/jubilees-source-review.md) and the
  [pinned source manifest](https://github.com/Vartabg/garovartabedian/blob/master/scripts/scriptures/sources/charles-jubilees-1913/manifest.json)
  for the evidence and boundary repairs.

## World English Bible trademark note

"World English Bible" is a trademark of eBible.org. The WEB text itself is dedicated
to the public domain. Because the text is reproduced here **unmodified** (verse text
as published, markup stripped, no edits), the name "World English Bible" may be used
to identify it, per eBible.org's usage terms.

## Processing notes

- The four eBible editions use verse-per-line (VPL) files, with pilcrows and
  extra whitespace removed. No words were added, removed, or changed.
- Bracketed words (e.g. KJV/Brenton translator-supplied italics) are kept as printed.
- eBible legacy book codes were normalized to standard USFM IDs
  (e.g. JOH -> JHN, PSX -> PS2, DNG -> DAG).
- Missing/bridged verse numbers are kept as empty-string placeholders so verse
  numbering stays aligned with the printed editions.

## Nave's Topical Bible note

Orville J. Nave's Topical Bible was first published in 1897 (Nave died in 1917); it is
in the public domain in the US regardless of any license a particular hosting repo
states for its own redistribution — a plain transcription of a public-domain work does
not create a new copyright. The CSV above is one such transcription; the topic wording
was spot-checked against biblehub.com's independent hosting of the same original text
and matches. `scripts/scriptures/build-nave.py` parses it into `public/scriptures/nave/`,
resolving Nave's own concordance shorthand (a semicolon starts a new reference clause,
which may omit the book — inheriting the last one stated — and a comma adds another
verse to the current chapter), then verifies every resulting reference against the WEB
text hosted here and drops anything that doesn't resolve (this caught roughly a dozen
genuine typos in the source, e.g. a Mark chapter number that doesn't exist).

The same discipline applies to the dictionary's internal "See X" topic-to-topic
pointers: each one is checked against the actual set of topics this build keeps,
normalizing case/whitespace and trying a comma-order swap for citations like
"PRIEST, HIGH" -> "HIGH PRIEST" (about 3,276 of 4,499 resolve this way). A "See"
that's really a footnote artifact from the 1897 print edition — a bracketed note
number, an embedded scripture reference, a "titles of PSA N" pointer — is rendered
as plain text rather than a link. Anything left that still doesn't resolve to a real
topic (about 1,223 of 4,499, roughly a quarter — mostly cross-references to entries
this particular digitization never carried over as their own topic) is de-linked to
plain text too, rather than pointing somewhere dead.
