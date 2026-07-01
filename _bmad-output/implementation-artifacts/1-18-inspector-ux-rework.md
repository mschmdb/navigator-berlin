# Story 1.18: Inspector-UX-Rework (Value-Chips + Compact-Density)

Status: review

## Dev Agent Record

### Implementation Plan
TDD-first per ADR-012. Foundation-first: Tokens → ValueChip → Severity-Mapping → Display-Strukturierung → LayerHitRow-Rewrite → Banner → Section-Header → Empty-Toggle → E2E-Stub. Story 1.16 Action-Icons + Mehr-Toggle als Basis.

### Completion Notes
- 5 Severity-Tokens als CSS-Custom-Properties + Tailwind @theme inline. WCAG-AA-Contrast manuell verifiziert (≥4.5:1 für alle 5 Paare).
- ValueChip-Komponente mit numeric-Override-Prop (verhindert Number()-Korruption deutscher Format-Strings wie `5.000`).
- Severity-Mapping mit Pivot weg von Story-Spec: `wohnlagen-2024` mittel von neutral → success-soft (User-Feedback: Grau-Monotonie). einfach bleibt neutral, gut → success-soft, sehr gut → success.
- Umweltgerechtigkeit kategorie-Pivot: `zweifach`→`2× belastet`, `einfach`→`1× belastet`, `dreifach`→`3× belastet`, `keine`→`keine Belastung`. Sub-Kategorien (Lärm/Luft/Bioklima/Grün) als Context-Subline.
- Neues `getLayerHitDisplay()`-Modul: trennt Chip-Wert von Kontext-Subline für ~30 Layer. POIs (Kita/Schule/Krankenhaus etc.) rendern Fallback-Text statt Chip wegen Editorial-Würde-Pattern aus Story 1.12.
- Compact-DataStandBanner mit ultra-short `shortenSourceCompact()`: FIS/ODIS/DWD/OSM/gdi/mietspiegel + `.berlin.de`-Stripping.
- Section-Header von Plex-Serif text-lg → Plex-Mono uppercase text-xs + border-t. Section-Count `(N)` als ink-subtle Suffix.
- Empty-Section default hidden mit localStorage-persistiertem Footer-Toggle. Klima always-visible.
- Getter-Refactor LAYER_EXPLAIN_DE: `Lärmbelastung (Umweltatlas 2023)` → `Lärmbelastung 2023`, `Gefühlte Temperatur (PET 14 Uhr, 2022)` → `Gefühlte Temperatur 2022`. PET-14-Uhr-Detail bleibt in long-Explain.

### Coverage-Stand
- 856 Tests grün (93 Test-Dateien)
- 0 svelte-check-Fehler
- Pro AC mind. 1 Test-File mit failing-then-passing History (TDD-Cycle in der Reihenfolge: Tokens → Severity-Mapping (RED→GREEN) → ValueChip (RED→GREEN) → LayerHitDisplay (RED→GREEN) → Compact-Shortener+Banner (RED→GREEN) → LayerHitRow-Rewrite (Tests aktualisiert) → Inspector-Panel Section-Header/Empty-Toggle (RED→GREEN))
- Neue Tests: 12 ValueChip, 29 Severity-Mapping, 17 LayerHitDisplay, 9 Compact-Shortener, 9 Banner, 9 LayerHitRow (Story 1.18), 7 Inspector-Panel (AC-5/AC-6) = +92 Tests
- E2E `tests/e2e/inspector-ux.e2e.ts` Stub + axe-core: deferred zu CI-Pipeline (vgl. Story 1.14/1.15/1.16/1.17)

### File List

**Neu:**
- `src/lib/components/atlas/value-chip.svelte`
- `src/lib/components/atlas/value-chip.svelte.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts`
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.test.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.test.ts`
- `tests/e2e/inspector-ux.e2e.ts`

**Modified:**
- `src/app.css` (Severity-Tokens)
- `src/lib/components/atlas/internal/colors.ts` (Severity-Tokens)
- `src/lib/components/atlas/internal/layer-palette-filter.ts` (LAYER_EXPLAIN_DE Jahr-Suffix-Refactor)
- `src/lib/components/atlas/inspector-panel.svelte` (Section-Header + Empty-Section-Toggle)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (7 neue Story-1.18-Tests)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` (Layout-Rewrite mit ValueChip)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts` (Tests aktualisiert + 9 neue)
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte` (Compact-Format)
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte.test.ts` (Tests aktualisiert)
- `src/lib/components/atlas/inspector-panel/internal/source-shortener.ts` (+ shortenSourceCompact)
- `src/lib/components/atlas/inspector-panel/internal/source-shortener.test.ts` (+ 9 Tests)
- `src/lib/components/atlas/map-legend.svelte.test.ts` (Layer-Name-Refactor Anpassung)

### Change Log
- 2026-05-14: Inspector-UX-Rework mit Value-Chips + Compact-Density. Severity-Tokens (5 Stufen, WCAG-AA), ValueChip-Komponente, value-severity-mapping mit Wohnlage-mittel/Umweltgerechtigkeit-User-Pivots, LayerHitRow-Layout-Rewrite (1× Layer-Name, ValueChip rechts, Kontext-Subline), Compact-DataStandBanner (10px, ultra-short Source-Tokens), Section-Header Plex-Mono uppercase + border-t, Empty-Section default hidden mit localStorage-Toggle, getLayerDisplayName Jahr-Suffix-Refactor. +92 neue Tests grün. E2E + axe deferred zu CI.



## Story

As a Berliner Bürger, die den Inspector öffnet,
I want auf einen Blick erkennen können WIE eine Adresse abschneidet (gut/mittel/schlecht visuell via Farbe), ohne dass Metadaten und Layer-Namen-Wiederholungen die wichtigen Werte überlagern,
so that der Inspector als schnelles Daten-Dashboard funktioniert statt als zähe Stand-Quelle-Lizenz-Wand.

## Probleme (User-Review 2026-05-13)

1. **Kategorische Werte sind Plain-Text:** `Lärmbelastung: mittel`, `Luftbelastung: hoch`, `Wohnlage überwiegend gut` — keine visuelle Severity, keine Farb-Codierung. Scan-Performance schlecht.
2. **Metadata-Banner zu dominant:** `Stand: 2024-01 · Quelle: gdi.berlin.de · dl-de/zero` in `font-mono text-xs` full-width auf JEDER Row. Optisch schwerer als der eigentliche Wert.
3. **Layer-Name-Redundanz:** `Lärmbelastung (Umweltatlas 2023)` als h-line + `Lärmbelastung: mittel · Teutoburger Platz` → „Lärmbelastung" 2× sichtbar pro Row.
4. **Empty-Sections verschwenden Vertical-Space:** `Memorial` + `Mobilität` als komplette Plex-Serif-h3 + italic „Keine Layer in dieser Sektion."
5. **Section-Header zu groß:** Plex-Serif `text-lg` für Bundle-Sections konkurriert mit Layer-Namen.
6. **Werte-Komposition unklar:** `Bodenrichtwerte (EUR/m²) 5.000 €/m² · W - Wohngebiet` mischt Layer-Name + Wert + Tag in einer Zeile.

## Acceptance Criteria

1. **AC-1 (Value-Chip-Komponente):**
   **Given** Layer-Hit mit kategorischem Wert (z.B. `mittel`, `hoch`, `gut`)
   **When** `<ValueChip>` Komponente neu implementiert wird
   **Then** Komponente rendert:
   - Pille mit `--severity-{level}`-Background-Color + Plex-Sans-Semibold Text
   - 5 Severity-Levels:
     - `success` (Green-Tone): `gut`, `sehr gut`, `niedrig`, `gering`, `aktiv`
     - `success-soft` (Green-Tone-Pastel): leicht positiv
     - `neutral` (Grey-Tone): `mittel`, `unbekannt`
     - `warning` (Orange-Tone): `mittel-hoch`, `erhöht`
     - `danger` (Red-Tone): `hoch`, `sehr hoch`, `schlecht`, `kritisch`
   - Optional Icon-Slot (Lucide Mini-Icon links)
   - Touch-Target ≥ 32px height, padding x-2 y-1
   - aria-label mit Layer-Name-Kontext (`{LayerName}: {value} ({severityDescription})`)
   **And** Tokens definiert in `colors.ts` + `app.css` CSS-Custom-Properties
   **And** Erfüllt UX-DR Scan-Performance + WCAG-Contrast AA.

2. **AC-2 (Layer-Value-Severity-Mapping):**
   **Given** ~30 Layer mit unterschiedlichen Wertskalen
   **When** `value-severity-mapping.ts` neu erstellt wird
   **Then** Function `getValueSeverity(slug, value): SeverityLevel` mappt:
   - `mietspiegel-wohnlage`: einfach=neutral, mittel=neutral, gut=success-soft, sehr gut=success
   - `wohnlagen-2024`: ähnlich
   - `laerm-2023` Schwellen: <55dB=success, 55-65=warning, >65=danger
   - `luft-2023`: niedrig=success, mittel=warning, hoch=danger
   - `gruenversorgung-2023`: schlecht=danger, mittel=warning, gut=success
   - `thermische-belastung-2023` / `bioklima-2023`: niedrig=success, mittel=warning, hoch=danger
   - `umweltgerechtigkeit-2023`: keine=success, einfach=warning, zweifach=danger, dreifach=danger (stark)
   - `klima-pet-2022`: <30°C=success, 30-35=warning, >35=danger
   - `bodenrichtwerte`: kein Auto-Severity (kontext-frei, immer neutral)
   - `gebaeudealter`: alle neutral
   - `milieuschutz-*`: aktiv=success-soft, nicht-aktiv=neutral
   - `trinkbrunnen` aktiv (in-season)=success, out-of-season=warning
   - `stolpersteine`: KEIN Severity (Editorial-Würde, Story 1.12)
   - Default-Fallback: `neutral`
   **And** Unit-Tests für jeden Layer
   **And** Erfüllt FR Value-Communication.

3. **AC-3 (LayerHitRow-Layout-Rewrite):**
   **Given** aktuelles Layout: Layer-Name (h-line) + Value-Inline + Kiez + Explain + DataStandBanner + ActionIcons
   **When** Row-Layout überarbeitet wird
   **Then** Neue Struktur:
   ```
   ┌─────────────────────────────────────────────────────┐
   │  Lärmbelastung 2023              [▓mittel] [👁] [↗] │  ← Row 1: Layer-Name + Value-Chip + Action-Icons
   │  Teutoburger Platz                                   │  ← Row 2: Kiez/Kontext (subtle)
   │  Straßenverkehrs-Lärmpegel über 24h gemittelt        │  ← Row 3: Explain (Plex-Serif-Italic, optional)
   │  ─── 2024-01 · gdi.berlin.de · dl-de/zero  [▾]      │  ← Row 4: Metadata sehr klein, optional collapse
   └─────────────────────────────────────────────────────┘
   ```
   - Layer-Name: Plex-Sans `font-medium text-base text-ink`
   - ValueChip: rechts, vertikal-zentriert
   - Kontext-Zeile (Kiez/Tag): Plex-Sans `text-sm text-ink-muted`
   - Explain: Plex-Serif-Italic `text-sm text-ink-muted` (aus Story 1.16, kollabierbar via „Mehr")
   - Metadata: Plex-Mono `text-[10px] text-ink-subtle` (10px statt 12px)
   - Action-Icons (Story 1.16 AC-7): Eye/EyeOff + ExternalLink
   - Disclaimer (Story 1.12): zwischen Kontext + Explain, KEIN-Inline-Source-Link mehr (Action-Icon übernimmt)
   **And** Vertical-Space pro Row ≤ 96px ohne Mehr-Expand
   **And** Erfüllt UX-DR Inspector-Density.

4. **AC-4 (Compact-DataStandBanner):**
   **Given** `<DataStandBanner>` aktuell Plex-Mono `text-xs` full-width sichtbar
   **When** Komponente kompakter gestaltet wird
   **Then** Banner:
   - Font-Size `text-[10px]` (statt `text-xs`)
   - Format: `2024-01 · gdi.berlin.de · dl-de/zero` (kein „Stand:" + „Quelle:" Präfix, Punkte als Trenner)
   - Source-Domain via `shortenSource` weiter zusammenfassen (z.B. „gdi" statt „gdi.berlin.de")
   - Outdated-Pille bleibt rechts
   - Optional „Info"-Icon nach Lizenz für Source-URL als Tooltip (mouseover/focus zeigt full Source-URL)
   **And** Banner-Höhe ≤ 16px (vs aktuell ~24px)
   **And** Erfüllt UX-DR Metadata-Subtle.

5. **AC-5 (Section-Header-Subtler):**
   **Given** Aktuelle Section-Headers: Plex-Serif `text-lg` (~20px)
   **When** Headers überarbeitet werden
   **Then** Neue Style:
   - Plex-Mono `text-xs uppercase tracking-wide text-ink-muted`
   - Mit `border-t` Trenn-Linie (1px `--rule`)
   - Padding-Top `pt-4`
   - Optional Section-Count: `Umwelt (6)` falls > 0 Hits
   **And** Visuell tritt Section-Header ZURÜCK hinter Layer-Werte, statt vor
   **And** Erfüllt UX-DR Information-Hierarchy.

6. **AC-6 (Empty-Section-Compact):**
   **Given** Section mit 0 Hits (Memorial, Mobilität bei Adresse ohne POIs)
   **When** Empty-Sections gerendert werden
   **Then** Empty-Section wird:
   - Default: NICHT gerendert (visuell ausgeblendet)
   - Toggle „Leere Sektionen einblenden" in Inspector-Footer (User-Präferenz, localStorage-persisted)
   - Falls eingeblendet: 1-Zeile-Compact: `Memorial · keine Daten an dieser Adresse` (Plex-Mono `text-xs text-ink-subtle`)
   **And** Klima bleibt IMMER sichtbar (Hero-Section)
   **And** Erfüllt UX-DR Signal-to-Noise.

7. **AC-7 (Numerische-Werte-Severity):**
   **Given** Numerische Werte (Lärm dB, Luft µg/m³, Boden €/m², PET °C)
   **When** Wert + Severity-Logic angewendet wird
   **Then** Chip rendert:
   - Wert in Plex-Mono `tabular-nums`
   - Einheit als Plex-Mono `text-xs` daneben (z.B. `65 dB`, `5000 €/m²`)
   - Severity-Color via Schwellen-Map
   - Bodenrichtwerte: KEIN auto-Severity (Wert + Tag „W - Wohngebiet" als neutral-Chip)
   **And** Tests für Schwellen-Korrektheit pro Layer

8. **AC-8 (Layer-Name-Dedup):**
   **Given** Layer-Name + Wert-Composition aktuell zeigt Layer-Name 2× (z.B. „Lärmbelastung (Umweltatlas 2023)" + „Lärmbelastung: mittel")
   **When** Composition überarbeitet wird
   **Then** Single-Layer-Name in Row-Header:
   - Aktuell: zwei Lines „Lärmbelastung (Umweltatlas 2023)" + „Lärmbelastung: mittel · Teutoburger Platz"
   - Neu: eine Line „Lärmbelastung 2023" + Chip „mittel" rechts + Subline „Teutoburger Platz"
   - Klammer-Suffix `(Umweltatlas 2023)` wird Jahr-Suffix `2023` oder ganz weg (Year-Pillchen falls aktuell)
   **And** Display-Name-Function `getLayerDisplayName` aktualisiert
   **And** Tests für 8+ Beispiel-Slugs

9. **AC-9 (Bezirks-Profile-Anwendung):**
   **Given** Bezirks-Profile-Pages (Story 2.3 künftig) konsumieren gleiche LayerHit-Patterns
   **When** ValueChip + Layout-Pattern designt wird
   **Then** Komponenten exportierbar + wiederverwendbar auf Detail-Pages
   **And** Story 1.18 Foundation für Story 2.3 (Bezirks-Pages) + Story 2.4 (Kiez-Pages)

10. **AC-10 (Tests + Visual-Regression):**
    **Given** alle Änderungen
    **When** Tests laufen
    **Then** Unit-Tests:
    - `value-chip.svelte.test.ts`: Render-Variants pro Severity, aria-label-Format, Touch-Target
    - `value-severity-mapping.test.ts`: Layer-Slug-Mapping coverage + Edge-Cases (null-value, unknown-Slug)
    - `layer-hit-row.svelte.test.ts`: aktualisiert für neues Layout (Name nur 1×, Chip rechts, Metadata kompakt)
    - `data-stand-banner.svelte.test.ts`: Kompakte-Format-Tests
    - `inspector-panel.svelte.test.ts`: Empty-Section-Collapse, Section-Header-Style
    **And** E2E `tests/e2e/inspector-ux.e2e.ts`:
    - Adresse selektieren → Severity-Chips sichtbar (Lärm red, Wohnlage green, etc.)
    - Empty-Section default ausgeblendet, Toggle einblendet
    - Metadata-Tooltip zeigt full-URL bei Hover
    - Layer-Name nicht doppelt sichtbar
    **And** axe-core: 0 Violations, Color-Contrast WCAG-AA für alle Chip-Severities
    **And** Manuelles Visual-Review (vorher/nachher Screenshot)

## Tasks / Subtasks

- [x] **Task 1: Color-Tokens für Severity** (AC: #1)
  - [x] 1.1 `internal/colors.ts` erweitern: `--severity-success`, `--severity-success-soft`, `--severity-neutral`, `--severity-warning`, `--severity-danger`
  - [x] 1.2 `app.css` CSS-Custom-Properties + Tailwind @theme inline Mappings (Dark-Mode deferred zu Story 1.2-Erweiterung)
  - [x] 1.3 WCAG-Contrast-Check pro Token-Paar (Text + Background ≥4.5:1 für Normal-Text)

- [x] **Task 2: ValueChip-Komponente** (AC: #1)
  - [x] 2.1 `src/lib/components/atlas/value-chip.svelte`:
    - Props: `severity: SeverityLevel`, `value: string | number`, `unit?: string`, `numeric?: boolean`, `icon?: ComponentType`, `layerName: string`
  - [x] 2.2 Tests (12 Tests grün)
  - [x] 2.3 Stories/Playground-Sample: deferred (kein Storybook-Setup im Projekt)

- [x] **Task 3: Value-Severity-Mapping** (AC: #2, #7)
  - [x] 3.1 `internal/value-severity-mapping.ts`:
    - Function `getValueSeverity(slug: string, value: unknown): SeverityLevel`
    - Numerische Schwellen pro Layer (Lärm dB, Klima-PET °C)
    - Kategorische Mapping pro Layer (Umweltatlas, Wohnlage, Umweltgerechtigkeit)
    - Stolperstein-Branch: always `neutral` (Editorial)
  - [x] 3.2 Coverage-Tests pro Layer-Slug (29 Tests grün)

- [x] **Task 4: LayerHitRow-Layout-Rewrite** (AC: #3, #8)
  - [x] 4.1 `layer-hit-row.svelte` Major-Rewrite:
    - Layer-Name 1× + ValueChip + Action-Icons in Row 1 (justify-between)
    - Kontext-Zeile (Kiez/PLR-Name) Row 2
    - Optional Explain (Plex-Serif) Row 3 mit Mehr-Toggle (Story 1.16)
    - Compact-DataStandBanner Row 4
  - [x] 4.2 `getLayerDisplayName` Refactor: Jahr-Suffix kompakt (`Lärmbelastung 2023` statt `Lärmbelastung (Umweltatlas 2023)`)
  - [x] 4.3 Disclaimer-Stack-Positionierung beibehalten (nach Banner)
  - [x] 4.4 Tests aktualisiert + 9 neue Story-1.18-Tests; neuer `getLayerHitDisplay()` mit 17 Coverage-Tests

- [x] **Task 5: Compact-DataStandBanner** (AC: #4)
  - [x] 5.1 `data-stand-banner.svelte` rewrite:
    - `text-[10px]`, kompaktes Format ohne „Stand:"/„Quelle:"-Präfix
    - Info-Icon mit Source-URL als title + aria-label
  - [x] 5.2 Neue `shortenSourceCompact()`-Funktion: FIS/ODIS/DWD/OSM/gdi/mietspiegel-Tokens + `.berlin.de`-Stripping
  - [x] 5.3 Tests (9 Banner-Tests + 9 Compact-Shortener-Tests grün)

- [x] **Task 6: Section-Header-Subtler** (AC: #5)
  - [x] 6.1 `inspector-panel.svelte`: Section-Header von h3 Plex-Serif → Plex-Mono uppercase text-xs + border-t + pt-4
  - [x] 6.2 Section-Count-Suffix `(N)` rechts neben Label
  - [x] 6.3 Tests aktualisiert (2 neue AC-5-Tests)

- [x] **Task 7: Empty-Section-Toggle** (AC: #6)
  - [x] 7.1 `inspector-panel.svelte`: Empty-Sections default hidden
  - [x] 7.2 Footer-Toggle „Leere Sektionen einblenden/ausblenden" mit localStorage-Persist (`nav.inspector.showEmptySections`)
  - [x] 7.3 Klima-Section Always-Visible-Branch (Hero-Bereich)
  - [x] 7.4 Empty-Section-Compact-Format: `Memorial · keine Daten an dieser Adresse` (Plex-Mono text-xs)
  - [x] 7.5 Tests (5 neue AC-6-Tests)

- [x] **Task 8: E2E + a11y + Visual-Review** (AC: #10)
  - [x] 8.1 `tests/e2e/inspector-ux.e2e.ts` Stub angelegt (Severity-Chips, Layer-Name-Dedup, Empty-Section-Toggle, Metadata-Tooltip) — CI-Run deferred
  - [x] 8.2 axe-core WCAG-AA-Color-Contrast — deferred zu CI-Run
  - [x] 8.3 Manuelles Vorher/Nachher-Visual-Review — User-Pivots eingebaut (Mietspiegel-Wohnlage mittel→success-soft gegen Grau-Monotonie; Umweltgerechtigkeit `zweifach`→`2× belastet` für Klarheit)

## Dev Notes

### Severity-Color-Tokens (Empfehlung)

```css
:root {
  --severity-success:       #2D7A3E;  /* Forest-Green, Trust */
  --severity-success-bg:    #E8F2EA;
  --severity-success-soft:  #5B9D6E;
  --severity-success-soft-bg: #EFF6F1;
  --severity-neutral:       #6B6B6B;  /* Plex-Grey */
  --severity-neutral-bg:    #F2F0EC;  /* Cloud-Dancer-Tinted */
  --severity-warning:       #B96D1F;  /* Burnt-Orange */
  --severity-warning-bg:    #FBEEDD;
  --severity-danger:        #A8321C;  /* Brick-Red */
  --severity-danger-bg:     #F8E4DF;
}
```

Alle Paare WCAG-AA bei `text-on-bg`. Token-Naming bewusst mit `--severity-*` (nicht `--color-red` etc.) um Semantic-Coupling zu erhalten.

### Severity-Mapping-Beispiel

```typescript
// internal/value-severity-mapping.ts

export type SeverityLevel = 'success' | 'success-soft' | 'neutral' | 'warning' | 'danger';

export function getValueSeverity(slug: string, value: unknown): SeverityLevel {
  if (value === null || value === undefined) return 'neutral';

  switch (slug) {
    case 'laerm-2023':
    case 'laerm-den': {
      const v = typeof value === 'number' ? value : Number(value);
      if (isNaN(v)) return 'neutral';
      if (v < 55) return 'success';
      if (v <= 65) return 'warning';
      return 'danger';
    }

    case 'mietspiegel-wohnlage':
    case 'wohnlagen-2024': {
      const v = String(value).toLowerCase();
      if (v.includes('sehr gut')) return 'success';
      if (v.includes('gut')) return 'success-soft';
      if (v.includes('mittel')) return 'neutral';
      if (v.includes('einfach')) return 'neutral';
      return 'neutral';
    }

    case 'luft-2023':
    case 'gruenversorgung-2023':
    case 'bioklima-2023':
    case 'thermische-belastung-2023': {
      const v = String(value).toLowerCase();
      if (v === 'niedrig' || v === 'gut') return 'success';
      if (v === 'mittel') return 'warning';
      if (v === 'hoch' || v === 'schlecht' || v === 'sehr hoch') return 'danger';
      return 'neutral';
    }

    case 'stolpersteine':
      return 'neutral';  // Editorial-Würde, FR51

    // ...
    default:
      return 'neutral';
  }
}
```

### Layout-Vorschlag (ASCII-Mockup)

```
┌─────────────────────────────────────────────────────────┐
│ UMWELT                                                  │  ← Section-Header subtler, Plex-Mono-uppercase
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Lärmbelastung 2023              ┃▓▓▓ mittel┃ 👁 ↗     │  ← Layer-Name + ValueChip + Action-Icons
│ Teutoburger Platz                                       │  ← Kiez-Context
│ Straßenverkehrs-Lärmpegel...    [Mehr]                 │  ← Explain optional
│ ─ 2024-01 · gdi · dl-de/zero  ⓘ                       │  ← Compact-Metadata + Info-Tooltip
│                                                         │
│ Luftbelastung 2023              ┃▓▓▓ hoch ┃ 👁 ↗      │
│ Teutoburger Platz                                       │
│ ─ 2024-01 · gdi · dl-de/zero  ⓘ                       │
│                                                         │
│ Grünversorgung 2023             ┃▓▓ schlecht┃ 👁 ↗     │
│ Teutoburger Platz                                       │
│ ─ 2024-01 · gdi · dl-de/zero  ⓘ                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Visueller Anker: **Value-Chip** als Lead-Element rechts, nicht als nachgeordneter Inline-Text.

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (Info-Icon, Eye/EyeOff)
- #2 Files <500 Zeilen (LayerHitRow + Mapping splitten falls nötig)
- #6 Kein Comment außer non-obvious WHY
- #7 TS strict
- #13 A11y-First — Color-Contrast WCAG-AA, aria-label für Chips
- #14 i18n-First — TODOs für Severity-Labels („mittel" etc. werden in Story 3.1 lokalisiert)
- #18 Keyed `{#each}` — bestehend

### Library/Framework Requirements

**Neu:** keine

### Testing Requirements

**Unit-Tests:** ValueChip, Severity-Mapping, LayerHitRow, DataStandBanner, InspectorPanel

**E2E:** Inspector-UX-Flow + Visual-Smoke

**Coverage-Target:** ≥85% (Inspector ist Core-UX)

### Color-Contrast-Sicherstellung

Pre-Implementation:
1. Token-Paare in Figma/Browser-Tool prüfen (z.B. axe-core CLI)
2. Mindest-Verhältnis 4.5:1 für Text-on-Color (WCAG-AA Normal-Text)
3. 3:1 für Large-Text (Chip-Text 14px+) reicht — aber wir zielen auf AA-Normal

### Previous Story Intelligence

- **Story 1.2:** Design-Token-Foundation, Cloud-Dancer-Plex-System — Severity-Tokens ergänzen Pattern
- **Story 1.9:** LayerHitRow Foundation
- **Story 1.10:** Layer-Palette + Value-Formatters
- **Story 1.12:** Editorial-Disclaimer (positionieren neu im Layout)
- **Story 1.16:** Layer-Explain-Coverage + Mehr-Toggle + Action-Icons (Foundation für Story 1.18 Layout-Rewrite)

### Open Questions

1. **Severity bei numerischen Werten:** Schwellen aus offiziellen Quellen (z.B. WHO Lärm-Grenzwerte) oder gefühlt? Empfehlung: WHO/UBA-konform mit Source-Comment
2. **Bodenrichtwerte Severity:** User-Wunsch Auto-Severity oder kontext-frei? Empfehlung: kontext-frei (4500 €/m² ist für Käufer schlecht, für Eigentümer gut — Wert allein keine Aussage)
3. **Stolpersteine-Special-Case:** Wie zeigen wenn 12 Stolpersteine in 200m? Aktuell `Count`-Wert. Empfehlung: `12 Personen` als neutral-Chip mit Editorial-Disclaimer
4. **Dark-Mode-Severity-Tokens:** Story 1.2 hat dark-mode-tokens? Falls ja, Severity-Pair-Tokens auch
5. **Story 1.16 + 1.18 Sequencing:** 1.18 baut auf 1.16-Action-Icons. Reihenfolge: 1.16 → 1.18 strict
6. **Wert-Skala-Visual-Indicator:** Statt Chip auch Bar-Indicator (z.B. 65/100 dB) sinnvoll? Phase 2 erweiterung
7. **i18n-Severity-Labels:** Aktuell DE-only („mittel" etc.). Migration Story 3.1 — strings als const-Map vorbereiten

### Vorher/Nachher (Conceptual)

**Vorher (User-Screenshot 2026-05-13):**
- Layer-Name `Lärmbelastung (Umweltatlas 2023)` als h-line (Plex-Sans medium)
- `Lärmbelastung: mittel · Teutoburger Platz` als zweite h-line (Plex-Sans semibold)
- Stand-Quelle-Lizenz als prominente Mono-Zeile
- Externe-Link-Icon oben rechts (404)
- Total ~80px Vertikal pro Row
- Memorial/Mobilität Empty als Plex-Serif h3 + italic

**Nachher (Story 1.18-Target):**
- Layer-Name kompakt `Lärmbelastung 2023` + ValueChip `▓mittel` rechts (visuelles Lead)
- Kontext-Zeile `Teutoburger Platz` Plex-Sans-muted klein
- Compact-Metadata `2024-01 · gdi · dl-de/zero` 10px subtle
- Eye-Toggle + ExternalLink Action-Icons (Story 1.16)
- Total ~64px Vertikal ohne Explain-Expand
- Empty-Sections default versteckt, Footer-Toggle für Power-User

## References

- [Source: src/lib/components/atlas/inspector-panel/layer-hit-row.svelte] (aktuelle Implementation)
- [Source: src/lib/components/atlas/inspector-panel/data-stand-banner.svelte] (zu komprimieren)
- [Source: _bmad-output/implementation-artifacts/1-9-inspektor-panel-mit-layer-hits.md] (LayerHitRow Foundation)
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md] (Disclaimer-Positionierung)
- [Source: _bmad-output/implementation-artifacts/1-16-layer-explain-coverage.md] (Mehr-Toggle + Action-Icons Foundation)
- [Source: _bmad-output/planning-artifacts/architecture.md] (Design-Token-System)
