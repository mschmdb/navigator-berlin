# Wahl-Daten-Schema · Spike-Drift-Analyse

Datum: 2026-05-18
Spike-Branch: feat/epic-6-wahldaten
Story: 6.0 Wahl-Daten-Schema + Pipeline-Foundation

## Status

Spike-Phase abgeschlossen für **BTW 2025**. Story-AC-0 ursprünglich für 4 Spikes (AH21/AH16/BVV21/BT21) gegen `statistik-berlin-brandenburg.de/opendata`-Endpoint angesetzt. Pivot per User-Decision 2026-05-18.

## Spike-Finding #1: Source-URL-Drift

### Ursprüngliche Annahme (Story 6.0 AC-0)

```
https://www.statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W1|W2>.csv
```

### Realität

Endpoint liefert 200 OK mit `text/html` Content-Type (React-SPA Catch-all, 69 KB HTML), nicht CSV. Verwaiste Provider-Links auf daten.berlin.de nach SBB-CMS-Relaunch. Recon-Agent hatte diesen Endpoint nicht live verifiziert.

### Pivot (akzeptiert 2026-05-18)

**Primärquelle für Bundestagswahlen:** Bundeswahlleiterin Wahlbezirksstatistik (`_wbz`-Pipeline).

| Wahl | URL | Format |
|------|-----|--------|
| BTW 2025 | `https://bundeswahlleiterin.de/dam/jcr/e79a7bd3-0607-4e87-9752-8e601e299e00/btw25_wbz.zip` | ZIP → CSV |

ZIP enthält:
- `btw25_wbz_ergebnisse.csv` (22 MB, 95.111 Rows, 80 Spalten, alle deutschen Wahlbezirke)
- `btw25_wbz_leitband.csv` (Begleitdaten)
- 4 PDF-Anhänge (Hinweise, Impressum)

**AGH / BVV / Lange Reihen:** Bundeswahlleiterin liefert nur Bundeswahlen. Landeswahlen bleiben bei `download.statistik-berlin-brandenburg.de` (XLSX). Out-of-Scope dieser Story, siehe Phase 2.

## Spike-Finding #2: Format-Realität

| Aspekt | Annahme | Realität |
|--------|---------|----------|
| Encoding | Windows-1252 oder UTF-8 | **UTF-8 mit BOM** |
| Delimiter | Semikolon | **Semikolon** (passt) |
| Line-Terminator | LF | **CRLF** |
| Metadaten-Header | unbekannt | **4 Zeilen** (Copyright, leer, Title, leer) |
| Header-Position | unbekannt | **Zeile 5** (Index 4) |
| Spalten | unbekannt | **80** |
| Erst- / Zweitstimme | getrennte Dateien (`W1`/`W2`) | **eine Datei**, Stimmenart in den Spaltennamen (`<Partei> - Erststimmen`, `<Partei> - Zweitstimmen`) |

### Schema-Konsequenz für AC-1 (Drizzle)

Schema-Entwurf in Story 6.0 sieht eine `wahl`-Tabelle mit `stimmtyp ENUM('erststimme','zweitstimme','einstimme')` und einer Row pro Wahl-Stimmtyp-Kombination vor. Das bleibt strukturell unverändert. Reader-Side wird die eine CSV in zwei logische `wahl`-Rows partitioniert (Erst + Zweit), kein Schema-Rewrite nötig.

### Schema-Konsequenz für AC-2 (Aggregator)

CSV-Pulldown-Approach bleibt korrekt. Anpassungen am Reader:

- Container `zip` mit `streaming-extract` der `_wbz_ergebnisse.csv`-Entry (nicht entpacken auf Disk).
- BOM-Strip beim Lesen (`﻿` am String-Anfang).
- Header-Detection per `Wahlkreis;Land;`-Pattern (nicht fixed line number — robust gegen Metadaten-Zeilen-Änderungen).
- Berlin-Filter früh (`Land == "11"`), reduziert 95.111 → 3.598 Rows in-memory.
- Stimmenart-Partitionierung über Spalten-Suffix (`- Erststimmen` / `- Zweitstimmen`).

## Spike-Finding #3: Stimmbezirks-ID-Struktur

Konkrete Spalten für UWB-Identifier:

| Spalte | Wert | Beispiel | Bedeutung |
|--------|------|----------|-----------|
| 1 `Wahlkreis` | 3-stellig | `074` | Berliner Wahlkreis 074–085 |
| 2 `Land` | 2-stellig | `11` | `11` = Berlin |
| 10 `Wahlbezirk` | 3- bis 6-stellig | `104`, `000001` | UWB-ID innerhalb Wahlkreis (nicht global eindeutig) |
| 11 `Bezirksart` | 1-Char-Marker | `0`, `B`, `1C` etc. | siehe Spike-Finding #4 |

**Konsequenz für Schema:**
`stimmbezirk.uwb_id` muss als **zusammengesetzter Key `wahlkreis + wahlbezirk`** modelliert werden, nicht `wahlbezirk` allein. Story-6.0-Schema-Entwurf `PRIMARY KEY (wahl_id, uwb_id)` muss `uwb_id` als Composite-Key (`${wahlkreis}-${wahlbezirk}`) materialisieren oder PK auf `(wahl_id, wahlkreis, wahlbezirk)` erweitern. Empfohlen: composite-string-uwb-id mit Bindestrich, hält Schema-Form aus AC-1 stabil.

## Spike-Finding #4: Briefwahl-Marker-Realität

Spalte `Bezirksart` (Index 10) trägt den Brief/Urne-Marker. In Real-Daten beobachtet:

- `0` = Urnenwahlbezirk
- `1C`, `1D`, … = Briefwahlbezirk (Buchstaben-Suffix kennzeichnet Briefwahl-Subbezirk)

Kennziffer-Spalten geben zusätzliche Zuordnung:
- Spalte 7 `Kennziffer Urnenwahlbezirke nach § 68 BWO`
- Spalte 8 `Kennziffer Briefwahlzugehörigkeit`

**Konsequenz für Schema:**
`ergebnis.ist_briefwahl_aggregat BOOL` aus AC-1 bleibt strukturell richtig. Detection-Regel: `Bezirksart !== '0'` ODER `Kennziffer Briefwahlzugehörigkeit != '00'`. UWB-Range-Heuristik (`≥ 8000`) aus Story-Text trifft auf BTW 2025 nicht zu, sollte ersetzt werden durch `Bezirksart`-Check (Bundeswahlleiterin-Standard ab 2021).

## Spike-Finding #5: Parteien-Liste (BTW 2025)

29 Parteien-Spalten je Stimmenart (Erst/Zweit). Wichtigste:

```
SPD, CDU, GRÜNE, FDP, AfD, CSU, Die Linke, FREIE WÄHLER,
Tierschutzpartei, dieBasis, Die PARTEI, Team Todenhöfer, PIRATEN,
Volt, ÖDP, SSW, PdH, Bündnis C, BP, MLPD, PdF, SGP, BüSo,
BÜNDNIS DEUTSCHLAND, BSW, MERA25, WerteUnion, Übrige
```

Zwei Asymmetrien Erst- vs. Zweitstimme:
- Zweit hat zusätzlich `Verjüngungsforschung`, `MENSCHLICHE WELT`
- Erst hat nicht `Die Linke` als eigenständige Spalte wenn keine Erststimmen-Kandidatur — Anteils-Berechnung muss tolerant gegen fehlende Erststimmen-Spalten sein

**Konsequenz für `partei_alias`-Tabelle:**

| Aktuell aus AC-1 | Spike-Realität BTW 2025 |
|--|--|
| `DIE LINKE` | `Die Linke` (Casing!) |
| `GRÜNE` | `GRÜNE` (passt) |
| `BSW` | `BSW` (passt, ab 2024) |

Partei-Alias-Resolver muss case-insensitive matchen und Mehrfach-Schreibweisen kennen.

## Out-of-Scope dieser Spike

Geplante Spikes für AH21 / AH16 / BVV21 / BT21 entfallen, weil:

1. **AH21 / AH16 / BVV21** = Landeswahlen, andere Source-Pipeline (XLSX über `download.statistik-berlin-brandenburg.de`). Eigener Spike notwendig, aber Phase 2.
2. **BT21** = Bundestagswahl 2021 (Wiederholungs-Wahl in Teilen Berlins). Gleicher Bundeswahlleiterin-Endpoint, vermutlich strukturell identisch zu BTW25. Spike kann gegen die XLSX-Vergleichsdatei `DL_BE_BT2025_BT2021.xlsx` von SBB laufen wenn Stimmbezirks-Ebene benötigt ist.

## Validierung (Real-Run)

Spike-Runner `scripts/wahlen/spike-fetch-btw25.ts` gegen Live-Endpoint:

```
zip bytes=6059110
csv bytes=22084331
headers=80 rows=95111
berlin rows=3598
asserts: PASS
  berlinRowsAroundExpected: true   (Erwartung 3500-3700, ist 3598)
  wahlkreiseBerlinAllPresent: true (alle 12 von 074-085)
  noNullWahlbezirk: true
```

Snapshot: `wahl-schema-snapshot-btw25.json`.

## Empfehlung Hand-off

1. AC-1 (Drizzle-Schema) kann implementiert werden. Anpassung: `stimmbezirk.uwb_id` als Composite-String `${wahlkreis}-${wahlbezirk}` modellieren oder PK auf `(wahl_id, wahlkreis, wahlbezirk)` erweitern (Memo in Story-Dev-Notes).
2. AC-2 (Aggregator) implementiert werden mit den 5 Reader-Anpassungen aus Finding #2.
3. AC-4 (Briefwahl) Detection-Regel = `Bezirksart !== '0'`, nicht UWB-Range-Heuristik aus Story-Text.
4. AC-0-Wording (4 Spikes) wird im Dev-Agent-Record als „1 Spike done für BTW 2025, AH21/AH16/BVV21 ins Backlog für Story 6.2-Phase-2 / Epic-6-Phase-2b" dokumentiert.
