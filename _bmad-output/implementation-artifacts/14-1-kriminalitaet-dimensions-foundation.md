# Story 14.1: Kriminalitäts-Dimensions-Foundation (Typ-Union + Config + Option C + Stigma-Indigo)

Status: review

> **Anker:** ADR-012 (TDD), ADR-015 (Anti-Stigma, Soziale-Lage-Präzedenz), ADR-019 (Kriminalität). Strukturell analog Story 13.1, aber **Stigma-Framing wie Soziale Lage**, nicht wie Kultur.
> **Owner-Decision 2026-06-09 (ADR-019):** Option-C-Mechanik wie Kultur (Gewicht 0, nicht im Composite), aber Choropleth-Familie **Strukturell-Indigo** statt Gut-Grün, neutrale Bezeichnung, kein „besser"-Pfeil.
> **Hard-Block:** Story 14.0 `done` (BR-Index pro PLR). Vor 14.2 (Schema) und 14.3 (Recompute).

## Story

As a Solo-Maintainer,
I want die Kriminalitäts-Dimension zentral anlegen (Typ-Union + Config + Stigma-Familie),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren und der Composite „Umwelt- & Infrastruktur" unberührt bleibt.

## Kontext: Warum dieser Change

Die Option-C-Maschinerie existiert bereits aus Epic 13: `COMPOSITE_DIMENSIONS` (types.ts Z.25) als Whitelist, `computeOverallScore` (compute-score.ts Z.307–309) filtert darauf. **Kriminalität muss daher nur zur Dimensions-Union hinzugefügt und NICHT in `COMPOSITE_DIMENSIONS` eingetragen werden — dann ist sie automatisch aus dem Gesamt-Score ausgeschlossen.** Kein neuer Filter-Mechanismus nötig.

Im Unterschied zu Kultur ist Kriminalität ein **BR-nativer, vorberechneter Einzelwert** (aus 14.0), kein poi-density-Radius-Join. Die Config registriert einen Single-Precomputed-Term. Stigma-Framing folgt Soziale Lage (ADR-015): Strukturell-Indigo, der Wert ist Magnitude (mehr Kriminalität = intensiveres Indigo), keine „sicher/gefährlich"-Wertung.

## Acceptance Criteria

1. **AC-1 (Typ-Union, NICHT im Composite):**
   **Given** das 6-Dim-Set aus Epic 13
   **When** ich `scripts/lib/kiez-score/types.ts` `KiezScoreDimension` (Z.1–7) um `'kriminalitaet'` erweitere und in `KIEZ_SCORE_DIMENSIONS` (Z.9–15) aufnehme
   **Then** wird Kriminalität gerechnet + angezeigt, `DIMENSION_WEIGHTS.kriminalitaet = 0` (Z.121+, Kommentar „nicht im Composite, ADR-019")
   **And** `COMPOSITE_DIMENSIONS` (Z.25) bleibt **unverändert** (die fünf) → `computeOverallScore` ignoriert Kriminalität automatisch, kein Rebalance

2. **AC-2 (Composite bit-stabil):**
   **Given** Option C
   **When** ein Kiez/Bezirk einen Kriminalitäts-Wert bekommt
   **Then** ist sein Gesamt-Score **bit-identisch** zum Vorher-Zustand (Mittel der fünf, unabhängig vom Kriminalitäts-Wert), für beide Aufrufer (`computeKiezScore` Z.280, `aggregateScoresToRegion`)

3. **AC-3 (KRIMINALITAET_CONFIG, Single-Term):**
   **Given** der BR-Index pro PLR aus 14.0
   **When** ich `KRIMINALITAET_CONFIG` in `dimension-config.ts` (nach `KULTUR_CONFIG` Z.185) anlege und in `DIMENSION_CONFIGS` (Z.231) aufnehme
   **Then** ist es ein Single-Term, der den vorberechneten Index liest (Passthrough/Numerik-Normalize auf 0–100), **keine Invertierung zu „Sicherheit"**; Delikt-Gewichte (für die Index-Bildung in 14.0) hier final gesetzt, Owner-Review-pflichtig

4. **AC-4 (Normalisierung + City-Core-Behandlung):**
   **Given** die Touristen/Pendler-Verzerrung (City-Cores)
   **When** die 0–100-Normalisierung gesetzt wird
   **Then** werden City-Core-LOR (Regierungsviertel, Alexanderplatz, Ku'damm, Tiergarten Süd) geflaggt oder gekappt (Entscheidung aus 14.6 dokumentiert), damit die Skala nicht von Einwohner-Nenner-Artefakten dominiert wird

5. **AC-5 (Stigma-Familie + Slug + Label):**
   **Given** ADR-019 + Story-1.31-Choropleth-Familien
   **When** ich `KiezScoreLayerSlug` (pipeline.ts Z.53–60) + Slug-Map (Z.62–68) um `kriminalitaet → kiez-score-kriminalitaet`, `DIMENSION_LABELS_DE` (kiez-score-display.ts Z.9–15) um neutrale Bezeichnung erweitere
   **Then** ist die Choropleth-Familie **Strukturell-Indigo** (nicht Gut-Grün), Label „Erfasste Kriminalität (Häufigkeitszahl)" o. ä., kein „besser"-Pfeil

6. **AC-6 (TDD):**
   **Given** ADR-012
   **When** compute-score/dimension-config-Tests laufen
   **Then** spiegeln Tests: erweitertes Set, `COMPOSITE_DIMENSIONS` enthält Kriminalität NICHT, `overall` unverändert vom Kriminalitäts-Wert, Normalisierungs-Kurve + City-Core-Behandlung getestet
   **And** `pnpm test` 100% grün

## Tasks / Subtasks

- [x] **Task 1: Typ-Union, Gewicht 0, Composite-Ausschluss** (AC: #1, #2)
  - [x] 1.1 (RED) `compute-score.test.ts`: Kiez mit Kriminalitäts-Wert X hat dasselbe `overall` wie ohne (Composite = Mittel der fünf) — beide Aufrufer
  - [x] 1.2 (RED) `dimension-config.test.ts`: `COMPOSITE_DIMENSIONS` enthält `kriminalitaet` NICHT (statt separater types.test.ts in bestehende Suite integriert)
  - [x] 1.3 (GREEN) `types.ts`: Union + `KIEZ_SCORE_DIMENSIONS` + `DIMENSION_WEIGHTS.kriminalitaet = 0`, `COMPOSITE_DIMENSIONS` unverändert
- [x] **Task 2: KRIMINALITAET_CONFIG** (AC: #3, #4)
  - [x] 2.1 (RED) `dimension-config.test.ts`: Config in `DIMENSION_CONFIGS`, Single-Term, liest Precomputed-Index
  - [x] 2.2 (GREEN) `dimension-config.ts`: `KRIMINALITAET_CONFIG` (neue `numeric`-Normalize, keine Invertierung), City-Core-Cap via `maxAt`
- [x] **Task 3: Slug-Mapping + Label + Stigma-Familie** (AC: #5)
  - [x] 3.1 `pipeline.ts`: `KiezScoreLayerSlug` + `kiez-score-kriminalitaet`, Slug-Map + `kriminalitaet`
  - [x] 3.2 `kiez-score-display.ts`: `DIMENSION_LABELS_DE` + neutrale Bezeichnung; Choropleth-Familie = Strukturell-Indigo in `choropleth-family.ts` registriert (Surfacing 14.4)
- [x] **Task 4: Abschluss** (AC: #6)
  - [x] 4.1 `pnpm test` grün. `pnpm check`: 0 Errors (erwartete Konsumenten-Errors blieben aus — Frontend-Records sind `Record<string>`, nicht exhaustiv auf der Union; Surfacing folgt 14.4)

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- **`types.ts`**: `KiezScoreDimension` Z.1–7 (inkl. `'kultur'`), `KIEZ_SCORE_DIMENSIONS` Z.9–15, **`COMPOSITE_DIMENSIONS` Z.25** (die fünf), `DimensionConfig` Z.95, `poi-density` mit `scale?` Z.82–86, `DIMENSION_WEIGHTS` Z.121+ (`kultur: 0`).
- **`compute-score.ts`**: `import { COMPOSITE_DIMENSIONS }` Z.15. `computeOverallScore` Z.307–309 filtert bereits `d.value !== null && COMPOSITE_DIMENSIONS.includes(d.dimension)`. `computeKiezScore` Z.280.
- **`dimension-config.ts`**: `KULTUR_CONFIG` Z.185, `DIMENSION_CONFIGS` Z.231 (inkl. KULTUR_CONFIG Z.237).
- **`pipeline.ts`**: `KiezScoreLayerSlug` Z.53–60 (inkl. `kiez-score-kultur`), Slug-Map Z.62–68.
- **`kiez-score-display.ts`**: `DIMENSION_LABELS_DE` Z.9–15 (inkl. `kultur: 'Kultur'`).

### Option C ist schon gebaut

Anders als bei 13.1 muss hier KEIN Composite-Filter erfunden werden. `COMPOSITE_DIMENSIONS` + `computeOverallScore`-Filter existieren. Kriminalität einfach NICHT in die Whitelist eintragen → automatisch raus aus dem Gesamt-Score. Das ist der ganze Trick.

### Stigma-Design (Unterschied zu Kultur)

Kultur = Gut-Grün (bewohner-positiv). Kriminalität = **Strukturell-Indigo** (wie Soziale Lage / Bodenrichtwerte, Story 1.31 / ADR-015). Der gespeicherte Wert ist „mehr Kriminalität = höherer Index" (Magnitude), NICHT invertiert zu einer „Sicherheits"-Gut-Wertung. Begründung: ADR-019, Redlining-Schutz. Vorbild-Texte: `layer-explain.ts` Z.50–53 (MSS Soziale Lage), `aggregate-renderer.ts` Z.113–116.

### Was nicht brechen darf

- `COMPOSITE_DIMENSIONS` unverändert → Gesamt-Score bit-identisch (zentraler Test, Task 1.1).
- Die fünf Composite-Dimensionen + Kultur: kein inhaltliches Anfassen.

## References

- `scripts/lib/kiez-score/types.ts` (Z.1–25, 82–86, 121+)
- `scripts/lib/kiez-score/compute-score.ts` (Z.15, 280, 307–309)
- `scripts/lib/kiez-score/dimension-config.ts` (KULTUR_CONFIG Z.185, DIMENSION_CONFIGS Z.231)
- `scripts/lib/kiez-score/pipeline.ts` (Z.53–68)
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` (Z.9–15)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (Z.50–53, MSS-Stigma-Vorbild)
- `docs/adr/ADR-019-kriminalitaet-score-dimension.md`, `ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/13-1-kultur-dimensions-foundation.md` (Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`. TDD-first (ADR-012).

### Completion Notes List

- **Option C wiederverwendet:** Kriminalität zur `KiezScoreDimension`-Union + `KIEZ_SCORE_DIMENSIONS` ergänzt, `DIMENSION_WEIGHTS.kriminalitaet = 0`. `COMPOSITE_DIMENSIONS` **unverändert** → `computeOverallScore` (Filter auf die Whitelist) ignoriert Kriminalität automatisch. Kein neuer Filter, kein Rebalance.
- **Composite bit-stabil (AC-2) für beide Aufrufer:** `computeKiezScore` und `aggregateScoresToRegion` rufen beide `computeOverallScore`; der Region-Aggregator iteriert `KIEZ_SCORE_DIMENSIONS` dynamisch → Kriminalität wird pro Dimension aggregiert, fließt aber nicht in `overall`. Test: `overall` identisch mit/ohne Kriminalitäts-Wert (5/95/absent → alle 60).
- **Neue Normalize-Strategie `numeric`** (Magnitude, NICHT invertiert): `<= minAt → 0`, `>= maxAt → 100`, höher = höher. Gegenstück zu `numeric-inverted`. Stigma-Schutz: kein Sicherheitsmaß (ADR-019).
- **KRIMINALITAET_CONFIG** Single-Precomputed-Term: liest `index` aus dem 14.0-Aggregat (`numeric`, weight 1.0). Normalisierung `minAt=300`/`maxAt=1750` (≈p95 der BR-Verteilung 2023–2025) → **City-Core-Kappung**: Regierungsviertel (≈3120), Tiergarten Süd (≈2572), Alexanderplatz (≈2123) klemmen auf 100, Skala spreizt über den Bulk. Vorläufig, Owner-Review + 14.6-Spike-pflichtig (Kommentar im Code).
- **Delikt-Gewichte:** bleiben gleichgewichtet (5×0.2, aus 14.0 `DEFAULT_DELIKT_WEIGHTS`), Owner-Review-Flag. Keine Methodik-Vorgabe für asymmetrische Gewichtung; finale Kalibrierung mit 14.6.
- **Stigma-Familie (AC-5):** Slug `kiez-score-kriminalitaet` (pipeline.ts), neutrales Label „Erfasste Kriminalität (Häufigkeitszahl)" (kiez-score-display.ts), Choropleth-Familie **`strukturell` (Indigo)** in `choropleth-family.ts` registriert (NICHT `gut`/Grün wie Kultur) + `manual-quartile`. Visuelles Surfacing (Map/Inspector) folgt 14.4.
- **`pnpm check` 0 Errors:** Die in Task 4.1 antizipierten Konsumenten-Compile-Errors blieben aus — die Frontend-Lookups sind `Record<string, …>`, nicht exhaustiv auf `KiezScoreDimension`. Kriminalität wird mangels Verdrahtung (14.3) + Surfacing (14.4) noch nirgends gerendert.
- **Verifikation:** `pnpm check` 0 Errors / 6290 Files, Unit-Suite **2829/2829 grün** (neue Tests: normalizeNumeric, KRIMINALITAET_CONFIG, Composite-Stabilität Kriminalität; aktualisiert: 6→7-Dimensions-Counts in 4 Test-Files).

### File List

**Geändert:**
- `scripts/lib/kiez-score/types.ts` (Union + KIEZ_SCORE_DIMENSIONS + DIMENSION_WEIGHTS.kriminalitaet=0 + NormalizationStrategy `numeric`)
- `scripts/lib/kiez-score/normalize.ts` (+ `normalizeNumeric`) + `normalize.test.ts`
- `scripts/lib/kiez-score/compute-score.ts` (case `numeric`) + `compute-score.test.ts`
- `scripts/lib/kiez-score/dimension-config.ts` (KRIMINALITAET_CONFIG + Registrierung) + `dimension-config.test.ts`
- `scripts/lib/kiez-score/pipeline.ts` (KiezScoreLayerSlug + Slug-Map)
- `scripts/lib/kiez-score/aggregate-to-larger-region.test.ts` + `pipeline.test.ts` (Dimensions-Count 6→7)
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` (DIMENSION_LABELS_DE)
- `src/lib/components/atlas/internal/choropleth-family.ts` (Strukturell-Indigo + Klassifikation)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-1 → review)

### Debug Log References

- BR-Index-Verteilung 2023–2025 (n=143): min 315, p10 560, p50 951, p90 1483, p95 1748, p98 2255, max 3120. Top-Ausreißer = City-Cores (Mitte/Tiergarten). maxAt=1750 als Kappungsgrenze gewählt.
- Voll-Coverage-Test + emptyInput-Tests um `kriminalitaet`-Hit/Missing erweitert. DB-lazy-Test (`db/index.test.ts`) zeigte unter Full-Suite-Last einen 5s-Timeout, grün isoliert → bekanntes Flaky-Muster, kein Bezug zur Änderung.

## Change Log

- 2026-06-09: Story 14.1 erstellt (ready-for-dev). Option-C-Mechanik wiederverwendet (COMPOSITE_DIMENSIONS existiert), Stigma-Indigo statt Gut-Grün, Single-Precomputed-Term statt poi-density.
- 2026-06-10: Story 14.1 implementiert (→ review). Union + Gewicht 0 + KRIMINALITAET_CONFIG (`numeric`-Normalize, City-Core-Cap maxAt=1750) + Strukturell-Indigo-Familie. Composite bit-stabil (beide Aufrufer). check 0 Errors, 2829/2829 grün.
