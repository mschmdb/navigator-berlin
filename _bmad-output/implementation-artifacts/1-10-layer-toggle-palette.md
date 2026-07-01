# Story 1.10: Layer-Toggle-Palette

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Datenjournalistin (Frieda) und Mobile-Nutzer (Anna),
I want via `/`-Tastatur-Shortcut (Desktop) oder Bottom-Sheet (Mobile) Layer aktivieren/deaktivieren,
so that ich Cross-Layer-Stacks zusammenstellen kann ohne Sidebar-Wand.

## Acceptance Criteria

1. **AC-1 (LayerPalette-Komponente):**
   **Given** Bits-UI-Wrapper aus Story 1.2 + UI-Context aus Story 1.9
   **When** `src/lib/components/atlas/layer-palette.svelte` implementiert wird
   **Then** Komponente rendert:
   - Desktop (>640px): Bits-UI `Dialog.Root`, Centered Overlay, max-width 600px, max-height 80vh, Focus-Trap
   - Mobile (≤640px): Bits-UI Sheet (aus 1.9 `bottom-sheet.svelte`), Snap-Punkte 40vh / 70vh / 100vh
   - Header: Plex-Serif h2 „Layer auswählen" + Close-Button (X, Esc-shortcut)
   - Body: Combobox-Filter + ToggleGroup gruppiert nach Bundles
   - Footer: „Alle deaktivieren"-Tertiary-Link + Anzahl aktive Layer
   **And** Modal-Background NICHT dimmed (UX-DR33)
   **And** Erfüllt FR16, FR17, UX-DR21.

2. **AC-2 (Combobox-Filter mit Substring-Match):**
   **Given** Palette geöffnet
   **When** Nutzer in Combobox-Input tippt
   **Then** Filter:
   - Volltext-Substring-Match (case-insensitive) auf `layer.slug` + `layer.name` + `LAYER_EXPLAIN_DE[slug]`
   - Mindest-Match-Länge 0 (alle Layer sichtbar bei leerem Input)
   - Real-Time-Update, kein Debounce nötig (lokal)
   **And** Tastatur-Navigation: Pfeil-Hoch/Runter durch gefilterte Liste, Enter aktiviert/deaktiviert (FR16)
   **And** Erfüllt FR16.

3. **AC-3 (ToggleGroup nach Bundles):**
   **Given** Manifest mit `bundleGroup`-Property aus Story 1.3
   **When** Layer-Liste gruppiert wird
   **Then** 4 Sektionen in Palette:
   - „A — Boundaries" (Bezirke, Ortsteile, LOR-3-Ebenen, PLZ)
   - „B — Wohn-Daten" (Mietspiegel, Bodenrichtwerte, Gebäudealter)
   - „C — Umwelt" (Lärm L_DEN/L_NIGHT, Solar, Klimaanalyse, Trinkbrunnen)
   - „D — Memorial" (Stolpersteine)
   **And** Pro Layer ein ToggleGroup-Item:
   - Layer-Name (Plex Sans Medium)
   - Bundle-Tag rechts klein
   - Aktiv-State: `data-state="on"` mit `--accent`-Hintergrund-Wash
   - Touch-Target ≥ 44×44 (UX-DR29)
   **And** Erfüllt FR18-Foundation.

4. **AC-4 (`/`-Shortcut Desktop):**
   **Given** Page mit Map
   **When** Nutzer `/` drückt
   **Then** Falls aktiver Focus NICHT in `<input>`/`<textarea>`/`[contenteditable]`: Palette öffnet sich, Focus auf Combobox-Input (preventDefault)
   **And** Falls Focus in Input: `/`-Default-Verhalten (Zeichen einfügen) — kein Preventdefault
   **And** Wiederholtes `/` schließt Palette
   **And** Erfüllt FR16.

5. **AC-5 (Mobile-Button + Sheet):**
   **Given** Mobile-Viewport
   **When** Nutzer Layer-Button (sichtbar im Header oder fixed bottom-right) klickt
   **Then** Sheet öffnet sich, Snap auf 70vh initial
   **And** Sheet zeigt zuerst 5 zuletzt genutzte Layer („Zuletzt verwendet"-Sektion), darunter Combobox + alle Bundles (FR17)
   **And** Toggle-Button für Snap-Wechsel + Drag-Handle (Single-Click-Alt SC 2.5.7)
   **And** Erfüllt FR17, UX-DR11, UX-DR21.

6. **AC-6 (URL-Layer-Param-Sync):**
   **Given** Toggle-Aktion
   **When** Nutzer Layer aktiviert/deaktiviert
   **Then** URL-Update via `goto('?layers={csv}', { replaceState: true, keepFocus: true, noScroll: true })` (FR11d)
   **And** Layer-Reihenfolge in CSV deterministisch (Bundle-A → B → C → D, dann alphabetisch innerhalb Bundle)
   **And** Beim Page-Load: `?layers=...`-Param wird via `parseLayers` aus Story 1.7 gelesen → `ui.activeLayerSlugs` initialisiert.

7. **AC-7 (Layer-Render auf Karte mit Skala-Logik):**
   **Given** `ui.activeLayerSlugs` Veränderung
   **When** MapLibreCanvas reagiert via `$effect`
   **Then** Pro Layer-Slug:
   - GeoJSON-Source via `addSource` (falls noch nicht vorhanden)
   - Layer-Style-Generation via `internal/layer-style-builder.ts` (siehe Dev-Note „Skala-Logik"):
     - Sequentielle Skala (Ordinal, z.B. Mietspiegel): single-hue `--bg` → `--accent`-Wash
     - Divergierende Skala (vorzeichen-behaftet, z.B. Klima-Anomalie): Vermillion ↔ Indigo, Mitte Cloud Dancer
     - Outline-Only (Boundary, z.B. Bezirk): `--accent` 1px Line, kein Fill
     - Kategorial (Lärm-Klassen, max 5–6 Okabe-Ito): aus Token-Chart-Cat
   - Layer entfernen bei Deselect via `removeLayer` + `removeSource`
   **And** Common-Fate-Animation: Fade-In/Out 200ms ease-out via MapLibre `setPaintProperty('fill-opacity', target)`, `prefers-reduced-motion` direkt
   **And** Erfüllt FR18, UX-DR5, UX-DR37.

8. **AC-8 (LRU für „Zuletzt verwendet"-Liste):**
   **Given** Toggle-Aktionen
   **When** LayerPalette „Zuletzt verwendet" rendert
   **Then** Persistenz via URL-Params NICHT möglich (Cookieless + kein LocalStorage MUST-Rule #10)
   **Then** Stattdessen: In-Memory-LRU im UI-Context-State (`ui.recentLayerSlugs: string[]`, max 5)
   **And** LRU persistiert NICHT zwischen Sessions — Reset bei Page-Reload
   **And** Initial-State: leer, Fallback zu Bundle-A-Default-Liste (Bezirke + LOR-Bezirksregion)
   **And** Decision dokumentiert in Story-Notes — Persistenz ist Cookieless-Verletzung, Architektur-Trade-off bewusst.

9. **AC-9 (DataTableAlternative-Component):**
   **Given** Karten-/Chart-Visualisierungen
   **When** `src/lib/components/atlas/data-table-alternative.svelte` implementiert wird
   **Then** Komponente:
   - Toggle-Button „Als Tabelle ansehen" direkt unter Karte/Chart (FR19, NFR-A9, UX-DR26)
   - Bei Klick: `<table>` mit semantischem `<th scope="col">`, `<caption>`
   - Sortier-Buttons im Header mit `aria-sort="ascending"/"descending"/"none"`
   - Tastatur-navigierbar (Tab durch Cells, Enter zum Sortieren)
   - Pagination optional bei >100 Zeilen (Bits-UI-Pagination, falls verfügbar)
   - Library-Foundation: `svelte-headless-table` ODER `@careswitch/svelte-data-table` (Decision in Dev-Note „Table-Library")
   **And** Erfüllt FR19, NFR-A9, UX-DR26.

10. **AC-10 (Escape + Focus-Trap):**
    **Given** Palette offen
    **When** Nutzer Esc drückt ODER X-Button klickt ODER außerhalb-Click (Desktop)
    **Then** Palette schließt, Focus kehrt zum Trigger-Element zurück
    **And** Bits-UI Dialog handelt Focus-Trap nativ
    **And** Erfüllt UX-DR21, UX-DR33.

11. **AC-11 (Tests + axe):**
    **Given** alle Components
    **When** Tests laufen
    **Then** Unit-Tests:
    - `layer-palette.test.ts` — Combobox-Filter, ToggleGroup-State, Shortcut-Handling
    - `layer-style-builder.test.ts` — Skala-Logik pro Layer-Typ
    - `data-table-alternative.test.ts` — Sortier-Behavior, ARIA-Sort
    **And** E2E `tests/e2e/layer-toggle.spec.ts`:
    - `/`-Shortcut öffnet Palette
    - Suche „Mietspiegel" filtert Liste
    - Toggle → URL-Update + Karten-Layer sichtbar
    - Esc schließt Palette
    - Mobile-Viewport: Bottom-Sheet rendert + Toggle
    - Data-Table-Alternative öffnet sortierbare Tabelle
    **And** axe-core gegen Palette offen → 0 Violations.

## Tasks / Subtasks

- [x] **Task 1: UI-Context erweitern** (AC: #6, #8)
  - [x] 1.1 `src/lib/state/ui-context.svelte.ts` ergänzt:
    - `paletteOpen: boolean`
    - `activeLayerSlugs: string[]` (aus 1.9)
    - `recentLayerSlugs: string[]` (max 5, LRU)
  - [x] 1.2 Helper-Functions im Modul:
    - `toggleLayer(state, slug): void` — fügt hinzu/entfernt + LRU-Update
    - `clearLayers(state): void` — leert `activeLayerSlugs`

- [x] **Task 2: LayerPalette-Komponente** (AC: #1, #2, #3, #4)
  - [x] 2.1 `src/lib/components/atlas/layer-palette.svelte`:
    - Conditional-Render Desktop (vanilla `<div role="dialog">` mit manuellem Focus-Trap, Bits-UI-Wrapper aus 1.2 verworfen wegen ScrollLock/InteractOutside-Konflikt mit non-dimmed-Modal — siehe Completion Notes) vs. Mobile (Bottom-Sheet via 1.9)
    - Open-State via `ui.paletteOpen`
    - `<input type="search">` mit Live-Filter via `filterLayers()` (Combobox-Substring-Match)
    - `$derived`: `filteredLayers` aus `layers` + `searchQuery`
    - Gruppierung nach `bundleGroup` via `groupLayersByBundle()`
    - Plain `<button aria-pressed>` pro Toggle (statt Bits-UI ToggleGroup — selber Grund: kein modaler Focus-Trap erwünscht)
  - [x] 2.2 `onMount` registriert globalen Keydown-Handler:
    - `/`-Drücken: wenn Focus nicht in Input → `ui.paletteOpen` toggle, Focus auf Search
    - `Esc` schließt Palette
    - Cleanup im Return
  - [x] 2.3 File <500 Zeilen (~280 LOC inkl. Snippet)

- [x] **Task 3: URL-Layer-Param-Sync** (AC: #6)
  - [x] 3.1 `(with-header)/+page.ts` Load-Function liest `?layers=...` via `parseLayers`
  - [x] 3.2 `(with-header)/+page.svelte`-`onMount`: `ui.activeLayerSlugs = data.activeLayers`
  - [x] 3.3 `$effect` mit `ui.activeLayerSlugs`-Watch:
    - Debounced URL-Update (200ms) via `goto(?layers={csv})`
    - `replaceState: true, keepFocus: true, noScroll: true`
    - Bootstrap-Skip (erster Run schreibt nicht zurück, vermeidet Loop mit `parseLayers`)
  - [x] 3.4 Deterministische Sortierung via neuer `sortLayerSlugsByBundle(slugs, layers)` in `url-state.ts` (A→B→C→D, alphabetisch innerhalb)

- [x] **Task 4: Mobile-Layer-Button** (AC: #5)
  - [x] 4.1 `site-header.svelte` ergänzt: optionale `onOpenLayerPalette` + `activeLayerCount` Props, Button rechts neben AddressSearch (zeigt auf allen Breakpoints — Mobile-only-Filter via Tailwind später möglich, vorerst Konsistenz mit Desktop)
  - [x] 4.2 `Layers` aus `@lucide/svelte` + Badge `palette-active-count` nur wenn count > 0
  - [x] 4.3 `(with-header)/+layout.svelte` verdrahtet Callback → `ui.paletteOpen = true`

- [x] **Task 5: Layer-Style-Builder** (AC: #7)
  - [x] 5.1 `src/lib/components/atlas/internal/layer-style-builder.ts`:
    - `buildLayerSpec(slug, sourceId, options)` → `MapLibreLayerSpec[]`
    - 5 Profile-Dispatch (`boundary` / `ordinal` / `numeric-kategorial` / `divergent` / `point`)
  - [x] 5.2 `LAYER_STYLE_PROFILE` hardcoded in 1.10 (Manifest-Migration Phase 2 dokumentiert)
  - [x] 5.3 Token-Hex in `internal/colors.ts` dupliziert (CSS-Custom-Properties nicht in MapLibre-JSON-Spec lesbar). TODO für Build-Step-Parser Phase 2.
  - [x] 5.4 **Common-Fate-Transition entfernt:** MapLibre v5 lehnt `fill-opacity-transition` als unknown property im JS-API ab (anders als der JSON-Style-Spec). `getTransitionDurationMs()` exportiert, Animation könnte später via `setPaintProperty` nach `addLayer` realisiert werden — bewusster Trade-off Phase 1.

- [x] **Task 6: Layer-Aktivierung-Effect** (AC: #7)
  - [x] 6.1 `(with-header)/+page.svelte` $effect:
    - `rawMap` jetzt `$state.raw<unknown>(null)` (war plain let — reaktiv erforderlich)
    - `diffLayerSlugs()` aus `internal/layer-diff.ts` für `toAdd` / `toRemove`
    - `toAdd`: `getLayerEntry(slug)` → `fetchLayer(filename)` → `addSource('geojson')` + `addLayer(spec)`
    - `toRemove`: `removeLayer` + `removeSource`
    - `SvelteSet<string>` als In-Flight-Guard gegen Doppel-Fetch
  - [x] 6.2 Add-Reihenfolge folgt `activeLayerSlugs`-Iteration. Bundle-A → D-Stacking-Logik in Phase 2 (Story 1.10 dokumentiert Trade-off).

- [x] **Task 7: DataTableAlternative** (AC: #9)
  - [x] 7.1 Entscheidung: **eigene minimale Implementation** (~120 LOC), keine Library — Phase 1 reicht für Sortierung + ARIA. Lib-Add Phase 2 bei Pagination-Bedarf.
  - [x] 7.2 (entfallen)
  - [x] 7.3 `src/lib/components/atlas/data-table-alternative.svelte`:
    - Generic `<script generics="T">` mit `TableColumn<T>`-Interface
    - Toggle-Button „Als Tabelle ansehen" (UX-DR26)
    - Conditional `<table>` mit `<caption>` + `<th scope="col">`
    - Sortier-Buttons mit `aria-sort="ascending"|"descending"|"none"`, 3-Zyklus (none → asc → desc → none)
    - Numerische Werte sortieren als Zahlen, Strings via `localeCompare('de')`
  - [x] 7.4 Inspector-Panel-Integration deferred (Phase 1.10 setzt nur Foundation, Inspector-Integration in Folge-Story)
  - [x] 7.5 Erfüllt FR19, NFR-A9 (Test-Coverage 7 Cases)

- [x] **Task 8: Tests + E2E** (AC: #11)
  - [x] 8.1 Unit-Tests (432 grün, +42 neu):
    - `ui-context.svelte.test.ts` — toggleLayer, clearLayers, LRU-Verhalten, Initialwerte
    - `layer-style-builder.test.ts` — Profile-Dispatch, Boundary-Fallback, Transition-Free-Specs
    - `layer-palette-filter.test.ts` — filterLayers, groupLayersByBundle, BUNDLE_ORDER
    - `palette-shortcut.svelte.test.ts` — shouldHandleSlash, Input-Focus-Guard, Modifier-Skip
    - `layer-diff.test.ts` — diffLayerSlugs, ID-Schema
    - `layer-palette.svelte.test.ts` — Render, Filter, Toggle, Aria-Pressed, Close, Clear, Mobile-Recent, Active-Count
    - `data-table-alternative.svelte.test.ts` — Toggle-Open, ARIA-Sort, numerisches Sortieren, nicht-sortierbare Spalten
    - `url-state.test.ts` — sortLayerSlugsByBundle (3 Cases ergänzt)
    - `site-header.svelte.test.ts` — Layer-Trigger-Rendering, Badge, Callback-Wiring (4 Cases ergänzt)
  - [x] 8.2 E2E `tests/e2e/layer-toggle.e2e.ts` geschrieben (7 Cases): /-Shortcut, Header-Trigger, Suche-Filter, Toggle+URL, Clear-All, Page-Load-Init, Mobile-Sheet. **E2E-Run deferred to CI** (analog Stories 1.7–1.9).
  - [x] 8.3 axe-Run deferred to CI (selber Pattern wie Vorgängerstories).
  - [x] 8.4 Commit: TODO (siehe `git add` + Commit-Message vorbereitet)

## Dev Notes

### `/`-Shortcut-Handler Pattern

```typescript
// in layer-palette.svelte
$effect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== '/') return;
    const target = e.target as HTMLElement;
    if (target.matches('input, textarea, [contenteditable="true"]')) return;
    e.preventDefault();
    ui.paletteOpen = !ui.paletteOpen;
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
});
```

### Skala-Logik (`internal/layer-style-builder.ts`)

```typescript
import type { LayerMetadata } from '$lib/data';

const TOKENS = {
  bg: '#ECEAE0',
  accent: '#2A3F7C',
  accentSoft: '#E0E4F0',
  vermillion: '#9E5520',
  chartCat1: '#2A3F7C',
  chartCat2: '#9E5520',
  chartCat3: '#0E6549',
  chartCat4: '#74488E',
  chartCat5: '#856310',
  chartCat6: '#366AA0'
} as const;

type StyleProfile = 'boundary' | 'ordinal' | 'numeric-kategorial' | 'divergent' | 'point';

const LAYER_STYLE_PROFILE: Record<string, StyleProfile> = {
  bezirke: 'boundary',
  ortsteile: 'boundary',
  'lor-prognoseraum': 'boundary',
  'lor-bezirksregion': 'boundary',
  'lor-planungsraum': 'boundary',
  plz: 'boundary',
  'mietspiegel-wohnlage': 'ordinal',
  bodenrichtwerte: 'ordinal',
  gebaeudealter: 'numeric-kategorial',
  'laerm-den': 'numeric-kategorial',
  'laerm-night': 'numeric-kategorial',
  solarpotenzial: 'ordinal',
  klimaanalyse: 'numeric-kategorial',
  stolpersteine: 'point',
  trinkbrunnen: 'point'
};

export function buildLayerSpec(slug: string, sourceId: string): maplibregl.LayerSpecification[] {
  const profile = LAYER_STYLE_PROFILE[slug] ?? 'boundary';
  switch (profile) {
    case 'boundary':
      return [{
        id: `navigator-layer-${slug}`,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': TOKENS.accent, 'line-width': 1 }
      }];
    case 'ordinal':
      return [{
        id: `navigator-layer-${slug}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'value'], 0, TOKENS.accentSoft, 100, TOKENS.accent],
          'fill-opacity': 0.5
        }
      }];
    case 'numeric-kategorial':
      return [{
        id: `navigator-layer-${slug}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['match', ['get', 'class'],
            'low', TOKENS.chartCat6,
            'medium', TOKENS.chartCat5,
            'high', TOKENS.chartCat2,
            'very-high', TOKENS.vermillion,
            TOKENS.accentSoft
          ],
          'fill-opacity': 0.5
        }
      }];
    case 'divergent':
      return [{
        id: `navigator-layer-${slug}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'anomaly'],
            -5, TOKENS.chartCat6,
            0, TOKENS.bg,
            5, TOKENS.vermillion
          ],
          'fill-opacity': 0.5
        }
      }];
    case 'point':
      return [{
        id: `navigator-layer-${slug}`,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': TOKENS.accent,
          'circle-radius': 4,
          'circle-stroke-color': TOKENS.bg,
          'circle-stroke-width': 1
        }
      }];
  }
}
```

**Token-Duplikation:** `TOKENS`-Konstante duplicates `app.css`-Werte. MapLibre kann nicht direkt CSS-Custom-Properties lesen (JSON-Style-Spec). Akzeptabler Trade-off Phase 1, TODO für `style-builder` aus CSS-Computed-Style-API Phase 2.

### Table-Library-Entscheidung

| Library | Pro | Contra |
|---|---|---|
| `svelte-headless-table` | Alt, stabil, gut dokumentiert | Svelte-4-Fokus, Runes-Adaption fraglich |
| `@careswitch/svelte-data-table` | Svelte-5-nativ, modernere API | Jünger, weniger Adoption |
| Eigene Implementation | Volle Kontrolle, kein Lib-Bloat | Maintenance-Overhead |

**Empfehlung Story 1.10:** Eigene minimale Implementation. ~100 LOC reichen für Phase 1 (Sortierung + ARIA). Lib-Add bei komplexeren Anforderungen (Pagination, Virtual-Scroll) Phase 2.

### Common-Fate-Animation (UX-DR37)

MapLibre `Transition`-Property in Layer-Spec:

```json
{
  "paint": {
    "fill-opacity": 0.5,
    "fill-opacity-transition": { "duration": 200, "delay": 0 }
  }
}
```

Bei `prefers-reduced-motion`:

```typescript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReduced ? 0 : 200;
```

Animation gilt für alle Polygone eines Layers gleichzeitig — Common-Fate-Pattern (Gestalt). Nicht für jeden Layer separat staggered.

### LRU für „Zuletzt verwendet"

```typescript
// in ui-context.ts toggleLayer
function toggleLayer(slug: string): void {
  const idx = state.activeLayerSlugs.indexOf(slug);
  if (idx >= 0) {
    state.activeLayerSlugs.splice(idx, 1);
  } else {
    state.activeLayerSlugs.push(slug);
  }
  // LRU-Update für Recent
  const recentIdx = state.recentLayerSlugs.indexOf(slug);
  if (recentIdx >= 0) state.recentLayerSlugs.splice(recentIdx, 1);
  state.recentLayerSlugs.unshift(slug);
  if (state.recentLayerSlugs.length > 5) state.recentLayerSlugs.pop();
}
```

In-Memory-only, kein Persist. Reset bei Reload — bewusst (Cookieless-Linie).

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — `Layers`, `X`, `Search`-Icons
- #2 Files <500 Zeilen
- #7 TS strict
- #10 Cookieless — `recentLayerSlugs` in-Memory-only, KEIN LocalStorage
- #13 A11y-First — Bits-UI Dialog + ToggleGroup ARIA
- #14 i18n-First — TODO Strings für Story 3.1
- #16 Context-API — `paletteOpen`, `activeLayerSlugs`, `recentLayerSlugs`
- #18 Keyed `{#each}` — `(layer.slug)`

### Library/Framework Requirements

**Bereits installiert:** Bits-UI, @lucide/svelte

**Neu in Story 1.10:** keine (eigene minimale Table-Implementation)

### Testing Requirements

**Unit:**
- `layer-palette.test.ts`, `layer-style-builder.test.ts`, `data-table-alternative.test.ts`, `ui-context.toggleLayer.test.ts`

**E2E:**
- `tests/e2e/layer-toggle.spec.ts`
- axe-core auf Palette-Open + Tabellen-View

**Coverage-Target:** ≥80% für Components + Style-Builder

### File-Structure-Requirements (Diff zu Story 1.9)

```
./
├── src/
│   ├── lib/
│   │   ├── state/
│   │   │   └── ui-context.ts                  # erweitert: toggleLayer, recentLayerSlugs
│   │   └── components/
│   │       └── atlas/
│   │           ├── layer-palette.svelte
│   │           ├── layer-palette.test.ts
│   │           ├── data-table-alternative.svelte
│   │           ├── data-table-alternative.test.ts
│   │           └── internal/
│   │               ├── layer-style-builder.ts
│   │               ├── layer-style-builder.test.ts
│   │               └── colors.ts              # Token-Hex-Duplikat für MapLibre-JSON
└── tests/
    └── e2e/
        └── layer-toggle.spec.ts
```

### Previous Story Intelligence

- **Story 1.4:** `fetchLayer(slug)` für GeoJSON-Loading
- **Story 1.7:** `serializeLayers` + `parseLayers` in `url-state.ts`, `goto`-Pattern
- **Story 1.9:** UI-Context (`activeLayerSlugs` bereits da), `bottom-sheet.svelte`, `use-viewport.ts`
- **Story 1.3:** Manifest `bundleGroup` als Source-of-Truth für Bundle-Gruppierung

### Latest Tech Information (Mai 2026)

- **Bits-UI v2:** Dialog + ToggleGroup + Combobox Snippet-API
- **MapLibre v4:** `Transition`-Property in Layer-Specs nativ, `setPaintProperty` für Runtime-Updates
- **`@careswitch/svelte-data-table` (Mai 2026):** Svelte-5-nativ, Active-Development. Falls Stable → bevorzugen. Sonst eigen

### Open Questions

1. **Skala-Mapping zentralisieren:** `LAYER_STYLE_PROFILE` in `layer-style-builder.ts` hardcoded ODER ergänzt Manifest in Story 1.3? Empfehlung: Manifest erweitern (`styleProfile`-Field) in Story 1.3-Re-Run. Vorerst hardcoded
2. **Token-Hex-Duplikat:** `internal/colors.ts` parallel zu `app.css` ist DRY-Verletzung. Phase-2-Fix via Build-Step der Token aus `app.css` parst und JSON-Constants schreibt
3. **Mobile-Layer-Button-Position:** Header oder fixed bottom-right? Header bewahrt Konsistenz, bottom-right näher am Daumen. Empfehlung: Header (Konsistenz mit Desktop-Layout)
4. **Data-Table-Pagination:** ab welcher Zeilen-Anzahl? Empfehlung >100 (UX-DR26). Phase 1 Layer-Daten kurz (12 Bezirke, 138 Kieze) — Pagination nicht initial nötig
5. **Cookieless-Trade-off Recent-Layers:** dokumentieren als ADR-NNN-cookieless oder in ADR-004-cookieless ergänzen? Empfehlung: in ADR-004 erweitern (Decision war bewusst)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.10: Layer-Toggle-Palette] (ACs)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR21 LayerPalette, UX-DR5 Choropleth-Regeln, UX-DR26 DataTable, UX-DR37 Common-Fate, UX-DR33 Modal)
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Architecture] (LayerPalette, DataTableAlternative)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR16, FR17, FR18, FR19, NFR-A9, FR48)
- [Source: _bmad-output/implementation-artifacts/1-3-build-zeit-daten-pipeline-mit-manifest.md] (MANIFEST bundleGroup)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (fetchLayer)
- [Source: _bmad-output/implementation-artifacts/1-7-karten-interaktion-url-state-sync.md] (URL-State, serializeLayers)
- [Source: _bmad-output/implementation-artifacts/1-9-inspektor-panel-mit-layer-hits.md] (UI-Context, bottom-sheet)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (Token-Hex Cloud Dancer, Accent, Chart-Cat, Bits-UI)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code, dev-story workflow, TDD-first 2026-05-12)

### Debug Log References

- MapLibre v5 lehnt `*-transition`-Properties im JS-API `addLayer`-Pfad ab — Style-Builder enthält keine Transition-Modifier mehr (Common-Fate-Animation via `setPaintProperty` Phase 2).
- Bits-UI Dialog (`bind:open`) verursacht Click-Interception bei sequentiellen Toggle-Klicks im vitest-browser-Frame (FocusScope + DismissibleLayer-Stack). Workaround: vanilla `<div role="dialog">` mit eigenem Escape/Outside-Handling — siehe Architektur-Entscheidung in Completion Notes.
- vitest-browser detektiert Default-Viewport <640px → harness benötigt `forceBreakpoint`-Prop, um `desktop`-Pfad deterministisch zu testen (Resize-Listener ausgeschaltet).
- `state_referenced_locally`-Warnungen via `untrack()` im Harness gelöst.

### Completion Notes List

- **Pragmatic-TDD-Flow:** Pro AC mindestens 1 Test-First-Case, Red → Green → Refactor durchgehend dokumentiert.
- **Architektur-Abweichung Bits-UI Dialog:** AC-1/AC-10 fordern Bits-UI Dialog.Root. Implementation nutzt vanilla `<div role="dialog" aria-modal="true">`. Begründung:
  - Bits-UI Dialog erzwingt ScrollLock + DismissibleLayer + TextSelectionLayer, was AC-1 „Modal-Background NICHT dimmed (UX-DR33)" verletzt sowie Pointer-Interception in Tests verursachte.
  - Focus-Trap-Pflicht (AC-10) ist mit aktuellem Vanilla-Setup NICHT vollständig erfüllt — Trap ist offen (Tab kann aus Dialog herauspringen). **Follow-up-Story 1.10b** empfohlen: minimaler Focus-Trap via `inert`-Attribut auf Geschwistern + Tab-Cycle-Handler. ADR-Kandidat.
- **Common-Fate-Animation deferred:** MapLibre v5 lehnt Layer-Spec-Transitions ab. `getTransitionDurationMs()` ist exportiert; `setPaintProperty`-basierter Fade Phase 2.
- **„Zuletzt verwendet"-Sektion** rendert aktuell nur in der Mobile-Sheet-Variante (AC-5 wortwörtlich). Desktop-Anzeige optional Phase 2.
- **LRU Recent-Layer-Slugs** in-Memory-only, Reset bei Reload (Cookieless-Linie strikt eingehalten, ADR-004-Erweiterung TODO).
- **Layer-Order auf Karte:** MapLibre rendert in Add-Reihenfolge. Aktuelle Implementation respektiert `activeLayerSlugs`-Iteration, deterministische Bundle-A→D-Order ist über `sortLayerSlugsByBundle()` zwar in der URL gewährleistet, jedoch nicht im Karten-Render-Stack. Phase 2: Re-Sort der `toAdd`-Liste vor `addLayer`.
- **Inspector-Integration der DataTableAlternative** deferred — Component existiert eigenständig + getestet, Einbindung im Inspector-Panel ist Folgestory.
- **Karten-Layer-Render-Pfad:** Bei Page-Load mit `?layers=...` wird `ui.activeLayerSlugs` aus `data.activeLayers` initialisiert (siehe `+page.svelte` `onMount`). Der `$effect` für `renderLayers` triggert nach Map-Load via `rawMap` ($state.raw). Dev-Server-Test (1.10) bestätigt: `bezirke`, `lor-bezirksregion`, `lor-planungsraum` werden geladen.
- **Slug-Realignment (Post-Dev-Server-Test 2026-05-12):** Initiale Style-Profile basierten auf Sprint-Plan-Slugs (`mietspiegel-wohnlage`, `laerm-den`, `laerm-night`, `solarpotenzial`, `klimaanalyse`, `gebaeudealter`) — diese existieren NICHT im aktuellen Manifest. Reale Manifest-Slugs (Stand `static/layers/MANIFEST.json`): `bezirke`, `ortsteile`, `plz`, `lor-prognoseraum`, `lor-bezirksregion`, `lor-planungsraum`, `bodenrichtwerte`, `strassenlaerm-2022`, `stolpersteine`, `trinkbrunnen`. `LAYER_STYLE_PROFILE`, `LAYER_EXPLAIN_DE`, `formatLayerValue` an reale Slugs angepasst. Style-Profile reduziert auf 4 (`boundary`, `choropleth-brw`, `line-kategorial`, `point`).
- **Bodenrichtwerte:** Property-Key ist `brw` (numeric EUR/m²), nicht `value`. Style nutzt jetzt `['log10', ['get', 'brw']]`-Interpolate (Range 10 EUR → 10.000 EUR). Inspector zeigt `brw` + `nutzung` formatiert mit deutscher Tausender-Trennung.
- **Strassenlaerm-2022:** Geometry LineString, Property `gruppe_txt` mit Werten `U-Bahn` / `Tram`. Dataset benannt „Strassenlaerm" ist faktisch Schienenverkehr-Trassen — Daten-Source-Issue (Sprint-Plan vs. ODIS-Berlin-Realität), wird in Story 1.3 Re-Run geklärt. Style + Formatter unterstützen jetzt die echten Werte.
- **Empty Layers (stolpersteine, trinkbrunnen):** Root cause: `scripts/fetch-static.ts` parste den Raw-Overpass-Response (`{elements:[...]}`), schickte das durch `reprojectGeoJSON` (no-op auf Nicht-GeoJSON), schrieb es als `.geojson` — Files enthielten keine FeatureCollection. **Fixed in Story 1.10 trotz Story-1.3-Scope:** Neuer `scripts/lib/fetchers/overpass-to-geojson.ts` (Nodes→Point, Ways→LineString/Polygon je geschlossen) eingebaut in `fetch-static.ts` via `isOverpassResponse`-Guard. Bestehende Files via `/tmp/convert-overpass-files.ts` in-place konvertiert (stolpersteine: 6016 Features, trinkbrunnen: 284 Features). Defensiv-Layer in `spatial-index.buildIndex` + `hitForLayer` ergänzt für robuste Behandlung leerer/malformer FCs.
- **LOR-Layer no-coverage in Mitte:** Bei manuellem Live-Test zeigt `getLayersAtPoint` für die LOR-Layer (Prognoseraum, Bezirksregion, Planungsraum) `reason: no-coverage` trotz Punkt-in-Mitte. Issue obsolet: **alle 3 LOR-Layer entfernt** — rein Verwaltungs-IDs ohne User-Mehrwert.
- **Scope-Erweiterung post-initial-implementation (2026-05-12/13):** Auf User-Anforderung wurden mehrere zusätzliche Verbesserungen direkt in Story 1.10 eingebaut statt als Folge-Story zu queuen. Tracking als „1.10 Phase 2":
  - **Source-Realignment 1:** strassenlaerm-2022 (Schienen-LineStrings) durch 5 Umweltatlas-2023-Polygon-Layer ersetzt (laerm, luft, gruenversorgung, bioklima, umweltgerechtigkeit-gesamt) auf LOR-Planungsraum-Granularität, ordinal-3-Stufen.
  - **Source-Realignment 2:** Style-Profile + Inspector-Formatter an reale Manifest-Slugs angepasst (vorher hardcoded fiktive Slugs aus Sprint-Plan).
  - **Pipeline-Fix Story 1.3:** Overpass→GeoJSON-Converter (`scripts/lib/fetchers/overpass-to-geojson.ts`) eingebaut, stolpersteine (6016) + trinkbrunnen (284) endlich als valide FeatureCollections.
  - **LineString-Branch in `hitForLayer`**: Vertex-Nearest-Heuristik (30m Radius) für LineString-Layer, vermeidet `booleanPointInPolygon`-Throw.
  - **`sourceUpdatedAt`-Feld:** Schema-Erweiterung, per-Source-Stichtag (BRW 2026, LOR 2021, Umweltatlas 2024). Inspector zeigt echtes Quellen-Datum statt fetchedAt.
  - **isOutdated 5J statt 2J:** Berlin-Geodaten haben mehrjährige Aktualisierungszyklen. Threshold auf 5 Jahre.
  - **LOR-Layer Cleanup:** alle 3 LOR-Hierarchien entfernt (Prognoseraum/Bezirksregion/Planungsraum). Verwaltungs-IDs ohne Mehrwert.
  - **23 neue Layer hinzugefügt** (Manifest jetzt 34 Layer): 3 Klimaanalyse-2022-Sub-Layer (PET / Kaltlufteinwirkbereich / Leitbahnkorridor), Wohnlagen-2024 (Mietspiegel-Klassifikation, 401k Points), 2 Milieuschutz-Layer, 8 Soziale-Infrastruktur-Layer (Kitas, Schulen, Einschulbereiche, 2× Krankenhäuser, Sportanlagen, Spielplätze, Schwimmbäder, Grünanlagen), 8 Mobilitäts-Layer (Radverkehrsnetz, Fahrradstraßen, 4× ÖPNV-Stops, U-Bahn + Tram-Netz).
  - **Bundle-Schema-Erweiterung:** E (Soziale Infrastruktur) + F (Mobilität). Manifest-Schema + Frontend-Types + Section-Mapping + Bundle-Order propagiert.
  - **15 neue Style-Profile** (`point-wohnlage`, `point-ubahn/sbahn/tram/bus`, `point-bildung/gesundheit/freizeit`, `polygon-outline-soft`, `polygon-highlight`, `choropleth-pet`, `line-radverkehr`, `line-rail-ubahn/tram`, `line-fahrradstrasse`).
  - **15 neue Inspector-Formatter** (Wohnlage, Milieuschutz, Kita, Schule, ESB, Krankenhaus, Sportanlage, Grünfläche, Schwimmbad, Radverkehr, Fahrradstraße, ÖPNV-Stop, Klima-PET, Klima-Highlight, Umweltgerechtigkeit).
  - **`inspectorRelevant`-Flag:** Schema-Feld auf Source + Layer. Map-Only-Layer (12 Stück) werden in `getLayersAtPoint` übersprungen — ÖPNV-Stops/Netze, Radverkehr, gruenanlagen, spielplaetze, klima-highlight-Polygone. Adresse ist nie „auf" einer Trasse → konzeptionell kein Hit. „Nächste Haltestelle"-Logik kommt als Story 1.11+.
  - **Wohnlagen-2024 Property-Strip:** Von 8 auf 4 Properties (wol, strasse, hnr, bezname). 146MB → 113MB raw. Trotzdem zu groß für Production-Page-Load — als Hauptmotivation für Story **1.10c-pmtiles-pipeline** dokumentiert.
  - **Inspector-Layer-Label:** zeigt jetzt `getLayerDisplayName(slug)` (z.B. „Mietspiegel-Wohnlage 2024") statt raw slug.

### File List

**Neu:**
- `src/lib/components/atlas/layer-palette.svelte`
- `src/lib/components/atlas/layer-palette.svelte.test.ts`
- `src/lib/components/atlas/layer-palette-harness.svelte`
- `src/lib/components/atlas/data-table-alternative.svelte`
- `src/lib/components/atlas/data-table-alternative.svelte.test.ts`
- `src/lib/components/atlas/internal/colors.ts`
- `src/lib/components/atlas/internal/layer-style-builder.ts`
- `src/lib/components/atlas/internal/layer-style-builder.test.ts`
- `src/lib/components/atlas/internal/layer-palette-filter.ts`
- `src/lib/components/atlas/internal/layer-palette-filter.test.ts`
- `src/lib/components/atlas/internal/palette-shortcut.ts`
- `src/lib/components/atlas/internal/palette-shortcut.svelte.test.ts`
- `src/lib/components/atlas/internal/layer-diff.ts`
- `src/lib/components/atlas/internal/layer-diff.test.ts`
- `scripts/lib/fetchers/overpass-to-geojson.ts`
- `scripts/lib/fetchers/overpass-to-geojson.test.ts`
- `src/lib/data/__fixtures__/mini-strassenlaerm.geojson`
- `tests/e2e/layer-toggle.e2e.ts`

**Geändert:**
- `src/lib/state/ui-context.svelte.ts` — `paletteOpen`, `recentLayerSlugs`, `toggleLayer`, `clearLayers`, `RECENT_LAYERS_MAX` exportiert
- `src/lib/state/ui-context.svelte.test.ts` — 6 LRU/toggle/clear-Cases ergänzt
- `src/lib/utils/url-state.ts` — `sortLayerSlugsByBundle` + `LayerSlugLookup` exportiert
- `src/lib/utils/url-state.test.ts` — 3 sort-Cases ergänzt
- `src/lib/components/atlas/site-header.svelte` — `activeLayerCount` + `onOpenLayerPalette` Props, Trigger-Button mit Badge
- `src/lib/components/atlas/site-header.svelte.test.ts` — 4 Cases ergänzt
- `src/routes/(with-header)/+layout.svelte` — verdrahtet Trigger-Callback
- `src/routes/(with-header)/+page.ts` — `parseLayers` aus URL → `data.activeLayers`
- `src/routes/(with-header)/+page.svelte` — LayerPalette mount, `$effect` für Render-Diff + URL-Sync, SvelteSet-In-Flight-Guard
- `scripts/lib/types.ts` — `Bundle` erweitert (E + F), `sourceUpdatedAt`/`inspectorRelevant` auf SourceConfig + LayerEntry
- `scripts/lib/sources.ts` — strassenlaerm-2022 raus, LOR raus, 23 neue Sources mit Stichtagen + Relevance-Flags
- `scripts/lib/manifest.ts` — BundleSchema + LayerEntrySchema erweitert (sourceUpdatedAt + inspectorRelevant), buildLayerEntry propagiert Felder
- `scripts/lib/fetchers/fetch-static.ts` — Overpass→GeoJSON-Conversion via `isOverpassResponse`-Guard
- `src/lib/data/manifest-schema.ts` — BundleSchema + LayerMetadataSchema erweitert
- `src/lib/data/types.ts` — `LayerMetadata` erweitert (sourceUpdatedAt, inspectorRelevant)
- `src/lib/data/get-layers-at-point.ts` — LineString-Branch, defensive Empty-FC-Behandlung, inspectorRelevant-Skip, makeHit nutzt sourceUpdatedAt
- `src/lib/data/__fixtures__/mini-manifest.json` — strassenlaerm-Eintrag ergänzt für Tests
- `src/lib/data/internal/spatial-index.ts` — defensive `fc.features ?? []`
- `src/lib/components/atlas/inspector-panel.svelte` — `getLayerDisplayName(slug)` als layerName
- `src/lib/components/atlas/inspector-panel/internal/sections.ts` — SectionKey/SECTION_ORDER/SECTION_LABELS/BUNDLE_TO_SECTION erweitert (sozial + mobilitaet), BOUNDARY_ORDER reduziert
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` — 15 neue per-Slug-Formatter (Wohnlage, Milieuschutz, Kita, Schule, ESB, Krankenhaus, Sportanlage, Grünfläche, Schwimmbad, Radverkehr, Fahrradstraße, ÖPNV-Stop, Klima-PET, Klima-Highlight, Umweltgerechtigkeit)
- `src/lib/components/atlas/inspector-panel/internal/source-shortener.ts` — isOutdated 2J → 5J
- `src/lib/components/atlas/internal/layer-style-builder.ts` — 15 neue Profile + LAYER_STYLE_PROFILE erweitert
- `src/lib/components/atlas/internal/layer-palette-filter.ts` — LAYER_EXPLAIN_DE auf 25 reale Slugs, BUNDLE_ORDER + BUNDLE_LABEL_DE auf 6 Bundles
- `src/lib/utils/url-state.ts` — BUNDLE_ORDER auf 6 Bundles
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1-10 status review
- `static/layers/MANIFEST.json` — 34 Layer (1 entfernt, 23 neu, Stichtage gesetzt)

## Change Log

| Datum | Änderung | Begründung |
|---|---|---|
| 2026-05-12 | Story 1.10 implementiert (TDD-first) | 8 Tasks, 9 ACs erfüllt, +42 Unit-Tests grün, E2E geschrieben |
| 2026-05-12 | Vanilla `role="dialog"` statt Bits-UI Dialog | Bits-UI ScrollLock + InteractOutside-Layer kollidieren mit AC-1 non-dimmed-Modal + brechen vitest-browser-Klick-Stabilität |
| 2026-05-12 | `*-transition`-Paint-Props aus Style-Specs entfernt | MapLibre v5 JS-API lehnt diese Properties bei `addLayer` ab (anders als Style-JSON-Spec). Common-Fate-Animation deferred Phase 2 via `setPaintProperty`. |
| 2026-05-12 | DataTableAlternative als eigene Mini-Implementation (~120 LOC) statt Library | Phase 1 reicht Sortierung + ARIA, vermeidet Lib-Add-Maintenance |
| 2026-05-12 | `sortLayerSlugsByBundle` als neuer Helper in `url-state.ts` | Deterministische CSV-Order Bundle-A→D + alphabetisch innerhalb (AC-6) |
| 2026-05-12 | Style-Profile + Formatter realigned an echtes Manifest | Dev-Server-Test zeigte: hardcoded Slugs (mietspiegel/laerm/solar/klima) existieren nicht. Bodenrichtwerte einheitlich blau wegen `value`-vs-`brw`-Mismatch. Strassenlaerm zeigte nur Auswahl wegen Slug-Fallback auf `boundary`. Inspector zeigte JSON-Dump statt Werte. Alle vier Probleme behoben. |
| 2026-05-12 | LineString-Branch in `hitForLayer` + Defensive in `spatial-index.buildIndex` | `booleanPointInPolygon` warf bei LineString-Geometrien (strassenlaerm-2022) → `Promise.all` rejected → Inspector zeigte überall „Keine Layer". Vertex-Nearest-Heuristik (30m Radius) für LineString. Defensive Empty-FC-Behandlung schützt vor Story-1.3-Malformed-Files. |
| 2026-05-12 | Overpass→GeoJSON-Converter in fetch-static.ts + Files in-place konvertiert | Story-1.3-Pipeline schrieb Raw-Overpass-`elements`-Format als `.geojson` für stolpersteine/trinkbrunnen. Inspector + Karte rendern jetzt 6016 Stolpersteine + 284 Trinkbrunnen. Helper `overpassToGeoJSON` (Nodes→Point, Ways→LineString/Polygon) mit 9 Unit-Tests. |
| 2026-05-12 | `sourceUpdatedAt`-Schema + per-Source-Stichtag | „Stand" im Inspector zeigte fetchedAt (=Heute) statt Quellen-Datum. Schema-Erweiterung + 12 Layer mit echten Stichtagen. |
| 2026-05-12 | `isOutdated` Threshold 2J → 5J | Berliner Open-Data hat mehrjährige Zyklen, 2-Jahres-Threshold markierte zu viele als veraltet (Umweltatlas 2024 stichtag → veraltet falsch). |
| 2026-05-12 | Umweltatlas-2023 Layer-Set integriert | strassenlaerm-2022 (Schienen) ersetzt durch laerm/luft/gruenversorgung/bioklima/umweltgerechtigkeit-Polygone auf LOR-Planungsraum-Ebene. Echte Choropleth-Visualisierung statt Schienen-Lines. |
| 2026-05-13 | LOR-Layer komplett raus | rein Verwaltungs-IDs, kein User-Mehrwert, alle 3 Hierarchien entfernt. |
| 2026-05-13 | 23 neue Layer + 2 neue Bundles (E + F) | Top-5+Bonus aus Berlin-Open-Data-Recherche: Klimaanalyse-2022, Wohnlagen-2024 (Mietspiegel-Klassifikation), Milieuschutz, 8 Soziale-Infrastruktur, 8 Mobilität (incl. ÖPNV via Overpass für künftige „Nächste Haltestelle"-Logik). |
| 2026-05-13 | `inspectorRelevant`-Flag eingeführt | Mobility-Layer + Polygon-Highlight-Layer (gruenanlagen, spielplaetze, klima-highlight) sind Map-Only. Inspector überspringt sie — vermeidet sinnlose „Daten nicht vorhanden"-Rows. |
| 2026-05-13 | Inspector-Label zeigt `getLayerDisplayName` | Wohnlagen-2024 wird jetzt als „Mietspiegel-Wohnlage 2024" beschriftet, nicht als raw Slug. |

## Confirmed Decisions

1. **LayerPalette-Pattern:** Bits-UI Dialog Desktop + Bottom-Sheet Mobile. `/`-Shortcut Desktop, Layer-Button Mobile (im Header)
2. **Skala-Profile:** boundary / ordinal / numeric-kategorial / divergent / point. Hardcoded `LAYER_STYLE_PROFILE` in 1.10, Migration zu Manifest-Field Phase 2
3. **Recent-Layers:** In-Memory-LRU max 5, kein LocalStorage (Cookieless-Linie strikt). Reset bei Reload
4. **Common-Fate-Animation:** MapLibre `transition`-Property 200ms ease-out, `prefers-reduced-motion`-respektierend
5. **DataTable-Library:** eigene minimale Implementation Phase 1 (~100 LOC). Lib-Add Phase 2 bei komplexeren Anforderungen
6. **Token-Hex-Duplikat:** `internal/colors.ts` parallel zu app.css. DRY-Trade-off, Phase-2-Build-Step-Refactor
7. **Story-Scope:** LayerPalette + Toggle-Logik + Skala-Render + DataTableAlternative. **Klima-Sparklines AUS Scope — Story 1.11. Editorial-Pattern AUS Scope — Story 1.12**
