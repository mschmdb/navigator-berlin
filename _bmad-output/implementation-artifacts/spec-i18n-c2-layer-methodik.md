---
title: 'i18n Block C2: Layer-Methodik und Behörden auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en/layer/<slug>` sind die Methodik-Karten deutsch und mit `lang="de"` markiert. Betroffen sind Berechnung, Coverage-Lücken, „What we don't show“ und Aktualisierung aus `layer-methodology.ts` (44 Slugs, 155 Strings) sowie die Pflege-/Behördennamen aus `authorities.ts` (25 Einträge, Feld `en` leer).

**Approach:** Wir übernehmen die abgenommene Übersetzung aus `c2-uebersetzung.json` unverändert.
- Methodik-Texte werden Paraglide-Messages.
- Die Behörden bekommen ihr `en`-Feld.
- Der OSM-Suffix wird locale-fähig.
- `getLayerMethodology` bekommt einen optionalen Locale-Parameter mit DE-Default.
- Die UI von `/layer` übergibt die Seiten-Locale und entfernt dort `lang="de"`, wo übersetzt.
- WebMCP bleibt deutsch.

## Boundaries & Constraints

**Always:**
- Übersetzung und Abnahme: `_bmad-output/implementation-artifacts/c2-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen im Abschnitt „Abnahme“ von `c2-uebersetzung-review.md` (Matze 27.09. 10:59):
  - Offizielle englische Behördennamen laut berlin.de.
  - OSM-Suffix EN „· OpenStreetMap contributors (ODbL 1.0)“, DE unverändert.
  - Interne Verweise bleiben wörtlich.
- DE-Ausgabe Zeichen für Zeichen gleich. Parity-Test Messages ↔ bisherige DE-Werte für alle Slugs, Felder, Array-Elemente und Behörden.
- Nicht-UI-Konsumenten bleiben DE: `src/lib/webmcp/{adapter,mount}.ts`, `tools/get-layer-metadata.ts`. Test unter EN-Locale.
- `/layer`-JSON-LD `creatorName` bleibt DE bis zur Registrierung (B4b-Linie).
- `aggregationLevel` (Enum) und `relatedLayers` (Slugs) bleiben unverändert.
- Fehlendes Mapping schlägt im Test fehl, kein stiller DE-Fallback.
- TDD pro AC.

**Never:**
- Keine DE-Textänderung, keine inhaltliche Überarbeitung (Bereinigung ist vorgemerkt).
- Kein Register-Eintrag `/layer` (FAQ-Inhalte bleiben DE, eigener Block).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| `/layer` EN | `/en/layer/<slug>` mit Methodik | Berechnung, Lücken, Auslassungen, Pflege, Aktualisierung englisch, ohne `lang="de"` | N/A |
| OSM-Layer EN | Slug mit `authoritySuffix` | „… · OpenStreetMap contributors (ODbL 1.0)“ | N/A |
| DE unverändert | `/layer/<slug>` | Texte identisch | N/A |
| WebMCP | `get_layer_metadata` unter EN-Seite | DE wie bisher | N/A |
| Layer ohne Methodik | `/en/layer/<slug>` ohne Spec | Leerzustand wie B4b | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/data/layer-methodology.ts`:
  - `LAYER_METHODOLOGY_SPECS` (44).
  - `specToMethodology(spec, locale)` `:575`: löst die Authority schon locale-fähig auf, der Suffix ist aber fest.
  - `buildResolvedMap(locale)` `:591`, `LAYER_METHODOLOGY_DE` `:606`, `getLayerMethodology(slug)` `:608`: Locale ergänzen, DE-Map als Referenz-Export behalten.
- `src/lib/data/authorities.ts`: `AUTHORITIES` (25, `en?`), `resolveAuthority(key, locale)` `:117`, `AUTHORITY_SUFFIX_OSM_ODBL` `:130` → locale-fähig (Funktion oder Map).
- `src/lib/data/get-layer-detail.ts`: `lang` an `getLayerMethodology` durchreichen. JSON-LD bekommt eine DE-Quelle wie `deExplain` in C1.
- `src/routes/(with-header)/layer/[slug]/+page.svelte`: `lang="de"` an Methodik-Feldern entfernen, `contentLang` nur noch für echte DE-Reste (FAQ).
- WebMCP-Aufrufer ohne Locale lassen: `src/lib/webmcp/adapter.ts`, `mount.ts`, `tools/get-layer-metadata.ts`.
- Tests: `layer-methodology.test.ts`, `authorities`-Test, `get-layer-detail.test.ts`, `layer/[slug]/page.svelte.test.ts`, WebMCP-Tests, e2e `i18n-layer-frame`.

## Tasks & Acceptance

**Execution:**
- [ ] Messages aus `c2-uebersetzung.json` erzeugen (Script oder manuell, DE wörtlich), Key-Parität
- [ ] `layer-methodology.ts` + `authorities.ts` locale-fähig, Parity-Tests DE, EN-Vollständigkeit (+ Tests)
- [ ] `get-layer-detail.ts` + `/layer`-Seite: Locale durchreichen, `lang="de"` entfernen, JSON-LD DE (+ Tests)
- [ ] WebMCP bleibt DE (+ Test unter EN)
- [ ] e2e `i18n-layer-frame`: Methodik EN, kein `lang="de"` an Methodik, DE-Kontrolle
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given `/en/layer/<slug>` mit Methodik, when die Seite lädt, then sind alle Methodik-Felder und die Pflege-Angabe englisch und ohne `lang="de"`.
- Given WebMCP `get_layer_metadata`, when es unter EN aufgerufen wird, then liefert es die DE-Methodik wie bisher.

## Implementation Notes

- 27.09. 10:36 Übersetzung vorgezogen (1 Subagent außerhalb des Repos, 10:37-10:41), Abnahme Matze 10:59. Spec 11:01, Umsetzung nach dem C1-Commit (gleiche Dateien). 11:26 Checkpoint 1 durch Matze („Freigeben weiter“).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-layer-frame`, `i18n-routing` -- expected: grün
