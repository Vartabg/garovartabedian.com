#!/usr/bin/env python3
"""
Generate Early Writings chapter plates with free-img + house fit.

This is the process used to replace the Apocalypse of Paul hero stub:
  1. Read curated prompts from public/early/sections/<textId>.json
  2. Call free-img (FLUX by default — Google key is often missing)
  3. Fit to 1280×720 via scripts/media/fit-plate.py
  4. Install into public/early/sections/<textId>/<slug>.jpg

Skips plates that already look real (file ≥ 40 KB) unless --force.

Only writes JPG files. Never touches section JSON. Curated manifests are also
hard-locked in build-section-manifest.mjs via $lock.curated.

Examples:
  # Dry-run: list what would generate for Apocalypse of Paul
  python3 scripts/early/gen-section-plates.py apocalypse-paul --dry-run

  # One chapter smoke test
  python3 scripts/early/gen-section-plates.py apocalypse-paul --only chapter-1

  # Batch five at a time (watch free-tier rate limits)
  python3 scripts/early/gen-section-plates.py apocalypse-paul --limit 5

  # Full text (long — FLUX free quota)
  python3 scripts/early/gen-section-plates.py apocalypse-paul

  # Re-do everything
  python3 scripts/early/gen-section-plates.py apocalypse-paul --force

After a batch:
  npm run media:audit
  # spot-check a few JPGs, then commit public/early/sections/<textId>/
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SECTIONS = ROOT / "public" / "early" / "sections"
FIT = ROOT / "scripts" / "media" / "fit-plate.py"
FREE_IMG = Path.home() / ".local" / "bin" / "free-img"
TMP = Path.home() / "AI_Workspace" / ".tmp" / "early-plates"
MIN_REAL_BYTES = 40_000

# Appended after the curated manifest prompt — free engines need this.
FREE_ENGINE_BOOST = (
    " Horizontal wide 16:9 frieze composition, not square, not portrait. "
    "Flat tempera manuscript leaf on aged parchment with soft foxing. "
    "Stylized symbolic fresco like a Byzantine or Coptic miniature — "
    "not photorealistic, not 3D, not cinematic film still. "
    "Absolutely no readable text, no letters, no words, no captions, "
    "no watermark, no signature, no logo, no modern objects."
)


def load_manifest(text_id: str) -> dict:
    path = SECTIONS / f"{text_id}.json"
    if not path.is_file():
        sys.exit(
            f"No section manifest at {path}\n"
            f"Build it first: node scripts/early/build-section-manifest.mjs {text_id}"
        )
    return json.loads(path.read_text())


def is_stub(path: Path) -> bool:
    return (not path.is_file()) or path.stat().st_size < MIN_REAL_BYTES


def generate_one(
    *,
    text_id: str,
    slug: str,
    prompt: str,
    engine: str,
    sleep_s: float,
) -> Path:
    if not FREE_IMG.is_file():
        sys.exit(f"free-img not found at {FREE_IMG}")

    work = TMP / text_id
    work.mkdir(parents=True, exist_ok=True)
    raw = work / f"{slug}.raw.jpg"
    fitted = work / f"{slug}.fit.jpg"
    dest = SECTIONS / text_id / f"{slug}.jpg"

    full_prompt = prompt.strip() + FREE_ENGINE_BOOST

    print(f"\n→ {text_id}/{slug}  engine={engine}", flush=True)
    proc = subprocess.run(
        [str(FREE_IMG), "--engine", engine, "--out", str(raw), full_prompt],
        check=True,
        text=True,
        capture_output=True,
    )
    if proc.stderr:
        print(proc.stderr.rstrip(), flush=True)

    subprocess.run(
        [
            sys.executable,
            str(FIT),
            str(raw),
            str(fitted),
            "--width",
            "1280",
            "--height",
            "720",
            "--check-stub",
        ],
        check=True,
    )

    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(fitted, dest)
    print(f"  installed {dest}  ({dest.stat().st_size} bytes)", flush=True)

    if sleep_s > 0:
        time.sleep(sleep_s)
    return dest


def main() -> int:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("text_id", help="e.g. apocalypse-paul")
    p.add_argument("--engine", choices=("flux", "google"), default="flux")
    p.add_argument(
        "--only",
        action="append",
        default=[],
        help="Slug(s) to generate (repeatable)",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max plates this run (0 = all pending)",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even if plate looks real",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="List work without calling free-img",
    )
    p.add_argument(
        "--sleep",
        type=float,
        default=1.5,
        help="Seconds between gens (rate limit)",
    )
    p.add_argument("--shuffle", action="store_true", help="Randomize order")
    args = p.parse_args()

    manifest = load_manifest(args.text_id)
    # Curated manifests may contain $lock and other metadata alongside plates.
    slugs = [slug for slug in manifest if not slug.startswith("$")]
    if args.only:
        missing = [s for s in args.only if s not in slugs]
        if missing:
            sys.exit(f"Unknown slug(s) for {args.text_id}: {', '.join(missing)}")
        slugs = args.only

    pending: list[str] = []
    for slug in slugs:
        dest = SECTIONS / args.text_id / f"{slug}.jpg"
        if args.force or is_stub(dest):
            pending.append(slug)

    if args.shuffle:
        random.shuffle(pending)
    if args.limit > 0:
        pending = pending[: args.limit]

    print(
        f"{args.text_id}: {len(pending)} to generate  "
        f"({len(slugs)} selected, "
        f"{sum(not slug.startswith('$') for slug in manifest)} plates in manifest)"
    )
    for slug in pending:
        entry = manifest[slug]
        dest = SECTIONS / args.text_id / f"{slug}.jpg"
        state = "missing" if not dest.is_file() else f"stub {dest.stat().st_size}B"
        print(f"  - {slug:16} {state}")
        if args.dry_run:
            prompt = (entry.get("prompt") or "")[:140]
            print(f"      prompt: {prompt}…")

    if args.dry_run or not pending:
        return 0

    ok = 0
    failed: list[str] = []
    for slug in pending:
        entry = manifest[slug]
        prompt = entry.get("prompt") or ""
        if not prompt:
            print(f"skip {slug}: no prompt in manifest", file=sys.stderr)
            failed.append(slug)
            continue
        try:
            generate_one(
                text_id=args.text_id,
                slug=slug,
                prompt=prompt,
                engine=args.engine,
                sleep_s=args.sleep,
            )
            ok += 1
        except subprocess.CalledProcessError as e:
            print(f"FAIL {slug}: {e}", file=sys.stderr)
            err = getattr(e, "stderr", None) or ""
            if err:
                print(err, file=sys.stderr)
            failed.append(slug)

    print(
        f"\nDone: {ok} installed, {len(failed)} failed"
        + (f" ({', '.join(failed)})" if failed else ""),
        flush=True,
    )
    print("Next: npm run media:audit && spot-check a few JPGs, then commit.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
