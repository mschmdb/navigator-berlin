# Review: i18n C2 · Methodik-Texte und Behördennamen (DE → EN-GB)

Quelle DE: `layer-methodology.ts` (`LAYER_METHODOLOGY_SPECS`, 44 Slugs) und `authorities.ts` (`AUTHORITIES`, 25 Einträge). DE-Spalte wörtlich aus dem Code. Maschinenlesbar: `translations.json`.

## Übersetzungsentscheidungen

- Glossar aus C1 und `messages/en.json` übernommen: planning area, locality, standard land value, rent index (Mietspiegel), residential area, frequency rate, unreported crime, Kiez score, Dimensionen „Quiet & air“, „Green & heat“, „Local amenities“.
- Senatsverwaltungen mit offiziellem englischem Namen laut berlin.de (Senate Departments, Stand 27.09.): „Senate Department for Urban Mobility, Transport, Climate Action and the Environment“, „… for Education, Youth and Families“, „… for Higher Education and Research, Health and Long-Term Care“, „… for Urban Development, Building and Housing“, „… for the Interior and Sport“.
- „Senatsverwaltung für Stadtentwicklung Berlin“ (Kurzname im DE) bleibt „Senate Department for Urban Development Berlin“ wie in C1 (`mss_gesamtindex_2025_long`).
- Bezirksämter und Fachämter: englische Umschreibung plus DE in Klammern, z. B. „Bezirk offices (Bezirksämter)“, „Parks departments (Grünflächenämter)“, „Building authorities (Bauämter)“.
- Gutachterausschuss: „Office of the Berlin Committee of Valuation Experts“ plus vollständiger DE-Name in Klammern. Im Fließtext wie C1 „Berlin Committee of Valuation Experts (Gutachterausschuss)“.
- `updateFrequency`: „fortlaufend“ → „ongoing“, „kontinuierlich“ → „continuously“, „unregelmäßig“ → „irregularly“, „jährlich“ → „annually“. Kleinschreibung wie DE.
- Deliktnamen aus `inspector_kiez_score_delikt_*`: Neighbourhood offences (Kieztaten), Residential burglary, Vandalism, Street robbery/bag snatching, Bicycle theft.
- Zahlen englisch: 1.000 → 1,000, 100.000 → 100,000, 1750 → 1,750. Stichtag 31.12. → „31 Dec“. 14 Uhr → 2 pm. Gewichte (0.12, 0.35) standen im DE schon mit Punkt und bleiben.
- Code- und Datenbezeichner unverändert: `nearestPolygonFallbackKm`, `e_platz`, `L_DEN`, `railway=station`, `station=light_rail`, `operator BVG`, mapshaper-Optionen, Slug `wohnlagen-2024`.
- Interne Verweise bleiben: „story 10.6b“, „Epic 12 Story 12.3“, „Option C“, „FR50 und FR51“.
- Großschreibung zur Betonung („NICHT“) übernommen als „NOT“, wie in C1.
- „Flug“ als Lärmquelle → „air traffic“ (C1 schreibt „aircraft noise“ im Langtext).
- `aggregationLevel` ist ein Enum (`lor-planungsraum` usw.), keine Prosa. Nicht übersetzt. `relatedLayers` sind Slugs.
- Deutsche Anführungszeichen „…“ → “…”, Apostroph typografisch (children’s).

## Unsicher

- `senatsvw-bildung`, `senatsvw-gesundheit`, `senatsvw-umwelt`/`-mvku`: Die offiziellen Namen weichen von C1 ab. C1 (`kitas_2024_long` usw.) schreibt „Education, Youth and Family“, „Science, Health and Care“, „Health“. Entweder C1 nachziehen oder hier die C1-Form nehmen.
- Authority-Suffix `· OpenStreetMap-Contributors (ODbL 1.0)` gilt im Code als sprachneutral und steht nicht in dieser Übersetzung. Auf EN hängt es deutsch geschrieben an („OpenStreetMap-Contributors“ statt „OpenStreetMap contributors“). Betrifft 9 Layer.
- `kiez-score-kultur`: „kulturkollektiver POIs“ → „collective cultural POIs“. Das DE-Wort ist unklar, gemeint sind vermutlich öffentlich zugängliche Kulturorte.
- `kuehle-orte` omissions: „üben Hausrecht aus“ → „exercise their right to refuse entry (Hausrecht)“. Kein exaktes englisches Gegenstück.
- `umweltgerechtigkeit-2023`: „Stadtteil-Aggregat“ → „neighbourhood-level aggregate“. „Stadtteil“ ist weder Bezirk noch Ortsteil.
- `laerm-2023` omissions: „Nachtruhe-Kennwerte“ → „Night-time noise indicators“. Satzbau leicht umgestellt („this layer shows overall pollution only“).
- `kiez-score-versorgung`: „Versorgungs-Klinikum“ → „large general hospital“, „Spätkauf“ → „Späti“ (C1-Glossar), „Daseinsvorsorge“ → „public services“.
- `mss-gesamtindex-2025`: „Transferbezug-Quote“ → „rate of welfare receipt“. Fachbegriff im MSS: Anteil Empfänger:innen staatlicher Transferleistungen.
- `wohnlagen-2024`: „IBB Wohnungsmarktbericht“ → „IBB housing market report“. Die IBB nennt ihn auf Englisch ungeprüft ebenso.
- `stolpersteine`: „Verlegungen“ → „new stones laid“, „Würde-Prinzip“ → „Dignity principle“.
- `kiez-score-wohnschutz`: „Erhaltungssatzung“ → „preservation statute“ wie C1, andere Methodik-Texte sagen „preservation order“ (DE: Verordnung). Folgt dem DE-Unterschied.
- Aufgabe nannte 26 Behörden, `AUTHORITIES` enthält 25 Keys. Alle 25 übersetzt.

## Behörden

| Key | DE | EN |
|---|---|---|
| `odis` | ODIS Berlin · Open Data Informationsstelle | ODIS Berlin · Open Data Information Office |
| `osm` | OpenStreetMap-Contributors | OpenStreetMap contributors |
| `senatsvw-umwelt` | Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt · Umweltatlas Berlin | Senate Department for Urban Mobility, Transport, Climate Action and the Environment · Berlin Environmental Atlas (Umweltatlas) |
| `senatsvw-mvku` | Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt (SenMVKU) | Senate Department for Urban Mobility, Transport, Climate Action and the Environment (SenMVKU) |
| `senatsvw-mvku-short` | SenMVKU | SenMVKU |
| `senatsvw-bildung` | Senatsverwaltung für Bildung, Jugend und Familie | Senate Department for Education, Youth and Families |
| `senatsvw-gesundheit` | Senatsverwaltung für Wissenschaft, Gesundheit und Pflege | Senate Department for Higher Education and Research, Health and Long-Term Care |
| `senatsvw-stadtentwicklung` | Senatsverwaltung für Stadtentwicklung Berlin | Senate Department for Urban Development Berlin |
| `senatsvw-mietspiegel` | Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Mietspiegel-Geschäftsstelle | Senate Department for Urban Development, Building and Housing · Rent index office (Mietspiegel-Geschäftsstelle) |
| `senatsvw-stadtentwicklung-bezirke` | Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Bezirksämter | Senate Department for Urban Development, Building and Housing · Bezirk offices (Bezirksämter) |
| `senatsvw-inneres-sport` | Senatsverwaltung für Inneres und Sport · Bezirksämter | Senate Department for the Interior and Sport · Bezirk offices (Bezirksämter) |
| `bezirksamt-bauamt` | Bezirksämter Berlin · Bauämter | Berlin Bezirk offices (Bezirksämter) · Building authorities (Bauämter) |
| `bezirksamt-gruenflaeche` | Bezirksämter Berlin · Grünflächenämter | Berlin Bezirk offices (Bezirksämter) · Parks departments (Grünflächenämter) |
| `gutachterausschuss-grundstuecke` | Geschäftsstelle des Gutachterausschusses für Grundstückswerte in Berlin | Office of the Berlin Committee of Valuation Experts (Geschäftsstelle des Gutachterausschusses für Grundstückswerte in Berlin) |
| `baeder-betriebe` | Berliner Bäder-Betriebe (BBB) · Bezirksämter | Berliner Bäder-Betriebe (BBB) · Bezirk offices (Bezirksämter) |
| `wasser-betriebe` | Berliner Wasserbetriebe | Berliner Wasserbetriebe |
| `bvg` | BVG · Berliner Verkehrsbetriebe · Halte und Netze aus OpenStreetMap | BVG · Berliner Verkehrsbetriebe · Stops and networks from OpenStreetMap |
| `sbahn` | S-Bahn Berlin GmbH (DB-Konzern) · Routen aus OpenStreetMap-Relationen | S-Bahn Berlin GmbH (DB group) · Routes from OpenStreetMap relations |
| `stolpersteine-initiativen` | Stolpersteine-Initiativen Berlin | Stolpersteine initiatives in Berlin |
| `navigator-eigenberechnung-senats-daten` | navigator.berlin (Eigenberechnung aus Senats-Daten) | navigator.berlin (own calculation from Senate data) |
| `navigator-eigenberechnung-mss-2025` | navigator.berlin (Eigenberechnung aus SenStadt MSS 2025) | navigator.berlin (own calculation from SenStadt MSS 2025) |
| `navigator-eigenberechnung-osm-radverkehr` | navigator.berlin (Eigenberechnung aus OSM-Stops + Berliner Radverkehrsnetz) | navigator.berlin (own calculation from OSM stops + Berlin cycling network) |
| `navigator-eigenberechnung-bezirke` | navigator.berlin (Eigenberechnung aus Senats-Daten und Bezirks-Registern) | navigator.berlin (own calculation from Senate data and Bezirk registers) |
| `navigator-eigenberechnung-kriminalitaetsatlas` | navigator.berlin (Eigenberechnung aus dem Kriminalitätsatlas Berlin, Polizei Berlin) | navigator.berlin (own calculation from the Berlin crime atlas, Kriminalitätsatlas Berlin, Polizei Berlin) |
| `navigator-redaktion-osm-kuehle-orte` | navigator.berlin (redaktionelle Anreicherung aus OpenStreetMap) | navigator.berlin (editorial enrichment from OpenStreetMap) |

## Methodik je Layer

### `bezirke`

Behörde: `odis`

| Feld | DE | EN |
|---|---|---|
| calculation | Polygone der 12 Berliner Verwaltungsbezirke aus dem Berliner Geoportal, vereinfacht via mapshaper visvalingam mit keep-shapes. | Polygons of Berlin’s 12 administrative Bezirke from the Berlin geoportal, simplified via mapshaper visvalingam with keep-shapes. |
| updateFrequency | sehr selten (administrative Änderungen) | very rarely (administrative changes) |

### `ortsteile`

Behörde: `odis`

| Feld | DE | EN |
|---|---|---|
| calculation | Polygone der 96 statistischen Ortsteile, historisch oft eigene Gemeinden vor der Eingemeindung 1920. Quelle ODIS Berlin. | Polygons of the 96 statistical localities (Ortsteile), historically often independent municipalities before their incorporation in 1920. Source: ODIS Berlin. |
| updateFrequency | sehr selten | very rarely |

### `plz`

Behörde: `odis`

| Feld | DE | EN |
|---|---|---|
| calculation | Postleitzahlen-Gebiete für Berlin. Eine PLZ kann mehrere Ortsteile schneiden, deckt sich also nicht mit politischen Grenzen. | Postcode areas for Berlin. One postcode can intersect several localities, so it does not match political boundaries. |
| updateFrequency | selten (Anpassung durch Deutsche Post) | rarely (adjusted by Deutsche Post) |

### `bodenrichtwerte`

Behörde: `gutachterausschuss-grundstuecke`

| Feld | DE | EN |
|---|---|---|
| calculation | Vom Berliner Gutachterausschuss jährlich festgestellte Lagewerte für unbebauten Boden, blockweise aggregiert. Wert pro Quadratmeter, differenziert nach Nutzungsart. | Location values for undeveloped land, set annually by the Berlin Committee of Valuation Experts (Gutachterausschuss) and aggregated by block. Value per square metre, differentiated by type of use. |
| updateFrequency | jährlich | annually |
| coverageGaps[0] | Nur unbebaute Vergleichsbasis. Bebaute Grundstücke werden indirekt abgeleitet. | Undeveloped land is the only basis of comparison. Values for developed plots are derived indirectly. |
| coverageGaps[1] | Sonderlagen (Bahnflächen, Friedhöfe, Wasser) erscheinen ohne Wert. | Special locations (railway land, cemeteries, water) appear without a value. |
| omissions[0] | Kein Mietpreis und kein Verkaufspreis. Mietspiegel-Werte gehören zu wohnlagen-2024. | No rent and no sale price. Rent index values belong to wohnlagen-2024. |
| omissions[1] | Keine Spekulations- oder Marktpreis-Indikation. | No indication of speculation or market prices. |

### `wohnlagen-2024`

Behörde: `senatsvw-mietspiegel`

| Feld | DE | EN |
|---|---|---|
| calculation | Wohnlagen-Aggregat aus dem Berliner Mietspiegel 2024 pro LOR-Planungsraum, vom IBB Wohnungsmarktbericht abgeleitet. Ordinalskala einfach bis bestlage. | Aggregated residential area classification from the Berlin rent index (Mietspiegel) 2024 per LOR planning area, derived from the IBB housing market report. Ordinal scale from simple to prime location. |
| updateFrequency | alle zwei Jahre (Mietspiegel-Zyklus) | every two years (rent index cycle) |
| coverageGaps[0] | Pro Planungsraum nur ein Wert. Block-Mikrolagen verschwinden. | Only one value per planning area. Block-level micro-locations disappear. |
| coverageGaps[1] | Gewerbe- und Mischgebiete erscheinen ggf. ohne Wohnlagen-Eintrag. | Commercial and mixed-use areas may appear without a residential area entry. |
| omissions[0] | Konkrete €/m² liefert nur der offizielle Mietspiegel-Rechner unter mietspiegel.berlin.de. | Only the official rent index calculator (Mietspiegel-Rechner) at mietspiegel.berlin.de gives concrete €/m². |
| omissions[1] | Keine Aussage zu Wohnqualität im Sinne von „besser oder schlechter wohnen". | No statement on housing quality in the sense of “living better or worse”. |

### `milieuschutz-erhaltungsmiete`

Behörde: `senatsvw-stadtentwicklung-bezirke`

| Feld | DE | EN |
|---|---|---|
| calculation | Polygone der sozialen Erhaltungsverordnungen nach §172 BauGB. Schutz vor Verdrängung durch Modernisierung und Umwandlung. | Polygons of the social preservation orders under §172 BauGB. Protection against displacement through modernisation and conversion. |
| updateFrequency | unregelmäßig (Bezirksbeschlüsse) | irregularly (Bezirk resolutions) |
| omissions[0] | Schutz vor Mieterhöhung kann Umzugschancen mindern. Layer wertet das nicht. | Protection against rent increases can reduce the chances of moving. The layer does not assess this. |

### `milieuschutz-staedtebau`

Behörde: `bezirksamt-bauamt`

| Feld | DE | EN |
|---|---|---|
| calculation | Polygone der städtebaulichen Erhaltungsverordnungen nach §172 BauGB zum Schutz des Stadtbildes (häufig Altbau- oder Gründerzeit-Quartiere). | Polygons of the urban preservation orders under §172 BauGB protecting the townscape (often old-building or Gründerzeit neighbourhoods). |
| updateFrequency | unregelmäßig | irregularly |

### `mss-gesamtindex-2025`

Behörde: `senatsvw-stadtentwicklung`

| Feld | DE | EN |
|---|---|---|
| calculation | Monitoring Soziale Stadtentwicklung 2025: Gesamtindex aus zwei Achsen pro LOR-Planungsraum. Status-Index (sehr niedrig bis hoch) gewichtet Einkommen, Beschäftigung und Bildung. Dynamik-Index (negativ, stabil, positiv) zeigt die Veränderung gegenüber dem vorhergehenden MSS-Zyklus. Berechnung durch die Senatsverwaltung für Stadtentwicklung Berlin. | Monitoring Social Urban Development 2025: overall index from two axes per LOR planning area. The status index (very low to high) weights income, employment and education. The dynamics index (negative, stable, positive) shows the change compared with the previous MSS cycle. Calculated by the Senate Department for Urban Development Berlin. |
| updateFrequency | rund alle zwei Jahre (MSS-Zyklus) | roughly every two years (MSS cycle) |
| coverageGaps[0] | Planungsräume mit unter 300 Einwohner:innen oder Ausreißer-Profil bleiben ohne Zuordnung. | Planning areas with fewer than 300 residents or an outlier profile remain unclassified. |
| coverageGaps[1] | Aggregat-Daten je rund 7.500 Einwohner:innen. Mikro-Lagen verschwinden im Mittel. | Aggregate data for around 7,500 residents each. Micro-locations disappear in the average. |
| omissions[0] | Einzel-Indikatoren wie Arbeitslosenquote oder Transferbezug-Quote werden bewusst nicht in der Adress-Anzeige ausgespielt. Sie wären auf Adress-Ebene schärfer und stigmatisierender als das Aggregat. | Individual indicators such as the unemployment rate or the rate of welfare receipt are deliberately not shown in the address view. At address level they would be sharper and more stigmatising than the aggregate. |
| omissions[1] | Keine Bewertung als „guter" oder „schlechter" Kiez. Niedriger Status spiegelt strukturelle Unterschiede in Einkommen, Beschäftigung und Bildung, keine Wohnqualität. | No rating as a “good” or “bad” Kiez. Low status reflects structural differences in income, employment and education, not housing quality. |

### `laerm-2023`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Modellierte Lärm-Gesamtbelastung pro LOR-Planungsraum aus dem Berliner Umweltatlas 2023. Aggregation in Kategorien gering bis sehr hoch. | Modelled overall noise pollution per LOR planning area from the Berlin Environmental Atlas (Umweltatlas) 2023. Aggregated into categories from low to very high. |
| updateFrequency | alle 5 Jahre (EU-Umgebungslärm-Richtlinie) | every 5 years (EU Environmental Noise Directive) |
| coverageGaps[0] | Modellwerte, keine flächendeckenden Mess-Stationen. | Model values, no city-wide network of monitoring stations. |
| coverageGaps[1] | Innenraum-Lärm in Wohnungen bleibt unberücksichtigt. | Indoor noise in flats is not taken into account. |
| omissions[0] | Keine Trennung nach Quelle (Straße, Schiene, Flug) auf dieser Aggregat-Ebene. | No breakdown by source (road, rail, air traffic) at this aggregate level. |
| omissions[1] | Nachtruhe-Kennwerte separat im Umweltatlas, hier nur Gesamtbelastung. | Night-time noise indicators are separate in the Environmental Atlas, this layer shows overall pollution only. |

### `luft-2023`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Modellierte Stickoxid- und Feinstaub-Belastung pro LOR-Planungsraum aus dem Berliner Umweltatlas 2023. Verkehrsmodell plus Mess-Stationen. | Modelled nitrogen oxide and particulate matter pollution per LOR planning area from the Berlin Environmental Atlas (Umweltatlas) 2023. Traffic model plus monitoring stations. |
| updateFrequency | alle 3 bis 5 Jahre | every 3 to 5 years |
| coverageGaps[0] | Aggregat pro Planungsraum, einzelne Hot-Spots gemittelt. | Aggregate per planning area, individual hotspots are averaged out. |
| omissions[0] | Pollen- und Allergen-Belastung sind nicht enthalten. | Pollen and allergen exposure are not included. |

### `bioklima-2023`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Bioklimatische Sommer-Belastung pro LOR-Planungsraum aus dem Umweltatlas 2023. Indikator für Hitzeinsel-Effekte und Versiegelung. | Bioclimatic summer stress per LOR planning area from the Environmental Atlas 2023. An indicator of urban heat island effects and soil sealing. |
| updateFrequency | alle 5 Jahre | every 5 years |
| coverageGaps[0] | Aggregat pro Planungsraum, Mikroklima im Hof unsichtbar. | Aggregate per planning area, the microclimate in courtyards is invisible. |

### `gruenversorgung-2023`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün pro LOR-Planungsraum aus dem Umweltatlas 2023. Skala gering bis sehr hoch. | Per-capita provision of usable public green space per LOR planning area from the Environmental Atlas 2023. Scale from low to very high. |
| updateFrequency | alle 5 Jahre | every 5 years |
| omissions[0] | Private Gärten und Hofflächen zählen nicht zur Pro-Kopf-Versorgung. | Private gardens and courtyards do not count towards per-capita provision. |

### `umweltgerechtigkeit-2023`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Kombinierter Index aus Lärm, Luft, Bioklima und Grünversorgung gewichtet mit sozialem Status. Identifiziert Mehrfachbelastung pro LOR-Planungsraum. | Combined index of noise, air, bioclimate and green space provision, weighted with social status. Identifies multiple burdens per LOR planning area. |
| updateFrequency | alle 3 bis 5 Jahre | every 3 to 5 years |
| coverageGaps[0] | Vor-Aggregat aus vier Einzel-Layern. Doppelzählung in Cross-Layer-Indices vermeiden. | Pre-aggregate of four individual layers. Avoid double counting in cross-layer indices. |
| omissions[0] | Keine personenbezogene Bewertung, nur Stadtteil-Aggregat. | No assessment of individuals, only a neighbourhood-level aggregate. |

### `klima-pet-2022`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Physiologisch Äquivalente Temperatur (PET) an einem Hitzetag um 14 Uhr aus der Berliner Klimaanalyse 2022. Modelliert für 10×10 Meter Raster, hier auf Polygon-Geometrie reduziert. | Physiological Equivalent Temperature (PET) on a hot day at 2 pm from the Berlin Climate Analysis 2022. Modelled on a 10 × 10 metre grid, reduced to polygon geometry here. |
| updateFrequency | unregelmäßig (zuletzt 2022, davor 2015) | irregularly (last in 2022, previously 2015) |
| coverageGaps[0] | Nicht alle Stadtflächen modelliert. nearestPolygonFallbackKm fängt Lücken an Block-Rändern ab. | Not all urban areas are modelled. nearestPolygonFallbackKm covers gaps at block edges. |
| omissions[0] | Nachtwerte werden separat ausgewiesen. | Night-time values are reported separately. |

### `klima-kaltlufteinwirkbereich-2022`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Stadtgebiete, die nachts von Kaltluft aus Wäldern, Wiesen und Parks profitieren. Quelle: Berliner Klimaanalyse 2022. | Urban areas that benefit at night from cold air from forests, meadows and parks. Source: Berlin Climate Analysis 2022. |
| updateFrequency | unregelmäßig | irregularly |

### `klima-leitbahnkorridor-2022`

Behörde: `senatsvw-umwelt`

| Feld | DE | EN |
|---|---|---|
| calculation | Talraum-Strukturen, Straßenzüge und Freiflächen, durch die nachts Kaltluft in die Stadt strömt. | Valley structures, street corridors and open spaces through which cold air flows into the city at night. |
| updateFrequency | unregelmäßig | irregularly |
| omissions[0] | Bebauung in Korridoren bremst die Kühlung. Layer zeigt nur Geometrie, keine Verlustrechnung. | Buildings in the corridors slow down the cooling. The layer shows geometry only, no calculation of losses. |

### `stolpersteine`

Behörde: `stolpersteine-initiativen` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | Standorte der vor letzten frei gewählten Wohnorten verlegten Messing-Plaketten für NS-Opfer. Konzept Gunter Demnig, Daten aus OpenStreetMap, gepflegt von lokalen Initiativen. | Locations of the brass plaques for victims of National Socialism, laid in front of their last freely chosen homes. Concept by Gunter Demnig, data from OpenStreetMap, curated by local initiatives. |
| updateFrequency | kontinuierlich (Verlegungen + OSM-Korrekturen) | continuously (new stones laid + OSM corrections) |
| coverageGaps[0] | Erfassung in OSM ist nicht vollständig. Nicht jedes verlegte Stein-Set ist gemappt. | Coverage in OSM is incomplete. Not every set of stones laid has been mapped. |
| omissions[0] | Personen-Biografien sind externe Primärquellen (stolpersteine-berlin.de). Wir generieren keine Texte. | Personal biographies come from external primary sources (stolpersteine-berlin.de). We do not generate any texts. |
| omissions[1] | Kein Wohn-Score, keine Bewertung, keine Verdichtungs-Statistik. Würde-Prinzip gemäß FR50 und FR51. | No housing score, no rating, no density statistics. Dignity principle under FR50 and FR51. |

### `kitas-2024`

Behörde: `senatsvw-bildung`

| Feld | DE | EN |
|---|---|---|
| calculation | Anerkannte Berliner Kindertageseinrichtungen 2024 als Punkt-Layer. Trägerschaft öffentlich, kirchlich oder frei. | Recognised Berlin daycare facilities 2024 as a point layer. Run by public, church or independent providers. |
| updateFrequency | jährlich | annually |
| omissions[0] | Keine Belegungsquoten oder Wartelisten-Daten. | No occupancy rates or waiting list data. |

### `schulen-2024`

Behörde: `senatsvw-bildung`

| Feld | DE | EN |
|---|---|---|
| calculation | Allgemeinbildende Schulen aus dem Berliner Schulverzeichnis 2024 als Punkt-Layer. | General education schools from the Berlin school directory 2024 as a point layer. |
| updateFrequency | jährlich | annually |
| omissions[0] | Keine Schul-Qualitäts-Bewertung. Inspektions-Berichte separat über Senatsverwaltung. | No rating of school quality. Inspection reports are available separately from the Senate Department. |

### `einschulbereiche-2024`

Behörde: `senatsvw-bildung`

| Feld | DE | EN |
|---|---|---|
| calculation | Räumlich definierte Grundschul-Einzugsbereiche. Kinder werden in der Regel der Schule des Einschulbereichs ihres Wohnorts zugewiesen. | Spatially defined primary school catchment areas. As a rule, children are assigned to the school of the catchment area they live in. |
| updateFrequency | jährlich (zum Schuljahres-Wechsel) | annually (at the change of school year) |
| omissions[0] | Ausnahmen sind möglich, Layer zeigt nur die Regel-Zuordnung. | Exceptions are possible, the layer shows only the standard assignment. |

### `krankenhaeuser-plan`

Behörde: `senatsvw-gesundheit`

| Feld | DE | EN |
|---|---|---|
| calculation | Kliniken aus dem Berliner Krankenhausplan mit gesetzlichem Versorgungsauftrag. | Hospitals in the Berlin hospital plan (Krankenhausplan) with a statutory care mandate. |
| updateFrequency | fortlaufend (Plan-Änderungen) | ongoing (plan changes) |

### `krankenhaeuser-weitere`

Behörde: `senatsvw-gesundheit`

| Feld | DE | EN |
|---|---|---|
| calculation | Private oder spezialisierte Kliniken außerhalb des Krankenhausplans, häufig Reha- oder Privatkliniken. | Private or specialised hospitals outside the hospital plan, often rehabilitation or private clinics. |
| updateFrequency | fortlaufend | ongoing |

### `sportanlagen-2024`

Behörde: `senatsvw-inneres-sport`

| Feld | DE | EN |
|---|---|---|
| calculation | Sportstätten aus dem Bezirklichen Sportstättenverzeichnis 2024: Sportplätze, Hallen, Tennisanlagen, Schwimmbecken. | Sports venues from the Bezirk register of sports facilities 2024: sports grounds, halls, tennis facilities, swimming pools. |
| updateFrequency | jährlich | annually |

### `gruenanlagen`

Behörde: `bezirksamt-gruenflaeche`

| Feld | DE | EN |
|---|---|---|
| calculation | Öffentlich gewidmete Grün- und Erholungsflächen, gepflegt durch die Bezirks-Grünflächenämter. | Officially designated public green and recreational spaces, maintained by the Bezirk parks departments (Grünflächenämter). |
| updateFrequency | unregelmäßig (Bezirks-Pflege-Daten) | irregularly (Bezirk maintenance data) |

### `spielplaetze`

Behörde: `bezirksamt-gruenflaeche`

| Feld | DE | EN |
|---|---|---|
| calculation | Öffentlich zugängliche Kinderspielplätze aus dem Berliner Grünanlagen-Register. | Publicly accessible children’s playgrounds from the Berlin green spaces register (Grünanlagen-Register). |
| updateFrequency | fortlaufend | ongoing |
| omissions[0] | Keine Geräte-Inventur, keine Sanierungs-Status-Daten. | No inventory of play equipment, no data on refurbishment status. |

### `schwimmbaeder`

Behörde: `baeder-betriebe`

| Feld | DE | EN |
|---|---|---|
| calculation | Standorte der Berliner Bäder-Betriebe und vergleichbarer Einrichtungen: Hallenbäder, Sommerbäder, Kombibäder, Strandbäder. | Locations of Berliner Bäder-Betriebe and comparable facilities: indoor pools, outdoor summer pools, combined pools, lakeside bathing beaches. |
| updateFrequency | fortlaufend | ongoing |
| omissions[0] | Saisonale Öffnungszeiten und Eintrittspreise sind nicht enthalten. | Seasonal opening hours and admission prices are not included. |

### `trinkbrunnen`

Behörde: `wasser-betriebe` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | Standorte öffentlicher Trinkwasser-Brunnen der Berliner Wasserbetriebe, abgeleitet aus OpenStreetMap. | Locations of public drinking fountains operated by Berliner Wasserbetriebe, derived from OpenStreetMap. |
| updateFrequency | fortlaufend (OSM) | ongoing (OSM) |
| coverageGaps[0] | Layer aktiv Mai bis Oktober. Außerhalb der Saison Frostschutz-Abschaltung. | Layer active May to October. Switched off outside the season for frost protection. |

### `kuehle-orte`

Behörde: `navigator-redaktion-osm-kuehle-orte` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | Orte zum Abkühlen bei Hitze aus OpenStreetMap, redaktionell angereichert. Der Kühle-Score von 1 bis 5 folgt Typ und Bauart (5 Eishalle, 4 klimatisiert oder am Wasser, 3 kühler Massivbau). Von 659 recherchierten Orten fließen die 519 geeigneten in den Layer. | Places to cool down in the heat from OpenStreetMap, with editorial enrichment. The cool score from 1 to 5 follows type and construction (5 ice rink, 4 air-conditioned or by the water, 3 cool solid building). Of 659 places researched, the 519 suitable ones are included in the layer. |
| updateFrequency | fortlaufend (OSM + redaktionelle Anreicherung) | ongoing (OSM + editorial enrichment) |
| coverageGaps[0] | Klimatisierung ist selten belegbar: 29 von 659 Orten mit belegtem AC-Status, der Rest wahrscheinlich oder unbekannt. Der AC-Hinweis ist ein Indiz, keine Zusage. | Air conditioning can rarely be verified: 29 of 659 places have a verified AC status, the rest are likely or unknown. The AC note is an indication, not a guarantee. |
| omissions[0] | Kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang. Private Orte wie Malls und Kinos üben Hausrecht aus. | Not a replacement for public authorities, no legal entitlement to access. Private places such as malls and cinemas exercise their right to refuse entry (Hausrecht). |

### `radverkehrsnetz-2025`

Behörde: `senatsvw-mvku`

| Feld | DE | EN |
|---|---|---|
| calculation | Berliner Radverkehrsnetz inklusive Vorrangrouten 2025 nach dem Mobilitätsgesetz. Linien-Layer, abgeleitet aus offiziellen Geo-Daten. | Berlin cycling network including cycling priority routes 2025 under the Berlin Mobility Act (Mobilitätsgesetz). Line layer, derived from official geodata. |
| updateFrequency | jährlich | annually |

### `fahrradstrassen-2024`

Behörde: `senatsvw-mvku-short`

| Feld | DE | EN |
|---|---|---|
| calculation | Straßen mit StVO-Zeichen 244.1 (Fahrradstraße). Andere Fahrzeuge nur ausnahmsweise und mit Schrittgeschwindigkeit. | Streets with sign 244.1 of the StVO, German road traffic regulations (bicycle street). Other vehicles only by exception and at walking pace. |
| updateFrequency | jährlich | annually |

### `ubahn-stationen`

Behörde: `bvg` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | BVG-U-Bahnhöfe aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG. | BVG U-Bahn stations from OpenStreetMap route relations, filtered by operator BVG. |
| updateFrequency | fortlaufend (OSM) | ongoing (OSM) |

### `sbahn-stationen`

Behörde: `sbahn` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | S-Bahn-Bahnhöfe aus OpenStreetMap (railway=station, station=light_rail). | S-Bahn stations from OpenStreetMap (railway=station, station=light_rail). |
| updateFrequency | fortlaufend | ongoing |

### `tram-haltestellen`

Behörde: `bvg` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | BVG-Tram-Haltestellen aus OpenStreetMap, vor allem im Ostteil der Stadt. | BVG tram stops from OpenStreetMap, mainly in the eastern part of the city. |
| updateFrequency | fortlaufend | ongoing |

### `bus-haltestellen`

Behörde: `bvg` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | BVG-Bushaltestellen Stadt- und Regionalbusse aus OpenStreetMap. | BVG bus stops for city and regional buses from OpenStreetMap. |
| updateFrequency | fortlaufend | ongoing |

### `ubahn-netz`

Behörde: `bvg` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | BVG-U-Bahn-Linienverlauf 9 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG. | BVG U-Bahn line routes, 9 lines, from OpenStreetMap route relations, filtered by operator BVG. |
| updateFrequency | fortlaufend | ongoing |

### `tram-netz`

Behörde: `bvg` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | BVG-Straßenbahn-Linienverlauf 22 Linien aus OpenStreetMap. | BVG tram line routes, 22 lines, from OpenStreetMap. |
| updateFrequency | fortlaufend | ongoing |

### `sbahn-netz`

Behörde: `sbahn` + OSM-Suffix

| Feld | DE | EN |
|---|---|---|
| calculation | Linienverlauf des Berliner S-Bahn-Netzes 16 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator S-Bahn Berlin GmbH. | Routes of the Berlin S-Bahn network, 16 lines, from OpenStreetMap route relations, filtered by operator S-Bahn Berlin GmbH. |
| updateFrequency | fortlaufend | ongoing |

### `kiez-score-ruhe-luft`

Behörde: `navigator-eigenberechnung-senats-daten`

| Feld | DE | EN |
|---|---|---|
| calculation | Gewichtete Aggregation aus Lärm und Luft pro Planungsraum (Lärm 0.5, Luft 0.5). Lärm seit Story 10.6b als dB-Mittel (L_DEN) aus den Fassadenpunkten der Strategischen Lärmkarte 2022: ≤45 dB → 100, ≥75 dB → 0, linear. Luft als 3-Stufen-Index (gering bis hoch). Beides auf 0–100 normalisiert, Centroid-genau pro LOR-Polygon. Bioklima zählt seit der Score-Neuordnung unter Grün & Hitze. | Weighted aggregation of noise and air per planning area (noise 0.5, air 0.5). Since story 10.6b, noise is a dB average (L_DEN) from the facade points of the 2022 strategic noise map: ≤45 dB → 100, ≥75 dB → 0, linear. Air as a 3-level index (low to high). Both normalised to 0–100, centroid-accurate per LOR polygon. Since the score reorganisation, bioclimate counts under Green & heat. |
| updateFrequency | alle 3 bis 5 Jahre (sync mit Umweltatlas-Update) | every 3 to 5 years (in sync with Environmental Atlas updates) |
| coverageGaps[0] | Lärm-dB ist das Mittel über die Fassadenpunkte im LOR; ruhige Hinterhöfe ohne Fassadenpunkt fließen nicht ein. | Noise dB is the average across the facade points in the LOR; quiet back courtyards without a facade point are not included. |
| coverageGaps[1] | Modell-Werte, keine Mess-Stationen. Mikrolagen einzelner Adressen bleiben unsichtbar. | Model values, no monitoring stations. Micro-locations of individual addresses remain invisible. |
| omissions[0] | Innenraum-Belastung in Wohnungen nicht enthalten. | Indoor exposure in flats not included. |
| omissions[1] | Keine getrennte Wertung nach Quelle (Straße, Schiene, Flug). | No separate rating by source (road, rail, air traffic). |

### `kiez-score-gruen-hitze`

Behörde: `navigator-eigenberechnung-senats-daten`

| Feld | DE | EN |
|---|---|---|
| calculation | Nutzbares Grün und Hitzeschutz pro Planungsraum: Grünversorgung 0.30, Grünanlagen-Nähe 0.15, Bioklima 0.20, PET-Hitzebelastung 0.15, Kaltluft-Einwirkbereich 0.10, Leitbahnkorridor 0.10. PET zählt invertiert (kühler = mehr Punkte). Normalisiert auf 0–100. | Usable green space and heat protection per planning area: green space provision 0.30, proximity to green spaces 0.15, bioclimate 0.20, PET heat stress 0.15, cold air influence zone 0.10, cold air flow corridor 0.10. PET counts inversely (cooler = more points). Normalised to 0–100. |
| updateFrequency | alle 5 Jahre | every 5 years |
| coverageGaps[0] | Private Gärten und Höfe zählen nicht zur öffentlichen Grünversorgung. | Private gardens and courtyards do not count towards public green space provision. |
| coverageGaps[1] | PET variiert auf Block-Ebene stark, im LOR-Aggregat geglättet. | PET varies strongly at block level and is smoothed out in the LOR aggregate. |
| omissions[0] | Qualität und Pflege-Zustand der Parks nicht enthalten. | Quality and state of maintenance of parks not included. |

### `kiez-score-mobilitaet`

Behörde: `navigator-eigenberechnung-osm-radverkehr`

| Feld | DE | EN |
|---|---|---|
| calculation | Distance-basiert vom Adress-Punkt zu nächster U-Bahn (0.35), S-Bahn (0.25), Tram (0.20) und Bus (0.10) Haltestelle plus Berlin-weite Radverkehrs-Presence (0.10). 0 m entspricht 100, 1.000 m entspricht 0, linear interpoliert. | Distance-based, from the address point to the nearest U-Bahn (0.35), S-Bahn (0.25), tram (0.20) and bus (0.10) stop, plus Berlin-wide cycling network presence (0.10). 0 m equals 100, 1,000 m equals 0, linearly interpolated. |
| updateFrequency | fortlaufend (OSM) | ongoing (OSM) |
| coverageGaps[0] | Taktfrequenz und Linien-Angebot der Haltestelle nicht berücksichtigt. | Service frequency and range of lines at the stop not taken into account. |
| coverageGaps[1] | Barrierefreiheit der Stops nicht gewertet. | Accessibility of stops not rated. |
| omissions[0] | Sharing-Angebote (Bike, Scooter, Car) nicht enthalten. | Sharing services (bike, scooter, car) not included. |
| omissions[1] | Fußwege-Qualität jenseits der Luftlinie nicht abgebildet. | Quality of walking routes beyond straight-line distance not represented. |

### `kiez-score-versorgung`

Behörde: `navigator-eigenberechnung-bezirke`

| Feld | DE | EN |
|---|---|---|
| calculation | Kita doppelt gemessen: Distanz zur nächsten Kita (Gewicht 0.12, Threshold 500 m) plus Plätze pro Kind 0-6 im Planungsraum (0.12). Der Pro-Kopf-Term summiert die gemeldeten Kita-Plätze (e_platz) im LOR und teilt durch die Kinder 0-6 aus dem Einwohner-Datensatz: ab 0.35 Plätzen pro Kind volle Punktzahl, linear darunter. Die Erreichbarkeit zählt dabei die Anzahl Einrichtungen im Radius (Dichte), nicht nur die nächste: mehr Kitas/Schulen/Spielplätze im Umkreis scoren höher, ein einzelner Standort weniger. Schule nach Schulart getrennt: Grundschule (0.12, Radius 600 m) und weiterführende Schule (0.12, 1.200 m). Plus Spielplatz-Dichte (0.10, 400 m) und Nahversorgung aus OpenStreetMap (ODbL): Lebensmittel (0.12, 500 m: Supermarkt, Discounter, Spätkauf, Bäcker), Apotheke (0.07, 800 m) und Post-/Paketstelle (0.05, 1.000 m). Liegt keine Einrichtung im Radius, greift ein weicher Übergang über die Distanz zur nächsten statt eines harten Abbruchs. Plan-Krankenhaus (0.18, 2.000 m) zusätzlich nach Bettenkapazität gewichtet: ein großes Versorgungs-Klinikum zählt mehr als eine kleine Fachklinik. 0 m → 100, Threshold → 0, linear. Spielplätze (Polygone) nutzen den Geometrie-Mittelpunkt als POI-Punkt. Grünanlagen zählen seit der Score-Neuordnung unter Grün & Hitze. Versorgung umfasst damit öffentliche Daseinsvorsorge und private Alltags-Nahversorgung; die internen Gewichte sind vorläufig (finale Kalibrierung in Epic 12 Story 12.3). | Daycare measured twice: distance to the nearest daycare centre (weight 0.12, threshold 500 m) plus places per child aged 0–6 in the planning area (0.12). The per-capita term sums the registered daycare places (e_platz) in the LOR and divides them by the children aged 0–6 from the resident dataset: full points from 0.35 places per child, linear below that. Accessibility counts the number of facilities within the radius (density), not just the nearest one: more daycare centres/schools/playgrounds nearby score higher, a single location lower. Schools split by type: primary school (0.12, radius 600 m) and secondary school (0.12, 1,200 m). Plus playground density (0.10, 400 m) and local shops from OpenStreetMap (ODbL): groceries (0.12, 500 m: supermarket, discounter, Späti, bakery), pharmacy (0.07, 800 m) and post/parcel point (0.05, 1,000 m). If there is no facility within the radius, a soft transition based on the distance to the nearest one applies instead of a hard cut-off. Hospital in the Berlin hospital plan (0.18, 2,000 m) additionally weighted by bed capacity: a large general hospital counts more than a small specialist clinic. 0 m → 100, threshold → 0, linear. Playgrounds (polygons) use the geometric centre as the POI point. Since the score reorganisation, green spaces count under Green & heat. Local amenities therefore cover public services and private everyday local shops; the internal weights are provisional (final calibration in Epic 12 Story 12.3). |
| updateFrequency | jährlich (sync mit Bildungs- und Bezirks-Daten) | annually (in sync with education and Bezirk data) |
| coverageGaps[0] | Der Platz-Kind-Quotient basiert auf gemeldeten Kapazitäten (e_platz), nicht auf realen Belegungsquoten oder Wartelisten. | The places-per-child ratio is based on registered capacity (e_platz), not on actual occupancy rates or waiting lists. |
| coverageGaps[1] | Belegungsquoten, Wartelisten und Trägerschaft sind im Score nicht berücksichtigt. | Occupancy rates, waiting lists and type of provider are not taken into account in the score. |
| coverageGaps[2] | Polygon-Layer kollabieren zum Mittelpunkt. Ein langgezogener Park am Rand erscheint im Score zentriert. | Polygon layers collapse to their centre. A long, narrow park on the edge appears centred in the score. |
| coverageGaps[3] | Nahversorgung (Lebensmittel, Apotheke, Post) basiert auf OpenStreetMap (Crowdsourcing): einzelne Standorte können fehlen oder veraltet sein. | Local shops (groceries, pharmacy, post) are based on OpenStreetMap (crowdsourcing): individual locations may be missing or out of date. |
| omissions[0] | Keine Qualitäts-Bewertung der Einrichtung (Layer zeigt nur Standort). | No quality rating of the facility (the layer shows the location only). |
| omissions[1] | Privat-Krankenhäuser und Reha-Kliniken bleiben außen vor (nur Plan-Krankenhäuser). | Private hospitals and rehabilitation clinics are left out (hospitals in the Berlin hospital plan only). |

### `kiez-score-wohnschutz`

Behörde: `navigator-eigenberechnung-senats-daten`

| Feld | DE | EN |
|---|---|---|
| calculation | Verdrängungsschutz pro Planungsraum: Liegt der Raum in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebauliche Erhaltungssatzung, ODER-verknüpft), gilt Schutz als vorhanden (100), sonst 0. Auf Bezirksregion/Bezirk flächen-gewichteter Anteil geschützter Planungsräume. Positiv eindeutig: mehr Schutz ist besser. | Protection against displacement per planning area: if the area lies in a Milieuschutz area (residential preservation statute or urban preservation statute, combined with OR), protection counts as in place (100), otherwise 0. At Bezirksregion/Bezirk level, the area-weighted share of protected planning areas. Unambiguously positive: more protection is better. |
| updateFrequency | fortlaufend (Bezirks-Verordnungen) | ongoing (Bezirk orders) |
| coverageGaps[0] | Schutz-Status sagt nichts über die tatsächliche Mietentwicklung im Gebiet. | Protection status says nothing about actual rent trends in the area. |
| coverageGaps[1] | Gebiets-Grenzen ändern sich durch neue Verordnungen, der Datenstand kann nachlaufen. | Area boundaries change with new orders, the data may lag behind. |
| omissions[0] | Umwandlungsverbot, Vorkaufsrecht und Genehmigungspraxis einzelner Bezirke nicht abgebildet. | Conversion ban, right of first refusal and approval practice of individual Bezirke not represented. |
| omissions[1] | Keine Aussage über konkrete Miethöhe oder Verdrängungsdruck. | No statement on actual rent levels or displacement pressure. |

### `kiez-score-kultur`

Behörde: `navigator-eigenberechnung-bezirke`

| Feld | DE | EN |
|---|---|---|
| calculation | Kultureller Zugang pro Planungsraum: log-gedämpfte Dichte kulturkollektiver POIs im Umkreis (Anzahl Einrichtungen, der erste Ort zählt stark, weitere flachen ab). Bibliothek (Gewicht 0.20, 1.000 m), Theater (0.15, 1.500 m), Museum (0.15, 1.500 m), Kino (0.12, 1.500 m), Soziokultur (0.13, 1.200 m), Galerie (0.10, 1.200 m), Kunst im Stadtraum (0.08, 800 m), Club (0.07, 1.200 m). Quelle OpenStreetMap (ODbL). Eigenständige Dimension, NICHT im Gesamt-Score (Option C): Kultur ballt sich in der Innenstadt, daher kein Headline-Treiber. Die Log-Dämpfung verhindert, dass Außenbezirke flächendeckend auf null fallen. | Cultural access per planning area: log-damped density of collective cultural POIs nearby (number of facilities, the first place counts strongly, further ones level off). Library (weight 0.20, 1,000 m), theatre (0.15, 1,500 m), museum (0.15, 1,500 m), cinema (0.12, 1,500 m), community culture centre (0.13, 1,200 m), gallery (0.10, 1,200 m), public art (0.08, 800 m), club (0.07, 1,200 m). Source OpenStreetMap (ODbL). A separate dimension, NOT part of the overall score (Option C): culture clusters in the city centre, so it does not drive the headline score. Log damping prevents outer Bezirke from dropping to zero across the board. |
| updateFrequency | fortlaufend (OSM-Sync) | ongoing (OSM sync) |
| coverageGaps[0] | Kulturorte aus OpenStreetMap (Crowdsourcing): einzelne Standorte können fehlen oder veraltet sein. | Cultural venues from OpenStreetMap (crowdsourcing): individual locations may be missing or out of date. |
| coverageGaps[1] | Innen-Außen-Gefälle ist real: Kulturinfrastruktur konzentriert sich in der Innenstadt. | The gap between inner city and outskirts is real: cultural infrastructure is concentrated in the city centre. |
| omissions[0] | Keine Bewertung von Programm, Qualität oder Eintrittspreis der Einrichtung. | No rating of programme, quality or admission price of the venue. |
| omissions[1] | Stolpersteine und Denkmale zählen NICHT (Memorial/Heritage, keine Kultur-Amenity). | Stolpersteine and monuments do NOT count (memorial/heritage, not a cultural amenity). |

### `kiez-score-kriminalitaet`

Behörde: `navigator-eigenberechnung-kriminalitaetsatlas`

| Feld | DE | EN |
|---|---|---|
| calculation | Erfasste Kriminalität pro Bezirksregion: Häufigkeitszahl (Fälle pro 100.000 Einwohner) ausgewählter wohn-relevanter Delikte, gleichgewichtet (je 0.20): Kieztaten, Wohnraumeinbruch, Sachbeschädigung, Straßenraub/Handtaschenraub, Fahrraddiebstahl. Pro Delikt das 3-Jahres-Mittel (2023–2025), daraus der gewichtete Index, normalisiert auf 0–100 (300 → 0, ab 1750 → 100). Die Obergrenze kappt City-Core-Ausreißer (Regierungsviertel, Alexanderplatz), deren Häufigkeitszahl durch Touristen und Pendler überzeichnet ist. Die Werte liegen nur je Bezirksregion vor und werden auf die enthaltenen Planungsräume gespiegelt (innerhalb der Bezirksregion konstant). Eigenständige Dimension, NICHT im Gesamt-Score (Option C), Strukturell-Kontext wie die Soziale Lage. Höher heißt mehr erfasste Fälle, kein Sicherheits-Ranking. | Recorded crime per Bezirksregion: frequency rate (cases per 100,000 residents) of selected housing-relevant offences, equally weighted (0.20 each): neighbourhood offences (Kieztaten), residential burglary, vandalism, street robbery/bag snatching, bicycle theft. For each offence the 3-year average (2023–2025), from which the weighted index is derived, normalised to 0–100 (300 → 0, from 1,750 → 100). The upper limit caps city-centre outliers (government quarter, Alexanderplatz) whose frequency rate is overstated by tourists and commuters. The values are only available per Bezirksregion and are mirrored onto the planning areas it contains (constant within the Bezirksregion). A separate dimension, NOT part of the overall score (Option C), structural context like the social situation. Higher means more recorded cases, not a safety ranking. |
| updateFrequency | jährlich (Kriminalitätsatlas, Stichtag 31.12.) | annually (Kriminalitätsatlas, reference date 31 Dec) |
| coverageGaps[0] | Granularität Bezirksregion (143), gröber als die fünf Planungsraum-nativen Dimensionen. | Granularity Bezirksregion (143), coarser than the five dimensions native to planning areas. |
| coverageGaps[1] | Häufigkeitszahl bezieht Fälle nur auf gemeldete Einwohner, nicht auf Touristen, Pendler oder Kundschaft: innerstädtische Hotspots erscheinen überzeichnet. | The frequency rate relates cases only to registered residents, not to tourists, commuters or customers: inner-city hotspots appear overstated. |
| coverageGaps[2] | Dunkelfeld: nur angezeigte Fälle, das Anzeigeverhalten variiert räumlich. | Unreported crime: only reported cases, and reporting behaviour varies by location. |
| omissions[0] | Tatortprinzip: nur Fälle mit exaktem Tatort, Taschendiebstahl ausgeschlossen. | Crime scene principle: only cases with an exact crime scene, pickpocketing excluded. |
| omissions[1] | Keine Aussage über persönliches Risiko und keine Wertung als „sicherer" oder „gefährlicher" Kiez. | No statement on personal risk and no rating as a “safer” or “more dangerous” Kiez. |

## Abnahme

Matze 27.09. 10:59 („wie du empfiehlst“):
- Behördennamen: überall die offiziellen englischen Namen laut berlin.de, auch in C1 (`layer_explain_kitas_2024_long`, `…_krankenhaeuser_plan_long`, `…_krankenhaeuser_weitere_long` werden nachgezogen).
- OSM-Suffix auf EN „OpenStreetMap contributors (ODbL 1.0)“, DE unverändert.
- Interne Verweise („story 10.6b“, „Epic 12 Story 12.3“, „FR50 und FR51“, „Option C“) bleiben in C2 wörtlich, Bereinigung DE+EN vorgemerkt (`deferred-work.md`).
- Übrige unsichere Punkte wie übersetzt.
