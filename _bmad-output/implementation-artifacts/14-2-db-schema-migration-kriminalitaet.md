# Story 14.2: DB-Schema-Migration (kiez_score + bezirk_score)

Status: review

> **Anker:** ADR-019. Strukturell analog Story 13.2 (Kultur-Spalte).
> **Hard-Block:** Story 14.1 `done` (Foundation). Vor 14.3 (Recompute).

## Story

As a Solo-Maintainer,
I want das Postgres-Schema um die Kriminalitäts-Spalte erweitern,
so that der Build-Time-Cache die neue Dimension persistiert.

## Kontext: Warum dieser Change

Wie bei Kultur (13.2): die Aggregat-Tabellen `kiez_score` + `bezirk_score` brauchen eine neue Spalte `kriminalitaet`. Drizzle-Migration, additiv, nullable, `composite` bleibt unverändert (Kriminalität zählt nicht rein, Option C).

## Acceptance Criteria

1. **AC-1 (Migration):**
   **Given** die Foundation aus 14.1
   **When** ich eine Drizzle-Migration schreibe
   **Then** erhalten `kiez_score` + `bezirk_score` die Spalte `kriminalitaet` (`doublePrecision`, nullable), `composite` + bestehende Spalten (inkl. `kultur` aus 13.2) unverändert

2. **AC-2 (Konsistenz):**
   **Given** die Migration
   **When** `pnpm db:migrate` läuft
   **Then** ist das Schema konsistent, `getKiezScore`/`getBezirkScore` kompilieren gegen die neue Spalte, kein Daten-Verlust an bestehenden Spalten

## Tasks / Subtasks

- [x] **Task 1: Schema + Migration** (AC: #1)
  - [x] 1.1 `src/lib/server/db/schema/`: `kriminalitaet` (doublePrecision, nullable) zu `kiez_score` + `bezirk_score`
  - [x] 1.2 Drizzle-Migration generiert (`pnpm db:generate` → `0007_cold_robbie_robertson.sql`), additiv (2× ADD COLUMN, kein DROP)
- [x] **Task 2: Migrate + Verify** (AC: #2)
  - [x] 2.1 `pnpm db:migrate` angewandt, Spalte via information_schema verifiziert (nullable=YES, composite/kultur unverändert)
  - [x] 2.2 `pnpm check` 0 Errors — Queries + Konsumenten kompilieren gegen die neue Spalte (3 Test-Fixtures um `kriminalitaet` ergänzt)

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- Schema unter `src/lib/server/db/schema/` (Verzeichnis), Queries unter `src/lib/server/db/queries`. Kultur-Spalte aus 13.2 ist bereits vorhanden → Kriminalität analog ergänzen.
- Migration ist reines Add-Column, nullable → kein Backfill nötig, Befüllung in 14.3.

### Was nicht brechen darf

- `composite`-Spalte unverändert (Option C). Bestehende Spalten inkl. `kultur` unberührt.

## References

- `src/lib/server/db/schema/`, `src/lib/server/db/queries`
- `_bmad-output/implementation-artifacts/13-2-db-schema-migration-kultur.md` (Muster)
- `docs/adr/ADR-019-kriminalitaet-score-dimension.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- `kriminalitaet: doublePrecision('kriminalitaet')` (nullable) zu `kiez_score` + `bezirk_score` ergänzt (analog `kultur` aus 13.2). `composite` bleibt `notNull` (Option C, unverändert).
- Migration `0007_cold_robbie_robertson.sql`: 2× `ALTER TABLE ... ADD COLUMN "kriminalitaet" double precision`. Rein additiv, kein DROP, kein Backfill (Befüllung in 14.3).
- `pnpm db:migrate` angewandt; Spalte in beiden Tabellen verifiziert (`is_nullable=YES`), `composite`/`kultur` unangetastet.
- 3 Test-Fixtures bauen Voll-Rows gegen `$inferSelect` → um `kriminalitaet` ergänzt (kiez-hero.svelte.test, kiez-renderer.test, bezirk-renderer.test). Renderer geben den Wert noch nicht aus (UI/Content folgt 14.4/14.5).
- **Verifikation:** `pnpm check` 0 Errors / 6290 Files, Unit-Suite 2829/2829 grün.

### File List

**Geändert:**
- `src/lib/server/db/schema/kiez-score.ts`, `src/lib/server/db/schema/bezirk-score.ts`
- `src/lib/components/atlas/kiez-hero.svelte.test.ts`, `src/lib/server/llms/kiez-renderer.test.ts`, `src/lib/server/llms/bezirk-renderer.test.ts` (Fixtures)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-2 → review)

**Neu:**
- `drizzle/migrations/0007_cold_robbie_robertson.sql` + `drizzle/migrations/meta/` (Journal/Snapshot)

### Debug Log References

- information_schema-Check: `kiez_score.kriminalitaet` + `bezirk_score.kriminalitaet` double precision nullable; `composite` weiterhin NOT NULL.

## Change Log

- 2026-06-09: Story 14.2 erstellt (ready-for-dev). Additiv `kriminalitaet`-Spalte, analog 13.2.
- 2026-06-10: Story 14.2 implementiert (→ review). Schema + Migration 0007 (additiv, nullable), migrate angewandt, 3 Fixtures nachgezogen. check 0 Errors, 2829 grün.
