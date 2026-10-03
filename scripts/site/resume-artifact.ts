import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTACT_METHOD_BY_ID,
  CONTACT_METHODS,
  PROFILE,
  PROJECTS,
  RESUME,
  type Project,
} from "../../src/lib/portfolio-content";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const RESUME_PDF_PATH = path.join(
  ROOT,
  "public/Garo-Vartabedian-Resume.pdf",
);
export const RESUME_MANIFEST_PATH = path.join(
  ROOT,
  "public/meta/resume-artifact.json",
);
export const RESUME_CONVERTER_PATH = path.join(
  ROOT,
  "scripts/site/make-pdf.sh",
);

const SITE_URL = "https://garovartabedian.com";
const GENERATED_BY = "scripts/site/build-resume.ts";

export type ResumeArtifactManifest = {
  schemaVersion: 1;
  generatedBy: typeof GENERATED_BY;
  sourceSha256: string;
  htmlSha256: string;
  pdfSha256: string;
  normalizedTextSha256: string;
  converterSha256: string;
  renderer: string;
  pageCount: number;
  urls: string[];
};

export type ResumePdfInspection = {
  pdfSha256: string;
  normalizedText: string;
  normalizedTextSha256: string;
  renderer: string;
  pageCount: number;
  urls: string[];
};

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeResumeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u00ad/g, "")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function getResumeProjects(): Project[] {
  const projectsByName = new Map(PROJECTS.map((project) => [project.name, project]));
  return RESUME.technicalProofProjectNames.map((name) => {
    const project = projectsByName.get(name);
    if (!project) {
      throw new Error(`Resume project is missing from PROJECTS: ${name}`);
    }
    return project;
  });
}

function absoluteSiteUrl(href: string): string {
  return href.startsWith("http") ? href : `${SITE_URL}${href}`;
}

export function normalizeResumeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Resume URL is invalid: ${value}`);
  }

  if (url.protocol === "https:") {
    if (url.username || url.password) {
      throw new Error(`Resume URL may not contain credentials: ${value}`);
    }
  } else if (url.protocol === "mailto:") {
    if (!/^mailto:[^?@\s]+@[^?@\s]+$/i.test(value)) {
      throw new Error(`Resume mail link is invalid: ${value}`);
    }
  } else if (url.protocol === "tel:") {
    if (!/^tel:\+\d{8,15}$/.test(value)) {
      throw new Error(`Resume phone link is invalid: ${value}`);
    }
  } else {
    throw new Error(`Resume URL must use https, mailto, or tel: ${value}`);
  }

  return url.href;
}

export function resumeProjectUrl(project: Project): string {
  return project.demoUrl ?? absoluteSiteUrl(project.href);
}

export function expectedResumeUrls(): string[] {
  return [
    ...CONTACT_METHODS.map((method) => method.href),
    absoluteSiteUrl(PROFILE.links.hire),
    ...getResumeProjects().map(resumeProjectUrl),
  ]
    .map(normalizeResumeUrl)
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .sort();
}

export function resumeTextLines(): string[] {
  const lines = [
    PROFILE.name,
    RESUME.headline,
    `${CONTACT_METHOD_BY_ID.email.display} | ${CONTACT_METHOD_BY_ID.phone.display} | ${PROFILE.location}`,
    `${CONTACT_METHOD_BY_ID.linkedin.display} | ${CONTACT_METHOD_BY_ID.github.display} | garovartabedian.com/hire`,
    "SUMMARY",
    RESUME.summary,
    "TECHNICAL PROOF",
    ...getResumeProjects().map(
      (project) => `${project.name} - ${project.tagline}`,
    ),
    "EXPERIENCE",
  ];

  for (const entry of RESUME.experience) {
    lines.push(`${entry.role} | ${entry.period}`);
    lines.push(
      entry.location
        ? `${entry.organization} | ${entry.location}`
        : entry.organization,
    );
    lines.push(entry.summary);
    lines.push(...entry.bullets.map((bullet) => `- ${bullet}`));
  }

  lines.push("EDUCATION");
  lines.push(
    ...RESUME.education.map(
      (education) =>
        `${education.school} | ${education.credential} | ${education.year}`,
    ),
  );
  return lines;
}

export function normalizedCanonicalResumeText(): string {
  return normalizeResumeText(resumeTextLines().join("\n"));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineText(value: string): string {
  return value
    .split(/(\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b)/g)
    .map((part, index) =>
      index % 2 === 1
        ? `<span class="keep-together">${escapeHtml(part)}</span>`
        : escapeHtml(part),
    )
    .join("");
}

function anchor(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

export function renderResumeHtml(): string {
  const projects = getResumeProjects();
  const experience = RESUME.experience
    .map((entry) => {
      const organization = entry.location
        ? `${entry.organization} | ${entry.location}`
        : entry.organization;
      const bullets = entry.bullets
        .map((bullet) => `<div class="bullet">- ${renderInlineText(bullet)}</div>`)
        .join("");
      return `<article class="entry">
  <div class="entry-head"><strong>${escapeHtml(entry.role)}</strong><span> | ${escapeHtml(entry.period)}</span></div>
  <div class="organization">${escapeHtml(organization)}</div>
  <div>${renderInlineText(entry.summary)}</div>
  ${bullets}
</article>`;
    })
    .join("");
  const education = RESUME.education
    .map(
      (item) =>
        `<div><strong>${escapeHtml(item.school)}</strong> | ${escapeHtml(item.credential)} | ${escapeHtml(item.year)}</div>`,
    )
    .join("");
  const technicalProof = projects
    .map(
      (project) =>
        `<div>${anchor(resumeProjectUrl(project), project.name)} - ${renderInlineText(project.tagline)}</div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(PROFILE.name)} - Resume</title>
  <style>
    @page { size: Letter; margin: 0.42in 0.55in; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { color: #20262d; font: 12px/1.22 Arial, Helvetica, sans-serif; }
    a { color: inherit; text-decoration: none; }
    header { margin-bottom: 10px; }
    h1 { color: #173f63; font-size: 23px; letter-spacing: 0.035em; line-height: 1; margin: 0 0 3px; }
    .headline { color: #35485a; font-size: 12.3px; font-weight: 700; margin-bottom: 4px; }
    .contact { color: #384550; font-size: 10.8px; margin-top: 2px; }
    h2 { border-bottom: 1px solid #245d88; color: #173f63; font-size: 11.5px; letter-spacing: 0.08em; line-height: 1.1; margin: 9px 0 5px; padding-bottom: 3px; }
    .summary { margin: 0; }
    .keep-together { white-space: nowrap; }
    .proof { display: grid; gap: 2px; }
    .entry { break-inside: avoid; margin-top: 6px; }
    .entry-head { display: block; white-space: nowrap; }
    .entry-head strong { font-size: 12.2px; }
    .entry-head span, .organization { color: #52606b; }
    .organization { font-style: italic; margin-bottom: 1px; }
    .bullet { margin: 1px 0 0 9px; padding-left: 9px; text-indent: -9px; }
    .education { display: grid; gap: 2px; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(PROFILE.name)}</h1>
    <div class="headline">${renderInlineText(RESUME.headline)}</div>
    <div class="contact">${anchor(CONTACT_METHOD_BY_ID.email.href, CONTACT_METHOD_BY_ID.email.display)} | ${anchor(CONTACT_METHOD_BY_ID.phone.href, CONTACT_METHOD_BY_ID.phone.display)} | ${escapeHtml(PROFILE.location)}</div>
    <div class="contact">${anchor(CONTACT_METHOD_BY_ID.linkedin.href, CONTACT_METHOD_BY_ID.linkedin.display)} | ${anchor(CONTACT_METHOD_BY_ID.github.href, CONTACT_METHOD_BY_ID.github.display)} | ${anchor(absoluteSiteUrl(PROFILE.links.hire), "garovartabedian.com/hire")}</div>
  </header>
  <section>
    <h2>SUMMARY</h2>
    <p class="summary">${renderInlineText(RESUME.summary)}</p>
  </section>
  <section>
    <h2>TECHNICAL PROOF</h2>
    <div class="proof">${technicalProof}</div>
  </section>
  <section>
    <h2>EXPERIENCE</h2>
    ${experience}
  </section>
  <section>
    <h2>EDUCATION</h2>
    <div class="education">${education}</div>
  </section>
</body>
</html>
`;
}

function runTextCommand(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(
      `${command} is required for resume artifact verification: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status}): ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout;
}

function parsePageCount(pdfInfo: string): number {
  const match = pdfInfo.match(/^Pages:\s+(\d+)$/m);
  if (!match) throw new Error("pdfinfo did not report a page count");
  return Number(match[1]);
}

function parsePdfInfoField(pdfInfo: string, field: string): string {
  const match = pdfInfo.match(new RegExp(`^${field}:\\s+(.+)$`, "m"));
  if (!match) throw new Error(`pdfinfo did not report ${field}`);
  return match[1].trim();
}

function parsePdfUrls(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*\d+\s+\S+\s+(\S.*)$/)?.[1]?.trim())
    .filter((url): url is string => Boolean(url))
    .map(normalizeResumeUrl)
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .sort();
}

export function inspectResumePdf(pdfPath = RESUME_PDF_PATH): ResumePdfInspection {
  const pdf = readFileSync(pdfPath);
  if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`${pdfPath} does not begin with a PDF signature`);
  }

  const normalizedText = normalizeResumeText(
    runTextCommand("pdftotext", [pdfPath, "-"]),
  );
  const info = runTextCommand("pdfinfo", [pdfPath]);
  const urls = parsePdfUrls(runTextCommand("pdfinfo", ["-url", pdfPath]));

  return {
    pdfSha256: sha256(pdf),
    normalizedText,
    normalizedTextSha256: sha256(normalizedText),
    renderer: parsePdfInfoField(info, "Creator"),
    pageCount: parsePageCount(info),
    urls,
  };
}

function resumeSourceSha256(): string {
  const publicSource = {
    profile: {
      name: PROFILE.name,
      role: PROFILE.role,
      location: PROFILE.location,
      veteran: PROFILE.veteran,
      links: PROFILE.links,
    },
    contactMethods: CONTACT_METHODS,
    resume: RESUME,
    projects: getResumeProjects().map((project) => ({
      name: project.name,
      tagline: project.tagline,
      href: project.href,
      demoUrl: project.demoUrl,
      status: project.status,
    })),
  };
  return sha256(JSON.stringify(publicSource));
}

export function collectResumeArtifactState(
  pdfPath = RESUME_PDF_PATH,
): ResumeArtifactManifest {
  const inspection = inspectResumePdf(pdfPath);
  const expectedText = normalizedCanonicalResumeText();
  if (inspection.pageCount !== 1) {
    throw new Error(`Resume PDF must be exactly one page; got ${inspection.pageCount}`);
  }
  if (inspection.normalizedText !== expectedText) {
    const missing = resumeTextLines().filter(
      (line) => !inspection.normalizedText.includes(normalizeResumeText(line)),
    );
    throw new Error(
      `Resume PDF text diverges from RESUME (${missing.length} missing canonical lines: ${missing.slice(0, 4).join(" | ")})`,
    );
  }

  const expectedUrls = expectedResumeUrls();
  if (JSON.stringify(inspection.urls) !== JSON.stringify(expectedUrls)) {
    throw new Error(
      `Resume PDF links diverge: expected ${expectedUrls.join(", ")}; got ${inspection.urls.join(", ")}`,
    );
  }

  return {
    schemaVersion: 1,
    generatedBy: GENERATED_BY,
    sourceSha256: resumeSourceSha256(),
    htmlSha256: sha256(renderResumeHtml()),
    pdfSha256: inspection.pdfSha256,
    normalizedTextSha256: inspection.normalizedTextSha256,
    converterSha256: sha256(readFileSync(RESUME_CONVERTER_PATH)),
    renderer: inspection.renderer,
    pageCount: inspection.pageCount,
    urls: inspection.urls,
  };
}
