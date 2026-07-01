# Story 13.4: Konsumenten-Migration (UI + Map + OG + LLM)

Status: ready-for-dev

> **Anker:** ADR-012 (TDD wo Logik, Styling ausgenommen). Strukturell analog Story 9.4. Größter Blast-Radius des Epics.
> **Hard-Block:** Story 13.3 `done` (Kultur-Werte in DB + `kiez-scores.json` + `kiez-score-kultur`-Layer im MANIFEST).

## Story

As a User,
I want dass alle Score-Darstellungen die Kultur-Dimension zeigen,
so that Inspector, Compare, Ranking, Karte, OG-Cards und LLM-Export konsistent sind.

## Kontext: Warum dieser Change

Viele Konsumenten enumerieren die 5 Dimensionen hardcoded (inline-Arrays, Label-Maps, per-Dimension-`<td>`/`if`-Blöcke). Es gibt KEINE einzige Quelle der Wahrheit auf der Client-Seite. Jede dieser Stellen braucht `kultur`. Data-driven Komponenten (die über `score.dimensions` iterieren) brauchen nur die Label-Map.

## Acceptance Criteria

1. **AC-1 (Labels + Charts):**
   **Given** das 6er-Set
   **When** ich Label-Map + Chart-Arrays migriere
   **Then** `DIMENSION_LABELS_DE` (kiez-score-display.ts), die inline-Arrays in `kiez-score-ring.svelte` / `kiez-score-hero.svelte` / `kiez-score-compare-block.svelte` enthalten `kultur` → Label „Kultur"
   **And** der Score-Ring rendert 6 Segmente ohne Layout-Bruch

2. **AC-2 (Ranking-Tabelle):**
   **Given** die hardcoded Ranking-Spalten
   **When** ich `score-ranking-table.svelte` + `ranking-types.ts` migriere
   **Then** `NumericSortKey`/`NUMERIC_SORT_KEYS`/`COLUMN_LABEL` + die Body-`<td>`-Zellen + `RankingRow.kultur` enthalten Kultur
   **And** die Kultur-Spalte ist sortierbar wie die anderen

3. **AC-3 (OG + LLM):**
   **Given** OG-Card + LLM-Renderer
   **When** ich `score-card-data.ts` + `aggregate-renderer.ts` migriere
   **Then** beide `dims`-Arrays (OG) + `renderScoreSection`-Push (LLM) enthalten `kultur`
   **And** OG-Card rendert 6 Dimensionen ohne Überlauf

4. **AC-4 (Karte/Choropleth):**
   **Given** der `kiez-score-kultur`-Map-Layer aus 13.3
   **When** ich die Layer-Registrierung migriere
   **Then** `choropleth-family.ts` (`'kiez-score-kultur': 'gut'` + classification `'manual-quartile'`), `layer-style-builder.ts` (Style-Profil), `layer-palette-filter.ts` (Display-Name „Kiez-Score · Kultur"), `value-formatters.ts` (Switch-Case), `layer-explain.ts` (Erklär-Block), `layer-methodology.ts` (Methodik-Block) enthalten Kultur
   **And** der Layer rendert in Gut-Grün (ADR-015, positiv-eindeutig), Farbe nicht alleiniger Informationsträger (WCAG)

5. **AC-5 (TDD + grün):**
   **Given** ADR-012
   **When** Tests + Check laufen
   **Then** betroffene Komponenten-Tests decken Kultur ab, `pnpm test` 100% grün, `pnpm check` 0 Errors (auch die aus 13.1 erwarteten sind jetzt behoben)

## Tasks / Subtasks

- [ ] **Task 1: Label-Map + Chart-Arrays** (AC: #1)
  - [ ] 1.1 `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts`: `DIMENSION_LABELS_DE` (Z.9–15) + `'kultur': 'Kultur'`
  - [ ] 1.2 `src/lib/components/atlas/charts/kiez-score-ring.svelte`: inline-Array (Z.16–22) + `kultur`. Ring-Segmente prüfen (Layout bei 6)
  - [ ] 1.3 `src/lib/components/atlas/charts/kiez-score-hero.svelte`: inline-Array (Z.9–15) + `kultur`
  - [ ] 1.4 `src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte`: inline-Array (Z.25–31) + `kultur`
  - [ ] 1.5 Hinweis: `kiez-score-section.svelte` + `kiez-score-dimension-row.svelte` sind data-driven (iterieren `score.dimensions`) → kein Edit außer Label-Map (1.1)

- [ ] **Task 2: Ranking-Tabelle** (AC: #2)
  - [ ] 2.1 (RED) Komponenten-Test: Kultur-Spalte sichtbar + sortierbar
  - [ ] 2.2 `src/lib/data/ranking-types.ts`: `RankingRow` (Z.13–17) + `kultur: number | null`
  - [ ] 2.3 `src/lib/components/atlas/score-ranking-table.svelte`: `NumericSortKey` (Z.36–41), `NUMERIC_SORT_KEYS` (Z.47–54), `COLUMN_LABEL` (Z.58–67), Body-`<td>` (Z.303–307) + `kultur`
  - [ ] 2.4 `score-comparison-table.svelte` ist data-driven (rows) → kein Edit

- [ ] **Task 3: OG + LLM** (AC: #3)
  - [ ] 3.1 `src/lib/server/og/score-card-data.ts`: `ScoreLike` Pick (Z.25–28), `DIM_LABELS` (Z.30–36, Kurzlabel „Kultur"), beide `dims`-Arrays (Z.42–48 + Z.53–59) + `kultur`
  - [ ] 3.2 `src/lib/server/llms/internal/aggregate-renderer.ts`: `ScoreLike` (Z.178–185), `renderScoreSection`-Push (Z.195–201) + Kultur-Zeile
  - [ ] 3.3 OG-Card-Smoke: 6 Dimensionen rendern ohne Überlauf (ggf. Layout justieren)

- [ ] **Task 4: Karte/Choropleth** (AC: #4)
  - [ ] 4.1 `src/lib/components/atlas/internal/choropleth-family.ts`: `LAYER_TO_CHOROPLETH_FAMILY` (Z.15–35) + `'kiez-score-kultur': 'gut'`, `LAYER_CLASSIFICATION_METHOD` (Z.60–76) + `'manual-quartile'`
  - [ ] 4.2 `src/lib/components/atlas/internal/layer-style-builder.ts`: `LAYER_STYLE_PROFILE` (Z.113–119) + `'kiez-score-kultur': 'choropleth-kiez-score-ordinal-4'`
  - [ ] 4.3 `src/lib/components/atlas/internal/layer-palette-filter.ts`: `LAYER_EXPLAIN_DE` (Z.49–54) + `'kiez-score-kultur': 'Kiez-Score · Kultur'`
  - [ ] 4.4 `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts`: Switch-Case (Z.408–419) + `kiez-score-kultur`
  - [ ] 4.5 `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts`: Erklär-Block (Z.190–217) + Kultur
  - [ ] 4.6 `src/lib/data/layer-methodology.ts`: Methodik-Block (~Z.420–510) + `kiez-score-kultur` (Terme, OSM/ODbL-Quelle, Dämpfung)
  - [ ] 4.7 Optional: `layer-synonyms.ts` Kultur-Synonyme

- [ ] **Task 5: Verify** (AC: #5)
  - [ ] 5.1 `pnpm test` grün, `pnpm check` 0 Errors
  - [ ] 5.2 Smoke: Inspector (6 Dim), Ring (6 Segmente), Ranking (Kultur-Spalte), Karte (`kiez-score-kultur` in Gut-Grün), OG-Card

## Dev Notes

### Ist-Zustand — vollständige Änderungsliste (verifiziert 2026-06-07)

**Data-driven (kein Edit außer Label-Map):** `kiez-score-section.svelte`, `kiez-score-dimension-row.svelte` (nutzt `DIMENSION_LABELS_DE`), `score-comparison-table.svelte`, `comparison-types.ts` (generisch), `get-kiez-score.ts`/DB-Queries (schema-driven), `llm-export-builder.ts` (iteriert `score.dimensions`), `webmcp/tools/get-kiez-profile.ts` (serialisiert keine Dimensionen), `score-bar.svelte`.

**Hardcoded (Pflicht-Edit):**
| Datei | Stelle |
|-------|--------|
| `kiez-score-display.ts` | `DIMENSION_LABELS_DE` Z.9–15 |
| `kiez-score-ring.svelte` | inline-Array Z.16–22 |
| `kiez-score-hero.svelte` | inline-Array Z.9–15 |
| `kiez-score-compare-block.svelte` | inline-Array Z.25–31 |
| `score-ranking-table.svelte` | Z.36–41, 47–54, 58–67, 303–307 |
| `ranking-types.ts` | `RankingRow` Z.13–17 |
| `score-card-data.ts` | Z.25–28, 30–36, 42–48, 53–59 |
| `aggregate-renderer.ts` | Z.178–185, 195–201 |
| `choropleth-family.ts` | Z.15–35, 60–76 |
| `layer-style-builder.ts` | Z.113–119 |
| `layer-palette-filter.ts` | Z.49–54 |
| `value-formatters.ts` | Z.408–419 |
| `layer-explain.ts` | Z.190–217 |
| `layer-methodology.ts` | ~Z.420–510 |

(Routes/Methodik-Page/SCORE_DIMS-Server in Story 13.5.)

### Choropleth-Familie

Kultur ist wohltuend → `'gut'` (Gut-Grün, ADR-015), wie versorgung/gruen-hitze/wohnschutz. Nicht `'last'` (Vermillion, für Belastung), nicht `'strukturell'` (Indigo, für MSS/Bodenwerte). Classification `'manual-quartile'` wie die anderen Score-Layer.

### Was nicht brechen darf

- Data-driven Komponenten dürfen NICHT auf hardcoded 6-Listen umgebaut werden (sie funktionieren generisch).
- Bestehende 5 Dimensionen in allen Listen erhalten.
- WCAG: Kultur-Choropleth nicht farb-only (Pattern/Label).
- **Composite/overall unberührt (Option C, Story 13.1):** Ring-Mitte + OG-Composite-Zahl bleiben das Mittel der fünf Composite-Dimensionen. Kultur erscheint als 6. Ring-Segment / Dimensions-Zeile / Ranking-Spalte, zählt aber NICHT in die Gesamt-Zahl. `score.overall` kommt aus der DB (5-Dim) und wird hier nur angezeigt, nicht neu gerechnet.

### Architektur-Compliance

- **MUST #2:** Komponenten < 500 Zeilen halten.
- **MUST #14:** UI-Strings (Label „Kultur") konsistent (Phase-1 DE-only, kein Paraglide-Zwang da bestehende Komponenten hardcoded DE sind).
- **MUST #7:** typsicher (RankingRow, ScoreLike).

## References

(Alle Pfade unter `src/`, Zeilen aus Subsystem-Map 2026-06-07)
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` (Z.9–15)
- `src/lib/components/atlas/charts/kiez-score-ring.svelte` (Z.16–22), `kiez-score-hero.svelte` (Z.9–15)
- `src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte` (Z.25–31)
- `src/lib/components/atlas/score-ranking-table.svelte` (Z.36–41, 47–54, 58–67, 303–307)
- `src/lib/data/ranking-types.ts` (Z.13–17)
- `src/lib/server/og/score-card-data.ts` (Z.25–59)
- `src/lib/server/llms/internal/aggregate-renderer.ts` (Z.178–201)
- `src/lib/components/atlas/internal/choropleth-family.ts` (Z.15–35, 60–76), `layer-style-builder.ts` (Z.113–119), `layer-palette-filter.ts` (Z.49–54)
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` (Z.408–419), `layer-explain.ts` (Z.190–217)
- `src/lib/data/layer-methodology.ts` (~Z.420–510)
- `docs/adr/ADR-012-tdd-mandate.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/9-4-konsumenten-migration-ui-map-og-llm.md` (Muster)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.4 erstellt (ready-for-dev). Konsumenten-Migration für Kultur: 14 hardcoded UI/Map/OG/LLM-Stellen, Gut-Grün-Choropleth, WCAG.
