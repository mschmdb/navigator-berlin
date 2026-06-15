---
type: methodology
audience: both
last-verified: 2026-06-09
status: geprüft-verworfen
related:
  - docs/data-pipeline.md
  - docs/scoring-methodology.md
---

# Müll- und Sauberkeitsdaten-Methodik

Quelle der Wahrheit für mögliche Müll-/Sauberkeits-Dimensionen in navigator.berlin. Stand der Recherche: **Juni 2026**.

## ⛔ Verdikt: als Score-Dimension verworfen

Recherchiert: Ordnungsamt-Online-API, BSR-Geschäftsbericht, Amt für Statistik, 7 Parlaments-Drucksachen, Stadtsauberkeitsmonitoring, Reinigungsklassen-Geodaten. **Es gibt keine öffentliche, objektive, kleinräumige Sauberkeits-Messung für Berlin.** Jede gefundene Quelle scheitert an mindestens einem K.o.-Kriterium (tot / nur Bezirk / nur bis 2022 / misst Meldeverhalten statt Müll / intern / Intensität statt Zustand). Details unten. Empfehlung: Thema nicht als gewichtete Dimension bauen. Allenfalls stadtweite Kontext-Kennzahl im Profil-Text.

Berlin publiziert zwei getrennte Datentypen über zwei Stellen:

- **a) Gemeldeter Müll** (liegt im öffentlichen Raum) → Ordnungsamt-Online, Bezirksämter
- **b) Aufgesammelter Müll** (entsorgt) → BSR + Amt für Statistik Berlin-Brandenburg

Beide messen Verschiedenes. Nicht vermischen.

---

## a) Ordnungsamt-Online — gemeldeter Müll

### Quelle

|                       |                                                                            |
| --------------------- | -------------------------------------------------------------------------- |
| Open-Data-Eintrag     | https://daten.berlin.de/datensaetze/ordnungsamt-online                     |
| API-Endpoint          | `https://ordnungsamt.berlin.de/frontend.webservice.opendata/api/meldungen` |
| Format                | JSON (ein Voll-Dump, keine Pagination, keine Filter-Parameter)             |
| Lizenz                | Datenlizenz Deutschland Namensnennung 2.0 (dl-de-by-2.0)                   |
| Herausgeber           | Landesamt für Bürger- und Ordnungsangelegenheiten (LABO)                   |
| Technischer Kontakt   | ams-admin@labo.berlin.de                                                   |
| **Status (9.6.2026)** | **🔴 OFFLINE — Wartungsarbeiten**                                          |

### 🔴 Kritischer Befund: API seit Monaten offline

Stand 9.6.2026 liefert der Endpoint **keine Daten**. Der Server hält die Verbindung ~5 Minuten, dann eine 503-Wartungsseite: "aufgrund dringender Wartungsarbeiten steht das Anliegenmanagementsystem derzeit nicht zur Verfügung."

Das ist kein kurzer Ausfall:

- Einziger Wayback-Snapshot des Endpoints (25.2.2026) zeigt **dieselbe Wartungsseite**.
- Heißt: Dienst mindestens seit Ende Februar 2026 down, ~3,5 Monate.
- Kein Live-Payload, kein archivierter Payload. Exakte JSON-Keys derzeit **nicht** verifizierbar.

**Vor jeder Integration prüfen, ob die API wieder läuft.** Wenn der Dienst dauerhaft eingestellt/ersetzt wird (möglich: Migration des Anliegenmanagementsystems), entfällt die gemeldeter-Müll-Dimension komplett. Kontakt für Status: ams-feedback@labo.berlin.de.

### ⚠️ Kritischer Befund: 30-Tage-Löschung

**Erledigte Meldungen werden nach 30 Tagen aus der API entfernt.** Quelle: Senats-Antwort, zitiert bei [Stefan Ziller (2021)](https://stefan-ziller.eu/2021/wer-ist-zustaendig-fuer-opendata-und-wo-ist-die-dokumentation-der-api-von-ordnungsamt-online/).

Folgen:

- Die API ist ein **Live-Snapshot offener + kürzlich erledigter Meldungen**, kein historisches Archiv.
- Ein **jährlicher Pull erfasst KEINE Jahressumme.** Er erfasst nur, was zum Pull-Zeitpunkt offen/jung ist. Alles >30 Tage vor dem Pull Erledigte fehlt.
- Für kumulative Jahres-/Bezirkszahlen sind **Parlaments-Antworten** (siehe unten) oder das **Live-Statistik-Frontend** die Quelle, nicht akkumulierte API-Snapshots.

**Konsequenz für navigator.berlin:** Wenn ein stabiler Kiez-Score gewünscht ist, reicht ein Jahres-Pull nicht. Optionen:

1. Häufiger pullen (z. B. wöchentlich/täglich) und selbst persistieren → eigene Zeitreihe aufbauen.
2. Snapshot als reine **"aktuelle Müll-Belastung jetzt"**-Momentaufnahme nutzen (kein Bestand).
3. Aggregierte Bezirks-Jahreswerte aus Parlaments-Drucksachen als statische Kontext-Kennzahl.

### Feldstruktur

Felder laut Senats-Antwort (zitiert bei Stefan Ziller, 2021). **Caveat:** Das sind die deutschen Feld-Bezeichnungen aus der Behörden-Antwort, nicht die exakten JSON-Keys. Live-Verifikation steht aus (API antwortete bei der Recherche im Juni 2026 nicht: Server baut den Voll-Dump im RAM, sendet >280 s kein erstes Byte). Exakte Keys, Datentypen und Kategorie-Werte beim ersten erfolgreichen Pull gegen diese Liste abgleichen.

| Feld (Senats-Bezeichnung)    | Erwarteter Inhalt                 | Notiz                                                                              |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| ID                           | Eindeutige interne ID             |                                                                                    |
| Meldungsnummer               | Fachliche Vorgangsnummer          |                                                                                    |
| Bezirk                       | Einer der 12 Berliner Bezirke     | Kodierung (Name vs. Schlüssel) unbekannt                                           |
| Betreff                      | Kategorie/Titel der Meldung       | **Müll-Kategorie hier filtern** — exakte Werte unbekannt                           |
| Erstellungsdatum mit Uhrzeit | Timestamp der Meldung             |                                                                                    |
| Status                       | offen / in Bearbeitung / erledigt | Erledigte fallen nach 30 Tagen raus                                                |
| Sachverhalt                  | Freitext-Beschreibung             |                                                                                    |
| Straße                       | Straßenname                       |                                                                                    |
| Hausnummer                   | Hausnummer                        |                                                                                    |
| PLZ                          | Postleitzahl                      |                                                                                    |
| Geodaten                     | Koordinaten der Meldung           | Format (WGS84? Lat/Lng-Reihenfolge?) unbekannt — pro-Kiez-Aggregation hängt hieran |
| Anmerkung zum Ort            | Freitext-Ortshinweis              |                                                                                    |
| Letzte Änderung              | Timestamp letzte Statusänderung   |                                                                                    |
| Rückmeldung an den Bürger    | Behörden-Antwort-Text             |                                                                                    |
| Bilddaten 1                  | Foto 1 (Referenz oder Inline)     |                                                                                    |
| Bilddaten 2                  | Foto 2 (Referenz oder Inline)     |                                                                                    |

**Hinweis Geo-Granularität:** Die daten.berlin.de-Metadaten geben "Geo-Granularität: Keine" an. Faktisch enthält jede Meldung Geodaten (die App ist standortbasiert). Der Metadaten-Eintrag ist vermutlich ungepflegt. Beim ersten Pull prüfen, ob das Geodaten-Feld tatsächlich befüllt ist.

### ✅ Empfohlene Datenquelle: Parlaments-Drucksachen (Bezirk × Jahr)

Da die API tot ist und ohnehin kein Archiv hält, sind **Schriftliche Anfragen im Abgeordnetenhaus** die nutzbare Quelle für gemeldeten Müll pro Bezirk und Jahr. Frei nutzbar (amtliche Werke, § 5 UrhG; reine Zahlen ohnehin nicht schützbar).

**Hauptquelle: [Drucksache 19/17628](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-17628.pdf)** (Antwort 2.1.2024). Liefert AMS-Meldungen "Abfall (illegale Beseitigung)" aus Ordnungsamt-Online, pro Bezirk, Jahres-Zeitreihe 2019–2022:

| Bezirk                     |       2019 |        2020 |        2021 |        2022 |
| -------------------------- | ---------: | ----------: | ----------: | ----------: |
| Mitte                      |     21.683 |      22.729 |      21.148 |      16.183 |
| Pankow                     |      7.785 |       9.734 |      11.570 |      10.313 |
| Spandau                    |      2.591 |       4.216 |       6.082 |       5.273 |
| Neukölln                   |     14.380 |      15.943 |      20.498 |      18.931 |
| Lichtenberg                |      3.751 |       4.875 |       5.207 |       5.020 |
| Reinickendorf              |      5.053 |       6.133 |       7.078 |       7.581 |
| Treptow-Köpenick           |      5.446 |       6.588 |       7.176 |       6.809 |
| Marzahn-Hellersdorf        |      2.241 |       2.913 |       3.654 |       3.076 |
| Steglitz-Zehlendorf        |      3.073 |       3.811 |       4.357 |       3.857 |
| Tempelhof-Schöneberg       |      7.621 |       9.981 |      10.067 |      10.965 |
| Friedrichshain-Kreuzberg   |     13.270 |      10.688 |      20.722 |      15.866 |
| Charlottenburg-Wilmersdorf |      6.370 |       8.081 |      11.383 |      11.575 |
| **Gesamt**                 | **93.264** | **105.692** | **128.942** | **115.449** |

Dieselbe Drucksache liefert **entsorgte Mengen pro Bezirk** (BSR, illegale Ablagerungen ohne Bauabfälle, m³). [Drs. 19/14720](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-14720.pdf) liefert dazu 2021:

| Bezirk                     |    m³ 2021 |    m³ 2022 |
| -------------------------- | ---------: | ---------: |
| Friedrichshain-Kreuzberg   |     11.248 |     12.705 |
| Neukölln                   |     10.053 |      8.904 |
| Mitte                      |      4.789 |      5.243 |
| Tempelhof-Schöneberg       |      2.246 |      2.449 |
| Pankow                     |      2.191 |      1.967 |
| Charlottenburg-Wilmersdorf |      1.693 |      2.258 |
| Lichtenberg                |      1.683 |      1.653 |
| Reinickendorf              |      1.610 |      1.491 |
| Spandau                    |      1.194 |      1.456 |
| Treptow-Köpenick           |      1.200 |      1.203 |
| Steglitz-Zehlendorf        |        763 |        744 |
| Marzahn-Hellersdorf        |        443 |        586 |
| **Gesamt**                 | **39.112** | **40.660** |

(Nach Fraktion 2022: Sperrmüll 22.676 m³, Sortierreste 9.943, Schrott Kleinmetall 2.920, Kühlschrank 1.673, unsort. Abfall 1.185, Altreifen 949, E-Schrott 748.)

### ⛔ Keine vergleichbare Bezirks-Tabelle ab 2023

Geprüft: Drs. 19/14720, 16879, 20323, 23532, 23843, 23861, 25662. Ergebnis: **Für 2023/2024 existiert keine stadtweite, vergleichbare Pro-Bezirk-Tabelle.** Grund: Zum 1.5.2023 ging die Zuständigkeit per Gesetz an die BSR. Seitdem:

- **BSR-Mengen pro Bezirk enden 2022.** Ab dem gesetzlichen Auftrag erfasst die BSR Mengen/Kosten/Stunden nur noch stadtweit, nicht bezirks- oder PLZ-scharf (wörtlich in Drs. 23532 und 23843). Per-Bezirk-m³ nach 2022 = nicht verfügbar.
- **Meldungs-Zahlen 2023/2024 nur als Einzel-Bezirks-Fragmente**, je mit anderem Kategorie-Scope, daher **nicht** mit der 2019–2022-Tabelle oder untereinander vergleichbar:
  - Reinickendorf (Drs. 23532): 2024 = **7.309** Meldungen „(Sperr-)Müll" (BA-Zähler; BSR-Zähler 6.068)
  - Steglitz-Zehlendorf (Drs. 23843): 2023 = **1.765**, 2024 = **2.208** (Sperrmüll-Scope; ⚠️ derselbe Bezirk hat 2022 in der breiten Kategorie 3.857, hier nur 825 → Scopes kollidieren)
  - Spandau (Drs. 23861): 2023 = **5.072**, 2024 = **5.836** (illegale Ablagerungen gesamt)
- **Stadt-Gesamt 2024:** 170.434 Meldungen (Presse/Senatsbericht), keine zugehörige saubere Bezirks-Tabelle gefunden.

**Konsequenz:** Eine konsistente Bezirks-Zeitreihe reicht nur bis **2022**. Ab 2023 nur Bruchstücke. Wer 2024 pro Bezirk braucht, müsste für jeden Bezirk eine eigene Anfrage finden, mit inkonsistentem Scope.

### Kosten (BSR, stadtweit, nicht pro Bezirk)

| Jahr              | BSR-Kosten illegale Ablagerungen |
| ----------------- | -------------------------------: |
| 2021              |                      5.188.735 € |
| 2022              |                      6.295.382 € |
| 2023 (per 8/2023) |                      6.123.148 € |
| 2023 (Gesamtjahr) |                  **9.675.637 €** |

Quellen: [Drs. 19/16879](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-16879.pdf) (Zeitreihe), [Drs. 19/20323](https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-20323.pdf) (Gesamtjahr 2023). BSR rechnet Kosten nicht bezirksscharf ab. Vor Mai 2023 trugen Bezirke + Berliner Forsten eigene Kosten (Forsten 2021: 147.083 €, 2022: 138.194 €).

**Granularität-Warnung:** Bezirks-Ebene, **nicht** Kiez/PLZ. Einzelne Anfragen geben PLZ-/Straßen-Werte für Spezialthemen (Schrottfahrräder Moabit Drs. 19/25662; Hotspot-Listen Reinickendorf/SZ in 23532/23843), aber kein flächendeckendes PLZ-Raster. Feinste verlässliche Stadt-Ebene = Bezirk, und nur bis 2022.

### Interpretations-Caveat

Meldungen messen **Bürger-Engagement + App-Bekanntheit**, nicht objektiven Müll. Der Anstieg seit 2019 ist teils Artefakt der wachsenden App-Verbreitung. Aufklärungsquote teils <1 % (Marzahn-Hellersdorf). Im Profil-Text **nicht** als "schmutzigster Kiez" framen.

Belege für die Unzuverlässigkeit als objektives Maß:

- **Mitte sinkt** 2019→2022 (21.683 → 16.183), während andere Bezirke steigen. Kein Sauberkeits-Effekt, sondern Melde-/Zuordnungsverhalten.
- Bezirke zählen **uneinheitlich**. Mehrere sagen in Drs. 19/23861 wörtlich, eine standardisierte Auswertung sei "nicht möglich"; Bürger geben oft anliegende Straßen statt exakten Ort an.
- Kategorie wählt der meldende Bürger, wird teils erst nachträglich geprüft (Drs. 19/17628, BA Friedrichshain-Kreuzberg).
- Folge: Bezirks-Zahlen taugen als **grober Belastungs-Indikator mit Vorbehalt**, nicht als exakte Rangliste.

---

## b) BSR + Statistikamt — aufgesammelter Müll

### BSR-Geschäftsbericht 2024

Quelle: https://geschaeftsbericht.bsr.de/2024/saubere-stadt.html · Entsorgungsbilanz: https://www.bsr.de/entsorgungsbilanz

- **88.000** Meldungen illegale Ablagerungen (BSR-eigener Zähler, ≠ Ordnungsamt-Zähler)
- Beseitigt: **54.300 m³** Sperrmüll/Sortierreste + **4.700 m³** Bauabfall
- 27.000 Papierkörbe, **7,4 Mio** Leerungen/Jahr
- ~36.000 t Straßenlaub pro Herbst

### Zeitreihe illegale Ablagerungen (Menge + Kosten)

| Jahr | Menge                     | Kosten    |
| ---- | ------------------------- | --------- |
| 2022 | ~40.000 m³                | 6,3 Mio € |
| 2023 | 33.262 m³ (seit Mai 2023) | 9,7 Mio € |

Quellen: [EUWID](https://www.euwid-recycling.de/news/politik/illegale-entsorgung-kostet-berlin-ueber-zehn-mio-eur-140524/), [Senats-PM "Saubere Stadt"](https://www.berlin.de/rbmskzl/aktuelles/pressemitteilungen/2024/pressemitteilung.1440212.php)

### Amt für Statistik Berlin-Brandenburg

Quelle: https://www.statistik-berlin-brandenburg.de/q-ii-1-2j/

- **3.121.408 t** Abfall 2022 behandelt/beseitigt (Landesebene)
- Format: XLSX + PDF, Zeitreihe, 2-jährliche Erhebung
- **Keine** Bezirks-Aufteilung (nur Landesebene)

### Senats-Abfallbilanzen

Quelle: https://www.berlin.de/sen/uvk/umwelt/kreislaufwirtschaft/abfallbehoerde/abfallbilanzen/ — Tonnage pro Jahr, PDF.

---

## c) Geprüfte Alternativen (Sauberkeit statt Müll-Meldungen)

Versuch, ein **objektiv gemessenes** Sauberkeits-Signal zu finden statt meldungsgetriebener Zahlen.

### Stadtsauberkeitsmonitoring / Qualitätskommission — nicht nutzbar

- Die Qualitätskommission (SenMVKU + BSR + Bezirke) begeht **2×/Jahr ausgewählte Straßen** und bewertet den Zustand.
- **Intern.** Kein veröffentlichter Datensatz, kein Index, keine Bezirks-Performance-Werte. Nur Erwähnung in Drucksachen.
- Räumlich: Stichproben ausgewählter Straßen, nicht flächendeckend.
- → Als Datenquelle für navigator.berlin nicht verfügbar.

### Straßenreinigungsverzeichnis / Reinigungsklassen — verfügbar, aber falsches Signal

- Open-Data: https://daten.berlin.de/datensaetze/bsr-stra-enreinigung-verzeichnisse-und-reinigungsklassen · Download https://www.bsr.de/opendata/
- Formate: SHP, GML, DXF, MITAB, PDF in Soldner / UTM33N / **WGS84** (EPSG:4326)
- Granularität: **pro Straßenabschnitt, geocodiert**
- Aktualität: **wöchentlich** (So 08:00) — anders als die tote Ordnungsamt-API also live
- Lizenz: **cc-by** (frei)
- Inhalt: Reinigungsklasse (A/B/C, neu 1a/2a) = Reinigungshäufigkeit, abgeleitet aus Verkehr + Infrastruktur + Verschmutzungsgrad. Fortschreibung ~alle 2 Jahre durch STEK-Kommission.

**Warum trotzdem verworfen:** Die Reinigungsklasse misst **Reinigungs-Intensität / erwartete Nutzungslast**, nicht den Ist-Sauberkeitszustand. Eine 5×/Woche gereinigte Straße (Klasse A1) ist zentral/stark frequentiert, nicht zwingend dreckig, womöglich top-gepflegt. Eine 1×/Woche gereinigte Wohnstraße ist nicht zwingend sauber. Das Signal korreliert mit Zentralität/Geschäftigkeit, nicht mit Sauberkeit. Als Sauberkeits-Dimension irreführend; als Straßencharakter-Attribut vermutlich redundant zu vorhandenen Verkehrs-/Zentralitätsdaten.

## Empfehlung für navigator.berlin

0. **Realität zuerst:** Die Ordnungsamt-API ist offline (siehe oben). Bis sie zurück ist, ist gemeldeter Müll nur über Parlaments-Aggregate (Bezirk/Jahr) verfügbar, nicht als Live-Layer.
1. **Falls API zurückkommt: Integrat = Ordnungsamt-Online JSON-API.** Geocodierte Einzelmeldungen, freie Lizenz, Müll-Kategorie filterbar. **Aber:** 30-Tage-Löschung beachten → Snapshot, kein Archiv. Architektur-Entscheidung nötig (häufig pullen + persistieren vs. Momentaufnahme).
2. **Kennzahl-Kontext = BSR-Geschäftsbericht** (m³, Kosten) für Tooltips/Prosa, nicht als Layer.
3. **Bezirks-Jahreswerte** aus Parlaments-Drucksachen als statische Kontext-Kennzahl.
4. **Framing:** Meldungen = Wahrnehmung + Engagement, nicht objektiver Müll.

## Offene Punkte (vor Implementierung klären)

- [ ] **Zuerst:** Prüfen, ob die API überhaupt wieder online ist (war 9.6.2026 down, ≥3,5 Monate Wartung). Bei LABO Status erfragen, ob Dienst zurückkommt oder ersetzt wird.
- [ ] Entscheiden, ob die 2019–2022-Bezirks-Zeitreihe als Dimension reicht (vergleichbar, sauber), oder ob die fragmentierten 2023/2024-Werte (nicht vergleichbar) das Bild verfälschen.
- [ ] Falls 2024 zwingend: prüfen, ob eine stadtweite 2025er-Anfrage mit Bezirks-Tabelle existiert (PARDOK weitersuchen) oder per IFG/Anfrage an SenMVKU/LABO anstoßen.
- [ ] Echten API-Payload ziehen (sobald online) → exakte JSON-Keys, Datentypen, Kategorie-Werte dokumentieren
- [ ] Geodaten-Feld: befüllt? Format? CRS?
- [ ] Exakte Müll-Kategorie-Werte im Feld "Betreff" ermitteln
- [ ] Pull-Frequenz-Entscheidung (Snapshot vs. eigene Zeitreihe)
- [ ] 113k vs. 170k Differenz auflösen (Kategorie-Abgrenzung)
