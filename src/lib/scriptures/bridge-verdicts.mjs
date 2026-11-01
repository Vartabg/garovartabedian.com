/**
 * The Word Bridge's verdicts in words. The checker
 * (scripts/scriptures/bridge/check.mjs) publishes a short code per link;
 * the reader turns the code back into these sentences. One module for both,
 * so what the page says is always what the checker decided.
 */

/** @typedef {"ok" | "plain" | "flag"} BridgeStatus */

export const STATUS_CODES = /** @type {const} */ (["ok", "plain", "flag"]);
export const KIND_CODES = /** @type {const} */ (["link", "supplied", "untranslated"]);

const GRAMMAR = {
  subject: "the verb’s ending carries its subject",
  suffix: "the Hebrew word carries a pronoun suffix",
  aux: "the verb’s tense or mood carries it",
  case: "the noun’s case carries it",
  article: "English adds an article the original does not need",
};

const quote = (w) => `“${w}”`;

/**
 * @param {string} code
 * @param {string} [arg] the matched word, or unmatched words joined by "|"
 * @returns {{ label: string, why: string }}
 */
export function explain(code, arg = "") {
  if (code.startsWith("grammar:")) {
    const reason = GRAMMAR[code.slice(8)] ?? "the grammar carries it";
    return { label: "Carried by the grammar", why: `${reason[0].toUpperCase()}${reason.slice(1)}.` };
  }
  switch (code) {
    case "dict":
      return { label: "Matches the dictionary", why: `${quote(arg)} is in the dictionary meaning.` };
    case "supplied":
      return { label: "Added by the translator", why: "No Hebrew or Greek word stands behind this English word." };
    case "untranslated-dict":
      return { label: "Untranslated, as the dictionary says", why: "The dictionary itself says this word has no English equivalent." };
    case "untranslated":
      return { label: "Left out of the English", why: "English leaves this word out." };
    case "untranslated-gap":
      return { label: "Left out of the English", why: "Nothing is linked to this word; English often leaves such words out." };
    case "gap":
      return { label: "Needs review", why: "The draft did not link this word to anything." };
    case "untagged":
      return { label: "Not linked yet", why: "The free word tags this verse starts from have no tag for this word." };
    case "uncertain":
      return { label: "Needs review", why: "The drafting model marked this link as uncertain." };
    case "nomatch": {
      const words = arg.split("|").filter(Boolean);
      return {
        label: "Needs review",
        why:
          words.length === 1
            ? `${quote(words[0])} is not in the dictionary meaning, and the grammar does not explain it.`
            : `None of ${words.map(quote).join(", ")} is in the dictionary meaning, and the grammar does not explain it.`,
      };
    }
    default:
      return { label: "Needs review", why: "This link has not been checked." };
  }
}

/** Where a verse's links came from. */
export const SOURCES = {
  e: "Free Strong’s word tags from eBible.org’s World English Bible, checked against the dictionaries",
  c: "Drafted by AI models (Claude, Codex), checked against the dictionaries",
};

/**
 * English verse → tokens; `w` is the bare word ("" for punctuation-only).
 * @param {string} text
 * @returns {{ t: string, w: string }[]}
 */
export function tokenize(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const m = /[\p{L}\p{N}][\p{L}\p{N}’'-]*[\p{L}\p{N}]|[\p{L}\p{N}]/u.exec(t);
      return { t, w: m ? m[0] : "" };
    });
}
