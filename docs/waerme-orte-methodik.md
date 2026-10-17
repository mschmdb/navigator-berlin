---
type: methodology
audience: both
last-verified: 2026-10-16
status: entwurf
related:
  - docs/kuehle-orte-methodik.md
  - docs/adr/ADR-020-kuehle-orte-local-source.md
---

# Wärme-Orte-Methodik

Der Datensatz `waerme-orte` listet öffentliche, beheizte Orte in Berlin, an denen man sich im Winter ohne Konsumzwang aufhalten kann (Epic #57, Datengrundlage #61). Er folgt dem Muster der Kühlen Orte. Layer, Karte und Liste folgen in #62.

## Datenherkunft und Lizenz-Trennung

- **Geometrie und Basis-Tags: OpenStreetMap.** Standort, Name, Adresse, PLZ, `opening_hours` (Fallback für den Status), Barrierefreiheit und Website stammen aus `static/data/waerme-orte/places-osm.json`. Lizenz ODbL 1.0, Namensnennung `https://www.openstreetmap.org/copyright`.
- **Redaktionelle Anreicherung: navigator.berlin.** Winter-Öffnung, Aufenthalt ohne Konsum, Eintritt, Begründung, Quelle und Prüfdatum stammen aus eigener Recherche auf den Betreiber-Websites (`static/data/waerme-orte/enrichment.json`). Dieser Anteil ist ein eigener Datensatz und fällt nicht unter die ODbL-Angabe.
- Join-Key beider Dateien ist `id` (`node/…`, `way/…`, `relation/…`).
- Wir übernehmen keine Daten von netzwerkderwaerme.de oder kaeltehilfe-berlin.de. #62 verlinkt sie nur.

## OSM-Stand und Abrufweg

- Quelle: Geofabrik-Berlin-Extrakt `https://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf`, geladen am 2026-10-16 (rund 100 MB, nicht im Repo).
- OSM-Stand laut PBF-Header: 2026-10-15T20:21:00Z (steht auch in `meta.osm_timestamp` des Snapshots).
- Grund: Overpass ist aus dem Netz des Maintainers nicht erreichbar.
- Neu erzeugen aus dem Repo-Root:

```sh
uv run -q --no-project --with osmium python -I scripts/osm/extract-waerme-orte.py \
  /tmp/osm-berlin/berlin-latest.osm.pbf static/data/waerme-orte/places-osm.json
```

- Der Lauf ist deterministisch: Der Stand kommt aus dem PBF-Header, die Orte sind nach `id` sortiert.
- Ways und Relations (Areas) erhalten den Flächenschwerpunkt des größten Außenrings als Koordinate. Objekte ohne berechenbaren Mittelpunkt entfallen und stehen in `meta.stats.ohne_mittelpunkt` (Stand: 1).
- Grenzfilter: Der Geofabrik-Extrakt enthält einen Puffer über die Landesgrenze (Potsdam, Brandenburg). Das Skript behält nur Punkte innerhalb der Berliner Landesgrenze (OSM-Relation 62422, `admin_level=4`, Point-in-Polygon über die Ringe des Extrakts). Es bricht ab, wenn die Relation fehlt oder ein behaltener Punkt außerhalb der Box 13.08–13.77 / 52.33–52.68 liegt. Die Zahl der Ausgeschlossenen steht in `meta.stats.ausserhalb_berlin` (Stand: 47). Eine Selbstprüfung der Point-in-Polygon-Logik läuft bei jedem Aufruf.
- Snapshot: 2154 OSM-Objekte in Berlin (davon 988 Nodes, 1176 Ways, 37 Relations vor dem Grenzfilter).

## Filter

Das Python-Skript sammelt grob nach Kategorie-Tags. Die Regeln stehen allein in `scripts/lib/waerme-orte/filter.ts` (getestet) und greifen im Build.

Kategorien:

- **Bibliothek:** `amenity=library`
- **Mall:** `shop=mall`
- **Kaufhaus:** `shop=department_store`
- **Museum:** `tourism=museum`, ohne `fee=yes`. Museen ohne fee-Tag bleiben Kandidaten, die Recherche klärt den Eintritt. Mit Eintritt gilt `suitable=false`.
- **Stadtteilzentrum:** `amenity=community_centre` mit Untertyp `community_hall`, `social_centre`, `village_hall`, `cultural_centre`, `family_centre` oder ohne Untertyp, jeweils mit `opening_hours`.
- **Kirche / Gotteshaus:** `amenity=place_of_worship` mit `opening_hours` (`Kirche` bei `religion=christian`, sonst `Gotteshaus`).

Ausschlüsse (Reihenfolge der Prüfung):

- `social_facility=shelter` (Notübernachtung): `shelter`
- `access=private|members|customers|no`: `access_restricted`
- anderes `social_facility`, oder Stadtteilzentrum mit anderem Untertyp (etwa `youth_centre`): `group_specific`
- Museum mit `fee=yes`: `museum_fee`
- Stadtteilzentrum oder Gotteshaus ohne `opening_hours`: `no_opening_hours`

Der Build zählt jeden Ausschluss je Grund im Log. Ausgefilterte Orte bleiben im Snapshot, der Build lässt sie weg.

## Enrichment-Felder

Je Ort ein Eintrag in `enrichment.json`:

- `id`, `name`, `cat`
- `suitable`, `suitable_reason`: Eignung und Begründung
- `winter_open`: `yes` | `limited` | `no` | `unknown`
- `opening_hours_note`: freier Text zur Winter-Öffnung
- `oh_recherche`: aus der Notiz abgeleiteter Wochenplan in OSM-`opening_hours`-Syntax, oder `"unklar"`. Fehlt bei Orten ohne Notiz.
- `stay_without_purchase`: `yes` | `no` | `unknown`
- `is_free`: `free` | `ticket` | `unknown`
- `website`, `source_url`: Betreiber-Seite und belegende Quelle (http oder https)
- `checked_at`: Prüfdatum `YYYY-MM-DD`
- `still_exists`: `yes` | `no` | `unknown`
- `notes`: interne Recherche-Notizen, bleiben in `enrichment.json` und gehen nicht ins GeoJSON

Regeln:

- Status „jetzt offen“ und Filter nutzen `oh_recherche`, sonst die OSM-`oh`. Die Karte nennt die Quelle („laut Recherche“ bzw. „laut OSM“).
- `oh_recherche` entsteht nur bei eindeutigem Wochenplan. Einzelne Schließtage mit Datum (Feiertagsbrücken, Fortbildung) stehen als `off`-Regeln drin, wenn die Notiz sie nennt. Nur wenn die Notiz ein bestimmtes Jahr meint (Brückentage, „bis Jahresende 2026“), steht das Jahr in der Regel (`2026 Oct 03-04 off`). Wiederkehrende Tage wie `Dec 24-26 off` bleiben ohne Jahr. Gilt eine Notiz nur für Okt bis Mär oder „Winterzeit“, ergänzt `Apr-Sep unknown` die Regel, damit die Karte im Sommer keinen Status behauptet. Der Build ergänzt `; PH off`, wenn die Recherche-Zeiten keine Feiertagsregel haben und OSM `PH off` nennt. `oh_recherche` ohne `opening_hours_note` lässt die Validierung scheitern. Beim Zusammenführen von Ergebnis-Batches bleibt der alte Wert nur, wenn die Notiz gleich bleibt. Nicht eindeutige Notizen (mehrere Bereiche, widersprüchliche Quellen, „nach Gottesdienst“, „saisonal“, „nach Aushang“) bekommen `"unklar"`. Dann zeigt die Karte keinen Status und der Filter blendet den Ort aus.
- Jede Angabe braucht `source_url` und `checked_at`. Was keine Quelle belegt, steht auf `unknown`, nie geraten.
- Die Kühle-Orte-Recherche derselben OSM-ID dient als Ausgangspunkt. Winter-Felder prüft die Recherche trotzdem neu.
- Wir behaupten „beheizt“ nur mit Beleg.

## Build und Recherche-Lauf

- Validierung vor dem Merge: `validateEnrichment` prüft Enums, Strings, Kalenderdatum, URLs und `oh_recherche` (muss `"unklar"` sein oder mit dem Paket `opening_hours` parsen). `suitable=true` verlangt `source_url`, schließt `winter_open=no`, `is_free=ticket` und Platzhalter-Namen („(ohne Namen in OSM)“) aus. Doppelte ids und Fehler lassen den Build ohne Schreiben mit Exit 1 scheitern.
- Dubletten: Nach dem Filter bleibt bei gleichem normalisiertem Namen und unter 75 m Abstand ein Eintrag (bevorzugt belegte `winter_open`, dann kleinste id). Der Build-Log zählt sie.

- `pnpm data:waerme-orte` merged Snapshot und Enrichment zu `static/data/waerme-orte.geojson`, nach `id` sortiert und deterministisch. `--strict` lässt den Build bei Kandidaten ohne Enrichment scheitern.
- Der Build filtert `suitable=false` und `still_exists=no`, zählt alle Wegfälle und hängt Navi-Links an.
- Enrichment-Einträge ohne OSM-Kandidaten (Waisen) lassen den Build scheitern.
- Recherche-Hilfsskript `pnpm data:waerme-orte-research`:
  - `batches [--size 25] [--out DIR]` schreibt Aufgaben-Batches für offene Kandidaten (Standard `/tmp/waerme-orte-batches`).
  - `merge <result.json…>` validiert Ergebnis-Batches und führt sie in `enrichment.json` zusammen. Ungültige Einträge übernimmt es nicht.
  - `validate` prüft die vorhandene `enrichment.json`.

## Recherche-Stand 16.10.2026

- 677 Kandidaten recherchiert, 230 als geeignet eingestuft: 80 Bibliotheken, 58 Museen, 50 Malls, 21 Stadtteilzentren, 13 Kirchen, 6 Kaufhäuser, 2 weitere Gotteshäuser. Nach dem Dubletten-Filter (3 Einträge) stehen 227 Orte im GeoJSON.
- Winter-Öffnung bei 215 der 230 geeigneten Orte belegt (178 regulär, 37 eingeschränkt), bei 15 `unknown`.
- Aufenthalt ohne Konsum ist bei 98 geeigneten Orten belegt. Für öffentliche Bibliotheken gilt der Beleg je Träger: Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Marzahn-Hellersdorf, Lichtenberg und die ZLB schreiben ausdrücklich, dass man ihre Häuser ohne Bibliotheksausweis nutzen kann (Stand 16.10.2026, Quelle je Ort in `notes`). Für die übrigen Bezirke fehlt eine solche Aussage, das Feld bleibt dort `unknown`. Für die Universitätsbibliothek der HU gilt § 4 Abs. 4 ihrer Benutzungsordnung: Lesesäle und Freihandbestände sind ohne Anmeldung nutzbar.
- Ablauf: erster Durchgang je 25 Orte, danach ein langsamer Nachlauf für 166 Orte, deren Abruf scheiterte (Rate-Limit, Bot-Schutz, Zertifikatsfehler) oder die ohne Quelle als geeignet galten.
- Browser-Lauf für Bot-Schutz: Seiten mit Anubis-Challenge oder HTTP 403 haben wir in einem echten Chromium (Playwright) geöffnet. Damit sind 9 HU-Bibliotheken, Taut Passage, Galeria Alexanderplatz und BENN Alt-Hohenschönhausen belegt. widerstandsmuseum.de blockt auch den Browser.
- 49 Orte blieben auch im Nachlauf ohne Beleg (Website tot, Bot-Schutz, keine Center-Zeiten). Sie stehen als `suitable=false` mit `NACHLAUF:` in `notes` und können bei der nächsten Prüfung nachrücken.
- Angaben ohne Quell-URL (etwa aus der Kühle-Orte-Recherche übernommen) sind auf `unknown` zurückgesetzt; ungeprüfte Zeitangaben stehen nur in `notes`.
- Drittverzeichnisse (z. B. Kauperts) dienen nur als letzte Quelle und sind in `notes` gekennzeichnet.

## Grenzen

- Der Datensatz ist ein Angebot auf offenen Daten, kein Behörden-Ersatz und ohne Anspruch auf Vollständigkeit.
- Öffnungszeiten können veralten (Recherche wie OSM). Das Prüfdatum zeigt den Stand der Recherche.
- Kein Rechtsanspruch auf Aufenthalt: Betreiber üben Hausrecht aus.
- Notübernachtungen und Wärmestuben sind nicht Teil dieses Datensatzes.
