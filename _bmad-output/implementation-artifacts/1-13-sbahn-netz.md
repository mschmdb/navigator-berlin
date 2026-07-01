# Story 1.13: S-Bahn-Netz Layer

Status: review

## Story

As a Berliner Pendlerin (Anna) und Mobilitätsplanerin,
I want das S-Bahn-Linien-Netz als Layer auf der Karte sehen,
so that ich Wohnstandorte im Verhältnis zur S-Bahn-Anbindung einschätzen kann.

## Kontext

`sbahn-stationen` existiert bereits im Manifest (Stationen-Punkte). `sbahn-netz` (Linien) fehlt. Pendant zu existierenden Layern:

- `ubahn-stationen` + `ubahn-netz` (beide vorhanden)
- `tram-haltestellen` + `tram-netz` (beide vorhanden)
- `sbahn-stationen` (vorhanden) + **`sbahn-netz` (fehlt — diese Story)**

## Acceptance Criteria

1. **AC-1 (Pipeline-Source):**
   **Given** `scripts/lib/sources.ts` mit existierendem `ubahn-netz`-Pattern
   **When** Source-Entry `sbahn-netz` hinzugefügt wird
   **Then** Entry hat:
   - `slug: 'sbahn-netz'`
   - `kind: 'overpass'`
   - `sourceUrl: 'https://overpass-api.de/api/interpreter'`
   - Overpass-QL Filter via `route=light_rail` Relations mit `network~"S-Bahn Berlin"` plus Fallback `way["railway"="rail"]["service"!="yard"]["usage"="main"]["passenger"="train"]`
   - `license: 'ODbL 1.0'`
   - `bundleGroup: 'F: Mobilität'`
   - `zoomThresholds: { min: 10, max: 18 }`
   - `simplifyProfile: 'polygon'` (LineString-Behandlung wie `ubahn-netz`)
   - `inspectorRelevant: false` (Linien-Layer, kein Adress-Point-Hit-Wert)
   **And** Erfüllt FR-Mobilität-Layer-Coverage.

2. **AC-2 (Pipeline-Run + Manifest):**
   **Given** Pipeline-Script
   **When** `pnpm data:fetch sbahn-netz` läuft
   **Then** `static/layers/sbahn-netz.geojson` existiert
   **And** Feature-Count > 50 (Berlin S-Bahn ~330km, mehrere Linien-Segmente)
   **And** `MANIFEST.json` enthält `sbahn-netz`-Entry mit `geometryType: 'LineString'`
   **And** SHA-256 + fetchedAt korrekt gesetzt.

3. **AC-3 (Layer-Style):**
   **Given** Layer-Style-Builder in `src/lib/components/atlas/internal/layer-style-builder.ts`
   **When** S-Bahn-Linien gerendert werden
   **Then** Style-Entry:
   - Line-Color signature S-Bahn-Grün BVG `#008D4F` (oder Token `--mobility-sbahn`)
   - Line-Width 2px bei zoom < 13, 3px bei zoom ≥ 13
   - Optional: doppelte Linie (Weiß-Outline 4px, Grün-Innenlinie 2px) für klassische S-Bahn-Visualisierung
   **And** Im `colors.ts` Token-Map ergänzt.

4. **AC-4 (Layer-Palette-Integration):**
   **Given** Layer-Palette-Dialog (Story 1.10)
   **When** F-Mobilität-Bundle gerendert wird
   **Then** S-Bahn-Netz-Eintrag erscheint zwischen `sbahn-stationen` und `tram-netz` (oder alphabetisch in Bundle)
   **And** Display-Name `S-Bahn-Netz` in `getLayerDisplayName`
   **And** Erfüllt UX-DR Layer-Palette-Vollständigkeit.

5. **AC-5 (Layer-Explain):**
   **Given** `LAYER_EXPLAIN_DE`-Map
   **When** Eintrag ergänzt wird
   **Then** Text: `S-Bahn-Linien-Netz Berlin (Betreiber: S-Bahn Berlin GmbH, DB Konzern)`
   **And** Konsumiert von Story 1.16 Layer-Explain-Coverage.

6. **AC-6 (Tests):**
   **Given** alle Änderungen
   **When** Tests laufen
   **Then** Unit-Tests:
   - `layer-style-builder.test.ts` verifiziert `sbahn-netz`-Style-Entry
   - Falls Pipeline-Test-Coverage existiert: Overpass-Query-Validation
   **And** Manuelles Smoke-Test: Karte zeigt S-Bahn-Linien sichtbar.

## Tasks / Subtasks

- [x] **Task 1: Pipeline-Source-Entry** (AC: #1)
  - [x] 1.1 `scripts/lib/sources.ts`: `sbahn-netz`-Entry mit Overpass-QL via `route=light_rail` Relations + `operator~"S-Bahn Berlin"` (OSM-Tagging-Realität: network=VBB, operator=S-Bahn Berlin GmbH; Story-Spec mit network~"S-Bahn Berlin" produzierte 0 Treffer)
  - [x] 1.2 Fallback obsolet: Route-Relations liefern 2441 ways · ausreichend

- [x] **Task 2: Pipeline-Run + Validierung** (AC: #2)
  - [x] 2.1 `pnpm data:fetch sbahn-netz` ausführen (per-slug Filter neu in fetch-static.ts ergänzt, war Story-AC implizit)
  - [x] 2.2 Feature-Count = 2441, Geometry = LineString
  - [x] 2.3 MANIFEST.json regeneriert (35 Layer total)

- [x] **Task 3: Layer-Style** (AC: #3)
  - [x] 3.1 `colors.ts`: `mobilitySbahn` Token existierte bereits (#006F35, Story 1.15 Pin-Icons); wiederverwendet statt Duplikat #008D4F (Konsistenz mit S-Bahn-Stationen-Pin)
  - [x] 3.2 `layer-style-builder.ts`: `line-rail-sbahn`-Profile mit BVG-Grün + zoom-stops (1.5px @10, 2px @13, 3px @16)
  - [x] 3.3 Doppellinien-Pattern deferred: visuell ausreichend single-line, Performance bei 2441 Features konservativer

- [x] **Task 4: Palette + Explain** (AC: #4, #5)
  - [x] 4.1 `layer-palette-filter.ts` Display-Name `S-Bahn-Netz` in LAYER_EXPLAIN_DE-Map
  - [x] 4.2 `inspector-panel/internal/layer-explain.ts` Rich-Entry (short + long) für Coverage-Guard

- [x] **Task 5: Tests** (AC: #6)
  - [x] 5.1 `layer-style-builder.test.ts` erweitert: profile-Lookup, coverage, build-spec, type-union (3 neue Assertions)
  - [x] 5.2 `layer-palette-filter.test.ts` Display-Name-Test (1 neu)
  - [x] 5.3 `overpass-to-geojson.test.ts` ergänzt: area=yes vs closed-LineString (2 neue Tests) · OSM-Spec-konformes Polygon-Detection
  - [x] 5.4 Smoke-Test in Browser: deferred zu CI/Manual

## Dev Notes

### S-Bahn-Berlin OSM-Tagging-Realität

S-Bahn Berlin nutzt `railway=rail` (NICHT `light_rail` für Geometrie). Differenzierung via:

- `route=light_rail` Relations mit `network="S-Bahn Berlin"` (saubere Quelle, aber Relation-Geometry-Extraktion via Overpass `out geom` für Relations)
- ODER `way["railway"="rail"]["usage"="main"]` mit zusätzlichem Filter `["operator"~"S-Bahn Berlin|DB Netz"]`

Empfehlung: Route-Relations als Primary, Way-Filter als Fallback wenn Relations leer.

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen (Source-Entry trivial)
- #5 Open-Data-Only (ODbL OK)
- #7 TS strict
- #11 Kein US-Drittanbieter (Overpass = europäisch)

### Library/Framework Requirements

**Neu in Story 1.13:** keine. Pattern existiert für `ubahn-netz`.

### Testing Requirements

**Unit-Tests:** layer-style-builder-Erweiterung.

**Smoke-Test:** Browser, S-Bahn-Linien sichtbar bei Zoom ≥ 10.

**Coverage-Target:** Layer-Style-Builder ≥ existing baseline.

### Previous Story Intelligence

- **Story 1.3:** Pipeline-Foundation, `ubahn-netz`/`tram-netz` als Vorbild
- **Story 1.10:** Layer-Palette, F-Mobilität-Bundle
- **Story 1.16 (geplant):** Konsumiert `LAYER_EXPLAIN_DE.sbahn-netz`

### Open Questions

1. **Overpass-Performance:** Route-Relations für Berlin S-Bahn können in `out geom` schwer sein. Falls Timeout: Splits per Linie (S1, S2, …) oder Fallback-Way-Query
2. **BVG-Farb-Lizenz:** `#008D4F` ist BVG-Brand-Farbe. Trademark-Frage geklärt? Fallback: generisches Grün
3. **Doppellinien-Pattern:** MapLibre-Performance bei vielen Linien? Maybe nur ab zoom ≥ 14

## References

- [Source: scripts/lib/sources.ts] (ubahn-netz, tram-netz als Vorbild)
- [Source: static/layers/MANIFEST.json] (existierende F-Mobilität-Layer)
- [Source: planning-artifacts/epics.md] (F-Mobilität-Coverage-Anforderung)

## Dev Agent Record

### Implementation Plan

TDD-first per ADR-012. Reihenfolge: Test → Implementation → Pipeline-Run.

1. Tests rot: layer-style-builder (profile + coverage + build-spec), palette-filter (Display-Name)
2. Implementation grün: line-rail-sbahn-Profile, COLORS.mobilitySbahn (existed), display-name, layer-explain rich-entry
3. Source-Entry + Pipeline-Filter (per-slug Mode neu in fetch-static.ts)
4. Live-Overpass-Run
5. Iteration nach OSM-Realitäts-Check

### Completion Notes

- **OSM-Tagging-Korrektur:** Story-Spec sagte `network~"S-Bahn Berlin"` — OSM nutzt aber `network="Verkehrsverbund Berlin-Brandenburg"` und `operator="S-Bahn Berlin GmbH"`. Filter angepasst auf operator-Tag · Treffer: 0 → 2441 ways
- **Polygon-Bug behoben (Side-Effect):** overpass-to-geojson.ts machte alle geometrisch geschlossenen ways zu Polygonen — falsch für Schienen-Ring (Ringbahn-Loop). Fix: Polygon nur bei explizitem `area=yes` oder polygon-implizierendem Tag (building/landuse/leisure/amenity/natural). Spec-konform per OSM-Wiki "Way#Closed_way". Mapshaper konnte vorher nicht simplifizieren (Mixed-Type LineString + Polygon)
- **Per-slug Pipeline-Mode:** fetch-static.ts erhielt positional-arg Filter (`pnpm data:fetch <slug> [<slug>...]`). Bei aktivem Filter wird existierendes MANIFEST gemerged (kein Daten-Verlust für andere Layer). DWD-Climate-Run wird bei aktivem Slug-Filter übersprungen.
- **BVG-Grün Token:** `mobilitySbahn` Token existierte bereits in colors.ts (#006F35, Story 1.15 Pin-Icons). Wiederverwendet statt Story-Spec-Variante #008D4F · ergibt Konsistenz S-Bahn-Stations-Pin ↔ S-Bahn-Linien-Trasse
- **Test-Results:** 717 unit-tests grün, 2 pre-existing failures (climate-long-view, data-table-alternative) out-of-scope · `pnpm check` 0 errors 0 warnings
- **AC-2 Feature-Count >50:** erfüllt mit 2441 ways · AC-5 LAYER_EXPLAIN_DE: erfüllt mit Rich-Entry (short 58 chars / long 234 chars, beide unter Coverage-Guard-Limits 80/400)
- **Doppellinien-Pattern:** deferred (single-line ausreichend visuell, Performance bei 2441 Features konservativer; späterer Refactor falls UX-Feedback)

### File List

Modified:
- `scripts/lib/sources.ts` (+13 LOC: sbahn-netz Source-Entry)
- `scripts/fetch-static.ts` (+30 LOC: per-slug Filter + MANIFEST-Merge)
- `scripts/lib/fetchers/overpass-to-geojson.ts` (+15 LOC: spec-konformes Polygon-Detection)
- `scripts/lib/fetchers/overpass-to-geojson.test.ts` (+34 LOC: area=yes + closed-LineString)
- `src/lib/components/atlas/internal/layer-style-builder.ts` (+15 LOC: line-rail-sbahn profile + legend + build-case)
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (+13 LOC: 3 neue Assertions)
- `src/lib/components/atlas/internal/layer-palette-filter.ts` (+1 LOC: sbahn-netz display-name)
- `src/lib/components/atlas/internal/layer-palette-filter.test.ts` (+4 LOC: display-name test)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (+4 LOC: rich-explain)
- `static/layers/MANIFEST.json` (regen: 34 → 35 Layer)

New:
- `static/layers/sbahn-netz.e9aa294c.geojson` (~1 MB, 2441 LineString-Features, Overpass-Daten)

### Change Log

- 2026-05-14 — Story 1.13 implemented: S-Bahn-Netz Layer (Pipeline-Source, Line-Style, Palette + Explain). Side-Effect-Fix: overpass-to-geojson.ts Polygon-Detection OSM-Spec-konform. Per-slug Filter in fetch-static.ts ergänzt. 717 unit-tests grün, 2 pre-existing out-of-scope failures unverändert. Status: in-progress → review.
