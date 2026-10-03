#!/bin/bash
# Usage: copy-life-image.sh <source.jpg> <eventId>
set -euo pipefail
SRC="$1"
EVENT_ID="$2"
DEST_DIR="$(dirname "$0")/../../public/jesus/life"
mkdir -p "$DEST_DIR"
cp "$SRC" "${DEST_DIR}/${EVENT_ID}.jpg"
echo "saved ${DEST_DIR}/${EVENT_ID}.jpg"
node "$(dirname "$0")/build-life-manifest.mjs"
