# Story 8.2a: Layer-Aggregat-Pipeline (Build-Time-Pre-Aggregation)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Solo-Maintainer,
I want eine Build-Time-Stage die pro Inspector-Layer und Level (Kiez/Bezirk/Berlin) die Aggregate vorberechnet und persistiert,
so that der Inspector zur Laufzeit fertige Aggregat-Werte liest statt teure Spatial-Queries über große GeoJSONs zu fahren.

**Hintergrund (Lücken-Analyse 2026-05-20):** Nur Kiez-Score (ADR-013-JSON) und Wahldaten (DB-Tabellen) sind heute vor-aggregiert. Lärm, Luft, Wohnlage, Bioklima, MSS, Klima-Coverage etc. existieren nur als Polygon-GeoJSON ohne Pre-Aggregat. Ohne diese Stage hätte Story 8.2b keine Input-Daten.

## Acceptance Criteria

1. **Given** ADR-014-Aggregat-Strategie pro Layer (numeric-median, ordinal-distribution, coverage-share, area-share), **When** ich eine Build-Time-Stage (`pnpm data:layer-aggregate`) implementiere die pro aggregierbarem Layer × {kiez, bezirk, berlin} die Aggregate aus den Source-GeoJSONs rechnet, **Then** Output liegt als static JSON unter `static/layer-aggregates/` vor, deterministisch reproduzierbar, mit Missing-Data-Threshold 50% (ADR-013-Regel).
2. **Given** Point-Layer (Kitas, ÖPNV-Stops, Stolpersteine), **When** die Pipeline läuft, **Then** Point-Layer sind ausgenommen (Runtime-Count/Distanz im Polygon ist günstig genug), nur Polygon-Aggregate werden vorberechnet.
3. **Given** not-aggregatable Layer (Bodenrichtwert), **When** die Pipeline läuft, **Then** kein Aggregat wird erzeugt, Layer ist als `not-aggregatable` markiert (ADR-014).
4. **Given** das Output-Format aus ADR-014 Abschnitt 8, **When** die JSON geschrieben wird, **Then** Schema ist `{ [layerSlug]: { kiez: { [kiezSlug]: Aggregat }, bezirk: { [bezirkSlug]: Aggregat }, berlin: Aggregat } }` mit typ-abhängigem `Aggregat` + `schemaVersion` + `generatedAt`, analog `static/kiez-scores/kiez-scores.json`.
5. **Given** Re-Runs, **When** die Pipeline zweimal über identische Source-GeoJSONs läuft, **Then** Output ist byte-deterministisch (stabile Key-Sortierung, gerundete Werte), damit Diffs nur echte Daten-Änderungen zeigen.

## Tasks / Subtasks

- [x] Task 1: Aggregat-Typen + Layer-Strategie-Registry (AC: #1, #2, #3)
  - [x] Strategie-Map `scripts/lib/layer-aggregate/strategy.ts`: pro Layer-Slug der Aggregat-Typ aus ADR-014 Abschnitt 3 (`numeric-median` | `ordinal-distribution` | `coverage-share` | `area-share` | `point-density` | `not-aggregatable`). Welcher Property-Key je Layer aggregiert wird (z.B. Lärm-Klasse, NO2-Wert, Wohnlage-Stufe) hier festhalten, reuse vorhandener Wert-Extraktion aus `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts`/`value-severity-mapping.ts` wo sinnvoll.
  - [x] Point-Layer (`point-density`) + `not-aggregatable` werden NICHT vorberechnet (AC #2/#3), erscheinen aber als markierter Eintrag damit 8.2b/8.5 die Strategie kennen.
- [x] Task 2: Aggregat-Berechnung pro Typ (AC: #1, #5)
  - [x] `scripts/lib/layer-aggregate/aggregate-numeric-median.ts`: Median + Min/Max-Spanne der Member-Werte. (Member = Source-Features die im Ziel-Polygon liegen.)
  - [x] `aggregate-ordinal-distribution.ts`: Klassen-Histogramm (share je Klasse) + dominante Klasse.
  - [x] `aggregate-coverage-share.ts`: Anteil der Ziel-Polygon-Fläche mit Treffer (0-100%), flächen-basiert (turf area/intersect).
  - [x] `aggregate-area-share.ts`: Anteil Grün-/Parkfläche an Polygon-Fläche.
  - [x] Missing-Data: unter 50% Member-Coverage → `value: null` + `coverage:'n/m-below-threshold'` (ADR-013-Regel, exakt wie `scripts/lib/kiez-score/aggregate-to-larger-region.ts` `COVERAGE_THRESHOLD`). Diese Schwelle-Logik aus dem Kiez-Score-Aggregat wiederverwenden, nicht neu erfinden.
  - [x] Determinismus: stabile Schlüssel-Sortierung, Werte runden (`Math.round(x*10)/10`), keine Map-Iterations-Reihenfolge-Abhängigkeit (AC #5).
- [x] Task 3: Spatial-Member-Zuordnung (AC: #1)
  - [x] Pro Ziel-Polygon (Kiez 143 / Bezirk 12 / Berlin) die Source-Features zuordnen. Polygon-Source-Features via Intersect/Repräsentativ-Punkt, reuse Geo-Helfer (`@turf` bbox/intersect/area, RBush `scripts`-seitig analog `src/lib/data/internal/spatial-index.ts`).
  - [x] Berlin-Level = Aggregat über alle Member (gesamt).
  - [x] Boundaries: LOR-Bezirksregion (`static/layers/lor-bezirksregion.*`, `BZR_ID`/`BZR_NAME`), Bezirke (`static/layers/bezirke.*`, `Schluessel_gesamt`/`Gemeinde_name`). Slugs aus MANIFEST.json. Planungsraum (542) bleibt interne Quelle falls Zwischen-Aggregation nötig (ADR-014 Abschnitt 1).
- [x] Task 4: Pipeline-Orchestrator + Output (AC: #1, #4, #5)
  - [x] `scripts/build-layer-aggregates.ts` analog `scripts/aggregate-scores.ts`/`scripts/build-kiez-scores.ts`: MANIFEST lesen, aggregierbare Layer iterieren, pro Layer × Level rechnen, JSON nach `static/layer-aggregates/layer-aggregates.json` schreiben.
  - [x] JSON-Schema (ADR-014 Abschnitt 8): top-level `schemaVersion`, `generatedAt`, `aggregates: { [layerSlug]: { kiez: {...}, bezirk: {...}, berlin: Aggregat } }`. `Aggregat` typ-abhängig (Median+Spanne / Klassen-Verteilung / Coverage-% / Area-%) + `coverage`-Feld.
  - [x] TypeScript-Typ für das Schema in `src/lib/data/layer-aggregates-types.ts` (von 8.2b + 8.5 importierbar, Single-Source-of-Truth für die Shape).
  - [x] package.json Script `data:layer-aggregate` ergänzen + in prebuild-Kette einreihen (nach `data:aggregate`, Reihenfolge wie `data:aggregate-scores`).
- [x] Task 5: Tests (TDD, AC-Mapping)
  - [x] Pure-Function-Tests pro Aggregat-Typ (median, ordinal-distribution, coverage-share, area-share): bekannte Eingabe → erwartetes Aggregat, Edge-Cases (leere Member, exakt-50%-Schwelle, alle-null). Coverage ≥90% (Daten-Transform kritisch, ADR-012).
  - [x] Determinismus-Test: zweimal rechnen → identisches JSON (AC #5).
  - [x] Threshold-Test: <50% Coverage → null + below-threshold-Marker.
  - [x] not-aggregatable/Point-Layer: kein Aggregat erzeugt, korrekt markiert.
  - [x] Daten-Load NICHT in Komponenten-Tests (Scripts laufen in Node, normale Vitest-Unit-Tests; Memory `feedback_browser_test_fetch_spy` betrifft *.svelte.test.ts).

## Dev Notes

### Scope + Sequencing

8.2a ist eine reine Build-Time-Daten-Pipeline. Kein UI. Hard-Block für 8.2b UND 8.5 (beide lesen die Pre-Aggregate, ADR-014 Story-Mapping + sprint-status). Output ist static JSON, NICHT Postgres (ADR-014 Abschnitt 8, explizite Entscheidung).

### Vorlage: Kiez-Score-Pipeline (ADR-013)

Diese Story baut analog zu:
- `scripts/build-kiez-scores.ts` (Source-of-Truth-Generierung aus Layer-Hits, liest MANIFEST.json + GeoJSON aus `static/layers/`).
- `scripts/aggregate-scores.ts` (LOR-Hierarchie 542→143→12 Aggregation).
- `scripts/lib/kiez-score/aggregate-to-larger-region.ts` (flächengewichtete Aggregation + 50%-`COVERAGE_THRESHOLD` + 1-Dezimal-Rundung). Diese Threshold-/Rundungs-Logik EXAKT wiederverwenden, nicht parallel implementieren (Memory `project_mss_kiez_score_input` + ADR-013-Single-Source-Disziplin).
- Output-Vorbild `static/kiez-scores/kiez-scores.json` (`schemaVersion`, `generatedAt`, Slug-gekeyt).

Unterschied: 8.2a aggregiert ALLE aggregierbaren Inspector-Layer, nicht nur die 5 Kiez-Score-Dimensionen. Aggregat-Typ ist layer-abhängig (nicht nur numeric-median).

### Aggregierbare Layer (ADR-014 Abschnitt 3) + Quelle

Aus `scripts/lib/sources.ts` + MANIFEST. Polygon-Layer mit Aggregat:
- `laerm-2023` → ordinal-distribution
- `luft-2023` → numeric-median
- `bioklima-2023` / `klima-pet-*` → numeric-median
- `klima-kaltlufteinwirkbereich-*`, `klima-leitbahnkorridor-*` → coverage-share
- `gruenversorgung-2023` → ordinal-distribution
- `gruenanlagen`, `spielplaetze` → area-share
- `umweltgerechtigkeit-2023` → ordinal-distribution (Stigma-Gate)
- `wohnlagen-2024` (Mietspiegel) → ordinal-distribution (categorical-neutral)
- `mss-gesamtindex-2025` → ordinal-distribution (Stigma-Lock)
- `milieuschutz-*` → coverage-share
- `denkmal-2024` → coverage-share

NICHT aggregieren (AC #2/#3): `bodenrichtwerte` (not-aggregatable), Point-Layer `kitas-2024`/`schulen-2024`/`krankenhaeuser-*`/`spielplaetze`(POI-Aspekt)/ÖPNV-Stops/`stolpersteine` (point-density runtime), LineString-Layer (`radverkehrsnetz`, `fahrradstrassen`, ÖPNV-Netze).

Exakte Slug-Liste aus MANIFEST.json zur Build-Zeit ableiten + gegen die Strategie-Map (Task 1) gaten, NICHT hardcoden was nicht existiert.

### Aggregat-Methodik-Disziplin

- BRW-Bezirks-Median ist methodisch verboten (ADR-014 Abschnitt 3, `not-aggregatable`). Pipeline darf für solche Layer KEIN Aggregat erzeugen.
- Median, nicht Mittelwert, für numeric-Layer (robuster, ADR-014 Abschnitt 2).
- coverage-share ist flächen-basiert (% Polygon-Fläche mit Treffer), nicht feature-count.

### Determinismus (AC #5)

Build-Output muss reproduzierbar sein (Git-Diff-Sauberkeit). Stabile JSON-Key-Sortierung, gerundete Werte, keine Date.now()-Drift außer `generatedAt`-Feld. Determinismus-Test ist Pflicht.

### Project Structure Notes

- Neue Files: `scripts/build-layer-aggregates.ts`, `scripts/lib/layer-aggregate/{strategy,aggregate-numeric-median,aggregate-ordinal-distribution,aggregate-coverage-share,aggregate-area-share}.ts`, `src/lib/data/layer-aggregates-types.ts`, Output `static/layer-aggregates/layer-aggregates.json`, Tests.
- package.json: `data:layer-aggregate` Script + prebuild-Einreihung.
- Files <500 LOC: pro Aggregat-Typ eine Datei.
- Großes GeoJSON: Speicher beachten, streamen/RBush wo nötig (manche Layer >1MB, vgl. MSS 1.26 MB).

### TDD (ADR-012)

Daten-Transform = Test-First-Pflicht, Coverage ≥90% kritischer Pfad. Pro Aggregat-Typ Red-then-Green-History im Commit. `pnpm test` grün + `pnpm check` 0 Errors vor review.

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#2-aggregat-typen]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#3-matrix-pro-layer-familie]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#7-missing-data-threshold]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#8-aggregat-output-format-static-json]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.2a]
- [Source: scripts/aggregate-scores.ts + scripts/build-kiez-scores.ts (Pipeline-Vorlage)]
- [Source: scripts/lib/kiez-score/aggregate-to-larger-region.ts (Threshold + Flächengewicht)]
- [Source: scripts/lib/sources.ts + static/layers/MANIFEST.json (Layer-Enumeration)]
- [Source: static/kiez-scores/kiez-scores.json (Output-Schema-Vorbild, ADR-013)]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD dev-story)

### Debug Log References

- Pipeline real gelaufen: 15 Layer aggregiert, 34 geskippt (Point/LineString/not-aggregatable), 138.9s, Output 306 KB. Sanity: laerm 143 Kiez + 12 Bezirk, klima-pet median 36.5 (min 24.4/max 45.2, 16204 Member), denkmal coverage 9.2%, gruenanlagen area 6.6%.
- `@turf/intersect@7.3.5` neu installiert (User-Freigabe). v7-API: `intersect(featureCollection([a,b]))`, nicht `intersect(a,b)`.

### Completion Notes List

- **Daten-getriebene Abweichung von der Story-Strategie-Annahme:** `luft-2023` + `bioklima-2023` liefern real eine ordinale `kategorie` (hoch/mittel/gering), KEINEN numerischen Wert → ordinal-distribution statt numeric-median. Einziger echter numeric-median-Layer ist `klima-pet-2022` (`pet14h`). In `strategy.ts` dokumentiert.
- **Member-Modus zweigleisig:** PLR-keyed Layer (laerm/luft/bioklima/gruenversorgung/umweltgerechtigkeit/wohnlagen/mss, je 542 Features mit `plr_id`) via LOR-Hierarchie-Prefix (reuse `buildLorHierarchy`), KEIN Spatial-Intersect. Freie Geometrie (klima-pet/Kaltluft/Leitbahn/Milieuschutz/Denkmal/Grünanlagen/Spielplätze) via Repräsentativ-Punkt bzw. Flächen-Intersect (RBush-bbox-Prefilter).
- **Threshold/Rundung exakt reused:** `COVERAGE_THRESHOLD` (0.5) + Marker-Format + 1-Dezimal-Rundung aus `aggregate-to-larger-region.ts` importiert, nicht parallel implementiert.
- **Berlin-Coverage ohne Extra-Polygon:** Kiez-Tiles (143 BZR) partitionieren Berlin → berlinHitArea = Summe der Kiez-Hits. Determinismus via sortierte Slug-Keys + sortierte Layer-Reihenfolge.
- **Single-Source-Schema:** `src/lib/data/layer-aggregates-types.ts` ist die Shape-Wahrheit (von 8.2b/8.5 importierbar), `scripts/lib/layer-aggregate/types.ts` re-exportiert sie.
- **Slug-Konsistenz-Hinweis für 8.2b:** Kiez-Slugs hier nutzen die disambiguierte Hierarchie-Form (z.B. doppelte BZR-Namen `heerstrasse-spandau`), identisch zum Kiez-Score. Story 8.1 `resolve-spatial-level.ts` liefert dagegen `normalizeSlug(BZR_NAME)` OHNE Disambiguierung → für die ~2 Duplikat-Namen droht ein Key-Mismatch beim Lookup in 8.2b. Dort angleichen (resolve-spatial-level um Bezirk-Suffix erweitern), NICHT in 8.2a.
- 34 neue Tests grün (strategy 8 / aggregate 17 / member-assignment 5 / compute 4). `pnpm check` 0 neue Errors (2 pre-existing i18n-Lock).

### File List

Neu:

- `scripts/lib/layer-aggregate/strategy.ts`
- `scripts/lib/layer-aggregate/strategy.test.ts`
- `scripts/lib/layer-aggregate/types.ts`
- `scripts/lib/layer-aggregate/aggregate-numeric-median.ts`
- `scripts/lib/layer-aggregate/aggregate-ordinal-distribution.ts`
- `scripts/lib/layer-aggregate/aggregate-coverage-share.ts`
- `scripts/lib/layer-aggregate/aggregate-area-share.ts`
- `scripts/lib/layer-aggregate/aggregate.test.ts`
- `scripts/lib/layer-aggregate/member-assignment.ts`
- `scripts/lib/layer-aggregate/member-assignment.test.ts`
- `scripts/lib/layer-aggregate/compute.ts`
- `scripts/lib/layer-aggregate/compute.test.ts`
- `scripts/build-layer-aggregates.ts`
- `src/lib/data/layer-aggregates-types.ts`
- `static/layer-aggregates/layer-aggregates.json` (Build-Output, 15 Layer)

Geändert:

- `package.json` (`data:layer-aggregate` Script + prebuild-Einreihung nach `data:aggregate-scores`)

## Change Log

- 2026-05-20: Story 8.2a implementiert (Build-Time-Layer-Aggregat-Pipeline): Strategie-Registry + 4 Pure-Aggregat-Funktionen (numeric-median/ordinal-distribution/coverage-share/area-share) + zweigleisige Member-Zuordnung (PLR-Hierarchie / Spatial-Intersect) + Orchestrator + Single-Source-Schema-Typ. Output `static/layer-aggregates/layer-aggregates.json` (15 Layer). 34 Tests, deterministisch. @turf/intersect neu. Status → review.
