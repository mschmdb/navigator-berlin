# Story 2.11: Static Hero-Landing auf `/` + Atlas-Move auf `/explore`

Status: ready-for-dev

## Story

As a Erstbesucher und SEO-Traffic-Lander auf `/`,
I want eine schnelle, statisch prerenderte Homepage mit Wertversprechen, Adress-Suche und Beispiel-Einstiegen, die mich gezielt in den Atlas auf `/explore` führt,
so that ich sofort verstehe was navigator.berlin ist, ohne dass die schwere Karten-Anwendung beim ersten Aufruf geladen wird. LCP und Initial-JS-Budget werden mühelos getroffen, der Atlas wird zur dedizierten Tool-Route mit klarer URL-Semantik (`navigator.berlin/explore`).

## Probleme heute

1. Atlas (MapLibre + Inspector + Layer-Palette) lädt auf `/`. Das ist die heaviest UI im Repo (`src/routes/(with-header)/+page.svelte` = 988 LOC, hängt an MapLibre + Layerchart + Turf + pmtiles + bits-ui). Erstkontakt-Bandbreite + Hydration-Cost trifft jeden Brand-Lander unnötig hart, NFR-P1/P5/P6 kommen unter Druck.
2. Welcome-Overlay-Pattern (alte Variante) wurde am 2026-05-15 verworfen: Modal über Karte ist UX-Antipattern (Skip-Reflex), Adress-Suche dreifach redundant (Header + Hero + Overlay), Brand-Bühne fehlt.
3. SEO/AEO/LLM-Crawler bekommen auf `/` aktuell nur einen Atlas-Shell ohne substantiellen Text. Hero-Landing-Page mit semantischem HTML löst das.
4. Atlas-URL `navigator.berlin` ohne Pfad ist semantisch flach. `navigator.berlin/explore` passt zur Domain (navigate + explore), `/explore` ist als Lehnwort etabliert (Spotify, Apple, Notion).
5. Phase-Sequencing: Phase 1 = Coming-Soon, Phase 2 = Beta, Phase 3 = Hard-Launch. Heute ist alles auf `/` gemischt. Mit `/` (Hero) + `/explore` (Tool) wird Phase-Toggle ein reiner Content-Swap, keine Architektur-Migration.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1367-1468.
- PRD: FR27 (Bezirks-Routen), FR32 (Title + Description), FR33 (Progressive Enhancement), FR36 (JSON-LD `WebSite`, `AboutPage`, `BreadcrumbList`), FR40 (Provenance), FR55b/d/e (URL-Prefix DE/EN, Sprach-Switcher, hreflang), NFR-P1 (LCP < 2.5s, Story-Ziel 1.5s), NFR-P5 (Initial JS gzipped, Story-Ziel ≤ 50 KB), NFR-P6 (Page-Weight ≤ 500 KB Landing, Story-Ziel ≤ 200 KB), NFR-P9 (MapLibre lazy), NFR-A1 (axe 0 Errors).
- UX-Spec: UX-DR14 (`AddressSearch` hero/header-Variants, Z. 1559-1573), UX-DR42 (Karten-Sicht-Route, Z. 347), `MetaFooter` (Z. 1645-1649), `MapAccessibilityLayer` (Z. 1581).
- Memory `project_atlas_explore_route.md`: Story-2.11-Pivot Welcome-Overlay → Static-Hero + `/explore`.
- Memory `project_paraglide_reroute.md`: SvelteKit-Routes ohne `[lang]`-Param, `getLocale()` statt `params.lang`. Route-Naming-Lock: `/explore` in beiden Locales identisch (kein `/erkunden`).
- Memory `project_server_purchase_sequencing.md`: Phasen-Schritt 1 Coming-Soon → 2 Beta → 3 Hard, Coming-Soon-Variante hier zu bauen.
- Memory `feedback_no_em_dashes.md`: keine em-dashes (U+2014) in UI-Strings, Doppelpunkt oder Komma stattdessen.
- Memory `feedback_no_lebenswert.md`: NIEMALS „lebenswert" oder „Lebensqualität". Verweise auf Ranking-Page nutzen „Wo lebt es sich gut?".
- Story 2.0 (review): `bezirk_score` + `kiez_score`-Tabellen, `getBezirkStats` als Datenpfad. Default-Daten-Quelle für Top-Kieze + Bezirks-Featured.
- Story 2.1 (review, `SeoHead` bereits in Repo): `src/lib/components/atlas/seo-head.svelte` existiert, `SitemapSource`-Type in `src/lib/seo/sitemap-builder.ts:32` + `ALL_SOURCES`-Registry Z. 131. 2.11 importiert `SeoHead` direkt und registriert eine neue Source in `ALL_SOURCES`.
- Story 2.2 (review, Generators noch nicht im Repo): `buildWebSite`, `buildAboutPage`, `buildBreadcrumbList`, `JsonLd`-Komponente sind NICHT vorhanden (grep über `src/lib/seo/` leer). 2.11 nutzt deshalb das XSS-sichere Inline-Pattern (siehe AC-6). Refactor zu Generators erfolgt nach 2.2-Merge.
- Story 2.3 (ready-for-dev): Bezirks-Long-Form-Pages `/bezirk/[slug]`. Bezirks-Featured-Cards verlinken hierher.
- Story 2.4 (ready-for-dev): Kiez-Long-Form-Pages. Top-Kieze-Teaser verlinkt hier.
- Story 2.5a (ready-for-dev): Layer-Detail-Pages DE+EN. Layer-Teaser-Cards verlinken zu `/layer/[slug]`.
- Story 2.5b (ready-for-dev): FAQ-Section-Komponente + `faq_qna`-Aggregat. Hero-FAQ-Sektion konsumiert.
- Story 2.6 (ready-for-dev): OG-Image-Pipeline. Default-OG für `/` aus 2.6 oder Story 2.12.
- Story 2.9a (ready-for-dev): Kiez-Score-Aggregat. Top-Kieze-Strategie konsumiert.
- Story 2.9b (ready-for-dev): Ranking-Page „Wo lebt es sich gut?". Top-Kieze-Teaser verlinkt hier.
- Story 2.12 (ready-for-dev, sequenziell hinter 2.11): Hero-Content (Final-Copy + Paraglide-Messages + Screenshot-Assets). 2.11 baut die Slots, 2.12 befüllt sie.
- Story 2.13 (review, merged 2026-05-16): Updates-Route bereits live. `loadUpdatesFromModules` + `latestUpdates(n)` exportiert aus `src/lib/content/updates/load-updates.ts`. `UPDATES_PAGES_SOURCE` in `src/lib/seo/sources/updates.ts` registriert. 2.11 KONSUMIERT diese Helper im `home-updates-teaser` (kein Feature-Flag mehr nötig). Zusätzlich: 2.13 hat AC-14 Phase-Coming-Soon-Guard zu 2.11 deferred → 2.11 muss `phase.ts` mit `assertPhaseAllows(route)`-Helper liefern, damit Feeds in Phase 1 503-gated werden können.
- Story 1.26 (done): Bookmark-Schema (`src/lib/state/bookmark-schema.ts`) speichert ausschließlich Koordinaten + Display-Metadaten, KEINE URLs. Migration auf `/explore?address=` ist nicht nötig (URL wird zur Laufzeit aus Koordinaten gebildet). Siehe Open-Question 1.
- Story 3.1 (backlog): Paraglide-Setup-Reduce auf DE/EN. Heute ist Paraglide nur als Stub aktiv (`messages/de.json` = nur `hello_world`-Key, Strategy ohne `url`). 2.11 schreibt deshalb DE-Strings hart in den Markup, EN-Variante kommt mit 3.1 + 3.2 nach.

## Akzeptanz-Kriterien

1. **AC-1 (Atlas-File-Move auf `/explore`, URL-Verträge unverändert):**
   **Given** die bestehende Atlas-Implementierung in `src/routes/(with-header)/+page.svelte` (988 LOC) und `src/routes/(with-header)/+page.ts` (10 LOC).
   **When** ich Atlas nach `src/routes/(with-header)/explore/+page.svelte` und `src/routes/(with-header)/explore/+page.ts` verschiebe (`git mv`, keine Inhalts-Änderung).
   **Then**:
   - Datei-Inhalte 1:1 identisch zu vorher (kein neuer Code in 2.11, der nicht move-bedingt ist).
   - Atlas-Funktionalität (Karte, Inspector, Address-Search, Layer-Palette, Compare, Bookmarks, URL-State-Sync) bleibt unverändert.
   - Neue URLs: `/explore` (DE-Default) und `/en/explore` (EN via Paraglide-`deLocalizeUrl`-Reroute aus `src/hooks.ts`).
   - Query-Parameter `?address=`, `?bbox=`, `?zoom=`, `?center=`, `?layers=`, `?q=`, Compare-Params `?compare=&b=` funktionieren identisch.
   - Test: `pnpm check` 0 Errors, `pnpm test:unit` weiterhin grün, Bestands-E2Es laufen gegen `/explore` (siehe Task T6).
   - **Hinweis:** `src/routes/(with-header)/+page.svelte.test.ts` existiert NICHT (kein Move nötig). `src/routes/(with-header)/__screenshots__/` existiert NICHT (kein Move nötig). Epic-AC-Wortlaut „inkl. zugehöriger +page.svelte.test.ts, Screenshot-Ordner" ist deshalb a no-op in der Praxis.

2. **AC-2 (Naked `/explore`-Aufruf, Default-Viewport):**
   **Given** `/explore` oder `/en/explore` ohne Query-Parameter.
   **When** Nutzer die Route lädt.
   **Then**:
   - Karte rendert mit Default-Viewport „ganz Berlin" (heutiges Verhalten via `BERLIN_BBOX_ARRAY`, `BERLIN_CENTER`, `DEFAULT_ZOOM` aus `src/lib/data/constants.ts`, konsumiert über `src/lib/utils/viewport-from-url.ts`).
   - Inspector zeigt Empty-State, kein Address-Marker, kein URL-Parameter-Reflect.
   - Default-Viewport-Konstanten bleiben in `src/lib/data/constants.ts` (siehe Open-Question 2: Epic-AC fragt `src/lib/components/atlas/internal/default-viewport.ts`, Empfehlung NICHT verschieben sondern Re-Export oder Pointer-Datei, um Bestand nicht zu brechen).

3. **AC-3 (Statische Hero-Landing auf `/`, `prerender = true`, JS-Budget):**
   **Given** Atlas ist auf `/explore` verschoben (AC-1), `src/routes/(with-header)/+page.svelte` ist frei.
   **When** ich `src/routes/(with-header)/+page.svelte` als statische Hero-Landing neu implementiere und `src/routes/(with-header)/+page.ts` (oder neue `+page.server.ts`) mit `export const prerender = true;` markiere.
   **Then**:
   - Page enthält KEINEN MapLibre-Import, KEINEN Inspector-Import, KEINEN Layer-Palette-Import, KEINEN `getLayersAtPoint`-Call, KEINEN `getKiezScore`-Call, KEINE `geocode.remote.ts`-Live-Calls (nur statisch im Build).
   - Hydration-JS umfasst ausschließlich: Address-Combobox-Submit (Submitter → `goto('/explore?address=...')`), Skip-Link-Fokus-Verhalten.
   - Initial-JS gzipped ≤ 50 KB für `/` (NFR-P5 unterboten, Story-Ziel statt 200 KB Budget).
   - Page-Weight ≤ 200 KB inkl. Plex-Variable-Font-Subset (NFR-P6 unterboten).
   - LCP < 1.5s im Lighthouse-CI gegen Production-Build, Profil Moto G Power 4G Slow (siehe Task T7).
   - Empfehlung: Hero-Landing ist eine Server-Komponente mit Client-Island ausschließlich für die Combobox. Atlas-Bundle wird über kein Code-Share-Pfad importiert (Vite-Bundle-Inspect verifiziert).

4. **AC-4 (Hero-Sektions-Skeleton, Crawler-lesbar):**
   **Given** die neue Hero-Landing.
   **When** sie initial gerendert wird.
   **Then** folgende Sektionen sind im prerendered HTML enthalten (Reihenfolge wie Epic-AC, Inhalt = Skeleton mit Final-Copy aus Story 2.12 später ersetzt; in 2.11 hart DE als Platzhalter, EN-Migration mit Story 3.2):
   1. **Hero-Block**: Plex-Serif h1 mit `--text-4xl` bis `--text-6xl` responsive, Inhalt „Berlin in Schichten." (DE) als hartkodierter String, Plex-Sans Lead `--text-lg`, max 60ch, „Tippe eine Adresse oder wähle einen Bezirk. Du siehst Klima, Lärm, Wohnlagen, Verkehr und Geschichte für jeden Punkt der Stadt. Quellen offen, Code offen, ohne Tracking."
   2. **Address-Combobox**: bestehende `address-search.svelte` *hero*-Variante (UX-DR14, Variant `hero` schon im Repo). Submitter ruft `goto('/explore?address=' + encodeURIComponent(slug))` mit `keepFocus: false`. Locale-aware Ziel: bei `getLocale() === 'en'` → `/en/explore?address=`.
   3. **Beispiel-Quick-Links**: 5 `<a href="/explore?address=...">`-Tags (reguläre Anchor, KEIN JS-Hijack, FR33). Finales 5er-Set kommt aus Story 2.12. In 2.11 Platzhalter mit 5 öffentlich bekannten Berlin-Adressen (Brandenburger Tor, Alexanderplatz, Görlitzer Park, Tempelhofer Feld, Schloss Charlottenburg) als hart kodierte Geocoder-Slug-IDs oder als Adress-Query-Strings.
   4. **Layer-Teaser-Grid**: 5 Karten (Klima, Lärm, Wohnlagen, Verkehr, Geschichte) mit Plex-Serif h3 + Plex-Sans Lead + `<a href="/layer/[slug]">`. Mini-Screenshot-Slot (Story 2.12 liefert WebP-Assets, in 2.11 Placeholder-DIV mit `aspect-ratio: 4/3` + Plex-Sans Caption „Vorschau folgt").
   5. **Top-Kieze-Teaser**: 5 `<a href="/kiez/[slug]">`-Tags mit Kiez-Name + Score-Zahl. Datenquelle in 2.11 OPTIONAL: wenn `kiez_score`-Tabelle aus 2.9a noch nicht befüllt ist, Skeleton zeigt 5 statische Placeholder-Slugs (Doku im Source-Comment „TODO Story 2.9a/2.12: dynamisch befüllen"). Verweis zur Ranking-Page `/wo-lebt-es-sich-gut` (Story 2.9b).
   6. **Bezirks-Featured-Cards**: 3-4 `<a href="/bezirk/[slug]">`-Tags. Auswahl in 2.11 als hartkodierte Bezirks-Slugs (Friedrichshain-Kreuzberg, Mitte, Neukölln, Pankow) oder leerer Slot, Final-Auswahl + Bilder kommen mit 2.12.
   7. **„Offen + ohne Tracking"-Block**: Brand-Anker mit Plex-Serif h2 + 4 Bullets + Verweis auf `/methodik`, `/lizenzen`, GitHub-Repo. URL-Konstanten in `src/lib/data/constants.ts` ergänzen (Repo-URL).
   8. **FAQ-Sektion**: 5-7 Top-Level-Fragen. Datenquelle ist Story 2.5b `faq_qna`-Aggregat. Wenn 2.5b noch nicht live ist, Skeleton mit Placeholder-Q&As (statisch) oder ganzer Block bleibt im Feature-Flag-Off-Modus aus.
   9. **Updates-Teaser**: Top-3 letzte Einträge aus `_content/updates/` (Story 2.13 ist merged). Implementierung via `import.meta.glob('/_content/updates/*.md', { query: '?raw', import: 'default', eager: true })` + `loadUpdatesFromModules(modules)` + `latestUpdates(entries, 3)` aus `src/lib/content/updates/load-updates.ts`. Render-Pattern identisch zu `src/routes/(with-header)/updates/+page.server.ts:17`. KEIN Feature-Flag mehr nötig (2.13 deferral-Note aus Sprint-Status Z. 42 erledigt sich hiermit).
   10. **Hairline-Trenner zum Footer**.
   - Hero-FAQ-Section bleibt hinter Feature-Flag `HOME_FAQ_ENABLED` (wartet auf Story 2.5b `faq_qna`). Updates-Teaser wird DIREKT gerendert (2.13 ist merged, Helper sind verfügbar). Alle anderen Sektionen werden in 2.11 mit Placeholder-Content gerendert.
   - Alle interaktiven Elemente sind keyboardable, `tab`-Reihenfolge folgt visueller Reihenfolge, `axe`-Audit 0 Violations (Task T7).

5. **AC-5 (SiteHeader-Verhalten DE+EN, Atlas-CTA, Logo-Link):**
   **Given** der bestehende `src/lib/components/atlas/site-header.svelte`.
   **When** Nutzer auf `/` ist.
   **Then**:
   - Logo-Link verweist auf `/` (selbst), bleibt unverändert.
   - „Atlas öffnen"-Button rechts neben Layer-Palette-Button: neue Komponente oder neuer Slot in SiteHeader. Variante: SiteHeader bekommt neuen Prop `atlasCtaHref?: string`, wenn gesetzt rendert SiteHeader eine sekundäre Action „Atlas öffnen" / „Open Atlas". Auf `/` setzt Layout den Prop auf `/explore`, auf `/explore` bleibt der Prop `undefined`.
   - **Wichtig**: Auf `/explore` zeigt SiteHeader die kompakte Address-Search inline (UX-DR14 *header*-Variante, schon implementiert). Auf `/` wird die Header-Address-Search visuell unterdrückt oder durch ein neutrales „Adresse suchen"-Icon ersetzt, weil die Hero-Combobox dominanter Einstieg ist und Doppel-Eingang vermieden werden soll (UX-Lock: nur EIN Einstieg pro Page). Empfehlung: Wenn `atlasCtaHref` gesetzt ist, SiteHeader rendert `searchCollapsed = true` und der Icon-Button öffnet `address-search-overlay`. Sprach-Switcher bleibt in beiden Layouts präsent.
   - Test: `site-header.svelte.test.ts` um 2 Cases (`atlasCtaHref` gesetzt → CTA gerendert; nicht gesetzt → kein CTA).

6. **AC-6 (SEO + Structured Data auf `/`):**
   **Given** Story 2.1 `SeoHead` und Story 2.2 `JsonLd`-Generators.
   **When** `<svelte:head>` der Root-Route bestückt wird.
   **Then**:
   - **Title (DE)**: „Navigator Berlin · Stadt-Schichten für jeden Punkt"
   - **Title (EN)**: „Navigator Berlin · City layers for every point"
   - **Meta-Description**: Lead-Absatz-Variante, max 160 Zeichen, eindeutig zwischen DE und EN.
   - **Canonical**: `https://navigator.berlin/` (DE) bzw. `https://navigator.berlin/en/` (EN). KEINE Query-Parameter im Canonical.
   - **JSON-LD `WebSite`** mit `SearchAction`: `target: https://navigator.berlin/explore?address={search_term_string}`, `query-input: required name=search_term_string`. Wird via `buildWebSite`-Generator aus Story 2.2 erzeugt.
   - **JSON-LD `AboutPage`** mit Brand-Beschreibung + Open-Data-Statement (Inhalt aus Story 2.12 finalisiert, in 2.11 mit Platzhalter-Description).
   - **JSON-LD `BreadcrumbList`** (nur Root-Element).
   - **Open-Graph + Twitter-Card**: `og:title`, `og:description`, `og:image` (Default-OG-Asset aus Story 2.6 oder Story 2.12 Pfad `static/screenshots/home/og-default.webp`), `og:type=website`, `og:url`, `twitter:card=summary_large_image`.
   - **hreflang**: `<link rel="alternate" hreflang="de" href="https://navigator.berlin/">`, analog `en` und `x-default` (FR55e).
   - Wenn `SeoHead` (Story 2.1) noch nicht vorhanden: 2.11 schreibt `<svelte:head>` inline, refactor zu `SeoHead` kann in 2.1-Sequencing erfolgen.
   - Wenn `JsonLd`-Komponente (Story 2.2) noch nicht vorhanden: 2.11 nutzt `<script type="application/ld+json">{@html JSON.stringify(data).replace(/</g, '\\u003c')}</script>` als XSS-sicheres Inline-Pattern (analog Bestand in `methodik/+page.svelte`).

7. **AC-7 (SEO + Structured Data auf `/explore`):**
   **Given** `/explore` ist Tool-Route (kein Brand-Lander).
   **When** `<svelte:head>` von `src/routes/(with-header)/explore/+page.svelte` bestückt wird.
   **Then**:
   - Title abhängig vom URL-State: „Berlin Atlas · {Adresse}" wenn `?address=` gesetzt, sonst „Berlin Atlas" (DE) bzw. „Berlin Atlas · {Address}" / „Berlin Atlas" (EN).
   - Canonical zeigt auf URL OHNE dynamische Bbox-Parameter (FR32-Hygiene): `https://navigator.berlin/explore` bzw. `https://navigator.berlin/explore?address={slug}` wenn Adresse fix ist. KEINE `bbox/zoom/center/layers` im Canonical.
   - JSON-LD minimal: `WebPage`-Typ mit Brand + Inhaltsverweis, kein `WebSite` (das gehört auf `/`).
   - Robots-Meta initial `index, follow`. Phase-1-Override (siehe AC-9) setzt `noindex, nofollow`.
   - Bestehende OG-Image-Logik aus `src/lib/utils/og-image-url.ts` bleibt erhalten (Atlas-OG generiert sich aus Selected-Address).

8. **AC-8 (Sitemap-Eintrag für `/` und `/explore`):**
   **Given** Story 2.1 Sitemap-Source-Pattern (`SitemapSource` als offene Schnittstelle).
   **When** `routes/sitemap-de.xml/+server.ts` und `routes/sitemap-en.xml/+server.ts` aus Story 2.1 generieren.
   **Then**:
   - Beide Sitemaps enthalten `/` (bzw. `/en/`) mit `<priority>1.0</priority>` als Hero.
   - Beide Sitemaps enthalten `/explore` (bzw. `/en/explore`) mit `<priority>0.9</priority>` als Atlas.
   - 2.11 liefert die Sitemap-Source: `src/lib/seo/sources/home-pages.ts` exportiert `HOME_PAGES_SOURCE: SitemapSource` mit DE/EN-Einträgen für `/` und `/explore`.
   - Wenn Story 2.1 noch nicht gemerged ist: 2.11 schreibt nur die Source-Datei und Test, das Endpoint-Wiring wartet auf 2.1.

9. **AC-9 (Phase-1-Coming-Soon-Override, Phase-2-Beta-Transition):**
   **Given** Memory `project_server_purchase_sequencing.md` (Phase 1 Coming-Soon → Phase 2 Beta → Phase 3 Hard).
   **When** Phase 1 aktiv ist.
   **Then**:
   - `/` zeigt minimale Coming-Soon-Variante: Brand-Footprint (AnimatedLogo), Owner-Attribution, „Bald verfügbar" / „Coming soon"-Hinweis, KEIN Atlas-Link, KEINE Hero-Combobox-Submit-Funktion (Combobox kann visuell da sein, aber deaktiviert).
   - `/explore` antwortet mit HTTP-503 oder leitet auf `/` um.
   - `robots.txt` Disallow für `/explore` + `noindex, nofollow` im Meta-Robots der Hero-Page.
   - Implementation via Build-Time-Env-Variable `NAVIGATOR_PHASE=coming-soon|beta|hard` (Default `beta` für lokale Dev). Konsumiert in `src/lib/config/phase.ts` (neue Datei). Coming-Soon-Variante als separate Sub-Komponente `home-coming-soon.svelte`, Beta-Variante als `home-beta.svelte`. `+page.svelte` switcht zwischen beiden je nach Phase.
   - `/explore` schaut zur Build-Zeit auf `NAVIGATOR_PHASE`: bei `coming-soon` rendert `+page.server.ts` `error(503, 'Coming soon')` oder Redirect. Bei `beta`/`hard` rendert Atlas normal.
   - Phase-Transition Coming-Soon → Beta = ENV-Change + Re-Deploy. KEINE Architektur-Migration, keine Code-Änderung erforderlich.

10. **AC-10 (Hero-Combobox-Submit + Reguläre Anchor-Tags):**
    **Given** Hero-Address-Combobox + 5 Quick-Links.
    **When** Nutzer eine Adresse auswählt oder Quick-Link klickt.
    **Then**:
    - Combobox-Submit: `goto('/explore?address=' + encodeURIComponent(slug))` (DE) bzw. `goto('/en/explore?address=' + encodeURIComponent(slug))` (EN). `keepFocus: false`, `replaceState: false` (Navigation soll History-Eintrag erzeugen).
    - MapLibre-Chunk wird NICHT auf `/` vorab geladen, sondern erst beim Atlas-Page-Load asynchron (NFR-P9). Verifikation: Vite-Bundle-Inspector zeigt KEINEN MapLibre-Import-Pfad aus dem Hero-Bundle.
    - Quick-Links: alle 5 als `<a href="/explore?address=...">`-Tags, NJS-frei lesbar (FR33). Crawler/LLM ohne JS findet die Targets.
    - Locale-Switch in Quick-Link-Targets: bei `getLocale() === 'en'` werden die `href`-Attribute zu `/en/explore?address=...`. Geocoder-Slug-IDs sind sprach-neutral.

11. **AC-11 (Mobile-Breakpoint + Touch-Targets):**
    **Given** Viewport `<640px`.
    **When** Hero-Landing geladen wird.
    **Then**:
    - Hero-Block staked vertikal, Address-Combobox volle Breite.
    - Quick-Links als Liste (`<ul>`), Touch-Target ≥ 44×44 px pro Link.
    - Layer-Teaser-Grid einspaltig.
    - „Atlas öffnen"-CTA im SiteHeader als Icon-only-Variante.
    - Sticky-Header bleibt sticky, Hero-Padding skaliert auf `--space-12` statt `--space-16`.

12. **AC-12 (Accessibility):**
    **Given** WCAG 2.2 AA komplett (NFR-A1).
    **When** Page geladen wird.
    **Then**:
    - Skip-Link „Direkt zum Inhalt" / „Skip to main" als erstes fokussierbares Element (bestehende `skip-link.svelte` aus Layout, kein neuer Code).
    - Fokus springt nach Hydration auf Hero-Address-Combobox-Input AUSSCHLIESSLICH wenn `prefers-reduced-motion: no-preference` (sonst kein Auto-Fokus, weil Auto-Scroll-Risk).
    - h1 als Dokument-Outline-Start (genau EINE h1 pro Page).
    - h2 pro Hero-Sektion (Layer-Teaser, Top-Kieze, Bezirks-Featured, Offen-Block, FAQ, Updates), h3 pro Card.
    - Alle interaktiven Elemente keyboardable: `tab` durch Combobox → Quick-Links → CTA-Buttons → Layer-Cards → Footer.
    - `axe`-Audit 0 Violations (Playwright + `@axe-core/playwright`, siehe Task T7).
    - Sprache: `<html lang="de">` bzw. `<html lang="en">` korrekt gesetzt via Paraglide-Middleware (Bestand).

13. **AC-13 (EN-Locale `/en/` parallel zu DE):**
    **Given** EN-Locale via Paraglide-Reroute.
    **When** Hero-Landing in EN gerendert wird.
    **Then**:
    - Alle DE-Hardstrings haben EN-Pendant (in 2.11 ebenfalls hardcoded, weil Paraglide-Setup-Reduce noch in Story 3.1 ansteht; Pattern wie aktueller `methodik/+page.svelte`).
    - Quick-Link-Targets ändern den Pfad-Prefix: `<a href="/en/explore?address=...">`.
    - Canonical + hreflang korrekt gesetzt.
    - Tests pro Locale prüfen Render-Output.
    - Hinweis: Wenn Story 3.1 + 3.2 vor 2.11 abgeschlossen sind, baut 2.11 direkt mit Paraglide-Messages. Wenn nicht, hardcoded und mit Story 3.2 nachgezogen.

14. **AC-14 (Bookmark-Links auf neues `/explore`-Schema):**
    **Given** Story 1.26 Bookmark-Schema (`src/lib/state/bookmark-schema.ts`).
    **When** Bookmarks aus dem Inspector geöffnet werden.
    **Then**:
    - Bookmark-Schema enthält KEINE URL-Felder (verifiziert: `bookmark-schema.ts` speichert `lat/lng/displayName/bezirk/postcode/createdAt`). Es ist KEIN Migration-Helper nötig (Epic-AC „bookmark-migrate-v2.ts" ist semantisch leer, siehe Open-Question 1).
    - Bookmark-Konsumenten generieren die URL zur Laufzeit. Atlas auf `/explore` baut die URL aus Bookmark-Koordinaten ähnlich wie bisher auf `/`. Bei Bookmark-Click aus Bookmark-Dialog: `selection.set(bookmarkToSuggestion(bookmark))` triggert den bestehenden Pipeline-Pfad in `+page.svelte` auf `/explore`.
    - 2.11 muss verifizieren, dass die bestehende `bookmark-dialog.svelte` weiterhin korrekt funktioniert nachdem Atlas auf `/explore` lebt (E2E-Smoke in Task T6).

15. **AC-15 (TDD-Mandat + Performance-Gates):**
    **Given** ADR-012 Pragmatic TDD und NFR-P5 Bundle-Gate.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** für neue pure Logic (Phase-Switch in `src/lib/config/phase.ts`, Sitemap-Source `home-pages.ts`): TDD red-green-refactor je AC.
    - **Komponenten-Tests** für neue Komponenten (`home-coming-soon.svelte`, `home-beta.svelte`, `home-hero.svelte`, `home-quick-links.svelte`, `home-layer-teasers.svelte`): Render + interaktive Smoke (vitest-browser-svelte).
    - **SiteHeader-Test** erweitert um `atlasCtaHref`-Verhalten.
    - **E2E**: `tests/e2e/home-landing.e2e.ts` testet (1) `/` ohne JS lesbar (FR33), (2) Hero-Combobox-Submit navigiert zu `/explore?address=`, (3) Quick-Links sind `<a href>`-Anchor, (4) `axe`-Check 0 Violations, (5) Atlas auf `/explore` rendert MapLibre-Canvas. E2E-Run deferred zu CI/User-Verify analog Stories 1.x.
    - **Bestands-E2E-Sweep**: `tests/e2e/*` die `goto('/')` für Atlas nutzen, müssen auf `/explore` umgepointed werden. Affected Files: `tests/e2e/atlas-polish.e2e.ts`, `tests/e2e/map-render.e2e.ts`, `tests/e2e/inspector-panel.e2e.ts`, `tests/e2e/map-interaction.e2e.ts`, `tests/e2e/inspector-ux.e2e.ts`, `tests/e2e/compare-flow.e2e.ts`, `tests/e2e/bookmark-flow.e2e.ts`, `tests/e2e/address-search.e2e.ts`, `tests/e2e/layer-toggle.e2e.ts`, `tests/e2e/layer-explain-coverage.e2e.ts`, `tests/e2e/climate-heritage.e2e.ts`, `tests/e2e/climate-chart-interaction.e2e.ts`, `tests/e2e/editorial-pattern.e2e.ts`, `tests/e2e/poi-popover.e2e.ts`, `tests/e2e/share-sheet.e2e.ts`, `tests/e2e/tab-order.e2e.ts`, `tests/e2e/a11y.e2e.ts`, `tests/e2e/kiez-score-flow.e2e.ts`, `tests/e2e/methodik-flow.e2e.ts`. Sweep ist `goto('/')` → `goto('/explore')`, mechanisch.
    - **Bundle-Budget**: `pnpm build` plus Bundle-Inspect (size-limit oder Custom-Vite-Plugin) verifiziert Initial-JS gzipped `/` ≤ 50 KB.
    - **Lighthouse-CI** (Story 4.3 wired-up, in 2.11 manueller Run reicht): LCP < 1.5s, Performance-Score ≥ 95 (mobile), A11y ≥ 95, SEO ≥ 95.

## Tasks / Subtasks

- [ ] **T1: Atlas-File-Move auf `/explore`** (AC: 1, 2)
  - [ ] T1.1: `git mv src/routes/(with-header)/+page.svelte src/routes/(with-header)/explore/+page.svelte`
  - [ ] T1.2: `git mv src/routes/(with-header)/+page.ts src/routes/(with-header)/explore/+page.ts`
  - [ ] T1.3: Sanity-Check: `pnpm dev` öffnet Atlas unter `/explore`, `/en/explore` (Paraglide-Reroute via `src/hooks.ts` greift automatisch).
  - [ ] T1.4: `pnpm check` 0 Errors. Vorhandene Imports im Move-File bleiben unverändert.
  - [ ] T1.5: Default-Viewport-Konstanten bleiben in `src/lib/data/constants.ts`. KEIN Move zu `default-viewport.ts` (Open-Question 2).

- [ ] **T2: Phase-Switch + Coming-Soon-Variante** (AC: 9)
  - [ ] T2.1: `src/lib/config/phase.ts` mit `getPhase(): 'coming-soon' | 'beta' | 'hard'`. Liest `import.meta.env.NAVIGATOR_PHASE` (Vite-Konvention), Default `beta`.
  - [ ] T2.2: `assertPhaseAllows(route: 'explore' | 'updates' | 'feeds'): void`-Helper im selben Modul. Wirft `error(503, 'Coming soon')` wenn Phase `coming-soon` und Route nicht in `COMING_SOON_ALLOWLIST` (`/`, `/methodik`, `/lizenzen`, `/impressum`, `/datenschutz`). 2.13-Sprint-Status-Z.-42-Deferral wird hiermit aufgelöst: nach 2.11-Merge kann 2.13 `assertPhaseAllows('updates')` in alle Updates-`+page.server.ts` und Feed-Endpoints einziehen.
  - [ ] T2.3: Unit-Tests `src/lib/config/phase.test.ts` mit 3 Env-Permutationen plus Default + 3 Allowlist-Cases (`/`, `/explore`, `/updates`) je Phase.
  - [ ] T2.4: `src/routes/(with-header)/+page.server.ts` (oder `.ts`) mit `prerender = true` und Phase-Resolution. Reicht `phase` an `+page.svelte`.
  - [ ] T2.5: `src/routes/(with-header)/explore/+page.server.ts`: `assertPhaseAllows('explore')` als erste Zeile in `load()`. Beachtung: muss `prerender = false` für Atlas-Route, weil Geocoder-Dyn-Data. (Aktuell ist Atlas auf `/` nicht prerendered, das bleibt.)
  - [ ] T2.6: `static/robots.txt` für Phase `coming-soon` mit `Disallow: /explore`. Robots-Generation kann in Story 2.1 sitzen, hier nur Test-Pflicht.

- [ ] **T3: Hero-Landing Komponenten-Skelett** (AC: 3, 4, 11)
  - [ ] T3.1: `src/lib/components/home/home-hero.svelte` (Plex-Serif h1 + Lead + Address-Combobox als Slot-Komponente, <300 LOC).
  - [ ] T3.2: `src/lib/components/home/home-quick-links.svelte` (5 `<a>`-Tags, Touch-Target ≥ 44 px Mobile).
  - [ ] T3.3: `src/lib/components/home/home-layer-teasers.svelte` (5 Layer-Cards, Placeholder-Mini-Screenshot-Slot).
  - [ ] T3.4: `src/lib/components/home/home-top-kieze.svelte` (5 Kiez-Links, Score-Zahl-Slot, optionales Datenkonsum aus 2.9a).
  - [ ] T3.5: `src/lib/components/home/home-featured-bezirke.svelte` (3-4 Bezirks-Cards).
  - [ ] T3.6: `src/lib/components/home/home-open-block.svelte` (Brand-Anker mit Bullets + Methodik/Lizenzen/GitHub-Links).
  - [ ] T3.7: `src/lib/components/home/home-faq-section.svelte` (Wrapper, lädt `faq_qna` aus 2.5b oder versteckt sich hinter Feature-Flag).
  - [ ] T3.8: `src/lib/components/home/home-updates-teaser.svelte` rendert Top-3 Einträge. Datenquelle via `load()` in `+page.server.ts`: `loadUpdatesFromModules(import.meta.glob('/_content/updates/*.md', { query: '?raw', import: 'default', eager: true }))` + `latestUpdates(entries, 3)`. Pattern siehe `src/routes/(with-header)/updates/+page.server.ts:17`. Render: Plex-Serif h3 + Date + Kategorie-Badge + Lead, Link zu `/updates/[slug]`, plus „Alle Updates"-CTA zu `/updates`.
  - [ ] T3.9: `src/lib/components/home/home-beta.svelte` orchestriert alle Sub-Komponenten in Reihenfolge AC-4 1-10.
  - [ ] T3.10: `src/lib/components/home/home-coming-soon.svelte` (minimaler Brand-Footprint + AnimatedLogo + Hinweis).
  - [ ] T3.11: Komponenten-Tests pro neuer Komponente (Render + Locale-Switch).

- [ ] **T4: Hero-Combobox-Submit-Logik + Locale-Aware-URLs** (AC: 10, 13)
  - [ ] T4.1: `home-hero.svelte` konsumiert bestehende `address-search.svelte` mit `variant="hero"`.
  - [ ] T4.2: Submit-Handler nutzt `getLocale()` und `goto`-Path-Builder. Mehrere Tests für DE+EN-Routes.
  - [ ] T4.3: Quick-Link-Hrefs Locale-aware. Util `buildExploreHref(slug: string, locale: 'de' | 'en'): string` in `src/lib/utils/explore-href.ts` plus Tests.
  - [ ] T4.4: Verifizieren dass MapLibre nicht aus Hero-Bundle gezogen wird (Vite-Bundle-Inspect, manueller Check + idealerweise Custom-Bundle-Test).

- [ ] **T5: SiteHeader-Anpassung + Layout-Wiring** (AC: 5)
  - [ ] T5.1: `site-header.svelte` Prop `atlasCtaHref?: string` ergänzen. Wenn gesetzt, „Atlas öffnen"/„Open Atlas"-Anchor rendern (Plex-Sans, sekundärer Style). Layout-Pivot: gleichzeitig `searchCollapsed = true` setzen, wenn `atlasCtaHref` gesetzt ist (UX-Lock keine Doppel-Eingang).
  - [ ] T5.2: `+layout.svelte` (`(with-header)`) reicht `atlasCtaHref="/explore"` an SiteHeader weiter, wenn `page.url.pathname === '/'`.
  - [ ] T5.3: Bestehende `site-header.svelte.test.ts` um 2 Cases erweitern.
  - [ ] T5.4: Manueller Browser-Smoke: Logo-Klick auf `/explore` führt zurück nach `/`, „Atlas öffnen"-Click auf `/` führt nach `/explore`.

- [ ] **T6: SEO + JSON-LD + Sitemap-Source** (AC: 6, 7, 8)
  - [ ] T6.1: `<svelte:head>`-Block in `home-beta.svelte` und `home-coming-soon.svelte` (Title + Description + Canonical + hreflang + OG/Twitter + Robots-Meta).
  - [ ] T6.2: JSON-LD-Generators inline oder via Story 2.2 `JsonLd`-Komponente (falls 2.2 schon gemerged). Drei Blocks: `WebSite + SearchAction`, `AboutPage`, `BreadcrumbList`.
  - [ ] T6.3: `src/lib/seo/sources/home-pages.ts` exportiert `HOME_PAGES_SOURCE: SitemapSource` mit DE/EN-Einträgen für `/` und `/explore`. Wartet auf Story 2.1 für `SitemapSource`-Type. Wenn 2.1 noch nicht gemerged: 2.11 schreibt Source-File + Tests, Endpoint-Wiring in 2.1.
  - [ ] T6.4: `/explore` `<svelte:head>` (jetzt in `src/routes/(with-header)/explore/+page.svelte`): Title-State + Canonical + Robots-Meta-Anpassung für Phase 1.
  - [ ] T6.5: Snapshot-Tests pro Locale (DE+EN) für Hero-Page `<svelte:head>` und für `/explore` `<svelte:head>`.

- [ ] **T7: Hero-Polish + Performance-Gates + Bestands-E2E-Sweep** (AC: 3, 11, 12, 15)
  - [ ] T7.1: Skip-Link-Fokus-Verhalten verifiziert (Bestand, kein neuer Code).
  - [ ] T7.2: Tastatur-Walk Hero → Quick-Links → CTA → Layer-Cards → Footer. Bestehende `tab-order.e2e.ts`-Pattern adaptieren.
  - [ ] T7.3: `tests/e2e/home-landing.e2e.ts` mit 5 Cases (siehe AC-15).
  - [ ] T7.4: E2E-Sweep: `goto('/')` → `goto('/explore')` in den 18 Bestands-E2Es (mechanisch, ein PR-Commit pro Sweep).
  - [ ] T7.5: Performance-Smoke: lokaler `pnpm build` + `pnpm preview` + manueller Lighthouse-Run gegen `/`. LCP, FCP, TBT, CLS dokumentieren in Dev-Notes.
  - [ ] T7.6: Bundle-Inspect: `pnpm build` Output checken, Initial-JS `/` ≤ 50 KB gzipped. Falls Custom-Bundle-Test existiert (Story 4.3), den nutzen. Falls nicht, `gzip-size`-Helper-Script.

- [ ] **T8: Final-Verifikation** (AC: 1-15)
  - [ ] T8.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T8.2: `pnpm check` 0 Errors (svelte-check strict).
  - [ ] T8.3: `pnpm build` läuft ohne Warning, `/` prerendert, `/explore` als SSR-Route registriert.
  - [ ] T8.4: Browser-Verify lokal: DE + EN je Phase (Coming-Soon + Beta).
  - [ ] T8.5: Sprint-Status-Eintrag setzen.

## Dev Notes

### Pivot-Hintergrund (Decision-Log 2026-05-15)

Welcome-Overlay-Pattern verworfen aus drei Gründen:
1. Modal über Karte ist UX-Antipattern, treibt Skip-Reflex statt Lesetiefe.
2. MapLibre auf `/` belastet NFR-P1/P5/P6 unnötig, jeder Brand-Lander bezahlt das.
3. Adress-Suche dreifach redundant (Header + Hero + Overlay) zerstört die „Ein Eingangspfad"-UX.

Static-`/` + Atlas-auf-`/explore` löst alle drei Probleme: Brand + SEO + Editorial-Bühne auf `/`, Tool sauber unter eigener Route. `/explore` passt semantisch zur Domain navigator.berlin.

### Route-Naming-Lock

`/explore` bleibt in beiden Locales identisch (`/explore` DE und `/en/explore` EN). KEIN Paraglide-Reroute zu `/erkunden`. Begründung: Ein-Wort-Deep-Link, Sprach-Switch ohne Pfad-Brechen, „explore" ist als Lehnwort etabliert (Spotify, Apple, Notion).

### File-Layout

```
src/
├── routes/
│   ├── (with-header)/
│   │   ├── +layout.svelte                   (unverändert, reicht atlasCtaHref durch)
│   │   ├── +page.svelte                     (NEU: Hero-Landing, switcht zwischen home-beta + home-coming-soon)
│   │   ├── +page.server.ts                  (NEU: prerender = true, liefert phase + locale)
│   │   ├── explore/
│   │   │   ├── +page.svelte                 (MOVED from current root)
│   │   │   ├── +page.ts                     (MOVED from current root)
│   │   │   └── +page.server.ts              (NEU: Phase-1-Coming-Soon 503-Guard)
│   │   ├── _dev/ (unverändert)
│   │   ├── layer/[slug]/ (unverändert)
│   │   ├── lizenzen/ (unverändert)
│   │   └── methodik/ (unverändert)
├── lib/
│   ├── config/
│   │   ├── phase.ts                         (NEU)
│   │   └── phase.test.ts                    (NEU)
│   ├── components/
│   │   ├── atlas/
│   │   │   └── site-header.svelte           (UPDATE: atlasCtaHref-Prop)
│   │   └── home/                            (NEU, ganzes Verzeichnis)
│   │       ├── home-beta.svelte             (Orchestrator)
│   │       ├── home-coming-soon.svelte
│   │       ├── home-hero.svelte
│   │       ├── home-quick-links.svelte
│   │       ├── home-layer-teasers.svelte
│   │       ├── home-top-kieze.svelte
│   │       ├── home-featured-bezirke.svelte
│   │       ├── home-open-block.svelte
│   │       ├── home-faq-section.svelte
│   │       └── home-updates-teaser.svelte
│   ├── seo/
│   │   └── sources/
│   │       └── home-pages.ts                (NEU, wartet auf Story 2.1 SitemapSource-Type)
│   └── utils/
│       └── explore-href.ts                  (NEU, Locale-aware Href-Builder)
└── tests/e2e/
    └── home-landing.e2e.ts                  (NEU)
```

### Bestehende Re-Use-Punkte (MUST-Rule #3: Bestehende Funktionen prüfen)

- `src/lib/components/atlas/address-search.svelte` (variant `hero` ist schon implementiert, direkt importieren).
- `src/lib/components/atlas/site-header.svelte` (erweitern, nicht klonen).
- `src/lib/components/atlas/skip-link.svelte` (Bestand, sitzt im Root-Layout, kein Re-Tipp nötig).
- `src/lib/data/geocode.remote.ts` `geocodeAddress`-Query (Hero-Combobox konsumiert via dependency-injection-Prop wie aktuelle SiteHeader).
- `src/lib/paraglide/runtime.js` `getLocale`, `localizeHref`, `deLocalizeUrl` (Locale-Switch).
- `src/lib/data/constants.ts` `BERLIN_BBOX_ARRAY`, `BERLIN_CENTER`, `DEFAULT_ZOOM`.
- `src/lib/utils/viewport-from-url.ts` (von `/explore` weiter konsumiert).
- `src/lib/components/ui/animated-logo` (für Coming-Soon-Variante).

### MUST-Rules-Anwendung

- **#1 @lucide/svelte**: Lucide-Imports korrekt (kein lucide-svelte).
- **#2 Files <500 Zeilen**: `home-beta.svelte` als reiner Orchestrator + 9 Sub-Komponenten, jede sollte ≤300 LOC bleiben. Atlas-Move-File `/explore/+page.svelte` bleibt vorerst bei 988 LOC (Bestand). LOC-Refactor des Atlas-Files ist KEIN Scope von 2.11 (sonst Move + Refactor in einem PR = Review-Hölle). Eigene Folge-Story für Atlas-LOC-Split, siehe Open-Question 4.
- **#3 Bestehende Funktionen prüfen**: Re-Use-Liste oben.
- **#7 TypeScript strict**: Phase-Type-Union, kein `any`, Sitemap-Source-Type aus 2.1.
- **#8 Svelte-5-Runes**: `$props`, `$state`, `$derived`, `$effect` nur für echte Side-Effects.
- **#10 Cookieless**: KEIN `localStorage` in Hero-Page-Render. Bookmark-Lookup ist Atlas-Sache.
- **#11 Kein US-Drittanbieter**: keine externen Skripte/Fonts/CDNs.
- **#13 A11y-First**: bits-ui-Primitives für Combobox (Bestand), axe 0 Violations.
- **#14 i18n-First**: Hardcoded DE-Strings in 2.11 sind PRAGMATISCHER Workaround weil Paraglide-Setup-Reduce (Story 3.1) noch nicht gemerged ist. Pattern identisch zu Bestand (`meta-footer.svelte`, `methodik/+page.svelte`). Migration auf Paraglide-Messages in Story 3.2 + 2.12.
- **#21 prerender**: `/` prerendered, `/explore` bleibt SSR (Geocoder + URL-State-Sync).

### Cross-Story-Dependencies + Sequencing-Empfehlung

| Vorgänger-Story | Status | Auswirkung auf 2.11 |
|----------------|--------|---------------------|
| 2.0 | review | Top-Kieze + Bezirks-Featured konsumieren `kiez_score`/`bezirk_score`. Wenn nicht da, Placeholder. |
| 2.1 | review | `SeoHead` (`src/lib/components/atlas/seo-head.svelte`) + `SitemapSource`-Type + `ALL_SOURCES`-Registry sind im Repo. 2.11 importiert direkt. |
| 2.2 | review (Generators NICHT im Repo) | `JsonLd`-Komponente + `buildWebSite`/`buildAboutPage`/`buildBreadcrumbList` fehlen. 2.11 nutzt Inline-`<script type="application/ld+json">`-Pattern. |
| 2.3 | ready-for-dev | Bezirks-Pages als Link-Ziele. Wenn nicht da, Bezirks-Featured-Cards bleiben `<a href="/bezirk/[slug]">` (404 wenn Klick, akzeptabel bis 2.3 live). |
| 2.4 | ready-for-dev | Kiez-Pages als Link-Ziele. Analog 2.3. |
| 2.5a | ready-for-dev | Layer-Pages DE+EN. Layer-Teaser-Cards verlinken hin. |
| 2.5b | ready-for-dev | FAQ-Section. Hinter Feature-Flag `HOME_FAQ_ENABLED`. |
| 2.6 | ready-for-dev | OG-Image. Wenn nicht da, `og:image` zeigt Statisches Asset aus 2.12. |
| 2.9a | ready-for-dev | Top-Kieze-Daten. Hinter Feature-Flag oder Placeholder. |
| 2.9b | ready-for-dev | Ranking-Page als Link-Ziel. Analog 2.3. |
| 2.12 | ready-for-dev | Content + Screenshots. 2.11 baut die Slots mit Placeholders. |
| 2.13 | review (merged 2026-05-16) | `loadUpdatesFromModules` + `latestUpdates` exportiert, `UPDATES_PAGES_SOURCE` registriert. 2.11 KONSUMIERT direkt, KEIN Feature-Flag. UMGEKEHRTE Dependency: 2.13 wartet auf 2.11 `assertPhaseAllows('updates')`. |
| 3.1 + 3.2 | ready-for-dev / backlog | Paraglide-Coverage. 2.11 hardcoded DE+EN, refactor in 3.2. |
| 1.26 | done | Bookmark-Schema bleibt unverändert (kein Migration-Helper nötig). |

**Empfehlung Reihenfolge** (Stand 2026-05-16):
1. 2.1 + 2.13 sind bereits in `review`, 2.13 ist merged. 2.1-`SeoHead` und Sitemap-Source-Pattern direkt importierbar.
2. 2.11 jetzt (Wave 6 solo): liefert `phase.ts` + Hero-Slots. Atlas wandert auf `/explore`.
3. 2.2 (JSON-LD-Bib) parallel oder kurz danach: refactored Inline-JSON-LD aus 2.11 zu Generators.
4. 2.12 (Content + Screenshots) sequenziell hinter 2.11: befüllt Slots.
5. 2.13-Retrofit nach 2.11-Merge: `assertPhaseAllows('updates')` + `assertPhaseAllows('feeds')` in Updates-Routen + Feed-Endpoints einziehen.
6. Andere Konsumenten (2.3/2.4/2.5a/2.5b/2.6/2.9a/2.9b) können parallel laufen, Hero-Slots gracefully degraden.

### Phase-Switch Implementation-Skizze

```ts
// src/lib/config/phase.ts
import { error } from '@sveltejs/kit';

export type Phase = 'coming-soon' | 'beta' | 'hard';
export type GuardedRoute = 'explore' | 'updates' | 'feeds';

const VALID: ReadonlyArray<Phase> = ['coming-soon', 'beta', 'hard'];

// In Phase 1 (coming-soon) sind nur Brand + Compliance erreichbar.
const COMING_SOON_ALLOWLIST: ReadonlySet<GuardedRoute> = new Set();

export function getPhase(): Phase {
  const raw = (import.meta.env.NAVIGATOR_PHASE ?? 'beta') as string;
  return (VALID as readonly string[]).includes(raw) ? (raw as Phase) : 'beta';
}

export function assertPhaseAllows(route: GuardedRoute): void {
  if (getPhase() === 'coming-soon' && !COMING_SOON_ALLOWLIST.has(route)) {
    throw error(503, 'Coming soon');
  }
}
```

```ts
// src/routes/(with-header)/+page.server.ts
import { getPhase } from '$lib/config/phase.js';
export const prerender = true;
export const load = () => ({ phase: getPhase() });
```

```ts
// src/routes/(with-header)/explore/+page.server.ts
import { assertPhaseAllows } from '$lib/config/phase.js';
export const load = () => {
  assertPhaseAllows('explore');
};
```

**Konsumenten nach 2.11-Merge** (NICHT-Scope von 2.11, dokumentiert für Folge-PRs):
- `src/routes/(with-header)/updates/+page.server.ts`: `assertPhaseAllows('updates')` als erste Zeile in `load()`.
- `src/routes/updates/{rss.xml,atom.xml,feed.json}/+server.ts`: `assertPhaseAllows('feeds')` als erste Zeile in `GET()`.

### Performance-Begründung: Warum 50 KB statt 200 KB (NFR-P5)?

NFR-P5 erlaubt 200 KB für Landing. Story 2.11 zielt strenger auf 50 KB für `/`, weil:
- Hero hat KEIN MapLibre, KEIN LayerChart, KEIN Turf. Das sind die schweren Brocken (~150-180 KB gzipped zusammen).
- Übrig bleibt: SvelteKit-Runtime (~25 KB) + bits-ui-Combobox (~15 KB) + Paraglide-Stub (~3 KB) + Custom-Logic (~5 KB). Ergibt ~48 KB realistisch.
- Wenn Bundle bei 50-100 KB liegt, ist das immer noch NFR-konform. 50 KB ist Aspirations-Ziel, kein Hard-Gate. CI-Gate bleibt bei 200 KB-Limit. Hard-Gate in Story 4.3.

### Open-Questions vor Dev-Start

1. **Bookmark-Migration `bookmark-migrate-v2.ts`** (Epic-AC fordert es, Schema speichert aber keine URLs): EMPFEHLUNG = streichen. Bookmark-Schema in `src/lib/state/bookmark-schema.ts` speichert nur Koordinaten + Display-Metadaten. URL wird zur Laufzeit gebildet (in `+page.svelte` auf `/explore`). Migration-Helper wäre Premature-Abstraction (MUST-Rule #5). Falls Pre-Launch-Tests hardgepatchte Stale-URL-Strukturen im LocalStorage haben, würde der bestehende Valibot-Schema-Guard im `loadBookmarks()` sie bereits verwerfen. **Default-Decision**: AC-14 dokumentiert die Begründung, KEIN Migration-File. Bestätigung beim Dev-Start erfragen.

2. **Default-Viewport-Datei (Epic-AC fordert `src/lib/components/atlas/internal/default-viewport.ts`)**: Konstanten sind aktuell in `src/lib/data/constants.ts` zentralisiert (`BERLIN_BBOX_ARRAY`, `BERLIN_CENTER`, `DEFAULT_ZOOM`) und werden von 4+ Files konsumiert. Move zu `default-viewport.ts` würde 14+ Imports brechen. EMPFEHLUNG = Constants bleiben wo sie sind. Neue Datei `src/lib/components/atlas/internal/default-viewport.ts` ist optional als reiner Re-Export-Pointer mit Dokumentations-Kommentar, falls die symbolische Lokalität gewünscht ist. **Default-Decision**: Re-Export schreiben, nicht migrieren. Bestätigung beim Dev-Start erfragen.

3. **Hero-Combobox vs. Header-Combobox auf `/`** (AC-5): Layout-Wiring sieht aktuell vor, dass auf `/` der Header die Search collapsed zeigt (Icon-Button) und die Hero die volle Combobox. UX-Lock „ein Einstieg pro Page" wird so eingehalten. Falls User-Tests einen Doppel-Einstieg bevorzugen, wäre `searchCollapsed = false` einfacher 1-Liner-Switch. **Default-Decision**: `searchCollapsed = true` auf `/` (Hero dominiert), `searchCollapsed = false` auf `/explore` (Header dominiert).

4. **988-LOC-Atlas-File-Refactor** (MUST-Rule #2 Files <500 Zeilen): Story 2.11 verschiebt das File 1:1, ohne LOC-Cleanup. Atlas-File LOC-Split (Extract Compare-Logik, Map-Layer-Render-Pipeline, Marker-Pipeline in eigene Module) ist KEIN Scope von 2.11. **Default-Decision**: Eigene Folge-Story `1-32-atlas-page-loc-split` öffnen. Story 2.11 dokumentiert den Schuldenstand in Dev-Notes der Move-Datei.

5. **`NAVIGATOR_PHASE` ENV-Variable in Dev/Prod**: Default `beta` für lokale Entwicklung, `coming-soon` für initialen Hard-Launch-Domain. Stretch-Frage: soll Phase auch über URL-Query-Param `?phase=...` setzbar sein (für interne Preview)? EMPFEHLUNG = NEIN, weil Phase-Override-Surface die robots.txt-Disziplin schwächt. **Default-Decision**: Nur ENV-Variable, kein Query-Override.

### Stigma + Editorial-Disziplin

- Hero-Texte enthalten KEIN „lebenswert" und KEINE „Lebensqualität". Verweis zur Ranking-Page nutzt die Page-H1 „Wo lebt es sich gut?" als Link-Label (Memory `feedback_no_lebenswert.md` + `project_kiez_score_naming.md`).
- Top-Kieze-Liste enthält KEINEN Composite-Score auf Karte, KEINE „beste/schlechteste"-Sprache, KEINE Soziale-Lage-basierte Default-Sortierung. Übernommen aus Story 2.9b.
- Editorial-Disclaimer-Pflicht für Top-Kieze-Section: einzeiliger Plex-Sans `--text-xs` `--ink-subtle` Hinweis „Score ist statistisch, nicht normativ" (Re-use String aus Story 2.9b oder neue `editorial-config.ts`-Variante `home-top-kieze-disclaimer`).
- Keine em-dashes (U+2014) in UI-Strings (CLAUDE-Hard-Rule).

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L1367-L1468`
- Memory `project_atlas_explore_route.md`, `project_paraglide_reroute.md`, `project_server_purchase_sequencing.md`, `feedback_no_lebenswert.md`, `feedback_no_em_dashes.md`
- Bestand Atlas: `src/routes/(with-header)/+page.svelte`, `src/routes/(with-header)/+page.ts`
- Bestand Layout: `src/routes/(with-header)/+layout.svelte`, `src/routes/+layout.svelte`
- Bestand SiteHeader: `src/lib/components/atlas/site-header.svelte`
- Bestand Address-Search: `src/lib/components/atlas/address-search.svelte`
- Bestand Constants: `src/lib/data/constants.ts`
- Bestand Bookmarks: `src/lib/state/bookmark-schema.ts`, `src/lib/state/bookmark-store.ts`
- Paraglide-Setup: `src/hooks.ts`, `src/lib/paraglide/runtime.js`
- ADR-012 TDD-Mandat: `docs/adr/ADR-012-tdd-mandate.md`
- Story 2.0: `_bmad-output/implementation-artifacts/2-0-postgres-aggregat-foundation-drizzle-build-step.md`
- Story 2.1: `_bmad-output/implementation-artifacts/2-1-seo-foundation-sitemap-canonical-robots-txt.md`
- Story 2.2: `_bmad-output/implementation-artifacts/2-2-json-ld-generator-bibliothek.md`
- Story 2.12 (backlog): noch nicht als File angelegt, Inhalt aus Epic Z. 1470-1547.
- Story 2.13 (backlog): noch nicht als File angelegt, Inhalt aus Epic Z. 1549.

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
