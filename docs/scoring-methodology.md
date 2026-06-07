---
type: pipeline
audience: both
last-verified: 2026-05-17
---

# Scoring-Methodik: Kiez-Score + Bezirks-Score

Stand: 2026-05-16. Quelle Story 2.9a + ADR-013.

Diese Doku beschreibt die transparente Berechnung der drei Aggregat-Ebenen Kiez-Score (Planungsraum), Kiez-Score (LOR-Bezirksregion) und Bezirks-Score (12 Berliner Bezirke). Für die Pipeline-Implementation siehe `scripts/lib/kiez-score/` und `scripts/aggregate-scores.ts`.

## Übersicht

Drei räumliche Ebenen, eine Methodik:

| Ebene | Anzahl | Quelle | Berechnung |
|-------|--------|--------|------------|
| Planungsraum (PLR) | 542 | `static/kiez-scores/kiez-scores.json` (Story 1.28) | Source-of-Truth, 5 Dimensionen pro Adress-Centroid |
| Bezirksregion (BR) | 143 | Postgres `kiez_score` | Flächen-gewichtetes Mittel über enthaltene PLR |
| Bezirk | 12 | Postgres `bezirk_score` | Flächen-gewichtetes Mittel über enthaltene PLR |

## Dimensionen

Fünf Composite-Dimensionen (je 0.20, fließen in den Gesamt-Score) plus Kultur als eigenständige sechste Dimension. Werte zwischen 0 und 100, höher ist günstiger. Stand seit ADR-015 (Score-Recomposition): Soziale Lage / MSS ist KEIN Score-Input mehr, bleibt neutraler Kontext-Layer.

1. **Ruhe & Luft.** Lärm-dB-Mittel (0.5, WHO-orientiert, ≤45 dB → 100, ≥75 dB → 0), Luftgüte (0.5, Ordinal-3).
2. **Grün & Hitze.** Grünversorgung (0.3), Grünanlagen-Nähe (0.15), Bioklima (0.2), PET-Hitzebelastung invertiert (0.15), Kaltluft-Einwirkbereich (0.1), Leitbahnkorridor (0.1).
3. **Mobilität.** Distanz zur nächsten Haltestelle. U-Bahn (0.35), S-Bahn (0.25), Tram (0.20), Bus (0.10), Radverkehrs-Presence (0.10). Linear: 0 m gibt 100, 1.000 m gibt 0.
4. **Versorgung.** Öffentliche Daseinsvorsorge UND private Alltags-Nahversorgung, jeweils als Dichte im Umkreis (Anzahl Einrichtungen, weicher Tail statt hartem Distanz-Cliff). Kita-Erreichbarkeit (0.12) + Plätze pro Kind (0.12), Grundschule (0.12) + weiterführende Schule (0.12), Plan-Krankenhaus kapazitätsgewichtet (0.18), Spielplatz (0.10), Nahversorgung aus OSM/ODbL: Lebensmittel (0.12), Apotheke (0.07), Post (0.05). Polygon-Layer kollabieren zum Geometrie-Mittelpunkt. Siehe ADR-017 (Nahversorgung-Erweiterung).
5. **Wohnschutz.** Verdrängungsschutz: Anteil der Fläche in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebaulich, ODER-verknüpft). Positiv eindeutig: Schutz vorhanden = besser.

**6. Kultur (eigenständig, NICHT im Composite — Option C, ADR-018).** Log-gedämpfte Dichte kulturkollektiver POIs aus OSM/ODbL: Bibliothek (0.20), Theater (0.15), Museum (0.15), Kino (0.12), Soziokultur (0.13), Galerie (0.10), Kunst im Stadtraum (0.08), Club (0.07). Gewicht in `DIMENSION_WEIGHTS` ist 0; `computeOverallScore` filtert Kultur über `COMPOSITE_DIMENSIONS` heraus. Begründung: Kultur ballt sich in der Innenstadt (Center-Bias), die Log-Skala dämpft das Innen-Außen-Gefälle. Memorial-Orte (Stolpersteine, Denkmale) zählen bewusst nicht.

## Aggregations-Regel: Flächen-gewichtetes Mittel

Pro Dimension d und Region R mit enthaltenen Planungsräumen P_1..P_n:

```
dim_value(R, d) = Σ (dim_value(P_i, d) × area(P_i)) / Σ area(P_i)
                  über alle P_i mit dim_value(P_i, d) ≠ null
```

`area(P_i)` ist die GROESSE_M2-Property des LOR-Planungsraum-Features (ODIS-Datensatz 2021).

`overall(R)` ist das ungewichtete Mittel über alle aggregierten Dimensionen mit `value ≠ null`. Damit bleibt die Kiez-Score-Definition aus Story 1.28 konsistent über die Ebenen.

Beispiel: Bezirksregion enthält PLR mit Lärm-Werten 60 / 30 / 90 und Flächen 1 / 2 / 3 km². Gewichteter Wert ist (60·1 + 30·2 + 90·3) / (1 + 2 + 3) = 65.

## Missing-Data-Policy

Pro Dimension müssen mindestens 50 Prozent der Member-Planungsräume einen non-null Wert beitragen. Andernfalls wird die Dimension auf `null` gesetzt und im `missingData`-Array dokumentiert (z.B. `coverage:1/4-below-50%-threshold`).

Falls alle fünf Dimensionen einer Region `null` sind, fehlt auch `overall`. Konsumenten interpretieren `null` als „nicht genug Daten für eine belastbare Aggregation".

## Quartil-Klassifikation

Werte 0 bis 100. Vier UI-Stufen für Choropleth-Skalen und Inspector-Anzeige:

| Stufe | Bereich |
|-------|---------|
| gering | 0 bis 25 |
| mittel | 26 bis 50 |
| hoch | 51 bis 75 |
| sehr hoch | 76 bis 100 |

Karten-Choropleth-Familie nach Story 1.31:

- Last (Vermillion) für umwelt-belastende Dimensionen
- Gut (Grün) für wohltuende Dimensionen wie Versorgung oder Grün
- Strukturell (Indigo) für Soziale Lage, Wohnen, Bodenrichtwerte (Stigma-Schutz)

## LOR-Hierarchie

Berliner LOR-Codes sind hierarchisch:

```
PLR_ID    = 8-stellig (z.B. 01100101)
BZR_ID    = 6-stellig, gleich erste 6 Zeichen der PLR_ID
BEZ-Code  = 2-stellig, gleich erste 2 Zeichen der PLR_ID
```

Mapping rein property-basiert, kein Spatial-Containment nötig. Verifiziert: 0 Mismatches in 542 Features (ODIS-Datensatz 2021).

Slug-Disambiguation für doppelte BZR-Namen (z.B. Heerstraße existiert in Spandau und Charlottenburg-Wilmersdorf): Bezirks-Suffix wird angehängt, also `heerstrasse-spandau` und `heerstrasse-charlottenburg-wilmersdorf`. Eindeutige Namen bleiben ohne Suffix.

## Editorial-Verantwortung

- **Keine Wertung in der Benennung.** Der Score heißt Kiez-Score oder Bezirks-Score. Der Begriff „lebenswert" wird nicht verwendet, weil er NS-Sprachbezug hat.
- **Soziale Lage ist stigma-sensitiv.** Choropleth-Familie ist Strukturell-Indigo, keine Rot-Grün-Sprünge, kein Pfeil-Indikator. Disclaimer pflicht: „Score ist statistisch, nicht normativ. Lebensqualität bemisst sich an persönlichen Prioritäten."
- **Kein Composite-Choropleth auf der Karte.** Die Single-Score-Darstellung als Karte verstärkt „guter / schlechter Bezirk"-Wahrnehmung. Pro Dimension separate Choropleth-Layer sind okay.
- **Adress-Punkt-Score bleibt im Inspector.** Bezirks- und Kiez-Scores sind statistische Lage-Beschreibungen, nicht Wohnungs-Bewertungen.

## Build-Pipeline

```
pnpm data:fetch              # ODIS + OSM + WFS → static/layers/
pnpm data:oepnv-index        # Halte-Punkte-Index
pnpm data:kiez-scores        # 542 PLR-Scores (Story 1.28)
pnpm data:aggregate          # bezirk_stats + kiez_stats (Story 2.0)
pnpm data:aggregate-scores   # bezirk_score + kiez_score (Story 2.9a, dieser Doku)
pnpm build                   # SvelteKit prerender
```

`aggregate-scores.ts` ist idempotent. Zweimal ausführen liefert identische Werte, nur `computed_at` ändert sich.

## Rang, Quartil & Vergleich (Epic 11)

Aufbauend auf den Scores berechnen zwei Build-Steps die vergleichende Einordnung:

- **Ranking** (`pnpm data:rank`, `scripts/aggregate-ranks.ts` → `kiez_rank`/`bezirk_rank`): pro Metrik ein dichter Rang 1..N (1 = bester) plus Quartil. Gerankt werden Composite + 5 Dimensionen sowie numerische stats-Metriken (Grünanlagen, Haltestellendichte, Kitas/km², PET u.a.). Richtung pro Metrik konfiguriert: meist höher = besser, invertiert bei PET-Hitze.
- **Quartil:** rang-basiert (`floor((rang-1)/total*4)+1`, bester → Q1). Bewusst getrennt von der wert-basierten 0-100-Quartil-Klassifikation (die gilt für Choropleth-Skalen).
- **Vergleich** (`pnpm data:comparison`, `scripts/aggregate-comparison.ts` → `kiez_comparison`/`bezirk_comparison`): pro Score-Metrik der Bezirks-Schnitt (Mittel der Kieze im Bezirk) und der Berlin-Median. Bezirk = Mittel, Berlin = Median (robuster gegen Ausreißer).

**Anti-Stigma (ADR-015):** Die UI-Beschriftung (`src/lib/data/rank-format.ts`) zeigt den exakten Rang für Q1–Q3, aber „unteres Viertel" statt „Platz N von N" für das schwächste Quartil. Vergleiche sind neutral formuliert (über/unter Schnitt), keine Wertung.

Reihenfolge in `prebuild`: `data:aggregate-scores` → `data:rank` → `data:comparison`. Beide Steps idempotent (TRUNCATE+Insert).

## Referenzen

- ADR-013 Score-Aggregations-Strategie
- Story 1.28 Kiez-Score-Pipeline 542 PLR
- Story 2.0 Postgres-Aggregat-Foundation
- Story 2.9a Aggregat-Berechnung BR + Bezirk
- `/methodik/kiez-score` Methodik-Page mit Section-Ankern `#dimensionen`, `#gewichte`, `#bezirks-score`
