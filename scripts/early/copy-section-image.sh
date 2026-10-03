#!/bin/bash
# Usage: copy-section-image.sh <source.jpg> <textId> <sectionSlug>
#
# Fits the source into house plate size (1280×720) before install.
# Prefer scripts/early/gen-section-plates.py for free-img batches.
#
# Rebuilds auto-generated section manifests only. Curated manifests
# ($lock.curated) are never rewritten — the builder enforces the same lock.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$1"
TEXT_ID="$2"
SLUG="$3"
DEST_DIR="${ROOT}/public/early/sections/${TEXT_ID}"
DEST="${DEST_DIR}/${SLUG}.jpg"
MANIFEST="${ROOT}/public/early/sections/${TEXT_ID}.json"
mkdir -p "$DEST_DIR"

python3 "${ROOT}/scripts/media/fit-plate.py" "$SRC" "$DEST" --width 1280 --height 720 --check-stub
echo "saved ${DEST}"

cd "$ROOT"
# Exit 0 = not curated (safe to rebuild). Exit 1 = curated lock.
if node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { isCuratedSectionManifest } from './scripts/early/section-manifest-lock.mjs';
const p = process.argv[1];
if (!existsSync(p)) process.exit(0);
const m = JSON.parse(readFileSync(p, 'utf8'));
process.exit(isCuratedSectionManifest(m) ? 1 : 0);
" "$MANIFEST"; then
  node "${ROOT}/scripts/early/build-section-manifest.mjs" "$TEXT_ID"
else
  echo "locked  ${TEXT_ID}.json curated — left prompts untouched"
fi
