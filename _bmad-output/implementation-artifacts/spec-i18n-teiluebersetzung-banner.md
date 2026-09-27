---
title: 'i18n: Teil-Übersetzungs-Banner und Wahl-Hinweis EN'
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
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
- [ ] Register + `isRoutePartiallyTranslated` + Rahmen-Locale (+ Tests)
- [ ] `translation-disclaimer` Variante `partial`, Layout-Verdrahtung, `<main lang>` (+ Tests)
- [ ] `editorial-disclaimer`: Wahl-Hinweis als Message, `lang="de"` für DE-Varianten (+ Tests)
- [ ] `lang="de"` an layer-explain-Render-Stellen (+ Tests)
- [ ] e2e: Banner-Text auf den vier Teil-Routen, `/en/methodik` unverändert, `<main lang>`, Wahl-Hinweis EN
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given eine der vier Teil-Routen unter `/en`, when die Seite lädt, then zeigt das Banner den Teil-Übersetzungs-Text mit „Read in German“, `<main lang="en">` gilt, und die Seite bleibt noindex ohne hreflang.
- Given `/en/methodik`, when die Seite lädt, then sind Banner und `<main lang="de">` wie vorher.
- Given Inspector oder Vergleich unter `/en`, when der Wahl-Hinweis erscheint, then ist er englisch.

## Implementation Notes

- 27.09. 08:26 Start Planung, Inventur Koordinator direkt. Befund: `<main lang={effectiveLocale}>` markiert auf den vier Routen den englischen Rahmen als deutsch (WCAG 3.1.1). 08:40 Checkpoint 1 durch Matze („ok“).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-routing`, `i18n-profile-frame`, `i18n-layer-frame`, `i18n-inspector`, `i18n-finder-compare`, `i18n-atlas` -- expected: grün
