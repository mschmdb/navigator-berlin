# Story 2.3: Bezirks-Pages prerendered

Status: ready-for-dev

## Story

As a Frieda (Datenjournalistin),
I want für jeden der 12 Berliner Bezirke eine prerenderte Page mit Lead, Steckbrief, Karten-Embed mit Boundary-Highlight, FAQ-Sektion-Platzhalter,
so that ich via Google nach Bezirks-Themen suchen kann und sofort eine ruhige, daten-dichte Übersicht bekomme die ohne JavaScript lesbar ist.

## Probleme heute

1. Es existiert keine Bezirks-Page-Route. Long-Tail-Suchanfragen wie „Friedrichshain-Kreuzberg Lärm" oder „Mitte Grünversorgung" finden nur die Atlas-Karten-Root, nicht eine dedizierte Bezirks-Page mit Lead und Steckbrief.
2. `BezirkProfile` und `getBezirkProfile` existieren bereits (Story 1.x), werden aber nirgendwo prerendered konsumiert. Das ungenutzte Asset blockiert FR27.
3. UX-DR43 Long-Form-Reading-Layout existiert spezifiziert (`ux-design-specification.md` Zeile 1185-1215), aber keine Page setzt ihn um. Methodik- und Lizenzen-Pages haben jeweils eigene Layouts; ein wiederverwendbares Bezirks-/Kiez-Hero-Pattern fehlt.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1113-1139.
- PRD: FR27 (`prd.md` Zeile 729), FR33 (Zeile 735, lesbar ohne JS), NFR-P1/P7/P8.
- UX-Layout: `ux-design-specification.md` Zeile 1185-1215 (Bezirk/Kiez Long-Form-Wireframe), UX-DR43 (Reading-Layout).
- Bestehender Loader: `src/lib/data/get-bezirk-profile.ts` mit `getBezirkProfile(locale, slug, fetchFn)` → `BezirkProfile`. `layerCoverage` wird über `getLayersAtPoint(centroid)` berechnet.
- Bestehender Typ: `src/lib/data/types.ts:114-124` (`BezirkProfile`).
- Bezirks-Layer im Manifest: `bezirke`-Slug mit 12 Polygon-Features, `NAME`-Property als Bezirks-Name (siehe `get-bezirk-profile.ts:24`).
- Stories 2.0, 2.1, 2.2 (alle ready-for-dev): Postgres-Aggregat (`bezirk_stats`-Query), SeoHead-Komponente, JsonLd-Generators sind Voraussetzungen. Story 2.3 blockt formell auf 2.0; siehe Open-Question 1.
- Paraglide-Reroute-Konvention (Memory `project_paraglide_reroute.md`): Routes ohne `[lang]`-Param, `getLocale()` statt `params.lang`.
- Story 2.6 (OG-Image-Pipeline) ist Folge-Story; OG-Image-URL pro Bezirk wird hier vorbereitet (Meta-Tag), Generation kommt mit 2.6.
- Story 2.5b (FAQ-Section) befüllt `faq_qna`; Story 2.3 rendert nur das Section-Placeholder, der Inhalt kommt automatisch wenn 2.5b durch ist.
- Memory `feedback_no_em_dashes.md`: keine em-dashes; `feedback_no_lebenswert.md`: niemals „Lebenswert/Lebensqualität" als Begriff.

## Akzeptanz-Kriterien

1. **AC-1 (Route + prerender + entries für 12 Bezirke × 2 Sprachen):**
   **Given** die Daten-Abstraktion und Paraglide-Reroute
   **When** ich `routes/(with-header)/bezirk/[slug]/+page.svelte` plus `+page.server.ts` (oder `+page.ts` falls keine Server-only-Logik) mit `prerender = true` implementiere
   **Then**:
   - Route ist `/bezirk/{slug}` für DE und `/en/bezirk/{slug}` für EN
   - `entries`-Hook liefert 12 Bezirks-Slugs (aus dem `bezirke`-Layer in `MANIFEST.json`)
   - Paraglide-Reroute erzeugt automatisch beide Locale-Varianten je Slug → 24 prerendered Routen Build-Time
   - Slug-Konvention: kebab-case via `normalizeSlug` aus `src/lib/data/internal/slug.ts` (z.B. `friedrichshain-kreuzberg`, `tempelhof-schoeneberg`)
   - Build-Verify: `build/prerendered/bezirk/{slug}/index.html` und `build/prerendered/en/bezirk/{slug}/index.html` für alle 12 × 2 = 24 Pfade
   - Test: `entries()`-Hook liefert exakt 12 Einträge ohne Duplikate; Snapshot

2. **AC-2 (Daten-Layer via Hybrid Static-GeoJSON + Postgres-Aggregat):**
   **Given** Story 2.0-Aggregat-Tabelle `bezirk_stats` (sobald die Story durch ist)
   **When** ich den Page-Loader baue
   **Then**:
   - `+page.server.ts` ruft `getBezirkProfile(locale, slug)` für Geo + Layer-Coverage (Source-of-Truth bleibt Static-GeoJSON)
   - `+page.server.ts` ruft zusätzlich `getBezirkStats(slug)` aus `src/lib/server/db/queries/get-bezirk-stats.ts` (Story 2.0) für Cross-Layer-Aggregat-Werte
   - Falls Story 2.0 noch nicht abgeschlossen: Loader nutzt nur `getBezirkProfile`, Aggregat-Section rendert Placeholder „Aggregat-Werte werden mit Story 2.0 freigeschaltet" (siehe Open-Question 1 für Reihenfolge-Entscheidung)
   - Loader gibt typed `BezirkPageData = { profile: BezirkProfile, stats: BezirkStats | null, score: BezirkScore | null }` zurück (`score` ist `null` bis Story 2.9a befüllt)
   - Test: Loader-Snapshot für Friedrichshain-Kreuzberg mit Mock-DB-Response

3. **AC-3 (Bezirks-Hero-Komponente):**
   **Given** UX-DR43 Long-Form-Reading-Layout
   **When** ich `src/lib/components/atlas/bezirk-hero.svelte` implementiere
   **Then**:
   - Komponente nimmt `{ profile: BezirkProfile, stats: BezirkStats | null }` als Props
   - Rendert in Reihenfolge:
     - `<h1>` in Plex-Serif mit Bezirks-Name (`profile.name`)
     - Lead-Absatz in Plex-Serif `--text-lg`, max 72ch, mit i18n-Lead-Text plus dynamischen Werten (z.B. Einwohner, Fläche). Lead-Template DE: „Bezirk {name}, {einwohner_formatted} Einwohner:innen, {flaecheHa_formatted} ha. Daten zu Wohnen, Umwelt, Klima und Mobilität auf dieser Seite."
     - `PlexMap`-Embed-Variant 50vh mit Boundary-Highlight des Bezirks-Polygons (siehe AC-4)
     - Steckbrief-Tabelle „Layer · Wert · Stand" ohne Vertikal-Linien (UX-DR43), Werte aus `stats.laerm.meanLDen`, `stats.luft.meanNo2`, `stats.gruen.meanVersorgung`, `stats.oepnv.stopsPerKm2`, etc. Pro Wert Source-Subline mit `sourceUpdatedAt` aus `AggregateValue<T>`-Provenance (FR40)
     - Section-Placeholder „Häufige Fragen" mit Hinweis „FAQ wird automatisch ergänzt" (Story 2.5b befüllt). KEINE leere FAQ-Komponente jetzt.
   - Komponente <500 LOC (MUST-Rule #2)
   - Falls `stats === null`: Steckbrief-Section rendert „Aggregat-Werte werden mit Story 2.0 freigeschaltet"-Placeholder

4. **AC-4 (Karten-Embed mit Boundary-Highlight):**
   **Given** MapLibre-Canvas existiert (Story 1.6) als interaktive Variante
   **When** ich Karten-Embed mit Boundary-Highlight für Bezirks-Page implementiere
   **Then**:
   - Neue Variante `variant="embed"` auf `PlexMap`/`map-libre-canvas.svelte` ODER neue Wrapper-Komponente `src/lib/components/atlas/map-embed.svelte` falls Bestand zu komplex zum Erweitern (Entscheidung in Dev-Notes)
   - Embed-Variante: 50vh Höhe, kein Inspector-Panel, kein Layer-Toggle-Trigger, kein URL-State-Write (Read-Only-View)
   - Boundary-Highlight: Bezirks-Polygon aus `profile.geometry` als gefüllte Layer mit reduzierter Opacity + Outline, andere Bezirks-Boundaries dezent grau gerahmt
   - Map fitBounds auf `profile.geometry`-bbox mit Padding 40
   - Karten-Click auf das Highlight-Polygon öffnet kein Inspector (Embed-Pattern, nicht interaktiv). Click ausserhalb dito.
   - Progressive-Enhancement: `<noscript>`-Fallback zeigt SVG-Snapshot oder statisches `<img>` aus `static/og/bezirk/{slug}.png` (Story 2.6 generiert; bis dahin generischer Berlin-Outline-SVG-Fallback)
   - Test: Komponenten-Smoke (kann Karte gerendert werden), Snapshot der Render-Konfiguration

5. **AC-5 (SEO-Head + JSON-LD via Story 2.1 + 2.2 Pattern):**
   **Given** `SeoHead`-Komponente (Story 2.1) und `JsonLd`-Komponente plus Generators (Story 2.2)
   **When** ich Bezirks-Page mit SEO + Structured-Data ausstatte
   **Then**:
   - `<SeoHead title={pageTitle} description={pageDescription} canonical locale />`-Eintrag
     - `pageTitle` DE: `Bezirk {name} · navigator.berlin`
     - `pageDescription` DE: aus Lead-Template (140-160 chars, Werte eingesetzt)
   - `<JsonLd data={placeJsonLd} testid="bezirk-place-jsonld" />` mit `buildPlace({ origin, name: profile.name, centroid: profile.centroid, containedInPlaceName: 'Berlin' })`
   - `<JsonLd data={areaJsonLd} testid="bezirk-administrative-area-jsonld" />` mit `buildAdministrativeArea({ origin, name: profile.name, ... })`
   - `<JsonLd data={breadcrumbJsonLd} testid="bezirk-breadcrumb-jsonld" />` mit `buildBreadcrumbList([{name:'Berlin', url: '/'}, {name: profile.name, url: '/bezirk/'+slug}])`
   - OG-Image-Meta: `<meta property="og:image" content={'${origin}/og/bezirk/${slug}.png'} />` (Story 2.6 generiert das Asset; bis dahin 404 oder Fallback-Image)
   - Falls Story 2.1 `SeoHead` noch nicht durch: temporär inline `<svelte:head>`-Tags analog zur 2.1-Spec, dokumentieren im Dev-Notes
   - Test: Snapshot pro Locale für Title, Description, Canonical, hreflang-Cluster, JSON-LD-Blöcke

6. **AC-6 (Sitemap-Registrierung via Story 2.1 SitemapSource):**
   **Given** Story 2.1 `SitemapSource`-Pattern (offene Schnittstelle)
   **When** ich Bezirks-Routen in Sitemap-Index aufnehme
   **Then**:
   - Neue Source-Function `BEZIRK_PAGES_SOURCE` in `src/lib/seo/sources/bezirk-pages.ts` (oder in `sitemap-builder.ts` falls die 2.1-Struktur das vorsieht)
   - Source liest 12 Bezirks-Slugs aus dem `bezirke`-Layer im Manifest, baut SitemapEntries pro Locale
   - `lastmod` pro Bezirks-URL aus `bezirke`-Layer `sourceUpdatedAt` ODER `fetchedAt`
   - `changefreq: 'monthly'`, `priority: 0.7`
   - Registrierung im `+server.ts` der Per-Sprache-Sitemap aus 2.1 (Story 2.1-Pattern verlangt nur Sources-Array-Erweiterung)
   - Falls Story 2.1 noch nicht durch: Source-Function existiert + getestet, Sitemap-Integration kommt mit 2.1-Merge

7. **AC-7 (Konsistente Top-Navigation):**
   **Given** das bestehende `SiteHeader`-Skeleton in `(with-header)`-Layout-Group
   **When** Bezirks-Page in der Group platziert wird
   **Then**:
   - Route lebt unter `(with-header)/bezirk/[slug]/+page.svelte` (NICHT als Top-Level)
   - SiteHeader rendert mit Skip-Link, Adress-Suche (kompakt), Sprach-Switcher (de/en aus Story 3.x; aktuell de Default)
   - Keine eigene Header-Komponente in Bezirks-Page
   - Test: Smoke dass Header beim Mount erscheint

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: `entries()`-Hook-Test (12 Slugs); Build-Verify-Test
   - AC-2: Loader-Snapshot für Friedrichshain-Kreuzberg mit Mock-DB
   - AC-3: Komponenten-Test `bezirk-hero.svelte` (Render-Snapshot mit Fixture-Profile + Fixture-Stats)
   - AC-4: Karten-Embed-Smoke (kann mounten, fitBounds wird mit Geometry-Bbox aufgerufen)
   - AC-5: Pro Page Snapshot der SEO-Head-Tags + JSON-LD-Blöcke
   - AC-6: `BEZIRK_PAGES_SOURCE` Pure-Function-Test (12 Entries × 2 Locales)
   - AC-7: Smoke
   - E2E `tests/e2e/bezirk-page.e2e.ts`: 1 Bezirk lädt ohne JS (Playwright `--no-javascript`-Profile), zeigt h1, Lead, Karten-Embed-Fallback, Steckbrief-Tabelle, FAQ-Placeholder. axe-Check Smoke.
   - Coverage-Ziel: Hero-Komponente ≥80%, Loader ≥90%, Sitemap-Source 100%

## Tasks / Subtasks

- [ ] **T1: Route + entries + Loader** (AC: 1, 2, 8)
  - [ ] T1.1: `routes/(with-header)/bezirk/[slug]/+page.server.ts` mit `prerender = true`, `entries()` aus Manifest, `load()` mit `getBezirkProfile` + optional `getBezirkStats`
  - [ ] T1.2: `BezirkPageData`-Typ in `src/lib/data/types.ts` ergänzen
  - [ ] T1.3: Tests: entries-Hook + Loader-Snapshot

- [ ] **T2: Karten-Embed-Variante** (AC: 4)
  - [ ] T2.1: Spike: kann `map-libre-canvas.svelte` mit `variant`-Prop erweitert werden ohne >500-LOC-Bruch? Falls nein: separate `map-embed.svelte`
  - [ ] T2.2: Read-Only-Render-Pattern (kein Inspector, kein URL-State, kein Layer-Toggle)
  - [ ] T2.3: Boundary-Highlight-Layer mit Polygon-Fill + Outline
  - [ ] T2.4: fitBounds auf `profile.geometry`-Bbox mit `@turf/bbox`
  - [ ] T2.5: `<noscript>`-Fallback mit statischem SVG oder OG-Image-Placeholder
  - [ ] T2.6: Tests

- [ ] **T3: Bezirks-Hero-Komponente** (AC: 3, 8)
  - [ ] T3.1: `src/lib/components/atlas/bezirk-hero.svelte` mit h1 + Lead + Karten-Embed + Steckbrief-Tabelle + FAQ-Placeholder
  - [ ] T3.2: Lead-Template via Paraglide-Messages (DE Default, EN-Coverage Story 3.2)
  - [ ] T3.3: Steckbrief-Tabelle: Layer-Name, Wert (mit Einheit via `formatLayerValue`-Utils aus 1.x), Stand (`sourceUpdatedAt`-Format) ohne Vertikal-Linien (UX-DR43)
  - [ ] T3.4: `stats === null`-Placeholder
  - [ ] T3.5: Komponenten-Tests mit Fixtures

- [ ] **T4: SEO-Head + JSON-LD** (AC: 5)
  - [ ] T4.1: SeoHead-Einbindung (Story 2.1-Komponente) oder inline-Fallback
  - [ ] T4.2: JsonLd × 3 (Place, AdministrativeArea, BreadcrumbList) via Story 2.2-Generators
  - [ ] T4.3: OG-Image-Meta-Tag mit `${origin}/og/bezirk/${slug}.png`
  - [ ] T4.4: Tests pro Locale

- [ ] **T5: Sitemap-Source-Registrierung** (AC: 6)
  - [ ] T5.1: `src/lib/seo/sources/bezirk-pages.ts` mit `BEZIRK_PAGES_SOURCE`
  - [ ] T5.2: Pure-Function-Test
  - [ ] T5.3: Falls Story 2.1 mergt: in `routes/sitemap-[lang]/+server.ts` einbinden

- [ ] **T6: E2E + Final-Verifikation** (AC: 1-8)
  - [ ] T6.1: `tests/e2e/bezirk-page.e2e.ts` mit 1-Bezirk-Smoke + axe
  - [ ] T6.2: `pnpm test:unit -- --run` 100% grün
  - [ ] T6.3: `pnpm check` 0 Errors
  - [ ] T6.4: `pnpm build` läuft erfolgreich, 24 prerendered Bezirks-HTML-Files existieren
  - [ ] T6.5: Browser-Verify (User-Verify): `/bezirk/friedrichshain-kreuzberg` + `/bezirk/mitte` + `/en/bezirk/friedrichshain-kreuzberg` rendern korrekt
  - [ ] T6.6: Sprint-Status-Eintrag

## Dev Notes

### Reihenfolge-Risiko: Story 2.0 blockt 2.3 (Open-Question 1)

Epic-Sequencing (`epics.md:1431`): „2.0 zuerst (blockt 2.3/2.4/2.5b/2.9a/2.9b)". Aktuell sind 2.0, 2.1, 2.2 alle `ready-for-dev` (noch nicht implementiert). Drei Optionen:

a) Story 2.3 wartet auf 2.0-`review`-Status, dann Dev-Start. Klare Abhängigkeit, kein Mock-Aufwand.
b) Story 2.3 startet jetzt, mockt `getBezirkStats` als `null`, ersetzt nach 2.0-Merge. Risiko: zwei Iterationen, doppelter Test-Effort.
c) Story 2.3 startet jetzt mit hartem Stats-Block: Aggregat-Section ist Placeholder „kommt mit Story 2.0", Story 2.3 wird mit Stats-Section in zweiter Iteration ergänzt.

Empfehlung: (a). 2.3 erst nach 2.0-Merge starten. Diese Story ist contextet, aber Dev-Agent muss vor Start prüfen ob 2.0 review erreicht hat. Falls User abweicht: (c) als pragmatischer Mittelweg.

### `(with-header)`-Layout-Group bleibt einheitlich

`SiteHeader` (Story 1.x) lebt im `(with-header)`-Layout-Group. Alle Bezirks-Routen müssen in dieser Group leben damit Top-Navigation konsistent ist. Falls die Group beim Stand der Story durch Folge-Refactor verschoben wurde: Pfad-Konvention dem aktuellen Stand folgen.

### Karten-Embed: erweitern oder separat?

`map-libre-canvas.svelte` ist die Volltext-Karten-Komponente mit Inspector, URL-State, Layer-Toggle. Embed-Variante braucht davon nichts. Risiko bei Erweiterung: variant-Branches blähen Komponente auf, 500-LOC-Limit (MUST-Rule #2) wird gesprengt.

Empfehlung: separate `map-embed.svelte` als ~150-LOC-Wrapper um `maplibre-gl`-API direkt. Nutzt gleiches Map-Style (`static/map-style.json`), aber kein Inspector, kein URL-State, kein Layer-Toggle. Spike in T2.1 bestätigt Entscheidung.

### Steckbrief-Werte aus `BezirkStats` (Story 2.0-Schema)

Empfohlene Auswahl für Phase 1:

| Section | Wert | Quelle in BezirkStats |
|---------|------|------------------------|
| Lärm | Mean L_DEN dB | `stats.laerm.meanLDen` |
| Luft | Mean NO2 | `stats.luft.meanNo2` |
| Klima | Mean PET °C | `stats.klima.meanPet` |
| Grün | Mean Versorgung | `stats.gruen.meanVersorgung` |
| ÖPNV | Stationen pro km² | `stats.oepnv.stopsPerKm2` |
| Bildung | Kitas + Schulen pro km² | `stats.bildung.kitasPerKm2` + `schoolsPerKm2` |
| Wohnen | Dominante Wohnlage | `stats.wohnen.dominantWohnlage` |
| Soziale Lage | MSS-Gesamtindex dominante Gruppe | `stats.wohnen.dominantMssGroup` mit Stigma-Disclaimer |

Jeder Wert rendert mit Stand-Subline aus `AggregateValue<T>.sourceUpdatedAt`. Editorial-Disclaimer für `mietspiegel-wohnlage` + `mss-gesamtindex-2025` per Memory `project_compare_editorial_profiles.md` und `feedback_no_lebenswert.md`.

### Lead-Text-Pattern (i18n-konform)

```typescript
// $lib/paraglide/messages bekommt einen neuen Key bezirkLeadParagraph
m.bezirkLeadParagraph({
  name: profile.name,
  einwohner: einwohnerFormatted,
  flaecheHa: flaecheHaFormatted
});
```

DE-Default: „Bezirk {name}, {einwohner} Einwohnerinnen und Einwohner, {flaecheHa} Hektar Fläche. Daten zu Wohnen, Umwelt, Klima und Mobilität auf dieser Seite."

EN-Coverage kommt mit Story 3.2; bis dahin DE als Fallback.

KEINE em-dashes (Memory `feedback_no_em_dashes.md`). KEIN „Lebenswert/Lebensqualität" (Memory `feedback_no_lebenswert.md`); falls Begriff Score-Verweis braucht: „Kiez-Score / Bezirks-Score" aus `project_kiez_score_naming.md`.

### Progressive-Enhancement (FR33, NFR-P1)

Page muss ohne JavaScript lesbar sein. Konsequenzen:

- h1, Lead, Steckbrief-Tabelle, FAQ-Placeholder: alle Server-rendered Plain-HTML
- Karten-Embed: MapLibre lädt im Client. `<noscript>` zeigt SVG-Fallback oder OG-Image
- Adress-Suche im Header: ist bereits Progressive-Enhancement-fähig (Story 1.5)
- Sprach-Switcher: einfaches `<a>`-Tag mit `localizeHref` als `href` (siehe `+layout.svelte:60`)

E2E mit Playwright `--no-javascript`-Profile prüft das Smoke.

### Origin-Resolution

Konsistent mit Story 2.1 + 2.2: `page.url.origin` aus `$app/state`. Für JSON-LD-Generators als Builder-Param reichen.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** `bezirk-hero.svelte` darf nicht zum Monster werden. Sub-Komponenten `bezirk-steckbrief.svelte`, `bezirk-faq-placeholder.svelte` falls nötig
- **#3 Bestehende Funktionen prüfen:** `getBezirkProfile`, `normalizeSlug`, `@turf/bbox`, `@turf/center` existieren. Keine Re-Implementation
- **#7 TypeScript strict:** kein `any`
- **#10 Cookieless:** Page setzt keine Cookies (Server-only-Render)
- **#13 A11y-First:** Bezirks-Page muss WCAG-AA, axe-Check 0 Violations
- **#14 i18n-First:** Lead, Title, Description via Paraglide-Messages
- **#21 prerender + entries enumerieren:** AC-1 enforced

### Test-Strategie (TDD per ADR-012)

- **Loader-Tests:** Snapshot mit Fixture-`BezirkProfile` + Fixture-`BezirkStats` (oder `null`)
- **Komponenten-Tests:** `bezirk-hero.svelte` mit Fixture (vitest-browser-svelte ohne fetch-Spy per Memory)
- **Map-Embed-Smoke:** kann mounten ohne Error
- **E2E:** 1 Bezirk lädt ohne JS, axe-Check
- **Build-Verify:** 24 prerendered Files existieren

### Open-Questions vor Dev-Start

1. **Reihenfolge zu Story 2.0:** (a) 2.3 erst nach 2.0-Merge, (b) jetzt mit `null`-Mock, (c) hard Placeholder. Empfehlung (a). User-Entscheidung?
2. **Karten-Embed:** Erweitern oder separate Komponente? Empfehlung separate ~150-LOC `map-embed.svelte`. Akzeptabel?
3. **FAQ-Section-Placeholder:** Section komplett ausblenden bis 2.5b oder Placeholder-Text? Empfehlung Placeholder-Text (sonst Layout-Sprung). OK?
4. **OG-Image-Meta jetzt setzen, obwohl Asset noch nicht existiert:** Empfehlung ja (Crawler werden 404 verzeihen, ab Story 2.6 ist Asset da). Akzeptabel?
5. **Steckbrief-Werte-Set:** entspricht der Tabelle in Dev-Notes. Will Matze zusätzliche oder andere Werte (z.B. Wahldaten — Epic 6, Stolperstein-Dichte als Heritage-Signal)?

### Project Structure Notes

- Route: `src/routes/(with-header)/bezirk/[slug]/+page.svelte` + `+page.server.ts`
- Komponente: `src/lib/components/atlas/bezirk-hero.svelte` (plus ggf. Sub-Komponenten)
- Embed-Map: `src/lib/components/atlas/map-embed.svelte` (neu)
- Sitemap-Source: `src/lib/seo/sources/bezirk-pages.ts` (neu; Verzeichnis aus Story 2.1)
- Loader nutzt `$lib/data/get-bezirk-profile.ts` (Bestand) + `$lib/server/db/queries/get-bezirk-stats.ts` (Story 2.0)
- i18n-Keys: neue Messages für Lead, Title, Description in `messages/de.json`

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1113-L1139](../planning-artifacts/epics.md)
- FR27 + FR33: [prd.md#L729-L735](../planning-artifacts/prd.md)
- UX-DR43 Long-Form: [ux-design-specification.md#L1185-L1215](../planning-artifacts/ux-design-specification.md)
- 21 MUST-Regeln: [architecture.md#L1051-L1073](../planning-artifacts/architecture.md)
- ADR-012 TDD: [docs/adr/ADR-012-tdd-mandate.md](../../docs/adr/ADR-012-tdd-mandate.md)
- Bestehender Loader: [src/lib/data/get-bezirk-profile.ts](../../src/lib/data/get-bezirk-profile.ts)
- BezirkProfile-Typ: [src/lib/data/types.ts:114-124](../../src/lib/data/types.ts)
- Story 2.0 (Postgres-Foundation): [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.1 (SEO-Foundation): [./2-1-seo-foundation-sitemap-canonical-robots-txt.md](./2-1-seo-foundation-sitemap-canonical-robots-txt.md)
- Story 2.2 (JSON-LD-Lib): [./2-2-json-ld-generator-bibliothek.md](./2-2-json-ld-generator-bibliothek.md)

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
