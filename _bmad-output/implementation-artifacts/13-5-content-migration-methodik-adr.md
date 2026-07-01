# Story 13.5: Content-Migration (Methodik + wo-lebt-es-sich-gut + ADR)

Status: ready-for-dev

> **Anker:** ADR-012 (Doku/Content, Server-Loader mit Logik = TDD). Strukturell analog Story 9.5. Parallel-möglich zu 13.4 nach 13.3.
> **Hard-Block:** Story 13.3 `done` (Kultur-Werte + Rang/Vergleich in DB).

## Story

As a User,
I want dass Methodik-Seite und Ranking-Page die Kultur-Dimension erklären,
so that die erweiterte Score-Logik transparent ist.

## Kontext: Warum dieser Change

Die Methodik-Seite sagt „fünf Dimensionen / je 20 Prozent". Mit Kultur sind es sechs Dimensionen insgesamt — aber nur fünf zählen in den Gesamt-Score (je 20 %), Kultur ist die sechste und steht eigenständig daneben (Option C, NICHT im Composite). Die Methodik muss diese Unterscheidung sauber erklären. Die Ranking-Page + Detail-Page-Server bauen `RankingRow`/`ComparisonDimRow` per Hand und müssen `kultur` durchreichen. Plus eine ADR analog ADR-015.

## Acceptance Criteria

1. **AC-1 (Methodik-Page):**
   **Given** die 6. Dimension
   **When** ich `/methodik/kiez-score/+page.svelte` aktualisiere
   **Then** `dimensions`-Array (Z.26–63) hat einen `kultur`-Eintrag (als sechste, sichtbare Dimension), die Gewichts-Tabelle (Z.205–209) führt Kultur mit dem Hinweis „nicht im Gesamt-Score", die Prosa (Z.11,143,167,193,248,266) erklärt: sechs Dimensionen insgesamt, fünf im Gesamt-Score (je 20 %, ungewichtetes Mittel der fünf), Kultur als sechste eigenständig (Option C)

2. **AC-2 (scoring-methodology.md):**
   **Given** `docs/scoring-methodology.md`
   **When** es aktualisiert wird
   **Then** Kultur-Dimension, ihre Terme/Gewichte, Quelle (OSM/ODbL) und die Center-Bias-Dämpfung sind beschrieben, „Fünf Dimensionen" → sechs

3. **AC-3 (Ranking + Detail-Server):**
   **Given** die hand-gelisteten Row-Builder
   **When** ich die Server-Loader migriere
   **Then** `umwelt-infrastruktur-score/+page.server.ts` (beide `RankingRow`-Blöcke Z.52–56 + Z.79–83), `kiez/[slug]/+page.server.ts` (`SCORE_DIMS` Z.101–106) und `bezirk/[slug]/+page.server.ts` (`SCORE_DIMS` Z.16–21) enthalten `kultur`
   **And** Ranking-Tabelle + Detail-Steckbriefe zeigen den Kultur-Wert/Rang/Vergleich

4. **AC-4 (ADR):**
   **Given** die Score-Erweiterung
   **When** eine ADR entsteht (analog ADR-015)
   **Then** sie dokumentiert: Kultur als 6. Dimension (eigene, nicht in Versorgung), editoriale Ausschlüsse (Memorial/Heritage, Sammlungsdaten, Clubkataster), Dämpfungs-Wahl, Gewichts-Entscheid

5. **AC-5 (INDEX + Verify):**
   **Given** der `docs/`-Tree
   **When** abgeschlossen
   **Then** `docs/INDEX.md` verweist auf ADR + Methodik-Update, `pnpm test`/`pnpm check` grün, die Unterscheidung „sechs Dimensionen / fünf im Gesamt-Score" ist konsistent (keine Stelle behauptet Kultur sei im Composite)

## Tasks / Subtasks

- [ ] **Task 1: Methodik-Page** (AC: #1)
  - [ ] 1.1 `src/routes/(with-header)/methodik/kiez-score/+page.svelte`: `dimensions`-Array (Z.26–63) Kultur-Eintrag (id/label/layers/detail)
  - [ ] 1.2 Gewichts-Tabelle Z.205–209: Kultur-Zeile + Gewichte aktualisieren (je nach 13.1: 6 × 16,7 % oder Kultur leichter)
  - [ ] 1.3 Prosa Z.11,143,167,193,248,266: sechs Dimensionen insgesamt erklären, Gesamt-Score = fünf (je 20 %, „Mittel der fünf" bleibt korrekt), Kultur als sechste separat (nicht im Gesamt). ADR-Notiz Option C verlinken

- [ ] **Task 2: scoring-methodology.md** (AC: #2)
  - [ ] 2.1 „Fünf Dimensionen"-Abschnitt → sechs, Kultur-Punkt mit Termen/Quelle/Dämpfung; Gewichts-Tabelle/Text anpassen

- [ ] **Task 3: Server-Loader** (AC: #3)
  - [ ] 3.1 (RED) Server-Test/Smoke: Ranking + Detail liefern `kultur`
  - [ ] 3.2 `src/routes/(with-header)/umwelt-infrastruktur-score/+page.server.ts`: beide `RankingRow`-Blöcke (Z.52–56, Z.79–83) + `kultur: r.kultur`
  - [ ] 3.3 `src/routes/(with-header)/kiez/[slug]/+page.server.ts`: `SCORE_DIMS` (Z.101–106) + Kultur-Eintrag
  - [ ] 3.4 `src/routes/(with-header)/bezirk/[slug]/+page.server.ts`: `SCORE_DIMS` (Z.16–21) + Kultur-Eintrag
  - [ ] 3.5 Hinweis: `get-kiez-rank.ts`/`get-kiez-comparison.ts` sind metricKey-generisch → kein Edit (Kultur-metricKey kommt aus 13.3-Daten)

- [ ] **Task 4: ADR** (AC: #4)
  - [ ] 4.1 `docs/adr/ADR-0XX-kultur-score-dimension.md` (nächste freie Nummer): Entscheidung, Ausschlüsse, Dämpfung, Gewichte. Muster ADR-015

- [ ] **Task 5: INDEX + Verify** (AC: #5)
  - [ ] 5.1 `docs/INDEX.md` + ADR + Methodik-Update
  - [ ] 5.2 `pnpm test`/`pnpm check` grün, Grep-Sweep: keine Stelle stellt Kultur als Gesamt-Score-Bestandteil dar; „fünf im Gesamt" / „sechs gesamt" konsistent

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`/methodik/kiez-score/+page.svelte`**: `dimensions`-Array Z.26–63 (5, dynamisch gerendert), Gewichts-Tabelle hand-`<tr>` Z.205–209, Prosa „fünf"/„20 Prozent" Z.11,143,167,193,248,266.
- **`umwelt-infrastruktur-score/+page.server.ts`** (bedient auch alten Slug `/wo-lebt-es-sich-gut` via 301): `RankingRow` hand-gelistet, Kieze Z.52–56, Bezirke Z.79–83.
- **`kiez/[slug]/+page.server.ts`**: eigenes `SCORE_DIMS` Z.101–106, gemappt Z.277–289. **`bezirk/[slug]/+page.server.ts`**: `SCORE_DIMS` Z.16–21, gemappt Z.176.
- **Rang/Vergleich-Queries** (`get-kiez-rank.ts`, `get-kiez-comparison.ts`, Bezirk-Pendants): metricKey-generisch (Map-Lookup), `SCORE_DIMS.key` = metricKey → kein Query-Edit, aber die DB-Tabellen brauchen Kultur-metricKey-Zeilen (aus 13.3).
- **ADR-Verzeichnis** `docs/adr/`: ADR-015 ist Score-Composition-Anker, ADR-016 EU-FOSS-LLM. Nächste freie Nummer für Kultur.

### Abgrenzung zu 13.4

13.4 = UI-Komponenten + Map + OG + LLM (src/lib). 13.5 = Routes/Server-Loader + Methodik-Content + Doku/ADR. Beide nach 13.3, parallel möglich (kein gemeinsamer File).

### Was nicht brechen darf

- Anti-Stigma-Framing der Ranking-Page (Quartil statt letztem Rang) bleibt — Kultur folgt demselben Muster.
- Konsistenz: sechs Dimensionen insgesamt, fünf im Gesamt-Score, Kultur eigenständig. Kein Text behauptet Kultur sei im Composite (Option C, Story 13.1).

## References

- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` (dimensions Z.26–63, Tabelle Z.205–209, Prosa Z.11/143/167/193/248/266)
- `src/routes/(with-header)/umwelt-infrastruktur-score/+page.server.ts` (RankingRow Z.52–56, Z.79–83)
- `src/routes/(with-header)/kiez/[slug]/+page.server.ts` (SCORE_DIMS Z.101–106)
- `src/routes/(with-header)/bezirk/[slug]/+page.server.ts` (SCORE_DIMS Z.16–21)
- `docs/scoring-methodology.md`, `docs/INDEX.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`, `docs/adr/ADR-000-template.md`
- `docs/adr/ADR-012-tdd-mandate.md`
- `_bmad-output/implementation-artifacts/9-5-content-migration.md` (Muster)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.5 erstellt (ready-for-dev). Methodik (5→6), Server-Loader (RankingRow/SCORE_DIMS), neue ADR Kultur-Dimension.
