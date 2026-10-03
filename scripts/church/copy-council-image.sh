#!/bin/bash
# Usage: copy-council-image.sh <source.jpg> <councilId>
set -euo pipefail
SRC="$1"
COUNCIL_ID="$2"
DEST_DIR="$(dirname "$0")/../../public/church/councils"
mkdir -p "$DEST_DIR"
cp "$SRC" "${DEST_DIR}/${COUNCIL_ID}.jpg"
echo "saved ${DEST_DIR}/${COUNCIL_ID}.jpg"
node "$(dirname "$0")/build-council-manifest.mjs"
