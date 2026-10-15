---
title: 'Neuer Layer: Bestandsmiete Zensus 2022'
type: 'feature'
created: '2026-10-14'
status: 'done'
baseline_commit: 'fd15ed2b90750ae227fdb340836eec92d81d5a5a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/planning-artifacts/layer-kandidaten-recherche-2026-07-18.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** navigator.berlin hat keine echten Mietdaten, Bodenrichtwerte sind nur ein Proxy. Wer einen Kiez vergleicht, sieht nicht, was Mieterinnen und Mieter dort im Bestand zahlen.

**Approach:** Ein neuer Choropleth-Layer „Bestandsmiete Zensus 2022“ (EUR/m² netto kalt, Stichtag 15.05.2022). Ein Build-Script lädt die Destatis-Gitterdaten mit Miete und Anzahl vermieteter Wohnungen je 100m-Zelle, ordnet die Zellen LOR-Flächen zu und bildet einen wohnungsgewichteten Mittelwert. Der Layer ist mit dem Zwei-Karten-Regelwerk kombinierbar (Fläche und Größen-Symbole).

**Entscheidung Matze 14.10. (Ebene):** Karte auf Planungsraum-Ebene (542 Flächen), direkt aus den Gitterzellen gewichtet. Kiez- und Bezirkswerte entstehen gewichtet aus denselben Zellen. Planungsräume mit weniger als 30 vermieteten Wohnungen zeigen „keine Angabe“.

**Entscheidung Matze 14.10. (Begleitarbeit):** Der Layer ist erst fertig, wenn er überall dort vollständig auftaucht, wo vergleichbare Layer (Vorbild `bodenrichtwerte`, ebenfalls €/m²) auftauchen: Lizenzen-Seite mit korrekter Attribution, Methodik-Seite und `/layer/<slug>`-Methodik, Inspector (Wert, Einordnung, Erklärung, Quelle) auf Planungsraum-, Kiez- und Bezirksebene, Vergleichs-Panel, Layer-Suche/Synonyme, redaktioneller Hinweis, WebMCP-Layer-Metadaten, Pipeline-Doku.

## Boundaries & Constraints

**Always:** Quelle `https://www.destatis.de/static/DE/zensus/gitterdaten/Durchschnittliche_Nettokaltmiete_und_Anzahl_der_Wohnungen.zip`, 100m-CSV (Windows-1252, Semikolon, Dezimalkomma, Spalten `x_mp_100m`, `y_mp_100m` in EPSG:3035, `durchschnMieteQM`, `AnzahlWohnungen`, `werterlaeuternde_Zeichen`). Gebietswert = Σ(Miete × Wohnungen) / Σ Wohnungen, das entspricht der Destatis-Definition. KLAMMERN-Zellen gehen ins Gebietsmittel ein, nie als Einzelwert. Lizenz dl-de/by-2.0, Attribution „Datenquelle: Statistische Ämter des Bundes und der Länder, Zensus 2022“. Label überall „Bestandsmiete (Zensus 2022)“, nie „Mietpreis“ oder „Miete aktuell“. Explain- und Methodik-Text nennen: Bestandsmiete statt Angebotsmiete, Stichtag 2022, Cell-Key-Verrauschung, kein Update bis zum Registerzensus 2031. DE und EN vollständig. Bundle `B: Wohn-Daten`. Generierte GeoJSON und Manifest-Eintrag committen (prebuild baut Layer nicht).

**Never:** Kein 100m-Raster, kein PMTiles (eigene Story). Kein Score-Input. Keine weiteren Zensus-Themen (Leerstand, Baujahr, Heizung). Kein Eintrag in `home-layer-teasers.ts`. Kein Rohdaten-Commit (ZIP nur in `.cache/` oder im Speicher).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gewichtung | Zelle A 10 €/m² × 90 Whg, Zelle B 20 €/m² × 10 Whg | Gebietswert 11,00 | N/A |
| KLAMMERN | Zelle mit `KLAMMERN` | fließt gewichtet ins Mittel, kein eigener Wert | N/A |
| Zelle außerhalb Berlin | Mittelpunkt außerhalb aller LOR-Flächen | ignoriert | N/A |
| Gebiet ohne Mietzellen | 0 vermietete Wohnungen | Wert `null`, Karte „keine Angabe“ | N/A |
| Kleiner Planungsraum | 29 vermietete Wohnungen | Wert `null`, „keine Angabe“ | N/A |
| Schwelle erreicht | 30 vermietete Wohnungen | Wert gesetzt | N/A |
| Kiez-Aggregat | 2 PLR: 10 €/m² × 90 Whg, 20 €/m² × 10 Whg | Kiez 11,00 (gewichtet, nicht Median) | N/A |
| Dezimalkomma/Encoding | `"6,26"`, cp1252 | 6.26 | Parse-Fehler → Script bricht laut ab |
| Spalte fehlt | Header ohne `AnzahlWohnungen` | — | Script bricht mit Spaltenname ab |
| Projektion | Zelle E4549850 N3270050 (EPSG:3035) | ergibt WGS84 13.3706 / 52.4920 (±0.0005) | N/A |

</frozen-after-approval>

## Code Map

- `scripts/fetch-einwohner.ts` -- Vorlage: CSV laden, LOR-Join, gehashte GeoJSON nach `static/layers/`, `augmentManifest` (~153-186), `purgeOldHashes`. Neues Script `scripts/fetch-zensus-miete.ts` + `fetch:zensus-miete` in `package.json`.
- `scripts/lib/allowlist.ts:1-13` -- Host `www.destatis.de` ergänzen.
- `scripts/lib/types.ts:1-17` -- `Bundle`/`License`-Unions (dl-de/by-2.0 prüfen).
- `scripts/lib/layer-aggregate/member-assignment.ts:133` `collectSpatialPointValues` (RBush-Vorfilter) -- Punkt-in-Fläche für ~35.500 Zellen wiederverwenden.
- `proj4` (Dependency) -- eigene Definition EPSG:3035 (`+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs`); `scripts/lib/reproject.ts` kennt nur 25833.
- `adm-zip`, `csv-parse` -- ZIP im Speicher, CSV-Parsing (Muster `scripts/lib/fetchers/dwd-cdc.ts:52`).
- `scripts/lib/layer-aggregate/strategy.ts:39-81` -- Kiez/Bezirk-Aggregat-Strategie: neue gewichtete Strategie (heute nur `numeric-median`). PLR-Features tragen Wohnungszahl und Summe Miete×Wohnungen auch unter der 30er-Schwelle, damit Kiez/Bezirk alle Zellen einrechnen; nur der angezeigte PLR-Wert ist dann `null`.
- `src/lib/components/atlas/internal/layer-style-builder.ts` -- neues Profil `choropleth-miete` (Union :24, Slug-Map :137, Legende :248/:524, Paint :811).
- `layer-style-cascade.ts:15-59` -- Profil in `POLYGON_PROFILES` und `CHOROPLETH_PROFILES`.
- `choropleth-family.ts:35/:80` -- Familie `strukturell`, Quantil-Klassen.
- `choropleth-dots.ts:55-134` `SPEC_BY_SLUG` -- Symbol-Spec nach Muster `bodenrichtwerte` (€/m²).
- `inspector-panel/internal/layer-explain.ts:299/:597`, `layer-palette-filter.ts:70/:194`, `value-formatters.ts:491`, `source-shortener.ts:6` -- Explain, Anzeigename, Wertformat „x,xx €/m²“, Quellname.
- `src/lib/data/layer-methodology.ts` + `layer-methodology-messages.ts` -- Methodik-Eintrag (Pflicht hier).
- `messages/de.json`, `messages/en.json` -- `layer_explain_<slug>_*`, `atlas_layer_name_<slug>`, Legende.
- Tests, die alle Slugs durchgehen: `layer-explain.test.ts:56-90`, `layer-style-builder.test.ts:497`, `choropleth-dots.test.ts`, `layer-style-cascade.test.ts`, `choropleth-family.test.ts`.
- Begleitarbeit, Vorbild `bodenrichtwerte` an jeder Stelle (`grep -rln bodenrichtwerte src scripts docs`): `compare-panel.svelte`, `utils/layer-compare.ts` (Vergleich); `editorial-disclaimer.svelte`, `editorial-config.ts`, `editorial-types.ts` (Hinweis Bestand vs. Angebot); `inspector-panel.svelte`, `applicability.ts`, `layer-hit-display.ts`, `value-severity-mapping.ts` (neutral), `score-membership.ts` (kein Score), `residential-location.ts` (prüfen); `layer-synonyms.ts` (Suche: Miete, Mietspiegel, Kaltmiete, rent); `layer-palette.svelte`; `webmcp/tools/get-layer-metadata.ts`; `docs/pipelines/data-flow.md`. Nur übernehmen, was für eine Bestandsmiete fachlich passt; Abweichungen in den Implementation Notes begründen.
- `/lizenzen`: Lizenz-Key `dl-de/by-2-0` existiert (`lizenzen-content.ts:47`); Attribution erscheint über `sourceUrl`/Quellname, prüfen dass „Statistische Ämter des Bundes und der Länder, Zensus 2022“ sichtbar ist.
- `/methodik`: Datentabelle liest das Manifest (automatisch), Methodik-Text über `layer-methodology.ts`.
- Automatisch: `/layer/[slug]`, Sitemap, llms, OG.
- Achtung: voller `pnpm data:fetch` überschreibt augmentierte Manifest-Einträge (`fetch-static.ts:213-227`).

## Tasks & Acceptance

**Execution:**
- [x] `scripts/lib/zensus/*.test.ts` + Implementierung -- Parser (cp1252, Dezimalkomma, Pflichtspalten), EPSG:3035→WGS84, gewichtetes Gebietsmittel -- Matrix-Zeilen 1-7.
- [x] `scripts/fetch-zensus-miete.ts` -- Download, Join, GeoJSON (Wert, Wohnungszahl, Kiez-Slug), Manifest-Eintrag -- Datenpfad.
- [x] `scripts/lib/layer-aggregate/strategy.ts` -- gewichtete Kiez/Bezirk-Aggregation.
- [x] Atlas-Dateien aus der Code Map -- Profil, Legende, Familie, Symbol-Spec, Explain, Name, Formatter, Quelle; slug-aufzählende Tests nachziehen.
- [x] `layer-methodology*.ts`, `messages/*.json` -- Methodik und Texte DE/EN.
- [x] Begleitarbeit laut Code Map (Vergleich, Hinweis, Inspector inkl. Kiez/Bezirk, Suche, WebMCP, Pipeline-Doku) -- Layer überall wie `bodenrichtwerte`.
- [x] Script lokal laufen lassen, GeoJSON + Manifest committen.

**Acceptance Criteria:**
- Given der Atlas, when „Bestandsmiete (Zensus 2022)“ aktiv ist, then färbt die Karte die Flächen nach €/m² mit Legende und Quellenangabe.
- Given ein zweiter Wert-Layer ist aktiv, when Bestandsmiete die zweite Rolle hat, then erscheinen Größen-Symbole statt Konturen.
- Given `/layer/<slug>` (DE und EN), when die Seite rendert, then nennt sie Bestandsmiete vs. Angebotsmiete, Stichtag 2022 und Cell-Key-Verrauschung.
- Given der Inspector auf Planungsraum, Kiez oder Bezirk, when der Layer aktiv ist, then zeigt er den gewichteten Wert als „x,xx €/m²“ oder „keine Angabe“, mit Erklärung und Quelle.
- Given `/lizenzen` und `/methodik` (DE und EN), when die Seite rendert, then erscheint der Layer mit Lizenz dl-de/by-2.0 und Zensus-Attribution bzw. in der Datentabelle.
- Given die Layer-Suche, when jemand „Miete“ oder „rent“ eingibt, then findet sie den Layer.
- Given das Vergleichs-Panel mit zwei Gebieten, when der Layer aktiv ist, then vergleicht es die beiden Werte.

## Implementation Notes

- Slug `zensus-bestandsmiete-2022`, Bundle `B: Wohn-Daten`, GeoJSON 542 PLR (`bd52e4d6`), Properties `plr_id`, `miete`, `wohnungen`, `miete_summe`, `kiez_slug`, `bezirk_slug`.
- Datenlauf 14.10.2026: 35.530 Zellen in der BBox, 7.067 außerhalb Berlins; 1.568.217 vermietete Wohnungen; Berlin-Mittel 7,66 €/m² (BBox-Gegenrechnung 7,64, Differenz durch Landesgrenze statt Rechteck). 4 PLR unter 30 Wohnungen ohne Angabe, 0 PLR nur aus KLAMMERN-Zellen; Werte 5,07 bis 13,4 €/m².
- Farbstopps aus den Quintilen der Daten: 5,1 / 6,9 / 7,5 / 7,9 / 8,6 €/m² (`miete-stops.ts`, Test rechnet nach).
- Neue Aggregat-Strategie `weighted-mean` mit `minWeight` in der Strategie (30 für diesen Layer), generisch ohne Zensus-Import.
- Abweichungen: eigener RBush-Index in `assign-cells.ts` statt `collectSpatialPointValues`; eigener CSV-Split statt `csv-parse` (feste Spaltenliste, Pflichtspalten-Prüfung). `applicability.ts` und `residential-location.ts` unverändert (hängen am Nutzungscode der Bodenrichtwerte); `layer-palette.svelte` unverändert (kuratierte Liste); `score-membership.ts` nur Kommentar.
- Browser-Sicht 14.10.: Karte ohne Konsolenfehler, zweite Rolle zeigt Größen-Symbole mit Legende 5,1 bis 8,6+ €/m², Layer-Seite mobil zeigt Bestand vs. Angebot, Stichtag, Cell-Key und 2031. Flächenfarben im Innenstadt-Ausschnitt gleichförmig, ebenso bei `bodenrichtwerte`: Eigenschaft der Farbfamilie.
- Volle Unit-Suite 5.439/5.440 grün; einziger Fehlschlag `winner-map.svelte.test.ts` (bekannt wackelig, einzeln 13/13). `pnpm check` 0 Fehler.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind | Feste Farbstopps passen nicht zur Quantil-Familie, ~80 % in zwei Stufen | medium | patch |
| Blind | KLAMMERN-only-PLR zeigt unsicheren Wert als Einzelwert | medium | patch (betrifft 0 PLR) |
| Blind, Edge | `weighted-mean` hängt an Zensus-Schwelle; fehlende Keys → stilles all-null | medium | patch |
| Blind, VerifGap | Toter Code in `layer-level-card`/`aggregate-layer-for-level` | low | patch (Rücknahme) |
| VerifGap | Inspector-Kontextzeilen Kiez/Bezirk/Berlin ungetestet | medium | patch |
| VerifGap | Vergleichs-Disclaimer ungetestet | low | patch |
| Blind | Delta „1,5“ statt „x,xx“ | low | patch |
| Edge | Purge vor Write | low | patch |
| Blind | Testname „PLR ohne Feature“ unpräzise | low | patch |
| Blind | AC-Tests fehlen (zweite Rolle, Layer-Text DE/EN, Lizenzen EN) | medium | patch |
| Blind | Fester Bereich „5 bis 13“ vs. Daten bis 13,4; Em-Dash im Testnamen | low | patch |
| Blind | Generierte Dateien fehlen im Diff | false: bewusst aus Review-Diff ausgeschlossen, liegen im Tree | reject |
| Blind | Manifest-Rewrite `schemaVersion: 1` | false: identisch zu `fetch-einwohner.ts:186` | reject |
| Blind | Quotes/Tausenderpunkt im Parser | false: CSV ohne Quotes, Zahlen ganzzahlig | reject |
| Blind | Spec-Status nicht nachgezogen | false: Orchestrator setzt Status | reject |
| Blind | Texte dreifach | false: Hauspattern aller Layer | reject |
| Blind | Doppelter Vergleichs-Hinweis, Variantenname | low: gleiches Muster wie `bodenrichtwerte` | reject |

## Verification

**Commands:**
- `pnpm exec vitest run scripts src/lib/components/atlas src/lib/data` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm fetch:zensus-miete` -- expected: GeoJSON in `static/layers/`, gewichtetes Berlin-Mittel ≈ 7,6 €/m² (BBox-Gegenrechnung 14.10.: 7,64 €/m² über 1,71 Mio. Wohnungen)
