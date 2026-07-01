---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
lastStep: step-08-complete
status: complete
completedAt: '2026-05-11T20:00:00Z'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin.md
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin-distillate.md
  - _user-input/berlin-atlas-recherche.md
  - _user-input/navigator-berlin-design.md
workflowType: 'architecture'
project_name: 'navigator.berlin'
user_name: 'Matze Schmidbauer'
date: '2026-05-11'
documentCounts:
  prd: 1
  ux: 1
  brief: 1
  distillate: 1
  research: 1
  designDirective: 1
  projectContext: 0
---

# Architecture Decision Document — navigator.berlin

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (67 FRs Phase 1 + 12 FRs Phase 2/3):**

Sieben FR-Cluster prägen die Architektur:

1. **Adress-Discovery & Geocoding** (FR1–FR6) — Nominatim-Proxy mit IP-Anonymisierung, suggest-as-you-type, fuzzy matching, Berlin-Bbox-Validation. Architektur-Implikation: serverseitiger Geocoding-Adapter mit LRU-Cache (`lru-cache` npm), kein Client-Direct-Call.

2. **Karten-Visualisierung** (FR7–FR13, FR11a–e) — MapLibre Plex-Cartography, Auto-Zoom, Pan/Zoom mit Tastatur, Viewport in URL gespiegelt (deeplinkbar), Layer-Granularität wechselt automatisch mit Zoom-Level (Bezirk → LOR → POI). Architektur-Implikation: Karten-Wrapper-Komponente mit Viewport-State-Sync zur URL, Layer-Manifest mit Zoom-Schwellen, lazy-load nach Hydration.

3. **Layer-System & Inspektor-Panel** (FR14–FR21) — Inspektor-Panel mit allen Hits, Layer-Toggle-Palette via `/`-Shortcut (Desktop) / Bottom-Sheet (Mobile), transparente Layer-Stacks, Daten-Tabellen-Alternative pro Karte/Chart, „Daten nicht vorhanden"-Markierung. Architektur-Implikation: Daten-Zugriffs-Abstraktion `$lib/data/getLayersAtPoint(lat, lng): Promise<LayerHits>` mit Phase-1-Turf.js-Implementierung, Phase-2/3-SQL-Swap ohne Component-Code-Änderung.

4. **Klima-Heritage** (FR22–FR26) — DWD-Stations-Lookup pro Adresse (Dahlem 1719+, Buch, Tempelhof, Brandenburg), LayerChart-Sparklines mit Tastatur-Navigation und Daten-Tabellen-Alternative. Architektur-Implikation: Build-Zeit-Pipeline für DWD-CDC, statische JSON-Bundles pro Station, kein Runtime-API.

5. **Discovery-Surfaces (SEO/AEO)** (FR27–FR33) — ~200 deutsche Basisrouten × 8 Sprachen = ~1.600 prerendered Routen mit eigenem Title/Meta/JSON-LD/OG-Image, FAQ-Sektion pro Bezirk/Kiez (~1.000 × 8 = ~8.000 strukturierte Q&As), Progressive Enhancement (Page ohne JS lesbar). Architektur-Implikation: SvelteKit `prerender = true` pro Route-Family, Build-Pipeline mit OG-Image-Gen via Satori, sitemap.xml-Generator.

6. **LLM-/Agent-Surfaces** (FR34–FR40) — `llms.txt` + `llms-full.txt`, JSON-LD `Place`/`AdministrativeArea`/`Dataset`/`FAQPage`/`WebSite`, WebMCP-Server mit ≥5 Tools + Resources + Prompts. Architektur-Implikation: WebMCP-Adapter-Schicht in `$lib/webmcp/` mit Spec-Version-Manifest, JSON-LD-Generator-Bibliothek pro Page-Typ.

7. **Accessibility & Responsiveness** (FR41–FR49) — Skip-Link, Tastatur-Navigation flächendeckend, ARIA-Live-Inspektor-Panel, parallele DOM-Liste der Karten-POIs, Single-Click-Alternative für Drag, 44×44 Touch-Targets, sichtbare Focus-Ringe ohne Sticky-Verdeckung, `prefers-reduced-motion`-Respekt. Architektur-Implikation: A11y-Layer-Komponenten als First-Class-Pattern, nicht Add-on; CI-Gate axe-core 0 Violations + Lighthouse ≥95.

Plus: **Editorial-Integrität & Lizenz-Transparenz** (FR50–FR55), **i18n** (FR55a–FR55j), **Phase-2/3-Capabilities** (FR56–FR67) als Erweiterungs-Vorbereitung.

**Non-Functional Requirements:**

Sieben NFR-Kategorien mit harten CI-Gates (Performance, Security, Privacy/DSGVO, Accessibility, Integration, Reliability, Maintainability, Internationalization). Architektur-formend:

- **Performance:** LCP <2.5s, INP <200ms, CLS <0.1, Initial JS ≤200KB gzipped, Lighthouse Performance ≥90 / A11y ≥95 / SEO ≥95 / Best Practices ≥95 — alle als CI-Gate.
- **Privacy:** Null `Set-Cookie` aus Production verifiziert, IP-pseudonymisierte Logs (7-Tage-Rotation), kein Tracking, kein Cookie-Banner.
- **Security:** TLS 1.3 forced, Strict CSP ohne `unsafe-inline`, CrowdSec Plugin Streaming-Mode, Hetzner-L3/4-DDoS, kein US-Drittanbieter-Domain (CI-Linter gegen Allowlist).
- **Reliability:** 99% Uptime (Solo-Maintainer-realistisch), Coolify-Auto-Restart, Daily-Backup mit 7d Retention, Disaster-Recovery-Runbooks für Tile-Provider-Switch + CrowdSec-Whitelist.
- **Maintainability:** TypeScript strict, ESLint+Prettier als CI-Gate, ADR-Verzeichnis für signifikante Entscheidungen, ≥80% Coverage für Daten-Transform-Logik, Files <500 Zeilen (CLAUDE.md).
- **i18n:** 8 Sprachen × 4 Skripte (Latin/Latin-ext/Cyrillic/Arabic), Build-Zeit-Übersetzung lokal via Claude Code (kein Runtime-API-Call), Glyph-Packs via fontnik einmalig generiert, RTL via CSS Logical Properties, cookieless URL-Prefix-Routing, Build-Zeit-Budget <15min.

**Scale & Complexity:**

- Primary domain: GovTech/Civic-Tech (EU-Rahmen)
- Complexity level: **High** (laut PRD-classification)
- Estimated architectural components: ~25 Layer × Multi-Source-Pipeline, ~1.600 prerendered Routen, ~8.000 FAQ-Q&As, 5+ WebMCP-Tools, Build-Pipeline mit fetch + reproject + simplify + hash + OG-render + translate, Karte+Inspektor+Layer-Palette+LayerChart-Wrapper als interaktive Kern-Komponenten, A11y-Parallel-Layer, EU-FOSS-Hosting-Stack.

### Technical Constraints & Dependencies

**Stack-Decisions im PRD/Brief vor-getroffen (Architektur erbt, evaluiert nicht neu):**

- **Framework:** SvelteKit v2.x + Svelte 5 Runes + `@sveltejs/adapter-node` (NICHT `adapter-static` — Hybrid-Rendering nötig für Geocoding-Proxy + i18n-Redirect + Phase-2-Live-Endpoints).
- **Build-Toolchain:** pnpm + Vite + mapshaper (GeoJSON-Simplifizierung Build-Zeit) + fontnik (MapLibre-Glyph-Pack einmalig) + Satori oder sharp (OG-Image-SSR).
- **Map-Stack:** MapLibre GL JS + OpenFreeMap Public Instance (Phase 1) mit Tile-Provider-URL hinter Env-Var; Protomaps + PMTiles als Bus-Faktor-Hedge einmalig vorab getestet; eigener Plex-Style-JSON in `static/map-style.json`; Plex-Glyph-Pack in `static/glyphs/{fontstack}/{range}.pbf`.
- **Geo-Compute:** Turf.js (`@turf/boolean-point-in-polygon` + R-Tree-Index) für Punkt-in-Polygon Phase 1; proj4js oder WFS `srsName=EPSG:4326` für Reprojektion EPSG:25833 → 4326.
- **Charts:** LayerChart v2 (`layerchart@next`), Svelte-5-runes-nativ, Plex-Tokens als CSS-Variablen.
- **Geocoding:** Nominatim (selbst gehostet oder Public-Instance mit serverseitigem IP-anonymisiertem Proxy + LRU-Cache 1.000 Einträge, 1 req/s rate-limit).
- **Daten-Quellen Build-Zeit:** FIS-Broker WFS, ODIS GeoJSON-Direktdownload, DWD CDC, OSM Overpass; Retry mit exponentieller Backoff (3×, 1s/2s/4s); Health-Check pro Quelle, Build bricht bei Quellen-Ausfall ab.
- **WebMCP:** `webmcp` npm Package mit Adapter-Schicht in `$lib/webmcp/`, Spec-Version in `webmcp-manifest.json`.
- **DB Phase 1:** keine. Phase 2 = Drizzle + Postgres für tabellarische Daten (Wahl, Klima-Stationen). Phase 3 = PostGIS für räumliche Aggregation.
- **i18n:** lokale Build-Zeit-Übersetzung via Claude Code (`scripts/translate.ts`), Bundles in `src/lib/i18n/{lang}.json` committed.
- **Hosting:** Hetzner-Frankfurt + Coolify + Traefik + CrowdSec Plugin (Streaming-Mode, 60s Decision-Sync). Bewusst kein Cloudflare (US/CLOUD Act). Let's Encrypt via Traefik.
- **Icons:** `@lucide/svelte` (per CLAUDE.md: nicht `lucide-svelte`).

**Constraints aus User-Code-Disziplin (CLAUDE.md):**

- Files <500 Zeilen, sonst Split.
- Keine Backwards-Compat-Hacks, keine Premature-Abstractions.
- Comments nur für nicht-offensichtliche WHYs.
- ISO 27001 / ISO 9001 Patterns als Implementierungs-Linie.
- Reusability vor Neuschreiben.

**Bewusst abgelehnte Optionen (nicht erneut evaluieren):**

- Cloudflare CDN/WAF — US/CLOUD Act + Default-Cookies untergraben EU-only.
- Redis/Dragonfly Cache — Browser+Static-File-Cache + In-Process LRUCache reicht.
- Eigener MCP-Server (`navigator-berlin-mcp`) — WebMCP browser-side ersetzt das.
- Forken Amsterdam Atlas — User hat Code geskimmt, "war nicht beeindruckt".
- Plausible/Matomo/Analytics — Cookieless-Linie kompromisslos.
- Drizzle/Postgres in Phase 1 — Skeleton würde Surface unnötig vergrößern.
- Service-Worker/Offline-Mode Phase 1 — kein UX-Treiber.
- `query.live` in Phase 1 — experimental, breaking changes 2026.

### Cross-Cutting Concerns Identified

Acht Concerns spannen über alle Komponenten und müssen architektonisch durchgängig adressiert werden — nicht als Add-on, sondern als Default-Pattern:

1. **i18n + RTL** — URL-Prefix-Routing (`/{lang}/...`), `Accept-Language`-Server-Redirect (302, kein Cookie), Logical CSS Properties als Default, Glyph-Pack-Coverage für 4 Skripte, `hreflang`-Cluster + `x-default` pro Page, Translation-Bundle-Loading.

2. **Accessibility** — Karten-A11y-Layer als parallele DOM-Liste mit `<button>`-Reihe für POIs/Boundaries, Daten-Tabellen-Toggle pro Visualisierung, ARIA-Live für Inspektor-Panel-Updates, Skip-Link-Pattern, `role="application"` mit `aria-describedby` für Karte. CI-Gate via Playwright + axe-core, Lighthouse ≥95.

3. **SEO/AEO** — JSON-LD-Generator-Bibliothek (Place/AdministrativeArea/Dataset/FAQPage/WebSite/SearchAction), `<svelte:head>` pro Route mit dynamischem Title+Meta, sitemap.xml-Build-Step, llms.txt + llms-full.txt-Generator, Canonical-URL-Pattern.

4. **Datenstand & Lizenz-Provenienz** — pro Layer Source-URL + Abruf-Datum + Lizenz + SHA-256 in `static/layers/MANIFEST.json`, automatisch generierte Lizenz-Matrix unter `/lizenzen` und im Footer, „Stand: YYYY-MM, Quelle: X"-Mikro-Detail im Inspektor-Panel pro Wert, „Fehler im Eintrag?"-Mailto pro Layer.

5. **Editorial-Verantwortung** — Stolpersteine + Mauer/Sektoren mit Quellen-Verlinkung + historischem Stand-Hinweis, Mietspiegel/Bodenrichtwert-Disclaimer („ersetzt keine rechtliche Aussage"), keine LLM-Generierung user-facing für sensible Inhalte, sensible Layer NICHT maschinell übersetzt.

6. **Cookieless-Architektur** — null `Set-Cookie` Server-Side, kein LocalStorage für Persistierung, URL-State (Viewport, Layer, Sprache, Adresse) als einzige Persistenz, IP-pseudonymisierte Webserver-Logs (7d Rotation), CSP ohne externe Quellen.

7. **Performance-Disziplin** — MapLibre lazy-load nach Hydration, Plex Variable Font subsetted (`latin` + `latin-ext` + `cyrillic` + `arabic`), Critical-CSS inline, Static-Assets `immutable`-Cache + Filename-Hashing, HTML `max-age=3600 must-revalidate`, In-Process LRUCache für berechnete Outputs.

8. **Build-Reproduzierbarkeit** — `pnpm install && pnpm fetch && pnpm build` deterministisch, Datenstand-Manifest mit SHA pro Layer-File, Translation-Bundles committed, Glyph-Pack committed, OG-Images zur Build-Zeit gerendert mit Hash-basierter Cache-Invalidation.

**Phase-Boundaries als architektonische Hedge-Punkte:**

- Daten-Abstraktion `$lib/data/` muss Phase-2-SQL-Swap erlauben ohne Component-Code-Änderung.
- WebMCP-Adapter muss Pre-1.0-Spec-Breaking-Change abfangen.
- Tile-Provider-URL hinter Env-Var muss OpenFreeMap → Protomaps-Switch als Config-Edit + Deploy erlauben.
- Phase-2-Live-Endpunkte müssen Health-Check + Graceful-Skip-Pattern bereits in Phase-1-Inspektor-Panel-Architektur vorbereitet sein (Layer-Slot mit „nicht verfügbar"-Fallback).

## Starter Template Evaluation

### Primary Technology Domain

**Web Application** — SvelteKit Hybrid (`adapter-node`) mit Prerendering für SEO-Routen + Client-Hydration für Karte/Inspektor-Panel. Greenfield (kein `package.json` vorhanden).

### Starter Options Considered

| Option | Bewertung |
|--------|-----------|
| **`npx sv create` (offiziell, Svelte CLI, Stand Mai 2026)** | ✓ Empfohlen — minimales Skelett, deterministische Konfiguration, offiziell gewartet, Svelte-5-Runes-Default |
| `watergis/sveltekit-maplibre-boilerplate` | Abgelehnt — eager MapLibre-Load verletzt NFR-P9, kein eigener Map-Style, kein A11y-Layer, hardcoded Tile-Provider |
| `LorisSigrist/paraglide-sveltekit-example` | Nicht als Starter — als Reference-Pattern für Paraglide-Routing genutzt |
| From-Scratch (`pnpm init` + manuell) | Redundant zur `sv`-Skelett-Generierung |
| SaaS-Boilerplates (skeleton, shadcn-svelte-Starter) | Abgelehnt — überdimensioniert (Auth/Payments/Admin), Component-Style würde Design-Direktive verwässern |

### Selected Starter: `sv create` (offizielles Svelte CLI)

**Rationale for Selection:**

- **Offiziell + aktiv gewartet** — Svelte-Team-eigenes Tool, Mai-2026-Updates für Svelte 5 / TypeScript 6.0 / Community-Add-ons.
- **Minimal-Skelett** — keine fremden Architektur-Entscheidungen, nur Standard-Setup. Stack-spezifische Libs (MapLibre, LayerChart, WebMCP, Turf, Bits UI, Satori, fontnik, mapshaper, lru-cache) werden gezielt per `pnpm add` in Story-1 nachgezogen.
- **Add-on-System deckt Standard-Tooling ab** — TypeScript strict, ESLint, Prettier, Vitest, Playwright, Paraglide, Tailwind direkt verfügbar via Prompts.
- **Adapter-Wahl prompted** — `@sveltejs/adapter-node` direkt selektierbar (PRD-Pflicht).
- **Svelte 5 Runes als Default** — passt zu LayerChart-v2-runes-nativ und Component-Patterns mit `$state`/`$derived`.
- **Reproduzierbarer Build** — deterministische Skelett-Generierung, NFR-M1.

**Initialization Command:**

```bash
pnpm dlx sv create navigator-berlin \
  --template=minimal \
  --types=ts \
  --no-install
cd navigator-berlin
pnpm dlx sv add prettier eslint vitest playwright paraglide tailwindcss
pnpm install
```

Während `sv create` interaktiv: `@sveltejs/adapter-node` als Adapter wählen, danach in `svelte.config.js` verifiziert. TypeScript `strict: true` per Default aktiv.

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript strict mode, `tsconfig.json` mit SvelteKit-Defaults.
- Node.js LTS (≥20.x), pnpm als Package-Manager.
- Svelte 5 mit Runes als Default-Reactivity-Modell.

**Styling Solution:**
- **Tailwind CSS v4** als Utility-Layer mit CSS-Variables-First-Architektur.
- Design-Tokens (Off-White-Palette, Plex-Font-Stack, AAA-Kontraste, Chart-Token-Layer aus Design-Direktive) werden in `src/app.css` via `@theme`-Directive als Source-of-Truth definiert.
- Tailwind v4 Logical Properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) für RTL-Layout (NFR-IL4) ohne separates Stylesheet.
- Critical-CSS inline via SvelteKit-Default-Hydration-Mechanismus.
- Tree-shaking generiert nur genutzte Klassen → unterstützt NFR-P5 (Initial JS ≤200KB gzipped).

**Build Tooling:**
- Vite als Bundler (SvelteKit-Default), HMR, Code-Splitting per Route.
- ESLint mit `@sveltejs/eslint-config` + TypeScript-Plugin (NFR-M4).
- Prettier mit `prettier-plugin-svelte` + `prettier-plugin-tailwindcss` (NFR-M4).
- Build-Output-Verzeichnis `build/` (adapter-node Default).

**Testing Framework:**
- **Vitest** für Unit-Tests (Daten-Transform-Logik, Reprojektion, Punkt-in-Polygon, Layer-Hit-Berechnung — NFR-M5 ≥80% Coverage).
- **Playwright** für E2E + Smoke-Tests (Top-3-Journeys), `@axe-core/playwright`-Integration für CI-A11y-Gate (NFR-A1, NFR-A3).
- KEIN Storybook — Komponenten-Dev erfolgt direkt in Routes via `+page.svelte`-Showcases falls nötig.

**Code Organization (sv-Default + Project-Convention):**
- `src/routes/[lang=lang]/` — SvelteKit-File-Based-Routing mit Sprach-Prefix-Param-Matcher.
- `src/lib/` — Shared Code, importierbar via `$lib/`.
  - `src/lib/components/ui/` — generische UI-Wrapper um Bits-UI-Primitives (Button, Dialog, Combobox, Popover, Tooltip, ToggleGroup, ScrollArea), gestaltet via Tailwind-Klassen + Design-Tokens.
  - `src/lib/components/atlas/` — domain-spezifische Komponenten (`<MapLibreCanvas>`, `<InspectorPanel>`, `<LayerPalette>`, `<ClimateSparkline>`, `<DataTableAlternative>`, `<LayerToggle>`, `<LicenseFooter>`).
  - `src/lib/data/` — Daten-Zugriffs-Abstraktion (`getLayersAtPoint`, `getKiezProfile`, etc.).
  - `src/lib/webmcp/` — WebMCP-Adapter-Schicht (Spec-Version-Manifest, Tool-/Resource-/Prompt-Registrierung).
  - `src/lib/seo/` — JSON-LD-Generatoren, llms.txt-Builder.
  - `src/lib/i18n/` — Paraglide-Bundles (committed).
  - `src/lib/server/` — Server-only Code (Geocoding-Proxy, OG-Image-Renderer), automatisch nicht client-bundled.
- `static/` — statische Assets (`layers/*.geojson`, `layers/MANIFEST.json`, `glyphs/{fontstack}/{range}.pbf`, `map-style.json`, OG-Images).
- `scripts/` — Build-Zeit-Scripts (`fetch-static.ts`, `translate.ts`, `generate-og-images.ts`, `build-glyphs.ts`).
- `tests/` — Playwright-E2E-Suite.
- `docs/` — ARCHITECTURE.md, ADR-Verzeichnis (`docs/adr/ADR-NNN-*.md`), Runbooks (`docs/runbooks/`).

**Development Experience:**
- `pnpm dev` — Vite-Dev-Server mit HMR.
- `pnpm build` — Production-Build mit adapter-node-Output.
- `pnpm preview` — lokale Preview des Production-Builds.
- `pnpm test` — Vitest Watch-Mode.
- `pnpm test:e2e` — Playwright-Suite.
- `pnpm check` — `svelte-check` mit TypeScript-Strict-Validation.
- `pnpm lint` / `pnpm format` — ESLint + Prettier.
- `pnpm fetch` — Build-Zeit-Daten-Pipeline (`scripts/fetch-static.ts`).

**Add-ons selektiert via `sv add`:**
- `prettier` — Code-Formatierung (NFR-M4).
- `eslint` — Lint-Gate (NFR-M4).
- `vitest` — Unit-Test-Framework (NFR-M5).
- `playwright` — E2E inkl. axe-core-Integration (NFR-A1, NFR-M5).
- `paraglide` — Compiler-basiertes i18n mit URL-Routing-Adapter, tree-shakable Translations (FR55a–j, NFR-IL1–10).
- `tailwindcss` — Utility-CSS v4 mit `@theme`-Directive für Design-Tokens.

**Add-ons explizit NICHT selektiert:**
- `drizzle` — Phase 1 keine DB (Distillate, Phase 2/3-Deferral).
- `lucia` — keine Auth (Anti-Goal).
- `mdsvex` — keine Markdown-Routes Phase 1 (FAQ-Inhalte werden datengeneriert, nicht editorial geschrieben).
- `storybook` — kein Komponenten-Showcase nötig, Design-Direktive ist verbindlich.

**Stack-spezifische Libs nachgezogen via `pnpm add` (Story 1.1: Repository-Initialisierung):**

```bash
pnpm add maplibre-gl
pnpm add layerchart@next d3-scale d3-interpolate d3-array
pnpm add @turf/boolean-point-in-polygon @turf/helpers @turf/distance rbush
pnpm add lru-cache
pnpm add @lucide/svelte
pnpm add bits-ui
pnpm add webmcp
pnpm add -D mapshaper fontnik proj4 satori @resvg/resvg-js
```

**Component-Strategie:**

- **Bits UI** als headless Primitive-Library (Dialog, Combobox, Popover, Tooltip, ToggleGroup, ScrollArea, etc.) — accessible-by-default, ARIA-compliant, Tastatur-Navigation eingebaut. Erfüllt WCAG 2.2 AA (NFR-A1) ohne eigene A11y-Re-Implementierung.
- **Eigene UI-Komponenten** in `src/lib/components/ui/` wrappen Bits-UI-Primitives mit Tailwind-Klassen + Design-Tokens. Design-Direktive bleibt verbindlich (Hairline-Borders, Off-White-Palette, keine Schatten/Gradienten, Gestalt-Prinzipien tragen Struktur).
- **Domain-Komponenten** in `src/lib/components/atlas/` für Karte / Inspektor-Panel / Layer-Palette / Climate-Sparkline / Data-Table-Alternative.
- **Kein shadcn-svelte** — Component-Style würde Design-Direktive verwässern; Bits UI direkt + eigene Klassen ergibt sauberer Look gemäß Direktive.

**Note:** Project initialization using these commands should be the first implementation story (Story 1.1: Repository-Initialisierung). Adapter-Auswahl `@sveltejs/adapter-node` ist während `sv create` interaktiv, danach in `svelte.config.js` verifiziert.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Framework, Adapter, Sprache, Daten-Architektur Phase 1, Hosting-Stack, Geocoding-Mode, i18n-Routing, A11y-Tooling.

**Important Decisions (Shape Architecture):**
- Layer-Loading-Strategie, OG-Image-Engine, State-Management-Pattern, Sitemap-Strategie, Map-Style-Source, CI-Provider, Instance-Sizing.

**Deferred Decisions (Post-MVP):**
- Drizzle-Schema-Design (Phase 2 vor Wahl-Layer-Implementation).
- PostGIS-Aggregation-Pattern (Phase 3 vor Cross-Layer-Query-Layer).
- Live-Endpoint-Polling-Pattern (Phase 2 vor BVG/BLUME/Wetter — `query.live` vs. `load`-Polling abhängig von Spec-Status).
- Embed-/oEmbed-Schema (Phase 2 vor Tagesspiegel-Embed).
- RADOLAN-Sidecar-Container (Python FastAPI + wradlib, Phase 2).

### Data Architecture

**Decision:** Statisches GeoJSON in `static/layers/` mit Filename-Hashing + zentralem `MANIFEST.json`. Phase 2 Drizzle/Postgres-Backfill für tabellarische Daten. Phase 3 PostGIS für räumliche Aggregation.

**Geometry-Format Phase 1:** GeoJSON simplified via `mapshaper` (Build-Zeit). Turf.js liest GeoJSON nativ, Build-Pipeline bleibt deterministisch. FlatGeobuf/PMTiles als Phase-3-Optimierung verworfen — vorzeitige Skalierungs-Entscheidung.

**Spatial Index:** `rbush` R-Tree pro Layer beim Client-Hydrate-Time gebaut. Punkt-in-Polygon via `@turf/boolean-point-in-polygon` über R-Tree-Hits.

**Layer-Loading-Strategie:** **On-Demand-`fetch()` pro Layer beim Toggle/Hover/Klick** + In-Process LRUCache (`lru-cache`, 50 Layer max). Eager-Bundle würde NFR-P5 (≤200KB Initial-JS gzipped) brechen bei 25+ Layern. Layer werden mit `cache-control: public, max-age=2592000, immutable` ausgeliefert (NFR-P10), Cache-Invalidation per Filename-SHA.

**Reprojektion:** EPSG:25833 → EPSG:4326 zur Build-Zeit via WFS-Request `srsName=EPSG:4326` wo möglich, sonst `proj4` als Fallback in `scripts/fetch-static.ts`. Spotcheck mit 5 Sample-Punkten gegen erwartete Koordinaten (NFR-I3).

**Daten-Manifest:** `static/layers/MANIFEST.json` mit pro Layer: Source-URL, Abruf-Datum, Lizenz, SHA-256, Zoom-Schwellen für Layer-Granularität-Switch (FR11e), Saisonalitäts-Hinweis (Trinkbrunnen FR21).

**Datenzugriffs-Abstraktion:** `$lib/data/` mit typesafem Interface:

```typescript
interface LayerHit { layer: string; value: unknown; source: string; updatedAt: string; license: string; }
async function getLayersAtPoint(lat: number, lng: number): Promise<LayerHit[]>;
async function getKiezProfile(slug: string): Promise<KiezProfile>;
async function getLayerMetadata(layer: string): Promise<LayerMetadata>;
```

Phase-1-Implementation: Turf.js + statisches GeoJSON. Phase-2/3-Swap: identisches Interface, Implementation auf Drizzle/PostGIS-Queries. Component-Code bleibt unverändert.

**Caching:** Browser-Cache (HTTP-Header) als primäre Schicht, In-Process `lru-cache` für berechnete Outputs (Geocoding-Hits, Layer-Hit-Berechnungen). Kein Redis/Dragonfly (Distillate explizit abgelehnt).

### Authentication & Security

**Authentication:** **Keine.** Anti-Goal aus Brief/Distillate. Kein User-Account, kein Login, kein Cookie für Session.

**Authorization:** N/A.

**Security-Stack:**

- **TLS 1.3 forced** via Traefik, ältere Protokolle deaktiviert. Let's Encrypt mit Auto-Renewal, Zertifikat-Lücke <24h (NFR-S1, NFR-S2).
- **Strict Content-Security-Policy** ohne `unsafe-inline`, ohne externe Script-/Style-Quellen außer self-hosted Plex-Fonts und Glyph-Pack (NFR-S3).
- **HTTP-Security-Header** (NFR-S4): `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` defensiv (geolocation/camera/microphone disabled).
- **Layer-7-Schutz:** CrowdSec-Plugin in Traefik, Streaming-Mode mit 60s Decision-Sync (NFR-S5). Collections: `crowdsecurity/traefik`, `crowdsecurity/http-cve`, `crowdsecurity/whitelist-good-actors`, `crowdsecurity/base-http-scenarios`, `crowdsecurity/sshd`, `crowdsecurity/linux`. Captcha-Remediation als Default statt Hard-Ban. AppSec/WAF-Funktion einschaltbar bei Bedarf (Plugin 1.2.0+).
- **Layer-3/4-DDoS:** Hetzner-eingebauter Schutz, kostenlos, ausreichend für realistische Civic-Tech-Angriffsvektoren (NFR-S6).
- **CI-Linter gegen US-Drittanbieter-Allowlist:** Build-Step prüft alle `fetch()`/Asset-URLs gegen Allowlist (Hetzner/Frankfurt-Domains, OpenFreeMap, FIS-Broker, ODIS, daten.berlin.de, OSM, DWD). Build bricht bei Violation (NFR-S7).
- **SSH-Zugang:** nur Key-Auth, kein Passwort-Login, dedizierter Admin-Account ohne Root-Login (NFR-S8).
- **Privacy:** null `Set-Cookie` aus Production verifiziert via Response-Header-Inspect-Test in CI (NFR-PR1). IP-pseudonymisierte Webserver-Logs (letztes Oktett gekürzt), 7-Tage-Rotation (NFR-PR4).

**ISO 27001-konforme Patterns:** Access-Control-Trennung (Hetzner-Admin-Account ≠ Coolify-User ≠ Container-User), Least-Privilege für Container, Audit-Logs via Coolify, Daily-Backup mit 7d Retention (NFR-R4), Disaster-Recovery-Runbooks (NFR-R6).

### API & Communication Patterns

**Public API:** **Keine.** Anti-Goal. Keine REST/GraphQL-Endpoints für Drittnutzer.

**Server-Endpoints (SvelteKit `+server.ts` minimal):**

- `GET /api/geocode?q=...` — Server-Proxy für Nominatim mit IP-Anonymisierung + LRU-Cache (1.000 Einträge) + Rate-Limit 1 req/s gegen OSM-Public-Instance (NFR-I6, NFR-PR2).
- `GET /api/og/[type]/[slug].png` — On-Demand-OG-Image-Renderer (Build-Time-Cache, Hash-basierte Invalidation).
- `GET /healthz` — Container-Health für Coolify-Auto-Restart.

**WebMCP-Communication:** WebMCP-Adapter-Schicht in `$lib/webmcp/`. Tool-Schema-Pattern:

```typescript
registerTool({
  name: 'address_lookup',
  description: 'Look up Berlin address, return all layer hits + boundary hierarchy',
  inputSchema: { /* JSON-Schema */ },
  handler: async (input) => { /* delegiert an $lib/data/getLayersAtPoint */ }
});
```

WebMCP-Manifest in `static/webmcp-manifest.json` mit Spec-Version. Bei Pre-1.0-Breaking-Change: Adapter-Schicht aktualisieren, Tools/Resources/Prompts bleiben semantisch stabil (NFR-I7).

5+ Tools (FR37): `address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`. Resources (FR38): aktive Adresse + geladene Layer als URI-adressierbares Datenmodell. Prompt-Templates (FR39): mindestens 3 (`address_overview`, `compare_kieze`, `explain_layer`).

**Error Handling:** SvelteKit-`error()`-Helper für `HttpError` (404/500). `+error.svelte` als Top-Level-Error-Boundary, lokalisiert pro Sprache. Layer-Hits ohne Coverage werden NICHT als Error behandelt — explizit als „Daten nicht vorhanden" im Inspektor-Panel (FR20).

**Rate-Limiting:** Geocoding-Proxy 1 req/s gegen OSM (NFR-I6). Allgemeine Site-Rate-Limits via CrowdSec-Scenarios (Brute-Force, Path-Traversal, etc.). Kein App-Level-Rate-Limit nötig.

**Service-Communication:** Phase 1 Single-Service. Phase 2 Drizzle als Library-Import (kein separater Service). Phase 2 RADOLAN als Python-Sidecar via Coolify-Compose (Service-to-Service über Internal-Network, kein Public-Endpoint).

### Frontend Architecture

**State Management:** **Svelte 5 Runes via Context-API + URL-State only.** Keine zusätzliche Store-Bibliothek.

URL ist Source-of-Truth für deeplinkbare State (FR11d):

- `?bbox=...,...,...,...` — Karten-Viewport
- `?zoom=...` — Zoom-Level
- `?layers=mietspiegel,laerm-night` — aktive Layer als CSV
- `?address=...` — selektierte Adresse (URL-encoded)
- `?lang=de|en|tr|uk|ar|es|fr|it` — implizit via Path-Prefix `/{lang}/`

Cross-Component-State (z.B. Inspektor-Panel-Open-State, Layer-Palette-Visibility) via **Context-API** (`setContext`/`getContext`) — NICHT Module-Scope-`$state` wegen SSR-State-Leak-Risiko zwischen Requests:

```typescript
// src/lib/state/ui-context.ts
import { getContext, setContext } from 'svelte';
const KEY = Symbol('ui-state');

export function createUiState() {
  const state = $state({
    inspectorOpen: false,
    paletteOpen: false,
    selectedLayerHits: [] as LayerHit[]
  });
  setContext(KEY, state);
  return state;
}

export function getUiState() {
  return getContext<ReturnType<typeof createUiState>>(KEY);
}
```

`createUiState()` in `+layout.svelte` einmal per Request, `getUiState()` in beliebigen Children. Kein `localStorage`/`sessionStorage` (Cookieless-Linie). Persistenz ausschließlich via URL.

**Component Architecture:**

- **Bits UI** als headless Primitives (Dialog, Combobox, Popover, Tooltip, ToggleGroup, ScrollArea, etc.) — accessible-by-default, Tastatur-Nav eingebaut.
- **`src/lib/components/ui/`** — generische Wrapper um Bits-UI mit Tailwind-Klassen + Design-Tokens.
- **`src/lib/components/atlas/`** — Domain-Komponenten:
  - `<MapLibreCanvas>` — Karten-Wrapper, lazy-load post-hydration.
  - `<MapAccessibilityLayer>` — parallele DOM-Liste der POIs/Boundaries als `<button>`-Reihe (NFR-A4 / FR44).
  - `<InspectorPanel>` — Layer-Hits + Datenstand + Mailto-Feedback, ARIA-Live (FR43).
  - `<LayerPalette>` — `/`-Shortcut Quick-Search (Desktop) / Bottom-Sheet (Mobile).
  - `<ClimateSparkline>` — LayerChart-Wrapper mit Daten-Tabellen-Toggle.
  - `<DataTableAlternative>` — generischer Visualisierungs-Toggle für Karten/Charts (FR19, NFR-A9).
  - `<LicenseFooter>` — auto-generiert aus `MANIFEST.json` (FR54).
  - `<LangSwitcher>` — Sprach-Switcher im Footer (FR55d).
  - `<SkipLink>` — Erstes fokussierbares Element (FR41).

**Routing-Strategie:**

- SvelteKit File-Based-Routing mit Sprach-Param-Matcher.
- Route-Struktur:

```
src/routes/
  [lang=lang]/
    +layout.svelte              # Skip-Link, Footer, Lang-Switcher
    +layout.server.ts           # Accept-Language Redirect bei Root
    +page.svelte                # Landing
    bezirk/[slug]/+page.svelte  # prerendered, ~12 × 8 = 96 routes
    kiez/[slug]/+page.svelte    # prerendered, ~138 × 8 = 1104 routes
    layer/[slug]/+page.svelte   # prerendered, ~25 × 8 = 200 routes
    lizenzen/+page.svelte       # prerendered
    architektur/+page.svelte    # prerendered
    +error.svelte               # localized error boundary
  api/
    geocode/+server.ts
    og/[type]/[slug].png/+server.ts
    healthz/+server.ts
  llms.txt/+server.ts
  llms-full.txt/+server.ts
  sitemap.xml/+server.ts
  sitemap-[lang].xml/+server.ts
```

Param-Matcher `src/params/lang.ts`:

```typescript
export const match = (param: string): boolean =>
  ['de', 'en', 'tr', 'uk', 'ar', 'es', 'fr', 'it'].includes(param);
```

`prerender = true` pro Route-File für alle SEO-Routen (FR33). API-Routes dynamic.

**Performance-Optimierung:**

- **MapLibre lazy-load nach Hydration** via Dynamic-Import (`await import('maplibre-gl')`) im `<MapLibreCanvas>` `onMount` (NFR-P9).
- **Plex Variable Font subsetted** auf `latin`, `latin-ext`, `cyrillic`, `arabic` mit `font-display: swap` (NFR-IL3, NFR-P6).
- **Critical-CSS inline** via SvelteKit-Default für Above-the-Fold (Hero, Bezirks-Lead).
- **Code-Splitting per Route** (SvelteKit-Default).
- **Vite-`manualChunks`** für MapLibre + LayerChart in eigene Async-Chunks, damit Initial-Bundle <200KB gzipped (NFR-P5):

```js
// vite.config.ts
build: { rollupOptions: { output: { manualChunks: {
  maplibre: ['maplibre-gl'],
  layerchart: ['layerchart', 'd3-scale', 'd3-interpolate', 'd3-array'],
  turf: ['@turf/boolean-point-in-polygon', '@turf/helpers', '@turf/distance', 'rbush']
} } } }
```

- **Dynamic OG-Images** zur Build-Zeit gerendert via Satori + `@resvg/resvg-js`. Karten-Snapshot pre-rendered per Bezirk/Kiez als statisches PNG, Satori überlagert Plex-Text + Statistik-Highlights. Cache-Invalidation per Hash.
- **Bundle-Disziplin** als CI-Gate: PR-Build schlägt fehl bei >200KB Initial-JS gzipped.

**SEO/AEO-Stack:**

- **`<svelte:head>`** pro Route mit dynamischem Title + Meta-Description aus Daten (FR32).
- **JSON-LD-Generator-Bibliothek** in `$lib/seo/` für `Place`, `AdministrativeArea`, `Dataset`, `FAQPage`, `WebSite`+`SearchAction` (FR36).
- **Sitemap-Strategie:** Sitemap-Index `/sitemap.xml` referenziert 8 Per-Sprache-Sitemaps `/sitemap-{lang}.xml` (cleaner für hreflang-Cluster).
- **`/llms.txt`** und **`/llms-full.txt`** als SvelteKit-`+server.ts`-Endpoints, build-time generiert (FR34, FR35).
- **`hreflang`-Cluster** + `x-default` (Deutsch) pro Page (FR55e, NFR-IL7).
- **Canonical-URLs** pro Page für Duplicate-Content-Vermeidung.

### Infrastructure & Deployment

**Hosting:** Hetzner-Frankfurt **CX32** (8GB RAM / 4 vCPU / 80GB SSD, ~12€/Mon). Build-Runner braucht Headroom für Satori + 1.600-Routen-Prerender + mapshaper-Simplifizierung + DWD-CDC-Parse. Single-Instance, kein Cluster (NFR-R1: 99% Uptime realistisch).

**Container-Orchestration:** Coolify (Docker-Compose-Layer) mit Auto-Restart bei Crash, Restart-Lücke <60s (NFR-R2). Daily-Backup der Volumes mit 7d Retention (NFR-R4).

**Reverse-Proxy:** Traefik mit Let's-Encrypt-Auto-Renewal + CrowdSec-Plugin. TLS-Termination, HTTP→HTTPS-Redirect, Security-Header-Injection.

**Phase-2-Erweiterung:** Drizzle+Postgres als zusätzlicher Container in Coolify-Compose. RADOLAN-Sidecar als Python-FastAPI-Container mit `wradlib`. Internal-Network-Communication, kein Public-Endpoint.

**CI/CD:** **GitHub Actions** (mehr Free-Minutes, breitere Action-Library, axe-core/Lighthouse-Actions verbreitet). Alternativ Forgejo Actions falls Repo nach Codeberg umzieht.

Pipeline:

```yaml
1. checkout + pnpm install --frozen-lockfile
2. lint (ESLint + Prettier --check)            # NFR-M4
3. typecheck (svelte-check)                    # NFR-M3
4. unit-test (vitest --run --coverage ≥80%)    # NFR-M5
5. build (pnpm fetch + pnpm build)             # NFR-I1, NFR-M1
6. e2e (playwright + @axe-core/playwright)     # NFR-A1, NFR-M5
7. lighthouse-ci (Performance ≥90, A11y ≥95, SEO ≥95, Best Practices ≥95)
8. bundle-size-check (Initial-JS ≤200KB gzipped → PR fail bei Überschreitung) # NFR-P5
9. us-domain-allowlist-check (Build-asset-URLs gegen Allowlist) # NFR-S7
10. cookie-leak-check (Response-Header-Test gegen Set-Cookie)   # NFR-PR1
11. deploy → Hetzner via Coolify-Webhook (nur main-Branch)
```

**Environment-Configuration:** SvelteKit `$env/static/private` + `$env/static/public` für:

- `PUBLIC_TILE_URL` — Tile-Provider (OpenFreeMap default, Protomaps-Fallback per Env-Switch)
- `NOMINATIM_ENDPOINT` — Geocoding-Backend (Public-Instance default)
- `WEBMCP_SPEC_VERSION` — Spec-Pin für Adapter-Validation
- `BUILD_DATA_SOURCES` — Toggle für Build-Zeit-Quellen (Smoke-Test-Modus mit Dummy-Daten möglich)

**Monitoring/Logging:** IP-pseudonymisierte Traefik-Access-Logs mit 7d-Rotation (NFR-PR4). Coolify-Container-Health-Dashboard. Kein externes Monitoring (Anti-Tracking-Linie). Status-Check via `/healthz`-Endpoint (Container-Health).

**Geocoding-Mode:** Public Nominatim-Instance + Server-Proxy in `+server.ts` mit:

- IP-Anonymisierung (IP wird nicht weitergegeben)
- LRU-Cache 1.000 Einträge
- Rate-Limit 1 req/s gegen OSM-Public-Instance (NFR-I6)
- User-Agent-Header `navigator.berlin/1.0`

Self-Host-Nominatim auf Hetzner verworfen — eigener 8GB-RAM-Container für Phase 1 übertrieben. Phase-2-Reevaluation falls Public-Instance unzuverlässig wird.

**Repository:** Public GitHub mit MIT-Lizenz für Code, dl-de-Footer für Daten (NFR-M2). README + ARCHITECTURE.md + ADR-Verzeichnis (`docs/adr/ADR-NNN-*.md`) für recruiter-readable Artefakte. Disaster-Recovery-Runbooks in `docs/runbooks/` (Tile-Provider-Switch, CrowdSec-False-Positive-Whitelist, Datenbank-Restore P2+).

**Domain:** `navigator.berlin` mit Auto-Renewal-Pay aktiviert + 60-Tage-Vorab-Erinnerung per E-Mail (NFR-R5).

### Decision Impact Analysis

**Implementation Sequence (Story-Reihenfolge Phase 1):**

1. **Story 1.1: Repository-Initialisierung** — `sv create` + Add-ons + Stack-Libs + ESLint-/Prettier-/TS-Strict-Config + Smoke-Test (`pnpm dev` startet, Hello-World-Page rendert).
2. **Story 1.2: Design-Token-Setup** — Tailwind v4 `@theme` mit Plex-Tokens, Plex-Variable-Fonts subsetted committed, `app.css` mit Critical-CSS, Bits-UI-Wrapper-Komponenten in `ui/`.
3. **Story 1.3: i18n-Routing** — Paraglide + Param-Matcher + `+layout.server.ts` Accept-Language-Redirect + `[lang=lang]`-Routes + Sprach-Switcher-Komponente.
4. **Story 1.4: Daten-Pipeline** — `scripts/fetch-static.ts` für FIS-Broker WFS + ODIS + DWD CDC + OSM Overpass; mapshaper-Simplifizierung; `MANIFEST.json`-Generator.
5. **Story 1.5: Daten-Zugriffs-Abstraktion** — `$lib/data/`-Module mit Turf.js + rbush + LRUCache.
6. **Story 1.6: Karte + A11y-Layer** — `<MapLibreCanvas>` mit Lazy-Load + `<MapAccessibilityLayer>` parallele DOM-Liste + URL-State-Sync.
7. **Story 1.7: Inspektor-Panel** — `<InspectorPanel>` mit ARIA-Live + Layer-Hits + Datenstand-Banner + Mailto-Feedback.
8. **Story 1.8: Layer-Palette** — `/`-Shortcut Desktop + Bottom-Sheet Mobile.
9. **Story 1.9: Klima-Heritage** — DWD-Stations-Lookup + LayerChart-Sparklines + Daten-Tabellen-Toggle.
10. **Story 1.10: SEO/AEO-Stack** — JSON-LD-Generator + Sitemap-Index + llms.txt/-full.txt + Canonical-URLs + hreflang.
11. **Story 1.11: WebMCP-Integration** — Adapter + 5 Tools + Resources + Prompts + Manifest.
12. **Story 1.12: OG-Image-Pipeline** — Build-Time Satori + resvg + Karten-Snapshot-Pre-Render.
13. **Story 1.13: FAQ-Sektion + Bezirks-/Kiez-/Layer-Pages** — datengeneriert mit JSON-LD `FAQPage`.
14. **Story 1.14: Translation-Pipeline** — `scripts/translate.ts` mit Claude-Code lokal, Build-Step für 7 Zielsprachen.
15. **Story 1.15: Hosting-Setup + CI/CD** — Coolify-Compose + Traefik + CrowdSec-Plugin + GitHub Actions Pipeline + Lighthouse/axe-Gates.
16. **Story 1.16: Editorial-Verantwortung-Pattern** — Stolperstein-Quellen-Verlinkung + Mauer/Sektoren-Disclaimer + Mietspiegel-Disclaimer + Mailto-Pattern pro Layer.

**Cross-Component Dependencies:**

- Story 1.5 (Daten-Abstraktion) blockt alle Layer-Konsumenten (1.6, 1.7, 1.9, 1.11, 1.13).
- Story 1.4 (Daten-Pipeline) blockt 1.5.
- Story 1.2 (Design-Tokens) blockt alle UI-Komponenten (1.6, 1.7, 1.8, 1.9).
- Story 1.3 (i18n-Routing) blockt 1.13 (Bezirks-/Kiez-Pages mit Sprach-Prefix) und 1.14 (Translation).
- Story 1.10 (SEO) und 1.11 (WebMCP) parallel implementierbar nach 1.5.
- Story 1.12 (OG-Images) braucht 1.13 als Input (Page-URLs).
- Story 1.15 (Hosting) parallel zu 1.1–1.14, aber Final-Deploy nach 1.13/1.14.
- Story 1.16 (Editorial) als Cross-Cut-Pattern in 1.7 (Inspektor) und 1.13 (Pages) integriert.

**Cascading Implications:**

- On-Demand-Layer-Loading bedingt LRUCache-Setup in `$lib/data/` und HTTP-Cache-Header-Disziplin.
- URL-State-only bedingt URL-Schema-Versioning falls Phase 2 neue Params (Time-Slider FR59a) ergänzt → ADR-NNN-url-state-versioning.
- Sitemap-Index pro Sprache bedingt Build-Step für 9 Sitemap-Files (1 Index + 8 Per-Sprache).
- Tile-Provider hinter Env-Var bedingt Disaster-Recovery-Runbook für Switch (NFR-R6).
- Phase-2-Drizzle erfordert Daten-Abstraktion-Refactor ohne Component-Code-Änderung (siehe Daten-Architektur).

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** ~25 Bereiche, in denen verschiedene AI-Agents inkonsistente Implementierungen liefern könnten. Hier verbindlich entschieden.

### Naming Patterns

**Datei- und Verzeichnis-Naming:**

- **Komponenten-Files:** `kebab-case.svelte` für Files, `PascalCase` für Component-Imports und Tags. Beispiel: `inspector-panel.svelte` exportiert default → `import InspectorPanel from '$lib/components/atlas/inspector-panel.svelte'` → `<InspectorPanel />`.
- **TypeScript-Modules:** `kebab-case.ts`. Beispiel: `$lib/data/get-layers-at-point.ts`.
- **Server-Endpoints:** SvelteKit-Convention `+server.ts`, `+page.server.ts`, `+layout.server.ts`. Niemals umbenennen.
- **Remote-Function-Files:** `*.remote.ts`-Suffix. Beispiel: `$lib/data/geocode.remote.ts`.
- **Test-Files:** Co-located `*.test.ts` (Unit) neben Source. E2E in `tests/e2e/*.spec.ts`.
- **Verzeichnisse:** `kebab-case` durchgängig. Beispiel: `src/lib/components/atlas/map-libre-canvas/`.

**Code-Naming (TypeScript):**

- **Variablen + Funktionen:** `camelCase`. Beispiel: `getLayersAtPoint`, `kiezProfile`.
- **Types + Interfaces:** `PascalCase`. Beispiel: `LayerHit`, `KiezProfile`. KEIN `I`-Prefix.
- **Constants:** `SCREAMING_SNAKE_CASE` nur für echte Konstanten. Beispiel: `GEOCODING_RATE_LIMIT_MS`.
- **Booleans:** `is*`/`has*`/`should*`-Prefix. Beispiel: `isInspectorOpen`, `hasLayerCoverage`.
- **Async-Funktionen:** verb-präfixiert ohne `Async`-Suffix. Beispiel: `fetchLayer()`, NICHT `getLayerAsync()`.
- **Event-Handler:** `handle{Event}` für lokale Handler, `on{Event}` für Component-Props. Beispiel: `function handleAddressSelect(...)`, prop `onAddressSelect`.

**Component-Naming Convention:**

- **`ui/`** = generische Wrapper, Namensgleich zur Bits-UI-Primitive. Beispiel: `ui/dialog.svelte` wrappt `bits-ui` Dialog.
- **`atlas/`** = domain-spezifisch, Berlin/Karten/Layer-Bezug. Beispiel: `atlas/inspector-panel.svelte`.
- KEIN gemischter Bereich.

**URL-Naming (Routes + Query-Params):**

- **Path-Segments:** `kebab-case`, deutsch wenn Domain-Begriff (`/bezirk/`, `/kiez/`, `/layer/`, `/lizenzen`, `/architektur`).
- **Slug-Format:** `kebab-case` ohne Umlaute (transliteriert: `friedrichshain-kreuzberg`, `boxhagener-kiez`, `koepenick`).
- **Query-Params:** `kebab-case` für Multi-Wort. Beispiel: `?layer-set=...`.
- **Sprach-Prefix:** ISO-639-1 Lowercase 2-Letter. Verbindlich: `de|en|tr|uk|ar|es|fr|it`. Niemals `de-DE`/`en-US`.

**JSON-Field-Naming (intern + Manifest):**

- `camelCase` für TypeScript-Konsumierte Daten (Manifest, Translation-Bundles, WebMCP-Schemas).
- Externe Quellen (FIS-Broker, ODIS, DWD) bleiben in Original-Naming, im Build-Step nach `camelCase` mapped.

```json
{
  "layers": [{
    "id": "mietspiegel-wohnlage",
    "sourceUrl": "https://fbinter.stadt-berlin.de/...",
    "fetchedAt": "2026-05-11T12:00:00Z",
    "license": "dl-de/zero-2-0",
    "sha256": "...",
    "fileName": "mietspiegel-wohnlage.a3b9c1.geojson",
    "zoomThresholds": { "min": 10, "max": 18 },
    "seasonality": { "active": "2026-05-01..2026-10-31" }
  }]
}
```

### Structure Patterns

**Project Organization (verbindlich):**

```
src/
  routes/
    [lang=lang]/...
    api/...
    sitemap*.xml/+server.ts
    llms*.txt/+server.ts
  lib/
    components/
      ui/                    # Bits-UI-Wrapper
      atlas/                 # Domain
    data/
      get-layers-at-point.ts
      get-kiez-profile.ts
      geocode.remote.ts      # Remote-Function
      kiez-profile.remote.ts # prerender Remote-Function
      manifest.ts
    seo/                     # JSON-LD-Generators, Sitemap-Builder
    webmcp/                  # WebMCP-Adapter
    i18n/                    # Paraglide-Bundles
    state/
      ui-context.ts          # Context-API (NICHT Module-State)
    server/
      geocode.ts
      og-image.ts
    utils/
  params/
    lang.ts
  hooks.server.ts
  app.css                    # Tailwind v4 @theme
  app.html
static/
  layers/                    # GeoJSON + MANIFEST.json
  glyphs/                    # MapLibre-Glyph-Pack
  fonts/                     # Plex subsetted
  map-style.json
  webmcp-manifest.json
scripts/
  fetch-static.ts
  translate.ts
  generate-og-images.ts
  build-glyphs.ts
tests/
  e2e/
docs/
  ARCHITECTURE.md
  adr/
  runbooks/
```

**Test-Co-Location:**

- **Unit-Tests:** `*.test.ts` neben Source-File.
- **E2E-Tests:** `tests/e2e/*.spec.ts`.
- **Component-Tests:** Vitest browser-mode, co-located neben Component.

**File-Length-Discipline (CLAUDE.md):**

- Maximum 500 Zeilen pro File. Sonst Split.
- Komponenten >200 Zeilen → Split in `<ParentComponent>/index.svelte` + Children.

### Format Patterns

**API-Response-Format:**

Direkte JSON, kein Wrapper-Objekt:

```typescript
// gut
return json({ hits: [...], cached: true });

// vermeiden
return json({ data: { hits: [...] }, error: null });
```

Errors via SvelteKit-`error()`-Helper:

```typescript
import { error } from '@sveltejs/kit';
throw error(404, 'Address not found in Berlin');
```

**Error-Format (User-Facing):**

- 404/500: lokalisierte Page via `+error.svelte`.
- Layer-Hit ohne Coverage: KEIN Error, sondern `{ layer, value: null, reason: 'no-coverage' }` (FR20).

**Date/Time-Format:**

- **Intern:** ISO-8601-UTC-Strings.
- **User-Facing:** `Intl.DateTimeFormat(lang)` via `$lib/utils/format-date.ts`.
- **Datenstand-Banner:** `YYYY-MM`.
- **Klima-Jahre:** 4-stellig integer.

**Number-Format:**

- **Intern:** TypeScript `number`.
- **User-Facing:** `Intl.NumberFormat(lang)`. Plex-Mono in CSS-Klasse `.tabular`.
- **Bodenrichtwerte:** Cent-Genauigkeit als integer in EUR.

**Boolean-Format:** TypeScript `true`/`false`. Niemals `1`/`0` oder Strings.

**Null-Handling:**

- `null` für „explizit nicht vorhanden".
- `undefined` für „noch nicht geladen".
- Niemals `''` als Sentinel.

### Communication Patterns

**State-Update-Pattern (Svelte 5 Runes):**

```typescript
// gut: direkt mutation auf $state-Object
ui.inspectorOpen = true;
ui.selectedLayerHits.push(newHit); // Svelte 5 trackt Array-Mutation

// vermeiden: redundante Reassignment-Patterns aus React
ui = { ...ui, inspectorOpen: true };
```

URL-State-Updates via `goto()` mit `replaceState: true` für Viewport (kein History-Spam):

```typescript
import { goto } from '$app/navigation';
import { page } from '$app/state';

const params = new URLSearchParams(page.url.searchParams);
params.set('bbox', bbox.join(','));
goto(`?${params}`, { replaceState: true, keepFocus: true, noScroll: true });
```

**Event-Handler-Naming (Component-Props):**

- Props: `on{Event}` als Function-Type. `onAddressSelect: (address: Address) => void`.
- Lokale Handler: `handle{Event}`.
- Keine Svelte-4-`createEventDispatcher` (deprecated).

**Async-Fetch-Pattern:**

- **Page-Level Initial-Data:** SvelteKit `load`-Functions (typed via `PageData`).
- **Component-Level Server-Roundtrip:** Remote Functions (`prerender`/`query`/`form`/`command`/`query.live`).
- **Static Asset Fetch:** Native `fetch()` für Layer-GeoJSON aus `static/layers/`.
- **External-API Fetch (Build-Time):** `scripts/fetch-static.ts` mit Retry (3 Versuche, 1s/2s/4s, NFR-I1).

**WebMCP-Tool-Naming:**

- `snake_case` für Tool-Namen (MCP-Convention): `address_lookup`, `cross_layer_query`.
- Tool-Description Englisch (LLM-optimiert), interne Strings Deutsch.
- JSON-Schema strict, keine `any`-Types in Tool-Inputs.

**Logging:**

- Server-Side: `console.error()` → Coolify-Logs aggregiert.
- Format: `[komponente] message`.
- Niemals personenbezogene Daten loggen (DSGVO).

### Process Patterns

**Error-Handling-Pattern:**

- **Server-Endpoint-Errors:** SvelteKit-`error()`-Helper wirft `HttpError`. Komponente fängt nicht.
- **Remote-Function-Errors:** Bubblen zur nächsten `<svelte:boundary>` mit `failed`-Snippet.
- **Komponenten-Errors:** Try/catch nur an System-Boundaries (Geocoding, MapLibre-Init, External-Fetch).
- **User-Facing:** lokalisierte Fehlermeldung mit Mailto-Link. KEIN Stack-Trace im UI.

**Loading-State-Pattern:**

- **Initial-Load:** SvelteKit `load`-Function-Skelett, kein Spinner während SSR.
- **Async-Expressions:** `<svelte:boundary>` mit `pending`-Snippet → Skeleton-Placeholder, kein Spinner. Reduziert Layout-Shift (NFR-P3).
- **`prefers-reduced-motion`** respektiert (NFR-A8) — Skeleton ohne Pulse-Animation bei reduzierter Motion.

**Validation-Pattern:**

- Server-Boundary: input-Schemas via Valibot (kompakter als Zod) in `$lib/server/validators/` oder direkt in Remote-Function-Definition.
- Internal Code: TypeScript-Strict + Type-Guards. Kein Runtime-Re-Validation für intern garantierte Daten.

**Retry-Pattern:**

```typescript
// $lib/utils/retry.ts
async function retry<T>(fn: () => Promise<T>, attempts = 3, delays = [1000, 2000, 4000]): Promise<T> { ... }
```

Build-Zeit (NFR-I1) + Runtime (Geocoding-Proxy).

**Cache-Pattern:**

- HTTP-Cache (NFR-P10):
  - Static-GeoJSON: `cache-control: public, max-age=2592000, immutable`
  - HTML-Pages: `cache-control: public, max-age=3600, must-revalidate`
  - API-Responses: `cache-control: private, max-age=86400`
- In-Process LRU (`lru-cache`): Geocoding (1.000), Layer-Hit-Berechnungen (200).
- Cache-Invalidation: Layer-Files via Filename-SHA, OG-Images via Hash, HTML via Build-Hash.

**Translation-Pattern:**

- DE Master in `src/lib/i18n/de.json` + Component-Strings via Paraglide-Compiler.
- 7 Zielsprachen via `scripts/translate.ts` (lokal Claude Code, NFR-IL2).
- Sensible Inhalte (Stolperstein-Personen, Mauer/Sektoren) NICHT maschinell übersetzt — Wikipedia-Quelle in Zielsprache verlinkt falls vorhanden, sonst DE/EN-Original mit Hinweis (FR55i, NFR-IL9).

### Svelte / SvelteKit Best Practices (verbindlich)

Quellen: [svelte.dev/docs/svelte/best-practices](https://svelte.dev/docs/svelte/best-practices), [svelte.dev/docs/kit/remote-functions](https://svelte.dev/docs/kit/remote-functions), [svelte.dev/docs/svelte/await-expressions](https://svelte.dev/docs/svelte/await-expressions).

**Runes-Disziplin:**

- **`$state` nur für reaktive Variablen.** Alles andere bleibt normales `let`/`const`.
- **`$state.raw` für große Objekte, die reassigniert (nicht mutiert) werden** — z.B. GeoJSON-Layer-Bundles, API-Responses, Layer-Hit-Arrays nach kompletter Replacement. Spart Proxy-Overhead.

  ```typescript
  let layerData = $state.raw<GeoJSON.FeatureCollection | null>(null);
  layerData = await fetchLayer('mietspiegel'); // reassign atomic
  ```

- **`$derived` statt `$effect` für Berechnungen.** `$effect` nur für echte Side-Effects (DOM-API direkt, Logging, manueller Subscription-Teardown).
- **`$effect` NICHT für Event-Handling.** Logik direkt im Handler.
- **Keyed `{#each}`:** `{#each items as item (item.id)}` für surgical updates.
- **Keine `if (browser) {...}`-Wrapper um `$effect`-Inhalt.** `$effect` läuft per Definition nur client-side.
- **`$inspect.trace()`** für Reactivity-Debugging.

**Component-Design:**

- **Props mutable** — `$derived` für abgeleitete Werte aus Props, nicht lokale Kopie via `$state`.
- **CSS-Custom-Properties statt `:global` Overrides** für Child-Styling. Tailwind-v4-`@theme` deckt das ab.
- **Snippets `{#snippet}` + `{@render}` statt Slots** für reusable Markup-Chunks.
- **Context-API für Cross-Component-State** (`setContext`/`getContext`), NICHT shared Module — SSR-State-Leak-Vermeidung.
- **Code-Style modern:** `$props` statt `export let`, `onclick` statt `on:click`, `{#snippet}` statt `<slot>`.

### Async-Patterns (Experimental Async + `<svelte:boundary>`)

Svelte 5.36+ erlaubt `await` direkt in Markup, `$derived`, Top-Level-Script. Aktiviert via:

```javascript
// svelte.config.js
export default {
  compilerOptions: {
    experimental: { async: true }
  }
};
```

**Verwendung:**

```svelte
<script lang="ts">
  import { getLayerHits } from '$lib/data/get-layers-at-point.remote';
  let { lat, lng } = $props();
</script>

<svelte:boundary>
  {#snippet pending()}
    <DataSkeleton />
  {/snippet}
  {#snippet failed(error, reset)}
    <ErrorPanel {error} {reset} />
  {/snippet}

  {#each await getLayerHits(lat, lng) as hit (hit.layer)}
    <LayerHitRow {hit} />
  {/each}
</svelte:boundary>
```

**Regeln:**

- `<svelte:boundary>` mit `pending`-Snippet für Loading-State, fängt auch Errors aus `await`-Expressions.
- Mehrere `await`-Expressions in einem Markup-Block laufen **parallel** (Performance-Gewinn gegenüber sequentiellem `load`).
- Sequenzielle `await`s in `<script>` bleiben sequenziell.
- `$effect.pending()` + `settled()` für advanced reactivity-Tracking.
- `{#await}`-Block bleibt unterstützt für Cases ohne Boundary.
- **Sync-Garantie:** `await`-Expression mit State-Dependency wartet auf Async-Completion → keine inkonsistenten Zwischenrenderings.

### SvelteKit Remote Functions (verbindlich für Server-Communication)

`load`-Functions bleiben für page-level initial data; **Remote Functions** ersetzen ad-hoc `fetch()`-Calls aus Komponenten.

**Vier Typen:**

| Type | Use Case | Phase 1 navigator.berlin |
|------|----------|---------------------------|
| `prerender()` | Statische Daten, build-time generiert | **Bezirks-/Kiez-/Layer-Profile, Klima-Zeitreihen-Bundles** |
| `query()` | Dynamische Reads (gecacht solange aktiv) | **Geocoding-Lookups** (per-Address-Argument) |
| `form()` | Mutations mit Progressive Enhancement | Phase 1 keine — kein User-Input zu speichern |
| `command()` | Mutations aus Event-Handlern | Phase 1 keine |
| `query.live()` | Streaming/Realtime via Async-Generators | **Phase 2: BVG / BLUME / Wetter** |

**Phase-1-Beispiele:**

**Statische Layer-Profile (prerendered Routes):**

```typescript
// src/routes/[lang=lang]/kiez/[slug]/profile.remote.ts
import { prerender } from '$app/server';
import * as v from 'valibot';
import { getKiezProfile } from '$lib/data/get-kiez-profile';

export const kiezProfile = prerender(
  v.object({ lang: v.string(), slug: v.string() }),
  async ({ lang, slug }) => await getKiezProfile(lang, slug)
);
```

In `+page.svelte` direkt awaitable:

```svelte
<script>
  import { kiezProfile } from './profile.remote';
  let { lang, slug } = $props();
</script>

<svelte:boundary>
  {#snippet pending()}<DataSkeleton />{/snippet}

  {@const profile = await kiezProfile({ lang, slug })}
  <KiezHero {profile} />
  <FaqSection items={profile.faq} />
</svelte:boundary>
```

**Achtung Prerendered Routes:** `prerender()`-Functions werden mit allen bekannten Argument-Kombinationen zur Build-Zeit ausgeführt. Argument-Space muss enumerierbar sein (Bezirke, Kieze, Layer-Slugs, Sprachen). Build-Zeit-Enumeration via `entries`-Hook in `+page.server.ts`:

```typescript
// src/routes/[lang=lang]/kiez/[slug]/+page.server.ts
export const prerender = true;
export const entries = async () => {
  const langs = ['de','en','tr','uk','ar','es','fr','it'] as const;
  const kieze = await loadKiezSlugs();
  return langs.flatMap(lang => kieze.map(slug => ({ lang, slug })));
};
```

**Dynamic Query (Geocoding, nicht prerenderbar):**

```typescript
// src/lib/data/geocode.remote.ts
import { query } from '$app/server';
import * as v from 'valibot';
import { proxyNominatim } from '$lib/server/geocode';

export const geocodeAddress = query(
  v.object({ q: v.pipe(v.string(), v.minLength(2)) }),
  async ({ q }) => await proxyNominatim(q)
);
```

In Adress-Suche-Component:

```svelte
<script>
  import { geocodeAddress } from '$lib/data/geocode.remote';
  let query = $state('');
  const suggestions = $derived(query.length >= 2 ? geocodeAddress({ q: query }) : null);
</script>

<input bind:value={query} aria-label={m.addressInputLabel()} />

{#if suggestions}
  <svelte:boundary>
    {#snippet pending()}<SuggestionsSkeleton />{/snippet}
    {#each await suggestions as hit (hit.id)}
      <SuggestionRow {hit} />
    {/each}
  </svelte:boundary>
{/if}
```

**Phase-2-Live-Daten (`query.live`):**

```typescript
// src/lib/data/bvg-departures.remote.ts
import { query } from '$app/server';
import * as v from 'valibot';

export const bvgDepartures = query.live(
  v.object({ stopId: v.string() }),
  async function* ({ stopId }) {
    while (true) {
      yield await fetchBvgDepartures(stopId);
      await sleep(30_000);
    }
  }
);
```

In Inspector-Panel-Component (Phase 2):

```svelte
<svelte:boundary>
  {#snippet pending()}<LiveDataSkeleton />{/snippet}
  {#each await bvgDepartures({ stopId }) as dep (dep.id)}
    <DepartureRow {dep} />
  {/each}
</svelte:boundary>
```

`query.live` ersetzt früher angedachten `load`+60s-Polling-Fallback. Bei Spec-Breaking-Change: Adapter-Schicht in `$lib/data/`-Wrappern fängt das ab.

**Single-Flight-Mutations (Phase 2 falls relevant):**

Forms refreshen Queries innerhalb des Handlers:

```typescript
export const submitFeedback = form(/* schema */, async (data) => {
  await store(data);
  void getFeedbackList().refresh();
  redirect(303, '/danke');
});
```

**Was NICHT Remote Function:**

- **WebMCP-Tool-Aufrufe** (laufen client-side im Browser-Agenten-Kontext, nicht via SvelteKit-Server-Roundtrip).
- **MapLibre-Tile-Requests** (direkt vom Browser an Tile-Provider).
- **Layer-GeoJSON-Fetch** (statische Files mit `cache-control: immutable`, normaler `fetch()` reicht).

### Enforcement Guidelines

**All AI Agents MUST:**

1. **`@lucide/svelte` für Icons.** NIEMALS `lucide-svelte` (deprecated, CLAUDE.md).
2. **Files <500 Zeilen.** Sonst Split.
3. **Bestehende Funktionen in `$lib/utils/`, `$lib/data/`, `$lib/seo/` checken vor Neuschreiben** (CLAUDE.md).
4. **Keine Backwards-Compat-Hacks** für nicht-existente Vorgängerversionen.
5. **Keine Premature-Abstractions.** Drei ähnliche Code-Stellen ist besser als verfrühte Generalisierung.
6. **Keine Comments außer für nicht-offensichtliche WHYs** (CLAUDE.md).
7. **TypeScript strict.** Kein `any`. Type-Guards an System-Boundaries.
8. **Svelte-5-Runes-Patterns.** Kein `export let`, kein `createEventDispatcher`, kein Svelte-4-`$:`-Reactivity.
9. **`{@const}` nur als immediate child von `{#snippet}`/`{#if}`/`{:else if}`/`{:else}`/`{#each}`/`{:then}`/`{:catch}`/`<svelte:fragment>`/`<svelte:boundary>`/`<Component>`** (CLAUDE.md).
10. **Cookieless.** Niemals `document.cookie`/`localStorage`/`sessionStorage` für persistente State. URL-State only. Ausnahme dokumentiert in ADR-004 (User-initiierte Bookmarks via `src/lib/state/bookmark-store.ts` gemäß TDDDG §25 Abs. 2 Nr. 2; Scope strikt: User-Trigger, ausschließlich clientseitig, keine Drittübertragung).
11. **Kein US-Drittanbieter** in `<script src>`/`<link href>`/`fetch()`/Build-Asset-Imports.
12. **Per Layer-Wert: Source-URL + UpdatedAt + License im LayerHit.** Niemals nackte Werte ohne Provenienz (FR40).
13. **A11y-First.** Bits-UI-Primitives statt eigener `<div role>`-Workarounds. Skip-Link auf jeder Page (FR41).
14. **i18n-First.** Keine hardcoded Strings im UI — alle via Paraglide-Messages.
15. **`$state.raw` für große reassignable Objekte** (GeoJSON-Bundles, Layer-Hit-Arrays nach Replacement).
16. **Context-API für Cross-Component-State**, NICHT Module-Scope-`$state` (SSR-State-Leak-Risiko).
17. **`$derived` über `$effect`** für Computations. `$effect` nur für echte Side-Effects.
18. **Keyed `{#each (item.id)}`** für identifizierbare Listen.
19. **Remote Functions (`prerender`/`query`/`form`/`command`/`query.live`) statt ad-hoc `fetch()` aus Komponenten** wo Server-Roundtrip betroffen. Static-Files (Layer-GeoJSON) bleiben normaler `fetch()`.
20. **Async via `await`-Expression + `<svelte:boundary>`** statt `{#await}`-Block bei neuen Komponenten. `experimental.async = true` in `svelte.config.js`.
21. **`prerender()`-Functions enumerieren Argument-Space via `entries`-Hook** in `+page.server.ts`.

**Pattern-Enforcement:**

- **Lint-Gate:** ESLint mit `@typescript-eslint`, `eslint-plugin-svelte`, `eslint-plugin-no-relative-import-paths` (`$lib/*`-Imports erzwungen).
- **Type-Gate:** `svelte-check` strict in CI (NFR-M3).
- **Format-Gate:** Prettier mit `prettier-plugin-svelte` + `prettier-plugin-tailwindcss` (NFR-M4).
- **A11y-Gate:** Playwright + `@axe-core/playwright`, 0 Violations Pflicht (NFR-A1).
- **Bundle-Gate:** `size-limit` oder Custom-CI prüft Initial-JS ≤200KB gzipped (NFR-P5).
- **Cookie-Gate:** Custom-CI gegen Response-Headers (NFR-PR1).
- **US-Domain-Gate:** Custom-CI gegen Asset-URL-Allowlist (NFR-S7).
- **Lighthouse-Gate:** `@lhci/cli` mit Performance ≥90 / A11y ≥95 / SEO ≥95 / Best Practices ≥95.

**Pattern-Update-Process:**

- Pattern-Änderung erfordert ADR (`docs/adr/ADR-NNN-pattern-{name}.md`) mit Begründung + Migration-Pfad.
- Bestehende Files werden NICHT retroaktiv migriert — Pattern gilt für neuen Code, ältere Files folgen beim nächsten substantiellen Edit.

### Pattern Examples

**Good Examples:**

```svelte
<!-- src/lib/components/atlas/inspector-panel.svelte -->
<script lang="ts">
  import type { LayerHit } from '$lib/data/types';
  import { getUiState } from '$lib/state/ui-context';
  import * as m from '$lib/i18n/messages';
  import LayerHitRow from './layer-hit-row.svelte';

  let { hits, onClose }: { hits: LayerHit[]; onClose: () => void } = $props();

  const ui = getUiState();
  const groupedHits = $derived.by(() => groupByCategory(hits));
</script>

<aside aria-live="polite" aria-label={m.inspectorPanelLabel()}>
  {#each groupedHits as group (group.id)}
    <h3>{group.title}</h3>
    {#each group.hits as hit (hit.layer)}
      <LayerHitRow {hit} />
    {/each}
  {/each}
</aside>
```

```typescript
// src/lib/data/get-layers-at-point.ts
import { LRUCache } from 'lru-cache';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { manifest } from './manifest';
import type { LayerHit } from './types';

const cache = new LRUCache<string, LayerHit[]>({ max: 200 });

export async function getLayersAtPoint(lat: number, lng: number): Promise<LayerHit[]> {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const hits = await computeHits(lat, lng);
  cache.set(key, hits);
  return hits;
}
```

**Anti-Patterns:**

```typescript
// vermeiden: any-Types
function process(data: any) { ... }

// vermeiden: Svelte-4-Patterns
$: filtered = items.filter(...)
export let prop;

// vermeiden: lucide-svelte deprecated
import { Search } from 'lucide-svelte';

// vermeiden: hardcoded Strings statt Paraglide
<button>Adresse suchen</button>

// vermeiden: localStorage für State
localStorage.setItem('selectedLayer', 'mietspiegel');

// vermeiden: Module-Scope-$state (SSR-leak)
// $lib/state/ui.svelte.ts
export const ui = $state({ inspectorOpen: false });

// vermeiden: $effect für Berechnungen
$effect(() => { totalPrice = items.reduce(...) });
// stattdessen:
const totalPrice = $derived(items.reduce(...));

// vermeiden: redundante Wrapper im API-Response
return json({ data: { hits: [...] }, error: null, meta: {...} });

// vermeiden: Comment der das WHAT erklärt
// Loop through items and filter active ones
const active = items.filter(i => i.active);

// vermeiden: nackter Wert ohne Provenienz
return { mietspiegel: 'gut' };
// stattdessen:
return { layer: 'mietspiegel-wohnlage', value: 'gut', source: '...', updatedAt: '2024-09', license: 'dl-de/by-2-0' };
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
navigator-berlin/
├── README.md                         # Public-facing, recruiter-readable
├── ARCHITECTURE.md → docs/ARCHITECTURE.md (symlink)
├── LICENSE                           # MIT
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── svelte.config.js                  # adapter-node, experimental.async = true
├── vite.config.ts                    # manualChunks (maplibre/layerchart/turf)
├── tsconfig.json                     # strict
├── eslint.config.js
├── prettier.config.js
├── playwright.config.ts              # E2E + axe-core
├── vitest.config.ts
├── lighthouserc.cjs                  # Performance ≥90, A11y ≥95, etc.
├── .env.example
├── .gitignore
├── .editorconfig
├── .nvmrc                            # Node LTS pin
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint, typecheck, test, e2e, lighthouse, bundle, cookie, us-domain
│       └── deploy.yml                # Coolify-Webhook on main
├── docker-compose.yml                # Coolify-Compose: app + traefik + crowdsec
├── coolify.json
├── src/
│   ├── app.css                       # Tailwind v4 @theme + Critical-CSS
│   ├── app.html
│   ├── app.d.ts                      # Type-Augmentations (App.Locals, App.PageData)
│   ├── hooks.server.ts               # CSP-Header, Accept-Language-Redirect
│   ├── params/
│   │   └── lang.ts                   # 8-Sprachen-Param-Matcher
│   ├── routes/
│   │   ├── +layout.svelte            # Root: SkipLink, Lang, Footer
│   │   ├── +layout.server.ts         # Root: Accept-Language → /{lang}/-Redirect
│   │   ├── +error.svelte             # Top-Level-Error-Boundary
│   │   ├── [lang=lang]/
│   │   │   ├── +layout.svelte        # createUiState() Context, Hreflang
│   │   │   ├── +layout.ts            # prerender = true
│   │   │   ├── +page.svelte          # Landing
│   │   │   ├── bezirk/[slug]/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts          # entries: 12 Bezirke × 8 Sprachen
│   │   │   │   └── profile.remote.ts        # prerender(BezirkProfile)
│   │   │   ├── kiez/[slug]/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts          # entries: 138 LOR × 8 Sprachen
│   │   │   │   └── profile.remote.ts
│   │   │   ├── layer/[slug]/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── +page.server.ts          # entries: 25 Layer × 8 Sprachen
│   │   │   │   └── concept.remote.ts
│   │   │   ├── lizenzen/
│   │   │   │   ├── +page.svelte             # auto aus MANIFEST.json
│   │   │   │   └── +page.server.ts
│   │   │   ├── architektur/
│   │   │   │   └── +page.svelte             # EU-FOSS-Stack-Showcase
│   │   │   └── +error.svelte
│   │   ├── api/
│   │   │   ├── geocode/+server.ts           # Nominatim-Proxy + LRU + Rate-Limit
│   │   │   ├── og/[type]/[slug].png/+server.ts
│   │   │   └── healthz/+server.ts
│   │   ├── llms.txt/+server.ts
│   │   ├── llms-full.txt/+server.ts
│   │   ├── sitemap.xml/+server.ts           # Sitemap-Index
│   │   ├── sitemap-[lang]/+server.ts        # Per-Sprache-Sitemap
│   │   ├── robots.txt/+server.ts
│   │   └── webmcp-manifest.json/+server.ts
│   └── lib/
│       ├── components/
│       │   ├── ui/                          # Bits-UI-Wrapper, generisch
│       │   │   ├── button.svelte
│       │   │   ├── dialog.svelte
│       │   │   ├── combobox.svelte
│       │   │   ├── popover.svelte
│       │   │   ├── tooltip.svelte
│       │   │   ├── toggle-group.svelte
│       │   │   ├── scroll-area.svelte
│       │   │   ├── skeleton.svelte
│       │   │   └── tabs.svelte
│       │   └── atlas/                       # Domain
│       │       ├── address-search.svelte    # FR1-FR6
│       │       ├── map-libre-canvas.svelte  # FR7-FR13, FR11a-e
│       │       ├── map-accessibility-layer.svelte  # FR44, NFR-A4
│       │       ├── map-controls.svelte      # FR9, FR10
│       │       ├── inspector-panel.svelte   # FR14-FR21
│       │       ├── inspector-panel/
│       │       │   ├── layer-hit-row.svelte
│       │       │   ├── layer-group.svelte
│       │       │   └── data-stand-banner.svelte
│       │       ├── layer-palette.svelte     # FR16, FR17
│       │       ├── climate-sparkline.svelte # FR22-FR26
│       │       ├── climate-long-view.svelte # FR25 (Dahlem 1719+)
│       │       ├── data-table-alternative.svelte  # FR19, NFR-A9
│       │       ├── faq-section.svelte       # FR30
│       │       ├── kiez-hero.svelte
│       │       ├── bezirk-hero.svelte
│       │       ├── layer-concept-hero.svelte
│       │       ├── og-image-template.svelte # Satori-JSX
│       │       ├── stolperstein-detail.svelte
│       │       ├── editorial-disclaimer.svelte
│       │       ├── error-feedback-mailto.svelte
│       │       ├── license-footer.svelte
│       │       ├── lang-switcher.svelte
│       │       ├── meta-footer.svelte
│       │       └── skip-link.svelte
│       ├── data/
│       │   ├── types.ts                     # LayerHit, KiezProfile, ClimateData
│       │   ├── manifest.ts                  # MANIFEST.json-Loader
│       │   ├── get-layers-at-point.ts       # Phase 1 Turf+rbush, P2 SQL-Swap
│       │   ├── get-kiez-profile.ts
│       │   ├── get-bezirk-profile.ts
│       │   ├── get-layer-metadata.ts
│       │   ├── get-climate-station.ts       # nearest DWD per coords
│       │   ├── get-climate-series.ts
│       │   ├── geocode.remote.ts            # query() Geocoding
│       │   ├── kiez-profile.remote.ts       # prerender()
│       │   ├── bezirk-profile.remote.ts     # prerender()
│       │   ├── layer-concept.remote.ts      # prerender()
│       │   └── faq.remote.ts                # prerender() FAQ
│       ├── seo/
│       │   ├── jsonld-place.ts
│       │   ├── jsonld-administrative-area.ts
│       │   ├── jsonld-dataset.ts
│       │   ├── jsonld-faqpage.ts
│       │   ├── jsonld-website.ts
│       │   ├── meta-tags.ts
│       │   ├── llms-builder.ts
│       │   └── sitemap-builder.ts
│       ├── webmcp/
│       │   ├── adapter.ts                   # Spec-Version-Adapter
│       │   ├── tools/
│       │   │   ├── address-lookup.ts        # FR37
│       │   │   ├── cross-layer-query.ts
│       │   │   ├── get-kiez-profile.ts
│       │   │   ├── get-layer-metadata.ts
│       │   │   └── list-layers-at-point.ts
│       │   ├── resources/
│       │   │   ├── active-address.ts        # FR38
│       │   │   └── loaded-layers.ts
│       │   └── prompts/
│       │       ├── address-overview.ts      # FR39
│       │       ├── compare-kieze.ts
│       │       └── explain-layer.ts
│       ├── i18n/
│       │   ├── messages/                    # Paraglide-Compiler-Output
│       │   │   ├── de.js
│       │   │   ├── en.js
│       │   │   ├── tr.js
│       │   │   ├── uk.js
│       │   │   ├── ar.js
│       │   │   ├── es.js
│       │   │   ├── fr.js
│       │   │   └── it.js
│       │   ├── runtime.js
│       │   └── strings/                     # Source-Bundles (DE master)
│       │       └── de.json
│       ├── state/
│       │   └── ui-context.ts                # Context-API
│       ├── server/                          # Server-only
│       │   ├── geocode.ts                   # Nominatim-Proxy-Logik
│       │   ├── og-image.ts                  # Satori + resvg
│       │   ├── og-snapshot.ts               # Karten-Snapshot-Pre-Render
│       │   ├── csp.ts
│       │   ├── rate-limit.ts
│       │   └── validators/
│       │       ├── geocode.ts               # Valibot-Schema
│       │       └── og-params.ts
│       └── utils/
│           ├── retry.ts                     # exp-backoff (NFR-I1)
│           ├── format-date.ts               # Intl.DateTimeFormat
│           ├── format-number.ts             # Intl.NumberFormat
│           ├── slugify.ts                   # transliteration
│           ├── url-state.ts                 # bbox/zoom/layers serialize
│           ├── nearest-station.ts           # Haversine
│           └── group-by.ts
├── static/
│   ├── layers/                              # Phase-1-GeoJSON-Bundles
│   │   ├── MANIFEST.json
│   │   ├── bezirke.{sha}.geojson            # Bundle A
│   │   ├── ortsteile.{sha}.geojson
│   │   ├── lor-prognoseraum.{sha}.geojson
│   │   ├── lor-bezirksregion.{sha}.geojson
│   │   ├── lor-planungsraum.{sha}.geojson
│   │   ├── plz.{sha}.geojson
│   │   ├── mietspiegel-wohnlage.{sha}.geojson  # Bundle B
│   │   ├── bodenrichtwerte.{sha}.geojson
│   │   ├── gebaeudealter.{sha}.geojson
│   │   ├── laerm-den.{sha}.geojson          # Bundle C
│   │   ├── laerm-night.{sha}.geojson
│   │   ├── solarpotenzial.{sha}.geojson
│   │   ├── klimaanalyse.{sha}.geojson
│   │   ├── stolpersteine.{sha}.geojson
│   │   └── trinkbrunnen.{sha}.geojson
│   ├── climate/                             # DWD-Bundles pro Station
│   │   ├── dahlem-00403.json                # 1719+
│   │   ├── buch-00400.json                  # 1889+
│   │   ├── tempelhof-00433.json             # 1919+
│   │   └── brandenburg-00427.json           # 1957+
│   ├── glyphs/                              # MapLibre-Glyph-Pack via fontnik
│   │   └── plex-sans/                       # 4 Skripte: latin/latin-ext/cyrillic/arabic
│   │       └── {range}.pbf
│   ├── fonts/                               # Plex Variable subsetted
│   │   ├── plex-sans-var.woff2
│   │   ├── plex-serif-var.woff2
│   │   ├── plex-mono.woff2
│   │   └── plex-arabic-var.woff2
│   ├── og/                                  # Pre-rendered Karten-Snapshots
│   │   ├── bezirk/{slug}.png
│   │   ├── kiez/{slug}.png
│   │   └── layer/{slug}.png
│   ├── map-style.json                       # MapLibre-Plex-Cartography
│   ├── webmcp-manifest.json                 # Spec-Version
│   └── favicon.ico
├── scripts/                                 # Build-Time-Tools
│   ├── fetch-static.ts                      # FIS-Broker WFS + ODIS + DWD CDC + OSM Overpass
│   ├── reproject.ts                         # EPSG:25833 → 4326
│   ├── simplify.ts                          # mapshaper-Wrapper
│   ├── hash.ts                              # SHA-256 für Filename-Hashing
│   ├── build-manifest.ts                    # MANIFEST.json-Generator
│   ├── translate.ts                         # Claude Code lokal, 7 Zielsprachen
│   ├── build-glyphs.ts                      # fontnik
│   ├── generate-og-snapshots.ts             # MapLibre Headless Karten-PNGs
│   ├── generate-og-images.ts                # Satori + resvg
│   └── verify-data-sources.ts               # Health-Check pre-Build (NFR-I2)
├── tests/
│   └── e2e/
│       ├── address-search.spec.ts           # Journey 1
│       ├── inspector-panel.spec.ts          # Journey 1
│       ├── layer-toggle.spec.ts             # Journey 3
│       ├── accessibility.spec.ts            # Journey 4 + axe
│       ├── webmcp.spec.ts                   # Journey 5
│       ├── i18n.spec.ts                     # Sprach-Wechsel ohne Kontextverlust
│       ├── prerendered-pages.spec.ts        # Bezirk/Kiez/Layer
│       └── fixtures/
│           ├── mock-layers.json
│           └── mock-geocode-response.json
└── docs/
    ├── ARCHITECTURE.md                      # Top-Level
    ├── adr/                                 # Architecture Decision Records
    │   ├── ADR-000-template.md
    │   ├── ADR-001-tile-provider.md
    │   ├── ADR-002-webmcp.md
    │   ├── ADR-003-postgres-deferral.md
    │   ├── ADR-004-cookieless.md
    │   ├── ADR-005-i18n-paraglide.md
    │   ├── ADR-006-tailwind-v4.md
    │   ├── ADR-007-bits-ui.md
    │   ├── ADR-008-context-api-state.md
    │   ├── ADR-009-remote-functions.md
    │   ├── ADR-010-experimental-async.md
    │   └── ADR-011-on-demand-layer-loading.md
    └── runbooks/
        ├── tile-provider-switch.md          # OpenFreeMap → Protomaps
        ├── crowdsec-whitelist.md
        ├── a11y-smoke-test.md               # NVDA + VoiceOver
        ├── data-source-failure.md
        ├── geocode-rate-limit-hit.md
        └── postgres-restore-p2.md           # Phase 2+
```

### Architectural Boundaries

**API Boundaries:**

- **Public Server-Endpoints (`/api/*`)** — minimaler Surface:
  - `GET /api/geocode?q=...` — Nominatim-Proxy. Input: Query-String. Output: JSON-Suggestions. Rate-Limit + LRU-Cache + IP-Anonymisierung.
  - `GET /api/og/[type]/[slug].png` — OG-Image-Renderer. Input: Type+Slug-Param. Output: PNG. Build-Time-Cache mit Hash.
  - `GET /healthz` — Container-Health. Input: keine. Output: 200 OK.
- **KEINE Public-API-Endpoints** für Daten-Konsumenten. Layer-Daten via statische `static/layers/*.geojson` (Asset-Routing, kein API).
- **Remote-Function-Endpoints** sind interne Server-Communication (nicht versioniert, nicht für Drittnutzer).
- **WebMCP-Manifest** unter `/webmcp-manifest.json` ist Discovery-Endpoint für Browser-Agents (read-only, statisch).

**Component Boundaries:**

- **`ui/` ↛ `atlas/`** — UI-Komponenten kennen Domain nicht. Atlas-Komponenten dürfen UI nutzen.
- **`atlas/` ↛ `data/`** über Props oder Remote-Functions. Atlas-Komponenten holen Daten NICHT direkt aus `static/layers/` — immer über `$lib/data/`-Abstraktion.
- **`data/` ↛ `server/`** für Server-only Logik. Client-Code darf `$lib/server/` NICHT importieren — SvelteKit erzwingt das.
- **`webmcp/` ↛ `data/`** für Tool-Implementierungen. WebMCP-Tools sind Adapter, kein neuer Datenpfad.
- **`seo/` ↛ `data/`** für Page-Data-Konsum. SEO-Generators erhalten typed Data, generieren JSON-LD/Meta/Sitemap.

**Service Boundaries:**

- Phase 1: Single SvelteKit-Container. Kein Inter-Service-Communication.
- Phase 2: Postgres-Container im selben Coolify-Compose. Internal-Network. Drizzle als Library-Import in `$lib/data/`.
- Phase 2: RADOLAN-Sidecar (Python FastAPI + wradlib) als separater Container. Internal-Network-Communication via HTTP-API (kein Public-Endpoint).
- Phase 3: PostGIS ersetzt Postgres-Container, gleiche Drizzle-Library-Schicht.

**Data Boundaries:**

- **Statische Layer (Phase 1):** `static/layers/*.geojson` mit `MANIFEST.json` als Single-Source-of-Truth für Provenance. `$lib/data/manifest.ts` typed Loader. KEIN direkter `fetch()` aus Komponenten — nur via `$lib/data/`-Module.
- **DWD-Klima-Bundles:** `static/climate/*.json` pro Station. `$lib/data/get-climate-series.ts` als typed Reader.
- **Translation-Bundles:** Paraglide-Compiler-Output in `$lib/i18n/messages/`. KEIN Runtime-Fetch — Build-Time-tree-shaking.
- **Geocoding-Cache:** In-Process LRU in `$lib/server/geocode.ts`, 1.000 Einträge. Pro Server-Instance.
- **WebMCP-Resources:** URI-adressierbares Datenmodell, Read-Only.

### Requirements to Structure Mapping

**FR-Cluster → Verzeichnis-Mapping:**

| FR-Cluster | FRs | Verzeichnisse / Files |
|------------|-----|------------------------|
| Adress-Discovery & Geocoding | FR1–FR6 | `routes/[lang=lang]/+page.svelte`, `lib/components/atlas/address-search.svelte`, `lib/data/geocode.remote.ts`, `lib/server/geocode.ts`, `routes/api/geocode/+server.ts` |
| Karten-Visualisierung | FR7–FR13, FR11a–e | `lib/components/atlas/map-libre-canvas.svelte`, `lib/components/atlas/map-controls.svelte`, `lib/utils/url-state.ts`, `static/map-style.json`, `static/glyphs/` |
| Layer-System & Inspektor-Panel | FR14–FR21 | `lib/components/atlas/inspector-panel.svelte` + `inspector-panel/`, `lib/components/atlas/layer-palette.svelte`, `lib/components/atlas/data-table-alternative.svelte`, `lib/data/get-layers-at-point.ts`, `lib/data/manifest.ts`, `static/layers/` |
| Klima-Heritage | FR22–FR26 | `lib/components/atlas/climate-sparkline.svelte`, `lib/components/atlas/climate-long-view.svelte`, `lib/data/get-climate-station.ts`, `lib/data/get-climate-series.ts`, `static/climate/`, `lib/utils/nearest-station.ts` |
| Discovery-Surfaces (SEO/AEO) | FR27–FR33 | `routes/[lang=lang]/{bezirk,kiez,layer}/[slug]/`, `lib/components/atlas/{kiez-hero,bezirk-hero,layer-concept-hero}.svelte`, `lib/components/atlas/faq-section.svelte`, `lib/data/{kiez,bezirk,layer-concept,faq}.remote.ts`, `lib/server/og-image.ts`, `lib/components/atlas/og-image-template.svelte`, `routes/api/og/[type]/[slug].png/+server.ts` |
| LLM-/Agent-Surfaces | FR34–FR40 | `lib/seo/`, `routes/llms.txt/+server.ts`, `routes/llms-full.txt/+server.ts`, `routes/webmcp-manifest.json/+server.ts`, `lib/webmcp/`, `static/webmcp-manifest.json` |
| Accessibility & Responsiveness | FR41–FR49 | `lib/components/atlas/skip-link.svelte`, `map-accessibility-layer.svelte`, `data-table-alternative.svelte`, `lib/components/ui/` (Bits-UI), `app.css` (Focus-Ring + Touch-Target), `tests/e2e/accessibility.spec.ts` |
| Editorial-Integrität & Lizenz | FR50–FR55 | `lib/components/atlas/stolperstein-detail.svelte`, `editorial-disclaimer.svelte`, `error-feedback-mailto.svelte`, `license-footer.svelte`, `routes/[lang=lang]/lizenzen/+page.svelte` |
| Internationalization | FR55a–FR55j | `params/lang.ts`, `routes/+layout.server.ts` (Accept-Lang), `lib/i18n/`, `lib/components/atlas/lang-switcher.svelte`, `meta-footer.svelte`, `scripts/translate.ts` |

**Story → File-Mapping (Phase-1-Implementierungsreihenfolge):**

| Story | Files-Touch (primary) |
|-------|------------------------|
| 1.1 Repository-Init | Root-Configs (`package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `.env.example`, `.github/workflows/ci.yml`) |
| 1.2 Design-Token-Setup | `src/app.css` (Tailwind v4 `@theme`), `static/fonts/`, `lib/components/ui/*` (Bits-UI-Wrapper) |
| 1.3 i18n-Routing | `params/lang.ts`, `hooks.server.ts`, `routes/+layout.server.ts`, `routes/[lang=lang]/+layout.svelte`, `lib/components/atlas/lang-switcher.svelte`, `lib/i18n/strings/de.json` |
| 1.4 Daten-Pipeline | `scripts/fetch-static.ts`, `scripts/reproject.ts`, `scripts/simplify.ts`, `scripts/build-manifest.ts`, `static/layers/MANIFEST.json` |
| 1.5 Daten-Zugriffs-Abstraktion | `lib/data/types.ts`, `lib/data/manifest.ts`, `lib/data/get-layers-at-point.ts`, `lib/data/get-climate-*.ts`, `lib/utils/retry.ts`, Unit-Tests co-located |
| 1.6 Karte + A11y-Layer | `lib/components/atlas/map-libre-canvas.svelte`, `map-accessibility-layer.svelte`, `map-controls.svelte`, `lib/utils/url-state.ts`, `static/map-style.json`, `static/glyphs/` (via `scripts/build-glyphs.ts`) |
| 1.7 Inspektor-Panel | `lib/components/atlas/inspector-panel.svelte` + `inspector-panel/*`, `lib/state/ui-context.ts` |
| 1.8 Layer-Palette | `lib/components/atlas/layer-palette.svelte` |
| 1.9 Klima-Heritage | `lib/components/atlas/climate-sparkline.svelte`, `climate-long-view.svelte`, `static/climate/`, `lib/utils/nearest-station.ts` |
| 1.10 SEO/AEO-Stack | `lib/seo/*`, `routes/llms*.txt/+server.ts`, `routes/sitemap*.xml/+server.ts`, `routes/robots.txt/+server.ts` |
| 1.11 WebMCP-Integration | `lib/webmcp/adapter.ts`, `lib/webmcp/tools/*`, `lib/webmcp/resources/*`, `lib/webmcp/prompts/*`, `static/webmcp-manifest.json` |
| 1.12 OG-Image-Pipeline | `lib/server/og-image.ts`, `og-snapshot.ts`, `lib/components/atlas/og-image-template.svelte`, `scripts/generate-og-snapshots.ts`, `scripts/generate-og-images.ts`, `routes/api/og/[type]/[slug].png/+server.ts` |
| 1.13 FAQ + SEO-Pages | `routes/[lang=lang]/{bezirk,kiez,layer}/[slug]/`, `lib/components/atlas/{kiez,bezirk,layer-concept}-hero.svelte`, `lib/components/atlas/faq-section.svelte`, `lib/data/{kiez,bezirk,layer-concept,faq}.remote.ts` |
| 1.14 Translation-Pipeline | `scripts/translate.ts`, `lib/i18n/messages/*` |
| 1.15 Hosting-Setup + CI/CD | `docker-compose.yml`, `coolify.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `lighthouserc.cjs` |
| 1.16 Editorial-Verantwortung | `lib/components/atlas/stolperstein-detail.svelte`, `editorial-disclaimer.svelte`, `error-feedback-mailto.svelte`, `license-footer.svelte`, `meta-footer.svelte` |

**Cross-Cutting Concerns:**

| Concern | Lebt in |
|---------|---------|
| Accessibility | `lib/components/ui/` (Bits-UI accessible-by-default), `lib/components/atlas/skip-link.svelte`, `map-accessibility-layer.svelte`, `data-table-alternative.svelte`, ARIA-Live in `inspector-panel.svelte`, axe-core in `tests/e2e/accessibility.spec.ts`, Focus-Ring in `app.css` |
| i18n / RTL | `params/lang.ts`, `lib/i18n/`, `lib/components/atlas/lang-switcher.svelte`, RTL via Tailwind-Logical-Properties (`me-*`/`ms-*`), `<html lang dir>` in `routes/[lang=lang]/+layout.svelte` |
| SEO / AEO | `lib/seo/`, `<svelte:head>` in jeder Route, `routes/llms*.txt`, `sitemap*.xml`, `robots.txt`, JSON-LD pro Page, hreflang in Layout |
| Datenstand & Lizenz | `static/layers/MANIFEST.json`, `lib/data/manifest.ts`, `data-stand-banner.svelte` in jeder Layer-Hit-Row, `license-footer.svelte` auto-generiert, `routes/[lang=lang]/lizenzen/+page.svelte` |
| Editorial-Verantwortung | `stolperstein-detail.svelte`, `editorial-disclaimer.svelte`, `error-feedback-mailto.svelte`, Translation-Disclaimer in `meta-footer.svelte` |
| Cookieless | `hooks.server.ts` (CSP + kein `Set-Cookie`), URL-State in `lib/utils/url-state.ts`, Context-API statt Module-State, CI-Gate in `.github/workflows/ci.yml` |
| Performance | Vite-`manualChunks` in `vite.config.ts`, MapLibre-Lazy-Load in `map-libre-canvas.svelte`, Plex-Subset in `static/fonts/`, Critical-CSS in `app.css`, Cache-Header via Traefik + `hooks.server.ts`, In-Process LRU in `lib/server/geocode.ts` und `lib/data/get-layers-at-point.ts` |
| Build-Reproduzierbarkeit | `scripts/*` deterministisch, `static/layers/MANIFEST.json` mit SHA, `pnpm-lock.yaml` committed, Translation-Bundles committed |

### Integration Points

**Internal Communication:**

- **Component → Component:** Props (down) + Callbacks `on{Event}` (up). Cross-Hierarchy via Context-API (`ui-context.ts`).
- **Component → Data:** Remote-Functions (`*.remote.ts`) für Server-Roundtrip; statische Layer-Files via `$lib/data/`-Abstraktion mit `fetch()` aus `static/layers/`.
- **Component → URL-State:** `goto()` mit `replaceState: true` für Viewport-Changes; `page.url.searchParams` für Read.
- **Server-Endpoint → Server-Logik:** Direkter Function-Import aus `$lib/server/`. SvelteKit garantiert Server-only.
- **WebMCP-Tool → Data-Layer:** Tools delegieren an `$lib/data/`-Functions. Kein eigener Datenpfad.

**External Integrations:**

| Service | Endpoint | Phase | Use | Auth | Rate-Limit |
|---------|----------|-------|-----|------|------------|
| FIS-Broker WFS | `https://fbinter.stadt-berlin.de/fb/wfs/...` | Build-Time P1 | Layer-GeoJSON | keine | Build-Cadence |
| ODIS | `https://daten.odis-berlin.de/...` | Build-Time P1 | Boundary-GeoJSON | keine | Build-Cadence |
| DWD CDC | `https://opendata.dwd.de/climate_environment/CDC/` | Build-Time P1 | Klima-CSV | keine | Build-Cadence |
| OSM Overpass | `https://overpass-api.de/api/interpreter` | Build-Time P1 | Stolpersteine | keine | Daily-Cadence |
| Nominatim | `https://nominatim.openstreetmap.org/` | Runtime P1 | Geocoding | User-Agent | 1 req/s, LRU 1.000 |
| OpenFreeMap | `https://tiles.openfreemap.org/...` | Runtime P1 | Map-Tiles | keine | direkt vom Browser |
| Protomaps | `https://api.protomaps.com/...` | Hedge P1 | Map-Tiles-Fallback | API-Key (Env-Var) | 1M Tiles/Monat free |
| BVG/VBB v6 | `https://v6.bvg.transport.rest/` | Runtime P2 | Live-Departures | keine | 100 req/min |
| BLUME | `https://luftdaten.berlin.de/api/...` | Runtime P2 | Luftqualität | keine | reasonable |
| Bright Sky / Open-Meteo | `https://api.brightsky.dev/` | Runtime P2 | Wetter | keine | reasonable |
| Let's Encrypt | ACME via Traefik | Runtime | TLS-Cert-Renewal | DNS-Challenge | Standard |

**Data Flow:**

**Build-Time:**

1. `pnpm fetch` → `scripts/fetch-static.ts` ruft FIS-Broker/ODIS/DWD/OSM Overpass parallel mit Retry-Backoff (NFR-I1).
2. `scripts/reproject.ts` konvertiert EPSG:25833 → EPSG:4326 mit `proj4` (NFR-I3).
3. `scripts/simplify.ts` (mapshaper) reduziert GeoJSON-Größe ohne visuelle Verluste.
4. `scripts/hash.ts` generiert SHA-256 → Filename-Hash für `immutable`-Caching.
5. `scripts/build-manifest.ts` schreibt `static/layers/MANIFEST.json` mit Provenance pro Layer.
6. `scripts/build-glyphs.ts` (fontnik) baut Plex-Glyph-Pack einmalig (committed).
7. `scripts/translate.ts` ruft Claude Code lokal für 7 Zielsprachen, Paraglide-Compiler generiert `lib/i18n/messages/`.
8. `pnpm build` → SvelteKit prerendert ~1.600 Routen, `prerender()`-Functions enumerieren Argument-Space.
9. `scripts/generate-og-snapshots.ts` rendert Karten-PNGs headless für jede prerendered Page.
10. `scripts/generate-og-images.ts` (Satori + resvg) überlagert Plex-Text + Top-3-Statistik auf Snapshots.
11. Build-Output in `build/` → Coolify-Deploy.

**Runtime (Phase 1):**

1. User öffnet `https://navigator.berlin/de/kiez/boxhagener-kiez?bbox=...&layers=mietspiegel`.
2. Traefik terminiert TLS, fügt Security-Header, CrowdSec-Plugin prüft Request.
3. SvelteKit serviert prerendered HTML mit JSON-LD + hreflang + OG-Image-URL.
4. Browser hydratisiert: `+layout.svelte` baut Context (UiState), `+page.svelte` rendert Hero + lazy-load MapLibre.
5. User tippt Adresse → `geocodeAddress()`-Remote-Function ruft `/api/geocode` → Server-Proxy fragt Nominatim mit Rate-Limit + LRU.
6. User selektiert Suggestion → URL-State-Update (`goto`), `getLayersAtPoint()` aus `$lib/data/` rechnet via Turf+rbush, In-Process-LRU-Cache.
7. Inspektor-Panel rendert mit ARIA-Live-Update, Layer-Hit-Rows zeigen Wert + Datenstand + Mailto.
8. WebMCP-Agent-Discovery: Browser-Extension liest `/webmcp-manifest.json`, ruft Tools direkt im Browser-Kontext, Tools delegieren an `$lib/data/`.

**Runtime (Phase 2 BVG-Live):**

1. User selektiert Adresse → Inspektor-Panel zeigt Bus-Stop-Layer.
2. `bvgDepartures.live()`-Remote-Function startet Async-Generator-Stream.
3. Server-Side fetcht alle 30s `v6.bvg.transport.rest`, yieldet Updates.
4. Component reagiert auf Stream via `<svelte:boundary>`+`{#each await ...}`-Pattern.
5. Bei API-Ausfall: Async-Generator wirft, `failed`-Snippet zeigt „BVG-Live nicht verfügbar".

### File Organization Patterns

**Configuration Files:** Root-Level (`svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `playwright.config.ts`, `vitest.config.ts`, `lighthouserc.cjs`, `.env.example`, `docker-compose.yml`, `coolify.json`).

**Source Organization:** Feature-Cluster im `lib/`-Bereich (`data/`, `components/`, `seo/`, `webmcp/`, `i18n/`, `state/`, `server/`, `utils/`). Routing-Structure spiegelt URL-Hierarchie 1:1.

**Test Organization:** Unit-Tests co-located (`*.test.ts` neben Source). E2E in `tests/e2e/` mit Spec-Files pro User-Journey + Cross-Cutting (a11y, i18n).

**Asset Organization:** `static/` für unveränderliche Assets (Fonts, Glyphs, Layer-GeoJSON, Klima-Bundles, OG-Snapshots, Map-Style). Build-Time generierte Assets bekommen Hash-Suffix für `immutable`-Caching.

**Documentation:** `README.md` recruiter-readable mit Stack-Showcase. `docs/ARCHITECTURE.md` für Entwickler-Onboarding. `docs/adr/` für Decision-Records (NFR-M2, NFR-M6). `docs/runbooks/` für Disaster-Recovery (NFR-R6).

### Development Workflow Integration

**Development Server Structure:**

- `pnpm dev` startet Vite-Dev-Server mit HMR. SvelteKit-Routing live, Remote-Functions hot-reload.
- Build-Time-Daten (`static/layers/`) müssen einmal vorab gefetcht werden (`pnpm fetch`); dann per HMR konsumierbar.
- Translation-Bundles werden bei Source-`de.json`-Änderung via Paraglide-Watch-Mode neu kompiliert.

**Build Process Structure:**

```bash
pnpm install                  # deps
pnpm fetch                    # Build-Zeit-Daten + Manifest
pnpm i18n:compile             # Paraglide-Compile (oder via build-Hook)
pnpm build                    # SvelteKit-Build, prerender, OG-Images
# Output: build/ (Node-Server)
```

**Deployment Structure:**

- Coolify-Compose deployed `build/` als Node-Container, Traefik als Reverse-Proxy mit CrowdSec-Plugin.
- Coolify-Webhook triggered von GitHub-Actions `deploy.yml` nach erfolgreichem main-Branch-Build.
- Daily-Backup via Coolify-Volume-Snapshot (NFR-R4).
- Disaster-Recovery via Runbook-Step-Befehle in `docs/runbooks/`.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

- **SvelteKit v2 + Svelte 5 Runes + adapter-node + Vite** — offiziell kompatibel, Mai-2026-Releases tragen TypeScript-6.0-Support und experimental.async-Feature.
- **Tailwind v4 + Bits UI + Plex Variable Fonts** — Bits UI ist headless ohne CSS-Vorgaben, kombiniert sauber mit Tailwind-v4-`@theme`-Tokens. Plex als Tailwind-`--font-*`-Variable.
- **LayerChart v2 (`@next`) + Svelte 5 Runes** — runes-nativ, keine Adapter-Layer.
- **MapLibre GL JS + Vite + Lazy-Load** — Standard-Pattern via Dynamic-Import, Vite bundlet MapLibre in eigene async-Chunk.
- **WebMCP browser-side + SvelteKit Hybrid** — kein Konflikt, WebMCP läuft im Browser-Agenten-Kontext, SvelteKit liefert nur statisches Manifest + Tool-Descriptions.
- **Paraglide + SvelteKit-Param-Matcher** — offiziell unterstützt, Routing-Adapter dokumentiert.
- **Hetzner + Coolify + Traefik + CrowdSec** — produktiv getestete Combo, Hetzner-Tutorial Januar 2026 als Vorlage (Distillate).
- **Cookieless + URL-State + Context-API** — kein Konflikt, alle drei Pattern verstärken sich gegenseitig (kein Set-Cookie, kein Module-State-Leak, deeplinkbare State).

**Mitigations für Pre-Stable-Features:**

- `experimental.async = true` ist Pre-Stable. Mitigation: explizit in ADR-010 dokumentiert, fallback-Pattern via `{#await}`-Block bleibt unterstützt.
- `query.live` Phase 2 explizit experimental. Mitigation: Adapter-Schicht in `$lib/data/`-Wrappern, fallback-Pattern via `load`+30s-Polling dokumentiert in ADR-009.
- WebMCP Pre-1.0. Mitigation: Adapter-Schicht in `$lib/webmcp/`, Spec-Version-Pin in `webmcp-manifest.json`, Adapter-Update bei Spec-Breaking-Change ohne Tool-Code-Änderung.

**Pattern Consistency:**

- Naming-Patterns (kebab-case Files, PascalCase Components, snake_case WebMCP-Tools) durchgängig dokumentiert mit Beispielen, kollidiert nicht mit Stack-Konventionen.
- Component-Boundaries (`ui/` ↛ `atlas/` ↛ `data/` ↛ `server/`) decken Schichten-Trennung; SvelteKit erzwingt `$lib/server/`-Server-only.
- Async-Patterns (`<svelte:boundary>` + Remote Functions) konsistent mit Svelte-5-Best-Practices.
- Cookieless-Pattern enforced via CI-Gate (Response-Header-Test).

**Structure Alignment:**

- Verzeichnis-Tree spiegelt FR-Cluster-Mapping 1:1.
- Routing-Hierarchie (`[lang=lang]/{bezirk,kiez,layer}/[slug]/`) deckt alle ~1.600 prerendered Routen via `entries`-Hook.
- Static-Assets (`static/layers/`, `static/climate/`, `static/glyphs/`, `static/fonts/`) reflektieren Build-Pipeline-Output deterministisch.
- Story-Reihenfolge (1.1 → 1.16) hat keine zirkuläre Dependencies (verifiziert via Cross-Component-Dependency-Liste in Step-4).

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR-Range | Cluster | Architektonische Abdeckung |
|----------|---------|----------------------------|
| FR1–FR6 | Adress-Discovery | ✅ `address-search.svelte` + `geocode.remote.ts` + Server-Proxy |
| FR7–FR13, FR11a–e | Karten-Visualisierung | ✅ `map-libre-canvas.svelte` + `url-state.ts` + Layer-Granularität-Manifest |
| FR14–FR21 | Layer-System & Inspektor | ✅ `inspector-panel.svelte` + `layer-palette.svelte` + `data-table-alternative.svelte` + Trinkbrunnen-Saisonalität in MANIFEST |
| FR22–FR26 | Klima-Heritage | ✅ `climate-sparkline.svelte` + `climate-long-view.svelte` + DWD-Bundles |
| FR27–FR33 | Discovery-Surfaces | ✅ Prerendered Routes mit OG-Image-Pipeline + Progressive Enhancement |
| FR34–FR40 | LLM-/Agent-Surfaces | ✅ `llms*.txt`-Endpoints + JSON-LD-Generators + WebMCP 5+ Tools |
| FR41–FR49 | Accessibility | ✅ Skip-Link + Bits-UI + Map-A11y-Layer + Data-Table-Alt + ARIA-Live + Touch-Target-Tokens |
| FR50–FR55 | Editorial-Integrität | ✅ Stolperstein-Detail + Disclaimer + Mailto + Lizenz-Footer |
| FR55a–FR55j | i18n | ✅ Paraglide + Param-Matcher + Accept-Lang-Redirect + RTL via Logical Properties + Translation-Pipeline |
| FR56–FR67 | Phase 2/3 | ✅ Architektonisch vorbereitet via Adapter-Schichten (Drizzle, query.live, PostGIS, Sidecar) |

**Non-Functional Requirements Coverage:**

| NFR-Kategorie | Coverage-Mechanismus |
|---------------|----------------------|
| Performance (NFR-P1–P10) | ✅ MapLibre lazy + Plex subset + Vite manualChunks + Cache-Header + LRU + Lighthouse-CI-Gate + Bundle-Size-CI-Gate |
| Security (NFR-S1–S8) | ✅ TLS 1.3 + Strict CSP + HSTS/Frame-Options/etc + CrowdSec + Hetzner-DDoS + US-Domain-Allowlist-CI-Gate + SSH-Key-only |
| Privacy/DSGVO (NFR-PR1–PR7) | ✅ null Set-Cookie + Cookie-Leak-CI-Gate + IP-Pseudonymisierung + Impressum + Datenschutz-Footer |
| Accessibility (NFR-A1–A10) | ✅ axe-core CI-Gate + Lighthouse ≥95 + Keyboard-Nav + AAA-Kontraste + Touch-Target ≥44px + Focus-Ring-Token + Reduced-Motion + Daten-Tabellen-Alt + BFSG-Footer |
| Integration (NFR-I1–I8) | ✅ Build-Time-Fetch mit Retry + Health-Check + Reprojektion + Manifest + Lizenz-Hierarchie + Nominatim-Rate-Limit + WebMCP-Spec-Version |
| Reliability (NFR-R1–R6) | ✅ Coolify-Auto-Restart + Daily-Backup + Domain-Auto-Renewal + Disaster-Recovery-Runbooks + Graceful-Degradation für P2-Live-Endpoints |
| Maintainability (NFR-M1–M8) | ✅ Reproduzierbarer Build + Public Repo MIT + TS-strict + ESLint-Prettier + Vitest 80% Coverage + ADR-Verzeichnis + Files <500 Zeilen |
| i18n (NFR-IL1–IL10) | ✅ 8 Sprachen + Build-Time-Translation + Glyph-Pack 4 Skripte + RTL via Logical Properties + URL-Prefix cookieless + hreflang + Translation-Quality-Gate |

### Implementation Readiness Validation ✅

**Decision Completeness:**

- Critical Decisions (Framework, Adapter, DB-Strategie, Hosting, Geocoding, i18n, A11y) ✅ alle dokumentiert mit verifizierten Versionen.
- Important Decisions (Layer-Loading, OG-Engine, State-Management, Sitemap, Map-Style, CI, Hetzner-Sizing) ✅ alle entschieden + begründet.
- Deferred Decisions (Drizzle-Schema, PostGIS-Pattern, Live-Polling, Embed-Schema, RADOLAN-Sidecar) ✅ explizit als Phase-2/3-Items markiert mit Trigger-Bedingung.

**Structure Completeness:**

- Vollständiger Project-Tree dokumentiert mit ~150 Files/Verzeichnissen.
- Alle Component-Boundaries definiert (ui/atlas/data/server/seo/webmcp/i18n/state/utils).
- Integration-Points katalogisiert (External-Services-Tabelle mit 11 Endpunkten).
- Story → File-Mapping deckt alle 16 Phase-1-Stories.

**Pattern Completeness:**

- Naming/Structure/Format/Communication/Process-Patterns dokumentiert.
- Svelte/SvelteKit-Best-Practices integriert (Runes-Disziplin, Context-API, Async-Patterns, Remote Functions).
- 21 verbindliche „All AI Agents MUST"-Regeln.
- Anti-Patterns mit konkreten Beispielen.
- 8 CI-Gates definiert (Lint/Type/Format/A11y/Bundle/Cookie/US-Domain/Lighthouse).

### Gap Analysis Results

**Critical Gaps:** Keine. Architektur ist implementierbar.

**Important Gaps (sollten in Story-1.1 oder Story-1.15 adressiert werden):**

1. **CSP-Connect-Source-Whitelist konkretisieren.** Liste der erlaubten `connect-src`-Domains (OpenFreeMap-Tiles, Nominatim-Public, FIS-Broker bei Build, etc.) muss in `$lib/server/csp.ts` explizit aufgelistet werden. Aktuell konzeptionell, nicht enumeriert.
2. **Git-LFS-Entscheidung.** Plex Variable Fonts (~500KB-2MB pro File), Glyph-Packs (bis 50MB pro Skript), Klima-JSON-Bundles (Dahlem 1719+ kann mehrere MB) tendieren in LFS-Bereich. Trade-off: LFS = repo-clone-overhead + Git-Provider-Storage-Kosten vs. flat Git = clone-time-bloat. **Empfehlung:** Glyph-Packs als Build-Artefakt (NICHT committed, regen-bar via `pnpm build:glyphs`), Plex-Fonts + Klima-JSON committed (im normalen Git, Größenordnung okay).
3. **Pre-commit-Hooks-Decision.** Husky vs. Lefthook vs. SimpleGitHooks für lokale Lint-/Format-/Typecheck-Triggers. Trade-off: vermeidet CI-Round-Trip für triviale Lint-Fehler. **Empfehlung:** Lefthook (Go-binary, keine Node-Runtime-Dependency, schnell). Konfig in `lefthook.yml`.
4. **`.env.example`-Vollständigkeit.** Aktuell konzeptionell aufgelistet. Konkrete Variable mit Beispiel-Werten + Kommentaren als Story-1.1-Output.
5. **ADR-Templates fehlen.** ADR-000-template.md als Standard-Markdown-Template (Title/Status/Context/Decision/Consequences/Alternatives) muss in Story-1.1 angelegt werden.

**Nice-to-Have Gaps:**

6. **E2E-Visual-Regression-Tests** via Playwright-Screenshot-Compare könnte UI-Drift fangen. Phase-1-Optional.
7. **ARIA-Live-Politeness-Decision pro Komponente.** `polite` vs. `assertive` — aktuell nicht differenziert. Default `polite` für Inspektor-Panel, `assertive` nur für Errors. Granular in Komponenten-Implementierung dokumentieren.
8. **Bun-Runtime-Evaluation.** Distillate fixiert Hetzner+Node, Bun nicht evaluiert. Phase-2-Reevaluation falls Build-Performance-Probleme.
9. **Storybook-Wiedereinsetzung Phase 2** falls Komponenten-Galerie-Need entsteht. Aktuell explizit raus.
10. **Continuous-Performance-Budgeting via Web-Vitals-Tracker** in Production. Aktuell nur CI-Lighthouse — kein Real-User-Monitoring (RUM). Anti-Tracking-Linie verbietet RUM-Drittanbieter; eventuell via Server-Log-Aggregat-Analyse als Phase-2-Idee.

### Validation Issues Addressed

Alle „Important Gaps" werden in Implementation-Phase adressiert (Story 1.1 für #2/3/4/5, Story 1.15 für #1). „Nice-to-Have Gaps" sind explizit deferred ohne Implementation-Block.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION** — alle 16 Checklist-Items sind `[x]`, keine Critical Gaps offen, Important Gaps haben Mitigation-Pfad in definierten Stories.

**Confidence Level:** **High** — Stack ist Mai-2026-aktuell verifiziert, alle Decisions gegen NFR-Gates abgesichert, Phase-Boundaries als Hedge-Pattern dokumentiert, Adapter-Schichten für Pre-Stable-Features (experimental.async, query.live, WebMCP).

**Key Strengths:**

1. **Konsistenter EU-FOSS-Stack** ohne US-Drittanbieter-Surface — DSGVO/Cookieless durch Architektur, nicht Compliance-Theater.
2. **A11y-First-Pattern** mit Bits-UI + Map-A11y-Layer + Daten-Tabellen-Alternative + axe-core-CI-Gate — WCAG 2.2 AA komplett mit AAA-Aspirationen.
3. **Phase-Hedge-Architektur** — Daten-Abstraktion, WebMCP-Adapter, Tile-Provider-Env-Var, Live-Endpoint-Health-Check vorbereiten Phase-2/3-Erweiterungen ohne Component-Code-Änderung.
4. **Reproduzierbarer Build** — `pnpm install && pnpm fetch && pnpm build` deterministisch, Manifest mit SHA pro Layer, recruiter-readable Open-Source-Repo.
5. **Performance-Budget-Disziplin** — 8 CI-Gates (Lint/Type/Format/A11y/Bundle/Cookie/US-Domain/Lighthouse) verhindern Drift.
6. **i18n-Foundation** — 8 Sprachen + RTL ab Phase 1 als Architektur-Pflicht, nicht Phase-2-Patch.
7. **Modern Svelte-Patterns** — Runes + Context-API + Remote Functions + experimental.async + `<svelte:boundary>` als Default-Stack.

**Areas for Future Enhancement:**

1. PostGIS-Cross-Layer-Aggregation (Phase 3) für Datenjournalismus-Power-Use-Cases.
2. Embeddable Widgets / oEmbed (Phase 2) für Tagesspiegel/RBB-Einbettung.
3. Cross-Data-Erzählungen als deterministische Templates (Phase 2) — Layer-Story-Modus.
4. Memorial-Map kuratiert (Phase 3) — „was nicht mehr da ist"-Schicht.
5. Real-User-Monitoring über Server-Log-Aggregate (anti-Tracking-konform, Phase-2-Idee).

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions in this document **exactly** as documented.
- Use implementation patterns consistently — alle 21 „MUST"-Regeln verbindlich.
- Respect project structure and boundaries (`ui/` ↛ `atlas/` ↛ `data/` ↛ `server/`).
- Verify Mai-2026-current package versions vor `pnpm add`.
- Refer to this document for all architectural questions; bei Konflikten zwischen ad-hoc-Implementierung und dokumentierten Patterns gewinnen die Patterns.
- Bei Pattern-Verletzung-Bedarf: ADR in `docs/adr/ADR-NNN-*.md` erstellen mit Begründung + Migration-Pfad.

**First Implementation Priority (Story 1.1: Repository-Initialisierung):**

```bash
pnpm dlx sv create navigator-berlin \
  --template=minimal \
  --types=ts \
  --no-install
cd navigator-berlin
pnpm dlx sv add prettier eslint vitest playwright paraglide tailwindcss
pnpm install
pnpm add maplibre-gl layerchart@next d3-scale d3-interpolate d3-array \
  @turf/boolean-point-in-polygon @turf/helpers @turf/distance rbush \
  lru-cache @lucide/svelte bits-ui webmcp valibot
pnpm add -D mapshaper fontnik proj4 satori @resvg/resvg-js \
  @axe-core/playwright @lhci/cli size-limit lefthook
```

Während `sv create` interaktiv: `@sveltejs/adapter-node` als Adapter wählen.

Direkt danach: `experimental.async = true` in `svelte.config.js` aktivieren, ADR-Verzeichnis anlegen mit ADR-000-template.md + ADR-001 bis ADR-011 als Stub-Files (ein Stub pro entschiedener Architektur-Decision).

**Implementation-Reihenfolge:** Stories 1.1 → 1.16 mit Cross-Component-Dependencies aus Step-4 (1.4 vor 1.5, 1.5 blockt 1.6/1.7/1.9/1.11/1.13, 1.2 blockt UI-Komponenten, 1.3 blockt 1.13/1.14).
