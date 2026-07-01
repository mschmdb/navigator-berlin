# Story 8.3: Karten-Polygon-Highlight beim Level-Switch

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want dass die Karte beim Level-Wechsel das entsprechende Polygon zeigt (Kiez-Outline, Bezirk-Outline, Berlin-Outline),
so that ich räumlich verstehe was „Kiez" oder „Bezirk" gerade konkret meint.

## Acceptance Criteria

1. **Given** der globale Level-Context aus Story 8.1, **When** Level auf Kiez/Bezirk/Berlin wechselt, **Then** MapLibre-Highlight-Layer rendert das entsprechende Polygon mit subtilem Accent-Stroke + Semi-Transparent-Fill. **And** Adress-Marker bleibt sichtbar. **And** Bei Level=Adresse wird kein Polygon-Highlight gerendert.
2. **Given** Performance-Constraints, **When** Polygon-Daten geladen werden (Kieze und Bezirke sind bereits in Layer-Pipeline), **Then** Highlight nutzt existierende Source-Daten, kein extra Fetch.
3. **Given** ein Level-Wechsel ohne auflösbares Polygon (Punkt außerhalb Berlin / kein selektierter Punkt), **When** der Highlight rendern würde, **Then** kein Highlight + kein Fehler (graceful, konsistent mit 8.1 disabled-Level).
4. **Given** Level-Wechsel zurück auf Adresse, **When** der Highlight-Layer existierte, **Then** das Polygon-Highlight wird entfernt/leer-gesetzt, Adress-Marker + reguläre Layer bleiben unberührt.

## Tasks / Subtasks

- [ ] Task 1: Highlight-Source + Layer in MapLibre (AC: #1, #2, #4)
  - [ ] In der Karten-Komponente einen dedizierten Highlight-Source (`GeoJSON`) + Fill-Layer + Line-Layer registrieren. Feature wird beim Level-Wechsel via `setData` aktualisiert, NICHT pro Wechsel neu geadded (Source einmal anlegen, Daten swappen).
  - [ ] Polygon-Geometrie aus bereits geladenen Boundary-Sources (LOR-Bezirksregion 143, Bezirke 12, Berlin-Outline). Existierende Source-Daten reuse (AC #2), kein zusätzlicher Fetch. Falls Berlin-Outline noch nicht als Source vorliegt: aus Bezirke-Union ableiten oder dünnes Outline-GeoJSON, kein schwerer Re-Fetch.
  - [ ] Styling: subtiler Accent-Stroke + semi-transparent Fill, stigma-neutrale Brand-Accent-Farbe (kein Wertungs-Rot-Grün). Layer-Order: Highlight UNTER Adress-Marker (Marker bleibt sichtbar, AC #1).
- [ ] Task 2: An Level-Context koppeln (AC: #1, #3, #4)
  - [ ] Level-Context (8.1) lesen: `currentLevel` + `kiezSlug`/`bezirkSlug`. Bei Wechsel das passende Boundary-Feature selektieren und in den Highlight-Source setzen.
  - [ ] address → Highlight leeren (empty FeatureCollection). berlin → Gesamt-Outline. kiez → Bezirksregion-Feature per `BZR_ID`. bezirk → Bezirk-Feature per `Schluessel_gesamt`.
  - [ ] null-Polygon (AC #3): empty setzen, kein Crash.
  - [ ] Reaktivität via `$effect` auf Level-Context-Änderung.
- [ ] Task 3: Viewport-Fit (AC: #1) — sanft, nur wenn nötig (User-Decision 2026-05-20)
  - [ ] Bei Level-Wechsel `fitBounds` NUR wenn das Ziel-Polygon nicht (vollständig) im aktuellen Viewport liegt; liegt es bereits sichtbar, Marker-/Viewport-View halten (kein unnötiges Springen).
  - [ ] Sanfte Animation (`easeTo`/`fitBounds` mit padding + duration), Adress-Marker im View halten. Mobile: fitBounds statt fix center/zoom (Memory `feedback_mobile_first`).
  - [ ] Bounds-im-Viewport-Check als Pure-Helper (testbar).
- [ ] Task 4: Tests (TDD, AC-Mapping)
  - [ ] Pure-Helper `select-highlight-feature.ts` (Level + Slugs + Boundary-Collections → Feature | null) Unit-getestet: jeder Level liefert richtiges Feature, address→null, fehlender Slug→null. Coverage ≥90%.
  - [ ] Map-Integration in E2E (Playwright): Level-Switch zeigt Polygon, address entfernt es, Marker bleibt. MapLibre-Render-Tests laufen über bestehende E2E-Suite (map-render/map-interaction). KEIN MapLibre in vitest-browser-Unit (zu schwer); Logik in Pure-Helper testen, Map-Verhalten in E2E.
  - [ ] Falls Popup involviert: `maplibre-gl/dist/maplibre-gl.css`-Import-Pflicht (Memory `feedback_maplibre_popup_css`) — hier vmtl. nicht nötig (kein Popup), aber prüfen.

## Dev Notes

### Scope + Sequencing

Braucht 8.1 (Level-Context). Unabhängig von 8.1b/8.2a/8.2b (rein Karten-Visualisierung). Kann parallel zu 8.1b/8.2a laufen (ADR-014 Wave-Plan: 8.1 + 8.2a + 8.3 erste Welle nach Foundation).

### Boundary-Sources reuse (AC #2)

- LOR-Bezirksregion: `static/layers/lor-bezirksregion.*.geojson`, Property `BZR_ID`/`BZR_NAME`.
- Bezirke: `static/layers/bezirke.*.geojson`, Property `Schluessel_gesamt`/`Gemeinde_name`.
- Diese sind laut Lücken-Analyse bereits in der Layer-Pipeline/Map verfügbar. Wenn die Karte sie schon als Source hat (für Boundary-Anzeige), das nutzen. Berlin-Outline ggf. aus Bezirke-Union ableiten.
- Slug-Auflösung über MANIFEST.json, nicht Filename hardcoden.

### MapLibre-Pattern

- Eine Highlight-Source + 2 Layer (fill + line) einmal beim Map-Load registrieren, dann `source.setData()` beim Level-Wechsel. Add/Remove pro Wechsel vermeiden (Flackern + Perf).
- Highlight-Layer-Position so wählen dass Adress-Marker oben bleibt (AC #1).
- LayerChart-Memory (`project_layerchart_v2`) betrifft Charts, nicht relevant hier. Relevant: MapLibre-CSS-Import nur falls Popup (Memory `feedback_maplibre_popup_css`).

### Stigma-neutrale Darstellung

Accent-Stroke + Semi-Transparent-Fill in Brand-Accent, KEINE Wertungs-Farbe. Der Highlight zeigt nur „dieses Gebiet ist gemeint", trägt keine Bewertung.

### Project Structure Notes

- Neue Files: `select-highlight-feature.ts` (Pure-Helper) + Test, Highlight-Layer-Logik in der Karten-Komponente (eigener Sub-Modul/Komponente falls Karten-File groß).
- Touch: Karten-Komponente (Atlas-Map), Level-Context-Konsum.
- Files <500 LOC: Highlight-Logik als eigenes Modul, nicht in eine evtl. schon große Map-Komponente inlinen (vgl. 988-LOC-Atlas-Refactor-Schuld aus Memory `project_atlas_explore_route`).

### Viewport-Fit (entschieden)

User-Decision 2026-05-20: sanftes `fitBounds` NUR wenn das Polygon außerhalb des aktuellen Viewports liegt, sonst Marker-View halten. Kein Auto-Zoom bei jedem Wechsel. Bounds-Check als testbarer Pure-Helper.

### TDD (ADR-012)

Pure-Helper Test-First ≥90%. Map-Verhalten via E2E (bestehende map-render/map-interaction Suite erweitern), nicht in vitest-browser-Unit (MapLibre zu schwer für Component-Test).

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#story-mapping (8.3)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.3]
- [Source: static/layers/lor-bezirksregion.*.geojson + bezirke.*.geojson via MANIFEST.json]
- [Source: Story 8.1 (Level-Context mit kiezSlug/bezirkSlug)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
