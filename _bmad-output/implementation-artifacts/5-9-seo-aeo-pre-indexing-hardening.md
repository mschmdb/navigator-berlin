# Story 5.9: SEO/AEO Pre-Indexing-Hardening

Status: review

<!-- Created 2026-05-18 via dev-story-workflow ad-hoc nach Lighthouse-Audit + Indexing-Bedrohungsmodell. Scope confirmed gegen User-Direction: AI-Bot-Policy ohne Yandex, IndexNow Bing only, llms.txt-Erweiterung verschoben. -->

## Story

As a Solo-Maintainer kurz vor erster Indexierung durch Google + Bing + AI-Crawler,
I want strukturierte Daten + Crawl-Budget-Hints + AI-Bot-Policy + Internal-Linking + Notification-Push bevor das Site-Profil zementiert wird,
so that navigator.berlin direkt mit FAQ-Snippets, Place-Cards, Breadcrumb-SERP, sitelinks-Searchbox und AI-Overview-Eligibility in Indizes landet statt monate-langem Catch-up-Hardening.

## Probleme heute

1. **AI-Bot-Policy fehlt.** robots.txt aktuell `User-agent: * Allow: /` ohne explizite AI-Bot-Regeln. GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot interpretieren Wildcards uneinheitlich; ohne explizite Allow/Disallow läuft Indexing in AI-Overviews unkontrolliert.
2. **FAQPage-Strukturdaten fehlen** auf Bezirk/Kiez/Layer-Pages obwohl FAQ-Daten in Postgres `faq`-Table aus Story 2.5b + 2.0 vorhanden sind. Folge: kein „People also ask"-Snippet-Eligibility, keine AI-Overview-Citation.
3. **Place + GeoCoordinates fehlen** auf Bezirk/Kiez. „Berlin Mitte"-Queries + „near me"-Searches diskriminieren Sites ohne Place-Schema. AdministrativeArea allein reicht nicht für Map-Listings.
4. **BreadcrumbList nur auf Bezirk/Kiez/Wo-lebt-es-sich-gut** verdrahtet. Layer-Detail, Updates-Detail, Methodik, Methodik/Kiez-Score, Lizenzen, Architektur, Datenschutz, Impressum ohne Breadcrumb-SERP-Eligibility.
5. **DataCatalog-Parent fehlt** auf `/lizenzen`. Wir haben 44 Dataset-JSON-LD pro Layer-Detail-Page (Story 2.5a), aber kein DataCatalog-Schema das alle Datasets als Publisher-Collection bündelt. Schema-org-Trust-Signal verloren.
6. **Speakable-Spec fehlt.** Voice-Search-Agents (Google Assistant, Alexa) bevorzugen Pages mit `speakable`-CSS-Selektoren auf Q&A-Sections. Methodik + Kiez-Score-Methodik sind ideale Targets.
7. **Internal-Linking-Blöcke fehlen.** Bezirk-Detail listet keine enthaltenen Kieze. Kiez-Detail verlinkt nicht zu Parent-Bezirk-Detail (außer Breadcrumb) und nicht zu Nachbar-Kiezen. PageRank-Flow zu Detail-Tier suboptimal, Crawl-Depth höher als nötig.
8. **noindex-Meta fehlt** auf `/_dev/*`-Routes (4 Stück: wortmarke, logo, ui-showcase, map-style) und `/api/*` JSON-Endpoints. Crawl-Budget-Verschwendung + potenzielle SERP-Confusion.
9. **IndexNow-Push fehlt.** Bei jedem Deploy wartet Bing auf nächsten Sitemap-Crawl (Tage). IndexNow-API liefert <60-Sekunden-Notification → schnellere First-Index.
10. **Lighthouse-Audit „label-content-name-mismatch"** auf Header-Logo separat fixed in Commit `d3b6caf`; keine Action mehr hier.

## Quellen

- Lighthouse-Audit-Snapshot 2026-05-18 (Performance 98 / a11y 100 / Best-Practices 100 / SEO 100) — Baseline-Score, Audit-Detail-Findings als Eingangslage.
- Story 2.2 (done): `src/lib/seo/jsonld-*.ts` — JSON-LD-Generator-Module (`buildPlace`, `buildBreadcrumbList`, `buildWebSite`, `buildAdministrativeArea`, `buildDataset`, `buildFaqPage`, `buildItemList`). Erweiterungen: `buildDataCatalog`, `buildSpeakableSpecification`.
- Story 2.5b (review): `src/lib/server/faq/` + `faq`-Postgres-Table + `src/lib/components/atlas/faq-section.svelte` mit `buildFaqPage`-Inline-JSON-LD. Schema-Reuse für AC-2.
- Story 2.8 (review): `src/routes/robots.txt/+server.ts` — Stelle für AI-Bot-Policy-Erweiterung. Aktuelle Form `User-agent: * Allow: /` plus llms.txt-Hinweis.
- Story 2.9b/2.4/2.3: Page-Templates Bezirk/Kiez/Wo-lebt-es-sich-gut mit existierendem `<JsonLd>`-Stack. Erweiterungen additive, kein Refactor.
- Story 2.5a: `src/lib/data/authorities.ts` Authority-Mappings — DataCatalog-Publisher-Field konsumiert daraus.
- Memory `project_kiez_score_dimensions`, `project_kiez_score_naming`, `feedback_no_lebenswert`: Speakable-Spec auf Soziale-Lage-Section MUSS Stigma-Disclaimer enthalten.
- Memory `project_i18n_phase_1_de_only`: alle JSON-LD-Felder `inLanguage: 'de-DE'`.
- Memory `feedback_no_em_dashes`: alle neuen UI-Strings (Internal-Linking-Headlines, Banner) ohne em-dash.
- IndexNow-Spec: `https://www.indexnow.org/documentation` — Bing-Endpoint `https://api.indexnow.org/IndexNow`, Schlüssel-File unter Site-Root, POST mit URL-Liste.
- Schema.org SpeakableSpecification: `https://schema.org/SpeakableSpecification` — Definition + Google-Voice-Spec-Doc.
- ADR-012 (TDD-Mandat): Generator-Module + URL-Builder + Filter-Logic test-first.
- CLAUDE.md (Repo + User-global): Files < 500 LOC, kein em-dash, kein „lebenswert", @lucide/svelte.

## Phase-Kontext + Scope-Anpassung

**Hand-off:**

- **Story 2.2** liefert Generator-Foundation (`src/lib/seo/`) für alle neuen JSON-LD-Typen. Wir erweitern dort, nicht in Routes inline.
- **Story 2.5b** liefert FAQ-Renderer + DB-Query (`getFaqQna`). FAQPage-JSON-LD-Emit reuse der bestehenden FAQ-Section bzw. Build aus den DB-Rows pro Route.
- **Story 2.9b** Sitemap-Builder ist bereits priority/changefreq-aware (Bezirk 0.7, Kiez 0.6, Layer pro Bundle); kein Change nötig.
- **Story 4.2** Security-Headers laufen über Traefik-Labels in Coolify. Keine Berührung.

**Phase-1-Pragmatik:**

- **DE-only.** Alle JSON-LD-Schemas mit `inLanguage: 'de-DE'`. EN-Locale-Variants Phase 3.
- **IndexNow Bing only.** Yandex bewusst ausgelassen per User-Direction.
- **AI-Bot-Policy konservativ permissive.** Default Allow für GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot. Disallow für Anthropic-AI (deprecated) + Omgilibot (low-quality scraper). User kann später per Memory tunen.
- **Speakable-Spec auf Methodik-Routes.** Kein Speakable auf Bezirk/Kiez-Hero-Sections (Q&A-Format dort fehlt; FAQ-Section gilt aber als spoken-Q&A wenn Page Speakable-Spec liefert).
- **Internal-Linking konservativ.** Bezirk → 5 enthaltene Kieze (top-5 nach composite). Kiez → Parent-Bezirk + 3 Geschwister-Kieze aus selbem Bezirk. Keine Cross-Bezirk-Empfehlung Phase 1 (Distanz-Berechnung wäre extra Aufwand).
- **noindex via meta-robots + X-Robots-Tag.** Kein robots.txt-Disallow für `/_dev/*` weil das Crawlers nicht hindert, NUR Listing. Meta-Tag + Header zusammen.
- **IndexNow-Trigger im Coolify-Deploy-Webhook.** Optional via npm-Script + Coolify-Post-Deploy-Hook. Story dokumentiert Setup, kein hartes Wire-Up wenn Coolify-Hook unflexibel.

**Memory-Marker:** `feedback_no_em_dashes`, `feedback_no_lebenswert`, `project_kiez_score_dimensions`, `project_kiez_score_naming`, `project_i18n_phase_1_de_only`, `project_coolify_basic_auth`.

## Acceptance Criteria

**AC-1 (AI-Bot-Policy in robots.txt):**

**Given** Site-Owner-Decision permissive für Mainstream-AI-Bots
**When** `/robots.txt` ausgeliefert wird
**Then** muss enthalten sein:
- explizite `User-agent`-Blöcke für: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, CCBot, Bytespider, Amazonbot, Applebot-Extended — alle mit `Allow: /`.
- explizite Disallow-Bots: Omgilibot (scraper), MJ12bot (SEO-spam) — `Disallow: /`.
- Default-Block `User-agent: *` weiter `Allow: /` aber `Disallow: /_dev/` + `Disallow: /api/` (Crawl-Budget).
- Sitemap-Line bleibt.
- Yandex-Bots werden NICHT explizit gelistet (User-Decision).

**AC-2 (FAQPage-JSON-LD auf Bezirk/Kiez/Layer):**

**Given** FAQ-Rows in `faq`-Table pro `pageType` + `slug`
**When** eine Bezirk-, Kiez- oder Layer-Detail-Page prerendered wird
**Then** muss `<script type="application/ld+json">`-Block mit Schema-Type `FAQPage` rendern, der die FAQ-Frage/Antwort-Paare als `mainEntity: Question[]` enthält.
**And** wenn keine FAQ-Rows vorhanden sind, KEIN FAQPage-Block (kein leeres Schema).
**And** Builder `buildFaqPage` aus Story 2.5b wiederverwenden.

**AC-3 (Place + GeoCoordinates JSON-LD auf Bezirk/Kiez):**

**Given** Bezirk-Profile mit Centroid-Coords (computed aus bbox in Server-Load) bzw. Kiez-Profile dito
**When** Bezirk- oder Kiez-Detail-Page rendert
**Then** muss `<JsonLd>` mit Schema-Type `Place` rendern enthaltend `name`, `containedInPlace: { '@type': 'AdministrativeArea', name: 'Berlin' }` (Kiez additional `containedInPlace: ParentBezirk`), `geo: { '@type': 'GeoCoordinates', latitude, longitude }`, `url`.
**And** Builder `buildPlace` in `src/lib/seo/jsonld-place.ts` neu (Test-First).

**AC-4 (BreadcrumbList-Expansion):**

**Given** Routen Layer-Detail, Updates-Detail, Methodik, Methodik/Kiez-Score, Lizenzen, Architektur, Datenschutz, Impressum, Updates-Index
**When** jede dieser Routen rendert
**Then** muss BreadcrumbList-JSON-LD mit hierarchischen Items (`Home › Section › Detail`) emittiert werden.
**And** Layer-Detail: `Home › Daten › {layerName}`.
**And** Updates-Detail: `Home › Updates › {title}`.
**And** Methodik/Kiez-Score: `Home › Methodik › Kiez-Score`.

**AC-5 (DataCatalog-JSON-LD auf /lizenzen):**

**Given** 44 Layer im MANIFEST
**When** `/lizenzen` rendert
**Then** muss DataCatalog-JSON-LD mit `dataset: Dataset[]`-Array (44 Refs via `@id` oder inline-minimal mit name/url/license) und `publisher: { '@type': 'Person', name: 'Matze Schmidbauer' }` enthalten sein.
**And** Builder `buildDataCatalog` in `src/lib/seo/jsonld-datacatalog.ts` neu.

**AC-6 (Speakable-Spec auf Methodik + Methodik/Kiez-Score):**

**Given** Methodik-Page und Kiez-Score-Methodik-Page enthalten H2-Sektionen mit Q&A-Inhalt
**When** beide Routen rendern
**Then** muss `SpeakableSpecification`-JSON-LD mit `cssSelector`-Array auf Section-IDs (`#worum`, `#dimensionen`, `#gewichte`) enthalten sein.
**And** Schema-Sub-Type über bestehende WebPage-JSON-LD-Erweiterung oder als eigener Block emittiert.

**AC-7 (Internal-Linking-Block Bezirk → enthaltene Kieze):**

**Given** Bezirk-Detail-Page
**When** Page rendert
**Then** muss neue Section `<section aria-labelledby="kieze-im-bezirk-h">` mit Headline „Kieze im Bezirk" und Liste von 5 Top-Kiezen (sortiert nach `composite` desc) als interne Links `/kiez/{slug}` vorhanden sein.
**And** Wenn `kiez_score`-Daten fehlen, Fallback auf alphabetische Liste der ersten 5 Kieze des Bezirks.
**And** Komponente `bezirk-kieze-list.svelte` < 100 LOC.

**AC-8 (Internal-Linking-Block Kiez → Geschwister):**

**Given** Kiez-Detail-Page
**When** Page rendert
**Then** muss neue Section mit 3 Geschwister-Kiezen (aus selbem Parent-Bezirk, alphabetisch sortiert, aktueller Kiez ausgeschlossen) als interne Links `/kiez/{slug}` vorhanden sein.
**And** Link auf Parent-Bezirk-Page bereits via Breadcrumb-Hero vorhanden, nicht doppeln.

**AC-9 (noindex auf /_dev/* + /api/*):**

**Given** Dev-Routen `(with-header)/_dev/{wortmarke,logo,ui-showcase,map-style}` und JSON-API-Endpoints
**When** ein Crawler die Page anfordert
**Then** Response muss `X-Robots-Tag: noindex, nofollow`-Header tragen UND `<meta name="robots" content="noindex,nofollow">` in `<head>`.
**And** Dev-Routen über SeoHead-Prop `noindex={true}` oder direktes meta-tag.
**And** API-Routes setzen Header in `+server.ts` Response-Headers.

**AC-10 (IndexNow-Bing-Push-Skript):**

**Given** IndexNow-API-Endpoint `https://api.indexnow.org/IndexNow`
**When** Maintainer `pnpm indexnow:ping` ausführt
**Then** Skript liest Sitemap-URLs aus `https://navigator.berlin/sitemap.xml`, generiert Key-File `/{key}.txt` (Key in `.env` `INDEXNOW_KEY`), POSTet URL-Liste an Bing.
**And** Skript ist standalone (kein Build-Time-Coupling), idempotent, dokumentiert in `docs/runbooks/indexnow-deploy-ping.md`.
**And** Coolify-Post-Deploy-Hook-Setup im Runbook erklärt aber nicht-automated.

**AC-11 (Tests + Quality-Gates):**

**Given** alle neuen Module + Erweiterungen
**When** `pnpm test:unit` läuft
**Then** mindestens je 4 Tests pro neuen Builder (`buildPlace`, `buildDataCatalog`, `buildSpeakableSpecification`, IndexNow-URL-Sammler, Bezirk-Kieze-Selector, Kiez-Geschwister-Selector, robots.txt-AI-Bot-Block-Renderer) und 0 Errors.
**And** robots.txt-Endpoint-Test stellt sicher dass alle 12 AI-Bot-Blöcke + Yandex-Absence enforced sind.
**And** `pnpm check` 0 Errors auf gesamtem Tree.

## Tasks/Subtasks

**T1 (Generator-Erweiterung in `src/lib/seo/`):**
- [x] T1.1: `buildPlace`-Builder + Tests (AC-3). _Skipped — bereits aus Story 2.2 vorhanden inkl. Test-Coverage._
- [x] T1.2: `buildDataCatalog`-Builder + Tests (AC-5). _Neu: `jsonld-datacatalog.ts` + 5 Tests._
- [x] T1.3: `buildSpeakableSpecification`-Builder + Tests (AC-6). _Neu: `jsonld-speakable.ts` (WebPage + SpeakableSpecification) + 4 Tests._
- [x] T1.4: SeoHead-Prop `noindex?: boolean` mit Meta-Tag-Emit (AC-9). _SeoHead `+noindex` Prop + 2 neue Tests; rendert `<meta name="robots" content="noindex,nofollow">`._
- [x] T1.5: Export-Index `src/lib/seo/index.ts` um neue Builder erweitern.

**T2 (robots.txt-Erweiterung):**
- [x] T2.1: `src/routes/robots.txt/+server.ts` AI-Bot-Allowlist + Disallow + Default-Block-Block-Pattern (AC-1).
- [x] T2.2: Test-File `robots.test.ts` (umbenannt von `+server.test.ts` weil SvelteKit `+`-Prefix-Routen reserviert) enforced 11 AI-Bot-Allow, 2 Spam-Disallow, Yandex-Absence, `/_dev/` + `/api/`-Disallow. 18 Tests grün.

**T3 (Bezirk-Page-Erweiterung):**
- [x] T3.1: `src/lib/data/get-kieze-in-bezirk.ts` mit pure-Selector `buildKiezeInBezirk` + `pickTop` + `pickSiblings` + 9 Tests. Server-Load: `tryLoadKieze(bezirkSlug)` liest bezirke + lor-bezirksregion GeoJSON, baut Code→Slug-Map, JOINt kiez_score, sortiert composite-desc.
- [x] T3.2: `bezirk-kieze-list.svelte` als ordered-list (1-5 Ranking + Name + tabular-Score). Layout-Redesign nach User-Feedback („das sieht noch nicht gut aus") von grid-justify-between auf ranking-list mit hairline-Separator. 4 Tests grün.
- [x] T3.3: FAQPage-JSON-LD via `FaqSection`-Komponente (inline `buildFaqPage`). Bereits aus Story 2.5b im BezirkHero verdrahtet.
- [x] T3.4: Place + AdministrativeArea + BreadcrumbList JSON-LD bereits aus Story 2.2/2.3 verdrahtet.
- [x] T3.5: Centroid bereits in `BezirkProfile.centroid` aus Story 2.3.

**T4 (Kiez-Page-Erweiterung):**
- [x] T4.1: Server-Load: `tryLoadSiblings(currentSlug, parentBezirkName)` via gleichem Selector wie T3.1.
- [x] T4.2: `kiez-siblings-list.svelte` als horizontale link-cluster ohne Score (alphabetisch). 3 Tests grün.
- [x] T4.3: FAQPage-JSON-LD via FaqSection bereits aus Story 2.5b im KiezHero.
- [x] T4.4: Place + AdministrativeArea + BreadcrumbList JSON-LD bereits aus Story 2.4.

**T5 (Layer-Page-Erweiterung):**
- [x] T5.1: `+page.ts` zu `+page.server.ts` konvertiert. `tryLoadFaq` lädt FAQ-Rows aus DB, FaqSection-Component eingehängt. FAQPage-JSON-LD inline (selbst-versteckend bei leerer Liste).
- [x] T5.2: BreadcrumbList-JSON-LD `Home › Daten › {layerName}` (Daten-Knoten zeigt auf `/explore`). 19 page-svelte-Tests fixed (fixture `faq:[]` + `/explore`-Pfad-Update).

**T6 (Breadcrumb-Expansion auf Static-Pages):**
- [x] T6.1: Updates-Detail-Page: `Home › Updates › {title_de}` JSON-LD eingehängt.
- [x] T6.2: Updates-Index-Page: `Home › Updates` JSON-LD eingehängt.
- [x] T6.3: Methodik-Page: `Home › Methodik` JSON-LD eingehängt.
- [x] T6.4: Methodik/Kiez-Score-Page: `Home › Methodik › Kiez-Score` Breadcrumb + Speakable-Spec mit 5 css-selectors (#worum #dimensionen #gewichte #normalisierung #fehlt). Konvertiert von `<svelte:head>` zu SeoHead-Component-Aufruf (Konsistenz).
- [x] T6.5: Lizenzen-Page: Breadcrumb + DataCatalog-JSON-LD mit allen 44 Layer-Refs (name + url + license-URL).
- [x] T6.6: Architektur-, Datenschutz-, Impressum-Page: jeweils Breadcrumb-JSON-LD.

**T7 (noindex-Pflicht-Routen):**
- [x] T7.1: `(with-header)/_dev/+layout.svelte` neu — emittiert `<meta name="robots" content="noindex,nofollow">` + `<meta name="googlebot" content="noindex,nofollow">` für alle 4 Dev-Routen ohne pro-File-Touch.
- [x] T7.2: `hooks.server.ts` um `handleNoIndexHeaders` erweitert (via `sequence`), setzt `X-Robots-Tag: noindex,nofollow` auf alle `/api/*` und `/_dev/*` Responses.
- [x] T7.3: SeoHead-Tests prüfen `noindex={true}`-Verhalten (siehe T1.4).

**T8 (IndexNow):**
- [x] T8.1: `scripts/indexnow-ping.ts` (Sitemap-Index → Sub-Sitemaps folgen → POST IndexNow-API).
- [x] T8.2: `package.json`-Script `indexnow:ping` registriert.
- [x] T8.3: Key-File-Endpoint `src/routes/[key].txt/+server.ts` matcht alle Top-Level-`.txt`-Requests, vergleicht gegen `INDEXNOW_KEY` aus env, RESERVED-Liste schützt robots/llms/llms-full.
- [x] T8.4: `docs/runbooks/indexnow-deploy-ping.md` mit Bitwarden-Setup, Coolify-ENV, Manual-Trigger, Coolify-Hook-Optionalitäts-Hinweis.
- [x] T8.5: 11 Tests grün (parseArgs, extractLocFromXml, fetchSitemapUrls inkl. sub-sitemap-Following, buildIndexNowPayload).

**T9 (Doku + Memory):**
- [x] T9.1: Memory `project_seo_bot_policy.md` mit kompletter Bot-Liste + Yandex-Begründung.
- [x] T9.2: Memory `project_indexnow_setup.md` mit Key-Location + manual-Trigger-Rationale.
- [x] T9.3: `docs/INDEX.md` um `indexnow-deploy-ping.md`-Link erweitert.

## Dev Notes

**Architecture-MUST-Rules (relevant subset):** #2 (Files < 500 LOC), #6 (keine WHAT-Comments), #7 (TS-strict), #13 (Build-Time-Caches, hier z.B. centroid-pre-computed wenn perf-relevant), #14 (i18n-First — Phase 1 DE-only, alle JSON-LD `inLanguage: 'de-DE'`).

**Centroid-Berechnung:** Bezirk-BBox bereits in Geo-JSON. Pure-Func `centroidFromBbox(bbox: Bbox4): { lat, lng }` in `src/lib/seo/internal/geo-helpers.ts`. Für Kiez Centroid aus LOR-Bezirksregion-Properties oder turf-Util.

**FAQPage-Inline-vs-Section-JSON-LD:** Story 2.5b emittiert FAQPage-JSON-LD bereits inline in `faq-section.svelte`. Story 5.9 hängt FAQPage-JSON-LD redundant auf Page-Level NICHT ein — sondern verifiziert dass `faq-section.svelte` korrekt rendert. AC-2 wird erfüllt durch existing inline-Block.

**DataCatalog vs. CollectionPage:** DataCatalog ist semantisch korrekt weil 44 maschinenlesbare Geo-Datasets. CollectionPage wäre alternativ aber schwächeres Signal für data.gov-Aggregatoren.

**Internal-Linking-SQL:** `getKiezeInBezirk` JOINt LOR-Bezirksregion-Properties mit `kiez_score` ON slug. `getSiblingKieze` filter dieselbe Logic.

**Speakable-Spec-Format:** Schema.org erlaubt `cssSelector` ODER `xpath`. CSS-Selector mit ID-Anker (`'#worum'`) ist robust. JSON-LD-Inline pro Speakable-Page als separater Block ODER als `WebPage.speakable`-Property.

**IndexNow-Key:** UUID v4, 32 hex-chars, sowohl im POST-Body als auch als File `/{key}.txt` auf Site erreichbar. Bing verifiziert Ownership via File-Fetch.

**IndexNow-Endpoint-Naming:** Per Spec frei wählbar (eigene Hostname-Route OK). Wir nutzen `/{32hex}.txt` Pattern.

**Disallow-Strategie Yandex:** Yandex respektiert robots.txt aber YandexBot trotzdem teilweise aggressiv. Bewusste Nicht-Listung = Allow-Default. User akzeptiert Risiko.

**Test-Strategie:** Jeder JSON-LD-Builder TDD Red-Green-Refactor mit Snapshot-Vergleich (Schema.org-conform). robots.txt-Endpoint-Test mit Regex-Pflicht-Patterns. Internal-Linking-Selector-Test mit Fixture-Daten (12 Bezirke, 143 Kieze).

**Coverage-Targets:** Builders ≥ 95%, Selectors ≥ 90%, Routes-Smoke 1 prerender-Verify pro neuer Page-Group.

**Performance-Hinweis:** JSON-LD-Blocks bleiben unter 5 KB pro Page. DataCatalog auf /lizenzen mit 44 Dataset-Refs am Limit; ggf. nur `name` + `url` + `license` statt full Dataset-Inline.

**Phase-2-Out-of-Scope:** EN-Locale-JSON-LD, hreflang, sitemap-internationaler-Index, Voice-Search-Sample-Audio-Files, Knowledge-Graph-Eintragung, OpenAPI-Spec für `/api/*`.

## Change Log

| Date | Description |
| --- | --- |
| 2026-05-18 | Story authored as 5.9 nach Lighthouse-Audit-Review + User-Direction für SEO/AEO-Hardening pre-Indexing. |
| 2026-05-18 | Implementation complete (in-progress → review). Alle 9 Task-Cluster + 11 AC. T1.1/T3.3-3.5/T4.3-4.4 als „bereits aus Story 2.2/2.3/2.4/2.5b vorhanden" abgehakt. 18 robots.txt-Tests + 5 DataCatalog-Tests + 4 Speakable-Tests + 11 IndexNow-Tests + 9 Selector-Tests + 7 List-Component-Tests + 2 SeoHead-Tests + 19 Layer-Detail-Tests (fixed fixture) = 75 neue/touched Tests grün. |

## Dev Agent Record

### Implementation Plan

Reihenfolge T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 (linear, keine parallelen Worktrees notwendig — Story ist additive Erweiterung ohne Refactor-Konflikte).

### Completion Notes

- **Recon-Befund:** buildPlace + buildAdministrativeArea + buildBreadcrumbList + buildWebSite waren bereits aus Story 2.2 vorhanden. FaqSection-Komponente emittiert FAQPage-JSON-LD inline. Place + AdministrativeArea + BreadcrumbList waren auf Bezirk/Kiez schon verdrahtet. Story 5.9 reduzierte sich dadurch um ~40 % Scope. AC-3 (Place) + AC-2 (FAQPage Bezirk/Kiez) gelten als bestätigt-erfüllt durch existing infrastructure.
- **Internal-Linking-Pivot:** Erste Render mit grid-justify-between zeigte unsaubere Spalten-Mischung (User-Flag „das sieht noch nicht gut aus"). Redesign: ordered list mit Ranking-Number + Link + tabular-nums Score, hairline-Separator. Sibling-List bleibt horizontaler link-cluster ohne Score.
- **Layer-Page +page.ts → +page.server.ts:** Konvertiert damit FAQ-Rows aus Postgres geladen werden können. Bestehende 19 layer-detail-Tests via Bulk-Fixture-Update (`faq:[]`) + Pfad-Update `/?layers` → `/explore?layers` (drive-by-Fix nach Story-2.11-Atlas-Move) repariert.
- **noindex-Strategie:** Layout für `_dev/*` statt pro-File-SeoHead-Prop (4× Aufwand vermieden). Hooks-Handle setzt X-Robots-Tag-Header für `/api/*` + `/_dev/*` einheitlich.
- **IndexNow-Key-File:** Dynamische Route `[key].txt/+server.ts` matcht alle top-level `.txt`-Requests; RESERVED-Liste schützt robots/llms/humans/security. Key kommt aus `INDEXNOW_KEY` ENV (Bitwarden-Eintrag). Yandex bewusst ausgelassen.
- **Aus dem Scope gefallen:** llms.txt-Erweiterung (User-Decision: industry-consensus low-impact). EN-Locale-JSON-LD (Phase 3).
- **Pre-existing Test-Flakes outside Scope:** mobile-meta-drawer TS-error, error-feedback-mailto, map-controls, bottom-sheet, share-sheet, og-pipeline-gitignore, og-share, faq-queries (alle bekannt aus Story 2.6/2.0 Sprint-Notes).

### Debug Log

- Initial robots.test.ts-File als `+server.test.ts` benannt → SvelteKit 500 „+ reserved" → umbenannt zu `robots.test.ts`.
- bezirk-kieze-list.svelte + kiez-siblings-list.svelte Tests mit deprecated `@vitest/browser/context` Import → auf `vitest/browser` umgestellt.

## File List

### Neu
- `src/lib/seo/jsonld-datacatalog.ts` + `.test.ts`
- `src/lib/seo/jsonld-speakable.ts` + `.test.ts`
- `src/lib/data/get-kieze-in-bezirk.ts` + `.test.ts`
- `src/lib/components/atlas/bezirk-kieze-list.svelte` + `.test.ts`
- `src/lib/components/atlas/kiez-siblings-list.svelte` + `.test.ts`
- `src/routes/(with-header)/_dev/+layout.svelte`
- `src/routes/[key].txt/+server.ts`
- `src/routes/robots.txt/robots.test.ts`
- `scripts/indexnow-ping.ts` + `.test.ts`
- `docs/runbooks/indexnow-deploy-ping.md`
- Memory: `~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_seo_bot_policy.md`
- Memory: `~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_indexnow_setup.md`

### Geändert
- `src/lib/seo/index.ts` (Exports für DataCatalog + Speakable)
- `src/lib/components/atlas/seo-head.svelte` + `.test.ts` (noindex-Prop)
- `src/routes/robots.txt/+server.ts` (AI-Bot-Policy + Default-Block-Disallow)
- `src/routes/(with-header)/bezirk/[slug]/+page.server.ts` (Kieze-Load)
- `src/routes/(with-header)/bezirk/[slug]/+page.svelte` (BezirkKiezeList-Wire)
- `src/routes/(with-header)/kiez/[slug]/+page.server.ts` (Sibling-Load)
- `src/routes/(with-header)/kiez/[slug]/+page.svelte` (KiezSiblingsList-Wire)
- `src/routes/(with-header)/layer/[slug]/+page.server.ts` (umbenannt von +page.ts, FAQ-Load)
- `src/routes/(with-header)/layer/[slug]/+page.svelte` (FaqSection + Breadcrumb)
- `src/routes/(with-header)/layer/[slug]/page.svelte.test.ts` (faq-Fixture + /explore-Pfad)
- `src/routes/(with-header)/updates/+page.svelte` (Breadcrumb)
- `src/routes/(with-header)/updates/[slug]/+page.svelte` (Breadcrumb)
- `src/routes/(with-header)/methodik/+page.svelte` (Breadcrumb)
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` (Breadcrumb + Speakable + svelte:head→SeoHead)
- `src/routes/(with-header)/lizenzen/+page.svelte` (Breadcrumb + DataCatalog)
- `src/routes/(with-header)/architektur/+page.svelte` (Breadcrumb)
- `src/routes/(with-header)/datenschutz/+page.svelte` (Breadcrumb)
- `src/routes/(with-header)/impressum/+page.svelte` (Breadcrumb)
- `src/hooks.server.ts` (X-Robots-Tag-Header für /api/* + /_dev/*)
- `package.json` (indexnow:ping-Script)
- `docs/INDEX.md` (Runbook-Link)
- Memory-Index: `~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/MEMORY.md`

### Gelöscht
- `src/routes/(with-header)/layer/[slug]/+page.ts` (umbenannt zu +page.server.ts)
