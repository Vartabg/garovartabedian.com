#!/usr/bin/env python3
"""Plan or render resumable batches with the approved Scripture narrator."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from narration_pipeline import (
    DEFAULT_OUTPUT_ROOT,
    DEFAULT_REFERENCE_AUDIO,
    DEFAULT_REFERENCE_TEXT,
    TRANSLATIONS,
    NarrationRenderer,
    R2Uploader,
    RenderLedger,
    load_task,
    plan_summary,
    plan_tasks,
    receipt_for_task,
    structural_verify,
    write_receipt,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--translation",
        action="append",
        choices=TRANSLATIONS,
        help="Repeat to render more than one translation; defaults to WEB",
    )
    parser.add_argument(
        "--all-translations",
        action="store_true",
        help="Plan or render every available translation",
    )
    parser.add_argument(
        "--target",
        action="append",
        metavar="TRANSLATION:BOOK:CHAPTER",
        help="Repeat to render an explicit priority list in one model session",
    )
    parser.add_argument("--book", action="append", help="Book id, for example GEN")
    parser.add_argument("--start-chapter", type=int)
    parser.add_argument("--end-chapter", type=int)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--bitrate", type=int, choices=(48, 56, 64), default=56)
    parser.add_argument("--seed", type=int, default=23)
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--reference-audio", type=Path, default=DEFAULT_REFERENCE_AUDIO)
    parser.add_argument("--reference-text", type=Path, default=DEFAULT_REFERENCE_TEXT)
    parser.add_argument(
        "--dry-run", action="store_true", help="Print the plan without writing files"
    )
    parser.add_argument(
        "--json", action="store_true", help="Emit machine-readable output"
    )
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload verified chapters to configured Cloudflare R2 storage",
    )
    return parser.parse_args()


def log(message: str, json_mode: bool) -> None:
    print(message, file=sys.stderr if json_mode else sys.stdout, flush=True)


def main() -> None:
    args = parse_args()
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be at least 1")
    if args.all_translations and args.translation:
        raise SystemExit("Use either --all-translations or --translation, not both")
    selectors = (
        args.translation,
        args.all_translations,
        args.book,
        args.start_chapter,
        args.end_chapter,
    )
    if args.target and any(selectors):
        raise SystemExit(
            "--target cannot be combined with translation, book, or chapter selectors"
        )
    try:
        if args.target:
            tasks = []
            for target in args.target:
                parts = target.split(":")
                if len(parts) != 3 or not parts[2].isdigit():
                    raise ValueError(
                        f"Invalid target {target!r}; expected TRANSLATION:BOOK:CHAPTER"
                    )
                tasks.append(load_task(parts[0], parts[1], int(parts[2])))
            if args.limit is not None:
                tasks = tasks[: args.limit]
        else:
            translations = (
                TRANSLATIONS if args.all_translations else (args.translation or ["web"])
            )
            tasks = plan_tasks(
                translations=translations,
                books=args.book,
                start_chapter=args.start_chapter,
                end_chapter=args.end_chapter,
                limit=args.limit,
            )
    except ValueError as error:
        raise SystemExit(str(error)) from error

    summary = plan_summary(tasks, args.bitrate)
    if args.dry_run:
        if args.json:
            print(json.dumps(summary, indent=2))
        else:
            print(
                f"{summary['taskCount']} chapters, {summary['wordCount']:,} words, "
                f"about {summary['estimatedListeningHours']:.1f} listening hours"
            )
            if summary["first"]:
                print(f"First: {summary['first']['id']}")
                print(f"Last:  {summary['last']['id']}")
        return

    output_root = args.output_root.resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    ledger = RenderLedger(output_root / "state.sqlite3")
    renderer: NarrationRenderer | None = None
    uploader = R2Uploader() if args.upload else None
    completed = 0
    skipped = 0
    failed = 0
    try:
        for index, task in enumerate(tasks, start=1):
            output = (
                output_root
                / "audio"
                / task.translation
                / task.book
                / f"{task.chapter}.m4a"
            )
            ledger.prepare(task, output)
            if uploader:
                row = ledger.record(task)
                if (
                    row is not None
                    and row["status"] == "uploaded"
                    and ledger.completed(task, output)
                ):
                    skipped += 1
                    log(f"[{index}/{len(tasks)}] skip {task.id}", args.json)
                    continue
                if (
                    row is None
                    or row["status"] != "transcript_verified"
                    or not ledger.completed(task, output)
                ):
                    failed += 1
                    message = "chapter must pass transcript QA before upload"
                    ledger.update(task, "upload_blocked", error=message)
                    log(
                        f"[{index}/{len(tasks)}] blocked {task.id}: {message}",
                        args.json,
                    )
                    continue
                receipt = json.loads(row["receipt_json"])
                receipt["upload"] = uploader.upload(output, task, receipt)
                ledger.update(task, "uploaded", receipt=receipt)
                write_receipt(receipt_for_task(output_root, task), receipt)
                completed += 1
                continue
            if ledger.completed(task, output):
                skipped += 1
                log(f"[{index}/{len(tasks)}] skip {task.id}", args.json)
                continue

            log(f"[{index}/{len(tasks)}] render {task.id}", args.json)
            try:
                if renderer is None:
                    renderer = NarrationRenderer(
                        reference_audio=args.reference_audio,
                        reference_text=args.reference_text,
                    )
                receipt = renderer.render(
                    task=task,
                    output=output,
                    bitrate_kbps=args.bitrate,
                    seed=args.seed,
                )
                ledger.update(task, "rendered", receipt=receipt)
                receipt["structuralVerification"] = structural_verify(output, task)
                ledger.update(task, "structural_verified", receipt=receipt)
                write_receipt(receipt_for_task(output_root, task), receipt)
                completed += 1
            except Exception as error:
                failed += 1
                ledger.update(task, "failed", error=str(error))
                log(f"[{index}/{len(tasks)}] failed {task.id}: {error}", args.json)
    finally:
        ledger.close()

    result = {
        **summary,
        "outputRoot": str(output_root),
        "rendered": completed,
        "skipped": skipped,
        "failed": failed,
    }
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Finished: {completed} rendered, {skipped} resumed, {failed} failed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
