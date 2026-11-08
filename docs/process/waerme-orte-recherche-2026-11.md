---
type: research-report
audience: maintainers
last-verified: 2026-11-08
related:
  - docs/waerme-orte-methodik.md
  - static/data/waerme-orte/enrichment.json
  - static/data/waerme-orte/places-manual.json
---

# Wärme-Orte: Prüfung und Erweiterung, November 2026

Stand 08.11.2026. Bestand von kaelte.navigator.berlin für die Saison 2026/27 geprüft und um einen Ort ohne OSM-Eintrag erweitert.

## Zahlen

- 227 Orte im GeoJSON geprüft, dazu 49 zurückgestellte Kandidaten (`NACHLAUF`).
- 22 Orte korrigiert, 2 entfernt (`suitable=false`), 1 neu.
- GeoJSON danach: 226 Orte.
- 0 der 49 `NACHLAUF`-Kandidaten rücken nach.

## Vorgehen

- 10 Recherche-Agenten, geschnitten nach Kategorie (Bibliotheken 2x, Museen 2x, Malls und Kaufhäuser, Stadtteilzentren und Kirchen, Nachlauf) und nach Quelle für neue Orte (Wärmestuben und Tagesstätten, Nachtcafés, Wärmeräume von Senat und Bezirken).
- Kein Scraping, keine kopierten Listen. Die Kältehilfe-Platzliste, Wärmeraum-Verzeichnisse und die Kältehilfe-Wegweiser der Bezirke dienten höchstens als Hinweis, dass es einen Ort gibt. Jeden Ort haben wir einzeln an der Seite des Betreibers geprüft (Träger, Bezirksamt als Betreiber, Einrichtung selbst). Angaben stehen in eigenen Worten als Fakten mit Quellen-URL. Ein Ort, den nur eine fremde Liste belegt, gilt als unsicher und fehlt.
- Jede Änderung am Bestand und jeden neuen Ort haben wir ein zweites Mal an der Quelle gegengelesen (wörtliche Zitate der Seite, Abruf 08.11.2026).
- Daten über `pnpm data:waerme-orte-research merge` und `validate`, Build mit `pnpm data:waerme-orte --strict`. `merge` übernimmt `oh_recherche` bei geänderter Notiz absichtlich nicht. Die neuen Werte haben wir danach aus denselben Ergebnis-Einträgen gesetzt und mit `validate` geprüft.

## Neuer Weg: Orte ohne OSM-Eintrag

Bisher ließ der Build jeden Enrichment-Eintrag ohne OSM-Kandidaten scheitern. Neu ist `static/data/waerme-orte/places-manual.json` mit ids der Form `manual/<slug>`. Diese Orte umgehen den OSM-Filter, brauchen aber einen Enrichment-Eintrag mit Quelle und eine `coord_source`. Regeln stehen in `docs/waerme-orte-methodik.md`, Tests in `scripts/lib/waerme-orte/manual.test.ts`.

## Neu

| Ort | Adresse | Zeiten | Quelle |
| --- | --- | --- | --- |
| Seeling Treff (GEBEWO pro), Tagesstätte für wohnungslose und mittellose Menschen | Seelingstraße 9, 14059 | Mo, Di, Mi, Fr 9 bis 14 Uhr, Do 9 bis 12 Uhr, ganzjährig | https://gebewo.berlin/seeling-treff |

Koordinate: Nominatim-Adresssuche, Hausnummer-Treffer OSM node/3020434644.

## Korrigiert

Alle Quellen am 08.11.2026 abgerufen.

| id | Ort | Änderung | Quelle |
| --- | --- | --- | --- |
| node/60848456 | Anton-Saefkow-Bibliothek | Zeiten jetzt fest: Mo, Di 9 bis 19, Mi 13 bis 19, Do, Fr 9 bis 18, Sa, So 9 bis 19 | berlin.de/stadtbibliothek-lichtenberg |
| way/24035294 | Bezirkszentralbibliothek Pablo Neruda | Zeiten jetzt fest: täglich 10 bis 19 | berlin.de/stadtbibliothek-friedrichshain-kreuzberg |
| node/560823423 | Stadtteilbibliothek Friedrich von Raumer | Zeiten ergänzt, `winter_open` yes | berlin.de/stadtbibliothek-friedrichshain-kreuzberg |
| node/444994924 | Heinrich-Schulz-Bibliothek | Zeiten jetzt fest: Mo bis Sa 10 bis 19, So 12 bis 18; Aufzug defekt | berlin.de/ba-charlottenburg-wilmersdorf |
| node/444731308 | Bibliothek Lichtenrade | Mo bis Fr 11 bis 18, Quelle jetzt Bezirksseite statt Verzeichnis | berlin.de/stadtbibliothek-tempelhof-schoeneberg |
| node/1684737379 | Bibliothek der Freien | Zeiten ergänzt: Do, Fr 18 bis 20 | bibliothekderfreien.de |
| node/281375131 | Wolfdietrich-Schnurre-Bibliothek | Fr 10 bis 19 statt 10 bis 17; Schließtage Weihnachten | berlin.de/stadtbibliothek-pankow |
| node/1867566597 | Forum Willy Brandt | Zeiten ergänzt: täglich 11 bis 17 | willy-brandt.de |
| node/1653339015 | Museum Blindenwerkstatt Otto Weidt | Zeiten ergänzt, Schließtage Weihnachten | museum-blindenwerkstatt.de |
| node/355500002 | Notaufnahmelager Marienfelde | Wiedereröffnung 2029 statt 2028, zu am 17.11.2026, zu ab 21.12.2026 | stiftung-berliner-mauer.de |
| way/31583865 | Bezirksmuseum Marzahn-Hellersdorf | Di bis Fr 10 bis 18, So 10 bis 17 statt Mo bis Fr; Eintritt `unknown` | kultur-marzahn-hellersdorf.de |
| way/43767919 | Schloss Biesdorf | Schließtage 23., 24., 30., 31.12.2026, 1.1.2027 nur 12 bis 18 | schlossbiesdorf.de |
| way/26285059 | Allende-Center | Zeiten ergänzt: Mo bis Fr 10 bis 20, Sa 10 bis 16 | allende-center.de |
| way/494737961 | Mall of Berlin | Zeiten ergänzt: Mo bis Sa 10 bis 20 | mallofberlin.de |
| way/30452383 | Wilma | Quelle jetzt Betreiberseite; Sonntag 13 bis 18 nur in der Notiz | wilma-shoppen.de |
| way/15218371 | Neue Kaiser-Wilhelm-Gedächtniskirche | Kirche täglich 10 bis 18, Gedenkhalle seit 29.08.2026 zu | gedaechtniskirche-berlin.de |
| node/945925159 | Sri Ganesha Hindu Tempel | täglich 9 bis 12 und 16 bis 19 statt 16 bis 18 | hindutempleberlin.de |
| way/37533771 | Heilandskirche | Mi 14 bis 17 statt 12 bis 18 | ev-gemeinde-tiergarten.de |
| way/30147803 | St. Johannis | Fr 12 bis 15 statt 15 bis 18 | ev-gemeinde-tiergarten.de |
| way/131234574 | Familienzentrum Weißensee | Quelle jetzt Betreiberseite, Zeiten `unklar` | familienzentrum-weissensee.de |
| way/52022998 | RuDi Nachbarschaftshaus | Co-Working zusätzlich Fr 10 bis 13 | rudi-nachbarschaftshaus.de |
| node/2874686039 | Nachbarschaftszentrum Steinmetzstraße | Notiz: Sprachcafé Do 13:45 bis 15:45 | pfh-berlin.de |

## Entfernt

| id | Ort | Grund | Quelle |
| --- | --- | --- | --- |
| node/507083358 | Heimatmuseum Zehlendorf | ab 16.11.2026 wegen Sanierung zu, Wiedereröffnung voraussichtlich Herbst 2027 | heimatmuseum-zehlendorf.de |
| way/25945412 | Quartier 206 | kein Betreiberbeleg, Website ohne DNS, Zeiten nur aus Verzeichnissen; Fachpresse kündigte 2016 die Schließung zum 28.02.2017 an. `still_exists` bleibt `unknown`, weil keine amtliche Quelle die Schließung belegt | textilwirtschaft.de (22.11.2016) |

## Verworfen

Neue Orte, die wir nicht aufgenommen haben:

- **Ort der Wärme (Johanniter, Humboldt Forum, Portal 3):** Die Johanniter-Seite nennt November bis April, Mi bis So 14 bis 18 Uhr, aber kein Jahr und kein Startdatum. Die letzte Pressemitteilung (26.11.2025) gilt für 2025/26. Bester Kandidat, sobald der Start 2026/27 belegt ist.
- **Caritas-Wärmestube, Tübinger Straße 5:** Caritas-Seite undatiert, Beginn und Zeiten widersprechen dem Bezirks-Wegweiser 2026/27.
- **City-Station (Stadtmission), Joachim-Friedrich-Straße 46:** Wochentage auf Trägerseite und im Wegweiser widersprechen sich.
- **AWO Kiezcafé, Tagesstätte Am Wassertor, Bürgerhilfe Cuvrystraße, Zentrum Gitschiner 15, Unterschlupf e.V.:** nur über die Kältehilfe-Übersicht des Bezirksamts Friedrichshain-Kreuzberg belegt, keine Trägerseite geprüft. Nach der Regel "nur fremde Liste" unsicher.
- **Wärmestube Zossener Straße 65:** nur Bezirksliste, kein Zeitraum.
- **Nachtcafé Luisen (Gierkeplatz 2a) und Nachtcafé Neu-Westend (Eichenallee 47):** nur im Bezirks-Wegweiser Charlottenburg-Wilmersdorf belegt. Dazu: Nachtcafés sind Notübernachtungen mit begrenzten Plätzen. Die Kältehilfe-App zeigt freie Plätze, eine Karte mit Öffnungszeiten kann das nicht.
- **Nachtcafé Tabor, Nachthafen am Kotti:** Endzeit fehlt in der Bezirksquelle; Nachthafen nur bis Ende Dezember 2026 und für eine eng begrenzte Zielgruppe.
- **Nachtcafé Zum Guten Hirten, Kältestube St. Klara, Tee- und Wärmestube Neukölln:** nur Verzeichnisse oder Saison 2025/26.
- **Bibliotheken als Wärmeort:** Keine Bibliothek weist sich für 2026/27 ausdrücklich als Wärmeort aus.

Bestand mit Zweifeln, unverändert gelassen:

- Bibliotheken Marzahn-Hellersdorf (Kaulsdorf-Nord, Mahlsdorf, Ehm Welk, Erich Weinert): Bezirksseite zeigt zwei unbeschriftete Zeitblöcke.
- Artothek, Haus O (FU), Zweigbibliothek Naturwissenschaften (HU, Bot-Schutz).
- Museen: Die Pankower Machthaber (Zertifikatsfehler), Hauptmannausstellung und Theodor-Fontane-Apotheke (Eintritt nicht belegt), Museum des Kapitalismus, Archenhold-Sternwarte, Industriesalon Schöneweide, Kleine Orangerie, Haus der Wannseekonferenz (HTTP 401).
- Galeria Alexanderplatz, Hermannplatz, Kudamm, Steglitz: Seiten blocken (403), Standorte auf der Prüfliste des Konzerns, keine Schließung belegt.
- Gropius Passagen, Taut Passage, Nordmeile, LIO, Plaza Marzahn, Bahnhof Lichtenberg: Betreiberseite nicht erreichbar oder ohne Zeiten.
- Raum der Stille, HOPE Seniorenzentrum, Kiezoase (mögliche Dublette mit falscher OSM-Lage), Haus am Akaziengrund, Nikodemus-Kirche.
- Heinrich-Schulz-Bibliothek: Bezirk nennt Otto-Suhr-Allee 98, OSM 96. Adresse kommt aus OSM, Korrektur gehört nach OSM.
- Stadtteilbibliothek Adlershof: ab 9.11. rund 4 Wochen zu, Neueröffnung 8.12. in neuen Räumen ohne genannte Adresse.

Einmalige Schließtage (12.11. Charlottenburg-Wilmersdorf und Mitte, 27.11. Marzahn-Hellersdorf, 18. bis 23.11. Erich Weinert) stehen nicht im Datensatz. Sie wären nach wenigen Tagen veraltet.
