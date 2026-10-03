import { createHash } from "node:crypto";

/** Stable identities shared by local research and hosted evaluation. No file access. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
export const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const fingerprint = (value: unknown) => hash(canonical(value));
