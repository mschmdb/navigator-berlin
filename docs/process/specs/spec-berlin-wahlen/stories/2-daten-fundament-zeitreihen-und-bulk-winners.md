---
title: 'Daten-Fundament Zeitreihen und Bulk-Winners'
type: 'feature'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '56ca8a685855d020d239b73745ed7fb0b25da340'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Portal /berlin-wahlen braucht Analytik-Daten, die heute fehlen: Zeitreihen pro Gebiet und Wahl-Reihe (heute nur Kiez-Sparkline, eine Query pro Kombi), Winner über alle Jahre in einem Zugriff (Zeit-Animation), Wechsel/Trend/Volatilität und die Zwilling-Ähnlichkeit.

**Approach:** Neue Queries und vier API-Endpoints nach Bestandsmuster; Wechsel/Trend/Volatilität als Build-Zeit-Aggregat (ADR-013: neue Tabellen per Drizzle-Migration, Script mit pure Rechenkern, Gate-Anbindung); Zwilling als Runtime-Berechnung über den vorhandenen Bulk (`get-kiez-shares-for-wahl`). Jede neue Response führt `license` + `source_url`.

## Boundaries & Constraints

**Always:**
- Query-Konvention: erste Zeile `if (!process.env.DATABASE_URL) return []`; Routen bleiben DB-los 200 mit leerem Body-Teil.
- ADR-013: Analytik wird zur Build-Zeit berechnet; der Rechenkern ist eine exportierte pure Function mit Unit-Tests gegen Fixture-Reihen; Runtime liest nur.
- Neue Tabellen ausschließlich via `schema/wahl/*.ts` + Barrel + `pnpm db:generate` (Migration 0008); Scripts machen nur DELETE/INSERT.
- Neues Build-Script hängt in der prebuild-Kette hinter `data:wahl-kiez` UND bekommt eine Schwelle in `scripts/check-wahl-data.ts`, sonst überspringt das Gate es.
- `sourceName()` wird geteilter Helper (heute 2x dupliziert); jede neue Response führt `license` + `source_url` aus der `wahl`-Tabelle.
- Zeitreihen-Antworten führen `is_repeat_election` + `parent_slug` pro Punkt.
- Wiederholungswahl 2023: Zeitreihen liefern 2021 UND 2023 (geflaggt); die Analytik (Wechsel/Trend/Volatilität) nutzt pro Legislatur den letztgültigen Stand, 2023 ersetzt 2021, und 2021→2023 zählt nie als Wechsel.
- TDD (ADR-012); Dateien unter 500 Zeilen; kein Push/Deploy, keine Prod-DB-Läufe (Freeze bis 22.09. 02:00 CEST).

**Never:**
- Keine UI-Änderungen; keine Änderung bestehender Response-Shapes oder Query-Signaturen.
- Kein Window-übergreifendes Raw-SQL, wo der Drizzle-Builder reicht; Raw-SQL nur nach dem `DISTINCT ON`-Vorbild.
- Keine Sitz-/Koalitionsberechnung; keine vorläufigen Ergebnisse.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Zeitreihe | `typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=<slug>` | Punkte je Jahr×Partei: `{jahr, partei, anteil, stimmen, is_repeat_election, parent_slug}` | unbekanntes Gebiet → 404 (nur wenn DB Daten hat) |
| Bulk-Winners | `typ=agh&stimmtyp=...&ebene=kiez` | pro Jahr pro Gebiet: stärkste Partei + Anteil (ein Response für die Animation) | ungültiger `typ` → 400 (valibot) |
| Analytik | `ebene=kiez&typ=agh&stimmtyp=...` | pro Gebiet: `wechsel_count`, `wechsel_jahre`, `volatilitaet`, Trends je Partei (`slope`) | DB-los → 200, leere Liste |
| Zwilling | `kiez=<slug>&typ=btw` | Top-N ähnlichste Kieze `{kiez_slug, score 0..100}` + Metrik-Name | Kiez ohne Daten → leere Liste + Hinweis-Feld |
| Kiez-Ebene vor 2016 | `ebene=kiez`, Reihe enthält 2011/2013 | Punkte fehlen für Jahre ohne Kiez-Aggregat; Antwort nennt `coverage_ab` | N/A |
| DB-los | `DATABASE_URL` fehlt | 200, leere Arrays, keine 5xx | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/server/db/queries/wahl/get-sparkline-for-kiez.ts` -- 3-Schritt-Muster (jüngste Wahl → Top-N → Zeitreihe via `inArray`); Vorlage für `get-series-for-gebiet.ts`; ignoriert heute `isRepeatElection` (L26, L60).
- `src/lib/server/db/queries/wahl/get-stimmbezirks-winners.ts:23-53` -- Raw-SQL `DISTINCT ON` + snake→camel-Mapper; Vorlage für `get-winners-bulk.ts` mit `DISTINCT ON (wahl_id, kiez_slug)` über `wahl_aggregat_kiez` (Bezirk analog).
- `src/lib/server/db/queries/wahl/get-kiez-shares-for-wahl.ts` -- Bulk 143×Parteien einer Wahl; Basis der Zwilling-Berechnung.
- `src/lib/server/db/queries/wahl/wahl-queries.test.ts:16-53` -- Fallback-Block (DATABASE_URL löschen) + defensiver Snapshot-Block; neue Queries dort eintragen.
- `src/routes/api/wahl/kiez-shares/+server.ts` + `server.test.ts` -- Routen-Vorlage: valibot `safeParse` → 400, DB-los 200, `cache-control: public, max-age=3600`, Election-Slug-Auflösung mit 404-nur-bei-Daten.
- `src/routes/api/wahl/list/+server.ts:10-14,30-32` -- `sourceName()`-Ableitung + license/source_url; Helper extrahieren nach `src/lib/server/wahl/source-label.ts` (zweiter Duplikat-Ort: `(with-header)/wahl/[slug]/+page.server.ts:152-154,172-174`).
- `scripts/build-wahl-kiez-aggregat.ts:79-118` -- Aggregat-Script-Vorlage: Delete-per-Key + INSERT…SELECT, Verifikations-Count, `--only=`-Flag; Vorbild für `scripts/build-wahl-analytik.ts`.
- `scripts/check-wahl-data.ts:22-24` -- Gate-Schwellen; neue Schwelle „Analytik-Rows vorhanden" ergänzen.
- `src/lib/server/db/schema/wahl/` + `index.ts`-Barrel -- neue Tabellen `wahl_analytik_kiez` (kiez_slug, typ, stimmtyp, wechsel_count, wechsel_jahre jsonb, volatilitaet, computed_at; PK kiez+typ+stimmtyp) und `wahl_trend_kiez` (…, partei_id, slope; PK +partei_id); Bezirk-Varianten analog nur falls billig, sonst Ebene-Spalte.
- `package.json` prebuild-`||`-Bundle -- `data:wahl-analytik` hinter `data:wahl-kiez` einhängen.
- `docs/wahldaten-methodik.md` -- neuen Abschnitt Analytik-Methoden (Wechsel-Definition, Trend = lineare Regression der Anteile über Jahre, Volatilität = mittlere L1-Distanz aufeinanderfolgender Anteils-Vektoren, Zwilling = 1 − normierte L1-Distanz der Anteils-Vektoren der jüngsten Wahl der Reihe).
- Nicht anfassen: bestehende Queries/Routen-Shapes, `wahl_aggregat_*`-Tabellen, WebMCP (Tools kommen in Story 9).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/server/wahl/analytik.ts` + `.test.ts` -- pure Rechenkern zuerst (computeWechsel, computeTrendSlope, computeVolatilitaet, computeSimilarity) gegen Fixture-Reihen, rot vor Implementierung -- Kern testbar ohne DB
- [x] `src/lib/server/db/schema/wahl/wahl-analytik-kiez.ts`, `wahl-trend-kiez.ts` + Barrel + Migration 0008 (`pnpm db:generate`) -- Tabellen
- [x] `scripts/build-wahl-analytik.ts` -- Aggregat-Script nach Vorlage (nutzt Rechenkern, Delete+Insert, `--only=`), prebuild + Gate-Schwelle -- läuft idempotent
- [x] `src/lib/server/wahl/source-label.ts` -- `sourceName()` extrahieren, beide Duplikate ersetzen -- eine Quelle
- [x] `src/lib/server/db/queries/wahl/get-series-for-gebiet.ts`, `get-winners-bulk.ts`, Erweiterung `wahl-queries.test.ts` -- neue Queries mit Fallback-Tests (plus `get-analytik-for-reihe.ts`, nicht in der ursprünglichen Liste, aber nötig für die analytik-Route nach Query-Konvention)
- [x] `src/routes/api/wahl/series/+server.ts`, `winners/+server.ts`, `analytik/+server.ts`, `similar-kieze/+server.ts` + je `server.test.ts` -- vier Routen nach kiez-shares-Vorlage inkl. license/source_url
- [x] `docs/wahldaten-methodik.md` -- Analytik-Abschnitt -- Methodik-Pflicht (CAP-12)

**Acceptance Criteria:**
- Given eine Fixture-Reihe mit bekanntem Wechsel/Trend/Volatilität, when der Rechenkern läuft, then exakt die erwarteten Werte (inkl. Wiederholungswahl-Regel aus den Constraints).
- Given `DATABASE_URL` fehlt, when alle vier Routen aufgerufen werden, then 200 mit leeren Listen, nie 5xx.
- Given lokales Postgres mit Bestandsdaten, when `tsx scripts/build-wahl-analytik.ts` zweimal läuft, then identische Row-Counts (Idempotenz), und `/api/wahl/analytik` liefert Rows mit `license` + `source_url`.
- Given `pnpm vitest run --project server` + `pnpm check`, then grün / 0 Errors.

## Implementation Notes

- **Scope-Entscheidung Bezirk vs. Kiez:** `get-series-for-gebiet.ts` und `get-winners-bulk.ts` unterstützen `ebene=kiez|bezirk` (Code-Map: „Bezirk analog", Tabellen `wahl_aggregat_kiez`/`wahl_aggregat_bezirk` existieren bereits). `wahl_analytik_kiez`/`wahl_trend_kiez` und die `analytik`/`similar-kieze`-Routen bleiben Phase-1 Kiez-only (Tabellen-/Task-Namen im Spec sind literal `*-kiez`; Bezirk-Analytik wäre über eine `ebene`-Spalte günstig nachrüstbar, siehe Code-Map „nur falls billig, sonst Ebene-Spalte" -- nicht gebaut, dokumentiert in `docs/wahldaten-methodik.md`). Die `analytik`-Route validiert `ebene` deshalb als `v.literal('kiez')`.
- **Zusätzliche Query-Datei:** `get-analytik-for-reihe.ts` (nicht explizit in Task-Liste genannt) wurde ergänzt, weil die Query-Konvention (`if (!DATABASE_URL) return []`, Datenzugriff nur über `db/queries/wahl/*`) sonst für die `analytik`-Route gebrochen worden wäre.
- **`similar-kieze` ohne `stimmtyp`-Parameter:** Matrix nennt nur `kiez` + `typ`. Route nutzt implizit `zweitstimme` (BVV: `einstimme`) der jüngsten Wahl dieses Typs, analog zum Default in `get-sparkline-for-kiez.ts`.
- **Bug gefunden, nicht gefixt (außerhalb Scope):** `wahl.parent_election_id` für AGH/BVV 2023 (Wiederholungswahl) zeigt für beide Stimmtypen auf dieselbe Eltern-Wahl-ID (AGH 2023 zweitstimme → parent = AGH 2021 **erststimme**, id 12, statt AGH 2021 zweitstimme, id 13). Vorhandener Pipeline-Bug (`scripts/wahlen/...`), betrifft auch die bestehende `[slug]/+page.server.ts`-Wiederholungswahl-Anzeige. `parent_slug` in den neuen `/series`- und `/winners`-Responses erbt diesen Fehler unverändert. Nicht gefixt, da außerhalb der Tasks-Liste dieser Story und Daten-Pipeline-Code laut Freeze/Boundaries nicht angefasst werden sollte.

Nach dem Review (Triage-Log unten) sechs Patches angewendet: deterministische
Gleichstands-Aufloesung (winningPartei alphabetisch + Test, winners-bulk ORDER BY
kurzname, similar-kieze localeCompare + Test), Transaktion um Delete+Insert im
Build-Script, Guard gegen unbekannte --only-Werte, zwei Em-Dashes ersetzt,
Methodik-Satz zur ebene-Inkonsistenz der Analytik-API. Zusaetzlich beim
Matrix-Audit: defensiver With-DB-Test fuer /series (Punkte, coverage_ab, 404).

## Spec Change Log

## Review Triage Log

| # | Layer | Finding | Verdict | Evidenz / Route |
|---|-------|---------|---------|-----------------|
| 1 | blind+edge | `--only=<typo>` filtert still zu leerer Liste, Script endet mit Exit 0 ohne Arbeit | medium | Verifiziert in build-wahl-analytik.ts parseArgs/main. → **patch** (Guard, Exit 1) |
| 2 | blind+edge | Delete+Insert pro Reihe ohne Transaktion; Absturz hinterlässt leere/halbe Reihe, Gate prüft nur Gesamtzahl | medium | Verifiziert. → **patch** (`db.transaction`) |
| 3 | blind+edge (3 Findings) | `winningPartei` löst Anteils-Gleichstand per Map-Iterationsreihenfolge, Wechsel-Ergebnis nicht deterministisch | medium | Verifiziert: `anteil > bestAnteil`, Input-Reihenfolge aus unsortierter DB-Query. → **patch** (Tie-Break per Kurzname + Test); damit ist das ORDER-BY-Feed-Finding mit erledigt |
| 4 | edge | `DISTINCT ON` in get-winners-bulk ohne Tie-Break, Gleichstand wählt arbiträr | medium | Verifiziert. → **patch** (ORDER BY … anteil DESC, kurzname) |
| 5 | edge | similar-kieze-Sort ohne Tie-Break am Top-N-Rand | low | Verifiziert. → **patch** (localeCompare) |
| 6 | blind | Em-Dashes in 2 neuen Kommentaren (analytik-, similar-kieze-Route) | low | Grep bestätigt genau 2 Stellen; Projekt-Regel. → **patch** |
| 7 | blind | /analytik akzeptiert nur `ebene=kiez`, Inkonsistenz zu series/winners nicht als API-Eigenschaft dokumentiert | low | Route-Docblock nennt es, Methodik nur indirekt. → **patch** (ein Satz in Methodik) |
| 8 | blind | Migrations-Journal/Snapshot fehlen im Diff | false | Artefakt der Review-Diff-Exklusion (`drizzle/migrations/meta` bewusst ausgenommen); Dateien liegen im Tree und werden committet. |
| 9 | blind | `IN ${wahlIds}` raw-Interpolation expandiere evtl. nicht | false | Live-Smoke lieferte 426 Rows über 3 Wahlen, Query-Test mit Daten grün; drizzle expandiert Array-Params im sql-Template. |
| 10 | edge | Repeat-Wahl ohne Parent-Punkt wird als eigene Legislatur angehängt | false | Genau das ist die korrekte Semantik: ohne Parent-Datenpunkt existiert kein 2021→2023-Übergang, der falsch zählen könnte; der Append ist der Legislatur-Standin. |
| 11 | blind | seriesFromKiez/Bezirk ~30 Zeilen dupliziert | low, rejected | Architecture-MUST-Regel 5 (keine Premature-Abstraction); drizzle-Tabellen-Parametrisierung kostet Typ-Komplexität bei zwei Stellen. |
| 12 | edge | Kette Wiederholung-einer-Wiederholung merged falsch | low, rejected | Mit Bestands- und absehbaren Daten unerreichbar; eine künftige Wiederholung referenzierte die letzte Wahl (findbar). |
| 13 | edge | Gebiet mit Historie aber ohne Daten in jüngster Wahl → leere Serie/404 | low, rejected | Alle 143 BZR/12 Bezirke sind in jeder aggregierten Wahl vorhanden (Centroid-Mapping auf stabile LOR); Verhalten identisch zur bestehenden Sparkline. |
| 14 | verification-gap | 3 weitere sourceName-Duplikate (WebMCP get-election-result, llms data-collector, llm-export-builder) | medium (pre-existing) | Layer-eigene Disposition: defer. → **defer** |
| 15 | blind (2 Findings) | Defensive DB-Tests no-open ohne Seed; Script-Verdrahtung ungetestet | medium (pre-existing) | Haus-Muster seit wahl-queries.test.ts; Strategie-Änderung außerhalb des Intents. → **defer** |
| 16 | verification-gap | Erster Deploy nach Merge triggert vollen Wahl-Refetch (Analytik-Tabelle leer, Gate schlägt an) | low, akzeptiert | Fail-safe und gewollt: Der erste Deploy nach Freeze-Ende fällt ohnehin mit dem 2026-Ingest (WAHL_REFRESH) zusammen. |

## Design Notes

Zeit-Animation läuft auf Kiez/Bezirk (stabile LOR-Geometrie über alle Jahre); Stimmbezirks-Zuschnitte wechseln zwischen Wahljahren und taugen nicht als Animations-Basis, dort bleibt der bestehende per-Wahl-Winner-Load. Zwilling braucht keine Tabelle: 143 Vektoren pro Request sind billig und die Route cached 3600 s.

## Verification

**Commands:**
- `pnpm vitest run --project server` -- expected: grün inkl. neuer Rechenkern-, Query- und Routen-Tests
- `pnpm check` -- expected: 0 Errors
- `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Errors, keine neuen Warnings
- `tsx scripts/build-wahl-analytik.ts && tsx scripts/build-wahl-analytik.ts` (lokal, mit DB) -- expected: zweiter Lauf ändert Row-Counts nicht
