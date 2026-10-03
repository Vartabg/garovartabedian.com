import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const safeRelativeEntry = (entry) => {
  if (typeof entry !== "string" || !entry || path.isAbsolute(entry)) {
    throw new Error(`Publication entry must be a non-empty relative path: ${entry}`);
  }
  const normalized = path.normalize(entry);
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`Publication entry escapes its root: ${entry}`);
  }
  return normalized;
};

const insideRoot = (root, relative) => {
  const target = path.resolve(root, relative);
  const resolvedRoot = path.resolve(root);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Publication entry escapes ${resolvedRoot}: ${relative}`);
  }
  return target;
};

export function atomicWriteFileSync(file, contents) {
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(
    directory,
    `.${path.basename(file)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    fs.writeFileSync(temporary, contents, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, file);
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}

export function atomicWriteJsonSync(
  file,
  value,
  { space = 2, trailingNewline = true } = {},
) {
  const serialized = JSON.stringify(value, null, space);
  if (serialized === undefined) {
    throw new TypeError(`Cannot serialize undefined JSON for ${file}`);
  }
  // The round trip catches custom toJSON output that is not valid JSON before
  // the destination is touched.
  JSON.parse(serialized);
  atomicWriteFileSync(file, `${serialized}${trailingNewline ? "\n" : ""}`);
}

/**
 * Publish a validated staging set with rollback on any ordinary I/O failure.
 * Each rename is atomic on the repository filesystem; the backup makes the
 * multi-entry operation transactional unless the process itself is killed.
 */
export function publishStagedEntriesSync(
  stagingRoot,
  finalRoot,
  entries,
  { label = "publication" } = {},
) {
  const normalized = [...new Set(entries.map(safeRelativeEntry))];
  if (normalized.length === 0) return;

  for (const entry of normalized) {
    const staged = insideRoot(stagingRoot, entry);
    if (!fs.existsSync(staged)) {
      throw new Error(`${label} is incomplete: staged entry is missing: ${entry}`);
    }
  }

  fs.mkdirSync(finalRoot, { recursive: true });
  const backupRoot = fs.mkdtempSync(path.join(finalRoot, `.${label}-backup-`));
  const published = [];
  let preserveBackup = false;

  try {
    for (const entry of normalized) {
      const staged = insideRoot(stagingRoot, entry);
      const destination = insideRoot(finalRoot, entry);
      const backup = insideRoot(backupRoot, entry);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.mkdirSync(path.dirname(backup), { recursive: true });

      const hadDestination = fs.existsSync(destination);
      if (hadDestination) fs.renameSync(destination, backup);

      try {
        fs.renameSync(staged, destination);
      } catch (error) {
        if (hadDestination && fs.existsSync(backup) && !fs.existsSync(destination)) {
          fs.renameSync(backup, destination);
        }
        throw error;
      }

      published.push({ destination, backup, hadDestination });
    }
  } catch (error) {
    const rollbackErrors = [];
    const publishedByDestination = new Map(
      published.map((item) => [item.destination, item]),
    );
    for (const entry of normalized.toReversed()) {
      const destination = insideRoot(finalRoot, entry);
      const backup = insideRoot(backupRoot, entry);
      const item = publishedByDestination.get(destination);
      try {
        if (fs.existsSync(backup)) {
          fs.rmSync(destination, { recursive: true, force: true });
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.renameSync(backup, destination);
        } else if (item && !item.hadDestination) {
          fs.rmSync(destination, { recursive: true, force: true });
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      preserveBackup = true;
      throw new AggregateError(
        [error, ...rollbackErrors],
        `${label} failed and could not be fully rolled back; recovery data remains at ${backupRoot}`,
      );
    }
    throw error;
  } finally {
    if (!preserveBackup) fs.rmSync(backupRoot, { recursive: true, force: true });
  }
}
