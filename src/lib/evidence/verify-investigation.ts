import { createHash } from "node:crypto";
import { resolveEarlyChapter } from "@/lib/early/citations";
import type { EarlyText } from "@/lib/early/types";
import type { BookText } from "@/lib/scriptures/types";
import type { InvestigationDefinition, InvestigationPacket, VerifiedExcerpt } from "./investigation-types";

export const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

/** Stable across object-key ordering; array order is intentionally significant. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("Investigation contains an unserializable value.");
  return encoded;
}

function uniqueIds(records: { id: string }[], label: string): void {
  const ids = records.map((record) => record.id);
  if (!ids.length || ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error(`${label} must have nonempty, unique IDs.`);
  }
}

function positiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/** Pure, fail-closed verification against supplied artifact bytes; no model or network. */
export function verifyInvestigation(
  definition: InvestigationDefinition,
  artifacts: ReadonlyMap<string, Uint8Array>,
): InvestigationPacket {
  uniqueIds(definition.sources, "Sources");
  uniqueIds(definition.excerpts, "Excerpts");
  uniqueIds(definition.claims, "Claims");
  const parsed = new Map<string, BookText | EarlyText>();
  for (const source of definition.sources) {
    const bytes = artifacts.get(source.id);
    if (!bytes || sha256(bytes) !== source.sha256) {
      throw new Error(`Source hash mismatch or missing artifact: ${source.id}. Review source changes before repinning.`);
    }
    const text = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (source.kind === "scripture") {
      if (text.book !== source.book || text.trans !== source.translation || !Array.isArray(text.chapters)) {
        throw new Error(`Source identity mismatch: ${source.id}.`);
      }
    } else if (text.id !== source.work || !Array.isArray(text.sections)) {
      throw new Error(`Source identity mismatch: ${source.id}.`);
    }
    parsed.set(source.id, text);
  }

  const excerpts: VerifiedExcerpt[] = definition.excerpts.map((excerpt) => {
    const source = definition.sources.find((item) => item.id === excerpt.sourceId);
    if (!source) throw new Error(`Unknown source: ${excerpt.sourceId}.`);
    const locator = excerpt.locator;
    if (!positiveInteger(locator.chapter)) throw new Error(`Invalid chapter: ${excerpt.id}.`);
    let context: string | undefined;
    let passageId: string;
    let href: string;
    if (locator.kind === "verse" && source.kind === "scripture") {
      if (!positiveInteger(locator.verse)) throw new Error(`Invalid verse: ${excerpt.id}.`);
      const text = parsed.get(source.id) as BookText;
      context = text.chapters[locator.chapter - 1]?.[locator.verse - 1];
      passageId = `${source.id}:${locator.chapter}:${locator.verse}`;
      href = `/scriptures/protestant/${source.book}/${locator.chapter}?t=${source.translation}#v${locator.verse}`;
    } else if (locator.kind === "paragraph" && source.kind === "early-writing") {
      if (!positiveInteger(locator.paragraph)) throw new Error(`Invalid paragraph: ${excerpt.id}.`);
      const text = parsed.get(source.id) as EarlyText;
      const section = resolveEarlyChapter(text.sections, locator.chapter);
      context = section.paragraphs[locator.paragraph - 1];
      passageId = `${source.id}:${locator.chapter}:p${locator.paragraph}`;
      href = `/early/${source.work}#chapter-${locator.chapter}`;
    } else {
      throw new Error(`Locator does not match source kind: ${excerpt.id}.`);
    }
    if (typeof context !== "string" || !excerpt.exact.trim()) {
      throw new Error(`Missing passage or empty quotation: ${excerpt.id}.`);
    }
    const start = context.indexOf(excerpt.exact);
    if (start < 0 || context.indexOf(excerpt.exact, start + 1) !== -1) {
      throw new Error(`Quotation must match exactly once in its passage: ${excerpt.id}.`);
    }
    return {
      ...excerpt,
      passageId,
      href,
      context,
      selector: {
        unit: "UTF-16-code-unit",
        start,
        end: start + excerpt.exact.length,
        exactSha256: sha256(excerpt.exact),
      },
    };
  });
  const excerptIds = new Set(excerpts.map((excerpt) => excerpt.id));
  for (const claim of [...definition.claims, definition.relationship]) {
    if (!claim.evidenceIds.length || claim.evidenceIds.some((id) => !excerptIds.has(id))) {
      throw new Error("Every claim and relationship must reference existing evidence.");
    }
  }
  const content = { ...definition, excerpts };
  return {
    ...content,
    verification: {
      status: "source-checked",
      algorithm: "sha256",
      canonicalization: "Key-sorted JSON v1: remove the top-level verification block; recursively sort object keys lexicographically by UTF-16 code units; preserve array order; serialize with JSON.stringify string/number escaping and no insignificant whitespace; hash the UTF-8 bytes. This is the project's own serialization contract, not a claim of RFC 8785 compliance.",
      contentHash: sha256(canonicalJson(content)),
      scope: "Pinned hosted bytes, source identities, passage resolution, unique exact quotation spans, and evidence references. Interpretation and upstream transcription accuracy are not certified.",
    },
  };
}
