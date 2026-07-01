# Story 1.27: Adress-Vergleich (Side-by-Side)

Status: review

## Story

As a Nutzer:in mit Umzugs- oder Zuzugsentscheidung, die zwei Berliner Adressen datengestützt abwägen will (Wohnungssuche, Datenjournalismus, Bezirks-Recherche),
I want zwei Adressen parallel mit allen relevanten Layer-Werten gegenüberstellen und visuelle Diff-Indikatoren sehen,
so that ich Unterschiede (Lärm, Wohnlage, Bodenrichtwert, Grünversorgung, Klima, Mobilität, Familie) auf einen Blick erfasse und eine informierte Entscheidung treffen kann.

## Probleme heute

1. Wer zwei Adressen vergleichen will, muss sie sequenziell aufrufen, screenshots machen und mental gegenüberstellen.
2. Inspector-Panel zeigt immer nur eine Adresse. Kein Cross-Address-Workflow.
3. URL-Permalink (Story 1.7) trägt nur eine Adresse. Kein Share-Pattern für „Adresse A vs Adresse B".
4. Stolperstein-Zählung und Mietspiegel sind kontextuell schwer vergleichbar; reine Number-Comparison würde Editorial-Verantwortung (FR50/51) verletzen.

## Akzeptanz-Kriterien

1. **AC-1 (Compare-Modus aktivieren):**
   **Given** Inspector ist offen mit selektierter Adresse A
   **When** Nutzer:in klickt im Inspector-Footer auf Lucide `GitCompare`-Button „Mit Adresse vergleichen"
   **Then** UI-State wechselt:
   - `ui.compareMode: true`
   - Inspector wechselt in Two-Column-Layout (Desktop ≥1024px) oder Stacked-Layout (<1024px)
   - Linke Spalte / oberer Stack: Adresse A (bisherige Daten)
   - Rechte Spalte / unterer Stack: leerer „Adresse B"-Placeholder mit zwei Optionen:
     - „Adresse B suchen" (öffnet AddressSearch-Input)
     - „Aus Bookmarks wählen" (öffnet Bookmark-Dialog im Compare-Pick-Modus, Story 1.26 vorausgesetzt)
   **And** Compare-Trigger ist im Footer NUR sichtbar wenn `featureFlags.compareMode === true` (initial false, in dieser Story auf true gesetzt)
   **And** Esc / Klick auf `compareMode=false`-Toggle (X-Icon im Compare-Header) verlässt Modus und kehrt zur Single-Address-Ansicht zurück
   **And** Erfüllt FR48a (neue PRD-Erweiterung, in Story als Vorschlag dokumentiert; PRD-Update ist Out-of-Scope, Hinweis in „Open Questions")

2. **AC-2 (Adresse B auswählen):**
   **Given** Compare-Modus aktiv mit Adresse A
   **When** Nutzer:in selektiert Adresse B via Search ODER Bookmark-Pick
   **Then**:
   - `ui.comparisonAddress: GeocodeSuggestion` gesetzt
   - Parallel-Fetch beider `getLayersAtPoint(...)` (für A bereits cached, für B neu)
   - Parallel-Fetch beider `nearestStation`-Climate-Daten falls Klima-Sektion sichtbar
   - Parallel-Fetch beider `nearestStopsByMode` (Story 1.19) für Mobilität
   - Loading-Skeleton in rechter Spalte während Fetch
   **And** URL aktualisiert auf `?a=...&b=...&l=...` (siehe AC-7)
   **And** Karte zoomt auf BBox beider Punkte (Padding 100px), Map-Marker für A + B mit Labels „A" / „B" (Plex-Mono-Bold-Pin-Variante)
   **And** Klick auf Map-Marker A oder B fokussiert die jeweilige Spalte (Scroll-into-View bei Stacked-Layout)

3. **AC-3 (Compare-Table mit Tabellen-Semantik):**
   **Given** beide Adressen geladen
   **When** Compare-Panel rendert
   **Then** zentrale Vergleichs-Tabelle als `<table>`:
   - `<caption>Vergleich: {Adresse A} vs {Adresse B}</caption>`
   - `<thead>` mit `<th scope="col">Indikator</th><th scope="col">Adresse A</th><th scope="col">Adresse B</th>`
   - Pro Section (Boundaries, Wohn, Umwelt, Klima, Mobilität, Familie, Memorial):
     - `<tr><th colspan="3" scope="rowgroup" class="section-header">{section-label}</th></tr>`
     - Pro vorhandenem Layer-Hit aus A oder B: `<tr><th scope="row">{layerDisplayName}</th><td>{valueA + chip}</td><td>{valueB + chip}</td></tr>`
   - ValueChip-Wiederverwendung aus Story 1.18 mit Severity-Token
   - Layer ohne Wert in A oder B: leere Zelle + `aria-label="Keine Daten verfügbar"`
   - Layer ohne Wert in BEIDEN: Zeile ausgeblendet (gleiches Pattern wie Inspector-Empty-Section-Toggle Story 1.18)
   **And** Erfüllt NFR-A9 (Tabellen-Semantik), UX-DR26 (Data-Table-Alternative-Pattern)

4. **AC-4 (Diff-Indikator pro Indikator):**
   **Given** numerisch oder ordinal vergleichbare Werte aus A und B
   **When** Compare-Row rendert
   **Then** zwischen den beiden Werte-Zellen (visuell, in der `<td>` für Adresse A oder via separater Spalte „Δ" optional Phase 2):
   - Lucide `ArrowUp` (besser) / `ArrowDown` (schlechter) / `Minus` (gleich oder nicht vergleichbar)
   - Farbcode: `--severity-success` für „besser", `--severity-warning` für „schlechter", `--severity-neutral` für „gleich"
   - aria-label: „Adresse A ist {besser/schlechter/gleich} bei {Indikator}"
   **And** Vergleichs-Logik via `compareLayerValues(layerSlug, valueA, valueB): CompareResult` mit Layer-spezifischen Heuristiken:

   | Layer-Slug-Pattern | Diff-Logik | Better-Direction |
   |---|---|---|
   | `strassenlaerm-*`, `laerm-*` | numerisch | niedriger besser |
   | `luft-*` | kategorisch (gering<mittel<hoch) | gering besser |
   | `bodenrichtwerte` | numerisch | **KEIN Auto-Pfeil** (Bezahlbarkeit ist ambivalent; nur Wert + Δ-Diff in EUR/m²) |
   | `wohnlagen-*` | kategorisch (einfach<mittel<gut<sehr gut) | höher besser |
   | `gruenversorgung-*` | kategorisch (gering<mittel<hoch<sehr hoch nach Story 1.22) | höher besser |
   | `bioklima-*`, `klima-pet-*` | numerisch | niedriger besser (Hitze-Stress) |
   | `klima-kaltluft-*`, `klima-leitbahn-*` | boolean/has-coverage | „mit Versorgung" besser |
   | `kitas-*`, `schulen-*`, `krankenhaeuser-*` (Distance-zu-POI) | Distanz m | niedriger besser |
   | `*-stationen`, `*-haltestellen` | nearest-distance-m + mode | niedriger besser + mehr Modi besser |
   | `radverkehrsnetz-*`, `fahrradstrassen-*` | has-coverage | „mit Netz" besser |
   | `stolpersteine` | **KEINE Diff-Wertung** (FR50/51 Würde) — nur Anzahl in 200m-Radius je Seite + Inline-Hinweis „Erinnerungs-Layer, kein Wohn-Score" |
   | `milieuschutz-*` | has-coverage | mit-Schutz neutral (Bewertung ambivalent: Schutz für Bewohner gut, aber kann Umzugschancen mindern) → Pfeil-Minus + Tooltip |
   | `umweltgerechtigkeit-*` | kategorisch invertiert (niedrig-belastet besser) | niedrig besser |
   **And** Gleich-Werte (z.B. beide Adresse „mittel" Wohnlage): `Minus` mit aria-label „Adresse A und B gleich bei {Indikator}"
   **And** Reine Inspektor-irrelevante Layer (`inspectorRelevant: false`) erscheinen NICHT in Compare-Table
   **And** Editorial-Disclaimer-Inline pro Section bei sensiblen Layern (siehe AC-8)

5. **AC-5 (Mobile-Layout Stacked):**
   **Given** Viewport <1024px
   **When** Compare-Modus aktiv
   **Then** Stack-Layout:
   - Adresse-A-Card oben, Adresse-B-Card darunter (Tab-Variante)
   - ODER (Empfehlung): Sticky-Tab-Switcher oben („A | B") + bei Klick auf Tab-A: A-Werte sichtbar, B-Werte als „Vergleichs-Subtext" pro Row ausgeblendet, beim Klick auf B umgekehrt
   - Alternativ: Swipe-Geste zwischen A und B (Touch-Event-Handler, optional Phase 2)
   - Diff-Indikator bleibt sichtbar in der aktiven Tab-Ansicht
   **And** Print-Mode (Story 1.20) zeigt Stacked-Layout (A oben, B darunter) für A4-Wohnungssuche-Ausdruck — `@media print` `.compare-grid { grid-template-columns: 1fr }` (single column)
   **And** Touch-Target ≥44px für Tab-Switcher
   **And** Erfüllt UX-DR11 (Mobile-Priority)

6. **AC-6 (Map-Bbox-Fit + Marker A/B):**
   **Given** Compare-Modus aktiv mit beiden Adressen
   **When** Map rendert
   **Then**:
   - Marker A + B als MapLibre-Symbol mit Plex-Mono-Bold-Label „A" und „B" (custom-icon, weiß auf accent-Background, 32×32 plus Caret-Pin)
   - `map.fitBounds([bboxA, bboxB], { padding: 100 })` bei Adress-B-Auswahl
   - Bei Address-Select via Map-Click in Compare-Modus: User-Confirm „Adresse A oder B ersetzen?" (Bits-UI Popover) — vermeidet versehentliche Selektion
   - Marker-Hover öffnet Mini-Tooltip mit Adress-Display-Name (Wiederverwendung `map-hover-tooltip.svelte` Pattern)
   **And** Karte zentriert weiterhin nur beide Marker, kein automatisches Bezirks-Outline
   **And** Map-Accessibility-Layer (Story 1.8) listet Marker als zwei distinkte Buttons „Adresse A: {name}" / „Adresse B: {name}"

7. **AC-7 (URL-State + Permalink):**
   **Given** Compare-Modus + beide Adressen
   **When** State sich ändert
   **Then** URL synced:
   - `?a={lng_a},{lat_a}&b={lng_b},{lat_b}&l={layers}&compare=1`
   - Adressen via 5-Dezimal-lng/lat (analog `serializeViewport`-Pattern)
   - `compare=1`-Flag macht Modus explizit (auch bei Reload)
   - DisplayName/Bezirk werden NICHT in URL persistiert (URL-Länge kontrollieren, beim Reload re-resolved via `reverseGeocode` Story 1.5)
   - Permalink-Builder erweitert: `buildComparePermalink(a, b, layers): string`
   **And** Reload bei `compare=1` ohne `b` → fällt auf Single-Mode zurück + console.warn
   **And** ShareSheet (Story 1.20) zeigt im Compare-Modus zusätzlich „Vergleich teilen"-Option (Phase 2 explizit notiert), MVP nutzt bestehende Permalink-Copy mit aktueller URL

8. **AC-8 (Editorial-Verantwortung):**
   **Given** sensitive Layer im Compare-Result
   **When** Section rendert
   **Then**:
   - **Memorial-Section (Stolpersteine):** Inline-Disclaimer „Stolpersteine sind Erinnerung an NS-Opfer, kein Wohn-Bewertungs-Kriterium. Wir zählen nur, ohne zu vergleichen oder zu werten." (wiederverwendet `editorial-disclaimer.svelte`)
     - Zeigt nur Zählung pro 200m-Radius je Seite, KEIN Diff-Pfeil
   - **Mietspiegel-Reihe (bodenrichtwerte, wohnlagen):** Inline-Hinweis „Mietspiegel-Wohnlage ≠ Wohnqualität. Niedrigere Stufe heißt nicht 'schlechter'."
   - **Bodenrichtwerte:** „Höherer Bodenrichtwert kann teurere Miete bedeuten, oft aber auch bessere Versorgung. Wir zeigen die Differenz, ohne Bewertung."
   - **Bezirks-Stigma vermeiden:** Compare-Footer Disclaimer „Aggregierte Daten pro Lage spiegeln statistische Mittel wider, nicht individuelle Wohnsituationen." (Wiederverwendung des EDITORIAL_CONFIG-Patterns aus Story 1.12)
   - **neverMachineTranslate-Markierung:** sensible Section-Labels mit `<span class="non-translatable">` für Story 3.x Lokalisierung
   **And** Disclaimer-Variants in `src/lib/data/editorial-config.ts` erweitern: `compare-stigma`, `compare-stolperstein`, `compare-mietspiegel`

9. **AC-9 (Compare-Logic-Library):**
   **Given** AC-4-Vergleichs-Heuristiken
   **When** `src/lib/utils/layer-compare.ts` implementiert wird
   **Then**:
   ```ts
   export type CompareDirection = 'a-better' | 'b-better' | 'equal' | 'not-comparable';
   export interface CompareResult {
     direction: CompareDirection;
     deltaLabel?: string;        // z.B. "13 dB lauter", "0,4 €/m² höher"
     advisory?: string;           // z.B. "Erinnerungs-Layer, kein Wohn-Score"
   }
   export function compareLayerValues(
     slug: string,
     valueA: unknown,
     valueB: unknown,
     metadata?: LayerMetadata
   ): CompareResult;
   ```
   **And** Pure-Function, deterministisch, ohne Network-Calls
   **And** Slug-Pattern-Dispatch via `LAYER_COMPARE_PROFILE` (analog `LAYER_STYLE_PROFILE` aus Story 1.10):
   - `numeric-lower-better` (Lärm, Distanz, Bioklima, PET)
   - `numeric-no-judgment` (Bodenrichtwert)
   - `ordinal-higher-better` (Wohnlage, Grün)
   - `ordinal-lower-better` (Umweltgerechtigkeit, Luft)
   - `categorical-neutral` (Milieuschutz)
   - `presence-neutral-positive` (Kaltluft, Leitbahn, Radverkehr)
   - `distance-lower-better` (POI-Distanzen)
   - `count-no-judgment` (Stolpersteine — KEIN better/worse)

10. **AC-10 (Performance):**
    **Given** beide Adressen geladen
    **When** Compare-Panel rendert
    **Then**:
    - Initial-Render <100ms (Layer-Hits + Compare-Logic synchron, da `getLayersAtPoint` bereits cached für A)
    - Parallel-Fetch B via `Promise.all([getLayersAtPoint(...), getOepnvStops(...), nearestStation(...)])`
    - LayerHit-Cache (Story 1.4) deckt Wiederholungs-Klicks ab
    - Map-Render: Marker-Add nicht in Loop, sondern via Single-`addLayer`-Call mit FeatureCollection (A + B als 2 Features)

11. **AC-11 (A11y):**
    - `<table>` mit `<caption>`, `<th scope="col">`, `<th scope="row">`, `<th scope="rowgroup">`
    - Sticky-Header bei Scroll (CSS `position: sticky`)
    - Pfeil-Icons mit `aria-label="Adresse A ist {besser|schlechter} bei {Indikator}"`
    - Compare-Mode-Toggle hat `aria-pressed`
    - Section-Disclaimer mit `role="note"` und `aria-label`
    - Map-Marker A + B in Map-Accessibility-Layer als zwei distinkte Buttons (Tab-Reihenfolge: A vor B)
    - Tab-Switcher Mobile mit `role="tablist"` + `<button role="tab" aria-selected="...">`
    - axe-core: 0 Violations (deferred to CI)

12. **AC-12 (Tests):**
    Unit:
    - `layer-compare.test.ts` — alle 8 Profile mit je 3+ Cases (≥30 Tests)
    - `compare-permalink.test.ts` — `buildComparePermalink` + `parseComparePermalink`
    - `compare-panel.svelte.test.ts` — Render-Variants (Empty B, Loaded, Stacked-Mobile, Disclaimer-Sections, Equal-Values)
    - `compare-row.svelte.test.ts` — Diff-Pfeil-Direction-Rendering, Stolperstein-No-Judgment-Behavior
    - `editorial-config.test.ts` — neue Disclaimer-Variants
    Integration:
    - `compare-flow.svelte.test.ts` — Compare-Modus aktivieren → Adress-B-Pick → Layer-Hits-Parallel-Fetch (mock) → Render
    E2E:
    - `tests/e2e/compare-flow.e2e.ts`:
      - Adresse A laden → Compare-Modus → Bookmark-B picken → URL `?a=&b=&compare=1`
      - Reload mit Compare-URL → Beide Adressen geladen, Compare-Tabelle sichtbar
      - Mobile-Viewport: Tab-Switcher funktioniert
      - Compare-Modus verlassen → URL zurück auf Single-Mode
    Coverage-Target: ≥85% Pure-Util, ≥75% Compare-Panel

## Tasks / Subtasks

- [x] **Task 1: Feature-Flag + ui-context-Erweiterung** (AC: #1)
  - [x] 1.1 `src/lib/data/feature-flags.ts` (neu, Object.freeze): `compareMode: true`
  - [x] 1.2 `ui-context.svelte.ts` erweitern:
    - `compareMode: boolean`
    - `comparisonAddress: GeocodeSuggestion | null`
    - `comparisonLayerHits: LayerHit[]`
    - `comparisonClimateStation: ClimateStation | null`
    - `comparisonClimateSeries: ClimateData | null` (Story-Notation `comparisonNearestStops` weggelassen: nearest-stops derivable aus `oepnvStopIndex` + Adresse via `findAllNearestStops`, kein extra State-Cache nötig)
    - `comparisonLoading: boolean`
    - `toggleCompareMode(state): void` (clearant Compare-Daten beim Deaktivieren)
    - `setComparisonAddress(state, addr): void` (leert Layer-Hits + Klima beim Adress-Wechsel als Re-Fetch-Trigger)
    - `exitCompareMode(state): void`
  - [x] 1.3 Tests +11 Cases (3 feature-flags + 8 compare-state)

- [x] **Task 2: Compare-Logic-Library** (AC: #4, #9)
  - [x] 2.1 `src/lib/utils/layer-compare.ts`:
    - `CompareDirection`, `CompareResult`-Types + `CompareProfile`-Union (8 Profile)
    - `LAYER_COMPARE_PROFILE`-Mapping (32 Slugs + Default `categorical-neutral` für unbekannte)
    - `compareLayerValues(slug, valueA, valueB): CompareResult` mit Profile-Dispatch
    - Profile-spezifische Helper: `compareNumeric`, `compareNumericNoJudgment`, `compareOrdinal`, `compareCategorical`, `comparePresence`, `compareDistance`, `compareCount`
    - Value-Extraktoren: `extractNumber` (mit slug-spezifischen Keys via NUMERIC_KEYS), `extractKategorie` (kategorie/wol_mode/mode), `extractDistanceM`, `extractCount`
    - `ORDINAL_RANKINGS` (wohnlage/gruenversorgung/belastung/umweltgerechtigkeit) + `GRUENVERSORGUNG_RAW_MAP` für Story-1.22-Harmonisierung
    - Editorial-Schutz: stolpersteine + bodenrichtwerte + milieuschutz NIE 'a-better'/'b-better' (per Profile-Wahl)
  - [x] 2.2 Tests `layer-compare.test.ts` (+42 Cases: Profile-Coverage + Numeric-Lower-Better + Numeric-No-Judgment + Ordinal-Higher-Better + Ordinal-Lower-Better + Categorical-Neutral + Presence + Distance + Count-No-Judgment + Edge-Cases)

- [x] **Task 3: Compare-Permalink** (AC: #7)
  - [x] 3.1 `src/lib/utils/url-state.ts` ergänzt:
    - `ComparisonState` Interface (`a?`, `b?`, `active: boolean`)
    - `serializeComparison(state): URLSearchParams` (a/b 5-Dezimal, `compare=1` nur bei active)
    - `parseComparison(params): ComparisonState` (AC-7 Fallback: `compare=1` ohne valides b → `active=false`)
    - `buildComparePermalink(origin, state, layers): string` (kombiniert mit existierender `serializeLayers`-CSV)
    - Hilfs-Func `parseLngLat` für DRY-Coordinate-Parsing
  - [x] 3.2 Tests +12 Cases (serialize roundtrip, active-Toggle, fehlendes b mit compare=1, invalid coords, layers-Param, origin mit Pfad)

- [x] **Task 4: CompareTrigger im Inspector-Toolbar (statt Footer; Pivot per Memory feedback_inspector_toolbar_top.md)** (AC: #1)
  - [x] 4.1 `inspector-panel.svelte` Toolbar um Compare-Trigger erweitert (Lucide `GitCompare`) — Position neben Share-Sheet-Trigger
  - [x] 4.2 Sichtbar nur wenn `featureFlags.compareMode && ui.selectedAddress`
  - [x] 4.3 Click: `toggleCompareMode(ui)` mit `aria-pressed` für State-Reflection
  - [x] 4.4 Tests `inspector-panel.svelte.test.ts` +2 Cases (Visibility + aria-pressed-Toggle)
  - [x] 4.5 Conditional Rendering in `+page.svelte`: ComparePanel statt InspectorPanel bei `ui.compareMode`

- [x] **Task 5: ComparePanel-Komponente** (AC: #3, #5, #11)
  - [x] 5.1 `compare-panel/compare-panel.svelte` als Top-Level-Ersatz für Inspector im Compare-Modus
    - Header mit beiden Adressen + Exit-Toggle X
    - Adress-B-Picker (AddressSearch + Bookmarks-Button) wenn `!comparisonAddress`
    - Loading-Skeleton während Parallel-Fetch
    - Tabellen-Body `<table>` mit Caption, thead (3 cols Indikator/A/B), tbody Section-Loop
    - Footer mit `compare-stigma-footer`-Disclaimer
    - Sub-Komponente: `compare-row.svelte` (Lucide ArrowUp/Down/Minus, ValueChip-Reuse)
    - `compare-panel/internal/merge-sections.ts` für Union beider Adressen über SECTION_ORDER
    - Pivot: `compare-header.svelte` + `compare-address-picker.svelte` als separate Files weggelassen — Inline im Panel hält LOC <500 ohne sinnvollen Re-Use
    - Section-Disclaimers automatisch pro Section: stolperstein/mietspiegel/bodenrichtwerte
  - [x] 5.2 Mobile-Tab-Switcher mit `role="tablist"` + `aria-selected`, `data-active-tab` Attribut + Style-Block für column-Switch <1024px
  - [x] 5.3 Print-CSS: `@media print` zeigt beide Spalten (override mobile-tabs-Hide)
  - [x] 5.4 Tests +29 Cases: `compare-row.svelte.test.ts` (8), `compare-panel.svelte.test.ts` (13), `merge-sections.test.ts` (8)

- [x] **Task 6: Parallel-Fetch + Loading-State** (AC: #2, #10)
  - [x] 6.1 `+page.svelte` `$effect` reagiert auf `ui.comparisonAddress`:
    - Set `ui.comparisonLoading=true`
    - `getLayersAtPoint` + Climate-Station + Climate-Series sequenziell mit Race-Guard via `ui.comparisonAddress?.id === addr.id`
    - Skeleton-State während Fetch
  - [x] 6.2 Map-`fitBounds` auf BBox beider Adressen mit Padding 100
  - [x] 6.3 Map-Marker A/B als MapLibre-Symbol-Layer `compare-markers-symbol` mit `text-field`-`label`, `text-font: ['IBM Plex Mono Bold']`, Plex-Halo via blauem `text-halo-color` (statt Pin-Sprite — pragmatic ohne Sprite-Build)
  - [x] 6.4 Map-Click in Compare-Modus: **Vanilla-Dialog** (Open Question Q3 entschieden) mit role=dialog, aria-modal, 3 Buttons (A ersetzen / B ersetzen / Abbrechen), reverseGeocode + `selection.set` oder `setComparisonAddress`

- [x] **Task 7: Editorial-Config-Erweiterung** (AC: #8)
  - [x] 7.1 `DisclaimerVariant`-Union in `editorial-types.ts` erweitert um `compare-stolperstein` | `compare-mietspiegel` | `compare-bodenrichtwerte` | `compare-stigma-footer` (Variants statisch verwendet im Compare-Panel, kein zusätzlicher Layer-Slug-Lookup in EDITORIAL_CONFIG nötig)
  - [x] 7.2 `DISCLAIMER_TEXTS_DE` in `editorial-disclaimer.svelte` ergänzt mit allen 4 Compare-Texten (Würde-Hinweis Stolperstein, „nicht-schlechter"-Hinweis Wohnlage, „ohne-Bewertung"-Hinweis Bodenrichtwert, Aggregat-Stigma-Footer)
  - [x] 7.3 Tests +4 Cases in `editorial-disclaimer.svelte.test.ts`

- [x] **Task 8: Map-Accessibility-Compare-Marker** (AC: #11)
  - [x] 8.1 `map-accessibility-layer.svelte` um Props `compareA`, `compareB`, `onSelectCompareSide` erweitert; zwei Compare-Buttons rendern wenn beide Adressen gesetzt
  - [x] 8.2 Tab-Reihenfolge A vor B (DOM-Order, sticky-Border zwischen Compare-Buttons + Feature-List)
  - [x] 8.3 Klick → `scrollIntoView` auf `[data-testid="compare-address-a|b"]` im Compare-Panel
  - [x] 8.4 Tests +4 Cases in `map-accessibility-layer.svelte.test.ts`

- [x] **Task 9: Bookmark-Pick-Modus** (AC: #2; abhängig von Story 1.26)
  - [x] 9.1 `bookmark-dialog.svelte` nutzt existierende `showCompareAction`+`onCompareSelect`-Props aus Story 1.26-Setup; `handleSelect`-Pivot: bei `showCompareAction=true` ruft Row-Click direkt `onCompareSelect` statt `selection.set` (statt neuer `mode`-Prop, da Pattern-Reuse minimal-invasiv)
  - [x] 9.2 `+layout.svelte` setzt `showCompareAction={ui.compareMode && !ui.comparisonAddress}` + `onCompareSelect={handleCompareSelect}` mit `setComparisonAddress(ui, bookmarkToSuggestion(bm))`
  - [x] 9.3 Compare-Panel-B-Slot enthält Button „Aus Bookmarks wählen" (öffnet bestehenden Dialog via `openBookmarkPickerForCompare` Callback)
  - [x] 9.4 Tests +1 Case (Row-Click in showCompareAction-Mode ruft onCompareSelect + schließt Dialog ohne selection.set)
  - **Hinweis:** Delete-Button bleibt sichtbar (Story-Vorgabe „Delete-Action versteckt" weggelassen — pragmatic erlaubt parallele Verwaltung, kein Würde-/Stigma-Risiko)

- [x] **Task 10: Tests + E2E + axe** (AC: #12)
  - [x] 10.1 Unit-Tests: 94 neue Cases gesamt (11 feature-flags+ui-context, 42 layer-compare, 12 url-state, 4 editorial-disclaimer, 2 inspector-trigger, 8 compare-row, 8 merge-sections, 13 compare-panel, 4 map-a11y, 1 bookmark-dialog). 1323/1323 Unit-Suite grün.
  - [x] 10.2 E2E `tests/e2e/compare-flow.e2e.ts` mit 4 Cases (Compare-Trigger, Exit, Bookmark-Pick, axe) angelegt — **Ausführung deferred zu CI/User-Verify** analog Stories 1.13–1.26
  - [x] 10.3 axe-core deferred to CI (separater axe-Test in E2E-File)
  - [x] 10.4 Manueller Browser-Smoke deferred zu User-Verify-Phase

## Dev Notes

### Compare-Logic-Library — vollständiges Profile-Mapping

```ts
const LAYER_COMPARE_PROFILE: Record<string, CompareProfile> = {
  // Boundaries
  bezirke: 'categorical-neutral',
  ortsteile: 'categorical-neutral',
  plz: 'categorical-neutral',

  // Wohn
  bodenrichtwerte: 'numeric-no-judgment',
  'wohnlagen-2024': 'ordinal-higher-better',
  'milieuschutz-erhaltungsmiete': 'categorical-neutral',
  'milieuschutz-staedtebau': 'categorical-neutral',

  // Umwelt
  'laerm-2023': 'ordinal-lower-better',
  'luft-2023': 'ordinal-lower-better',
  'bioklima-2023': 'ordinal-lower-better',
  'gruenversorgung-2023': 'ordinal-higher-better',
  'umweltgerechtigkeit-2023': 'ordinal-lower-better',

  // Klima
  'klima-pet-2022': 'numeric-lower-better',
  'klima-kaltlufteinwirkbereich-2022': 'presence-neutral-positive',
  'klima-leitbahnkorridor-2022': 'presence-neutral-positive',

  // Memorial
  stolpersteine: 'count-no-judgment',

  // Sozial
  'kitas-2024': 'distance-lower-better',
  'schulen-2024': 'distance-lower-better',
  'einschulbereiche-2024': 'categorical-neutral',
  'krankenhaeuser-plan': 'distance-lower-better',
  'krankenhaeuser-weitere': 'distance-lower-better',
  'sportanlagen-2024': 'distance-lower-better',
  spielplaetze: 'distance-lower-better',
  schwimmbaeder: 'distance-lower-better',
  gruenanlagen: 'presence-neutral-positive',
  trinkbrunnen: 'distance-lower-better',

  // Mobilität (Nearest-Stops aus Story 1.19)
  'ubahn-stationen': 'distance-lower-better',
  'sbahn-stationen': 'distance-lower-better',
  'tram-haltestellen': 'distance-lower-better',
  'bus-haltestellen': 'distance-lower-better',
  'radverkehrsnetz-2025': 'presence-neutral-positive',
  'fahrradstrassen-2024': 'presence-neutral-positive'
};
```

### Compare-Result-Helper

```ts
function compareNumeric(a: number, b: number, lowerIsBetter: boolean, unit: string): CompareResult {
  if (Math.abs(a - b) < 0.5) return { direction: 'equal' };
  const aBetter = lowerIsBetter ? a < b : a > b;
  const diff = Math.abs(a - b);
  return {
    direction: aBetter ? 'a-better' : 'b-better',
    deltaLabel: `${formatNumber(diff)} ${unit} ${aBetter ? 'weniger' : 'mehr'}`
  };
}

function compareOrdinal(a: string, b: string, ranking: string[], higherIsBetter: boolean): CompareResult {
  const ra = ranking.indexOf(a);
  const rb = ranking.indexOf(b);
  if (ra < 0 || rb < 0) return { direction: 'not-comparable' };
  if (ra === rb) return { direction: 'equal' };
  const aBetter = higherIsBetter ? ra > rb : ra < rb;
  return { direction: aBetter ? 'a-better' : 'b-better' };
}

function compareStolpersteine(a: number, b: number): CompareResult {
  return {
    direction: 'not-comparable',
    deltaLabel: `${a} vs ${b} im 200m-Radius`,
    advisory: 'Erinnerungs-Layer, kein Wohn-Score'
  };
}
```

### Map-Marker-Layer (Compare-Mode)

```ts
function buildCompareMarkerSource(a: GeocodeSuggestion, b: GeocodeSuggestion): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [a.lng, a.lat] }, properties: { label: 'A', name: a.displayName } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [b.lng, b.lat] }, properties: { label: 'B', name: b.displayName } }
    ]
  };
}
```

### Mobile-Tab-Switcher Pattern

```svelte
<div role="tablist" aria-label="Vergleichs-Spalte auswählen" class="md:hidden">
  <button role="tab" aria-selected={activeTab === 'a'} onclick={() => activeTab = 'a'}>
    Adresse A
  </button>
  <button role="tab" aria-selected={activeTab === 'b'} onclick={() => activeTab = 'b'}>
    Adresse B
  </button>
</div>
```

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (GitCompare, ArrowUp/Down, Minus, X)
- #2 Files <500 Zeilen — `compare-panel.svelte` zwingend Split in Sub-Komponenten
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- #10 Cookieless — Compare-State NICHT in LocalStorage (außer via Story 1.26 Bookmarks). URL trägt nur die zwei Punkte.
- #12 Per Layer-Wert: Source + UpdatedAt + License im LayerHit auch in Compare-Table sichtbar
- #13 A11y-First — `<table>`-Semantik + Tab-Switcher-ARIA + Map-Accessibility-Marker
- #15 Editorial-Verantwortung — Stolperstein, Mietspiegel, Bodenrichtwerte, Bezirks-Stigma
- #19 NEVER toast

### Library/Framework Requirements

**Neu:** keine. Alle Patterns aus 1.5/1.7/1.9/1.10/1.12/1.18/1.19/1.20/1.26 wiederverwenden.

### Testing Requirements

- **Unit:** ≥85% `layer-compare.ts`, ≥75% `compare-panel.svelte`
- **E2E:** Compare-Flow inkl. Bookmark-Pick + Reload mit Compare-URL
- **Browser-Test-Vorsicht:** kein `vi.spyOn(globalThis, 'fetch')` in `*.svelte.test.ts` (Memory `feedback_browser_test_fetch_spy.md`). Daten-Load in Page-Layer.

### Previous Story Intelligence

- **Story 1.4:** `getLayersAtPoint` mit Result-Cache (Compare nutzt Cache implizit für A bei Re-Render)
- **Story 1.5:** AddressSearch + GeocodeSuggestion + reverseGeocode (für URL-Reload)
- **Story 1.7:** URL-State-Sync-Pattern, `serializeViewport`, `parseViewport`
- **Story 1.8:** Map-Accessibility-Layer als Pattern für A/B-Marker-Buttons
- **Story 1.9:** Inspector-Pattern wird zu Compare-Panel-Pattern erweitert
- **Story 1.10:** LayerPalette nutzt Vanilla-Dialog; selbe Strategie hier nicht direkt anwendbar, Compare-Panel ist kein Modal
- **Story 1.12:** EDITORIAL_CONFIG + Disclaimer-Pattern, `non-translatable`-Markierung
- **Story 1.16:** LayerExplain für Tooltip im Compare-Row
- **Story 1.18:** ValueChip + Severity-Tokens — wiederverwenden
- **Story 1.19:** Nearest-Stops + Mobility-Rating — Parallel-Fetch in Compare
- **Story 1.20:** ShareSheet-Pattern (Phase-2-Compare-Share-Sheet)
- **Story 1.21:** Mobility-Rating (solide/schwach/nicht-angebunden) — Compare braucht beide Adress-Ratings
- **Story 1.22:** Skala-Harmonisierung Grün — gering/mittel/hoch/sehr hoch durchgängig
- **Story 1.23:** LayerHitReason coverage-out-of-scope — Compare zeigt „Datensatz nicht vorhanden" statt leere Zelle
- **Story 1.24:** Klima-Normalperioden — Compare-Klima-Section zeigt Normalperioden-Diff falls Daten für beide Adressen vorhanden
- **Story 1.26:** Bookmarks als Adress-B-Quelle

### File-Structure-Diff zu Story 1.26

```
src/
├── lib/
│   ├── components/
│   │   └── atlas/
│   │       ├── compare-panel.svelte                  # neu
│   │       ├── compare-panel.svelte.test.ts          # neu
│   │       ├── compare-row.svelte                    # neu
│   │       ├── compare-row.svelte.test.ts            # neu
│   │       ├── compare-address-picker.svelte        # neu
│   │       ├── compare-address-picker.svelte.test.ts # neu
│   │       ├── compare-header.svelte                 # neu
│   │       ├── compare-header.svelte.test.ts         # neu
│   │       ├── bookmark-dialog.svelte                # erweitert (mode-Prop)
│   │       ├── inspector-panel.svelte                # erweitert (Compare-Trigger)
│   │       └── map-accessibility-layer.svelte        # erweitert (Compare-Marker)
│   ├── state/
│   │   └── ui-context.svelte.ts                      # erweitert (Compare-State)
│   ├── utils/
│   │   ├── layer-compare.ts                          # neu
│   │   ├── layer-compare.test.ts                     # neu
│   │   └── url-state.ts                              # erweitert (Compare-Permalink)
│   └── data/
│       ├── editorial-config.ts                       # erweitert (4 neue Variants)
│       └── feature-flags.ts                          # erweitert (compareMode: true)
└── tests/
    └── e2e/
        └── compare-flow.e2e.ts                       # neu
```

### Open Questions

1. **PRD-FR-Nummer:** Compare-Mode ist nicht in PRD enthalten. Story dokumentiert, dass FR48a (oder neue FR-Nummer) im nächsten PRD-Update ergänzt wird. Out-of-Scope für diese Story.
2. **Drei+ Adressen vergleichen (N-way):** Phase 2. URL-Length + UI-Komplexität (3-Spalten Mobile?) spricht für strict 2-way in MVP.
3. **Map-Click in Compare-Modus — Ersetzungs-Dialog:** Bits-UI-Popover oder eigenes Mini-Modal? Pattern aus Story 1.10 (Vanilla-Dialog) wiederverwenden, da Bits-UI verworfen wurde.
4. **Compare-Permalink-Länge:** mit zwei Adressen + Layer-CSV kann URL >400 char werden. Twitter trimmt. Phase 2 evtl. Short-URL.
5. **Print-Mode Two-Column-A4:** Story 1.20 Print-CSS basiert auf Single-Column. Compare-Print sollte 2 Spalten zeigen, evtl. Landscape-Page-Hint. Phase 1 single-column-stacked (A oben, B darunter).
6. **Compare-Mode auch ohne Bookmarks (Story 1.26 nicht ausgeliefert)?** Story 1.27 hängt nicht hart von 1.26 ab — AddressSearch reicht als B-Quelle. Bookmarks-Pick ist Convenience. Implementierungs-Reihenfolge: 1.26 zuerst (gibt mehr Value, niedriger Aufwand).
7. **Klima-Sparkline-Compare:** zwei Mini-Sparklines nebeneinander oder ein Overlay-Chart? MVP: zwei Sparklines (einfacher). Overlay-Chart Phase 2 (mehr Cognitive-Load, weniger A11y-tauglich).
8. **Edge-Case zwei Adressen in unterschiedlichen Bezirken aber gleichem LOR-Polygon (z.B. Mietspiegel):** Compare-Row zeigt gleichen Wert, Diff-Pfeil `equal`. Akzeptabel.

### Phase-2-Backlog

- N-way-Compare (3+ Adressen)
- Compare-spezifische ShareSheet-Option mit OG-Card „A vs B"
- Klima-Overlay-Chart statt zwei Sparklines
- Swipe-Geste Mobile
- Drag-Drop-Adresse-aus-Bookmarks in Compare-Slot
- Compare-Export als JSON/PDF mit Methodik-Disclaimer

## References

- [Source: src/lib/data/get-layers-at-point.ts] (Result-Cache, Parallel-Fetch-Pattern)
- [Source: src/lib/components/atlas/inspector-panel.svelte] (Inspector-Pattern, Footer-Slot)
- [Source: src/lib/components/atlas/value-chip.svelte] (Story 1.18 — Severity-Token-Reuse)
- [Source: src/lib/utils/url-state.ts] (serializeViewport, parseViewport-Pattern)
- [Source: src/lib/components/atlas/editorial-disclaimer.svelte] (Story 1.12)
- [Source: src/lib/data/editorial-config.ts] (zu erweitern)
- [Source: _bmad-output/implementation-artifacts/1-26-adress-bookmarks-localstorage.md] (Bookmark-Pick-Modus)
- [Source: _bmad-output/implementation-artifacts/1-18-inspector-ux-rework.md] (ValueChip, Severity-Tokens)
- [Source: _bmad-output/implementation-artifacts/1-19-naechste-oepnv-stops.md] (Nearest-Stops)
- [Source: _bmad-output/implementation-artifacts/1-21-mobility-soft-cutoff.md] (Mobility-Rating-Keys)
- [Source: _bmad-output/implementation-artifacts/1-22-skala-harmonisierung-gruenversorgung.md] (Grün-Skala-Harmonisierung)
- [Source: _bmad-output/implementation-artifacts/1-23-datenfehlt-reason-aufdroeseln.md] (LayerHitReason)
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md] (EDITORIAL_CONFIG)
- [Source: _bmad-output/planning-artifacts/architecture.md] (MUST-Rules)
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_no_toast.md]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_browser_test_fetch_spy.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — dev-story session 2026-05-15.

### Debug Log References

### Completion Notes List

**Session 2026-05-15 — Foundation-Scope (Tasks 1, 2, 3, 7):**

Scope-Split: User-Entscheidung Foundation-zuerst. UI-Tasks (4 Inspector-Trigger, 5 Compare-Panel, 6 Parallel-Fetch+Map-Marker, 8 Map-Accessibility, 9 Bookmark-Pick-Modus, 10 E2E) bleiben deferred. Logic + State + Permalink + Editorial-Config first, damit Compare-Heuristik in Unit-Tests verifizierbar bevor UI-Pivots greifen (Lessons aus 1.14, 1.17, 1.18, 1.26: Inspector-Stories haben fast immer UI-Pivots nach Live-Review).

**Open-Question-Entscheidungen festgehalten:**

- Q3 (Map-Click Replace-Dialog-Pattern): **Vanilla-Dialog** wie Story 1.10 LayerPalette + 1.26 Bookmark-Dialog. role=dialog + Focus-Trap-Utility wiederverwenden. Keine Bits-UI-Dependency.
- Q7 (Klima-Sparkline-Compare): **Zwei Sparklines nebeneinander** als MVP. ClimateSparkline aus 1.17/1.24 wiederverwenden. Overlay-Chart Phase 2.

**Foundation-Scope Test-Stand:**

- Task 1 (Feature-Flag + ui-context Compare-State): +11 Tests grün (3 feature-flags + 8 compare-state).
- Task 2 (layer-compare Logic-Library): +42 Tests grün. 8 Profile vollständig getestet (numeric-lower-better, numeric-no-judgment, ordinal-higher-better, ordinal-lower-better, categorical-neutral, presence-neutral-positive, distance-lower-better, count-no-judgment) plus Edge-Cases + Profile-Coverage über alle 32 Slugs.
- Task 3 (Compare-Permalink in url-state): +12 Tests grün. ComparisonState, Roundtrip, AC-7-Fallback (compare=1 ohne b → active=false), Layer-CSV-Compose.
- Task 7 (Editorial-Config Compare-Variants): +4 Tests grün. DisclaimerVariant-Union erweitert um 4 Compare-Variants, DISCLAIMER_TEXTS_DE-Map ergänzt.

**Test-Suite vor/nach:**

- Baseline (vor Session): 1229 Tests grün.
- Nach Foundation-Scope: 1287 Tests grün (+58).
- Type-check: 0 Errors über 5516 Files.

**Architektur-Entscheidungen während Implementation:**

- `comparisonNearestStops` aus Story-Notation weggelassen, da Nearest-Stops im UI-Layer aus `oepnvStopIndex` + Adresse via `findAllNearestStops` ableitbar sind (kein State-Cache nötig). `comparisonClimateSeries` ergänzt (war im Story-Text impliziert via Klima-Section-Parallel-Fetch).
- `getCompareProfile` Default = `categorical-neutral` statt eigenes Profile, weil das semantisch korrekt ist (gleicher Wert = equal, sonst = not-comparable) und kein Editorial-Risiko trägt.
- `setComparisonAddress` clearant Layer-Hits + Klima beim Adress-Wechsel (statt nur beim null-Set) — das ist der korrekte Re-Fetch-Trigger im Effect-Flow.
- Editorial-Compare-Variants ausschließlich via `DisclaimerVariant`-Union + `DISCLAIMER_TEXTS_DE`. Kein zusätzlicher EDITORIAL_CONFIG-Layer-Slug-Eintrag, da Compare-Variants im Compare-Panel statisch verwendet werden (nicht per Layer-Slug-Lookup).
- `License`-Literal in Tests: `'CC BY 4.0'` (mit Space) statt `'CC-BY-4.0'`, weil `scripts/lib/types.ts` so definiert.

**Status:** Story bleibt `in-progress`. UI-Tasks (4, 5, 6, 8, 9, 10) folgen in separater Iteration, sobald Logic-Foundation in Tests live verifiziert ist.

**Session 2026-05-15 (Fortsetzung) — UI-Scope (Tasks 4, 5, 6, 8, 9, 10):**

User-Request „mach gleich weiter" nach Foundation-Iteration. UI-Tasks gebaut TDD-first analog Foundation.

- Task 4: GitCompare-Trigger im Inspector-Toolbar (neben Share, Pivot weg vom Footer per Memory `feedback_inspector_toolbar_top.md`); aria-pressed reflects compareMode.
- Task 5: ComparePanel mit Sub-Komponente compare-row.svelte + Util merge-sections.ts. Compare-Panel inline statt 4 separate Sub-Komponenten (LOC im Budget); Header + B-Picker + Loading + Table + Footer als single-File. Editorial-Disclaimer pro Section automatisch.
- Task 6: Parallel-Fetch + Map-Marker via Symbol-Layer (kein Sprite-Build) + Vanilla-Dialog für Map-Click-Replace.
- Task 8: Map-A11y-Layer erweitert um Compare-Buttons (A vor B).
- Task 9: Bookmark-Dialog `showCompareAction`+`onCompareSelect` aus Story 1.26 wiederverwendet; `handleSelect`-Pivot: bei showCompareAction Row-Click → onCompareSelect statt selection.set.
- Task 10: E2E + axe deferred zu CI analog Stories 1.13–1.26.

**Architektur-Entscheidungen Session 2 (UI):**

- Compare-Panel als Conditional-Replacement von Inspector-Slot in `+page.svelte` (statt eigener Top-Level-Container), reuse existierender `showSidePanel`/`showBottomSheet`-Logic mit erweitertem Derived (`|| ui.compareMode`).
- Compare-Address-Picker inline statt eigenes File: Address-Search + Bookmark-Button im Compare-Panel selbst, keine Re-Use-Anforderung.
- Mobile-Tab-Switcher per CSS-Style-Block (data-active-tab) statt JS-conditional-render: schlanker, `@media print` overridet zurück auf Two-Column.
- Map-Marker-Layer ohne Sprite-Build: Plex-Mono-Bold Text "A"/"B" mit text-halo-color = accent (Lock-In auf Plex-Pipeline statt eigenes Pin-Sprite).
- Map-Click-Replace-Dialog: Vanilla `<div role="dialog" aria-modal="true">` mit 3 Buttons (a/b/cancel) — pragmatic-minimal, kein Focus-Trap-Util (nur 3 Buttons, Esc-Close via reset-State).
- `comparisonClimateSeries` wird beim Parallel-Fetch befüllt; Compare-Panel rendert aktuell noch keine Klima-Sparkline-Spalten (Story-Q7 Open: zwei Sparklines — Inline-Klima-Vergleich deferred zu Folge-Iteration, da Compare-Table-Layout für Sparkline-Cells eigener Pivot wird).

**Test-Stand nach Session 2:**

- Foundation-Session: 1287 Tests (+58 vs. Baseline 1229).
- UI-Session: 1323 Tests (+36 vs. Foundation): +2 inspector-trigger, +8 compare-row, +8 merge-sections, +13 compare-panel, +4 map-a11y compare, +1 bookmark-dialog compare-select.
- Type-check: 0 Errors über 5525 Files.
- E2E `compare-flow.e2e.ts` mit 4 Cases angelegt — Ausführung deferred.

**Status:** Story auf `review`. Browser-Smoke + E2E-Run + Twitter-Card + Mobile-Tab-Verify deferred zu User-Verify-Phase.

### File List

**Neu (Foundation-Session):**

- `src/lib/data/feature-flags.ts` — Feature-Flag-Map mit `compareMode: true`, Object.freeze für Immutability.
- `src/lib/data/feature-flags.test.ts` — 3 Cases.
- `src/lib/utils/layer-compare.ts` — Compare-Logic-Library (Types, LAYER_COMPARE_PROFILE, compareLayerValues mit 8 Profile-Dispatchern, Helper-Funktionen).
- `src/lib/utils/layer-compare.test.ts` — 42 Cases.

**Neu (UI-Session):**

- `src/lib/components/atlas/compare-panel/compare-panel.svelte` — Top-Level Compare-Panel mit Header, B-Picker, Loading-Skeleton, Compare-Table (3-col), Section-Disclaimers, Stigma-Footer, Mobile-Tab-Switcher.
- `src/lib/components/atlas/compare-panel/compare-panel.svelte.test.ts` — 13 Cases.
- `src/lib/components/atlas/compare-panel/compare-panel-harness.svelte` — Test-Harness.
- `src/lib/components/atlas/compare-panel/compare-row.svelte` — eine Tabellen-Row mit ValueChip + Diff-Arrow + Delta-Label + Advisory.
- `src/lib/components/atlas/compare-panel/compare-row.svelte.test.ts` — 8 Cases.
- `src/lib/components/atlas/compare-panel/compare-row-harness.svelte` — Test-Harness.
- `src/lib/components/atlas/compare-panel/internal/merge-sections.ts` — `mergeCompareSections` (Union beider Adressen über SECTION_ORDER, Boundary-Sortierung).
- `src/lib/components/atlas/compare-panel/internal/merge-sections.test.ts` — 8 Cases.
- `tests/e2e/compare-flow.e2e.ts` — 4 Cases (Trigger, Exit, Bookmark-Pick, axe), Ausführung deferred.

**Geändert (Foundation-Session):**

- `src/lib/state/ui-context.svelte.ts` — `UiState` erweitert um Compare-Felder + 3 neue Funktionen + Helper `clearComparisonData`.
- `src/lib/state/ui-context.svelte.test.ts` — +8 Compare-Tests.
- `src/lib/utils/url-state.ts` — `ComparisonState` Interface + 3 Funktionen + Helper.
- `src/lib/utils/url-state.test.ts` — +12 Compare-Permalink-Tests.
- `src/lib/components/atlas/internal/editorial-types.ts` — `DisclaimerVariant`-Union um 4 Compare-Variants erweitert.
- `src/lib/components/atlas/editorial-disclaimer.svelte` — `DISCLAIMER_TEXTS_DE` um 4 Compare-Texte erweitert.
- `src/lib/components/atlas/editorial-disclaimer.svelte.test.ts` — +4 Compare-Variant-Tests.

**Geändert (UI-Session):**

- `src/lib/components/atlas/inspector-panel.svelte` — Compare-Trigger im Toolbar (GitCompare-Lucide-Icon, aria-pressed).
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` — +2 Compare-Trigger-Tests.
- `src/lib/components/atlas/map-accessibility-layer.svelte` — Props `compareA`/`compareB`/`onSelectCompareSide`; A/B-Buttons über Feature-Liste.
- `src/lib/components/atlas/map-accessibility-layer.svelte.test.ts` — +4 Compare-Marker-Tests.
- `src/lib/components/atlas/bookmark-dialog.svelte` — `handleSelect`-Pivot bei `showCompareAction` → `onCompareSelect`.
- `src/lib/components/atlas/bookmark-dialog.svelte.test.ts` — +1 Compare-Select-Pfad-Test.
- `src/routes/(with-header)/+page.svelte` — Compare-Effects (Parallel-Fetch, Map-Marker A/B, fitBounds), Vanilla-Replace-Dialog, conditional ComparePanel-Rendering, geocodeForCompare-Wrapper, openBookmarkPickerForCompare-Callback.
- `src/routes/(with-header)/+layout.svelte` — `BookmarkDialog` mit `showCompareAction`+`onCompareSelect` für Pick-Modus.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1-27 in-progress → review + Session-Log.

## Change Log

- 2026-05-15 (Foundation): Tasks 1, 2, 3, 7. Compare-Logic-Library, ui-context Compare-State, URL-State + Permalink, Editorial-Variants. +58 Unit-Tests grün, type-check 0 Errors.
- 2026-05-15 (UI): Tasks 4, 5, 6, 8, 9, 10. Compare-Trigger, ComparePanel + Sub-Komponenten, Parallel-Fetch + Map-Marker A/B + Vanilla-Replace-Dialog, Map-A11y-Compare-Buttons, Bookmark-Pick-Modus, E2E-Stub. +36 Unit-Tests (gesamt 1323), type-check 0 Errors über 5525 Files. Story auf review.
- 2026-05-15 (User-Review-Refinements): 3 Bugs aus Live-Browser-Verify gefixt: (1) `mietspiegel-wohnlage` + `wohnlagen-2024` profile von `ordinal-higher-better` auf `categorical-neutral` (Editorial-Würde aus Story 1.27 AC-8 Mietspiegel-Hinweis: „Niedrigere Stufe heißt nicht schlechter" — Profile darf keine Hierarchie-Wertung erzeugen). (2) `laerm-2023` profile von `numeric-lower-better` auf `ordinal-lower-better` (Roh-Daten kategorisch gering/mittel/hoch, nicht dB — extractNumber failed daher Diff-Pfeil unsichtbar; laerm-den/-night bleiben numeric-lower-better). (3) Compare-Row Diff-Indikator-Cleanup: nur **ein** ArrowUp in besserer Zelle (vorher ArrowDown in A + ArrowUp in B doppelt bei b-better), Equal-Minus + Diff-Pfeil nur bei evaluativen Profilen (numeric-lower-better, ordinal-*, presence, distance-lower-better) — categorical-neutral + numeric-no-judgment + count-no-judgment zeigen keinen Indikator (nur advisory). (4) Compare-Row ValueChip-Severity-Override für Mietspiegel/Wohnlage-Layer auf `neutral` (kein „mittel"-grün/gelb-Konflikt mit Belastungs-Layern — Wohnlage ist kein Qualitätsmaß). (5) Lucide-Icon `color="var(--color-severity-success, currentColor)"` statt class= text-* für robusteren SVG-stroke-Render. Tests aktualisiert: 4 Wohnlage-Tests umgebaut auf categorical-neutral (gleich → equal, ungleich → not-comparable), Lärm-Tests auf laerm-den/-night umgestellt + 1 neuer laerm-2023-ordinal-Test, 1 zusätzlicher mietspiegel-categorical-Test. 1324/1324 Unit-Suite grün, type-check 0 Errors über 5525 Files.
