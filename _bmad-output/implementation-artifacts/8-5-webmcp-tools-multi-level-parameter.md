# Story 8.5: WebMCP-Tools Multi-Level-Parameter

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a LLM-Agent,
I want alle existierenden WebMCP-Tools um optionalen `level`-Parameter erweitern,
so that „Wie ist die Lärm-Belastung im Kiez X?" mit gleichem Tool funktioniert wie „an Adresse Y".

## Acceptance Criteria

1. **Given** die existierenden WebMCP-Tools (Story 2.7 + Story 6.8), **When** ich pro Tool optional `level: 'address' | 'kiez' | 'bezirk' | 'berlin'` ergänze, **Then** Tools liefern Aggregat-Werte entsprechend ADR-014-Strategie. **And** Backwards-Compatibility: ohne Level-Param ist Default = address.
2. **Given** ein `level`≠address-Aufruf, **When** das Tool antwortet, **Then** es liest die 8.2a-Pre-Aggregate (kein Live-Spatial über große GeoJSONs) und liefert Aggregat-Typ-konforme Felder (Median+Spanne / Klassen-Verteilung / Coverage-% / area-%).
3. **Given** not-aggregatable Layer (Bodenrichtwert) bei level≠address, **When** das Tool antwortet, **Then** strukturierte „not-aggregatable auf diesem Level"-Antwort + Begründung statt Fake-Wert (ADR-014 Backwards-Compat-Matrix).
4. **Given** Schema-Konsistenz, **When** ich den `level`-Param ergänze, **Then** beide Schema-Hälften (Valibot `v.optional(...)` + handgepflegtes JSON-Schema-Mirror) sind synchron erweitert, inkl. Source-Attribution + Caveats in der Antwort.
5. **Given** das WebMCP-Manifest, **When** Tools erweitert sind, **Then** Manifest + Tool-Beschreibungen reflektieren den `level`-Param, Tool-Count/Definitionen-Test ist angepasst.

## Tasks / Subtasks

- [ ] Task 1: Gemeinsames Level-Schema (AC: #1, #4)
  - [ ] In `src/lib/webmcp/internal/schemas.ts` ein `SpatialLevelSchema = v.optional(v.picklist(['address','kiez','bezirk','berlin']))` (Valibot) + JSON-Schema-Mirror-Konstante. Param-Name ist `spatial_level` (User-Decision 2026-05-20): vermeidet Clash mit dem bestehenden Wahl-`level`. Muster: bestehendes `WahlLevelSchema` (Z.~269) + `v.optional(...)` (z.B. `GetElectionResultInputSchema` hat schon `level: v.optional(WahlLevelSchema)`).
  - [ ] `SpatialLevel`-Union aus 8.1 als Quelle der Wahrheit referenzieren (gleiche 4 Werte), Drift vermeiden.
- [ ] Task 2: Spatial-Level-Tools erweitern (AC: #1, #2, #3)
  - [ ] Tools mit räumlichem Bezug bekommen optional `level` + bei Bedarf Kiez/Bezirk-Identifikation:
    - `cross_layer_query` (`tools/cross-layer-query.ts`): bei level≠address Aggregate statt Punkt-Hits.
    - `list_layers_at_point` (`tools/list-layers-at-point.ts`): analog.
    - `get_kiez_profile` (`tools/get-kiez-profile.ts`): Level-aware (ist schon Kiez-bezogen).
    - `get_layer_metadata` (`tools/get-layer-metadata.ts`): Metadaten ggf. level-unabhängig (prüfen, evtl. kein Param nötig).
  - [ ] Level-Auflösung: bei lat/lng + level=kiez/bezirk den enthaltenden Slug via 8.1 `resolve-spatial-level.ts` bestimmen, dann Aggregat aus 8.2a-JSON lesen (`aggregate-layer-for-level.ts` aus 8.2b oder direkter JSON-Reader). Server-/Tool-seitig: WebMCP läuft client-side im Browser, Aggregat-JSON ist statisch fetchbar.
  - [ ] Handler bei level≠address mappen auf ADR-014-Aggregat-Typ-Antwort. not-aggregatable → strukturierte Disclaimer-Antwort (AC #3).
- [ ] Task 3: Election-Tools (Story 6.8) konsistent (AC: #1, #4)
  - [ ] Wahl-Tools haben bereits einen eigenen `level` (Stimmbezirk/Wahlbezirk-Ebene). Der neue Spatial-Param heißt `spatial_level` (User-Decision 2026-05-20), läuft also kollisionsfrei neben dem Wahl-`level`. Prüfen ob `spatial_level` für Wahl-Tools überhaupt sinnvoll ist; falls nicht, Wahl-Tools ohne den Param lassen und im Manifest dokumentieren.
- [ ] Task 4: Manifest + Mount (AC: #5)
  - [ ] `mount.ts`: falls Tools die Aggregat-JSON brauchen, die Lade-Funktion als Dependency injizieren (Pattern: `mountWebMcpServer` injiziert Daten-Provider, Z.~82-102). `.run()`-Pflicht für Remote-Functions im Composition-Root beachten (Memory `project_webmcp_mount_run`).
  - [ ] WebMCP-Manifest (Tool-Beschreibungen) um `level`-Param ergänzen. Tool-Count bleibt gleich (Erweiterung, keine neuen Tools), aber Definitionen ändern sich.
- [ ] Task 5: Tests (TDD, AC-Mapping)
  - [ ] Pro erweitertem Tool: Handler-Test ohne level = heutiges Verhalten (Default address, Backwards-Compat, AC #1), mit level=kiez/bezirk = Aggregat-Antwort, not-aggregatable = Disclaimer-Antwort. Schema-Parse-Test (Valibot akzeptiert/rejected).
  - [ ] Schema-Mirror-Sync-Test: Valibot + JSON-Schema decken denselben level-Param ab (AC #4).
  - [ ] Manifest-/Adapter-Test anpassen (bestehender Test prüft Tool-Definitionen; vgl. 6.8 „Manifest-Test angepasst").
  - [ ] Coverage Tool-Handler ≥90% (API-Boundary, ADR-012). Red-then-Green-History.

## Dev Notes

### Scope + Sequencing

Braucht 8.2a (Pre-Aggregate-JSON) zwingend (AC #2, ADR-014 Story-Mapping: „liest 8.2a-Aggregate"). Braucht 8.1 (`resolve-spatial-level.ts` für Punkt→Slug) und ideal 8.2b (`aggregate-layer-for-level.ts` als gemeinsamer Reader, sonst dupliziert 8.5 den JSON-Zugriff). Empfehlung: 8.5 nach 8.2b, damit der Aggregat-Reader geteilt wird statt zweimal gebaut.

### WebMCP-Bestand (Story 2.7 + 6.8)

- Composition-Root: `src/lib/webmcp/mount.ts` (`mountWebMcpServer`, lazy imports, Daten-Provider-Injection Z.~64-102). `.run()`-Pflicht (Memory `project_webmcp_mount_run`, GH-Issue #7).
- Tool-Interface: `src/lib/webmcp/internal/tool-types.ts` (`WebMcpToolDefinition`: name/description/inputSchema/outputSchema/handler).
- Schemas: `src/lib/webmcp/internal/schemas.ts` — DOPPELT gepflegt: Valibot-Runtime-Schema + handgepflegtes JSON-Schema-Mirror. Beide Hälften synchron erweitern (AC #4).
- Tools-Registry: `src/lib/webmcp/tools/index.ts` (5 Core-Tools) + `tools/wahl/index.ts` (4 Wahl-Tools, Story 6.8). Manifest = 9 Tools.
- Beispiel-Tool `tools/cross-layer-query.ts`: snake_case Boundary-Params (`lat`/`lng`), `v.parse(PointInputSchema, raw)` im Handler, `serializeHit`-Mapping.

### Backwards-Compat (ADR-014 Abschnitt 6, AC #1)

Ohne `level`-Param = exakt heutiges Verhalten (Default address). Bestehende Tool-Tests (22 aus 6.8 + 2.7-Tests) müssen grün bleiben. Der Param ist `v.optional`, kein Breaking-Change am Schema.

### Param-Naming (entschieden)

Wahl-Tools haben bereits `level` (election-Ebene: Bund/AGH/BVV bzw. Stimmbezirk). Der Spatial-Level (address/kiez/bezirk/berlin) ist ein ANDERES Konzept. Der neue Param heißt deshalb `spatial_level` (User-Decision 2026-05-20), nicht `level`. Damit kein Clash, Wahl-`level` bleibt unverändert.

### Aggregat-Antwort-Format

level≠address → Aggregat-Typ-konforme Felder (ADR-014 Abschnitt 2/3). Source-Attribution + Caveats beibehalten (wie 6.8: „Source-Attribution + Caveats"). not-aggregatable → strukturierte Begründung, kein Fake-Wert.

### Project Structure Notes

- Touch: `src/lib/webmcp/internal/schemas.ts` (Level-Schema beide Hälften), `src/lib/webmcp/tools/*.ts` (Spatial-Tools), `mount.ts` (Daten-Provider), WebMCP-Manifest, Manifest-/Adapter-Tests.
- Reuse: 8.1 `resolve-spatial-level.ts`, 8.2b `aggregate-layer-for-level.ts`, 8.2a JSON-Typ `layer-aggregates-types.ts`, bestehendes `v.optional`/`WahlLevelSchema`-Muster.
- Files <500 LOC, kein `any` (Schemas typsafe).

### TDD (ADR-012)

API-Boundary = Test-First-Pflicht ≥90%. Pro Tool: ohne-level (Backwards-Compat) + mit-level + not-aggregatable. Schema-Sync-Test. `pnpm test` grün + `pnpm check` 0 Errors vor review.

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#6-backwards-compatibility]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#story-mapping (8.5)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.5]
- [Source: src/lib/webmcp/mount.ts + internal/tool-types.ts + internal/schemas.ts]
- [Source: src/lib/webmcp/tools/index.ts + tools/wahl/index.ts + tools/cross-layer-query.ts]
- [Source: Story 8.1 (resolve-spatial-level), 8.2a (Aggregat-JSON), 8.2b (aggregate-layer-for-level)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
