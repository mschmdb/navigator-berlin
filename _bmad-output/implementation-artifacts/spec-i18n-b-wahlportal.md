---
title: 'i18n Block B: Wahlportal auf Englisch'
type: 'feature'
created: '2026-09-26'
status: 'done'
baseline_commit: 'e9fbc096cce6d4f72f5b6a2147e53a386e67f06c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_user-input/plan-i18n-de-en-2026-08-22.md'
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-a-infra-routing.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/berlin-wahlen` und `/en/berlin-wahlen/[slug]` zeigen seit Block A deutschen Inhalt mit Disclaimer und sind `noindex`. Alle Portal-Texte (~250 bis 300 Strings in Templates, TS-Buildern und Server-Load) sind fest deutsch, Zahlen fest de-DE, interne Links fallen auf DE zurück.

**Approach:** Alle Portal-Texte in Paraglide-Messages extrahieren und ins Englische übersetzen, Test-Literale im selben Schritt auf Messages umstellen. Zahlen und Daten laufen über zentrale Locale-Formatter, interne Links über `localizedHref`. Danach stehen beide Portal-Routen im Übersetzungs-Register (indexierbar, hreflang, `sitemap-en.xml`). Branch `feat/i18n-en`, Merge erst nach verifiziertem Launch.

## Boundaries & Constraints

**Always:**
- Entscheidungen Matze 26.09.2026: „Kiez“ und „Bezirk“ bleiben im EN-Text deutsch, Planungsraum/Bezirksregion u.a. werden übersetzt; Parteinamen bleiben; Infra N-Locale-fähig.
- Keys snake_case mit Bereichs-Präfix (`wahl_portal_*`, `wahl_detail_*`, `wahl_label_*`); keine Texte als Modul-Konstanten, sondern Auswertung beim Aufruf (Locale über `getLocale()` bzw. explizites `{ locale }` in Buildern).
- Datenschlüssel bleiben unübersetzt: Partei-Kurznamen, Kapitel-IDs/Anker, URL-Query-Werte, Slugs, `data-testid`, `source_name` als API-Feld (Übersetzung nur bei Anzeige).
- `lint:wahl` scannt `messages/de.json` und `messages/en.json`; EN bekommt eigene Forbidden-Tokens (nur auf `en.json`).
- Zahlenformat EN: Punkt als Dezimaltrenner, „%“ ohne Leerzeichen, „pp“ für Prozentpunkte, echtes Minuszeichen bleibt.
- `lang="de"` fest auf Überschriften entfernen, wo EN-Text steht (WCAG 3.1.2); DE-Eigennamen brauchen kein `lang`.
- TDD pro AC; DE-Ausgabe bleibt Zeichen für Zeichen gleich (Tests belegen das).
- Glossar EN (Entscheidung Matze 26.09. 19:24, Variante A mit Behörden-Korrektur): Abgeordnetenhaus → *Berlin House of Representatives (Abgeordnetenhaus)*, kurz *House of Representatives*; Bundestag → *Bundestag*; BVV → *District Assembly (BVV)*; Zweitstimme/Erststimme → *party vote / constituency vote*; Wiederholungswahl → *repeat election*; vorläufig → *provisional*; Bundeswahlleiterin → *Federal Election Commissioner*; Landeswahlleiterin Berlin → *Berlin State Election Commissioner*; Amt für Statistik Berlin-Brandenburg → *Statistics Office Berlin-Brandenburg*. Behörden beim ersten Vorkommen mit deutschem Originalnamen in Klammern.
- Entscheidung Matze 26.09. 21:06: Übersetzte Seiten zeigen KEINEN Übersetzungs-Hinweis mehr (Variante „translated“ entfällt, „Translated from German source … Read in German“ ist unerwünscht). Der Hinweis bleibt nur auf nicht übersetzten Seiten, die deutschen Inhalt unter `/en` zeigen (`fallback-to-base`). ADR-005 entsprechend anpassen.
- Spec ungesplittet (~2000 Tokens), weil erst das Register-Flag am Ende einen konsistenten, indexierbaren Zustand ergibt.

**Never:**
- Keine anderen Seiten übersetzen (Atlas, Kiez, Methodik, Profile: spätere Stories).
- Keine EN-OG-Karten (Block C, ADR-005); `/en`-Portal nutzt die DE-Karte.
- Keine Änderung an API-Feldern, Slugs oder URL-Schema.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/berlin-wahlen` | alle Texte und Zahlen wie vor Block B | N/A |
| EN-Portal | `/en/berlin-wahlen` | englische Texte, `28.2%`, `+10.2 pp`, kein Disclaimer, indexierbar, hreflang de/en/x-default | N/A |
| EN-Detail | `/en/berlin-wahlen/2023-bvv` | englischer Titel/Tabellen, Links bleiben unter `/en` | N/A |
| Glossar | EN-Text mit Kiez/Bezirk | „Kiez“, „Bezirk“ unübersetzt | N/A |
| Fehlender EN-Key | Key nur in `de.json` | DE-Fallback, Test schlägt an | Key-Paritäts-Test |
| Datenschlüssel | `?reihe=agh`, `data-testid`, Partei `GRÜNE` | unverändert in beiden Sprachen | N/A |
| Lint | EN-Text „stronghold“ | `lint:wahl` meldet Verstoß | Build-Gate |

</frozen-after-approval>

## Code Map

- Routen: `src/routes/(with-header)/berlin-wahlen/+page.svelte` (~32 Strings, Nav :172-180, Subtexte :186-197, SEO :199-214), `[slug]/+page.svelte` (~25, `lang="de"` :121, Links :113-154/:295/:327), `[slug]/+page.server.ts` (`TYP_LABELS`/`STIMMTYP_LABELS` :43-53, Titel :149-151 → Keys liefern, Label im Client).
- `src/lib/components/wahl-portal/*.svelte` (Inventar ~150 Strings; größte: `trends-kapitel`, `ergebnis-panel` inkl. `DISCLOSURE_TEXT` :174, `small-multiples`, `sankey-wahljahre`, `wechsel-kapitel`, `winner-map`).
- TS-Builder mit Tests: `internal/winner-map-data.ts`, `trends-map-data.ts`, `winner-map-partei-text.ts`, `winner-map-labels.ts`, `ergebnis-panel-data.ts` (`formatDeltaLabel`), `small-multiples-data.ts`, `sankey-interaction.ts`, `winner-map-address.svelte.ts`, `src/lib/data/wahl-gruppe-label.ts`, `src/lib/utils/wahl-portal-url-state.ts` (`REIHE_LABELS`, `EBENE_LABELS`).
- Atlas-Bausteine: `editorial-disclaimer.svelte` (Varianten `wahl-portal-footnote`, `wahl-stimmenanteile`), `data-table-alternative.svelte`, `address-search.svelte`, `wahl-bezirk-choropleth.svelte`, `wahl-stimmbezirk-choropleth.svelte`.
- Formate: `.toFixed(1).replace('.', ',')` an 6 Stellen, `toLocaleString('de-DE')` 2×, `format-berlin-date.ts` → zentrales `src/lib/i18n/format.ts` (Zahl, Prozent, Pp., Datum je Locale); `localeCompare(…, 'de')` bleibt (Sortierung).
- Wahltyp-Labels 4× dupliziert (`[slug]/+page.server.ts`, `alle-wahlen-block.svelte`, `wahl-portal-url-state.ts`, `generate-og-images.ts`) → eine Message-Quelle; OG-Skript bleibt DE.
- `src/lib/server/wahl/source-label.ts` → Anzeige-Label über Message, API-Feld bleibt; „unbekannte Quelle“ 4× → Message.
- Links: alle `resolve('/…')` und rohen `href` im Portal über `localizedHref`.
- `src/lib/seo/translation-register.ts` -- Einträge `/berlin-wahlen` und `/berlin-wahlen/[slug]` (alle Slugs) für `en`.
- `scripts/lint-wahl-editorial.ts`, `scripts/wahlen/lib/wahl-forbidden-tokens.ts` -- `messages/*.json` scannen, EN-Mustergruppe.
- Tests mit DE-Literalen (~130 bis 150): u.a. `tests/e2e/berlin-wahlen.e2e.ts` (26), `ergebnis-panel.svelte.test.ts` (19), `winner-map-partei-text.test.ts`, `trends-map-data.test.ts`; `tests/e2e/i18n-routing.e2e.ts` erwartet für `/en/berlin-wahlen` heute noindex/Disclaimer → anpassen.
- Nicht ändern: Parteinamen, Kapitel-IDs, Query-Werte, Slugs, Test-IDs, API-Felder.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/i18n/format.ts` (+ Test) -- Zahl/Prozent/Pp./Datum je Locale; alle Portal-Formate darauf
- [x] Glossar als Message-Keys + Wahltyp-/Stimmtyp-/Behörden-Labels an einer Stelle (+ Test)
- [x] TS-Builder auf Messages (+ Tests auf Messages statt Literale)
- [x] Portal-Komponenten und Atlas-Bausteine auf Messages (+ Komponententests)
- [x] Routen `/berlin-wahlen`, `[slug]` inkl. SEO/JSON-LD/Breadcrumb auf Messages, Server-Load liefert Keys
- [x] Interne Links über `localizedHref`
- [x] Key-Paritäts-Test `de.json` ↔ `en.json`; `lint:wahl` für beide Dateien
- [x] Register-Einträge für beide Portal-Routen; `i18n-routing.e2e.ts` und Portal-e2e anpassen, EN-e2e ergänzen
- [x] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/berlin-wahlen` im Build, when die Seite lädt, then enthält der sichtbare Text keine deutschen UI-Wörter außer Glossar-Ausnahmen, Eigennamen und Parteinamen (e2e-Stichprobe je Kapitel), und die Seite ist indexierbar mit hreflang.
- Given `/berlin-wahlen`, when die bestehende Portal-e2e läuft, then ist sie unverändert grün.
- Given die Sitemap, when sie erzeugt wird, then enthält `sitemap-en.xml` die Portal-URLs mit `xhtml:link`-Alternates.

## Implementation Notes

- 26.09. 19:06 Start Planung, 19:06-19:10 Inventur (1 Subagent), 19:24 Glossar entschieden, 19:24 Checkpoint 1 freigegeben (Matze).
- 26.09. Start Implementierung (dispatch-Route, dieselbe Session). Kontext geladen: Plan, ADR-005, Spec Block A, gesamter Code-Map-Filesatz.
  - **Fundament (selbst umgesetzt, ~19:2x-19:3x):** `src/lib/i18n/format.ts` (`formatPercent`/`formatPercentagePointsDelta`/`formatCount`/`formatWahlDate`, TDD, 12 Tests), `src/lib/data/wahl-labels.ts` (zentrale Wahltyp-/Reihe-/Stimmtyp-/Ebene-/Quellen-Labels, ersetzt die 3-4x duplizierten `TYP_LABELS`/`STIMMTYP_LABELS`/`REIHE_LABELS`/`EBENE_LABELS`-Objekte, 13 Tests), `WAHL_FORBIDDEN_PATTERNS_EN` (+ 15 Tests) und Anbindung von `messages/de.json`/`messages/en.json` an `lint-wahl-editorial.ts`, `src/lib/i18n/message-key-parity.test.ts` (Key-Paritäts-Gate).
  - **Bulk-Extraktion (6 sequenzielle Subagenten, ein Subagent nach dem anderen wegen gemeinsamer `messages/*.json`-Schreibzugriffe):**
    1. TS-Builder (`winner-map-data.ts`, `trends-map-data.ts`, `winner-map-partei-text.ts`, `winner-map-labels.ts`, `ergebnis-panel-data.ts`, `small-multiples-data.ts`, `sankey-interaction.ts`, `winner-map-address.svelte.ts`) -- 41 neue `wahl_portal_*`-Keys, `parteiDisplayName` (Sonstige→Other, nur Display).
    2. `ergebnis-panel.svelte`, `trends-kapitel.svelte`, `small-multiples.svelte` -- `DISCLOSURE_TEXT`/Legenden/Status-Texte extrahiert, `TREND_LEGENDE` zu `$derived`.
    3. `sankey-wahljahre.svelte`, `wechsel-kapitel.svelte`, `winner-map.svelte` + `winner-map-legende/-tooltip/-partei-tabs.svelte`.
    4. Restliche kleine Portal-Komponenten (`alle-wahlen-block`, `kapitel-nav`, `karten-steuerung`, `portal-datenstand`, `portal-quellen`, `reihen-leiste`, `vorlaeufig-badge`, `zeit-animation`) + chirurgisch 5 Atlas-Bausteine (`editorial-disclaimer` nur 2 Varianten, `data-table-alternative`/`address-search` nur Default-Props, beide Choropleths).
    5. Beide Routen (`berlin-wahlen/+page.svelte`, `[slug]/+page.server.ts` -- `TYP_LABELS`/`STIMMTYP_LABELS`/`title`-Feld entfernt, Titel-Aufbau zieht komplett ins Client-`+page.svelte`, `[slug]/+page.svelte`).
  - **SEO/Register (selbst umgesetzt, parallel zu Subagent 5):** `translation-register.ts` registriert `/berlin-wahlen` + alle 23 Detail-Slugs (aus `buildWahlFallbackList()`, eine Quelle mit den Prerender-Entries) für `en`. `sitemap-builder.ts`: `/berlin-wahlen` aus `STATIC_PAGES_SOURCE` in eigene `WAHL_PORTAL_PAGE_SOURCE` gezogen (locale-präfixiert via `localizedPathname`), `WAHL_DETAIL_SOURCE` verliert seinen DE-only-Gate, `collectPrerenderedUrls` hängt jetzt `xhtml:link`-Alternates an jeden Eintrag mit echtem Cross-Locale-Pendant (via `buildHreflangCluster`, dieselbe Funktion wie `SeoHead`). `sitemap-en.xml/+server.ts` fetcht jetzt `wahlen`+`wahlPortalEnabled` wie `sitemap-de.xml`. `tests/e2e/i18n-routing.e2e.ts` angepasst (DE/EN-Erwartung für `/berlin-wahlen` gedreht, JSON-LD jetzt `en-US`, EN-Textstichprobe je Kapitel, neue Detailseiten- und Sitemap-e2e-Blöcke).
  - **Build-Fund (kritisch, selbst gefunden + gefixt):** Erster `pnpm build` schlug für JEDE `/berlin-wahlen*`-Seite mit 500 fehl: zwei Subagenten hatten `localizedHref(resolve(routeId, params))` verschachtelt (`alle-wahlen-block.svelte`, `[slug]/+page.svelte` ×2). SvelteKits server-seitiges `resolve()` liefert während Prerender/SSR einen RELATIVEN Pfad (`../../bezirk/mitte` statt `/bezirk/mitte`), den Paraglides `localizeHref` (in `localizedHref`) absolutisiert (`https://navigator.berlin/bezirk/mitte`) -- der zweite `resolve()`-Aufruf in `localizedHref` wirft dann, weil er nur absolute Pfade/Route-IDs akzeptiert, keine externen URLs. Fix: an allen 3 Stellen `resolve(routeId, params)` durch einen literalen Pfad-String ersetzt (`` `/berlin-wahlen/${slug}` ``/`` `/bezirk/${slug}` ``), `localizedHref` bekommt nie mehr ein `resolve()`-Ergebnis als Input.
  - Verifiziert am echten `build/`-Output (`pnpm build && pnpm preview`): `/en/berlin-wahlen` liefert `<title>Berlin Elections - Election results on the map - navigator.berlin</title>`, `<h1>Berlin Elections</h1>`; `/en/berlin-wahlen/2023-bvv` liefert `<h1>District Assembly (BVV) election 2023 · repeat election</h1>` und Prozent-Werte wie `27.7%`/`19.5%` (Punkt-Dezimaltrennzeichen, kein Leerzeichen vor `%`).
  - Zeitmessung gesamt (Koordinator, ungefähr, keine exakte Stoppuhr über die volle Subagent-Kette): Fundament + Recherche rund 45-60 min, 6 sequenzielle Bulk-Subagenten je 8-20 min Laufzeit (parallelisierbar wären sie gewesen, liefen aber wegen gemeinsamer `messages/*.json`-Schreibzugriffe nacheinander), SEO/Register/e2e + Build-Fund-Diagnose + Fix + volle Verifikation rund 45 min. Gesamt schätzungsweise 3-3.5 h.
- Korrektur-Runde nach Erst-Review (Matze, vor formaler Abnahme):
  1. **`gruppenAnzeigeName()`** (`$lib/data/wahl-gruppe-label.ts`) war trotz vollständiger sonstiger Extraktion deutsch geblieben (Popup-Text Detailseiten-Choropleth, Winner-Map-Tooltip/-Tabelle, Adress-Hinweis) -- "Stimmbezirk"/"Briefwahl" stehen nicht im Glossar als deutsch-bleibend. Per TDD lokalisiert: neue Messages `wahl_portal_gruppe_stimmbezirk_singular`/`_plural` ("Polling district {member} and postal district {brief}" / "Polling districts {members} and postal district {brief}"), optionaler `{ locale }`-Parameter. `StimmbezirkLoader.resolveAddressLabel()` reicht die Locale jetzt durch (Aufrufer `winner-map-address.svelte.ts` hatte sie schon in `opts.locale`, vorher ungenutzt). `wahl-labels.ts`s `wahlEbeneLabel('stimmbezirk')` EN-Wert von "voting district" auf "Polling district" vereinheitlicht (+ Test). **Bewusst NICHT angefasst:** die übrigen ~8 Vorkommen von "voting district"/"voting-district" in anderen Messages (`wahl_portal_aggregation_hinweis_*`, `wahl_portal_kiez_coverage_hinweis`, `wahl_detail_karte_titel_stimmbezirk` etc.) -- Auftrag war explizit auf `EBENE_LABELS` + `gruppenAnzeigeName` gescoped, eine projektweite Konsistenz-Umbenennung wäre Scope-Erweiterung und braucht ein bewusstes Ja.
  2. **Matrix-Audit ergänzt** (`tests/e2e/i18n-routing.e2e.ts` + `scripts/wahlen/lib/wahl-forbidden-tokens.test.ts`): "EN-Detail Links bleiben unter /en" jetzt mit 4 Assertions (Portal-Link, Bezirk-Link, Methodik-Link, Breadcrumb) statt nur 1; neuer dedizierter Test "Glossar" (Kiez/Bezirk woertlich, kein "neighbourhood", Stimmbezirk uebersetzt); neue Tests "Datenschlüssel unveraendert" (`?reihe=btw`-Query-Wert + `data-testid` + Partei `GRÜNE`, zwei fokussierte Tests statt einem, weil die BTW-Fixture ein anderes Jahr hat als die AGH-Default-Fixture); neuer Unit-Test in `wahl-forbidden-tokens.test.ts` fuer "stronghold" gegen einen echten `en.json`-artigen JSON-Ausschnitt (nicht nur Fließtext).
  3. **Entscheidung Matze 26.09. 21:06:** `translation-disclaimer.svelte`s `translated`-Variante ("Translated from German source...") komplett entfernt -- übersetzte Seiten zeigen jetzt gar keinen Übersetzungs-Hinweis mehr, nur `fallback-to-base` bleibt. `TranslationDisclaimerVariant` nur noch `'fallback-to-base'`, Messages `disclaimer_translated` (de/en) entfernt, Tests angepasst, ADR-005 ergänzt, `i18n-routing.e2e.ts`s `/en/berlin-wahlen`-Test erwartet jetzt `toHaveCount(0)` statt `data-variant: 'translated'`.
  - Alle drei Punkte per TDD (Rot bestätigt vor Implementierung wo sinnvoll messbar, z. B. `gruppenAnzeigeName`-EN-Erwartungen liefen zuerst rot). Erneuter voller Lauf danach: `pnpm test:unit` 4256/4257 grün (1 bekannter Flake `winner-map.svelte.test.ts`, isoliert grün, reproduzierbar auch ohne diese Änderungen), `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Verstöße, frischer `pnpm build` 0 neue Warnungen (17 pre-existing, Baseline-Parität), e2e (`i18n-routing.e2e.ts` 33/33, `berlin-wahlen*.e2e.ts`/`wahl-redirect.e2e.ts` unveraendert grün, `a11y.e2e.ts` 6/9 grün mit denselben 3 bekannten, Wahlportal-fremden Fails wie zuvor) gegen einen frischen `pnpm build && pnpm preview` (temporäre Playwright-Config mit `reuseExistingServer`, danach entfernt).
- Korrektur-Runde 2 nach Review-Triage-Log Runde 1 (26.09.2026 21:28, 27 Funde, 25 `P` an mich, #21 an den Koordinator, #27 `D`eferred): alle 25 zugewiesenen Funde gepatcht, `#10` (Linktext-Sprachzusatz auf Methodik/Lizenzen-Links) wurde per Korrektur Matze 21:38 storniert, BEVOR ich damit begonnen hatte (nichts zurückzunehmen).
  - **Ausnahmsweise erlaubte DE-Textänderung** (Fund #5): `wahl_portal_disclaimer_stimmenanteile` behauptete "Brief-Stimmen sind im Kiez-Aggregat ausgeschlossen" -- seit Story 17 sachlich falsch (Briefwahl wird anteilig nach Wahlberechtigten auf die Kieze verteilt, Stimmbezirks-Ebene = Briefwahl-Gruppen inkl. Urnen). DE UND EN korrigiert, konsistent zu `wahl_portal_disclosure_text`/`aggregation_hinweis_kiez`. Neue eigene Variante `wahl-portal-stimmenanteile` (statt der bisher mit dem Kiez-Inspector/Compare-Modus geteilten `wahl-stimmenanteile`), damit nur die Wahl-Detailseite den korrigierten/lokalisierten Text bekommt.
  - **Architektur-Verbesserung** (Fund #16): `translation-register.ts`s feste 23-Slug-Liste (`buildWahlFallbackList()`-Expansion) durch einen PRAEFIX-Eintrag (`prefix: true`) ersetzt -- `TranslationRegisterEntry` um `prefix?: boolean` erweitert, `matchesEntry()` matcht Praefix + Segment-Grenze. Ein Eintrag deckt jetzt `/berlin-wahlen` und JEDE (auch zukünftige) Detailseite ab, ohne dass diese Datei bei einer neuen Wahl je wieder angefasst werden muss.
  - **Rundungs-/Vorzeichen-Bugfixes in `format.ts`**: `formatPercent` rundete über `Math.round(pct*10)/10` VOR dem `toFixed`, das wich bei Grenzwerten vom alten `toFixed(1)`-Verhalten ab (0.0015 → "0,2 %" statt korrekt "0,1 %") -- jetzt `toFixed` direkt auf `pct`, byte-identisch zum Alt-Verhalten an allen 6 ehemaligen Call-Sites. `formatPercentagePointsDelta`: DE bleibt bewusst byte-identisch zum alten `formatDeltaLabel` (Vorzeichen aus dem UNGERUNDETEN Wert, zeigt "−0,0 Pp." bei sehr kleinen negativen Deltas -- Alt-Verhalten, kein Fix noetig da Spec-Byte-Paritaet verlangt), EN bestimmt das Vorzeichen dagegen am GERUNDETEN Betrag (kein neu eingefuehrtes "-0.0 pp").
  - **`sourceDisplayLabel`/`licenseDisplayLabel`**: ein unbekannter, aber nicht-leerer Quellenname fiel vorher faelschlich auf die "unbekannte Quelle"-Message zurueck (DE-Regression) -- jetzt nur `null`/`undefined`/leer. Neue `licenseDisplayLabel()`-Funktion mappt `dl-de/by-2-0`/`dl-de/by-2.0` (beide DB-Schreibvarianten) auf den ausgeschriebenen Lizenz-Namen (DE "Datenlizenz Deutschland Namensnennung 2.0"/EN "Data licence Germany, attribution, version 2.0"), API-Feld `license` bleibt unveraendert; an allen 6 Call-Sites verdrahtet.
  - **`lint-wahl-editorial.ts`**: fehlende Message-Datei ist jetzt ein harter Fehler (`process.exit(1)`) statt stillem Ueberspringen; `MESSAGE_FILE_PATTERNS` exportiert + per Unit-Test gegen die echten `WAHL_FORBIDDEN_PATTERNS`/`_EN`-Referenzen geprueft; `main()` hinter einen `import.meta.url`-Guard gezogen (Standard-Muster dieses Repos, siehe `aggregate-scores.ts`), damit der Test-Import keinen `main()`-Lauf ausloest.
  - Tote `REIHE_LABELS`/`EBENE_LABELS` in `wahl-portal-url-state.ts` geloescht (keine Aufrufer mehr, seit der Erst-Runde alle auf `wahlReiheLabel`/`wahlEbeneLabel` umgestellt).
  - Neue/erweiterte Tests: `trends-kapitel.svelte.test.ts` (DE-Legende byte-identisch zum Alt-Stand + EN-Aequivalent, 6 Schwellen-Labels), `wahl-detail-page.svelte.test.ts` (H1-Komposition AGH-Wiederholungswahl-mit-Stimmtyp vs. BVV-ohne-Stimmtyp), `i18n-routing.e2e.ts` (Methodik-/Alle-Wahlen-Links auf `/en/berlin-wahlen`, 4 neue Kapitel-e2e-Tests mit echten `page.route`-Mocks + Warten auf geladenen Zustand + EN-Positivtext + Negativ-Regex fuer "Sonstige"/"Stärkste Kraft"/"Netto-Verschiebung"), `wahl-forbidden-tokens.test.ts` (en.json-JSON-Ausschnitt-Test), diverse EN-/"Sonstige"-Tests in `winner-map-legende`/`winner-map-tooltip`/`ergebnis-panel`/`sankey-wahljahre`/`karten-steuerung`/`zeit-animation`/`portal-quellen`.
  - ADR-005: Kontext + Konsequenz fuer die 21:06-Entscheidung ergaenzt (Matze: Dauer-Hinweis auf übersetzten Seiten unerwuenscht; Konsequenz: DE-Massgeblichkeit nur noch ueber Sprachumschalter/Methodik erkennbar, kein Wiederherstellungs-Automatismus falls spaeter doch ein Footer-Hinweis gewuenscht wird).
  - Erneute volle Verifikation danach: `pnpm test:unit` 4284/4285 gruen (derselbe 1 bekannte Flake, isoliert gruen), `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Verstoesse, frischer `pnpm build` 0 neue Warnungen (17 pre-existing, Baseline-Paritaet), e2e gegen frischen `pnpm build && pnpm preview` (temporaere Playwright-Config, danach entfernt): `i18n-routing.e2e.ts` 39/39 gruen, `berlin-wahlen*.e2e.ts`/`wahl-redirect.e2e.ts` unveraendert gruen, `a11y.e2e.ts` 7/9 gruen (2 der 3 bekannten Wahlportal-fremden Fails, `Root (Karte)` war diesmal gruen -- flakiges Bestandsverhalten, keine Regression).

- Zeitmessung gesamt (Koordinator): Planung 19:06-19:24 (18 min, davon 4 min Inventur, Rest Glossar-Abstimmung), Umsetzung 19:24-21:05 (1 h 41 min, 6 sequenzielle Subagenten für die Extraktion), Matrix-Nachzug + Disclaimer-Entscheidung 21:05-21:23 (18 min), Review 3 Layer 21:23-21:28 (5 min), Patch-Runde 21:28-22:10 (42 min), Abschluss 22:15. Gesamt rund 3 h 10 min.
- Gültiger Verifikationsstand (Review #21): Unit 4284/4285 (bekannter `winner-map`-Adress-Flake, isoliert 6/6 grün mit und ohne Block B), check 0, lint:wahl 0 (72 Dateien inkl. beider Message-Dateien), Build ohne neue Warnungen, e2e `i18n-routing` 39/39, Portal-e2e grün, `a11y` bis auf bekannte Fails grün.
- Qualität: 27 Review-Funde, davon 3 high (DE-Rundungsregression, Übersetzung außerhalb des Portals über geteilte Atlas-Defaults, „Sonstige“ auf EN); 25 gepatcht, 1 verworfen (Matze 21:38, kein Sprachzusatz an Links), 1 deferred (`lint:wahl` in Gate). Koordinator-Nachzug: Sankey-Kürzel „·W“ über Message.


## Review Triage Log

Runde 1 (26.09.2026 21:28), 3 Layer: Blind Hunter (BH) 17, Edge Case (EC) 9, Verification Gap (VG) 6 + 3. P = patch, D = defer, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | EC/VG | `formatPercent` rundet anders als `toFixed(1)`: DE-Werte ändern sich (0,4 → 0,5 %) | high | 323 von 10.001 Werten weichen ab; Spec: DE Zeichen für Zeichen gleich | P |
| 2 | BH/VG | Geteilte Atlas-Defaults (`address-search`, `data-table-alternative`, `editorial-disclaimer`) übersetzen Nicht-Portal-Seiten | high | Site-Header, Klima, Inspector zeigen EN auf DE-Fallback-Seiten; Boundary „keine anderen Seiten“ | P |
| 3 | BH/EC | „Sonstige“ roh auf `/en` (Ergebnis-Panel, Tooltip, Legende) | high | `{row.partei}` ohne `parteiDisplayName`; AC1 verletzt | P |
| 4 | BH | „Data as of: Federal Election Commissioner“ | medium | Key bekommt Quelle, nicht Datum | P: EN „Source: …“ |
| 5 | BH | Briefwahl-Widerspruch (Disclaimer „ausgeschlossen“ vs. „anteilig verteilt“) | medium | DE-Text seit Story 17 veraltet, jetzt in 2 Sprachen | P: beide korrigieren |
| 6 | BH | EN-Terminologie uneinheitlich (voting/polling district, postal/postal-vote district) | medium | 8 Stellen „voting district“ | P: „polling district“, „postal district“ |
| 7 | BH | SEO-Texte ohne Glossar (Abgeordnetenhaus/BVV) | medium | `page_description`, `dataset_description` | P |
| 8 | EC | Plural „1 areas“ | low | Sankey, Takeaway | P |
| 9 | BH | Plural per angehängtem „e“, `jahr ?? 0` | medium | `winner-map.svelte` Fallback-Hinweis | P |
| 10 | BH | Linktext `/methodik/wahldaten` führt auf deutsche Seite ohne Hinweis | low | Ziele nicht übersetzt; Matze 21:38: kein Sprachzusatz, weil alles übersetzt werden soll und die Zielseite den Fallback-Hinweis selbst zeigt | R |
| 11 | BH | „·W“-Marker für Wiederholungswahl in EN | low | deutsches Kürzel | P |
| 12 | BH | Lizenzname deutsch auf EN | low | offizieller EN-Name existiert | P |
| 13 | BH | OG-Alt-Text „OG map“, Bild ist deutsch | low | Jargon | P |
| 14 | BH | `formatWahlDate` EN ICU-abhängig (Sep/Sept) | medium | SSR/Hydration-Risiko | P: `month: 'long'` |
| 15 | EC | `−0.0 pp` bei kleinen negativen Deltas | low | nur Trends-Tabelle clamped | P |
| 16 | EC/VG | Register mit fester 23-Slug-Liste | medium | neue DB-Wahl bliebe noindex | P: Präfix-Eintrag |
| 17 | EC/BH | `sourceDisplayLabel` zeigt unbekannte Quelle statt Rohname | medium | DE-Regression | P |
| 18 | EC | `lint:wahl` überspringt fehlende Message-Datei still | low | `continue` | P |
| 19 | BH/EC | Tote `REIHE_LABELS`/`EBENE_LABELS` | low | keine Aufrufer | P: löschen |
| 20 | BH | ADR-Eintrag ohne Begründung | low | Doku | P |
| 21 | BH | Spec-Testzahlen widersprüchlich | low | Verifikationsstand | P: Koordinator |
| 22 | VG | Trend-Legende ungetestet | gap | Textaufbau aus Konstanten | P |
| 23 | VG | DE-Titel Detailseite ungetestet | gap | Client-Titel | P |
| 24 | VG | EN-Portal-Links ungetestet | gap | nur Detailseite | P |
| 25 | VG/BH | Kapitel-e2e zu schwach (50 ms, keine Mocks) | gap | AC1 nur formal | P |
| 26 | VG | Lint-Zuordnung Datei→Muster ungetestet | gap | Skript-Schleife | P: Konstante + Test |
| 27 | VG | `lint:wahl` in keinem Gate | gap | nur manuell | D |

_Kein separater Review-Loop in dieser Session gelaufen (`review_loop_iteration: 0`); Selbst-Verifikation über die volle Test-/Check-/Build-/e2e-Kette (siehe Verification) statt eines dedizierten Multi-Layer-Review wie in Block A._

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- grün (452 Testdateien, 4250 Tests)
- `pnpm check && pnpm lint:wahl` -- 0 Fehler (6514 Dateien, 0 Errors/Warnings; `lint-wahl-editorial`: 72 Dateien inkl. `messages/de.json`/`messages/en.json`, 0 Verstöße)
- `pnpm build`, Preview, `tests/e2e/berlin-wahlen*.e2e.ts`, `i18n-routing.e2e.ts`, `a11y.e2e.ts` -- grün: `pnpm build` 0 neue Warnungen (17 pre-existing 404/unseen-route, identisch zur Baseline), 55/55 e2e (`berlin-wahlen.e2e.ts`, `berlin-wahlen-partei.e2e.ts`, `wahl-redirect.e2e.ts`, `i18n-routing.e2e.ts` inkl. 8 neuer Block-B-Tests) grün; `a11y.e2e.ts` 6/9 grün, 3 bekannte Fails (`Root (Karte)`/`/explore`, `Wortmarke-Showcase`/`/_dev/wortmarke`, `Escape löscht Selection` -- alle drei außerhalb des Wahlportals, unverändert von Block B; die beiden Berlin-Wahlen-Portal-a11y-Tests selbst sind grün).

**Manual checks:**
- `/en/berlin-wahlen` und `/en/berlin-wahlen/2023-bvv` durchlesen: Sprache, Zahlen, Links -- verifiziert am echten Preview-Build (curl gegen `pnpm preview`, adapter-node): englischer Titel/H1, Glossar-Form „District Assembly (BVV) election 2023 · repeat election", EN-Prozentformat `27.7%`.
