#!/usr/bin/env python3
"""
Re-encode public/**/*.jpg for deploy payload size.

Preserves pixel dimensions exactly (media audit is strict about plate sizes).
Only replaces a file when the new encoding is smaller.

Usage:
  python3 scripts/media/compress-jpgs.py            # quality 78 (default)
  python3 scripts/media/compress-jpgs.py --quality 72
  python3 scripts/media/compress-jpgs.py --dry-run
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"


def compress_one(path: Path, quality: int, dry_run: bool) -> tuple[int, int, bool]:
    """Return (orig_bytes, new_bytes, replaced)."""
    orig = path.stat().st_size
    with Image.open(path) as im:
        rgb = im.convert("RGB")
        size = rgb.size
        buf = io.BytesIO()
        rgb.save(
            buf,
            format="JPEG",
            quality=quality,
            optimize=True,
            progressive=True,
            subsampling=2,  # 4:2:0 — fine for web plates
        )
    data = buf.getvalue()
    new = len(data)
    if new >= orig:
        return orig, new, False
    if dry_run:
        return orig, new, False
    # Write via temp sibling so a crash mid-write never truncates the source.
    tmp = path.with_suffix(".jpg.tmp")
    tmp.write_bytes(data)
    # Verify dimensions survived
    with Image.open(tmp) as check:
        if check.size != size:
            tmp.unlink(missing_ok=True)
            raise RuntimeError(f"dimension drift on {path}: {size} → {check.size}")
    tmp.replace(path)
    return orig, new, True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quality", type=int, default=78, help="JPEG quality 1–95 (default 78)")
    parser.add_argument("--dry-run", action="store_true", help="Report savings without writing")
    parser.add_argument(
        "--root",
        type=Path,
        default=PUBLIC,
        help="Directory to scan (default: public/)",
    )
    args = parser.parse_args()
    if not 40 <= args.quality <= 95:
        print("quality must be between 40 and 95", file=sys.stderr)
        return 2

    files = sorted(args.root.rglob("*.jpg")) + sorted(args.root.rglob("*.JPG"))
    # de-dupe case
    seen: set[Path] = set()
    paths: list[Path] = []
    for f in files:
        r = f.resolve()
        if r in seen:
            continue
        seen.add(r)
        paths.append(f)

    if not paths:
        print(f"No JPEGs under {args.root}")
        return 0

    total_orig = 0
    total_new = 0
    replaced = 0
    skipped = 0
    errors = 0

    for path in paths:
        try:
            orig, new, did = compress_one(path, args.quality, args.dry_run)
        except Exception as exc:  # noqa: BLE001 — report and continue
            print(f"ERROR {path.relative_to(ROOT)}: {exc}", file=sys.stderr)
            errors += 1
            continue
        total_orig += orig
        total_new += min(orig, new) if not args.dry_run else min(orig, new)
        if did or (args.dry_run and new < orig):
            replaced += 1
            mark = "would shrink" if args.dry_run else "shrunk"
            print(
                f"  {mark:12} {path.relative_to(ROOT)}  "
                f"{orig // 1024}KB → {new // 1024}KB  ({100 * new / orig:.0f}%)"
            )
        else:
            skipped += 1

    saved = total_orig - total_new
    print()
    print(
        f"{'Dry-run: ' if args.dry_run else ''}"
        f"{len(paths)} JPEGs · {replaced} smaller · {skipped} already smaller/equal · {errors} errors"
    )
    print(
        f"Payload: {total_orig / 1024 / 1024:.1f} MB → {total_new / 1024 / 1024:.1f} MB "
        f"(save {saved / 1024 / 1024:.1f} MB, {100 * saved / total_orig:.0f}%)"
        if total_orig
        else "nothing"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
