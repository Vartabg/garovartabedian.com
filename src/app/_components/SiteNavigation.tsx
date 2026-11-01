"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { setFindOpen, subscribeFind } from "@/lib/site/find-bridge";
import { subscribeFromHere, type FromHere } from "@/lib/site/from-here";
import { getNavigationCurrent, type SiteLink } from "@/lib/site-navigation";
import { WORLD_REGISTRY } from "@/lib/world-registry";

const DIRECT_LINKS: SiteLink[] = [
  { href: "/", label: "Home" },
  { href: "/scriptures", label: "Scriptures" },
  { href: "/jesus", label: "Jesus" },
];

const MENU_GROUPS: Array<{
  label: string;
  links: SiteLink[];
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

export default function SiteNavigation({
  activeHref,
  className = "",
}: {
  activeHref?: string;
  className?: string;
}) {
  const pathname = usePathname() ?? activeHref ?? "/";
  const groupId = useId();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const [findOpen, setFindOpenState] = useState(false);
  const [fromHere, setFromHereState] = useState<FromHere | null>(null);

  useEffect(() => subscribeFind(setFindOpenState), []);
  useEffect(() => subscribeFromHere(setFromHereState), []);
  const directIsActive = DIRECT_LINKS.some((link) =>
    getNavigationCurrent(pathname, link.href),
  );
  const menuIsActive =
    !directIsActive &&
    MENU_GROUPS.some((group) =>
      group.links.some((link) => getNavigationCurrent(pathname, link.href)),
    );

  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const closeFromOutside = (event: Event) => {
      if (!detailsRef.current?.contains(event.target as Node)) closeMenu();
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("focusin", closeFromOutside);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("focusin", closeFromOutside);
    };
  }, []);

  // Under "Everything else" the groups sit beneath the From-here heading,
  // so they step down a level for screen-reader heading lists.
  const siteGroups = (Heading: "h2" | "h3") => MENU_GROUPS.map((group, index) => (
    <section
      key={group.label}
      className={index === 0 ? "site-nav-group site-nav-group--worlds" : "site-nav-group"}
      aria-labelledby={`${groupId}-group-${index}`}
    >
      <Heading id={`${groupId}-group-${index}`}>{group.label}</Heading>
      <div className="site-nav-group-links">
        {group.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={getNavigationCurrent(pathname, link.href)}
            onClick={closeMenu}
          >
            <strong>{link.label}</strong>
            {link.note ? <span>{link.note}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  ));

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
            aria-current={getNavigationCurrent(pathname, link.href)}
            onClick={closeMenu}
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
        {fromHere ? (
          // A reading page opens the menu on what connects to it; the whole
          // site folds below. People move in small steps from where they
          // are (Teevan et al., CHI 2004), and most arrive deep, from search.
          <div className="site-nav-panel site-nav-panel--here">
            <section className="site-nav-here" aria-labelledby={`${groupId}-here`}>
              <h2 id={`${groupId}-here`}>From {fromHere.label}</h2>
              <div className="site-nav-group-links">
                {fromHere.links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={closeMenu}>
                    <span>{link.kind}</span>
                    <strong>{link.label}</strong>
                  </Link>
                ))}
              </div>
            </section>
            <details className="site-nav-everything">
              <summary>Everything else</summary>
              <div className="site-nav-everything-groups">{siteGroups("h3")}</div>
            </details>
          </div>
        ) : (
          <div className="site-nav-panel">
            <div className="site-nav-panel-head">
              <strong>Explore the whole site</strong>
              <span>Choose a world, use the Bible tools, or learn about the work.</span>
            </div>
            {siteGroups("h2")}
          </div>
        )}
      </details>
    </nav>
  );
}
