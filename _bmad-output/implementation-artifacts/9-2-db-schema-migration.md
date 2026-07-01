# Story 9.2: DB-Schema-Migration (kiez_score + bezirk_score)

Status: review

> **Anker:** ADR-015. **Voraussetzung:** Story 9.1 (Typ-Union steht). **Block für:** 9.3 (Re-Run schreibt in die migrierten Spalten).

## Story

As a Solo-Maintainer,
I want das Postgres-Schema auf die neuen Dimensions-Spalten migrieren,
so that der Build-Time-Cache die neue Komposition persistiert.

## Kontext

Die Tabellen `kiez_score` und `bezirk_score` speichern pro Dimension eine Spalte. Mit ADR-015 entfällt `soziale_lage`, `gruen` wird zu `gruen_hitze`, `wohnschutz` kommt neu dazu. `composite` bleibt. Drizzle-Migration plus Anpassung der Schema-Definitionen und der Query-Modelle.

## Acceptance Criteria

1. **AC-1 (Schema-Definitionen):**
   **Given** die Foundation aus 9.1
   **When** ich `src/lib/server/db/schema/kiez-score.ts` und `bezirk-score.ts` anpasse
   **Then** in beiden Tabellen:
   - `sozialeLage: doublePrecision('soziale_lage')` entfernt
   - `gruen: doublePrecision('gruen')` → `gruenHitze: doublePrecision('gruen_hitze')`
   - `wohnschutz: doublePrecision('wohnschutz')` neu (nullable, ohne `.notNull()`)
   - `composite` bleibt `doublePrecision('composite').notNull()`
   - übrige Spalten (`slug`, `bezirkSlug` (nur kiez_score), `ruheLuft`, `mobilitaet`, `versorgung`, `computedAt`) unverändert

2. **AC-2 (Drizzle-Migration):**
   **Given** die geänderten Schema-Files
   **When** ich `pnpm db:generate` laufen lasse
   **Then** entsteht eine neue Migration `drizzle/migrations/0003_*.sql` mit:
   - `ALTER TABLE kiez_score DROP COLUMN soziale_lage` + `bezirk_score DROP COLUMN soziale_lage`
   - `ALTER TABLE … RENAME COLUMN gruen TO gruen_hitze` (beide Tabellen)
   - `ALTER TABLE … ADD COLUMN wohnschutz double precision` (beide Tabellen, nullable)
   **And** kein Daten-Verlust an `composite`/übrigen Spalten (DROP betrifft nur soziale_lage)
   **And** Migration ist additiv/destruktiv nur wo nötig, keine Tabellen-Neuanlage

3. **AC-3 (Migration läuft):**
   **Given** die Migration
   **When** `pnpm db:migrate` läuft (gegen lokale/Dev-DB)
   **Then** Schema ist konsistent, Migration idempotent (zweiter Lauf no-op via Drizzle-Journal)
   **And** `getKiezScore`/`getBezirkScore` (InferSelectModel) kompilieren gegen die neuen Spalten

4. **AC-4 (Query-Modelle):**
   **Given** `InferSelectModel<typeof kiezScore>` / `<typeof bezirkScore>`
   **When** TypeScript prüft
   **Then** die abgeleiteten Typen `KiezScore`/`BezirkScore` tragen `gruenHitze` + `wohnschutz`, nicht mehr `sozialeLage`/`gruen`
   **And** `getKiezScore`/`getBezirkScore` (select-all) brauchen keine manuelle Spalten-Liste-Änderung (Drizzle leitet ab)

5. **AC-5 (Scope-Gate):**
   **Given** 9.2 ist abgeschlossen
   **Then**:
   - **Gate:** `pnpm check` auf DB-Layer (schema/* + queries/get-kiez-score.ts + get-bezirk-score.ts) grün
   - **Erwartet noch ROT:** `aggregate-scores.ts` (schreibt noch `sozialeLage`/`gruen` → 9.3), Konsumenten (`score-card-data.ts`, `aggregate-renderer.ts`, `ranking-types.ts` → 9.4). Diese referenzieren die InferSelectModel-Typen und brechen jetzt sichtbar. Beabsichtigt.
   - Completion-Note listet offene Errors + Mapping auf 9.3/9.4

## Tasks / Subtasks

- [x] **Task 1: Schema-Files anpassen** (AC: #1)
  - [x] 1.1 `src/lib/server/db/schema/kiez-score.ts`: soziale_lage raus, gruen→gruen_hitze, wohnschutz rein
  - [x] 1.2 `src/lib/server/db/schema/bezirk-score.ts`: identische Änderung
  - [x] 1.3 Spalten-Reihenfolge ruhe_luft, gruen_hitze, mobilitaet, versorgung, wohnschutz

- [x] **Task 2: Migration generieren** (AC: #2)
  - [x] 2.1 `pnpm db:generate` via expect-PTY (drizzle-kit braucht TTY für Conflict-Resolver)
  - [x] 2.2 `0003_icy_talon.sql`: ADD gruen_hitze + wohnschutz, DROP gruen + soziale_lage (beide Tabellen)
  - [x] 2.3 DROP+ADD statt RENAME (create-column-Default gewählt) — laut Dev Notes OK, da 9.3 TRUNCATE+Re-Insert. composite/übrige Spalten unberührt.

- [x] **Task 3: Migration anwenden + verifizieren** (AC: #3, #4)
  - [x] 3.1 `pnpm db:migrate` gegen lokale Dev-DB (navigator_dev) erfolgreich
  - [x] 3.2 information_schema verifiziert: kiez_score = composite/ruhe_luft/gruen_hitze/wohnschutz, kein gruen/soziale_lage
  - [x] 3.3 `InferSelectModel` leitet gruenHitze + wohnschutz automatisch ab (select-all-Queries, kein manueller Change)

- [x] **Task 4: Scope-Gate dokumentieren** (AC: #5)
  - [x] 4.1 DB-Layer (schema/* + get-kiez-score + get-bezirk-score) `check` grün
  - [x] 4.2 Completion-Note: offene Konsumenten-Errors → 9.3/9.4

## Dev Notes

### Aktueller Stand

`src/lib/server/db/schema/kiez-score.ts`:
```ts
export const kiezScore = pgTable('kiez_score', {
  slug: text('slug').primaryKey(),
  bezirkSlug: text('bezirk_slug').notNull().references(() => bezirkStats.slug, { onDelete: 'restrict' }),
  composite: doublePrecision('composite').notNull(),
  ruheLuft: doublePrecision('ruhe_luft'),
  gruen: doublePrecision('gruen'),
  mobilitaet: doublePrecision('mobilitaet'),
  sozialeLage: doublePrecision('soziale_lage'),
  versorgung: doublePrecision('versorgung'),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
});
```
`bezirk-score.ts` identisch ohne `bezirkSlug`.

### Ziel

```ts
export const kiezScore = pgTable('kiez_score', {
  slug: text('slug').primaryKey(),
  bezirkSlug: text('bezirk_slug').notNull().references(() => bezirkStats.slug, { onDelete: 'restrict' }),
  composite: doublePrecision('composite').notNull(),
  ruheLuft: doublePrecision('ruhe_luft'),
  gruenHitze: doublePrecision('gruen_hitze'),
  mobilitaet: doublePrecision('mobilitaet'),
  versorgung: doublePrecision('versorgung'),
  wohnschutz: doublePrecision('wohnschutz'),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
});
```

### Migrations-Setup (verifiziert)

- `drizzle.config.ts`: schema = `./src/lib/server/db/schema/index.ts`, out = `./drizzle/migrations`, dialect postgresql, `DATABASE_URL`
- Bestehende Migrations: `0000_ambitious_brother_voodoo.sql` (Score-Tabellen-Anlage), `0001_*`, `0002_warm_randall.sql` (Wahl). Nächste = `0003_*`.
- `db:generate` = `drizzle-kit generate`; `db:migrate` = `tsx scripts/db/migrate.ts` (Folder `./drizzle/migrations`)
- Connection: `drizzle-orm/postgres-js` + `postgres(DATABASE_URL,{max:10})`, Lazy-Singleton in `src/lib/server/db/index.ts`
- drizzle-kit `^0.31.10`, drizzle-orm `^0.45.2`

### Query-Funktionen (kein manueller Spalten-Change nötig)

`get-kiez-score.ts` und `get-bezirk-score.ts` machen `select().from(table).where(eq(table.slug, slug))` (select-all) und typisieren via `InferSelectModel`. Drizzle leitet Spalten + Typ automatisch ab → keine Spalten-Liste anzufassen.

### Daten-Hinweis

Bestehende Score-Daten werden in 9.3 ohnehin via `TRUNCATE … RESTART IDENTITY CASCADE` + Re-Insert ersetzt. Der DROP soziale_lage / RENAME gruen verliert also keine produktiv benötigten Daten. Trotzdem sauberes `RENAME COLUMN` statt DROP+ADD bevorzugen (klares Migrations-Diff).

### Architektur-Compliance

- #7 TS strict; InferSelectModel ist die Quelle der Wahrheit für Konsumenten-Typen
- ISO 9001: Migration nachvollziehbar, idempotent, im Drizzle-Journal versioniert

### Previous Story Intelligence

- **Story 2.9a:** hat `kiez_score`/`bezirk_score` befüllt via `aggregate-scores.ts` (TRUNCATE+Insert-Pattern)
- **Migration 0000:** Original-Schema-Anlage als Referenz für Spalten-Typen
- **Story 6.x (0002):** Beispiel für saubere additive Migration

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: src/lib/server/db/schema/kiez-score.ts]
- [Source: src/lib/server/db/schema/bezirk-score.ts]
- [Source: src/lib/server/db/queries/get-kiez-score.ts]
- [Source: src/lib/server/db/queries/get-bezirk-score.ts]
- [Source: drizzle.config.ts]
- [Source: scripts/db/migrate.ts]
- [Source: drizzle/migrations/0000_ambitious_brother_voodoo.sql]
- [Source: _bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- `pnpm db:generate` via `/usr/bin/expect` (drizzle-kit 0.31 Conflict-Resolver braucht TTY; non-interaktiv = "Interactive prompts require a TTY"). expect bestätigt create-column-Default → 0003_icy_talon.sql.
- `pnpm db:migrate` gegen navigator_dev: erfolgreich.
- Scope-Gate: `/tmp/check-92.log` — 37 Errors, DB-Layer clean.

### Completion Notes List

- Schema kiez_score + bezirk_score migriert: soziale_lage entfernt, gruen → gruen_hitze, wohnschutz neu (nullable). composite + ruhe_luft + mobilitaet + versorgung + computed_at unverändert.
- Migration `drizzle/migrations/0003_icy_talon.sql` (8 ALTER-Statements) + Snapshot 0003 + Journal-Entry von drizzle-kit auto-geschrieben. Idempotent via Journal.
- DROP+ADD statt RENAME (drizzle-create-column-Default): kein produktiver Daten-Verlust, da 9.3 die Tabellen via TRUNCATE+Re-Insert neu befüllt.
- `KiezScore`/`BezirkScore` (InferSelectModel) tragen jetzt `gruenHitze` + `wohnschutz`, nicht mehr `sozialeLage`/`gruen`. Queries select-all → kein manueller Spalten-Change.
- **Scope-Gate (AC-5):** DB-Layer (`schema/*`, `get-kiez-score.ts`, `get-bezirk-score.ts`) grün. Repo-weiter `pnpm check` ROT (37 Errors, +12 ggü. 9.1 — durch die neuen InferSelectModel-Typen werden mehr Konsumenten sichtbar).
  - **→ 9.3 (Pipeline):** `scripts/aggregate-scores.ts` (schreibt noch sozialeLage/gruen)
  - **→ 9.4 (Konsumenten):** `score-card-data.ts`, `kiez-score-display.ts`, `kiez-score-ring.svelte`, `kiez-score-hero.svelte`, `kiez-score-compare-block.svelte`, `kiez-renderer.ts`, `bezirk-renderer.ts`, `kiez-hero.svelte`, `wo-lebt-es-sich-gut/+page.server.ts`, `llm-export-builder` (+ zugehörige `.test.ts`)
  - **NICHT 9.x (pre-existing):** 2 `"de"/"en"`-Errors in `mount.ts` + `+layout.svelte` (i18n Phase-1).

### File List

**Geändert:**
- `src/lib/server/db/schema/kiez-score.ts`
- `src/lib/server/db/schema/bezirk-score.ts`

**Neu (drizzle auto-generiert):**
- `drizzle/migrations/0003_icy_talon.sql`
- `drizzle/migrations/meta/0003_snapshot.json`
- `drizzle/migrations/meta/_journal.json` (Entry idx 3)

## Change Log

- 2026-05-21: Story 9.2 DB-Schema-Migration. kiez_score + bezirk_score auf ADR-015-Dimensionen (gruen→gruen_hitze, soziale_lage raus, wohnschutz neu). Migration 0003 generiert + gegen Dev-DB angewandt. DB-Layer grün, Konsumenten ROT wie erwartet (→ 9.3/9.4).
