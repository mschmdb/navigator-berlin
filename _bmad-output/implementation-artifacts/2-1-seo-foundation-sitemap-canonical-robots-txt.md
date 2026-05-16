# Story 2.1: SEO-Foundation mit Sitemap + Canonical + robots.txt

Status: review

## Story

As a Suchmaschine,
I want eine sauber strukturierte Site mit dynamischen Title/Meta pro Route, Canonical-URLs, Sitemap-Index und robots.txt,
so that ich alle prerendered Pages effizient indexieren kann ohne Duplicate-Content und mit klarer hreflang-de/en-Cluster-Zuordnung.

## Probleme heute

1. Es existiert keine `sitemap.xml` und keine `robots.txt`. Suchmaschinen finden Pages nur über zufällige Backlinks.
2. Die Root-Route `/` setzt `<link rel="canonical">` mit `page.url.search` als Suffix. Das produziert für jeden Karten-State (`?bbox=`, `?layers=`, `?address=`, `?lat=`/`?lng=`) einen separaten Canonical und damit Duplicate-Content für eine in Wahrheit identische Indexierungs-Einheit.
3. Layer-Detail-, Methodik- und Lizenzen-Page haben weder `<link rel="canonical">` noch `<link rel="alternate" hreflang>`. Der Suchmaschinen-Cluster für DE/EN-Variante ist nicht erkennbar.
4. Root-Route ist nicht prerenderable wie aktuell geschrieben (interaktiver Karten-State). FR33 (lesbar ohne JavaScript) und NFR-P1 (LCP <2.5s) sind verletzt.
5. Bezirks-/Kiez-/Ranking-Routen aus späteren Stories (2.3, 2.4, 2.9b) brauchen Sitemap-Aufnahme bei Existenz, ohne dass diese Story sie schon kennt. Sitemap muss erweiterbar bleiben.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1061-1087.
- PRD: FR27-FR33 (`prd.md` Zeile 729-735), NFR-P1/P3/P7/P8 (Performance + Lighthouse Gates).
- Architecture: `architecture.md` Zeile 124 (SEO-Cluster), Zeile 475 (Sitemap-Strategie: Index + Per-Sprache), Zeile 1248-1250 (Routes-Pattern).
- Bestehende Routes:
  - `routes/(with-header)/+page.svelte` (Root-Karte, hat `<svelte:head>` mit Bug bei Canonical + OG-Tags bereits gesetzt)
  - `routes/(with-header)/lizenzen/+page.svelte` (`prerender = true`, Title + Description, KEIN Canonical, KEIN OG, KEIN hreflang)
  - `routes/(with-header)/methodik/+page.svelte` (`prerender = true`, Title + Description + JSON-LD, KEIN Canonical, KEIN OG, KEIN hreflang)
  - `routes/(with-header)/layer/[slug]/+page.svelte` (PageLoad ohne explizites `prerender`, Title + Description, KEIN Canonical, KEIN OG, KEIN hreflang)
- Paraglide-Setup: `src/lib/paraglide/runtime.ts` exportiert `locales`, `localizeHref`, `getLocale`. Reroute strippt Locale (Memory `project_paraglide_reroute.md`); EN-Routen sind `/en/...`.
- Memory `feedback_no_em_dashes.md`: keine em-dashes in UI/Code/Comments.
- Story 2.0 (ready-for-dev): `bezirk_stats`/`kiez_stats`-Tabellen — Sitemap muss Slugs aus Postgres oder Manifest ableiten können, nicht hardcoden.

## Akzeptanz-Kriterien

1. **AC-1 (Pro-Route Title + Meta-Description):**
   **Given** SvelteKit-Routing mit den existierenden 4 prerenderbaren Routen plus Root
   **When** ich pro Route `<svelte:head>` mit dynamischem `<title>` und `<meta name="description">` aus Page-Daten setze
   **Then**:
   - Root `/` (DE) und `/en` (EN): Title + Description aus i18n-Messages plus statischer Berlin-Lead-Subline
   - `/methodik`, `/lizenzen`: bestehende Title bleiben, Description-Cleanup wo nötig
   - `/layer/[slug]`: bestehender Title bleibt, Description ist Layer-Explain-Short
   - Keine globalen Defaults in `app.html`. Jede Page hat eigene SEO-Identität (FR32)
   - Test: Snapshot-Test pro Route prüft `<title>` und `<meta name="description">`-Existenz

2. **AC-2 (Canonical-URL korrekt, ohne Query-Params):**
   **Given** alle prerendered Routes
   **When** ich pro Page `<link rel="canonical" href="...">` setze
   **Then**:
   - Canonical enthält `${origin}${page.url.pathname}` ohne Query-Params (`page.url.search` muss raus)
   - Origin wird konsistent abgeleitet: `page.url.origin` für Runtime, in Production via SvelteKit-`ORIGIN`-env-Var (gleicher Pattern wie Story 1.20 Permalink-Domain)
   - Trailing-Slash-Konvention: ohne Trailing-Slash (SvelteKit-Default), konsistent über alle Routen
   - Root-Route `/` und EN-Variante `/en` haben jeweils eigene Canonical (kein Cross-Locale-Canonical)
   - Bug-Fix in `routes/(with-header)/+page.svelte:770` (entfernt `page.url.search` aus Canonical)
   - Test: pro Route Snapshot-Test der Canonical-URL ohne Query-Params

3. **AC-3 (hreflang-Cluster pro Page):**
   **Given** Paraglide-Setup mit de + en (Story 3.1 reduziert das von 8 Locales auf 2; bis dahin ggf. nur de aktiv)
   **When** ich pro prerendered Page einen hreflang-Cluster im `<svelte:head>` rendere
   **Then**:
   - `<link rel="alternate" hreflang="de" href="${origin}${dePath}">`
   - `<link rel="alternate" hreflang="en" href="${origin}${enPath}">` (ab Story 3.2 EN-Coverage; bis dahin Self-Referenz akzeptabel mit Dev-Note)
   - `<link rel="alternate" hreflang="x-default" href="${origin}${dePath}">` (DE als Default)
   - Path-Berechnung via `localizeHref()` aus `$lib/paraglide/runtime`
   - Cluster ist auf allen 4+1 Routen (Root, Methodik, Lizenzen, Layer-Detail, plus später Bezirk/Kiez/Ranking) identisch implementiert (DRY via Komponente, siehe AC-7)

4. **AC-4 (sitemap.xml als Index + Per-Sprache-Sitemaps):**
   **Given** SvelteKit-Routing und prerendered Routes
   **When** ich `routes/sitemap.xml/+server.ts` (Index) und `routes/sitemap-[lang]/+server.ts` (Per-Sprache: `de`, `en`) implementiere
   **Then**:
   - `/sitemap.xml` ist Sitemap-Index mit Verweisen auf `/sitemap-de.xml` und `/sitemap-en.xml`
   - `/sitemap-de.xml` enthält alle DE-prerendered URLs (initial: `/`, `/methodik`, `/lizenzen`, `/layer/[slug]`-Liste aus Manifest)
   - `/sitemap-en.xml` enthält alle EN-prerendered URLs (`/en`, `/en/methodik`, `/en/lizenzen`, `/en/layer/[slug]`-Liste); falls EN-Variante einer Page noch nicht existiert (Story 3.2 + 4.5/4.6 sind future), Sitemap überspringt diese URL und dokumentiert das in Build-Output
   - Beide Per-Sprache-Sitemaps werden Build-Time (`prerender = true` im Endpoint) generiert; keine Runtime-Generation
   - URL-Quellen werden zentral aus `$lib/seo/sitemap-builder.ts` gelesen, das aus `MANIFEST.json` (für Layer-Slugs) und später aus `bezirk_stats`/`kiez_stats` (Story 2.0) Slugs holt. Der Builder hat eine offene Schnittstelle damit Stories 2.3/2.4/2.9b ihre Routes ohne Sitemap-Edit registrieren können
   - `<lastmod>` pro URL: für Layer-Detail aus `MANIFEST.layers[].fetchedAt` oder `sourceUpdatedAt`; für Methodik/Lizenzen aus `git log -1 --format=%cI <file>` zur Build-Time (akzeptable Granularität); für Root statisch aus dem Build-Timestamp
   - Schema-Validierung: Sitemap entspricht Sitemap-Protokoll 0.9 (XML-namespace `http://www.sitemaps.org/schemas/sitemap/0.9`)
   - Test: Snapshot-Test pro Sitemap, plus XML-Schema-Validierung gegen Sitemap-Schema (oder mindestens valides XML-Parsing)

5. **AC-5 (robots.txt mit Allow-All + Sitemap-Verweis):**
   **Given** SEO-Setup
   **When** ich `routes/robots.txt/+server.ts` implementiere
   **Then**:
   - Body ist:
     ```
     User-agent: *
     Allow: /

     Sitemap: ${origin}/sitemap.xml
     ```
   - Keine Disallow-Direktiven (alle Pages indexierbar; `_dev/`-Routen sind in Production-Build sowieso nicht gerendert wegen `prerender = false` und kein Eintrag in Sitemap)
   - `Content-Type: text/plain; charset=utf-8`
   - Test: Snapshot-Test des Body, Test dass Sitemap-URL erreichbar

6. **AC-6 (prerender = true pro Route):**
   **Given** alle SEO-relevanten Routes
   **When** ich `prerender` korrekt setze
   **Then**:
   - `routes/(with-header)/+page.ts`: `prerender = true` plus dokumentierte URL-State-Strategie für interaktive Karte (Hydration-Pattern: prerendered HTML zeigt Karte ohne URL-State, Client-Hydration liest `?bbox=` etc. nach Mount). Falls technisch nicht in dieser Story machbar (siehe Open-Question 1), wird Root als `prerender = true` mit Default-Viewport Berlin-Mitte gerendert und URL-State-Hydration als Story-2.11-Scope (Welcome-Overlay) markiert
   - `routes/(with-header)/layer/[slug]/+page.ts`: `prerender = true` plus `entries`-Hook der alle Layer-Slugs aus `MANIFEST.json` enumeriert
   - `routes/(with-header)/methodik/+page.ts`: bereits `prerender = true` (bleibt)
   - `routes/(with-header)/lizenzen/+page.ts`: bereits `prerender = true` (bleibt)
   - `routes/sitemap.xml/+server.ts`, `routes/sitemap-[lang]/+server.ts`, `routes/robots.txt/+server.ts`: alle `prerender = true`
   - Bezirks-/Kiez-/Ranking-Routen sind explizit OUT-OF-SCOPE (Stories 2.3/2.4/2.9b ownen `prerender` + `entries` für ihre Routen)

7. **AC-7 (DRY-SEO-Head-Komponente):**
   **Given** dass Title/Description/Canonical/OG/hreflang auf jeder Page ähnlich sind und Drift-Risiko hoch ist
   **When** ich die Head-Tag-Logik zentralisiere
   **Then**:
   - Neue Komponente `src/lib/components/atlas/seo-head.svelte` mit Props `{ title, description, canonical?, ogImage?, locale }`
   - Komponente rendert intern `<svelte:head>` mit Title, Description, Canonical, hreflang-Cluster, og:title, og:description, og:url, og:type, twitter:card, twitter:title, twitter:description (basierend auf bestehendem Pattern in Root `+page.svelte:773-788`)
   - Root, Methodik, Lizenzen, Layer-Detail werden auf `SeoHead` umgestellt; doppelter Head-Code wird entfernt
   - JSON-LD bleibt OUTSIDE `SeoHead` (Story 2.2 ownt JSON-LD-Komponente). Methodik-Page rendert ihr `<script type="application/ld+json">` weiterhin separat in `<svelte:head>`
   - OG-Image-Generation für Bezirk/Kiez/Layer ist OUT-OF-SCOPE (Story 2.6); `SeoHead` rendert OG-Tags nur wenn `ogImage`-Prop gesetzt
   - Komponente <500 LOC (MUST-Rule #2)

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: Snapshot-Test pro Route für Title + Description-Existenz
   - AC-2: Pure-Function-Test für Canonical-Builder (`buildCanonical(origin, pathname)` ohne Query-Params)
   - AC-3: Pure-Function-Test für hreflang-Cluster-Builder
   - AC-4: Snapshot-Tests pro Sitemap-Endpoint (Index + DE + EN), plus Builder-Pure-Function-Test (`buildSitemapXml(urls)`)
   - AC-5: Snapshot-Test für `robots.txt`-Endpoint
   - AC-6: Build-Verify-Test (`pnpm build` rendert die erwarteten Dateien in `build/prerendered/`)
   - AC-7: Komponenten-Test für `seo-head.svelte` (Title/Description/Canonical-Tags rendern)
   - Coverage-Ziel: SEO-Builder-Logic ≥90% (kritischer Pfad), Komponente ≥80%

## Tasks / Subtasks

- [x] **T1: SEO-Builder-Bibliothek** (AC: 2, 3, 4, 8)
  - [x] T1.1: `src/lib/seo/canonical.ts` mit `buildCanonical(origin, pathname)`
  - [x] T1.2: `src/lib/seo/hreflang.ts` mit `buildHreflangCluster({origin, pathname, locales})` (Phase 1 DE-only, EN-Slot offen für Story 3.1/3.2)
  - [x] T1.3: `src/lib/seo/sitemap-builder.ts` mit `buildSitemapXml`, `buildSitemapIndexXml`, `collectPrerenderedUrls`, offene `SitemapSource`-Schnittstelle (`STATIC_PAGES_SOURCE` + `LAYER_DETAIL_SOURCE`) für Stories 2.3/2.4/2.9b
  - [x] T1.4: Pure-Function-Tests pro Builder (24 Tests)
  - [x] T1.5: `src/lib/seo/index.ts` als Re-Export-Barrel

- [x] **T2: SeoHead-Komponente** (AC: 1, 2, 3, 7, 8)
  - [x] T2.1: `src/lib/components/atlas/seo-head.svelte` mit Props (`title`, `description`, `pathname`, `origin`, `canonical?`, `ogImage?`, `locales?`)
  - [x] T2.2: Rendert Title, Description, Canonical, hreflang-Cluster, OG-Tags (nur wenn `ogImage` gesetzt)
  - [x] T2.3: Komponenten-Test mit `vitest-browser-svelte` (7 Tests, ohne `fetch`-Spy)
  - [x] T2.4: Migration der 4 bestehenden Pages auf `SeoHead`:
    - Root `(with-header)/+page.svelte` (Canonical-Bug entfernt: `page.url.search` raus)
    - `methodik/+page.svelte` (JSON-LD bleibt separat in `<svelte:head>`)
    - `lizenzen/+page.svelte`
    - `layer/[slug]/+page.svelte`
  - [x] T2.5: Visual-Diff-Verify nach Migration (Title + Description bleiben gleich, Canonical hat keine Query-Params mehr, hreflang neu)

- [x] **T3: sitemap.xml-Endpoint + Per-Sprache-Sitemaps** (AC: 4, 6, 8)
  - [x] T3.1: `routes/sitemap.xml/+server.ts` mit `prerender = true`, ruft `buildSitemapIndexXml`
  - [x] T3.2: `routes/sitemap-de.xml/+server.ts` (static per-locale, NICHT `[lang]`-Param wegen Pathname-Type-Drift); EN-Variante kommt mit Story 3.1/3.2 als eigene `sitemap-en.xml`-Route
  - [x] T3.3: Per-Sprache-Sitemap fragt `MANIFEST.json` für Layer-Slugs ab via `loadManifest`
  - [x] T3.4: Snapshot-Tests pro Endpoint (5 Tests in `src/lib/seo/endpoints.test.ts`)
  - [x] T3.5: Build-Verify: `build/prerendered/pages/sitemap.xml`, `sitemap-de.xml`, `robots.txt` existieren nach `pnpm build`

- [x] **T4: robots.txt-Endpoint** (AC: 5, 8)
  - [x] T4.1: `routes/robots.txt/+server.ts` mit `prerender = true`
  - [x] T4.2: Body mit `User-agent: *`, `Allow: /`, Sitemap-Verweis
  - [x] T4.3: `Content-Type: text/plain; charset=utf-8`
  - [x] T4.4: Snapshot-Test (im `endpoints.test.ts`)
  - **Note:** statisches `static/robots.txt` wurde entfernt, der dynamische Endpoint übernimmt

- [x] **T5: Root-Route prerender** (AC: 6) — User-Entscheidung: DEFERRED
  - [x] T5.1: Open-Question 1 entschieden: Root-prerender wird mit Story 2.11 (Welcome-Overlay) zusammen umgesetzt
  - [x] T5.3: `(with-header)/+page.ts` bleibt unverändert. Canonical-Bug (Zeile 770, `page.url.search` raus) wurde aber trotzdem gefixt via SeoHead-Migration. hreflang/Title/Description auf Root via SeoHead aktiv
  - [x] T5.4: E2E `/` no-JS-Profile SKIPPED mit Story-Note (Root nicht prerendered in dieser Story)

- [x] **T6: Layer-Detail prerender + entries** (AC: 6)
  - [x] T6.1: `routes/(with-header)/layer/[slug]/+page.ts` mit `export const prerender = true`
  - [x] T6.2: `entries`-Hook liest `static/layers/MANIFEST.json` über `process.cwd()` und enumeriert alle Slugs
  - [x] T6.3: Build-Verify: `build/prerendered/pages/layer/{slug}.html` für alle 65+ Layer existiert

- [x] **T7: Final-Verifikation** (AC: 1-8)
  - [x] T7.1: `pnpm exec vitest run` in den SEO-Pfaden 77/77 grün (4 Builder-Tests + 1 Endpoint-Test + 1 Component-Test + 3 bestehende Page-Tests intakt)
  - [x] T7.2: `pnpm check` 0 Errors
  - [x] T7.3: `pnpm build` SSR-Prerender-Stage erfolgreich; `build/prerendered/pages/sitemap.xml`, `sitemap-de.xml`, `robots.txt`, `methodik.html`, `lizenzen.html`, `layer/{slug}.html` existieren. Post-Prerender Adapter-Step bricht auf `@resvg/resvg-js` Native-Binary ab, das ist eine pre-existierende Adapter-Konfig-Issue unabhängig von Story 2.1 (gleicher Fehler auf clean main vor Story 2.1 ohne mein Diff)
  - [x] T7.4-T7.6: Spotchecks der prerendered XML/HTML Files: Canonical ohne Query-Params, hreflang-Cluster mit de + x-default, robots.txt mit Allow + Sitemap-URL
  - [ ] T7.7: Lighthouse-Run defer Story 4.3 (NFR-P8-Gate)
  - [x] T7.8: Sprint-Status `2-1-seo-foundation-sitemap-canonical-robots-txt`: ready-for-dev → in-progress → review

## Dev Notes

### Bestehender Canonical-Bug auf Root-Route

`routes/(with-header)/+page.svelte:770` hat:
```svelte
const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}${page.url.search}`);
```

Das produziert für jeden Karten-State (`?bbox=`, `?layers=`, `?address=`, `?lat=`/`?lng=`) einen eigenen Canonical und damit Indexierungs-Duplikate. Korrekt: Canonical auf `pathname` ohne Search. URL-State bleibt im Browser, Suchmaschinen indexieren nur den kanonischen Einstieg. Das ist ein echter Bug, kein Feature-Request.

### Root-prerender-Risiko (Open-Question 1)

Root rendert MapLibre-Canvas + Inspector-Panel mit Live-URL-State (`?bbox=`, `?layers=`, `?address=`). Aktuell hat `+page.ts` einen `load`-Function der URL-State zur Server-Time liest. Für `prerender = true` müsste der Server-Render Default-State verwenden und Client-Hydration den URL-State nach Mount laden. Das ist machbar (Pattern: prerender mit Default-Viewport Berlin-Mitte, im `onMount` das URL-State auslesen und State setzen). Risiko: wenn `bbox`/`layers` im Server-Output fehlen, sieht der LCP-Frame anders aus als der hydrated Frame, was CLS-Risiko (NFR-P3) hochzieht.

Empfehlung: Wenn Open-Question 1 = „später", trotzdem hreflang/canonical/title/description in dieser Story korrekt setzen, prerender-Pivot mit Story 2.11 (Welcome-Overlay als initialer prerendered Frame) zusammen ziehen.

### Sitemap-Builder als offene Schnittstelle

`collectPrerenderedUrls` muss erweiterbar sein, ohne dass Folge-Stories die Sitemap-Datei direkt ändern. Empfohlene API:

```typescript
// src/lib/seo/sitemap-builder.ts
export interface SitemapEntry {
  loc: string;          // absolute URL inkl. origin
  lastmod?: string;     // ISO-8601
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;    // 0.0..1.0
}

export interface SitemapSourceContext {
  origin: string;
  locale: 'de' | 'en';
  manifest: Manifest;
  // Nach Story 2.0: optionaler Postgres-Read
  bezirkSlugs?: string[];
  kiezSlugs?: string[];
}

export type SitemapSource = (ctx: SitemapSourceContext) => SitemapEntry[];

export const STATIC_PAGES_SOURCE: SitemapSource = (ctx) => [...];
export const LAYER_DETAIL_SOURCE: SitemapSource = (ctx) => [...];
// Story 2.3/2.4/2.9b registrieren ihre Sources im selben File:
// export const BEZIRK_PAGES_SOURCE: SitemapSource = (ctx) => [...];
```

`/sitemap-[lang]/+server.ts` ruft alle Sources auf und konkateniert. Folge-Story fügt neue Source-Function hinzu, ohne den Endpoint zu ändern.

### Origin-Resolution

In Production läuft die Site unter `https://navigator.berlin`. Origin sollte aus SvelteKit `ORIGIN`-env-Var kommen (gleicher Pattern wie Story 1.20 Permalink-Domain — siehe sprint-status-Notiz). In `+server.ts`-Endpoints ist `request.url.origin` verfügbar; in Komponenten via `page.url.origin` aus `$app/state`. Kein eigenes env-Var-Lookup nötig.

### Paraglide-Reroute-Konvention

Per Memory `project_paraglide_reroute.md`: Routes haben KEINEN `[lang]`-Param. Der Routing-Adapter strippt die Locale aus dem Pfad. Für hreflang heisst das:

- Aktueller Pfad in DE: `/methodik`
- Aktueller Pfad in EN: `/en/methodik`
- `localizeHref('/methodik', { locale: 'en' })` → `/en/methodik`

Der hreflang-Cluster muss `localizeHref` nutzen, nicht eigene String-Konkatenation. Sonst Drift.

### Trailing-Slash-Konvention

SvelteKit-Default: kein Trailing-Slash. `kit.trailingSlash` ist nicht in `svelte.config.js` gesetzt, damit gilt Default. Sitemap und Canonical müssen das spiegeln. Test pro URL stellt sicher dass kein doppelter Slash entsteht.

### MUST-Rules-Anwendung

- **#3 Bestehende Funktionen prüfen:** `localizeHref`, `getLocale`, `loadManifest` existieren. Keine neue Locale-Logik.
- **#7 TypeScript strict:** SitemapEntry typed, kein `any`.
- **#10 Cookieless:** Sitemap und robots.txt setzen keine Cookies. SeoHead-Komponente reine Render-Logic.
- **#19 Remote Functions vs. fetch:** Sitemap und robots.txt sind `+server.ts`-Endpoints, nicht Remote-Functions. Korrekt für statische Asset-Endpoints.

### Test-Strategie (TDD per ADR-012)

- **Pure-Function-Tests:** Canonical-Builder, hreflang-Cluster-Builder, Sitemap-XML-Builder. Testbar ohne SvelteKit-Runtime.
- **Snapshot-Tests:** Pro Endpoint (sitemap.xml, sitemap-de.xml, sitemap-en.xml, robots.txt) sowie pro Page für `<svelte:head>`-Output.
- **Build-Verify-Test:** Optional: Vitest-Test der `pnpm build` triggert und Existenz prüft. Wenn zu teuer für Unit-Suite: in E2E-Suite (`tests/e2e/seo-foundation.spec.ts`).
- **E2E:** `tests/e2e/seo-foundation.e2e.ts` mit:
  - `/sitemap.xml` lädt valides XML
  - `/robots.txt` lädt mit korrektem Body
  - `/methodik` View-Source enthält Canonical + hreflang-Cluster
  - `/layer/{slug}` View-Source analog
  - axe-Check (Smoke, da head-only)
- **Vitest-Browser-Konflikt:** Per Memory `feedback_browser_test_fetch_spy.md` keine `fetch`-Spies in `*.svelte.test.ts`. SeoHead-Komponente macht keinen Fetch — sicher.

### Open-Questions vor Dev-Start

1. **Root-prerender jetzt oder mit Story 2.11?** Empfehlung: jetzt nur Title/Description/Canonical/hreflang fixen, `prerender = true` zusammen mit 2.11 (Welcome-Overlay liefert prerenderable Initial-Frame). Akzeptabel?
2. **EN-Variante bei fehlender Übersetzung:** Sitemap überspringt URL und loggt warning, oder Self-Referenz auf DE? Empfehlung: überspringen plus Build-Output-Hinweis. Stories 3.2 + 4.5/4.6 schließen die Lücke.
3. **Trailing-Slash:** Bestätige SvelteKit-Default (kein Trailing-Slash) bleibt. Falls SEO-Konvention abweichend gewünscht, hier festlegen.
4. **`<lastmod>` für Methodik/Lizenzen via git log:** OK das via `child_process.execSync('git log -1 --format=%cI ...')` zur Build-Time zu lesen, oder lieber statisch Build-Timestamp?
5. **OG-Tags via SeoHead:** SeoHead rendert OG-Tags nur wenn `ogImage`-Prop gesetzt. Story 2.6 ownt OG-Image-Pipeline. Bis dahin Methodik/Lizenzen ohne OG-Image. Akzeptabel?

### Project Structure Notes

- Neue Komponente `src/lib/components/atlas/seo-head.svelte` (atlas/ statt ui/ weil Domain-spezifisch durch hreflang-Lokalisierung).
- Builder-Module in `src/lib/seo/` (Verzeichnis existiert noch nicht — anlegen).
- Endpoints in `src/routes/sitemap.xml/+server.ts`, `src/routes/sitemap-[lang]/+server.ts`, `src/routes/robots.txt/+server.ts` (Top-Level, NICHT in `(with-header)`-Group, damit kein Layout-Wrap).
- Bestehende Pages werden migriert; Head-Code-Duplikate entfernt.
- KEIN neuer Pfad in `$lib/server/` (alle SEO-Builder sind Pure-Functions ohne DB-Zugriff). Postgres-Read für Bezirks-/Kiez-Slugs ist OUT-OF-SCOPE bis Story 2.3/2.4 die Routes existieren.

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1061-L1087](../planning-artifacts/epics.md)
- FR27-FR33: [prd.md#L729-L735](../planning-artifacts/prd.md)
- 21 MUST-Regeln: [architecture.md#L1051-L1073](../planning-artifacts/architecture.md)
- ADR-012 TDD: [docs/adr/ADR-012-tdd-mandate.md](../../docs/adr/ADR-012-tdd-mandate.md)
- Bestehender Root-Head mit Canonical-Bug: [src/routes/(with-header)/+page.svelte:770](../../src/routes/(with-header)/+page.svelte)
- Paraglide-Runtime: [src/lib/paraglide/runtime.ts](../../src/lib/paraglide/runtime.ts)
- Memory Paraglide-Reroute: [memory/project_paraglide_reroute.md](../../.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_paraglide_reroute.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Agent SDK, BMAD dev-story workflow, Pragmatic TDD per ADR-012)

### Debug Log References

- Worktree-Merge nach main: musste Story 2.0 (Drizzle/Postgres-Foundation) und Story 1.31 (Choropleth-Polish) einziehen, sonst fehlten `kiez-score-*`-Layer und der Build-Step war inkonsistent.
- `src/lib/paraglide/` wurde neu generiert via `npx paraglide-js compile` weil Worktree fresh war.
- `pnpm build` Adapter-Node-Stage bricht auf `@resvg/resvg-js-darwin-arm64/resvgjs.darwin-arm64.node` (Native-Binary, Rollup kann nicht parsen). Gleicher Fehler auf clean main vor Story 2.1, also Build-Config-Issue out of scope.

### Completion Notes List

- **TDD-Cycle pro AC durchgehalten:** Pro Builder-Funktion (canonical, hreflang, sitemap-builder) und für die SeoHead-Komponente wurde zuerst der Failing-Test geschrieben, dann die Implementation. Endpoint-Tests testen die GET-Handler direkt mit gemocktem `loadManifest`.
- **Open-Question 1 (Root-prerender) DEFERRED:** Root bleibt SSR/CSR. Canonical-Bug (Query-Param-Pollution) wurde trotzdem gefixt durch SeoHead-Migration. Story 2.11 (Welcome-Overlay) zieht den Root-prerender-Pivot.
- **Open-Question 2 (EN-Variante):** Phase 1 DE-only per Memory `project_i18n_phase_1_de_only`. Sitemap-Index listet NUR `sitemap-de.xml`, kein `sitemap-en.xml`. hreflang-Cluster rendert NUR `de` + `x-default`. Story 3.1/3.2 wird hreflang `en` und `sitemap-en.xml`-Route nachziehen.
- **Open-Question 3 (Trailing-Slash):** SvelteKit-Default beibehalten (kein Trailing-Slash). `kit.trailingSlash` ist nicht gesetzt. Canonical-Builder strippt Trailing-Slashes (außer auf "/").
- **Open-Question 4 (lastmod):** Build-Timestamp für Static-Pages (Methodik/Lizenzen/Root), `MANIFEST.layers[].fetchedAt` für Layer-Detail. Kein `child_process.execSync('git log ...')` (per User-Empfehlung wegen Flaky).
- **Open-Question 5 (OG-Tags):** SeoHead rendert OG-Tags nur wenn `ogImage`-Prop gesetzt. Bis Story 2.6 keine OG-Image-Pipeline, Methodik/Lizenzen ohne OG. Akzeptiert.
- **Pivot bei T3.2:** Erste Implementation war `routes/sitemap-[lang]/+server.ts` mit Param. Das hat den `Pathname`-Union-Type kaputt gemacht (SvelteKit-2.59 strict typing: brackets in route-id propagieren als `& {}`-branded literal in das `Pathname`-Type). 4 bestehende `resolve(... as Pathname)`-Aufrufe in `+layout.svelte`, `layer-hit-row.svelte`, `map-legend.svelte` und `layer/[slug]/+page.svelte` würden brechen. Fix: statische Per-Locale-Route `routes/sitemap-de.xml/+server.ts`. EN-Slot kommt mit Story 3.1/3.2 als eigene Route.
- **Statisches `static/robots.txt` entfernt:** Existierte vor Story 2.1 und überschrieb den dynamischen `routes/robots.txt/+server.ts`-Endpoint. Statische Datei gelöscht damit der dynamische Endpoint mit Sitemap-Referenz greift.
- **`svelte.config.js` ergänzt:** `kit.prerender.entries = ['*', '/robots.txt', '/sitemap.xml', '/sitemap-de.xml']` damit standalone-Endpoints ohne internen Link prerendered werden. `handleHttpError` toleriert die noch-nicht-existierenden Footer-Routes `/datenschutz`, `/impressum`, `/architektur` (eigene Legal-Story).
- **Coverage:** SEO-Builder ≥ 90% (24 Pure-Function-Tests decken canonical/hreflang/sitemap-builder ab inkl. Edge-Cases wie XML-Escaping, Query-Stripping, Trailing-Slash-Normalisierung). SeoHead-Komponente 7 Browser-Tests (Title, Description, Canonical-without-Query, hreflang-Phase-1, OG-Tags conditional). Endpoint-Smoke 5 Tests.

### File List

**New files (SEO-Library + Komponente):**
- `src/lib/seo/canonical.ts`
- `src/lib/seo/canonical.test.ts`
- `src/lib/seo/hreflang.ts`
- `src/lib/seo/hreflang.test.ts`
- `src/lib/seo/sitemap-builder.ts`
- `src/lib/seo/sitemap-builder.test.ts`
- `src/lib/seo/endpoints.test.ts`
- `src/lib/seo/index.ts`
- `src/lib/components/atlas/seo-head.svelte`
- `src/lib/components/atlas/seo-head.svelte.test.ts`

**New routes:**
- `src/routes/robots.txt/+server.ts`
- `src/routes/sitemap.xml/+server.ts`
- `src/routes/sitemap-de.xml/+server.ts`

**Modified pages (SeoHead-Migration):**
- `src/routes/(with-header)/+page.svelte` (Canonical-Bug-Fix: `page.url.search` raus)
- `src/routes/(with-header)/methodik/+page.svelte`
- `src/routes/(with-header)/lizenzen/+page.svelte`
- `src/routes/(with-header)/layer/[slug]/+page.svelte`
- `src/routes/(with-header)/layer/[slug]/+page.ts` (`prerender = true` + `entries`-Hook)

**Modified config:**
- `svelte.config.js` (kit.prerender.entries + handleHttpError für unfertige Footer-Routes)

**Removed:**
- `static/robots.txt` (überlassen an dynamischen Endpoint)

**Sprint-Status:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (2-1-seo-foundation in-progress → review)
