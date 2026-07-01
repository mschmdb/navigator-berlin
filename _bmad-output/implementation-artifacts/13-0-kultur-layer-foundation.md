# Story 13.0: Kultur-Layer-Foundation (Overpass-Fetch + Radius-Join)

Status: review

> **Anker:** ADR-012 (TDD). Epic 13 fügt Kultur als 6. Score-Dimension hinzu (strukturell wie Epic 9). Diese Story ist die Daten-Foundation: Kultur-POIs aus OSM holen + in den Dichte-Radius-Join. Hard-Block für die Dimension (13.1) + Recompute (13.3).
> **Voraussetzung:** Epic 9 (5-Dimensions-Set) `done`. `poi-density`-Infrastruktur (Story 10.4) wird wiederverwendet.

## Story

As a Solo-Maintainer,
I want die Kultur-POIs als deterministische OSM-Layer in der Pipeline und im Dichte-Radius-Join,
so that die neue Kultur-Dimension sie als `poi-density`-Terme lesen kann.

## Kontext: Warum dieser Change

Kultureller Zugang (Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur) fehlt im Score. OSM Overpass (ODbL, im Stack) deckt ~90 % ab. Diese Story holt die Layer + Radius-Counts; Dimension, Dämpfung, Gewichte folgen in 13.1.

**Editorial-Ausschlüsse:** Stolpersteine + Denkmale (Memorial/Heritage) sind KEINE Kultur-Amenity. Sammlungs-/Objekt-Metadaten (DDB, digiS) sind keine Orte. `amenity=community_centre` ist in Berlin verrauscht (Kitas, Bürgerämter) → ausschließen oder hart filtern.

## Acceptance Criteria

1. **AC-1 (OSM-Kultur-Quellen):**
   **Given** der `overpass`-Fetcher (ODbL)
   **When** neue `kind: 'overpass'`-Sources in `scripts/lib/sources.ts` angelegt werden
   **Then** existieren Kultur-Layer für: `tourism=museum`, `tourism=gallery`, `tourism=artwork`, `amenity=theatre`, `amenity=library`, `amenity=cinema`, `amenity=arts_centre`, `amenity=nightclub`
   **And** die Tags sind vorab gegen die Live-Overpass-API verifiziert (Counts plausibel)
   **And** `pnpm data:fetch` produziert GeoJSON + MANIFEST-Einträge (Lizenz `ODbL 1.0`)

2. **AC-2 (Editorial-Ausschluss):**
   **Given** die Ausschluss-Regeln
   **When** die Queries gebaut werden
   **Then** Stolpersteine, Denkmale und Sammlungsdaten sind NICHT enthalten
   **And** `community_centre` ist ausgeschlossen oder hart gefiltert (Begründung dokumentiert)
   **And** Clubkataster (keine offene Lizenz) wird NICHT verwendet

3. **AC-3 (Radius-Join-Counts):**
   **Given** `buildPoiDensityCounts` (Story 10.4)
   **When** die Layer in `POI_LAYERS` (`scripts/build-kiez-scores.ts`) aufgenommen werden
   **Then** liefert der PoiIndex pro 542 LOR `{ count, nearestM }` je Kultur-Slug
   **And** kein Score-Output ändert sich allein durch diese Story (kein `LayerWeight` referenziert sie → Recompute-Diff = 0)

4. **AC-4 (TDD + Lizenz):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** Overpass-Mapping der neuen Tags + leeres Set (kein Crash) getestet
   **And** ODbL-Attribution im MANIFEST + Doku, Clubkataster ausgeschlossen

## Tasks / Subtasks

- [x] **Task 1: Tags live verifizieren** (AC: #1, #2)
  - [x] 1.1 Live-Counts gegen `overpass-api.de` für alle acht Tags im Berlin-Boundary (Erwartung grob: artwork ~2700, gallery ~350, museum ~250, theatre ~200, library ~150, nightclub ~140, arts_centre ~130, cinema ~90)
  - [x] 1.2 `community_centre`-Entscheidung: ausschließen (empfohlen, zu verrauscht) oder mit Sub-Filter. Begründung in Source-Kommentar

- [x] **Task 2: Sources in `sources.ts`** (AC: #1, #2, #4)
  - [x] 2.1 `scripts/lib/sources.ts`: `kind: 'overpass'`-Einträge, Muster `trinkbrunnen` Z.190–199. Slug-Vorschlag: `kultur-museum`, `kultur-galerie`, `kultur-kunst-im-raum`, `kultur-theater`, `kultur-bibliothek`, `kultur-kino`, `kultur-soziokultur` (arts_centre), `kultur-club` (nightclub)
  - [x] 2.2 `bundleGroup`: **`Bundle`-Union in `scripts/lib/types.ts` Z.1–20 ist getypt.** Neuen Kultur-Bundle ergänzen oder bestehenden wiederverwenden. Nicht frei erfinden.
  - [x] 2.3 `license: 'ODbL 1.0'`, `simplifyProfile: 'point'`, `zoomThresholds`, `mapRelevant: true`, `inspectorRelevant: false` (Layer-Aggregat-Aufwand optional später)
  - [x] 2.4 Erwägung: acht Einzel-Layer oder thematische Bündel? Empfehlung: Einzel-Layer (gewichtbar in 13.1, analog Versorgung). Begründung dokumentieren falls gebündelt

- [x] **Task 3: Fetch + MANIFEST** (AC: #1)
  - [x] 3.1 `pnpm data:fetch`, GeoJSON + MANIFEST prüfen (`featureCount` vs. Live-Counts)
  - [x] 3.2 `pnpm check`: MANIFEST validiert (`manifest-schema.ts`)

- [x] **Task 4: POI-Index-Registrierung** (AC: #3)
  - [x] 4.1 (RED) Test: PoiIndex enthält Kultur-Slugs nach Aufnahme in `POI_LAYERS`
  - [x] 4.2 (GREEN) `scripts/build-kiez-scores.ts` Z.57 `POI_LAYERS`: Kultur-Slugs ergänzen
  - [x] 4.3 Recompute-Diff = 0 (kein `LayerWeight` → kein Score-Effekt, AC-3)

- [x] **Task 5: TDD Overpass-Mapping** (AC: #4)
  - [x] 5.1 (RED/GREEN) Test: `overpassToGeoJSON` mappt `tourism`/`amenity`-Tags als Properties, leeres Set → leere FC
  - [x] 5.2 `pnpm test` 100% grün

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

Identische OSM-Infrastruktur wie Story 12.0 (gleicher Stack):
- `sources.ts` OSM-Muster: `trinkbrunnen` Z.190–199, `ubahn-stationen` Z.467–476. `Bundle`-Union `types.ts` Z.1–20.
- Overpass-Fetcher `scripts/lib/fetchers/overpass.ts:13`, `overpass-to-geojson.ts:86` (Relations ignoriert Z.99, alle Tags → Properties). Allowlist hat `overpass-api.de`.
- Fetch-Dispatch `scripts/fetch-static.ts:58–60,95`.
- `POI_LAYERS` `build-kiez-scores.ts:57`. Radius-Join `build-helpers.ts:114–134`, auto-angewandt `pipeline.ts:172` via `POI_DENSITY_SPECS` Z.22–31.
- MANIFEST-Shape + `manifest-schema.ts:38–70`.

### Editorial-Ausschluss (kritisch)

- **Stolpersteine + Denkmale raus.** Sie waren ohnehin build-only und wurden in Epic 9 Story 9.6 aus dem Frontend entfernt. Niemals als Kultur-POI zählen (Memorial/Heritage, pietätssensibel).
- **`community_centre` (818 in Berlin) raus oder hart filtern** — enthält Kitas, Bürgerämter, Jugendhilfe. Verfälscht den Score.
- **Sammlungsdaten (DDB, digiS, Museumsportal) raus** — Objekt-Metadaten, keine Orte.
- **Clubkataster raus** — keine offene Lizenz, nicht scrapen.

### Center-Bias (Vorausblick auf 13.1)

Kulturinfrastruktur ballt sich in der Innenstadt. Diese Story holt nur Rohdaten; die Dämpfung des Innen-Außen-Gefälles passiert in 13.1 (Normalisierung). Hier nur sicherstellen, dass auch Außenbezirks-POIs vollständig erfasst sind (Berlin-Boundary, nicht nur Innenstadt-BBox).

### Was nicht brechen darf

- Score-Output bit-identisch diese Story (Recompute-Diff = 0).
- Bestehende Sources/Dimensionen: kein Anfassen.

## References

- `scripts/lib/sources.ts` (OSM-Muster Z.190–199), `scripts/lib/types.ts` (Bundle Z.1–20)
- `scripts/lib/fetchers/overpass.ts:13`, `overpass-to-geojson.ts:86`
- `scripts/build-kiez-scores.ts` (POI_LAYERS Z.57)
- `scripts/lib/kiez-score/build-helpers.ts` (buildPoiDensityCounts Z.114–134)
- `scripts/lib/kiez-score/pipeline.ts` (POI_DENSITY_SPECS Z.22–31)
- `docs/adr/ADR-012-tdd-mandate.md`
- `_bmad-output/implementation-artifacts/12-0-nahversorgung-layer-foundation.md` (Schwester-Story, gleiches Muster)
- `_bmad-output/implementation-artifacts/9-6-erinnerung-layer-entfernen.md` (Memorial-Removal-Begründung)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-13-kultur-score`.

### Debug Log References

- Live-Counts (Berlin admin area): museum 246, gallery 354, artwork 2736, theatre 198, library 154, cinema 89, arts_centre 134, nightclub 140. Tags verifiziert.
- Fetch (bbox > admin): museum 269, galerie 358, kunst-im-raum 2883, theater (ok), bibliothek 190, kino 97, soziokultur 141, club 142. Alle Point (center-Handling aus 12.0). Overpass 429/504 mehrfach → `--graceful` + Einzel-Retries bis alle 8 im MANIFEST (62 Layer).
- Recompute-Diff = 0: `data:kiez-scores` → Score-Werte bit-identisch (kein KULTUR_CONFIG → POI_DENSITY_SPECS unverändert). kiez-scores.json nicht verändert.

### Completion Notes List

- **8 OSM-Kultur-Sources** (`kultur-museum/-galerie/-kunst-im-raum/-theater/-bibliothek/-kino/-soziokultur/-club`), Bundle `J: Kultur`, ODbL, `out center;`, mapRelevant true / inspectorRelevant false.
- **Editorial-Ausschluss** in Source-Kommentar: keine Stolpersteine/Denkmale (Memorial), keine Sammlungsdaten, kein `community_centre` (verrauscht), kein Clubkataster (keine offene Lizenz).
- **`center`-Handling** aus 12.0 wiederverwendet (schon in main) → Flächen-POIs als Punkt. Kein Converter-Edit.
- **Neuer Bundle `J: Kultur`** typsicher verdrahtet: `types.ts`, beide valibot-BundleSchemas (`scripts/lib/manifest.ts` + `src/lib/data/manifest-schema.ts`), `BUNDLE_RANK` (layer-order-sorting), `BUNDLE_ORDER`+`BUNDLE_LABEL_DE` (palette-filter), `BUNDLE_TO_SECTION` (no-op `boundaries`), url-state `BUNDLE_ORDER`. 8 Display-Names (palette) + 8 `LAYER_EXPLAIN_DE`-Einträge (Coverage-Guard).
- **POI_LAYERS-Vorverdrahtung**: 8 Kultur-Slugs. Kein Score-Effekt bis KULTUR_CONFIG (13.1).
- BUNDLE_ORDER-Test auf A→J aktualisiert.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2784/2784 grün**.

### File List

**Geändert:**
- `scripts/lib/types.ts`, `scripts/lib/manifest.ts`, `src/lib/data/manifest-schema.ts` (Bundle J)
- `scripts/lib/sources.ts` (8 Kultur-Sources)
- `scripts/build-kiez-scores.ts` (POI_LAYERS)
- `src/lib/components/atlas/internal/layer-order-sorting.ts`, `src/lib/utils/url-state.ts`, `src/lib/components/atlas/inspector-panel/internal/sections.ts` (Bundle-Rank/Section)
- `src/lib/components/atlas/internal/layer-palette-filter.ts` (BUNDLE_ORDER/LABEL + 8 Display-Names) + `.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (8 Einträge)
- `static/layers/MANIFEST.json`

**Neu (Fetch-Output):**
- `static/layers/kultur-{museum,galerie,kunst-im-raum,theater,bibliothek,kino,soziokultur,club}.<hash>.geojson` (8)

## Change Log

- 2026-06-07: Story 13.0 erstellt (ready-for-dev). Kultur-OSM-Layer + PoiIndex. Editorial-Ausschluss Memorial/Sammlung/Clubkataster. Hard-Block für 13.1/13.3.
- 2026-06-07: Story 13.0 implementiert (→ review). 8 Kultur-Layer, neuer Bundle J verdrahtet, POI_LAYERS-Vorverdrahtung, center-Handling reused. check 0 Errors, 2784/2784 grün.
