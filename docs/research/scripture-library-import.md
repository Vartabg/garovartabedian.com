# Scripture and early-writings library import

Reviewed 26 September 2026. This is a source-preserving library conversion, not a critical edition or a claim of canonical status.

## Scope and dispositions

All 103 unique additions in the supplied archive manifest are accounted for, with fourteen further reusable editions acquired for the September expansion. The 16 pack files duplicate those individual files and are never read by the importer. The original source directory is read-only and is not copied into the repository or `public/`.

- 100 entries add primary reading text, including all 45 entries of the defined Yonge Philo corpus, the five Josephus source files, Lightfoot's Apostolic Fathers, early interpreters, Christian apocrypha and the reusable canon documents.
- Three same-translation overlaps reuse the existing primary reader: Charles's Ascension of Isaiah, James's Epistula Apostolorum and the ANF Papias fragments. Papias adds edition notes. These are source records of the same edition, not new translations. Ascension is whitespace-equivalent; Epistula matches including its introductory observation; Papias differs in two punctuation readings and a residual reference heading. Existing wording is preserved.
- Fourteen acquired entries are reference-only: six DSS dossiers; five Wesley-derived entries (2 Baruch, Testament of Moses, Psalms of Solomon, and the Latin/Greek Life of Adam and Eve); three mixed OCR editions (Horner Sinodos, Harden Didascalia and Box/Landsman Apocalypse of Abraham).
- Five additional records remain deferred: 1–3 Meqabyan, Ethiopic Clement and the Ethiopic Book of the Covenant. No substitutes or generated reconstructions are supplied.

The generated report currently counts 5,099 bounded reading pages, including separate historical commentary. Counts describe edition entries and reading parts, not distinct ancient works. Josephus's two Antiquities files share a work and edition identity; Philo's multi-part works share work identities; the Latin/Greek Adam-and-Eve versions remain separate witness records. Testament of Abraham retains Version I and Version II navigation contexts.

## September expansion

The fourteen new readable editions bring the library to 122 records: 103 published, fourteen reference-only and five deferred. They add Perpetua and Felicitas; Athanasius's *On the Incarnation*; Ephrem's selected Nisibene, Nativity, Epiphany and Pearl hymns; eight selected Aphrahat Demonstrations and the inquirer's letter; Cyril's Procatechesis, eighteen lectures and five mystagogical lectures; the fifty-five sections and subscriptions of Hogg's Arabic-witness *Diatessaron*; all three books of Clement of Alexandria's *Instructor*; and Athenagoras's thirty-seven-chapter *Plea*.

The focused Gnostic collection contains the Secret Book of John, Gospel of Truth, Gospel of Philip, Hypostasis of the Archons, On the Origin of the World and Treatise on the Resurrection. Thomas and Mary keep their existing Christian-apocrypha placement. The collection is for historical reading, without assigning canonical status or claiming apostolic authorship.

The [Other Gospels publication policy](https://othergospels.com/about/) permits reuse of its public-domain translation texts. Only the Samuel Zinner translation, edited by Mark M. Mattison, is acquired from each `zinner.json`; the separate Davies and Barnstone translations are not used. Introductions, explanatory footnotes, descriptive chapter titles, renderer code and manuscript images are excluded. Source gap signs, supplied words, manuscript page markers and labelled synoptic witness groups remain visible. John preserves the source's combined II/IV groups where present; it is not presented as four independent diplomatic transcriptions. Its reading URLs distinguish witnesses instead of treating different manuscripts as continuation pages. Philip and Truth use Mattison's separately dedicated translations, with modern reflections and translation notes excluded.

`scripts/early/sources/acquisitions.json` pins each raw acquisition by URL and SHA-256 and specifies the selected XML nodes or HTML boundaries. Six CCEL volumes supply the eight historical editions; each XML response individually declares public-domain rights. Only historical translation and apparatus enter the reader. Printed summaries and lecture titles are preserved as edition notes, with source section numbers retained for navigation. The [1898 preface](https://ccel.org/ccel/schaff/npnf213.iii.ii.html) identifies Albert Edward Johnston as the Aphrahat translator and John Gwynn as editor.

`acquire-expansion.py` requires Python 3 and `lxml`, and reads only a local cache of hash-matching responses. It produces repository-owned Markdown editions and an extraction audit. These reusable individual editions live outside `public/`; the unchanged archive remains read-only. Reacquisition is optional for ordinary builds: the importer verifies the committed edition hashes. To repeat extraction, download each `url` into its `cacheFile` name in a local directory, then run `python3 scripts/early/acquire-expansion.py /path/to/cache` before the import commands below. HTML changes fail the pinned-source check and require review rather than silent reimport.

Psalms of Solomon, 2 Baruch and Apocalypse of Abraham remain linked references. The CCEL Psalms link leads back to the restricted Wesley transcription; the alternative Wikisource copy has obvious OCR errors. Original print scans exist for Baruch and Abraham, but a new proofread transcription separating apparatus has not been completed. Their restrictions and proofreading requirements remain explicit. Meqabyan 1–3 remains awaiting a verified reusable acquisition.

## Reproduction

Run from the feature checkout with Node 24 and locked dependencies installed:

```sh
node scripts/early/import-library.mjs --source="$HOME/NotebookLM-Sources"
node scripts/early/import-library.mjs --source="$HOME/NotebookLM-Sources" --check
node scripts/site/build-early-catalog.mjs
node scripts/site/build-corpus-health.mjs
npm run lint
npm run typecheck
npm run test
npm run build
node scripts/release/browser.mjs tests/e2e/early-library.spec.ts
```

The import manifest is `scripts/early/library-import-manifest.json`. It locks every individual input hash, edition/work relationship, source language, coverage, rights review, publication decision, manuscript identifiers, and the original source-manifest hash. It also locks 646 legacy text, allusion and section/media files to preserve existing URLs, anchors, saved references and imagery. Changes to the archive or old files fail the import rather than silently changing an edition.

`content/early-library/` contains only generated publication data and bounded search data. The report checks input-body accounting before partitioning, records source headings and notes, and hashes every generated reading, catalog and search file. Normal builds and tests use these committed artifacts without requiring the local source archive. Reproduction against the archive is an additional check; the archive is not a deployment dependency.

The library import owns only its generated directory. Its write step runs after all input hashes and publication gates pass. No pack, PDF, raw source Markdown, DSS transcription or restricted Wesley body is deployed. Reference PDFs remain external links with their acquired hashes recorded where supplied.

## Rights review for this public portfolio

NotebookLM preparation was not treated as publication permission. Source statements and site-use decisions are separate manifest fields.

- Every imported CCEL XML source was fetched and its individual `DC.Rights` checked. All ten original sources declare `Public Domain`; response hashes and print-source statements are in [library-rights-verification.json](library-rights-verification.json). The hosted material is the historical translation and historical apparatus only. Modern CCEL summaries, covers, site navigation and special content are excluded, consistent with the distinction in the [CCEL copyright policy](https://ccel.org/about/copyright.html). CCEL's general republication/commercial-use notice is not treated as a license for its modern material.
- The four Whiston ebook records identify their texts as public domain in the USA. [Gutenberg's license](https://www.gutenberg.org/policy/license.html) permits reuse of the unbranded text and source acknowledgment in references. The reader omits branding and license boilerplate; the source record credits and links the transcription.
- Mattison expressly dedicates the [Thomas](https://www.gospels.net/thomas/) [Mary](https://www.gospels.net/mary/), [Philip](https://www.gospels.net/philip/) and [Truth](https://www.gospels.net/truth/) translations for unrestricted use. Their modern reflections and advertising are excluded.
- The [official WEB declaration](https://ebible.org/eng-web/copyright.htm) permits public republication. The Sirach translator's prologue is a standalone supplement; the existing Sirach corpus is unchanged.
- Historical Yonge/Charles/James translations are attributed to their source editions and publication dates. The conclusion that the historical text is public domain in the USA follows its publication date and the [Copyright Office's duration guidance](https://www.copyright.gov/circs/circ15a.pdf); it does not extend to modern website commentary. The Philo import is the defined 45-entry [Yonge web corpus](https://www.earlyjewishwritings.com/philo.html), not every surviving Philonic witness.
- [DSS](https://github.com/ETCBC/dss) is CC BY-NC 4.0. This portfolio advertises services, so noncommercial permissions are not assumed sufficient. Its six records preserve the twelve named witnesses, Hebrew/Aramaic language, reconstruction/uncertainty caveats and source documentation links without republishing the dataset.
- The [2 Baruch mirror](https://www.pseudepigrapha.com/pseudepigrapha/2Baruch.html), Testament of Moses and Psalms of Solomon expressly restrict commercial use. Psalms of Solomon's footer contradicts the source manifest's simpler public-domain summary; the restrictive footer controls this decision. Public-republication permission for the Wesley Adam-and-Eve transcriptions was not established, so they also remain references pending another permissible transcription.

This is a scoped editorial publication review, not a statement that every translation is free of restrictions in every jurisdiction.

## Fidelity and limitations

The complete Lightfoot 1 Clement retains chapters 1–65. `/early/1clement` retains its 59 chapter headings and existing translation. Ignatius remains the seven-letter middle recension. All existing early texts, allusion coordinates, images and section maps are unchanged.

The 2 Baruch record preserves the supplied repair history: the online mirror stops at 85:2; the acquired edition replaces chapters 85–87 with transcription checked against Charles (1913), pp. 524–526. The earlier 84 chapters remain unproofread. The combined restricted transcription is not published, and the acquisition's repaired ending is not mistaken for the truncated web mirror.

Horner represents the specified Ethiopic translation on printed pp. 127–232 (PDF pp. 174–279), not the entire wider Sinodos collection. All three unproofread OCR editions link to the scans and explicitly warn about mixed apparatus and extraction errors. No mixed OCR is searchable as ancient prose.

Primary prose, historical notes, translator interventions and modern catalog records have separate roles. Numbered footnotes link to bounded commentary pages; up to 8,000 characters of relevant notes are also available beside a reading. Each reading contains at most 14,000 source characters. Square-bracket interventions and uncertainty signs are preserved; not every legacy inline intervention can be reconstructed into a modern critical apparatus. Historical editors' opinions are not newly verified historical facts. New composition-date fields remain empty where no reviewed dating claim is supplied; edition/reprint dates are shown separately.

## Discovery and coverage

The original shelf, each overlapping reader, era pages and global Find lead to the edition library. Exact phrase search scans committed source data on the server and returns at most 30 excerpts per page. It labels primary text, commentary, reference metadata and legacy editions separately. The browser does not receive the corpus or search index.

The separate `/early/library/sitemap.xml` lists every record and reading page and is advertised by `robots.txt`. `public/early/library-catalog.json` contains compact metadata for Find. Corpus health includes import counts, publication limits and index coverage. Library pages use their own canonical URLs and attribution metadata.

The existing semantic and allusion indexes remain valid for their unchanged 23-text source corpus. The expansion is explicitly marked not embedded and not covered by allusions, both in corpus health and at the search entry points. No similarity result is described as proof of historical dependence. The existing `/word` routes, datasets and supporting modules are untouched.

## Validation

Focused tests cover the import dispositions, 65/20 Clement chapters, all twenty Antiquities books, seven Ignatius letters, both Abraham versions, 45 Philo entries, twelve DSS witnesses, source accounting, all output hashes, every note destination, size limits, legacy hashes, rights exclusions, exact-search roles, path traversal rejection, global Find and sitemap completeness. Browser flows cover a short letter, a multi-book history, fragmentary Mary and an OCR/reference record at 390px and 1280px.

Deployment must be reported from the repository release report after audited feature-branch completion and PR merge. No live deployment is asserted by this document.
