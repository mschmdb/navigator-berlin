# Review: i18n C4d · Updates (DE → EN-GB)

Quelle DE: `_content/updates/2026-*.md` (13 Einträge, Body ohne Frontmatter, Titel und Summary aus `title_de`/`summary_de`), `src/routes/(with-header)/updates/+page.svelte`, `src/routes/(with-header)/updates/[slug]/+page.svelte`, `src/lib/components/updates/updates-entry-card.svelte`, `updates-filter.svelte` und `category-label.ts`. Maschinenlesbar: `c4d-uebersetzung.json`. Bodys: `c4d-updates-en/`.

## Übersetzungsentscheidungen

- Interne Links mit `/en`-Präfix (`/en/methodik/kiez-score`, `/en/hitze`, `/en/berlin-wahlen`, `/en/layer/kuehle-orte`, `/en/architektur`, `/en/datenschutz`, `/en/umwelt-infrastruktur-score`). Feed-Dateien (`/updates/rss.xml`, `atom.xml`, `feed.json`) und `/webmcp-manifest.json` bleiben. Repo-Pfade (`_content/updates/`, `docs/runbooks/...`, `scripts/...`) bleiben.
- Pfade in Inline-Code, die eine Site-Seite meinen (`/updates`, `/updates/{slug}`, `/updates?cat=...`, `/wahl`), stehen als `/en/...`. Bei `/wahl` zeigt der Link auf `/en/berlin-wahlen`, wie im DE (`/wahl` ist dort nur Anzeigetext).
- Dimensionen wie `finder_dim_label_*` und `layer_explain_kiez_score_gesamt_long`: Quiet & air, Green & heat, Mobility, Local amenities, Tenant protection, Culture. Im Kiez-finder-Eintrag gelten die Slider-Labels („Green space & heat protection“, „Cultural offer“, „Development & density“, „Similar voting behaviour“).
- „Kiez finder“ klein, wie `finder_panel_title` und die Vorgabe. `shell_finder_link_title` und `home_finder_*` schreiben „Kiez Finder“.
- Umwelt- & Infrastruktur-Score → „environment & infrastructure score“ (wie `shell_meta_link_score`, `score_rank_link_*`).
- Kühle Orte → „cool places“, Hitze-Navigator → „Heat Navigator“, Kühle-Score → „cool score“ (wie C4c). „Kühle Kirche“ und „Café der Stille“ stehen im Original mit englischer Übersetzung in eckigen Klammern.
- Kategorien in `2026-05-16-launch`: Data update, Feature, Methodology, Data source, Licence (wie `update_category_*`).
- Behörden wie C4b/C4c: Federal Election Commissioner (Bundeswahlleiterin), Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg), Berlin crime atlas (Kriminalitätsatlas Berlin), Berlin Environmental Atlas, Open Data Information Office, German Weather Service (DWD), House of Representatives, District Assembly (BVV), polling district.
- Bleiben deutsch: Kiez, Bezirk, Bezirksregion, Stolpersteine, Milieuschutz, S-Bahn, U-Bahn, Späti (im DE-Body „Spätkauf“), Kieztaten (mit Erklärung).
- taz-Artikeltitel im Body im Original mit Übersetzung in eckigen Klammern. Der Frontmatter-Titel behält „Zuflucht vor dem Hitzeschlag“ im Original, weil er ein Zitat ist.
- Kirchen: bekannte mit englischem Namen (Kaiser Wilhelm Memorial Church, St Hedwig's Cathedral, St Mary's Church, Berlin Cathedral), Gemeindenamen bleiben deutsch.
- Zahlen: Komma als Tausendertrenner (2,000 m, 3,500), „20 per cent“ im Fließtext, „20 %“ in der Tabelle wie im DE. Uhrzeiten als „2 to 6 pm“.
- UI: Platzhalter `{count}`. Der Feedback-Text im Index braucht drei Messages (alle, 1, mehrere), weil das DE Singular und Plural per Ternary trennt. `date_months` liefert Monatsnamen für `formatDateDe`.
- Nicht aufgenommen: gleiche Texte in DE und EN („Updates“, „Berlin“, „RSS“, „Atom“, „JSON Feed“, OG-Alt „navigator.berlin Updates“) und die Message `breadcrumb_aria_label` („Brotkrumen“).

## Unsicher

- **Wohnschutz**: Die Messages schwanken. Layer-Name und Slider: „Tenant protection“. `home_featured_score_dim_wohnschutz`: „Housing protection“. Ich habe „Tenant protection“ genommen.
- **Alte Dimensionsnamen in `2026-05-15`**: Die Tabelle nennt „Grün“ und „Soziale Lage“. Das sind keine Message-Namen und die Dimensionen heißen seit `2026-05-21` anders. Ich habe „Green space“ und „Social situation“ gesetzt. Der Eintrag bleibt ein historischer Stand.
- **Nahversorgung / Versorgung** (`2026-06-07-nahversorgung`): EN braucht zwei Wörter, „amenities“ (Dimension) und „local shops“ (Nahversorgung).
- **DE `2026-05-19`**: „Unter `/wahl` listet jede der 20 Wahl-Varianten“ ist grammatisch unvollständig. EN glättet zu „each of the 20 election variants is listed“. „Zwölf Wahlen“ ist veraltet, das Wahlportal führt mehr (siehe C4c, `wahl_statistik_desc`). Nur gemeldet.
- **`2026-05-19`, „Ohne Briefstimmen“**: Keine Message gefunden. „Without postal votes“ ist eigene Wortwahl. „Wahlverhalten hier“ und „Wahl-Verlauf hier“ folgen `inspector_wahl_section_header` und `kiez_wahl_verlauf_heading`.
- **`2026-06-10`, „Kieztaten“**: Bleibt deutsch mit DE-Erklärung. Alternative: „neighbourhood offences“.
- **`2026-06-10`, „Hellfeld“**: EN „reported crime“, weil der Satz den Gegensatz zum Dunkelfeld meint. Der Titel bleibt „Recorded crime“ wie die Layer-Namen.
- **`2026-08-03`, veraltet**: „Seit heute Morgen warnt der DWD“ und „34 Grad für morgen“ sind ein Tagesstand. „473 Orte, 281 kostenlos“ stammt aus der Zeit vor `2026-08-08` (491, 298). Nur gemeldet.
- **`2026-08-03`, Titel**: „Zuflucht vor dem Hitzeschlag“ steht ohne Übersetzung im Frontmatter-Titel. Alternative: „taz tests the cool places map: refuge from heatstroke“.
- **`2026-08-03`, „Hallenbäder“**: „indoor pools“ statt „swimming pools“ (`home_hitze_lead` nutzt „swimming pools“ für Schwimmhallen).
- **`2026-08-08`, Aktion „Kühle Kirche“**: „bis Ende August“ ist ein Stand vom August. Nur gemeldet.
- **`2026-08-22-kiez-finder`, „Grafikkarte“**: EN „graphics card“ wörtlich. Alternative: „graphics processor (GPU)“.
- **`2026-08-22-mehrere-layer-lesbar`, Farben**: „petrol“ → „teal“ hat kein exaktes EN-Wort. „Ocker“ → „ochre“, „Beere“ → „berry“. „Farbfelder“ → „colour charts“ (Richters Werktitel „Colour Charts“).
- **UI `date_months`**: EN-Datum „15 May 2026“ dreht die Reihenfolge und lässt den Punkt weg. `formatDateDe` braucht eine Locale-Variante.
- **Link-Ziele**: Ich habe nicht geprüft, ob alle `/en/...`-Ziele existieren. Ungeprüft.

## Titel und Summary


| Slug | DE | EN |
| --- | --- | --- |
| `2026-05-15-kiez-score-versorgungs-dimension` (Titel) | Kiez-Score: Versorgungs-Dimension ergänzt | Kiez score: amenities dimension added |
| `2026-05-15-kiez-score-versorgungs-dimension` (Summary) | Fünfte Dimension prüft Kita, Schule, Krankenhaus, Spielplatz und Grünanlage in Lauf-Distanz. | A fifth dimension checks daycare, school, hospital, playground and green space within walking distance. |
| `2026-05-16-launch` (Titel) | Updates-Route geht live | Updates page goes live |
| `2026-05-16-launch` (Summary) | Daten-Refreshes, Feature-Releases und Methodik-Änderungen jetzt mit RSS, Atom und JSON-Feed. | Data refreshes, feature releases and methodology changes, now with RSS, Atom and JSON Feed. |
| `2026-05-17-hosting-und-cookieless-analytics` (Titel) | Hosting in Deutschland, Analytics ohne Cookies | Hosting in Germany, analytics without cookies |
| `2026-05-17-hosting-und-cookieless-analytics` (Summary) | navigator.berlin läuft jetzt auf einem deutschen Server. Reichweiten-Messung ohne Cookies, ohne US-Anbieter, ohne Banner. | navigator.berlin now runs on a German server. Audience measurement without cookies, without US providers, without a banner. |
| `2026-05-19-wahldaten` (Titel) | Wahldaten seit 2011 | Election data since 2011 |
| `2026-05-19-wahldaten` (Summary) | Vier Bundestags-, vier Abgeordnetenhaus- und vier BVV-Wahlen. Pro Adresse die stärkste Partei, pro Stimmbezirk eine Karte, pro Kiez der Verlauf über die Jahre. | Four Bundestag, four House of Representatives and four District Assembly elections. Strongest party per address, a map per polling district, the trend per Kiez. |
| `2026-05-21-umwelt-infrastruktur-score` (Titel) | Umwelt- & Infrastruktur-Score: neu zusammengesetzt | Environment & infrastructure score: rebuilt |
| `2026-05-21-umwelt-infrastruktur-score` (Summary) | Fünf gleich gewichtete Dimensionen, ein Gesamt-Layer auf der Karte und ein neu gebauter Inspektor mit klickbarem Score-Ring. | Five equally weighted dimensions, an overall map layer and a rebuilt inspector with a clickable score ring. |
| `2026-06-07-kultur-score` (Titel) | Kultur-Score: Bibliothek, Theater, Museum in Reichweite | Culture score: library, theatre, museum within reach |
| `2026-06-07-kultur-score` (Summary) | Eine eigenständige sechste Dimension misst Kulturorte im Umkreis aus OpenStreetMap. Sie zählt nicht in den Gesamt-Score, weil Kultur innenstadt-lastig ist. | A separate sixth dimension measures cultural venues nearby, from OpenStreetMap. It stays out of the overall score because culture is inner-city heavy. |
| `2026-06-07-nahversorgung-versorgung` (Titel) | Versorgung zählt jetzt Supermarkt, Apotheke und Post | Amenities now count supermarkets, pharmacies and post offices |
| `2026-06-07-nahversorgung-versorgung` (Summary) | Der Versorgungs-Score misst neben Kita, Schule und Klinik jetzt die Nahversorgung im Kiez: Lebensmittel, Apotheke und Post aus OpenStreetMap. | Besides daycare, schools and hospitals, the amenities score now measures local shops in the Kiez: groceries, pharmacy and post from OpenStreetMap. |
| `2026-06-10-kriminalitaet-kontext` (Titel) | Erfasste Kriminalität: neue Kontext-Dimension | Recorded crime: new context dimension |
| `2026-06-10-kriminalitaet-kontext` (Summary) | Erfasste Kriminalität pro Bezirksregion als eigenständiger Kontext. Kein Sicherheits-Urteil, kein Rang, nicht im Gesamt-Score. | Recorded crime per Bezirksregion as standalone context. No safety verdict, no rank, not in the overall score. |
| `2026-07-01-kuehle-orte` (Titel) | Kühle Orte bei Hitze: neuer Layer und Hitze-Navigator | Cool places in hot weather: new layer and Heat Navigator |
| `2026-07-01-kuehle-orte` (Summary) | Über 500 kühle Orte in Berlin, mit Live-Öffnungsstatus, Ein-Tap-Navigation und ehrlichen Flags. Ein Angebot auf offenen Daten, kein Stadt-Ersatz. | Over 500 cool places in Berlin, with live opening status, one-tap navigation and honest flags. A service on open data, not a replacement for the city. |
| `2026-08-03-taz-artikel-kuehle-orte` (Titel) | taz testet die Kühle-Orte-Karte: "Zuflucht vor dem Hitzeschlag" | taz tests the cool places map: "Zuflucht vor dem Hitzeschlag" |
| `2026-08-03-taz-artikel-kuehle-orte` (Summary) | Die taz hat den Hitze-Navigator geprüft und mit den Behördenkarten verglichen. Ergebnis: 40 Orte rund um den Gendarmenmarkt statt zwei. | The taz tested the Heat Navigator against the authorities' maps. Result: 40 places around Gendarmenmarkt instead of two. |
| `2026-08-08-kirchen-als-kuehle-orte` (Titel) | Kühle Orte: 18 offene Kirchen sind jetzt dabei, die Passionskirche zuerst | Cool places: 18 open churches added, Passionskirche first |
| `2026-08-08-kirchen-als-kuehle-orte` (Summary) | 18 verifizierte offene Kirchen und ein Stadtteilzentrum ergänzen die Karte. Neue Zahlen: 491 im Sommer geöffnete kühle Orte, 298 kostenlos. | 18 verified open churches and one neighbourhood centre join the map. New figures: 491 cool places open in summer, 298 free of charge. |
| `2026-08-22-kiez-finder` (Titel) | Kiez-Finder: Sag der Karte, was du suchst | Kiez finder: tell the map what you are looking for |
| `2026-08-22-kiez-finder` (Summary) | Neun Regler statt Suchfeld: gewichte Ruhe, Grün, S-Bahn-Nähe oder Wahlverhalten, die Karte färbt alle 542 Planungsräume live beim Ziehen. | Nine sliders instead of a search box: weight quiet, green space, S-Bahn proximity or voting behaviour, and the map recolours all 542 planning areas live. |
| `2026-08-22-mehrere-layer-lesbar` (Titel) | Mehrere Karten-Layer gleichzeitig, endlich lesbar | Several map layers at once, finally readable |
| `2026-08-22-mehrere-layer-lesbar` (Summary) | Jede Score-Dimension hat eine eigene Farbe, ein zweiter Layer erscheint als Größen-Symbole, die Rollen lassen sich tauschen. Dazu: neues Logo. | Each score dimension has its own colour, a second layer appears as size symbols, and roles can be swapped. Plus: a new logo. |

## UI

| ID | DE | EN |
| --- | --- | --- |
| `index_page_title` | Updates - Berlin in Daten - navigator.berlin | Updates - Berlin in data - navigator.berlin |
| `index_page_description` | Was sich an navigator.berlin verändert: neue Daten, Features und Methodik-Änderungen. Mit RSS und Atom. | What is changing at navigator.berlin: new data, features and methodology changes. With RSS and Atom. |
| `index_lead_before` | Daten-Refreshes, Feature-Releases und Methodik-Änderungen. Abonnieren via | Data refreshes, feature releases and methodology changes. Subscribe via |
| `index_lead_or` | oder | or |
| `index_filter_feedback_all` | Alle Kategorien aktiv. {count} Einträge. | All categories active. {count} entries. |
| `index_filter_feedback_filtered_one` | 1 Eintrag gefiltert. | 1 entry filtered. |
| `index_filter_feedback_filtered_many` | {count} Einträge gefiltert. | {count} entries filtered. |
| `index_list_aria_label` | Update-Einträge | Update entries |
| `index_empty` | Keine Updates in dieser Auswahl. Filter zurücksetzen oder andere Kategorie wählen. | No updates in this selection. Reset the filter or choose another category. |
| `detail_page_title_suffix` |  - Berlin in Daten - navigator.berlin |  - Berlin in data - navigator.berlin |
| `detail_breadcrumb_start` | Start | Home |
| `detail_tags_heading` | Tags | Tags |
| `detail_back_link` | ← Zurück zur Update-Liste | ← Back to the updates list |
| `card_read_more` | Mehr lesen | Read more |
| `filter_aria_label` | Update-Kategorien filtern | Filter update categories |
| `filter_heading` | Kategorien | Categories |
| `category_daten_update` | Daten-Update | Data update |
| `category_feature` | Feature | Feature |
| `category_methodik` | Methodik | Methodology |
| `category_datenquelle` | Datenquelle | Data source |
| `category_lizenz` | Lizenz | Licence |
| `category_presse` | Presse | Press |
| `date_months` | Januar, Februar, März, April, Mai, Juni, Juli, August, September, Oktober, November, Dezember | January, February, March, April, May, June, July, August, September, October, November, December |

## Bodys

- `2026-05-15-kiez-score-versorgungs-dimension`: Body: siehe c4d-updates-en/2026-05-15-kiez-score-versorgungs-dimension.en.md
- `2026-05-16-launch`: Body: siehe c4d-updates-en/2026-05-16-launch.en.md
- `2026-05-17-hosting-und-cookieless-analytics`: Body: siehe c4d-updates-en/2026-05-17-hosting-und-cookieless-analytics.en.md
- `2026-05-19-wahldaten`: Body: siehe c4d-updates-en/2026-05-19-wahldaten.en.md
- `2026-05-21-umwelt-infrastruktur-score`: Body: siehe c4d-updates-en/2026-05-21-umwelt-infrastruktur-score.en.md
- `2026-06-07-kultur-score`: Body: siehe c4d-updates-en/2026-06-07-kultur-score.en.md
- `2026-06-07-nahversorgung-versorgung`: Body: siehe c4d-updates-en/2026-06-07-nahversorgung-versorgung.en.md
- `2026-06-10-kriminalitaet-kontext`: Body: siehe c4d-updates-en/2026-06-10-kriminalitaet-kontext.en.md
- `2026-07-01-kuehle-orte`: Body: siehe c4d-updates-en/2026-07-01-kuehle-orte.en.md
- `2026-08-03-taz-artikel-kuehle-orte`: Body: siehe c4d-updates-en/2026-08-03-taz-artikel-kuehle-orte.en.md
- `2026-08-08-kirchen-als-kuehle-orte`: Body: siehe c4d-updates-en/2026-08-08-kirchen-als-kuehle-orte.en.md
- `2026-08-22-kiez-finder`: Body: siehe c4d-updates-en/2026-08-22-kiez-finder.en.md
- `2026-08-22-mehrere-layer-lesbar`: Body: siehe c4d-updates-en/2026-08-22-mehrere-layer-lesbar.en.md

## Abnahme

Matze 30.09.2026 11:03: abgenommen („approve continue“) mit den Vorschlägen des Koordinators:
- Veraltete Tagesstände in alten Einträgen bleiben (Changelog-Historie), EN wörtlich.
- DE-Korrektur `2026-05-19-wahldaten`: „Unter `/wahl` listet jede der 20 Wahl-Varianten (…)“ → „Unter `/wahl` hat jede der 20 Wahl-Varianten eine eigene Seite (Erst- und Zweitstimme zählen einzeln).“ EN-Body entsprechend.
- Glossar in den Updates: „Tenant protection“, „Kiez finder“. Startseite gleicht der Denglisch-Durchgang an.
- taz-Titel EN: `taz tests the cool places map: "Refuge from heatstroke"` (Zitat übersetzt, 80-Zeichen-Grenze); Body behält Original plus Übersetzung.
