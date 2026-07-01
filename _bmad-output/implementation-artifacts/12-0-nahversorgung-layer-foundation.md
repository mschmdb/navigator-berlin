# Story 12.0: Nahversorgungs-Layer-Foundation (Overpass-Fetch + Radius-Join)

Status: review

> **Anker:** ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`, Pragmatic TDD). Epic 12 erweitert die Versorgungs-Dimension um Alltagsökonomie (OSM-Nahversorgung), KEINE eigene Dimension. Diese Story ist die Daten-Foundation: drei OSM-Layer holen + in den Dichte-Radius-Join hängen. Hard-Block für 12.1 + 12.2.
> **Voraussetzung:** Epic 9 (Score-Recomposition) + Epic 10.1–10.4 (Versorgungs-Ausbau, `poi-density`) sind `done`. Die `poi-density`-Infrastruktur (Story 10.4) wird wiederverwendet.

## Story

As a Solo-Maintainer,
I want die Nahversorgungs-POIs (Lebensmittel, Apotheke, Post) als deterministische OSM-Layer in der Pipeline und im Dichte-Radius-Join,
so that die Versorgungs-Dimension sie wie Kita/Schule/Spielplatz als `poi-density`-Term lesen kann.

## Kontext: Warum dieser Change

Die Versorgungs-Dimension misst Daseinsvorsorge (Kita, Schule, Krankenhaus, Spielplatz), aber keinen Alltagseinkauf. Supermarkt, Apotheke, Post sind die häufigsten Wege im Kiez, fehlen aber komplett. Diese Story liefert nur die Daten + Radius-Counts. Die Score-Terme + Umgewichtung folgen in 12.1–12.3.

Der `overpass`-Fetcher (ODbL) ist schon im Stack. Die `poi-density`-Strategy + der generische Radius-Join (`buildPoiDensityCounts`) existieren aus Story 10.4. Es braucht keine neue Normalisierungs-Strategy und kein neues Join-Modul.

## Acceptance Criteria

1. **AC-1 (Drei OSM-Quellen):**
   **Given** der `overpass`-Fetcher (`scripts/lib/fetchers/overpass.ts`, ODbL)
   **When** drei neue `kind: 'overpass'`-Sources in `scripts/lib/sources.ts` angelegt werden
   **Then** existieren die Layer `nahversorgung-lebensmittel` (`shop=supermarket|convenience|grocery`), `nahversorgung-apotheke` (`amenity=pharmacy`), `nahversorgung-post` (`amenity=post_office`)
   **And** die Overpass-Tags sind vorab gegen die Live-API verifiziert (nicht aus dem Gedächtnis)
   **And** `pnpm data:fetch` produziert je ein GeoJSON in `static/layers/` mit MANIFEST-Eintrag (Quelle, `fetchedAt`, `sha256`, `featureCount`, Lizenz `ODbL 1.0`)

2. **AC-2 (Radius-Join-Counts):**
   **Given** die `poiCounts`-Logik (`buildPoiDensityCounts`, Story 10.4)
   **When** die drei Layer in `POI_LAYERS` (`scripts/build-kiez-scores.ts`) aufgenommen werden
   **Then** liefert der PoiIndex pro 542 LOR `{ count, nearestM }` je neuem Slug, sobald ein `poi-density`-`LayerWeight` ihn referenziert (12.1/12.2)
   **And** kein Score-Output ändert sich allein durch diese Story (Layer im Index, aber noch kein `LayerWeight` → kein Effekt; verifizierbar via Recompute-Diff = 0)

3. **AC-3 (Bäcker-Entscheidung):**
   **Given** `shop=bakery` als Kandidat für Lebensmittel
   **When** die Lebensmittel-Query gebaut wird
   **Then** ist dokumentiert, ob Bäcker in den Lebensmittel-Bucket gefaltet oder weggelassen wird (kein eigener Layer ohne Begründung)

4. **AC-4 (TDD + Lizenz):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** Overpass-zu-GeoJSON-Mapping der neuen Tags + leeres Treffer-Set (kein Crash) sind getestet
   **And** ODbL-Attribution „© OpenStreetMap contributors" ist im MANIFEST + Quellen-Doku hinterlegt
   **And** Clubkataster oder andere nicht-offene Quellen werden NICHT verwendet

## Tasks / Subtasks

- [x] **Task 1: Overpass-Tags live verifizieren** (AC: #1, #3)
  - [x] 1.1 Gegen `https://overpass-api.de/api/interpreter` die Counts prüfen: `shop=supermarket|convenience|grocery`, `amenity=pharmacy`, `amenity=post_office`, optional `shop=bakery`, jeweils im Berlin-Boundary
  - [x] 1.2 Bäcker-Entscheidung treffen + in der Source-Kommentarzeile begründen (AC-3)

- [x] **Task 2: Drei Sources in `sources.ts`** (AC: #1, #4)
  - [x] 2.1 `scripts/lib/sources.ts`: drei `SourceConfig`-Einträge `kind: 'overpass'`, Muster `trinkbrunnen` (Z.190–199) / `ubahn-stationen` (Z.467–476). Felder: `slug`, `sourceUrl` (Interpreter-Endpoint), `overpassQL` (BBox via `BERLIN_BBOX_OVERPASS` inline), `license: 'ODbL 1.0'`, `bundleGroup`, `zoomThresholds`, `simplifyProfile: 'point'`
  - [x] 2.2 `bundleGroup`: **`Bundle`-Union in `scripts/lib/types.ts` (Z.1–20) ist getypt.** Entweder bestehenden Wert wiederverwenden (z.B. den Soziale-Infrastruktur-Bundle) oder die Union um einen Nahversorgungs-Bundle erweitern. Nicht frei erfinden.
  - [x] 2.3 Lebensmittel-Query mit `or`-Gruppe: `nwr["shop"~"^(supermarket|convenience|grocery)$"](BBOX);` (bzw. inkl. bakery falls Task 1.2 so entscheidet)
  - [x] 2.4 `mapRelevant: true` (Nutzer sieht POIs), `inspectorRelevant: false` (kein Layer-Aggregat-Aufwand in dieser Story; optional später)

- [x] **Task 3: Fetch + MANIFEST** (AC: #1)
  - [x] 3.1 `pnpm data:fetch` laufen lassen, drei GeoJSON + MANIFEST-Einträge prüfen (Filename-Hash, `featureCount` plausibel zu den Live-Counts)
  - [x] 3.2 `pnpm check`: MANIFEST validiert gegen `src/lib/data/manifest-schema.ts` (Slug-Regex `^[a-z0-9-]+$`, Filename-Regex)

- [x] **Task 4: POI-Index-Registrierung** (AC: #2)
  - [x] 4.1 (RED) Test: nach Aufnahme in `POI_LAYERS` enthält der PoiIndex die drei Slugs
  - [x] 4.2 (GREEN) `scripts/build-kiez-scores.ts` Z.57 `POI_LAYERS`: drei Slugs ergänzen
  - [x] 4.3 Recompute-Diff: `pnpm data:kiez-scores` zweimal, Score-Output identisch zum Pre-Change-Stand (kein `LayerWeight` referenziert die Layer noch → AC-2)

- [x] **Task 5: TDD Overpass-Mapping** (AC: #4)
  - [x] 5.1 (RED/GREEN) Test in `scripts/lib/fetchers/` oder Pipeline: `overpassToGeoJSON` mappt `shop`/`amenity`-Tags korrekt als Properties, leeres Set → leere FeatureCollection (kein Crash)
  - [x] 5.2 `pnpm test` 100% grün

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`scripts/lib/sources.ts`**: `SourceConfig[] SOURCES` ab Z.5, Berlin-BBox-Const Z.3. OSM-Muster: `trinkbrunnen` Z.190–199, `ubahn-stationen` Z.467–476, `stolpersteine` Z.204–214. **Kein `included-fields`-Config** — alle OSM-Tags werden zu Feature-Properties.
- **Overpass-Fetcher** `scripts/lib/fetchers/overpass.ts`: `fetchOverpass(endpoint, ql)` Z.13 (POST, `withRetry`). `overpass-to-geojson.ts`: `overpassToGeoJSON(input)` Z.86 — nodes→Point, ways→Line/Polygon, **Relations ignoriert** (Z.99), Properties = `{ osmId, osmType, ...tags }`. Allowlist `scripts/lib/allowlist.ts:8` hat `overpass-api.de` bereits.
- **Fetch-Dispatch** `scripts/fetch-static.ts`: `case 'overpass'` Z.58–60 → `fetchOverpass`, Z.95 `isOverpassResponse ? overpassToGeoJSON : parsed`.
- **`scripts/build-kiez-scores.ts`**: `POI_LAYERS` Z.57 = `['kitas-2024','spielplaetze','gruenanlagen']`. Diese landen im PoiIndex. `splitSchulenByArt` Z.133–138 als Sonderfall (nicht nötig hier).
- **Radius-Join (geteilt, Story 10.4):** `buildPoiDensityCounts(lat,lng,poiIndex,specs)` in `scripts/lib/kiez-score/build-helpers.ts` Z.114–134. Auto-angewandt pro LOR in `pipeline.ts` Z.172, getrieben von `POI_DENSITY_SPECS` (`pipeline.ts` Z.22–31, abgeleitet aus `DIMENSION_CONFIGS`).
- **MANIFEST-Shape** `static/layers/MANIFEST.json`: `{schemaVersion, generatedAt, layers:[...]}`. Eintrag: `slug, filename, sourceUrl, fetchedAt, sourceUpdatedAt?, license, sha256, bundleGroup, zoomThresholds{min,max}, geometryType, featureCount, inspectorRelevant?, mapRelevant?`. Validierung `src/lib/data/manifest-schema.ts:38–70`.

### Registrierung eines neuen poi-density-Layers (zwei Pflicht-Stellen, Story 10.4-Muster)

1. `POI_LAYERS` in `build-kiez-scores.ts:57` → Features in den PoiIndex (diese Story, Task 4).
2. Ein `poi-density`-`LayerWeight` in einem `DimensionConfig` (`dimension-config.ts`) → speist `POI_DENSITY_SPECS` automatisch (Stories 12.1/12.2, NICHT hier).

Die Dichte-Mathematik, der Radius-Join und die synthetische Normalisierung sind geteilt und brauchen keinen Per-Layer-Code.

### Was nicht brechen darf

- Score-Output bleibt diese Story bit-identisch (Layer im Index, kein `LayerWeight`). Recompute-Diff = 0 ist der Beweis (AC-2/Task 4.3).
- Bestehende Sources, `DIMENSION_CONFIGS`, alle anderen Layer: kein Anfassen.
- `pnpm check` ohne neue Errors.

### Architektur-Compliance

- **MUST #2:** Dateien < 500 Zeilen. Keine neuen großen Module nötig (alles bestehende Infrastruktur).
- **MUST #7:** TS strict, kein `any`. `bundleGroup` ist getypte `Bundle`-Union (Task 2.2).
- **Lizenz-Disziplin:** ODbL-Footer-Zeile, Per-Layer-Attribution. Clubkataster NICHT.

## References

- `scripts/lib/sources.ts` (OSM-Muster: trinkbrunnen Z.190–199, ubahn-stationen Z.467–476)
- `scripts/lib/types.ts` (Bundle-Union Z.1–20, SourceConfig Z.32–75)
- `scripts/lib/fetchers/overpass.ts` (fetchOverpass Z.13), `overpass-to-geojson.ts` (overpassToGeoJSON Z.86)
- `scripts/fetch-static.ts` (case 'overpass' Z.58–60, Z.95)
- `scripts/build-kiez-scores.ts` (POI_LAYERS Z.57)
- `scripts/lib/kiez-score/build-helpers.ts` (buildPoiDensityCounts Z.114–134)
- `scripts/lib/kiez-score/pipeline.ts` (POI_DENSITY_SPECS Z.22–31, poiCounts Z.172)
- `src/lib/data/manifest-schema.ts` (Validierung Z.38–70)
- `docs/adr/ADR-012-tdd-mandate.md`
- `_bmad-output/planning-artifacts/epics.md` (Epic 12)
- `_bmad-output/implementation-artifacts/10-4-poi-score-distanz-zu-dichte.md` (poi-density-Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Debug Log References

- Live-Overpass-Count-Verifikation (Berlin admin area): Lebensmittel `supermarket|convenience|grocery|bakery` = 3175 nodes + 566 ways + 4 rel; Apotheke = 655 nodes + 15 ways; Post = 212 nodes + 1 way. Die Ways/Relations bestätigen, dass `out center;`-Handling nötig ist (sonst ~15 % Verlust bei Lebensmittel).
- `pnpm data:fetch <3 slugs>` (slug-filter, MANIFEST-Merge): featureCount Lebensmittel 4117, Apotheke 761, Post 260 (bbox > admin area, inkl. Rand → höher als Admin-Count). Alle `geometryType: Point`.
- AC-2-Recompute: `pnpm data:kiez-scores` → `kiez-scores.json` Score-Werte bit-identisch (nur `generatedAt` differiert), abgeleitete Score-Layer unverändert. `kiez-scores.json` danach revertiert (war nur Verifikation).

### Completion Notes List

- **Bäcker-Entscheidung (AC-3):** `shop=bakery` in den Lebensmittel-Bucket gefaltet (Alltags-Grundversorgung), kein eigener Layer. In der Source-Kommentarzeile begründet.
- **Converter-Erweiterung (AC-4):** `overpass-to-geojson.ts` um `center`-Handling erweitert (`centerToFeature`): Ways/Relations aus `out center;` werden als Point ausgegeben. Additiv + rückwärtskompatibel (bestehende `out center`-Layer ohne Refetch unberührt). 3 neue Unit-Tests (Way-mit-center, Relation-mit-center, Relation-ohne-center).
- **Bundle:** `E: Soziale Infrastruktur` (bestehender `Bundle`-Union-Wert, keine Union-Erweiterung nötig).
- **mapRelevant: true, inspectorRelevant: false** je Layer. Wegen mapRelevant verlangt der `layer-explain.test.ts`-Coverage-Guard Einträge → `LAYER_EXPLAIN_DE` um 3 Einträge ergänzt (short ≤ 80, long ≤ 400, ODbL-Attribution).
- **POI_LAYERS-Vorverdrahtung:** 3 Slugs in `build-kiez-scores.ts` aufgenommen. Kein Score-Effekt, bis 12.1/12.2 `poi-density`-`LayerWeight` ergänzen (AC-2 erfüllt, Recompute-Diff = 0).
- **Verifikation:** `pnpm check` 0 Errors; Unit-Suite **2781/2781 grün** (inkl. layer-explain-Coverage-Guard, MANIFEST-abhängige Tests).
- Clubkataster / nicht-offene Quellen NICHT verwendet.

### File List

**Geändert:**
- `scripts/lib/sources.ts` (3 Nahversorgungs-Overpass-Sources)
- `scripts/lib/fetchers/overpass-to-geojson.ts` (`center`-Handling für Ways/Relations)
- `scripts/lib/fetchers/overpass-to-geojson.test.ts` (3 Tests)
- `scripts/build-kiez-scores.ts` (POI_LAYERS + 3 Slugs)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (3 LAYER_EXPLAIN_DE-Einträge)
- `static/layers/MANIFEST.json` (+3 Layer-Einträge)

**Neu (Fetch-Output):**
- `static/layers/nahversorgung-lebensmittel.83864ed6.geojson`
- `static/layers/nahversorgung-apotheke.6f78874d.geojson`
- `static/layers/nahversorgung-post.f2e0f21e.geojson`

## Change Log

- 2026-06-07: Story 12.0 erstellt (ready-for-dev). Daten-Foundation Epic 12: drei OSM-Nahversorgungs-Layer + PoiIndex-Registrierung. poi-density-Infrastruktur aus 10.4 wiederverwendet. Hard-Block für 12.1 + 12.2.
- 2026-06-07: Story 12.0 implementiert (→ review). 3 OSM-Sources (ODbL, Bundle E), `overpassToGeoJSON` um `center`-Handling erweitert (Ways/Relations als Point), Live-Fetch (4117/761/260 Features), POI_LAYERS-Vorverdrahtung (Recompute-Diff = 0), 3 LAYER_EXPLAIN_DE-Einträge. `pnpm check` 0 Errors, 2781/2781 Unit-Tests grün.
