import { getNavigationCurrent, getWorldRoutes, type SiteLink } from "../site-navigation";
import { WORLD_GUIDES } from "../world-guidance";

export type SectionMenu = {
  label: string;
  /** What the section's menu opens on. */
  links: SiteLink[];
  /** The section's other pages, folded under "Everything else". Empty unless
      the section names a shorter list to open on. */
  more: SiteLink[];
  /** Every link, in the section's own order. */
  all: SiteLink[];
  current?: string;
};

/** A section header's pages for the site menu, minus the section home (the
    brand link already goes there), then the section's source notes. A section
    with too many pages for a phone screen opens on its main pages and the
    page you are on; the rest fold. */
export function sectionMenu(activeHref: string | undefined, pathname: string): SectionMenu | null {
  const guide = Object.values(WORLD_GUIDES).find((entry) => entry.base === activeHref);
  if (!guide) return null;
  const pages = getWorldRoutes(guide.id).filter((route) => route.href !== guide.base);
  const sources: SiteLink = { href: guide.source.href ?? "/sources", label: `Sources for ${guide.label}` };
  const all = [...pages, sources];
  // Parent pages stay current on their descendants; mark only the closest.
  const current = all
    .filter((link) => getNavigationCurrent(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const lead = guide.menuLead ? new Set(guide.menuLead) : null;
  const leads = (link: SiteLink) => !lead || lead.has(link.href) || link.href === current;
  return {
    label: guide.label,
    links: [...pages.filter(leads), sources],
    more: pages.filter((link) => !leads(link)),
    all,
    current,
  };
}
