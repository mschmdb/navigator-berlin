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

Stand 08.11.2026. Bestand von kaelte.navigator.berlin für die Saison 2026/27 geprüft und um 8 Tagesstätten und Wärmestuben ohne OSM-Eintrag erweitert.

## Zahlen

- 227 Orte im GeoJSON geprüft, dazu 49 zurückgestellte Kandidaten (`NACHLAUF`).
- 22 Orte korrigiert, 2 entfernt (`suitable=false`), 8 neu.
- GeoJSON danach: 233 Orte.
- 0 der 49 `NACHLAUF`-Kandidaten rücken nach.

## Vorgehen

- 12 Recherche-Agenten in zwei Runden. Runde 1: 10 Agenten, geschnitten nach Kategorie (Bibliotheken 2x, Museen 2x, Malls und Kaufhäuser, Stadtteilzentren und Kirchen, Nachlauf) und nach Quelle für neue Orte (Wärmestuben und Tagesstätten, Nachtcafés, Wärmeräume von Senat und Bezirken). Runde 2 nach Matzes Entscheidung: 2 Agenten für amtliche Übersichten aller 12 Bezirke und des Senats.
- Entscheidung Matze (08.11.2026, Runde 2): Amtliche Übersichten von Bezirksämtern oder Senat für 2026/27 gelten als Beleg, wenn sie Adresse, Zeiten und Zeitraum eindeutig nennen. Wir übernehmen daraus nur die Fakten einzelner Einträge, nie die ganze Liste.
- Kein Scraping, keine kopierten Listen. Die Kältehilfe-Platzliste, Wärmeraum-Verzeichnisse und die Kältehilfe-Wegweiser der Bezirke dienten höchstens als Hinweis, dass es einen Ort gibt. Jeden Ort haben wir einzeln an der Seite des Betreibers geprüft (Träger, Bezirksamt als Betreiber, Einrichtung selbst). Angaben stehen in eigenen Worten als Fakten mit Quellen-URL. Ein Ort, den nur eine fremde Liste belegt, gilt als unsicher und fehlt.
- Jede Änderung am Bestand und jeden neuen Ort haben wir ein zweites Mal an der Quelle gegengelesen (wörtliche Zitate der Seite, Abruf 08.11.2026).
- Daten über `pnpm data:waerme-orte-research merge` und `validate`, Build mit `pnpm data:waerme-orte --strict`. `merge` übernimmt `oh_recherche` bei geänderter Notiz absichtlich nicht. Die neuen Werte haben wir danach aus denselben Ergebnis-Einträgen gesetzt und mit `validate` geprüft.

## Neuer Weg: Orte ohne OSM-Eintrag

Bisher ließ der Build jeden Enrichment-Eintrag ohne OSM-Kandidaten scheitern. Neu ist `static/data/waerme-orte/places-manual.json` mit ids der Form `manual/<slug>`. Diese Orte umgehen den OSM-Filter, brauchen aber einen Enrichment-Eintrag mit Quelle und eine `coord_source`. Regeln stehen in `docs/waerme-orte-methodik.md`, Tests in `scripts/lib/waerme-orte/manual.test.ts`.

## Neu

| Ort | Adresse | Zeiten | Quelle |
| --- | --- | --- | --- |
| Seeling Treff (GEBEWO pro), Tagesstätte für wohnungslose und mittellose Menschen | Seelingstraße 9, 14059 | Mo, Di, Mi, Fr 9 bis 14 Uhr, Do 9 bis 12 Uhr, ganzjährig | https://gebewo.berlin/seeling-treff |
| AWO Kiezcafé (AWO Spree-Wuhle), Tagesstätte für alle | Petersburger Straße 92, 10247 | Mo bis Fr 11 bis 16 Uhr, ganzjährig | Bezirksamt Friedrichshain-Kreuzberg, Stand September 2026 |
| Tagesstätte Am Wassertor (EJF), für alle | Segitzdamm 46, 10969 | Mo, Mi, Fr 9 bis 14 Uhr, ganzjährig | Bezirksamt Friedrichshain-Kreuzberg |
| Wohnungslosentagesstätte Bürgerhilfe | Cuvrystraße 11-12, 10997 | Mo, Do, Fr 12 bis 16 Uhr, Di 16 bis 20 Uhr, ganzjährig | Bezirksamt Friedrichshain-Kreuzberg |
| Zentrum Gitschiner 15 (Ev. Kirchengemeinde Heilig Kreuz-Passion), für alle | Gitschiner Straße 15, 10969 | Mo bis Mi 10 bis 16 Uhr, Do 12 bis 16 Uhr, Fr 9 bis 15 Uhr, ganzjährig | Bezirksamt Friedrichshain-Kreuzberg |
| Unterschlupf e.V., nur für Frauen, queere Menschen und FLINTA | Wrangelstraße 30, 10997 | Mo bis Fr 9 bis 18 Uhr, ganzjährig | Bezirksamt Friedrichshain-Kreuzberg |
| Tee- und Wärmestube Neukölln | Weisestraße 34, 12049 | Mo, Mi, So 15 bis 19 Uhr, Do 9 bis 14 Uhr, Di 11 bis 17 Uhr nur für Frauen, ganzjährig | Bezirksamt Neukölln, Flyer Stand 11/2026 |
| Wärmestube Sankt Richard | Braunschweiger Straße 18, 12055 | Fr 16 bis 19:30 Uhr, 06.11.2026 bis 26.03.2027, nicht 25.12. und 01.01. | Bezirksamt Neukölln |

Quellen-URLs: Friedrichshain-Kreuzberg https://www.berlin.de/ba-friedrichshain-kreuzberg/politik-und-verwaltung/bezirksamt/regine-sommer-wetter/2026-2027-uebersicht-angebote_kaeltehilfeperiode_friedrichshain-kreuzberg.pdf, Neukölln https://www.berlin.de/ba-neukoelln/aktuelles/bezirksticker/angebote-der-neukoellner-kaeltehilfe-im-winter-2026-2027-1727539.php.

- Koordinaten: Nominatim-Adresssuche je Adresse, jeweils Hausnummer-Treffer, OSM-Objekt in `coord_source`.
- Kategorien mit DE- und EN-Label: „Tagesstätte“ (für alle), „Tagesstätte für Wohnungslose“, „Tagesstätte für Frauen und FLINTA“, „Wärmestube“.
- Tee- und Wärmestube: Der Frauen-Termin am Dienstag steht nur in der Notiz, nicht im Wochenplan. Sonst zeigt die Karte dienstags „offen“ für alle.
- Aufenthalt ohne Konsum und Kosten nennen die Bezirksquellen nicht, die Felder stehen auf `unknown`.

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
- **Caritas-Wärmestube, Tübinger Straße 5:** Der Bezirks-Wegweiser 2026/27 nennt Mo bis Fr 15:30 bis 18 Uhr ab 01.12., die Caritas-Seite (undatiert) 15 bis 18 Uhr ab 01.11. Widerspruch, deshalb unsicher.
- **City-Station (Stadtmission), Joachim-Friedrich-Straße 46:** Wegweiser 2026/27 nennt Di bis Sa, eine Pressemitteilung des Bezirksamts von Juni 2026 und die Trägerseite Mo bis Fr. Widerspruch.
- **Wärmestube Zossener Straße 65:** Bezirksübersicht nennt Mi 12 bis 15 Uhr, aber keinen Zeitraum.
- **TagesTreff Weitlingstraße 11 (Lichtenberg):** keine amtliche Quelle 2026/27, Träger- und Drittquellen widersprechen sich bei den Zeiten.
- **Nachtcafé Luisen (Gierkeplatz 2a) und Nachtcafé Neu-Westend (Eichenallee 47):** im Bezirks-Wegweiser Charlottenburg-Wilmersdorf 2026/27 belegt, aber bewusst nicht aufgenommen: Nachtcafés und Notübernachtungen haben begrenzte Plätze. Die Kältehilfe-App zeigt freie Plätze, eine Karte mit Öffnungszeiten kann das nicht. Das gilt für alle Notübernachtungen in den Bezirksübersichten.
- **Nachtcafé Tabor, Nachthafen am Kotti:** Endzeit fehlt in der Bezirksquelle; Nachthafen nur bis Ende Dezember 2026 und für eine eng begrenzte Zielgruppe.
- **Nachtcafé Zum Guten Hirten, Kältestube St. Klara:** nur Verzeichnisse oder Saison 2025/26.
- **Bezirke ohne amtliche Übersicht 2026/27:** Mitte, Pankow, Lichtenberg, Marzahn-Hellersdorf, Treptow-Köpenick, Tempelhof-Schöneberg, Steglitz-Zehlendorf, Spandau, Reinickendorf (Stand 08.11.2026). Treptow-Köpenick nannte 2025/26 elf Kiezklubs als Orte der Wärme, für 2026/27 fehlt eine Meldung. Nachfassen, sobald die Bezirke veröffentlichen.
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

## Runde 2: Bahnhofsmissionen, Suppenküchen, offene Kirchen, Wärmeräume

Stand 08.11.2026. 8 Recherche-Agenten in vier Suchfeldern, Kirchen, Suppenküchen und Bezirke zusätzlich nach Bezirken geteilt. Jeden aufgenommenen Ort haben wir danach selbst an der Quelle gelesen. Die Regeln aus Runde 1 gelten weiter.

- GeoJSON danach: 252 Orte (vorher 233).
- 19 Orte neu, 1 Ort aus dem Bestand freigeschaltet (Sophienkirche), 1 Ort entfernt (Nikodemus-Kirche).
- Neue Kategorien mit DE- und EN-Label: „Bahnhofsmission“ (Station mission), „Suppenküche“ (Soup kitchen).
- Die 19 neuen Orte haben keinen OSM-Kandidaten, weil OSM für sie keine Öffnungszeiten führt. Sie stehen deshalb in `places-manual.json`, mit Lage des OSM-Objekts oder Nominatim-Treffer in `coord_source`.
- Kirchen: Feste Zeiten auf der Seite der Gemeinde oder des Kirchenkreises gelten als „regelmäßig“, auch ohne Jahresangabe. Gottesdienstzeiten zählen nicht.
- Aufenthalt ohne Konsum und Eintritt frei nennt keine Quelle ausdrücklich. Die Felder stehen überall auf `unknown`.

### Neu je Suchfeld

| Suchfeld | Neu |
| --- | --- |
| Bahnhofsmissionen | 1 |
| Suppenküchen, Mittagstische, Tagesstätten | 4 |
| Kirchen mit offenen Türen | 15 (davon Sophienkirche aus dem Bestand) |
| Wärmeräume der Bezirke und des Senats | 0 |

| Ort | Adresse | Zeiten | Quelle |
| --- | --- | --- | --- |
| Bahnhofsmission am Hauptbahnhof | Europaplatz 1, 10557 | Aufenthalt Mo bis Fr 8:30 bis 12 und 13 bis 16:30 Uhr | berliner-stadtmission.de |
| Suppenküche Franziskanerkloster Pankow | Wollankstraße 18, 13187 | Di bis So 9 bis 11:30 und 12:45 bis 14:30 Uhr | suppe.franziskaner.de |
| Suppenküche Am Lietzensee | Herbartstraße 4-6, 14057 | Mo bis Mi 12 bis 13:30 Uhr (Oktober bis April) | cw-evangelisch.de, Wegweiser Bezirksamt Charlottenburg-Wilmersdorf 2026/27 |
| Wohnungslosentagesstätte Schöneberg (Unionhilfswerk) | Gustav-Freytag-Straße 1, 10827 | Di bis So 11:30 bis 17 Uhr | unionhilfswerk.de |
| Café Treffpunkt der Heilsarmee | Kuglerstraße 11, 10439 | Mi 8:30 bis 14, Do, Fr 14 bis 18, Sa 8:30 bis 12:30 Uhr | heilsarmee.de/prenzlauerberg |
| Sophienkirche | Große Hamburger Straße 29/30, 10115 | täglich 14 bis 18 Uhr | gemeinde-am-weinberg.de |
| Kapelle der Versöhnung | Bernauer Straße 4, 10115 | Di bis So 10 bis 16 Uhr | kapelle-versoehnung.de |
| Martin-Luther-Kirche | Fuldastraße 50, 12045 | Mo bis Fr 8 bis 19 Uhr | neukoelln-evangelisch.de |
| Genezarethkirche | Herrfurthplatz 14, 12049 | Mo bis Fr 10 bis 15 Uhr | neukoelln-evangelisch.de |
| Hephatha-Kirche | Fritz-Reuter-Allee 135, 12359 | Mi 15:30 bis 18 Uhr | neukoelln-evangelisch.de |
| Dorfkirche Rudow | Köpenicker Straße 185, 12355 | Mi, Sa 10 bis 12 Uhr | neukoelln-evangelisch.de |
| Kirche Neu-Buckow | Marienfelder Chaussee 66, 12349 | Mi 14 bis 16:30 Uhr | neukoelln-evangelisch.de |
| Wichernkirche | Wichernstraße, Ecke Schlehenweg, 13587 | täglich 8 bis 17 Uhr im Winter | spandau-evangelisch.de |
| Dorfkirche Kladow | Alt-Kladow, 14089 | täglich 8 bis 18 Uhr | spandau-evangelisch.de |
| Dorfkirche Gatow | Alt-Gatow 32, 14089 | Sa, So 11 bis 16 Uhr | spandau-evangelisch.de |
| Stiftskirche im Johannesstift | Schönwalder Allee 26, 13587 | So 13:30 bis 15:30 Uhr (November bis März) | spandau-evangelisch.de |
| St.-Nikolai-Kirche | Reformationsplatz 1, 13597 | Mo bis Sa 12 bis 14 Uhr | spandau-evangelisch.de |
| Matthäuskirche | Schloßstraße 44a, 12165 | Mi bis So 14 bis 17 Uhr (November bis März) | matthaeus-steglitz.de |
| Apostel-Paulus-Kirche | Grunewaldstraße 77a, 10823 | in der Regel täglich 12 bis 18 Uhr | ev-apg.de |
| Johanneskirche Frohnau | Zeltinger Platz, 13465 | täglich 10 bis 15 Uhr in der dunklen Jahreszeit | ekg-frohnau.de |

### Entfernt

| id | Ort | Grund |
| --- | --- | --- |
| way/279765936 | Nikodemus-Kirche | Zeiten nur aus cylex.de. Gemeinde und Kirchenkreis führen sie nicht als offene Kirche. |

### Verworfen

- **Bahnhofsmission Zoo:** Die Quellen widersprechen sich bei den Zeiten, ob man sich aufhalten darf, steht nirgends.
- **Bahnhofsmission Ostbahnhof:** bahnhofsmission.de meldet derzeit „Aufenthalt nicht möglich“, IN VIA nennt Mo bis So 8 bis 17 Uhr.
- **Weitere Bahnhofsmissionen** (Lichtenberg, Südkreuz, Gesundbrunnen): keine gefunden.
- **Suppenküche St. Marien, Bergheimer Straße 1:** Bezirksamt nennt Ende 13:30 Uhr, Betreiber 13 Uhr.
- **Aktion Warmes Essen, Pauluskirche Zehlendorf:** Wegweiser 2025/26 verlangt einen einmaligen Nachweis der Bedürftigkeit.
- **Suppenküche Maria Hilfe der Christen (Spandau), Mittagstisch Adventgemeinde Zehlendorf, Suppenküche Lichtenrade, Suppenküche Herz-Jesu (Zionskirche):** ohne Datum, ohne Adresse, nur Quellen aus Vorjahren oder Aufenthalt unklar.
- **Treffpunkt Strohhalm (Treptow-Köpenick):** eigene Seite und Stiftung SPI nennen verschiedene Zeiten.
- **Mittagstisch Lindenkirche Wilmersdorf:** Bezirk schreibt „in diesem Winter“ ohne Jahr.
- **Offener Mittagstisch Wittenau, „Essen ist fertig“ (St. Christophorus), Kältestube St. Klara, Warmer Otto, Tagestreff Mitte (GEBEWO):** Einzelveranstaltung, Ausgabe im Freien, nur bei Frost (Januar 2026), geschlossen oder Quelle bis 2023.
- **Kirchen ohne feste Zeiten an der Gemeindequelle:** Parochialkirche (nur berlin.de), Alt-Pankow, Pfingstkirche, Immanuelkirche, St. Hedwig, Alt-Buckow, Magdalenenkirche (nur mit Schlüssel), Kirchen in Treptow-Köpenick, Lichtenberg und Marzahn-Hellersdorf (nur Sommerzeiten oder Verzeichnisse).
- **Kirchen mit Widerspruch oder Unklarheit:** Philipp-Melanchthon-Kirche (Kirchenkreis und Küsterei widersprechen sich), Patmos-Kirche (Mittwoch fehlt beim Kirchenkreis), Bethlehemskirche Rixdorf (Pause angedeutet), Petruskirche Lichterfelde (Kirche liegt laut OSM am Oberhofer Platz, die Quelle nennt nur Ostpreußendamm 64), Kirche im Waldkrankenhaus (Adresse nicht an der Quelle).
- **Christophoruskirche Spandau, Dorfkirche Alt-Staaken:** nur im Advent oder im Sommer offen.
- **Zionskirche:** Die Gemeinde öffnet „so oft wie möglich“, `oh_recherche` bleibt `unklar`.
- **KIEZKLUBs Treptow-Köpenick, Wintertreff Allende-Center, Ort der Wärme im Humboldt Forum:** „Orte der Wärme“ nur für 2025/26 belegt, Angebot an Senioren gerichtet, nur zweimal im Monat oder Start 2026/27 ohne Zeiten.
- **Caritas-Wärmestube Tübinger Straße, City-Station:** Widerspruch aus Runde 1 besteht weiter.

### Bezirke ohne Veröffentlichung 2026/27

Stand 08.11.2026. Bezirk hat noch nichts veröffentlicht:

- Mitte
- Pankow
- Lichtenberg
- Marzahn-Hellersdorf
- Treptow-Köpenick
- Spandau
- Tempelhof-Schöneberg
- Steglitz-Zehlendorf
- Reinickendorf

Der Senat nennt keine Orte und verweist auf den Kältehilfe-Wegweiser und die App. Übersichten 2026/27 haben Charlottenburg-Wilmersdorf, Friedrichshain-Kreuzberg und Neukölln. Sie enthalten keine Tagesorte, die nicht schon in Runde 1 standen. Ausnahme ist die Suppenküche Am Lietzensee.
