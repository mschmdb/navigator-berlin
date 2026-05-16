# Local Postgres Setup (Story 2.0)

Onboarding-Stub für die Postgres-Aggregat-Schicht. Production-Setup (Hetzner CPX22 + Coolify) kommt mit Story 4.1; Disaster-Recovery-Runbook mit Story 4.4 (ADR-013).

## Voraussetzungen

- macOS mit Homebrew, oder Linux mit Paket-Manager
- pnpm + Node 20+ wie im Projekt-Standard

## Installation

```bash
# Postgres 17 via Homebrew
brew install postgresql@17
brew services start postgresql@17

# Verify
psql -h 127.0.0.1 -d postgres -c "SELECT version();"
```

## Role + Database anlegen

```bash
psql -h 127.0.0.1 -d postgres <<'SQL'
CREATE ROLE app WITH LOGIN PASSWORD 'app';
CREATE DATABASE navigator_dev OWNER app;
GRANT ALL PRIVILEGES ON DATABASE navigator_dev TO app;
SQL
```

## `.env` befüllen

```env
DATABASE_URL=postgres://app:app@127.0.0.1:5432/navigator_dev
```

`.env.example` enthält den Default; `.env` ist gitignored.

## Schema-Migrationen + Aggregat-Befüllung

```bash
# 1) Schema anwenden (Drizzle-Migrationen)
pnpm db:migrate

# 2) Statische GeoJSON-Layer laden (einmalig, ~10 min)
pnpm data:fetch

# 3) Cross-Layer-Aggregat berechnen + in DB schreiben (~30 sec)
pnpm data:aggregate
```

Nach Schritt 3 sollte gelten:

```bash
psql -h 127.0.0.1 -U app -d navigator_dev <<'SQL'
SELECT count(*) FROM bezirk_stats;  -- erwarte 12
SELECT count(*) FROM kiez_stats;    -- erwarte 143
SQL
```

## Build-Hook

`pnpm build` ruft `prebuild` (= `pnpm db:migrate`) automatisch auf, damit kein Schema-Drift zwischen Code und DB entsteht. `pnpm data:aggregate` wird bewusst NICHT in `prebuild` aufgerufen (HMR-Performance); CI ruft beide Schritte explizit auf.

## Schema-Änderungen

```bash
# 1) Schema-File in src/lib/server/db/schema/ ändern
# 2) Migration generieren
pnpm db:generate
# 3) SQL-File in drizzle/migrations/ reviewen + committen
# 4) Anwenden
pnpm db:migrate
```

## Bekannte Bias / Datenrealität

- `denkmal-2024` (Heritage-Cluster): Mapshaper-Simplify mit `keep-shapes` eliminiert nach `-clean` immer noch ~24% reine Sliver-Polygone (Story 1.25-Pattern). Heritage-Dichte ist damit leicht unterschätzt. Für höhere Genauigkeit Source mit unsimplified Polygonen fetchen (~Story 4.x).
- LOR-Bezirksregion: 143 BZRs (Stand ODIS 2021), nicht 138 wie in alten Doks; Slug-Kollision „Heerstraße" wird in `scripts/aggregate-data.ts` mit Bezirks-Slug-Suffix aufgelöst (`heerstrasse-charlottenburg-wilmersdorf`, `heerstrasse-spandau`).

## Reset (lokal)

```bash
psql -h 127.0.0.1 -d postgres -c "DROP DATABASE navigator_dev;"
psql -h 127.0.0.1 -d postgres -c "CREATE DATABASE navigator_dev OWNER app;"
pnpm db:migrate
pnpm data:aggregate
```
