import snapshot from "../../../public/meta/guide-record.json";
import type { GuideRecord } from "./guide-record";

/**
 * The generated guide record. Import this from server code only: a client
 * component that imports it ships all 1,586 rows in its bundle.
 */
export function guideRecordFrom(value: unknown): GuideRecord {
  const record = value as GuideRecord;
  // A file from a different generator version must stop the build, not render half a section.
  if (
    record?.schemaVersion !== 2 ||
    !Array.isArray(record.rubrics) ||
    !Array.isArray(record.books) ||
    record.books.length === 0
  ) {
    throw new Error("public/meta/guide-record.json is not a schemaVersion 2 guide record; run npm run data:guide-record.");
  }
  return record;
}

export const GUIDE_RECORD = guideRecordFrom(snapshot);
