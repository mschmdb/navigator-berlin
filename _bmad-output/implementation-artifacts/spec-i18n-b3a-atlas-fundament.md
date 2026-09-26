---
title: 'i18n Block B3a: Atlas-Fundament und Karte auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b2-shell.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Atlas `/explore` ist komplett deutsch: Layer-Namen, Kategorien, Legenden, Score-Dimensionen, Wert-Formatter und Karten-Bedienung. Die Formatter nutzen feste de-DE-Formate und einen Sentinel-String („Daten nicht vorhanden“) als Logik-Schlüssel. Sechs Komponenten bauen Layer-Links als `/de/layer/…` (vorbestehender Fehler, läuft über einen 301-Umweg).

**Approach:** Fundament für den ganzen Atlas: locale-fähige Label-Resolver (Layer-Name, Bundle, Section, Score-Dimension, Skala) nach dem Muster `wahl-labels.ts`, Legenden-Labels, Locale-Parameter für die Wert-Formatter mit `isMissing`-Flag statt Sentinel, Komma-Hacks auf `src/lib/i18n/format.ts`. Dazu die Karten-Oberfläche (Route-Ansagen, OG, Map-Controls, Attribution, A11y-Layer, Hover-Tooltip, Legende, Layer-Palette) auf Messages + EN und Layer-Links über `localizedHref`. Inspector (B3b) und Finder/Compare/Bookmarks (B3c) folgen; `/explore` kommt erst nach B3c ins Register.

## Boundaries & Constraints

**Always:**
- Koordinator-Entscheidung, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“): B3 wird in B3a/B3b/B3c geteilt (~550-600 Keys gesamt); B3b/B3c stehen in `deferred-work.md`.
- Koordinator-Entscheidung, Matze AFK: `/explore` bleibt bis B3c unregistriert (`noindex`, Fallback-Hinweis), damit keine halb deutsche Seite indexiert wird.
- Koordinator-Entscheidung, Matze AFK: Layer-Namen (`LAYER_EXPLAIN_DE`-Titel) sind Code-Labels und werden in B3a übersetzt; die Fließtexte in `layer-explain.ts` bleiben Block C. EN-Suchsynonyme (`layer-synonyms.ts`) kommen nicht dazu.
- Linie der bisherigen Blöcke: Glossar (Kiez/Bezirk deutsch, Wahlbegriffe wie Block B), DE-Ausgabe Zeichen für Zeichen gleich, geteilte Resolver ohne Locale-Angabe liefern DE (B4-Detailseiten, Methodik, Lizenzen, OG-Pipeline bleiben DE), Datenschlüssel unverändert (Layer-Slugs, Bundle-IDs, Query-Keys, `FINDER_URL_KEYS`, Partei-Kurznamen, Plausible-Events, Datenwerte wie `'gültig'`), WebMCP-Tool-Surface unverändert.
- `localeCompare(…, 'de')` in `url-state.ts` bleibt (URL-Reihenfolge locale-unabhängig).
- `#each`-Keys auf Labels auf IDs umstellen, wo das Label übersetzt wird.
- TDD pro AC.

**Never:**
- Kein Inspector-Panel (B3b), kein Finder/Compare/Bookmarks (B3c), keine Fließtexte/Disclaimer-Texte (Block C), kein KI-Export (Block D), keine B4-Detailseiten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/explore` mit Layern | Palette, Legende, Tooltip, Controls wie vor B3a | N/A |
| EN-Karte | `/en/explore?layers=laerm` | Palette, Legende, Controls, Tooltip englisch | N/A |
| Fehlender Wert | Formatter ohne Wert unter `en` | EN-Text „No data“, Logik über `isMissing`, nicht über Text | N/A |
| Layer-Link | Legenden-Link unter `/en` | `/en/layer/<slug>` (kein `/de/…`) | N/A |
| Layer-Link DE | Legenden-Link unter DE | `/layer/<slug>` (kein 301-Umweg) | N/A |
| Resolver ohne Locale | `layerDisplayName(slug)` auf Methodik | DE | N/A |
| Datenschlüssel | `?layers=`, Bundle-ID, `'gültig'` | unverändert | N/A |

</frozen-after-approval>

## Code Map

- Route `src/routes/(with-header)/explore/+page.svelte` (~22 Strings: 11 `announceGlobal` :655-1168, OG :1203-1218, Compare-Replace-Dialog :1375ff → B3c prüfen), Sentinel :1191.
- Karte: `src/lib/components/atlas/map-libre-canvas`, `map-controls` (9 aria), `map-attribution`, `map-accessibility-layer`, `map-hover-tooltip` + `internal/hover-tooltip-logic.ts:21-22`, `map-legend` (10, `#each` :166), `briefwahl-marker`, `mauer-sektoren-detail`, `value-chip`, `layer-palette.svelte` (11).
- Resolver: `internal/layer-palette-filter.ts:4-110` (`LAYER_EXPLAIN_DE`-Titel, `getLayerDisplayName`, `BUNDLE_LABEL_DE`), `inspector-panel/internal/sections.ts:23` (`SECTION_LABELS`), `inspector-panel/internal/kiez-score-display.ts:9` (`DIMENSION_LABELS_DE`, Skalen-Union → IDs), `internal/layer-style-builder.ts` (67 Legenden-Labels).
- Formatter: `inspector-panel/internal/value-formatters.ts` (Sentinel :8, `Intl.NumberFormat('de-DE')` :40-228), `layer-hit-display.ts`, `feature-describer.ts`, `mobility-rating.ts`, `format-distance.ts`, `format-opening-hours.ts`; Sentinel-Vergleiche `+page.svelte:1191`, `inspector-panel.svelte:382`.
- `/de/layer`-Links: `map-legend:290`, `layer-hit-row:79`, `klima-pet-card:65`, `kiez-score-section:29`, `layer-card:44`, `kiez-score-dimension-row:25`.
- DE-Default-Nutzer, die DE bleiben: `layer/[slug]`, `methodik-daten-tabelle`, `lizenzen`, `data/source-label.ts`, `data/get-layer-detail.ts`, `server/og/og-pipeline.ts`, `charts/kiez-score-hero`, `llm-export-builder`.
- Tests: `layer-style-builder`, `map-legend`, `value-formatters`, `layer-hit-display`, `hover-tooltip-logic`, `map-hover-tooltip`, `map-controls`, `layer-palette`; e2e `map-interaction.e2e.ts:12-24` (Rollen-Namen DE), `i18n-routing.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [ ] Label-Resolver (Layer, Bundle, Section, Dimension, Skala) + Legenden-Labels mit `LocaleOptions` (+ Tests)
- [ ] Formatter mit Locale-Parameter, `isMissing` statt Sentinel, Formate über `format.ts` (+ Tests, DE-Parität)
- [ ] `/de/layer`-Links auf `localizedHref` (+ Tests)
- [ ] Karten-Oberfläche und Route auf Messages (+ Komponententests)
- [ ] e2e: `/en/explore` Karte EN, DE unverändert; Key-Parität, `lint:wahl`
- [ ] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/explore?layers=<slug>`, when die Karte lädt, then sind Palette, Legende, Controls und Tooltip englisch.
- Given jede DE-Seite mit Atlas-Bausteinen, when die bestehenden Tests laufen, then sind sie unverändert grün.
- Given ein Layer-Link aus dem Atlas, when er gerendert wird, then zeigt er ohne 301-Umweg auf `/layer/<slug>` bzw. `/en/layer/<slug>`.

## Implementation Notes

- 26.09. 23:59 Start Planung, 23:59-00:04 Inventur (1 Subagent), 00:05 Split-Entscheidung (Koordinator), 00:06 Checkpoint 1 freigegeben durch Koordinator (Matze AFK, Ansage 26.09. 22:57).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build`, Preview, `i18n-routing.e2e.ts`, `map-interaction.e2e.ts`, `a11y.e2e.ts` -- expected: grün (bekannte Fails ausgenommen)
