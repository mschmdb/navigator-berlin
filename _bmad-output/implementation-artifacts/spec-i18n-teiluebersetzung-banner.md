---
title: 'i18n: Teil-Übersetzungs-Banner und Wahl-Hinweis EN'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'ba35ebc6209387d3132f3e5d285dc354581c28ef'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en/explore`, `/en/kiez/…`, `/en/bezirk/…` und `/en/layer/…` ist der Rahmen englisch. Das Banner behauptet trotzdem: „This page is shown in German because the English translation is not yet available.“ Das ist falsch, nur einzelne Inhalte sind noch deutsch (Sichtung Matze 27.09.). Zweites Problem: `<main lang>` folgt der Content-Locale und steht auf diesen Seiten auf `de`. Damit markiert es den englischen Rahmen als deutsch. Drittes Problem: Der Wahl-Hinweis im Inspector und im Vergleich (`wahl-stimmenanteile`) ist auf `/en` deutsch.

**Approach:**
- Neue Stufe „teilweise übersetzt“ im Übersetzungs-Register für diese vier Routen.
- Auf solchen Seiten zeigt das Banner einen passenden Text, `<main lang>` folgt der Seiten-Locale, deutsche Inhaltsteile tragen `lang="de"`.
- SEO bleibt wie heute: noindex, `inLanguage` de-DE, kein hreflang.
- Den Wahl-Hinweis übersetzen wir als Message.

## Boundaries & Constraints

**Always:**
- Matze: „ja was passendes“ (27.09. 08:0x), Wahl-Hinweis: „zu 1: go“.
- Banner-Text EN (Richtung): „Some content on this page is only available in German.“ Der Link „Read in German“ bleibt.
- Teilweise übersetzt ≠ übersetzt. `isRouteTranslated`, Sitemap, hreflang, noindex und llms bleiben für diese Routen unverändert.
- DE-Ausgabe unverändert. Der DE-Text des Wahl-Hinweises bleibt der Wortlaut von `main` a253e14.
- N-Locale-fähig (keine `'en'`-Sonderfälle im Register).
- TDD pro AC.

**Never:**
- Keine Inhaltsübersetzung (Profile, layer-explain, übrige `EditorialDisclaimer`-Varianten, FAQ, Methodik): Block C.
- Kein Register-Eintrag als „übersetzt“ für diese Routen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Teil-Seite | `/en/explore`, `/en/kiez/x`, `/en/bezirk/x`, `/en/layer/x` | Banner „Some content…only available in German.“ + „Read in German“; `<main lang="en">`; noindex | N/A |
| Nicht übersetzt | `/en/methodik` | Banner wie heute, `<main lang="de">` | N/A |
| Übersetzt | `/en`, `/en/berlin-wahlen` | kein Banner (wie heute) | N/A |
| DE-Seite | `/explore` | kein Banner, keine `lang`-Attribute neu | N/A |
| DE-Fragmente | Teil-Seite `/en` | `EditorialDisclaimer` mit DE-Text und layer-explain-Texte tragen `lang="de"` | N/A |
| Wahl-Hinweis | Inspector/Vergleich unter `/en` | englischer Text, gleiche Fakten wie DE | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/seo/translation-register.ts`: zweite Liste, z.B. `PARTIAL_TRANSLATION_REGISTER`, gleicher Eintragstyp mit `prefix`. Neue Funktion `isRoutePartiallyTranslated(pathname, locale)`. Einträge: `/explore` (exakt), `/kiez`, `/bezirk`, `/layer` (je `prefix: true`), jeweils `en`.
- `src/lib/seo/effective-locale.ts`: `resolveEffectiveLocale` bleibt die SEO-/Content-Locale. Neu: eine Rahmen-Locale, z.B. `resolveFrameLocale(pathname, pageLocale)`, die bei „teilweise übersetzt“ `pageLocale` liefert.
- `src/routes/(with-header)/+layout.svelte:~108`: `<main lang>` über die Rahmen-Locale, Banner bekommt den Status.
- `src/lib/components/atlas/translation-disclaimer.svelte`: neue Variante `partial` mit Message `disclaimer_partial_translation` (de + en). Die `fallback-to-base`-Logik bleibt.
- `src/lib/components/atlas/editorial-disclaimer.svelte`:
  - `wahl-stimmenanteile` über neue Message, DE = Text aus `DISCLAIMER_TEXTS_DE` (a253e14).
  - Varianten, die weiter aus `DISCLAIMER_TEXTS_DE` kommen, bekommen `lang="de"`, wenn `getLocale()` ≠ `de`. Das gilt auch für „Quelle ansehen“.
- layer-explain-Texte (DE bis Block C) mit `lang="de"` auf `/en`. Render-Stellen prüfen, jeweils nur um den Explain-Text: `map-legend.svelte`, `layer-palette.svelte`, `inspector-panel/{layer-hit-row,layer-card,klima-pet-card,kuehle-orte-card,hitze-trinkbrunnen-toggle}.svelte`, `cross-layer-story-block.svelte`. Die Layer-Detailseite hat es seit B4b.
- Tests:
  - Unit: `translation-register.test.ts`, `effective-locale`-Test, `translation-disclaimer.svelte.test.ts`, `editorial-disclaimer.svelte.test.ts`.
  - e2e: `i18n-routing.e2e.ts:173/:737` (Banner-Erwartungen), `i18n-profile-frame`, `i18n-layer-frame`, `i18n-inspector`.

## Tasks & Acceptance

**Execution:**
- [x] Register + `isRoutePartiallyTranslated` + Rahmen-Locale (+ Tests)
- [x] `translation-disclaimer` Variante `partial`, Layout-Verdrahtung, `<main lang>` (+ Tests)
- [x] `editorial-disclaimer`: Wahl-Hinweis als Message, `lang="de"` für DE-Varianten (+ Tests)
- [x] `lang="de"` an layer-explain-Render-Stellen (+ Tests)
- [x] e2e: Banner-Text auf den vier Teil-Routen, `/en/methodik` unverändert, `<main lang>`, Wahl-Hinweis EN
- [x] Zeitmessung

**Acceptance Criteria:**
- Given eine der vier Teil-Routen unter `/en`, when die Seite lädt, then zeigt das Banner den Teil-Übersetzungs-Text mit „Read in German“, `<main lang="en">` gilt, und die Seite bleibt noindex ohne hreflang.
- Given `/en/methodik`, when die Seite lädt, then sind Banner und `<main lang="de">` wie vorher.
- Given Inspector oder Vergleich unter `/en`, when der Wahl-Hinweis erscheint, then ist er englisch.

## Implementation Notes

- 27.09. 08:26 Start Planung, Inventur Koordinator direkt. Befund: `<main lang={effectiveLocale}>` markiert auf den vier Routen den englischen Rahmen als deutsch (WCAG 3.1.1). 08:40 Checkpoint 1 durch Matze („ok“).
- Umsetzung (Einzel-Agent, kein Koordinator-Zwischenschritt): `translation-register.ts` bekam ein zweites, unabhängiges Register `PARTIAL_TRANSLATION_REGISTER` (`/explore` exakt, `/kiez`/`/bezirk`/`/layer` je `prefix: true`) plus `isRoutePartiallyTranslated(pathname, locale, entries?)` -- rührt `TRANSLATION_REGISTER`/`isRouteTranslated` bewusst nicht an (Boundary: SEO/Sitemap/hreflang/llms unverändert).
- `effective-locale.ts::resolveFrameLocale(pathname, pageLocale?, partialEntries?, entries?)`: liefert `pageLocale`, wenn die Route im Teil-Register steht, sonst das bisherige `resolveEffectiveLocale`-Ergebnis (für nicht-registrierte Routen weiterhin `baseLocale`, für voll übersetzte Routen ohnehin schon `pageLocale`).
- `(with-header)/+layout.svelte`: `<main lang={frameLocale}>` statt `{effectiveLocale}`; neuer `partial`-Wert (`isRoutePartiallyTranslated(page.url.pathname, pageLocale)`) geht als Prop an `TranslationDisclaimer`. `effectiveLocale` bleibt unverändert die SEO-/Content-Locale (JSON-LD, Disclaimer-Fallback-Erkennung).
- `translation-disclaimer.svelte`: `TranslationDisclaimerVariant` um `'partial'` erweitert, neuer optionaler Prop `partial` (Default `false`) hat Vorrang vor `fallback-to-base`, wenn `pageLocale !== effectiveLocale`. Neue Message `disclaimer_partial_translation` (de/en), „Read in German“-Alt-Link unverändert für beide Varianten.
- `editorial-disclaimer.svelte`: `wahl-stimmenanteile` läuft jetzt über die neue Message `disclaimer_wahl_stimmenanteile` (DE-Wortlaut Zeichen für Zeichen wie zuvor in `DISCLAIMER_TEXTS_DE`, `main` a253e14; EN-Fassung neu formuliert nach demselben Muster wie `wahl_portal_disclaimer_stimmenanteile`). Der jetzt ungenutzte `DISCLAIMER_TEXTS_DE['wahl-stimmenanteile']`-Eintrag bleibt (Record-Vollständigkeit, wie bereits bei `wahl-portal-stimmenanteile` üblich) mit Kommentar. Neuer `contentLang`-Ableitung: alle Varianten, die weiterhin aus `DISCLAIMER_TEXTS_DE` kommen (kein `customText`, keine der drei lokalisierten Varianten), bekommen `lang="de"` auf dem umschließenden `<p>` sobald `getLocale() !== 'de'` -- deckt automatisch auch den „Quelle ansehen“-Link mit ab, weil er im selben Absatz sitzt.
- `lang="de"` (WCAG 3.1.2) an den acht Code-Map-Stellen ergänzt, jeweils per `contentLang`-Ableitung (Muster aus B4b): `map-legend.svelte` (`explain.long`, `valueScaleExplain`), `layer-palette.svelte` (beide `palette-subline`-Vorkommen), `inspector-panel/layer-hit-row.svelte` (`explain`, `explain-long`, `explain-scale`), `inspector-panel/layer-card.svelte` (`explainEntry.long`), `inspector-panel/klima-pet-card.svelte` (`explainEntry.long`), `inspector-panel/kuehle-orte-card.svelte` (`explainEntry.short` + `.long`), `inspector-panel/hitze-trinkbrunnen-toggle.svelte` (`explain.short`), `cross-layer-story-block.svelte` (`rendered.body`, dafür neu `getLocale()` importiert -- die Komponente hatte vorher keinen Locale-Bezug).
- Tests: neue Unit-Tests in `translation-register.test.ts` (`isRoutePartiallyTranslated`), `effective-locale.test.ts` (`resolveFrameLocale`), `translation-disclaimer.svelte.test.ts` (`partial`-Variante inkl. Vorrang vor `fallback-to-base` und Alt-Link-Erhalt), `editorial-disclaimer.svelte.test.ts` (EN-Text für `wahl-stimmenanteile`, `lang="de"` an `DISCLAIMER_TEXTS_DE`-Varianten, kein `lang` an lokalisierten Varianten/`customText`), plus je 2 neue Fälle (EN mit `lang="de"`, DE ohne `lang`) in allen acht layer-explain-Testdateien -- `cross-layer-story-block.svelte` hatte bisher keine Testdatei, neu angelegt (4 Tests: Body-Rendering, `missingVars`-Leerfall, `lang="de"` EN, kein `lang` DE).
- e2e: neue Tests in `i18n-atlas.e2e.ts` (`/en/explore`-Banner + `<main lang>`), `i18n-profile-frame.e2e.ts` (je ein Test für `/en/kiez/…` und `/en/bezirk/…`), `i18n-layer-frame.e2e.ts` (`/en/layer/…`), `i18n-routing.e2e.ts` (Kontroll-Test `/en/methodik` unverändert: `fallback-to-base`, `main lang="de"`), `i18n-inspector.e2e.ts` (Wahl-Hinweis EN im Inspector, `wahl-section`) und `i18n-finder-compare.e2e.ts` (Wahl-Hinweis EN im Compare-Modus, `wahl-compare-block`).
- Keine Abweichungen von der Spec, kein Review-Layer nötig (Einzel-Agent-Implementierung ohne Koordinator-Zwischenschritte). Status bleibt bewusst `in-progress` bis zur menschlichen Freigabe.

- Zeitmessung gesamt (Koordinator): Planung 08:26-08:40 (inkl. Freigabe Matze), Umsetzung 08:41-09:04 (23 min), Review 09:04-09:07, Patch-Runde 09:07-09:14, Abschluss 09:15. Gesamt rund 49 min.
- Qualität: 24 Review-Funde in 14 Einträgen (1 medium: Hover-Tooltip ohne `lang="de"`), 8 gepatcht, 6 rejected (3 davon an C1 übergeben). Abschluss: vitest 4735/4735 grün, check 0, lint:wahl 0, e2e 100/100.


## Review Triage Log

Runde 1 (27.09.2026 09:07), 3 Layer: Blind Hunter (BH) 16, Edge Case (EC) 5, Verification Gap (VG) 2 + 1. Triage Koordinator. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Hover-Tooltip (`map-hover-tooltip.svelte:117-123`) zeigt DE-Kurztext ohne `lang="de"` unter `<main lang="en">` | medium | WCAG-3.1.2-Regression, neunte Render-Stelle fehlte in Code Map | P (+ Unit, + e2e auf `/en/explore`) |
| 2 | VG/BH | Test „lokalisierte Varianten“ prüft `wahl-portal-stimmenanteile` nicht | gap | | P |
| 3 | BH/EC | „Quelle ansehen“ ohne `lang="de"` in lokalisierten Varianten | low | heute ohne `sourceUrl`-Aufrufer, direkte Korrektur | P |
| 4 | BH | Toter DE-Eintrag `DISCLAIMER_TEXTS_DE['wahl-stimmenanteile']`, Weiche von Hand synchron | low | C1 stellt alle Varianten auf Messages um | R (C1) |
| 5 | BH/EC | `editorial-disclaimer` ohne `lang`-Prop | maybe-false | kein Aufrufer mit abweichendem `lang` gefunden; C1 überarbeitet die Komponente | R (C1) |
| 6 | BH | `contentLang`-Ausdruck an ~13 Stellen dupliziert | low | C1 baut viele Stellen zurück | R (C1) |
| 7 | BH | Layout ruft `isRoutePartiallyTranslated` doppelt | low | direkte Korrektur | P |
| 8 | BH | AC „ohne hreflang“ und `/en/explore`-noindex ungetestet | gap | | P |
| 9 | BH | DE-Negativtests prüfen nur Teil der Elemente | gap | | P |
| 10 | BH | „Read in German“-Link ohne `hreflang="de"` | low | direkte Korrektur | P |
| 11 | BH | `cross-layer-story-block` rendert nur auf `/methodik/…`, Änderung wirkungslos | low | harmlos, bleibt korrekt sobald Route teilweise übersetzt | R |
| 12 | BH | Fragile Test-Selektoren | low | | R |
| 13 | BH | Prettier-Hunks im Feature-Diff | low | Aufteilung kostet mehr als sie nützt | R |
| 14 | BH/EC | Spec-Status/Prozess/Zeitmessung/TDD-History in Notes | low | Fix editiert Spec bzw. Prozess | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 470 Testdateien, 4728 Tests. Ein unhandled-rejection-Flake in `wahl-stimmbezirk-choropleth.svelte.test.ts` (maplibre-Container-Fehler nach Test-Teardown), Datei unverändert von dieser Spec, isoliert erneut ausgeführt: 2/2 Tests grün, derselbe vorbestehende Flake-Typ wie in B4b dokumentiert.
- `pnpm check` -- expected: 0 Fehler -- **grün**: 6539 Dateien, 0 Fehler, 0 Warnungen.
- `pnpm lint:wahl` -- expected: 0 Verstöße -- **grün**: 72 Dateien, 0 Verstöße.
- `pnpm build` + e2e `i18n-routing`, `i18n-profile-frame`, `i18n-layer-frame`, `i18n-inspector`, `i18n-finder-compare`, `i18n-atlas` -- expected: grün -- **grün**: `pnpm build` inkl. vollem Prebuild (DB-Migration/Wahl-Fetch/OG-Bilder gegen lokale Postgres) erfolgreich; `static/kiez-scores/region-composites.json` bekam wie in B3b/B3c/B4a/B4b nur ein neues `generatedAt` (Prebuild-Nebenprodukt), per `git checkout` zurückgesetzt. Alle sechs e2e-Dateien gegen den echten Build (`pnpm preview`, temporäre lokale Playwright-Config mit `reuseExistingServer`, danach gelöscht): **100/100 grün**, inkl. aller neuen Banner-/`<main lang>`-/Wahl-Hinweis-Tests.
