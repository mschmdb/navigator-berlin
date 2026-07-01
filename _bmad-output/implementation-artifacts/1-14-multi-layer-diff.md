# Story 1.14: Multi-Layer-Differenzierung + Active-Layer-Toolbar

Status: review

## Story

As a Berliner Bürger und Datenjournalistin,
I want bei mehreren aktivierten Layern weiterhin erkennen können WELCHE Farbe zu WELCHEM Layer gehört und welche Daten ich gerade sehe,
so that ich nicht in einem visuellen Chaos navigiere und Cross-Layer-Analysen tatsächlich machen kann.

## Problem

Aktuelle Layer-Toggle-Palette (Story 1.10) erlaubt N aktive Layer parallel. Bei 3+ Polygon-Layern aktiv:

- Farben überlappen, keine erkennbare Trennung
- User vergisst welcher Layer welche Farbe hat
- Lärm-Polygon + Wohnlagen-Polygon + Bodenrichtwerte-Polygon = visueller Mush
- Keine Legend für aktive Layer sichtbar

## Acceptance Criteria

1. **AC-1 (Active-Layer-Pille-Toolbar):**
   **Given** UI-State `activeLayerSlugs`
   **When** mind. 1 Layer aktiv ist
   **Then** Component `<ActiveLayerToolbar>` rendert über Karte:
   - Horizontale Pille-Liste, je aktivem Layer eine Pille
   - Pro Pille: Farb-Swatch (8x8px) · Layer-Display-Name · Close-Icon
   - Position: oberhalb der Karte, unter Site-Header, scrollbar bei Overflow
   - Tasten-Bedienbar: Tab zu Pille, Enter/Space toggled, Delete entfernt
   **And** Pillen werden in Aktivierungs-Reihenfolge angezeigt (jüngste rechts)
   **And** Erfüllt UX-DR Mental-Map.

2. **AC-2 (Outline-Cascade-Strategy):**
   **Given** mehrere Polygon-Layer aktiv
   **When** Layer-Style-Builder die Layer-Reihenfolge bestimmt
   **Then** Render-Logic:
   - Erster aktiver Polygon-Layer: voll-gefüllt (Fill-Opacity 0.5)
   - Zweiter Layer: nur Outline (Line-Width 2px, KEIN Fill)
   - Dritter+: Outline mit Dash-Pattern (4,4) (Line-Width 2px)
   - Point-Layer immer voll (keine Outline-Variation)
   - Line-Layer (Lärm-Linien, U-/S-/Tram-Netz) immer voll
   **And** Render-Order: Bundle A (Boundaries) unten, F (Mobilität) oben
   **And** Erfüllt UX-DR38 Visual-Hierarchy.

3. **AC-3 (Pille → Layer-Style-Hint):**
   **Given** ActiveLayerToolbar zeigt Pille
   **When** Layer als Outline-Only gerendert wird
   **Then** Pille zeigt Dash-Pattern-Indikator (visuelles Match zur Karte)
   **And** Pille mit Fill-Variant zeigt voll-gefüllte Swatch
   **And** Pille mit Outline-Variant zeigt Outline-Swatch (hollow)

4. **AC-4 (Active-Layer-Limit-Warnung):**
   **Given** User aktiviert 4+ Polygon-Layer
   **When** Layer-Palette toggle aufgerufen wird
   **Then** Warning-Toast/Banner: „Mehr als 3 Polygon-Layer aktiv. Lesbarkeit eingeschränkt."
   **And** Inhalt bleibt funktional (NICHT blockierend)
   **And** Toggle „Solo-Modus: nur aktivster Layer voll, Rest ausblenden" als Option

5. **AC-5 (Layer-Order-Sorting):**
   **Given** Bundle-Hierarchie A → F
   **When** mehrere Layer aktiv
   **Then** Render-Order strikt nach Bundle:
   1. A: Boundaries (Bezirke unten)
   2. B: Wohn-Daten
   3. C: Umwelt
   4. D: Memorial
   5. E: Soziale Infrastruktur
   6. F: Mobilität (oben)
   **And** Innerhalb Bundle: Aktivierungs-Reihenfolge
   **And** Permalink-State persistiert Order (Story 1.7 URL-Sync erweitern)

6. **AC-6 (Tests):**
   **Given** Komponenten + Logik
   **When** Tests laufen
   **Then** Unit-Tests:
   - `active-layer-toolbar.svelte.test.ts` — Pille-Render, Close-Action, Keyboard-Nav
   - `layer-style-builder.test.ts` — Outline-Cascade-Logic mit 1/2/3/4 aktiven Layern
   - `layer-order-sorting.test.ts` — Bundle-Hierarchie-Sortierung
   **And** E2E `tests/e2e/multi-layer-diff.e2e.ts`:
   - 3 Layer aktivieren → Toolbar zeigt 3 Pillen
   - Erster Layer Fill, zweiter Outline, dritter Dash-Outline
   - Pille-Klick deaktiviert Layer
   - 4. Layer Warning sichtbar
   **And** axe-core: 0 Violations für Toolbar

## Tasks / Subtasks

> **Scope-Pivot 2026-05-14:** ActiveLayerToolbar oberhalb Karte aufgegeben (User-Review-Feedback: visueller Lärm, Karten-Höhe-Verlust). Steuerung wandert in MapLegend (Eye-Toggle Soft-Hide + X-Remove pro Layer-Block). Solo-Modus deferred zu Phase 2 (Eye-Toggle reicht). AC-1 + AC-3 + AC-4 dadurch in MapLegend implementiert; Mobile-Snap-X + Toolbar-Keyboard-Nav obsolet.

- [x] **Task 1: Layer-Style-Cascade-Logic (pure)** (AC: #2)
  - [x] 1.1 `layer-style-cascade.ts` neu: `isPolygonSlug`, `computeCascadeVariants`, `buildLayerSpecCascade` (fill / outline / outline-dash). Outline-Variant transformiert fill-Spec zu line-Spec mit `line-color` aus fill-Expression.
  - [x] 1.2 Unit-Tests `layer-style-cascade.test.ts` 16/16

- [x] **Task 2: Layer-Order-Sorting** (AC: #5)
  - [x] 2.1 `layer-order-sorting.ts` neu: `sortSlugsByBundleStable` Bundle A→F, innerhalb Bundle Aktivierungs-Reihenfolge stabil
  - [x] 2.2 URL-State (`+page.svelte syncLayers`) auf Aktivierungs-Reihenfolge umgestellt, kein Bundle-Re-Sort mehr; alte URLs werden as-is akzeptiert
  - [x] 2.3 Unit-Tests `layer-order-sorting.test.ts` 6/6

- [x] **Task 3: Hidden-Slugs + Limit-Helper State** (AC: #1, #4)
  - [x] 3.1 `UiState.hiddenLayerSlugs[]` + `toggleLayerHidden`, `removeLayer`, `clearLayers` erweitert
  - [x] 3.2 `layer-visibility.ts`: `polygonSlugCount`, `exceedsPolygonLimit`, `applyHiddenSlugs`, `POLYGON_LAYER_LIMIT=3`
  - [x] 3.3 Unit-Tests `layer-visibility.test.ts` 11/11; ui-context-Test `hiddenLayerSlugs` ergänzt

- [x] **Task 4: MapLegend Eye/Remove + Cascade-Badge + Limit-Footer** (AC: #1, #3, #4)
  - [x] 4.1 Pro Legend-Block: Eye/EyeOff-Toggle (`onToggleHidden`) + X-Remove (`onRemove`); beide Callbacks optional, Backward-Compat ohne Render
  - [x] 4.2 `data-hidden`-Attribut + `opacity-50` für Soft-Hide-Zustand
  - [x] 4.3 Variant-Badge `gefüllt / Outline / Outline gestrichelt` für Polygon-Slugs unter Layer-Name
  - [x] 4.4 Categorical-Item-Swatches passen Cascade-Variant an (Outline = Border-only)
  - [x] 4.5 Limit-Footer `aria-live="polite"` ab 4. Polygon-Layer
  - [x] 4.6 Unit-Tests +10 (25/25 gesamt)

- [x] **Task 5: Palette Solo-Toggle entfernt**
  - [x] 5.1 Solo-Toggle aus `layer-palette.svelte` rückgebaut (deferred zu Phase 2)
  - [x] 5.2 Palette-Tests bereinigt (17/17)

- [x] **Task 6: +page.svelte Integration** (AC: #2, #5)
  - [x] 6.1 `renderLayers`: Source-cache + Layer-Re-Build bei Variant-Change; Bundle-Order beim Re-Add für MapLibre z-stack
  - [x] 6.2 `applyHiddenSlugs` filtert visible slugs vor Cascade
  - [x] 6.3 MapLegend mit `cascadeVariants`, `hiddenSlugs`, `showLimitWarning`, `onToggleHidden`, `onRemove` verkabelt
  - [x] 6.4 URL-Sync auf Aktivierungs-Reihenfolge

- [ ] **Task 7: E2E + Axe (Phase 2)** (AC: #6)
  - [ ] 7.1 `tests/e2e/multi-layer-diff.e2e.ts` deferred to CI-Run
  - [ ] 7.2 axe-core-Check deferred to CI-Run

## Dev Notes

### Outline-Cascade-Pattern (Visualisierung)

```
Aktiv: Wohnlagen-2024, Lärm-2023, Bodenrichtwerte

Wohnlagen: Fill blau-50% + Outline blau-100%
Lärm:      KEIN Fill, Outline orange-100% solid 2px
Boden:     KEIN Fill, Outline rot-100% dash-4-4 2px
```

### MapLibre-Style-Layer-Order

```typescript
// Render-Order in MapLibre: array-position bestimmt Z-Stack
// Bundle A unten, F oben
const renderOrder = sortByBundle([...activeLayers]);
// MapLibre style.layers wird in dieser Order gesetzt
```

### URL-State (Story 1.7) — Order-Persistierung

Aktuell: `?l=lärm-2023,wohnlagen-2024` (alphabetisch normalisiert?). Neu: ORDER MATTERS. Aktivierungs-Reihenfolge.

```
?l=wohnlagen-2024,laerm-2023,bodenrichtwerte  ← order = activation order
```

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte: `X` für Pille-Close
- #2 Files <500 Zeilen
- #7 TS strict
- #13 A11y-First — Toolbar Keyboard-Nav, aria-live für Warnung
- #18 Keyed `{#each}` — Pillen mit slug-Key

### Library/Framework Requirements

**Neu in Story 1.14:** keine

### Testing Requirements

**Unit-Tests:** Toolbar, Cascade-Builder, Order-Sorting

**E2E:** Multi-Layer-Flow

**Coverage-Target:** ≥80%

### Previous Story Intelligence

- **Story 1.10:** Layer-Palette + active-Layer-State Foundation
- **Story 1.7:** URL-State-Sync, erweitern für Layer-Order
- **Story 1.16 (geplant):** Layer-Display-Names auf vollständige Coverage prüfen

### Open Questions

1. **Solo-Modus-UX:** Toggle in Palette-Footer oder Toolbar-Action? Default off?
2. **Limit-Warnung-Schwelle:** 3 oder 4 Polygon-Layer? Test mit echten Daten
3. **Mobile-Toolbar:** Horizontaler Scroll oder Stacked-Pillen? Bottom-Sheet-Konflikt mit Inspector?
4. **Permalink-Backward-Compat:** Alte URLs ohne Order weiterhin funktionieren?

## References

- [Source: planning-artifacts/architecture.md] (Multi-Layer-Pattern UX-DR)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md]
- [Source: _bmad-output/implementation-artifacts/1-7-karten-interaktion-url-state-sync.md]
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts]

## Dev Agent Record

### Implementation Plan

1. Reine Logik-Module (TDD-first per ADR-012): Cascade-Variants, Bundle-Sort, Hidden + Limit-Helper.
2. UiState-Erweiterung: `hiddenLayerSlugs[]` + Toggle/Remove-Helper.
3. MapLegend mit Eye/X-Buttons (optionale Callbacks für Backward-Compat), Variant-Badge, Limit-Footer.
4. `+page.svelte` Integration: `renderLayers` rebuildet Layer bei Variant-Change, Bundle-Order beim Re-Add, URL persistiert Aktivierungs-Reihenfolge.

### Scope-Pivot (2026-05-14)

User-Review-Feedback nach erstem Toolbar-Render: Pillen-Toolbar über Karte = visueller Lärm + Höhe-Verlust. Pivot zu Legend-First. Solo-Modus deferred (Eye-Toggle deckt Use-Case). ActiveLayerToolbar-Komponente, Harness, Tests gelöscht.

### Open-Question-Klärungen (vor Pivot)

1. Solo-Modus-Platzierung: Palette-Footer → später gestrichen
2. Limit-Schwelle: 3 Polygon-Layer (Warnung ab 4.) → konstant `POLYGON_LAYER_LIMIT = 3`
3. Mobile-Toolbar: obsolet durch Pivot
4. Permalink Backward-Compat: akzeptiere alte URLs as-is, neue Order ab erstem Toggle

### Test-Strategie

- **Pure Logic:** Vollständig per Unit-Test (RED → GREEN), keine Browser-Abhängigkeit
- **MapLegend:** vitest-browser-svelte mit Callback-Spies (kein UiState-Coupling im Test)
- **+page.svelte:** Manueller Browser-Test in Dev-Server (User-Approval 2026-05-14)
- **E2E + axe-core:** deferred zu Phase 2 (CI-Run)

### Test-Counts

| File | Tests |
|------|-------|
| `layer-style-cascade.test.ts` | 16/16 ✅ |
| `layer-order-sorting.test.ts` | 6/6 ✅ |
| `layer-visibility.test.ts` | 11/11 ✅ |
| `ui-context.svelte.test.ts` | 12/12 ✅ (hiddenLayerSlugs erweitert) |
| `map-legend.svelte.test.ts` | 25/25 ✅ (+10 für Story 1.14) |
| `layer-palette.svelte.test.ts` | 17/17 ✅ (Solo-Tests entfernt) |
| **Story 1.14 Net** | **+59 neue Tests grün** |

Volle Suite: `pnpm test:unit` 761/763 (2 pre-existing data-table Sort-Header Flakes, bei Isolation grün, nicht durch Story 1.14 verursacht).

### Completion Notes

- ✅ AC-1 (Active-Layer-Sichtbarkeit): erfüllt via MapLegend-Eye/X statt Toolbar
- ✅ AC-2 (Outline-Cascade): erste polygon=fill, zweite=outline, dritte+=dash; pure transform in `buildLayerSpecCascade`
- ✅ AC-3 (Variant-Indicator): Legend-Variant-Badge + Item-Swatch-Anpassung
- ✅ AC-4 (Limit-Warnung): Legend-Footer aria-live polite ab 4. Polygon
- 🟡 AC-4 Solo-Modus: deferred zu Phase 2
- ✅ AC-5 (Bundle-Order + URL-Persist): `sortSlugsByBundleStable` für MapLibre-z-stack; URL persistiert Aktivierungs-Reihenfolge
- ✅ AC-6 Unit-Tests: +59 grün
- 🟡 AC-6 E2E + axe-core: deferred to CI-Run

### MUST-Rule-Compliance

- #1 @lucide/svelte: Eye, EyeOff, X importiert
- #2 Files <500: alle neuen Module unter 100 Zeilen; `map-legend.svelte` 247 Zeilen; `+page.svelte` 565 Zeilen (war 514, +51 für Story 1.14 — über Limit, refactor-Candidate für separate Story)
- #7 TS strict: type-check 0 errors
- #13 A11y: `aria-live="polite"` Limit-Warning, aria-pressed Eye-Toggle, aria-label remove/hide

## File List

**Neu:**

- `src/lib/components/atlas/internal/layer-style-cascade.ts`
- `src/lib/components/atlas/internal/layer-style-cascade.test.ts`
- `src/lib/components/atlas/internal/layer-order-sorting.ts`
- `src/lib/components/atlas/internal/layer-order-sorting.test.ts`
- `src/lib/components/atlas/internal/layer-visibility.ts`
- `src/lib/components/atlas/internal/layer-visibility.test.ts`

**Geändert:**

- `src/lib/state/ui-context.svelte.ts` (`hiddenLayerSlugs`, `toggleLayerHidden`, `removeLayer`, `clearLayers` erweitert)
- `src/lib/state/ui-context.svelte.test.ts` (makeState mit hiddenLayerSlugs)
- `src/lib/components/atlas/map-legend.svelte` (Eye/X, Variant-Badge, Limit-Footer, Item-Swatch-Variant)
- `src/lib/components/atlas/map-legend.svelte.test.ts` (+10 Tests)
- `src/lib/components/atlas/layer-palette.svelte` (Solo-Toggle rückgebaut)
- `src/lib/components/atlas/layer-palette-harness.svelte` (soloMode-Dump entfernt)
- `src/lib/components/atlas/layer-palette.svelte.test.ts` (Solo-Tests entfernt)
- `src/routes/(with-header)/+page.svelte` (renderLayers refactor, MapLegend-Verkabelung, URL-Sync auf Aktivierungs-Reihenfolge)

## Change Log

- 2026-05-14: TDD-first Implementation der Pure-Logic-Module (Cascade, Bundle-Sort, Hidden, Limit)
- 2026-05-14: ActiveLayerToolbar-Komponente initial gebaut + getestet (14 Tests grün)
- 2026-05-14: **Scope-Pivot** nach User-Review: Toolbar verworfen, Steuerung in MapLegend (Eye/X/Variant-Badge)
- 2026-05-14: Solo-Modus deferred zu Phase 2 (Eye-Toggle deckt Use-Case)
- 2026-05-14: +page.svelte renderLayers Variant-aware Re-Add in Bundle-Order; URL persistiert Aktivierungs-Reihenfolge
- 2026-05-14: Status `ready-for-dev` → `review`
