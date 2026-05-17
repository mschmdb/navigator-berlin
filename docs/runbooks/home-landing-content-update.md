---
type: runbook
audience: owner
last-verified: 2026-05-17
---

# Runbook: Home-Landing-Content aktualisieren (Story 2.12)

Wer was auf der Landing zeigen will, ändert genau ein Content-File unter
`src/lib/content/`. Komponenten konsumieren über typed Imports + Tests
schlagen an wenn etwas fehlt oder kaputt ist.

## 6 Update-Pfade

### 1. Layer-Teaser-Liste (`38 Datensätze`)

Datei: `src/lib/content/home-layer-teasers.ts`

- `slug` MUSS in `static/layers/MANIFEST.json` existieren oder in der
  Composite-Whitelist (`oepnv-composite`).
- `iconKey` muss in `home-layer-teasers.svelte` ICON_MAP registriert sein
  (Lucide-Komponente). Neuen Key hinzufügen heisst: Map auch ergänzen.
- Test `home-content.test.ts` validiert Slug-Existenz beim Build.

### 2. Featured-Bezirke (`12 Bezirke`-Section)

Datei: `src/lib/content/home-featured-bezirke.ts`

- `slug` MUSS einer der 12 prerendered Bezirks-Slugs sein.
- `teaser` 1 Satz, max 200 Zeichen, niemals em-dash, niemals „lebenswert".
- Rationale-Kommentar pro Eintrag dokumentieren — spätere Editorial-Pässe
  verstehen sonst die Auswahl-Logik nicht mehr.

### 3. Daten-Quellen-Block (`6 von 38 Quellen`)

Datei: `src/lib/content/home-data-sources.ts`

- 6 zentrale Anbieter mit Lizenz-Marker.
- KEIN Auto-Generate aus Manifest — das ist editorial-kurated.

### 4. Quick-Links (`5 Adressen zum Probieren`)

Datei: `src/lib/content/home-quick-links.ts`

- Berliner Landmarks mit eingefrorenen Koordinaten.
- Test prüft Berlin-Bbox (13.0–13.8 lng, 52.3–52.7 lat).
- Geocode-Round-Trip optional: `pnpm geocode "Adress-String"` und mit den
  gespeicherten lng/lat vergleichen.

### 5. Screenshot-Asset

Datei: `src/lib/content/screenshot-manifest.ts` + Asset unter `static/`.

- PNG/JPG → `cwebp -q 82 in.png -o in.webp` konvertieren (Hero-Eager-
  Budget max 80 KB unrealistisch bei Karten-Screenshots; bis 500 KB OK).
- Pfad im Manifest aktualisieren.
- Test `HOME_SCREENSHOTS` prüft File-Existenz beim Build.

### 6. Hero / Hook / Texte

Direkt in den Svelte-Komponenten unter `src/lib/components/home/`. Phase-1
DE-only Hardcoded; bei Phase-3-EN-Coverage wandern die Strings nach
Paraglide-Messages.

## Stil-Disziplin

- Memory `feedback_no_em_dashes`: niemals U+2014 (`—`).
- Memory `feedback_no_lebenswert`: niemals „lebenswert" / „Lebensqualität".
- Memory `feedback_no_live_data`: keine „aktuell"/„live"-Sprache.
- Skill `no-ai-slop`: keine „Was..."-Anlaut-Headings, keine Floskeln.
