# Spike: Lärm-dB-Upgrade (Strategische Lärmkarten 2022)

Story 10.6 · Datum 2026-05-21 · Status: abgeschlossen, Entscheidung getroffen

## Frage

Können die Strategischen Lärmkarten 2022 (fassadengenaue dB) den groben
3-Stufen-Umweltgerechtigkeits-Index (`laerm-2023`, gering/mittel/hoch pro 542
LOR-Planungsräume) im Score „Ruhe & Luft" ersetzen?

## Befund (live geprüft 2026-05-21)

WFS-Endpoint: `https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022`
Lizenz: dl-de/zero-2.0. CRS: EPSG:25833 (UTM33). Format: **Vektor, kein Raster**.

Kein GeoTIFF/WCS-Raster im Dienst. Die Annahme aus dem Audit (Raster/GeoTIFF,
Tile-Pipeline-Frage) trifft nicht zu. Stattdessen Vektor-Feature-Typen:

| typeName                                   | Inhalt                                   | dB-Feld                            | Features      |
| ------------------------------------------ | ---------------------------------------- | ---------------------------------- | ------------- |
| `aa_fp_gesamt2022`                         | Fassadenpegel-Punkte                     | `ges_den`, `ges_n` (+ str/sch/flg) | **3.799.746** |
| `ab_wohngebaeude2022`                      | Wohngebäude-Polygone                     | keins (nur `typ`)                  | 305.574       |
| `ac_krankenhaeuser`/`ad_bildung`/`ae_kita` | sensible Gebäude                         | —                                  | klein         |
| `da_autobahn` … `de_strassen_ubahn`        | Quell-Linien + Verkehrsmengen (kfz/lkw…) | **keins**                          | 285 – 9.179   |

Schlüssel: die dB-Werte liegen ausschließlich als **3,8 Mio Fassadenpunkte**
(`aa_fp_gesamt2022.ges_den`) vor. Es gibt keine kontinuierlichen dB-Iso-Flächen
als Polygon-Layer. Die `dc/da/db/dd/de`-Layer sind Quell-Geometrien mit
Verkehrszählung, ohne dB.

## Integrationswege

**A · Per-LOR-dB-Mittel (Build-Time-Aggregation).**
3,8 Mio Fassadenpunkte via WFS-Paging holen, pro LOR-Planungsraum Mittel/Median
`ges_den` aggregieren, als kleines JSON (542 Werte) committen. Score liest den
Wert, `normalizeNumericInverted` (bestAt ~45 dB, worstAt ~75 dB). Kein Tile-Serve.

- Aufwand: M-L (WFS-Paging über 3,8 Mio Features, Aggregations-Script, Pipeline).
- Ergebnis: dB-basiert, aber wieder **auf LOR-Ebene gemittelt** → Auflösungsgewinn
  gegenüber dem 3-Stufen-Index real, aber begrenzt (Hauptstraße + Hinterhof eines
  LOR werden erneut gemittelt). Kein No-Data-Problem, da pro LOR aggregiert.

**B · Adress-genaue Fassaden-Abfrage (fassadengenau, das eigentliche Ziel).**
3,8 Mio Punkte als PMTiles + Runtime-Nächster-Fassadenpunkt (Muster wie
`klima-pet-2022`, Story 10.9/10.10: PMTiles für Map + Precompute-Punkte für Build).

- Aufwand: L-XL (Tile-Pipeline für 3,8 Mio Punkte, Runtime-Lookup, No-Data-Semantik
  in ruhigen Lagen ohne Fassadenpunkt).
- Ergebnis: echter fassadengenauer Gewinn. No-Data-Ambiguität (kein Punkt = ruhig
  ODER keine Erhebung) muss editorial gelöst werden.

## Entscheidung

**Folge-Story, kein Defer** — die Daten sind zugänglich und vektorbasiert (anders
als die wegen Raster/Tile-Last deferred `solarpotenzial`/`klimaanalyse`). Aber
schwerer als im Audit angenommen (3,8 Mio Punkte, kein fertiges Iso-Flächen-Layer).

Empfohlene Reihenfolge:

1. **10-6b (Variante A, M-L):** Per-LOR-dB-Mittel als erster Schritt. Ersetzt den
   3-Stufen-Index durch dB-Mittel, moderater Auflösungsgewinn, kein Tile-Zwang.
2. **Später (Variante B, L-XL):** Adress-genaue Fassaden-Abfrage via PMTiles +
   Precompute, wenn das Map-Tile-Muster aus 10.9/10.10 etabliert ist. Erst dann
   materialisiert sich der volle „fassadengenau"-Gewinn.

Bis dahin bleibt `laerm-2023` (3-Stufen, ordinal-3) der Score-Input.

## Score-Anbindung (für Folge-Story)

- `normalizeNumericInverted` existiert (`scripts/lib/kiez-score/normalize.ts`),
  Parametrisierung gegen reale Berliner `ges_den`-Spanne validieren (Richtwert
  bestAt 45 dB, worstAt 75 dB).
- Build-Aggregation analog `scripts/build-klima-pet-points.ts` (Story 10.10):
  WFS holen, reprojizieren (UTM33→WGS84), aggregieren, JSON committen.
- Per-LOR-Pfad nutzt das `perLorHits`-Pipeline-Muster (Story 10.1).

## Quellen

- WFS GetCapabilities: `https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022?REQUEST=GetCapabilities&SERVICE=WFS`
- Datensatz: daten.berlin.de/datensaetze/strategische-larmkarten-2022-umweltatlas-wfs-2936b5b8
- Audit V6: `_user-input/datenaufloesung-audit-2026-05-21.md` Zeilen 174-178
- Defer-Präzedenz: `scripts/lib/sources.ts` (wohnlagen/sol/klima Tile-Defer)
