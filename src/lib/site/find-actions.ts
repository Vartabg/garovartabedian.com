import {
  updateAccessibilityPreferences,
} from "@/lib/accessibility-preferences";
import type { FindItem } from "./find-query";

export type ActionDefinition = {
  id: string;
  title: string;
  note: string;
  keywords: string[];
  run: () => void;
};

export const ACTIONS: ActionDefinition[] = [
  {
    id: "action-theme-dark",
    title: "Theme: Dark",
    note: "Switch to low-light dark reading palette.",
    keywords: ["dark", "night", "black", "theme", "mode"],
    run: () => updateAccessibilityPreferences({ theme: "dark" }),
  },
  {
    id: "action-theme-light",
    title: "Theme: Light",
    note: "Switch to warm paper light reading palette.",
    keywords: ["light", "day", "white", "paper", "theme", "mode"],
    run: () => updateAccessibilityPreferences({ theme: "light" }),
  },
  {
    id: "action-theme-system",
    title: "Theme: System",
    note: "Match operating system light or dark appearance.",
    keywords: ["system", "auto", "theme", "mode"],
    run: () => updateAccessibilityPreferences({ theme: "system" }),
  },
  {
    id: "action-font-dyslexic",
    title: "Typeface: OpenDyslexic",
    note: "Weighted letter shapes for dyslexia-friendly reading.",
    keywords: ["dyslexic", "dyslexia", "opendyslexic", "font", "typeface"],
    run: () => updateAccessibilityPreferences({ font: "dyslexic" }),
  },
  {
    id: "action-font-readable",
    title: "Typeface: Atkinson Hyperlegible",
    note: "High-distinction typeface designed for low-vision clarity.",
    keywords: ["readable", "atkinson", "hyperlegible", "font", "typeface"],
    run: () => updateAccessibilityPreferences({ font: "readable" }),
  },
  {
    id: "action-size-large",
    title: "Text size: Large (112%)",
    note: "Enlarge body copy and references for comfortable scanning.",
    keywords: ["large", "larger", "big", "bigger", "size", "font-size", "zoom"],
    run: () => updateAccessibilityPreferences({ size: "large" }),
  },
  {
    id: "action-size-largest",
    title: "Text size: Largest (125%)",
    note: "Maximum magnification for high legibility.",
    keywords: ["largest", "huge", "maximum", "size", "zoom"],
    run: () => updateAccessibilityPreferences({ size: "largest" }),
  },
  {
    id: "action-size-default",
    title: "Text size: Default (100%)",
    note: "Reset type scale to standard proportion.",
    keywords: ["default", "reset", "normal", "100%", "size"],
    run: () => updateAccessibilityPreferences({ size: "default" }),
  },
  {
    id: "action-contrast-high",
    title: "High contrast: On",
    note: "Sharpen borders, ink contrasts, and focus rings.",
    keywords: ["contrast", "high-contrast", "sharp", "borders"],
    run: () => updateAccessibilityPreferences({ highContrast: true }),
  },
  {
    id: "action-contrast-normal",
    title: "High contrast: Off",
    note: "Restore nuanced ink and muted borders.",
    keywords: ["contrast", "normal contrast", "low contrast"],
    run: () => updateAccessibilityPreferences({ highContrast: false }),
  },
  {
    id: "action-motion-reduce",
    title: "Reduce motion: On",
    note: "Silence non-essential interface animations and transitions.",
    keywords: ["motion", "reduce motion", "animations"],
    run: () => updateAccessibilityPreferences({ reduceMotion: true }),
  },
];

export function rankActions(query: string): FindItem[] {
  const trimmed = query.trim().toLowerCase();
  const isPrefixed = trimmed.startsWith(">") || trimmed.startsWith("/");
  const q = trimmed.replace(/^[>/]\s*/, "");
  if (!isPrefixed) return [];

  const matched = ACTIONS.filter((action) => {
    if (!q) return isPrefixed;
    if (action.title.toLowerCase().includes(q)) return true;
    if (action.note.toLowerCase().includes(q)) return true;
    return action.keywords.some((k) => k.includes(q) || q.includes(k));
  });

  return matched.map((action) => ({
    id: action.id,
    href: "#",
    title: action.title,
    note: action.note,
    kind: "action" as const,
  }));
}

export function executeAction(id: string): boolean {
  const action = ACTIONS.find((a) => a.id === id);
  if (!action) return false;
  action.run();
  return true;
}
