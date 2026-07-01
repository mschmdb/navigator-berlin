# Story 11.10: Epic-11-Dokumentation (Owner + LLM-Konsum)

Status: review

> **Anker:** Abschluss-Story. Dokumentiert das gesamte Epic 11 im `docs/`-Tree (Epic-7-Muster), damit kein Wissens-Drift entsteht. Läuft zuletzt, nach 11.0-11.9.
>
> **Abhängigkeiten:** Alle anderen Epic-11-Stories (dokumentiert deren Ergebnis). ADR-016 wird hier finalisiert (Stub aus 11.6).

## Story

As a Solo-Maintainer,
I want Epic 11 vollständig im `docs/`-Tree dokumentiert,
so that nach einer Wissens-Lücke alles auffindbar ist und kein Drift entsteht.

## Acceptance Criteria

1. **AC-1 (Scoring-Methodik erweitert):**
   **Given** Ranking/Quartil (11.0) + Vergleichs-Logik (11.4)
   **When** `docs/scoring-methodology.md` erweitert wird
   **Then** sind Rang-, Quartil- und Vergleichs-Berechnung beschrieben, inkl. Anti-Stigma-Framing (Quartil statt letztem Rang)

2. **AC-2 (FAQ-Style-Guide aktualisiert):**
   **Given** FAQ-Entrümpelung (11.2) + neue Daten-FAQ (11.3)
   **When** `docs/faq-template-style-guide.md` aktualisiert wird
   **Then** ist das neue Muster (Rang + Vergleich + Zahl, Antwort-First, Erklär-FAQ nur auf Methodik/Layer) dokumentiert

3. **AC-3 (AEO-Content-Strategie-Doc):**
   **Given** sameAs (11.1) + KI-Profil-Pipeline (11.6/11.7) + externe Quellen (11.8)
   **When** `docs/architecture/aeo-content-strategie.md` entsteht
   **Then** beschreibt sie Stufen 1-3, die `data:profiles`-Pipeline (Deploy-Entkopplung, Content-Files, Input-Hash, Editorial-Gate) und die externen Quellen mit Lizenz

4. **AC-4 (ADR-016 final):**
   **Given** die EU-FOSS-LLM-Ausnahme (Stub aus 11.6)
   **When** ADR-016 finalisiert wird
   **Then** dokumentiert sie Claude-API-Authoring-Ausnahme, Modellwahl, Kostenrahmen und Production-Pfad-Abgrenzung; ADR-Index aktualisiert

5. **AC-5 (Index + Generatoren + Frontmatter):**
   **Given** der `docs/`-Tree + Generatoren
   **When** die Doku abgeschlossen wird
   **Then** verweist `docs/INDEX.md` auf die neuen/aktualisierten Docs, `pnpm doc:pipelines` + `pnpm doc:story-map` sind neu generiert, Frontmatter (`type/audience/last-verified`) ist je neuer Datei gesetzt

## Tasks / Subtasks

- [x] **Task 1: Methodik + Style-Guide** (AC: #1, #2)
  - [x] 1.1 `docs/scoring-methodology.md`: Ranking/Quartil/Vergleich + Anti-Stigma-Abschnitt
  - [x] 1.2 `docs/faq-template-style-guide.md`: neues Template-Muster + Antwort-First + Methodik-Bündelung
- [x] **Task 2: AEO-Strategie-Doc** (AC: #3)
  - [x] 2.1 `docs/architecture/aeo-content-strategie.md` neu (Stufen 1-3, Pipeline, externe Quellen, Lizenz), Frontmatter
- [x] **Task 3: ADR-016** (AC: #4)
  - [x] 3.1 `docs/adr/ADR-016-*.md` finalisieren, `docs/adr/INDEX.md` aktualisieren
- [x] **Task 4: Index + Generatoren** (AC: #5)
  - [x] 4.1 `docs/INDEX.md` Verweise; `pnpm doc:pipelines` + `pnpm doc:story-map` ausführen; Frontmatter setzen

## Dev Notes

### Ist-Zustand

- `docs/`-Tree: `adr/`, `architecture/`, `pipelines/`, `recovery/`, `runbooks/`, `spikes/`. Index: `docs/INDEX.md` + `docs/adr/INDEX.md`.
- Generatoren: `pnpm doc:pipelines` (`scripts/generate-data-flow-doc.ts`) + `pnpm doc:story-map` (`scripts/generate-story-map.ts`, parst `sprint-status.yaml`).
- ADR-Stand: letzte = `docs/adr/ADR-015-score-composition-umwelt-infra.md` → neue = ADR-016.
- Frontmatter-Konvention `type/audience/last-verified` (Story 7.2/7.6).
- Bestehende relevante Docs: `docs/scoring-methodology.md`, `docs/faq-template-style-guide.md`, `docs/architecture/system-map.md`.

### Architektur-Compliance

- Content-First-Doku (Epic-7-Ansatz, Memory `project_epic_7_approach`): Narrative von Hand, Derivable via Generator. KEIN Auto-Hook.
- Keine em-dashes in Docs (Projekt-Output-Konvention).

### Was nicht brechen darf

- `pnpm doc:story-map` parst `sprint-status.yaml` per Line-Parse (js-yaml strippt Inline-Comments) → Format der Epic-11-Zeilen nicht verändern.
- Generatoren bleiben deterministisch.

### Previous Story Intelligence

- **Epic 7 (7.2/7.3/7.4/7.6):** docs-Tree, INDEX, System-Map, Generatoren, Frontmatter-Konvention — die Muster, an die sich diese Story hält.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.10]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, gesamte Analyse als Doku-Grundlage]
- [Source: docs/INDEX.md]
- [Source: docs/scoring-methodology.md]
- [Source: docs/faq-template-style-guide.md]
- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md] (nächste Nummer 016)
- [Source: scripts/generate-story-map.ts] (doc:story-map, Line-Parse-Constraint)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
