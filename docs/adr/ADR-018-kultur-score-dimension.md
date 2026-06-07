---
status: Accepted
date: 2026-06-07
deciders: solo-maintainer
relates: ADR-015 (Score-Komposition), ADR-017 (Versorgung-Nahversorgung), Epic 13
---

# ADR-018: Kultur als eigenständige Score-Dimension (Option C, nicht im Composite)

## Context

Der Umwelt- & Infrastruktur-Score (ADR-015) misst fünf Dimensionen mit eindeutiger Besser-Richtung. Kultureller Zugang (Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur, Kunst im Stadtraum, Clubs) fehlte, ist aber ein eigenständiger Lebensqualitäts-Faktor.

Offene Daten existieren: OSM Overpass (ODbL, schon im Stack) deckt ~90 % ab. Clubkataster ist nicht offen lizenziert, daher ausgeschlossen.

Zwei Probleme bei naiver Aufnahme als sechste Composite-Dimension:

1. **Der Composite heißt „Umwelt- & Infrastruktur-Score".** Kultur passt nicht unter dieses Label; reinnehmen hieße umbenennen (großer Konsumenten-Change).
2. **Center-Bias.** Kulturinfrastruktur ballt sich in Mitte/Innenstadt. Im Composite würde sie jeden Außenbezirk-Gesamt-Score systematisch drücken und das Innen-Außen-Gefälle im „wo lebt es sich gut"-Ranking verstärken.

## Decision

Kultur wird eine **eigenständige, sichtbare Dimension** (eigener Choropleth, Inspector-Anzeige, Rang, Vergleich), **fließt aber NICHT in den Gesamt-/Composite-Score** (Option C).

- `KIEZ_SCORE_DIMENSIONS` enthält `kultur` (wird gerechnet, aggregiert, gerankt, angezeigt).
- `DIMENSION_WEIGHTS.kultur = 0`; die fünf Composite-Dimensionen bleiben bei 0.20 (Summe 1.0). Kein Rebalance.
- `computeOverallScore` filtert über die Whitelist `COMPOSITE_DIMENSIONS` (die fünf) → der Gesamt-Score ist das Mittel der fünf, unabhängig vom Kultur-Wert. Eine Filter-Stelle, beide Aufrufer (Kiez + Region) erben es.

Präzedenz: ADR-015 behandelt Soziale Lage genauso (sichtbar als Kontext, nicht im Composite).

### Center-Bias-Dämpfung

Die Kultur-Terme nutzen eine **Log-Skala** (`poi-density` mit `scale: 'log'`): `100 · ln(1+count)/ln(1+cap)`. Der erste Kulturort zählt stark, weitere flachen ab. Das dämpft das Innen-Außen-Gefälle, sodass Außenbezirke nicht flächendeckend auf null fallen.

### Gewichte (Owner-Review-pflichtig)

Bibliothek 0.20, Theater 0.15, Museum 0.15, Kino 0.12, Soziokultur 0.13, Galerie 0.10, Kunst im Stadtraum 0.08, Club 0.07 (Summe 1.0). Bibliothek/Theater/Museum höher als Club/Kunst-im-Raum.

### Editorial-Ausschlüsse

- **Memorial/Heritage** (Stolpersteine, Denkmale) sind KEINE Kultur-Amenity (pietätssensibel, in Epic 9 ohnehin aus dem Frontend entfernt).
- **Sammlungs-/Objekt-Metadaten** (DDB, digiS) sind keine Orte.
- **`amenity=community_centre`** ist in Berlin verrauscht (Kitas, Bürgerämter) → ausgeschlossen.
- **Clubkataster** (Clubcommission) hat keine offene Lizenz → nicht verwendet.

## Consequences

- Kein Rename des „Umwelt- & Infrastruktur-Score". Kein Center-Bias im Headline-Ranking.
- Kultur voll nutzbar: Choropleth „Kiez-Score · Kultur" (Gut-Grün), Inspector-Ring (sichtbares 6. Segment, ändert die Mitte-Zahl nicht), Ranking-Spalte, Vergleich, LLM-Export.
- OG-Score-Card bleibt Composite-only (Kultur nicht auf der Card), konsistent mit Option C.
- Datenquelle OSM (ODbL): Crowdsourcing-Lücken möglich (dokumentiert als coverageGap).
- Stories: Epic 13 (13.0 Daten, 13.1 Dimension/Option C, 13.2 DB, 13.3 Recompute, 13.4 UI, 13.5 Content).
