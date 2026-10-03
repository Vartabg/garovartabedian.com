"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function DiveList({
  id,
  label,
  countLabel,
  description,
  classPrefix,
  recordAttribute,
  children,
}: {
  id: string;
  label: string;
  countLabel: string;
  description: string;
  classPrefix: string;
  recordAttribute: string;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const openLinkedRecord = () => {
      const targetId = window.location.hash.slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!(target instanceof HTMLDetailsElement) || !listRef.current?.contains(target)) return;

      target.open = true;
      const scroll = () => target.scrollIntoView?.({ block: "start" });
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(scroll);
      else scroll();
    };

    openLinkedRecord();
    window.addEventListener("hashchange", openLinkedRecord);
    return () => window.removeEventListener("hashchange", openLinkedRecord);
  }, []);

  const setAll = (open: boolean) => {
    const records = listRef.current?.querySelectorAll<HTMLDetailsElement>(
      `details[${recordAttribute}]`,
    );
    records?.forEach((record) => {
      record.open = open;
    });
    setStatus(open ? `Opened all ${countLabel.toLowerCase()}.` : "Closed all records.");
  };

  return (
    <>
      <div className={`${classPrefix}-dive-controls`} aria-label={`${label} reading controls`}>
        <p>
          <strong>{countLabel}.</strong> {description}
        </p>
        <div>
          <button type="button" onClick={() => setAll(true)} aria-controls={id}>
            Open all
          </button>
          <button type="button" onClick={() => setAll(false)} aria-controls={id}>
            Close all
          </button>
        </div>
        <span className={`${classPrefix}-dive-status`} aria-live="polite">
          {status}
        </span>
      </div>
      <div className={`${classPrefix}-dive-list`} id={id} ref={listRef}>
        {children}
      </div>
    </>
  );
}
