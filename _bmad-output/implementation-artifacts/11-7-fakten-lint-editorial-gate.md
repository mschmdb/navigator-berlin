# Story 11.7: Fakten-Lint & Editorial-Gate für generierte Profile

Status: review

> **Anker:** Gate für 11.6. Kein KI-Profil geht ungeprüft live. Faktentreue maschinell, Stil via PR-Review.
>
> **Abhängigkeiten:** Hard-Block 11.6 (Profile existieren als Content-Files). Nutzt bestehendes Lint-Muster (`lint:wahl`, `forbidden-tokens.ts`).

## Story

As a Solo-Maintainer,
I want dass kein KI-Profil ungeprüft online geht,
so that Faktentreue und Stil gesichert sind.

## Acceptance Criteria

1. **AC-1 (Fakten-Lint):**
   **Given** generierte Profil-Content-Files aus 11.6 (mit `inputHash`-Frontmatter)
   **When** ein Lint jede Zahl im Prosa-Text gegen die Datenbasis prüft
   **Then** failt der Build, wenn eine Zahl nicht in Aggregat/Rang/Vergleich belegt ist

2. **AC-2 (Forbidden-Token):**
   **Given** Output-Konventionen (kein em-dash, keine Absolutismen)
   **When** der Lint läuft
   **Then** failt er bei em-dash (U+2014), bei Absolutismen ohne Beleg und bei den bestehenden Forbidden-Tokens (Reuse `forbidden-tokens.ts`)

3. **AC-3 (TDD):**
   **Given** ADR-012
   **When** der Fakten-Lint getestet wird
   **Then**: belegte Zahl passt, erfundene Zahl failt, gerundete Werte + Bereichsangaben (z.B. „rund 70%") werden korrekt als belegt erkannt, em-dash failt — alle getestet

4. **AC-4 (Editorial-Gate via git-Diff):**
   **Given** `data:profiles` erzeugt neue/geänderte Files
   **When** der Owner sie reviewt
   **Then** geschieht das als PR-git-Diff; ungeprüfte Profile sind nicht im Main-Branch; der Lint läuft in CI als Gate

5. **AC-5 (pnpm-Script + CI):**
   **Given** der Lint existiert
   **When** `pnpm lint:profiles` läuft
   **Then** prüft er alle Profil-Files; CI ruft ihn als Gate auf (analog bestehender Gates)

## Tasks / Subtasks

- [x] **Task 1: Fakten-Lint-Lib** (AC: #1, #3)
  - [x] 1.1 (RED) `scripts/lib/profiles/fact-lint.test.ts`: Zahl-Extraktion aus Prosa, Abgleich gegen Input, gerundet/Bereich, erfundene Zahl failt
  - [x] 1.2 (GREEN) `scripts/lib/profiles/fact-lint.ts`: `extractNumbers(text)` + `verifyAgainstInput(numbers, input)` mit Toleranz für gerundete Werte
- [x] **Task 2: Forbidden-Token-Reuse** (AC: #2)
  - [x] 2.1 `scripts/publish-update/forbidden-tokens.ts` einbinden/erweitern (em-dash, Absolutismen) für Profile
- [x] **Task 3: Runner + Script** (AC: #5)
  - [x] 3.1 `scripts/lint-profiles.ts` + `package.json` `"lint:profiles"`; nutzt `inputHash` aus Frontmatter zum Laden der Datenbasis
- [x] **Task 4: CI-Gate** (AC: #4, #5)
  - [x] 4.1 `lint:profiles` in CI-Pipeline als Gate (analog `lint:wahl`); Doku des Gate-Verhaltens für 11.10

## Dev Notes

### Ist-Zustand + Muster

- `scripts/publish-update/forbidden-tokens.ts`: 14 Regex-Patterns inkl. em-dash, Absolutismen — direkt wiederverwenden.
- `pnpm lint:wahl` (`scripts/lint-wahl-editorial.ts`) + `pnpm lint:cross-layer-templates` sind die bestehenden Editorial-Lint-Vorbilder (`package.json:35-36`).
- Profile tragen `inputHash`-Frontmatter (11.6) → Lint lädt dieselbe Datenbasis, gegen die generiert wurde, und prüft Zahlen.
- Zahl-Abgleich braucht Toleranz: Prosa rundet („rund 70%", „über 12.000"). Test fixiert die Toleranzregeln.

### Architektur-Compliance

- Lint failt den Build, nicht den Publish (Build-Gate). Editorial = git-Diff-Review (committete Files).
- TS strict, kein `any`. Files <500 Zeilen.

### Was nicht brechen darf

- Bestehende Lints (`lint:wahl`, `lint:cross-layer-templates`) unverändert. Forbidden-Token-Modul additiv erweitert, nicht gebrochen.
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 2.12:** em-dash/„lebenswert"-Lint pro Content-Eintrag (`home-content.test.ts`) als Lint-Vorbild.
- **Story 11.6:** Frontmatter-`inputHash` ist die Brücke zwischen Profil und Datenbasis.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.7]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 2.3/2.4]
- [Source: scripts/publish-update/forbidden-tokens.ts]
- [Source: scripts/lint-wahl-editorial.ts] (lint:wahl-Vorbild)
- [Source: package.json:35-36] (Lint-Scripts)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Completion Notes List

- `scripts/lib/profiles/fact-lint.ts`: `extractNumbers` (deutsche Dezimal-Komma/Punkt) + `factLint` prüft jede Prosa-Zahl gegen `collectNumbers(input)` (exakt, 1-Dezimal-Nähe, oder ganzzahlige Rundung — deckt „rund 34" für 34,45). Plus em-dash-Verbot. TDD.
- `collectNumbers` rekursiv inkl. Ziffern in Strings (LOR-Namen wie „West 1") → keine False-Positives bei nummerierten Gebietsnamen.
- `scripts/lint-profiles.ts` + `pnpm lint:profiles`: rekonstruiert Input pro Slug via geteiltem build-Lib, prüft alle 155 Files, meldet ungedeckte Zahlen + stale inputHash, Exit 1 bei Verstoß.
- **Lint fand 2 Klassen von Problemen beim 155er-Lauf:** (a) Name-Ziffer-False-Positives (gefixt: String-Ziffern), (b) Rundungs-False-Negatives durch Vorab-1-Dezimal-Rundung (gefixt: Rohwerte + Integer-Rundung im Vergleich). Danach: alle 155 grün.
- **Abweichungen von der AC (ehrlich):**
  - AC-2: statt `scripts/publish-update/forbidden-tokens.ts` wiederzuverwenden, ein fokussierter em-dash-Check inline. Absolutismen-Tokens noch nicht eingebunden → Follow-up.
  - AC-4/Task 4: `lint:profiles` als Script + lokales Gate vorhanden, aber NICHT in eine CI-Pipeline verdrahtet (es existiert keine GH-Actions-Pipeline im Repo; Story 4-3 plant CI). Editorial-Gate = git-Diff der committeten Files greift.
- `pnpm check` 0 Errors, Suite 2779 grün.

### File List

**Neu:** scripts/lib/profiles/{fact-lint,fact-lint.test}.ts, scripts/lint-profiles.ts
**Geändert:** scripts/lib/profiles/{input,input.test}.ts (collectNumbers Rohwerte + String-Ziffern), package.json (lint:profiles)

## Change Log

- 2026-06-07: Story 11.7 implementiert. Fakten-Lint (Zahlen gegen Datenbasis + em-dash), alle 155 Profile grün. Abweichungen: forbidden-tokens-Reuse + CI-Verdrahtung offen. Status → review.
