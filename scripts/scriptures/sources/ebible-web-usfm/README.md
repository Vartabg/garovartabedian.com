# eBible World English Bible (USFM with Strong's tags)

The free starting point for the Word Bridge. eBible.org's USFM edition of the
World English Bible tags many English words with a Strong's number, meaning
"this word translates Hebrew/Greek word #…". The tags are machine alignments
and are often wrong. `scripts/scriptures/bridge/import-ebible.mjs` turns them
into draft links, and the checker keeps only what the dictionaries support.

The World English Bible is in the public domain. `manifest.json` pins the
download URL and SHA-256. Replace the zip only by re-downloading from that URL,
then update the hash.
