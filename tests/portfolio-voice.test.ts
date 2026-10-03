import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import * as portfolioContent from "../src/lib/portfolio-content";
import truthBank from "../src/lib/portfolio-truth.json";
import {
  extractVisitorText,
  scanPortfolioSources,
  scanSourceText,
} from "../scripts/check-voice";

type ResumeExport = {
  experience: Array<{
    id: string;
    period: string;
    role: string;
    organization: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    credential: string;
    year: string;
  }>;
};

function violationIds(source: string): string[] {
  return scanSourceText(source).violations.map((finding) => finding.ruleId);
}

describe("portfolio voice scanner", () => {
  it("reads AST visitor copy without scanning comments, imports, keys, or styling attributes", () => {
    const source = `
      import safe from "./throughline-range-is-an-asset";
      // throughline, range is an asset, and 15+ years are historical notes.
      const record = { "throughline": safe, className: "range is an asset" };
      export default function Sample() {
        return <p className="throughline">Plain, factual copy.</p>;
      }
    `;

    assert.deepEqual(scanSourceText(source).violations, []);
    assert.deepEqual(
      extractVisitorText(source).map((item) => item.text),
      ["Plain, factual copy."],
    );
  });

  it("catches every exact historical phrase ban in visitor-facing copy", () => {
    const samples: Array<[string, string]> = [
      ["The throughline is customer trust.", "voice/throughline"],
      ["This is where range is an asset.", "voice/range-is-an-asset"],
      ["I shipped it end to end.", "voice/end-to-end"],
      ["I shipped it end-to-end.", "voice/end-to-end"],
      ["I shipped it end–to–end.", "voice/end-to-end"],
      [
        "Electronics Technician / Specialty",
        "voice/electronics-technician-specialty",
      ],
      // Garo named both of these himself. Neither was in the ban-list, so the
      // gate that exists to keep them out could not have caught them coming
      // back.
      ["I keep an eye on the pipeline.", "voice/an-eye-on"],
      ["I was the glue between them.", "voice/the-glue-between"],
      // The objection is to calling himself glue at all, not to that one word
      // order, so what follows "between" does not matter.
      ["I was the glue between the two teams.", "voice/the-glue-between"],
      ["I was the glue-between design and delivery.", "voice/the-glue-between"],
    ];

    for (const [copy, expectedRule] of samples) {
      assert.ok(
        violationIds(`export const copy = ${JSON.stringify(copy)};`).includes(
          expectedRule,
        ),
        copy,
      );
    }

    // The rating alone is the public record and stays allowed.
    assert.deepEqual(
      violationIds(
        'export const copy = "United States Navy Electronics Technician, February 2003 to August 2008.";',
      ),
      [],
    );
  });

  it("catches banned copy split across inline JSX markup", () => {
    const result = scanSourceText(`
      export default function Sample() {
        return <p>Range <strong>is</strong> an asset.</p>;
      }
    `);

    assert.ok(
      result.violations.some(
        (finding) => finding.ruleId === "voice/range-is-an-asset",
      ),
    );
  });

  it("rejects prose tenure counts while allowing exact dates and 24/7/365", () => {
    for (const copy of [
      "15+ years customer-facing",
      "over 10 years in field service",
      "two years of deployment work",
    ]) {
      assert.ok(
        violationIds(`export const copy = ${JSON.stringify(copy)};`).includes(
          "voice/tenure-year-count",
        ),
        copy,
      );
    }

    const allowed = scanSourceText(`
      export const dates = [
        "Feb 2003 - Aug 2008",
        "2003–2008",
        "Jul 2026 - Present",
        "24/7/365 coverage",
        "Since December 2024",
      ];
    `);
    assert.deepEqual(allowed.violations, []);
  });

  it("rejects unsupported truth claims but permits explicit public denials", () => {
    const badSamples: Array<[string, string]> = [
      ["JobPilot has 50 paid users.", "truth/paid-or-active-users"],
      ["JobPilot has 50 active users.", "truth/paid-or-active-users"],
      ["JobPilot generated $20,000 in revenue.", "truth/revenue"],
      ["JobPilot reached $5,000 ARR.", "truth/revenue"],
      ["JobPilot reports $500 MRR.", "truth/revenue"],
      ["JobPilot has enterprise adoption.", "truth/enterprise-adoption"],
      [
        "JobPilot was adopted across three enterprises.",
        "truth/enterprise-adoption",
      ],
      [
        "Managed a team of field service engineers.",
        "truth/field-engineer-management",
      ],
      [
        "Team lead for field service engineers.",
        "truth/field-engineer-management",
      ],
      ["Led the field engineering team.", "truth/field-engineer-management"],
      [
        "Manager of a team of field engineers.",
        "truth/field-engineer-management",
      ],
      ["Holds an active security clearance.", "truth/current-clearance"],
      ["Current security clearance.", "truth/current-clearance"],
      ["Security clearance is active.", "truth/current-clearance"],
      [
        "JobPilot auto-submits applications.",
        "truth/jobpilot-auto-submission",
      ],
      [
        "JobPilot submits applications automatically.",
        "truth/jobpilot-auto-submission",
      ],
      [
        "JobPilot automatically applies to jobs.",
        "truth/jobpilot-auto-submission",
      ],
      [
        "JobPilot applies on your behalf.",
        "truth/jobpilot-auto-submission",
      ],
    ];

    for (const [copy, expectedRule] of badSamples) {
      assert.ok(
        violationIds(`export const copy = ${JSON.stringify(copy)};`).includes(
          expectedRule,
        ),
        copy,
      );
    }

    assert.ok(
      violationIds(
        'export const copy = "Not a toy; JobPilot has revenue.";',
      ).includes("truth/revenue"),
      "an unrelated negation must not excuse an affirmative claim",
    );
    assert.ok(
      violationIds(
        'export const copy = "No paid users yet, but JobPilot has revenue.";',
      ).includes("truth/revenue"),
      "a contrasting clause must not inherit an earlier denial",
    );

    const boundaries = scanSourceText(`
      export const boundaries = [
        "No paid users, revenue, or enterprise adoption claimed.",
        "No auto-submit claim: the human submits the application.",
        "No current security clearance is claimed.",
        "He was not a manager of field service engineers.",
      ];
    `);
    assert.deepEqual(boundaries.violations, []);
  });

  it("emits nonfatal warnings for unreviewed marketing metrics", () => {
    const result = scanSourceText(`
      export const claims = ["42% faster", "3x throughput", "500+ workflows"];
    `);

    assert.deepEqual(result.violations, []);
    assert.deepEqual(
      new Set(result.warnings.map((finding) => finding.ruleId)),
      new Set([
        "drift/percentage",
        "drift/multiplier",
        "drift/count-plus",
      ]),
    );

    const reviewed = scanSourceText(
      'export const claim = "Search over 1,200+ of my own documents.";',
    );
    assert.deepEqual(reviewed.warnings, []);

    const mixed = scanSourceText(
      'export const claim = "500+ workflows alongside 1,200+ of my own documents.";',
    );
    assert.ok(
      mixed.warnings.some(
        (finding) =>
          finding.ruleId === "drift/count-plus" &&
          finding.matchedText.startsWith("500+"),
      ),
      "a reviewed metric must not mask another count in the same text node",
    );
    assert.ok(
      scanSourceText(
        'export const claim = "Search over 1,201+ of my own documents.";',
      ).warnings.some((finding) => finding.ruleId === "drift/count-plus"),
      "only the exact reviewed lower-bound claim is suppressed",
    );
  });

  it("keeps the real portfolio corpus free of hard violations", () => {
    const result = scanPortfolioSources();
    assert.deepEqual(
      result.violations,
      [],
      result.violations
        .map(
          (finding) =>
            `${finding.file}:${finding.line} [${finding.ruleId}] ${finding.sourceText}`,
        )
        .join("\n"),
    );
    assert.ok(
      result.warnings.every((finding) => finding.severity === "warning"),
    );
  });
});

describe("public portfolio truth bank", () => {
  it("contains only the explicitly public schema", () => {
    assert.equal(truthBank.schemaVersion, 1);
    assert.match(truthBank.publicOnlyNotice, /Public portfolio facts only/);
    assert.deepEqual(Object.keys(truthBank).sort(), [
      "identity",
      "jobPilot",
      "ownerAttestations",
      "publicOnlyNotice",
      "resume",
      "reviewedAt",
      "reviewedMetrics",
      "schemaVersion",
      "voice",
    ]);
    assert.deepEqual(truthBank.reviewedMetrics, [
      {
        id: "local-rag-document-count",
        claim: "1,200+ of my own documents",
        basis:
          "The recorded Chroma RAG inventory contained 1,242 document stubs, so the public claim is a conservative lower bound.",
        observedCount: 1242,
        evidencePath:
          "~/AI_Workspace/session-logs/_archive/2026-05-29.md",
        evidenceDate: "2026-05-29",
      },
    ]);
    assert.deepEqual(truthBank.ownerAttestations.siteFunding, {
      claim:
        "garovartabedian.com is a self-funded passion project and was not commissioned by a client.",
      attestedBy: "Garo Vartabedian",
      attestedAt: "2026-08-31",
    });
  });

  it("locks public identity, contact, and location to PROFILE", () => {
    const { PROFILE } = portfolioContent;
    assert.equal(PROFILE.name, truthBank.identity.name);
    assert.equal(PROFILE.role, truthBank.identity.role);
    assert.equal(PROFILE.location, truthBank.identity.location);
    assert.equal(PROFILE.links.email, truthBank.identity.contact.email);
    assert.equal(PROFILE.links.phone, truthBank.identity.contact.phone);
    assert.equal(PROFILE.links.linkedin, truthBank.identity.contact.linkedin);
    assert.equal(PROFILE.links.github, truthBank.identity.contact.github);
  });

  it("locks every public résumé entry and education record to RESUME", () => {
    const resume = (
      portfolioContent as typeof portfolioContent & { RESUME?: ResumeExport }
    ).RESUME;
    assert.ok(resume, "portfolio-content.ts must export canonical RESUME data");

    assert.deepEqual(
      resume.experience.map(({ id, period, role, organization }) => ({
        id,
        period,
        role,
        organization,
      })),
      truthBank.resume.experience,
    );
    assert.deepEqual(
      resume.education.map(({ id, school, credential, year }) => ({
        id,
        school,
        credential,
        year,
      })),
      truthBank.resume.education,
    );
  });

  it("locks JobPilot's public status and human-review boundary", () => {
    const jobPilot = portfolioContent.PROJECTS.find(
      (project) => project.name === truthBank.jobPilot.name,
    );
    assert.ok(jobPilot, "JobPilot must remain in PROJECTS");
    assert.equal(jobPilot.status, truthBank.jobPilot.status);

    const publicCopy = `${jobPilot.tagline} ${jobPilot.desc}`;
    assert.equal(truthBank.jobPilot.humanReviewRequired, true);
    assert.equal(truthBank.jobPilot.humanSubmissionRequired, true);
    assert.equal(truthBank.jobPilot.automaticSubmission, false);
    assert.match(publicCopy, /human in the loop/i);
    assert.match(publicCopy, /person reviews every submission/i);

    const jobPilotPage = readFileSync(
      path.join(process.cwd(), "src/app/work/jobpilot/page.tsx"),
      "utf8",
    );
    const visitorCopy = extractVisitorText(
      jobPilotPage,
      "src/app/work/jobpilot/page.tsx",
    )
      .map((item) => item.text)
      .join(" ");
    assert.match(visitorCopy, /the human submits it/i);
    assert.match(visitorCopy, /No auto-submit claim/i);
  });
});
