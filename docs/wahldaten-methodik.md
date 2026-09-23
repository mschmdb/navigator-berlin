---
type: methodology
audience: both
last-verified: 2026-09-23
related:
  - _bmad-output/implementation-artifacts/6-0-wahl-daten-schema-pipeline-foundation-spike.md
  - _bmad-output/spike-artifacts/SCHEMA-DRIFT-ANALYSIS.md
  - docs/data-pipeline.md
---

# Wahldaten-Methodik

Quelle der Wahrheit für die Wahldaten-Pipeline in navigator.berlin. Erweitert iterativ pro Wahl-Datensatz.

## Daten-Cutoff (Phase 1)

| Wahl-Typ                             | Cutoff | Aktive Wahlen Phase 1                           |
| ------------------------------------ | ------ | ----------------------------------------------- |
| Bundestagswahl (BTW)                 | 2013+  | BTW 2013, 2017, 2021, 2025                      |
| Abgeordnetenhaus (AGH)               | 2011+  | AGH 2011, 2016, 2021, 2023 (Wiederholung), 2026 |
| Bezirksverordneten-Versammlung (BVV) | 2011+  | BVV 2011, 2016, 2021, 2023 (Wiederholung), 2026 |
| Europawahl (EW)                      | ·      | Phase 2 Backlog                                 |
| Volksentscheide                      | ·      | cancelled (Story 6.6)                           |

**Summe Phase 1: 14 aktive Wahlen, 23 `wahl`-Rows in DB** (BTW + AGH je 2 Stimmtypen, BVV je 1 Einstimme).

**AGH/BVV 2026 (vorläufig):** Wahltag 20.09.2026. Ingest lief am 23.09.2026 mit dem
amtlichen vorläufigen Ergebnis (Stand 21.09.2026, Quelle wahlen-berlin.de).
`wahl.vorlaeufig = true` für `agh26`/`bvv26`, Portal/`/wahl/[slug]`/Tool-Responses
zeigen die Kennzeichnung „vorläufig" plus Stand-Datum (`wahl.sourceUpdatedAt`,
aus `Datum`/`Zeit` der Wahlbezirks-CSV berechnet).

**Re-Ingest-Checkliste beim Endergebnis** (BVV ab ~30.09., AGH ab ~05.–08.10.):

1. `scripts/wahlen/lib/sources.ts`: `vorlaeufig: true` bei `WB_AGH2026`/`WB_BVV2026` entfernen (oder auf `false` setzen).
2. Re-Ingest erzwingen -- das prebuild-Gate (`scripts/check-wahl-data.ts`) überspringt `data:wahl-fetch`/`data:wahl-kiez`/`data:wahl-analytik` sonst, weil `wahlen=23`/`wahlen-mit-kiez-aggregat=18` bereits erfüllt sind: entweder `WAHL_REFRESH=true` setzen (läuft die volle Kette einmal durch) oder gezielt
   ```bash
   pnpm data:wahl-fetch -- --only=agh26,bvv26
   pnpm data:wahl-kiez -- --only=agh26
   pnpm data:wahl-kiez -- --only=bvv26
   pnpm data:wahl-analytik
   ```
3. `src/lib/components/home/home-wahl-teaser.svelte`: `typLabel` der beiden 2026er-`CARDS`-Einträge von `„… · Vorläufig"` auf den finalen Text ändern -- das Badge dort ist statischer Text, kein Re-Ingest aktualisiert es automatisch (siehe Kommentar an `CARDS` im Code).
4. `pnpm data:wahl-check` grün prüfen, `wahl.vorlaeufig`/`source_updated_at` stichprobenhaft per SQL verifizieren.

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

| Wahl     | jcr-UUID                               |
| -------- | -------------------------------------- |
| BTW 2013 | `0ad35576-0c4b-4fa5-85f5-284618b8fa25` |
| BTW 2017 | `a2eef6bd-0225-447c-9943-7af0f46c94d1` |
| BTW 2021 | `c2cd99e6-064e-4ebc-b634-f86b5c0e14b3` |
| BTW 2025 | `e79a7bd3-0607-4e87-9752-8e601e299e00` |

URLs sind hash-basiert und nicht stabil. Pflege im Code (`scripts/wahlen/lib/sources.ts`). Bei 404: Bundeswahlleiterin-Seite `/bundestagswahlen/<jahr>/ergebnisse/weitere-ergebnisse.html` nach Wahlbezirksstatistik-Link prüfen.

**Lizenz:** Datenlizenz Deutschland Namensnennung 2.0 (`dl-de/by-2.0`). Attribution: „Datenquelle: Die Bundeswahlleiterin, Wiesbaden". Footer-Pflicht.

**3 Format-Generationen über die Jahre:**

| Wahl     | Container                                                                              | CSV-Layout    | Encoding         | Spalten-Marker                              |
| -------- | -------------------------------------------------------------------------------------- | ------------- | ---------------- | ------------------------------------------- |
| BTW 2013 | ZIP, 2 CSVs `BTW13_Erststimmen_Wahlbezirke.csv` + `BTW13_Zweitstimmen_Wahlbezirke.csv` | split-by-file | UTF-8 mit BOM    | direct (Spaltennamen = Parteien)            |
| BTW 2017 | ZIP, 2 CSVs `btw17_wbz_erststimmen.csv` + `btw17_wbz_zweitstimmen.csv`                 | split-by-file | **Windows-1252** | direct + quoted                             |
| BTW 2021 | ZIP, 1 CSV `btw21_wbz_ergebnisse.csv`                                                  | combined      | UTF-8 mit BOM    | Prefix `E_` / `Z_`                          |
| BTW 2025 | ZIP, 1 CSV `btw25_wbz_ergebnisse.csv`                                                  | combined      | UTF-8 mit BOM    | Suffix ` - Erststimmen` / ` - Zweitstimmen` |

Format-Profile-Detection in `scripts/wahlen/lib/row-transformer.ts` (`SUFFIX_GEN_PROFILE`, `PREFIX_GEN_PROFILE`, plus `transformBwlSplitRow` für direct/split). Encoding-Detection (BOM vs. Latin-1) in `scripts/wahlen/lib/bwl-fetcher.ts#detectEncoding`. Combined-vs-split-Mode via `extractBwlCsvs`.

Delimiter durchgängig Semikolon. Line-Terminator CRLF. 4 Metadaten-Zeilen vor Header (außer BTW21: 0 Metadaten-Zeilen).

### SBB-XLSX-Pipeline (AGH + BVV)

Berliner Landeswahlen kommen nicht von der Bundeswahlleiterin. Quelle: `download.statistik-berlin-brandenburg.de` mit Hash-URL pro Wahl, Container XLSX-Multi-Sheet.

Live-URLs (Stand 2026-05-18):

| Datei                     | Enthält Wahlen      | Sheet-Namen                        |
| ------------------------- | ------------------- | ---------------------------------- |
| `DL_BE_AB2011.xlsx`       | AGH 2011 + BVV 2011 | `Erststimme`, `Zweitstimme`, `BVV` |
| `DL_BE_EE_WB_AH2016.xlsx` | AGH 2016 + BVV 2016 | `Erststimme`, `Zweitstimme`, `BVV` |
| `DL_BE_AGHBVV2021.xlsx`   | AGH 2021 + BVV 2021 | `AGH_W1`, `AGH_W2`, `BVV`          |
| `DL_BE_AGHBVV2023.xlsx`   | AGH 2023 + BVV 2023 | `AGH_W1`, `AGH_W2`, `BVV`          |

Implementation: `scripts/wahlen/lib/sbb-xlsx-fetcher.ts` (XLSX-Parser via `xlsx`-Library) plus `scripts/wahlen/lib/sbb-row-transformer.ts`. SBB-Schema hat eigene Spalten-Konventionen:

- `Stimmart`-Spalte trägt `'Erststimme'` / `'Zweitstimme'` / `'Stimme'` (BVV)
- `Adresse`-Spalte (z.B. `01W100`) ist composite UWB-ID ab 2016
- `Wahlbezirksart`-Werte variieren über Jahre: `Briefwahlbezirk`/`Urnenwahlbezirk` (2016), `W`/`B`/`1A`/`1B` (2021+), fehlt komplett (2011, Detection-Fallback auf andere Spalten)
- BVV nutzt Stimmtyp `'einstimme'` im DB-Schema (nur eine Stimme pro Wähler in Bezirksverordnetenversammlung). DB-Loader Slot-Mapping: `'einstimme'` schreibt in `votes.erststimme`-Slot

**Lizenz:** Datenlizenz Deutschland Namensnennung 2.0 (`dl-de/by-2.0`), Attribution: „Datenquelle: Amt für Statistik Berlin-Brandenburg".

### Wahlbezirks-Datenexport-Pipeline (wb-csv, ab AGH/BVV 2026)

Ab der AGH/BVV-Wahl 2026 liefert die Landeswahlleiterin Berlin den
Wahlbezirks-Datenexport direkt über `wahlen-berlin.de` statt über die
SBB-XLSX-Pipeline. Format-Wechsel, keine Format-Fortsetzung.

Endpoint-Pattern (pro Wahl + Stimmtyp zwei Dateien):

```
https://www.wahlen-berlin.de/wahlen/BE<jahr>/Afspraes/<AGH|bvv>/Datenexport_<WAHL><jahr>_<Erststimme|Zweitstimme|Stimme>_W_BE.csv
https://www.wahlen-berlin.de/wahlen/BE<jahr>/Afspraes/<AGH|bvv>/DSB/DSB_Datenexport_<WAHL><jahr>_<Erststimme|Zweitstimme|Stimme>_W_BE.csv
```

Live-URLs (Stand 23.09.2026, per Recon aus `downloads.html`, siehe
`scripts/wahlen/lib/sources.ts`): `agh26` (Erst- und Zweitstimme, je eigene
DSB-Legende) und `bvv26` (eine kombinierte Stimme, DB-Slot `einstimme`).

**Format:** `Datenexport_*_W_BE.csv` (Wahlbezirks-Ebene, `_W_`) ist UTF-8 mit
BOM, `;`-getrennt, ein Wahlbezirk pro Zeile. Partei-Stimmen stehen in
`P<nn>`-Spalten (Prozent-Zwilling `P<nn>p`, wird ignoriert). Welcher Code
welche Partei ist, steht NICHT im Datenexport selbst, sondern in der
separaten `DSB_Datenexport_*_W_BE.csv` (Windows-1252, Datensatzbeschreibung).
Ein Code ohne Ergebniseingang trägt dort `nicht besetzt, kein
Ergebniseingang` -- die Spalte wird beim Parsen ignoriert, nicht als Partei
mit 0 Stimmen gezählt. AGH-Erststimme und -Zweitstimme haben **getrennte**
DSB-Legenden (unterschiedliche Codes können unterschiedliche Parteien
tragen), ebenso hat BVV ihre eigene.

Parser: `scripts/wahlen/lib/wb-csv-parser.ts`. Löst `P<nn>` über die Legende
auf den amtlichen Parteinamen auf und liefert Zeilen in der Spaltenform, die
`sbb-row-transformer.ts#transformSbbRow` erwartet -- UWB-ID, Briefwahl-
Erkennung und Einstimme-Slot laufen dadurch unverändert weiter.
Metaspalten (`StimmArt`, `Datum`, `Zeit`, `WberA1..3`, alle `p`-Spalten)
werden nicht durchgereicht.

**Plausi statt Drift-Snapshot:** Die wb-csv-Pipeline hat keinen
Schema-Drift-Snapshot wie die BWL-Pipeline. Stattdessen prüft
`assertPartySumMatchesGueltig` je Zeile, dass die Summe der aufgelösten
Partei-Spalten exakt `Gueltig` ergibt, und `buildWbCsvRows` bricht bei einem
Partei-Code ohne jeden Legenden-Eintrag (auch nicht als „nicht besetzt")
sofort ab, sobald dieser Code in mindestens einer Zeile einen Wert > 0 trägt.

**`sourceUpdatedAt`/Vorläufig-Stand:** `computeSourceUpdatedAt` liest das
späteste `Datum`+`Zeit`-Paar über alle Rohzeilen der CSV (Format `JJ.MM.TT`
bzw. `hh:mm:ss`, Beispiel `26.09.20` = 20.09.2026) -- kein Scraping der
HTML-Seite. Die Quelle liefert diese Werte in Berliner Ortszeit (Stand-Banner
der Seite), nicht UTC; die Konvertierung läuft DST-korrekt über
`Europe/Berlin` (Bugfix: eine Erstversion interpretierte den Zeitstempel
fälschlich als UTC, dadurch lag `wahl.source_updated_at` 1-2h daneben).

**Lizenz:** Datenlizenz Deutschland Namensnennung 2.0 (`dl-de/by-2.0`),
Attribution: „Datenquelle: Landeswahlleiterin Berlin".

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

**Briefwahl anteilig verteilt (Story 17, löst die frühere Urnen-only-Regel ab):**
Bis Story 17 lief die Kiez-Aggregation nur über Urne-Stimmen
(`ist_briefwahl_aggregat = false`); Briefstimmen fehlten in den Kiez-Werten
komplett. Für 2026 wären das 40,8 % der gültigen Stimmen gewesen. Die
Kiez-Aggregation verteilt Briefstimmen jetzt anteilig auf die Kieze ihrer
Briefwahl-Gruppe (siehe „Briefwahl-Gruppen" unten): für Urne `u` in Gruppe
`g` gilt `brief_u = brief_g × wb_u / Σ wb(g)` (`wb` = Wahlberechtigte der
Urne). Das ist eine Schätzung -- Wahlberechtigte korrelieren mit
Wahlbeteiligung, aber nicht 1:1 mit dem tatsächlichen Briefwahl-Stimmverhalten
pro Urne. Fehlt `wb_u` für eine oder mehrere Urnen einer Gruppe (ältere
`stimmbezirk`-Rows vor einem Re-Ingest), fällt die Verteilung für diese
Gruppe auf Gleichverteilung über ihre Urnen zurück.

**Geometrie-Coverage Phase 1:**

| Wahl                | Geometrie verfügbar                                                                                                                                                             | Kiez-Aggregat                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| BTW 2013            | nein                                                                                                                                                                            | leer                          |
| BTW 2017            | ja (`wahlbezirke-btw17`)                                                                                                                                                        | 1136 Rows × 2 Stimmtypen      |
| BTW 2021            | ja (`wahlbezirke-ah21` combined)                                                                                                                                                | 1085-1136 Rows × 2 Stimmtypen |
| BTW 2025            | ja (`wahlbezirke-bt25`)                                                                                                                                                         | 1132-1278 Rows × 2 Stimmtypen |
| AGH 2011 + BVV 2011 | nein                                                                                                                                                                            | leer                          |
| AGH 2016 + BVV 2016 | ja (`wahlbezirke-ah16`)                                                                                                                                                         | 978-994 Rows                  |
| AGH 2021 + BVV 2021 | ja (`wahlbezirke-ah21` combined)                                                                                                                                                | 1087-1136 Rows                |
| AGH 2023 + BVV 2023 | ja (`wahlbezirke-ah21`, geteilt mit 2021 -- Wiederholungswahl auf unveränderten Wahlbezirken; `RBS_OD_Wahllokale_AH23` enthält nur Wahllokal-Punkte, für Choropleth ungeeignet) | 1072-1127 Rows                |
| AGH 2026 + BVV 2026 | ja (`wahlbezirke-ah26`)                                                                                                                                                         | 1128-1161 Rows                |

pre-2016 Geometrien sind Phase-2-Backlog (FragDenStaat-IFG-Anfrage bei Bezirken). `wahl_aggregat_kiez` bleibt für die leer.

**DB-uwbId zu Geo-Properties Mapping:**

Format variiert pro Wahl-Generation:

| Wahl-Slug     | DB-Format                        | Geo-Build-Rule                     |
| ------------- | -------------------------------- | ---------------------------------- |
| BTW 21/25     | `${BWK}-${BEZ}-${UWB3}-0`        | direkter Build aus BWK+BEZ+UWB3    |
| BTW 17        | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0` | BEZ+W eingefügt im wahlbezirk-Slot |
| AGH/BVV 21/23 | `${BEZ}W${UWB3}-W`               | Adresse-Format mit -W-Suffix       |
| AGH/BVV 16/26 | `${BEZ}W${UWB3}`                 | Adresse-Format ohne Suffix         |

Implementation: `scripts/wahlen/lib/kiez-mapper.ts#dbUwbIdFromGeo` und `buildKiezMappings`.

## Stimmbezirks-Ansicht (Story 5)

`/berlin-wahlen` zeigt die Winner-Map standardmäßig auf Stimmbezirks-Ebene
(Matze-Direktive 19.09., Tagesspiegel-Referenz): die amtlichen Wahleinheiten
statt der abgeleiteten Kiez-/Bezirks-Aggregate.

**Amtliche Einheiten:** Stimmbezirks-Rows kommen direkt aus `ergebnis`
(Urnenwahl), ohne Aggregationsschritt -- anders als Kiez (Centroid-Aggregat,
siehe oben) und Bezirk (Summen-Aggregat). `/api/wahl/winners?ebene=stimmbezirk`
verlangt einen `jahr`-Parameter (Response jahrweise statt Reihe-Bulk, ~2.200
statt ~7.000 Rows pro Antwort).

**Geometrie pro Wahl-Generation:** Anders als Kiez/Bezirk (stabile LOR-
Geometrie über alle Jahre) hat jede Stimmbezirks-Geometrie-Generation
(`ah16`/`ah21`/`bt25`/`btw17`, siehe `WAHL_TO_GEO` in
`src/lib/data/wahl-geo-mapping.ts`) ihre eigene Wahlbezirks-Einteilung. Ein
Jahr-Wechsel innerhalb einer Reihe kann deshalb einen Geometrie-Wechsel
bedeuten (z. B. AGH 2016 → 2021: `ah16` → `ah21`); die Karte tauscht die
Geometrie per `setData` auf der bestehenden MapLibre-Instanz, ohne
Re-Initialisierung.

**Fallback-Leiter:** Jahre ohne Stimmbezirks-Geometrie (`btw13`, `agh11`,
`bvv11`, siehe Geometrie-Coverage-Tabelle oben) zeigen ersatzweise die
nächstgröbere verfügbare Ebene; die Status-Zeile nennt den Fallback, der
Ebenen-Toggle bleibt auf dem Nutzer-Wunsch stehen. Mit dem heutigen
Datenbestand landet der Fallback faktisch immer auf Bezirk: Das Kiez-Aggregat
setzt dieselbe Stimmbezirks-Geometrie voraus, die Kiez-Stufe der Leiter ist
also nur für künftige Datenlagen relevant.

**Briefwahl-Gruppen statt Briefwahl-Lücke (Story 17):** Bis Story 17 wurden
Stimmbezirks-Rows mit `ist_briefwahl_aggregat = true` aus der Karten-/
Tabellen-Antwort ausgefiltert -- die Karte zeigte nur Urnenwahl-Ergebnisse,
2026 fehlten so 40,8 % der gültigen Stimmen, in 429 von 2542 Urnenbezirken
mit anderem Sieger als Urne+Briefwahl zusammen. Die kleinste Kartenebene ist
jetzt die **Briefwahl-Gruppe**: alle Urnen-Stimmbezirke mit demselben
Briefwahlbezirk PLUS dieser Briefwahlbezirk selbst bilden eine Fläche
(Dissolve der Urnen-Polygone), analog zur Tagesspiegel-Darstellung
(„Stimmbezirke 726, 727 und 7P"). Siehe „Briefwahl-Gruppen" unten für die
Gruppen-ID-Bildung.

## Briefwahl-Behandlung

### Briefwahlbezirke pro Stimmbezirk

Die Bundeswahlleiterin und die SBB-Pipeline verteilen Briefstimmen auf
eigene Briefwahlbezirke mit eigener UWB-ID -- für BTW17 und AGH/BVV16
ebenso wie ab 2021: die ingestierten Datensätze zeigen für BTW17 und
AGH/BVV16 granulare Briefwahlbezirk-Rows mit echten, pro Bezirk
unterschiedlichen Stimmenzahlen (verifiziert per SQL-Sample gegen
`ergebnis`). Ein früherer Stand dieser Doku behauptete einen generellen
„vor 2021 nur Bezirks-Ebene"-Unterschied; die davon abgeleiteten UI-Caveats
entfielen deshalb mit Story 17 (Briefwahl-Gruppen, siehe unten, gelten für
alle Wahlen mit Stimmbezirks-Geometrie, nicht nur ab 2021).

Schema-Modellierung: `ergebnis.ist_briefwahl_aggregat BOOL`. Detection-Regel: `Bezirksart !== '0'`.

### Composite-UWB-ID

Wahlbezirks-Nummern sind nur lokal eindeutig. Wahlkreis 077 enthält zwei Wahlbezirke mit Nummer 119 (einer in Charlottenburg-Wilmersdorf, einer in Spandau). Composite-Schlüssel:

```
uwb_id = `${wahlkreis}-${bezirk_code}-${wahlbezirk}-${bezirksart}`
```

Beispiel: `077-04-119-0` vs. `077-05-119-0` für die zwei oben genannten Stimmbezirke.

### Briefwahl-Gruppen (Story 17)

**Problem:** Stimmbezirks- und Kiez-Ebene zählten bis Story 17 nur
Urnenstimmen. 2026 fehlten dort 40,8 % der gültigen Stimmen; in 429 von 2542
Urnenbezirken zeigte die Karte einen anderen Sieger als Urne+Briefwahl
zusammen (AfD 823 statt 557 Bezirke). Die Verzerrung betrifft jede Wahl mit
Stimmbezirks-Geometrie (Briefwahl-Anteil 28 bis 47 %). Berlin- und
Bezirks-Werte waren davon nicht betroffen (SUM über alle Stimmbezirke
inklusive Briefwahl, siehe oben).

**Lösung:** Die kleinste Kartenebene ist die **Briefwahl-Gruppe**: alle
Urnen-Stimmbezirke mit gleichem Briefwahlbezirk plus dieser Briefwahlbezirk
selbst (Tagesspiegel-Vorbild: „Stimmbezirke 726, 727 und 7P"). Geometrie =
Dissolve der Urnen-Polygone je Gruppe. Kiez-Aggregat und Analytik enthalten
seither die Briefwahl.

**Gruppen-ID-Bildung** (`gruppeIdFromGeo` in `src/lib/data/wahl-geo-mapping.ts`,
Schlüssel = DB-uwbId des zugehörigen Briefwahl-Stimmbezirks): das
Briefwahlbezirk-Feld im Shapefile variiert pro Geo-Slug, genau wie das
UWB3-Äquivalent für Urnen (`pickUwb3`):

| Geo-Slug           | Feld  | Beispielwert | Gruppen-ID-Format |
| ------------------ | ----- | ------------ | ------------------ |
| ah16               | BWB   | `011A` (BEZ+Suffix verschmolzen) | `${BEZ}B${Suffix}` |
| btw17              | BWB2  | `2C`          | `${BWK}-${BEZ}-${BEZ}B${Suffix}-5` |
| ah21 / ah26 / bt25 | BWB3  | `1A`          | AGH/BVV: `${BEZ}B${Suffix}`; BTW: `${BWK}-${BEZ}-${Suffix}-5` |

`ah23` fehlt bewusst: Wahllokale-Punkte statt Polygone, für Choropleth
ungeeignet (siehe Geometrie-Coverage-Tabelle oben) -- agh23/bvv23 laufen über
den `ah21`-Layer.

**Neue Tabelle `wahl_stimmbezirk_gruppe` (wahl_id, uwb_id, gruppe_id):**
ordnet jeden Stimmbezirk (Urne ODER Briefwahlbezirk) einer Wahl seiner
Gruppe zu; die Briefwahl-Row zeigt dabei auf sich selbst
(`uwb_id === gruppe_id`). Gefüllt im Kiez-Build aus der Geometrie. Build
bricht ab (statt still wegzulassen), wenn ein Briefwahl-Stimmbezirk keiner
Gruppe zugeordnet werden kann oder eine Urne ohne Gruppe bleibt, und wenn die
Summe aller Gruppen einer Wahl nicht der amtlichen Berlin-Summe entspricht.

**Kiez-Split:** Für Urne `u` in Gruppe `g` gilt
`brief_u = brief_g × wb_u / Σ wb(g)` (`wb` = Wahlberechtigte der Urne, Spalte
`stimmbezirk.wahlberechtigte`; `0` zählt wie fehlend). Die Rundung läuft
Largest-Remainder-basiert und PRO PARTEI innerhalb einer Gruppe (nicht
einmal über die Gruppen-Gesamtsumme): jede Partei verteilt ihre eigenen
Briefwahl-Stimmen exakt auf die Mitglieds-Urnen, jede Partei-Verteilung
summiert sich für sich schon exakt auf den Briefwahl-Rohwert dieser Partei
zurück. Ein Gruppen-Centroid hätte Gruppen an Kiezgrenzen komplett einem
Kiez zugeschlagen; die Urnen-Zuordnung zum Kiez bleibt dadurch exakt
(Centroid-Verfahren, siehe oben), nur die Briefwahl selbst ist anteilig
geschätzt. Keine Schätzung auf Stimmbezirks-Ebene: die Karte zeigt dort
echte Gruppen-Summen, keine Verteilung.

**Summen-Check:** die Gruppen-Summe (Urne + Brief über die Gruppen-
Zuordnung erreichbar) muss der amtlichen Berlin-Summe entsprechen
(`wahl_aggregat_berlin`, unabhängig von den geladenen `ergebnis`-Rows
gelesen); der Kiez-Split muss dieselbe Gruppen-Summe exakt reproduzieren
(`sumKiez + Stimmen der Urnen ohne Kiez == Gruppen-Summe`). Zusätzlich
gated: fehlende/`0`-Wahlberechtigte über 1 % aller Urnen einer Wahl,
widersprüchliche Urne→Gruppe-Zuordnungen aus der Geometrie, Geometrie-
Gruppen ohne passende DB-Briefwahl-Row. Jede Verletzung bricht den Build ab.

Rechenkern: `scripts/wahlen/lib/gruppe-mapper.ts` (pure, DB-frei --
Urne-uwbId → Gruppen-ID aus der Geometrie), `gruppe-preflight.ts` (alle
Gates), `briefwahl-split.ts` (Largest-Remainder-Verteilung),
`kiez-aggregat-plan.ts` (fasst Gates + Verteilung + Anteil-Berechnung zu
einer reinen, DB-freien Planungsfunktion zusammen). Build-Script:
`scripts/build-wahl-kiez-aggregat.ts` (I/O + Transaktion pro Wahl/Stimmtyp).

## Parteien-Alias-Tabelle

Parteien werden über `partei` + `partei_alias` modelliert, weil sich Schreibweisen über die Jahre ändern. Seed in `scripts/wahlen/lib/partei-seed.ts`.

| Kurzname (DB) | Aliase                                                                                                     | First Seen |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| SPD           | SPD, Sozialdemokratische Partei Deutschlands                                                               | -          |
| CDU           | CDU, Christlich Demokratische Union Deutschlands                                                           | -          |
| CSU           | CSU                                                                                                        | -          |
| GRÜNE         | GRÜNE, B'90/GRÜNE, Bündnis 90/Die Grünen, Die Grünen (case-insensitive, matcht auch BÜNDNIS 90/DIE GRÜNEN) | -          |
| FDP           | FDP, Freie Demokratische Partei                                                                            | -          |
| AfD           | AfD, Alternative für Deutschland                                                                           | 2013       |
| Die Linke     | Die Linke, DIE LINKE, Linkspartei.PDS, PDS, Linke                                                          | -          |
| BSW           | BSW, Bündnis Sahra Wagenknecht - Vernunft und Gerechtigkeit                                                | 2024       |
| FREIE WÄHLER  | FREIE WÄHLER                                                                                               | -          |
| Sonstige      | Sonstige, Übrige, übrige                                                                                   | -          |

**AGH/BVV 2026 Legenden-Aliase:** Die DSB-Legende von wahlen-berlin.de nennt
Parteien mit ihrem vollen amtlichen Namen statt der SBB-Kurzform. Aliase oben
um die Langformen ergänzt (`scripts/wahlen/lib/partei-seed.ts`). Alle 2026er
Parteien unter 3 % (u. a. PARTEI MENSCH KLIMA TIERSCHUTZ 2,1 %, Volt
Deutschland 2,1 %) fallen automatisch in `Sonstige`, ohne eigenen Alias-Eintrag.

**Pflege-Regel:** Bei neuer Wahl muss die Liste gegen die echten CSV-Spalten geprüft werden. Unbekannte Parteien fallen automatisch in `Sonstige`. Wenn eine `Sonstige`-Partei jemals > 3 % erreicht oder als Top-5 erscheint, eigene Tabellenzeile aufnehmen.

## Wiederholungswahlen

`wahl.is_repeat_election = true` + `wahl.parent_election_id = parent_wahl_id` markieren Wiederholungswahlen. Bekannte Fälle:

- AGH 2023 + BVV 2023 (Wiederholung von 2021, von Berliner VerfGH ungültig erklärt). In DB markiert via `parent_election_id` → AGH/BVV 2021.
- BTW 2024 (partial-Wiederholung in Berlin, Februar 2024): aktuell NICHT in DB, weil Bundeswahlleiterin kein eigenes `_wbz.zip` publiziert hat. Backlog.
- BTW 2025 enthält Wiederholungs-Komponente in Teilen Berlins via Title-Line der CSV markiert. In DB als reguläre BTW 2025 geführt, weil Bundeswahlleiterin die Wiederholung in das BTW25-Endergebnis integriert hat.

UI (Story 6.3) muss diese Wahlen als „Wiederholungswahl" labeln und in Sparklines als separaten Datenpunkt zeigen, NICHT als Ersatz für die Erst-Wahl.

## Analytik-Methoden

Build-Zeit-Aggregat (ADR-013: Postgres als Cache, kein Live-Rechenpfad) für Wechsel, Trend und Volatilität pro Kiez und Wahl-Reihe (typ × stimmtyp). Rechenkern: `src/lib/server/wahl/analytik.ts` (pure Functions, Fixture-Tests). Build-Script: `scripts/build-wahl-analytik.ts`, liest `wahl_aggregat_kiez`, schreibt `wahl_analytik_kiez` + `wahl_trend_kiez`. Phase 1 nur Kiez-Ebene (Bezirk-Analytik wäre günstig nachrüstbar, aber noch nicht gebaut). API-Konsequenz: `/api/wahl/series` und `/api/wahl/winners` akzeptieren `ebene=kiez|bezirk`, `/api/wahl/analytik` bewusst nur `ebene=kiez`. Anteils-Gleichstände löst die Analytik deterministisch alphabetisch nach Partei-Kurzname auf.

**Wiederholungswahl-Regel:** Alle drei Metriken nutzen pro Legislatur den letztgültigen Stand. Eine Wiederholungswahl (z.B. AGH 2023) ersetzt ihre Eltern-Wahl (AGH 2021) an deren Position in der Reihe, statt einen eigenen Slot zu belegen. Der Übergang Eltern-Jahr → Wiederholungs-Jahr (2021 → 2023) zählt dadurch nie als eigener Wechsel; ein Wechsel gegenüber der vorherigen Legislatur wird stattdessen am Wiederholungs-Jahr gebucht.

**Wechsel:** Anzahl + Jahre der Führungswechsel (stärkste Partei) über die effektive Legislatur-Reihe eines Kiez.

**Trend:** Steigung (`slope`) der linearen Regression (kleinste Quadrate) des Partei-Anteils über die Jahre der effektiven Reihe. Jahre ohne Anteil für die Partei werden ausgelassen. Mit < 2 Datenpunkten: `slope = 0`.

**Volatilität:** Mittlere L1-Distanz aufeinanderfolgender Anteils-Vektoren (Summe der absoluten Anteils-Differenzen über alle Parteien) zwischen zwei benachbarten Legislaturen der effektiven Reihe, gemittelt über alle Übergänge. Mit < 2 Legislaturen: `0`. `volatilitaet × 100` ist die Summe der Prozentpunkt-Beträge über ALLE Parteien, keine Verschiebung einer einzelnen Partei -- die Trend-/Volatilitäts-Karte beschriftet den Wert deshalb als „Gesamtverschiebung" (`formatVolatilitaetLabel`, `trends-map-data.ts`).

**Klassifizierungs-Schwellen der Trend-/Volatilitäts-Karte:** Trend (`slope × 100`, Pp./Jahr): „stabil" unter ±0,2, „leicht" ab ±0,2, „stark" ab ±1,0. Volatilität (`volatilitaet`, Rohwert 0..2): „gering" unter 0,05 (5,0 Pp. Gesamtverschiebung), „mittel" 0,05 bis 0,12 (5,0 bis 12,0 Pp.), „hoch" ab 0,12 (12,0 Pp.). Rechenkern + Schwellen-Konstanten: `src/lib/components/wahl-portal/internal/trends-map-data.ts`.

**Zwilling (Kiez-Ähnlichkeit):** Anders als Wechsel/Trend/Volatilität kein Build-Zeit-Aggregat, sondern Laufzeit-Berechnung über den vorhandenen Bulk-Query `get-kiez-shares-for-wahl` (143 Anteils-Vektoren pro Request sind billig genug, Route cached 3600s). Score = `1 − normierte L1-Distanz` der Anteils-Vektoren der jüngsten Wahl der Reihe, skaliert auf 0..100 (L1-Distanz zweier Anteils-Vektoren mit Summe 1 liegt in [0, 2], normiert durch Division durch 2).

**Sankey (Wahljahre-Übergänge):** Client-seitig aus der bereits geladenen Bulk-Winners-Response (`/api/wahl/winners`) berechnet, kein eigenes Server-Aggregat. Spalten-Modell (Story 11, Rework, REVIDIERT 12:07: Gebiets-Spalte zurückgenommen): je Wahl der effektiven Legislatur-Reihe eine Spalte (dieselbe Wiederholungswahl-Regel wie oben: eine Wiederholungswahl ersetzt ihre Eltern-Wahl an deren Position), Knoten = die Parteien dieser Wahl untereinander.

Bänder sind Partei-Übergänge zwischen zwei benachbarten Spalten, **gebündelt pro Partei-Paar**: alle Gebiete mit demselben Von-Partei/Nach-Partei-Übergang zwischen denselben zwei Jahren bilden EIN Band, dessen Breite die Anzahl der Gebiete zählt (nie Personen, nie ein Band pro Gebiet). Ein unveränderter Übergang (Partei A → Partei A) zählt ebenfalls als Band. Ein Live-Test mit einer ersten Gebiets-Spalte (ein Band je Gebiet) erwies sich auf Kiez-Ebene als unlesbar (143 Einzel-Bänder); das gebündelte Modell bleibt deshalb bewusst bei Partei→Partei. Je Partei-Spalte entspricht die Summe der Bandbreiten exakt der Anzahl der Gebiete MIT DATEN IN DIESEM JAHR, nicht der Gesamtzahl aller je erfassten Gebiete -- ein Gebiet mit kürzerer Datenhistorie (Coverage-Grenze, z. B. BVV-Kiez ab 2016) trägt nur in den Spalten bei, die es tatsächlich abdeckt, auch wenn diese Spalte erst in der Mitte der Reihe liegt. Ebenen-Beschränkung: nur Kiez oder Bezirk (LOR-stabile Ebenen über alle Wahljahre), nie Stimmbezirk (Wahlkreis-Zuschnitte ändern sich zwischen Wahlen).

Sieger-Semantik: nur Parteien mit mindestens einem Platz-1-Gebiet erscheinen als Partei-Knoten in einem Jahr. Ein sichtbarer Erklär-Satz am Sankey und der Tooltip jedes Partei-Knotens („stärkste Kraft in N von M Gebieten") machen das direkt in der Grafik nachvollziehbar, statt den Eindruck eines Datenfehlers zu erwecken.

Rechenkern: `src/lib/components/wahl-portal/internal/wechsel-data.ts` (`computeUebergaengeFromRows`/`effectiveJahreFromRows`/`parteiAnzahlProJahrFromRows`), Graph-Konstruktion (reine Nodes/Links, unit-testbar): `internal/sankey-graph.ts`. Layout mit `d3-sankey` (lazy geladen, eigener Vite-Chunk `sankey`, kein Eigenbau-Layout mehr): `internal/sankey-d3-layout.ts` + reaktiver Controller `internal/sankey-d3.svelte.ts`. Hover-/Fokus-Tooltip: `internal/sankey-tooltip.svelte` + `internal/sankey-interaction.ts`. Der Client-Zwilling der Wiederholungswahl-Merge-Regel (`mergeEffectiveSeries` in `wechsel-data.ts`) bleibt gegen die Server-Semantik (`analytik.ts#mergeRepeatElections`) durch `src/lib/server/wahl/wechsel-client-parity.test.ts` geklammert.

## Anteils-Intensität (Partei-Tabs)

Die Winner-Map bekommt neben der Sieger-Ansicht („Gewinner") einen Tab je `FINDER_PARTIES`-Partei (SPD, CDU, GRÜNE, FDP, AfD, Die Linke, BSW). Im Partei-Modus färbt die Karte durchgängig in der Farbe DIESER Partei; die Deckkraft trägt die Information, nicht die Farbe.

**Server:** `partei`-Param an `/api/wahl/winners` (Picklist = `FINDER_PARTIES`) schaltet von `getWinnersBulk`/`getStimmbezirksWinners` auf `getParteiAnteileBulk`/`getParteiAnteileStimmbezirk` um -- gleiches Row-Shape, `anteil` ist jetzt der Anteil der gewählten Partei statt des Siegers. Response-Mapping (jahr, parent_slug, license) bleibt unverändert.

**Partei-relative Deckkraft-Rampe:** Die feste Sieger-Rampe (`ANTEIL_OPACITY_RAMP`, 0,15-0,45 Anteil → 0,4-0,9 Deckkraft) würde eine durchgängig schwache Partei (z. B. FDP) flächig auf Minimal-Deckkraft zeigen, eine durchgängig starke Partei (z. B. CDU in einzelnen Wahl-Reihen) flächig auf Maximal-Deckkraft -- in beiden Fällen verschwindet die interne Verteilung. `parteiAnteilSpanne` normiert deshalb auf die TATSÄCHLICHE Anteils-Verteilung der gewählten Partei in der geladenen Reihe (Min/Max über alle Jahre × Gebiete bzw. alle Gebiete eines Stimmbezirks-Jahres).

**Eine einzige Bezugsgröße gilt überall:** die Rampe ist immer REIHEN-weit normiert (alle Jahre × Gebiete der Partei), nie auf das gerade angezeigte Jahr beschränkt -- Karte, Small Multiples und Editorial-Texte teilen dieselbe Spanne. Das macht Jahre in der Zeit-Animation vergleichbar (dieselbe Farbintensität bedeutet über alle Jahre denselben Anteil) und hält die Mini-Karten deckungsgleich mit der Karte. Takeaway und Legende nennen die Bezugsgröße deshalb explizit: „… über alle Wahlen der Reihe" (`parteiTakeawaySentence`) bzw. ein Normierungs-Satz in der Legende (`parteiLegendeRampeText`).

Die Deckkraft-Grenzen der Partei-Rampe (`PARTEI_OPACITY_RANGE`) liegen bei 0,15 (Spannen-Minimum) bis 0,9 (Spannen-Maximum), linear interpoliert dazwischen -- deutlich niedriger am unteren Ende als die Sieger-Rampe (0,4), aber bewusst über der `NEUTRAL_OPACITY` (0,1) für Gebiete ganz ohne Daten: das Gebiet mit dem niedrigsten Partei-Anteil bleibt so immer sichtbar präsenter als ein Gebiet ohne Match. Ein niedriger Floor macht Unterschiede innerhalb der Partei-Verteilung sichtbar, ohne die Fläche auf reine Partei-Farbe ohne Informationswert zu reduzieren.

**Wechsel-Semantik entfällt:** Der Partei-Modus bakt über `bakeParteiJahrProperties` (Wechsel-Flags konstant 0) statt `bakeJahrProperties`; die Wechsel-Outline bleibt aus (`NEVER_FILTER`), weil „Führungswechsel der stärksten Partei" im Partei-Modus keine Bedeutung hat.

**Datenlücken:** Die Rampe bleibt reihen-weit auch dann, wenn das GEWÄHLTE Jahr keine Daten für die Partei hat (z. B. BSW vor 2024 in einer Reihe mit späteren BSW-Jahren). Ob ein Hinweis statt der Karte/Legende erscheint, entscheidet sich am gewählten Jahr, nicht an der Reihe: hat die Partei für das gewählte Jahr keine Rows, zeigen Karte, Legende und Takeaway einen neutralen Hinweis statt einer erfundenen Rampe oder einer leeren Fläche.

Rechenkern: `src/lib/components/wahl-portal/internal/winner-map-expressions.ts` (`parteiAnteilSpanne`, `parteiFillOpacityExpression`, `genericParteiFillOpacityExpression`, `parteiOpacityForAnteil` als JS-Zwilling für Legende/Small-Multiples), Editorial-Texte: `winner-map-partei-text.ts`.

**Small Multiples (Kapitel „Stärkste und schwächste Gebiete"):** Eine statische SVG-Mini-Karte je Partei (kein MapLibre), gemeinsame Web-Mercator-Projektion über alle sieben Minis (`internal/geo-svg.ts`, Eigenbau ohne `d3-geo`), das im Portal gewählte Jahr der Reihe (`currentJahr`, respektiert einen Nutzer-Override), Kiez-Ebene. Jede Mini-Karte nutzt dieselbe REIHEN-weite Anteils-Spanne wie die Karte (nicht die Spanne des angezeigten Jahres allein) UND denselben `parteiOpacityForAnteil`-JS-Zwilling, damit Karte und Mini-Karten dieselbe visuelle Sprache teilen. Extrem-Kieze (stärkster/schwächster Anteil) lösen einen Gleichstand deterministisch alphabetisch (`localeCompare('de')`) auf. Ein fehlgeschlagener Partei-Request blendet nur die betroffene Mini-Karte aus (eigene Fehler-Kachel), nie das gesamte Kapitel. Rechenkern: `internal/small-multiples-data.ts`.

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

# Analytik-Build (Wechsel/Trend/Volatilität, braucht data:wahl-kiez)
pnpm data:wahl-analytik

# Einzelne Wahl-Art
pnpm data:wahl-analytik --only=agh
```

**Verfügbare Wahl-Slugs:** `btw13` `btw17` `btw21` `btw25` `agh11` `agh16` `agh21` `agh23` `agh26` `bvv11` `bvv16` `bvv21` `bvv23` `bvv26`.

**Verfügbare Geometrie-Slugs:** `btw17` `ah16` `ah21` `ah23` `bt25` `ah26` (`ah21` combined für BTW21+AGH21+BVV21 UND geteilt mit AGH23/BVV23-Wiederholung, `ah16` combined für AGH16+BVV16, `ah23` Wahllokale-Variant -- nicht für Choropleth konsumiert, siehe Geometrie-Coverage-Tabelle --, `ah26` für AGH26+BVV26).

### URL-Recon-Pattern (volatile Hash-URLs)

Die `statistik-berlin-brandenburg.de/opendata/*.zip`-URLs sind kein direkter Download, sondern Scrivito-SPA-Routes. JS resolved client-side zur echten Hash-URL auf `download.statistik-berlin-brandenburg.de`. `curl`/`fetch` liefern HTML (69 KB SPA), nicht ZIP.

Bei stale Hash-URL: Playwright-Headless gegen die `/opendata/*.zip`-URL navigieren, Network-Response auf `download.statistik-berlin-brandenburg.de` abfangen. Pattern in `scripts/wahlen/spike-fetch.ts` (Spike-Modus für BTW) bzw. manuell via Browser-DevTools für AGH/BVV/Geometrien.

**AH26-Geometrie (Recon 23.09.2026):** `https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AH26.zip` per Playwright navigiert, Network-Response auf `download.statistik-berlin-brandenburg.de` abgefangen → `https://download.statistik-berlin-brandenburg.de/17c6e6ab35dd6980/a43a09d174ed/RBS_OD_UWB_AH26.zip` (2542 Urnenwahlbezirke, Shapefile-Felder `UWB`/`UWB3`/`BEZ`/`BWK`, identisch zu `ah21`). Die wb-csv-Download-URLs selbst sind stabil (keine Hash-Komponente, direkte `wahlen-berlin.de`-Pfade aus `downloads.html`).

## Out-of-Scope

Folgende Daten sind explizit ausgeschlossen für Phase 1:

- Volksentscheide (Story 6.6 cancelled)
- Europawahlen (Phase 2 Backlog, eigene Source-Pipeline ggf. analog BTW-\_wbz)
- BTW 2024 Wiederholung (eigene Berliner-Pipeline später)
- pre-2011-AGH/BVV + pre-2013-BTW (FragDenStaat-IFG-Anfrage, Phase 2)
- Live-Wahl-Auszählung am Wahltag (Memory `feedback_no_live_data` lock)
- Wahlkreise als eigene Geo-Ebene (entfällt mit Story 6.1 cancelled)
