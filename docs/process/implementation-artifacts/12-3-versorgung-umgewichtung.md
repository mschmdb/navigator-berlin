# Story 12.3: Versorgung · interne Umgewichtung (öffentlich + privat)

Status: review

> **Anker:** ADR-012 (TDD), ADR-015 (Score-Semantik). Owner-Review-pflichtig: die Gewichtung ist eine redaktionelle Entscheidung.
> **Hard-Block:** Story 12.1 + 12.2 `done` (alle Nahversorgungs-Terme in `VERSORGUNG_CONFIG`).

## Story

As a Solo-Maintainer,
I want die Versorgungs-Dimension intern neu gewichten, damit die Nahversorgungs-Terme Platz bekommen ohne die Dimension zu sprengen,
so that Daseinsvorsorge und Alltagsversorgung in einem nachvollziehbaren Verhältnis stehen.

## Kontext: Warum dieser Change

12.1 + 12.2 haben Lebensmittel, Apotheke, Post mit vorläufigen Gewichten eingefügt. Diese Story setzt die finale interne Verteilung (Summe = 1.0), prüft den Doppel-Penalty-Effekt für datenarme Außenbezirke und rechnet den Score + alle Aggregate (Rang, Vergleich) neu. Die Top-Level-Gewichtung `versorgung` = 0.20 bleibt; nur die interne Aufteilung ändert sich.

## Acceptance Criteria

1. **AC-1 (Finale Umgewichtung):**
   **Given** die Versorgungs-Terme summieren intern auf 1.0
   **When** die finale Verteilung gesetzt wird
   **Then** gilt (Owner-Review-pflichtig): Kita (Dichte 0.12 + pro Kind 0.12 = 0.24), Schule (Grund 0.12 + weiterf. 0.12 = 0.24), Krankenhaus 0.18, Spielplatz 0.10, Nahversorgung 0.24 (Lebensmittel 0.12, Apotheke 0.07, Post 0.05)
   **And** Summe aller Term-Gewichte = 1.00 (asserted)

2. **AC-2 (Doppel-Penalty-Guard):**
   **Given** ein datenarmer Außenbezirk-Kiez (wenig Kita UND wenig Supermarkt)
   **When** die Umgewichtung gerechnet wird
   **Then** der Spreizungs-Effekt ist geprüft (Verteilung der Versorgungs-Werte vor/nach, Min/Max/Median dokumentiert)
   **And** die Missing-Data-Policy (≥ 50 % Member non-null pro Dimension, `COVERAGE_THRESHOLD = 0.5`) greift nachweislich

3. **AC-3 (Determinismus + TDD):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** Gewichts-Summe = 1.0 ist asserted
   **And** Recompute ist idempotent (zweimal `data:aggregate-scores` → identische Werte außer `computed_at`)

4. **AC-4 (Konsumenten-Recompute):**
   **Given** Epic 11 (Ranking + Comparison) ist aktiv
   **When** `data:aggregate-scores` + `data:rank` + `data:comparison` neu laufen
   **Then** Composite, Versorgungs-Rang und Vergleichswerte aktualisieren sich, **Schema unverändert** (keine neue Spalte, keine neue Dimension)
   **And** Spot-Check 12 Bezirke + Stichprobe Kieze plausibel

## Tasks / Subtasks

- [x] **Task 1: Finale Gewichte setzen** (AC: #1)
  - [x] 1.1 (RED) `dimension-config.test.ts`: Test asserted die finale Verteilung + Summe 1.0
  - [x] 1.2 (GREEN) `scripts/lib/kiez-score/dimension-config.ts` `VERSORGUNG_CONFIG` (Z.94–139): Gewichte final setzen, „vorläufig"-Kommentare aus 12.1/12.2 entfernen
  - [x] 1.3 ADR-Notiz / Kommentar: Versorgung = öffentlich (Daseinsvorsorge) + privat (Nahversorgung), Gewichts-Begründung

- [x] **Task 2: Spreizungs-Analyse** (AC: #2)
  - [x] 2.1 `pnpm data:kiez-scores`: Versorgungs-Werte aller 542 LOR vor/nach vergleichen (Min/Max/Median/Quartile)
  - [x] 2.2 Außenbezirk-Stichprobe (z.B. Marzahn-Hellersdorf, Spandau-Rand): prüfen ob Versorgung nicht flächendeckend kollabiert
  - [x] 2.3 Missing-Data-Verhalten dokumentieren (`COVERAGE_THRESHOLD = 0.5` in `aggregate-to-larger-region.ts` Z.21)
  - [x] 2.4 Falls Doppel-Penalty zu hart: Caps/Soft-Tail in 12.1/12.2 nachjustieren (gleicher Config-Block), erneut messen

- [x] **Task 3: Recompute-Kette** (AC: #3, #4)
  - [x] 3.1 `pnpm data:kiez-scores && pnpm data:aggregate-scores && pnpm data:rank && pnpm data:comparison`
  - [x] 3.2 Idempotenz: zweiter Lauf → Werte identisch außer `computed_at`
  - [x] 3.3 Spot-Check Bezirks-Composites + Versorgungs-Rang plausibel

- [x] **Task 4: Abschluss** (AC: #3)
  - [x] 4.1 `pnpm test` 100% grün, `pnpm check` ohne neue Errors

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`VERSORGUNG_CONFIG`** `dimension-config.ts` Z.94–139 (nach 12.1/12.2: 6 Bestands-Terme + 3 Nahversorgungs-Terme, vorläufige Gewichte).
- **Top-Level-Gewicht** `DIMENSION_WEIGHTS.versorgung = 0.2` (`types.ts` Z.96–102) — **bleibt unverändert**. Diese Story rührt nur die interne Verteilung an.
- **Aggregation:** `aggregate-to-larger-region.ts` `aggregateDimension` Z.50–81 iteriert `KIEZ_SCORE_DIMENSIONS`, `COVERAGE_THRESHOLD = 0.5` Z.21. `overall` via `computeOverallScore`. Schema (`kiez_score`/`bezirk_score`) bleibt — keine neue Spalte.
- **Recompute-Reihenfolge** (`package.json`): `data:kiez-scores` → `data:aggregate-scores` → `data:rank` → `data:comparison`. Alle idempotent (TRUNCATE+Insert).

### Vorgeschlagene Verteilung (Owner-Review)

| Term | bisher | neu |
|------|--------|-----|
| Kita (Dichte + pro Kind) | 0.30 | 0.24 |
| Schule (Grund + weiterf.) | 0.30 | 0.24 |
| Krankenhaus | 0.25 | 0.18 |
| Spielplatz | 0.15 | 0.10 |
| Nahversorgung (Lebensmittel 0.12 / Apotheke 0.07 / Post 0.05) | – | 0.24 |
| **Summe** | 1.00 | 1.00 |

Begründung: Lebensmittel ist die höchstfrequente Alltagsfahrt → größtes Einzelgewicht im neuen Term. Falls Owner andere Balance will: Gewichte anpassen, Summen-Test bleibt grün (Test prüft Summe, nicht Einzelwerte).

### Was nicht brechen darf

- `DIMENSION_WEIGHTS` (5 × 0.20), Score-Schema, alle anderen Dimensionen: kein Anfassen.
- `aggregate-scores.ts`/`-ranks.ts`/`-comparison.ts`: kein Code-Edit nötig (Versorgung ist bestehende Spalte, nur Werte ändern sich).
- Idempotenz der Pipeline.

### Architektur-Compliance

- **MUST #15:** Alle Versorgungs-Terme positiv-eindeutig. ADR-015-konform.
- **MUST #6:** Gewichts-Begründung als WHY-Kommentar berechtigt.

## References

- `scripts/lib/kiez-score/dimension-config.ts` (VERSORGUNG_CONFIG Z.94–139)
- `scripts/lib/kiez-score/types.ts` (DIMENSION_WEIGHTS Z.96–102)
- `scripts/lib/kiez-score/aggregate-to-larger-region.ts` (COVERAGE_THRESHOLD Z.21, aggregateDimension Z.50–81)
- `package.json` (data:aggregate-scores / data:rank / data:comparison)
- `docs/scoring-methodology.md` (Versorgungs-Definition, wird in 12.4 erweitert)
- `docs/adr/ADR-012-tdd-mandate.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Debug Log References

- Gewichts-Lock-Test (`dimension-config.test.ts`): finale Verteilung asserted (Kita 2×0.12, Schule 2×0.12, Krankenhaus 0.18, Spielplatz 0.10, Nahversorgung 0.24 = Lebensmittel 0.12 + Apotheke 0.07 + Post 0.05). Summe 1.0.
- Spreizungs-Analyse (542 LOR, `kiez-scores.json`): Versorgung **0 null** (volle Coverage, kein Doppel-Penalty-Kollaps). min 2.6 / Q1 41 / median 60.6 / Q3 72.6 / max 90.6 / mean 55.9.
- DB-Recompute-Kette: `aggregate-scores` (12 Bezirk + 143 Kiez), `rank` (2002 + 168 Entries), `comparison` (858 + 72 rows).
- Idempotenz: `aggregate-scores` zweimal → bezirk_score composite+versorgung bit-identisch. Spot-Check Mitte: composite 46.1, versorgung 63.7.

### Completion Notes List

- **Finale Gewichte standen bereits nach 12.1 + 12.2** (jede Story hielt die interne Summe 1.0); 12.3 lockt sie per Test, prüft Spreizung und fährt die DB-Recompute-Kette. Kein erneuter Gewichts-Edit nötig.
- **Doppel-Penalty-Guard (AC-2):** kein LOR fällt durch Nahversorgung aus (0/542 null), Verteilung breit gestreut, kein Flooring bei 0. `COVERAGE_THRESHOLD = 0.5` greift nur bei <50 % Member-Coverage (hier nicht relevant, da Punkt-Dichte pro LOR direkt).
- **AC-4 Schema unverändert:** `aggregate-scores`/`-ranks`/`-comparison` brauchten keinen Code-Edit (Versorgung ist bestehende Spalte, nur Werte ändern sich).
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2784/2784 grün**.
- git-Artefakt dieser Story = nur der Gewichts-Lock-Test; DB-Inhalte sind Runtime (kein Commit). kiez-scores.json + Map-Layer wurden bereits in 12.1/12.2 committet (Gewichte dort gesetzt).

### File List

**Geändert:**
- `scripts/lib/kiez-score/dimension-config.test.ts` (Gewichts-Lock-Test der finalen Verteilung)

## Change Log

- 2026-06-07: Story 12.3 erstellt (ready-for-dev). Finale interne Umgewichtung Versorgung (öffentlich + privat), Doppel-Penalty-Guard, Recompute-Kette. Gewichtung Owner-Review-pflichtig.
- 2026-06-07: Story 12.3 implementiert (→ review). Gewichte standen nach 12.1/12.2 final; Lock-Test ergänzt, Spreizung geprüft (0/542 null), DB-Recompute-Kette + Idempotenz verifiziert. check 0 Errors, 2784/2784 grün.
