#!/usr/bin/env python3
"""
Fit any generated still into a house plate size (default 1280×720).

What went wrong on Apocalypse of Paul:
  free-img FLUX returns 1024×1024 squares (sometimes with a corner watermark).
  House plates are strict 16:9 @ 1280×720 (see scripts/media/audit.mjs).

This script is the durable post-step after free-img:
  1. center-crop to target aspect (bias slightly upward to keep sky/city)
  2. resize to exact W×H
  3. light parchment-friendly color/contrast nudge
  4. JPEG encode at web quality

Usage:
  python3 scripts/media/fit-plate.py in.jpg out.jpg
  python3 scripts/media/fit-plate.py in.jpg out.jpg --width 1280 --height 720
  python3 scripts/media/fit-plate.py in.jpg --in-place
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

# Below this, a 1280×720 JPEG is almost certainly a text stub / empty plate.
MIN_REAL_BYTES = 40_000


def fit_image(
    img: Image.Image,
    width: int,
    height: int,
    *,
    bias_up: float = 0.08,
) -> Image.Image:
    rgb = img.convert("RGB")
    src_w, src_h = rgb.size
    target_ratio = width / height
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        # too wide — crop sides
        new_w = int(round(src_h * target_ratio))
        left = max(0, (src_w - new_w) // 2)
        rgb = rgb.crop((left, 0, left + new_w, src_h))
    elif src_ratio < target_ratio:
        # too tall — crop top/bottom, bias up (keep heaven/city)
        new_h = int(round(src_w / target_ratio))
        slack = src_h - new_h
        top = max(0, int(round(slack * (0.5 - bias_up))))
        if top + new_h > src_h:
            top = src_h - new_h
        rgb = rgb.crop((0, top, src_w, top + new_h))

    out = rgb.resize((width, height), Image.Resampling.LANCZOS)
    # Mild house look: slightly less saturated, a touch more contrast
    out = ImageEnhance.Color(out).enhance(0.94)
    out = ImageEnhance.Contrast(out).enhance(1.04)
    return out


def encode_jpeg(img: Image.Image, quality: int = 86) -> bytes:
    buf = io.BytesIO()
    img.save(
        buf,
        format="JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling=2,
    )
    return buf.getvalue()


def is_likely_stub(path: Path, min_bytes: int = MIN_REAL_BYTES) -> bool:
    """Heuristic: tiny files at plate size are text placeholders, not art."""
    if not path.is_file():
        return True
    return path.stat().st_size < min_bytes


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("src", type=Path, help="Source image (any size)")
    p.add_argument("dest", type=Path, nargs="?", help="Destination .jpg")
    p.add_argument("--in-place", action="store_true", help="Overwrite src")
    p.add_argument("--width", type=int, default=1280)
    p.add_argument("--height", type=int, default=720)
    p.add_argument("--quality", type=int, default=86)
    p.add_argument(
        "--check-stub",
        action="store_true",
        help="Exit 2 if output is still under the stub size threshold",
    )
    args = p.parse_args()

    if args.in_place:
        dest = args.src
    elif args.dest:
        dest = args.dest
    else:
        print("dest path required (or --in-place)", file=sys.stderr)
        return 2

    if not args.src.is_file():
        print(f"missing source: {args.src}", file=sys.stderr)
        return 2

    with Image.open(args.src) as im:
        fitted = fit_image(im, args.width, args.height)
    data = encode_jpeg(fitted, args.quality)

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(dest)

    print(f"{dest}  {len(data)} bytes  {args.width}x{args.height}")
    if args.check_stub and len(data) < MIN_REAL_BYTES:
        print(
            f"WARN: output still looks like a stub (< {MIN_REAL_BYTES} bytes)",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
