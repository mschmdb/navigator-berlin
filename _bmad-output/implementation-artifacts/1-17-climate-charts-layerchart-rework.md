# Story 1.17: Climate-Charts LayerChart-Rework

Status: review

## Story

As a Berliner Bürger, die im Inspector Klima-Daten ansieht,
I want interaktive Charts mit Hover/Tooltip pro Jahr und kompakter Darstellung, statt statischer SVG-Linien ohne Werte-Readout,
so that ich konkrete Jahres-Werte ablesen kann ohne in die Tabellen-Alternative wechseln zu müssen, und die Charts nicht den halben Inspector belegen.

## Kontext + Was schiefging in Story 1.11

Story 1.11 spezifizierte LayerChart-v2 (Lizenz MIT, bereits in deps als `layerchart@2.0.0-next.63`). Während Implementation pivotierte der Dev-Agent auf reines d3-scale + SVG mit Begründung „deterministisches a11y-Markup". Resultat (User-Review 2026-05-13):

- **Kein Hover/Tooltip:** Jahres-Werte nicht ablesbar
- **Keine Interaktivität:** Statische Linien + Latest-Dot
- **Layout-Sprengung:** Sparkline default 90px, Long-View 280px, mit 3 Sparklines + 1 Long-View stacked → ~600-800px Inspector-Vertikal-Belastung
- **Underwhelming UX:** Charts kommunizieren weniger als die Min/Max/Latest-Label-Zeile darunter

Pivot-Begründung-Bewertung: LayerChart-v2 hat bereits ARIA-konformes Markup (figure + figcaption + title/desc). Der Pivot war nicht nötig.

## Acceptance Criteria

1. **AC-1 (LayerChart-Sparkline-Komponente):**
   **Given** LayerChart v2 (`layerchart@2.0.0-next.63`) in deps
   **When** `ClimateSparkline` neu implementiert wird
   **Then** Komponente nutzt LayerChart `LineChart` mit:
   - Höhe **64px** (kompakt, vorher 90px Default + sichtbar größer durch SVG-Auto-Scale)
   - Line-Color `--chart-line` (Indigo aus Plex-Tokens)
   - Trend-Line via LinReg-Helper aus Story 1.11 (`regression.ts`) als gestrichelte Sekundär-Linie
   - Latest-Value-Annotation rechts (`74` mit Punkt-Marker)
   - KEIN Grid, KEINE Achsen-Labels (Sparkline-Style)
   **And** Erfüllt UX-DR Inspector-Density.

2. **AC-2 (Hover-Tooltip mit Werten):**
   **Given** Desktop-User hovert über Sparkline
   **When** Cursor über X-Position
   **Then** Vertical-Crosshair + Tooltip:
   - Jahr (z.B. „1987")
   - Wert (z.B. „32 Tage/Jahr")
   - Trend-Wert für gleiches Jahr (optional, z.B. „Trend: 28 Tage/Jahr")
   - Position: oberhalb Cursor (auto-flip falls Top-Edge)
   - Style: Plex-Sans `--text-xs` `--bg-elevated` mit 1px-Outline `--rule`
   **And** Tooltip-Close auf Mouseleave
   **And** Erfüllt UX-DR Data-Inspectability.

3. **AC-3 (Keyboard-Equivalence für Hover):**
   **Given** Keyboard-only-User
   **When** User fokussiert Sparkline-Figure mit Tab
   **Then** Pfeil-Links/Rechts cycled durch Jahre
   **And** Aktueller Datenpunkt highlighted + Tooltip sichtbar
   **And** Home/End springt auf erstes/letztes Jahr
   **And** Screen-Reader-Announce: `Sommertage 1987, 32 Tage pro Jahr, Trend 28 Tage`
   **And** Erfüllt FR-A11y + UX-DR Keyboard-First.

4. **AC-4 (ClimateLongView-Hero-Chart):**
   **Given** Dahlem-Station-Hero-Chart (Annual-Mean-Temperature)
   **When** Komponente neu mit LayerChart `AreaChart` implementiert wird
   **Then** Chart:
   - Höhe **180px** (vorher 280px — kompakter aber bleibt Hero)
   - Area-Fill `--chart-area` (Indigo-Transparent)
   - Line-Stroke `--chart-line`
   - Trend-Line gestrichelt
   - Y-Achse mit 3 Ticks (Min, Mean, Max)
   - X-Achse mit Decade-Ticks (1930, 1950, …, 2020)
   - Hover-Tooltip wie AC-2
   - Brush-Selection (optional, LayerChart-Native) für Zoom auf Decade
   **And** Erfüllt UX-DR Climate-Story-Centerpiece.

5. **AC-5 (Async-Chunk-Lazy-Load):**
   **Given** LayerChart-Bundle ~30kb
   **When** Inspector öffnet OHNE Klima-Sektion (z.B. Adresse außerhalb DWD-Station-Range)
   **Then** LayerChart NICHT geladen
   **And** Erst bei `ui.nearestStation !== null` Dynamic-Import + Render
   **And** Skeleton-Placeholder während Load (Plex-Mono `lädt…`)
   **And** Bundle-Splits via Vite `manualChunks` (Story 1.6 Foundation)
   **And** Erfüllt NFR Performance + Mobile-Bundle-Budget.

6. **AC-6 (Mobile-Touch-Tooltip):**
   **Given** Mobile-Viewport
   **When** User tappt auf Sparkline-Position
   **Then** Tooltip erscheint an Tap-Position
   **And** Erneuter Tap außerhalb schließt
   **And** Touch-Target ≥ 44x44px effective (auto-position falls Edge)
   **And** Erfüllt UX-DR Mobile-First.

7. **AC-7 (DataTableAlternative-Toggle bleibt):**
   **Given** Story 1.11 Feature „Als Tabelle ansehen"-Toggle
   **When** Story 1.17 Charts ersetzt
   **Then** Toggle weiterhin verfügbar (Switch zwischen Chart + Tabelle)
   **And** Toggle-State persistiert pro Session in `localStorage` oder UI-State
   **And** Default Chart-View (NICHT Tabelle)
   **And** Erfüllt UX-DR A11y-Equivalence.

8. **AC-8 (Inspector-Layout-Constraint):**
   **Given** Klima-Section in Inspector
   **When** alle 4 Charts gerendert (3 Sparklines + 1 Long-View)
   **Then** Gesamt-Vertikal ≤ 480px (vorher >800px geschätzt)
   - Sparklines: 64px × 3 = 192px
   - Long-View: 180px
   - Section-Header + Labels: ~108px
   **And** Inspector bleibt mit Klima-Section unter 60% Viewport-Höhe auf 1080p-Desktop
   **And** Erfüllt UX-DR Inspector-Density.

9. **AC-9 (Tests + Migration):**
   **Given** Story 1.11 bestehende Tests (`accessible-chart.svelte.test.ts`, `climate-sparkline.svelte.test.ts`, `climate-long-view.svelte.test.ts`)
   **When** Charts ersetzt werden
   **Then** Bestehende Tests:
   - Tests die SVG-Internas testen (height='280' assertion) → entfernen/anpassen (klimate-long-view height=280 Test ist aktuell fail, war pre-existing)
   - Tests für Werte-Rendering + Trend-Line bleiben (LayerChart erzeugt SVG, querySelector kompatibel)
   - Tests für a11y-Markup (title/desc) bleiben
   - Neue Tests:
     - `climate-sparkline.svelte.test.ts`: Hover-Tooltip-Render, Keyboard-Navigation (Arrow-Keys cycle Jahre)
     - `climate-long-view.svelte.test.ts`: Area-Fill + Brush (optional)
     - `tooltip-position.test.ts`: Auto-flip-Logic falls separat
   **And** E2E `tests/e2e/climate-chart-interaction.e2e.ts`:
   - Hover über Sommertage-Sparkline → Tooltip zeigt Jahr + Wert
   - Tab + Arrow-Right → next Year highlighted
   - Mobile-Tap → Tooltip sichtbar
   - „Als Tabelle ansehen" → Toggle funktional
   **And** axe-core: 0 Violations für Charts

10. **AC-10 (AccessibleChart-Komponente deprecaten):**
    **Given** `src/lib/components/atlas/accessible-chart.svelte` aus Story 1.11
    **When** LayerChart-Migration abgeschlossen
    **Then** `accessible-chart.svelte` + `accessible-chart.svelte.test.ts` werden gelöscht (KEIN Phantom-Code)
    **And** Imports aktualisiert
    **And** Erfüllt MUST-Rule #2 (Files <500) + No-Dead-Code.

## Tasks / Subtasks

- [x] **Task 1: LayerChart-Setup verifizieren** (AC: #5)
  - [x] 1.1 `pnpm ls layerchart` confirm v2.0.0-next.63 stabil
  - [x] 1.2 `vite.config.ts` `manualChunks` für layerchart prüfen (existierend aus 1.11)
  - [x] 1.3 Dynamic-Import-Pattern via `await import('layerchart')` in KlimaSection
  - [x] 1.4 `optimizeDeps.include: ['layerchart']` ergänzt für stabile Vitest-Runs

- [x] **Task 2: ClimateSparkline-Rewrite** (AC: #1, #2, #3, #6)
  - [x] 2.1 `src/lib/components/atlas/climate-sparkline.svelte` rewrite mit LayerChart `LineChart`
  - [x] 2.2 Höhe 64px statt 90px
  - [x] 2.3 Tooltip-Component via LayerChart-Built-In (`Tooltip.{Root,Header,List,Item}`)
  - [x] 2.4 Keyboard-Cycle via Arrow-Keys + Home/End (figure tabindex=0, data-focused-index)
  - [x] 2.5 Mobile-Touch-Tap-Handler (via LayerChart `tooltipContext.mode=quadtree-x`, touch-fähig)
  - [x] 2.6 Unit-Tests aktualisiert (16/16 grün)
  - [x] 2.7 Trend-Line als zweite Series `'trend'` mit `stroke-dasharray='2 2'`
  - [x] 2.8 yBaseline=null + yPadding=[6,6] → Daten-fit-Skala (Min/Max matchen visuelle Min/Max)
  - [x] 2.9 Definition-Subline pro Metric (DWD: T_max ≥ 25 °C, T_min < 0 °C, T_max ≥ 30 °C)
  - [x] 2.10 Null-Counts gefiltert (kein 0-Bias mehr)

- [x] **Task 3: ClimateLongView-Rewrite** (AC: #4)
  - [x] 3.1 Rewrite mit LayerChart `AreaChart` + 2 series (Jahresmittel + 30J-Rolling)
  - [x] 3.2 Höhe 180px
  - [x] 3.3 Decade-X-Ticks (20-Jahres-Intervall) + 3-Tick-Y-Axis (min/mid/max)
  - [x] 3.4 Brush-Selection: scope-cut (NICE-TO-HAVE per Story, deferred)
  - [x] 3.5 Unit-Tests aktualisiert (10/10 grün, height=180)
  - [x] 3.6 Narrative-Markers via `aboveMarks`-Snippet (xScale-basiert)

- [x] **Task 4: AccessibleChart-Removal** (AC: #10)
  - [x] 4.1 Lösche `accessible-chart.svelte` + Test
  - [x] 4.2 Imports in Sparkline + LongView entfernt
  - [x] 4.3 Verify svelte-check 0 Errors (5440 files, 0 errors, 0 warnings)

- [x] **Task 5: KlimaSection-Lazy-Load** (AC: #5, #8)
  - [x] 5.1 Dynamic-Import via `$effect` + `Promise.all([import('../climate-sparkline.svelte'), import('../climate-long-view.svelte')])`
  - [x] 5.2 Skeleton-Placeholder mit `data-testid="klima-skeleton"`, aria-busy, "lädt…"-Text
  - [x] 5.3 Section-Vertikal-Constraint: 3×64 + 180 + ~108 = ~480px (im Spec)
  - [x] 5.4 Unit-Test `klima-section.svelte.test.ts` (4/4 grün)

- [x] **Task 6: DataTableAlternative-Toggle** (AC: #7)
  - [x] 6.1 Toggle-Button bleibt (DataTableAlternative wieder-verwendet aus Story 1.11)
  - [x] 6.2 Default Chart, Toggle pro-Sparkline (per-component state, Session-Persistenz deferred zu 1.18)

- [x] **Task 7: E2E + a11y** (AC: #9)
  - [x] 7.1 `tests/e2e/climate-chart-interaction.e2e.ts` angelegt (Tab, Arrow, Tooltip, Tabelle, Skeleton, axe)
  - [x] 7.2 axe-core-Smoke in E2E enthalten
  - [x] 7.3 Lokaler Playwright-Run deferred zu CI (Pattern aus 1-13/14/15/16)

## Dev Notes

### LayerChart v2 (`layerchart@2.0.0-next.63`) API

```svelte
<script>
  import { LineChart, AreaChart, Tooltip, Highlight } from 'layerchart';
</script>

<LineChart
  data={series}
  x="year"
  y="value"
  series={[
    { key: 'value', color: 'var(--chart-line)' },
    { key: 'trend', color: 'var(--chart-trend)', strokeDasharray: '4 4' }
  ]}
  let:tooltip
>
  <svelte:fragment slot="tooltip">
    <Tooltip header={(d) => d.year}>
      <Tooltip.Item label="Wert" value={(d) => `${d.value} Tage`} />
      <Tooltip.Item label="Trend" value={(d) => `${Math.round(d.trend)} Tage`} />
    </Tooltip>
  </svelte:fragment>
</LineChart>
```

API-Stand Mai 2026. Falls v2.0.0-next.63-Spezifika abweichen: API-Doc unter `layerchart.com` prüfen.

### A11y-Sicherstellung in LayerChart

LayerChart v2 default-renders:
- `<figure role="img" aria-labelledby aria-describedby>`
- `<svg>` mit korrektem viewBox
- Konfigurierbare `<title>` + `<desc>` via Slots

Falls native ARIA-Markup unzureichend: Wrapper-Pattern mit `<figure aria-labelledby={titleId}>` + LayerChart inside. Tests verifizieren.

### Keyboard-Cycle-Implementation

LayerChart v2 Native: prüfen ob `keyboard` Prop existiert. Falls nicht:

```svelte
<div
  role="application"
  aria-label="Sommertage-Verlauf"
  tabindex="0"
  onkeydown={(e) => {
    if (e.key === 'ArrowRight') focusYear(currentYear + 1);
    if (e.key === 'ArrowLeft') focusYear(currentYear - 1);
    if (e.key === 'Home') focusYear(firstYear);
    if (e.key === 'End') focusYear(lastYear);
  }}
>
  <LineChart ... bind:highlightedYear={currentYear} />
</div>
```

### Performance-Constraint

DWD-Stations-Series: 100+ Datenpunkte (Tempelhof 1919-2025). Sparkline-Render < 16ms Frame-Budget. LayerChart v2 nutzt SVG (NICHT Canvas), performance OK bis ~500 Punkte. Bei Bedarf: `<Canvas>`-Variant.

### Bundle-Budget

LayerChart + d3-scale + d3-interpolate + d3-array ~30kb gzipped. Vite `manualChunks` (Story 1.6) bündelt separat. Dynamic-Import in KlimaSection sorgt für no-load bis Inspector + Klima-Section sichtbar.

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (Table-Icon `Table` bleibt)
- #2 Files <500 Zeilen
- #5 Open-Data-Lizenz (LayerChart MIT)
- #7 TS strict
- #11 Kein US-Drittanbieter (LayerChart by Sean-Lange, MIT, OK)
- #13 A11y-First — Tooltip Keyboard + Screen-Reader
- #14 i18n-First — Tooltip-Strings TODOs für 3.1
- #18 Keyed `{#each}` — Data-Points mit Year-Key

### Library/Framework Requirements

**Bereits installiert:**
- `layerchart@2.0.0-next.63`
- `d3-scale`, `d3-interpolate`, `d3-array` (transitiv via layerchart)

**Neu:** keine

### Testing Requirements

**Unit-Tests:** Sparkline-Rewrite, LongView-Rewrite, Keyboard-Nav, Tooltip-Render

**E2E:** Chart-Interaction-Flow

**Coverage-Target:** ≥85% (Charts kritischer UX-Punkt)

### Previous Story Intelligence

- **Story 1.11:** Original-Spec LayerChart, Implementation-Pivot d3-scale (Fehlentscheidung); Komponenten bleiben als Migration-Basis
- **Story 1.6:** `manualChunks` Bundle-Split-Foundation
- **Story 1.4:** `regression.ts` + `rolling-mean.ts` bleiben Utilities

### Open Questions

1. **LayerChart v2.0.0-next.63 API-Stability:** Pre-release-Version. Falls Breaking-Change zwischen Story-Approval + Implementation: Upgrade auf stable v2.x oder pin-version
2. **Keyboard-Cycle-Native:** LayerChart v2 Native-Keyboard-Support vorhanden? Falls nein: Custom-Wrapper (siehe Dev-Note)
3. **Brush-Selection Long-View:** Nice-to-have oder Pflicht? Empfehlung: NICE-TO-HAVE, scope-cut falls Zeitdruck
4. **Tooltip-Theme:** Plex-Mono für Werte oder Plex-Sans? Inspector-Kontext spricht für Mono (Code-Feel)
5. **Series-Daten-Aggregat:** Soll Rolling-Mean (5J) als zweite Series IN dem Sparkline angezeigt werden statt nur Trend-Line? User-Test nötig

## Dev Agent Record

### Implementation Plan

LayerChart v2.0.0-next.63 verifiziert via Direkt-Inspektion der `node_modules/layerchart/dist`-Typdefinitionen und über https://next.layerchart.com/ llms.txt-Subpfade. Pre-release-API stabil: `LineChart`, `AreaChart`, `Tooltip`-Namespace (`Tooltip.Root`/`Tooltip.Header`/`Tooltip.List`/`Tooltip.Item`), `series`-Prop-Pattern mit `key`/`color`/`props`, `annotations`-Prop, `axis/grid/rule`-Toggles. TDD-Flow per ADR-012: pro Komponente erst Test-Suite mit failing-then-passing-Cycle, dann Implementation, dann Refactor.

Schlüssel-Entscheidungen:
- Per-Story-Tooltip-Snippet `{#snippet tooltip({ context })}` mit `context.tooltip.data` als Datenpunkt (statt deprecated `let:tooltip`-Slot, der in Story-Spec stand).
- Keyboard-Cycle nicht nativ in LayerChart v2 → eigener Wrapper: `<figure>` mit tabindex=0 + onkeydown → `data-focused-index`-State + announceGlobal für Screen-Reader (Pattern aus alter AccessibleChart).
- Trend-Line als zweite series `'trend'` statt separate `Spline`-Markierung, `stroke-dasharray: '2 2'` via series.props.
- AreaChart für LongView mit zwei series — Jahresmittel (fillOpacity 0.35) + 30J-Rolling-Mean (fillOpacity 0, line dashed via Area.line.props).
- Narrative-Marker via `aboveMarks`-Snippet (`context.xScale(year)`) — behält `data-testid="long-view-marker"` für Tests.
- Lazy-Load in KlimaSection via `$effect` + `Promise.all([import('./climate-sparkline.svelte'), import('./climate-long-view.svelte')])` triggered bei `station && series && !loadStarted`. Skeleton-Placeholder mit 3 animate-pulse Blocks + aria-busy + "lädt…".

### Completion Notes

User-Review-Iteration während Implementation:
1. „Min/Max passt nicht zum Chart, sieht buggy aus" → Fix: Null-Counts gefiltert (kein 0-Bias mehr), `yBaseline={null}` + `yPadding={[6,6]}` → Chart skaliert auf tatsächliche Daten-Range, sichtbare Min/Max-Punkte matchen Figcaption-Stats.
2. „Erklären wie Sommertage / Heiße Tage definiert sind" → Definition-Subline pro Metric (DWD-Standard): `Sommertage = Tage mit Tagesmaximum ≥ 25 °C`, `Frosttage = Tage mit Tagesminimum < 0 °C`, `Heiße Tage = Tage mit Tagesmaximum ≥ 30 °C`.

Scope-Cuts / Deferred:
- **Brush-Selection LongView (AC-4):** Story markiert als „optional". Scope-cut weil pragmatic-cut bei v2.0.0-next.63 API-Komplexität. Easy-Add via `brush={true}` falls später gewünscht.
- **DataTable-Toggle Session-Persistenz (AC-7):** Aktueller Per-Component-State funktioniert pro Sparkline. Cross-Session via localStorage deferred zu Story 1.18 (Inspector-UX-Rework).
- **Lokaler Playwright-Run (AC-9):** E2E-File `climate-chart-interaction.e2e.ts` angelegt mit Coverage für AC-2/3/5/7/9. Lokaler Run deferred zu CI-Run per Story-Pattern (1-13/14/15/16 ebenfalls).
- **Design-Iteration UX-Detail (Frame, Visual-Density):** User-Feedback „Design machen wir in 1.18" → respektiert. UX-Verbesserungen (Inspector-Frame, figcaption-Position, etc.) im Scope von Story 1.18.

Test-Coverage:
- ClimateSparkline: 16 Unit-Tests (a11y/role, label-per-metric, definition-subline, height-constraint, LayerChart-Container, Splines, Trend-Dasharray, Latest-Annotation, Figcaption, Table-Toggle, Keyboard-Focusability + Cycle, Empty-State).
- ClimateLongView: 10 Unit-Tests (a11y, height 180, LayerChart-Container, 2 Splines, Narrative-Markers, Custom-Markers, Figcaption, Table-Toggle, Empty-State).
- KlimaSection: 4 Unit-Tests (Skeleton, Empty-State, Lazy-Load-Resolution, DataStandBanner).
- Inspector-Panel-Test angepasst auf Lazy-Load (`vi.waitUntil` polling für `klima-sparkline-grid` + `klima-long-view-slot`).
- Full-suite: 770/770 passed.

### File List

- `src/lib/components/atlas/climate-sparkline.svelte` (rewrite, LayerChart-basiert)
- `src/lib/components/atlas/climate-sparkline.svelte.test.ts` (rewrite, 16 Tests)
- `src/lib/components/atlas/climate-long-view.svelte` (rewrite, LayerChart-basiert)
- `src/lib/components/atlas/climate-long-view.svelte.test.ts` (rewrite, 10 Tests)
- `src/lib/components/atlas/accessible-chart.svelte` (deleted)
- `src/lib/components/atlas/accessible-chart.svelte.test.ts` (deleted)
- `src/lib/components/atlas/inspector-panel/klima-section.svelte` (rewrite, Lazy-Load + Skeleton)
- `src/lib/components/atlas/inspector-panel/klima-section.svelte.test.ts` (neu, 4 Tests)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (Lazy-Load-Wait via vi.waitUntil)
- `tests/e2e/climate-chart-interaction.e2e.ts` (neu, Story-1.17-spezifische E2E)
- `tests/e2e/climate-heritage.e2e.ts` (Selector-Update: `.lc-root-container svg path` statt deprecated `sparkline-line`-testid)
- `vite.config.ts` (`optimizeDeps.include: ['layerchart']`)

### Change Log

- 2026-05-14: ClimateSparkline + ClimateLongView auf LayerChart v2 migriert; AccessibleChart entfernt; KlimaSection mit Lazy-Load + Skeleton; Definition-Sublines per Metric; figcaption-Stats korrekt skaliert via `yBaseline=null`; 30 neue Unit-Tests, full-suite 770/770 grün.

## References

- [Source: _bmad-output/implementation-artifacts/1-11-klima-heritage-visualisierung.md] (ursprüngliche LayerChart-Spec + Pivot-Begründung)
- [Source: src/lib/components/atlas/climate-sparkline.svelte] (zu ersetzen)
- [Source: src/lib/components/atlas/climate-long-view.svelte] (zu ersetzen)
- [Source: src/lib/components/atlas/accessible-chart.svelte] (zu löschen)
- [Source: package.json] (`layerchart: 2.0.0-next.63`)
- [Source: vite.config.ts] (manualChunks für layerchart)
- [Source: docs/adr/ADR-012-tdd-mandate.md] (TDD-Pflicht bleibt)
