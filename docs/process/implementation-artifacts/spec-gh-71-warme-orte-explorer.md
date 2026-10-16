---
title: 'Kälte-Navigator: warme Orte im Explorer (#71)'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: 'c33c2e9858fb2f80d0d1f9395a3b2be3f8c39b36'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
  - '{project-root}/docs/adr/ADR-020-kuehle-orte-local-source.md'
  - '{project-root}/docs/waerme-orte-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die 227 warmen Orte erscheinen nur als Liste auf `/kaelte`. Auf der Karte im Explorer fehlen sie, und es gibt keine Layer-Seite mit Methodik und Quellen (Epic #57, aus #63 herausgelöst).

**Approach:** Layer `waerme-orte` nach dem Muster `kuehle-orte`: Quelle in `sources.ts` (`kind:'local'`), MANIFEST-Eintrag per `fetch-static`, volle Explorer-Konfiguration (Name DE/EN, Stil, Legende, Pin, Synonyme, Erklärtext, POI-Popup, Disclaimer, Methodik, Autorität) und dadurch automatisch `/layer/waerme-orte`. Auf `/kaelte` ein Link „auf der Karte ansehen“ (`buildExplorerDeepLink(['waerme-orte'])`), auf der Layer-Seite ein Link zurück zu `/kaelte`.

**Entscheidung (Matze 16.10.2026):** Keine eigene Inspector-Karte „warme Orte in der Nähe“; nur Pins, Popup und Layer-Seite. Die Nähe-Liste bleibt auf `/kaelte`.

## Boundaries & Constraints

**Always:**
- Popup und Layer-Seite zeigen nur Angaben aus dem GeoJSON; `unknown` als „nicht geprüft“. Quelle (OSM/ODbL + Redaktion navigator.berlin) wie bei Kühlen Orten getrennt ausweisen (ADR-020).
- Alle Layer-Registrierungen, die Tests per MANIFEST erzwingen, vollständig (Pin-Icon, Erklärtext, EN-Name, Methodik-EN, Disclaimer-Variante).
- Eigene warme Farbe und eigenes Icon, Kontrast WCAG 2.2 AA für Pin und Legende.
- DE/EN von Hand, keine em-dashes, Tests zuerst.

**Never:**
- Keine Änderung am Verhalten von `kuehle-orte`, `/hitze`, `mode=hitze` oder der Hitze-Inspector-Karte.
- Kein `noindex`-Wechsel für `/kaelte`, keine Footer-/Startseiten-Links, kein Updates-Eintrag (Launch, #63).
- Keine Datenänderung an `static/data/waerme-orte/`.
- Keine Änderung an `inspector-panel.svelte`, UI-State oder Explorer-Loader (keine Inspector-Karte).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Layer-Palette | Explorer, Bundle „Umwelt“ | Eintrag „Warme Orte“ / „Warm places“ mit Legende | N/A |
| Deep-Link | `/explore?layers=waerme-orte` | Layer aktiv, Pins sichtbar | N/A |
| Popup | Klick auf Pin | Name, Kategorie, Winter-Öffnung bzw. „nicht geprüft“ | Fallback-Summary bei fehlenden Feldern |
| Layer-Seite | `/layer/waerme-orte`, `/en/layer/waerme-orte` | 200, Methodik, Quellen, Link zu `/kaelte` | N/A |
| /kaelte | Seite geladen | Link „auf der Karte ansehen“ führt zum Deep-Link | N/A |
| Hitze unverändert | `/hitze`, `mode=hitze` | wie vorher | N/A |

</frozen-after-approval>

## Code Map

- A Pipeline: `scripts/lib/sources.ts:165-175` (Vorlage kuehle-orte), `package.json:26-29` (`data:waerme-orte-fetch` ergänzen), `scripts/fetch-static.ts` (generisch), `static/layers/MANIFEST.json` (per Skript), `scripts/generate-data-flow-doc.ts` neu laufen lassen.
- B Explorer (`src/lib/components/atlas/`): `internal/layer-palette-filter.ts:42,172` + `messages` `atlas_layer_name_*`; `internal/layer-style-builder.ts:42,109,379,611,775`; `internal/colors.ts:25`; `internal/pin-icon-mapping.ts:44` (+ Test EXPECTED_SLUGS); `internal/layer-synonyms.ts:47`; `inspector-panel/internal/layer-explain.ts:142,475` (+ Längen/EN-Tests); `internal/poi-summary-builder.ts:42`.
- C Seite/Methodik: `src/lib/data/layer-methodology.ts:407`, `layer-methodology-messages.ts:221`, `src/lib/data/authorities.ts:136`, `internal/editorial-config.ts:40`, `editorial-types.ts:6`, `editorial-disclaimer.svelte:14,85` (+ `editorial-config.test.ts` ALLOWED_VARIANTS); `routes/(with-header)/layer/[slug]/+page.svelte:196` (CTA-Muster → `/kaelte`).
- D Link: `src/lib/utils/url-state.ts:222` `buildExplorerDeepLink`; `/hitze`-Muster `hitze/+page.svelte:59-60,183`; Ziel `kaelte/+page.svelte`.
- E Tests mit Layer-Aufzählung: `pin-icon-mapping.test.ts`, `layer-explain.test.ts`, `layer-overview.test.ts`, `layer-methodology.test.ts`, `editorial-config.test.ts`, ggf. `lizenzen`-Snapshots.

## Tasks & Acceptance

**Execution:**
- [x] Pipeline (A) + MANIFEST-Eintrag erzeugen.
- [x] Explorer-Konfiguration (B) + Tests.
- [x] Methodik, Autorität, Disclaimer, Layer-Seiten-CTA (C) + Tests.
- [x] `/kaelte`-Link „auf der Karte ansehen“ + Test.
- [x] Messages DE/EN.
- [x] E2E: `/layer/waerme-orte` 200 + axe; `/explore?layers=waerme-orte` lädt; Link auf `/kaelte`.

**Acceptance Criteria:**
- Given der Explorer, when „Warme Orte“ aktiv ist, then erscheinen alle 227 Pins mit eigener Farbe und Legende, und ein Klick zeigt die Winter-Angaben oder „nicht geprüft“.
- Given ein Screenreader auf `/layer/waerme-orte`, when er die Seite liest, then nennt sie Herkunft (OSM + Redaktion), Stand und Grenzen.

## Implementation Notes

- Farbe `umweltWaermeOrte` #B5390A (4,9:1), Flammen-Icon. Popup nur DE wie bei kuehle-orte/trinkbrunnen (getPopoverSummary ohne Locale).

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Synonyme „Wärmestube“/„Kältehilfe“ führen zu Bibliotheken und Malls | medium | patch | Methodik schließt Wärmestuben aus. |
| 2 | Synonyme „warm“, „winter“, „kälte“ treffen per Substring „Warmmiete“ usw. | low | patch | `q.includes(normalized)`. |
| 3 | AC 1 ungeprüft: Layer-Datei könnte fehlen, E2E prüft nur Legende | medium | patch | Legende kommt aus Slug, nicht aus GeoJSON. |
| 4 | Popup ohne Aufenthalt ohne Konsum, Eintritt | low | patch | Builder liest nur name/cat/winter_open. |
| 5 | Layer-Seiten-CTA ohne `min-h-11` und Fokusring | low | patch | Abweichung zum /kaelte-Link. |
| 6 | Erklärtext nennt „Gotteshäuser“ nicht | low | patch | 2 Orte der Kategorie. |
| 7 | AC 2 halb getestet (Redaktion, Stand, Grenzen, axe EN) | low | patch | E2E prüft nur „OpenStreetMap“. |
| 8 | Legenden-Test prüft nur „nicht Kühle-Orte-Farbe“; Kontrast-Test ohne Non-Text-Paarung | low | patch | Schwache Assertions. |
| 9 | `winter_open` mit Prototyp-Key („constructor“) | low | patch | Direkter Objekt-Lookup; `Object.hasOwn`. |
| 10 | Popup auf EN deutsch | low | defer | Bestehendes Muster aller POI-Popups ohne Locale. |
| 11 | Methodik-Zahlen hart codiert | low | defer | Driften erst beim nächsten Datenlauf. |
| 12 | `/layer/waerme-orte` landet automatisch in Sitemap/llms vor dem Launch | low | reject | Deploy erfolgt gemeinsam mit #63; Hinweis an Matze. |
| 13 | relatedLayers nur einseitig | low | reject | Spec verbietet Änderung an kuehle-orte. |
| 14 | data-flow.md nicht im Review-Diff | false | reject | Generiert, bewusst ausgeschlossen. |
| 15 | UI-/E2E-Tests nicht in CI | low | reject | Bereits deferred (#55). |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün (bekannte Flakes winner-map dokumentieren)
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte kuehle-orte i18n-layer-frame seo-indexierung a11y` -- expected: grün außer bekanntem „Escape löscht Selection“
