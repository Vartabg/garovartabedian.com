"use client";
import { useId } from "react";
import { useReadingPreferences } from "./useReadingPreferences";
import { defaultAccessibilityPreferences, type AccessibilityFont, type AccessibilitySize, type AccessibilityTheme, type AccessibilityPreferences } from "@/lib/accessibility-preferences";

/** Shared controls, whether opened from Aa, a chapter sheet, or a reading page. */
export default function ReadingAppearance() {
  const [p, update] = useReadingPreferences();
  const id = useId();
  return <div className="reading-appearance">
    <div className="reading-settings-grid">
      <div><label htmlFor={`${id}-size`}>Text size</label><select id={`${id}-size`} value={p.size} onChange={e => update({ size: e.target.value as AccessibilitySize })}>
        <option value="default">Standard</option><option value="large">Large</option><option value="largest">Largest</option>{p.size === "custom" && <option value="custom">Saved size ({p.customSize}px)</option>}
      </select></div>
      <div><label htmlFor={`${id}-theme`}>Page theme</label><select id={`${id}-theme`} value={p.theme} onChange={e => update({ theme: e.target.value as AccessibilityTheme })}>
        <option value="system">Device</option><option value="light">Paper</option><option value="warm">Warm</option><option value="dark">Night</option>
      </select></div>
      <div><label htmlFor={`${id}-face`}>Reading typeface</label><select id={`${id}-face`} value={p.font} onChange={e => update({ font: e.target.value as AccessibilityFont })}>
        <option value="book">Book</option><option value="readable">Atkinson Hyperlegible</option><option value="dyslexic">OpenDyslexic</option><option value="system">Device typeface</option>
      </select></div>
      <div><label htmlFor={`${id}-spacing`}>Line spacing</label><select id={`${id}-spacing`} value={p.spacing} onChange={e => update({ spacing: e.target.value as AccessibilityPreferences["spacing"] })}>
        <option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option>
      </select></div>
    </div>
    <label className="reading-toggle"><input type="checkbox" checked={p.monochrome} onChange={e => update({ monochrome: e.target.checked })} />Monochrome</label>
    <details className="reading-accessibility"><summary>Accessibility options</summary>
      <label className="reading-toggle"><input type="checkbox" checked={p.spacious} onChange={e => update({ spacious: e.target.checked })} />Extra text spacing</label>
      <label className="reading-toggle"><input type="checkbox" checked={p.highContrast} onChange={e => update({ highContrast: e.target.checked })} />Higher contrast</label>
      <label className="reading-toggle"><input type="checkbox" checked={p.reduceMotion} onChange={e => update({ reduceMotion: e.target.checked })} />Reduce motion</label>
      <label className="reading-toggle"><input type="checkbox" checked={p.underlineLinks} onChange={e => update({ underlineLinks: e.target.checked })} />Underline text links</label>
    </details>
    <button type="button" onClick={() => update(defaultAccessibilityPreferences)}>Reset to site defaults</button>
    <p className="reading-help">Saved in this browser and shared between texts. Labels and line patterns remain in every theme.</p>
  </div>;
}
