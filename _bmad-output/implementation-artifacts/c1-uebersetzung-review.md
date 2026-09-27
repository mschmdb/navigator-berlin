# Review: i18n C1 · Hinweistexte und Layer-Erklärungen (DE → EN-GB)

Quelle DE: `editorial-disclaimer.svelte` (`DISCLAIMER_TEXTS_DE`) und `layer-explain.ts` (`LAYER_EXPLAIN_DE`, `LAYER_EXTERNAL_LINK`). DE-Spalte wörtlich aus dem Code. Maschinenlesbar: `translations.json`.

## Übersetzungsentscheidungen

- „Kiez-Score“ im Fließtext als „Kiez score“ (wie `inspector_kiez_score_heading`, `compare_*`). Die Layer-Namen in en.json schreiben „Kiez score“. Eine Schreibweise festlegen.
- Dimensionen aus `atlas_dimension_label_*`: Quiet & air, Green & heat, Mobility, Local amenities, Tenant protection, Culture. „Versorgung“ im Fließtext daher „local amenities“, „Versorgungs-Dimension“ → „Local amenities dimension“.
- „Mietspiegel“ → „rent index“, „Wohnlage“ → „residential area“ (wie Layer-Name „Rent index: residential area 2024“). „bestlage“ → „prime location“.
- „Bodenrichtwert“ → „standard land value“. `compare-bodenrichtwerte` übernimmt `compare_advisory_bodenrichtwerte` wörtlich.
- „Häufigkeitszahl“ → „frequency rate“ (wie Home-Teaser). „Dunkelfeld“ → „unreported crime“.
- „Umweltatlas“ → „Berlin Environmental Atlas (Umweltatlas)“ im Langtext, „Environmental Atlas 2023“ im Kurztext. „Klimaanalyse 2022“ → „Berlin Climate Analysis 2022“.
- Behörden: „Senate Department for …“ ohne neu erfundene Abkürzungen. SenStadt, SenMVKU, BBB, BVG bleiben. „Amt für Statistik“ wie `wahl_label_source_amt_fuer_statistik`.
- Wahl-Begriffe aus `wahl_label_*`: polling district, postal district (group), repeat election, Bundestag election, Berlin House of Representatives (Abgeordnetenhaus), District Assembly (BVV). In Kurztexten nur „House of Representatives“.
- „Einwohner:innen“/„EW“ → „residents“, Einheit „EW/km²“ → „residents/km²“ (wie `atlas_value_einwohner_pro_km2`).
- Zahlen im englischen Format: 7.500 → 7,500, 2.000 → 2,000, 5000 → 5,000, 7000 → 7,000. Uhrzeiten: 14 Uhr → 2 pm, 22 bis 6 Uhr → 10 pm to 6 am, 31.12.2024 → 31 Dec 2024.
- Deutsche Anführungszeichen „…" → “…”. Slugs, Pfade (`/methodik/kiez-score`) und Lizenzkürzel (dl-de/zero, dl-de-by-2.0, ODbL 1.0, CC BY 4.0) unverändert.
- Deutsch belassen mit Erklärung in Klammern: Bezirksamt, Gutachterausschuss, Grünflächenamt, Mietspiegel-Rechner, Mobilitätsgesetz, Kriminalitätsatlas, Lebensweltlich orientierter Raum, Prognoseraum. Ohne Erklärung: Gymnasium, Gründerzeit, Späti, Berliner Wasserbetriebe, Berliner Bäder-Betriebe.
- „NS-Opfer“ → „victims of National Socialism“ bzw. „victims of the Nazi regime“ (Stolpersteine-Langtext).
- „Ein Angebot, kein Behörden-Ersatz“ → „An offer, not a replacement for public authorities“.
- Legacy-Slugs mit gleichem Anspruch übersetzt, „Legacy-Slug“ bleibt „legacy slug“.

## Unsicher

- `legal`: „Ersetzt keine rechtliche Aussage.“ → „Not legal advice.“ Alternative „Not legal advice.“ klingt idiomatischer, verschiebt aber den Sinn.
- `kiez-score-explainer`, `kiez-score-gesamt`: „eindeutige Besser-Richtung“ → „a clear direction of “better”“. Die Formulierung wirkt holprig. Alternative: „where it is clear which direction is better“.
- `laerm-2023` long: „Indikator für Verdrängung der Wohnruhe“ → „An indicator of lost residential quiet“. Das DE-Original ist schon unscharf.
- `sportanlagen-2024`: „Bezirkliches Sportstättenverzeichnis 2024“ → „Bezirk register of sports facilities 2024“. Unklar, ob es ein offizieller Name ist.
- `krankenhaeuser-plan`: „Plan-Krankenhaus“ → „plan hospital“. Im Englischen kein etablierter Begriff. Alternative: „hospital in the hospital plan“.
- `lor-*`: „Lebensweltlich orientierter Raum“ → „Life-world-oriented area (Lebensweltlich orientierter Raum)“. „Prognoseraum“ → „forecast area (Prognoseraum)“ nur im Kurztext, im Langtext deutsch.
- `fahrradstrassen-2024`: „Zeichen 244.1 StVO“ → „sign 244.1 of the StVO, German road traffic regulations“. Prüfen, ob die Erklärung stört.
- `schwimmbaeder`: „Kombibad“ → „combined pool“, „Strandbad“ → „lakeside bathing beach“. Keine festen englischen Begriffe.
- `kiez-score-ruhe-luft`: „Cloud-Dancer-Skala“ → „Cloud Dancer scale“. Interner Name der Farbskala. Für Nutzer:innen in beiden Sprachen unklar.
- `kiez-score-wohnschutz`: „Erhaltungssatzung Wohnraum oder städtebaulich“ → „residential or urban preservation statute“. Die anderen Milieuschutz-Texte sagen „preservation order“ (DE: Verordnung). Die Wortwahl folgt dem DE-Unterschied.
- `klimaanalyse` short: „Senatsverwaltung“ ohne Ressort → „Senate Department“. Das Ressort fehlt schon im Original.
- `/methodik/kiez-score`: Pfad unverändert. Unklar, ob EN-Seiten auf `/en/methodik/...` zeigen sollen. Das ist eine Frage an die Implementierung, nicht an die Übersetzung.
- `compare-stigma-footer`: „pro Lage“ → „per area“. „Lage“ könnte auch „location“ heißen.

## Hinweistexte (Disclaimer)

| Variante | DE | EN |
|---|---|---|
| `legal` | Ersetzt keine rechtliche Aussage. | Not legal advice. |
| `historic` | Historischer Stand. Geometrie aus OpenStreetMap-Community-Daten. | Historical record. Geometry from OpenStreetMap community data. |
| `seasonal` | Layer aktiv Mai–Oktober. November–April außerhalb der Saison. | Layer active May–October. November–April out of season. |
| `source` | Personen-Hintergrund aus zitierter Quelle. Nicht algorithmisch generiert. | Personal background taken from the cited source. Not generated algorithmically. |
| `kuehle-orte` | Geometrie aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle Anreicherung. Ein Angebot, kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang. | Geometry from OpenStreetMap (ODbL), supplemented with editorial enrichment. An offer, not a replacement for public authorities, and no legal entitlement to access. |
| `compare-stolperstein` | Stolpersteine sind Erinnerung an NS-Opfer, kein Wohn-Bewertungs-Kriterium. Wir zählen nur, ohne zu vergleichen oder zu werten. | Stolpersteine commemorate victims of National Socialism. They are not a criterion for rating where to live. We only count them, without comparing or judging. |
| `compare-mietspiegel` | Mietspiegel-Wohnlage ist keine Wohnqualität. Niedrigere Stufe heißt nicht „schlechter". | The rent index residential area class is not a measure of housing quality. A lower class does not mean “worse”. |
| `compare-bodenrichtwerte` | Höherer Bodenrichtwert kann teurere Miete bedeuten, oft aber auch bessere Versorgung. Wir zeigen die Differenz, ohne Bewertung. | A higher standard land value can mean pricier rent, but often better amenities too. We show the difference without judging it. |
| `compare-stigma-footer` | Aggregierte Daten pro Lage spiegeln statistische Mittel wider, nicht individuelle Wohnsituationen. | Aggregated data per area reflect statistical averages, not individual living situations. |
| `mss-aggregat` | Strukturelle Aggregat-Daten pro Planungsraum (rund 7.500 Einwohner:innen). Einzelne Adressen oder Personen sind dadurch nicht abgebildet. Stand: SenStadt MSS 2025. | Structural aggregate data per planning area (around 7,500 residents). They do not represent individual addresses or people. As of: SenStadt MSS 2025. |
| `compare-mss-aggregat` | Wir zeigen die Stufe, ohne Bewertung. Niedriger Status heißt nicht „schlechter Kiez". Daten je Planungsraum, nicht je Adresse. | We show the level without judging it. Low status does not mean “bad Kiez”. Data per planning area, not per address. |
| `kiez-score-explainer` | Umwelt- & Infrastruktur-Score aus fünf Dimensionen pro Planungsraum (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz). Misst nur Größen mit eindeutiger Besser-Richtung. Sozialstruktur und Bezahlbarkeit bewusst nicht enthalten. | Environment & infrastructure score from five dimensions per planning area (Quiet & air, Green & heat, Mobility, Local amenities, Tenant protection). Only measures variables where it is clear which direction is better. Social structure and affordability are deliberately excluded. |
| `kriminalitaet-aggregat` | Häufigkeitszahl je Bezirksregion, nicht adressgenau. Sie misst erfasste Fälle pro gemeldete Einwohner, kein persönliches Risiko. Touristen- und Pendler-Orte erscheinen überzeichnet, das Dunkelfeld bleibt unerfasst. Kein Sicherheits-Ranking, fließt nicht in den Gesamt-Score. | Frequency rate per Bezirksregion, not address-level. It measures recorded cases per registered resident, not personal risk. Places with many tourists or commuters appear overstated, and unreported crime remains uncaptured. Not a safety ranking, not part of the overall score. |
| `cross-layer-template` | Werte aus verschiedenen Layern nebeneinander gestellt, ohne kausale Verknüpfung. Aggregat-Daten pro Planungsraum, nicht pro Adresse. | Values from different layers shown side by side, with no causal link. Aggregate data per planning area, not per address. |
| `brw-not-aggregatable` | Auf dieser Ebene nicht sinnvoll aggregierbar. Ein Median über das ganze Gebiet würde lokale Unterschiede verwischen, deshalb zeigen wir hier keinen Wert. | Cannot be meaningfully aggregated at this level. A median across the whole area would blur local differences, so we show no value here. |
| `level-below-threshold` | Auf dieser Ebene zu wenig Daten für eine belastbare Aussage. Wir zeigen lieber keinen Wert als einen irreführenden. | Too little data at this level for a reliable statement. We would rather show no value than a misleading one. |
| `quelle_ansehen` | Quelle ansehen | View source |

## Layer-Erklärungen

### A: Boundaries

#### `bezirke`

| Feld | DE | EN |
|---|---|---|
| short | Verwaltungsbezirk Berlins (12 insgesamt) | Administrative Bezirk of Berlin (12 in total) |
| long | Politisch-administrative Gliederung Berlins in 12 Bezirke. Jeder Bezirk hat eigenes Bezirksamt, Bezirksbürgermeister:in und eigenständige Schul-, Sport- und Gesundheitsämter. Quelle: ODIS Berlin (dl-de/zero). | Political and administrative division of Berlin into 12 Bezirke. Each Bezirk has its own Bezirk office (Bezirksamt), Bezirk mayor and its own school, sports and health offices. Source: ODIS Berlin (dl-de/zero). |

#### `ortsteile`

| Feld | DE | EN |
|---|---|---|
| short | Statistischer Ortsteil innerhalb des Bezirks | Statistical locality within the Bezirk |
| long | Berlin gliedert sich in 96 Ortsteile, historisch oft eigenständige Gemeinden. Genutzt für Statistik, Adress-Zuordnung und Identifikation (z.B. „Ich wohne in Friedrichshain"). Quelle: ODIS Berlin. | Berlin is divided into 96 localities (Ortsteile), historically often independent municipalities. Used for statistics, address assignment and identification (e.g. “I live in Friedrichshain”). Source: ODIS Berlin. |

#### `plz`

| Feld | DE | EN |
|---|---|---|
| short | Postleitzahlen-Region | Postcode area |
| long | Berliner Postleitzahlen-Gebiete. Eine PLZ kann mehrere Kieze oder Ortsteile umfassen, deckt sich also nicht mit Bezirks- oder Ortsteilgrenzen. Quelle: ODIS Berlin. | Berlin postcode areas. One postcode can cover several Kieze or localities, so it does not match Bezirk or locality boundaries. Source: ODIS Berlin. |

### B: Wohn-Daten

#### `bodenrichtwerte`

| Feld | DE | EN |
|---|---|---|
| short | Durchschnittlicher Grundstückspreis pro Quadratmeter (Stand 2026) | Average land price per square metre (as of 2026) |
| long | Vom Berliner Gutachterausschuss jährlich festgestellte Lagewerte für unbebauten Boden. Indikator für Bodenwert, kein Marktpreis und kein Mietpreis. Differenziert nach Nutzungsart (Wohnen, Gewerbe, Mischgebiet). | Location values for undeveloped land, set annually by the Berlin Committee of Valuation Experts (Gutachterausschuss). An indicator of land value, not a market price and not a rent. Differentiated by type of use (residential, commercial, mixed-use area). |
| valueScaleExplain | Höher = teurer (Innenstadt-Lagen oft >5000 €/m², Rand-Lagen <500 €/m²) | Higher = more expensive (inner-city locations often >5,000 €/m², outskirts <500 €/m²) |
| unit | €/m² | €/m² |

#### `wohnlagen-2024`

| Feld | DE | EN |
|---|---|---|
| short | Wohnlagen-Bewertung im Berliner Mietspiegel 2024 (Aggregat pro Planungsraum) | Residential area rating in the Berlin rent index 2024 (aggregate per planning area) |
| long | Aggregierte Wohnlagen-Einstufung aus dem Berliner Mietspiegel 2024 pro Planungsraum. Konkrete €/m² siehe offizieller Mietspiegel-Rechner. Einstufung beruht auf Lage, Verkehrsanbindung, Versorgung und Wohnumfeld. | Aggregated residential area classification from the Berlin rent index (Mietspiegel) 2024 per planning area. For concrete €/m², see the official rent index calculator. The classification is based on location, transport links, local amenities and residential surroundings. |
| valueScaleExplain | 1 einfach, 2 mittel, 3 gut, 4 sehr gut, 5 bestlage (Mietspiegel-Definition) | 1 simple, 2 medium, 3 good, 4 very good, 5 prime location (rent index definition) |

#### `milieuschutz-erhaltungsmiete`

| Feld | DE | EN |
|---|---|---|
| short | Milieuschutzgebiet (soziale Erhaltungsverordnung §172 BauGB) | Milieuschutz area (social preservation order, §172 BauGB) |
| long | Gebiet mit sozialer Erhaltungsverordnung. Schützt vor Verdrängung durch Modernisierung, Umwandlung in Eigentumswohnungen und Luxussanierung. Mietsteigerungen und Umbauten brauchen Genehmigung des Bezirks. | Area with a social preservation order. Protects against displacement through modernisation, conversion into owner-occupied flats and luxury refurbishment. Rent increases and conversions require approval from the Bezirk. |

#### `milieuschutz-staedtebau`

| Feld | DE | EN |
|---|---|---|
| short | Städtebauliche Erhaltungsverordnung (Stadtbildschutz nach §172 BauGB) | Urban preservation order (protection of townscape under §172 BauGB) |
| long | Gebiet mit städtebaulicher Erhaltungsverordnung zum Schutz des städtebaulichen Erscheinungsbildes. Abriss oder Veränderungen brauchen Genehmigung, häufig in Altbau- oder Gründerzeit-Quartieren. | Area with an urban preservation order protecting the townscape. Demolition or alterations require approval, often in old-building or Gründerzeit neighbourhoods. |

#### `mss-gesamtindex-2025`

| Feld | DE | EN |
|---|---|---|
| short | Strukturelle soziale Lage je Planungsraum (MSS 2025, SenStadt Berlin) | Structural social situation per planning area (MSS 2025, SenStadt Berlin) |
| long | Monitoring Soziale Stadtentwicklung 2025: aggregierter Gesamtindex aus Status- und Dynamik-Indikatoren pro LOR-Planungsraum (rund 7.500 Einwohner:innen). Strukturelle Aggregat-Größe, keine Bewertung einzelner Adressen oder Personen. Quelle: Senatsverwaltung für Stadtentwicklung Berlin. | Monitoring Social Urban Development 2025: aggregated overall index from status and dynamics indicators per LOR planning area (around 7,500 residents). A structural aggregate, not an assessment of individual addresses or people. Source: Senate Department for Urban Development Berlin. |
| valueScaleExplain | Status hoch / mittel / niedrig / sehr niedrig kombiniert mit Dynamik positiv / stabil / negativ. Niedriger Status bedeutet nicht „schlechter Kiez", sondern strukturelle Unterschiede in Einkommen, Beschäftigung und Bildung. | Status high / medium / low / very low combined with dynamics positive / stable / negative. Low status does not mean “bad Kiez”, but reflects structural differences in income, employment and education. |

### C: Umwelt · Umweltatlas 2023

#### `laerm-2023`

| Feld | DE | EN |
|---|---|---|
| short | Lärmbelastung im Stadtteil (Umweltatlas 2023) | Noise pollution in the area (Environmental Atlas 2023) |
| long | Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023. Berücksichtigt Straßen-, Schienen- und Fluglärm. Indikator für Verdrängung der Wohnruhe. | Categorised overall noise pollution per planning area from the Berlin Environmental Atlas (Umweltatlas) 2023. Covers road, rail and aircraft noise. An indicator of lost residential quiet. |
| valueScaleExplain | niedrig (gut) bis sehr hoch (problematisch) | low (good) to very high (problematic) |

#### `luft-2023`

| Feld | DE | EN |
|---|---|---|
| short | Luftbelastung im Stadtteil (Umweltatlas 2023) | Air pollution in the area (Environmental Atlas 2023) |
| long | Kategorisierte Luftqualität pro Planungsraum: Stickoxide und Feinstaub. Datengrundlage: Berliner Umweltatlas 2023, Verkehrsmodell plus Messstationen. | Categorised air quality per planning area: nitrogen oxides and particulate matter. Data basis: Berlin Environmental Atlas (Umweltatlas) 2023, traffic model plus monitoring stations. |
| valueScaleExplain | niedrig (gut) bis sehr hoch (problematisch) | low (good) to very high (problematic) |

#### `gruenversorgung-2023`

| Feld | DE | EN |
|---|---|---|
| short | Grünversorgung im Stadtteil (Umweltatlas 2023) | Green space provision in the area (Environmental Atlas 2023) |
| long | Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün im Planungsraum. Indikator für Erholungsräume und Klimaresilienz. Kategorisch von niedrig bis sehr hoch. | Per-capita provision of usable public green space in the planning area. An indicator of recreational space and climate resilience. Categorised from low to very high. |
| valueScaleExplain | niedrig = wenig Grün, sehr hoch = gut versorgt | low = little green space, very high = well provided |

#### `bioklima-2023`

| Feld | DE | EN |
|---|---|---|
| short | Thermische Belastung im Sommer (Umweltatlas 2023) | Thermal stress in summer (Environmental Atlas 2023) |
| long | Bioklimatische Belastung an Hitzetagen pro Planungsraum: Hitzeinsel-Effekt, Versiegelung, Kühlung durch Grün. Relevant für Hitzeschutz besonders älterer Menschen und chronisch Kranker. | Bioclimatic stress on hot days per planning area: urban heat island effect, soil sealing, cooling by green space. Relevant for heat protection, especially for older people and the chronically ill. |
| valueScaleExplain | niedrig bis sehr hoch (Hitzestress-Risiko) | low to very high (heat stress risk) |

#### `umweltgerechtigkeit-2023`

| Feld | DE | EN |
|---|---|---|
| short | Umweltgerechtigkeit gesamt: Mehrfachbelastung im Stadtteil | Environmental justice overall: multiple burdens in the area |
| long | Kombinierter Indikator aus Lärm, Luft, Bioklima und Grünversorgung zusammen mit dem sozialen Status. Identifiziert Mehrfachbelastung in benachteiligten Stadtteilen (Berliner Umweltgerechtigkeitsbericht 2023). | Combined indicator of noise, air, bioclimate and green space provision together with social status. Identifies multiple burdens in disadvantaged areas (Berlin Environmental Justice Report 2023). |
| valueScaleExplain | niedrig bis sehr hoch (kumulierte Belastung) | low to very high (cumulative burden) |

### C: Umwelt · Klimaanalyse 2022

#### `klima-pet-2022`

| Feld | DE | EN |
|---|---|---|
| short | Gefühlte Temperatur an Hitzetagen um 14 Uhr (Klimaanalyse 2022) | Perceived temperature on hot days at 2 pm (Climate Analysis 2022) |
| long | Physiologisch Äquivalente Temperatur (PET) als Maß für die gefühlte Hitzebelastung an einem Sommertag um 14 Uhr. Berücksichtigt Lufttemperatur, Strahlung, Wind und Feuchte. Die Karte deckt Siedlung, Straßenraum und Grünflächen ab. Gewässer wie Seen und Kanäle tragen keinen PET-Wert und bleiben leer. Quelle: Berliner Klimaanalyse 2022. | Physiological Equivalent Temperature (PET) as a measure of perceived heat stress on a summer day at 2 pm. Takes air temperature, radiation, wind and humidity into account. The map covers built-up areas, street space and green spaces. Water bodies such as lakes and canals have no PET value and stay empty. Source: Berlin Climate Analysis 2022. |
| valueScaleExplain | unter 32 °C neutral, 32 bis 41 °C warm bis heiß, über 41 °C extrem heiß | below 32 °C neutral, 32 to 41 °C warm to hot, above 41 °C extremely hot |
| unit | °C | °C |

#### `klima-kaltlufteinwirkbereich-2022`

| Feld | DE | EN |
|---|---|---|
| short | Bereich, der nachts von Kaltluft aus dem Umland gekühlt wird | Area cooled at night by cold air from the surrounding countryside |
| long | Stadtgebiete, die nachts von der Kaltluft-Produktion aus Wäldern, Wiesen und Parks profitieren. Wichtig für sommerliche Nachtkühlung und Stadtklima-Resilienz. Quelle: Berliner Klimaanalyse 2022. | Urban areas that benefit at night from cold air produced by forests, meadows and parks. Important for night-time cooling in summer and urban climate resilience. Source: Berlin Climate Analysis 2022. |

#### `klima-leitbahnkorridor-2022`

| Feld | DE | EN |
|---|---|---|
| short | Korridor, durch den nachts Kaltluft in die Stadt strömt | Corridor through which cold air flows into the city at night |
| long | Talraum-Strukturen, Straßenzüge oder Freiflächen, durch die nachts Kaltluft aus dem Umland in die Stadt strömt. Bebauung in diesen Korridoren bremst die Kühlung. Quelle: Berliner Klimaanalyse 2022. | Valley structures, street corridors or open spaces through which cold air flows from the surrounding countryside into the city at night. Buildings in these corridors slow down the cooling. Source: Berlin Climate Analysis 2022. |

### D: Memorial

#### `stolpersteine`

| Feld | DE | EN |
|---|---|---|
| short | Gedenkstein für Opfer des Nationalsozialismus | Memorial stone for victims of National Socialism |
| long | Vor letzten frei gewählten Wohnorten verlegte Messing-Plaketten, die Namen und Schicksal von NS-Opfern bewahren. Konzept Gunter Demnig. Daten aus OpenStreetMap, kuratiert von lokalen Stolpersteine-Initiativen. | Brass plaques laid in front of the last freely chosen homes, preserving the names and fates of victims of the Nazi regime. Concept by Gunter Demnig. Data from OpenStreetMap, curated by local Stolpersteine initiatives. |

#### `denkmal-2024`

| Feld | DE | EN |
|---|---|---|
| short | Eingetragenes Bau- oder Gartendenkmal Berlins | Listed building or garden monument in Berlin |
| long | Objekte aus der Berliner Denkmalliste (Landesdenkmalamt). Umfasst Baudenkmale, Gartendenkmale, Bodendenkmale und Denkmalbereiche. Datengrundlage für Heritage-Dichte-Aggregat pro Bezirk/Kiez. | Objects from the Berlin list of monuments (Landesdenkmalamt). Includes architectural monuments, garden monuments, archaeological monuments and heritage areas. Data basis for the heritage density aggregate per Bezirk/Kiez. |

#### `trinkbrunnen`

| Feld | DE | EN |
|---|---|---|
| short | Öffentlicher Trinkwasser-Brunnen (Mai bis Oktober aktiv) | Public drinking fountain (active May to October) |
| long | Von den Berliner Wasserbetrieben betriebener öffentlicher Trinkbrunnen. Saisonal aktiv: Mai bis Oktober wegen Frostschutz. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Public drinking fountain operated by Berliner Wasserbetriebe. Active seasonally: May to October due to frost protection. Location data from OpenStreetMap (ODbL 1.0). |

#### `kuehle-orte`

| Feld | DE | EN |
|---|---|---|
| short | Orte zum Abkühlen bei Hitze in deiner Nähe | Places to cool down in the heat near you |
| long | Orte in Berlin, die bei Hitze Abkühlung bieten: Kinos, Bibliotheken, Malls, Schwimmhallen, Museen und mehr. Geometrie und Basis-Tags aus OpenStreetMap (ODbL 1.0), ergänzt um eine redaktionelle navigator.berlin-Anreicherung: Kühle-Score, Klimatisierung, Sommer-Verfügbarkeit. Ein Angebot, kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang. | Places in Berlin that offer relief from the heat: cinemas, libraries, malls, indoor pools, museums and more. Geometry and base tags from OpenStreetMap (ODbL 1.0), supplemented with editorial navigator.berlin enrichment: cool score, air conditioning, summer availability. An offer, not a replacement for public authorities, and no legal entitlement to access. |

### E: Soziale Infrastruktur

#### `kitas-2024`

| Feld | DE | EN |
|---|---|---|
| short | Kindertagesstätte (Kita) | Daycare centre (Kita) |
| long | Anerkannte Berliner Kindertageseinrichtung 2024. Trägerschaft öffentlich, kirchlich oder frei. Quelle: Senatsverwaltung für Bildung, Jugend und Familie. | Recognised Berlin daycare facility 2024. Run by public, church or independent providers. Source: Senate Department for Education, Youth and Family. |

#### `schulen-2024`

| Feld | DE | EN |
|---|---|---|
| short | Allgemeinbildende Schule (Stand 2024) | General education school (as of 2024) |
| long | Grundschule, Sekundarschule, Gemeinschaftsschule oder Gymnasium im Berliner Schulverzeichnis 2024. Quelle: Senatsverwaltung für Bildung. | Primary school, secondary school, community school or Gymnasium in the Berlin school directory 2024. Source: Senate Department for Education. |

#### `einschulbereiche-2024`

| Feld | DE | EN |
|---|---|---|
| short | Einschulbereich: Grundschule für die Kinder dieses Gebiets | School catchment area: primary school for children in this area |
| long | Räumlich definierter Grundschulbezirk. Kinder werden in der Regel der Schule des Einschulbereichs zugewiesen, in dem sie wohnen. Ausnahmen möglich. Quelle: Senatsverwaltung Bildung, Stand 2024. | Spatially defined primary school district. As a rule, children are assigned to the school of the catchment area they live in. Exceptions are possible. Source: Senate Department for Education, as of 2024. |

#### `krankenhaeuser-plan`

| Feld | DE | EN |
|---|---|---|
| short | Plan-Krankenhaus aus dem Berliner Krankenhausplan | Hospital in the Berlin hospital plan |
| long | Im Berliner Krankenhausplan aufgeführte Klinik mit gesetzlichem Versorgungsauftrag. Quelle: Senatsverwaltung für Wissenschaft, Gesundheit und Pflege. | Hospital listed in the Berlin hospital plan (Krankenhausplan) with a statutory care mandate. Source: Senate Department for Science, Health and Care. |

#### `krankenhaeuser-weitere`

| Feld | DE | EN |
|---|---|---|
| short | Weiteres Krankenhaus außerhalb des Krankenhausplans | Other hospital outside the hospital plan |
| long | Private oder spezialisierte Klinik außerhalb des Berliner Krankenhausplans, häufig Privatklinik oder Rehabilitations-Einrichtung. Quelle: Senatsverwaltung Gesundheit. | Private or specialised hospital outside the Berlin hospital plan, often a private clinic or rehabilitation facility. Source: Senate Department for Health. |

#### `sportanlagen-2024`

| Feld | DE | EN |
|---|---|---|
| short | Öffentlich oder vereinsgenutzte Sportanlage | Sports facility for public or club use |
| long | Sportstätte (Sportplatz, Sporthalle, Schwimmbecken, Tennisplatz) im Bezirklichen Sportstättenverzeichnis 2024. Quelle: Senatsverwaltung für Inneres und Sport. | Sports venue (sports ground, sports hall, swimming pool, tennis court) in the Bezirk register of sports facilities 2024. Source: Senate Department for the Interior and Sport. |

#### `gruenanlagen`

| Feld | DE | EN |
|---|---|---|
| short | Öffentliche Grünanlage (Park, Schmuckplatz, Stadtwald) | Public green space (park, ornamental square, urban forest) |
| long | Öffentlich gewidmete Grünfläche zur Naherholung: Park, Schmuckplatz, Stadtplatz, Spielplatz oder Stadtwald. Pflege durch die Grünflächenämter der Bezirke. | Officially designated green space for local recreation: park, ornamental square, town square, playground or urban forest. Maintained by the Bezirke's parks departments (Grünflächenämter). |

#### `spielplaetze`

| Feld | DE | EN |
|---|---|---|
| short | Öffentlicher Spielplatz | Public playground |
| long | Öffentlich zugänglicher Kinderspielplatz mit Spielgeräten, gepflegt durch das Grünflächenamt des Bezirks. Quelle: Berliner Grünanlagen-Register. | Publicly accessible children's playground with play equipment, maintained by the Bezirk parks department (Grünflächenamt). Source: Berlin green spaces register (Grünanlagen-Register). |

#### `nahversorgung-lebensmittel`

| Feld | DE | EN |
|---|---|---|
| short | Lebensmittel-Nahversorgung (Supermarkt, Discounter, Spätkauf, Bäcker) | Local grocery shopping (supermarket, discounter, Späti, bakery) |
| long | Geschäfte der täglichen Lebensmittelversorgung: Supermarkt, Discounter, Convenience/Spätkauf und Bäckerei. Fließt als Dichte-Term in die Versorgungs-Dimension des Kiez-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Shops for daily groceries: supermarket, discounter, convenience store/Späti and bakery. Feeds into the Local amenities dimension of the Kiez score as a density term. Location data from OpenStreetMap (ODbL 1.0). |

#### `nahversorgung-apotheke`

| Feld | DE | EN |
|---|---|---|
| short | Apotheke | Pharmacy |
| long | Öffentliche Apotheke für Arzneimittel und gesundheitsnahe Grundversorgung. Teil des Nahversorgungs-Terms der Versorgungs-Dimension. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Public pharmacy for medicines and basic health-related supplies. Part of the local shopping term in the Local amenities dimension. Location data from OpenStreetMap (ODbL 1.0). |

#### `nahversorgung-post`

| Feld | DE | EN |
|---|---|---|
| short | Post- oder Paketstelle | Post office or parcel point |
| long | Postfiliale, Paketshop oder Postdienststelle für Brief- und Paketversand. Teil des Nahversorgungs-Terms der Versorgungs-Dimension. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Post office, parcel shop or postal service point for sending letters and parcels. Part of the local shopping term in the Local amenities dimension. Location data from OpenStreetMap (ODbL 1.0). |

#### `schwimmbaeder`

| Feld | DE | EN |
|---|---|---|
| short | Öffentliches Schwimmbad oder Schwimmhalle | Public swimming pool or indoor pool |
| long | Berliner Bäder-Betriebe (BBB) und vergleichbare Einrichtungen: Hallenbad, Sommerbad, Kombibad oder Strandbad. Saisonale Öffnungszeiten beachten. | Berliner Bäder-Betriebe (BBB) and comparable facilities: indoor pool, outdoor summer pool, combined pool or lakeside bathing beach. Note seasonal opening hours. |

### J: Kultur (Epic 13, Story 13.0) · Standorte aus OpenStreetMap (ODbL 1.0).

#### `kultur-museum`

| Feld | DE | EN |
|---|---|---|
| short | Museum | Museum |
| long | Museum oder Ausstellungshaus. Teil des Kultur-Scores (Zugang zu Kulturorten im Umkreis). Standort-Daten aus OpenStreetMap (ODbL 1.0). | Museum or exhibition venue. Part of the culture score (access to cultural venues nearby). Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-galerie`

| Feld | DE | EN |
|---|---|---|
| short | Galerie | Gallery |
| long | Kunstgalerie oder Ausstellungsraum. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Art gallery or exhibition space. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-kunst-im-raum`

| Feld | DE | EN |
|---|---|---|
| short | Kunst im Stadtraum | Public art |
| long | Kunstwerk im öffentlichen Raum: Skulptur, Wandbild, Installation, Denkmal-Kunst. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Artwork in public space: sculpture, mural, installation, memorial art. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-theater`

| Feld | DE | EN |
|---|---|---|
| short | Theater oder Bühne | Theatre or stage |
| long | Theater, Bühne oder Opernhaus. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Theatre, stage or opera house. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-bibliothek`

| Feld | DE | EN |
|---|---|---|
| short | Bibliothek | Library |
| long | Öffentliche, wissenschaftliche oder Spezial-Bibliothek. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Public, academic or special library. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-kino`

| Feld | DE | EN |
|---|---|---|
| short | Kino | Cinema |
| long | Kino oder Lichtspielhaus. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Cinema or picture house. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-soziokultur`

| Feld | DE | EN |
|---|---|---|
| short | Soziokulturelles Zentrum | Community culture centre |
| long | Kulturhaus, soziokulturelles Zentrum oder Kunsthaus (arts_centre). Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Cultural centre, community culture centre or arts centre (arts_centre). Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

#### `kultur-club`

| Feld | DE | EN |
|---|---|---|
| short | Club oder Musikspielstätte | Club or live music venue |
| long | Club, Diskothek oder Live-Musikspielstätte. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0). | Club, discotheque or live music venue. Part of the culture score. Location data from OpenStreetMap (ODbL 1.0). |

### F: Mobilität

#### `radverkehrsnetz-2025`

| Feld | DE | EN |
|---|---|---|
| short | Radverkehrsnetz 2025 mit Vorrangrouten | Cycling network 2025 with priority routes |
| long | Berliner Radverkehrsnetz inklusive Radvorrangrouten 2025. Hauptrouten für den Alltagsradverkehr, ausgebaut nach Berliner Mobilitätsgesetz. Quelle: SenMVKU. | Berlin cycling network including cycling priority routes 2025. Main routes for everyday cycling, developed under the Berlin Mobility Act (Mobilitätsgesetz). Source: SenMVKU. |

#### `fahrradstrassen-2024`

| Feld | DE | EN |
|---|---|---|
| short | Fahrradstraße: Radverkehr hat Vorrang | Bicycle street: cyclists have priority |
| long | Straße, die für den Fahrradverkehr gewidmet ist (Zeichen 244.1 StVO). Andere Fahrzeuge dürfen nur ausnahmsweise und mit Schrittgeschwindigkeit fahren. Stand 2024. | Street designated for cycling (sign 244.1 of the StVO, German road traffic regulations). Other vehicles may only use it by exception and at walking pace. As of 2024. |

#### `ubahn-stationen`

| Feld | DE | EN |
|---|---|---|
| short | U-Bahn-Station (BVG) | U-Bahn station (BVG) |
| long | BVG-U-Bahn-Bahnhof. 9 Linien, rund 175 Stationen im Netz. Quelle: BVG / VBB-GTFS. | BVG U-Bahn station. 9 lines, around 175 stations in the network. Source: BVG / VBB GTFS. |

#### `sbahn-stationen`

| Feld | DE | EN |
|---|---|---|
| short | S-Bahn-Station | S-Bahn station |
| long | S-Bahn-Berlin-Bahnhof. 16 Linien, rund 170 Stationen in Berlin und Umland. Quelle: VBB-GTFS / Deutsche Bahn. | S-Bahn Berlin station. 16 lines, around 170 stations in Berlin and the surrounding area. Source: VBB GTFS / Deutsche Bahn. |

#### `tram-haltestellen`

| Feld | DE | EN |
|---|---|---|
| short | Straßenbahn-Haltestelle (BVG) | Tram stop (BVG) |
| long | BVG-Straßenbahn-Haltestelle, vor allem im Ostteil der Stadt. 22 Linien. Quelle: BVG GTFS. | BVG tram stop, mainly in the eastern part of the city. 22 lines. Source: BVG GTFS. |

#### `bus-haltestellen`

| Feld | DE | EN |
|---|---|---|
| short | Bushaltestelle (BVG) | Bus stop (BVG) |
| long | BVG-Bushaltestelle, Stadt- und Regionalbusse. Über 7000 Haltestellen in Berlin. Quelle: BVG GTFS. | BVG bus stop, city and regional buses. Over 7,000 stops in Berlin. Source: BVG GTFS. |

#### `ubahn-netz`

| Feld | DE | EN |
|---|---|---|
| short | U-Bahn-Linie (BVG) | U-Bahn line (BVG) |
| long | BVG-U-Bahn-Linienverlauf, 9 Linien (U1 bis U9). Quelle: BVG Geo-Daten. | BVG U-Bahn line routes, 9 lines (U1 to U9). Source: BVG geodata. |

#### `tram-netz`

| Feld | DE | EN |
|---|---|---|
| short | Straßenbahn-Linie (BVG) | Tram line (BVG) |
| long | BVG-Straßenbahn-Linienverlauf, vor allem im Ostteil Berlins, 22 Linien. Quelle: BVG Geo-Daten. | BVG tram line routes, mainly in the eastern part of Berlin, 22 lines. Source: BVG geodata. |

#### `sbahn-netz`

| Feld | DE | EN |
|---|---|---|
| short | S-Bahn-Linien-Netz Berlin (Betreiber: S-Bahn Berlin GmbH) | Berlin S-Bahn line network (operator: S-Bahn Berlin GmbH) |
| long | Linienverlauf des Berliner S-Bahn-Netzes, betrieben von der S-Bahn Berlin GmbH (DB-Konzern-Tochter). 16 Linien, rund 330 km Streckennetz, dichteste Verkehrsachsen in Berlin und Umland. Quelle: OpenStreetMap-Routen-Relationen (ODbL 1.0). | Routes of the Berlin S-Bahn network, operated by S-Bahn Berlin GmbH (a subsidiary of the DB group). 16 lines, around 330 km of track, the busiest transport axes in Berlin and the surrounding area. Source: OpenStreetMap route relations (ODbL 1.0). |

### G: Kiez-Score (Story 1.28 · virtuelle Aggregat-Layer pro LOR-Planungsraum)

#### `kiez-score-gesamt`

| Feld | DE | EN |
|---|---|---|
| short | Umwelt- & Infrastruktur-Score gesamt pro Planungsraum (0–100) | Environment & infrastructure score overall per planning area (0–100) |
| long | Ungewichtetes Mittel der fünf Dimensionen (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz) pro LOR-Planungsraum. Misst nur Größen mit eindeutiger Besser-Richtung. Methodik: /methodik/kiez-score. | Unweighted mean of the five dimensions (Quiet & air, Green & heat, Mobility, Local amenities, Tenant protection) per LOR planning area. Only measures variables where it is clear which direction is better. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = besser über alle fünf Dimensionen | Higher = better across all five dimensions |

#### `kiez-score-ruhe-luft`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Ruhe & Luft" pro Planungsraum (0–100, Kiez-Score) | “Quiet & air” aggregate per planning area (0–100, Kiez score) |
| long | Gewichtete Aggregation aus Lärm und Luftbelastung pro LOR-Planungsraum. Cloud-Dancer-Skala: niedrig = stärker belastet, hoch = ruhiger und sauberer. Methodik: /methodik/kiez-score. | Weighted aggregation of noise and air pollution per LOR planning area. Cloud Dancer scale: low = more polluted, high = quieter and cleaner. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = ruhiger und sauberer | Higher = quieter and cleaner |

#### `kiez-score-gruen-hitze`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Grün & Hitze" pro Planungsraum (0–100, Kiez-Score) | “Green & heat” aggregate per planning area (0–100, Kiez score) |
| long | Grünversorgung und Grünanlagen-Nähe plus thermische Resilienz (Bioklima, PET-Hitzebelastung, Kaltluft-Einwirkbereich, Leitbahnkorridor) pro Planungsraum, gewichtet auf 0–100. Methodik: /methodik/kiez-score. | Green space provision and proximity to green spaces plus thermal resilience (bioclimate, PET heat stress, cold air influence zone, cold air flow corridor) per planning area, weighted to 0–100. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = mehr nutzbares Grün und besserer Hitzeschutz | Higher = more usable green space and better heat protection |

#### `kiez-score-mobilitaet`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Mobilität" pro Planungsraum (0–100, Kiez-Score) | “Mobility” aggregate per planning area (0–100, Kiez score) |
| long | Distance-basiert vom Planungsraum-Centroid zu nächster U-Bahn, S-Bahn, Tram und Bus plus Radverkehrs-Presence. Pro Adresse wird der Wert mit der exakten Adress-Distance überschrieben. Methodik: /methodik/kiez-score. | Based on the distance from the planning area centroid to the nearest U-Bahn, S-Bahn, tram and bus stop, plus cycling network presence. For each address, the exact address distance overrides the value. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = besser angebunden | Higher = better connected |

#### `kiez-score-versorgung`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Versorgung" pro Planungsraum (0–100, Kiez-Score) | “Local amenities” aggregate per planning area (0–100, Kiez score) |
| long | Distance vom Planungsraum-Centroid zu nächster Kita, Schule, Plan-Krankenhaus und Spielplatz. Threshold pro POI individuell (Kita 500 m, Schule 800 m, Krankenhaus 2.000 m, Spielplatz 400 m). Methodik: /methodik/kiez-score. | Distance from the planning area centroid to the nearest daycare centre, school, hospital in the Berlin hospital plan and playground. Individual threshold per POI (daycare 500 m, school 800 m, hospital 2,000 m, playground 400 m). Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = bessere Versorgung mit Familien- und Gesundheits-Infrastruktur | Higher = better provision of family and health infrastructure |

#### `kiez-score-wohnschutz`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Wohnschutz" pro Planungsraum (0–100, Kiez-Score) | “Tenant protection” aggregate per planning area (0–100, Kiez score) |
| long | Verdrängungsschutz: Anteil der Fläche in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebaulich) pro Planungsraum. Positiv-eindeutig: Schutz vorhanden = besser für Bewohner. Methodik: /methodik/kiez-score. | Protection against displacement: share of the area inside a Milieuschutz area (residential or urban preservation statute) per planning area. Unambiguously positive: protection in place = better for residents. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = mehr Schutz vor Verdrängung | Higher = more protection against displacement |

#### `kiez-score-kultur`

| Feld | DE | EN |
|---|---|---|
| short | Aggregat „Kultur" pro Planungsraum (0–100, Kiez-Score) | “Culture” aggregate per planning area (0–100, Kiez score) |
| long | Kultureller Zugang: log-gedämpfte Dichte von Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur, Kunst im Stadtraum und Clubs im Umkreis (OSM/ODbL). Eigenständige Dimension, NICHT im Gesamt-Score (Option C): Kultur ballt sich in der Innenstadt, daher kein Headline-Treiber. Methodik: /methodik/kiez-score. | Cultural access: log-damped density of libraries, theatres, museums, cinemas, galleries, community culture centres, public art and clubs nearby (OSM/ODbL). A separate dimension, NOT part of the overall score (Option C): culture clusters in the city centre, so it does not drive the headline score. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = mehr Kulturorte in Reichweite | Higher = more cultural venues within reach |

#### `kiez-score-kriminalitaet`

| Feld | DE | EN |
|---|---|---|
| short | Erfasste Kriminalität (Häufigkeitszahl) je Bezirksregion | Recorded crime (frequency rate) per Bezirksregion |
| long | Häufigkeitszahl ausgewählter wohn-relevanter Delikte, 3-Jahres-Mittel aus dem Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0). Granularität Bezirksregion, auf Planungsräume gespiegelt. Strukturelle Aggregat-Größe, NICHT im Gesamt-Score (Option C). Bezieht Fälle nur auf gemeldete Einwohner, nicht auf Touristen/Pendler. Methodik: /methodik/kiez-score. | Frequency rate of selected housing-relevant offences, 3-year average from the Berlin crime atlas (Kriminalitätsatlas Berlin, Polizei Berlin, dl-de-by-2.0). Granularity Bezirksregion, mirrored onto planning areas. A structural aggregate, NOT part of the overall score (Option C). Relates cases only to registered residents, not to tourists/commuters. Methodology: /methodik/kiez-score. |
| valueScaleExplain | Höher = mehr erfasste Fälle pro Einwohner, kein Maß für persönliches Risiko und keine Wertung als „guter" oder „schlechter" Kiez. | Higher = more recorded cases per resident, not a measure of personal risk and not a judgement of a “good” or “bad” Kiez. |

### I: Demografie (Story 10.0 · neutraler Kontext, kein Score-Input)

#### `einwohner-dichte-2024`

| Feld | DE | EN |
|---|---|---|
| short | Einwohnerdichte pro LOR-Planungsraum (EW/km², 31.12.2024) | Population density per LOR planning area (residents/km², 31 Dec 2024) |
| long | Einwohner je Quadratkilometer pro LOR-Planungsraum. Neutraler Demografie-Kontext, keine Wertung: dicht ist nicht besser oder schlechter als locker. Quelle: Amt für Statistik Berlin-Brandenburg (CC BY 4.0). | Residents per square kilometre per LOR planning area. Neutral demographic context, no judgement: dense is not better or worse than sparse. Source: Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg) (CC BY 4.0). |
| valueScaleExplain | Höher = dichter besiedelt, ohne Qualitätswertung | Higher = more densely populated, no quality judgement |
| unit | EW/km² | residents/km² |

### Legacy / non-Manifest-Slugs (Story 1.3 Re-Run TODO):

#### `mietspiegel-wohnlage`

| Feld | DE | EN |
|---|---|---|
| short | Wohnlagen-Bewertung im Berliner Mietspiegel | Residential area rating in the Berlin rent index |
| long | Veraltete Wohnlagen-Quelle (vor 2024). Aktuelle Daten siehe Layer „wohnlagen-2024". | Outdated residential area source (before 2024). For current data, see the layer “wohnlagen-2024”. |

#### `lor-prognoseraum`

| Feld | DE | EN |
|---|---|---|
| short | LOR-Prognoseraum (Senatsverwaltung-Gliederung) | LOR forecast area (Prognoseraum, Senate Department division) |
| long | Lebensweltlich orientierter Raum, Ebene Prognoseraum. Grobste der drei LOR-Ebenen, genutzt für Bevölkerungsprognosen. | Life-world-oriented area (Lebensweltlich orientierter Raum), Prognoseraum level. Coarsest of the three LOR levels, used for population forecasts. |

#### `lor-bezirksregion`

| Feld | DE | EN |
|---|---|---|
| short | LOR-Bezirksregion (Kiez-Ebene, 138 in Berlin) | LOR Bezirksregion (Kiez level, 138 in Berlin) |
| long | Lebensweltlich orientierter Raum, Ebene Bezirksregion. Mittel-Ebene der LOR-Gliederung, häufig als „Kiez-Ebene" verwendet. | Life-world-oriented area (Lebensweltlich orientierter Raum), Bezirksregion level. Middle level of the LOR division, often used as the “Kiez level”. |

#### `lor-planungsraum`

| Feld | DE | EN |
|---|---|---|
| short | LOR-Planungsraum (feinste Ebene) | LOR planning area (finest level) |
| long | Lebensweltlich orientierter Raum, Ebene Planungsraum. Feinste der drei LOR-Ebenen, Grundlage für sozialräumliche Statistik. | Life-world-oriented area (Lebensweltlich orientierter Raum), planning area level. Finest of the three LOR levels, basis for social-spatial statistics. |

#### `laerm-den`

| Feld | DE | EN |
|---|---|---|
| short | Straßenverkehrs-Lärmpegel Tag/Abend/Nacht (24h-Mittel) | Road traffic noise level day/evening/night (24h average) |
| long | Lärmpegel als 24-Stunden-Mittelwert (Day-Evening-Night). Legacy-Slug aus früherem Strassenlärm-Datensatz. | Noise level as a 24-hour average (day-evening-night). Legacy slug from an earlier road noise dataset. |
| unit | dB | dB |

#### `laerm-night`

| Feld | DE | EN |
|---|---|---|
| short | Straßenverkehrs-Lärmpegel nur Nacht (22 bis 6 Uhr) | Road traffic noise level, night only (10 pm to 6 am) |
| long | Lärmpegel als Nacht-Mittelwert. Legacy-Slug aus früherem Strassenlärm-Datensatz. | Noise level as a night-time average. Legacy slug from an earlier road noise dataset. |
| unit | dB | dB |

#### `solarpotenzial`

| Feld | DE | EN |
|---|---|---|
| short | Geschätztes Solar-Energie-Potenzial des Daches | Estimated solar energy potential of the roof |
| long | Modelliertes jährliches PV-Ertragspotenzial pro Dachfläche. Legacy-Slug. | Modelled annual PV yield potential per roof area. Legacy slug. |
| unit | kWh/m² | kWh/m² |

#### `klimaanalyse`

| Feld | DE | EN |
|---|---|---|
| short | Klimafunktionsraum-Bewertung (Senatsverwaltung) | Climate function area rating (Senate Department) |
| long | Klimafunktionale Bewertung städtischer Flächen. Legacy-Slug, ersetzt durch klima-pet-2022 und Verwandte. | Climate-function rating of urban areas. Legacy slug, replaced by klima-pet-2022 and related slugs. |

#### `gebaeudealter`

| Feld | DE | EN |
|---|---|---|
| short | Baujahr-Klasse der Gebäude im Gebiet | Construction year class of buildings in the area |
| long | Aggregierte Baujahr-Klassifikation der Gebäudebestände. Legacy-Slug ohne aktive Manifest-Quelle. | Aggregated construction year classification of the building stock. Legacy slug without an active manifest source. |

#### `wahlbezirke-btw17`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Bundestagswahl 2017 | Polling district boundaries, Bundestag election 2017 |
| long | Geometrie der Berliner Wahlbezirke zur Bundestagswahl 2017. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the Bundestag election 2017. Basis for spatially assigning election results at the finest level. |

#### `wahlbezirke-ah16`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Abgeordnetenhauswahl 2016 | Polling district boundaries, House of Representatives election 2016 |
| long | Geometrie der Berliner Wahlbezirke zur Abgeordnetenhauswahl 2016. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the Berlin House of Representatives (Abgeordnetenhaus) election 2016. Basis for spatially assigning election results at the finest level. |

#### `wahlbezirke-ah21`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Abgeordnetenhauswahl 2021 | Polling district boundaries, House of Representatives election 2021 |
| long | Geometrie der Berliner Wahlbezirke zur Abgeordnetenhauswahl 2021. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the Berlin House of Representatives (Abgeordnetenhaus) election 2021. Basis for spatially assigning election results at the finest level. |

#### `wahlbezirke-ah23`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Wiederholungswahl 2023 | Polling district boundaries, repeat election 2023 |
| long | Geometrie der Berliner Wahlbezirke zur Wiederholungswahl des Abgeordnetenhauses 2023. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the 2023 repeat election of the Berlin House of Representatives (Abgeordnetenhaus). Basis for spatially assigning election results at the finest level. |

#### `wahlbezirke-bt25`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Bundestagswahl 2025 | Polling district boundaries, Bundestag election 2025 |
| long | Geometrie der Berliner Wahlbezirke zur Bundestagswahl 2025. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the Bundestag election 2025. Basis for spatially assigning election results at the finest level. |

#### `wahlbezirke-ah26`

| Feld | DE | EN |
|---|---|---|
| short | Wahlbezirks-Grenzen Abgeordnetenhauswahl 2026 | Polling district boundaries, House of Representatives election 2026 |
| long | Geometrie der Berliner Wahlbezirke zur Abgeordnetenhaus- und BVV-Wahl 2026. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene. | Geometry of Berlin's polling districts for the Berlin House of Representatives (Abgeordnetenhaus) and District Assembly (BVV) elections 2026. Basis for spatially assigning election results at the finest level. |

#### `wahlgruppen-btw17`

| Feld | DE | EN |
|---|---|---|
| short | Briefwahl-Gruppen Bundestagswahl 2017 | Postal district groups, Bundestag election 2017 |
| long | Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2017. Kleinste Kartenebene der Wahl-Ergebniskarte. | Combined areas of polling districts and their shared postal district for the Bundestag election 2017. Smallest map level of the election results map. |

#### `wahlgruppen-ah16`

| Feld | DE | EN |
|---|---|---|
| short | Briefwahl-Gruppen Abgeordnetenhaus- und BVV-Wahl 2016 | Postal district groups, House of Representatives and District Assembly (BVV) elections 2016 |
| long | Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Abgeordnetenhaus- und BVV-Wahl 2016. Kleinste Kartenebene der Wahl-Ergebniskarte. | Combined areas of polling districts and their shared postal district for the Berlin House of Representatives (Abgeordnetenhaus) and District Assembly (BVV) elections 2016. Smallest map level of the election results map. |

#### `wahlgruppen-ah21`

| Feld | DE | EN |
|---|---|---|
| short | Briefwahl-Gruppen Bundestags-, Abgeordnetenhaus- und BVV-Wahl 2021 | Postal district groups, Bundestag, House of Representatives and District Assembly (BVV) elections 2021 |
| long | Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2021 sowie zur Abgeordnetenhaus- und BVV-Wahl 2021 und deren Wiederholungswahl 2023. Kleinste Kartenebene der Wahl-Ergebniskarte. | Combined areas of polling districts and their shared postal district for the Bundestag election 2021, the Berlin House of Representatives (Abgeordnetenhaus) and District Assembly (BVV) elections 2021 and their 2023 repeat election. Smallest map level of the election results map. |

#### `wahlgruppen-bt25`

| Feld | DE | EN |
|---|---|---|
| short | Briefwahl-Gruppen Bundestagswahl 2025 | Postal district groups, Bundestag election 2025 |
| long | Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2025. Kleinste Kartenebene der Wahl-Ergebniskarte. | Combined areas of polling districts and their shared postal district for the Bundestag election 2025. Smallest map level of the election results map. |

#### `wahlgruppen-ah26`

| Feld | DE | EN |
|---|---|---|
| short | Briefwahl-Gruppen Abgeordnetenhaus- und BVV-Wahl 2026 | Postal district groups, House of Representatives and District Assembly (BVV) elections 2026 |
| long | Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Abgeordnetenhaus- und BVV-Wahl 2026. Kleinste Kartenebene der Wahl-Ergebniskarte. | Combined areas of polling districts and their shared postal district for the Berlin House of Representatives (Abgeordnetenhaus) and District Assembly (BVV) elections 2026. Smallest map level of the election results map. |

## Externe Links

| Slug | Feld | DE | EN |
|---|---|---|---|
| `wohnlagen-2024` | label | Mietpreise im Berliner Mietspiegel-Rechner nachschlagen | Look up rents in the Berlin rent index calculator (Mietspiegel-Rechner) |

## Abnahme

Matze 27.09. 09:21 („ok wie du empfiehlst“). Übernommen: „Not legal advice.“, „Only measures variables where it is clear which direction is better.“, „hospital in the Berlin hospital plan“, überall „Kiez score“ (auch EN-Layer-Namen in `messages/en.json`, Umsetzung in C1). „Cloud-Dancer-Skala“ bleibt wörtlich, DE-Textbereinigung vorgemerkt. Übrige unsichere Punkte wie übersetzt.
