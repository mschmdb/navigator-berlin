# Story 11.0: Ranking- & Quartil-Foundation (Build-Step)

Status: review

> **Anker:** Hard-Block für 11.3 (Daten-FAQ), 11.4 (Vergleichswerte) und 11.6 (KI-Profile). Diese Story liefert pro Kiez/Bezirk den Rang + das Quartil je Score-Dimension und Schlüssel-Metrik, auf das alle drei aufsetzen.
>
> **Abhängigkeiten:** Keine offenen Vorgänger. Setzt auf befüllten `kiez_score`/`bezirk_score` (Epic 9, ADR-015) und `kiez_stats`/`bezirk_stats` (Story 2.0). Erste Story in Epic 11 → Epic-Status auf in-progress.

## Story

As a Solo-Maintainer,
I want pro Score-Dimension und Schlüssel-Metrik einen deterministischen Rang und ein Quartil über alle 143 Kieze (und 12 Bezirke),
so that Detailseiten und FAQ vergleichende Aussagen ohne Laufzeit-Berechnung ziehen können.

## Acceptance Criteria

1. **AC-1 (Ranking-Berechnung):**
   **Given** `kiez_score` (143 Zeilen) mit Composite + 5 Dimensionen (ruheLuft, gruenHitze, mobilitaet, versorgung, wohnschutz)
   **When** eine reine Funktion pro Dimension den Rang 1..143 (1 = bester Wert) und das Quartil (Q1..Q4) ableitet
   **Then** entsteht pro Kiez ein `KiezRankRecord` mit Rang + Quartil je Dimension + Composite; analog `BezirkRankRecord` über 12 Bezirke (Rang 1..12)

2. **AC-2 (Schlüssel-Metriken aus stats):**
   **Given** ausgewählte `kiez_stats`-Metriken mit numerischem Wert (z.B. `gruen.gruenanlagenCount`, `oepnv.stopsPerKm2`, `bildung.kitasPerKm2`, `klima.meanPet`)
   **When** dieselbe Ranking-Logik darauf läuft
   **Then** entsteht je Metrik Rang + Quartil; die Richtung (höher = besser vs. niedriger = besser, z.B. PET invertiert) ist pro Metrik konfiguriert

3. **AC-3 (TDD, Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** Tests laufen
   **Then**: Tie-Handling (gleiche Werte → gleicher Rang, dense ranking), Quartil-Grenzen aus `docs/scoring-methodology.md`, Missing-Data (`null`-Dimension fällt aus dem Ranking, kein Crash, Rang `null`), invertierte Richtung sind getestet; Red-First nachvollziehbar

4. **AC-4 (Persistenz):**
   **Given** der Ranking-Lauf
   **When** er abgeschlossen ist
   **Then** schreibt er die Rang/Quartil-Daten so, dass Prerender + FAQ-Render sie lesen können (Erweiterung von `kiez_score`/`bezirk_score` um Rang/Quartil-Spalten ODER separate `kiez_rank`-Tabelle; Entscheidung im Dev-Notes-Schnitt). TRUNCATE+Insert-Idempotenz wie `aggregate-data.ts`

5. **AC-5 (Anti-Stigma-neutrale Speicherung, ADR-015):**
   **Given** die gespeicherten Ränge
   **When** das Schema definiert wird
   **Then** trägt es Rang + Quartil ohne wertende Labels; das Framing (über/unter Schnitt, Quartil-statt-letzter-Rang) entsteht erst im Render (11.3/11.4)

## Tasks / Subtasks

- [x] **Task 1: Ranking-Lib** (AC: #1, #2, #3)
  - [x] 1.1 (RED) `scripts/lib/ranking/ranking.test.ts`: dense-rank, Ties, invertierte Richtung, Missing-Data, Quartil-Grenzen
  - [x] 1.2 (GREEN) `scripts/lib/ranking/ranking.ts`: pure `rankBy(values, direction)` + `quartileOf(rank, total)` + Metrik-Konfig (Richtung pro Dimension/Metrik)
  - [x] 1.3 Verify Red-First (Failing-Test bestätigt: „Cannot find module ./ranking.js", dann GREEN)
- [x] **Task 2: Schema-Entscheidung + Migration** (AC: #4)
  - [x] 2.1 Option B umgesetzt: neue Tabellen `kiez_rank`/`bezirk_rank` (slug, metric_key, rang, quartil, total). Migration `0004_uneven_guardsmen.sql` via `pnpm db:generate`
  - [x] 2.2 Migration gegen `navigator_dev` angewandt + verifiziert (`to_regclass` beide vorhanden)
- [x] **Task 3: Aggregat-Step** (AC: #4)
  - [x] 3.1 Neuer Step `scripts/aggregate-ranks.ts` + `pnpm data:rank`; liest score+stats, rankt 14 Metriken, TRUNCATE+Insert
  - [x] 3.2 Lokal re-run: 143 Kiez (2002 Einträge) + 12 Bezirk (168) verifiziert
- [x] **Task 4: Query-Helper** (AC: #4)
  - [x] 4.1 `getKiezRank(slug)` / `getBezirkRank(slug)` (Map metricKey→row) analog `get-kiez-score.ts`

## Dev Notes

### Ist-Zustand

- `src/lib/server/db/schema/kiez-score.ts`: `composite` + `ruheLuft/gruenHitze/mobilitaet/versorgung/wohnschutz` (doublePrecision, nullable Dimensionen). `bezirk-score.ts` analog.
- `kiez_stats`/`bezirk_stats` (`schema/kiez-stats.ts`): 8 JSONB-Cluster, jeder Wert ein `AggregateValue<T>` (`aggregate-types.ts:16`). Numerische Metriken für Ranking: `gruenanlagenCount`, `spielplaetzeCount`, `stopsPerKm2`, `uBahnCount/sBahnCount/tramCount/busCount`, `kitasPerKm2`, `schulenPerKm2`, `meanPet`, `denkmalPerKm2`, `stolpersteinePerKm2`.
- `docs/scoring-methodology.md` definiert die Quartil-Klassifikation (Abschnitt „Quartil-Klassifikation") + flächen-gewichtete Aggregation 542 PLR → 143 BZR.
- `scripts/aggregate-scores.ts` ist der bestehende Score-Aggregat-Lauf (`ScoreRow`/upsert), Vorbild für Einhängen.

### Schema-Entscheidung (Dev trifft sie)

Zwei Optionen, in dieser Story entscheiden + im Completion-Note dokumentieren:
- **A (Spalten):** Rang/Quartil-Spalten je Dimension in `kiez_score`/`bezirk_score`. Weniger Joins, aber breite Tabelle.
- **B (Tabelle):** Neue `kiez_rank`/`bezirk_rank` mit (slug, metricKey, rang, quartil). Flexibler für stats-Metriken (AC-2), entkoppelt von Score-Schema. **Empfehlung B**, weil AC-2 beliebig viele Metriken rankt.

### Architektur-Compliance

- TS strict, kein `any`. Files <500 Zeilen (Lib pure Funktionen, getrennt von Runner).
- Invertierte Richtung explizit pro Metrik (PET, Lärm = niedriger besser). Keine Magic-Inversion.
- Idempotenz: TRUNCATE+Insert (Memory `project_aggregate_truncate_insert`).

### Was nicht brechen darf

- `pnpm test` grün nach Task 1. `pnpm check` ohne neue Errors.
- Bestehende `get-kiez-score`/`get-bezirk-score`-Konsumenten unverändert (additive Spalten/Tabelle).
- Score-Composite-Berechnung (Epic 9) nicht anfassen, nur lesen.

### Previous Story Intelligence

- **Story 9.2/9.3:** Drizzle-Migration braucht TTY (`expect`-PTY-Workaround), Score-Pipeline-Re-Run-Muster. Übernehmen.
- **Story 10.0:** Modul-Schnitt `scripts/lib/<topic>/` mit pure Funktionen + TDD-First als Vorbild.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.0]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Abschnitt 4 (vorhanden, aber nicht gezeigt) + Stufe 1]
- [Source: docs/scoring-methodology.md#Quartil-Klassifikation]
- [Source: src/lib/server/db/schema/kiez-score.ts]
- [Source: src/lib/server/db/schema/aggregate-types.ts:16-74]
- [Source: scripts/aggregate-scores.ts] (Einhäng-Vorbild)
- [Source: _bmad-output/implementation-artifacts/10-0-einwohner-lor-join-foundation.md] (Format + Modul-Schnitt)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- RED bestätigt: `ranking.test.ts` failt mit „Cannot find module './ranking.js'" (Rest-Suite 2717 grün).
- Quartil-Formel-Fix: `ceil(rang/total*4)` machte bei kleinem N den besten Rang nicht zu Q1 → umgestellt auf `floor((rang-1)/total*4)+1` (bester → immer Q1, schlechtester → Q4 für total>=4). Test-Erwartung bei total=3 angepasst.
- Test-Runner: Browser-Projekt brauchte Playwright-Chromium (neues Laptop) → `pnpm exec playwright install chromium`. Node-Tests via `--project server`.
- DB-Ownership-Fix (neues Laptop, Runbook „DB OWNER app"): Schema `public` + DB `navigator_dev` + Schema `drizzle` + Objekte von `matze` auf `app` übertragen, sonst `42501` bei Migration (`CREATE SCHEMA drizzle`).

### Completion Notes List

- Ranking rang-basiert; Quartil 1..4 rang-basiert (NICHT wert-basiert wie die Choropleth-0-100-Stufen in scoring-methodology). Bewusst getrennt, Anti-Stigma-tauglich.
- Schema-Entscheidung: Option B (generische `*_rank`-Tabellen mit `metric_key`), weil AC-2 beliebig viele stats-Metriken rankt. 14 Metriken: composite + 5 Dims + 8 numerische stats (PET `lower-better`, Rest `higher-better`).
- `kiez_rank`: 2002 Einträge (143×14), `bezirk_rank`: 168 (12×14). Idempotent (TRUNCATE+Insert).
- `pnpm check` 0 Errors/0 Warnings über 6270 Files. Server-Suite 2730 Tests grün (inkl. 4 neue aggregate-ranks + 9 ranking-lib).
- Lärm/Luft sind kategorial (dominantCategory string) → bewusst nicht numerisch gerankt (AC-2 = numerische Metriken).

### File List

**Neu:** scripts/lib/ranking/{ranking,ranking.test}.ts, scripts/aggregate-ranks.ts, scripts/aggregate-ranks.test.ts, src/lib/server/db/schema/{kiez-rank,bezirk-rank}.ts, src/lib/server/db/queries/{get-kiez-rank,get-bezirk-rank}.ts, drizzle/migrations/0004_uneven_guardsmen.sql (+ meta snapshot)
**Geändert:** src/lib/server/db/schema/index.ts, package.json (data:rank)
**DB (lokal, kein Repo):** ALTER OWNER public/drizzle-Schema + navigator_dev → app

## Change Log

- 2026-06-06: Story 11.0 implementiert. Ranking-/Quartil-Foundation (Lib + `kiez_rank`/`bezirk_rank` + `data:rank`-Step + Query-Helper). Status → review.
