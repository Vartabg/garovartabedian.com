"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { parseRef } from "@/lib/scriptures/refs";
import type { Parable, ScriptureFigure, ThomasParable } from "@/lib/jesus/types";
import type { JamesParable } from "@/lib/jesus/james-parables";
import type { EarlyFigure } from "@/lib/jesus/early-figures";

const GOSPELS = [
  { id: "MAT", name: "Matthew", short: "Mt" },
  { id: "MRK", name: "Mark", short: "Mk" },
  { id: "LUK", name: "Luke", short: "Lk" },
  { id: "JHN", name: "John", short: "Jn" },
] as const;
type Gospel = (typeof GOSPELS)[number]["id"];
export type GroupId = "stories" | "sayings" | "synoptic" | "john" | "early";
type GospelRef = { book: Gospel; chapter: number; verse: number; endVerse: number; label: string };
type Item = { id: string; title: string; search: string; books: Gospel[]; unknown: boolean; refs?: GospelRef[]; thomasSayings?: number[]; match?: string; work?: string; detail?: string; writings?: number };
export type Group = { id: GroupId; label: string; items: Item[] };

/** True when a query has letters or digits to search on. */
export const isSearching = (query: string) => normalize(query).length > 0;

const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function thomasSpeaker(saying: number): string {
  if (saying === 74) return "Speaker not named in this saying";
  if (saying === 13) return "Jesus, Peter, Matthew and Thomas in dialogue";
  if (saying === 21) return "Mary and Jesus in dialogue";
  if ([6, 20, 22, 24, 43, 60, 113].includes(saying)) return "Jesus and the disciples in dialogue";
  if (saying === 72) return "A person and Jesus in dialogue";
  if (saying === 79) return "A woman and Jesus in dialogue";
  if ([91, 104].includes(saying)) return "Jesus and unnamed questioners in dialogue";
  return "Attributed to Jesus in this writing";
}

function gospelItem(entry: Parable | ScriptureFigure, james: JamesParable[], early: EarlyFigure[]): Item {
  const books = new Set<Gospel>();
  let unknown = false;
  const references: string[] = [];
  const refs: GospelRef[] = [];
  for (const account of entry.accounts) {
    const parsed = parseRef(account.ref);
    const gospel = GOSPELS.find((book) => book.id === parsed?.book);
    if (gospel) books.add(gospel.id);
    else unknown = true;
    for (const [kind, ref] of [["Account", account.ref], ["Setting", account.setting], ["Explanation", account.explanation], ["Called a parable", account.called]] as const) {
      if (!ref) continue;
      references.push(ref);
      const book = GOSPELS.find((gospelBook) => ref.startsWith(`${gospelBook.id} `));
      if (book) references.push(ref.replace(book.id, book.name));
      const parsedRef = parseRef(ref);
      const gospelBook = GOSPELS.find((candidate) => candidate.id === parsedRef?.book);
      if (parsedRef && gospelBook) refs.push({ book: gospelBook.id, chapter: parsedRef.chapter, verse: parsedRef.verse, endVerse: parsedRef.endVerse ?? parsedRef.verse, label: `${kind}: ${ref.replace(gospelBook.id, gospelBook.name)}` });
    }
  }
  const writings = [...new Set([
    ...(entry.thomas?.length ? ["Gospel of Thomas"] : []),
    ...(james.some((item) => item.related === entry.id) ? ["Secret Book of James"] : []),
    ...early.filter((item) => item.related === entry.id || item.relatedAlso?.includes(entry.id)).map((item) => item.work),
  ])];
  return { id: entry.id, title: entry.title, books: [...books], unknown, refs, thomasSayings: (entry.thomas ?? []).map(({ saying }) => saying), writings: writings.length, search: normalize([entry.title, ...references, ...writings, ...(entry.kind === "figure" ? [entry.speaker ?? ""] : []), ...(entry.thomas ?? []).map(({ saying }) => `Thomas ${saying}`)].join(" ")) };
}

function gospelReferenceQuery(query: string): { book: Gospel; chapter: number; verse?: number; endVerse?: number; invalid: boolean; otherTerms: string } | null {
  const match = /(?:^|\s)(matthew|matt|mat|mt|mark|mrk|mk|luke|luk|lk|john|jhn|jn)\.?\s*(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?(?=$|[\s,.;!?])/i.exec(query);
  if (!match) return null;
  const name = match[1].toLowerCase();
  const book: Gospel = ["matthew", "matt", "mat", "mt"].includes(name) ? "MAT" : ["mark", "mrk", "mk"].includes(name) ? "MRK" : ["luke", "luk", "lk"].includes(name) ? "LUK" : "JHN";
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;
  const endVerse = match[4] ? Number(match[4]) : verse;
  const invalid = !chapter || (verse !== undefined && (!verse || (endVerse ?? 0) < verse));
  const otherTerms = normalize(`${query.slice(0, match.index)} ${query.slice(match.index + match[0].length)}`);
  return { book, chapter, verse, endVerse, invalid, otherTerms };
}

function thomasReferenceQuery(query: string): { saying: number; otherTerms: string } | null {
  if (/\bacts of thomas\b/.test(query)) return null;
  const match = /\b(?:gospel of )?thomas (?:saying )?(\d+)\b/.exec(query);
  if (!match) return null;
  return { saying: Number(match[1]), otherTerms: normalize(`${query.slice(0, match.index)} ${query.slice(match.index + match[0].length)}`) };
}

export function searchOverviewGroups(groups: Group[], query: string): Group[] {
  const reference = gospelReferenceQuery(query);
  const thomas = thomasReferenceQuery(reference?.otherTerms ?? normalize(query));
  const otherTerms = thomas?.otherTerms ?? reference?.otherTerms ?? normalize(query);
  const terms = otherTerms ? otherTerms.split(" ") : [];
  return groups.map((group) => ({ ...group, items: group.items.flatMap((item) => {
    const words = item.search.split(" ");
    if (!terms.every((term) => words.some((word) => /^\d+$/.test(term) ? word === term : word.startsWith(term)))) return [];
    if (thomas && !item.thomasSayings?.includes(thomas.saying)) return [];
    if (reference) {
      const matches = reference.invalid ? [] : (item.refs ?? []).filter((ref) => ref.book === reference.book && ref.chapter === reference.chapter && (reference.verse === undefined || (ref.verse <= reference.endVerse! && ref.endVerse >= reference.verse)));
      return matches.length ? [{ ...item, match: [...new Set(matches.map((ref) => ref.label))].join(" · ") + (thomas ? ` · Related: Gospel of Thomas, Saying ${thomas.saying}` : "") }] : [];
    }
    return thomas ? [{ ...item, match: item.work === "Gospel of Thomas" ? `Saying ${thomas.saying}` : `Related: Gospel of Thomas, Saying ${thomas.saying}` }] : [item];
  }) })).filter((group) => group.items.length);
}

export function makeOverviewGroups(parables: Parable[], synoptic: ScriptureFigure[], john: ScriptureFigure[], thomas: ThomasParable[], james: JamesParable[], early: EarlyFigure[]): Group[] {
  const outside: Item[] = [
    ...thomas.map((item) => ({ id: item.id, title: item.title, work: "Gospel of Thomas", detail: `Saying ${item.saying} · ${thomasSpeaker(item.saying)}`, books: [], unknown: false, thomasSayings: [item.saying], search: normalize(`${item.title} Gospel of Thomas Thomas ${item.saying} saying ${item.saying} ${thomasSpeaker(item.saying)}`) })),
    ...james.map((item) => ({ id: item.id, title: item.title, work: "Secret Book of James", detail: `${item.locator} · Speech attributed to the Savior; James or Peter also speak where shown`, books: [], unknown: false, thomasSayings: (item.thomas ?? []).map(({ saying }) => saying), search: normalize(`${item.title} Secret Book of James ${item.locator} Savior James Peter`) })),
    ...early.map((item) => ({ id: item.id, title: item.title, work: item.work, detail: `${item.locator} · ${item.speaker}`, books: [], unknown: false, thomasSayings: (item.thomas ?? []).map(({ saying }) => saying), search: normalize(`${item.title} ${item.work} ${item.locator} ${item.speaker}`) })),
  ];
  return [
    { id: "stories", label: "Stories", items: parables.filter((item) => item.kind === "story").map((item) => gospelItem(item, james, early)) },
    { id: "sayings", label: "Short sayings called parables", items: parables.filter((item) => item.kind === "saying").map((item) => gospelItem(item, james, early)) },
    { id: "synoptic", label: "More in Matthew, Mark and Luke", items: synoptic.map((item) => gospelItem(item, james, early)) },
    { id: "john", label: "Figures in John", items: john.map((item) => gospelItem(item, james, early)) },
    { id: "early", label: "Early writings outside the canon", items: outside },
  ];
}

function CoverageTable({ group, activate, ready }: { group: Group; activate: (id: string, event: MouseEvent<HTMLAnchorElement>) => void; ready: boolean }) {
  return <div className="parables-map-table-wrap" role="region" aria-label={`Gospel accounts in ${group.label}`} tabIndex={0}><p className="parables-table-scroll-hint">Scroll across to see all Gospel columns.</p><table className="parables-map-table">
    <caption>● Account shown · — no account shown{group.items.some((item) => item.unknown) && " · ? unknown"}</caption>
    <thead><tr><th scope="col">Passage</th>{GOSPELS.map((book) => <th scope="col" key={book.id}><abbr title={book.name}>{book.short}</abbr><span className="parables-visually-hidden"> ({book.name})</span></th>)}</tr></thead>
    <tbody>{group.items.map((item) => <tr key={item.id}>
      <th scope="row"><a href={`#parable-${item.id}`} aria-disabled={!ready} tabIndex={ready ? undefined : -1} onClick={(event) => activate(item.id, event)}>{item.title}</a>{item.match && <span className="parables-index-writings">{item.match}</span>}{!!item.writings && <span className="parables-index-writings">+ {item.writings} early {item.writings === 1 ? "writing" : "writings"}</span>}</th>
      {GOSPELS.map((book) => {
        const present = item.books.includes(book.id);
        const status = present ? "account in this room" : item.unknown ? "unknown" : "no account in this room";
        return <td key={book.id}><span aria-hidden="true">{present ? "●" : item.unknown ? "?" : "—"}</span><span className="parables-visually-hidden">{book.name}: {status}</span></td>;
      })}
    </tr>)}</tbody>
  </table></div>;
}

/** The compact map at the top of the room: how many entries each group holds per Gospel. */
export default function ParablesOverview({ groups }: { groups: Group[] }) {
  return <section className="parables-overview" id="parables-overview" aria-labelledby="parables-overview-title" tabIndex={-1}>
    <h2 id="parables-overview-title">Explore the collection</h2>
    <p>Choose a group below, or search all of them. A passage opens in place.</p>
    <div className="parables-map-table-wrap" role="region" aria-label="Gospel coverage by group" tabIndex={0}><p className="parables-table-scroll-hint">Scroll across to see all Gospel columns.</p><table className="parables-map-table parables-map-summary">
      <caption>Entries in each group with an account in each Gospel</caption>
      <thead><tr><th scope="col">Group · entries</th>{GOSPELS.map((book) => <th scope="col" key={book.id}><abbr title={book.name}>{book.short}</abbr><span className="parables-visually-hidden"> ({book.name})</span></th>)}</tr></thead>
      <tbody>{groups.filter((group) => group.id !== "early").map((group) => <tr key={group.id}>
        <th scope="row">{group.label} · {group.items.length}</th>
        {GOSPELS.map((book) => <td key={book.id}>{group.items.filter((item) => item.books.includes(book.id)).length}{group.items.some((item) => item.unknown && !item.books.includes(book.id)) && <><span aria-hidden="true">+?</span><span className="parables-visually-hidden"> plus unknown accounts</span></>}</td>)}
      </tr>)}<tr><th scope="row">Early writings outside the canon · {groups[4].items.length}</th><td colSpan={4}>Listed separately</td></tr></tbody>
    </table></div>
    <p className="parables-overview-note">Mt = Matthew · Mk = Mark · Lk = Luke · Jn = John. Counts are entries, not unique parables. An entry can appear in more than one Gospel; not every possible parallel is shown.{groups.some((group) => group.items.some((item) => item.unknown)) && " A question mark means a reference could not be identified."}</p>
  </section>;
}

/**
 * Search across every group. While a query is set, its results stand in for
 * the chosen group's list; choosing a result opens it in its own group. The
 * status line speaks only while searching: the pressed group button already
 * names the group and its count.
 */
export function ParablesSearch({ groups, query, onQuery, openEntry }: {
  groups: Group[]; query: string; onQuery: (query: string) => void; openEntry: (id: string) => void;
}) {
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const searching = isSearching(query);
  const visible = searching ? searchOverviewGroups(groups, query) : [];
  const count = visible.reduce((total, group) => total + group.items.length, 0);
  const activate = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const hash = `#parable-${id}`;
    // pushState preserves back/forward navigation without depending on Next's
    // interception of native hash links; reopening the same hash adds no entry.
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    openEntry(id);
  };
  return <div className="parables-search-area" id="parables-search">
    <label className="parables-search" htmlFor="parables-overview-search">Search all groups</label>
    <input id="parables-overview-search" className="parables-search-input" type="search" placeholder="Title, reference or writing" disabled={!ready} value={query} onChange={(event) => onQuery(event.target.value)} />
    <p className="parables-results" role="status" aria-live="polite">{searching ? `Searching all groups: ${count} ${count === 1 ? "entry" : "entries"}` : ""}</p>
    {searching && count === 0 && <p>No entries found. Try another title, reference or writing.</p>}
    {visible.map((group) => <section key={group.id} className="parables-index-group" aria-label={group.label}>
      <h3>{group.label}</h3>
      {group.id !== "early" ? <CoverageTable group={group} activate={activate} ready={ready} /> : (() => {
        const works = new Map<string, Item[]>();
        for (const item of group.items) { const work = item.work!; works.set(work, [...(works.get(work) ?? []), item]); }
        return <div className="parables-work-list">{[...works].map(([work, items]) => <details key={work} open>
          <summary>{work} <span>· {items.length} {items.length === 1 ? "entry" : "entries"} · outside the canon</span></summary>
          <ul>{items.map((item) => <li key={item.id}><a href={`#parable-${item.id}`} aria-disabled={!ready} tabIndex={ready ? undefined : -1} onClick={(event) => activate(item.id, event)}>{item.title}</a><span>{item.detail}</span>{item.match && item.work !== "Gospel of Thomas" && <span>{item.match}</span>}</li>)}</ul>
        </details>)}</div>;
      })()}
    </section>)}
  </div>;
}
