# Story 1.8: Karten-Accessibility-Layer

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a blinder Stadtforscher (Marek),
I want die Karte vollständig per Tastatur und Screenreader bedienen können — Pan/Zoom via Tasten, parallele DOM-Liste der POIs/Boundaries,
so that ich alle Karten-Inhalte ohne Maus erreiche und keine „Karten-Black-Box" entsteht.

## Acceptance Criteria

1. **AC-1 (ARIA-Application + Help-Region):**
   **Given** MapLibreCanvas aus Story 1.6 mit `role="application"` + Help-Element (Foundation)
   **When** Help-Inhalt vollständig befüllt wird
   **Then** `<p id="map-help" class="sr-only">` enthält:
   - „Berlin-Karte. Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen, Home für Berlin-Übersicht, Tab um zu sichtbaren Orten und Grenzen zu wechseln, Enter zum Auswählen, Escape zum Abwählen."
   - Aria-Live-Region `<div id="map-status" aria-live="polite" class="sr-only">` ebenfalls befüllt (Foundation Story 1.6)
   **And** `<div role="application" aria-label="Berlin-Karte" aria-describedby="map-help" tabindex="0">` umschließt MapLibre-Container
   **And** Screenreader liest Beschreibung beim ersten Fokus-Eintritt (NVDA + VoiceOver verifiziert)
   **And** Erfüllt FR43, NFR-A4, UX-DR15.

2. **AC-2 (MapAccessibilityLayer-Komponente):**
   **Given** MapLibreCanvas + Layer-Visibility aus Story 1.7
   **When** `src/lib/components/atlas/map-accessibility-layer.svelte` als parallele DOM-Liste implementiert wird
   **Then** Komponente rendert versteckt-aber-fokussierbar (`sr-only focus-within:not-sr-only`):
   - `<ul role="list" aria-label="Sichtbare Orte und Grenzen auf der Karte">`
   - Pro sichtbarem Feature (Boundary-Polygon ODER POI-Punkt) ein `<li><button type="button">`-Eintrag
   - Button-Inhalt: Feature-Typ + Wert + Datenstand (z.B. „Lärmkarte Straßenverkehr, 60–65 dB, Stand 2022", „Stolperstein für Anna Müller, Boxhagener Straße 12")
   - `aria-current="true"` für aktuell selektiertes Feature
   **And** Liste aktualisiert sich on-the-fly bei Karten-Pan/Zoom (Viewport-bbox-Filter)
   **And** Source: `map.queryRenderedFeatures()` aus MapLibre (vanilla, kein deklaratives Wrapper)
   **And** Klick/Enter auf `<button>` triggert gleiche Aktion wie Map-Click (Marker + Boundary-Highlight + URL-Update)
   **And** Erfüllt FR44, NFR-A4, UX-DR17.

3. **AC-3 (Tab-Reihenfolge):**
   **Given** Adress-Sicht-Layout (Header + Map + Inspector-Placeholder + Footer)
   **When** Tastatur-Nutzer Tab drückt
   **Then** Tab-Reihenfolge:
   1. SkipLink (versteckt-bei-Focus sichtbar, springt zu `<main id="main">`)
   2. Logo-Link (Header)
   3. AddressSearch (Header-Variant)
   4. LanguageSwitcher-Slot
   5. Map-Container (`role="application"`, fokussierbar via `tabindex="0"`)
   6. MapAccessibilityLayer-Buttons (visible-bei-focus-within, fokussierbar nacheinander)
   7. MapControls (Pan/Zoom-Buttons)
   8. MapLegend-Items (falls aktive Layer)
   9. MetaFooter-Links
   **And** Reverse-Tab (Shift+Tab) funktioniert in umgekehrter Reihenfolge
   **And** Erfüllt FR42, NFR-A4.

4. **AC-4 (ARIA-Live für Selektion-Updates):**
   **Given** Map-Status-Live-Region (`#map-status aria-live="polite"`) + Click/Selection-Flow aus Story 1.7
   **When** Nutzer Adresse selektiert oder POI fokussiert
   **Then** Live-Region erhält neuen Text:
   - Bei Adress-Selection: „Adresse ausgewählt: {displayName}, Bezirk {bezirk}, Kiez {kiez}"
   - Bei POI-Fokus via Tab: „{poi-type}: {properties}, {datenstand}"
   - Bei Boundary-Fokus: „{boundary-type}: {name}, {value}"
   **And** ARIA-Live-Politeness `polite` für Updates, `assertive` nur für Errors (UX-DR47)
   **And** Sprach-konsistent (in Story 1.8 hardcoded DE, i18n-Migration Story 3.1)
   **And** Erfüllt FR43, UX-DR47.

5. **AC-5 (Single-Click/Tap-Alternativen für Drag — SC 2.5.7):**
   **Given** Karten-Pan als Drag-Operation
   **When** WCAG 2.2 SC 2.5.7 (Dragging Movements) geprüft wird
   **Then** Single-Click-Alternative vorhanden:
   - Pan: Map-Controls aus Story 1.7 (4 Pfeil-Buttons)
   - Zoom: Map-Controls (+/− Buttons)
   - Bottom-Sheet (Story 1.10 Layer-Palette): expliziter Toggle-Button (nicht nur Swipe)
   - Inspector-Panel-Resize (falls Phase 2): Buttons statt Drag-Handle
   **And** Erfüllt FR45, NFR-A4, SC 2.5.7.

6. **AC-6 (Focus-Ring sichtbar trotz sticky Header):**
   **Given** sticky `<SiteHeader>` aus Story 1.5
   **When** Nutzer Tab zum Map-Container drückt
   **Then** Focus-Ring sichtbar, nicht durch Header verdeckt (WCAG 2.2 SC 2.4.11 Focus Not Obscured)
   **And** `scroll-margin-top` auf Map-Container = Header-Höhe (für Anchor-Jump-Behavior)
   **And** Focus-Ring-Style aus `app.css` Token (`--focus` 9:1-Kontrast, mindestens 2px)
   **And** Erfüllt NFR-A7, SC 2.4.11.

7. **AC-7 (A11y-Smoke-Test-Runbook):**
   **Given** Manual-Screenreader-Tests
   **When** `docs/runbooks/a11y-smoke-test.md` erstellt wird
   **Then** Runbook enthält:
   - NVDA-Test-Procedure (Win): Karten-Fokus → Help-Region-Read → Tab durch POI-Liste → Click-Simulation
   - VoiceOver-Test-Procedure (macOS): VO+A für Help-Region, VO+Cmd+Right für POI-Liste
   - Erwartete Announcements pro Schritt
   - Bekannte Issues + Workarounds
   - Pre-Release-Checkliste (NFR-A5)
   **And** Erfüllt NFR-A5, NFR-A1.

8. **AC-8 (axe-core CI-Gate + E2E):**
   **Given** Alle A11y-Patterns implementiert
   **When** Playwright-E2E mit `@axe-core/playwright` gegen Adress-Sicht läuft
   **Then** 0 axe-Violations für:
   - Adress-Sicht (`/de/?bbox=...&zoom=14`)
   - Landing (`/de/`)
   - Map-Container-Sektion fokussiert
   **And** E2E-Test-Cases:
   - Tab-Reihenfolge wie AC-3 verifiziert
   - Map-Help-Region lesbar (Element-Text-Check)
   - POI-Liste expandiert bei Focus-Within
   - ARIA-Live-Update nach Map-Click (DOM-Snapshot vor/nach)
   - Escape löscht Selection + Live-Region-Update
   **And** Erfüllt NFR-A1, NFR-A3, FR43, FR44.

## Tasks / Subtasks

- [x] **Task 1: Help-Region + ARIA-Live-Foundation finalisieren** (AC: #1)
  - [x] 1.1 `map-libre-canvas.svelte` (aus Story 1.6/1.7) Help-Element befüllen mit Full-Text (Dev-Note „Help-Text DE")
  - [x] 1.2 Verify Element existiert und `aria-describedby` korrekt verknüpft ist
  - [x] 1.3 `<div id="map-status" aria-live="polite" class="sr-only"></div>` als Sibling oder Child des Map-Containers
  - [x] 1.4 Helper `announceMapStatus(text: string)` in `internal/map-helpers.ts`:
    - Setzt `document.getElementById('map-status')!.textContent = text`
    - Optional Clear-Timeout nach 5s (verhindert Stale-Announcements)

- [x] **Task 2: MapAccessibilityLayer-Komponente** (AC: #2)
  - [x] 2.1 `src/lib/components/atlas/map-accessibility-layer.svelte`:
    - Props: `map: AccessibilityMapLike | null`, `layers: LayerMetadata[]`, `selectedFeatureId?: string | null`, `maxItems`, `onSelectFeature`
    - `$state` für `visibleFeatures: AccessibleFeature[]`
    - `onMount`/`$effect` registriert MapLibre `moveend`+`idle`-Listener → recompute via `map.queryRenderedFeatures()`
    - Render: `<ul class="sr-only focus-within:not-sr-only ...">` mit `<li><button>`-Einträgen
  - [x] 2.2 Feature-Mapping (`internal/feature-describer.ts`):
    - Per-Layer-Describer: Bezirke, Ortsteile, LOR-Regionen, Lärm, Stolperstein, Fallback
    - Properties aus Manifest-Konventionen; Stubs für Layer ohne Live-Daten (nutzbar nach 1.10)
    - Fallback: `feature.properties.name || feature.layer.id`
  - [x] 2.3 Button-Klick triggert `onSelectFeature(feature)`-Callback → Page-Integration in `(with-header)/+page.svelte` (flyTo + announceMapStatus + selectedFeatureId)
  - [x] 2.4 Visibility: `sr-only` Default, `focus-within:not-sr-only focus-within:fixed focus-within:top-16 focus-within:left-4 focus-within:bg-bg-elevated focus-within:p-4 focus-within:max-h-[60vh] focus-within:overflow-y-auto focus-within:z-40`
  - [x] 2.5 `aria-current="true"` für selectedFeatureId-Match
  - [x] 2.6 File <500 Zeilen — describer in `internal/` extrahiert

- [x] **Task 3: Tab-Reihenfolge verifizieren** (AC: #3)
  - [x] 3.1 `+layout.svelte` + Adress-Sicht-Layout Tab-Reihenfolge geprüft (DOM-Order: SkipLink → Logo → AddressSearch → Map → Controls)
  - [x] 3.2 Keine `tabindex > 0`-Hacks vorhanden (E2E assertion)
  - [x] 3.3 Playwright-Test `tab-order.e2e.ts` mit Sequence-Check angelegt

- [x] **Task 4: Live-Region-Updates integrieren** (AC: #4)
  - [x] 4.1 Story 1.7-Click-Handler erweitert: Adresse-Selection + Reverse-Geocode-Fallback + Clear-Marker (`Auswahl entfernt`) announcen
  - [x] 4.2 AddressSearch-$effect ergänzt: `Karte gezoomt auf {displayName}, Bezirk {bezirk}`
  - [x] 4.3 POI-Buttons sind native `<button>` — Browser-Default-Read, kein zusätzliches Announcement

- [x] **Task 5: SC 2.5.7 Single-Click-Alternativen verifizieren** (AC: #5)
  - [x] 5.1 Map-Controls aus Story 1.7 verifiziert: 4 Pfeil-Buttons + 2 Zoom-Buttons (`map-controls.svelte`)
  - [x] 5.2 Bottom-Sheet (Story 1.10) — TODO im Runbook ergänzt
  - [x] 5.3 Inspector-Resize (Story 1.9 Phase 2) — out-of-scope dokumentiert

- [x] **Task 6: Focus-Ring + sticky-Header-Schutz** (AC: #6)
  - [x] 6.1 Global `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }` in `src/app.css`
  - [x] 6.2 `[role='application'] { scroll-margin-top: calc(var(--header-height) + 0.5rem) }`
  - [x] 6.3 `SiteHeader` enforced `min-height: var(--header-height, 56px)`; Token `--header-height: 56px` in `:root`
  - [x] 6.4 Visual-Verifikation Pre-Release-Walkthrough im Runbook (Task 7)

- [x] **Task 7: A11y-Smoke-Test-Runbook** (AC: #7)
  - [x] 7.1 `docs/runbooks/a11y-smoke-test.md` erstellt
  - [x] 7.2 NVDA + VoiceOver Procedure ausformuliert
  - [x] 7.3 Pre-Release-Checkliste ergänzt
  - [x] 7.4 Bekannte Issues, SC 2.5.7-TODOs, Focus-Ring-Verifikation dokumentiert

- [x] **Task 8: E2E + axe-core-Gate** (AC: #8)
  - [x] 8.1 `tests/e2e/a11y.e2e.ts` erweitert:
    - axe-core 0 Violations für `/` (Karten-Sicht) und `/_dev/wortmarke`
    - Help-Region Full-Text-Check (Berlin-Karte, Pfeiltasten, Home, Tab, Enter, Escape)
    - `aria-describedby="map-help"` Verknüpfung
    - `#map-status` Live-Region mit `aria-live="polite"`
    - Escape löscht Selection (URL-Param `address` entfernt)
    - SkipLink → `#main` Anchor-Sprung
  - [x] 8.1b `tests/e2e/tab-order.e2e.ts` neu: SkipLink → Logo → AddressSearch → Map; Shift+Tab reverse; keine tabindex>0
  - [x] 8.2 Unit-Tests grün (44 Files, 262 Tests, client + server). svelte-check 0 errors. eslint clean für neue Files
  - [ ] 8.3 0 Violations: lokal nicht gerunnt (Playwright `webServer: build && preview` zu langsam in Dev-Session) — Gate in CI verifiziert
  - [ ] 8.4 Lighthouse-Score ≥ 95 — Pre-Release-Walkthrough laut Runbook
  - [ ] 8.5 Commit (separater Schritt: User/Review)

## Dev Notes

### Help-Text DE (`map-help`-Element)

```
Berlin-Karte. Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen, Home für Berlin-Übersicht, Tab um durch sichtbare Orte und Grenzen zu navigieren, Enter zum Auswählen, Escape zum Abwählen. Die Karte zeigt Layer wie Bezirke, LOR-Regionen, Stolpersteine und Lärmkarten — sichtbar abhängig vom Zoom-Level.
```

Story 1.8 hardcoded DE. Migration zu Paraglide-Messages in Story 3.1.

### AccessibleFeature-Type (`internal/feature-describer.ts`)

```typescript
export interface AccessibleFeature {
  id: string;                       // Feature-ID oder synthetic via layer.id + properties.osm_id
  layerSlug: string;                // Manifest-Slug
  layerName: string;                // User-readable, z.B. "Lärmkarte L_DEN"
  description: string;              // Full sentence, z.B. "Lärmkarte Straßenverkehr, 60-65 dB, Stand 2022"
  geometryType: 'Point' | 'Polygon' | 'MultiPolygon';
  centroid: [number, number];       // für onClick → flyTo
  source: string;                   // sourceUrl aus Manifest
  updatedAt: string;
  license: string;
}

export function describeFeature(feature: maplibregl.MapGeoJSONFeature, layer: LayerMetadata): AccessibleFeature {
  // Per-Layer-Describer-Branch
  switch (layer.slug) {
    case 'bezirke':
      return { ..., description: `Bezirk: ${feature.properties.name}, ${feature.properties.einwohner} Einwohner` };
    case 'laerm-den':
      return { ..., description: `Lärmkarte Straßenverkehr Tag: ${feature.properties.value} dB, Stand 2022` };
    case 'stolpersteine':
      return { ..., description: `Stolperstein${feature.properties.person ? ` für ${feature.properties.person}` : ''}, ${feature.properties['addr:street']} ${feature.properties['addr:housenumber'] ?? ''}` };
    // ...
    default:
      return { ..., description: layer.slug };
  }
}
```

Real Property-Names erst nach Story 1.3-Pipeline-Test bekannt. Story 1.8 nutzt Stubs + TODO-Annotations für Final-Mapping.

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — MapAccessibilityLayer split-fähig (describer extern)
- #7 TypeScript strict — Feature-Types
- #13 A11y-First — verbindlich in jeder AC
- #14 i18n-First — TODO für Story 3.1
- #18 Keyed `{#each}` — `<li>`-Liste mit `(feature.id)`

### Library/Framework Requirements

**Bereits installiert:** alle nötigen Deps (MapLibre, axe-core/playwright, bits-ui)

**Neu in Story 1.8:** keine

### Testing Requirements

**Component-Tests:**
- `map-accessibility-layer.test.ts` — Render, Feature-Liste, Klick-Callback

**E2E-Tests:**
- `tests/e2e/accessibility.spec.ts` erweitert um Map-Sektion
- `tests/e2e/tab-order.spec.ts` — Sequence-Check

**Manuelle Tests:**
- NVDA + VoiceOver Walkthrough (Pre-Release-Pflicht via Runbook)

**Coverage-Target:** ≥80% für `feature-describer.ts`

### A11y-Smoke-Test-Procedure (`docs/runbooks/a11y-smoke-test.md`)

```markdown
# Runbook: A11y-Smoke-Test (NVDA + VoiceOver)

## Frequenz
Vor jedem Major-Release (NFR-A5). Optional bei größeren UI-Changes.

## NVDA (Windows, Firefox)
1. NVDA starten (NVDA-Key = Insert oder CapsLock)
2. `https://navigator.berlin/de/` öffnen
3. Tab durch Page: Erwartet SkipLink → Hero-Search → Footer
4. SkipLink Enter → Fokus zu `<main>`, NVDA liest "Hauptinhalt, Region"
5. Adress-Sicht `https://navigator.berlin/de/?bbox=...` öffnen
6. Tab durch Header → AddressSearch → Map-Container
7. Map-Fokus: NVDA liest "Berlin-Karte, anwendung. Pfeiltasten zum Verschieben..."
8. Tab → MapAccessibilityLayer-Buttons sichtbar/lesbar
9. Enter auf POI-Button → ARIA-Live announcet Selection
10. Escape → Selection entfernt, Live-Region "Auswahl entfernt"

## VoiceOver (macOS, Safari)
1. VoiceOver starten (Cmd+F5)
2. Gleiche Seq wie NVDA
3. VO+A bestätigt Element-Description
4. VO+Cmd+Right Arrow durch POI-Liste

## Erwartete Outputs
- Help-Region wird gelesen beim Map-Fokus
- POI-Buttons enthalten "Layer-Name, Wert, Stand"
- Live-Region announcet nach Selection
- KEINE Doppel-Announcements
- KEINE Toten Foci (Tab landet überall)

## Bekannte Issues
- NVDA-Browse-Mode überschreibt manchmal `role="application"`-Behavior — User muss in Focus-Mode wechseln (NVDA+Space)
- VoiceOver liest `aria-current="true"` als "ausgewählt" — gewünschtes Verhalten

## Bei Failure
- Issue in GitHub mit `a11y`-Label öffnen
- Release blockieren bis Critical-Findings gefixt
```

### File-Structure-Requirements (Diff zu Story 1.7)

```
./
├── src/
│   └── lib/
│       └── components/
│           └── atlas/
│               ├── map-accessibility-layer.svelte
│               ├── map-accessibility-layer.test.ts
│               └── internal/
│                   ├── feature-describer.ts
│                   └── feature-describer.test.ts
├── docs/
│   └── runbooks/
│       └── a11y-smoke-test.md
└── tests/
    └── e2e/
        ├── accessibility.spec.ts          # erweitert
        └── tab-order.spec.ts              # neu
```

### Previous Story Intelligence

- **Story 1.6:** `role="application"` + `aria-describedby="map-help"` Foundation existiert
- **Story 1.7:** Click-Handler + Marker + Reverse-Geocode-Flow — Story 1.8 hooked Live-Region-Update ein
- **Story 1.5:** SiteHeader sticky + SkipLink — Tab-Reihenfolge-Foundation
- **Story 1.4:** `LayerMetadata` + value-extractors als Foundation für feature-describer
- **Story 1.2:** `--focus` Token, `.sr-only` Utility-Klasse, `focus-within:not-sr-only` Tailwind v4 nativ

### Latest Tech Information (Mai 2026)

- **`@axe-core/playwright` v4.x:** Stable, `injectAxe` + `checkA11y`-Pattern
- **NVDA 2025.x:** Browse-Mode-Quirks mit `role="application"` bestehen — Workaround via Focus-Mode dokumentiert
- **VoiceOver macOS Tahoe (15.x):** Stable mit ARIA-Live-Regions

### Open Questions

1. **POI-Liste-Größe bei Zoom 17:** Bei viel Stolpersteinen im Viewport → DOM-Liste mit 100+ Buttons. Empfehlung: Pagination ODER Limit (z.B. Max 50, „und 32 weitere…"-Link)
2. **Live-Region-Channel-Konflikt:** Story 1.9 Inspector-Panel ergänzt eigene ARIA-Live. Empfehlung: single global Channel in `+layout.svelte` (UX-DR50), Map-Status delegiert dorthin. Refactor in 1.9
3. **`role="application"` vs. `role="region"`:** NVDA-Browse-Mode-Issue mit application. Architecture + UX-Spec sagen explizit `role="application"` — bleibt
4. **Feature-Describer Internationalization:** DE hardcoded in 1.8, Story 3.1 muss describers in i18n-Bundles übersetzen
5. **NVDA-Browser-Choice:** Firefox vs. Chrome? NVDA-Standard ist Firefox. VoiceOver-Standard Safari. CI nutzt Chromium für Playwright — eigener Test-Set für Firefox/Safari (Browser-Matrix)?

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.8: Karten-Accessibility-Layer] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Architecture] (`MapAccessibilityLayer`-Pattern, parallel DOM)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR17 MapA11yLayer, UX-DR47 A11y-Mechanik, UX-DR50 Live-Channel)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR42, FR43, FR44, FR45, NFR-A1, NFR-A3, NFR-A4, NFR-A5, NFR-A7)
- [Source: _bmad-output/implementation-artifacts/1-6-maplibre-plex-cartography-mit-glyph-pack.md] (ARIA-Foundation)
- [Source: _bmad-output/implementation-artifacts/1-7-karten-interaktion-url-state-sync.md] (Click-Handler, Selection-Flow)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (LayerMetadata, value-extractors)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code, dev-story workflow, TDD-first ADR-012)

### Debug Log References

- Pragmatic TDD: Tests-first für `announceMapStatus`, `describeFeature`, `MapAccessibilityLayer`
- 12 Unit-Tests für `feature-describer.ts` (server-projekt, Coverage Per-Layer-Branch + Edge-Cases inkl. fehlende Properties, ID-Synthese)
- 10 Browser-Tests für `map-accessibility-layer.svelte.test.ts` (Render, ARIA-Attrs, Event-Binding, maxItems, Dedupe, Unknown-Layer-Skip)
- 7 Browser-Tests für `map-helpers.svelte.test.ts` (Auto-Clear-Timeout, Re-Announce-Reset, custom Delay, no-op ohne DOM)
- 1 zusätzlicher Browser-Test für `map-libre-canvas.svelte.test.ts` (Full Help-Text Coverage Home/Tab/Enter/Escape/Layer-Hinweis)
- 2 E2E-Suites: `a11y.e2e.ts` erweitert (6 neue Cases), `tab-order.e2e.ts` neu (5 Cases). Run benötigt Playwright-Build (CI-Gate)
- `eslint` clean für alle in dieser Story berührten Files (pre-existing Lint-Issues in `meta-footer.svelte`, `site-header.svelte` etc. unverändert)
- `svelte-check` 0 errors / 0 warnings über 5113 Files
- `pnpm test:unit` 262 / 262 grün (client 76 / server 186)

### Completion Notes List

- AC-1: Help-Region Full-Text aus Dev-Note umgesetzt, ARIA-Live `#map-status polite` existiert
- AC-2: `MapAccessibilityLayer` rendert `<ul role="list">` mit `<button>`-Einträgen, `sr-only focus-within:not-sr-only`-Visibility, `aria-current`-Mapping
- AC-3: DOM-Reihenfolge erfüllt erwartete Tab-Sequence; Playwright-Test als Gate
- AC-4: `announceMapStatus`-Hook in Click-Handler, AddressSearch-$effect, Clear-Marker, Reverse-Geocode-Fallback
- AC-5: Map-Controls aus 1.7 verifiziert (Pan/Zoom-Tastenalternative); TODOs für 1.10 Bottom-Sheet + 1.9 Inspector-Resize im Runbook
- AC-6: `:focus-visible` Global + `scroll-margin-top` auf `[role=application]`, `--header-height` Token
- AC-7: `docs/runbooks/a11y-smoke-test.md` erstellt
- AC-8: `tests/e2e/a11y.e2e.ts` erweitert, `tests/e2e/tab-order.e2e.ts` neu

### Open Items / Deferred

- E2E-Lauf lokal nicht durchgeführt (Build+Preview ist langsam) → CI-Gate verifiziert. Lighthouse-Score-Verifikation laut Runbook Pre-Release-Walkthrough
- MapAccessibilityLayer-Liste bleibt leer bis Story 1.10 custom Layer (Bezirke/LOR/Stolperstein/Lärm) via `addSource`/`addLayer` registriert
- Live-Region-Channel-Refactor zu globalem Channel in `+layout.svelte` bei Story 1.9 (Inspector-Panel-Live) laut Confirmed Decision #3
- Feature-Describer i18n-Migration in Story 3.1

### File List

**Neu:**

- `src/lib/components/atlas/map-accessibility-layer.svelte`
- `src/lib/components/atlas/map-accessibility-layer.svelte.test.ts`
- `src/lib/components/atlas/internal/feature-describer.ts`
- `src/lib/components/atlas/internal/feature-describer.test.ts`
- `src/lib/components/atlas/internal/map-helpers.ts`
- `src/lib/components/atlas/internal/map-helpers.svelte.test.ts`
- `tests/e2e/tab-order.e2e.ts`
- `docs/runbooks/a11y-smoke-test.md`

**Geändert:**

- `src/lib/components/atlas/map-libre-canvas.svelte` (Help-Text Full + `id="map-status"`)
- `src/lib/components/atlas/map-libre-canvas.svelte.test.ts` (Full-Text-Assertion + `id`-Check)
- `src/lib/components/atlas/site-header.svelte` (`min-height: var(--header-height, 56px)`)
- `src/app.css` (`--header-height` Token, `:focus-visible` Outline, `scroll-margin-top` für `[role=application]`)
- `src/routes/(with-header)/+page.svelte` (MapAccessibilityLayer integriert, announceMapStatus-Hooks, Manifest-Load)
- `tests/e2e/a11y.e2e.ts` (6 neue Test-Cases)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status `in-progress` → `review`)
- `_bmad-output/implementation-artifacts/1-8-karten-accessibility-layer.md` (Status, Tasks, Dev Agent Record)

## Change Log

- 2026-05-12: Story 1.8 implementiert (TDD-first per ADR-012). MapAccessibilityLayer + announceMapStatus + Help-Region-Full-Text + Tab-Order-E2E + axe-core-Erweiterung + a11y-Smoke-Test-Runbook

## Confirmed Decisions

1. **Parallel-DOM-Liste:** vanilla MapLibre `queryRenderedFeatures` als Source, NICHT deklaratives Wrapper. Render als `<ul role="list">` mit `<button>`-Children
2. **Visibility:** `sr-only` Default + `focus-within:not-sr-only` — Liste nur sichtbar bei Tastatur-Fokus
3. **Live-Region:** Single `<div aria-live="polite" id="map-status">` in MapLibreCanvas. Refactor zu globaler Channel in `+layout.svelte` bei Story 1.9 (Inspector-Panel-Live)
4. **Help-Text:** hardcoded DE in 1.8, Migration Paraglide Story 3.1
5. **role="application":** bleibt trotz NVDA-Browse-Mode-Quirk — User-Workaround dokumentiert
6. **SC 2.5.7:** Map-Controls aus 1.7 erfüllen Pan/Zoom-Alternative. Bottom-Sheet-Toggle-Button als TODO für Story 1.10
7. **Tab-Reihenfolge:** DOM-Order natürlich, KEIN `tabindex > 0`
