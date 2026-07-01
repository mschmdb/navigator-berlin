# Story 8.2b: Layer-Sections Multi-Level-Adapter (Numeric + Ordinal)

Status: review

> **Scope-Hinweis:** AC #1–#5 implementiert (Aggregat-Cards für Polygon-Layer, Toggle ist live). AC #6 (Point-Layer Dichte/Count) abgespalten als Story **8.2c** (User-Decision 2026-05-20). Pure-Helper `count-points-in-polygon.ts` vorab gebaut + getestet, Card forward-kompatibel.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want dass numerische Layer (Lärm, Luft, Bioklima) und ordinale Layer (Wohnlage) pro Level entsprechend adaptiert dargestellt werden,
so that „Lärm im Kiez" als Median + Verteilung statt einzelner Punkt-Wert zeigt.

## Acceptance Criteria

1. **Given** die Pre-Aggregate aus Story 8.2a + ADR-014-Visual-Typ pro Layer, **When** ich `aggregate-layer-for-level.ts` als Pure-Function implementiere die pro Level-Slug das passende Aggregat liefert (liest Pre-Aggregate, kein Live-Spatial), **Then** Inspector-Sections konsumieren Aggregate via einheitliches Interface.
2. **Given** der visuelle Card-Stil (User-Decision 2026-05-20, mehr Daten-Dichte), **When** eine Card rendert, **Then** collapsed-State trägt Mini-Visual + Kernwert (Verteilungs-Balken / Score-Bar mit Median-Anker / Coverage-Bar), kein blindes Collapsible.
3. **Given** Editorial-Disclaimer pro Layer, **When** ein Layer für ein Level nicht sinnvoll aggregierbar ist (z.B. BRW-Bezirks-Median), **Then** Section rendert „auf diesem Level nicht sinnvoll" + Begründung statt fake-Aggregat.
4. **Given** Level=Adresse, **When** Sections rendern, **Then** das heutige Punkt-Wert-Verhalten ist bit-identisch (Backwards-Compat, ADR-014 Abschnitt 6), Adapter greift nur bei kiez/bezirk/berlin.
5. **Given** ein Layer mit `coverage:below-threshold` für ein Level (8.2a hat null geliefert), **When** die Card rendert, **Then** „auf diesem Level zu wenig Daten" statt Fake-Wert (ADR-014 Abschnitt 7).
6. **Given** Point-Layer (Kitas, Schulen, ÖPNV-Stops, Stolpersteine) und Level=Kiez/Bezirk/Berlin (User-Decision 2026-05-20, M-2), **When** die Card rendert, **Then** zeigt sie die Anzahl der Punkte im Polygon plus Dichte pro km² (`point-density`, Runtime-Count im selektierten Boundary-Polygon, KEIN Pre-Aggregat aus 8.2a). Visual = Dichte-Dot (8.1b). Bei Level=Adresse bleibt die heutige Distanz-Ring-Darstellung (nächste Distanz). **And** Stolpersteine bleiben neutral (Erinnerung, kein Wohn-Kriterium, bestehender Disclaimer), nur Count, keine Wertung.

## Tasks / Subtasks

- [x] Task 1: Adapter Pure-Function (AC: #1, #4, #5)
  - [x] `src/lib/components/atlas/inspector-panel/internal/aggregate-layer-for-level.ts`: Signatur `(layerSlug, level, spatialContext, aggregates) => LayerLevelView`. Bei `level==='address'` liefert es den heutigen Punkt-Hit (Passthrough, kein Aggregat). Bei kiez/bezirk/berlin liest es aus den 8.2a-Pre-Aggregaten (`static/layer-aggregates/layer-aggregates.json`, Typ aus `src/lib/data/layer-aggregates-types.ts`) den Eintrag für den Slug aus dem Level-Context (8.1).
  - [x] `LayerLevelView` einheitliches Interface: `{ visualType, aggregate | null, disclaimer?, coverageNote? }`. visualType aus ADR-014 Spalte 3.
  - [x] not-aggregatable → `aggregate:null` + Disclaimer-Flag (AC #3). below-threshold → coverageNote (AC #5).
- [x] Task 2: JSON-Load-Layer (AC: #1, #4)
  - [x] Aggregate-JSON client-side laden (Fetch von `static/layer-aggregates/`), gecacht. Load NICHT in der Komponente, sondern in Page-/Daten-Layer (Memory `feedback_browser_test_fetch_spy`: Fetch in Komponente hängt Tests + Chromium-Zombies). Komponente bekommt Aggregate via Props/Context.
  - [x] Lazy: Aggregat-JSON erst laden wenn Level ≠ address gewählt wird (Performance, kein Eager-Fetch bei jedem Inspector-Open).
- [x] Task 3: Sections auf Adapter + 8.1b-Primitive umstellen (AC: #1, #2, #3)
  - [x] Numerische + ordinale Layer-Sections (Lärm, Luft, Bioklima, Wohnlage, Grünversorgung, MSS, Umweltgerechtigkeit, Coverage-Layer) rendern über `inspector-card.svelte` (8.1b) mit dem Visual-Primitive je Typ (score-bar / distribution-bar / coverage-bar / area-share-bar aus 8.1b).
  - [x] Heutiges `layer-hit-row.svelte` ist die address-Darstellung; der Adapter wählt zwischen address-Row und Aggregat-Card je Level.
  - [x] Wert-/Severity-Formatierung weiter über bestehendes `value-formatters.ts` + `value-severity-mapping.ts` + `layer-hit-display.ts` (kein Parallel-Formatter).
- [~] Task 3b: Point-Layer Dichte/Count (AC: #6) → **abgespalten als Story 8.2c** (User-Decision 2026-05-20: eigener Daten-Pfad, sauberer Scope)
  - [x] Pure-Helper `count-points-in-polygon.ts`: `{ count, densityPerKm2 }` via `@turf/boolean-point-in-polygon` + `@turf/area`. Vorab gebaut + getestet, wird von 8.2c konsumiert.
  - [x] Berlin-Level = `countAllPoints`. Kiez/Bezirk = `countPointsInPolygon` im Polygon.
  - [x] Adapter liefert `point-density`-View bei level≠address; `layer-level-card` rendert Count bei vorhandenem `pointResult`, sonst Passthrough auf LayerHitRow (kein Deadstate).
  - [ ] **8.2c:** Point-Layer-GeoJSONs + Boundary-Polygon im Inspector laden (neuer Lade-Pfad), `pointResult` ans Card durchreichen. Dichte-Dot-Visual. Stolpersteine neutral.
  - [ ] **8.2c:** GeoJSON-Reuse aus Karten-Sources statt Extra-Fetch.
- [x] Task 4: Disclaimer pro Layer × Level (AC: #3, #5)
  - [x] Disclaimer-Varianten erweitern: `editorial-types.ts` `DisclaimerVariant`-Union um Level-Aggregat-Fälle (z.B. `brw-not-aggregatable`, `level-below-threshold`, ggf. `stigma-aggregat`). Texte in `editorial-disclaimer.svelte` `DISCLAIMER_TEXTS_DE`.
  - [x] not-aggregatable (BRW) + Stigma-Layer (MSS/Wohnlage) bekommen die Begründung aus ADR-014 (z.B. „Bodenrichtwert-Median im Bezirk ist methodisch fragwürdig, deshalb kein Aggregat").
  - [x] Editorial-Config-Map (`internal/editorial-config.ts`) um Level-bezogene Flags erweitern wo nötig.
- [x] Task 5: Tests (TDD, AC-Mapping)
  - [x] `aggregate-layer-for-level.ts` Pure-Function: pro Aggregat-Typ + Level korrektes View, address=Passthrough, not-aggregatable→Disclaimer, below-threshold→coverageNote, fehlender Slug→graceful. Coverage ≥90% (kritischer Pfad, ADR-012).
  - [x] Section-Component-Smoke (vitest-browser): collapsed-Card zeigt Mini-Visual + Kernwert, expand zeigt Detail, Disclaimer-Card bei not-aggregatable. KEIN fetch-Spy in *.svelte.test.ts (Aggregate als Props).
  - [x] Backwards-Compat-Test: Level=address rendert wie heute (Snapshot/Verhalten unverändert) (AC #4).
  - [x] `count-points-in-polygon.ts` Pure-Function (AC #6): Count im Polygon, Dichte pro km², Berlin-Gesamt, Punkt-außerhalb-aller-Polygone, leere Layer. Coverage ≥90%.
  - [x] Red-then-Green-History pro AC im Commit.

## Dev Notes

### Scope + Sequencing

Braucht 8.1 (Level-Context), 8.1b (Card + Primitive) UND 8.2a (Pre-Aggregate-JSON). Drei Hard-Blocks. Diese Story verdrahtet die drei: Adapter liest 8.2a-Daten, rendert mit 8.1b-Primitiven, gated über 8.1-Level-Context.

Scope hier: numerische + ordinale + coverage/area-Layer (aus 8.2a-Pre-Aggregaten) PLUS Point-Layer-Dichte/Count auf Kiez/Bezirk/Berlin (AC #6, Runtime-Count, User-Decision M-2). Point-Layer laufen NICHT über 8.2a (bewusst ausgenommen), sondern über den Runtime-Helper `count-points-in-polygon.ts`. Wahl-Section + Kiez-Score-Hero bleiben ihre eigenen Komponenten (konsumieren 8.1b-Primitive separat).

### Adapter ist Pure + liest Pre-Aggregate (kein Live-Spatial)

Kein Runtime-Point-in-Polygon über große GeoJSONs im Inspector (AC #1, ADR-014 Abschnitt 8 Begründung). Der Adapter liest fertige Werte aus der 8.2a-JSON. Die einzige Runtime-Spatial-Arbeit ist die Kiez/Bezirk-Auflösung des Adress-Punkts, und die macht bereits 8.1 (`resolve-spatial-level.ts`) und legt Slugs in den Level-Context.

### Backwards-Compat (AC #4, ADR-014 Abschnitt 6)

Level=address rendert exakt das heutige `layer-hit-row.svelte`-Verhalten. Der Adapter ist additiv: er greift nur bei kiez/bezirk/berlin. Bestehende Tests müssen grün bleiben (50+ Tests-Risiko, Epic-8-Risiko-Awareness). Kein Re-Layout der address-Section.

### Wahl-Section: globaler Level + lokaler Override (User-Decision 2026-05-20, M-1)

Die Wahl-Section (Epic 6, eigener lokaler Stimmbezirk/Wahlbezirk/Bezirk-Switch) wird NICHT auf den globalen Spatial-Level zwangs-migriert. Sie koexistiert: globaler Level ist Default, die Wahl-Section darf ihn lokal für sich überschreiben (Local-Override aus 8.1 AC #6). Andere Sections folgen dem globalen Level. Dieser Adapter behandelt also die numerisch/ordinalen Layer; die Wahl-Section bleibt ihre eigene Komponente mit eigenem Level-Switch, liest aber den globalen Level als Anfangs-Default. Kein Diff-/Aggregat-Eingriff dieses Adapters in die Wahl-Section.

### Visual-Typ-Zuordnung

Aus ADR-014 Spalte 3 (siehe 8.1b Dev Notes). Adapter mappt layerSlug→visualType, Section wählt das passende 8.1b-Primitive. Stigma-Disziplin: Wohnlage/MSS/Umweltgerechtigkeit neutral, kein Wertungs-Pfeil (Memory `project_compare_editorial_profiles`).

### Disclaimer-Erweiterung

Bestehende Struktur:
- `editorial-types.ts`: `DisclaimerVariant`-Union (hat schon compare-Varianten + mss-aggregat).
- `editorial-disclaimer.svelte`: `DISCLAIMER_TEXTS_DE`-Record.
- `internal/editorial-config.ts`: pro-Layer-Config.

Level-Aggregat-Disclaimer additiv ergänzen, nicht bestehende Varianten umbenennen.

### Missing-Data (AC #5)

8.2a liefert bei <50% Coverage `value:null` + below-threshold-Marker. Card zeigt „auf diesem Level zu wenig Daten" (ADR-014 Abschnitt 7), kein Fake-Wert, kein leerer Balken der Vollständigkeit suggeriert.

### Project Structure Notes

- Neue Files: `internal/aggregate-layer-for-level.ts` + Test, Section-Adapter-Verdrahtung, Disclaimer-Erweiterungen.
- Touch: numerische/ordinale Section-Komponenten, `editorial-types.ts`, `editorial-disclaimer.svelte`, `editorial-config.ts`, Daten-Load-Layer der Inspector-Page.
- Reuse: `value-formatters.ts`, `value-severity-mapping.ts`, `layer-hit-display.ts`, 8.1b-Primitive, 8.1-Level-Context.
- Files <500 LOC, @lucide/svelte, kein `any`. svelte-autofixer nach Komponenten-Änderung.

### TDD (ADR-012)

Adapter-Pure-Function Test-First ≥90%. Section-Component-Smoke. Backwards-Compat-Regressions-Test Pflicht (das ist der High-Risk-Punkt von Epic 8).

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#3-matrix-pro-layer-familie]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#6-backwards-compatibility]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#7-missing-data-threshold]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.2b]
- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts]
- [Source: src/lib/components/atlas/internal/editorial-types.ts + editorial-disclaimer.svelte + internal/editorial-config.ts]
- [Source: Story 8.1 (Level-Context), 8.1b (Primitive), 8.2a (Pre-Aggregate-JSON)]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD dev-story)

### Debug Log References

- Backwards-Compat-Regression (AC #4): `inspector-panel.svelte.test.ts` 29/29 grün nach Umstellung von LayerHitRow auf LayerLevelCard. Address-Level rendert bit-identisch (Card delegiert an LayerHitRow).
- `pnpm check` 0 neue Errors (2 pre-existing i18n-Lock).

### Completion Notes List

- **Adapter** `aggregate-layer-for-level.ts` (Pure, 13 Tests): address=Passthrough, kiez/bezirk/berlin liest 8.2a-Pre-Aggregate, not-aggregatable→Disclaimer, below-threshold→coverageNote, fehlender Slug→graceful no-data, aggregates-null→loading-no-data (Polygon) bzw. point-density (Point).
- **Slug-Seam gelöst** (Memory `project_kiez_slug_disambiguation`): Adapter-Fallback `entry.kiez[slug] ?? entry.kiez[`${slug}-${bezirkSlug}`]` — resolve-spatial-level (8.1) liefert plain Slug, Aggregate keyen disambiguiert. NICHT resolve-spatial-level geändert.
- **Lazy-Load** `get-layer-aggregates.ts` (cached, 4 Tests): JSON erst bei Level≠address, $effect in inspector-panel mit `.catch`. Kein Eager-Fetch, kein fetch-Spy-Problem (Address-Default-Tests triggern nichts).
- **layer-level-card.svelte** (8 Tests): rendert 8.1b-Primitive je visualType (distribution-bar/score-bar/coverage-bar). Primitive direkt sichtbar statt nested-Collapsible → „kein blindes Collapsible" (AC #2) erfüllt. Disclaimer-Cards bei not-aggregatable/below-threshold.
- **Stigma:** `neutral`-Flag aus Aggregat-Eintrag → distribution-bar neutral-Modus (MSS/Wohnlage/Umweltgerechtigkeit).
- **Disclaimer** `editorial-types.ts` + `editorial-disclaimer.svelte`: 2 Varianten ergänzt (`brw-not-aggregatable`, `level-below-threshold`), additiv.
- **AC #6 (Point-Density) → Story 8.2c.** Helper `count-points-in-polygon.ts` (7 Tests) vorab gebaut, Card-Fallback forward-kompatibel.
- 48 neue/berührte Tests grün (Adapter 13 / count-points 7 / loader 4 / card 8 / disclaimer 16).

### File List

Neu:

- `src/lib/components/atlas/inspector-panel/internal/aggregate-layer-for-level.ts` (+ `.test.ts`)
- `src/lib/data/count-points-in-polygon.ts` (+ `.test.ts`) — für 8.2c
- `src/lib/data/get-layer-aggregates.ts` (+ `.test.ts`)
- `src/lib/components/atlas/inspector-panel/layer-level-card.svelte` (+ `.svelte.test.ts`)

Geändert:

- `src/lib/components/atlas/inspector-panel.svelte` (LayerLevelCard statt LayerHitRow im Section-Loop, lazy Aggregat-Load-$effect, geometryTypeFor-Helper)
- `src/lib/components/atlas/internal/editorial-types.ts` (2 DisclaimerVariant)
- `src/lib/components/atlas/editorial-disclaimer.svelte` (2 Texte)

## Change Log

- 2026-05-20: Story 8.2b implementiert (Layer-Sections Multi-Level-Adapter, AC #1–#5): Adapter Pure-Function liest 8.2a-Pre-Aggregate, Inspector-Sections rendern bei Level≠address Aggregat-Cards mit 8.1b-Primitiven (distribution-bar/score-bar/coverage-bar), address-Level bit-identisch (Backwards-Compat). Lazy-JSON-Load, 2 Disclaimer-Varianten, Slug-Disambiguierungs-Fallback. 48 Tests. Toggle ist jetzt live. AC #6 (Point-Density) → 8.2c. Status → review.
