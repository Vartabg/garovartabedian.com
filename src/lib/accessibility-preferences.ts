export const ACCESSIBILITY_STORAGE_KEY = "garovartabedian:reading:v2";
export const ACCESSIBILITY_CHANGE = "reading:preferences";
export type AccessibilityFont = "book" | "readable" | "dyslexic" | "system";
export type AccessibilitySize = "default" | "large" | "largest" | "custom";
export type AccessibilityTheme = "system" | "light" | "warm" | "dark";
export type AccessibilityPreferences = {
  theme: AccessibilityTheme; font: AccessibilityFont; size: AccessibilitySize;
  customSize: number; spacing: "compact" | "comfortable" | "spacious";
  spacious: boolean; monochrome: boolean; highContrast: boolean;
  reduceMotion: boolean; underlineLinks: boolean;
};

/** One closure shared by the before-paint bootstrap and React controls. */
function createPreferenceRuntime() {
/** Self-contained: the same migration runs before paint and in React. */
function resolveReadingPreferences(current: unknown, legacy?: unknown, preview?: unknown, scripture?: unknown): AccessibilityPreferences {
  const defaults: AccessibilityPreferences = { theme: "system", font: "book", size: "default", customSize: 19, spacing: "comfortable", spacious: false, monochrome: false, highContrast: false, reduceMotion: false, underlineLinks: false };
  if (current && typeof current === "object" && !Array.isArray(current)) {
    const p = current as Partial<AccessibilityPreferences>;
    return {
      theme: p.theme === "light" || p.theme === "warm" || p.theme === "dark" ? p.theme : "system",
      font: p.font === "readable" || p.font === "dyslexic" || p.font === "system" ? p.font : "book",
      size: p.size === "large" || p.size === "largest" || p.size === "custom" ? p.size : "default",
      customSize: typeof p.customSize === "number" && Number.isFinite(p.customSize) ? Math.max(19, Math.min(48, p.customSize)) : 19,
      spacing: p.spacious === true || p.spacing === "spacious" ? "spacious" : p.spacing === "compact" ? "compact" : "comfortable",
      spacious: p.spacious === true || p.spacing === "spacious",
      monochrome: p.monochrome === true, highContrast: p.highContrast === true,
      reduceMotion: p.reduceMotion === true, underlineLinks: p.underlineLinks === true,
    };
  }
  const a = (legacy && typeof legacy === "object" ? legacy : {}) as Partial<AccessibilityPreferences>;
  const b = (preview && typeof preview === "object" ? preview : {}) as Record<string, unknown>;
  const c = (scripture && typeof scripture === "object" ? scripture : {}) as Record<string, unknown>;
  const scale = a.size === "largest" ? 1.25 : a.size === "large" ? 1.125 : 1;
  const oldScriptureSize = c.textSize === 0 ? 16 : c.textSize === 2 ? 21 : c.textSize === 3 ? 24 : 18;
  const oldPreviewSize = b.size === "largest" ? 26 : b.size === "large" ? 22 : 19;
  const pixels = Math.max(19 * scale, scripture ? oldScriptureSize * scale : 19, preview ? oldPreviewSize * scale : 19);
  return {
    ...defaults,
    theme: a.theme === "light" || a.theme === "dark" ? a.theme : b.theme === "paper" ? "light" : b.theme === "night" ? "dark" : b.theme === "warm" ? "warm" : "system",
    font: a.font === "dyslexic" || a.font === "system" ? a.font : c.font === "dyslexic" || c.font === "easy" || c.easyFont === true ? "dyslexic" : c.font === "sans" ? "system" : c.font === "serif" ? "book" : a.font === "readable" ? "readable" : "book",
    size: pixels === 19 ? "default" : pixels === 22 ? "large" : pixels === 26 ? "largest" : "custom",
    customSize: pixels,
    spacing: a.spacious || c.lineSpace === 2 ? "spacious" : c.lineSpace === 0 ? "compact" : "comfortable",
    spacious: a.spacious === true || c.lineSpace === 2,
    monochrome: b.monochrome === true,
    highContrast: a.highContrast === true || c.highContrast === true,
    reduceMotion: a.reduceMotion === true, underlineLinks: a.underlineLinks === true,
  };
}
function applyAccessibilityPreferences(p: AccessibilityPreferences, root: HTMLElement): void {
  root.dataset.a11yTheme = p.theme;
  root.dataset.a11yFont = p.font;
  root.dataset.a11ySize = p.size;
  root.dataset.a11ySpacing = p.spacing;
  root.dataset.a11yContrast = p.highContrast ? "high" : "default";
  root.dataset.a11yMotion = p.reduceMotion ? "reduce" : "default";
  root.dataset.a11yLinks = p.underlineLinks ? "underline" : "default";
  root.dataset.readingMonochrome = String(p.monochrome);
  const pixels = p.size === "large" ? 22 : p.size === "largest" ? 26 : p.size === "custom" ? p.customSize : 19;
  // Scale once at the root; reading surfaces use 1.1875rem.
  root.style.fontSize = `${pixels / 19 * 100}%`;
}
function loadReadingPreferences(storage: Pick<Storage, "getItem">): AccessibilityPreferences {
  const values: unknown[] = [];
  for (const key of ["garovartabedian:reading:v2", "garovartabedian:a11y:v1", "garovartabedian:reading-path:v1", "scr:easy"]) {
    try { values.push(JSON.parse(storage.getItem(key) ?? "null")); } catch { values.push(null); }
  }
  return resolveReadingPreferences(values[0], values[1], values[2], values[3]);
}
return { resolveReadingPreferences, applyAccessibilityPreferences, loadReadingPreferences };
}
export const { resolveReadingPreferences, applyAccessibilityPreferences, loadReadingPreferences } = createPreferenceRuntime();
export const defaultAccessibilityPreferences = resolveReadingPreferences(null);
export const normalizeAccessibilityPreferences = (value: unknown) => resolveReadingPreferences(value);
export const accessibilityBootstrap = `(()=>{const __name=(fn)=>fn;const runtime=(${createPreferenceRuntime.toString()})();try{runtime.applyAccessibilityPreferences(runtime.loadReadingPreferences(localStorage),document.documentElement);}catch{runtime.applyAccessibilityPreferences(runtime.resolveReadingPreferences(null),document.documentElement);}})();`;
let memory: AccessibilityPreferences | undefined;
export function readAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") return defaultAccessibilityPreferences;
  if (memory) return memory;
  try { return memory = loadReadingPreferences(window.localStorage); }
  catch { return memory = defaultAccessibilityPreferences; }
}
export function refreshAccessibilityPreferences(): AccessibilityPreferences {
  memory = undefined;
  const p = readAccessibilityPreferences();
  applyAccessibilityPreferences(p, document.documentElement);
  return p;
}
export function updateAccessibilityPreferences(patch: Partial<AccessibilityPreferences>): AccessibilityPreferences {
  const current = readAccessibilityPreferences();
  const next = resolveReadingPreferences({ ...current, ...patch,
    ...(patch.spacing ? { spacious: patch.spacing === "spacious" } : patch.spacious !== undefined ? { spacing: patch.spacious ? "spacious" : "comfortable" } : {}),
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("reading:before-appearance"));
  memory = next;
  if (typeof document !== "undefined") applyAccessibilityPreferences(next, document.documentElement);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep working in memory. */ }
    window.dispatchEvent(new Event(ACCESSIBILITY_CHANGE));
  }
  return next;
}
