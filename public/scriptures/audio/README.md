# Authored Scripture narration

These files are generated locally and served as static audio. No text-to-speech
API is called when a reader presses **Listen**.

The current narrator uses Qwen3-TTS voice cloning with the approved
`scripts/scriptures/reference/smooth-baritone.wav` sample and its matching
transcript. The checked-in reference keeps future chapters consistent.
Qwen3-TTS is Apache-2.0 licensed.

Generate and structurally verify one chapter from the repository root:

```bash
uv run --python 3.12 --with mlx-audio \
  scripts/scriptures/generate-narration.py web PSA 23 --bitrate 56
```

Plan a batch without loading the model or writing files:

```bash
python3 scripts/scriptures/batch-narration.py \
  --translation web --book GEN --dry-run
```

Render a resumable batch:

```bash
uv run --python 3.12 --with mlx-audio \
  scripts/scriptures/batch-narration.py \
  --translation web --book GEN --bitrate 56
```

Render a cross-book priority list without reloading the model:

```bash
uv run --python 3.12 --with mlx-audio \
  scripts/scriptures/batch-narration.py \
  --target web:PSA:23 \
  --target web:GEN:1 \
  --target web:MAT:1 \
  --bitrate 56
```

The batch process loads the model once, writes output outside the repository by
default, checkpoints every chapter in SQLite, emits a JSON QA receipt, and
resumes only files whose source and audio checksums still match. Each file must
pass codec, sample-rate, channel, duration, and local speech-recognition checks
before it can be uploaded:

```bash
uv run --python 3.12 --with mlx-audio \
  scripts/scriptures/verify-narration.py \
  --target web:GEN:1 \
  --target web:MAT:1
```

To upload verified files to Cloudflare R2, provide these values in the shell
(never commit them) and add `--upload`:

```text
R2_ACCOUNT_ID
R2_BUCKET
R2_PUBLIC_BASE_URL
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Uploads use immutable object paths under
`narration/smooth-baritone-v2/<translation>/<book>/<chapter>.m4a` and verify
the SHA-256 metadata after transfer. Generation requires `ffmpeg` and the local
MLX Audio environment. Listen to representative results before publishing a
book or changing the public `manifest.json`.
