# Review: i18n C4a · Methodik-Kern (DE → EN-GB)

Quelle DE: `src/routes/(with-header)/methodik/+page.svelte`, `methodik-daten-tabelle.svelte`, `methodik-pipeline-diagram.svelte`, `kiez-score/+page.svelte`, `cross-layer-templates/+page.svelte` und `+page.server.ts` sowie `src/lib/data/cross-layer-templates/wahl/wahl.de.yaml`. DE-Spalte wörtlich aus dem Code (Zeilenumbrüche im Quelltext zu einem Leerzeichen zusammengezogen). Maschinenlesbar: `c4a-uebersetzung.json`.

## Übersetzungsentscheidungen

- Glossar aus `messages/en.json` und C2 übernommen: planning area, locality, Kiez score, Dimensionen „Quiet & air“, „Green & heat“, „Local amenities“, Mobility, „Tenant protection“, Culture, Recorded crime. Layernamen (Noise pollution 2023, Cold air influence zone, Daycare centres usw.) nach `atlas_layer_name_*`.
- Score-Name: „Umwelt- & Infrastruktur-Score“ → „environment & infrastructure score“ (wie `shell_meta_link_score`). „Kiez-Score“ → „Kiez score“.
- Bleiben deutsch: Kiez (Plural Kieze), Bezirk (Bezirke), Bezirksregion (Bezirksregionen), Stolpersteine, Milieuschutz, U-Bahn, S-Bahn. Später erste Nennung mit Klammer, z. B. „Berlin Environmental Atlas (Umweltatlas; …)“, „Berlin crime atlas (Kriminalitätsatlas Berlin; …)“.
- Wahlbegriffe aus dem Wahlportal: Bundestag election, „Berlin House of Representatives (Abgeordnetenhaus) election“, District Assembly (BVV), polling district, postal-vote group, party vote (Zweitstimme), Federal Election Commissioner (Bundeswahlleiterin), Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg).
- Behördennamen nach `authorities.ts`: „Senate Department for Urban Mobility, Transport, Climate Action and the Environment“, „Senate Department for Urban Development Berlin“.
- Sentence Case in allen Überschriften. „Was …“-Überschriften des DE bleiben inhaltsgleich („What this is about“, „What we leave out“, „What is missing and why“).
- Zahlen englisch: 1.000 → 1,000, 7.500 → 7,500, 1,3-fach → „factor of 1.3“, 23,1 % → 23.1%. Gewichte (0.30, 0.15) standen schon mit Punkt und bleiben.
- Platzhalter: `{layerCount}`, `{totalTemplates}`, `{missingVars}` sind Svelte-Ausdrücke. `{link_start}`/`{link_end}` (bei zwei Links `{link1_start}` usw.) und `{code_start}`/`{code_end}` markieren `<a>` und `<code>`. Mustache-Platzhalter im YAML (`{kiez_name}` usw.) unverändert. Link-Ziele stehen im Feld `note` der JSON-Datei.
- Bezeichner bleiben unübersetzt: Coverage-Reason-Schlüssel (`no-coverage` usw.), Stage-Labels der Pipeline außer der deutschen Detailzeile, Dateipfade, Befehle, `Ordinal-3`, `Presence`, `Distance`, Lizenzkürzel, Fixture-Eigennamen.
- „Wahl-Typ“ und „Stimmtyp“ der Fixture: „Zweitstimmen“ → „party votes“ (Plural wegen Satzbau des Templates).
- `editorialNote` im YAML nicht übersetzt (Auftrag). Layer-Namen in der Daten-Tabelle kommen aus `getLayerDisplayName` und sind hier nicht enthalten.
- Nicht aufgenommen: Einträge, die in DE und EN gleich lauten und im Code schon englisch sind (Stage-Labels, `Requires`, `Scope`, `Fixture:`), sowie `Berlin` im Breadcrumb.
- Mail-Betreffs (`subject=`) sind eigene Einträge, weil sie im Mailprogramm sichtbar werden.

## Unsicher

- **Kiez-Definition (methodik, `kiez_p1`)**: DE schreibt „Lebensweltlich orientierte Raum-Bezirksregion“. Offiziell heißt es „Lebensweltlich orientierte Räume“. EN übersetzt mit „lifeworld-oriented spaces“ und nennt LOR-BZR.
- **„Wohn-Score“ (`mission_p2`)**: → „residential score“. Ein englischer Standardbegriff fehlt. „living score“ oder „housing score“ wären Alternativen.
- **„Stadtteil-Statistik“ / „Stadtteil-Mittel“**: → „neighbourhood statistics“ / „neighbourhood means“. „Stadtteil“ ist weder Bezirk noch Ortsteil (wie bei C2 `umweltgerechtigkeit-2023`).
- **„Senatsverwaltung Berlin“ (`mss_p1`)**: DE nennt die Behörde unpräzise. EN schreibt „Berlin Senate Department“. `authorities.ts` kennt „Senate Department for Urban Development Berlin“, das DE nennt es hier nicht.
- **Parteinamen**: `messages/en.json` enthält keine EN-Formen. „Die Linke“, „GRÜNE“, „CDU“, „Bündnis 90/Die Grünen“ bleiben unverändert.
- **`omission_single_score_reason`**: DE enthält „keine eine Zahl“ (vermutlich Tippfehler). EN gibt den Sinn wieder. DE nicht korrigiert.
- **`dim_kriminalitaet_detail`**: „Kieztaten“ zuerst als „Neighbourhood offences (Kieztaten)“ (wie C2), dann in Anführungszeichen mit deutschem Wort. „Tatortprinzip“ steht in Klammern, weil kein gängiger englischer Begriff existiert.
- **`dim_versorgung_detail`**: „Trägerschaft“ → „ownership type“. Gemeint ist der Betreiber (öffentlich, freier Träger).
- **`dim_wohnschutz_detail`**: „Erhaltungssatzung“ → „preservation statute“, „ODER-verknüpft“ → „combined with OR“. C2 nutzt teils „preservation order“.
- **`weights_p1`**: „liegt in Phase 2“ wörtlich „is in phase 2“. Gemeint ist „ist für Phase 2 geplant“.
- **`data_status`-Überschrift („Daten-Stand“)**: → „Data status“. „Last updated“ wäre eine Alternative, passt aber schlechter zur Sektion mit Tabelle.
- **Quotes im DE**: `+page.svelte` (methodik) nutzt bei mehreren Zitaten ein ASCII-Schlusszeichen („Kiez"), `kiez-score/+page.svelte` typografische. EN nutzt durchgehend “…”.
- **`clt_page`**: Das H1 hat `lang="de"`. Bei EN muss das Attribut mit der Locale wechseln. Die Seite ist `noindex`, Dev-Vorschau.
- **YAML-Tags** (`wahl`, `trend`, `zeitreihe`) erscheinen als Chips in der Vorschau. Übersetzung ist optional.
- **Tabellensortierung**: `methodik-daten-tabelle.svelte` sortiert mit `localeCompare(…, 'de')`. Bei EN Locale anpassen (Code, nicht Text).

## methodik

Quelle: `src/routes/(with-header)/methodik/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Methodik - Berlin in Daten - navigator.berlin | Methodology - Berlin in data - navigator.berlin |
| `meta_description` | Methodik des Berliner Daten-Atlas: Auflösung, Aktualität, Editorial-Regeln und was bewusst nicht enthalten ist. | Methodology of the Berlin data atlas: resolution, timeliness, editorial rules and what is deliberately not included. |
| `jsonld_headline` | Methodik der Daten | Data methodology |
| `og_image_alt` | navigator.berlin Methodik | navigator.berlin methodology |
| `breadcrumb_methodik` | Methodik | Methodology |
| `h1_title` | Methodik | Methodology |
| `toc_aria_label` | Inhalt | Contents |
| `toc_heading` | Inhalt | Contents |
| `section_mission_heading` | Worum es geht | What this is about |
| `section_architecture_heading` | Datenarchitektur | Data architecture |
| `section_aggregation_heading` | Aggregations-Ebenen | Aggregation levels |
| `section_map_heading` | Karten-Darstellung | Map display |
| `section_kiez_heading` | Was „Kiez" hier bedeutet | What “Kiez” means here |
| `section_cross_layer_heading` | Aggregat-Indizes | Aggregate indices |
| `section_election_heading` | Wahldaten | Election data |
| `section_cool_places_heading` | Kühle Orte | Cool places |
| `section_coverage_heading` | Coverage-Strategie | Coverage strategy |
| `section_omissions_heading` | Was wir weglassen | What we leave out |
| `section_editorial_heading` | Editorial-Verantwortung | Editorial responsibility |
| `section_data_status_heading` | Daten-Stand | Data status |
| `section_licences_heading` | Quellen und Lizenzen | Sources and licences |
| `section_feedback_heading` | Feedback | Feedback |
| `mission_p1` | navigator.berlin sammelt {layerCount} öffentliche Berliner Geo-Datensätze und zeigt pro Adresse die zutreffenden Werte. Statisch ausgeliefert, ohne Cookies, ohne Login, ohne Tracker. | navigator.berlin collects {layerCount} public Berlin geodata sets and shows the values that apply to each address. Served statically, without cookies, without login, without trackers. |
| `mission_p2` | Die Idee: Daten lesbar machen, ohne sie zu einem „Wohn-Score" zu verdichten. Stadtteil-Statistik bleibt Stadtteil-Statistik. Was an einer Adresse zutrifft, steht im Inspector. Was nicht zutrifft, sagen wir auch. | The idea: make data readable without condensing it into a “residential score”. Neighbourhood statistics stay neighbourhood statistics. What applies at an address appears in the inspector. Where something does not apply, we say so. |
| `architecture_p1` | Beim Build-Schritt fetchen wir jeden Layer von der Quelle, reprojizieren auf EPSG:4326, vereinfachen die Geometrie mit mapshaper und schreiben Hash plus Datenstand ins Manifest. Zur Laufzeit liefert ein Punkt-im-Polygon-Lookup pro Adresse die zutreffenden Werte. Keine Datenbank, kein API-Call zum Server. | In the build step we fetch every layer from its source, reproject to EPSG:4326, simplify the geometry with mapshaper and write the hash plus the data update date into the manifest. At runtime a point-in-polygon lookup returns the applicable values per address. No database, no API call to the server. |
| `aggregation_p1` | Nicht jeder Wert ist adressgenau. Lärm und Luft stammen aus Stadtteil-Statistiken (LOR-Planungsraum, 542 Polygone). Bodenrichtwerte hängen am Häuserblock. Wer im Inspector einen Lärm-Wert liest, sieht den Mittelwert für den ganzen Planungsraum, nicht das eigene Schlafzimmer. | Not every value is address-exact. Noise and air come from neighbourhood-level statistics (LOR planning area, 542 polygons). Standard land values attach to the city block. Anyone who reads a noise value in the inspector sees the mean for the whole planning area, not their own bedroom. |
| `aggregation_level_address` | Adress-genau | Address-exact |
| `aggregation_level_address_detail` | Punkt-Geocode + Punkt-Layer (Stolpersteine, Kitas, ÖPNV-Stops) | Point geocode + point layers (Stolpersteine, daycare centres, public transport stops) |
| `aggregation_level_lor` | LOR-Planungsraum (542) | LOR planning area (542) |
| `aggregation_level_lor_detail` | Lärm, Luft, Bioklima, Grünversorgung, Umweltgerechtigkeit, Wohnlagen-2024 | Noise, air, bioclimate, green space provision, environmental justice, residential areas 2024 |
| `aggregation_level_admin` | Bezirk (12) und Ortsteil (96) | Bezirk (12) and locality (96) |
| `aggregation_level_admin_detail` | Verwaltungs-Stammdaten | Administrative master data |
| `aggregation_level_block` | Block-Aggregat | Block aggregate |
| `aggregation_level_block_detail` | Bodenrichtwerte, Klima-PET, Milieuschutz, Einschulbereiche | Standard land values, climate PET, Milieuschutz, school catchment areas |
| `aggregation_level_osm` | Punkt-OSM | Point OSM |
| `aggregation_level_osm_detail` | Radverkehrsnetz, Fahrradstraßen, ÖPNV-Stationen, Stolpersteine, Trinkbrunnen | Cycling network, bicycle streets, public transport stations, Stolpersteine, drinking fountains |
| `map_p1` | Die Karte zeigt höchstens zwei Wertkarten gleichzeitig, mit festen Rollen: Die erste füllt die Fläche, die zweite erscheint als abgestufte Quadrat-Symbole, ein Quadrat pro Planungsraum, dessen Größe die Stufe zeigt. Ein dritter Wert-Layer ersetzt automatisch den ältesten. In der Legende lassen sich die Rollen per Klick tauschen; die Einstellung wandert mit in geteilte Links. | The map shows at most two value maps at the same time, with fixed roles: the first fills the area, the second appears as graduated square symbols, one square per planning area, whose size shows the level. A third value layer automatically replaces the oldest. In the legend you can swap the roles with a click; the setting is carried over into shared links. |
| `map_p2` | Jede Score-Dimension hat eine eigene Farbe (Ruhe & Luft blau, Mobilität violett, Versorgung ocker, Wohnschutz petrol, Kultur beere; Grün gehört dem Gesamt-Score und Grün & Hitze). Innerhalb jeder Farbe gilt: hell = niedrige, dunkel = hohe Stufe. Die Formsprache trennt Bedeutungen: Quadrate stehen für zusammengefasste Flächenwerte, runde Marker und Pins für konkrete Orte. Gebiets-Layer wie Milieuschutz oder Kaltluft-Korridore sagen nur „hier gilt etwas", legen sich als Flächen darunter und zählen nicht ins Zwei-Karten-Limit. | Each score dimension has its own colour (Quiet & air blue, Mobility violet, Local amenities ochre, Tenant protection teal, Culture berry; green belongs to the overall score and Green & heat). Within each colour: light = low level, dark = high level. The shape language separates meanings: squares stand for aggregated area values, round markers and pins for specific places. Area layers such as Milieuschutz or cold air corridors only say “this applies here”, sit underneath as areas and do not count towards the two-map limit. |
| `map_p3` | Die Größen-Staffelung der Symbole trägt die Information auch bei Rot-Grün-Schwäche, wo sich Farbtöne annähern können. Die Unterscheidbarkeit der Farb-Kombinationen haben wir mit simulierter Farbfehlsichtigkeit gemessen, nicht geschätzt. | The size gradation of the symbols carries the information even with red-green colour vision deficiency, where hues can converge. We measured the distinguishability of the colour combinations with simulated colour vision deficiency, not estimated it. |
| `kiez_p1` | Umgangssprachlich ist ein Kiez ein gefühltes Viertel, von den Bewohnern definiert, ohne feste Grenze. Auf navigator.berlin meint „Kiez" dagegen eine amtliche Einheit: die Lebensweltlich orientierte Raum-Bezirksregion (LOR-BZR, Stand 2021), 143 Stück. | In everyday speech a Kiez is a felt neighbourhood, defined by its residents, without a fixed boundary. On navigator.berlin, “Kiez” instead means an official unit: the LOR Bezirksregion (lifeworld-oriented spaces, LOR-BZR, as of 2021), 143 in total. |
| `kiez_p2` | Wir nutzen die LOR-Bezirksregion, weil nur sie eine klare, statistisch belegte Grenze hat, an der alle Daten hängen. Dein gefühlter Kiez kann kleiner sein oder über mehrere Bezirksregionen reichen. Die Werte auf einer Kiez-Seite gelten für die LOR-BZR, nicht für eine einzelne Straße. | We use the LOR Bezirksregion because only it has a clear, statistically backed boundary that all data hangs on. Your felt Kiez can be smaller or span several Bezirksregionen. The values on a Kiez page apply to the LOR-BZR, not to a single street. |
| `cross_layer_p1` | Der Umwelt- & Infrastruktur-Score fasst pro Planungsraum fünf Dimensionen zusammen: Ruhe und Luft, Grün und Hitze, Mobilität, Versorgung (Kitas, Schulen, Krankenhäuser, Spielplätze) und Wohnschutz (Milieuschutzgebiete). Jede Dimension bleibt separat abrufbar im Inspector und als eigener Karten-Layer. Fünf mal 20 Prozent Gewicht. Ein Gesamt-Layer aggregiert sie als Mittel. | The environment & infrastructure score combines five dimensions per planning area: Quiet & air, Green & heat, Mobility, Local amenities (daycare centres, schools, hospitals, playgrounds) and Tenant protection (Milieuschutz areas). Each dimension stays separately available in the inspector and as its own map layer. Five times 20 percent weight. An overall layer aggregates them as a mean. |
| `cross_layer_p2` | Der Score misst nur Größen mit eindeutiger Besser-Richtung für Bewohner. Sozialstruktur wertet er nicht: ein Kiez mit niedrigem Sozialstatus lebt nicht „schlechter". Bezahlbarkeit bleibt ebenfalls draußen, kontestiert und ohne belastbare Adress-Daten. | The score only measures quantities with an unambiguous better direction for residents. It does not rate social structure: a Kiez with low social status does not live “worse”. Affordability also stays out: contested and without reliable address-level data. |
| `cross_layer_p3` | Es gibt keinen einzelnen „Berlin-Score". Aggregation auf eine Zahl würde stigmatisieren und individuelle Prioritäten verschleiern. Wer Familie sucht, gewichtet anders als jemand mit Hitze-Empfindlichkeit. | There is no single “Berlin score”. Aggregation to one number would stigmatise and obscure individual priorities. Someone looking for a place for a family weights differently from someone sensitive to heat. |
| `cross_layer_full_methodology` | Vollständige Methodik: {link_start}Kiez-Score{link_end} | Full methodology: {link_start}Kiez score{link_end} |
| `mss_heading` | MSS 2025 als neutraler Kontext | MSS 2025 as neutral context |
| `mss_p1` | Das Monitoring Soziale Stadtentwicklung der Senatsverwaltung Berlin liefert pro Planungsraum einen Gesamtindex aus Status (Einkommen, Beschäftigung, Bildung) und Dynamik (Veränderung). Seit der Score-Neuordnung fließt es nicht mehr in den Score ein. Wir zeigen es als neutralen Kontext-Layer, nur den Aggregat-Wert, nicht die Einzel-Indikatoren wie Arbeitslosen-Quote oder Transferbezugs-Anteil. Einzelwerte wären auf Adress-Ebene schärfer und stigmatisierender. | The Monitoring Soziale Stadtentwicklung (social urban development monitoring) of the Berlin Senate Department provides an overall index per planning area, made up of status (income, employment, education) and dynamics (change). Since the score reorganisation it no longer feeds into the score. We show it as a neutral context layer, only the aggregate value, not the individual indicators such as unemployment rate or rate of welfare receipt. Individual values would be sharper and more stigmatising at address level. |
| `mss_p2` | Niedriger Status bedeutet nicht „schlechter Kiez". Die Stufe spiegelt strukturelle Unterschiede, keine Wohnqualität. Choropleth-Farben sind neutral gehalten, kein Rot-Grün. Quelle: SenStadt MSS 2025, Lizenz dl-de/zero-2-0. | Low status does not mean “bad Kiez”. The level reflects structural differences, not housing quality. Choropleth colours are kept neutral, no red-green. Source: SenStadt MSS 2025, licence dl-de/zero-2-0. |
| `election_p1` | Bundestags-, Abgeordnetenhaus- und BVV-Wahlen seit 2011 mit Aggregaten auf vier Ebenen: Stimmbezirk, Kiez (LOR-Bezirksregion), Bezirk und Berlin gesamt. Quellen sind Bundeswahlleiterin (BTW) und Amt für Statistik Berlin-Brandenburg (AGH + BVV). Werte beschreiben Stimmenanteile, keine Bewertung. | Bundestag, Berlin House of Representatives (Abgeordnetenhaus) and District Assembly (BVV) elections since 2011 with aggregates at four levels: polling district, Kiez (LOR Bezirksregion), Bezirk and Berlin overall. Sources are the Federal Election Commissioner (Bundeswahlleiterin, BTW) and the Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg, AGH + BVV). Values describe vote shares, not an assessment. |
| `election_p2` | Spezialfälle dokumentieren wir transparent: Briefwahl-Gruppen als kleinste Kartenebene (Kiez-Wert als Schätzung), Wiederholungswahlen 2023 mit Original-Wahl-Verweis, Coverage-Lücken pre-2017 ohne Stimmbezirks-Geometrie. | We document special cases transparently: postal-vote groups as the smallest map level (Kiez value as an estimate), repeat elections 2023 with a reference to the original election, coverage gaps before 2017 without polling district geometry. |
| `election_full_methodology` | Vollständige Methodik: {link1_start}Wahldaten{link1_end} · {link2_start}Alle Wahlen einzeln{link2_end} | Full methodology: {link1_start}Election data{link1_end} · {link2_start}All elections individually{link2_end} |
| `cool_places_p1` | Der Kühle-Orte-Layer zeigt Orte zum Abkühlen bei Hitze. Der Kühle-Score von 1 bis 5 folgt Typ und Bauart: 5 sehr kalt (Eishalle), 4 klimatisiert oder am Wasser, 3 kühler Massivbau wie Bibliothek oder Museum, darunter weniger kühl. Geometrie und Basis-Tags stammen aus OpenStreetMap (ODbL 1.0, Namensnennung), ergänzt um eine redaktionelle navigator.berlin-Anreicherung: Kühle-Score, Klimatisierung und Sommer-Verfügbarkeit. | The Cool places layer shows places to cool down during heat. The cool score from 1 to 5 follows type and construction: 5 very cold (ice rink), 4 air-conditioned or by the water, 3 cool solid building such as a library or museum, below that less cool. Geometry and base tags come from OpenStreetMap (ODbL 1.0, attribution), supplemented by an editorial navigator.berlin enrichment: cool score, air conditioning and summer availability. |
| `cool_places_p2` | Klimatisierung ist selten belegbar: nur 29 von 659 Orten tragen einen belegten AC-Status, der Rest steht auf wahrscheinlich oder unbekannt. Der AC-Hinweis ist ein Indiz, keine Zusage. Ein Angebot, kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang. | Air conditioning is rarely verifiable: only 29 of 659 places have a verified AC status, the rest are marked probable or unknown. The AC note is an indication, not a promise. An offer, not a substitute for authorities, no legal right of access. |
| `cool_places_sources_link` | Quellen und Lizenzen | Sources and licences |
| `coverage_p1` | Liefert ein Layer für eine Adresse keinen Wert, nennen wir den Grund. | If a layer delivers no value for an address, we state the reason. |
| `coverage_reason_no_coverage` | Datensatz für diese Adresse nicht verfügbar. | Dataset not available for this address. |
| `coverage_reason_outdated` | Geo-Datensatz älter als 5 Jahre. | Geodataset older than 5 years. |
| `coverage_reason_seasonal` | Layer aktiv nur in Saison (Trinkbrunnen Mai bis Oktober). | Layer active only in season (drinking fountains May to October). |
| `coverage_reason_out_of_scope` | Adresse außerhalb des räumlichen Geltungsbereichs. | Address outside the spatial scope. |
| `coverage_reason_out_of_concept` | Layer konzeptionell nicht anwendbar (Mietspiegel-Layer in Gewerbe-Lage). | Layer conceptually not applicable (rent index layer in a commercial location). |
| `omission_cookies_label` | Cookies, Tracker, User-Konten | Cookies, trackers, user accounts |
| `omission_cookies_reason` | Keine Browser-Identifikation. Bookmarks liegen im LocalStorage. | No browser identification. Bookmarks live in LocalStorage. |
| `omission_rent_label` | Mietpreise | Rent prices |
| `omission_rent_reason` | Wir nennen keinen €/m². Den offiziellen Wert liefert mietspiegel.berlin.de. | We state no €/m². The official value comes from mietspiegel.berlin.de. |
| `omission_personal_data_label` | Personenbezogene Daten | Personal data |
| `omission_personal_data_reason` | Kein Profil, keine Verhaltens-Auswertung, keine Login-Pflicht. | No profile, no behavioural analysis, no login requirement. |
| `omission_generated_texts_label` | Algorithmisch generierte Layer-Texte | Algorithmically generated layer texts |
| `omission_generated_texts_reason` | Layer-Beschreibungen schreiben wir manuell. Kein LLM-Output für Personen-Biografien. | We write layer descriptions by hand. No LLM output for personal biographies. |
| `omission_single_score_label` | Stadtweiter Einzel-Score | City-wide single score |
| `omission_single_score_reason` | Pro Kiez gibt es einen Gesamt-Wert, aber keine eine Zahl für ganz Berlin. Persönliche Prioritäten gewichten ohnehin anders. | There is one overall value per Kiez, but no single number for the whole of Berlin. Personal priorities weight things differently anyway. |
| `omission_advertising_label` | Werbung, Partner-Tracking, A/B-Tests | Advertising, partner tracking, A/B tests |
| `omission_advertising_reason` | Kein kommerzielles Modell. | No commercial model. |
| `editorial_p1` | Stolpersteine zeigen wir als Erinnerungs-Marker. Wir zählen sie nicht und werten sie nicht. Personen-Biografien gehören zur Primärquelle stolpersteine-berlin.de. | We show Stolpersteine as memorial markers. We neither count nor rate them. Personal biographies belong to the primary source stolpersteine-berlin.de. |
| `editorial_p2` | navigator.berlin nennt keinen Mietpreis und gibt keine rechtliche Auskunft. Den gesetzlichen Wohnlagen-Mietspiegel liefert mietspiegel.berlin.de. | navigator.berlin states no rent price and gives no legal advice. The statutory rent index by residential area (Wohnlagen-Mietspiegel) comes from mietspiegel.berlin.de. |
| `editorial_p3` | Aggregierte Werte sind Stadtteil-Mittel, keine Wohnungs-Eigenschaften. Wir verzichten bewusst auf einen „Berlin-Score" und zeigen keine Bezirks-Rankings. | Aggregated values are neighbourhood means, not properties of a flat. We deliberately forgo a “Berlin score” and show no Bezirk rankings. |
| `editorial_p4` | Layer-Texte schreiben wir manuell. Kein Layer-Inhalt wird per LLM zusammengefasst, keine Personen-Biografie generiert. | We write layer texts by hand. No layer content is summarised by LLM, no personal biography generated. |
| `data_status_intro` | Alphabetisch sortiert nach Layer-Name, kein Aktualitäts-Ranking. | Sorted alphabetically by layer name, not a ranking by recency. |
| `licences_p1` | Die meisten Layer stehen unter dl-de/zero-2-0 oder dl-de/by-2-0. OSM-basierte Layer (Stolpersteine, ÖPNV, Trinkbrunnen, Radverkehr) unter ODbL 1.0 mit Namensnennung OpenStreetMap-Contributors. | Most layers are under dl-de/zero-2-0 or dl-de/by-2-0. OSM-based layers (Stolpersteine, public transport, drinking fountains, cycling) are under ODbL 1.0 with attribution to OpenStreetMap contributors. |
| `licences_full_list` | Vollständige Auflistung: {link_start}/lizenzen{link_end} | Full list: {link_start}/lizenzen{link_end} |
| `feedback_p1` | Methodik-Korrektur, Datenfehler oder Layer-Vorschlag: per Mail. | Methodology correction, data error or layer suggestion: by email. |
| `feedback_mail_subject` | Methodik-Feedback | Methodology feedback |

Hinweise:

- `meta_description`: Auch sichtbarer Untertitel unter der H1 und JSON-LD description.
- `breadcrumb_methodik`: Breadcrumb-JSON-LD, Name des Eintrags. Der Eintrag „Berlin“ bleibt unverändert.
- `map_p2`: Das DE nutzt ein ASCII-Schlusszeichen (") bei „hier gilt etwas".
- `cross_layer_p2`: Das DE nutzt ein ASCII-Schlusszeichen (") bei „schlechter".
- `cross_layer_p3`: Das DE nutzt ein ASCII-Schlusszeichen (") bei „Berlin-Score".
- `cross_layer_full_methodology`: Link-Ziel: /methodik/kiez-score
- `mss_p2`: Das DE nutzt ein ASCII-Schlusszeichen (") bei „schlechter Kiez".
- `election_full_methodology`: Link 1: /methodik/wahldaten. Link 2: /berlin-wahlen#alle-wahlen
- `cool_places_sources_link`: Link-Text. Link-Ziel: /lizenzen
- `coverage_reason_no_coverage`: Schlüssel „no-coverage“ (dt) bleibt unübersetzt (Bezeichner).
- `coverage_reason_outdated`: Schlüssel „outdated“ bleibt unübersetzt.
- `coverage_reason_seasonal`: Schlüssel „seasonal“ bleibt unübersetzt.
- `coverage_reason_out_of_scope`: Schlüssel „coverage-out-of-scope“ bleibt unübersetzt.
- `coverage_reason_out_of_concept`: Schlüssel „out-of-concept“ bleibt unübersetzt.
- `omission_single_score_reason`: DE enthält „keine eine Zahl“ (vermutlich Tippfehler), EN gibt den Sinn wieder.
- `editorial_p3`: Das DE nutzt ein ASCII-Schlusszeichen (") bei „Berlin-Score".
- `licences_full_list`: Link-Ziel: /lizenzen. Link-Text bleibt der Pfad.
- `feedback_mail_subject`: mailto-Betreff (URL-Parameter subject), nicht sichtbarer Seitentext.

## daten_tabelle

Quelle: `methodik-daten-tabelle.svelte`

| ID | DE | EN |
|---|---|---|
| `caption` | Daten-Stand-Tabelle aller aktiven Layer | Data status table of all active layers |
| `th_layer` | Layer | Layer |
| `th_bundle` | Bundle | Bundle |
| `th_updated` | Stand | Last updated |
| `th_licence` | Lizenz | Licence |

## pipeline

Quelle: `methodik-pipeline-diagram.svelte`

| ID | DE | EN |
|---|---|---|
| `figure_aria_label` | Build-Pipeline der Geo-Daten | Build pipeline for the geodata |
| `steps_aria_label` | Pipeline-Schritte | Pipeline steps |
| `stage_source_detail` | Berliner Geoportal · OSM · DWD | Berlin Geoportal · OSM · DWD |
| `figcaption` | Build-Pipeline: alle Schritte deterministisch, idempotent, im Source-Repo dokumentiert. | Build pipeline: all steps deterministic, idempotent, documented in the source repo. |

Hinweise:

- `stage_source_detail`: Nur dieses Detail ist deutsch. Alle anderen Stage-Labels und -Details (Source, fetch, reproject, simplify, hash, manifest, build, edge) sind technisch/englisch und bleiben unverändert.

## kiez_score

Quelle: `methodik/kiez-score/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Methodik des Umwelt- & Infrastruktur-Scores - Berlin in Daten - navigator.berlin | Methodology of the environment & infrastructure score - Berlin in data - navigator.berlin |
| `meta_description` | Kiez-Score-Methodik: sieben Dimensionen (fünf im Gesamt-Score, Kultur und Kriminalität separat), Normalisierung, Gewichte. Warum Sozialstruktur nicht eingerechnet wird. Berliner Daten-Atlas. | Kiez score methodology: seven dimensions (five in the overall score, culture and crime separate), normalisation, weights. Why social structure is not factored in. Berlin data atlas. |
| `og_image_alt` | navigator.berlin Kiez-Score Methodik | navigator.berlin Kiez score methodology |
| `breadcrumb_aria_label` | Brotkrumen | Breadcrumb |
| `breadcrumb_methodik` | Methodik | Methodology |
| `breadcrumb_kiez_score` | Kiez-Score | Kiez score |
| `speakable_name` | Methodik des Umwelt- & Infrastruktur-Scores | Methodology of the environment & infrastructure score |
| `h1_title` | Umwelt- & Infrastruktur-Score | Environment & infrastructure score |
| `lead` | Fünf Dimensionen pro Planungsraum, gleich gewichtet, transparent zurückverfolgbar. Der Score misst Umwelt und Infrastruktur, nicht den sozialen Status. | Five dimensions per planning area, equally weighted, transparently traceable. The score measures environment and infrastructure, not social status. |
| `toc_aria_label` | Inhalt | Contents |
| `toc_heading` | Inhalt | Contents |
| `section_worum_heading` | Worum es geht | What this is about |
| `section_dimensions_heading` | Dimensionen | Dimensions |
| `section_weights_heading` | Gewichte | Weights |
| `section_normalisation_heading` | Normalisierung | Normalisation |
| `section_kiez_score_heading` | Kiez-Score (Bezirksregion) | Kiez score (Bezirksregion) |
| `section_bezirk_score_heading` | Bezirks-Score | Bezirk score |
| `section_missing_heading` | Was fehlt und warum | What is missing and why |
| `section_sources_heading` | Datenquellen | Data sources |
| `section_editorial_heading` | Editorial-Verantwortung | Editorial responsibility |
| `section_feedback_heading` | Feedback | Feedback |
| `worum_p1` | Der Umwelt- & Infrastruktur-Score ist kein „Berlin-Ranking“. Die Karte zeigt sieben Dimensionen separat pro Planungsraum, der Inspector aggregiert sie für eine konkrete Adresse. Fünf Dimensionen bilden den Gesamt-Score, Kultur und erfasste Kriminalität stehen als eigenständige Kontext-Dimensionen daneben. Was zutrifft, steht dort. Was fehlt oder bewusst weggelassen ist, sagen wir auch. | The environment & infrastructure score is not a “Berlin ranking”. The map shows seven dimensions separately per planning area; the inspector aggregates them for a specific address. Five dimensions make up the overall score; culture and recorded crime sit alongside as standalone context dimensions. What applies is shown there. We also say what is missing or deliberately left out. |
| `worum_p2` | Aggregations-Ebene Planungsraum entspricht rund 7.500 Einwohner:innen. Wohnungs-Mikrolagen liegen darunter und tauchen im Aggregat nicht auf. | The planning area aggregation level corresponds to roughly 7,500 residents. Micro-locations of individual flats lie below that and do not appear in the aggregate. |
| `dim_ruhe_luft_label` | Ruhe & Luft | Quiet & air |
| `dim_ruhe_luft_layers` | Lärmbelastung 2023, Luftbelastung 2023 | Noise pollution 2023, Air pollution 2023 |
| `dim_ruhe_luft_detail` | Lärm- und Luftbelastung, je zur Hälfte gewichtet. Kategorisches 3-Stufen-Mapping von gering bis hoch. Bioklima zählt nicht mehr hier mit, es ist nach Grün & Hitze gewandert. | Noise and air pollution, each weighted by half. Categorical 3-level mapping from low to high. Bioclimate no longer counts here; it has moved to Green & heat. |
| `dim_gruen_hitze_label` | Grün & Hitze | Green & heat |
| `dim_gruen_hitze_layers` | Grünversorgung 2023, Grünanlagen, Thermische Belastung 2023, Gefühlte Temperatur 2022, Kaltluft-Einwirkbereich (2022), Kaltluft-Leitbahn-Korridor (2022) | Green space provision 2023, Green spaces, Thermal stress 2023, Perceived temperature 2022, Cold air influence zone (2022), Cold air flow corridor (2022) |
| `dim_gruen_hitze_detail` | Nutzbares Grün und Schutz vor Hitze. Grünversorgung 0.30, Grünanlagen-Nähe 0.15, Bioklima 0.20, PET-Hitzebelastung 0.15, Kaltluft-Einwirkbereich 0.10, Leitbahnkorridor 0.10. PET zählt invertiert: kühlere Werte geben mehr Punkte. | Usable green space and protection from heat. Green space provision 0.30, proximity to green spaces 0.15, bioclimate 0.20, PET heat stress 0.15, cold air influence zone 0.10, cold air flow corridor 0.10. PET counts inverted: cooler values give more points. |
| `dim_mobilitaet_label` | Mobilität | Mobility |
| `dim_mobilitaet_layers` | U-Bahn-, S-Bahn-, Tram-, Bus-Stops · Radverkehrsnetz, Fahrradstraßen | U-Bahn, S-Bahn, tram and bus stops · Cycling network, Bicycle streets |
| `dim_mobilitaet_detail` | Luftlinien-Distanz vom Adress-Punkt zur nächsten Haltestelle, mit 1,3-fachem Umwegfaktor. U-Bahn 0.35, S-Bahn 0.25, Tram 0.20, Bus 0.10, Radverkehrs-Presence 0.10. Bei 0 m hundert Punkte, bei 1.000 m null. Mobilität nutzt die exakte Adress-Distance, andere Dimensionen den Planungsraum-Centroid. | Straight-line distance from the address point to the nearest stop, with a detour factor of 1.3. U-Bahn 0.35, S-Bahn 0.25, tram 0.20, bus 0.10, cycling network presence 0.10. At 0 m one hundred points, at 1,000 m zero. Mobility uses the exact address distance, other dimensions the planning area centroid. |
| `dim_versorgung_label` | Versorgung | Local amenities |
| `dim_versorgung_layers` | Kindertagesstätten, Schulen, Plan-Krankenhäuser, Spielplätze, Lebensmittel, Apotheke, Post | Daycare centres, Schools, Hospitals in the Berlin hospital plan, Playgrounds, Groceries, Pharmacy, Post office |
| `dim_versorgung_detail` | Versorgung umfasst öffentliche Daseinsvorsorge und private Alltags-Nahversorgung, jeweils als Dichte im Umkreis (Anzahl Einrichtungen, weicher Übergang statt hartem Distanz-Cliff). Kita-Erreichbarkeit (0.12) plus Plätze pro Kind (0.12), Schule nach Schulart (Grundschule 0.12, weiterführend 0.12), Plan-Krankenhaus kapazitätsgewichtet (0.18), Spielplatz (0.10). Dazu Nahversorgung aus OpenStreetMap (ODbL): Lebensmittel (0.12), Apotheke (0.07), Post (0.05). Grünanlagen zählen unter Grün & Hitze. Belegungsquote, Trägerschaft und Pflege-Qualität bleiben außen vor. | Local amenities cover public services and private everyday local supply, each as density within a radius (number of facilities, soft transition instead of a hard distance cliff). Daycare accessibility (0.12) plus places per child (0.12), school by type (primary 0.12, secondary 0.12), hospital in the Berlin hospital plan weighted by capacity (0.18), playground (0.10). Plus local supply from OpenStreetMap (ODbL): groceries (0.12), pharmacy (0.07), post office (0.05). Green spaces count under Green & heat. Occupancy rate, ownership type and care quality are left out. |
| `dim_wohnschutz_label` | Wohnschutz | Tenant protection |
| `dim_wohnschutz_layers` | Milieuschutz: Erhaltungsmiete, Milieuschutz: Städtebau | Milieuschutz: rent preservation, Milieuschutz: urban planning |
| `dim_wohnschutz_detail` | Verdrängungsschutz: Liegt ein Planungsraum in einem Milieuschutzgebiet, gilt Schutz als vorhanden. Erhaltungssatzung Wohnraum oder städtebauliche Erhaltungssatzung, ODER-verknüpft. Diese Größe ist positiv eindeutig, mehr Schutz ist besser für Bewohner. Schutz-Status sagt nichts über die tatsächliche Mietentwicklung. | Protection against displacement: if a planning area lies within a Milieuschutz area, protection counts as present. Residential preservation statute or urban planning preservation statute, combined with OR. This quantity is unambiguously positive: more protection is better for residents. Protection status says nothing about actual rent development. |
| `dim_kultur_label` | Kultur (eigenständig, nicht im Gesamt-Score) | Culture (standalone, not in the overall score) |
| `dim_kultur_layers` | Museen, Galerien, Theater & Bühnen, Bibliotheken, Kinos, Soziokultur, Kunst im Stadtraum, Clubs | Museums, Galleries, Theatres & stages, Libraries, Cinemas, Community culture centres, Public art, Clubs |
| `dim_kultur_detail` | Kultureller Zugang als log-gedämpfte Dichte von Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur, Kunst im Stadtraum und Clubs im Umkreis (OpenStreetMap, ODbL). Der erste Kulturort zählt stark, weitere flachen ab, das dämpft das Innen-Außen-Gefälle. Kultur ist eine eigene, sichtbare Dimension, fließt aber NICHT in den Gesamt-Score: Kulturinfrastruktur ballt sich in der Innenstadt und würde sonst jeden Außenbezirk-Gesamt-Score drücken. Memorial-Orte (Stolpersteine, Denkmale) zählen bewusst nicht. | Cultural access as a log-dampened density of libraries, theatres, museums, cinemas, galleries, community culture centres, public art and clubs within a radius (OpenStreetMap, ODbL). The first cultural venue counts strongly, further ones flatten off, which dampens the inner-outer gradient. Culture is a separate, visible dimension but does NOT feed into the overall score: cultural infrastructure clusters in the inner city and would otherwise pull down the overall score of every outer Bezirk. Memorial sites (Stolpersteine, monuments) deliberately do not count. |
| `dim_kriminalitaet_label` | Erfasste Kriminalität (eigenständig, nicht im Gesamt-Score) | Recorded crime (standalone, not in the overall score) |
| `dim_kriminalitaet_layers` | Kiez-Score · Erfasste Kriminalität (Kriminalitätsatlas Berlin, Polizei Berlin, dl-de-by-2.0) | Kiez score · recorded crime (Kriminalitätsatlas Berlin crime atlas, Berlin Police, dl-de-by-2.0) |
| `dim_kriminalitaet_detail` | Häufigkeitszahl ausgewählter wohn-relevanter Delikte (Kieztaten, Wohnraumeinbruch, Sachbeschädigung, Straßenraub, Fahrraddiebstahl), gleichgewichtet, als 3-Jahres-Mittel 2023–2025. „Kieztaten“ ist eine Sammelkategorie der Polizei Berlin für Delikte mit engem Bezug zum Wohngebiet (u.a. Körperverletzung, Bedrohung, Raub, Sachbeschädigung an Kfz, Keller- und Wohnungseinbruch). Die Werte liegen nur je Bezirksregion vor (gröber als die fünf Planungsraum-Dimensionen) und werden auf die enthaltenen Planungsräume gespiegelt. City-Core-Orte mit Touristen- und Pendler-Verzerrung (Regierungsviertel, Alexanderplatz) werden gekappt. Eigene Kontext-Dimension in neutralem Indigo, NICHT im Gesamt-Score und KEIN Sicherheits-Ranking. Die Häufigkeitszahl misst erfasste Fälle pro Einwohner, kein persönliches Risiko: Tatortprinzip, Dunkelfeld und der Einwohner-Nenner verzerren. Kein „sicher“ oder „gefährlich“. | Frequency rate of selected housing-relevant offences (neighbourhood offences/Kieztaten, residential burglary, vandalism, street robbery, bicycle theft), equally weighted, as a 3-year mean 2023–2025. “Kieztaten” is a collective category of the Berlin Police for offences closely tied to the residential area (including bodily harm, threats, robbery, vandalism of motor vehicles, cellar and residential burglary). The values exist only per Bezirksregion (coarser than the five planning area dimensions) and are mirrored onto the planning areas they contain. City-core places with tourist and commuter distortion (government quarter, Alexanderplatz) are capped. A standalone context dimension in neutral indigo, NOT in the overall score and NOT a safety ranking. The frequency rate measures recorded cases per resident, not personal risk: the place-of-offence principle (Tatortprinzip), unreported crime and the resident denominator distort it. No “safe” or “dangerous”. |
| `weights_p1` | Persona „allgemein“ gewichtet die fünf Composite-Dimensionen gleich (je 20 Prozent). Kultur und erfasste Kriminalität sind sichtbare Kontext-Dimensionen, zählen aber nicht in den Gesamt-Score (Gewicht 0). Persona-Switcher für Familie, Single oder Senior:innen liegt in Phase 2. Eigene Slider-Gewichtung kommt ebenfalls später. | The “general” persona weights the five composite dimensions equally (20 percent each). Culture and recorded crime are visible context dimensions but do not count towards the overall score (weight 0). A persona switcher for family, single or senior users is in phase 2. Custom slider weighting also comes later. |
| `weights_th_dimension` | Dimension | Dimension |
| `weights_th_weight` | Gewicht | Weight |
| `weights_row_culture` | Kultur | Culture |
| `weights_row_crime` | Erfasste Kriminalität | Recorded crime |
| `weights_row_not_in_overall` | (nicht im Gesamt-Score) | (not in the overall score) |
| `norm_p1` | Jeder Roh-Wert wird in eine 0-bis-100-Skala übersetzt. Höher heißt günstiger. | Each raw value is translated to a 0-to-100 scale. Higher means more favourable. |
| `norm_ordinal3_term` | Ordinal-3 | Ordinal-3 |
| `norm_ordinal3_def` | gering 100, mittel 50, hoch 0 (Belastung) | low 100, medium 50, high 0 (pollution) |
| `norm_ordinal4_term` | Ordinal-4 | Ordinal-4 |
| `norm_ordinal4_def` | gering 0, mittel 33, hoch 66, sehr hoch 100 (Versorgung) | low 0, medium 33, high 66, very high 100 (local amenities) |
| `norm_pet_term` | PET invertiert | PET inverted |
| `norm_pet_def` | 29 °C oder kühler 100, 41 °C oder heißer 0, linear dazwischen | 29 °C or cooler 100, 41 °C or hotter 0, linear in between |
| `norm_distance_term` | Distance | Distance |
| `norm_distance_def` | linear: 0 m → 100, 1.000 m → 0 | linear: 0 m → 100, 1,000 m → 0 |
| `norm_presence_term` | Presence | Presence |
| `norm_presence_def` | vorhanden 100, fehlend 0 | present 100, absent 0 |
| `norm_p2` | Aus den 0-bis-100-Werten innerhalb einer Dimension wird mit den Layer-Gewichten ein gewichteter Mittelwert. Der Dimensions-Wert wird in vier UI-Stufen abgebildet: gering (0–25), mittel (26–50), hoch (51–75), sehr hoch (76–100). | The 0-to-100 values within a dimension become a weighted mean using the layer weights. The dimension value is mapped to four UI levels: low (0–25), medium (26–50), high (51–75), very high (76–100). |
| `kiez_score_p1` | Die 542 Planungsraum-Werte werden zu 143 LOR-Bezirksregionen flächen-gewichtet aggregiert. Pro Dimension wird ein gewichteter Mittelwert gebildet, wobei jeder Planungsraum mit seiner Fläche gewichtet wird. Mindestens 50 Prozent der enthaltenen Planungsräume müssen einen Wert haben, sonst bleibt die Dimension ohne Aggregat. | The 542 planning area values are aggregated to 143 LOR Bezirksregionen, weighted by area. A weighted mean is formed per dimension, with each planning area weighted by its area. At least 50 percent of the contained planning areas must have a value, otherwise the dimension stays without an aggregate. |
| `kiez_score_p2` | Der Composite-Score einer Bezirksregion entsteht als ungewichtetes Mittel der nicht-null-Werte ihrer fünf Dimensionen, parallel zur Adress-Logik. | The composite score of a Bezirksregion is the unweighted mean of the non-null values of its five dimensions, in parallel with the address logic. |
| `kiez_score_p3` | LOR-Hierarchie: die ersten sechs Zeichen einer Planungsraum-ID ergeben die Bezirksregion-ID, die ersten zwei den Bezirks-Code. Property-basiertes Mapping ohne Geometrie-Test. Falls zwei Bezirksregionen denselben Namen tragen, wird der Bezirks-Slug als Suffix angehängt (z.B. heerstrasse-spandau, heerstrasse-charlottenburg-wilmersdorf). | LOR hierarchy: the first six characters of a planning area ID give the Bezirksregion ID, the first two the Bezirk code. Property-based mapping without a geometry test. If two Bezirksregionen share the same name, the Bezirk slug is appended as a suffix (e.g. heerstrasse-spandau, heerstrasse-charlottenburg-wilmersdorf). |
| `bezirk_score_p1` | Auf Bezirks-Ebene werden die 542 Planungsräume direkt flächen-gewichtet aggregiert, nicht über die Bezirksregion-Zwischenebene. Damit bleibt das Gewicht jedes Planungsraums proportional zu seiner tatsächlichen Fläche und ist unabhängig von der LOR-Zwischengruppierung. | At Bezirk level the 542 planning areas are aggregated directly, weighted by area, not via the Bezirksregion intermediate level. This keeps the weight of each planning area proportional to its actual area and independent of the LOR intermediate grouping. |
| `bezirk_score_p2` | Seit der Score-Neuordnung sind alle Composite-Dimensionen positiv eindeutig. Deshalb zeigen wir auch einen Gesamt-Choropleth auf der Karte (Layer „Kiez-Score · Gesamt“, hoch = besser), zusätzlich zu den Einzel-Dimensionen. Kultur und erfasste Kriminalität sind eigenständige Kontext-Dimensionen und fließen nicht in den Gesamt-Score. Kriminalität und das MSS-Aggregat bleiben neutrale Kontext-Layer in neutralem Indigo, ohne Rot-Grün-Sprünge. Einen stadtweiten „Berlin-Score“ gibt es nicht. | Since the score reorganisation, all composite dimensions are unambiguously positive. That is why we also show an overall choropleth on the map (layer “Kiez score · overall”, high = better), in addition to the individual dimensions. Culture and recorded crime are standalone context dimensions and do not feed into the overall score. Crime and the MSS aggregate stay neutral context layers in neutral indigo, without red-green jumps. A city-wide “Berlin score” does not exist. |
| `bezirk_score_pipeline` | Build-Pipeline: {code_start}pnpm data:aggregate-scores{code_end} liest die Planungsraum-Quelle, baut die LOR-Hierarchie und schreibt die Aggregate idempotent in die Postgres-Tabellen {code_start}bezirk_score{code_end} und {code_start}kiez_score{code_end}. | Build pipeline: {code_start}pnpm data:aggregate-scores{code_end} reads the planning area source, builds the LOR hierarchy and writes the aggregates idempotently into the Postgres tables {code_start}bezirk_score{code_end} and {code_start}kiez_score{code_end}. |
| `missing_social_label` | Sozialstruktur | Social structure |
| `missing_social_reason` | Der soziale Status eines Kiezes ist kein Qualitäts-Kriterium. Würden wir ihn werten, schnitten Kieze mit niedrigem Status schlechter ab und würden stigmatisiert. Das MSS-Aggregat bleibt als neutraler Kontext sichtbar, fließt aber nicht in den Score. | The social status of a Kiez is not a quality criterion. If we rated it, Kieze with low status would score worse and be stigmatised. The MSS aggregate stays visible as neutral context but does not feed into the score. |
| `missing_affordability_label` | Bezahlbarkeit | Affordability |
| `missing_affordability_reason` | Kontestiert und ambivalent. Hohe Bodenrichtwerte oder gut bewertete Wohnlagen bedeuten teure Miete, nicht schlechte Wohnqualität. Belastbare Adress-Daten fehlen. Mietspiegel-Werte liefert mietspiegel.berlin.de. | Contested and ambivalent. High standard land values or highly rated residential areas mean expensive rent, not poor housing quality. Reliable address-level data is missing. Rent index values come from mietspiegel.berlin.de. |
| `missing_family_label` | Familienfreundlichkeit | Family-friendliness |
| `missing_family_reason` | Hängt stark von der Persona ab: Eltern mit Kita-Kind, Schulkind oder Pflegebedarf gewichten anders. Kita-, Schul- und Krankenhaus-Layer bleiben separat im Inspector statt in einer Composite-Dimension zu verschwinden. | Depends strongly on the persona: parents with a daycare child, a school-age child or care needs weight things differently. Daycare, school and hospital layers stay separate in the inspector instead of disappearing into a composite dimension. |
| `sources_p1` | Berliner Umweltatlas (Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt), Monitoring Soziale Stadtentwicklung (Senatsverwaltung Stadtentwicklung Berlin), Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0) und ÖPNV-Standorte aus OpenStreetMap (ODbL 1.0). Vollständige Liste mit Lizenz und Datenstand pro Layer: {link_start}/lizenzen{link_end}. | Berlin Environmental Atlas (Umweltatlas; Senate Department for Urban Mobility, Transport, Climate Action and the Environment), Monitoring Soziale Stadtentwicklung (Senate Department for Urban Development Berlin), Berlin crime atlas (Kriminalitätsatlas Berlin; Berlin Police, dl-de-by-2.0) and public transport locations from OpenStreetMap (ODbL 1.0). Full list with licence and data date per layer: {link_start}/lizenzen{link_end}. |
| `editorial_p1` | Der Score ist statistische Lage-Beschreibung, keine Wohnungsbewertung. Wir nennen keinen Mietpreis und geben keine rechtliche Auskunft. | The score is a statistical description of location, not an assessment of a flat. We state no rent price and give no legal advice. |
| `editorial_p2` | Der Score wertet keine Sozialstruktur. Ein Kiez mit niedrigem Sozialstatus lebt nicht „schlechter“. Das MSS-Aggregat zeigen wir als neutralen Kontext, nicht als Bewertung. Choropleth-Farben dafür bleiben neutral, ohne Rot-Grün-Sprünge. Einzelne Adressen können stark vom Planungsraum-Mittel abweichen. | The score does not rate social structure. A Kiez with low social status does not live “worse”. We show the MSS aggregate as neutral context, not as an assessment. Choropleth colours for it stay neutral, without red-green jumps. Individual addresses can deviate strongly from the planning area mean. |
| `feedback_p1` | Methodik-Korrektur, Datenfehler oder Layer-Vorschlag: per Mail. | Methodology correction, data error or layer suggestion: by email. |
| `feedback_mail_subject` | Kiez-Score-Methodik | Kiez score methodology |
| `back_link` | Zur Atlas-Methodik | Back to the atlas methodology |

Hinweise:

- `breadcrumb_methodik`: Sichtbarer Breadcrumb-Link und JSON-LD-Name.
- `breadcrumb_kiez_score`: Sichtbarer Breadcrumb-Text und JSON-LD-Name.
- `speakable_name`: Speakable-JSON-LD, Feld name.
- `dim_ruhe_luft_label`: Auch Tabellenzeile in „Gewichte“.
- `dim_gruen_hitze_label`: Auch Tabellenzeile in „Gewichte“.
- `dim_mobilitaet_label`: Auch Tabellenzeile in „Gewichte“.
- `dim_versorgung_label`: Auch Tabellenzeile in „Gewichte“.
- `dim_wohnschutz_label`: Auch Tabellenzeile in „Gewichte“.
- `weights_row_culture`: Zeilenlabel. Die anderen fünf Zeilen nutzen die Dimensions-Labels (dim_*_label).
- `weights_row_crime`: Zeilenlabel.
- `weights_row_not_in_overall`: Span hinter Kultur und Erfasste Kriminalität.
- `bezirk_score_p2`: Layername „Kiez score · overall“ entspricht atlas_layer_name_kiez_score_gesamt in messages/en.json.
- `bezirk_score_pipeline`: Drei <code>-Spans (font-mono text-sm). Der Inhalt zwischen {code_start} und {code_end} bleibt in beiden Sprachen unverändert.
- `sources_p1`: Link-Ziel: /lizenzen. Link-Text bleibt der Pfad. Der Satz endet mit Punkt nach dem Link.
- `feedback_mail_subject`: mailto-Betreff (URL-Parameter subject), nicht sichtbarer Seitentext.
- `back_link`: Link-Ziel: /methodik

## clt_page

Quelle: `methodik/cross-layer-templates/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Cross-Layer-Templates · Co-Design-Preview · navigator.berlin | Cross-layer templates · Co-design preview · navigator.berlin |
| `meta_description` | Render-Vorschau der Cross-Layer-Story-Templates. Co-Design-Review-Stage. | Render preview of the cross-layer story templates. Co-design review stage. |
| `breadcrumb_methodik` | Methodik | Methodology |
| `breadcrumb_stage` | · Co-Design-Stage | · Co-design stage |
| `h1_title` | Cross-Layer-Templates · Preview | Cross-layer templates · Preview |
| `intro_p1` | Render-Vorschau der {totalTemplates} Templates. Daten sind Fixtures, kein Live-Wiring auf Produktiv-Pages. Feature-Flag {code_start}crossLayerStoryBlock{code_end} bleibt OFF bis Co-Design-Sign-off. | Render preview of the {totalTemplates} templates. Data are fixtures, no live wiring to production pages. Feature flag {code_start}crossLayerStoryBlock{code_end} stays OFF until co-design sign-off. |
| `intro_p2` | Vor Roll-out auf 143 Kieze: Style-Guide in {code_start}docs/cross-layer-templates-style-guide.md{code_end} abarbeiten und {code_start}pnpm lint:cross-layer-templates{code_end} grün halten. | Before rolling out to 143 Kieze: work through the style guide in {code_start}docs/cross-layer-templates-style-guide.md{code_end} and keep {code_start}pnpm lint:cross-layer-templates{code_end} green. |
| `source_label_wahl` | Wahlbezirksstatistik | Polling district statistics |
| `source_label_mietspiegel` | Mietspiegel Wohnlagen 2024 | Rent index residential areas 2024 |
| `source_label_laerm` | Lärmkartierung 2023 | Noise mapping 2023 |
| `render_skip` | Render-Skip wegen fehlender Variablen: {missingVars} | Render skipped because of missing variables: {missingVars} |
| `editorial_note_summary` | Editorial-Note | Editorial note |
| `schema_details_summary` | Schema-Details | Schema details |
| `render_context_term` | Render-Context | Render context |
| `style_guide_label` | Style-Guide: | Style guide: |

Hinweise:

- `breadcrumb_methodik`: Link-Text. Link-Ziel: /methodik
- `breadcrumb_stage`: Text hinter dem Link im selben <p>, inkl. führendem Mittelpunkt.
- `h1_title`: Das H1 trägt lang="de". Bei EN auf lang="en" umstellen.
- `intro_p1`: {totalTemplates} = data.totalTemplates. {code_start}/{code_end} = <code>. Inhalt in beiden Sprachen unverändert.
- `intro_p2`: Zwei <code>-Spans, Inhalt unverändert.
- `source_label_wahl`: Prop sources, Feld label. Lizenzen (dl-de/by-2-0) bleiben.
- `source_label_mietspiegel`: Prop sources, Feld label.
- `source_label_laerm`: Prop sources, Feld label.
- `render_skip`: {missingVars} = preview.rendered.missingVars.join(', ')
- `editorial_note_summary`: <summary>. Der Inhalt selbst (editorialNote) bleibt unübersetzt.
- `render_context_term`: <dt>, in der Quelle uppercase per CSS.
- `style_guide_label`: Der Link-Text (Dateipfad) bleibt unverändert.

## clt_fixture

Quelle: `methodik/cross-layer-templates/+page.server.ts`

| ID | DE | EN |
|---|---|---|
| `kiez_context_label` | Kiez Friedrichshain Nord | Kiez Friedrichshain Nord |
| `kiez_name` | Friedrichshain Nord | Friedrichshain Nord |
| `kiez_wahl_typ_label` | Bundestagswahlen | Bundestag elections |
| `kiez_stimmtyp_label` | Zweitstimmen | party votes |
| `kiez_sparkline_jahre` | 2013, 2017, 2021, 2025 | 2013, 2017, 2021, 2025 |
| `kiez_sparkline_top_parteien` | Die Linke (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025) | Die Linke (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025) |
| `bezirk_context_label` | Bezirk Pankow | Bezirk Pankow |
| `bezirk_name` | Pankow | Pankow |
| `bezirk_wahl_typ_label` | Abgeordnetenhauswahl | Berlin House of Representatives (Abgeordnetenhaus) election |
| `bezirk_top_partei_label` | CDU | CDU |
| `bezirk_top_anteil_pct` | 23,1 % | 23.1% |
| `bezirk_zweite_partei_label` | Bündnis 90/Die Grünen | Bündnis 90/Die Grünen |
| `bezirk_zweite_anteil_pct` | 21,4 % | 21.4% |

Hinweise:

- `kiez_context_label`: contextLabel, DE und EN identisch (Eigenname).
- `kiez_stimmtyp_label`: Nach wahl_label_stimmtyp_zweitstimme in messages/en.json („party vote“), hier Plural wegen Satzbau.
- `kiez_sparkline_top_parteien`: Parteinamen unverändert (keine EN-Formen in messages/en.json).
- `bezirk_context_label`: contextLabel, DE und EN identisch (Eigenname).
- `bezirk_wahl_typ_label`: Nach wahl_label_typ_agh in messages/en.json.
- `bezirk_top_partei_label`: Parteiname, unverändert.
- `bezirk_zweite_partei_label`: Parteiname, unverändert.

## clt_wahl_yaml

Quelle: `src/lib/data/cross-layer-templates/wahl/wahl.de.yaml`

| ID | DE | EN |
|---|---|---|
| `wahl_trend_zeit_kiez_body` | Im Kiez {kiez_name} verteilten sich die {stimmtyp_label} bei den letzten {wahl_typ_label} wie folgt: {sparkline_jahre} mit jeweils stärkster Partei {sparkline_jahre_top_parteien}. | In the Kiez {kiez_name}, the {stimmtyp_label} were distributed as follows in the most recent {wahl_typ_label}: {sparkline_jahre}, with the strongest party in each case being {sparkline_jahre_top_parteien}. |
| `tag_wahl` | wahl | election |
| `tag_trend` | trend | trend |
| `tag_zeitreihe` | zeitreihe | time series |

Hinweise:

- `wahl_trend_zeit_kiez_body`: Template wahl-trend-zeit-kiez, Feld body_de (YAML-Folded-Scalar, hier zu einer Zeile zusammengezogen). Mustache-Platzhalter unverändert.
- `tag_wahl`: Nur Vorschau: tags werden als Chips angezeigt. Bezeichner, ggf. unübersetzt lassen.
- `tag_zeitreihe`: Nur Vorschau: Bezeichner, ggf. unübersetzt lassen.

## Abnahme

Matze 30.09.2026 08:11: abgenommen („approve continue“), DE-Fehler mitkorrigieren:
- `methodik.omission_single_score_reason`: „keine eine Zahl“ → „keine einzelne Zahl“.
- `methodik.mss_p1`: „Senatsverwaltung Berlin“ → „Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen“, EN „Senate Department for Urban Development, Building and Housing“.
Übrige „Unsicher“-Punkte bleiben wie übersetzt.
