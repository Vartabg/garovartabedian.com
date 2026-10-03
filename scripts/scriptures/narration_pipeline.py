#!/usr/bin/env python3
"""Shared, resumable Scripture narration pipeline."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sqlite3
import subprocess
import tempfile
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEXT_ROOT = PROJECT_ROOT / "public" / "scriptures" / "text"
CANONS_PATH = PROJECT_ROOT / "public" / "scriptures" / "canons.json"
AUDIO_ROOT = PROJECT_ROOT / "public" / "scriptures" / "audio"
REFERENCE_ROOT = PROJECT_ROOT / "scripts" / "scriptures" / "reference"
DEFAULT_REFERENCE_AUDIO = REFERENCE_ROOT / "smooth-baritone.wav"
DEFAULT_REFERENCE_TEXT = REFERENCE_ROOT / "smooth-baritone.txt"
MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16"
NARRATOR_ID = "smooth-baritone-v2"
TRANSLATIONS = ("web", "kjv", "drb", "brenton")
DEFAULT_OUTPUT_ROOT = (
    Path.home()
    / "Library"
    / "Caches"
    / "garovartabedian"
    / "scripture-narration"
    / NARRATOR_ID
)
FILTER_CHAIN = (
    "highpass=f=45,"
    "bass=g=2.5:f=120:w=0.65,"
    "treble=g=-1.2:f=3800:w=0.6,"
    "acompressor=threshold=0.16:ratio=1.6:"
    "attack=25:release=220:makeup=1.15,"
    "loudnorm=I=-18:LRA=8:TP=-1.5"
)


@dataclass(frozen=True)
class ChapterTask:
    translation: str
    book: str
    book_name: str
    chapter: int
    verses: tuple[str, ...]
    source_hash: str
    word_count: int

    @property
    def id(self) -> str:
        return f"{self.translation}:{self.book}:{self.chapter}"

    @property
    def title(self) -> str:
        return f"{self.book_name}, chapter {self.chapter}"

    @property
    def object_key(self) -> str:
        return (
            f"narration/{NARRATOR_ID}/{self.translation}/{self.book}/{self.chapter}.m4a"
        )


def clean_for_speech(value: str) -> str:
    return re.sub(r"\[([^\]]+)\]", r"\1", value).strip()


def chapter_chunks(
    title: str, verses: Iterable[str], max_chars: int = 220
) -> list[str]:
    chunks: list[str] = []
    current = f"{title}."
    for verse in verses:
        clean = clean_for_speech(verse)
        joined = f"{current}\n{clean}" if current else clean
        if current and len(joined) > max_chars:
            chunks.append(current)
            current = clean
        else:
            current = joined
    if current:
        chunks.append(current)
    return chunks


def _source_hash(translation: str, book: str, chapter: int, verses: list[str]) -> str:
    source = json.dumps(
        {
            "translation": translation,
            "book": book,
            "chapter": chapter,
            "verses": verses,
        },
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def _word_count(verses: Iterable[str]) -> int:
    return sum(
        len(re.findall(r"\b[\w’'-]+\b", verse, flags=re.UNICODE)) for verse in verses
    )


def load_task(translation: str, book: str, chapter: int) -> ChapterTask:
    translation = translation.lower()
    book = book.upper()
    if translation not in TRANSLATIONS:
        raise ValueError(f"Unknown translation: {translation}")
    if not re.fullmatch(r"[1-4]?[A-Z0-9]{2,5}", book):
        raise ValueError(f"Invalid book id: {book}")

    source = TEXT_ROOT / translation / f"{book}.json"
    if not source.is_file():
        raise ValueError(f"{book} is not available in {translation}")
    payload = json.loads(source.read_text(encoding="utf-8"))
    chapters = payload.get("chapters", [])
    if chapter < 1 or chapter > len(chapters):
        raise ValueError(f"Chapter {chapter} is not available in {source}")
    verses = list(chapters[chapter - 1])
    return ChapterTask(
        translation=translation,
        book=book,
        book_name=payload["name"],
        chapter=chapter,
        verses=tuple(verses),
        source_hash=_source_hash(translation, book, chapter, verses),
        word_count=_word_count(verses),
    )


def plan_tasks(
    translations: Iterable[str],
    books: Iterable[str] | None = None,
    start_chapter: int | None = None,
    end_chapter: int | None = None,
    limit: int | None = None,
) -> list[ChapterTask]:
    requested_translations = [value.lower() for value in translations]
    invalid = sorted(set(requested_translations) - set(TRANSLATIONS))
    if invalid:
        raise ValueError(f"Unknown translation(s): {', '.join(invalid)}")
    if not requested_translations:
        raise ValueError("At least one translation is required")

    requested_books = [value.upper() for value in books] if books else None
    if (start_chapter is not None or end_chapter is not None) and (
        requested_books is None or len(requested_books) != 1
    ):
        raise ValueError("Chapter ranges require exactly one --book")
    if start_chapter is not None and start_chapter < 1:
        raise ValueError("--start-chapter must be at least 1")
    if end_chapter is not None and end_chapter < 1:
        raise ValueError("--end-chapter must be at least 1")
    if (
        start_chapter is not None
        and end_chapter is not None
        and start_chapter > end_chapter
    ):
        raise ValueError("--start-chapter cannot exceed --end-chapter")

    canons = json.loads(CANONS_PATH.read_text(encoding="utf-8"))
    book_order = canons["bookOrder"]
    if requested_books:
        unknown_books = sorted(set(requested_books) - set(book_order))
        if unknown_books:
            raise ValueError(f"Unknown book id(s): {', '.join(unknown_books)}")
        selected_books = [book for book in book_order if book in requested_books]
    else:
        selected_books = book_order

    tasks: list[ChapterTask] = []
    for translation in requested_translations:
        for book in selected_books:
            source = TEXT_ROOT / translation / f"{book}.json"
            if not source.is_file():
                if requested_books:
                    raise ValueError(f"{book} is not available in {translation}")
                continue
            payload = json.loads(source.read_text(encoding="utf-8"))
            chapter_count = len(payload.get("chapters", []))
            first = start_chapter or 1
            last = min(end_chapter or chapter_count, chapter_count)
            if first > chapter_count:
                raise ValueError(
                    f"Chapter {first} is not available in {translation}/{book}"
                )
            for chapter in range(first, last + 1):
                verses = list(payload["chapters"][chapter - 1])
                tasks.append(
                    ChapterTask(
                        translation=translation,
                        book=book,
                        book_name=payload["name"],
                        chapter=chapter,
                        verses=tuple(verses),
                        source_hash=_source_hash(translation, book, chapter, verses),
                        word_count=_word_count(verses),
                    )
                )
                if limit is not None and len(tasks) >= limit:
                    return tasks
    return tasks


def plan_summary(tasks: list[ChapterTask], bitrate_kbps: int) -> dict[str, Any]:
    word_count = sum(task.word_count for task in tasks)
    estimated_seconds = word_count / 125 * 60
    return {
        "narrator": NARRATOR_ID,
        "taskCount": len(tasks),
        "wordCount": word_count,
        "estimatedListeningHours": round(estimated_seconds / 3600, 1),
        "bitrateKbps": bitrate_kbps,
        "estimatedBytes": round(estimated_seconds * bitrate_kbps * 1000 / 8),
        "first": _task_summary(tasks[0]) if tasks else None,
        "last": _task_summary(tasks[-1]) if tasks else None,
    }


def _task_summary(task: ChapterTask) -> dict[str, Any]:
    return {
        "id": task.id,
        "wordCount": task.word_count,
        "sourceHash": task.source_hash,
        "objectKey": task.object_key,
    }


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalized_words(value: str) -> list[str]:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.findall(r"[a-z0-9]+", value.lower())


def word_error_count(expected: str, actual: str) -> tuple[int, int]:
    """Return Levenshtein word errors and expected word count."""
    expected_words = normalized_words(expected)
    actual_words = normalized_words(actual)
    previous = list(range(len(actual_words) + 1))
    for expected_index, expected_word in enumerate(expected_words, start=1):
        current = [expected_index]
        for actual_index, actual_word in enumerate(actual_words, start=1):
            current.append(
                min(
                    previous[actual_index] + 1,
                    current[actual_index - 1] + 1,
                    previous[actual_index - 1] + (expected_word != actual_word),
                )
            )
        previous = current
    return previous[-1], len(expected_words)


class RenderLedger:
    """SQLite checkpoint ledger for interruption-safe batches."""

    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                translation TEXT NOT NULL,
                book TEXT NOT NULL,
                chapter INTEGER NOT NULL,
                source_hash TEXT NOT NULL,
                output_path TEXT NOT NULL,
                status TEXT NOT NULL,
                receipt_json TEXT,
                error TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

    def prepare(self, task: ChapterTask, output: Path) -> None:
        existing = self.connection.execute(
            "SELECT source_hash FROM chapters WHERE id = ?", (task.id,)
        ).fetchone()
        if existing is None:
            self.connection.execute(
                """
                INSERT INTO chapters
                    (id, translation, book, chapter, source_hash, output_path, status)
                VALUES (?, ?, ?, ?, ?, ?, 'planned')
                """,
                (
                    task.id,
                    task.translation,
                    task.book,
                    task.chapter,
                    task.source_hash,
                    str(output),
                ),
            )
        elif existing["source_hash"] != task.source_hash:
            self.connection.execute(
                """
                UPDATE chapters
                SET source_hash = ?, output_path = ?, status = 'planned',
                    receipt_json = NULL, error = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (task.source_hash, str(output), task.id),
            )
        else:
            self.connection.execute(
                "UPDATE chapters SET output_path = ? WHERE id = ?",
                (str(output), task.id),
            )
        self.connection.commit()

    def completed(self, task: ChapterTask, output: Path) -> bool:
        row = self.connection.execute(
            "SELECT * FROM chapters WHERE id = ?", (task.id,)
        ).fetchone()
        if (
            row is None
            or row["source_hash"] != task.source_hash
            or row["status"]
            not in ("structural_verified", "transcript_verified", "uploaded")
            or not output.is_file()
            or not row["receipt_json"]
        ):
            return False
        receipt = json.loads(row["receipt_json"])
        return receipt.get("sha256") == file_sha256(output)

    def record(self, task: ChapterTask) -> sqlite3.Row | None:
        return self.connection.execute(
            "SELECT * FROM chapters WHERE id = ?", (task.id,)
        ).fetchone()

    def update(
        self,
        task: ChapterTask,
        status: str,
        receipt: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        self.connection.execute(
            """
            UPDATE chapters
            SET status = ?, receipt_json = COALESCE(?, receipt_json), error = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                status,
                json.dumps(receipt, ensure_ascii=False) if receipt else None,
                error,
                task.id,
            ),
        )
        self.connection.commit()


class NarrationRenderer:
    """Loads the approved voice model once and renders any number of chapters."""

    def __init__(
        self,
        reference_audio: Path = DEFAULT_REFERENCE_AUDIO,
        reference_text: Path = DEFAULT_REFERENCE_TEXT,
    ) -> None:
        if not reference_audio.is_file():
            raise RuntimeError(f"Reference audio is not available: {reference_audio}")
        if not reference_text.is_file():
            raise RuntimeError(
                f"Reference transcript is not available: {reference_text}"
            )
        try:
            from mlx_audio.tts.utils import load_model
        except ImportError as error:
            raise RuntimeError(
                "mlx-audio is required to render narration; use the project TTS venv"
            ) from error

        self.reference_audio = reference_audio.resolve()
        self.reference_text = reference_text.read_text(encoding="utf-8").strip()
        self.model = load_model(MODEL_ID)
        # Route the VoiceDesign checkpoint through reference-audio cloning so every
        # chapter inherits the exact approved timbre rather than redesigning it.
        self.model.config.tts_model_type = "base"

    def render(
        self,
        task: ChapterTask,
        output: Path,
        bitrate_kbps: int,
        seed: int,
        processed_wav_output: Path | None = None,
    ) -> dict[str, Any]:
        try:
            import mlx.core as mx
            import numpy as np
            from scipy.io import wavfile
        except ImportError as error:
            raise RuntimeError(
                "MLX, NumPy, and SciPy are required to render narration"
            ) from error

        chunks = chapter_chunks(task.title, task.verses)
        rendered: list[Any] = []
        chunk_receipts: list[dict[str, Any]] = []
        sample_rate = 24_000
        sample_cursor = 0
        for index, text in enumerate(chunks):
            mx.random.seed(seed + index)
            results = list(
                self.model.generate(
                    text=text,
                    ref_audio=str(self.reference_audio),
                    ref_text=self.reference_text,
                    lang_code="English",
                    temperature=0.58,
                    top_k=30,
                    top_p=0.82,
                    repetition_penalty=1.5,
                )
            )
            if not results:
                raise RuntimeError(f"No audio generated for chunk {index + 1}")
            sample_rate = results[0].sample_rate
            pieces = [
                np.asarray(result.audio, dtype=np.float32).reshape(-1)
                for result in results
            ]
            chunk_audio = np.concatenate(pieces).astype(np.float32)
            rendered.append(chunk_audio)
            chunk_receipts.append(
                {
                    "index": index + 1,
                    "text": text,
                    "startSeconds": round(sample_cursor / sample_rate, 3),
                    "durationSeconds": round(len(chunk_audio) / sample_rate, 3),
                }
            )
            sample_cursor += len(chunk_audio)
            if index < len(chunks) - 1:
                gap = np.zeros(int(sample_rate * 0.55), dtype=np.float32)
                rendered.append(gap)
                sample_cursor += len(gap)

        audio = np.concatenate(rendered).astype(np.float32)
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("ffmpeg is required to encode narration")

        output = output.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            suffix=".wav", dir=output.parent, delete=False
        ) as temporary:
            raw_path = Path(temporary.name)
        with tempfile.NamedTemporaryFile(
            suffix=".m4a", dir=output.parent, delete=False
        ) as temporary:
            encoded_path = Path(temporary.name)
        try:
            wavfile.write(raw_path, sample_rate, audio)
            if processed_wav_output:
                processed_wav_output = processed_wav_output.resolve()
                processed_wav_output.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(
                    [
                        ffmpeg,
                        "-hide_banner",
                        "-loglevel",
                        "error",
                        "-y",
                        "-i",
                        str(raw_path),
                        "-af",
                        FILTER_CHAIN,
                        "-ar",
                        "24000",
                        "-c:a",
                        "pcm_s24le",
                        str(processed_wav_output),
                    ],
                    check=True,
                )
                encode_input = processed_wav_output
                encode_filter: list[str] = []
            else:
                encode_input = raw_path
                encode_filter = ["-af", FILTER_CHAIN]
            subprocess.run(
                [
                    ffmpeg,
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(encode_input),
                    *encode_filter,
                    "-ar",
                    "24000",
                    "-ac",
                    "1",
                    "-c:a",
                    "aac",
                    "-b:a",
                    f"{bitrate_kbps}k",
                    str(encoded_path),
                ],
                check=True,
            )
            os.replace(encoded_path, output)
        finally:
            raw_path.unlink(missing_ok=True)
            encoded_path.unlink(missing_ok=True)

        receipt = {
            "version": 1,
            "narrator": NARRATOR_ID,
            "task": _task_summary(task),
            "model": MODEL_ID,
            "seed": seed,
            "bitrateKbps": bitrate_kbps,
            "sampleRate": 24_000,
            "channels": 1,
            "sha256": file_sha256(output),
            "sizeBytes": output.stat().st_size,
            "chunks": chunk_receipts,
        }
        return receipt


def structural_verify(path: Path, task: ChapterTask) -> dict[str, Any]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required to verify narration")
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "stream=codec_name,sample_rate,channels:format=duration,size",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    if len(streams) != 1:
        raise RuntimeError(f"Expected one audio stream, found {len(streams)}")
    stream = streams[0]
    duration = float(payload["format"]["duration"])
    expected_seconds = task.word_count / 125 * 60
    problems: list[str] = []
    if stream.get("codec_name") != "aac":
        problems.append(f"codec is {stream.get('codec_name')}, expected aac")
    if int(stream.get("sample_rate", 0)) != 24_000:
        problems.append(f"sample rate is {stream.get('sample_rate')}, expected 24000")
    if int(stream.get("channels", 0)) != 1:
        problems.append(f"channels is {stream.get('channels')}, expected 1")
    if duration < expected_seconds * 0.45 or duration > expected_seconds * 2.0:
        problems.append(
            f"duration {duration:.1f}s is outside the expected range "
            f"for {task.word_count} words"
        )
    if problems:
        raise RuntimeError("; ".join(problems))
    return {
        "codec": stream["codec_name"],
        "sampleRate": int(stream["sample_rate"]),
        "channels": int(stream["channels"]),
        "durationSeconds": round(duration, 3),
        "sizeBytes": int(payload["format"]["size"]),
    }


class R2Uploader:
    """Uploads immutable narration objects through Cloudflare's S3 API."""

    REQUIRED_ENV = (
        "R2_ACCOUNT_ID",
        "R2_BUCKET",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
    )

    def __init__(self) -> None:
        missing = [name for name in self.REQUIRED_ENV if not os.environ.get(name)]
        if missing:
            raise RuntimeError(
                "R2 upload is not configured; missing " + ", ".join(missing)
            )
        aws = shutil.which("aws")
        if not aws:
            raise RuntimeError("AWS CLI is required for R2 uploads")
        self.aws = aws
        self.bucket = os.environ["R2_BUCKET"]
        self.endpoint = (
            f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
        )
        self.public_base_url = os.environ.get("R2_PUBLIC_BASE_URL", "").rstrip("/")

    def upload(
        self, path: Path, task: ChapterTask, receipt: dict[str, Any]
    ) -> dict[str, Any]:
        subprocess.run(
            [
                self.aws,
                "s3api",
                "put-object",
                "--endpoint-url",
                self.endpoint,
                "--bucket",
                self.bucket,
                "--key",
                task.object_key,
                "--body",
                str(path),
                "--content-type",
                "audio/mp4",
                "--cache-control",
                "public,max-age=31536000,immutable",
                "--metadata",
                f"sha256={receipt['sha256']},source-hash={task.source_hash}",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        head = subprocess.run(
            [
                self.aws,
                "s3api",
                "head-object",
                "--endpoint-url",
                self.endpoint,
                "--bucket",
                self.bucket,
                "--key",
                task.object_key,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        remote = json.loads(head.stdout)
        remote_hash = remote.get("Metadata", {}).get("sha256")
        if remote_hash != receipt["sha256"]:
            raise RuntimeError(f"R2 checksum metadata mismatch for {task.object_key}")
        return {
            "bucket": self.bucket,
            "objectKey": task.object_key,
            "sha256": remote_hash,
            "publicUrl": (
                f"{self.public_base_url}/{task.object_key}"
                if self.public_base_url
                else None
            ),
        }


def write_receipt(path: Path, receipt: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, path)


def receipt_for_task(output_root: Path, task: ChapterTask) -> Path:
    return (
        output_root / "receipts" / task.translation / task.book / f"{task.chapter}.json"
    )


def task_as_json(task: ChapterTask) -> dict[str, Any]:
    payload = asdict(task)
    payload["id"] = task.id
    payload["objectKey"] = task.object_key
    payload["verses"] = list(task.verses)
    return payload
