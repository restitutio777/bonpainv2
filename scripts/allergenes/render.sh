#!/usr/bin/env bash
# Rendert das Allergen-PDF: baut die eigenständige HTML-Datei und druckt sie
# mit Chrome headless nach public/allergenes.pdf (A4, keine Ränder).
#
#   bash scripts/allergenes/render.sh
#
# Voraussetzung: Google Chrome installiert. Fonts/Logo werden vom Build-Skript
# als data-URI eingebettet, die HTML ist also offline vollständig.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
html="$here/allergenes.html"
pdf="$root/public/allergenes.pdf"

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$chrome" ] || chrome="$(command -v google-chrome || command -v chromium || true)"
if [ -z "${chrome:-}" ] || [ ! -x "$chrome" ]; then
  echo "✗ Google Chrome nicht gefunden." >&2
  exit 1
fi

node "$here/build-pdf.mjs"
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer --no-margins \
  --print-to-pdf="$pdf" "file://$html" 2>/dev/null
echo "✓ PDF écrit : $pdf"
