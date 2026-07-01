# Story 8.1: Inspector globaler Level-Switch (Foundation)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want oben im Inspector einen globalen Level-Selector (Adresse / Kiez / Bezirk / Berlin),
so that ich die Spatial-Context-Tiefe für alle Sections gleichzeitig wählen kann.

## Acceptance Criteria

1. **Given** der ADR aus Story 8.0 (ADR-014), **When** ich `inspector-level-context.svelte.ts` als Svelte-Runes-Context implementiere mit globalem `currentLevel: 'address' | 'kiez' | 'bezirk' | 'berlin'`, **Then** alle Inspector-Sections können via Context den aktuellen Level lesen und reagieren.
2. **Given** der Context, **When** ich `inspector-level-toggle.svelte` oben im Inspector platziere (Segmented-Control), **Then** Level-Switch ist ein Klick, Default = Adresse (Backwards-Compatibility).
3. **Given** Backwards-Compatibility, **When** Inspector ohne Level-Context-Konsumenten rendert (z.B. Adress-Layer-Hits-Section), **Then** Sections funktionieren exakt wie vorher (Adresse-Default-Behavior), kein Re-Layout.
4. **Given** die Level-Definition aus ADR-014 Abschnitt 1, **When** der Level-Context den aktiven Kiez/Bezirk auflöst, **Then** liegt aus der aktuellen Adresse (lat/lng) der enthaltende `kiezSlug` (LOR-Bezirksregion, 143) und `bezirkSlug` (12) im Context vor, damit Konsumenten den richtigen Aggregat-Datensatz ziehen können.
5. **Given** Level=Kiez/Bezirk und keine Adresse selektiert (z.B. Inspector ohne Punkt), **When** der Context resolved, **Then** Kiez/Bezirk sind `null` und der Toggle disabled die nicht-auflösbaren Level statt einen kaputten Zustand zu erzeugen.
6. **Given** eine Section mit eigenem lokalem Level (Wahl-Section, Epic 6), **When** die Section gerendert wird, **Then** der globale Level dient als Default, aber die Section darf ihn lokal für sich selbst überschreiben (Koexistenz, User-Decision 2026-05-20). Der lokale Override beeinflusst NUR diese Section, NICHT den globalen Context oder andere Sections.

## Tasks / Subtasks

- [x] Task 1: Level-Context als Runes-Store anlegen (AC: #1, #4, #5)
  - [x] `src/lib/state/inspector-level-context.svelte.ts` nach dem Muster von `src/lib/state/ui-context.svelte.ts` (createUiState/getUiState) bauen: `InspectorLevelState` Interface + `createInspectorLevelState()` mit `$state` + `setContext(KEY, state)` + `getInspectorLevelState()` mit `getContext`, throw bei missing.
  - [x] `InspectorLevelState` Felder: `currentLevel: SpatialLevel` (Union `'address' | 'kiez' | 'bezirk' | 'berlin'`), `kiezSlug: string | null`, `bezirkSlug: string | null`, `kiezName: string | null`, `bezirkName: string | null`. Default `currentLevel = 'address'`.
  - [x] Pure Mutation-Functions exportieren: `setLevel(state, level)`, `resolveSpatialContext(state, lat, lng)` (setzt kiez/bezirk Slugs+Namen aus Punkt). Mutation-Pattern wie `toggleCompareMode()` in ui-context.svelte.ts.
  - [x] `SpatialLevel`-Union zentral exportieren (re-use in 8.2a/8.2b/8.5). Prüfen ob Wahl-Section bereits einen Level-Typ definiert (`WahlLevel` o.ä.) und ob ein gemeinsamer Typ sinnvoll ist (KEIN Merge erzwingen, Wahl-Level ist lokal/anders).
  - [x] Local-Override-Mechanik (AC #6): Sections können den globalen Level lokal überschreiben. Pattern-Vorschlag: Section liest den globalen Level als Default, hält bei Bedarf einen eigenen lokalen `$state` und schreibt NICHT zurück in den globalen Context. KEINE Pflicht für andere Sections, nur Wahl-Section nutzt es initial. Context-API so gestalten dass Lesen ohne Override trivial bleibt (Sections die nichts überschreiben sehen einfach `currentLevel`).
- [x] Task 2: Spatial-Resolution Kiez/Bezirk aus Punkt (AC: #4, #5)
  - [x] Helper `resolve-spatial-level.ts` (Pure-Function) in `src/lib/data/`: nimmt lat/lng, liefert `{ kiezSlug, kiezName, bezirkSlug, bezirkName }` via Point-in-Polygon gegen LOR-Bezirksregion (143) + Bezirke (12). Reuse `@turf/boolean-point-in-polygon` + `buildIndex`/RBush aus `src/lib/data/internal/spatial-index.ts` und das Lade-Pattern aus `src/lib/data/get-layers-at-point.ts`.
  - [x] Boundary-Sources: `static/layers/lor-bezirksregion.*.geojson` (Property `BZR_ID`/`BZR_NAME`) + `static/layers/bezirke.*.geojson` (Property `Schluessel_gesamt`/`Gemeinde_name`). Slugs aus MANIFEST.json auflösen, NICHT Filename hardcoden.
  - [x] Berlin-Level braucht keine Resolution (Gesamt-Aggregat).
- [x] Task 3: Level-Toggle-Komponente (AC: #2, #3, #5)
  - [x] `src/lib/components/atlas/inspector-panel/inspector-level-toggle.svelte`: Segmented-Control mit 4 Stufen. @lucide/svelte Icons. A11y: `role="radiogroup"` + arrow-key-Navigation, aria-checked, sichtbarer Fokus-Ring.
  - [x] Nicht-auflösbare Level (kiez/bezirk null) disabled darstellen (aria-disabled) statt Klick zuzulassen.
  - [x] Mobile (≤390px): horizontal scrollbar-frei, hyphens/break wo nötig (Memory `feedback_mobile_first`).
- [x] Task 4: Context in Inspector mounten + Backwards-Compat sichern (AC: #1, #3)
  - [x] In `src/lib/components/atlas/inspector-panel.svelte` `createInspectorLevelState()` aufrufen (Composition-Root des Inspectors), Toggle in sticky-Toolbar unter Header platzieren (Memory `feedback_inspector_toolbar_top`: Toolbar oben, nicht Footer).
  - [x] `resolveSpatialContext` an `ui.selectedAddress`/Punkt-Wechsel koppeln via `$effect`.
  - [x] Bestehende Sections NICHT verändern: bei `currentLevel === 'address'` rendert alles unverändert. Dieser Story-Scope ist NUR Foundation, KEINE Section adaptiert noch auf Level (das ist 8.2b/Wahl bleibt eigenständig).
- [x] Task 5: Tests (TDD, AC-Mapping)
  - [x] `resolve-spatial-level.ts`: Unit-Tests Punkt-in-Kiez, Punkt-in-Bezirk, Punkt außerhalb Berlin (null), Grenz-/Brandenburg-Fall (Memory `project_berlin_click_guard`). Coverage ≥90% (Pure-Function, kritischer Pfad).
  - [x] `inspector-level-context.svelte.ts`: Unit-Tests Default=address, setLevel, resolveSpatialContext setzt Slugs, missing-context throw.
  - [x] `inspector-level-toggle.svelte`: vitest-browser Component-Test: 4 Stufen rendern, Klick setzt Level, disabled-Level nicht klickbar, radiogroup-a11y. KEIN fetch-Spy in *.svelte.test.ts (Memory `feedback_browser_test_fetch_spy`): Daten-Load in Page/Context-Layer, Toggle bekommt State als Prop/Context.
  - [x] Red-then-Green-History pro AC im Commit nachvollziehbar (ADR-012).

## Dev Notes

### Foundation-Scope-Disziplin

Diese Story baut NUR das Fundament: Context + Toggle + Spatial-Resolution. Sie adaptiert KEINE Section. Bei `currentLevel === 'address'` ist das Verhalten bit-identisch zu heute (AC #3, ADR-014 Abschnitt 6 Backwards-Compat-Zeile "Adress-Layer-Hits-Section"). Hard-Block für 8.1b/8.2b/8.3/8.4 (sprint-status + ADR-014 Story-Mapping).

### Runes-Context-Pattern (Pflicht-Vorlage)

`src/lib/state/ui-context.svelte.ts` ist die etablierte Vorlage:
- `createUiState()` (ca. Z.61-90): `$state<UiState>()` + `setContext(KEY, state)`.
- `getUiState()` (ca. Z.92-100): `getContext<UiState|undefined>(KEY)`, throw bei missing.
- Mutationen sind Pure-Functions die State direkt mutieren (z.B. `toggleCompareMode()` Z.163-170).

Den exakt gleichen Stil für `inspector-level-context.svelte.ts` spiegeln. NICHT eine zweite, abweichende Context-Konvention erfinden.

### Spatial-Resolution: Boundaries + CRS

- LOR-Bezirksregion (143, `BZR_ID`/`BZR_NAME`) und Bezirke (12, `Schluessel_gesamt`/`Gemeinde_name`) liegen unter `static/layers/` mit Hash-Filename, Slug-Auflösung über `static/layers/MANIFEST.json`.
- Reuse vorhandener Geo-Helfer: `@turf/boolean-point-in-polygon` + RBush-Index aus `src/lib/data/internal/spatial-index.ts` (`buildIndex`, cached per filename), Lade-/Bbox-Pattern wie `src/lib/data/get-layers-at-point.ts`.
- CRS: Boundary-Layer in `static/layers/` sind bereits WGS84 (Build-Pipeline normalisiert, Memory `project_odis_crs_mixed` betrifft die Roh-Endpoints, nicht die ausgelieferten Layer). Trotzdem lat/lng-Reihenfolge (GeoJSON = [lng, lat]) beachten.
- Brandenburg-/Außerhalb-Fall: kiez/bezirk = null (AC #5), kein Crash. Click-Guard-Logik existiert (Memory `project_berlin_click_guard`).

### Level-Definition (ADR-014 Abschnitt 1)

`address | kiez | bezirk | berlin`. Kiez = LOR-Bezirksregion (143), Bezirk = 12, Berlin = gesamt. Planungsraum (542) ist NICHT als User-Level exponiert, bleibt interne Aggregat-Quelle (relevant erst für 8.2a).

### Toolbar-Platzierung

Sticky-Toolbar unter Inspector-Header (`inspector-panel.svelte` ca. Z.296-381 enthält heute Bookmark/Compare/Share/Empty-Toggle). Level-Toggle dort einreihen (Memory `feedback_inspector_toolbar_top`).

### Project Structure Notes

- Neue Files: `src/lib/state/inspector-level-context.svelte.ts`, `src/lib/data/resolve-spatial-level.ts`, `src/lib/components/atlas/inspector-panel/inspector-level-toggle.svelte` + zugehörige `*.test.ts`.
- Touch: `src/lib/components/atlas/inspector-panel.svelte` (Context mounten + Toggle einsetzen, sonst unverändert).
- Files <500 LOC (User-Global-Rule). inspector-panel.svelte ist bereits ~451 LOC: Toggle als eigene Komponente halten, nicht inline aufblähen.
- @lucide/svelte (NICHT lucide-svelte).

### TDD (ADR-012)

Business-Logic (resolve-spatial-level, context) ist Test-First-Pflicht. Coverage Pure-Function/kritischer Pfad ≥90%. Toggle-Komponente Component-Smoke. Hand-off-Gate: `pnpm test` 100% grün + `pnpm check` 0 Errors.

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#1-vier-spatial-level-default]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#6-backwards-compatibility]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.1]
- [Source: src/lib/state/ui-context.svelte.ts (Runes-Context-Vorlage)]
- [Source: src/lib/data/get-layers-at-point.ts + src/lib/data/internal/spatial-index.ts (Geo-Helfer)]
- [Source: static/layers/MANIFEST.json (Layer-/Boundary-Slug-Auflösung)]
- [Source: docs/adr/ADR-012-tdd-mandate.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD dev-story)

### Debug Log References

- Pre-existing `pnpm check`-Errors in `src/lib/webmcp/mount.ts` + `src/routes/+layout.svelte` (de/en-Vergleich, Phase-1-DE-only-Lock). NICHT von dieser Story berührt, kein Regress.
- vitest-browser Click-Util verweigert `aria-disabled`-Elemente (Retry → Fail). Test nutzt `click({ force: true })` um den Komponenten-eigenen `select()`-Early-Return zu prüfen.

### Completion Notes List

- TDD red-then-green pro Modul: resolve-spatial-level (4 Tests), inspector-level-context (7 Tests), inspector-level-toggle (5 Tests). 16/16 grün.
- Architektur-Split (Memory `feedback_browser_test_fetch_spy`): Fetch lebt in `resolveSpatialLevel` (Daten-Layer, im `*.test.ts` per fetch-Mock getestet). Context-Mutation `applySpatialContext` ist pure → `*.svelte.test.ts` braucht keinen fetch-Spy.
- `SpatialLevel`-Union zentral in `resolve-spatial-level.ts` (plain `.ts`, damit Build-Scripts 8.2a sie ohne Runes-Import nutzen können), aus dem Context re-exportiert.
- Wahl-Section hat einen eigenen `LevelKey` (`stimmbezirk|kiez|bezirk|berlin`) — bewusst NICHT gemerged (`address` vs `stimmbezirk`). AC #6 Local-Override via Doc-Kontrakt im Context erfüllt, Wahl-Section bleibt eigenständig.
- Kiez/Bezirk-Slug via `normalizeSlug(name)` — gleiche Join-Key-Konvention wie `get-kiez-score`/`get-bezirk-profile`, damit 8.2a-Aggregate matchen.
- Backwards-Compat (AC #3): Default `currentLevel='address'`, bei address-Level rendert der Inspector bit-identisch. inspector-panel.svelte.test.ts (29 Tests) ohne Regress grün.
- AC #5 Broken-State-Guard: nach async-Resolve fällt ein nicht-auflösbarer aktiver Level auf `address` zurück; Toggle stellt nicht-auflösbare Level `aria-disabled` dar.

### File List

Neu:

- `src/lib/data/resolve-spatial-level.ts`
- `src/lib/data/resolve-spatial-level.test.ts`
- `src/lib/data/__fixtures__/spatial-level-manifest.json`
- `src/lib/data/__fixtures__/spatial-level-bezirke.geojson`
- `src/lib/data/__fixtures__/spatial-level-bezirksregion.geojson`
- `src/lib/state/inspector-level-context.svelte.ts`
- `src/lib/state/inspector-level-context.svelte.test.ts`
- `src/lib/state/inspector-level-missing-provider.svelte`
- `src/lib/components/atlas/inspector-panel/inspector-level-toggle.svelte`
- `src/lib/components/atlas/inspector-panel/inspector-level-toggle.svelte.test.ts`

Geändert:

- `src/lib/components/atlas/inspector-panel.svelte` (Context-Mount + Level-Toggle-Row + Spatial-Resolve-`$effect`)
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (vorbestehender Bug: 5 fehlende `wahlbezirke-*`-Einträge im Coverage-Guard ergänzt)

## Change Log

- 2026-05-20: Story 8.1 implementiert (Foundation Multi-Level-Inspector): Spatial-Level-Context + Resolve-Pure-Function + Level-Toggle-Komponente, in inspector-panel.svelte gemountet. 16 neue Tests, address-Default backwards-compatible. Status → review.
- 2026-05-20: Vorbestehenden Bug gefixt: `layer-explain.ts` Coverage-Guard schlug fehl (5 `wahlbezirke-*`-Slugs ohne `LAYER_EXPLAIN_DE`-Entry). Einträge ergänzt, layer-explain.test.ts 14/14 grün.
- 2026-05-20: UX-Fix nach Review-Feedback: Level-Toggle von `flex overflow-x-auto` auf `grid grid-cols-4 w-full` (kein hässlicher Scrollbar, „Berlin" nicht mehr abgeschnitten). Spatial-Resolve-`$effect` mit `.catch()` gehärtet (kein unhandled rejection bei Boundary-Fetch-Fail).
- 2026-05-20: UX-Fix 2 nach Review-Feedback: Icons aus Level-Toggle entfernt + Truncate raus. Icons + 4 gleiche Spalten erzwangen abgeschnittene Labels („Ad…", 2× „Be…"). Jetzt volle Labels „Adresse/Kiez/Bezirk/Berlin", text-zentriert, passen ohne Kürzung.
