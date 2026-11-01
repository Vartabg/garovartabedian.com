"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { WORLD_GUIDES, type WorldId } from "@/lib/world-guidance";
import { getNavigationCurrent, getSiteLocation, getWorldRoutes } from "@/lib/site-navigation";
import { worldContinuation, worldGuideLayout } from "@/lib/world-continuity";
import CuriosityCompass from "./CuriosityCompass";
import SiteBreadcrumbs from "./SiteBreadcrumbs";
import WorldSourceDisclosure from "./WorldSourceDisclosure";

export function WorldGuide({ world }: { world: WorldId }) {
  const pathname = usePathname() ?? WORLD_GUIDES[world].base;
  const config = WORLD_GUIDES[world];
  const currentLabel = getSiteLocation(pathname).label;
  const routes = getWorldRoutes(world);
  const currentRoute = [...routes]
    .filter((link) => getNavigationCurrent(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const navRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const mobileRef = useRef<HTMLDetailsElement | null>(null);
  // Parent section links describe location; only the exact destination is a page.
  const currentHref = [...config.nav]
    .filter((link) => link.href !== config.base || pathname === config.base)
    .filter((link) => !link.href.includes("#") && getNavigationCurrent(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
    if (mobileRef.current) mobileRef.current.open = false;
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: Math.max(0, current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2), behavior: "auto" });
  }, [pathname]);

  const closeMenus = () => {
    if (detailsRef.current) detailsRef.current.open = false;
    if (mobileRef.current) mobileRef.current.open = false;
  };

  return (
    <section
      className={`world-guide world-guide--${worldGuideLayout(world, pathname)}`}
      aria-label={`${config.label} orientation`}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        const open = mobileRef.current?.open ? mobileRef.current : detailsRef.current?.open ? detailsRef.current : null;
        if (!open) return;
        event.preventDefault();
        open.open = false;
        open.querySelector("summary")?.focus();
      }}
    >
      <SiteBreadcrumbs className="wg-breadcrumb" />
      <div className="wg-grid">
        <nav ref={navRef} className="wg-nav" aria-label={`${config.label} rooms`}>
          {config.nav.map((link) => (
            <Link key={link.href} href={link.href} aria-current={currentHref === link.href ? getNavigationCurrent(pathname, link.href) : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <WorldSourceDisclosure world={world} />
      </div>
      <details ref={detailsRef} className="wg-browse">
        <summary>Browse this section</summary>
        <nav aria-label={`All ${config.label} pages`}>
          {routes.map((link) => (
            <Link key={link.href} href={link.href} aria-current={currentRoute === link.href ? getNavigationCurrent(pathname, link.href) : undefined} onClick={closeMenus}>
              <strong>{link.label}</strong>
              {link.note ? <span>{link.note}</span> : null}
            </Link>
          ))}
        </nav>
      </details>
      <details ref={mobileRef} className="wg-mobile-menu">
        <summary><span>Explore this section</span><strong>{currentLabel}</strong></summary>
        <nav aria-label={`${config.label} rooms`}>
          {routes.map((link) => (
            <Link key={link.href} href={link.href} aria-current={currentRoute === link.href ? getNavigationCurrent(pathname, link.href) : undefined} onClick={closeMenus}>{link.label}</Link>
          ))}
        </nav>
        <WorldSourceDisclosure world={world} />
      </details>
      <Link className="wg-worlds-link" href="/#worlds">All worlds</Link>
    </section>
  );
}

export function WorldNextSteps({ world }: { world: WorldId }) {
  const pathname = usePathname() ?? WORLD_GUIDES[world].base;
  const config = WORLD_GUIDES[world];
  const links = worldContinuation(world, pathname);
  return (
    <section className="world-continuation" aria-label="Continue exploring">
      <nav className="world-next" aria-label={`${config.label} guided next steps`}>
        <h2 className="world-next-label">Continue exploring</h2>
        <div className="world-next-grid">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <small>{link.context}</small>
              <strong>{link.label}<span aria-hidden="true"> →</span></strong>
              {link.note ? <span>{link.note}</span> : null}
            </Link>
          ))}
        </div>
      </nav>
      <details className="world-related-tools">
        <summary>More research tools</summary>
        <CuriosityCompass world={world} />
      </details>
    </section>
  );
}
