import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ISAIAH_CLEMENT_INVESTIGATION as definition } from "../src/lib/evidence/investigations/isaiah-53-clement-16";
import { canonicalJson, sha256, verifyInvestigation } from "../src/lib/evidence/verify-investigation";
import { investigationMarkdown } from "../src/lib/evidence/investigation-export";
import type { InvestigationDefinition } from "../src/lib/evidence/investigation-types";
import type { EarlyText } from "../src/lib/early/types";

const artifacts = () => new Map(definition.sources.map((source) => [source.id, readFileSync(source.artifact)]));

function modifiedClement(change: (text: EarlyText) => void) {
  const draft = structuredClone(definition);
  const bytes = artifacts();
  const source = draft.sources[1];
  const text: EarlyText = JSON.parse(bytes.get(source.id)!.toString());
  change(text);
  const edited = Buffer.from(JSON.stringify(text));
  bytes.set(source.id, edited);
  source.sha256 = sha256(edited);
  return { draft, bytes };
}

describe("source investigations", () => {
  it("resolves 1 Clement 16 by chapter identity and binds exact spans to the hosted editions", () => {
    const packet = verifyInvestigation(definition, artifacts());
    const clement = packet.excerpts.find((excerpt) => excerpt.id === "clement-suffering")!;
    assert.equal(clement.passageId, "early:anf-1885:1clement:16:p1");
    assert.equal(clement.href, "/early/1clement#chapter-16");
    assert.match(clement.context, /For Christ is of those who are humble-minded/);
    assert.ok(!clement.context.includes("Let us be imitators also of those"));
    for (const excerpt of packet.excerpts) {
      assert.equal(excerpt.context.slice(excerpt.selector.start, excerpt.selector.end), excerpt.exact);
      assert.equal(sha256(excerpt.exact), excerpt.selector.exactSha256);
    }
    assert.equal(packet.excerpts[0].href, "/scriptures/protestant/ISA/53?t=web#v5");
    assert.equal(packet.editorialReview.status, "draft");
  });

  it("detects a same-size artifact change without relying on file counts or length", () => {
    const bytes = artifacts();
    const id = definition.sources[1].id;
    const original = bytes.get(id)!;
    const changed = Buffer.from(original.toString().replace("humble-minded", "Humble-minded"));
    assert.equal(original.byteLength, changed.byteLength);
    bytes.set(id, changed);
    assert.throws(() => verifyInvestigation(definition, bytes), /Source hash mismatch/);
  });

  it("requires a unique literal quotation and refuses paraphrase or wrong chapters", () => {
    const draft = structuredClone(definition);
    draft.excerpts[1].exact = draft.excerpts[1].exact.replace("were healed", "are healed");
    assert.throws(() => verifyInvestigation(draft, artifacts()), /Quotation must match exactly once/);
    draft.excerpts[1] = structuredClone(definition.excerpts[1]);
    draft.excerpts[1].locator.chapter = 17;
    assert.throws(() => verifyInvestigation(draft, artifacts()), /Quotation must match exactly once/);
  });

  it("keeps passage identity after a repinned introduction insertion", () => {
    const { draft, bytes } = modifiedClement((text) => text.sections.unshift({ heading: "Introduction", paragraphs: ["Introduction"] }));
    const before = verifyInvestigation(definition, artifacts());
    const after = verifyInvestigation(draft, bytes);
    assert.equal(after.excerpts[1].passageId, before.excerpts[1].passageId);
    assert.equal(after.excerpts[1].href, before.excerpts[1].href);
    assert.notEqual(after.verification.contentHash, before.verification.contentHash);
  });

  it("rejects ambiguous chapters and repeated quotations even after a source is repinned", () => {
    const duplicateChapter = modifiedClement((text) => text.sections.push(structuredClone(text.sections[15])));
    assert.throws(() => verifyInvestigation(duplicateChapter.draft, duplicateChapter.bytes), /resolve exactly once; found 2/);
    const duplicateQuote = modifiedClement((text) => { text.sections[15].paragraphs[0] += definition.excerpts[1].exact; });
    assert.throws(() => verifyInvestigation(duplicateQuote.draft, duplicateQuote.bytes), /Quotation must match exactly once/);
  });

  it("rejects missing artifacts, incorrect source identity, and broken evidence references", () => {
    const missing = artifacts();
    missing.delete(definition.sources[0].id);
    assert.throws(() => verifyInvestigation(definition, missing), /missing artifact/);
    const wrongWork = modifiedClement((text) => { text.id = "2clement"; });
    assert.throws(() => verifyInvestigation(wrongWork.draft, wrongWork.bytes), /Source identity mismatch/);
    const draft = structuredClone(definition);
    draft.claims[0].evidenceIds.push("invented-source");
    assert.throws(() => verifyInvestigation(draft, artifacts()), /reference existing evidence/);
    draft.claims = [];
    assert.throws(() => verifyInvestigation(draft, artifacts()), /unique IDs/);
  });

  it("rejects invalid one-based locators and source/locator kind mismatches", () => {
    for (const chapter of [0, -1, 1.5]) {
      const draft = structuredClone(definition);
      draft.excerpts[0].locator.chapter = chapter;
      assert.throws(() => verifyInvestigation(draft, artifacts()), /Invalid chapter/);
    }
    const draft = structuredClone(definition);
    draft.excerpts[0].locator = { kind: "paragraph", chapter: 53, paragraph: 1 };
    assert.throws(() => verifyInvestigation(draft, artifacts()), /Locator does not match/);
  });

  it("invalidates a packet hash when editorial content changes without promoting its review", () => {
    const draft = structuredClone(definition);
    draft.claims[0].statement += " Changed editorial assertion.";
    const changed = verifyInvestigation(draft, artifacts());
    assert.notEqual(changed.verification.contentHash, verifyInvestigation(definition, artifacts()).verification.contentHash);
    assert.equal(changed.editorialReview.status, "draft");
  });

  it("makes deterministic exports and retains attribution, limits, and reproducible hashes", () => {
    const packet = verifyInvestigation(definition, artifacts());
    const reordered = Object.fromEntries(Object.entries(definition).reverse()) as InvestigationDefinition;
    assert.equal(verifyInvestigation(reordered, artifacts()).verification.contentHash, packet.verification.contentHash);
    const { verification, ...content } = packet;
    assert.equal(sha256(canonicalJson(content)), verification.contentHash);
    assert.deepEqual(JSON.parse(readFileSync(`public/investigations/${packet.id}.json`, "utf8")), packet);
    const markdown = investigationMarkdown(packet);
    assert.equal(readFileSync(`public/investigations/${packet.id}.md`, "utf8"), markdown);
    assert.ok(markdown.includes(packet.sources[1].attribution));
    assert.ok(markdown.includes(packet.relationship.limits));
    assert.ok(markdown.includes(packet.verification.contentHash));
    assert.ok(markdown.includes("Editorial review: draft"));
  });
});
