# Story 9.1: Score-Dimensions-Foundation (Typ-Union + Config + Gewichte)

Status: review

> **Anker:** ADR-015 (`docs/adr/ADR-015-score-composition-umwelt-infra.md`, Accepted 2026-05-20). Supersedet die Dimensions-Festlegung aus ADR-013 (Aggregations-Strategie A bleibt gültig). Diese Story ist der **Hard-Block für alle folgenden Epic-9-Stories** (9.2–9.5): die Typ-Union ist die einzige Quelle der Wahrheit, alle Konsumenten migrieren gegen sie.

## Story

As a Solo-Maintainer,
I want die Score-Dimensionen zentral auf das neue Set umstellen (Typ-Union + dimension-config + Gewichte),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren können.

## Kontext: Warum dieser Change

Der Kiez-Score (ADR-013, Story 1.28) wichtet fünf Dimensionen gleich: Ruhe-Luft, Grün, Mobilität, **Soziale Lage** (MSS), Versorgung. Der Disclaimer behauptet „keine Wohnqualität", der Score wichtet aber strukturelle MSS-Daten mit ein. Das beißt sich: ein Kiez mit höherem Sozialstatus scort „besser" und stigmatisiert Kieze mit niedrigem Status. Das verletzt die rote Linie (`feedback_no_lebenswert`, `project_compare_editorial_profiles`).

ADR-015 löst den Widerspruch: Der Score misst nur Größen mit eindeutiger Besser-Richtung für jeden Bewohner. Sozialstruktur fliegt raus aus dem Score und wird neutraler Kontext. Der Score heißt ehrlich **Umwelt- & Infrastruktur-Score**.

**Diese Story** stellt nur das Fundament um: Typ-Union, Layer-Mapping pro Dimension, Gewichte, Output-Schema-Picklist, die dimensions-keyed Maps innerhalb des `scripts/lib/kiez-score/`-Moduls. Pipeline-Re-Run (9.3), DB-Schema (9.2), UI-Konsumenten (9.4) und Content (9.5) folgen.

## Acceptance Criteria

1. **AC-1 (Typ-Union):**
   **Given** ADR-015
   **When** ich `scripts/lib/kiez-score/types.ts` umstelle
   **Then** gilt:
   ```ts
   export type KiezScoreDimension =
     | 'ruhe-luft'
     | 'gruen-hitze'
     | 'mobilitaet'
     | 'versorgung'
     | 'wohnschutz';
   ```
   **And** `soziale-lage` ist entfernt, `gruen` → `gruen-hitze` umbenannt, `wohnschutz` neu
   **And** `KIEZ_SCORE_DIMENSIONS` listet exakt diese fünf in dieser Reihenfolge
   **And** `DIMENSION_WEIGHTS` ist `Record<KiezScoreDimension, number>` mit 5 × 0.20, Summe = 1

2. **AC-2 (Layer-Mapping pro Dimension):**
   **Given** `dimension-config.ts`
   **When** ich die Layer-Zuordnung pro Dimension neu setze
   **Then** gilt (Layer-Slugs exakt wie in `scripts/lib/sources.ts`):

   **Ruhe & Luft** (nur Lärm + Luft, kein Bioklima, kein Umweltgerechtigkeit-Fallback mehr):
   - `laerm-2023` (Gewicht 0.5, ordinal-3)
   - `luft-2023` (Gewicht 0.5, ordinal-3)

   **Grün & Hitze** (Grün-Versorgung + thermische Resilienz; Bioklima wandert hierher aus Ruhe-Luft, Grünanlagen wandern hierher aus Versorgung):
   - `gruenversorgung-2023` (ordinal-4)
   - `gruenanlagen` (presence/POI)
   - `bioklima-2023` (ordinal-3)
   - `klima-pet-2022` (Normalisierung siehe Dev Notes)
   - `klima-kaltlufteinwirkbereich-2022` (presence)
   - `klima-leitbahnkorridor-2022` (presence)
   - Gewichte: Vorschlag siehe Dev Notes, Summe der internen Gewichte = 1

   **Mobilität** (unverändert):
   - `oepnv-ubahn` (0.35), `oepnv-sbahn` (0.25), `oepnv-tram` (0.2), `oepnv-bus` (0.1), `radverkehr-presence` (0.1, presence-any-of `radverkehrsnetz-2025` ∪ `fahrradstrassen-2024`)

   **Versorgung** (ohne Grünanlagen, die wandern nach Grün & Hitze):
   - `kitas-2024`, `schulen-2024`, `krankenhaeuser-plan`, `spielplaetze`
   - Gewichte neu balanciert auf Summe = 1 (Vorschlag siehe Dev Notes)

   **Wohnschutz** (Verdrängungsschutz, positiv-eindeutig: innerhalb Milieuschutz-Gebiet = Schutz vorhanden = gut):
   - `milieuschutz-erhaltungsmiete` (presence)
   - `milieuschutz-staedtebau` (presence)
   - presence-any-of-Pattern analog `radverkehr-presence`: mindestens ein Gebiet überlappt LOR-Centroid → 100, sonst 0

   **And** MSS (`mss-gesamtindex-2025`) + Umweltgerechtigkeit (`umweltgerechtigkeit-2023`) sind KEINE Score-Inputs mehr (auch nicht als Fallback)

3. **AC-3 (Dimensions-keyed Maps im Modul):**
   **Given** die geänderte Union
   **When** ich das `scripts/lib/kiez-score/`-Modul anpasse
   **Then** kompilieren alle modulinternen `Record<KiezScoreDimension, …>`- und Picklist-Strukturen gegen das neue Set:
   - `DIMENSION_CONFIGS` (dimension-config.ts)
   - `output-schema.ts` `DimensionPicklist` (leitet aus `KIEZ_SCORE_DIMENSIONS` ab → automatisch)
   - `pipeline.ts` `KiezScoreLayerSlug`-Union + `KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION` (Slugs: `kiez-score-soziale-lage` raus, `kiez-score-gruen` → `kiez-score-gruen-hitze`, `kiez-score-wohnschutz` neu)
   **And** `compute-score.ts` bleibt generisch (iteriert `DIMENSION_CONFIGS`); der bisherige soziale-lage-Pfad (intrinsicGuard `kom === 'gültig'`) entfällt mit der Config

4. **AC-4 (TDD, Modul-Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** die Tests in `scripts/lib/kiez-score/*.test.ts` laufen
   **Then**:
   - kein Test referenziert `soziale-lage` oder `gruen` als Score-Dimension mehr
   - `compute-score.test.ts` deckt Ruhe-Luft (laerm/luft), Grün & Hitze (inkl. Bioklima-Move), Versorgung (ohne Grünanlagen), Wohnschutz (presence) ab
   - ein Test verifiziert `DIMENSION_WEIGHTS`-Summe = 1 und exakt 5 Keys
   - ein Test verifiziert `output-schema.ts` akzeptiert die neuen Picklist-Werte, lehnt `soziale-lage`/`gruen` ab
   - Tests folgen Red → Green (Failing-First im Commit nachvollziehbar)

5. **AC-5 (Scope-Gate, type-check-Erwartung):**
   **Given** die Union ist repo-weit referenziert
   **When** 9.1 abgeschlossen ist
   **Then**:
   - **Gate für 9.1:** `scripts/lib/kiez-score/`-Modul kompiliert (`tsc` auf das Modul), Modul-Unit-Tests grün
   - **Erwartet:** repo-weiter `pnpm check` bleibt ROT (kiez-score-display.ts, aggregate-scores.ts, OG/LLM-Renderer, DB-Schema referenzieren noch das alte Set). Das ist beabsichtigt und wird in 9.2–9.4 grün gezogen.
   - Story-Completion-Note dokumentiert explizit, welche repo-weiten Errors offen bleiben und welche Story sie schließt

## Tasks / Subtasks

- [x] **Task 1: Typ-Union + Gewichte** (AC: #1)
  - [x] 1.1 (RED) `dimension-config.test.ts` neu: erwartet neue Union + 5 Keys + Gewichts-Summe = 1
  - [x] 1.2 (GREEN) `scripts/lib/kiez-score/types.ts`: `KiezScoreDimension`-Union, `KIEZ_SCORE_DIMENSIONS`, `DIMENSION_WEIGHTS` umgestellt
  - [x] 1.3 Verify Failing-First (RED-Log /tmp/vitest-red.log: 33 fail → GREEN /tmp/vitest-green.log: 81 pass)

- [x] **Task 2: dimension-config.ts neu komponieren** (AC: #2)
  - [x] 2.1 (RED) `compute-score.test.ts` auf neues Set umgeschrieben (Cases pro Dimension)
  - [x] 2.2 `RUHE_LUFT_CONFIG`: nur `laerm-2023` (0.5) + `luft-2023` (0.5); Bioklima + Fallback entfernt
  - [x] 2.3 `GRUEN_CONFIG` → `GRUEN_HITZE_CONFIG`: gruenversorgung 0.30 / gruenanlagen 0.15 / bioklima 0.20 / klima-pet 0.15 / kaltluft 0.10 / leitbahn 0.10
  - [x] 2.4 `VERSORGUNG_CONFIG`: Grünanlagen entfernt, Gewichte kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15
  - [x] 2.5 `WOHNSCHUTZ_CONFIG` neu: presence-any-of über milieuschutz-erhaltungsmiete + milieuschutz-staedtebau
  - [x] 2.6 `SOZIALE_LAGE_CONFIG` entfernt
  - [x] 2.7 `DIMENSION_CONFIGS`-Map auf neues Set
  - [x] 2.8 (GREEN) Tests grün

- [x] **Task 3: Modulinterne dimensions-keyed Maps** (AC: #3)
  - [x] 3.1 `pipeline.ts`: `KiezScoreLayerSlug`-Union + `KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION` umgestellt
  - [x] 3.2 `output-schema.ts`: `DimensionPicklist` leitet automatisch aus `KIEZ_SCORE_DIMENSIONS` ab (verifiziert via output-schema.test.ts)
  - [x] 3.3 `compute-score.ts`: intrinsicGuard-Pfad entfällt mit Config; presence-any-of dimension-agnostisch generalisiert (normalizeMobility → normalizeSyntheticLayer); numeric-inverted-Strategie für PET ergänzt

- [x] **Task 4: Modul-Tests + Scope-Gate** (AC: #4, #5)
  - [x] 4.1 `normalize.test.ts`, `compute-score.test.ts`, `pipeline.test.ts`, `dimension-config.test.ts`, `output-schema.test.ts`, `aggregate-to-larger-region.test.ts` grün (81 Tests)
  - [x] 4.2 Modul-Tests grün; repo-weiter `pnpm check` ROT wie erwartet (AC-5)
  - [x] 4.3 Completion-Note: offene type-check-Errors aufgelistet + Mapping auf 9.2/9.3/9.4

## Dev Notes

### Aktueller Stand (zu ändern)

`scripts/lib/kiez-score/types.ts`:
```ts
export type KiezScoreDimension = 'ruhe-luft' | 'gruen' | 'mobilitaet' | 'soziale-lage' | 'versorgung';
export const KIEZ_SCORE_DIMENSIONS: readonly KiezScoreDimension[] = ['ruhe-luft','gruen','mobilitaet','soziale-lage','versorgung'];
export const DIMENSION_WEIGHTS: Record<KiezScoreDimension, number> = { 'ruhe-luft':0.2, gruen:0.2, mobilitaet:0.2, 'soziale-lage':0.2, versorgung:0.2 };
```

`dimension-config.ts` (aktuelle Mappings, Zeilen ~3–119):
- `RUHE_LUFT_CONFIG`: laerm-2023 (0.4), luft-2023 (0.4), bioklima-2023 (0.2), Fallback umweltgerechtigkeit-2023 (1.0)
- `GRUEN_CONFIG`: gruenversorgung-2023 (0.6), klima-kaltlufteinwirkbereich-2022 (0.2), klima-leitbahnkorridor-2022 (0.2)
- `MOBILITAET_CONFIG`: oepnv-ubahn (0.35), oepnv-sbahn (0.25), oepnv-tram (0.2), oepnv-bus (0.1), radverkehr-presence (0.1)
- `SOZIALE_LAGE_CONFIG`: mss-gesamtindex-2025 (1.0), intrinsicGuard `kom === 'gültig'`
- `VERSORGUNG_CONFIG`: kitas-2024 (0.25), schulen-2024 (0.25), krankenhaeuser-plan (0.2), spielplaetze (0.15), gruenanlagen (0.15)

### Layer-Bewegungen (kritisch, nicht übersehen)

- **Bioklima wandert** von Ruhe & Luft → Grün & Hitze (ADR-015: Ruhe & Luft = nur laerm/luft)
- **Grünanlagen wandern** von Versorgung → Grün & Hitze
- **MSS + Umweltgerechtigkeit raus** aus dem Score (auch der Ruhe-Luft-Fallback auf umweltgerechtigkeit-2023 entfällt ersatzlos)
- **Wohnschutz neu**: Milieuschutz als Verdrängungsschutz, positiv-eindeutig (innerhalb Gebiet = gut)

### Gewichts-Vorschlag (proposed defaults, Summe je Dimension = 1)

Dimension-Gesamtgewichte bleiben 5 × 0.20. Intern:
- **Ruhe & Luft:** laerm 0.5 / luft 0.5
- **Grün & Hitze:** gruenversorgung 0.30 / gruenanlagen 0.15 / bioklima 0.20 / klima-pet 0.15 / kaltluft 0.10 / leitbahn 0.10
- **Mobilität:** unverändert (0.35/0.25/0.20/0.10/0.10)
- **Versorgung:** kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15
- **Wohnschutz:** presence-any-of (Gewicht 1.0, beide Milieuschutz-Layer ODER-verknüpft)

Annahme per CLAUDE.md („state assumption and proceed"): diese Gewichte sind Default. Falls editorial andere Balance gewünscht, in Story-Refinement anpassen, aber Summen-Invarianten (intern = 1, dimension-übergreifend 5×0.20 = 1) müssen halten.

### klima-pet-2022 Normalisierung

PET (physiologische Äquivalenttemperatur) ist ordinal (Hitzebelastungs-Stufen, je geringer desto besser). Prüfen welche Property der Layer trägt (`klima-pet-card.svelte` zeigt die Darstellung). Voraussichtlich ordinal-3 oder ordinal-N invertiert (geringe Belastung = 100). Falls die Stufen-Labels nicht zu `normalizeOrdinal3`/`normalizeOrdinal4` passen: neue Strategie in `normalize.ts` ergänzen (TDD, ≥3 Cases). `normalize.ts` ist sonst generisch und braucht keine Änderung.

### Wohnschutz presence-Pattern

`compute-score.ts` hat bereits `normalizeMobility` mit presence-any-of-Logik für `radverkehr-presence`. Wohnschutz nutzt dasselbe Muster: mehrere Layer-Slugs ODER-verknüpft, presence im LOR-Polygon. Prüfen ob der vorhandene presence-any-of-Mechanismus generisch wiederverwendbar ist (DRY) oder ob ein analoger Config-Typ nötig ist. Bevorzugt: bestehenden Mechanismus generalisieren statt duplizieren (CLAUDE.md: vor neuem Code prüfen ob Utility existiert).

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict, kein `any`
- #15 Editorial-Verantwortung: Wohnschutz positiv-eindeutig, MSS raus aus Score

### Scope-Erwartung (wichtig)

Diese Story bricht repo-weit `pnpm check`, weil die Union überall referenziert wird (`kiez-score-display.ts`, `aggregate-scores.ts`, `score-card-data.ts`, `aggregate-renderer.ts`, `ranking-types.ts`, DB-Schema, Tests). **Das ist erwartet.** Gate für 9.1 ist nur das `scripts/lib/kiez-score/`-Modul + dessen Tests. Die repo-weiten Errors werden dependency-getrieben in 9.2 (DB), 9.3 (Pipeline) und 9.4 (Konsumenten) geschlossen.

### Previous Story Intelligence

- **Story 1.28:** Score-Foundation, normalize/compute-score/pipeline/output-schema-Pattern, presence + ordinal Strategien
- **Story 1.31:** Choropleth-Score-Style-Familien (Gut/Strukturell), relevant für 9.4
- **Story 2.9a:** `aggregate-scores.ts` Bezirks-/Kiez-Aggregation aus kiez-scores.json (relevant für 9.3)
- **Memory `project_kiez_score_dimensions`:** ist durch ADR-015 VERALTET (5-Dim-Set mit soziale-lage). Nach Epic-9-Abschluss Memory ersetzen (siehe 9.5/Retro).
- **Memory `feedback_no_lebenswert` / `project_compare_editorial_profiles`:** der eigentliche Grund für den Change

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: scripts/lib/kiez-score/types.ts]
- [Source: scripts/lib/kiez-score/dimension-config.ts]
- [Source: scripts/lib/kiez-score/compute-score.ts]
- [Source: scripts/lib/kiez-score/normalize.ts]
- [Source: scripts/lib/kiez-score/pipeline.ts]
- [Source: scripts/lib/kiez-score/output-schema.ts]
- [Source: scripts/lib/sources.ts#milieuschutz-erhaltungsmiete] (Zeile ~287)
- [Source: scripts/lib/sources.ts#milieuschutz-staedtebau] (Zeile ~298)
- [Source: _bmad-output/implementation-artifacts/1-28-livability-index.md]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- RED: `/tmp/vitest-red.log` — 6 Files / 33 Tests fail (neue Configs/Union fehlen)
- GREEN: `/tmp/vitest-green.log` — 7 Files / 81 Tests pass
- Scope-Gate: `/tmp/check-91.log` — `pnpm check` 25 Errors (erwartet ROT)

### Completion Notes List

- Score-Dimensionen auf ADR-015-Set umgestellt: `soziale-lage` entfernt, `gruen` → `gruen-hitze`, `wohnschutz` neu. Gewichte 5 × 0.20.
- Layer-Bewegungen umgesetzt: Bioklima Ruhe-Luft → Grün & Hitze, Grünanlagen Versorgung → Grün & Hitze, Umweltgerechtigkeit-Fallback ersatzlos entfernt, MSS raus.
- Neue Normalisierung `numeric-inverted` für klima-pet-2022 (pet14h, °C): ≤29 → 100, ≥41 → 0, linear (Matzarakis-Belastungsklassen). In `normalize.ts` generisch ergänzt, ≥3 Test-Cases.
- Wohnschutz nutzt das vorhandene presence-any-of-Muster (DRY): `normalizeMobility` zu `normalizeSyntheticLayer` generalisiert, Dispatch jetzt auf `normalize.kind` statt Dimension. Kein dupliziertes Presence-Handling.
- `intrinsicGuard` (soziale-lage `kom === 'gültig'`) entfällt mit der Config; `compute-score.ts` bleibt generisch.
- `output-schema.ts` `DimensionPicklist` leitet automatisch aus `KIEZ_SCORE_DIMENSIONS` ab — keine harte Picklist-Änderung nötig (verifiziert: lehnt soziale-lage/gruen ab).
- **Scope-Gate (AC-5) erfüllt:** Modul `scripts/lib/kiez-score/` grün (81 Tests). Repo-weiter `pnpm check` bleibt ROT (25 Errors) wie erwartet.
  - **Offene Errors → 9.2 (DB-Schema):** `src/lib/server/db/schema/kiez-score.ts`, `bezirk-score.ts`, `kiez-stats.ts`, `bezirk-stats.ts`
  - **→ 9.3 (Pipeline/Aggregate):** `scripts/aggregate-scores.ts`
  - **→ 9.4 (Konsumenten UI/OG/LLM):** `kiez-score-display.ts`, `value-formatters.ts`, `layer-explain.ts`, `layer-palette-filter.ts`, `layer-synonyms.ts`, `choropleth-family.ts`, `layer-style-builder.ts`, `layer-palette.svelte`, `score-ranking-table.svelte`, `score-card-data.ts`, `kiez-score-ring.svelte`, `kiez-score-hero.svelte`, `kiez-score-compare-block.svelte`, `kiez-score-section.svelte`, `layer-methodology.ts`, `llm-export-builder` (+ zugehörige `.test.ts`)
  - **NICHT 9.x (pre-existing, out-of-scope):** 2 `"de"/"en"`-Vergleichs-Errors in `src/lib/webmcp/mount.ts` + `src/routes/+layout.svelte` (i18n Phase-1-DE-only-Artefakt, schon vor 9.1 vorhanden).
- Memory `project_kiez_score_dimensions` ist durch diesen Change VERALTET (altes 5-Dim-Set mit soziale-lage). Ersatz nach Epic-9-Abschluss (9.5/Retro).

### File List

**Geändert (Implementation):**
- `scripts/lib/kiez-score/types.ts` (Union, KIEZ_SCORE_DIMENSIONS, DIMENSION_WEIGHTS, numeric-inverted-Strategie)
- `scripts/lib/kiez-score/normalize.ts` (normalizeNumericInverted)
- `scripts/lib/kiez-score/dimension-config.ts` (neue Configs)
- `scripts/lib/kiez-score/compute-score.ts` (numeric-inverted-Case, presence-any-of generalisiert, overall-Kommentar)
- `scripts/lib/kiez-score/pipeline.ts` (KiezScoreLayerSlug-Union + Map)

**Geändert (Tests):**
- `scripts/lib/kiez-score/normalize.test.ts`
- `scripts/lib/kiez-score/compute-score.test.ts`
- `scripts/lib/kiez-score/pipeline.test.ts`
- `scripts/lib/kiez-score/aggregate-to-larger-region.test.ts`

**Neu (Tests):**
- `scripts/lib/kiez-score/dimension-config.test.ts`
- `scripts/lib/kiez-score/output-schema.test.ts`

## Change Log

- 2026-05-21: Story 9.1 implementiert (Score-Dimensions-Foundation). Typ-Union auf ADR-015-Set, neue dimension-config, numeric-inverted-Normalisierung, presence-any-of generalisiert. 81 Modul-Tests grün, repo-weit ROT wie erwartet (Hard-Block für 9.2–9.5 gelöst).
