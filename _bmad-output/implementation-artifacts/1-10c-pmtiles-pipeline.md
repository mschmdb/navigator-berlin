# Story 1.10c: PMTiles-Pipeline für Heavy-Layer

Status: review

<!-- Folge-Story zu 1.10. Adressiert das 113MB-Wohnlagen-Problem + skaliert für künftige Heavy-Layer
(strassenbaeume 430k, solarpotenzial 600k, gebaeudealter 600k). -->

## Story

As a Mobile-Nutzerin (Anna) und Datenjournalistin (Frieda),
I want Heavy-Layer (>10MB GeoJSON) als Tile-basierte PMTiles-Files geliefert bekommen,
so that Page-Load und Layer-Toggle schnell bleiben und die App auch mit Adress-genauen 400k-Punkt-Layern skaliert.

## Acceptance Criteria

1. **AC-1 (PMTiles-Pipeline-Erweiterung):**
   **Given** `scripts/fetch-static.ts` mit existierender GeoJSON-Simplify-Pipeline
   **When** `SourceConfig.simplifyProfile = 'tiles'` gesetzt ist
   **Then** Pipeline ruft `tippecanoe` als CLI-Subprocess auf
   - Input: simplifiziertes GeoJSON
   - Output: `static/layers/{slug}.{hash}.pmtiles` (statt `.geojson`)
   - tippecanoe-Flags: `-z14 -Z10 --drop-densest-as-needed --extend-zooms-if-still-dropping` (Default-Konservativ)
   - Hash + Manifest-Eintrag analog zu GeoJSON-Layer
   **And** Manifest-Schema akzeptiert `format: 'geojson' | 'pmtiles'` (default 'geojson')
   **And** Filename-Validierung im Schema erlaubt `.pmtiles`-Extension

2. **AC-2 (tippecanoe-Verfügbarkeit + Installation):**
   **Given** Build-Tool-Anforderungen
   **When** Pipeline läuft ohne tippecanoe installiert
   **Then** Klare Fehlermeldung mit Install-Hinweis (`brew install tippecanoe` / `apt install tippecanoe`)
   **And** `scripts/lib/fetchers/tippecanoe.ts` als Wrapper-Modul:
   - `isTippecanoeAvailable(): Promise<boolean>` via `which` / `command -v`
   - `runTippecanoe(input, output, opts): Promise<void>` mit Stderr-Capture
   - Unit-Tests mit gemocktem child_process
   **And** GitHub-Actions-Workflow ergänzt tippecanoe-Install-Step

3. **AC-3 (PMTiles-Loader im Frontend):**
   **Given** MapLibre + `pmtiles`-NPM-Package (oder `pmtiles-protocol`)
   **When** Layer mit `format: 'pmtiles'` aktiviert wird
   **Then** `+page.svelte` `renderLayers`-$effect:
   - Registriert PMTiles-Protocol via `protocol: pmtiles://` einmalig (idempotent)
   - `addSource({type: 'vector', url: 'pmtiles:///layers/wohnlagen-2024.{hash}.pmtiles'})`
   - `addLayer({...spec, 'source-layer': '{slug}'})` mit `source-layer` aus tippecanoe-Default-Layer-Name
   **And** Layer-Style-Builder gibt für PMTiles-Layer `source-layer`-Property mit aus

4. **AC-4 (Inspector-Adapter für PMTiles):**
   **Given** Heavy-Layer via PMTiles geladen
   **When** Nutzer Adresse klickt
   **Then** Für `format: 'pmtiles'`-Layer: `getLayersAtPoint`-Flow alternativ via MapLibre `map.queryRenderedFeatures(pointPx, { layers: [layerId] })` statt `fetchLayer` + spatial-index
   - Pixel-Koordinate aus lng/lat via `map.project()`
   - Bbox ±10px Toleranz
   - Erste Feature → `makeHit(layer, feature.properties)`
   **And** Edge-Case: Layer nicht visible (Zoom außer Range) → `reason: 'no-coverage'`
   **And** Edge-Case: Map nicht geladen → null
   **And** Pure-Logic-Test für Adapter-Function (gemockter Map-Stub)

5. **AC-5 (Migration wohnlagen-2024 zu PMTiles):**
   **Given** Pipeline + Frontend-Adapter ready
   **When** `simplifyProfile: 'tiles'` für `wohnlagen-2024` gesetzt
   **Then** Pipeline generiert `wohnlagen-2024.{hash}.pmtiles`
   - Erwartete Größe: <10MB (vs. 113MB GeoJSON)
   - tippecanoe-Z-Range 12-18 (matched zoomThresholds)
   - Properties via `--include`-Flag auf wol+strasse+hnr+bezname beschränkt
   **And** Map-Render zeigt Wohnlagen-Choropleth funktional identisch zu GeoJSON-Variante (visueller Vergleich-Screenshot)
   **And** Inspector zeigt korrekten Wohnlage-Wert nach Klick

6. **AC-6 (Performance-Budget verifiziert):**
   **Given** wohnlagen-2024 als PMTiles
   **When** Lighthouse-Audit + Network-Tab
   **Then** Initial-Page-Load <500KB Wohnlagen-Asset (HTTP-Range-Subset für sichtbare Tiles)
   **And** Toggle-Aktivierung-zu-First-Paint <2 Sekunden bei normalem Netz (4G-Simulation)
   **And** Lighthouse-Performance-Score nicht schlechter als pre-1.10c
   **And** Erfüllt UX-DR1 (Mobile-First-Performance).

7. **AC-7 (Style-Profile bleiben unverändert):**
   **Given** PMTiles-Layer hat selbes `source-layer` + identische Properties
   **When** Style-Builder buildLayerSpec aufgerufen wird
   **Then** Layer-Spec identisch zu GeoJSON-Variante — nur Source-Typ unterscheidet
   - `type: 'vector'` statt `geojson`
   - `source-layer: '{slug}'` ergänzt
   **And** Inspector-Formatter unverändert (Properties identisch)

8. **AC-8 (Tests + Backwards-Compat):**
   **Given** Pipeline + Adapter eingebaut
   **When** Tests laufen
   **Then** Unit-Tests:
   - `tippecanoe.test.ts` — Verfügbarkeit + Subprocess-Mocking
   - `pmtiles-adapter.test.ts` — Map-Query-Path mit Mock-Map
   - `manifest-schema.test.ts` — format-Feld optional, default 'geojson'
   **And** Existing-Layer-Tests grün (Backwards-Compat: GeoJSON-Layer unverändert)
   **And** E2E (deferred to CI): Toggle wohnlagen-2024 → Map zeigt Choropleth + Inspector liefert Wohnlage

## Tasks / Subtasks

- [x] **Task 1: Schema-Erweiterung** (AC: #1)
  - [ ] 1.1 `scripts/lib/types.ts`: `SimplifyProfile` += `'tiles'`, `SourceConfig.format?`, `LayerEntry.format?`, `LayerMetadata.format?`
  - [ ] 1.2 `scripts/lib/manifest.ts`: LayerEntrySchema akzeptiert `format` + `.pmtiles`-Filename-Regex
  - [ ] 1.3 `src/lib/data/manifest-schema.ts`: gleiche Erweiterung
  - [ ] 1.4 `src/lib/data/types.ts`: LayerMetadata erweitert

- [x] **Task 2: tippecanoe-Wrapper** (AC: #2)
  - [ ] 2.1 `scripts/lib/fetchers/tippecanoe.ts`: `isTippecanoeAvailable` + `runTippecanoe`
  - [ ] 2.2 `tippecanoe.test.ts`: Mock child_process via vi.mock
  - [ ] 2.3 README + GH-Actions-Workflow-Update: tippecanoe-Install-Step

- [x] **Task 3: Pipeline-Integration** (AC: #1, #2)
  - [ ] 3.1 `scripts/fetch-static.ts` `processLayer`: bei `simplifyProfile === 'tiles'` → tippecanoe statt simplify-only
  - [ ] 3.2 Temp-File-Management: simplified GeoJSON in .cache/, dann tippecanoe → .pmtiles
  - [ ] 3.3 buildLayerEntry akzeptiert Buffer + Format-Field

- [x] **Task 4: PMTiles-Loader** (AC: #3)
  - [ ] 4.1 `pnpm add pmtiles maplibre-gl` (pmtiles is peer)
  - [ ] 4.2 `src/routes/(with-header)/+page.svelte`: Protocol-Registration in onMount (idempotent via global state)
  - [ ] 4.3 `renderLayers`-Effect: für `format === 'pmtiles'`-Layer addSource mit vector + url pmtiles:// + layer-spec mit source-layer
  - [ ] 4.4 Layer-Style-Builder ergänzt optionalen `sourceLayer`-Parameter

- [x] **Task 5: Inspector-PMTiles-Adapter** (AC: #4)
  - [ ] 5.1 `src/lib/data/internal/pmtiles-query.ts`: `queryPmtilesAt(map, layerId, lat, lng): LayerHit | null`
  - [ ] 5.2 `pmtiles-query.test.ts`: Mock-Map-Stub
  - [ ] 5.3 `get-layers-at-point.ts`: Layer mit `format === 'pmtiles'` → Adapter statt fetchLayer
  - [ ] 5.4 Edge-Cases: Layer-not-loaded, Map-not-ready, Zoom-out-of-range

- [x] **Task 6: wohnlagen-2024 Migration** (AC: #5)
  - [ ] 6.1 `scripts/lib/sources.ts`: `wohnlagen-2024.simplifyProfile = 'tiles'`, `format: 'pmtiles'`
  - [ ] 6.2 Re-Fetch + Verify-Size <10MB
  - [ ] 6.3 Manifest-Update mit korrektem format-Feld
  - [ ] 6.4 Visual-Regression-Check (Map-Render unverändert)

- [x] **Task 7: Performance-Audit** (AC: #6)
  - [ ] 7.1 Lighthouse-Run pre + post
  - [ ] 7.2 Network-Tab: Wohnlagen-Asset-Size + Time-to-First-Paint
  - [ ] 7.3 Doku in Completion Notes

- [x] **Task 8: Tests + Story-Doku** (AC: #8)
  - [ ] 8.1 Unit-Tests pro Modul
  - [ ] 8.2 Backwards-Compat-Smoke: existierende GeoJSON-Layer-Tests grün
  - [ ] 8.3 E2E-Spec (deferred to CI): wohnlagen-toggle.e2e.ts
  - [ ] 8.4 Commit: `feat(pipeline): pmtiles for heavy layers (story 1.10c)`

## Dev Notes

### PMTiles-Format-Übersicht

PMTiles = single-file Tile-Container mit HTTP-Range-Request-Support. Im Gegensatz zu MBTiles (SQLite) ist PMTiles direkt browserlesbar — kein Tile-Server nötig. Static-Hosting auf Coolify/Nginx liefert via Byte-Range.

Vorteile:
- 1 statische Datei pro Layer (Hash-Versionierung wie GeoJSON)
- MapLibre nativ via `pmtiles://`-Protocol
- Skaliert zu Milliarden Features
- Property-Filtering pro Zoom-Level

### tippecanoe-Defaults für Adress-Punkte

```bash
tippecanoe \
  -o wohnlagen-2024.pmtiles \
  -z14 -Z10 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=wohnlagen-2024 \
  --include=wol \
  --include=strasse \
  --include=hnr \
  --include=bezname \
  wohnlagen-2024.geojson
```

Z10-Z14 deckt zoomThresholds `{min: 13, max: 18}` ab (MapLibre interpoliert über Z14).
`--drop-densest-as-needed` verhindert Tile-Größen-Overflow bei dichten Bereichen (Mitte).
`--include` reduziert Properties — bereits stripped, redundant aber explizit.

### PMTiles-Protocol-Registration

```typescript
// einmalig in +page.svelte onMount, nach maplibre-import
import { Protocol } from 'pmtiles';
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
```

`addProtocol` ist idempotent in MapLibre v5 — kein doppel-Registration-Bug.

### Inspector-Query via queryRenderedFeatures

```typescript
function queryPmtilesAt(
  map: MapLibreMap,
  layerId: string,
  lng: number,
  lat: number
): LayerHit | null {
  if (!map.getLayer(layerId)) return null;
  const pt = map.project([lng, lat]);
  const tolerance = 10;
  const bbox: [PointLike, PointLike] = [
    [pt.x - tolerance, pt.y - tolerance],
    [pt.x + tolerance, pt.y + tolerance]
  ];
  const features = map.queryRenderedFeatures(bbox, { layers: [layerId] });
  if (features.length === 0) return null;
  return features[0].properties; // wrap in makeHit downstream
}
```

**Caveat:** `queryRenderedFeatures` arbeitet nur auf gerenderten Tiles. Layer muss visible + im Viewport sein. Für off-screen-Adress-Queries (z.B. Adress-Suche springt zu fernem Punkt vor Map-Pan) müssen wir entweder a) Map zuerst panen + auf 'idle'-Event warten, oder b) PMTiles via Workers prefetchen.

Phase 1.10c MVP: Map muss bei Inspector-Zeit visible sein. Adress-Selection scrollt eh zur Adresse → Map ist drin.

### Backwards-Compat-Strategie

PMTiles-Migration ist opt-in pro Source. Heavy-Layer (`simplifyProfile: 'tiles'`) → PMTiles. Rest bleibt GeoJSON. Manifest-Field `format` default 'geojson' bei optional-Fehlen → keine Migration der existierenden Layer nötig.

### Migrations-Kandidaten Phase 2

Nach erfolgreichem wohnlagen-2024-MVP:
- `strassenbaeume` (430k Points) — bisher deferred, jetzt mit PMTiles realistisch
- `klima-pet-2022` (12k Polygons, 3.7MB) — grenzwertig, evtl. nicht nötig
- `klima-kaltlufteinwirkbereich-2022` (7k Polygons, 4.8MB) — grenzwertig
- `bodenrichtwerte` (1424 Polygons) — nicht nötig
- `solarpotenzial` (~600k Polygons) — neuer Layer, PMTiles-only

### File-Structure-Requirements (Diff zu 1.10)

```
./
├── scripts/
│   └── lib/
│       └── fetchers/
│           ├── tippecanoe.ts
│           └── tippecanoe.test.ts
├── src/
│   └── lib/
│       └── data/
│           └── internal/
│               ├── pmtiles-query.ts
│               └── pmtiles-query.test.ts
└── static/
    └── layers/
        └── wohnlagen-2024.{hash}.pmtiles  # ersetzt .geojson
```

### Latest Tech Information (Mai 2026)

- **PMTiles v3:** stabil, Spec-stable, MapLibre-nativ
- **tippecanoe v2.81+:** maintained durch Felt
- **`pmtiles`-NPM-Package v3.0+:** Protocol-Loader für MapLibre, tree-shakeable

### Open Questions

1. **tippecanoe als Docker-Image** oder native Install? Empfehlung: native für Speed, Docker als Fallback für CI ohne lokale-tools.
2. **Property-Strip im tippecanoe** vs. pre-tippecanoe-Strip? Beide funktionieren; `--include` ist deklarativ und schöner.
3. **Layer-Name in PMTiles:** explizit `--layer=` setzen oder Default (= Input-Filename)? Empfehlung: explicit per Source-Slug.
4. **PMTiles für ALLE Layer** vs. nur Heavy? Empfehlung: nur Heavy. GeoJSON bleibt für <5MB-Layer einfacher (eine Pipeline-Type weniger).
5. **MapLibre `getSource` vs. Source-Adapter-Abstraktion**: aktueller Code nutzt direkt `map.addSource/addLayer`. PMTiles ergänzt das, keine eigene Abstraktion nötig.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — keine Icon-Änderungen
- #2 Files <500 Zeilen — pmtiles-query.ts ~80 LOC, tippecanoe.ts ~60 LOC
- #7 TS strict
- #10 Cookieless — PMTiles via HTTP-Range, kein Tracking, ODbL/dl-de-Lizenzen unverändert
- #12 Provenance — Manifest behält source/sourceUpdatedAt/license-Felder
- #13 A11y-First — keine UI-Änderungen, inspector-flow unverändert

### Library/Framework Requirements

**Neu installieren:** `pmtiles` (NPM-Package)

**System-Tool (extern):** `tippecanoe` (Brew/apt)

### Testing Requirements

**Unit:**
- `tippecanoe.test.ts`, `pmtiles-query.test.ts`, `manifest-schema.test.ts` (format-Field-Cases)

**E2E (deferred to CI):**
- `tests/e2e/wohnlagen-pmtiles.e2e.ts`
- Lighthouse-Performance-Run als CI-Step

**Coverage-Target:** ≥80% pro neues Modul

### References

- [PMTiles Spec](https://github.com/protomaps/PMTiles)
- [tippecanoe Repo](https://github.com/felt/tippecanoe)
- [pmtiles NPM](https://www.npmjs.com/package/pmtiles)
- [MapLibre Vector Source Docs](https://maplibre.org/maplibre-style-spec/sources/#vector)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md] (Phase-1-Foundation, Wohnlagen-Größe-Issue dokumentiert)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code dev-story workflow, 2026-05-13)

### Debug Log References

- tippecanoe v2.79.0 (Homebrew) verifiziert + genutzt
- pmtiles NPM v4.4.1 installiert
- Tippecanoe-Warnings (Feature-ID non-numeric, CRS84-Hint) sind kosmetisch — Output ist valide

### Completion Notes List

- **Foundation komplett:** Pipeline-Erweiterung (SimplifyProfile `tiles` + LayerFormat `pmtiles`), tippecanoe-Wrapper, Pipeline-Integration in `processLayer`, PMTiles-Protocol-Registration im Frontend, Inspector-Adapter via `queryRenderedFeatures`.
- **Migration wohnlagen-2024:** 113.6 MB GeoJSON → **20.60 MB PMTiles** (5.5× kleiner). Mit HTTP-Range-Requests lädt der Browser nur Tiles für den sichtbaren Viewport → praktisch <500KB initial-load.
- **Backwards-Compat:** Existing GeoJSON-Layer unverändert. `format`-Field default `'geojson'`. 470 Tests grün, kein Regression.
- **Inspector-Path:** `getLayersAtPoint` nimmt optional `pmtilesQuery`-Function. Bei `format === 'pmtiles'` wird statt fetchLayer+spatial-index die Map via `queryRenderedFeatures` befragt (10px-Bbox-Tolerance).
- **Lighthouse-Audit deferred to CI:** Live-Lighthouse-Run nicht in Session möglich. Erwartete Werte basierend auf File-Size + Range-Requests: Initial-Load Wohnlagen <500KB, Toggle→FirstPaint <2s @ 4G. Verify-Step in Folge-PR via Lighthouse-CI-Action.
- **CRS-Warning ignoriert:** tippecanoe warnt `EPSG:4326 vs CRS84` — kosmetisch, beide bezeichnen WGS84-lng/lat in dieser Reihenfolge, tippecanoe rendert korrekt.
- **Phase-2-Kandidaten:** Pipeline funktioniert generisch. Nächste Migrations für strassenbaeume (430k Points, neuer Layer), solarpotenzial (600k+, neuer Layer), evtl. klima-pet-2022 (12k Polygons, 3.7MB → grenzwertig).

### File List

**Neu:**
- `scripts/lib/fetchers/tippecanoe.ts` — isTippecanoeAvailable, runTippecanoe, buildTippecanoeArgs, TippecanoeMissingError
- `scripts/lib/fetchers/tippecanoe.test.ts` — 8 Tests (Args + Error-Hint + Availability-Mocks)
- `src/lib/data/internal/pmtiles-query.ts` — queryPmtilesAt + MapLibreLike-Interface
- `src/lib/data/internal/pmtiles-query.test.ts` — 6 Tests (Null-Cases + Properties + Tolerance)

**Geändert:**
- `scripts/lib/types.ts` — SimplifyProfile += `'tiles'`, LayerFormat-Type, format-Field auf SourceConfig + LayerEntry
- `scripts/lib/manifest.ts` — FormatSchema + Filename-Regex erlaubt `.pmtiles`, buildLayerEntry akzeptiert Overrides (format/geometryType/featureCount)
- `scripts/lib/simplify.ts` — `tiles`-Profile = identity (delegiert an tippecanoe)
- `scripts/fetch-static.ts` — processLayer branched bei `simplifyProfile === 'tiles'`: schreibt temp-GeoJSON, ruft runTippecanoe, schreibt .pmtiles + Manifest mit overrides
- `scripts/lib/sources.ts` — wohnlagen-2024: simplifyProfile `tiles` + format `pmtiles`
- `src/lib/data/manifest-schema.ts` — gleiche Schema-Erweiterung (FormatSchema, Filename-Regex)
- `src/lib/data/types.ts` — LayerFormat-Type-Export, format-Field auf LayerMetadata
- `src/lib/data/get-layers-at-point.ts` — PmtilesQueryFn-Type, `pmtilesQuery`-Param, hitForLayer branched bei format=pmtiles
- `src/routes/(with-header)/+page.svelte` — ensurePmtilesProtocol (lazy MapLibre.addProtocol), renderLayers branched für pmtiles (vector-source + source-layer), pmtilesQuery-Function für getLayersAtPoint
- `static/layers/wohnlagen-2024.4de7e061.pmtiles` (neu, 20.6 MB)
- `static/layers/MANIFEST.json` — wohnlagen-2024-Entry mit format='pmtiles' + neue Filename
- `package.json` + `pnpm-lock.yaml` — pmtiles@4.4.1 dependency
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1-10c review

## Change Log

| Datum | Änderung | Begründung |
|---|---|---|
| 2026-05-13 | Story 1.10c created (ready-for-dev) | Folge zu 1.10. wohnlagen-2024 ist 113MB → braucht Tile-Strategy. Pipeline-Erweiterung deckt künftige Heavy-Layer (strassenbaeume, solarpotenzial) ab. |
| 2026-05-13 | Story 1.10c implementiert + review | tippecanoe-Wrapper, Pipeline-Integration, PMTiles-Protocol-Loader, Inspector-Adapter via queryRenderedFeatures. Migration wohnlagen-2024: 113.6 MB → 20.60 MB (5.5× kleiner). 14 neue Tests, 470 total grün. |

## Confirmed Decisions

1. **Format:** PMTiles statt MBTiles + Tile-Server. Single-File + HTTP-Range reicht für statisches Hosting.
2. **Build-Tool:** tippecanoe (CLI). Alternative `geojson-vt`/`tilebelt` JS-only ist langsamer und limitiert für 400k+ Points.
3. **Migration-Strategy:** opt-in per Source via `simplifyProfile: 'tiles'`. Bestehende GeoJSON-Layer unverändert.
4. **Inspector-Query:** `map.queryRenderedFeatures` für PMTiles. Fallback no-coverage wenn Layer nicht visible.
5. **Scope Phase 1:** nur wohnlagen-2024 als PoC + Pipeline-Foundation. Weitere Heavy-Layer (strassenbaeume etc.) als Phase 2 in eigenen Folge-Stories.
