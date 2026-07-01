# Story 15.1: Kühle-Orte-Daten-Build (Merge + Anreicherung)

Status: review

> **Anker:** ADR-012 (Pragmatic TDD), Epic 15 (Kühle Orte im Atlas), Product Brief „Kühle Orte Berlin". Strukturell analog `scripts/build-klima-pet-points.ts` (Build-Input-GeoJSON, kein Client-Fetch). Diese Story baut nur das gemergte GeoJSON. Pipeline-Integration (`kind: 'local'`, MANIFEST, Lizenz, Config-Registrierung) folgt in Story 15.2.
> **Hard-Block:** Fundament für 15.2 (Layer-Integration) und 15.3 (Inspector). Voraussetzung: committete Daten `static/data/kuehle-orte/enrichment.json` + `places-osm.json` (beide vorhanden, 659 Objekte).

## Story

As a Solo-Maintainer,
I want ein deterministisches Build-Script, das OSM-Geometrie und die redaktionelle Anreicherung per `id` zu einem sauberen, gefilterten GeoJSON merged,
so that der `kuehle-orte`-Layer auf geprüften Daten steht und Navi-Deep-Links pro Ort bereit liegen.

## Kontext: Warum dieser Change

Zwei committete Datensätze beschreiben dieselben 659 Orte: `enrichment.json` (redaktionelle Anreicherung: Name, Typ, Kühle-Score, AC-Status, Zugang, Öffnungszeiten-Notiz, verifizierte Adresse, `suitable`, `still_exists`) und `places-osm.json` (OSM-Geometrie: `lat`/`lon`, Adresse, PLZ, `oh`, `wheelchair`, `ac`, `website`). Join-Key ist `id` in der Form `node/29040741` oder `way/456`.

Der Layer braucht ein GeoJSON-FeatureCollection mit Punkt-Geometrie aus `places-osm.json` und allen Anreicherungs-Feldern als Properties. Ungeeignete (`suitable=false`) und nicht mehr existierende (`still_exists=no`) Orte dürfen nicht in den Layer (FR12). Jeder Ort bekommt zwei Navi-Deep-Links als Properties (FR4): Google Maps und Apple Maps.

Vorbild ist `scripts/build-klima-pet-points.ts`: ein schlankes Build-Script, das einen Build-Input-GeoJSON nach `static/data/` schreibt, kein Client-Layer-Fetch. Die Pipeline-Registrierung (`kind: 'local'`, Hash, MANIFEST) übernimmt Story 15.2.

## Acceptance Criteria

1. **AC-1 (Merge per `id`):**
   **Given** `static/data/kuehle-orte/enrichment.json` (659 angereicherte Orte) und `places-osm.json` (Geometrie)
   **When** `scripts/build-kuehle-orte.ts` läuft
   **Then** entsteht ein GeoJSON-`FeatureCollection`, gejoint per `id` (`type/osmId`), mit Punkt-Koordinaten `[lon, lat]` aus `places-osm.json` und allen Anreicherungs-Feldern als Feature-Properties.

2. **AC-2 (Qualitäts-Filter mit Logging):**
   **Given** die Qualitäts-Flags
   **When** gemerged wird
   **Then** werden Features mit `suitable === false` oder `still_exists === 'no'` ausgefiltert, und die ausgefilterte Anzahl wird je Grund geloggt (kein stiller Verlust). Erwartung beim aktuellen Stand: 519 Features bleiben, 140 fallen weg.

3. **AC-3 (Navi-Deep-Links als Properties):**
   **Given** jeder behaltene Ort
   **When** das Feature gebaut wird
   **Then** werden zwei Navi-Deep-Links als Properties erzeugt: Google (`https://www.google.com/maps/dir/?api=1&destination=LAT,LON`) und Apple (`https://maps.apple.com/?daddr=LAT,LON`), mit `LAT,LON` aus der Geometrie.

4. **AC-4 (TDD):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** sind Join-Treffer/Misses, Filter-Logik (beide Gründe einzeln + Überschneidung), Navi-Link-Erzeugung und Edge-Cases (fehlende/nicht-numerische Koordinaten, leeres Set, `id` ohne Geometrie-Match) getestet, kein Crash bei Lücken
   **And** `pnpm test:unit` für die neuen Files 100% grün.

## Tasks / Subtasks

- [x] **Task 1: Navi-Deep-Link-Erzeugung** (AC: #3, #4)
  - [x] 1.1 (RED) `scripts/lib/kuehle-orte/navi-links.test.ts`: 3 Tests, lat,lon-Reihenfolge, kein Rundungs-Drift, Abgrenzung zur GeoJSON-Reihenfolge.
  - [x] 1.2 (GREEN) `scripts/lib/kuehle-orte/navi-links.ts`: `buildNaviLinks`, reines Modul, 18 LOC.
- [x] **Task 2: Merge- und Filter-Logik** (AC: #1, #2, #4)
  - [x] 2.1 (RED) `scripts/lib/kuehle-orte/merge.test.ts`: 8 Tests inkl. Treffer-Join `[lon,lat]`, beide Filter-Gründe, Überschneidung (einmal gezählt), id ohne Match, nicht-numerische Koordinaten, leeres Set, Reihenfolge-Determinismus.
  - [x] 2.2 (GREEN) `scripts/lib/kuehle-orte/merge.ts`: `mergeKuehleOrte`, Präzedenz-Filter (suitable vor still_exists), Properties-Mapping Enrichment + OSM-only (`oh`/`wheelchair`/`plz`), Navi-Links, kein `any`, 137 LOC.
- [x] **Task 3: Orchestrator-Script** (AC: #1, #2, #3)
  - [x] 3.1 (GREEN) `scripts/build-kuehle-orte.ts`: liest beide JSONs, ruft `mergeKuehleOrte`, schreibt `static/data/kuehle-orte.geojson`, loggt je Grund. `main()` + `import.meta.url`-Guard + `process.exit(1)`. 49 LOC.
  - [x] 3.2 npm-Script `data:kuehle-orte` in `package.json`.
- [x] **Task 4: Abschluss** (AC: #4)
  - [x] 4.1 Neue Tests grün (11/11), `pnpm check` 0 Errors / 0 Warnings (6307 Files).
  - [x] 4.2 Live-Lauf `pnpm data:kuehle-orte`: 519 behalten / 140 weg (ungeeignet 140, tot 0, ohne Geometrie 0), exakt wie erwartet. Output-File `static/data/kuehle-orte.geojson` geschrieben.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Datenfiles vorhanden + committet:** `static/data/kuehle-orte/enrichment.json` (659 Objekte, Array) und `places-osm.json` (659 Objekte, Array). Beide tragen `id` in der Form `node/29040741`. Join ist 1:1: 0 Enrichment-Objekte ohne Place-Match, 0 gematchte Places ohne numerische `lat`/`lon`.
- **Enrichment-Felder:** `id, name, cat, suitable (bool), suitable_reason, cool_score (1-5), ac_status, ac_source, is_free (frei|ticket|…), summer_available (yes|no), opening_hours_note, address_verified, website, still_exists (yes|no), notes`.
- **Place-Felder:** `id, cat, name, lat (number), lon (number), addr, plz, oh, wheelchair, ac, website`.
- **Filter-Zählung am Ist-Stand:** `suitable=false` 140, `still_exists='no'` 11. Kombiniert eindeutig 140 Wegfälle (alle 11 `still_exists=no` liegen innerhalb der 140 `suitable=false`). Behalten: 519. Der Test muss die Überschneidung abdecken, damit nicht doppelt gezählt wird.
- **Kategorien (`cat`):** Kino, Bibliothek, Museum, Kaufhaus, Mall/Center, Bad, Schwimmzentrum, Eishalle, Wasserpark.
- **Vorbild-Build-Script:** `scripts/build-klima-pet-points.ts` schreibt einen Build-Input-GeoJSON nach `static/data/` (`main()` + `import.meta.url`-Guard + `JSON.stringify` ohne Pretty-Print). Koordinaten via `round(n, 5)`. Dieses Muster übernehmen.
- **GeoJSON-Typen:** `import type { Feature, FeatureCollection, Point } from 'geojson'` (bereits projektweit genutzt, siehe `build-klima-pet-points.ts` Zeile 3).
- **SourceConfig.kind** in `scripts/lib/types.ts` Zeile 21 ist aktuell `'fis-broker' | 'odis' | 'overpass' | 'dwd'`. Kein `'local'`. Das ist bewusst Scope von Story 15.2, NICHT dieser Story.

### Design-Entscheidung: Build-Input-GeoJSON, keine Pipeline-Integration

Diese Story produziert nur `static/data/kuehle-orte.geojson` als Build-Input, analog `static/data/klima-pet-points.geojson`. Kein MANIFEST-Eintrag, kein Hash, keine `SOURCES`-Erweiterung, keine `kind: 'local'`-Logik. Story 15.2 liest dieses File über den neuen `fetchSource()`-Pfad und schickt es durch Simplify/Hash/MANIFEST. Trennung hält 15.1 klein und testbar.

Merge- und Navi-Logik leben als reine Module unter `scripts/lib/kuehle-orte/` (test-first, ohne I/O). Der Orchestrator macht nur File-Read, Aufruf, File-Write, Logging. Gleiche Schichtung wie `scripts/lib/kriminalitaet/` + `scripts/build-kriminalitaet-lor.ts` (Story 14.0).

Properties-Mapping bevorzugt Enrichment-Werte (redaktionell geprüft) für überlappende Felder (`name`, `cat`, `website`). OSM-only-Felder (`oh`, `wheelchair`, `plz`) wandern zusätzlich mit, damit 15.3/Inspector und der spätere `opening_hours`-Live-Status (FR5, Story später) daran andocken können. `address_verified` ist die primäre Adresse (FR3), `addr`/`plz` aus OSM bleiben als Rohbestand verfügbar.

### Was nicht brechen darf

- Kein Eingriff in bestehende Layer, `SOURCES`, MANIFEST, `editorial-config.ts`. Reines Hinzufügen von Lib + Script + Build-Output.
- Bestehende kühle Bestands-Layer (`kultur-kino`, `kultur-museum`, `kultur-bibliothek`, `schwimmbaeder`, `trinkbrunnen`) NICHT duplizieren oder anfassen. Dieser Build erzeugt einen eigenständigen `kuehle-orte`-Datensatz.
- Koordinaten-Reihenfolge: GeoJSON-Geometrie ist `[lon, lat]`, die Navi-Deep-Links nutzen `lat,lon`. Nicht verwechseln. Im Test fixieren.
- Keine em-dashes (U+2014) in Strings/Logs/Comments. Keine i18n-Keys, Logs/Comments deutsch.
- Kein `any`, Files < 500 LOC. Determinismus: gleiche Inputs → byte-gleicher Output (keine Zeitstempel im File, stabile Reihenfolge = Enrichment-Reihenfolge).

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L109-L131] (Story 15.1 User-Story + Acceptance Criteria)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L17-L39] (FR1-FR20, insb. FR4 Navi, FR12 Filter)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L54-L58] (Additional Requirements: Build-Script-Auftrag)
- [Source: static/data/kuehle-orte/enrichment.json] (659 Objekte, Anreicherungs-Schema)
- [Source: static/data/kuehle-orte/places-osm.json] (659 Objekte, OSM-Geometrie-Schema)
- [Source: scripts/build-klima-pet-points.ts] (Vorbild Build-Input-GeoJSON, `main()`/Guard/`round`/`writeFile`)
- [Source: scripts/build-kriminalitaet-lor.ts] + [Source: scripts/lib/kriminalitaet/] (Lib-plus-Orchestrator-Schichtung, Story 14.0)
- [Source: scripts/lib/types.ts#L21] (`SourceKind` ohne `'local'`, Abgrenzung zu Story 15.2)
- [Source: CLAUDE.md] (TDD-Mandat ADR-012, keine em-dashes, DE-only)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Dev-Story-Lauf 2026-06-30)

### Completion Notes List

- Reine Module unter `scripts/lib/kuehle-orte/` test-first, Orchestrator dünn (nur I/O), Schichtung wie `scripts/lib/kriminalitaet/`.
- Filter mit Präzedenz (suitable vor still_exists vor missingGeometry), damit Überschneidungen genau einmal zählen. Ergebnis am Ist-Stand: 519 behalten, 140 ungeeignet, 0 tot (alle 11 still_exists=no liegen innerhalb der 140), 0 ohne Geometrie. Deckt sich exakt mit der Story-Erwartung.
- Geometrie `[lon, lat]`, Navi-Deep-Links `lat,lon`. Im Test fixiert, nicht verwechselt.
- Determinismus: Output folgt der Enrichment-Reihenfolge, kein Zeitstempel im File.
- 11 neue Tests grün, volle Suite 2906 grün (keine Regression), `pnpm check` 0 Errors.
- Keine em-dashes, kein `any`. `kind: 'local'`/MANIFEST/Lizenz bewusst NICHT angefasst (Scope 15.2).

### File List

**Neu:**
- `scripts/lib/kuehle-orte/navi-links.ts`
- `scripts/lib/kuehle-orte/navi-links.test.ts`
- `scripts/lib/kuehle-orte/merge.ts`
- `scripts/lib/kuehle-orte/merge.test.ts`
- `scripts/build-kuehle-orte.ts`
- `static/data/kuehle-orte.geojson` (Build-Output)

**Geändert:**
- `package.json` (Script `data:kuehle-orte`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-1 Status)

### Debug Log References

- `pnpm data:kuehle-orte`: `[kuehle-orte] 519 Orte behalten, 140 weggefallen (ungeeignet: 140, existiert nicht mehr: 0, ohne Geometrie: 0)`
- `npx vitest run scripts/lib/kuehle-orte/*.test.ts`: 2 Files, 11 Tests grün
- `pnpm check`: 0 ERRORS 0 WARNINGS (6307 Files)

## Change Log

- 2026-06-30: Story 15.1 erstellt (ready-for-dev). Merge enrichment+places per `id`, Filter `suitable=false`/`still_exists=no` mit Logging, Navi-Deep-Links Google/Apple als Properties, Build-Input-GeoJSON. Pipeline-Integration bewusst in 15.2 ausgelagert. Ist-Stand verifiziert: 659 Orte, Join 1:1, 519 behalten / 140 weg.
- 2026-06-30: Implementiert (review). 3 Module + 11 Tests (navi-links, merge), Orchestrator `build-kuehle-orte.ts`, npm-Script `data:kuehle-orte`. Live-Lauf 519/140 exakt wie erwartet, volle Suite 2906 grün, `pnpm check` 0 Errors.
