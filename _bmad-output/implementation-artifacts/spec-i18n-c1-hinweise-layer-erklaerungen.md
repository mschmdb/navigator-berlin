---
title: 'i18n Block C1: Hinweistexte und Layer-Erklärungen auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'ready-for-dev'
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
- [ ] `layer-explain.ts` → Messages + Accessoren mit `opts?` (DE-Default), Key-Parität (+ Tests)
- [ ] `editorial-disclaimer.svelte` → alle Varianten als Messages, „Quelle ansehen“ (+ Tests)
- [ ] UI-Aufrufer mit Locale, `lang="de"` nur noch an echt deutschen Resten (+ Tests)
- [ ] Nicht-UI-Konsumenten: Test pinnt DE-Ausgabe unverändert
- [ ] Review-Tabelle DE | EN als Artifact an Matze, Korrekturen einarbeiten
- [ ] loadError-Block übersetzen, Grep-Audit `/explore`, `/explore` ins Voll-Register, e2e (kein Banner, hreflang, indexierbar)
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given `/en/explore` mit Inspector, Legende und Palette, when Layer-Erklärungen und Hinweise erscheinen, then sind sie englisch und tragen kein `lang="de"`.
- Given KI-Export, llms oder WebMCP, when sie Layer-Erklärungen oder Hinweise ausgeben, then bleiben diese deutsch wie bisher.

## Implementation Notes

- Übersetzung vorgezogen (09:15-09:19, 1 Subagent außerhalb des Repos). Abgenommene Quelle: `_bmad-output/implementation-artifacts/c1-uebersetzung.json` (DE wörtlich, EN von Matze abgenommen 09:21, siehe Abschnitt „Abnahme“ in `c1-uebersetzung-review.md`). Die Umsetzung übernimmt die EN-Texte unverändert. Zusätzlich: EN-Layer-Namen „Kiez Score“ → „Kiez score“ in `messages/en.json` (Matze-Entscheidung). Review-Tabelle als Datei statt Artifact (Artifact-Tool in der Session abgeschaltet).

- 27.09. 08:52 Start Planung, 08:52-08:54 Inventur (1 Subagent). Umsetzung erst nach Commit der Banner-Spec (gleiche Dateien). 08:56 Fragen beantwortet und Checkpoint 1 durch Matze („wie du empfiehlst“).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + i18n-e2e-Satz + `editorial-pattern` -- expected: grün
