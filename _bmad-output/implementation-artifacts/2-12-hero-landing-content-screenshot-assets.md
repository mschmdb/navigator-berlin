# Story 2.12: Hero-Landing Content + Atlas-Screenshot-Assets

Status: ready-for-dev

## Story

As a Site-Owner,
I want den finalen Hero-Landing-Content (Texte, Quick-Links, Layer-Teaser, Top-Kieze-Strategie, Bezirks-Card-Auswahl, FAQ-Top-5, Brand-Block, Beratungs-CTA) zusammen mit kuratierten Atlas-Screenshot-Assets,
so that Story 2.11 nicht mit Lorem-Ipsum live geht. Jede Sektion hat verifizierten Text, jeder Layer-Teaser hat ein visuelles Anker-Bild, Such-Maschinen und LLM-Agents lesen substantiellen, einzigartigen Content statt Skelett-Markup.

## Phase-1-DE-only-Lock (User-Lock 2026-05-15, Memory `project_i18n_phase_1_de_only.md`)

EN-Coverage ist komplett auf Phase 3 (Post-Hard-Launch) verschoben. 2.12 schreibt **AUSSCHLIESSLICH DE-Content**: Paraglide-Messages nur in `messages/de.json`, Hardcoded-DE wo Paraglide-Stub noch unvollständig, EN-Locale-Pfade in Hero-Komponenten gelten als Stretch-Stub aber sind NICHT Pflicht-Scope. Quick-Link `label_en`, Layer-Teaser `title_en`/`lead_en`, Bezirks-Featured `name_en`, OG-Default `og-default.en.webp` → ALLE OUT-OF-SCOPE. Schema-Felder dürfen optional vorhanden sein, müssen aber leer/null sein. Phase-3-Folge-Story füllt EN nach.

## Probleme heute

1. Story 2.11 baut Sektions-Struktur + Komponenten + SEO-Skeleton mit hartkodierten Platzhalter-Strings und ohne Bild-Assets. Live-Launch ohne 2.12 würde Crawler-Wert + Brand-Eindruck unterlaufen.
2. Quick-Link-Adressen brauchen verifizierte Geocoder-Slug-IDs. Ohne Test gegen Live-Geocoder kann ein Link auf 404 deeplinken (Geocoder-ID-Drift).
3. Atlas-Screenshots existieren nirgends im Repo. Layer-Teaser-Cards in 2.11 zeigen leere `aspect-ratio: 4/3`-DIVs.
4. Default-OG-Bild für `/` fehlt. Twitter-Card und LinkedIn-Preview zeigen aktuell keinen Card-Render.
5. Content-Maintainer-Workflow ist undokumentiert. Wenn der User Quick-Links tauschen oder einen Bezirk swappen will, gibt es keine Anleitung.
6. Hebel-#2-Beratungs-CTA (Decision-Lock 2026-05-15-PM) ist nicht implementiert. Datenraum-Beratungs-Angebot bleibt unsichtbar.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1470-1547.
- Story 2.11 (ready-for-dev): Komponenten-Skelett in `src/lib/components/home/`. 2.12 befüllt die Slots und ergänzt `consulting-cta.svelte`.
- Story 2.0 (ready-for-dev): `kiez_score`-Aggregat als Quelle für `home-top-kieze.ts`. Build-Time-Read über `getKiezScoreTop(limit: number)` aus Story 2.9a.
- Story 2.5b (ready-for-dev): `faq_qna`-Aggregat als Quelle für `home-faq-selection.ts`. ID-Verweise statt Duplikat.
- Story 2.6 (ready-for-dev): OG-Pipeline. Default-OG entweder manuell als Screenshot mit Plex-Brand oder via Satori-Overlay über Atlas-Screenshot.
- Story 2.9a (ready-for-dev): `kiez_score`-Aggregat-Read-Helper.
- Story 3.1 (ready-for-dev): Paraglide-Setup-Reduce auf DE-only Phase 1. 2.12 schreibt Paraglide-Messages und ersetzt die hartkodierten DE-Strings aus Story 2.11. KEINE EN-Schreibung in Phase 1.
- Story 3.2 (verschoben Phase 3 per User-Lock): EN-UI-Coverage. Aus 2.12 herausgenommen, eigene Phase-3-Story füllt EN.
- Memory `project_atlas_explore_route.md`: Atlas auf `/explore`, Hero auf `/`.
- Memory `feedback_no_lebenswert.md`: Verbot „lebenswert/Lebensqualität". Verweis-Link nutzt Ranking-Page-H1 „Wo lebt es sich gut?".
- Memory `feedback_no_em_dashes.md`: keine em-dashes (U+2014).
- Memory `project_kiez_score_naming.md`: Kiez-Score-Begriffe konsistent.
- UX-Spec UX-DR14 (Address-Search hero/header), UX-DR43 (Long-Form-Layout, max 72ch, Plex-Serif h1), Typographie Z. 959-1015 (Plex-Sans Body, Plex-Serif Hero).
- PRD NFR-P6 (Page-Weight Landing ≤ 500 KB inkl. Plex-Variable-Font), FR55b/d/e (Locale-URL-Prefix, hreflang).
- Skill `no-ai-slop`: keine AI-Slop-Prosa, keine Funktionsverben, keine 3-Adjektiv-Stacks. Wichtig für Hero-Lead + Layer-Teaser-Texte + Open-Block-Bullets.
- Skill `de-konzept-erstellung`: aktive Verben, kurze Sätze, kein Calque-Deutsch.

## Akzeptanz-Kriterien

1. **AC-1 (Hero-Block Final-Copy + Paraglide-Messages DE-only):**
   **Given** Story 2.11 hat Hero-Slots mit hartkodierten DE-Strings, Phase-1-DE-only-Lock aktiv.
   **When** ich Paraglide-Messages für Hero-Texte befülle.
   **Then**:
   - Source-File: NUR `messages/de.json` (Paraglide-Inlang-Format) bekommt folgende Keys. `messages/en.json` bleibt unangetastet (Phase-3-Folge-Story füllt EN nach):
     - `home_hero_h1` (Plex-Serif-tauglich, knapp ≤ 30 Zeichen)
     - `home_hero_lead` (Plex-Sans, max 60ch)
     - `home_hero_address_placeholder`
     - `home_hero_address_submit_label`
     - `home_hero_examples_label` („Beliebte Orte" oder „Beispiel-Adressen")
     - `home_open_block_title`, `home_open_block_lead`, `home_open_block_bullet_1` bis `..._bullet_4`
     - `home_layer_teasers_title`, `home_layer_teasers_lead`
     - `home_top_kieze_title`, `home_top_kieze_disclaimer`
     - `home_featured_bezirke_title`
     - `home_faq_title`, `home_faq_archive_link_label`
     - `home_consulting_cta_title`, `home_consulting_cta_lead`, `home_consulting_cta_button_label`
     - `home_updates_teaser_title`, `home_updates_teaser_archive_link_label`
   - Recompile via `paraglide-js-cli` bestätigt typesafe Import in `home-*.svelte`-Komponenten.
   - Story 2.11 `home-*.svelte`-Komponenten swappen hardcoded DE auf Paraglide-Resolutions.
   - Texte erfüllen Output-Konventionen: keine em-dashes, kein „lebenswert/Lebensqualität", aktive Verben, kurze Sätze (no-ai-slop + de-konzept-erstellung).
   - Co-Design-Pflicht: Hero-h1 + Lead werden mit User in 1 Iteration finalisiert vor Massen-Implementation. Vorschläge als Bullet-Liste im Pull-Request-Body.
   - Test: Snapshot DE-Render von `home-hero.svelte`.

2. **AC-2 (Quick-Link-Adressen + Geocoder-Verifikation):**
   **Given** 5 Berlin-bekannte Adressen brauchen verifizierte Geocoder-IDs damit `<a href="/explore?address=...">` deeplinkt.
   **When** ich `src/lib/data/home-quick-links.ts` als typed Array exportiere.
   **Then**:
   - Schema pro Eintrag: `{ slug: string; label_de: string; label_en?: string | null; coords: [number, number] }` (coords = `[lng, lat]` für SSR-Pre-Fetch-Hint und Geocoder-Verifikation). `label_en` bleibt `null` in Phase 1 (DE-only-Lock).
   - Initial-Liste: Brandenburger Tor, Alexanderplatz, Görlitzer Park, Tempelhofer Feld, Schloss Charlottenburg.
   - **Geocoder-Round-Trip-Verifikation** als Build-Time-Test: `src/lib/data/home-quick-links.test.ts` ruft jede `slug` über `geocodeAddress`-Query oder Reverse-Geocode gegen `coords` und prüft, dass die Display-Name-Antwort plausibel zur erwarteten Adresse passt. Failed-Match wirft Build-Fehler (kein Drift unbemerkt durchlassen).
   - Wenn Geocoder-Call nicht reproduzierbar live in CI getestet werden kann (Rate-Limit, US-Drittanbieter), Fallback: Test ruft `coords` über Reverse-Geocode und vergleicht erwarteten Bezirk + Straßen-Substring. Test wird unter `pnpm test:unit` ausgeführt mit Mock-Layer oder hinter `RUN_NETWORK_TESTS=1`-Env-Flag.
   - `home-quick-links.svelte` (aus Story 2.11) konsumiert das Array und rendert 5 `<a href={buildExploreHref(slug, locale)}>{label}</a>`.

3. **AC-3 (Layer-Teaser-Content):**
   **Given** 5 Layer-Cards in `home-layer-teasers.svelte` (Story 2.11) brauchen finalen Text + Asset-Verweis.
   **When** ich `src/lib/content/home-layer-teasers.ts` befülle.
   **Then**:
   - Schema pro Eintrag: `{ layerId: string; title_de: string; title_en?: string | null; lead_de: string; lead_en?: string | null; screenshot: string }`. `title_en`/`lead_en` bleiben `null` Phase 1 (DE-only-Lock).
   - 5 Einträge: Klima (`klima-pet-2022` oder Cluster-Verweis), Lärm (`laerm-2023`), Wohnlagen (`wohnlagen-2024`), Verkehr (`oepnv-naechste-stops` oder Cluster-Verweis), Geschichte (`stolpersteine`).
   - Lead-Texte sind ≤ 140 Zeichen, redaktionell verfasst (kein Manifest-Duplikat, kein LLM-Polish, no-ai-slop-konform).
   - `layerId` zeigt auf valide Layer-Long-Form-Pages aus Story 2.5a (`/layer/[slug]`). Test prüft alle 5 `layerId` gegen `MANIFEST.json` und schlägt fehl wenn ein Slug nicht existiert.
   - `screenshot`-Feld zeigt auf Pfad aus AC-4 (`static/screenshots/home/{slug}.webp`).
   - `home-layer-teasers.svelte` aus Story 2.11 swappt Placeholder-DIV auf `<img srcset="...1x.webp 1x, ...2x.webp 2x" loading="lazy">`.

4. **AC-4 (Atlas-Screenshot-Asset-Konvention + Manifest):**
   **Given** Screenshots werden händisch erstellt (User-Lock 2026-05-15-PM, keine Playwright-Pipeline).
   **When** ich Assets ins Repo committe.
   **Then**:
   - Pfad-Schema: `static/screenshots/home/{slug}.webp` (1×) und `static/screenshots/home/{slug}@2x.webp` (Retina 2×).
   - Slug-Naming kebab-case, Pflicht-Set für Phase 1: `klima.webp`, `laerm.webp`, `wohnlagen.webp`, `verkehr.webp`, `geschichte.webp`, `hero-default.webp`, `og-default.webp`.
   - Aspect-Ratios pro Slot:
     - Layer-Teaser-Card: 4:3 (1200×900 / 600×450).
     - Hero-Above-Fold: 16:9 (1920×1080).
     - OG-Default: 1.91:1 (1200×630).
     - Mobile-Hero: 9:16 optional (1080×1920).
   - Format WebP `quality=85` (via `cwebp -q 85`). PNG-Fallback nur falls WebP-Decoder-Probleme. KEIN JPEG.
   - `src/lib/content/screenshot-manifest.ts` exportiert typesafe Pfade pro Slug + Aspect:
     ```ts
     export const SCREENSHOT_MANIFEST = {
       klima:        { 1: '/screenshots/home/klima.webp',        2: '/screenshots/home/klima@2x.webp',        aspect: '4/3' },
       laerm:        { 1: '/screenshots/home/laerm.webp',        2: '/screenshots/home/laerm@2x.webp',        aspect: '4/3' },
       wohnlagen:    { 1: '/screenshots/home/wohnlagen.webp',    2: '/screenshots/home/wohnlagen@2x.webp',    aspect: '4/3' },
       verkehr:      { 1: '/screenshots/home/verkehr.webp',      2: '/screenshots/home/verkehr@2x.webp',      aspect: '4/3' },
       geschichte:   { 1: '/screenshots/home/geschichte.webp',   2: '/screenshots/home/geschichte@2x.webp',   aspect: '4/3' },
       'hero-default': { 1: '/screenshots/home/hero-default.webp', 2: '/screenshots/home/hero-default@2x.webp', aspect: '16/9' },
       'og-default':   { 1: '/screenshots/home/og-default.webp',   2: '/screenshots/home/og-default@2x.webp',   aspect: '1.91/1' }
     } as const;
     ```
   - Existenz-Test: `src/lib/content/screenshot-manifest.test.ts` prüft mit Node-`fs.existsSync` (in Test-Boundary, nicht Browser-Bundle) jeden Pfad auf File-Existenz im `static/`-Tree.
   - Komponenten (Story 2.11) konsumieren das Manifest, NICHT hardcoded Pfade.

5. **AC-5 (Screenshot-Workflow-Runbook):**
   **Given** Content-Maintainer brauchen reproduzierbares Vorgehen.
   **When** ich `docs/runbooks/atlas-screenshot-workflow.md` schreibe.
   **Then**:
   - Runbook beschreibt:
     1. Atlas-URL inkl. Bbox/Zoom/Layers für jeden Slug (`klima` zeigt z.B. PET-Layer auf Brandenburger Tor-Bbox).
     2. Browser-Setup: Chrome/Firefox, Zoom 100%, Device-Pixel-Ratio Force 2× für `@2x`-Variante.
     3. Bbox-Setzen via URL-Query (`?bbox=...`) damit Screenshot-Reproduktion deterministisch ist.
     4. MapLibre-Style-Pflicht: aktueller Plex-Cartography-Style (keine Dev-Styles).
     5. Asset-Capture: macOS `Cmd+Shift+4` Bereich oder Firefox Developer-Edition Screenshot-DPR-Override.
     6. Optimizer-Befehl: `cwebp -q 85 -o klima.webp klima.png` (Brew `brew install webp`).
     7. Commit-Konvention: ein Commit pro Slug + Optimizer-Diff im Body.
   - Runbook ≤ 200 Zeilen, Plex-Mono-Code-Blocks, Plex-Sans-Prose.

6. **AC-6 (Top-Kieze-Build-Time-Resolution):**
   **Given** Top-5-Kieze sollen sich bei Daten-Update automatisch anpassen.
   **When** ich `src/lib/content/home-top-kieze.ts` implementiere.
   **Then**:
   - Modul exportiert `HOME_TOP_KIEZE: ReadonlyArray<HomeTopKiezEntry>` mit Schema `{ slug: string; name_de: string; name_en?: string | null; bezirkSlug: string; overallScore: number }`. `name_en` bleibt `null` Phase 1.
   - Resolution-Strategie zur Build-Zeit über `getKiezScoreTop(5)` aus Story 2.9a (oder direkt aus `kiez_score`-Tabelle wenn 2.9a noch nicht gemerged → temporärer Read aus `static/kiez-scores/kiez-scores.json` aus Story 1.28).
   - Sortierung: `overallScore` absteigend, NaN/null-Einträge an Listen-Ende oder ausgefiltert.
   - Disclaimer-Microcopy „Score ist statistisch, nicht normativ" (DE) / „Score is statistical, not normative" (EN). Re-use aus Story 2.9b `editorial-config.ts`-Variant oder neu `home-top-kieze-disclaimer`.
   - `home-top-kieze.svelte` (Story 2.11) liest `HOME_TOP_KIEZE` und rendert 5 `<a href="/kiez/{slug}">{name}</a>` plus Score-Zahl in Plex-Mono.
   - Test: Mock-Aggregat liefert 5 Test-Slugs, Komponenten-Render zeigt 5 Anchor + Plex-Mono-Zahlen.
   - Wenn `kiez_score` leer ist (Story 2.0/2.9a noch nicht befüllt): Build-Time-Resolver returnt leeres Array, `home-top-kieze.svelte` rendert Section nicht oder zeigt „Daten kommen bald"-Placeholder hinter Feature-Flag.

7. **AC-7 (Bezirks-Featured-Auswahl):**
   **Given** 4 Bezirks-Cards editorial-fix.
   **When** ich `src/lib/content/home-featured-bezirke.ts` als manuell-kuratierte Liste anlege.
   **Then**:
   - Schema: `{ slug: string; name_de: string; name_en?: string | null; rationale: string }`. `name_en` bleibt `null` Phase 1.
   - 4 Bezirks-Slugs als Konstanten mit Rationale-Kommentar (z.B. „Friedrichshain-Kreuzberg" → Begründung Mietspiegel-Hotspot + Lärm-Belastung als Beispiel-Cluster).
   - Auswahl Phase 1 hartkodiert, KEIN Rotations-Mechanismus (User-Lock).
   - Empfehlung-Vorschlag im PR-Body als Diskussions-Grundlage: Mitte / Friedrichshain-Kreuzberg / Neukölln / Pankow als 4er-Set (geographisch verteilt, demografisch unterschiedlich, hohe Such-Volumen). User entscheidet final.
   - `home-featured-bezirke.svelte` (Story 2.11) konsumiert das Array und rendert 4 `<a href="/bezirk/{slug}">`.
   - Test: Schema-Validation per Valibot, Slug-Existenz gegen Bezirks-Slug-Liste (12 Berlin-Bezirke).

8. **AC-8 (Open-Block-Content + Daten-Quellen-Liste):**
   **Given** „Offen + ohne Tracking"-Block braucht Text + Daten-Lieferanten-Liste.
   **When** ich Paraglide-Keys aus AC-1 befülle plus `src/lib/content/home-data-sources.ts` exportiere.
   **Then**:
   - `home-data-sources.ts` Schema: `{ name: string; url: string; license: string; locale_aware: boolean }`.
   - 6-10 Quellen: Berlin Open Data (`daten.berlin.de`), ODIS (`odis-berlin.de`), OpenStreetMap (`openstreetmap.org`), Stolpersteine-Initiative (`stolpersteine-berlin.de`), Geoportal Berlin (`geoportal.berlin.de`), DWD (Klima), BVG (für `oepnv-stops`-Index), evtl. weitere.
   - `home-open-block.svelte` rendert Plex-Serif h2 + Plex-Sans Lead + 4 Bullets (aus Paraglide) + Source-Liste als kompakter Plex-Sans `--text-xs` Block mit Inline-Verlinkung.
   - Verlinkungen auf `/methodik`, `/lizenzen` und GitHub-Repo-URL als sekundäre Links. GitHub-URL-Konstante in `src/lib/data/constants.ts` ergänzen (`GITHUB_REPO_URL`).
   - KEIN Logo-Strip in Phase 1 (User-Lock: Maintenance-Aufwand + Brand-Risiko zu hoch).
   - Test: Snapshot + Stigma-Lint gegen Source-Block (kein „lebenswert").

9. **AC-9 (FAQ-Section-Auswahl Top-5):**
   **Given** Story 2.5b `faq_qna`-Aggregat liefert Inventar.
   **When** ich `src/lib/content/home-faq-selection.ts` kuratiere.
   **Then**:
   - Schema: geordnete Liste von `{ qnaId: string }` mit max 5 Einträgen (Build-Time-Hint).
   - Auswahl-Strategie: 5 Top-Level-Fragen die Long-Tail-Search-Wert haben (z.B. „Wie offen sind die Daten?", „Wie aktuell sind Werte?", „Warum gibt es keine Sterne-Bewertung?"). Final-Set entscheidet User per Co-Design-Session.
   - Inhalte werden NICHT dupliziert. `home-faq-section.svelte` (Story 2.11) liest `home-faq-selection.ts` und resolved zur Render-Zeit aus `faq_qna`-Aggregat (Story 2.5b `getFaqQna(id)`).
   - FAQ-Sektion-Heading „Häufig gefragt" (DE) / „Frequently asked" (EN) plus Archiv-Link wenn ein voller `/faq`-Index existiert (falls nicht, Link entfällt).
   - JSON-LD `FAQPage` für die Hero-FAQ-Auswahl wird zusätzlich zum Hero-`AboutPage`-JSON-LD (Story 2.11) im Head emittiert. Generator aus Story 2.2 `buildFaqPage` konsumiert.
   - Wenn Story 2.5b noch nicht gemerged ist und `faq_qna`-Aggregat leer: `home-faq-section.svelte` bleibt im Feature-Flag-Off (Story 2.11 AC-4 setzt diesen Flag).
   - Test: Snapshot pro Locale, `qnaId`-Existenz-Check gegen Story-2.5b-Inventar.

10. **AC-10 (Consulting-CTA DE-only):**
    **Given** Hebel-#2-Beratungs-CTA (Decision-Lock 2026-05-15-PM).
    **When** ich `src/lib/components/home/consulting-cta.svelte` als schmalen Block vor dem Footer implementiere.
    **Then**:
    - Plex-Serif h2: „Datenraum für Verwaltung und Civic-Tech". Paraglide-Key `home_consulting_cta_title`.
    - Plex-Sans Lead (1-2 Sätze über DPIA / Open-Data-Strategie / Atlas-Anpassung). Paraglide-Key `home_consulting_cta_lead`.
    - Sekundär-Button „Anfrage senden". Paraglide-Key `home_consulting_cta_button_label`.
    - Mailto-Link: `mailto:beratung@navigator.berlin?subject=Datenraum-Beratungsanfrage`.
    - Visueller Style: schmaler als Hero-Sektionen, KEIN Akzent-Hintergrund, KEIN Marketing-CTA-Pattern. Dezent, einzeilige Plex-Serif h2, Lead-Absatz, sekundär-gestylter Button.
    - Komponente ≤ 150 LOC, Test mit Render + Mailto-Href-Verifikation.
    - `home-beta.svelte` (Story 2.11) bindet `consulting-cta.svelte` zwischen Updates-Teaser (Sektion 9) und Hairline-Footer-Trenner (Sektion 10) ein. Strenger Position-Lock: VOR dem Footer, NACH dem Updates-Teaser.
    - Open-Question 1: Email-Adresse `beratung@navigator.berlin` ist Production-Mail-Mapping. Dev-Start bestätigt ob Adresse aktiv ist oder Fallback `hey@navigator.berlin` (aus `src/lib/utils/contact.ts FEEDBACK_EMAIL`) genutzt wird.

11. **AC-11 (Default-OG-Bild DE-only Phase 1):**
    **Given** Open-Graph + Twitter-Card auf `/` brauchen Default-Image.
    **When** ich `static/screenshots/home/og-default.webp` (1200×630) erstelle.
    **Then**:
    - Bild zeigt Atlas-Render mit Plex-Wortmarke + DE-Tagline „Berlin in Schichten · Open Data ohne Tracking".
    - NUR DE-Variante: `og-default.webp` (1×) plus `og-default@2x.webp`. `og-default.en.webp` ist Phase-3-Scope, NICHT in 2.12.
    - Falls Brand-Overlay manuell zu komplex: Satori-OG-Pipeline aus Story 2.6 generiert Brand-Layer (Plex-Wortmarke + Tagline), Hintergrund bleibt manueller Atlas-Screenshot. Bei diesem Hybrid-Pfad: `og:image`-URL pointed auf `/api/og/home.png` der zur Build-Zeit den Screenshot lädt + Satori-Layer rüberlegt.
    - Referenz in `home-beta.svelte` `<svelte:head>` `og:image` und `twitter:image`.
    - Test: File-Existenz im `static/`-Tree.

12. **AC-12 (Performance-Budget mit Bild-Assets):**
    **Given** NFR-P6 Page-Weight Landing ≤ 500 KB, Story-2.11-Ziel ≤ 200 KB Initial.
    **When** ich Screenshots einbinde.
    **Then**:
    - Hero-Above-Fold-Bild Eager-Load (`loading="eager"`, `fetchpriority="high"`), max 80 KB WebP.
    - Layer-Teaser-Bilder + Top-Kieze-Bilder Lazy (`loading="lazy"`).
    - Alle Bilder mit `srcset="...1x.webp 1x, ...2x.webp 2x"` und `sizes`-Attribut breakpoint-aware.
    - Below-Fold-Bild-Gesamtlast < 300 KB.
    - Page-Weight-Check via `pnpm build` + Custom-Script oder Lighthouse-CI.
    - Test: `home-layer-teasers.svelte` Render-Output enthält `loading="lazy"` und `srcset`-Attribut pro `<img>`.

13. **AC-13 (Content-Maintainer-Runbook):**
    **Given** Content-Updates sollen ohne Code-Deploy möglich sein.
    **When** ich `docs/runbooks/home-landing-content-update.md` schreibe.
    **Then**:
    - Runbook beschreibt 6 Update-Pfade:
      1. Paraglide-Message-Edit (`messages/de.json`, `messages/en.json` + Re-Compile).
      2. Quick-Link-Liste anpassen (`src/lib/data/home-quick-links.ts` mit Geocoder-Test-Re-Run).
      3. Bezirks-Featured-Liste tauschen (`src/lib/content/home-featured-bezirke.ts`).
      4. Screenshot-Update-Prozess (Verweis auf `atlas-screenshot-workflow.md`).
      5. FAQ-Auswahl ändern (`src/lib/content/home-faq-selection.ts`).
      6. CTA-Copy-Edit (Paraglide-Keys `home_consulting_cta_*`).
    - Pro Pfad: Schritt-Anleitung + Test-Befehl + Re-Build-Command.
    - Runbook ≤ 250 Zeilen, Plex-Mono-Code-Blocks.
    - Ergänzung: Kein Code-Deploy nötig für reinen Content-Change. Alle Slots in TS-Konstanten oder Paraglide-Messages. Re-Build (`pnpm build`) und Re-Deploy genügt.

14. **AC-14 (TDD-Mandat):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** für jede neue Content-Datei (`home-quick-links.test.ts`, `home-layer-teasers.test.ts`, `home-top-kieze.test.ts`, `home-featured-bezirke.test.ts`, `home-data-sources.test.ts`, `home-faq-selection.test.ts`, `screenshot-manifest.test.ts`) per Schema-Validation und Cross-Referenz-Check.
    - **Komponenten-Tests** für `consulting-cta.svelte` und für die jetzt-mit-Content-befüllten `home-*.svelte`-Slots aus Story 2.11.
    - **Geocoder-Verifikations-Test** für Quick-Links (siehe AC-2).
    - **Snapshot-Tests** DE-Render für Hero-Texte und JSON-LD-Output (EN-Snapshots Phase-3-Folge-Story).
    - **E2E-Erweiterung** in `tests/e2e/home-landing.e2e.ts` (aus Story 2.11): Layer-Teaser-Bilder laden, Consulting-CTA-Mailto-Link, OG-Image-Existenz.
    - Coverage-Ziel: Content-Konstanten ≥ 80%, Komponenten ≥ 80%.

## Tasks / Subtasks

- [ ] **T1: Paraglide-Messages für Hero-Content** (AC: 1)
  - [ ] T1.1: Co-Design-Session mit User: Hero-h1 + Lead + 4 Open-Block-Bullets als Vorschlags-Liste, User wählt.
  - [ ] T1.2: `messages/de.json` + `messages/en.json` um ~20 neue Keys erweitern.
  - [ ] T1.3: `pnpm paraglide:compile` (oder Auto-Compile in Build-Pipeline) bestätigt typesafe Resolutions.
  - [ ] T1.4: Story-2.11-Komponenten swappen hardcoded DE auf Paraglide-Resolutions.
  - [ ] T1.5: Stigma-Lint-Test (`feedback_no_lebenswert.md`, `feedback_no_em_dashes.md`) als Build-Step.
  - [ ] T1.6: Snapshot-Test pro Locale.

- [ ] **T2: Quick-Link-Daten + Geocoder-Verifikation** (AC: 2)
  - [ ] T2.1: `src/lib/data/home-quick-links.ts` mit 5 Adressen.
  - [ ] T2.2: `home-quick-links.test.ts` Geocoder-Round-Trip-Test (hinter `RUN_NETWORK_TESTS=1`-Flag falls Network-Tests in CI deaktiviert).
  - [ ] T2.3: Falls Round-Trip-Test instabil: Coords-Fallback-Test (Reverse-Geocode `coords` → Display-Name-Match-Substring).
  - [ ] T2.4: `home-quick-links.svelte` (Story 2.11) konsumiert.

- [ ] **T3: Layer-Teaser-Content** (AC: 3)
  - [ ] T3.1: `src/lib/content/home-layer-teasers.ts` mit 5 Einträgen (redaktioneller Text, no-ai-slop).
  - [ ] T3.2: `home-layer-teasers.test.ts` Schema + Layer-Slug-Existenz-Check gegen Manifest.
  - [ ] T3.3: `home-layer-teasers.svelte` (Story 2.11) swappt Placeholder auf `<img>`-Tags.

- [ ] **T4: Atlas-Screenshot-Assets + Manifest** (AC: 4, 5)
  - [ ] T4.1: Screenshot-Workflow-Runbook `docs/runbooks/atlas-screenshot-workflow.md`.
  - [ ] T4.2: 5 Layer-Screenshots + 1 Hero-Default + 1 OG-Default (1× + 2× je Slug = 14 WebP-Files) manuell erstellen + via `cwebp` optimieren.
  - [ ] T4.3: `src/lib/content/screenshot-manifest.ts` mit typed Pfaden + Aspect-Ratios.
  - [ ] T4.4: `screenshot-manifest.test.ts` File-Existenz-Check.
  - [ ] T4.5: `.gitattributes` für `*.webp` als Binary (kein Diff-Spam) ergänzen falls noch nicht da.

- [ ] **T5: Top-Kieze + Bezirks-Featured + Open-Block-Sources** (AC: 6, 7, 8)
  - [ ] T5.1: `src/lib/content/home-top-kieze.ts` mit Build-Time-Resolution.
  - [ ] T5.2: `src/lib/content/home-featured-bezirke.ts` mit 4 Slugs + Rationale-Kommentare.
  - [ ] T5.3: `src/lib/content/home-data-sources.ts` mit 6-10 Quellen.
  - [ ] T5.4: `src/lib/data/constants.ts` um `GITHUB_REPO_URL` ergänzen.
  - [ ] T5.5: Tests pro Datei.

- [ ] **T6: FAQ-Section-Auswahl** (AC: 9)
  - [ ] T6.1: Co-Design-Session: 5 Top-Level-FAQ-Fragen mit User aus Story-2.5b-Inventar.
  - [ ] T6.2: `src/lib/content/home-faq-selection.ts` mit 5 IDs.
  - [ ] T6.3: `home-faq-section.svelte` (Story 2.11) resolved aus `faq_qna` zur Render-Zeit.
  - [ ] T6.4: JSON-LD `FAQPage` zusätzlich im Hero-Head.
  - [ ] T6.5: Feature-Flag-Off-Pfad wenn 2.5b leer.

- [ ] **T7: Consulting-CTA** (AC: 10)
  - [ ] T7.1: `src/lib/components/home/consulting-cta.svelte` (Plex-Serif h2 + Lead + Mailto-Button).
  - [ ] T7.2: Position in `home-beta.svelte` zwischen Updates-Teaser und Hairline-Trenner.
  - [ ] T7.3: Test-Render + Mailto-Href-Verifikation.

- [ ] **T8: Default-OG-Bild** (AC: 11)
  - [ ] T8.1: Atlas-Screenshot für OG-Hintergrund (Bbox Berlin-Mitte oder Brandenburger-Tor-Region, repräsentativ).
  - [ ] T8.2: Brand-Overlay manuell ODER via Satori (Story-2.6-Pipeline) je nach Komplexität.
  - [ ] T8.3: Locale-Varianten `og-default.de.webp` + `og-default.en.webp` plus `@2x`.
  - [ ] T8.4: `og:image`/`twitter:image`-References in `home-beta.svelte`.

- [ ] **T9: Performance-Budget-Verifikation + Maintainer-Runbook** (AC: 12, 13)
  - [ ] T9.1: `loading`/`fetchpriority`/`srcset`-Attribute auf alle Bilder.
  - [ ] T9.2: `pnpm build` + Lighthouse-Run + Bild-Last-Inspektion.
  - [ ] T9.3: `docs/runbooks/home-landing-content-update.md` schreiben.

- [ ] **T10: Final-Verifikation** (AC: 1-14)
  - [ ] T10.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T10.2: `pnpm check` 0 Errors.
  - [ ] T10.3: `pnpm build` läuft, alle Assets im Output.
  - [ ] T10.4: Browser-Verify DE + EN, Coming-Soon-Modus + Beta-Modus.
  - [ ] T10.5: Lighthouse-Mobile-Run: LCP < 1.5s, Page-Weight < 500 KB, SEO ≥ 95.
  - [ ] T10.6: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung zu Story 2.11

Story 2.11 baut die **Strukturen + Komponenten + SEO-Skeleton** mit hartkodierten DE-Platzhaltern. Story 2.12 liefert die **Inhalte hinein** (Paraglide-Messages, Content-Konstanten, Screenshot-Assets) plus die zusätzliche `consulting-cta.svelte`-Komponente.

Sequenziell: 2.11 muss `review` oder `done` sein, bevor 2.12 startet, weil 2.12 die Komponenten von 2.11 modifiziert.

### Screenshot-Strategie

User-Lock 2026-05-15-PM: HÄNDISCH erstellt, keine Playwright/mbgl-renderer-Pipeline in Phase 1. Begründung: Pipeline-Aufwand (Tile-Cache, deterministischer Style-Render, CI-Integration) übersteigt Phase-1-Nutzen. Manuelle Kuration garantiert visuelle Qualität.

Phase-2-Backlog: Automatisierte Screenshot-Pipeline wenn Asset-Set wächst (alle 42 Layer + alle 12 Bezirke + alle 138 Kieze).

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `src/lib/components/atlas/animated-logo.svelte` (für Brand-Overlay falls relevant).
- `src/lib/utils/contact.ts` `FEEDBACK_EMAIL` (Fallback für Consulting-CTA, siehe AC-10 Open-Question).
- `src/lib/data/manifest.ts` `loadManifest()` (Layer-Slug-Existenz-Check in AC-3-Test).
- Story 2.6 OG-Pipeline (Satori, falls Brand-Overlay komplex).
- Story 2.5b `getFaqQna(id)` Read-Helper (Render-Zeit-Resolution in AC-9).
- Story 2.9a `getKiezScoreTop(limit)` Read-Helper (Build-Zeit-Resolution in AC-6).

### Cross-Story-Dependencies + Sequencing-Empfehlung

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 2.11 | ready-for-dev | MUSS `done` vor 2.12-Start (Komponenten-Slots existieren, `phase.ts` liefert). |
| 2.0 | review | `kiez_score`-Tabelle für Top-Kieze. Fallback `static/kiez-scores/kiez-scores.json` (Story 1.28). |
| 2.5b | ready-for-dev | `faq_qna`-Aggregat. Wenn leer, FAQ-Block hinter Feature-Flag (Story 2.11 AC-4 Flag). |
| 2.6 | ready-for-dev | OG-Pipeline für Default-OG-Brand-Overlay. Alternative: manueller Screenshot mit Brand-Layer in Bild-Editor. |
| 2.9a | ready-for-dev | `getKiezScoreTop(5)`-Helper. Fallback wie 2.0. |
| 2.13 | review (merged 2026-05-16) | Updates-Teaser-Konsum: `loadUpdatesFromModules` + `latestUpdates` exportiert. 2.11 hat Slot gebaut, 2.12 ergänzt nur Paraglide-Keys `home_updates_teaser_title`/`home_updates_teaser_archive_link_label`. |
| 3.1 | ready-for-dev | Paraglide-Setup-Reduce DE-only. 2.12 schreibt nur DE-Messages. |
| 3.2 | verschoben Phase 3 | EN-UI-Coverage. Out-of-Scope 2.12 (DE-only-Lock). |

**Empfehlung**: 2.12 startet erst wenn 2.11 + 2.5b + 2.9a `done` sind. 3.1 läuft parallel, 2.12 schreibt direkt Paraglide-DE-Messages und akzeptiert dass Paraglide-Resolver erst mit 3.1-Setup vollständig funktioniert.

### Co-Design-Sessions

Zwei Co-Design-Sessions mit User sind Pflicht vor Massen-Implementation:

1. **Hero-Texte** (AC-1): h1 + Lead + 4 Open-Block-Bullets. User wählt aus Vorschlags-Liste oder gibt Final-Wording vor.
2. **FAQ-Top-5** (AC-9): aus dem Story-2.5b-Inventar 5 Fragen kuratieren.

Sessions können in einer Iteration kombiniert werden falls User-Verfügbarkeit knapp ist.

### no-ai-slop + de-konzept-erstellung Disziplin

Hero-Texte + Layer-Teaser-Leads + Open-Block-Bullets sind **redaktionelle Prosa**. Skill `no-ai-slop` + `de-konzept-erstellung` greifen:
- Aktive Verben statt Funktionsverben („zeigt" statt „bietet die Möglichkeit zu sehen").
- Kurze Sätze, kein Calque-Deutsch („durchführen" → „machen").
- Keine 3-Adjektiv-Stacks („schnell, einfach, intuitiv" → ein präzises Adjektiv).
- Keine em-dashes (Komma, Doppelpunkt, Mittelpunkt `·`, neuer Satz).
- Keine Marketing-Floskeln („revolutionär", „nahtlos", „kraftvoll").
- Belegte Aussagen: jeder Datenwert hat eine Quelle. Wenn ein Hero-Bullet behauptet „ohne Tracking", muss `datenschutz.md` (Story 4.6) das tatsächlich tragen.

### Bild-Optimizer-Setup

Lokales Tooling für `cwebp`:
```bash
brew install webp           # macOS
# oder
sudo apt install webp       # Ubuntu/Debian
```

CI-Step für WebP-Validation (Story 4.3 ergänzt):
```bash
find static/screenshots -name "*.webp" -exec dwebp -h {} \;
```

Falls `cwebp` nicht lokal verfügbar: Online-Tool `squoosh.app` (Mozilla, EU-server-fähig, kein US-Drittanbieter im Production-Pfad weil Asset-Erzeugung, nicht Runtime).

### MUST-Rules-Anwendung

- **#1 @lucide/svelte**: für `consulting-cta.svelte`-Icons (z.B. `Mail`-Icon).
- **#2 Files <500 Zeilen**: alle neuen Files klein, `consulting-cta.svelte` ≤ 150 LOC, Content-Files reine TS-Konstanten ≤ 100 LOC.
- **#3 Bestehende Funktionen prüfen**: Re-Use-Liste oben.
- **#7 TypeScript strict**: Schema pro Content-Konstanten typed, Valibot für Runtime-Validation.
- **#10 Cookieless**: keine LocalStorage-Reads in Content-Files.
- **#11 Kein US-Drittanbieter**: WebP-Tooling lokal, Geocoder via existierendem Nominatim-Proxy.
- **#12 Provenance**: FAQ-Antworten enthalten Quellen-Attribution (aus Story 2.5b geerbt).
- **#13 A11y-First**: alle `<img>` mit `alt`-Text (aus `home-layer-teasers.ts` `title_*`-Feld + Description-Slot).
- **#14 i18n-First**: alle UI-Strings via Paraglide.

### Stigma + Editorial-Disziplin

- Top-Kieze-Section nutzt Disclaimer „Score ist statistisch, nicht normativ".
- Bezirks-Featured-Cards nutzen keine evaluative Sprache („bester Bezirk").
- Consulting-CTA enthält KEINE Versprechen über Ergebnisse („Daten-Klarheit garantiert").
- Default-OG-Tagline „Berlin in Schichten · Open Data ohne Tracking" ist faktisch + belegbar.

### Open-Questions vor Dev-Start

1. **Consulting-CTA-Email** (AC-10): `beratung@navigator.berlin` Production-Mail aktiv oder Fallback auf `hey@navigator.berlin` aus `FEEDBACK_EMAIL`? **Default-Decision**: `hey@navigator.berlin` mit Subject `Datenraum-Beratungsanfrage` falls `beratung@` noch nicht aktiv. User bestätigt beim Dev-Start.

2. **4 Featured-Bezirke** (AC-7): Welche 4? Vorschlag Mitte / Friedrichshain-Kreuzberg / Neukölln / Pankow als geographisch + demografisch verteilte Auswahl. **Default-Decision**: Vorschlag im PR-Body, User entscheidet final.

3. **Hero-Default-Screenshot-Bbox** (AC-4): Welche Region für `hero-default.webp` (1920×1080)? Vorschlag Berlin-Mitte mit Spreebogen, weil Brandenburger Tor + Reichstag + Spree als Erkennungswert. Alternative: Berlin-weit als Übersicht. **Default-Decision**: Berlin-Mitte-Spreebogen-Render als visuell stärkster Anker.

4. **Screenshot-Workflow-Tooling** (AC-5): macOS-native `Cmd+Shift+4` reicht für 1×-Variante. Für 2×-Retina-Variante: Firefox Developer-Edition mit DPR-Override oder Chrome-DevTools-Screenshot mit Device-Pixel-Ratio-Force? **Default-Decision**: Firefox Developer-Edition wegen besserer DPR-Kontrolle. User bestätigt Tooling-Wahl.

5. **OG-Brand-Overlay manuell oder Satori** (AC-11): Manuell in Bild-Editor (Affinity Photo, Figma) ist schneller für 1× Asset, Satori-Pipeline wäre wiederverwendbar für andere OG-Bilder. **Default-Decision**: Manuell für `og-default.webp`, Satori-Pipeline aus Story 2.6 für dynamische OG-Bilder (Bezirk/Kiez/Layer). Wenn Satori-Pipeline aus 2.6 schon bereit ist, kann Default-OG auch dort generiert werden mit Atlas-Screenshot als Background-Layer.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L1470-L1547`
- Story 2.11: `_bmad-output/implementation-artifacts/2-11-static-hero-landing-atlas-move-explore.md`
- Story 2.5b: `_bmad-output/implementation-artifacts/2-5b-faq-section-template-daten-slots.md`
- Story 2.6: `_bmad-output/implementation-artifacts/2-6-og-image-pipeline-bezirk-kiez-layer.md`
- Story 2.9a: `_bmad-output/implementation-artifacts/2-9a-kiez-score-bezirks-score-aggregat-berechnung.md`
- Memory `project_atlas_explore_route.md`, `feedback_no_lebenswert.md`, `feedback_no_em_dashes.md`, `project_kiez_score_naming.md`, `project_satori_font_pipeline.md`
- Skills `no-ai-slop`, `de-konzept-erstellung`
- Bestand Paraglide: `src/lib/paraglide/runtime.js`, `messages/de.json`, `messages/en.json`
- Bestand Contact: `src/lib/utils/contact.ts`
- Bestand Manifest: `src/lib/data/manifest.ts`
- Runbook-Templates: `docs/runbooks/bookmark-storage.md`, `docs/runbooks/tile-provider-switch.md` (als Format-Vorlage)

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
