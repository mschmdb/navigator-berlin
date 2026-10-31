---
title: 'gh-169: Startseite neu, nach Aufgaben gegliedert (Variante A)'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '1ead4459e0c97e9bdf2cf07cc4713a27fe2f3805'
route: 'dispatch'
review_loop_iteration: 1
context: ['{project-root}/CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Startseite zeigt vor allem Kiez-Score und Karte. Hitze, Kälte, Kieze, Bezirke und Wahlen finden Besucher von dort kaum (Plausible 90 Tage: 339 von 732 Startseiten-Besuchern öffnen die Karte, Kiez/Bezirk/Wahlen je einstellig; Absprung mobil 82 %).

**Approach:** Startseite nach Mockup-Variante A neu aufbauen, mobil zuerst: Fragetitel, ein Satz, großes Suchfeld mit Beispielen; saisonaler Hinweis; vier Aufgaben-Zeilen mit je drei Direktlinks; Vertrauensfuß mit Quellen. Platz für den späteren Data-Stories-Teaser bleibt frei, wird aber nicht gebaut.

## Boundaries & Constraints

**Always:** DE und EN über Paraglide; Schriftgrößen nur aus `--text-*`/Dichte-Tokens; Klickziele ≥ `--target-min` (24 px); Fließtext ≤ `--measure`; nur bestehende Farb-Tokens; CI aus Epic #85 (Plex Sans, Mono nur für Zahlen, keine Versalien-Eyebrows, kein „·“, kein „→“); Header unverändert („Atlas öffnen“); SeoHead und beide JSON-LD-Blöcke bleiben; `prerender = false` bleibt; Saisonlogik über `isKaelteSaison`.

**Never:** Data-Stories-Teaser bauen; Header, Explore oder Unterseiten ändern; neue Rohfarben oder freie px-Größen; neue Routen anlegen; Plausible-Events für Slugs oder Adressen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Suche Treffer | Adresse gewählt | Navigation zu `/explore?address={lng},{lat}&q={query}` (lokalisiert) | N/A |
| Suche ohne Treffer | Geocoder leer | Hinweis „nicht gefunden“ der bestehenden Komponente, keine Navigation | bestehendes `notFoundLabel` |
| Winter | 1.10.–30.4. Berliner Zeit | Hinweis Kälte-Navigator `/kaelte` | N/A |
| Sommer | 1.5.–30.9. | Hinweis Hitze-Navigator `/hitze` | N/A |
| Ohne DB | `load` liefert Fallbacks | Seite rendert vollständig, Zahlen aus statischen Quellen | keine Fehlerseite |
| EN | `/en` | alle Texte EN, Links mit `/en`-Präfix | N/A |

## Decisions (Matze 31.10.2026)

- **Titel:** „Wie lebt es sich an deiner Adresse?“ (EN sinngemäß, z. B. „What is it like to live at your address?“).
- **Wegfall:** Score-Ring, Finder-Teaser, Hook, Schritte, Fünf Orte, Wahl-Karten, Top-Kieze, Bezirke, Layer-Teaser entfallen. **Updates-Teaser bleibt** unter den Aufgaben.
- **„Alle Ebenen“** verlinkt auf `/daten`.
- **Neutralitätssatz (Review-Loopback):** Im Vertrauensfuß steht ein Satz sinngemäß „navigator bewertet weder Gegenden noch Menschen. Die Seite zeigt offene Daten, damit du selbst vergleichen kannst.“ (DE/EN).
- **„Zwei Orte vergleichen“** entfällt; die Aufgabe „Eine Gegend prüfen“ hat zwei Links: Karte öffnen, Kiez-Finder.

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/+page.svelte` -- rendert heute 12 Home-Komponenten (L68-82); wird auf neue Gliederung umgestellt. SeoHead/JsonLd L37-66 unverändert.
- `src/routes/(with-header)/+page.server.ts` -- `load` (L169-181) liefert topKieze, updates, layerCount, featured, wahlCount; nicht mehr benötigte Felder entfernen, `layerCount`/`wahlCount` für Texte weiter nutzen.
- `src/lib/components/home/` -- vorhandene Teile: `home-hero`, `home-featured-score`, `home-finder-teaser`, `home-hook`, `home-steps`, `home-quick-links`, `home-wahl-teaser`, `home-saison-teasers`, `home-hitze-teaser`, `home-kaelte-teaser`, `home-featured-bezirke`, `home-top-kieze`, `home-layer-teasers`, `home-updates-teaser`, `home-open-block`; `internal/cta.ts` für Button-Klassen wiederverwenden.
- `src/lib/components/atlas/address-search.svelte` -- Suchfeld (`variant: 'hero'`, `geocode`, `onSelect`); feuert `Search` selbst; bereits außerhalb des Atlas genutzt in `wahl-portal/winner-map.svelte`.
- `src/routes/(with-header)/+layout.svelte:42` -- Geocoder `geocodeAddress` aus `$lib/data/geocode.remote.js`.
- `src/lib/content/home-quick-links.ts` -- `buildQuickLinkHref` (L105) für Beispiel-Links unter dem Suchfeld (Hermannplatz, Prenzlauer Berg, Frohnau) wiederverwenden.
- `src/lib/utils/berlin-time.ts:126` -- `isKaelteSaison(now)`.
- `src/lib/utils/plausible.ts:87-105` -- `trackLanding`, `LandingPageType` um `'home'` erweitern, Aktionen der Aufgaben-Links ohne Slugs.
- `src/lib/i18n/localized-href.ts:18` -- `localizedHref`.
- `messages/de.json`, `messages/en.json` -- 98 `home_*`-Keys; neue Keys `home_task_*`, `home_search_*`, `home_trust_*`, nicht mehr genutzte entfernen.
- `src/app.css` -- `--text-*` L83-90, Dichte L94-96, `--measure` L103, `.text-measure` L343, `--target-min`.
- Tests: `src/lib/components/home/*.svelte.test.ts`; E2E `tests/e2e/i18n-routing.e2e.ts:696-761`, `a11y.e2e.ts:77-79`, `seo-indexierung.e2e.ts:42-43,113` referenzieren alte testids.
- Routen: `/kieze`, `/bezirke`, `/kiez-score`, `/hitze`, `/kaelte`, `/berlin-wahlen`, `/berlin-wahlen/2026-agh-zweitstimme`, `/berlin-wahlen/2025-btw-zweitstimme`, `/explore`, `/explore?finder=1`, `/methodik`, `/daten`, `/lizenzen`, `/ueber`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/utils/plausible.ts` + Test -- `LandingPageType` um `'home'`, Aktionen `task_link`, `search_example` -- Wirkung der neuen Startseite messbar.
- [x] `src/lib/components/home/home-search-hero.svelte` + Test -- Titel, Satz, AddressSearch, drei Beispiel-Links -- Suche als Haupteinstieg.
- [x] `src/lib/components/home/home-season-note.svelte` + Test -- ersetzt Saison-Teaser durch eine Zeile Hitze/Kälte nach `isKaelteSaison` -- ein Hinweis statt zwei Karten.
- [x] `src/lib/components/home/home-tasks.svelte` + Test -- vier Aufgaben, je drei Links, Klickziele ≥ 24 px, Text ≤ `--measure`.
- [x] `src/lib/components/home/home-trust.svelte` + Test -- Quellen, keine Cookies, Links Methodik/Daten/Lizenzen/Über.
- [x] `src/routes/(with-header)/+page.svelte`, `+page.server.ts` -- neue Gliederung, ungenutzte Komponenten, deren Tests und load-Felder entfernen; `home-updates-teaser` und `updates` im load behalten.
- [x] `messages/de.json`, `messages/en.json` -- neue Texte, alte Keys entfernen.
- [x] `tests/e2e/i18n-routing.e2e.ts`, `a11y.e2e.ts`, `seo-indexierung.e2e.ts` -- auf neue testids umstellen.

**Acceptance Criteria:**
- Given 390 px Breite, when die Seite lädt, then sind Suchfeld und alle vier Aufgaben-Überschriften nach höchstens zwei Bildschirmhöhen sichtbar.
- Given jede Seite (DE/EN), when axe-core läuft, then keine Verstöße; alle Links ≥ 24 px hoch.
- Given die Design-Prüfung (Skill `design-pruefung`) gegen den Dev-Server, then keine Befunde zu Regeln 7, 14, 23, 29.
- Given die Seite, then keine freien Schriftgrößen (`text-[…px]`, `text-5xl`, `text-6xl`) und keine Hex-Farben in neuen Komponenten.

## Implementation Notes

- Neue Komponenten `home-search-hero`, `home-season-note`, `home-tasks`, `home-trust` mit Tests; 15 alte Home-Komponenten samt Tests und `screenshot-manifest.ts` entfernt; `load` liefert nur `updates`.
- Suchtreffer-Ziel als `buildSearchTargetHref` in `home-quick-links.ts` (getestet), weil die Auswahl im Bits-Combobox-Portal im Browser-Unit-Test nicht zuverlässig klickbar ist.
- `trackLanding` mit `page_type: 'home'`, Aktionen `task_link`, `search_example`.
- Kiez-Finder-Link nur bei `featureFlags.kiezFinder`.
- Matrix: Treffer → `buildSearchTargetHref`-Test; kein Treffer → Hero-Test ohne Navigation; Winter/Sommer inkl. Grenzen → `home-season-note`-Test; ohne DB → `load` fängt Update-Fehler ab; EN → EN-Tests je Komponente.
- Prenzlauer-Berg-Beispielkoordinaten (Kollwitzplatz) von Implementierung gewählt, in Vorschau prüfen.

- Nach Review Runde 2: Absätze mit `max-w-(--measure)` (Nachfahren-Selektor wirkte nicht), Saisontext neutral, EN-Texte, Marke, Glossar-Assertion; Updates-Überschrift auf `text-2xl` angeglichen.
- Design-Prüfung gegen Dev-Server (DE/EN, 1440/390): axe 0, keine Ziele < 24 px außer sr-only Skip-Link, Größen nur aus Tokens, keine AI-Look-Merkmale, Suchfeld + vier Aufgaben mobil in zwei Bildschirmhöhen.
- codex-review (gpt-6.1-sol, Reasoning high, nur geänderte/neue Dateien, gelöschte als Liste): APPROVE, keine Findings.

## Spec Change Log

- **Loopback 1 (31.10.2026), Befund 14 intent_gap:** Neutralitätssatz fehlte nach Wegfall des Finder-Teasers. Entscheidung Matze: Satz in den Vertrauensfuß (Decisions). Vermiedener Zustand: Startseite mit urteilendem Titel ohne Neutralitätshinweis. **KEEP:** Die Implementierung aus `git stash@{0}` („gh-169 Implementierung vor intent_gap-Loopback“) war in Struktur, Komponenten, Tests, Messages und E2E-Anpassungen richtig: per `git stash pop` als Ausgangspunkt übernehmen, nicht neu schreiben. Zusätzlich die Patch-Befunde 1, 4, 5, 10, 11 (nur Code/Keys), 12, 15, 16 aus dem Review Triage Log umsetzen.

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | VG, ECH, BH | Suchtreffer-Auswahl im Hero ohne Komponententest (onSelect → navigate, /en) | medium | Nur Kein-Treffer-Test; `buildSearchTargetHref` getestet, Verdrahtung nicht. Route patch. |
| 2 | VG, BH, ECH | Klick-Tracking `task_link`/`search_example` nur auf Funktionsebene getestet, nicht unterscheidbar je Link | low | Analytics-only; Feinheit ändert öffentliche Typen. Route defer. |
| 3 | VG, BH, ECH | kiezFinder-Flag nur im Zustand an getestet | low | Flag-aus-Pfad trivial; Route defer. |
| 4 | VG, BH | Wahl-Slugs hart verdrahtet, keine Existenzprüfung | medium | Slug-Umbenennung ergäbe 404 ohne Testfehler. Route patch (Test gegen Wahlliste). |
| 5 | ECH | Quellenliste: Namen mit Komma („SenMVKU, Umweltatlas“) in Intl.ListFormat unlesbar | medium | `home-data-sources.ts:38-44` enthält Kommas; Satz zerfällt. Route patch. |
| 6 | ECH | Geocode-Fehler ohne catch | maybe-false | Gilt für bestehende AddressSearch auch im Header; vorbestehend. Route defer. |
| 7 | ECH, BH | Saison-`now` zur Init, SSR/Client am Stichtag | low | Nur um Mitternacht am 1.5./1.10.; Fix wäre zusätzliche Logik. Abgelehnt. |
| 8 | ECH | each-Key `link.href` könnte kollidieren | false | Alle hrefs je Aufgabe verschieden, statisch. |
| 9 | ECH | NaN-Koordinaten in `buildSearchTargetHref` | false | Geocoder liefert Zahlen; `parseAddress` fängt ab. |
| 10 | ECH, BH | `HomeQuickLink.id` von Union auf string geweitet | low | Typsicherheit schwächer, Fix trivial. Route patch. |
| 11 | ECH, BH | Tote Beschreibungen `homeDataSourceDescription` + 6 Message-Keys, verwaiste Screenshots | low | Nur Test nutzt sie; Screenshots in README referenziert. Route patch (Code/Keys), Screenshots defer. |
| 12 | BH | „Prenzlauer Berg“-Beispiel führt auf Kollwitzplatz | medium | Label und Ziel passen nicht. Route patch. |
| 13 | BH | Interne Links zu Kiez/Bezirk/Layer-Detailseiten entfallen (SEO) | false | Matze hat den Wegfall ausdrücklich entschieden (Decisions). Abgelehnt. |
| 14 | BH | Neutralitätssatz („bewertet weder Nachbarschaften noch Menschen“) und Score-Erklärung entfallen; Titel klingt nach Urteil | low | Real, Spec regelt Text nicht. Route intent_gap. |
| 15 | BH | EN: „Licenses“ (US), „Kiez finder“ klein, „districts“ statt „Bezirk“ | low | Glossar-Abweichung. Route patch. |
| 16 | BH | Herbst-Grenze 30.9. 22:30 UTC ungetestet | low | Fix: eine Testzeile. Route patch. |
| 17 | BH | Meta-Beschreibung nennt alten Slogan | false | „Berlin in Daten“ als Beschreibung bleibt zutreffend; Titel unverändert gewollt. |
| 18 | VG2 | `text-measure` direkt auf `<p>` wirkungslos (Nachfahren-Selektor) | medium | `app.css:343` `.text-measure :where(p…)`; AC Zeilenlänge verletzt. Patch. |
| 19 | BH2 | Saisonhinweis sagt „Winter“ vom 1.10. bis 30.4. | low | Text passt im Oktober/April nicht; Direktkorrektur. Patch. |
| 20 | BH2 | EN-Texte steif („You see …“), „hinziehen“ schließt Bewohner aus | low | Direktkorrektur. Patch. |
| 21 | BH2 | Marke im Neutralitätssatz als „navigator“ | low | Direktkorrektur. Patch. |
| 22 | BH2 | Veralteter Kommentar „Alle 44 Quellen“ in `home-data-sources.ts` | low | Löschung. Patch. |
| 23 | ECH2, BH2 | `/en`-Glossarprüfung `\bBezirk` entfernt | low | Label „Bezirke“ wird gerendert; Wiederherstellung trivial. Patch. |
| 24 | VG2 | Suche mit Default-geocode/goto nicht E2E-geprüft | maybe-false | Bekannter Hydration-Bug bei `fill()` laut `i18n-inspector.e2e.ts`. Defer. |
| 25 | BH2 | `home_page_og_alt` enthält „·“ und alten Slogan | low | Vorbestehender String. Defer. |
| 26 | ECH2, BH2 | Raster `sm:grid-cols-3` bei zwei Links mit leerer Spalte | low | Kosmetisch, Fix bräuchte Logik. Abgelehnt. |
| 27 | BH2 | Datenschutzsatz „keine Cookies“ unvollständig | false | Plausible arbeitet cookieless; Aussage stimmt. |
| 28 | BH2 | Titel/H1 ohne Berlin, verspricht Urteil | false | Titel von Matze entschieden, Neutralitätssatz ergänzt. |
| 29 | ECH2 | Spec „je drei Links“ vs. zwei bei Gegend | false | Decisions legen zwei Links fest. |
| 30 | carried | Tracking-Granularität, Flag-aus-Test, Saison-SSR, Wahl-Slugs veralten, interne Links | carried | siehe Zeilen 2, 3, 7, 4, 13. |

## Verification

**Commands:**
- `pnpm vitest run src/lib/components/home src/lib/utils/plausible` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint` -- expected: sauber

**Manual checks (if no CLI):**
- Dev-Server, `/` und `/en`, 390 px und 1280 px; Skill `design-pruefung`; `codex-review` auf den Diff.
