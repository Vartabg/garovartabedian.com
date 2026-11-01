import { readFileSync } from "node:fs";
import path from "node:path";

// Each comparison is bound to its actual passage. A new witness needs an
// explicit entry rather than inheriting another book's provenance.
const PASSAGES = {
  "jude-14-15": { book: "JUD", chapter: 1, corpusId: "new-testament" },
  "genesis-6": { book: "GEN", chapter: 6, corpusId: "hebrew-bible" },
  "daniel-7": { book: "DAN", chapter: 7, corpusId: "hebrew-bible" },
  "matthew-26": { book: "MAT", chapter: 26, corpusId: "new-testament" },
};
const LANGUAGES = { hebrew: "Hebrew", aramaic: "Aramaic", greek: "Greek" };
const EDITIONS = {
  oshb: "Open Scriptures Hebrew Bible",
  sblgnt: "SBL Greek New Testament + MorphGNT",
};

export function scriptureIdentity(root, witnessId) {
  const passage = PASSAGES[witnessId];
  if (!passage) throw new Error(`No passage identity for ${witnessId}`);
  const original = JSON.parse(readFileSync(path.join(root,
    `public/scriptures/original/${passage.book}/${passage.chapter}.json`), "utf8"));
  if (original.book !== passage.book || original.chapter !== passage.chapter) {
    throw new Error(`Original chapter identity mismatch for ${witnessId}`);
  }
  const languages = [...new Set(original.verses.flatMap((verse) => verse.languages))];
  if (!languages.length || languages.some((language) => !LANGUAGES[language]) || !EDITIONS[original.edition]) {
    throw new Error(`Unsupported original-language metadata for ${witnessId}`);
  }
  return { ...passage, originalLanguage: languages.map((language) => LANGUAGES[language]).join(" / "),
    sourceEdition: EDITIONS[original.edition] };
}

export function scriptureWitnessMetadata(root, witnessId) {
  const identity = scriptureIdentity(root, witnessId);
  return {
    language: `${identity.originalLanguage} / English`,
    dates: witnessId === "genesis-6" ? {
      composition: "c. 10th–6th century BCE",
      earliestManuscript: "4QGen-b (c. 1st century BCE)",
      edition: "Westminster Leningrad Codex / World English Bible",
    } : {
      composition: "Not assessed in this comparison",
      earliestManuscript: "Not assessed in this comparison",
      edition: `World English Bible; source-language reference: ${identity.sourceEdition}`,
    },
  };
}

export function scriptureLocator(root, book, passageRef) {
  const witnessId = Object.keys(PASSAGES).find((id) => PASSAGES[id].book === book);
  const identity = scriptureIdentity(root, witnessId);
  return { corpusId: identity.corpusId, editionId: "web-bible", section: book,
    passageRef, originalLanguage: identity.originalLanguage };
}

export function validateScriptureWitnessMetadata(matrix, root) {
  const errors = [];
  for (const witness of matrix.witnesses) {
    if (!PASSAGES[witness.id]) continue;
    const identity = scriptureIdentity(root, witness.id);
    const expected = scriptureWitnessMetadata(root, witness.id);
    if (witness.corpusEditionId !== "web-bible" || witness.language !== expected.language ||
        JSON.stringify(witness.dates) !== JSON.stringify(expected.dates)) {
      errors.push(`${witness.id}: witness language, edition or date metadata disagrees with its passage`);
    }
    for (const slot of matrix.slots) {
      const locator = slot.cells[witness.id]?.locator;
      if (!locator || locator.section !== identity.book || locator.corpusId !== identity.corpusId ||
          locator.editionId !== "web-bible" || locator.originalLanguage !== identity.originalLanguage) {
        errors.push(`${slot.id}/${witness.id}: locator identity disagrees with its passage`);
      }
    }
  }
  return errors;
}
