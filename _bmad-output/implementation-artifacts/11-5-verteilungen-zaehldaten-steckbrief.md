# Story 11.5: Verteilungen & Zähldaten im Steckbrief sichtbar machen

Status: review

> **Anker:** Hebt vorhandene, ungenutzte Felder auf die Seite. Score-unabhängig, kann parallel zu 11.3/11.4 laufen.
>
> **Abhängigkeiten:** Keine harte. Ergänzt sich mit 11.4 (gleiche Steckbrief-Komponente, Merge-Koordination).

## Story

As a User,
I want statt nur „dominant: mittel" die Verteilung und die konkreten Zähldaten sehen,
so that ich die reale Lage statt einer Ordinal-Spitze verstehe.

## Acceptance Criteria

1. **AC-1 (Verteilungen rendern):**
   **Given** vorhandene Felder `categoryDistribution` (laerm/luft), `versorgungDistribution`, `wohnlageDistribution`, `mssDistribution`
   **When** der Steckbrief sie darstellt
   **Then** erscheint je betroffenem Cluster eine Verteilung (z.B. „70% mittel, 20% hoch, 10% niedrig") zusätzlich zum Dominant-Wert

2. **AC-2 (Zähldaten rendern):**
   **Given** vorhandene Counts `gruenanlagenCount`, `spielplaetzeCount`, `uBahnCount`/`sBahnCount`/`tramCount`/`busCount`, `kitasPerKm2`, `schulenPerKm2`, `denkmalPerKm2`, `stolpersteinePerKm2`
   **When** der Steckbrief sie zeigt
   **Then** erscheint je Cluster mindestens eine konkrete Zahl statt nur der Ordinal-Spitze

3. **AC-3 (A11y):**
   **Given** WCAG
   **When** Verteilungen visualisiert werden (Balken o.ä.)
   **Then** sind alle Werte als Text zugänglich, nicht nur als Balken/Farbe

4. **AC-4 (Attribution, FR40):**
   **Given** jede gezeigte Zahl
   **When** sie erscheint
   **Then** bleibt Layer-Quelle + Stand aus dem `AggregateValue`-Triple attribuiert (Tooltip/Fußnote/Methodik-Link)

5. **AC-5 (TDD wo Logik):**
   **Given** ADR-012
   **When** Distribution-/Count-Formatter getestet werden
   **Then**: Prozent-Summierung (~100%), Null-Felder (kein Crash, „keine Daten"), Singular/Plural sind getestet. Reines Markup/Styling ist TDD-ausgenommen

## Tasks / Subtasks

- [x] **Task 1: Formatter** (AC: #1, #2, #5)
  - [x] 1.1 (RED) Tests für `formatDistribution()` (Prozent, Summe, leer) + `formatCount()` (Singular/Plural, null)
  - [x] 1.2 (GREEN) Formatter in `src/lib/data/faq-helpers/*` erweitern oder neues `src/lib/data/steckbrief/format.ts`
- [x] **Task 2: Steckbrief-UI** (AC: #1, #2, #3, #4)
  - [x] 2.1 `kiez-hero.svelte` Steckbrief je Cluster um Verteilung + Counts erweitern
  - [x] 2.2 A11y: Text-Repräsentation jeder Visualisierung; Attribution-Hinweis
- [x] **Task 3: Bezirk-Seite** (AC: #1, #2)
  - [x] 3.1 Analog in `bezirk/[slug]` (Audit 11.9)

## Dev Notes

### Ist-Zustand

- `aggregate-types.ts`: `LaermAggregat.categoryDistribution` (Zeile 26), `GruenAggregat.versorgungDistribution`/`gruenanlagenCount`/`spielplaetzeCount` (34-39), `OepnvAggregat` Counts (53-58), `BildungAggregat` (61-63), `HeritageAggregat` (72-74), `WohnenAggregat.wohnlageDistribution`/`mssDistribution` (46-50). Alle als `AggregateValue<...> | null`.
- `kiez-hero.svelte:188` zeigt aktuell nur Dominant pro Cluster → hier andocken.
- `src/lib/data/faq-helpers/*` enthalten bereits Klassen-Beschreibungs-Helper, erweiterbar um Distribution/Count-Formatter.

### Architektur-Compliance

- Reuse vor Neubau: faq-helpers prüfen, bevor neue Formatter entstehen.
- Files <500 Zeilen; falls `kiez-hero.svelte` zu groß wird, Steckbrief in Subkomponente auslagern.
- A11y first (Projekt-Priorität).

### Was nicht brechen darf

- FAQ + Score-Sektionen unverändert. Bei Merge mit 11.4: gemeinsame Steckbrief-Komponente koordinieren (eine PR-Reihenfolge festlegen).
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 1.22:** Skala-Harmonisierung Grünversorgung — Klassen-Mapping-Muster.
- **Story 10.8:** A11y/Styling-Sichtbarkeit (kein Farb-only) als Vorbild.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.5]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Abschnitt 4 + Stufe 1.5]
- [Source: src/lib/server/db/schema/aggregate-types.ts:24-74]
- [Source: src/lib/components/atlas/kiez-hero.svelte:188]
- [Source: src/lib/data/faq-helpers/gruen.ts] (+ oepnv/wohnen/klima/laerm)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Completion Notes List

- UI-Entscheidung (Owner): Mini-Balken + Text. `distribution-bar.svelte`: dekorativer Balken (aria-hidden) + Prozent-Text daneben (A11y, kein Farb-only).
- Util `src/lib/data/steckbrief-extras.ts`: `toSegments` (Anteile sortiert, kapitalisiert, 0 gefiltert), `distributionText`, `countsText` (null/0 raus). TDD.
- Steckbrief erweitert in kiez-hero + bezirk-hero: Lärm/Grünversorgung/Wohnlage → Verteilungs-Balken; Grünversorgung → „Grünanlagen X · Spielplätze Y"; ÖPNV → „U/S/Tram/Bus"-Counts. Quelle/Stand-Attribution (FR40) bleibt je Zeile.
- Verteilungswerte sind Anteile (0–1), kein eigener Render-Wert nötig.
- Verify `/kiez/alexanderplatz`: „Grünanlagen 75 · Spielplätze 44", „Mittel 67% · Gut 17%", „U 13 · …". Suite 2770 grün, check 0 Errors.
- Hinweis (separat, pre-existing): `prettier`/`prettier-plugin-tailwindcss` bricht auf allen Svelte-Dateien (sucht fehlende `src/routes/layout.css`). svelte-check ist grün; Lint-Tooling-Gap unabhängig von dieser Story.

### File List

**Neu:** src/lib/data/steckbrief-extras.ts (+ .test.ts), src/lib/components/atlas/distribution-bar.svelte (+ .test.ts)
**Geändert:** src/lib/components/atlas/kiez-hero.svelte, bezirk-hero.svelte (Verteilungen + Counts im Steckbrief)

## Change Log

- 2026-06-07: Story 11.5 implementiert. Verteilungs-Mini-Balken + Zähldaten im Steckbrief (Kiez + Bezirk), A11y-Text. Status → review.
