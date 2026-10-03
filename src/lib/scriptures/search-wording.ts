/** Word/phrase evidence, not a semantic or claim-support judgment. */
export const NEGATION_WORDS = new Set("not no never neither nor without cannot cant dont doesnt didnt isnt arent wasnt werent wont wouldnt shouldnt couldnt mustnt".split(" "));
export function wordingTokens(text: string): string[] {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/['’]/g, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
const contractions: Record<string, string[]> = { dont: ["do", "not"], doesnt: ["does", "not"], didnt: ["did", "not"], cant: ["can", "not"], cannot: ["can", "not"], wont: ["will", "not"], wouldnt: ["would", "not"], shouldnt: ["should", "not"], couldnt: ["could", "not"], mustnt: ["must", "not"], isnt: ["is", "not"], arent: ["are", "not"], wasnt: ["was", "not"], werent: ["were", "not"] };
const expanded = (words: readonly string[]) => words.flatMap(word => contractions[word] ?? [word]);
const padded = (words: readonly string[]) => ` ${words.join(" ")} `;
const negationTargets = [...new Set([...NEGATION_WORDS].map(word => contractions[word] ? "not" : word))];

export type PreparedWordingText = {
  readonly tokens: readonly string[];
  readonly literalPhrase: string;
  readonly expandedPhrase: string;
  readonly negationTargets: readonly string[];
};
export type PreparedWordingQuery = {
  readonly tokens: readonly string[];
  readonly literalPhrase: string;
  readonly expandedPhrase: string;
  readonly expandedTokenCount: number;
  readonly negatives: readonly { word: string; target: string }[];
};

/** Retain source order for phrases/proximity, without caching per-row word Sets. */
export function prepareWordingText(text: string): PreparedWordingText {
  const tokens = wordingTokens(text), expandedTokens = expanded(tokens);
  const literalPhrase = padded(tokens), expandedPhrase = padded(expandedTokens);
  return {
    tokens, literalPhrase,
    expandedPhrase: expandedPhrase === literalPhrase ? literalPhrase : expandedPhrase,
    negationTargets: negationTargets.filter(word => expandedTokens.includes(word)),
  };
}

export function prepareWordingQuery(query: string): PreparedWordingQuery {
  const tokens = wordingTokens(query), expandedTokens = expanded(tokens);
  const literalPhrase = padded(tokens), expandedPhrase = padded(expandedTokens);
  return {
    tokens, literalPhrase,
    expandedPhrase: expandedPhrase === literalPhrase ? literalPhrase : expandedPhrase,
    expandedTokenCount: expandedTokens.length,
    negatives: [...new Set(tokens.filter(word => NEGATION_WORDS.has(word)))].map(word => ({
      word, target: contractions[word] ? "not" : word,
    })),
  };
}

export function wordingEvidencePrepared(query: PreparedWordingQuery, text: PreparedWordingText, contentWords: readonly string[] = []) {
  const words = text.tokens;
  const phrase = query.tokens.length > 1 && text.literalPhrase.includes(query.literalPhrase);
  const phraseForm = !phrase && query.expandedTokenCount > 1 && text.expandedPhrase.includes(query.expandedPhrase);
  const missingNegation = query.negatives.filter(({ target }) => !text.negationTargets.includes(target)).map(({ word }) => word);
  let proximity = 0;
  if (contentWords.length > 1) for (let from = 0; from < words.length; from++) {
    if (words[from] !== contentWords[0]) continue;
    let at = from;
    for (const word of contentWords.slice(1)) { at = words.indexOf(word, at + 1); if (at < 0) break; }
    if (at >= 0) proximity = Math.max(proximity, contentWords.length / (at - from + 1));
  }
  return { phrase, phraseForm, missingNegation, proximity, words: new Set(words) };
}

/** Preserve the string-based API and give every caller its own mutable word Set. */
export function wordingEvidence(query: string, text: string, contentWords: string[] = []) {
  return wordingEvidencePrepared(prepareWordingQuery(query), prepareWordingText(text), contentWords);
}

export type WordingMatch = "phrase" | "phrase-form" | "all-words" | "some-words" | "word-forms";
export function wordingLabel(hit: { matched: number; match?: WordingMatch; missingNegation?: string[] }): string {
  const label = hit.match === "phrase" ? "Complete phrase" : hit.match === "phrase-form" ? "Phrase with a contraction" : hit.match === "all-words" ? "All search words" : hit.match === "word-forms" ? "Related word form" : `${hit.matched} search word${hit.matched === 1 ? "" : "s"}`;
  return hit.missingNegation?.length ? `${label} · negation differs; read context` : label;
}
