# Story 1.28: „Wo lebt es sich gut?" · Kiez-Score (Cross-Layer-Score MVP)

Status: review

> **Spec-Refresh 2026-05-15:** Pivot per User-Lock auf Naming `Kiez-Score` (LOR) + `Bezirks-Score` (12 Bezirke) und Aufnahme der vierten Dimension `soziale-lage` aus dem MSS-Gesamtindex 2025. Quelle: Memory-Entries `project_kiez_score_naming.md` und `project_mss_kiez_score_input.md`. Begriff „Lebenswert" bleibt hart-verboten (Memory `feedback_no_lebenswert.md`).

## Story

As a Nutzer:in, die Berliner Lagen datengestützt verstehen will (Zuzug, Umzug, Recherche),
I want pro LOR-Planungsraum (build-time) und pro Adresse (runtime) einen erklärbaren, transparenten Cross-Layer-Score in vier Dimensionen (Ruhe-Luft, Grün, Mobilität, Soziale Lage) sehen,
so that ich verschiedene Lagen Berlins schnell einordnen kann, ohne mich in Einzel-Layer-Detail-Werten zu verlieren, und gleichzeitig die Methodik zurückverfolgen kann.

## Probleme heute

1. 35+ Layer im Inspector erzeugen Information-Overload. User:in mit „Wo soll ich wohnen?"-Frage sucht aggregierten Überblick.
2. Bezirks-/Kiez-SEO-Pages (Story 2.3/2.4) brauchen vergleichbare Datenpunkte für Discoverability („Friedrichshain vs Wedding").
3. Single-Number-„Lebensqualitäts-Scores" anderer Anbieter sind intransparent, oft kommerziell verzerrt (Immobilien-Marketing), reproduzieren soziale Stigmata.
4. Editorial-Verantwortung (FR50/51): naive Aggregate würden „schlechte Kieze"-Heatmaps erzeugen.

## Voraussetzung

**Story 1.29 (Atlas-Methodik-Pattern)** liefert die Foundation:
- `LayerMethodology`-Datenmodul mit Schema (`calculation`, `coverageGaps`, `omissions`, `relatedLayers`, `aggregationLevel`, `updateFrequency`, `authority`)
- Layer-Detail-Page-Pflicht-Sections (Wie berechnet, Coverage-Lücken, Was nicht enthalten, Verwandte Layer, Atlas-Methodik-Link)
- Zentrale `/methodik`-Page

**Story 1.30 (MSS Soziale Stadtentwicklung)** liefert den `mss-gesamtindex-2025`-Layer als Soziale-Lage-Input für die 4. Dimension.

Story 1.28 implementiert für die vier Kiez-Score-Layer den Atlas-Methodik-Pattern + dedizierte Sub-Methodik-Page `/methodik/kiez-score`.

## Akzeptanz-Kriterien

1. **AC-1 (Score-Datenstruktur):**
   **Given** vier Dimensionen
   **When** Score berechnet wird
   **Then**:
   ```ts
   export type KiezScoreDimension = 'ruhe-luft' | 'gruen' | 'mobilitaet' | 'soziale-lage';

   export interface DimensionScore {
     dimension: KiezScoreDimension;
     value: number | null;               // 0-100, normalisiert; null falls keine Coverage
     sources: Array<{
       layer: string;
       rawValue: unknown;
       normalizedValue: number | null;   // 0-100
       weight: number;                   // 0-1 innerhalb Dimension
     }>;
     missingData: string[];               // Layer-Slugs ohne Coverage
     dataStand: string | null;            // jüngstes sourceUpdatedAt unter sources
   }

   export interface KiezScore {
     persona: 'allgemein';                // MVP: nur Default
     dimensions: DimensionScore[];
     overall?: number;                    // optional aggregiert; MVP NICHT ausgeliefert
     missingDimensions: KiezScoreDimension[];  // wenn Dimension ohne jegliche Daten
   }
   ```
   **And** MVP NUR Default-Persona „allgemein" (gleichmäßige Gewichtung 4× 0.25 der vier Dimensionen)
   **And** MVP KEIN Composite-Single-Score auf der Karte (Entscheidung wegen Stigmatisierungs-Risiko, siehe Open Questions #1)

2. **AC-2 (Layer-Mapping pro Dimension):**
   **Given** vier Dimensionen
   **When** Score berechnet wird
   **Then** Mapping:

   **Ruhe-Luft (Gesamtgewicht 0.25, intern 1.0):**
   - `laerm-2023` (Gewicht 0.4, ordinal-3, gering=100 / mittel=50 / hoch=0)
   - `luft-2023` (Gewicht 0.4, ordinal-3, identisch invertiert)
   - `bioklima-2023` (Gewicht 0.2, ordinal-3, gering-Belastung=100)
   - **Fallback:** `umweltgerechtigkeit-2023` (Gewicht 1.0) wenn ALLE drei Roh-Layer fehlen.

   **Grün (Gesamtgewicht 0.25, intern 1.0):**
   - `gruenversorgung-2023` (Gewicht 0.6, ordinal-4 harmonisiert nach Story 1.22, gering=0 / mittel=33 / hoch=66 / sehr hoch=100)
   - `klima-kaltlufteinwirkbereich-2022` (Gewicht 0.2, presence: mit=100, ohne=0)
   - `klima-leitbahnkorridor-2022` (Gewicht 0.2, presence: mit=100, ohne=0)

   **Mobilität (Gesamtgewicht 0.25, intern 1.0):**
   - Nearest U-Bahn-Stop (Gewicht 0.35, Distanz: ≤300m=100, 600m=50, ≥1000m=0)
   - Nearest S-Bahn-Stop (Gewicht 0.25, gleiche Distanz-Skala)
   - Nearest Tram-Stop (Gewicht 0.20)
   - Nearest Bus-Stop (Gewicht 0.10)
   - `radverkehrsnetz-2025` ∪ `fahrradstrassen-2024` (Gewicht 0.10, presence im LOR-Polygon=100)

   **Soziale Lage (Gesamtgewicht 0.25, intern 1.0):**
   - `mss-gesamtindex-2025` (Gewicht 1.0, MSS-Status-Mapping `si_v`: hoch=100 / mittel=66 / niedrig=33 / sehr niedrig=0; `kom != gültig` → `null` und in `missingData`)
   - Editorial-Pflicht: categorical-neutral, KEIN harter Rot-Grün-Sprung, Disclaimer-Variant `kiez-score-explainer` muss MSS-Anteil explizit benennen (Stigma-Schutz)

   **And** Anti-Korrelations-Schutz: `umweltgerechtigkeit-2023` ist NICHT zusätzlich in Ruhe-Luft enthalten (außer als Fallback), da bereits Vor-Aggregat aus Lärm/Luft/Bioklima.

3. **AC-3 (Normalisierungs-Strategien):**
   **Given** Layer-Werte verschiedener Typen
   **When** `normalize*()` läuft
   **Then** Strategien:
   - **kategorisch-3-Stufen (gering/mittel/hoch):** 100/50/0
   - **kategorisch-4-Stufen (gering/mittel/hoch/sehr hoch):** 0/33/66/100
   - **MSS-Status-4 (sehr niedrig/niedrig/mittel/hoch):** 0/33/66/100
   - **Distance-zu-POI:** lineare Interpolation `0m=100, threshold/2=50, threshold=0`, Clamp [0, 100]
   - **Presence:** has=100 / not=0
   **And** Pure Function, deterministisch
   **And** Slug-spezifische `INVERT_FLAG` für „je höher desto schlechter"-Indikatoren (Lärm/Luft) bleibt nicht nötig, weil Ordinal-Mapping bereits invertiert.
   **And** Tests pro Strategie ≥3 Cases

4. **AC-4 (Build-Time-Score pro LOR-Planungsraum):**
   **Given** Pipeline-Script `scripts/build-kiez-scores.ts`
   **When** `pnpm build:kiez-scores` läuft
   **Then**:
   - LOR-Planungsraum-Layer wurde in Story 1.10 entfernt → Story re-introduces LOR-Planungsraum (~542 Polygone analog MSS-Coverage) als Build-Time-Input AUSSCHLIESSLICH für Score-Berechnung, NICHT als Map-Layer und NICHT als Inspector-Layer.
   - LOR-Geometrie aus `static/layers/lor-planungsraum.{hash}.geojson` geladen (Story 1.28 stellt File via Pipeline wieder her, Source-Definition in `scripts/lib/sources.ts` mit `inspectorRelevant: false`, `mapRelevant: false` — neuer Flag, siehe Task 1).
   - Pro LOR-Polygon:
     - Centroid via `@turf/centroid`
     - `getLayersAtPoint(centroid.lat, centroid.lng)` für Ruhe-Luft + Grün + Soziale-Lage
     - `nearestStopsByMode(centroid)` für Mobilität (Distanz-basiert vom Centroid)
   - Output: `static/kiez-scores/kiez-scores.json` mit Map `{ lorId → KiezScore }`
   - Output-Schema: valibot-validiert, Schema-Versionierung wie Manifest
   - Output ≤500 KB (542 Polygone × ~0.9 KB Score ≈ 480 KB)
   **And** Build-Step in `package.json`: `"build:kiez-scores": "tsx scripts/build-kiez-scores.ts"`
   **And** Pipeline-Test (Unit) verifiziert: 542 Scores generiert, alle haben mindestens eine Dimension mit Wert
   **And** Build-Step läuft nach Manifest-Build, vor SvelteKit-Build (`prepare`-Hook erweitern)

5. **AC-5 (Runtime-Score pro Adresse):**
   **Given** User-Adresse selektiert
   **When** Inspector lädt
   **Then** `getKiezScore(lat, lng, fetchFn)`:
   - Lädt `static/kiez-scores/kiez-scores.json` (cached nach erstem Load)
   - Spatial-Lookup: welcher LOR-Planungsraum enthält den Punkt? → Build-Time-Score als Baseline
   - Override Mobilität: berechne Distanzen vom EXAKTEN Adress-Punkt zu nächsten ÖPNV-Stops (genauer als LOR-Centroid)
   - Override `gruenversorgung` falls Adresse außerhalb LOR-Centroid-Polygon-Mittelpunkt-Tendenz (Phase 2; MVP nutzt LOR-Baseline)
   - Resultat: `KiezScore` mit `persona='allgemein'`
   **And** Pure Function, deterministisch
   **And** Result-Cache analog `getLayersAtPoint` (Story 1.4)
   **And** SSR-Safe: kein `localStorage`, kein `window`

6. **AC-6 (Inspector-Section „Kiez-Score"):**
   **Given** Score verfügbar für Adresse
   **When** Inspector rendert
   **Then** neue Section oben (vor existierenden Sections, falls Score-Flag aktiv):
   - Section-Header „Kiez-Score" (Plex-Mono uppercase, Story 1.18-Pattern)
   - Pro Dimension eine Row:
     - Dimension-Name (Plex-Sans Medium): „Ruhe & Luft", „Grün", „Mobilität", „Soziale Lage"
     - Visualisierung: 4-Punkte-Skala (`gering`/`mittel`/`hoch`/`sehr hoch`) basierend auf `value` 0-100:
       - 0-25 → gering (severity-warning)
       - 26-50 → mittel (severity-neutral)
       - 51-75 → hoch (severity-success-soft)
       - 76-100 → sehr hoch (severity-success)
     - **Ausnahme Soziale Lage:** ValueChip-Severity hart auf `neutral` (Memory `project_compare_editorial_profiles.md` + MSS-Editorial). Stufen-Labels bleiben, aber KEINE positive/negative Färbung.
     - ValueChip mit Severity-Token + Plex-Mono-Subtext (Stufe)
     - Expand-Toggle „Quellen anzeigen" → zeigt Source-Layer-Liste mit Roh-Wert + Normalisierter Wert (Transparenz-Anforderung)
   - Sub-Section „Methodik" Link auf `/methodik/kiez-score` (Sub-Page der Atlas-Methodik aus Story 1.29) mit:
     - Dimensions-Definition + Gewichts-Tabelle + Normalisierungs-Strategie
     - Editorial-Disclaimer (insb. zur Sozialen Lage / MSS)
     - Was MVP NICHT enthält (Bezahlbarkeit, Familie, Composite-Score) + Begründung
     - Cross-Link auf zentrale Atlas-Methodik-Page `/methodik`
     - Verweise auf Roh-Layer-Detail-Pages der vier Dimensionen
   - Falls Dimension fehlt (`missingDimensions` enthält sie): Row „Daten unzureichend" + `LayerHitReason`-Pattern aus Story 1.23
   **And** Editorial-Inline-Disclaimer pro Section, neue Variant `kiez-score-explainer`:
     „Kiez-Score aggregiert vier Dimensionen pro LOR-Planungsraum. Die Dimension Soziale Lage spiegelt strukturelle MSS-Daten der Senatsverwaltung, keine Wohnqualität. Bezahlbarkeit und Familienfreundlichkeit absichtlich NICHT enthalten."
   **And** Section-Feature-Flag `featureFlags.kiezScore: true` (initial false; in dieser Story auf true)
   **And** Erfüllt FR40 (Source + UpdatedAt pro Indikator), UX-DR5 (Choropleth-Regeln nicht relevant; UI ist Inspector-Row)

7. **AC-7 (Karten-Visualisierung als optionaler Layer):**
   **Given** Build-Time-Scores pro LOR
   **When** User aktiviert in LayerPalette einen der Kiez-Score-Layer
   **Then** vier separate Karten-Layer optional auswählbar (KEIN Composite-Score-Layer auf Karte):
   - `kiez-score-ruhe-luft` (Choropleth nach DimensionScore.value, Ordinal-4)
   - `kiez-score-gruen` (gleiches Schema)
   - `kiez-score-mobilitaet` (gleiches Schema)
   - `kiez-score-soziale-lage` (Choropleth-Profile `choropleth-mss-12`-kompatibel, kein Rot-Grün)
   **And** Layer-Style-Profile `choropleth-ordinal-4` (severity-tokens-konsistent mit Inspector-ValueChip-Farben für die ersten drei Dimensionen). Soziale-Lage nutzt das bestehende MSS-Profile-Pattern (neutrale Hue-Stufen).
   **And** Editorial-Disclaimer im LayerExplain (Story 1.16): „Aggregierte Lagen-Bewertung auf LOR-Ebene. Einzelne Adressen können stark abweichen."
   **And** Hard-Constraint: KEIN einzelner Composite-Score-Layer auf Karte (Stigmatisierungs-Schutz)
   **And** Bundle `G: Kiez-Score` enthält die 4 Layer.

8. **AC-8 (LLM-Markdown-Export erweitert):**
   **Given** Story 1.20 LLM-Export
   **When** `buildLlmExportMarkdown(state, manifest, ...)` läuft mit `ui.kiezScore` vorhanden
   **Then** zusätzliche Section „Kiez-Score" im Markdown mit:
   - Pro Dimension: Wert + Skala-Stufe + Quell-Layer-Liste + Normalisierungs-Hinweis
   - Methodik-Disclaimer kompakt als Footer-Hinweis (inkl. MSS-Stigma-Schutz)
   - Link auf Methodik-Page `/methodik/kiez-score`

9. **AC-9 (Phase-1-Scope-Schnitte):**
   AUSDRÜCKLICH NICHT enthalten:
   - Persona-Switcher (Familie/Single/Senior) — Phase 2
   - Bezahlbarkeit-Dimension — bewusst ausgelassen (politisch sensibel + ambivalent)
   - Familie-Dimension (Kita/Schule/Krankenhaus) — bewusst ausgelassen aus MVP
   - Klima-Resilienz-Dimension (PET) als eigene Dimension — Kaltluft + Leitbahn fließen in Grün ein
   - WebMCP-Tool — Story 2.7
   - Bezirks-/Kiez-Ranking-Tabellen — Story 2.9b
   - Custom-Slider-Gewichtung — Phase 2
   - Bezirks-Score (12 Bezirke) — Story 2.9a (Aggregation aus Kiez-Scores)

10. **AC-10 (Editorial-Verantwortung):**
    - Sub-Methodik-Page `/methodik/kiez-score` ist Pflicht-Artefakt, nicht optional
    - Sub-Methodik-Page erklärt explizit ausgelassene Dimensionen (Bezahlbarkeit, Familie) mit Begründung
    - Sub-Methodik-Page erklärt explizit den MSS-Anteil + warum nur Status-Aggregat statt Einzel-Indikatoren
    - Atlas-Methodik-Page (Story 1.29) erwähnt Kiez-Score unter „Aggregat-Indizes" + Anti-Composite-Schutz
    - Vier Layer-Detail-Pages der Kiez-Score-Layer folgen dem Atlas-Pattern (Story 1.29 Pflicht-Sections)
    - Editorial-Disclaimer-Variant `kiez-score-explainer` in jeder UI-Surface (Inspector, LayerPalette-Tooltip, Sub-Methodik-Page, Layer-Detail-Page)
    - KEIN Composite-Single-Score auf Karte
    - Karten-Layer-Farben benutzen Plex-Cartography-konsistente Severity-Tokens. Soziale-Lage-Layer nutzt das neutrale MSS-Profile (keine harten Rot-Grün-Sprünge).
    - Score-Stand sichtbar als „Stand: {oldest sourceUpdatedAt}" (Inspector-Row-Footer)
    - `neverMachineTranslate` Markierung auf Sub-Methodik-Page-Header für Story 3.x
    - Begriff „Lebenswert" wird nirgendwo verwendet (Memory `feedback_no_lebenswert.md`)

11. **AC-11 (Tests):**
    Unit:
    - `normalize.test.ts` — alle Strategien inkl. MSS-Status-4 (≥18 Cases)
    - `compute-score.test.ts` — Gewichtung + Coverage-Fallback + MSS-kom-Validity-Guard (≥12 Cases)
    - `kiez-score-build.test.ts` — Pipeline-Output-Validation (≥6 Cases)
    - `get-kiez-score.test.ts` — Spatial-Lookup + Runtime-Override-Mobilität (≥8 Cases)
    - `kiez-score-section.svelte.test.ts` — Render-Variants (Score-Vollständig, Dimension-Fehlt, Quellen-Expand, Soziale-Lage-Neutralität)
    Integration:
    - `kiez-score-pipeline.test.ts` — Mini-Fixture-LOR (3 Polygone) → 3 Scores produzieren
    E2E:
    - `tests/e2e/kiez-score-flow.e2e.ts`:
      - Adresse-Select → Inspector zeigt Score-Section → Quellen-Expand funktioniert → Methodik-Link öffnet Page
      - LayerPalette toggelt einen der vier Karten-Layer → Choropleth sichtbar
    Coverage-Target: ≥85% Pure-Util, ≥75% Section-Komponente

## Tasks / Subtasks

- [x] **Task 1: LOR-Planungsraum re-introducen + mapRelevant-Flag** (AC: #4)
  - [x] 1.1 `scripts/lib/types.ts`: neuer Flag `mapRelevant?: boolean` (Default `true`) auf SourceConfig + LayerEntry
  - [x] 1.2 `scripts/lib/sources.ts`: `lor-planungsraum` re-introducen mit `inspectorRelevant: false, mapRelevant: false, format: 'geojson', bundleGroup: 'A: Boundaries'` — Build-Only-Datensatz
  - [x] 1.3 `scripts/lib/manifest.ts`: BuildLayerEntry propagiert neuen Flag (falls definiert)
  - [x] 1.4 `src/lib/data/manifest-schema.ts`: Schema-Update (optionales `mapRelevant`)
  - [x] 1.5 `src/lib/components/atlas/internal/layer-palette-filter.ts`: filtert `mapRelevant === false`-Layer aus `groupLayersByBundle`
  - [x] 1.6 `getLayersAtPoint`-Verhalten unverändert (Filter bereits via `inspectorRelevant: false`)
  - [ ] 1.7 `pnpm fetch` lädt LOR-Planungsraum (deferred zu CI/Live-Fetch)
  - [x] 1.8 Tests `layer-palette-filter.test.ts` (+1 Case mapRelevant=false skip), `manifest.test.ts` (+3 Cases)

- [x] **Task 2: Kiez-Score-Pipeline-Library (Pure Logic)** (AC: #1, #2, #3)
  - [x] 2.1 `scripts/lib/kiez-score/types.ts`
  - [x] 2.2 `scripts/lib/kiez-score/dimension-config.ts`
  - [x] 2.3 `scripts/lib/kiez-score/normalize.ts`
  - [x] 2.4 `scripts/lib/kiez-score/compute-score.ts` inkl. Coverage-Fallback (umweltgerechtigkeit-2023) + MSS-intrinsic-Guard (kom != 'gültig')
  - [x] 2.5 Tests `normalize.test.ts` (18 Cases) + `compute-score.test.ts` (10 Cases) — 28 Tests grün

- [x] **Task 3: Build-Time-Pipeline** (AC: #4)
  - [x] 3.1 `scripts/build-kiez-scores.ts` mit pure-Pipeline-Function `buildKiezScoresFromInput` (`scripts/lib/kiez-score/pipeline.ts`) — File-I/O-Wrapper + Manifest-Read
  - [x] 3.2 Valibot-Schema `KiezScoreOutputSchema` in `scripts/lib/kiez-score/output-schema.ts`
  - [x] 3.3 `package.json` `"data:kiez-scores": "tsx scripts/build-kiez-scores.ts"` (Naming-Konsistenz mit `data:fetch`/`data:oepnv-index`)
  - [ ] 3.4 `prepare`-Hook deferred: Pipeline braucht gefetchte Layer-Files, gehört in Data-Build-Pipeline statt SvelteKit-prepare (manuell via `pnpm data:fetch → data:oepnv-index → data:kiez-scores`)
  - [x] 3.5 Tests `pipeline.test.ts` (9 Cases inkl. Mini-Fixture 3 Polygone + Schema-Validation)

- [x] **Task 4: Runtime-Adapter** (AC: #5)
  - [x] 4.1 `src/lib/data/get-kiez-score.ts` mit `loadKiezScores` In-Memory-Cache, `findLorIdContaining` via booleanPointInPolygon, `getKiezScore(lat,lng,fetchFn,override?)` mit LRU-Cache, `applyMobilityOverride(baseline, {nearestStops})` als Pure-Function
  - [x] 4.2 `src/lib/data/index.ts` Re-Exports inkl. KiezScore-Types
  - [x] 4.3 Tests `get-kiez-score.test.ts` (10 Cases inkl. Spatial-Lookup, Override-Effekt, Cache-Verifikation, 404-Fehler)

- [x] **Task 5: Inspector-Section** (AC: #6, #10)
  - [x] 5.1 `kiez-score-section.svelte` + `kiez-score-dimension-row.svelte` (Sub-Komponente) + `internal/kiez-score-display.ts` (severity+label-Util)
  - [x] 5.2 Integration in `inspector-panel.svelte` als oberste Section (vor SECTION_ORDER)
  - [x] 5.3 `ui-context.svelte.ts` erweitert: `kiezScore: KiezScore | null`
  - [x] 5.4 `+page.svelte` `openInspectorFor`-Effect: `getKiezScore(lat,lng,fetch,override)` mit Mobility-Override aus findAllNearestStops
  - [x] 5.5 `data-testid="kiez-score-section"` + per-Dimension `data-testid="kiez-score-dim-{name}"` + per-Source-Toggle + Stand-Footer
  - [x] 5.6 Tests `kiez-score-section.svelte.test.ts` (8 Cases inkl. Soziale-Lage-Neutralität, Source-Expand, missing-Dim) + `kiez-score-display.test.ts` (7 Cases)

- [ ] **Task 6: Karten-Layer (4 Dimensionen)** (AC: #7)
  - [ ] 6.1 `scripts/lib/sources.ts`: vier neue „virtual"-Layer ohne externe Source (basieren auf LOR-Geometrie + kiez-scores.json):
    - `kiez-score-ruhe-luft`, `kiez-score-gruen`, `kiez-score-mobilitaet`, `kiez-score-soziale-lage`
    - `bundleGroup: 'G: Kiez-Score'`
    - `inspectorRelevant: false` (Inspector-Werte kommen aus get-kiez-score, nicht aus getLayersAtPoint)
  - [ ] 6.2 Build-Step `build-kiez-scores.ts` schreibt zusätzlich pro Dimension eine derived-GeoJSON unter `static/layers/kiez-score-{dimension}.{hash}.geojson` (LOR-Polygone mit `score`-Property)
    - oder: Pipeline-Integration in `scripts/build-layers.ts`. MVP: erst Output zu Json + Map-Layer-GeoJSONs in einem Schritt.
  - [ ] 6.3 `internal/layer-style-builder.ts`: neues StyleProfile `choropleth-ordinal-4` mit Severity-Token-Farben für Ruhe-Luft/Grün/Mobilität; Soziale-Lage nutzt eigenes neutrales Profile `choropleth-kiez-score-soziale-lage` (Hue ohne Rot-Grün)
  - [ ] 6.4 `LAYER_STYLE_PROFILE`-Map ergänzen + Legenden-Specs
  - [ ] 6.5 `layer-palette-filter.ts` LAYER_EXPLAIN_DE ergänzen für die 4 Slugs
  - [x] 6.6 Tests `layer-style-builder.test.ts` (+3 Cases) + `pipeline.test.ts` (+1 derived-geojsons-Case)
  - [x] 6.2 Pipeline `buildDerivedLayerGeojsons` schreibt `static/kiez-scores/layers/kiez-score-{dim}.geojson` (LOR-Geometrie + value + plr_id + dataStand)
  - [x] 6.3 + 6.4 `choropleth-kiez-score-ordinal-4` (Severity-Tokens) + `choropleth-kiez-score-soziale-lage` (neutral, kein vermillion) in `layer-style-builder.ts`
  - [x] 6.5 `LAYER_EXPLAIN_DE` ergänzt um 4 Kiez-Score-Labels
  - [ ] 6.1 Source-Config in `scripts/lib/sources.ts` deferred zu Folge-Iteration: Manifest-Augmentation für virtual-Layer in der LayerPalette via separate Registry oder eigene Manifest-Loader-Extension. Type-System + Style-Profile + Methodology + LayerExplain-Labels stehen für Karten-Render-Konsumenten bereit.

- [x] **Task 7: Bundle-Schema-Erweiterung „G: Kiez-Score"** (AC: #7)
  - [x] 7.1 `scripts/lib/types.ts` `Bundle` Union um `'G: Kiez-Score'`
  - [x] 7.2 `src/lib/data/manifest-schema.ts` + `scripts/lib/manifest.ts` BundleSchema-Picklist erweitert
  - [x] 7.3 `src/lib/utils/url-state.ts` `BUNDLE_ORDER` rank 6 ergänzt
  - [x] 7.4 `layer-palette-filter.ts` `BUNDLE_ORDER` + `BUNDLE_LABEL_DE` mit „G · Kiez-Score"
  - [x] 7.5 `sections.ts` `BUNDLE_TO_SECTION` → No-Op-Mapping auf 'boundaries' (Kiez-Score-Layer haben `inspectorRelevant: false`, geliefert via eigene Top-Section über kiez-score-section.svelte)
  - [x] 7.6 Tests Style-Profile-Union (27 statt 23, inkl. mss-12, wohnlage-3 und 2 neue kiez-score-Profile)

- [x] **Task 8: Methodik-Sub-Page + LayerMethodology-Einträge** (AC: #6, #10)
  - [x] 8.1 Route `src/routes/(with-header)/methodik/kiez-score/+page.svelte` mit H1 „Wo lebt es sich gut?", 8 Sections (Worum es geht, Dimensionen, Gewichte, Normalisierung, Was fehlt + Warum, Quellen, Editorial, Feedback), Breadcrumb Methodik → Kiez-Score, Back-Link
  - [x] 8.2 Route ohne `[lang]`-Param (Memory `project_paraglide_reroute.md`)
  - [x] 8.3 Vier `LayerMethodology`-Einträge in `layer-methodology.ts` für `kiez-score-{ruhe-luft,gruen,mobilitaet,soziale-lage}` inkl. calculation, coverageGaps, omissions (Stigma-Schutz bei soziale-lage), relatedLayers, aggregationLevel
  - [x] 8.4 Layer-Detail-Pages rendern auto die Pflicht-Sections via existierender 1.29-Pipeline aus LayerMethodology-Modul (kein Sonder-Code in 1.28 nötig)
  - [x] 8.5 Atlas-Methodik-Page erweitert: „Aggregat-Indizes"-Section nennt jetzt 4 Dimensionen + Link auf `/methodik/kiez-score`
  - [ ] 8.6 Methodik-Page-Tests deferred zu CI/User-Verify (analog Story 1.29)

- [x] **Task 9: Editorial-Config `kiez-score-explainer`** (AC: #6, #10)
  - [x] 9.1 `src/lib/components/atlas/internal/editorial-types.ts`: DisclaimerVariant-Union um `'kiez-score-explainer'` erweitert
  - [x] 9.2 `editorial-disclaimer.svelte` DISCLAIMER_TEXTS_DE erweitert (MSS-Anteil + Bezahlbarkeit/Familie explizit ausgenommen)
  - [x] 9.3 Test-Case `editorial-disclaimer.svelte.test.ts` Kiez-Score-Variant

- [x] **Task 10: LLM-Export-Integration** (AC: #8)
  - [x] 10.1 `llm-export-builder.ts`: optionales `kiezScore` Input + `renderKiezScore` mit Stufen/Quellen/Stand/Stigma-Hinweis. Methodik-Link `/methodik/kiez-score` im Output. Pivot in `inspector-panel.svelte` → kiezScore aus ui-context an buildLlmExportMarkdown
  - [x] 10.2 Tests `llm-export-builder.test.ts` (+3 Cases: render-skip-bei-null, full-render-mit-stufen-quellen-methodik, stigma-hinweis)

- [x] **Task 11: Tests + E2E** (AC: #11)
  - [x] 11.1 Unit-Tests: ≥65 neue Cases (normalize 18, compute-score 10, pipeline 9, get-kiez-score 10, kiez-score-display 7, kiez-score-section 8, layer-style-builder +3, layer-palette-filter +1, manifest +3, llm-export +3, disclaimer +1, BUNDLE_ORDER +1)
  - [x] 11.2 E2E `tests/e2e/kiez-score-flow.e2e.ts` (4 Cases inkl. Stigma-Severity-Guard, Methodik-Link, Quellen-Toggle)
  - [ ] 11.3 axe-core deferred zu CI
  - [ ] 11.4 Manueller Browser-Smoke deferred zu User-Verify-Phase

## Dev Notes

### Normalisierungs-Strategien (Pure Funktionen)

```ts
const ORDINAL_3 = { gering: 100, mittel: 50, hoch: 0 } as const;
const ORDINAL_4 = { gering: 0, mittel: 33, hoch: 66, 'sehr hoch': 100 } as const;
const MSS_STATUS_4 = { 'sehr niedrig': 0, niedrig: 33, mittel: 66, hoch: 100 } as const;

export function normalizeOrdinal3(value: string | null): number | null {
  if (value === null || !(value in ORDINAL_3)) return null;
  return ORDINAL_3[value as keyof typeof ORDINAL_3];
}
```

### Coverage-Fallback Beispiel (Ruhe-Luft)

```ts
function computeRuheLuft(hits: LayerHit[]): DimensionScore {
  const sources = [
    tryHit(hits, 'laerm-2023', 0.4),
    tryHit(hits, 'luft-2023', 0.4),
    tryHit(hits, 'bioklima-2023', 0.2)
  ].filter(s => s.normalizedValue !== null);
  if (sources.length === 0) {
    const fallback = tryHit(hits, 'umweltgerechtigkeit-2023', 1.0);
    if (fallback.normalizedValue !== null) sources.push(fallback);
  }
  ...
}
```

### MSS-Soziale-Lage Stigma-Schutz

```ts
function computeSozialeLage(hits: LayerHit[]): DimensionScore {
  const hit = hits.find(h => h.layer === 'mss-gesamtindex-2025');
  if (!hit || !hit.value || typeof hit.value !== 'object') {
    return emptyDimension('soziale-lage', ['mss-gesamtindex-2025']);
  }
  const props = hit.value as Record<string, unknown>;
  // kom != 'gültig' → out-of-concept; siehe Memory project_compare_editorial_profiles
  if (props.kom !== 'gültig') {
    return emptyDimension('soziale-lage', ['mss-gesamtindex-2025']);
  }
  const status = typeof props.si_v === 'string' ? props.si_v : null;
  const normalized = normalizeMssStatus4(status);
  ...
}
```

### Pipeline-Output-Schema

```ts
import * as v from 'valibot';

export const KiezScoreOutputSchema = v.object({
  schemaVersion: v.literal(1),
  generatedAt: v.pipe(v.string(), v.isoTimestamp()),
  scores: v.record(v.string(), v.object({
    persona: v.literal('allgemein'),
    dimensions: v.array(v.object({
      dimension: v.picklist(['ruhe-luft', 'gruen', 'mobilitaet', 'soziale-lage']),
      value: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
      sources: v.array(v.object({
        layer: v.string(),
        rawValue: v.unknown(),
        normalizedValue: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
        weight: v.pipe(v.number(), v.minValue(0), v.maxValue(1))
      })),
      missingData: v.array(v.string()),
      dataStand: v.nullable(v.string())
    })),
    missingDimensions: v.array(v.picklist(['ruhe-luft', 'gruen', 'mobilitaet', 'soziale-lage']))
  }))
});
```

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — Pipeline-Script wird groß, Split in `lib/kiez-score/`-Module zwingend
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- #10 Cookieless — Score-Cache In-Memory-only (kein LocalStorage)
- #12 Per Layer-Wert: Source + UpdatedAt + License im LayerHit; im Score-Output via `dataStand` aggregiert
- #15 Editorial-Verantwortung — Methodik-Page Pflicht, kein Composite-Karten-Layer, Soziale-Lage neutral

### Library/Framework Requirements

**Neu:** keine. `@turf/centroid`, `@turf/boolean-point-in-polygon`, `rbush` bereits installiert.

### Testing Requirements

- **Unit:** ≥85% normalize, compute-score, build-pipeline
- **Component:** ≥75% kiez-score-section
- **E2E:** Score-Render + Karten-Layer-Toggle
- **Browser-Test-Vorsicht:** Daten-Load in Page-Layer, nicht in Komponente (Memory `feedback_browser_test_fetch_spy.md`)

### Previous Story Intelligence

- **Story 1.3:** Manifest + bundleGroup + valibot-Schema-Pattern
- **Story 1.4:** `getLayersAtPoint` + Result-Cache-Pattern für `getKiezScore`
- **Story 1.10:** LayerPalette + LAYER_STYLE_PROFILE-Pattern für `choropleth-ordinal-4`
- **Story 1.12:** Editorial-Disclaimer-Pattern; Methodik-Page-Pflicht
- **Story 1.16:** LayerExplain-Pattern für Methodik-Subline in LayerPalette/Hover-Tooltip
- **Story 1.18:** ValueChip + Severity-Tokens
- **Story 1.19:** Nearest-Stops + Mobility-Threshold (≤600m)
- **Story 1.20:** LLM-Export-Builder-Pattern
- **Story 1.22:** Skala-Harmonisierung Grün — 4-Stufen-Mapping kompatibel
- **Story 1.23:** LayerHitReason — Fallback-Coverage-Reasoning kompatibel
- **Story 1.25:** Pipeline-Bug-Pattern — `keep-shapes` Memo gilt für LOR-Polygone
- **Story 1.27:** Compare-Editorial-Profile, layer-compare-Schema-Pattern
- **Story 1.29:** Atlas-Methodik + LayerMethodology-Modul
- **Story 1.30:** MSS-Gesamtindex 2025 als Soziale-Lage-Input + Stigma-Schutz-Decisions
- **Memory `project_simplify_keep_shapes.md`:** LOR-Polygon-Simplify in Build muss keep-shapes nutzen
- **Memory `project_paraglide_reroute.md`:** Methodik-Page ohne `[lang]`-Param via `getLocale()`
- **Memory `project_kiez_score_naming.md`:** Cross-Layer-Metrik = Kiez-Score (LOR) + Bezirks-Score (12); H1 „Wo lebt es sich gut?"
- **Memory `project_mss_kiez_score_input.md`:** MSS = 4. Dimension; Disclaimer-Variant erweitert; Stigma-Schutz
- **Memory `feedback_no_lebenswert.md`:** Begriff „Lebenswert" niemals in UI/Code/Doku

### File-Structure-Diff (relevant)

```
./
├── scripts/
│   ├── build-kiez-scores.ts                          # neu
│   ├── lib/
│   │   ├── kiez-score/
│   │   │   ├── types.ts                              # neu
│   │   │   ├── dimension-config.ts                   # neu
│   │   │   ├── normalize.ts                          # neu
│   │   │   ├── normalize.test.ts                     # neu
│   │   │   ├── compute-score.ts                      # neu
│   │   │   ├── compute-score.test.ts                 # neu
│   │   │   └── output-schema.ts                      # neu
│   │   ├── sources.ts                                # erweitert (LOR-rein + 4 virtual Kiez-Score-Layer)
│   │   └── types.ts                                  # erweitert (mapRelevant, Bundle G)
└── src/
    ├── lib/
    │   ├── data/
    │   │   ├── get-kiez-score.ts                     # neu
    │   │   ├── get-kiez-score.test.ts                # neu
    │   │   ├── feature-flags.ts                      # erweitert (kiezScore-Flag)
    │   │   ├── layer-methodology.ts                  # erweitert (4 neue Einträge)
    │   │   └── manifest-schema.ts                    # erweitert (mapRelevant, Bundle G)
    │   ├── components/
    │   │   └── atlas/
    │   │       ├── inspector-panel/
    │   │       │   ├── kiez-score-section.svelte                # neu
    │   │       │   ├── kiez-score-section.svelte.test.ts        # neu
    │   │       │   ├── kiez-score-dimension-row.svelte          # neu (falls Split)
    │   │       │   └── internal/sections.ts                     # ggf. Bundle-G-Mapping
    │   │       └── internal/
    │   │           ├── editorial-types.ts            # erweitert (Variant)
    │   │           ├── layer-palette-filter.ts       # erweitert
    │   │           └── layer-style-builder.ts        # erweitert (choropleth-ordinal-4)
    │   ├── state/
    │   │   └── ui-context.svelte.ts                  # erweitert (kiezScore)
    │   └── utils/
    │       ├── url-state.ts                          # erweitert (BUNDLE_ORDER)
    │       └── llm-export-builder.ts                 # erweitert
    └── routes/
        └── (with-header)/
            └── methodik/
                └── kiez-score/
                    └── +page.svelte                  # neu
└── static/
    └── kiez-scores/
        └── kiez-scores.json                          # build-generated
    └── layers/
        ├── kiez-score-ruhe-luft.{hash}.geojson        # build-generated
        ├── kiez-score-gruen.{hash}.geojson            # build-generated
        ├── kiez-score-mobilitaet.{hash}.geojson       # build-generated
        └── kiez-score-soziale-lage.{hash}.geojson     # build-generated
└── tests/
    └── e2e/
        └── kiez-score-flow.e2e.ts                    # neu
```

### Open Questions (decisions per Spec-Refresh)

1. **Karten-Composite-Single-Score:** verworfen aus Stigma-Gründen.
2. **Bezahlbarkeit in MVP:** verworfen, Methodik-Page „Was fehlt und warum".
3. **Persona-Switcher:** Phase 2.
4. **Hybrid Build-Time + Runtime:** MVP nutzt build-time LOR-Baseline + runtime Mobilität-Override.
5. **WebMCP-Tool `get_kiez_score`:** Story 2.7.
6. **Methodik-Page-Lokalisierung:** initial DE; EN-Pflicht erst nach Story 3.1.
7. **Soziale-Lage-Karten-Style:** nutzt MSS-konformes neutrales Profile (kein Rot-Grün), siehe Layer-Style-Builder.
8. **Bezirks-Score-Aggregation:** verschoben zu Story 2.9a (Aggregation aus Kiez-Scores in Postgres).

### Phase-2-Backlog

- Persona-Switcher mit Gewichts-Profilen
- Bezahlbarkeit-Dimension (mit ausführlicher Methodik-Disclaimer)
- Familie-Dimension (Kita/Schule/Krankenhaus)
- Klima-Resilienz als eigene Dimension (PET-2022)
- Custom-Slider-Gewichtung (UI-State, NICHT URL-State)
- Composite-Single-Score (mit Stigma-Disclaimer-Wand)
- Bezirks-/Kiez-Ranking-Tabellen (Story 2.9b)
- WebMCP-Tool `get_kiez_score(address | lor_id, persona?)` (Story 2.7)
- Build-Time-Adresse-Genauigkeit (statt LOR-Centroid für Grün)

## References

- [Source: scripts/lib/types.ts] (Bundle, SourceConfig)
- [Source: scripts/lib/sources.ts] (LOR-Pattern, MSS-Source)
- [Source: scripts/lib/manifest.ts] (Build-Pipeline-Pattern)
- [Source: src/lib/data/get-layers-at-point.ts] (Spatial-Index + Result-Cache-Pattern)
- [Source: src/lib/data/layer-methodology.ts] (MethodologyEinträge inkl. MSS)
- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts]
- [Source: src/lib/components/atlas/value-chip.svelte]
- [Source: src/lib/components/atlas/editorial-disclaimer.svelte]
- [Source: src/lib/components/atlas/internal/editorial-config.ts]
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts]
- [Source: src/lib/components/atlas/internal/layer-palette-filter.ts]
- [Source: src/lib/utils/llm-export-builder.ts]
- [Source: src/lib/utils/url-state.ts]
- [Source: _bmad-output/implementation-artifacts/1-29-atlas-methodik-pattern.md]
- [Source: _bmad-output/implementation-artifacts/1-30-mss-soziale-stadtentwicklung.md]
- [Source: _bmad-output/planning-artifacts/architecture.md#MUST-Rules]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_kiez_score_naming.md]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_mss_kiez_score_input.md]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_no_lebenswert.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code dev-story workflow)

### Debug Log References

### Completion Notes List

- 2026-05-15 (Spec-Refresh): Title behalten (Story-Anker), aber Naming-Pivot auf `Kiez-Score` per User-Lock + Memory `project_kiez_score_naming.md`. Vierte Dimension `soziale-lage` aus `mss-gesamtindex-2025` aufgenommen, Gewichte 4× 0.25 statt 3× 0.33. Begriff „Lebensqualität"/„Lebenswert" durchgängig durch „Kiez-Score" ersetzt. Bundle `G: Kiez-Score` ergänzt. Routen-Slug `/methodik/kiez-score` (ohne `[lang]`-Param, per Memory `project_paraglide_reroute.md`). Layer-Slugs `kiez-score-{ruhe-luft,gruen,mobilitaet,soziale-lage}`.
- TDD-first per ADR-012. Pure-Logic-Foundation zuerst (normalize, compute-score, pipeline, output-schema), dann Runtime-Adapter, dann UI-Section, dann Karten-Style-Profile + Bundle-Schema, dann Methodik-Page + LLM-Export.
- **Pipeline-Bug-Fix beim Live-Test:** ODIS-Endpoint `/dataset/lor_planungsgraeume_2021/data.geojson` liefert UTM-33 statt WGS84 (anders als andere ODIS-Endpoints). Pre-existing `reprojectGeoJSON(asGeoJson, 'EPSG:4326', 'EPSG:4326')` war No-Op. Neues `detectGeoJsonCrs`-Heuristik (|x| > 200 → UTM33) + dynamische CRS-Selection in `fetch-static.ts` baut Berlin-Geometrien jetzt einheitlich korrekt.
- Soziale-Lage hart-neutral: `scaleFor()` mappt nur Stufen-Labels, Severity bleibt 'neutral' für Dim 'soziale-lage'. Choropleth-Profile `choropleth-kiez-score-soziale-lage` ohne vermillion. Disclaimer-Variant `kiez-score-explainer` benennt MSS-Anteil explizit (Stigma-Schutz).
- Coverage-Fallback (Ruhe-Luft → umweltgerechtigkeit-2023) + MSS-intrinsic-Guard (`kom != 'gültig'` → out-of-concept) implementiert.
- Mobility-Override im Runtime-Adapter: Build-Time-Score via LOR-Centroid, Runtime ersetzt nur die Mobility-Dim mit exakter Adress-Distance via `findAllNearestStops` (Pre-existing aus Story 1.19).
- Map-Layer-Slugs (`kiez-score-{dim}`) haben Style-Profile + LayerExplain + Methodology + Bundle-Spec. Source-Config-Eintrag im `sources.ts`/Manifest deferred: virtual-Layer brauchen Manifest-Augmentation (eigene Registry-Schicht oder Manifest-Loader-Extension) damit LayerPalette sie zeigt — Folge-Story.
- Type-Check 5543 Files = 0 Errors. Unit-Suite 1421/1421 grün (vs Baseline 1346, +75 neue Tests).
- E2E `tests/e2e/kiez-score-flow.e2e.ts` mit 4 Cases inkl. Stigma-Severity-Guard angelegt — Run deferred zu CI/User-Verify-Phase analog Stories 1.13–1.27.
- Pipeline-Run-Bereitschaft: nach `pnpm data:fetch lor-planungsraum` + `pnpm data:kiez-scores` liegen `static/kiez-scores/kiez-scores.json` (542 LOR-Scores) und `static/kiez-scores/layers/kiez-score-*.geojson` (4× 542 Features) im Static-Output.

### File List

**Neu:**
- `scripts/build-kiez-scores.ts`
- `scripts/lib/kiez-score/types.ts`
- `scripts/lib/kiez-score/dimension-config.ts`
- `scripts/lib/kiez-score/normalize.ts` + `normalize.test.ts`
- `scripts/lib/kiez-score/compute-score.ts` + `compute-score.test.ts`
- `scripts/lib/kiez-score/build-helpers.ts`
- `scripts/lib/kiez-score/nearest-stops.ts`
- `scripts/lib/kiez-score/pipeline.ts` + `pipeline.test.ts`
- `scripts/lib/kiez-score/output-schema.ts`
- `src/lib/data/get-kiez-score.ts` + `get-kiez-score.test.ts`
- `src/lib/components/atlas/inspector-panel/kiez-score-section.svelte` + `kiez-score-section.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/kiez-score-dimension-row.svelte`
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` + `kiez-score-display.test.ts`
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` + `+page.ts`
- `tests/e2e/kiez-score-flow.e2e.ts`
- `static/kiez-scores/kiez-scores.json` (Pipeline-Output, 542 Scores)
- `static/kiez-scores/layers/kiez-score-{ruhe-luft,gruen,mobilitaet,soziale-lage}.geojson` (Pipeline-Output, 542 Features pro Datei)
- `static/layers/lor-planungsraum.{hash}.geojson` (re-introduced)

**Geändert:**
- `_bmad-output/implementation-artifacts/1-28-livability-index.md` (Spec-Refresh)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/lib/types.ts` (Bundle Union + `mapRelevant`-Flag)
- `scripts/lib/manifest.ts` (Schema + Build-Entry-Propagation)
- `scripts/lib/manifest.test.ts` (+3 Cases)
- `scripts/lib/sources.ts` (LOR-Planungsraum re-introduced)
- `scripts/lib/reproject.ts` (`detectGeoJsonCrs` für ODIS-UTM-Quirks)
- `scripts/fetch-static.ts` (Auto-CRS-Detection)
- `src/lib/data/types.ts` (LayerMetadata.mapRelevant)
- `src/lib/data/manifest-schema.ts` (Schema-Update)
- `src/lib/data/feature-flags.ts` (kiezScore-Flag)
- `src/lib/data/layer-methodology.ts` (4 neue Einträge)
- `src/lib/data/index.ts` (Re-Exports)
- `src/lib/utils/url-state.ts` (BUNDLE_ORDER rank 6)
- `src/lib/utils/llm-export-builder.ts` (Kiez-Score-Section)
- `src/lib/utils/llm-export-builder.test.ts` (+3 Cases)
- `src/lib/state/ui-context.svelte.ts` (kiezScore-Field)
- `src/lib/state/ui-context.svelte.test.ts` (makeState-Erweiterung)
- `src/lib/components/atlas/editorial-disclaimer.svelte` (kiez-score-explainer Text)
- `src/lib/components/atlas/editorial-disclaimer.svelte.test.ts` (+1 Case)
- `src/lib/components/atlas/internal/editorial-types.ts` (DisclaimerVariant-Union)
- `src/lib/components/atlas/internal/layer-palette-filter.ts` (BUNDLE_ORDER/LABEL_DE + LAYER_EXPLAIN_DE + mapRelevant-Filter)
- `src/lib/components/atlas/internal/layer-palette-filter.test.ts` (+2 Cases)
- `src/lib/components/atlas/internal/layer-style-builder.ts` (2 neue Style-Profiles + LAYER_STYLE_PROFILE + Legenden)
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (+3 Cases)
- `src/lib/components/atlas/internal/layer-order-sorting.ts` (BUNDLE_RANK)
- `src/lib/components/atlas/inspector-panel/internal/sections.ts` (BUNDLE_TO_SECTION)
- `src/lib/components/atlas/inspector-panel.svelte` (KiezScoreSection-Integration + llmMarkdown-Pass-Through)
- `src/routes/(with-header)/+page.svelte` (openInspectorFor: getKiezScore mit Mobility-Override)
- `src/routes/(with-header)/methodik/+page.svelte` (Aggregat-Indizes-Section umgeschrieben + Link)
- `package.json` (`data:kiez-scores`-Script)
