import { readFile } from "node:fs/promises";
import path from "node:path";

export type DataFileErrorCode =
  | "DATA_FILE_PATH"
  | "DATA_FILE_MISSING"
  | "DATA_FILE_UNREADABLE"
  | "DATA_FILE_INVALID_JSON"
  | "DATA_FILE_CONTRACT";

export class DataFileError extends Error {
  readonly code: DataFileErrorCode;
  readonly file: string;

  constructor(
    code: DataFileErrorCode,
    message: string,
    file: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DataFileError";
    this.code = code;
    this.file = file;
  }
}

type ReadServerJsonOptions = {
  /** Missing optional artifacts resolve to undefined. Every other failure throws. */
  required: boolean;
  label: string;
  repair?: string;
};

const displayPath = (file: string): string => {
  const relative = path.relative(process.cwd(), file);
  return relative && !relative.startsWith("..") ? relative : file;
};

const repairSuffix = (repair?: string): string =>
  repair ? ` Repair it with: ${repair}` : " Restore or repair the data file.";

const errnoCode = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;

export function isMissingFileError(error: unknown): boolean {
  return errnoCode(error) === "ENOENT";
}

export function dataContractError(
  file: string,
  label: string,
  detail: string,
  repair?: string,
): DataFileError {
  const shown = displayPath(file);
  return new DataFileError(
    "DATA_FILE_CONTRACT",
    `${label} at ${shown} violates its data contract: ${detail}.${repairSuffix(repair)}`,
    shown,
  );
}

/**
 * Read server-owned JSON without collapsing corruption into an ordinary miss.
 * Callers decide only whether ENOENT is expected; malformed or unreadable files
 * always fail loudly so a bad publication cannot masquerade as absent content.
 */
export async function readServerJson<T>(
  root: string,
  parts: readonly string[],
  options: ReadServerJsonOptions,
): Promise<T | undefined> {
  const resolvedRoot = path.resolve(root);
  const file = path.resolve(resolvedRoot, ...parts);
  const shown = displayPath(file);

  if (!file.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new DataFileError(
      "DATA_FILE_PATH",
      `${options.label} resolved outside its data root: ${shown}.`,
      shown,
    );
  }

  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      if (!options.required) return undefined;
      throw new DataFileError(
        "DATA_FILE_MISSING",
        `${options.label} is declared by the corpus but missing at ${shown}.${repairSuffix(options.repair)}`,
        shown,
        { cause: error },
      );
    }

    const code = errnoCode(error);
    throw new DataFileError(
      "DATA_FILE_UNREADABLE",
      `${options.label} could not be read at ${shown}${code ? ` (${code})` : ""}.${repairSuffix(options.repair)}`,
      shown,
      { cause: error },
    );
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new DataFileError(
      "DATA_FILE_INVALID_JSON",
      `${options.label} contains malformed JSON at ${shown}: ${detail}.${repairSuffix(options.repair)}`,
      shown,
      { cause: error },
    );
  }
}

/**
 * Read a server-owned JSON object and reject present primitive/array roots.
 * Optional callers must distinguish ENOENT (`undefined`) from validly parsed
 * falsy JSON, which is present data that violates an object artifact contract.
 */
export async function readServerJsonObject<T extends object>(
  root: string,
  parts: readonly string[],
  options: ReadServerJsonOptions,
): Promise<T | undefined> {
  const value = await readServerJson<unknown>(root, parts, options);
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw dataContractError(
      path.resolve(root, ...parts),
      options.label,
      "the JSON root must be an object",
      options.repair,
    );
  }
  return value as T;
}
