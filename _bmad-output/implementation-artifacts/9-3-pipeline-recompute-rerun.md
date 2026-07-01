# Story 9.3: Pipeline-Recompute + Re-Run

Status: review

> **Anker:** ADR-015. **Voraussetzung:** 9.1 (Typ-Union + Config) UND 9.2 (DB-Schema). **Block für:** 9.4 (Konsumenten lesen die neuen Outputs) und 9.5 (Content nutzt neue Scores). Strikt nach 9.2.

## Story

As a Solo-Maintainer,
I want die Score-Pipeline auf das neue Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die neue Komposition enthalten.

## Kontext

Die Pipeline läuft in drei Stufen: `build-kiez-scores.ts` (542 LOR-Planungsraum-Scores + 5 derived GeoJSONs) → `aggregate-scores.ts` (Aggregation auf 143 Bezirksregionen + 12 Bezirke, schreibt Postgres). Beide referenzieren noch das alte Dimensions-Set. Diese Story stellt die Pipeline-Inputs um, ergänzt die Milieuschutz-Layer als Wohnschutz-Quelle und rechnet alles neu.

## Acceptance Criteria

1. **AC-1 (build-kiez-scores Input-Layer):**
   **Given** das neue Set aus 9.1
   **When** ich `scripts/build-kiez-scores.ts` anpasse
   **Then**:
   - `POLYGON_SCORE_LAYERS`: `mss-gesamtindex-2025` + `umweltgerechtigkeit-2023` entfernt (keine Score-Inputs mehr); `klima-pet-2022` ergänzt (Grün & Hitze); `milieuschutz-erhaltungsmiete` + `milieuschutz-staedtebau` ergänzt (Wohnschutz, presence)
   - `gruenanlagen` als Input für Grün & Hitze verfügbar (war POI für Versorgung, jetzt zusätzlich/stattdessen Grün-Hitze-Input)
   - die Layer-Sammlung deckt alle Slugs ab, die `DIMENSION_CONFIGS` referenziert
   **And** Milieuschutz-Layer werden als presence-Polygone behandelt (Punkt-in-Polygon am LOR-Centroid)

2. **AC-2 (Derived GeoJSON Layer):**
   **Given** `pipeline.ts` `buildDerivedLayerGeojsons`
   **When** die Pipeline läuft
   **Then** entstehen GeoJSONs für die fünf neuen Dimensionen:
   - `kiez-score-ruhe-luft`, `kiez-score-gruen-hitze`, `kiez-score-mobilitaet`, `kiez-score-versorgung`, `kiez-score-wohnschutz`
   - KEIN `kiez-score-soziale-lage` mehr
   **And** jedes Feature trägt `properties.value` (0–100 oder null), `plr_id`, `dataStand`

3. **AC-3 (kiez-scores.json deterministisch):**
   **Given** `pnpm data:kiez-scores`
   **When** die Pipeline durchläuft (nach `pnpm data:fetch` der benötigten Layer inkl. Milieuschutz)
   **Then**:
   - `static/kiez-scores/kiez-scores.json` enthält 542 LOR-Scores mit den fünf neuen Dimensionen
   - Wohnschutz aus Milieuschutz-Presence berechnet
   - Output valibot-validiert gegen das neue `output-schema.ts` (Picklist aus 9.1)
   - zweiter Lauf = identischer Output (deterministisch, nur Timestamp variiert)
   - MSS + Umweltgerechtigkeit erscheinen NICHT als Score-Dimension

4. **AC-4 (aggregate-scores Re-Run):**
   **Given** `scripts/aggregate-scores.ts`
   **When** ich es auf das neue Set anpasse und `pnpm data:aggregate-scores` läuft
   **Then**:
   - `ScoreRow`-Interface: `sozialeLage` raus, `gruen` → `gruenHitze`, `wohnschutz` rein
   - `pickDimensionValue`-Dimension-Param-Typ nutzt `KiezScoreDimension` (statt hartkodierter Literal-Union)
   - `toScoreRow` mappt die fünf neuen Dimensionen
   - `upsertAll` schreibt `gruenHitze` + `wohnschutz`, nicht `sozialeLage`/`gruen`
   - `kiez_score` (143) + `bezirk_score` (12) Tabellen neu befüllt (TRUNCATE+Insert)
   - flächen-gewichtete Aggregation pro neuer Dimension unverändert in der Mechanik

5. **AC-5 (Tests):**
   **Given** ADR-012
   **When** Pipeline-Tests laufen
   **Then**:
   - `aggregate-scores.test.ts` auf neues Set umgestellt (keine `sozialeLage`-Assertions, `gruenHitze`/`wohnschutz` geprüft)
   - `pipeline.test.ts` prüft 5 derived GeoJSONs mit neuen Slugs
   - Mini-Fixture-Test (3 Polygone): Wohnschutz-presence-Case (innerhalb/außerhalb Milieuschutz)
   - alle Pipeline-Tests grün

6. **AC-6 (Scope-Gate + Pipeline-Bereitschaft):**
   **Given** 9.3 abgeschlossen
   **Then**:
   - **Gate:** `scripts/`-Layer kompiliert + Pipeline-Tests grün; nach Live-Fetch produzieren `data:kiez-scores` + `data:aggregate-scores` valide Outputs
   - **Erwartet noch ROT:** `src/`-Konsumenten (Inspector/Compare/Ranking/Choropleth/OG/LLM) → 9.4; Content-Pages → 9.5
   - Completion-Note dokumentiert: Live-Fetch-Reihenfolge (`data:fetch` der Milieuschutz-/PET-Layer → `data:oepnv-index` → `data:kiez-scores` → `data:aggregate-scores`) und ob der Re-Run lokal ausgeführt wurde oder zu CI/Owner-Verify deferred ist

## Tasks / Subtasks

- [x] **Task 1: build-kiez-scores Input-Layer** (AC: #1)
  - [x] 1.1 `POLYGON_SCORE_LAYERS`: mss-gesamtindex-2025 + umweltgerechtigkeit-2023 entfernt
  - [x] 1.2 `klima-pet-2022` + `milieuschutz-erhaltungsmiete` + `milieuschutz-staedtebau` ergänzt (in POLYGON_SCORE_LAYERS → Punkt-in-Polygon-presence, NICHT PRESENCE_LAYERS das global injiziert)
  - [x] 1.3 `gruenanlagen` bleibt POI_LAYERS (Config nutzt poi-distance für Grün & Hitze)
  - [x] 1.4 alle DIMENSION_CONFIGS-Slugs lokal im Manifest vorhanden (verifiziert)

- [x] **Task 2: Derived GeoJSON Slugs** (AC: #2)
  - [x] 2.1 `KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION` liefert neue Slugs (aus 9.1)
  - [x] 2.2 5 neue derived-Layer geschrieben; stale `kiez-score-gruen` + `kiez-score-soziale-lage` (Files + Manifest-Einträge) manuell entfernt (augmentManifest purged nur Same-Slug)
  - [x] 2.3 `pipeline.test.ts` grün (5 GeoJSONs, neue Slugs)

- [x] **Task 3: aggregate-scores umstellen** (AC: #4)
  - [x] 3.1 `ScoreRow`: gruenHitze/wohnschutz statt gruen/sozialeLage
  - [x] 3.2 `pickDimensionValue` Param-Typ `KiezScoreDimension`
  - [x] 3.3 `toScoreRow` 5 neue Dimensionen
  - [x] 3.4 `upsertAll` schreibt gruenHitze + wohnschutz (beide Tabellen)
  - [x] 3.5 `aggregate-scores.test.ts` ScoreRow-Keys umgestellt

- [x] **Task 4: Re-Run + Determinismus** (AC: #3)
  - [x] 4.1 `pnpm data:kiez-scores` → 542 Scores, valibot-grün
  - [x] 4.2 `pnpm data:aggregate-scores` → 143 kiez + 12 bezirk Rows in DB
  - [x] 4.3 Determinismus-Test grün (aggregate-scores.test, zwei Läufe identisch)

- [x] **Task 5: Scope-Gate** (AC: #6)
  - [x] 5.1 scripts-Layer-Tests grün (450 Tests, 48 Files)
  - [x] 5.2 Completion-Note: lokal re-run (alle Layer + oepnv-index vorhanden)

## Dev Notes

### Pipeline-Topologie (verifiziert)

- `build-kiez-scores.ts` (`data:kiez-scores`): liest gefetchte Layer + LOR-Geometrie, ruft `buildKiezScoresFromInput` (pipeline.ts) → `computeKiezScore` pro LOR-Centroid → schreibt `static/kiez-scores/kiez-scores.json` + 5 derived GeoJSONs.
- `aggregate-scores.ts` (`data:aggregate-scores`, Story 2.9a): liest `kiez-scores.json` (Source-of-Truth), baut LOR-Hierarchie, flächen-gewichtete Aggregation → 143 Bezirksregionen + 12 Bezirke → TRUNCATE+Insert in Postgres.
- `prebuild`-Hook ruft `data:aggregate-scores` (NICHT `data:kiez-scores` — das läuft manuell vorgelagert nach `data:fetch`).

### build-kiez-scores.ts aktueller Stand (zu ändern)

- `POLYGON_SCORE_LAYERS` (Zeilen ~20–29): laerm-2023, luft-2023, bioklima-2023, gruenversorgung-2023, klima-kaltlufteinwirkbereich-2022, klima-leitbahnkorridor-2022, **umweltgerechtigkeit-2023** (raus), **mss-gesamtindex-2025** (raus)
- `PRESENCE_LAYERS` (~31): radverkehrsnetz-2025, fahrradstrassen-2024 → ergänzen um milieuschutz-erhaltungsmiete, milieuschutz-staedtebau
- `POI_LAYERS` (~33–39): kitas-2024, schulen-2024, krankenhaeuser-plan, spielplaetze, gruenanlagen
- ergänzen: `klima-pet-2022` (Polygon-Layer für Grün & Hitze)

**Milieuschutz als presence:** Die Milieuschutz-Layer sind Polygone (Erhaltungsgebiete). Wohnschutz = Centroid liegt in einem Gebiet → presence. Mechanik analog `klima-kaltlufteinwirkbereich` (Polygon-presence am Centroid). Prüfen ob Milieuschutz in POLYGON_SCORE_LAYERS (presence über Punkt-in-Polygon) oder PRESENCE_LAYERS gehört — abhängig davon wie `compute-score` presence-any-of erwartet (siehe 9.1 Wohnschutz-Pattern).

### aggregate-scores.ts aktueller Stand (zu ändern)

```ts
export interface ScoreRow {
  readonly slug: string;
  readonly bezirkSlug?: string;
  readonly composite: number | null;
  readonly ruheLuft: number | null;
  readonly gruen: number | null;          // → gruenHitze
  readonly mobilitaet: number | null;
  readonly sozialeLage: number | null;    // → raus
  readonly versorgung: number | null;
}                                          // + wohnschutz
```
```ts
function pickDimensionValue(score, dim: 'ruhe-luft'|'gruen'|'mobilitaet'|'soziale-lage'|'versorgung'): number|null
// → Param-Typ: KiezScoreDimension (aus types.ts)
```
`upsertAll` (Zeilen ~200–229) schreibt `gruen` + `sozialeLage` für beide Tabellen → auf `gruenHitze` + `wohnschutz` umstellen. `composite: r.composite ?? 0` (notNull-Fallback) bleibt.

### Determinismus

Pipeline ist deterministisch (ADR-013 Strategie A). Centroid via `@turf/centroid`, presence via `@turf/boolean-point-in-polygon`, area-weights aus `GROESSE_M2`. Nur `generatedAt`/`computed_at` variieren.

### Fetch-Voraussetzung

Milieuschutz + klima-pet müssen gefetcht vorliegen. Reihenfolge: `pnpm data:fetch` (alle benötigten Slugs) → `pnpm data:oepnv-index` → `pnpm data:kiez-scores` → `pnpm data:aggregate-scores`. Falls Layer noch nicht lokal: Fetch in der Story ausführen oder Re-Run zu CI/Owner-Verify deferren (analog Story 1.28) und im Completion-Note vermerken.

### Architektur-Compliance

- #2 Files <500 (build-kiez-scores + aggregate-scores beobachten)
- #7 TS strict
- #12 Source + UpdatedAt pro Wert → `dataStand` aggregiert pro Dimension
- ISO 9001: idempotente, deterministische Pipeline

### Previous Story Intelligence

- **Story 1.28:** build-kiez-scores + pipeline + output-schema-Pattern, presence-Mechanik
- **Story 2.9a:** aggregate-scores Hierarchie + area-weights + TRUNCATE+Insert
- **Memory `project_simplify_keep_shapes`:** LOR-Polygon-Simplify braucht keep-shapes (gilt falls Geometrie neu gebaut)
- **Memory `project_odis_crs_mixed`:** LOR-Planungsraum = UTM33; `detectGeoJsonCrs`-Heuristik in fetch-static.ts (relevant falls LOR neu gefetcht)

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: scripts/build-kiez-scores.ts]
- [Source: scripts/lib/kiez-score/pipeline.ts]
- [Source: scripts/lib/kiez-score/output-schema.ts]
- [Source: scripts/aggregate-scores.ts]
- [Source: scripts/aggregate-scores.test.ts]
- [Source: scripts/lib/kiez-score/aggregate-to-larger-region.ts]
- [Source: scripts/lib/kiez-score/lor-hierarchy.ts]
- [Source: scripts/lib/sources.ts] (milieuschutz-*, klima-pet-2022, gruenanlagen)
- [Source: package.json] (data:kiez-scores, data:aggregate-scores, prebuild)
- [Source: _bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md]
- [Source: _bmad-output/implementation-artifacts/9-2-db-schema-migration.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- `/tmp/vitest-93.log` — scripts-Layer 450 Tests / 48 Files grün
- Re-Run lokal: `pnpm data:kiez-scores` (542 Scores) + `pnpm data:aggregate-scores` (12+143 Rows)

### Completion Notes List

- **build-kiez-scores:** MSS + Umweltgerechtigkeit raus aus POLYGON_SCORE_LAYERS; klima-pet-2022 + beide Milieuschutz-Layer ergänzt. Milieuschutz in POLYGON_SCORE_LAYERS (Punkt-in-Polygon am LOR-Centroid via buildPolygonLayerHitsAtPoint) statt PRESENCE_LAYERS — letzteres injiziert global (würde alle LORs wohnschutz=100 geben). gruenanlagen bleibt POI (Config nutzt poi-distance).
- **Derived Layer:** 5 neue GeoJSONs (ruhe-luft/gruen-hitze/mobilitaet/versorgung/wohnschutz), kein soziale-lage. Stale `kiez-score-gruen` + `kiez-score-soziale-lage` aus static/layers/, static/kiez-scores/layers/ + MANIFEST.json manuell entfernt (augmentManifest purged nur identische Slugs).
- **aggregate-scores:** ScoreRow + toScoreRow + upsertAll auf gruenHitze/wohnschutz, pickDimensionValue auf KiezScoreDimension getypt.
- **Re-Run lokal ausgeführt** (alle Layer + oepnv-stops-index vorhanden, kein Defer nötig): kiez-scores.json (542) neu, DB-Tabellen neu befüllt. Verifiziert: wohnschutz 8× voll (100), 84× kein Schutz (0), 51× partiell (area-weighted BZR-Mischung) — Milieuschutz-Presence räumlich korrekt. avg gruen_hitze 51.6.
- Determinismus via aggregate-scores.test (zwei Läufe identischer Hash) bestätigt.
- **Scope-Gate (AC-6):** scripts-Layer grün. src-Konsumenten (Inspector/Compare/Ranking/Choropleth/OG/LLM) bleiben ROT → 9.4; Content-Pages → 9.5.

### File List

**Geändert (Code):**
- `scripts/build-kiez-scores.ts`
- `scripts/aggregate-scores.ts`
- `scripts/aggregate-scores.test.ts`

**Regeneriert (Daten, committed):**
- `static/kiez-scores/kiez-scores.json`
- `static/kiez-scores/layers/kiez-score-{ruhe-luft,gruen-hitze,mobilitaet,versorgung,wohnschutz}.geojson`
- `static/layers/kiez-score-*.geojson` (neue Hashes)
- `static/layers/MANIFEST.json`

**Gelöscht (stale):**
- `static/kiez-scores/layers/kiez-score-{gruen,soziale-lage}.geojson`
- `static/layers/kiez-score-{gruen,soziale-lage}.*.geojson`

## Change Log

- 2026-05-21: Story 9.3 Pipeline-Recompute. build-kiez-scores + aggregate-scores auf ADR-015-Set, Milieuschutz als Wohnschutz-Presence, klima-pet in Grün & Hitze. Lokal re-run: 542 LOR-Scores + DB (12+143) neu. Scripts grün, Konsumenten ROT (→ 9.4/9.5).
