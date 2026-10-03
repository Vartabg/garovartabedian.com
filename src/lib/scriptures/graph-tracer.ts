import type { Canons, XrefFile } from "./types";
import { parseScriptureQueryRef } from "./refs";

export type PathStep = { id: string; ref: string; href: string; snippet?: string };
/** A generated, editorially selected example over real citation edges. */
export type IconicPath = {
  id: string; title: string; theme: string; from: string; to: string;
  fromId: string; toId: string; hops: number; chain: PathStep[];
};
export type HubPathsData = {
  meta: {
    generatedAt: string; hubCount: number; maxHops: number; xrefBooks: string[];
    verseCounts: Record<string, number[]>; missingVerses: string[];
  };
  topHubs: Array<{ id: string; ref: string; href: string }>;
  hubs: Record<string, string[]>;
  iconicPaths: IconicPath[];
};
export type EndpointHubsData = { book: string; hubs: Record<string, string[]> };
export type PathTraceResult = {
  from: string; to: string; hops: number; chain: PathStep[];
  title?: string; theme?: string; isIconic?: boolean;
};
export type PathTraceErrorCode = "invalid-reference" | "load-failed";

export class PathTraceError extends Error {
  readonly code: PathTraceErrorCode;
  readonly endpoint?: "from" | "to";
  readonly reference?: string;
  readonly resource?: string;
  constructor(
    code: PathTraceErrorCode,
    message: string,
    detail: { endpoint?: "from" | "to"; reference?: string; resource?: string } = {},
  ) {
    super(message);
    this.name = "PathTraceError";
    this.code = code;
    this.endpoint = detail.endpoint;
    this.reference = detail.reference;
    this.resource = detail.resource;
  }
}

let hubPathsPromise: Promise<HubPathsData> | null = null;
const endpointPromises = new Map<string, Promise<EndpointHubsData>>();
const xrefPromises = new Map<string, Promise<XrefFile>>();
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const isStringArrayRecord = (value: unknown): value is Record<string, string[]> =>
  isRecord(value) && Object.values(value).every(isStrings);
const isNumberArrayRecord = (value: unknown): value is Record<string, number[]> =>
  isRecord(value) &&
  Object.values(value).every(
    (item) => Array.isArray(item) && item.every((entry) => Number.isInteger(entry)),
  );

function failure(resource: string, reason: unknown) {
  const suffix = reason instanceof Error && reason.message ? ` (${reason.message})` : "";
  return new PathTraceError(
    "load-failed",
    `The citation data could not be loaded. Please try again.${suffix}`,
    { resource },
  );
}
async function fetchJson<T>(resource: string, validate: (value: unknown) => value is T): Promise<T> {
  try {
    const response = await fetch(resource);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value: unknown = await response.json();
    if (!validate(value)) throw new Error("unexpected response shape");
    return value;
  } catch (error) {
    throw error instanceof PathTraceError ? error : failure(resource, error);
  }
}
function isHubData(value: unknown): value is HubPathsData {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.hubs)) return false;
  return typeof value.meta.generatedAt === "string" &&
    typeof value.meta.hubCount === "number" &&
    typeof value.meta.maxHops === "number" &&
    isStrings(value.meta.xrefBooks) &&
    isNumberArrayRecord(value.meta.verseCounts) &&
    isStrings(value.meta.missingVerses) &&
    isStringArrayRecord(value.hubs) &&
    Array.isArray(value.topHubs) &&
    Array.isArray(value.iconicPaths);
}
function isEndpointData(value: unknown): value is EndpointHubsData {
  return isRecord(value) && typeof value.book === "string" && isStringArrayRecord(value.hubs);
}
function isXrefs(value: unknown): value is XrefFile {
  return isRecord(value) && typeof value.book === "string" && isStringArrayRecord(value.refs);
}

export function loadHubPaths(): Promise<HubPathsData> {
  if (!hubPathsPromise) {
    hubPathsPromise = fetchJson("/scriptures/graph/hub-paths.json", isHubData).catch((error) => {
      hubPathsPromise = null;
      throw error;
    });
  }
  return hubPathsPromise;
}
function loadEndpoint(book: string): Promise<EndpointHubsData> {
  const cached = endpointPromises.get(book);
  if (cached) return cached;
  const resource = `/scriptures/graph/endpoint-hubs/${book}.json`;
  const pending = fetchJson(
    resource,
    (value): value is EndpointHubsData => isEndpointData(value) && value.book === book,
  );
  endpointPromises.set(book, pending);
  void pending.catch(() => {
    if (endpointPromises.get(book) === pending) endpointPromises.delete(book);
  });
  return pending;
}
function loadXrefs(book: string, data: HubPathsData): Promise<XrefFile> {
  if (!data.meta.xrefBooks.includes(book)) return Promise.resolve({ book, refs: {} });
  const cached = xrefPromises.get(book);
  if (cached) return cached;
  const resource = `/scriptures/xref/${book}.json`;
  const pending = fetchJson(
    resource,
    (value): value is XrefFile => isXrefs(value) && value.book === book,
  );
  xrefPromises.set(book, pending);
  void pending.catch(() => {
    if (xrefPromises.get(book) === pending) xrefPromises.delete(book);
  });
  return pending;
}

export function displayRefFromId(id: string, canons: Canons): string {
  const [book, chapter, verse] = id.split(".");
  return `${canons.books[book]?.name ?? book} ${chapter}:${verse}`;
}
export function readerHrefFromId(id: string, canons: Canons): string {
  const [book, chapter, verse] = id.split(".");
  const tradition = canons.traditions.find((item) => item.books.includes(book))?.id ?? "protestant";
  return `/scriptures/${tradition}/${book}/${chapter}#v${verse}`;
}
/** Normalize a single verse reference into BOOK.chapter.verse. */
export function resolveNodeId(input: string, canons: Canons): string | null {
  const dotted = /^([1-4]?[a-z0-9]{2,5})\.(\d+)\.(\d+)$/i.exec(input.trim());
  if (dotted) {
    const book = dotted[1].toUpperCase();
    const chapter = Number(dotted[2]);
    const verse = Number(dotted[3]);
    const meta = canons.books[book];
    return meta && chapter >= 1 && chapter <= meta.chapters && verse >= 1
      ? `${book}.${chapter}.${verse}`
      : null;
  }
  const parsed = parseScriptureQueryRef(input.trim(), canons);
  return parsed && parsed.endVerse === undefined
    ? `${parsed.book}.${parsed.chapter}.${parsed.verse}`
    : null;
}
function parts(id: string): [string, number, number] {
  const [book, chapter, verse] = id.split(".");
  return [book, Number(chapter), Number(verse)];
}
export function isHostedNodeId(id: string, data: HubPathsData): boolean {
  const [book, chapter, verse] = parts(id);
  const chapters = data.meta.verseCounts[book];
  return Boolean(chapters) && chapter >= 1 && chapter <= chapters.length &&
    verse >= 1 && verse <= chapters[chapter - 1] && !data.meta.missingVerses.includes(id);
}
/** Check a source row for a target verse, including expanded source ranges. */
export function hasDirectReference(xrefs: XrefFile, sourceId: string, targetId: string): boolean {
  const [sourceBook, sourceChapter, sourceVerse] = parts(sourceId);
  const [targetBook, targetChapter, targetVerse] = parts(targetId);
  if (xrefs.book !== sourceBook) return false;
  return (xrefs.refs[`${sourceChapter}:${sourceVerse}`] ?? []).some((ref) => {
    const match = /^([1-4]?[A-Z0-9]{2,5}) (\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim());
    if (!match) return false;
    const start = Number(match[3]);
    const end = match[4] ? Number(match[4]) : start;
    return match[1] === targetBook && Number(match[2]) === targetChapter &&
      targetVerse >= start && targetVerse <= end;
  });
}

export function bfsShortestPath(
  adjacency: Record<string, string[]>, start: string, target: string, maxHops = 6,
): string[] | null {
  if (start === target) return [start];
  const parent = new Map<string, string | null>([[start, null]]);
  let frontier = [start];
  for (let hop = 0; hop < maxHops; hop += 1) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const neighbor of [...(adjacency[node] ?? [])].sort()) {
        if (parent.has(neighbor)) continue;
        parent.set(neighbor, node);
        if (neighbor === target) {
          const path = [target];
          let cursor = target;
          while (parent.get(cursor) !== null) {
            cursor = parent.get(cursor)!;
            path.unshift(cursor);
          }
          return path;
        }
        next.push(neighbor);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}
/** Add all endpoint hub candidates and count endpoint edges in the hop limit. */
export function findHubPath(
  hubs: Record<string, string[]>,
  fromId: string,
  toId: string,
  fromHubs: string[],
  toHubs: string[],
  maxHops = 6,
): string[] | null {
  const adjacency: Record<string, string[]> = Object.fromEntries(
    Object.entries(hubs).map(([id, neighbors]) => [id, [...neighbors]]),
  );
  const attach = (endpoint: string, candidates: string[]) => {
    if (Object.hasOwn(adjacency, endpoint)) return;
    adjacency[endpoint] = [...new Set(candidates)].sort();
    for (const hub of adjacency[endpoint]) {
      adjacency[hub] = [...new Set([...(adjacency[hub] ?? []), endpoint])].sort();
    }
  };
  attach(fromId, fromHubs);
  attach(toId, toHubs);
  return bfsShortestPath(adjacency, fromId, toId, maxHops);
}
function asResult(ids: string[], from: string, to: string, canons: Canons): PathTraceResult {
  return {
    from: displayRefFromId(from, canons),
    to: displayRefFromId(to, canons),
    hops: ids.length - 1,
    chain: ids.map((id) => ({
      id,
      ref: displayRefFromId(id, canons),
      href: readerHrefFromId(id, canons),
    })),
    isIconic: false,
  };
}
function invalid(endpoint: "from" | "to", reference: string): PathTraceError {
  return new PathTraceError(
    "invalid-reference",
    `The ${endpoint === "from" ? "starting" : "ending"} reference is not a single hosted verse: ${reference}`,
    { endpoint, reference },
  );
}

export async function tracePath(
  fromRaw: string, toRaw: string, canons: Canons, data?: HubPathsData,
): Promise<PathTraceResult | null> {
  const fromId = resolveNodeId(fromRaw, canons);
  if (!fromId) throw invalid("from", fromRaw);
  const toId = resolveNodeId(toRaw, canons);
  if (!toId) throw invalid("to", toRaw);
  // This manifest remains the first runtime fetch, preserving clear recovery
  // when the graph deployment is incomplete.
  const hubData = data ?? (await loadHubPaths());
  if (!isHostedNodeId(fromId, hubData)) throw invalid("from", fromRaw);
  if (!isHostedNodeId(toId, hubData)) throw invalid("to", toRaw);

  const example = hubData.iconicPaths.find((item) =>
    (item.fromId === fromId && item.toId === toId) ||
    (item.fromId === toId && item.toId === fromId));
  if (example) {
    const forward = example.fromId === fromId;
    return {
      from: displayRefFromId(fromId, canons),
      to: displayRefFromId(toId, canons),
      hops: example.hops,
      chain: forward ? example.chain : [...example.chain].reverse(),
      title: example.title,
      theme: example.theme,
      isIconic: true,
    };
  }
  if (fromId === toId) return asResult([fromId], fromId, toId, canons);

  const fromIsHub = Object.hasOwn(hubData.hubs, fromId);
  const toIsHub = Object.hasOwn(hubData.hubs, toId);
  const [fromBook, fromChapter, fromVerse] = parts(fromId);
  const [toBook, toChapter, toVerse] = parts(toId);
  if (!fromIsHub && !toIsHub) {
    const [fromXrefs, toXrefs] = await Promise.all([
      loadXrefs(fromBook, hubData), loadXrefs(toBook, hubData),
    ]);
    if (hasDirectReference(fromXrefs, fromId, toId) ||
        hasDirectReference(toXrefs, toId, fromId)) {
      return asResult([fromId, toId], fromId, toId, canons);
    }
  }
  const [fromEndpoint, toEndpoint] = await Promise.all([
    fromIsHub ? null : loadEndpoint(fromBook),
    toIsHub ? null : loadEndpoint(toBook),
  ]);
  const path = findHubPath(
    hubData.hubs, fromId, toId,
    fromEndpoint?.hubs[`${fromChapter}:${fromVerse}`] ?? [],
    toEndpoint?.hubs[`${toChapter}:${toVerse}`] ?? [],
    Math.min(hubData.meta.maxHops, 6),
  );
  return path ? asResult(path, fromId, toId, canons) : null;
}
