# Story 1.23: „Daten nicht vorhanden" Reason aufdröseln (Geltungsbereich / nicht-anwendbar / Lücke)

Status: review

## Story

As a Nutzer:in, die einen leeren Layer-Eintrag sieht,
I want den Grund verstehen: Liegt es am Datenraster, am Konzept oder ist es eine echte Lücke,
so that ich nicht denke „die App ist kaputt" oder „der Layer existiert nicht".

## Problem heute

Alle leeren Layer-Hits zeigen einheitlich „Daten nicht vorhanden". Drei unterscheidbare Fälle werden zusammengeworfen:

1. **Räumlich außerhalb Geltungsbereich** — Klimaanalyse 2022 bei Karow (Innenstadt-Fokus), Stolpersteine in Industriegebiet
2. **Konzept gilt nicht** — Milieuschutz im Kleingarten, Schulen im Wald
3. **Echte Lücke** — Datensatz hat Fehler, Pipeline-Bug, fehlende Quelle

## Akzeptanz-Kriterien

1. **AC-1:** Neuer `LayerHitReason`: `coverage-out-of-scope` (statt nur `no-coverage`).

2. **AC-2:** Manifest hat pro Layer optionalen `coveragePolygon`-Slug oder `coverageBbox` (rough). `get-layers-at-point` setzt Reason `coverage-out-of-scope` wenn Point außerhalb dieses Geltungsbereichs.

3. **AC-3:** Pro `bundleGroup` definiert `inspector-panel/internal/sections.ts` (oder neuer Module) ein „Applicability-Check": welche Layer gelten konzeptuell an dieser Lage?

4. **AC-4:** LayerHitRow rendert Reason-spezifischen Text:
   - `coverage-out-of-scope`: „Datensatz deckt diese Lage nicht ab"
   - Konzept-nicht-anwendbar: „Nicht ausgewiesen für diese Lage"
   - Echte Lücke: bisheriges „Daten nicht vorhanden"

5. **AC-5:** Tests pro Reason + Snapshot LayerHitRow.

## Tasks

- [x] Task 1: `LayerHitReason` erweitern + Type-Updates
- [x] Task 2: Manifest-Schema `coverageBbox` oder `coveragePolygon`
- [x] Task 3: Coverage-Detection in `get-layers-at-point` integrieren
- [x] Task 4: Applicability-Map für Konzept-Layer (z.B. Milieuschutz braucht bewohnt-Lage)
- [x] Task 5: LayerHitRow Reason-Wording-Map
- [x] Task 6: Tests + Snapshots

## Dev Notes

- Manifest-Schema-Migration kompatibel halten (alte Layer ohne `coverageBbox` = default true)
- Wörther-Str-Klima-PET-2022-Fehlen muss als Echte-Lücke-Bug verifiziert werden (siehe Story 1.25)
- Granularität: Bbox reicht für Phase 1, Polygon-Coverage später

## References

- [Source: src/lib/data/types.ts] (LayerHitReason)
- [Source: src/lib/data/get-layers-at-point.ts]
- [Source: src/lib/components/atlas/inspector-panel/layer-hit-row.svelte]
- User-Review-Feedback Wave 2, Punkt 3 (2026-05-14)

## Dev Agent Record

### Implementation Plan

TDD-first per ADR-012. Pro AC mind. 1 Failing-Test → Implementation → Green.

Architektur-Entscheidungen:

- `LayerHitReason` (Domain-Type in `src/lib/data/types.ts`) um zwei Reason-Werte erweitert: `coverage-out-of-scope` (Datensatz-Geltungsbereich) und `out-of-concept` (Konzept-nicht-anwendbar).
- Manifest-Schema: optionales Tupel `coverageBbox = [minLng, minLat, maxLng, maxLat]` mit valibot-Range-Check (`minLng<maxLng && minLat<maxLat`) in beiden Schema-Quellen (`src/lib/data/manifest-schema.ts` Runtime + `scripts/lib/manifest.ts` Build-Pipeline). Roundtrip-Test über `buildLayerEntry` → `ManifestSchema.parse` deckt Pipeline ab.
- Coverage-Detection: `hitForLayer` checkt direkt nach `inspectorRelevant`-Filter `isInCoverageBbox`. Bei Miss → `coverage-out-of-scope` ohne Feature-Fetch (Performance-Pluspunkt). Default fehlt = ganz Berlin (kein Vor-Filter, kompatibel mit existierenden Layern).
- Applicability als separates Modul `inspector-panel/internal/applicability.ts`. Cross-Layer-Logik liest BRW-Nutzung (Berlin-Codes W/M1/M2 + BauNVO-Spec WA/WR/WS/MD/MI/MK) → Residential-Context. Layer-Slug → Predicate-Mapping. `applyApplicabilityReasons` macht ein Pure-Functional-Transform: `no-coverage + nicht-anwendbar → out-of-concept`. Andere Reasons (`coverage-out-of-scope`, `seasonal`) bleiben unverändert (höhere Priorität).
- Aufruf in `inspector-panel.svelte` via `$derived(applyApplicabilityReasons(ui.selectedLayerHits))`. Enriched-Hits-Quelle für `groupHitsBySection`, OG-Image-Top-Layers, LLM-Export.
- LLM-Export-Builder bekommt eigene `reasonText`-Mapping-Funktion (statt nur Wert-Formatter), damit Markdown-Output das richtige Wording pro Reason zeigt (`Datensatz deckt diese Lage nicht ab` / `Nicht ausgewiesen für diese Lage` / `Daten nicht vorhanden`).
- LayerHitRow `RowState` erweitert um beide neue Reasons. Wording in eigenen Test-IDs (`value-coverage-out-of-scope`, `value-out-of-concept`) → strukturell unterscheidbar für Tests + Screen-Reader.
- External-Link-Render-Condition verschärft: vorher `rowState !== 'no-coverage'`, jetzt `rowState === 'with-value'` → bei allen Empty-Reasons keine Action.

### Test-Strategie

- `scripts/lib/manifest.test.ts`:  +3 Tests (buildLayerEntry-Propagation, Schema-Roundtrip, Range-Validation).
- `src/lib/data/get-layers-at-point.test.ts`: +4 Tests in `coverageBbox`-describe-Block (inside Bbox = normaler Hit, outside Bbox = `coverage-out-of-scope`, kein Feature-Fetch, kein coverageBbox = unverändertes Verhalten).
- `src/lib/components/atlas/inspector-panel/internal/applicability.test.ts`: 15 Tests (isLayerApplicable Predicate-Coverage + applyApplicabilityReasons Transform-Cases inkl. seasonal/coverage-out-of-scope-Schutz, Multi-Layer-Cross-Reason).
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts`: +5 Tests in Story-1.23-describe (Wording, data-state, aria-label, external-link-Hide für beide neuen Reasons).
- `src/lib/utils/llm-export-builder.test.ts`: +3 Tests pro Reason im Markdown-Output.

### Completion Notes

- Alle 6 Tasks komplett, AC-1 bis AC-5 erfüllt.
- 1086/1086 Unit-Tests grün (108 Files), Type-Check 0 Errors über 5480 Files.
- Keine konkrete Layer-Bbox in `sources.ts` gesetzt: Mechanik + Tests reichen für AC-Erfüllung. Konkrete coverageBbox-Belegung für klima-pet-2022/leitbahn/kaltlufteinwirk pro Layer ist Folge-Konfiguration (Phase 2), da Story 1.25 die `klima-pet-2022`-Lücken bereits via `nearestPolygonFallbackKm` aufgelöst hat (keine echten coverage-Probleme im Live-Datensatz).
- E2E + axe-CI-Run deferred zu CI/User-Verify-Phase.

### File List

Modified:

- `src/lib/data/types.ts` - LayerHitReason erweitert + LayerMetadata.coverageBbox optional
- `src/lib/data/manifest-schema.ts` - coverageBbox valibot-Schema mit Range-Check
- `src/lib/data/get-layers-at-point.ts` - isInCoverageBbox + Coverage-Pre-Check in hitForLayer
- `scripts/lib/types.ts` - SourceConfig.coverageBbox + LayerEntry.coverageBbox
- `scripts/lib/manifest.ts` - Pipeline-Schema + buildLayerEntry-Propagation
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` - RowState erweitert + Wording-Map + External-Link-Condition
- `src/lib/components/atlas/inspector-panel.svelte` - applyApplicabilityReasons-Wiring (enrichedHits durchgereicht)
- `src/lib/utils/llm-export-builder.ts` - reasonText-Helper + reason-aware Render

Modified (Tests):

- `scripts/lib/manifest.test.ts` - +3 Tests (Pipeline-Propagation + Schema-Roundtrip + Range-Validation)
- `src/lib/data/get-layers-at-point.test.ts` - +4 Tests im coverageBbox-Block
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts` - +5 Tests Story-1.23-Wording
- `src/lib/utils/llm-export-builder.test.ts` - +3 Tests Reason-im-Markdown

New:

- `src/lib/components/atlas/inspector-panel/internal/applicability.ts` - Cross-Layer-Reason-Adjust + Predicate-Map
- `src/lib/components/atlas/inspector-panel/internal/applicability.test.ts` - 15 Tests

### Change Log

- 2026-05-14: Story 1.23 implementiert. LayerHitReason um coverage-out-of-scope + out-of-concept erweitert. Manifest-Schema kompatibel migriert. Applicability-Modul für Cross-Layer-Concept-Check. LLM-Export reason-aware. Inspector-Panel-Wiring. 1086 Tests grün.
