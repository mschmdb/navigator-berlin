---
type: methodology
audience: both
last-verified: 2026-06-09
status: empfohlen
related:
  - docs/scoring-methodology.md
  - docs/wahldaten-methodik.md
  - docs/muelldaten-methodik.md
---

# Kriminalitätsdaten-Methodik

Quelle der Wahrheit für eine mögliche Kriminalitäts-/Sicherheits-Dimension in navigator.berlin. Stand: **Juni 2026**.

## ✅ Verdikt: starke, nutzbare Datenquelle

Anders als bei Müll (siehe [[muelldaten-methodik]], verworfen) gibt es hier eine erstklassige offene Quelle: den **Kriminalitätsatlas Berlin** der Polizei Berlin. Geocodiert auf LOR-Ebene, 10-Jahre-Zeitreihe, jährlich aktuell, frei lizenziert, eine saubere XLSX. Empfehlung: als Dimension umsetzbar, mit einem wichtigen Methodik-Caveat (Touristen/Pendler-Verzerrung, siehe unten).

## Quelle & Zugang

|                   |                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Portal            | https://daten.berlin.de/datensaetze/kriminalitatsatlas-berlin                            |
| Interaktiv        | https://www.kriminalitaetsatlas.berlin.de/                                               |
| Methodik          | https://www.kriminalitaetsatlas.berlin.de/K-Atlas/hinweise.htm                           |
| Download (direkt) | `https://www.kriminalitaetsatlas.berlin.de/K-Atlas/bezirke/Fallzahlen&HZ 2016-2025.xlsx` |
| Format            | **XLSX** (eine Datei, ~610 KB)                                                           |
| Herausgeber       | Polizei Berlin                                                                           |
| Lizenz            | dl-de-by-2.0 bzw. cc-by-sa (Namensnennung) — frei nutzbar                                |
| Aktualität        | **jährlich zum 31.12. fortgeschrieben**, synchron mit PKS                                |
| Zeitreihe         | **2016–2025** (10 Jahre), gleitend                                                       |
| Geprüft           | 9.6.2026: Datei geladen, 22 Sheets, Struktur verifiziert                                 |

## Granularität — der entscheidende Vorteil

- **12 Bezirke + 138 Bezirksregionen (LOR)**, plus Berlin-gesamt und „nicht zuzuordnen".
- Jede Zeile trägt den **LOR-Schlüssel** (z. B. `011002` = Regierungsviertel) + Bezeichnung.
- LOR-Schlüssel ist **direkt joinbar** an die LOR-Geometrien. Wenn navigator.berlin ein Kiez/LOR-Raster nutzt, ist das ein sauberer Key-Join, kein Geocoding-Gefrickel.
- ⚠️ Vor Integration: Kiez↔Bezirksregion-Mapping des Projekts gegen die 138 LOR prüfen (155 Profile vs. 138 Bezirksregionen — nicht 1:1, klären).

## Inhalt: Struktur der XLSX

22 Sheets: `Titel`, `Inhaltsverzeichnis`, `Fallzahlen_2016`…`Fallzahlen_2025`, `HZ_2016`…`HZ_2025`. Ein Sheet pro Jahr und Metrik-Typ.

- **Fallzahlen** = absolute Fälle (für Transparenz/Gewichtung)
- **HZ (Häufigkeitszahl)** = Fälle pro 100.000 Einwohner, Stichtag 30.6. → regional vergleichbar, das Arbeitsmaß

Spalten pro Sheet (Delikte): Straftaten insgesamt · Raub · Straßenraub/Handtaschenraub · Körperverletzungen insgesamt · Gefährl./schwere KV · Freiheitsberaubung/Nötigung/Bedrohung/Nachstellung · Diebstahl insgesamt · Diebstahl von Kfz · Diebstahl an/aus Kfz · Fahrraddiebstahl · Wohnraumeinbruch · Branddelikte insgesamt · Brandstiftung · Sachbeschädigung insgesamt · Sachbeschädigung Graffiti · Rauschgiftdelikte · **Kieztaten**.

`-` markiert unterdrückte/nicht zuordenbare Werte.

Referenzwerte 2025 (HZ, Straftaten insgesamt, pro 100k): Berlin gesamt **12.882**, Mitte (Bezirk) 19.921, Regierungsviertel **46.178**, Alexanderplatz 28.817, Tiergarten Süd 31.960.

## ⚠️ Methodik-Caveats (für Scoring zwingend beachten)

1. **Touristen/Pendler-Verzerrung (kritisch).** HZ bezieht Fälle nur auf **gemeldete Einwohner**, nicht auf Touristen, Pendler, Kunden. Folge: innerstädtische, einwohnerarme, stark frequentierte LOR (Regierungsviertel, Alexanderplatz, Ku'damm, Tiergarten Süd) erscheinen massiv kriminalitätsbelastet, ohne dass das Wohn-Risiko entsprechend hoch ist. **Naives HZ-Ranking brandmarkt Tourismus-/Geschäftskieze fälschlich als „gefährlichste".** Für eine Wohn-Lebensqualitäts-Dimension: solche LOR gesondert behandeln (flaggen, kappen, oder kontextualisieren), nicht 1:1 in den Score.
2. **Tatortprinzip.** Nur Fälle mit exaktem Tatort. **Taschendiebstahl ausgeschlossen** (Tatort selten exakt benennbar).
3. **Dunkelfeld.** Nur erfasste (angezeigte) Fälle. Anzeigeverhalten variiert räumlich/sozial.
4. **Kleine Fallzahlen volatil.** Seltene Delikte (Brandstiftung ~0,2 % aller Taten) schwanken regional stark, Einzeljahre nicht überinterpretieren → Mehrjahres-Mittel nutzen.
5. **HZ ≠ persönliches Risiko.** Inzidenz pro Einwohner-Äquivalent, keine Wahrscheinlichkeit für eine Einzelperson.

## Empfehlung für navigator.berlin

1. **Umsetzbar als Dimension.** HZ pro LOR, Join über LOR-Schlüssel.
2. **Delikt-Auswahl statt „Straftaten insgesamt".** Für Wohn-Lebensqualität ist die kuratierte Spalte **Kieztaten** plus gezielte Delikte (Wohnraumeinbruch, Sachbeschädigung, Straßenraub, Fahrraddiebstahl) aussagekräftiger als die Gesamtzahl, die von Innenstadt-/Geschäftskriminalität dominiert wird.
3. **Touristen-Verzerrung adressieren** (Caveat 1) — sonst rankt das Modell die City-Cores absurd.
4. **Mehrjahres-Mittel** (z. B. 3 Jahre) gegen Volatilität.
5. **Framing:** „erfasste Kriminalität pro Einwohner", nicht „Gefährlichkeit". Dunkelfeld + Tatortprinzip transparent machen.

## Offene Punkte

- [ ] Kiez↔Bezirksregion-Mapping (155 Profile vs. 138 LOR) klären
- [ ] Delikt-Set für die Dimension festlegen (Kieztaten + Auswahl)
- [ ] Strategie für City-Core-LOR mit Touristen-Verzerrung
- [ ] XLSX-Parser (LOR-Schlüssel + gewählte Spalten + Jahres-Sheets → DB), Update-Job jährlich
