# Story 2.9a: Kiez-Score + Bezirks-Score Aggregat-Berechnung

Status: in-progress

## Story

As a Solo-Maintainer und Daten-Konsument,
I want eine deterministische, dokumentierte Cross-Layer-Score-Berechnung für 12 Bezirke und 138 LOR-Bezirksregionen die in Postgres als Aggregat-Tabellen gecacht wird,
so that die Ranking-Page (Story 2.9b) und die Bezirks-/Kiez-Pages (Stories 2.3/2.4) auf einer konsistenten, methodisch transparenten Score-Quelle aufsetzen können, die mit dem bestehenden 542-Planungsraum-Kiez-Score (Story 1.28) widerspruchsfrei zusammenspielt.

## Probleme heute

1. **Daten-Hoheits-Konflikt:** Story 1.28 hat Kiez-Score bereits implementiert, aber auf **542 LOR-Planungsraum**-Ebene mit **5 Dimensionen** (Ruhe-Luft, Grün, Mobilität, Soziale-Lage, Versorgung). Source-of-Truth ist `static/kiez-scores/kiez-scores.json`. Epic 2.9a verlangt aber Score auf 138 LOR-Bezirksregion-Ebene mit anderen Cluster-Namen (Lärm, Luft, Klima, Grün, ÖPNV, Bildung). Diese Diskrepanz muss VOR Dev-Start geklärt sein (Open-Question 1).
2. Story 2.0 hat `bezirk_score` und `kiez_score`-Tabellen als leeres Schema. Konsument für die Befüllung existiert nicht ohne 2.9a.
3. Bezirks-Score existiert noch GAR NICHT. Stories 2.3 (Bezirks-Page) verweist auf `BezirkScore | null` als noch-leerer Wert.
4. Story 2.4-Variante-A verlangt Score-Aggregation pro 138er-Kiez aus enthaltenen 542er-Planungsräumen — diese Aggregations-Logik fehlt aktuell.
5. `docs/scoring-methodology.md` existiert nicht; Methodik-Sub-Page `/methodik/kiez-score` existiert via Story 1.28 als Detail-Seite, aber nicht für Bezirks-Score.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1307-1335.
- Story 1.28 (review): `static/kiez-scores/kiez-scores.json` mit 542 LOR-Planungsraum-Scores, 5 Dimensionen (`ruhe-luft`, `gruen`, `mobilitaet`, `soziale-lage`, `versorgung`), Gewichte 5×0.20. Pipeline in `scripts/lib/kiez-score/` + `scripts/build-kiez-scores.ts`. Runtime-Adapter `src/lib/data/get-kiez-score.ts`. Methodik-Page `/methodik/kiez-score`.
- Story 2.0: `bezirk_score` + `kiez_score`-Tabellen-Schema (PK: slug, composite Number + Komponenten-Spalten + `computed_at`).
- Story 2.3: bindet `bezirk_score`-Wert in Steckbrief-Tabelle ein (Wartet auf 2.9a).
- Story 2.4-Variante-A: Aggregation 542 → 138 Kieze nötig (Flächen-gewichtetes Mittel).
- Story 2.9b: Ranking-Page liest aus `bezirk_score` + `kiez_score`.
- Memory `feedback_no_lebenswert.md` (Begriffs-Disziplin), `project_kiez_score_naming.md` (Naming: Kiez-Score auf LOR, Bezirks-Score auf 12 Bezirke).
- Bestehender Code: `scripts/lib/kiez-score/{types,dimension-config,normalize,compute-score,pipeline,build-helpers,nearest-stops,output-schema}.ts`.

## Akzeptanz-Kriterien

1. **AC-1 (Strategie-Decision für Score-Architektur):**
   **Given** Story 1.28 hat Score auf 542 LOR-Planungsraum, Epic 2.9a verlangt Score auf 138 Bezirksregion + 12 Bezirk
   **When** vor Dev-Start die Strategie festgelegt wird
   **Then** je nach Open-Question 1:
   - **Variante A (Recommended — multi-level aggregiert):** 1.28-Logic bleibt Source-of-Truth auf 542 LOR-PR-Ebene. 2.9a baut Aggregations-Helper: `aggregateToLorBezirksregion(planungsraum-scores)` (Flächen-gewichtetes Mittel pro Dimension, 542→138) und `aggregateToBezirk(planungsraum-scores)` (542→12). Die 5 Dimensionen aus 1.28 bleiben (Ruhe-Luft, Grün, Mobilität, Soziale-Lage, Versorgung); Epic-Wortlaut „Lärm/Luft/Klima/ÖPNV/Bildung" wird per ADR-Update als legacy markiert (Dimensions-Konsens läuft via 1.28).
   - **Variante B (Re-Implement gegen Postgres-Aggregat):** Neue Score-Berechnung aus `bezirk_stats`/`kiez_stats` (Story 2.0) direkt für 138 BR + 12 Bezirk, parallel zum 1.28-JSON. Doppelter Datenpfad — nicht empfohlen.
   - **Variante C (Hybrid):** 1.28-Logic bleibt für 542 PR + 138 BR; Bezirks-Score (12) wird neu berechnet aus `bezirk_stats` + ADR-Aggregations-Konvention.
   - Schreibt Ergebnis in Postgres-Tabellen `bezirk_score` + `kiez_score` (Story-2.0-Schema)
   - Konflikt-Auflösung: Postgres-Tables sind Build-Time-Cache, `static/kiez-scores/kiez-scores.json` bleibt Source-of-Truth (Single-Source-Pflicht). DB-Tabellen werden aus der JSON befüllt, nicht parallel berechnet.

2. **AC-2 (Aggregations-Helper auf BR + Bezirks-Ebene):**
   **Given** Variante-A-Entscheidung aus AC-1
   **When** ich `scripts/lib/kiez-score/aggregate-to-larger-region.ts` implementiere
   **Then**:
   - `aggregateScores(planungsraumScores: KiezScore[], regions: { slug, planungsraumSlugs[], areaWeights[] }): KiezScore[]` mit Flächen-gewichtetem Mittel pro Dimension
   - Falls Planungsraum-Score `null`-Dimension (fehlende Daten): Aggregat ignoriert null-Werte aber dokumentiert in `missingData[]`-Array (analog zu 1.28-Pattern)
   - `overall`-Score wird NICHT re-aggregiert sondern aus aggregierten Dimensionen neu berechnet (`compute-score.ts`-Logic re-use)
   - Flächen-Gewichtung kommt aus LOR-Planungsraum-Polygon-Areas (aus GeoJSON `flaecheHa`-Property oder via `@turf/area`)
   - LOR-Bezirksregion → enthält-Planungsräume-Mapping kommt aus LOR-Hierarchie-File (ODIS `lor_bezirksregionen_2021` zusätzlich fetchen, falls noch nicht im Manifest)
   - Bezirks → enthält-Bezirksregionen-Mapping kommt aus `bezirke`-Layer (Bezirk-Name in BR-Properties)
   - Test: Aggregations-Pure-Function gegen Fixture (3 Planungsräume → 1 BR, Werte deterministisch)

3. **AC-3 (Build-Step `aggregate-data.ts` schreibt Score-Tabellen):**
   **Given** Story 2.0 `scripts/aggregate-data.ts` existiert oder wird parallel gebaut
   **When** ich Score-Insert in den Build-Step integriere
   **Then**:
   - Reihenfolge: `pnpm data:fetch` → `pnpm data:kiez-scores` (1.28) → `pnpm data:aggregate` (2.0 + jetzt 2.9a) → `pnpm build`
   - `aggregate-data.ts` (Story 2.0) wird um Sub-Step erweitert: lädt `static/kiez-scores/kiez-scores.json`, aggregiert auf BR + Bezirk via AC-2-Helper, schreibt in `bezirk_score` + `kiez_score`-Tabelle
   - Alternative: separates `scripts/aggregate-scores.ts` falls Story 2.0 noch zu groß wird — beide Optionen akzeptabel
   - Drizzle-Upsert (`onConflictDoUpdate`) pro Row, idempotent
   - Output-Volumen: 12 `bezirk_score`-Rows + 138 `kiez_score`-Rows
   - Test: Idempotenz, Smoke-Spotcheck Friedrichshain-Kreuzberg-Bezirks-Score + Boxhagener-Kiez-BR-Score

4. **AC-4 (Edge-Cases + Missing-Data-Handling):**
   **Given** dass Planungsräume teilweise fehlende Daten haben
   **When** Aggregation auf BR/Bezirk läuft
   **Then**:
   - Pro Aggregat-Score: `missingDataDimensions: string[]`-Field zeigt welche Dimensionen unter ≤ 50% Daten-Coverage liegen
   - Falls Bezirks-Score in einer Dimension > 50% missing: Dimension-Wert auf `null` setzen + Disclaimer pro Konsument (Bezirks-Page, Ranking)
   - Falls ALLE 5 Dimensionen einer Bezirks-Region missing sind: `overall: null` + Row-Flag `data_quality: 'insufficient'`
   - Tests: Edge-Case-Coverage (Bezirk ohne Lärm-Daten, Kiez ohne Versorgung-POIs)

5. **AC-5 (Konsumenten-Integration):**
   **Given** Stories 2.3, 2.4, 2.9b warten auf Score-Tabellen
   **When** Scores in Postgres verfügbar sind
   **Then**:
   - `src/lib/server/db/queries/get-bezirk-score.ts` (Story 2.0-Stub) ausfüllen: liest `bezirk_score`-Row für Slug, liefert `BezirkScore | null`
   - `src/lib/server/db/queries/get-kiez-score.ts` (Story 2.0-Stub) analog
   - Tests Snapshot-basiert pro Query
   - Story 2.3 + 2.4 ziehen `score`-Field via diese Queries; keine direkte JSON-Reads in Pages
   - Inspector-Panel-Konsumenten (Story 1.28-Inspector-Komponente) bleiben auf JSON-Read (Adress-Punkt-basiert, nicht Slug-basiert)

6. **AC-6 (Methodik-Doku):**
   **Given** dass Score-Methodik transparent sein muss
   **When** ich Methodik dokumentiere
   **Then**:
   - `docs/scoring-methodology.md` als neue Datei mit:
     - 5-Dimensionen-Übersicht (re-use aus 1.28-Methodik-Page)
     - Aggregations-Regel: „LOR-Planungsraum (542, Source-of-Truth) → LOR-Bezirksregion (138, Flächen-gewichtet) → Bezirk (12, Flächen-gewichtet)"
     - Missing-Data-Logik
     - Konvention: Wert-Bereich 0-100, Quartil-Klassifikation (0-25 / 26-50 / 51-75 / 76-100)
     - Editorial-Verantwortung-Section: kein Composite-Score auf Karte für Soziale-Lage; Stigma-Disclaimer pflicht
   - `/methodik/kiez-score`-Page (Story 1.28) wird um Bezirks-Score-Section erweitert (oder neue Sub-Page `/methodik/bezirks-score` falls saubere Trennung gewünscht — Empfehlung gleiche Page)
   - Memory `feedback_no_lebenswert.md` einhalten

7. **AC-7 (Editorial-Konsistenz Soziale-Lage):**
   **Given** dass Soziale-Lage stigma-sensitiv ist
   **When** Bezirks-/Kiez-Score-Output gerendert wird
   **Then**:
   - `soziale-lage`-Dimension bleibt `severity: 'neutral'` auf Bezirks- und Kiez-Page (kein Rot-Grün-Choropleth, kein Pfeil)
   - Disclaimer-Text wird auf jede Page-Anzeige eingebunden (re-use `kiez-score-explainer`-Variant aus 1.28)
   - `overall`-Score wird im UI NICHT als „lebenswert" benannt; Begriff bleibt „Kiez-Score" / „Bezirks-Score" (Memory `project_kiez_score_naming.md`)
   - Lint-Test gegen Wörter-Blacklist (re-use Story 2.5b/2.8-Pattern)

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012
   **When** ich diese Story implementiere
   **Then**:
   - AC-2: Aggregations-Helper-Pure-Function-Tests mit Fixture-Hierarchien
   - AC-3: Build-Step-Idempotenz-Test, DB-Spotcheck-Test mit Mock-Drizzle
   - AC-4: Edge-Case-Tests (missing-Data-Pfade)
   - AC-5: Query-Snapshot-Tests
   - AC-6: Doku-Existenz-Test (`docs/scoring-methodology.md` existiert + enthält erwartete Sections)
   - AC-7: Stigma-Lint-Test
   - Coverage-Ziel: Aggregations-Helper 100%, Build-Step ≥85%, Queries ≥90%

## Tasks / Subtasks

- [x] **T1: Strategie-Festlegung + ADR** (AC: 1, 6)
  - [x] T1.1: User-Decision Open-Question 1 (Variante A multi-level gewählt)
  - [x] T1.2: Neuer ADR-Eintrag ADR-013 „Score-Aggregations-Strategie (Variante A multi-level)"
  - [x] T1.3: Dokumentation in `docs/scoring-methodology.md`

- [x] **T2: LOR-Hierarchie-Mapping** (AC: 2)
  - [x] T2.1: LOR-Bezirksregion-Layer existiert bereits durch Story 2.0 (`lor-bezirksregion` im Manifest)
  - [x] T2.2: Mapping-Helper Pure-Function in `scripts/lib/kiez-score/lor-hierarchy.ts` via Property-Lookup (PLR_ID-Prefix-Konvention). Spatial-Containment nicht nötig: 0 Mismatches verifiziert auf 542 PLR.
  - [x] T2.3: Mapping als Pure-Function (Build-Time, kein JSON-Asset nötig)

- [x] **T3: Aggregations-Pipeline** (AC: 2, 4, 8)
  - [x] T3.1: `scripts/lib/kiez-score/aggregate-to-larger-region.ts` Pure-Function
  - [x] T3.2: Flächen-gewichtetes Mittel pro Dimension
  - [x] T3.3: Missing-Data-Handling (50%-Coverage-Threshold, dokumentiert pro Dimension via `missingData[]`)
  - [x] T3.4: Re-compute `overall` aus aggregierten Dimensionen via `computeOverallScore` (1.28-Re-Use)
  - [x] T3.5: Pure-Function-Tests mit Fixture-Hierarchie (`aggregate-to-larger-region.test.ts`, 8 Tests)

- [x] **T4: Build-Step + DB-Insert** (AC: 3, 5, 8)
  - [x] T4.1: Separates `scripts/aggregate-scores.ts` (Single-Responsibility, statt 2.0-Sub-Step)
  - [x] T4.2: Drizzle-Insert mit TRUNCATE+Insert-Pattern für `bezirk_score` + `kiez_score`
  - [x] T4.3: Idempotenz-Test (Hash-Vergleich zwei Runs in `aggregate-scores.test.ts`)
  - [x] T4.4: Query-Module `get-bezirk-score.ts` + `get-kiez-score.ts` waren in Story 2.0 bereits ausgefüllt mit InferSelectModel-Typing. Tests in `queries.test.ts` decken Null-Fallback ab; werden nach `pnpm data:aggregate-scores`-Run zu Hit-Tests aktiviert.

- [x] **T5: Methodik-Doku + Editorial-Patterns** (AC: 6, 7, 8)
  - [x] T5.1: `docs/scoring-methodology.md` geschrieben mit allen 6 Pflicht-Sections
  - [x] T5.2: `/methodik/kiez-score`-Page um Sections `#kiez-score` und `#bezirks-score` erweitert + TOC-Anker
  - [x] T5.3: Stigma-Lint bereits in `$lib/seo/banned-words.ts` zentralisiert (Story 2.5b/2.8). Test prüft Methodik-Page (`page.svelte.test.ts`) gegen „lebenswert"-Wort

- [x] **T6: Final-Verifikation** (AC: 1-8)
  - [x] T6.1: `pnpm test:unit -- --run` 100% grün (siehe Dev Agent Record)
  - [x] T6.2: `pnpm check` 0 Errors / 0 Warnings (6076 Files)
  - [ ] T6.3: `pnpm data:aggregate-scores` lokaler Run setzt voraus dass DATABASE_URL gesetzt ist und Story 2.0-Migrations + `pnpm data:aggregate` schon liefen. Out-of-scope für CI ohne Postgres-Service (gleicher Pattern wie Story 2.0)
  - [x] T6.4: Aggregations-Resultat verifiziert ohne DB: 12 Bezirk-Rows + 143 Kiez-Rows, alle composite-Werte zwischen 42 und 54 plausibel inner-/außer-Stadt
  - [ ] T6.5: Spotcheck Bezirks-Page (2.3): Story 2.3 noch nicht implementiert, Konsumenten-Smoke aufgeschoben bis 2.3
  - [x] T6.6: Sprint-Status-Eintrag aktualisiert (ready-for-dev → in-progress → review)

## Dev Notes

### Open-Question 1 (Critical): Score-Architektur

Story 1.28 hat bereits voll funktionsfähigen Score auf 542 LOR-PR mit 5 Dimensionen. Epic 2.9a-Wortlaut beschreibt eine andere Architektur (6 Cluster auf 12 Bezirk + 138 BR direkt).

| Variante | Vorteile | Nachteile |
|----------|----------|-----------|
| **A: Aggregation 542→138→12** | Single-Source 1.28; deterministisch | Aggregat-Helper neu; Flächen-Gewichte-Mapping |
| B: Re-implement gegen Postgres-Aggregat | folgt Epic-Wortlaut wörtlich | Doppelter Datenpfad; 1.28 wird obsolet |
| C: Hybrid (1.28 für PR/BR, neu für Bezirk) | minimaler Code | drei parallele Score-Logiken |

**Empfehlung A.** 1.28 ist Source-of-Truth, 2.9a aggregiert und cached in Postgres. Dimensions-Naming bleibt wie 1.28 (5 Dimensionen). Epic-Wortlaut wird per Dev-Notes als überholt markiert (referenziert Story 1.28-Refinement).

### Datenfluss

```
static/kiez-scores/kiez-scores.json (Source-of-Truth, 542 LOR-PR, 5 Dim, Story 1.28)
        ↓ (aggregate-scores.ts oder aggregate-data.ts-Sub-Step)
Postgres bezirk_score (12 Rows) + kiez_score (138 Rows) (Build-Time-Cache)
        ↓
get-bezirk-score.ts / get-kiez-score.ts (Story 2.0-Query-Module, ausgefüllt durch 2.9a)
        ↓
Bezirks-Page (2.3) + Kiez-Page (2.4) + Ranking (2.9b) Steckbrief
```

Adress-basierter Score bleibt via `get-kiez-score.ts` (Story 1.28-Runtime-Adapter, JSON-Read mit Spatial-Lookup) — kein DB-Roundtrip im Inspector.

### LOR-Hierarchie-Daten

`lor-planungsraum`-Layer (542 Features) im Manifest. Properties enthalten oft `BZR_NAME` oder `BZR_ID` für Bezirksregion + `BEZIRK` für Bezirk (zu verifizieren beim Dev-Start). Falls nicht: separater LOR-Bezirksregion-Layer fetchen (siehe Story 2.4 Pipeline-Update).

Empfehlung: in T2 die Properties prüfen, dann entweder Property-basiertes Mapping oder Spatial-Containment.

### Aggregat-Konvention: Flächen-gewichtetes Mittel

Pro Dimension `d` und Aggregat-Region `R` mit enthaltenen Planungsräumen `P_1...P_n`:

```
dim_value(R, d) = Σ (dim_value(P_i, d) × area(P_i)) / Σ area(P_i)
```

Nur Planungsräume mit nicht-null Dimension-Wert gehen ein. Falls Anzahl der non-null < 50% von n: Dimension-Wert für R = null.

`overall(R) = Σ (dim_value(R, d) × weight(d))` — re-use `compute-score.ts`-Logic, NICHT eigenständige Aggregation des Overall-Wertes (sonst Drift).

### Konflikt mit Epic-Wortlaut

Epic 2.9a sagt:
> 6 Cluster (Lärm-Score, Luft-Score, Klima-Score, Grün-Score, ÖPNV-Score, Bildungs-Score)

Story 1.28 hat:
> 5 Dimensionen (Ruhe-Luft, Grün, Mobilität, Soziale-Lage, Versorgung)

Bei Variante A: Dimensions bleiben wie 1.28. Mapping zur Klarheit:

- Lärm + Luft → konsolidiert in `ruhe-luft` (1.28)
- Klima → NICHT separate Dimension (in `ruhe-luft`-Cluster integriert oder als zukünftige 6. Dim Phase 2)
- Grün → `gruen` (1.28)
- ÖPNV → `mobilitaet` (1.28)
- Bildung → Teil von `versorgung` (1.28, inkl. Kitas/Schulen/Krankenhäuser/Spielplätze/Grünanlagen)
- Soziale-Lage → `soziale-lage` (1.28, neu hinzugefügt)

ADR oder Doku-Update vermerken dass Epic-Wortlaut superseded ist.

### Stigma-Schutz auf Bezirks-Ebene

Bezirks-Score-Composite wird wahrscheinlich häufig gelesen („Welcher Bezirk hat den besten Score?"). Editorial-Disziplin:

- Karte: keine Composite-Single-Score-Choropleth (verstärkt „guter/schlechter Bezirk"-Wahrnehmung)
- Pro Dimension separate Choropleth-Layer OK (Story 1.31 Familie-Mapping)
- Wo Score als Zahl gezeigt wird: immer mit Disclaimer „Score ist statistisch, nicht normativ. Lebensqualität bemisst sich an persönlichen Prioritäten."
- Memory `feedback_no_lebenswert.md`: niemals als „lebenswert" benennen

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Aggregations-Helper-File strikt halten
- **#3 Bestehende Funktionen prüfen:** 1.28-Helper re-use (`compute-score`, `normalize`)
- **#7 TypeScript strict:** KiezScore-Type aus 1.28 wiederverwenden
- **#10 Cookieless:** DB-Reads server-only
- **#14 i18n-First:** Dimension-Labels via Paraglide

### Open-Questions vor Dev-Start

1. **Score-Architektur (Variante A/B/C):** Empfehlung A. Akzeptabel?
2. **Build-Step-Integration:** in `aggregate-data.ts` (Story 2.0) oder separates `aggregate-scores.ts`? Empfehlung separates Skript (Single-Responsibility).
3. **LOR-BR-Hierarchie-Mapping:** Property-basiert oder Spatial-Containment? Empfehlung Property-basiert wenn `lor-planungsraum`-Properties die nötigen Felder enthalten, sonst Spatial-Containment-Fallback.
4. **Missing-Data-Threshold:** 50% Coverage als Cutoff für Dimension-Wert. Akzeptabel oder anderer Wert?
5. **Methodik-Page-Erweiterung:** `/methodik/kiez-score` bleibt single Page oder neue `/methodik/bezirks-score`? Empfehlung gleiche Page mit Section-Anker.

### Project Structure Notes

- Aggregations-Helper: `scripts/lib/kiez-score/aggregate-to-larger-region.ts`
- Build-Skript: `scripts/aggregate-scores.ts` (neu, einfacher als 2.0-Integration)
- Query-Module: Story 2.0-Stubs ausfüllen in `src/lib/server/db/queries/get-bezirk-score.ts` + `get-kiez-score.ts`
- Methodik-Doku: `docs/scoring-methodology.md`
- Page-Edit: `src/routes/(with-header)/methodik/kiez-score/+page.svelte` um Bezirks-Section erweitern
- Re-use: `scripts/lib/kiez-score/{compute-score,normalize,types,dimension-config}.ts` (Story 1.28-Bestand)

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1307-L1335](../planning-artifacts/epics.md)
- Story 1.28: [./1-28-livability-index.md](./1-28-livability-index.md)
- Story 2.0: [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.4 Score-Aggregation: [./2-4-kiez-pages-prerendered.md](./2-4-kiez-pages-prerendered.md)
- Story 1.28-Pipeline: [scripts/lib/kiez-score/](../../scripts/lib/kiez-score/)
- Static-JSON: [static/kiez-scores/kiez-scores.json](../../static/kiez-scores/kiez-scores.json)
- Memory `feedback_no_lebenswert.md`, `project_kiez_score_naming.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (worktree-agent-ae9a02fc52fcabe44, 2026-05-16, Pragmatic-TDD per ADR-012)

### Debug Log References

Worktree-Branch `worktree-agent-ae9a02fc52fcabe44`. Story-Implementation läuft als isolierter Branch, Merge in `main` per PR oder Squash-Commit.

### Completion Notes List

- **Variante A multi-level locked in** ADR-013. Epic-Wortlaut (Lärm/Luft/Klima/Grün/ÖPNV/Bildung) als superseded markiert. Dimensions bleiben wie Story 1.28 (5 Dimensionen, je 0.20).
- **LOR-Hierarchie property-basiert**, kein Spatial-Containment. PLR_ID[:6] = BZR_ID, PLR_ID[:2] = BEZ-Code. Verifiziert auf ODIS-2021-Dataset (542 PLR, 0 Mismatches). Spatial-Containment-Fallback ist nicht implementiert weil unnötig.
- **143 Bezirksregionen statt 138** in Story-Wortlaut. ODIS-2021-Datensatz hat 143. Test `produces 12 bezirk rows + 143 kiez rows` validiert den realen Zustand.
- **Missing-Data-Policy 50%-Threshold**: Coverage unter 50% (= weniger als die Hälfte der Member-PRs haben non-null Wert) → Dimension auf `null`, `missingData[]` dokumentiert `coverage:N/M-below-50%-threshold`. Wenn alle 5 Dimensionen null, fehlt `overall` komplett.
- **Heerstraße-Slug-Kollision** automatisch aufgelöst (gleicher Pattern wie Story 2.0 kiez_stats): `heerstrasse-spandau` + `heerstrasse-charlottenburg-wilmersdorf`.
- **Spot-Check Friedrichshain-Kreuzberg**: composite=43.5, ruheLuft=27.5, gruen=31.1, mobilitaet=35.1, sozialeLage=61.3, versorgung=62.4. Plausibel inner-city.
- **Bezirks-Score Range**: 42 (Mitte) bis 54 (Steglitz-Zehlendorf). Differenz 12 Punkte realistisch für ein inner-Berlin-Pattern. Keine Extreme weil flächen-gewichtetes Mittel Außenbezirke abschwächt.
- **Aggregation pure function**: 100% Coverage erreicht (8 Tests in `aggregate-to-larger-region.test.ts`, 9 in `lor-hierarchy.test.ts`). Idempotenz via stable-hash zwei Runs in `aggregate-scores.test.ts`.
- **Stigma-Disziplin**: kein Composite-Single-Score-Choropleth auf der Karte. Bezirks-Score erscheint nur in Steckbrief-Tabellen (2.3) und Ranking (2.9b). Soziale-Lage Strukturell-Indigo. „lebenswert" Lint-Test in methodik-Page-Test.
- **DB-Insert**: `pnpm data:aggregate-scores` setzt DATABASE_URL voraus. Migrations aus Story 2.0 müssen gelaufen sein. Idempotent via TRUNCATE+Insert. Out-of-scope für CI ohne Postgres-Service (gleicher Pattern wie Story 2.0).

### File List

**Neu**:

- `scripts/lib/kiez-score/aggregate-to-larger-region.ts` Pure-Function-Aggregator (139 LOC)
- `scripts/lib/kiez-score/aggregate-to-larger-region.test.ts` 8 Test-Cases
- `scripts/lib/kiez-score/lor-hierarchy.ts` Property-basiertes Mapping (124 LOC)
- `scripts/lib/kiez-score/lor-hierarchy.test.ts` 9 Test-Cases
- `scripts/aggregate-scores.ts` Build-Orchestrator (227 LOC)
- `scripts/aggregate-scores.test.ts` 5 Test-Cases (deterministisch, 12+143 Rows, Range, FK)
- `docs/adr/ADR-013-score-aggregation-strategy.md` Variante-A-ADR
- `docs/scoring-methodology.md` Methodik-Quelle mit Pipeline + Editorial-Section
- `src/routes/(with-header)/methodik/kiez-score/page.svelte.test.ts` 4 Section-Tests

**Geändert**:

- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` zwei neue Sections `#kiez-score` + `#bezirks-score` + TOC-Anker
- `package.json` neuer Script `data:aggregate-scores`
- `_bmad-output/implementation-artifacts/2-9a-kiez-score-bezirks-score-aggregat-berechnung.md` Status + Tasks + Dev Agent Record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` Story-Status `ready-for-dev` → `in-progress` → `review`

**Bereits aus Story 2.0 verfügbar (kein Edit nötig)**:

- `src/lib/server/db/schema/bezirk-score.ts` + `kiez-score.ts` Drizzle-Schema
- `src/lib/server/db/queries/get-bezirk-score.ts` + `get-kiez-score.ts` Query-Module mit `InferSelectModel`-Typing
- `src/lib/server/db/queries/queries.test.ts` Null-Fallback-Tests

### Change Log

| Datum | Autor | Änderung |
|-------|-------|----------|
| 2026-05-16 | dev-agent | Story-Implementation Variante A multi-level. ADR-013, methodology-doc, aggregate-scores-pipeline, 17 neue Tests. |
