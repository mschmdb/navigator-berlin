# Story 6.2: Wahlbezirks-Geometrie-Layer + Adress-Lookup (nur 2017+)

Status: review

<!-- Created 2026-05-18 nach Epic-6-Rewrite. Konsumenten: 6-3 (Inspector-Section), 6-4 (Detail-Page-Choropleth), 6-8 (WebMCP get_voting_district_geometry). Blocked by 6-0 (Schema). -->

## Story

As a Adress-Sucher,
I want dass für jede Adresse der korrekte Wahlbezirk pro Wahl ab 2017 bestimmt wird (pre-2017 fällt auf Bezirks-Aggregat zurück),
so that Wahlergebnisse präzise zugeordnet werden und das Inspector-Stimmbezirks-Level (Story 6.3) funktioniert.

## Quellen

- **daten.berlin.de Wahlbezirks-Datasets:**
  - BTW 2017: `https://daten.berlin.de/datensaetze/geometrien-der-wahlbezirke-fur-die-wahl-zum-19-deutschen-bundestag-in-berlin` (Stand 2017)
  - BTW 2021 + AGH 2021: `https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AH21.zip` (gemeinsam)
  - AGH 2023 (Wiederholung): `https://daten.berlin.de/datensaetze/geometrien-wahlbezirke-wiederholungswahl-abgeordnetenhaus-2023` (verifizieren)
  - BTW 2025: `https://daten.berlin.de/datensaetze/geometrien-der-wahlbezirke-fur-die-wahl-zum-21-deutschen-bundestag-in-berlin`
- **Memory `project_simplify_keep_shapes`:** mapshaper-simplify mit `keep-shapes` Pflicht (sonst Sliver-Loss).
- **Memory `project_odis_crs_mixed`:** Wahlbezirks-Geometrien typisch EPSG:25833 (UTM33N, ETRS89), Reprojection nötig.
- **Story 6.0:** Schema `stimmbezirk`-Tabelle als Konsumenten-Referenz.
- **Story 1.4 + 1.7:** existierende Point-in-Polygon-Lookup-Pattern reuse (`getLayersAtPoint`).

## Acceptance Criteria

**AC-1 (Manifest-Layer pro Wahl-Jahr 2017+):**

**Given** die daten.berlin.de Wahlbezirks-Geometrien (Shapefile, EPSG:25833)
**When** ich `scripts/fetch-wahlbezirks-geometries.ts` implementiere das pro Wahl-Jahr ab 2017 die Shapefile-ZIP herunterlädt, entpackt, mit `mapshaper` zu GeoJSON konvertiert (CRS-Reprojection → WGS84), mit `keep-shapes` simplifiziert (10 % Toleranz Initial) und in `static/layers/wahlbezirke-{jahr}-{typ}.{hash}.geojson` ablegt
**Then** Geometrien für 2017/2021/2023/2025 sind verfügbar (~500-900 KB pro Layer)
**And** MANIFEST.json wird um die neuen Layer erweitert (analog Virtual-Layer-Pattern Memory `project_virtual_layer_manifest`)

**AC-2 (Pre-2017-Fallback):**

**Given** pre-2017-Wahlen (2011/2013/2016) ohne separate Geometrie
**When** Schema-Aggregator (Story 6.0) für diese Wahlen läuft
**Then** Stimmbezirks-Records werden ohne räumlichen Centroid eingefügt (Centroid = null)
**And** Kiez-Aggregat-Tabelle bleibt leer für pre-2017-Wahlen
**And** Bezirks-Aggregat wird aus Stimmbezirks-ID-Bezirks-Präfix abgeleitet (siehe Story 6.0 AC-3)

**AC-3 (Adress-Lookup-Helper):**

**Given** die Geometrien + ein Punkt `(lat, lng)`
**When** ich `src/lib/data/get-wahlbezirk-at-point.ts` als Punkt-in-Polygon-Lookup analog `get-layers-at-point.ts` implementiere
**Then** Function liefert `Map<wahl_jahr, uwb_id | null>` für alle verfügbaren Wahl-Jahre
**And** Brandenburg-Punkte (außerhalb Berlin-BBox) liefern leere Map

**AC-4 (Inspector-Integration-Vorbereitung):**

**Given** Story-6.3-Konsument
**When** Inspector-Server-Load die Wahlbezirks-IDs für eine Adresse braucht
**Then** ein Helper `getWahlbezirksByYear(lat, lng)` liefert die Map effizient (Single-Polygon-Lookup pro Wahl-Jahr-Layer)
**And** Lookup-Performance: < 50ms für alle 4 Jahres-Layer (Spike-Verify)

**AC-5 (Tests):**

**Given** die Fetch-Pipeline + Lookup-Logic
**When** ich Tests anlege für:
- Fetch-Idempotenz (gleicher Input → gleicher Hash-Filename)
- mapshaper-Simplify-Validity (Keep-Shapes-Flag-Pflicht, kein Polygon-Loss)
- Punkt-in-Polygon-Korrektheit (3 Fixture-Adressen Berlin + 2 Brandenburg)
- pre-2017-Fallback-Verhalten (leere Map)
**Then** Coverage ≥ 90 % für Pure-Functions
**And** Smoke-Verify gegen Real-Data nach lokaler Pipeline-Run

## Tasks/Subtasks

- [ ] T1: `scripts/fetch-wahlbezirks-geometries.ts` mit pro-Jahr-Fetch + Shapefile→GeoJSON + Reprojection + mapshaper-simplify
- [ ] T2: MANIFEST.json-Augmentation für 4 neue Layer (2017/2021/2023/2025)
- [ ] T3: `src/lib/data/get-wahlbezirk-at-point.ts` Pure-Function + Tests
- [ ] T4: `src/lib/data/get-wahlbezirks-by-year.ts` Multi-Year-Lookup-Helper
- [ ] T5: Real-Run gegen 1 Jahr (z.B. 2021) lokal + Output-Validation
- [ ] T6: `docs/wahldaten-methodik.md`-Erweiterung um Geometrie-Coverage-Section + pre-2017-Fallback-Begründung
- [ ] T7: pnpm test:unit + pnpm check grün

## Dev Notes

- **Shapefile-Handling:** Node-Tooling via `mapshaper`-CLI (bereits in Story 1.25 verwendet). Reprojection via `mapshaper -i ... -proj wgs84 -o format=geojson`. Memory `project_simplify_keep_shapes` für `keep-shapes`-Flag-Pflicht.
- **Hash-Filename:** Konsistent mit Memory `project_virtual_layer_manifest` + Layer-Manifest-Pattern.
- **AGH-2023-Geometrie-Verfügbarkeit:** Verifizieren ob daten.berlin.de eigene Dataset oder ob AGH-2023 dieselbe Geometrie wie AGH-2021 nutzt (Wiederholungswahl, evtl. unverändert).
- **BVV-Geometrien:** BVV läuft parallel zu AGH (gleiche Wahltage), oft gemeinsamer Stimmbezirks-Schnitt. Verifizieren ob separate Geometrie nötig oder AGH-Layer reuse.
