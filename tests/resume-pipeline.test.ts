import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CONTACT_METHODS, RESUME } from "../src/lib/portfolio-content";
import {
  collectResumeArtifactState,
  normalizeResumeUrl,
  RESUME_MANIFEST_PATH,
  type ResumeArtifactManifest,
} from "../scripts/site/resume-artifact";

describe("canonical public resume", () => {
  it("keeps the complete public timeline in one ordered dataset", () => {
    assert.deepEqual(
      RESUME.experience.map(({ id, period }) => ({ id, period })),
      [
        { id: "independent-developer", period: "May 2022 - Present" },
        { id: "overnight-valet", period: "Jul 2026 - Present" },
        { id: "independent-freelance", period: "2020 - 2022" },
        { id: "field-service", period: "Oct 2016 - Jul 2020" },
        { id: "sales-business-development", period: "2013 - 2016" },
        { id: "full-time-student", period: "2009 - 2013" },
        { id: "customer-service", period: "Nov 2008 - Jun 2009" },
        { id: "navy-electronics", period: "Feb 2003 - Aug 2008" },
      ],
    );
    assert.equal(RESUME.education.length, 2);
    assert.ok(
      RESUME.experience
        .find(({ id }) => id === "independent-developer")
        ?.bullets.some((bullet) => bullet.includes("Since December 2024")),
      "AI work must retain its December 2024 boundary",
    );
    assert.equal(
      RESUME.experience.find(({ id }) => id === "navy-electronics")?.role,
      "Electronics Technician",
    );
  });

  it("derives every public contact method from PROFILE", () => {
    assert.deepEqual(
      CONTACT_METHODS.map(({ id, display, href }) => ({ id, display, href })),
      [
        {
          id: "email",
          display: "garo.vartabed@gmail.com",
          href: "mailto:garo.vartabed@gmail.com",
        },
        {
          id: "phone",
          display: "718-872-8578",
          href: "tel:+17188728578",
        },
        {
          id: "linkedin",
          display: "linkedin.com/in/garovartabedian",
          href: "https://www.linkedin.com/in/garovartabedian",
        },
        {
          id: "github",
          display: "github.com/Vartabg",
          href: "https://github.com/Vartabg",
        },
      ],
    );
  });
});

describe("resume PDF artifact lock", () => {
  it("accepts only canonical safe link schemes", () => {
    assert.equal(
      normalizeResumeUrl("https://example.com"),
      "https://example.com/",
    );
    assert.equal(
      normalizeResumeUrl("mailto:garo.vartabed@gmail.com"),
      "mailto:garo.vartabed@gmail.com",
    );
    assert.equal(normalizeResumeUrl("tel:+17188728578"), "tel:+17188728578");

    for (const unsafe of [
      "http://example.com",
      "javascript:alert(1)",
      "https://user:secret@example.com",
      "mailto:not-an-address",
      "tel:718-872-8578",
    ]) {
      assert.throws(() => normalizeResumeUrl(unsafe), unsafe);
    }
  });

  it("matches canonical data, semantic text, links, page count, and hashes", () => {
    const snapshot = JSON.parse(
      readFileSync(RESUME_MANIFEST_PATH, "utf8"),
    ) as ResumeArtifactManifest;
    assert.deepEqual(snapshot, collectResumeArtifactState());
  });
});
