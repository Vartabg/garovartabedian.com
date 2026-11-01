#!/usr/bin/env python3
"""Render new overviews or repair sections with short-chunk ASR checks.

uv run --python 3.12 --with mlx-audio scripts/research-audio/repair.py \
  --target watchers:1 --target historical-jesus:1
"""
import argparse
import hashlib
import importlib.util
import json
import math
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

from render import ROOT, script_hash

sys.path.insert(0, str(ROOT / "scripts/scriptures"))
from narration_pipeline import DEFAULT_REFERENCE_AUDIO, FILTER_CHAIN, MODEL_ID, NarrationRenderer, file_sha256, normalized_words  # noqa: E402


def canonical_speech(text):
    """Treat Whisper's digits and the script's spoken numbers as equivalent."""
    names = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
    numbers = {word: index for index, word in enumerate(names)}
    numbers.update(dict(zip("twenty thirty forty fifty sixty seventy eighty ninety".split(), range(20, 100, 10))))
    words, result, index = normalized_words(text.replace("’", "").replace("'", "")), [], 0
    while index < len(words):
        if words[index] not in numbers:
            result.append(words[index]); index += 1; continue
        number = 0
        while index < len(words):
            word = words[index]
            if word in numbers:
                number += numbers[word]
            elif word == "hundred":
                number = max(1, number) * 100
            elif word == "and" and number >= 100 and index + 1 < len(words) and words[index + 1] in numbers:
                pass
            else:
                break
            index += 1
        result.append(str(number))
    return " ".join(result)


def probe(path):
    data = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)]))
    return float(data["format"]["duration"])


def complete_script_end(text, recognition, segments, duration):
    """Locate an exact, complete script prefix before an unwanted closing tail.

    Never repairs missing or substituted script words. The returned time lets
    us actually remove the unwanted tail from the emitted audio.
    """
    expected = canonical_speech(text).split()
    actual = canonical_speech(recognition).split()
    if len(actual) <= len(expected) or actual[:len(expected)] != expected:
        return None
    words = [word for segment in segments for word in segment.get("words", [])]
    for index in range(1, len(words) + 1):
        prefix = canonical_speech(" ".join(word["word"] for word in words[:index])).split()
        if prefix == expected:
            end = float(words[index - 1]["end"])
            next_start = float(words[index]["start"]) if index < len(words) else duration
            if end > 0 and end + 0.1 < min(next_start, duration):
                return min(end + 0.15, (end + next_start) / 2, duration)
            return None
    return None


def prepare_requests(episodes, manifest, receipts, output, new_ids, requested_targets, voice_hash):
    """Validate the whole request before model loading or artifact mutation.

    New episodes always render every section. A partial existing publication
    is never treated as a new episode, even if one of its files is missing.
    """
    if bool(new_ids) == bool(requested_targets):
        raise ValueError("Choose either --new or --target")
    by_id = {episode["id"]: episode for episode in episodes}
    if len(by_id) != len(episodes):
        raise ValueError("Duplicate episode IDs in scripts")
    targets, initialized = {}, {}
    for episode_id in new_ids:
        if episode_id in initialized:
            raise ValueError(f"Duplicate new episode: {episode_id}")
        if episode_id not in by_id or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", episode_id):
            raise ValueError(f"Unknown or invalid episode: {episode_id}")
        episode = by_id[episode_id]
        if not episode["sections"]:
            raise ValueError(f"Episode has no sections: {episode_id}")
        if episode_id in manifest or episode_id in receipts or (output / f"{episode_id}.m4a").exists():
            raise ValueError(f"Existing or partial publication; use --target after inspection: {episode_id}")
        targets[episode_id] = set(range(len(episode["sections"])))
        initialized[episode_id] = {
            "src": f"/research-audio/{episode_id}.m4a",
            "scriptSha256": script_hash(episode),
            "model": MODEL_ID,
            "voiceReferenceSha256": voice_hash,
        }
    for requested in requested_targets:
        try:
            episode_id, number = requested.rsplit(":", 1)
            index = int(number) - 1
        except ValueError as error:
            raise ValueError(f"Invalid target: {requested}") from error
        if episode_id not in by_id or episode_id not in manifest:
            raise ValueError(f"Unknown or unpublished target: {requested}; use --new for a new episode")
        episode, recording = by_id[episode_id], manifest[episode_id]
        if not 0 <= index < len(episode["sections"]):
            raise ValueError(f"Section outside episode: {requested}")
        if index in targets.setdefault(episode_id, set()):
            raise ValueError(f"Duplicate target: {requested}")
        if recording.get("scriptSha256") != script_hash(episode):
            raise ValueError(f"Stale script: {episode_id}")
        media = output / f"{episode_id}.m4a"
        if recording.get("src") != f"/research-audio/{episode_id}.m4a" or not media.is_file():
            raise ValueError(f"Missing or invalid media: {episode_id}")
        if recording.get("sha256") != file_sha256(media):
            raise ValueError(f"Changed media: {episode_id}")
        targets[episode_id].add(index)
    return targets, initialized



def publication_records(manifest, receipts, episode_id, recording, section_receipts):
    """Return publishable maps containing only completed recordings.

    In particular, planning metadata for other new episodes cannot leak into
    the manifest when the first episode of a batch finishes.
    """
    published = {**manifest, episode_id: recording}
    for key, value in published.items():
        if (not re.fullmatch(r"[0-9a-f]{64}", value.get("sha256", ""))
                or not value.get("chapters") or not 300 <= value.get("durationSeconds", 0) <= 480):
            raise ValueError(f"Cannot publish incomplete recording: {key}")
    updated_receipts = {**receipts, episode_id: {
        "sha256": recording["sha256"], "scriptSha256": recording["scriptSha256"],
        "sections": section_receipts,
    }}
    return published, updated_receipts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    requests = parser.add_mutually_exclusive_group(required=True)
    requests.add_argument("--target", action="append", default=[], help="existing episode:section (one-based)")
    requests.add_argument("--new", action="append", default=[], help="unpublished episode ID; render all sections with ASR checks")
    args = parser.parse_args()
    episodes = json.loads((ROOT / "src/lib/research-audio/episodes.json").read_text())
    output = ROOT / "public/research-audio"
    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    receipts_path = output / "render-receipts.json"
    receipts = json.loads(receipts_path.read_text()) if receipts_path.exists() else {}
    targets, initialized = prepare_requests(episodes, manifest, receipts, output,
        args.new, args.target, file_sha256(DEFAULT_REFERENCE_AUDIO))
    # New metadata stays separate so finishing one episode cannot publish
    # unrendered entries for the rest of a batch.
    for episode_id in list(targets):
        if episode_id in initialized:
            continue
        previous = receipts.get(episode_id, {})
        completed = {section["section"] - 1 for section in previous.get("sections", [])}
        media = ROOT / "public" / manifest[episode_id]["src"].lstrip("/")
        if (episode_id not in initialized and targets[episode_id] <= completed
                and previous.get("sha256") == manifest[episode_id]["sha256"]
                and previous.get("sha256") == file_sha256(media)):
            print(f"verified existing repair {episode_id}", flush=True)
            del targets[episode_id]
    if not targets:
        return

    import mlx.core as mx
    import numpy as np
    from scipy.io import wavfile
    from mlx_audio.stt.utils import load_model
    renderer = NarrationRenderer()
    recognizer = load_model("mlx-community/whisper-small-asr-fp16")
    original_generate = renderer.model.generate
    spec = importlib.util.spec_from_file_location("scripture_verify", ROOT / "scripts/scriptures/verify-narration.py")
    scripture_verify = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scripture_verify)
    cache = Path.home() / "Library/Caches/garovartabedian/research-audio/chunks"
    cache.mkdir(parents=True, exist_ok=True)
    voice_hash = file_sha256(DEFAULT_REFERENCE_AUDIO)

    with tempfile.TemporaryDirectory(prefix="research-repair-") as temporary:
        temporary = Path(temporary)
        chunk_checks = []

        def checked_generate(**kwargs):
            text = kwargs["text"]
            key = hashlib.sha256(json.dumps(["checked-v1", text, MODEL_ID, voice_hash]).encode()).hexdigest()
            cache_audio, cache_receipt = cache / f"{key}.wav", cache / f"{key}.json"
            if cache_audio.exists() and cache_receipt.exists():
                saved = json.loads(cache_receipt.read_text())
                if saved["sha256"] == file_sha256(cache_audio):
                    rate, pcm = wavfile.read(cache_audio)
                    chunk_checks.append(saved["check"])
                    print(f"reuse checked chunk {len(chunk_checks)}", flush=True)
                    return [SimpleNamespace(audio=pcm, sample_rate=rate)]
            for attempt in range(4):
                seed = 1200 + len(chunk_checks) + attempt * 503
                mx.random.seed(seed)
                kwargs["max_tokens"] = max(128, len(text.split()) * 12)
                results = list(original_generate(**kwargs))
                if not results:
                    continue
                pcm = np.concatenate([np.asarray(result.audio, dtype=np.float32).reshape(-1) for result in results])
                clip = temporary / "check.wav"
                wavfile.write(clip, results[0].sample_rate, pcm)
                # Match the published signal and the full-episode verifier.
                # FFmpeg also avoids an unnecessary MLX-side 24→16 kHz resample.
                asr_clip = temporary / "asr.wav"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-af", FILTER_CHAIN,
                    "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(asr_clip)], check=True)
                recognition = recognizer.generate(str(asr_clip), language="en", verbose=None, temperature=0.0,
                    condition_on_previous_text=False, return_timestamps=True, word_timestamps=True,
                    hallucination_silence_threshold=0.5)
                recognized = recognition.text
                duration = len(pcm) / results[0].sample_rate
                errors, count, evaluated, trimmed = scripture_verify.evaluate_transcript(canonical_speech(text), canonical_speech(recognized), duration)
                passed = errors <= max(1, math.floor(count * 0.06)) and duration <= max(6.0, len(text.split()) * 0.8)
                removed_tail = None
                if not passed:
                    removed_tail = complete_script_end(text, recognized, recognition.segments, duration)
                    if removed_tail is not None:
                        # Keep a short quiet margin after the final matched word.
                        pcm = pcm[:int(removed_tail * results[0].sample_rate)].copy()
                        fade = min(len(pcm), int(results[0].sample_rate * 0.025))
                        pcm[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
                        results = [SimpleNamespace(audio=pcm, sample_rate=results[0].sample_rate)]
                        duration = len(pcm) / results[0].sample_rate
                        errors, count, evaluated = 0, len(canonical_speech(text).split()), canonical_speech(text)
                        passed = duration <= max(6.0, len(text.split()) * 0.8)
                print(f"chunk {len(chunk_checks) + 1} attempt {attempt + 1}: {errors}/{count} word errors", flush=True)
                if passed:
                    check = {"text": text, "transcript": recognized, "evaluatedTranscript": evaluated, "trimmedAsrTail": trimmed,
                        "seed": seed, "errors": errors, "wordCount": count, "durationSeconds": duration,
                        "repetitionPenalty": kwargs["repetition_penalty"],
                        "removedClosingTailAtSeconds": removed_tail}
                    chunk_checks.append(check)
                    wavfile.write(cache_audio, results[0].sample_rate, pcm)
                    cache_receipt.write_text(json.dumps({"sha256": file_sha256(cache_audio), "check": check}))
                    return results
                print(f"Rejected recognition ({duration:.2f}s): {recognized}", flush=True)
                wavfile.write(cache / f"{key}-rejected.wav", results[0].sample_rate, pcm)
            raise RuntimeError(f"Chunk did not pass after four attempts: {text}")

        renderer.model.generate = checked_generate
        for episode in episodes:
            episode_id = episode["id"]
            if episode_id not in targets:
                continue
            recording = initialized[episode_id] if episode_id in initialized else manifest[episode_id]
            target = ROOT / "public" / recording["src"].lstrip("/")
            if episode_id not in initialized:
                assert file_sha256(target) == recording["sha256"]
            parts, chapters, cursor, section_receipts = [], [], 0.0, []
            for index, section in enumerate(episode["sections"]):
                part = temporary / f"{episode_id}-{index}.m4a"
                if index in targets[episode_id]:
                    print(f"repair {episode_id} section {index + 1}", flush=True)
                    chunk_checks = []
                    task = SimpleNamespace(title=section["title"], verses=tuple(re.split(r"(?<=[.!?])\s+", section["text"])),
                        id=f"{episode_id}:{index + 1}", word_count=len((section["title"] + " " + section["text"]).split()),
                        source_hash=recording["scriptSha256"], object_key=recording["src"])
                    render_receipt = renderer.render(task, part, 64, 4200)
                    section_receipts.append({"section": index + 1, "chunks": render_receipt["chunks"], "checks": chunk_checks})
                else:
                    chapter = recording["chapters"][index]
                    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(chapter["startSeconds"]), "-t", str(chapter["durationSeconds"]),
                        "-i", str(target), "-c", "copy", "-avoid_negative_ts", "make_zero", str(part)], check=True)
                duration = probe(part)
                chapters.append({"startSeconds": round(cursor, 3), "durationSeconds": round(duration, 3)})
                cursor += duration
                parts.append(part)
            listing = temporary / "parts.txt"
            listing.write_text("".join(f"file '{part}'\n" for part in parts))
            joined = temporary / "joined.m4a"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", "-movflags", "+faststart", str(joined)], check=True)
            duration = probe(joined)
            assert 300 <= duration <= 480
            os.replace(joined, target)
            recording.update({"sha256": file_sha256(target), "durationSeconds": duration, "chapters": chapters})
            manifest, receipts = publication_records(manifest, receipts, episode_id, recording, section_receipts)
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            receipts_path.write_text(json.dumps(receipts, indent=2) + "\n")
            print(f"repaired {episode_id}", flush=True)


if __name__ == "__main__":
    main()
