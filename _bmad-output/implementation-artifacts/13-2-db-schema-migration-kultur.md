# Story 13.2: DB-Schema-Migration (kiez_score + bezirk_score)

Status: review

> **Anker:** ADR-012 (Migration ist Infra, kein Test-First — aber Schema-Konsistenz verifizieren). Strukturell analog Story 9.2.
> **Hard-Block:** Story 13.1 `done` (Typ-Union enthält `kultur`). Vor 13.3 (Recompute schreibt die Spalte).

## Story

As a Solo-Maintainer,
I want das Postgres-Schema um die Kultur-Spalte erweitern,
so that der Build-Time-Cache die neue Dimension persistiert.

## Kontext: Warum dieser Change

Die 6. Dimension braucht eine Spalte in beiden Score-Tabellen. Drizzle-Schema-Edit + generierte Migration. Ohne diese Story kann 13.3 die Kultur-Werte nicht persistieren.

## Acceptance Criteria

1. **AC-1 (Schema-Spalten):**
   **Given** die Foundation aus 13.1
   **When** ich die Drizzle-Schemas erweitere
   **Then** `kiez_score` (`src/lib/server/db/schema/kiez-score.ts`) + `bezirk_score` (`bezirk-score.ts`) haben `kultur` (`doublePrecision`, nullable), `composite` + Bestandsspalten unverändert

2. **AC-2 (Migration generiert):**
   **Given** die Schema-Änderung
   **When** die Drizzle-Migration generiert wird
   **Then** entsteht eine neue Migrations-Datei in `drizzle/migrations/` die `ADD COLUMN kultur` auf beide Tabellen setzt (additive Migration, kein Daten-Verlust)

3. **AC-3 (Migration läuft):**
   **Given** die Migration
   **When** `pnpm db:migrate` läuft
   **Then** Schema konsistent, `getKiezScore`/`getBezirkScore`-Queries kompilieren gegen die neue Spalte (sie sind `select()`-basiert via `InferSelectModel` → Typ propagiert automatisch)

## Tasks / Subtasks

- [x] **Task 1: Schema-Edit** (AC: #1)
  - [x] 1.1 `src/lib/server/db/schema/kiez-score.ts` (Z.10–22): nach `wohnschutz` (Z.20) `kultur: doublePrecision('kultur')` ergänzen
  - [x] 1.2 `src/lib/server/db/schema/bezirk-score.ts` (Z.14–23): analog `kultur` ergänzen

- [x] **Task 2: Migration generieren** (AC: #2)
  - [x] 2.1 Drizzle-Migration-Generierung (`pnpm drizzle-kit generate` o.ä. — exaktes Script in `package.json`/`scripts/db/` prüfen)
  - [x] 2.2 Generierte SQL begutachten: `ALTER TABLE kiez_score ADD COLUMN kultur double precision;` + analog `bezirk_score`. Keine Drops, keine NOT-NULL ohne Default

- [x] **Task 3: Migrate + Verify** (AC: #3)
  - [x] 3.1 `pnpm db:migrate`
  - [x] 3.2 `pnpm check`: `get-kiez-score.ts` / `get-bezirk-score.ts` kompilieren (schema-driven, kein Edit nötig)

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`kiez-score.ts`** Z.10–22: `slug PK, bezirk_slug (FK→bezirk_stats.slug, notNull), composite (notNull), ruhe_luft, gruen_hitze, mobilitaet, versorgung, wohnschutz (nullable doublePrecision), computed_at`.
- **`bezirk-score.ts`** Z.14–23: gleich minus `bezirk_slug`.
- **Ursprungs-Migration** `drizzle/migrations/0000_ambitious_brother_voodoo.sql` (bezirk_score Z.30, kiez_score Z.41, FK Z.74). Rank/Comparison-Tabellen in `0004`/`0005`.
- **DB-Queries** `src/lib/server/db/queries/get-kiez-score.ts` + `get-bezirk-score.ts`: `select()` + `InferSelectModel<typeof kiezScore>` → keine expliziten Spalten, Typ folgt dem Schema automatisch. **Kein Edit nötig.**

### Was nicht brechen darf

- Additive Migration: nur `ADD COLUMN`, nullable, kein Default-Zwang. Bestehende Daten bleiben.
- FK `bezirk_slug` + `composite NOT NULL` unverändert.
- Migrations-Reihenfolge: neue Datei nach `0005`.

### Architektur-Compliance

- **MUST #7:** `doublePrecision` nullable — typsicher, konsistent mit den anderen Dimensions-Spalten.

## References

- `src/lib/server/db/schema/kiez-score.ts` (Z.10–22)
- `src/lib/server/db/schema/bezirk-score.ts` (Z.14–23)
- `drizzle/migrations/0000_ambitious_brother_voodoo.sql` (Ausgangs-Schema)
- `src/lib/server/db/queries/get-kiez-score.ts`, `get-bezirk-score.ts` (schema-driven)
- `docs/adr/ADR-012-tdd-mandate.md`
- `_bmad-output/implementation-artifacts/9-2-db-schema-migration.md` (Migrations-Muster)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.2 erstellt (ready-for-dev). Additive Drizzle-Migration: kultur-Spalte in kiez_score + bezirk_score.
