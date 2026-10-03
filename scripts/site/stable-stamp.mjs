/**
 * Keep a generated artefact's timestamp honest, and keep the worktree clean.
 *
 * A build artefact stamped with the wall clock changes on every run, so
 * `npm run build` left the tree dirty even when nothing about the data had
 * moved. That is noise in every diff, and it quietly erodes the rule that a
 * finished task leaves a clean worktree — you stop trusting `git status`.
 *
 * The fix is not to drop the timestamp. "When did this data last actually
 * change" is worth knowing. It is to keep the old one when the rest of the
 * artefact is byte-identical, so the stamp means what it says.
 */

import fs from "node:fs";

/** The artefact currently on disk, or null if there isn't a readable one. */
export function readJsonOrNull(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    // A half-written or hand-broken artefact is not evidence of anything.
    return null;
  }
}

/**
 * Return the timestamp the artefact should carry: the existing one if this
 * build produced the same data, otherwise the new one.
 *
 * @param file      Path the artefact will be written to.
 * @param next      The artefact about to be written, including its new stamp.
 * @param key       Name of the timestamp field. Defaults to "generatedAt".
 * @param previous  The prior artefact. Pass it explicitly when the generator
 *                  clears its output directory before writing — otherwise
 *                  there is nothing left on disk to compare against, and the
 *                  stamp moves on every run.
 */
export function stableGeneratedAt(file, next, key = "generatedAt", previous = readJsonOrNull(file)) {
  if (!previous) return next[key];

  const withoutStamp = (value) => {
    const { [key]: _stamp, ...rest } = value;
    void _stamp;
    return JSON.stringify(rest);
  };

  return withoutStamp(previous) === withoutStamp(next) ? previous[key] : next[key];
}

/**
 * Write a JSON artefact, preserving its timestamp when the data is unchanged.
 * Returns true when the file on disk actually changed.
 */
export function writeStableJson(
  file,
  value,
  { key = "generatedAt", indent = 2, previous = readJsonOrNull(file) } = {},
) {
  const stamped = { ...value, [key]: stableGeneratedAt(file, value, key, previous) };
  const serialised = `${JSON.stringify(stamped, null, indent)}\n`;
  const onDisk = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (onDisk === serialised) return false;
  fs.writeFileSync(file, serialised, "utf8");
  return true;
}
