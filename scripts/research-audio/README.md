# Research listening companions

Eight authored overviews cover the site’s eight research worlds:
`/scriptures`, `/apostles`, `/early`, `/word`, `/evidence`, `/church/councils`,
`/angels/fall`, and `/jesus/history`. The scripts and section-level source references live in
`src/lib/research-audio/episodes.json`. These are editorial syntheses, not
reconstructions of ancient speech or NotebookLM productions.

The player uses static AAC files and native browser controls. It never starts
automatically, uses `preload="none"`, and retains a transcript and download
without JavaScript. JavaScript adds speed selection, chapter seeking, error
messages, and pausing when another media element begins playback.

## Adding a listening companion

Write the episode and its section-level source references in `episodes.json`.
Review factual claims against the linked primary texts before recording. Use
`repair.py --new ID` to render every section through the existing short-chunk
ASR checks directly, without an unchecked first pass. Repeated `--new` options
can render several new episodes. The command refuses any existing media,
manifest entry, or render receipt for a requested new ID; use `--target` for
repairs to published episodes. An interrupted unpublished episode reuses its
accepted PCM cache. If interruption leaves partial publication files, inspect
those files before choosing a recovery; `--new` will not overwrite them.

```sh
uv run --python 3.12 --with mlx-audio==0.6.0 scripts/research-audio/repair.py --new NEW_ID
uv run --python 3.12 --with mlx-audio==0.6.0 scripts/research-audio/verify.py
```

Keep each final recording between five and eight minutes; measure the output
rather than padding it or assuming a speaking rate. The renderer writes actual
chapter times and checksums only after the audio passes its generation checks.
The separate whole-episode verifier still runs before publication.

Place `ResearchAudio` in the route’s server-rendered content. If a surrounding
component is interactive, pass the rendered overview as a `ReactNode` slot;
do not import the full scripts and manifest into that client component.
The catalog coverage test requires an overview in every research world, and
the browser suite checks every published route for real playback, chapter
seeking, speed changes, transcript accessibility, and no-JavaScript access.

## Reproduction

Use the existing approved `smooth-baritone.wav` reference and Qwen3-TTS model
from the Scripture narration pipeline. Generation is local; no runtime service
or secret is needed by a visitor. Python 3.12, MLX Audio, and ffmpeg are required.
The first run downloads the model from Hugging Face.

```sh
uv run --python 3.12 --with mlx-audio scripts/research-audio/render.py
uv run --python 3.12 --with mlx-audio scripts/research-audio/repair.py \
  --target nicaea:2 --target watchers:1 --target watchers:3 \
  --target historical-jesus:1 --target historical-jesus:4 --target historical-jesus:5
uv run --python 3.12 --with mlx-audio scripts/research-audio/verify.py
node --test scripts/smoke/research-audio.test.mjs
python3 -m unittest discover -s scripts/research-audio -p 'test_*.py'
```

Review the script against its cited sources before rendering. Each section’s
heading is spoken before its text. The renderer reuses an existing episode only
when both the script hash and audio hash match. It records actual chapter
durations, model identity, reference-voice hash, and audio hash in the manifest.
ASR verification independently checks each chapter against the authored script
and records its recognized text and word error rate. A chapter above 20% word
error blocks verification; listen to any suspicious result and correct or
regenerate it rather than raising the threshold. Listen to representative
sections before publishing. Automated recognition cannot assess scholarship,
voice quality, or the strength of an interpretation.

The smoke suite rejects stale scripts, changed audio, invalid chapter maps, and
missing or failed ASR receipts. Source corrections require re-rendering and
verification. Keep the source-review date in `ResearchAudio.tsx` accurate when
revising the collection.

If a generated section drops words or repeats itself, repair that section:

```sh
uv run --python 3.12 --with mlx-audio scripts/research-audio/repair.py --target watchers:1
uv run --python 3.12 --with mlx-audio scripts/research-audio/verify.py
```

Repair keeps the other sections as encoded audio, re-renders the chosen section,
and checks every short chunk before accepting it. Failed chunks get up to four
seeded attempts; an unresolved failure stops the repair. Spoken numbers and ASR
digits are compared as equivalent quantities. Accepted chunk text, recognition,
seeds, and timings are recorded in `render-receipts.json`. Final episode hashes,
chapter times, and full-episode verification must be refreshed before shipping.
Short-chunk recognition reuses the Scripture verifier’s safeguard against
physically implausible repetitions decoded into Whisper’s padded analysis
window. Raw and evaluated transcripts and the trimming flag remain in the
receipt; excessive generated duration still rejects a take. Accepted PCM chunks
are cached locally by text, model, and voice hash so interrupted repairs resume.
When recognition contains the complete script as an exact prefix, aligned word
times can identify an unwanted closing tail. The repair physically cuts after
the last script word, preserves a quiet margin, and records the cut time.
Missing or substituted script words prevent that edit. The joined audio must
still pass the independent whole-episode verification.

## Public deployment check

After promoting the verified build, run the committed-media check against the
public origin. It checks every overview’s server-rendered transcript, source
links, disclosure, full media checksum, and initial/seek byte ranges:

```sh
node scripts/research-audio/check-live.mjs > /tmp/research-audio-live.json
```

`RESEARCH_AUDIO_ORIGIN` can select another HTTPS deployment origin. The browser
suite separately checks real decoding and control interactions; a checksum or
HTTP status alone is not a playback test.
