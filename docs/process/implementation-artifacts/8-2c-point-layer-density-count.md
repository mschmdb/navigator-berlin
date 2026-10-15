# Story 8.2c: Point-Layer Dichte/Count (Multi-Level)

Status: ready-for-dev

<!-- Abgespalten aus Story 8.2b AC #6 (User-Decision 2026-05-20): eigener Daten-Pfad, sauberer Scope. -->

## Story

As a User,
I want dass Point-Layer (Kitas, Schulen, ÖPNV-Stops, Stolpersteine) auf Kiez/Bezirk/Berlin die Anzahl im Gebiet plus Dichte pro km² zeigen,
so that ich „wie viele Kitas im Kiez" statt nur „nächste Kita" sehe.

## Acceptance Criteria

1. **Given** Level=Kiez/Bezirk/Berlin und ein Point-Layer, **When** die Card rendert, **Then** zeigt sie `count` im Boundary-Polygon plus `densityPerKm2` (Runtime-Count, kein Pre-Aggregat). Berlin = Gesamt-Count.
2. **Given** Level=Adresse, **When** die Card rendert, **Then** bleibt das heutige Distanz-Ring-/Nächste-Distanz-Verhalten (Passthrough, Backwards-Compat).
3. **Given** Stolpersteine, **When** auf Polygon-Level gezählt, **Then** nur Count + bestehender neutraler Erinnerungs-Disclaimer, KEINE Severity/Wertung.
4. **Given** Performance, **When** Point-Layer + Boundary geladen werden, **Then** lazy + gecacht, Reuse vorhandener Karten-Source-GeoJSONs wo möglich, kein Doppel-Fetch.

## Tasks / Subtasks

- [ ] Task 1: Boundary-Polygon-Loader (Kiez/Bezirk-Feature via Level-Context-Slug, lazy, gecacht). Reuse `fetchLayer` + MANIFEST, `lor-bezirksregion`/`bezirke`.
- [ ] Task 2: Point-Layer-GeoJSON-Load-Layer (lazy pro aktivem Point-Layer), Reuse Karten-Sources wo möglich.
- [ ] Task 3: Inspector-Page/Effect: pro Point-Layer-Hit bei Level≠address `count-points-in-polygon.ts` (bereits gebaut+getestet in 8.2b) ausführen, `pointResult` an `layer-level-card.svelte` durchreichen (Card-Branch existiert bereits).
- [ ] Task 4: Dichte-Dot-Visual-Primitive (8.1b-Stil) für Polygon-Level. Stolpersteine neutral.
- [ ] Task 5: Tests — Effect-Integration, Backwards-Compat address, Stolpersteine-Neutralität.

## Dev Notes

- `count-points-in-polygon.ts` (`countPointsInPolygon` + `countAllPoints`) ist in 8.2b vorgebaut + getestet.
- `layer-level-card.svelte` rendert `point-density` bereits, sobald `pointResult` gesetzt ist (sonst Passthrough auf LayerHitRow). Diese Story liefert nur den Daten-Pfad + Visual.
- Slug-Disambiguierung (Memory `project_kiez_slug_disambiguation`): Boundary-Lookup nutzt plain `normalizeSlug(BZR_NAME)` (passt zu resolve-spatial-level), Aggregat-Lookup hatte den `-${bezirkSlug}`-Fallback.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
