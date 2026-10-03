import { GLOSSARY } from "./entries";
import type { GlossEntry, GlossRef, GlossSegment } from "./types";

/**
 * Split prose into plain runs and matched glossary terms.
 * Matching happens at render time so the verbatim source texts stay untouched.
 */

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ASCII_WORD = /[A-Za-z0-9_]/;

/** Lowercase-led variants ("publican") also match sentence-case ("Publican");
 *  capitalized variants (proper nouns) match case-sensitively so the name
 *  "Mark" never claims the verb "mark". Word boundaries are added per edge:
 *  `\b` only works next to ASCII word characters, so accented forms like
 *  "Azâzêl" get none where they'd silently kill the match. */
function variantPattern(variant: string) {
  const first = variant[0];
  const rest = escapeRegExp(variant.slice(1));
  const core = /[a-z]/.test(first)
    ? `[${first.toUpperCase()}${first}]${rest}`
    : escapeRegExp(first) + rest;
  const lead = ASCII_WORD.test(first) ? "\\b" : "";
  const tail = ASCII_WORD.test(variant[variant.length - 1]) ? "\\b" : "";
  return lead + core + tail;
}

type Matcher = { regex: RegExp; byVariant: Map<string, GlossEntry> };

let matcher: Matcher | null = null;

function getMatcher(): Matcher {
  if (matcher) return matcher;
  const byVariant = new Map<string, GlossEntry>();
  // Patterns must keep each variant's original casing ("LORD" stays
  // case-sensitive) — only the lookup map is case-folded. When two forms
  // share a fold, a lowercase-led one wins so the case-pair pattern is kept.
  const patternForms = new Map<string, string>();
  for (const entry of GLOSSARY) {
    for (const form of new Set([entry.term, ...entry.variants])) {
      const key = form.toLowerCase();
      byVariant.set(key, entry);
      const existing = patternForms.get(key);
      if (!existing || /[a-z]/.test(form[0])) patternForms.set(key, form);
    }
  }
  // Longest form first so "Douay-Rheims" wins over "Douay".
  const forms = [...patternForms.values()].sort((a, b) => b.length - a.length);
  const source = forms.map(variantPattern).join("|");
  const regex = new RegExp(source, "g");
  matcher = { regex, byVariant };
  return matcher;
}

const toRef = (e: GlossEntry): GlossRef => ({
  id: e.id,
  term: e.term,
  kind: e.kind,
  def: e.def,
  ...(e.say ? { say: e.say } : {}),
});

/** Entry id → claim key of the occurrence that owns the dot. A map (not a
 *  set) so re-rendering the same text keeps its dot — React Strict Mode
 *  renders everything twice, and a plain "already seen" set would swallow
 *  every dot on the second pass. */
export type GlossSeen = Map<string, string>;

/**
 * Mark glossary terms in `text`. Each entry is marked at most once per `seen`
 * map — pass one map across a whole page (or one per chapter in long texts)
 * to keep the underlines sparse.
 */
export function segmentText(text: string, seen?: GlossSeen): GlossSegment[] {
  if (GLOSSARY.length === 0) return [text];
  const { regex, byVariant } = getMatcher();
  const segments: GlossSegment[] = [];
  let cursor = 0;
  regex.lastIndex = 0;
  for (let m = regex.exec(text); m; m = regex.exec(text)) {
    const entry = byVariant.get(m[0].toLowerCase());
    if (!entry) continue;
    if (seen) {
      // Idempotent claim: the first occurrence owns the dot, and keeps it
      // across re-renders of the same text; every other occurrence stays plain.
      const claim = `${m.index}|${text}`;
      const owner = seen.get(entry.id);
      if (owner !== undefined && owner !== claim) continue;
      seen.set(entry.id, claim);
    }
    if (m.index > cursor) segments.push(text.slice(cursor, m.index));
    segments.push({ text: m[0], entry: toRef(entry) });
    cursor = m.index + m[0].length;
  }
  if (segments.length === 0) return [text];
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}
