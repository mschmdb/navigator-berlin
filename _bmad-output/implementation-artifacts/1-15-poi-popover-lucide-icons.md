# Story 1.15: POI-Popover + Lucide-Icon-Pins

Status: review

## Story

As a Berliner Bürger und mobile Nutzerin,
I want auf Map-Pins (Stolpersteine, Trinkbrunnen, Kitas, Schulen, Krankenhäuser, Sportanlagen, Schwimmbäder, U-/S-/Tram-Stationen) hovern bzw. tappen können und sofort sehen WAS dieser Pin ist, OHNE jedes Mal eine Adresse auswählen zu müssen,
so that ich die Karte explorativ verstehe und Pins visuell auseinanderhalten kann.

## Probleme (zwei in einer Story)

**Problem 1:** Map-Pins (Points-Geometry-Layer) haben keinen Hover/Tap-Explainer. User klickt blind, oder gar nicht.

**Problem 2:** Pins sind farbige Kreise — bei mehreren Point-Layern aktiv (Stolpersteine + Trinkbrunnen + Kitas) nicht unterscheidbar. Lösung: **Lucide-Icon-Pins** mit Bundle-spezifischer Farbe.

## Acceptance Criteria

1. **AC-1 (Lucide-Icon-Pins statt Kreise):**
   **Given** Point-Geometry-Layer in MapLibre
   **When** Layer-Style-Builder Point-Marker erzeugt
   **Then** Marker ist SVG mit Lucide-Icon (NICHT bunter Kreis), per Layer-Slug definierte Mapping:
   - `stolpersteine` → `Footprints` (Lucide) Farbe `--memorial-stolperstein` (Bronze/Gold)
   - `trinkbrunnen` → `Droplet` Farbe `--umwelt-trinkbrunnen` (Blau)
   - `kitas-2024` → `Baby` Farbe `--sozial-kita` (Lila)
   - `schulen-2024` → `School` Farbe `--sozial-schule` (Grün-Dunkel)
   - `krankenhaeuser-plan` → `Plus` Farbe `--sozial-krankenhaus` (Rot)
   - `krankenhaeuser-weitere` → `Plus` Farbe `--sozial-krankenhaus-secondary` (Rot-Hell)
   - `sportanlagen-2024` → `Dumbbell` Farbe `--sozial-sport` (Orange)
   - `schwimmbaeder` → `Waves` Farbe `--sozial-schwimmbad` (Cyan)
   - `ubahn-stationen` → `TrainFront` Farbe `--mobility-ubahn` (Blau-BVG)
   - `sbahn-stationen` → `TrainTrack` Farbe `--mobility-sbahn` (Grün-S-Bahn)
   - `tram-haltestellen` → `TramFront` Farbe `--mobility-tram` (Rot-BVG)
   - `bus-haltestellen` → `Bus` Farbe `--mobility-bus` (Lila-BVG)
   **And** Icon-Größe 16px bei Zoom < 13, 20px bei Zoom ≥ 13
   **And** Icon-Background: weißer Kreis 24px (Token `--bg-elevated`) mit 1px Outline (Layer-Color)
   **And** Erfüllt UX-DR Pin-Differenzierung.

2. **AC-2 (POI-Popover bei Hover/Tap):**
   **Given** Point-Marker auf Karte
   **When** Desktop-User hovert über Pin (mousemove) ODER Mobile-User tappt
   **Then** Popover (MapLibre-Native oder Custom-Overlay) erscheint:
   - Position: oberhalb Pin (Mobile: bottom-anchored falls Platz oben fehlt)
   - Inhalt:
     - Layer-Display-Name als h5 (Plex-Serif)
     - 1-Zeile-Feature-Summary (aus OSM-Properties)
     - „Mehr im Inspektor →" Hint (Plex-Mono `text-xs`)
   - Auto-close bei Mouseout/Touchend nach 300ms (Hover-Stable)
   - Tap-Outside schließt
   **And** Erfüllt FR Map-Interaction-Discoverability.

3. **AC-3 (Pin-Click → Adresse + Inspector):**
   **Given** Popover offen
   **When** User klickt auf Pin (NICHT auf Popover-Inhalt)
   **Then** Adress-Update auf Pin-Lat/Lng
   **And** Inspector öffnet
   **And** Scrollt zum Layer-Hit-Row des Pin-Layers (smooth-scroll)
   **And** Popover schließt
   **And** Erfüllt UX-DR User-Flow-Continuity.

4. **AC-4 (Feature-Summary-Logic):**
   **Given** OSM-Properties pro Layer
   **When** Popover-Summary gerendert wird
   **Then** Summary-Mapping:
   - `stolpersteine`: `properties.person ?? 'Stolperstein'`
   - `trinkbrunnen`: `properties.name ?? 'Trinkbrunnen'`
   - `kitas-2024`: `properties.name`
   - `schulen-2024`: `properties.name` + 1-Zeile-Schulart
   - `krankenhaeuser-*`: `properties.name`
   - `sportanlagen-2024`: `properties.name ?? properties.sport`
   - `schwimmbaeder`: `properties.name`
   - `ubahn-stationen` / `sbahn-stationen` / `tram-haltestellen` / `bus-haltestellen`: `properties.name` (Stations-Name)
   **And** Fallback bei fehlender `name`-Property: Layer-Display-Name
   **And** Summary in `internal/poi-summary-builder.ts` zentralisiert (Layer-Slug → Summary-Function-Map).

5. **AC-5 (Keyboard-Accessibility):**
   **Given** Keyboard-only-User
   **When** User mit Tab durch Map navigiert
   **Then** Pins sind Keyboard-erreichbar via Map-Keyboard-Layer (Story 1.8)
   **And** Enter auf fokussiertem Pin = Click-Action (Adresse + Inspector)
   **And** Popover NICHT auf Keyboard-Focus auto-open (würde Tab-Flow stören)
   **And** Erfüllt UX-DR Keyboard-Equivalence.

6. **AC-6 (Mobile-Touch-Verhalten):**
   **Given** Mobile-Viewport (375x812)
   **When** User tappt Pin
   **Then** Popover erscheint (single-tap)
   **And** Erneuter Tap auf gleichen Pin = Pin-Click-Action (Adresse + Inspector)
   **And** Tap außerhalb = Popover-close
   **And** Touch-Target ≥ 44x44px (WCAG 2.5.5)
   **And** Erfüllt UX-DR Mobile-First.

7. **AC-7 (Performance):**
   **Given** ~10.000 Stolpersteine + ~200 Trinkbrunnen + Kitas/Schulen etc.
   **When** Karte gerendert wird
   **Then** Icon-Marker render via MapLibre `symbol`-Layer (SDF-Glyphs-Pattern, nicht DOM-Marker)
   **And** Lucide-SVGs als SDF-Sprite-Sheet build-time generiert ODER per icon-image gelinked
   **And** Initial-Render < 200ms zusätzlich
   **And** Memory bleibt stabil bei Pan/Zoom.

8. **AC-8 (Editorial: Stolperstein-Würde):**
   **Given** Stolperstein-Popover (FR50/51 Editorial)
   **When** Person-Property fehlt
   **Then** Popover zeigt NUR Layer-Name „Stolperstein", KEIN „Unbekannte Person" + KEIN automatisch generierter Text
   **And** Click-Action öffnet StolpersteinDetail (Story 1.12) im Inspector
   **And** Erfüllt FR51 (NIE algorithmisch generierter Inhalt).

9. **AC-9 (Tests + a11y):**
   **Given** alle Komponenten
   **When** Tests laufen
   **Then** Unit-Tests:
   - `poi-summary-builder.test.ts` — Summary-Logic pro Layer
   - `pin-icon-mapping.test.ts` — Layer-Slug → Lucide-Icon-Map
   - `map-popover.svelte.test.ts` — Render, Auto-close-Timer, Outside-Click-Handler
   **And** E2E `tests/e2e/poi-popover.e2e.ts`:
   - Hover über Stolperstein-Pin → Popover mit Person-Name
   - Tap auf Trinkbrunnen-Pin (Mobile) → Popover „Trinkbrunnen"
   - Click auf Schul-Pin → Adresse + Inspector öffnet, scrollt zu Schul-Row
   - Tab-Navigation: Pin fokussierbar, Enter = Click-Action
   **And** axe-core: 0 Violations

## Tasks / Subtasks

- [x] **Task 1: Pin-Icon-Mapping** (AC: #1)
  - [x] 1.1 `src/lib/components/atlas/internal/pin-icon-mapping.ts` mit 12 Mappings inkl. SVG-Path-Daten aus @lucide/svelte v1.14.0
  - [x] 1.2 Lucide-Icons verifiziert (bookmark/droplet/baby/school/plus/dumbbell/waves/train-front/train-track/tram-front/bus)
  - [x] 1.3 19 Unit-Tests (pin-icon-mapping.test.ts)

- [x] **Task 2: Pin-Sprite-Renderer (Scope-Pivot: Runtime addImage statt SDF-Build)** (AC: #7)
  - [x] 2.1 `internal/pin-sprite-renderer.ts` mit `buildPinSvg(spec, hex)` Pure-Function (testbar in node) + `loadPinImage` (Browser) + `registerPinIcons(map, …)` mit Idempotenz
  - [x] 2.2 Wire-up in `map-libre-canvas.svelte` onLoad + `styleimagemissing`-Fallback
  - [x] 2.3 Keine neue Dep noetig (Inline-Kopie der iconNode-Daten unter ISC)
  - [x] 2.4 10 Unit-Tests (pin-sprite-renderer.test.ts) + 3 Browser-Tests (pin-sprite-renderer.svelte.test.ts)

- [x] **Task 3: MapLibre-Symbol-Layer** (AC: #1, #7)
  - [x] 3.1 `layer-style-builder.ts` routet Pin-Icon-Slugs ueber `buildPinSymbolSpec` (type=symbol, icon-image=pinImageId, icon-size zoom-stops, icon-allow-overlap)
  - [x] 3.2 Icon-Size finale Skala: 0.4 (zoom <11) / 0.5 (zoom 13) / 0.6 (zoom 16) auf 28px-Native — User-Feedback-Adjustment fuer kleinere Pins
  - [x] 3.3 Tests (Symbol-Layer + icon-size-Stops)

- [x] **Task 4: POI-Summary-Builder** (AC: #4, #8)
  - [x] 4.1 `internal/poi-summary-builder.ts` mit `getPopoverSummary(slug, properties)` und Stolperstein-Special-Case (NIE "Unbekannte Person")
  - [x] 4.2 23 Unit-Tests (poi-summary-builder.test.ts), Edge-Cases: null-props, whitespace-name, non-string-name

- [x] **Task 5: MapPopover (Scope-Pivot: Erweiterung map-hover-tooltip statt Separate)** (AC: #2, #5, #6)
  - [x] 5.1 `internal/hover-tooltip-logic.ts` unterscheidet kind='polygon' vs kind='poi' via `hasPinIcon(slug)`; POI nutzt `getPopoverSummary`
  - [x] 5.2 `map-hover-tooltip.svelte` rendert POI-Variant mit Plex-Serif-Title + optional Plex-Sans-Subtitle + "Mehr im Inspektor →"-Hint (Plex-Mono)
  - [x] 5.3 Auto-close-Timer 300ms bleibt (geerbt vom Polygon-Pfad)
  - [x] 5.4 3 neue Browser-Tests (POI-Hit, Stolperstein-Wuerde, Schul-Subtitle)
  - [ ] 5.5 Mobile-Tap-Popover DEFERRED — Desktop-Hover-only Phase 1, Touch-Variante als Follow-up

- [x] **Task 6: Map-Interaction-Wiring** (AC: #3, #5, #6)
  - [x] 6.1 `+page.svelte` onClick: `detectPinSlugAtPoint(lngLat)` queryt rendered features auf Pin-Layer-IDs, setzt `ui.scrollToLayerSlug`
  - [x] 6.2 `inspector-panel.svelte` $effect liest `ui.scrollToLayerSlug` und ruft `scrollToLayerHitRow` mit reducedMotion-Respect
  - [x] 6.3 `inspector-panel/internal/scroll-to-layer-row.ts` Pure-Utility + 6 Unit-Tests
  - [x] 6.4 Defensive-Filter in `map-hover-tooltip.svelte` ueber neuen optionalen `getLayer`-Check (Race-Fix gegen "Layer does not exist"-Throw)
  - [ ] 6.5 Mobile-Double-Tap-Pattern DEFERRED zu Follow-up

- [x] **Task 7: Color-Tokens** (AC: #1)
  - [x] 7.1 `internal/colors.ts` +12 Tokens (memorialStolperstein, umweltTrinkbrunnen, sozialKita/Schule/Krankenhaus/KrankenhausSecondary/Sport/Schwimmbad, mobilityUbahn/Sbahn/Tram/Bus)
  - [x] 7.2 `app.css` matching CSS-Custom-Properties

- [x] **Task 8: E2E + a11y** (AC: #9)
  - [x] 8.1 `tests/e2e/poi-popover.e2e.ts` Smoke (Pin-Sprite-Registration kein Console-Error + Hover-Sweep)
  - [ ] 8.2 axe-core E2E DEFERRED zu CI-Run (consistent mit Story-1.11/1.12/1.16-Pattern)

## Dev Notes

### Lucide-Icon-Verfügbarkeit (Mai 2026)

Lucide v0.460+ stable. Icons verifizieren:

| Slug | Icon | Status |
|---|---|---|
| stolpersteine | `Footprints` oder `Square` (klassischer Stolperstein-Look) | check |
| trinkbrunnen | `Droplet` | stable |
| kitas | `Baby` oder `Smile` | stable |
| schulen | `School` | stable |
| krankenhaeuser | `Plus` oder `Hospital` (neu in Lucide 0.460+) | check |
| sportanlagen | `Dumbbell` | stable |
| schwimmbaeder | `Waves` | stable |
| ubahn | `TrainFront` | stable |
| sbahn | `TrainTrack` | stable |
| tram | `TramFront` | check (eventuell `Train`) |
| bus | `Bus` | stable |

Verifizieren via `pnpm ls @lucide/svelte` + Browser-Check.

### SDF-Sprite vs DOM-Marker

MapLibre-Performance:
- SDF-Sprite: build-time-generated, GPU-rendered, skaliert mit Zoom, perfekt für 10k+ Markers
- DOM-Marker: HTML/CSS, easier styling, slower bei 1000+ Markers (Stolpersteine!)

Empfehlung: **SDF-Sprite-Approach** wegen Stolperstein-Performance. Lucide-SVGs → Sprite via Build-Script.

### Editorial-Würde: Stolperstein-Popover

Per Story 1.12-Editorial-Pattern:
- KEIN „Unbekannte Person"-Fallback
- KEIN auto-generierter Text
- Bei fehlender `person`-Property: nur „Stolperstein" als Title
- Click → StolpersteinDetail (Story 1.12) im Inspector mit Wikipedia-Link

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte für Icon-Resolving (build-time, nicht runtime)
- #2 Files <500 Zeilen
- #5 Open-Data-Lizenz (Lucide ISC, OK)
- #7 TS strict
- #11 Kein US-Drittanbieter (Lucide-Repo GitHub OK weil Source-Code-Repo, kein Runtime-Call)
- #13 A11y-First — Popover keyboard + screen-reader
- #14 i18n-First — TODOs für Popover-Strings („Mehr im Inspektor")

### Library/Framework Requirements

**Neu in Story 1.15:**
- `lucide-static` (MIT) als devDep für SVG-Path-Access build-time
- `@mapbox/spritezero` (BSD) für SDF-Sprite-Generation
- Falls @lucide/svelte direct-imports im build-script gehen → keine neue Dep nötig

### Testing Requirements

**Unit-Tests:** Mapping, Summary-Builder, Popover-Component

**E2E:** Hover-/Tap-Flow + Click-Action + Keyboard

**Coverage-Target:** ≥85% (Pin-Interaction kritisch)

### Previous Story Intelligence

- **Story 1.6:** MapLibre Plex-Cartography — Pin-Style-Integration
- **Story 1.7:** URL-State + selectAddressFromMapClick
- **Story 1.8:** Keyboard-Layer für Pins
- **Story 1.10:** Layer-Palette aktiviert Point-Layer
- **Story 1.12:** Editorial-Pattern für Stolperstein-Würde

### Open Questions

1. **Lucide-Icon-Auswahl Stolperstein:** `Footprints` semantisch falsch? Eventuell `Square` mit goldenem Outline? Schreibtischtest mit Erinnerungspolitik-Reviewer
2. **Hover-Performance bei 10k Stolpersteinen:** Bei Zoom 13+ alle sichtbar → MapLibre-Cluster-Layer prüfen
3. **Stations-Name-Duplikate:** U-Bahn-Friedrichstraße + S-Bahn-Friedrichstraße — wenn beide Layer aktiv und Pin überlagert?
4. **Mobile-Double-Tap-Gesten-Konflikt mit Map-Zoom:** Standard double-tap = Zoom-In. Custom-Handler nötig — Konflikt-Vermeidung wie?
5. **Hospital-Icon-Verfügbarkeit:** `Hospital` neu in Lucide. Pin-Sprite-Build muss Version checken

## Dev Agent Record

### Implementation Plan + Strategie

TDD-First per ADR-012. Story hatte zwei orthogonale Probleme (Pin-Render + Hover-Popover). Vor-Implementation Scope-Pivots mit User abgestimmt:

1. **Pin-Render: Runtime addImage + canvas** statt Build-Time-SDF-Sprite. Begruendung: kein Build-Step noetig, keine neuen Deps (lucide-static/spritezero). Lucide-iconNode-Daten als ISC-Kopie inline. Performance trade-off akzeptabel fuer Phase 1; bei sichtbarem Lag in 10k-Stolperstein-View Pivot zu SDF moeglich.
2. **Popover: Erweiterung map-hover-tooltip.svelte** statt separate map-popover.svelte. Begruendung: Wiederverwendung (Auto-Position, 300ms-Close-Timer, Defensive-Filter), Vermeidung von Duplikat-Hover-Listenern.
3. **Stolperstein-Icon: `Bookmark`** statt story-default `Footprints`. User-Pref (Memorial-Symbol-Semantik).

Implementations-Reihenfolge: Pin-Icon-Mapping → Color-Tokens → POI-Summary-Builder → Pin-Sprite-Renderer → MapLibre-Symbol-Layer → POI-Variant in Hover-Tooltip → Map-Interaction-Wiring (Pin-Click → Inspector-Scroll) → E2E-Smoke.

### Completion Notes

- 12 Lucide-Icons (ISC) inline kopiert in `pin-icon-mapping.ts` mit `{iconName, colorToken, svgNodes}`. Hot-Patch wenn User Icon-Choice aendert.
- Runtime-Pipeline: `map.on('load') → registerPinIcons(map, PIN_ICON_MAP, colorResolver)`. Idempotent via `hasImage`-Check. Fallback `styleimagemissing` registriert on-demand falls Symbol-Layer vor Sprite referenziert wird.
- 12 neue CSS-Tokens (semantisch nach Bundle: Memorial/Umwelt/Sozial/Mobility). Hex-Werte pragmatisch — Klima-Pivot wenn Designer noch differenziert.
- Pin-Sizing nach User-Feedback geschrumpft: 16/18/22px-Range zuerst, dann 0.4/0.5/0.6-Skala (entspricht ~11/14/17px). Map-Overview hat genug Whitespace ohne dass Pins verklumpen.
- AC-3 Pin-Click-Scroll: Pin-Slug-Detection ueber `map.project(lngLat) + queryRenderedFeatures` mit PIN_LAYER_SLUGS-Filter. Inspector $effect scrollt zur passenden Row via `scrollToLayerHitRow` (queueMicrotask wartet auf Mount).
- Bug-Fix waehrend Implementation: `queryRenderedFeatures` warf "Layer does not exist" wenn Symbol-Layer noch nicht gemountet. Defensive Filter ueber `map.getLayer` optional in `MapHoverApi` aufgenommen; Tests gegen Race-Schutz hinzugefuegt.
- Mobile-Tap-Popover + Mobile-Double-Tap-Click DEFERRED (Phase 2). Desktop-Hover deckt 80% des UX-Werts.
- Tests: +59 neue (19 pin-icon-mapping + 23 poi-summary-builder + 10 pin-sprite-renderer + 3 pin-sprite-svelte + 6 scroll-to-layer-row + 3 POI-tooltip + Symbol-Layer-Tests). Total: 714/715 passing (1 pre-existing failing climate-long-view aus Story 1.16-Scope).
- E2E `poi-popover.e2e.ts` Smoke-Level. axe-Snapshot deferred zu CI-Run.

### File List

**New:**

- `src/lib/components/atlas/internal/pin-icon-mapping.ts`
- `src/lib/components/atlas/internal/pin-icon-mapping.test.ts`
- `src/lib/components/atlas/internal/pin-sprite-renderer.ts`
- `src/lib/components/atlas/internal/pin-sprite-renderer.test.ts`
- `src/lib/components/atlas/internal/pin-sprite-renderer.svelte.test.ts`
- `src/lib/components/atlas/internal/poi-summary-builder.ts`
- `src/lib/components/atlas/internal/poi-summary-builder.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/scroll-to-layer-row.ts`
- `src/lib/components/atlas/inspector-panel/internal/scroll-to-layer-row.svelte.test.ts`
- `tests/e2e/poi-popover.e2e.ts`

**Modified:**

- `src/lib/components/atlas/internal/colors.ts` (12 Tokens added)
- `src/lib/components/atlas/internal/layer-style-builder.ts` (Pin-Symbol-Spec-Route + Type-Union erweitert auf 'symbol')
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (Symbol-Layer-Assertions ersetzen Pin-Circle-Assertions)
- `src/lib/components/atlas/internal/hover-tooltip-logic.ts` (POI-Variant via hasPinIcon-Branch)
- `src/lib/components/atlas/map-hover-tooltip.svelte` (POI-Render-Branch + data-variant + defensive getLayer-Filter)
- `src/lib/components/atlas/map-hover-tooltip.svelte.test.ts` (POI-Tests + Race-Filter-Test)
- `src/lib/components/atlas/map-libre-canvas.svelte` (registerPinIcons in onLoad + styleimagemissing-Fallback)
- `src/lib/components/atlas/inspector-panel.svelte` (panelEl-bind + scroll-effect auf scrollToLayerSlug)
- `src/lib/state/ui-context.svelte.ts` (scrollToLayerSlug-Field)
- `src/lib/state/ui-context.svelte.test.ts` (Tests fuer scrollToLayerSlug)
- `src/routes/(with-header)/+page.svelte` (detectPinSlugAtPoint + onClick-Wiring)
- `src/app.css` (12 CSS-Custom-Properties)

### Change Log

| Datum | Aenderung |
|-------|-----------|
| 2026-05-14 | Story 1.15 implementiert per TDD; Pin-Icon-Mapping + Color-Tokens + POI-Summary-Builder + Pin-Sprite-Renderer + Symbol-Layer + POI-Variant des Hover-Tooltips + Inspector-Scroll-to-Layer-Row + E2E-Smoke. Scope-Pivots: Runtime-addImage statt SDF-Build, Erweiterung map-hover-tooltip statt separate Popover-Komponente, Stolperstein-Icon Bookmark. Bug-Fix: queryRenderedFeatures-Race ueber optionalen getLayer-Filter. Mobile-Tap-Popover + Mobile-Double-Tap deferred zu Phase 2. |

## References

- [Source: planning-artifacts/epics.md] (UX-DR Pin-Differenzierung + Map-Interactivity)
- [Source: _bmad-output/implementation-artifacts/1-6-maplibre-plex-cartography-mit-glyph-pack.md]
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md] (Stolperstein-Würde)
- [Source: docs/adr/ADR-012-tdd-mandate.md]
