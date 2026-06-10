---
status: Accepted
date: 2026-06-09
deciders: solo-maintainer
relates: ADR-015 (Score-Komposition / Anti-Stigma), ADR-018 (Kultur Option C), Epic 14
---

# ADR-019: Kriminalität als eigenständige Kontext-Dimension (Option C + Stigma-Schutz)

## Context

Der Umwelt- & Infrastruktur-Score (ADR-015) misst fünf Composite-Dimensionen mit eindeutiger Besser-Richtung. Kultur kam als sichtbare, aber composite-freie sechste Dimension dazu (ADR-018, Option C). Eine Sicherheits-/Kriminalitäts-Perspektive fehlt. Owner-Wunsch aus der Analyst-Session „Kriminalität als Dimension?".

Die Daten sind erstklassig, anders als bei Müll (siehe `docs/muelldaten-methodik.md`, verworfen): der **Kriminalitätsatlas Berlin** der Polizei Berlin.

- Offen + geocodiert: **12 Bezirke + 138/143 Bezirksregionen (LOR)**, joinbar über LOR-Schlüssel.
- Zeitreihe **2016–2025** (10 Jahre, gleitend), jährlich zum 31.12. fortgeschrieben.
- **Fallzahlen** (absolut) + **Häufigkeitszahl (HZ)** (pro 100.000 Einwohner), 17 Deliktsbereiche + kuratierte „Kieztaten".
- Eine XLSX, Lizenz dl-de-by-2.0 / cc-by-sa (Namensnennung Polizei Berlin). Details: `docs/kriminalitaetsdaten-methodik.md`.

Vier Probleme bei naiver Aufnahme als Composite-Dimension:

1. **Label-Mismatch (wie Kultur).** Der Composite heißt „Umwelt- & Infrastruktur-Score". Kriminalität passt nicht darunter; reinnehmen hieße umbenennen.
2. **Touristen/Pendler-Verzerrung der HZ.** Die HZ bezieht Fälle nur auf gemeldete Einwohner, nicht auf Touristen, Pendler, Kunden. Einwohnerarme, stark frequentierte City-LOR (Regierungsviertel HZ 46.178, Alexanderplatz 28.817 vs. Berlin 12.882) erscheinen extrem belastet, ohne dass das Wohn-Risiko entsprechend hoch ist. Im Headline-Score gebacken würde dieser Daten-Artefakt das „wo lebt es sich gut"-Ranking verzerren.
3. **Granularität.** Composite-Source-of-Truth ist der Planungsraum (542 PLR pro Adress-Centroid). Der Atlas liefert nur Bezirksregion (143). Kriminalität kann keine PLR-native `poi-density`-Dimension sein.
4. **Stigma (der entscheidende Punkt).** Kriminalitätsbelastung ist die Lehrbuch-Stigma-Variable. Ein Kiez grün/rot als „sicher/gefährlich" zu labeln und in einen Lebensqualitäts-Score zu gießen = Redlining-Risiko, verstärkt Vorurteile über meist migrantisch/einkommensschwach geprägte Kieze. ADR-015 behandelt genau solche Variablen (Soziale Lage / MSS, Bodenrichtwerte) bewusst als neutralen Kontext-Layer, nicht als Score-Input, in der Strukturell-Indigo-Choropleth-Familie.

## Decision

Kriminalität wird eine **eigenständige, sichtbare Kontext-Dimension** (eigener Choropleth, Inspector-Anzeige), **fließt aber NICHT in den Gesamt-/Composite-Score** (Option C, Mechanik wie ADR-018). Im Framing folgt sie aber **Soziale Lage (ADR-015), nicht Kultur**: Strukturell-Indigo zum Stigma-Schutz, kein „Gut-Grün", keine „sicher/gefährlich"-Wertung.

- `KIEZ_SCORE_DIMENSIONS` enthält `kriminalitaet` (wird gerechnet, aggregiert, angezeigt).
- `DIMENSION_WEIGHTS.kriminalitaet = 0`; die fünf Composite-Dimensionen bleiben bei 0.20 (Summe 1.0). Kein Rebalance.
- `computeOverallScore` filtert über die `COMPOSITE_DIMENSIONS`-Whitelist (die fünf) → der Gesamt-Score bleibt das Mittel der fünf, unabhängig vom Kriminalitäts-Wert. Eine Filter-Stelle, Präzedenz aus ADR-018.

### Granularität: BR-nativ, auf PLR gespiegelt

Der Atlas-Wert existiert pro Bezirksregion (143). Er wird **auf alle enthaltenen Planungsräume gespiegelt** (jeder PLR erbt den HZ-Wert seiner BR, konstant innerhalb der BR). Die bestehende flächen-gewichtete Aggregation (ADR-013) reproduziert daraus exakt den BR-Wert und liefert konsistente Bezirks-Werte. Kein neues Aggregations-Verfahren nötig.

### Stigma-Schutz-Framing

- **Choropleth-Familie Strukturell-Indigo** (wie Soziale Lage / Bodenrichtwerte), NICHT Gut-Grün. Keine „besser"-Pfeile, kein „sicher/gefährlich"-Label.
- Bezeichnung neutral: „erfasste Kriminalität (Häufigkeitszahl)", nicht „Sicherheit" oder „Gefährlichkeit".
- **NICHT in die Prosa-Profile gewoben** (Default). Die Kiez-/Bezirks-Profile erwähnen Kriminalität nicht; sie bleibt Karten-Layer + Inspector-Kontext. Verhindert Redlining-Formulierungen im generierten Fließtext. (Analog: strukturelle Stigma-Layer fließen nicht in die feel-good-Prosa.)

### Delikt-Auswahl + Normalisierung

- **Nicht „Straftaten insgesamt"** (von Innenstadt-/Geschäftskriminalität dominiert), sondern eine wohn-relevante Auswahl: kuratierte **Kieztaten** plus gezielte Delikte (Wohnraumeinbruch, Sachbeschädigung, Straßenraub, Fahrraddiebstahl). Finales Set Owner-Review-pflichtig.
- **HZ** als Maß (vergleichbar pro 100k), **3-Jahres-Mittel** gegen Volatilität kleiner Fallzahlen.
- Normalisierung auf 0–100 für den Choropleth; City-Core-LOR mit Touristen-Verzerrung gesondert behandeln (flaggen oder kappen), Entscheidung dokumentiert.

### Methodik-Caveats (dokumentationspflichtig)

Touristen/Pendler nicht im Einwohner-Nenner · Tatortprinzip (Taschendiebstahl ausgeschlossen) · Dunkelfeld (nur angezeigte Fälle) · kleine Fallzahlen volatil · HZ ≠ persönliches Risiko. Quelle: `docs/kriminalitaetsdaten-methodik.md`.

### Lizenz-Disziplin

Kriminalitätsatlas Berlin, dl-de-by-2.0 / cc-by-sa, Namensnennung „Polizei Berlin" in MANIFEST + Methodik-Doku. Jährliche XLSX-Aktualisierung (31.12.).

## Consequences

- Kein Rename des „Umwelt- & Infrastruktur-Score". Kein Stigma-Artefakt im Headline-Ranking.
- Kriminalität nutzbar als Choropleth „Kiez-Score · Kriminalität" (Strukturell-Indigo), Inspector-Kontext, Aggregat über BR/Bezirk. Kein Score-Ring-Segment mit Gut-Wertung; Darstellung als Kontext, nicht als gefeierte Dimension.
- BR-native Daten auf PLR gespiegelt → konstante Werte innerhalb einer Bezirksregion, sichtbar gröber als die fünf PLR-nativen Dimensionen (dokumentieren).
- OG-Score-Card bleibt Composite-only (Kriminalität nicht auf der Card), konsistent mit Option C.
- Prosa-Profile bleiben crime-frei (Stigma-Schutz), keine neue Halluzinations-/Stigma-Fläche im Generator.
- Datenquelle Polizei (PKS): Dunkelfeld + Anzeigeverhalten als Limitation dokumentiert.
- Stories: Epic 14 (14.0 Atlas-Layer, 14.1 Dimension/Option C + Stigma-Config, 14.2 DB, 14.3 Recompute, 14.4 UI Indigo, 14.5 Content, 14.6 Spike City-Core-Verzerrung, 14.7 Doku/Updates, 14.8 Profile-Capstone crime-exkludiert).

## Alternatives-Considered

- **Option A — Kriminalität als 6./7. Composite-Dimension.** Verworfen: Label-Mismatch, Touristen-Verzerrung verfälscht das Headline-Ranking, Stigma/Redlining, Granularitäts-Bruch (BR vs. PLR).
- **Option B — eigener „Sicherheits-Score" als zweiter Composite.** Verworfen: erfindet eine Wertungs-Achse („sicher = gut"), die genau das Stigma erzeugt, das ADR-015 vermeidet; HZ trägt diese Polarität nicht verlässlich.
- **Option C-Kultur — standalone, aber Gut-Grün wie Kultur (ADR-018).** Verworfen: Kultur ist bewohner-positiv und stigma-frei, Kriminalität nicht. Gut-Grün-Framing („grün = sicher") ist das Redlining-Muster.
- **Gewählt — standalone (Option-C-Mechanik) + Strukturell-Indigo-Stigma-Framing (Soziale-Lage-Haltung), crime-frei in der Prosa.** Maximaler Informationswert bei minimalem Stigma-Risiko.
