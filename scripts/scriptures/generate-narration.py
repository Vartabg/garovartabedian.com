#!/usr/bin/env python3
"""Generate one Scripture chapter with the approved baritone narrator."""

from __future__ import annotations

import argparse
from pathlib import Path

from narration_pipeline import (
    AUDIO_ROOT,
    DEFAULT_REFERENCE_AUDIO,
    DEFAULT_REFERENCE_TEXT,
    NarrationRenderer,
    load_task,
    structural_verify,
    write_receipt,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("translation", choices=("web", "kjv", "drb", "brenton"))
    parser.add_argument("book", help="Book id, for example PSA")
    parser.add_argument("chapter", type=int)
    parser.add_argument("--seed", type=int, default=23)
    parser.add_argument("--bitrate", type=int, choices=(48, 56, 64, 128), default=128)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--processed-wav-output",
        type=Path,
        help="Also save the filtered lossless master for codec auditions",
    )
    parser.add_argument("--receipt", type=Path)
    parser.add_argument("--reference-audio", type=Path, default=DEFAULT_REFERENCE_AUDIO)
    parser.add_argument("--reference-text", type=Path, default=DEFAULT_REFERENCE_TEXT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        task = load_task(args.translation, args.book, args.chapter)
    except ValueError as error:
        raise SystemExit(str(error)) from error
    output = (
        args.output or AUDIO_ROOT / task.translation / task.book / f"{task.chapter}.m4a"
    ).resolve()
    renderer = NarrationRenderer(
        reference_audio=args.reference_audio,
        reference_text=args.reference_text,
    )
    receipt = renderer.render(
        task=task,
        output=output,
        bitrate_kbps=args.bitrate,
        seed=args.seed,
        processed_wav_output=args.processed_wav_output,
    )
    receipt["structuralVerification"] = structural_verify(output, task)
    if args.receipt:
        write_receipt(args.receipt.resolve(), receipt)
    print(f"Generated {output}")


if __name__ == "__main__":
    main()
