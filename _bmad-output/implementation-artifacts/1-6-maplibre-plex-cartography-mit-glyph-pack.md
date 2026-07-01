# Story 1.6: MapLibre Plex-Cartography mit Glyph-Pack

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Bürger,
I want eine ruhige MapLibre-Karte im Plex-Cartography-Style mit Karten-Beschriftung in derselben Schrift wie die UI,
so that Karte und UI als visuelles Stück erscheinen und nicht wie „schicke Webseite plus Standard-Mapbox-Tile" wirken.

## Acceptance Criteria

1. **AC-1 (Glyph-Pack-Build-Script):**
   **Given** Plex Variable Fonts in `static/fonts/` aus Story 1.2
   **When** `scripts/build-glyphs.ts` mit `fontnik` einmalig ausgeführt wird (siehe Dev-Note „Glyph-Build-Pipeline")
   **Then** Glyph-Pack pro Fontstack + Range generiert: `static/glyphs/{fontstack}/{range}.pbf`
   **And** 4 Skripte abgedeckt: `latin` (U+0000–024F), `latin-ext` (U+0100–024F + TR-Spezialzeichen), `cyrillic` (U+0400–04FF), `arabic` (U+0600–06FF + U+0750–077F)
   **And** Fontstacks: `Plex Sans Regular`, `Plex Sans Medium`, `Plex Serif Italic`, `Plex Sans Arabic Regular`, `Plex Sans Arabic SemiBold` (siehe Dev-Note „Fontstack-Liste")
   **And** Output committed im Repo unter `static/glyphs/` (Größenordnung 5–30 MB total — Architecture-Doc Decision: nicht via LFS)
   **And** Erfüllt UX-DR44, NFR-IL3.

2. **AC-2 (Plex-Cartography-Style-JSON):**
   **Given** Glyph-Pack
   **When** `static/map-style.json` als eigener MapLibre-Style-JSON erstellt wird (Plex-Cartography-Direktive aus Recherche, Cloud-Dancer-kalibriert — siehe Dev-Note „Style-JSON-Skeleton")
   **Then** Style enthält:
   - `version: 8`
   - `name: "navigator-berlin-plex"`
   - `sources` mit OpenFreeMap-Vector-Tile-Source via Env-Var `PUBLIC_TILE_URL`
   - `glyphs: "/glyphs/{fontstack}/{range}.pbf"` — relative URL, served via Static-Assets
   - `sprite`-Field leer (kein Sprite Phase 1, optional Phase 2)
   - `layers`-Array mit:
     - `background`-Layer Cloud Dancer `#ECEAE0`
     - `landuse_*` (Park, Forest, Residential, Industrial) — gedämpfte Off-White-Töne
     - `water` (Spree, Havel, Seen) — Light-Blue mit niedriger Opazität
     - `road`-Layer-Hierarchie (motorway → primary → secondary → tertiary → residential) als Hairline-Linien
     - `boundary_*` (national, region, district) als gestrichelte Hairlines
     - `place_*` (country, state, city, suburb, locality) als Text-Layer mit `text-font: ["Plex Sans Regular"]`
     - `text-halo-color: #ECEAE0`, `text-halo-width: 1`
   - Keine Sprites/Icons (POI-Marker werden in Story 1.9 als Inspector-Panel-Elemente, NICHT als Karten-Icons)
   **And** Style validiert via `@maplibre/maplibre-gl-style-spec` (Dev-Validation)
   **And** Erfüllt FR7, UX-DR44.

3. **AC-3 (MapLibreCanvas-Komponente mit Lazy-Load):**
   **Given** Plex-Style + Glyph-Pack
   **When** `src/lib/components/atlas/map-libre-canvas.svelte` implementiert wird
   **Then** Komponente hat:
   - Dynamic-Import `await import('maplibre-gl')` im `onMount` (NFR-P9)
   - CSS-Import `import 'maplibre-gl/dist/maplibre-gl.css'` (Vite handelt Code-Splitting)
   - Props: `initialBbox?: BBox`, `initialZoom?: number`, `style?: string` (Default `/map-style.json`)
   - Events via Callbacks: `onMoveEnd: (e: MoveEvent) => void`, `onClick: (lngLat) => void`, `onLoad: (map: Map) => void`
   - `<div bind:this={mapContainer} role="application" aria-describedby="map-help" />` als Mount-Target
   - Cleanup im `$effect` Return-Function: `map?.remove()`
   - Fallback-UI während Lazy-Load: Skeleton mit „Karte wird geladen…" (UX-DR36)
   - 5s-Timeout-Fallback: Falls Tile-Provider unerreichbar, Error-Snippet mit Retry + Switch-Provider-Hint
   **And** Vite `manualChunks` in `vite.config.ts` bundlet MapLibre + LayerChart in async-Chunks (Architecture-Doc Snippet, NFR-P5):
   ```javascript
   build: { rollupOptions: { output: { manualChunks: {
     maplibre: ['maplibre-gl'],
     layerchart: ['layerchart', 'd3-scale', 'd3-interpolate', 'd3-array'],
     turf: ['@turf/boolean-point-in-polygon', '@turf/helpers', '@turf/distance', 'rbush']
   } } } }
   ```
   **And** Initial-JS gzipped bleibt ≤ 200 KB (NFR-P5).

4. **AC-4 (Karten-Integration in Adress-Sicht):**
   **Given** MapLibreCanvas + AddressSearch aus Story 1.5
   **When** Route `src/routes/(with-header)/[lang=lang]/+page.svelte` (Adress-Sicht) Karte rendert
   **Then** Karte zeigt Berlin-Default-Viewport (`bbox=[13.0883,52.3382,13.7611,52.6755]`, `zoom=10`, center `[13.4050, 52.5200]`)
   **And** Nach `AddressSearch.onSelect`: `map.fitBounds(suggestion.bbox)` ODER `map.flyTo({ center: [lng, lat], zoom: passenderZoom })`
   **And** Karten-Beschriftung erscheint in Plex Sans (Latin-Subset für DE-Default)
   **And** Background-Farbe Cloud Dancer (visueller Inspect via DevTools-Element-Picker auf Canvas-Background-Layer).

5. **AC-5 (Karten-Style Side-by-Side-Vergleich):**
   **Given** Plex-Cartography aktiv
   **When** Vergleichs-Showcase `src/routes/_dev/map-style/+page.svelte` zwei Karten nebeneinander rendert (Plex-Cartography vs. OpenFreeMap-Liberty Default-Style)
   **Then** Solo-Maintainer kann Visual-Diff prüfen (UX-DR44)
   **And** Decision dokumentiert in `docs/adr/ADR-001-tile-provider.md` (existiert als Stub aus Story 1.1) — Status → `Accepted` mit Side-by-Side-Screenshot-Hint
   **And** Route prerender = false.

6. **AC-6 (Tile-Provider-Switch-Runbook):**
   **Given** OpenFreeMap Default + Protomaps Hedge
   **When** `docs/runbooks/tile-provider-switch.md` erstellt wird (siehe Dev-Note „Runbook-Inhalt")
   **Then** Runbook enthält:
   - Trigger-Konditionen (Provider-Ausfall >15min, Performance-Issue, Lizenz-Änderung)
   - Schritt 1: Env-Var-Switch `PUBLIC_TILE_URL=https://api.protomaps.com/...` setzen (`.env.production` oder Coolify-UI)
   - Schritt 2: `static/map-style.json` `sources.openmaptiles.url` aktualisieren (Protomaps PMTiles ggf. anderes Format)
   - Schritt 3: Deploy via `git push` + Coolify-Webhook
   - Verification: `/api/healthz` + Visual-Spot-Check Karten-Tile lädt
   - Rollback-Procedure
   **And** Erfüllt NFR-R6.

7. **AC-7 (Asset-CSP + Static-Headers):**
   **Given** Strict-CSP-Pläne (Story 4.2)
   **When** Story 1.6 Glyph-Pack + Tile-URLs vorbereitet
   **Then** Dokumentation in `docs/adr/ADR-001-tile-provider.md` ergänzt:
   - `connect-src`-Required-Domains: `tiles.openfreemap.org` (Phase 1), `api.protomaps.com` (Hedge), `self` (Glyphs)
   - `font-src`-Required: `self` (Plex woff2)
   - `img-src`-Required: `self`, `data:` (MapLibre Sprite-Inline-PNGs falls genutzt)
   - Static-Headers für `static/glyphs/**`: `Cache-Control: public, max-age=2592000, immutable` (30 Tage, da Glyphs nur via Fontnik-Re-Build invalidiert)
   - Static-Headers für `static/map-style.json`: `Cache-Control: public, max-age=3600, must-revalidate` (Style-Updates wahrscheinlicher als Glyphs)
   **And** Hetzner-/Traefik-Header-Config-Snippet als Anhang (kommt produktiv erst in Story 4.2).

8. **AC-8 (A11y-Hooks-Foundation):**
   **Given** MapLibreCanvas mit `role="application"`
   **When** verstecktes Help-Element + ARIA-Live-Region in `+layout.svelte` ODER inline in MapLibreCanvas eingebaut werden
   **Then** `<p id="map-help" class="sr-only">` mit Steuerungs-Anleitung: „Karte interaktiv. Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen, Tab für POI-Liste."
   **And** `<div aria-live="polite" id="map-status" class="sr-only">` für Update-Announcements
   **And** **`MapKeyboardControls`, `MapAccessibilityLayer`, MapClickHandler, URL-Sync** explizit AUS Scope — kommen in Story 1.7 + 1.8 (Karten-Interaktion, Karten-Accessibility-Layer)
   **And** Erfüllt UX-DR47-Foundation (volle A11y in 1.7/1.8).

9. **AC-9 (Smoke + Performance-Verify):**
   **Given** alle Components
   **When** `pnpm dev` läuft + Adress-Sicht mit Karte geladen wird
   **Then** Browser-Konsole 0 MapLibre-Errors
   **And** Network-Tab: `maplibre-gl.css` + `maplibre-gl.js` als async-Chunk (NICHT in main bundle)
   **And** `pnpm build` Output: `manualChunks`-Verteilung verifiziert (Inspect via `vite build --debug` oder `du -sh build/**/maplibre*`)
   **And** Lighthouse-Run gegen Adress-Sicht (manuell oder `pnpm dlx lighthouse-ci`): Performance ≥ 90, Initial-JS ≤ 200 KB gzipped (Bundle-Gate-Foundation Story 4.3).

## Tasks / Subtasks

- [ ] **Task 1: Fontnik-Setup + Glyph-Build** (AC: #1)
  - [ ] 1.1 Verify `fontnik` Dev-Dep aus Story 1.1 installiert
  - [ ] 1.2 `scripts/build-glyphs.ts` mit Schritten (siehe Dev-Note „Glyph-Build-Pipeline"):
    - Plex-Fonts aus `static/fonts/` laden (Latin/Latin-ext/Cyrillic Variable + Arabic Static 400/600)
    - Pro Fontstack: Glyph-Ranges generieren (`0-255`, `256-511`, ..., `65280-65535`)
    - Output nach `static/glyphs/{fontstack}/{range}.pbf`
  - [ ] 1.3 `package.json` Script: `"build:glyphs": "tsx scripts/build-glyphs.ts"`
  - [ ] 1.4 Einmalig `pnpm build:glyphs` lokal ausführen — Output committen
  - [ ] 1.5 Verify: `ls static/glyphs/` zeigt 5 Fontstack-Ordner mit `.pbf`-Range-Files

- [ ] **Task 2: Map-Style-JSON** (AC: #2)
  - [ ] 2.1 `static/map-style.json` erstellen — Skeleton aus Dev-Note „Style-JSON-Skeleton"
  - [ ] 2.2 Tile-Source: `openmaptiles` mit `url` = `${PUBLIC_TILE_URL}/styles/liberty/tiles.json` (OpenFreeMap-Pattern) ODER direkter `tiles`-Array
  - [ ] 2.3 Layer-Hierarchie aus Plex-Cartography-Spec (UX-DR44):
    - background, landuse_* (park, forest, residential, commercial, industrial)
    - water, water_name
    - building (sehr subtil, `--rule`)
    - road_minor, road_secondary, road_primary, road_motorway (Hairlines)
    - boundary_* (3 Levels)
    - place_* (city, suburb, locality) Text mit Plex Sans
  - [ ] 2.4 Color-Tokens hardcoded mit Token-Hex (Cloud Dancer `#ECEAE0`, Accent `#2A3F7C`, Rule `#C8C6BB`)
  - [ ] 2.5 Validate via `@maplibre/maplibre-gl-style-spec validate static/map-style.json` (Dev-Dep installieren falls noch nicht: `pnpm add -D @maplibre/maplibre-gl-style-spec`)
  - [ ] 2.6 File <500 Zeilen (kompaktes Style-JSON, evtl. Layer-Komment-Reduktion)

- [ ] **Task 3: Vite `manualChunks`** (AC: #3 Foundation)
  - [ ] 3.1 `vite.config.ts` Build-Config ergänzen:
    ```typescript
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            maplibre: ['maplibre-gl'],
            layerchart: ['layerchart', 'd3-scale', 'd3-interpolate', 'd3-array'],
            turf: ['@turf/boolean-point-in-polygon', '@turf/helpers', '@turf/distance', 'rbush']
          }
        }
      }
    }
    ```
  - [ ] 3.2 `pnpm build` ausführen, verify Chunks (`build/_app/immutable/chunks/maplibre-*.js` existiert)

- [ ] **Task 4: MapLibreCanvas-Komponente** (AC: #3)
  - [ ] 4.1 `src/lib/components/atlas/map-libre-canvas.svelte`:
    - `$props()`: `initialBbox`, `initialZoom`, `style`, `onMoveEnd`, `onClick`, `onLoad`
    - `$state` für `map` (Map-Instance), `isReady`, `loadError`
    - `$effect` mit Dynamic-Import:
      ```typescript
      $effect(() => {
        if (!container) return;
        let cancelled = false;
        (async () => {
          const { default: maplibregl } = await import('maplibre-gl');
          await import('maplibre-gl/dist/maplibre-gl.css');
          if (cancelled) return;
          map = new maplibregl.Map({
            container,
            style: style ?? '/map-style.json',
            bounds: initialBbox ?? BERLIN_BBOX,
            attributionControl: { compact: true }
          });
          map.on('load', () => { isReady = true; onLoad?.(map); });
          map.on('moveend', e => onMoveEnd?.(serializeViewport(map)));
          map.on('click', e => onClick?.([e.lngLat.lng, e.lngLat.lat]));
        })();
        return () => { cancelled = true; map?.remove(); };
      });
      ```
  - [ ] 4.2 Skeleton-Fallback während Lazy-Load (Bits-UI Skeleton aus Story 1.2)
  - [ ] 4.3 Error-Snippet für 5s-Timeout-Fallback (UX-DR36)
  - [ ] 4.4 ARIA: `<div bind:this={container} role="application" aria-describedby="map-help" tabindex="0" />`
  - [ ] 4.5 File <500 Zeilen — bei Bedarf Helpers in `internal/map-helpers.ts`

- [ ] **Task 5: Adress-Sicht-Route mit Karte** (AC: #4)
  - [ ] 5.1 `src/routes/(with-header)/[lang=lang]/+page.svelte` erstellen (Adress-Sicht — wird in 1.7 mit URL-State-Sync vervollständigt; Story 1.6 nur Karten-Render)
  - [ ] 5.2 Layout:
    - SiteHeader (aus Story 1.5)
    - Main-Content: Karte (volle Breite, ~70vh) + InspectorPanel-Placeholder (Story 1.9 füllt)
    - MetaFooter (aus Story 1.2)
  - [ ] 5.3 Karten-Default-Viewport (BERLIN_BBOX-Konstante aus `$lib/data/constants.ts` — zentralisieren aus Story 1.4/1.5)
  - [ ] 5.4 Smoke: `pnpm dev` → `http://localhost:5173/de/` zeigt Header + Karte + Footer

- [ ] **Task 6: Style-Side-by-Side-Showcase** (AC: #5)
  - [ ] 6.1 `src/routes/_dev/map-style/+page.svelte`:
    - Zwei MapLibreCanvas nebeneinander
    - Links: Plex-Style (`/map-style.json`)
    - Rechts: OpenFreeMap-Liberty (`${PUBLIC_TILE_URL}/styles/liberty/style.json`)
    - Synced via gemeinsamen Viewport-State (`$state` shared)
  - [ ] 6.2 `+page.ts` `export const prerender = false`
  - [ ] 6.3 Decision-Notiz in `docs/adr/ADR-001-tile-provider.md` ergänzen mit Visual-Comparison-Hinweis

- [ ] **Task 7: Tile-Provider-Switch-Runbook** (AC: #6)
  - [ ] 7.1 `docs/runbooks/tile-provider-switch.md` erstellen
  - [ ] 7.2 Inhalt aus Dev-Note „Runbook-Inhalt"
  - [ ] 7.3 Trigger-Conditions, Steps, Verification, Rollback dokumentiert

- [ ] **Task 8: ADR-001 + ADR-NNN-map-style** (AC: #5, #7)
  - [ ] 8.1 `docs/adr/ADR-001-tile-provider.md` — Status `Proposed` → `Accepted`:
    - Decision: OpenFreeMap Default Phase 1, Protomaps Hedge
    - Consequences: Public-API-Dependency, Switch-Cost gering via Env-Var
    - CSP-Implikationen (AC-7-Inhalt eingebettet)
  - [ ] 8.2 Optional `docs/adr/ADR-NNN-plex-cartography.md` falls eigener ADR sinnvoll — Empfehlung: in ADR-001 integrieren, kein zusätzlicher ADR-Sprawl

- [ ] **Task 9: A11y-Hooks-Foundation** (AC: #8)
  - [ ] 9.1 `+layout.svelte` ODER `map-libre-canvas.svelte` ergänzen:
    - `<p id="map-help" class="sr-only">…Steuerungs-Anleitung…</p>`
    - `<div aria-live="polite" id="map-status" class="sr-only"></div>`
  - [ ] 9.2 `tabindex="0"` auf Map-Container für Tastatur-Fokus
  - [ ] 9.3 Klare TODO-Annotation: „Volle A11y-Mechanik in Story 1.7 (Karten-Interaktion) + 1.8 (Karten-Accessibility-Layer)"

- [ ] **Task 10: Smoke + Performance + Tests** (AC: #9)
  - [ ] 10.1 `pnpm build` → Bundle-Size-Check manuell: `du -sh build/_app/immutable/chunks/*.js` (maplibre-* sollte separat, main-Bundle <200KB)
  - [ ] 10.2 `pnpm dev` → Browser-Network-Tab: maplibre-gl als async-loaded Chunk
  - [ ] 10.3 Konsolen-Check: 0 MapLibre-Style-Errors (häufige: fehlender Fontstack, fehlende Source-Tile-URL, fehlende Layer)
  - [ ] 10.4 Lighthouse-Run gegen `/de/` (Adress-Sicht): Performance-Score notieren in ADR
  - [ ] 10.5 Unit-Test `src/lib/components/atlas/map-libre-canvas.test.ts` — Smoke-Render (jsdom kann Canvas nicht, daher minimal: Komponente mountet ohne Throw)
  - [ ] 10.6 E2E `tests/e2e/map-render.spec.ts` — Playwright: Karte sichtbar auf `/de/`, Background-Farbe Cloud Dancer
  - [ ] 10.7 Commit: `feat(map): plex cartography style + glyph pack + maplibre canvas lazy-load (story 1.6)`

## Dev Notes

### Glyph-Build-Pipeline (`scripts/build-glyphs.ts`)

Fontnik-API-Pattern:

```typescript
import fontnik from 'fontnik';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

interface FontstackConfig {
  name: string;          // MapLibre fontstack id, e.g. "Plex Sans Regular"
  fontFile: string;      // Path to woff2/otf/ttf in static/fonts/
  subset: 'latin' | 'latin-ext' | 'cyrillic' | 'arabic';
}

const FONTSTACKS: FontstackConfig[] = [
  { name: 'Plex Sans Regular', fontFile: 'static/fonts/plex-sans-latin-var.woff2', subset: 'latin' },
  { name: 'Plex Sans Regular', fontFile: 'static/fonts/plex-sans-latin-ext-var.woff2', subset: 'latin-ext' },
  { name: 'Plex Sans Regular', fontFile: 'static/fonts/plex-sans-cyrillic-var.woff2', subset: 'cyrillic' },
  { name: 'Plex Sans Arabic Regular', fontFile: 'static/fonts/plex-sans-arabic-400.woff2', subset: 'arabic' },
  { name: 'Plex Sans Arabic SemiBold', fontFile: 'static/fonts/plex-sans-arabic-600.woff2', subset: 'arabic' },
  // Plex Serif Italic für Annotationen (Phase 2 optional, Phase 1 weglassen)
];

const RANGES = Array.from({ length: 256 }, (_, i) => ({ start: i * 256, end: i * 256 + 255 }));

for (const fs of FONTSTACKS) {
  const buf = await readFile(fs.fontFile);
  const dir = path.join('static/glyphs', fs.name);
  await mkdir(dir, { recursive: true });
  for (const range of RANGES) {
    if (!shouldIncludeRange(fs.subset, range)) continue;  // skip out-of-subset ranges
    const pbf = await new Promise<Buffer>((resolve, reject) => {
      fontnik.range({ font: buf, start: range.start, end: range.end }, (err, res) => err ? reject(err) : resolve(res));
    });
    await writeFile(path.join(dir, `${range.start}-${range.end}.pbf`), pbf);
  }
}
```

**Variable-Font-Subset-Issue:** Fontnik bevorzugt statische Fonts. Variable-Fonts (woff2-Variable) müssen ggf. vorher auf konkretes Weight reduziert werden via `pyftsubset` oder `fonttools instancer`. **Fallback Plan B:** wenn fontnik-Variable nicht funktioniert: Pre-Instanced Fonts aus Fontsource (`@fontsource/ibm-plex-sans` static Regular 400 + Medium 500) für Glyph-Build laden. Variable bleibt für CSS-Render.

**Fontstack-Liste für Map-Style:**

| Fontstack | Verwendung |
|---|---|
| `Plex Sans Regular` | Default-Beschriftung (place, street) |
| `Plex Sans Medium` | Hervorgehoben (city, country) — falls Phase 1 nötig |
| `Plex Sans Arabic Regular` | Conditional bei `locale === 'ar'` |
| `Plex Sans Arabic SemiBold` | Conditional Bold |

Glyph-Build-Time: erwartet 30–60s einmalig. Re-Build nur bei Plex-Font-Update.

### Style-JSON-Skeleton (`static/map-style.json`)

Auszug für Plex-Cartography (vollständige Datei beim Implement aus UX-Spec + Recherche-Source `_user-input/berlin-atlas-recherche.md` ableiten):

```json
{
  "version": 8,
  "name": "navigator-berlin-plex",
  "metadata": { "description": "Plex Cartography Style für navigator.berlin" },
  "glyphs": "/glyphs/{fontstack}/{range}.pbf",
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "url": "https://tiles.openfreemap.org/data/v3.json"
    }
  },
  "sprite": "",
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": { "background-color": "#ECEAE0" }
    },
    {
      "id": "landuse_park",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "landuse",
      "filter": ["==", "class", "park"],
      "paint": { "fill-color": "#E5E3D5", "fill-opacity": 0.6 }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "water",
      "paint": { "fill-color": "#D6DBE0", "fill-opacity": 0.8 }
    },
    {
      "id": "road_minor",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["in", "class", "minor", "service", "residential"],
      "paint": { "line-color": "#C8C6BB", "line-width": 0.4 }
    },
    {
      "id": "road_primary",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["in", "class", "primary", "secondary"],
      "paint": { "line-color": "#989488", "line-width": 0.8 }
    },
    {
      "id": "boundary_district",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "boundary",
      "filter": ["==", "admin_level", 4],
      "paint": { "line-color": "#989488", "line-width": 0.6, "line-dasharray": [3, 2] }
    },
    {
      "id": "place_city",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": ["==", "class", "city"],
      "layout": {
        "text-field": ["get", "name:latin"],
        "text-font": ["Plex Sans Regular"],
        "text-size": 14
      },
      "paint": {
        "text-color": "#141414",
        "text-halo-color": "#ECEAE0",
        "text-halo-width": 1
      }
    }
  ]
}
```

**Iteration:** Style wird in Story 1.6 als „good enough"-Baseline angelegt. Feinschliff (Building-Color, Park-Subtypes, Water-Names) erfolgt in Story 1.7 oder als kontinuierlicher Verbesserungsprozess via `static/map-style.json`-Edits.

**Locale-spezifische `text-field`:**
- DE: `["get", "name:de"]` mit Fallback `["get", "name:latin"]`
- AR: `["get", "name:ar"]` mit Fallback `["get", "name:latin"]`
- Conditional Style-Loading in Story 3.4 (RTL-Support) — Phase 1 hier nutzt Latin-Default

### Runbook-Inhalt (`docs/runbooks/tile-provider-switch.md`)

```markdown
# Runbook: Tile-Provider-Switch (OpenFreeMap → Protomaps)

## Trigger
- OpenFreeMap >15 min nicht erreichbar (Tile-Requests timeout)
- Performance-Issue (>2s pro Tile im 90.-Perzentil)
- Lizenz- oder Politik-Änderung

## Switch-Procedure
1. **Env-Var ändern (Hetzner/Coolify):**
   - In Coolify-UI → App → Env-Vars: `PUBLIC_TILE_URL=https://api.protomaps.com/v3` (echter Protomaps-Endpoint)
   - Falls Protomaps-API-Key nötig: `PUBLIC_TILE_API_KEY` ergänzen
2. **`static/map-style.json` anpassen** (PR im Repo):
   - `sources.openmaptiles.url` von OpenMapTiles-Format auf Protomaps-PMTiles-Format umstellen
   - Layer-`source-layer`-Namen prüfen (PMTiles-Schema weicht ab)
3. **Deploy:**
   - `git push` → Coolify-Webhook auto-deployed
   - Build dauert ~5 min
4. **Verification:**
   - `curl https://navigator.berlin/api/healthz` → 200
   - Visual-Check: `https://navigator.berlin/de/` zeigt Karte korrekt
   - Konsolen-Check: 0 Tile-404
5. **Rollback (bei Issue):**
   - Env-Var revertieren auf `PUBLIC_TILE_URL=https://tiles.openfreemap.org`
   - `git revert HEAD` falls Style-Anpassung problematisch

## Cost-Hinweis
- OpenFreeMap: kostenlos, Public-Instance
- Protomaps: 1M Tiles/Monat free, danach ~$0.20/1M
- Phase-2-Plan: Protomaps self-hosted via PMTiles-File falls Public-Quota knapp

## Maintainer-Notes
- Letzter Switch-Test: TBD (in Story 1.6 einmalig)
- Falls beide Provider down: Static-Fallback-Tile-Server in `static/tiles-fallback/` (Phase-3-Option)
```

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — N/A in 1.6 (keine Icons direkt)
- #2 Files <500 Zeilen — `map-style.json` und `map-libre-canvas.svelte` Risk; splitten falls nötig
- #7 TypeScript strict — MapLibre-Types via `maplibre-gl/dist/maplibre-gl.d.ts`
- #11 Kein US-Drittanbieter — OpenFreeMap (EU/Public), Protomaps (US-Origin, aber Public-API; Allowlist-Eintrag Story 4.3)
- #15 `$state.raw` für große Objekte — MapLibre-Map-Instance ist große Object, in `$state` aber selten reassigned → OK ohne `.raw`
- #20 `await`-Expression + `<svelte:boundary>` — Dynamic-Import-Pattern, OK in `$effect`

### Library/Framework Requirements

**Bereits installiert (Story 1.1):**
- `maplibre-gl` — Runtime, Lazy-Loaded
- `fontnik` (dev) — Glyph-Pack-Build

**Neu in Story 1.6:**
- `@maplibre/maplibre-gl-style-spec` (dev) — Style-Validation: `pnpm add -D @maplibre/maplibre-gl-style-spec`
- `tsx` falls noch nicht: bereits in Story 1.3 ergänzt

**Env-Vars neu:**
- `PUBLIC_TILE_URL` (Default `https://tiles.openfreemap.org`) in `$env/static/public` (PUBLIC_ Prefix für Client-Exposure)
- `PUBLIC_TILE_API_KEY` (optional, nur bei Protomaps-Switch)

### Testing Requirements

**Unit-Tests:**
- `src/lib/components/atlas/map-libre-canvas.test.ts` — Smoke (Komponente mountet ohne Throw, JSDOM kann Canvas-Render nicht)

**E2E-Tests:**
- `tests/e2e/map-render.spec.ts` — Playwright (Browser-Render):
  - `/de/` zeigt `<div role="application">`
  - Background-Pixel-Check (Cloud Dancer)
  - Konsolen-Errors: 0

**Manuelle Tests:**
- Bundle-Size-Inspect nach `pnpm build`
- Lighthouse gegen Adress-Sicht
- Side-by-Side Map-Style-Vergleich auf `/_dev/map-style/`

### File-Structure-Requirements (Diff zu Story 1.5)

**Neu in Story 1.6:**
```
./
├── scripts/
│   └── build-glyphs.ts                       # Fontnik-Glyph-Pack-Build
├── src/
│   ├── lib/
│   │   ├── data/
│   │   │   └── constants.ts                  # BERLIN_BBOX, DEFAULT_VIEWPORT (zentralisiert)
│   │   └── components/
│   │       └── atlas/
│   │           ├── map-libre-canvas.svelte
│   │           ├── map-libre-canvas.test.ts
│   │           └── internal/
│   │               └── map-helpers.ts        # serializeViewport, etc.
│   └── routes/
│       ├── (with-header)/
│       │   └── [lang=lang]/
│       │       └── +page.svelte              # Adress-Sicht mit Karte
│       └── _dev/
│           └── map-style/
│               ├── +page.svelte              # Side-by-Side-Vergleich
│               └── +page.ts                  # prerender = false
├── static/
│   ├── map-style.json                        # Plex-Cartography
│   └── glyphs/                                # Fontnik-Output
│       ├── Plex Sans Regular/
│       │   ├── 0-255.pbf                      # latin range 0
│       │   ├── 256-511.pbf                    # latin range 1
│       │   └── ...
│       ├── Plex Sans Arabic Regular/
│       │   └── ...
│       └── Plex Sans Arabic SemiBold/
├── docs/
│   ├── adr/
│   │   └── ADR-001-tile-provider.md          # Status → Accepted
│   └── runbooks/
│       └── tile-provider-switch.md
├── tests/
│   └── e2e/
│       └── map-render.spec.ts
├── vite.config.ts                             # manualChunks ergänzt
└── .env.example                               # PUBLIC_TILE_URL ergänzt
```

### Previous Story Intelligence

- **Story 1.2:** Plex Variable Fonts + Sans Arabic Static in `static/fonts/`, Cloud Dancer Token + `--accent`-Hex-Werte für Style-JSON
- **Story 1.3:** `MANIFEST.json` enthält Layer-Zoom-Schwellen — Map-Style Layer-Visibility kann darauf basierend gefiltert werden (Story 1.7 macht das vollständig mit Bbox-Sync)
- **Story 1.4:** `BERLIN_BBOX`-Konstante existiert in `get-layers-at-point.ts` ODER `get-climate-station.ts`. Story 1.6 zentralisiert in `$lib/data/constants.ts`
- **Story 1.5:** `(with-header)/`-Group-Layout, `SiteHeader`-Komponente, AddressSearch — Story 1.6 ergänzt Karte unter Header

### Git Intelligence

- Glyph-Pack committed im Repo (~5–30 MB) — kein LFS Phase 1
- `static/map-style.json` als Source-of-Truth — Edit + Commit triggert Re-Deploy
- `_dev/map-style/`-Route bleibt committed als Reference

### Latest Tech Information (Mai 2026)

- **MapLibre GL JS v4.x:** Stabil, native Map-API, kein React/Svelte-Wrapper benötigt (Architecture-Doc nennt `svelte-maplibre-gl` als optional — Empfehlung Story 1.6: Vanilla MapLibre + eigener Svelte-Wrapper, da Lazy-Load + Lifecycle besser kontrollierbar). `svelte-maplibre-gl` kann später hinzugefügt werden wenn deklarative Layer-Komposition gebraucht wird.
- **Fontnik:** stable, Variable-Font-Support limitiert — Pre-Instance-Workaround dokumentiert
- **OpenFreeMap:** Public-Instance Mai 2026 verfügbar, OpenMapTiles-Schema kompatibel
- **Protomaps:** Hedge, PMTiles-Format unterscheidet sich von OpenMapTiles — Style-Anpassung bei Switch nötig

### Project Structure Notes

- **`svelte-maplibre-gl` vs. Vanilla:** Architecture-Doc nennt beides. Story 1.6 nutzt **Vanilla MapLibre** wegen besserer Lazy-Load-Kontrolle. Reasoning: deklaratives Wrapping bringt zusätzliche Bundle-Größe + Lifecycle-Komplexität. Wenn deklarative Layer-Composition gebraucht wird (Story 1.9 Inspector-Panel): re-evaluieren
- **`static/glyphs/`-Größe:** Plex Sans Regular allein hat ~256 Ranges × 5–50 KB = 1–13 MB. Bei 5 Fontstacks: 5–65 MB. Falls >20 MB: Glyph-Pack-LFS evaluieren (ADR-NNN), aber Phase-1-Default ohne LFS
- **Map-Style-JSON-Größe:** vollständiger Plex-Style ~1000–2000 Zeilen → splitten in Layer-Groups falls Wartbarkeit leidet (Phase 2)

### Open Questions (für End-of-Story)

1. **Fontnik + Variable-Fonts:** Untested Mai 2026. Falls Direct-Variable-Build scheitert: Static-Plex von `@fontsource/ibm-plex-sans` Weight 400/500 verwenden (zusätzlich installieren, NICHT als Page-Font). Decision-Outcome dokumentieren
2. **OpenFreeMap vs. Protomaps Default:** Architecture-Doc nennt OpenFreeMap default. Falls OpenFreeMap-Tile-Performance Mai 2026 schlecht: Protomaps direkt als Default. Side-by-Side-Test in Task 6 entscheidet
3. **Sprite-Layer Phase 1:** Empfehlung leer. POI-Marker werden als HTML-Marker (`maplibregl.Marker`) gerendert, NICHT als Sprite — bessere A11y-Integration mit DOM
4. **Tile-CDN-Geo:** OpenFreeMap-Tiles werden via Fastly (US-CDN-Anbieter mit EU-Edge-Nodes) serviert? Falls strict EU-only: Tile-Provider-Wahl re-evaluieren oder eigene PMTiles selbst hosten (Phase 2)
5. **Bundle-Size-Reality-Check:** MapLibre v4 Standalone ~200 KB minified + gzipped ~70 KB. PLUS Style + Glyph-Initial-Load ~50–100 KB. Karten-Page realistisch ~270 KB Initial — NFR-P5 (200 KB) gilt für Main-Bundle ohne Async-Chunks. Verify dass MapLibre als Chunk getrennt wird

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6: MapLibre Plex-Cartography mit Glyph-Pack] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Performance-Optimierung] (Lazy-Load-Pattern, manualChunks-Snippet)
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] (OpenFreeMap, Protomaps Endpoints)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow (Build-Time)] (Glyph-Pack-Build-Step)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR15 PlexMap, UX-DR44 Plex-Cartography, UX-DR47 Karten-A11y)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR7–FR13, NFR-P5, NFR-P9, NFR-IL3, NFR-R6)
- [Source: _user-input/berlin-atlas-recherche.md] (Original-Recherche Plex-Cartography-Style — falls dort Style-JSON-Vorlagen)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (Plex-Fonts in static/fonts/, Token-Hex)
- [Source: _bmad-output/implementation-artifacts/1-5-adress-suche-mit-geocoding-proxy.md] (Group-Layout, SiteHeader, AddressSearch)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Confirmed Decisions

1. **MapLibre-Integration:** Vanilla MapLibre + eigener Svelte-Wrapper (NICHT `svelte-maplibre-gl`). Lazy-Load via Dynamic-Import in `$effect`. Reevaluate bei Story 1.9 für deklarative Inspector-Layer
2. **Tile-Provider:** OpenFreeMap Default Phase 1, Protomaps Hedge. Env-Var-Switch via `PUBLIC_TILE_URL`. Runbook in `docs/runbooks/tile-provider-switch.md`
3. **Glyph-Pack-Build:** Fontnik via `scripts/build-glyphs.ts`, einmalig ausgeführt, Output committed. Re-Build nur bei Plex-Font-Update
4. **Story-Scope:** NUR Karten-Render + Style + Lazy-Load + ARIA-Hooks. **Karten-Interaktion (Pan/Zoom-Buttons, Tastatur, URL-Sync, Click-Handling) AUS Scope — Story 1.7. Karten-A11y-Layer (DOM-POI-Liste) AUS Scope — Story 1.8**
5. **Style-Iteration:** „Good enough"-Baseline in 1.6, kontinuierliche Verbesserung in späteren Stories
6. **Sprites:** Phase 1 leer. POI-Marker als HTML `maplibregl.Marker` in Story 1.9
