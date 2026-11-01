import { discoveryThreads } from "./discovery-content";
import { getSiteLocation, getWorldRoutes } from "./site-navigation";
import { WORLD_GUIDES, type WorldGuideLink, type WorldId } from "./world-guidance";

export type ContinuationLink = WorldGuideLink & { context: string };

export function routePath(href: string) {
  return href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
}

/** One nearby room, one connection, and a way back. Keep the choice bounded. */
export function worldContinuation(world: WorldId, pathname: string): ContinuationLink[] {
  const config = WORLD_GUIDES[world];
  const current = routePath(pathname);
  const routes = getWorldRoutes(world);
  const rooms = config.nav.filter((link) => routePath(link.href) !== config.base && !link.href.includes("#"));
  const currentRoom = rooms.findIndex((link) => current === link.href || current.startsWith(`${link.href}/`));
  const after = currentRoom >= 0 ? rooms.slice(currentRoom + 1) : [];
  const candidates = [...after, ...config.journey, ...routes];
  const local = candidates.find((link) => routePath(link.href) !== current && routePath(link.href).startsWith(`${config.base}/`));
  const connection = config.journey.find((link) => routePath(link.href) !== current && !routePath(link.href).startsWith(config.base))
    ?? discoveryThreads(world, current).find((link) => link.href !== local?.href);
  const links: ContinuationLink[] = [];
  const add = (link: WorldGuideLink | undefined, context: string) => {
    if (!link || routePath(link.href) === current || links.some((item) => routePath(item.href) === routePath(link.href))) return;
    const metadata = getSiteLocation(routePath(link.href));
    links.push({ ...link, note: link.note ?? metadata?.note, context });
  };
  add(local, "In this section");
  add(connection, "Follow a connection");
  if (current !== config.base) {
    add({ href: config.base, label: `${config.label} overview`, note: "Return to the starting point and choose another path." }, "Back to overview");
  } else {
    add(discoveryThreads(world, current).find((link) => !links.some((item) => item.href === link.href)), "Try a research tool");
  }
  return links;
}

/** The reader has its own passage trail; entrances need a compact guide. */
export function worldGuideLayout(world: WorldId, pathname: string): "compact" | "room" | "reader" {
  const base = WORLD_GUIDES[world].base;
  if (getSiteLocation(pathname).presentation === "reader") return "reader";
  return routePath(pathname) === base ? "compact" : "room";
}
