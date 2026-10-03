"use client";

import { useId } from "react";
import Link from "next/link";
import { openDisclosureForHash } from "@/lib/world-disclosure";
import { buttonClassName } from "./Button";

export type WorldEntryPath = {
  href: string;
  label: string;
  note: string;
  meta?: string;
};

function EntryLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (href.startsWith("#")) {
          openDisclosureForHash(href, document);
        }
      }}
    >
      {children}
    </Link>
  );
}

export default function WorldEntry({
  eyebrow,
  title,
  note,
  href,
  action,
  paths = [],
}: {
  eyebrow: string;
  title: string;
  note: string;
  href: string;
  action: string;
  paths?: WorldEntryPath[];
}) {
  const titleId = useId();

  return (
    <section className="world-entry" aria-labelledby={titleId}>
      <div className="world-entry-lead">
        <p className="world-entry-eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p className="world-entry-note">{note}</p>
        <EntryLink
          href={href}
          className={buttonClassName({
            variant: "primary",
            size: "md",
            className: "world-entry-primary",
          })}
        >
          <span>{action}</span>
          <span aria-hidden="true">→</span>
        </EntryLink>
      </div>

      {paths.length > 0 && (
        <nav className="world-entry-paths" aria-label="Other paths in this world">
          <p>Choose another path</p>
          <ul>
            {paths.map((path) => (
              <li key={`${path.href}-${path.label}`}>
                <EntryLink href={path.href} className="world-entry-path">
                  <span>
                    <strong>{path.label}</strong>
                    <small>{path.note}</small>
                  </span>
                  <span className="world-entry-path-end">
                    {path.meta && <em>{path.meta}</em>}
                    <span aria-hidden="true">↗</span>
                  </span>
                </EntryLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
