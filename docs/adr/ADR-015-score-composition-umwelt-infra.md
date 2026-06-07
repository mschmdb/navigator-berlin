---
status: Accepted
date: 2026-05-20
deciders: solo-maintainer
supersedes: ADR-013 (nur Dimensions-Festlegung; Aggregations-Strategie A bleibt gültig)
extended-by: ADR-017 (Versorgung um Nahversorgung), ADR-018 (Kultur als 6. Dimension, Option C nicht im Composite)
---

# ADR-015: Score-Komposition als Umwelt- & Infrastruktur-Score (anti-stigma)

> **Erweiterungen:** ADR-017 erweitert die Versorgungs-Dimension um private Nahversorgung. ADR-018 fügt Kultur als eigenständige sechste Dimension hinzu, die NICHT in den Composite einfließt (Option C). Die fünf Composite-Dimensionen dieses ADR bleiben unverändert.

## Context

Der Kiez-Score (ADR-013, Story 1.28) wichtet fünf Dimensionen gleich (je 0.20): Ruhe-Luft, Grün, Mobilität, **Soziale Lage** (MSS), Versorgung.

**Kern-Widerspruch:** Der Score wichtet „Soziale Lage" (strukturelle MSS-Daten: Status/Dynamik) mit ein, behauptet im Disclaimer aber „keine Wohnqualität". Das beißt sich. Wenn ein Kiez mit höherem Sozialstatus „besser" scort, stigmatisiert der Score genau die Kieze mit niedrigem Status als „schlechter zu leben". Das verletzt die selbstgesetzte rote Linie (Memory `feedback_no_lebenswert`, `project_compare_editorial_profiles`: Sozialstatus/Wohnlage/Bodenrichtwert sind wertungsneutral, kein „besser").

Zusätzlich: „Soziale Lage" mischt eine value-geladene, kontestierte Größe in einen Score, der sonst aus klar gerichteten Umwelt-/Infrastruktur-Größen besteht.

## Decision

**Der Score misst nur Größen mit eindeutiger Besser-Richtung für jeden Bewohner** (saubere Luft, Ruhe, Grün, Hitzeschutz, Erreichbarkeit, Verdrängungsschutz). **Sozialstruktur ist kein Qualitäts-Kriterium → raus aus dem Score, rein als neutraler Kontext.** Das löst den Widerspruch und ist anti-stigma.

Der Score wird ehrlich benannt: **„Umwelt- & Infrastruktur-Score"**, nicht „wie gut lebt es sich".

### Neue Dimensionen (5 × 0.20)

1. **Ruhe & Luft** — `laerm-2023`, `luft-2023`
2. **Grün & Hitze** — `gruenversorgung-2023`, `gruenanlagen`, `bioklima-2023`, `klima-pet-2022`, `klima-kaltlufteinwirkbereich-2022`, `klima-leitbahnkorridor-2022`
3. **Mobilität** — ÖPNV (U/S/Tram/Bus), Rad
4. **Versorgung** — `kitas-2024`, `schulen-2024`, `krankenhaeuser-plan`, `spielplaetze`
5. **Wohnschutz** — `milieuschutz-erhaltungsmiete`, `milieuschutz-staedtebau` (Verdrängungsschutz, positiv-eindeutig)

### Neutraler Kontext (NICHT gescort, nur angezeigt)

- `mss-gesamtindex-2025` (Soziale Lage) — strukturelle Info, keine Wertung
- `umweltgerechtigkeit-2023` — gehört thematisch zu Soziale Lage (wer trägt die Umweltlast), bleibt neutral
- `wohnlagen-2024` (Mietspiegel), `bodenrichtwerte` — wertungsneutral
- **Bezahlbarkeit bleibt bewusst draußen** (kontestiert + keine belastbaren Adress-Daten)

### Nicht im Score, eigene Blöcke

- Wahl (Stimmenanteile, kein Wohnkriterium)
- Erinnerung (Denkmal/Stolpersteine) — wird komplett aus dem Frontend genommen (User-Decision 2026-05-20)

### Persona-Gewichtung (Idee B) = späteres eigenes Epic

Der `persona`-Slot im Score-Typ bleibt, Gewichtung pro Persona (Familie/Senior:in/Pendler:in) wird separat geplant.

## Consequences

**Blast-Radius (~45 Files), Migration dependency-getrieben:**

1. **Spec/Foundation:** `scripts/lib/kiez-score/types.ts` (`KiezScoreDimension`-Union: `soziale-lage` → `wohnschutz`, `gruen` → `gruen-hitze`), `dimension-config.ts`, `DIMENSION_WEIGHTS`.
2. **DB-Schema-Migration:** `kiez_score`/`bezirk_score` Spalten `soziale_lage` → entfällt, `gruen` → `gruen_hitze`, neu `wohnschutz`. Drizzle-Migration.
3. **Pipeline:** `compute-score.ts`, `build-kiez-scores.ts`, `aggregate-scores.ts` → Re-Run (`kiez-scores.json` + DB neu).
4. **Konsumenten:** `kiez-score-display.ts` (Labels), Inspector/Compare/Hero/Ring, `score-ranking-table`, Choropleth-Score-Layer (`choropleth-family`, `layer-style-builder`, `layer-synonyms`, `layer-palette-filter`), OG (`score-card-data`), LLM-Renderer, `layer-methodology.ts`.
5. **Content:** `/methodik/kiez-score`, `/wo-lebt-es-sich-gut`.
6. **Tests** über alle Ebenen.

**Memory:** ersetzt `project_kiez_score_dimensions` (5-Dim-Set veraltet).

**Risiko:** größter Single-Change des Projekts. Sequenziell in Stories, Foundation → Schema → Pipeline → Konsumenten → Content, jeweils grün vor dem nächsten Schritt.
