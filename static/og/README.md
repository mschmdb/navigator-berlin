# `static/og/` (Story 2.6: OG-Image-Pipeline)

Diese Files werden von `pnpm og:all` Build-Time generiert. Nicht von Hand bearbeiten.

## Struktur

```
static/og/
  bezirk/{slug}.png        # 12 Bezirks-OG-Cards (gitignored)
  kiez/{slug}.png          # 143 Kiez-OG-Cards (gitignored)
  layer/{slug}.png         # ~38 Layer-Concept-Cards (gitignored)
  snapshots/{type}-{slug}.png  # Karten-PNG-Zwischen-Output (gitignored)
```

Phase 1 ist DE-only (Memory `project_i18n_phase_1_de_only`); kein Locale-Suffix.

## Generation

```bash
pnpm og:snapshots            # Karten-PNGs via Headless Playwright + MapLibre
pnpm og:images               # Satori-Overlay komponiert Snapshot + Card-Texte
pnpm og:all                  # beide Schritte
pnpm og:snapshots --force    # Cache ignorieren
pnpm og:images --type=layer  # nur Layer-Cards rendern
pnpm og:images --slug=mitte  # nur Bezirk „Mitte"
```

Voraussetzungen:

- `pnpm exec playwright install chromium` (Snapshot-Schritt)
- `DATABASE_URL` (Aggregat-Daten für Top-3-Werte; ohne DB rendert Pipeline mit
  Placeholder „–" pro Slot)
- `static/layers/MANIFEST.json` und `static/map-style.json` (out of Story 2.0
  bzw. Story 1.x).

## Cache-Strategie

- Filename-Konvention ohne Hash (User-Decision Open-Question 3, Story 2.6).
- Coolify-/SvelteKit-Static-Adapter liefert die PNGs mit dem Default-Static-Header
  (`cache-control: public, max-age=86400` per NFR-P10).
- Re-Generation pro Deploy invalidet den Browser-Cache via neuen Build-Run.
- Pro File wird gecached: existiert das Ziel-PNG bereits, wird übersprungen.
  `--force` überschreibt.

## Story-Reuse

- Font-Pipeline reused aus `src/lib/utils/og-card-renderer.ts` (Story 1.20).
  Memory `project_satori_font_pipeline.md` gilt: kein woff2 direkt, kein
  Variable-Font, sequenzielles wawoff2-Decoding.
- Adress-OG-Fallback `static/og-default.png` bleibt Source-Tree-Asset.

## Cleanup

```bash
rm -rf static/og/{snapshots,bezirk,kiez,layer}
```
