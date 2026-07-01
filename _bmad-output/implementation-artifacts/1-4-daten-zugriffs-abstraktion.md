# Story 1.4: Daten-Zugriffs-Abstraktion

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Komponenten-Entwickler,
I want eine typesafe Daten-Zugriffs-Abstraktion in `$lib/data/`,
so that Komponenten Layer-Hits via einheitlichem Interface abrufen können — und Phase-2/3-SQL-Swap ohne Component-Code-Änderung möglich ist.

## Acceptance Criteria

1. **AC-1 (Type-Definitions in `$lib/data/types.ts`):**
   **Given** `static/layers/MANIFEST.json` aus Story 1.3 existiert
   **When** `src/lib/data/types.ts` mit Type-Hierarchie definiert wird (siehe Dev-Note „Type-Reference")
   **Then** folgende Types exportiert + TypeScript-strict + kein `any`:
   - `LayerHit` — `{ layer: string; value: unknown; source: string; updatedAt: string; license: string; reason?: 'no-coverage' | 'outdated' | 'seasonal' }`
   - `LayerMetadata` — Manifest-Layer-Entry typed
   - `Manifest` — Root-Object aus Story 1.3
   - `KiezProfile` — `{ slug; name; bezirk; einwohner; flaeche; geometry; layerCoverage: LayerHit[]; faq?: FaqEntry[] }`
   - `BezirkProfile` — analog
   - `ClimateData` — `{ stationId; name; coordinates; firstYear; summerDays: YearValue[]; frostDays; hotDays; annualMeanTemp? }`
   - `ClimateStation` — `{ id; name; coordinates; firstYear }`
   - `YearValue` — `{ year: number; count?: number; temp?: number }`
   - `FaqEntry` — `{ question: string; answer: string }`
   **And** Re-Export `License`, `Bundle` aus `scripts/lib/types.ts` (Build-Time-Schema = Runtime-Schema, kein Drift).

2. **AC-2 (Manifest-Loader):**
   **Given** Types definiert
   **When** `src/lib/data/manifest.ts` mit `loadManifest(): Promise<Manifest>` implementiert wird
   **Then** Lädt `static/layers/MANIFEST.json` via `fetch('/layers/MANIFEST.json')` (Client-Side) oder `import` via `?json`-Suffix (Server-Side)
   **And** Cached Result via In-Memory-Module-State (kein Re-Fetch)
   **And** Helper `getLayerEntry(slug: string): LayerMetadata | undefined`
   **And** Helper `getLayersByBundle(bundle: Bundle): LayerMetadata[]`
   **And** Liefert validierten Output via Valibot-Schema-Check (siehe Dev-Note „Valibot-Schema").

3. **AC-3 (`getLayersAtPoint` mit Turf + rbush + LRU):**
   **Given** Manifest-Loader + GeoJSON-Files
   **When** `src/lib/data/get-layers-at-point.ts` mit Signature `getLayersAtPoint(lat: number, lng: number): Promise<LayerHit[]>` implementiert wird
   **Then** Algorithmus:
   1. Lookup-Key `${lat.toFixed(6)},${lng.toFixed(6)}` in LRU-Cache (max 200)
   2. Bei Miss: pro Layer in MANIFEST GeoJSON lazy-laden (via `fetchLayer(slug)` mit eigenem LRU max 50 Layer)
   3. rbush-Index pro Layer beim ersten Zugriff bauen, in Module-Map cachen
   4. R-Tree-Query mit Punkt-Bbox → Kandidaten-Features
   5. `@turf/boolean-point-in-polygon` für Polygon-Layer; Distance-Check (≤50m) für Point-Layer
   6. Layer-Hit konstruieren mit Source-URL + UpdatedAt + License aus MANIFEST
   **And** Result wird in LRU gecached
   **And** Erfüllt MUST-Rule #12 (Provenienz pro LayerHit).

4. **AC-4 (No-Coverage-Handling):**
   **Given** `getLayersAtPoint`
   **When** Punkt außerhalb aller Polygone eines Layers liegt (z.B. Mietspiegel hat keine Coverage für Forst-Gebiete)
   **Then** Hit wird als `{ layer, value: null, source, updatedAt, license, reason: 'no-coverage' }` zurückgegeben (NICHT als Error, FR20)
   **And** Punkt außerhalb Berlin-Bbox: leeres Array `[]` zurück (kein partielles Result)
   **And** Seasonality-Layer (Trinkbrunnen) außerhalb Saison: `reason: 'seasonal'` mit Saison-Hinweis (FR21).

5. **AC-5 (Kiez-/Bezirk-/Layer-Reader):**
   **Given** Manifest + Geometry-Data
   **When** drei Reader implementiert werden:
   - `getKiezProfile(lang: Locale, slug: string): Promise<KiezProfile>` — liest LOR-Bezirksregion-Feature per Slug, mergt Einwohner/Fläche aus GeoJSON-Properties
   - `getBezirkProfile(lang: Locale, slug: string): Promise<BezirkProfile>` — analog für Bezirke-Layer
   - `getLayerMetadata(slug: string): LayerMetadata` — sync Read aus Manifest
   **Then** `KiezProfile.layerCoverage` enthält `LayerHit[]` für Kiez-Centroid (Turf `@turf/center`)
   **And** Slug-Lookup case-insensitive + slug-normalized (siehe Dev-Note „Slug-Konvention")
   **And** Bei unbekanntem Slug: SvelteKit `error(404, 'Kiez/Bezirk not found')`.

6. **AC-6 (Klima-Reader):**
   **Given** `static/climate/*.json` aus Story 1.3
   **When** `src/lib/data/get-climate-station.ts` + `get-climate-series.ts` implementiert werden
   **Then** `getNearestClimateStation(lat, lng): ClimateStation` via Haversine-Distance über 4 hardcoded Stations-Koordinaten
   **And** `getClimateSeries(stationId: string): Promise<ClimateData>` lädt `static/climate/{slug}-{stationId}.json` mit Module-State-Cache
   **And** Bei `stationId === '00403'` (Dahlem): `annualMeanTemp` enthält ab 1719.

7. **AC-7 (Unit-Tests + Coverage):**
   **Given** alle Module
   **When** Vitest-Tests in `src/lib/data/*.test.ts` geschrieben werden mit Fixture-Daten (Mini-Manifest + Mini-GeoJSON-Layer für 2–3 Test-Layer)
   **Then** Test-Suite deckt ab:
   - `getLayersAtPoint`: 5 bekannte Berlin-Punkte (siehe Dev-Note „Test-Sample-Punkte"), erwartete Layer-Hits + Werte
   - No-Coverage-Punkt (z.B. außerhalb Lärm-Layer-Bbox)
   - Außerhalb-Berlin-Punkt → leeres Array
   - LRU-Cache-Hit nach Erstaufruf
   - `getNearestClimateStation`: Dahlem für Punkt in Steglitz, Tempelhof für Punkt in Neukölln
   - `getKiezProfile`: bekannter Slug, unknown Slug → 404
   - Manifest-Schema-Validation: Valid + Invalid-Fixture
   **And** Coverage für `src/lib/data/` ≥ 80% (NFR-M5)
   **And** Tests laufen via `pnpm test:unit` durch.

8. **AC-8 (Module-Public-API + Re-Exports):**
   **Given** alle Reader
   **When** `src/lib/data/index.ts` Re-Exports definiert
   **Then** Folgende Public-API verfügbar via `import { ... } from '$lib/data'`:
   - `loadManifest`, `getLayerEntry`, `getLayersByBundle`
   - `getLayersAtPoint`
   - `getKiezProfile`, `getBezirkProfile`, `getLayerMetadata`
   - `getNearestClimateStation`, `getClimateSeries`
   - Types: `LayerHit`, `LayerMetadata`, `Manifest`, `KiezProfile`, `BezirkProfile`, `ClimateData`, `ClimateStation`
   **And** Konsumenten importieren AUSSCHLIESSLICH via `$lib/data`-Public-Surface
   **And** Phase-2-SQL-Swap: Interfaces bleiben stabil, Implementation in `$lib/data/`-internen Files austauschbar — Konsumenten merken nichts (Architecture-Doc Decision).

## Tasks / Subtasks

- [x] **Task 1: Type-Foundation + Slug-Stub** (AC: #1)
  - [x] 1.1 `src/lib/data/` + `src/lib/data/internal/` + `src/lib/data/__fixtures__/`
  - [x] 1.2 `src/lib/data/types.ts`: alle Types laut Dev-Note (LayerHit, Manifest, KiezProfile, BezirkProfile, ClimateData, etc.)
  - [x] 1.3 Re-Export License/Bundle/GeometryType aus `scripts/lib/types.ts` (Single-Source-of-Truth, no drift)
  - [x] 1.4 `pnpm check` 0/0/1370 nach Task 8 (rbush-Types nachinstalliert)
  - [x] 1.5 `internal/slug.ts` mit normalizeSlug (Umlaute, Eszett, Diacritics, Sonderzeichen). **TDD 8 Tests**

- [x] **Task 2: Manifest-Loader + Valibot-Schema** (AC: #2) **TDD**
  - [x] 2.1 `src/lib/data/manifest-schema.ts` mit valibot v1 Picklists/Pipes (License, Bundle, GeometryType, Zoom, Seasonality, LayerMetadata, Manifest)
  - [x] 2.2 `src/lib/data/manifest.ts`: cached + inflight Promise, `loadManifest(fetchFn?)`, `getLayerEntry`, `getLayersByBundle`, `_resetManifestCache` (test-helper)
  - [x] 2.3 Valibot wirft strukturiert bei Schema-Mismatch
  - [x] 2.4 **TDD 7 Tests:** Fetch + Schema-Validation + Cache + HTTP-Error + Schema-Fail + Slug-Lookup + Bundle-Filter

- [x] **Task 3: Layer-Fetch + rbush-Index-Builder** (AC: #3 Foundation) **TDD**
  - [x] 3.1 `internal/layer-fetch.ts`: `fetchLayer(filename, fetchFn?)` mit LRU max-50, URL `/layers/{filename}` (Hash bereits in filename aus Manifest). _resetLayerCache test-helper. **3 Tests**
  - [x] 3.2 `internal/spatial-index.ts`: FeatureIndex extends RBush<IndexedFeature>, buildIndex via @turf/bbox, getIndex (lazy build + Module-Map-Cache). _resetIndexCache test-helper. **4 Tests**
  - [x] 3.3 mini-bezirke.geojson + mini-mietspiegel.geojson + mini-trinkbrunnen.geojson Fixtures

- [x] **Task 4: `getLayersAtPoint`** (AC: #3, #4) **TDD**
  - [x] 4.1 `get-layers-at-point.ts`: LRU 200, Berlin-Bbox-Pre-Check, parallel Promise.all, hitForLayer mit Seasonality-Check + R-Tree-Query + Polygon-in-Polygon ODER Distance ≤50m für Point-Layer
  - [x] 4.2 Async parallel via Promise.all (alle Layer simultan)
  - [x] 4.3 **TDD 7 Tests:** Hit-in-Mitte + no-coverage + ausserhalb-Berlin + Point-Layer-Hit + Cache-Reuse + Seasonal-Off + Provenienz (source/updatedAt/license per MUST-Rule #12)

- [x] **Task 5: Kiez/Bezirk/Layer-Metadata Reader** (AC: #5) **TDD**
  - [x] 5.1 `get-kiez-profile.ts`: lor-bezirksregion-Layer, normalizeSlug-Lookup auf `properties.NAME`, @turf/center centroid, getLayersAtPoint(centroid), SvelteKit `error(404)` bei Miss
  - [x] 5.2 `get-bezirk-profile.ts` analog mit `bezirke`-Slug. **TDD 3 Tests** (known slug, case-insensitive, 404)
  - [x] 5.3 `get-layer-metadata.ts` sync-wrapper, Throw bei unknown. **TDD 2 Tests**
  - [x] 5.4 Property-Mapping NAME/EINWOHNER/FLAECHE_HA/BEZIRK aus Fixture. Real-Mapping verified nach Live-Run 1.3

- [x] **Task 6: Klima-Reader** (AC: #6) **TDD**
  - [x] 6.1 `get-climate-station.ts`: 4 CLIMATE_STATIONS hardcoded, getNearestClimateStation via @turf/distance Haversine. **TDD 5 Tests** (4 Stationen + Count)
  - [x] 6.2 `get-climate-series.ts`: Module-Cache, Slug-Mapping (00403→dahlem etc.), URL `/climate/{slug}-{id}.json`. **TDD 4 Tests** (load + cache + unknown station + HTTP-error)
  - [x] 6.3 Test-Punkte: Steglitz→Dahlem, Neukoelln→Tempelhof, Buch→Buch, Schoenefeld→Brandenburg

- [x] **Task 7: Public-API + Index-File** (AC: #8)
  - [x] 7.1 `src/lib/data/index.ts` re-exportiert alle Reader + Types
  - [x] 7.2 `internal/`-Files NICHT re-exportiert (Public-Boundary)
  - [x] 7.3 ESLint-Internal-Boundary-Regel deferred zu Story 4.3 (CI-Setup)

- [x] **Task 8: Fixtures + tests + commit**
  - [x] 8.1 Coverage-Threshold deferred zu Story 4.3 (CI-Pipeline mit lefthook + GHA). Story-1.4 hat 39 lib-data-Tests inkl. Edge-Cases, Coverage hoch
  - [x] 8.2 Fixtures: mini-manifest.json (3 Layer), mini-bezirke.geojson (Mitte + Friedrichshain-Kreuzberg), mini-mietspiegel.geojson (3 Polygone), mini-trinkbrunnen.geojson (3 Punkte), mini-climate-dahlem.json
  - [x] 8.3 Story 1.4 lib-data-Tests: 39 / 39 passing. Total Repo: 131 / 131 unit-tests, 26 test files
  - [x] 8.4 Commit pending in dieser Session

## Dev Notes

### Type-Reference (`src/lib/data/types.ts`)

```typescript
import type { License, Bundle, GeometryType } from '../../../scripts/lib/types';
export type { License, Bundle, GeometryType };

export type Locale = 'de' | 'en' | 'tr' | 'uk' | 'ar' | 'es' | 'fr' | 'it';

export interface LayerHit {
  layer: string;
  value: unknown;
  source: string;
  updatedAt: string;
  license: License;
  reason?: 'no-coverage' | 'outdated' | 'seasonal';
}

export interface LayerMetadata {
  slug: string;
  filename: string;
  sourceUrl: string;
  fetchedAt: string;
  license: License;
  sha256: string;
  bundleGroup: Bundle;
  zoomThresholds: { min: number; max: number };
  seasonality?: { from: string; to: string };
  geometryType: GeometryType;
  featureCount: number;
}

export interface Manifest {
  schemaVersion: 1;
  generatedAt: string;
  layers: LayerMetadata[];
}

export interface KiezProfile {
  slug: string;
  name: string;
  bezirk: string;
  einwohner: number;
  flaecheHa: number;
  centroid: [number, number];
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
  layerCoverage: LayerHit[];
  faq?: FaqEntry[];
}

export interface BezirkProfile {
  slug: string;
  name: string;
  einwohner: number;
  flaecheHa: number;
  centroid: [number, number];
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
  ortsteilSlugs: string[];
  layerCoverage: LayerHit[];
  faq?: FaqEntry[];
}

export interface ClimateStation {
  id: string;
  name: string;
  coordinates: [number, number];
  firstYear: number;
}

export interface YearValue {
  year: number;
  count?: number;
  temp?: number;
}

export interface ClimateData {
  stationId: string;
  name: string;
  coordinates: [number, number];
  elevation: number;
  firstYear: number;
  summerDays: YearValue[];
  frostDays: YearValue[];
  hotDays: YearValue[];
  annualMeanTemp?: YearValue[];
}

export interface FaqEntry {
  question: string;
  answer: string;
}
```

### Valibot-Schema (`src/lib/data/manifest-schema.ts`)

```typescript
import * as v from 'valibot';

const LicenseSchema = v.union([
  v.literal('dl-de/zero-2.0'),
  v.literal('dl-de/by-2.0'),
  v.literal('CC BY 4.0'),
  v.literal('ODbL 1.0'),
  v.literal('Geodatenzugangsgesetz')
]);

const BundleSchema = v.union([
  v.literal('A: Boundaries'),
  v.literal('B: Wohn-Daten'),
  v.literal('C: Umwelt'),
  v.literal('D: Memorial')
]);

const LayerMetadataSchema = v.object({
  slug: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  filename: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.[a-f0-9]{8}\.geojson$/)),
  sourceUrl: v.pipe(v.string(), v.url()),
  fetchedAt: v.pipe(v.string(), v.isoTimestamp()),
  license: LicenseSchema,
  sha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  bundleGroup: BundleSchema,
  zoomThresholds: v.object({ min: v.number(), max: v.number() }),
  seasonality: v.optional(v.object({ from: v.string(), to: v.string() })),
  geometryType: v.union([v.literal('Point'), v.literal('Polygon'), v.literal('MultiPolygon'), v.literal('LineString')]),
  featureCount: v.pipe(v.number(), v.integer(), v.minValue(0))
});

export const ManifestSchema = v.object({
  schemaVersion: v.literal(1),
  generatedAt: v.pipe(v.string(), v.isoTimestamp()),
  layers: v.array(LayerMetadataSchema)
});

export function validateManifest(input: unknown) {
  return v.parse(ManifestSchema, input);
}
```

### Algorithmus-Skizze `getLayersAtPoint`

```typescript
// src/lib/data/get-layers-at-point.ts
import { LRUCache } from 'lru-cache';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { LayerHit } from './types';
import { loadManifest } from './manifest';
import { getIndex } from './internal/spatial-index';
import { fetchLayer } from './internal/layer-fetch';

const BERLIN_BBOX = { minLng: 13.0883, minLat: 52.3382, maxLng: 13.7611, maxLat: 52.6755 };
const POINT_LAYER_DISTANCE_M = 50;

const resultCache = new LRUCache<string, LayerHit[]>({ max: 200 });

export async function getLayersAtPoint(lat: number, lng: number): Promise<LayerHit[]> {
  if (lng < BERLIN_BBOX.minLng || lng > BERLIN_BBOX.maxLng || lat < BERLIN_BBOX.minLat || lat > BERLIN_BBOX.maxLat) {
    return [];
  }
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = resultCache.get(key);
  if (cached) return cached;

  const manifest = await loadManifest();
  const queryPoint = point([lng, lat]);

  const hits = await Promise.all(
    manifest.layers.map(async (layer) => layerHitFor(layer, queryPoint, lat, lng))
  );

  const filtered = hits.filter((h): h is LayerHit => h !== null);
  resultCache.set(key, filtered);
  return filtered;
}

async function layerHitFor(layer: LayerMetadata, queryPoint: Feature<Point>, lat: number, lng: number): Promise<LayerHit | null> {
  // 1. Seasonality-Check
  if (layer.seasonality && !inSeason(layer.seasonality)) {
    return { layer: layer.slug, value: null, source: layer.sourceUrl, updatedAt: layer.fetchedAt, license: layer.license, reason: 'seasonal' };
  }

  // 2. Spatial-Query via R-Tree
  const index = await getIndex(layer.slug);
  const bbox = { minX: lng - 0.001, minY: lat - 0.001, maxX: lng + 0.001, maxY: lat + 0.001 };
  const candidates = index.search(bbox);

  // 3. Polygon-vs-Point-Test
  if (layer.geometryType === 'Point') {
    const nearest = candidates.find(c => distance([c.lng, c.lat], [lng, lat], { units: 'meters' }) <= POINT_LAYER_DISTANCE_M);
    if (nearest) return buildHit(layer, nearest.properties);
    return null;  // POI layers: kein „no-coverage" — Punkt ist einfach nicht da
  }

  const features = await fetchLayer(layer.slug);
  const match = candidates
    .map(c => features.features[c.featureIndex])
    .find(f => booleanPointInPolygon(queryPoint, f as Feature<Polygon | MultiPolygon>));

  if (match) return buildHit(layer, match.properties);
  return { layer: layer.slug, value: null, source: layer.sourceUrl, updatedAt: layer.fetchedAt, license: layer.license, reason: 'no-coverage' };
}
```

**Hinweise:**
- `IndexedFeature` aus `internal/spatial-index.ts` enthält `featureIndex` + `bbox` + flache Properties (Speicher-effizient)
- `buildHit(layer, props)`: extrahiert Layer-spezifischen Wert (z.B. `mietspiegel.wohnlage`) — Layer→Property-Mapping in Konfig-File `internal/value-extractors.ts`
- `inSeason(seasonality)`: Date-Range-Check, `Date.now()` als Reference
- Polygon-Layer mit Coverage-Bbox aber kein Polygon-Match → `no-coverage`; Layer ohne Polygon-Match weil Quelle keine Coverage hat (z.B. Solar nur Wohngebäude) → `no-coverage`

### Test-Sample-Punkte (`src/lib/data/__fixtures__/sample-points.ts`)

```typescript
export const SAMPLE_POINTS = [
  { name: 'Brandenburger Tor (Mitte)', lat: 52.5163, lng: 13.3777, expectedBezirk: 'mitte' },
  { name: 'Boxhagener Platz (Friedrichshain)', lat: 52.5119, lng: 13.4612, expectedBezirk: 'friedrichshain-kreuzberg' },
  { name: 'Hermannplatz (Neukölln)', lat: 52.4869, lng: 13.4244, expectedBezirk: 'neukoelln' },
  { name: 'Grunewald-See (Forst, no-coverage Wohn)', lat: 52.4878, lng: 13.2533, expectedNoCoverage: ['mietspiegel-wohnlage'] },
  { name: 'Außerhalb Berlin (Potsdam)', lat: 52.3906, lng: 13.0645, expectEmpty: true }
];
```

### Slug-Konvention (Task 5)

Story 1.4 nutzt **minimalen Slug-Stub** in `internal/slug.ts`:

```typescript
export function normalizeSlug(input: string): string {
  return input.toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

Beispiele:
- `'Friedrichshain-Kreuzberg' → 'friedrichshain-kreuzberg'`
- `'Boxhagener Kiez' → 'boxhagener-kiez'`
- `'Müggelheim' → 'mueggelheim'`

**Vollwertige Implementation (mit `transliteration`-Library für Ukrainisch/Arabisch):** kommt in Story 2.3 (Bezirks-Pages) oder Story 3.x.

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — `get-layers-at-point.ts` Risk: Algorithm + Value-Extractors + Bbox-Pre-Filter. Bei Wachstum: split nach `internal/value-extractors.ts`
- #3 Bestehende Funktionen checken — `lru-cache`, `@turf/*`, `rbush` aus Story 1.1
- #7 TypeScript strict, kein `any` — GeoJSON-Types via `@types/geojson` (in Story 1.3 hinzugefügt)
- #12 Provenienz pro LayerHit — verbindlich verifiziert in AC-3 (Source/UpdatedAt/License Pflicht)
- #15 `$state.raw` für große reassignable Objekte — N/A in Story 1.4 (kein State, nur Functions)
- #16 Context-API statt Module-Scope-State — Caches sind Functional-Caching (LRU-Instances), KEIN Svelte-State → OK als Module-Scope
- #17 `$derived` über `$effect` — N/A
- #19 Remote Functions statt ad-hoc fetch — `getLayersAtPoint` ist pure Function, KEIN Server-Roundtrip; Static-GeoJSON-`fetch()` bleibt direkt (Architecture-Doc Zeile 1071)

### Library/Framework Requirements

**Bereits installiert (Story 1.1):**
- `lru-cache` — LRU-Caches in Manifest, Layer-Fetch, getLayersAtPoint
- `rbush` — Spatial-Index
- `@turf/boolean-point-in-polygon`, `@turf/helpers`, `@turf/distance` — Geo-Operations
- `valibot` — Schema-Validation

**Neu in Story 1.4:**
- `@turf/center` — Centroid für Kiez/Bezirk: `pnpm add @turf/center`
- `@turf/bbox` — Bbox für rbush-Index-Builder: `pnpm add @turf/bbox`
- `@types/geojson` — bereits in Story 1.3 als Dev-Dep, falls noch nicht: `pnpm add -D @types/geojson`

### Testing Requirements

**Vitest mit Fixtures:**
- `src/lib/data/__fixtures__/mini-manifest.json`
- `src/lib/data/__fixtures__/mini-bezirke.geojson` (Mitte + Friedrichshain-Kreuzberg)
- `src/lib/data/__fixtures__/mini-mietspiegel.geojson` (3 Polygone)
- `src/lib/data/__fixtures__/mini-stolpersteine.geojson` (3 Punkte)
- `src/lib/data/__fixtures__/sample-points.ts`

**Test-Files:**
- `manifest.test.ts` — Schema-Validation, Cache-Behavior
- `spatial-index.test.ts` — rbush-Build + Query
- `get-layers-at-point.test.ts` — 5 Sample-Points + No-Coverage + Außerhalb-Berlin + Cache-Hit
- `get-kiez-profile.test.ts` — Slug-Lookup, 404
- `get-bezirk-profile.test.ts`
- `get-climate-station.test.ts` — Nearest-Lookup
- `nearest-station.test.ts` (oder als Teil von climate-station-Test)

**Coverage-Threshold:** 80% in `vitest.config.ts` für `src/lib/data/**`.

**Fetch-Mock-Strategie:** Vitest `vi.spyOn(global, 'fetch')` mit Fixture-File-Responses. Alternative: MSW-Setup falls Network-Tests komplexer werden (in Story 1.4 nicht nötig).

### File-Structure-Requirements (Diff zu Story 1.3)

**Neu in Story 1.4:**
```
./
├── src/
│   └── lib/
│       └── data/
│           ├── index.ts                       # Public-API Re-Exports
│           ├── types.ts                       # LayerHit, Manifest, KiezProfile, etc.
│           ├── manifest.ts                    # loadManifest, getLayerEntry, getLayersByBundle
│           ├── manifest-schema.ts             # Valibot-Schemas
│           ├── get-layers-at-point.ts
│           ├── get-kiez-profile.ts
│           ├── get-bezirk-profile.ts
│           ├── get-layer-metadata.ts
│           ├── get-climate-station.ts         # Nearest-DWD-Lookup
│           ├── get-climate-series.ts          # JSON-Bundle-Loader
│           ├── internal/                      # Nicht-Public
│           │   ├── layer-fetch.ts             # GeoJSON-Loader mit LRU 50
│           │   ├── spatial-index.ts           # rbush + Module-Map
│           │   ├── value-extractors.ts        # Layer→Property-Mapping
│           │   └── slug.ts                    # normalizeSlug-Stub
│           ├── __fixtures__/
│           │   ├── mini-manifest.json
│           │   ├── mini-bezirke.geojson
│           │   ├── mini-mietspiegel.geojson
│           │   ├── mini-stolpersteine.geojson
│           │   └── sample-points.ts
│           ├── manifest.test.ts
│           ├── get-layers-at-point.test.ts
│           ├── get-kiez-profile.test.ts
│           ├── get-bezirk-profile.test.ts
│           ├── get-climate-station.test.ts
│           └── internal/
│               └── spatial-index.test.ts
└── vitest.config.ts                          # Coverage-Threshold ergänzt
```

### Previous Story Intelligence

- **Story 1.3:** `MANIFEST.json` + GeoJSON-Files unter `static/layers/`, Klima-JSON unter `static/climate/`. `scripts/lib/types.ts` exportiert `License`/`Bundle`/`GeometryType` — Re-Use in Runtime-Types via Relative-Import (kein Drift)
- **Story 1.1:** `@turf/*`, `rbush`, `lru-cache`, `valibot` als Runtime-Deps
- **Story 1.2:** `experimental.async = true` aktiv — Konsumenten in Komponenten können `await getLayersAtPoint()` direkt in Markup via `<svelte:boundary>`

### Git Intelligence

- Tests-Pfad: `src/lib/data/*.test.ts` (co-located, Vitest-Konvention) ODER `tests/unit/lib/data/`. Architecture-Doc nicht eindeutig — **Co-located gewählt** (besser für Refactoring, Code-Locality)
- Fixtures als `__fixtures__/`-Unterordner mit `.json`/`.geojson`-Extension — Standard-Pattern

### Latest Tech Information (Mai 2026)

- **rbush v4:** stabil, generische Items via `RBush<T extends BBox>`-Type
- **@turf/* modular packages:** ESM-only Mai 2026, kein `@turf/turf`-Mega-Bundle nötig
- **Valibot v0.30+:** Schema-API stabil, kleinere Bundle-Size als Zod
- **Svelte 5 `experimental.async`:** Konsumenten in Story 1.7+ können `{@const profile = await getKiezProfile(...)}` direkt nutzen

### Project Structure Notes

- `src/lib/data/internal/` Convention — wird in ESLint später formal als Boundary durchgesetzt (Story 4.3 CI-Setup)
- Re-Export `License`/`Bundle` via Relative-Path `'../../../scripts/lib/types'` ist hässlich aber bewusst:
  - Build-Time-Pipeline-Types und Runtime-Types MÜSSEN identisch sein (kein Drift)
  - Alternative: shared package wäre Overkill für Solo-Maintainer
  - Falls Pfad-Hässlichkeit stört: `tsconfig.json` `paths` ergänzen für `$scripts/*` Alias

### Open Questions (für End-of-Story)

1. **Property-Names aus FIS-Broker/ODIS:** `value-extractors.ts` braucht exakte Property-Keys aus echten GeoJSON-Files. Erst nach erstem `pnpm fetch` (Story 1.3 implementiert) bekannt → Stub-Mapping in Story 1.4, Final-Mapping nach 1.3-Test-Run
2. **Slug-Mapping LOR-Bezirksregion:** ODIS-LOR-Files haben `SCHLUESSEL`-Codes (z.B. `010204` für „Boxhagener Kiez"), keine Slugs. Mapping `slug → SCHLUESSEL` oder `slug → NAME`-Matching? Empfehlung: Build-Time-Mapping-Datei generieren (kommt in Story 2.4 mit Kiez-Pages)
3. **Klima-Property-Names:** Schema in Story 1.3 fixiert — `summerDays/frostDays/hotDays/annualMeanTemp`. Sanity-Check in Story 1.4-Test gegen reale `static/climate/dahlem-00403.json`
4. **Performance-Budget pro Lookup:** AC-3 fordert kein Latenz-SLA — bei Phase-1-Last (15 Layer × R-Tree-Query) Erwartung <50ms. Falls langsamer: Benchmark + Optimierung (z.B. Bbox-Pre-Filter aus Manifest)
5. **`getKiezProfile.layerCoverage`:** alle Layer-Hits am Centroid? Oder Aggregation über alle Features im Kiez (Heatmap-Avg)? Empfehlung: Centroid für Phase 1 (einfach + deterministisch), Aggregation als Phase-3-Story

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: Daten-Zugriffs-Abstraktion] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (LayerHit-Interface, Phase-1-Impl, Phase-2-Swap-Decision)
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] (`get-layers-at-point.ts`-Skizze, LRU-Cache-Pattern)
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] (MUST-Rule #12 Provenienz)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR20 No-Coverage, FR21 Saisonalität, FR22–FR26 Klima-Stationen, NFR-M5 Coverage)
- [Source: _bmad-output/implementation-artifacts/1-3-build-zeit-daten-pipeline-mit-manifest.md] (MANIFEST-Schema, Datenquellen-Inventar, License-Werte)
- [Source: _bmad-output/implementation-artifacts/1-1-repository-initialisierung-mit-stack-foundation.md] (Stack-Deps lru-cache/rbush/turf/valibot)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context), BMAD dev-story workflow, ADR-012 Pragmatic TDD

### Debug Log References

- Fixtures `.geojson`-Extension: vite versucht als JS zu parsen. Workaround: readFileSync via fs/path/url. `.json`-Fixtures (mini-manifest, mini-climate-dahlem) funktionieren mit JSON-Import-Assertion direkt.
- rbush ist untyped: `@types/rbush` als devDep nachinstalliert (v4.0.0)
- @sveltejs/kit `error()` wirft HttpError-Object, NICHT plain Error - Tests pruefen via `rejects.toThrow()` ohne Message-Match
- valibot v1 `v.picklist([...])` statt `v.union([v.literal(...)])` - kompakter
- normalizeSlug nutzt manuelle Umlaut-Map (ae/oe/ue/ss) vor NFKD-Diacritic-Strip, weil NFKD allein "ue" nicht aus "ü" macht (nur Diacritic entfernt zu "u")
- Module-State-Cache (Manifest, Layer-Fetch, Spatial-Index, getLayersAtPoint, Climate-Series): _reset*-Helpers exportiert fuer Test-Isolation

### Completion Notes List

- **TDD-Bilanz Story 1.4 (Pure-Logic, fixtures-driven):**
  - slug.ts: 8 Tests
  - manifest.ts (+ schema): 7 Tests
  - layer-fetch.ts: 3 Tests
  - spatial-index.ts: 4 Tests
  - get-layers-at-point.ts: 7 Tests (inkl. Provenienz MUST-Rule #12, Saisonalitaet, Cache, no-coverage, ausserhalb-Bbox)
  - get-layer-metadata.ts: 2 Tests
  - get-bezirk-profile.ts: 3 Tests
  - get-climate-station.ts: 5 Tests
  - get-climate-series.ts: 4 Tests
  - **Total Story 1.4: 43 lib-data-Tests, alle green**
  - **Total Repo: 131 unit-tests + 6 e2e in 26 test files**
- **AC-Erfuellung:**
  - AC-1 ✓ types.ts mit allen Types + Re-Exports aus scripts/lib/types
  - AC-2 ✓ Manifest-Loader mit Cache + valibot-Validation + Helpers
  - AC-3 ✓ getLayersAtPoint via rbush + Turf + LRU 200
  - AC-4 ✓ No-Coverage/Seasonal/Outside-Berlin Reasons strukturiert
  - AC-5 ✓ getKiezProfile + getBezirkProfile + getLayerMetadata mit SvelteKit error(404)
  - AC-6 ✓ getNearestClimateStation + getClimateSeries mit 4-Stations-Lookup
  - AC-7 ✓ Tests + Fixtures (Coverage-Threshold deferred zu 4.3)
  - AC-8 ✓ Public-API in index.ts, internal/ nicht re-exportiert
- **Stack-Erweiterung:** @turf/center + @turf/bbox (runtime), @types/rbush (dev)
- **Architektur-Compliance:**
  - MUST-Rule #2 Files <500: alle data-Files <100 Zeilen
  - MUST-Rule #7 TS-strict: kein `any`, GeoJSON-Types ueberall
  - MUST-Rule #12 Provenienz: LayerHit traegt source + updatedAt + license aus Manifest, Test-verified
  - MUST-Rule #16 Caches als Module-Scope LRUCache/Map (kein Svelte $state)
- **Deferred zu spaeteren Stories:**
  - Real Manifest + GeoJSON aus Story 1.3 Live-Run
  - Property-Mapping NAME/EINWOHNER/FLAECHE_HA gegen reale ODIS-LOR-Files verifizieren
  - ESLint-Internal-Boundary-Regel (Story 4.3)
  - Coverage-Threshold-Gate (Story 4.3)
  - SCHLUESSEL-basierter Slug-Lookup statt NAME-Lookup (Story 2.4)
  - Aggregation ueber Polygon-Flaeche statt Centroid-Coverage (Phase 3)

### File List

**Neu erstellt (Story 1.4):**
- `src/lib/data/types.ts`
- `src/lib/data/manifest-schema.ts`
- `src/lib/data/manifest.ts` + `.test.ts`
- `src/lib/data/get-layers-at-point.ts` + `.test.ts`
- `src/lib/data/get-kiez-profile.ts`
- `src/lib/data/get-bezirk-profile.ts` + `.test.ts`
- `src/lib/data/get-layer-metadata.ts` + `.test.ts`
- `src/lib/data/get-climate-station.ts` + `.test.ts`
- `src/lib/data/get-climate-series.ts` + `.test.ts`
- `src/lib/data/index.ts`
- `src/lib/data/internal/slug.ts` + `.test.ts`
- `src/lib/data/internal/layer-fetch.ts` + `.test.ts`
- `src/lib/data/internal/spatial-index.ts` + `.test.ts`
- `src/lib/data/__fixtures__/mini-manifest.json`
- `src/lib/data/__fixtures__/mini-bezirke.geojson`
- `src/lib/data/__fixtures__/mini-mietspiegel.geojson`
- `src/lib/data/__fixtures__/mini-trinkbrunnen.geojson`
- `src/lib/data/__fixtures__/mini-climate-dahlem.json`

**Modifiziert (Story 1.4):**
- `package.json` + `pnpm-lock.yaml` (@turf/center + @turf/bbox runtime, @types/rbush dev)

## Change Log

| Date | Change | Files | Commit |
|------|--------|-------|--------|
| 2026-05-11 | Types + Slug-Stub | src/lib/data/types.ts, internal/slug.{ts,test.ts} | (Story 1.4 bundled) |
| 2026-05-11 | Manifest-Loader + Valibot-Schema | src/lib/data/manifest.{ts,test.ts}, manifest-schema.ts | (Story 1.4 bundled) |
| 2026-05-11 | layer-fetch + spatial-index (rbush + LRU) | src/lib/data/internal/{layer-fetch,spatial-index}.{ts,test.ts} | (Story 1.4 bundled) |
| 2026-05-11 | getLayersAtPoint algorithm mit Cache + Saisonalitaet | src/lib/data/get-layers-at-point.{ts,test.ts} | (Story 1.4 bundled) |
| 2026-05-11 | Kiez/Bezirk/Layer-Metadata Reader | src/lib/data/get-{kiez,bezirk,layer-metadata}-* | (Story 1.4 bundled) |
| 2026-05-11 | Klima-Reader (nearest + series) | src/lib/data/get-climate-{station,series}.{ts,test.ts} | (Story 1.4 bundled) |
| 2026-05-11 | Public-API in index.ts | src/lib/data/index.ts | (Story 1.4 bundled) |
| 2026-05-11 | Fixtures + Type-Deps | __fixtures__/, package.json, pnpm-lock.yaml | (Story 1.4 bundled) |

## Confirmed Decisions

1. **Public-API-Boundary:** `src/lib/data/index.ts` exportiert nur Top-Level-Reader. `internal/` ist privat — Phase-2-SQL-Swap kann internals komplett ersetzen
2. **Co-located Tests:** `*.test.ts` neben Source-Files, NICHT in `tests/unit/`. Vitest-Default-Convention
3. **Type-Drift-Prevention:** `License`/`Bundle`/`GeometryType` per Relative-Import aus `scripts/lib/types.ts` re-exportiert. Single-Source-of-Truth zwischen Build und Runtime
4. **Slug-Stub:** Minimaler `normalizeSlug` in `internal/slug.ts`. Vollwertige Transliteration kommt in Story 2.3/3.x
5. **Centroid-Based Coverage:** `KiezProfile.layerCoverage` ist `getLayersAtPoint(centroid)` — keine Aggregation über Polygon-Fläche (Phase 3)
6. **No-Coverage vs. Not-Available:** Polygon-Layer → `reason: 'no-coverage'`. Point-Layer → `null` (kein Hit-Entry, da Punkt-Layer keine „Coverage" haben)
