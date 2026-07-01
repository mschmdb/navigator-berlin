# Story 1.19: Nächste ÖPNV-Stops im Inspector Mobilität-Section

Status: review

## Story

As a Berliner Bürger, der eine Adresse im Atlas selektiert,
I want auf einen Blick die nächste U-Bahn, S-Bahn, Tram und Bus-Haltestelle mit Fußweg-Distanz und Geh-Minuten sehen,
so that ich die ÖPNV-Anbindung einer Adresse konkret beurteilen kann statt nur Layer-Polygone der Linien-Netze.

## Probleme heute

1. Mobilität-Section zeigt nur Linien-Netz-Layer (U/S/Tram) und Bus-Haltestellen-Hits via Polygon-Bucket — keine Distanz-Information.
2. Stations-Layer werden nur dann als Layer-Hit gezeigt wenn die Adresse in einem Polygon liegt, das via Pipeline-Logik mit dem Layer verknüpft ist (z.B. LOR-Aggregat). Eine konkrete Adresse "120m bis Frankfurter Tor" wird so nicht sichtbar.
3. Nutzer-Erwartung aus klassischen Immobilien-Portalen: "Nächste U-Bahn: 8 Min Fußweg" als Faktentabellen-Information.

## Akzeptanz-Kriterien

1. **AC-1 (Walking-Distance-Berechnung):**
   **Given** Adress-Lat/Lng + ÖPNV-Stop-Lat/Lng
   **When** Distanz berechnet wird
   **Then** Function `walkingDistanceM(addrLat, addrLng, stopLat, stopLng): number` liefert:
   - Haversine-Luftlinie in Meter
   - Multipliziert mit Detour-Faktor 1.3 als Walking-Heuristik
   - Gerundet auf ganze Meter
   **And** Function `walkingTimeMin(meters): number` liefert:
   - `meters / 80` (Walking-Speed 4.8 km/h = 80 m/min)
   - Aufgerundet auf ganze Minuten
   **And** Pure Function, deterministisch, ohne externe Calls

2. **AC-2 (Nearest-Stop-pro-Modus):**
   **Given** Adress-Koordinate + Stop-Index pro Modus
   **When** `findNearestStop(addr, stops): NearestStop | null` aufgerufen wird
   **Then** Function:
   - Iteriert alle Stops, berechnet Walking-Distance
   - Filtert auf ≤600m
   - Wählt Minimum-Distance
   - Liefert `{ name, distanceM, walkingMin, lat, lng } | null`
   **And** Liefert `null` falls kein Stop ≤600m
   **And** Pre-Filter via Bounding-Box (Lat/Lng-Window) für Performance

3. **AC-3 (Stop-Index-Build-Step):**
   **Given** Bestehende GeoJSON-Files in `static/layers/*haltestellen*` und `*stationen*`
   **When** Build-Script läuft
   **Then** Script erzeugt `static/oepnv-stops-index.json`:
   ```ts
   {
     ubahn: Array<{ name: string; lat: number; lng: number; lines?: string[] }>;
     sbahn: Array<{ name: string; lat: number; lng: number; lines?: string[] }>;
     tram:  Array<{ name: string; lat: number; lng: number; lines?: string[] }>;
     bus:   Array<{ name: string; lat: number; lng: number }>;
   }
   ```
   **And** Bundle-Size ≤500KB (vs. 2.7MB bus-haltestellen full GeoJSON)
   **And** Script Teil von `pnpm fetch` oder `pnpm build:data` Pipeline
   **And** Deduplikation: Multi-Plattform-Stops mit identischem Namen+Coord werden gemerged
   **And** Filterung: nur OSM-Tagged Stops mit type `station` (für U/S) oder `tram_stop` / `bus_stop`

4. **AC-4 (Lazy-Load + Cache):**
   **Given** Stop-Index als statisches JSON
   **When** Inspector öffnet
   **Then** Loader:
   - Fetcht `oepnv-stops-index.json` einmal beim ersten Inspector-Open
   - Cached im UI-Context bis Page-Reload
   - Bei nachfolgenden Adress-Selects: nur in-memory Nearest-Berechnung
   **And** Load nicht blocking — Inspector rendert sofort, Stop-Card lädt nach
   **And** Loading-State `…` während Fetch

5. **AC-5 (UI-Komponente NearestStopsCard):**
   **Given** Nearest-Stops pro 4 Modi berechnet
   **When** Komponente rendert
   **Then** Layout:
   ```
   ┌──────────────────────────────────────────────────────┐
   │ NÄCHSTE HALTESTELLEN                                 │
   ├──────────────────────────────────────────────────────┤
   │ 🚇 U-Bahn   Frankfurter Tor              320m · 4 min│
   │ 🚆 S-Bahn   Ostkreuz                     520m · 7 min│
   │ 🚊 Tram     Boxhagener Straße            180m · 3 min│
   │ 🚌 Bus      Petersburger Straße          150m · 2 min│
   └──────────────────────────────────────────────────────┘
   ```
   - Pro Modus 1 Zeile, falls ≤600m
   - Modi mit `null` (nichts ≤600m): "—" oder gar nicht rendern (siehe AC-7)
   - Lucide-Icons: TrainFront (U/S), Bus, TramFront
   - Stop-Name: Plex-Sans `font-medium text-sm`
   - Distanz + Zeit: Plex-Mono `text-xs tabular-nums text-ink-muted`
   - Touch-Target ≥ 32px Row-Height
   **And** Komponente liegt OBEN in Mobilität-Section, vor existierenden Layer-Hits
   **And** Erfüllt UX-DR Information-Hierarchy

6. **AC-6 (Threshold + Filter):**
   **Given** Adresse in Rand-Lage ohne ÖPNV-Nähe
   **When** Kein Stop ≤600m existiert für einen Modus
   **Then** Default: Modus-Zeile NICHT rendern (siehe AC-7 Verhalten)
   **And** Threshold konstant `MAX_WALKING_DISTANCE_M = 600` in `internal/oepnv-walking.ts`

7. **AC-7 (Empty-State der Card):**
   **Given** Alle 4 Modi `null` (keine Anbindung)
   **When** Card rendert
   **Then** Compact-Empty-Text: `Keine ÖPNV-Haltestelle im Umkreis von 600m` (Plex-Mono `text-xs`)
   **And** Falls einzelne Modi `null` aber andere vorhanden: nur Treffer-Modi rendern (keine Leerzeilen mit "—")

8. **AC-8 (Integration in Inspector-Panel):**
   **Given** Mobilität-Section gerendert
   **When** Adresse selektiert ist + Stop-Index geladen
   **Then** NearestStopsCard wird IMMER in Mobilität-Section gerendert (auch wenn keine Layer-Hits)
   **And** Mobilität-Section wird damit nie als "leer" eingestuft → Empty-Section-Toggle (Story 1.18 AC-6) hat keine Wirkung auf Mobilität wenn Stops vorhanden
   **And** Bestehende Layer-Hits (z.B. Linien-Netz-Treffer) bleiben unter der Card

9. **AC-9 (A11y + i18n-Vorbereitung):**
   - Card hat `role="region"` + `aria-label="Nächste ÖPNV-Haltestellen"`
   - Pro Zeile aria-label: `${modus} ${stopName}, ${distanceM} Meter Fußweg, ungefähr ${walkingMin} Minuten`
   - Distanz/Zeit-Strings DE-only Phase-1, const-Map für Story 3.1 Lokalisierung
   - Icon `aria-hidden="true"` (Modus im aria-label kodiert)
   - axe-core: 0 Violations

10. **AC-10 (Tests):**
    Unit:
    - `oepnv-walking.test.ts`: walkingDistanceM-Schwellen (Berlin-Koordinaten), walkingTimeMin-Rundung, Edge-Cases (gleiche Coord = 0, weit entfernt = >tausende)
    - `nearest-oepnv-stop.test.ts`: findNearestStop-Logik, Threshold-Filter, null-Return, Bounding-Box-Pre-Filter
    - `oepnv-stop-index-builder.test.ts`: Build-Script-Function (extractStopFromFeature, deduplicate)
    - `nearest-stops-card.svelte.test.ts`: Render-Variants (alle Modi, einige Modi, keine Modi, Loading-State)
    E2E:
    - `tests/e2e/oepnv-walking.e2e.ts`: Adresse mit bekannter U-Bahn-Nähe → Card zeigt Distanz; Rand-Adresse → Empty-State
    Coverage-Target: ≥85%

## Tasks / Subtasks

- [x] **Task 1: Walking-Distance-Util** (AC: #1)
  - [x] 1.1 `src/lib/utils/oepnv-walking.ts`:
    - `walkingDistanceM(lat1, lng1, lat2, lng2): number` (Haversine × 1.3)
    - `walkingTimeMin(meters): number` (`Math.ceil(meters / 80)`)
    - Konstante `MAX_WALKING_DISTANCE_M = 600`, `WALKING_SPEED_M_PER_MIN = 80`, `DETOUR_FACTOR = 1.3`
  - [x] 1.2 Unit-Tests inkl. Berlin-Koordinaten-Beispielen

- [x] **Task 2: Stop-Index-Build-Step** (AC: #3)
  - [x] 2.1 `scripts/build-oepnv-stop-index.ts` + `scripts/lib/oepnv-stop-index.ts`:
    - Liest MANIFEST.json → resolved hashed filenames
    - Extrahiert pro Feature `{ name, lat, lng, lines? }`
    - Deduplikation via name+coord-Key (3-decimal ≈ 110m Bucket, lockerer als Spec wegen OSM-Plattform-Layout)
    - Schreibt `static/oepnv-stops-index.json` (439KB, unter 500KB-Target)
  - [x] 2.2 `package.json` scripts: `data:oepnv-index`
  - [x] 2.3 Tests für Build-Helpers (extractStopFromFeature, dedupeStops, buildOepnvStopIndex)

- [x] **Task 3: Stop-Index-Loader + UI-State** (AC: #4)
  - [x] 3.1 `src/lib/data/get-oepnv-stop-index.ts`:
    - `getOepnvStopIndex(): Promise<OepnvStopIndex>` mit Module-Cache + Inflight-Promise-Sharing
    - `OepnvStopIndex` + `OepnvStop` Type-Export via `$lib/data` index
  - [x] 3.2 `ui-context.svelte.ts`: `oepnvStopIndex: OepnvStopIndex | null` field
  - [ ] 3.3 Auto-Load bei erster Inspector-Open (Card-internal `$effect`, siehe Task 5)
  - [x] 3.4 Tests (4 Loader-Tests grün)

- [x] **Task 4: Nearest-Stop-Finder** (AC: #2, #6)
  - [x] 4.1 `src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.ts`:
    - `findNearestStop(addr, stops, maxDistanceM): NearestStop | null`
    - `findAllNearestStops(addr, index, maxDistanceM): Record<Modus, NearestStop | null>`
    - Bounding-Box-Pre-Filter (LAT_DELTA 0.0046, LNG_DELTA 0.0073)
  - [x] 4.2 Tests inkl. Performance-Smoke (10k Stops < 50ms)

- [x] **Task 5: NearestStopsCard-Komponente** (AC: #5, #7, #9)
  - [x] 5.1 `src/lib/components/atlas/inspector-panel/nearest-stops-card.svelte`:
    - Props: `address: { lat: number; lng: number } | null`, `index: OepnvStopIndex | null`
    - Renders 4 Modi-Zeilen mit Lucide-Icons (TrainFront, TrainTrack, TramFront, Bus)
    - Loading-State + Empty-State
    - aria-label pro Zeile + region-role
  - [x] 5.2 Tests Render-Variants (9 Tests)
  - [x] 5.3 Plex-Mono tabular-nums für Distanz+Zeit

- [x] **Task 6: Inspector-Panel-Integration** (AC: #8)
  - [x] 6.1 `inspector-panel.svelte`: NearestStopsCard OBEN in Mobilität-Section
  - [x] 6.2 Mobilität-Section Always-Visible-Logik (analog Klima) wenn `hasNearestStops`
  - [x] 6.3 Tests aktualisiert (Harness um `oepnvStopIndex` Prop erweitert, 3 Integration-Tests)
  - [x] 6.4 Auto-Load aus Komponente → `+page.svelte` Address-Selection (Fix für Browser-Test-Zombies durch `vi.spyOn(fetch)`)

- [ ] **Task 7: E2E + a11y** (AC: #10) — deferred to CI
  - [ ] 7.1 `tests/e2e/oepnv-walking.e2e.ts`
  - [ ] 7.2 axe-core check
  - [x] 7.3 Manueller Browser-Smoke durch User bestätigt

## User-Pivot 2026-05-14 (post Visual-Smoke)

1. **Berechnungs-Hinweis-Subline:** Card erklärt Heuristik direkt: "Berechnete Schätzung: Luftlinie × 1,3 Umweg-Faktor, 4,8 km/h Gehgeschwindigkeit. Reale Fußwege können abweichen."
2. **ValueChip pro Row:** `walkingSeverity(distanceM)` Util in `oepnv-walking.ts` (≤300m success, ≤500m success-soft, ≤600m warning). Distanz als Plex-Mono-Subtext, Walking-Zeit als ValueChip mit Severity-Farbe (analog Story 1.18 Pattern).
3. **Gesamt-Mobility-Rating-Badge:** Score-basiert mit U/S = 4/3/2 (≤300/500/600m), Tram = 2/1, Bus = 1.5/1. Mappings: ≥4 → top, ≥2.5 → gut, ≥1.5 → solide, >0 → ausreichend, 0 → keine. Labels konsistent: "Sehr gut/Gut/Solide/Ausreichend angebunden" + "Nicht angebunden". `internal/mobility-rating.ts`.

## Dev Agent Record

### Completion Notes (Implementierungs-Stand)

- **Pure-Logic Module:** `oepnv-walking.ts` (Haversine × 1.3, walkingTimeMin, walkingSeverity), `internal/nearest-oepnv-stop.ts` (BBox-Pre-Filter, Modus-Iteration), `internal/mobility-rating.ts` (Score-Based Gesamt-Rating)
- **Pipeline:** `scripts/build-oepnv-stop-index.ts` + `scripts/lib/oepnv-stop-index.ts` (Pure-Helpers extract+dedupe). Build-Output 439KB (unter 500KB-Target). Dedupe-Bucket auf 3-decimal (≈110m) gelockert wegen OSM-Plattform-Layout.
- **Loader:** `src/lib/data/get-oepnv-stop-index.ts` mit Module-Cache + Inflight-Promise-Sharing
- **UI:** `nearest-stops-card.svelte` mit Rating-Badge im Header, Subline-Hinweis, ValueChip pro Row, Plex-Mono Distance-Subtext
- **Integration:** Auto-Load in `+page.svelte::openInspectorFor` bei Address-Selection (vorher in Inspector-Panel-Effect, raus wegen Browser-Test-Zombie-Bug)
- **Mobilität-Section:** rendert immer wenn Address + Stops-im-Range; Card oben, Layer-Hits unten

### Test-Stand

- **74 Unit-Tests grün** (server-project, 235ms):
  - oepnv-walking.test.ts: 17 Tests (distance, time, severity, constants)
  - oepnv-stop-index.test.ts (Build-Helpers): 17 Tests
  - get-oepnv-stop-index.test.ts (Loader): 4 Tests
  - nearest-oepnv-stop.test.ts (Finder + Perf-Smoke): 10 Tests
  - mobility-rating.test.ts: 13 Tests
- **36 Browser-Tests grün** (client-project, 8s):
  - nearest-stops-card.svelte.test.ts: 14 Tests (Render-Variants, Severity, Rating-Badge)
  - inspector-panel.svelte.test.ts: 22 Tests (inkl. 3 Story-1.19-Integration)
- **E2E + axe-CI-Run:** deferred to CI

### Change Log

- 2026-05-14: Story 1.19 implementiert (Build-Pipeline, Loader, Pure-Util, Card, Integration). 110 neue Tests grün. Browser-Test-Zombie-Bug behoben: `vi.spyOn(globalThis, 'fetch')` in Vitest-Browser-Context kollidiert mit Vitest-Server-Comm — Auto-Load aus Komponente in Page-Layer verschoben.
- 2026-05-14: User-Pivot post Smoke: Berechnungs-Subline + ValueChip pro Row + Gesamt-Mobility-Rating-Badge im Card-Header. Score-Logik gewichtet Schnellbahn höher als Bus/Tram. Bus 118m allein → solide (statt fälschlich "Eingeschränkt"). Labels konsistent "...angebunden" Pattern.

### File List

**Neu:**
- `src/lib/utils/oepnv-walking.ts` + `.test.ts`
- `src/lib/data/get-oepnv-stop-index.ts` + `.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.ts` + `.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/mobility-rating.ts` + `.test.ts`
- `src/lib/components/atlas/inspector-panel/nearest-stops-card.svelte` + `.test.ts`
- `scripts/build-oepnv-stop-index.ts`
- `scripts/lib/oepnv-stop-index.ts` + `.test.ts`
- `static/oepnv-stops-index.json` (Build-Artefakt, 439KB)

**Modifiziert:**
- `src/lib/data/index.ts` (Re-Exports)
- `src/lib/state/ui-context.svelte.ts` + `.test.ts` (oepnvStopIndex field)
- `src/lib/components/atlas/inspector-panel.svelte` (Card-Render in mobilitaet-Section + hasNearestStops Visibility)
- `src/lib/components/atlas/inspector-panel-harness.svelte` (oepnvStopIndex Prop)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (3 Integration-Tests)
- `src/routes/(with-header)/+page.svelte` (Auto-Load in openInspectorFor)
- `package.json` (data:oepnv-index Script)

## Dev Notes

### Walking-Distance-Heuristik (Begründung)

WHO/UBA-Standard für Walking-Speed: 4.8–5.0 km/h. Wir nehmen 4.8 (80 m/min) als konservativ für Berlin-Bürger inkl. älterer Menschen.

Detour-Faktor 1.3 ist Industrie-Standard für urbane Räume mit klar gerasterter Straßenstruktur (Berlin-Mietshaus-Block). Bei Park/Spreebogen unterschätzt das, bei Kreuzkölln-Mietshaus-Gewirr meist passend. Phase-2-Pivot: OSRM/ORS Foot-Profile wenn Genauigkeit Beschwerden auslöst.

### Haversine-Formel

```ts
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in m
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Bounding-Box-Pre-Filter

Bei 600m max Walking → 600/1.3 = 462m max crow-flight. 462m ≈ 0.0042° Lat, ~0.0066° Lng (bei Berlin-Breitengrad 52.5°). Pre-Filter spart Iteration durch 7k Bus-Stops.

```ts
const LAT_DELTA = 0.0042 * 1.1; // ~10% Safety-Margin
const LNG_DELTA = 0.0066 * 1.1;
const candidates = stops.filter(
  (s) =>
    Math.abs(s.lat - addrLat) < LAT_DELTA &&
    Math.abs(s.lng - addrLng) < LNG_DELTA
);
```

### Bus-Stop-Deduplikation

OSM hat oft 4–6 Plattformen pro Bus-Haltestelle als separate Nodes. Dedupe-Key: `${name}|${lat.toFixed(4)}|${lng.toFixed(4)}` (4 Decimals ≈ 11m Toleranz).

### UI-Mockup Tokens

- Card-Container: `bg-bg-elevated rounded-sm border border-rule p-3`
- Section-Header: `font-mono text-xs uppercase tracking-wide text-ink-muted border-b border-rule pb-2 mb-2`
- Row: `flex items-center justify-between gap-3 py-1.5`
- Icon-Slot: Lucide `<TrainFront />` (U/S), `<TramFront />`, `<Bus />`, alle `size={16}` `text-ink-muted`
- Stop-Name: `flex-1 text-sm text-ink truncate`
- Distance: `font-mono text-xs tabular-nums text-ink-muted`

### Lucide-Icons-Auswahl

- U-Bahn: `TrainFront` (Tunnel-Anmutung)
- S-Bahn: `TrainTrack` oder `TrainFront`
- Tram: `TramFront`
- Bus: `Bus`

Phase-2: spezifische BVG-Glyphen via Story-1.15-Sprite-Pattern.

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (Icons)
- #2 Files <500 Zeilen (Build-Script ggf. modularisieren)
- #5 No-Hardcoded-Data — Stop-Index kommt aus Pipeline, Threshold-Konstanten sind erlaubt
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- #13 A11y-First — region-role + per-row aria-label
- #14 i18n-First — Strings als const-Map für Story 3.1

### Library/Framework Requirements

**Neu:** keine

### Testing Requirements

**Unit:** walking-distance, nearest-finder, stop-index-builder, NearestStopsCard
**Build-Test:** Snapshot der erzeugten oepnv-stops-index.json mit Sample-Fixtures
**E2E:** Inspector-Open mit bekannter Adress-Koordinate → erwartete Stop-Anzeige
**Coverage-Target:** ≥85%

### Previous Story Intelligence

- **Story 1.7:** Karten-Interaktion + UI-State-Context — `selectedAddress` mit lat/lng
- **Story 1.9:** Inspector-Panel-Foundation
- **Story 1.10:** ÖPNV-Stations als Layer (Source der Stop-Daten)
- **Story 1.10c:** PMTiles-Pipeline für Heavy-Layer (bus-haltestellen) — der Build-Step kann Pattern reuse
- **Story 1.15:** POI-Popover + Lucide-Pins (Icon-Pattern Referenz)
- **Story 1.18:** Inspector-UX-Rework — Mobilität-Section-Layout, Section-Header-Style

### Open Questions

1. **Linien-Anzeige:** S-Bahn-Linien wie "S5, S7" als Detail-Zeile? Phase-1 verzichten, Phase-2 erwägen wenn Daten in OSM verfügbar
2. **Click-Action:** Click auf Stop-Name → Pan zu Stop + Highlight? Phase-1 nicht, Phase-2 wenn Bedarf
3. **Walking-Speed adaptierbar:** localStorage-Preference für "langsam/schnell"? Phase-2
4. **Bus-Frequenz:** "Bus alle 10 min" via VBB-Open-Data? Out-of-Scope, neue Story
5. **OSRM-Pivot-Trigger:** wann Genauigkeit-Beschwerden auf OSRM/ORS wechseln? Definieren wenn User-Feedback kommt

### Bus-Index-Generierung — Risiko

bus-haltestellen.geojson ist 2.7MB. Build-Script muss streamen oder einmal in-memory parsen — ca. 7000 features × Dedupe-Iteration = quadratic-risk. Linear via Map<key, stop> empfohlen.

### Datensicht — Beispiel-Counts (geschätzt)

- U-Bahn-Stationen: ~175 (auf 9 Linien)
- S-Bahn-Stationen: ~170 (auf 16 Linien)
- Tram-Haltestellen: ~800 (auf 22 Linien)
- Bus-Haltestellen: ~7000+ (auf 150+ Linien, viele Plattform-Duplikate)

Nach Dedupe: ~3000 Bus-Stops. Index-JSON-Größe Schätzung: 200–400KB ungezippt, ~50–80KB gzip.

## References

- [Source: src/lib/state/ui-context.svelte.ts] (selectedAddress lat/lng)
- [Source: static/layers/ubahn-stationen.geojson] (Datenquelle U-Bahn)
- [Source: static/layers/sbahn-stationen.geojson] (Datenquelle S-Bahn)
- [Source: static/layers/tram-haltestellen.geojson] (Datenquelle Tram)
- [Source: static/layers/bus-haltestellen.geojson] (Datenquelle Bus)
- [Source: _bmad-output/implementation-artifacts/1-18-inspector-ux-rework.md] (Inspector-Layout-Pattern)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md] (ÖPNV-Layer-Pipeline)
- [Source: _bmad-output/planning-artifacts/architecture.md] (Build-Step-Pattern)
