---
status: Proposed
date: 2026-05-20
deciders: solo-maintainer
---

# ADR-014: Multi-Level-Inspector · Aggregat-Strategie + Visual-Typ + Compare-Verhalten pro Layer

## Context

Der Inspector zeigt heute Adress-Punkt-Daten: Point-in-Polygon-Hits pro Layer plus zwei Annotations-Sektionen (Kiez-Score aus ADR-013, Wahlverhalten aus Epic 6). Aggregate existieren, sind aber kein wählbarer Spatial-Level. Das User-Mental-Model "Wie ist X in MEINEM Kiez verglichen zur Stadt?" zwingt zum Wechsel zwischen vier Surfaces (Adress-Inspector, Bezirks-Page, Kiez-Page, Ranking).

Epic 8 will einen globalen Level-Switch (Adresse / Kiez / Bezirk / Berlin), bei dem alle Sections adaptieren und die Karte das Polygon highlightet. Parallel ist ein visuelles Inspector-Redesign beschlossen (User-Decision 2026-05-20): mehr Daten-Dichte (Score-Ringe, Verteilungs-Charts, Datenjournalismus-Look), Cards mit Visual-Summary im collapsed-State, kein blindes Collapsible.

Beide Achsen hängen an einer Frage, die zuerst geklärt sein muss: **Was bedeutet jeder Layer auf jedem Level, und ist die Aggregation methodisch zulässig?** Ein Bodenrichtwert-Median über einen Bezirk ist irreführend. Ein einzelner Stolperstein "im Kiez" ist eine Zählung, kein Wert. Ohne diese Matrix bauen wir 4 Wochen Hacks und schreiben danach 50 Tests um.

Dieser ADR ist Pflicht-Foundation vor Story 8.1 und vor jedem visuellen Card-Bau.

## Decision

### 1. Vier Spatial-Level + Default

`currentLevel: 'address' | 'kiez' | 'bezirk' | 'berlin'`. Default `address` (Backwards-Compatibility, alle bestehenden Konsumenten unverändert). Kiez = LOR-Bezirksregion (143), Bezirk = 12, Berlin = gesamt. Planungsraum-Ebene (542) ist NICHT als User-Level exponiert (zu granular, kein Mental-Model), bleibt interne Aggregat-Quelle.

### 2. Aggregat-Typen

| Typ | Regel auf Polygon-Level | Beispiel-Layer |
|-----|-------------------------|----------------|
| `numeric-median` | Median der Member-Werte + Min/Max-Spanne | Lärm LDEN, Luft NO2 |
| `ordinal-distribution` | Verteilung über Klassen, dominante Klasse als Headline | Wohnlage, Lärm-Klasse, MSS-Stufe |
| `coverage-share` | Anteil der Polygon-Fläche mit Treffer (0-100%) | Kaltluft-Einwirkbereich, Leitbahnkorridor, Milieuschutz |
| `point-density` | Treffer pro km² + nächste Distanz vom Adress-Punkt (nur address) | Kitas, Schulen, ÖPNV-Stops, Stolpersteine |
| `area-share` | Anteil Grün-/Parkfläche an Polygon-Fläche | Grünanlagen, Spielplätze |
| `score-weighted` | flächengewichtetes Mittel (ADR-013) | Kiez-Score 5 Dimensionen |
| `vote-share` | Stimmenanteil pro Partei (Epic 6 Pipeline) | Wahldaten |
| `not-aggregatable` | kein Aggregat, Disclaimer-Card statt Fake-Wert | Bodenrichtwert, einzelner Stolperstein-Datensatz |

### 3. Matrix pro Layer-Familie

| Layer-Familie | address | kiez/bezirk/berlin | Visual-Typ | Compare evaluierbar? |
|---------------|---------|--------------------|-----------|----------------------|
| Lärm (laerm-2023) | Punkt-dB + Klasse | `ordinal-distribution` | Verteilungs-Balken + Median-Tick | ja (ordinal, leiser=Richtung) |
| Luft (luft-2023) | Punkt-NO2 | `numeric-median` | Score-Bar + Berlin-Median-Anker | ja |
| Bioklima / PET (klima-pet) | Punkt-PET | `numeric-median` | Score-Bar + Anker | ja |
| Kaltluft / Leitbahn | Treffer ja/nein | `coverage-share` | Coverage-Bar (% Fläche) | neutral (Faktum) |
| Grünversorgung | Punkt-Klasse | `ordinal-distribution` | Verteilungs-Balken | ja |
| Grünanlagen / Spielplätze | nächste Distanz | `area-share` | Anteils-Bar | neutral |
| Umweltgerechtigkeit | Punkt-Composite | `ordinal-distribution` | Verteilungs-Balken | ja, aber Stigma-Gate |
| Wohnlage (Mietspiegel) | Punkt-Stufe | `ordinal-distribution` | Verteilungs-Balken | NEIN (categorical-neutral, Memory `project_compare_editorial_profiles`) |
| MSS-Soziale-Lage | Punkt-Stufe | `ordinal-distribution` | Verteilungs-Balken | NEIN (Stigma-Lock) |
| Milieuschutz | innerhalb ja/nein | `coverage-share` | Coverage-Bar | neutral |
| Bodenrichtwert | Block-Wert | `not-aggregatable` | nur address: Wert; sonst Disclaimer | NEIN |
| Kitas/Schulen/Kranken./Sport/Schwimm | nächste Distanz | `point-density` | Distanz-Ring (address) / Dichte-Dot (Polygon) | neutral (Anzahl=faktisch) |
| Einschulbereiche | enthaltender Bereich | address-only | Text | n/a |
| ÖPNV-Stops (u/s/tram/bus) | nächste Distanz + Linien | `point-density` | Distanz-Ring / Dichte | neutral |
| ÖPNV-Netze, Rad (LineString) | innerhalb-Buffer | address-only Kontext | Mini-Map-Annotation | n/a |
| Stolpersteine | Treffer im Umkreis | `point-density` count | Dot-Density + Disclaimer | NEIN (Erinnerung, kein Wohn-Kriterium, bestehender Disclaimer) |
| Denkmal | enthaltend ja/nein | `coverage-share` | Coverage-Bar | neutral |
| Kiez-Score | 5-Dim aus ADR-013 | `score-weighted` | Ring (Hero) + 5 Dim-Bars | NEIN auf Composite (Stigma) |
| Wahldaten | Stimmbezirk-Lookup | `vote-share` | Stacked-Bar + Sparkline | ja (Stimmenanteil, kein Werturteil) |
| Boundaries | enthaltend | sind die Level-Definition selbst | n/a | n/a |

### 4. Visual-Summary-Pflicht (User-Constraint 2026-05-20)

Jede collapsible Card trägt im collapsed-State ein Mini-Visual plus Kernwert. Kein Aufklapp-Element ohne Vorschau. Hero (Kiez-Score-Ring) ist immer expanded, alle thematischen Cards collapsed-mit-Visual.

### 5. Compare-Modus

- **same-level-lock**: beide Adressen immer auf gleichem Level (Story 8.4).
- Collapsed-Compare-Card zeigt A + B im selben Visual (zwei Reihen) plus Diff-Chip.
- Diff-Indikator nur bei `evaluierbar=ja`-Layern. Bei categorical-neutral (Wohnlage, MSS, Bodenrichtwert) und Stigma-gegateten Layern (Stolpersteine, Kiez-Score-Composite): nur Nebeneinanderstellung, kein Richtungs-Pfeil. Das EVALUATIVE_PROFILES-Gate aus Story 6.3 wird wiederverwendet und um die Layer-Liste hier erweitert.
- Compare-Hero: Ring auf einen Datensatz beschränkt schwer lesbar mit zwei. Compare nutzt 5-Dim-Bar-Stack mit A/B-Paaren statt Doppel-Ring.

### 6. Backwards-Compatibility

| Bestehender Mechanismus | Verhalten bei Multi-Level |
|-------------------------|---------------------------|
| Bookmarks (Story 1.26) | speichern weiter lat/lng. Level wird NICHT persistiert, beim Öffnen Default address. |
| Compare (Story 1.27) | same-level-lock, Level-Context geteilt. |
| WebMCP-Tools (2.7 + 6.8) | optionaler `level`-Param, default `address` (Story 8.5). Ohne Param = heutiges Verhalten. |
| Editorial-Disclaimer (1.27) | pro Layer + Level. `not-aggregatable` rendert Disclaimer-Card statt Wert. |
| Adress-Layer-Hits-Section | bei Level=address exakt heutiges Verhalten, kein Re-Layout. |

### 7. Missing-Data + Threshold

Aggregate folgen ADR-013-Regel: unter 50% Member-Coverage wird das Aggregat `null` und als `coverage:n/m-below-threshold` dokumentiert. Card zeigt dann "auf diesem Level zu wenig Daten" statt Fake-Wert.

### 8. Aggregat-Output-Format: static JSON

Die Pre-Aggregate (Story 8.2a) werden als **static JSON** unter `static/layer-aggregates/` ausgeliefert, analog `static/kiez-scores/kiez-scores.json` (ADR-013). NICHT Postgres.

Begründung:
- Der Inspector liest client-side. JSON-Fetch vom CDN ist günstiger als API-Call gegen Postgres und passt zum statischen Auslieferungs-Modell (kein Server-Roundtrip).
- Aggregate ändern sich nur bei Layer-Daten-Refresh (Build-Time), nicht zur Laufzeit. Kein Bedarf für DB-Query-Flexibilität.
- Schema-Skizze: `{ [layerSlug]: { kiez: { [kiezSlug]: Aggregat }, bezirk: { [bezirkSlug]: Aggregat }, berlin: Aggregat } }`, wobei `Aggregat` typ-abhängig ist (Median-Zahl + Spanne, Klassen-Verteilung, Coverage-Prozent etc.).
- Postgres bleibt vorbehalten falls Bezirks-/Kiez-Pages dieselben Layer-Aggregate als SSR-Content brauchen. Dann ist die JSON die Source-of-Truth und ein optionaler DB-Cache wird daraus gespeist (analog ADR-013-Pattern). Kein zweiter Berechnungspfad.

## Consequences

- **Positive:**
  - Klare Bau-Reihenfolge: `aggregate-layer-for-level.ts` Pure-Function implementiert exakt die Matrix-Spalte 2, Card-Komponenten lesen Visual-Typ aus Spalte 3, Compare-Gate aus Spalte 4.
  - Stigma-Disziplin strukturell verankert statt pro Card neu entschieden (Wohnlage/MSS/Stolpersteine/Composite nie mit Wertungs-Pfeil).
  - Methodisch fragwürdige Aggregate (BRW-Bezirks-Median) sind explizit verboten, nicht versehentlich gebaut.
  - Backwards-Compat-Matrix verhindert das Brechen von 50+ Tests; address-Default hält bestehende Konsumenten grün.
- **Negative:**
  - Pure-Function `aggregate-layer-for-level` muss pro Aggregat-Typ getestet werden (8 Typen × Edge-Cases). Hoher Test-Aufwand vor sichtbarem UI-Fortschritt.
  - Visual-Vielfalt (Ring, Verteilungs-Balken, Distanz-Ring, Coverage-Bar, Sparkline) heißt mehrere Chart-Primitive bauen + a11y-tauglich machen (sr-only-Tabellen je Visual).
  - Performance: viele Mini-Charts gleichzeitig im DOM. Lazy-Render collapsed-Visuals nötig.
- **Neutral:**
  - Planungsraum-Ebene bleibt intern, nicht als User-Level. Falls je gewünscht, ist es ein additiver Schritt.
  - Ring vs. Bar-Stack fürs Kiez-Score-Hero ist Detail-Design (User-Tendenz Ring), beeinflusst diese Matrix nicht.

## Story-Mapping

- Story 8.1: `inspector-level-context.svelte.ts` + Level-Toggle (liest diese Level-Definition).
- Story 8.1b: Inspector-Card-System + Visual-Primitives. Baut einmal das collapsible-Card mit Visual-Summary-Slot (Constraint Abschnitt 4) plus die Chart-Primitive aus Spalte 3 der Matrix (Score-Bar mit Median-Anker, Verteilungs-Balken, Coverage-Bar, Distanz-Ring, Kiez-Score-Ring, Sparkline-reuse), je a11y-tauglich mit sr-only-Tabelle. Konsumiert von Kiez-Score-Hero, 8.2b-Layer-Cards, Wahl-Card.
- Story 8.2a: Build-Time-Pre-Aggregation pro Layer × Level, Output static JSON (Abschnitt 8). Implementiert Spalte 2.
- Story 8.2b: `aggregate-layer-for-level.ts` liest die 8.2a-JSON + Section-Konsum mit den 8.1b-Primitiven (Spalte 3).
- Story 8.3: Karten-Polygon-Highlight nutzt bezirke / lor-bezirksregion Sources.
- Story 8.4: Compare same-level-lock + Diff-Gate aus Spalte 4.
- Story 8.5: WebMCP `level`-Param nach Backwards-Compat-Matrix, liest 8.2a-Aggregate.
