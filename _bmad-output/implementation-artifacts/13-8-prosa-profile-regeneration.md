# Story 13.8: Prosa-Profile-Regeneration nach Score-Erweiterung (Cross-Epic-Capstone)

Status: ready-for-dev

> **Anker:** Allerletzte Story beider Epics. Die grounded KI-Profile (Story 11.6) erzählen den Score in Prosa. Epic 12 (Versorgung erweitert) + Epic 13 (Kultur als 6. Dimension) ändern die Datenbasis → Profile + Input-Builder + Fakten-Lint müssen nachziehen, dann einmal regenerieren.
> **Hard-Block:** ALLE Stories Epic 12 + Epic 13 `done` — insbesondere 12.3 (finale Versorgungs-Werte), 13.3 (Kultur in Score + Rang + Vergleich), 13.5 (Kultur-metricKey in Rang/Comparison-Tabellen). Plus Story 11.6 + 11.7 (Profil-Pipeline + Fakten-Lint existieren).
> **Owner-Decision (11.6) bleibt:** Generierung Owner-getriggert, committete Content-Files, KEIN API-Call im Deploy/prebuild.

## Story

As a Discovery-User,
I want dass die Kiez-/Bezirks-Prosa-Profile die erweiterte Versorgung und den neuen Kultur-Score widerspiegeln,
so that kein Profil veraltete oder unvollständige Aussagen über die Datenbasis macht.

## Kontext: Warum dieser Change

Die 155 Profile (143 Kiez + 12 Bezirk) sind grounded gegen Aggregat + Rang (11.0) + Vergleich (11.4). Sie nennen konkrete Zahlen, die der Fakten-Lint (11.7) gegen die Datenbasis prüft. Nach Epic 12 + 13:

- **Versorgungs-Werte ändern sich** (Nahversorgung + Umgewichtung) → bestehende Profil-Aussagen zur Versorgung werden ungenau.
- **Kultur ist eine neue Dimension** → Profile erwähnen sie gar nicht, der Input-Builder liefert sie nicht, der Fakten-Lint kennt die Kultur-Zahl nicht.

Diese Story erweitert Input-Builder + Fakten-Lint + Prompt um die neue Datenlage und regeneriert die Profile einmal am Ende (nicht zweimal, Kosten).

## Acceptance Criteria

1. **AC-1 (Grounding-Input erweitert):**
   **Given** `scripts/lib/profiles/build.ts` + `input.ts` (geteilt mit dem Lint)
   **When** der Profil-Input erweitert wird
   **Then** enthält er die Kultur-Dimension (Wert) + Kultur-Rang + Kultur-Vergleich (Bezirks-Schnitt, Berlin-Median)
   **And** die geänderten Versorgungs-Werte fließen automatisch (gleicher Dimensions-Key `versorgung`, kein Struktur-Edit nötig)
   **And** der `inputHash` ändert sich entsprechend (triggert Regenerierung)

2. **AC-2 (Fakten-Lint erweitert):**
   **Given** `scripts/lib/profiles/fact-lint.ts` (Story 11.7)
   **When** er erweitert wird
   **Then** validiert er die Kultur-Zahl (+ etwaige Nahversorgungs-Bezüge) gegen die Datenbasis
   **And** `pnpm lint:profiles` bleibt grün für korrekte Profile, halluzinierte/veraltete Werte failen

3. **AC-3 (Prompt-Update):**
   **Given** der Generator-Prompt (`scripts/build-kiez-profiles.ts`, prompt-grader-gehärtet)
   **When** er aktualisiert wird
   **Then** darf das Modell die Kultur-Dimension + erweiterte Versorgung grounded erwähnen
   **And** Anti-Stigma bleibt: Center-Bias bei Kultur neutral formuliert (niedriger Wert = weniger Kulturorte in Reichweite, kein „kulturlos"/Wertung)

4. **AC-4 (Regeneration):**
   **Given** die neue Score-Datenbasis (nach 12.3 + 13.3)
   **When** `pnpm data:profiles` (bzw. `--force`) läuft
   **Then** werden die betroffenen Profile via `inputHash`-Inkrementalität neu generiert (oder alle 155 bei `--force`)
   **And** die committeten `.md` in `src/lib/content/{kiez-profile,bezirk-profile}/` sind aktualisiert (Frontmatter `inputHash`/`generatedAt`/`model`)

5. **AC-5 (Editorial-Gate + EU-FOSS):**
   **Given** das Editorial-Gate (PR-git-Diff) + Epic-4-Constraint
   **When** die regenerierten Profile reviewt werden
   **Then** `lint:profiles` grün, der Diff der 155 Profile ist im PR reviewbar
   **And** KEIN API-Call im Deploy/`prebuild` (Authoring-Zeit-only, ADR-016), Build funktioniert ohne API-Key

## Tasks / Subtasks

- [ ] **Task 1: Input-Builder erweitern** (AC: #1)
  - [ ] 1.1 (RED) `scripts/lib/profiles/input.test.ts`: Input enthält Kultur-Dimension + Rang + Vergleich; `inputHash` ändert sich
  - [ ] 1.2 (GREEN) `scripts/lib/profiles/build.ts` + `input.ts`: Kultur-Felder aus `kiez_score`/`bezirk_score` + Rang/Comparison-Tabellen ziehen (Versorgung automatisch über bestehenden Key)

- [ ] **Task 2: Fakten-Lint erweitern** (AC: #2)
  - [ ] 2.1 (RED) `scripts/lib/profiles/fact-lint.test.ts`: Kultur-Zahl wird validiert, halluzinierte Kultur-Zahl failt
  - [ ] 2.2 (GREEN) `scripts/lib/profiles/fact-lint.ts`: Kultur-Metrik in die Validierungs-Whitelist
  - [ ] 2.3 `pnpm lint:profiles` gegen Bestand grün (vor Regen — bestehende Profile dürfen noch keine Kultur nennen, kein False-Positive)

- [ ] **Task 3: Prompt** (AC: #3)
  - [ ] 3.1 `scripts/build-kiez-profiles.ts`: Prompt um Kultur + erweiterte Versorgung ergänzen, Anti-Stigma-Hinweis für Center-Bias
  - [ ] 3.2 Optional: Prompt-Grader-Re-Check (`prompt-grader-runs/`) ob Kultur-Erwähnung grounded + nicht-wertend bleibt

- [ ] **Task 4: Regeneration** (AC: #4)
  - [ ] 4.1 `pnpm data:profiles --force` (oder hash-getriggert), 155 Profile neu
  - [ ] 4.2 Stichprobe: Innenstadt-Profil erwähnt Kultur positiv, Außenbezirk neutral; Versorgungs-Aussagen aktuell

- [ ] **Task 5: Gate + Verify** (AC: #5)
  - [ ] 5.1 `pnpm lint:profiles` grün über alle 155
  - [ ] 5.2 PR-Diff der Profile reviewen (Editorial-Gate)
  - [ ] 5.3 `pnpm test`/`pnpm check` grün, Build ohne API-Key funktioniert

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **Profile:** `src/lib/content/kiez-profile/*.md` (143) + `bezirk-profile/*.md` (12), Frontmatter `slug/inputHash/generatedAt/model`.
- **Geteiltes Input-Lib** `scripts/lib/profiles/build.ts` (`buildAllInputs` + `hashInput`) — von Generator UND Lint genutzt, damit der Lint exakt denselben Input rekonstruiert. `input.ts` baut den Per-Slug-Input. `--dump-inputs` gibt alle 155 als JSON (keine API).
- **Generator** `scripts/build-kiez-profiles.ts` (Claude API, Default `claude-sonnet-4-6`; `main()`-Guard gegen versehentlichen Import-Lauf). `pnpm data:profiles`, `--force`. NICHT in `prebuild`.
- **Fakten-Lint** `scripts/lib/profiles/fact-lint.ts` (+test), `pnpm lint:profiles` (`scripts/lint-profiles.ts`). Jede Zahl im Profil muss in der Datenbasis existieren.
- **Render** `src/lib/server/profile/get-profile.ts` (statisch, graceful bei fehlend) — **kein Edit nötig**, liest weiter generisch das Content-File.
- **Prompt** prompt-grader-gehärtet (`prompt-grader-runs/2026-06-07-0807`, v1→v2: fand Namens-Leak + MSS-Fehlinterpretation).

### Warum einmal am Ende, nicht pro Epic

Die Profile referenzieren den ganzen Score (alle Dimensionen + Composite + Rang). Würde man nach Epic 12 regenerieren und dann nach Epic 13 nochmal, fielen doppelte LLM-Kosten an + zwei Editorial-Reviews. Daher Capstone nach beiden. Falls Epic 13 deferred wird, greift 13.8 für Epic 12 allein (Kultur-Teile in Input/Lint/Prompt werden No-op).

### Abhängigkeit zu Rang/Vergleich

Der Input zieht Rang (11.0) + Vergleich (11.4). Damit Kultur dort steht, muss **13.3** die Kultur-Spalte in `aggregate-ranks`/`aggregate-comparison` geschrieben haben. 13.8 erst nach erfolgreichem `data:rank` + `data:comparison` mit Kultur.

### Was nicht brechen darf

- `prebuild`/Deploy bleibt API-frei (ADR-016). Build ohne API-Key lauffähig.
- Fehlt ein Profil-File, rendert die Seite ohne Profil (graceful) — Render-Pfad unverändert.
- Fakten-Lint darf bestehende (noch Kultur-lose) Profile vor der Regen nicht fälschlich failen (Task 2.3).
- Reproduzierbarkeit: committete Files, Diff im PR.

### Architektur-Compliance

- **EU-FOSS (ADR-016):** API nur Authoring-Zeit, nie Production.
- **Anti-Stigma (ADR-015):** Center-Bias bei Kultur neutral, keine Wertung der Bewohner.
- Files < 500 Zeilen, TS strict, kein `any`, API-Key nie im Repo.

## References

- `scripts/lib/profiles/build.ts`, `input.ts` (+tests) — Grounding-Input, hashInput
- `scripts/lib/profiles/fact-lint.ts` (+test) — Zahlen-Validierung
- `scripts/build-kiez-profiles.ts` — Generator + Prompt
- `scripts/lint-profiles.ts` — `pnpm lint:profiles`
- `src/lib/server/profile/get-profile.ts` — Render (unverändert)
- `src/lib/content/{kiez-profile,bezirk-profile}/*.md` — Output
- `docs/adr/ADR-015-score-composition-umwelt-infra.md`, `docs/adr/ADR-016-*.md` (EU-FOSS-Authoring)
- `_bmad-output/implementation-artifacts/11-6-grounded-ki-profile-build-step.md`, `11-7-fakten-lint-editorial-gate.md`
- `_bmad-output/implementation-artifacts/13-3-pipeline-recompute-rerun.md` (Kultur in Rang/Vergleich)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.8 erstellt (ready-for-dev). Cross-Epic-Capstone: Profil-Input + Fakten-Lint + Prompt um Kultur/erweiterte Versorgung erweitern, 155 Profile einmal am Ende regenerieren. Hard-Block auf alle Stories Epic 12 + 13.
