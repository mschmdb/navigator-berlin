# Story 11.6: Grounded KI-Profile pro Kiez/Bezirk (Build-Step)

Status: review

> **Anker:** Stufe 2 der Analyse. Erzeugt menschlich lesbare, zitierfähige Prosa pro Kiez/Bezirk. **Owner-Decisions 2026-06-06:** Generierung NICHT in prebuild, eigener Script, committete Content-Files, Claude API zur Authoring-Zeit.
>
> **Abhängigkeiten:** Hard-Block 11.0 (Rang) + 11.4 (Vergleich) als Grounding-Input. Gated durch 11.7 (Fakten-Lint + Editorial). Optional gespeist von 11.8 (externe Prosa).

## Story

As a Discovery-User,
I want pro Kiez ein kurzes Prosa-Profil, das die Daten erzählt,
so that die Seite menschlich lesbar und für LLMs zitierfähig ist.

## Acceptance Criteria

1. **AC-1 (Eigener Script, NICHT prebuild):**
   **Given** die Owner-Decision Deploy-Entkopplung
   **When** ein Script `pnpm data:profiles` (Owner-getriggert, NICHT in `prebuild`) läuft
   **Then** generiert er je Kiez/Bezirk ein 2-3-Absatz-Profil via Claude API; der Build/Deploy ruft NIE die API

2. **AC-2 (Grounding):**
   **Given** Grounding-Disziplin
   **When** das Modell schreibt
   **Then** sind die einzigen Inputs vorhandene Werte (Aggregat, Wahlverlauf, Rang aus 11.0, Vergleich aus 11.4, optional 11.8); jede genannte Zahl existiert in der Datenbasis; keine freien Fakten, keine Wertung über Anti-Stigma hinaus

3. **AC-3 (Committete Content-Files):**
   **Given** ein generiertes Profil
   **When** der Script schreibt
   **Then** entsteht `src/lib/content/kiez-profile/{slug}.md` (bzw. `bezirk-profile/{slug}.md`) mit Frontmatter (slug, inputHash, generatedAt, model); die Detailseite liest die Datei statisch (null LLM-Calls beim Deploy)

4. **AC-4 (Inkrementalität):**
   **Given** Kosten-/Idempotenz-Ziel
   **When** der Script erneut läuft
   **Then** entscheidet ein Input-Hash (Aggregat + Rang + Vergleich) je Kiez, ob neu generiert wird; unveränderte Kieze werden übersprungen; `--force` erzwingt Regenerierung

5. **AC-5 (Render):**
   **Given** ein Profil-File
   **When** `kiez/[slug]` (+ bezirk) prerendert
   **Then** rendert die Seite das Profil als eigene Sektion; fehlt das File, rendert die Seite ohne Profil (graceful)

6. **AC-6 (ADR EU-FOSS-Ausnahme):**
   **Given** Claude API = US-Anbieter, Epic-4-Constraint „kein US-Drittanbieter im Production-Pfad"
   **When** die Pipeline gebaut wird
   **Then** dokumentiert ADR-016 die Ausnahme (Authoring-Zeit ≠ Production-Pfad, analog CI), Modellwahl + Kostenrahmen (Final-Doku in 11.10)

## Tasks / Subtasks

- [x] **Task 1: Grounding-Input-Builder** (AC: #2, #4)
  - [x] 1.1 (RED) Tests: Input-Objekt je Kiez (Aggregat+Rang+Vergleich), deterministischer `inputHash`
  - [x] 1.2 (GREEN) `scripts/lib/profiles/input.ts`: `buildProfileInput(slug)` + `hashInput()`
- [x] **Task 2: Generierungs-Script** (AC: #1, #3, #4)
  - [x] 2.1 `scripts/build-kiez-profiles.ts`: lädt Inputs, ruft Claude API, schreibt `src/lib/content/kiez-profile/{slug}.md` mit Frontmatter; Skip bei gleichem inputHash, `--force`-Flag
  - [x] 2.2 `package.json`: `"data:profiles": "tsx scripts/build-kiez-profiles.ts"` — NICHT in `prebuild` aufnehmen
  - [x] 2.3 API-Key via env (`.env`, nicht committen); Modell-ID konfigurierbar
- [x] **Task 3: Render** (AC: #5)
  - [x] 3.1 `kiez/[slug]/+page.server.ts`: Profil-File laden (gray-matter, bereits Dependency); `kiez-hero.svelte` rendert Sektion; graceful bei fehlend
  - [x] 3.2 Bezirk analog
- [x] **Task 4: ADR-Stub** (AC: #6)
  - [x] 4.1 `docs/adr/ADR-016-*.md` anlegen (Final-Text in 11.10): EU-FOSS-Authoring-Ausnahme, Modellwahl, Kosten

## Dev Notes

### Ist-Zustand + Muster

- **prebuild-Falle:** `package.json:8` `prebuild` enthält `data:faq` + `og:images` und läuft im Dockerfile-Build (`pnpm run build`) bei jedem Deploy. Profile DÜRFEN hier NICHT rein, sonst LLM-Call pro Deploy.
- `scripts/render-faq.ts` ist Struktur-Vorbild (Targets laden, pro Target rendern, persistieren) — aber Output ist hier Content-File, nicht DB, und Trigger ist manuell.
- `gray-matter` ist bereits Dependency (`package.json`) → Frontmatter-Parsing der Content-Files vorhanden.
- `src/lib/server/llms/kiez-renderer.ts` + `bezirk-renderer.ts` existieren (llms.txt). 11.9 klärt, ob Profile dort einfließen.
- Claude-API-Nutzung: siehe `claude-api`-Referenz für Modell-ID + Aufruf-Muster (separat, beim Implementieren laden).

### Architektur-Compliance

- **EU-FOSS:** API-Call nur im Owner-getriggerten Authoring-Script, nie im Production-/Deploy-Pfad. ADR-016 dokumentiert das.
- Reproduzierbarkeit (Epic 4): Output ist committetes File, Build deterministisch. Nicht-Determinismus des LLM ist durch Commit + Editorial-Gate (11.7) gekapselt.
- Files <500 Zeilen, TS strict, kein `any`. API-Key nie im Repo.

### Was nicht brechen darf

- `prebuild`/Deploy bleibt API-frei. Build bricht nicht, wenn kein API-Key gesetzt ist (Script ist optional).
- Fehlt ein Profil-File, rendert die Seite ohne Profil. `pnpm build` ohne `data:profiles` funktioniert.
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 7.1 (cancelled):** Auto-LLM-Writes via Hook wurden wegen Friction + Halluzinations-Risiko verworfen → bestärkt: manueller Trigger + Editorial-Gate, kein Auto-Hook.
- **Story 2.5b:** render-faq-Pipeline-Muster (Targets → render → persist).

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.6 + Hard-Constraints]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 2]
- [Source: package.json:8] (prebuild-Kette, NICHT erweitern)
- [Source: scripts/render-faq.ts] (Pipeline-Struktur-Vorbild)
- [Source: src/lib/server/llms/kiez-renderer.ts]
- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md] (ADR-Format-Vorbild, nächste Nummer 016)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code) — Generierung der 155 Profile via Subagenten (Opus); API-Script-Default `claude-sonnet-4-6`.

### Completion Notes List

- **Owner-Decision Hybrid (2026-06-07):** 155 Profile gratis via Subagenten (Subscription/Opus) generiert + als Content-Files geschrieben. API-Script `pnpm data:profiles` bleibt als session-unabhängiges Re-Gen-Tool (CI/Cron). Beides erzeugt dieselben committeten `.md`.
- Geteiltes Input-Lib `scripts/lib/profiles/build.ts` (buildAllInputs + hashInput) — von Generator UND Lint (11.7) genutzt, damit der Lint exakt denselben Input rekonstruiert.
- `--dump-inputs` gibt alle 155 ProfileInputs als JSON (keine API) → Basis für die Subagenten-Generierung.
- Render: `src/lib/server/profile/get-profile.ts` liest das Content-File zur Prerender-Zeit, kiez-hero/bezirk-hero rendern eine Profil-Sektion (graceful bei fehlend). 0 LLM-Calls beim Deploy, NICHT in prebuild.
- **Prompt via Prompt-Grader gehärtet** (siehe prompt-grader-runs/2026-06-07-0807): v1→v2 (+1.1), fand Namens-Leak + mss-Fehlinterpretation.
- **Fehler + Fix:** ad-hoc `tsx -e`-Import löste Top-Level-`main()` aus (unbeabsichtigter API-Lauf, Cent-Bereich). Guard ergänzt: `main()` läuft nur bei direktem Script-Start.
- ADR-016 (EU-FOSS-Authoring-Ausnahme) noch als Stub offen → Final-Text in Story 11.10.
- Verify: kiez/bezirk-Profil rendert live; alle 155 bestehen `lint:profiles`; `pnpm check` 0 Errors, Suite 2779 grün.

### File List

**Neu:** scripts/lib/profiles/{input,input.test,build,fact-lint,fact-lint.test}.ts, scripts/build-kiez-profiles.ts, src/lib/server/profile/get-profile.ts, src/lib/content/{kiez-profile/*.md (143), bezirk-profile/*.md (12)}
**Geändert:** package.json (data:profiles), kiez/bezirk +page.server.ts + +page.svelte, kiez-hero.svelte, bezirk-hero.svelte

## Change Log

- 2026-06-07: Story 11.6 implementiert. 155 grounded Profile (Hybrid: Subagenten gratis + API-Script als Tool), gehärteter Prompt, Render auf Detailseiten, prebuild-frei. Status → review.
