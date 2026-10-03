"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { setFindOpen, subscribeFind } from "@/lib/site/find-bridge";
import { WORLD_REGISTRY } from "@/lib/world-registry";

type NavigationLink = {
  href: string;
  label: string;
  note?: string;
};

const DIRECT_LINKS: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/scriptures", label: "Scripture" },
  { href: "/jesus", label: "Jesus" },
];

const MENU_GROUPS: Array<{
  label: string;
  links: NavigationLink[];
}> = [
  {
    label: "Explore the record",
    links: WORLD_REGISTRY.map((world) => ({
      href: world.href,
      label: world.label,
      note: world.hint,
    })),
  },
  {
    label: "Use Scripture",
    links: [
      {
        href: "/scriptures",
        label: "Read the Bible",
        note: "Browse books and traditions",
      },
      {
        href: "/scriptures/search",
        label: "Search Scripture",
        note: "Find words or open a reference",
      },
      {
        href: "/scriptures/topics",
        label: "Bible topics",
        note: "Follow subjects into the text",
      },
    ],
  },
  {
    label: "Understand the work",
    links: [
      {
        href: "/evidence",
        label: "How We Know",
        note: "See how claims are tested",
      },
      {
        href: "/sources",
        label: "Sources & method",
        note: "Inspect the source standards",
      },
      {
        href: "/about",
        label: "About",
        note: "Meet its creator and purpose",
      },
    ],
  },
  {
    label: "Work with Garo",
    links: [
      {
        href: "/services",
        label: "Start a project",
        note: "Workflow diagnostic and build path",
      },
      {
        href: "/work",
        label: "Work & case studies",
        note: "Inspect the systems and decisions",
      },
      {
        href: "/contact",
        label: "Contact",
        note: "Describe what is slowing your team down",
      },
      {
        href: "/hire",
        label: "Full-time employment",
        note: "Experience, role fit, and résumé",
      },
      { href: "/resume", label: "Résumé" },
    ],
  },
];

function linkPath(href: string) {
  return href.split("#")[0].split("?")[0] || "/";
}

function isCurrent(activeHref: string | undefined, href: string) {
  return activeHref === linkPath(href);
}

export default function SiteNavigation({
  activeHref,
  className = "",
}: {
  activeHref?: string;
  className?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const [findOpen, setFindOpenState] = useState(false);

  useEffect(() => subscribeFind(setFindOpenState), []);
  const directIsActive = DIRECT_LINKS.some((link) =>
    isCurrent(activeHref, link.href),
  );
  const menuIsActive =
    !directIsActive &&
    MENU_GROUPS.some((group) =>
      group.links.some((link) => isCurrent(activeHref, link.href)),
    );

  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) closeMenu();
    };

    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, []);

  return (
    <nav
      className={`site-navigation${className ? ` ${className}` : ""}`}
      aria-label="Primary site navigation"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !detailsRef.current?.open) return;
        event.preventDefault();
        closeMenu();
        summaryRef.current?.focus();
      }}
    >
      <div className="site-nav-direct">
        {DIRECT_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrent(activeHref, link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="site-nav-find"
        aria-label="Find"
        aria-haspopup="dialog"
        aria-expanded={findOpen}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          closeMenu();
          setFindOpen(true);
        }}
      >
        <span className="site-nav-find-label">Find</span>
        <kbd className="site-nav-find-kbd">⌘K</kbd>
      </button>

      <details
        ref={detailsRef}
        className={`site-nav-menu${menuIsActive ? " has-current" : ""}`}
      >
        <summary ref={summaryRef}>
          <span className="site-nav-summary-desktop">Explore</span>
          <span className="site-nav-summary-mobile">Menu</span>
          <span className="site-nav-chevron" aria-hidden="true" />
        </summary>
        <div className="site-nav-panel">
          <div className="site-nav-panel-head">
            <strong>Explore the whole site</strong>
            <span>Choose a world, use the Bible tools, or learn about the work.</span>
          </div>
          {MENU_GROUPS.map((group, index) => (
            <section
              key={group.label}
              className={index === 0 ? "site-nav-group site-nav-group--worlds" : "site-nav-group"}
              aria-labelledby={`site-nav-group-${index}`}
            >
              <h2 id={`site-nav-group-${index}`}>{group.label}</h2>
              <div className="site-nav-group-links">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isCurrent(activeHref, link.href) ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <strong>{link.label}</strong>
                    {link.note ? <span>{link.note}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </details>
    </nav>
  );
}
