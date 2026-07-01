# Story 15.7: Epic-15-Dokumentation (Pipelines + Story-Map + INDEX)

Status: ready-for-dev

> **Anker:** ADR-012 (TDD), `docs/INDEX.md`, `docs/architecture/system-map.md`, `docs/pipelines/data-flow.md` (auto-generiert). Abschluss-Story von Epic 15. Kein Feature-Code, reine Doku-Konsistenz plus eine Generator-Erweiterung.
> **Dependency:** 15.1–15.6 gelandet. Voraussetzung: `kuehle-orte` als `kind: 'local'`-Source in `scripts/lib/sources.ts` registriert (15.2), MANIFEST-Eintrag mit Lizenz vorhanden (15.2), `docs/kuehle-orte-methodik.md` + ADR existieren (15.6).
> **Ziel:** Kein Wissens-Drift. Pipeline-Atlas + Story-Map + INDEX + System-Map zeigen den neuen Layer und den Build-Pfad. Lizenz durchgängig verlinkt. Keine em-dashes.

## Story

As a Solo-Maintainer,
I want Epic 15 im docs-Tree dokumentiert,
so that kein Wissens-Drift entsteht.

## Kontext: Warum dieser Change

Der Pipeline-Atlas (`docs/pipelines/data-flow.md`) wird deterministisch aus `SOURCES` (`scripts/lib/sources.ts`) generiert. Sobald `kuehle-orte` als `kind: 'local'`-Source registriert ist (15.2), erscheint der Layer beim nächsten `pnpm doc:pipelines`-Lauf automatisch.

Der Generator kennt aber kein Konzept für einen vorgelagerten Build-Schritt. `build-kuehle-orte.ts` merged `enrichment.json` + `places-osm.json` zum build-input-GeoJSON, das die `local`-Source dann liest. Dieser Schritt taucht im Atlas nirgends auf. Das Acceptance Criterion verlangt explizit, dass `build-kuehle-orte.ts` im Pipeline-Atlas erscheint. Deshalb erweitert diese Story den Generator um ein optionales `buildStep`-Feld und rendert es.

Die Story-Map (`docs/architecture/story-map.md`) liest `sprint-status.yaml`. Die Epic-15-Zeilen existieren bereits (Zeilen 359–367). Ein erneuter `pnpm doc:story-map`-Lauf spiegelt den aktuellen Status, kein Code-Change nötig.

`docs/INDEX.md` und `docs/architecture/system-map.md` sind handgepflegt. Sie brauchen manuelle Verweise auf den neuen Layer, das Build-Script, die Methodik-Doku und den ADR. `/lizenzen` baut sich aus dem MANIFEST selbst auf, die ODbL-1.0-Attribution fließt also automatisch durch, sobald der MANIFEST-Eintrag steht (15.2).

## Acceptance Criteria

1. **AC-1 (Pipeline-Atlas zeigt Layer + Build-Pfad):**
   **Given** der neue `kuehle-orte`-`local`-Source plus `build-kuehle-orte.ts`
   **When** `pnpm doc:pipelines` läuft
   **Then** erscheint die `kuehle-orte`-Zeile im richtigen Bundle in `docs/pipelines/data-flow.md`
   **And** der zugehörige Build-Schritt `scripts/build-kuehle-orte.ts` ist im Atlas sichtbar (neue `buildStep`-Spalte, leer = `-` für Sources ohne Build-Schritt)
   **And** Frontmatter (`type`/`audience`/`last-verified`) bleibt gesetzt, `last-verified` auf den Generierungs-Tag aktualisiert

2. **AC-2 (Story-Map aktualisiert):**
   **Given** die Epic-15-Story-Zeilen in `sprint-status.yaml`
   **When** `pnpm doc:story-map` läuft
   **Then** erscheinen alle `15-*`-Stories unter `### Epic 15` in `docs/architecture/story-map.md` mit aktuellem Status-Badge

3. **AC-3 (INDEX + System-Map verweisen):**
   **Given** der neue Layer + Build-Pfad
   **When** `docs/INDEX.md` und `docs/architecture/system-map.md` geprüft werden
   **Then** verweist INDEX auf `docs/kuehle-orte-methodik.md` und den Kühle-Orte-ADR
   **And** die System-Map nennt `build-kuehle-orte.ts` als lokalen Build-Schritt im Datenfluss-Diagramm
   **And** beide `last-verified`-Daten sind aktualisiert

4. **AC-4 (Konsistenz + Lizenz):**
   **Given** die Doku-Konsistenz
   **When** geprüft wird
   **Then** sind Methodik + ADR + MANIFEST-Lizenz (OSM ODbL 1.0 + redaktionelle Anreicherung getrennt) verlinkt und stimmig
   **And** `/lizenzen` listet `kuehle-orte` mit ODbL-1.0-Attribution (auto aus MANIFEST)
   **And** keine em-dashes (U+2014) in neuen oder geänderten Docs

5. **AC-5 (TDD für Generator-Erweiterung):**
   **Given** ADR-012
   **When** die `buildStep`-Erweiterung der Pipeline-Atlas-Transform getestet wird
   **Then** decken Tests ab: `buildStep` wird auf `DataFlowRow` gemappt, fehlendes `buildStep` rendert `-`, gesetztes `buildStep` erscheint in der Tabellen-Zeile
   **And** `pnpm test` 100% grün

## Tasks / Subtasks

- [ ] **Task 1: Generator-Erweiterung `buildStep` (TDD)** (AC: #1, #5)
  - [ ] 1.1 (RED) `scripts/generate-data-flow-doc.test.ts` erweitern: Fixture-Source mit `buildStep: 'scripts/build-kuehle-orte.ts'` → `buildRowsFromSources` mappt es auf `DataFlowRow.buildStep`; Source ohne `buildStep` → `'-'`; `renderDataFlowMarkdown` rendert die `buildStep`-Spalte und die Zeile enthält den Script-Pfad
  - [ ] 1.2 (GREEN) `scripts/lib/types.ts`: optionales `buildStep?: string` an `SourceConfig` ergänzen (JSDoc: vorgelagertes Build-Script, das den `local`-Input erzeugt)
  - [ ] 1.3 (GREEN) `scripts/generate-data-flow-doc.ts`: `DataFlowRow` um `buildStep` erweitern, `buildRowsFromSources` füllt `s.buildStep ?? '-'`, `renderDataFlowMarkdown` rendert die zusätzliche Spalte `Build-Schritt`
  - [ ] 1.4 (GREEN) `scripts/lib/sources.ts`: am bereits registrierten `kuehle-orte`-Source `buildStep: 'scripts/build-kuehle-orte.ts'` setzen (kein neuer Source, nur Feld-Ergänzung)
- [ ] **Task 2: Doku regenerieren** (AC: #1, #2)
  - [ ] 2.1 `pnpm doc:pipelines` ausführen, `docs/pipelines/data-flow.md` zeigt `kuehle-orte`-Zeile + `build-kuehle-orte.ts` in der Build-Schritt-Spalte
  - [ ] 2.2 `pnpm doc:story-map` ausführen, `docs/architecture/story-map.md` zeigt `### Epic 15` mit allen `15-*`-Zeilen
- [ ] **Task 3: INDEX + System-Map manuell** (AC: #3, #4)
  - [ ] 3.1 `docs/INDEX.md`: unter „Daten-Pipelines" Verweise auf `docs/kuehle-orte-methodik.md` + Kühle-Orte-ADR ergänzen, `last-verified` aktualisieren
  - [ ] 3.2 `docs/architecture/system-map.md`: Datenfluss-Diagramm um lokalen Input (`static/data/kuehle-orte/*.json`) + Build-Schritt `build-kuehle-orte.ts` → build-input-GeoJSON → `data:fetch` (`local`) ergänzen, `last-verified` aktualisieren
- [ ] **Task 4: Konsistenz-Sweep + Lizenz-Verifikation** (AC: #4)
  - [ ] 4.1 Em-dash-Sweep über alle in dieser Story geänderten Docs (`rg $'\u2014' docs/`), Treffer ersetzen
  - [ ] 4.2 Querverweise prüfen: Methodik-Doku verlinkt ADR + MANIFEST-Lizenz, ADR verlinkt Methodik, INDEX verlinkt beide, keine toten relativen Links
  - [ ] 4.3 `/lizenzen` lokal verifizieren: `kuehle-orte` erscheint mit `ODbL 1.0` (Quelle: MANIFEST via `lizenzen/+page.ts`); redaktionelle Anreicherung getrennt attribuiert (im Methodik-Doc, nicht als Lizenz-Claim auf OSM-Daten)
- [ ] **Task 5: Abschluss** (AC: #5)
  - [ ] 5.1 `pnpm test` grün, `pnpm check` 0 Errors, generierte Docs committed

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **`pnpm doc:pipelines`** = `tsx scripts/generate-data-flow-doc.ts` (`package.json` Zeile 50). Liest `SOURCES`, gruppiert nach `bundleGroup`, schreibt `docs/pipelines/data-flow.md`. Reine Tabellen-Transform, kein Subagent. Aktueller Output: 50 Layer, Frontmatter `type: pipeline` / `audience: both` / `last-verified`.
- **`pnpm doc:story-map`** = `tsx scripts/generate-story-map.ts` (`package.json` Zeile 51). Raw-Line-Parse von `sprint-status.yaml` (`development_status:`-Block), behält Inline-Kommentare als Story-Kommentar, schreibt `docs/architecture/story-map.md`. Epic-15-Zeilen existieren bereits (`sprint-status.yaml` Zeilen 359–367).
- **Generator kennt KEINE Build-Schritte.** `buildRowsFromSources` (`generate-data-flow-doc.ts` Zeilen 31–40) mappt nur `slug`/`bundle`/`kind`/`source`/`license`/`stand`. Für AC-1 (build-kuehle-orte.ts sichtbar) ist die Erweiterung um `buildStep` der Kern-Change dieser Story.
- **`SourceKind`** ist aktuell `'fis-broker' | 'odis' | 'overpass' | 'dwd'` (`scripts/lib/types.ts` Zeile 21). `'local'` kommt aus Story 15.2. Diese Story setzt das nicht, sie nutzt den dann vorhandenen `kuehle-orte`-Source.
- **`/lizenzen`** baut `catalogDatasets` build-time aus `manifest.layers` (`src/routes/(with-header)/lizenzen/+page.ts`). Jeder Layer mit Detail-Page erscheint mit `layer.license`. ODbL 1.0 fließt automatisch durch, sobald der MANIFEST-Eintrag steht. Keine manuelle Lizenz-Liste pflegen.
- **`docs/INDEX.md`** + **`docs/architecture/system-map.md`** sind handgepflegt (Frontmatter `last-verified`, aktuell 2026-05-17). System-Map-Datenfluss-Diagramm hat eine `External`-Subgraph (OSM u. a.) und eine `Local Build`-Subgraph (`data:fetch`, `data:aggregate` …), aber keinen `local`-Input-Pfad.
- **Doku-Vorbild Layer-Foundation:** `docs/kriminalitaetsdaten-methodik.md` + ADR-019 + MANIFEST-Lizenz-Verweis (Story 14.0) zeigen das Muster „Methodik + ADR + Lizenz verlinkt".

### Design-Entscheidung: typisiertes `buildStep`-Feld statt Hardcoded-Map

`build-kuehle-orte.ts` im Atlas sichtbar zu machen geht auf zwei Wegen: eine Hardcoded-Slug→Script-Map im Generator, oder ein optionales `buildStep`-Feld an `SourceConfig`. Das Feld gewinnt: typsicher, kein Hardcoded-Daten-Verstoß, Single-Source-of-Truth bleibt `sources.ts`. Sources ohne Build-Schritt rendern `-` (gleiches Muster wie `bundle ?? '-'`). Der Generator bleibt deterministisch und test-first prüfbar.

`local`-Sources sind der erste Fall mit einem vorgelagerten Build-Script. Das Feld ist generisch genug für künftige `local`-Layer.

### Was nicht brechen darf

- **`data-flow.md` ist vollständig auto-generiert.** Keine manuellen Edits in die Datei schreiben, sie werden beim nächsten Lauf überschrieben. Änderungen nur über den Generator.
- **Bestehende 50 Atlas-Zeilen** dürfen sich durch die neue Spalte nicht inhaltlich ändern, nur die zusätzliche `Build-Schritt`-Spalte (`-` für alle bisherigen) kommt dazu. Die bestehenden Generator-Tests bleiben grün.
- **`/lizenzen` nicht manuell duplizieren.** Lizenz-Single-Source = MANIFEST. Diese Story verlinkt und verifiziert, sie pflegt keine zweite Lizenz-Liste.
- **Keine Lizenz-Vermischung:** OSM-Geometrie/Tags = ODbL 1.0. Redaktionelle Anreicherung (cool_score, suitable_reason …) ist getrennt zu attribuieren (Methodik-Doc), kein ODbL-Claim auf die Anreicherung und kein Anreicherungs-Claim auf OSM.
- **Story-Map-Parser** ist whitespace-/kommentar-sensitiv (`STORY_LINE_RE`). `sprint-status.yaml` nicht umformatieren.

## References

- `_bmad-output/planning-artifacts/epics-kuehle-orte.md` (Story 15.7, Zeilen 261–276; Requirements-Inventory FR1–FR20, Zeilen 19–38; Additional Requirements Zeilen 54–58)
- `package.json` (Zeilen 50–51: `doc:pipelines`, `doc:story-map`)
- `scripts/generate-data-flow-doc.ts` (`buildRowsFromSources` Zeilen 31–40, `renderDataFlowMarkdown` Zeilen 57–99)
- `scripts/generate-data-flow-doc.test.ts` (Test-Muster für Generator-Transform, Zeilen 24–84)
- `scripts/generate-story-map.ts` (`parseSprintStatus` Zeilen 41–68, `renderStoryMapMarkdown` Zeilen 70–123)
- `scripts/lib/types.ts` (`SourceConfig` Zeilen 33–76, `SourceKind` Zeile 21, `License` Zeilen 12–17)
- `scripts/lib/sources.ts` (SOURCES-Array, `kuehle-orte`-Source aus Story 15.2)
- `docs/pipelines/data-flow.md` (auto-generierter Atlas, Frontmatter Zeilen 1–8)
- `docs/architecture/story-map.md` (auto-generierte Story-Map)
- `docs/INDEX.md` (Daten-Pipelines-Abschnitt, Zeilen 43–49)
- `docs/architecture/system-map.md` (Datenfluss-Diagramm Zeilen 56–101)
- `src/routes/(with-header)/lizenzen/+page.ts` (MANIFEST-getriebene Lizenz-Liste)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Epic-15-Zeilen 359–367)
- `docs/kuehle-orte-methodik.md` + Kühle-Orte-ADR (aus Story 15.6, zu verlinken)
- `docs/adr/ADR-012-tdd-mandate.md` (TDD-Mandat)
- `_bmad-output/implementation-artifacts/14-0-kriminalitaetsatlas-layer-foundation.md` (Doku-Muster Methodik + ADR + Lizenz)

## Dev Agent Record

### Agent Model Used

_(vom Dev-Agent auszufüllen)_

### Completion Notes List

_(vom Dev-Agent auszufüllen)_

### File List

_(vom Dev-Agent auszufüllen)_

**Erwartet geändert:**
- `scripts/lib/types.ts` (`buildStep?` an `SourceConfig`)
- `scripts/generate-data-flow-doc.ts` (`DataFlowRow.buildStep` + Render)
- `scripts/generate-data-flow-doc.test.ts` (neue Test-Cases)
- `scripts/lib/sources.ts` (`buildStep` am `kuehle-orte`-Source)
- `docs/pipelines/data-flow.md` (regeneriert)
- `docs/architecture/story-map.md` (regeneriert)
- `docs/INDEX.md` (Verweise + `last-verified`)
- `docs/architecture/system-map.md` (Build-Schritt + `last-verified`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-7 → review)

### Debug Log References

_(vom Dev-Agent auszufüllen)_

## Change Log

- 2026-06-30: Story 15.7 erstellt (ready-for-dev). Generator-Erweiterung `buildStep` (TDD), Regenerierung Pipeline-Atlas + Story-Map, INDEX + System-Map manuell, Konsistenz-Sweep, Lizenz via MANIFEST verlinkt. 5 Acceptance Criteria.
