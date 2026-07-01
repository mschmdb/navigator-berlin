# Story 13.1: Kultur-Dimensions-Foundation (Typ-Union + Config + Dämpfung, standalone)

Status: review

> **Anker:** ADR-012 (TDD), ADR-015 (Score-Composition). Strukturell analog Story 9.1 (Dimension hinzufügen).
> **Owner-Decision 2026-06-07 (Option C):** Kultur ist eine sichtbare, eigenständige Dimension (eigener Choropleth, Inspector, Rang), **fließt aber NICHT in den Gesamt-/Composite-Score.** Begründung: der Composite heißt „Umwelt- & Infrastruktur-Score" und Kultur ist innenstadt-lastig (Center-Bias) — als Headline-Treiber würde sie jeden Außenbezirk-Gesamt-Score systematisch drücken. Präzedenz: ADR-015 behandelt Soziale Lage genauso (sichtbar, aber nicht im Composite).
> **Hard-Block:** Story 13.0 `done` (Kultur-Layer im PoiIndex). Vor 13.2 (Schema) und 13.3 (Recompute).

## Story

As a Solo-Maintainer,
I want die Kultur-Dimension zentral als eigenständige (nicht-Composite) Dimension anlegen (Typ-Union + dimension-config + Composite-Ausschluss),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren und der Gesamt-Score „Umwelt- & Infrastruktur" semantisch stabil bleibt.

## Kontext: Warum dieser Change

Diese Story ist das Fundament der Kultur-Dimension. Sie erweitert die zentrale Typ-Union, definiert `KULTUR_CONFIG` mit `poi-density`-Termen, löst den Center-Bias über die Normalisierung **und schließt Kultur explizit aus dem Composite aus** (Option C).

**Composite-Mechanik heute:** `computeOverallScore` (compute-score.ts Z.303–308) bildet das **ungewichtete Mittel über alle Dimensionen mit Wert ≠ null**. Würde Kultur einfach zu `KIEZ_SCORE_DIMENSIONS` addiert, flösse sie automatisch in den Gesamt-Score (und ins „wo lebt es sich gut"-Ranking). Genau das wollen wir NICHT. Lösung: Kultur ist in der Dimensions-Union (wird gerechnet, gerankt, angezeigt), aber `computeOverallScore` ignoriert sie über eine explizite Composite-Whitelist/Exclusion.

**Center-Bias:** Kulturinfrastruktur ist innenstadt-lastig. Auch als standalone Dimension braucht die Normalisierung eine Dämpfung (Log-Skala), damit Außenbezirke nicht flächendeckend auf ~0 fallen.

## Acceptance Criteria

1. **AC-1 (Typ-Union + standalone-Status):**
   **Given** das 5-Dimensions-Set
   **When** ich `scripts/lib/kiez-score/types.ts` `KiezScoreDimension` um `'kultur'` erweitere
   **Then** enthält `KIEZ_SCORE_DIMENSIONS` (Z.8–14) 6 Einträge (Kultur wird gerechnet + angezeigt + gerankt)
   **And** `DIMENSION_WEIGHTS` (Z.96–102): die fünf Composite-Dimensionen bleiben bei `0.20` (Summe 1.0 = Composite), `kultur: 0` mit Kommentar „nicht im Composite, Option C". **Kein Rebalance der fünf.**

2. **AC-2 (Composite-Ausschluss):**
   **Given** Option C (Kultur nicht im Gesamt-Score)
   **When** ich eine Composite-Definition einführe (z.B. `COMPOSITE_DIMENSIONS: readonly KiezScoreDimension[]` mit den fünf, oder `COMPOSITE_EXCLUDED = ['kultur']`) und `computeOverallScore` (compute-score.ts Z.303–308) darauf filtern lasse
   **Then** ist der Gesamt-Score eines Kiezes/Bezirks das Mittel der fünf Composite-Dimensionen, **unabhängig vom Kultur-Wert**
   **And** beide Aufrufer (`computeKiezScore` Z.288, `aggregateScoresToRegion` Z.111) erben das Verhalten über die eine Filter-Stelle

3. **AC-3 (KULTUR_CONFIG):**
   **Given** die Kultur-Layer aus 13.0
   **When** ich `KULTUR_CONFIG` in `dimension-config.ts` mit `poi-density`-Termen anlege und in `DIMENSION_CONFIGS` (Z.156–162) aufnehme
   **Then** sind die Terme gewichtet (Bibliothek/Theater/Museum höher als nightclub/artwork), Radien plausibel, Summe der Term-Gewichte = 1.0

4. **AC-4 (Center-Bias-Dämpfung):**
   **Given** das Innen-Außen-Gefälle
   **When** die Normalisierung gesetzt wird
   **Then** dämpft sie (Log-Skala oder großzügiger Cap), Außenbezirk-Kieze fallen nicht flächendeckend auf null
   **And** die Entscheidung „dämpfen vs. real" ist dokumentiert, die Dämpfungs-Kurve getestet (1 POI → spürbarer Wert)

5. **AC-5 (Pipeline-Slug-Mapping):**
   **Given** `pipeline.ts` baut abgeleitete Score-Layer pro Dimension
   **When** ich `KiezScoreLayerSlug` (Z.54–59) + `KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION` (Z.62–66) um `kultur` → `kiez-score-kultur` erweitere
   **Then** kann die Pipeline den Kultur-Score-Layer erzeugen (Befüllung in 13.3)

6. **AC-6 (TDD):**
   **Given** ADR-012
   **When** compute-score/dimension-config-Tests laufen
   **Then** spiegeln Tests: 6 Dimensionen, **Composite = Mittel der fünf** (Kultur-Wert verändert overall NICHT), Composite-Dim-Gewichts-Summe = 1, Dämpfungs-Kurve getestet
   **And** `pnpm test` 100% grün

## Tasks / Subtasks

- [x] **Task 1: Typ-Union + Composite-Definition** (AC: #1, #2)
  - [x] 1.1 (RED) `compute-score.test.ts`: Test — Kiez mit Kultur-Wert X hat dasselbe `overall` wie ohne Kultur (Composite = Mittel der fünf)
  - [x] 1.2 (GREEN) `scripts/lib/kiez-score/types.ts`: `KiezScoreDimension` (Z.1–6) + `'kultur'`, `KIEZ_SCORE_DIMENSIONS` (Z.8–14) ergänzen, `DIMENSION_WEIGHTS` (Z.96–102) `kultur: 0` (fünf bleiben 0.20)
  - [x] 1.3 (GREEN) `types.ts`: `COMPOSITE_DIMENSIONS: readonly KiezScoreDimension[]` (die fünf) ODER `COMPOSITE_EXCLUDED_DIMENSIONS` exportieren

- [x] **Task 2: computeOverallScore filtern** (AC: #2, #6)
  - [x] 2.1 (RED) `compute-score.test.ts`: `computeOverallScore` ignoriert eine als nicht-Composite markierte Dimension
  - [x] 2.2 (GREEN) `scripts/lib/kiez-score/compute-score.ts` `computeOverallScore` (Z.303–308): vor dem Mitteln auf Composite-Dimensionen filtern (`COMPOSITE_DIMENSIONS.includes(d.dimension)` bzw. nicht in `COMPOSITE_EXCLUDED`)
  - [x] 2.3 Verify: `aggregateScoresToRegion` (aggregate-to-larger-region.ts Z.111) nutzt dieselbe Funktion → Bezirks-/BzR-Composite ebenfalls ohne Kultur

- [x] **Task 3: Dämpfungs-Normalisierung** (AC: #4)
  - [x] 3.1 (RED) `normalize.test.ts`: Dämpfungs-Kurve — 1 POI spürbar, Sättigung bei hoher Dichte
  - [x] 3.2 (GREEN) `poi-density`-Strategy (`types.ts` Z.61–62) um optionales `scale?: 'linear' | 'log'` erweitern (Default `linear`, rückwärtskompatibel), `normalizeDensity` (`normalize.ts` Z.107–118) Log-Zweig; `compute-score.ts` poi-density-Branch (Z.136–152) reicht `scale` durch. Alternative: großzügiger Cap ohne Typ-Änderung, Entscheidung dokumentieren

- [x] **Task 4: KULTUR_CONFIG** (AC: #3)
  - [x] 4.1 (RED) `dimension-config.test.ts`: `KULTUR_CONFIG` in `DIMENSION_CONFIGS`, Term-Summe 1.0
  - [x] 4.2 (GREEN) `scripts/lib/kiez-score/dimension-config.ts`: `KULTUR_CONFIG` anlegen (poi-density je Kultur-Layer, log-skaliert), in `DIMENSION_CONFIGS` (Z.156–162). Beispiel:
    ```ts
    export const KULTUR_CONFIG: DimensionConfig = {
      dimension: 'kultur',
      layers: [
        { layer: 'kultur-bibliothek', weight: 0.20, normalize: { kind: 'poi-density', radiusM: 1000, cap: 2, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-theater',    weight: 0.15, normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-museum',     weight: 0.15, normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-kino',       weight: 0.12, normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-galerie',    weight: 0.10, normalize: { kind: 'poi-density', radiusM: 1200, cap: 3, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-soziokultur',weight: 0.13, normalize: { kind: 'poi-density', radiusM: 1200, cap: 2, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-kunst-im-raum', weight: 0.08, normalize: { kind: 'poi-density', radiusM: 800, cap: 5, scale: 'log', softTailFactor: 0.3 } },
        { layer: 'kultur-club',       weight: 0.07, normalize: { kind: 'poi-density', radiusM: 1200, cap: 3, scale: 'log', softTailFactor: 0.3 } }
      ]
    };
    ```
    Gewichte + Radien Owner-Review-pflichtig

- [x] **Task 5: Pipeline-Slug-Mapping** (AC: #5)
  - [x] 5.1 `scripts/lib/kiez-score/pipeline.ts`: `KiezScoreLayerSlug` (Z.54–59) + `kiez-score-kultur`, `KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION` (Z.62–66) + `kultur`-Mapping

- [x] **Task 6: Abschluss** (AC: #6)
  - [x] 6.1 `pnpm test` grün. `pnpm check`: Folge-Compile-Errors aus dem 6er-Set in Konsumenten sind ERWARTET (13.2 Schema, 13.3 Data, 13.4 UI, 13.5 Content). Hier nur Foundation-Module grün

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`types.ts`**: `KiezScoreDimension` Z.1–6, `KIEZ_SCORE_DIMENSIONS` Z.8–14, `DIMENSION_WEIGHTS` Z.96–102 (alle 0.2), `poi-density` Z.61–62, `DimensionConfig` Z.70–76.
- **`compute-score.ts`**: `computeKiezScore` Z.278–297 iteriert `DIMENSION_CONFIGS` → rechnet Kultur automatisch. `computeOverallScore` Z.303–308 = **ungewichtetes Mittel über non-null Dimensionen** (hier muss der Composite-Filter rein). `poi-density`-Branch Z.136–152.
- **`aggregate-to-larger-region.ts`**: `aggregateScoresToRegion` Z.83 iteriert `KIEZ_SCORE_DIMENSIONS` Z.94 (aggregiert auch Kultur flächen-gewichtet — gewollt, Kultur-Wert pro BzR/Bezirk existiert), ruft `computeOverallScore` Z.111 → erbt den Composite-Filter automatisch.
- **`dimension-config.ts`**: `DIMENSION_CONFIGS` Z.156–162. **`normalize.ts`**: `normalizeDensity` Z.107–118.
- **`pipeline.ts`**: `KiezScoreLayerSlug` Z.54–59, Slug-Map Z.62–66.

### Option-C-Kern: eine Filter-Stelle

Kultur wird voll gerechnet (Dimension), voll aggregiert (BzR/Bezirk-Wert), voll als Layer + Rang geführt. Sie zählt nur an EINER Stelle nicht: `computeOverallScore`. Da beide Composite-Aufrufer (Kiez + Region) dieselbe Funktion nutzen, reicht ein Filter dort. Sauberster Weg: `COMPOSITE_DIMENSIONS`-Whitelist in `types.ts`, `computeOverallScore` filtert `d.dimension` dagegen.

### Dämpfungs-Design

Log-Skala `100 * ln(1+count)/ln(1+cap)` belohnt den ersten POI stark, flacht ab. Passt zu „ein Kino in Reichweite ist viel wert, das zehnte kaum mehr" und dämpft den Center-Bias auf der Dimensions-Karte selbst. Owner-Review: falls „real abbilden", `scale: 'linear'` + kleiner Cap.

### Was nicht brechen darf

- Die 5 Composite-Dimensionen + Configs: kein inhaltliches Anfassen, Gewichte bleiben 0.20.
- Der Gesamt-Score-Wert für bestehende Kieze bleibt **bit-identisch** (Composite = Mittel der fünf, Kultur ändert ihn nicht). Das ist der zentrale Option-C-Test (Task 1.1).
- `scale: 'linear'`-Default hält bestehende `poi-density`-Terme (Versorgung) identisch.
- `aggregate-to-larger-region.ts` braucht keinen Edit (erbt Filter via computeOverallScore).

### Erwartete Folge-Errors

Nach dem 6er-Set werfen hardcoded Konsumenten Compile-Fehler (Schema, aggregate-Skripte, UI). Behoben in 13.2–13.5. Diese Story liefert nur das grüne Foundation-Modul.

## References

- `scripts/lib/kiez-score/types.ts` (Z.1–14, 61–62, 96–102)
- `scripts/lib/kiez-score/compute-score.ts` (computeKiezScore Z.278–297, computeOverallScore Z.303–308, poi-density Z.136–152)
- `scripts/lib/kiez-score/aggregate-to-larger-region.ts` (Z.94, computeOverallScore Z.111)
- `scripts/lib/kiez-score/dimension-config.ts` (DIMENSION_CONFIGS Z.156–162), `normalize.ts` (Z.107–118)
- `scripts/lib/kiez-score/pipeline.ts` (Z.54–66)
- `docs/adr/ADR-012-tdd-mandate.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md` (Soziale-Lage-Präzedenz: sichtbar, nicht im Composite)
- `_bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md` (Dimension-hinzufügen-Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-13-kultur-score`.

### Completion Notes List

- **Typ-Union 5→6** (`types.ts`): `KiezScoreDimension` + `'kultur'`, `KIEZ_SCORE_DIMENSIONS` 6 Einträge. `DIMENSION_WEIGHTS.kultur = 0`, fünf Composite-Dimensionen bleiben 0.20 (Summe 1.0). **Kein Rebalance.**
- **Option C** (`COMPOSITE_DIMENSIONS` in `types.ts` = die fünf): `computeOverallScore` filtert darauf → Gesamt-Score = Mittel der fünf, unabhängig vom Kultur-Wert. Beide Aufrufer (`computeKiezScore` + `aggregateScoresToRegion`) erben es über die eine Filter-Stelle.
- **Dämpfung** (`poi-density` + optionales `scale?: 'linear'|'log'`, Default linear rückwärtskompatibel): `normalizeDensity` Log-Zweig `100·ln(1+count)/ln(1+cap)`, `compute-score` reicht `scale` durch.
- **KULTUR_CONFIG** (8 log-gedämpfte poi-density-Terme, Summe 1.0) in `DIMENSION_CONFIGS`. Bibliothek/Theater/Museum höher gewichtet.
- **Pipeline**: `KiezScoreLayerSlug` + `kiez-score-kultur`, Slug-Map + `kultur`.
- Einziger Compile-Blocker war `DIMENSION_LABELS_DE` (exhaustiv) → `'kultur': 'Kultur'` ergänzt. Restliche UI-Surfacing (Ring 6 Segmente, Ranking-Spalte, OG, Choropleth) = Story 13.4.
- **TDD:** 6-Dim-Foundation-Tests aktualisiert + Option-C-Test (overall ignoriert Kultur) + Log-Dämpfungs-Test + COMPOSITE_DIMENSIONS-Test + KULTUR_CONFIG-Test.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2788/2788 grün**. kiez-scores.json + DB noch NICHT neu (Schema 13.2, Recompute 13.3).

### File List

**Geändert:**
- `scripts/lib/kiez-score/types.ts` (Union, KIEZ_SCORE_DIMENSIONS, COMPOSITE_DIMENSIONS, DIMENSION_WEIGHTS, poi-density scale)
- `scripts/lib/kiez-score/normalize.ts` (+test) (Log-Dämpfung)
- `scripts/lib/kiez-score/compute-score.ts` (+test) (Option-C-Filter, scale-Passthrough)
- `scripts/lib/kiez-score/dimension-config.ts` (+test) (KULTUR_CONFIG)
- `scripts/lib/kiez-score/pipeline.ts` (+test) (Slug-Mapping)
- `scripts/lib/kiez-score/aggregate-to-larger-region.test.ts` (6-Dim)
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` (Label, Compile-Unblock)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.1 erstellt (ready-for-dev).
- 2026-06-07: Option C eingearbeitet (Owner-Decision) — Kultur ist eigenständige, sichtbare Dimension, aber NICHT im Composite. Kein Gewichts-Rebalance der fünf; `computeOverallScore` filtert auf Composite-Dimensionen. Dämpfung (Log) bleibt.
