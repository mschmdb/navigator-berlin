---
status: Accepted
date: 2026-05-11
accepted: 2026-09-26
deciders: solo-maintainer
---

# ADR-005: Paraglide v2 für i18n, DE als Master, `/en` als erste Übersetzung

## Context

navigator.berlin startete deutschsprachig. Paraglide v2 war installiert, aber leer: ein Dummy-Key, eine Locale (`de`), `/en/…` wurde per 301 auf DE umgeleitet. Die ursprüngliche Architektur (`architecture.md`) plante 8 Sprachen mit `[lang=lang]`-Param-Matcher und `Accept-Language`-Redirect. Diese Route-Struktur wurde nie gebaut; stattdessen lief das Projekt über die Phase-1-Reduktion auf DE-only (Memory `project_i18n_phase_1_de_only`).

26.09.2026 (Matze): Umsetzung startet mit einer Infra-Spec (`spec-i18n-a-infra-routing.md`, Block A eines Vier-Block-Plans, `_user-input/plan-i18n-de-en-2026-08-22.md`). Anforderungen:

- N Locales vorbereiten (aktuell `de`, `en`; später `es`/`tr`), keine `'de' | 'en'`-Hartverdrahtung in Typen.
- DE bleibt Master ohne URL-Präfix, keine bestehende DE-URL ändert sich.
- Kein Auto-Redirect nach Cookie/`Accept-Language` (Cookieless-Linie, ADR-004, MUST-Rule #10).
- SEO darf keine Ranking-Substanz verlieren: `/en`-Seiten ohne echten übersetzten Content dürfen nicht indexiert werden und nicht in Sitemap/hreflang auftauchen.

## Decision

**Locale-Strategie:** Paraglide-Strategy `['url', 'baseLocale']`. `baseLocale = 'de'` trägt keinen URL-Präfix (Default-URL-Pattern), jede weitere Locale bekommt `/{locale}/…` (aktuell nur `/en/…`). Kein `cookie`/`preferredLanguage`-Strategy-Eintrag: ein impliziter Redirect nach Nutzer-Präferenz widerspräche der Cookieless-Linie.

**Ein Locale-Typ:** `Locale` kommt aus `$lib/paraglide/runtime` (`typeof locales[number]`, generiert aus `project.inlang/settings.json`). Die vormals drei separaten Typen `SupportedLocale` (hreflang.ts), `SitemapLocale` (sitemap-builder.ts) und `authorities.Locale` sind konsolidiert. Neue Locale hinzufügen heißt `project.inlang/settings.json` erweitern, keine Type-Duplikate pflegen.

**Übersetzungs-Register als eine Quelle der Wahrheit:** `$lib/seo/translation-register.ts` exportiert `TRANSLATION_REGISTER: readonly { pathname: string; locale: Locale }[]` plus `isRouteTranslated(pathname, locale, entries?)`. DE ist immer "übersetzt" (Master). Jede andere Locale muss pro Pfad explizit eingetragen werden. `SeoHead` (noindex, hreflang, canonical, og:locale), die Sitemap-Sources und `llms-builder` lesen ausschließlich dieses Register, statt je eigene `locale !== 'de'`-Checks zu pflegen. Der optionale `entries`-Parameter (Default: das echte Register) macht die Register-Daten für Tests injizierbar, ohne Module zu mocken. In Block A ist das Register leer:

- Jede `/en/…`-Seite ist `noindex`, hat kein `hreflang="en"`-Gegenstück, taucht nicht in `sitemap-en.xml` auf.
- Die DE-Seite hat entsprechend kein `en`-Alternate.
- `TranslationDisclaimer` zeigt auf jeder `/en/…`-Seite den Fallback-Hinweis ("noch nicht übersetzt"), weil `effectiveLocale` (Content-Sprache) auf DE zurückfällt.

Eine spätere Story markiert Pfade als übersetzt, indem sie Einträge in `TRANSLATION_REGISTER` ergänzt. Kein anderes Modul ändert sich dafür.

**Entscheidung Matze 26.09.2026, 21:06 (i18n Block B, `spec-i18n-b-wahlportal.md`):** Eine echt übersetzte Seite (`effectiveLocale === pageLocale`, z. B. `/en/berlin-wahlen` nach der Registrierung) zeigt KEINEN Übersetzungs-Hinweis mehr. Die vormalige `translated`-Variante von `TranslationDisclaimer` ("Translated from German source. Original DE version remains authoritative.") entfiel ersatzlos -- Variante, Messages `disclaimer_translated` (de/en) und die zugehörigen Tests wurden entfernt. `TranslationDisclaimerVariant` kennt nur noch `'fallback-to-base'`; die Komponente rendert `null` sowohl für Basis-Locale-on-Basis-Locale als auch für eine echt übersetzte Nicht-Basis-Seite.

*Kontext:* Der `translated`-Hinweis stand permanent über jeder echt übersetzten Seite ("Translated from German source. Original DE version remains authoritative."), unabhängig davon, wie gut oder aktuell die Übersetzung war. Matze empfand das als redundantes Dauer-Disclaimer-Rauschen: Sobald ein Pfad im Register steht, ist die Übersetzung als vollwertig freigegeben, kein laufender Vorbehalt nötig. Der `fallback-to-base`-Hinweis bleibt dagegen, weil er eine ECHTE Abweichung meldet (die Seite zeigt gerade nicht ihre eigene Sprache).

*Konsequenz:* DE bleibt weiterhin die maßgebliche Quelle (Master-Source-Prinzip, siehe oben), das ist ab jetzt aber nicht mehr auf jeder EN-Seite selbst als Text sichtbar. Erkennbar bleibt es über den Sprachumschalter (führt jederzeit zur DE-Originalseite) und über die Methodik-Seiten. Sollte künftig doch ein sichtbarer Provenienz-Hinweis gewünscht sein (z. B. Footer-Zeile "Translated from German"), ist das ein neuer, bewusster Entscheid, keine Wiederherstellung der entfernten Variante -- die alte Variante war ein Dauer-Banner, kein Footer-Hinweis.

**Redirects:** `stale-locale-redirect.ts` leitet historische Locale-Präfixe (`de`, `en`, `es`, `fr`, `it`, `pl`, `tr`, `ar` aus dem Vor-Phase-1-Schema) auf den DE-Canonical um, mit einer Ausnahme: Präfixe, die aktuell eine echte, aktive Nicht-Basis-Locale-Route sind (aktuell nur `en`), werden aus der Stale-Menge entfernt. `de` bleibt für immer "stale" als Präfix, weil die Basis-Locale nie einen URL-Präfix bekommt. `renamed-route-redirect.ts` zieht einen aktiven Locale-Präfix (case-insensitiv, wie beim Stale-Redirect) vor dem Lookup ab und hängt ihn kanonisiert ans Redirect-Ziel wieder an (`/en/wo-lebt-es-sich-gut` → `/en/umwelt-infrastruktur-score`), damit umbenannte Routes innerhalb ihrer Locale bleiben.

**Sprachumschalter:** `lang-switcher.svelte` listet alle `locales` aus dem Runtime, Linktext in der jeweiligen Zielsprache (`Intl.DisplayNames`), volles Reload (`data-sveltekit-reload`, kein Client-Side-Rerender mit veraltetem Locale-Context), aktuelle Sprache als `aria-current="true"`-Element mit sr-only-Zusatz statt als Link. Aria-Label ("Sprache"/"Language") kommt aus einer Paraglide-Message; ein `landmark`-Prop steuert, ob die Instanz ein eigenes `<nav>`-Landmark stellt, damit nicht zwei gleichnamige Landmarks (Header/Drawer + Footer) gleichzeitig sichtbar sind.

**Content-Locale vs. URL-Locale:** `resolveEffectiveLocale(pathname, pageLocale)` liefert die Locale, deren CONTENT tatsächlich rendert (DE, solange der Pfad nicht im Register steht). `og:locale`, JSON-LD `inLanguage`, `<main lang>` und der Disclaimer-Text folgen dieser effektiven Locale, nicht der URL-Locale. Der Canonical-Link folgt derselben Regel: eine nicht übersetzte Nicht-Basis-Seite zeigt 1:1 DE-Content und muss deshalb auf die DE-URL canonicalisieren statt auf sich selbst, sonst meldet Google zwei URLs mit identischem Content. `<html lang>` bleibt dagegen immer die URL-Locale (I/O-Matrix-Vorgabe), nur der Content-Bereich (`<main>`) und die Meta-Ebene folgen der effektiven Locale.

**OG-Bilder:** bleiben unversioniert pro Locale, alle Locales nutzen die DE-Karte, weil keine EN-Karten existieren und Slugs ohnehin locale-identisch sind (keine übersetzten Pfad-Slugs). Per-Locale-OG-Karten sind für Block C vorgesehen.

## Consequences

**Positive:**

- `/en/…` existiert als echte, gecrawlte Route-Familie, ohne DE-SEO zu gefährden (noindex bis Content real ist).
- Ein Type, ein Register: neue Locale oder neue übersetzte Seite ist ein lokalisierter Edit, kein Multi-File-Sync.
- Sprachumschalter und Disclaimer sind bereits auf N Locales ausgelegt (kein Rewrite für `es`/`tr`).

**Negative / Trade-offs:**

- `translation-register.ts` ist in Block A tote Infrastruktur (immer leer). Wert entsteht erst mit dem ersten Registereintrag in einem späteren Block.
- Zwei Sitemaps (`sitemap-de.xml`, `sitemap-en.xml`) statt einer; `sitemap-en.xml` ist bis auf Weiteres ein leeres, aber valides `<urlset>`.
- UI-Text-Extraktion (Block B) ist explizit NICHT Teil dieser Entscheidung. Kiez/Bezirk-Prosa bleibt bis dahin deutsch, auch unter `/en/…`.

**Operational:**

- CI/Build: `svelte.config.js`-Prerender-Entries decken `/sitemap-en.xml` ab; die versteckten Crawl-Links in `+layout.svelte` (`{#each locales as locale}`) sorgen dafür, dass `*` im Prerender jede DE-Seite automatisch auch unter `/en/…` entdeckt.
- Migration bestehender Seiten: keine. DE-URLs, DE-Slugs, DE-Redirects bleiben unverändert.

## References

- [Spec i18n Block A: Locale-Infrastruktur, /en-Routing und SEO-Mechanik](../../_bmad-output/implementation-artifacts/spec-i18n-a-infra-routing.md)
- [Plan: Internationalisierung DE/EN](../../_user-input/plan-i18n-de-en-2026-08-22.md)
- [ADR-004: Cookieless-Architektur](ADR-004-cookieless.md) (Strategy `['url', 'baseLocale']`, kein Cookie-Fallback)
- [Paraglide-JS: Strategy](https://paraglidejs.com/strategy)
