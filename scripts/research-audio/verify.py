#!/usr/bin/env python3
"""Check each overview chapter against its authored script with local ASR.

uv run --python 3.12 --with mlx-audio scripts/research-audio/verify.py
"""
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/scriptures"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render import script_hash  # noqa: E402
from repair import canonical_speech  # noqa: E402
from narration_pipeline import file_sha256, word_error_count  # noqa: E402


def main():
    import importlib.util
    from mlx_audio.stt.utils import load_model
    spec = importlib.util.spec_from_file_location("scripture_verify", ROOT / "scripts/scriptures/verify-narration.py")
    scripture_verify = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scripture_verify)
    model_id = "mlx-community/whisper-small-asr-fp16"
    model = load_model(model_id)
    episodes = json.loads((ROOT / "src/lib/research-audio/episodes.json").read_text())
    manifest = json.loads((ROOT / "public/research-audio/manifest.json").read_text())
    reports, failed = {}, False
    for episode in episodes:
        recording = manifest[episode["id"]]
        path = ROOT / "public" / recording["src"].lstrip("/")
        if recording["scriptSha256"] != script_hash(episode) or recording["sha256"] != file_sha256(path):
            raise SystemExit(f"Stale recording: {episode['id']}")
        checks = []
        with tempfile.TemporaryDirectory(prefix="research-asr-") as temporary:
            for index, section in enumerate(episode["sections"]):
                chapter = recording["chapters"][index]
                transcript = scripture_verify.transcribe_chunk(model, path, chapter["startSeconds"], chapter["durationSeconds"], Path(temporary), index)
                expected = section["title"] + ". " + section["text"]
                errors, count = word_error_count(canonical_speech(expected), canonical_speech(transcript))
                rate = errors / max(1, count)
                checks.append({"section": index + 1, "wordErrorRate": round(rate, 4), "transcript": transcript, "passed": rate <= 0.20})
                failed |= rate > 0.20
                print(f"{episode['id']} section {index + 1}: WER {rate:.1%}", flush=True)
        reports[episode["id"]] = {"sha256": recording["sha256"], "scriptSha256": recording["scriptSha256"], "asrModel": model_id, "checks": checks}
    (ROOT / "public/research-audio/verification.json").write_text(json.dumps(reports, indent=2) + "\n")
    if failed:
        raise SystemExit("Audio transcript verification failed; inspect and re-render affected sections")


if __name__ == "__main__":
    main()
