# Jubilees excerpt source correction

Reviewed on 2026-09-04. The existing `jubilees-17-18` excerpt was labeled
R. H. Charles (1913), but 22 of its 23 verses differed from the cited
transcription. Some differences changed wording or omitted clauses; this
excerpt could not serve as a verbatim reference for the full book.

The corrected excerpt retains its source ID and all 23 references:
17:15–18 and 18:1–19. Text comes from CCEL's
[chapter 17](https://www.ccel.org/c/charles/otpseudepig/jubilee/17.htm) and
[chapter 18](https://www.ccel.org/c/charles/otpseudepig/jubilee/18.htm), with
HTML markup removed, character entities decoded, and whitespace normalized.
The passages were checked against Charles, *The Apocrypha and Pseudepigrapha
of the Old Testament*, volume II (Oxford: Clarendon Press, 1913),
[printed pages 39–40](https://archive.org/details/apocryphapseudep02char/page/n57/mode/2up).

Examples confirmed in the printed edition:

| Reference | Correction |
| --- | --- |
| 17:15 | Restores the opening chronology, including “the seventh week” and “the first year thereof.” |
| 17:17 | Restores “faithful in all his afflictions”; removes wording absent from the edition. |
| 18:10 | Restores “and he was terrified.” |
| 18:12 | Preserves the printed ellipsis after “a ram caught”; removes the added “(in the bush).” |
| 18:13 | Preserves the edition's spelling “Mount Sion.” |

The correction preserves the source's wording, editorial marks, dates, and
punctuation rather than harmonizing it with Genesis or a later transcription.
The 1917 SPCK reprint and its online transcriptions were useful for checking
verse numbering, but were not substituted for the cited 1913 text.

`scripts/parallels/build-matrix.mjs` regenerates the five Jubilees quotations
in `sacrifice-of-the-son.json` and its content digest. The rights manifest's
Jubilees digest is then recomputed from the 23 source verses and those five
quotations. Other source excerpts and comparison matrices are unaffected.
The ram-offering summary also drops the unsupported “in a bush” detail and
uses the source's spelling “Mount Sion.”
