import fs from "node:fs";
import path from "node:path";
import { EvidenceEngine } from "./find-engine";
import type {
  EvidenceQuery,
  EvidenceRun,
} from "../../src/lib/evidence-explorer";
import { digest } from "../../src/lib/find-server/sources";
import { writeJson } from "./storage";

export type SearchCase = {
  id: string;
  group: string;
  family: string;
  split: "development" | "held-out";
  request: EvidenceQuery & { fixture?: string };
};
export type Review = {
  queryId: string;
  passageId: string;
  sourceHash: string;
  grade: 0 | 1 | 2 | 3;
  reviewer: string;
  date: string;
  notes: string;
};
export type Adjudication = Review & { reviewers: [string, string] };
export type SearchObservation = {
  queryId: string;
  group: string;
  family: string;
  split: string;
  variant: string;
  milliseconds: number;
  run: EvidenceRun;
};
export function validateCases(cases: SearchCase[]) {
  if (cases.length !== 100 || new Set(cases.map((c) => c.id)).size !== 100)
    throw new Error("Expected 100 distinct query cases.");
  const groups = new Map<string, string>();
  for (const c of cases) {
    if (groups.has(c.group) && groups.get(c.group) !== c.split)
      throw new Error("Query group crosses splits.");
    groups.set(c.group, c.split);
  }
  if (
    cases.filter((c) => c.split === "development").length !== 50 ||
    cases.filter((c) => c.split === "held-out").length !== 50
  )
    throw new Error("Expected equal development and held-out splits.");
}
export function acceptedLabels(
  reviews: Review[],
  adjudications: Adjudication[],
) {
  const grouped = new Map<string, Review[]>();
  for (const r of reviews) {
    if (
      !r.reviewer.trim() ||
      !r.notes.trim() ||
      !Number.isFinite(Date.parse(r.date)) ||
      ![0, 1, 2, 3].includes(r.grade)
    )
      throw new Error("Review identity, date, grade and notes are required.");
    const key = `${r.queryId}:${r.passageId}`;
    const rows = grouped.get(key) ?? [];
    if (rows.some((p) => p.reviewer === r.reviewer))
      throw new Error(
        "Duplicate reviewer judgment; keep one final judgment per reviewer.",
      );
    rows.push(r);
    grouped.set(key, rows);
  }
  const accepted = new Map<string, Review>();
  for (const [key, rows] of grouped) {
    if (rows.length !== 2 || rows[0].sourceHash !== rows[1].sourceHash)
      continue;
    if (rows[0].grade === rows[1].grade) {
      accepted.set(key, rows[0]);
      continue;
    }
    const final = adjudications.filter(
      (a) => `${a.queryId}:${a.passageId}` === key,
    );
    if (final.length !== 1) continue;
    const a = final[0];
    if (
      !a.reviewer.trim() ||
      !a.notes.trim() ||
      !Number.isFinite(Date.parse(a.date)) ||
      ![0, 1, 2, 3].includes(a.grade) ||
      a.sourceHash !== rows[0].sourceHash ||
      new Set(a.reviewers).size !== 2 ||
      rows.some((r) => !a.reviewers.includes(r.reviewer))
    )
      throw new Error("Invalid adjudication.");
    accepted.set(key, a);
  }
  return accepted;
}
export function scoreObservation(
  row: SearchObservation,
  labels: Map<string, Review>,
) {
  const hits = row.run.hits;
  const label = (id: string, hash: string) => {
    const r = labels.get(`${row.queryId}:${id}`);
    return r?.sourceHash === hash ? r.grade : undefined;
  };
  const grades = hits.map((h) => label(h.block.id, h.block.artifactHash));
  const known = [...labels.values()].filter(
    (l) => l.queryId === row.queryId && l.grade >= 2,
  );
  const found = known.filter((l) =>
    hits.some(
      (h) =>
        h.block.id === l.passageId && h.block.artifactHash === l.sourceHash,
    ),
  ).length;
  const top = grades.slice(0, 5),
    ten = grades.slice(0, 10);
  const precision5 =
    top.length > 0 && top.every((g) => g !== undefined)
      ? top.filter((g) => g! >= 2).length / 5
      : null;
  const dcg = (gs: number[]) =>
    gs.reduce((s, g, i) => s + (2 ** g - 1) / Math.log2(i + 2), 0);
  const ideal = dcg(
    [...labels.values()]
      .filter((l) => l.queryId === row.queryId)
      .map((l) => l.grade)
      .sort((a, b) => b - a)
      .slice(0, 10),
  );
  const ndcg10 =
    ten.length > 0 && ten.every((g) => g !== undefined) && ideal > 0
      ? dcg(ten as number[]) / ideal
      : null;
  return {
    queryId: row.queryId,
    variant: row.variant,
    family: row.family,
    candidates: hits.length,
    reviewed: grades.filter((g) => g !== undefined).length,
    top20Reviewed: grades.slice(0, 20).filter((g) => g !== undefined).length,
    precision5,
    ndcg10,
    knownTargets: known.length,
    foundTargets: found,
    knownTargetCoverage: known.length ? found / known.length : null,
    milliseconds: row.milliseconds,
    issues: row.run.issues,
  };
}

const PILOT = path.resolve("scripts/research/search-pilot"),
  OUT = path.resolve(".research/search-benchmark");
async function main() {
  const command = process.argv[2],
    args = process.argv.slice(3);
  const option = (key: string, fallback: string) =>
    args.find((a) => a.startsWith(`--${key}=`))?.slice(key.length + 3) ??
    fallback;
  const manifest = fs.readFileSync(path.join(PILOT, "queries.json"), "utf8");
  const cases = JSON.parse(manifest).cases as SearchCase[];
  validateCases(cases);
  const config = {
    limit: 200,
    variants: ["baseline", "context"],
    model: "jev-1.13.0",
    rubric: "find-relevance-v1",
    engineHash: digest(fs.readFileSync("scripts/research/find-engine.ts")),
    corpusHash: digest(JSON.stringify([
      "public/scriptures/canons.json", "public/scriptures/semantic/manifest.json",
      "public/semantic-corpora/manifest.json", "scripts/research/search-pilot/general-text.txt",
      ...["public/scriptures/text/web", "public/early/texts"].flatMap(dir => fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort().map(f => `${dir}/${f}`)),
    ].map(file => [file, digest(fs.readFileSync(file))]))),
  };
  const frozen = path.join(OUT, "frozen.json");
  if (command === "collect") {
    const split = option("split", "development"),
      count = Number(option("count", "50"));
    if (
      !["development", "held-out"].includes(split) ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 50
    )
      throw new Error("Choose a split and a count of 1–50.");
    if (split === "held-out") {
      if (!fs.existsSync(frozen))
        throw new Error(
          "Freeze reviewed development results before opening held-out retrieval.",
        );
      const f = JSON.parse(fs.readFileSync(frozen, "utf8"));
      if (
        f.manifestHash !== digest(manifest) ||
        f.configHash !== digest(JSON.stringify(config))
      )
        throw new Error("Frozen benchmark changed.");
    }
    const engine = new EvidenceEngine(process.cwd(), path.join(OUT, "runs"));
    try {
      for (const c of cases.filter((c) => c.split === split).slice(0, count))
        for (const variant of config.variants) {
          const destination = path.join(OUT, split, `${c.id}-${variant}.json`);
          if (fs.existsSync(destination) && !args.includes("--refresh")) {
            console.log(`Already collected ${c.id} ${variant}`);
            continue;
          }
          const request = { ...c.request };
          if (request.fixture) {
            if (request.fixture !== "general-text.txt")
              throw new Error("Unknown fixture.");
            request.text = fs.readFileSync(
              path.join(PILOT, request.fixture),
              "utf8",
            );
            delete request.fixture;
          }
          const start = performance.now(),
            run = await engine.search(request, undefined, {
              limit: config.limit,
              contextWords: variant === "context",
            });
          writeJson(destination, {
            queryId: c.id,
            group: c.group,
            family: c.family,
            split,
            variant,
            milliseconds: performance.now() - start,
            manifestHash: digest(manifest),
            configHash: digest(JSON.stringify(config)),
            run,
          });
          console.log(
            `${c.id} ${variant}: ${run.hits.length} candidates; ${run.issues.length} issues`,
          );
        }
    } finally {
      await engine.dispose();
    }
  } else if (
    command === "packet" ||
    command === "score" ||
    command === "freeze"
  ) {
    const split = option("split", "development"),
      dir = path.join(OUT, split);
    if (!["development", "held-out"].includes(split))
      throw new Error("Invalid split.");
    const rows = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map(
        (f) =>
          JSON.parse(
            fs.readFileSync(path.join(dir, f), "utf8"),
          ) as SearchObservation & { manifestHash: string; configHash: string },
      );
    if (
      rows.some(
        (r) =>
          r.manifestHash !== digest(manifest) ||
          r.configHash !== digest(JSON.stringify(config)),
      )
    )
      throw new Error("Stale benchmark observations; recollect.");
    const reviewFile = path.join(OUT, "reviews.json");
    if (command === "packet") {
      const pool = new Map<string, unknown>();
      for (const row of rows)
        for (const h of row.run.hits.slice(
          0,
          args.includes("--all-candidates") ? 200 : 20,
        ))
          pool.set(`${row.queryId}:${h.block.id}`, {
            queryId: row.queryId,
            query: row.run.request.query,
            passageId: h.block.id,
            sourceHash: h.block.artifactHash,
            passage: h.block.text,
            context: h.block.context,
            edition: h.block.edition,
            source: h.block.source,
            grade: null,
            reviewer: "",
            date: "",
            notes: "",
          });
      writeJson(path.join(OUT, `${split}-review-packet.json`), {
        status:
          "Unlabeled; two independent reviewers required. Add nominated missing passages with exact source hashes before scoring.",
        records: [...pool.values()],
      });
      console.log(`Prepared ${pool.size} ungraded candidate records.`);
      return;
    }
    const input = fs.existsSync(reviewFile)
      ? JSON.parse(fs.readFileSync(reviewFile, "utf8"))
      : { reviews: [], adjudications: [] };
    const labels = acceptedLabels(input.reviews, input.adjudications);
    // Related positive source passages must not leak between development and held-out.
    const memberships = new Map<string, Set<string>>();
    for (const r of labels.values())
      if (r.grade >= 2) {
        const c = cases.find((c) => c.id === r.queryId);
        if (!c) throw new Error("Unknown reviewed query.");
        const splits = memberships.get(r.passageId) ?? new Set();
        splits.add(c.split);
        memberships.set(r.passageId, splits);
      }
    if ([...memberships.values()].some((s) => s.size > 1))
      throw new Error(
        "Relevant passage crosses splits; revise grouping and restart before quality reporting.",
      );
    const scored = rows.map((r) => scoreObservation(r, labels));
    const expected = new Set(
      cases
        .filter((c) => c.split === split)
        .flatMap((c) => config.variants.map((v) => `${c.id}:${v}`)),
    );
    const observed = new Set(rows.map((r) => `${r.queryId}:${r.variant}`));
    const full =
      observed.size === expected.size &&
      rows.length === expected.size &&
      [...observed].every((k) => expected.has(k)) &&
      scored.every(
        (s) =>
          s.top20Reviewed === Math.min(20, s.candidates) &&
          s.precision5 !== null &&
          s.issues.length === 0,
      );
    const report = {
      status: full
        ? "reviewed; adoption decision still requires paired comparison"
        : "incomplete; quality not established",
      providerOperations: 0,
      acceptedLabels: labels.size,
      scope:
        "Coverage is relative to adjudicated/nominated targets, not exhaustive corpus recall. nDCG uses the adjudicated pool. No review is inferred for unlabeled passages.",
      results: scored,
    };
    writeJson(path.join(OUT, `${split}-scores.json`), report);
    if (command === "freeze") {
      if (split !== "development" || !full)
        throw new Error(
          "Complete and adjudicate all development observations before freezing.",
        );
      writeJson(frozen, {
        date: new Date().toISOString(),
        manifestHash: digest(manifest),
        configHash: digest(JSON.stringify(config)),
        reviewHash: digest(fs.readFileSync(reviewFile)),
        config,
      });
    }
    console.log(
      JSON.stringify({
        status: report.status,
        observations: rows.length,
        acceptedLabels: labels.size,
      }),
    );
  } else
    throw new Error(
      "Use collect [--split=development --count=50], packet, score, or freeze. All output stays in .research/search-benchmark.",
    );
}
if (process.argv[1]?.endsWith("search-benchmark.ts"))
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
