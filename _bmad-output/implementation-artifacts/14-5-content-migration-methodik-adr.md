# Story 14.5: Content-Migration (Methodik + ADR-Link + wo-lebt-es-sich-gut)

Status: review

> **Anker:** ADR-019. Analog Story 13.5.
> **Hard-Block:** Story 14.3 `done`. Parallel zu 14.4 möglich.

## Story

As a User,
I want dass die Methodik-Seite die Kriminalitäts-Dimension und ihre Grenzen erklärt,
so that die Darstellung transparent, nicht-stigmatisierend und als Nicht-Composite-Kontext erkennbar ist.

## Kontext: Warum dieser Change

Die Score-Erweiterung muss dokumentiert werden: was gemessen wird, woher, mit welchen Grenzen, und warum sie NICHT in den Gesamt-Score zählt. ADR-019 existiert bereits (im Analyst-Schritt geschrieben); diese Story verlinkt + spiegelt sie in der User-facing Methodik.

## Acceptance Criteria

1. **AC-1 (Methodik-Seite + Doc):**
   **Given** die neue Dimension
   **When** ich `/methodik/kiez-score` + `docs/scoring-methodology.md` aktualisiere
   **Then** sind Delikt-Auswahl/Gewichte, Quelle (Kriminalitätsatlas/Polizei Berlin, dl-de-by-2.0), HZ-Definition, 3-Jahres-Mittel, **BR-Granularität (gröber als die fünf PLR-nativen Dimensionen)** und alle Caveats (Touristen/Pendler, Tatortprinzip, Dunkelfeld, kleine Fallzahlen) erklärt
   **And** explizit: **nicht im Composite, kein „Sicherheits-Ranking", keine „sicher/gefährlich"-Wertung**

2. **AC-2 (ADR-Verlinkung):**
   **Given** ADR-019 + `docs/kriminalitaetsdaten-methodik.md`
   **When** die Doku-Konsistenz geprüft wird
   **Then** sind Methodik, ADR-019 und das Methodik-Daten-Doc verlinkt und stimmig (Option-C-Mechanik + Stigma-Framing durchgängig)

3. **AC-3 (wo-lebt-es-sich-gut):**
   **Given** `/wo-lebt-es-sich-gut`
   **When** die Seite die Scores nutzt
   **Then** bleibt der Composite-Rang unverändert; falls Kriminalität als Kontext gezeigt wird, dann Indigo + Caveat, ohne Gut-Rang-Wertung

## Tasks / Subtasks

- [x] **Task 1: Methodik-Page + scoring-methodology.md** (AC: #1)
  - [x] 1.1 `/methodik/kiez-score`: Kriminalitäts-Dimension im Daten-Array + Gewichte-Tabelle (Gewicht 0) + Prosa „sieben Dimensionen" + Datenquelle Polizei Berlin
  - [x] 1.2 `docs/scoring-methodology.md`: Dimension 7 dokumentiert (Delikt-Set, HZ, 3-J-Mittel, minAt/maxAt, BR-Granularität, alle Caveats, Option-C, Strukturell-Indigo); Ranking-Ausschluss notiert
  - [x] 1.3 Bonus (Review-Fund): `layer-methodology.ts` + `authorities.ts` — `/layer/kiez-score-kriminalitaet` zeigte „Methodik in Vorbereitung"-Stub, jetzt volle Methodik-Section (Authority Polizei Berlin, lor-bezirksregion, Caveats/Omissions)
- [x] **Task 2: Verlinkung + Konsistenz** (AC: #2)
  - [x] 2.1 ADR-019 + `kriminalitaetsdaten-methodik.md` aus scoring-methodology verlinkt; „fünf/sechs Dimensionen"-Stellen auf „sieben (5 + Kultur + Kriminalität)" gezogen; Owner-bestätigte Werte (maxAt=1750, gleichgewichtet) in Code-Kommentaren festgehalten
- [x] **Task 3: wo-lebt-es-sich-gut** (AC: #3)
  - [x] 3.1 Composite-Rang unverändert (0/542 overall-Diff aus 14.3); Kriminalität NICHT im Ranking (`aggregate-ranks.ts` METRICS schließt sie aus → kein Sicherheits-Leaderboard), Ranking-Seite unberührt

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- `docs/scoring-methodology.md` beschreibt 5 Composite + Kultur (Option C, ADR-018). Kriminalität analog Kultur ergänzen, aber als **Strukturell-Kontext** (näher an der Soziale-Lage-Beschreibung).
- ADR-019 + `docs/kriminalitaetsdaten-methodik.md` sind im Analyst-Schritt entstanden → nur verlinken + spiegeln, nicht neu schreiben.

### Was nicht brechen darf

- Keine „Sicherheits-Score"- oder „lebenswert"-Formulierung (Forbidden-Tokens). Composite-Beschreibung bleibt „Mittel der fünf".

## References

- `docs/scoring-methodology.md`, `docs/kriminalitaetsdaten-methodik.md`, `docs/adr/ADR-019-...md`
- Route `/methodik/kiez-score`, `/wo-lebt-es-sich-gut`
- `_bmad-output/implementation-artifacts/13-5-content-migration-methodik-adr.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- **scoring-methodology.md:** neue Dimension 7 „Erfasste Kriminalität" (Delikt-Set + Gewichte, Quelle/Lizenz, HZ-Definition, 3-J-Mittel, Normalisierung minAt=300/maxAt=1750 mit City-Core-Kappung, BR-Granularität, alle Caveats, Option-C). Strukturell-Indigo in der Choropleth-Familien-Liste ergänzt. Ranking-Abschnitt: Kriminalität wird bewusst NICHT gerankt (kein Sicherheits-Leaderboard). Übersicht/Intro auf „7 Dimensionen" gezogen.
- **/methodik/kiez-score:** Dimension im Daten-Array (Quelle, Delikte, BR-Granularität, Caveats, Nicht-Composite, kein „sicher/gefährlich"), Gewichte-Tabelle (Gewicht 0), Datenquellen-Section + Polizei Berlin, alle „sechs/sechste"-Prosa auf „sieben/Kontext-Dimensionen", Meta-Description.
- **Layer-Detail-Fix (Review-Fund):** `/layer/kiez-score-kriminalitaet` zeigte „Methodik in Vorbereitung", weil `LAYER_METHODOLOGY` keinen Eintrag hatte. Eintrag ergänzt (calculation, aggregationLevel lor-bezirksregion, Caveats, Omissions) + neuer Authority-Key `navigator-eigenberechnung-kriminalitaetsatlas` (Polizei Berlin). Stub weg, volle Methodik-Section rendert.
- **Owner-Decisions (2026-06-10) fixiert:** maxAt=1750 (City-Core-Kappung) + gleichgewichtete Delikte bestätigt → „vorläufig/Owner-Review-pflichtig"-Kommentare in `dimension-config.ts` + `kriminalitaet/aggregate.ts` auf „Owner-bestätigt" aktualisiert. 14-6-Spike damit nicht mehr blockierend.
- **AC-3:** Composite-Rang bit-stabil (0/542 aus 14.3), Kriminalität aus `aggregate-ranks.ts` METRICS ausgeschlossen → /wo-lebt-es-sich-gut unberührt.
- **Verifikation:** `pnpm check` 0 Errors / 6290 Files, Unit-Suite **2833/2833 grün**.

### File List

**Geändert:**
- `docs/scoring-methodology.md`
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte`
- `src/lib/data/layer-methodology.ts`, `src/lib/data/authorities.ts` (Layer-Detail-Methodik + Authority)
- `scripts/lib/kiez-score/dimension-config.ts`, `scripts/lib/kriminalitaet/aggregate.ts` (Owner-bestätigt-Kommentare)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-5 → review)

### Debug Log References

- Review-Fund: Layer-Detail-Seite Stub „Methodik in Vorbereitung" → getLayerMethodology('kiez-score-kriminalitaet') war null. Nach Eintrag: non-null, authority Polizei Berlin.

## Change Log

- 2026-06-09: Story 14.5 erstellt (ready-for-dev). Methodik + ADR-019-Link, Nicht-Composite + Stigma-Framing explizit.
- 2026-06-10: Story 14.5 implementiert (→ review). Methodik-Page + scoring-methodology + Layer-Detail-Methodik (Stub-Fix) + Owner-Decisions fixiert. check 0 Errors, 2833 grün.
