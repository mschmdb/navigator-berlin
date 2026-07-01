# Story 9.4: Konsumenten-Migration (UI + Map + OG + LLM)

Status: review

> **Anker:** ADR-015. **Voraussetzung:** 9.3 (neue Scores liegen in JSON + DB). **Parallel-möglich mit 9.5.** Diese Story zieht den repo-weiten `pnpm check` wieder grün.

## Story

As a User,
I want dass alle Score-Darstellungen das neue Dimensions-Set zeigen,
so that Inspector, Compare, Ranking, Karte, OG-Cards und LLM-Export konsistent sind.

## Kontext

Nach 9.1–9.3 trägt das Daten-Fundament fünf neue Dimensionen (Ruhe & Luft / Grün & Hitze / Mobilität / Versorgung / Wohnschutz). Alle Render-Konsumenten zeigen noch das alte Set inkl. „Soziale Lage". Diese Story migriert sie und stellt sicher: MSS, Wohnlage, Bodenrichtwert, Umweltgerechtigkeit bleiben als neutraler Kontext (kein „besser"), nicht mehr als Score-Dimension.

## Acceptance Criteria

1. **AC-1 (Inspector-Labels + Severity):**
   **Given** `kiez-score-display.ts`
   **When** der Inspector die Score-Section rendert
   **Then**:
   - `DIMENSION_LABELS_DE`: `'ruhe-luft': 'Ruhe & Luft'`, `'gruen-hitze': 'Grün & Hitze'`, `'mobilitaet': 'Mobilität'`, `'versorgung': 'Versorgung'`, `'wohnschutz': 'Wohnschutz'`; `soziale-lage`-Eintrag entfernt
   - der `scaleFor()`-Spezialfall `if (dimension === 'soziale-lage') return {...severity:'neutral'}` entfällt
   - Wohnschutz nutzt normale Severity-Skala (positiv-eindeutig: hoher Schutz = success)

2. **AC-2 (Inspector-Score-Komponenten):**
   **Given** Score verfügbar
   **When** Hero/Ring/Section/Dimension-Row rendern
   **Then** zeigen sie die fünf neuen Dimensionen; keine „Soziale Lage"-Row mehr im Score; `data-testid`-Attribute auf `kiez-score-dim-{neuer-slug}` umgestellt
   **And** `get-kiez-score.ts` + `ui-context.svelte.ts` Score-Typen kompilieren gegen das neue Set

3. **AC-3 (Compare-Block):**
   **Given** Compare-Mode
   **When** zwei Lagen verglichen werden
   **Then** der Score-Compare-Block zeigt die fünf neuen Dimensionen; Wohnschutz mit Diff-Indikator (evaluativ, „besser"-Pfeil erlaubt, da positiv-eindeutig); kein soziale-lage-Vergleich im Score

4. **AC-4 (Ranking-Tabelle):**
   **Given** `ranking-types.ts` `RankingRow` + `score-ranking-table`
   **When** das Ranking rendert
   **Then**:
   - `RankingRow`: `sozialeLage` raus, `gruen` → `gruenHitze`, `wohnschutz` rein
   - Tabellen-Spalten + Header-Labels spiegeln das neue Set
   - Lade-Pfad (`+page.server.ts` der Ranking-Page) mappt DB-Spalten `gruenHitze`/`wohnschutz` (Content-Texte der Page = 9.5)

5. **AC-5 (Choropleth-Score-Layer):**
   **Given** die Karten-Score-Layer
   **When** ein User einen Kiez-Score-Layer aktiviert
   **Then** in `layer-style-builder.ts`, `layer-palette-filter.ts`, `layer-synonyms.ts`, `choropleth-family`:
   - Layer-Slug-Mapping: `kiez-score-gruen` → `kiez-score-gruen-hitze`; `kiez-score-soziale-lage` entfernt; `kiez-score-wohnschutz` neu (Gut-Familie/Grün, positiv-eindeutig)
   - Style-Profil `choropleth-kiez-score-soziale-lage` (Strukturell/Indigo) entfällt aus dem Score-Kontext (Profil-Definition darf bleiben falls MSS-Layer es als neutraler Kontext nutzt — siehe AC-7)
   - LAYER_EXPLAIN_DE-Labels: „Kiez-Score · Grün & Hitze", „Kiez-Score · Wohnschutz"; „Kiez-Score · Soziale Lage" raus
   - layer-synonyms: soziale-lage-Eintrag raus, wohnschutz-Eintrag rein (`['wohnschutz','milieuschutz','erhaltung','kiez-score']`)
   - Bundle `G: Kiez-Score` enthält jetzt die 5 neuen Dimensions-Layer

6. **AC-6 (OG-Cards):**
   **Given** `score-card-data.ts`
   **When** eine OG-Card gebaut wird
   **Then**:
   - `ScoreLike` referenziert `gruenHitze` + `wohnschutz` statt `gruen`/`sozialeLage`
   - `DIM_LABELS`: `gruenHitze: 'Grün & Hitze'`, `wohnschutz: 'Wohnschutz'`
   - die OG-Card zeigt die positiv-eindeutigen Dimensionen; der bisherige Stigma-Ausschluss von soziale-lage ist gegenstandslos (soziale-lage ist kein Score-Wert mehr)

7. **AC-7 (LLM-Renderer + neutraler Kontext):**
   **Given** `aggregate-renderer.ts` `renderScoreSection`
   **When** Markdown gerendert wird
   **Then**:
   - `ScoreLike`-Interface: `sozialeLage` raus, `gruen` → `gruenHitze`, `wohnschutz` rein
   - Score-Section listet die fünf neuen Dimensionen; Heading/Hinweis nennen „Umwelt- & Infrastruktur-Score" statt generischem 5-Dim-Aggregat
   - MSS/Soziale Lage erscheint NICHT mehr in der Score-Section
   - **Stigma-Disziplin:** wo MSS/Wohnlage/Bodenrichtwert/Umweltgerechtigkeit als neutraler Kontext gerendert werden (eigene Blöcke, nicht Score), bleibt categorical-neutral: keine Severity, kein „besser"-Pfeil

8. **AC-8 (Tests + repo-weiter check):**
   **Given** ADR-012
   **When** Tests + check laufen
   **Then**:
   - alle Konsumenten-Unit/Component-Tests auf neues Set umgestellt (kiez-score-display, score-card-data, aggregate-renderer, layer-style-builder, layer-palette-filter, ranking)
   - `tests/e2e/kiez-score-flow.e2e.ts`: `kiez-score-dim-soziale-lage`-Assertion → neue Slugs (z. B. `kiez-score-dim-wohnschutz`)
   - **Gate:** `pnpm check` repo-weit grün (0 neue Errors), `pnpm test:unit` grün
   - Stigma-Severity-Guard im E2E bleibt sinngemäß (jetzt: neutraler MSS-Kontext-Block trägt keine Wertung)

## Tasks / Subtasks

- [ ] **Task 1: Inspector-Display + Komponenten** (AC: #1, #2)
  - [ ] 1.1 (RED) `kiez-score-display.test.ts` auf neues Set
  - [ ] 1.2 `kiez-score-display.ts`: DIMENSION_LABELS_DE + scaleFor (soziale-lage-Spezialfall raus, wohnschutz normale Severity)
  - [ ] 1.3 Inspector-Score-Komponenten (section/dimension-row/hero/ring): data-testids + Rendering
  - [ ] 1.4 `value-formatters.ts` Case `kiez-score-soziale-lage` raus, wohnschutz/gruen-hitze rein
  - [ ] 1.5 `layer-explain.ts` kiez-score-Einträge umstellen
  - [ ] 1.6 `get-kiez-score.ts` + `ui-context.svelte.ts` Typen verifizieren

- [ ] **Task 2: Compare-Block** (AC: #3)
  - [ ] 2.1 (RED) Compare-Score-Test
  - [ ] 2.2 kiez-score-compare-block auf 5 neue Dimensionen; Wohnschutz evaluativ

- [ ] **Task 3: Ranking** (AC: #4)
  - [ ] 3.1 `ranking-types.ts` RankingRow umstellen
  - [ ] 3.2 score-ranking-table Spalten/Labels
  - [ ] 3.3 wo-lebt-es-sich-gut `+page.server.ts` DB-Mapping (gruenHitze/wohnschutz) — nur Daten-Mapping, Texte = 9.5

- [ ] **Task 4: Choropleth-Score-Layer** (AC: #5)
  - [ ] 4.1 (RED) layer-style-builder.test.ts + layer-palette-filter.test.ts
  - [ ] 4.2 layer-style-builder: Slug→Profil-Map (gruen-hitze, wohnschutz; soziale-lage raus), Paint+Legend-Cases
  - [ ] 4.3 layer-palette-filter LAYER_EXPLAIN_DE
  - [ ] 4.4 layer-synonyms
  - [ ] 4.5 choropleth-family falls Score-Layer-Referenz

- [ ] **Task 5: OG-Cards** (AC: #6)
  - [ ] 5.1 (RED) score-card-data-Test
  - [ ] 5.2 score-card-data.ts ScoreLike + DIM_LABELS + dims-Array

- [ ] **Task 6: LLM-Renderer** (AC: #7)
  - [ ] 6.1 (RED) aggregate-renderer-Test (renderScoreSection)
  - [ ] 6.2 ScoreLike-Interface + renderScoreSection (5 neue Dims, „Umwelt- & Infrastruktur-Score", MSS raus aus Score)
  - [ ] 6.3 prüfen ob MSS als eigener neutraler Kontext-Block gerendert wird (falls ja: neutral halten)

- [ ] **Task 7: E2E + repo-weiter check** (AC: #8)
  - [ ] 7.1 kiez-score-flow.e2e.ts Slugs umstellen
  - [ ] 7.2 `pnpm check` repo-weit grün
  - [ ] 7.3 `pnpm test:unit` grün

## Dev Notes

### Konsumenten-Inventar (verifiziert, mit Pfaden)

| Datei | Aktuell | Änderung |
|---|---|---|
| `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` | DIMENSION_LABELS_DE (5 inkl. soziale-lage); scaleFor soziale-lage-Sonderfall | Labels neu; Sonderfall raus; wohnschutz |
| `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` (~416) | Case `kiez-score-soziale-lage` neutral-flag | Case raus; gruen-hitze/wohnschutz |
| `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (~205) | kiez-score-soziale-lage Erklärung | umstellen |
| `src/lib/data/ranking-types.ts` (7–18) | RankingRow 5 Felder inkl. sozialeLage | gruenHitze/wohnschutz |
| `src/lib/server/og/score-card-data.ts` (27, 29–34, 40–45) | ScoreLike 4 Dims (Picks gruen, exkl. sozialeLage); DIM_LABELS | gruenHitze + wohnschutz |
| `src/lib/server/llms/internal/aggregate-renderer.ts` (198–229) | ScoreLike 5 Felder; renderScoreSection „5-Dimensionen-Aggregat" inkl. Soziale Lage | gruenHitze/wohnschutz; MSS raus; „Umwelt- & Infrastruktur-Score" |
| `src/lib/components/atlas/internal/layer-style-builder.ts` (112–116, 228–248, 803–854) | Slug→Profil-Map; choropleth-kiez-score-ordinal-4 + -soziale-lage; Paint-Cases | gruen-hitze + wohnschutz auf ordinal-4; soziale-lage-Score-Mapping raus |
| `src/lib/components/atlas/internal/layer-palette-filter.ts` (49–53) | LAYER_EXPLAIN_DE 5 Einträge | gruen-hitze + wohnschutz; soziale-lage raus |
| `src/lib/components/atlas/internal/layer-synonyms.ts` (27) | `kiez-score-soziale-lage` Synonyme | raus; wohnschutz rein |
| `src/routes/(with-header)/wo-lebt-es-sich-gut/+page.server.ts` (52–56, 79–83) | DB-Property-Mapping sozialeLage/gruen | gruenHitze/wohnschutz |
| `tests/e2e/kiez-score-flow.e2e.ts` | `kiez-score-dim-soziale-lage` Assertion | neue Slugs |

### Aktuelle Label-Map (zu ändern)

`kiez-score-display.ts`:
```ts
export const DIMENSION_LABELS_DE: Record<KiezScoreDimension, string> = {
  'ruhe-luft': 'Ruhe & Luft',
  gruen: 'Grün',
  mobilitaet: 'Mobilität',
  'soziale-lage': 'Soziale Lage',
  versorgung: 'Versorgung'
};
// scaleFor: if (dimension === 'soziale-lage') return { label, severity: 'neutral' };
```

### Style-Profile (verifiziert)

`layer-style-builder.ts` Slug→Profil (Zeilen ~112–116):
```ts
'kiez-score-ruhe-luft': 'choropleth-kiez-score-ordinal-4',
'kiez-score-gruen': 'choropleth-kiez-score-ordinal-4',
'kiez-score-mobilitaet': 'choropleth-kiez-score-ordinal-4',
'kiez-score-soziale-lage': 'choropleth-kiez-score-soziale-lage',
'kiez-score-versorgung': 'choropleth-kiez-score-ordinal-4'
```
→ neu: `kiez-score-gruen-hitze` + `kiez-score-wohnschutz` auf `choropleth-kiez-score-ordinal-4` (Gut-Familie); `kiez-score-soziale-lage`-Zeile raus. Das Profil `choropleth-kiez-score-soziale-lage` (Strukturell/Indigo) NICHT zwingend löschen — falls der reine MSS-Layer (`mss-gesamtindex-2025`) als neutraler Kontext-Layer auf der Karte bleibt, kann er das neutrale Strukturell-Profil weiternutzen. Prüfen welcher Layer es referenziert; nur die Score-Layer-Zuordnung entfernen.

### Stigma-Disziplin (kritisch)

ADR-015: MSS, Umweltgerechtigkeit, Wohnlage, Bodenrichtwert bleiben **neutraler Kontext**, kein „besser". Diese Layer existieren weiter als eigenständige Inspector-/Karten-Layer (NICHT entfernen — das ist nicht Epic 9.4). Nur ihre Rolle als Score-Dimension entfällt. Wohnschutz dagegen ist im Score positiv-eindeutig (Verdrängungsschutz vorhanden = gut), darf evaluative Severity + Diff-Pfeil tragen.

`project_compare_editorial_profiles`: Mietspiegel/Wohnlage = categorical-neutral; laerm = ordinal. Wohnschutz (neu evaluativ) ggf. in `EVALUATIVE_PROFILES` aufnehmen falls Compare-Diff-Indikator gewünscht.

### Architektur-Compliance

- #2 Files <500
- #6/#7 strict, keine toten Kommentare
- #15 Editorial: MSS/Wohnlage neutral, Wohnschutz positiv-eindeutig
- a11y: ValueChip-Severity-Tokens konsistent, kein reines Farb-Signal

### Previous Story Intelligence

- **Story 1.28:** Inspector-Score-Section, ValueChip-Severity, LLM-Export, OG-Pattern
- **Story 1.31:** Choropleth-Score-Familien Gut (grün) / Strukturell (indigo) — Strukturell war für soziale-lage
- **Story 2.9b:** Ranking-Tabelle
- **Memory `project_compare_editorial_profiles`:** evaluative vs categorical-neutral Profile
- **Memory `feedback_no_lebenswert`:** Begriff „Lebenswert" verboten; „Umwelt- & Infrastruktur-Score" als Score-Name
- **Memory `feedback_pills_over_native_selects`, `feedback_mobile_first`:** falls UI-Controls berührt

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts]
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts]
- [Source: src/lib/components/atlas/internal/layer-palette-filter.ts]
- [Source: src/lib/components/atlas/internal/layer-synonyms.ts]
- [Source: src/lib/data/ranking-types.ts]
- [Source: src/lib/server/og/score-card-data.ts]
- [Source: src/lib/server/llms/internal/aggregate-renderer.ts]
- [Source: src/lib/data/get-kiez-score.ts]
- [Source: src/lib/state/ui-context.svelte.ts]
- [Source: tests/e2e/kiez-score-flow.e2e.ts]
- [Source: _bmad-output/implementation-artifacts/9-3-pipeline-recompute-rerun.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- `/tmp/check-94b.log` — repo-weit nur noch 2 Errors (beide pre-existing de/en, NICHT score)
- `/tmp/test-94.log` — 13 geänderte Test-Files, 165 Tests grün

### Completion Notes List

- Alle Score-Konsumenten auf ADR-015-Set migriert (gruen→gruen-hitze, soziale-lage raus, wohnschutz neu):
  - **Inspector:** kiez-score-display (Labels + scaleFor, soziale-Sonderfall raus, Wohnschutz normale Severity), value-formatters, layer-explain, kiez-score-hero/ring/section, kiez-hero.
  - **Compare:** kiez-score-compare-block (5 Dims, Wohnschutz evaluativ).
  - **Ranking:** ranking-types RankingRow, score-ranking-table (Spalten/Sort/Labels, Soziale-Disclaimer entfernt), wo-lebt-es-sich-gut +page.server (DB-Mapping).
  - **Choropleth:** layer-style-builder (Slug→Profil, soziale-lage-Profil komplett entfernt da orphaned — MSS nutzt eigenes choropleth-mss-12), layer-palette-filter, layer-synonyms, choropleth-family, layer-palette FREQUENT_SLUGS.
  - **OG:** score-card-data (ScoreLike Pick + DIM_LABELS, jetzt 5 Dims; page-card-template iteriert dims dynamisch).
  - **LLM:** aggregate-renderer ScoreLike + renderScoreSection („Umwelt- & Infrastruktur-Score", MSS raus aus Score), llm-export-builder Footer-Hinweis.
- **Stigma-Disziplin gewahrt:** MSS (`mss-gesamtindex-2025`), Wohnlage, Bodenrichtwert bleiben strukturell/neutraler Kontext-Layer (NICHT entfernt, kein „besser"). Wohnschutz ist im Score positiv-eindeutig (Gut-Familie, success-Severity).
- Tests migriert: kiez-score-display/-section/-ring, kiez-hero, bezirk-/kiez-renderer, llm-export-builder, score-card-data, score-ranking-table, choropleth-family, layer-style-builder, layer-synonyms. E2E kiez-score-flow Slugs umgestellt.
- **Gate (AC-8):** `pnpm check` repo-weit grün bis auf 2 pre-existing `de/en`-Vergleichs-Errors in `mount.ts` + `+layout.svelte` (i18n Phase-1-DE-only-Artefakt, existierten vor Epic 9, NICHT score-bezogen → 0 neue Errors). Geänderte Test-Files grün.
- **NICHT in 9.4 (→ 9.5 Content):** `src/lib/data/layer-methodology.ts` + `/methodik/kiez-score/+page.svelte` tragen noch alte Dimensions-Inhalte (kein Type-Error, reine Content-Strings). Wandern mit der Content-Migration.

### File List

**Geändert (Source):**
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts`
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts`
- `src/lib/components/atlas/charts/kiez-score-hero.svelte`
- `src/lib/components/atlas/charts/kiez-score-ring.svelte`
- `src/lib/components/atlas/kiez-hero.svelte`
- `src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte`
- `src/lib/data/ranking-types.ts`
- `src/lib/components/atlas/score-ranking-table.svelte`
- `src/routes/(with-header)/wo-lebt-es-sich-gut/+page.server.ts`
- `src/lib/components/atlas/internal/layer-style-builder.ts`
- `src/lib/components/atlas/internal/layer-palette-filter.ts`
- `src/lib/components/atlas/internal/layer-synonyms.ts`
- `src/lib/components/atlas/internal/choropleth-family.ts`
- `src/lib/components/atlas/layer-palette.svelte`
- `src/lib/server/og/score-card-data.ts`
- `src/lib/server/llms/internal/aggregate-renderer.ts`
- `src/lib/utils/llm-export-builder.ts`

**Geändert (Tests):**
- kiez-score-display.test.ts, kiez-score-section.svelte.test.ts, kiez-score-ring.svelte.test.ts, kiez-hero.svelte.test.ts, bezirk-renderer.test.ts, kiez-renderer.test.ts, llm-export-builder.test.ts, score-card-data.test.ts, score-ranking-table.svelte.test.ts, choropleth-family.test.ts, layer-style-builder.test.ts, layer-synonyms.test.ts
- `tests/e2e/kiez-score-flow.e2e.ts`

## Change Log

- 2026-05-21: Story 9.4 Konsumenten-Migration. Inspector/Compare/Ranking/Choropleth/OG/LLM + Tests auf ADR-015-Dimensionen. soziale-lage-Score-Profil entfernt, MSS bleibt neutraler Kontext. Repo-weiter check grün (2 pre-existing de/en-Errors out-of-scope).
