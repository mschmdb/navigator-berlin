---
status: Accepted
date: 2026-05-16
deciders: solo-maintainer
---

# ADR-002: WebMCP-Adapter-Schicht + Spec-Version-Pin

## Context

navigator.berlin will LLM-Agents (Claude-Browser-Extension, ChatGPT-Plugins, andere W3C-Web-Model-Context-Konsumenten) per WebMCP-Standard erlauben, strukturierte JSON-Antworten mit Quellen-Attribution direkt im Browser-Kontext abzurufen, ohne dass eine separate Public-API betrieben werden muss (PRD FR37 bis FR40, Architecture-Doc Z. 281 bis 285).

Der WebMCP-Standard ist zum Implementierungszeitpunkt Pre-1.0:

- Native `navigator.modelContext`-API wurde in Chrome 146+ als experimentelle Implementierung gepatcht.
- Adoption der nativen API ist gering.
- Spec-Repo `MiguelsPizza/WebMCP` ist in Bewegung. Breaking-Changes sind angekündigt (z. B. wurde `provideContext` am 5. März 2026 aus der upstream-Spec entfernt, `unregisterTool` am 23. April 2026).
- Polyfill-Ökosystem ist konsolidiert um `@mcp-b/global` (aktive Maintenance, 2.3.x publiziert Mai 2026).

Damit entsteht ein Adoption-Dilemma: nicht-implementieren bedeutet, das FR37-Versprechen nicht einzulösen. Naiv gegen die native API zu coden bedeutet, jeder Spec-Breaking-Change zerreißt die Tool-Implementierungen.

## Decision

navigator.berlin implementiert eine eigene Adapter-Schicht unter `src/lib/webmcp/`, die zwischen der WebMCP-Surface und den Tool-Implementierungen vermittelt. Die Schicht hat folgende Pflichten:

1. **Feature-Detection vor Polyfill-Load.** `'modelContext' in navigator` wird zuerst geprüft. Nur wenn die native API fehlt, wird `@mcp-b/global` per Dynamic-Import nachgeladen.
2. **Spec-Version-Pin.** Eine Konstante `WEBMCP_SPEC_VERSION` (aktuell `0.3.0`) wird in `internal/spec-version.ts` gepflegt und im `webmcp-manifest.json` als `spec_version`-Feld ausgegeben. Kompatible Agenten können daran ihre Erwartungen ausrichten.
3. **Tool-Code bleibt Polyfill-agnostisch.** Tool-Module (`tools/*.ts`) kennen die WebMCP-API nicht. Sie liefern eine framework-neutrale `WebMcpToolDefinition` mit `name`, `description`, JSON-Schemas und `handler`. Erst der Adapter wandelt das in das jeweils geforderte API-Format.
4. **Daten-Boundary.** Tool-Module + Adapter halten KEINE Runtime-Imports auf `$lib/data/`. Stattdessen wird Dependency-Injection genutzt (`WebMcpServerConfig`). Der Wiring-Point ist `mount.ts` als Composition-Root. Damit gilt die Architecture-Boundary `webmcp/ ↛ data/` (architecture.md Z. 1463) für die fachliche Schicht. Erst die Mount-Schicht (Composition-Root) verbindet beide Welten.
5. **Snake-Case an der Boundary.** Tool-Namen und Param-Keys folgen der WebMCP-Spec-Konvention `snake_case`. TypeScript-intern bleibt camelCase. Mapping passiert in `internal/case-mapper.ts` und in den Tool-Serializern (one-shot pro Tool).
6. **Manifest-Doppel-Serving.** Statisches `static/webmcp-manifest.json` (Build-Output) und prerendered Endpoint `/webmcp-manifest.json` (SvelteKit-Route) liefern beide das gleiche JSON. Discovery via beide Pfade möglich.
7. **Locale-Default via Paraglide.** Tools ohne expliziten `locale`-Param greifen auf `getLocale()` zurück (Memory `project_paraglide_reroute`). Kein hard-gecodetes `'de'`.
8. **No-Cookie.** Adapter setzt keine Cookies, Resources sind read-only (MUST-Rule #10 aus architecture.md).

Die `webmcp@0.0.1`-Stub-Dependency (Empty-Package) wird aus `package.json` entfernt. Ersatz: `@mcp-b/global@2.3.2` als production-dependency.

## Consequences

### Positiv

- **Breaking-Change-Isolation.** Bei einem Spec-Breaking-Change muss nur `adapter.ts` plus `WEBMCP_SPEC_VERSION` angepasst werden. Tool-Logik, Manifest-Builder und Tests bleiben stabil.
- **Tool-Wiederverwendbarkeit.** Die `WebMcpToolDefinition` ist framework-neutral. Theoretisch nutzbar für REST-API-Surface (späteres Out-of-Scope).
- **Daten-Boundary intakt.** Architecture-Rule `webmcp/ ↛ data/` wird durch reine Dependency-Injection im Adapter sichergestellt. Mount-Layer als Composition-Root ist explizit erlaubt (analog `+layout.svelte`).
- **Manifest deterministisch + testbar.** `buildWebMcpManifest()` ist Pure-Function. Tests prüfen Schema-Vollständigkeit, snake-case-Konvention, fehlende em-dashes, fehlende „lebenswert"-Vokabel.
- **Provenance per Default.** Alle Tool-Outputs reichen `source`, `updated_at`, `license` durch (FR40). LLM-Zitation ist nicht optional.
- **No-US-Drittanbieter im Runtime-Pfad.** `@mcp-b/global` ist NPM-Package, wird im App-Bundle gehostet. Polyfill ist self-contained, kein Remote-CDN-Call.

### Negativ

- **Manueller Verifikations-Pfad.** Browser-Agent-Integration ist nicht headless E2E-testbar. Manueller Spot-Check via MCP-Inspector-CLI (oder Claude Browser Extension, wenn verfügbar) dokumentiert in `docs/runbooks/webmcp-verify.md`.
- **Spec-Drift-Risiko bleibt.** Pre-1.0-Spec, weitere Breaking-Changes erwartet. Mitigation: Spec-Version-Pin + isolierter Adapter sollten ausreichen, aber Re-Validierung pro Spec-Bump nötig.
- **Doppel-Serving-Overhead.** Manifest existiert als Static-Asset UND als prerendered Endpoint. Geringfügige Dopplung im Build-Output (ca. 6 KB). Akzeptabel.
- **`@mcp-b/global` zieht Sub-Dependencies (Zod-basiertes SDK).** Bundle-Größe der Lazy-Imported-Polyfill: rund 250 KB minified (laut npm). Nur geladen, wenn die native API fehlt (was im Mai 2026 die Mehrheit der Browser betrifft). Bei nativer Verfügbarkeit (Chrome 146+) bleibt der Bundle-Footprint Null.

### Folgekosten

- Bei nächstem WebMCP-Spec-Update: ADR-002 reviewen + ggf. Spec-Version bumpen.
- Tool-Module nicht direkt gegen die native `navigator.modelContext` coden, sondern nur gegen die interne `WebMcpToolDefinition`.
- Wenn der Polyfill langfristig nicht mehr gepflegt wird: Migrationspfad ist „Polyfill durch nativen API-Code ersetzen", was nur den Adapter betrifft.
