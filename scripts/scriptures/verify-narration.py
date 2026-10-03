#!/usr/bin/env python3
"""Verify rendered Scripture chunks with local speech recognition."""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from narration_pipeline import (
    DEFAULT_OUTPUT_ROOT,
    RenderLedger,
    load_task,
    normalized_words,
    receipt_for_task,
    structural_verify,
    word_error_count,
    write_receipt,
)

DEFAULT_ASR_MODEL = "mlx-community/whisper-small-asr-fp16"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        action="append",
        required=True,
        metavar="TRANSLATION:BOOK:CHAPTER",
    )
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--asr-model", default=DEFAULT_ASR_MODEL)
    parser.add_argument("--max-word-error-rate", type=float, default=0.3)
    parser.add_argument("--max-chunk-error-rate", type=float, default=0.55)
    parser.add_argument("--json", action="store_true")
    return parser.parse_args()


def parse_target(value: str):
    parts = value.split(":")
    if len(parts) != 3 or not parts[2].isdigit():
        raise ValueError(f"Invalid target {value!r}; expected TRANSLATION:BOOK:CHAPTER")
    return load_task(parts[0], parts[1], int(parts[2]))


def transcribe_chunk(
    model,
    source: Path,
    start_seconds: float,
    duration_seconds: float,
    temporary_root: Path,
    chunk_index: int,
) -> str:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required for transcript verification")
    segment = temporary_root / f"chunk-{chunk_index}.wav"
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            str(start_seconds),
            "-t",
            str(duration_seconds),
            "-i",
            str(source),
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(segment),
        ],
        check=True,
    )
    result = model.generate(
        str(segment),
        language="en",
        verbose=None,
        condition_on_previous_text=False,
        return_timestamps=True,
        word_timestamps=True,
        hallucination_silence_threshold=0.5,
        temperature=0.0,
    )
    return result.text.strip()


def log(message: str, json_mode: bool) -> None:
    print(message, file=sys.stderr if json_mode else sys.stdout, flush=True)


def evaluate_transcript(
    expected: str, transcript: str, duration_seconds: float
) -> tuple[int, int, str, bool]:
    actual_words = normalized_words(transcript)
    expected_word_count = len(normalized_words(expected))
    max_plausible_words = max(
        math.ceil(duration_seconds * 3.2),
        math.ceil(expected_word_count * 1.35),
    )
    if len(actual_words) <= max_plausible_words:
        errors, word_count = word_error_count(expected, transcript)
        return errors, word_count, transcript, False

    # Whisper can repeat a correct phrase into the silence that pads a short
    # segment to its 30-second analysis window. When the decoded word rate is
    # physically implausible, score the best plausible prefix instead of the
    # hallucinated tail.
    minimum = max(1, math.floor(expected_word_count * 0.6))
    maximum = min(
        len(actual_words),
        max(max_plausible_words, math.ceil(expected_word_count * 1.35)),
    )
    candidates = []
    for length in range(minimum, maximum + 1):
        evaluated = " ".join(actual_words[:length])
        errors, _ = word_error_count(expected, evaluated)
        candidates.append((errors, abs(length - expected_word_count), evaluated))
    errors, _, evaluated = min(candidates)
    return errors, expected_word_count, evaluated, True


def main() -> None:
    args = parse_args()
    try:
        tasks = [parse_target(target) for target in args.target]
    except ValueError as error:
        raise SystemExit(str(error)) from error
    try:
        from mlx_audio.stt.utils import load_model
    except ImportError as error:
        raise SystemExit("mlx-audio is required for transcript verification") from error

    output_root = args.output_root.resolve()
    ledger = RenderLedger(output_root / "state.sqlite3")
    model = load_model(args.asr_model)
    verified = 0
    failed = 0
    results: list[dict] = []
    try:
        for task in tasks:
            output = (
                output_root
                / "audio"
                / task.translation
                / task.book
                / f"{task.chapter}.m4a"
            )
            receipt_path = receipt_for_task(output_root, task)
            log(f"verify {task.id}", args.json)
            try:
                if not output.is_file() or not receipt_path.is_file():
                    raise RuntimeError("rendered audio or receipt is missing")
                receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                if receipt["task"]["sourceHash"] != task.source_hash:
                    raise RuntimeError(
                        "receipt source hash does not match Scripture text"
                    )
                receipt["structuralVerification"] = structural_verify(output, task)

                chunk_results: list[dict] = []
                total_errors = 0
                total_words = 0
                with tempfile.TemporaryDirectory(
                    prefix=f"narration-qa-{task.translation}-{task.book}-"
                ) as temporary:
                    temporary_root = Path(temporary)
                    for chunk in receipt["chunks"]:
                        transcript = transcribe_chunk(
                            model=model,
                            source=output,
                            start_seconds=chunk["startSeconds"],
                            duration_seconds=chunk["durationSeconds"],
                            temporary_root=temporary_root,
                            chunk_index=chunk["index"],
                        )
                        errors, word_count, evaluated, trimmed_tail = (
                            evaluate_transcript(
                                chunk["text"],
                                transcript,
                                chunk["durationSeconds"],
                            )
                        )
                        error_rate = errors / word_count if word_count else 0
                        total_errors += errors
                        total_words += word_count
                        chunk_results.append(
                            {
                                "index": chunk["index"],
                                "expected": chunk["text"],
                                "transcript": transcript,
                                "evaluatedTranscript": evaluated,
                                "hallucinatedTailTrimmed": trimmed_tail,
                                "wordErrorRate": round(error_rate, 4),
                                "passed": error_rate <= args.max_chunk_error_rate,
                            }
                        )

                overall_error_rate = total_errors / total_words if total_words else 0
                passed = overall_error_rate <= args.max_word_error_rate and all(
                    chunk["passed"] for chunk in chunk_results
                )
                transcript_verification = {
                    "model": args.asr_model,
                    "wordErrorRate": round(overall_error_rate, 4),
                    "maxWordErrorRate": args.max_word_error_rate,
                    "maxChunkErrorRate": args.max_chunk_error_rate,
                    "passed": passed,
                    "chunks": chunk_results,
                }
                receipt["transcriptVerification"] = transcript_verification
                write_receipt(receipt_path, receipt)
                ledger.prepare(task, output)
                if not passed:
                    worst = max(
                        chunk_results,
                        key=lambda item: item["wordErrorRate"],
                    )
                    raise RuntimeError(
                        f"ASR word error rate {overall_error_rate:.1%}; "
                        f"worst chunk {worst['index']} at "
                        f"{worst['wordErrorRate']:.1%}"
                    )
                ledger.update(task, "transcript_verified", receipt=receipt)
                verified += 1
                results.append(
                    {
                        "id": task.id,
                        "passed": True,
                        "wordErrorRate": round(overall_error_rate, 4),
                    }
                )
            except Exception as error:
                failed += 1
                ledger.prepare(task, output)
                ledger.update(task, "transcript_failed", error=str(error))
                results.append({"id": task.id, "passed": False, "error": str(error)})
                log(f"failed {task.id}: {error}", args.json)
    finally:
        ledger.close()

    summary = {"verified": verified, "failed": failed, "results": results}
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"Finished: {verified} verified, {failed} failed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
