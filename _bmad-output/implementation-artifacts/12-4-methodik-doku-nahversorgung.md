# Story 12.4: Methodik + Doku · Versorgung-Neudefinition

Status: review

> **Anker:** ADR-012 (Doku ist kein Test-First-Scope, aber Inhalte müssen zur Implementation stimmen). Epic-7-Doku-Muster.
> **Hard-Block:** Story 12.3 `done` (finale Gewichte stehen, sonst Doku veraltet).

## Story

As a User,
I want auf der Methodik-Seite verstehen, dass Versorgung jetzt öffentliche und private Alltagsversorgung mischt,
so that der erweiterte Score transparent und belegt bleibt.

## Kontext: Warum dieser Change

Die Versorgungs-Dimension deckt nach Epic 12 öffentliche Daseinsvorsorge (Kita, Schule, Krankenhaus, Spielplatz) UND private Nahversorgung (Lebensmittel, Apotheke, Post). Diese Semantik-Änderung muss in der öffentlichen Methodik und in der Owner-Doku stehen, plus eine ADR-Notiz zur bewussten Entscheidung inkl. Anti-Stigma-Abgrenzung (keine Kapital-Intensität, keine sozioökonomischen Rohindikatoren).

## Acceptance Criteria

1. **AC-1 (scoring-methodology.md):**
   **Given** die erweiterte Versorgungs-Dimension
   **When** `docs/scoring-methodology.md` aktualisiert wird
   **Then** der Versorgungs-Abschnitt (Dimension 5) listet Daseinsvorsorge UND Nahversorgung mit den finalen Term-Gewichten aus 12.3 + Quelle (OSM/ODbL)

2. **AC-2 (Methodik-Page):**
   **Given** `/methodik/kiez-score`
   **When** die Versorgungs-Beschreibung aktualisiert wird
   **Then** die `dimensions`-Array-Beschreibung für `versorgung` nennt die Nahversorgungs-Terme, die Quellenzeile führt OSM/ODbL

3. **AC-3 (ADR-Notiz):**
   **Given** die Score-Semantik-Änderung
   **When** eine ADR-Notiz entsteht (neue ADR oder Ergänzung in ADR-015-Umfeld)
   **Then** ist dokumentiert: Versorgung = öffentlich + privat, Anti-Stigma-Abgrenzung (warum KEINE Bodenwerte/Firmendichte/SGB-II als Wirtschafts-Score), Verweis auf die verworfene eigene Wirtschafts-Dimension

4. **AC-4 (INDEX + Konsistenz):**
   **Given** der `docs/`-Tree
   **When** die Doku abgeschlossen wird
   **Then** `docs/INDEX.md` verweist auf die Änderung, Frontmatter (`type/audience/last-verified`) gesetzt
   **And** keine Stelle behauptet mehr Versorgung = nur Daseinsvorsorge

## Tasks / Subtasks

- [x] **Task 1: scoring-methodology.md** (AC: #1)
  - [x] 1.1 `docs/scoring-methodology.md` „Fünf Dimensionen" Punkt 5 (Versorgung): Nahversorgungs-Terme + finale Gewichte + OSM/ODbL-Quelle ergänzen

- [x] **Task 2: Methodik-Page** (AC: #2)
  - [x] 2.1 `src/routes/(with-header)/methodik/kiez-score/+page.svelte` `dimensions`-Array (Z.26–63), Eintrag `versorgung`: `layers`/`detail` um Nahversorgung erweitern
  - [x] 2.2 Prosa-Stellen prüfen, die Versorgung nur als Daseinsvorsorge beschreiben

- [x] **Task 3: ADR-Notiz** (AC: #3)
  - [x] 3.1 Neue ADR-Datei `docs/adr/ADR-0XX-versorgung-nahversorgung.md` (nächste freie Nummer): Entscheidung Versorgung = öffentlich + privat, Anti-Stigma-Abgrenzung, verworfene Wirtschafts-Dimension. Stub-Muster aus `docs/adr/ADR-000-template.md`

- [x] **Task 4: INDEX + Verify** (AC: #4)
  - [x] 4.1 `docs/INDEX.md` Verweis + neue ADR eintragen
  - [x] 4.2 `pnpm check` ohne neue Errors, `pnpm doc:pipelines` / `doc:story-map` falls vorhanden neu generieren

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`docs/scoring-methodology.md`**: „Fünf Dimensionen", Versorgung ist Punkt 5 (Distanz Kita/Schule/Krankenhaus/Spielplatz/Grünanlage). Muss um Nahversorgung + Dichte-Logik erweitert werden.
- **`/methodik/kiez-score/+page.svelte`**: `dimensions`-Array Z.26–63 (5 Einträge, dynamisch gerendert). Versorgungs-Eintrag erweitern. Hinweis: Prosa „fünf Dimensionen"/„je 20 Prozent" Z.11/143/167/193/248/266 betrifft die **Dimensions-Anzahl** — die ändert Epic 12 NICHT (weiterhin 5 Dimensionen, Nahversorgung ist intern). Nur die Versorgungs-Beschreibung anpassen.
- **ADR-Verzeichnis** `docs/adr/`: ADR-015 ist Score-Composition-Anker. Neue ADR für die Versorgung-Neudefinition (nächste freie Nummer nach ADR-016).

### Abgrenzung zu Epic 13

Epic 13 (Kultur) ändert die Dimensions-Anzahl auf 6 und betrifft die „fünf Dimensionen"-Prosa-Stellen. Epic 12 NICHT — Versorgung bleibt eine von fünf Dimensionen. Doku hier nur Versorgungs-intern.

### Was nicht brechen darf

- Keine Behauptung „Versorgung = nur Daseinsvorsorge" mehr.
- Dimensions-Anzahl bleibt 5 (Epic 12).

## References

- `docs/scoring-methodology.md` (Dimension 5 Versorgung)
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` (dimensions Z.26–63)
- `docs/adr/ADR-000-template.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `docs/INDEX.md`
- `_bmad-output/implementation-artifacts/12-3-versorgung-umgewichtung.md` (finale Gewichte)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Completion Notes List

- `docs/scoring-methodology.md` Dimension 5: auf Dichte + öffentlich/privat + finale Gewichte + OSM/ODbL umgeschrieben (war noch auf alter Distanz-Formel inkl. Grünanlage), Verweis auf ADR-017.
- `/methodik/kiez-score/+page.svelte` Versorgungs-`detail` + `layers`: Nahversorgungs-Terme + aktualisierte Gewichte + OSM-Quelle (detail war ebenfalls veraltet, 0.30/0.30/0.25/0.15).
- **ADR-017** `docs/adr/ADR-017-versorgung-nahversorgung.md` neu: Versorgung = öffentlich + privat, Gewichts-Tabelle, Anti-Stigma-Abgrenzung (keine Kapital-Intensität, keine sozioökonomischen Rohindikatoren), verworfene eigene Wirtschafts-Dimension. `docs/adr/INDEX.md` um ADR-017-Zeile ergänzt.
- `docs/INDEX.md` verweist bereits auf `adr/INDEX.md` (→ ADR-017) + `scoring-methodology.md`; kein Per-ADR-Eintrag nötig.
- Dimensions-Anzahl bleibt 5 (Epic 12), „fünf Dimensionen"-Prosa unverändert korrekt.
- Doc-Generatoren (`doc:pipelines`/`doc:story-map`) bewusst NICHT hier — gehören in 12.6 (Doku-Closure + /updates).
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2784/2784 grün**.

### File List

**Neu:**
- `docs/adr/ADR-017-versorgung-nahversorgung.md`

**Geändert:**
- `docs/scoring-methodology.md` (Dimension 5 Versorgung)
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` (Versorgungs-detail + layers)
- `docs/adr/INDEX.md` (ADR-017-Zeile)

## Change Log

- 2026-06-07: Story 12.4 erstellt (ready-for-dev). Methodik + ADR-Notiz Versorgung-Neudefinition (öffentlich + privat). Dimensions-Anzahl bleibt 5.
- 2026-06-07: Story 12.4 implementiert (→ review). scoring-methodology + Methodik-Page aktualisiert (waren veraltet), ADR-017 neu + INDEX. check 0 Errors, 2784/2784 grün.
