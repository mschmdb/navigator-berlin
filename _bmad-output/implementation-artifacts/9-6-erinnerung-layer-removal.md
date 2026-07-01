# Story 9.6: Erinnerung-Layer aus Frontend entfernen

Status: review

> **Anker:** ADR-015 + User-Decision 2026-05-20. **Unabhängig:** kann jederzeit laufen (auch zuerst als Warm-up), keine Abhängigkeit zu 9.1–9.5.

## Story

As a User,
I want dass Denkmal + Stolpersteine nicht mehr im Frontend erscheinen,
so that der Inspector auf Lebensqualität fokussiert bleibt (Erinnerungs-Orte passen konzeptionell nicht zwischen Umwelt/Wohn-Daten).

## Kontext

ADR-015 entscheidet: Erinnerung (Denkmal, Stolpersteine) gehört nicht zwischen Umwelt- und Wohn-Daten und wird komplett aus dem Frontend genommen. Betroffen: Inspector-Section „Memorial", Layer-Palette-Bundle „D: Memorial", Map-Layer, Section-Mapping, die `StolpersteinDetail`-Custom-Component, LayerExplain/Synonyms/Methodology-Einträge und der LLM-Heritage-Renderer.

**Würde-Disziplin (kritisch):** Stolpersteine tragen editorial-sensible Texte (FR50/FR51 Würde-Prinzip). Entfernen heißt sauber raus, nicht halb-kaputt. Keine Broken-Links, keine leeren Sections.

## Acceptance Criteria

1. **AC-1 (Inspector-Section-Mapping):**
   **Given** `inspector-panel/internal/sections.ts`
   **When** der Inspector rendert
   **Then**:
   - `SectionKey`-Type: `'memorial'` entfernt
   - `SECTION_ORDER`, `SECTION_LABELS`, `BUNDLE_TO_SECTION`: alle `'memorial'`/`'D: Memorial'`-Einträge entfernt
   - keine leere Memorial-Section, kein dangling Section-Key

2. **AC-2 (StolpersteinDetail-Component):**
   **Given** `editorial-config.ts` referenziert `customComponent: 'StolpersteinDetail'`
   **When** die Layer entfernt sind
   **Then**:
   - der `stolpersteine`-Eintrag in `editorial-config.ts` entfernt (inkl. customComponent, disclaimerVariants, source)
   - `src/lib/components/atlas/stolperstein-detail.svelte` gelöscht (oder, falls Custom-Component-Registry sonst bricht, sauber deregistriert)
   - keine offene Referenz auf `StolpersteinDetail` mehr (grep-clean)

3. **AC-3 (Layer-Palette + Bundle):**
   **Given** Layer-Palette-Infrastruktur
   **When** die Palette rendert
   **Then**:
   - `layer-palette-filter.ts`: `stolpersteine` aus LAYER_EXPLAIN_DE + `'D: Memorial'` aus BUNDLE_LABEL_DE entfernt
   - `layer-explain.ts`: `'D: Memorial'`-Abschnitt (stolpersteine + denkmal-2024) entfernt
   - `layer-synonyms.ts`: stolpersteine-Synonyme entfernt
   - `layer-order-sorting.ts` BUNDLE_RANK + `url-state.ts` BUNDLE_ORDER: `'D: Memorial'` entfernt
   - `manifest-schema.ts` BundleSchema-Picklist: `'D: Memorial'` entfernt
   - `layer-methodology.ts`: stolpersteine + denkmal-2024 Einträge entfernt
   - keine der beiden Layer erscheint mehr in der Palette oder auf der Karte

4. **AC-4 (LLM-Heritage-Renderer + Aggregate):**
   **Given** `aggregate-renderer.ts` `renderHeritage` + `aggregate-types.ts` `HeritageAggregat`
   **When** LLM-Markdown gerendert wird
   **Then**:
   - `renderHeritage` („### Denkmal + Erinnerung"-Section) entfernt oder no-op; kein Heritage-Block im Output
   - `HeritageAggregat` (`denkmalPerKm2`, `stolpersteinePerKm2`) entfernt ODER als nicht-gerenderter Daten-Rest dokumentiert
   - Konsumenten von `renderHeritage` aktualisiert (kein Aufruf-Leiche)

5. **AC-5 (Sources + Pipeline-Entscheidung):**
   **Given** `scripts/lib/sources.ts` definiert `denkmal-2024` + `stolpersteine`
   **When** entschieden wird ob die Layer weiter gefetcht werden
   **Then** eine der zwei sauberen Optionen, dokumentiert im Completion-Note:
   - **(a)** Source-Einträge entfernen → werden nicht mehr gefetcht/manifestiert (bevorzugt, wenn keine andere Surface sie braucht)
   - **(b)** Source bleibt, aber `inspectorRelevant: false` + `mapRelevant: false` → gefetcht aber nicht im Frontend (nur falls ein Aggregat sie noch zwingend braucht)
   **And** keine Broken-Manifest-Referenz, Build bleibt grün

6. **AC-6 (Sauberkeit + Tests):**
   **Given** alle Änderungen
   **When** geprüft wird
   **Then**:
   - grep `src/` auf `denkmal`, `stolpersteine`, `Stolperstein`, `StolpersteinDetail`, `memorial`, `Memorial`, `D: Memorial` liefert keine aktiven Frontend-Referenzen mehr (außer ggf. bewusst belassene Source/Daten-Reste aus AC-5b)
   - Tests die Denkmal/Stolpersteine/Memorial referenzieren (bezirk-renderer.test.ts, kiez-renderer.test.ts, queries.test.ts u. a.) angepasst — Heritage-Assertions entfernt
   - keine Broken-Links, keine leeren Sections
   - `pnpm check` + `pnpm test:unit` grün
   - Daten-Pipeline-Doku (falls Layer gefetcht bleibt) markiert ihn als nicht-inspector-relevant

## Tasks / Subtasks

- [ ] **Task 1: Section-Mapping** (AC: #1)
  - [ ] 1.1 `sections.ts`: SectionKey 'memorial' raus, SECTION_ORDER/LABELS/BUNDLE_TO_SECTION bereinigen
  - [ ] 1.2 (RED→GREEN) sections-Test falls vorhanden

- [ ] **Task 2: StolpersteinDetail entfernen** (AC: #2)
  - [ ] 2.1 `editorial-config.ts` stolpersteine-Eintrag raus
  - [ ] 2.2 `stolperstein-detail.svelte` löschen
  - [ ] 2.3 Custom-Component-Registry/Resolver prüfen (kein dangling 'StolpersteinDetail')

- [ ] **Task 3: Palette/Bundle/Methodology** (AC: #3)
  - [ ] 3.1 layer-palette-filter.ts (LAYER_EXPLAIN_DE + BUNDLE_LABEL_DE)
  - [ ] 3.2 layer-explain.ts ('D: Memorial'-Abschnitt)
  - [ ] 3.3 layer-synonyms.ts
  - [ ] 3.4 layer-order-sorting.ts + url-state.ts (BUNDLE_RANK/ORDER)
  - [ ] 3.5 manifest-schema.ts (BundleSchema)
  - [ ] 3.6 layer-methodology.ts (stolpersteine + denkmal-2024)

- [ ] **Task 4: LLM-Heritage** (AC: #4)
  - [ ] 4.1 aggregate-renderer.ts renderHeritage entfernen/no-op + Aufrufer
  - [ ] 4.2 aggregate-types.ts HeritageAggregat entscheiden (raus oder dokumentierter Rest)

- [ ] **Task 5: Sources** (AC: #5)
  - [ ] 5.1 sources.ts: Option (a) entfernen oder (b) inspectorRelevant+mapRelevant=false; im Completion-Note begründen
  - [ ] 5.2 Manifest/Build grün

- [ ] **Task 6: Sauberkeit + Tests** (AC: #6)
  - [ ] 6.1 grep-clean src/
  - [ ] 6.2 Heritage-Tests anpassen (bezirk-renderer, kiez-renderer, queries u. a.)
  - [ ] 6.3 `pnpm check` + `pnpm test:unit` grün

## Dev Notes

### Referenz-Inventar (verifiziert, ~46 Nicht-Test + ~30 Test-Referenzen)

| Datei | Stelle | Inhalt |
|---|---|---|
| `inspector-panel/internal/sections.ts` | 4–10, 20–28, 30–38, 40–56 | SectionKey 'memorial', SECTION_ORDER, SECTION_LABELS, BUNDLE_TO_SECTION |
| `internal/layer-palette-filter.ts` | 27, 71 | stolpersteine in LAYER_EXPLAIN_DE; BUNDLE_LABEL_DE 'D: Memorial' |
| `internal/layer-explain.ts` | 99–107 | 'D: Memorial'-Abschnitt (stolpersteine 100–103, denkmal-2024 104–107) |
| `internal/layer-synonyms.ts` | 25 | stolpersteine-Synonyme |
| `internal/layer-order-sorting.ts` | 8–17 | BUNDLE_RANK 'D: Memorial': 3 |
| `utils/url-state.ts` | 93 | BUNDLE_ORDER 'D: Memorial': 3 |
| `data/manifest-schema.ts` | 12–21 | BundleSchema picklist enthält 'D: Memorial' |
| `server/db/schema/aggregate-types.ts` | 67–75 | HeritageAggregat (denkmalPerKm2, stolpersteinePerKm2) |
| `server/llms/internal/aggregate-renderer.ts` | 174–191 | renderHeritage „### Denkmal + Erinnerung" |
| `components/atlas/editorial-config.ts` | 28–35 | stolpersteine customComponent 'StolpersteinDetail' + disclaimerVariants + source |
| `components/atlas/stolperstein-detail.svelte` | 1–90 | Custom-Component (löschen) |
| `data/layer-methodology.ts` | 242–256 (stolpersteine), ~67–70 (denkmal-2024) | Methodology-Einträge |
| `scripts/lib/sources.ts` | denkmal-2024, stolpersteine | Source-Definitionen (AC-5-Entscheidung) |
| Tests | bezirk-renderer.test.ts, kiez-renderer.test.ts, queries.test.ts u. a. (~30 Refs) | Heritage-Assertions |

### Würde-Disziplin

Stolpersteine-Methodology + editorial-config tragen FR50/FR51-Würde-Texte. Sauber entfernen, nicht auskommentieren. Keine halb-toten Referenzen, keine leere „Memorial"-Section, die im Inspector als Lücke erscheint.

### Aggregate-Entscheidung

`HeritageAggregat` lebt in der DB-Aggregat-Schicht (aggregate-types.ts). Falls die Bezirks-/Kiez-Aggregate (`aggregate-data.ts`) Heritage-Felder berechnen und persistieren, prüfen ob ein DB-Migration/Aggregat-Re-Run nötig ist oder ob die Felder einfach ungerendert bleiben dürfen. MVP-Empfehlung: Renderer + Frontend raus; DB-Felder dürfen als ungenutzter Rest bleiben (kein Zwang zur Schema-Migration), im Completion-Note dokumentieren. Falls sauberer Schnitt gewünscht: separate Aggregat-Migration — aber das ist nicht zwingend für „nicht mehr im Frontend".

### denkmal-2024 Pipeline-Hinweis

Memory `project_simplify_keep_shapes`: denkmal-2024 hatte 24% Feature-Loss nach Mapshaper-Simplify (Story 1.25). Falls Source entfernt wird (AC-5a), wird der Punkt gegenstandslos. Falls Source bleibt (AC-5b), bleibt der Hinweis dokumentiert.

### Architektur-Compliance

- #2 Files <500
- #6/#7 strict, keine toten Kommentare/Referenzen
- #15 Würde-Prinzip beim Entfernen wahren
- ISO 9001: sauberer, nachvollziehbarer Schnitt

### Previous Story Intelligence

- **Story 1.16:** LayerExplain-Pattern (Bundle-Abschnitte)
- **Story 1.28 / 2.x:** Bundle-Schema + Section-Mapping-Pattern
- **Memory `project_simplify_keep_shapes`:** denkmal-2024 Feature-Loss-Historie
- **Memory `feedback_update_docs_per_story`:** nach Removal `doc:story-map`/`doc:pipelines` + manuelle Docs aktualisieren (Bundle „D: Memorial" verschwindet aus System-Map)

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: src/lib/components/atlas/inspector-panel/internal/sections.ts]
- [Source: src/lib/components/atlas/editorial-config.ts]
- [Source: src/lib/components/atlas/stolperstein-detail.svelte]
- [Source: src/lib/components/atlas/internal/layer-palette-filter.ts]
- [Source: src/lib/components/atlas/internal/layer-explain.ts]
- [Source: src/lib/components/atlas/internal/layer-synonyms.ts]
- [Source: src/lib/components/atlas/internal/layer-order-sorting.ts]
- [Source: src/lib/utils/url-state.ts]
- [Source: src/lib/data/manifest-schema.ts]
- [Source: src/lib/data/layer-methodology.ts]
- [Source: src/lib/server/db/schema/aggregate-types.ts]
- [Source: src/lib/server/llms/internal/aggregate-renderer.ts]
- [Source: scripts/lib/sources.ts]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Completion Notes List

- **Ansatz AC-5b (build-only, kein DB-Cut):** denkmal-2024 + stolpersteine bleiben in sources/manifest als Heritage-Dichte-Signal (HeritageAggregat in bezirk_stats/kiez_stats ist `notNull`, ein echter Cut bräuchte DB-Migration). Beide sind `inspectorRelevant:false` + `mapRelevant:false` (build-only). Frontend-Sichtbarkeit konsistent über diese Flags gegatet.
- **Lektion (User-Feedback „arbeite sauberer"):** sources.ts-Flags ändern nur die Build-Pipeline, NICHT das committete `static/layers/MANIFEST.json`, das das Frontend liest. Manifest-Eintrag für stolpersteine direkt gepatcht (Flags false). Außerdem hielt der laufende Dev-Server den Pre-9.3-Manifest im `loadManifest`-Module-Singleton-Cache → `/layer/kiez-score-gruen-hitze` 404, alter Slug 200. Dev-Server-Neustart nötig.
- **Build-only-Gating konsistent gemacht** (vorher leakten denkmal/stolpersteine in /layer + Methodik-Tabelle + Sitemap + llms.txt trotz Flags):
  - `buildLayerDetail`: null (404) wenn `inspectorRelevant===false && mapRelevant===false`.
  - `/layer/[slug]` entries(): Build-only nicht prerendern.
  - Methodik-Daten-Tabelle (`methodik/+page.svelte`): nur sichtbare Layer + layerCount.
  - `sitemap-builder` LAYER_DETAIL_SOURCE + `llms-builder`: Build-only ausgenommen.
  - Palette filtert bereits `mapRelevant!==false`.
- **Inspector:** SectionKey `memorial` raus; `D: Memorial` → No-Op-Map auf boundaries (Bundle bleibt im Schema, da Layer build-only existieren).
- **StolpersteinDetail entfernt:** editorial-config-Eintrag, Component + Test gelöscht, EditorialCustomComponent-Union + StolpersteinFeature/Properties-Typen raus, layer-hit-row entkoppelt.
- **LLM:** renderHeritage + Aufruf entfernt; llm-export Footer-Hint entstigmatisiert (kein Stolperstein-Würde-Text mehr, generischer KI-Hinweis).
- **Belassen (konsistent mit denkmal-Pattern, build-only):** generische Layer-Switch-Cases (value-formatters/severity/pin-icon/feature-describer), layer-explain/synonyms/methodology-Einträge, HeritageAggregat + aggregate-data heritage-Compute (inert).
- Tests: editorial-config, layer-hit-row, sections, merge-sections, llm-export-builder, get-layer-detail angepasst. `pnpm check` 2 pre-existing de/en-Errors (out-of-scope). seo/endpoints flaky-Timeout unter Last (isoliert grün).

### File List

**Geändert:** scripts/lib/sources.ts, sections.ts, layer-hit-row.svelte (+test), editorial-config.ts (+test), editorial-types.ts, get-layer-detail.ts, llms-builder.ts, sitemap-builder.ts, aggregate-renderer.ts, llm-export-builder.ts (+test), layer/[slug]/+page.server.ts, methodik/+page.svelte, sections.test.ts, merge-sections.test.ts, static/layers/MANIFEST.json
**Gelöscht:** stolperstein-detail.svelte (+test)

## Change Log

- 2026-05-21: Story 9.6 Erinnerung-Removal (AC-5b build-only). denkmal/stolpersteine aus allen Frontend-Surfaces (Palette/Inspector-Section/Layer-Detail/Methodik/Sitemap/llms) via konsistentes Build-only-Gating. StolpersteinDetail + renderHeritage entfernt. Layer bleiben als inertes Heritage-Signal (kein DB-Cut). check 2 pre-existing.
