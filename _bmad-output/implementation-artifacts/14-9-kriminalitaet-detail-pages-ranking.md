# Story 14.9: Kriminalität auf Bezirk-/Kiez-Pages + Umwelt-Infrastruktur-Score-Page

Status: review

> **Anker:** ADR-019 (Stigma), 14.4 (Inspector-Surfacing), 14.5 (kein Sicherheits-Ranking).
> **Owner-Decision 2026-06-10:** Kriminalität als Vergleichs-/Kontext-Zeile auf die prerendered Detail-Pages (Bezirk, Kiez) UND in die Ranking-Tabelle (`/umwelt-infrastruktur-score`) aufnehmen, konsistent zu Kultur. **NICHT in die Prosa** (14.8 bleibt). Mit Stigma-Paket: Strukturell-Indigo/neutral, **kein Rang/kein sortierbares Leaderboard**, BR-Granularität gekennzeichnet.

## Acceptance Criteria

1. **AC-1 (Detail-Pages):** Kiez- + Bezirks-Page zeigen Kriminalität als Vergleichszeile (Wert + Bezirk-Ø/Berlin-Median), **ohne Rang** (nicht in `METRICS`), mit Hinweis „höher = mehr erfasste Fälle, BR-Granularität". Prosa unverändert crime-frei.
2. **AC-2 (Ranking-Page):** `/umwelt-infrastruktur-score` zeigt eine **nicht-sortierbare** Kriminalitäts-Spalte (neutrale Pill, kein Gut-Grün), Disclaimer. Kein Sicherheits-Leaderboard.
3. **AC-3 (Vergleichsdaten):** `aggregate-comparison` liefert Bezirk-Ø + Berlin-Median für Kriminalität (neutrale Aggregate, kein Rang).
4. **AC-4 (Stigma/A11y):** keine Gut-Färbung, keine „sicher/gefährlich"-Wertung, Wert + Label als Text, check + Tests grün.

## Tasks / Subtasks

- [x] T1 `aggregate-comparison.ts`: METRIC_KEYS + ScoreRow + select um `kriminalitaet`; `data:comparison` neu (1144 kiez + 96 bezirk)
- [x] T2 kiez + bezirk `+page.server.ts`: `SCORE_DIMS` + `{ kriminalitaet, 'Erfasste Kriminalität' }`
- [x] T3 `score-comparison-table.svelte`: Krimi-Zeile mit `*`-Marker + Magnitude/BR-Fußnote, Rang via `formatRank(null)` = „–"
- [x] T4 `ranking-types.ts` + `umwelt-infrastruktur-score/+page.server.ts`: RankingRow.kriminalitaet + select + map (beide Loader)
- [x] T5 `score-ranking-table.svelte`: nicht-sortierbare Indigo-Spalte (statisches `<th>`, neutrale Pill `pillClass(v,true)`) + Disclaimer-Note
- [x] T6 Tests (ranking-table + comparison-table) + Recompute + check 0 / 2843 grün

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- **Detail-Pages (kiez + bezirk):** `kriminalitaet` zu `SCORE_DIMS` → fließt durch die bestehende `ScoreComparisonTable`. Rang ist `null` (kriminalitaet nicht in `aggregate-ranks` METRICS) → `formatRank` zeigt „–", kein Rang. Bezirk-Ø/Berlin-Median kommen aus `aggregate-comparison` (T1). Krimi-Zeile bekommt `*`-Marker + Fußnote: „Häufigkeitszahl je Bezirksregion (gröber als Adresse), höher = mehr erfasste Fälle, kein Gut-Wert, kein Rang, kein Sicherheits-Urteil" + Methodik-Link.
- **Ranking-Page (`/umwelt-infrastruktur-score`):** `kriminalitaet` zu `RankingRow` + beide Loader. In `score-ranking-table` eine **nicht-sortierbare** Spalte (statisches `<th>` ohne Sort-Button, NICHT in `NUMERIC_SORT_KEYS`) mit **neutraler Pill** (`pillClass(v, true)`, kein Gut-Grün) + Disclaimer-Note. Kein Sicherheits-Leaderboard (14.5-konform).
- **Comparison-Pipeline:** `aggregate-comparison` METRIC_KEYS + ScoreRow + Selects um kriminalitaet; `data:comparison` neu → 1144 kiez (+143) / 96 bezirk (+12) Rows.
- **Prosa unverändert:** 14.8 bleibt, Kriminalität nicht in den Profilen.
- **Stigma/A11y:** neutrale Severity (kein Gut-Color), Wert + Label als Text, keine „sicher/gefährlich"-Wertung.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2843 grün** (+ 1 share-sheet flaky unter Last, isoliert grün, unrelated). Neue Tests: ranking-table nicht-sortierbar + Disclaimer, comparison-table Krimi-Zeile ohne Rang + Fußnote.

### File List

**Geändert:**
- `scripts/aggregate-comparison.ts` (METRIC_KEYS + kriminalitaet)
- `src/routes/(with-header)/kiez/[slug]/+page.server.ts`, `.../bezirk/[slug]/+page.server.ts` (SCORE_DIMS)
- `src/lib/data/ranking-types.ts` (RankingRow.kriminalitaet)
- `src/routes/(with-header)/umwelt-infrastruktur-score/+page.server.ts` (Loader-Maps)
- `src/lib/components/atlas/score-comparison-table.svelte` (+ `.test.ts`)
- `src/lib/components/atlas/score-ranking-table.svelte` (+ `.test.ts`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-9 → review, epic-14 → done)

### Debug Log References

- `data:comparison` neu: 1144 kiez + 96 bezirk Rows (vorher 1001/84).
- formatRank(null) → „–" → kein Rang für Kriminalität, by design.

## Change Log

- 2026-06-10: Story 14.9 erstellt (in-progress). Owner-Decision: Kriminalität auf Detail-Pages + Ranking, nicht in Prosa.
- 2026-06-10: Story 14.9 implementiert (→ review). Vergleichszeile auf kiez/bezirk + nicht-sortierbare Indigo-Spalte auf /umwelt-infrastruktur-score + comparison-Pipeline. check 0, 2843 grün.
