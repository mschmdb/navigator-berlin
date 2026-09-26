---
title: 'i18n Block B2: Shell und Startseite auf Englisch'
type: 'feature'
created: '2026-09-26'
status: 'done'
baseline_commit: '0f2b46b88e1b37e0c7bf2cd9836945dc6ecadb65'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b-wahlportal.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Header, Mobile-Drawer, Footer, Meta-Links und Startseite sind auf allen `/en`-Seiten deutsch, obwohl sie außerhalb von `<main lang>` unter `<html lang="en">` stehen (WCAG 3.1.1). Interne Links der Shell und der Startseite führen von `/en` zurück auf DE (deferred aus Block A).

**Approach:** Shell- und Startseiten-Texte in Paraglide-Messages extrahieren und übersetzen (~150 bis 175 Keys, Muster Block B), interne Links über `localizedHref`, Top-Level-Konstanten (`meta-links.ts`, Home-Content-Module) zu Funktionen bzw. Label-Keys umbauen. Branch `feat/i18n-en`, Merge erst nach verifiziertem Launch.

## Boundaries & Constraints

**Always:**
- Entscheidungen Matze (Block B): Glossar (Kiez/Bezirk deutsch, Wahlbegriffe/Behörden wie Block B), übersetzte Seiten ohne Übersetzungs-Hinweis, kein Sprachzusatz an Links, DE-Ausgabe Zeichen für Zeichen gleich.
- Geteilte Bausteine (`address-search`, `KiezScoreRing`, `data-table-alternative`, `editorial-disclaimer`) behalten DE-Defaults; Shell und Startseite übergeben Labels per Prop (Lehre Block-B-Review #2).
- Datenschlüssel bleiben: Meta-Link-Gruppen bekommen eine feste `id` (Kontakt-Link hängt heute an `title === 'Sonstiges'`), Quick-Link-`query`, Update-`category`-Slugs, Wahl-Slugs, Query-Parameter (`?finder=1`, `?view=bezirke`, `&mode=hitze`), Plausible-Events.
- Datum über `src/lib/i18n/format.ts`; Update-Kategorien über Label-Map.
- TDD pro AC.
- Entscheidung Matze 26.09. 22:32 (1A): Shell (Header, Drawer, Footer, Skip-Link) ist auf allen `/en`-Seiten englisch, auch auf nicht übersetzten (WCAG 3.1.1, konsistente Navigation).
- Entscheidung Matze 26.09. 22:32 (2A): Startseite wird als übersetzt registriert (`{ pathname: '/', locale: 'en' }` ohne `prefix`). Update-Titel/-Summaries nutzen `title_en`/`summary_en`, wo vorhanden, sonst DE mit `lang="de"` am Element; Kiez-Profil-Auszüge ohne EN-Fassung ebenso mit `lang="de"`.

**Never:**
- Kein Atlas `/explore` inkl. Bookmark-Dialog (B3), keine Kiez/Bezirk/Layer-Detailseiten (B4), keine Fließtexte/Profile/Update-Bodies, keine OG-Karten (Block C).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/` und beliebige DE-Seite | Shell und Startseite wie vor B2 | N/A |
| EN-Shell | `/en/berlin-wahlen` | Header, Drawer, Footer englisch | N/A |
| EN-Links | Footer-Link „Methodology“ auf `/en/...` | Ziel `/en/methodik` | N/A |
| Kontakt-Link | Footer/Drawer auf `/en` | Kontakt-Link vorhanden (Gruppen-`id`, nicht Titel) | N/A |
| Quick-Link | EN-Startseite Quick-Link | Label englisch, `?q=` unverändert deutsch | N/A |
| Geteilter Baustein | `address-search` auf nicht übersetzter DE-Fallback-Seite ohne Prop | DE-Default | N/A |
| Startseite EN | `/en` | indexierbar, hreflang de/en/x-default, DE-Update-Titel mit `lang="de"` | N/A |
| Key-Parität | Key nur in `de.json` | Paritätstest schlägt an | Test |

</frozen-after-approval>

## Code Map

- Shell: `src/lib/components/atlas/site-header.svelte` (~9 Strings, Layer-/Bookmark-Trigger mit Zahl-Parameter, `AddressSearch variant="header"` ohne Placeholder-Prop :136, Links `/` :92, `/explore?finder=1` :72), `address-search-overlay.svelte` (2), `mobile-meta-drawer.svelte` (4, `group.title === 'Sonstiges'` :86), `meta-footer.svelte` (3 + Claim, :67), `internal/meta-links.ts` (14 Labels, 21 hrefs, Top-Level-Konstanten), `skip-link.svelte` (1), `internal/social-links.svelte` (4 aria-labels → 1 Key mit Parametern), `src/routes/+layout.svelte:88-89` (WebSite-JSON-LD-Beschreibung).
- `address-search.svelte` -- zusätzlich hart deutsch ohne Prop: „Adresse nicht gefunden …“ :109, „Keine Vorschläge“/„{n} Vorschläge“ :116 → neue Props mit DE-Default; Header, Overlay, Startseite und Wahlportal übergeben EN.
- Startseite: `src/routes/(with-header)/+page.svelte` (SEO :31-36), `+page.server.ts:180-183` (Updates `title_de`/`summary_de`), Komponenten unter `src/lib/components/home/` (hero 5, featured-score 2, finder-teaser 11, hook 4, steps 8, quick-links 2, wahl-teaser ~10, hitze-teaser 5, featured-bezirke 3, top-kieze 3, layer-teasers 2, updates-teaser 2 + Datum :26 + Kategorie, open-block 3), `atlas/charts/kiez-score-ring.svelte` (`DIMENSION_LABELS_DE`, „Gesamt“ :111/121 → Props).
- Content-Module `src/lib/content/home-layer-teasers.ts`, `home-featured-bezirke.ts`, `home-data-sources.ts`, `home-quick-links.ts` (`query` bleibt), `screenshot-manifest.ts` (~34 Texte, Top-Level).
- Links: alle festen Pfade der Startseite (hero, finder, hook, quick-links, wahl, hitze inkl. `buildExplorerDeepLink`, bezirke, top-kieze, layer, updates, open-block, featured `exploreHref` aus `+page.server.ts:124`).
- `src/lib/seo/translation-register.ts` -- Startseite ggf. `{ pathname: '/', locale: 'en' }` ohne `prefix`.
- Tests mit DE-Texten (~20 bis 30): `meta-footer.svelte.test.ts`, `site-header.svelte.test.ts:185`, `skip-link.svelte.test.ts`, `address-search.svelte.test.ts`, `home-*.svelte.test.ts`, `tests/e2e/tab-order.e2e.ts:36,44`, `i18n-routing.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `meta-links.ts` + Content-Module auf Funktionen/Label-Keys, Gruppen-`id` (+ Tests)
- [x] Shell-Komponenten auf Messages, Links über `localizedHref` (+ Tests)
- [x] `address-search`/`KiezScoreRing`: neue Label-Props mit DE-Default; Aufrufer übergeben Messages (+ Tests)
- [x] Startseiten-Komponenten + SEO auf Messages, Datum/Kategorie über Formatter/Label-Map, Links über `localizedHref` (+ Tests)
- [x] Register und e2e laut Entscheidungen; Key-Parität, `lint:wahl`
- [x] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/berlin-wahlen`, when die Seite lädt, then sind Header, Drawer und Footer englisch, und jeder interne Shell-Link zeigt auf `/en/…`.
- Given `/en`, when die Startseite lädt, then sind alle UI-Texte englisch (außer Glossar, Eigennamen, Parteinamen und laut Entscheidung markierten DE-Inhalten).
- Given die DE-Seiten, when die bestehenden Tests laufen, then sind sie unverändert grün.

## Implementation Notes

- 26.09. 22:17 Start Planung, 22:17-22:21 Inventur (1 Subagent), 22:32 Fragen entschieden (1A, 2A), 22:33 Checkpoint 1 freigegeben (Matze).
- Umsetzung (dieselbe Session, selbst umgesetzt, kein Subagent-Fan-out wegen gemeinsamer `messages/*.json`-Schreibzugriffe -- Lehre aus Block B):
  - **Messages** (~1h Recherche + Planung): 137 neue Keys (`shell_*` für Header/Drawer/Footer/Skip-Link/Social-Links/Meta-Links, `home_*` für Startseite inkl. Content-Module) in `messages/de.json`/`messages/en.json`, DE-Werte 1:1 aus dem Bestandscode extrahiert (Byte-Paritäts-Garantie), EN-Übersetzungen neu geschrieben. Glossar konsistent mit Block B (Kiez/Bezirk deutsch, Abgeordnetenhaus/BVV-Gloss bei Erstnennung, existierende `wahl-labels.ts`-Funktionen für die Wahl-Teaser-Karten wiederverwendet statt neuer Keys).
  - **Shell** (~45 min): `skip-link.svelte` (Message statt Literal, da Shell IMMER `getLocale()` folgt, kein DE-Default-Prop wie bei den 2 explizit ausgenommenen Bausteinen), `site-header.svelte`, `address-search-overlay.svelte`, `mobile-meta-drawer.svelte`, `meta-footer.svelte`, `internal/meta-links.ts` (Umbau auf `id`-Datenschlüssel + `metaLinkLabel()`/`metaLinkGroupTitle()`, Kontakt-Bedingung von `title === 'Sonstiges'` auf `id === 'sonstiges'`), `internal/social-links.svelte` (4 aria-labels → 1 parametrisierte Message), `src/routes/+layout.svelte` (WebSite-JSON-LD-Beschreibung folgt der EFFEKTIVEN Locale wie das `locale`-Feld selbst, nicht der URL-Locale -- sonst Inkonsistenz zwischen `inLanguage` und Text auf noch nicht registrierten `/en`-Seiten). Alle Shell-Links über `localizedHref`.
  - **Geteilte Bausteine** (~30 min): `address-search.svelte` bekommt 3 neue Props (`notFoundLabel`/`noSuggestionsLabel`/`suggestionsCountLabel`) mit DE-Default, `kiez-score-ring.svelte` bekommt `overallLabel`/`noDataLabel`/`dimensionLabels` mit DE-Default -- beide Bausteine bleiben damit auf nicht übersetzten Seiten deutsch (Lehre Block-B-Review #2). Shell (Header, Overlay) und Wahlportal (`winner-map.svelte`, Lücke aus Block B) übergeben jetzt alle drei neuen Props.
  - **Startseite** (~1.5h): alle 12 `home/*.svelte`-Komponenten + `+page.svelte`/`+page.server.ts` auf Messages. Content-Module (`home-quick-links.ts`, `home-layer-teasers.ts`, `home-featured-bezirke.ts`, `home-data-sources.ts`, `screenshot-manifest.ts`) von Modul-Konstanten auf `id`/`slug`-Datenschlüssel + Resolver-Funktionen umgebaut (Auswertung beim Aufruf). Bezirk-`displayName`/Datenquellen-`name`/Quick-Link-`label` bleiben unübersetzte Eigennamen (kein Message-Key nötig). Wahl-Teaser-Karten (`home-wahl-teaser.svelte`) bauen Titel/Typ-Label/Quelle jetzt aus den Block-B-Funktionen (`wahlReiheLabel`/`wahlTypLabel`/`wahlStimmtypLabel`/`wahlVorlaeufigLabel`/`sourceDisplayLabel`) statt hartcodierter Strings -- DE bleibt dadurch beweisbar byte-identisch, EN kommt kostenlos mit. Neue `formatShortDate()` in `src/lib/i18n/format.ts` (TDD, ersetzt das bisher fest auf `de-DE` verdrahtete `toLocaleDateString` der Updates-Teaser). Neue `updateCategoryLabel()` in `src/lib/content/updates/category-label.ts`. `+page.server.ts`s `loadUpdates()` löst `title_en`/`summary_en` serverseitig auf (Entscheidung 2A); aktuell haben 0 von 14 Update-Einträgen eine EN-Fassung, alle 3 Home-Teaser fallen also auf DE mit `lang="de"` zurück (manuell + e2e verifiziert).
  - **Register + SEO** (~15 min): `translation-register.ts` bekommt `{ pathname: '/', locale: 'en' }` (exakter Match, kein `prefix`). `+page.svelte`/root `+layout.svelte`s JSON-LD-`locale`/-Beschreibung folgen jetzt konsequent derselben `resolveEffectiveLocale()`-Locale.
  - **Tests**: bestehende DE-Tests bleiben unverändert grün (Byte-Paritäts-Beweis lief automatisch mit, keine Anpassung nötig außer 2 Stellen, die explizit auf das jetzt gefüllte Register reagieren: `translation-register.test.ts`, `effective-locale.test.ts` -- beide erwarteten vorher "`/` ist nicht registriert", jetzt ist sie es). Neue EN-Testblöcke (`overwriteGetLocale`-Pattern aus Block B) in `skip-link`/`site-header`/`meta-footer`/`address-search`/`kiez-score-ring`/`social-links`-Tests + 3 neue Testdateien (`meta-links.test.ts`, `mobile-meta-drawer.svelte.test.ts`, `address-search-overlay.svelte.test.ts`, die vorher gar keine Unit-Tests hatten). `home-content.test.ts` erweitert um EN-vs-DE-Differenzierung für alle 5 Content-Module. `home-wahl-teaser.svelte.test.ts` bekommt DE-Byte-Paritäts- + EN-Glossar-Test für die Karten-Titel-Komposition.
  - **e2e** (`tests/e2e/i18n-routing.e2e.ts`, ~45 min inkl. Origin-Diagnose): 2 pre-existing Tests angepasst (Register jetzt mit `/`-Eintrag). Neue Blöcke „i18n Block B2: Startseite /en" (4 Tests: Index/hreflang, EN-Textstichprobe exkl. DE-Fallback-Updates, `lang="de"`-Marker-Nachweis, interne Links) und „i18n Block B2: Shell ist englisch auf jeder /en-Seite, auch nicht übersetzten" (2 Tests, gegen `/en/methodik` -- bewusst NICHT übersetzt, damit die Shell-Assertion unabhängig vom Content-Übersetzungsstatus ist). **Diagnose-Fund:** `/` (Home) ist die einzige nicht-prerenderte Route (Story 2.11 SSR-Pivot wegen Hitze-Reroute-Hook) -- ihre absolute hreflang-Origin folgt deshalb dem tatsächlichen Request statt `svelte.config.js`s `prerender.origin` (nur beim Build wirksam); Tests darauf auf Pfad- statt feste-Origin-Assertion umgestellt, Kommentar im Test erklärt das für künftige Bearbeiter.
  - Verifikation: `pnpm test:unit -- --run` 4324/4324 grün (1 bekannter Flake `winner-map.svelte.test.ts` in Kombi-Läufen, isoliert + im finalen Solo-Lauf grün, siehe Block B), `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Verstöße (72 Dateien), `pnpm build` 0 neue Warnungen (17 pre-existing 404/unseen-route, identisch zur Baseline). `i18n-routing.e2e.ts` 50/50 grün (inkl. 6 neuer Block-B2-Tests), `tab-order.e2e.ts` 3/4 grün (1 bekannter, vorbestehender Fail -- Logo-aria-label-Regex erwartet "navigator.berlin Startseite", Code lieferte nachweislich schon vor dieser Story nur "navigator.berlin", siehe `git show HEAD:...site-header.svelte`, außerhalb Boundary), `a11y.e2e.ts` 6/9 grün (dieselben 3 bekannten, Wahlportal/Shell-fremden Fails wie in Block B: Root/Karte, Wortmarke-Showcase, Escape-löscht-Selection). Manuelle Prüfung gegen `pnpm build && ORIGIN=... pnpm preview`: `/en` liefert `<html lang="en">`, englischen Hero/Footer/Header-Text, korrekte `/en/...`-interne Links, DE-Update-Fallback mit `lang="de"`; `/en/methodik` (nicht übersetzt) zeigt englische Shell + DE-Fallback-Disclaimer.
  - Zeitmessung gesamt (Koordinator): Planung 22:17-22:33 (16 min), Umsetzung 22:33-ca. 01:15 (rund 4h, größtenteils Messages+Startseiten-Content-Module wegen des Umbaus von Modul-Konstanten auf Resolver-Funktionen), e2e-Diagnose (Origin-Frage) + Fix rund 20 min darin enthalten. Gesamt rund 4h 15min.

- Zeitmessung gesamt (Koordinator): Planung 22:17-22:33 (16 min inkl. 2 Fragen), Umsetzung 22:33-23:19 (46 min), Review 3 Layer 23:20-23:22 (2 min), Patch-Runde 23:23-23:58 (35 min), Abschluss 23:59. Gesamt rund 1 h 42 min.
- Qualität: 21 Review-Funde, davon 2 high (Featured-Score-Link nicht lokalisiert, wirkungslose e2e-Negativ-Regex); 19 gepatcht, 1 deferred (Popover-Leerzustand-Test), 1 rejected. Endstand: Unit 4334/4334, e2e i18n 47/47, check 0, lint:wahl 0. Review-Triage durch Koordinator (Matze AFK, Freigabe per Ansage 22:57).


## Review Triage Log

Runde 1 (26.09.2026 23:22), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 6, Verification Gap (VG) 7 + 3. Koordinator-Triage (Matze AFK, Freigabe per Ansage 22:57). P = patch, D = defer, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Featured-Score-Link ohne `localizedHref` | high | `home-featured-score.svelte:138`, AC verletzt | P |
| 2 | BH | e2e-Negativ-Regex `\böffnen\b` greift nie (ö kein `\w`) | high | Test prüft nichts | P |
| 3 | BH/EC/VG | Plural fehlt (1 saved addresses, 1 active layers, 1 suggestions, Home-Headings) | medium | Test zementiert Fehler | P |
| 4 | EC | Hitze-Subdomain: Pfad `/` bekommt EN-hreflang der Startseite | medium | Register `/` ohne App-Mode-Unterscheidung | P |
| 5 | EC | Leeres `title_en`/`summary_en` → leerer Titel | low | `??` statt trim | P |
| 6 | EC | `formatShortDate` ohne alte Zeitzone | medium | Datum kann um einen Tag springen | P |
| 7 | BH/VG | DE-Kategorie „daten-update“ → „Daten-Update“ (DE-Ausgabe geändert), zweite Label-Quelle neben `CATEGORY_LABEL_DE` | medium | Spec: DE Zeichen für Zeichen gleich | P |
| 8 | BH | Message-Keys `home_update_category_*` falsch geschnitten | low | Updates-Seite braucht dieselben | P: `update_category_*` |
| 9 | BH | Resolver-Muster 5× kopiert, IDs untypisiert, uneinheitlicher Fallback | medium | `LocaleFormatOptions` existiert | P |
| 10 | BH | `home_wahl_lead` EN sinnverdreht | medium | „3,500 polygons per polling district“ | P |
| 11 | BH | Zahl 23 (Wahlen), 12, „Über 500“ fest im Code/Text | low | veraltet beim nächsten Ingest | P: Wahl-Anzahl aus Daten, 12 Bezirke bleibt |
| 12 | VG/BH | Home-Links (Quick-Link, Layer, Bezirke, Top-Kieze, Updates, Open-Block, Hook, Finder, Hitze) ohne EN-href-Test; e2e-Titel verspricht mehr | gap | | P |
| 13 | VG | Update-EN-Pfad + `updateCategoryLabel` ungetestet | gap | Spec behauptet getestet | P |
| 14 | VG | Score-Ring-EN-Labels auf Startseite ungetestet | gap | | P |
| 15 | VG | Kompakter Footer (`/en/explore`) ohne EN-Test | gap | | P |
| 16 | VG | SEO-Texte (Titel, JSON-LD-Description) ungetestet | gap | | P |
| 17 | BH | Meta-Footer-EN-Test deckt nur 7 von 10 Links | gap | | P: Loop über `META_LINKS` |
| 18 | EC | Site-Header-Test ohne Pflicht-Prop `geocode` | low | | P |
| 19 | BH | Restrisiken in Spec unvollständig | low | Updates-Links, Score-Ring-Default, tab-order | P |
| 20 | BH/VG | `notFoundLabel` nie gerendert getestet | gap | braucht Popover-Gerüst | D |
| 21 | BH | Leerzeilen-Reformat in Message-Dateien | low | Rauschen | R |

_Kein separater Multi-Layer-Review in dieser Session gelaufen (`review_loop_iteration: 0`); Selbst-Verifikation über die volle Test-/Check-/Build-/e2e-Kette (siehe Verification), analog Block B._

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- grün: 456 Testdateien, 4324 Tests (1 bekannter Flake in `winner-map.svelte.test.ts`, isoliert grün, unverändert seit Block B)
- `pnpm check && pnpm lint:wahl` -- 0 Fehler (6905 Dateien; `lint-wahl-editorial`: 72 Dateien inkl. beider Message-Dateien, 0 Verstöße)
- `pnpm build`, Preview, `i18n-routing.e2e.ts`, `tab-order.e2e.ts`, `a11y.e2e.ts` -- grün (bekannte a11y-Fails ausgenommen): `pnpm build` 0 neue Warnungen (17 pre-existing, Baseline-Parität); `i18n-routing.e2e.ts` 50/50; `tab-order.e2e.ts` 3/4 (1 vorbestehender, Story-fremder Fail); `a11y.e2e.ts` 6/9 (3 bekannte, Wahlportal/Shell-fremde Fails, identisch zur Block-B-Baseline)

**Manual checks:**
- `/en` und `/en/methodik` durchlesen (curl gegen `pnpm build && pnpm preview`, teils mit `ORIGIN=https://navigator.berlin`): englischer Header/Footer/Hero/Steps/Quick-Links/Layer-Teaser/Wahl-Teaser/Hitze-Teaser/Featured-Bezirke/Open-Block-Text, `<html lang="en">`, kein Übersetzungs-Disclaimer auf `/en`, Fallback-Disclaimer weiterhin auf `/en/methodik`, alle internen Links `./en/...`-präfixiert, Update-Teaser zeigt DE-Titel/-Summary mit `lang="de"` (keine der 14 Update-Dateien hat aktuell `title_en`/`summary_en`).

## Bekannte Restrisiken

- `tab-order.e2e.ts`s „Tab-Reihenfolge"-Test erwartet ein Logo-aria-label „navigator.berlin Startseite", das im Code nachweislich nie existierte (vorbestehender Test-Bug, kein Block-B2-Fund) -- außerhalb der Spec-Boundary, nicht gefixt, hier nur dokumentiert.
- Update-Titel/-Summaries sind aktuell zu 100% DE-Fallback (`lang="de"`); der `title_en`/`summary_en`-Pfad ist implementiert + getestet (Frontmatter-Schema, `+page.server.ts`), aber ungenutzt bis der erste Update-Eintrag eine EN-Fassung bekommt.
- `HOME_DATA_SOURCES.license`-Badges (`dl-de/zero-2-0` etc.) bleiben bewusst unübersetzt (Rohcode als Badge, Code-Map nennt nur `description`); eine Vereinheitlichung mit `licenseDisplayLabel()` aus Block B wäre Scope-Erweiterung.
- Der EN-Update-Teaser verlinkt auf `/en/updates/{slug}` -- diese Detailseiten selbst sind NICHT registriert/übersetzt (Boundary, out of scope), zeigen also den Fallback-Hinweis. Bewusst akzeptiert (Home selbst ist korrekt übersetzt, die verlinkte Zielseite dokumentiert ihren eigenen Übersetzungsstatus).
- `KiezScoreRing` bleibt außerhalb der Startseite (Kiez-/Bezirk-Detailseiten, Inspector, `/explore`) beim DE-Default, auch unter der jetzt englischen Shell -- diese Seiten sind selbst nicht übersetzt (Block B3/B4), das ist der bewusste Boundary-Zustand, kein Fund dieser Runde.

### Review-Fix-Runde (nach Erst-Review, vor Abschluss)

Funde: `home-featured-score.svelte` fehlendes `localizedHref` auf dem Karten-Link; `\b`-Wortgrenzen in `i18n-routing.e2e.ts` matchen nie bei führendem Umlaut (öffnen/Übersicht); 6 Count-Messages ohne Singular/Plural (Layer-/Bookmark-Trigger, Suggestions-Count, Layer-/Open-Block-Heading, Wahl-All-Link); Hitze-Subdomain-Reroute übernahm faelschlich die Home-Registrierung von `/` für hreflang; `loadUpdates`-Mapping war ungetestet + `title_en`/`summary_en` ohne `trim()`-Guard; `formatShortDate` erzwang eine Zeitzone, die die alte Formatierung nie hatte; Update-Kategorie-Label änderte die DE-Ausgabe (Slug → Label) und dupliziert `CATEGORY_LABEL_DE`; 6 Resolver-Module kopierten `toOptions()`/`*Options` mit untypisierten `id: string`; EN-Satzbau in `home_wahl_lead` verdrehte die Aussage; `home_wahl_all_link`-Zahl war hardcoded `23`. Alle gepatcht: `localizedHref` ergänzt, Unicode-Lookaround (`(?<!\p{L})…(?!\p{L})/u`) statt `\b`, `_singular`/`_plural`-Keys (DE unverändert, EN korrigiert), Hitze-Seite nutzt jetzt den logischen Pfad `/hitze` statt `page.url.pathname`, `mapHomeUpdateEntry` in ein eigenes, getestetes Modul extrahiert (`$lib/content/updates/map-home-update-entry.ts` -- ein zusätzlicher Named-Export in `+page.server.ts` hätte den Build gebrochen, SvelteKit erlaubt dort nur `load`/`prerender`/etc.), `formatShortDate` ohne erzwungene Zeitzone, `homeUpdateCategoryLabel` im bestehenden `src/lib/components/updates/category-label.ts` ergänzt (DE bleibt roher Slug, EN über neue `update_category_*`-Keys), gemeinsamer `$lib/i18n/message-options.ts` (`LocaleOptions`/`toMessageOptions`/`assertUnreachable`) für alle 6 Resolver-Module mit ID-Unions aus `as const`-Arrays + exhaustivem Switch, `home_wahl_lead`-EN korrigiert, `wahlCount` jetzt aus `+page.server.ts` (DB via `getWahlList()`, sonst `buildWahlFallbackList().length`) statt hardcoded. Zusätzliche Tests: `map-home-update-entry.test.ts` (5 Tests, alle Kombinationen + alle 6 Kategorien), Hitze-Seiten-Test gegen die reale Registry, EN-Ergänzungen in `home-featured-score`/`site-header`/`meta-footer`-Tests (u. a. Loop über alle `META_LINKS`/`META_LINK_GROUPS`), 6 neue e2e-Assertions (Quick-Link/Layer-Teaser/Featured-Bezirk/Top-Kiez/Updates/Open-Block-Links, `<title>` + JSON-LD-description EN auf `/en`, JSON-LD-description DE auf `/en/kiez/alexanderplatz`). Verifiziert erneut: betroffene Unit-Tests grün, `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Verstöße, `pnpm build` 17 pre-existing Prerender-Warnungen (Baseline-Parität), `i18n-routing.e2e.ts` 47/47 grün, `tab-order.e2e.ts`/`a11y.e2e.ts` dieselben 4 vorbestehenden, Block-B2-fremden Fails wie zuvor.
