# Story 14.3: Pipeline-Recompute + Re-Run

Status: review

> **Anker:** ADR-012, ADR-019. Strukturell analog Story 13.3.
> **Hard-Block:** Stories 14.0 + 14.1 + 14.2 `done`. Vor 14.4 + 14.5.

## Story

As a Solo-Maintainer,
I want die Score-Pipeline auf das erweiterte Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die Kriminalitäts-Dimension enthalten, ohne den Composite zu verändern.

## Kontext: Warum dieser Change

Mit BR-Index (14.0), Dimension (14.1) und Schema (14.2) muss die Pipeline einmal durchlaufen: `kiez-scores.json` (542 PLR) + Aggregate (143 BR + 12 Bezirk) bekommen die neue Dimension. **Der Composite-Rang bleibt unverändert** (Kriminalität nicht in `COMPOSITE_DIMENSIONS`).

## Acceptance Criteria

1. **AC-1 (Recompute):**
   **Given** 14.0 + 14.1 + 14.2
   **When** ich `compute-score.ts`/`build-kiez-scores.ts`/`aggregate-scores.ts` auf das erweiterte Set anpasse und den BR-Index als Score-Input einlese
   **Then** produzieren `pnpm data:kiez-scores` + `data:aggregate-scores` deterministische Outputs inkl. `kriminalitaet`, `composite` unverändert

2. **AC-2 (Re-Run + Konsistenz):**
   **Given** Folge-Pipelines (Epic 11)
   **When** `data:rank` + `data:comparison` neu laufen
   **Then** bleibt der Composite-Rang identisch (Kriminalität zählt nicht rein), der Kriminalitäts-Wert ist verfügbar
   **And** Spot-Check plausibel: BR-Wert **konstant über alle PLR derselben Bezirksregion**, City-Cores als Verzerrung erkennbar behandelt (geflaggt/gekappt)

3. **AC-3 (Aggregat-Konsistenz):**
   **Given** die flächen-gewichtete Aggregation (ADR-013)
   **When** der gespiegelte PLR-Wert auf BR zurück-aggregiert wird
   **Then** reproduziert das exakt den ursprünglichen BR-Atlas-Wert (Spiegelung + flächen-gewichtetes Mittel ist verlustfrei für konstante Werte)

## Tasks / Subtasks

- [x] **Task 1: Score-Input-Anbindung** (AC: #1)
  - [x] 1.1 BR-Index-Aggregat (14.0) als perLorHit `kriminalitaet` (`value.index`) in `build-kiez-scores.ts` eingehängt (analog `laerm-db`)
  - [x] 1.2 `aggregate-scores.ts` ScoreRow + toScoreRow + beide Inserts um `kriminalitaet`; `KRIMINALITAET_CONFIG` greift automatisch über `DIMENSION_CONFIGS`
- [x] **Task 2: Re-Run** (AC: #1, #2)
  - [x] 2.1 `pnpm data:kiez-scores` (542) + `data:aggregate-scores` (143+12) + `data:rank` (2145+180) + `data:comparison` (1001+84)
  - [x] 2.2 Spot-Check: Composite/overall **0 Änderungen über alle 542 PLR**, BR-Wert konstant über PLR, City-Cores geklemmt (Regierungsviertel/Alexanderplatz = 100, Außen-BRs ~1–7)
- [x] **Task 3: Konsistenz-Assert** (AC: #3)
  - [x] 3.1 Test: flächen-gewichtete Aggregation einer Konstante == Konstante (verlustfreie Spiegelung), `aggregate-to-larger-region.test.ts`

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- Pipeline: `scripts/lib/kiez-score/compute-score.ts`, `scripts/build-kiez-scores.ts`, `scripts/aggregate-scores.ts`. `aggregate-to-larger-region.ts` iteriert `KIEZ_SCORE_DIMENSIONS` und ruft `computeOverallScore` (erbt Composite-Filter automatisch).
- Memory-Erinnerung: nach `aggregate-scores` müssen `data:rank` + `data:comparison` neu laufen (Rank/Comparison-CASCADE-Wipe, sonst leere kiez_rank/bezirk_rank).

### Verlustfreiheit der Spiegelung

Konstanter Wert innerhalb einer BR → flächen-gewichtetes Mittel ergibt exakt diesen Wert. Damit ist der Bezirks-Aggregat-Wert für Kriminalität korrekt, obwohl PLR-Ebene nur gespiegelt ist. Im Inspector kennzeichnen, dass die Granularität BR ist (14.4).

### Was nicht brechen darf

- Composite/overall + alle bestehenden Ränge bit-identisch.

## References

- `scripts/lib/kiez-score/compute-score.ts`, `aggregate-to-larger-region.ts`, `scripts/build-kiez-scores.ts`, `scripts/aggregate-scores.ts`
- `docs/adr/ADR-013-score-aggregation-strategy.md`, `ADR-019-...md`
- Memory: Rank/Comparison-CASCADE-Wipe (`data:rank` + `data:comparison` nach aggregate neu)
- `_bmad-output/implementation-artifacts/13-3-pipeline-recompute-rerun.md` (Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- **Score-Input-Anbindung:** `build-kiez-scores.ts` liest `static/data/kriminalitaet-lor.json` und pusht pro PLR einen `kriminalitaet`-perLorHit (`value.index`) — exakt das laerm-db-Muster. PLR ohne BR-Index (index null) → kein Hit → Dimension missing (kein Crash).
- **DB-Persistenz:** `aggregate-scores.ts` ScoreRow + `pickDimensionValue('kriminalitaet')` + beide Inserts (bezirk_score + kiez_score).
- **Re-Run komplett:** `data:kiez-scores` (542 PLR) → `data:aggregate-scores` (12+143) → `data:rank` (2145+180) → `data:comparison` (1001+84). Rank/Comparison-Rerun zwingend (CASCADE-Wipe-Memory).
- **AC-1/AC-2 bewiesen:** Diff der `overall`-Werte gegen `HEAD:kiez-scores.json` = **0 Änderungen über 542 PLR**; kriminalitaet auf allen 542 gesetzt. DB: 143 kiez + 12 bezirk, kriminalitaet überall befüllt.
- **City-Core-Kappung sichtbar:** Regierungsviertel + Alexanderplatz = 100 (geklemmt), Außen-BRs Müggelheim 1.1 / Schmöckwitz 3.6 — Magnitude-Skala spreizt korrekt, City-Core-Verzerrung als solche behandelt.
- **AC-3 (Verlustfreiheit):** Unit-Test — flächen-gewichtetes Mittel einer BR-konstanten Größe reproduziert exakt die Konstante (`aggregateScoresToRegion`), unabhängig von den PLR-Flächen.
- **Guard-getriebene Zusatz:** der Recompute erzeugt den Layer `kiez-score-kriminalitaet` im MANIFEST → der LAYER_EXPLAIN_DE-Coverage-Guard verlangte einen Entry. Neutralen, stigma-sicheren Explain-Text ergänzt (BR-Granularität, Touristen/Pendler-Caveat, „kein Maß für persönliches Risiko", kein „sicher/gefährlich"). Visuelles Surfacing (Indigo-Render, Compare, LLM) bleibt 14.4.
- **Verifikation:** `pnpm check` 0 Errors / 6290 Files, Unit-Suite **2830/2830 grün**.

### File List

**Geändert:**
- `scripts/build-kiez-scores.ts` (kriminalitaet-perLorHit-Injection)
- `scripts/aggregate-scores.ts` (ScoreRow + toScoreRow + 2 Inserts)
- `scripts/lib/kiez-score/aggregate-to-larger-region.test.ts` (Verlustfreiheit-Test)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (kiez-score-kriminalitaet-Entry)
- `static/kiez-scores/kiez-scores.json` (Recompute, +kriminalitaet, composite unverändert)
- `static/kiez-scores/layers/*.geojson` (8 derived, inkl. kiez-score-kriminalitaet) + `static/layers/MANIFEST.json` + neue `static/layers/kiez-score-kriminalitaet.<hash>.geojson`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-3 → review)
- DB: kiez_score/bezirk_score (kriminalitaet befüllt), kiez_rank/bezirk_rank + comparison neu

### Debug Log References

- overall-Diff alt vs neu: 0/542 geändert. kriminalitaet-Werte: min 1.1, max 100 (geklemmt), alle 143 BR gesetzt.

## Change Log

- 2026-06-09: Story 14.3 erstellt (ready-for-dev). Recompute mit BR-Index-Input, Composite unverändert, Spiegelungs-Verlustfreiheit asserted.
- 2026-06-10: Story 14.3 implementiert (→ review). perLorHit-Injection + aggregate-scores-Spalte + Full-Re-Run (542/143/12). Composite bit-stabil (0/542), City-Core geklemmt, Verlustfreiheit-Test. check 0 Errors, 2830 grün.
