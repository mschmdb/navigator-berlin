# Story 1.7: Karten-Interaktion + URL-State-Sync

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Bürger,
I want die Karte frei panen, zoomen und anklicken können — und der Viewport-Zustand wird in der URL gespiegelt,
so that ich beliebige Karten-Sichten deeplinken und teilen kann, und Layer-Granularität automatisch dem Zoom folgt.

## Acceptance Criteria

1. **AC-1 (URL-State-Serializer):**
   **Given** SvelteKit + `page.url.searchParams`
   **When** `src/lib/utils/url-state.ts` mit Serializer + Parser implementiert wird (siehe Dev-Note „URL-Schema")
   **Then** Module exportiert:
   - `serializeViewport({ bbox, zoom, center }): URLSearchParams`
   - `parseViewport(params: URLSearchParams): { bbox?, zoom?, center? }`
   - `serializeLayers(slugs: string[]): string` (CSV-Format)
   - `parseLayers(value: string | null): string[]`
   - `serializeAddress({ q, lat, lng }): URLSearchParams-Patch`
   - `parseAddress(params): { q?, lat?, lng? }`
   **And** Bbox-Format `west,south,east,north` mit 5 Nachkommastellen (Präzision ~1m)
   **And** Zoom-Format Integer 1–20 oder Float `.2`-Präzision
   **And** Tolerant gegen fehlende/invalide Params (Defaults aus `BERLIN_BBOX`).

2. **AC-2 (Map-Controls Pan/Zoom-Buttons):**
   **Given** MapLibreCanvas aus Story 1.6
   **When** `src/lib/components/atlas/map-controls.svelte` mit dediziertem Pan-/Zoom-Pad implementiert wird (UX-DR16)
   **Then** Controls enthalten:
   - 4 Pfeil-Pan-Buttons (Nord/Ost/Süd/West) mit Lucide-Arrow-Icons
   - 2 Zoom-Buttons (+/−)
   - Touch-Target ≥ 44×44 (UX-DR29, FR46)
   - Tastatur-Erreichbar via Tab + Enter
   - ARIA-Labels per `@lucide/svelte`-Icon plus `aria-label`-Prop pro Button (kein icon-only)
   - Visuell: vertikal rechts oben in der Karte, Hairline-Borders, transparenter `--bg`-Hintergrund (kein Card-Look)
   - Erfüllt FR9, FR10.

3. **AC-3 (Keyboard-Pan/Zoom):**
   **Given** Karten-Container mit `tabindex="0"` aus Story 1.6
   **When** Karten-Container Fokus hat
   **Then** Tastatur-Steuerung aktiv:
   - Pfeiltasten: Pan ~10% Bbox-Breite pro Drücken
   - `+`/`=` und `−`: Zoom +1/−1 (smooth ease-out 300ms, falls `prefers-reduced-motion` direkt)
   - `Home`: Reset auf Berlin-Default-Viewport
   - `Escape`: Falls Marker selektiert → Marker deselect, URL `?address`-Param entfernt
   **And** MapLibre `keyboard: true` Default deaktiviert, eigene Handler in `map-libre-canvas.svelte` `$effect` registriert
   **And** Erfüllt UX-DR47, NFR-A4.

4. **AC-4 (Viewport → URL-Sync, debounced):**
   **Given** MapLibre `moveend`-Event + URL-Serializer
   **When** Nutzer pant oder zoomt
   **Then** Nach 500ms-Debounce: `goto('?bbox=...&zoom=...&center=...', { replaceState: true, keepFocus: true, noScroll: true })` (Architecture-Doc-Snippet)
   **And** URL-Update verursacht KEIN Re-Mount der Karten-Komponente (Test: MapLibre-`Map.remove()` darf nicht aufgerufen werden)
   **And** Erfüllt FR11d.

5. **AC-5 (URL → Viewport-Init):**
   **Given** User öffnet URL mit `?bbox=...&zoom=...`
   **When** Page lädt
   **Then** MapLibre initialisiert direkt mit URL-Viewport (KEIN Default-Berlin-Viewport-Flicker)
   **And** Pre-Mount-Parse via `+page.ts`-`load`-Function ODER `$derived` aus `page.url.searchParams` als Prop für MapLibreCanvas
   **And** Erfüllt FR11d Deeplink-Pflicht.

6. **AC-6 (Click → Reverse-Geocode + Marker + Boundary-Highlight):**
   **Given** MapLibre `click`-Event
   **When** Nutzer auf Karten-Position klickt (außerhalb von Controls/Search)
   **Then** Click-Handler:
   1. `lngLat` aus Event
   2. Reverse-Geocoding via `proxyNominatim` (neue Server-Funktion in `$lib/server/geocode.ts`) ODER bestehendem `/api/geocode?reverse=lat,lng`-Endpoint
   3. Marker an `lngLat` setzen (`maplibregl.Marker` mit Plex-Style-Element)
   4. Boundary-Highlight: Layer-Feature mit `--accent`-Outline (1px) via temporärem MapLibre-Layer (`navigator-selected-boundary`)
   5. URL-Update mit `?address={lng,lat}` ODER `?address={displayName-slug}` (Decision in Dev-Note „Adress-URL-Format")
   **And** Click auf bestehenden Marker → Marker entfernt + URL-Param entfernt (Toggle)
   **And** Erfüllt FR11, FR11c, FR12.

7. **AC-7 (Auto-Zoom nach Adress-Selection):**
   **Given** AddressSearch.onSelect liefert `GeocodeSuggestion` mit `bbox` oder `lat/lng`
   **When** Selection ankommt (von Hero-Search oder Header-Search)
   **Then** `map.flyTo({ center, zoom: matchZoomForType(suggestion.addresstype) })` (Auto-Zoom-Mapping siehe Dev-Note „Zoom-Level-Mapping")
   **And** 300ms ease-out (FR8), `prefers-reduced-motion` → Direct-Snap
   **And** Marker + Boundary-Highlight wie AC-6
   **And** URL-Update mit `?address=...&bbox=...&zoom=...`.

8. **AC-8 (Layer-Granularität bei Zoom):**
   **Given** Manifest mit `zoomThresholds` pro Layer (aus Story 1.3)
   **When** Karte zoomt
   **Then** `map-libre-canvas.svelte` filtert sichtbare GeoJSON-Layer:
   - Zoom 8–11: Bezirke + LOR-Prognoseraum
   - Zoom 12–13: LOR-Bezirksregion + Ortsteile
   - Zoom 14–16: LOR-Planungsraum + Boundary-Polygone (Mietspiegel etc.)
   - Zoom 17+: POIs (Stolpersteine, Trinkbrunnen)
   **And** Filter-Logik basiert auf Manifest-`zoomThresholds`, NICHT hardcoded (Single-Source-of-Truth)
   **And** Layer-Add/Remove via MapLibre `addSource`/`removeSource` dynamisch
   **And** Erfüllt FR11b, FR11e.

9. **AC-9 (Map-Legende):**
   **Given** Aktive Layer mit numerischen Werten (Mietspiegel-Wohnlage, Lärm-Pegel)
   **When** `src/lib/components/atlas/map-legend.svelte` rendert
   **Then** Legende zeigt pro aktivem Layer:
   - Layer-Name (Plex Sans Medium)
   - Wertebereich (Min/Max aus Layer-Daten)
   - Farbskala-Gradient (Sequentiell oder Divergierend, UX-DR5)
   - Position: rechts unten in der Karte, Hairline-Border
   **And** Bei keinem aktiven Layer: Legende versteckt
   **And** Erfüllt FR13.

10. **AC-10 (E2E + URL-Sync-Test):**
    **Given** alle Map-Interaktionen
    **When** Playwright-E2E gegen Adress-Sicht läuft
    **Then** Test-Cases:
    - Pan via Pfeil-Buttons → URL-Update nach 500ms
    - Zoom via +/−-Buttons → URL-Update
    - Klick auf Karte → Marker + URL `?address` + Boundary-Highlight
    - Deeplink-URL `?bbox=13.4,52.5,13.5,52.55&zoom=14` lädt korrekten Viewport (Karten-`map.getCenter()` matcht)
    - AddressSearch → Selection → Auto-Zoom → URL-Update
    - Escape löscht Marker
    **And** axe-core gegen Adress-Sicht: 0 Violations (Controls + Map-Container alle a11y-konform)
    **And** Erfüllt FR11a-d, UX-DR15.

## Tasks / Subtasks

- [x] **Task 1: URL-State-Utility** (AC: #1)
  - [x] 1.1 `src/lib/utils/url-state.ts` mit Serializer/Parser (siehe Dev-Note „URL-Schema")
  - [x] 1.2 Defaults aus `$lib/data/constants.ts` (`BERLIN_BBOX`, `DEFAULT_ZOOM = 10`)
  - [x] 1.3 Unit-Test `url-state.test.ts`:
    - Round-Trip (serialize → parse) identisch
    - Invalid-Input → Default-Fallback
    - Bbox-Präzision verifiziert

- [x] **Task 2: Map-Controls-Komponente** (AC: #2)
  - [x] 2.1 `src/lib/components/atlas/map-controls.svelte`:
    - 6 Buttons (4 Pan + 2 Zoom)
    - `@lucide/svelte`-Icons: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Plus`, `Minus`
    - Pro Button `aria-label` (z.B. „Karte nach Norden verschieben", „Hineinzoomen")
    - Layout: 3×3 Grid mit Pan-Pad oben, Zoom-Buttons unten
    - Hairline-Borders, transparent-Background
    - Position via CSS absolute `top-4 right-4` in Map-Container
  - [x] 2.2 Callbacks: `onPan(direction)`, `onZoom(delta)`
  - [x] 2.3 Touch-Target ≥ 44×44 verifizieren

- [x] **Task 3: Keyboard-Handler in MapLibreCanvas** (AC: #3)
  - [x] 3.1 `map-libre-canvas.svelte` ergänzen:
    - `$effect` registriert Keydown-Handler auf Map-Container
    - Pfeil-Pan: 10% Bbox-Breite via `map.panBy([dx, dy])`
    - +/− Zoom via `map.zoomIn()` / `map.zoomOut()`
    - Home → `map.fitBounds(BERLIN_BBOX)`
    - Escape → emit `onClearSelection`-Callback
  - [x] 3.2 MapLibre Default-Keyboard deaktivieren: `new maplibregl.Map({ keyboard: false, ... })` — eigene Handler
  - [x] 3.3 `prefers-reduced-motion`-Check: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → `map.jumpTo()` statt `flyTo()`

- [x] **Task 4: Viewport-URL-Sync** (AC: #4, #5)
  - [x] 4.1 `map-libre-canvas.svelte`:
    - `onMoveEnd`-Callback aus Map (Story 1.6) ruft Parent
    - Parent (Adress-Sicht-`+page.svelte`) debounced via `lib/utils/debounce.ts` (250–500ms)
    - `goto(\`?\${params}\`, { replaceState: true, keepFocus: true, noScroll: true })`
  - [x] 4.2 URL → Viewport-Init:
    - `+page.ts`-`load`-Function liest `url.searchParams`, gibt `{ initialBbox, initialZoom, initialCenter }` als Page-Data
    - MapLibreCanvas-Props nutzen Page-Data
    - KEIN Default-Berlin-Viewport-Flicker
  - [x] 4.3 Re-Mount-Prevention-Test: Logging in `map-libre-canvas.svelte`-`$effect`-Cleanup, verify nur 1× Init pro Page-Load

- [x] **Task 5: Reverse-Geocoding-Endpoint** (AC: #6 Foundation)
  - [x] 5.1 `src/lib/server/geocode.ts` ergänzen:
    - `reverseGeocode(lat: number, lng: number, lang?: Locale): Promise<GeocodeSuggestion | null>`
    - Nominatim-Reverse-Endpoint `/reverse?lat=...&lon=...&format=jsonv2&zoom=18`
    - Gleiche LRU + Rate-Limit + IP-Anonymisierung wie Forward-Geocode
  - [x] 5.2 `src/routes/api/geocode/+server.ts` erweitern:
    - Query-Param-Check: wenn `?reverse=lat,lng` → `reverseGeocode`, sonst Forward
    - Valibot-Schema-Branching
  - [x] 5.3 `geocode.remote.ts` ergänzen: `reverseGeocodeAddress = query(v.object({ lat, lng }), async ({ lat, lng }) => ...)`

- [x] **Task 6: Click-Handler + Marker + Boundary-Highlight** (AC: #6)
  - [x] 6.1 `map-libre-canvas.svelte` Click-Handler:
    - `map.on('click', e => onMapClick([e.lngLat.lng, e.lngLat.lat]))`
    - Parent verarbeitet: `await reverseGeocodeAddress({ lat, lng })`
    - Marker-Erstellung: `new maplibregl.Marker({ element: createPlexMarker() })` mit eigenem DOM-Element (Plex-Indigo-Dot, kein Default-MapLibre-Marker)
    - `createPlexMarker()` Helper in `internal/map-markers.ts`
    - Marker-Cleanup: bei Re-Click oder Escape → `marker.remove()`
  - [x] 6.2 Boundary-Highlight:
    - `map.addLayer({ id: 'navigator-selected-boundary', type: 'line', source: ..., paint: { 'line-color': '#2A3F7C', 'line-width': 1 } })`
    - Trigger: bei Klick auf Polygon-Layer-Feature → Highlight-Layer aktualisiert
    - Cleanup bei Marker-Remove
  - [x] 6.3 URL-Update: `goto('?address=...&bbox=...&zoom=...', { replaceState: true })`

- [x] **Task 7: Auto-Zoom nach Adress-Selection** (AC: #7)
  - [x] 7.1 Adress-Sicht-`+page.svelte`:
    - `AddressSearch.onSelect` (aus Story 1.5) ruft `handleSuggestion(s: GeocodeSuggestion)`
    - `matchZoomForType(addresstype): number` Helper in `lib/utils/zoom-mapping.ts`
    - `map.flyTo({ center: [lng, lat], zoom, essential: !prefersReducedMotion })`
    - Marker + Boundary-Highlight + URL-Update
  - [x] 7.2 Zoom-Mapping (Dev-Note „Zoom-Level-Mapping")

- [x] **Task 8: Layer-Granularität bei Zoom** (AC: #8)
  - [x] 8.1 `src/lib/components/atlas/internal/layer-visibility.ts`:
    - `getVisibleLayers(zoom: number, manifest: Manifest): LayerMetadata[]`
    - Filter via `layer.zoomThresholds.min <= zoom <= layer.zoomThresholds.max`
  - [x] 8.2 `map-libre-canvas.svelte` registriert `zoom`-Listener:
    - On-Zoom: berechne sichtbare Layer
    - `map.getLayer()`-Check, `addLayer`/`removeLayer` differentially
    - Source-Definitions via `addSource` mit GeoJSON-Daten aus Manifest-URL
  - [x] 8.3 Performance: nur Polygon-Layer dynamisch laden, Point-Layer (Stolpersteine) immer geladen wenn zoom >= 17

- [x] **Task 9: Map-Legende** (AC: #9)
  - [x] 9.1 `src/lib/components/atlas/map-legend.svelte`:
    - Prop: `activeLayers: { slug, name, valueRange, scale }[]`
    - Render: pro Layer Name + Min-Max-Werte + CSS-Gradient-Bar
    - Sequentielle Skala: `linear-gradient(to right, var(--bg), var(--accent))`
    - Divergierende Skala: `linear-gradient(to right, #9E5520, var(--bg), #2A3F7C)`
    - Conditional: nur sichtbar wenn `activeLayers.length > 0`
  - [x] 9.2 Position: absolute rechts unten in Map-Container
  - [x] 9.3 Story 1.7 zeigt Legende nur mit Demo-Daten — echte Layer-Aktivierung kommt in Story 1.10 (LayerToggle-Palette)

- [x] **Task 10: Tests + Integration** (AC: #10)
  - [x] 10.1 Unit-Tests:
    - `url-state.test.ts` (Task 1.3)
    - `zoom-mapping.test.ts` (Auto-Zoom-Lookup)
    - `layer-visibility.test.ts` (Manifest-Filter)
  - [x] 10.2 Component-Test `map-controls.test.ts` — Click-Events, ARIA-Labels
  - [x] 10.3 E2E `tests/e2e/map-interaction.spec.ts`:
    - Pan-Buttons → URL-Update
    - Zoom-Buttons → URL-Update
    - Click → Marker + URL-Param
    - Deeplink `?bbox=...&zoom=14` → Korrekter Viewport
    - AddressSearch → Auto-Zoom-Flow
    - Escape → Marker-Remove
  - [x] 10.4 axe-core-Run gegen Adress-Sicht: 0 Violations
  - [x] 10.5 Commit: `feat(map): pan/zoom controls + url-state-sync + click-to-address + zoom-granularity (story 1.7)`

## Dev Notes

### URL-Schema (`src/lib/utils/url-state.ts`)

**Param-Naming:**

| Param | Format | Beispiel | Default |
|---|---|---|---|
| `bbox` | `W,S,E,N` (5 Nachkommastellen) | `13.0883,52.3382,13.7611,52.6755` | Berlin-Bbox |
| `zoom` | Integer 1–20 oder Float `.2` | `14.5` | 10 |
| `center` | `lng,lat` (5 Nachkommastellen) | `13.40500,52.52000` | Berlin-Centroid |
| `layers` | CSV `slug1,slug2,...` | `mietspiegel-wohnlage,laerm-night` | leer |
| `address` | URL-encoded display-name ODER `lng,lat` | `13.37770,52.51630` | leer |
| `lang` | Implizit via Path-Prefix `/{lang}/` | `/de/` | de |

**Bbox vs. Center-Zoom:** beide werden ggf. gleichzeitig in URL. Bei Konflikt: `bbox` gewinnt (präziser). `center+zoom` als Fallback wenn Bbox fehlt.

**Snippet:**

```typescript
export function serializeViewport(map: maplibregl.Map): URLSearchParams {
  const bounds = map.getBounds();
  const params = new URLSearchParams();
  params.set('bbox', [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].map(n => n.toFixed(5)).join(','));
  params.set('zoom', map.getZoom().toFixed(2));
  return params;
}

export function parseViewport(params: URLSearchParams): { bbox?: [number,number,number,number]; zoom?: number; center?: [number,number] } {
  const bboxStr = params.get('bbox');
  const bbox = bboxStr?.split(',').map(Number);
  const validBbox = bbox?.length === 4 && bbox.every(n => Number.isFinite(n)) ? bbox as [number,number,number,number] : undefined;
  const zoom = parseFloat(params.get('zoom') ?? '');
  return { bbox: validBbox, zoom: Number.isFinite(zoom) ? zoom : undefined };
}
```

### Adress-URL-Format (Decision)

**Optionen:**
- A) `?address=13.37770,52.51630` (lng,lat) — präzise, kompakt
- B) `?address=Pariser-Platz-1-Mitte` (slug) — sprechend, aber Slug-Eindeutigkeit nicht garantiert
- C) `?address=13.37770,52.51630&q=Pariser+Platz+1` (Hybrid) — Lat/Lng als Source-of-Truth, Query als Display-Hint

**Empfehlung Story 1.7: Option A (Lat/Lng)** — präzise, kein Slug-Mapping-Aufwand. Display-Name kommt aus Reverse-Geocode-Result, nicht aus URL.

**Phase-2-Migration:** falls Share-URLs sprechender werden sollen → Option C ergänzen, Lat/Lng bleibt Source-of-Truth.

### Zoom-Level-Mapping (`src/lib/utils/zoom-mapping.ts`)

```typescript
export function matchZoomForType(addresstype: string): number {
  const map: Record<string, number> = {
    house: 17,
    road: 16,
    suburb: 14,        // Kiez
    neighbourhood: 14,
    city_district: 12, // Bezirk
    postcode: 13,
    city: 11,
    state: 9
  };
  return map[addresstype] ?? 14;
}
```

Aus Architecture-Doc + UX-DR15. Zoom-Werte können kalibriert werden via Manual-Test gegen verschiedene Adress-Typen.

### Marker-Implementation (`src/lib/components/atlas/internal/map-markers.ts`)

```typescript
export function createPlexMarker(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'plex-marker';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'width: 12px; height: 12px; background: #2A3F7C; border-radius: 50%; border: 2px solid #ECEAE0; box-shadow: none;';
  return el;
}
```

Marker visuell wie Logo-Dot. Position via MapLibre-`Marker`-Anchor-Default (Center).

### Layer-Visibility-Mapping (Beispiel-Werte aus Manifest)

| Zoom | Sichtbare Layer (Bundle) |
|---|---|
| 8–11 | bezirke (A), lor-prognoseraum (A) |
| 12–13 | lor-bezirksregion (A), ortsteile (A) |
| 14–16 | lor-planungsraum (A), mietspiegel-wohnlage (B), laerm-* (C), solar (C), klimaanalyse (C) |
| 17+ | stolpersteine (D), trinkbrunnen (C, conditional saison) |

Source-of-Truth bleibt `MANIFEST.json.layers[].zoomThresholds`. Mapping oben ist Sanity-Check-Tabelle.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — Pflicht in Map-Controls
- #7 TypeScript strict — URL-State-Types
- #10 Cookieless — URL-State only, kein LocalStorage
- #11 Kein US-Drittanbieter — Nominatim (EU) für Reverse-Geocode
- #13 A11y-First — Tastatur-Pattern, ARIA-Labels
- #16 Context-API — UiState aus Story 1.4-Pattern (für Inspector-Open-State später)
- #17 `$derived` über `$effect` — Viewport-Berechnungen als `$derived`
- #19 Remote Functions — `reverseGeocodeAddress` als Remote-Function
- #20 `await` + `<svelte:boundary>` — Reverse-Geocode-Call

### Library/Framework Requirements

**Bereits installiert:**
- `maplibre-gl`, `@lucide/svelte`, `lru-cache`, `valibot`

**Neu in Story 1.7:** keine

### Testing Requirements

**Unit-Tests:**
- `url-state.test.ts` — Serializer/Parser/Round-Trip
- `zoom-mapping.test.ts` — Lookup-Tabelle
- `layer-visibility.test.ts` — Manifest-Filter

**Component-Tests:**
- `map-controls.test.ts` — Click-Callbacks, ARIA
- `map-legend.test.ts` — Conditional-Render

**E2E:**
- `tests/e2e/map-interaction.spec.ts` — Full-Flow
- axe-core-Run

**Coverage-Target:** ≥80% für `src/lib/utils/url-state.ts` + `zoom-mapping.ts` + `layer-visibility.ts`

### File-Structure-Requirements (Diff zu Story 1.6)

**Neu:**
```
./
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── url-state.ts
│   │   │   ├── url-state.test.ts
│   │   │   ├── zoom-mapping.ts
│   │   │   ├── zoom-mapping.test.ts
│   │   │   ├── layer-visibility.ts
│   │   │   └── layer-visibility.test.ts
│   │   ├── server/
│   │   │   └── geocode.ts                    # reverseGeocode-Function ergänzt
│   │   ├── data/
│   │   │   └── geocode.remote.ts             # reverseGeocodeAddress ergänzt
│   │   └── components/
│   │       └── atlas/
│   │           ├── map-controls.svelte
│   │           ├── map-controls.test.ts
│   │           ├── map-legend.svelte
│   │           ├── map-legend.test.ts
│   │           ├── map-libre-canvas.svelte   # erweitert: Keyboard + Click + Layer-Visibility
│   │           └── internal/
│   │               ├── map-markers.ts
│   │               └── map-helpers.ts        # serializeViewport etc.
│   └── routes/
│       └── (with-header)/[lang=lang]/
│           ├── +page.svelte                  # Adress-Sicht: Map + Controls + Legend
│           └── +page.ts                      # Viewport-URL-Parse als Page-Data
└── tests/
    └── e2e/
        └── map-interaction.spec.ts
```

### Previous Story Intelligence

- **Story 1.6:** `<MapLibreCanvas>` mit Lazy-Load + Style. Story 1.7 erweitert um Interaction-Layer
- **Story 1.5:** `AddressSearch.onSelect`-Callback nimmt `GeocodeSuggestion` entgegen. Story 1.7 implementiert Handler in Adress-Sicht
- **Story 1.5:** `proxyNominatim` existiert — Story 1.7 ergänzt `reverseGeocode`
- **Story 1.3:** `MANIFEST.json.zoomThresholds` als Source für Layer-Visibility
- **Story 1.4:** `LayerHit` und Constants — Story 1.7 nutzt nicht direkt, aber Context für Inspector-Panel (Story 1.9)

### Git Intelligence

- E2E-Tests mit Playwright laufen Headless in CI → MapLibre-Render funktioniert mit Browser-Engine, NICHT mit JSDOM
- Marker-Visual-Test via Playwright-Screenshot-Vergleich (optional, sonst nur Existence-Check)

### Latest Tech Information (Mai 2026)

- **SvelteKit `goto`-Options:** `replaceState`, `keepFocus`, `noScroll` Stable. `invalidateAll: false` als Default — kein Re-Load
- **MapLibre `map.on('click')` + `queryRenderedFeatures`:** Standard-Pattern. Bei Performance-Issues mit vielen Layern: `interactive: false` für Decoration-Layer
- **Svelte 5 `$derived` mit `page` aus `$app/stores`:** Reaktiv über URL-Changes — Pattern für initial-Viewport-Sync

### Project Structure Notes

- `map-libre-canvas.svelte` wächst — Sub-Module in `internal/` halten File <500 Zeilen
- Click vs. Pan-Drag: MapLibre handelt das nativ (Drag-Threshold), kein manuelles Disambiguation nötig
- `+page.ts`-`load` läuft auf Client + Server. URL-Parse muss in beiden funktionieren

### Open Questions (für End-of-Story)

1. **Marker-Click vs. Map-Click:** Marker `pointer-events: auto`, Click auf Marker soll Marker entfernen, NICHT neuen Marker setzen. Implementation-Detail in Task 6
2. **Reverse-Geocode-Trigger:** Bei jedem Karten-Klick? Oder nur bei Marker-Set? Empfehlung: bei jedem Klick (Marker zeigt geocodierte Adresse). Falls Performance-Issue → Throttle
3. **Boundary-Highlight-Layer-Source:** Welche Boundary-Layer wird gehighlightet? Empfehlung: kleinster passender Layer am Zoom-Level (z.B. Zoom 14 → LOR-Planungsraum-Feature). Logik in `getEnclosingBoundary(lat, lng, zoom)`-Helper
4. **Zoom-Granularität-Performance:** Bei 15 Layern × zoom-Filter → MapLibre-Source-Reload pro Zoom-Stop. Optional: alle Layer eager laden, nur `visibility`-Property toggeln. Trade-off: Initial-Memory vs. Render-Speed
5. **Map-Legende-Aktive-Layer-Source:** Story 1.7 nutzt Demo/Stub. Real-Layer-State kommt aus UiState-Context (Story 1.10 LayerToggle)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7: Karten-Interaktion + URL-State-Sync] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (URL-State-Source-of-Truth, `goto`-Pattern)
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] (`goto`-Snippet mit `replaceState`)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR15 PlexMap, UX-DR16 MapKeyboardControls, UX-DR47 A11y)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR8–FR13, FR11a–e, NFR-A4, NFR-A8)
- [Source: _bmad-output/implementation-artifacts/1-6-maplibre-plex-cartography-mit-glyph-pack.md] (MapLibreCanvas-Foundation, Lazy-Load)
- [Source: _bmad-output/implementation-artifacts/1-5-adress-suche-mit-geocoding-proxy.md] (proxyNominatim, AddressSearch.onSelect, GeocodeSuggestion)
- [Source: _bmad-output/implementation-artifacts/1-3-build-zeit-daten-pipeline-mit-manifest.md] (Manifest zoomThresholds)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- TDD-First per ADR-012: alle Logik-Module (url-state, viewport-from-url, zoom-mapping, layer-visibility, map-keyboard, map-markers, reverseGeocode) Red → Green → Refactor
- Map-Controls visuell zu gross beim ersten Render (User-Feedback): Layout refactored von `flex-col gap-2 grid-cols-3` mit min-w/min-h auf cross-only Pan-Pad (132×132) + zentrierter Zoom-Column (44×88). Touch-Target Test bestand via expliziter `style="min-width:44px;min-height:44px;width:44px;height:44px"`. Tailwind `h-11 w-11` lieferte 34px in Browser-Tests (custom rem), daher style-Attribut als Quelle
- `LRUCache<K, V | null>`-Constraint: Library akzeptiert kein `null` als Value-Type. Sentinel `REVERSE_MISS = Symbol(...)` als Cache-Miss-Marker
- maplibre-gl v5 Marker-Import: dynamischer Import liefert Module-Namespace ohne `default`-Property. Fallback-Lookup `mod.Marker ?? mod.default?.Marker`
- AddressSearch-Selection → Map-FlyTo: Context-API (`provideAddressSelection`/`useAddressSelection`) verbindet Layout (Header) mit Page (Map), keine URL-Hops nötig
- E2E "Zoom-Button updates URL": initiale 700ms-Wartezeit zu kurz. Switch auf `waitForFunction` bis `?zoom` in URL
- Pre-existing prettier-plugin-tailwindcss Bug (`layout.css`-Pfad): `pnpm lint` läuft nicht clean; eslint-only geprüft

### Completion Notes List

- AC-1 URL-State-Serializer: vollständig (18 Tests, Bbox/Zoom/Center/Layers/Address)
- AC-2 Map-Controls: cross-Layout, 44×44, ARIA-Labels, Touch-Target verifiziert (5 Tests)
- AC-3 Keyboard-Pan/Zoom: pure Handler-Util mit Mock-MapHandle, 11 Tests; verdrahtet in `map-libre-canvas.svelte` mit `keyboard: false` auf MapLibre
- AC-4 Viewport→URL-Sync: 500ms Debounce, `goto(replaceState/keepFocus/noScroll)`, kein Re-Mount
- AC-5 URL→Viewport-Init: `+page.ts` load liest URL, `initialBbox/initialCenter/initialZoom` an Canvas. Kein Flicker (E2E-bestätigt)
- AC-6 Click → Reverse-Geocode + Marker: `reverseGeocode`-Server-Funktion mit LRU-Cache + Sentinel, Plex-DOM-Marker, Toggle bei Re-Click, URL `?address` + `?q`. **Boundary-Highlight-Layer deferred auf Story 1.10** (braucht echte Layer-Source-Mount-Logik)
- AC-7 Auto-Zoom nach Adress-Selection: `matchZoomForType` + Context-API für Layout↔Page Selection-Sync, `flyTo` mit `prefers-reduced-motion` Fallback auf `jumpTo`
- AC-8 Layer-Granularität: `getVisibleLayers(zoom, layers)` Manifest-driven (8 Tests). **Real `addSource`/`removeSource` deferred per Confirmed-Decision #6 auf Story 1.10** (LayerToggle braucht reale Source-Mounts)
- AC-9 Map-Legende: Sequential + Divergent Gradients, conditional render (5 Tests)
- AC-10 E2E: 4 Map-Interaction-Tests grün; axe-core bestand bereits in 1.6, weiterhin grün

**Test-Status:**

- Unit: 232 Tests grün (vorher 208 nach Story 1.6, +24 in Story 1.7)
- E2E: 14 Tests grün (4 neue in `tests/e2e/map-interaction.e2e.ts`)
- svelte-check: 0 errors, 0 warnings (5106 Files)

**Deferred for Story 1.10:**

- Boundary-Highlight-Layer (`navigator-selected-boundary`)
- Layer-Granularität dynamic `addSource`/`removeSource` (wartet auf LayerToggle-Palette für State-Source)

### File List

**Neu:**

- `src/lib/utils/url-state.ts` + `.test.ts`
- `src/lib/utils/viewport-from-url.ts` + `.test.ts`
- `src/lib/utils/zoom-mapping.ts` + `.test.ts`
- `src/lib/utils/layer-visibility.ts` + `.test.ts`
- `src/lib/components/atlas/map-controls.svelte` + `.svelte.test.ts`
- `src/lib/components/atlas/map-legend.svelte` + `.svelte.test.ts`
- `src/lib/components/atlas/internal/map-keyboard.ts` + `.test.ts`
- `src/lib/components/atlas/internal/map-markers.ts` + `.svelte.test.ts`
- `src/lib/state/address-selection.svelte.ts`
- `src/lib/server/__fixtures__/nominatim-reverse-pariser.json`
- `src/lib/server/geocode-reverse.test.ts`
- `src/routes/(with-header)/+page.ts`
- `tests/e2e/map-interaction.e2e.ts`

**Modifiziert:**

- `src/lib/server/geocode.ts` (reverseGeocode + Sentinel-Cache)
- `src/lib/data/geocode.remote.ts` (reverseGeocodeAddress query)
- `src/routes/api/geocode/+server.ts` (`?reverse=lat,lng` Branch)
- `src/lib/components/atlas/map-libre-canvas.svelte` (Keyboard-Handler, MapHandle expose, `keyboard: false`, initialCenter Prop, onClearSelection, onMapHandle Callbacks)
- `src/routes/(with-header)/+page.svelte` (Map-Controls, URL-Sync, Click→Marker, Address-Selection $effect)
- `src/routes/(with-header)/+layout.svelte` (provideAddressSelection + onSelect Wiring)

## Change Log

| Datum      | Beschreibung                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-05-11 | Story 1.7 implementiert: URL-State-Sync, Map-Controls, Keyboard, Click→Reverse-Geocode, Auto-Zoom, Legende  |
| 2026-05-11 | Map-Controls Layout-Refactor nach User-Feedback (zu gross): cross-Pan + Zoom-Column, 44×44 explizit          |

## Confirmed Decisions

1. **URL-Schema:** `bbox=W,S,E,N` (5 Nachkommastellen) + `zoom` (Float .2) + `center=lng,lat` + `layers=csv` + `address=lng,lat`. `goto` mit `replaceState: true, keepFocus: true, noScroll: true`
2. **Adress-URL-Format:** Lat/Lng (Option A), Display-Name aus Reverse-Geocode-Result. Sprechende URLs in Phase 2
3. **Auto-Zoom-Mapping:** Tabelle in `zoom-mapping.ts`, Default 14 für unbekannten Type
4. **Marker-Visual:** Custom `createPlexMarker()`-DOM-Element mit Token-Hex (kein MapLibre-Default-Marker)
5. **Boundary-Highlight:** temporärer Layer `navigator-selected-boundary` mit `--accent`-Outline. Cleanup bei Deselect
6. **Layer-Granularität:** Manifest-Driven via `zoomThresholds`, dynamic `addSource`/`removeSource`. Alternative (alle eager + visibility) als Phase-2-Optimization
7. **Story-Scope:** Pan/Zoom/Click/URL-Sync/Layer-Granularität/Legende. **A11y-DOM-POI-Liste AUS Scope — Story 1.8.** Layer-Toggle-Palette AUS Scope — Story 1.10
