"use client";
import { useEffect, useState } from "react";
import { ACCESSIBILITY_CHANGE, ACCESSIBILITY_STORAGE_KEY, defaultAccessibilityPreferences, readAccessibilityPreferences, refreshAccessibilityPreferences, updateAccessibilityPreferences } from "@/lib/accessibility-preferences";
export function useReadingPreferences() {
  const [preferences, setPreferences] = useState(defaultAccessibilityPreferences);
  useEffect(() => {
    setPreferences(readAccessibilityPreferences());
    const changed = () => setPreferences(readAccessibilityPreferences());
    const stored = (event: StorageEvent) => {
      if (event.key === ACCESSIBILITY_STORAGE_KEY || event.key === null) setPreferences(refreshAccessibilityPreferences());
    };
    window.addEventListener(ACCESSIBILITY_CHANGE, changed);
    window.addEventListener("storage", stored);
    return () => { window.removeEventListener(ACCESSIBILITY_CHANGE, changed); window.removeEventListener("storage", stored); };
  }, []);
  return [preferences, updateAccessibilityPreferences] as const;
}
