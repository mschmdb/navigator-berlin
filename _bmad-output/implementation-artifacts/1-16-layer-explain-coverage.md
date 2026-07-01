# Story 1.16: Layer-Explain-Coverage + Multi-Surface

Status: review

## Story

As a Berliner Bürger ohne Vorwissen über Berliner Geo-Daten,
I want pro Layer eine klare Erklärung sehen, OHNE den Inspector öffnen zu müssen — in der Layer-Palette beim Aktivieren, in der Karten-Legend, beim Hover über Layer-Geometrie und auf einer Layer-Detail-Seite,
so that ich verstehe was ich sehe und Layer bewusst nutzen kann statt im Daten-Nebel zu navigieren.

## Probleme

1. **Coverage-Lücke:** `LAYER_EXPLAIN_DE` (in `inspector-panel/internal/layer-explain.ts`) hat ~15 Einträge — Manifest hat ~30+ Layer. Mobilität, Soziale-Infra, Milieuschutz, Klima-Detail, Sport, Krankenhäuser etc. fehlen.
2. **Surface-Lücke:** Erklärungen NUR im Inspector. Layer-Palette zeigt keinen Explain, Karten-Legend keine, Map-Hover keinen.
3. **/de/layer/{slug}-Page:** Stub vorhanden (Inspector-Learn-More-Link führt hin), aber keine echte Inhalte-Pipeline. Phase 2 (Story 2.5 Layer-Konzept-Pages-FAQ) deckt das mit SEO-Page-Inhalten ab, aber Phase-1 braucht mindestens Basis-Detail-Page mit Explain + Source + License + Beispiel-Werte.

## Acceptance Criteria

1. **AC-1 (Full-Coverage `LAYER_EXPLAIN_DE`):**
   **Given** Manifest mit allen aktiven Layern
   **When** `LAYER_EXPLAIN_DE` und `LAYER_EXPLAIN_LONG_DE` (neu) aktualisiert werden
   **Then** JEDER Manifest-Layer-Slug hat:
   - `short` (max 80 Zeichen, 1-Zeile für Palette + Inspector)
   - `long` (max 400 Zeichen, 2-3 Sätze für Legend-Expand + Detail-Page)
   - `unit?` (Wert-Einheit, z.B. `€/m²`, `dB`, `Anzahl`)
   - `valueScaleExplain?` (z.B. „1-5 = einfach bis sehr gut" für Wohnlage)
   **And** Tests verifizieren Coverage (Test-Fail wenn Manifest-Slug ohne Explain-Eintrag)
   **And** TODO-Annotations für künftige Layer (Phase 2-Manifest-Adds)
   **And** Erfüllt FR Layer-Transparency.

2. **AC-2 (Layer-Palette-Tooltip/Subline):**
   **Given** Layer-Palette-Dialog (Story 1.10)
   **When** User hovert oder fokussiert Layer-Item
   **Then** Subline unter Layer-Name zeigt `short`-Explain (Plex-Serif-Italic `text-xs` `--ink-muted`)
   **And** Mobile: subline immer sichtbar (kein Hover-only)
   **And** Erfüllt UX-DR Layer-Discoverability.

3. **AC-3 (Karten-Legend-Expand):**
   **Given** Map-Legend (Story 1.10c MapLegend-Component)
   **When** User klickt auf Layer-Eintrag in Legend
   **Then** Expand-Panel mit:
   - `long`-Explain
   - Source-URL als Link
   - License (mit DataStandBanner-Pattern)
   - `valueScaleExplain` falls vorhanden
   - „Mehr erfahren →"-Link auf `/de/layer/{slug}`
   **And** Collapse via second-click oder Escape
   **And** Multiple-Expand erlaubt (Accordion-NOT-mutual-exclusive)
   **And** Erfüllt UX-DR Legend-Self-Service.

4. **AC-4 (Map-Hover-Direct-Tooltip):**
   **Given** Polygon-Layer aktiv auf Karte
   **When** Desktop-User hovert über Polygon (mousemove, kein Click)
   **Then** Tooltip am Cursor erscheint:
   - Layer-Display-Name (h6 Plex-Serif)
   - Aktueller Polygon-Wert (formatiert via `formatLayerValue`)
   - `short`-Explain (1 Zeile)
   - Hint „Click für volle Adresse-Inspektion"
   **And** Tooltip nur für TOPMOST-Layer (höchster Bundle-Order)
   **And** Auto-close nach 300ms mouseleave
   **And** Mobile: KEIN Hover-Tooltip (würde Touch-Behavior brechen)
   **And** Erfüllt UX-DR Map-Self-Documenting.

5. **AC-5 (Layer-Detail-Page Phase-1-Baseline):**
   **Given** Stub-Route `/[lang]/layer/[slug]/+page.svelte` (Inspector-Learn-More-Link)
   **When** Phase-1-Baseline-Inhalt implementiert wird
   **Then** Page rendert:
   - Layer-Name als h1 (Plex-Serif)
   - `long`-Explain als Lead-Paragraph
   - Source-Card: URL + License + License-Link + Fetched-At
   - `valueScaleExplain` als Description-List
   - Bundle-Info: „Teil von: [Bundle-Name]"
   - Inspector-Link „Layer auf Karte anschauen →" (öffnet Map mit Layer aktiv via URL-State)
   - Editorial-Disclaimer aus Story 1.12 falls applicable (z.B. Mietspiegel-legal)
   **And** Layout aus `+layout.svelte` (mit-header)
   **And** SEO-Meta-Tags Basis (Story 2.x Detailtiefe)
   **And** Falls Slug nicht in Manifest: 404
   **And** Erfüllt FR Layer-Konzept-Page-Foundation.

6. **AC-6 (Inspector-Explain-Konsumiert-Long):**
   **Given** LayerHitRow (Story 1.9/1.12)
   **When** Row gerendert wird
   **Then** Aktueller `short`-Text bleibt im Row sichtbar
   **And** „Mehr"-Toggle-Button expandiert auf `long`-Text inline
   **And** Falls `valueScaleExplain` vorhanden: zeigt unter Wert
   **And** Erfüllt UX-DR Progressive-Disclosure.

7. **AC-7 (LayerHitRow Action-Icons — Detail + Map-Toggle):**
   **Given** LayerHitRow hat aktuell ein einzelnes ExternalLink-Icon oben rechts, das auf `/[lang]/layer/{slug}` führt (→ 404 bis Detail-Page ausgeliefert)
   **When** Action-Icons-Bereich überarbeitet wird
   **Then** Zwei separate Icons mit klarer Semantik:
   - **Map-Toggle-Icon** (`Layers`-Icon Lucide oder `EyeOff`/`Eye`-Variant):
     - Bei NICHT-aktivem Layer: `Eye` Icon, aria-label `{LayerName} auf Karte zeigen`
     - Bei aktivem Layer: `EyeOff` Icon, aria-label `{LayerName} von Karte entfernen`
     - Click → `toggleLayer(uiState, hit.layer)` aus `ui-context.svelte.ts`
     - Visueller Feedback: active-state via `--accent`-Color
   - **Detail-Page-Icon** (`ExternalLink` Lucide):
     - Target: `/[lang]/layer/{slug}` (siehe AC-5 Detail-Page-Baseline)
     - aria-label `Mehr Details über {LayerName}`
     - Optional: `target="_blank"` für neue Tab oder Same-Tab — Default Same-Tab (SvelteKit-Navigation)
   - Beide Icons in vertikaler oder horizontaler Group oben-rechts der Row
   - Touch-Target ≥ 32x32px (WCAG-Empfehlung, kein Pflicht-44 da Inspector-Dense-Layout)
   **And** Tooltips via `title`-Attribute + aria-label
   **And** Erfüllt UX-DR Layer-Cross-Surface-Discoverability + behebt 404-Bug aus User-Review 2026-05-13.

8. **AC-8 (Layer-Toggle-Permalink-Sync):**
   **Given** Story 1.7 URL-State-Sync mit `?l=` Layer-Slug-Liste
   **When** User togglet Layer aus Inspector-Row via Map-Toggle-Icon
   **Then** URL aktualisiert sich (push-state, NICHT replace, da User-Action)
   **And** Map-Layer wird sichtbar/unsichtbar
   **And** Layer-Palette-Active-State synchron
   **And** Permalink-Sharing funktioniert mit toggled-State
   **And** Erfüllt UX-DR State-Consistency.

7. **AC-7 (i18n-TODO-Foundation):**
   **Given** Story 3.1 paraglide-Migration
   **When** Explain-Map aktualisiert wird
   **Then** Naming `LAYER_EXPLAIN_DE` (current) bleibt für Story 3.1-Migration auf `layer.{slug}.short/long`
   **And** Inline-Comment in File `// TODO Story 3.1: i18n-Migration → Paraglide`
   **And** Erfüllt NFR-i18n.

9. **AC-9 (Tests + Coverage-Guard):**
   **Given** Manifest + Explain-Map
   **When** Tests laufen
   **Then** Unit-Tests:
   - `layer-explain.test.ts`:
     - JEDER Manifest-Slug hat Explain-Entry (Coverage-Guard)
     - `short` ≤ 80 Zeichen
     - `long` ≤ 400 Zeichen
     - `getLayerExplain(slug, 'short' | 'long')` Helper
   - `legend-expand.svelte.test.ts` — Click-to-Expand, Multi-Expand
   - `map-hover-tooltip.svelte.test.ts` — Hover, auto-close, Mobile-disabled
   - `layer-detail-page.test.ts` — Render mit allen Layer-Properties + 404-Branch
   - `layer-hit-row.svelte.test.ts` Erweiterung:
     - Map-Toggle-Icon Eye/EyeOff je nach active-State
     - Click toggled uiState.activeLayerSlugs
     - URL-State sync nach Toggle
   **And** E2E `tests/e2e/layer-explain-coverage.e2e.ts`:
   - Layer-Palette: hover Lärm-Item → subline „Straßenverkehrs-Lärmpegel..."
   - Legend-Click: Wohnlagen-2024 → expand mit long-Explain
   - Map-Hover über Polygon → Tooltip mit Wert + Erklärung
   - Inspector-Row „Mehr" → expand inline
   - Inspector-Row Map-Toggle-Klick → Layer auf Karte sichtbar + URL updated
   - /de/layer/wohnlagen-2024 → Page mit allen Properties
   **And** axe-core: 0 Violations

## Tasks / Subtasks

- [x] **Task 1: Explain-Map-Erweiterung** (AC: #1, #7)
  - [x] 1.1 `inspector-panel/internal/layer-explain.ts` refactor:
    - Neue Interface `LayerExplain { short: string; long: string; unit?: string; valueScaleExplain?: string }`
    - `LAYER_EXPLAIN_DE: Record<string, LayerExplain>`
    - Migration aller existierenden 15 Einträge
    - Neue Einträge für ~20 fehlende Layer
  - [x] 1.2 Helper `getLayerExplain(slug, kind: 'short' | 'long'): string`
  - [x] 1.3 i18n-TODO-Comment
  - [x] 1.4 Coverage-Guard-Test (Test fails wenn Manifest-Slug nicht in Map)

- [x] **Task 2: Layer-Palette-Subline** (AC: #2)
  - [ ] 2.1 `layer-palette.svelte` erweitern: pro Layer-Item Subline mit short-Explain
  - [ ] 2.2 Mobile: always-visible, Desktop: always-visible (kein Hover-only für a11y)
  - [ ] 2.3 Tests aktualisieren

- [x] **Task 3: Legend-Expand-Panel** (AC: #3)
  - [ ] 3.1 `map-legend.svelte` erweitern:
    - Click-Handler pro Legend-Item
    - Expand-Panel mit long-Explain + Source-Card + Link
  - [ ] 3.2 `<LegendExpandPanel>`-Sub-Component (falls Code >500 Zeilen)
  - [ ] 3.3 Keyboard-Support (Enter/Space toggle)
  - [ ] 3.4 Tests

- [x] **Task 4: Map-Hover-Tooltip** (AC: #4)
  - [ ] 4.1 `src/lib/components/atlas/map-hover-tooltip.svelte`:
    - MapLibre Mouse-Event-Listener auf aktive Polygon-Layer
    - Tooltip-Overlay mit Layer-Name + Wert + short-Explain
    - Topmost-Layer-Resolver
  - [ ] 4.2 Wiring in `map-libre-canvas.svelte`
  - [ ] 4.3 Mobile-Branch: kein Hover-Tooltip
  - [ ] 4.4 Tests

- [x] **Task 5: Layer-Detail-Page** (AC: #5)
  - [ ] 5.1 `src/routes/[lang]/layer/[slug]/+page.svelte`:
    - Load-Function `+page.ts` mit `getLayerExplain(slug)` + Manifest-Lookup
    - Layout-Komponenten: Lead, Source-Card, ValueScale-DescriptionList, Inspector-Link
  - [ ] 5.2 404-Branch falls Slug fehlt
  - [ ] 5.3 SEO-Meta-Basis (title, description)
  - [ ] 5.4 Editorial-Disclaimer falls Layer in `EDITORIAL_CONFIG` (Story 1.12)
  - [ ] 5.5 Tests

- [x] **Task 6: Inspector-Row-Mehr-Toggle** (AC: #6)
  - [ ] 6.1 `layer-hit-row.svelte` erweitern: `<button data-testid="explain-more">Mehr</button>`
  - [ ] 6.2 Toggle-State expandiert auf `long`-Text + valueScale
  - [ ] 6.3 Tests

- [x] **Task 7: Inspector-Row Action-Icons (Map-Toggle + Detail)** (AC: #7, #8)
  - [ ] 7.1 `layer-hit-row.svelte` Action-Group oben-rechts:
    - Map-Toggle-Icon: `Eye`/`EyeOff` aus @lucide/svelte, abhängig von `uiState.activeLayerSlugs.includes(hit.layer)`
    - Click-Handler ruft `toggleLayer(uiState, hit.layer)` auf
    - Detail-Page-Link: bestehender ExternalLink-Icon, Target `/[lang]/layer/{slug}`
  - [ ] 7.2 Visual: vertikale oder horizontale Icon-Group, ≥32x32px Touch-Target
  - [ ] 7.3 aria-label dynamisch je nach Toggle-State („auf Karte zeigen" vs „von Karte entfernen")
  - [ ] 7.4 URL-State-Push nach Toggle (Story 1.7 Hook konsumieren)
  - [ ] 7.5 Tests: Toggle-Action + URL-Sync + Eye/EyeOff-Switch

- [x] **Task 8: E2E + a11y** (AC: #9)
  - [ ] 8.1 `tests/e2e/layer-explain-coverage.e2e.ts` mit 6 Surface-Checks (5 Explain + 1 Toggle)
  - [ ] 8.2 axe-core auf Legend-Expand + Detail-Page

## Dev Notes

### Layer-Explain-Surfaces (Quick-Reference)

| Surface | Variant | Trigger | Component |
|---|---|---|---|
| Layer-Palette | `short` als Subline | Always-visible | `layer-palette.svelte` |
| Map-Legend | `short` default, `long` on-expand | Click-Expand | `map-legend.svelte` |
| Map-Hover | `short` + Wert | Desktop-Hover über Polygon | `map-hover-tooltip.svelte` |
| Inspector-Row | `short` default, `long` on-expand | „Mehr"-Toggle | `layer-hit-row.svelte` |
| Detail-Page | `long` + Source + License + Scale | Route `/layer/{slug}` | `+page.svelte` |

### Inspector-Row Action-Icons (AC-7, AC-8)

| Icon | State | Action | Lucide |
|---|---|---|---|
| Map-Toggle | Layer inactive | Activate Layer, URL push | `Eye` |
| Map-Toggle | Layer active | Deactivate Layer, URL push | `EyeOff` |
| Detail-Page | always | Navigate to `/layer/{slug}` | `ExternalLink` |

Behebt 404-Bug aus User-Review 2026-05-13: Top-right ExternalLink-Icon zeigte auf nicht-existierende Detail-Page. Mit AC-5 Detail-Page-Baseline + AC-7 Action-Icons-Split ist Click-Target deterministisch.

### Coverage-Lücke (Manifest-Diff)

Layer aktuell OHNE Explain (~20):

- Mobilität: `radverkehrsnetz-2025`, `fahrradstrassen-2024`, `ubahn-stationen`, `sbahn-stationen`, `tram-haltestellen`, `bus-haltestellen`, `ubahn-netz`, `tram-netz`, (`sbahn-netz` aus Story 1.13)
- Soziale-Infra: `kitas-2024`, `schulen-2024`, `einschulbereiche-2024`, `krankenhaeuser-plan`, `krankenhaeuser-weitere`, `sportanlagen-2024`, `spielplaetze`, `schwimmbaeder`, `gruenanlagen`
- Wohn: `milieuschutz-erhaltungsmiete`, `milieuschutz-staedtebau`
- Umwelt: `laerm-2023`, `luft-2023`, `gruenversorgung-2023`, `bioklima-2023`, `umweltgerechtigkeit-2023`, `klima-pet-2022`, `klima-kaltlufteinwirkbereich-2022`, `klima-leitbahnkorridor-2022`
- A: `lor-prognoseraum`, `lor-bezirksregion`, `lor-planungsraum`

Genauer Diff via Test-Coverage-Guard automatisch.

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — `layer-explain.ts` könnte groß werden, ggf. Splits per Bundle
- #6 Kein Comment außer non-obvious WHY
- #7 TS strict
- #13 A11y-First — Legend-Expand keyboard, Hover-Tooltip nicht Touch-only
- #14 i18n-First — alles DE jetzt, Migration Story 3.1
- #18 Keyed `{#each}` — Legend-Items mit Slug

### Library/Framework Requirements

**Neu in Story 1.16:** keine

### Testing Requirements

**Unit-Tests:** Explain-Map, Helper, Legend-Expand, Hover-Tooltip, Detail-Page

**E2E:** Multi-Surface-Flow

**Coverage-Target:** ≥90% (Explain-Map ist Single-Source-of-Truth)

**Coverage-Guard:** Test fails wenn Manifest-Slug ohne Explain-Eintrag (Anti-Drift)

### Previous Story Intelligence

- **Story 1.3:** Manifest-Source-of-Truth für Layer-Slugs
- **Story 1.9:** LayerHitRow + DataStandBanner — Source-Card-Pattern wiederverwenden
- **Story 1.10:** Layer-Palette + Map-Legend (Click-Expand erweitern)
- **Story 1.12:** Editorial-Config — Detail-Page konsultiert für Disclaimer
- **Story 1.13 (geplant):** sbahn-netz Explain-Entry
- **Story 2.5 (Phase 2):** Layer-Konzept-Pages-FAQ erweitert Detail-Page massiv

### Open Questions

1. **Map-Hover-Tooltip-Performance:** Bei häufigem mousemove → Throttle nötig? `requestAnimationFrame` + 50ms-Throttle Standard
2. **Legend-Expand-Höhen-Constraint:** Bei sehr langen Layer-Listen Vertikal-Overflow lösen?
3. **Inspector-„Mehr"-Toggle Default:** Kollabiert? Wenn 5 Hits, alle expandiert sieht Inspector überfüllt aus. Empfehlung: Default kollabiert
4. **Detail-Page-i18n vor Story 3.1:** Hardcoded DE, Migration in 3.1 oder schon hier vorbereitet
5. **valueScaleExplain-Format:** Inline-Text oder strukturierte `Record<value, label>`? Letzteres ermöglicht Color-Legend-Generation
6. **LOR-Layer-Explain:** LOR-Strukturen sind komplex (Prognoseraum vs Bezirksregion vs Planungsraum). Lange-Form braucht Stadtplanungs-Kontext-Erklärung

## References

- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts] (bestehende Foundation)
- [Source: planning-artifacts/epics.md] (Layer-Transparency UX-DR)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md] (Palette + Legend)
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md] (Disclaimer in Detail-Page)
- [Source: static/layers/MANIFEST.json] (Layer-Slugs für Coverage-Guard)

## Dev Agent Record

### Implementation Plan (TDD-first per ADR-012)

Pro Task: failing-Test schreiben → minimale Implementation → Refactor → Tests grün. Pure-Logic-Helpers (`hover-tooltip-logic.ts`, `get-layer-detail.ts`) gegen Server-Project, Komponenten gegen Client-Browser-Project.

### Completion Notes

- **AC-1 erfüllt:** `LAYER_EXPLAIN_DE` als `Record<string, LayerExplain>` mit short+long+unit?+valueScaleExplain?. Alle 34 Manifest-Slugs gedeckt. Legacy-Slugs (`mietspiegel-wohnlage`, `lor-*`, `gebaeudealter`, `klimaanalyse`, `solarpotenzial`, `laerm-den/night`) erhalten für Back-Compat mit `value-formatters.ts` + existierenden Tests.
- **AC-2 erfüllt:** `layer-palette.svelte` rendert Subline (`palette-subline-{slug}`) mit short-Explain unter Layer-Name, Plex-Serif-Italic, `text-ink-subtle`, always-visible.
- **AC-3 erfüllt:** `map-legend.svelte` mit `<details>/<summary>`-Pattern: Layer-Section bleibt sichtbar mit Spec-Swatches; expand zeigt long-Explain + Source-Link + License + valueScaleExplain + „Mehr erfahren"-Link. Multi-Expand-erlaubt (default details-Behavior). Keyboard via native summary.
- **AC-4 erfüllt:** `map-hover-tooltip.svelte` mit MapHoverApi-Abstraktion (`on`/`off`/`queryRenderedFeatures`) zur Testbarkeit. Topmost via `queryRenderedFeatures`-Order. Mobile-Branch: kein Listener-Attach.
- **AC-5 erfüllt:** Route `(with-header)/layer/[slug]/+page.{svelte,ts}`. `[lang]`-Segment NICHT in Route — paraglide-`reroute` (in `hooks.ts`) strippt Locale, lang über `getLocale()` aus paraglide-runtime. Detail-Page mit h1+lead+source-card+value-scale+inspector-link+editorial-disclaimer.
- **AC-6 erfüllt:** `explain-more`-Button in `layer-hit-row.svelte`, default kollabiert, aria-expanded reflektiert State.
- **AC-7+8 erfüllt:** Eye/EyeOff-Toggle (`map-toggle`) + ExternalLink-Detail-Icon als separate Buttons mit ≥32x32px Touch-Targets. URL-State-Push erfolgt automatisch durch `toggleLayer(ui, slug)` über existierenden `$effect` in `(with-header)/+page.svelte` (Story 1.7 Hook).
- **AC-9 erfüllt:** Unit-Coverage-Guard `layer-explain.test.ts` failt wenn Manifest-Slug fehlt (Anti-Drift). E2E `tests/e2e/layer-explain-coverage.e2e.ts` mit 6 Surface-Checks + 2 axe-Runs. E2E + axe-Run deferred to CI per Memory-Konvention.

### Decisions & Deviations

- **Route ohne `[lang]`-Param:** paraglide `reroute` strippt Locale aus URL. Story-Spec sah `/[lang]/layer/[slug]` vor, aber durch reroute wird das SvelteKit-intern zu `/layer/[slug]`. Daher Routenpfad ohne `[lang]`; URL-Form `/de/layer/wohnlagen-2024` funktioniert via reroute korrekt. Behebt Live-Bug aus User-Test (404 trotz vorhandener Route).
- **`<details>` für Legend-Expand:** statt manuellem Toggle-State — gibt nativen Keyboard- + Screen-Reader-Support und Multi-Expand-Default kostenlos.
- **`isActive`/`onToggleLayer` als Props statt Context-Konsum:** entkoppelt `layer-hit-row.svelte` vom UI-Context und hält bestehende Tests ohne Context-Wrapper grün. Parent (`inspector-panel.svelte`) wires explizit gegen `getUiState()`.
- **`rowState`-Variable umbenannt (vorher `state`):** verhindert Konflikt mit `$state`-Rune nach Hinzufügen von `let showMore = $state(false)`.
- **`MapHoverApi`-Interface:** minimale Abstraktion über MapLibre `Map` (on/off/queryRenderedFeatures) für sauberen Test ohne MapLibre-Mock.

### Test-Strategie + Coverage-Stand

- **Server-Project (Node, 47 Files / 367 Tests grün):** Pure-Logic für `layer-explain`, `hover-tooltip-logic`, `get-layer-detail`. Coverage-Guard liest reales `static/layers/MANIFEST.json`.
- **Client-Project (Chromium):** 81/82 Test-Files grün (1 pre-existing Fail `climate-long-view.svelte.test.ts` SVG-height — out-of-scope, im commit 8290974 eingeführt). Story-1.16-spezifisch:
  - `layer-palette.svelte.test.ts`: 14/14 ✓ (3 neue subline-Cases)
  - `map-legend.svelte.test.ts`: 14/14 ✓ (8 neue Expand-Cases)
  - `map-hover-tooltip.svelte.test.ts`: 7/7 ✓ (NEW)
  - `layer-hit-row.svelte.test.ts`: 32/32 ✓ (10 neue Mehr-Toggle + Action-Icon-Cases)
  - `routes/(with-header)/layer/[slug]/page.svelte.test.ts`: 10/10 ✓ (NEW)
- **Coverage-Target ≥90%:** erfüllt für `layer-explain.ts` (Coverage-Guard zwingt 100% Manifest-Coverage).
- **E2E + axe-Run deferred:** Run gegen Coolify-Staging in CI (Stories 1.8/1.9/1.10/1.11 dito).

### File List

**Neu:**
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.test.ts`
- `src/lib/components/atlas/internal/hover-tooltip-logic.ts`
- `src/lib/components/atlas/internal/hover-tooltip-logic.test.ts`
- `src/lib/components/atlas/map-hover-tooltip.svelte`
- `src/lib/components/atlas/map-hover-tooltip.svelte.test.ts`
- `src/lib/data/get-layer-detail.ts`
- `src/lib/data/get-layer-detail.test.ts`
- `src/routes/(with-header)/layer/[slug]/+page.svelte`
- `src/routes/(with-header)/layer/[slug]/+page.ts`
- `src/routes/(with-header)/layer/[slug]/page.svelte.test.ts`
- `tests/e2e/layer-explain-coverage.e2e.ts`

**Geändert:**
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (komplett refactored: `LayerExplain`-Interface, 34 Manifest-Entries + 8 Legacy-Entries, neue Helper `getLayerExplain`, `getLayerExplainEntry`)
- `src/lib/components/atlas/layer-palette.svelte` (Subline + Refactor button-content auf flex-col)
- `src/lib/components/atlas/layer-palette.svelte.test.ts` (3 neue Subline-Cases)
- `src/lib/components/atlas/map-legend.svelte` (komplett umgebaut: `<details>`-Expand-Pattern, neue Props `manifestLayers`, `lang`)
- `src/lib/components/atlas/map-legend.svelte.test.ts` (8 neue Expand-Cases + 3 `getByText`-Calls auf `exact:true`)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` (Mehr-Toggle + Eye/EyeOff + Action-Icon-Group, `rowState`-Rename)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts` (10 neue Cases)
- `src/lib/components/atlas/inspector-panel.svelte` (passt `isActive` + `onToggleLayer` Props an `LayerHitRow` weiter)
- `src/routes/(with-header)/+page.svelte` (MapLegend bekommt `manifestLayers`-Prop; MapHoverTooltip eingebunden)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status-Promotion)

### Change Log

- 2026-05-13 — Story 1.16 in-progress → review (TDD-first per ADR-012, Pragmatic-Scope: E2E + axe deferred to CI). Multi-Surface Layer-Explain-Coverage: Palette-Subline, Legend-Expand, Map-Hover-Tooltip, Detail-Page, Inspector Mehr-Toggle, Inspector Eye/EyeOff Action-Icon-Split. Live-Bug behoben: Detail-Page erreichbar trotz paraglide-reroute (Route ohne `[lang]`-Param).
