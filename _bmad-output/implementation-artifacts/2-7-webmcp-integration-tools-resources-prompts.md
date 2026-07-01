# Story 2.7: WebMCP-Integration mit Tools, Resources, Prompts

Status: ready-for-dev

## Story

As a Claude-Browser-Extension / ChatGPT-Plugin / LLM-Browser-Agent,
I want via WebMCP-Manifest mindestens 5 Tools, URI-adressierbare Resources und Prompt-Templates direkt im Browser-Kontext nutzen zu können,
so that ich strukturierte JSON-Antworten mit Quellen-Attribution abrufen kann, ohne dass navigator.berlin eine separate Public-API betreiben muss.

## Probleme heute

1. Kein WebMCP-Manifest existiert. `static/webmcp-manifest.json` fehlt; `routes/webmcp-manifest.json/+server.ts` ist nicht angelegt. LLM-Browser-Agents können die Site nicht als Tool-Provider erkennen (FR37 ungenutzt).
2. `webmcp`-Package (`webmcp@^0.0.1`) ist in `package.json` deklariert, aber NPM-Paket ist ein Empty-Stub (nur README + package.json, kein Code). Tatsächlicher Polyfill-/Adapter-Pfad ist unklar.
3. Spec-Status WebMCP ist Pre-1.0 mit Bewegung. Native `navigator.modelContext` ist in Chrome 146+ angedeutet, aber Adoption + API-Shape unsicher (Stand 2026-05-15). ADR-002 ist noch im Status `Proposed` und ungefüllt (`docs/adr/ADR-002-webmcp.md` ist Stub mit leeren Sektionen).
4. Tools, Resources und Prompts brauchen klaren Datenpfad ins bestehende `$lib/data/`. Doppelte Datenpfade (eigener WebMCP-Datenpfad) sind per Architektur-MUST nicht erlaubt.
5. FR40 (Quellen-Attribution pro Datenwert) ist auf Inspector-Layer-Hit erfüllt; WebMCP-Output muss diese Provenance auch in JSON-Antworten weiterreichen, sonst ist LLM-Zitation gebrochen.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1250-1286.
- PRD: FR37-FR40 (`prd.md` Zeile 742-745).
- ADR-002-Stub: `docs/adr/ADR-002-webmcp.md` (Status Proposed, leere Sektionen — diese Story füllt sie aus oder ergänzt ADR-013-WebMCP-Adapter falls Scope-Trennung sinnvoll)
- Architecture: Phase-1-Adapter-Schicht in `$lib/webmcp/`, Spec-Version-Pin in `webmcp-manifest.json` (`architecture.md` Zeile 281-285, 1463, 1492, 1539, 1648).
- WebMCP-Spec-Referenz: https://github.com/MiguelsPizza/WebMCP (Repo der Spezifikation, Status zum Story-Zeitpunkt prüfen)
- `@mcp-b/global` als Polyfill-Kandidat per Epic-AC; aktuelle NPM-Existenz + Versions-Status zum Dev-Start verifizieren (Open-Question 1)
- Bestehender Datenpfad:
  - `src/lib/data/geocode.remote.ts` (Adress-Suche)
  - `src/lib/data/get-layers-at-point.ts`
  - `src/lib/data/get-kiez-profile.ts` (broken, siehe Story 2.4 Open-Q)
  - `src/lib/data/get-bezirk-profile.ts`
  - `src/lib/data/get-layer-metadata.ts`, `src/lib/data/get-layer-detail.ts`
  - `src/lib/server/db/queries/*` aus Story 2.0 (Aggregat-Reads)
- Bestehende Inspector-Layer-Hit-Struktur: `LayerHit { layer, value, source, updatedAt, license, reason? }` (FR40 erfüllt)
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_paraglide_reroute.md`.

## Akzeptanz-Kriterien

1. **AC-1 (Adapter-Schicht mit Spec-Version-Pin):**
   **Given** dass WebMCP Pre-1.0 ist und Breaking-Changes erwartet werden
   **When** ich `$lib/webmcp/adapter.ts` implementiere
   **Then**:
   - Adapter exportiert `registerWebMcpServer(config: WebMcpServerConfig): void` (browser-only)
   - Conditional Polyfill-Load: prüft `'modelContext' in navigator` (native API ab Chrome 146+); falls fehlt, dynamic-import `@mcp-b/global` (oder das aktuell beste Polyfill-Package, siehe Open-Question 1)
   - Adapter wird in `+layout.svelte` clientseitig via `onMount` registriert (NICHT SSR)
   - Spec-Version wird hard-coded als Konstante (`WEBMCP_SPEC_VERSION = 'X.Y.Z'`) und in `webmcp-manifest.json` ausgegeben (Source-of-Truth für Spec-Compatibility)
   - Bei Spec-Breaking-Change zukünftig: nur Adapter ändert sich, Tool-Code bleibt stabil (siehe NFR-I7)
   - `webmcp`-Empty-Stub-Package (aktuell installiert) wird entweder ersetzt durch echtes Polyfill oder bleibt als Marker-Dep mit Hinweis
   - Test: Adapter mountet ohne Error, Spec-Version in Manifest übereinstimmend

2. **AC-2 (5 Tools mit Datenpfad-Delegation):**
   **Given** dass WebMCP-Tools KEINEN eigenen Datenpfad bauen sollen (Architecture-MUST), sondern bestehende `$lib/data/`-Funktionen wiederverwenden
   **When** ich Tools in `$lib/webmcp/tools/` implementiere
   **Then**:
   - 5 Tools mit JSON-Schema-strict Inputs (`snake_case`-Naming, Englisch-Beschreibungen):
     - **`address_lookup`** → delegiert an Geocode-Pfad (`geocode.remote.ts`); Input `{query: string, limit?: number}`; Output `Array<{display_name, lat, lng, bezirk?, kiez?, postcode?}>`
     - **`cross_layer_query`** → delegiert an `getLayersAtPoint(lat, lng)`; Input `{lat: number, lng: number}`; Output `Array<{layer, value, source, updated_at, license, reason?}>` (FR40 provenance preserved)
     - **`get_kiez_profile`** → delegiert an `getKiezProfile(locale, slug)`; Input `{slug: string, locale?: 'de'|'en'}`; Output `{name, bezirk, einwohner, flaeche_ha, centroid, score?}`
     - **`get_layer_metadata`** → delegiert an `getLayerMetadata` + `getLayerMethodology`; Input `{slug, locale?: 'de'|'en'}`; Output Layer-Konzept-Info
     - **`list_layers_at_point`** → wie `cross_layer_query`, aber nur Layer-Slugs ohne Werte (für „welche Layer sind hier relevant"-Discovery)
   - Tool-Schema-Validation pro Tool via Valibot (Input + Output)
   - Tool-Beschreibungen + Param-Beschreibungen Englisch (LLM-Audience)
   - Tool-Module < 200 LOC pro File
   - Test: pro Tool ein End-to-End-Test mit Mock-Data-Layer

3. **AC-3 (Resources mit URI-Schema):**
   **Given** FR38 (URI-adressierbares Datenmodell)
   **When** ich Resources in `$lib/webmcp/resources/` implementiere
   **Then**:
   - URI-Schema `navigator://...`:
     - `navigator://address/{slug-or-coords}` → aktive Adress-Info aus UI-Context
     - `navigator://layers/active` → aktuell aktive Layer-Liste aus URL-State
     - Optional `navigator://bezirk/{slug}` und `navigator://kiez/{slug}` als Read-only Resource-Mirrors
   - Resource-Implementierung als Pure-Reads aus existierenden Stores (`ui-context`, `url-state`)
   - Resource-Liste wird im Manifest exponiert (siehe AC-5)
   - Test: Resource-Lookup pro URI-Pattern

4. **AC-4 (3 Prompt-Templates):**
   **Given** FR39 (mindestens 3 Prompt-Templates)
   **When** ich Prompts in `$lib/webmcp/prompts/` implementiere
   **Then**:
   - **`address-overview`** „Was ist an dieser Adresse besonders?" / „What's notable about this address?"
   - **`compare-kieze`** „Vergleiche diese zwei Kieze" / „Compare these two Kieze"
   - **`explain-layer`** „Erkläre den Layer X" / „Explain the layer X"
   - Prompts sind lokalisiert (DE + EN); Locale bestimmt sich aus `getLocale()` oder Tool-Param
   - Prompt-Templates referenzieren Tools im Body (z.B. `address-overview` nutzt `cross_layer_query` + `get_kiez_profile`)
   - Schema-strict via Valibot
   - Test: Snapshot pro Prompt × Locale

5. **AC-5 (WebMCP-Manifest):**
   **Given** dass LLM-Agents Tools via Manifest-Discovery finden
   **When** ich `static/webmcp-manifest.json` + `routes/webmcp-manifest.json/+server.ts` baue
   **Then**:
   - Manifest enthält: `spec_version`, `name`, `description`, `tools[]`, `resources[]`, `prompts[]`
   - `tools[]`-Eintrag pro Tool: `name`, `description`, `input_schema` (JSON-Schema), `output_schema`
   - Statisches Asset `static/webmcp-manifest.json` wird Build-Time generiert (Pure-Function-Build-Step in `scripts/build-webmcp-manifest.ts`)
   - Routen-Endpoint `routes/webmcp-manifest.json/+server.ts` mit `prerender = true` serviert das Asset (Doppel-Serving akzeptabel; macht Discovery via beide Pfade möglich)
   - Manifest enthält `spec_version`-Feld zur Adapter-Bindung (siehe AC-1)
   - License/Attribution-Hinweis im Manifest (CC BY 4.0 für API-Outputs oder Note auf Daten-Lizenzen pro Tool)
   - Test: Manifest-Schema-Validation gegen WebMCP-Spec; Spotcheck dass alle 5 Tools, alle Resources, alle Prompts im Manifest enthalten

6. **AC-6 (Quellen-Attribution durch alle Tool-Outputs):**
   **Given** FR40
   **When** ich Tool-Outputs serialisiere
   **Then**:
   - `cross_layer_query`-Output: pro Layer-Wert `{source, updated_at, license, reason?}` zusätzlich zum Wert
   - `get_kiez_profile`-Output: `data_sources` Array mit pro Section/Score die Quelle aus `kiez_stats.aggregateValue.layer`
   - `get_layer_metadata`-Output: `license_url` (via Story 2.2 `licenseToSchemaOrgUrl`-Helper) + `source_url` + `updated_at`
   - Snake-case-Konvention für JSON-Keys (LLM-Audience)
   - Test: pro Tool Output enthält die erwarteten Provenance-Felder

7. **AC-7 (Manueller Verifikations-Pfad):**
   **Given** dass Browser-Agent-Integration nicht headless testbar ist
   **When** ich die Integration verifiziere
   **Then**:
   - Manueller Test mit Claude Desktop / Claude Browser Extension (sofern verfügbar zum Story-Zeitpunkt) ODER MCP-Inspector-CLI
   - Verifikations-Schritte dokumentiert in `docs/runbooks/webmcp-verify.md` (neuer Stub für Story 4.4): Schritt 1 navigator.berlin im Browser, Schritt 2 Extension prüft `modelContext`, Schritt 3 Tool-Liste, Schritt 4 `list_layers_at_point({lat: 52.5163, lng: 13.3777})` (Brandenburger Tor)
   - E2E `tests/e2e/webmcp.spec.ts`: prüft Manifest-Endpoint-Output + Polyfill-Load-Smoke (kann `modelContext` mocken)
   - Falls Browser-Extension noch nicht verfügbar zum Story-Zeitpunkt: dokumentierter Fallback-Pfad „getestet via MCP-Inspector-CLI"

8. **AC-8 (TDD-Mandat + ADR-Update):**
   **Given** ADR-012 Pragmatic-TDD und ADR-002 Stub-Status
   **When** ich diese Story abschließe
   **Then**:
   - AC-1: Adapter-Mount-Smoke-Test
   - AC-2: Pro Tool ein Integrations-Test mit Mock-Data-Layer (oder echter Layer-Hit-Pfad)
   - AC-3: Resource-Lookup-Tests
   - AC-4: Prompt-Snapshot pro Locale
   - AC-5: Manifest-Schema-Test + Build-Step-Test
   - AC-6: Provenance-Test pro Tool-Output
   - AC-7: E2E + manuelle Runbook-Doku
   - ADR-002 ausgefüllt (Context, Decision, Consequences) ODER neue ADR-013-webmcp-adapter (Entscheidung Open-Question 5)
   - Coverage-Ziel: Adapter ≥80%, Tool-Logik ≥90%, Manifest-Builder 100%

## Tasks / Subtasks

- [ ] **T1: Spec-Recherche + ADR-Update** (AC: 1, 8)
  - [ ] T1.1: Aktuellen WebMCP-Spec-Status prüfen (Repo + native API in Chrome)
  - [ ] T1.2: Polyfill-Package-Auswahl (`@mcp-b/global` Existenz + Version, oder Alternative)
  - [ ] T1.3: ADR-002-Ausfüllung oder neue ADR-013 (Open-Question 5)
  - [ ] T1.4: `WEBMCP_SPEC_VERSION`-Konstante definieren

- [ ] **T2: Adapter-Schicht** (AC: 1, 8)
  - [ ] T2.1: `src/lib/webmcp/adapter.ts` mit `registerWebMcpServer` + Conditional Polyfill-Load
  - [ ] T2.2: Mount in `+layout.svelte` via `onMount` (browser-only Guard)
  - [ ] T2.3: Adapter-Mount-Smoke-Test (vitest-browser-svelte oder Node-Mock)
  - [ ] T2.4: Wenn `webmcp`-Empty-Stub bleibt: Doku im README warum

- [ ] **T3: 5 Tools-Implementation** (AC: 2, 6, 8)
  - [ ] T3.1: `src/lib/webmcp/tools/address-lookup.ts` (Geocode-Delegation)
  - [ ] T3.2: `tools/cross-layer-query.ts` (`getLayersAtPoint`-Delegation)
  - [ ] T3.3: `tools/get-kiez-profile.ts` (Profile-Delegation)
  - [ ] T3.4: `tools/get-layer-metadata.ts` (Metadata-Delegation)
  - [ ] T3.5: `tools/list-layers-at-point.ts`
  - [ ] T3.6: `tools/schemas.ts` mit Valibot-Input/Output-Schemas
  - [ ] T3.7: Pro Tool ein Test

- [ ] **T4: Resources** (AC: 3, 8)
  - [ ] T4.1: `src/lib/webmcp/resources/active-address.ts`
  - [ ] T4.2: `resources/loaded-layers.ts`
  - [ ] T4.3: URI-Parser-Helper (`navigator://...` → Resource-Lookup)
  - [ ] T4.4: Tests

- [ ] **T5: 3 Prompt-Templates** (AC: 4, 8)
  - [ ] T5.1: `src/lib/webmcp/prompts/address-overview.ts`
  - [ ] T5.2: `prompts/compare-kieze.ts`
  - [ ] T5.3: `prompts/explain-layer.ts`
  - [ ] T5.4: Lokalisierung DE+EN
  - [ ] T5.5: Snapshot-Tests

- [ ] **T6: Manifest-Build** (AC: 5, 8)
  - [ ] T6.1: `scripts/build-webmcp-manifest.ts` als Pure-Function-Builder
  - [ ] T6.2: Output `static/webmcp-manifest.json` (Build-Time)
  - [ ] T6.3: `routes/webmcp-manifest.json/+server.ts` mit `prerender = true` (Doppel-Serving)
  - [ ] T6.4: `package.json`-Script `webmcp:manifest`
  - [ ] T6.5: Schema-Validation-Test

- [ ] **T7: Manuelle Verifikation + Runbook** (AC: 7)
  - [ ] T7.1: `docs/runbooks/webmcp-verify.md` als Stub
  - [ ] T7.2: E2E `tests/e2e/webmcp.spec.ts` (Manifest-Endpoint + Polyfill-Mock)
  - [ ] T7.3: Manueller Spotcheck-Pfad dokumentiert

- [ ] **T8: Final-Verifikation** (AC: 1-8)
  - [ ] T8.1: `pnpm test:unit -- --run` 100% grün
  - [ ] T8.2: `pnpm check` 0 Errors
  - [ ] T8.3: `pnpm build` läuft, Manifest existiert
  - [ ] T8.4: Browser-Verify (manuell)
  - [ ] T8.5: Sprint-Status-Eintrag

## Dev Notes

### Spec-Status-Risiko (Open-Question 1)

`webmcp@0.0.1` ist Empty-Stub. `@mcp-b/global` als Polyfill ist Epic-Wortlaut, Existenz zum Story-Zeitpunkt prüfen. Aktueller Stand (2026-05-15):

- Native `navigator.modelContext`-API: Chrome 146+ gepatcht, Adoption gering
- Anthropic Claude Browser-Extension: nutzt MCP-Pattern, WebMCP-Bridge unsicher
- WebMCP-Spec-Repo: https://github.com/MiguelsPizza/WebMCP — Pre-1.0 Status

Empfehlung: Adapter-Schicht so abstrakt halten dass Polyfill austauschbar ist. Wenn `@mcp-b/global` nicht (mehr) verfügbar: alternatives Polyfill via `npm search` oder eigene minimale Implementierung als Fallback.

### Datenpfad-Delegation strikt

MUST: Tool-Implementation ruft `$lib/data/`-Funktionen, NICHT direkt `static/layers/`-Files oder Postgres. Vorteil: alle FR40-Provenance-Garantien aus `LayerHit` werden durch Tool-Output reichlich. Beispiel:

```typescript
// $lib/webmcp/tools/cross-layer-query.ts
import { getLayersAtPoint } from '$lib/data/get-layers-at-point';
import { CrossLayerQueryInput, CrossLayerQueryOutput } from './schemas';

export const crossLayerQueryTool = {
  name: 'cross_layer_query',
  description: 'Query all data layers at a geographic point in Berlin.',
  inputSchema: CrossLayerQueryInput,
  outputSchema: CrossLayerQueryOutput,
  handler: async ({ lat, lng }: CrossLayerQueryInputType) => {
    const hits = await getLayersAtPoint(lat, lng);
    return hits.map(hit => ({
      layer: hit.layer,
      value: hit.value,
      source: hit.source,
      updated_at: hit.updatedAt,
      license: hit.license,
      reason: hit.reason ?? null
    }));
  }
};
```

### Snake-Case-Konvention

WebMCP-Spec verwendet `snake_case` für Tool-Namen und Param-Namen. Bestehende TS-Codebase ist camelCase. Mapping passiert an der Tool-Boundary (Input deserialize: snake → camel; Output serialize: camel → snake). Pure-Function-Helper `src/lib/webmcp/internal/case-mapper.ts`.

### Resource-URI-Schema

`navigator://`-Custom-Scheme. Resource-Lookup-Logik:

```typescript
// $lib/webmcp/internal/uri-parser.ts
export type ResourceRef =
  | { type: 'address'; ref: string }
  | { type: 'layers'; ref: 'active' }
  | { type: 'bezirk'; slug: string }
  | { type: 'kiez'; slug: string };

export function parseResourceUri(uri: string): ResourceRef | null { ... }
```

### Locale-Pflicht

Tools, Resources, Prompts müssen Locale (de|en) respektieren. Pattern: `locale`-Param optional, Default aus `getLocale()` (Paraglide-Runtime), Output-Strings entsprechend. KEINE hardcoded UI-Strings (MUST-Rule #14).

### `webmcp`-Stub-Package-Entscheidung

`webmcp@^0.0.1` in `package.json` ist nutzlos (Empty-Stub). Optionen:

a) Stub belassen als Marker („wir nutzen WebMCP-Spec"), Doku im README
b) Stub entfernen, ersetzen durch `@mcp-b/global` oder Alternative
c) Stub entfernen + keine Polyfill-Dep, eigener Polyfill in `$lib/webmcp/`

Empfehlung (b) wenn `@mcp-b/global` verfügbar, sonst (c).

### ADR-Status (Open-Question 5)

`ADR-002-webmcp.md` ist Stub. Diese Story kann den Stub ausfüllen oder eine neue ADR-013-webmcp-adapter anlegen (analog ADR-013-postgres-hybrid aus Story 4.4).

Empfehlung: ADR-002 ausfüllen (single ADR pro Tech-Decision-Topic).

### MUST-Rules-Anwendung

- **#3 Bestehende Funktionen prüfen:** `getLayersAtPoint`, `getKiezProfile`, `getBezirkProfile`, `getLayerMetadata`, `geocode.remote.ts` re-use, KEINE Duplikation
- **#7 TypeScript strict:** Valibot-Schemas, kein `any`
- **#10 Cookieless:** WebMCP-Tools setzen keine Cookies, Resources sind read-only
- **#11 Kein US-Drittanbieter:** Polyfill darf KEIN US-CDN-Asset laden
- **#14 i18n-First:** Locale-Param respektieren
- **#19 Remote Functions vs. fetch:** Tools laufen client-side; bestehende `*.remote.ts`-Functions via Direct-Call OK
- **MUST WebMCP-Tools ↛ Data-Layer:** Tools delegieren an `$lib/data/`, kein eigener Datenpfad (Architecture-Boundary)

### Performance + Caching

WebMCP-Tool-Calls kommen vom Browser-Agent, nicht vom End-User-Browser. Frequenz: niedrig. Aber Tools können `cross_layer_query` mit beliebigen Koordinaten triggern → existierender LRU-Cache aus `getLayersAtPoint` reicht.

### Open-Questions vor Dev-Start

1. **Polyfill-Package:** `@mcp-b/global` verifizieren oder Alternative. User-Check zum Dev-Start.
2. **`webmcp@0.0.1`-Stub:** belassen, ersetzen, oder entfernen? Empfehlung ersetzen/entfernen.
3. **Locale-Default für Tools ohne expliziten Param:** `de` hart oder via Paraglide-`getLocale()`? Empfehlung `getLocale()`.
4. **ADR-Status:** ADR-002 ausfüllen oder neue ADR-013? Empfehlung ADR-002 ausfüllen.
5. **Manueller Verifikations-Pfad:** Claude-Browser-Extension verfügbar zum Story-Zeitpunkt? Falls nicht, MCP-Inspector-CLI als Fallback.

### Project Structure Notes

- Adapter: `src/lib/webmcp/adapter.ts`
- Tools: `src/lib/webmcp/tools/*.ts` (5 Files)
- Resources: `src/lib/webmcp/resources/*.ts` (2-4 Files)
- Prompts: `src/lib/webmcp/prompts/*.ts` (3 Files)
- Schemas: `src/lib/webmcp/internal/schemas.ts` + `case-mapper.ts` + `uri-parser.ts`
- Build-Script: `scripts/build-webmcp-manifest.ts`
- Endpoint: `src/routes/webmcp-manifest.json/+server.ts`
- Static: `static/webmcp-manifest.json` (Build-generiert, optional gitignored oder committed)
- ADR-Update: `docs/adr/ADR-002-webmcp.md`
- Runbook-Stub: `docs/runbooks/webmcp-verify.md`

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1250-L1286](../planning-artifacts/epics.md)
- FR37-FR40: [prd.md#L742-L745](../planning-artifacts/prd.md)
- ADR-002 Stub: [docs/adr/ADR-002-webmcp.md](../../docs/adr/ADR-002-webmcp.md)
- Architecture-Boundary `webmcp/ ↛ data/`: [architecture.md#L1463](../planning-artifacts/architecture.md)
- WebMCP-Spec-Repo: https://github.com/MiguelsPizza/WebMCP
- LayerHit-Provenance: [src/lib/data/types.ts:17-24](../../src/lib/data/types.ts)
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_paraglide_reroute.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
