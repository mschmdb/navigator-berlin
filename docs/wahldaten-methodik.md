---
type: methodology
audience: both
last-verified: 2026-05-18
related:
  - _bmad-output/implementation-artifacts/6-0-wahl-daten-schema-pipeline-foundation-spike.md
  - _bmad-output/spike-artifacts/SCHEMA-DRIFT-ANALYSIS.md
  - docs/data-pipeline.md
---

# Wahldaten-Methodik

Quelle der Wahrheit für die Wahldaten-Pipeline in navigator.berlin. Erweitert iterativ pro Wahl-Datensatz.

## Daten-Cutoff (Phase 1)

| Wahl-Typ | Cutoff | Aktive Wahlen Phase 1 |
|----------|--------|----------------------|
| Bundestagswahl (BTW) | 2013+ | BTW 2013, 2017, 2021, 2025 |
| Abgeordnetenhaus (AGH) | 2011+ | AGH 2011, 2016, 2021, 2023 (Wiederholung) |
| Bezirksverordneten-Versammlung (BVV) | 2011+ | BVV 2011, 2016, 2021, 2023 (Wiederholung) |
| Europawahl (EW) | · | Phase 2 Backlog |
| Volksentscheide | · | cancelled (Story 6.6) |

**Summe Phase 1: 12 aktive Wahlen, 20 `wahl`-Rows in DB** (BTW + AGH je 2 Stimmtypen, BVV je 1 Einstimme).

**Begründung Cutoff 2013/2011:**

- BTW-Pipeline (Bundeswahlleiterin `_wbz.zip`) verfügbar ab 2013. Pre-2013 nicht öffentlich auf Stimmbezirks-Ebene.
- AGH/BVV (SBB-XLSX) verfügbar ab 2011 (Datei `DL_BE_AB2011.xlsx` mit Sheet `Erststimme`/`Zweitstimme`/`BVV`).
- Pre-2011 (BTW 2009, AGH 2006) erst via FragDenStaat-IFG-Anfrage erreichbar. Phase 2.
- Cutoff respektiert post-Berlin-Bezirksreform-2001 für stabiles 12-Bezirke-Mapping.

**BTW 2024 Wiederholungswahl:**

Bundeswahlleiterin liefert für die Februar-2024-Berlin-Wiederholung KEINE separate `_wbz.zip`. Berliner Landeswahlleiter publiziert die Wiederholungs-Stimmbezirks-Ergebnisse über eine eigene XLSX-Pipeline (`wahlen-berlin.de/wahlen/BU2024/...`). Aktuell ausgelassen, eigene Source-Variante Phase 2.

**Europawahlen 2014/2019/2024:**

Backlog. Bundeswahlleiterin liefert vermutlich analoge `ew*_wbz.zip`-Pipeline. Bei Implementation: `wahlTypEnum` in Drizzle-Schema um `'ew'` erweitern + Drizzle-Migration generieren. Parteien-Alias-Tabelle erweitern (EU-spezifische Parteien wie Volt, FAMILIE prominent).

## Daten-Quellen

### Bundeswahlleiterin Wahlbezirksstatistik (BTW)

Endpoint-Pattern:

```
https://bundeswahlleiterin.de/dam/jcr/<jcr-uuid>/btw<jj>_wbz.zip
```

Live-URLs (Stand 2026-05-18):

| Wahl | jcr-UUID |
|------|----------|
| BTW 2013 | `0ad35576-0c4b-4fa5-85f5-284618b8fa25` |
| BTW 2017 | `a2eef6bd-0225-447c-9943-7af0f46c94d1` |
| BTW 2021 | `c2cd99e6-064e-4ebc-b634-f86b5c0e14b3` |
| BTW 2025 | `e79a7bd3-0607-4e87-9752-8e601e299e00` |

URLs sind hash-basiert und nicht stabil. Pflege im Code (`scripts/wahlen/lib/sources.ts`). Bei 404: Bundeswahlleiterin-Seite `/bundestagswahlen/<jahr>/ergebnisse/weitere-ergebnisse.html` nach Wahlbezirksstatistik-Link prüfen.

**Lizenz:** Datenlizenz Deutschland Namensnennung 2.0 (`dl-de/by-2.0`). Attribution: „Datenquelle: Die Bundeswahlleiterin, Wiesbaden". Footer-Pflicht.

**3 Format-Generationen über die Jahre:**

| Wahl | Container | CSV-Layout | Encoding | Spalten-Marker |
|------|-----------|------------|----------|----------------|
| BTW 2013 | ZIP, 2 CSVs `BTW13_Erststimmen_Wahlbezirke.csv` + `BTW13_Zweitstimmen_Wahlbezirke.csv` | split-by-file | UTF-8 mit BOM | direct (Spaltennamen = Parteien) |
| BTW 2017 | ZIP, 2 CSVs `btw17_wbz_erststimmen.csv` + `btw17_wbz_zweitstimmen.csv` | split-by-file | **Windows-1252** | direct + quoted |
| BTW 2021 | ZIP, 1 CSV `btw21_wbz_ergebnisse.csv` | combined | UTF-8 mit BOM | Prefix `E_` / `Z_` |
| BTW 2025 | ZIP, 1 CSV `btw25_wbz_ergebnisse.csv` | combined | UTF-8 mit BOM | Suffix ` - Erststimmen` / ` - Zweitstimmen` |

Format-Profile-Detection in `scripts/wahlen/lib/row-transformer.ts` (`SUFFIX_GEN_PROFILE`, `PREFIX_GEN_PROFILE`, plus `transformBwlSplitRow` für direct/split). Encoding-Detection (BOM vs. Latin-1) in `scripts/wahlen/lib/bwl-fetcher.ts#detectEncoding`. Combined-vs-split-Mode via `extractBwlCsvs`.

Delimiter durchgängig Semikolon. Line-Terminator CRLF. 4 Metadaten-Zeilen vor Header (außer BTW21: 0 Metadaten-Zeilen).

### SBB-XLSX-Pipeline (AGH + BVV)

Berliner Landeswahlen kommen nicht von der Bundeswahlleiterin. Quelle: `download.statistik-berlin-brandenburg.de` mit Hash-URL pro Wahl, Container XLSX-Multi-Sheet.

Live-URLs (Stand 2026-05-18):

| Datei | Enthält Wahlen | Sheet-Namen |
|-------|----------------|-------------|
| `DL_BE_AB2011.xlsx` | AGH 2011 + BVV 2011 | `Erststimme`, `Zweitstimme`, `BVV` |
| `DL_BE_EE_WB_AH2016.xlsx` | AGH 2016 + BVV 2016 | `Erststimme`, `Zweitstimme`, `BVV` |
| `DL_BE_AGHBVV2021.xlsx` | AGH 2021 + BVV 2021 | `AGH_W1`, `AGH_W2`, `BVV` |
| `DL_BE_AGHBVV2023.xlsx` | AGH 2023 + BVV 2023 | `AGH_W1`, `AGH_W2`, `BVV` |

Implementation: `scripts/wahlen/lib/sbb-xlsx-fetcher.ts` (XLSX-Parser via `xlsx`-Library) plus `scripts/wahlen/lib/sbb-row-transformer.ts`. SBB-Schema hat eigene Spalten-Konventionen:

- `Stimmart`-Spalte trägt `'Erststimme'` / `'Zweitstimme'` / `'Stimme'` (BVV)
- `Adresse`-Spalte (z.B. `01W100`) ist composite UWB-ID ab 2016
- `Wahlbezirksart`-Werte variieren über Jahre: `Briefwahlbezirk`/`Urnenwahlbezirk` (2016), `W`/`B`/`1A`/`1B` (2021+), fehlt komplett (2011, Detection-Fallback auf andere Spalten)
- BVV nutzt Stimmtyp `'einstimme'` im DB-Schema (nur eine Stimme pro Wähler in Bezirksverordnetenversammlung). DB-Loader Slot-Mapping: `'einstimme'` schreibt in `votes.erststimme`-Slot

**Lizenz:** Datenlizenz Deutschland Namensnennung 2.0 (`dl-de/by-2.0`), Attribution: „Datenquelle: Amt für Statistik Berlin-Brandenburg".

### Pre-Indexing-Verifikation per Spike

Vor Schema-Implementation wurde ein Spike-Snapshot (`_bmad-output/spike-artifacts/wahl-schema-snapshot-btw25.json`) angelegt. Aggregator-Pipeline (`scripts/aggregate-wahl-data.ts`) führt bei jedem Real-Run einen Schema-Drift-Check gegen den Snapshot durch. Bei Drift wird die Pipeline mit explizitem Diff-Output abgebrochen statt stille Daten-Korruption.

## Aggregations-Strategie

### Aggregat-Stufen

Stimmbezirks-Rohdaten werden in drei Stufen aggregiert:

```
ergebnis (Stimmbezirk)
   ↓ SUM nach bezirk_code
wahl_aggregat_bezirk (12 Bezirke)
   ↓ SUM
wahl_aggregat_berlin (1 Row pro Partei)

ergebnis (Stimmbezirk)
   ↓ SUM nach Kiez via Centroid-in-LOR-BR
wahl_aggregat_kiez (143 Kieze; Phase 2 nach Story 6.2)
```

### Bezirks-Aggregat

Bezirks-Code kommt direkt aus Spalte `Kreis` (Bundeswahlleiterin-Schema). Mapping `01 → mitte`, `02 → friedrichshain-kreuzberg` etc. in `scripts/wahlen/lib/bezirk-codes.ts`.

### Berlin-Aggregat

SUM über alle Stimmbezirke mit Land=11, gruppiert nach Partei.

### Kiez-Aggregat (Story 6.2)

Strategie Centroid-First:

1. Pro Stimmbezirk: Polygon-Centroid berechnen via `@turf/center`
2. Centroid → enthaltenes Kiez (Punkt-in-Polygon-Lookup gegen `lor-bezirksregion`)
3. SUM-Aggregation pro `(wahl_id, kiez_slug, partei_id)` → `wahl_aggregat_kiez`

**Begründung Centroid statt Polygon-Intersection:**

Stimmbezirke (~1.800-3.700 in Berlin pro Wahl) sind deutlich kleiner als Kieze (143 BZR). Polygon-Intersection wäre 99 %+ identisches Ergebnis bei 10× Compute-Cost. Edge-Case: Stimmbezirk-Centroid liegt auf Kiez-Grenze → Lookup nutzt ersten-Match (deterministisch via LOR-Index-Reihenfolge).

**Briefwahl ausgeschlossen:** Aggregation läuft nur über Urne-Stimmen (`ist_briefwahl_aggregat = false`). Brief-Stimmen haben keine räumliche Zuordnung (Bezirks-Aggregat-only) und würden Kiez-Werte verfälschen wenn auf Parent-Urne-Polygon gemappt.

**Geometrie-Coverage Phase 1:**

| Wahl | Geometrie verfügbar | Kiez-Aggregat |
|------|---------------------|---------------|
| BTW 2013 | nein | leer |
| BTW 2017 | ja (`wahlbezirke-btw17`) | 1136 Rows × 2 Stimmtypen |
| BTW 2021 | ja (`wahlbezirke-ah21` combined) | 1085-1136 Rows × 2 Stimmtypen |
| BTW 2025 | ja (`wahlbezirke-bt25`) | 1132-1278 Rows × 2 Stimmtypen |
| AGH 2011 + BVV 2011 | nein | leer |
| AGH 2016 + BVV 2016 | ja (`wahlbezirke-ah16`) | 978-994 Rows |
| AGH 2021 + BVV 2021 | ja (`wahlbezirke-ah21` combined) | 1087-1136 Rows |
| AGH 2023 + BVV 2023 | ja (`wahlbezirke-ah23` Wahllokale) | 1072-1127 Rows |

pre-2016 Geometrien sind Phase-2-Backlog (FragDenStaat-IFG-Anfrage bei Bezirken). `wahl_aggregat_kiez` bleibt für die leer.

**DB-uwbId zu Geo-Properties Mapping:**

Format variiert pro Wahl-Generation:

| Wahl-Slug | DB-Format | Geo-Build-Rule |
|-----------|-----------|----------------|
| BTW 21/25 | `${BWK}-${BEZ}-${UWB3}-0` | direkter Build aus BWK+BEZ+UWB3 |
| BTW 17 | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0` | BEZ+W eingefügt im wahlbezirk-Slot |
| AGH/BVV 21/23 | `${BEZ}W${UWB3}-W` | Adresse-Format mit -W-Suffix |
| AGH/BVV 16 | `${BEZ}W${UWB3}` | Adresse-Format ohne Suffix |

Implementation: `scripts/wahlen/lib/kiez-mapper.ts#dbUwbIdFromGeo` und `buildKiezMappings`.

## Briefwahl-Behandlung

### Asymmetrie pre-2021

Vor 2021 wurden Briefstimmen NUR auf Bezirks-Ebene zusammengefasst, nicht pro Stimmbezirk. Ab 2021 verteilt die Bundeswahlleiterin Briefstimmen auf Briefwahlbezirke mit eigener UWB-ID.

Schema-Modellierung: `ergebnis.ist_briefwahl_aggregat BOOL`. Detection-Regel: `Bezirksart !== '0'`.

### Composite-UWB-ID

Wahlbezirks-Nummern sind nur lokal eindeutig. Wahlkreis 077 enthält zwei Wahlbezirke mit Nummer 119 (einer in Charlottenburg-Wilmersdorf, einer in Spandau). Composite-Schlüssel:

```
uwb_id = `${wahlkreis}-${bezirk_code}-${wahlbezirk}-${bezirksart}`
```

Beispiel: `077-04-119-0` vs. `077-05-119-0` für die zwei oben genannten Stimmbezirke.

## Parteien-Alias-Tabelle

Parteien werden über `partei` + `partei_alias` modelliert, weil sich Schreibweisen über die Jahre ändern. Seed in `scripts/wahlen/lib/partei-seed.ts`.

| Kurzname (DB) | Aliase | First Seen |
|---------------|--------|-----------|
| SPD | SPD | - |
| CDU | CDU | - |
| CSU | CSU | - |
| GRÜNE | GRÜNE, B'90/GRÜNE, Bündnis 90/Die Grünen, Die Grünen | - |
| FDP | FDP | - |
| AfD | AfD | 2013 |
| Die Linke | Die Linke, DIE LINKE, Linkspartei.PDS, PDS, Linke | - |
| BSW | BSW | 2024 |
| FREIE WÄHLER | FREIE WÄHLER | - |
| Sonstige | Sonstige, Übrige, übrige | - |

**Pflege-Regel:** Bei neuer Wahl muss die Liste gegen die echten CSV-Spalten geprüft werden. Unbekannte Parteien fallen automatisch in `Sonstige`. Wenn eine `Sonstige`-Partei jemals > 3 % erreicht oder als Top-5 erscheint, eigene Tabellenzeile aufnehmen.

## Wiederholungswahlen

`wahl.is_repeat_election = true` + `wahl.parent_election_id = parent_wahl_id` markieren Wiederholungswahlen. Bekannte Fälle:

- AGH 2023 + BVV 2023 (Wiederholung von 2021, von Berliner VerfGH ungültig erklärt). In DB markiert via `parent_election_id` → AGH/BVV 2021.
- BTW 2024 (partial-Wiederholung in Berlin, Februar 2024): aktuell NICHT in DB, weil Bundeswahlleiterin kein eigenes `_wbz.zip` publiziert hat. Backlog.
- BTW 2025 enthält Wiederholungs-Komponente in Teilen Berlins via Title-Line der CSV markiert. In DB als reguläre BTW 2025 geführt, weil Bundeswahlleiterin die Wiederholung in das BTW25-Endergebnis integriert hat.

UI (Story 6.3) muss diese Wahlen als „Wiederholungswahl" labeln und in Sparklines als separaten Datenpunkt zeigen, NICHT als Ersatz für die Erst-Wahl.

## Pipeline-Run

```bash
# Wahl-Ergebnisse: alle 12 Wahlen ins Postgres
pnpm data:wahl-fetch

# Einzelne Wahl
pnpm data:wahl-fetch --only=btw25
pnpm data:wahl-fetch --only=agh23
pnpm data:wahl-fetch --only=bvv11

# Drift-Check skippen (für split-Format-Wahlen wie BTW13/17)
pnpm data:wahl-fetch --only=btw13 --skip-drift-check

# Geometrien: 5 GeoJSON-Layer in static/layers/ + MANIFEST-Augment
pnpm data:wahl-geo

# Kiez-Aggregat-Build (braucht data:wahl-fetch + data:wahl-geo + LOR-Geometrien)
pnpm data:wahl-kiez
```

**Verfügbare Wahl-Slugs:** `btw13` `btw17` `btw21` `btw25` `agh11` `agh16` `agh21` `agh23` `bvv11` `bvv16` `bvv21` `bvv23`.

**Verfügbare Geometrie-Slugs:** `btw17` `ah16` `ah21` `ah23` `bt25` (`ah21` combined für BTW21+AGH21+BVV21, `ah16` combined für AGH16+BVV16, `ah23` Wahllokale-Variant für AGH23+BVV23).

### URL-Recon-Pattern (volatile Hash-URLs)

Die `statistik-berlin-brandenburg.de/opendata/*.zip`-URLs sind kein direkter Download, sondern Scrivito-SPA-Routes. JS resolved client-side zur echten Hash-URL auf `download.statistik-berlin-brandenburg.de`. `curl`/`fetch` liefern HTML (69 KB SPA), nicht ZIP.

Bei stale Hash-URL: Playwright-Headless gegen die `/opendata/*.zip`-URL navigieren, Network-Response auf `download.statistik-berlin-brandenburg.de` abfangen. Pattern in `scripts/wahlen/spike-fetch.ts` (Spike-Modus für BTW) bzw. manuell via Browser-DevTools für AGH/BVV/Geometrien.

## Out-of-Scope

Folgende Daten sind explizit ausgeschlossen für Phase 1:

- Volksentscheide (Story 6.6 cancelled)
- Europawahlen (Phase 2 Backlog, eigene Source-Pipeline ggf. analog BTW-_wbz)
- BTW 2024 Wiederholung (eigene Berliner-Pipeline später)
- pre-2011-AGH/BVV + pre-2013-BTW (FragDenStaat-IFG-Anfrage, Phase 2)
- Live-Wahl-Auszählung am Wahltag (Memory `feedback_no_live_data` lock)
- Wahlkreise als eigene Geo-Ebene (entfällt mit Story 6.1 cancelled)
