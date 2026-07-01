# Story 14.0: Kriminalitätsatlas-Layer-Foundation (XLSX-Fetch + Parse + BR→PLR-Spiegelung)

Status: review

> **Anker:** ADR-012 (TDD), ADR-019 (Kriminalität Option C + Stigma), `docs/kriminalitaetsdaten-methodik.md`. Strukturell analog Story 13.0 (Layer-Foundation), aber **kein Overpass/poi-density**, sondern XLSX-Parse + Aggregat-Spiegelung.
> **Owner-Decision 2026-06-09 (ADR-019):** Kriminalität ist BR-nativ (138/143 Bezirksregionen). Der Wert wird auf alle enthaltenen Planungsräume gespiegelt (jeder PLR erbt den BR-Wert, konstant innerhalb der BR), damit die flächen-gewichtete Aggregation (ADR-013) konsistent bleibt.
> **Hard-Block:** Fundament für 14.1–14.3. Voraussetzung: Epic 13 gelandet (6-Dim-Set + `COMPOSITE_DIMENSIONS` existieren).

## Story

As a Solo-Maintainer,
I want den Kriminalitätsatlas als deterministischen Build-Aggregat-Layer (XLSX-Parse + 3-Jahres-Mittel der wohn-relevanten Delikte + BR→PLR-Spiegelung),
so that die neue Kriminalitäts-Dimension einen fertigen Index-Wert pro Planungsraum lesen kann.

## Kontext: Warum dieser Change

Anders als Kultur (OSM-Punkte, poi-density-Radius-Join) liefert der Kriminalitätsatlas einen **vorberechneten Wert pro Bezirksregion** (HZ pro 100.000 Einwohner). Es gibt keinen Radius-Join: der Wert existiert nur auf BR-Ebene und muss auf die 542 Planungsräume gespiegelt werden. Diese Story erzeugt das Build-Aggregat (analog dem Lärm-dB-per-LOR-Aggregat aus Story 10.6b, das ebenfalls einen vorberechneten Numerik-Wert statt eines POI-Joins liefert).

**Datenquelle:** `https://www.kriminalitaetsatlas.berlin.de/K-Atlas/bezirke/Fallzahlen&HZ 2016-2025.xlsx`, Lizenz dl-de-by-2.0, Herausgeber Polizei Berlin. 22 Sheets: `Titel`, `Inhaltsverzeichnis`, `Fallzahlen_2016..2025`, `HZ_2016..2025`. HZ-Sheets: Header in Zeile 3 (`LOR-Schlüssel (Bezirksregion)`, `Bezeichnung`, dann Delikt-Spalten + `Kieztaten`), Datenzeilen je LOR-Schlüssel (6-stellig BZR, plus Bezirks-Zeilen `0X0000` + `999999` Berlin gesamt + `999900` nicht zuzuordnen).

## Acceptance Criteria

1. **AC-1 (Fetch + Parse):**
   **Given** die offene XLSX (HZ-Sheets der letzten drei verfügbaren Jahre)
   **When** ein Fetch+Parse-Schritt die wohn-relevanten Delikt-Spalten je LOR-Schlüssel extrahiert (Default-Set: `Kieztaten`, `Wohnraumeinbruch`, `Sachbeschädigung -insgesamt-`, `Straßenraub/Handtaschenraub`, `Fahrraddiebstahl`)
   **Then** entsteht ein deterministisches Build-Aggregat pro Bezirksregion mit MANIFEST-Eintrag (Quelle, Stand, SHA, Lizenz dl-de-by-2.0, „Polizei Berlin")
   **And** `-`-Zellen werden als `null` geparst, `999999`/`999900` separat behandelt (nicht als BR)

2. **AC-2 (3-Jahres-Mittel + Index):**
   **Given** drei HZ-Jahrgänge pro BR + Delikt
   **When** das 3-Jahres-Mittel je Delikt gebildet und über die Delikt-Gewichte (aus 14.1) zu einem Kriminalitäts-Index zusammengefasst wird
   **Then** liegt pro BR ein numerischer Index vor, Volatilität kleiner Fallzahlen durch das Mittel gedämpft, Berechnung getestet (inkl. null-Delikt-Handling)

3. **AC-3 (BR→PLR-Spiegelung):**
   **Given** die LOR-Hierarchie (`BZR_ID = PLR_ID[:6]`, verifiziert in Story 2.9a, 0 Mismatches auf ODIS-2021)
   **When** der BR-Index auf die enthaltenen Planungsräume gespiegelt wird
   **Then** erbt jeder PLR den Index seiner Bezirksregion (konstant innerhalb der BR), Output-Form kompatibel mit dem Score-Input-Reader (ein vorberechneter Wert je PLR-LOR)
   **And** PLR ohne zuordenbare BR → `null` (Missing-Data, kein Crash)

4. **AC-4 (TDD):**
   **Given** ADR-012
   **When** Parse-/Mittel-/Spiegelungs-Tests laufen
   **Then** sind Spalten-Auswahl, 3-Jahres-Mittel, `-`/Missing-Handling, BR→PLR-Spiegelung und City-Core-Sonderzeilen getestet, kein Crash bei leerem/null-Set
   **And** `pnpm test` 100% grün

5. **AC-5 (Lizenz):**
   **Given** Lizenz-Disziplin
   **When** der Layer publiziert wird
   **Then** dl-de-by-2.0-Attribution „Polizei Berlin" in MANIFEST + `docs/kriminalitaetsdaten-methodik.md` verlinkt

## Tasks / Subtasks

- [x] **Task 1: XLSX-Fetch + Parse** (AC: #1, #5)
  - [x] 1.1 (RED) Parse-Test gegen ein Sheet-Fixture: Header-Erkennung, Delikt-Spalten-Mapping, `-`→null, `999999`/`999900`-Ausschluss
  - [x] 1.2 (GREEN) Fetch+Parse-Script (XLSX-Reader via vorhandenem `xlsx`-Dependency), HZ-Sheets letzte 3 Jahre, Inline-Provenance mit SHA + Lizenz (analog `laerm-db-lor.json`, kein MANIFEST.json-Eintrag für Daten-Aggregate)
- [x] **Task 2: 3-Jahres-Mittel + Index-Bildung** (AC: #2)
  - [x] 2.1 (RED) Test: Mittel über 3 Jahrgänge, null-Delikt-Skip, Gewichts-Kombination
  - [x] 2.2 (GREEN) Aggregations-Funktion (Delikt-Gewichte in 14.1 final; hier Schnittstelle + gleichgewichteter Default 5×0.2)
- [x] **Task 3: BR→PLR-Spiegelung** (AC: #3, #4)
  - [x] 3.1 (RED) Test: jeder PLR erbt BR-Index via `PLR_ID[:6]`, PLR ohne BR → null
  - [x] 3.2 (GREEN) Spiegelungs-Logik, Output-JSON pro PLR-LOR, kompatibel mit Score-Input
- [x] **Task 4: Abschluss** (AC: #4, #5)
  - [x] 4.1 `pnpm test` grün, Provenance + Methodik-Doku-Verweis gesetzt

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- **Vorbild Numerik-Aggregat:** Story 10.6b (Lärm-dB-per-LOR) liefert ebenfalls einen vorberechneten Numerik-Wert pro LOR statt eines POI-Joins → Pattern für ein BR-Aggregat übernehmen. Siehe `docs/spikes/laerm-db-upgrade-2026.md`.
- **LOR-Hierarchie:** `PLR_ID[:6] = BZR_ID`, `PLR_ID[:2] = BEZ-Code` (Story 2.9a, `scoring-methodology.md` Abschnitt „LOR-Hierarchie"). 542 PLR, 143 BR.
- **Datenstruktur XLSX:** HZ-Sheets Header Zeile 3; Spalten u. a. `Kieztaten`, `Wohnraumeinbruch`, `Sachbeschädigung -insgesamt-`, `Straßenraub/Handtaschenraub`, `Fahrraddiebstahl`. Werte float (HZ pro 100k). `-` = unterdrückt.
- **Methodik-Caveats** (in `docs/kriminalitaetsdaten-methodik.md`): Touristen/Pendler nicht im Nenner (City-Core-Verzerrung), Tatortprinzip (Taschendiebstahl ausgeschlossen), Dunkelfeld, kleine Fallzahlen.

### Design-Entscheidung: Index, nicht Roh-HZ

Aus den gewählten Delikten wird EIN Index pro BR. Roh-HZ pro Delikt bleibt im Aggregat für Transparenz/Inspector erhalten, aber die Dimension nutzt den kombinierten Index. Polarität: höher = mehr Kriminalität (KEINE Invertierung zu „Sicherheit", Stigma-Schutz ADR-019 — der Wert ist Strukturell-Magnitude, kein Gut-Maß). Normalisierung 0–100 in 14.1.

### Was nicht brechen darf

- Kein Eingriff in bestehende Layer/Configs. Reines Hinzufügen eines Build-Aggregats.
- City-Core-Behandlung (flaggen/kappen) wird in 14.1/14.6 entschieden; hier nur Roh-Aggregat + Spiegelung.

## References

- `docs/kriminalitaetsdaten-methodik.md` (Quelle, Felder, Caveats)
- `docs/adr/ADR-019-kriminalitaet-score-dimension.md`
- `docs/spikes/laerm-db-upgrade-2026.md` (Numerik-Aggregat-Pattern, Story 10.6b)
- `scripts/lib/kiez-score/` (Score-Input-Reader), `scoring-methodology.md` (LOR-Hierarchie)
- `_bmad-output/implementation-artifacts/13-0-kultur-layer-foundation.md` (Layer-Foundation-Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`. TDD-first (ADR-012).

### Completion Notes List

- **3 reine Lib-Module** unter `scripts/lib/kriminalitaet/` (alle < 200 LOC):
  - `parse-xlsx.ts`: dynamische Header-Erkennung, kanonisierter Delikt-Spalten-Match (robust gegen Silbentrennung wie `Fahrrad- diebstahl`), `-`→null, BR-Filter (`isBezirksregionKey`), `latestThreeHzSheetNames`.
  - `aggregate.ts`: `threeYearMean` (null-Skip), `combineIndex` (Gewichts-Renormalisierung über vorhandene Delikte), `buildBrIndex`. `DEFAULT_DELIKT_WEIGHTS` 5×0.2 (Summe 1.0), finale Gewichte in 14.1.
  - `mirror.ts`: BR→PLR via `PLR_ID[:6]`, Index konstant innerhalb der BR, PLR ohne BR → `null`.
- **Orchestrator** `scripts/build-kriminalitaet-lor.ts` + npm-Script `data:kriminalitaet`. Fetch (allowlist + `withRetry`), SHA256 der XLSX, letzte 3 HZ-Sheets, Spiegelung auf 542 PLR via `lor-planungsraum`-GeoJSON. Inline-Provenance (Quelle/SHA/Lizenz/Jahre/Delikte+Gewichte) analog `laerm-db-lor.json`.
- **Allowlist** um `kriminalitaetsatlas.berlin.de` erweitert (+ Test).
- **Korrektur ggü. Story-Dev-Notes:** Header steht in der echten XLSX in Zeile 5 (nicht 3). Parser sucht den Header dynamisch über die erste Spalte „LOR-Schlüssel (Bezirksregion)" statt zeilenfix.
- **Live-Lauf:** 143 BR → 542 PLR, alle 542 mit Index (0 Hierarchie-Mismatches, bestätigt ADR-013/Story 2.9a). Index BR-konstant über alle PLR (verifiziert). City-Core-Verzerrung sichtbar (Regierungsviertel Index ≈ 3120 = Max gegen Median ≈ 953) → Behandlung in 14.1/14.6, hier bewusst nur Roh-Index.
- **Kein Score-Effekt:** keine Verdrahtung in `build-kiez-scores.ts`/`dimension-config.ts` (Vorverdrahtung folgt 14.1/14.3). Recompute-Diff = 0.
- **Verifikation:** `pnpm check` 0 Errors über 6290 Files, Unit-Suite **2822/2822 grün** (45 neue Tests: parse 15, aggregate 12, mirror 6, allowlist +1→12).

### File List

**Neu:**
- `scripts/lib/kriminalitaet/parse-xlsx.ts` (+ `.test.ts`)
- `scripts/lib/kriminalitaet/aggregate.ts` (+ `.test.ts`)
- `scripts/lib/kriminalitaet/mirror.ts` (+ `.test.ts`)
- `scripts/build-kriminalitaet-lor.ts`
- `static/data/kriminalitaet-lor.json` (Build-Output)

**Geändert:**
- `scripts/lib/allowlist.ts` (+ `kriminalitaetsatlas.berlin.de`) + `scripts/lib/allowlist.test.ts`
- `package.json` (Script `data:kriminalitaet`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-0 → review)

### Debug Log References

- XLSX-Struktur live verifiziert: 22 Sheets, HZ_2016–2025, Header idx 4 (Zeile 5), erste Datenzeile idx 5. LOR-Keys 6-stellig. Ausschluss `XX0000` (Bezirk), `XX9900` (nicht zuzuordnen), `9999XX` (Berlin).
- Default-Set 2023–2025 ohne null-Delikte (wohn-relevante Delikte flächendeckend erfasst); null-Handling per Fixture getestet.

## Change Log

- 2026-06-09: Story 14.0 erstellt (ready-for-dev). XLSX-Parse + 3-Jahres-Mittel + BR→PLR-Spiegelung, kein poi-density (BR-nativ).
- 2026-06-10: Story 14.0 implementiert (→ review). 3 Lib-Module + Orchestrator + `data:kriminalitaet`. 143 BR → 542 PLR, Index BR-konstant. Allowlist-Host ergänzt. check 0 Errors, 2822/2822 grün. Hard-Block für 14.1–14.3 erfüllt.
