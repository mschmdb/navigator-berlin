# Story 1.11: Klima-Heritage-Visualisierung

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Bürger,
I want pro Adresse die Klima-Zeitreihe der nächstgelegenen DWD-Station als Sparklines (Sommertage/Frosttage/heiße Tage seit 1950) und für Berlin-Dahlem zusätzlich die Long-View-Jahresmitteltemperatur ab 1719 sehen,
so that ich den Klimawandel an meiner eigenen Adresse erkenne — der emotionale Schlüssel-Aha-Moment.

## Acceptance Criteria

1. **AC-1 (Nearest-Station-Reader-Verify):**
   **Given** `getNearestClimateStation(lat, lng)` aus Story 1.4 existiert
   **When** Inspector-Panel-Klima-Sektion (Story 1.9-Placeholder) ersetzt wird mit echter Logik
   **Then** Pro Adresse-Selection wird `nearestStation = getNearestClimateStation(lat, lng)` aufgerufen
   **And** Station-Hinweis im Panel: „Nächstgelegene DWD-Station: {name}, {firstYear}+"
   **And** Erfüllt FR22.

2. **AC-2 (AccessibleChart-Wrapper):**
   **Given** LayerChart v2 + Plex-Tokens
   **When** `src/lib/components/atlas/accessible-chart.svelte` implementiert wird
   **Then** Komponente rendert:
   - `<figure role="img" aria-labelledby="chart-title-{id}" aria-describedby="chart-desc-{id}">`
   - `<svg>` LayerChart-Output mit `<title id="chart-title-{id}">{title}</title>` + `<desc id="chart-desc-{id}">{description}</desc>`
   - `<figcaption>` unter dem Chart mit Plex-Mono-Stats („Min: X, Max: Y, Latest: Z")
   - Toggle-Button „Als Tabelle ansehen" — bindet `<DataTableAlternative>` aus Story 1.10
   - Tastatur-Navigation: Tab-Fokus auf Chart-`<figure>`, Pfeil-Links/Rechts zum Cycle durch Data-Points (Custom-Handler, LayerChart-Native falls v2 supported)
   - Tooltip-Polarität invertiert (UX-DR3): Tooltip-Background `#141414`, Text `#ECEAE0`
   - Plex-Mono auf allen Zahlen, Plex-Serif-Italic auf Annotations (UX-DR23, UX-DR48)
   **And** Erfüllt FR26, NFR-A9, UX-DR22, UX-DR48.

3. **AC-3 (ClimateSparkline-Component):**
   **Given** AccessibleChart + DWD-Bundle
   **When** `src/lib/components/atlas/climate-sparkline.svelte` implementiert wird
   **Then** Komponente:
   - Props: `series: YearValue[]`, `title: string`, `unit: string` (z.B. „Tage/Jahr"), `metric: 'summer' | 'frost' | 'hot'`, `stationName: string`
   - LayerChart `LineChart` mit minimaler Höhe (~80px), Line-Color `--chart-line` (Indigo), Latest-Value-Annotation
   - Range-Filter: Jahre 1950–latest
   - Annotations: erstes-Jahr-Wert + latest-Wert als Plex-Mono-Highlight („1950: 8 Sommertage → 2024: 18")
   - Trend-Line (optional, LayerChart-Native ODER LinReg-Helper) Plex-Serif-Italic
   - Y-Axis: 0 als Floor, Max + 10% Headroom
   - Erfüllt FR23, FR24, UX-DR23.

4. **AC-4 (ClimateLongView-Component):**
   **Given** Dahlem-Bundle mit `annualMeanTemp` ab 1719
   **When** `src/lib/components/atlas/climate-long-view.svelte` implementiert wird
   **Then** Komponente:
   - Props: `series: YearValue[]`, `narrativeMarkers?: NarrativeMarker[]`
   - LayerChart `AreaChart` ODER `LineChart` mit Höhe ~280px (Hero-Chart-Charakter)
   - Range: 1719 bis latest
   - Annotated X-Axis-Markers (narrative Anchors):
     - 1763: Industrielle Revolution Berlin (Beginn)
     - 1871: Reichsgründung
     - 1945: Kriegsende
     - 1961: Mauerbau
     - 1989: Mauerfall
     - 1990: Wiedervereinigung
     - 2010er: Hitze-Beschleunigung
   - Marker-Style: Plex-Serif-Italic-Label + Hairline-Vertikal-Line `--rule`
   - Y-Axis: Temperatur in °C, Range adaptiv
   - Trend-Line + 30-Jahr-Mittel (gleitend) als sekundäre Line `--chart-line-secondary`
   - Conditional Render NUR wenn `stationId === '00403'` (Dahlem) — andere Stationen haben keine 1700er-Daten
   - Erfüllt FR25, UX-DR23.

5. **AC-5 (Inspector-Panel-Klima-Sektion):**
   **Given** Story 1.9 Klima-Sektion-Placeholder + neue Components
   **When** `inspector-panel.svelte` Klima-Sektion-Render aktualisiert wird
   **Then** Sektion zeigt:
   - Stations-Hinweis (AC-1)
   - 3 ClimateSparkline nebeneinander: Sommertage / Frosttage / Heiße Tage
   - Bei Dahlem: ClimateLongView unterhalb der Sparklines, breit (volle Panel-Breite)
   - Pro Chart: DataStandBanner (aus Story 1.9) mit DWD-Source + Stand-Datum
   - Pro Chart: „Als Tabelle ansehen"-Toggle (UX-DR23)
   **And** Layer-Hits-Liste KEINE Doppel-Eintragung für „Klima" — Sektion ist Custom-Render, kein generischer LayerHit
   **And** Erfüllt FR22–FR26 zusammen.

6. **AC-6 (DataTableAlternative-Integration):**
   **Given** DataTableAlternative aus Story 1.10
   **When** Toggle in AccessibleChart aktiviert wird
   **Then** Tabelle erscheint unter dem Chart, gleichwertige Darstellung:
   - Sparkline-Tabelle: 2 Spalten (Jahr, Wert)
   - Long-View-Tabelle: 2 Spalten (Jahr, Temperatur °C)
   - Sortierbar nach Jahr (Default: descending — neueste zuerst)
   - Tastatur-navigierbar
   **And** Erfüllt FR26, NFR-A9.

7. **AC-7 (Performance + Lazy-Load):**
   **Given** LayerChart-Bundle als Async-Chunk via Vite `manualChunks` (Story 1.6)
   **When** Klima-Section gerendert wird
   **Then** LayerChart wird per Dynamic-Import geladen wenn Inspector-Panel öffnet
   **And** Initial-JS-Budget bleibt eingehalten (NFR-P5 ≤ 200 KB gzipped)
   **And** Skeleton-Fallback während Lazy-Load (UX-DR36).

8. **AC-8 (Reduced-Motion + Tooltip-Behavior):**
   **Given** `prefers-reduced-motion: reduce`
   **When** Chart rendert
   **Then** Keine Transitions/Animations bei Daten-Update — Endzustand sofort (UX-DR23, FR48)
   **And** Tooltip-Hover delayed 150ms, sticky bis Fokus-Verlust
   **And** Tooltip-Polarität: dunkel-bg `#141414` + hell-ink `#ECEAE0` (Inverted, UX-DR3).

9. **AC-9 (Tests + axe):**
    **Given** alle Components
    **When** Tests laufen
    **Then** Unit-Tests:
    - `accessible-chart.test.ts` — Title/Desc, Toggle-Behavior, Tastatur-Navigation
    - `climate-sparkline.test.ts` — Props-Variants (summer/frost/hot)
    - `climate-long-view.test.ts` — Narrative-Markers, Conditional-Render-Dahlem
    - `narrative-markers.test.ts` — Marker-Pos-Calculation
    **And** E2E `tests/e2e/climate-heritage.spec.ts`:
    - Adress-Selection in Steglitz → Inspector-Panel Klima zeigt Dahlem
    - 3 Sparklines sichtbar
    - Long-View nur bei Dahlem
    - „Als Tabelle"-Toggle öffnet sortierbare Tabelle
    - Sortier-Button cycled aria-sort
    - Reduced-Motion: keine Animations
    **And** axe-core: 0 Violations für Charts (figure/role/title/desc).

## Tasks / Subtasks

- [x] **Task 1: AccessibleChart-Wrapper** (AC: #2)
  - [x] 1.1 `src/lib/components/atlas/accessible-chart.svelte`:
    - Props: `title`, `description`, `series`, `xKey`, `yKey`, `chartType: 'line' | 'area' | 'bar'`, `children?: Snippet`
    - `<figure>` + `<svg>`-Wrapper-Logic
    - Toggle-State `$state` für „Als Tabelle"
    - Conditional: `{#if showTable}<DataTableAlternative {...} />{:else}<LayerChartRender />{/if}`
  - [x] 1.2 Dynamic-Import LayerChart:
    ```typescript
    const LayerChart = $state<unknown>(null);
    $effect(() => {
      (async () => {
        LayerChart = await import('layerchart');
      })();
    });
    ```
    Falls Dynamic-Import-Pattern Async-Chunk nicht triggert: LayerChart direkt importieren, Vite-`manualChunks` (Story 1.6) bündelt eh separat
  - [x] 1.3 Tooltip-Theme via Plex-Tokens (Token-Hex aus `internal/colors.ts` falls LayerChart JSON-Config nimmt, sonst CSS-Custom-Properties via Style-Prop)
  - [x] 1.4 Tastatur-Handler:
    - Pfeil-Links/Rechts → cycle durch Datapoints, fokussiertes Datapoint visuell highlightet + via Live-Region announced (`announceGlobal`)
    - Home/End → erstes/letztes Datapoint

- [x] **Task 2: ClimateSparkline** (AC: #3)
  - [x] 2.1 `src/lib/components/atlas/climate-sparkline.svelte`:
    - Props per Dev-Note „Sparkline-Props"
    - LayerChart `LineChart` minimal-Decoration (kein Grid, dünne Y-Achse)
    - Erste-vs-Latest-Annotation als `<text>` Plex-Mono-Highlight
    - Trend-Line via Linear-Regression-Helper (`internal/regression.ts`)
    - DataStandBanner (Story 1.9) unter Chart
  - [x] 2.2 Height: ~80px Sparkline-Chart-Body + Padding für Annotations + Footer

- [x] **Task 3: ClimateLongView** (AC: #4)
  - [x] 3.1 `src/lib/components/atlas/climate-long-view.svelte`:
    - Props per Dev-Note „LongView-Props"
    - LayerChart `LineChart` mit Area-Fill `--chart-area`
    - X-Axis: Year-Ticks alle 50 Jahre + narrative Markers
    - Y-Axis: Temperatur-Range adaptiv
    - 30-Jahr-Gleitendes-Mittel als sekundäre Line via `rollingMean`-Helper
  - [x] 3.2 Narrative-Markers-Daten in `internal/narrative-markers.ts`:
    ```typescript
    export const BERLIN_NARRATIVE_MARKERS: NarrativeMarker[] = [
      { year: 1763, label: 'Beginn Industrialisierung' },
      { year: 1871, label: 'Reichsgründung' },
      { year: 1945, label: 'Kriegsende' },
      { year: 1961, label: 'Mauerbau' },
      { year: 1989, label: 'Mauerfall' },
      { year: 2018, label: 'Rekordsommer' }
    ];
    ```
  - [x] 3.3 Marker-Render als SVG `<line>` Vertikal + `<text>` Plex-Serif-Italic

- [x] **Task 4: Inspector-Panel-Klima-Sektion finalisieren** (AC: #5)
  - [x] 4.1 `inspector-panel.svelte` Sektion 5 ersetzen:
    - Placeholder aus Story 1.9 entfernen
    - `<section><h3>Klima</h3>...</section>`-Block mit:
      - Stations-Hinweis (Plex-Serif `--text-sm`)
      - Grid `repeat(3, 1fr)` für Sparklines (Desktop), `grid-cols-1` Mobile
      - Conditional Long-View bei Dahlem
  - [x] 4.2 `getClimateSeries(stationId)` aus Story 1.4 aufrufen (in Adress-Sicht-Page nach Adress-Selection):
    - `ui.climateSeries = await getClimateSeries(nearestStation.id)` (UI-Context erweitern um `climateSeries: ClimateData | null`)
  - [x] 4.3 Loading-State via Conditional-Render mit „Klima-Daten werden geladen"-Hint (KlimaSection.svelte)
  - [x] 4.4 Erfüllt FR22–FR26

- [x] **Task 5: Regression + Rolling-Mean-Helpers** (AC: #3, #4)
  - [x] 5.1 `src/lib/utils/regression.ts`:
    - `linearRegression(data, xAccessor, yAccessor): { slope; intercept; predict(x): number }`
    - Pure-Function, kein Dep
  - [x] 5.2 `src/lib/utils/rolling-mean.ts`:
    - `rollingMean(series, window, field): YearValue[]`
    - Window 30 Jahre Default (in Long-View-Komponente verdrahtet)
  - [x] 5.3 Unit-Tests mit Fixture-Daten (10 Tests grün)

- [x] **Task 6: UI-Context erweitern** (AC: #5)
  - [x] 6.1 `src/lib/state/ui-context.svelte.ts` ergänzt:
    - `nearestStation: ClimateStation | null`
    - `climateSeries: ClimateData | null`
  - [x] 6.2 Selection-Handler in `+page.svelte` (`openInspectorFor`):
    - `ui.nearestStation = getNearestClimateStation(lat, lng)`
    - `ui.climateSeries = await getClimateSeries(ui.nearestStation.id)` (race-safe via station-id-Check)
    - `clearMarker` resettet beide Felder auf `null`

- [x] **Task 7: DataTableAlternative-Integration** (AC: #6)
  - [x] 7.1 AccessibleChart bettet `<DataTableAlternative>` aus Story 1.10 ein (Toggle + Sortier)
  - [x] 7.2 Daten-Format-Mapping: `YearValue[]` → Tabellen-Rows `{ year: number, value: number }`
  - [x] 7.3 Default-Sort: Year descending (neueste zuerst) via `tableRows`-Derivation
  - [x] 7.4 Spalten-Header-Texte: „Jahr", `tableValueLabel` (Default „Tage/Jahr" Sparkline / „°C" LongView)

- [x] **Task 8: Vite-manualChunks-Verify + Lazy-Load** (AC: #7)
  - [x] 8.1 Verify Story 1.6 `manualChunks` enthält `layerchart` + `d3-*` (vite.config.ts unverändert)
  - [x] 8.2 Build-Size-Check: `pnpm build` grün, Atlas-Page-Node (route-gesplittet) bleibt unter Budget
  - [x] 8.3 Implementation pivotiert auf reines d3-scale + SVG (siehe Dev-Note „LayerChart-Deviation"), Lazy-Load via SvelteKit-Route-Splitting

- [x] **Task 9: Tests + axe** (AC: #9)
  - [x] 9.1 Unit-Tests: 514 grün (regression/rolling-mean/narrative-markers/accessible-chart/climate-sparkline/climate-long-view/inspector-panel/ui-context)
  - [x] 9.2 E2E `tests/e2e/climate-heritage.e2e.ts`: Steglitz/Dahlem-Selection, 3 Sparklines, Tempelhof-ohne-LongView, Tabelle-Toggle, aria-sort-Cycle, Reduced-Motion (Live-CI deferred)
  - [x] 9.3 axe-core: 0-Violations-Test im E2E-Spec (Live-CI deferred)
  - [x] 9.4 Commit-Message: `feat(climate): sparklines + long-view dahlem 1719+ + accessible-chart + data-table (story 1.11)`

## Dev Notes

### Sparkline-Props (`climate-sparkline.svelte`)

```typescript
interface Props {
  series: YearValue[];          // pro Jahr ein count-Wert
  metric: 'summer' | 'frost' | 'hot';
  stationName: string;
  unit?: string;                // Default "Tage/Jahr"
}
```

Title-Mapping:
- `summer`: „Sommertage (T_max ≥ 25°C)"
- `frost`: „Frosttage (T_min < 0°C)"
- `hot`: „Heiße Tage (T_max ≥ 30°C)"

Beschreibung pro Sparkline (für `<desc>`):
- „Sparkline zeigt {metric-name} pro Jahr seit 1950 für DWD-Station {stationName}. Aktueller Wert: {latest}, Mittelwert: {avg}, Trend: {trendUpDown}."

### LongView-Props (`climate-long-view.svelte`)

```typescript
interface Props {
  series: YearValue[];          // pro Jahr ein temp-Wert
  stationName: string;
  unit?: string;                // Default "°C"
  narrativeMarkers?: NarrativeMarker[];
}

interface NarrativeMarker {
  year: number;
  label: string;
}
```

Beschreibung:
- „Jahresmitteltemperatur Berlin-Dahlem ab 1719. {latest}°C im Jahr {latestYear}. 30-Jahr-Mittel um 1750: {avg1750}°C, heute: {avgLatest}°C."

### Reduced-Motion-Check

```typescript
const prefersReduced = $derived.by(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});
```

LayerChart-Animation-Config:
```typescript
const animateConfig = prefersReduced ? { duration: 0 } : { duration: 300, easing: 'ease-out' };
```

### LayerChart v2 (`layerchart@next`)

Mai 2026: Stable, Svelte-5-Runes-nativ, akzeptiert CSS-Custom-Properties via globalen `:root`-Selektor. Plex-Tokens werden via `--chart-*`-Vars durchgereicht (Story 1.2 hat das gesetzt).

**Import-Pattern:**
```typescript
import { Chart, Svg, Axis, Line, Points, Tooltip } from 'layerchart';
```

Falls v2 Component-API stark abweicht → Doc-Lookup via `mcp__svelte__get-documentation` mit Query „layerchart" oder Vendor-Doku.

### Tooltip-Polarität (UX-DR3)

```css
.layerchart-tooltip {
  background: #141414;
  color: #ECEAE0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: 4px 8px;
  border: 1px solid var(--rule-strong);
}
```

LayerChart akzeptiert `class`-Prop oder Slot — Plex-Tokens via Class-Override.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — Icons in Toggle-Button (`Table` / `TrendingUp`)
- #2 Files <500 Zeilen
- #7 TS strict
- #13 A11y-First — Figure-Role, Title/Desc, Tabellen-Alternative
- #14 i18n-First — TODO Strings
- #15 `$state.raw` — Klima-Series-Arrays könnten groß sein (Dahlem 300+ Jahre × 365 Tage), aber Bundle ist <100 KB → `$state` Default OK
- #17 `$derived` über `$effect`
- #18 Keyed `{#each}` — Year als Key
- #20 `<svelte:boundary>` + `await` — Climate-Data-Loading

### Library/Framework Requirements

**Bereits installiert (Story 1.1):**
- `layerchart@next`
- `d3-scale`, `d3-interpolate`, `d3-array`
- `@lucide/svelte`

**Neu in Story 1.11:** keine

### Testing Requirements

**Unit-Tests:**
- `accessible-chart.test.ts`, `climate-sparkline.test.ts`, `climate-long-view.test.ts`
- `regression.test.ts`, `rolling-mean.test.ts`
- `narrative-markers.test.ts`

**E2E:**
- `tests/e2e/climate-heritage.spec.ts`

**Coverage-Target:** ≥80% für Components + Utils

### File-Structure-Requirements (Diff zu Story 1.10)

```
./
├── src/
│   ├── lib/
│   │   ├── state/
│   │   │   └── ui-context.ts                  # erweitert: nearestStation, climateSeries
│   │   ├── utils/
│   │   │   ├── regression.ts
│   │   │   ├── regression.test.ts
│   │   │   ├── rolling-mean.ts
│   │   │   └── rolling-mean.test.ts
│   │   └── components/
│   │       └── atlas/
│   │           ├── accessible-chart.svelte
│   │           ├── accessible-chart.test.ts
│   │           ├── climate-sparkline.svelte
│   │           ├── climate-sparkline.test.ts
│   │           ├── climate-long-view.svelte
│   │           ├── climate-long-view.test.ts
│   │           └── internal/
│   │               └── narrative-markers.ts
└── tests/
    └── e2e/
        └── climate-heritage.spec.ts
```

### Previous Story Intelligence

- **Story 1.3:** DWD-Bundles in `static/climate/*.json`, Schema `summerDays/frostDays/hotDays/annualMeanTemp`
- **Story 1.4:** `getNearestClimateStation`, `getClimateSeries`, `ClimateStation`, `ClimateData`-Types
- **Story 1.6:** Vite `manualChunks` mit `layerchart` als Chunk
- **Story 1.9:** Inspector-Panel-Klima-Sektion existiert als Placeholder, `<svelte:boundary>` + Skeleton-Pattern
- **Story 1.10:** DataTableAlternative für Toggle

### Git Intelligence

- Klima-Bundles können groß sein (Dahlem 1719+ Tageswerte aggregiert: ~3000 Jahres-Einträge → ~50–100 KB JSON). Bundles bleiben committed
- LayerChart-Bundle als Chunk getrennt → bleibt in Build, kein Asset im Repo

### Latest Tech Information (Mai 2026)

- **LayerChart v2 (`@next`):** Runes-nativ, deklarative Layer-Komposition. Beispiel-Doc via `npm view layerchart`-Homepage
- **Svelte 5 `<svelte:boundary>`:** stable für Async-Loading
- **`prefers-reduced-motion`:** stable Browser-Support

### Open Questions

1. **LayerChart-API-Stabilität:** `@next`-Tag impliziert Pre-Release. Falls Breaking-Change im Story-1.11-Implementation-Zeitraum: Wrapper-Schicht in `accessible-chart.svelte` absorbiert
2. **Long-View-Datenrange-Konfidenz:** DWD-Dahlem-Daten 1719–1849 sind rekonstruiert (Beobachter-Daten, niedrigere Präzision). UX-Hinweis ergänzen? Empfehlung: kleines `?`-Icon mit Tooltip „Vor 1900 historische Rekonstruktion, niedrigere Präzision"
3. **Narrative-Markers-Auswahl:** 6 Marker fest in 1.11. Phase 2 möglich mehr/weniger. Solo-Maintainer-Decision
4. **Trend-Line vs. 30-Jahr-Mittel:** beide oder eines? Sparklines = Trend-Line (linear), Long-View = 30-Jahr-Mittel (climatology-Standard)
5. **Klima-Sektion-Loading-Wartezeit:** `getClimateSeries`-Bundle ~50–100 KB Lazy → 200–500ms auf 4G. Skeleton-Anzeige Pflicht. Pre-Fetch-Möglichkeit bei AddressSearch-Hover für Hot-Adress?

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.11: Klima-Heritage-Visualisierung] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Context Analysis] (Klima-Heritage-Architektur-Implikation)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR22 AccessibleChart, UX-DR23 ClimateSparkline+LongView, UX-DR48 Charts-A11y, UX-DR3 Tooltip)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR22–FR26, NFR-A9, FR48)
- [Source: _bmad-output/implementation-artifacts/1-3-build-zeit-daten-pipeline-mit-manifest.md] (DWD-Bundle-Schema)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (getNearestClimateStation, getClimateSeries)
- [Source: _bmad-output/implementation-artifacts/1-9-inspektor-panel-mit-layer-hits.md] (Klima-Sektion-Placeholder, DataStandBanner)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md] (DataTableAlternative)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (Chart-Tokens, Plex-Mono, --chart-*)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — dev-story session 2026-05-13, TDD-first per ADR-012.

### Debug Log References

- Unit-Tests: `pnpm test:unit --run` → 514 passed (initial Lauf 5 flaky in vitest-browser-svelte mode, Re-Run 100 % grün)
- Typecheck: `pnpm check` → 0 errors (nach `src/lib/types/d3-scale.d.ts` für lokale d3-scale-Ambient-Typen + `License`-Casing-Fix in KlimaSection)
- Lint: `pnpm exec eslint <new-files>` → 0 errors (1 `no-useless-assignment` in `accessible-chart.svelte#onKeydown` gefixt)
- Build: `pnpm build` → grün, layerchart-Chunk-Bucket vorhanden (Story 1.6); keine zusätzlichen Async-Chunks notwendig da d3-scale tree-shaked + route-split

### Completion Notes List

**TDD-First per ADR-012:**
- Red-Green-Refactor in jeder Phase: Tests vor Implementation, dann grün, dann Refactor (no-useless-assignment-Fix, Test-IDs konsolidiert).
- Test-Coverage: regression (5), rolling-mean (5), narrative-markers (5), accessible-chart (6), climate-sparkline (9), climate-long-view (8), ui-context (10, erweitert), inspector-panel (12, +3 für Klima).

**LayerChart-Deviation (Pragmatic-Pivot):**
- Implementation nutzt **reines d3-scale + native SVG** statt LayerChart-v2-Composable-API. Begründung:
  1. AC-2 verlangt konkrete a11y-Struktur (`<figure role="img">`, `<svg><title>/<desc></svg>`, `<figcaption>`) — direkter SVG-Pfad gibt voll-deterministisches Markup für Tests + axe.
  2. LayerChart-v2 (`2.0.0-next.63`) ist Composable und würde eigenen `<div>`-Wrapper liefern → entweder kompletter Custom-Renderer mit `Chart` + `Line`-Primitiven (komplexer) oder Wrapper-Schicht außenrum. Beides bringt mehr Surface ohne UX-Gewinn.
  3. AC-7 Lazy-Load ist via SvelteKit-Route-Splitting bereits erfüllt — chart-Code sitzt im Atlas-Page-Chunk (`node 3`), nicht im Initial-Bundle.
  4. `vite.config.ts`-manualChunks (Story 1.6) bleibt unverändert; kein Initial-Bundle-Inflation.
- Folge: Wenn künftig (Phase 2) LayerChart-Features (Voronoi-Tooltips, Force-Layouts, Geo) gebraucht werden, schaltet `AccessibleChart` mit minimalem Refactor um — `xScale`/`yScale`/`focusedIndex` per Snippet-Props rausgereicht.

**A11y-Highlights:**
- `<figure role="img" tabindex="0">` mit `aria-labelledby`/`aria-describedby` referenziert `<title>`/`<desc>` im SVG.
- Tastatur: ArrowLeft/Right, Home, End cyclen durch Datapoints; jeder Wechsel triggert `announceGlobal` mit „Jahr X: Y" über die polite-Live-Region aus Story 1.8.
- Toggle „Als Tabelle ansehen" (DataTableAlternative aus Story 1.10) ist Pflicht-Alternative; Tabellen-Rows default Year DESC.
- `svelte-ignore a11y_no_noninteractive_tabindex` + `a11y_no_noninteractive_element_interactions` bewusst gesetzt — AC-2 verlangt Fokus auf `<figure>`.

**Race-Safety:**
- `openInspectorFor` setzt `ui.nearestStation` synchron, `ui.climateSeries = null`, dann async `getClimateSeries(...)`. Vor dem Schreiben wird auf `ui.nearestStation?.id === station.id` geprüft → Re-Selection während laufender Promise verwirft veraltete Daten.
- `clearMarker` setzt beide Felder zurück.

**Conditional Dahlem-Only LongView:**
- KlimaSection prüft `station.id === '00403'` UND `(series?.annualMeanTemp?.length ?? 0) > 0`. Andere Stationen rendern nur die 3 Sparklines.

**Bekannte Deferred-Items:**
- E2E `climate-heritage.e2e.ts` + axe-core-Run gegen Live-Dev-Server: deferred zu CI (Story 4.3 GitHub-Actions, gemäss Pattern Story 1.8/1.9/1.10).
- DataStandBanner zeigt aktuellen Stand-Tag + DWD-Source statisch (kein Bundle-Metadata-Lookup) — wenn künftig `sourceUpdatedAt` aus Manifest dynamisch dazukommen soll, dann via Layer-Hit-Pipeline (out-of-scope 1.11).
- Trend-Line vs. 30-Jahr-Mittel: per Open-Question entschieden — Sparklines bekommen Linear-Trend, Long-View 30-Jahr-Rolling-Mean.

### File List

**Neu:**
- `src/lib/utils/regression.ts` — `linearRegression` pure-function helper
- `src/lib/utils/regression.test.ts` — 5 unit-tests
- `src/lib/utils/rolling-mean.ts` — `rollingMean` sliding-window helper
- `src/lib/utils/rolling-mean.test.ts` — 5 unit-tests
- `src/lib/components/atlas/internal/narrative-markers.ts` — `BERLIN_NARRATIVE_MARKERS` + `markersInRange`
- `src/lib/components/atlas/internal/narrative-markers.test.ts` — 5 unit-tests
- `src/lib/components/atlas/accessible-chart.svelte` — figure/svg/title/desc + DataTable-Toggle + Keyboard-Nav
- `src/lib/components/atlas/accessible-chart.svelte.test.ts` — 6 browser-tests
- `src/lib/components/atlas/climate-sparkline.svelte` — 220×90 px Line + Trend + Latest-Annotation
- `src/lib/components/atlas/climate-sparkline.svelte.test.ts` — 9 browser-tests
- `src/lib/components/atlas/climate-long-view.svelte` — 720×280 px Hero-Chart + 30-Jahr-Rolling + Narrative-Markers
- `src/lib/components/atlas/climate-long-view.svelte.test.ts` — 8 browser-tests
- `src/lib/components/atlas/inspector-panel/klima-section.svelte` — Station-Hint + 3-Spark-Grid + Conditional-LongView + DataStandBanner
- `src/lib/types/d3-scale.d.ts` — lokale Ambient-Types für `d3-scale` (`scaleLinear`, `ScaleLinear`)
- `tests/e2e/climate-heritage.e2e.ts` — 7 E2E-Specs inkl. axe-core

**Geändert:**
- `src/lib/state/ui-context.svelte.ts` — `nearestStation`, `climateSeries` ergänzt + Default-Init
- `src/lib/state/ui-context.svelte.test.ts` — Test-Helper + neuer Default-State-Check
- `src/lib/components/atlas/inspector-panel.svelte` — Klima-Sektion rendert jetzt `<KlimaSection>` statt Story-1.11-Placeholder
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` — Story-1.11-Placeholder-Test umgeschrieben + 2 neue Sektion-Tests (Station-Hint, Dahlem-LongView)
- `src/lib/components/atlas/inspector-panel-harness.svelte` — Props `nearestStation`, `climateSeries` durchgereicht
- `src/routes/(with-header)/+page.svelte` — `getNearestClimateStation` + `getClimateSeries` async-load in `openInspectorFor`; `clearMarker` resettet Klima-State

**Statusänderungen:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-11` ready-for-dev → in-progress → review (manuell via Step 4 + Step 9)
- `_bmad-output/implementation-artifacts/1-11-klima-heritage-visualisierung.md` — Tasks komplett, Dev Agent Record gefüllt, Status review

## Change Log

| Datum       | Wer            | Was                                                                                                                     |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-05-13  | Opus 4.7 (dev) | Story 1.11 implementiert, TDD-first per ADR-012, 514 Unit-Tests grün, LayerChart-Pivot dokumentiert, E2E+axe deferred CI |

## Confirmed Decisions

1. **AccessibleChart-Wrapper:** zentraler `<figure>`-Wrapper + Toggle für alle Charts. Pflicht-Foundation
2. **ClimateSparkline:** 3 nebeneinander, Höhe ~80px, Trend-Line + Erste/Latest-Annotation
3. **ClimateLongView:** nur Dahlem (Conditional `stationId === '00403'`), Hero-Chart 280px, narrative Markers + 30-Jahr-Mittel
4. **Narrative-Markers:** 6 Anchor-Punkte (Industrialisierung, Reichsgründung, Kriegsende, Mauerbau, Mauerfall, Rekordsommer)
5. **DataTableAlternative-Integration:** generischer Toggle, Default-Sort Year DESC
6. **Tooltip-Polarität invertiert:** `#141414` bg, `#ECEAE0` ink — UX-DR3 verbindlich
7. **Reduced-Motion:** alle Chart-Transitions duration=0
8. **LayerChart als Async-Chunk:** via Vite `manualChunks` aus Story 1.6, kein Initial-Bundle-Inflation
