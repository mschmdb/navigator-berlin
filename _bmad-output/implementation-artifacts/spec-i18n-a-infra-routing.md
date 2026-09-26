---
title: 'i18n Block A: Locale-Infrastruktur, /en-Routing und SEO-Mechanik'
type: 'feature'
created: '2026-09-26'
status: 'in-progress'
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

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | GET `/berlin-wahlen` | 200, `lang="de"`, kein Redirect | N/A |
| EN-Route | GET `/en/berlin-wahlen` | 200, `lang="en"`, Disclaimer „noch nicht übersetzt“, Inhalt DE | N/A |
| Inaktive Alt-Locale | GET `/es/kiez/x` | 301 → `/kiez/x` | N/A |
| Open-Redirect | GET `/es//evil.example` | kein Redirect nach außen | bleibt auf eigenem Host |
| Umbenannte Route EN | GET `/en/wo-lebt-es-sich-gut` | 301 → `/en/umwelt-infrastruktur-score` | N/A |
| Switcher | auf `/kiez/x` Klick „English“ | `/en/kiez/x` | N/A |
| hreflang | als übersetzt markierte Seite | `de`, `en`, `x-default` (= DE) | N/A |
| Nicht übersetzt | GET `/en/kiez/x` (nicht im Register) | `noindex`, kein hreflang-Paar, nicht in `sitemap-en.xml`; DE-Seite ohne `en`-Alternate | N/A |

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
- [ ] Paraglide-Config + `messages/en.json` + gemeinsamer `Locale`-Typ -- Basis für N Locales
- [ ] `stale-locale-redirect.ts`, `renamed-route-redirect.ts` (+ Tests) -- `/en` lebt, Alt-Locales weiter 301
- [ ] `lang-switcher.svelte` (+ Test), in Header, Mobile-Drawer, Footer -- Sprachwechsel
- [ ] `translation-disclaimer.svelte` verallgemeinert + im Layout (+ Test)
- [ ] `seo-head.svelte`, `hreflang.ts`, `canonical.ts`, JSON-LD-Builder (+ Tests) -- Locale-korrekte Meta
- [ ] Sitemap-Index + `sitemap-en.xml` + Sources + `xhtml:link` (+ Tests, Consistency-Test) -- EN-Einträge nur aus dem Übersetzungs-Register (Block A: leer)
- [ ] OG-Pfade mit Locale und DE-Fallback (+ Test)
- [ ] ADR-005, ADR-INDEX, `architecture.md` -- Doku konsistent
- [ ] Zeitmessung: Start/Ende jeder Phase in Implementation Notes

**Acceptance Criteria:**
- Given der Build, when prerendert wird, then existieren alle bisherigen DE-Seiten unverändert und jede zusätzlich unter `/en/…`, ohne Prerender-Warnungen.
- Given `pnpm build && pnpm preview`, when `/en/kiez/<slug>` geladen wird, then antwortet der Server 200 mit `lang="en"`, Switcher und Disclaimer, und `/kiez/<slug>` bleibt 200 mit `lang="de"`.
- Given die bestehende Test-Suite, when sie läuft, then ist sie grün; neue Tests decken jede Matrix-Zeile ab.

## Implementation Notes

- 26.09. 17:03 Start Planung (Step 1). 17:10 Checkpoint 1 freigegeben (Matze). 17:03 Paraglide 2.18.0 → 2.25.4 (`1678f59`). 17:04-17:07 Recherche (2 Subagenten).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build` -- expected: DE- und EN-Seiten prerendered, keine Warnungen

**Manual checks:**
- Preview: `/berlin-wahlen` vs. `/en/berlin-wahlen` (lang, Switcher, Disclaimer, hreflang im Quelltext), `/es/kiez/x` → 301.
