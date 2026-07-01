# Story 11.4: Vergleichswerte Kiez ↔ Bezirk ↔ Berlin im Steckbrief

Status: review

> **Anker:** Macht aus Einzelwerten Bedeutung. Liefert auch den Vergleichs-Input für 11.3 (FAQ) und 11.6 (Profile).
>
> **Abhängigkeiten:** Hard-Block 11.0 (Rang). Nutzt `bezirk_stats` + alle Kieze für Schnitt/Median.

## Story

As a User,
I want sehen wie mein Kiez relativ zum Bezirk und zu Berlin steht,
so that ein Einzelwert eine Bedeutung bekommt.

## Acceptance Criteria

1. **AC-1 (Vergleichs-Berechnung):**
   **Given** 11.0 + `bezirk_stats` + alle 143 `kiez_stats`
   **When** ein Build-Step je Kiez und Dimension/Metrik den Bezirks-Schnitt und den Berlin-Median berechnet
   **Then** entsteht pro Kiez ein Vergleichs-Datensatz (Kiez-Wert, Bezirks-Schnitt, Berlin-Median, Delta-Richtung)

2. **AC-2 (Steckbrief-Render):**
   **Given** der Vergleichs-Datensatz
   **When** der Steckbrief (`kiez-hero.svelte`) rendert
   **Then** zeigt er Kiez-Wert, Bezirks-Schnitt und Berlin-Median nebeneinander je Cluster/Dimension

3. **AC-3 (A11y + Anti-Stigma):**
   **Given** WCAG + ADR-015
   **When** Abweichungen dargestellt werden
   **Then** ist die Richtung als Text-Label ausgewiesen (über/unter Schnitt), nicht nur über Farbe; Sprache neutral

4. **AC-4 (TDD):**
   **Given** ADR-012
   **When** die Berechnung getestet wird
   **Then**: Mittelwert (Bezirk) / Median (Berlin), Missing-Data (Dimension `null` fällt aus dem Schnitt), Rundung, Delta-Richtung (inkl. invertierte Metriken) sind getestet

5. **AC-5 (Bezirk wie Kiez):**
   **Given** die Bezirks-Seite
   **When** 11.4 umgesetzt wird
   **Then** zeigt der Bezirks-Steckbrief den Berlin-Median-Vergleich (Bezirk vs. Berlin); Kiez-Ebene zusätzlich Bezirk

## Tasks / Subtasks

- [x] **Task 1: Vergleichs-Lib** (AC: #1, #4)
  - [x] 1.1 (RED) `scripts/lib/comparison/comparison.test.ts`: Mittel/Median, Missing-Data, invertierte Richtung, Rundung
  - [x] 1.2 (GREEN) `scripts/lib/comparison/comparison.ts`: pure `bezirkMean()` / `berlinMedian()` / `deltaDirection()`
  - [x] 1.3 In Score-/Stats-Aggregat-Lauf einhängen oder mit 11.0-Step bündeln; idempotent persistieren
- [x] **Task 2: Query + Durchreichen** (AC: #2)
  - [x] 2.1 `getKiezComparison(slug)` analog `get-kiez-stats.ts`; in `kiez/[slug]/+page.server.ts` laden
- [x] **Task 3: Steckbrief-UI** (AC: #2, #3)
  - [x] 3.1 `kiez-hero.svelte` Steckbrief-Tabelle (ab Zeile 188) um Spalten Bezirks-Schnitt + Berlin-Median erweitern
  - [x] 3.2 Text-Label für Delta-Richtung (kein Farb-only), A11y-Test
- [x] **Task 4: Bezirk-Seite** (AC: #5)
  - [x] 4.1 Analoges Rendering in `bezirk/[slug]` (Audit aus 11.9)

## Dev Notes

### Ist-Zustand

- `kiez-hero.svelte:188` Steckbrief-Tabelle zeigt aktuell nur Dominant-Wert je Cluster. Score-Section `:165`, scoreDims `:142`.
- `kiez/[slug]/+page.server.ts:221-227` lädt stats/score parallel; Vergleich additiv anhängen.
- `bezirk_stats`/`kiez_stats` (`schema/*-stats.ts`) liefern die Werte; `AggregateValue`-Triple für Attribution.
- `scripts/aggregate-scores.ts`/`aggregate-data.ts` als Einhäng-Punkt für die Vergleichs-Berechnung.

### Architektur-Compliance

- Vergleich Build-Zeit berechnet (kein Laufzeit-Loop über 143 Kieze).
- Median vs. Mittel bewusst: Bezirk = Mittel der Kieze, Berlin = Median (robuster gegen Ausreißer); im Test fixiert.
- A11y: Delta als `<span>`-Text + visuelles Signal, nie Farbe allein (Projekt-Priorität Barrierefreiheit).

### Was nicht brechen darf

- Bestehende Steckbrief-Darstellung bleibt lesbar (responsive, Tabelle nicht überladen). Mobile-Layout prüfen.
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 11.0:** invertierte Richtung pro Metrik wiederverwenden (Delta-Richtung).
- **Story 10.5:** neutraler Kontext-Block-Muster (ADR-015) als A11y/Anti-Stigma-Vorbild.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.4]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 1.4]
- [Source: src/lib/components/atlas/kiez-hero.svelte:142-188]
- [Source: src/routes/(with-header)/kiez/[slug]/+page.server.ts:221-227]
- [Source: src/lib/server/db/schema/bezirk-stats.ts]
- [Source: scripts/aggregate-scores.ts]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Completion Notes List

- UI-Entscheidung (Owner): Extra-Spalten-Tabelle (Kiez/Bezirk-Ø/Berlin) + Rang sichtbar, als eigene „Im Vergleich"-Section über dem Steckbrief. Nur die 5 numerischen Score-Dimensionen (kategoriale Cluster haben keinen Mittelwert).
- Anti-Stigma (ADR-015): `formatRank` zeigt exakten Rang für Q1–Q3, „unteres Viertel" statt „Platz 143 von 143" für Q4.
- Berlin = Median (robuster gegen Ausreißer als Mittel); Bezirk-Ø = Mittel der Kieze im Bezirk. Im Footnote erklärt.
- A11y: Werte als Text, Rang als Text-Label, row-scope-Header, kein Farb-only. Tabelle `overflow-x-auto` für Mobile.
- Bezirk-Seite (AC-5): gleiche Komponente ohne Bezirk-Spalte, Bezirk vs Berlin-Median (über 12 Bezirke).
- Render-Smoke `/kiez/alexanderplatz`: „Platz 2 von 143", „unteres Viertel" bestätigt.
- Suite 2756 grün, `pnpm check` 0 Errors.

### File List

**Neu:** scripts/lib/comparison/{comparison,comparison.test}.ts, scripts/aggregate-comparison.ts, src/lib/server/db/schema/{kiez,bezirk}-comparison.ts, src/lib/server/db/queries/get-{kiez,bezirk}-comparison.ts, src/lib/data/{rank-format,rank-format.test,comparison-types}.ts, src/lib/components/atlas/score-comparison-table.svelte (+ .test.ts), drizzle/migrations/0005_daily_silhouette.sql (+ snapshot)
**Geändert:** src/lib/server/db/schema/index.ts, package.json (data:comparison), kiez/bezirk +page.server.ts + +page.svelte, kiez-hero.svelte, bezirk-hero.svelte

## Change Log

- 2026-06-06: Story 11.4 implementiert. Kiez↔Bezirk↔Berlin-Vergleich + Rang/Quartil im Steckbrief (Kiez + Bezirk), Anti-Stigma-Rang. Status → review.
