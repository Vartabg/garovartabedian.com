#!/usr/bin/env bash
# Vendored from ~/job-search/make-pdf.sh on 2026-08-28.
# Source SHA-256: c483f4e5e0937784bdecae87ba37567abbad88cd138b4187a79bdae7867cb07c
#
# Render an HTML file to PDF via headless Chrome without allowing Chrome's
# lingering process to stall the caller.
#
# Usage: make-pdf.sh <input.html> <output.pdf> [max_seconds]
# Exit codes: 0 ok; 1 timeout/no PDF; 2 bad path; 3 browser missing;
#             4 produced PDF failed content checks.
set -uo pipefail

IN="${1:?usage: make-pdf.sh <input.html> <output.pdf> [max_seconds]}"
OUT="${2:?usage: make-pdf.sh <input.html> <output.pdf> [max_seconds]}"
MAX="${3:-30}"

abspath() {
  local d b
  d="$(dirname -- "$1")"
  b="$(basename -- "$1")"
  d="$(cd -- "$d" 2>/dev/null && pwd -P)" || return 1
  [ "$d" = "/" ] && { printf '/%s\n' "$b"; return 0; }
  printf '%s/%s\n' "$d" "$b"
}

url_encode_path() {
  local s="$1"
  s="${s//%/%25}"
  s="${s//#/%23}"
  s="${s//\?/%3F}"
  s="${s// /%20}"
  printf '%s\n' "$s"
}

file_size() {
  [ -f "$1" ] || { printf '0\n'; return 0; }
  wc -c < "$1" | tr -d '[:space:]'
}

[ -f "$IN" ] || { echo "ERR: input not found: $IN" >&2; exit 2; }
IN_ABS="$(abspath "$IN")" || { echo "ERR: cannot resolve input path: $IN" >&2; exit 2; }
[ -f "$IN_ABS" ] || { echo "ERR: input not found: $IN_ABS" >&2; exit 2; }
OUT_ABS="$(abspath "$OUT")" || {
  echo "ERR: output directory does not exist: $(dirname -- "$OUT")" >&2
  exit 2
}
OUT="$OUT_ABS"
IN_URL="file://$(url_encode_path "$IN_ABS")"

CHROME="${CHROME_BIN:-}"
if [ -n "$CHROME" ] && [ ! -x "$CHROME" ]; then
  echo "ERR: CHROME_BIN is not executable: $CHROME" >&2
  exit 3
fi
if [ -z "$CHROME" ]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [ -x "$candidate" ] && CHROME="$candidate" && break
  done
fi
if [ -z "$CHROME" ]; then
  for command_name in google-chrome-stable google-chrome chromium chromium-browser; do
    candidate="$(command -v "$command_name" 2>/dev/null || true)"
    [ -n "$candidate" ] && [ -x "$candidate" ] && CHROME="$candidate" && break
  done
fi
[ -z "$CHROME" ] && {
  echo "ERR: no Chrome/Chromium-family browser found" >&2
  exit 3
}

rm -f "$OUT"
PROFILE_DIRECTORY="$(mktemp -d /tmp/cpdf.XXXXXX)"
"$CHROME" --headless=new --disable-gpu \
  --user-data-dir="$PROFILE_DIRECTORY" --no-pdf-header-footer \
  --virtual-time-budget=8000 --print-to-pdf="$OUT" "$IN_URL" \
  >/dev/null 2>&1 &
CHROME_PID=$!

ok=0
for _ in $(seq 1 "$MAX"); do
  if [ -f "$OUT" ] && [ "$(file_size "$OUT")" -gt 1000 ]; then
    sleep 1
    ok=1
    break
  fi
  kill -0 "$CHROME_PID" 2>/dev/null || break
  sleep 1
done

kill "$CHROME_PID" 2>/dev/null
pkill -P "$CHROME_PID" 2>/dev/null
wait "$CHROME_PID" 2>/dev/null || true
rm -rf "$PROFILE_DIRECTORY" 2>/dev/null

if [ "$ok" != 1 ] || [ ! -f "$OUT" ]; then
  rm -f "$OUT"
  echo "ERR: PDF not produced within ${MAX}s" >&2
  exit 1
fi

TEXT_FILE="$(mktemp /tmp/cpdf-txt.XXXXXX)"
if command -v pdftotext >/dev/null 2>&1; then
  pdftotext "$OUT" "$TEXT_FILE" >/dev/null 2>&1 &
  TEXT_PID=$!
  for _ in $(seq 1 10); do
    kill -0 "$TEXT_PID" 2>/dev/null || break
    sleep 1
  done
  kill "$TEXT_PID" 2>/dev/null
  wait "$TEXT_PID" 2>/dev/null || true

  TEXT="$(<"$TEXT_FILE")"
  rm -f "$TEXT_FILE"
  if printf '%s' "$TEXT" | grep -qE "ERR_[A-Z_]+|This site can.t be reached|Your file was not found"; then
    MARKER="$(printf '%s' "$TEXT" | grep -oE "ERR_[A-Z_]+" | head -1)"
    rm -f "$OUT"
    echo "ERR: browser error page rendered instead of the document (${MARKER:-error page})" >&2
    exit 4
  fi

  NONSPACE_CHARACTERS="$(printf '%s' "$TEXT" | tr -d '[:space:]' | wc -c | tr -d ' ')"
  if [ "${NONSPACE_CHARACTERS:-0}" -lt 20 ]; then
    rm -f "$OUT"
    echo "ERR: PDF has almost no extractable text (${NONSPACE_CHARACTERS} chars)" >&2
    exit 4
  fi
else
  rm -f "$TEXT_FILE"
  echo "ERR: pdftotext is required for resume validation" >&2
  rm -f "$OUT"
  exit 4
fi

echo "OK: wrote $OUT ($(file_size "$OUT") bytes)"
exit 0
