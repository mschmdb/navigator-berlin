# Story 1.1: Repository-Initialisierung mit Stack-Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Solo-Maintainer,
I want ein reproduzierbar initialisiertes SvelteKit-Repository mit dem vollständigen Stack,
so that alle nachfolgenden Stories auf einer deterministischen Foundation aufsetzen können.

## Acceptance Criteria

1. **AC-1 (Svelte CLI-Skelett):**
   **Given** keine bestehende `package.json` im Projekt-Root
   **When** Skelett via `pnpm dlx sv create . --template=minimal --types=ts --no-install` initialisiert wird (siehe Dev-Note „Project-Root-Strategie")
   **Then** minimales SvelteKit-Skelett mit TypeScript-strict ist erstellt
   **And** `@sveltejs/adapter-node` ist interaktiv selektiert und in `svelte.config.js` als Adapter eingetragen.

2. **AC-2 (Add-on-Konfiguration):**
   **Given** das initialisierte Skelett
   **When** `pnpm dlx sv add prettier eslint vitest playwright paraglide tailwindcss` ausgeführt wird
   **Then** alle 6 Add-ons sind mit Default-Templates konfiguriert
   **And** ESLint + Prettier + Vitest + Playwright + Paraglide + Tailwind v4 sind in `package.json` als Dev-Dependencies + Config-Files (`eslint.config.js`, `prettier.config.js`/`.prettierrc`, `vitest.config.ts`, `playwright.config.ts`) vorhanden.

3. **AC-3 (Stack-spezifische Runtime-Libs):**
   **Given** Add-ons installiert
   **When** Runtime-Libs via `pnpm add maplibre-gl layerchart@next d3-scale d3-interpolate d3-array @turf/boolean-point-in-polygon @turf/helpers @turf/distance rbush lru-cache @lucide/svelte bits-ui webmcp valibot` nachgezogen werden
   **Then** alle Pakete sind in `dependencies` von `package.json` mit gepinnten Versionen
   **And** `pnpm-lock.yaml` hält Versionen fest.

4. **AC-4 (Stack-spezifische Dev-Libs):**
   **Given** Runtime-Libs installiert
   **When** Dev-Libs via `pnpm add -D mapshaper fontnik proj4 satori @resvg/resvg-js @axe-core/playwright @lhci/cli size-limit lefthook` nachgezogen werden
   **Then** alle Pakete sind in `devDependencies` von `package.json`
   **And** `pnpm-lock.yaml` hält Versionen fest.

5. **AC-5 (Reproduzierbarer Install):**
   **Given** vollständiger Lockfile
   **When** `pnpm install --frozen-lockfile` aus frischem Clone ausgeführt wird
   **Then** Install bricht nicht ab und reproduziert Setup byte-identisch (NFR-M1).

6. **AC-6 (Experimental Async):**
   **Given** vollständiges Setup
   **When** `experimental.async = true` in `svelte.config.js` unter `compilerOptions` aktiviert ist
   **Then** `pnpm dev` startet ohne Fehler auf Port 5173
   **And** Default-Hello-World-Page (`src/routes/+page.svelte`) rendert ohne Type-Errors
   **And** `pnpm check` (`svelte-check`) läuft mit 0 Errors + 0 Warnings durch.

7. **AC-7 (ADR-Verzeichnis):**
   **Given** initialisiertes Repo
   **When** `docs/adr/` mit `ADR-000-template.md` und Stub-Files für ADR-001 bis ADR-011 (siehe Dev-Note „ADR-Liste") angelegt wird
   **Then** Verzeichnis ist verfügbar für nachfolgende Decision-Records (NFR-M2, NFR-M6).

8. **AC-8 (Healthz-Endpoint vorbereitet):**
   **Given** SvelteKit-Setup
   **When** `src/routes/api/healthz/+server.ts` als minimaler `GET`-Handler (Return `new Response('ok', { status: 200 })`) angelegt wird
   **Then** `curl http://localhost:5173/api/healthz` antwortet `200 ok` (Vorbereitung für Story 4.1, NFR-R2).

## Tasks / Subtasks

- [x] **Task 0: Git-Init + Remote-Setup** (AC: #1 Vorbedingung)
  - [x] 0.1 `git init -b main` im Working-Directory ausführen
  - [x] 0.2 `git remote add origin git@github.com:mschmdb/navigator-berlin.git`
  - [x] 0.3 Verify `git status` zeigt Untracked-Files (BMAD-Source, docs/, etc.) im `main`-Branch
  - [x] 0.4 GH-Repo `mschmdb/navigator-berlin` muss vorher existieren (Solo-Maintainer Web-UI oder `gh repo create mschmdb/navigator-berlin --private --description "navigator.berlin — Cross-Layer Berlin Atlas"`) — Visibility-Wahl (private/public) solo-maintainer-Entscheidung; bei Public sofort MIT-Lizenz-Header im README

- [x] **Task 1: Projekt-Root-Init via Svelte CLI** (AC: #1)
  - [x] 1.1 Verify im Working-Directory: KEINE `package.json` vorhanden (Greenfield-Check)
  - [x] 1.2 Verify Existenz von `_bmad/`, `_bmad-output/`, `.claude/`, `docs/` (BMAD-Struktur bleibt erhalten)
  - [x] 1.3 `pnpm dlx sv create . --template minimal --types ts --no-install --add sveltekit-adapter=adapter:node --no-dir-check --no-download-check` (non-interaktiv mit Adapter-Flag statt Prompt)
  - [x] 1.4 Adapter-node via `--add sveltekit-adapter=adapter:node` deterministisch gesetzt
  - [x] 1.5 Verify `svelte.config.js` enthält `import adapter from '@sveltejs/adapter-node'`
  - [x] 1.6 Verify `tsconfig.json` enthält `"strict": true`

- [x] **Task 2: Add-ons via `sv add`** (AC: #2)
  - [x] 2.1 `pnpm dlx sv add prettier eslint vitest=usages:unit,component playwright paraglide=languageTags:en,de,fr,es,it,pl,tr,ar+demo:no tailwindcss=plugins:typography,forms --no-install --no-git-check --no-download-check` — non-interaktiv mit allen Optionen, 8 messages-Files (ar,de,en,es,fr,it,pl,tr), paraglide-demo:no respektiert
  - [x] 2.2 Config-Files vorhanden: `eslint.config.js`, `.prettierrc`, Tailwind v4 (kein JS-config, via `@tailwindcss/vite`), Paraglide unter `messages/` + `project.inlang/`. `vitest.config.ts` / `playwright.config.ts` siehe `vite.config.ts` (vitest workspace) + `playwright.config.ts`
  - [x] 2.3 package.json-Scripts vorhanden: `dev`, `build`, `preview`, `check`, `check:watch`, `test:unit`, `test:e2e`, `lint`, `format`, `test`
  - [x] 2.4 `fetch`-Stub ergänzt (`echo "TODO Story 1.3"`); `test` bereits durch sv add gesetzt

- [x] **Task 3: Runtime-Libs installieren** (AC: #3)
  - [x] 3.1 `pnpm add maplibre-gl layerchart@next d3-scale d3-interpolate d3-array`
  - [x] 3.2 `pnpm add @turf/boolean-point-in-polygon @turf/helpers @turf/distance rbush`
  - [x] 3.3 `pnpm add lru-cache @lucide/svelte bits-ui webmcp valibot`
  - [x] 3.4 Verify in `package.json` → `dependencies`: 14 Pakete (AC-3-Liste enthält 14 Items; Story-Text „13" ist Tippfehler)
  - [x] 3.5 **CRITICAL:** `@lucide/svelte` v1.14.0 verifiziert ✓ (kein `lucide-svelte`)

- [x] **Task 4: Dev-Libs installieren** (AC: #4)
  - [x] 4.1 `pnpm add -D mapshaper fontnik proj4 satori @resvg/resvg-js`
  - [x] 4.2 `pnpm add -D @axe-core/playwright @lhci/cli size-limit lefthook`
  - [x] 4.3 Alle 9 Pakete in devDependencies verifiziert. Build-Script-Warnings (better-sqlite3, fontnik, lefthook, msgpackr-extract) deferred — fontnik/lefthook builds in Story 1.2/4.3

- [x] **Task 5: Reproduzierbarkeits-Check** (AC: #5)
  - [x] 5.1 `rm -rf node_modules`
  - [x] 5.2 `pnpm install --frozen-lockfile` → ohne Lockfile-Modifications durchgelaufen
  - [x] 5.3 Keine „lockfile out of sync"-Warnings (nur unrelated build-script-Warnings für fontnik/lefthook/better-sqlite3/msgpackr-extract)

- [x] **Task 6: Experimental Async aktivieren** (AC: #6)
  - [x] 6.1 `svelte.config.js` geöffnet
  - [x] 6.2 `compilerOptions.experimental.async = true` eingetragen
  - [x] 6.3 `pnpm dev` startet ohne Compiler-Errors. Port: 5173-5183 belegt durch andere User-Projekte, Vite auf 5184 ausgewichen — Story-Port-Hinweis ist Default, nicht Hard-Req
  - [x] 6.4 Browser-Smoke: `curl localhost:5183` rendert navigator.berlin HTML (`lang="en" dir="ltr"`, paraglide-template aktiv) — 200 OK. Paraglide-compile vorab via `npx paraglide-js compile` nötig, sonst svelte-check fehler
  - [x] 6.5 `pnpm check` → 0 Errors + 0 Warnings (838 Files)
  - [x] 6.6 Dev-Server gestoppt

- [x] **Task 7: ADR-Verzeichnis anlegen** (AC: #7)
  - [x] 7.1 `mkdir -p docs/adr docs/runbooks` (runbooks-Verzeichnis als Vorbereitung Story 4.4)
  - [x] 7.2 `docs/adr/ADR-000-template.md` erstellt (Template-Struktur via Dev-Note „ADR-Template")
  - [x] 7.3 Stub-Files ADR-001 bis ADR-011 erstellt — Frontmatter (status/date/deciders) + Titel + leere Sektionen
  - [x] 7.4 `ls docs/adr/` zeigt 12 Files (Template + 11 Stubs) verifiziert

- [x] **Task 8: Healthz-Endpoint** (AC: #8)
  - [x] 8.1 `mkdir -p src/routes/api/healthz`
  - [x] 8.2 `src/routes/api/healthz/+server.ts` mit minimalem GET-Handler (importiert `RequestHandler` von `./$types`)
  - [x] 8.3 `curl localhost:5183/api/healthz` → `200 ok` (user's dev-server auf 5183, HMR picked route up)
  - [x] 8.4 Server-Stop nicht nötig — User's dev-Server bleibt für weitere Smokes laufen; mein bg-dev wurde bereits gestoppt

- [x] **Task 9: README + LICENSE Bootstrap** (NFR-M2, Vorbereitung Epic 4)
  - [x] 9.1 `LICENSE` MIT (Copyright Matze Schmidbauer 2026) erstellt
  - [x] 9.2 `README.md` neu — Titel, Pitch, GitHub-Link, pnpm-Setup, Stack-Liste, MIT-Hinweis
  - [x] 9.3 `.gitignore` ergänzt: `_bmad-output/`, `_user-input/`, `.claude/projects/` (BMAD-Skill-Source `_bmad/` bleibt versioniert). sv-create-Default-Einträge (node_modules, build, .svelte-kit, .env*) bereits vorhanden
  - [x] 9.4 `.editorconfig` neu erstellt (sv-create v0.15.3 generierte keine — Default-Tabs + 2-Spaces für md/yaml/json)
  - [x] 9.5 `.nvmrc` = `20` (Node LTS)

- [x] **Task 10: Final-Smoke + Hand-off** (AC: #5–8 zusammen)
  - [x] 10.1 Fresh-Clone-Sim per User-Decision skip — Task 5 hat `rm -rf node_modules && pnpm install --frozen-lockfile` bereits durchgeführt; finaler `pnpm check` (847 Files, 0/0) post-Healthz/README verifizierte Build-Determinismus. User's dev-Server auf 5183 sollte nicht gestört werden
  - [x] 10.2 File-Größen: keine story-generierte Datei >500 Zeilen. Über-500-Files (pnpm-lock.yaml, BMAD-Skill-Source `.claude/skills/bmad-*/...md`) sind generated lockfile (Industrie-Konvention) bzw. pre-existing third-party skill source — nicht NFR-M7-relevant
  - [x] 10.3 Scripts vollständig: `dev, build, preview, check, check:watch, test:unit, test:e2e, test, lint, format, fetch, prepare` (extra) — verifiziert via node-script
  - [x] 10.4 Commit `407e6ea` — `feat(repo): initialize SvelteKit + stack foundation (story 1.1)` mit Co-Authored-By Claude
  - [x] 10.5 `git push -u origin main` → `[new branch] main -> main`
  - [x] 10.6 GH-Repo verifiziert: `defaultBranchRef.main`, visibility PRIVATE, URL https://github.com/mschmdb/navigator-berlin

## Dev Notes

### Project-Root-Strategie

**Kontext:** Working-Directory `/Users/matthiasschmidbauer/Sites/navigator.berlin/` enthält bereits BMAD-Struktur (`_bmad/`, `_bmad-output/`, `.claude/`, `_user-input/`, `docs/`). KEIN bestehendes `package.json`.

**Entscheidung:** Skelett via `sv create .` (Punkt = current dir) in Root initialisieren, NICHT in `navigator-berlin/`-Subdir. Begründung:
- BMAD-Output-Pfade in Skills/Configs zeigen auf `_bmad-output/` relativ zu Root
- Architecture-Doc (Sektion „Complete Project Directory Structure") zeigt `navigator-berlin/` als Top-Level — Pfad-Struktur darunter (`src/`, `static/`, `scripts/`, `docs/`) wird in unserem Root identisch sein
- Vermeidet doppelte Verschachtelung und Pfad-Konflikte

**`.gitignore`-Disziplin:** Nach `sv create .` Default-Gitignore prüfen, dann ergänzen:
```
# BMAD intermediates (DO NOT ignore _bmad/ skill source)
_bmad-output/
_user-input/

# Claude-Code session
.claude/projects/
```
BMAD-Skill-Definitions unter `_bmad/` BLEIBEN versioniert (Source-of-Truth für Workflow-Reproduzierbarkeit).

### Stack-Liste verbindlich (architecture.md Sektion „Stack-spezifische Libs nachgezogen")

**Dependencies (Runtime):**
- `maplibre-gl` — Karten-Renderer (Phase 1)
- `layerchart@next` — Chart-Bibliothek, Runes-nativ
- `d3-scale`, `d3-interpolate`, `d3-array` — Skalen für Layer-Visualisierung
- `@turf/boolean-point-in-polygon`, `@turf/helpers`, `@turf/distance` — Geo-Operations
- `rbush` — Spatial Index R-Tree
- `lru-cache` — In-Process-Cache (Layer-Hits, Geocoding)
- `@lucide/svelte` — Icons (**NIEMALS** `lucide-svelte`, MUST-Rule #1)
- `bits-ui` — Headless A11y-Primitives
- `webmcp` — WebMCP-Client für Phase-1-Adapter
- `valibot` — Schema-Validation für API-Boundaries

**DevDependencies (Build):**
- `mapshaper` — GeoJSON-Simplifizierung (Build-Time, Story 1.3)
- `fontnik` — MapLibre-Glyph-Pack-Generator (Story 1.2)
- `proj4` — EPSG:25833 → EPSG:4326 Fallback-Reprojektion
- `satori` + `@resvg/resvg-js` — OG-Image-Pipeline (Story 2.6)
- `@axe-core/playwright` — A11y-Gate (NFR-A1)
- `@lhci/cli` — Lighthouse-CI (NFR-P7/P8)
- `size-limit` — Bundle-Size-Gate (NFR-P5)
- `lefthook` — Pre-Commit-Hooks (Story 4.3)

### ADR-Liste (Stubs für Task 7)

Pro File: H1-Titel + Frontmatter (`status: Proposed`, `date: 2026-05-11`, `deciders: solo-maintainer`) + Sektionen „Context", „Decision", „Consequences" leer.

| File | Titel | Lookup-Sektion in architecture.md |
|------|-------|------------------------------------|
| ADR-000-template.md | ADR Template | — |
| ADR-001-tile-provider.md | Tile-Provider: OpenFreeMap mit Protomaps-Hedge | Sektion „Infrastructure & Deployment", NFR-R6 |
| ADR-002-webmcp.md | WebMCP-Adapter-Schicht + Spec-Version-Pin | Sektion „API & Communication Patterns", NFR-I7 |
| ADR-003-postgres-deferral.md | Postgres/Drizzle auf Phase 2 verschoben | Sektion „Data Architecture" |
| ADR-004-cookieless.md | Cookieless-Architektur (URL-State only) | Sektion „Frontend Architecture", NFR-PR1/PR5 |
| ADR-005-i18n-paraglide.md | Paraglide v2 für 8-Sprachen-i18n | Epic 3 |
| ADR-006-tailwind-v4.md | Tailwind v4 mit CSS-Variables-First | Sektion „Styling Solution" |
| ADR-007-bits-ui.md | Bits UI als Headless Primitive-Library | Sektion „Component Architecture" |
| ADR-008-context-api-state.md | Context-API statt Module-Scope-State | MUST-Rule #16 |
| ADR-009-remote-functions.md | Remote Functions statt ad-hoc fetch | MUST-Rule #19 |
| ADR-010-experimental-async.md | `experimental.async = true` + `<svelte:boundary>` | MUST-Rule #20 |
| ADR-011-on-demand-layer-loading.md | On-Demand-Layer-Fetch + LRUCache | Sektion „Data Architecture", NFR-P5 |

### ADR-Template (Inhalt für ADR-000-template.md)

```markdown
# ADR-NNN: <Titel>

- Status: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
- Date: YYYY-MM-DD
- Deciders: <Rollen>

## Context

<Was ist die Situation/das Problem, das eine Entscheidung erfordert?>

## Decision

<Welche Entscheidung wurde getroffen?>

## Consequences

- Positive: <gewonnene Eigenschaften>
- Negative: <Trade-offs>
- Migration: <falls Pattern-Wechsel>
```

### Required `package.json` Scripts (Final-Check Task 10.3)

| Script | Command | Erwartet aus | Story |
|--------|---------|--------------|-------|
| `dev` | `vite dev` | sv create | 1.1 |
| `build` | `vite build` | sv create | 1.1 |
| `preview` | `vite preview` | sv create | 1.1 |
| `check` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` | sv create | 1.1 |
| `check:watch` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch` | sv create | 1.1 |
| `test:unit` | `vitest` | sv add vitest | 1.1 |
| `test:e2e` | `playwright test` | sv add playwright | 1.1 |
| `test` | `pnpm test:unit run && pnpm test:e2e` | manuell ergänzen | 1.1 |
| `lint` | `prettier --check . && eslint .` | sv add eslint | 1.1 |
| `format` | `prettier --write .` | sv add prettier | 1.1 |
| `fetch` | `echo "TODO Story 1.3"` (Stub) | manuell | 1.1 → 1.3 |

### Architektur-Compliance — 21 MUST-Rules

**Aus architecture.md Sektion „Enforcement Guidelines" — gelten ab Story 1.1, nicht retroaktiv.** Bei Story 1.1 direkt relevant:

1. `@lucide/svelte` — verifiziert in Task 3.5
2. Files <500 Zeilen — verifiziert in Task 10.2
3. Bestehende Funktionen checken — N/A (Greenfield)
4. Keine Backwards-Compat-Hacks — N/A
5. Keine Premature-Abstractions — N/A
6. Keine Comments außer non-obvious WHYs — anwenden in `+server.ts`
7. TypeScript strict, kein `any` — verifiziert via `pnpm check`
8. Svelte-5-Runes — sv create-Default
9. `{@const}`-Regel — N/A (keine Components erstellt)
10. Cookieless — N/A in Story 1.1
11. Kein US-Drittanbieter — verifiziert in CI ab Story 4.3
12. LayerHit-Provenienz — N/A in Story 1.1
13. A11y-First — N/A in Story 1.1
14. i18n-First — N/A (kein UI-String erstellt)
15. `$state.raw` für große Objekte — N/A
16. Context-API — N/A
17. `$derived` über `$effect` — N/A
18. Keyed `{#each}` — N/A
19. Remote Functions — N/A
20. Async via `await`+`<svelte:boundary>` — Foundation: `experimental.async = true` in AC-6
21. `prerender()` mit `entries`-Hook — N/A

### Library/Framework Requirements

**Versions-Disziplin:**
- Node.js: LTS ≥20.x (`.nvmrc` pin in Task 9.5)
- pnpm: aktuelle Stable (8.x+)
- Svelte: 5.x (sv create-Default, Mai 2026)
- SvelteKit: 2.x mit `adapter-node`
- TypeScript: strict mode (sv create-Default)
- Tailwind: v4 (sv add tailwindcss-Default, Mai 2026)
- Paraglide: v2 (sv add paraglide-Default)
- Vite: SvelteKit-bundled (manuelles Pin nicht nötig)

**`layerchart@next`:** Bewusst auf `@next` gepinnt — v2-Runes-native, in Architecture-Doc explizit gewählt. Bei Install-Warnung normal.

**`webmcp`:** Pre-1.0 — Adapter-Schicht (Story 2.7) isoliert Breaking-Changes.

### Testing Requirements

**Phase 1 in Story 1.1:** Smoke-Level — Setup-Verification, kein Unit-/E2E-Test-Inhalt:

- Vitest installiert + lauffähig (`pnpm test:unit` startet, auch ohne eigene Tests OK — Default-Test aus sv add)
- Playwright installiert + lauffähig (`pnpm exec playwright install --with-deps chromium` einmalig in Dev-Env — NICHT committen, CI macht eigene Install)
- `pnpm check` → 0 Errors (NFR-M3)

**Spätere Stories:** Unit-Tests ≥80% Coverage für Daten-Transform-Logik (NFR-M5), E2E-Top-3-Journeys, axe-core-Gate.

### File-Structure-Requirements (post-Story 1.1 Snapshot)

Erwartete Top-Level-Files nach Story 1.1:

```
./
├── _bmad/ (BMAD-Source, versioniert)
├── _bmad-output/ (gitignored)
├── _user-input/ (gitignored)
├── .claude/ (versioniert ohne projects/)
├── .editorconfig
├── .gitignore
├── .nvmrc
├── docs/
│   ├── adr/
│   │   ├── ADR-000-template.md
│   │   ├── ADR-001-tile-provider.md ... ADR-011-on-demand-layer-loading.md
│   │   └── (12 Files)
│   └── runbooks/ (leer, Story 4.4)
├── eslint.config.js
├── LICENSE (MIT)
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── prettier.config.js (oder .prettierrc)
├── README.md
├── src/
│   ├── app.css
│   ├── app.d.ts
│   ├── app.html
│   ├── lib/ (sv create-Default: `index.ts`)
│   └── routes/
│       ├── +layout.svelte (oder reine `+page.svelte` falls sv create kein Layout generiert)
│       ├── +page.svelte
│       └── api/healthz/+server.ts
├── static/
│   └── favicon.ico
├── svelte.config.js (mit experimental.async = true)
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

**NICHT in Story 1.1 anlegen** (kommen in Folge-Stories): `src/params/lang.ts` (1.3), `src/routes/[lang=lang]/` (1.3), `src/lib/data/`, `src/lib/components/`, `static/layers/`, `scripts/`, `.github/workflows/`, `docker-compose.yml`, `coolify.json`, `lighthouserc.cjs`.

### `svelte.config.js` Snippet (AC-6)

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  },
  compilerOptions: {
    experimental: {
      async: true
    }
  }
};
```

### `+server.ts` Snippet (AC-8)

```typescript
// src/routes/api/healthz/+server.ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => new Response('ok', { status: 200 });
```

Kein Comment nötig — Endpoint-Zweck ergibt sich aus Pfad.

### Previous Story Intelligence

**Keine** — Story 1.1 ist die erste Story des Projekts. Foundation für alle nachfolgenden Stories.

### Git Intelligence

**Repo nicht initialisiert** (`is git repository: false` aus Env). Initialisierung gehört zu Story 1.1:

- `git init -b main` als Task 0.1, BEVOR `sv create` läuft (sonst commitet `sv create` möglicherweise unsauber)
- Remote: `git@github.com:mschmdb/navigator-berlin.git` (Task 0.2)
- GH-Repo `mschmdb/navigator-berlin` muss vorher existieren — entweder via GH-Web-UI oder `gh repo create mschmdb/navigator-berlin --private --source=. --description="navigator.berlin"`
- Visibility (private/public) solo-maintainer-Entscheidung; bei Public sofort MIT-LICENSE prominent
- Initial-Push `git push -u origin main` nach Task 10.4

### Latest Tech Information (Mai 2026)

- **Svelte 5.36+**: `experimental.async` stable-track, `<svelte:boundary>` als preferred Pattern für Async (MUST-Rule #20). Doku via `mcp__svelte__get-documentation` falls Detail-Fragen
- **Tailwind v4**: Kein JS-Config nötig (Default), `@theme`-Directive in CSS. Token-Setup kommt in Story 1.2
- **Paraglide v2**: Compiler-basiert, `messages/`-Verzeichnis nach `sv add paraglide` initialisiert. Routing-Adapter kommt in Story 3.1
- **pnpm-Workspaces**: NICHT genutzt (Single-Package), aber `pnpm-workspace.yaml` durch sv create evtl. nicht erstellt — OK, in Architecture-Doc als optional gelistet

### Project Structure Notes

- BMAD-Output (`_bmad-output/`) + Skills (`_bmad/`) liegen parallel zu SvelteKit-`src/`. Skills bleiben Source-of-Truth, Output gitignored.
- `.claude/projects/` MUSS gitignored sein (Conversation-Transcripts, PII-Risiko).
- Architecture-Doc-Strukturbaum nutzt `navigator-berlin/` als Top-Level — in unserem Repo entspricht das `.` (Working-Directory).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Repository-Initialisierung mit Stack-Foundation] (Acceptance-Criteria-Quelle)
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter: `sv create` (offizielles Svelte CLI)] (Initialization-Command, Adapter-Decision)
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] (21 MUST-Rules)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] (Soll-Struktur, Final-State Phase 1)
- [Source: _bmad-output/planning-artifacts/architecture.md#Async-Patterns (Experimental Async + `<svelte:boundary>`)] (`experimental.async`-Snippet)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Sequence (Story-Reihenfolge Phase 1)] (Cross-Story-Dependencies)
- [Source: _bmad-output/planning-artifacts/prd.md] (Funktionale Anforderungen)
- [Source: ~/.claude/CLAUDE.md] (User-globale Regeln: `@lucide/svelte`, Files <500, kein `any`, kein Hardcoded Data ohne Rückfrage)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via Claude Code CLI — BMAD dev-story workflow

### Debug Log References

- sv-create v0.15.3 non-interaktiv: `pnpm dlx sv create . --template minimal --types ts --no-install --add sveltekit-adapter=adapter:node --no-dir-check --no-download-check`
- sv-add v0.15.3 non-interaktiv: `pnpm dlx sv add prettier eslint vitest=usages:unit,component playwright paraglide=languageTags:en,de,fr,es,it,pl,tr,ar+demo:no tailwindcss=plugins:typography,forms --no-install --no-git-check --no-download-check`
- pnpm v10.32.0, Node v20.19.0
- Paraglide-compile-Trigger vor svelte-check nötig: `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` (vite-plugin generiert sonst nur on dev/build)
- Build-script-Warnings (better-sqlite3, fontnik, lefthook, msgpackr-extract) → deferred zu Story 1.2 (fontnik) und Story 4.3 (lefthook)
- Dev-Server-Port-Belegung: 5173-5183 lokal in use durch andere Projekte, Vite auf 5184 ausgewichen — User's eigener dev auf 5183 für Healthz-Smoke genutzt

### Completion Notes List

- **Greenfield-Init erfolgreich:** Repository auf branch `main` initialisiert, remote `git@github.com:mschmdb/navigator-berlin.git` (private), Initial-Commit `407e6ea` gepusht.
- **Stack-Foundation komplett:** 14 Runtime-Deps + 9 Dev-Deps + 6 Add-ons (prettier, eslint, vitest, playwright, paraglide, tailwindcss v4) installiert. Pakete neuer als Architecture-Doc-Erwartungen (Mai 2026 stable):
  - svelte 5.55.5, sveltekit 2.59.1, vite 8.0.12, vitest 4.1.5 (browser-mode mit `@vitest/browser-playwright`), tailwindcss 4.3.0, eslint 10.3.0, typescript 6.0.3
  - `@lucide/svelte` 1.14.0 (NICHT `lucide-svelte` — CLAUDE.md MUST-Rule #1 verifiziert)
- **AC-Erfüllung:**
  - AC-1: ✓ Minimales SvelteKit-Skelett + TypeScript-strict + adapter-node
  - AC-2: ✓ Alle 6 Add-ons mit Config-Files
  - AC-3: ✓ 14 Runtime-Libs in `dependencies` (AC-Liste hatte 14 Items; Story-Text „13" war Tippfehler)
  - AC-4: ✓ 9 Dev-Libs in `devDependencies`
  - AC-5: ✓ `pnpm install --frozen-lockfile` reproduziert (Task 5)
  - AC-6: ✓ `experimental.async = true` in svelte.config.js, `pnpm dev` startet ohne Errors, `pnpm check` 0/0/847 Files
  - AC-7: ✓ `docs/adr/` mit Template + 11 Stubs
  - AC-8: ✓ Healthz `200 ok` via curl
- **Abweichungen von Story-Wortlaut (alle dokumentiert):**
  - sv-create + sv-add via Flags statt interaktiver Prompts (deterministischer, Funktion identisch)
  - Dev-Port 5184 statt 5173 (alle 5173-5183 lokal belegt; Port-Wahl ist Vite-Default-Verhalten)
  - Fresh-Clone-Sim (Task 10.1) per User-Decision skip (Task 5 ≡ destructive Re-Install bereits durchgeführt; User's dev auf 5183 nicht stören)
- **Paraglide:** 8 Sprachen (`ar, de, en, es, fr, it, pl, tr`) als `messages/<lang>.json` Stub-Files. Routing-Adapter + i18n-Logic kommen in Story 3.1.
- **Build-Scripts deferred:** `pnpm approve-builds` nicht ausgeführt; fontnik/lefthook brauchen native build → Story 1.2 (Glyph-Generator) / 4.3 (Pre-Commit-Hooks).
- **Demo-Files vom sv-add:** `src/lib/vitest-examples/`, `src/routes/demo/*` — sv-create-Defaults. Werden in späteren Stories ersetzt/entfernt (Story 1.7 für /demo, Story 3.1 für Layout).

### File List

**Erstellt durch `sv create` + `sv add` (sv-Default Skeleton, alle committet):**
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `vite.config.ts`, `svelte.config.js`
- `.npmrc`, `.prettierrc`, `.prettierignore`, `.gitignore`, `eslint.config.js`, `playwright.config.ts`
- `.vscode/extensions.json`, `.vscode/settings.json`
- `src/app.html`, `src/app.d.ts`, `src/hooks.ts`, `src/hooks.server.ts`
- `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/layout.css`
- `src/routes/demo/+page.svelte`, `src/routes/demo/playwright/+page.svelte`, `src/routes/demo/playwright/page.svelte.e2e.ts`
- `src/lib/index.ts`, `src/lib/assets/favicon.svg`
- `src/lib/vitest-examples/Welcome.svelte`, `src/lib/vitest-examples/Welcome.svelte.spec.ts`, `src/lib/vitest-examples/greet.ts`, `src/lib/vitest-examples/greet.spec.ts`
- `static/favicon.ico`, `static/favicon.svg`, `static/robots.txt`
- `messages/{ar,de,en,es,fr,it,pl,tr}.json` (8 paraglide stubs)
- `project.inlang/settings.json` (+ `.gitignore`, `.meta.json` — gitignored cache)

**Neu erstellt / modifiziert durch Story 1.1:**
- `svelte.config.js` — `compilerOptions.experimental.async = true` ergänzt (Task 6)
- `package.json` — `fetch`-Stub-Script ergänzt (Task 2.4)
- `.gitignore` — `_bmad-output/`, `_user-input/`, `.claude/projects/` ergänzt (Task 9.3)
- `README.md` — komplette Neufassung (Titel, Pitch, Setup, Stack, MIT) (Task 9.2)
- `LICENSE` — MIT, Copyright Matze Schmidbauer 2026 (Task 9.1)
- `.editorconfig` — neu (sv v0.15.3 generierte keine) (Task 9.4)
- `.nvmrc` — `20` (Task 9.5)
- `docs/adr/ADR-000-template.md` (Template)
- `docs/adr/ADR-001-tile-provider.md` … `docs/adr/ADR-011-on-demand-layer-loading.md` (11 Stubs)
- `docs/runbooks/` (leeres Verzeichnis, Story 4.4)
- `src/routes/api/healthz/+server.ts` — GET → `200 ok` (Task 8)

**Generiert (gitignored, nicht in File List für Review):**
- `node_modules/`, `.svelte-kit/`, `src/lib/paraglide/` (paraglide-compile-Output)

## Change Log

| Date | Change | Files | Commit |
|------|--------|-------|--------|
| 2026-05-11 | Greenfield-Init: SvelteKit-Skelett + adapter-node + TS-strict | sv-create Default-Files | 407e6ea |
| 2026-05-11 | 6 Add-ons via sv add (prettier, eslint, vitest, playwright, paraglide, tailwindcss v4) | eslint.config.js, .prettierrc, vite.config.ts, playwright.config.ts, messages/*, project.inlang/ | 407e6ea |
| 2026-05-11 | 14 Runtime-Deps + 9 Dev-Deps installiert | package.json, pnpm-lock.yaml | 407e6ea |
| 2026-05-11 | experimental.async + fetch-Stub | svelte.config.js, package.json | 407e6ea |
| 2026-05-11 | ADR-Verzeichnis (12 Files) + runbooks-Stub | docs/adr/*, docs/runbooks/ | 407e6ea |
| 2026-05-11 | Healthz-Endpoint | src/routes/api/healthz/+server.ts | 407e6ea |
| 2026-05-11 | README + LICENSE + .gitignore + .editorconfig + .nvmrc | README.md, LICENSE, .gitignore, .editorconfig, .nvmrc | 407e6ea |
| 2026-05-11 | Initial-Push auf private GH-Repo mschmdb/navigator-berlin | n/a | 407e6ea |

## Confirmed Decisions (Solo-Maintainer 2026-05-11)

1. **Git-Init:** ✅ in Story 1.1 enthalten — Task 0 (init) + Task 10.4/10.5 (commit + push)
2. **Project-Root:** ✅ `sv create .` im Working-Dir, KEIN `navigator-berlin/`-Subfolder
3. **`_bmad/`-Versionierung:** ✅ Skills committed, `_bmad-output/` + `_user-input/` + `.claude/projects/` gitignored
4. **GitHub-Remote:** ✅ `git@github.com:mschmdb/navigator-berlin.git` — Repo muss vor Task 0.2 existieren
