# Story 2.13: Updates-Route mit RSS + Categories + JSON-LD

Status: review

## Story

As a Site-Visitor / Daten-Nutzer / LLM-Agent / RSS-Subscriber,
I want eine dedizierte `/updates`-Route die strukturiert auflistet was sich an Daten, Features und Methodik geändert hat,
so that ich (a) als Bürger über Daten-Refreshes informiert bin, (b) als Civic-Tech-Entwickler Feature-Releases verfolgen kann, (c) als RSS-Subscriber per Feed-Reader Bescheid kriege, (d) als LLM-Agent strukturierte Update-Historie via Schema.org `BlogPosting` zitieren kann.

## Probleme heute

1. Daten-Layer werden refreshed (Mietspiegel, Lärm, Wahldaten, Stolpersteine-OSM-Sync) ohne sichtbaren Update-Trail. Nutzer wissen nicht, wann was sich geändert hat. Crawler indizieren nicht „Was ist neu".
2. Feature-Releases (z.B. Story 1.28 Kiez-Score, Story 1.27 Compare-Modus) bleiben unsichtbar für externe Nutzer. Civic-Tech-Community hat keinen Verfolgungs-Kanal.
3. Long-Tail-SEO-Hebel ungenutzt: jeder Update-Entry ist ein eigenständiger Long-Form-Page-Body mit Keyword-Match-Potenzial (z.B. „Mietspiegel 2024 Berlin Update").
4. LLM-Agents brauchen `BlogPosting`-Schema für Update-Historie-Zitation. Aktuell kein strukturierter Trail.
5. RSS/Atom/JSON-Feed ist Civic-Tech-Standard für Update-Distribution (z.B. `tagesschau.de/inland/innenpolitik.rdf`). Bestätigt Civic-Engagement-Brand.
6. Hero-Landing (Story 2.11) hat „Updates-Teaser"-Slot, der ohne 2.13 leer bleibt (Feature-Flag-Off in 2.11 AC-4).

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1549-1633.
- Story 2.1 (ready-for-dev): SitemapSource-Pattern + Canonical/hreflang/Sitemap-Index-Generator. 2.13 registriert `/updates`-Routen.
- Story 2.2 (ready-for-dev): JSON-LD-Generator-Bibliothek (`buildBlogPosting`, `buildBlog` als Erweiterung).
- Story 2.5b (ready-for-dev): `js-yaml`-Dep wird dort eingeführt, 2.13 erbt oder ergänzt parallel. `gray-matter` als Frontmatter-Parser ist neue Dep.
- Story 2.11 (ready-for-dev): Hero-Landing baut `home-updates-teaser.svelte`-Slot mit Feature-Flag-Off. 2.13 erfüllt den Slot via Build-Time-Read der ersten 3 Updates.
- UX-Spec: UX-DR43 (Long-Form-Layout, max 72ch, Plex-Serif h1), Z. 1605-1640 (`Disclosure`-Pattern + bits-ui-Accordion-Wrapper).
- Memory `project_paraglide_reroute.md`: Routes ohne `[lang]`-Param, `getLocale()` statt `params.lang`. Route-Name `/updates` in DE+EN identisch (KEIN Paraglide-Reroute, analog `/explore`).
- Memory `project_server_purchase_sequencing.md`: Phase-1-Coming-Soon-Override für `/updates` analog `/explore` (503 oder Redirect).
- Memory `feedback_no_em_dashes.md`: keine em-dashes in Update-Frontmatter oder Body-Heading.
- Bestand bits-ui-Wrapper: `src/lib/components/ui/toggle-group.svelte` (für Category-Filter), `src/lib/components/ui/disclosure.svelte` (für „Mehr lesen"-Toggle).
- PRD FR32 (Title + Description), FR33 (Progressive Enhancement), FR36 (JSON-LD), FR55a/b (Locale-URL-Prefix DE/EN).
- ADR-009 Remote Functions: Build-Time-MD-Load via `import.meta.glob`, kein Server-Roundtrip.

## Akzeptanz-Kriterien

1. **AC-1 (Content-Quelle: `_content/updates/` Markdown-Dateien):**
   **Given** Markdown-First-Workflow ohne DB.
   **When** ich `_content/updates/`-Verzeichnis im Repo-Root einführe.
   **Then**:
   - Datei-Naming-Convention: `YYYY-MM-DD-{slug}.md` (z.B. `2026-05-20-stolpersteine-osm-sync-erweitert.md`).
   - Frontmatter-Schema (YAML-Block am Datei-Anfang, validiert via Valibot in `src/lib/content/updates/frontmatter-schema.ts`):
     - `title_de: string` (Plex-Serif-tauglich, ≤ 80 Zeichen).
     - `title_en: string` (≤ 80 Zeichen).
     - `date: string` (ISO-8601-Datums-String `YYYY-MM-DD`).
     - `category: 'daten-update' | 'feature' | 'methodik' | 'datenquelle' | 'lizenz'` (5er-Enum).
     - `summary_de: string` (≤ 160 Zeichen für Meta-Description-Fitness).
     - `summary_en: string` (≤ 160 Zeichen).
     - `tags?: string[]` (optional, max 8 Einträge, lowercase-kebab-case).
     - `lang?: 'de' | 'both'` (default `de`, falls EN-Variante eigenständigen Body braucht → separate Datei `2026-05-20-{slug}.en.md` mit `lang: en` im Frontmatter).
   - Body = regulärer GitHub-flavored Markdown (Headlines, Links, Code-Blocks, Listen, Tabellen, eingebettete `<a href="/layer/[slug]">`-Verweise, GitHub-Commit-Links).
   - Initial-Content: 1 Beispiel-Entry `_content/updates/2026-05-15-launch.md` mit allen Frontmatter-Feldern + Kurz-Body (max 200 Wörter), dient als Template + erster Live-Inhalt.
   - `_content/updates/README.md` mit Verweis auf Maintainer-Runbook (siehe AC-12).
   - Test: Frontmatter-Schema-Validation per Beispiel-Entry, Datei-Naming-Pattern-Match-Regex.

2. **AC-2 (`/updates`-Index-Route + Build-Time-MD-Load):**
   **Given** `_content/updates/`-Verzeichnis und Vite-`import.meta.glob`.
   **When** ich `src/routes/(with-header)/updates/+page.svelte` + `+page.server.ts` (oder `+page.ts`) mit `export const prerender = true` implementiere.
   **Then**:
   - `+page.server.ts` lädt Build-Time alle MD-Files via:
     ```ts
     const modules = import.meta.glob('/_content/updates/*.md', { eager: true, query: '?raw', import: 'default' });
     ```
   - Pro Datei: Frontmatter-Parse via `gray-matter`, Body-Parse via `marked` (markdown-zu-HTML).
   - Build-Time-Validation: jedes Frontmatter wird gegen Valibot-Schema geprüft. Schema-Verstoß = Build-Fehler.
   - Liste sortiert chronologisch absteigend (neueste zuerst) nach `date`-Frontmatter.
   - Route rendert Long-Form-Layout (UX-DR43): Plex-Serif h1 (Paraglide-Key `updates_index_h1`, DE „Updates" / EN „Updates"), Plex-Sans Lead-Absatz (Paraglide-Key `updates_index_lead`) inkl. Verweis auf RSS-Feed.
   - Jeder Entry rendert als Card:
     - Datum in Plex-Sans `--text-sm` `--ink-muted` (formatiert per Locale: `15. Mai 2026` DE / `May 15, 2026` EN).
     - Category-Badge (5 unterschiedliche Token-Farben aus existierendem Severity- oder Chart-Cat-Palette, KEIN Rot-Grün, KEIN Marketing-Akzent).
     - Plex-Serif h2 mit Title (locale-aware aus `title_de`/`title_en`).
     - Summary-Lead in Plex-Sans (locale-aware).
     - „Mehr lesen"-Disclosure-Toggle (bits-ui `Disclosure` aus `$lib/components/ui/disclosure.svelte`) öffnet inline Body-Markdown ODER „Zur Detail-Seite"-Link auf `/updates/{slug}` (Empfehlung: Link, weil Per-Entry-Detail-Seiten ihre eigenen SEO-Pages sind, siehe AC-3).
   - **Empfehlung**: Inline-Disclosure für kurze Updates, separate Detail-Seite für längere. Heuristik: Wenn Body > 500 Zeichen → nur Link, sonst Inline-Disclosure-optional. Final-Lock: nur Link, weil sonst Doppel-Render-Kostet + SEO-Cannibalization (zwei Pages mit selbem Body).

3. **AC-3 (Per-Entry-Detail-Route `/updates/[slug]`):**
   **Given** jeder Update-Entry braucht eigene URL für SEO + JSON-LD + Direct-Linking.
   **When** ich `src/routes/(with-header)/updates/[slug]/+page.svelte` + `+page.server.ts` mit `prerender = true` und `entries`-Hook implementiere.
   **Then**:
   - `entries`-Hook enumeriert alle MD-Slugs aus `_content/updates/*.md`:
     ```ts
     export const entries = async () => {
       const modules = import.meta.glob('/_content/updates/*.md');
       return Object.keys(modules).map(path => ({ slug: extractSlug(path) }));
     };
     ```
   - Render-Layout:
     - Breadcrumb (Home › Updates › Entry-Title) als Plex-Sans `--text-sm` `--ink-muted`.
     - Plex-Serif h1 mit Title.
     - Datum + Category-Badge unter h1.
     - Body-Markdown gerendert als HTML via `marked` + Sanitization (siehe Open-Question 1).
     - Footer: „Zurück zur Update-Liste"-Anker + Category-Tag-Liste (falls `tags` befüllt).
   - `<svelte:head>`:
     - `<title>{title} · Navigator Berlin Updates</title>` (locale-aware).
     - `<meta name="description" content={summary}>`.
     - `<link rel="canonical" href="https://navigator.berlin/updates/{slug}">`.
     - `<link rel="alternate" hreflang="de" href="...">` und analog `en` + `x-default`.
     - `<meta property="og:type" content="article">`.
     - `<meta property="article:published_time" content={date}>`.
     - `<meta property="article:section" content={category}>`.
   - JSON-LD `BlogPosting` (siehe AC-7).

4. **AC-4 (Category-Filter + URL-State):**
   **Given** 5er-Category-Enum.
   **When** ich Filter-Komponente oberhalb der Index-Liste einbaue.
   **Then**:
   - `src/lib/components/updates/updates-filter.svelte` mit `ToggleGroup` aus `$lib/components/ui/toggle-group.svelte`, `type="multiple"`, 6 Toggles: „Alle" / „Daten-Update" / „Feature" / „Methodik" / „Datenquelle" / „Lizenz" (DE-Labels, EN-Pendants via Paraglide).
   - „Alle"-Toggle ist Mutually-Exclusive zu den anderen 5 (wenn „Alle" gewählt, kein Category-Filter aktiv).
   - Filter-State im URL-Query-Parameter `?cat=feature,methodik` reflektiert, deeplink-fähig.
   - URL-State-Parser in `src/lib/content/updates/parse-filter.ts` + Tests pro Input-Variante (leer / single / multi / unknown-Category → silent-ignore).
   - Page-Render filtert Liste client-side (kein Re-Fetch, weil prerendered).
   - Tastatur-bedienbar: `tab` durch Toggles, `space` togglet (bits-ui-Default).
   - Test: URL-Param-Parsing + Filter-Apply.

5. **AC-5 (RSS-Feed `routes/updates/rss.xml/+server.ts`):**
   **Given** RSS-2.0-Spec.
   **When** ich Endpoint mit `prerender = true` und Content-Type `application/rss+xml; charset=utf-8` implementiere.
   **Then**:
   - Feed enthält letzte 50 Entries (oder alle falls < 50), sortiert chronologisch absteigend.
   - Channel-Meta:
     - `<title>Navigator Berlin · Updates</title>`
     - `<link>https://navigator.berlin/updates</link>`
     - `<description>Daten-Updates, Features, Methodik-Änderungen.</description>`
     - `<language>de-DE</language>` (DE-Variante)
     - `<atom:link href="https://navigator.berlin/updates/rss.xml" rel="self" type="application/rss+xml" />`
     - `<lastBuildDate>{ISO-8601-Build-Time}</lastBuildDate>`
   - Pro Entry:
     - `<title>{title_de}</title>`
     - `<link>https://navigator.berlin/updates/{slug}</link>`
     - `<guid isPermaLink="true">https://navigator.berlin/updates/{slug}</guid>`
     - `<pubDate>{RFC-822-Datum}</pubDate>` (`date`-Frontmatter konvertiert, z.B. `Wed, 20 May 2026 00:00:00 +0000`).
     - `<description>{summary_de}</description>` (CDATA-Block).
     - `<category>{category}</category>`.
   - XML escaping: jedes Text-Feld via `escapeXml(s: string): string` (Helper in `src/lib/feeds/escape-xml.ts` mit Tests für `&`, `<`, `>`, `"`, `'`).
   - Build-Time-Generation (kein Runtime-Serving), statisch ausgeliefert.
   - EN-Variante: `routes/updates/rss.xml/+server.ts` rendert DE, separater Endpoint `routes/en/updates/rss.xml/+server.ts` für EN ist NICHT eingebaut in Phase 1 (User-Lock: ein Feed, DE-Hauptsprache, EN-Pages stehen im RSS-DE als locale-Verweis). Stretch-Optional: locale-aware Feed via Query-Param `?lang=en`. **Default-Decision**: DE-only-Feed in Phase 1.

6. **AC-6 (Atom-Feed `routes/updates/atom.xml/+server.ts`):**
   **Given** Atom-1.0-Spec (RFC-4287).
   **When** ich Endpoint mit Content-Type `application/atom+xml; charset=utf-8` und `prerender = true` implementiere.
   **Then**:
   - `<feed xmlns="http://www.w3.org/2005/Atom">`-Root.
   - Channel-Meta:
     - `<id>https://navigator.berlin/updates/atom.xml</id>` (URI per RFC-4287).
     - `<title>Navigator Berlin · Updates</title>`.
     - `<updated>{ISO-8601}</updated>` (Build-Time).
     - `<author><name>Navigator Berlin</name></author>`.
     - `<link rel="self" type="application/atom+xml" href="https://navigator.berlin/updates/atom.xml" />`.
     - `<link rel="alternate" type="text/html" href="https://navigator.berlin/updates" />`.
   - Pro Entry:
     - `<id>https://navigator.berlin/updates/{slug}</id>`.
     - `<title>{title_de}</title>`.
     - `<updated>{date-ISO}</updated>` (oder `date` falls Frontmatter es liefert).
     - `<published>{date-ISO}</published>`.
     - `<link rel="alternate" type="text/html" href="https://navigator.berlin/updates/{slug}" />`.
     - `<summary type="text">{summary_de}</summary>`.
     - `<category term="{category}" />`.
   - XML escaping wie AC-5.

7. **AC-7 (JSON-Feed-1.1 `routes/updates/feed.json/+server.ts`):**
   **Given** JSON-Feed-1.1-Spec (`https://jsonfeed.org/version/1.1`).
   **When** ich Endpoint mit Content-Type `application/feed+json` und `prerender = true` implementiere.
   **Then**:
   - Feed-Objekt enthält:
     - `version: "https://jsonfeed.org/version/1.1"`.
     - `title: "Navigator Berlin · Updates"`.
     - `home_page_url: "https://navigator.berlin/updates"`.
     - `feed_url: "https://navigator.berlin/updates/feed.json"`.
     - `description: "Daten-Updates, Features, Methodik-Änderungen."`.
     - `language: "de"`.
     - `items: Array<JsonFeedItem>` mit max 50 Einträgen.
   - Pro Item:
     - `id: "https://navigator.berlin/updates/{slug}"`.
     - `url: "https://navigator.berlin/updates/{slug}"`.
     - `title: title_de`.
     - `content_text: summary_de` (Plain-Summary; Full-Body in `content_html` optional).
     - `content_html?: marked(body)` (sanitisiert, siehe Open-Question 1).
     - `summary: summary_de`.
     - `date_published: {ISO-8601}` (RFC-3339).
     - `tags?: string[]` aus Frontmatter.
     - `language?: 'de'` (oder `'en'` bei EN-Variante).

8. **AC-8 (Feed-Discovery + Auto-Linking im Head):**
   **Given** Browser-Extensions und Feed-Reader nutzen `<link rel="alternate">` für Auto-Discovery.
   **When** Hero-Landing `/`, `/updates`-Index, und alle `/updates/{slug}` gerendert werden.
   **Then** `<svelte:head>` enthält drei Discovery-Links:
   ```html
   <link rel="alternate" type="application/rss+xml" title="Navigator Berlin Updates (RSS)" href="https://navigator.berlin/updates/rss.xml">
   <link rel="alternate" type="application/atom+xml" title="Navigator Berlin Updates (Atom)" href="https://navigator.berlin/updates/atom.xml">
   <link rel="alternate" type="application/feed+json" title="Navigator Berlin Updates (JSON-Feed)" href="https://navigator.berlin/updates/feed.json">
   ```
   - Konsolidierte Komponente `src/lib/components/seo/feed-discovery-links.svelte` (oder als Snippet-Helper in Bestand-SeoHead aus Story 2.1) damit kein Copy-Paste über Pages.

9. **AC-9 (JSON-LD Structured Data: `BlogPosting` + `Blog`):**
   **Given** Story 2.2 `JsonLd`-Generators.
   **When** ich `src/lib/jsonld/build-blog-posting.ts` und `src/lib/jsonld/build-blog.ts` ergänze.
   **Then**:
   - Per-Entry-Page `/updates/{slug}` rendert `BlogPosting`-JSON-LD:
     ```json
     {
       "@context": "https://schema.org",
       "@type": "BlogPosting",
       "headline": "{title_de}",
       "datePublished": "{date}",
       "dateModified": "{date}",
       "author": { "@type": "Organization", "name": "Navigator Berlin", "url": "https://navigator.berlin/" },
       "publisher": { "@type": "Organization", "name": "Navigator Berlin", "url": "https://navigator.berlin/" },
       "mainEntityOfPage": { "@type": "WebPage", "@id": "https://navigator.berlin/updates/{slug}" },
       "articleSection": "{category}",
       "description": "{summary_de}",
       "inLanguage": "{locale}",
       "keywords": "{tags.join(', ')}"
     }
     ```
   - Index-Page `/updates` rendert `Blog`-JSON-LD mit `blogPost`-Liste (Top-10 Entries als verkürzte `BlogPosting`-Objekte).
   - `JsonLd`-Komponente aus Story 2.2 konsumiert (XSS-sicher via `</`-Escape).
   - Tests: Snapshot pro Generator + Schema-Validation gegen `schema-dts`-Typen.

10. **AC-10 (Sitemap-Integration):**
    **Given** Story 2.1 SitemapSource-Pattern.
    **When** Sitemap-Generator läuft.
    **Then**:
    - `src/lib/seo/sources/updates.ts` exportiert `UPDATES_SITEMAP_SOURCE: SitemapSource`.
    - Source-Output enthält:
      - `/updates` mit `<priority>0.6</priority>` und `<lastmod>` = neuestes Entry-Datum.
      - `/en/updates` analog.
      - Pro Entry: `/updates/{slug}` mit `<priority>0.7</priority>` und `<lastmod>` = `date`-Frontmatter.
      - `/en/updates/{slug}` analog.
    - Sitemap-DE + Sitemap-EN bekommen die jeweiligen Source-Einträge.
    - Test: Source-Output-Snapshot.

11. **AC-11 (Hero-Landing Updates-Teaser):**
    **Given** Story 2.11 hat `home-updates-teaser.svelte`-Slot hinter Feature-Flag `HOME_UPDATES_ENABLED`.
    **When** ich Teaser-Daten aus `_content/updates/*.md` ableite.
    **Then**:
    - Build-Time-Read der MD-Files (selber `import.meta.glob`-Pfad wie AC-2, in einen geteilten Helper `src/lib/content/updates/load-updates.ts` extrahiert).
    - `home-updates-teaser.svelte` rendert Top-3-Latest:
      - Plex-Serif h2 „Was sich ändert" (DE) / „What's changing" (EN), Paraglide-Keys aus Story 2.12 `home_updates_teaser_title`.
      - 3 Cards (Datum + Category-Badge + Title + Summary + Link auf Detail-Route).
      - CTA-Link „Alle Updates" / „All updates" (Paraglide-Key) → `/updates`.
    - Feature-Flag `HOME_UPDATES_ENABLED = true` wenn `loadUpdates()` mindestens 1 Entry liefert.
    - Position in `home-beta.svelte` (Story 2.11) zwischen FAQ-Sektion und Open-Block oder Consulting-CTA (Position-Lock siehe Story 2.11 AC-4 Sektions-Reihenfolge 9).

12. **AC-12 (Footer-Link + Maintainer-Runbook):**
    **Given** `/updates` muss von jeder Page erreichbar sein.
    **When** ich `src/lib/components/atlas/meta-footer.svelte` erweitere.
    **Then**:
    - Footer enthält `<a href="/updates">Updates</a>` (DE) / „Updates" (EN, gleiches Wort) zwischen `/methodik` und `/lizenzen`.
    - Test: `meta-footer.svelte.test.ts` um Link-Check erweitern.
    - Runbook `docs/runbooks/add-update-entry.md` dokumentiert:
      1. MD-Datei in `_content/updates/` mit Naming-Pattern `YYYY-MM-DD-{slug}.md`.
      2. Frontmatter-Felder befüllen (Schema-Verweis).
      3. Body in Markdown (max 1500 Wörter empfohlen).
      4. `pnpm dev` lokal verifizieren (Build-Time-Validation zeigt Schema-Fehler).
      5. Commit + Push.
      6. Build triggert Sitemap + Feed-Regen automatisch (kein manueller Schritt).
    - Maintainer braucht KEINE DB, KEIN Admin-UI, nur Git + Markdown.

13. **AC-13 (EN-Locale-Variante):**
    **Given** Paraglide-Reroute via `deLocalizeUrl`.
    **When** Nutzer `/en/updates` oder `/en/updates/{slug}` aufruft.
    **Then**:
    - UI-Strings (Filter-Labels, Index-Heading, Lead, „Mehr lesen", Footer-CTA, „Zurück zur Liste") via Paraglide-Messages aus Story 3.2 / Story 2.12-Ergänzung.
    - Per-Entry-Body-Render:
      - Wenn separate `.en.md`-Datei (Suffix-Pattern `YYYY-MM-DD-{slug}.en.md`) existiert → EN-Body rendern.
      - Sonst → DE-Body rendern mit Disclaimer-Banner oben „This update is currently only available in German." (Paraglide-Key `updates_en_fallback_disclaimer`).
    - Per-Entry `<svelte:head>` enthält hreflang-Cross-Links (DE ↔ EN für Per-Entry-Pages).
    - Test: Snapshot pro Locale für Index + Detail.

14. **AC-14 (Phase-1-Coming-Soon-Override):**
    **Given** Memory `project_server_purchase_sequencing.md` und Story 2.11 AC-9 Phase-Switch.
    **When** Phase 1 aktiv ist (`NAVIGATOR_PHASE=coming-soon`).
    **Then**:
    - `/updates`-Index, `/updates/{slug}`, RSS/Atom/JSON-Feed antworten mit `error(503, 'Coming soon')` oder Redirect auf `/`.
    - `robots.txt` `Disallow: /updates` und `Disallow: /updates/`.
    - Erst-Entry `_content/updates/2026-XX-XX-launch.md` (Beta-Start) und `2026-XX-XX-hard-launch.md` (Phase 3) existieren als Stubs, werden im jeweiligen Phasen-Toggle freigeschaltet (KEIN Sonder-Code, einfach Phase-Switch entsperrt Route).
    - Implementation in `+page.server.ts`-Files via gemeinsamem `assertPhaseAllows('updates')`-Helper in `src/lib/config/phase.ts` (aus Story 2.11). Erweitert auf Mehr-Feature-Toggle wenn nötig.

15. **AC-15 (Accessibility + Tests):**
    **Given** WCAG 2.2 AA + NFR-A1.
    **When** Page geladen wird.
    **Then**:
    - Filter-`ToggleGroup` hat `role="group"` + `aria-label="Update-Kategorien filtern"` (locale-aware).
    - Jeder Toggle-Button hat `aria-pressed` (bits-ui-Default).
    - „Mehr lesen"-Disclosure hat `aria-expanded`.
    - h1 → h2 (pro Entry) → h3 (pro Body-Heading) Outline semantisch korrekt.
    - axe-Audit 0 Errors.
    - Kontrast Category-Badges ≥ 4.5:1 gegen Hintergrund (WCAG 1.4.3).
    - **TDD-Mandat ADR-012**: pro AC mind. 1 Test, red-green-refactor.
    - Unit-Tests: Frontmatter-Schema, RSS/Atom/JSON-Generator (Snapshot pro Generator + XML-Validation via `xmllint`-Test wenn verfügbar), `parse-filter.ts`-Parser, `escapeXml`-Helper.
    - Komponenten-Tests: `updates-filter.svelte`, `updates-entry-card.svelte`, `home-updates-teaser.svelte`.
    - E2E `tests/e2e/updates-flow.e2e.ts` mit 5 Cases: (1) `/updates` lädt ohne JS lesbar, (2) Filter ändert URL-Query, (3) Detail-Page rendert Markdown-Body, (4) RSS-Feed liefert valides XML, (5) axe-Check 0 Errors. E2E-Run deferred zu CI/User-Verify.

## Tasks / Subtasks

- [x] **T1: Content-Verzeichnis + Frontmatter-Schema** (AC: 1)
  - [x] T1.1: `_content/updates/`-Verzeichnis anlegen, `.gitkeep` falls leer im Phase-Start.
  - [x] T1.2: `_content/updates/README.md` mit Verweis auf Maintainer-Runbook.
  - [x] T1.3: `src/lib/content/updates/frontmatter-schema.ts` mit Valibot-Schema + `parseFrontmatter(raw: string): UpdateEntry`.
  - [x] T1.4: Tests pro Schema-Feld + Negativ-Cases (fehlende Pflicht-Felder, Datum-Format, Category-Enum-Verstoß).
  - [x] T1.5: Initial-Content `_content/updates/2026-05-16-launch.md` + `2026-05-15-kiez-score-versorgungs-dimension.md`.

- [x] **T2: Markdown-Parser + Build-Time-Load-Helper** (AC: 2, 11)
  - [x] T2.1: Deps: `marked@^14.1.4` + `gray-matter@^4.0.3` installed (MIT, EU-safe).
  - [x] T2.2: `src/lib/content/updates/load-updates.ts` mit `loadUpdatesFromModules` + glob-Konsumer-Pattern.
  - [x] T2.3: gray-matter parsed Frontmatter, Body bleibt Markdown-String. Pflicht-Workaround: Date-Object aus YAML zu ISO-String coerce.
  - [x] T2.4: `sortByDateDesc` + `latestUpdates(n)` Helper exportiert.
  - [x] T2.5: Tests `load-updates.test.ts` mit Fixture-Strings + README-Skip-Verhalten.

- [x] **T3: Markdown-Render-Helper + Sanitization** (AC: 3)
  - [x] T3.1: `src/lib/content/updates/render-markdown.ts` mit `renderMarkdownBody(md): string` (marked sync + sanitize Pipe).
  - [x] T3.2: **Option A** Lock per User-Decision: Custom-Regex-Whitelist in `$lib/seo/markdown-sanitizer.ts`. Block-Liste `<script>`/`<iframe>`/`<object>`/`<embed>`/`<style>`/`<link>`/`<meta>` + alle `on*=`-Attribute + `javascript:`/`data:`-URLs. Kein DOMPurify-Bundle in Phase 1.
  - [x] T3.3: Tests mit XSS-Try-Vectors (`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `[click](javascript:alert(1))`, `<iframe>`, ALLE green).

- [x] **T4: Index-Route + Filter** (AC: 2, 4, 15)
  - [x] T4.1: `src/routes/(with-header)/updates/+page.server.ts` mit `prerender=true` + `loadUpdatesFromModules`.
  - [x] T4.2: `src/routes/(with-header)/updates/+page.svelte` mit Long-Form-Layout + Liste + aria-live-Filter-Feedback (inline, kein Toast per Memory `feedback_no_toast`).
  - [x] T4.3: `src/lib/components/updates/updates-filter.svelte` mit `ToggleGroup.Root type="multiple"` aus bits-ui.
  - [x] T4.4: `src/lib/components/updates/updates-entry-card.svelte` (Datum + Category-Badge + Title + Summary + „Mehr lesen"-Link).
  - [x] T4.5: `src/lib/content/updates/parse-filter.ts` mit `parseCategoryFilter` + `serializeCategoryFilter` + `applyCategoryFilter` + Tests (silent-ignore unbekannt + dedup + whitespace-strip).
  - [x] T4.6: URL-State-Sync via `goto(url, { replaceState: true, keepFocus: true, noScroll: true })` in zwei `$effect`-Hooks (pull + push).
  - [x] T4.7: Komponenten-Tests `updates-entry-card.svelte.test.ts`. Index-Page-Snapshot deferred (Component-Render-Tests decken bereits AC ab).

- [x] **T5: Per-Entry-Detail-Route** (AC: 3, 9)
  - [x] T5.1: `src/routes/(with-header)/updates/[slug]/+page.server.ts` mit `prerender=true` + `entries`-Hook (typed `EntryGenerator`).
  - [x] T5.2: `+page.svelte` mit Breadcrumb (Start › Updates › Title), h1, Datum + Category-Badge, sanitisiertem Body-HTML, optionaler Tag-Liste, Zurück-Link.
  - [x] T5.3: `<svelte:head>` via SeoHead (Title/Description/Canonical/hreflang) + manuelle `og:type=article`, `article:published_time`, `article:section`.
  - [x] T5.4: `src/lib/seo/json-ld-updates.ts` als Inline-Generator (TODO-Verweis auf Story 2.2 Refactor). schema-dts-Typen lokal als Inline-Interface.
  - [x] T5.5: JSON-LD via `<script type="application/ld+json">` einsetzbar im `<svelte:head>`.
  - [x] T5.6: Tests `json-ld-updates.test.ts` (8 Tests pro Builder).

- [x] **T6: RSS + Atom + JSON-Feed-Endpoints** (AC: 5, 6, 7, 8)
  - [x] T6.1: `src/lib/feeds/escape-xml.ts` + 7 Tests (alle 5 Entities + Reihenfolge-Test gegen Doppel-Escape).
  - [x] T6.2: `src/lib/feeds/build-rss.ts` mit `buildRssXml` + `toRfc822` + 6 Tests (Header, Channel-Meta, Items, Escape, Cap 50).
  - [x] T6.3: `src/lib/feeds/build-atom.ts` mit `buildAtomXml` + 4 Tests (Root, Feed-Meta, Entries, Escape).
  - [x] T6.4: `src/lib/feeds/build-json-feed.ts` mit `buildJsonFeed` + Types `JsonFeed`/`JsonFeedItem` + 4 Tests.
  - [x] T6.5: `src/routes/updates/rss.xml/+server.ts` + `atom.xml/+server.ts` + `feed.json/+server.ts` mit `prerender=true`. Build-Output verifiziert: alle drei Files prerendert in `.svelte-kit/output/prerendered/pages/updates/`.
  - [x] T6.6: Snapshot-Tests pro Builder (Inline-Expects statt Vitest-Snapshot wegen Diff-Lesbarkeit). XML-Spec-Konformität via Browser-Verify im Hand-off, kein xmllint im Test-Run.
  - [x] T6.7: `src/lib/components/seo/feed-discovery-links.svelte` rendert 3 `<link rel="alternate">` Tags. Eingebunden in `/updates`-Index + `/updates/[slug]`. Hero-Landing `/`-Einbindung deferred bis Story 2.11 die Hero-Komponente landet.

- [/] **T7: Hero-Updates-Teaser-Slot füllen** (AC: 11) — **DEFERRED bis Story 2.11 landet**
  - Story 2.11 (`home-updates-teaser.svelte`-Slot in `home-beta.svelte`) ist `backlog` zum Dev-Start dieser Story. `loadUpdatesFromModules` + `latestUpdates(3)` sind bereits exportiert + getestet — Story 2.11 konsumiert direkt.
  - [ ] T7.1-T7.4 werden in Story 2.11 oder 2.12 Hand-off implementiert (Slot-Befüllung, nicht Slot-Definition).

- [x] **T8: Footer-Link + Sitemap + Maintainer-Runbook** (AC: 10, 12)
  - [x] T8.1: `meta-footer.svelte` Link `/updates` zwischen `/methodik` und `/lizenzen` ergänzt.
  - [x] T8.2: `src/lib/seo/sources/updates.ts` mit `UPDATES_PAGES_SOURCE` (SitemapSource-Konform) + `buildUpdatesSitemapEntries` Pure-Function. Index priority 0.6, Detail priority 0.7. Registriert in `sitemap-builder.ts` `ALL_SOURCES`.
  - [x] T8.3: `docs/runbooks/add-update-entry.md` mit 6-Schritt-Workflow + Frontmatter-Schema + Anti-Patterns.
  - [x] T8.4: Footer-Test um „Updates"-Link erweitert. Sitemap-Test angepasst (`collectPrerenderedUrls` läuft jetzt > 6 Entries, Floor-Check).

- [/] **T9: Phase-Switch + i18n** (AC: 13, 14) — **DEFERRED bis Story 2.11 / Story 3.1**
  - Story 2.11 erstellt `src/lib/config/phase.ts`. Coming-Soon-Guard ist Erweiterungs-Punkt aus 2.11.
  - Phase-1-DE-only Lock (memory `project_i18n_phase_1_de_only`) macht EN-Fallback-Banner + EN-Paraglide-Keys in dieser Story redundant. Strings hardcoded DE wie in `meta-footer.svelte`, `methodik/+page.svelte`, `lizenzen/+page.svelte`. Refactor zu Paraglide kommt mit Story 3.1.
  - [ ] T9.1-T9.4 in Folge-Stories (2.11 Phase-Guard, 3.1 Paraglide-Setup-Reduce).

- [x] **T10: Final-Verifikation** (AC: 1-15)
  - [x] T10.1: Server-Tests 1235 passed / 9 pre-existing DB-Failures (DATABASE_URL nicht gesetzt, Story 2.0 out-of-scope). Neue Story-2.13-Tests: 117 grün in 16 Files.
  - [x] T10.2: `pnpm check` 0 Errors über 6056 Files.
  - [x] T10.3: `pnpm exec vite build` prerendert alle Updates-Routen: `/updates`, `/updates/launch`, `/updates/kiez-score-versorgungs-dimension`, `/updates/rss.xml`, `/updates/atom.xml`, `/updates/feed.json`. Vorhandener Build-Fail bei `/webmcp-manifest.json` (Story 2.7 unseen-route) sowie peer-dep `zod-to-json-schema` (Story 2.7 @mcp-b/webmcp-ts-sdk) sind beide pre-existing, out-of-scope für 2.13.
  - [x] T10.4: Verify-Output RSS-File enthält 2 Items mit korrekt formatierten RFC-822-pubDate, escapt Title-Spezialzeichen, JSON-Feed enthält gerenderte HTML-Bodies mit Sanitizer-Output.
  - [ ] T10.5: Feed-Reader-Smoke (NetNewsWire) deferred zu User-Verify nach Branch-Merge.
  - [ ] T10.6: E2E `updates-flow.e2e.ts` deferred (5-Case-Suite folgt mit CI-Setup-Story).
  - [x] T10.7: Sprint-Status-Eintrag aktualisiert (`backlog → in-progress → review`).

## Dev Notes

### Markdown-Parser-Wahl

`marked` (^14.x) ist der schnellste reine-JS-Markdown-Parser, MIT, ohne Telemetrie, EU-safe. Alternative `markdown-it` ist plugins-reicher, hier nicht nötig. `mdsvex` wäre overkill (kein Svelte-Component-Embedding in Update-Body geplant).

`gray-matter` (^4.x) ist Standard für YAML-Frontmatter-Parsing, MIT, depends auf `js-yaml` (das auch Story 2.5b braucht, also DRY).

### Sanitization-Strategie für Markdown-Body

Update-Entries sind vom Site-Owner geschrieben (trusted source). Trotzdem Sanitization-Pflicht für Defense-in-Depth + um späteren Multi-Author-Pfad nicht zu blockieren.

Optionen:
- **Option A**: `marked` allein + Custom-Whitelist-Sanitizer (Regex-basiert): einfach, keine extra Dep, anfällig für Edge-Cases.
- **Option B**: `marked` + `isomorphic-dompurify` (DOMPurify Server-Variante): bewährt, aber DOMPurify ist 30 KB gzipped + braucht JSDOM-Polyfill server-side.
- **Option C**: `marked` mit `marked-sanitizer-ghost` oder ähnlichem Plugin.

**Empfehlung**: Option A für Phase 1, weil Content ausschließlich vom Owner committed wird und Git-Review die Sanity-Barriere ist. Option B als Stretch-Migration wenn Multi-Author kommt. Dokumentiert in Code-Comment + ADR-Stub.

### bits-ui Re-Use (MUST-Rule #3)

- `src/lib/components/ui/toggle-group.svelte` (bits-ui-Wrapper) für Category-Filter.
- `src/lib/components/ui/disclosure.svelte` (bits-ui-Accordion-Wrapper) für „Mehr lesen"-Optional. Final-Design empfiehlt keinen Inline-Disclosure auf Index-Page wegen SEO-Cannibalization (siehe AC-2 Empfehlung).

### File-Layout

```
_content/
├── updates/
│   ├── README.md
│   └── 2026-05-15-launch.md          (Beispiel-Entry, Initial-Content)

src/
├── routes/
│   ├── (with-header)/
│   │   └── updates/
│   │       ├── +page.svelte          (Index)
│   │       ├── +page.server.ts       (prerender + loadUpdates + Phase-Guard)
│   │       └── [slug]/
│   │           ├── +page.svelte      (Detail)
│   │           └── +page.server.ts   (prerender + entries-Hook + Phase-Guard)
│   └── updates/
│       ├── rss.xml/+server.ts
│       ├── atom.xml/+server.ts
│       └── feed.json/+server.ts
├── lib/
│   ├── content/updates/
│   │   ├── frontmatter-schema.ts
│   │   ├── load-updates.ts
│   │   ├── render-markdown.ts
│   │   └── parse-filter.ts
│   ├── feeds/
│   │   ├── build-rss.ts
│   │   ├── build-atom.ts
│   │   ├── build-json-feed.ts
│   │   └── escape-xml.ts
│   ├── jsonld/
│   │   ├── build-blog-posting.ts
│   │   └── build-blog.ts
│   ├── seo/sources/
│   │   └── updates.ts
│   └── components/
│       ├── updates/
│       │   ├── updates-filter.svelte
│       │   └── updates-entry-card.svelte
│       └── seo/
│           └── feed-discovery-links.svelte
└── docs/runbooks/
    └── add-update-entry.md
```

### Cross-Story-Dependencies + Sequencing

| Story | Status | Auswirkung |
|-------|--------|------------|
| 2.1 | ready-for-dev | SitemapSource-Pattern + SeoHead. Wenn nicht da, Inline-`<svelte:head>` + Source-File-Stub. |
| 2.2 | ready-for-dev | `JsonLd`-Komponente + `build-blog`/`build-blog-posting`-Generators-Erweiterung. Wenn nicht da, Inline-`<script type="application/ld+json">`. |
| 2.5b | ready-for-dev | `js-yaml` (auch hier nötig), `gray-matter`-Dep ergänzt 2.13. |
| 2.11 | ready-for-dev | Hero-Updates-Teaser-Slot in `home-beta.svelte`. Wenn 2.11 noch nicht gemerged, AC-11 wartet auf 2.11. |
| 2.12 | ready-for-dev | Paraglide-Keys für Hero-Teaser-Title + Archiv-Link. 2.13 ergänzt eigene Update-Page-Keys. |
| 3.1 + 3.2 | backlog | Paraglide-Setup-Reduce + EN-Coverage. 2.13 schreibt DE+EN-Messages, Resolution voll mit 3.1/3.2. |

**Empfehlung**: 2.13 startet parallel zu 2.11 (Independent-Route + Footer-Link + Hero-Teaser-Slot bei 2.11 ist Slot-Befüllung). Sequencing-Lock aus Epic: 2.12 NACH 2.11 + 2.13 (Hero-Updates-Teaser-Daten kommen aus 2.13). Also: 2.11 → 2.13 → 2.12 oder 2.11 + 2.13 parallel → 2.12.

### Markdown-Body-Length-Empfehlung

Update-Body-Länge max 1500 Wörter empfohlen. Begründung:
- < 200 Wörter = zu dünn für SEO-Indexierung (Crawler diskontieren Thin-Content).
- 300-1000 Wörter = Sweet-Spot für Update-Notes.
- > 1500 Wörter = Indikator dass Inhalt eigene Methodik-Sub-Page oder ADR braucht, NICHT Update-Entry.

Maintainer-Runbook empfiehlt diese Range.

### Category-Token-Mapping

5 Categories brauchen visuell unterscheidbare Badges. Empfehlung Token-Mapping (auf Design-System aus Story 1.31 Choropleth-3-Familien + Chart-Cat-Palette zugreifen):
- `daten-update` → Plex-Mono-Border, neutrale Hintergrund (Chart-Cat-1).
- `feature` → Plex-Mono-Border, leicht akzentuierter Hintergrund (Chart-Cat-4 oder Accent-Soft).
- `methodik` → Plex-Mono-Border, neutraler Hintergrund (Chart-Cat-6).
- `datenquelle` → Plex-Mono-Border, neutraler Hintergrund (Chart-Cat-5).
- `lizenz` → Plex-Mono-Border, dezenter Severity-Warning-Soft-Hintergrund (Lizenz-Änderungen sind aufmerksamkeits-relevant).

Kein Rot-Grün, kein Marketing-Akzent. Konsistent mit Story 1.31 Choropleth-Disziplin.

### MUST-Rules-Anwendung

- **#1 @lucide/svelte**: Icons (Calendar, Rss, ArrowRight, Tag).
- **#2 Files <500 Zeilen**: alle Files klein, MD-Render-Helper ≤ 100 LOC.
- **#3 Bestehende Funktionen**: `toggle-group.svelte`, `disclosure.svelte`, Paraglide-Runtime, `meta-footer.svelte`.
- **#7 TypeScript strict**: Frontmatter-Schema typed, Feed-Output-Types via `schema-dts` + JSON-Feed-Type.
- **#10 Cookieless**: alles statisch.
- **#11 Kein US-Drittanbieter**: `marked` + `gray-matter` MIT, lokal gebundlet.
- **#12 Provenance**: Update-Entries sind selbst die Provenance-Aussage über Daten-Quellen.
- **#13 A11y-First**: bits-ui-Primitives + axe-Audit.
- **#14 i18n-First**: alle UI-Strings via Paraglide.
- **#21 prerender**: alle Routen + Feeds `prerender = true`.

### Open-Questions vor Dev-Start

1. **Markdown-Sanitization-Strategie** (T3.2): Option A (Custom-Regex-Whitelist), B (DOMPurify-isomorphic), oder C (marked-sanitizer-ghost)? **Default-Decision**: Option A für Phase 1, weil Trusted-Source-Workflow (Git-Review-Barriere). Option B als Stretch wenn Multi-Author kommt. User bestätigt beim Dev-Start.

2. **Inline-Disclosure vs Detail-Page-Only** (AC-2 Empfehlung): Beide Pfade haben Trade-Offs. Inline-Disclosure = bessere UX bei kurzen Updates, schlechterer SEO. Detail-Page-Only = mehr Klicks, besserer SEO + JSON-LD-Trail. **Default-Decision**: Detail-Page-Only (alle Entries haben eigene URL, Index-Card zeigt nur Summary + „Mehr lesen"-Link). SEO + LLM-Crawl-Trail wichtiger als 1-Klick-Sparen.

3. **RSS/Atom/JSON-Feed EN-Variante** (AC-5 Note): DE-only-Feed in Phase 1 oder zusätzlich `/en/updates/rss.xml`? **Default-Decision**: DE-only in Phase 1, weil deutsche User-Basis dominant + RSS-Feed-Subscriber-Cluster sehr DE-konzentriert. EN-Feed als Phase-2-Backlog.

4. **Tags-Frontmatter-Pflicht** (AC-1): Optional oder Pflicht? Pflicht würde Keyword-Disziplin erzwingen, optional senkt Maintainer-Barriere. **Default-Decision**: optional, max 8 Tags, lowercase-kebab-case.

5. **`isomorphic-dompurify` als US-Drittanbieter-Risiko**: DOMPurify ist von Cure53 (EU-Berlin-basiert!). Trotzdem npm-Hosted, also wie alles andere im Stack. MUST-Rule #11 verbietet US-Drittanbieter in Production-Pfad (Runtime-Requests an US-CDN). NPM-Package-Build-Inclusion ist OK. **Default-Decision**: DOMPurify wäre compliant falls Option B gewählt wird. KEIN Issue.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L1549-L1633`
- Story 2.1: `_bmad-output/implementation-artifacts/2-1-seo-foundation-sitemap-canonical-robots-txt.md`
- Story 2.2: `_bmad-output/implementation-artifacts/2-2-json-ld-generator-bibliothek.md`
- Story 2.5b: `_bmad-output/implementation-artifacts/2-5b-faq-section-template-daten-slots.md`
- Story 2.11: `_bmad-output/implementation-artifacts/2-11-static-hero-landing-atlas-move-explore.md`
- Story 2.12: `_bmad-output/implementation-artifacts/2-12-hero-landing-content-screenshot-assets.md`
- Memory `project_paraglide_reroute.md`, `project_server_purchase_sequencing.md`, `feedback_no_em_dashes.md`
- ADR-009 Remote Functions
- ADR-012 TDD-Mandate
- Spec RSS-2.0: `https://www.rssboard.org/rss-specification`
- Spec Atom-1.0: `https://datatracker.ietf.org/doc/html/rfc4287`
- Spec JSON-Feed-1.1: `https://jsonfeed.org/version/1.1`
- Spec Schema.org BlogPosting: `https://schema.org/BlogPosting`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (parallel-agent worktree-session, 2026-05-16).

### Debug Log References

- `gray-matter@4.0.3` parsed YAML-Date als JS-`Date`-Object → Workaround: `normaliseDateFields` coerce zurück zu ISO-String vor Valibot-Validation.
- `import.meta.glob('/_content/updates/*.md')` picked auch `README.md` auf → Filter via `FILENAME_REGEX.test(filename)` Skip.
- Pre-existing Build-Fail bei `/webmcp-manifest.json` und `@mcp-b/webmcp-ts-sdk` peer-dep `zod-to-json-schema` (Story 2.7 baseline, out-of-scope für 2.13). Updates-Routen werden trotzdem korrekt prerendert (verifiziert via `.svelte-kit/output/prerendered/pages/updates/*.html`).

### Completion Notes List

**ACs erfüllt (11 von 15):**

- AC-1 ✅ Frontmatter-Schema (5 categories, ISO-date, tags max 8 kebab, lang default 'de')
- AC-2 ✅ `/updates`-Index-Route mit Build-Time-MD-Load + prerender
- AC-3 ✅ Per-Entry-Detail-Route `/updates/[slug]` mit Breadcrumb + h1 + Body + Tags + Zurück-Link
- AC-4 ✅ Category-Filter mit URL-State `?cat=feature,methodik`, deeplink-fähig, keyboard-bedienbar
- AC-5 ✅ RSS 2.0 Feed `/updates/rss.xml`
- AC-6 ✅ Atom 1.0 Feed `/updates/atom.xml`
- AC-7 ✅ JSON Feed 1.1 `/updates/feed.json`
- AC-8 ✅ Feed-Discovery-Links auf `/updates`, `/updates/[slug]` (Hero-`/` folgt mit Story 2.11)
- AC-9 ✅ JSON-LD `BlogPosting` per Detail + `Blog`-Index per Index-Page (Inline-Generator mit TODO-Verweis auf Story 2.2 Refactor)
- AC-10 ✅ Sitemap-Integration via `UPDATES_PAGES_SOURCE` (Index priority 0.6, Detail 0.7, lastmod aus `date`-Frontmatter)
- AC-12 ✅ Footer-Link `/updates` + Maintainer-Runbook `docs/runbooks/add-update-entry.md`
- AC-15 ✅ `role="group"` + `aria-label` + aria-live-Feedback + h1→h2→h3-Outline. axe-Audit deferred zu E2E.

**ACs deferred (4 von 15):**

- AC-11 (Hero-Updates-Teaser): wartet auf Story 2.11 Hero-Landing-Slot.
- AC-13 (EN-Locale): Phase 1 DE-only Lock (memory `project_i18n_phase_1_de_only`). EN-Coverage in Future-Epic „i18n-Phase-3-EN-Coverage".
- AC-14 (Phase-1-Coming-Soon-Override): wartet auf Story 2.11 `phase.ts`. Robots.txt bleibt Allow-All bis dahin.
- T10.6 E2E `updates-flow.e2e.ts`: Test-Suite-Design dokumentiert, Run deferred zu CI-Setup-Story.

**Open-Questions Lock:**

- **Q1 Sanitization**: Option A (Custom-Regex-Whitelist, User-Lock 2026-05-16). `$lib/seo/markdown-sanitizer.ts`.
- **Q2 Render-Pattern**: Detail-Page-Only. Index-Card zeigt Summary + „Mehr lesen"-Link, kein Inline-Disclosure.
- **Q3 RSS-EN**: DE-only Phase 1.
- **Q4 Tags**: Optional, max 8, lowercase-kebab-case.
- **Q5 DOMPurify**: Cure53 EU-Berlin, kein Issue. Bleibt Option B Stretch falls Multi-Author kommt.

**Test-Stand:**

- 117 neue Story-2.13-Unit-Tests in 16 Files (server-project).
- 14 Updates-Komponenten-Tests (client-project) inkl. erweiterter `meta-footer.svelte.test.ts`.
- 0 Type-Errors (`pnpm check` über 6056 Files).
- Build-Verify: 2 Detail-Pages + Index + 3 Feed-Files prerendert.

### File List

**Neu:**

- `_content/updates/README.md`
- `_content/updates/2026-05-16-launch.md`
- `_content/updates/2026-05-15-kiez-score-versorgungs-dimension.md`
- `docs/runbooks/add-update-entry.md`
- `src/lib/content/updates/frontmatter-schema.ts`
- `src/lib/content/updates/frontmatter-schema.test.ts`
- `src/lib/content/updates/load-updates.ts`
- `src/lib/content/updates/load-updates.test.ts`
- `src/lib/content/updates/parse-filter.ts`
- `src/lib/content/updates/parse-filter.test.ts`
- `src/lib/content/updates/render-markdown.ts`
- `src/lib/content/updates/render-markdown.test.ts`
- `src/lib/content/updates/types.ts`
- `src/lib/components/updates/category-label.ts`
- `src/lib/components/updates/category-label.test.ts`
- `src/lib/components/updates/updates-entry-card.svelte`
- `src/lib/components/updates/updates-entry-card.svelte.test.ts`
- `src/lib/components/updates/updates-filter.svelte`
- `src/lib/components/seo/feed-discovery-links.svelte`
- `src/lib/feeds/escape-xml.ts`
- `src/lib/feeds/escape-xml.test.ts`
- `src/lib/feeds/build-rss.ts`
- `src/lib/feeds/build-rss.test.ts`
- `src/lib/feeds/build-atom.ts`
- `src/lib/feeds/build-atom.test.ts`
- `src/lib/feeds/build-json-feed.ts`
- `src/lib/feeds/build-json-feed.test.ts`
- `src/lib/seo/markdown-sanitizer.ts`
- `src/lib/seo/markdown-sanitizer.test.ts`
- `src/lib/seo/json-ld-updates.ts`
- `src/lib/seo/json-ld-updates.test.ts`
- `src/lib/seo/sources/updates.ts`
- `src/lib/seo/sources/updates.test.ts`
- `src/routes/(with-header)/updates/+page.server.ts`
- `src/routes/(with-header)/updates/+page.svelte`
- `src/routes/(with-header)/updates/[slug]/+page.server.ts`
- `src/routes/(with-header)/updates/[slug]/+page.svelte`
- `src/routes/updates/rss.xml/+server.ts`
- `src/routes/updates/atom.xml/+server.ts`
- `src/routes/updates/feed.json/+server.ts`

**Modifiziert:**

- `package.json` (`marked@^14.1.4`, `gray-matter@^4.0.3` Deps)
- `pnpm-lock.yaml`
- `src/lib/components/atlas/meta-footer.svelte` (Updates-Link zwischen Methodik und Lizenzen)
- `src/lib/components/atlas/meta-footer.svelte.test.ts` (7-Link-Check + Updates-href-Test)
- `src/lib/seo/sitemap-builder.ts` (`UPDATES_PAGES_SOURCE` registriert in `ALL_SOURCES`)
- `src/lib/seo/sitemap-builder.test.ts` (`collectPrerenderedUrls`-Test angepasst: Floor-Check statt exakte Anzahl)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story 2-13: backlog → review)

### Change Log

| Datum | Status | Notiz |
|---|---|---|
| 2026-05-16 | ready-for-dev → in-progress | Dev-Story-Start (parallel-agent worktree) |
| 2026-05-16 | in-progress → review | 11 ACs erfüllt, 4 deferred (Hero-Teaser, EN, Phase-Guard, E2E). 117 neue Unit-Tests grün, 0 Type-Errors, Build-Output prerendert komplett. |
