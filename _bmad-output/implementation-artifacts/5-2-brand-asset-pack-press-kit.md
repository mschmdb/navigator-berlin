# Story 5.2: Brand-Asset-Pack + Press-Kit

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Owner mit Hebel-Ambition (Sichtbarkeit + mtc-Beratung + Brand),
I want einen finalen Brand-Asset-Pack mit Logo-Variants, Wortmarke-SVG, finalen OG/Favicon/Apple-Touch-Icons, einem Press-Kit-Bundle (`/presse`-Page + ZIP-Download + 1-Pager-PDF + Owner-Bio in DE), und einem LinkedIn-Banner im Plex-Cartography-Stil,
so that ich Presse-, Konferenz- und Beratungs-Anfragen mit einem konsistenten Link beantworten kann; alle Channels visuell konsistent auftreten; und der Brand-Footprint von navigator.berlin als professioneller Owner-Stack lesbar wird (Hebel #1 Sichtbarkeit + Hebel #2 mtc-Beratungs-Asset).

## Probleme heute

1. **Brand-Assets verstreut + unvollständig.** `static/logo-mark.svg` (192×192), `static/logo-mark-header.svg` (48×48), `static/favicon.svg`, `static/og-default.png` (1200×630) existieren als Singletons im `static/`-Root. Es gibt KEIN `static/brand/`-Verzeichnis, KEIN Wortmarke-SVG-Asset (`_dev/wortmarke/+page.svelte` ist nur Type-Test-Showcase, NICHT ein exportierter SVG-Pfad), KEINE Dark-Variante, KEIN `favicon-32.png`, KEIN `apple-touch-icon.png`.
2. **Kein Press-Material verfügbar.** Anfragen über `hey@navigator.berlin` (siehe `src/lib/utils/contact.ts:1`) bekommen heute keinen Link auf konsolidiertes Material. mtc-Beratung-Pitch braucht 1-Pager-PDF mit USP, Tech-Stack-Stichworten, Owner-Bio, Kontakt.
3. **Keine `/presse`-Route.** Routes-Tree (`src/routes/(with-header)/`: `+page`, `_dev`, `layer`, `lizenzen`, `methodik`, `updates`) hat keinen Press-Slot. Crawler + Press-Anfragen können nicht via URL einsteigen.
4. **LinkedIn-Profil von Matze Schmidbauer hat keinen visuell konsistenten Banner.** Brand-Auftritt zerfällt zwischen Site (Plex-Cartography + Animated-Logo) und Owner-Channel.
5. **Owner-Bio fehlt als versionierte Quelle.** DE-Bio (50 Wörter / 200 Wörter) ist heute nirgends als kanonische Markdown-Source.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2187-2213.
- Memory `project_i18n_phase_1_de_only.md`: EN-Coverage Phase 3 hard-locked. 5.2 schreibt Press-Material **AUSSCHLIESSLICH DE**. Epic-AC „DE+EN" wird zu „DE-only Phase 1", EN-Bio ist Phase-3-Folge-Story.
- Memory `feedback_no_em_dashes.md`: keine em-dashes (U+2014) im Press-Material.
- Memory `feedback_no_lebenswert.md`: kein „lebenswert/Lebensqualität" im 1-Pager + Bio.
- Memory `project_atlas_explore_route.md`: Atlas auf `/explore`, Hero auf `/`. Press-Material verweist auf `/explore` als Atlas-Tool und `/` als Brand-Lander.
- Memory `project_server_purchase_sequencing.md`: Phase-Sequencing. 5.2 ist Phase-2-Beta- oder Phase-3-Hard-Launch-Asset, NICHT Phase-1-Coming-Soon-Pflicht. Implementation kann jetzt erfolgen, Live-Verlinkung ab Phase 2.
- Skill `no-ai-slop`: 1-Pager-PDF + Bio brauchen redaktionelle Prosa (aktive Verben, kurze Sätze, keine Marketing-Floskeln).
- Skill `de-konzept-erstellung`: Owner-Bio + 1-Pager auf Geschäftsführungs-Vorlagen-Niveau, kein AI-Slop.
- Story 5.1 (ready-for-dev): ADR-016 + GitHub-Actions-Schedule. Keine direkte Abhängigkeit, aber 5.1 etabliert ADR-Verzeichnis-Konvention.
- Story 5.3 (backlog): Launch-Sequencing + Channel-Material. KONSUMIERT 5.2-Assets für Channel-Posts. 5.2 muss vor 5.3 fertig sein.
- Story 5.8 (ready-for-dev): Public-Update-Skill. KONSUMIERT `/presse`-URL evtl. für „Pressekontakt"-Slot in Update-Posts.
- Story 4.7 (ready-for-dev): Architektur-Page (`/architektur`). Schwester-Long-Form zu `/presse`, ähnliches Routing-Pattern.
- Story 4.6 (ready-for-dev): Compliance-Pages (Impressum, Datenschutz, Barrierefreiheit). Impressum trägt die selbe Owner-Identität wie Press-Kit-Bio. Bio-Aussagen müssen mit Impressum konsistent sein.
- Bestand Logo: `src/lib/components/ui/animated-logo.svelte` + `src/lib/data/logo-geometry.ts` (`BOUNDARY_POINTS`, `ANCHOR_POINTS`, `DELAUNAY_EDGES` aus `bezirke.geojson`). Re-Use für Brand-Asset-Generation.
- Bestand Wortmarke-Decision: `_dev/wortmarke/+page.svelte:17` lockt Plex-Sans Light 300, tracking 0.02em als Wortmarke-Type-Setup.
- Bestand Showcase: `_dev/logo/+page.svelte` rendert die 3 statischen SVG-Files + AnimatedLogo. Verifizier-Pfad für jede neue Variante.
- Bestand Contact: `src/lib/utils/contact.ts:1` `FEEDBACK_EMAIL = 'hey@navigator.berlin'`.
- Bestand Footer: `src/lib/components/atlas/meta-footer.svelte`. `/presse`-Link wird hier ergänzt.

## Akzeptanz-Kriterien

1. **AC-1 (Brand-Asset-Verzeichnis `static/brand/`):**
   **Given** Brand-Assets sind heute als Singletons im `static/`-Root.
   **When** ich ein `static/brand/`-Verzeichnis als Single-Source-of-Truth anlege.
   **Then**:
   - `static/brand/logo.svg` (Master, 192×192, Light-Variante = aktueller `static/logo-mark.svg`-Inhalt).
   - `static/brand/logo-dark.svg` (Dark-Mode-Variante, gleiche Geometrie mit invertierter Farbe gegen schwarzen Hintergrund).
   - `static/brand/logo-header.svg` (48×48-Variante = aktueller `static/logo-mark-header.svg`).
   - `static/brand/wortmarke.svg` (NEU, SVG-Export aus Plex-Sans Light 300 tracking 0.02em, Text „navigator.berlin", outlined-paths damit keine Plex-Font-Dependency). Größe ~600×60.
   - `static/brand/wortmarke-dark.svg` (selbe Geometrie, Light-Farbe für dunklen Hintergrund).
   - `static/brand/favicon.svg` (Re-Use aktueller `static/favicon.svg`, NUR move/copy).
   - `static/brand/favicon-32.png` (NEU, 32×32 PNG für IE/Legacy-Browser-Fallback, transparent BG).
   - `static/brand/apple-touch-icon.png` (NEU, 180×180 PNG, weiße BG damit iOS-Home-Screen-Tile sauber rendert).
   - `static/brand/og-default.png` (Move bestehende `static/og-default.png` hierhin ODER ersetzen durch finale Version aus Story 2.12 wenn vorhanden). 1200×630.
   - `static/brand/README.md` mit Asset-Index, Maße, Verwendungs-Hinweis (Light/Dark, Größen-Slot, Quell-Datei).
   - Bestehende Pfade `/logo-mark.svg`, `/logo-mark-header.svg`, `/favicon.svg`, `/og-default.png` bleiben aus Backward-Compat erhalten als symlinks oder Copies, weil `site-header.svelte`, `_dev/logo/+page.svelte`, `app.html`-Head-Tags sie referenzieren. Migration aller Konsumenten auf `/brand/`-Pfade ist Folge-Story (`5-2.1-asset-path-migration`), KEIN Scope hier.
   - Test: File-Existenz-Test `src/lib/content/brand-assets.test.ts` prüft alle Pfade via `fs.existsSync` im Test-Boundary.

2. **AC-2 (Wortmarke-SVG-Generierung):**
   **Given** `_dev/wortmarke/+page.svelte` lockt Plex-Sans Light 300 tracking 0.02em (Kandidat C).
   **When** ich `static/brand/wortmarke.svg` als outlined-paths-SVG erzeuge.
   **Then**:
   - Workflow: in Figma/Affinity/Inkscape Text „navigator.berlin" mit Plex-Sans Light 300, font-size 64, letter-spacing 0.02em rendern, dann „Convert to Outlines" / „Text in Pfade", dann als SVG exportieren mit `viewBox="0 0 600 60"` (approx).
   - SVG hat KEINE `<text>`-Tags (alle Glyphen als `<path>`), damit das Asset unabhängig vom System-Font lädt.
   - SVG hat `currentColor` als `fill`, damit es per CSS einfärbbar bleibt (Light/Dark).
   - Datei-Größe < 8 KB unminified, < 4 KB nach `svgo`-Pass.
   - Test: SVG-Validator gegen Datei (Mocha-XML-Parser oder `xmllint --noout`).
   - Doku-Pfad zur Reproduktion: `docs/runbooks/wortmarke-svg-workflow.md` (siehe AC-7).

3. **AC-3 (1-Pager-Press-PDF):**
   **Given** Press-Anfragen brauchen kompaktes Material.
   **When** ich `static/brand/press-kit-1pager.pdf` erstelle.
   **Then** PDF enthält auf 1 A4-Seite (DE-only Phase 1):
   - **Header:** Wortmarke + Tagline „Berlin in Schichten" (oder finale Hero-h1-Variante aus Story 2.12).
   - **USP-Block (≤ 60 Wörter):** „navigator.berlin zeigt Klima, Lärm, Wohnlagen, Verkehr und Geschichte für jeden Punkt der Stadt. Quellen offen, Code offen, ohne Tracking." (oder finale Lead-Variante aus Story 2.12).
   - **Was die Site liefert:** 5 Bullets pro Layer-Cluster (Klima, Lärm, Wohnlagen, Verkehr, Geschichte) mit jeweils einer Daten-Quelle-Attribution (Berlin Open Data, ODIS, OSM, DWD, BVG).
   - **Tech-Stack:** SvelteKit, MapLibre, PostGIS, Hetzner CPX22, Coolify, EU-FOSS-Hosting. Eine Zeile, monospace.
   - **Owner-Bio kurz** (50 Wörter aus AC-5).
   - **Kontakt:** `hey@navigator.berlin` + Website + LinkedIn-Profil-URL (Matze Schmidbauer).
   - **Footer:** Lizenzen-Hinweis (CC-BY für Daten, AGPL für Code, MIT für Bilder/Bibliotheken — finale Lizenz-Lage aus `static/lizenzen/`-Page bzw. Story 4.5).
   - **Layout:** Plex-Serif für Headings, Plex-Sans Light für Body, Plex-Mono für Tech-Stack-Zeile. Cloud-Dancer-Background (`--bg`), keine Hintergrund-Bilder im PDF (drucker-freundlich).
   - **Reproduktions-Pfad:** PDF wird aus `docs/press/press-kit-1pager.md` (Markdown-Source) per `pandoc` oder Pages/Affinity-Export erzeugt. Markdown-Source ist Quelle-of-Truth, PDF ist Build-Artefakt.
   - Datei-Größe ≤ 500 KB.
   - **Schreib-Disziplin:** no-ai-slop + de-konzept-erstellung skills greifen. Keine Funktionsverben, keine 3-Adjektiv-Stacks, keine Marketing-Floskeln.

4. **AC-4 (Press-Kit-ZIP-Bundle):**
   **Given** Press-Anfragen wollen ein bequemes Download-Paket.
   **When** ich `static/brand/press-kit.zip` baue.
   **Then**:
   - ZIP-Inhalt: `logo.svg`, `logo-dark.svg`, `logo-header.svg`, `wortmarke.svg`, `wortmarke-dark.svg`, `og-default.png`, `press-kit-1pager.pdf`, `owner-bio.md`, `README.md` (Inhaltsverzeichnis + Lizenz-Notice).
   - ZIP-Größe ≤ 2 MB.
   - `README.md` im ZIP listet: Asset-Index, Lizenzen pro Asset (Plex = SIL Open Font License, Logo/Wortmarke = AGPL oder CC-BY-SA), Owner-Kontakt, Site-URL.
   - Build-Script `scripts/build-press-kit.ts` baut den ZIP aus den `static/brand/`-Quellen. NPM-Script `pnpm build:press-kit` triggert.
   - `static/brand/press-kit.zip` ist Build-Artefakt + im Git als Lockfile (damit `/presse`-Page deterministisch den selben ZIP serviert).
   - Test: Unit-Test `scripts/build-press-kit.test.ts` extrahiert das ZIP im Temp-Dir und prüft das erwartete Inhalts-Inventar.

5. **AC-5 (Owner-Bio-Markdown):**
   **Given** Owner-Identität braucht versionierte Markdown-Quelle.
   **When** ich `docs/owner-bio.md` anlege.
   **Then**:
   - Datei enthält 2 Sektionen (DE-only Phase 1, EN-Sektion bleibt Phase-3-Stretch-Scope):
     - **Kurz (50 Wörter):** „Matze Schmidbauer baut navigator.berlin als Solo-Maintainer. Hintergrund: …" (Fakten zu Beruflichem-Profil aus User-Eingabe).
     - **Lang (200 Wörter):** ausführlichere Variante mit Motivation, Tech-Erfahrung, mtc-Berliner-Beratungsbezug, Datenraum-Civic-Tech-Positionierung.
   - **Frontmatter:** `lang: de`, `version: 1.0`, `date: 2026-05-16`.
   - **Co-Design-Pflicht:** Bio-Texte werden mit User in 1 Iteration finalisiert. KEIN AI-Slop, keine generischen „passionate technologist"-Phrasen. Aktive Verben, faktische Aussagen.
   - **LinkedIn-URL** als Markdown-Link im Body. Profil-Foto-Quelle: User liefert oder verweis auf öffentliches LinkedIn-Profilbild.
   - Test: Markdown-Parser-Validation + Wort-Counter (50 ± 10 für Kurz, 200 ± 20 für Lang).

6. **AC-6 (LinkedIn-Banner):**
   **Given** Owner-Profil-Banner soll Brand-Konsistenz tragen.
   **When** ich `static/brand/linkedin-banner.png` erzeuge.
   **Then**:
   - Maße: 1584×396 (LinkedIn-Personal-Banner-Spec).
   - Visueller Aufbau: Plex-Cartography-Style Berlin-Karten-Backdrop (z.B. Atlas-Ausschnitt Spreebogen + Brandenburger Tor in Plex-Map-Style aus `static/map-style.json` rendered) + Wortmarke „navigator.berlin" links + Tagline „Berlin in Schichten" rechts daneben + URL-Footer kleingedruckt.
   - Farb-Schema: Cloud-Dancer-BG (`--bg`) + Plex-Serif-Wortmarke in `--ink`, Tagline in `--ink-muted`.
   - PNG-Optimization via `pngquant` oder `oxipng`, Datei-Größe ≤ 600 KB.
   - **Reproduktions-Workflow:** Atlas-Screenshot via `_dev`-Route mit deterministischer Bbox-URL erzeugen, in Figma/Affinity mit Brand-Layer komponieren, als PNG exportieren. Workflow in `docs/runbooks/linkedin-banner-workflow.md` (siehe AC-7).
   - Test: File-Existenz + Dimensions-Check via `image-size`-Lib im Test-Boundary.

7. **AC-7 (Brand-Reproduktions-Runbooks):**
   **Given** Brand-Assets müssen reproduzierbar sein (Re-Design, Update, Variante).
   **When** ich 2 Runbooks schreibe.
   **Then**:
   - `docs/runbooks/wortmarke-svg-workflow.md`: Plex-Sans-Light-Setup, Outline-Export, SVGO-Pass, `viewBox`-Normalisierung. ≤ 100 Zeilen.
   - `docs/runbooks/linkedin-banner-workflow.md`: Atlas-Screenshot-Bbox, Brand-Layer-Komposition, PNG-Optimizer-Pass. ≤ 100 Zeilen.
   - Beide Runbooks folgen Format-Vorlage aus `docs/runbooks/bookmark-storage.md` oder `docs/runbooks/tile-provider-switch.md`.
   - Plex-Mono-Code-Blocks, Plex-Sans-Prose, keine em-dashes, keine Marketing-Floskeln.

8. **AC-8 (`/presse`-Route prerendered):**
   **Given** Press-Material muss URL-erreichbar sein (FR-relevant Hebel #1 + #2).
   **When** ich `src/routes/(with-header)/presse/+page.svelte` und `+page.ts` anlege.
   **Then**:
   - `+page.ts` exportiert `export const prerender = true;` (Static Build, kein SSR-Aufwand).
   - Page-Inhalt:
     - Plex-Serif h1 „Presse + Material".
     - Plex-Sans Lead (1-2 Sätze).
     - Direkter Download-Button (`<a href="/brand/press-kit.zip" download>`) mit Größe-Anzeige.
     - Direkter PDF-Link (`<a href="/brand/press-kit-1pager.pdf" target="_blank">`).
     - Inline-Rendering der `owner-bio.md`-Kurz-Variante (50 Wörter) als Plex-Sans-Block.
     - Asset-Galerie: jeder Brand-Asset als visuelle Vorschau + Download-Link (Logo Light/Dark, Wortmarke Light/Dark, OG-Default, LinkedIn-Banner).
     - Kontakt-Block: `mailto:hey@navigator.berlin?subject=Presse-Anfrage` als sekundärer Button.
   - **SEO-Head:**
     - Title „Presse + Material · navigator.berlin".
     - Meta-Description: 1-Pager-Variante.
     - Canonical: `https://navigator.berlin/presse`.
     - JSON-LD `WebPage` minimal (analog `/methodik`).
     - `og:image` zeigt auf `static/brand/og-default.png`.
   - **Sitemap-Eintrag:** neue `SitemapSource` in `src/lib/seo/sources/press-page.ts` exportiert `PRESS_PAGES_SOURCE: SitemapSource` mit `/presse` als Eintrag, `<priority>0.5</priority>`. Registrierung in `ALL_SOURCES`-Array in `src/lib/seo/sitemap-builder.ts:131` ergänzen.
   - **Layout-Wiring:** Footer-Link `/presse` in `src/lib/components/atlas/meta-footer.svelte` zwischen `/methodik` und `/lizenzen` (analog Story 2.13 `/updates`-Link-Insertion-Pattern).
   - **Phase-Lock:** Page wird `assertPhaseAllows('press')`-gated via `phase.ts` aus Story 2.11. In Phase 1 (Coming-Soon) → `error(503, 'Coming soon')`. In Phase 2 (Beta) und Phase 3 (Hard) → erreichbar.
   - **Komponente:** ≤ 250 LOC. Wenn größer: Subkomponenten `press-asset-card.svelte`, `press-download-button.svelte` extrahieren.
   - Test: Render-Snapshot, Asset-Galerie-Anchor-Existenz, Footer-Link-Verlinkung.

9. **AC-9 (Accessibility):**
   **Given** WCAG 2.2 AA Pflicht (NFR-A1).
   **When** Page geladen wird.
   **Then**:
   - Skip-Link „Direkt zum Inhalt" (Bestand aus Layout).
   - h1 als Page-Outline-Start, h2 pro Sektion (Downloads, Asset-Galerie, Owner-Bio, Kontakt).
   - Download-Buttons als `<a href=... download>` mit aria-label inkl. Datei-Typ + Größe („Press-Kit als ZIP, 1.8 MB").
   - Asset-Galerie-Bilder mit `alt`-Text pro Asset (Logo Light, Logo Dark, Wortmarke, …).
   - `axe`-Audit 0 Violations (Test via Playwright + `@axe-core/playwright`).
   - Tastatur-Walk: h1 → Download-Buttons → Asset-Galerie → Owner-Bio → Kontakt-Button.

10. **AC-10 (Phase-1-DE-only-Lock):**
    **Given** Memory `project_i18n_phase_1_de_only.md` ist hard-gelockt.
    **When** ich Press-Material schreibe.
    **Then**:
    - Owner-Bio: NUR DE in `docs/owner-bio.md`. EN-Sektion bleibt leer oder absent. Phase-3-Folge-Story füllt EN-Bio.
    - 1-Pager-PDF: NUR DE-Variante (`press-kit-1pager.pdf`). KEIN `press-kit-1pager.en.pdf` in Phase 1.
    - `/presse`-Route: NUR DE-Variante. Paraglide-Reroute für `/en/presse` darf existieren, aber Page-Inhalt bleibt DE-Hardcoded (analog Story 2.11-Pattern für andere Long-Form-Pages).
    - LinkedIn-Banner: Wortmarke + Tagline auf DE („Berlin in Schichten"). Phase-3-Variante mit EN-Tagline ist Folge-Asset.
    - ZIP-README: NUR DE-Text.
    - Stigma-Lint: kein „lebenswert/Lebensqualität" im Bio oder 1-Pager.

11. **AC-11 (Brand-Asset-Lizenz-Manifest):**
    **Given** Press-Anfragen brauchen Lizenz-Klarheit.
    **When** ich `static/brand/LICENSES.md` (oder `static/brand/README.md`-Section) schreibe.
    **Then**:
    - Pro Asset-Datei: Lizenz-Angabe als 1-Zeile-Eintrag (`logo.svg: AGPL-3.0-or-later, geometrisch abgeleitet aus bezirke.geojson (Geoportal Berlin Datenlizenz Deutschland Namensnennung 2.0)`).
    - Plex-Schrift-Lizenz: SIL Open Font License (separater Hinweis weil Wortmarke-SVG outlined ist, also keine direkte Plex-Distribution).
    - Owner-Bio: CC-BY-SA-4.0 (oder Public-Domain) für Re-Use durch Press.
    - Konsistenz-Check gegen `static/lizenzen/`-Page (Story 4.5): keine Lizenz-Aussage hier widerspricht dem dortigen Stand. Test prüft Cross-Reference.

12. **AC-12 (TDD-Mandat):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** für Build-Script (`scripts/build-press-kit.test.ts`): ZIP-Inventar, README-Inhalt.
    - **Unit-Tests** für Asset-Existenz (`src/lib/content/brand-assets.test.ts`).
    - **Komponenten-Tests** für `/presse`-Page (`+page.svelte.test.ts`): Render + Asset-Galerie-Anchor + Footer-Link.
    - **E2E-Test** `tests/e2e/presse-flow.e2e.ts`: Page-Load, Download-Anchor-Hrefs korrekt, `axe`-Check 0 Violations.
    - **Snapshot-Test** für `<svelte:head>`-JSON-LD-Output.
    - Coverage-Ziel: Build-Script ≥ 80%, Komponente ≥ 70%.

## Tasks / Subtasks

- [ ] **T1: Brand-Asset-Verzeichnis aufsetzen** (AC: 1, 11)
  - [ ] T1.1: `mkdir static/brand/` und bestehende Singletons hineinkopieren als `logo.svg`, `logo-header.svg`, `favicon.svg`, `og-default.png` (Copy nicht Move, weil Bestands-Konsumenten an alten Pfaden hängen).
  - [ ] T1.2: `static/brand/README.md` schreiben mit Asset-Index + Lizenz-Tabelle.
  - [ ] T1.3: `static/brand/LICENSES.md` (oder README-Sektion) mit Per-Asset-Lizenz.
  - [ ] T1.4: `src/lib/content/brand-assets.ts` exportiert typesafe Pfade-Manifest (analog Story 2.12 `screenshot-manifest.ts`-Pattern).
  - [ ] T1.5: `brand-assets.test.ts` Existenz-Check via `fs.existsSync` im Test-Boundary.

- [ ] **T2: Dark-Variante + Logo-Geometrie-Re-Use** (AC: 1)
  - [ ] T2.1: `static/brand/logo-dark.svg` aus `logo.svg` ableiten (`currentColor`-Pattern + Test mit dunklem Background).
  - [ ] T2.2: Verify in `_dev/logo/+page.svelte` durch Anhängen einer Dark-Sektion mit `bg-ink` Hintergrund.

- [ ] **T3: Wortmarke-SVG-Generierung + Runbook** (AC: 2, 7)
  - [ ] T3.1: In Figma/Affinity/Inkscape „navigator.berlin" als Plex-Sans Light 300 tracking 0.02em rendern.
  - [ ] T3.2: Text → Outlines, als SVG exportieren mit `viewBox="0 0 600 60"`.
  - [ ] T3.3: `fill="currentColor"` setzen, `svgo` Pass für Größen-Optimierung.
  - [ ] T3.4: `static/brand/wortmarke.svg` committen, Dark-Variante als zweite Datei `wortmarke-dark.svg`.
  - [ ] T3.5: `docs/runbooks/wortmarke-svg-workflow.md` schreiben (≤ 100 Zeilen).
  - [ ] T3.6: SVG-XML-Validator-Test (XML-Parser-Smoke).

- [ ] **T4: Favicon-PNG + Apple-Touch-Icon** (AC: 1)
  - [ ] T4.1: `static/brand/favicon-32.png` aus `favicon.svg` rendern (ImageMagick `convert -resize 32x32`).
  - [ ] T4.2: `static/brand/apple-touch-icon.png` 180×180 mit weißer BG.
  - [ ] T4.3: `app.html`-Head-Tags um Apple-Touch-Icon-Referenz ergänzen falls nicht vorhanden.

- [ ] **T5: 1-Pager-Markdown + PDF-Export** (AC: 3)
  - [ ] T5.1: `docs/press/press-kit-1pager.md` als Markdown-Source schreiben (Co-Design mit User).
  - [ ] T5.2: Pandoc-Pipeline oder Affinity/Pages-Export auf `static/brand/press-kit-1pager.pdf`.
  - [ ] T5.3: PDF-Größen-Check ≤ 500 KB.
  - [ ] T5.4: Stigma-Lint-Test gegen Source (kein „lebenswert", keine em-dashes).

- [ ] **T6: Owner-Bio-Markdown** (AC: 5)
  - [ ] T6.1: Co-Design-Session mit User: Bio-Kurz (50 Wörter) + Bio-Lang (200 Wörter), beide DE.
  - [ ] T6.2: `docs/owner-bio.md` mit Frontmatter + zwei Sektionen.
  - [ ] T6.3: Wort-Counter-Test (50 ± 10 / 200 ± 20).
  - [ ] T6.4: Stigma-Lint + no-ai-slop-Pass.

- [ ] **T7: LinkedIn-Banner + Runbook** (AC: 6, 7)
  - [ ] T7.1: Atlas-Screenshot via `_dev`-Route oder Atlas auf `/explore?bbox=…` (Bbox = Spreebogen + Brandenburger Tor).
  - [ ] T7.2: Figma/Affinity-Komposition mit Brand-Layer (Wortmarke + Tagline + URL-Footer).
  - [ ] T7.3: PNG-Export 1584×396, `pngquant` oder `oxipng` Optimierung, ≤ 600 KB.
  - [ ] T7.4: `static/brand/linkedin-banner.png` committen.
  - [ ] T7.5: `docs/runbooks/linkedin-banner-workflow.md` schreiben (≤ 100 Zeilen).

- [ ] **T8: Press-Kit-ZIP-Build-Script** (AC: 4)
  - [ ] T8.1: `scripts/build-press-kit.ts` mit `archiver` oder `jszip` Lib.
  - [ ] T8.2: `pnpm build:press-kit` als NPM-Script in `package.json`.
  - [ ] T8.3: ZIP-README.md generieren mit Inventar + Lizenzen.
  - [ ] T8.4: `static/brand/press-kit.zip` committen.
  - [ ] T8.5: `build-press-kit.test.ts` Inventar-Extraktion-Test.

- [ ] **T9: `/presse`-Route + Layout-Wiring** (AC: 8, 9)
  - [ ] T9.1: `src/routes/(with-header)/presse/+page.ts` mit `export const prerender = true;` + Phase-Guard via `phase.ts`.
  - [ ] T9.2: `src/routes/(with-header)/presse/+page.svelte` mit Hero + Downloads + Asset-Galerie + Bio + Kontakt.
  - [ ] T9.3: `src/routes/(with-header)/presse/+page.server.ts` falls Phase-Guard server-side nötig: `assertPhaseAllows('press')` als erste Zeile in `load()`.
  - [ ] T9.4: `src/lib/seo/sources/press-page.ts` mit `PRESS_PAGES_SOURCE: SitemapSource` exportieren.
  - [ ] T9.5: `src/lib/seo/sitemap-builder.ts:131` `ALL_SOURCES` um `PRESS_PAGES_SOURCE` ergänzen.
  - [ ] T9.6: `src/lib/components/atlas/meta-footer.svelte` um `/presse`-Link erweitern (zwischen `/methodik` und `/lizenzen`).
  - [ ] T9.7: `<svelte:head>` mit Title + Canonical + OG + JSON-LD `WebPage`.
  - [ ] T9.8: Komponenten-Test `+page.svelte.test.ts` und Footer-Test-Erweiterung.
  - [ ] T9.9: E2E `tests/e2e/presse-flow.e2e.ts` mit 4 Cases (Page-Load, Download-Hrefs, Footer-Link, axe).
  - [ ] T9.10: `phase.ts` (aus Story 2.11) um `'press'` als `GuardedRoute`-Member ergänzen falls noch nicht vorhanden.

- [ ] **T10: Final-Verifikation** (AC: 1-12)
  - [ ] T10.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T10.2: `pnpm check` 0 Errors.
  - [ ] T10.3: `pnpm build` läuft, `/presse` prerendert, ZIP + PDF im Output.
  - [ ] T10.4: Lighthouse-Run auf `/presse`: A11y ≥ 95, SEO ≥ 95, Performance ≥ 90.
  - [ ] T10.5: Browser-Verify lokal: Download-Buttons triggern korrekten ZIP/PDF-Download.
  - [ ] T10.6: Sprint-Status-Eintrag.

## Dev Notes

### Phase-Sequencing-Lock

5.2 ist Phase-2-Beta-Asset oder Phase-3-Hard-Launch-Asset, KEIN Phase-1-Coming-Soon-Pflicht-Item. Implementation kann sofort starten, Live-Verlinkung im Footer aktiviert sich automatisch sobald `assertPhaseAllows('press')` in Phase 2/3 durchgeht (Phase-1-Coming-Soon-Modus blockiert die Route mit 503, Footer-Link führt zu 503-Page).

### Asset-Pfad-Migration als Folge-Story

5.2 KOPIERT bestehende Assets in `static/brand/`, lässt Singletons im `static/`-Root unverändert. Grund: 12+ Konsumenten (`site-header.svelte` Z. 54, `app.html`-Head, `_dev/logo`-Showcase, `og-image-url.ts`, Atlas-Marker-Layer) referenzieren die alten Pfade. Move + Konsumenten-Refactor = breaking change, brauche eigene Folge-Story (`5-2.1-brand-asset-path-migration`).

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `src/lib/components/ui/animated-logo.svelte` (Re-Use für Brand-Asset-Showcase auf `/presse` + LinkedIn-Banner-Komposition).
- `src/lib/data/logo-geometry.ts` (`BOUNDARY_POINTS`, `ANCHOR_POINTS`, `DELAUNAY_EDGES` aus `bezirke.geojson`).
- `src/lib/utils/contact.ts` `FEEDBACK_EMAIL` für Kontakt-Block.
- `src/lib/seo/sitemap-builder.ts` `SitemapSource`-Type + `ALL_SOURCES`-Registry (Story 2.1).
- `src/lib/components/atlas/seo-head.svelte` für `/presse` `<svelte:head>` (Story 2.1).
- `src/lib/components/atlas/meta-footer.svelte` Footer-Link-Insertion.
- `src/lib/config/phase.ts` `assertPhaseAllows` (Story 2.11).
- `static/map-style.json` Plex-Cartography-Style für LinkedIn-Banner-Atlas-Screenshot.
- `_dev/logo/+page.svelte` Verifizier-Pfad für jede neue Variante.

### MUST-Rules-Anwendung

- **#1 @lucide/svelte**: für Press-Page-Icons (`Download`, `Mail`, `ExternalLink`).
- **#2 Files <500 Zeilen**: `+page.svelte` ≤ 250 LOC, Subkomponenten falls nötig.
- **#3 Bestehende Funktionen prüfen**: Re-Use-Liste oben.
- **#7 TypeScript strict**: `brand-assets.ts` Path-Manifest typed.
- **#8 Svelte-5-Runes**: `$props` für Subkomponenten-Schnittstellen.
- **#10 Cookieless**: keine LocalStorage-Reads.
- **#11 Kein US-Drittanbieter**: Brand-Asset-Pipeline lokal (pandoc/svgo/pngquant), keine externen Services im Build.
- **#13 A11y-First**: `<img>` mit `alt`, Download-Buttons mit aria-label, Tastatur-Walk.
- **#14 i18n-First**: Phase-1-DE-only-Lock, keine EN-Strings.
- **#20 ADR-Pflicht**: KEINE neue ADR nötig (keine Architektur-Entscheidung, reine Asset-Konsolidierung).
- **#21 prerender**: `/presse` prerendered.

### Co-Design-Sessions (Pflicht)

Zwei Co-Design-Sessions mit User vor Massen-Implementation:

1. **Owner-Bio** (AC-5): Kurz + Lang DE. User liefert biographische Fakten, ich strukturiere als no-ai-slop-Prosa.
2. **1-Pager-PDF-Source** (AC-3): USP-Block + Bullets, User entscheidet finale Wording.

### Stigma + Editorial-Disziplin

- Owner-Bio enthält KEINE Marketing-Phrasen („passionate technologist", „experienced engineer", „I love").
- 1-Pager-PDF enthält KEIN „revolutionär", „einzigartig", „nahtlos".
- Tagline DE: „Berlin in Schichten" oder finale Variante aus Story 2.12. KEIN „lebenswert" oder „Lebensqualität".
- Datenraum-Bezug: faktisch + konkret (welche Datensätze, welche Cadence, welche Tools), kein abstraktes „data-driven decisions".

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 2.11 | ready-for-dev | `phase.ts` + `assertPhaseAllows` (siehe T9.10). 5.2 erweitert `GuardedRoute`-Union um `'press'`. |
| 2.12 | ready-for-dev | Finale Hero-Tagline + USP-Wording. Wenn 2.12 vor 5.2 fertig: 1-Pager re-used 2.12-Copy. Sonst: 5.2 lockt eine Working-Draft, 2.12 sync't nach. |
| 2.1 | review | `SeoHead` + `SitemapSource`-Type + `ALL_SOURCES` Registry. Direkt importieren. |
| 4.5 | ready-for-dev | Lizenzen-Page als Cross-Reference für `static/brand/LICENSES.md`-Konsistenz. |
| 4.6 | ready-for-dev | Impressum als Owner-Identitäts-Quelle. Bio in 5.2 muss mit Impressum-Daten konsistent sein. |
| 5.1 | ready-for-dev | ADR-016-Pattern. Keine direkte Dependency, nur Format-Vorbild. |
| 5.3 | backlog | KONSUMIERT 5.2-Assets. 5.2 MUSS vor 5.3 done sein. |

**Empfehlung Reihenfolge:**
1. 2.11 + 2.12 zuerst (Hero-Tagline + Phase-Guard finalisieren).
2. 4.6 vor 5.2 (Impressum-Owner-Daten als Konsistenz-Anker).
3. 5.2 jetzt, nach 4.6.
4. 5.3 sequenziell hinter 5.2.

### Open-Questions vor Dev-Start

1. **Owner-Bio-Inhalt:** Wer ist „Matze Schmidbauer" außerhalb von navigator.berlin? Beruflicher Hintergrund (Software-Engineering bei welchen Firmen, MTC-Bezug, Patent-Erfahrung aus mmcp-Patstat-MCP-Memory?), Ausbildung, öffentliche Talks/Publikationen? **Default-Decision:** User liefert biographische Fakten in Co-Design-Session, ich strukturiere. Wenn User keinen Datenraum-Beratungs-Pitch will: Bio bleibt rein technisch („Solo-Maintainer, baut navigator.berlin als Civic-Tech-Projekt, beruflicher Hintergrund Software-Engineering"). Bestätigung beim Dev-Start.

2. **Logo-Lizenz:** AGPL-3.0-or-later (analog Codebase) oder CC-BY-SA-4.0 (üblich für Brand-Assets)? **Empfehlung CC-BY-SA-4.0** weil AGPL für Bilder konzeptionell unpassend ist und CC-BY-SA Share-Alike-Pflicht trägt. Bestätigung beim Dev-Start.

3. **LinkedIn-Banner-Atlas-Bbox:** Spreebogen + Brandenburger Tor oder Berlin-weiter Übersichts-Ausschnitt? **Empfehlung Spreebogen-Variante** weil visueller Wiedererkennungswert höher. User bestätigt.

4. **PDF-Pipeline:** Pandoc (Markdown → PDF via LaTeX-Template) oder Affinity/Pages-Manual-Export? **Empfehlung Pandoc** wegen Reproduzierbarkeit + Git-Versionierbarkeit der Source. Wenn LaTeX-Setup zu schwer: Affinity-Export als Fallback. User bestätigt Tooling.

5. **`og-default.png`-Refresh:** Aktuelle `static/og-default.png` ist Phase-1-Stand. Soll 5.2 die finale Version aus Story 2.12 übernehmen oder eine eigene Brand-Asset-Variante (z.B. ohne Atlas-Render, nur Plex-Wortmarke + Tagline auf Cloud-Dancer-BG) erzeugen? **Empfehlung: 5.2 wartet auf 2.12-Finalisierung**, übernimmt das dort erzeugte Asset 1:1 in `static/brand/og-default.png`. Wenn 2.12 noch nicht done: Working-Draft, Refresh in Folge-PR. User bestätigt.

### Performance-Begründung

`/presse`-Page ist Long-Form-Static-Content mit 4-8 Bildern (Asset-Galerie-Vorschauen). Page-Weight-Ziel ≤ 300 KB inkl. Bilder, Initial-JS ≤ 50 KB (analog Hero-Landing aus Story 2.11). LCP < 1.5s gegen Production-Build.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2187-L2213`
- Story 2.1: `_bmad-output/implementation-artifacts/2-1-seo-foundation-sitemap-canonical-robots-txt.md` (SeoHead + SitemapSource)
- Story 2.11: `_bmad-output/implementation-artifacts/2-11-static-hero-landing-atlas-move-explore.md` (phase.ts + assertPhaseAllows)
- Story 2.12: `_bmad-output/implementation-artifacts/2-12-hero-landing-content-screenshot-assets.md` (Hero-Tagline + USP-Final-Copy)
- Story 4.5: `_bmad-output/implementation-artifacts/4-5-lizenzen-page-en-variante-auto-gen-coverage-test.md` (Lizenzen-Page)
- Story 4.6: `_bmad-output/implementation-artifacts/4-6-compliance-pages-impressum-datenschutz-barrierefreiheit-de-en.md` (Impressum)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (Format-Vorbild)
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_atlas_explore_route.md`, `project_server_purchase_sequencing.md`
- Skills `no-ai-slop`, `de-konzept-erstellung`
- Bestand Logo: `src/lib/components/ui/animated-logo.svelte`, `src/lib/data/logo-geometry.ts`, `static/logo-mark.svg`, `static/logo-mark-header.svg`, `static/favicon.svg`, `static/og-default.png`
- Bestand Wortmarke-Decision: `src/routes/(with-header)/_dev/wortmarke/+page.svelte:17` (Plex-Sans Light 300, tracking 0.02em)
- Bestand Showcase: `src/routes/(with-header)/_dev/logo/+page.svelte`
- Bestand Contact: `src/lib/utils/contact.ts:1` (`FEEDBACK_EMAIL`)
- Bestand Footer: `src/lib/components/atlas/meta-footer.svelte`
- Bestand SEO: `src/lib/seo/sitemap-builder.ts:131` (`ALL_SOURCES`), `src/lib/components/atlas/seo-head.svelte`
- Runbook-Format-Vorlage: `docs/runbooks/bookmark-storage.md`, `docs/runbooks/tile-provider-switch.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
