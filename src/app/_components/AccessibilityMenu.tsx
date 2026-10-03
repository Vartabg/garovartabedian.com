"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import ReadingAppearance from "./reading/ReadingAppearance";

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const panelId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <div className="a11y-menu">
      <button
        ref={triggerRef}
        type="button"
        className="a11y-trigger"
        disabled={!ready}
        aria-label="Open reading and accessibility settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">Aa</span>
      </button>

      <section
        ref={panelRef}
        id={panelId}
        className="a11y-panel"
        role="dialog"
        aria-labelledby={`${panelId}-title`}
        hidden={!open}
      >
        <header className="a11y-panel-head">
          <div>
            <p>Make the page yours</p>
            <h2 id={`${panelId}-title`}>
              Reading &amp; accessibility
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="a11y-close"
            aria-label="Close accessibility settings"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <p className="a11y-intro">
          These choices stay on this device. Browser zoom and your system
          settings continue to work.
        </p>

        <ReadingAppearance />

      </section>
    </div>
  );
}
