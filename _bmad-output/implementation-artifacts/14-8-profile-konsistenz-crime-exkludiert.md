# Story 14.8: Profile-Konsistenz nach Score-Erweiterung (crime-exkludiert)

Status: review

> **Anker:** ADR-019 (Stigma-Schutz), Story 11.6/11.7 (Profil-Pipeline + Fakten-Lint). **Anders als 13.8: KEINE teure Profil-Regeneration**, sondern bewusste Exklusion + Lint-Absicherung.
> **Hard-Block:** Story 14.3 `done`.

## Story

As a Discovery-User,
I want dass die Prosa-Profile durch die neue Dimension NICHT stigmatisierend werden,
so that Kriminalität als Karten-Kontext existiert, ohne in den generierten Fließtext zu lecken.

## Kontext: Warum dieser Change

Story 13.8 hat die 155 Profile teuer regeneriert, weil Kultur + Versorgung in den Profil-Input flossen. **Kriminalität fließt bewusst NICHT in den Profil-Input** (ADR-019, Redlining-Schutz). Damit ist keine Regeneration nötig — im Gegenteil: diese Story stellt sicher, dass kein Profil Kriminalitäts-/Sicherheits-Aussagen enthält, und härtet den Fakten-Lint entsprechend.

## Acceptance Criteria

1. **AC-1 (Bewusste Exklusion aus dem Input):**
   **Given** der Grounding-Input-Builder (`scripts/lib/profiles/build.ts` + `input.ts`)
   **When** das erweiterte Score-Schema (mit `kriminalitaet`) eingelesen wird
   **Then** wird die Kriminalitäts-Dimension **NICHT** in den Profil-Input aufgenommen (Default-Exklusion, dokumentiert), der `inputHash` ändert sich durch diese Dimension nicht → keine Regeneration getriggert

2. **AC-2 (Lint-Härtung):**
   **Given** der Fakten-Lint (`scripts/lib/profiles/fact-lint.ts`)
   **When** er läuft
   **Then** failt er, falls ein Profil Kriminalitäts-/Sicherheits-Aussagen enthält (z. B. „gefährlicher/sicherer Kiez", „Kriminalität", „Verbrechen"), Stigma-Token-Liste erweitert (koordiniert mit 14.7 banned-words)

3. **AC-3 (Keine Drift):**
   **Given** die geänderte Score-Datenbasis (nach 14.3)
   **When** `pnpm data:profiles` prüft, ob Regeneration nötig ist
   **Then** ändert sich nichts an den Profilen durch Kriminalität; falls ein Schema-Reihenfolge-Effekt doch einen Hash ändert, wird der Diff der betroffenen Profile als **crime-frei** verifiziert

4. **AC-4 (Editorial-Gate):**
   **Given** PR-git-Diff + EU-FOSS-Constraint
   **When** reviewt wird
   **Then** `lint:profiles` grün, kein Profil erwähnt Kriminalität, **KEIN API-Call im Deploy/prebuild** (Owner-Decision 11.6 bleibt)

## Tasks / Subtasks

- [x] **Task 1: Input-Exklusion** (AC: #1, #3)
  - [x] 1.1 (Test) `build.test.ts`: Profil-Input enthält `kriminalitaet` NICHT, inputHash stabil ggü. Kriminalitäts-Wert (5/100/absent → identischer Hash)
  - [x] 1.2 `build.ts` `DIMS`: Kriminalität explizit ausgeschlossen (Kommentar + ADR-019-Verweis); kein Input-Eintrag
- [x] **Task 2: Lint-Härtung** (AC: #2, #4)
  - [x] 2.1 (RED) `fact-lint.test.ts`: Profile mit „gefährlich"/„Kriminalität"/„Einbruch"/„sicherer Kiez" failen
  - [x] 2.2 (GREEN) `fact-lint.ts`: `STIGMA_PATTERNS` + `stigmaHits` in LintResult, Runner meldet sie
- [x] **Task 3: Verify** (AC: #3, #4)
  - [x] 3.1 `pnpm lint:profiles` 155 grün (0 fail, 0 stale) ohne Regeneration; grep über alle 155 committed Profile: 0 Krimi-Begriffe

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- Profil-Pipeline: `scripts/lib/profiles/build.ts`, `input.ts` (+`input.test.ts`), `fact-lint.ts` (+`fact-lint.test.ts`). Inkrementell per `inputHash` (Story 11.6). 155 Profile (143 Kiez + 12 Bezirk). EU-FOSS: API nur Authoring, kein Deploy-Call.
- 13.8 hat Kultur + Versorgung in den Input genommen → Regeneration. Hier umgekehrt: bewusste Nicht-Aufnahme.

### Warum nicht in die Prosa

ADR-019: Kriminalität ist stigma-sensibel. Ein generierter Satz „in diesem Kiez ist die Kriminalität hoch" ist Redlining im Fließtext. Der Karten-Layer (14.4) + Inspector-Kontext reichen; die Prosa bleibt crime-frei. Analog werden strukturelle Stigma-Layer (Soziale Lage) nicht in die feel-good-Profile gewoben.

### Was nicht brechen darf

- Keine Profil-Regeneration durch diese Dimension (Kosten + Stigma). inputHash stabil.

## References

- `scripts/lib/profiles/build.ts`, `input.ts`, `fact-lint.ts` (+Tests)
- `docs/adr/ADR-019-kriminalitaet-score-dimension.md`
- `_bmad-output/implementation-artifacts/11-6-grounded-ki-profile-build-step.md`, `11-7-fakten-lint-editorial-gate.md`, `13-8-prosa-profile-regeneration.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`. TDD-first.

### Completion Notes List

- **Input-Exklusion (AC-1/3):** `DIMS` in `build.ts` führt Kriminalität bewusst NICHT (Kommentar + ADR-019). `buildInput` mappt nur über `DIMS` → die `kriminalitaet`-Spalte (aus 14.2) wird ignoriert. `build.test.ts` beweist: inputHash identisch mit/ohne Kriminalitäts-Wert → keine Regeneration getriggert.
- **Lint-Härtung (AC-2):** `fact-lint.ts` um `STIGMA_PATTERNS` (kriminalit/kriminell/verbrech/straftat/delikt/einbruch/raub/gefährlich/„(un)sicherer Kiez"/sicherheitslage/verwahrlos) + `stigmaHits` in `LintResult` erweitert; `ok` failt bei Treffern. Runner (`lint-profiles.ts`) meldet die Begriffe. Eng gefasst, damit Lebensqualitäts-Prosa durchläuft (Test).
- **Verify (AC-3/4):** `pnpm lint:profiles` = **155 checked, 0 failed, 0 stale**, OHNE Regeneration. grep über alle 155 committed Profile: 0 Kriminalitäts-/Sicherheits-Begriffe. Kein API-Call.
- **Operativer Fund (Cascade-Wipe):** lint:profiles failte zunächst mit „ungedeckte Zahlen" + 155 STALE — Ursache: `kiez_rank`/`bezirk_rank` waren leer (FK-Cascade beim `aggregate-scores`-Truncate, bekanntes Memory). Verifiziert pre-existing (Original-Lint-Code ohne Stigma-Check failte identisch). Behebung: `pnpm data:rank` + `data:comparison` neu (Memory-Prescription) → 180+2145 Einträge, lint grün. KEINE crime-bezogene Drift (0 stigmaHits in den Failures). Runtime-DB-Fix, kein File-Change.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2841/2841 grün** (7 neue: build 4 + fact-lint-stigma 3).

### File List

**Geändert:**
- `scripts/lib/profiles/fact-lint.ts` (Stigma-Patterns + stigmaHits) + `fact-lint.test.ts`
- `scripts/lib/profiles/build.ts` (DIMS-Kommentar Kriminalitäts-Exklusion)
- `scripts/lint-profiles.ts` (stigmaHits-Report)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-8 → review)

**Neu:**
- `scripts/lib/profiles/build.test.ts` (DIMS-Exklusion + inputHash-Stabilität)

**Nicht geändert (bewusst):** keine der 155 Profil-`.md` (keine Regeneration, Stigma-Schutz + EU-FOSS).

### Debug Log References

- `bezirk_rank`/`kiez_rank` waren 0 Zeilen → „4 von 12" im Profil ungedeckt. Nach `data:rank`+`data:comparison`: lint 155/0/0.
- grep crime-Terms über src/lib/content/{kiez,bezirk}-profile: 0 Treffer.

## Change Log

- 2026-06-09: Story 14.8 erstellt (ready-for-dev). Crime-Exklusion aus Profil-Input + Lint-Härtung statt Regeneration (Stigma-Schutz).
- 2026-06-10: Story 14.8 implementiert (→ review). DIMS-Exklusion (hash-stabil, getestet) + fact-lint Stigma-Patterns + Runner-Report. lint:profiles 155 grün ohne Regen. check 0, 2841 Tests grün.
