---
title: 'Neuer Layer: Altbau-Anteil (Zensus 2022)'
type: 'feature'
created: '2026-10-14'
status: 'done'
baseline_commit: 'cb751b73a08ad7451f45107999ba40db12fe565f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md'
  - '{project-root}/docs/process/implementation-artifacts/spec-zensus-miete-farben.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ob ein Kiez von Altbau oder Nachkriegs- und Neubau geprägt ist, sieht man im Atlas nicht. Diese Frage stellen Wohnungssuchende häufig.

**Approach:** Neuer Planungsraum-Layer „Altbau-Anteil (Zensus 2022)“: Anteil der Wohnungen in Gebäuden mit Baujahr vor 1949 an allen Wohnungen. Gleiche Bauweise wie „Bestandsmiete (Zensus 2022)“ (Pipeline, Aggregation, Farbklassen, Kombinierbarkeit, Begleitarbeit).

**Entscheidungen Matze 14.10.:** Wohnungen zählen, nicht Gebäude (Villengebiete würden sonst überzeichnet). Eine Kennzahl „Anteil Altbau (vor 1949)“ in Prozent, keine Baujahr-Kategorien. Keine Fachbegriffe in der UI; „Altbau“ heißt hier „vor 1949 gebaut“, das sagt die Methodik. Matze bei Freigabe: Lizenzen und Methodik nicht vergessen, also Eintrag mit Zensus-Attribution auf `/lizenzen` und vollständiger Methodik-Eintrag (`layer-methodology.ts`, sichtbar auf `/layer/<slug>` und in der `/methodik`-Tabelle), DE und EN.

## Boundaries & Constraints

**Always:** Quelle `https://www.destatis.de/static/DE/zensus/gitterdaten/Wohnungen_mod_MZ_Baujahresklassen_in_Gitterzellen.zip` (7-Zip-Archiv trotz Endung), CSV `Zensus2022_Wohnungen_nach_modifizierten_Mikrozensusbaujahresklassen_100m-Gitterzellen.csv`, Spalten `GITTER_ID_100m;Insgesamt_Wohnungen;vor_1919;a1919_bis_1948;…`. „–“ = 0. Zellmittelpunkt aus Gitter-ID (`N…E…` = SW-Ecke EPSG:3035, +50 m). Planungsraumwert = Σ(vor_1919 + a1919_bis_1948) / Σ Insgesamt_Wohnungen, unter 30 Wohnungen „keine Angabe“; Kiez/Bezirk/Berlin über `weighted-mean` aus denselben Summen. Farben: fünf harte Klassen auf den Quintilen der Planungsraumwerte, Palette wie Bestandsmiete (Indigo bis `#1A2A5E`, 3:1-Regel), Legende mit Prozent-Bereichen. Lizenz dl-de/by-2.0 mit Zensus-Attribution. Volle Begleitarbeit wie Bestandsmiete, DE und EN. Generierte GeoJSON + Manifest committen.

**Never:** Kein Gebäude-Zähler, keine Baujahr-Kategorienkarte, kein Raster, kein Score-Input. Keine Änderung an Bestandsmiete oder globalen Tokens.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Anteil | Zelle A 80 Whg, davon 60 vor 1919 + 10 1919–1948; Zelle B 20 Whg, 0 vor 1949 | Gebiet 70 % | N/A |
| Strich | `vor_1919` = „–“ | 0 | N/A |
| Gitter-ID | `CRS3035RES100mN3270000E4549800` | Mittelpunkt E4549850 N3270050 | ungültige ID → Script bricht ab |
| Kleiner PLR | 29 Wohnungen | „keine Angabe“, Summen zählen für Kiez/Bezirk | N/A |
| Pflichtspalte fehlt | Header ohne `a1919_bis_1948` | — | Script bricht mit Spaltenname ab |
| Archiv | 7-Zip statt ZIP | wird entpackt | fehlendes `7zz` → klare Fehlermeldung mit Installationshinweis |

</frozen-after-approval>

## Code Map

- `scripts/fetch-zensus-miete.ts`, `scripts/lib/zensus/*` -- Vorlage und wiederverwendbare Teile (Projektion `laea.ts`, Zellzuordnung `assign-cells.ts`, `weighted-mean.ts`, `build-layer.ts`); neues Script `scripts/fetch-zensus-altbau.ts` + `fetch:zensus-altbau`. Parser neu (andere Spalten, Koordinaten aus ID).
- `scripts/lib/fetchers/tippecanoe.ts` -- Muster für System-Binary-Aufruf; 7-Zip analog (`7zz e -so` oder Entpacken in `.cache/`), Existenzprüfung mit Hinweis `brew install sevenzip`.
- `scripts/lib/layer-aggregate/strategy.ts` -- `weighted-mean` mit `minWeight: 30`, Werte-/Gewichts-Keys für Altbau.
- Atlas-Registrierung wie Bestandsmiete (`git grep zensus-bestandsmiete-2022` listet alle Stellen): Profil + `step`-Paint + Legende (Prozent-Labels aus Quintil-Stops, Modul analog `miete-stops.ts`), Cascade, Familie, `choropleth-dots.ts` Symbol-Spec, Explain, Name, Synonyme (Altbau, Baujahr, Gründerzeit, old buildings), Formatter „x %“, Severity neutral, Inspector-Kontext, Vergleich, Editorial, Methodik, WebMCP, Data-Flow-Doc, Lizenzen-Attribution.
- `src/lib/components/atlas/internal/colors.ts` -- Palette wie `scaleMiete1..5` wiederverwenden (gleiche Werte), ohne Bestandsmiete zu ändern.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/lib/zensus/*.test.ts` -- Parser (Gitter-ID → Mittelpunkt, „–“, Pflichtspalten), Anteil, Schwelle, 7-Zip-Fehler -- Red, dann Implementierung.
- [x] `scripts/fetch-zensus-altbau.ts` + Aggregat-Strategie; Script laufen lassen, `pnpm data:layer-aggregate`, GeoJSON + Manifest + Aggregate committen.
- [x] Atlas-Registrierung, Texte DE/EN, slug-aufzählende Tests nachziehen.
- [x] Screenshots allein, mit Bestandsmiete als Symbol, mit Milieuschutz in `screenshots/zensus-altbau-anteil/`.

**Acceptance Criteria:**
- Given der Layer aktiv, when die Karte rendert, then zeigen Planungsräume fünf Farbklassen mit Prozent-Legende; Gründerzeitgebiete (z. B. Prenzlauer Berg) liegen in den oberen Klassen, Großsiedlungen (z. B. Marzahn) in den unteren.
- Given Altbau-Anteil als Fläche und Bestandsmiete als Symbole, when beide aktiv sind, then sind die Symbole auf allen Klassen erkennbar.
- Given Inspector, Vergleich, `/layer/<slug>`, `/lizenzen`, `/methodik` (DE/EN), when sie rendern, then erscheint der Layer mit Wert „x %“, Kiez/Bezirk/Berlin und Methodik „vor 1949 gebaut“.

## Implementation Notes

- Slug `zensus-altbau-anteil-2022`, Script `pnpm fetch:zensus-altbau` (7-Zip über `7zz e -so`, Fehler mit `brew install sevenzip`-Hinweis), GeoJSON 542 PLR, Properties `altbau_anteil`, `wohnungen`, `altbau_summe`.
- Datenlauf 14.10. (nach Review-Patch): 58.390 Zellen in der BBox, 19.021 außerhalb Berlins, 2.016.629 Wohnungen, Berlin-Anteil vor 1949 39,49 %; 1.074 Zellen auf die Zellsumme gekappt (Cell-Key-Rauschen), 0 Zellen verworfen; 2 PLR ohne Angabe.
- Stichprobe: Prenzlauer Berg/Helmholtzplatz 70-92 %, Marzahn/Hellersdorf 0-1 %; Bezirke Pankow 54,5 %, Friedrichshain-Kreuzberg 53,7 %, Marzahn-Hellersdorf 6,4 %.
- Farben `scaleAltbau1..5` = Werte von `scaleMiete1..5` (Test pinnt Gleichheit), Stopps 0/10/26/44/62 % aus Quintilen.
- Browser 14.10.: `/lizenzen` und `/en/lizenzen` mit Zensus-Attribution, `/methodik` (Tabelle aus dem Manifest), `/layer/...` DE/EN mit „vor 1949 gebaut“ und „Wohnungen, nicht Gebäude“; Inspector „60 %“ mit Kiez 58 %, Bezirk 44 %, Berlin 39 %.
- Unit-Suite 5.494/5.495 (einziger Fehlschlag `winner-map`, bekannt wackelig), `pnpm check` 0 Fehler.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap | Inspector-Kontext Kiez/Bezirk/Berlin zeigt „39,56 €/m²“ statt „40 %“ | high | patch |
| Blind | Vergleich nennt Prozent statt Prozentpunkte | medium | patch |
| Blind, Edge | Altbau > Gesamt durch Rauschen (Anteil > 100 %), Zellen mit 0 Wohnungen still verworfen | medium | patch |
| Blind, Edge | 7-Zip ohne Treffer liefert irreführende Fehlermeldung | low | patch |
| Edge | Doppelte Quintile würden `step` ungültig machen | low | patch (Test) |
| Blind | WebMCP-Hinweis, `relatedLayers` einseitig, Score-Kommentar | low | patch |
| Blind, VerifGap | Tests fehlen: Vergleichs-Disclaimer, Symbolrolle, Suche | medium | patch |
| Blind | Doppelte Tokens `scaleAltbau*` statt Wiederverwendung | low | reject: gleiche Werte, Test pinnt Gleichheit, bestehende Tokens unverändert |
| Blind | Umgekehrte Kombination (Altbau als Symbol auf Miete-Fläche) unklar | false | Kontrasttest `miete-scale.test.ts` prüft alle `imageColor` gegen alle Klassen |
| Blind | Feste Zahlen „rund 93 %“, Legendenstil „ab 62 %“/„62+ %“, Grenzwert-Mehrdeutigkeit | low | reject: gleiches Muster wie Bestandsmiete |
| Blind | Archiv wird bei jedem Lauf neu geladen | low | reject: gleiches Muster wie Bestandsmiete |
| Blind | Akkumulator `mieteSumme` zweckentfremdet | low | reject: dokumentiert in `altbau.ts`, funktional korrekt |
| Blind, Edge | Aggregate/GeoJSON fehlen im Diff | false | bewusst aus Review-Diff ausgeschlossen, liegen im Tree |

## Verification

**Commands:**
- `pnpm exec vitest run scripts src/lib/components/atlas src/lib/data src/lib/utils` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm fetch:zensus-altbau` -- expected: Berlin-Anteil plausibel (BBox-Gegenrechnung 14.10.: 37,6 %, innerhalb Berlins etwas abweichend)

**Manual checks** (Dev-Server `http://localhost:5180`):
- Screenshots laut Tasks; Stichprobe Prenzlauer Berg hoch, Marzahn niedrig.
