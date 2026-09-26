---
title: 'i18n Block A: Locale-Infrastruktur, /en-Routing und SEO-Mechanik'
type: 'feature'
created: '2026-09-26'
status: 'done'
baseline_commit: '87d68639ba458e0ce27daaf1c29999f3ef54650a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_user-input/plan-i18n-de-en-2026-08-22.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** navigator.berlin ist nur deutsch. Paraglide ist installiert, aber leer; `/en/…` wird heute per 301 auf DE umgeleitet; Locale-Typen, Sitemap, hreflang, `og:locale` und JSON-LD sind hart auf DE bzw. `'de'|'en'` verdrahtet. Ohne diese Infrastruktur kann Block B (UI-Extraktion) nicht starten.

**Approach:** Paraglide-Routing für N Locales aktivieren, zunächst `de` (Master, ohne Präfix, alle DE-URLs unverändert) und `en` (`/en/…`). Dazu Sprachumschalter, hreflang/Canonical/`og:locale`, Sitemap je Locale, Locale-fähige JSON-LD und OG-Pfade, Disclaimer auf nicht übersetzten Seiten, ADR-005 und Architektur-Doku. Test auf Branch `feat/i18n-en`, Merge erst nach verifiziertem Launch (Matze 26.09.).

## Boundaries & Constraints

**Always:**

- Entscheidungen Matze 26.09.2026: Infra für N Locales (später es/tr), keine `'de'|'en'`-Hartverdrahtung; „Kiez“/„Bezirk“ bleiben in EN deutsch; EN-Updates als Frontmatter-Felder; v1-Scope Infra + Karte/Kernrouten + Wahlportal.
- DE bleibt Master ohne Präfix; keine bestehende DE-URL ändert sich, kein Auto-Redirect nach Cookie/Accept-Language (Paraglide-Strategy `['url', 'baseLocale']`, cookieless nach Architektur-MUST #10).
- Ein gemeinsamer `Locale`-Typ aus `$lib/paraglide/runtime` statt `SupportedLocale`, `SitemapLocale`, `authorities.Locale`.
- Sprachumschalter führt auf dieselbe Seite in der anderen Sprache, voller Reload, zugänglich (Linktext in der Zielsprache mit `lang`-Attribut, aktuelle Sprache als `aria-current`).
- TDD pro AC; alle bestehenden DE-Tests bleiben grün.
- Entscheidung Matze 26.09. 17:10 (A): `/en`-Seiten sind `noindex` und fehlen in Sitemap und hreflang, bis eine Seite im Übersetzungs-Register (je Route/Seitentyp, eine Quelle für SeoHead, Sitemap und hreflang) als übersetzt markiert ist. In Block A ist noch keine Seite markiert; `sitemap-en.xml` existiert, ist aber leer.
- Entscheidung Matze 26.09. 17:10: Spec ungesplittet (~2200 Tokens), weil Routing, Redirect-Hook und SEO-Meta nur zusammen einen konsistenten Zustand ergeben.

**Never:**

- Keine UI-Texte extrahieren oder übersetzen (Block B/C), keine EN-llms.txt (Plan: nicht in v1), keine übersetzten Pfad-Slugs.
- Kein Merge nach `main`, kein Push, kein Deploy.

## I/O & Edge-Case Matrix

| Scenario            | Input / State                        | Expected Output / Behavior                                                             | Error Handling          |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------- |
| DE unverändert      | GET `/berlin-wahlen`                 | 200, `lang="de"`, kein Redirect                                                        | N/A                     |
| EN-Route            | GET `/en/berlin-wahlen`              | 200, `lang="en"`, Disclaimer „noch nicht übersetzt“, Inhalt DE                         | N/A                     |
| Inaktive Alt-Locale | GET `/es/kiez/x`                     | 301 → `/kiez/x`                                                                        | N/A                     |
| Open-Redirect       | GET `/es//evil.example`              | kein Redirect nach außen                                                               | bleibt auf eigenem Host |
| Umbenannte Route EN | GET `/en/wo-lebt-es-sich-gut`        | 301 → `/en/umwelt-infrastruktur-score`                                                 | N/A                     |
| Switcher            | auf `/kiez/x` Klick „English“        | `/en/kiez/x`                                                                           | N/A                     |
| hreflang            | als übersetzt markierte Seite        | `de`, `en`, `x-default` (= DE)                                                         | N/A                     |
| Nicht übersetzt     | GET `/en/kiez/x` (nicht im Register) | `noindex`, kein hreflang-Paar, nicht in `sitemap-en.xml`; DE-Seite ohne `en`-Alternate | N/A                     |

</frozen-after-approval>

## Code Map

- `project.inlang/settings.json`, `messages/en.json` (neu, leer), `vite.config.ts:12` -- Locales `["de","en"]`, Strategy `['url','baseLocale']`; Default-URL-Pattern reicht (Präfix nur für Nicht-Base).
- `src/hooks.ts` (reroute mit `deLocalizeUrl`, Hitze-Subdomain zuerst), `src/hooks.server.ts` (`paraglideMiddleware`, `%paraglide.lang%`) -- bleiben, Reihenfolge prüfen.
- `src/lib/seo/stale-locale-redirect.ts` (+ Test) -- Präfix-Set = Alt-Locales minus aktive `locales`; Open-Redirect-Test auf inaktive Locale umziehen.
- `src/lib/seo/renamed-route-redirect.ts` (+ Test) -- Locale-Präfix abziehen, Ziel re-lokalisieren.
- `src/routes/+layout.svelte:80,112-118` -- JSON-LD-Locale-Mapping; versteckte Crawl-Links für Prerender existieren schon.
- `src/lib/components/atlas/seo-head.svelte` (+ Test), `src/lib/seo/hreflang.ts`, `canonical.ts` -- hreflang aus `locales`, `canonicalPath` via `localizeHref`, `og:locale` + `og:locale:alternate`.
- JSON-LD `inLanguage`: `jsonld-website.ts`, `jsonld-dataset.ts`, `jsonld-datacatalog.ts`, `jsonld-speakable.ts`, `jsonld-blog-posting.ts:111`, `berlin-wahlen/[slug]/+page.svelte:69`.
- `src/lib/seo/sitemap-builder.ts` + `sources/*` + `src/routes/sitemap.xml`, `sitemap-de.xml`, neu `sitemap-en.xml` -- statische Routen (dynamisches `[lang]` bricht `resolve()`), `xhtml:link`-Alternates; `svelte.config.js` Prerender-Entry ergänzen.
- `src/lib/seo/llms-sitemap-consistency.test.ts` -- auf beide Locales erweitern (EN-llms bleibt leer, Test dokumentiert das).
- `src/lib/components/atlas/site-header.svelte:15,199,224`, `mobile-meta-drawer.svelte`, `meta-footer.svelte` -- `langSwitcher`-Snippet existiert, niemand übergibt es; neue `lang-switcher.svelte`.
- `src/lib/components/atlas/translation-disclaimer.svelte` (+ Test) -- auf N Locales verallgemeinern, in Layout einbinden.
- `src/lib/server/og/filename-resolver.ts`, Routen mit `ogImage` -- Locale-Pfad mit DE-Fallback, solange keine EN-Karten existieren.
- `src/lib/data/authorities.ts:16,111` -- gemeinsamer `Locale`-Typ.
- `docs/adr/ADR-005-i18n-paraglide.md`, `docs/adr/INDEX.md:19,38`, `architecture.md:120,475,536,1495` -- ADR ausfüllen, veraltete `[lang=lang]`-/Accept-Language-Aussagen korrigieren, ADR-015-Verweis bereinigen.
- Nicht ändern: bestehende DE-Pfade, `/api/*`, Hitze-Subdomain-Reroute, WebMCP.

## Tasks & Acceptance

**Execution:**

- [x] Paraglide-Config + `messages/en.json` + gemeinsamer `Locale`-Typ -- Basis für N Locales
- [x] `stale-locale-redirect.ts`, `renamed-route-redirect.ts` (+ Tests) -- `/en` lebt, Alt-Locales weiter 301
- [x] `lang-switcher.svelte` (+ Test), in Header, Mobile-Drawer, Footer -- Sprachwechsel
- [x] `translation-disclaimer.svelte` verallgemeinert + im Layout (+ Test)
- [x] `seo-head.svelte`, `hreflang.ts`, `canonical.ts`, JSON-LD-Builder (+ Tests) -- Locale-korrekte Meta
- [x] Sitemap-Index + `sitemap-en.xml` + Sources + `xhtml:link` (+ Tests, Consistency-Test) -- EN-Einträge nur aus dem Übersetzungs-Register (Block A: leer)
- [x] OG-Pfade mit Locale und DE-Fallback (+ Test)
- [x] ADR-005, ADR-INDEX, `architecture.md` -- Doku konsistent
- [x] Zeitmessung: Start/Ende jeder Phase in Implementation Notes

**Acceptance Criteria:**

- Given der Build, when prerendert wird, then existieren alle bisherigen DE-Seiten unverändert und jede zusätzlich unter `/en/…`, ohne Prerender-Warnungen.
- Given `pnpm build && pnpm preview`, when `/en/kiez/<slug>` geladen wird, then antwortet der Server 200 mit `lang="en"`, Switcher und Disclaimer, und `/kiez/<slug>` bleibt 200 mit `lang="de"`.
- Given die bestehende Test-Suite, when sie läuft, then ist sie grün; neue Tests decken jede Matrix-Zeile ab.

## Implementation Notes

- 26.09. 17:03 Start Planung (Step 1). 17:10 Checkpoint 1 freigegeben (Matze). 17:03 Paraglide 2.18.0 → 2.25.4 (`1678f59`). 17:04-17:07 Recherche (2 Subagenten).
- 26.09. Start Implementierung (Step 2, dispatch-Route). Kontext geladen: Plan, `architecture.md`, gesamter Code-Map-Filesatz (Paraglide-Compiler-Quellen, hooks, seo-Layer, Komponenten).
  - Paraglide-Config (`project.inlang/settings.json` → `["de","en"]`, `vite.config.ts` → `strategy: ['url','baseLocale']`), `messages/en.json` (leer), Compiler-Regenerierung via `@inlang/paraglide-js` `compile()` verifiziert (`urlPatterns`: `en` → `/en/...`, `de` unpräfixiert).
  - `Locale`-Typ konsolidiert: `authorities.ts`, `hreflang.ts` (vormals `SupportedLocale`), `sitemap-builder.ts`/`llms-builder.ts` (vormals `SitemapLocale`) importieren jetzt `Locale` aus `$lib/paraglide/runtime`. `$lib/data/types.ts`s eigener `Locale`-Typ (WebMCP/Geocoding, 8-Sprachen-vorbereitet) bewusst unangetastet (Boundary "Nicht ändern: WebMCP").
  - `translation-register.ts` (neu) als eine Quelle für SeoHead-noindex/hreflang, Sitemap-Sources (zentraler Gate in `collectPrerenderedUrls`) und `llms-builder` -- Block A: leer.
  - `stale-locale-redirect.ts`: Stale-Präfix-Menge jetzt `HISTORICAL_LOCALE_PREFIXES \ (aktive Nicht-Basis-Locales)`, `en` verlässt die Stale-Menge, `de` bleibt für immer stale (kein URL-Präfix unter `baseLocale`). Test verschob den Open-Redirect-Fall von `/en/` auf `/es/`.
  - `renamed-route-redirect.ts`: zieht einen aktiven Locale-Präfix vor dem Lookup ab, hängt ihn ans Ziel wieder an (`/en/wo-lebt-es-sich-gut` → `/en/umwelt-infrastruktur-score`).
  - `lang-switcher.svelte` (neu, `Intl.DisplayNames`, `data-sveltekit-reload`, `aria-current`) verdrahtet in `+layout.svelte` (Footer) und `(with-header)/+layout.svelte` (Header + Mobile-Drawer, via das bereits existierende `langSwitcher`-Snippet-Prop). `currentPath` bewusst OHNE `page.url.search` -- `.search` wirft auf prerenderten Routen (siehe Build-Fund unten).
  - `translation-disclaimer.svelte`: Varianten `en-translated`/`en-fallback-to-de` → `translated`/`fallback-to-base`, Locale-Typ aus Runtime, `baseLocale`-Vergleich statt `'de'`-Literal. Eingebunden in `(with-header)/+layout.svelte` vor `<main>`.
  - `seo-head.svelte`: `locales`-Prop jetzt optional mit Register-basiertem Default, `noindex` automatisch für nicht-übersetzte Nicht-Basis-Locale-Seiten, `og:locale` + `og:locale:alternate` locale-korrekt (`locale-meta.ts`, neu). 9 Routen verloren ihr explizites `locales={['de']}` (überflüssig geworden).
  - `hreflang.ts`: `canonicalPath` nutzt jetzt `localizeHref` statt den Locale-Parameter zu ignorieren (war vorher ein Platzhalter-Stub).
  - `sitemap-builder.ts`: `SitemapEntry.alternates` + `xhtml:link`-Rendering in `buildSitemapXml` (Infra, in Block A ungenutzt da Register leer). Alle 7 `ctx.locale !== 'de'`-Checks (sitemap-builder + 5 Sources + llms-builder) auf `baseLocale`-Import umgestellt.
  - `sitemap-en.xml`/`+server.ts` (neu, spiegelt `sitemap-de.xml` ohne Bezirk/Kiez/Wahl-Fetches, da Sources ohnehin leer liefern), `sitemap.xml`-Index listet beide, `svelte.config.js`-Prerender-Entries ergänzt.
  - `filename-resolver.ts`: `resolveOgImageLocale` (neu, fällt in Block A immer auf `baseLocale` zurück, da keine EN-Karten existieren).
  - JSON-LD-Locale-Fixes: `+layout.svelte` (WebSite), `(with-header)/+page.svelte` (Home-WebSite), `berlin-wahlen/[slug]/+page.svelte:69` (Dataset) nutzen jetzt `localeToBcp47(resolveEffectiveLocale(...))` statt hartem `'de-DE'`.
  - ADR-005 ausgefüllt (Context/Decision/Consequences), ADR-INDEX bereinigt (stray "ADR-015 i18n-Scope-Reduce"-Pending-Zeile entfernt, Superseded-By-Spalte korrigiert), `architecture.md` an 5 Stellen korrigiert (i18n/RTL-Cross-Cutting-Concern, Sitemap-Strategie, `[lang=lang]`-Route-Struktur-Block mit Korrektur-Hinweis versehen, Story-1.3-Beschreibung + File-Mapping, FR-Cluster-Internationalization-Zeile).
- **Build-Fund (kritisch):** Erster `pnpm build` schlug für JEDE Seite mit 500 fehl (`Cannot access url.search on a page with prerendering enabled`) -- `langSwitcher`-Snippet griff auf `page.url.search` zu. Fix: `currentPath` nur `page.url.pathname`. Zweiter Build: 0 neue Warnungen (verifiziert per Baseline-Vergleich via `git stash`: identische 17 Pre-existing-404/unseen-route-Warnungen vor und nach dieser Spec).
- Verifiziert am echten `build/`-Output (`pnpm preview`): `/kiez/alexanderplatz` 200 `lang="de"` kein Robots-Meta; `/en/kiez/alexanderplatz` 200 `lang="en"` `noindex` `fallback-to-base`-Disclaimer; `/es/kiez/alexanderplatz` → 301 `/kiez/alexanderplatz`; `/de/kiez/...` → 301; `/en/wo-lebt-es-sich-gut` → 301 `/en/umwelt-infrastruktur-score`. `build/prerendered/en/` = 259 Dateien, exakt Parität zu `build/prerendered/` (DE).
- Test-Suite: 4135 Tests grün (1 bekannt-flaky Maplibre-Test, reproduzierbar auch auf Baseline vor dieser Spec, in Isolation grün). `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Violations.

- Zeitmessung gesamt (Koordinator): Planung 17:03-17:10 (7 min, inkl. Paraglide-Update und 2 Recherche-Agenten), Umsetzung 17:11-17:50 (39 min), e2e-Nachzug Matrix 17:51-17:58 (7 min), Review 3 Layer 17:58-18:02 (4 min), Patch-Runde 18:02-18:29 (27 min), Abschluss 18:30. Gesamt rund 1 h 27 min für Block A.
- Qualität: 24 Review-Funde, davon 3 high (Präfix-Pfad-Checks brachen `/en/explore`, Register-Keys, WCAG 3.1.1), 21 gepatcht, 1 deferred (Links auf `/en` → Block B), 2 rejected. Endstand: Unit 4170/4170, e2e i18n 24/24, check 0, lint:wahl 0, Build ohne neue Warnungen, 259 DE + 259 EN prerendert.
- Vorbestehend gefunden (deferred): prerenderte `/de/…`-URLs liefern 200 statt 301, weil adapter-node Prerender-Dateien vor `handle` ausliefert und `deLocalizeUrl` auch das Base-Präfix entfernt; Canonical zeigt korrekt auf die Präfix-lose URL.


## Review Triage Log

Runde 1 (26.09.2026 18:01), 3 Layer: Blind Hunter (BH) 16, Edge Case (EC) 17, Verification Gap (VG) 3 + 5. P = patch, D = defer, R = reject.

| #   | Layer    | Fund                                                                                                            | Verdict    | Evidenz                                                                                       | Route                                                |
| --- | -------- | --------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --- |
| 1   | EC       | Pfad-Checks sehen `/en`-Präfix: `/en/explore` falsches Layout (Footer, CTA statt Suche), Atlas-CTA fällt auf DE | high       | `(with-header)/+layout.svelte:31-32`, `+layout.svelte` `isExplore` nutzen `page.url.pathname` | P                                                    |
| 2   | EC       | `/en/api/*` ohne `X-Robots-Tag`                                                                                 | medium     | `handleNoIndexHeaders` prüft präfixierten Pfad                                                | P                                                    |
| 3   | BH/EC/VG | Register-Keys ohne Präfix-Normalisierung, kein Eintragsformat                                                   | high       | `normalizePathname` ohne `deLocalizeHref`; Aufrufer mischen `/en/x` und `/x`                  | P                                                    |
| 4   | BH       | `lang="en"` über deutschem Inhalt (WCAG 3.1.1)                                                                  | high       | kein `lang` auf `<main>` bei Fallback                                                         | P                                                    |
| 5   | BH/EC/VG | `og:locale` aus URL-Locale statt effektiver Locale                                                              | medium     | widerspricht JSON-LD und ADR                                                                  | P                                                    |
| 6   | BH/EC    | Switcher: `aria-label="Sprache"` fest deutsch, doppelte `nav`-Landmarks, `aria-current` auf `span` ohne Kontext | medium     | Header + Drawer + Footer                                                                      | P                                                    |
| 7   | BH       | Disclaimer nicht N-Locale (feste EN-Strings), vor `<main>`                                                      | medium     | `DISCLAIMER_TEXTS`, `ALT_LINK_LABELS`                                                         | P                                                    |
| 8   | EC       | `//`-Pfad → `localizeHref` baut fremde Origin (Switcher, hreflang)                                              | medium     | SSR-Routen mit `//evil.com`                                                                   | P                                                    |
| 9   | EC       | Groß geschriebenes Präfix `/EN/…` bei Renamed-Route                                                             | low        | stale-Redirect normalisiert, renamed nicht                                                    | P                                                    |
| 10  | BH       | Canonical der Fallback-Seite zeigt auf sich selbst statt DE                                                     | medium     | `canonical.ts` unverändert, Inhalt 1:1 DE                                                     | P                                                    |
| 11  | BH/EC/VG | `resolveOgImageLocale` toter Code, Task abgehakt                                                                | low        | kein Aufrufer                                                                                 | P: entfernen, ADR-Hinweis „OG je Locale mit Block C“ |
| 12  | EC       | `jsonld-blog-posting.ts` weiter `'de'                                                                           | 'en'`-hart | low                                                                                           | `lang === 'en' ? 'en-US' : 'de-DE'`                  | P   |
| 13  | BH       | `resolve`-Cast doppelt, umgeht Typsicherheit                                                                    | low        | Switcher + Layout                                                                             | P: Helper + Test                                     |
| 14  | BH       | Em-dashes in ADR-005/`architecture.md`                                                                          | low        | Projektregel                                                                                  | P                                                    |
| 15  | BH       | Stale Kommentare `hooks.server.ts:9-11`, `hreflang.ts`                                                          | low        | beschreiben Phase-1-Verhalten                                                                 | P                                                    |
| 16  | BH       | ADR-Datum rückdatiert                                                                                           | low        | `date: 2026-03` statt Original + `accepted`                                                   | P                                                    |
| 17  | VG       | JSON-LD `inLanguage` auf `/en` ungetestet                                                                       | gap        | kein Test liest JSON-LD                                                                       | P                                                    |
| 18  | VG/BH    | Register-hreflang-Test kopiert SeoHead-Logik, mockt ganzes Modul                                                | gap        | kein SeoHead-Render mit echtem Eintrag                                                        | P                                                    |
| 19  | VG       | AC-1 nur manuell (Route-Familien unter `/en`)                                                                   | gap        | Prerender warnt nur                                                                           | P: parametrisierter e2e                              |
| 20  | BH/VG    | Matrix Switcher DE→EN, `/de`-301, x-default, `xhtml:link` ungetestet                                            | gap        | e2e nur EN→DE                                                                                 | P                                                    |
| 21  | BH       | `effective-locale` Positivfall ungetestet                                                                       | gap        | nur Fallback                                                                                  | P                                                    |
| 22  | EC       | Interne Links (Header, Karten, Teaser) führen von `/en` auf DE                                                  | medium     | alle `href` roh; Fix berührt jede Komponente                                                  | D: Block B (Extraktion fasst jede Komponente an)     |
| 23  | EC       | `entry.loc` mit fremdem Origin im Sitemap-Gate                                                                  | low        | Origin ist immer `ctx.origin`                                                                 | R                                                    |
| 24  | BH       | Prettier-Rauschen im Diff                                                                                       | low        | nur geänderte Dateien formatiert                                                              | R                                                    |

## Verification

**Commands:**

- `pnpm test:unit -- --run` -- grün (4135 Tests, 448 Dateien; 1 vorbestehender Maplibre-Flake unter Volllast, isoliert grün, auch auf Baseline reproduzierbar)
- `pnpm check && pnpm lint:wahl` -- 0 Fehler
- `pnpm build` -- DE- (259) und EN-Seiten (259) prerendered, 0 neue Warnungen (17 pre-existing 404/unseen-route-Warnungen identisch zur Baseline vor dieser Spec, per `git stash`-Vergleich verifiziert)

**Manual checks:**

- Preview (`pnpm build && pnpm preview`, echter `adapter-node`-Build): `/kiez/alexanderplatz` vs. `/en/kiez/alexanderplatz` (lang, Switcher, Disclaimer, hreflang im Quelltext) -- verifiziert. `/es/kiez/alexanderplatz` → 301 `/kiez/alexanderplatz` -- verifiziert. `/en/wo-lebt-es-sich-gut` → 301 `/en/umwelt-infrastruktur-score` -- verifiziert.
