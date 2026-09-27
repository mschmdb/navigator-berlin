---
title: 'i18n Block C1: Hinweistexte und Layer-Erklärungen auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'd603da9409bb2a78735cd67d3776a30dd241f99e'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-teiluebersetzung-banner.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en` stehen noch zwei Inhaltsgruppen auf Deutsch, markiert mit `lang="de"`:
- 16 `EditorialDisclaimer`-Varianten plus „Quelle ansehen“, rund 240 Wörter.
- Die Layer-Erklärungen aus `layer-explain.ts`: 78 Slugs mit `short`, `long`, `valueScaleExplain`, 1 Einheit und 1 Link-Label, rund 1.930 Wörter und 180 Strings.

Sie erscheinen in Inspector, Legende, Palette, Vergleich und auf `/layer`.

**Approach:** Beide Gruppen ziehen in Paraglide-Messages um (DE-Wortlaut unverändert) und bekommen EN. Die Accessoren erhalten einen optionalen Locale-Parameter mit DE-Default. So bleiben KI-Export, llms und WebMCP ohne Änderung deutsch. Die UI übergibt die Seiten-Locale, das `lang="de"` an übersetzten Stellen entfällt.

## Boundaries & Constraints

**Always:**
- Glossar aus `messages/en.json`:
  - Layer-Namen (`atlas_layer_name_*`) und Dimensionen übernehmen.
  - „Kiez“, „Bezirk“, „Bezirksregion“, „Stolpersteine“, „Milieuschutz“, „S-Bahn“/„U-Bahn“ bleiben deutsch.
  - „Planungsraum“ → „planning area“, „Ortsteil“ → „locality“.
  - Behördennamen im Stil „Senate Department for … (SenStadt)“.
- en-GB, Sentence Case, sachlich wie DE. Keine Wertung ergänzen, keine Fakten ändern, Zahlen und Quellen gleich.
- Geteilte Accessoren (`getLayerExplain`, `getLayerExplainEntry`, `explainLayer`, `getLayerExternalLink`, Disclaimer-Text) ohne Locale → DE. Nicht-UI-Konsumenten bleiben unverändert.
- `/layer`-JSON-LD bleibt DE bis zur Registrierung (B4b-Linie).
- `lint:wahl` grün, keine em-dashes.
- Entscheidungen Matze 27.09. 08:56 („wie du empfiehlst“):
  - Claude übersetzt. Eine Review-Tabelle DE | EN je String geht als Artifact an Matze. Seine Korrekturen fließen vor dem Commit ein.
  - C1 übersetzt den `map-libre-canvas`-loadError-Block. Nach einem Grep-Audit ohne DE-Rest im Rahmen von `/explore` wandert `/explore` vom Teil- ins Voll-Register.
  - Alle 78 Layer-Slugs werden übersetzt, auch die Legacy-Slugs.
- TDD pro AC.

**Never:**
- Keine Methodik-Texte aus `layer-methodology.ts` und keine Behörden-EN (C2), keine Profile, FAQ, Methodik-Seiten (spätere C-Blöcke).
- Keine inhaltliche Überarbeitung der DE-Texte.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Inspector EN | `/en/explore?address=…` | Layer-Kurztexte, Disclaimer, Skalen-Erklärung englisch, ohne `lang="de"` | N/A |
| Legende/Palette EN | `/en/explore` | Explain-Texte englisch | N/A |
| `/layer` EN | `/en/layer/<slug>` | Lead, Skala englisch; Methodik-Block weiter DE mit `lang="de"` | N/A |
| DE unverändert | alle DE-Routen | Texte Zeichen für Zeichen gleich | N/A |
| KI-Export/llms/WebMCP | Aufruf ohne Locale | DE wie bisher | N/A |
| Unbekannter Slug | `getLayerExplain('x')` | leer wie bisher | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/editorial-disclaimer.svelte`:
  - `DISCLAIMER_TEXTS_DE` (19 Varianten, 3 schon als Message in `LOCALIZED_VARIANTS`), „Quelle ansehen“ `:120`.
  - Die Messages-Weiche auf alle Varianten ausweiten, `lang="de"`-Logik aus dem Banner-Block entfernen, wo übersetzt.
  - `DISCLAIMER_TEXTS_DE` bleibt als DE-Export für `llm-export-builder.ts:166` oder wird dort durch Message mit `locale: 'de'` ersetzt, Ausgabe identisch.
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (`LAYER_EXPLAIN_DE`, 78 Slugs; Accessoren `:377-403`; TODO `:1`):
  - Messages `layer_explain_{slug}_{short|long|scale}`, Slug-Mapping wie `LAYER_NAME_MESSAGE` in `layer-palette-filter.ts`.
  - Achtung: Dort heißt die Namens-Map ebenfalls `LAYER_EXPLAIN_DE`, nicht verwechseln.
- UI-Aufrufer mit Locale versorgen, `lang="de"` entfernen, wo übersetzt: `map-legend`, `layer-palette`, `inspector-panel/{layer-hit-row,layer-card,klima-pet-card,kuehle-orte-card,hitze-trinkbrunnen-toggle}`, `cross-layer-story-block`, `layer/[slug]/+page.svelte` (Lead, Skala, Meta-Description), `get-layer-detail.ts` (`lang` durchreichen).
- DE bleiben (kein Locale): `src/lib/utils/llm-export-builder.ts:142/166`, `src/lib/server/llms/data-collector.ts:173`, `src/lib/webmcp/**` (Tools, Prompts).
- `map-libre-canvas.svelte` loadError-Block (deferred-Eintrag B3c #7), `translation-register.ts` `/explore` von Teil- in Voll-Register.
- Tests: 13 Unit-Dateien (u.a. `layer-explain.test.ts`, `editorial-disclaimer.svelte.test.ts`, `get-layer-detail.test.ts`, WebMCP-Tests), 6 e2e (`i18n-inspector`, `i18n-routing`, `i18n-finder-compare`, `i18n-layer-frame`, `editorial-pattern`, `i18n-atlas`).

## Tasks & Acceptance

**Execution:**
- [x] `layer-explain.ts` → Messages + Accessoren mit `opts?` (DE-Default), Key-Parität (+ Tests)
- [x] `editorial-disclaimer.svelte` → alle Varianten als Messages, „Quelle ansehen“ (+ Tests)
- [x] UI-Aufrufer mit Locale, `lang="de"` nur noch an echt deutschen Resten (+ Tests)
- [x] Nicht-UI-Konsumenten: Test pinnt DE-Ausgabe unverändert
- [x] Review-Tabelle DE | EN als Artifact an Matze, Korrekturen einarbeiten
- [x] loadError-Block übersetzen, Grep-Audit `/explore`, `/explore` ins Voll-Register, e2e (kein Banner, hreflang, indexierbar)
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given `/en/explore` mit Inspector, Legende und Palette, when Layer-Erklärungen und Hinweise erscheinen, then sind sie englisch und tragen kein `lang="de"`.
- Given KI-Export, llms oder WebMCP, when sie Layer-Erklärungen oder Hinweise ausgeben, then bleiben diese deutsch wie bisher.

## Implementation Notes

- Übersetzung vorgezogen (09:15-09:19, 1 Subagent außerhalb des Repos). Abgenommene Quelle: `_bmad-output/implementation-artifacts/c1-uebersetzung.json` (DE wörtlich, EN von Matze abgenommen 09:21, siehe Abschnitt „Abnahme“ in `c1-uebersetzung-review.md`). Die Umsetzung übernimmt die EN-Texte unverändert. Zusätzlich: EN-Layer-Namen „Kiez Score“ → „Kiez score“ in `messages/en.json` (Matze-Entscheidung). Review-Tabelle als Datei statt Artifact (Artifact-Tool in der Session abgeschaltet).

- 27.09. 08:52 Start Planung, 08:52-08:54 Inventur (1 Subagent). Umsetzung erst nach Commit der Banner-Spec (gleiche Dateien). 08:56 Fragen beantwortet und Checkpoint 1 durch Matze („wie du empfiehlst“).

- Umsetzung (Einzel-Agent): `layer-explain.ts` behält `LAYER_EXPLAIN_DE` (Record, unveraendert) als DE-Referenz-Export fuer Tests und DE-only-Direktimporter; ein zweites Mapping `LAYER_EXPLAIN_MESSAGE` (Slug -> `{ short, long, scale?, unit? }` Message-Funktionen, Muster wie `LAYER_NAME_MESSAGE` in `layer-palette-filter.ts`) treibt `getLayerExplain`/`getLayerExplainEntry`/`explainLayer`/`getLayerExternalLink`, alle jetzt mit optionalem `opts?: LocaleOptions` (DE-Default via `toAtlasMessageOptions`). Fehlt ein Slug im Message-Mapping, faellt der Resolver auf `LAYER_EXPLAIN_DE` zurueck. 198 neue Message-Keys (`layer_explain_*`: 78×short + 78×long + 18×scale + 6×unit + 1 External-Link-Label; `disclaimer_*`: 16 Varianten + `quelle_ansehen`), alle DE-Werte programmatisch gegen die bisherigen TS-Literale diffed (0 Abweichungen) bevor sie in `messages/de.json`/`en.json` eingetragen wurden -- die EN-Werte kommen unveraendert aus der abgenommenen `c1-uebersetzung.json`.

- `editorial-disclaimer.svelte`: `DISCLAIMER_TEXTS_DE` bleibt exportiert (DE-Referenz fuer `llm-export-builder.ts`), wird von der Komponente selbst aber nicht mehr gerendert. Eine neue `DISCLAIMER_MESSAGE`-Weiche deckt jetzt alle 19 `DisclaimerVariant`s ab (die 16 vormals hart-deutschen + die 3 bereits aus Block B lokalisierten), reaktiv ueber die Seiten-Locale (kein `{ locale }`-Argument noetig, analog zu `m.wahl_portal_disclaimer_*()`). Die vormalige `contentLang`/`sourceLinkLang`/`LOCALIZED_VARIANTS`-Unterscheidung (B4b) entfaellt komplett -- die Komponente traegt kein `lang`-Attribut mehr, weil nichts mehr hart deutsch ist. „Quelle ansehen" laeuft ueber `m.disclaimer_quelle_ansehen()`.

- UI-Aufrufer mit `localeOpts` versorgt, `lang="de"`/`contentLang` entfernt (Boundary "wo uebersetzt"): `map-legend.svelte`, `layer-palette.svelte`, `inspector-panel/{layer-hit-row,layer-card,klima-pet-card,kuehle-orte-card,hitze-trinkbrunnen-toggle}.svelte`, `layer/[slug]/+page.svelte` (Lead + Skala; der Methodik-Block bleibt `lang="de"`, out of Scope), `get-layer-detail.ts` (`explain` folgt jetzt `lang`). `map-hover-tooltip.svelte` + `internal/hover-tooltip-logic.ts` standen NICHT in der Spec-Code-Map, wurden aber beim Umsetzen als derselbe Fall erkannt (`shortExplain` lief noch fest ueber DE) und mitgezogen. `cross-layer-story-block.svelte` bewusst NICHT angefasst: `rendered.body` kommt aus `cross-layer-templates` (Methodik-Text-Territorium, nicht Teil der abgenommenen Uebersetzung) und rendert ohnehin nur auf `/methodik/...`.

- JSON-LD-Boundary auf `/layer/[slug]`: `explain` (fuer die Anzeige) folgt jetzt der URL-Locale, das Dataset-JSON-LD braucht deshalb eine EIGENE, immer-DE-Quelle (`deExplain = getLayerExplainEntry(detail.slug)` ohne `opts`) statt weiter `explain` zu verwenden -- sonst waere auf `/en/layer/...` die JSON-LD-Description englisch geleakt (Boundary: „/layer-JSON-LD bleibt DE bis zur Registrierung").

- Grep-Audit `/explore` (vor dem Register-Umzug): alle live gerenderten Komponenten unter `/explore` (Inspector, Compare, Finder, Legende, Palette, Hover-Tooltip, Map-Controls/-Attribution/-A11y-Layer, Bottom-Sheet -- 30 Dateien) durchsucht, keine verbleibenden deutschen Strings außerhalb von Kommentaren und totem Code (`inspector-level-toggle.svelte`, `distance-ring.svelte`, `layer-level-card.svelte`, `coverage-bar.svelte` -- keine Importer im Baum, nicht Teil des Audits). EIN echter Fund: der „Adresse ersetzen"-Compare-Dialog in `explore/+page.svelte` (Titel, Beschreibung, 3 Buttons) war komplett hartcodiert Deutsch, ohne `lang`-Markierung -- nicht in der Spec-Code-Map, aber ein Blocker fuer den Register-Umzug. Uebersetzt (5 neue Messages, eigene EN-Formulierung, nicht Teil der C1-Uebersetzungs-Abnahme da nicht layer-explain/disclaimer).

- `translation-register.ts`: `/explore` aus `PARTIAL_TRANSLATION_REGISTER` entfernt und als exakter Eintrag (kein `prefix`) in `TRANSLATION_REGISTER` aufgenommen. `/kiez`, `/bezirk`, `/layer` bleiben im Teil-Register (out of Scope -- deren Content bleibt bis zu einem spaeteren Block gemischt). Zusaetzlich `messages/en.json`: die 8 `atlas_layer_name_kiez_score_*`-Messages von „Kiez Score" auf „Kiez score" vereinheitlicht (Matze-Entscheidung aus der Abnahme, Implementation Notes oben) -- bewusst NUR die Layer-Namen angefasst, nicht die uebrige Prosa (`home_hero_lead` etc.), das waere ausserhalb des C1-Scopes.

- Tests: 1 neuer `describe`-Block in `layer-explain.test.ts` (Locale-Parameter, Key-Paritaet fuer alle 78 Slugs via `long`-Diff), `editorial-disclaimer.svelte.test.ts` umgebaut (die alten `lang="de"`-Tests fuer die 16 Varianten entfernt/ersetzt durch EN-Text-ohne-lang-Tests), je ein bis zwei aktualisierte Tests in `map-legend`, `layer-palette`, `layer-hit-row`, `layer-card`, `klima-pet-card`, `kuehle-orte-card`, `hitze-trinkbrunnen-toggle`, `map-hover-tooltip`, `hover-tooltip-logic`, `layer/[slug]/page.svelte.test.ts` (inkl. JSON-LD-Test mit absichtlich EN-verseuchter Loader-Fixture, um den DE-only-JSON-LD-Pfad zu beweisen), `translation-register.test.ts` (Register-Umzug). `map-libre-canvas.svelte.test.ts`: 2 neue Message-Resolution-Tests fuer den loadError-Block (kein Komponenten-Test moeglich -- `vi.mock('maplibre-gl')` greift nicht zuverlaessig bei einem echten dynamischen Import im Browser-Testkontext, e2e deckt den gerenderten Alert-Block ab). `pnpm exec vitest run`: 470 Dateien / 4765 von 4766 Tests gruen (1 vorbestehender, isoliert reproduzierbar gruener maplibre-Teardown-Flake in `wahl-stimmbezirk-choropleth.svelte.test.ts`, unveraendert von dieser Spec, gleicher Flake-Typ wie in B4b dokumentiert, dort trat er in einer anderen Datei derselben Kategorie auf). `pnpm check` 0/0, `pnpm lint:wahl` 0 Verstoesse.

- e2e-Dateien aktualisiert: `i18n-atlas.e2e.ts` (Banner-Tests fuer `/en/explore` auf "kein Banner mehr" + hreflang + kein noindex umgebaut, Hover-Tooltip-Test auf EN-Text ohne `lang="de"`), `i18n-layer-frame.e2e.ts` (Lead/Skala-Assertions auf EN-Text ohne `lang="de"`, Methodik bleibt `lang="de"` unveraendert), `i18n-routing.e2e.ts` (Kommentar-Korrektur: `/explore` nicht mehr im Teil-Register). `i18n-inspector.e2e.ts`, `i18n-finder-compare.e2e.ts` geprüft, keine Aenderung noetig (kein Bezug zu layer-explain/disclaimer/`/explore`-Registrierung). Review-Fund beim ersten e2e-Lauf: die zwei neuen `/explore`-hreflang-Assertions mit hartcodierter `https://navigator.berlin`-Origin schlugen fehl -- `/explore` ist (wie `/en`, dort bereits dokumentiert) SSR statt prerendered, die Origin folgt im Preview-Server dem echten Request (`localhost:4173`), nicht `svelte.config.js`s `prerender.origin`. Auf Pfad-Regex umgestellt (`/\/en\/explore$/`), analog zum bestehenden `/en`-Testmuster. Kein App-Bug, reiner Test-Autoring-Fehler.

- `editorial-pattern.e2e.ts` (kein C1-Bezug, unveraendert): alle 5 Tests scheitern deterministisch (auch mit `--retries=1`, 10/10 rot) an einem vorbestehenden, dokumentierten Hydration-Bug (`deferred-work.md`, Fund 27.09. vor C1: `getByRole('combobox').click()` auf `/explore` schlaegt mit "element was detached from the DOM" fehl, betrifft auch `kiez-score-flow.e2e.ts`/`share-sheet.e2e.ts`/`climate-*.e2e.ts`). Nicht Teil dieser Spec, nicht durch C1 verursacht oder behebbar -- die vier anderen i18n-e2e-Dateien umgehen das Problem seit B3b/B3c per Deep-Link statt Combobox-Interaktion. Die uebrigen 5 e2e-Dateien: 91/91 gruen (81 aus `i18n-routing` + `i18n-inspector` + `i18n-finder-compare` + `i18n-layer-frame` in einem Lauf, 10 aus `i18n-atlas` in einem zweiten Lauf nach der Hreflang-Test-Korrektur).

- Zeitmessung gesamt (Koordinator): Planung 08:52-08:56, Übersetzung vorgezogen 09:15-09:19, Abnahme Matze 09:21, Umsetzung 09:59-10:46 (47 min), Review 10:46-10:50, Patch-Runde 10:51-11:11 (20 min), Abschluss 11:12. Gesamt ohne Wartezeit rund 1 h 25 min.
- Qualität: 23 Review-Funde in 15 Einträgen (2 medium: Disclaimer-Locale auf DE-Fallback-Seiten, stiller DE-Fallback bei fehlendem Mapping), 10 gepatcht, 3 deferred, 2 rejected. Nachtrag Matze 10:59: offizielle Behördennamen. Abschluss: vitest 4794/4795 (winner-map-Flake), check 0, lint:wahl 0, e2e 105/105. `/explore` im Übersetzungs-Register.


## Review Triage Log

Runde 1 (27.09.2026 10:50), 3 Layer: Blind Hunter (BH) 12, Edge Case (EC) 7, Verification Gap (VG) 4 + 3. Triage Koordinator. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | `EditorialDisclaimer` folgt nur `getLocale()`: EN-Hinweis auf DE-Fallback-Seite `/en/methodik/cross-layer-templates` (WCAG 3.1.2 umgekehrt), Karten mit `lang`-Prop inkonsistent | medium | `cross-layer-story-block.svelte:75` | P: optionaler `locale`-Prop, Aufrufer reichen ihre Locale bzw. die effektive Locale durch |
| 2 | EC | Unbekannte Variante wirft TypeError statt leer | low | direkte Guard | P |
| 3 | BH/EC | Fehlendes Message-Mapping fällt still auf DE ohne `lang="de"` | medium | Register „voll übersetzt“ | P: Test erzwingt Mapping für jeden `LAYER_EXPLAIN_DE`-Slug |
| 4 | BH/VG | DE-Parität Messages ↔ `LAYER_EXPLAIN_DE`/`DISCLAIMER_TEXTS_DE` nur für 1 Slug gepinnt, `scale`/`unit` ungeprüft, 4 Varianten nie gerendert, EN nur 3 Varianten | gap | VG: Wegwerf-Test zeigt heute Parität | P: `it.each` über alle Slugs/Varianten, DE deep-equal, EN nicht leer und ≠ DE |
| 5 | BH/VG | Register-Kommentar behauptet `/en/explore` in Sitemap, `STATIC_PAGES_SOURCE` liefert für EN `[]` | low | gilt auch für `/` (B2) | P: Kommentar korrigieren; D: EN-Seiten in `sitemap-en.xml` |
| 6 | BH/VG | loadError-Block nie gerendert getestet, falscher e2e-Kommentar | gap | | P |
| 7 | EC | Error-Instanz zeigt rohe MapLibre-Meldung; Text friert bei Locale-Wechsel ein | low | vorbestehend, Sprachwechsel lädt neu | R |
| 8 | BH/VG | Compare-Replace-Dialog ohne Test | gap | Map-Klick + Compare-State nötig | D |
| 9 | BH | EN-Text enthält rohe Pfade (`/methodik/kiez-score`), „Option C“, Slug „wohnlagen-2024“, „Legacy slug“, „Cloud Dancer scale“ | low | spiegelt DE-Original, von Matze abgenommen, keine DE-Überarbeitung in C1 | D: DE+EN-Textbereinigung |
| 10 | BH | „Kiez Score“ bleibt in 8 weiteren EN-Messages (home, bundle label, OG) | low | Matze-Entscheidung „überall Kiez score“ | P |
| 11 | BH | OG-Bild und KI-Export auf registrierter `/en/explore` DE, nicht als Ausnahme dokumentiert | low | Boundary | P: Ausnahme im Register-Kommentar nennen |
| 12 | EC | Kein Test, dass KI-Export/llms unter EN-Locale DE bleiben | gap | | P |
| 13 | EC | `get-layer-detail` ohne Test für EN-Explain | gap | | P |
| 14 | BH | Hand-off-Gates, Zeitmessung, Change Log | low | Fix editiert Spec/Prozess | R |
| 15 | BH | Prettier-Reflow in `explore/+page.svelte` | low | | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 470 Dateien, 4765 von 4766 Tests grün. 1 vorbestehender maplibre-Teardown-Flake (`wahl-stimmbezirk-choropleth.svelte.test.ts`), Datei unverändert von dieser Spec, isoliert erneut ausgeführt: 2/2 grün, gleicher Flake-Typ wie B4b.
- `pnpm check` -- expected: 0 Fehler -- **grün**: 6541 Dateien, 0 Fehler, 0 Warnungen.
- `pnpm lint:wahl` -- expected: 0 Verstöße -- **grün**: 72 Dateien, 0 Verstöße.
- `pnpm build` + i18n-e2e-Satz + `editorial-pattern` -- expected: grün -- **`pnpm build` grün** (vollständiger Prebuild inkl. DB-Migration, Wahl-Fetch, 261 OG-Bilder gegen lokale Postgres, 0 Fehler; `static/kiez-scores/region-composites.json` bekam nur ein neues `generatedAt`, per `git checkout` zurückgesetzt). **i18n-e2e-Satz grün**: `i18n-routing` + `i18n-inspector` + `i18n-finder-compare` + `i18n-layer-frame` 81/81, `i18n-atlas` 10/10 (nach Korrektur zweier eigener Test-Assertions, siehe Implementation Notes). **`editorial-pattern` rot, 5/5, vorbestehend**: dokumentierter Hydration-Bug (`deferred-work.md`), nicht Teil dieser Spec, nicht C1-verursacht, siehe Implementation Notes.
