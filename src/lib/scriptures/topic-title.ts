/**
 * Nave's index stores each subject in capitals ("WORD OF GOD"). A title reads it in
 * sentence case, but a plain lowercase pass also flattens the names inside it
 * ("Word of god"). The names below are the ones the index holds after a first word;
 * `tests/topic-title.test.ts` checks the list against the index.
 */
const NAMES = [
  // Names of God and of Scripture
  "God", "Jesus", "Christ", "Lord's", "Savior", "Satan", "Bible",
  // People and places named after the first word
  "Aphrah", "Caesar", "Charta", "Karnaim", "Kiriathaim", "Lysius", "Maran", "Paulus",
  "Philippi", "Pollux", "Pontius", "Priscilla", "Shahar", "Thummim",
  // Second spellings given in brackets
  "Aenon", "Alphaeus", "Archaelaus", "Bartimaeus", "Bathsheba", "Colossae", "Eleazer",
  "Elizabeth", "Epaenetus", "Esarhaddon", "Ezion", "Jude", "Malta", "Nebuzar", "Phebe",
  "Quirinius", "Rabshakeh", "Rebecca", "Samothrace", "Shebnah", "Susa", "Zaccheus",
  "Zechariah", "Zecharias",
] as const;

export const TOPIC_TITLE_NAMES: readonly string[] = NAMES;

const NAME_BY_LOWER = new Map(NAMES.map((name) => [name.toLowerCase(), name]));

/** Whole titles a rule cannot reach. */
const WHOLE: Record<string, string> = {
  "I AM THAT I AM": "I AM THAT I AM",
  "HOLY SPIRIT": "Holy Spirit",
  "PRINCE OF PEACE": "Prince of Peace",
  "EL-ELOHE-ISRAEL": "El-elohe-Israel",
};

/** "JESUS, THE CHRIST" -> "Jesus, the Christ". */
export function topicTitle(id: string): string {
  const whole = WHOLE[id];
  if (whole) return whole;
  const title = id
    // A word the index already wrote in mixed case ("Christian", "Holy") keeps its case.
    .replace(/[A-Za-z']+/g, (word) => (/[a-z]/.test(word) ? word : word.toLowerCase()))
    // A name is a whole word. The later parts of a hyphened name stay small, as the
    // King James text prints them ("Abel-beth-maachah").
    .replace(/[a-z']+/g, (word, at: number, all: string) =>
      at > 0 && /[-A-Za-z']/.test(all[at - 1]) ? word : (NAME_BY_LOWER.get(word) ?? word),
    )
    // "(r. v.)" and "(a.v.)" are the Revised and Authorized Versions.
    .replace(/\b([ar])\. ?v\./g, (match) => match.toUpperCase());
  return title.charAt(0).toUpperCase() + title.slice(1);
}
