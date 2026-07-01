# Story 13.3: Pipeline-Recompute + Re-Run

Status: review

> **Anker:** ADR-012 (TDD für die hardcoded Aggregations-Edits). Strukturell analog Story 9.3.
> **Hard-Block:** Story 13.0 + 13.1 + 13.2 `done` (Layer im PoiIndex, Dimension registriert, DB-Spalte existiert).

## Story

As a Solo-Maintainer,
I want die Score-Pipeline auf das 6er-Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die Kultur-Dimension enthalten.

## Kontext: Warum dieser Change

13.1 hat die Dimension registriert (Pipeline rechnet sie automatisch via `DIMENSION_CONFIGS`). Aber die **Aggregations-Skripte hardcoden die Dimensions-Spalten** und müssen je um `kultur` erweitert werden. Danach Re-Run der ganzen Kette + Rang + Vergleich (Epic 11). Diese Story produziert die befüllten Kultur-Werte end-to-end.

## Acceptance Criteria

1. **AC-1 (aggregate-scores.ts):**
   **Given** das 6er-Set + DB-Spalte
   **When** ich `scripts/aggregate-scores.ts` erweitere
   **Then** `ScoreRow` (Z.49–58), `toScoreRow` (Z.112–127) und beide Insert-Blöcke (`bezirkScore` Z.201–214, `kiezScore` Z.216–229) enthalten `kultur`
   **And** `data:aggregate-scores` schreibt Kultur-Werte in beide Tabellen

2. **AC-2 (Ranking + Comparison):**
   **Given** Epic 11 (Rang + Vergleich)
   **When** ich `aggregate-ranks.ts` (`METRICS` Z.61–80, `ScoreStatsRow`, beide Selects Z.108–158) + `aggregate-comparison.ts` (`METRIC_KEYS` Z.26–33, `ScoreRow` Z.36–45, beide Selects Z.58–82) um `kultur` erweitere
   **Then** Kultur bekommt Rang + Quartil + Vergleichswert (Bezirks-Schnitt, Berlin-Median)

3. **AC-3 (Derived Map-Layer):**
   **Given** `pipeline.ts` Slug-Mapping aus 13.1
   **When** `data:kiez-scores` läuft
   **Then** ein `kiez-score-kultur`-GeoJSON wird erzeugt + via `augmentManifestWithKiezScoreLayers` (`build-kiez-scores.ts` Z.189–233) ins MANIFEST geschrieben (`bundleGroup: 'G: Kiez-Score'`, `inspectorRelevant: false`, `mapRelevant: true`)

4. **AC-4 (Re-Run + Spot-Check):**
   **Given** die volle Kette
   **When** `data:kiez-scores → data:aggregate-scores → data:rank → data:comparison` läuft
   **Then** Composite bleibt das Mittel der fünf Composite-Dimensionen (Kultur via Option-C-Filter ausgeschlossen), Kultur-Rang + Vergleich neu
   **And** Spot-Check plausibel: Innenstadt-Kieze (Mitte, Friedrichshain-Kreuzberg) hoch, Außenbezirk gedämpft (nicht null, dank 13.1-Dämpfung)
   **And** Idempotenz: zweiter Lauf identisch außer `computed_at`

5. **AC-5 (TDD):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** `aggregate-scores`/`-ranks`/`-comparison`-Tests decken die `kultur`-Spalte ab, `pnpm test` 100% grün

## Tasks / Subtasks

- [x] **Task 1: aggregate-scores.ts** (AC: #1, #5)
  - [x] 1.1 (RED) Test: `toScoreRow` mappt `kultur`, Insert enthält Spalte
  - [x] 1.2 (GREEN) `scripts/aggregate-scores.ts`: `ScoreRow` (Z.49–58) + `kultur`, `toScoreRow` (Z.112–127) + `pickDimensionValue(score, 'kultur')`, beide Inserts (Z.201–214, Z.216–229) + Spalte

- [x] **Task 2: aggregate-ranks.ts** (AC: #2, #5)
  - [x] 2.1 (RED) Test: Kultur-Metrik im Ranking
  - [x] 2.2 (GREEN) `scripts/aggregate-ranks.ts`: `MetricSpec` für `kultur` in `METRICS` (Z.61–80), `ScoreStatsRow`/`ScoreSel` + Spalte, beide Select-Queries (Z.108–158) + `kultur`

- [x] **Task 3: aggregate-comparison.ts** (AC: #2, #5)
  - [x] 3.1 (RED) Test: Kultur in Comparison
  - [x] 3.2 (GREEN) `scripts/aggregate-comparison.ts`: `METRIC_KEYS` (Z.26–33) + `kultur`, `ScoreRow` (Z.36–45) + Spalte, beide Selects (Z.58–82) + `kultur`

- [x] **Task 4: Re-Run + Verify** (AC: #3, #4)
  - [x] 4.1 `pnpm data:kiez-scores`: `kiez-scores.json` enthält Kultur-Dimension, `kiez-score-kultur`-GeoJSON + MANIFEST-Eintrag erzeugt
  - [x] 4.2 `pnpm data:aggregate-scores && pnpm data:rank && pnpm data:comparison`
  - [x] 4.3 Spot-Check 12 Bezirke + Kiez-Stichprobe (Innen hoch, Außen gedämpft, kein flächiges null)
  - [x] 4.4 Idempotenz-Lauf

- [x] **Task 5: Abschluss** (AC: #5)
  - [x] 5.1 `pnpm test` grün, `pnpm check` ohne neue Errors (Daten-Pipeline-Seite). UI-Errors bleiben bis 13.4/13.5

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

**Hardcoded Aggregations-Stellen (müssen je `kultur` bekommen):**
- `aggregate-scores.ts`: `ScoreRow` Z.49–58, `toScoreRow` Z.112–127 (`pickDimensionValue(score, 'ruhe-luft')` etc, hardcoded), `upsertAll` Inserts `bezirkScore` Z.201–214 + `kiezScore` Z.216–229.
- `aggregate-ranks.ts`: `METRICS` Z.61–80 (hardcoded Metrik-Keys), `ScoreStatsRow` Z.42–55, Selects Z.108–158. **Iteriert NICHT die Union.**
- `aggregate-comparison.ts`: `METRIC_KEYS` Z.26–33, `ScoreRow` Z.36–45, Selects Z.58–82. **Iteriert NICHT die Union.**

**Automatisch (kein Edit):**
- `compute-score.ts` `computeKiezScore` iteriert `DIMENSION_CONFIGS` → rechnet Kultur automatisch.
- `aggregate-to-larger-region.ts` `aggregateDimension` Z.50–81 iteriert `KIEZ_SCORE_DIMENSIONS` → flächen-gewichtetes Mittel für Kultur automatisch. `overall` via `computeOverallScore`.
- `output-schema.ts` leitet Picklist aus `KIEZ_SCORE_DIMENSIONS` ab.

**Derived-Layer + MANIFEST:**
- `pipeline.ts` `buildDerivedLayerGeojsons` Z.81–133 iteriert `KIEZ_SCORE_DIMENSIONS` Z.87 + Slug-Map (aus 13.1) → erzeugt `kiez-score-kultur`-GeoJSON automatisch.
- `build-kiez-scores.ts` `augmentManifestWithKiezScoreLayers` Z.189–233 schreibt es ins MANIFEST.

### Recompute-Reihenfolge (package.json)

`data:kiez-scores` → `data:aggregate-scores` → `data:rank` → `data:comparison`. Alle idempotent (TRUNCATE+Insert).

### Was nicht brechen darf

- Bestehende 5 Dimensionen: Werte ändern sich nur durch Gewichts-Rebalance (13.1), Struktur stabil.
- Composite bleibt Mittel der fünf Composite-Dimensionen (Option C, Story 13.1 schließt Kultur aus `computeOverallScore` aus). Der Gesamt-Score-Wert bestehender Kieze bleibt durch Kultur unverändert; Kultur erscheint nur als eigene Dimension + Rang. Spot-Check plausibilisiert.
- Idempotenz.

### Architektur-Compliance

- **MUST #2:** aggregate-Skripte < 500 Zeilen halten (additive Spalten, kein Bloat).
- **MUST #7:** typsicher, kein `any` in den Row-Interfaces.

## References

- `scripts/aggregate-scores.ts` (ScoreRow Z.49–58, toScoreRow Z.112–127, Inserts Z.201–229)
- `scripts/aggregate-ranks.ts` (METRICS Z.61–80, Selects Z.108–158)
- `scripts/aggregate-comparison.ts` (METRIC_KEYS Z.26–33, ScoreRow Z.36–45, Selects Z.58–82)
- `scripts/lib/kiez-score/aggregate-to-larger-region.ts` (aggregateDimension Z.50–81, iteriert Union — kein Edit)
- `scripts/lib/kiez-score/pipeline.ts` (buildDerivedLayerGeojsons Z.81–133)
- `scripts/build-kiez-scores.ts` (POI_LAYERS Z.57, augmentManifest Z.189–233)
- `docs/adr/ADR-012-tdd-mandate.md`
- `_bmad-output/implementation-artifacts/9-3-pipeline-recompute-rerun.md` (Recompute-Muster)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.3 erstellt (ready-for-dev). Hardcoded Aggregations-Edits (scores/ranks/comparison) + Re-Run-Kette. Kultur end-to-end befüllt. Derived Map-Layer automatisch.
