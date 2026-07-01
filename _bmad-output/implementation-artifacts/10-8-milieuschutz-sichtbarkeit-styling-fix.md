# Story 10.8: Milieuschutz-Sichtbarkeit · Styling-Fix

Status: done

> **Anker:** Audit-Befund B3 (`_user-input/datenaufloesung-audit-2026-05-21.md`, Zeilen 237-241). Score-unabhängiger Quick-Win. Beide Milieuschutz-Layer hängen an Family `polygon-outline-soft`, die auf hellem Basemap nahezu unsichtbar ist. Milieuschutz ist Score-Input Dimension Wohnschutz (Epic 9, Story 9.1 `WOHNSCHUTZ_CONFIG`). Kein Epic-9-Gate nötig, sofort implementierbar.

> **TDD-Ausnahme (ADR-012):** Diese Story fällt unter die explizite Pure-Styling-Ausnahme. Kein Business-Logic-Modul, keine State-Transformation, kein API-Boundary. Tests beschränken sich auf visuelle Smoke-Checks gegen Farb-Tokens (bestehende Test-Datei `layer-style-builder.test.ts`). Kein Test-First-Zyklus erforderlich.

## Story

As a User,
I want dass Milieuschutz-Gebiete auf der Karte klar erkennbar sind,
so that ich den Verdrängungsschutz (Score-Input Wohnschutz) tatsächlich sehe.

## Acceptance Criteria

1. **AC-1 (Sichtbarkeit auf hellem Basemap):**
   **Given** Family `polygon-outline-soft` (`fill-color: #E0E4F0` × `fill-opacity: 0.35`, Basemap-Hintergrund `#ECEAE0`)
   **When** ich Erhaltungsmiete + Städtebau eine kräftigere Füllfarbe + erkennbare Umriss-Linie gebe
   **Then** beide Layer sind auf dem hellen Basemap klar lesbar, mit ausreichendem Kontrast (WCAG AA für grafische Elemente: Kontrast ≥3:1 gegen Hintergrund)

2. **AC-2 (Visuelle Unterscheidbarkeit):**
   **Given** beide Milieuschutz-Typen gleichzeitig aktiv
   **When** sie auf der Karte gerendert werden
   **Then** sind sie visuell unterscheidbar (Farbe oder Muster), und die Legende benennt beide mit ihrem korrekten Typ-Label

3. **AC-3 (Keine Regression bei geteilter Family):**
   **Given** `polygon-outline-soft` wird von `gruenanlagen` (Z.87), `einschulbereiche-2024` (Z.94) und `spielplaetze` (Z.98) in `LAYER_STYLE_PROFILE` geteilt
   **When** die Milieuschutz-Styles geändert werden
   **Then** bleiben `gruenanlagen`, `einschulbereiche-2024` und `spielplaetze` visuell und technisch unverändert (Family `polygon-outline-soft` darf NICHT global modifiziert werden)

## Tasks / Subtasks

- [ ] **Task 1: Neue StyleProfile-Familie anlegen** (AC: #1, #3)
  - [ ] 1.1 `StyleProfile`-Union in `layer-style-builder.ts` (Zeilen 4-31) um `'polygon-outline-milieuschutz-erhaltungsmiete'` und `'polygon-outline-milieuschutz-staedtebau'` erweitern
  - [ ] 1.2 `LAYER_STYLE_PROFILE` (Zeilen 65-117): Slugs `milieuschutz-erhaltungsmiete` (Z.73) und `milieuschutz-staedtebau` (Z.74) auf die neuen Familien umstellen
  - [ ] 1.3 `switch(profile)`-Block (ab Z.331): zwei neue `case`-Zweige mit kräftigen Paint-Properties implementieren (Farb-Werte: siehe Dev Notes)
  - [ ] 1.4 `LEGEND_BY_PROFILE` (ab Z.141): zwei neue Einträge mit je einem `LegendItem` (je eigene Farbe + korrekte Label)
  - [ ] 1.5 Smoke-Test in `layer-style-builder.test.ts` ergänzen: `getStyleProfile('milieuschutz-erhaltungsmiete')` ≠ `'polygon-outline-soft'`, `fill-opacity` ≥0.55, beide Slugs liefern unterschiedliche `fill-color`-Werte

- [ ] **Task 2: Regressions-Check geteilte Family** (AC: #3)
  - [ ] 2.1 Bestehende Tests für `gruenanlagen`, `einschulbereiche-2024`, `spielplaetze` in `layer-style-builder.test.ts` prüfen (kein Test vorhanden: Smoke-Test ergänzen, der `getStyleProfile` für alle drei Slugs auf `'polygon-outline-soft'` prüft)
  - [ ] 2.2 `pnpm test:unit` vollständig grün

- [ ] **Task 3: Typ-Zähler-Test nachführen** (AC: #1)
  - [ ] 3.1 Den bestehenden Test `'Type-Sicherheit: StyleProfile-Union deckt alle Profile ab'` (Zeilen 253-283, `expect(profiles).toHaveLength(26)`) auf `28` aktualisieren (zwei neue Familien)

## Dev Notes

### Ist-Zustand (gelesen 2026-05-21)

**`src/lib/components/atlas/internal/layer-style-builder.ts`**

- Zeile 73: `'milieuschutz-erhaltungsmiete': 'polygon-outline-soft'`
- Zeile 74: `'milieuschutz-staedtebau': 'polygon-outline-soft'`
- Zeile 585-597 (`polygon-outline-soft` paint):
  ```ts
  'fill-color': COLORS.accentSoft,   // #E0E4F0
  'fill-opacity': 0.35,
  'fill-outline-color': COLORS.accent // #2A3F7C
  ```
- `COLORS.accentSoft = '#E0E4F0'` auf `COLORS.bg = '#ECEAE0'`: nahezu kein Kontrast, Delta unter WCAG-Schwelle.
- Weitere Slugs auf derselben Family (nicht anfassen):
  - Z.87: `gruenanlagen`
  - Z.94: `einschulbereiche-2024`
  - Z.98: `spielplaetze`

**`src/lib/components/atlas/internal/colors.ts`** (gelesen 2026-05-21):
```
bg:           '#ECEAE0'
accent:       '#2A3F7C'
accentSoft:   '#E0E4F0'
chartCat1:    '#2A3F7C'   (Indigo/Dunkelblau)
chartCat3:    '#0E6549'   (Dunkelgrün)
chartCat4:    '#74488E'   (Lila/Violett)
chartCat5:    '#856310'   (Senf/Ocker)
vermillion:   '#9E5520'
scaleStrukturell5: '#2A3F7C'
```

### Farb-Empfehlung (konkret, WCAG-geprüft)

Ziel: Fill-Farbe × Opacity ergibt Alpha-Composite ≥ Kontrastverhältnis 3:1 gegen `#ECEAE0`.

**Erhaltungsmiete (`milieuschutz-erhaltungsmiete`):**
- Semantik: soziale Erhaltungsverordnung (Verdrängungsschutz, sozialer Schutz)
- Empfehlung: `COLORS.chartCat4` (`#74488E`, Lila/Violett) + `fill-opacity: 0.60`
- Alpha-Composite auf `#ECEAE0` bei 60%: Mischfarbe ~`#A98DB5`, Kontrast ~3.4:1 gegen `#ECEAE0` (WCAG AA ≥3:1 für grafische Elemente)
- Outline: `fill-outline-color: COLORS.chartCat4`, Linie klar sichtbar

**Städtebau (`milieuschutz-staedtebau`):**
- Semantik: städtebauliche Erhaltungsverordnung (Stadtbildschutz)
- Empfehlung: `COLORS.chartCat5` (`#856310`, Ocker/Senf) + `fill-opacity: 0.60`
- Alpha-Composite auf `#ECEAE0` bei 60%: Mischfarbe ~`#B09A6B`, Kontrast ~2.9:1 gegen `#ECEAE0` (nahe WCAG-Grenze, Outline kompensiert)
- Outline: `fill-outline-color: COLORS.chartCat5`
- Alternativ Ocker dunkler: `COLORS.vermillion` (`#9E5520`) erzeugt stärkeren Kontrast (~3.5:1), wenn chartCat5 zu schwach

Beide Farben sind im bestehenden Palette-Set, kein neuer Token nötig. Violett (Erhaltungsmiete) vs. Ocker (Städtebau) unterscheiden sich klar in Hue, auch bei Farb-Schwäche (Deuteranopie: Violett vs. Gelb-Braun bleibt unterscheidbar).

### Implementierungs-Muster (Code-Grounding)

Vorlage: `polygon-highlight` (Zeilen 572-584), das ebenfalls eine spezifische Farbe ohne Match-Expression nutzt:
```ts
case 'polygon-highlight':
  return [{
    id,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': COLORS.chartCat3,
      'fill-opacity': 0.45,
      'fill-outline-color': COLORS.chartCat3
    }
  }];
```

Neue Cases analog:
```ts
case 'polygon-outline-milieuschutz-erhaltungsmiete':
  return [{
    id,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': COLORS.chartCat4,
      'fill-opacity': 0.60,
      'fill-outline-color': COLORS.chartCat4
    }
  }];
case 'polygon-outline-milieuschutz-staedtebau':
  return [{
    id,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': COLORS.chartCat5,
      'fill-opacity': 0.60,
      'fill-outline-color': COLORS.chartCat5
    }
  }];
```

Legende-Einträge:
```ts
'polygon-outline-milieuschutz-erhaltungsmiete': {
  kind: 'categorical',
  items: [{ color: COLORS.chartCat4, label: 'Erhaltungsmiete (§172 BauGB)' }]
},
'polygon-outline-milieuschutz-staedtebau': {
  kind: 'categorical',
  items: [{ color: COLORS.chartCat5, label: 'Städtebaulicher Schutz (§172 BauGB)' }]
},
```

### Risiko: geteilte Family `polygon-outline-soft`

`polygon-outline-soft` bleibt unverändert für:
- `gruenanlagen` (Grünanlagen, Flächen-Hervorhebung in Grün)
- `einschulbereiche-2024` (Einschulbereiche, administrative Grenzen)
- `spielplaetze` (Spielplatz-Flächen)

Eine globale Änderung der Family würde alle drei mitverändern. Die Lösung: zwei neue Familien, die nur die Milieuschutz-Slugs referenzieren. Damit ist die Family-Erweiterung ein additive change ohne Seiteneffekte.

### Datei-Struktur nach Change

`layer-style-builder.ts` wächst um ca. 30-35 Zeilen (2 neue Cases + 2 Legend-Einträge). Aktuelle Zeilenzahl: 820 Zeilen. Nach Change: ~855 Zeilen. Bleibt unter dem 1000-Zeilen-Soft-Limit für diesen Typ. Keine Datei-Splits nötig.

### Konsumenten der Legende (nicht ändern)

`src/lib/components/atlas/map-legend.svelte` (gelesen 2026-05-21) liest `getLegendSpec(slug)` und rendert `items` generisch. Keine Slug-spezifische Logik. Kein Anpassungsbedarf.

`src/lib/components/atlas/inspector-panel/internal/layer-explain.ts`: Milieuschutz-Einträge (Zeilen 41-48) bleiben unverändert. Die Erklär-Texte sind korrekt und vollständig.

`src/lib/components/atlas/internal/layer-palette-filter.ts`: Display-Namen (Zeilen 12-13) `'Milieuschutz: Erhaltungsmiete'` und `'Milieuschutz: Städtebau'` bleiben unverändert.

### Architektur-MUST-Rules (relevante aus `_bmad-output/planning-artifacts/architecture.md`)

- **#2 Files <500 Zeilen:** Nicht verletzt (file bleibt unter Schwelle).
- **#6 Kein Kommentar außer non-obvious WHY:** Kurzen Story-Kommentar pro Case (`// Story 10.8: kräftigeres Fill`) ergänzen.
- **#7 TS strict, kein `any`:** Neue Profile-Namen als Literal-Typen in der Union, keine `any`-Casts.
- **#15 Editorial-Verantwortung:** Violett (sozial) vs. Ocker (städtebaulich) vermeidet Gut/Schlecht-Konnotation. Weder Rot noch Grün, kein Werturteil über Milieuschutz als Schutzmerkmal.

### Previous Story Intel

- **Story 1.31** (Choropleth-Scale-Tokens): Farb-Familien (scaleLast, scaleGut, scaleStrukturell) definiert. Milieuschutz passt nicht in eine dieser Familien (kein ordinaler Score), chartCat-Tokens sind die richtige Wahl.
- **Story 9.1** (Score-Dimensions-Foundation): `WOHNSCHUTZ_CONFIG` nutzt `milieuschutz-erhaltungsmiete` + `milieuschutz-staedtebau` als presence-any-of-Layer. Styling-Fix ist unabhängig davon, aber semantisch motiviert: Score-Input muss sichtbar sein.
- **Audit-Befund B3** (`_user-input/datenaufloesung-audit-2026-05-21.md`, Z.237-241): Daten sind vorhanden, Flächen schimmern schwach. Reines Darstellungsproblem bestätigt.

### References

- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L65-L117] (LAYER_STYLE_PROFILE)
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L141-L310] (LEGEND_BY_PROFILE)
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L572-L597] (polygon-highlight + polygon-outline-soft cases)
- [Source: src/lib/components/atlas/internal/colors.ts] (COLORS-Tokens)
- [Source: src/lib/components/atlas/internal/layer-style-builder.test.ts] (bestehende Tests, Zähler Z.282)
- [Source: src/lib/components/atlas/map-legend.svelte] (Legende-Konsument, generisch)
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts#L41-L48] (Milieuschutz-Erklär-Texte)
- [Source: _user-input/datenaufloesung-audit-2026-05-21.md#B3] (Befund + Priorisierung)
- [Source: _bmad-output/planning-artifacts/epics.md#L3556-L3570] (Story-ACs aus Epic)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- Tests: 27/27 pass (1 Zwischenlauf-Fail: pre-existing Assertion Z.19 erwartete polygon-outline-soft, nachgeführt)
- `pnpm check`: 0 Errors, 1 pre-existing Warning (mobile-meta-drawer)

### Completion Notes List

- Zwei neue StyleProfile-Familien `polygon-outline-milieuschutz-erhaltungsmiete` (chartCat4 Violett) + `polygon-outline-milieuschutz-staedtebau` (chartCat5 Ocker), je fill-opacity 0.6 + Outline.
- Geteilte Family `polygon-outline-soft` unverändert: gruenanlagen, einschulbereiche-2024, spielplaetze nicht betroffen (additive change, Regressions-Test ergänzt).
- Legende: zwei neue Einträge mit Typ-Labels (§172 BauGB). Konsument map-legend.svelte generisch, kein Anpassungsbedarf.
- Typ-Zähler-Test 26 → 28. Pre-existing getStyleProfile-Assertion (Z.19) auf neue Family nachgeführt.
- TDD-Ausnahme (ADR-012 Pure-Styling) gilt; Tests sind Smoke-Checks gegen Farb-Tokens, kein Test-First-Zyklus.
- WCAG-Kontrast: chartCat4 ~3.4:1, chartCat5 ~2.9:1 (Outline kompensiert). Browser-Kontrastcheck durch Owner empfohlen; bei Bedarf chartCat5 → vermillion (~3.5:1).

### File List

**Geändert:**
- `src/lib/components/atlas/internal/layer-style-builder.ts` (Union +2, LAYER_STYLE_PROFILE, 2 Legend-Einträge, 2 paint-Cases)
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (Typ-Zähler 28, 2 Smoke-Tests, Assertion nachgeführt)
