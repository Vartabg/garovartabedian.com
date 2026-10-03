#!/bin/bash
# Usage: copy-stone-image.sh <source.jpg> <stoneId>
set -euo pipefail
SRC="$1"
STONE_ID="$2"
DEST_DIR="$(dirname "$0")/../../public/jesus/stones"
mkdir -p "$DEST_DIR"
cp "$SRC" "${DEST_DIR}/${STONE_ID}.jpg"
echo "saved ${DEST_DIR}/${STONE_ID}.jpg"
node "$(dirname "$0")/build-stones-manifest.mjs"
