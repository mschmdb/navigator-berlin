# Code-Inventur SEO S2-S5 (15.10.2026)

## S2 Head-Lücken
- Feed-Links: `src/lib/components/seo/feed-discovery-links.svelte:20-43` setzt `hreflang={feedLang}` (`'de'`); genutzt in `updates/+page.svelte:84`, `updates/[slug]/+page.svelte:64`. Sichtbare `<a hreflang>` im Body (`updates/+page.svelte:24,95,100,106`) bleiben. Test `tests/e2e/i18n-c4d.e2e.ts:45` erwartet zwei `link[type*=xml][hreflang=de]` → anpassen.
- `/methodik/wahldaten`: `methodik/wahldaten/+page.svelte:125` ohne `ogImage`; kein PNG in `static/og/page/`. Ergänzen in `scripts/generate-og-images.ts:60-146` (`PAGE_TARGETS`), dann `pnpm og:images --type=page --slug=methodik-wahldaten`, PNG committen. Muster `methodik/kiez-score/+page.svelte:66-73` mit `ogImageAlt`-Message.
- `og:type`: `seo-head.svelte:137` fest `website`; `updates/[slug]/+page.svelte:66-71` setzt zusätzlich eigenes `og:type=article` → doppelt. SeoHead-Props `ogType`, `article {publishedTime, section, author}`, Doppelblock entfernen. Tests `seo-head.svelte.test.ts:94-120`.
- BlogPosting: `src/lib/seo/jsonld-blog-posting.ts:78-110`, kein `image`, `dateModified` = `date` (:100). Frontmatter (`frontmatter-schema.ts:33-50`) ohne `updated`; Git-Daten im Prod-Build nicht verfügbar. Optional `updated` ergänzen, Fallback `date`; `image` als Input. `buildBlogIndex` (:139). Test `jsonld-blog-posting.test.ts`.
- Untranslated Updates: `translation-register.ts:100-106` `/updates` mit `prefix:true` und `except`; heute haben alle 15 Einträge `.en.md` (latent). `except` dynamisch aus `import.meta.glob('/_content/updates/*.md')` für Slugs ohne `.en.md` bauen → regelt SeoHead (noindex/canonical/hreflang) und Sitemap-Gate (`sitemap-builder.ts:250-273`) zusammen.

## S3 JSON-LD-Entitäten
- WebSite doppelt: `src/routes/+layout.svelte:86-94,111` (testid `website-jsonld`, SearchAction `/`) und `(with-header)/+page.svelte:42-50,61` (`home-website-jsonld`, `/explore`). Builder `jsonld-website.ts:53-73` (`potentialAction` Pflicht im Typ :23), Export `src/lib/seo/index.ts:23-27`.
- E2E `tests/e2e/i18n-routing.e2e.ts:262-290,684-690` liest `website-jsonld` auf `/en/impressum`, `/en/berlin-wahlen`, `/en` für `inLanguage` → umstellen. `jsonld-website.test.ts` anpassen.
- Organization: keine; inline in `jsonld-blog-posting.ts:57-63`, `jsonld-dataset.ts:67-69`, `jsonld-datacatalog.ts:102-104`. Vorschlag `@id` `${origin}/#organization` auf Startseite, andere referenzieren.
- Logo: nur SVG (`static/logo-mark.svg`, `logo-pixel*.svg`). Google will Raster ≥ 112 px → PNG erzeugen (`@resvg/resvg-js`, `src/lib/server/og/logo-loader.ts`).
- Place/AdministrativeArea: `jsonld-place.ts:60-107`, `jsonld-administrative-area.ts:22-28`; kein `@id`, `containedInPlace` nur Name (:91-93). Kiez `kiez/[slug]/+page.svelte:71-97,126-127` (`bezirkSlug` :101), Bezirk `bezirk/[slug]/+page.svelte:65-96,120-121`. Tests `jsonld-place.test.ts`, `jsonld-administrative-area.test.ts`, E2E `i18n-profile-frame.e2e.ts:351-369`.
- sameAs: `src/lib/seo/sources/bezirk-sameas.ts` (12 Bezirke). Kieze bewusst ohne sameAs (LOR-Bezirksregion ≠ Ortsteil, Kopfkommentar :7-9) → nur Bezirk.

## S4 Dataset
- `src/lib/seo/jsonld-dataset.ts:64-92`; fehlt url, spatialCoverage, temporalCoverage, isAccessibleForFree, includedInDataCatalog.
- Konsumenten: `layer/[slug]/+page.svelte:103-116` (`contentUrl` Hash-Datei, `creatorName: methodology?.authority`), `berlin-wahlen/[slug]/+page.svelte:70-87` (`dateModified` `${jahr}-01-01` obwohl `sourceUpdatedAt` existiert), `umwelt-infrastruktur-score/+page.svelte:29-41`, `hitze`.
- MANIFEST (73 Layer): slug, filename, sourceUrl, fetchedAt, license, sha256, bundleGroup, geometryType, featureCount; `sourceUpdatedAt` nur 41×; kein temporal-Feld (Jahr aus Slug-Suffix). Typ `src/lib/data/types.ts:26-52`.
- `src/lib/data/authorities.ts:36ff` nur Namen, keine URL → `url` ergänzen für `creator.url`.
- DataCatalog `jsonld-datacatalog.ts:86-115` (auf `/lizenzen` :74, `/berlin-wahlen` :205), Datasets mit `@id` `/layer/<slug>`, Katalog ohne `@id`.
- Stabile Download-URL fehlt; `/layers/` nur Hash-Dateien, `server.js:29-31` cacht 1 Tag. Alias nicht unter `/api/` (robots). Vorschlag `/daten/<slug>.geojson` (302 auf Hash-Datei).

## S5 Sitemap
- lastmod: statisch und Wahl-Portal `buildTimestamp` (`sitemap-builder.ts:142,179`); Layer `fetchedAt` (:199); Kiez/Bezirk Grenzlayer-`fetchedAt` (`sources/kiez-pages.ts:44-48`, `bezirk-pages.ts:45-49`); Ranking Build-Zeit (`ranking-page.ts:39`); Updates `date` (`updates.ts:31,45`); Wahl `sourceUpdatedAt ?? jahr-01-01` (`wahl-detail-pages.ts:46`); Index `new Date()` (`routes/sitemap.xml/+server.ts:19`). `lastmod` optional, wird bei undefined weggelassen (:90,109).
- Echte Zeitstempel: Profil-Frontmatter `generatedAt`/`translatedAt` (`src/lib/content/{kiez,bezirk}-profile/*.md`), `kiez-scores.json` `generatedAt`, `sourceUpdatedAt` in `kiez_stats`/`bezirk_stats`, Wahl `source_updated_at`. `computed_at` wird bei jedem Prebuild neu gesetzt (kein Inhaltsdatum). Git im Docker-Build nicht verfügbar.
- Stille Fehler: `sitemap-de.xml/+server.ts:33-44` und `sitemap-en.xml` (ohne `DATABASE_URL` oder bei `catch` → `[]`), `sources/updates.ts:66-71`.
- `svelte.config.js:30-32` `handleUnseenRoutes`, `:37-42` `handleHttpError` nur warn. Dockerfile setzt `NODE_ENV=production`; `DATABASE_URL` Build-ARG. 14.10. waren 32 Prerender-404 im Coolify-Log (`deferred-work.md:318-321`).
- Tests: `sitemap-builder.test.ts`, `sources/*.test.ts` (43 lastmod-Assertions), `llms-sitemap-consistency.test.ts`, `endpoints.test.ts`.
