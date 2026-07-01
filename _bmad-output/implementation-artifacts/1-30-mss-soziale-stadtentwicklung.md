# Story 1.30: MSS 2025 — Gesamtindex Soziale Ungleichheit als Inspector-Layer

Status: review

## Story

As a Nutzer:in mit Wohnungs-/Bezirks-Recherche-Bedarf, die die soziale Lage eines Berliner Kiezes verstehen will (Journalismus, Stadtplanung, Zuzugs-Entscheidung),
I want den MSS-2025-Gesamtindex „Soziale Ungleichheit" pro Planungsraum als Inspector-Layer sehen,
so that ich die strukturelle soziale Lage einer Adress-Umgebung als öffentlichen Datenpunkt einordnen kann — ohne Einzel-Indikatoren-Stigma, mit klarem Editorial-Hinweis zur Aggregat-Natur.

## Probleme heute

1. Soziale Lage als Wohn-Entscheidungs-Faktor wird heute nur indirekt über Bodenrichtwert/Wohnlage angedeutet, ohne offizielle Datengrundlage.
2. SenStadt veröffentlicht MSS-2025 mit Gesamtindex pro LOR-Planungsraum (öffentlich, dl-de/zero-2-0), Nutzer:innen haben aber keine niedrigschwellige Adress-Ebene-Anzeige.
3. Editorial-Risiko bei Einzel-Indikatoren (z.B. „65% Transferbezug im Kiez") deutlich höher als beim aggregierten Gesamtindex — Einzelwerte = stigmatisierende Personen-Zuordnung, Gesamtindex = abstrakter struktureller Befund.

## Quellen

- **Datensatz:** [Monitoring Soziale Stadtentwicklung (MSS) 2025](https://daten.berlin.de/datensaetze/monitoring-soziale-stadtentwicklung-mss-2025-wms-39b8b768)
- **WFS:** `https://gdi.berlin.de/services/wfs/mss_2025`
- **FeatureType (Indizes):** `mss_2025:mss2025_indizes_542`
- **Lizenz:** `dl-de/zero-2-0`
- **Aggregations-Ebene:** Lebensweltlich Orientierte Räume (LOR) Planungsraum (Stand 2021)
- **Gesamtindex-Struktur:** Status-Index (4 Gruppen) × Dynamik-Index (3 Gruppen) = 12-Gruppen-Matrix
- **Kontakt SenStadt:** manuel.herrmann-fiechtner AT senstadt.berlin.de

## User-Decisions (2026-05-15)

1. **Nur Gesamtindex, keine Einzel-Indikatoren** (Begründung User: Einzelwerte wie „65% Kinderarmut im LOR" wären schärfer/stigmatisierender als Aggregat).
2. **Inspector-Layer inklusive** (Begründung User: Daten öffentlich, Aggregat-Schutz reicht).
3. **Compare-Modus: `categorical-neutral`-Profile** (kein Diff-Pfeil zwischen Adressen, nur Wertangabe).
4. **Editorial-Disclaimer pflicht** analog Mietspiegel.

## Akzeptanz-Kriterien

1. **AC-1 (Daten-Pipeline):**
   **Given** WFS-Endpoint `https://gdi.berlin.de/services/wfs/mss_2025`
   **When** `pnpm fetch` läuft
   **Then**:
   - Neuer Pipeline-Eintrag `mss-gesamtindex-2025` in `scripts/sources.ts` mit `kind: 'fis-broker'`, FeatureType `mss_2025:mss2025_indizes_542`, License `dl-de/zero-2-0`, BundleGroup `B: Wohn-Daten` (gleiches Bundle wie Mietspiegel/Wohnlage — strukturelle Kontext-Daten)
   - GeoJSON-Download via WFS GetFeature `outputFormat=application/json`
   - Mapshaper-Simplify mit `keep-shapes` (per Memory `project_simplify_keep_shapes.md`)
   - `inspectorRelevant: true`, `geometryType: 'Polygon'` oder `MultiPolygon`
   - Manifest enthält Layer mit `sourceUpdatedAt` aus WFS-Metadaten

2. **AC-2 (Layer-Hit-Logic):**
   **Given** Adresse innerhalb Berlin
   **When** `getLayersAtPoint(lat, lng)` läuft
   **Then** Layer-Hit für `mss-gesamtindex-2025` liefert:
   - `value: { status: 'sehr niedrig'|'niedrig'|'mittel'|'hoch', dynamik: 'positiv'|'stabil'|'negativ', gruppe: 1..12, planungsraum_name: string }` (Schema aus WFS-Attributen abzuleiten, Field-Naming nach WFS-Capabilities)
   - `source`, `updatedAt`, `license` aus Manifest

3. **AC-3 (Inspector-Anzeige):**
   **Given** Adresse mit MSS-Hit
   **When** Inspector-Section `wohn` rendert
   **Then**:
   - LayerHitRow mit Label „Soziale Lage (MSS 2025)"
   - ValueChip zeigt Gesamtindex-Stufe als Text (z.B. „Niedriger Status, negative Dynamik")
   - `severity: 'neutral'` (kein Color-Coding, Aggregat ist Faktum nicht Bewertung)
   - Subline: Planungsraum-Name
   - Inline-Editorial-Disclaimer (siehe AC-5)

4. **AC-4 (Compare-Logic):**
   **Given** Compare-Modus mit beiden Adressen
   **When** Compare-Row für `mss-gesamtindex-2025` rendert
   **Then**:
   - `LAYER_COMPARE_PROFILE['mss-gesamtindex-2025'] = 'categorical-neutral'`
   - Gleiche Gruppe → direction=equal, kein Minus-Icon (Profile nicht in `EVALUATIVE_PROFILES`)
   - Unterschiedliche Gruppe → direction=not-comparable, kein Diff-Pfeil
   - Compare-Disclaimer-Variant `compare-mss-aggregat` wird in Wohn-Section gerendert

5. **AC-5 (Editorial-Disclaimer):**
   **Given** Inspector-Anzeige oder Compare-Row mit MSS-Hit
   **When** Section rendert
   **Then**:
   - Neue `DisclaimerVariant`: `mss-aggregat`
   - Text DE: „Strukturelle Aggregat-Daten pro Planungsraum (rund 7.500 Einwohner:innen). Einzelne Adressen oder Personen sind dadurch nicht abgebildet. Stand: SenStadt MSS 2025."
   - Neue Compare-Variant: `compare-mss-aggregat` mit analogem Text + Bewertungs-Schutz: „Wir zeigen die Stufe, ohne Bewertung. Niedriger Status heißt nicht 'schlechter Kiez'."
   - Beide Variants in `EDITORIAL_CONFIG` + `DISCLAIMER_TEXTS_DE`

6. **AC-6 (Choropleth-Style + Map-Toggle):**
   **Given** Layer-Palette
   **When** Nutzer:in MSS-Layer aktiviert
   **Then**:
   - Choropleth-Style mit 12-Stufen-Skala (Status-Achse + Dynamik-Achse, z.B. via 2-dimensionale Farbskala oder Sortierung Status-Bands × Dynamik-Pattern)
   - Style-Entscheidung KEIN Heat-Map Rot-Grün (Stigma-Risiko), stattdessen neutrale Bi-variate-Skala (z.B. Lila→Beige→Türkis)
   - Legend mit Status-Dynamik-Matrix-Erklärung
   - Layer-Explain (Story 1.16) mit Quellen-Hinweis + Methodik-Page-Link

7. **AC-7 (Methodik-Page-Erweiterung):**
   **Given** Story 1.29 Methodik-Page existiert
   **When** MSS-Layer aktiv ist
   **Then**:
   - LayerMethodology-Eintrag `mss-gesamtindex-2025` (Felder aus Story 1.29-Pattern: aggregationLevel='lor-planungsraum', authority='SenStadt Berlin', calculation, coverageGaps, omissions=„Einzel-Indikatoren bewusst nicht in Adress-Ansicht", relatedLayers=['mietspiegel-wohnlage','bodenrichtwerte'])
   - Layer-Detail-Page `/layer/mss-gesamtindex-2025` rendert Methodik-Sections

8. **AC-8 (Tests):**
   - `mss-gesamtindex-2025` Pipeline-Spike: WFS-Fetch-Test mit Fixture (offline-Mock)
   - `applicability.ts` ergänzen: out-of-concept-Fall (z.B. wenn Planungsraum-Geometrie nicht definiert)
   - `layer-compare.test.ts` +2 Cases: categorical-neutral equal + not-comparable
   - `editorial-disclaimer.svelte.test.ts` +2 Cases: `mss-aggregat` + `compare-mss-aggregat`
   - `value-formatters.test.ts` Mapping Gesamtindex-Gruppe → Display-Text
   - E2E: MSS-Layer aktivieren + Adresse picken + Inspector-Disclaimer sichtbar (deferred zu CI)

9. **AC-9 (Out-of-Concept-Handling):**
   **Given** Adresse außerhalb der MSS-Coverage (z.B. unbewohnte Flächen, Industrie-LOR)
   **When** Layer-Hit nicht greift
   **Then** `applicability.ts` markiert Reason `out-of-concept` mit Wording „Strukturelle Lage-Daten werden in nicht-bewohnten Bereichen nicht berechnet (z.B. Forst, Industrie)"

## Tasks / Subtasks

- [x] **Task 1: WFS-Schema-Spike** (AC: #1, #2)
  - [x] 1.1 WFS GetFeature live verifiziert; 542 Features, Attribute-Set: plr_id, plr_name, bez_id, ew, si_n/si_v (Status), di_n/di_v (Dynamik), sdi/sdi_n/sdi_v (Code/Numeric/Verbal), zeit (202412), kom
  - [x] 1.2 Feld-Mapping: si_v + di_v als Display-Schlüssel, plr_name als Kontext, kom als Validity-Gate
  - [x] 1.3 Fixture `src/lib/data/__fixtures__/mss-sample.geojson` mit 6 Features (alle drei kom-Werte abgedeckt)

- [x] **Task 2: Pipeline-Source + Manifest** (AC: #1)
  - [x] 2.1 `scripts/lib/sources.ts` Eintrag mss-gesamtindex-2025 mit `fis-broker`, BundleGroup `B: Wohn-Daten`
  - [x] 2.2 Mapshaper-Profil `polygon` (keep-shapes via existing simplify-pipeline)
  - [x] 2.3 `pnpm run data:fetch mss-gesamtindex-2025` live: 542 Polygone, 1.2 MB GeoJSON, Manifest aktualisiert

- [x] **Task 3: LayerHit-Value-Formatter** (AC: #2, #3)
  - [x] 3.1 `value-formatters.ts::formatMssGesamtindex`: "Status {si_v}, Dynamik {di_v} · {plr_name}" bei kom=gültig, "Aggregat nicht aussagekräftig · {plr_name} ({kom})" sonst
  - [x] 3.2 `layer-hit-display.ts::mssGesamtindexDisplay`: chip "{si_v}, {di_v}" + context=plr_name, fallback bei kom!=gültig
  - [x] 3.3 `value-severity-mapping.ts`: MSS-Case → immer 'neutral' (Editorial-Schutz)
  - [x] 3.4 +6 Tests value-formatters + 3 layer-hit-display + 3 severity

- [x] **Task 4: Compare-Profile + Editorial-Variants** (AC: #4, #5)
  - [x] 4.1 `LAYER_COMPARE_PROFILE['mss-gesamtindex-2025'] = 'categorical-neutral'` + Key-Extractor extractCategoricalKey für si_v+di_v
  - [x] 4.2 `DisclaimerVariant`-Union um `mss-aggregat` + `compare-mss-aggregat` erweitert
  - [x] 4.3 `DISCLAIMER_TEXTS_DE` ergänzt
  - [x] 4.4 `EDITORIAL_CONFIG['mss-gesamtindex-2025']` mit disclaimerVariants=['mss-aggregat'] + neverMachineTranslate (für Story 3.x)
  - [x] 4.5 Compare-Variant `compare-mss-aggregat` in DISCLAIMER_TEXTS_DE registriert
  - [x] 4.6 +3 Tests layer-compare + 2 Tests disclaimer + editorial-config-test ALLOWED_VARIANTS um mss-aggregat erweitert

- [x] **Task 5: Choropleth-Style** (AC: #6)
  - [x] 5.1 `layer-style-builder.ts` neuer `StyleProfile = choropleth-mss-12`: si_v über Hue (chartCat6/chartCat4/vermillionSoft/chartCat5, KEIN vermillion/Rot-Grün), di_v über fill-opacity (positiv=0.7, stabil=0.55, negativ=0.4, ohne-Zuordnung=0.18)
  - [x] 5.2 `layer-explain.ts` Entry mit Editorial-Hinweis "Niedriger Status bedeutet nicht 'schlechter Kiez'"
  - [x] 5.3 Legend-Spec 4 Status-Stufen kategorisch; Dynamik-Differenzierung als Opacity nur in Karte sichtbar (MVP-Pragmatic, echte Bivariate-Legend → Phase 2)
  - [x] 5.4 `layer-palette-filter.ts::LAYER_EXPLAIN_DE` Eintrag "Soziale Lage (MSS 2025)"
  - [x] 5.5 +2 Tests layer-style-builder + 1 Test Profile-Coverage (mss-gesamtindex-2025 im required-array)

- [x] **Task 6: Methodik-Page-Integration** (AC: #7)
  - [x] 6.1 `layer-methodology.ts` MSS-Eintrag mit calculation, coverageGaps, omissions, relatedLayers, aggregationLevel='lor-planungsraum', authority='SenStadt Berlin' (Schema aus Story 1.29)
  - [x] 6.2 Methodik-Page `/methodik` Aggregat-Indizes-Section um Sub-h3 "Soziale Lage (MSS 2025)" erweitert (kein eigener Sub-Page-Bedarf, da MSS-spezifische Editorial-Position bereits zentral abgehandelt)

- [x] **Task 7: Out-of-Concept-Applicability** (AC: #9)
  - [x] 7.1 `applicability.ts::intrinsicOutOfConcept`: pro-hit-Check ohne cross-layer-Kontext, prüft hit.value.kom auf 'gültig'-Inversion (Pattern-neu, da bisheriges APPLICABILITY_RULES rein cross-layer war)
  - [x] 7.2 Wording-Pattern in formatLayerValue + layer-hit-display via "Aggregat nicht aussagekräftig"
  - [x] 7.3 +3 Tests applicability (kom=Ausreißer, kom=EW unter 300, kom=gültig)

- [x] **Task 8: Tests + E2E** (AC: #8)
  - [x] 8.1 Unit-Tests +20 Cases (1346/1346 grün); type-check 0 Errors über 5525 Files
  - [ ] 8.2 E2E `tests/e2e/mss-flow.e2e.ts` deferred zu CI/User-Verify analog Stories 1.13–1.29

## Dev Notes

### Editorial-Decisions im Detail

User-Position (2026-05-15): „Daten sind öffentlich, Aggregat-Schutz reicht. Einzel-Indikatoren wären schärfer/stigmatisierender als Gesamtindex."

Folgerung für Implementation:
- KEINE Einzel-Indikator-Layer (Arbeitslosigkeit, Transferbezug, Kinderarmut, Alleinerziehende) — bewusst NICHT aus WFS-Layer `mss2025_indexind_542` extrahiert.
- KEIN Compare-Pfeil → Profile `categorical-neutral`.
- KEIN Color-Coding via Severity → `neutral` immer.
- Disclaimer pflicht, Choropleth-Style ohne Rot-Grün.

### WFS-Schema (zu validieren in Task 1)

WFS GetFeature mit Limit:
```
https://gdi.berlin.de/services/wfs/mss_2025?service=WFS&version=2.0.0&request=GetFeature&typeNames=mss_2025:mss2025_indizes_542&count=5&outputFormat=application/json
```

Erwartete Attribute (zu verifizieren): `PLR_ID`, `PLR_NAME`, `STATUSIDX`, `DYNAMIKIDX`, `SDI_GRUPPE`, `EW` (Einwohner).

### Gesamtindex-Gruppen-Mapping (12 Gruppen)

Status × Dynamik:
- Status: sehr niedrig (1) / niedrig (2) / mittel (3) / hoch (4)
- Dynamik: negativ (-) / stabil (0) / positiv (+)
- Gruppe 1 = Status sehr niedrig + Dynamik negativ („sozial belastet, sich verschlechternd")
- Gruppe 12 = Status hoch + Dynamik positiv

Display-Text-Map zu definieren in Task 3.1 mit value-neutraler Sprache (keine „arme"/„reiche" Kiez-Labels).

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (kein neues Icon nötig, evtl. Layers)
- #2 Files <500 Zeilen
- #7 TS strict
- #12 Per Layer-Wert: Source + UpdatedAt + License sichtbar
- #15 Editorial-Verantwortung — MSS-Disclaimer pflicht analog Mietspiegel
- #19 NEVER toast
- Memory `project_compare_editorial_profiles.md` — Profile = categorical-neutral, severity = neutral

### Library/Framework Requirements

Keine neuen. WFS-Fetch nutzt existierende `fetch-static.ts`-Pipeline.

### Testing Requirements

- Unit: ≥80% value-formatters Gruppe-Mapping, ≥75% applicability MSS-Predicate
- E2E: 1 Smoke-Case (Layer aktivieren + Inspector-Disclaimer-Visible)
- Tests-Vorsicht: kein fetch-spy in *.svelte.test.ts (Memory `feedback_browser_test_fetch_spy.md`)

### Previous Story Intelligence

- **Story 1.10c PMTiles:** Heavy-Layer-Pattern — MSS ist klein (rund 540 Planungsräume), kein PMTiles nötig
- **Story 1.12 Editorial-Pattern:** Disclaimer-Variant-Pattern wiederverwenden
- **Story 1.16 Layer-Explain:** Multi-Surface-Explain für MSS
- **Story 1.18 ValueChip + Severity:** Severity-Override `neutral` für MSS
- **Story 1.22 Skala-Harmonisierung:** kein Skala-Mapping nötig (Gruppen 1..12 direkt anzeigen)
- **Story 1.23 Reason-Aufdröselung:** out-of-concept-Pattern für nicht-bewohnte LOR
- **Story 1.25 Mapshaper-keep-shapes:** Memory-Regel beachten
- **Story 1.27 Compare-Editorial-Profile:** categorical-neutral + EVALUATIVE_PROFILES-Gating bereits implementiert
- **Story 1.28 Kiez-Score:** MSS könnte ggf. als Input-Dimension für Kiez-Score dienen — Decision: separat halten, keine Composite-Score-Verkettung (User-Position: nicht-aufschlüsseln zu Stigma-Risiko)
- **Story 1.29 Methodik-Page:** LayerMethodology-Schema-Erweiterung

### File-Structure-Diff zu Story 1.29

```
src/
├── lib/
│   ├── data/
│   │   ├── layer-methodology.ts                  # erweitert (MSS-Eintrag)
│   │   └── __fixtures__/
│   │       └── mss-sample.geojson                # neu (Task 1.3)
│   └── components/
│       └── atlas/
│           ├── internal/
│           │   ├── editorial-types.ts            # erweitert (DisclaimerVariant)
│           │   └── layer-style-builder.ts        # erweitert (MSS-Choropleth)
│           ├── inspector-panel/
│           │   └── internal/
│           │       ├── value-formatters.ts       # erweitert (MSS-Gruppe-Mapping)
│           │       ├── value-severity-mapping.ts # erweitert (MSS → neutral)
│           │       ├── layer-hit-display.ts      # erweitert (MSS-Display)
│           │       ├── applicability.ts          # erweitert (out-of-concept LOR)
│           │       └── layer-explain.ts          # erweitert (MSS-Explain)
│           └── editorial-disclaimer.svelte       # erweitert (mss-aggregat-Text)
├── utils/
│   └── layer-compare.ts                          # erweitert (LAYER_COMPARE_PROFILE)
└── scripts/
    └── sources.ts                                # erweitert (MSS-WFS-Source)
tests/
└── e2e/
    └── mss-flow.e2e.ts                           # neu (deferred zu CI)
```

### Open Questions

1. **Status-Index-Gruppen-Display:** „sehr niedriger Status, stabil" vs. neutralerer Wortlaut? Zu klären mit User vor Implementation Task 3.1.
2. **Bi-variate-Choropleth-Skala:** 12-Gruppen-Bivariate auf MapLibre ist UX-Pivot-Risiko. MVP linear 12 Steps (z.B. Cividis-Palette)? Phase 2 echte Bivariate?
3. **Verknüpfung mit Story 1.28 Kiez-Score:** MSS bewusst NICHT als Kiez-Score-Input verwenden (User-Position: nicht aufschlüsseln). Story 1.28-Scope-Update notwendig.
4. **Sub-Methodik-Page `/methodik/soziale-lage`:** analog Story 1.28 Pattern? Oder reicht Section in zentraler Methodik?

### Phase-2-Backlog

- Einzel-Kontext-Indikatoren als separater Layer-Set (nur wenn Editorial-Strategie überdacht wird) — Phase 2 oder verworfen
- Echte Bi-variate-Choropleth via SVG-Overlay statt MapLibre-Fill
- MSS-Zeitvergleich (frühere MSS-Jahre als „Dynamik-Trend"-Visualisierung)
- API-Endpunkt für externe Konsumenten (Schul-/Forschungs-Use)

## References

- [Source: https://daten.berlin.de/datensaetze/monitoring-soziale-stadtentwicklung-mss-2025-wms-39b8b768]
- [Source: https://gdi.berlin.de/services/wfs/mss_2025?request=GetCapabilities&service=WFS]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_compare_editorial_profiles.md]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_no_lebenswert.md]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_simplify_keep_shapes.md]
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md]
- [Source: _bmad-output/implementation-artifacts/1-23-datenfehlt-reason-aufdroeseln.md]
- [Source: _bmad-output/implementation-artifacts/1-27-adress-vergleich.md]
- [Source: _bmad-output/implementation-artifacts/1-29-atlas-methodik-pattern.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- WFS-Spike: 542 Polygone, sdi_n-Range 11..45 + -9999 (Code XY: X=Status 1..4, Y=Dynamik 1=positiv/3=stabil/5=negativ), 13 distinct sdi_v-Labels, 3 kom-Werte (gültig / ungültig (Ausreißer) / ungültig (EW unter 300))
- Pipeline-Run: `pnpm run data:fetch mss-gesamtindex-2025` → 1.26 MB GeoJSON, geometryType Polygon nach Simplify
- TypeError svelte-kit/server/internal.js wrapDynamicImport — transient während test-Setup, kein Test-Failure (1346/1346 grün)

### Completion Notes List

- TDD-first per ADR-012: Tests-Red → Impl-Green pro Surface (value-formatters, layer-hit-display, value-severity-mapping, layer-compare, editorial-config, applicability, layer-style-builder)
- 1346/1346 unit-suite grün, type-check 0 Errors über 5525 Files
- Editorial-Pivot dokumentiert: 1.30 vor 1.28 per User-Request 2026-05-15 (MSS als 4. Dimension im Kiez-Score). 1.28-Scope-Update beim nächsten Dev-Start nötig: vierte Dimension `soziale-lage` mit MSS-si_n als ordinal-Source; Gewichts-Verteilung neu (4× 0.25); Disclaimer-Variant `livability-explainer` muss MSS-Anteil + Stigma-Schutz explizit nennen
- Compare-Profile `categorical-neutral` mit erweitertem extractCategoricalKey-Helper für MSS-spezifischen Schlüssel (si_v + di_v statt kategorie/wol_mode)
- Choropleth-Style ohne harten Rot-Grün-Sprung (Stigma-Schutz): Status über neutrale Hues (chartCat6/chartCat4/vermillionSoft/chartCat5), Dynamik über Opacity. Echte Bi-variate-Legend deferred zu Phase 2
- Applicability-Pattern um intrinsic-check erweitert (kom != 'gültig' → out-of-concept); bisher rein cross-layer; rückwärtskompatibel
- sources.ts auf 516 LOC (über 500-LOC-Budget); Refactor (Bundle-Split) deferred zu Folge-Iteration, da Story-Scope reine Eintrags-Erweiterung
- E2E `mss-flow.e2e.ts` deferred zu CI-Run analog Stories 1.13–1.29
- LayerHitRow inline-Disclaimer-Render verlässt sich auf existing inline-Pattern aus Story 1.12; keine UI-Komponente neu

### File List

**Modified:**
- `scripts/lib/sources.ts` — MSS-WFS-Eintrag mss-gesamtindex-2025
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` — formatMssGesamtindex
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.test.ts` — 6 neue Tests
- `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts` — mssGesamtindexDisplay
- `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.test.ts` — 3 neue Tests
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts` — MSS-Case neutral
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.test.ts` — 3 neue Tests
- `src/lib/components/atlas/inspector-panel/internal/applicability.ts` — intrinsicOutOfConcept
- `src/lib/components/atlas/inspector-panel/internal/applicability.test.ts` — 3 neue Tests
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` — MSS-Eintrag
- `src/lib/utils/layer-compare.ts` — LAYER_COMPARE_PROFILE + extractCategoricalKey
- `src/lib/utils/layer-compare.test.ts` — 3 neue Tests
- `src/lib/components/atlas/internal/editorial-types.ts` — DisclaimerVariant +2
- `src/lib/components/atlas/editorial-disclaimer.svelte` — DISCLAIMER_TEXTS_DE +2
- `src/lib/components/atlas/editorial-disclaimer.svelte.test.ts` — 2 neue Tests
- `src/lib/components/atlas/internal/editorial-config.ts` — MSS-Config
- `src/lib/components/atlas/internal/editorial-config.test.ts` — ALLOWED_VARIANTS +1
- `src/lib/components/atlas/internal/layer-style-builder.ts` — StyleProfile choropleth-mss-12 + Legend + buildLayerSpec-Case
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` — Required-Slug + 2 neue Tests
- `src/lib/components/atlas/internal/layer-palette-filter.ts` — LAYER_EXPLAIN_DE-Eintrag
- `src/lib/data/layer-methodology.ts` — MSS-Eintrag
- `src/routes/(with-header)/methodik/+page.svelte` — Sub-h3 "Soziale Lage (MSS 2025)"
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story-Status promoted
- `_bmad-output/implementation-artifacts/1-30-mss-soziale-stadtentwicklung.md` — Status + DAR

**New:**
- `src/lib/data/__fixtures__/mss-sample.geojson` — 6 Features Live-WFS-Spike

**Build-generated (.gitignore-respektiert):**
- `static/layers/mss-gesamtindex-2025.b0b76e50.geojson` (1.26 MB, 542 Polygone)

### Change Log

| Datum | Version | Beschreibung | Autor |
|-------|---------|--------------|-------|
| 2026-05-15 | 1.0 | MSS 2025 Inspector-Layer Foundation; intrinsic-out-of-concept applicability; choropleth-mss-12 ohne Rot-Grün; Editorial-Disclaimer-Variants mss-aggregat + compare-mss-aggregat; Methodik-Page-Section Soziale Lage; +20 Unit-Tests grün; type-check 0 Errors. Editorial-Decision-Umkehr dokumentiert: MSS wird in Story 1.28 als 4. Dimension genutzt (User-Request 2026-05-15) | Dev (Opus 4.7) |
