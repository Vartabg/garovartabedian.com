import type { EarlyPlate } from "./plates";
import {
  DataFileError,
  dataContractError,
  isMissingFileError,
  readServerJsonObject,
} from "@/lib/server-json";

export const MIN_SECTION_PLATE_BYTES = 40_000;

export function isRenderableSectionPlate(bytes: number): boolean {
  return bytes >= MIN_SECTION_PLATE_BYTES;
}

export type SectionPlateMeta = EarlyPlate & {
  heading: string;
  summary: string;
};

type SectionManifestEntry = {
  heading: string;
  caption: string;
  alt: string;
  summary: string;
  prompt?: string;
};

type SectionManifest = Record<string, unknown>;

const isSectionManifestEntry = (entry: unknown): entry is SectionManifestEntry =>
  typeof entry === "object" &&
  entry !== null &&
  "heading" in entry &&
  typeof entry.heading === "string" &&
  "summary" in entry &&
  typeof entry.summary === "string" &&
  "alt" in entry &&
  typeof entry.alt === "string" &&
  "caption" in entry &&
  typeof entry.caption === "string";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Stable section anchor + image filename stem. */
export function sectionSlug(heading?: string): string | undefined {
  if (!heading) return undefined;
  const roman = /^Chapter\s+([IVXLCDM]+)/i.exec(heading);
  if (roman) return `chapter-${roman[1].toLowerCase()}`;
  const arabic = /^Chapter\s+(\d+)/i.exec(heading);
  if (arabic) return `chapter-${arabic[1]}`;
  const fragRoman = /^Fragment\s+([IVXLCDM]+)\b/i.exec(heading);
  if (fragRoman) return `fragment-${fragRoman[1].toLowerCase()}`;
  const fragArabic = /^Fragment\s+(\d+)\b/i.exec(heading);
  if (fragArabic) return `fragment-${fragArabic[1]}`;
  return slug(heading);
}

export function sectionImageSrc(textId: string, slugId: string): string {
  return `/early/sections/${textId}/${slugId}.jpg`;
}

/** Server-side: read manifest from disk. */
export async function loadSectionPlates(
  textId: string,
): Promise<Record<string, SectionPlateMeta>> {
  const { join } = await import("node:path");
  const sectionsRoot = join(process.cwd(), "public/early/sections");
  const manifestPath = join(sectionsRoot, `${textId}.json`);
  const manifest = await readServerJsonObject<SectionManifest>(
    sectionsRoot,
    [`${textId}.json`],
    {
      required: false,
      label: `section plate manifest ${textId}`,
      repair: `node scripts/early/build-section-manifest.mjs ${textId}`,
    },
  );
  if (manifest === undefined) return {};

  const { stat } = await import("node:fs/promises");
  const out: Record<string, SectionPlateMeta> = {};
  for (const [slugId, entry] of Object.entries(manifest)) {
    // Skip meta keys ($lock, …) — not chapter plates.
    if (slugId.startsWith("$")) continue;
    if (!isSectionManifestEntry(entry)) {
      throw dataContractError(
        manifestPath,
        `section plate manifest ${textId}`,
        `${slugId} is missing heading, summary, alt, or caption text`,
        `node scripts/early/build-section-manifest.mjs ${textId}`,
      );
    }

    const disk = join(sectionsRoot, textId, `${slugId}.jpg`);
    try {
      const file = await stat(disk);
      if (!isRenderableSectionPlate(file.size)) continue;
      out[slugId] = {
        heading: entry.heading,
        summary: entry.summary,
        src: sectionImageSrc(textId, slugId),
        alt: entry.alt,
        caption: entry.caption,
      };
    } catch (error) {
      if (isMissingFileError(error)) continue;
      throw new DataFileError(
        "DATA_FILE_UNREADABLE",
        `Section plate image could not be inspected at ${disk}. Restore the image or its directory permissions.`,
        disk,
        { cause: error },
      );
    }
  }
  return out;
}
