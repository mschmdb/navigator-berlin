# Layer-Kandidaten: Deep-Dive-Recherche

Datum: 2026-07-18
Autorin: Mary (Business Analyst, BMAD)
Status: Entscheidungsgrundlage. Nächster Schritt: Priorisierung und Epic-Schnitt durch Owner.
Methode: 4 parallele Recherche-Agenten. Alle Endpoints, Downloads und Feldstrukturen wurden live per curl/HEAD verifiziert (Stand 18.07.2026). Zahlen ohne Quellenangabe stammen aus eigenen Zählungen gegen die Rohdaten.

> Wiederhergestellt am 14.10.2026 aus dem Original in `_user-input/` (gitignored, dort verloren gegangen). Inhalt unverändert.

## 1. Ausgangslage

navigator.berlin führt 66 Layer in 10 Bundles (A Boundaries bis J Kultur), registriert über static/layers/MANIFEST.json. Ein neuer Layer kostet: Fetch-Script, Manifest-Regenerierung, LAYER_EXPLAIN_DE-Eintrag, Methodik-Spec, ggf. Pin-Icon. Die Pipeline-Muster existieren für alle Kandidaten-Typen:

- WFS zu GeoJSON (Geoportal-Layer wie gruenanlagen)
- Overpass zu GeoJSON (Trinkbrunnen, Kultur, Nahversorgung)
- PMTiles für große Flächenlayer (klima-pet-2022)
- Kiez-Aggregation ins Score-Schema (build-kiez-scores.ts)

Inhaltliche Lücken im Bestand: echte Mietdaten (Bodenrichtwerte sind nur ein Proxy), Parken, Wasser-/Überflutungsrisiko, Verkehrssicherheit, Ferienwohnungsdruck.

## 2. Übersicht und Bewertung

| #   | Kandidat                                               | Nutzerwert         | Aufwand                           | Lizenz         | Status Quelle                     |
| --- | ------------------------------------------------------ | ------------------ | --------------------------------- | -------------- | --------------------------------- |
| 1   | Zensus 2022 Gitter (Miete, Leerstand, Heizung, Baujahr) | sehr hoch          | mittel                            | dl-de/by-2.0   | verifiziert, stabil               |
| 2   | Badestellen + Wasserqualität (live)                    | hoch (saisonal)    | klein                             | CC-BY (LAGeSo) | verifiziert, täglich aktuell      |
| 3   | Parkzonen                                              | hoch               | trivial                           | dl-de/zero-2.0 | verifiziert                       |
| 4   | Öffentliche Toiletten                                  | mittel             | trivial                           | dl-de/zero-2.0 | verifiziert                       |
| 5   | Unfallatlas (Rad/Fuß)                                  | hoch               | gering-mittel                     | dl-de/by-2.0   | verifiziert, Berlin ab 2018       |
| 6   | Hochwasser + Starkregen                                | mittel-hoch        | mittel-hoch                       | gemischt       | verifiziert, mit Einschränkungen  |
| 7   | Inside Airbnb (Kiez-Aggregat)                          | mittel-hoch        | gering                            | CC BY 4.0      | verifiziert, Snapshot 26.06.2026  |
| 8   | Straßenbäume (962k)                                    | mittel             | mittel-hoch                       | dl-de/zero-2.0 | verifiziert                       |
| 9   | E-Ladesäulen (BNetzA)                                  | mittel             | mittel                            | CC BY 4.0      | verifiziert, API tot, CSV ok      |
| 10  | Solarpotenzial                                         | Nische             | hoch (voll) / niedrig (Aggregat)  | dl-de/zero-2.0 | verifiziert                       |
| 11  | OSM-Quick-Wins (5 Layer)                               | mittel             | minimal                           | ODbL           | verifiziert, live gezählt         |
| 12  | Wochenmärkte                                           | wäre hoch gewesen  | blockiert                         | entfällt       | Quelle tot seit 01/2025           |

## 3. Steckbriefe

### 3.1 Zensus 2022 Gitterzellendaten (100m-Raster)

Der inhaltlich stärkste Kandidat. Ein Datensatz-Fundus liefert 4 bis 6 neue Layer für Bundle B (Wohn-Daten) und I (Demografie).

Quelle: Destatis, ZIPs unter `https://www.destatis.de/static/DE/zensus/gitterdaten/<Datei>.zip`. Jedes ZIP enthält CSVs für 10km-, 1km- und 100m-Gitter plus Datensatzbeschreibung (XLSX). zensus2022.de leitet auf destatis.de um, alte URLs sind tot.

Relevanteste Dateien (alle per HEAD/Download verifiziert):

- `Zensus2022_Durchschn_Nettokaltmiete.zip` (9,4 MB): Bestandsmiete EUR/m²
- `Durchschnittliche_Nettokaltmiete_nach_Gebaeudealter_und_Wohnungsgroe%C3%9Fe.zip` (nur 100m)
- `Leerstandsquote_in_Gitterzellen.zip` + `Marktaktive_Leerstandsquote_in_Gitterzellen.zip`
- `Eigentuemerquote_in_Gitterzellen.zip`
- `Zensus2022_Heizungsart.zip` (Fernheizung, Zentral-, Etagen-, Öfen, keine)
- `Zensus2022_Energietraeger.zip` (Gas, Öl, Fernwärme, Wärmepumpe/Solar/Geo, ...)
- `Gebaeude_nach_Baujahr_Jahrzehnte.zip`
- Haushaltsgrößen, Altersgruppen, Durchschnittsalter, Ausländeranteil u.v.m.

Format: CSV, Semikolon, Dezimalkomma, CRLF, Windows-1252 (nicht UTF-8). Grid-ID INSPIRE-konform `CRS3035RES100mN<northing>E<easting>` (SW-Ecke), CRS EPSG:3035. Zellmittelpunkt in `x_mp_100m`/`y_mp_100m`. Zellgeometrie generiert die Pipeline selbst (Quadrat aus Ecke + 100m), kein Geometrie-Download nötig.

Berlin-Zuschnitt: BBox in EPSG:3035: E 4529800-4577300, N 3252000-3291800. Integer-Filter auf Mittelpunkt, dann Point-in-Polygon gegen die Landesgrenze. Gemessen: ~61.000 bewohnte Zellen in der BBox, davon ~35.500 mit Mietwert; innerhalb der Landesgrenze grob 50.000-55.000 Zellen.

Lizenz (wörtlich aus Datensatzbeschreibung): Datenlizenz Deutschland, Namensnennung, Version 2.0 (dl-de/by-2.0). Attribution: „Datenquelle: Statistische Ämter des Bundes und der Länder, Zensus 2022". Nicht CC BY.

Methodik-Pflichten (für die Methodik-Seite):

- Cell-Key-Methode: Alle Werte sind zum Schutz kleiner Zellen deterministisch verrauscht. Summen addieren sich nicht exakt. Original-Null und verrauschte Null sind nicht unterscheidbar.
- KLAMMERN-Flag: Bei erwartetem relativem Fehler über 15% steht KLAMMERN in `werterlaeuternde_Zeichen` (bundesweit 5,8% der Mietzellen). Diese Zellen dämpfen oder nur ins Kiez-Aggregat mitteln, nie einzeln ausspielen.
- Bestandsmieten, keine Angebotsmieten: Stichtag 15.05.2022, Selbstauskunft der Eigentümer. BBSR-Vergleich: in Großstädten über 500k liegt der Bestand bei 8,65 EUR/m², Angebote bei 13,43 EUR/m² (2022). In Altbau-Kiezen mit langen Mietverhältnissen unterschätzt der Wert das Marktniveau drastisch. Labeling zwingend: „Bestandsmiete Zensus 2022", nie „Mietpreis".
- Kein Update bis Registerzensus 2031. Statischer Snapshot.

Layer-Schnitt-Vorschlag: 100m-Raster als PMTiles (Muster klima-pet-2022) für Miete, Leerstand, Baujahr; zusätzlich Kiez-Aggregate (LOR-Join über Zellmittelpunkte) für den Vergleich im Score-Kontext. Heizungsart/Energieträger als Fernwärme-/Wärmepumpen-Anteil pro Kiez, anschlussfähig ans Wärmeplanungs-Thema.

Aufwand: mittel. Neues Muster (Raster-CSV zu Grid-GeoJSON zu PMTiles), danach sind weitere Zensus-Themen fast gratis.

### 3.2 Badestellen + Badegewässerqualität (LAGeSo)

Der Quick-Win mit dem besten Timing: Hochsommer, hitze.navigator.berlin existiert, und die Quelle liefert tagesaktuelle Qualität.

Quelle A (Live-Daten): `https://data.lageso.de/baden/0_letzte/letzte.csv`. 27 KB, 39 Badestellen, Semikolon-CSV, deutsche Dezimalkommas. Täglich früh aktualisiert (Last-Modified heute 06:05 Uhr). CORS offen (`Access-Control-Allow-Origin: *`), Client-Fetch direkt aus dem Browser möglich, kein Proxy nötig.

Felder: Name, Bezirk, Lat/Lon, Probedatum, Sichttiefe, E. coli, Enterokokken, Ampel (Farbe), Algen/Blaualgen-Hinweise, Wassertemperatur, EU-Klassifikation („ausgezeichnet" etc.), Prognosewerte (5 Unterhavel-Stellen haben ein tägliches Frühwarnsystem).

Quelle B (Geometrie + EU-Einstufung): WFS `https://gdi.berlin.de/services/wfs/badegewaesser`, typeName `badegewaesser:aa_badestellen`, 39 Features. Achtung: kein gemeinsamer Key mit der CSV, Match über Namen.

Lizenz: CC-BY, Attribution LAGeSo (CSV) bzw. CC-BY 4.0 mit festem Quellenvermerk inkl. Berliner Wasserbetriebe (WFS).

Gotchas: Beprobung alle 1-2 Wochen pro Stelle, Saison 15.05. bis 15.09., außerhalb eingefroren. Links in der CSV in Pseudo-Syntax. Temperatur ist Beiprodukt der Beprobung, nicht Echtzeit.

Layer-Schnitt: Punktlayer mit Ampel-Badge. Statik (Position, Name) build-time, Qualität client-seitig live von der 27-KB-CSV. Perfektes Sommer-Triple mit Kühlen Orten und Trinkbrunnen auf der Hitze-Subdomain.

Aufwand: klein. Trinkbrunnen-Muster plus ein Client-Fetch.

### 3.3 Parkzonen (Parkraumbewirtschaftung)

Quelle: WFS `https://gdi.berlin.de/services/wfs/parkraumbewirtschaftung`, typeName `parkraumbewirtschaftung:parkzonen`. 102 MultiPolygone, unter 1 MB GeoJSON.

Felder: parkzone, bezirk, zeiten (Freitext, z.B. „Mo-Sa 9-22 Uhr"), gebuehr (String „4,00 Euro", parsen nötig), bemerkung.

Lizenz: dl-de/zero-2.0. Owner SenMVKU, letzte Aktualisierung 07.07.2026.

Gotchas: Gebühren und Zeiten können lokal abweichen (steht in bemerkung), Freitextfelder unstrukturiert. Disclaimer im Inspector reicht.

Layer-Schnitt: Bundle F (Mobilität), Flächenlayer mit Inspector-Angaben Gebühr/Zeiten. Beantwortet die Anwohnerparken-Frage beim Umzug.

Aufwand: trivial. Standard-WFS-Pipeline.

### 3.4 Öffentliche Toiletten

Quelle: WFS `https://gdi.berlin.de/services/wfs/toiletten`, typeName `toiletten:toiletten`. 509 Punkte.

Felder: Standort, Bezirk, Betreiber (Wall u.a.), Modelltyp, Öffnungszeiten (mehrzeiliger Freitext), nutzungsentgelt (numerisch), Zahlungsart, barrierefrei + barrierearm (ja/nein-Strings), Wickeltisch.

Lizenz: dl-de/zero-2.0. Letzte Aktualisierung 17.07.2025.

Layer-Schnitt: Bundle E oder C. Barrierefrei-Flag passt zum A11y-Anspruch des Projekts, auch für den Hitze-Mode relevant (Trinken + Toilette + Schatten). ja/nein-Strings beim Import zu Boolean normalisieren.

Aufwand: trivial. Idealer Quick-Win.

### 3.5 Unfallatlas (Verkehrsunfälle mit Personenschaden)

Berlin-Abdeckung: ja, ab Unfalljahr 2018 (dreifach verifiziert). Neuestes Jahr 2025.

Quelle: `https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/`, Muster `Unfallorte<JAHR>_EPSG25832_CSV.zip` (2025: 12,6 MB). IT.NRW hostet für alle Statistikämter; die alte statistikportal-URL liefert 404.

Felder: Jahr/Monat/Stunde/Wochentag (Achtung: 1 = Sonntag), UKATEGORIE (1 Getötete, 2 Schwerverletzte, 3 Leichtverletzte), UART, UTYP1, Lichtverhältnisse, Straßenzustand, Beteiligungs-Flags IstRad/IstPKW/IstFuss/IstKrad/IstGkfz, XGCSWGS84/YGCSWGS84 = Lon/Lat fertig in WGS84.

Berlin-Fallzahlen (selbst gezählt): 2018: 13.652 · 2021: 11.309 · 2023: 12.329 · 2025: 13.280 (davon 32 mit Getöteten, 1.628 mit Schwerverletzten).

Lizenz: dl-de/by-2.0. Attribution „© Statistische Ämter des Bundes und der Länder, Deutschland, ".

Gotchas:

- Nur Unfälle mit Personenschaden, nicht verortbare Fälle fehlen.
- Header und Dateinamen wechseln hart zwischen Jahren (IstSonstig vs IstSonstige, LICHT vs ULICHTVERH, txt vs csv). Parser strikt auf Header-Namen bauen, Glob auf `*LinRef*`/`*LR_*`.
- Koordinaten sind echt (kein Privacy-Offset), nur an Straßengeometrie gesnappt (max. 25m).

Layer-Schnitt: Mehrjahres-Pool 2021-2025 (~60k Punkte Berlin). Zwei Ausspielungen: Punktlayer mit Severity-Farbe und Rad/Fuß-Filter ab Zoom ~14, plus Kiez-Choropleth (Unfälle pro 1000 EW, Rad-Anteil, KSI-Rate). Kandidat für einen späteren Score-Input Mobilität/Sicherheit, wie beim Kriminalitäts-Layer sauber als Kontext-Dimension starten.

Aufwand: gering bis mittel. CSV sauber, WGS84 fertig, Hauptarbeit ist das Header-Mapping über Jahre.

### 3.6 Hochwasser + Starkregen

Drei Services mit sehr unterschiedlicher Eignung. Zwei kritische Recherche-Befunde vorab:

- Die Wassertiefe der Starkregenkarten gibt es nicht als WFS, nur als WMS-Rasterlayer. Der WFS liefert nur Fließgeschwindigkeits-/Fließrichtungs-Punkte (Millionen, unbrauchbar als GeoJSON).
- Die Starkregengefahrenkarte (SRGK) deckt nur 8 Modellgebiete ab, nicht die ganze Stadt.

Machbar für v1:

- Hochwassergefahrenkarten `ua_hochwassergefahrenkarten`: `a_hwgk_hoch` (30.883), `b_hwgk_mittel` (48.657), `c_hwgk_niedrig` (89.666) MultiPolygone, Feld wassertiefe als Klasse. Lizenz dl-de/zero-2.0. ~170k Polygone gesamt, PMTiles empfohlen.
- Starkregenhinweiskarte, Senken `ua_srhk` typeName `l_srhk_senken`: 114.677 MultiPolygone, stadtweit, Felder filldepth (cm), fillarea, fillvolume. Bester Vektor-Kandidat fürs Starkregen-Thema. Lizenz dl-de/by-2.0, Pflicht-Quellenvermerk BKG + Geoportal Berlin. Bonus: `g_srhk_feuerwehreinsaetze` (dokumentierte Überflutungs-Einsätze als Rasterzellen).

Lizenz-Merker: SRGK ist CC-BY-4.0 mit gebietsabhängigem Quellenvermerk inkl. Berliner Wasserbetriebe. SRHK ist dl-de/by-2.0. HWGK ist dl-de/zero-2.0.

Layer-Schnitt: Bundle C. HWGK-Wassertiefe (3 Szenarien) + Senken-Layer als „Überflutungsgefährdung bei Starkregen". Beantwortet die Erdgeschoss-/Kellerfrage und ist das Klima-Gegenstück zur Hitze-Story.

Aufwand: mittel bis hoch (PMTiles-Builds, zwei Quellen, Methodik-Seite braucht die Szenario-Erklärung).

### 3.7 Inside Airbnb (Ferienwohnungsdruck)

Quelle: `https://data.insideairbnb.com/germany/be/berlin/<YYYY-MM-DD>/visualisations/listings.csv` (3,5 MB reicht). Neuester Snapshot 2026-06-26. Kadenz unregelmäßig (nicht sauber quartalsweise), Snapshot-Datum per HEAD-Probe oder get-the-data-Seite auflösen, nie hardcoden. Nur die letzten 12 Monate frei verfügbar; für Zeitreihen selbst archivieren.

Bestand (gezählt, Snapshot 26.06.2026): 12.855 Listings, davon 68,8% Entire home/apt. Top-Bezirke: Mitte 2.865, Friedrichshain-Kreuzberg 2.658, Pankow 1.950.

Lizenz: CC BY 4.0. Attribution „Daten: Inside Airbnb (insideairbnb.com)" + Snapshot-Datum.

Gotchas:

- Location-Obfuskation 0-150m pro Listing. Punkte nie adressgenau darstellen; Kiez-Aggregation ist robust genug (PLR sind groß).
- license-Feld: nur 33% valide Registriernummern (Format 03/Z/RA/...), Rest Müll oder leer. Regex-Validierung statt „Feld gefüllt".
- availability_365 = 0 heißt ausgebucht ODER geblockt.
- Scraping-Daten, keine amtliche Quelle. Redaktionell wie beim Kriminalitäts-Layer behandeln: Kontext-Layer mit eigener Methodik-Seite, kein Score-Input.

Layer-Schnitt: Kiez-Choropleth „Airbnb-Listings pro 1000 Einwohner", Sub-Metriken Entire-home-Anteil, Multi-Listing-Host-Anteil, Anteil valider Registriernummern. Erzählt zusammen mit Milieuschutz und MSS die Verdrängungs-Geschichte.

Aufwand: gering. Ein CSV, fertige Koordinaten, LOR-Join existiert.

### 3.8 Straßenbäume (Baumkataster)

Quelle: WFS `https://gdi.berlin.de/services/wfs/baumbestand`: strassenbaeume (434.765) + anlagenbaeume (527.780) = 962.545 Punkte.

Felder: deutsche/botanische Art und Gattung, Pflanzjahr (String!), Standalter, Kronendurchmesser, Stammumfang, Baumhöhe, Straße, Bezirk. Lizenz dl-de/zero-2.0, ca. jährliches Update (zuletzt 09.04.2026).

Gotchas: Anlagenbäume haben massenhaft Null-Attribute. Als GeoJSON 350-500 MB, ausgeschlossen für static files. Download paginiert.

Layer-Schnitt: zweistufig. (a) Kiez-Aggregat: Baumdichte pro km², dominante Gattung, Median-Pflanzjahr, als Choropleth billig und sofort Score-anschlussfähig (Grün & Hitze). (b) Optional später PMTiles-Punktlayer mit Einzelbäumen ab Zoom 14 (Attribut-Diät: Gattung, Pflanzjahr, Höhe) als Liebhaber-Feature.

Aufwand: Aggregat mittel, Punktlayer mittel bis hoch (nur Volumen, fachlich simpel).

### 3.9 E-Ladesäulen (BNetzA-Register)

Quelle: CSV `https://data.bundesnetzagentur.de/Bundesnetzagentur/DE/Fachthemen/ElektrizitaetundGas/E-Mobilitaet/Ladesaeulenregister_BNetzA_<DATUM>.csv`, 53 MB, Stand 07.07.2026. Dateiname wechselt pro Update (alle 4-7 Wochen), die Pipeline muss den Link von der Ladesäulenkarte-Startseite scrapen.

Berlin (gezählt): 4.785 Ladeeinrichtungen, 7.343 Ladepunkte. Koordinaten enthalten, kein Geocoding.

Format-Gotchas: 10 Prosa-Vorspannzeilen + BOM vor dem Header, Semikolon, Dezimalkommas. Felder u.a. Betreiber, Normal-/Schnellladen, Anzahl Ladepunkte, kW, Steckertypen pro Ladepunkt.

Sackgassen (geprüft, nicht nutzen): Die bund.dev/ArcGIS-API verlangt inzwischen einen Token (HTTP 499). Der Berliner eladeinfrastruktur-WFS enthält nur Planungs-Layer, keine Säulen.

Lizenz: CC BY 4.0, Namensnennung „Bundesnetzagentur.de". Hinweis: Register ist unvollständig (nur gemeldete Betreiber).

Layer-Schnitt: Bundle F, Punktlayer mit Clustering oder Normal/Schnell-Unterscheidung. Monatlicher Rebuild reicht.

Aufwand: mittel (Link-Scraping, 53-MB-Handling, Vorspann-Parsing).

### 3.10 Solarpotenzial

Quelle: WFS `ua_solarpotenzial_solarrechner`: `c_gebaeude` (529.946 Gebäudeumringe, Felder: geeignete Fläche, Standardmodule, kWp-Potenzial, Verschattungsanteile, Denkmal-Flag) und `d_photovoltaik_potenzial` (1,48 Mio. Dachteilflächen mit Eignung, Ausrichtung, Neigung). Lizenz dl-de/zero-2.0. Einstrahlung existiert nur als Raster (ATOM-Download).

Realistische v1: Kiez-Aggregat (Summe kWp-Potenzial, Anteil geeigneter Dächer) als Choropleth, niedriger Aufwand. Gebäudescharf nur als PMTiles-Großprojekt. Ergänzend billig: `ua_solaranlagen_pv` (installierte Leistung pro Bezirk/PLZ aus dem Marktstammdatenregister) für die Ist-Seite („Potenzial vs. gebaut").

Aufwand: Aggregat niedrig, gebäudescharf hoch. Nischen-Publikum (Eigentümer), aber als „Energiewende im Kiez"-Story mit Zensus-Heizungsart kombinierbar.

### 3.11 OSM-Quick-Wins (Overpass, live gezählt Juli 2026)

Alle fünf passen 1:1 ins Trinkbrunnen-Muster. Lizenz ODbL, Attribution wie bei den bestehenden OSM-Layern.

| Layer                  | Filter                                 | Count Berlin | Einschätzung                                                                                  |
| ---------------------- | -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| Tischtennisplatten     | `leisure=pitch` + `sport=table_tennis` | 2.479        | sehr gut gepflegt, sofort machbar                                                             |
| Fitness-/Calisthenics  | `leisure=fitness_station`              | 426          | gut; Anlagen clustern (~50m), sonst zählt ein Platz fünffach                                  |
| Bücherschränke         | `amenity=public_bookcase`              | 122          | charmant; `amenity=give_box` als Ergänzung prüfen                                             |
| Hundeauslauf           | `leisure=dog_park`                     | 73           | unvollständig; amtliche Auslaufgebiete (Berliner Forsten) als Gegencheck                      |
| Sitzbänke              | `amenity=bench`                        | 32.380       | nur aggregiert sinnvoll (Bänke-Dichte, Mapper-Bias-Disclaimer); Hitze-Mode-relevant (Rastplätze) |

Pipeline-Hinweis: overpass-api.de war während der Tests mehrfach überlastet. Mirror-Fallback (kumi.systems, private.coffee) in die Scripts einbauen. Ways mit `out center` auf Centroids reduzieren.

Aufwand: minimal pro Layer, je unter einem Tag.

### 3.12 Wochenmärkte: blockiert

Die Open-Data-Quelle ist tot. Der SimpleSearch-Endpoint liefert 404, der CKAN-Datensatz ist aus dem Datenregister entfernt (verifiziert am 18.07.2026), letzter Wayback-Stand 16.01.2025 mit 76 Einträgen ohne Koordinaten. Optionen, alle unschön:

- OSM `amenity=marketplace` (ODbL, unvollständig, keine Markttage)
- Eigene kuratierte Liste (~40-60 Märkte, laufende Pflege)
- Warten, bis Berlin neu publiziert

Empfehlung: zurückstellen, im Backlog notieren, Quelle quartalsweise prüfen.

## 4. Empfohlene Reihenfolge (Vorschlag für den Epic-Schnitt)

Sortierlogik: Nutzerwert pro Aufwandseinheit, saisonales Timing, thematische Bündelung.

**Epic-Vorschlag 1: Sommer-Paket (jetzt, klein)**
Badestellen mit Live-Qualität + öffentliche Toiletten + Sitzbank-Dichte für den Hitze-Mode. Drei kleine Layer, sofortiger saisonaler Nutzen, stärkt hitze.navigator.berlin im Hochsommer.

**Epic-Vorschlag 2: Alltags-Quick-Wins (klein)**
Parkzonen + OSM-Paket (Tischtennis, Fitness, Bücherschränke, Hundeauslauf). Fünf Layer, zusammen wenige Tage, breite sichtbare Produkt-Erweiterung.

**Epic-Vorschlag 3: Zensus-Wohndaten (mittel, höchster inhaltlicher Wert)**
Bestandsmiete, Leerstand, Gebäudealter, Heizungsart/Energieträger als 100m-PMTiles + Kiez-Aggregate. Schließt die Miet-Lücke. Braucht eine saubere Methodik-Seite (CKM, Bestandsmieten-Caveat).

**Epic-Vorschlag 4: Risiko + Sicherheit (mittel)**
Unfallatlas (Punkt + Kiez-Choropleth) und Hochwasser/Starkregen-Senken. Beide brauchen Methodik-Sorgfalt, beide liefern Entscheidungsrelevanz beim Wohnungswechsel.

**Epic-Vorschlag 5: Kür (später)**
Airbnb-Kiez-Aggregat, Baumkataster (erst Aggregat, später Punktlayer), Ladesäulen, Solar-Aggregat.

Nicht einplanen: Wochenmärkte (Quelle tot), SRGK-Wassertiefe als Vektor (existiert nicht), bund.dev-Ladesäulen-API (Token-Pflicht), kommerzielle Datenkäufe (Zensus deckt die Miet-Lücke kostenlos).

## 5. Offene Entscheidungen für den Owner

1. Reihenfolge der Epic-Vorschläge 1-5 bestätigen oder umsortieren.
2. Zensus-Miete: nur Kiez-Aggregat oder auch 100m-Raster als PMTiles? (Raster ist eindrucksvoller, Aggregat reicht für den Score-Kontext.)
3. Airbnb: ja/nein als Kontext-Layer? (Redaktionell heikelster Kandidat, methodisch aber sauber machbar wie Kriminalität.)
4. Unfallatlas: nur Kontext-Layer oder perspektivisch Score-Input für Mobilität?
5. Sitzbänke: trotz Mapper-Bias aufnehmen? (Nur mit Disclaimer und als Dichte, nicht als Punktkarte.)

## 6. Nachtrag 22.08.2026 (Neubewertung nach Multi-Layer-Regelwerk)

Autor: Claude (Session Multi-Layer-Kartenfarben). Anlass: Das am 22.08. gemergte Karten-Regelwerk verschiebt die Bewertung einzelner Kandidaten. Quellen-Stichprobe am selben Tag.

### Was sich seit 18.07. geändert hat

- Quellen-Stichprobe (22.08.): Badestellen-CSV zuletzt 21.08. abends aktualisiert, Parkzonen- und Toiletten-WFS antworten. Die Verifikation vom 18.07. trägt für die Top-Kandidaten weiter. Airbnb-Snapshot inzwischen vermutlich neuer als 26.06., vor Umsetzung neu auflösen.
- Badestellen-Saisonfenster fast durch: Beprobung endet 15.09. Ein Launch jetzt träfe die letzten Wochen; besser zur Saisoneröffnung Frühjahr 2027 mit voller Wirkung.
- Karten-Regelwerk (gemergt 22.08., PR #17/#18): Höchstens zwei Wertkarten gleichzeitig, erste als Fläche, zweite als Größen-Symbole (ein Quadrat pro Planungsraum), Rollen-Tausch in der Legende, Overlays (Milieuschutz, Kaltluft) außerhalb des Limits, geteilte Links transportieren Layer + Rollen.

### Konsequenz für die Bewertung

Kiez-Aggregat-Choroplethen sind wertvoller als im Juli. Jeder neue Choropleth ist ab sofort mit jedem bestehenden kombinierbar (Fläche + Symbole) und mit den Overlays stapelbar. Ein Layer ist damit nicht mehr nur eine Karte, sondern ein Baustein für Karten-Geschichten. Punkt-Layer bleiben in ihrer Juli-Bewertung.

Konkret profitieren:

- Zensus-Bestandsmiete (3.1): Kombinationen wie „Bestandsmiete-Fläche + Wohnlagen-Symbole" oder „Miete + Milieuschutz-Overlay" sind genau die Verdrängungs-/Wohnungsmarkt-Erzählungen, für die das Regelwerk gebaut wurde.
- Unfallatlas-Kiez-Choropleth (3.5): kombinierbar mit Mobilitäts-Score und Radnetz.
- Airbnb-Kiez-Aggregat (3.7): kombinierbar mit Milieuschutz + Wohnschutz-Score, die Verdrängungs-Story aus der Juli-Recherche wird auf einer einzigen Karte erzählbar.
- Baumdichte-Aggregat (3.8): kombinierbar mit Grün-&-Hitze-Score und PET.

PMTiles-Sonderregel beachten: PMTiles-Choroplethen (heute nur PET) sind technisch immer die Fläche, nie der Symbol-Layer (client-seitig keine Label-Punkte). Für Zensus gilt: Das 100m-Raster als PMTiles wäre von dieser Regel betroffen, das Kiez-Aggregat nicht. Spricht dafür, BEIDE Fassungen zu bauen (Raster für die Detail-Ansicht, Aggregat für Kombinationen), Marys offene Frage 2 damit beantwortet: beides.

### Aktualisierte Reihenfolge (ersetzt Abschnitt 4)

1. Vor dem Meetup-Talk (02.09.): keine neuen Layer. Deck-Bau und Proben haben Vorrang, neue Layer sind neues Bug-Risiko vor der Bühne.
2. Zensus-Wohndaten (war Epic 3): inhaltlich größter Wert, größter Kombinations-Gewinn, schließt die Miet-Lücke.
3. Alltags-Quick-Wins (war Epic 2 + Teile von 1): Parkzonen, Toiletten, OSM-Paket. Badestellen bewusst auf Frühjahr 2027 verschieben.
4. Unfallatlas (aus Epic 4 vorgezogen): Kontext-Choropleth mit Kombinations-Wert.
5. Kür wie gehabt (Airbnb, Bäume, Hochwasser/Senken, Solar, Ladesäulen).
6. Wochenmärkte: bleibt zurückgestellt, Quelle weiterhin quartalsweise prüfen.
