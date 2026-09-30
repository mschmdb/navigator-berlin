# Review: i18n C4c · Hitze-Navigator, Kühle Orte und Lizenzen (DE → EN-GB)

Quelle DE: `src/routes/(with-header)/hitze/+page.svelte`, `src/lib/content/hitze-faq.ts`, `src/lib/components/kuehle-orte/` (`dwd-hitzewarn-banner.svelte`, `in-deiner-naehe.svelte`, `kuehle-orte-transparenz.svelte`, `transparenz-content.ts`), `src/routes/(with-header)/kuehle-orte/+page.svelte`, `src/routes/(with-header)/lizenzen/+page.svelte` sowie `src/lib/server/dwd-warnings.ts` (nur feste Stufen-Labels und Quelle). DE-Spalte wörtlich aus dem Code (Zeilenumbrüche im Quelltext zu einem Leerzeichen zusammengezogen). Maschinenlesbar: `c4c-uebersetzung.json`.

## Übersetzungsentscheidungen

- Kürzel: `hitze`, `hitze_faq`, `dwd_banner`, `in_deiner_naehe`, `transparenz`, `kuehle_orte`, `lizenzen`, `methodik_linktext`.
- Kühle Orte → „cool places“, Layer-Name und Filter wie `atlas_layer_name_kuehle_orte` und `inspector_kuehle_orte_*`. „Cool score“ wie `inspector_kuehle_orte_legende`.
- Hitze-Navigator → „Heat Navigator“ wie `home_hitze_cta_landing`. „Kühle Orte bei Hitze“ → „Cool places in hot weather“ wie `shell_meta_link_hitze`.
- Schwimmhallen → „swimming pools“ wie `home_hitze_lead`. `layer_explain_kuehle_orte_long` nutzt „indoor pools“.
- DWD → „German Weather Service (DWD)“ beim ersten Vorkommen je Kürzel, danach nur „DWD“ oder Kurzform. Ausnahme: `lizenzen` schreibt in Überschrift und TOC „Climate data (German Weather Service, DWD)“, um eine verschachtelte Klammer zu vermeiden.
- Behörden und Wahlbegriffe wie C4b und `messages/en.json`: Federal Election Commissioner (Bundeswahlleiterin), Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg), polling district, House of Representatives, District Assembly, Berlin Environmental Atlas, Berlin crime atlas (Kriminalitätsatlas Berlin).
- Datenlizenz Deutschland → „Data licence Germany, attribution, version 2.0“ (bzw. „zero“). Kennungen (`dl-de/by-2-0`, `dl-de/zero-2-0`, „ODbL 1.0“, „CC BY 4.0“, „CC0“, „CC BY-SA 4.0“, „MIT“ usw.), Software-Namen, URLs, Dateinamen (`_wbz.zip`, `package.json`) und `sameAs` bleiben.
- Bleiben deutsch: Kiez (Kiez score), Bezirk (Bezirke), Bezirksregion, Stolpersteine, S-Bahn, U-Bahn, LOR-Planungsraum → LOR planning area, RAUMID. „Google Maps“, „Apple Maps“ und Ortsnamen sind unverändert und nicht aufgeführt.
- Anrede: „du“ und „Sie“ werden zu „you“ und „your“. „Tippe“ und „Gib“ werden zu Imperativen.
- Platzhalter: `{link_start}`/`{link_end}`, `{code_start}`/`{code_end}`, `{count}`, `{distance}`. Link-Ziele stehen im Feld `note` der JSON-Datei.
- Nicht aufgenommen: Paraglide-Messages, Layer-Namen (`getLayerDisplayName`), Live-Texte der DWD-Warnung (`warning.headline`), Lizenz-Labels, die schon englisch sind („Open Database License 1.0“, „Creative Commons Attribution 4.0“), und Einträge mit gleichem DE/EN-Wortlaut (z. B. „Software“ als Tabellenkopf, „Library“) sind nicht aufgenommen. `section_software` steht der Vollständigkeit halber drin.
- Nicht aufgenommen: DataCatalog-JSON-LD in `lizenzen/+page.ts` sowie Breadcrumb „Berlin“.
- `hitze_faq`: Die Fragen und Antworten sind auch FAQPage-JSON-LD. `FaqSection` bekommt bei EN `contentLocale="en"` (Code, nicht Text).
- `dwd_banner`: Das Banner selbst enthält keinen festen Text. Ich habe die festen Stufen-Labels und die Quelle aus `dwd-warnings.ts` aufgenommen, weil sie sichtbar sind und dort auf DE fest verdrahtet.
- `methodik_linktext`: Vorschlag „Lizenzen-Seite“ / „licences page“ statt des sichtbaren Pfads `/lizenzen`. Die DE-Spalte ist eine DE-Korrektur. Beide Messages stehen vollständig da, nur der Linktext ändert sich.
- `lang="de"`-Attribute, Sortierung mit `localeCompare(..., 'de')` in `groupByLicense`, `formatDistanceDe` und `contentLocale="de"` müssen bei EN mit der Locale wechseln (Code, nicht Text).

## Unsicher

- **Hitzewarn-Stufen (`dwd_banner`)**: „Starke Hitze“ → „Strong heat“ und „Extreme Hitze“ → „Extreme heat“. Der DWD nutzt „Warnung vor starker Hitze“ und „Warnung vor extremer Hitze“, englisch laut Vorgabe „warning of heat“ und „warning of extreme heat“. Das Banner zeigt nur die Stufe als kurzes Label, deshalb ohne „warning“. Der DWD-Wortlaut ist ungeprüft. Alternative: „Warning of strong heat“ / „Warning of extreme heat“. „Strong“ passt zu DWD-DE („stark“), nicht zu „warning of heat“ ohne Zusatz.
- **`announce_found` (`in_deiner_naehe`)**: DE „{count} offene kühle Orte“ steht bei 1 Treffer im Plural. EN übernimmt das („1 open cool places“). Für EN wäre ein Plural-Message nötig.
- **`in_deiner_naehe`, Kategorie `ort.cat`**: Die Kategorie-Namen der Orte kommen aus den Daten und sind DE. Nicht Teil dieser Datei.
- **Anrede-Wechsel im DE**: `hitze` und `in_deiner_naehe` duzen, `transparenz` (`optout_heading`, `optout_text`) siezt. EN kennt den Unterschied nicht („you/your“).
- **`optout_heading`**: „Ihre Einrichtung soll nicht gelistet sein?“ ist elliptisch. EN „Don't want your venue listed?“ folgt der Ellipse. Alternative: „Want your venue removed from the list?“.
- **`optout_text` und `optout_aria_label`**: „austragen“ → „remove“. „Einrichtung“ → „venue“ wie `inspector_kuehle_orte_opt_out_aria_label`.
- **`haltung`**: „Hausrecht“ → „domiciliary rights“ ist juristisch korrekt, aber sperrig. Alternative: „the right to refuse entry“.
- **`cat_malls_name`**: „Kaufhäuser“ → „department stores“. „Malls“ bleibt „malls“ wie in `home_hitze_lead`.
- **`offiziell_hitzeschutz_text`**: „der Senatsverwaltung“ nennt keine Verwaltung. EN „the Senate department“ bleibt unbestimmt. Der Hitzeschutz liegt bei der Senatsverwaltung für Wissenschaft, Gesundheit und Pflege. Das ist ungeprüft und nicht Teil des DE.
- **`offiziell_karte_title`**: „Offizielle Kühle-Orte-Karte“ → „Official cool places map“. Die Stadt schreibt auf `kuehle-orte.berlin.de` selbst „Kühle Orte“, ein englischer Titel existiert dort ungeprüft nicht.
- **Zahlen ohne Beleg (nur gemeldet)**: „Über 500 kühle Orte“ (mehrfach) und „12 Berliner Wahlen seit 2011“ (`wahl_p1`). Die Wahldaten-Methodik listet 14 Einträge (siehe C4b, `tool_list_elections_desc`).
- **DE veraltet, `wahl_statistik_desc`**: Die Liste nennt AGH- und BVV-Wahlen 2011, 2016, 2021, 2023, aber nicht 2026. Das Wahlportal führt AGH und BVV 2026 (vorläufiges Ergebnis). EN übersetzt wörtlich.
- **DE inhaltlich, `daten_p1`**: „stehen unter drei verschiedenen Lizenzen“ ist fest verdrahtet. `LICENSE_INFO` kennt fünf Lizenzen. Die Anzahl der angezeigten Gruppen hängt vom Manifest ab. „Jede gruppiert nach Lizenz“ ist grammatisch unvollständig. EN glättet zu „They are grouped by licence“.
- **`license_geozg_label`**: „Geodata Access Act“ ist eigene Wortwahl, eine amtliche EN-Fassung ist ungeprüft. Der sichtbare Link-Text bleibt der Schlüssel „Geodatenzugangsgesetz“ (`info.key`), er ist Code-Bezeichner und nicht übersetzt. Für EN wäre ein eigener Anzeigetext nötig.
- **`license_odbl_summary`**: Das DE-Zitat „© OpenStreetMap-Contributors" schließt mit ASCII-Anführungszeichen und schreibt „Contributors“ mit Bindestrich. EN nutzt die übliche Schreibweise „© OpenStreetMap contributors“ mit typografischen Anführungszeichen. Das ist eine Abweichung vom DE-Wortlaut, aber `authorities.ts` schreibt ebenfalls „contributors“.
- **`daten_laerm`**: „Umweltatlas“ → „Berlin Environmental Atlas“ ohne deutsche Klammer, um verschachtelte Klammern zu vermeiden. „Strategische Lärmkarte“ → „Strategic Noise Map“ ist eigene Wortwahl (EU-Richtlinie: „strategic noise map“). „Build-Aggregat“ → „build aggregate“ wörtlich, technischer Begriff bleibt.
- **`klima_p1`**: Station „Brandenburg“ ist die Stadt Brandenburg an der Havel, nicht das Bundesland. Das DE nennt das nicht. EN übernimmt „Brandenburg“. „Sommertage“ und „Hitzetage“ → „summer days“ und „heat days“ (DWD-Begriffe, `layer_explain_klima_pet_2022_long` nutzt „summer day“).
- **`entitaeten_p1`**: „Bezirks-Seiten“ → „Bezirk pages“, „Wissensdatenbanken“ → „knowledge bases“. „Q-IDs“ → „Q IDs“.
- **`osm_p1`**: „ÖPNV-Stationen“ → „public transport stations“. `messages/en.json` hat „U-Bahn stations“ und „S-Bahn stations“ getrennt und „Public transport stops“ als Composite. „Fahrradstraßen“ → „bicycle streets“ wie `atlas_layer_name_fahrradstrassen_2024`.
- **`software_satori_name`**: „OG-Image-Generator“ → „OG image generator“. „OG“ ist Open-Graph-Jargon und bleibt.
- **Umbruchreste mit Leerzeichen**: In den Quelldateien dieses Blocks gefunden: keine.
- **`methodik_linktext`**: DE-Vorschlag „Lizenzen-Seite“. Alternative: „Lizenz-Übersicht“ (wie in `transparenz`, „Die vollständige Lizenz-Übersicht“). `transparenz` nutzt bereits „Lizenzen-Seite“ als Linktext.
- **`jsonld_keywords` (`hitze`)**: Das Array ist als ein Komma-String abgelegt. „Klimaanlage“ → „air conditioning“, „Abkühlung“ → „cooling down“.

## hitze

Quelle: `src/routes/(with-header)/hitze/+page.svelte` (`+page.server.ts` enthält keine Texte)

| ID | DE | EN |
|---|---|---|
| `meta_title` | Hitze-Navigator Berlin - kühle Orte bei Hitze finden | Heat Navigator Berlin - find cool places in hot weather |
| `meta_description` | Über 500 kühle Orte in Berlin bei Hitze: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten. | Over 500 cool places in Berlin in hot weather: cinemas, libraries, swimming pools, museums, malls and drinking fountains, each with address and directions. A service built on open data. |
| `jsonld_name` | Kühle Orte in Berlin | Cool places in Berlin |
| `jsonld_keywords` | Kühle Orte, Hitze, Berlin, Abkühlung, Klimaanlage, Trinkbrunnen | Cool places, heat, Berlin, cooling down, air conditioning, drinking fountains |
| `breadcrumb_start` | Start | Home |
| `breadcrumb_hitze` | Kühle Orte bei Hitze | Cool places in hot weather |
| `eyebrow` | Kühle Orte bei Hitze | Cool places in hot weather |
| `h1_title` | Hitze-Navigator Berlin | Heat Navigator Berlin |
| `intro_p1` | Gib deinen Standort ein. Du siehst die nächsten kühlen Orte in Berlin, sortiert nach Entfernung, mit Öffnungsstatus und dem Weg dorthin. Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen, über 500 Orte aus offenen Daten. | Enter your location. You see the nearest cool places in Berlin, sorted by distance, with opening status and directions. Cinemas, libraries, swimming pools, museums, malls and drinking fountains, over 500 places from open data. |
| `cta_map` | Kühle Orte auf der Karte | Cool places on the map |
| `cta_map_hint` | Interaktive Karte mit allen kühlen Orten, Live-Status und Filtern. | Interactive map with all cool places, live status and filters. |
| `methodik_link` | Methodik: wie wir kühle Orte bewerten | Methodology: how we rate cool places |
| `orte_heading` | Kühle Orte in Berlin: wo du Abkühlung findest | Cool places in Berlin: where you can cool down |
| `cat_kinos_name` | Kinos | Cinemas |
| `cat_kinos_note` | meist klimatisiert | mostly air-conditioned |
| `cat_bibliotheken_name` | Bibliotheken | Libraries |
| `cat_bibliotheken_note` | kühl und ruhig | cool and quiet |
| `cat_schwimmhallen_name` | Schwimmhallen | Swimming pools |
| `cat_schwimmhallen_note` | Abkühlung im Wasser | cooling off in the water |
| `cat_museen_name` | Museen | Museums |
| `cat_museen_note` | oft klimatisiert | often air-conditioned |
| `cat_malls_name` | Malls und Kaufhäuser | Malls and department stores |
| `cat_malls_note` | frei zugänglich | freely accessible |
| `cat_trinkbrunnen_name` | Trinkbrunnen | Drinking fountains |
| `cat_trinkbrunnen_note` | Mai bis Oktober | May to October |
| `schritte_heading` | In drei Schritten zum kühlen Ort | To a cool place in three steps |
| `step1_title` | Adresse eingeben | Enter an address |
| `step1_text` | Tippe deinen Standort in die Karte. | Type your location into the map. |
| `step2_title` | Nächste Orte sehen | See the nearest places |
| `step2_text` | Die Karte zeigt die kühlen Orte in deiner Nähe, sortiert nach Entfernung. | The map shows the cool places near you, sorted by distance. |
| `step3_title` | Hinnavigieren | Get directions |
| `step3_text` | Ein Tap öffnet die Route in Google oder Apple Maps. | One tap opens the route in Google or Apple Maps. |
| `offiziell_heading` | Offizielle Angebote der Stadt Berlin | Official services of the City of Berlin |
| `offiziell_intro` | Der Hitze-Navigator ergänzt die Angebote der Stadt, er ersetzt sie nicht. Die offiziellen Quellen: | The Heat Navigator complements the city's services and does not replace them. The official sources: |
| `offiziell_hitzeschutz_title` | Hitzeschutzportal der Stadt Berlin | Heat protection portal of the City of Berlin |
| `offiziell_hitzeschutz_text` | Warnungen, Verhaltenstipps und Hintergründe der Senatsverwaltung. | Warnings, behaviour tips and background information from the Senate department. |
| `offiziell_karte_title` | Offizielle Kühle-Orte-Karte | Official cool places map |
| `offiziell_karte_text` | Die städtische Karte mit Grünanlagen, Badestellen und Trinkbrunnen. | The city's map with green spaces, bathing spots and drinking fountains. |
| `offiziell_aktionsplan_title` | Berliner Hitzeaktionsplan | Berlin heat action plan |
| `offiziell_aktionsplan_text` | Die Strategie der Stadt gegen Hitzefolgen. | The city's strategy against the effects of heat. |

## hitze_faq

Quelle: `src/lib/content/hitze-faq.ts` (`HITZE_FAQ`, sichtbar und als FAQPage-JSON-LD)

| ID | DE | EN |
|---|---|---|
| `cool_places_where_q` | Wo finde ich in Berlin kühle Orte bei Hitze? | Where can I find cool places in Berlin in hot weather? |
| `cool_places_where_a` | Der Hitze-Navigator zeigt über 500 kühle Orte in ganz Berlin: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen. Gib deinen Standort ein, die Karte sortiert die nächsten geöffneten Orte nach Entfernung. | The Heat Navigator shows over 500 cool places across Berlin: cinemas, libraries, swimming pools, museums, malls and drinking fountains. Enter your location and the map sorts the nearest open places by distance. |
| `air_conditioned_q` | Welche Orte in Berlin sind bei Hitze klimatisiert? | Which places in Berlin are air-conditioned in hot weather? |
| `air_conditioned_a` | Viele Kinos, Museen und Malls sind klimatisiert. Wo die Klimatisierung belegt ist, markiert der Navigator den Ort entsprechend. Ist sie nicht belegbar, sagen wir das offen statt zu raten. | Many cinemas, museums and malls are air-conditioned. Where air conditioning is verified, the navigator marks the place accordingly. Where it cannot be verified, we say so openly instead of guessing. |
| `free_access_q` | Sind die kühlen Orte kostenlos zugänglich? | Are the cool places free to enter? |
| `free_access_a` | Bibliotheken, Trinkbrunnen und Malls sind meist frei zugänglich. Schwimmhallen und Museen kosten oft Eintritt. Jeder Ort trägt eine Angabe, ob kostenlos oder mit Ticket. | Libraries, drinking fountains and malls are mostly freely accessible. Swimming pools and museums often charge admission. Every place states whether it is free or needs a ticket. |
| `what_helps_q` | Was hilft bei Hitze in Berlin? | What helps in hot weather in Berlin? |
| `what_helps_a` | Kühle Innenräume aufsuchen, viel trinken, direkte Sonne meiden. Der Hitze-Navigator zeigt den nächsten kühlen Ort, die Stadt Berlin bündelt Verhaltenstipps im Hitzeschutzportal. | Seek out cool indoor spaces, drink plenty of water and avoid direct sun. The Heat Navigator shows the nearest cool place, and the City of Berlin collects behaviour tips in its heat protection portal. |
| `data_source_q` | Woher stammen die Daten zu den kühlen Orten? | Where does the data on the cool places come from? |
| `data_source_a` | Geometrie und Basis-Angaben kommen aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle Prüfung von navigator.berlin. Die aktuelle Hitzewarnung liefert der Deutsche Wetterdienst. | Geometry and base details come from OpenStreetMap (ODbL), supplemented by an editorial check by navigator.berlin. The current heat warning comes from the German Weather Service (DWD). |

## dwd_banner

Quelle: `src/lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte`. Das Banner enthält keinen festen Text. Feste Stufen-Labels und Quelle kommen aus `src/lib/server/dwd-warnings.ts` (`levelLabel`, `SOURCE`).

| ID | DE | EN |
|---|---|---|
| `level_label_stark` | Starke Hitze | Strong heat |
| `level_label_extrem` | Extreme Hitze | Extreme heat |
| `source` | Deutscher Wetterdienst (DWD) | German Weather Service (DWD) |

## in_deiner_naehe

Quelle: `src/lib/components/kuehle-orte/in-deiner-naehe.svelte`

| ID | DE | EN |
|---|---|---|
| `heading` | In deiner Nähe | Near you |
| `button_locate` | Orte in meiner Nähe | Places near me |
| `button_locating` | Standort wird bestimmt … | Determining your location … |
| `announce_locating` | Standort wird bestimmt | Determining your location |
| `hint` | Wir fragen deinen Standort ab und zeigen die nächsten jetzt geöffneten kühlen Orte. | We ask for your location and show the nearest cool places that are open now. |
| `fallback_denied` | Ohne Standort können wir keine Orte in deiner Nähe zeigen. | Without your location we cannot show places near you. |
| `fallback_unsupported` | Dein Browser unterstützt keine Standort-Bestimmung. | Your browser does not support location detection. |
| `fallback_error` | Standort konnte nicht bestimmt werden. | Your location could not be determined. |
| `announce_found` | {count} offene kühle Orte in der Nähe gefunden | {count} open cool places found nearby |
| `announce_none` | Keine offenen kühlen Orte in der Nähe gefunden | No open cool places found nearby |
| `distance_aria_label` | Entfernung {distance} | Distance {distance} |
| `status_closing_soon` | schließt bald | closing soon |
| `status_open_now` | jetzt offen | open now |
| `empty` | Gerade sind keine offenen kühlen Orte in deiner Nähe. Auf der Karte siehst du alle, inklusive der geschlossenen. | No cool places are open near you right now. On the map you see all of them, including the closed ones. |
| `link_all_on_map` | Alle kühlen Orte auf der Karte | All cool places on the map |

## transparenz

Quelle: `src/lib/components/kuehle-orte/kuehle-orte-transparenz.svelte` und `transparenz-content.ts`

| ID | DE | EN |
|---|---|---|
| `heading` | Transparenz und Quellen | Transparency and sources |
| `haltung` | Der Hitze-Navigator sammelt öffentlich zugängliche kühle Orte und prüft sie redaktionell. Er ergänzt die Angebote der Stadt, er ersetzt sie nicht. Die Liste kann Lücken haben und lebt von Korrekturen. Kein Rechtsanspruch auf Zugang: private Orte wie Malls und Kinos üben Hausrecht aus. | The Heat Navigator collects publicly accessible cool places and checks them editorially. It complements the city's services and does not replace them. The list may have gaps and relies on corrections. No legal entitlement to access: private places such as malls and cinemas can refuse entry (Hausrecht). |
| `quelle_osm_detail` | Geometrie und Basis-Angaben der Orte, © OpenStreetMap-Contributors. Weitergabe unter denselben Bedingungen (Share-Alike). | Geometry and base details of the places, © OpenStreetMap contributors. Redistribution under the same terms (share-alike). |
| `quelle_redaktion_name` | Redaktionelle Anreicherung | Editorial enrichment |
| `quelle_redaktion_detail` | navigator.berlin prüft Eignung, Adresse, Kühle-Score, Klimatisierung und Sommer-Verfügbarkeit. Wo eine Angabe nicht belegbar war, sagen wir das offen. | navigator.berlin checks suitability, address, cool score, air conditioning and summer availability. Where a detail could not be verified, we say so openly. |
| `quelle_dwd_name` | Deutscher Wetterdienst | German Weather Service (DWD) |
| `quelle_dwd_detail` | Amtliche Hitzewarnung für Berlin, live abgefragt und ohne Warnung ausgeblendet. | Official heat warning for Berlin, queried live and hidden when there is no warning. |
| `lizenzen_hinweis` | Die vollständige Lizenz-Übersicht steht auf der {link_start}Lizenzen-Seite{link_end}. | The full licence overview is on the {link_start}licences page{link_end}. |
| `optout_heading` | Ihre Einrichtung soll nicht gelistet sein? | Don't want your venue listed? |
| `optout_text` | Schreiben Sie uns, wir tragen den Ort aus. Ein Klick öffnet einen vorbereiteten Entwurf. | Write to us and we will remove the place. One click opens a prepared draft. |
| `optout_aria_label` | Einrichtung aus der Kühle-Orte-Karte austragen lassen | Have your venue removed from the cool places map |
| `optout_link` | Austragung anfragen | Request removal |

## kuehle_orte

Quelle: `src/routes/(with-header)/kuehle-orte/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Kühle Orte in Berlin - navigator.berlin | Cool places in Berlin - navigator.berlin |
| `meta_description` | Wo du dich in Berlin bei Hitze abkühlen kannst: Kinos, Bibliotheken, Schwimmhallen und mehr, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten. | Where you can cool down in Berlin in hot weather: cinemas, libraries, swimming pools and more, each with address and directions. A service built on open data. |
| `h1_title` | Kühle Orte in Berlin | Cool places in Berlin |
| `intro_p1` | Bei Hitze hilft keine lange Suche, sondern eine schnelle Antwort: Wohin zum Abkühlen? Diese Seite zeigt Orte in Berlin, an denen du der Hitze entkommst. Kinos, Bibliotheken, Schwimmhallen, Malls und mehr, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten, kein Ersatz für die Hinweise der Stadt. | In the heat you do not need a long search but a quick answer: where can I cool down? This page shows places in Berlin where you can escape the heat. Cinemas, libraries, swimming pools, malls and more, each with address and directions. A service built on open data, not a substitute for the city's advice. |
| `map_heading` | Kartenvorschau | Map preview |
| `map_label` | Kühle Orte in Berlin | Cool places in Berlin |
| `map_hint` | Die Vorschau zeigt Berlin. Die interaktive Karte mit allen kühlen Orten, Live-Status und Filtern öffnet sich im Explorer. | The preview shows Berlin. The interactive map with all cool places, live status and filters opens in the Explorer. |
| `cta_heading` | Zur interaktiven Karte | To the interactive map |
| `cta_button` | Karte erkunden | Explore the map |
| `cta_hint` | Öffnet den Atlas mit bereits aktivem Kühle-Orte-Layer. | Opens the atlas with the cool places layer already active. |

## lizenzen

Quelle: `src/routes/(with-header)/lizenzen/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Lizenzen - Berlin in Daten - navigator.berlin | Licences - Berlin in data - navigator.berlin |
| `meta_description` | Lizenzen der Geo-Daten und der verwendeten Software. | Licences of the geodata and the software used. |
| `og_image_alt` | navigator.berlin Lizenzen | navigator.berlin licences |
| `breadcrumb_lizenzen` | Lizenzen | Licences |
| `h1_title` | Lizenzen | Licences |
| `intro_p1` | Welche Lizenz pro Geo-Datensatz gilt und welche Software wir nutzen. | Which licence applies to each geodata set and which software we use. |
| `toc_aria_label` | Inhalt | Contents |
| `toc_heading` | Inhalt | Contents |
| `section_daten_lizenzen` | Daten-Lizenzen | Data licences |
| `section_wahldaten` | Wahldaten | Election data |
| `section_demografie` | Demografie | Demographics |
| `section_kriminalitaet` | Kriminalitätsatlas | Crime atlas |
| `section_klimadaten` | Klimadaten (DWD) | Climate data (German Weather Service, DWD) |
| `section_entitaeten` | Entitäts-Verweise | Entity references |
| `section_software` | Software | Software |
| `section_schriften` | Schriften | Fonts |
| `section_osm` | OpenStreetMap-Namensnennung | OpenStreetMap attribution |
| `license_dl_zero_label` | Datenlizenz Deutschland Zero 2.0 | Data licence Germany, zero, version 2.0 |
| `license_dl_zero_summary` | Freie Verwendung. Keine Namensnennung nötig. | Free use. No attribution required. |
| `license_dl_by_label` | Datenlizenz Deutschland Namensnennung 2.0 | Data licence Germany, attribution, version 2.0 |
| `license_dl_by_summary` | Freie Verwendung mit Namensnennung der Quelle. | Free use with attribution of the source. |
| `license_odbl_summary` | Namensnennung „© OpenStreetMap-Contributors" plus Share-Alike bei abgeleiteten Datenbanken. | Attribution “© OpenStreetMap contributors” plus share-alike for derived databases. |
| `license_cc_by_summary` | Freie Verwendung mit Namensnennung der Quelle. | Free use with attribution of the source. |
| `license_geozg_label` | Geodatenzugangsgesetz (GeoZG) | Geodata Access Act (Geodatenzugangsgesetz, GeoZG) |
| `license_geozg_summary` | Geo-Daten der Verwaltung sind zur kommerziellen und nicht-kommerziellen Nachnutzung freigegeben. | Geodata of the administration is released for commercial and non-commercial reuse. |
| `license_fallback_summary` | Lizenz-Volltext siehe Quelle. | See the source for the full licence text. |
| `daten_p1` | Die {count} aktiven Geo-Layer stehen unter drei verschiedenen Lizenzen. Jede gruppiert nach Lizenz, mit Link auf den jeweiligen Volltext. | The {count} active geo layers fall under three different licences. They are grouped by licence, with a link to the full text of each. |
| `daten_laerm` | Zusätzlich fließt die Strategische Lärmkarte 2022 (Umweltatlas, ua_stratlaerm_2022, Lizenz Datenlizenz Deutschland Zero 2.0) als Build-Aggregat je Planungsraum in den Kiez-Score ein. | In addition, the Strategic Noise Map 2022 (Berlin Environmental Atlas, ua_stratlaerm_2022, licence: Data licence Germany, zero, version 2.0) feeds into the Kiez score as a build aggregate per planning area. |
| `wahl_p1` | Wahl-Ergebnisse aus 12 Berliner Wahlen seit 2011 (Bundestag, Abgeordnetenhaus, BVV) liegen nicht als eigener Geo-Layer vor, sondern als Datenbank-Aggregate. Quellen und Lizenz beider Datenanbieter: | Election results from 12 Berlin elections since 2011 (Bundestag, House of Representatives, District Assembly) are not available as a separate geo layer but as database aggregates. Sources and licence of both data providers: |
| `wahl_bwl_name` | Bundeswahlleiterin | Federal Election Commissioner (Bundeswahlleiterin) |
| `wahl_bwl_desc` | Bundestagswahlen 2013, 2017, 2021, 2025 als Wahlbezirksstatistik ({code_start}_wbz.zip{code_end}). Lizenz Datenlizenz Deutschland Namensnennung 2.0. | Bundestag elections 2013, 2017, 2021, 2025 as polling district statistics ({code_start}_wbz.zip{code_end}). Licence: Data licence Germany, attribution, version 2.0. |
| `wahl_statistik_name` | Amt für Statistik Berlin-Brandenburg | Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg) |
| `wahl_statistik_desc` | Abgeordnetenhaus- und BVV-Wahlen 2011, 2016, 2021, 2023 als XLSX-Sheet-Pipeline plus Stimmbezirks-Polygone (Shapefile-Releases pro Wahlgang, reprojiziert nach WGS84). Lizenz Datenlizenz Deutschland Namensnennung 2.0. | House of Representatives and District Assembly elections 2011, 2016, 2021, 2023 as an XLSX sheet pipeline plus polling district polygons (shapefile releases per election, reprojected to WGS84). Licence: Data licence Germany, attribution, version 2.0. |
| `wahl_methodik_label` | Methodik: | Methodology: |
| `wahl_methodik_link` | Wahldaten | Election data |
| `demografie_p1` | Einwohner pro LOR-Planungsraum liegen nicht als eigener Geo-Layer vor. Wir nutzen sie als vorberechnete Summen für Pro-Kopf-Werte und den Demografie-Kontext. | Residents per LOR planning area are not available as a separate geo layer. We use them as precomputed totals for per-capita values and the demographic context. |
| `demografie_name` | Einwohner in LOR-Planungsräumen am 31.12.2024 | Residents in LOR planning areas on 31 December 2024 |
| `demografie_desc` | Einwohner nach Altersjahren je 542 LOR-Planungsräume, gejoint über die 8-stellige RAUMID. Lizenz CC BY 4.0, Amt für Statistik Berlin-Brandenburg. | Residents by year of age for each of 542 LOR planning areas, joined via the 8-digit RAUMID. Licence: CC BY 4.0, Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg). |
| `krim_p1` | Fallzahlen und Häufigkeitszahlen je LOR-Bezirksregion fließen als vorberechnete Werte in den Kiez-Score ein, nicht als eigener Geo-Layer. | Case numbers and frequency rates per LOR Bezirksregion feed into the Kiez score as precomputed values, not as a separate geo layer. |
| `krim_name` | Kriminalitätsatlas Berlin | Berlin crime atlas (Kriminalitätsatlas Berlin) |
| `krim_desc` | Straftaten-Fallzahlen und Häufigkeitszahlen 2016 bis 2025 der Polizei Berlin, geocodiert auf LOR-Ebene. Lizenz Datenlizenz Deutschland Namensnennung 2.0. | Offence case numbers and frequency rates 2016 to 2025 from the Berlin Police, geocoded at LOR level. Licence: Data licence Germany, attribution, version 2.0. |
| `krim_methodik_label` | Methodik: | Methodology: |
| `krim_methodik_link` | Kiez-Score | Kiez score |
| `klima_p1` | Historische Sommertage- und Hitzetage-Zeitreihen von vier Berliner Wetterstationen (Dahlem, Tempelhof, Buch, Brandenburg) liegen als Build-Aggregat im Hitze-Kontext. | Historical time series of summer days and heat days from four Berlin weather stations (Dahlem, Tempelhof, Buch, Brandenburg) are available as a build aggregate in the heat context. |
| `klima_name` | Deutscher Wetterdienst · Climate Data Center | German Weather Service (DWD) · Climate Data Center |
| `klima_desc` | Tageswerte der Stationsmessungen (daily KL, historical). Lizenz CC BY 4.0, Namensnennung Deutscher Wetterdienst. | Daily values of the station measurements (daily KL, historical). Licence: CC BY 4.0, attribution German Weather Service. |
| `entitaeten_p1` | Bezirks-Seiten verweisen per {code_start}sameAs{code_end} auf die passende Entität in offenen Wissensdatenbanken, damit Suchmaschinen die Seite eindeutig zuordnen. | Bezirk pages point via {code_start}sameAs{code_end} to the matching entity in open knowledge bases, so that search engines can assign the page unambiguously. |
| `entitaeten_wikidata_desc` | Q-IDs der 12 aktuellen Berliner Bezirke als {code_start}sameAs{code_end}-Verweis im JSON-LD. Lizenz CC0. | Q IDs of the 12 current Berlin Bezirke as a {code_start}sameAs{code_end} reference in the JSON-LD. Licence: CC0. |
| `entitaeten_wikipedia_name` | Wikipedia (deutsch) | Wikipedia (German) |
| `entitaeten_wikipedia_desc` | Artikel-Verweis pro Bezirk als zusätzlicher {code_start}sameAs{code_end}-Eintrag. Lizenz CC BY-SA 4.0. | Article reference per Bezirk as an additional {code_start}sameAs{code_end} entry. Licence: CC BY-SA 4.0. |
| `software_p1` | Wichtigste Runtime-Bibliotheken. Vollständige Auflistung im Repository unter {code_start}package.json{code_end}. | Main runtime libraries. Full list in the repository under {code_start}package.json{code_end}. |
| `software_th_license` | Lizenz | Licence |
| `software_satori_name` | Satori + @resvg/resvg-js (OG-Image-Generator) | Satori + @resvg/resvg-js (OG image generator) |
| `schriften_p1` | IBM Plex Serif, Sans und Mono unter SIL Open Font License 1.1, geliefert via Fontsource. | IBM Plex Serif, Sans and Mono under SIL Open Font License 1.1, delivered via Fontsource. |
| `osm_p1` | Die ODbL-Layer (Stolpersteine, ÖPNV-Stationen, Trinkbrunnen, Kühle Orte, S-Bahn-Netz, U-Bahn-Netz, Tram-Netz, Radverkehrsnetz, Fahrradstraßen) basieren auf OpenStreetMap-Daten. Lizenz: Open Database License 1.0. | The ODbL layers (Stolpersteine, public transport stations, drinking fountains, cool places, S-Bahn network, U-Bahn network, tram network, cycling network, bicycle streets) are based on OpenStreetMap data. Licence: Open Database License 1.0. |
| `osm_p2` | © OpenStreetMap-Contributors. Daten verfügbar unter {link_start}openstreetmap.org/copyright{link_end}. | © OpenStreetMap contributors. Data available at {link_start}openstreetmap.org/copyright{link_end}. |

## methodik_linktext

Quelle: `messages/de.json` und `messages/en.json` (`methodik_licences_full_list` auf `/methodik`, `methodik_kiez_score_sources_p1` auf `/methodik/kiez-score`). Die DE-Spalte ist ein Vorschlag (DE-Korrektur), der Pfad `/lizenzen` als Linktext entfällt.

| ID | DE | EN |
|---|---|---|
| `methodik_licences_full_list` | Vollständige Auflistung auf der {link_start}Lizenzen-Seite{link_end} | Full list on the {link_start}licences page{link_end} |
| `methodik_kiez_score_sources_p1` | Berliner Umweltatlas (Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt), Monitoring Soziale Stadtentwicklung (Senatsverwaltung Stadtentwicklung Berlin), Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0) und ÖPNV-Standorte aus OpenStreetMap (ODbL 1.0). Vollständige Liste mit Lizenz und Datenstand pro Layer: {link_start}Lizenzen-Seite{link_end}. | Berlin Environmental Atlas (Umweltatlas; Senate Department for Urban Mobility, Transport, Climate Action and the Environment), Monitoring Soziale Stadtentwicklung (Senate Department for Urban Development Berlin), Berlin crime atlas (Kriminalitätsatlas Berlin; Berlin Police, dl-de-by-2.0) and public transport locations from OpenStreetMap (ODbL 1.0). Full list with licence and data date per layer: {link_start}licences page{link_end}. |

## Abnahme

Matze 30.09.2026 10:15: abgenommen („approve continue“), DE-Fehler mitkorrigieren:
- `lizenzen.wahl_p1`: „12 Berliner Wahlen“ → „14“, „beider Datenanbieter“ → „der drei Datenanbieter“ (DE und EN).
- `lizenzen.daten_p1`: Lizenz-Anzahl als Parameter `{licenseCount}` aus den Daten statt fest „drei“.
- Neu: `lizenzen.wahl_landeswahl_name`/`_desc` für die Wahlen 2026 (wahlen-berlin.de, dl-de/by-2.0).
- `methodik_linktext`: „Lizenzen-Seite“ / „licences page“ statt Pfad.
- Plural „1 open cool places“: Pluralform in der Umsetzung.

## Nachträge (Review 30.09.)

- EN-Idiome: „in hot weather“ statt „during heat“ (nur `hitze`, `hitze_faq`, `kuehle_orte`), `optout_heading` „Don't want your venue listed?“, `haltung` „can refuse entry (Hausrecht)“, `cat_schwimmhallen_note` „cooling off in the water“.
- `lizenzen.daten_p1` in Singular- und Plural-Varianten (`_single`, `_one_license`), DE-Folgesatz „Sie sind nach Lizenz gruppiert …“.
- `methodik_licences_full_list`: „Vollständige Auflistung auf der {link}Lizenzen-Seite{/link}“ / „Full list on the {link}licences page{/link}“.
- Neu: `naehe_cat_*` (Kategorien), `map_embed_*` (neutral: „Karte: {label}“ / „Map: {label}“), `contact_optout_*` (Mail-Entwurf), `lizenzen_software_th_library`.
