import type { TranslationId } from "./types";

export function scriptureSearchHref(
  value: FormDataEntryValue | null,
  translation: TranslationId = "web",
  scope?: string,
): string {
  const query = typeof value === "string" ? value.trim().slice(0, 160) : "";
  const params = [
    ...(query ? [`q=${encodeURIComponent(query)}`] : []),
    ...(translation !== "web" ? [`trans=${encodeURIComponent(translation)}`] : []),
    ...(scope === "texts" || scope === "all" ? [`scope=${scope}`] : []),
  ];
  return `/scriptures/search${params.length ? `?${params.join("&")}` : ""}`;
}

/** Preserve the search separately from the edition actually quoted by a result. */
export function withFindContext(href: string, query: string, translation: TranslationId, scope?: string): string {
  if (!query.trim() || !href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://local.invalid");
  if (!/^\/scriptures\/[^/]+\/[A-Z0-9]{3}\/\d+$/.test(url.pathname) && !/^\/early\/(?:library\/[^/]+(?:\/[^/]+)?|[^/]+)$/.test(url.pathname)) return href;
  if (["/early/search", "/early/library"].includes(url.pathname)) return href;
  url.searchParams.set("find", query.trim().slice(0, 160));
  url.searchParams.set("findTrans", translation);
  if (scope === "texts" || scope === "all") url.searchParams.set("findScope", scope);
  return url.pathname + url.search + url.hash;
}

export function findReturnHref(params: URLSearchParams): string | null {
  const query = params.get("find")?.trim().slice(0, 160);
  const translation = params.get("findTrans") ?? "web";
  if (!query || !["web", "kjv", "drb", "brenton", "charles"].includes(translation)) return null;
  if (params.get("findFrom") === "writings") return librarySearchHref(query, params.get("findKind") ?? "all", params.get("findRecord") ?? "", Number(params.get("findPage") ?? 1));
  return scriptureSearchHref(query, translation as TranslationId, params.get("findScope") ?? undefined);
}

/** Only carry the bounded search context through a reader edition/layout change. */
export function preserveFindContext(href: string, current: URLSearchParams): string {
  if (!findReturnHref(current)) return href;
  if (current.get("findFrom") === "writings") return withLibraryFindContext(href, current.get("find")!, current.get("findKind") ?? "all", current.get("findRecord") ?? "", Number(current.get("findPage") ?? 1));
  return withFindContext(href, current.get("find")!, (current.get("findTrans") ?? "web") as TranslationId, current.get("findScope") ?? undefined);
}

export function librarySearchHref(query: string, kind = "all", record = "", page = 1): string {
  const params = new URLSearchParams({ q: query.trim().slice(0, 160) });
  if (kind !== "all") params.set("kind", kind);
  if (/^[a-z0-9-]{1,120}$/.test(record)) params.set("record", record);
  if (Number.isSafeInteger(page) && page > 1) params.set("page", String(page));
  return `/early/search?${params}`;
}

/** Keep a writings search's filters separate from the source edition's URL. */
export function withLibraryFindContext(href: string, query: string, kind = "all", record = "", page = 1): string {
  const decorated = withFindContext(href, query, "web");
  if (decorated === href) return href;
  const url = new URL(decorated, "https://local.invalid");
  url.searchParams.set("findFrom", "writings");
  if (["primary-text", "commentary", "catalog-note", "reference-only", "legacy-edition"].includes(kind)) url.searchParams.set("findKind", kind);
  if (/^[a-z0-9-]{1,120}$/.test(record)) url.searchParams.set("findRecord", record);
  if (Number.isSafeInteger(page) && page > 1) url.searchParams.set("findPage", String(page));
  return url.pathname + url.search + url.hash;
}
