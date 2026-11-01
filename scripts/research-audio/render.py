#!/usr/bin/env python3
"""Render authored research scripts with the site's approved local narrator.

uv run --python 3.12 --with mlx-audio scripts/research-audio/render.py
"""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/scriptures"))
from narration_pipeline import (  # noqa: E402
    NarrationRenderer, MODEL_ID, DEFAULT_REFERENCE_AUDIO, file_sha256,
    structural_verify,
)


def script_hash(episode):
    return hashlib.sha256(json.dumps(episode, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def main():
    episodes = json.loads((ROOT / "src/lib/research-audio/episodes.json").read_text())
    output = ROOT / "public/research-audio"
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    renderer = None
    for episode in episodes:
        episode_id = episode["id"]
        source_hash = script_hash(episode)
        target = output / f"{episode_id}.m4a"
        existing = manifest.get(episode_id, {})
        if (target.exists() and existing.get("scriptSha256") == source_hash
                and existing.get("voiceReferenceSha256") == file_sha256(DEFAULT_REFERENCE_AUDIO)
                and existing.get("model") == MODEL_ID
                and existing.get("sha256") == file_sha256(target)):
            print(f"verified existing {episode_id}", flush=True)
            continue
        renderer = renderer or NarrationRenderer()
        chapters, cursor = [], 0.0
        with tempfile.TemporaryDirectory(prefix="research-audio-") as temp:
            parts = []
            for index, section in enumerate(episode["sections"]):
                print(f"render {episode_id} section {index + 1}", flush=True)
                # The section heading is spoken and is part of the visible transcript.
                sentences = tuple(re.split(r"(?<=[.!?])\s+", section["text"]))
                task = SimpleNamespace(
                    title=section["title"], verses=sentences,
                    translation="editorial", book=episode_id, book_name=episode["title"],
                    chapter=index + 1, id=f"{episode_id}:{index + 1}",
                    object_key=f"research-audio/{episode_id}.m4a",
                    source_hash=source_hash,
                    word_count=len((section["title"] + " " + section["text"]).split()),
                )
                part = Path(temp) / f"{index}.m4a"
                renderer.render(task, part, 64, 1200 + index)
                check = structural_verify(part, task)
                chapters.append({"startSeconds": round(cursor, 3), "durationSeconds": check["durationSeconds"]})
                cursor += check["durationSeconds"]
                parts.append(part)
            listing = Path(temp) / "parts.txt"
            listing.write_text("".join(f"file '{part}'\n" for part in parts))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
                            "-c", "copy", "-movflags", "+faststart", str(target)], check=True)
        probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(target)]))
        manifest[episode_id] = {
            "src": f"/research-audio/{episode_id}.m4a",
            "durationSeconds": float(probe["format"]["duration"]),
            "sha256": file_sha256(target), "scriptSha256": source_hash,
            "model": MODEL_ID, "voiceReferenceSha256": file_sha256(DEFAULT_REFERENCE_AUDIO),
            "chapters": chapters,
        }
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"finished {episode_id}: {cursor:.1f}s", flush=True)


if __name__ == "__main__":
    main()
