---
status: Accepted
date: 2026-06-07
deciders: solo-maintainer
relates: ADR-015 (Score-Komposition), Epic 12
---

# ADR-017: Versorgung um private Nahversorgung erweitern (öffentlich + privat)

## Context

Die Versorgungs-Dimension des Umwelt- & Infrastruktur-Scores (ADR-015) misst öffentliche Daseinsvorsorge: Kita, Schule, Krankenhaus, Spielplatz. Alltagsökonomie fehlte. Supermarkt, Apotheke und Post sind die häufigsten Wege im Kiez und ein eigenständiger Lebensqualitäts-Faktor.

Bei der Daten-Recherche (Analyst-Session 2026-06-07) wurde ein eigener „Wirtschafts-Score" geprüft und verworfen:

- Ein Score auf **Kapital-Intensität** (Bodenwerte, Firmendichte) kollidiert mit der Wohnschutz-Dimension (Verdrängungsschutz = gut) und mit ADR-015 (Bodenrichtwerte stehen bewusst als strukturell, nicht als „gut"). Wirtschaftlich „stark" heißt für Bestandsbewohner oft Verdrängung.
- **Sozioökonomische Rohindikatoren** (SGB-II-Quote, Kinderarmut, Einkommen) verletzen das Anti-Stigma-Mandat. Deshalb führt der Score den MSS-Gesamtindex abstrahiert, nicht die Einzelindikatoren.

Wirtschaft passt nur über die Versorgungs-Linse: als bewohner-positive, stigma-freie Alltagsökonomie.

## Decision

Die Versorgungs-Dimension wird von „Daseinsvorsorge" zu **„Alltagsversorgung, öffentlich und privat"** erweitert. Private Nahversorgung kommt als drei OSM-Terme (ODbL) hinzu, mit derselben `poi-density`-Methodik wie die bestehenden POI-Terme (Anzahl im Radius, weicher Tail statt hartem Distanz-Cliff):

- Lebensmittel (`shop=supermarket|convenience|grocery|bakery`, 500 m, Gewicht 0.12)
- Apotheke (`amenity=pharmacy`, 800 m, 0.07)
- Post (`amenity=post_office`, 1.000 m, 0.05)

**Keine eigene Dimension.** Die interne Verteilung der Versorgungs-Dimension wird umgewichtet (Top-Level-Gewicht `versorgung` = 0.20 bleibt, `DIMENSION_WEIGHTS` unverändert, Score-Schema unverändert):

| Term | vorher | neu |
|------|--------|-----|
| Kita (Erreichbarkeit + pro Kind) | 0.30 | 0.24 |
| Schule (Grund + weiterführend) | 0.30 | 0.24 |
| Krankenhaus (kapazitätsgewichtet) | 0.25 | 0.18 |
| Spielplatz | 0.15 | 0.10 |
| Nahversorgung (Lebensmittel 0.12 / Apotheke 0.07 / Post 0.05) | – | 0.24 |
| Summe | 1.00 | 1.00 |

### Anti-Stigma-Abgrenzung

Nur **bewohner-positive Alltagsökonomie** fließt ein (Nähe zu Geschäften des täglichen Bedarfs). Bewusst NICHT im Score:

- Kapital-Intensität: Bodenrichtwerte, Firmendichte, Gewerbemieten.
- Sozioökonomische Rohindikatoren: SGB II, Kinderarmut, Einkommen.

Bäcker ist in den Lebensmittel-Term gefaltet (Grundversorgung), kein eigener Term. Clubkataster (keine offene Lizenz) wird nicht verwendet.

## Consequences

- Versorgung deckt jetzt öffentlich + privat. Methodik-Seite + `docs/scoring-methodology.md` erklären beide.
- Datenquelle OSM (ODbL): Crowdsourcing-Lücken möglich, als coverageGap dokumentiert.
- Doppel-Penalty-Guard geprüft: Versorgung bleibt in allen 542 LOR non-null (kein Kollaps), gesunde Spreizung (min 2.6 / median 60.6 / max 90.6).
- Gewichte als Lock-Test gegen Regression gesichert. Owner-Review-pflichtig (redaktionelle Größe).
- Stories: Epic 12 (12.0 Daten-Foundation, 12.1 Lebensmittel, 12.2 Apotheke+Post, 12.3 Umgewichtung).
