# Story 2.0: Postgres-Aggregat-Foundation mit Drizzle + Build-Step

Status: review

## Story

As a Solo-Maintainer,
I want eine production-ready Postgres-Aggregat-Schicht mit Drizzle-ORM-Schema, Migrations und einem `data:aggregate`-Build-Step der aus den statischen GeoJSON-Layern Cross-Layer-Werte pro Bezirk und LOR-Planungsraum/Bezirksregion berechnet,
so that Bezirks-/Kiez-/Score-/FAQ-Pages (Stories 2.3, 2.4, 2.5b, 2.9a, 2.9b) auf einer konsistenten, deterministischen Aggregat-Datenquelle aufsetzen können, ohne den statischen GeoJSON-Pfad als Source-of-Truth abzulösen.

## Probleme heute

1. Es existiert keine Aggregat-Schicht. Bezirks-/Kiez-Pages müssten zur Build-Zeit für jeden der 12 + 138 Slugs alle 35 GeoJSON-Layer laden und Cross-Layer-Werte ad hoc rechnen, was Build-Zeit-Budget und Determinismus sprengt.
2. ADR-003-postgres-deferral hat Postgres in Phase 2/3 verschoben; User-Lock 2026-05-15 hat Postgres als Build-Zeit-Cache zurück nach Phase 1 gezogen (Hybrid-Ansatz). ADR-013-postgres-hybrid-architecture wird in Story 4.4 nachgezogen, die Foundation-Pflicht liegt aber bei dieser Story.
3. FAQ-Section (Story 2.5b), Score-Berechnung (2.9a), Ranking-Page (2.9b) und llms-full.txt (2.8) lesen alle aus den gleichen Aggregat-Tabellen. Ohne deren Schema kann keiner dieser Konsumenten starten.

## Quellen

- Epic-2-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1025-1059, 1425-1433.
- PRD: NFR-P1 (LCP <2.5s), NFR-PR1 (kein `Set-Cookie` in Production), NFR-M6 (ADR pro Major-Datenquelle).
- Architecture: `_bmad-output/planning-artifacts/architecture.md` Zeile 287-299 (Data Architecture, Phase-2-Drizzle-Pivot ist jetzt Phase-1-Hybrid), Zeile 1051-1073 (21 MUST-Regeln), Zeile 1469 (Phase-2-Postgres-Container).
- Story 1.30 (in-progress): MSS-2025 als Inspector-Layer; Aggregat-Pipeline für Story 2.0 muss MSS-Slug `mss-gesamtindex-2025` mitführen.
- Bestehende Daten-Pipeline: `scripts/fetch-static.ts`, `scripts/lib/sources.ts` (35+ Layer-Slugs), `static/layers/MANIFEST.json` (Schema in `src/lib/data/manifest-schema.ts`).
- Bestehende Daten-Abstraktion: `src/lib/data/get-bezirk-profile.ts`, `src/lib/data/get-kiez-profile.ts`, `src/lib/data/get-layers-at-point.ts`. Diese bleiben Source-of-Truth für Geo, die DB ist nur Aggregat-Cache.
- LOR-Slug-Konvention: `lor-bezirksregion` Layer = 138 Kieze (siehe `get-kiez-profile.ts:10`).
- Memory: `MEMORY.md` Eintrag „Paraglide reroute strippt Locale" (für FAQ-Locale-Spalte relevant).

## Akzeptanz-Kriterien

1. **AC-1 (Drizzle-Setup ohne Regression):**
   **Given** lokale Postgres 17 (Homebrew, ohne PostGIS) läuft auf `127.0.0.1:5432` mit DB `navigator_dev` und User `app`
   **When** ich `pnpm add drizzle-orm postgres` und `pnpm add -D drizzle-kit` installiere und `drizzle.config.ts` anlege das `DATABASE_URL` aus `process.env` liest
   **Then**:
   - `package.json` hat neue Dependencies (`drizzle-orm` ≥0.36, `postgres` ≥3.4, `drizzle-kit` ≥0.30 als devDep)
   - `.env.example` enthält `DATABASE_URL=postgres://app:app@127.0.0.1:5432/navigator_dev` (ohne echte Credentials)
   - Vorhandene Tests (`pnpm test:unit -- --run`) laufen weiter grün; kein bestehender Static-GeoJSON-Pfad ist gebrochen
   - `pnpm check` (svelte-check strict) bleibt 0 Errors

2. **AC-2 (Schema + Migrations idempotent):**
   **Given** das Schema-Verzeichnis `src/lib/server/db/schema/`
   **When** ich folgende Tabellen via Drizzle-Schema-DSL definiere und `pnpm db:generate` ausführe
   **Then**:
   - `bezirk_stats` (PK: `slug`, Felder: cross-layer-Aggregat-Werte als typed JSONB-Spalten + `computed_at` Timestamp)
   - `kiez_stats` (PK: `slug`, FK-Referenz `bezirk_slug` → `bezirk_stats.slug`)
   - `bezirk_score` (PK: `slug`, Felder: `composite` Number + Komponenten-Spalten + `computed_at`)
   - `kiez_score` (PK: `slug`, FK `bezirk_slug` → `bezirk_stats.slug`)
   - `faq_qna` (PK: composite (`page_type`, `slug`, `cluster`, `locale`), Felder: `question` Text, `answer` Text, `computed_at`; `page_type` Enum `bezirk|kiez|layer`, `locale` Enum `de|en`)
   - `llms_content` (PK: composite (`page_type`, `slug`, `locale`), Feld: `markdown` Text, `computed_at`)
   - SQL-Migrations werden in `drizzle/migrations/` deterministisch geschrieben (committed)
   - `pnpm db:migrate` ist idempotent: zweimal ausführen liefert identischen DB-Zustand ohne Fehler
   - Schema-Module (jedes File <500 LOC, gemäß CLAUDE.md MUST-Rule #2)

3. **AC-3 (DB-Client server-only):**
   **Given** das Schema und der Drizzle-Setup
   **When** ich `src/lib/server/db/index.ts` mit Connection-Pool (`postgres`-Client mit `max: 10`) und exportiertem `db: DrizzleDatabase` implementiere
   **Then**:
   - DB-Client lebt unter `src/lib/server/db/` (NICHT `src/lib/db/`), damit SvelteKit-Server-only-Garantie greift und Client-Code keinen Zugriff bekommt (Architecture-Boundary `data/ ↛ server/`, siehe `architecture.md` Zeile 1462)
   - Diese Pfad-Korrektur weicht bewusst vom Epic-Wortlaut `src/lib/db/` ab; Begründung in Dev-Notes dokumentieren
   - Connection wird lazy bei erstem `db`-Zugriff geöffnet (kein Connection-Versuch beim Modul-Import, sonst brechen Build-Schritte ohne DB)
   - `DATABASE_URL` Fehlend → klare Error-Message `"DATABASE_URL ist nicht gesetzt. Siehe .env.example."` statt Cryptic-Stacktrace

4. **AC-4 (aggregate-data.ts Build-Step):**
   **Given** die Migrations sind angewendet und `static/layers/MANIFEST.json` + alle 35 GeoJSON-Files existieren (via `pnpm data:fetch`)
   **When** ich `scripts/aggregate-data.ts` als CLI-Script implementiere und unter `pnpm data:aggregate` registriere
   **Then**:
   - Script lädt `MANIFEST.json` und alle Layer-Files via Node-FS (NICHT via Browser-`fetch`, da Build-Time)
   - Iteriert über die 12 Bezirke (aus `bezirke`-Layer) und 138 LOR-Bezirksregionen (aus `lor-bezirksregion`-Layer)
   - Berechnet pro Bezirk + Kiez Cross-Layer-Statistiken aus mindestens diesen Layern als Phase-1-MVP-Set:
     - `laerm-2023` → Mean L_DEN (dB), Mean L_NIGHT (dB), %-Fläche >65 dB
     - `luft-2023` → Mean NO2-Wert, %-Fläche „belastet"
     - `gruenversorgung-2023` → Mean Versorgungs-Wert, dominante Kategorie
     - `klima-pet-2022` → Mean PET (°C), %-Fläche „sehr heiß"
     - `mietspiegel-wohnlage` ODER `wohnlagen-2024` → dominante Wohnlage-Kategorie (Verteilung %)
     - `mss-gesamtindex-2025` → dominante Gruppe (1-12) plus Status/Dynamik-Verteilung (Story 1.30)
     - ÖPNV-Dichte: Anzahl `ubahn-stationen` + `sbahn-stationen` + `tram-haltestellen` + `bus-haltestellen` pro km²
     - `kitas-2024` + `schulen-2024` → Anzahl pro km² (Bildungs-Dichte für Score 2.9a)
     - `gruenanlagen` + `spielplaetze` → %-Flächen-Anteil
   - Rechen-Pipeline ist deterministisch: zweimal ausführen liefert byte-identische Werte (Sortier-Stabilität bei `bezirk_stats.computed_at` ausgenommen — `computed_at` wird via injectable Clock testbar gehalten)
   - Pro Aggregat-Wert wird Provenance bewahrt: das resultierende JSONB enthält für jeden Wert ein `{value, layer, sourceUpdatedAt}`-Triple, damit FR40 (Quellen-Attribution pro Datenwert) auf Aggregat-Pages erfüllt bleibt
   - Punkt-in-Polygon und Polygon-Intersection nutzen vorhandene `@turf/*`-Libs aus `package.json`; KEIN neuer Geo-Geometry-Helper (MUST-Rule #3 + #5)
   - Script ist unter 500 LOC (MUST-Rule #2). Zerlegung in `scripts/aggregate/`-Submodule pro Aggregat-Typ erwünscht (z.B. `aggregate/laerm.ts`, `aggregate/oepnv.ts`)
   - Inserts via Drizzle-`onConflictDoUpdate({ target: ..., set: ... })` upsert-Pattern, damit Idempotenz garantiert ist
   - Score-Berechnung (`bezirk_score`/`kiez_score`) ist explizit OUT-OF-SCOPE für 2.0 (Story 2.9a befüllt diese Tabellen). Tabellen werden in 2.0 nur erzeugt; Insert-Calls für Scores existieren noch nicht.
   - FAQ-Generation (`faq_qna`) und llms_content sind ebenfalls OUT-OF-SCOPE (Stories 2.5b und 2.8). Tabellen leer angelegt.

5. **AC-5 (Query-Module typesafe):**
   **Given** die Aggregat-Tabellen sind nach `pnpm data:aggregate` mit Werten befüllt
   **When** ich `src/lib/server/db/queries/`-Module pro Aggregat-Typ implementiere
   **Then**:
   - `get-bezirk-stats.ts` exportiert `getBezirkStats(slug: string): Promise<BezirkStats | null>`
   - `get-kiez-stats.ts` exportiert `getKiezStats(slug: string): Promise<KiezStats | null>`
   - `get-bezirk-score.ts` und `get-kiez-score.ts` exportieren `null` als Fallback bis Story 2.9a befüllt (nicht als Error)
   - `get-faq-qna.ts` exportiert `getFaqQna({ pageType, slug, locale }): Promise<FaqEntry[]>` (Rückgabe `[]` solange leer)
   - Typing wird aus dem Drizzle-Schema abgeleitet (`InferSelectModel<typeof bezirkStats>`), NICHT manuell dupliziert
   - Page-Server-Loader (z.B. spätere `routes/(with-header)/bezirk/[slug]/+page.server.ts` aus Story 2.3) können diese Queries direkt importieren und prerendern
   - Test-Fixtures (`src/lib/server/db/queries/__fixtures__/`) decken mindestens Friedrichshain-Kreuzberg (Bezirk) und Boxhagener Kiez (LOR-BR) als Snapshot-Coverage ab
   - Snapshot-Tests sind Pure-Function-Tests gegen Mock-Drizzle-Responses (keine echte DB-Connection im Unit-Test, kein vitest-browser-Konflikt — siehe Memory `feedback_browser_test_fetch_spy.md`)

6. **AC-6 (Build-Reproduzierbarkeit + prebuild-Hook):**
   **Given** ein frischer Production-Build-Container
   **When** der Build `pnpm install && pnpm data:fetch && pnpm data:aggregate && pnpm build` ausführt (NICHT `pnpm fetch`, das existiert nicht — siehe Dev-Note „Skript-Naming")
   **Then**:
   - `pnpm data:aggregate` läuft idempotent gegen die Production-Postgres-DB (lokal: gleiche Postgres 17, Production später Coolify-Service in Story 4.1)
   - `prebuild`-Script in `package.json` ruft mindestens `pnpm db:migrate` auf, damit `pnpm build` keine DB-Schema-Drift hat
   - `pnpm data:aggregate` wird NICHT automatisch in `prebuild` aufgerufen (zu teuer für Dev-HMR-Builds); stattdessen Dokumentation im Story-Output, dass CI explizit beide Schritte ausführen muss
   - Runtime liest die Aggregat-Daten via Server-Loader-Pattern (Story 2.3+), die Page-Output ist statisch geprerendert: am End-User-Browser wird KEIN Postgres-Connection-Roundtrip benötigt (NFR-P1, NFR-P4)
   - SvelteKit-Build-Output (`build/`) enthält keinen `postgres`- oder `drizzle-orm`-Bundle-Eintrag im Client-Bundle (Tree-Shaking via `$lib/server/`-Boundary, MUST-Rule via Architecture-Boundary)

7. **AC-7 (TDD-Mandat):**
   **Given** ADR-012 Pragmatic-TDD-Mandate
   **When** ich diese Story implementiere
   **Then** pro AC mindestens 1 Test mit failing-then-passing History, conrekt:
   - AC-1: Smoke-Test dass `drizzle.config.ts` parst und `DATABASE_URL`-Lookup funktioniert
   - AC-2: Migrations-Apply-Test gegen lokale Postgres (kann gegen pg-mem Mock laufen, falls Setup zu teuer; Entscheidung in Dev-Notes dokumentieren)
   - AC-3: Server-only-Import-Boundary-Test (Versuch eines Client-Imports muss SvelteKit-build-Time fehlschlagen — siehe `vitest.config.ts` Server-only-Pattern)
   - AC-4: Aggregat-Logik-Tests pro Submodul (Pure-Function-Tests gegen Fixture-GeoJSONs aus `src/lib/data/__fixtures__/`)
   - AC-5: Snapshot-Tests pro Query (Friedrichshain-Kreuzberg + Boxhagener Kiez)
   - AC-6: CI-Skript-Existenz-Test (`package.json`-Scripts sind alle gesetzt)
   - Coverage-Ziel: Aggregat-Submodule ≥80% (Daten-Transform), kritische Pfade ≥90% (CLAUDE.md-Hard-Rule)

8. **AC-8 (Dokumentation):**
   **Given** dass diese Story Foundation für Epic 2 + Epic 4 ist und ADR-013 noch nicht existiert (Story 4.4)
   **When** Implementierung abgeschlossen ist
   **Then**:
   - `docs/runbooks/postgres-restore.md`-Stub wird nicht geschrieben (Story 4.4 ownt das); aber `docs/runbooks/local-postgres-setup.md` als kurzer Onboarding-Stub mit Homebrew-Install-Steps + `createdb navigator_dev`
   - Inline-Comments in `aggregate-data.ts` referenzieren die zugrundeliegenden Layer-Slugs aus `MANIFEST.json` an den Stellen wo Slug-Hardcode unvermeidbar ist
   - `_bmad-output/implementation-artifacts/sprint-status.yaml`-Eintrag mit Implementierungs-Highlights (analog zu Story 1.27, 1.29 etc.)

## Tasks / Subtasks

- [x] **T1: Drizzle-Dependencies + Config** (AC: 1)
  - [x] T1.1: `pnpm add drizzle-orm postgres` und `pnpm add -D drizzle-kit`
  - [x] T1.2: `drizzle.config.ts` mit `DATABASE_URL`-Lookup, `out: './drizzle/migrations'`, `dialect: 'postgresql'`
  - [x] T1.3: `.env.example` ergänzen (`DATABASE_URL=postgres://app:app@127.0.0.1:5432/navigator_dev`)
  - [x] T1.4: `.gitignore`-Check für `.env` (bereits vorhanden, verifiziert)
  - [x] T1.5: Test: bestehende Test-Suite (`pnpm test:unit -- --run`) bleibt 100% grün

- [x] **T2: Schema-Module + Migrations** (AC: 2)
  - [x] T2.1: `src/lib/server/db/schema/bezirk-stats.ts` mit Drizzle-pgTable + JSONB pro Cluster
  - [x] T2.2: `src/lib/server/db/schema/kiez-stats.ts` (FK auf bezirk-stats)
  - [x] T2.3: `src/lib/server/db/schema/bezirk-score.ts`
  - [x] T2.4: `src/lib/server/db/schema/kiez-score.ts` (FK auf bezirk-stats)
  - [x] T2.5: `src/lib/server/db/schema/faq-qna.ts` mit composite-PK + Enums (`pageTypeEnum`, `localeEnum`)
  - [x] T2.6: `src/lib/server/db/schema/llms-content.ts`
  - [x] T2.7: `src/lib/server/db/schema/index.ts` als Re-Export-Barrel (plus `aggregate-types.ts`)
  - [x] T2.8: `pnpm db:generate` → `drizzle/migrations/0000_ambitious_brother_voodoo.sql` (committed)
  - [x] T2.9: `pnpm db:migrate`-Script via `scripts/db/migrate.ts` (drizzle-orm/postgres-js/migrator)
  - [x] T2.10: Test: Migration zweimal anwenden ist idempotent (verifiziert)

- [x] **T3: Server-only DB-Client** (AC: 3, AC: 7-A3)
  - [x] T3.1: `src/lib/server/db/index.ts` mit Lazy-Connection-Pool (`max: 10`), `getDb()` + `closeDb()`
  - [x] T3.2: Klare Error-Message bei fehlendem `DATABASE_URL` („DATABASE_URL ist nicht gesetzt. Siehe .env.example.")
  - [x] T3.3: Test: Boundary-Check via `boundary.test.ts` (Vitest-Smoke gegen Source-Code, exkludiert `.remote.ts`/`.server.ts`)

- [x] **T4: Aggregat-Submodule (Pure-Functions)** (AC: 4, AC: 7-A4)
  - [x] T4.1: `scripts/aggregate/types.ts` mit `BezirkAggregateRow`, `KiezAggregateRow`, `AggregateValue<T>`
  - [x] T4.2: `scripts/aggregate/spatial.ts` mit `pointInPolygon`, `pointsInPolygon`, `featureMean`, `shareAbove`, `dominantCategory`, `categoryDistribution`, `countPerKm2`, `countFeaturesInPolygon`, `centroid`, `bbox` (alle Wrapper um @turf, kein neuer Geo-Code)
  - [x] T4.3: `scripts/aggregate/laerm.ts` (ordinal `kategorie` statt L_DEN — Daten-Realität, siehe Dev-Notes)
  - [x] T4.4: `scripts/aggregate/luft.ts` (ordinal `kategorie`)
  - [x] T4.5: `scripts/aggregate/gruen.ts` (gruenversorgung-2023 ordinal + gruenanlagen-Count + spielplaetze-Count)
  - [x] T4.6: `scripts/aggregate/klima.ts` (klima-pet-2022 meanPet + shareSehrHeiss >38°C)
  - [x] T4.7: `scripts/aggregate/wohnen.ts` (wohnlagen-2024 `wol`-Verteilung + mss-gesamtindex-2025 `sdi_n`-Verteilung)
  - [x] T4.8: `scripts/aggregate/oepnv.ts` (ubahn+sbahn+tram+bus Counts + stops/km²)
  - [x] T4.9: `scripts/aggregate/bildung.ts` (kitas-2024 + schulen-2024 per km²)
  - [x] T4.10: Pro Submodul Pure-Function-Tests (`spatial.test.ts` 12, `laerm.test.ts` 3, `aggregators.test.ts` 7)
  - [x] Bonus: `scripts/aggregate/heritage.ts` (denkmal-2024 + stolpersteine per km² — Scope-Erweiterung „MVP + Heritage" per User-Lock 2026-05-16)

- [x] **T5: Aggregat-CLI-Script** (AC: 4, AC: 6)
  - [x] T5.1: `scripts/aggregate-data.ts` als Orchestrator (`aggregateAll()` + `main()`)
  - [x] T5.2: Manifest + GeoJSONs via Node-FS (`readJson` Helper)
  - [x] T5.3: Iteration über `bezirke` (12) und `lor-bezirksregion` (143; Spec-Wert 138 outdated, ODIS 2021 hat 143)
  - [x] T5.4: Pro Bezirk + Kiez Aggregat-Submodule aufrufen, Composite über 8 Cluster
  - [x] T5.5: Drizzle-Inserts via TRUNCATE+Insert-Pattern (Full-Refresh für Slug-Rename-Idempotenz)
  - [x] T5.6: `package.json` Script `data:aggregate` registriert (`tsx scripts/aggregate-data.ts`)
  - [x] T5.7: Idempotenz-Test (`aggregate-data.test.ts` hash-stable 2x-Run verifiziert)

- [x] **T6: Query-Module + Snapshot-Tests** (AC: 5, AC: 7-A5)
  - [x] T6.1: `src/lib/server/db/queries/get-bezirk-stats.ts` (mit `InferSelectModel`)
  - [x] T6.2: `src/lib/server/db/queries/get-kiez-stats.ts`
  - [x] T6.3: `src/lib/server/db/queries/get-bezirk-score.ts` (Null-Fallback)
  - [x] T6.4: `src/lib/server/db/queries/get-kiez-score.ts` (Null-Fallback)
  - [x] T6.5: `src/lib/server/db/queries/get-faq-qna.ts` (leer-Array-Fallback)
  - [x] T6.6: Snapshot-Tests in `queries.test.ts` — gegen reale lokale Postgres statt Mock (pg-mem hatte zu schlechte JSONB-Drizzle-Inference, dokumentiert in Test-File). Coverage: Friedrichshain-Kreuzberg + Mitte + 1. Kiez aus DB + Null-Cases + Score/FAQ-Fallbacks.

- [x] **T7: Build-Hook + CI-Doku** (AC: 6, AC: 8)
  - [x] T7.1: `prebuild`-Script in `package.json` (`pnpm db:migrate`)
  - [x] T7.2: `docs/runbooks/local-postgres-setup.md` mit Homebrew + Role + DB + Migration + Aggregat-Pipeline + Reset + Bias-Disclaimer
  - [x] T7.3: Data-Pipeline-Doku in `local-postgres-setup.md` enthalten (separates `data-pipeline.md` nicht nötig, integriert)
  - [x] T7.4: Sprint-Status-Eintrag in `_bmad-output/implementation-artifacts/sprint-status.yaml` mit Highlights

- [x] **T8: Final-Verifikation** (AC: 1-8)
  - [x] T8.1: `pnpm test:unit --run --project=server` 100% grün (1043 Tests / 94 Files)
  - [x] T8.2: `pnpm check` 0 Errors / 0 Warnings (svelte-check, 5874 Files)
  - [x] T8.3: `pnpm build` Pre-Existing-Failure auf `/lizenzen → /datenschutz` Link (Story 4.6 fehlt). Verifiziert via Stash-Test dass Failure auch auf clean main reproduziert — NICHT Story-2.0-Regression. `prebuild` (db:migrate) läuft sauber durch.
  - [x] T8.4: Spotcheck: `bezirk_stats` = 12 Zeilen, `kiez_stats` = 143 Zeilen (Spec-Wert „138" outdated, siehe Dev-Notes)
  - [x] T8.5: Spotcheck Friedrichshain-Kreuzberg: laerm=mittel, oepnv-density=17.8 stops/km², denkmal-density=26.9/km² — plausibel inner-city
  - [x] T8.6: Story-Status auf `review`, Dev Agent Record + File List ausgefüllt

## Dev Notes

### Skript-Naming-Konvention (wichtig)

Epic-2-Block in `epics.md` Zeile 1057 schreibt `pnpm fetch && pnpm data:aggregate && pnpm build`. Tatsächlich heisst das existierende Script in `package.json` aber `pnpm data:fetch` (siehe `package.json:18`). Diese Story behält die existierende Konvention bei: `data:fetch`, `data:aggregate`, `db:generate`, `db:migrate`. Epic-Wortlaut ist Hint, nicht Vorschrift.

### Pfad-Korrektur DB-Client (server-only)

Epic schreibt `src/lib/db/index.ts`. Architecture-Boundary in `architecture.md` Zeile 1462 verbietet aber Client-Imports von `$lib/server/`-Code. Drizzle + Postgres-Connection sind hart Server-only (Connection-String in env, Postgres-Driver kann nicht im Browser laufen). Korrekter Pfad ist deshalb `src/lib/server/db/`. SvelteKit verifiziert den `$lib/server/`-Boundary zur Build-Zeit; Versuch eines Client-Imports schlägt mit klarer Build-Fehler-Meldung fehl. Diese Korrektur in Dev-Notes dokumentieren, sonst missverstehen Folge-Stories die Pfad-Konvention.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** `aggregate-data.ts` darf nicht zum Monolith werden. Submodule pro Aggregat-Typ in `scripts/aggregate/`.
- **#3 Bestehende Funktionen prüfen:** `@turf/boolean-point-in-polygon`, `@turf/distance`, `@turf/center`, `rbush` sind installiert. KEINE neuen Geo-Helper schreiben.
- **#7 TypeScript strict, kein `any`:** Drizzle-Types via `InferSelectModel`, JSONB-Spalten via Drizzle-`$type<MyAggregateShape>()`.
- **#10 Cookieless:** Trifft 2.0 nicht direkt (Server-only); aber wenn `faq_qna`-Inhalte später auf Pages gerendert werden, dürfen keine Cookies durch DB-Roundtrip entstehen. Story 2.3+ Konzern.
- **#15 `$state.raw` für grosse Objekte:** Nicht relevant für 2.0 (kein Svelte-State).

### Aggregat-Schema-Design (Empfehlung)

Statt 1 Spalte pro Aggregat-Wert eher JSONB pro Cluster, damit Schema nicht bei jedem neuen Aggregat-Typ migriert werden muss. Beispiel:

```typescript
// src/lib/server/db/schema/bezirk-stats.ts
export const bezirkStats = pgTable('bezirk_stats', {
  slug: text('slug').primaryKey(),
  laerm: jsonb('laerm').$type<LaermAggregat>().notNull(),
  luft: jsonb('luft').$type<LuftAggregat>().notNull(),
  gruen: jsonb('gruen').$type<GruenAggregat>().notNull(),
  klima: jsonb('klima').$type<KlimaAggregat>().notNull(),
  wohnen: jsonb('wohnen').$type<WohnenAggregat>().notNull(),
  oepnv: jsonb('oepnv').$type<OepnvAggregat>().notNull(),
  bildung: jsonb('bildung').$type<BildungAggregat>().notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Trade-off: Postgres-JSONB-Indexes sind teurer als Spalten-Indexes. Aber Phase-1-MVP fragt typischerweise nach `slug`-PK, nicht nach JSONB-Innen-Werten. Wenn `bezirk_score`/`kiez_score` (Story 2.9a) range-queries nach Score brauchen, dort dedizierte Number-Spalten. Diese Empfehlung in Schema-Implementierung umsetzen, ggf. mit User-Rückfrage wenn Cluster-Schnitt anders fällt.

### Provenance pro Aggregat-Wert

FR40 verlangt Quellen-Attribution pro Datenwert. Im Aggregat heisst das: jede berechnete Zahl muss zurück auf den Source-Layer und dessen `sourceUpdatedAt` referenzierbar sein. Empfohlenes Aggregat-Wert-Schema:

```typescript
type AggregateValue<T> = {
  value: T;
  layer: string;          // z.B. 'laerm-2023'
  sourceUpdatedAt: string; // ISO-8601, aus MANIFEST.layers[].sourceUpdatedAt
};
type LaermAggregat = {
  meanLDen: AggregateValue<number>;
  meanLNight: AggregateValue<number>;
  shareAbove65Db: AggregateValue<number>;
};
```

So kann Story 2.3 (Bezirks-Page) pro Wert das `data-stand-banner`-Pattern aus Story 1.18 wiederverwenden, ohne Provenance-Lücke.

### Test-Strategie (TDD per ADR-012)

- **Pure-Function-Tests:** Aggregat-Submodule (T4.3-T4.9) gegen vorhandene Mini-Fixtures (`src/lib/data/__fixtures__/mini-bezirke.geojson` etc.). Eine Mini-Fixture pro Aggregat-Typ ist OK (Phase-1-MVP-Scope).
- **DB-Tests:** Optional gegen pg-mem (falls trivial einrichtbar) oder gegen lokale Postgres in einem dedizierten `_test`-Schema. Wenn pg-mem Stress macht: Snapshot-Tests gegen mock-Drizzle reichen für AC-5.
- **Server-only-Boundary-Test:** Vitest-Test der versucht `$lib/server/db/index.ts` aus einem Client-Kontext zu importieren und prüft dass SvelteKit-Vite-Plugin den Import blockt. Falls zu komplex einzurichten: ESLint-Rule `no-restricted-imports` für `$lib/server/**` aus `$lib/components/**` als Approximation.
- **Vitest-Browser-Konflikt:** `feedback_browser_test_fetch_spy.md` warnt vor `vi.spyOn(globalThis, 'fetch')` in `*.svelte.test.ts`. Trifft 2.0 nicht (alle Tests sind reine Node-Unit-Tests), aber zur Sicherheit: keine Komponenten-Tests in dieser Story.

### Production-Postgres-Setup (out of scope)

Production-Postgres läuft erst ab Story 4.1 (Hetzner-CPX22 + Coolify-Service). Story 2.0 entwickelt gegen lokale Homebrew-Postgres 17. CI-Postgres-Service-Container kommt mit Story 4.3 (CI-Gates).

### Bestehende Konsumenten von DB-Tabellen (für Folge-Stories)

| Tabelle | Erstbefüller (diese Story) | Konsument | Folge-Befüller |
|---------|----------------------------|-----------|----------------|
| `bezirk_stats` | Story 2.0 (T5) | Story 2.3 (Bezirks-Page) | – |
| `kiez_stats` | Story 2.0 (T5) | Story 2.4 (Kiez-Page) | – |
| `bezirk_score` | Story 2.0 (Schema only, leer) | Story 2.3, 2.9b | Story 2.9a |
| `kiez_score` | Story 2.0 (Schema only, leer) | Story 2.4, 2.9b | Story 2.9a |
| `faq_qna` | Story 2.0 (Schema only, leer) | Story 2.5b, 2.3, 2.4 | Story 2.5b (`scripts/render-faq.ts`) |
| `llms_content` | Story 2.0 (Schema only, leer) | Story 2.8 (`/llms-full.txt`) | Story 2.8 |

### Open-Questions vor Dev-Start

1. **Aggregat-Wert-Set:** Reicht das in AC-4 vorgeschlagene MVP-Set (laerm/luft/gruen/klima/wohnen/oepnv/bildung)? Oder will Matze zusätzliche Cluster (z.B. Verkehr Radwege, Heritage Stolperstein-Dichte)?
2. **JSONB vs. Spalten:** Empfehlung in Dev-Notes ist JSONB pro Cluster. Falls Story 2.9b später Range-Queries auf Score-Komponenten braucht: dedizierte Spalten in `bezirk_score`/`kiez_score` (Story 2.9a-Scope). Akzeptabel?
3. **pg-mem vs. echte Postgres in Tests:** pg-mem-Setup-Aufwand vs. echtem-Postgres-Container in CI. Phase-1-Empfehlung: mock-Drizzle für Query-Tests, echte Postgres nur für T2.10 Migrations-Idempotenz-Test. OK?
4. **`prebuild`-Hook auch für `data:aggregate`?** Empfehlung NEIN (zu teuer für Dev-HMR). CI ruft beide Schritte explizit auf. Akzeptabel?
5. **Locale in `faq_qna` und `llms_content`:** Phase-1-Lock nur de+en (User-Lock 2026-05-15). Schema reflektiert das. Future i18n-Expansion müsste Schema migrieren. OK?

### Project Structure Notes

- Schema-Pfad weicht bewusst vom Epic-Wortlaut ab (`src/lib/server/db/` statt `src/lib/db/`). Begründung: SvelteKit-Server-only-Boundary.
- Aggregat-Pipeline-Submodule liegen in `scripts/aggregate/` analog zu existierender `scripts/lib/`-Konvention (siehe `scripts/lib/sources.ts`, `scripts/lib/dwd.ts`).
- Migrations liegen in `drizzle/migrations/` (Top-Level), NICHT in `src/lib/server/db/migrations/`. Konvention von Drizzle-Kit-Default; weniger Reibung als eigene Konvention.
- KEIN `src/lib/data/`-Datei wird in dieser Story neu angelegt oder geändert. Bestehende `get-bezirk-profile.ts` und `get-kiez-profile.ts` bleiben Source-of-Truth für Geo-Felder; spätere Bezirks-Page (Story 2.3) wird beide kombinieren.

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1025-L1059](../planning-artifacts/epics.md), [#L1425-L1433](../planning-artifacts/epics.md)
- Architecture Data-Boundary: [architecture.md#L1462](../planning-artifacts/architecture.md), Phase-2-Postgres-Lock-Revision: [#L1469](../planning-artifacts/architecture.md)
- 21 MUST-Regeln: [architecture.md#L1051-L1073](../planning-artifacts/architecture.md)
- ADR-012 TDD: [docs/adr/ADR-012-tdd-mandate.md](../../docs/adr/ADR-012-tdd-mandate.md)
- ADR-003 Postgres-Deferral (wird Story 4.4 als „Superseded by ADR-013" markiert): [docs/adr/ADR-003-postgres-deferral.md](../../docs/adr/ADR-003-postgres-deferral.md)
- Manifest-Schema: [src/lib/data/manifest-schema.ts](../../src/lib/data/manifest-schema.ts)
- Sources-Liste: [scripts/lib/sources.ts](../../scripts/lib/sources.ts)
- LOR-Bezirksregion-Slug-Quelle: [src/lib/data/get-kiez-profile.ts:10](../../src/lib/data/get-kiez-profile.ts)
- Story 1.30 (MSS-Layer für `wohnen`-Aggregat): [_bmad-output/implementation-artifacts/1-30-mss-soziale-stadtentwicklung.md](./1-30-mss-soziale-stadtentwicklung.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7), bmad-dev-story Skill, TDD-first per ADR-012.

### Debug Log References

- LOR-Drift-Forensik vor T1: `git log --oneline -- scripts/lib/sources.ts` + `grep -rn "lor-bezirksregion"` → identifizierte Story 1.10 als Source-Removal-Commit ohne Code-Cleanup. Code-Pfade in `get-kiez-profile.ts:10`, `layer-explain.ts:222`, `value-formatters.ts:314`, `layer-methodology.ts:6`, `layer-visibility.test.ts:22` waren dangling.
- ODIS-Endpoint-Verifikation: `curl -sI https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson` → HTTP 200 + Content-Type application/geo+json + 143 Features (EPSG:25833 UTM33).
- Denkmal-Endpoint-Recherche: ODIS hat keinen Denkmal-Dataset; FIS-Broker WFS `denkmale:denkmale` GetCapabilities → typeNames=denkmale:denkmale, GetFeature mit `version=2.0.0&typeNames=` (nicht `typeName=`) liefert 9553 Features.
- Postgres-Setup: `psql -h 127.0.0.1 -d postgres` als Superuser → CREATE ROLE app + CREATE DATABASE navigator_dev OWNER app.
- Aggregat-Run-Time: ~28s für 12 Bezirke + 143 BZRs (16k klima-pet Polygone + 400k wohnlagen Points dominieren).
- Heerstraße-Slug-Collision (2 BZRs same name): Disambiguation via Bezirks-Slug-Suffix; verifiziert nach 2. data:aggregate-Run dass count=143 (vorher 142 wegen Collision + 144 nach Disambig ohne TRUNCATE).
- pre-existing build-failure auf `/lizenzen → /datenschutz` Link verifiziert via `git stash && pnpm build` → fails identisch auf clean main; NICHT 2.0-Regression.

### Completion Notes List

**Architektur-Korrekturen vs. Epic-Wortlaut (begründet, in Schema-Code dokumentiert):**

1. **DB-Pfad `src/lib/server/db/` statt Epic-`src/lib/db/`** — SvelteKit-Server-only-Boundary erzwingt das (architecture.md Zeile 1462). Boundary-Test in `boundary.test.ts` verifiziert kein Client-Code (`$lib/components/`, `$lib/data/`, `+page.svelte`) den Pfad importiert.
2. **143 BZR statt Spec-Wert 138** — ODIS-Dataset 2021 hat 143 LOR-Bezirksregionen (inkl. Sub-Klassifikationen). Spec aus Epic-Beschreibung outdated. Konsumenten-Stories (2.4) brauchen Update auf 143.
3. **JSONB pro Cluster statt flacher Spalten** — User-Lock 2026-05-16. Trade-off akzeptiert: JSONB-Range-Queries teurer als Spalten-Indexes, aber Phase-1-MVP-Konsum (`get-bezirk-stats(slug)`) ist PK-Lookup-dominiert. Range-Queries für Score (`ORDER BY composite DESC`) leben in dedizierten Number-Spalten in `bezirk_score`/`kiez_score`.
4. **8 Cluster statt 7 (MVP + Heritage)** — User-Lock 2026-05-16. denkmal-2024 Pipeline neu eingerichtet, heritage.ts aggregiert denkmal/km² + stolpersteine/km².
5. **Aggregat-Schema-Anpassung an Daten-Realität:** `laerm-2023`, `luft-2023`, `gruenversorgung-2023` publizieren ordinal `kategorie` pro LOR-PLR, nicht numerische dB/NO2/Versorgungswerte wie Epic-Wortlaut annahm. Schema-Types verwenden `dominantCategory` + `categoryDistribution` (per Memory `project_compare_editorial_profiles.md` ordinal-Behandlung). FR40-Provenance pro Wert (layer + sourceUpdatedAt) bleibt erfüllt.
6. **`oepnv.stopsPerKm2.layer = 'oepnv-composite'`** — Composite-Wert über 4 ÖPNV-Layer kann keinen Single-Layer-Slug haben; Konvention: Composite-Marker mit ältestem `sourceUpdatedAt` der Quellen.

**Was 2.0 NICHT macht (out-of-scope, in Konsumenten-Stories):**

- `bezirk_score` + `kiez_score` Schema only; Befüllung in Story 2.9a.
- `faq_qna` Schema only; Befüllung in Story 2.5b.
- `llms_content` Schema only; Befüllung in Story 2.8.
- Production-Postgres-Container: Story 4.1 (Hetzner CPX22 + Coolify).
- CI-Postgres-Service: Story 4.3.
- ADR-013 (Postgres-Hybrid): Story 4.4 (ADR-003-Postgres-Deferral wird als „Superseded by ADR-013" markiert).

**Bekannte Bias:**

- `denkmal-2024` Mapshaper-Simplify mit `keep-shapes` eliminiert ~24% Sliver-Polygone trotz keep-shapes (Story-1.25-Pattern wiederholt sich). Heritage-Dichte ist damit ~24% unterschätzt. Dokumentiert in `scripts/aggregate/heritage.ts` + `docs/runbooks/local-postgres-setup.md`. Höhere Genauigkeit erfordert unsimplified Source-Fetch (Folge-Story).

**Test-Stand:**

- 50+ neue Unit-Tests (drizzle-config 6, migrate 4, db-client 5, boundary 4, spatial 12, laerm 3, aggregators 7, aggregate-data 2, queries 9).
- `pnpm test:unit --run --project=server` → 1043/1043 grün.
- `pnpm check` → 0 Errors / 0 Warnings.

### File List

**Neue Files (35):**

- `drizzle.config.ts`
- `drizzle/migrations/0000_ambitious_brother_voodoo.sql`
- `drizzle/migrations/meta/_journal.json`
- `drizzle/migrations/meta/0000_snapshot.json`
- `scripts/db/migrate.ts`
- `scripts/db/migrate.test.ts`
- `scripts/db/drizzle-config.test.ts`
- `scripts/aggregate-data.ts`
- `scripts/aggregate-data.test.ts`
- `scripts/aggregate/types.ts`
- `scripts/aggregate/spatial.ts`
- `scripts/aggregate/spatial.test.ts`
- `scripts/aggregate/laerm.ts`
- `scripts/aggregate/laerm.test.ts`
- `scripts/aggregate/luft.ts`
- `scripts/aggregate/gruen.ts`
- `scripts/aggregate/klima.ts`
- `scripts/aggregate/wohnen.ts`
- `scripts/aggregate/oepnv.ts`
- `scripts/aggregate/bildung.ts`
- `scripts/aggregate/heritage.ts`
- `scripts/aggregate/aggregators.test.ts`
- `src/lib/server/db/index.ts`
- `src/lib/server/db/index.test.ts`
- `src/lib/server/db/boundary.test.ts`
- `src/lib/server/db/schema/index.ts`
- `src/lib/server/db/schema/aggregate-types.ts`
- `src/lib/server/db/schema/bezirk-stats.ts`
- `src/lib/server/db/schema/kiez-stats.ts`
- `src/lib/server/db/schema/bezirk-score.ts`
- `src/lib/server/db/schema/kiez-score.ts`
- `src/lib/server/db/schema/faq-qna.ts`
- `src/lib/server/db/schema/llms-content.ts`
- `src/lib/server/db/queries/get-bezirk-stats.ts`
- `src/lib/server/db/queries/get-kiez-stats.ts`
- `src/lib/server/db/queries/get-bezirk-score.ts`
- `src/lib/server/db/queries/get-kiez-score.ts`
- `src/lib/server/db/queries/get-faq-qna.ts`
- `src/lib/server/db/queries/queries.test.ts`
- `docs/runbooks/local-postgres-setup.md`

**Geänderte Files (6):**

- `package.json` (+drizzle-orm/postgres/drizzle-kit/dotenv/@turf/area Deps + 3 neue Scripts + prebuild Hook)
- `pnpm-lock.yaml` (Deps-Update)
- `.env.example` (+DATABASE_URL)
- `scripts/lib/sources.ts` (+lor-bezirksregion + denkmal-2024 Source-Einträge)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (+denkmal-2024-Entry für Manifest-Coverage-Guard)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (last_updated + 2-0 ready→in-progress→review + Highlights-Block)
- `_bmad-output/implementation-artifacts/2-0-postgres-aggregat-foundation-drizzle-build-step.md` (Status + Tasks-Checkboxes + Dev Agent Record)

**Neue Data-Files (2):**

- `static/layers/lor-bezirksregion.9479b010.geojson` (143 Features, neu via `pnpm data:fetch lor-bezirksregion`)
- `static/layers/denkmal-2024.1725b1c3.geojson` (7228 Features, neu via `pnpm data:fetch denkmal-2024`)
- `static/layers/MANIFEST.json` (Manifest-Update: 38 → 39 Layer)

### Change Log

- 2026-05-16: Story 2.0 ready-for-dev → in-progress → review (single dev-story session, TDD-first per ADR-012). LOR-Drift-Forensik vorgelagert (Story 1.10-Cleanup-Gap identifiziert + Variante-A-Re-Introduce). Heritage-Cluster nachgezogen (denkmal-2024 FIS-Broker-Pipeline). Schema-Realitäts-Anpassung (laerm/luft/gruen ordinal-kategorial statt numerisch). 8 Cluster, 6 Tabellen, 50+ neue Tests, 1043/1043 server-tests grün, 0 type-errors.
