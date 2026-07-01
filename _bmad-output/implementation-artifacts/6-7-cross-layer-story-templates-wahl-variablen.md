# Story 6.7: Cross-Layer-Story-Templates mit Wahl-Variablen

Status: backlog

<!-- Created 2026-05-18. Blocked by 6-0 (Queries). Hochsensibel wegen Stigma-Risiko — Co-Design-Gate vor Roll-out. -->

## Story

As a Datenjournalist,
I want deterministische Template-Texte die Wahl mit anderen Layern verknüpfen (z.B. „Stimmenanteil + Wohnlage + Lärm"),
so that ich für eine Adresse oder einen Kiez eine vorformulierte Cross-Layer-Beobachtung kriege ohne wertendes Framing.

## Quellen

- **Story 2.5b:** FAQ-Template-Pattern für YAML-Schema + Co-Design-Workflow.
- **Story 5.8:** Forbidden-Token-Lint-Pattern (publish-update-Skill).
- **Memory `feedback_no_lebenswert`:** Stigma-Lock.
- **Memory `project_compare_editorial_profiles`:** keine wertenden Pfeile/Farben.

## Acceptance Criteria

**AC-1 (Template-YAML-Bibliothek):**

**Given** Aggregat-Daten (Kiez-Score + Wahl + Wohnlage + Lärm + Soziale-Lage)
**When** ich `src/lib/data/cross-layer-templates/wahl/`-YAML-Files mit 5-10 Templates anlege wie:
```
- id: wahl-wohnlage-laerm
  applicableTo: [bezirk, kiez]
  requires: [wahl_aggregat_kiez, wohnlagen-2024, laerm-2023]
  body_de: |
    Im {kiez_name} kam {top_partei} bei der {wahl_jahr} {wahl_typ}-Wahl auf {top_anteil}%.
    Mietspiegel-Wohnlage hier: {wohnlage_label}.
    Lärm-Stufe: {laerm_label}.
```
**Then** Template-Bibliothek deckt 5-10 Cross-Layer-Story-Patterns ab

**AC-2 (Stigma-Lint):**

**Given** Memory `feedback_no_lebenswert` + Forbidden-Token-Pattern aus Story 5.8
**When** Template-Validator läuft
**Then** Forbidden-Tokens (Hochburg, rote/blaue Bezirke, dominiert von, Lebenswert, Wahl-Sieger) werden geblockt
**And** Template-Parse-Test failed bei Verstoß

**AC-3 (Renderer):**

**Given** Templates + Aggregat-Daten
**When** Bezirks-Page (Story 2.3) oder Kiez-Page (Story 2.4) gerendert wird
**Then** `cross-layer-story-block.svelte` rendert kontextspezifisches Template + Quellen-Attribution
**And** Phase-1 DE-only

**AC-4 (Co-Design-Review-Gate):**

**Given** Editorial-Verantwortung
**When** neue Templates added werden
**Then** Pflicht-Review vor Roll-out auf 143 Kieze (analog FAQ Story 2.5b Co-Design)
**And** Review-Checkliste in `docs/cross-layer-templates-style-guide.md`

**AC-5 (Tests):**

- Template-Schema-Parser-Tests
- Renderer-Substitution-Tests
- Stigma-Lint-Tests (Forbidden-Tokens)
- Real-Render-Test gegen 3 Bezirke + 5 Kieze

## Tasks/Subtasks

- [ ] T1: `src/lib/data/cross-layer-templates/wahl/`-YAML-Files (5-10 Templates initial)
- [ ] T2: Template-Schema (Valibot) + Loader
- [ ] T3: Renderer-Pure-Function + Quellen-Attribution-Builder
- [ ] T4: `cross-layer-story-block.svelte` Komponente
- [ ] T5: Stigma-Lint via Forbidden-Token-Liste
- [ ] T6: `docs/cross-layer-templates-style-guide.md`
- [ ] T7: Wiring in Bezirks-/Kiez-Page-Server-Load
- [ ] T8: Tests + Co-Design-Review-Sign-off-Workflow
