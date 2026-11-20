"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { setFindOpen, subscribeFind } from "@/lib/site/find-bridge";
import { usePlatformShortcutMod } from "@/lib/site/use-platform-mod";
import { subscribeFromHere, type FromHere } from "@/lib/site/from-here";
import { sectionMenu } from "@/lib/site/section-menu";
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
        href: "/scriptures/stories",
        label: "Stories",
        note: "Walk a Bible story one scene at a time",
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

/** The two groups an about or work page opens the menu on. */
const ABOUT_GROUPS = new Set(["Understand the work", "Work with Garo"]);

export default function SiteNavigation({
  activeHref,
  className = "",
}: {
  activeHref?: string;
  className?: string;
}) {
  const pathname = usePathname() ?? activeHref ?? "/";
  const groupId = useId();
  const shortcutMod = usePlatformShortcutMod();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const [findOpen, setFindOpenState] = useState(false);
  const [fromHere, setFromHereState] = useState<FromHere | null>(null);

  useEffect(() => subscribeFind(setFindOpenState), []);
  useEffect(() => subscribeFromHere(setFromHereState), []);
  const section = sectionMenu(activeHref, pathname);
  const sectionHrefs = new Set(section?.all.map((link) => link.href));
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
    const menu = detailsRef.current;
    if (!menu) return;
    menu.open = false;
    // A new page starts from its own short list again.
    const everything = menu.querySelector<HTMLDetailsElement>(".site-nav-everything");
    if (everything) everything.open = false;
  }, [pathname]);

  // Which site groups open the menu on a page with no section and no
  // From-here list: an about or work page opens on those two groups; any
  // other page (the front door, a page the menu does not list) opens on the
  // sections.
  const onAboutPage = MENU_GROUPS.some(
    (group) =>
      ABOUT_GROUPS.has(group.label) &&
      group.links.some((link) => getNavigationCurrent(pathname, link.href)),
  );
  const leads = (index: number) =>
    onAboutPage ? ABOUT_GROUPS.has(MENU_GROUPS[index].label) : index === 0;

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

  // Under "Everything else" the groups sit beneath the heading that opens
  // the menu, so they step down a level for screen-reader heading lists.
  const siteGroups = (
    Heading: "h2" | "h3",
    include: (index: number) => boolean = () => true,
  ) => MENU_GROUPS.map((group, index) => {
    if (!include(index)) return null;
    // A link already listed under this section is not repeated below it.
    const links = group.links.filter((link) => !sectionHrefs.has(link.href));
    return links.length === 0 ? null : (
    <section
      key={group.label}
      className={index === 0 ? "site-nav-group site-nav-group--worlds" : "site-nav-group"}
      aria-labelledby={`${groupId}-group-${index}`}
    >
      <Heading id={`${groupId}-group-${index}`}>{group.label}</Heading>
      <div className="site-nav-group-links">
        {links.map((link) => (
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
    );
  });

  // "section" is what the menu opens on; "more" is the rest of a long
  // section, shown inside "Everything else".
  const sectionGroup = (
    Heading: "h2" | "h3",
    links: SiteLink[] = section?.links ?? [],
    part: "section" | "more" = "section",
  ) => section && links.length > 0 ? (
    <section className={`site-nav-group site-nav-group--${part}`} aria-labelledby={`${groupId}-${part}`}>
      <Heading id={`${groupId}-${part}`}>{part === "more" ? `More in ${section.label}` : section.label}</Heading>
      <div className="site-nav-group-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.href === section.current ? getNavigationCurrent(pathname, link.href) : undefined}
            onClick={closeMenu}
          >
            <strong>{link.label}</strong>
            {link.note ? <span>{link.note}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  ) : null;

  // The same small chevron in every browser: Safari drew its own triangle
  // here and Chrome drew nothing.
  const everythingSummary = (
    <summary>
      <span>Everything else</span>
      <span className="site-nav-fold-chevron" aria-hidden="true" />
    </summary>
  );

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
        onClick={(event) => {
          closeMenu();
          setFindOpen(true, event.currentTarget);
        }}
      >
        <span className="site-nav-find-label">Find</span>
        <kbd className="site-nav-find-kbd">
          {shortcutMod === "⌘" ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <details
        ref={detailsRef}
        className={`site-nav-menu${menuIsActive ? " has-current" : ""}`}
      >
        <summary ref={summaryRef}>
          <span>Menu</span>
          <span className="site-nav-chevron" aria-hidden="true" />
        </summary>
        {fromHere ? (
          // A reading page opens the menu on what connects to it; the whole
          // site folds below. People move in small steps from where they
          // are (Teevan et al., CHI 2004), and most arrive deep, from search.
          <div className="site-nav-panel">
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
              {everythingSummary}
              <div className="site-nav-everything-groups">
                {sectionGroup("h3", section?.all)}
                {siteGroups("h3")}
              </div>
            </details>
          </div>
        ) : (
          // Every other page opens on its own links too: a section's pages,
          // the about and work pages, or the sections from the front door.
          // The rest of the site is one tap further, as on a reading page.
          <div className="site-nav-panel">
            {section ? sectionGroup("h2") : siteGroups("h2", leads)}
            <details className="site-nav-everything">
              {everythingSummary}
              <div className="site-nav-everything-groups">
                {sectionGroup("h3", section?.more, "more")}
                {siteGroups("h3", section ? undefined : (index) => !leads(index))}
              </div>
            </details>
          </div>
        )}
      </details>
    </nav>
  );
}
