---
title: 'gh-161: Data Stories, Kennzahlen pro Kiez und Bezirk vorberechnen'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '81c9b845184731b3c57f9817fbb6a737ce4149a9'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md', '{project-root}/docs/DESIGN.md', '{project-root}/docs/data-pipeline.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Visualisierungen der Data Stories (#163 ff.) brauchen pro Kiez und Bezirk dieselben Kennzahlen. Heute rechnen nur die lokalen Skizzen-Skripte sie. Diese Skripte sind ungetestet und liegen nicht im Repo.

**Approach:** Zwei Skripte nach dem Muster der vorhandenen `fetch-zensus-*`- und `build-*`-Skripte:

1. `fetch:zensus-gehweite` lädt das Zensus-2022-Bevölkerungsgitter (100 m). Es berechnet pro Planungsraum Einwohner und Einwohner mit einer Haltestelle in 400 m Luftlinie. Das Ergebnis ist eine committete JSON.
2. `data:stories-kennzahlen` rechnet offline aus vorhandenen Daten plus dieser JSON die Kennzahlen pro Kiez und Bezirk. Es schreibt `static/data/stories-kennzahlen.json` mit Quelle und Stand.

Die Seiten rechnen nichts live. Freigabe: Matze 31.10. pauschal („mach das alles in einem Rutsch“).

## Boundaries & Constraints

**Always:**
- Kennzahlen je Kiez (`kiez_slug`) und Bezirk (`bezirk_slug`), gewichtet wie in den abgenommenen Skizzen:
  - `bewohner`: Einwohner gesamt.
  - `bewohnerProKm2`: Summe Einwohner / Summe Fläche.
  - `laermDb`: Mittel von `dbDenMean`, gewichtet mit `count`.
  - `altbauAnteil`: Mittel von `altbau_anteil`, gewichtet mit `wohnungen`.
  - `hitze`: Bioklima hoch 1, mittel 0,5, gering 0, flächengewichtet.
  - `gruen`: Grünversorgung gut 1, mittel 0,5, schlecht 0, flächengewichtet.
  - `clubs`: Anzahl Club-Punkte in den Planungsräumen.
  - `haltestelle400mAnteil`: Einwohner mit Haltestelle in 400 m / Einwohner im Gitter.
- Fehlende Werte bleiben `null`. Der Code erfindet keine Ersatzwerte. Die Skizzen hatten 0,5 als Default, das entfällt bewusst.
- Formeln als reine Funktionen mit Unit-Tests (TDD), inklusive Randfälle: Gewicht 0, alle Werte `null`, leerer Kiez, Punkt auf der Grenze.
- Die Ausgabe enthält `schemaVersion`, `generatedAt` und `sources`, jeweils mit Name, URL oder Datei und Stand. Die Ausgabe ist deterministisch sortiert.
- Planungsräume erscheinen nicht in der Ausgabe für die Seiten. Sie sind nur Rechengrundlage.
- Die Gehweite-JSON pro Planungsraum ist Zwischenergebnis und wird committet. Der Build braucht so kein Netz.

**Never:**
- Nicht in `prebuild` oder die CI hängen. Beide Skripte laufen manuell wie `fetch:zensus-altbau`.
- Keine neue Karten-Ebene.
- Keine UI.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal | alle Quellen vorhanden | 12 Bezirke, alle Kieze aus `zensus-altbau-anteil-2022` mit allen Kennzahlen | N/A |
| Fehlende Lärmwerte | Kiez ohne `dbDenMean` | `laermDb: null` | kein Abbruch |
| Gehweite-JSON fehlt | Datei nicht da | Skript bricht mit Hinweis auf `pnpm fetch:zensus-gehweite` ab | Exit ≠ 0 |
| Planungsraum ohne Kiez-Zuordnung | `kiez_slug` leer | zählt nicht, Warnung mit Anzahl | Warnung |

</frozen-after-approval>

## Code Map

- Vorbild Fetch: `scripts/fetch-zensus-altbau.ts`:
  - Download nach `.cache/zensus`, `assertAllowed`, `USER_AGENT`, `extractFrom7z`.
  - CSV-Parsing in `scripts/lib/zensus/`: `grid-id.ts`, `laea.ts` (`laeaToWgs84`), `assign-cells.ts` (`accumulateByPlr`).
  - Bevölkerungsgitter: Destatis „Zensus2022_Bevoelkerungszahl“, 100-m-Gitter, CSV mit `GITTER_ID_100m;x_mp_100m;y_mp_100m;Einwohner`. Die URL liegt vermutlich im selben Ordner wie das Altbau-Archiv (`https://www.destatis.de/static/DE/zensus/gitterdaten/Zensus2022_Bevoelkerungszahl.zip`). Vor dem Bau per HEAD prüfen. Ist sie falsch, die richtige URL auf der Destatis-Gitterdaten-Seite suchen und eintragen.
- Haltestellen: `scripts/lib/oepnv-stop-index.ts` (`extractStops`, `dedupeStops`) über die Layer `ubahn-stationen`, `sbahn-stationen`, `tram-haltestellen`, `bus-haltestellen`. Distanz in LAEA-Metern, Bucket-Raster 400 m (siehe Design Notes).
- Räumliche Helfer: `scripts/aggregate/spatial.ts` (`pointInPolygon`, `pointsInPolygon`).
- Dateien über das Manifest: `scripts/lib/manifest.ts`, `static/layers/MANIFEST.json` (gehashte Namen).
- Quellen:
  - `zensus-altbau-anteil-2022` (`plr_id`, `altbau_anteil`, `wohnungen`, `kiez_slug`, `bezirk_slug`).
  - `lor-planungsraum` (`PLR_ID`, `GROESSE_M2`, Geometrie).
  - `bioklima-2023`, `gruenversorgung-2023` (`kategorie`).
  - `kultur-club` (Punkte).
  - `static/data/einwohner-lor.json` (`plrId`, `gesamt`, `stichtag`).
  - `static/data/laerm-db-lor.json` (`plrId`, `dbDenMean`, `count`).
- Ausgabe-Konvention wie `scripts/build-laerm-db-lor.ts` (Zeilen 16 und 82). Neu: `static/data/zensus-gehweite-lor.json` und `static/data/stories-kennzahlen.json`.
- `scripts/lib/is-main-entry.ts`: Entry-Guard, Pflicht (siehe Memory „Rank/Comparison CASCADE wipe“).
- `package.json`: Skripte `fetch:zensus-gehweite` und `data:stories-kennzahlen`.
- `docs/data-pipeline.md`: zwei Zeilen zu den neuen Skripten.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/lib/stories/kennzahlen.ts` + Test: Gewichtung, `null`-Regeln, Aggregation Planungsraum → Kiez/Bezirk.
- [x] `scripts/lib/stories/gehweite.ts` + Test: Zelle → Planungsraum, Haltestelle in 400 m (Grenzfall genau 400 m zählt).
- [x] `scripts/fetch-zensus-gehweite.ts`: ausführen, `static/data/zensus-gehweite-lor.json` erzeugen. Gegenprobe: Berlin gesamt ungefähr 95,9 % (Skizze, ungeprüft).
- [x] `scripts/build-stories-kennzahlen.ts`: ausführen, `static/data/stories-kennzahlen.json` erzeugen.
- [x] `package.json`, `docs/data-pipeline.md`.

**Acceptance Criteria:**
- Given beide JSON-Dateien, when der Build-Test läuft, then sind es 12 Bezirke, jeder Kiez hat einen Bezirk, kein Anteil liegt außerhalb [0, 1] und kein Planungsraum steht in `stories-kennzahlen.json`.
- Given `pnpm check`, then 0 Fehler.

## Design Notes

Gehweite schnell: Haltestellen in ein Raster mit Zellgröße 400 m einsortieren. Für jede Gitterzelle nur die 3×3 Nachbarzellen prüfen. Rund 360.000 Berliner Zellen laufen so in Sekunden.

## Implementation Notes

- Destatis-URL bestätigt (HEAD 200). Gegenprobe: Berlin 95,8 % mit Haltestelle in 400 m (Skizze 95,9 %), 3.595.255 Einwohner im Gitter, 542 Planungsräume.
- Berlin hat 61.235 bewohnte Gitterzellen (nicht 360.000 wie in den Design Notes); Lauf rund 2 s.
- `altbauAnteil` aus Prozent durch 100. Lärm-Stand ist das Referenzjahr 2022 der Karte.
- Warnungen im Lauf: 2 Planungsräume ohne Grünversorgung-Kategorie, 1 ohne Einwohner-Eintrag, 2 Clubs außerhalb aller Planungsräume. Kein Kiez- oder Bezirkswert ist `null`.

## Spec Change Log

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | VG, BH | Output-Test lässt leere Spalten durch | medium | Patch: alle 8 Kennzahlen nicht null, Plausibilitätsgrenzen. |
| 2 | VG | Gehweite-JSON ungeprüft | medium | Patch: eigener Output-Test. |
| 3 | ECH, BH | Lärm-Stand ist Skriptdatum | medium | Patch: Referenzjahr 2022 plus URL. |
| 4 | ECH, BH | Haltestellen-/LOR-Stand ungenau | low | Patch. |
| 5 | BH | Quellnamen ohne Umlaute | low | Patch. |
| 6 | ECH | Leere Records schreiben NaN | low | Patch: Abbruch. |
| 7 | BH | Archiv bei jedem Lauf neu geladen | low | Patch: Cache, `--refresh`. |
| 8 | ECH, BH | Stille Datenlücken (Kategorien, Clubs, Joins) | low | Patch: Warnungen. |
| 9 | ECH | Warnung „ohne Kiez“ ungenau | low | Patch. |
| 10 | BH | Doku zu dünn (Reihenfolge, Felder, zwei Einwohnerbasen, Lärmmittel, Randeffekt, 400 m) | low | Patch in `docs/data-pipeline.md`. |
| 11 | BH | 400 m inkl. Bus trennt Kieze kaum (53 von 143 ≥ 0,99) | medium | Intent legt 400 m fest; Alternative (nur Schiene) ist Matzes Entscheidung. Defer. |
| 12 | BH | Grünversorgung flächen- statt einwohnergewichtet | low | Intent legt Flächengewicht fest (Skizzen). Defer als Frage an Matze. |
| 13 | BH | `createPlrLocator` dupliziert `accumulateByPlr` | low | Andere Schnittstelle (Punkt statt Gitterzelle mit Wert). Abgelehnt. |
| 14 | BH | Strich als 0 Einwohner unbelegt | maybe-false | Bräuchte Datensatzbeschreibung; Gegenprobe 95,8 % passt. Abgelehnt. |

## Verification

Ergebnis 31.10.: 90 Tests grün (`scripts/lib/stories`, `scripts/lib/zensus`), `pnpm check` 0 Fehler. Keine UI, keine Design-Prüfung.

**Commands:**
- `pnpm vitest run scripts/lib/stories` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
