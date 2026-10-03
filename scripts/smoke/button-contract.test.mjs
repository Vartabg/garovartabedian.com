#!/usr/bin/env node
/**
 * Button contract smoke tests — no browser or Next server required.
 *
 * TypeScript's TSX parser is used instead of a text expression so comments,
 * strings, fragments, multiline attributes, and spread props are handled as
 * syntax. A spread alone is intentionally not an explicit `type` attribute.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTROLS_CSS = path.join(ROOT, "src/app/styles/controls.css");
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function loadTypeScript() {
  try {
    return require("typescript");
  } catch (localResolutionError) {
    // Linked task worktrees intentionally do not duplicate node_modules. When
    // dependencies are installed in the owning checkout, resolve the same
    // declared devDependency from that checkout. CI and normal clones take
    // the direct branch above.
    const gitPointer = path.join(ROOT, ".git");
    if (!fs.existsSync(gitPointer) || !fs.statSync(gitPointer).isFile()) {
      throw localResolutionError;
    }

    const match = fs
      .readFileSync(gitPointer, "utf8")
      .trim()
      .match(/^gitdir:\s*(.+)$/);
    if (!match) throw localResolutionError;

    const gitDirectory = path.resolve(ROOT, match[1]);
    const worktreeMarker = `${path.sep}.git${path.sep}worktrees${path.sep}`;
    const markerIndex = gitDirectory.lastIndexOf(worktreeMarker);
    if (markerIndex === -1) throw localResolutionError;

    const owningCheckout = gitDirectory.slice(0, markerIndex);
    return createRequire(path.join(owningCheckout, "package.json"))(
      "typescript",
    );
  }
}

const ts = loadTypeScript();

function collectTsxFiles(directory, files = []) {
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        collectTsxFiles(absolutePath, files);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isNativeButton(node) {
  return (
    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
    ts.isIdentifier(node.tagName) &&
    node.tagName.text === "button"
  );
}

function hasExplicitTypeAttribute(node) {
  return node.attributes.properties.some(
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      ts.isIdentifier(attribute.name) &&
      attribute.name.text === "type",
  );
}

function inspectNativeButtons(file) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const failures = [];
  let count = 0;

  function visit(node) {
    if (isNativeButton(node)) {
      count += 1;
      if (!hasExplicitTypeAttribute(node)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile),
        );
        failures.push(
          `${path.relative(ROOT, file)}:${line + 1}:${character + 1}`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { count, failures };
}

describe("button contract", () => {
  it("requires an explicit type attribute on every native TSX button", () => {
    const inspections = collectTsxFiles(ROOT).map(inspectNativeButtons);
    const buttonCount = inspections.reduce(
      (total, inspection) => total + inspection.count,
      0,
    );
    const failures = inspections.flatMap((inspection) => inspection.failures);

    assert.ok(buttonCount > 0, "expected to inspect native TSX buttons");

    assert.equal(
      failures.length,
      0,
      [
        "Native <button> elements must declare type=\"button\", type=\"submit\", or type=\"reset\" explicitly.",
        "A spread attribute does not satisfy this rule because its form behavior cannot be verified statically.",
        ...failures.map((failure) => `  - ${failure}`),
      ].join("\n"),
    );
  });

  it("retains the global adaptive CSS contract", () => {
    const css = fs.readFileSync(CONTROLS_CSS, "utf8");
    const requirements = [
      [
        "the 44px normal target token",
        /--control-target-min\s*:\s*2\.75rem\s*;/,
      ],
      [
        "the 48px coarse-pointer target token",
        /--control-target-coarse\s*:\s*3rem\s*;/,
      ],
      [
        "a coarse-pointer adaptation",
        /@media\s*\(\s*any-pointer\s*:\s*coarse\s*\)/,
      ],
      [
        "a 44px minimum inline target",
        /min-inline-size\s*:\s*var\(--control-target-min\)\s*;/,
      ],
      [
        "a 48px minimum inline target for hybrid or coarse input",
        /@media\s*\(\s*any-pointer\s*:\s*coarse\s*\)[\s\S]*?min-inline-size\s*:\s*var\(--control-target-coarse\)\s*;/,
      ],
      [
        "a hover-capable precise-pointer adaptation",
        /@media\s*\(\s*hover\s*:\s*hover\s*\)\s*and\s*\(\s*pointer\s*:\s*fine\s*\)/,
      ],
      [
        "a reduced-motion adaptation",
        /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/,
      ],
      [
        "a forced-colors adaptation",
        /@media\s*\(\s*forced-colors\s*:\s*active\s*\)/,
      ],
      [
        "an increased-contrast adaptation",
        /@media\s*\(\s*prefers-contrast\s*:\s*more\s*\)/,
      ],
      ["a keyboard focus-visible treatment", /:focus-visible\b/],
      ["native disabled-state styling", /:disabled\b/],
      ["ARIA disabled-state styling", /\[aria-disabled\s*=\s*["']true["']\]/],
      [
        "an aria-busy or loading-state hook",
        /(?:\[aria-busy(?:\s*=\s*["']true["'])?\]|\[data-loading\s*=\s*["']true["']\])/,
      ],
    ];
    const missing = requirements
      .filter(([, pattern]) => !pattern.test(css))
      .map(([label]) => label);

    assert.equal(
      missing.length,
      0,
      [
        "src/app/styles/controls.css is missing required button-contract hooks:",
        ...missing.map((requirement) => `  - ${requirement}`),
      ].join("\n"),
    );
  });
});
