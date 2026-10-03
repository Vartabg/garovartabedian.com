/** Client-side scripture reading prefs (localStorage). */

export const SCR_CONTINUE_KEY = "scr:continue";
export const SCR_EASY_KEY = "scr:easy";
export const SCR_TRAIL_KEY = "scr:trail:v1";

export type ContinueReading = {
  traditionId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  href: string;
  updatedAt: number;
};

export type StudyTrailEntry = ContinueReading;

const isStudyTrailEntry = (value: unknown): value is StudyTrailEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StudyTrailEntry>;
  return (
    typeof entry.traditionId === "string" &&
    typeof entry.bookId === "string" &&
    typeof entry.bookName === "string" &&
    typeof entry.chapter === "number" &&
    Number.isInteger(entry.chapter) &&
    entry.chapter > 0 &&
    typeof entry.href === "string" &&
    entry.href.startsWith("/scriptures/") &&
    typeof entry.updatedAt === "number"
  );
};

/** Keep a small, newest-first, de-duplicated trail on this device. */
export function mergeStudyTrail(
  current: readonly StudyTrailEntry[],
  entry: StudyTrailEntry,
  limit = 6,
): StudyTrailEntry[] {
  if (!isStudyTrailEntry(entry))
    return current.filter(isStudyTrailEntry).slice(0, limit);
  return [
    entry,
    ...current.filter(
      (item) =>
        isStudyTrailEntry(item) &&
        !(item.traditionId === entry.traditionId &&
          item.bookId === entry.bookId &&
          item.chapter === entry.chapter),
    ),
  ].slice(0, limit);
}

/** Reader-specific faces. `site` follows the site-wide accessibility choice. */
export type ReadFont = "site" | "dyslexic" | "serif" | "sans";

export const READ_FONTS: { id: ReadFont; label: string; note: string }[] = [
  { id: "site", label: "Site choice", note: "Follows the Aa accessibility menu" },
  { id: "dyslexic", label: "OpenDyslexic", note: "Weighted letter shapes" },
  { id: "serif", label: "Serif", note: "Your device\u2019s book face" },
  { id: "sans", label: "Sans", note: "Your device\u2019s screen face" },
];

export type TextSize = 0 | 1 | 2 | 3;
export type LineSpace = 0 | 1 | 2;

export type EasyPrefs = {
  /** Verse text size step: 0=small, 1=normal, 2=large, 3=largest. */
  textSize: TextSize;
  /** Line spacing step: 0=snug, 1=normal, 2=airy. */
  lineSpace: LineSpace;
  /** Reading face. */
  font: ReadFont;
  /** Flow verses into paragraphs instead of one verse per line. */
  flow: boolean;
  /** Higher contrast page. */
  highContrast: boolean;
  /** Read-aloud speed, 0.6–1.4. */
  speechRate: number;
  /** Browser-provided voice URI, or automatic selection. */
  speechVoice: string;
};

export const defaultEasyPrefs: EasyPrefs = {
  textSize: 1,
  lineSpace: 1,
  font: "site",
  flow: true,
  highContrast: false,
  speechRate: 0.9,
  speechVoice: "auto",
};

export const SPEECH_RATES: { v: number; label: string }[] = [
  { v: 0.7, label: "Slow" },
  { v: 0.9, label: "Normal" },
  { v: 1.15, label: "Brisk" },
];

const isTextSize = (v: unknown): v is TextSize =>
  v === 0 || v === 1 || v === 2 || v === 3;
const isLineSpace = (v: unknown): v is LineSpace => v === 0 || v === 1 || v === 2;
const isReadFont = (v: unknown): v is ReadFont =>
  v === "site" || v === "dyslexic" || v === "serif" || v === "sans";

export function readContinue(): ContinueReading | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCR_CONTINUE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ContinueReading;
    if (!data?.href || !data.bookId || !data.chapter) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeContinue(entry: ContinueReading): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCR_CONTINUE_KEY, JSON.stringify(entry));
  } catch {
    /* private mode */
  }
}

export function readStudyTrail(): StudyTrailEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCR_TRAIL_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter(isStudyTrailEntry)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 6);
  } catch {
    return [];
  }
}

export function writeStudyTrail(entry: StudyTrailEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SCR_TRAIL_KEY,
      JSON.stringify(mergeStudyTrail(readStudyTrail(), entry)),
    );
  } catch {
    /* private mode */
  }
}

export function readEasyPrefs(): EasyPrefs {
  if (typeof window === "undefined") return defaultEasyPrefs;
  try {
    const raw = localStorage.getItem(SCR_EASY_KEY);
    if (!raw) return defaultEasyPrefs;
    // `easy` and `easyFont` are older OpenDyslexic choices. Preserve that
    // reader intent while allowing new visitors to follow the site-wide menu.
    const data = JSON.parse(raw) as Omit<Partial<EasyPrefs>, "font"> & {
      font?: unknown;
      easyFont?: boolean;
    };
    const font =
      data.font === "easy" || data.easyFont === true
        ? "dyslexic"
        : isReadFont(data.font)
          ? data.font
          : defaultEasyPrefs.font;
    return {
      textSize: isTextSize(data.textSize) ? data.textSize : defaultEasyPrefs.textSize,
      lineSpace: isLineSpace(data.lineSpace) ? data.lineSpace : defaultEasyPrefs.lineSpace,
      font,
      flow: typeof data.flow === "boolean" ? data.flow : defaultEasyPrefs.flow,
      highContrast: Boolean(data.highContrast),
      speechRate:
        typeof data.speechRate === "number" &&
        data.speechRate >= 0.6 &&
        data.speechRate <= 1.4
          ? data.speechRate
          : defaultEasyPrefs.speechRate,
      speechVoice:
        typeof data.speechVoice === "string" &&
        data.speechVoice.length > 0 &&
        data.speechVoice.length <= 512
          ? data.speechVoice
          : defaultEasyPrefs.speechVoice,
    };
  } catch {
    return defaultEasyPrefs;
  }
}

/** Class list for the reading surface, from prefs. */
export function readingClasses(prefs: EasyPrefs): string {
  return [
    `scr-size-${prefs.textSize}`,
    `scr-lead-${prefs.lineSpace}`,
    `scr-face-${prefs.font}`,
    prefs.flow ? "scr-flow" : "",
    prefs.highContrast ? "scr-contrast" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function writeEasyPrefs(prefs: EasyPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCR_EASY_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

/** Popular start-here destinations (Protestant WEB). */
export const START_HERE: { bookId: string; label: string; chapter?: number }[] = [
  { bookId: "JHN", label: "John", chapter: 1 },
  { bookId: "PSA", label: "Psalms", chapter: 23 },
  { bookId: "GEN", label: "Genesis", chapter: 1 },
  { bookId: "MAT", label: "Matthew", chapter: 1 },
  { bookId: "ROM", label: "Romans", chapter: 8 },
  { bookId: "PRO", label: "Proverbs", chapter: 1 },
];

export const DEFAULT_TRADITION = "protestant";
