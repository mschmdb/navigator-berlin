# Story 8.1b: Inspector-Card-System + Visual-Primitives

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want dass jede Inspector-Sektion als Card mit aussagekräftigem Visual-Summary erscheint (auch im eingeklappten Zustand),
so that ich auf einen Blick erfasse was eine Sektion enthält, ohne sie aufklappen zu müssen.

**Hintergrund:** Foundation-Story für das visuelle Redesign (User-Decision 2026-05-20, mehr Daten-Dichte, Datenjournalismus-Look). Baut die geteilten Bausteine einmal, bevor 8.2b-Layer-Cards + Kiez-Score-Hero + Wahl-Card sie konsumieren. Verhindert doppelt gebaute Chart-Primitive + uneinheitliche Collapsible-Logik.

## Acceptance Criteria

1. **Given** der Visual-Summary-Constraint aus ADR-014 (Abschnitt 4), **When** ich eine `inspector-card.svelte` mit collapsed/expanded-State implementiere, **Then** der collapsed-State rendert immer einen Visual-Summary-Slot + Kernwert, kein blindes Collapsible. Hero (Kiez-Score) ist default expanded, thematische Cards default collapsed.
2. **Given** die Visual-Typen aus ADR-014 Spalte 3, **When** ich die Chart-Primitive baue (Score-Bar mit Median-Anker, Verteilungs-Balken, Coverage-Bar, Distanz-Ring, Kiez-Score-Ring, Sparkline-reuse aus Story 6.3), **Then** jedes Primitive ist eine eigenständige a11y-taugliche Komponente mit sr-only-Daten-Tabelle, konsistenter stigma-sicherer Palette (kein Rot-Grün-Wertung, Memory `project_compare_editorial_profiles`).
3. **Given** Kiez-Score-Hero, **When** das Hero rendert, **Then** Ring-Darstellung (User-Tendenz 2026-05-20) mit Gesamt-Score zentral + 5 Dimensionen. Compare-Fallback auf 5-Dim-Bar-Stack mit A/B-Paaren (Ring mit zwei Datensätzen unleserlich).
4. **Given** Performance-Constraint, **When** viele Cards collapsed mit Mini-Visual rendern, **Then** Visuals werden lazy gerendert (collapsed-Visual leichtgewichtig, schweres Detail erst bei expand).

## Tasks / Subtasks

- [x] Task 1: `inspector-card.svelte` Collapsible-Primitive (AC: #1, #4)
  - [x] `src/lib/components/atlas/inspector-panel/inspector-card.svelte`: Props `title`, `defaultExpanded = false`, Snippet-Slots `summary` (immer sichtbar, collapsed + expanded) + `detail` (nur expanded). Kein blindes Collapsible: `summary`-Slot ist Pflicht.
  - [x] Expand/Collapse a11y: `<button aria-expanded>` als Header, `aria-controls`, Region-Label. Tastatur: Enter/Space toggelt (native button). Fokus-Ring sichtbar.
  - [x] Lazy-Detail: `detail`-Snippet erst rendern wenn expanded (Svelte `{#if expanded}`), damit schwere Charts collapsed nicht im DOM hängen (AC #4).
  - [x] `{@const}` nur als direktes Kind erlaubter Blöcke (User-Global-Svelte-Note).
- [x] Task 2: Chart-Primitive bauen (AC: #2)
  - [x] `src/lib/components/atlas/charts/score-bar.svelte`: horizontaler Balken 0-100 mit Median-/Anker-Tick (z.B. Berlin-Median). Props `value`, `min`, `max`, `anchorValue?`, `anchorLabel?`, `unit?`, `layerName` (a11y).
  - [x] `distribution-bar.svelte`: gestapelte Klassen-Verteilung (ordinal), dominante Klasse als Headline. Props `classes: { label, share, severity }[]`, `dominant`, `neutral`.
  - [x] `coverage-bar.svelte`: 0-100% Flächenanteil. Props `share`, `label`.
  - [x] `distance-ring.svelte`: nächste Distanz als Ring/Radial (POI). Props `distanceMeters`, `label`, optional `countInPolygon`.
  - [x] `kiez-score-ring.svelte`: Gesamt-Score zentral + 5 Dimensionen als Ring-Segmente.
  - [x] Sparkline: NICHT neu gebaut. `climate-sparkline.svelte` bleibt Referenz/Reuse-Pattern (vote-share/Wahl reuse 6.3 erst in 8.2b).
  - [x] Jedes Primitive: sr-only `<table>` mit den Rohwerten. Stigma-sichere Palette: KEIN Rot-Grün-Wertungssprung, `neutral`-Modus + neutrale Plex-Cartography-Hues. Severity nur wo evaluierbar; categorical-neutral/Stigma-Layer neutral.
- [x] Task 3: Kiez-Score-Hero auf Ring + Compare-Fallback (AC: #3)
  - [x] Hero-Komponente nutzt `kiez-score-ring.svelte`. Gesamt-Score zentral, 5 Dimensionen (Ruhe-Luft / Grün / Mobilität / Soziale Lage / Versorgung).
  - [x] Severity-Mapping aus bestehendem `kiez-score-display.ts` (`scaleFor`/`scaleForOverall`) wiederverwendet; Soziale-Lage bleibt neutral (Stigma-Lock, in `scaleFor` enthalten).
  - [x] Compare-Variante: 5-Dim-Bar-Stack mit A/B-Paaren statt Doppel-Ring (ADR-014 Abschnitt 5).
  - [x] Default expanded (Hero) via `inspector-card defaultExpanded`, thematische Cards default collapsed.
- [x] Task 4: Palette + Tokens konsolidieren (AC: #2)
  - [x] Stigma-sichere Chart-Palette `chart-palette.ts` zentral (kein Inline-Hex). Reuse Severity-Token (`--severity-*`) + kategorische `--chart-cat-*` aus app.css.
- [x] Task 5: Tests (TDD, AC-Mapping)
  - [x] Pro Primitive vitest-browser Component-Test: rendert mit Beispieldaten, sr-only-Tabelle enthält Rohwerte, neutral-Flag setzt data-neutral. KEIN fetch im Test (Daten als Props).
  - [x] `inspector-card.svelte`: collapsed zeigt summary + kein detail im DOM, expand rendert detail, aria-expanded + aria-controls korrekt.
  - [x] `kiez-score-ring`/Hero: 5 Dimensionen + Gesamt rendern, Compare-Fallback Bar-Stack statt Ring.
  - [x] Skalen/Anker-Berechnung als Pure-Helper `chart-scale.ts` Test-First (11 Tests), Red-then-Green-History (ADR-012).

## Dev Notes

### Scope: Primitive, nicht Daten

8.1b baut NUR die wiederverwendbaren Bausteine (Card-Shell + Chart-Primitive + Hero). Die Primitive werden mit Beispiel-/Props-Daten getestet. Echte Layer-Aggregat-Daten kommen erst über 8.2a/8.2b. Hard-Block: 8.1b muss vor 8.2b stehen (Layer-Cards konsumieren diese Primitive). Braucht 8.1 (Card-System lebt im Inspector mit Level-Context).

### Visual-Summary-Pflicht (ADR-014 Abschnitt 4)

Jede collapsible Card trägt im collapsed-State Mini-Visual + Kernwert. Kein Aufklapp-Element ohne Vorschau. Hero (Kiez-Score-Ring) immer expanded, thematische Cards collapsed-mit-Visual. Das ist der Kern-Constraint dieser Story, nicht optional.

### Visual-Typ-Zuordnung (ADR-014 Abschnitt 3, Spalte 3)

- `numeric-median` → Score-Bar + Median-Anker (Luft, Bioklima)
- `ordinal-distribution` → Verteilungs-Balken + Median-Tick (Lärm, Wohnlage, MSS, Grünversorgung, Umweltgerechtigkeit)
- `coverage-share` → Coverage-Bar (Kaltluft, Leitbahn, Milieuschutz, Denkmal)
- `point-density` → Distanz-Ring (address) / Dichte-Dot (Polygon) (Kitas, Schulen, ÖPNV-Stops, Stolpersteine)
- `area-share` → Anteils-Bar (Grünanlagen, Spielplätze)
- `score-weighted` → Kiez-Score-Ring (Hero)
- `vote-share` → Stacked-Bar + Sparkline (Wahldaten, reuse 6.3)

### Stigma-Disziplin (strukturell)

Wohnlage, MSS, Stolpersteine, Kiez-Score-Composite NIE mit Wertungs-Pfeil/Rot-Grün (ADR-014 Abschnitt 5 + Memory `project_compare_editorial_profiles`, `feedback_no_lebenswert`). Die Primitive müssen einen neutralen Modus unterstützen. Soziale-Lage-Dimension immer neutral (`kiez-score-display.ts` macht das heute schon).

### A11y

Jedes Visual: sr-only Daten-Tabelle mit Rohwerten (Vorbild `climate-sparkline.svelte` DataTableAlternative). Charts sind Ergänzung, die Tabelle ist die zugängliche Wahrheit. Fokus-Ring + Tastatur-Bedienung für Card-Toggle.

### Performance (AC #4)

Collapsed = leichtes Mini-Visual (statisches SVG/CSS), expanded = ggf. interaktives LayerChart. LayerChart lazy laden (Memory `project_layerchart_v2`: Lazy-Load-Pattern, optimizeDeps.include, .lc-root-container, yBaseline=null für Sparklines). Detail-Snippet erst bei expand im DOM.

### Project Structure Notes

- Neue Files: `src/lib/components/atlas/inspector-panel/inspector-card.svelte`, `src/lib/components/atlas/charts/{score-bar,distribution-bar,coverage-bar,distance-ring,kiez-score-ring}.svelte`, Hero-Komponente, Chart-Palette-Tokens + Tests.
- Reuse: `climate-sparkline.svelte`, `value-chip.svelte`, `kiez-score-display.ts`, `kiez-score-compare-block.svelte`, `value-severity-mapping.ts`.
- Files <500 LOC, @lucide/svelte, kein `any`.
- Svelte-MCP: nach Komponenten-Bau `svelte-autofixer` laufen lassen (MCP-Server-Pflicht-Hinweis).

### TDD (ADR-012)

Komponenten mit Logik (Skalen, Anker, Verteilungs-Berechnung) Test-First. Skalen-Helper als Pure-Function extrahieren und ≥80% covern. Component-Smoke via vitest-browser-svelte, KEIN fetch-Spy (Memory `feedback_browser_test_fetch_spy`).

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#3-matrix-pro-layer-familie]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#4-visual-summary-pflicht-user-constraint-2026-05-20]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#5-compare-modus]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.1b]
- [Source: src/lib/components/atlas/climate-sparkline.svelte (Sparkline + sr-only-Tabelle Vorbild)]
- [Source: src/lib/components/atlas/inspector-panel/kiez-score-display.ts (Severity-Skala)]
- [Source: src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte (Compare-Fallback Vorlage)]
- [Source: src/lib/components/atlas/value-chip.svelte (Severity-Token)]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD dev-story)

### Debug Log References

- Runtime-Import von `KIEZ_SCORE_DIMENSIONS` aus `scripts/lib/kiez-score/types.ts` schlug im Browser-Bundle fehl (Cross-Boundary src↔scripts + falsche Pfad-Tiefe). Fix: Dimension-Order lokal als Konstante definiert (gleiche Lösung wie `kiez-score-compare-block.svelte`). `data/index.ts` re-exportiert nur den TYPE, nicht den Wert.
- `inspector-card`: `$state(defaultExpanded)` löste `state_referenced_locally`-Warnung aus. Bewusst nur Initialwert → mit `untrack(() => defaultExpanded)` ausgedrückt, Warnung weg.
- `href={methodikHref}` ohne `resolve()`: svelte-autofixer-Hinweis bewusst ignoriert, Projekt-Konvention (kiez-score-section + compare-block identisch, Phase-1-DE-only). `pnpm check` bestätigt: kein Error.

### Completion Notes List

- Scope-Disziplin: NUR Primitive + Card-Shell + Hero mit Props-/Beispieldaten. Keine echten Layer-Aggregate (kommen 8.2a/8.2b), keine Section adaptiert. Hard-Block für 8.2b damit erfüllt.
- TDD: Skalen-Math zuerst (`chart-scale.ts` 11 Tests red-then-green), dann Palette (3), dann Komponenten-Smoke (Card 5, 4 Primitive 7, Ring+Hero 5). Gesamt 31 neue Tests grün.
- Stigma-Disziplin strukturell: Palette zentral (kein Inline-Hex), `neutral`-Modus in distribution-bar, Soziale-Lage-Dimension neutral via `scaleFor`. Severity-Token + `--chart-cat-*` reused.
- A11y: jedes Visual hat sr-only `<table>` mit Rohwerten, SVG/Bar mit `role="img"` + aria-label. Card-Toggle nativer Button (Enter/Space), Fokus-Ring.
- Lazy-Render (AC #4): `detail`-Snippet erst bei expanded im DOM.
- Reuse: `kiez-score-display.ts` (scaleFor/scaleForOverall + Labels), `value-chip.svelte`, `editorial-disclaimer.svelte`, Severity/Chart-Tokens aus app.css.
- `pnpm check`: 0 neue Errors (die 2 verbleibenden = i18n de/en in webmcp/mount.ts + +layout.svelte, pre-existing Phase-1-Lock).

### File List

Neu:

- `src/lib/components/atlas/charts/internal/chart-scale.ts`
- `src/lib/components/atlas/charts/internal/chart-scale.test.ts`
- `src/lib/components/atlas/charts/internal/chart-palette.ts`
- `src/lib/components/atlas/charts/internal/chart-palette.test.ts`
- `src/lib/components/atlas/charts/score-bar.svelte`
- `src/lib/components/atlas/charts/distribution-bar.svelte`
- `src/lib/components/atlas/charts/coverage-bar.svelte`
- `src/lib/components/atlas/charts/distance-ring.svelte`
- `src/lib/components/atlas/charts/kiez-score-ring.svelte`
- `src/lib/components/atlas/charts/kiez-score-hero.svelte`
- `src/lib/components/atlas/charts/chart-primitives.svelte.test.ts`
- `src/lib/components/atlas/charts/kiez-score-ring.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/inspector-card.svelte`
- `src/lib/components/atlas/inspector-panel/inspector-card-probe.svelte`
- `src/lib/components/atlas/inspector-panel/inspector-card.svelte.test.ts`

## Change Log

- 2026-05-20: Story 8.1b implementiert (Inspector-Card-System + Visual-Primitives): `inspector-card` (Visual-Summary-Pflicht + Lazy-Detail), Chart-Primitive (score-bar/distribution-bar/coverage-bar/distance-ring/kiez-score-ring), `kiez-score-hero` (Ring single + Bar-Stack-Compare), zentrale stigma-sichere Palette + Skalen-Helper. 31 neue Tests, a11y sr-only-Tabellen. Status → review.
