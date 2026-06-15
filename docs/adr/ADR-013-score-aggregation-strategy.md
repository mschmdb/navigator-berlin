---
status: Accepted
date: 2026-05-16
deciders: solo-maintainer
---

# ADR-013: Score-Aggregations-Strategie (Variante A multi-level)

## Context

Story 1.28 hat den Kiez-Score auf 542 LOR-Planungsraum-Ebene implementiert. Source-of-Truth: `static/kiez-scores/kiez-scores.json`. Fünf Dimensionen (Ruhe-Luft, Grün, Mobilität, Soziale Lage, Versorgung), Gewichte gleich (je 0.20).

Epic 2.9a verlangt zusätzliche Score-Aggregate auf 143 LOR-Bezirksregionen + 12 Bezirken, plus Persistenz in Postgres-Tabellen `bezirk_score` und `kiez_score` (Schema aus Story 2.0). Der Epic-Wortlaut nannte sechs Cluster (Lärm, Luft, Klima, Grün, ÖPNV, Bildung), was nicht mit dem 1.28-Ist-Stand übereinstimmt.

Drei Varianten wurden diskutiert:

| Variante                                    | Vorteile                                        | Nachteile                                       |
| ------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| A: Aggregation 542 → 143 → 12               | Single-Source 1.28; deterministisch; kein Drift | Aggregations-Helper neu, Flächen-Gewichte nötig |
| B: Re-implement gegen Postgres-Aggregat     | folgt Epic-Wortlaut wörtlich                    | doppelter Datenpfad, 1.28 wird obsolet          |
| C: Hybrid (1.28 für PLR/BR, neu für Bezirk) | minimal neuer Code                              | drei parallele Score-Logiken                    |

## Decision

**Variante A.** Story 2.9a aggregiert die 1.28-JSON via flächen-gewichtetem Mittel pro Dimension auf BR + Bezirk. Postgres-Tabellen sind Build-Time-Cache, kein zweiter Berechnungspfad.

**Dimensionen bleiben wie 1.28 fest:** Ruhe-Luft, Grün, Mobilität, Soziale Lage, Versorgung. Gewichte 5 × 0.20. Memory `project_kiez_score_dimensions`.

**Epic-Wortlaut „Lärm / Luft / Klima / ÖPNV / Bildung" ist hiermit superseded.** Das 1.28-Mapping bildet die Epic-Begriffe auf die fünf Dimensionen ab:

- Lärm + Luft konsolidiert in Ruhe-Luft
- Klima fließt in Grün (Kaltluft + Leitbahn) plus in Ruhe-Luft (Bioklima)
- ÖPNV = Mobilität
- Bildung ist Teil von Versorgung (Kitas, Schulen)
- Soziale Lage als eigene Dimension hinzu (Story 1.30 MSS-Pivot, 2026-05-15)

**Aggregations-Regel pro Dimension d und Region R mit Member-Planungsräumen P_1..P_n:**

```
dim_value(R, d) = Σ (dim_value(P_i, d) × area(P_i)) / Σ area(P_i)
                  über alle P_i mit dim_value(P_i, d) ≠ null
```

`overall(R)` wird neu berechnet als ungewichtetes Mittel der aggregierten non-null Dimensionen (re-use `computeOverallScore` aus 1.28). NICHT separat aggregiert, sonst Drift gegenüber 1.28-Definition.

**Missing-Data-Threshold:** 50 Prozent Coverage. Falls weniger als die Hälfte der Member-Planungsräume einen non-null Dimensionswert haben, wird die Dimension auf `null` gesetzt und im `missingData`-Array dokumentiert (z.B. `coverage:1/4-below-50%-threshold`).

**LOR-Hierarchie-Mapping:** Property-basiert, kein Spatial-Containment. Berliner LOR-Codes sind hierarchisch kodiert (PLR_ID = 8-stellig, erste 6 Zeichen = BZR_ID, erste 2 = BEZ-Code). Verifiziert auf ODIS-Datensatz 2021: 0 Mismatches in 542 Features.

## Consequences

- **Positive:**
  - `static/kiez-scores/kiez-scores.json` bleibt einzige Score-Quelle. Inspector liest direkt JSON, Bezirks-/Kiez-Pages lesen Postgres-Cache.
  - Methodik bleibt konsistent über PLR / BR / Bezirk.
  - Aggregation als pure function testbar, 100 Prozent Coverage erreichbar ohne DB-Setup.
  - Bezirks-Score-Composite kann für die Ranking-Page (Story 2.9b) sortiert werden, ohne 1.28-Pipeline-Rerun.
- **Negative:**
  - Hierarchie an PLR-ID-Konvention gebunden. Bei künftiger LOR-Reform-2030 müsste Mapping nachjustiert werden, dann ist Spatial-Containment-Fallback Plan B.
  - Stigma-Empfindlichkeit: Bezirks-Composite-Score wird häufig gelesen. Editorial-Disziplin pflicht: kein Composite-Single-Score auf Karte (siehe Story-Notes + Memory `project_compare_editorial_profiles`).
- **Neutral:**
  - 143 statt der ursprünglich im Epic angenommenen 138 LOR-Bezirksregionen. Tatsächlicher ODIS-Datensatz hat 143 BZR, nicht 138. Beide Werte werden in zukünftigen Dokumenten konsistent angeglichen.
  - Heerstraße-Slug-Kollision (gleicher BZR-Name in Spandau + Charlottenburg-Wilmersdorf) wird via Bezirks-Suffix aufgelöst (`heerstrasse-spandau`, `heerstrasse-charlottenburg-wilmersdorf`). Gleicher Pattern wie Story 2.0 für `kiez_stats`.

## References

- Story 2.9a: `_bmad-output/implementation-artifacts/2-9a-kiez-score-bezirks-score-aggregat-berechnung.md`
- Story 1.28: `_bmad-output/implementation-artifacts/1-28-livability-index.md`
- Story 2.0: `_bmad-output/implementation-artifacts/2-0-postgres-aggregat-foundation-drizzle-build-step.md`
- Methodology-Doku: `docs/scoring-methodology.md`
- Memory: `project_kiez_score_dimensions`, `project_mss_kiez_score_input`, `feedback_no_lebenswert`, `project_kiez_score_naming`
