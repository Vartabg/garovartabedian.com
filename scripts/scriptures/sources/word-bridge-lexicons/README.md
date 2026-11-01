# Word Bridge dictionaries

Pinned copies of the two dictionaries the Word Bridge checker
(`scripts/scriptures/bridge/check.mjs`) compares every drafted link against.
`manifest.json` records each file's source URL, license, and SHA-256.

- **Dodson Greek–English Lexicon**: public domain. Headwords are in Beta Code
  and matched to the SBL Greek New Testament's lemmas by their bare letters.
- **Strong's Hebrew Dictionary** (1890): the dictionary text is public domain.
  The XML markup is © Open Scriptures Hebrew Bible Project, CC BY 4.0. Credit
  the Open Scriptures Hebrew Bible Project.

Do not edit these files by hand. To update one, replace it from its URL and
update its hash in the manifest; the bridge tests check that the hashes match.
