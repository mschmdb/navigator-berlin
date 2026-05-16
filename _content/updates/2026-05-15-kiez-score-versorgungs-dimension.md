---
title_de: "Kiez-Score: Versorgungs-Dimension ergänzt"
summary_de: "Fünfte Dimension prüft Kita, Schule, Krankenhaus, Spielplatz und Grünanlage in Lauf-Distanz."
date: 2026-05-15
category: methodik
tags: [kiez-score, versorgung, methodik]
---

## Was wir geändert haben

Der Kiez-Score hat ab Story 1.28 fünf Dimensionen statt vier. Neu dazu: **Versorgung**.

| Dimension | Anteil |
|---|---|
| Ruhe und Luft | 20 % |
| Grün | 20 % |
| Mobilität | 20 % |
| Soziale Lage | 20 % |
| Versorgung | 20 % |

## Was die Versorgungs-Dimension misst

Pro Planungsraum berechnet sich die nächste Distanz zu fünf POI-Typen:

- Kita unter 500 m (Gewicht 0.25)
- Grundschule unter 800 m (Gewicht 0.25)
- Krankenhaus unter 2000 m (Gewicht 0.20)
- Spielplatz unter 400 m (Gewicht 0.15)
- Grünanlage unter 600 m (Gewicht 0.15)

Strecke per Haversine-Formel auf POI-Centroid, normalisiert via Schwellenwert-Funktion. Implementation in `scripts/build-kiez-scores.ts` und `src/lib/data/build-helpers.ts`.

## Warum POI-Distanz und nicht Anzahl

Die reine Anzahl von Kitas pro km² differenziert dicht-besiedelte Kieze nicht. Eine Familie braucht eine erreichbare Kita, nicht 12 in 100 m Radius. Distanz-Schwellen bilden Lauf-Erreichbarkeit ab.

## Vollständige Methodik

Siehe `/methodik/kiez-score`.
