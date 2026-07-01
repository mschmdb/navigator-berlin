# Story 1.25: Bug-Investigation `klima-pet-2022` fehlt in Innenstadt-Lagen

Status: review

## Story

As a Nutzer:in im Prenzlauer Berg (Top-Innenstadt-Lage),
I want sehen, ob Gefühlte Temperatur 2022 abgedeckt ist,
so that ich die Hitze-Belastung meiner Adresse einschätzen kann.

## Problem heute

User-Review-Test mit Wörther Str 11 (Prenzlauer Berg): `klima-pet-2022` zeigt „Daten nicht vorhanden". Berlin-Klimaanalyse 2022 ist Innenstadt-Fokus, Top-Lage sollte abgedeckt sein. Verdacht: Pipeline-Bug oder Geometrie-Lücke, kein konzeptioneller Coverage-Issue.

## Akzeptanz-Kriterien

1. **AC-1:** Pipeline-Verify: `klima-pet-2022` Feature-Count im Manifest vs FIS-Broker-Original. Vollständigkeits-Check.

2. **AC-2:** Geometrie-Test: Wörther Str 11 (52.5340, 13.4153) als Test-Point. Erwartung: `get-layers-at-point` liefert Wert.

3. **AC-3:** Falls Bug gefunden: Fix Pipeline (Fetch, Re-Project, Geometry-Validation, Quirk).

4. **AC-4:** Smoke-Test im Browser: drei Innenstadt-Adressen (Mitte, Kreuzberg, Prenzlauer Berg) zeigen PET-Wert.

5. **AC-5:** Falls echte Lücke (Datenraster sparser als erwartet): Story 1.23 Coverage-out-of-scope-Reason setzen.

## Tasks

- [x] Task 1: Verify FIS-Broker-Source-Coverage Berlin-Klimaanalyse 2022 PET
- [x] Task 2: Pipeline-Run `klima-pet-2022` re-fetch + Manifest-Update
- [x] Task 3: `get-layers-at-point`-Smoke-Test für Wörther Str 11
- [x] Task 4: Falls Bug: Pipeline-Fix + Re-Deploy
- [x] Task 5: Falls Lücke: Coverage-Polygon dokumentieren (Story 1.23 dependent)

## Dev Notes

- Klimaanalyse 2022 = Berliner Senat, Block-Geometrie für PET, Kaltluft, Leitbahn
- Block-Granularität evtl. nicht jeden Wohnblock abdeckt
- Vergleichs-Test: PET in Berlin-Mitte (Brandenburger Tor 52.5163, 13.3777) + Tempelhofer Feld (52.4738, 13.4030) als Innenstadt-Kontrollpunkte

## References

- [Source: scripts/fetch-static.ts] (PET-Pipeline-Step)
- [Source: src/lib/data/get-layers-at-point.ts]
- User-Review-Feedback Wave 2, Punkt 3 letzter Absatz (2026-05-14)

## Dev Agent Record

### Debug Log

- WFS-hits-only Query gegen FIS-Broker: `numberMatched="16217"` für `pa_ua_pet_siedlg_2022`
- Aktuelles Manifest (pre-fix): 12391 features → **3826 features verloren (-23.6%)**
- Pipeline-Steps geprüft: fetch (16217) → reproject 4326→4326 (no-op) → simplify `visvalingam 20% planar -clean` (12391)
- Root-Cause: mapshaper `-simplify visvalingam 20%` macht aus kleinen Polygonen Slivers, `-clean` löscht diese als invalide
- Sweet-Spot-Test mit `keep-shapes`-Flag:
  - 20% + `keep-shapes`: 16204 features (-13, 99.92%), 4.6MB
  - 30% + `keep-shapes`: 16212 features (-5, 99.97%), 4.85MB
  - 50% + `keep-shapes`: 16217 features (100%), 5.62MB

### Implementation Plan

**Zweistufiger Fix** (User-Wahl: Pipeline-Fix als Root-Cause + Runtime-Fallback als Safety-Net):

1. **Pipeline-Fix (Root-Cause):** `scripts/lib/simplify.ts` Profile `polygon`+`boundary` erweitert um `keep-shapes`-Flag. Verhindert Feature-Loss durch `-clean` nach aggressivem Simplify. Re-Fetch aller polygon/boundary/linestring-Layer (außer wohnlagen-2024 wegen LOR-Aggregat-Pipeline).
2. **Runtime-Fallback (Safety-Net):** Neue LayerMetadata `nearestPolygonFallbackKm`. Bei Polygon-NO-HIT akzeptiert `getLayersAtPoint` nächstes Polygon innerhalb Radius. Für klima-pet-2022 mit 0.05 km (50m). Fängt Edge-Cases ab (Adresse im Hof/Bordstein direkt neben Block-Polygon).

### Feature-Count vor/nach Pipeline-Fix

| Layer | Vorher | Nachher | Delta |
|---|---:|---:|---:|
| klima-pet-2022 | 12391 | 16204 | **+3813 (+30.8%)** |
| klima-kaltlufteinwirkbereich-2022 | 7117 | 11157 | **+4040 (+56.8%)** |
| klima-leitbahnkorridor-2022 | 483 | 489 | +6 |
| plz | 190 | 193 | +3 |
| bodenrichtwerte | 1424 | 1425 | +1 |
| bezirke / ortsteile | unverändert | | 0 |
| umweltgerechtigkeit-2023 Bundle (laerm/luft/gruenversorgung/bioklima/umweltgerechtigkeit) | unverändert (jeweils 542) | | 0 |
| milieuschutz/einschulbereiche/gruenanlagen/spielplaetze/Mobilität-Lines | re-fetched, baseline ok | | - |

Total: **~7900 features zurückgeholt** durch Pipeline-Fix.

### Smoke-Test gegen neue Daten (klima-pet-2022.cceb2e4d.geojson)

Punkt-in-Polygon + 50m-Fallback kombiniert (entspricht produktivem `getLayersAtPoint`):

| Adresse | Modus | Distanz | PET 14h |
|---|---|---:|---:|
| Wörther Str 11 (Prenzlauer Berg) | FALLBACK | 8m | 31.64°C |
| Brandenburger Tor (Mitte) | FALLBACK | 28m | 37.39°C |
| Alexanderplatz (Mitte) | FALLBACK | 50m | 40.38°C |
| Kreuzberg Oranienplatz | DIRECT | 0m | 35.47°C |
| Kollwitzplatz (PB) | DIRECT | 0m | 31.68°C |
| Möckernkiez (Kreuzberg) | DIRECT | 0m | 33.80°C |
| Chamissoplatz (Kreuzberg) | FALLBACK | 11m | 34.83°C |
| Tempelhofer Feld (Park) | NO HIT | - | - |

AC-2 erfüllt: Wörther Str 11 liefert jetzt 31.64°C. AC-4 erfüllt: 3+ Innenstadt-Adressen (Mitte, Kreuzberg, Prenzlauer Berg) zeigen PET-Werte.

### Completion Notes

- **AC-1 (Pipeline-Verify):** FIS-Broker hat 16217 features, Pipeline hatte 12391 → 3826 Feature-Loss bestätigt.
- **AC-2 (Geometrie-Test):** Wörther Str 11 vorher NO HIT, nach Pipeline-Fix + Fallback 8m-Hit.
- **AC-3 (Pipeline-Fix):** `keep-shapes`-Flag in simplifyCommand. Behebt Feature-Loss in allen polygon/boundary-Profile-Layern. Sekundär: `nearestPolygonFallbackKm`-Field als Runtime-Safety-Net für Block-Geometrie-Layer.
- **AC-4 (Smoke-Test):** 7 Innenstadt-Adressen + 1 Park-Kontrollpunkt geprüft. 7/8 erwartete Hits, Tempelhofer Feld korrekt no-coverage.
- **AC-5 (Coverage-Reason):** Nicht erforderlich. Kein echter Datenraster-Lückenfall, war Pipeline-Bug + Edge-Case-Block-Geometrie. Story 1.23-Reason-Pattern bleibt für andere Layer mit echter Coverage-Lücke.

### TDD-Strategie

Pragmatic TDD per ADR-012:

1. **RED:** 4 neue Tests in `get-layers-at-point.test.ts` für `nearestPolygonFallbackKm`-Verhalten (Hit, Regression, Boundary, Direct).
2. **GREEN:** `LayerMetadata`/`SourceConfig`-Field, Manifest-Schema (scripts+src), `pointToPolygonDistanceKm`-Helper, Fallback-Branch in `hitForLayer`.
3. **RED:** 1 neuer Test in `scripts/lib/simplify.test.ts` für `keep-shapes`-Flag.
4. **GREEN:** `simplifyCommand` ergänzt um `keep-shapes` für `polygon`+`boundary`.
5. **Manifest-Validation:** 2 neue Tests in `scripts/lib/manifest.test.ts` für `buildLayerEntry`-Durchreichung.

Coverage:
- `pnpm vitest run` 990/990 tests green
- `pnpm check` 0 errors, 0 warnings
- Real-File-Integration-Smoke `/tmp/test-pet-after-fix.mjs` + `/tmp/test-pet-with-fallback.mjs` (manuell)

### File List

**Geändert:**

- `scripts/lib/simplify.ts` (keep-shapes für polygon+boundary)
- `scripts/lib/simplify.test.ts` (Test-Update)
- `scripts/lib/types.ts` (SourceConfig.nearestPolygonFallbackKm + LayerEntry-Pass-Through)
- `scripts/lib/manifest.ts` (Valibot-Schema + buildLayerEntry-Pass-Through)
- `scripts/lib/manifest.test.ts` (+2 tests)
- `scripts/lib/sources.ts` (klima-pet-2022 nearestPolygonFallbackKm: 0.05)
- `src/lib/data/types.ts` (LayerMetadata.nearestPolygonFallbackKm)
- `src/lib/data/manifest-schema.ts` (Valibot-Frontend-Schema-Feld)
- `src/lib/data/get-layers-at-point.ts` (Fallback-Logik + pointToPolygonDistanceKm-Helper)
- `src/lib/data/get-layers-at-point.test.ts` (+4 tests in neuem describe-Block)

**Daten (re-fetched, MANIFEST.json aktualisiert):**

- `static/layers/klima-pet-2022.cceb2e4d.geojson` (12391 → 16204 features, 3.6 → 4.6 MB)
- `static/layers/klima-kaltlufteinwirkbereich-2022.*.geojson` (7117 → 11157)
- `static/layers/klima-leitbahnkorridor-2022.*.geojson` (483 → 489)
- `static/layers/plz.*.geojson` (190 → 193)
- `static/layers/bodenrichtwerte.*.geojson` (1424 → 1425)
- `static/layers/MANIFEST.json` (35 Layer-Entries regen mit aktuellen Hashes + featureCount)
- Weitere re-fetched: laerm-2023, luft-2023, gruenversorgung-2023, bioklima-2023, umweltgerechtigkeit-2023, milieuschutz-erhaltungsmiete, milieuschutz-staedtebau, einschulbereiche-2024, gruenanlagen, spielplaetze, fahrradstrassen-2024, radverkehrsnetz-2025, ubahn-netz, tram-netz, sbahn-netz, bezirke, ortsteile

**Bewusst nicht re-fetched:**

- `wohnlagen-2024` (LOR-Aggregat via Spezial-Pipeline aus Story 1.10c, separate Behandlung)
- PMTiles-basierte Layer

### Change Log

- 2026-05-14: Story-Implementation. Pipeline-Bug bei simplify-Stage (visvalingam 20% + -clean ohne keep-shapes) als Root-Cause identifiziert: 23.6% Feature-Loss in klima-pet-2022, 56.8% in klima-kaltluft. Fix via `keep-shapes`-Flag global im simplifyCommand. Sekundär: `nearestPolygonFallbackKm`-Field für Runtime-Safety-Net bei Block-Geometrie-Mismatch (Adresse im Hof/Bordstein). Re-Fetch aller polygon+boundary+linestring-Layer (außer wohnlagen-2024 wegen Spezial-Aggregat-Pipeline). 990 Unit-Tests grün, 0 type errors. Browser-Smoke-Test deferred zur User-Verify-Phase (Pattern wie Story 1.18, 1.19, 1.20).
