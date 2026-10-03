#!/usr/bin/env node
/**
 * Extract every graded claim on the site into one registry.
 *
 * Purely mechanical: each claim is carried across in the wording its own room
 * already publishes, with its existing grade, sources, and stated limit. No
 * claim is authored, reworded, or re-graded here — if a room's copy changes,
 * the registry changes with it, and the drift test fails if the committed file
 * has fallen behind.
 *
 * Sources:
 *   public/angels/fall.json    fragment steps, textual axis
 *   public/angels/order.json   the ranks, textual axis
 *   public/apostles/twelve.json  where each was sent and how each died,
 *                                attestation axis
 *
 * Deliberately excluded: public/word/ledger.json. That ledger grades the
 * copyright and permission status of translations — who owns a text and what
 * may be quoted. It is not a historical claim with an evidence weight, and
 * giving it one would be a category error dressed as consistency.
 *
 * Output: public/meta/claims.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeStableJson } from "./stable-stamp.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "public/meta/claims.json");

const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const flatten = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

/**
 * Drop keys whose value is undefined, so the object this returns is exactly
 * what lands in the file. Without it, the in-memory claim carries
 * `limit: undefined` while the committed JSON has no `limit` at all, and the
 * drift test compares two things that were never the same shape.
 */
const claim = (fields) =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

/**
 * "1 Peter 5:13; Ignatius, To the Romans 4 (~110)" is one field holding
 * several named witnesses. Splitting on the semicolon the data already uses
 * gives each one its own row without inventing structure that is not there.
 */
const namedSources = (earliest, url) => {
  const parts = flatten(earliest)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return url ? [{ label: url, url }] : [];
  // The single published URL belongs to the whole citation string, so it is
  // attached to the first witness rather than duplicated across all of them.
  return parts.map((label, index) => (index === 0 && url ? { label, url } : { label }));
};

function collectAngels() {
  const claims = [];

  const fall = readJson("public/angels/fall.json");
  for (const step of fall.steps) {
    if (!step.evidence) continue;
    claims.push(claim({
      id: `angels-fall-${step.id}`,
      world: "angels",
      subject: flatten(step.title),
      text: flatten(step.note),
      basis: { axis: "textual", grade: step.evidence.status },
      sources: [
        { label: flatten(step.cite), ...(step.sourceUrl ? { url: step.sourceUrl } : {}) },
      ],
      refs: [step.ref, step.second?.ref].filter(Boolean),
      limit: flatten(step.evidence.note) || undefined,
      href: `/angels/fall#${step.id}`,
    }));
  }

  const order = readJson("public/angels/order.json");
  for (const band of order.bands) {
    if (!band.evidence) continue;
    claims.push(claim({
      id: `angels-order-${band.id}`,
      world: "angels",
      subject: flatten(band.name),
      text: flatten(band.line),
      basis: { axis: "textual", grade: band.evidence.status },
      sources: [],
      refs: band.refs ?? [],
      limit: flatten(band.evidence.note) || undefined,
      href: `/angels#band-${band.id}`,
    }));
  }

  return claims;
}

function collectApostles() {
  const data = readJson("public/apostles/twelve.json");
  const apostles = data.apostles ?? data.twelve ?? data;
  const claims = [];

  for (const apostle of apostles) {
    (apostle.sent ?? []).forEach((sent, index) => {
      claims.push(claim({
        id: `apostles-sent-${apostle.id}-${index}`,
        world: "apostles",
        subject: `${apostle.name} — where he was sent`,
        text: flatten(sent.claim),
        basis: { axis: "attestation", grade: sent.weight },
        sources: namedSources(sent.earliest, sent.sourceUrl),
        refs: [],
        limit: flatten(sent.note) || undefined,
        href: `/apostles/twelve#${apostle.id}`,
      }));
    });

    if (apostle.death) {
      claims.push(claim({
        id: `apostles-death-${apostle.id}`,
        world: "apostles",
        subject: `${apostle.name} — how he died`,
        text: flatten(apostle.death.claim),
        basis: { axis: "attestation", grade: apostle.death.weight },
        sources: namedSources(apostle.death.earliest, apostle.death.sourceUrl),
        refs: [],
        limit: flatten(apostle.death.note) || undefined,
        href: `/apostles/twelve#${apostle.id}`,
      }));
    }
  }

  return claims;
}

export function buildClaims(generatedAt) {
  const claims = [...collectAngels(), ...collectApostles()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const seen = new Set();
  for (const claim of claims) {
    if (seen.has(claim.id)) throw new Error(`duplicate claim id: ${claim.id}`);
    seen.add(claim.id);
    if (!claim.text) throw new Error(`${claim.id} has no claim text`);
    if (!claim.basis.grade) throw new Error(`${claim.id} has no grade`);
  }

  return {
    schemaVersion: 1,
    generatedBy: "scripts/site/build-claims.mjs",
    generatedAt,
    claims,
  };
}

const generatedAtOpt = process.argv
  .slice(2)
  .find((argument) => argument.startsWith("--generated-at="));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const registry = buildClaims(
    generatedAtOpt
      ? generatedAtOpt.slice(15)
      : new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z"),
  );
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // Keeps the previous timestamp when the claims themselves are unchanged, so
  // a build does not dirty the worktree for a stamp nobody asked to move.
  writeStableJson(OUT, registry);
  const byAxis = registry.claims.reduce((counts, claim) => {
    counts[claim.basis.axis] = (counts[claim.basis.axis] ?? 0) + 1;
    return counts;
  }, {});
  console.log(
    `${registry.claims.length} graded claims — ${Object.entries(byAxis)
      .map(([axis, n]) => `${n} ${axis}`)
      .join(", ")}`,
  );
}
