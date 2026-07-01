# Story 10.9: Gefühlte Temperatur · flächendeckend (Straße + Grünfläche mergen)

Status: done

> **Anker:** Score-unabhängiger Quick-Win. Keine Epic-9-Abhängigkeit, keine Epic-10-Abhängigkeiten. Sofort implementierbar. Kernänderung: `scripts/lib/sources.ts` + `scripts/fetch-static.ts` + ein neues Merge-Utility in `scripts/lib/`. TDD-Pflicht nach ADR-012 für die Merge-Logik (Business-Logic).

## Story

As a User,
I want eine PET-Karte ohne Lücken,
so that ich die Hitzebelastung überall sehe, nicht nur auf Wohnblöcken.

## Kontext

Der Klimaanalyse-WFS (`ua_klimaanalyse_2022`) publiziert PET in drei überschneidungsfreien Flächen-Varianten. Alle tragen dasselbe Feld `pet14h` (°C). Die aktuelle Pipeline fetcht nur `pa_ua_pet_siedlg_2022` (Siedlung). Straßenraum und Grün-/Freiflächen bleiben leer.

| typeName | Fläche | Status |
|---|---|---|
| `pa_ua_pet_siedlg_2022` | Siedlung | genutzt (Zeile 238 `sources.ts`) |
| `pb_ua_pet_str_2022` | Straßenraum | ungenutzt |
| `pc_ua_pet_grfrei_2022` | Grün-/Freifläche | ungenutzt |

Die drei Layer bilden zusammen eine vollständige, überschneidungsfreie Partition Berlins (abzüglich Wasserflächen). `pb` + `pc` fetchen und mit `pa` mergen ergibt eine lückenlose PET-Karte. Normalisierung (`numeric-inverted pet14h`, `bestAt: 29`, `worstAt: 41`) bleibt unverändert. Der `nearestPolygonFallbackKm: 0.05`-Workaround greift seltener, weil Adressen im Straßenraum nun direkt treffen.

**Nicht Teil dieser Story:** UTCI (`ra/rb/rc_ua_utci_2022`) als alternativer Index, separat spike-würdig.

## Acceptance Criteria

1. **AC-1 (Merge: vollständig + überschneidungsfrei):**
   **Given** der Klimaanalyse-WFS publiziert PET in drei Flächen-Varianten (`pa`/`pb`/`pc`) mit identischem `pet14h`-Feld (live geprüft 2026-05-21)
   **When** ich `pb_ua_pet_str_2022` und `pc_ua_pet_grfrei_2022` zusätzlich fetche und mit `pa_ua_pet_siedlg_2022` zu einem Layer merge
   **Then** PET deckt Berlin flächendeckend ab (Siedlung + Straße + Grünfläche = vollständige, überschneidungsfreie Partition), die Lücken im Screenshot entfallen

2. **AC-2 (Score-Hit-Rate steigt):**
   **Given** der gemergte Layer
   **When** die Score-Berechnung den PET-Hit für eine Adresse im Straßenraum oder Hof liest
   **Then** Adressen treffen direkt häufiger (Straßenraum und Freiflächen jetzt abgedeckt), der `nearestPolygonFallbackKm`-Workaround greift seltener

3. **AC-3 (Dateivolumen: Simplify-Profil geprüft):**
   **Given** der Merge die Feature-Zahl deutlich erhöht (3 Quellen statt 1)
   **When** die Pipeline `simplifyGeoJSON` ausführt
   **Then** bleibt `simplifyProfile: 'polygon'` mit `keep-shapes` (analog Story 1.25, Zeile 11 `simplify.ts`), Ausgabedatei-Größe wird nach dem Fetch geloggt und liegt unter 5 MB

4. **AC-4 (Rest-Lücken: Layer-Text erklärt Gewässer):**
   **Given** Rest-Lücken (Wasserflächen ohne PET-Polygon) bleiben nach dem Merge
   **When** der Layer aktiv ist
   **Then** erklärt der `long`-Text in `layer-explain.ts` (Zeile 84ff) explizit, dass Gewässer keinen PET-Wert tragen, kein Datenfehler

## Tasks / Subtasks

- [ ] **Task 1: Merge-Utility (TDD RED → GREEN)** (AC: #1)
  - [ ] 1.1 (RED) `scripts/lib/merge-geojson.test.ts` schreiben:
    - Test: Merge von 2 FeatureCollections ergibt Features beider, keine Duplikate
    - Test: Merge von 3 FeatureCollections (Partition-Vollständigkeit): Feature-Count = Summe der Quellen
    - Test: Leere FeatureCollection als Input bleibt stabil (kein Absturz)
    - Test: Properties-Durchreichung: `pet14h` bleibt auf allen Features erhalten
    - Verify dass alle 4 Tests FAIL (`pnpm test:unit -- merge-geojson`)
  - [ ] 1.2 (GREEN) `scripts/lib/merge-geojson.ts` implementieren:
    - Funktion `mergeFeatureCollections(collections: FeatureCollection[]): FeatureCollection`
    - TS strict: kein `any`, `FeatureCollection` aus `geojson`-Package typen
    - Datei <50 Zeilen
  - [ ] 1.3 Tests grün verifizieren (`pnpm test:unit -- merge-geojson`)

- [ ] **Task 2: Fetch-Pipeline erweitern** (AC: #1, #3)
  - [ ] 2.1 `scripts/lib/types.ts`: `SourceConfig`-Interface um `additionalTypeNames?: string[]` erweitern (Zeile 35, nach `typeName?: string`)
  - [ ] 2.2 `scripts/fetch-static.ts`: `fetchSource`-Funktion anpassen (Zeile 33ff):
    - Wenn `source.additionalTypeNames` gesetzt: alle typeNames parallel fetchen (`Promise.all`)
    - Ergebnisse via `mergeFeatureCollections` zusammenführen
    - Danach weiter wie bisher (reproject → simplify → manifest)
    - Kommentar: erklärt WHY (drei Partitions-Layer → ein merged Output)
  - [ ] 2.3 `scripts/lib/sources.ts`: `klima-pet-2022`-Eintrag (Zeile 234ff) erweitern:
    - `additionalTypeNames: ['ua_klimaanalyse_2022:pb_ua_pet_str_2022', 'ua_klimaanalyse_2022:pc_ua_pet_grfrei_2022']`
    - `nearestPolygonFallbackKm: 0.05` bleibt (Straßenraum-Adressen können trotzdem randnah sein)
    - Kommentar aktualisieren: Story 1.25 und diese Story referenzieren
  - [ ] 2.4 (Optionaler Check) Feature-Count vor/nach Simplify loggen:
    - Im `processLayer`-Flow nach `simplifyGeoJSON`: `console.log([fetch] ${slug}: ${preCount} → ${postCount} features)`
    - Prüfen ob Ausgabedatei unter 5 MB bleibt

- [ ] **Task 3: Layer-Text aktualisieren** (AC: #4)
  - [ ] 3.1 `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` Zeile 84ff:
    - `long`-Text für `'klima-pet-2022'` erweitern: Gewässer-Erläuterung ergänzen
    - Beispiel: `„Gewässer (Seen, Kanäle) tragen keinen PET-Wert; diese Flächen bleiben auf der Karte leer."`
    - Kein em-dash, <20 Wörter pro Satz

- [ ] **Task 4: Integrations-Smoke + Docs** (AC: #1, #2, #3)
  - [ ] 4.1 Fetch manuell ausführen: `pnpm data:fetch klima-pet-2022` (lokal, nicht im CI-Pflicht)
    - Ausgabe: Neue Datei in `static/layers/klima-pet-2022.*.geojson`, höhere Feature-Zahl als Vorgänger
    - Größe: `ls -lh static/layers/klima-pet-2022.*.geojson` → unter 5 MB dokumentieren
  - [ ] 4.2 `doc:story-map` + `doc:pipelines` ausführen (CLAUDE.md-Pflicht nach jeder Story)
  - [ ] 4.3 `_user-input/datenaufloesung-audit-2026-05-21.md` Zeile 221ff: Befund B2 als "Fixed in Story 10.9" markieren (manuell, kurzer Kommentar)

## Dev Notes

### Ist-Zustand (was existiert)

**`scripts/lib/sources.ts` Zeilen 233-249:**
```ts
{
    slug: 'klima-pet-2022',
    kind: 'fis-broker',
    sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022',
    typeName: 'ua_klimaanalyse_2022:pa_ua_pet_siedlg_2022',   // nur Siedlung!
    license: 'dl-de/zero-2-0',
    bundleGroup: 'C: Umwelt',
    zoomThresholds: { min: 11, max: 18 },
    simplifyProfile: 'polygon',
    sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
    nearestPolygonFallbackKm: 0.05
}
```

**`scripts/lib/simplify.ts` Zeilen 10-11:**
```ts
case 'polygon':
    return '-simplify visvalingam 20% planar keep-shapes -clean';
```
`keep-shapes` ist bereits aktiv. Story 1.25 hat dokumentiert: ohne `keep-shapes` verliert das `boundary`-Profil 24% der Features. `polygon`-Profil hat `keep-shapes` bereits. Kein Risiko.

**`scripts/fetch-static.ts` Zeilen 33-51:** `fetchSource` liest genau ein `typeName`. Kein Multi-Fetch-Mechanismus vorhanden. Erweiterungspunkt ist klar (nach dem `case 'fis-broker':`-Block, oder davor mit `additionalTypeNames`-Guard).

**`scripts/lib/types.ts` Zeile 35:** `typeName?: string` in `SourceConfig`. Hier `additionalTypeNames?: string[]` einfügen.

**`scripts/lib/kiez-score/dimension-config.ts` Zeilen 26-30:**
```ts
{
    layer: 'klima-pet-2022',
    weight: 0.15,
    normalize: { kind: 'numeric-inverted', field: 'pet14h', bestAt: 29, worstAt: 41 }
}
```
Normalisierung bleibt unverändert. Kein Eingriff in Score-Logik nötig.

**`src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` Zeilen 83-89:**
```ts
'klima-pet-2022': {
    short: 'Gefühlte Temperatur an Hitzetagen um 14 Uhr (Klimaanalyse 2022)',
    long: 'Physiologisch Äquivalente Temperatur (PET) als Maß für die gefühlte Hitzebelastung ...',
    unit: '°C',
    valueScaleExplain: 'unter 32 °C neutral, 32 bis 41 °C warm bis heiß, über 41 °C extrem heiß'
}
```
`long`-Text muss Gewässer-Erläuterung ergänzen.

### Was nicht brechen darf

- `scripts/lib/kiez-score/` komplett unberührt: kein Eingriff in Normalisierung, Score-Berechnung, Dimension-Config
- `layer-compare.ts` (Zeile 52: `'klima-pet-2022': 'numeric-lower-better'`, Zeile 107: `['pet14h']`): unveränderter Slug, kein Eingriff nötig
- `layer-style-builder.ts` (Zeile 83: `'klima-pet-2022': 'choropleth-pet'`): unveränderter Slug, keine Änderung
- `choropleth-family.ts` (Zeile 64: `'equal-interval'`): unveränderter Slug, keine Änderung
- Alle bestehenden Unit-Tests müssen nach dieser Story noch grün sein

### Merge-Strategie

Keine externe Library nötig. Die drei Quellen sind überschneidungsfrei (laut Audit 2026-05-21 live geprüft). Merge = Features konkatenieren:

```ts
// scripts/lib/merge-geojson.ts
import type { FeatureCollection, Feature } from 'geojson';

export function mergeFeatureCollections(collections: FeatureCollection[]): FeatureCollection {
    const features: Feature[] = collections.flatMap((fc) => fc.features);
    return { type: 'FeatureCollection', features };
}
```

Dieses Muster reicht für den Anwendungsfall. `turf` oder `mapshaper`-Merge braucht es nicht, da die Quellen per Berliner Senat garantiert überschneidungsfrei sind.

### fetch-static.ts Erweiterungspunkt

`fetchSource` (Zeile 33) für `fis-broker` erweitern. Einfachste Variante ohne Umstrukturierung:

```ts
case 'fis-broker': {
    if (!source.typeName) throw new Error(`${slug}: typeName required for fis-broker`);
    const primary = await fetchFisBrokerWfs(source.sourceUrl, source.typeName);
    if (!source.additionalTypeNames?.length) {
        return { raw: primary, sourceUrl: source.sourceUrl };
    }
    const extras = await Promise.all(
        source.additionalTypeNames.map((tn) => fetchFisBrokerWfs(source.sourceUrl, tn))
    );
    const merged = mergeFeatureCollections(
        [primary, ...extras].map((r) => JSON.parse(r) as FeatureCollection)
    );
    return { raw: JSON.stringify(merged), sourceUrl: source.sourceUrl };
}
```

Wichtig: Import von `mergeFeatureCollections` und `FeatureCollection` ergänzen.

### keep-shapes: kein zusätzlicher Handlungsbedarf

`simplify.ts` Zeile 11: `polygon`-Profil gibt bereits `keep-shapes -clean` aus. Bei deutlich mehr Features (3× Quellen) bleibt das korrekt. Kein Code-Eingriff nötig. Nach dem Fetch Datei-Größe manuell prüfen (Task 4.1).

### Architektur-Compliance

- **Rule #2** Dateien <500 Zeilen: `merge-geojson.ts` wird <50 Zeilen
- **Rule #7** TS strict, kein `any`: `FeatureCollection`, `Feature` aus `geojson` typen
- **Rule #6** Kommentar nur für non-obvious WHY: erklären warum 3 typeNames → 1 Output
- **Rule #15** Editorial: kein neuer Score-Input, keine inhaltliche Änderung, reine Abdeckungs-Verbesserung

### Previous Story Intel

- **Story 1.25:** PET-Feature-Loss durch fehlende `keep-shapes`. `boundary`-Profil verlor 24% Features. `polygon`-Profil hat `keep-shapes` bereits (Zeile 11 `simplify.ts`). Kein Risiko für diese Story, dennoch Datei-Größe nach Fetch dokumentieren.
- **Story 9.1:** `klima-pet-2022` in `GRUEN_HITZE_CONFIG` mit `numeric-inverted`, `pet14h`, `bestAt: 29`, `worstAt: 41`. Slug + Normalisierung bleiben identisch.

### WFS-Endpunkt (live verifiziert 2026-05-21)

```
https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022
  ?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0
  &TYPENAMES=ua_klimaanalyse_2022:pb_ua_pet_str_2022
```
```
https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022
  ?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0
  &TYPENAMES=ua_klimaanalyse_2022:pc_ua_pet_grfrei_2022
```
Gleicher Basis-Endpoint wie `pa`, gleiche Lizenz `dl-de/zero-2-0`.

## References

- [Source: scripts/lib/sources.ts] Zeilen 233-249 (`klima-pet-2022`)
- [Source: scripts/lib/types.ts] Zeilen 31-62 (`SourceConfig`)
- [Source: scripts/fetch-static.ts] Zeilen 33-51 (`fetchSource`)
- [Source: scripts/lib/simplify.ts] Zeilen 1-39 (`simplifyCommand`, `simplifyGeoJSON`)
- [Source: scripts/lib/kiez-score/dimension-config.ts] Zeilen 11-34 (`GRUEN_HITZE_CONFIG`)
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts] Zeilen 83-89
- [Source: _user-input/datenaufloesung-audit-2026-05-21.md] Zeilen 221-235 (Befund B2)
- [Source: _bmad-output/planning-artifacts/epics.md] Zeilen 3572-3598 (Story 10.9 + Sequencing)
- [Source: docs/adr/ADR-012-tdd-mandate.md] (TDD-Pflicht für Merge-Logik)
- [Memory: project_simplify_keep_shapes] (keep-shapes-Pflicht, Story 1.25)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

<!-- RED: /tmp/vitest-red-10-9.log -->
<!-- GREEN: /tmp/vitest-green-10-9.log -->
<!-- Fetch-Check: ls -lh static/layers/klima-pet-2022.*.geojson -->

### Completion Notes List

- Merge-Utility `mergeFeatureCollections` (TDD, 4/4 grün), <15 Zeilen, kein `any`, geojson-typisiert.
- `SourceConfig.additionalTypeNames?: string[]` ergänzt. `fetchSource` (fis-broker) fetcht primary + extras parallel, merged via Utility, loggt Feature-Count.
- `klima-pet-2022` mergt pb (Straßenraum) + pc (Grünfläche) zu pa (Siedlung). `nearestPolygonFallbackKm: 0.05` bleibt (Randlagen an Gewässern).
- `simplifyProfile: 'polygon'` mit keep-shapes unverändert (Story 1.25), kein Code-Eingriff.
- Layer-Text PET um Gewässer-Erläuterung erweitert (Seen/Kanäle tragen keinen Wert).
- Score-Modul/Normalisierung/Compare/Style unberührt (gleicher Slug + pet14h).
- `pnpm check` 0 Errors, scripts-Suite 243/243 grün.
- **Größen-Pivot (User-Decision):** Live-Fetch ergab 57.801 Features, als GeoJSON 22 MB (15.5 MB property-stripped). Simplify hilft nicht (Größe = Feature-Anzahl). Umstellung auf PMTiles via tippecanoe → 7.5 MB. AC-3 (<5 MB GeoJSON) durch PMTiles-Pfad ersetzt.
- Neue SourceConfig-Felder `tileMinZoom`/`tileMaxZoom`/`tileIncludeProperties`, in `fetch-static.ts` an tippecanoe gereicht. klima-pet: minzoom 9 / maxzoom 13 / nur pet14h.
- **Overview-Fix:** Erst minzoom 11 → Layer verschwand bei Berlin-Übersicht (z10), da keine Tiles unter z11. Auf tileMinZoom 9 (Map-minZoom-Floor) gesenkt. MapLibre over-zoomt über z13.
- Erster Produktiv-PMTiles-Layer. Frontend-Pfad (Protocol-Registrierung, vector-source, source-layer=slug, pmtilesQuery-Inspector) war bereits aus früherer Arbeit verdrahtet. PMTiles-Metadaten verifiziert: layer-id `klima-pet-2022`, Feld `pet14h:Number`, z9-13.
- **Owner-Followup:** Visueller Browser-Check (PET-Fill rendert bei Übersicht + Detail, Inspector-Hit). PMTiles-Render nur via Metadaten geprüft, nicht im Browser. Befund B2 im Audit als "Fixed 10.9" markieren.

### File List

**Neu (Implementation):**
- `scripts/lib/merge-geojson.ts`

**Neu (Tests):**
- `scripts/lib/merge-geojson.test.ts`

**Geändert:**
- `scripts/lib/types.ts` (`additionalTypeNames` in `SourceConfig`)
- `scripts/lib/sources.ts` (`klima-pet-2022`: `additionalTypeNames` ergänzt)
- `scripts/fetch-static.ts` (`fetchSource`: Multi-typeName-Support)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (Gewässer-Erläuterung)

## Change Log

- 2026-05-21: Story 10.9 erstellt. Quick-Win: drei PET-Partitions-Layer zu einem lückenlosen Output mergen.
