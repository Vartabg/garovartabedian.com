#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import truthBank from "../src/lib/portfolio-truth.json";

/**
 * Deliberately bounded self-claim surfaces. Research and Scripture copy use
 * different vocabularies and must not inherit portfolio-specific voice rules.
 */
export const PORTFOLIO_SOURCE_FILES = [
  "src/lib/portfolio-content.ts",
  "src/app/layout.tsx",
  "src/app/_components/CleanChrome.tsx",
  "src/app/_components/SiteNavigation.tsx",
  "src/app/_components/StoryHome.tsx",
  "src/app/_components/sections/ReadingPaths.tsx",
  "src/app/_components/sections/WorldsRail.tsx",
  "src/app/about/page.tsx",
  "src/app/about/opengraph-image.tsx",
  "src/app/contact/page.tsx",
  "src/app/contact/opengraph-image.tsx",
  "src/app/hire/page.tsx",
  "src/app/hire/opengraph-image.tsx",
  "src/app/labs/page.tsx",
  "src/app/resume/page.tsx",
  "src/app/resume/opengraph-image.tsx",
  "src/app/services/page.tsx",
  "src/app/services/opengraph-image.tsx",
  "src/app/work/page.tsx",
  "src/app/work/opengraph-image.tsx",
  "src/app/work/eye/page.tsx",
  "src/app/work/eye/opengraph-image.tsx",
  "src/app/work/garovartabedian/page.tsx",
  "src/app/work/garovartabedian/opengraph-image.tsx",
  "src/app/work/jobpilot/page.tsx",
  "src/app/work/jobpilot/opengraph-image.tsx",
] as const;

export type FindingSeverity = "error" | "warning";

export type VoiceFinding = {
  severity: FindingSeverity;
  ruleId: string;
  description: string;
  file: string;
  line: number;
  column: number;
  matchedText: string;
  matchStart: number;
  matchEnd: number;
  sourceText: string;
};

export type VoiceScanResult = {
  violations: VoiceFinding[];
  warnings: VoiceFinding[];
  inspectedFiles: string[];
  inspectedTextNodes: number;
};

type ExtractedText = {
  file: string;
  line: number;
  column: number;
  text: string;
};

type Rule = {
  id: string;
  description: string;
  expression: RegExp;
  allowWhenDenied?: boolean;
};

const USER_FACING_JSX_ATTRIBUTES = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "placeholder",
  "title",
]);

const JSX_COPY_CONTAINERS = new Set([
  "a",
  "blockquote",
  "button",
  "caption",
  "dd",
  "dt",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "li",
  "p",
  "q",
  "summary",
  "td",
  "th",
]);

const NON_COPY_PROPERTY_VALUES = new Set([
  "@context",
  "@type",
  "accent",
  "bg",
  "canonical",
  "className",
  "cover",
  "demoUrl",
  "embedUrl",
  "href",
  "id",
  "image",
  "img",
  "ink",
  "resumePdf",
  "sourceHref",
  "src",
  "status",
  "tone",
  "type",
  "url",
]);

const NUMBER_WORD =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactPhraseExpression(phrase: string): RegExp {
  const body = phrase
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");
  return new RegExp(`\\b${body}\\b`, "i");
}

const exactPhraseIds: Record<string, string> = {
  throughline: "voice/throughline",
  "range is an asset": "voice/range-is-an-asset",
  "end to end": "voice/end-to-end",
  "an eye on": "voice/an-eye-on",
  "the glue between them": "voice/the-glue-between",
};

export const HARD_BAN_RULES: readonly Rule[] = [
  ...truthBank.voice.hardBannedPhrases.map((phrase) => ({
    id:
      exactPhraseIds[phrase] ??
      `voice/${phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    description: `Visitor-facing portfolio copy may not use “${phrase}”.`,
    expression:
      phrase === "throughline"
        ? /\bthrough[\s-]?line\b/i
        : phrase === "range is an asset"
          ? /\brange(?:\s+|[‐‑‒–—−-]+)is(?:\s+|[‐‑‒–—−-]+)an(?:\s+|[‐‑‒–—−-]+)asset\b/i
          : phrase === "end to end"
            ? /\bend(?:\s+|[‐‑‒–—−-]+)to(?:\s+|[‐‑‒–—−-]+)end\b/i
            : phrase === "the glue between them"
              ? /\bthe(?:\s+|[‐‑‒–—−-]+)glue(?:\s+|[‐‑‒–—−-]+)between\b/i
        : exactPhraseExpression(phrase),
  })),
  {
    // The public record names the rating and nothing after it. Any specialty
    // is caught without this file having to name the one that once appeared.
    id: "voice/electronics-technician-specialty",
    description:
      "Name the Navy rating only — never a specialty after “Electronics Technician /”.",
    expression: /\belectronics\s+technician\s*\/\s*\w/i,
  },
  {
    id: "voice/tenure-year-count",
    description:
      "Use verified date labels, not calculated prose tenure or year-count claims.",
    expression: new RegExp(
      [
        "\\b\\d{1,2}\\s*\\+\\s*years?\\b",
        `\\b(?:over|more\\s+than)\\s+(?:\\d{1,2}|${NUMBER_WORD})\\s+years?\\b`,
        `\\b(?:\\d{1,2}|${NUMBER_WORD})\\s+years?\\s+(?:of|in|as|customer-facing|experience)\\b`,
      ].join("|"),
      "i",
    ),
  },
];

/**
 * These expressions identify the claim itself. Explicit denials such as
 * “No paid users…” are retained because those boundaries are truthful public
 * copy, not the prohibited assertion.
 */
export const TRUTH_BOUNDARY_RULES: readonly Rule[] = [
  {
    id: "truth/paid-or-active-users",
    description: "Do not claim paid or active users without reviewed evidence.",
    expression: /\b(?:paid|active)\s+users?\b/i,
    allowWhenDenied: true,
  },
  {
    id: "truth/revenue",
    description: "Do not claim revenue, ARR, or MRR.",
    expression: /\b(?:revenue|arr|mrr)\b/i,
    allowWhenDenied: true,
  },
  {
    id: "truth/enterprise-adoption",
    description: "Do not claim enterprise adoption or enterprise customers.",
    expression: new RegExp(
      `\\b(?:enterprise\\s+(?:adoption|customers?|users?)|adopt(?:ed|ion)?\\s+(?:by|across|at|within)\\s+(?:(?:\\d[\\d,]*|${NUMBER_WORD}|several|multiple|many)\\s+)?enterprises?)\\b`,
      "i",
    ),
    allowWhenDenied: true,
  },
  {
    id: "truth/field-engineer-management",
    description:
      "Field work may describe coordination, but not team-lead or manager-of-field-engineers authority.",
    expression:
      /\b(?:(?:led|managed|supervised|headed|directed)\s+(?:(?:a|the)\s+)?(?:(?:team\s+of\s+)?field(?:\s+service)?\s+engineers?|field(?:\s+(?:service|engineering))?\s+team)|(?:team[-\s]+lead|manager)\s+(?:for|of)\s+(?:(?:a|the)\s+)?(?:team\s+of\s+)?field(?:\s+service)?\s+engineers?)\b/i,
    allowWhenDenied: true,
  },
  {
    id: "truth/current-clearance",
    description: "Do not claim a current or active security clearance.",
    expression:
      /\b(?:(?:current|active)\s+(?:security\s+)?clearance|(?:security\s+)?clearance\s+(?:is\s+)?(?:current|active)|holds?\s+(?:(?:a|an)\s+)?(?:(?:current|active)\s+)?(?:security\s+)?clearance)\b/i,
    allowWhenDenied: true,
  },
  {
    id: "truth/jobpilot-auto-submission",
    description:
      "JobPilot prepares reviewed artifacts; it does not automatically submit applications.",
    expression:
      /\b(?:auto(?:matic(?:ally)?)?[-\s]?submi(?:t|ts|tted|ssion|ssions)|automated\s+(?:application\s+)?submissions?|(?:submits?|applies\s+to)\s+(?:applications?|jobs?)\s+automatically|automatically\s+(?:submits?|applies\s+to)\s+(?:applications?|jobs?)|(?:submits?|applies)(?:\s+to\s+(?:applications?|jobs?))?\s+on\s+(?:your|the\s+user'?s|users?')\s+behalf)\b/i,
    allowWhenDenied: true,
  },
];

export const DRIFT_WARNING_RULES: readonly Rule[] = [
  {
    id: "drift/percentage",
    description: "Review marketing percentages against the public truth bank.",
    expression: /\b\d+(?:\.\d+)?\s*%/i,
  },
  {
    id: "drift/multiplier",
    description: "Review marketing multiplier claims against the public truth bank.",
    expression: /\b\d+(?:\.\d+)?\s*(?:x|×)\b/i,
  },
  {
    id: "drift/count-plus",
    description: "Review count-plus claims against the public truth bank.",
    expression:
      /\b\d[\d,]*(?:\.\d+)?\+\s*[a-z][\w-]*(?:\s+[a-z][\w-]*)?\b/i,
  },
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function staticExpressionText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isParenthesizedExpression(node)) {
    return staticExpressionText(node.expression);
  }
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return staticExpressionText(node.expression);
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticExpressionText(node.left);
    const right = staticExpressionText(node.right);
    if (left !== undefined && right !== undefined) return left + right;
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const expression = staticExpressionText(span.expression);
      value += expression ?? " ";
      value += span.literal.text;
    }
    return value;
  }
  return undefined;
}

function staticJsxText(node: ts.JsxElement | ts.JsxFragment): string {
  const parts: string[] = [];

  const collect = (child: ts.JsxChild): void => {
    if (ts.isJsxText(child)) {
      parts.push(child.text);
      return;
    }
    if (ts.isJsxExpression(child)) {
      if (child.expression) {
        const value = staticExpressionText(child.expression);
        if (value !== undefined) parts.push(value);
      }
      return;
    }
    if (ts.isJsxElement(child) || ts.isJsxFragment(child)) {
      parts.push(staticJsxText(child));
    }
  };

  node.children.forEach(collect);
  return parts.join(" ");
}

function isPropertyName(node: ts.StringLiteral): boolean {
  const parent = node.parent;
  return (
    ((ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isEnumMember(parent)) &&
      parent.name === node) ||
    (ts.isElementAccessExpression(parent) && parent.argumentExpression === node)
  );
}

function shouldExtractString(node: ts.StringLiteral): boolean {
  const parent = node.parent;
  if (
    (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  ) {
    return false;
  }
  if (
    ts.isExternalModuleReference(parent) ||
    ts.isLiteralTypeNode(parent) ||
    isPropertyName(node)
  ) {
    return false;
  }
  if (ts.isJsxAttribute(parent) && parent.initializer === node) {
    return USER_FACING_JSX_ATTRIBUTES.has(parent.name.getText());
  }
  if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
    const propertyName = ts.isComputedPropertyName(parent.name)
      ? ""
      : parent.name.getText().replace(/^['"]|['"]$/g, "");
    if (NON_COPY_PROPERTY_VALUES.has(propertyName)) return false;
  }
  return true;
}

function locationFor(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): Pick<ExtractedText, "line" | "column"> {
  const location = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return { line: location.line + 1, column: location.character + 1 };
}

export function extractVisitorText(
  sourceText: string,
  file = "sample.tsx",
): ExtractedText[] {
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const extracted: ExtractedText[] = [];

  const add = (node: ts.Node, rawText: string) => {
    const text = normalizeText(rawText);
    if (!text) return;
    extracted.push({ file, ...locationFor(sourceFile, node), text });
  };

  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sourceFile).toLowerCase();
      const spansMarkup = node.children.some(
        (child) => ts.isJsxElement(child) || ts.isJsxFragment(child),
      );
      if (JSX_COPY_CONTAINERS.has(tag) && spansMarkup) {
        add(node, staticJsxText(node));
      }
    }

    if (ts.isJsxText(node)) {
      add(node, node.text);
      return;
    }

    if (ts.isStringLiteral(node)) {
      if (shouldExtractString(node)) add(node, node.text);
      return;
    }

    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.text);
      return;
    }

    if (ts.isTemplateExpression(node)) {
      add(node, staticExpressionText(node) ?? "");
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const staticText = staticExpressionText(node);
      if (staticText !== undefined) add(node, staticText);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return extracted;
}

function isExplicitDenial(
  text: string,
  matchIndex: number,
  matchLength: number,
): boolean {
  const sentenceStart = Math.max(
    text.lastIndexOf(".", matchIndex),
    text.lastIndexOf("!", matchIndex),
    text.lastIndexOf("?", matchIndex),
    text.lastIndexOf(";", matchIndex),
    text.lastIndexOf(":", matchIndex),
  );
  const sentenceEndCandidates = [
    text.indexOf(".", matchIndex),
    text.indexOf("!", matchIndex),
    text.indexOf("?", matchIndex),
    text.indexOf(";", matchIndex),
    text.indexOf(":", matchIndex),
  ].filter((index) => index >= 0);
  const sentenceEnd =
    sentenceEndCandidates.length > 0
      ? Math.min(...sentenceEndCandidates)
      : text.length;
  const sentence = text
    .slice(sentenceStart + 1, sentenceEnd)
    .toLowerCase();
  const localMatchIndex = matchIndex - sentenceStart - 1;
  const before = sentence.slice(0, localMatchIndex);
  const after = sentence.slice(localMatchIndex + matchLength);
  const contrastAfterDenial =
    /\b(?:no|never|without|not)\b[^.;:!?]{0,100}\b(?:but|however|although|yet)\b/.test(
      before,
    );

  return (
    (!contrastAfterDenial &&
      (/\b(?:no|never|without)\b[^.;:!?]{0,100}$/.test(before) ||
        /\b(?:do|does|did|is|are|was|were|has|have)\s+not\b[^.;:!?]{0,100}$/.test(
          before,
        ) ||
        /\bnot\s+(?:a\s+)?(?:claim|claimed|evidence|presented|reported)\b[^.;:!?]{0,100}$/.test(
          before,
        ))) ||
    /^[^.;:!?]{0,100}\b(?:not|never)\s+(?:claimed|reported|presented)\b/.test(
      after,
    )
  );
}

function findingsFor(
  extracted: readonly ExtractedText[],
  rules: readonly Rule[],
  severity: FindingSeverity,
): VoiceFinding[] {
  const findings: VoiceFinding[] = [];

  for (const source of extracted) {
    for (const rule of rules) {
      const flags = rule.expression.flags.includes("g")
        ? rule.expression.flags
        : `${rule.expression.flags}g`;
      const expression = new RegExp(rule.expression.source, flags);
      for (const match of source.text.matchAll(expression)) {
        const matchStart = match.index ?? 0;
        if (
          rule.allowWhenDenied &&
          isExplicitDenial(source.text, matchStart, match[0].length)
        ) {
          continue;
        }
        findings.push({
          severity,
          ruleId: rule.id,
          description: rule.description,
          file: source.file,
          line: source.line,
          column: source.column,
          matchedText: match[0],
          matchStart,
          matchEnd: matchStart + match[0].length,
          sourceText: source.text,
        });
      }
    }
  }

  return findings.filter((finding, index, all) => {
    const key = `${finding.severity}:${finding.ruleId}:${finding.file}:${finding.line}:${finding.column}:${finding.matchStart}:${finding.sourceText}`;
    return (
      all.findIndex(
        (candidate) =>
          `${candidate.severity}:${candidate.ruleId}:${candidate.file}:${candidate.line}:${candidate.column}:${candidate.matchStart}:${candidate.sourceText}` ===
          key,
      ) === index
    );
  });
}

function isReviewedDriftWarning(finding: VoiceFinding): boolean {
  if (finding.severity !== "warning") return false;
  return truthBank.reviewedMetrics.some(
    (metric) => {
      if (finding.ruleId !== "drift/count-plus") return false;
      let claimStart = finding.sourceText.indexOf(metric.claim);
      while (claimStart >= 0) {
        const claimEnd = claimStart + metric.claim.length;
        if (
          finding.matchStart >= claimStart &&
          finding.matchEnd <= claimEnd
        ) {
          return true;
        }
        claimStart = finding.sourceText.indexOf(metric.claim, claimStart + 1);
      }
      return false;
    },
  );
}

export function scanSourceText(
  sourceText: string,
  file = "sample.tsx",
): VoiceScanResult {
  const extracted = extractVisitorText(sourceText, file);
  return {
    violations: [
      ...findingsFor(extracted, HARD_BAN_RULES, "error"),
      ...findingsFor(extracted, TRUTH_BOUNDARY_RULES, "error"),
    ],
    warnings: findingsFor(extracted, DRIFT_WARNING_RULES, "warning").filter(
      (finding) => !isReviewedDriftWarning(finding),
    ),
    inspectedFiles: [file],
    inspectedTextNodes: extracted.length,
  };
}

export function scanPortfolioSources(root = process.cwd()): VoiceScanResult {
  const extracted: ExtractedText[] = [];
  const inspectedFiles: string[] = [];

  for (const relativeFile of PORTFOLIO_SOURCE_FILES) {
    const absoluteFile = path.join(root, relativeFile);
    const sourceText = readFileSync(absoluteFile, "utf8");
    extracted.push(...extractVisitorText(sourceText, relativeFile));
    inspectedFiles.push(relativeFile);
  }

  return {
    violations: [
      ...findingsFor(extracted, HARD_BAN_RULES, "error"),
      ...findingsFor(extracted, TRUTH_BOUNDARY_RULES, "error"),
    ],
    warnings: findingsFor(extracted, DRIFT_WARNING_RULES, "warning").filter(
      (finding) => !isReviewedDriftWarning(finding),
    ),
    inspectedFiles,
    inspectedTextNodes: extracted.length,
  };
}

function formatFinding(finding: VoiceFinding): string {
  const label = finding.severity === "error" ? "ERROR" : "WARN";
  return `${label} ${finding.file}:${finding.line}:${finding.column} [${finding.ruleId}] ${finding.description}\n  ${finding.sourceText}`;
}

function runCli(): void {
  const result = scanPortfolioSources();
  for (const finding of [...result.violations, ...result.warnings]) {
    console.error(formatFinding(finding));
  }

  if (result.violations.length > 0) {
    console.error(
      `Portfolio voice check failed with ${result.violations.length} violation(s) across ${result.inspectedFiles.length} files.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Portfolio voice check passed (${result.inspectedFiles.length} files, ${result.inspectedTextNodes} static text nodes, ${result.warnings.length} drift warning(s)).`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
