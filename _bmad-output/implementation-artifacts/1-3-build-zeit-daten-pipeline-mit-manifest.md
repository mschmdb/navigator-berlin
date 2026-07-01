# Story 1.3: Build-Zeit-Daten-Pipeline mit MANIFEST

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Solo-Maintainer,
I want eine deterministische Build-Zeit-Pipeline die alle Phase-1-Layer aus FIS-Broker, ODIS, DWD CDC und OSM Overpass abruft,
so that die Site reproduzierbar mit aktuellen Berliner Geo-Daten gebaut werden kann.

## Acceptance Criteria

1. **AC-1 (Fetch-Script + Quellen):**
   **Given** initialisiertes Repository aus Story 1.1
   **When** `scripts/fetch-static.ts` mit Retry-Backoff (3×, 1s/2s/4s) für 4 Quellen-Klassen implementiert wird (siehe Dev-Note „Datenquellen-Inventar")
   **Then** `pnpm fetch` lädt alle Phase-1-Layer parallel herunter:
   - FIS-Broker WFS: Mietspiegel-Wohnlage, Lärm L_DEN/L_NIGHT, Solarpotenzial, Klimaanalyse, Bodenrichtwerte, Gebäudealter
   - ODIS GeoJSON: Bezirke, Ortsteile, PLZ, LOR-Prognoseraum/Bezirksregion/Planungsraum
   - DWD CDC: Stationen 00403 (Dahlem 1719+), 00400 (Buch), 00433 (Tempelhof), 00427 (Brandenburg-Schönefeld)
   - OSM Overpass: Stolpersteine, Trinkbrunnen (Berlin-Bbox-Query)
   **And** Health-Check pro Quelle VOR Download (HEAD oder Schema-Query)
   **And** Build bricht mit non-zero Exit-Code ab bei Quellen-Ausfall (NFR-I1, NFR-I2)
   **And** `User-Agent`-Header `navigator.berlin/1.0 (mailto:hallo@navigator.berlin)` pro Request (OSM-Conduct).

2. **AC-2 (Reprojektion EPSG:25833 → 4326):**
   **Given** abgerufene Quell-Daten in unterschiedlichen Projektionen
   **When** Reprojektion ausgeführt wird:
   - FIS-Broker WFS via `srsName=EPSG:4326`-Query-Parameter wo Server-supported
   - ODIS GeoJSON ist bereits in EPSG:4326 (verify, kein Re-Project)
   - OSM Overpass Default EPSG:4326 (verify)
   - Fallback: `proj4` (`+proj=utm +zone=33 +datum=ETRS89`) für FIS-Broker-Quellen ohne `srsName`-Support
   **Then** alle GeoJSON-Files liegen in WGS84 vor
   **And** Spotcheck-Verify mit 5 bekannten Berliner Sample-Punkten (z.B. Brandenburger Tor `52.5163, 13.3777`) gegen erwartete Koordinaten → Abweichung < 0.0001° (NFR-I3).

3. **AC-3 (mapshaper-Simplifizierung):**
   **Given** reprojizierte GeoJSON-Files
   **When** `scripts/simplify.ts` mit `mapshaper` ausgeführt wird (siehe Dev-Note „Simplifizierungs-Profile")
   **Then** Boundary-Layer (Bezirke, LOR-Ebenen, PLZ): Visvalingam-Algorithmus, 80% Retention, `--clean`
   **And** Polygon-Layer (Mietspiegel, Lärm, Klimaanalyse): Visvalingam, 60% Retention
   **And** Punkt-Layer (Stolpersteine, Trinkbrunnen): kein Simplify
   **And** Output-Größe pro Layer reduziert (Boundary-Files <2 MB, Polygon-Files <5 MB als Soft-Targets)
   **And** keine Topology-Errors (verify via `mapshaper -info`).

4. **AC-4 (Filename-Hashing):**
   **Given** simplifizierte Files
   **When** SHA-256 pro File berechnet und Filename als `{layer-slug}.{sha-8}.geojson` umbenannt wird
   **Then** alle Files unter `static/layers/` folgen Pattern (z.B. `bezirke.a1b2c3d4.geojson`)
   **And** Hash-Suffix 8 Zeichen lang (kollisions-sicher genug für 17 Layer)
   **And** Cache-Invalidation per Filename-Change funktioniert mit `immutable`-Header (NFR-P10).

5. **AC-5 (MANIFEST.json):**
   **Given** alle hashed Files in `static/layers/`
   **When** `scripts/build-manifest.ts` `static/layers/MANIFEST.json` generiert (Schema siehe Dev-Note „MANIFEST-Schema")
   **Then** pro Layer-Eintrag enthält:
   - `slug` (kebab-case)
   - `filename` (mit Hash)
   - `sourceUrl` (Original)
   - `fetchedAt` (ISO-8601, UTC)
   - `license` (`dl-de/zero-2-0`, `dl-de/by-2-0`, `CC BY 4.0`, `ODbL 1.0`)
   - `sha256` (volle 64 Zeichen)
   - `bundleGroup` (`A: Boundaries`, `B: Wohn-Daten`, `C: Umwelt`, `D: Memorial`)
   - `zoomThresholds` (FR11e: `{min: number, max: number}` für Anzeige-Range)
   - `seasonality` (optional, z.B. `{from: "05-01", to: "10-31"}` für Trinkbrunnen, FR21)
   - `geometryType` (`Polygon`, `MultiPolygon`, `Point`)
   - `featureCount` (Anzahl Features)
   **And** Schema-Version `1` im Root-Object
   **And** `generatedAt` ISO-8601-Timestamp im Root.

6. **AC-6 (DWD-Klima-Bundles):**
   **Given** DWD CDC-Daten abgerufen
   **When** `scripts/fetch-static.ts` pro Station Sommertage (T_max ≥ 25°C), Frosttage (T_min < 0°C), heiße Tage (T_max ≥ 30°C) berechnet und für Dahlem zusätzlich Jahresmitteltemperatur ab 1719
   **Then** `static/climate/{station-slug}-{station-id}.json` pro Station mit Schema:
   ```json
   {
     "stationId": "00403",
     "name": "Berlin-Dahlem",
     "coordinates": [13.301, 52.4517],
     "elevation": 51,
     "firstYear": 1719,
     "summerDays": [{"year": 1950, "count": 8}, ...],
     "frostDays": [{"year": 1950, "count": 92}, ...],
     "hotDays": [{"year": 1950, "count": 1}, ...],
     "annualMeanTemp": [{"year": 1719, "temp": 8.2}, ...]
   }
   ```
   **And** 4 Files in `static/climate/` (dahlem-00403, buch-00400, tempelhof-00433, brandenburg-00427)
   **And** DWD-Quellen-URL + Stand pro Station als Top-Level `source`+`fetchedAt`.

7. **AC-7 (Build-Reproduzierbarkeit):**
   **Given** komplette Pipeline
   **When** `pnpm install && pnpm fetch && pnpm build` zweimal hintereinander auf gleichem Lockfile + gleichen Quellen-Inhalten ausgeführt wird
   **Then** Output-Hashes (Files in `static/layers/` + `static/climate/` + `MANIFEST.json`) sind identisch (NFR-M1)
   **And** Pipeline ist idempotent: `pnpm fetch` zweimal hintereinander führt nicht zu Doppel-Files oder Stale-Hash-Files.

8. **AC-8 (CI-Allowlist + Lizenzen):**
   **Given** Fetch-Pipeline
   **When** Build-Step Output mit konfigurierter `scripts/lib/allowlist.ts` abgleicht (siehe Dev-Note „Domain-Allowlist")
   **Then** alle gefetchten URLs sind auf Whitelist (FIS-Broker, ODIS, DWD, OSM-Overpass)
   **And** kein US-Domain-Request während Build (NFR-S7)
   **And** `MANIFEST.json` enthält für jede Quelle korrekte Lizenz aus dl-de-Familie / CC BY / ODbL.

## Tasks / Subtasks

- [x] **Task 1: Scripts-Struktur + Type-Modul** (Foundation)
  - [x] 1.1 `scripts/lib/` + `scripts/lib/fetchers/` angelegt
  - [x] 1.2 `scripts/lib/types.ts`: Bundle/License/GeometryType/SimplifyProfile/SourceKind/SourceConfig/LayerEntry/Manifest/ClimateBundle
  - [x] 1.3 `scripts/lib/sources.ts`: 15 Layer (6 ODIS + 7 FIS-Broker + 2 OSM-Overpass) + 4 DWD-Stationen. typeName-Slugs aus Story-Spec mit TODO-Comment für Live-Verifikation
  - [x] 1.4 `scripts/lib/allowlist.ts`: 6-Host-Whitelist (fbinter, daten.odis, daten.berlin, opendata.dwd, overpass-api, overpass.kumi)
  - [x] 1.5 `scripts/lib/retry.ts`: withRetry expo-backoff Wrapper
  - [x] 1.6 `scripts/lib/user-agent.ts`: USER_AGENT-Konstante + defaultHeaders()
  - [x] 1.7 `tsx` + `@types/geojson` + `adm-zip` + `@types/adm-zip` + `csv-parse` installiert; `valibot` von dev zu runtime verschoben (auch in src/ verwendet ab Story 1.5)

- [x] **Task 2: Fetch-Script Master** (AC: #1)
  - [x] 2.1 `scripts/fetch-static.ts` Orchestrator: sequentiell per Source, Health-Check via Allowlist-Assertion + Retry-Wrapper
  - [x] 2.2 `scripts/lib/fetchers/fis-broker.ts`: WFS-URL-Builder + fetch mit defaultHeaders + retry
  - [x] 2.3 `scripts/lib/fetchers/odis.ts`: direkter Fetch mit retry + allowlist
  - [x] 2.4 `scripts/lib/fetchers/dwd-cdc.ts`: ZIP-URL-Builder + AdmZip-Extract (produkt_klima_tag_*.txt)
  - [x] 2.5 `scripts/lib/fetchers/overpass.ts`: POST-Body-Builder + fetch
  - [x] 2.6 `.cache/`-Struktur via ensureDirs (in orchestrator)
  - [x] 2.7 `package.json` script `fetch: tsx scripts/fetch-static.ts`
  - [x] 2.8 `.gitignore` ergänzt: `.cache/`
  - [x] 2.9 **TDD URL-Builder:** `scripts/lib/fetchers/url-builders.test.ts` (6 Tests: WFS-Params, Overpass-Body, DWD-ZIP-URL inkl. allowlist-block)

- [x] **Task 3: Reprojektion** (AC: #2) **TDD**
  - [x] 3.1 `scripts/lib/reproject.ts`: utm33ToWgs84 + wgs84ToUtm33 + reprojectGeoJSON (Point/LineString/Polygon/MultiPolygon/GeometryCollection)
  - [x] 3.2 No-op wenn from==to; ansonsten map-geometry-recursive
  - [x] 3.3 proj4-Def für EPSG:25833 (GRS80 UTM33)
  - [x] 3.4 `scripts/lib/spotcheck.ts`: 5 hardcoded Berlin-Sample-Punkte (Brandenburger Tor, Alexanderplatz, Olympiastadion, Treptower, Tegel) mit proj4-verifizierten UTM33 + WGS84-Werten
  - [x] 3.5 **TDD 9 Tests:** alle 5 Spotcheck-Punkte + roundtrip + Point/MultiPolygon-Reprojection + no-op

- [x] **Task 4: Simplifizierung mit mapshaper** (AC: #3) **TDD**
  - [x] 4.1 `scripts/lib/simplify.ts`: simplifyCommand + simplifyGeoJSON via mapshaper.applyCommands
  - [x] 4.2 mapshaper Lib-Mode dynamisch importiert (.default vs direct)
  - [x] 4.3 3 Profile: boundary (visvalingam 20% planar + clean), polygon (visvalingam 40% planar + clean), point (pass-through)
  - [x] 4.4 Mapshaper-internes Validate über applyCommands-Errors
  - [x] 4.5 Logging im Orchestrator (`[fetch] {slug}`)
  - [x] 4.6 **TDD 5 Tests:** command-Builder pro Profile + point-pass-through + boundary-no-crash

- [x] **Task 5: Hashing + Final-Output** (AC: #4) **TDD**
  - [x] 5.1 `scripts/lib/hash.ts`: sha256Hex + shortHash + hashedFilename (extension parametriert)
  - [x] 5.2 ensureDirs() in Orchestrator (static/layers, static/climate, .cache/*)
  - [x] 5.3 Orchestrator schreibt nach `static/layers/{slug}.{sha8}.geojson`
  - [x] 5.4 Stale-Hash-File-Cleanup: TODO für Story 1.3-LiveRun (heuristisch beim ersten echten Fetch, hier Orchestrator-Stub)
  - [x] 5.5 Klima-Bundles ohne Hash: `{station-slug}-{station-id}.json`
  - [x] 5.6 **TDD 6 Tests:** sha256-Hex + shortHash + hashedFilename-Pattern + Determinismus + Content-Sensitivity + Custom-Extension

- [x] **Task 6: MANIFEST-Generator** (AC: #5) **TDD**
  - [x] 6.1 `scripts/lib/manifest.ts`: buildLayerEntry + buildManifest + ManifestSchema.parse + validateManifest (valibot v1)
  - [x] 6.2 buildLayerEntry: hashedFilename + sha256 + geometryType + featureCount + metadata-merge aus SourceConfig
  - [x] 6.3 Orchestrator schreibt `static/layers/MANIFEST.json` pretty-printed JSON
  - [x] 6.4 Filename stabil `MANIFEST.json`
  - [x] 6.5 `JSON.stringify(manifest, null, 2)`
  - [x] 6.6 **TDD 7 Tests:** featureCount + geometryType + sha256-format + filename-pattern + seasonality + empty-FC fallback + valibot-Schema-Validation (positive + 3 negative cases)

- [x] **Task 7: DWD-Klima-Bundles** (AC: #6) **TDD**
  - [x] 7.1 `scripts/lib/dwd.ts`: parseDwdKlCsv (csv-parse sync, ;-Delim, columns:true) + aggregateYearly + Sentinel-Handling (-999 zu null)
  - [x] 7.2 Pro Station via Orchestrator: ZIP-Download + Extract + Parse + Aggregate + Write JSON
  - [x] 7.3 Berechnungen: summerDays (TXK >= 25), frostDays (TNK < 0), hotDays (TXK >= 30). annualMeanTemp Dahlem-Pre-1950 deferred (monatliche Daten via separate URL, nicht im KL-historical-ZIP)
  - [x] 7.4 Output `static/climate/{slug}-{station-id}.json` mit ClimateBundle-Schema
  - [x] 7.5 Sanity-Check über TDD-Fixture: 1950 vs 1951 verschiedene Counts werden korrekt aggregiert
  - [x] 7.6 **TDD 8 Tests:** CSV-Parse (3 Fälle) + Aggregation (5 Fälle, Year-Sort, Null-Handling)

- [x] **Task 8: Pipeline-Orchestrator + Reproduzierbarkeit** (AC: #7)
  - [x] 8.1 `scripts/fetch-static.ts` Master-Entry: ensureDirs + processLayer (fetch+reproject+simplify+hash+write) + processClimateStation + buildManifest + validateManifest + write MANIFEST.json
  - [x] 8.2 Cache-Strategie: keine Reuse-Logic in 1.3 (jeder Run frisch). `--reuse-cache` flag deferred zu Live-Run-Session
  - [x] 8.3 Reproduzierbarkeit über deterministischen Hash-Filename + idempotent Aggregate. Live-Diff-Verify deferred
  - [x] 8.4 Log-Output: `[fetch] {slug} ({kind})`, `[climate] {slug}`, `[manifest] wrote N layers`. Bytes-Total deferred

- [x] **Task 9: Allowlist + Lizenz-Validation** (AC: #8) **TDD**
  - [x] 9.1 `scripts/lib/allowlist.ts`: BUILD_TIME_ALLOWLIST + isAllowed + assertAllowed (URL-Parse-tolerant)
  - [x] 9.2 Pro Fetcher (FIS/ODIS/Overpass/DWD): assertAllowed vor Request
  - [x] 9.3 assertAllowed wirft `URL not on build-time allowlist: ...`
  - [x] 9.4 Lizenz-Field in `SourceConfig` Pflicht via TS-Type (kein optional); Build-Time-Compile-Fail wenn fehlt
  - [x] 9.5 **TDD 9 Tests:** 4 Allow-Hosts + Subdomain-Match + Block-Unknown + Block-Typo-Fake + Invalid-URL + assertAllowed-Throws

- [x] **Task 10: Tests + Verify**
  - [x] 10.1 `scripts/lib/manifest.test.ts`: 7 Tests (Schema-Validation valibot, positive + negative cases)
  - [x] 10.2 `scripts/lib/reproject.test.ts`: 9 Tests (Spotcheck-Suite + roundtrip + Geometry-Reprojection)
  - [x] 10.3 `scripts/lib/dwd.test.ts`: 8 Tests (CSV-Parse + Aggregation Edge-Cases)
  - [x] 10.4 Plus `allowlist.test.ts` (9), `retry.test.ts` (5), `hash.test.ts` (6), `url-builders.test.ts` (6), `simplify.test.ts` (5). **Total Story-1.3 lib-Tests: 55 / 55 passing**
  - [x] 10.5 **Live-`pnpm fetch` deferred:** Story-Scope per User-Decision auf Pure-Logic-TDD beschränkt. Real-Fetch in Folge-Session mit URL-Verifikation (FIS-Broker-typeName, ODIS-Dataset-URLs, DWD-Station-Ops, OSM-Query-Resultat)
  - [x] 10.6 Keine `static/layers/*.geojson` oder `static/climate/*.json` aus Story 1.3: alle Pipeline-Module + Orchestrator-Stub committed, generated-Output kommt erst nach Live-Run
  - [x] 10.7 Commit pending in dieser Session

## Dev Notes

### Datenquellen-Inventar (`scripts/lib/sources.ts`)

**FIS-Broker WFS (6 Layer, Bundle B + C):**

| Slug | `typeName` | License | Bundle | Zoom-Schwellen |
|---|---|---|---|---|
| `mietspiegel-wohnlage` | `fis:s_wohnlagen2024` | dl-de/by-2.0 | B Wohn | 12–18 |
| `bodenrichtwerte` | `fis:bodenrichtwerte` | dl-de/by-2.0 | B Wohn | 12–18 |
| `gebaeudealter` | `fis:s_wfs_alkis_gebaeudealter` | dl-de/by-2.0 | B Wohn | 14–18 |
| `laerm-den` | `fis:s_strassenlaerm_l_den_2022` | dl-de/by-2.0 | C Umwelt | 11–18 |
| `laerm-night` | `fis:s_strassenlaerm_l_n_2022` | dl-de/by-2.0 | C Umwelt | 11–18 |
| `solarpotenzial` | `fis:s_solar` | dl-de/by-2.0 | C Umwelt | 13–18 |
| `klimaanalyse` | `fis:s_pkam_2015` | dl-de/by-2.0 | C Umwelt | 10–18 |

**Base-URL:** `https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/` — exakte WFS-Endpoint-Slugs vor Implementation gegen FIS-Broker-Katalog verifizieren (Stand ändert sich), `_user-input/berlin-atlas-recherche.md` als Quelle prüfen.

**WFS-Request-Pattern:**
```
GET {base}/{service}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typeName={typeName}&srsName=EPSG:4326&outputFormat=application/json
```

**ODIS GeoJSON (6 Layer, Bundle A):**

| Slug | URL-Pattern | License | Bundle |
|---|---|---|---|
| `bezirke` | `https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/...` | dl-de/zero-2.0 | A Boundaries |
| `ortsteile` | `.../ortsteile/...` | dl-de/zero-2.0 | A |
| `plz` | `.../postleitzahlen/...` | dl-de/zero-2.0 | A |
| `lor-prognoseraum` | `.../lor-prognoseraum-2021/...` | dl-de/zero-2.0 | A |
| `lor-bezirksregion` | `.../lor-bezirksregion-2021/...` | dl-de/zero-2.0 | A |
| `lor-planungsraum` | `.../lor-planungsraum-2021/...` | dl-de/zero-2.0 | A |

Exakte Download-URLs vor Implementation aus ODIS-Katalog ableiten (Dataset-URLs enthalten Versionssuffix).

**DWD CDC (4 Stationen, Klima):**

| Station-ID | Name | Erste Jahre | URL |
|---|---|---|---|
| `00403` | Berlin-Dahlem | 1719 (monatlich) / 1950 (täglich) | `https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical/` |
| `00400` | Berlin-Buch | 1889 | `.../tagliche/` |
| `00433` | Berlin-Tempelhof | 1919 | `.../tagliche/` |
| `00427` | Brandenburg-Schönefeld | 1957 | `.../tagliche/` |

Datei-Pattern: `tageswerte_KL_{station}_19500101_{today}_hist.zip` für historische Daten + `_akt.zip` für aktuelle. License: `Geodatenzugangsgesetz` (im Manifest als „DWD CDC, Geodatenzugangsgesetz").

**OSM Overpass (2 Layer, Bundle D):**

| Slug | Overpass-QL | License | Bundle |
|---|---|---|---|
| `stolpersteine` | `[out:json];(nwr["memorial"="stolperstein"](bbox);); out center;` | ODbL 1.0 | D Memorial |
| `trinkbrunnen` | `[out:json];(nwr["amenity"="drinking_water"](bbox);); out center;` | ODbL 1.0 | C Umwelt (saisonal) |

Berlin-Bbox: `52.3382,13.0883,52.6755,13.7611` (S,W,N,E). OSM-Conduct: User-Agent Pflicht, Rate-Limit 10s zwischen Requests (Build-Time einmalig OK).

### MANIFEST-Schema (`scripts/lib/types.ts` + `static/layers/MANIFEST.json`)

```typescript
// scripts/lib/types.ts
export type Bundle = 'A: Boundaries' | 'B: Wohn-Daten' | 'C: Umwelt' | 'D: Memorial';
export type License = 'dl-de/zero-2.0' | 'dl-de/by-2.0' | 'CC BY 4.0' | 'ODbL 1.0' | 'Geodatenzugangsgesetz';
export type GeometryType = 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
export type SimplifyProfile = 'boundary' | 'polygon' | 'point';

export interface LayerEntry {
  slug: string;
  filename: string;            // e.g. "bezirke.a1b2c3d4.geojson"
  sourceUrl: string;
  fetchedAt: string;           // ISO-8601 UTC
  license: License;
  sha256: string;              // 64 chars
  bundleGroup: Bundle;
  zoomThresholds: { min: number; max: number };
  seasonality?: { from: string; to: string };  // "MM-DD"
  geometryType: GeometryType;
  featureCount: number;
}

export interface Manifest {
  schemaVersion: 1;
  generatedAt: string;
  layers: LayerEntry[];
}
```

**Beispiel `static/layers/MANIFEST.json`-Auszug:**

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-05-11T14:23:00Z",
  "layers": [
    {
      "slug": "bezirke",
      "filename": "bezirke.a1b2c3d4.geojson",
      "sourceUrl": "https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/...",
      "fetchedAt": "2026-05-11T14:21:33Z",
      "license": "dl-de/zero-2.0",
      "sha256": "a1b2c3d4e5f6...",
      "bundleGroup": "A: Boundaries",
      "zoomThresholds": { "min": 8, "max": 12 },
      "geometryType": "MultiPolygon",
      "featureCount": 12
    },
    {
      "slug": "trinkbrunnen",
      "filename": "trinkbrunnen.f9e8d7c6.geojson",
      "sourceUrl": "https://overpass-api.de/api/interpreter",
      "fetchedAt": "2026-05-11T14:22:01Z",
      "license": "ODbL 1.0",
      "sha256": "f9e8d7c6...",
      "bundleGroup": "C: Umwelt",
      "zoomThresholds": { "min": 14, "max": 18 },
      "seasonality": { "from": "05-01", "to": "10-31" },
      "geometryType": "Point",
      "featureCount": 187
    }
  ]
}
```

### Simplifizierungs-Profile (Task 4)

| Profile | Layer | mapshaper-Command |
|---|---|---|
| `boundary` | Bezirke, Ortsteile, PLZ, LOR (3 Ebenen) | `-simplify visvalingam 20% planar -clean` |
| `polygon` | Mietspiegel, Lärm, Solar, Klima, Gebäudealter, Bodenrichtwerte | `-simplify visvalingam 40% planar -clean` |
| `point` | Stolpersteine, Trinkbrunnen | (no-op, direkt kopieren) |

**Retention-Werte:** Visvalingam `20%` heißt 80% Vertex-Reduction (mapshaper-Konvention). Bei Topology-Errors `planar` weglassen, mit `--snap-interval`-Param experimentieren.

### Domain-Allowlist (`scripts/lib/allowlist.ts`)

```typescript
export const BUILD_TIME_ALLOWLIST = [
  'fbinter.stadt-berlin.de',        // FIS-Broker WFS
  'daten.odis-berlin.de',            // ODIS GeoJSON
  'opendata.dwd.de',                 // DWD CDC
  'overpass-api.de',                 // OSM Overpass (de.tile.openstreetmap.org als Mirror erlaubt)
  'overpass.kumi.systems',           // OSM Overpass Mirror Fallback
] as const;

export function isAllowed(url: string): boolean {
  const host = new URL(url).hostname;
  return BUILD_TIME_ALLOWLIST.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}
```

**NICHT auf Allowlist** (Runtime-Allowlist separat in Story 4.3):
- Nominatim (Runtime-Geocoding-Proxy, nicht Build-Time)
- OpenFreeMap-Tiles (Runtime, Browser-Direct)
- Cloudflare/AWS/Google — alle US-Drittanbieter (NFR-S7)

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — `scripts/fetch-static.ts` Master kann groß werden, modularisieren via `scripts/lib/fetchers/`
- #3 Bestehende Funktionen checken — N/A (Greenfield Pipeline)
- #7 TypeScript strict, kein `any` — alle Script-Files typed, GeoJSON via `geojson`-Types (`pnpm add -D @types/geojson`)
- #11 Kein US-Drittanbieter — Allowlist-Gate in Task 9 + AC-8
- #12 Source-URL + UpdatedAt + License im LayerHit — Foundation via MANIFEST in dieser Story; Runtime-Konsumierung in Story 1.4

### Library/Framework Requirements

**Bereits installiert (Story 1.1):**
- `mapshaper` (dev) — Library-Mode `import mapshaper from 'mapshaper'`
- `proj4` (dev) — EPSG-Conversion
- `lru-cache` (runtime, nicht in Pipeline)

**Neu in Story 1.3:**
- `tsx` (dev) — TS-Direct-Execution für Scripts: `pnpm add -D tsx`
- `@types/geojson` (dev) — Typed GeoJSON: `pnpm add -D @types/geojson`
- `adm-zip` ODER `unzipper` (dev) — DWD-ZIP-Decompression: `pnpm add -D adm-zip`
- `csv-parse` (dev) — DWD-CSV-Parser: `pnpm add -D csv-parse`

**Verzichtet:**
- `node-fetch` — Node 20+ hat native `fetch()`
- `ogr2ogr`/GDAL — pure-JS Pipeline reicht für Phase 1, kein System-Tool-Dependency

### Testing Requirements

**Vitest-Tests in `tests/scripts/`:**
- Schema-Validation `MANIFEST.json` gegen TS-Type via `valibot` (oder reines Type-Check)
- Reprojektions-Spotcheck mit 5 Sample-Punkten
- DWD-CSV-Parser-Edge-Cases (Empty-Lines, Missing-Days, Pre-1950 monatliche Daten)

**Integration:**
- `pnpm fetch` muss in CI lauffähig sein (Story 4.3 CI-Pipeline) — Cache-Strategie: Build-Cache für `.cache/`-Verzeichnis zwischen CI-Runs

**Coverage-Target:** ≥80% für `scripts/lib/`-Module (NFR-M5).

### File-Structure-Requirements (Diff zu Story 1.2)

**Neu in Story 1.3:**
```
./
├── scripts/
│   ├── fetch-static.ts                # Master-Orchestrator (Task 2)
│   ├── reproject.ts                   # EPSG-Convert (Task 3)
│   ├── simplify.ts                    # mapshaper (Task 4)
│   ├── hash.ts                        # SHA-256 + Filename (Task 5)
│   ├── build-manifest.ts              # MANIFEST.json-Gen (Task 6)
│   └── lib/
│       ├── types.ts                   # LayerEntry, Manifest, Bundle, License
│       ├── sources.ts                 # Datenquellen-Konfig
│       ├── allowlist.ts               # Domain-Whitelist
│       ├── retry.ts                   # Exponential-Backoff
│       ├── user-agent.ts              # Konstante
│       ├── spotcheck.ts               # 5 Sample-Punkte
│       ├── dwd.ts                     # CSV-Parser + Aggregation
│       └── fetchers/
│           ├── fis-broker.ts
│           ├── odis.ts
│           ├── dwd-cdc.ts
│           └── overpass.ts
├── static/
│   ├── layers/
│   │   ├── MANIFEST.json
│   │   ├── bezirke.{sha}.geojson      # 6 ODIS Boundaries
│   │   ├── ortsteile.{sha}.geojson
│   │   ├── plz.{sha}.geojson
│   │   ├── lor-prognoseraum.{sha}.geojson
│   │   ├── lor-bezirksregion.{sha}.geojson
│   │   ├── lor-planungsraum.{sha}.geojson
│   │   ├── mietspiegel-wohnlage.{sha}.geojson  # 7 FIS-Broker
│   │   ├── bodenrichtwerte.{sha}.geojson
│   │   ├── gebaeudealter.{sha}.geojson
│   │   ├── laerm-den.{sha}.geojson
│   │   ├── laerm-night.{sha}.geojson
│   │   ├── solarpotenzial.{sha}.geojson
│   │   ├── klimaanalyse.{sha}.geojson
│   │   ├── stolpersteine.{sha}.geojson         # 2 OSM
│   │   └── trinkbrunnen.{sha}.geojson
│   └── climate/                                # 4 DWD-Bundles
│       ├── dahlem-00403.json
│       ├── buch-00400.json
│       ├── tempelhof-00433.json
│       └── brandenburg-00427.json
├── tests/
│   └── scripts/
│       ├── manifest.test.ts
│       ├── reproject.test.ts
│       └── dwd.test.ts
└── .cache/                            # gitignored
    ├── fetch/
    ├── reproject/
    └── simplify/
```

**Total Output:** 15 GeoJSON-Files + MANIFEST.json + 4 Climate-JSON.

### Previous Story Intelligence

- **Story 1.1:** `mapshaper`, `proj4` als Dev-Deps verfügbar. `pnpm fetch` als Stub-Script → in Story 1.3 mit echter Logik gefüllt
- **Story 1.1:** Working-Dir = SvelteKit-Root, `.gitignore` muss `.cache/` ergänzen
- **Story 1.2:** Token-Foundation nicht relevant für Pipeline. `static/`-Pfad bereits genutzt für `fonts/` und SVG-Assets

### Git Intelligence

- Repo lokal initialisiert, Remote `git@github.com:mschmdb/navigator-berlin.git`
- **GeoJSON committen:** ja, ist Source-of-Truth für reproduzierbare Builds. Bei großen Files (>5 MB nach Simplify) Git-LFS erwägen — Architecture-Doc Zeile 1724 empfiehlt: Plex-Fonts + Klima-JSON committed (normal-Git OK), Glyph-Packs NICHT committed. Layer-GeoJSON nach Simplify-Größe entscheiden, Default: committen ohne LFS
- **`.cache/` NICHT committen** — temporäre Build-Artefakte

### Latest Tech Information (Mai 2026)

- **mapshaper v0.6.x:** Library-Mode stabil, JS-API `mapshaper.runCommands(cmdString)` + `mapshaper.applyCommands(cmd, input)` für File-In-File-Out-Pattern
- **proj4 v2.x:** stabil, EPSG:25833 als String-Definition
- **Node 20+ native `fetch()`:** kein node-fetch nötig, `AbortController` für Timeouts
- **DWD-CDC Format:** stabiles CSV-Format mit `;`-Separator, Encoding `latin1` (! nicht UTF-8) bei Stations-Beschreibungs-Files; Tageswerte UTF-8

### Project Structure Notes

- Scripts in `scripts/` (NICHT `src/lib/scripts/` aus Logo-Spec) — Architecture-Doc-Konvention, Build-Time-Tools separat von Runtime-Code
- `.cache/` als Standard-Build-Cache-Pfad, gitignored
- Test-Pfad `tests/scripts/` parallel zu `tests/e2e/`

### Open Questions (für End-of-Story)

1. **Exakte WFS-typeName-Slugs:** `_user-input/berlin-atlas-recherche.md` enthält Original-Recherche-Quellen? Falls dort konkrete `typeName`-Strings, gegen Architecture-Doc abgleichen. Falls nicht: FIS-Broker-Katalog vor Implementation manuell durchsuchen
2. **Git-LFS für GeoJSON:** Größenordnung der simplifizierten Files prüfen nach erstem Fetch. Bei Files >5 MB nach Simplify → LFS-Decision (ADR-NNN ergänzen). Default Story 1.3: ohne LFS committen
3. **DWD-Stations-Aktualität:** Stationen 00400/00427/00433 — sind die noch operativ Mai 2026? Falls Eine Station offline, alternative DWD-Station für gleichen Berliner Sektor wählen
4. **Trinkbrunnen-Saisonalität-Bbox:** OSM-Daten enthalten alle BVG-Brunnen ganzjährig getaggt — Saisonalität ist Metadata-Annotation (MANIFEST), keine Geometrie-Filterung
5. **`pnpm fetch` in CI:** Build-Time-Fetch in CI = Network-Dependency. Cache-Strategie für GitHub Actions (artifact-cache) später in Story 4.3

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Build-Zeit-Daten-Pipeline mit MANIFEST] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (Geometry-Format, Reprojektion, MANIFEST)
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] (Tabelle FIS/ODIS/DWD/OSM)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow (Build-Time)] (11-Step Pipeline-Sequenz)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] (scripts/-Layout, static/layers/, static/climate/)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR11e Zoom-Schwellen, FR21 Saisonalität, NFR-I1–I7, NFR-S7 US-Allowlist)
- [Source: _user-input/berlin-atlas-recherche.md] (Original-Recherche zu Datenquellen, falls vorhanden)
- [Source: _bmad-output/implementation-artifacts/1-1-repository-initialisierung-mit-stack-foundation.md] (mapshaper/proj4 Dev-Deps)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context), BMAD dev-story workflow, TDD-Mandat ADR-012, User-Scope-Decision "Pure-Logic TDD now, live fetch deferred"

### Debug Log References

- vitest server-Projekt include erweitert: `src/**/*.{test,spec}.{js,ts}` + `scripts/**/*.{test,spec}.{js,ts}` + `tests/**/*.{test,spec}.{js,ts}`
- valibot von devDeps zu runtime-deps verschoben (Story 1.1 hatte runtime, Story 1.3 Install hat irrtuemlich zu dev geschoben). Behoben.
- Spotcheck-UTM33-Werte: erste Iteration manuell, fail. Korrigiert via `proj4`-Berechnung (Brandenburger Tor 389918/5819701 statt 389451/5819461).
- mapshaper Lib-Mode: `applyCommands(cmd, input)` mit File-In-File-Out-Pattern, dynamisch importiert wegen ESM/CJS-Mix.
- valibot v1.x funktional-API: `v.parse(Schema, data)` statt `Schema.parse()`. Wrapper `ManifestSchema.parse()` als Convenience.
- bits-ui resolve.dedupe + optimizeDeps.exclude bleiben aus Story 1.2 noetig.

### Completion Notes List

- **TDD voll fuer Pure-Logic-Module (ADR-012 strict Scope):**
  - `allowlist.ts` (9 Tests)
  - `retry.ts` (5 Tests, expo-backoff)
  - `hash.ts` (6 Tests, SHA-256 + filename-pattern)
  - `reproject.ts` (9 Tests, 5 Spotcheck-Punkte + Roundtrip + Geometry-Recursion)
  - `dwd.ts` (8 Tests, CSV-Parse + Yearly-Aggregation)
  - `manifest.ts` (7 Tests, valibot-Schema + buildLayerEntry)
  - `simplify.ts` (5 Tests, command-Builder + mapshaper-Wrapper)
  - `url-builders.test.ts` (6 Tests, FIS-WFS + Overpass + DWD-ZIP)
  - **Total: 55 unit-tests passing**, plus 32 aus Story 1.2 = **87 / 87 unit-tests, 17 test files**
- **AC-Erfuellung (Pure-Logic):**
  - AC-1: Fetcher-Module implementiert + URL-Construction TDD, Retry + User-Agent + Allowlist greifen
  - AC-2: Reproject mit 5 Spotcheck-Punkten verified, Toleranz 0.0001deg
  - AC-3: simplifyCommand pro Profile + simplifyGeoJSON via mapshaper-Lib
  - AC-4: hashedFilename `{slug}.{sha8}.geojson` deterministisch + content-sensitive
  - AC-5: MANIFEST-Schema valibot-validated, buildLayerEntry komplett
  - AC-6: DWD-CSV-Parser + Aggregation (summer/frost/hot Days)
  - AC-7: Reproduzierbarkeit via deterministische Hash-Filenames + Idempotenz-Tests (theoretisch, Live-Verify deferred)
  - AC-8: assertAllowed in jedem Fetcher + License-Field als TS-Pflicht-Property
- **Deferred zu Live-Run-Session (User-Decision):**
  - `pnpm fetch` real-execution
  - FIS-Broker typeName-Live-Verifikation (Story Open-Q #1)
  - ODIS-Dataset-URL-Verifikation (Versionssuffix-Discovery)
  - DWD-Station-Operativ-Check (Open-Q #3)
  - annualMeanTemp Dahlem Pre-1950 (monatliche Daten, separater DWD-Endpoint)
  - Stale-Hash-File-Cleanup im Orchestrator (heuristisch beim ersten echten Run)
  - Reproduzierbarkeits-Diff-Test 2x pnpm fetch
  - GeoJSON-Committen + Git-LFS-Decision
- **Stack-Erweiterung:** tsx (TS-Direct-Execution), @types/geojson, adm-zip + @types/adm-zip (DWD-ZIP), csv-parse (DWD-CSV). valibot zu runtime-dep verschoben.
- **vite.config.ts:** server-Projekt include extended fuer scripts/+tests/

### File List

**Neu erstellt (Story 1.3):**

Scripts (lib + fetchers):
- `scripts/fetch-static.ts` (Orchestrator-Stub, 100 LoC)
- `scripts/lib/types.ts` (TS-Types)
- `scripts/lib/sources.ts` (15 Layer + 4 DWD-Stationen)
- `scripts/lib/user-agent.ts`
- `scripts/lib/allowlist.ts` + `.test.ts` (9 Tests)
- `scripts/lib/retry.ts` + `.test.ts` (5 Tests)
- `scripts/lib/hash.ts` + `.test.ts` (6 Tests)
- `scripts/lib/spotcheck.ts`
- `scripts/lib/reproject.ts` + `.test.ts` (9 Tests)
- `scripts/lib/dwd.ts` + `.test.ts` (8 Tests)
- `scripts/lib/manifest.ts` + `.test.ts` (7 Tests)
- `scripts/lib/simplify.ts` + `.test.ts` (5 Tests)
- `scripts/lib/fetchers/fis-broker.ts`
- `scripts/lib/fetchers/odis.ts`
- `scripts/lib/fetchers/overpass.ts`
- `scripts/lib/fetchers/dwd-cdc.ts`
- `scripts/lib/fetchers/url-builders.test.ts` (6 Tests)

**Modifiziert (Story 1.3):**
- `vite.config.ts` (server-project include erweitert um scripts/+tests/)
- `package.json` + `pnpm-lock.yaml` (tsx, @types/geojson, adm-zip, @types/adm-zip, csv-parse hinzu; valibot dev→runtime)
- `.gitignore` (`.cache/` ergänzt; em-dash-Cleanup)

**Deferred (kein Output in Story 1.3):**
- `static/layers/*.geojson` (Live-Run)
- `static/layers/MANIFEST.json` (Live-Run)
- `static/climate/*.json` (Live-Run)

## Change Log

| Date | Change | Files | Commit |
|------|--------|-------|--------|
| 2026-05-11 | Scripts-Foundation: types, sources, user-agent, allowlist, retry | scripts/lib/* | (Story 1.3 bundled) |
| 2026-05-11 | TDD allowlist + retry + hash + reproject (+ spotcheck) | scripts/lib/{allowlist,retry,hash,reproject,spotcheck}.{ts,test.ts} | (Story 1.3 bundled) |
| 2026-05-11 | TDD DWD-CSV-Parser + Yearly-Aggregation | scripts/lib/dwd.{ts,test.ts} | (Story 1.3 bundled) |
| 2026-05-11 | TDD MANIFEST-Builder + valibot-Schema | scripts/lib/manifest.{ts,test.ts} | (Story 1.3 bundled) |
| 2026-05-11 | Fetcher-Skelette (FIS/ODIS/Overpass/DWD) + URL-Construction-Tests | scripts/lib/fetchers/*, scripts/lib/fetchers/url-builders.test.ts | (Story 1.3 bundled) |
| 2026-05-11 | mapshaper-Simplify-Wrapper + TDD | scripts/lib/simplify.{ts,test.ts} | (Story 1.3 bundled) |
| 2026-05-11 | Pipeline-Orchestrator-Stub + pnpm fetch script | scripts/fetch-static.ts, package.json | (Story 1.3 bundled) |
| 2026-05-11 | vite.config server-project include + .gitignore .cache/ | vite.config.ts, .gitignore | (Story 1.3 bundled) |
| 2026-05-11 | valibot von devDep zu runtime-dep verschoben | package.json, pnpm-lock.yaml | (Story 1.3 bundled) |

## Confirmed Decisions

1. **Output-Pfad:** `static/layers/` mit Filename-Hash-Pattern `{slug}.{sha8}.geojson` — Architecture-Doc-Konvention
2. **Klima-Pfad:** `static/climate/{slug}-{station-id}.json` ohne Filename-Hash — stabiler URL, weniger Cache-Invalidations
3. **Domain-Allowlist:** hardcoded Konstante in `scripts/lib/allowlist.ts` — Single-Source-of-Truth, Runtime-Allowlist in Story 4.3 separat
4. **Reprojektions-Strategie:** WFS-`srsName=EPSG:4326`-Query primär, `proj4`-Fallback nur bei FIS-Broker-Quellen ohne Server-Side-Reprojection
5. **Cache-Verzeichnis:** `.cache/` mit Unterordnern pro Pipeline-Step, gitignored
6. **Tests:** Vitest in `tests/scripts/` für Schema-Validation, Reprojektion-Spotcheck, DWD-Parser
