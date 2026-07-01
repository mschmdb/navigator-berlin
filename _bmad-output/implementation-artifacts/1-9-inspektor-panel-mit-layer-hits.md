# Story 1.9: Inspektor-Panel mit Layer-Hits

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Bürger,
I want bei Adress-Auswahl ein Inspektor-Panel mit allen Treffer-Layern in fester semantischer Reihenfolge (Boundaries → Wohn-Daten → Umwelt → Memorial → Klima),
so that ich die Cross-Layer-Sicht für meine Adresse als gleichzeitige Antwort sehe — mit Datenstand, Quellenangabe und Mailto-Feedback pro Wert.

## Acceptance Criteria

1. **AC-1 (UI-State-Context):**
   **Given** Architecture-Doc Context-API-Pattern (MUST-Rule #16)
   **When** `src/lib/state/ui-context.ts` implementiert wird
   **Then** Exports:
   - `createUiState()` — initialisiert `$state({ inspectorOpen, selectedAddress?, selectedLayerHits, activeLayerSlugs })`, `setContext(KEY, state)`, returns state
   - `getUiState()` — `getContext`-Wrapper, typed Return
   - Aufruf in `+layout.svelte` einmal per Request via `createUiState()` (SSR-Safe)
   **And** Erfüllt MUST-Rule #16, FR43, UX-DR50 (single global Channel).

2. **AC-2 (Globale ARIA-Live-Channel-Refactor):**
   **Given** Story 1.8 nutzt `<div id="map-status">` lokal in MapLibreCanvas
   **When** Live-Channel zentralisiert wird
   **Then** `+layout.svelte` rendert genau eine globale Live-Region: `<div id="global-aria-live" aria-live="polite" aria-atomic="false" class="sr-only"></div>`
   **And** Helper `announceGlobal(text: string)` in `$lib/utils/aria-live.ts` setzt `textContent` mit Clear-Timeout 5s
   **And** Map-Status-Updates aus Story 1.7/1.8 delegieren an Helper
   **And** Erfüllt UX-DR50 (sparsame Live-Regions, eine pro Page).

3. **AC-3 (InspectorPanel-Komponente):**
   **Given** UI-Context + `getLayersAtPoint` aus Story 1.4
   **When** `src/lib/components/atlas/inspector-panel.svelte` implementiert wird
   **Then** Komponente:
   - `<aside aria-live="polite" aria-atomic="false" aria-label="Layer-Daten für ausgewählte Adresse">`
   - Header: Plex-Serif h2 mit `displayName` der Adresse + Hairline-Bottom (`--rule`)
   - Sektionen in fester Reihenfolge (UX-DR18):
     1. Boundaries (Bezirk, Ortsteil, LOR-Ebenen, PLZ)
     2. Wohn-Daten (Mietspiegel, Bodenrichtwerte, Gebäudealter)
     3. Umwelt (Lärm L_DEN/L_NIGHT, Solar, Klimaanalyse)
     4. Memorial (Stolpersteine in der Nähe)
     5. Klima (DWD-Station-Hinweis — Sparklines kommen in Story 1.11)
   - Pro Sektion `<section>` mit h3-Plex-Serif-Header (Sektion-Name)
   - Pro Layer-Hit ein `<LayerHitRow>` (siehe AC-4)
   - Permalink-Button im Footer: Copy URL inkl. `?address=...&bbox=...&zoom=...&layers=...` (UX-DR18 Permalink)
   - Close-Button (X, top-right) — setzt `ui.inspectorOpen = false`
   **And** Layout:
   - Desktop (>1024px): CSS Grid `6fr 4fr` (Map | Panel) — UX-DR11
   - Tablet (641–1024px): `50vh 1fr` (Map oben, Panel unten)
   - Mobile (≤640px): `40vh 1fr` mit Bottom-Sheet-Mode (UX-DR11) — Sheet-Wrapper aus Story 1.2
   **And** Erfüllt FR14, UX-DR18.

4. **AC-4 (LayerHitRow-Komponente):**
   **Given** `LayerHit`-Typ aus Story 1.4
   **When** `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` implementiert wird
   **Then** Komponente:
   - `<div role="group" aria-label="{layerName}: {valueText}">`
   - Layer-Name links (Plex Sans Medium `--text-base`)
   - Wert prominent (Plex Sans SemiBold für kategorisch, Plex Mono via `.tabular` für Zahlen)
   - Plex-Serif-Erläuterung darunter (1 Zeile, max 80 Zeichen, `--ink-muted`) — Erläuterungs-Text aus `LayerExplainMap` (siehe Dev-Note „Layer-Explain-Mapping")
   - `<DataStandBanner>` unter Wert (AC-5)
   - Inline-Aktionen rechts: „→ Mehr erfahren"-Link zu `/layer/{slug}` (kommt in 2.5), „Fehler im Eintrag?"-Mailto (UX-DR38)
   - States via `data-state`-Attribut:
     - `with-value` Default
     - `no-coverage` — graue Hairline + Text „Daten nicht vorhanden"
     - `seasonal` — Plex-Mono-Hinweis „Layer Mai–Oktober aktiv"
     - `outdated` (>2 Jahre) — `--state-warning`-Pille rechts (UX-DR19)
   **And** Erfüllt FR15, UX-DR19.

5. **AC-5 (DataStandBanner-Komponente):**
   **Given** `LayerHit`-Provenance-Daten
   **When** `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte` implementiert wird
   **Then** Banner:
   - Plex-Mono `--text-xs` `--ink-subtle`
   - Format: „Stand: {YYYY-MM} · Quelle: {sourceShort} · {license}"
   - `sourceShort`-Map: `FIS-Broker WFS → "FIS-Broker"`, `ODIS GeoJSON → "ODIS Berlin"`, `DWD CDC → "DWD"`, `Overpass → "OpenStreetMap"`
   - Lizenz-Anzeige kurz: `dl-de/zero-2.0 → "dl-de/zero"`, `dl-de/by-2.0 → "dl-de/by"`, etc.
   - Bei `>2 Jahre`: `--state-warning`-Pille rechts mit Text „Veraltet" + Tooltip mit genauem Datum
   - **Niemals** als Tooltip versteckt (UX-DR20 explizit)
   **And** Erfüllt UX-DR20.

6. **AC-6 (No-Coverage + Seasonal-States):**
   **Given** `getLayersAtPoint` liefert `LayerHit.reason = 'no-coverage' | 'seasonal'`
   **When** LayerHitRow rendert
   **Then** No-Coverage: Wert-Slot zeigt „Daten nicht vorhanden" (Plex Sans Italic `--ink-subtle`), DataStandBanner zeigt Quelle aber kein Wert (FR20)
   **And** Seasonal (Trinkbrunnen außerhalb 05-01–10-31): „Layer Mai–Oktober aktiv" + DataStandBanner als Hinweis (FR21)
   **And** No-Coverage-Layer werden NICHT aus Panel ausgelassen — alle Bundle-A/B/C/Memorial-Layer immer sichtbar (FR20).

7. **AC-7 (Inspector-Open-Trigger + Reaktivität):**
   **Given** UI-Context + Story 1.7-Click-Flow
   **When** Nutzer Adresse selektiert (AddressSearch-Submit ODER Map-Click)
   **Then** Selection-Handler:
   1. `ui.selectedAddress = { displayName, lat, lng, ... }`
   2. `ui.selectedLayerHits = await getLayersAtPoint(lat, lng)`
   3. `ui.inspectorOpen = true`
   4. `announceGlobal(\`Inspektor geöffnet für \${displayName}\`)`
   **And** Re-Selection: Inhalt aktualisiert sich Slot-für-Slot via Svelte-5-Reaktivität, KEIN Full-Re-Mount
   **And** Verifiziert via `console.count`-Logging im Mount-Lifecycle: nur 1× Mount pro Page-Load
   **And** Erfüllt FR43, UX-DR18.

8. **AC-8 (Permalink-Button):**
   **Given** Inspector-Footer
   **When** Nutzer Permalink-Button klickt
   **Then** Aktuelle URL inkl. `?address=...&bbox=...&zoom=...&layers=...&lang=...` wird in Clipboard kopiert via `navigator.clipboard.writeText`
   **And** Visuelles Feedback: Toast-loser Inline-Status „URL kopiert" für 2s neben Button (UX-DR30 inline statt Toast)
   **And** Erfüllt UX-DR18 Permalink-Requirement.

9. **AC-9 (Mobile Bottom-Sheet-Mode):**
   **Given** Mobile-Viewport (≤640px) + Bits-UI-Sheet-Wrapper aus Story 1.2
   **When** Inspector geöffnet wird auf Mobile
   **Then** Panel rendert als Bottom-Sheet mit Snap-Punkten 40vh / 70vh / 100vh (UX-DR11)
   **And** Toggle-Button zum Expandieren ohne Drag (SC 2.5.7-Compliance Story 1.8)
   **And** Esc oder X-Button schließt Sheet
   **And** Karten-Höhe oberhalb passt sich an Sheet-Snap an (CSS-Grid-Layout `${sheetVh} 1fr`)
   **And** Erfüllt UX-DR11, UX-DR33 (Modal-Pattern).

10. **AC-10 (Tests + axe):**
    **Given** alle Components
    **When** Tests laufen
    **Then** Unit-Tests:
    - `layer-hit-row.test.ts` — States (with-value, no-coverage, seasonal, outdated)
    - `data-stand-banner.test.ts` — Format + Warning-Pille
    - `inspector-panel.test.ts` — Sektion-Reihenfolge + Re-Render-Behavior
    - `aria-live.test.ts` — Helper + Clear-Timeout
    **And** E2E `tests/e2e/inspector-panel.spec.ts`:
    - Adress-Selection → Panel öffnet sich → alle 5 Sektionen sichtbar
    - Re-Selection: Panel-Mount-Count bleibt 1 (Reaktivität, kein Re-Mount)
    - Permalink-Copy
    - Mobile-Viewport: Bottom-Sheet-Snap-Toggle
    - Escape schließt Inspector
    **And** axe-core: 0 Violations für Adress-Sicht mit offenem Inspector.

## Tasks / Subtasks

- [x] **Task 1: UI-Context** (AC: #1)
  - [ ] 1.1 `src/lib/state/ui-context.ts`:
    ```typescript
    import { getContext, setContext } from 'svelte';
    import type { LayerHit, GeocodeSuggestion } from '$lib/data';

    const KEY = Symbol('ui-state');

    export interface UiState {
      inspectorOpen: boolean;
      selectedAddress: GeocodeSuggestion | null;
      selectedLayerHits: LayerHit[];
      activeLayerSlugs: string[];
      sheetSnapVh: 40 | 70 | 100;  // Mobile-Sheet
    }

    export function createUiState() {
      const state = $state<UiState>({
        inspectorOpen: false,
        selectedAddress: null,
        selectedLayerHits: [],
        activeLayerSlugs: [],
        sheetSnapVh: 40
      });
      setContext(KEY, state);
      return state;
    }

    export function getUiState(): UiState {
      const ctx = getContext<UiState>(KEY);
      if (!ctx) throw new Error('UiState not in context — call createUiState() in +layout.svelte');
      return ctx;
    }
    ```
  - [ ] 1.2 `src/routes/+layout.svelte` ergänzen: `createUiState()` als erste Zeile im `<script>`
  - [ ] 1.3 Unit-Test mit Svelte-Test-Runner

- [x] **Task 2: Global ARIA-Live-Channel** (AC: #2)
  - [ ] 2.1 `src/lib/utils/aria-live.ts`:
    ```typescript
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    export function announceGlobal(text: string, level: 'polite' | 'assertive' = 'polite'): void {
      if (typeof document === 'undefined') return;
      const id = level === 'assertive' ? 'global-aria-live-assertive' : 'global-aria-live';
      const el = document.getElementById(id);
      if (!el) return;
      if (clearTimer) clearTimeout(clearTimer);
      el.textContent = text;
      clearTimer = setTimeout(() => { el.textContent = ''; }, 5000);
    }
    ```
  - [ ] 2.2 `+layout.svelte` ergänzen: zwei sr-only `<div>` mit `id="global-aria-live"` (polite) + `id="global-aria-live-assertive"` (assertive)
  - [ ] 2.3 Story 1.7/1.8 `announceMapStatus`-Calls auf `announceGlobal` umschreiben — `<div id="map-status">` aus MapLibreCanvas entfernen
  - [ ] 2.4 Unit-Test `aria-live.test.ts`: Set-Text + Clear-Timeout

- [x] **Task 3: DataStandBanner** (AC: #5)
  - [ ] 3.1 `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte`:
    - Props: `hit: LayerHit`
    - `$derived`: `formattedDate` (YYYY-MM aus ISO), `sourceShort`, `licenseShort`, `isOutdated` (>2 Jahre)
    - Render mit Plex-Mono `text-xs text-ink-subtle font-mono`
    - Conditional Warning-Pille rechts bei `isOutdated`
  - [ ] 3.2 Source-Shortener-Map (Dev-Note „Source-Shortener")
  - [ ] 3.3 Unit-Test mit verschiedenen License/Source-Kombinationen

- [x] **Task 4: LayerHitRow** (AC: #4, #6)
  - [ ] 4.1 `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte`:
    - Props: `hit: LayerHit`, `layerMeta: LayerMetadata`
    - State-Derivation via `$derived`:
      - `state: 'with-value' | 'no-coverage' | 'seasonal' | 'outdated'`
      - `valueText`: Mapping aus `value` zu Display-String via `value-formatters.ts`
      - `isNumeric`: Boolean für Mono-vs-Sans-Wahl
    - Layout: 2-Column-Grid (name+value links, action-Icons rechts), darunter Explain + Banner
    - Action-Buttons:
      - „→ Mehr erfahren"-Link zu `/{lang}/layer/{slug}` (404 in Phase 1.9, voll in 2.5)
      - Mailto-Link: `mailto:hallo@navigator.berlin?subject=Fehler%20im%20Eintrag:%20{slug}&body=Layer:%20{slug}%0AAdresse:%20{displayName}`
      - Lucide-Icons `ExternalLink`, `Mail`
  - [ ] 4.2 `internal/value-formatters.ts`:
    - `formatLayerValue(slug: string, value: unknown): { text: string; isNumeric: boolean }`
    - Pro Layer-Typ ein Branch (Mietspiegel-Wohnlage → „gut", Lärm → „60–65 dB", etc.)
    - Source-of-Truth Property-Mapping aus `value-extractors.ts` (Story 1.4)
  - [ ] 4.3 `internal/layer-explain.ts`:
    - `LAYER_EXPLAIN_DE: Record<string, string>` — Layer-Slug → 1-Zeilen-Erklärung (≤80 Zeichen)
    - Beispiele:
      - `'mietspiegel-wohnlage': 'Wohnlagen-Bewertung im Berliner Mietspiegel (einfach/mittel/gut)'`
      - `'laerm-den': 'Tag-/Abend-/Nacht-Lärmpegel an Straße (Schiene separat)'`
      - `'stolpersteine': 'Gedenksteine für Opfer des Nationalsozialismus'`
    - TODO-Annotation für i18n-Migration Story 3.1
  - [ ] 4.4 Component-Test mit allen 4 State-Variants

- [x] **Task 5: InspectorPanel-Container** (AC: #3, #7)
  - [ ] 5.1 `src/lib/components/atlas/inspector-panel.svelte`:
    - `<aside aria-live="polite" aria-atomic="false">`
    - `getUiState()` für `selectedAddress` + `selectedLayerHits` + `inspectorOpen`
    - `$derived` für gruppierte Hits via `bundleGroup` aus `LayerMetadata`:
      - Bundle A → Sektion 1 Boundaries
      - Bundle B → Sektion 2 Wohn-Daten
      - Bundle C → Sektion 3 Umwelt (mit Trinkbrunnen-Saisonalität)
      - Bundle D → Sektion 4 Memorial
      - Klima-Hint → Sektion 5 (Placeholder, Story 1.11 ersetzt mit Sparklines)
    - Header: h2 + Close-Button
    - Footer: Permalink-Button (Task 7)
  - [ ] 5.2 Conditional-Render via `{#if ui.inspectorOpen && ui.selectedAddress}`
  - [ ] 5.3 Mount-Lifecycle: Slot-Reaktivität — KEIN `{#key}` um Re-Mount zu vermeiden
  - [ ] 5.4 Integration in Adress-Sicht-Page (`(with-header)/[lang=lang]/+page.svelte`):
    - Grid-Layout: Desktop `6fr 4fr`, Tablet/Mobile responsive
    - `<MapLibreCanvas />` + `<InspectorPanel />` als Grid-Children
  - [ ] 5.5 Inspector-Open-Trigger:
    - `MapLibreCanvas.onClick` + `AddressSearch.onSelect` in Adress-Sicht-Handler
    - Handler ruft `ui.selectedAddress = ...`, `ui.selectedLayerHits = await getLayersAtPoint(...)`, `ui.inspectorOpen = true`
    - `announceGlobal('Inspektor geöffnet für ' + displayName)`

- [x] **Task 6: Mobile-Bottom-Sheet** (AC: #9)
  - [ ] 6.1 `src/lib/components/atlas/inspector-panel/bottom-sheet.svelte`:
    - Wrapper um Bits-UI-Sheet-Komponente aus Story 1.2
    - Snap-Punkte: 40vh / 70vh / 100vh
    - Toggle-Button (Pfeil-Hoch-Icon, Lucide `ChevronUp` / `ChevronDown`) — Single-Click-Alternative für Drag (SC 2.5.7)
    - Drag-Handle-Bar oben (visuell), aber Toggle-Button funktional pflicht
  - [ ] 6.2 `useViewportBreakpoint`-Hook in `lib/utils/use-viewport.ts`:
    - `$state` für `breakpoint: 'mobile' | 'tablet' | 'desktop'`
    - `$effect` mit `window.matchMedia`-Listenern
  - [ ] 6.3 `inspector-panel.svelte` rendert conditional:
    - Desktop: Side-Panel
    - Mobile: BottomSheet-Wrapper
  - [ ] 6.4 `ui.sheetSnapVh` synchron mit Sheet-State, Karte-Höhe via CSS-Custom-Property

- [x] **Task 7: Permalink-Button** (AC: #8)
  - [ ] 7.1 `src/lib/components/atlas/inspector-panel/permalink-button.svelte`:
    - Plex-Sans `text-sm`, Tertiary-Link-Style aus UX-DR29
    - `onClick`: `navigator.clipboard.writeText(window.location.href)`
    - Inline-Status `<span aria-live="polite">URL kopiert</span>` für 2s nach Klick
    - Lucide-Icon `Link2`
  - [ ] 7.2 Browser-Compat: `navigator.clipboard` requires HTTPS oder localhost — OK Production via Coolify-TLS

- [x] **Task 8: Live-Region-Refactor + Story 1.7/1.8-Calls migrieren** (AC: #2)
  - [ ] 8.1 `map-libre-canvas.svelte` `<div id="map-status">` entfernen
  - [ ] 8.2 Click-Handler ruft `announceGlobal(...)` aus `aria-live.ts`
  - [ ] 8.3 AddressSearch-Selection-Handler ebenso
  - [ ] 8.4 Verify: `<div id="global-aria-live">` ist einziger Live-Channel auf Page

- [x] **Task 9: Tests + E2E** (AC: #10)
  - [ ] 9.1 Unit-Tests pro Komponente (Task 3, 4, 5)
  - [ ] 9.2 `aria-live.test.ts`
  - [ ] 9.3 E2E `tests/e2e/inspector-panel.spec.ts`:
    - Adress-Selection-Flow → Panel offen → 5 Sektionen
    - LayerHit-States visuell sichtbar (with-value + no-coverage)
    - Permalink-Copy → Clipboard-Inhalt verifiziert via Playwright `evaluate(() => navigator.clipboard.readText())`
    - Mobile-Viewport (Playwright `viewport: { width: 375, height: 812 }`): Bottom-Sheet rendert, Toggle-Button funktional
    - Escape schließt
    - Re-Selection: Mount-Count = 1 (via `data-mount-id`-Attribut + Playwright-Count)
  - [ ] 9.4 axe-core gegen Adress-Sicht mit offenem Inspector → 0 Violations
  - [ ] 9.5 Commit: `feat(inspector): aside panel + layer-hit-row + data-stand-banner + permalink + bottom-sheet (story 1.9)`

## Dev Notes

### Source-Shortener (`data-stand-banner.svelte` $derived)

```typescript
const SOURCE_SHORT: Record<string, string> = {
  'https://fbinter.stadt-berlin.de': 'FIS-Broker',
  'https://daten.odis-berlin.de': 'ODIS Berlin',
  'https://opendata.dwd.de': 'DWD',
  'https://overpass-api.de': 'OpenStreetMap'
};

function shortenSource(url: string): string {
  for (const [prefix, short] of Object.entries(SOURCE_SHORT)) {
    if (url.startsWith(prefix)) return short;
  }
  return new URL(url).hostname;
}

const LICENSE_SHORT: Record<string, string> = {
  'dl-de/zero-2.0': 'dl-de/zero',
  'dl-de/by-2.0': 'dl-de/by',
  'CC BY 4.0': 'CC BY',
  'ODbL 1.0': 'ODbL',
  'Geodatenzugangsgesetz': 'GeoZG'
};
```

### Layer-Explain-Mapping (`internal/layer-explain.ts`, hardcoded DE)

```typescript
export const LAYER_EXPLAIN_DE: Record<string, string> = {
  bezirke: 'Verwaltungsbezirk Berlins (12 insgesamt)',
  ortsteile: 'Statistischer Ortsteil innerhalb des Bezirks',
  plz: 'Postleitzahlen-Region',
  'lor-prognoseraum': 'LOR-Prognoseraum (Senatsverwaltung-Gliederung)',
  'lor-bezirksregion': 'LOR-Bezirksregion (Kiez-Ebene, 138 in Berlin)',
  'lor-planungsraum': 'LOR-Planungsraum (feinste Ebene)',
  'mietspiegel-wohnlage': 'Wohnlagen-Bewertung im Berliner Mietspiegel',
  bodenrichtwerte: 'Durchschnittlicher Grundstückspreis pro Quadratmeter',
  gebaeudealter: 'Baujahr-Klasse der Gebäude im Gebiet',
  'laerm-den': 'Straßenverkehrs-Lärmpegel Tag/Abend/Nacht (24h-Mittel)',
  'laerm-night': 'Straßenverkehrs-Lärmpegel nur Nacht (22–6 Uhr)',
  solarpotenzial: 'Geschätztes Solar-Energie-Potenzial des Daches',
  klimaanalyse: 'Klimafunktionsraum-Bewertung (Senatsverwaltung)',
  stolpersteine: 'Gedenkstein für Opfer des Nationalsozialismus',
  trinkbrunnen: 'Öffentlicher Trinkwasser-Brunnen (Mai–Oktober aktiv)'
};
```

**i18n-Migration Story 3.1:** Werte landen in Paraglide-Messages `layer.explain.{slug}`.

### LayerHit-Wert-Formatter (`internal/value-formatters.ts`)

```typescript
export function formatLayerValue(slug: string, value: unknown): { text: string; isNumeric: boolean } {
  if (value === null || value === undefined) {
    return { text: 'Daten nicht vorhanden', isNumeric: false };
  }
  switch (slug) {
    case 'mietspiegel-wohnlage':
      return { text: String(value), isNumeric: false };  // "einfach" | "mittel" | "gut"
    case 'bodenrichtwerte':
      return { text: `${value} €/m²`, isNumeric: true };
    case 'laerm-den':
    case 'laerm-night':
      return { text: `${value} dB`, isNumeric: true };
    case 'solarpotenzial':
      return { text: `${value} kWh/m²`, isNumeric: true };
    case 'stolpersteine':
      return { text: typeof value === 'object' && value && 'person' in value ? `Für ${(value as { person: string }).person}` : 'Vorhanden', isNumeric: false };
    case 'bezirke':
    case 'ortsteile':
    case 'lor-prognoseraum':
    case 'lor-bezirksregion':
    case 'lor-planungsraum':
      return { text: String(value), isNumeric: false };  // Name
    default:
      return { text: String(value), isNumeric: typeof value === 'number' };
  }
}
```

Echte Property-Names erst nach Story 1.3-Pipeline-Test bekannt. Story 1.9 nutzt Stubs.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — `ExternalLink`, `Mail`, `Link2`, `ChevronUp/Down`, `X`
- #2 Files <500 Zeilen — `inspector-panel.svelte` split-fähig (Sub-Files in `inspector-panel/`)
- #7 TypeScript strict — UiState, LayerHit-Diskriminanten
- #13 A11y-First — ARIA-Live, `role="group"`, Bits-UI-Sheet
- #14 i18n-First — Strings via hardcoded DE + TODO
- #15 `$state.raw` — `selectedLayerHits` als Array; bei Replacement (jede neue Adresse) → `$state` Default OK, kein `.raw` nötig (Array-Replace ist normal-state-tracked). Falls Performance-Issue: `.raw` evaluieren
- #16 Context-API — UiState verbindlich
- #17 `$derived` über `$effect` — Gruppierung + State-Derivation
- #18 Keyed `{#each}` — `(hit.layer)` als Key
- #20 `await` + `<svelte:boundary>` — Optional in InspectorPanel falls Async-Re-Fetch

### Library/Framework Requirements

**Bereits installiert:** alle nötigen Deps

**Neu in Story 1.9:** keine

### Testing Requirements

**Unit-Tests:**
- `ui-context.test.ts`, `aria-live.test.ts`, `data-stand-banner.test.ts`, `layer-hit-row.test.ts`, `inspector-panel.test.ts`, `value-formatters.test.ts`

**E2E:**
- `tests/e2e/inspector-panel.spec.ts` — Full-Flow Desktop + Mobile
- `tests/e2e/accessibility.spec.ts` erweitert

**Coverage-Target:** ≥80% für `src/lib/state/`, `src/lib/utils/aria-live.ts`, `src/lib/components/atlas/inspector-panel/*`

### File-Structure-Requirements (Diff zu Story 1.8)

```
./
├── src/
│   ├── lib/
│   │   ├── state/
│   │   │   ├── ui-context.ts
│   │   │   └── ui-context.test.ts
│   │   ├── utils/
│   │   │   ├── aria-live.ts
│   │   │   ├── aria-live.test.ts
│   │   │   └── use-viewport.ts                # Breakpoint-Detection
│   │   └── components/
│   │       └── atlas/
│   │           ├── inspector-panel.svelte
│   │           ├── inspector-panel.test.ts
│   │           └── inspector-panel/
│   │               ├── layer-hit-row.svelte
│   │               ├── layer-hit-row.test.ts
│   │               ├── data-stand-banner.svelte
│   │               ├── data-stand-banner.test.ts
│   │               ├── permalink-button.svelte
│   │               ├── bottom-sheet.svelte
│   │               └── internal/
│   │                   ├── value-formatters.ts
│   │                   ├── value-formatters.test.ts
│   │                   └── layer-explain.ts
│   └── routes/
│       ├── +layout.svelte                     # createUiState + global-aria-live
│       └── (with-header)/[lang=lang]/
│           └── +page.svelte                   # Grid-Layout Map+Inspector
└── tests/
    └── e2e/
        └── inspector-panel.spec.ts
```

### Previous Story Intelligence

- **Story 1.4:** `getLayersAtPoint`, `LayerHit`, `LayerMetadata` + `bundleGroup`-Property
- **Story 1.7:** Click-Handler + Marker — Story 1.9 hooked Inspector-Open-Trigger
- **Story 1.8:** ARIA-Live-Channel (lokal in MapLibreCanvas) → Story 1.9 zentralisiert global
- **Story 1.2:** Bits-UI-Sheet-Wrapper für Bottom-Sheet, Lucide-Icons via `@lucide/svelte`
- **Story 1.5:** AddressSearch-Selection-Flow

### Git Intelligence

- Mount-Lifecycle-Test über `data-mount-id` (UUID) + Playwright-`data-mount-id`-Selector-Comparison
- Mobile-Viewport-Tests via Playwright-Projects (`mobile.spec.ts` separates Project mit kleinem Viewport)

### Latest Tech Information (Mai 2026)

- **Svelte 5 Context-API:** Pattern stabil, `setContext`/`getContext` typed-safe
- **Bits-UI Sheet/Dialog v2:** stabile API für Bottom-Sheet
- **`navigator.clipboard.writeText`:** stabile Web-API, requires HTTPS Production

### Open Questions

1. **„→ Mehr erfahren"-Route Phase 1.9:** `/layer/{slug}` existiert noch nicht (Story 2.5). In 1.9 Link mit `disabled`-Attribut ODER Linker zu Anker auf gleicher Page? Empfehlung: Link aktiv, führt zu 404 in Phase 1, sauber gefixt mit Story 2.5
2. **Layer-Explain-Texte:** Hardcoded DE Story 1.9. Wer reviewt Texte? Solo-Maintainer vor Phase-1-Launch
3. **Klima-Sektion Story 1.9:** Placeholder mit Stations-Hinweis ("Nächstgelegene DWD-Station: {name}") + Hinweis „Sparklines kommen Story 1.11". Foundation in 1.9, Charts in 1.11
4. **Inspector-Panel-Sortierung innerhalb Sektion:** Bundle A enthält 6 Boundary-Layer. Reihenfolge? Empfehlung: Bezirk → Ortsteil → LOR-Prognoseraum → LOR-Bezirksregion → LOR-Planungsraum → PLZ (Hierarchisch von groß zu klein)
5. **Permalink-Format:** Voll-URL (1 Klick Copy-Paste). Optional Kurz-URL via `bit.ly`-Style — verworfen (Drittanbieter-Linie). Phase 2 eigener URL-Shortener falls Bedarf

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.9: Inspektor-Panel mit Layer-Hits] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (Context-API-Pattern Code-Snippet)
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] (InspectorPanel-Svelte-Snippet)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR18, UX-DR19, UX-DR20, UX-DR11, UX-DR33, UX-DR50)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR14, FR15, FR20, FR21, FR43, NFR-A1)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (LayerHit, LayerMetadata, bundleGroup)
- [Source: _bmad-output/implementation-artifacts/1-7-karten-interaktion-url-state-sync.md] (Click-Flow, Auto-Zoom-Selection)
- [Source: _bmad-output/implementation-artifacts/1-8-karten-accessibility-layer.md] (Local Live-Region wird globalisiert)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (Bits-UI-Sheet, Lucide-Icons)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via bmad-dev-story

### Debug Log References

- Live-Dev-Run (2026-05-12): User-Report 4 Regressionen nach Initial-Pass
  - Issue 1 (Map-Click öffnet Inspector nicht) → `await reverseGeocodeAddress({...})` ohne `.run()` → SvelteKit `experimental.remoteFunctions` Query nicht aufgelöst. Fix: `.run()` Methode + Synthetic-Suggestion-Fallback bei Reverse-Geocode-Miss damit Inspector immer öffnet
  - Issue 2 (Suche ohne Treffer) → gleiche Root-Cause in `geocodeAddress({q})` ohne `.run()`. Fix: `.run()` in `(with-header)/+layout.svelte`
  - Issue 3 (Inspector permanent sichtbar) → Aside-Slot war immer gerendert mit Placeholder. Fix: `showSidePanel = $derived(...)` Grid-Layout kollabiert auf 1 Spalte ohne Auswahl, Aside erscheint erst bei `inspectorOpen && selectedAddress`
  - Issue 4 (`Error: The layer 'bezirke' does not exist in the map's style`) → `map-accessibility-layer.svelte` querte Manifest-Layer auch wenn maplibre-Style sie noch nicht enthält (Story 1.10 fügt sie dynamisch hinzu). Fix: `map.getLayer(id)`-Filter vor `queryRenderedFeatures`

### Completion Notes List

- TDD-First per ADR-012 für alle Business-Logic-Module + Komponenten (UI-Context, ARIA-Live, Source-Shortener, Value-Formatter, Sections-Grouping, DataStandBanner, LayerHitRow, PermalinkButton, BottomSheet, InspectorPanel)
- 363 Unit/Component-Tests grün (55 Test-Files). Coverage Schwerpunkt auf neuen Modulen ≥80% (jeder AC mit mindestens 1 Test-Case)
- E2E-Spec `tests/e2e/inspector-panel.e2e.ts` geschrieben, deckt Adress-Selection-Flow, Permalink-Copy, Mount-Stabilität, Mobile-Sheet-Toggle, axe-Hooks. CI-Run pending (analog Story 1.8 Pattern)
- Globale ARIA-Live-Region in `+layout.svelte` zentralisiert (`#global-aria-live` polite + `#global-aria-live-assertive`). `announceMapStatus` jetzt Compat-Wrapper, der an `announceGlobal` delegiert; alte lokale `<div id="map-status">` aus `map-libre-canvas.svelte` entfernt
- Inspector-Mount-Lifecycle: `data-mount-id`-Attribut + In-Component-Rendering (kein `{#key}`-Wrapper) garantiert Slot-Reaktivität ohne Re-Mount bei Re-Selection. Verified via Browser-Test + Test-Case in `inspector-panel.svelte.test.ts`
- Bottom-Sheet als eigene Komponente (nicht Bits-UI-Sheet-Wrapper), weil Snap-Punkte 40/70/100vh + Single-Click-Toggle (SC 2.5.7) über Bits-UI-Dialog hinausgehen. Drag-Handle dekorativ, primäre Interaktion via expand/shrink-Buttons
- `getLayersAtPoint` aus Story 1.4 wird in `openInspectorFor(suggestion)` aufgerufen. Bei Manifest-Load-Fehler fallback auf leeres Array — Sections rendern dann nur Klima-Placeholder + leere Section-Hints
- Synthetic-Suggestion-Fallback: wenn Reverse-Geocode null/Fehler liefert, baut Handler eine Pseudo-`GeocodeSuggestion` mit `id=point-<lng>-<lat>` und öffnet trotzdem den Inspector — wichtig damit Karten-Klicks außerhalb Adress-Coverage trotzdem Inspektor-Daten zeigen
- `layerName` im Inspector ist aktuell der Layer-Slug — Story 2.5 introduziert eine Locale-aware `displayName`-Map; bis dahin reicht der Slug als Identifier

### File List

**Neu erstellt:**
- `src/lib/state/ui-context.svelte.ts`
- `src/lib/state/ui-context.svelte.test.ts`
- `src/lib/state/ui-context-probe.svelte`
- `src/lib/state/ui-context-missing-provider.svelte`
- `src/lib/utils/aria-live.ts`
- `src/lib/utils/aria-live.svelte.test.ts`
- `src/lib/utils/use-viewport.svelte.ts`
- `src/lib/utils/use-viewport.test.ts`
- `src/lib/components/atlas/inspector-panel.svelte`
- `src/lib/components/atlas/inspector-panel.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel-harness.svelte`
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte`
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte`
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/permalink-button.svelte`
- `src/lib/components/atlas/inspector-panel/permalink-button.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/bottom-sheet.svelte`
- `src/lib/components/atlas/inspector-panel/bottom-sheet.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/source-shortener.ts`
- `src/lib/components/atlas/inspector-panel/internal/source-shortener.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts`
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts`
- `src/lib/components/atlas/inspector-panel/internal/sections.ts`
- `src/lib/components/atlas/inspector-panel/internal/sections.test.ts`
- `tests/e2e/inspector-panel.e2e.ts`

**Modifiziert:**
- `src/routes/+layout.svelte` (createUiState + globale ARIA-Live-Divs)
- `src/routes/(with-header)/+layout.svelte` (`.run()` für geocodeAddress)
- `src/routes/(with-header)/+page.svelte` (Grid-Layout 6fr/4fr nur bei aktiver Auswahl, Mobile-BottomSheet, InspectorPanel-Integration, `openInspectorFor`-Trigger, ARIA-Live via Helper, Synthetic-Suggestion-Fallback)
- `src/lib/components/atlas/map-libre-canvas.svelte` (lokale `#map-status`-Live-Region entfernt)
- `src/lib/components/atlas/map-libre-canvas.svelte.test.ts` (Test angepasst — Live-Region jetzt global)
- `src/lib/components/atlas/map-accessibility-layer.svelte` (Filter über `map.getLayer(id)` vor `queryRenderedFeatures`, verhindert Fehler bei Manifest-Layer ohne Style-Eintrag)
- `src/lib/components/atlas/internal/map-helpers.ts` (Compat-Wrapper für `announceMapStatus`/`clearMapStatus`, delegiert an globale `announceGlobal`)
- `tests/e2e/a11y.e2e.ts` (Test-Case für `#global-aria-live` statt lokalem `#map-status`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 1.9 ready-for-dev → in-progress → review)

### Change Log

| Datum      | Änderung                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------- |
| 2026-05-12 | Story 1.9 ready-for-dev → in-progress (initial pickup)                                              |
| 2026-05-12 | Task 1–9 TDD-First implementiert, 363 Unit-Tests grün, svelte-check 0 errors                        |
| 2026-05-12 | Regression-Fix: SvelteKit-Remote-Functions `.run()` + Inspector-Slot-Hide + Layer-Filter-Guard      |
| 2026-05-12 | Story 1.9 in-progress → review                                                                      |

## Confirmed Decisions

1. **UI-State via Context-API:** in `+layout.svelte` einmal per Request initialisiert. KEIN Module-Scope-State (SSR-Leak-Risk)
2. **Single Global ARIA-Live:** `<div id="global-aria-live">` in `+layout.svelte` + `announceGlobal()`-Helper. Story 1.7/1.8 lokale Channels werden migriert
3. **Sektion-Reihenfolge:** Boundaries → Wohn → Umwelt → Memorial → Klima (UX-DR18 verbindlich)
4. **No-Coverage-Display:** Layer-Eintrag bleibt sichtbar mit „Daten nicht vorhanden" (FR20). Layer wird NICHT ausgelassen
5. **Datenstand-Banner:** sichtbar unter Wert (NICHT Tooltip). >2 Jahre = Warning-Pille
6. **Mobile-Bottom-Sheet:** Snap 40/70/100vh + Toggle-Button für SC 2.5.7-Compliance
7. **Klima-Sektion 1.9 = Placeholder:** Stations-Hinweis + TODO. Sparklines kommen Story 1.11
8. **Permalink:** Voll-URL via `navigator.clipboard.writeText`. Inline-Status statt Toast (UX-DR30)
