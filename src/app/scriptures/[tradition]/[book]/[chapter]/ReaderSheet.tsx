"use client";

import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])';

/**
 * The one overlay pattern the reader uses, for the two things that genuinely
 * are overlays: navigation and settings. Never for scripture itself.
 *
 * It does what a dialog is supposed to do and the old sheets did not: move
 * focus in on open, keep Tab inside while open, close on Escape and on
 * backdrop press, and return focus to whatever opened it. Height is capped so
 * the panel scrolls internally instead of pushing content, and the bottom
 * padding clears the phone's home indicator.
 */
export default function ReaderSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => returnTo.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="scr-sheet-layer">
      <button
        type="button"
        className="scr-sheet-backdrop"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        className="scr-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="scr-sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="scr-sheet-x"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            Done
          </button>
        </div>
        <div className="scr-sheet-body">{children}</div>
      </div>
    </div>
  );
}
