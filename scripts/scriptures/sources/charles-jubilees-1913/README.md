# Jubilees source archive

These 50 HTML files preserve the CCEL transcription of R. H. Charles,
*The Apocrypha and Pseudepigrapha of the Old Testament*, volume II
(Oxford: Clarendon Press, 1913), printed pages 11–82. CCEL credits the
transcription to Joshua Williams, Northwest Nazarene College. The historical
translation is public domain. The files are source inputs, not rendered site
pages; their navigation, formatting, and editorial introduction are excluded
from the published verse arrays.

The manifest records each original URL and SHA-256 digest. The saved bytes
have not been edited. Rebuilding needs no network access:

Git attributes preserve these HTML files' original CRLF line endings and
trailing whitespace so their source checksums remain stable across checkouts.

```sh
node scripts/scriptures/ingest-jubilees.mjs
node scripts/scriptures/ingest-jubilees.mjs --check
node scripts/scriptures/charles-supplement.mjs
```

The first command validates and atomically publishes `JUB.json`; the second
compares the committed output without writing; the third refreshes the Charles
catalog and search index. A checksum, heading, verse count, boundary, or excerpt
mismatch stops publication. `npm run check:jubilees` also runs before the site
build.

## Text and verse numbering

The transcription contains 1,305 HTML list items. Two missing list markers at
1:9 and 11:4 are restored, producing 50 chapters and 1,307 verses. Thirty-four
additional boundaries are moved at exact, unique text prefixes recorded in
the manifest. These operations preserve the concatenated source text exactly
after whitespace normalization; no words, dates, brackets, punctuation, or
editorial ellipses are supplied from another edition.

Numbering was compared with the explicitly numbered Charles 1917 SPCK edition
as transcribed by Global Grey. Each changed boundary was checked against the
corresponding 1913 printed page. The 1913 numbers are marginal and often share
a line with the end of one verse and the beginning of the next. Their placement
supports compatibility with the proposed numbering but does not independently
establish every precise within-line split. The manifest records this method
and the page evidence for every repair.

At 20:9, the 1913 marginal number accompanies “Serve them not,” on its own line,
while the 1917 comparator puts that line in 20:8. This uncertain edition
difference is left unchanged: the published text retains the CCEL/1913 boundary.

The source retains transcription quirks, including lowercase verse openings
and missing punctuation. It is a complete reproduction of this transcription
with reviewed verse boundaries, not a new diplomatic edition of the printed
book. A whole-chapter comparison with the 1917 transcription found no missing
span of nine or more consecutive words; that screen does not establish that
every shorter textual variant is error-free.

The 23 previously published excerpt verses (17:15–18; 18:1–19) were separately
checked and corrected against the 1913 source. Rebuilding requires exact
agreement with those excerpts. See `docs/jubilees-source-review.md` for the
correction record.

## References

- [CCEL transcription index](https://www.ccel.org/c/charles/otpseudepig/jubilee/index.htm)
- [1913 printed volume](https://archive.org/details/apocryphapseudep02char)
- [1917 numbered comparison transcription](https://www.globalgreyebooks.com/online-ebooks/r-h-charles_book-of-jubilees_complete-text.html)
- [1917 printed edition](https://archive.org/details/bookofjubileesor01char)

The 1913 PDF digest is recorded in the manifest. Its one-based physical page
number equals the printed page plus 18. Large scan files are not vendored.
