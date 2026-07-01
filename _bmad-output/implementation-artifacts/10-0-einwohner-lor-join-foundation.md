# Story 10.0: Einwohner-LOR-Join-Foundation

Status: done

> **Anker:** Hard-Block für Story 10.1 (Kita-Plätze pro Kind) und Story 10.5 (Demografie-Block im Inspector). Ohne den Join-Datensatz aus dieser Story fehlt beiden der gemeinsame Nenner. Keine ADR existiert; diese Story entscheidet Schnitt + Schema des Join-Outputs.
>
> **Abhängigkeiten:** Keine offenen Vorgänger-Stories. Setzt auf bestehender LOR-Planungsraum-Pipeline (`lor-planungsraum` aus `scripts/lib/sources.ts:59`) und dem vorhandenen `GROESSE_M2`-Feld pro LOR-Feature (`scripts/build-layer-aggregates.ts:50`) auf.

## Story

As a Solo-Maintainer,
I want die Einwohner-CSV pro LOR-Planungsraum als joinbaren Demografie-Datensatz in die Pipeline holen,
so that Pro-Kopf-Metriken und ein Demografie-Kontext-Block eine einzige Datenquelle teilen.

## Acceptance Criteria

1. **AC-1 (Fetch + Parse):**
   **Given** die CSV „Einwohnerinnen und Einwohner in Berlin in LOR-Planungsräumen am 31.12.2024" (CC-BY, Amt für Statistik Berlin-Brandenburg, daten.berlin.de)
   **When** ein neues Script `scripts/fetch-einwohner.ts` (oder eine neue Funktion in einem lib-Modul) sie herunterlädt und parst
   **Then** entsteht ein typsicheres `EinwohnerRow`-Objekt pro CSV-Zeile mit mindestens: `lorId: string` (8-stellig), `gesamt: number`, und den Altersjahren als Rohdaten

2. **AC-2 (Altersjahr-Bucketing + Join):**
   **Given** die geparsten CSV-Zeilen
   **When** eine reine Transform-Funktion `joinEinwohnerToLor(rows, lorFeatures)` läuft
   **Then** entsteht pro `plr_id` (542 LOR) ein `LorEinwohnerRecord`:
   ```ts
   interface LorEinwohnerRecord {
     plrId: string;
     gesamt: number;
     kinder0bis6: number;
     kinder6bis12: number;
     senioren65plus: number;
     dichtePro_km2: number | null;
   }
   ```
   **And** `dichtePro_km2` ergibt sich aus `gesamt / (GROESSE_M2 / 1_000_000)`, wobei `GROESSE_M2` direkt aus dem LOR-GeoJSON-Feature kommt
   **And** LOR-IDs ohne CSV-Eintrag erhalten `null` statt einem Crash
   **And** LOR-IDs ohne `GROESSE_M2` oder mit `GROESSE_M2 <= 0` bekommen `dichtePro_km2: null`

3. **AC-3 (TDD, Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** Tests in `scripts/lib/einwohner/einwohner.test.ts` laufen
   **Then**:
   - Altersjahr-Bucketing (0-6, 6-12, 65+) ist mit mind. 3 Fällen getestet (typisch, Grenzjahre, leer)
   - Dichte-Berechnung ist getestet (Normal, GROESSE_M2=0, GROESSE_M2 fehlt)
   - Fehlende LOR-ID liefert `null`, kein throw
   - Unplausible CSV-Werte (negativ, NaN nach parseFloat) fallen auf `null`
   - Tests folgen Red-First (Failing-Commit vor Implementation)

4. **AC-4 (Output-Datei):**
   **Given** der Join läuft erfolgreich
   **When** das Script abgeschlossen ist
   **Then** schreibt es `static/data/einwohner-lor.json` (oder `.json.gz` falls >500KB):
   - Schema: `{ schemaVersion: 1, generatedAt: string, stichtag: "2024-12-31", records: LorEinwohnerRecord[] }`
   - Deterministische Reihenfolge (sort by `plrId`)
   - Datei liegt außerhalb von `static/layers/` (kein Manifest-Eintrag nötig)

5. **AC-5 (CC-BY-Attribution):**
   **Given** Lizenzpflicht CC BY 4.0 (Amt für Statistik Berlin-Brandenburg)
   **When** der Datensatz publiziert wird
   **Then** ist die Attribution in `/lizenzen` (`src/routes/(with-header)/lizenzen/+page.svelte`) als neuer Eintrag unter dem bestehenden „CC BY 4.0"-Block hinterlegt, mit Quelle-URL `daten.berlin.de` und Stichtag 31.12.2024

6. **AC-6 (pnpm-Script):**
   **Given** die neue Script-Datei existiert
   **When** `pnpm run fetch:einwohner` aufgerufen wird
   **Then** läuft das Script durch, schreibt die Output-Datei, und gibt eine Zeile `[einwohner] wrote N records` aus

## Tasks / Subtasks

- [ ] **Task 1: Types + Schema-Modul** (AC: #2)
  - [ ] 1.1 (RED) `scripts/lib/einwohner/einwohner.test.ts` anlegen: `LorEinwohnerRecord`-Interface testen, alle Bucket-Grenzen prüfen
  - [ ] 1.2 (GREEN) `scripts/lib/einwohner/einwohner.ts` anlegen: Interface `EinwohnerRow`, `LorEinwohnerRecord`, `bucketAltersjahre()`, `joinEinwohnerToLor()`
  - [ ] 1.3 Verify Red-First: Commit mit fehlschlagenden Tests, dann Commit mit Implementation

- [ ] **Task 2: CSV-Parser** (AC: #1)
  - [ ] 2.1 (RED) CSV-Parse-Test: valide Zeile → EinwohnerRow, leere Zelle → null, falsches Format → null
  - [ ] 2.2 (GREEN) `scripts/lib/einwohner/parse-csv.ts`: pure Funktion `parseEinwohnerCsv(raw: string): EinwohnerRow[]`
  - [ ] 2.3 Spaltennamen aus dem echten Download-Test bestätigen (Open-Question, siehe Dev Notes)

- [ ] **Task 3: Dichte-Berechnung** (AC: #2)
  - [ ] 3.1 (RED) Dichte-Tests: Normal / GROESSE_M2=0 / Feature fehlt → je ein Assertion
  - [ ] 3.2 (GREEN) `computeDichte(gesamt, areaM2OrNull)` als pure Funktion in `einwohner.ts`
  - [ ] 3.3 Verify: `GROESSE_M2` kommt aus LOR-GeoJSON-Property (bestehender Pfad `build-layer-aggregates.ts:50`), nicht aus Reprojektions-Fläche

- [ ] **Task 4: Script + Output** (AC: #4, #6)
  - [ ] 4.1 `scripts/fetch-einwohner.ts` schreiben: Download via `node:https`/fetch, Parse, Join gegen gecachte LOR-Features aus `static/layers/`
  - [ ] 4.2 Output nach `static/data/einwohner-lor.json` schreiben, Schema inkl. `schemaVersion` + `stichtag`
  - [ ] 4.3 `package.json`: Script `"fetch:einwohner": "tsx scripts/fetch-einwohner.ts"` ergänzen
  - [ ] 4.4 `.gitignore`-Prüfung: `static/data/` muss comittable sein (kein Exclude)

- [ ] **Task 5: Attribution** (AC: #5)
  - [ ] 5.1 `src/routes/(with-header)/lizenzen/+page.svelte`: neuen `<div>`-Block unter dem Wahldaten-/Statistik-Block einfügen (Einwohner LOR 31.12.2024, CC BY 4.0, Amt für Statistik Berlin-Brandenburg)
  - [ ] 5.2 `scripts/lib/types.ts`: `'CC BY 4.0'` ist bereits in `License`-Union (Zeile 13), kein Change nötig

## Dev Notes

### Ist-Zustand: LOR-Fläche aus GeoJSON

`scripts/build-layer-aggregates.ts:50` liest `GROESSE_M2` direkt aus dem LOR-Planungsraum-Feature:
```ts
return { plrId: p.PLR_ID, bez: p.BEZ, areaM2: p.GROESSE_M2 };
```

Das `lor-planungsraum`-GeoJSON kommt von ODIS in UTM33 (EPSG:25833) und wird von `fetch-static.ts:83-84` nach WGS84 reprojiziert. Die `GROESSE_M2`-Property im Original enthält die Fläche in m² im UTM33-System, was für Deutschland ausreichend genau ist. Die Dichte-Berechnung darf diese Property direkt nutzen, keine erneute Reprojektions-Flächen-Berechnung nötig.

Warum: `GROESSE_M2` ist eine offizielle Senatsvermessung. `@turf/area` auf dem WGS84-Polygon wäre alternativ möglich (wie in `aggregate-data.ts:272`), aber inkonsistent gegenüber dem bestehenden Pfad in `build-layer-aggregates.ts`. Einheitlichkeit geht vor.

### Ist-Zustand: plr_id als Join-Key

`scripts/lib/kiez-score/pipeline.ts:115-131` zeigt: `plr_id` (8-stellig, String) ist der kanonische Key für alle LOR-Joins. Die `defaultLorIdFor`-Funktion sucht Properties in dieser Reihenfolge: `plr_id`, `PLR_ID`, `PLR_NAME`, `spatial_alias`, `spatial_name`, `id`.

Der CSV-Join läuft als reiner Key-Merge (kein Spatial-Intersect), weil beide Seiten denselben LOR-Code tragen (Audit Teil 3, Zeile 137).

### Bonus: Vorhandenes `einwohner`-Feld in z_gesamt_umwelt2023

`scripts/lib/sources.ts:157-163` definiert den `umweltgerechtigkeit-2023`-Layer mit typeName `ua_umweltgerechtigkeit2023:z_gesamt_umwelt2023`. Dieser trägt bereits ein `einwohner`-Property pro LOR-PLR (Audit Teil 3, Zeile 139). Dieses Feld deckt aber nur den Gesamt-Einwohnerwert ab und hat keinen Stichtag-Nachweis für 2024. Die CSV ist die präzisere und datierbare Quelle. Das vorhandene Feld darf als Plausibilitäts-Kreuzcheck im Test genutzt werden (±10%), ersetzt aber nicht die CSV.

### Open Question: CSV-Spaltennamen

Die exakten Spaltennamen der CSV sind zum Zeitpunkt der Story-Erstellung nicht verifiziert (Audit, Offene Punkte, Zeile 258: "Einwohner-CSV-Spaltennamen exakt aus Metadaten-PDF holen"). Datensatz-URL: `https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-berlin-in-lor-planungsraumen-am-31-12-2024`.

Der Dev-Agent muss die CSV einmalig herunterladen und die Header-Zeile ausgeben, bevor er den Parser schreibt. Typische Felder im Amt-für-Statistik-Format:
- Raumid/RAUMID/PLR_ID (8-stellig) als Join-Key
- Spalten pro Altersjahr (0, 1, 2, ... 90+) oder Altersjahr-Gruppen
- `gesamt`/`Gesamt`/`insgesamt`

Der Parser muss flexibel gegen case-insensitive Header-Namen sein. **Das Interface `EinwohnerRow` darf erst finalisiert werden, wenn der Header bekannt ist.** Für die Tests: Fixture-CSV im Test anlegen (keine echten HTTP-Requests im Test).

### Neue Dateien (Schnitt)

```
scripts/lib/einwohner/
  einwohner.ts          # Interfaces + pure Funktionen (bucketAltersjahre, joinEinwohnerToLor, computeDichte)
  einwohner.test.ts     # TDD-Tests
  parse-csv.ts          # parseEinwohnerCsv(raw: string): EinwohnerRow[]
  parse-csv.test.ts     # CSV-Parse-Tests mit Fixture-Strings
scripts/fetch-einwohner.ts  # Runner-Script: Download, Parse, Join, Write
static/data/einwohner-lor.json  # Build-Artefakt
```

Kein neuer Eintrag in `scripts/lib/sources.ts`, weil die CSV kein GeoJSON ist und nicht in den `processLayer`-Flow passt. Das Script ist ein eigenständiger Fetch-Step analog zu `scripts/build-oepnv-stop-index.ts`.

### Architektur-Compliance

- Files <500 Zeilen (`scripts/lib/einwohner/einwohner.ts` bleibt pure Funktionen, Parser ist separates Modul)
- TS strict, kein `any` (CSV-Row-Types explizit typen, `unknown` + Guards statt any)
- Keine HTTP-Requests in Unit-Tests (Fixture-Strings, keine vi.mock auf globalThis.fetch)
- Fehler-Handling: fehlende/unplausible LOR loggt `[einwohner] warn: plrId X hat keinen CSV-Eintrag` und gibt `null` zurück, kein throw
- `static/data/` ist kein Layer-Verzeichnis: kein Manifest-Eintrag, kein Hash-Filename (das File ist stabil und deterministisch aus der CSV)

### Was nicht brechen darf

- `pnpm test` (alle Vitest-Tests) bleibt grün nach Task 1-3
- `pnpm check` bleibt im aktuellen Zustand (keine neuen TypeScript-Errors)
- `fetch-static.ts` und `build-kiez-scores.ts` sind nicht berührt
- `scripts/lib/types.ts`: `License`-Union braucht keinen Change (`'CC BY 4.0'` existiert bereits, Zeile 13)

### Previous Story Intelligence

- **Story 9.1:** `scripts/lib/kiez-score/`-Modul als Vorbild für Modul-Schnitt (reine Funktionen, separate Types, TDD-First). Gleichen Stil übernehmen.
- **Story 1.28:** `lor-planungsraum` als Build-Only-Datensatz etabliert. `GROESSE_M2`-Feld aus ODIS-GeoJSON ist der bewährte Flächen-Wert.
- **Story 2.9a:** `aggregate-scores.ts:81` zeigt, wie `PLR_ID`/`BEZ`/`GROESSE_M2` aus LOR-Features extrahiert werden. Muster direkt übernehmen statt neu erfinden.
- **Memory `project_odis_crs_mixed`:** `lor_planungsgraeume_2021` kommt in UTM33, wird aber von `fetch-static.ts` nach WGS84 reprojiziert. Die gecachten GeoJSON-Files in `static/layers/` sind bereits WGS84. `GROESSE_M2` ist dennoch die Senatsvermessung in m², nicht die Turf-berechnete Fläche des reprojiziertes Polygons.

## References

- [Source: _user-input/datenaufloesung-audit-2026-05-21.md, Teil 3, Zeilen 123-139]
- [Source: _user-input/datenaufloesung-audit-2026-05-21.md, Offene Punkte, Zeilen 255-261]
- [Source: scripts/fetch-static.ts] (Struktur des Runner-Scripts als Vorbild)
- [Source: scripts/build-layer-aggregates.ts:45-60] (GROESSE_M2-Extraktion, PLR_ID-Pattern)
- [Source: scripts/aggregate-scores.ts:71-82] (planungsraumLikeFromFeature als Vorbild)
- [Source: scripts/lib/kiez-score/pipeline.ts:115-131] (plr_id als kanonischer Join-Key)
- [Source: scripts/lib/kiez-score/lor-hierarchy.ts:17-21] (PlanungsraumLike-Interface)
- [Source: scripts/lib/sources.ts:59-70] (lor-planungsraum Source-Config)
- [Source: scripts/lib/types.ts:13] (License-Union, CC BY 4.0 bereits vorhanden)
- [Source: src/routes/(with-header)/lizenzen/+page.svelte:266-286] (Einfüge-Punkt Attribution)
- [Source: _bmad-output/planning-artifacts/epics.md:3412-3430] (Story-ACs aus Epic 10)
- [Source: _bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md] (Format-Vorbild)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- CSV-Hash-URL via Playwright-Recon (opendata-URL = Scrivito-JS-Redirect → HTML). Real: download.statistik-berlin-brandenburg.de/bf57f8f2d002dca0/cf0bcd27e257/EWR_L21_202412E_Matrix.csv
- einwohner-Tests 20/20, voller Server-Suite 1976/1976, pnpm check 0 Errors

### Completion Notes List

- CSV-Spaltennamen verifiziert: RAUMID (Join-Key), E_E (gesamt), E_E*-Altersspalten. Buckets: 0-6 = E_EU1+E_E1U6, 6-12 = E_E06_07+E_E07_08+E_E08_10+E_E10_12, 65+ = E_E65U80+E_E80U110.
- `static/data/einwohner-lor.json`: 542 Records. **Scope-Erweiterung (User-Request):** zusätzlich Jugend-/Altenquotient + Erwerbsanteil.
- **Scope-Erweiterung (User-Request):** neutraler Map-Layer `einwohner-dichte-2024` (choropleth-dichte, scaleStrukturell, kein Score-Input) in neuer Bundle-Gruppe `I: Demografie`. Plumbing: types/manifest/manifest-schema-Picklists, BUNDLE_ORDER/LABEL/RANK, sections, url-state, palette-Name, layer-explain, style-builder + cascade.
- 1 LOR (06200318) in CSV ohne Geometrie-Match → dichte null, graceful.
- CC BY 4.0 Attribution unter neuer Demografie-Section in /lizenzen.
- Inspector-Demografie-Block (reiche Darstellung) bleibt Story 10.5.

### File List

**Neu:** scripts/lib/einwohner/{einwohner,parse-csv}.ts + Tests, scripts/fetch-einwohner.ts, static/data/einwohner-lor.json, static/layers/einwohner-dichte-2024.*.geojson
**Geändert:** scripts/lib/{types,manifest}.ts, fetch-einwohner (dichte-Layer-Augment), package.json (fetch:einwohner), src layer-explain/sections/layer-order-sorting/layer-palette-filter(+test)/layer-style-builder(+test)/layer-style-cascade/manifest-schema/url-state, lizenzen, MANIFEST.json
