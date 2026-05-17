---
type: pipeline
audience: both
last-verified: 2026-05-17
---

# Daten- und Build-Pipeline

navigator.berlin nutzt mehrere unabhängige Build-Schritte vor `vite build`. Die
Reihenfolge ist optional, aber pro Schritt gibt es harte Abhängigkeiten.

## Übersicht

```
data:fetch          # Story 1.3: GeoJSON von ODIS/FIS-Broker → static/layers/
data:oepnv-index    # Story 1.x: ÖPNV-Stop-Index → static/oepnv-stops-index.json
data:kiez-scores    # Story 1.28: Kiez-Score-Aggregat → static/kiez-scores/
data:aggregate      # Story 2.0: Postgres bezirk_stats + kiez_stats (DRZ → DB)
webmcp:manifest     # Story 2.7: WebMCP-Server-Manifest → static/webmcp-manifest.json
og:snapshots        # Story 2.6: MapLibre-Snapshots → static/og/snapshots/
og:images           # Story 2.6: Satori-OG-Cards → static/og/{type}/
db:migrate          # automatisch im prebuild-Hook
build               # vite build
```

`og:snapshots` und `og:images` sind **kein** `prebuild`-Auto-Step (zu teuer für
HMR im Dev-Modus). CI bzw. Coolify-Build muss sie explizit aufrufen, z.B. via:

```bash
pnpm data:fetch && pnpm data:aggregate && pnpm og:all && pnpm build
```

## OG-Image-Pipeline (Story 2.6)

### Voraussetzungen

- `static/layers/MANIFEST.json` und die referenzierten GeoJSON-Files
  (`bezirke.*.geojson`, `lor-bezirksregion.*.geojson`)
- `static/map-style.json`
- `pnpm exec playwright install chromium` (für `og:snapshots`)
- `DATABASE_URL` (optional, ohne DB rendert Pipeline mit `–`-Placeholdern)

### Schritte

1. `pnpm og:snapshots`: Headless Chromium lädt eine eingebettete HTML-Page mit
   MapLibre, fitBounds auf Bezirk-/Kiez-Bbox, screenshot 1200×630 PNG nach
   `static/og/snapshots/{type}-{slug}.png`. Layer-Snapshots aktuell ohne
   Boundary-Highlight (gesamt-Berlin-View).
2. `pnpm og:images`: Liest Snapshot-PNG als data-URI, baut Satori-VDOM mit
   Brand-Mark + Headline + Top-3-Werten (Lärm, PET, Stationen/km²) + Footer,
   rendert via Satori + Resvg, schreibt nach `static/og/{type}/{slug}.png`.

### Konvention

- Filename: `{type}/{slug}.png`, kein Hash, kein Locale-Suffix (DE-only Phase 1
  per `project_i18n_phase_1_de_only`).
- Meta-Tag-URL: `${origin}/og/{type}/{slug}.png`, gesetzt via SeoHead-Prop
  `ogImage` aus Story 2.1.
- Cache: SvelteKit-Static-Adapter liefert default `cache-control: public,
  max-age=86400`. Filename ohne Hash; Coolify-Deploy invalidet via neuen Build.

### Flags

```bash
pnpm og:snapshots --type=bezirk --slug=mitte    # gezielter Re-Render
pnpm og:images --force                          # Cache ignorieren
```

### Reuse

- Font-Pipeline aus `src/lib/utils/og-card-renderer.ts` (Story 1.20).
- Memory `project_satori_font_pipeline`: kein woff2 direkt, kein Variable-Font,
  sequenzielles wawoff2.
- Slug-Konvention via `src/lib/data/internal/slug.ts` `normalizeSlug` (gleicher
  Algorithmus wie `scripts/aggregate-data.ts`, sonst Slug-Mismatch zwischen
  Page-Route und OG-File).

## Sonstige Pipelines

Siehe Story-Files in `_bmad-output/implementation-artifacts/` für Details pro
Schritt.
