# Original-language Scripture sources

Generated from source revisions pinned in `scripts/scriptures/build-originals.mjs`.

| Corpus | Text | Word data | Revision |
| --- | --- | --- | --- |
| [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb) | Westminster Leningrad Codex, public domain | OSHB morphology and lemma data, CC BY 4.0 | `3d15126fb1ef74867fc1434be1942e837932691f` |
| [SBL Greek New Testament + MorphGNT](https://github.com/morphgnt/sblgnt) | SBLGNT, CC BY 4.0 | MorphGNT morphology and lemmatization, CC BY-SA 3.0 | `aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d` |
| [Rahlfs Septuagint — lxx-morph](https://git.sr.ht/~sethkush/lxx-morph) | Rahlfs 1935 via the Eliran Wong digital edition, public domain | Morphology data by Seth Kushniryk, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `c91f6b1e8fb3ba37df701e6ae31f675ace71a2b2` |

The Hebrew files follow the pointed qere for display and retain a ketiv form on the word record when the source marks one. OSHB's verse map is used to align full Masoretic verses with the English numbering used by this site; a source reference is retained whenever the numbering differs. The reader identifies each edition because none is a surviving authorial manuscript. LXX word lines appear only for books and translations whose verse numbering matches for the whole work; the remaining imported LXX data stays unavailable until an explicit versification map is reviewed. This site adapts and filters lxx-morph into chapter-level reader records, renames fields for the reader contract, and omits verbose per-token reasoning from the distributed reader files; that reasoning remains in the pinned upstream revision. Per-token part of speech, parsing, confidence, and analysis-source labels are retained from lxx-morph.
