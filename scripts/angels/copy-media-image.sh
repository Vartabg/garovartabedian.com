#!/bin/bash
# Usage: copy-media-image.sh <source.jpg> <plateId>
set -euo pipefail
SRC="$1"
PLATE_ID="$2"
DEST_DIR="$(dirname "$0")/../../public/angels/plates"
mkdir -p "$DEST_DIR"
cp "$SRC" "${DEST_DIR}/${PLATE_ID}.jpg"
echo "saved ${DEST_DIR}/${PLATE_ID}.jpg"
node "$(dirname "$0")/build-media-manifest.mjs"
