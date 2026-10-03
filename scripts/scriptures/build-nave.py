#!/usr/bin/env python3
"""
Build Nave's Topical Bible (1897, Orville J. Nave — public domain) into
sharded site JSON at public/scriptures/nave/.

Source: a plain-text digitization of the original PD work, hosted as a CSV
at github.com/BradyStephenson/bible-data (see public/scriptures/SOURCES.md
for the full provenance note). This script re-derives everything from that
one file; nothing here is hand-authored content.

Every reference is parsed with book/chapter inheritance (Nave's own 19th-
century concordance shorthand: a semicolon starts a new clause, which may
omit the book — inheriting the last one stated — and a comma adds another
verse/range to the current chapter) and then verified against this site's
own hosted WEB text before being trusted; anything that doesn't resolve is
dropped and reported, never guessed.

"See X" topic-to-topic cross-references get the same discipline: each one
is checked against the actual set of topics that make it into this build
(normalizing case/whitespace and trying a comma-order swap for citations
like "PRIEST, HIGH" -> "HIGH PRIEST"). A "See" that's really a footnote
artifact from the 1897 print edition (a bracketed note number, an embedded
scripture ref, a "titles of PSA N" pointer, a same-topic "above"/"below"
qualifier) is detected and treated as plain text rather than a broken
link. Anything left that still doesn't resolve to a real topic is dropped
as a link (and kept as plain text) rather than pointing somewhere dead.

Run: python3 scripts/scriptures/build-nave.py
"""
import csv
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
CACHE = HERE / ".cache"
OUT = REPO / "public/scriptures/nave"

CSV_URL = "https://raw.githubusercontent.com/BradyStephenson/bible-data/main/NavesTopicalDictionary.csv"

CANONS = json.loads((REPO / "public/scriptures/canons.json").read_text())
KNOWN_BOOKS = set(CANONS["books"].keys())
ALIASES = {"1JHN": "1JN", "2JHN": "2JN", "3JHN": "3JN", "JHN1": "1JN"}


def normalize_book(raw):
    b = ALIASES.get(raw.upper(), raw.upper())
    return b if b in KNOWN_BOOKS else None


PURE_SEG_RE = re.compile(
    r"^\s*(?:([123]?[A-Za-z]{2,4})\s+)?(\d+)(?::(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*))?\s*$"
)
BOUNDARY_RE = re.compile(
    r"^(.*?)\s+([123]?[A-Za-z]{2,4}\s+\d+(?::\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)?)\s*$"
)


def match_pure_segment(seg):
    m = PURE_SEG_RE.match(seg)
    return m.groups() if m else None


def expand_ref_segments(seg_matches):
    refs = []
    cur_book, cur_chapter = None, None
    for book_raw, chapter, verses in seg_matches:
        if book_raw:
            book = normalize_book(book_raw)
            if not book:
                continue
            cur_book = book
        elif cur_book:
            book = cur_book
        else:
            continue
        cur_chapter = chapter
        if verses:
            for part in verses.split(","):
                refs.append(f"{book} {cur_chapter}:{part}")
        else:
            refs.append(f"{book} {cur_chapter}")
    return refs


def split_label_refs(line):
    text = line.strip()
    if not text.startswith("-"):
        return None
    text = text[1:].strip()
    see_m = re.match(r"^See\s+(.+)$", text, re.IGNORECASE)
    if see_m:
        return {"label": "", "refs": [], "see": see_m.group(1).strip()}
    if not text:
        return {"label": "", "refs": [], "see": None}

    segments = text.split(";")
    trailing = []
    i = len(segments) - 1
    while i >= 0:
        m = match_pure_segment(segments[i])
        if m:
            trailing.append(m)
            i -= 1
        else:
            break
    trailing.reverse()

    boundary_match = None
    if i >= 0:
        boundary_text = segments[i]
        bm = BOUNDARY_RE.match(boundary_text)
        if bm:
            label_part = bm.group(1).strip().rstrip(",")
            boundary_match = match_pure_segment(bm.group(2))
            pre = "; ".join(s.strip() for s in segments[:i])
            label = f"{pre}; {label_part}".strip("; ").strip() if pre else label_part
        else:
            label = "; ".join(s.strip() for s in segments[: i + 1])
    else:
        label = ""

    all_matches = ([boundary_match] if boundary_match else []) + trailing
    has_book = any(m[0] for m in all_matches)
    if not has_book:
        return {"label": text, "refs": [], "see": None}

    refs = expand_ref_segments(all_matches)
    if not refs and not label:
        label = text
    return {"label": label, "refs": refs, "see": None}


def parse_entry(entry_text):
    items = []
    for raw_line in entry_text.split("\n"):
        if not raw_line.strip():
            continue
        lead = len(raw_line) - len(raw_line.lstrip(" "))
        depth = 1 if lead >= 4 else 0
        parsed = split_label_refs(raw_line)
        if parsed is None:
            continue
        parsed["depth"] = depth
        items.append(parsed)
    return items


_text_cache = {}


def get_book_text(book):
    if book not in _text_cache:
        meta = CANONS["books"].get(book)
        if not meta:
            _text_cache[book] = None
        else:
            trans = "web" if "web" in meta["trans"] else meta["trans"][0]
            path = REPO / f"public/scriptures/text/{trans}/{book}.json"
            _text_cache[book] = json.loads(path.read_text()) if path.exists() else None
    return _text_cache[book]


def verify_ref(ref):
    m = re.match(r"^([123A-Z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$", ref)
    if not m:
        return False
    book, ch, v, v2 = m.groups()
    data = get_book_text(book)
    if not data:
        return False
    ch = int(ch)
    chapters = data["chapters"]
    if not (1 <= ch <= len(chapters)):
        return False
    if v is None:
        return True
    verses = chapters[ch - 1]
    v = int(v)
    if not (1 <= v <= len(verses)):
        return False
    if v2 and not (1 <= int(v2) <= len(verses)):
        return False
    return True


FOOTNOTE_MARKER_RE = re.compile(r"\[\d+\]")
TRAILING_QUALIFIER_RE = re.compile(r",?\s*\b(?:above|below)\b\.?\s*$", re.IGNORECASE)
LEADING_ALSO_RE = re.compile(r"^also\s+", re.IGNORECASE)
EMBEDDED_SCRIPTURE_REF_RE = re.compile(r"[123]?[A-Za-z]{2,4}\.?\s+\d+")
TITLES_OF_RE = re.compile(r"\btitles?\s+of\b", re.IGNORECASE)


def normalize_topic_id(s):
    return re.sub(r"\s+", " ", s.strip().upper())


def resolve_see(raw_see, topic_id_by_norm):
    """
    Try to resolve a "See X" target to a real topic id already in this
    build. Returns (resolved_id_or_None, display_text). display_text is
    what to show as plain text when resolution fails, with footnote-style
    artifacts (bracket markers, "above"/"below" qualifiers, embedded
    scripture refs) cleaned up rather than reproduced verbatim.
    """
    text = FOOTNOTE_MARKER_RE.sub("", raw_see).strip()
    text = LEADING_ALSO_RE.sub("", text).strip()
    display = TRAILING_QUALIFIER_RE.sub("", text).strip()

    # Footnote/subsection artifacts from the print edition, not real
    # topic-to-topic pointers -- never worth trying to link.
    if TITLES_OF_RE.search(display):
        return None, display
    if EMBEDDED_SCRIPTURE_REF_RE.search(display) and re.search(r"\d", display):
        return None, display

    norm = normalize_topic_id(display)
    if norm in topic_id_by_norm:
        return topic_id_by_norm[norm], display
    if "," in norm:
        a, b = (p.strip() for p in norm.split(",", 1))
        swapped = f"{b} {a}"
        if swapped in topic_id_by_norm:
            return topic_id_by_norm[swapped], display
    return None, display


def fetch_source():
    CACHE.mkdir(parents=True, exist_ok=True)
    csv_path = CACHE / "NavesTopicalDictionary.csv"
    if not csv_path.exists() or csv_path.stat().st_size < 500_000:
        print(f"downloading {CSV_URL}")
        subprocess.run(
            ["curl", "-sL", "--max-time", "60", "-o", str(csv_path), CSV_URL], check=True
        )
    return csv_path


def main():
    csv_path = fetch_source()
    with open(csv_path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    print(f"source topics: {len(rows)}")

    shards = {}  # letter -> list of topic dicts
    index = []
    total_refs = verified_refs = dropped_refs = 0
    see_count = 0
    dropped_examples = []

    for row in rows:
        items = parse_entry(row["entry"])
        clean_items = []
        for it in items:
            total_refs += len(it["refs"])
            good = []
            for r in it["refs"]:
                if verify_ref(r):
                    good.append(r)
                    verified_refs += 1
                else:
                    dropped_refs += 1
                    if len(dropped_examples) < 40:
                        dropped_examples.append((row["subject"], r))
            it["refs"] = good
            if it["see"]:
                see_count += 1
            if good or it["see"] or it["label"]:
                clean_items.append(it)
        if not clean_items:
            continue
        section = row["section"].strip().upper()[:1] or "#"
        topic = {"id": row["subject"], "section": section, "items": clean_items}
        shards.setdefault(section, []).append(topic)
        ref_count = sum(len(x["refs"]) for x in clean_items)
        index.append({"id": row["subject"], "section": section, "refCount": ref_count})

    # Second pass: now that the full set of topics this build actually keeps
    # is known, resolve every "See X" pointer against it -- same
    # verify-or-drop discipline as scripture refs, just applied to
    # topic-to-topic links.
    topic_id_by_norm = {normalize_topic_id(t["id"]): t["id"] for t in index}
    resolved_sees = dropped_sees = 0
    dropped_see_examples = []
    for topics in shards.values():
        for topic in topics:
            for it in topic["items"]:
                if not it.get("see"):
                    continue
                resolved, display = resolve_see(it["see"], topic_id_by_norm)
                if resolved:
                    it["see"] = resolved
                    resolved_sees += 1
                else:
                    it["see"] = None
                    it["label"] = f"See {display}"
                    dropped_sees += 1
                    if len(dropped_see_examples) < 40:
                        dropped_see_examples.append((topic["id"], display))

    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.json"):
        f.unlink()
    for section, topics in shards.items():
        (OUT / f"{section}.json").write_text(json.dumps({"topics": topics}, separators=(",", ":")))
    index.sort(key=lambda t: t["id"])
    (OUT / "index.json").write_text(json.dumps({"topics": index}, separators=(",", ":")))

    print(f"topics kept: {len(index)}  |  shards: {len(shards)}")
    print(
        f"refs: {total_refs} total, {verified_refs} verified, {dropped_refs} dropped "
        f"({100 * dropped_refs / max(total_refs, 1):.3f}%)"
    )
    print(
        f"'See' cross-references: {see_count} total, {resolved_sees} resolved to a real "
        f"topic, {dropped_sees} de-linked to plain text "
        f"({100 * dropped_sees / max(see_count, 1):.1f}%)"
    )
    if dropped_see_examples:
        print("de-linked 'See' samples:")
        for subj, target in dropped_see_examples[:15]:
            print(f"  {subj}: See {target}")
    if dropped_examples:
        print("dropped ref samples:")
        for subj, r in dropped_examples[:15]:
            print(f"  {subj}: {r}")
    total_bytes = sum(f.stat().st_size for f in OUT.glob("*.json"))
    print(f"output: {OUT} ({total_bytes / 1024:.0f} KB across {len(list(OUT.glob('*.json')))} files)")


if __name__ == "__main__":
    main()
