---
title: 'Winner-Map mit Ebenen und Adress-Suche'
type: 'feature'
created: '2026-09-19'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '943911a07bc7d2be21689cbdfccc1aa8dbee522e'
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Kapitel „Karte" von /berlin-wahlen ist ein Platzhalter. Das Portal braucht seine Hero-Karte: stärkste Partei je Gebiet mit Anteils-Intensität, gesteuert von Reihe/Jahr/Ebene der Steuerleiste, mit Adress-Suche und echter A11y-Alternative (CAP-2).

**Approach:** Neue Kapitel-Komponente `winner-map` in `src/lib/components/wahl-portal/`, gefüttert aus `/api/wahl/winners` (eine Response pro Reihe, Client filtert aufs aktive Jahr). Reine Join-/Mapping-Logik in `internal/`-Modulen test-first; MapLibre nur als dünne Hülle nach Bestandsmuster, aber mit den vorhandenen Loadern (`loadManifest`/`fetchLayer`). Adress-Suche über die bestehende `address-search`-Komponente plus `resolveSpatialLevel`. Achromatopsie-Muster werden erstmals wirklich gerendert (MapLibre `addImage` + `fill-pattern`, zuschaltbar). Tabellen-Alternative über `DataTableAlternative` aus denselben abgeleiteten Rows.

## Boundaries & Constraints

**Always:**
- Steuerung ausschließlich über den Portal-Context (`getWahlPortalState`, `currentJahr`); der Ebenen-Toggle der Steuerleiste wird NICHT dupliziert. `stimmtyp` wird abgeleitet: bvv → `einstimme`, sonst `zweitstimme` (pure Helper + Test).
- Partei-Farben ausschließlich `parteiColor()` aus `partei-farben.ts`; das API-Feld `farbe_hex` wird bewusst ignoriert (Bestandsverhalten, eine Render-Quelle). Unbekannte Labels fallen auf `Sonstige`.
- Anteils-Intensität nach Bestandsrampe (Opacity `0.15→0.4` bis `0.45→0.9`); Rampen-Konstanten in einem `internal/`-Modul, von Expression und Legende geteilt.
- Kiez-Ebene joint über die client-seitige Slug-Brücke: `buildKiezSlugs` über die 143 `lor-bezirksregion`-Features (Bezirks-Namen aus `bezirke.geojson`, Muster `resolve-spatial-level.ts:139-152`); Bezirk über `normalizeSlug(Gemeinde_name)`. Join-Funktion pure + unit-getestet, nicht-gematchte Gebiete neutral (`Sonstige`-frei: `has_winner 0`, Opacity 0.1).
- Geometrie-Laden über `loadManifest`/`fetchLayer` (nicht die rohen fetch-Duplikate der Alt-Choroplethen); Karte nutzt den Navigator-Standard-Style `/map-style.json` als Basemap (wie `map-libre-canvas.svelte`, Matze 19.09.: NICHT der kahle Inline-Style der Alt-Choroplethen), Choropleth als halbtransparente Fläche darüber im Look der Atlas-Wertkarten; `fitBounds` einmalig, Cleanup per `map.remove()`.
- Adress-Suche: `address-search.svelte` mit injiziertem `geocodeAddress`; Treffer → `resolveSpatialLevel(lat,lng)` → Gebiet der AKTUELLEN Ebene wird hervorgehoben (Outline-Layer) und die Karte zoomt dorthin; kein Treffer außerhalb Berlins → Hinweis, kein Fehler.
- Wiederholungswahl: zeigt das aktive Jahr eine Wiederholungswahl, trägt die Kapitel-Caption den Hinweis „Wiederholungswahl" (Daten: `is_repeat_election` der Winners-Rows).
- Takeaway-Zeile (CAP-8-Vorgriff): deskriptiver Satz aus den Daten, z. B. „Stärkste Kraft in N von M Gebieten: X", generiert im pure Modul, `lint:wahl`-konform (kein „Hochburg", kein „Wahlsieger").
- Achromatopsie-Muster: Toggle „Muster anzeigen" rendert `fill-pattern` über pro-Partei generierte Pattern-Images (`parteiPattern()`-Typen stripes/dots/diagonal/solid; Sprite-Erzeugung nach `pin-sprite-renderer`-Muster); Toggle-Zustand ist flüchtig (kein URL/Storage).
- Hover-Tooltips im Navigator-Stil (Matze 19.09.): aussagekräftiger Tooltip nach dem `map-hover-tooltip.svelte`-Muster des Atlas (Gebietsname, stärkste Partei mit Farb-Swatch, Anteil in Prozent, Jahr + Wiederholungswahl-Hinweis), folgt dem Cursor bzw. Muster der Hauptkarte; kein nackter MapLibre-Klick-Popup mit HTML-String wie in den Alt-Choroplethen.
- A11y: Container `role="img"` + sprechendes `aria-label`; `DataTableAlternative` (Gebiet, Partei, Anteil, sortierbar) aus denselben derived Rows direkt unter der Karte; Partei-Legende mit sichtbaren Swatches (+ Muster-Vorschau bei aktivem Toggle).
- Karten-Grenzen (Matze 19.09.): `maxBounds` auf die Berlin-Bounding-Box (mit Puffer, Konstante aus `$lib/data/constants`/Hauptkarten-Muster) und passender `minZoom`, sodass Berlin weder aus dem Viewport geschoben noch beliebig weit herausgezoomt werden kann.
- Zustands-Wechsel (Reihe/Jahr/Ebene) aktualisieren die bestehende Map-Instanz über `setData`/`setPaintProperty`; die Karte wird dabei NIE zerstört oder leer (Matze-Live-Fund 19.09.: Karte verschwand bei Wert-Änderung bis zum Reload).
- DB-los/API leer: Kapitel zeigt Leerzustand-Hinweis statt Karte, keine 5xx, kein MapLibre-Init ohne Daten.
- TDD (ADR-012): Join, Slug-Brücke, stimmtyp-Ableitung, Rampe, Takeaway-Text test-first; Komponente als A11y-Hülle per `.svelte.test.ts`; E2E-Erweiterung in `berlin-wahlen.e2e.ts` mit `/api/wahl/winners`-Mock. Dateien < 500 Zeilen; kein Push/Deploy (Freeze).

**Never:**
- Keine Zeit-Animation, kein Jahr-Slider, keine Wechsel-Markierung (Story 5); keine Stimmbezirks-Ebene (Portal zeigt Kiez/Bezirk; Stimmbezirke bleiben den Detailseiten vorbehalten).
- Keine Änderung an Steuerleiste, Context-API-Shape (außer additiven Helpern), bestehenden Choroplethen oder `/api/wahl/*`-Responses.
- Kein `queryRenderedFeatures`-Accessibility-Layer (der ist für die Hauptkarte); keine Popup-HTML-Strings mit User-Input ohne Escaping.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy Path | Reihe agh, Jahr 2023, Ebene kiez | 143 Flächen in Partei-Farbe, Opacity nach Anteil; Legende zeigt vorkommende Parteien; Tabelle 143 Rows | N/A |
| Ebenen-Wechsel | Toggle bezirk | Karte lädt 12 Bezirks-Flächen, gleiche Färb-Logik, kein Re-Init-Fehler | N/A |
| Jahr-Wechsel | Chip 2016 | Nur Filter-Wechsel auf dem geladenen Winners-Response, keine neue API-Anfrage pro Jahr | N/A |
| Adress-Treffer | Auswahl „Alexanderplatz" | Karte zoomt, Kiez/Bezirk des Punkts bekommt Hervorhebungs-Outline, Gebietsname wird genannt | Punkt ohne Gebiet → Hinweis, keine Exception |
| Gebiet ohne Winner-Row | Feature ohne Match im Join | neutral gefärbt (Opacity 0.1), Tabelle ohne Row, kein Crash | N/A |
| Unbekannte Partei | Winners-Row mit neuem Kurznamen | Farbe/Pattern von `Sonstige`, Label bleibt der echte Kurzname | N/A |
| Muster-Toggle | aktivieren | Flächen zusätzlich gemustert nach `parteiPattern`; deaktivieren stellt Farbansicht wieder her | N/A |
| API leer / DB-los | `winners: []` | Leerzustand-Text im Kapitel, kein Karten-Init | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/wahl-stimmbezirk-choropleth.svelte:36-183` -- MapLibre-Hüllen-Muster (lazy import, Inline-Style ohne Basemap, Opacity-Expression, Popup, Cleanup); Vorlage, aber Loader modernisieren.
- `src/lib/data/manifest.ts:15` + `src/lib/data/internal/layer-fetch.ts:10` -- `loadManifest`/`fetchLayer` statt roher fetches; Layer-Slugs `lor-bezirksregion` (143, Props `BZR_ID`/`BZR_NAME`/`BEZ`) und `bezirke` (12, `Gemeinde_name`/`Gemeinde_schluessel`).
- `src/lib/data/internal/kiez-slug.ts:23` + `src/lib/data/resolve-spatial-level.ts:139-163` -- Slug-Brücke (buildKiezSlugs, disambiguierte Duplikate) und Punkt→Gebiet-Auflösung für die Adress-Suche.
- `src/lib/components/atlas/address-search.svelte:11-18` -- fertige Combobox (Props `variant`, `onSelect`, injiziertes `geocode`); `geocodeAddress` aus `$lib/data/geocode.remote`.
- `src/lib/data/partei-farben.ts:22-49` -- `parteiColor`/`parteiPattern`/`Sonstige`-Fallback; `INSPECTOR_BG` für Kontrast-Checks der Legende.
- `src/lib/components/atlas/internal/pin-sprite-renderer.ts` -- Canvas→`map.addImage`-Muster für die neu zu bauenden Partei-Patterns.
- `src/lib/components/atlas/data-table-alternative.svelte:1-29` -- generische Tabelle (`TableColumn<T>`), Kopplung nach `climate-long-view.svelte:273-277` (gemeinsame derived Rows unter der figure).
- `src/lib/state/wahl-portal-context.svelte.ts` -- `getWahlPortalState`, `currentJahr`, `jahreForReihe`; NEU (additiv): `stimmtypForReihe` in `src/lib/utils/wahl-portal-url-state.ts`.
- `src/routes/api/wahl/winners/+server.ts:69-80` -- Response-Shape `{winners:[{jahr, gebiet_slug, partei, anteil, is_repeat_election, …}], license, source_url}`; `gebiet_slug` = disambiguierter Text-Slug (kein BZR_ID!).
- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- Platzhalter-Zweig `id:'karte'` durch die neue Kapitel-Komponente ersetzen (als `children` von `kapitel-section`), Takeaway-Snippet dynamisch.
- `tests/e2e/berlin-wahlen.e2e.ts` -- E2E-Muster mit Route-Mocks; um `/api/wahl/winners`-Mock + Karten-Kapitel-Assertions erweitern.
- Neue Dateien: `src/lib/components/wahl-portal/winner-map.svelte` (+ `.svelte.test.ts`), `internal/winner-map-data.ts` (+ Test: Join, Slug-Brücke-Anwendung, Rampe, Takeaway), `internal/partei-pattern-images.ts` (+ Test der Pattern-Matrix), `winner-map-legende.svelte` (+ Test).
- Nicht anfassen: Alt-Choroplethen, `map-legend.svelte` (Atlas-Legende), `map-accessibility-layer.svelte`, Steuerleiste.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/utils/wahl-portal-url-state.ts` + Test -- `stimmtypForReihe` zuerst (rot)
- [x] `src/lib/components/wahl-portal/internal/winner-map-data.ts` + `.test.ts` -- pure: Winners-Filter aufs Jahr, Kiez/Bezirk-Slug-Brücke, Feature-Join mit Properties (partei, farbe, anteil, pattern, has_winner), Opacity-Rampen-Konstanten, Tabellen-Rows, Takeaway-Satz -- test-first gegen Fixture-GeoJSON + Fixture-Winners
- [x] `src/lib/components/wahl-portal/internal/partei-pattern-images.ts` + `.test.ts` -- Pattern-Bitmaps (stripes/dots/diagonal) pro Partei-Farbe als ImageData-Erzeuger
- [x] `src/lib/components/wahl-portal/winner-map-legende.svelte` + `.svelte.test.ts` -- Partei-Swatches der vorkommenden Parteien + Anteils-Rampen-Hinweis + Muster-Toggle
- [x] `src/lib/components/wahl-portal/winner-map.svelte` + `.svelte.test.ts` -- Kapitel-Komponente: Context-Konsum, Winners-Fetch pro Reihe (gecacht im Komponenten-State), MapLibre-Hülle, Adress-Suche + Hervorhebung, Popup, Leerzustand; Test nur DOM-Hülle/Leerzustand/Tabelle
- [x] `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- Karte-Kapitel einsetzen (Platzhalter raus), Takeaway dynamisch
- [x] `tests/e2e/berlin-wahlen.e2e.ts` -- Winners-Mock: Kapitel rendert Karte-Container, Tabelle-Toggle liefert Rows, Jahr-Wechsel ändert Takeaway ohne neuen winners-Request (Request-Counter im Mock)
- [x] `scripts/lint-wahl-editorial.ts`-Abdeckung prüfen (Portal-SCAN_DIR greift schon) + `pnpm lint:wahl` grün

**Acceptance Criteria:**
- Given der Winners-Mock mit zwei Jahren, when das Kapitel lädt und das Jahr wechselt, then färbt der Join deterministisch um und es gibt genau EINEN `/api/wahl/winners`-Request pro Reihe×Ebene.
- Given die 143-BZR-Fixture mit Duplikat-Namen, when die Slug-Brücke baut, then matchen alle `gebiet_slug`-Werte der API exakt (inkl. disambiguierter Slugs), Nicht-Matches bleiben neutral.
- Given eine Adress-Auswahl in Berlin, when `resolveSpatialLevel` ein Gebiet liefert, then wird genau dieses Gebiet hervorgehoben und benannt.
- Given `pnpm vitest run` (beide Projekte), `pnpm check`, `pnpm lint:wahl`, E2E `berlin-wahlen.e2e.ts` gegen Build, then alles grün.

## Implementation Notes

Neue Dateien wie im Code Map geplant (`winner-map-data.ts`, `partei-pattern-images.ts`,
`winner-map-legende.svelte`, `winner-map.svelte` + jeweilige Tests, plus Test-Harness
`internal/winner-map-context-probe.svelte` für den Context-Consumer-Test). Zusätzlich
`internal/partei-pattern-images.svelte.test.ts` für die Browser-only `ImageData`-Pfade
(Konvention aus `pin-sprite-renderer.test.ts`/`.svelte.test.ts`-Split übernommen).

Abweichungen von der reinen Spec-Prosa:
- `+page.svelte` rendert für das Karte-Kapitel keinen eigenen `takeaway`-Snippet mehr;
  `winner-map.svelte` zeigt den generierten Takeaway-Satz selbst direkt über der Karte
  (gleiche Typografie wie `KapitelSection`), da die Daten dafür ausschließlich in der
  Komponente vorliegen. Das `-takeaway`-Testid der anderen Platzhalter-Kapitel existiert
  für „karte" daher nicht mehr; stattdessen `winner-map-takeaway`.
- MapLibre-`fill-pattern` wird über `map.setPaintProperty` beim Toggle ein-/ausgeblendet
  statt über zwei Layer, um Style-Neuaufbau zu vermeiden.
- `fitBounds` läuft nur einmal beim initialen Karten-Aufbau (Boundary „einmalig"); der
  Adress-Treffer zoomt zusätzlich gezielt auf das gefundene Gebiet (eigener `fitBounds`-
  Call, kein Widerspruch zur Boundary, da das ein User-getriggertes Re-Fit ist, kein
  automatisches Re-Fit bei Daten-Updates).

Drei Live-Korrekturen von Matze während der Implementierung (19.09., alle bereits oben
in Boundaries/Code Map eingearbeitet):
1. **Basemap:** Karte nutzt `/map-style.json` (Muster `map-libre-canvas.svelte`/
   `map-embed.svelte`) statt Inline-Style; Sources/Layers werden erst im `load`-Handler
   ergänzt (bei einem Style aus einer URL geht das nicht vorher). Neues `mapReady`-Flag
   gate't Pattern-Toggle/Highlight-Updates, bis Style + Overlay-Layer stehen.
2. **Hover-Tooltip statt Klick-Popup:** neue `winner-map-tooltip.svelte` (+ Test) im
   Navigator-Stil (Muster `map-hover-tooltip.svelte`: `role="tooltip"`, positioniert über
   dem Cursor, kein HTML-String). Bewusst ein eigenes schlankes Bauteil statt Reuse der
   Atlas-Hover-Komponente, die an die generische Multi-Layer-Registry der Hauptkarte
   gekoppelt ist. Inhalt: Gebietsname, Partei-Swatch, Anteil, Jahr + Wiederholungs-Hinweis.
3. **Destroy-Bug + Bounds:** Reihe/Jahr/Ebene-Wechsel liessen die Karte verschwinden
   (Steuerleisten-Klick → neuer `/api/wahl/winners`-Request → `winnersStatus` kurz
   `'loading'` → `{#if}`-Zweig kollabierte → Container-DOM-Node weg, MapLibre-Instanz
   verwaist). Fix: neues `mapShown`-Flag kippt einmalig auf `true` und bleibt es; der
   Karten-Zweig fällt danach nie mehr aus dem `{#if}` heraus, Wechsel aktualisieren nur
   noch die bestehende Instanz (`setData`/`setPaintProperty`). Zusätzlich ein
   `mapInitializing`-Guard gegen doppelte Init bei überlappenden Effect-Läufen während des
   async Style-Imports, und `maxBounds`/`minZoom`/`maxZoom` (Werte wie
   `map-libre-canvas.svelte`) gegen Wegscrollen/beliebiges Herauszoomen.

Verifiziert: `pnpm vitest run --project server` (2664 Tests grün), `--project client`
(838 Tests grün), `pnpm check` (0 Fehler), `pnpm lint:wahl` (0 Verstöße), Production-Build
+ `pnpm exec playwright test tests/e2e/berlin-wahlen.e2e.ts` (4/4 grün, inkl. neuem
Regressionstest für den Ebenen-Wechsel-Destroy-Bug) und der bestehende Axe-Test
`tests/e2e/a11y.e2e.ts -g "Berlin-Wahlen-Portal"` (0 Violations, DB-loser Leerzustand).

## Spec Change Log

## Review Triage Log

## Design Notes

Die Winners-API liefert die ganze Reihe in einem Response (Story-2-Design für die spätere Zeit-Animation); die Komponente cached pro Reihe×Ebene und filtert client-seitig aufs Jahr, damit Story 5 nur noch die Animations-Steuerung ergänzt. Patterns als `fill-pattern` mit generierten Images statt SVG-Overlays, weil MapLibre-Füllungen kein DOM haben; `parteiPattern`-Typen existierten bisher nur als Daten-Attribut ohne Rendering.

## Verification

**Commands:**
- `pnpm vitest run --project server` und `pnpm vitest run --project client` -- expected: grün inkl. neuer Tests
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm exec vite build` + Preview + `pnpm exec playwright test tests/e2e/berlin-wahlen.e2e.ts --config <temp>` -- expected: alle E2E grün (Muster aus Story 3)
