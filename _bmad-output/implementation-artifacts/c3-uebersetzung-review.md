# Review: i18n C3 · FAQ-Templates (DE → EN-GB)

Quelle DE: `src/lib/data/faq-templates/{laerm,gruen,oepnv,wohnen,klima}/*.de.yaml` (35 Templates: laerm 9, gruen 6, oepnv 7, wohnen 7, klima 6). Übersetzt sind `question` und `answer`, nicht `editorialNote`. DE-Spalte wörtlich aus der YAML (Folded Scalars wie js-yaml). Maschinenlesbar: `c3-uebersetzung.json`. Slot-Prüfung: Jeder DE-Slot steht identisch im EN.

## Übersetzungsentscheidungen

- Slots unverändert. Satzbau passt zu den EN-Werten aus `messages/en.json`: Kategorien (quiet, moderate, loud, very loud; good, moderate, low; no heat stress bis strong heat stress; very dense bis sparse; simple/medium/good residential area), Erklärungen als ganze Sätze, `{…Rang}` als „Rank 12 of 143“ bzw. „bottom quartile“.
- Score-Sätze: „{name} scores {…Score} out of 100 in the … score ({…Rang}), {…Vergleich}.“ Die Phrase „about the same as / above / below the district average“ bzw. „the Berlin median“ schließt den Satz.
- Score-Namen aus `atlas_dimension_label_*`: „Quiet & air score“, „Green & heat score“, „Mobility score“, „Tenant protection score“.
- Bezirk-Sätze: „In the Bezirk {name}, …“. Kiez-Sätze: „the Kiez {name}“. „Kiez“ und „Bezirk“ bleiben deutsch.
- Kategorie-Slots in Kiez-Sätzen als „in the category {gruenKategorie}“ und „in the noise class {laermKategorie}“, damit Einzelwörter wie „loud“ oder „low“ grammatisch tragen.
- „Wohnlage“ im Satz mit dem Slot-Wert „simple/medium/good residential area“. Der Fachbegriff „Wohnlage“ bleibt in den erklärenden Sätzen deutsch.
- Mietspiegel: „Berlin Mietspiegel“ und „Mietspiegel procedure“. MSS: „Monitoring Social Urban Development (MSS)“ wie in `messages/en.json`.
- Bodenrichtwert: „standard land value (Bodenrichtwert)“ einmal mit DE in Klammern. Sonst „standard land value“.
- Gutachterausschuss: „Berlin Committee of Valuation Experts (Gutachterausschuss)“ wie in C1/C2.
- Senatsverwaltung für Mobilität: voller Name „Senate Department for Urban Mobility, Transport, Climate Action and the Environment“ wie C2. Das DE kürzt hier auf „für Mobilität“.
- Bezirksamt/Ordnungsamt: „Bezirk office (Bezirksamt)“ und „public order office (Ordnungsamt)“.
- Deutscher Wetterdienst: „German Weather Service (Deutscher Wetterdienst)“. WHO und WMO ausgeschrieben.
- Zahlen englisch: 1991-2020, 30 degrees Celsius, 6 square metres. „Grad Celsius“ bleibt ausgeschrieben wie im DE.
- Anti-Stigma: Formulierungen neutral und beschreibend. Wohnen-Disclaimer sinngleich („descriptive, not evaluative“, „popular Kiez“, „good Bezirk“). Keine Wertungen ergänzt.
- Anführungszeichen „…“ → “…”. „Lärm-Klasse“ → „noise class“.
- „Einwohnerin“ → „resident“ (neutral).
- „Halte“ (Kiez-Template) und „Haltestellen“ (Bezirk-Template) beide → „stops“.
- „Hitze-Mitigation“ → „heat mitigation“. „Versiegelung“ → „surface sealing“.

## Unsicher

- ~~erledigt, siehe Abnahme~~ `gruen-was-bedeutet-versorgung`: DE nannte die Kategorien „hoch, mittel, gering“. Die Helper-Werte sind „good, moderate, low“. Übersetzt ist wörtlich „high, medium, low“. Inkonsistenz steht schon im DE.
- `gruen-anzahl-anlagen`: „Kataster der Senatsverwaltung“ → „register of the Senate Department“. Die zuständige Verwaltung ist im DE nicht benannt.
- `laerm-was-tun-bei-belastung`: „Senatsverwaltung für Mobilität“ ist im DE gekürzt. EN nutzt den vollen offiziellen Namen aus C2.
- ~~erledigt, siehe Abnahme~~ `laerm-welche-quellen`: „Flug-Lärm“ → „air … noise“ in der Aufzählung „road, rail, aircraft and industrial noise“. C1 schreibt „aircraft noise“.
- `laerm-ruheluft-einordnung`, `gruen-gruenhitze-einordnung`, `oepnv-mobilitaet-einordnung`, `wohnen-wohnschutz-einordnung`: Der Satz trägt bei Rang „bottom quartile“ die Lesart „(bottom quartile), below the district average“. Lesbar, aber der Rang ist keine ganze Aussage. Nach dem Rendern prüfen.
- `wohnen-wohnlage-bezirk` und `-kiez`: „the simple residential area dominates“ und „lies mostly in the good residential area of the Berlin Mietspiegel“. Die Slot-Werte enthalten „residential area“, der Fachbegriff „Wohnlage“ steht nur im Erklärsatz. Der Satz wirkt leicht sperrig.
- `wohnen-mss-bezirk`: „Aggregat-Status“ → „aggregate status“. Der DE-Text nennt „vier Stufen“, die Helper kennen fünf Stufen (sehr niedrig bis sehr hoch). Inkonsistenz steht schon im DE.
- `wohnen-wohnlage-kiez`: „Blockseiten oder Häuserzeilen“ → „block sides or rows of houses“. Kein etablierter englischer Begriff.
- `klima-was-ist-hitzetag`: „Klima-Normalperiode“ → „climate normal period“. Fachbegriff der WMO, im Deutschen wie Englischen etabliert, aber im Fließtext ungewohnt.
- `wohnen-wohnschutz-einordnung`: „Milieuschutz coverage“. „Milieuschutz“ bleibt deutsch laut Glossar, ohne Erklärung im Satz.


## Laerm

| ID | DE | EN |
|---|---|---|
| `laerm-dominant-bezirk` (Frage) | Wie laut ist es im Bezirk {name}? | How loud is it in the Bezirk {name}? |
| `laerm-dominant-bezirk` (Antwort) | Im Bezirk {name} dominiert die Lärm-Klasse {laermKategorie}. {laermErklaerung} Datengrundlage: {laermSource}, Stand {laermStand}. Werte beziehen sich auf LDEN, also den über 24 Stunden gewichteten Pegel. | In the Bezirk {name}, the dominant noise class is {laermKategorie}. {laermErklaerung} Data basis: {laermSource}, as of {laermStand}. Values refer to LDEN, the level weighted over 24 hours. |
| `laerm-dominant-kiez` (Frage) | Wie laut ist der Kiez {name}? | How loud is the Kiez {name}? |
| `laerm-dominant-kiez` (Antwort) | Der Kiez {name} liegt überwiegend in der Lärm-Klasse {laermKategorie}. {laermErklaerung} Quelle: {laermSource}, Stand {laermStand}. | The Kiez {name} lies mostly in the noise class {laermKategorie}. {laermErklaerung} Source: {laermSource}, as of {laermStand}. |
| `laerm-warum-nacht-schaedlicher` (Frage) | Warum gilt Nacht-Lärm als gesundheitlich relevanter? | Why is night-time noise considered more relevant to health? |
| `laerm-warum-nacht-schaedlicher` (Antwort) | Lärm in der Nacht stört Schlafphasen, in denen sich Herz-Kreislauf-System und Nerven erholen. Die Weltgesundheitsorganisation empfiehlt für Nacht-Lärm (LNIGHT) einen Richtwert von 40 dB. Die Berliner Lärmkartierung weist daher LDEN und LNIGHT getrennt aus. | Night-time noise disturbs the sleep phases in which the cardiovascular system and nerves recover. The World Health Organization recommends a guideline value of 40 dB for night-time noise (LNIGHT). The Berlin noise mapping therefore reports LDEN and LNIGHT separately. |
| `laerm-was-bedeutet-lden` (Frage) | Was bedeutet der Wert LDEN? | What does the LDEN value mean? |
| `laerm-was-bedeutet-lden` (Antwort) | LDEN steht für „Level Day-Evening-Night" und ist ein über 24 Stunden gewichteter Lärm-Mittelwert. Abend- und Nachtpegel gehen mit Aufschlägen von 5 und 10 dB ein, weil Lärm dann stärker stört. Der Wert dient als EU-weit einheitlicher Vergleichsmaßstab. | LDEN stands for “Level Day-Evening-Night” and is a noise average weighted over 24 hours. Evening and night levels count with penalties of 5 and 10 dB, because noise is more disturbing then. The value serves as a uniform comparison standard across the EU. |
| `laerm-wie-aktuell` (Frage) | Wie aktuell sind die Lärm-Daten für {name}? | How up to date is the noise data for {name}? |
| `laerm-wie-aktuell` (Antwort) | Die Berliner Lärmkartierung wird im EU-Rhythmus alle fünf Jahre neu gerechnet. Die in {name} ausgewiesene Klasse {laermKategorie} stammt aus der Kartierung {laermStand}. | The Berlin noise mapping is recalculated every five years, in line with the EU cycle. The class {laermKategorie} reported for {name} comes from the {laermStand} mapping. |
| `laerm-welche-quellen` (Frage) | Welche Lärm-Quellen fließen in die Karte ein? | Which noise sources feed into the map? |
| `laerm-welche-quellen` (Antwort) | Die strategische Lärmkartierung umfasst Straßen-, Schienen-, Flug- und Industrie-Lärm separat. Auf der Karte zeigen wir den Straßen-Verkehrslärm LDEN, weil er flächendeckend die größte Bevölkerung erreicht. | The strategic noise mapping covers road, rail, aircraft and industrial noise separately. On the map we show road traffic noise LDEN, because it reaches the largest population across the whole area. |
| `laerm-was-tun-bei-belastung` (Frage) | Was kann ich tun, wenn ich Lärm an meiner Adresse als belastend empfinde? | What can I do if I find the noise at my address disturbing? |
| `laerm-was-tun-bei-belastung` (Antwort) | Die Senatsverwaltung für Mobilität nimmt Hinweise zur strategischen Lärmminderung im Aktionsplan auf. Beschwerden zu konkreten Quellen (Baustellen, Gewerbe) gehen an das jeweils zuständige Bezirksamt oder Ordnungsamt. Wir verlinken auf der Methodik-Seite die offiziellen Anlaufstellen. | The Senate Department for Urban Mobility, Transport, Climate Action and the Environment takes suggestions on strategic noise reduction into the action plan. Complaints about specific sources (construction sites, businesses) go to the responsible Bezirk office (Bezirksamt) or public order office (Ordnungsamt). On the methodology page we link to the official points of contact. |
| `laerm-warum-keine-db-werte` (Frage) | Warum zeigt der Layer keine konkreten dB-Zahlen? | Why does the layer not show specific dB figures? |
| `laerm-warum-keine-db-werte` (Antwort) | Die offene Berliner Datengrundlage liefert pro Planungsraum eine Pegel-Klasse (zum Beispiel „mittel" oder „hoch"), keine Punktwerte. Wir geben den Wert genauso wieder, wie er publiziert wird, um keine Genauigkeit zu suggerieren, die im Datensatz nicht enthalten ist. | The open Berlin data provides one noise class per planning area (for example “medium” or “high”), not point values. We reproduce the value exactly as published, so as not to suggest a precision that the dataset does not contain. |
| `laerm-ruheluft-einordnung` (Frage) | Wie ruhig und sauber ist {name} im Vergleich? | How quiet and clean is {name} in comparison? |
| `laerm-ruheluft-einordnung` (Antwort) | {name} erreicht im Ruhe-und-Luft-Score {ruheLuftScore} von 100 ({ruheLuftRang}), {ruheLuftVergleich}. Der Score bündelt Lärm- und Luft-Belastung; ein höherer Wert heißt ruhiger und sauberer. | {name} scores {ruheLuftScore} out of 100 in the Quiet & air score ({ruheLuftRang}), {ruheLuftVergleich}. The score combines noise and air pollution. A higher value means quieter and cleaner. |

## Gruen

| ID | DE | EN |
|---|---|---|
| `gruen-versorgung-bezirk` (Frage) | Wie ist die Grünversorgung im Bezirk {name}? | What is the green space provision in the Bezirk {name}? |
| `gruen-versorgung-bezirk` (Antwort) | Im Bezirk {name} dominiert die Kategorie {gruenKategorie} für die wohnungsnahe Grünversorgung. {gruenErklaerung} Quelle: {gruenSource}, Stand {gruenStand}. | In the Bezirk {name}, the dominant category for green space provision near homes is {gruenKategorie}. {gruenErklaerung} Source: {gruenSource}, as of {gruenStand}. |
| `gruen-versorgung-kiez` (Frage) | Wie ist die Grünversorgung im Kiez {name}? | What is the green space provision in the Kiez {name}? |
| `gruen-versorgung-kiez` (Antwort) | Die wohnungsnahe Grünversorgung im Kiez {name} liegt in der Kategorie {gruenKategorie}. {gruenErklaerung} Quelle: {gruenSource}, Stand {gruenStand}. | Green space provision near homes in the Kiez {name} is in the category {gruenKategorie}. {gruenErklaerung} Source: {gruenSource}, as of {gruenStand}. |
| `gruen-anzahl-anlagen` (Frage) | Wie viele öffentliche Grünanlagen liegen in {name}? | How many public green spaces are there in {name}? |
| `gruen-anzahl-anlagen` (Antwort) | Im Bezirk {name} liegen {gruenanlagenCount} öffentlich gewidmete Grünanlagen gemäß dem aktuellen Kataster der Senatsverwaltung. Privat-Gärten und bewirtschaftete Kleingärten zählen nicht zu dieser Kategorie. | The Bezirk {name} has {gruenanlagenCount} officially designated public green spaces, according to the current register of the Senate Department. Private gardens and cultivated allotment gardens do not count in this category. |
| `gruen-was-bedeutet-versorgung` (Frage) | Was bedeutet wohnungsnahe Grünversorgung? | What does green space provision near homes mean? |
| `gruen-was-bedeutet-versorgung` (Antwort) | Die Senatsverwaltung berechnet pro Planungsraum, wie viele Quadratmeter wohnungsnahe Grünfläche pro Einwohnerin im Einzugsbereich liegen. Als Richtwert gelten 6 Quadratmeter pro Person. Erreicht oder verfehlt ein Planungsraum diesen Wert, ergibt sich die Kategorie „gut", „mittel" oder „gering". | For each planning area, the Senate Department calculates how many square metres of green space near homes are available per resident within the catchment area. The benchmark is 6 square metres per person. Whether a planning area reaches or misses this value determines the category “good”, “moderate” or “low”. |
| `gruen-rolle-hitze` (Frage) | Welche Rolle spielen Grünflächen für Hitze-Mitigation? | What role do green spaces play in heat mitigation? |
| `gruen-rolle-hitze` (Antwort) | Bäume und größere Grünflächen senken die Lufttemperatur durch Verschattung und Verdunstung. Stadtklima-Analysen zeigen, dass dicht bebaute Quartiere mit wenig Vegetation an Sommertagen messbar wärmer bleiben als Gebiete mit vergleichbarer Bebauung und mehr Grün. Die Klima-Kategorie auf dieser Karte bildet das ab. | Trees and larger green spaces lower the air temperature through shading and evaporation. Urban climate analyses show that densely built neighbourhoods with little vegetation stay measurably warmer on summer days than areas with comparable buildings and more greenery. The climate category on this map reflects that. |
| `gruen-gruenhitze-einordnung` (Frage) | Wie grün und kühl ist {name} im Vergleich? | How green and cool is {name} in comparison? |
| `gruen-gruenhitze-einordnung` (Antwort) | {name} erreicht im Grün-und-Hitze-Score {gruenHitzeScore} von 100 ({gruenHitzeRang}), {gruenHitzeVergleich}. Der Score verbindet Grünversorgung und Hitzebelastung; ein höherer Wert heißt grüner und kühler. | {name} scores {gruenHitzeScore} out of 100 in the Green & heat score ({gruenHitzeRang}), {gruenHitzeVergleich}. The score combines green space provision and heat exposure. A higher value means greener and cooler. |

## Oepnv

| ID | DE | EN |
|---|---|---|
| `oepnv-dichte-bezirk` (Frage) | Wie dicht ist das ÖPNV-Netz im Bezirk {name}? | How dense is the public transport network in the Bezirk {name}? |
| `oepnv-dichte-bezirk` (Antwort) | Im Bezirk {name} liegen {oepnvStopsPerKm2} Haltestellen pro Quadratkilometer. Das Netz gilt damit als {oepnvDichte}. {oepnvErklaerung} Datengrundlage: {oepnvSource}, Stand {oepnvStand}. | The Bezirk {name} has {oepnvStopsPerKm2} stops per square kilometre. The network is therefore considered {oepnvDichte}. {oepnvErklaerung} Data basis: {oepnvSource}, as of {oepnvStand}. |
| `oepnv-dichte-kiez` (Frage) | Wie ist der Kiez {name} an den ÖPNV angebunden? | How well is the Kiez {name} connected to public transport? |
| `oepnv-dichte-kiez` (Antwort) | Im Kiez {name} liegen {oepnvStopsPerKm2} Halte pro Quadratkilometer. {oepnvErklaerung} Quelle: {oepnvSource}, Stand {oepnvStand}. | The Kiez {name} has {oepnvStopsPerKm2} stops per square kilometre. {oepnvErklaerung} Source: {oepnvSource}, as of {oepnvStand}. |
| `oepnv-was-bedeutet-dichte` (Frage) | Was sagt die Haltedichte pro Quadratkilometer aus? | What does stop density per square kilometre tell you? |
| `oepnv-was-bedeutet-dichte` (Antwort) | Die Haltedichte ist ein erster grober Indikator für Anbindung. Sie sagt nichts über Taktung, Linienführung oder Barrierefreiheit aus. Eine hohe Dichte korreliert in Berlin häufig mit Innenstadt-Lagen und Verknüpfungs- Knoten, eine niedrige Dichte mit Stadtrand-Bereichen. | Stop density is a first, rough indicator of connectivity. It says nothing about frequency, routes or accessibility. In Berlin, a high density often correlates with inner-city locations and interchange hubs, a low density with outer-city areas. |
| `oepnv-walk-score-logik` (Frage) | Berücksichtigt der Wert Fußwege oder Barrierefreiheit? | Does the value take walking routes or accessibility into account? |
| `oepnv-walk-score-logik` (Antwort) | Aktuell nicht. Der Wert zählt Haltepunkte innerhalb der Flächengrenzen und teilt sie durch die Fläche. Wir verbessern den Indikator schrittweise um Fußweg-Distanzen und Stationskategorien. Die Methodik-Seite dokumentiert jede Erweiterung. | Not at present. The value counts stops within the area boundaries and divides them by the area. We are gradually extending the indicator with walking distances and station categories. The methodology page documents every extension. |
| `oepnv-welche-modi` (Frage) | Welche Verkehrsmittel fließen in die Haltedichte ein? | Which modes of transport feed into the stop density? |
| `oepnv-welche-modi` (Antwort) | Wir zählen U-Bahn-, S-Bahn-, Tram- und Bus-Haltestellen der BVG und der S-Bahn Berlin GmbH zusammen. Regional-Bahn-Stationen werden zusätzlich ausgewiesen, weil sie für Pendelverkehr relevant sind. | We count U-Bahn, S-Bahn, tram and bus stops of the BVG and S-Bahn Berlin GmbH together. Regional rail stations are reported additionally, because they are relevant for commuting. |
| `oepnv-warum-nicht-fahrplandaten` (Frage) | Warum zeigt navigator.berlin keine Live-Fahrplan-Daten? | Why does navigator.berlin not show live timetable data? |
| `oepnv-warum-nicht-fahrplandaten` (Antwort) | Live-Daten erfordern Server-Caching, Lizenz-Kosten und stehen oft nur kurzfristig zur Verfügung. Wir setzen bewusst auf statische Aggregate aus offenen Datensätzen, die wir prüfen und versionieren können. | Live data requires server caching and licence costs, and is often available only for a short time. We deliberately rely on static aggregates from open datasets that we can check and version. |
| `oepnv-mobilitaet-einordnung` (Frage) | Wie gut ist {name} an den Nahverkehr angebunden? | How well is {name} connected to local public transport? |
| `oepnv-mobilitaet-einordnung` (Antwort) | {name} erreicht im Mobilitäts-Score {mobilitaetScore} von 100 ({mobilitaetRang}), {mobilitaetVergleich}. Der Score bildet die ÖPNV-Anbindung ab; ein höherer Wert heißt besser angebunden. | {name} scores {mobilitaetScore} out of 100 in the Mobility score ({mobilitaetRang}), {mobilitaetVergleich}. The score reflects public transport connectivity. A higher value means better connectivity. |

## Wohnen

| ID | DE | EN |
|---|---|---|
| `wohnen-wohnlage-bezirk` (Frage) | Welche Wohnlage dominiert im Bezirk {name}? | Which residential area type dominates in the Bezirk {name}? |
| `wohnen-wohnlage-bezirk` (Antwort) | Im Bezirk {name} dominiert die {wohnenWohnlage} gemäß dem Berliner Mietspiegel. Die Wohnlage ist eine raumbezogene Kategorie aus drei Stufen (einfach, mittel, gut). Sie fasst Bebauungs- und Umfeld-Merkmale zusammen und ist keine Bewertung der Lebensumstände einzelner Adressen. Quelle: {wohnenSource}, Stand {wohnenStand}. | In the Bezirk {name}, the {wohnenWohnlage} dominates according to the Berlin Mietspiegel. The Wohnlage is a spatial category with three levels (simple, medium, good). It summarises building and surroundings characteristics and is not an assessment of the living circumstances of individual addresses. Source: {wohnenSource}, as of {wohnenStand}. |
| `wohnen-wohnlage-kiez` (Frage) | Welche Wohnlage dominiert im Kiez {name}? | Which residential area type dominates in the Kiez {name}? |
| `wohnen-wohnlage-kiez` (Antwort) | Der Kiez {name} liegt überwiegend in der {wohnenWohnlage} des Berliner Mietspiegels. Die Stufe ist eine räumliche Kategorie aus dem Mietspiegel- Verfahren und gilt jeweils für Blockseiten oder Häuserzeilen, nicht für Einzeladressen. Quelle: {wohnenSource}, Stand {wohnenStand}. | The Kiez {name} lies mostly in the {wohnenWohnlage} of the Berlin Mietspiegel. The level is a spatial category from the Mietspiegel procedure and applies to block sides or rows of houses, not to individual addresses. Source: {wohnenSource}, as of {wohnenStand}. |
| `wohnen-mss-bezirk` (Frage) | Wie schneidet {name} im Monitoring Soziale Stadtentwicklung ab? | How does {name} fare in the Monitoring Social Urban Development? |
| `wohnen-mss-bezirk` (Antwort) | Das Monitoring Soziale Stadtentwicklung (MSS) ordnet Planungsräume in vier Stufen nach sozio-ökonomischen Indikatoren ein. Für {name} ergibt der aktuelle MSS einen Aggregat-Status. {wohnenMssBeschreibung} Der Index bezieht sich auf den gesamten Raum, nicht auf einzelne Haushalte. | The Monitoring Social Urban Development (MSS) classifies planning areas into four levels based on socio-economic indicators. For {name}, the current MSS gives an aggregate status. {wohnenMssBeschreibung} The index refers to the whole area, not to individual households. |
| `wohnen-warum-keine-mietpreise` (Frage) | Warum gibt navigator.berlin keine konkreten Mietpreise pro Adresse aus? | Why does navigator.berlin not show specific rents per address? |
| `wohnen-warum-keine-mietpreise` (Antwort) | Mietpreise hängen von Baujahr, Ausstattung, Lage und Stichtagen ab. Der Berliner Mietspiegel liefert Spannen pro Wohnlage und Baualters-Klasse, keine Punktwerte pro Adresse. Wir verlinken auf der Methodik-Seite den offiziellen Mietspiegel-Rechner. | Rents depend on year of construction, fittings, location and reference dates. The Berlin Mietspiegel provides ranges per residential area and age-of-building class, not point values per address. On the methodology page we link to the official Mietspiegel calculator. |
| `wohnen-was-ist-brw` (Frage) | Worin unterscheiden sich Bodenrichtwert und Mietspiegel? | How do the standard land value and the Mietspiegel differ? |
| `wohnen-was-ist-brw` (Antwort) | Der Bodenrichtwert beschreibt einen durchschnittlichen Grundstückspreis pro Quadratmeter, geprüft durch den Gutachterausschuss. Der Mietspiegel beschreibt ortsübliche Vergleichsmieten für Wohnraum. Beide Werte gelten für Räume, nicht für Einzel-Adressen. | The standard land value (Bodenrichtwert) describes an average land price per square metre, verified by the Berlin Committee of Valuation Experts (Gutachterausschuss). The Mietspiegel describes the local comparative rents for housing. Both values apply to areas, not to individual addresses. |
| `wohnen-stigma-disclaimer` (Frage) | Bewertet navigator.berlin Wohngebiete als gut oder schlecht? | Does navigator.berlin rate residential areas as good or bad? |
| `wohnen-stigma-disclaimer` (Antwort) | Nein. Wir geben kategoriale Werte aus offiziellen Datenquellen wieder (Mietspiegel-Wohnlage, MSS, BRW). Diese Kategorien sind beschreibend, nicht wertend. Bezeichnungen wie „beliebter Kiez" oder „guter Bezirk" verwenden wir aus methodischen Gründen nicht. | No. We reproduce categorical values from official data sources (Mietspiegel Wohnlage, MSS, standard land value). These categories are descriptive, not evaluative. For methodological reasons, we do not use labels such as “popular Kiez” or “good Bezirk”. |
| `wohnen-wohnschutz-einordnung` (Frage) | Wie viel Wohnschutz gibt es in {name}? | How much tenant protection is there in {name}? |
| `wohnen-wohnschutz-einordnung` (Antwort) | {name} erreicht im Wohnschutz-Score {wohnschutzScore} von 100 ({wohnschutzRang}), {wohnschutzVergleich}. Der Score erfasst die Milieuschutz-Abdeckung; ein höherer Wert heißt mehr Schutz vor Verdrängung. | {name} scores {wohnschutzScore} out of 100 in the Tenant protection score ({wohnschutzRang}), {wohnschutzVergleich}. The score captures Milieuschutz coverage. A higher value means more protection against displacement. |

## Klima

| ID | DE | EN |
|---|---|---|
| `klima-pet-bezirk` (Frage) | Wie heiß wird der Bezirk {name} im Sommer? | How hot does the Bezirk {name} get in summer? |
| `klima-pet-bezirk` (Antwort) | Die mittlere Physiologische Äquivalent-Temperatur (PET) im Bezirk {name} liegt bei {klimaPet} Grad Celsius (Klassifikation: {klimaKategorie}). {klimaErklaerung} Quelle: {klimaSource}, Stand {klimaStand}. | The mean Physiological Equivalent Temperature (PET) in the Bezirk {name} is {klimaPet} degrees Celsius (classification: {klimaKategorie}). {klimaErklaerung} Source: {klimaSource}, as of {klimaStand}. |
| `klima-pet-kiez` (Frage) | Wie warm wird der Kiez {name} an Hitzetagen? | How warm does the Kiez {name} get on hot days? |
| `klima-pet-kiez` (Antwort) | Die mittlere PET im Kiez {name} liegt bei {klimaPet} Grad Celsius. {klimaErklaerung} Quelle: {klimaSource}, Stand {klimaStand}. | The mean PET in the Kiez {name} is {klimaPet} degrees Celsius. {klimaErklaerung} Source: {klimaSource}, as of {klimaStand}. |
| `klima-was-ist-pet` (Frage) | Was ist die Physiologische Äquivalent-Temperatur (PET)? | What is the Physiological Equivalent Temperature (PET)? |
| `klima-was-ist-pet` (Antwort) | PET ist ein bioklimatischer Kennwert. Er gibt an, welche Lufttemperatur in einem geschlossenen Raum einer gefühlten Temperatur draußen entsprechen würde. Wind, Luftfeuchte und Strahlung gehen ein. Der Wert eignet sich, um Hitzestress in Stadtgebieten zu vergleichen. | PET is a bioclimatic indicator. It states which air temperature in an enclosed room would correspond to the perceived temperature outdoors. Wind, humidity and radiation feed into it. The value is suited to comparing heat stress across urban areas. |
| `klima-was-ist-hitzetag` (Frage) | Was zählt als Hitzetag? | What counts as a hot day? |
| `klima-was-ist-hitzetag` (Antwort) | Der Deutsche Wetterdienst zählt einen Tag mit Tageshöchsttemperatur ab 30 Grad Celsius als Hitzetag. Die Anzahl der Hitzetage pro Jahr ist in Berlin seit den 1990er Jahren deutlich gestiegen, was in der Klima- Normalperiode 1991-2020 dokumentiert ist. | The German Weather Service (Deutscher Wetterdienst) counts a day with a maximum temperature of 30 degrees Celsius or more as a hot day. The number of hot days per year in Berlin has risen markedly since the 1990s, as documented in the 1991-2020 climate normal period. |
| `klima-normalperiode` (Frage) | Was bedeutet Klima-Normalperiode? | What does climate normal period mean? |
| `klima-normalperiode` (Antwort) | Eine Klima-Normalperiode ist ein 30-Jahres-Referenzzeitraum, mit dem die Weltorganisation für Meteorologie Wetter-Mittelwerte vergleichbar macht. In Berlin nutzen wir die aktuelle Periode 1991-2020 als Vergleichsbasis. | A climate normal period is a 30-year reference period that the World Meteorological Organization uses to make weather averages comparable. For Berlin, we use the current period 1991-2020 as the basis for comparison. |
| `klima-rolle-versiegelung` (Frage) | Welche Rolle spielt die Versiegelung für das Stadtklima? | What role does surface sealing play in the urban climate? |
| `klima-rolle-versiegelung` (Antwort) | Asphalt und Stein speichern Wärme und geben sie nachts wieder ab. Stark versiegelte Quartiere kühlen schlechter aus als Quartiere mit Vegetation oder offenen Wasserflächen. Die Stadtklima-Analyse berücksichtigt Versiegelung als einen Faktor unter mehreren. | Asphalt and stone store heat and release it again at night. Heavily sealed neighbourhoods cool down less well than neighbourhoods with vegetation or open water. The urban climate analysis treats sealing as one factor among several. |

## Abnahme

Matze 30.09.2026 07:09: abgenommen („approve and continue“). Korrekturen:
- `gruen-was-bedeutet-versorgung`: DE-Fehler behoben, Kategorien „gut“, „mittel“, „gering“ wie in Daten und Karte. EN „good“, „moderate“, „low“ wie die Helper.
- `laerm-welche-quellen`: „aircraft noise“ wie C1.
- `wohnen-mss-bezirk`: „vier Stufen“ stimmt (MSS-Status-Index `si_v`: hoch, mittel, niedrig, sehr niedrig). Keine Änderung.
