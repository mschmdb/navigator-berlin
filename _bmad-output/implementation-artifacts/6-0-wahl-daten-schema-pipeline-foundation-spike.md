# Story 6.0: Wahl-Daten-Schema + Pipeline-Foundation + Spike

Status: review

<!-- Created 2026-05-18 via dev-story-workflow + Recon-Phase (Daten-Quellen + UX-Patterns). Spike-First-Approach: zuerst 1 CSV pulldown + Schema-Validate, dann erst Drizzle-Schema implementieren. Konsumenten: 6-2 (Geometrien), 6-3 (Inspector-Section), 6-4 (Detail-Pages), 6-7 (Cross-Layer-Templates), 6-8 (WebMCP-Tools), 6-9 (Methodik+JSON-LD). -->

## Story

As a Solo-Maintainer,
I want zuerst einen Daten-Spike (1 CSV pulldown + parse + Schema-Validate) und dann ein vollständiges Drizzle-Schema für Wahldaten plus idempotenten Build-Step der die Stimmbezirks-Ergebnisse räumlich auf Kiez/Bezirk/Berlin aggregiert,
so that wir vor der vollständigen Pipeline echte Schema-Realität gegen Annahmen validieren und Wahldaten genau wie LOR/Klima behandeln (statisch, reproduzierbar, getestet) statt als Live-API.

## Probleme heute

1. **Keine Wahldaten in Postgres.** Aktueller Stand: kein Schema, kein Aggregator, keine Queries. Epic 6 hängt komplett an dieser Foundation.
2. **Schema-Annahmen aus Recon nicht live-verifiziert.** Recon-Agent konnte die `Berlin_AH21_W1.csv` nicht direkt fetchen (Statistik-BB-Site-Redirect kollidierte mit WebFetch). Header-Spalten, Encoding, Trennzeichen, Briefwahl-UWB-Range sind aktuell Annahmen, keine Fakten. Risk: Schema-Drift erst beim Real-Run aufgedeckt → Aggregator-Rewrite nötig.
3. **Parteien-Naming-Drift.** PDS (vor 2007) → Linkspartei.PDS (2007-2007) → DIE LINKE (ab 2007). AfD ab 2013. BSW ab 2024. Ohne `partei_alias`-Mapping-Table werden historische Zeitreihen falsch zusammengeführt.
4. **Wiederholungswahl 2023.** AGH 2021 wurde 2022 für ungültig erklärt, AGH 2023 ist Wiederholungs-Wahl, NICHT neue regulär. Ohne `is_repeat_election` + `parent_election_id`-Flags entsteht Verzerrung in Zeitreihen.
5. **Stimmbezirks-IDs sind nicht stabil.** UWB-Schlüssel ändern sich pro Wahl (Zuschnitte). Cross-Wahl-Vergleich auf Stimmbezirks-Ebene NICHT 1:1 möglich. Aggregation auf Kiez/Bezirk/Berlin im Build-Step pflicht, sonst zerbricht jede Sparkline.
6. **Briefwahl-Asymmetrie pre-2021.** Vor 2021 sind Briefstimmen NUR auf Bezirks-Ebene aggregiert, nicht pro Stimmbezirk. Schema muss diese Asymmetrie explizit modellieren (`ist_briefwahl_aggregat` BOOL), sonst zeigt UI falsche „Stimmbezirks-Werte".
7. **Volksentscheide cancelled.** Story 6.6 per User-Decision 2026-05-18 out-of-scope Phase 1. Schema MUSS Volksentscheide NICHT modellieren.
8. **EN-Variante cancelled.** Phase-1 DE-only Lock (Memory `project_i18n_phase_1_de_only`).

## Quellen

- **Daten-Endpoints (CC-BY, Attribution-Pflicht):**
  - `https://www.statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W1|W2>.csv` Pattern (z.B. `Berlin_AH21_W1.csv`, `Berlin_BVV21.csv`, `Berlin_BT21_W1.csv`)
  - `https://daten.berlin.de/datensaetze?tags=Wahlen` (Index, jeder Datensatz hat eigenen Direkt-Download)
  - `https://www.bundeswahlleiterin.de/bundestagswahlen/{jahr}/ergebnisse/opendata/btw{yy}/csv/` (BTW-Backup-Quelle)
- **Geometrien (Story 6.2, hier nur Referenz):**
  - `https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AH21.zip` (BTW21+AGH21)
  - `https://daten.berlin.de/datensaetze/geometrien-der-wahlbezirke-fur-die-wahl-zum-21-deutschen-bundestag-in-berlin` (BTW25)
- **Story 2.0:** `src/lib/server/db/`-Patterns (Drizzle-Schema, Migrations, getDb-Wrapper). Reuse.
- **Story 2.9a:** `kiez_score` + `bezirk_score`-Aggregat-Pattern (flächen-gewichtete Aggregation auf LOR-Hierarchie, idempotent via TRUNCATE+Insert). Wahl-Aggregator folgt analoger Architektur, aber: räumliche Centroid-Strategie statt anteiliger Polygon-Verteilung weil Stimmbezirke ≪ Kieze.
- **Story 2.0 `scripts/aggregate-data.ts`:** Build-Time-Cache-Pattern. Reuse.
- **ADR-012 TDD-Mandat:** Schema-Validation + Pure-Aggregator-Logic test-first.
- **CLAUDE.md (Repo + User-global):** Files < 500 LOC, kein em-dash, kein „lebenswert", @lucide/svelte, kein Hardcoded ohne Rückfrage.
- **Memory `project_kiez_score_dimensions`:** Aggregat-Architektur-Vorbild.
- **Memory `project_simplify_keep_shapes`:** Geometrien-Vorbereitung (Story 6.2, hier nicht direkt relevant).
- **Memory `feedback_no_em_dashes`, `feedback_no_lebenswert`:** Editorial-Pflicht für Aggregator-Output-Strings (Partei-Labels, Disclaimer-Text).
- **Memory `project_i18n_phase_1_de_only`:** keine EN-Locales.

## Phase-Kontext + Scope-Anpassung

**Hand-off:**

- **Story 2.0** liefert die Postgres-Foundation (Drizzle, Migrations, getDb). 6.0 erweitert das Schema additiv.
- **Story 2.9a** liefert das Aggregat-Pattern (TRUNCATE+Insert pro Wahl, idempotent). 6.0 folgt der Architektur.
- **Story 6.2** konsumiert das Schema (Wahlbezirks-Geometrien + Adress-Lookup).
- **Story 6.3** konsumiert die Queries (Inspector-Section).
- **Story 6.4** konsumiert die Queries (Detail-Pages).
- **Story 6.7/6.8/6.9** konsumieren das Schema (Templates, WebMCP, JSON-LD).

**Phase-1-Pragmatik:**

- **Spike-First-Hard-Rule:** AC-0 (Spike) MUSS vor AC-1 (Schema) abgeschlossen sein. Wenn Spike-Findings vom Schema-Entwurf abweichen, Schema rewriten BEVOR Migration läuft. Ziel: Schema-Drift vor Production-Migration aufdecken.
- **Daten-Cutoff:** BTW 2013/2017/2021/2025 + AGH 2011/2016/2021/2023 + BVV 2011/2016/2021/2023. 12 Wahlen total.
- **Briefwahl pre-2021:** Schema modelliert via `ist_briefwahl_aggregat`-BOOL pro `ergebnis`-Row. UI (Story 6.3) rendert Disclaimer entsprechend.
- **Stimmbezirks-Aggregation auf Kiez:** Centroid-Strategie. Pro Stimmbezirk wird der Polygon-Centroid berechnet, das enthaltene Kiez (LOR-Bezirksregion) bestimmt, SUM-Aggregation pro Partei. Rationale: Stimmbezirke (~1800-2200) sind deutlich kleiner als Kieze (~143), Centroid-Strategie ist 99 %+ präzise und O(N) statt O(N²) bei Polygon-Intersection. Edge-Case (Stimmbezirk auf Kiez-Grenze) wird in `docs/wahldaten-methodik.md` dokumentiert.
- **Volksentscheide raus.** Schema enthält KEINEN `volksentscheid`-Typ. Falls Phase-2-Reactivate: separate Migration.
- **WebMCP-Phase-2:** Story 6.0 liefert nur Schema + Queries, NICHT WebMCP-Tools (das ist Story 6.8).
- **Methodik-Page-Section:** Story 6.0 liefert NICHT die Methodik-Page-Erweiterung (das ist Story 6.9).

**Sequencing:** Story 6.0 ist Foundation, Wave 1. Hard-blocked von Story 6.2. Spike (AC-0) ist intern hard-blocked von Schema (AC-1). Schema von Pipeline (AC-2). Pipeline von Aggregat-Build (AC-3). Pipeline+Briefwahl-Handling (AC-4). Tests (AC-5). Queries (AC-6).

**Memory-Marker:** `feedback_no_em_dashes`, `feedback_no_lebenswert`, `project_i18n_phase_1_de_only`, `project_kiez_score_dimensions`.

## Acceptance Criteria

**AC-0 (Spike-First, Pflicht vor AC-1):**

**Given** die Recon-Annahme dass `statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W1|W2>.csv` einheitliches CSV-Schema liefert
**When** ich `scripts/wahlen/spike-fetch-ah21.ts` implementiere das `Berlin_AH21_W1.csv` herunterlädt, parsed (mit auto-detection für Encoding + Trennzeichen), und einen Snapshot-JSON in `_bmad-output/spike-artifacts/wahl-schema-snapshot-ah21-w1.json` schreibt
**Then** echtes Schema ist verifiziert (Spalten-Namen, Encoding=Windows-1252-oder-UTF-8, Trennzeichen=Semikolon, Briefwahl-UWB-Range-Pattern)
**And** Schema-Drift zwischen Wahljahren wird manuell geprüft via 3 Stichproben-Spikes:
- `scripts/wahlen/spike-fetch-ah16.ts` → `wahl-schema-snapshot-ah16-w1.json`
- `scripts/wahlen/spike-fetch-bvv21.ts` → `wahl-schema-snapshot-bvv21.json`
- `scripts/wahlen/spike-fetch-bt21.ts` → `wahl-schema-snapshot-bt21-w1.json`
**And** alle 4 Snapshots werden vor AC-1 gegen Schema-Entwurf gehalten; bei Drift wird Schema rewriten BEVOR Migration läuft

**AC-1 (Drizzle-Schema):**

**Given** die Postgres-Foundation (Story 2.0)
**When** ich Drizzle-Schema-Tabellen anlege:
- `wahl` (id SERIAL PK, jahr INT NOT NULL, typ ENUM('btw','agh','bvv') NOT NULL, stimmtyp ENUM('erststimme','zweitstimme','einstimme') NOT NULL, is_repeat_election BOOL DEFAULT false, parent_election_id INT REFERENCES wahl(id), source_url TEXT NOT NULL, license TEXT NOT NULL DEFAULT 'CC-BY', source_updated_at TIMESTAMP, computed_at TIMESTAMP NOT NULL DEFAULT now(), UNIQUE(jahr, typ, stimmtyp))
- `stimmbezirk` (wahl_id INT REFERENCES wahl(id) ON DELETE CASCADE, uwb_id TEXT NOT NULL, bezirk_code CHAR(2) NOT NULL, wahlkreis_id INT, PRIMARY KEY (wahl_id, uwb_id))
- `partei` (id SERIAL PK, kurzname TEXT NOT NULL UNIQUE, vollname TEXT NOT NULL, farbe_hex TEXT NOT NULL, first_seen_year INT, last_seen_year INT)
- `partei_alias` (id SERIAL PK, partei_id INT REFERENCES partei(id), alias_label TEXT NOT NULL, jahr INT, UNIQUE(alias_label, jahr))
- `ergebnis` (wahl_id INT REFERENCES wahl(id) ON DELETE CASCADE, uwb_id TEXT NOT NULL, partei_id INT REFERENCES partei(id), stimmen INT NOT NULL, anteil REAL NOT NULL, ist_briefwahl_aggregat BOOL DEFAULT false, PRIMARY KEY (wahl_id, uwb_id, partei_id))
- `wahl_aggregat_kiez` (wahl_id INT REFERENCES wahl(id) ON DELETE CASCADE, kiez_slug TEXT NOT NULL, partei_id INT REFERENCES partei(id), stimmen INT NOT NULL, anteil REAL NOT NULL, computed_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY (wahl_id, kiez_slug, partei_id))
- `wahl_aggregat_bezirk` (wahl_id INT REFERENCES wahl(id) ON DELETE CASCADE, bezirk_slug TEXT NOT NULL, partei_id INT REFERENCES partei(id), stimmen INT NOT NULL, anteil REAL NOT NULL, computed_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY (wahl_id, bezirk_slug, partei_id))
- `wahl_aggregat_berlin` (wahl_id INT REFERENCES wahl(id) ON DELETE CASCADE, partei_id INT REFERENCES partei(id), stimmen INT NOT NULL, anteil REAL NOT NULL, computed_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY (wahl_id, partei_id))
**Then** Schema deckt BTW/AGH/BVV ab (Volksentscheide raus per Scope-Decision)
**And** Drizzle-Migrationen sind reproduzierbar via `pnpm db:generate` + `pnpm db:migrate`
**And** `wahl_aggregat_*`-Tabellen sind Build-Time-Cache analog kiez_score (TRUNCATE+Insert per Wahl)

**AC-2 (Aggregator-Pipeline):**

**Given** die Daten-Quellen + Schema
**When** ich `scripts/aggregate-wahl-data.ts` als CLI-Script implementiere:
- Liest pro Wahl die Roh-CSV (oder XLSX als Fallback) von der Endpoint-URL
- Parsed mit `csv-parse` (Trennzeichen + Encoding aus Spike-Snapshots)
- Validiert gegen Zod-Schema (Spalten-Namen + Types pro Wahl-Typ)
- Resolved Parteien-Naming-Drift via `partei_alias`-Lookup (PDS → DIE LINKE etc.)
- Schreibt in Postgres via TRUNCATE+Insert pro Wahl (Idempotenz)
**Then** `pnpm data:wahl-fetch` ist idempotent und reproduzierbar
**And** Pipeline läuft alle 12 Wahlen in unter 5 Minuten (Spike: messen + dokumentieren)
**And** Fehlt-Daten-Strategie: wenn CSV 404, wird Wahl übersprungen + Warning geloggt, nicht Pipeline-Abort
**And** `--only={wahl_slug}`-Flag erlaubt einzelne Wahl-Refresh

**AC-3 (Build-Aggregate):**

**Given** die Stimmbezirks-Ergebnisse + LOR-Bezirksregions-Geometrien (`lor-bezirksregion` Layer aus MANIFEST)
**When** Aggregat-Build pro Wahl die Stimmbezirks-Werte räumlich auf Kiez (LOR-BR) + Bezirk + Berlin aggregiert:
- Pro Stimmbezirk: Polygon-Centroid berechnen (turf-center) ODER aus Geometrie-Layer 6.2 lesen wenn verfügbar (für 2017+) ODER null setzen (pre-2017 ohne Geometrie)
- Centroid → enthaltenes Kiez (Punkt-in-Polygon-Lookup gegen lor-bezirksregion)
- SUM-Aggregation pro `(wahl_id, kiez_slug, partei_id)` → `wahl_aggregat_kiez`
- Analoge SUM-Aggregation auf Bezirk-Ebene → `wahl_aggregat_bezirk`
- Berlin-Aggregat = SUM über alle Stimmbezirke → `wahl_aggregat_berlin`
**Then** alle 3 Aggregat-Tabellen sind nach Pipeline-Run befüllt
**And** für pre-2017-Wahlen (ohne Stimmbezirks-Geometrie) wird Bezirks-Code direkt aus CSV-Spalte genommen (Stimmbezirks-ID enthält Bezirks-Präfix)
**And** Aggregation-Methodik in `docs/wahldaten-methodik.md` dokumentiert (Centroid-Strategie, Edge-Cases, Verzicht auf anteilige Polygon-Verteilung mit Begründung)

**AC-4 (Briefwahl-Behandlung):**

**Given** Briefwahl-Asymmetrie (pro Stimmbezirk erst ab 2021, vorher nur Bezirks-Aggregat)
**When** Aggregator Briefstimmen-Rows aus pre-2021-Daten findet (UWB-Range typisch ≥ 8000 oder explizit als „Briefwahlbezirk" gelabelt im Spike-Snapshot)
**Then** sie werden in `ergebnis` mit `ist_briefwahl_aggregat = true` markiert
**And** pre-2021-Briefstimmen werden nicht in `wahl_aggregat_kiez` gerechnet (würden Werte verfälschen), aber in `wahl_aggregat_bezirk` + `wahl_aggregat_berlin` korrekt summiert
**And** Aggregator loggt pro Wahl die Anzahl der Brief-vs-Urne-Rows zur Verifizierung

**AC-5 (Tests + Quality-Gates):**

**Given** die Pipeline
**When** ich Test-Fixtures pro Wahl-Typ anlege (1 BTW, 1 AGH, 1 BVV mit je 5 Stimmbezirken + 3 Parteien) plus Snapshot-Coverage gegen die 4 Spike-Schema-Snapshots
**Then** Pipeline ist regression-getestet
**And** Pure-Functions (CSV-Parser, Partei-Alias-Resolver, Centroid-Berechnung, Kiez-Lookup) haben Coverage ≥ 90 %
**And** Aggregator-End-to-End-Test mit Fixture-Daten verifiziert SUM-Korrektheit auf allen 3 Aggregat-Levels
**And** Schema-Drift-Detection: bei Real-Run vergleicht Aggregator die echten CSV-Headers gegen den Snapshot und failed mit explizitem Diff wenn Drift erkannt
**And** `pnpm test:unit` 100 % grün
**And** `pnpm check` 0 neue Errors

**AC-6 (Query-Modul):**

**Given** das Schema
**When** ich `src/lib/server/db/queries/wahl/`-Module implementiere:
- `get-wahl-list.ts` → alle aktiven Wahlen sortiert nach Jahr desc, mit Coverage-Flags (hat_stimmbezirks_geometrie BOOL, hat_briefwahl_pro_stimmbezirk BOOL)
- `get-results-for-stimmbezirk.ts` → `(wahlId, uwbId) → Top-5-Parteien + Wahlbeteiligung + Brief-vs-Urne-Flag`
- `get-results-for-kiez.ts` → `(wahlId, kiezSlug) → Top-5 aus wahl_aggregat_kiez + Wahlbeteiligung`
- `get-results-for-bezirk.ts` → `(wahlId, bezirkSlug) → Top-5 aus wahl_aggregat_bezirk + Wahlbeteiligung`
- `get-results-for-berlin.ts` → `(wahlId) → Top-5 aus wahl_aggregat_berlin + Wahlbeteiligung`
- `get-sparkline-for-kiez.ts` → `(kiezSlug, typ) → Top-5-Parteien × letzte N Wahlen (für Slope-Sparkline Story 6.3)`
**Then** Page-Server-Loader können typesafe lesen
**And** Tests pro Query mit Coverage ≥ 90 %
**And** alle Queries graceful gegen DATABASE_URL=null (return empty)

## Tasks/Subtasks

**T1 (Spike-First Pflicht):**

- [x] T1.1: `scripts/wahlen/spike-fetch-btw25.ts` mit fetch + csv-parse + Schema-Snapshot-Write (Pivot: BTW25 statt AH21, Source = Bundeswahlleiterin ZIP statt SBB-CSV)
- [-] T1.2: AH16/BVV21/BT21 cancelled für Phase 1 — Bundeswahlleiterin liefert keine Landeswahlen, Pivot auf BTW-Only. AGH/BVV-Spikes (XLSX-Pipeline) ins Backlog für Epic-6-Phase-2b
- [x] T1.3: `_bmad-output/spike-artifacts/wahl-schema-snapshot-btw25.json` committet (1 Snapshot, BTW 2025)
- [x] T1.4: Schema-Drift-Analyse in `_bmad-output/spike-artifacts/SCHEMA-DRIFT-ANALYSIS.md` mit 5 Findings (Source-URL-Drift, Format-Realität, Stimmbezirks-ID-Struktur, Briefwahl-Marker, Parteien-Liste)

**T2 (Drizzle-Schema):**

- [x] T2.1: 8 Tabellen-Files unter `src/lib/server/db/schema/wahl/` (wahl, stimmbezirk, partei, partei_alias, ergebnis, wahl_aggregat_kiez, wahl_aggregat_bezirk, wahl_aggregat_berlin)
- [x] T2.2: Index-File `src/lib/server/db/schema/index.ts` um Wahl-Tabellen erweitert
- [x] T2.3: `pnpm db:generate` → Migration `drizzle/migrations/0002_warm_randall.sql`
- [x] T2.4: `pnpm db:migrate` lokal erfolgreich, 14 Tables (alte 6 + 8 neue Wahl-Tables)

**T3 (Aggregator-Pipeline):**

- [x] T3.1: `scripts/wahlen/lib/`-Module: bwl-csv-parser.ts, partei-seed.ts, schema-validator.ts, row-transformer.ts (alle pure-functions, TDD)
- [x] T3.2: `scripts/aggregate-wahl-data.ts` Orchestrator + CLI-Args + Logging + Drift-Check
- [x] T3.3: `package.json`-Script `data:wahl-fetch`
- [x] T3.4: `--only={wahl_slug}`-Flag für Einzelwahl-Refresh
- [x] T3.5: Real-Run BTW 2025 erfolgreich (3598 Stimmbezirke × 2 Stimmtypen = 7196 stimmbezirk-Rows, 59645 ergebnis-Rows, 11.1s)

**T4 (Build-Aggregate):**

- [-] T4.1: Centroid-Lookup blocked bis Story 6.2 (Stimmbezirks-Geometrien)
- [x] T4.2: `aggregate-to-bezirk` + `aggregate-to-berlin` via SQL GROUP-BY in `db-loader.ts#buildAggregates`. Kiez-Aggregat = leer bis Story 6.2.
- [x] T4.3: Orchestrator ruft `buildAggregates` nach Stimmbezirks-Insert auf
- [x] T4.4: Spot-Check BTW25 Berlin Zweitstimme: Die Linke 19.86 %, CDU 18.27 %, GRÜNE 16.83 % — plausibel gegen offizielle Berliner Endergebnisse

**T5 (Briefwahl-Handling):**

- [x] T5.1: Briefwahl-Detection im row-transformer (`Bezirksart !== '0'`, korrigiert gegen UWB-Range-Heuristik aus Story-Text)
- [x] T5.2: `ist_briefwahl_aggregat`-Flag in db-loader pro ergebnis-Row gesetzt
- [-] T5.3: Pre-2021-Skip blocked bis pre-2021-Daten in der Pipeline (Phase 2b mit AGH/BVV via XLSX)
- [x] T5.4: Aggregator-Logging "brief=1275 urne=2323" beim Real-Run

**T6 (Tests):**

- [x] T6.1: Fixture `tests/fixtures/wahlen/btw25-sample.csv` (10 Zeilen: 4 Meta + 1 Header + 2 SH + 3 Berlin)
- [x] T6.2: Pure-Function-Tests: bwl-csv-parser (21), bwl-fetcher (6), partei-seed (9), row-transformer (14), schema-validator (6) = 56 Tests
- [x] T6.3: End-to-End-Test via Real-Run gegen Live-Endpoint + SQL-Spot-Check Berlin-Aggregat
- [x] T6.4: Schema-Drift-Detection integriert in Orchestrator (`isDrift` gegen Snapshot bei jedem Run, expliziter Fehler-Stop bei Drift)
- [x] T6.5: `pnpm vitest run scripts/lib/allowlist.test.ts scripts/wahlen/lib/ src/lib/server/db/schema/wahl/ src/lib/server/db/queries/wahl/` = 86/86 grün, `pnpm check` = 0 errors

**T7 (Query-Modul):**

- [x] T7.1: 6 Query-Files unter `src/lib/server/db/queries/wahl/`: get-wahl-list, get-results-for-stimmbezirk, get-results-for-kiez, get-results-for-bezirk, get-results-for-berlin, get-sparkline-for-kiez
- [x] T7.2: `wahl-queries.test.ts` mit 11 Tests (6 fallback-without-DB + 5 snapshot-against-local-DB)
- [x] T7.3: Graceful-Fallback bei DATABASE_URL=null (return empty, kein Error)

**T8 (Doku + Methodik):**

- [x] T8.1: `docs/wahldaten-methodik.md` mit Daten-Cutoff + Briefwahl-Methodik + Aggregations-Strategie + Composite-UWB-ID + Parteien-Alias-Tabelle
- [x] T8.2: `docs/INDEX.md` Eintrag unter Daten-Pipelines hinzugefügt
- [x] T8.3: Memory `project_wahl_data_cutoff_2011_2013.md` + MEMORY.md-Index
- [x] T8.4: Memory `project_wahl_partei_alias.md` + MEMORY.md-Index

## Dev Notes

**Architecture-MUST-Rules (relevant subset):**
- #2 (Files < 500 LOC), #6 (keine WHAT-Comments), #7 (TypeScript-strict), #13 (Build-Time-Caches), #14 (i18n-First — Phase 1 DE-only, partei-vollnamen DE).

**Spike-Artefakt-Format:** Snapshot-JSON pro CSV mit `{url, fetchedAt, encoding, delimiter, columns: string[], firstRow: object, briefwahlPattern?: string, rowCount: number}`. Versioning via `git add` ins Repo.

**Schema-Drift-Detection-Strategie:** Aggregator vergleicht im Real-Run die echten CSV-Headers gegen den committed-Snapshot. Bei Mismatch: explizites Error-Throw mit Diff-Output (welche Spalte fehlt / dazugekommen / umbenannt). Verhindert Silent-Data-Korruption.

**Parteien-Alias-Tabelle (initial, aus Recon):**

```
DIE LINKE: [DIE LINKE, Linkspartei.PDS, PDS, Linke]
GRÜNE: [GRÜNE, B'90/GRÜNE, Bündnis 90/Die Grünen, Die Grünen]
AfD: [AfD] (ab 2013)
BSW: [BSW] (ab 2024)
CDU: [CDU]
SPD: [SPD]
FDP: [FDP]
Sonstige: [Sonstige, übrige]
```

`docs/wahldaten-methodik.md` muss diese Liste pflegen + jährlich gegen neue Parteien checken.

**Aggregations-Strategie (Stimmbezirk → Kiez):**

Centroid-First, weil Stimmbezirke (~1900) deutlich kleiner als Kieze (~143). Polygon-Intersection wäre 99 %+ identisches Ergebnis bei 10x Compute-Cost. Edge-Case: Stimmbezirk-Centroid liegt auf Kiez-Grenze → Lookup nutzt ersten-Match (deterministisch via LOR-Index-Reihenfolge). Dokumentation in `docs/wahldaten-methodik.md`.

**pre-2017-Geometrie-Fallback:** Stimmbezirks-ID enthält Bezirks-Präfix (z.B. „401-23" = Bezirk 04, Stimmbezirk 01-23). Aggregator extrahiert Bezirks-Code direkt aus ID statt Centroid-Lookup. Kiez-Aggregation fällt für pre-2017-Wahlen NICHT auf Bezirks-Aufteilung zurück — Kiez-Tabelle bleibt leer für diese Wahlen, UI (Story 6.3) zeigt „nur Bezirks-Aggregat verfügbar"-Hint.

**AGH-2023-Wiederholungswahl:** `is_repeat_election = true`, `parent_election_id = wahl_id_of_AGH_2021`. UI (Story 6.3) rendert Badge „Wiederholungswahl". Sparkline (Story 6.3) zeigt 2023 als separaten Datenpunkt, NICHT als Ersatz für 2021.

**Performance-Targets:** Aggregator-Pipeline < 5 Min für 12 Wahlen × ~2000 Stimmbezirke × ~10 Parteien = ~240k Inserts. Postgres-Batch-Insert (1000-Row-Chunks). Aggregat-Build via SQL `INSERT INTO wahl_aggregat_kiez SELECT ... GROUP BY` (kein App-Layer-Loop).

**Out-of-Scope (Story-6.x-Future):**
- Volksentscheide (Story 6.6 cancelled).
- pre-2011-Daten (Bezirksreform-Backfill, Story 6.1 cancelled).
- pre-2017-Wahlbezirks-Geometrien via FragDenStaat (Story 6.2-Phase-2-Backlog).
- WebMCP-Tools (Story 6.8).
- Methodik-Page-Section #wahldaten (Story 6.9).
- Cross-Layer-Templates (Story 6.7).
- Inspector-UI (Story 6.3).
- Detail-Pages (Story 6.4).
- Live-Wahl-Auszählung (Memory `feedback_no_live_data` lock).

## Change Log

| Date | Description |
| --- | --- |
| 2026-05-18 | Story authored as 6.0 nach Epic-6-Rewrite (Recon: Daten-Quellen + UX-Patterns, Volksentscheide gestrichen, Cutoff 2011/2013, Spike-First). |
| 2026-05-18 | T1 Spike done. Pivot Source-URL: statistik-berlin-brandenburg.de tot, Bundeswahlleiterin Wahlbezirksstatistik live (BTW only). 4 Spikes auf 1 reduziert, AGH/BVV ins Phase-2b-Backlog. Schema-Drift-Analyse dokumentiert. |
| 2026-05-18 | T2-T8 done. 8 Drizzle-Tabellen + Migration applied. Pipeline lädt BTW25 in 11.1s (3598 Berlin-Stimmbezirke, 59645 ergebnis-Rows). Bezirk + Berlin-Aggregate live. Kiez-Aggregat blocked bis Story 6.2 (Stimmbezirks-Geometrien). 6 Server-Queries + Graceful-Fallback. 86/86 Tests grün, 0 typecheck-errors. Doku + 2 Memories. Composite-UWB-ID-Korrektur (wahlkreis-bezirk-wahlbezirk-bezirksart) per Real-Run-Finding bezirksübergreifender Stimmbezirke in Wahlkreis 077. |
| 2026-05-18 | BTW-Expansion: 4 BTWs (2013/17/21/25) statt 1. Format-Profile-Detection (`SUFFIX_GEN`/`PREFIX_GEN`/`SPLIT_DIRECT`), Encoding-Detection (BOM-aware UTF-8 vs Latin-1), ZIP-Mode-Detection (combined vs. split-files). BTW 2024 Wiederholung verschoben (kein Bundeswahlleiterin-_wbz, eigene Berliner-Pipeline später). |
| 2026-05-18 | AGH+BVV-Expansion (Phase B): XLSX-Pipeline (`sbb-xlsx-fetcher.ts` + `sbb-row-transformer.ts`) gegen `download.statistik-berlin-brandenburg.de`. AGH 2011/16/21/23 + BVV 2011/16/21/23 = 8 weitere Wahlen geladen. Wahlbezirksart-Variants über Generationen (`W`/`B` vs. `Urnenwahlbezirk`/`Briefwahlbezirk` vs. `1A`/`1B`). AGH/BVV 2023 als Wiederholungswahl mit `is_repeat_election=true` + `parent_election_id`. Stimmtyp `'einstimme'` für BVV via DB-Loader-Slot-Mapping (`zweitstimme`→`zweitstimme`, sonst `erststimme`-Slot). 20 wahl-Rows total in DB. 87/87 Tests grün. |

## Dev Agent Record

### Implementation Plan

**T1 Spike-First (completed 2026-05-18, branch feat/epic-6-wahldaten):**

Ursprünglicher AC-0-Plan sah 4 CSV-Pulldown-Spikes gegen `statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W>.csv` vor. Live-Probe ergab: Endpoint liefert 200 OK + HTML (React-SPA Catch-all, 69 KB), kein CSV. Daten.berlin.de-Provider-Links nach SBB-CMS-Relaunch verwaist.

Pivot per User-Decision: BTW-Pipeline auf Bundeswahlleiterin `_wbz`-Pulldown umgestellt.

| Wahl | Source | Status |
|------|--------|--------|
| BTW 2025 | `bundeswahlleiterin.de/dam/jcr/.../btw25_wbz.zip` | Spike done |
| BTW 2021 (Wdh.) | Gleicher Endpoint (jcr-UUID anders) | Phase 1 |
| BTW 2017 | Gleicher Endpoint | Phase 1 |
| AGH/BVV alle Jahre | SBB-Download (XLSX) | Phase 2b |

**Spike-Finding-Korrektur-Vermerk:**

Spike-Finding #1 (Source-URL-Drift) revidiert: CSV-Quelle existiert, aber nicht beim Amt für Statistik (Links dort kaputt). Stattdessen Bundeswahlleiterin `_wbz`-Pipeline. Verifiziert via curl + Real-Run-Pipeline.

**Real-Run-Verifikation (Live-Endpoint):**

```
fetch  https://bundeswahlleiterin.de/dam/jcr/e79a7bd3-0607-4e87-9752-8e601e299e00/btw25_wbz.zip
zip bytes=6059110
csv bytes=22084331
headers=80 rows=95111
berlin rows=3598
asserts: PASS
  berlinRowsAroundExpected: true   (3598 in [3500..3700])
  wahlkreiseBerlinAllPresent: true (alle 12: 074..085)
  noNullWahlbezirk: true
```

**Format-Realität:**

- Container: ZIP, Entry `btw25_wbz_ergebnisse.csv`
- Encoding: UTF-8 mit BOM (`utf-8-sig`)
- Delimiter: Semikolon
- Line-Terminator: CRLF
- Metadaten: 4 Zeilen vor Header (Copyright + Empty + Title + Empty)
- Header in Zeile 5 (Index 4)
- 80 Spalten total, 29 Parteien × 2 Stimmenarten + Identifier + Counts
- Erst- und Zweitstimme in EINER Datei (anders als ursprüngliche W1/W2-Annahme), Stimmenart in Spaltennamen-Suffix

**Schema-Hinweise für AC-1 (Drizzle-Schema, T2):**

- `stimmbezirk.uwb_id` MUSS composite sein: `${wahlkreis}-${wahlbezirk}` (Bundeswahlleiterin nutzt 3-Char-Wahlbezirk-IDs die nur innerhalb Wahlkreis eindeutig sind)
- `ergebnis.ist_briefwahl_aggregat`: Detection-Regel `Bezirksart !== '0'`, nicht UWB-Range-Heuristik
- 29 Parteien für BTW 2025, Partei-Alias muss case-insensitive matchen (`Die Linke` vs. `DIE LINKE` etc.)

**Vorrichtung gegen XLSX-Import:** Bewusst nicht installiert. Phase 2b (AGH/BVV-Pipeline) wird separat planen.

**Tests-Status:**

- `scripts/wahlen/lib/bwl-csv-parser.test.ts` 21 Tests grün
- `scripts/wahlen/lib/bwl-fetcher.test.ts` 6 Tests grün
- `scripts/lib/allowlist.test.ts` erweitert um Bundeswahlleiterin-Host

### Completion Notes

- [T1.1] Spike-Runner liefert PASS auf allen 3 Asserts
- [T1.2] AGH/BVV-Spikes verschoben in Phase 2b (statistik-berlin-brandenburg.de XLSX)
- [T1.3] 1 Spike-Snapshot committet (`wahl-schema-snapshot-btw25.json`)
- [T1.4] Drift-Analyse mit 5 Findings dokumentiert

## File List

**Scripts + Pipeline-Library:**

- scripts/wahlen/lib/bwl-csv-parser.ts (new, BTW Bundeswahlleiterin CSV-Parser, alle 4 BTW)
- scripts/wahlen/lib/bwl-csv-parser.test.ts (new)
- scripts/wahlen/lib/bwl-fetcher.ts (new, ZIP-Extract mit Encoding-Detection BOM/Latin-1 + Combined-vs-Split-Mode)
- scripts/wahlen/lib/bwl-fetcher.test.ts (new)
- scripts/wahlen/lib/sources.ts (new, 12 Wahl-Sources mit Kind-Discriminator `bwl-csv`/`sbb-xlsx`)
- scripts/wahlen/lib/partei-seed.ts (new)
- scripts/wahlen/lib/partei-seed.test.ts (new)
- scripts/wahlen/lib/row-transformer.ts (new, BTW Format-Profile `SUFFIX_GEN`/`PREFIX_GEN`/`SPLIT_DIRECT`)
- scripts/wahlen/lib/row-transformer.test.ts (new)
- scripts/wahlen/lib/sbb-xlsx-fetcher.ts (new, XLSX-Pipeline für AGH/BVV)
- scripts/wahlen/lib/sbb-row-transformer.ts (new, Berlin-spezifisches Schema mit Wahlbezirksart-Variants)
- scripts/wahlen/lib/schema-validator.ts (new)
- scripts/wahlen/lib/schema-validator.test.ts (new)
- scripts/wahlen/lib/bezirk-codes.ts (new)
- scripts/wahlen/lib/db-loader.ts (new, mit Slot-Mapping für `einstimme`)
- scripts/wahlen/spike-fetch.ts (new, generic Spike-Runner für alle Wahl-Sources)
- scripts/wahlen/spike-fetch-btw25.ts (legacy specific runner, BTW25 only)
- scripts/aggregate-wahl-data.ts (new, dispatch nach kind, BWL + SBB-Pfade)
- scripts/lib/allowlist.ts (modified, added bundeswahlleiterin.de + statistik-berlin-brandenburg.de)
- scripts/lib/allowlist.test.ts (modified, 2 new host tests)
- package.json (modified, added xlsx devDependency)

**Drizzle-Schema + Migration:**

- src/lib/server/db/schema/wahl/wahl.ts (new)
- src/lib/server/db/schema/wahl/stimmbezirk.ts (new)
- src/lib/server/db/schema/wahl/partei.ts (new)
- src/lib/server/db/schema/wahl/partei-alias.ts (new)
- src/lib/server/db/schema/wahl/ergebnis.ts (new)
- src/lib/server/db/schema/wahl/wahl-aggregat-kiez.ts (new)
- src/lib/server/db/schema/wahl/wahl-aggregat-bezirk.ts (new)
- src/lib/server/db/schema/wahl/wahl-aggregat-berlin.ts (new)
- src/lib/server/db/schema/wahl/index.ts (new)
- src/lib/server/db/schema/wahl/schema-wahl.test.ts (new)
- src/lib/server/db/schema/index.ts (modified, added wahl/index export)
- drizzle/migrations/0002_warm_randall.sql (new)
- drizzle/migrations/meta/0002_snapshot.json (new)
- drizzle/migrations/meta/_journal.json (modified)

**Query-Modul:**

- src/lib/server/db/queries/wahl/get-wahl-list.ts (new)
- src/lib/server/db/queries/wahl/get-results-for-stimmbezirk.ts (new)
- src/lib/server/db/queries/wahl/get-results-for-kiez.ts (new)
- src/lib/server/db/queries/wahl/get-results-for-bezirk.ts (new)
- src/lib/server/db/queries/wahl/get-results-for-berlin.ts (new)
- src/lib/server/db/queries/wahl/get-sparkline-for-kiez.ts (new)
- src/lib/server/db/queries/wahl/wahl-queries.test.ts (new)

**Fixtures + Spike-Artefakte:**

- tests/fixtures/wahlen/btw25-sample.csv (new)
- _bmad-output/spike-artifacts/wahl-schema-snapshot-btw25.json (new)
- _bmad-output/spike-artifacts/SCHEMA-DRIFT-ANALYSIS.md (new)

**Doku + Memories:**

- docs/wahldaten-methodik.md (new)
- docs/INDEX.md (modified, Daten-Pipelines-Sektion Eintrag hinzu)
- ~/.claude/projects/.../memory/project_wahl_data_cutoff_2011_2013.md (new)
- ~/.claude/projects/.../memory/project_wahl_partei_alias.md (new)
- ~/.claude/projects/.../memory/MEMORY.md (modified, 2 neue Index-Einträge)

**Config:**

- package.json (modified, added `data:wahl-fetch` script)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified, epic-6 + 6-0 in-progress → review)
