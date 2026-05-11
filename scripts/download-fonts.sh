#!/usr/bin/env bash
set -euo pipefail

# Plex Variable Fonts + Static Fallbacks :self-hosted in static/fonts/
# Pre-subsetted woff2 via jsdelivr CDN serving fontsource npm packages.
# Versions pinned for reproducibility (NFR-M1). Re-run to refresh.

PLEX_SANS_VER="5.2.8"
PLEX_SERIF_VER="5.2.7"
PLEX_MONO_VER="5.2.7"
PLEX_ARABIC_VER="5.2.9"

CDN="https://cdn.jsdelivr.net/npm"
OUT_DIR="static/fonts"
mkdir -p "$OUT_DIR"

fetch() {
	local url="$1"
	local target="$2"
	echo "↓ ${target}"
	curl -fsSL "$url" -o "$OUT_DIR/$target"
}

# IBM Plex Sans :Variable (wght 100–700), 3 subsets
fetch "$CDN/@fontsource-variable/ibm-plex-sans@${PLEX_SANS_VER}/files/ibm-plex-sans-latin-wght-normal.woff2"     "plex-sans-latin-var.woff2"
fetch "$CDN/@fontsource-variable/ibm-plex-sans@${PLEX_SANS_VER}/files/ibm-plex-sans-latin-ext-wght-normal.woff2" "plex-sans-latin-ext-var.woff2"
fetch "$CDN/@fontsource-variable/ibm-plex-sans@${PLEX_SANS_VER}/files/ibm-plex-sans-cyrillic-wght-normal.woff2"  "plex-sans-cyrillic-var.woff2"

# IBM Plex Serif :Static 400, 3 subsets (Variable n/a auf npm Mai 2026)
fetch "$CDN/@fontsource/ibm-plex-serif@${PLEX_SERIF_VER}/files/ibm-plex-serif-latin-400-normal.woff2"     "plex-serif-latin-400.woff2"
fetch "$CDN/@fontsource/ibm-plex-serif@${PLEX_SERIF_VER}/files/ibm-plex-serif-latin-ext-400-normal.woff2" "plex-serif-latin-ext-400.woff2"
fetch "$CDN/@fontsource/ibm-plex-serif@${PLEX_SERIF_VER}/files/ibm-plex-serif-cyrillic-400-normal.woff2"  "plex-serif-cyrillic-400.woff2"

# IBM Plex Mono :Static 400, 3 subsets (Variable n/a auf npm Mai 2026)
fetch "$CDN/@fontsource/ibm-plex-mono@${PLEX_MONO_VER}/files/ibm-plex-mono-latin-400-normal.woff2"     "plex-mono-latin-400.woff2"
fetch "$CDN/@fontsource/ibm-plex-mono@${PLEX_MONO_VER}/files/ibm-plex-mono-latin-ext-400-normal.woff2" "plex-mono-latin-ext-400.woff2"
fetch "$CDN/@fontsource/ibm-plex-mono@${PLEX_MONO_VER}/files/ibm-plex-mono-cyrillic-400-normal.woff2"  "plex-mono-cyrillic-400.woff2"

# IBM Plex Sans Arabic :Static 400 + 600
fetch "$CDN/@fontsource/ibm-plex-sans-arabic@${PLEX_ARABIC_VER}/files/ibm-plex-sans-arabic-arabic-400-normal.woff2" "plex-sans-arabic-400.woff2"
fetch "$CDN/@fontsource/ibm-plex-sans-arabic@${PLEX_ARABIC_VER}/files/ibm-plex-sans-arabic-arabic-600-normal.woff2" "plex-sans-arabic-600.woff2"

echo ""
echo "✓ Downloaded $(ls -1 "$OUT_DIR"/*.woff2 | wc -l | tr -d ' ') woff2 files to $OUT_DIR/"
