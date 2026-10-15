# Story 6.8: WebMCP-Tools für Wahldaten

Status: backlog

<!-- Created 2026-05-18. Blocked by 6-0 (Queries). Volksentscheide-Tool gestrichen (Story 6.6 cancelled). -->

## Story

As a LLM-Agent (Claude-Browser-Extension),
I want WebMCP-Tools um Wahldaten strukturiert abzufragen,
so that ich „Wie wählte Friedrichshain in der BTW 2025?" mit präzisen Daten + Quellen-Attribution beantworten kann.

## Quellen

- **Story 2.7:** WebMCP-Adapter-Foundation.
- **Story 6.0:** 6 Query-Module konsumieren.
- **Memory `project_webmcp_mount_run`:** `.run()`-Pflicht für Remote-Functions im Composition-Root.

## Acceptance Criteria

**AC-1 (4 Tools):**

**Given** der WebMCP-Adapter
**When** ich folgende Tools in `$lib/webmcp/tools/wahl/` ergänze:
- `get_election_result(address, election_slug, level)` → Top-5-Parteien + Wahlbeteiligung + Quelle für den gewählten Level (stimmbezirk/kiez/bezirk/berlin)
- `compare_elections(address, election_slugs[], level)` → Sparkline-Daten für mehrere Wahlen auf demselben Level
- `get_voting_district_geometry(district_id, year)` → GeoJSON für Wahlbezirk (nur 2017+)
- `list_elections()` → alle 12 verfügbaren Wahlen mit Jahr + Typ + Stimmbezirks-Coverage-Flag
**Then** alle Tools haben strict JSON-Schema-Inputs (snake_case-Naming, Englisch-Beschreibungen)
**And** Volksentscheide-Tool ist NICHT enthalten (Story 6.6 cancelled)

**AC-2 (Source-Attribution):**

**Given** Source-Attribution-Pflicht (FR40)
**When** Tool-Output gerendert wird
**Then** jeder Datenwert hat `source` (`statistik-berlin-brandenburg.de` oder `bundeswahlleiterin.de`), `updatedAt` (Wahl-Datum), `license` (`CC-BY`)

**AC-3 (Caveat-Handling):**

**Given** Briefwahl-Asymmetrie
**When** pre-2021-Stimmbezirks-Werte zurückgegeben werden
**Then** Tool-Response enthält `caveats: ["Stimmbezirks-Werte ohne Briefstimmen — Briefwähler nur als Bezirks-Aggregat"]`-Feld

**AC-4 (Pre-2017-Geometry-Error):**

**Given** Phase-1-Limits
**When** Stimmbezirks-Geometrie für pre-2017-Wahl angefragt wird
**Then** Tool antwortet mit `error: "geometry_not_available"` + `available_levels: ["bezirk", "berlin"]`-Hint

**AC-5 (Tests):**

- Schema-Validation pro Tool-Input
- Mock-Response-Tests (Source-Attribution + Caveats)
- Live-Test gegen Real-DB (CI-Integration)

## Tasks/Subtasks

- [ ] T1: 4 Tool-Files unter `$lib/webmcp/tools/wahl/`
- [ ] T2: Mount-Wiring in `mount.ts` (Memory `project_webmcp_mount_run` beachten)
- [ ] T3: Tests pro Tool
- [ ] T4: Manifest-Update via `pnpm webmcp:manifest`
- [ ] T5: WebMCP-Manifest in `/.well-known/webmcp.json` validieren
