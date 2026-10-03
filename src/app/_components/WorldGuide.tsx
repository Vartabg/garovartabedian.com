"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  WORLD_GUIDES,
  type WorldGuideConfig,
  type WorldId,
} from "@/lib/world-guidance";
import WorldSourceDisclosure from "./WorldSourceDisclosure";

function pathPart(href: string) {
  return href.split("#")[0].split("?")[0] || "/";
}

function matches(pathname: string, href: string) {
  const path = pathPart(href);
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

function activeLink(config: WorldGuideConfig, pathname: string) {
  return [...config.nav]
    .sort((a, b) => pathPart(b.href).length - pathPart(a.href).length)
    .find((link) => matches(pathname, link.href));
}

export function WorldGuide({ world }: { world: WorldId }) {
  const pathname = usePathname();
  const config = WORLD_GUIDES[world];
  const onHome = pathname === config.base;
  const matched = activeLink(config, pathname);
  const active =
    matched && (onHome || pathPart(matched.href) !== config.base)
      ? matched
      : undefined;
  const currentLabel = onHome ? "Overview" : active?.label ?? config.deepLabel;
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;

    const left =
      current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [pathname]);

  return (
    <section className="world-guide" aria-label={`${config.label} orientation`}>
      <div className="wg-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        {onHome ? (
          <span aria-current="page">{config.label}</span>
        ) : (
          <>
            <Link href={config.base}>{config.label}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{currentLabel}</span>
          </>
        )}
      </div>

      <div className="wg-grid">
        <nav
          ref={navRef}
          className="wg-nav"
          aria-label={`${config.label} rooms`}
        >
          {config.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active?.href === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <WorldSourceDisclosure world={world} />
      </div>

      <details className="wg-mobile-menu">
        <summary>
          <span>Current room</span>
          <strong>{currentLabel}</strong>
        </summary>
        <nav aria-label={`${config.label} rooms`}>
          {config.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active?.href === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <WorldSourceDisclosure world={world} />
      </details>
      <Link className="wg-worlds-link" href="/#worlds">
        Worlds
      </Link>
    </section>
  );
}

export function WorldNextSteps({ world }: { world: WorldId }) {
  const pathname = usePathname();
  const config = WORLD_GUIDES[world];
  const links = config.journey.filter((link) => pathPart(link.href) !== pathname);

  if (!links.length) return null;

  return (
    <nav className="world-next" aria-label={`${config.label} guided next steps`}>
      <p className="world-next-label">Continue the path</p>
      <div className="world-next-grid">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <strong>{link.label}</strong>
            {link.note ? <span>{link.note}</span> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
