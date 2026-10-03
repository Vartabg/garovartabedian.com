# Scripture data pipeline

Generates the static JSON under `public/scriptures/` that powers the scripture
reader: four public-domain eBible translations, the R. H. Charles editions of
1 Enoch and Jubilees, TSK cross-references, and client-side search indexes.
Original-language word data has a separate, source-pinned build so
regenerating the English texts never wipes it.

## Re-run

```sh
node scripts/scriptures/build-data.mjs
npm run data:originals
```

After updating an audited Charles text, regenerate its catalog, shelf counts,
and concordance without downloading or rewriting the other editions:

```sh
node scripts/scriptures/charles-supplement.mjs
```

The Charles sources are the versioned `text/charles/ENO.json` (108 chapters,
retaining its existing 1913 attribution) and `text/charles/JUB.json` (50 chapters,
1913 edition). Both full
and targeted builds require complete, nonempty chapter and verse arrays before
publishing. The full build retains these files, including their metadata, when
replacing the text tree. Source-transcription validation is a separate gate;
structural checks alone do not establish the accuracy of verse wording.

- Node 24 (pinned by the repository's `.nvmrc` and `.node-version`), with no
  script-specific npm dependencies; source retrieval uses system `curl`.
- Sources are downloaded into `scripts/scriptures/.cache/` (gitignored) only when
  missing; delete `.cache/` to force a re-download.
- Idempotent and fail-closed: every run builds `text`, `xref`, `search`,
  `canons.json`, `shelf.json`, and `SOURCES.md` in an isolated staging tree.
  The live corpus is replaced only after the complete staged bundle validates;
  an error leaves the previously published files untouched.
- The script prints a validation report (known-verse checks, book/chapter counts,
  output size). Any failed check exits non-zero and prevents publication.

## Files

| Path | Contents |
| --- | --- |
| `scripts/scriptures/build-data.mjs` | The pipeline (fetch, parse, emit, validate) |
| `scripts/scriptures/canon-data.mjs` | Book names, USFM ID normalization, canon orders, traditions, TSK abbreviation map, stopwords |
| `scripts/scriptures/charles-supplement.mjs` | Shared Charles validation and concordance builder; targeted catalog/shelf/index publication |
| `public/scriptures/canons.json` | Global book order, per-book metadata, translations, traditions |
| `public/scriptures/text/{trans}/{BOOK}.json` | `chapters[c-1][v-1]` = verse text (`""` = verse omitted/bridged in that edition) |
| `public/scriptures/xref/{BOOK}.json` | TSK cross-references keyed `"chapter:verse"` |
| `public/scriptures/search/{trans}/{shard}.json` | Per-edition inverted index; token -> `[[bIdx, chapter, verse], ...]` where `bIdx` indexes `canons.json` `bookOrder` |
| `public/scriptures/search/{trans}/meta.json` | Stopword list + shard scheme (`first2`: first two chars of token; single-char tokens get their own shard) |
| `public/scriptures/shelf.json` | Per-book non-empty verse counts, derived in the same build to prevent visualization drift |
| `public/scriptures/SOURCES.md` | Source provenance and licenses |
| `scripts/scriptures/build-originals.mjs` | Pinned OSHB, MorphGNT, and lxx-morph import pipeline |
| `public/scriptures/original/{BOOK}/{chapter}.json` | Lazy word-level Hebrew, Aramaic, or Greek chapter data |
| `public/scriptures/original/manifest.json` | Original-language edition, revision, license, and book coverage metadata |

## Gotchas baked into the data

- `canons.json` `books[ID].chapters` is the MAX chapter count across translations.
  Editions differ: Brenton PSA has 151 chapters (LXX Psalm 151), Brenton EZR is
  Esdras B (Ezra+Nehemiah, 23 chapters), DRB EST has 16 (Vulgate additions),
  DRB DAN has 14 (Susanna, Bel). Always trust the loaded book file's own
  `chapters.length` for display.
- Brenton uses LXX psalm/verse numbering; LXX lettered sub-verses (e.g. JOS 9:2a-f)
  are appended to their base verse.
- The original-language reader exposes Rahlfs/lxx-morph lines only for books
  whose complete verse numbering matches each selected English translation.
  Other imported LXX books remain research data until an explicit versification
  map is reviewed; Rahlfs Esdras B is never mapped to apocalyptic 2 Esdras.
- eBible legacy book codes are normalized to USFM (JOH->JHN, SOL->SNG, PSX->PS2,
  PRM->MAN, EPJ->LJE, 4ES->2ES, DNG->DAG, ...). WEB/DRB Greek Daniel additions live
  inside DAG/DAN chapters 3, 13, 14; Brenton has SUS and BEL as separate books.
- The Ethiopian shelf includes the shared books, 1 Enoch, and Jubilees. It does
  not yet host Meqabyan or the broader church-order corpus. The Armenian shelf
  likewise provides its available English overlap (see `editorial` / `linkOut`
  in `canons.json`).
