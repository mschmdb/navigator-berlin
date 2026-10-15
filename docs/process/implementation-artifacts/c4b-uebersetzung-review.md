# Review: i18n C4b · Wahl-Methodik und Technik-Seiten (DE → EN-GB)

Quelle DE: `src/routes/(with-header)/methodik/wahldaten/+page.svelte`, `architektur/+page.svelte`, `webmcp/+page.svelte`, `src/lib/components/webmcp-diagnose.svelte`, `umwelt-infrastruktur-score/+page.svelte` und `src/lib/components/atlas/score-ranking-table.svelte`. DE-Spalte wörtlich aus dem Code (Zeilenumbrüche im Quelltext zu einem Leerzeichen zusammengezogen). Maschinenlesbar: `c4b-uebersetzung.json`.

## Übersetzungsentscheidungen

- Kürzel: `wahldaten`, `architektur`, `webmcp`, `webmcp_diagnose`, `uis` (Seite Umwelt- & Infrastruktur-Score), `uis_ranking` (`ScoreRankingTable`, nur von `uis` genutzt).
- Wahlbegriffe aus dem Wahlportal (`messages/en.json`): polling district (Stimmbezirk, Wahlbezirk), postal district, postal-vote group, polling station (Urne), House of Representatives (Abgeordnetenhaus, AGH), District Assembly (BVV), Bundestag election, repeat election, provisional, Federal Election Commissioner (Bundeswahlleiterin), Berlin State Election Commissioner (Landeswahlleiterin Berlin), Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg), „Data licence Germany, attribution, version 2.0“.
- Erste Nennung einer Behörde je Sektion mit deutschem Namen in Klammern, danach nur EN. Die Abkürzung AGH führt `quellen_agh_term` ein. BTW steht im EN ausgeschrieben.
- Bleiben deutsch: Kiez (Kieze), Bezirk (Bezirke), Bezirksregion, Milieuschutz. Planungsraum → planning area. Kiez Finder wie `shell_finder_link_title`.
- Score-Name: „Umwelt- & Infrastruktur-Score“ → „Environment & infrastructure score“ (wie `shell_meta_link_score`). Dimensionsnamen wie `atlas_dimension_label_*`.
- Sentence Case in Überschriften. Die Nummerierung („1. Datenquellen“) bleibt erhalten.
- Zahlen und Daten englisch: 20.09.2026 → „20 September 2026“, „05. bis 08.10.2026“ → „5 to 8 October 2026“, 5 × 20% bleibt.
- Platzhalter: `{link_start}`/`{link_end}` (bei mehreren Links `{link1_start}` usw.), `{code_start}`/`{code_end}` und `{strong_start}`/`{strong_end}` (für `<strong>`). Link-Ziele stehen im Feld `note` der JSON-Datei.
- Bezeichner bleiben unübersetzt: WebMCP-Tool-Namen, `document.modelContext`, Flags, Dateinamen, Befehle, Spalten- und Flag-Namen der Datenbank.
- Tool-Zeilen unter „Available tools“ sind sichtbarer Seitentext und übersetzt. Die Agenten-Beschreibungen der Tools bleiben DE (nicht Teil dieser Datei).
- Nicht aufgenommen: Einträge, die in DE und EN gleich lauten (z. B. „Hosting“, „WebMCP“, „Name“, „Bezirk“, „Score“, „{count} Kieze“, Tool-Namen, englische Linktitel), `Berlin` im Breadcrumb sowie Texte der Komponente `webmcp-diagnose`, die schon englisch sind.
- `lang="de"` am H1 von `architektur`, `webmcp` und `wahldaten` muss bei EN mit der Locale wechseln (Code, nicht Text).

## Unsicher

- **Inhaltlicher DE-Fehler `ki_p1` (architektur)**: DE nennt „Neun Tools“ und „vier Wahl-Tools“. Die Seite `webmcp` nennt elf Tools. EN übersetzt wörtlich, DE nicht korrigiert.
- **Inhaltlicher DE-Fehler `support_edge_desc`**: „Support angekündigt für März 2026“ und „Q3 2026 frühestens“ (`support_firefox_desc`) sind am 30.09.2026 veraltet. EN übersetzt wörtlich.
- **`tool_list_elections_desc`**: DE nennt „Alle 12 Berliner Wahlen seit 2011“. Die Wahldaten-Seite listet 4 Bundestags-, 5 AGH- und 5 BVV-Wahlen (14 Einträge, mit Wiederholungswahlen). Zahl ungeprüft.
- **`intro_p1` (webmcp)**: „seit August 2026 auch schreibende“ steht im Plural, die Seite nennt ein schreibendes Tool. EN übernimmt „some of them also write“.
- **Umbruchreste im DE**: „Flag- Mechanik“, „WebMCP- Tools“, „Bürger-Daten- Plattform“, „Original- Wahl“, „Wahlbezirks- Polygone“ haben ein Leerzeichen nach dem Bindestrich. DE wörtlich übernommen, im EN entfallen die Reste.
- **`quellen_agh_term`**: Die Klammer „(Abgeordnetenhaus, AGH)“ führt die Abkürzung AGH ein. Das Wahlportal in `messages/en.json` schreibt AGH nur in `methodik_election_p1` (Quellenklammer). Alternative: AGH überall ausschreiben.
- **`wiederholung_p1`**: „Berliner Verfassungsgerichtshof“ → „Berlin Constitutional Court“. Die amtliche Bezeichnung lautet „Verfassungsgerichtshof des Landes Berlin“, ein festes EN-Pendant fehlt.
- **`briefwahl_p1`**: „Briefwahlbezirke“ → „postal districts“ und „Urnenwahlbezirke“ → „in-person polling districts“ folgen `messages/en.json`. „in-person“ fehlt dort als Bezirksbegriff, nur „in-person votes“.
- **`cross_layer_p1`**: „Mietspiegel-Wohnlage“ → „rent index residential area“ (wie `atlas_layer_name_wohnlagen_2024`). „Mietspiegel-Soziale-Stufe“ → „rent index social level“ ist eine eigene Wortwahl. „Wahl-Verlauf-Block“ → „election trend block“ ohne Vorbild in `messages/en.json`.
- **`crime_note`**: „Häufigkeitszahl“ → „frequency rate“ (üblich: crime rate per 100,000 residents, im DE ohne Bezugsgröße). „Gut-Maß“ → „measure of quality“ ist sinngemäß.
- **`disclaimer` (uis)**: „Was sich gut anfühlt, bemisst sich an persönlichen Prioritäten“ → „What feels good depends on personal priorities“. Sinn übernommen, Wortlaut frei.
- **`intro_p1` (webmcp_diagnose)**: Das DE enthält den Nachsatz „English: live check …“. Im EN entfällt die Sprachmarkierung. Falls die Seite den Satz als Doppelung entfernen soll, entscheidet Matze.
- **`cutoff_li_volksentscheid`**: „Volksentscheide“ → „Referendums“. „Popular votes“ wäre eine Alternative.
- **Quotes im DE**: `alias_p1` und `canary_step2` nutzen ASCII-Schlusszeichen („Sonstige"), `briefwahl_p2` und `cadence_p2` typografische. EN nutzt durchgehend “…”.
- **Sortierung `uis_ranking`**: `Intl.Collator('de-DE')` sortiert Namen. Bei EN Locale anpassen (Code, nicht Text).

## wahldaten

Quelle: `src/routes/(with-header)/methodik/wahldaten/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Methodik · Wahldaten · navigator.berlin | Methodology · Election data · navigator.berlin |
| `meta_description` | Wahldaten-Methodik: Quellen, Daten-Cutoff, Briefwahl, Stimmbezirks-zu-Kiez-Aggregation und Wiederholungswahlen im Berliner Daten-Atlas. | Election data methodology: sources, data cutoff, postal voting, polling district to Kiez aggregation and repeat elections in the Berlin data atlas. |
| `breadcrumb_methodik` | Methodik | Methodology |
| `breadcrumb_wahldaten` | Wahldaten | Election data |
| `h1_title` | Methodik · Wahldaten | Methodology · Election data |
| `intro_p1` | Diese Seite dokumentiert Datenquellen, Aggregations-Strategie und bekannte Coverage-Lücken der Wahl-Daten. Werte beschreiben Stimmenanteile, keine Bewertung. | This page documents the data sources, aggregation strategy and known coverage gaps of the election data. Values describe vote shares, not an assessment. |
| `toc_aria_label` | Inhalt | Contents |
| `toc_heading` | Inhalt | Contents |
| `section_quellen_heading` | 1. Datenquellen | 1. Data sources |
| `section_cutoff_heading` | 2. Daten-Cutoff | 2. Data cutoff |
| `section_briefwahl_heading` | 3. Briefwahl-Gruppen | 3. Postal-vote groups |
| `section_aggregation_heading` | 4. Stimmbezirks-zu-Kiez-Aggregation | 4. Polling district to Kiez aggregation |
| `section_wiederholung_heading` | 5. Wiederholungswahl 2023 | 5. Repeat election 2023 |
| `section_geometrien_heading` | 6. Geometrien + Coverage | 6. Geometries + coverage |
| `section_cadence_heading` | 7. Update-Cadence | 7. Update cadence |
| `section_alias_heading` | 8. Parteien-Aliase | 8. Party aliases |
| `section_cross_layer_heading` | 9. Cross-Layer-Verknüpfung | 9. Cross-layer linking |
| `quellen_btw_term` | Bundestagswahlen | Bundestag elections |
| `quellen_btw_desc` | Bundeswahlleiterin Wahlbezirksstatistik ({code_start}_wbz.zip{code_end}). Direkt-Bezug pro Wahl-Jahr von {link_start}bundeswahlleiterin.de{link_end}. Lizenz Datenlizenz Deutschland Namensnennung 2.0. | Federal Election Commissioner (Bundeswahlleiterin) polling district statistics ({code_start}_wbz.zip{code_end}). Obtained directly for each election year from {link_start}bundeswahlleiterin.de{link_end}. Licence: Data licence Germany, attribution, version 2.0. |
| `quellen_agh_term` | Abgeordnetenhaus + BVV | House of Representatives (Abgeordnetenhaus, AGH) + District Assembly (BVV) |
| `quellen_agh_desc` | Amt für Statistik Berlin-Brandenburg, XLSX-Sheet-Pipeline ({code_start}DL_BE_*.xlsx{code_end}). Bezug von {link1_start}statistik-berlin-brandenburg.de{link1_end}. Lizenz Datenlizenz Deutschland Namensnennung 2.0. AGH und BVV 2026 kommen direkt von {link2_start}wahlen-berlin.de{link2_end} (Landeswahlleiterin Berlin), Stand des vorläufigen amtlichen Ergebnisses. | Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg), XLSX sheet pipeline ({code_start}DL_BE_*.xlsx{code_end}). Obtained from {link1_start}statistik-berlin-brandenburg.de{link1_end}. Licence: Data licence Germany, attribution, version 2.0. AGH and BVV 2026 come directly from {link2_start}wahlen-berlin.de{link2_end} (Berlin State Election Commissioner, Landeswahlleiterin Berlin), as of the provisional official result. |
| `quellen_geometrien_term` | Stimmbezirks-Geometrien | Polling district geometries |
| `quellen_geometrien_desc` | Amt für Statistik Berlin-Brandenburg, Shapefile-Releases pro Wahlgang: {code_start}RBS_OD_Wahlgebiete_BTW17.zip{code_end}, {code_start}RBS_OD_UWB_AH21.zip{code_end}, {code_start}RBS_OD_UWB_AH26.zip{code_end} (Stimmbezirks-Geometrie AGH/BVV 2026) u. a. Reprojektion von ETRS89 UTM33 nach WGS84 via mapshaper-Pipeline, Simplify visvalingam + keep-shapes. | Statistics Office Berlin-Brandenburg, shapefile releases per election: {code_start}RBS_OD_Wahlgebiete_BTW17.zip{code_end}, {code_start}RBS_OD_UWB_AH21.zip{code_end}, {code_start}RBS_OD_UWB_AH26.zip{code_end} (polling district geometry AGH/BVV 2026) and others. Reprojection from ETRS89 UTM33 to WGS84 via mapshaper pipeline, simplify visvalingam + keep-shapes. |
| `cutoff_p1` | Die Wahldaten decken Wahlen ab 2011 ab. Pre-2011-Daten liegen bei der Bundeswahlleiterin teilweise in unterschiedlichen Formaten vor und erfordern Mapping zur Bezirksreform 2001. Bundestagswahlen beginnen 2013, weil die Bundeswahlleiterin Wahlbezirksdaten erst ab diesem Jahr veröffentlicht. | The election data cover elections from 2011. Pre-2011 data from the Federal Election Commissioner are partly available in different formats and require mapping to the 2001 Bezirk reform. Bundestag elections begin in 2013 because the Federal Election Commissioner publishes polling district data only from that year. |
| `cutoff_li_btw` | {strong_start}Bundestagswahlen:{strong_end} 2013, 2017, 2021, 2025 | {strong_start}Bundestag elections:{strong_end} 2013, 2017, 2021, 2025 |
| `cutoff_li_agh` | {strong_start}Abgeordnetenhauswahlen:{strong_end} 2011, 2016, 2021, 2023 (Wiederholung), 2026 (vorläufig) | {strong_start}House of Representatives elections:{strong_end} 2011, 2016, 2021, 2023 (repeat), 2026 (provisional) |
| `cutoff_li_bvv` | {strong_start}Bezirksverordneten-Versammlungen:{strong_end} 2011, 2016, 2021, 2023 (Wiederholung), 2026 (vorläufig) | {strong_start}District Assembly (BVV) elections:{strong_end} 2011, 2016, 2021, 2023 (repeat), 2026 (provisional) |
| `cutoff_li_europa` | {strong_start}Europawahlen:{strong_end} aktuell nicht enthalten | {strong_start}European elections:{strong_end} currently not included |
| `cutoff_li_volksentscheid` | {strong_start}Volksentscheide:{strong_end} nicht enthalten | {strong_start}Referendums:{strong_end} not included |
| `briefwahl_p1` | Berlin zählt Briefstimmen in eigenen Briefwahlbezirken ohne eigene Fläche, getrennt von den Urnenwahlbezirken. Bezirk und Berlin gesamt enthalten immer alle Stimmen, weil sie über alle Stimmbezirke summieren. | Berlin counts postal votes in separate postal districts that have no area of their own, apart from the in-person polling districts. Bezirk and Berlin overall always include all votes because they sum over all polling districts. |
| `briefwahl_p2` | Auf der Karte ist deshalb die Briefwahl-Gruppe die kleinste Ebene: alle Urnenwahlbezirke eines Briefwahlbezirks plus dieser Briefwahlbezirk bilden zusammen eine Fläche (Dissolve der Urnen-Polygone), analog zur Tagesspiegel-Darstellung „Stimmbezirke 726, 727 und 7P“. Das gilt für alle Wahlen mit Stimmbezirks-Geometrie. | On the map, the postal-vote group is therefore the smallest level: all in-person polling districts of a postal district plus that postal district together form one area (dissolve of the in-person polygons), analogous to the Tagesspiegel presentation “Stimmbezirke 726, 727 und 7P”. This applies to all elections with polling district geometry. |
| `briefwahl_p3` | Im Kiez-Aggregat ist die Briefwahl eine anteilige Schätzung nach Wahlberechtigten, siehe {link1_start}Abschnitt 4{link1_end}. Wahlen ohne Stimmbezirks-Geometrie zeigt die Karte nur auf Bezirks- und Berlin-Ebene, siehe {link2_start}Abschnitt 6{link2_end}. | In the Kiez aggregate, postal voting is a proportional estimate by eligible voters, see {link1_start}section 4{link1_end}. For elections without polling district geometry, the map shows only Bezirk and Berlin level, see {link2_start}section 6{link2_end}. |
| `aggregation_p1` | Stimmbezirks-Werte werden räumlich auf vier Ebenen aggregiert: Stimmbezirk, Kiez (LOR-Bezirksregion), Bezirk (12) und Berlin gesamt. | Polling district values are aggregated spatially at four levels: polling district, Kiez (LOR Bezirksregion), Bezirk (12) and Berlin overall. |
| `aggregation_p2` | Für die Kiez-Ebene wird pro Stimmbezirk der Polygon-Centroid berechnet (via turf-center) und in die enthaltene LOR-Bezirksregion gemappt (booleanPointInPolygon). Stimmbezirke außerhalb aller LOR-Polygone bleiben ungemappt und fließen nur in Bezirk + Berlin ein. Die SQL-Aggregation summiert pro Kiez und Partei aus den Roh-Stimmbezirks-Rows (siehe scripts/build-wahl-kiez-aggregat.ts). | For the Kiez level, the polygon centroid is calculated for each polling district (via turf-center) and mapped to the LOR Bezirksregion that contains it (booleanPointInPolygon). Polling districts outside all LOR polygons stay unmapped and flow only into Bezirk + Berlin. The SQL aggregation sums per Kiez and party from the raw polling district rows (see scripts/build-wahl-kiez-aggregat.ts). |
| `aggregation_p3` | Briefstimmen fließen anteilig ein: Jede Urne einer Briefwahl-Gruppe erhält einen Anteil an deren Briefstimmen ({code_start}ist_briefwahl_aggregat = true{code_end}) nach ihren Wahlberechtigten. Das ist eine Schätzung, keine amtliche Aufteilung. Fehlen die Wahlberechtigten für eine oder mehrere Urnen einer Gruppe, verteilt sich die Briefwahl gleichmäßig auf die Urnen der Gruppe. | Postal votes flow in proportionally: each polling station of a postal-vote group receives a share of the group's postal votes ({code_start}ist_briefwahl_aggregat = true{code_end}) according to its eligible voters. This is an estimate, not an official split. If the eligible voters are missing for one or more polling stations of a group, the postal votes are distributed evenly across the group's polling stations. |
| `wiederholung_p1` | AGH 2021 + BVV 2021 wurden vom Berliner Verfassungsgerichtshof teilweise für ungültig erklärt. AGH 2023 und BVV 2023 sind die jeweiligen Wiederholungswahlen. In der Datenbank tragen sie das Flag {code_start}is_repeat_election{code_end} mit Verweis auf die jeweilige Original-Wahl über {code_start}parent_election_id{code_end}. | The Berlin Constitutional Court declared AGH 2021 + BVV 2021 partly invalid. AGH 2023 and BVV 2023 are the respective repeat elections. In the database they carry the flag {code_start}is_repeat_election{code_end} and refer to the respective original election via {code_start}parent_election_id{code_end}. |
| `wiederholung_p2` | Die Wahlbezirks-Geometrie der Wiederholungswahl ist identisch zur Original- Wahl von Sept 2021. Die separate SBB-Quelle {code_start}RBS_OD_Wahllokale_AH23.zip{code_end} enthält ausschließlich Wahllokal-Standorte (Punkte), nicht Wahlbezirks- Polygone; deshalb mappt navigator.berlin AGH 2023 und BVV 2023 für Choropleth + Kiez-Aggregation auf den Polygon-Layer {code_start}ah21{code_end}. | The polling district geometry of the repeat election is identical to the original election of September 2021. The separate SBB source {code_start}RBS_OD_Wahllokale_AH23.zip{code_end} contains only polling station locations (points), not polling district polygons. That is why navigator.berlin maps AGH 2023 and BVV 2023 to the polygon layer {code_start}ah21{code_end} for the choropleth + Kiez aggregation. |
| `geometrien_p1` | Stimmbezirks-Polygone sind verfügbar für: BTW 2017, 2021, 2025 sowie AGH + BVV 2016, 2021 (verwendet auch für 2023-Wiederholung) und 2026. BTW 2013 sowie AGH + BVV 2011 besitzen keine publizierten Stimmbezirks-Geometrien. Diese Wahlen sind ausschließlich auf Bezirks- und Berlin-Aggregat zugänglich; das Kiez-Aggregat ist für sie leer und die Choropleth-Komponente fällt auf 12 Bezirks-Polygone zurück mit einem Inline-Hinweis. | Polling district polygons are available for: Bundestag 2017, 2021, 2025 as well as AGH + BVV 2016, 2021 (also used for the 2023 repeat election) and 2026. Bundestag 2013 as well as AGH + BVV 2011 have no published polling district geometries. These elections are accessible only at Bezirk and Berlin aggregate level. The Kiez aggregate is empty for them, and the choropleth component falls back to 12 Bezirk polygons with an inline note. |
| `geometrien_p2` | Reprojektion: ETRS89 UTM33 → WGS84 via mapshaper Node-API, Simplify visvalingam + {code_start}keep-shapes{code_end} damit Sliver-Polygone den Simplify-Schritt überleben. | Reprojection: ETRS89 UTM33 → WGS84 via mapshaper Node API, simplify visvalingam + {code_start}keep-shapes{code_end} so that sliver polygons survive the simplify step. |
| `cadence_p1` | Wahldaten werden manuell nach jedem Wahlgang aktualisiert. Es gibt keinen Live-Refresh aus den Quell-APIs, weil die amtlichen Endergebnisse erst Wochen nach dem Wahltag vorliegen und die Bundeswahlleiterin / Landeswahlleiterin Berlin ihre Datensätze nicht über eine stabile API ausspielen. | Election data are updated manually after each election. There is no live refresh from the source APIs, because the official final results only become available weeks after election day, and the Federal Election Commissioner and the Berlin State Election Commissioner do not publish their datasets through a stable API. |
| `cadence_p2` | AGH und BVV 2026 zeigen das vorläufige amtliche Ergebnis vom Wahltag, dem 20.09.2026. Datenstand ist der 21.09.2026. Quelle ist wahlen-berlin.de (Landeswahlleiterin Berlin). Portal, Wahl-Detailseiten und API-/Tool-Antworten markieren die Zahlen als „vorläufig“ und zeigen ein Stand-Datum, wo verfügbar. Das Endergebnis erscheint voraussichtlich ab dem 30.09.2026 (BVV) und vom 05. bis 08.10.2026 (AGH). Beim Endergebnis ersetzt ein erneuter Datenimport die vorläufigen Zahlen. Die Kennzeichnung entfällt. | AGH and BVV 2026 show the provisional official result from election day, 20 September 2026. The data is as of 21 September 2026. The source is wahlen-berlin.de (Berlin State Election Commissioner). The portal, election detail pages and API/tool responses mark the figures as “provisional” and show an as-of date where available. The final result is expected from 30 September 2026 (BVV) and from 5 to 8 October 2026 (AGH). When the final result arrives, a new data import replaces the provisional figures. The label then disappears. |
| `cadence_p3` | Die Build-Pipeline lädt und parsed die Roh-Daten, baut die Stimmbezirks-Layer neu und aktualisiert das Kiez-Aggregat. Ein Lint-Gate blockt Wertungsvokabel in Code und Doku. | The build pipeline downloads and parses the raw data, rebuilds the polling district layers and updates the Kiez aggregate. A lint gate blocks evaluative vocabulary in code and docs. |
| `alias_p1` | Parteien-Namen variieren über die Jahre (PDS → Die Linke, GRÜNE in Schreibvarianten). Eine case-insensitive Alias-Tabelle in {code_start}scripts/wahlen/lib/partei-seed.ts{code_end} resolvt Quell-Spalten zu kanonischen {code_start}kurzname{code_end}-Werten. Nicht-aufgelöste Eintragungen landen unter „Sonstige" und werden im Inspector nicht in Top-N geführt. | Party names vary over the years (PDS → Die Linke, GRÜNE in spelling variants). A case-insensitive alias table in {code_start}scripts/wahlen/lib/partei-seed.ts{code_end} resolves source columns to canonical {code_start}kurzname{code_end} values. Unresolved entries end up under “Other” and are not listed in the inspector's top N. |
| `cross_layer_p1` | Wahl-Daten werden in Kiez-Pages (siehe Wahl-Verlauf-Block) und im Adress-Inspector mit anderen Layern (Mietspiegel-Wohnlage, Lärmkartierung, Mietspiegel-Soziale-Stufe, Kiez-Score) nebeneinander angezeigt, ohne kausale Verknüpfung oder wertendes Framing. Editorial-Richtlinien dazu im {link_start}Cross-Layer-Templates-Preview{link_end} (noindex, Co-Design-Stage). | Election data appear on Kiez pages (see election trend block) and in the address inspector next to other layers (rent index residential area, noise mapping, rent index social level, Kiez score), without causal linking or evaluative framing. Editorial guidelines for this are in the {link_start}cross-layer templates preview{link_end} (noindex, co-design stage). |
| `link_alle_wahlen` | Alle Wahlen einzeln | All elections individually |

## architektur

Quelle: `src/routes/(with-header)/architektur/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Architektur - Berlin in Daten - navigator.berlin | Architecture - Berlin in data - navigator.berlin |
| `meta_description` | navigator.berlin läuft auf einem Open-Source-Stack: Hosting in Deutschland, keine US-Cloud-Anbieter, kein Tracking. | navigator.berlin runs on an open-source stack: hosting in Germany, no US cloud providers, no tracking. |
| `og_image_alt` | navigator.berlin Architektur | navigator.berlin architecture |
| `breadcrumb_architektur` | Architektur | Architecture |
| `h1_title` | Architektur | Architecture |
| `intro_p1` | Open-Source-Stack, gehostet in Deutschland. Kein US-Cloud-Anbieter, kein Tracking, kein Cookie-Banner. | Open-source stack, hosted in Germany. No US cloud provider, no tracking, no cookie banner. |
| `hosting_p1` | Server in Deutschland bei einem europäischen Anbieter. Domain ebenfalls bei einem deutschen Registrar. | Server in Germany with a European provider. Domain also with a German registrar. |
| `anwendung_heading` | Anwendung | Application |
| `anwendung_li_svelte` | {link1_start}Svelte{link1_end} mit {link2_start}SvelteKit{link2_end} (Server-Side-Rendering, Prerender-first) | {link1_start}Svelte{link1_end} with {link2_start}SvelteKit{link2_end} (server-side rendering, prerender-first) |
| `anwendung_li_karte` | Karte: {link1_start}MapLibre GL{link1_end} + {link2_start}OpenFreeMap{link2_end} (Open Source, basiert auf OpenStreetMap) | Map: {link1_start}MapLibre GL{link1_end} + {link2_start}OpenFreeMap{link2_end} (open source, based on OpenStreetMap) |
| `anwendung_li_styling` | Styling: Tailwind CSS, IBM Plex Font-Familie (OFL-Lizenz) | Styling: Tailwind CSS, IBM Plex font family (OFL licence) |
| `quellen_heading` | Daten-Quellen | Data sources |
| `quellen_li_statistik` | Amt für Statistik Berlin-Brandenburg (auch Wahl-Daten AGH und BVV) | Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg), also the source of election data for the House of Representatives (Abgeordnetenhaus) and the District Assembly (BVV) |
| `quellen_li_bundeswahlleiterin` | {link_start}Bundeswahlleiterin{link_end} (Bundestagswahl-Daten) | {link_start}Federal Election Commissioner (Bundeswahlleiterin){link_end}, Bundestag election data |
| `quellen_li_dwd` | Deutscher Wetterdienst (DWD) | German Meteorological Service (DWD) |
| `quellen_p1` | Quelle, Lizenz und Stand-Datum pro Layer in der {link1_start}Methodik{link1_end} und auf der {link2_start}Lizenzen-Seite{link2_end}. | Source, licence and as-of date per layer in the {link1_start}methodology{link1_end} and on the {link2_start}licences page{link2_end}. |
| `ki_heading` | Schnittstelle für KI-Assistenten (alpha) | Interface for AI assistants (alpha) |
| `ki_p1` | Neun Tools für strukturierte Abfragen statt HTML-Scraping: Adress-Suche, Punkt-Abfrage, Layer-Discovery, Kiez-Profil, Layer-Metadaten plus vier Wahl-Tools (Wahlen auflisten, Ergebnis pro Adresse + Aggregations-Ebene, Wahl-Vergleich, Stimmbezirks-Geometrie). Antwort enthält jeweils Quelle, Lizenz und Stand-Datum. | Nine tools for structured queries instead of HTML scraping: address search, point query, layer discovery, Kiez profile, layer metadata plus four election tools (list elections, result per address + aggregation level, election comparison, polling district geometry). Each response contains source, licence and as-of date. |
| `ki_p2` | {link_start}WebMCP{link_end} ist ein W3C-Community-Group-Draft seit August 2025: eine browser-native JavaScript-API für Websites, die Tools an LLMs ausliefern. Noch keine Recommendation, Spec in Bewegung. | {link_start}WebMCP{link_end} has been a W3C Community Group draft since August 2025: a browser-native JavaScript API for websites that deliver tools to LLMs. Not yet a Recommendation, and the spec is still changing. |
| `ki_p3` | Bis WebMCP browser-nativ in den Stable-Releases ankommt, läuft die API über einen Polyfill, der von LLM-Browser-Extensions oder beim Mount geladen wird. | Until WebMCP arrives natively in stable browser releases, the API runs through a polyfill that LLM browser extensions or the mount step load. |
| `ki_p4` | Manifest-Discovery (Convention, nicht Standard): {link1_start}/.well-known/webmcp.json{link1_end} (spiegelt {link2_start}/webmcp-manifest.json{link2_end}). Klartext-Variante: {link3_start}/llms.txt{link3_end} / {link4_start}/llms-full.txt{link4_end} nach {link5_start}llmstxt.org{link5_end}. | Manifest discovery (convention, not standard): {link1_start}/.well-known/webmcp.json{link1_end} (mirrors {link2_start}/webmcp-manifest.json{link2_end}). Plain-text variant: {link3_start}/llms.txt{link3_end} / {link4_start}/llms-full.txt{link4_end} following {link5_start}llmstxt.org{link5_end}. |
| `ki_p5` | Spec-Status, Browser-Support und Anleitung für Chrome Canary: {link_start}/webmcp{link_end}. | Spec status, browser support and instructions for Chrome Canary: {link_start}/webmcp{link_end}. |
| `nicht_verwendet_heading` | Nicht verwendet | Not used |
| `nicht_verwendet_li_tracker` | Google Analytics, Facebook Pixel, Werbe-Netzwerke | Google Analytics, Facebook Pixel, advertising networks |
| `nicht_verwendet_li_embeds` | Drittanbieter-Embeds | Third-party embeds |
| `nicht_verwendet_li_cookies` | Tracking-Cookies, Cookie-Banner | Tracking cookies, cookie banners |
| `nicht_verwendet_li_accounts` | User-Accounts, Login, Newsletter-Sammlung | User accounts, login, newsletter collection |

## webmcp

Quelle: `src/routes/(with-header)/webmcp/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | WebMCP - Schnittstelle für KI-Assistenten - navigator.berlin | WebMCP - Interface for AI assistants - navigator.berlin |
| `meta_description` | WebMCP-Tools von navigator.berlin: Berliner Daten an LLM-Agenten ausliefern. Spec-Status, Browser-Support, Tool-Aufrufe. | navigator.berlin WebMCP tools: delivering Berlin data to LLM agents. Spec status, browser support, tool calls. |
| `intro_p1` | WebMCP ist eine Browser-API, mit der Websites strukturierte Tools an KI-Agenten ausliefern können. Statt HTML zu scrapen, fragt der Agent eine Adresse oder einen Datensatz direkt ab und bekommt Zahl, Quelle und Lizenz zurück. navigator.berlin liefert seit Mai 2026 solche Tools aus, inzwischen elf, seit August 2026 auch schreibende: Ein Agent kann den Kiez-Finder bedienen, den ein Mensch vor sich sieht. | WebMCP is a browser API that lets websites deliver structured tools to AI agents. Instead of scraping HTML, the agent queries an address or a dataset directly and gets the number, source and licence back. navigator.berlin has delivered such tools since May 2026, now eleven of them. Since August 2026 some of them also write: an agent can operate the Kiez Finder that a person sees in front of them. |
| `spec_heading` | Status der Spec | Spec status |
| `spec_p1` | WebMCP ist ein {link_start}W3C-Community-Group-Draft{link_end}, gemeinsam von Microsoft und Google entwickelt, gehostet in der Web Machine Learning Community Group. Laufend aktualisiert, Stand August 2026; die API-Surface ist inzwischen von {code_start}navigator.modelContext{code_end} zu {code_start}document.modelContext{code_end} umgezogen. Ausdrücklich nicht auf dem W3C-Standards-Track. Das heißt: interessierte Parteien haben sich auf einen Entwurf geeinigt, aber noch ist kein Commitment, daraus eine offizielle Web-Plattform-API zu machen. | WebMCP is a {link_start}W3C Community Group draft{link_end}, developed jointly by Microsoft and Google and hosted in the Web Machine Learning Community Group. It is updated continuously, status as of August 2026. The API surface has since moved from {code_start}navigator.modelContext{code_end} to {code_start}document.modelContext{code_end}. It is explicitly not on the W3C standards track. That means interested parties have agreed on a draft, but there is no commitment yet to turn it into an official web platform API. |
| `spec_p2` | Spec-URL: {link_start}github.com/webmachinelearning/webmcp{link_end}. | Spec URL: {link_start}github.com/webmachinelearning/webmcp{link_end}. |
| `support_heading` | Browser-Support | Browser support |
| `support_chrome_desc` | Native Implementation auf {code_start}document.modelContext{code_end} (erste Fassung ab Canary 146 noch auf navigator). Aktivierung über Flag {code_start}chrome://flags/#enable-webmcp-testing{code_end} plus Neustart. | Native implementation on {code_start}document.modelContext{code_end} (first version from Canary 146 still on navigator). Enabled via the flag {code_start}chrome://flags/#enable-webmcp-testing{code_end} plus a restart. |
| `support_chatgpt_term` | ChatGPT-Desktop-App | ChatGPT desktop app |
| `support_chatgpt_desc` | Der eingebaute Browser stellt {code_start}document.modelContext{code_end} nativ bereit; Tool-Aufrufe setzen ein Runtime-Modell mit Site-Tools-Support voraus (GPT-5.6 Sol oder Terra) und die Freigabe unter Settings → Browser → Permissions. | The built-in browser provides {code_start}document.modelContext{code_end} natively. Tool calls require a runtime model with site tools support (GPT-5.6 Sol or Terra) and approval under Settings → Browser → Permissions. |
| `support_edge_desc` | Support angekündigt für März 2026. Vermutlich gleiche Flag- Mechanik wie Chrome. | Support announced for March 2026. Probably the same flag mechanism as Chrome. |
| `support_firefox_term` | Firefox und Safari | Firefox and Safari |
| `support_firefox_desc` | In Spec-Diskussion, kein Release-Datum. Realistische Schätzung: Q3 2026 frühestens. | Under discussion in the spec process, no release date. Realistic estimate: Q3 2026 at the earliest. |
| `support_polyfill_desc` | Für Browser ohne native Implementation laden LLM-Browser-Extensions oft einen Polyfill, der die API nachreicht. navigator.berlin prüft {code_start}document.modelContext{code_end} zuerst und fällt auf {code_start}navigator.modelContext{code_end} plus Polyfill zurück. So funktionieren die Tools auch in Chrome Stable, Firefox oder Safari, sofern der Agent diesen Weg fährt. | For browsers without a native implementation, LLM browser extensions often load a polyfill that supplies the API. navigator.berlin checks {code_start}document.modelContext{code_end} first and falls back to {code_start}navigator.modelContext{code_end} plus polyfill. This way the tools also work in Chrome Stable, Firefox or Safari, provided the agent takes this route. |
| `rationale_heading` | Begründung für frühen Einsatz | Reasons for early adoption |
| `rationale_lead` | Die Spec ist Draft und der Browser-Support frisch. Wir liefern WebMCP- Tools trotzdem aus, weil: | The spec is a draft and browser support is new. We ship WebMCP tools anyway, because: |
| `rationale_li_discovery` | Strukturierte Tool-Discovery ist die richtige Richtung. HTML-Scraping durch LLMs erzeugt schlechte Antworten und unnötigen Traffic. Eine deklarative Schnittstelle mit Quelle und Lizenz pro Antwort ist eine ehrliche Datenausgabe. | Structured tool discovery is the right direction. HTML scraping by LLMs produces poor answers and unnecessary traffic. A declarative interface with source and licence per answer is an honest way to publish data. |
| `rationale_li_standards` | Standards entstehen, wenn früh Sites mitmachen. Eine Bürger-Daten- Plattform sollte solche Open-Web-Initiativen unterstützen, nicht nur kommerzielle. | Standards emerge when sites join early. A civic data platform should support such open web initiatives, not only commercial ones. |
| `rationale_li_effort` | Der Aufwand ist gering. Die Tools sind Wrapper um Funktionen, die ohnehin existieren (Adress-Lookup, Layer-Abfrage, Wahl-Daten). Spec-Änderungen wirken sich nur auf eine Adapter-Datei aus. | The effort is small. The tools are wrappers around functions that already exist (address lookup, layer query, election data). Spec changes affect only one adapter file. |
| `rationale_li_risk` | Bricht die Spec, fällt eine Subseite aus. Die Hauptseite bleibt bedienbar. Damit ist das Risiko eingegrenzt. | If the spec breaks, one subpage fails. The main site stays usable. That limits the risk. |
| `tools_heading` | Verfügbare Tools | Available tools |
| `tools_p1` | Aktuell sind elf Tools registriert, zehn lesende und ein schreibendes. Volltext-Manifest mit JSON-Schemas pro Tool unter {link_start}/webmcp-manifest.json{link_end}. | Currently eleven tools are registered, ten reading and one writing. Full-text manifest with JSON schemas per tool at {link_start}/webmcp-manifest.json{link_end}. |
| `tool_address_lookup_desc` | Berliner Adressen, Straßen und POIs suchen. | Search Berlin addresses, streets and POIs. |
| `tool_cross_layer_query_desc` | Alle Daten-Layer an einer Koordinate abfragen, mit Quelle pro Wert. | Query all data layers at a coordinate, with the source for each value. |
| `tool_list_layers_at_point_desc` | Welche Layer decken den Punkt ab? Schlanker Vorab-Check. | Which layers cover the point? A lean pre-check. |
| `tool_get_kiez_profile_desc` | Profil einer LOR-Bezirksregion: Name, Bezirk, Einwohner, Fläche. | Profile of a LOR Bezirksregion: name, Bezirk, residents, area. |
| `tool_get_layer_metadata_desc` | Quelle, Lizenz, Stand-Datum und Methodik eines Daten-Layers. | Source, licence, as-of date and methodology of a data layer. |
| `tool_list_elections_desc` | Alle 12 Berliner Wahlen seit 2011 auflisten. | List all 12 Berlin elections since 2011. |
| `tool_get_election_result_desc` | Ergebnis an einer Adresse für eine bestimmte Wahl, auf wählbarer Ebene (Stimmbezirk, Kiez, Bezirk, Berlin). | Result at an address for a given election, at a selectable level (polling district, Kiez, Bezirk, Berlin). |
| `tool_compare_elections_desc` | Mehrere Wahlen am selben Ort vergleichen, Sparkline-tauglich. | Compare several elections at the same place, sparkline-ready. |
| `tool_get_voting_district_geometry_desc` | GeoJSON-Polygon zu einer Stimmbezirks-ID liefern. | Return the GeoJSON polygon for a polling district ID. |
| `tool_set_finder_weights_desc` | Schreibend: Der Agent stellt die Kiez-Finder-Regler, die Karte vor den Augen des Menschen färbt sich live um. | Writing: the agent sets the Kiez Finder sliders, and the map recolours live before the person's eyes. |
| `tool_get_finder_state_desc` | Rückkanal: Gewichte, letzte Änderungsquelle (Mensch oder Agent) und Top-Kieze lesen. | Back channel: read the weights, the last source of change (person or agent) and the top Kieze. |
| `canary_heading` | Einsatz in Chrome Canary | Using it in Chrome Canary |
| `canary_step1` | {link_start}Chrome Canary{link_end} ab Version 149 installieren (oder Chrome Stable 149+). | Install {link_start}Chrome Canary{link_end} version 149 or later (or Chrome Stable 149+). |
| `canary_step2` | {code_start}chrome://flags/#enable-webmcp-testing{code_end} öffnen, „WebMCP for testing" auf „Enabled" setzen, Canary neu starten. | Open {code_start}chrome://flags/#enable-webmcp-testing{code_end}, set “WebMCP for testing” to “Enabled” and restart Canary. |
| `canary_step3` | navigator.berlin öffnen. Die elf Tools registrieren sich automatisch bei {code_start}document.modelContext{code_end}; die Live-Diagnose oben auf dieser Seite zeigt Surface und Tool-Liste. | Open navigator.berlin. The eleven tools register themselves automatically with {code_start}document.modelContext{code_end}. The live diagnostics at the top of this page show the surface and the tool list. |
| `canary_step4` | Optional: Chrome-Team-Extension {link_start}Model Context Tool Inspector{link_end} installieren, um Tools zu inspizieren und manuell aufzurufen. | Optional: install the Chrome team extension {link_start}Model Context Tool Inspector{link_end} to inspect tools and call them manually. |
| `no_canary_heading` | Einsatz ohne Canary | Using it without Canary |
| `no_canary_p1` | Die ChatGPT-Desktop-App bringt WebMCP im eingebauten Browser nativ mit. Wer im Stable-Chrome ohne Flag, Firefox oder Safari bleibt, kann WebMCP über eine LLM-Browser-Extension nutzen, die einen Polyfill mitlädt. | The ChatGPT desktop app ships WebMCP natively in its built-in browser. Anyone who stays in Stable Chrome without the flag, in Firefox or in Safari can use WebMCP through an LLM browser extension that loads a polyfill. |
| `no_canary_p2` | Discovery-Pfad (Konvention, nicht Standard): {link1_start}/.well-known/webmcp.json{link1_end} spiegelt {link2_start}/webmcp-manifest.json{link2_end}. Klartext-Variante für Crawler nach {link3_start}llmstxt.org{link3_end}: {link4_start}/llms.txt{link4_end} und {link5_start}/llms-full.txt{link5_end}. | Discovery path (convention, not standard): {link1_start}/.well-known/webmcp.json{link1_end} mirrors {link2_start}/webmcp-manifest.json{link2_end}. Plain-text variant for crawlers following {link3_start}llmstxt.org{link3_end}: {link4_start}/llms.txt{link4_end} and {link5_start}/llms-full.txt{link5_end}. |
| `sources_heading` | Quellen | Sources |
| `sources_li_github` | GitHub-Repository der Spec | GitHub repository of the spec |

## webmcp_diagnose

Quelle: `src/lib/components/webmcp-diagnose.svelte`

| ID | DE | EN |
|---|---|---|
| `heading` | Live-Diagnose in diesem Browser | Live diagnostics in this browser |
| `intro_p1` | Dieser Abschnitt prüft beim Laden, was der Browser gerade bereitstellt. English: live check of the WebMCP surface in your current browser. | This section checks on load what the browser currently provides. It is a live check of the WebMCP surface in your current browser. |

## uis

Quelle: `src/routes/(with-header)/umwelt-infrastruktur-score/+page.svelte`

| ID | DE | EN |
|---|---|---|
| `meta_title` | Umwelt- & Infrastruktur-Score - Berlin in Daten - navigator.berlin | Environment & infrastructure score - Berlin in data - navigator.berlin |
| `meta_description` | Umwelt- & Infrastruktur-Score für Berlin: 143 Kieze und 12 Bezirke in fünf Dimensionen. Misst Umwelt und Infrastruktur, nicht Sozialstatus. | Environment & infrastructure score for Berlin: 143 Kieze and 12 Bezirke in five dimensions. Measures environment and infrastructure, not social status. |
| `jsonld_dataset_name` | Umwelt- & Infrastruktur-Score Berlin | Environment & infrastructure score Berlin |
| `jsonld_keyword_kiez_score` | Kiez-Score | Kiez score |
| `h1_title` | Umwelt- & Infrastruktur-Score | Environment & infrastructure score |
| `intro_p1` | Berliner Kieze und Bezirke nach fünf gleichgewichteten Dimensionen sortiert. Der Score misst Umwelt und Infrastruktur eines Kiezes, nicht den sozialen Status. Er bündelt öffentliche Daten pro Planungsraum. Eine einzelne Adresse kann davon abweichen. | Berlin Kieze and Bezirke sorted by five equally weighted dimensions. The score measures the environment and infrastructure of a Kiez, not social status. It bundles public data per planning area. A single address can differ from it. |
| `disclaimer` | Der Score fasst öffentliche Senats-Daten pro LOR-Bezirksregion zusammen. Was sich gut anfühlt, bemisst sich an persönlichen Prioritäten. Vergleich, nicht Urteil. | The score summarises public Senate data per LOR Bezirksregion. What feels good depends on personal priorities. A comparison, not a verdict. |
| `accordion_trigger` | Wie wird der Score berechnet? | How is the score calculated? |
| `accordion_content` | Wir aggregieren fünf Dimensionen: Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz. Quelle pro Dimension sind offene Senats-Daten (Lärmkartierung, Grünversorgung, Klima-Atlas, ÖPNV-Halte, Milieuschutzgebiete, POI-Distanzen). Die Aggregation läuft 542 LOR-Planungsräume → 143 LOR-Bezirksregionen → 12 Bezirke, jeweils flächengewichtet. Jede Dimension wird gleich gewichtet (5 × 20%). Sozialstruktur wird bewusst nicht gewertet. {link_start}Vollständige Methodik · Kiez-Score{link_end}. | We aggregate five dimensions: quiet & air, green & heat, mobility, local amenities, tenant protection. The source for each dimension is open Senate data (noise mapping, green space supply, climate atlas, public transport stops, Milieuschutz areas, POI distances). Aggregation runs from 542 LOR planning areas → 143 LOR Bezirksregionen → 12 Bezirke, each weighted by area. Each dimension carries equal weight (5 × 20%). Social structure is deliberately not scored. {link_start}Full methodology · Kiez score{link_end}. |
| `empty_state` | Score-Daten werden mit dem nächsten Build freigeschaltet. | Score data will be released with the next build. |

## uis_ranking

Quelle: `src/lib/components/atlas/score-ranking-table.svelte`

| ID | DE | EN |
|---|---|---|
| `view_aria_label` | Ranking-Ansicht wechseln | Switch ranking view |
| `sorted_by` | Sortiert nach | Sorted by |
| `sort_dir_high_low` | · hoch → niedrig | · high → low |
| `sort_dir_low_high` | · niedrig → hoch | · low → high |
| `col_rank` | Rang | Rank |
| `col_ruhe_luft` | Ruhe & Luft | Quiet & air |
| `col_gruen_hitze` | Grün & Hitze | Green & heat |
| `col_mobilitaet` | Mobilität | Mobility |
| `col_versorgung` | Versorgung | Local amenities |
| `col_wohnschutz` | Wohnschutz | Tenant protection |
| `col_kultur` | Kultur | Culture |
| `col_kriminalitaet` | Kriminalität | Recorded crime |
| `legend_label` | Farbe je Spalte, relativ: | Colour per column, relative: |
| `legend_q1` | unterstes Viertel | bottom quartile |
| `legend_q2` | unteres Mittel | lower middle |
| `legend_q3` | oberes Mittel | upper middle |
| `legend_q4` | oberstes Viertel | top quartile |
| `legend_crime` | Kriminalität: neutral (kein Farbverlauf) | Recorded crime: neutral (no colour gradient) |
| `crime_note` | Erfasste Kriminalität ist ein neutraler Kontext-Wert (Häufigkeitszahl je Bezirksregion, höher = mehr erfasste Fälle), kein Gut-Maß. Bewusst nicht sortierbar und nicht im Gesamt-Score: kein Sicherheits-Ranking. Grenzen unter {link_start}Methodik{link_end}. | Recorded crime is a neutral context value (frequency rate per Bezirksregion, higher = more recorded cases), not a measure of quality. Deliberately not sortable and not part of the overall score: no safety ranking. Limits are described under {link_start}Methodology{link_end}. |

## Abnahme

Matze 30.09.2026 09:12: abgenommen („approve continue“), DE-Fehler mitkorrigieren:
- `architektur.ki_p1`: „Neun Tools“ → „Elf Tools“ (Manifest: 11), die zwei Kiez-Finder-Tools ergänzt (DE und EN).
- `webmcp.tool_list_elections_desc`: „Alle 12 Berliner Wahlen“ → „Alle 14“ (4 BTW, je 5 AGH und BVV inkl. 2023 und 2026), EN entsprechend.
- Umbruchreste „Flag- Mechanik“, „Original- Wahl“ ohne Leerzeichen.
- Browser-Support Edge/Firefox (Stand-Aussagen „März 2026“, „Q3 2026“): vorerst wörtlich, Recherche läuft, Korrektur folgt separat mit Quellen.
