---
status: Accepted
date: 2026-06-07
deciders: solo-maintainer
---

# ADR-016: LLM-generierte Kiez/Bezirk-Profile zur Authoring-Zeit (EU-FOSS-Ausnahme)

## Context

Epic 11 (Story 11.6) führt grounded Prosa-Profile pro Kiez und Bezirk ein: ein 2-Absatz-Text, der die Aggregat-Daten menschlich lesbar einordnet. Die Generierung braucht ein LLM.

Epic 4 setzt eine harte Regel: **kein US-Drittanbieter im Production-Pfad** (EU-FOSS-Hosting auf Hetzner, keine US-Dependencies zur Laufzeit). Ein LLM-Generierungs-Schritt scheint dem zu widersprechen.

Zwei Optionen für das Modell:

- Claude API (Anthropic, US-Anbieter) bzw. Claude-Code-Subscription/Subagenten.
- Lokales/EU-Modell (strikt EU-FOSS, aber schwächerer Output, lokales Setup).

## Decision

**Profile werden zur Authoring-Zeit generiert, nicht zur Laufzeit.** Der Output sind committete statische Content-Files (`src/lib/content/{kiez,bezirk}-profile/{slug}.md`). Build und Deploy lesen diese Files; es gibt **keinen LLM-Call im Production- oder Deploy-Pfad** (nicht in `prebuild`, nicht im Dockerfile, nicht zur Request-Zeit).

Damit ist die LLM-Nutzung analog zu CI/Authoring-Tools (Editor, Linter, Generatoren), die ebenfalls US-Software sein dürfen, weil sie nicht im Production-Pfad laufen. **Die EU-FOSS-Regel gilt für den Production-Pfad; Authoring-Zeit ist davon ausgenommen.**

**Modellwahl (Hybrid, Owner-Decision 2026-06-07):**

- Bulk-Erstgenerierung der 155 Profile lief gratis über Claude-Code-Subagenten (Modell Opus 4.8), getrieben aus den via `pnpm data:profiles --dump-inputs` exportierten Inputs.
- `pnpm data:profiles` (Claude API, Default `claude-sonnet-4-6`) bleibt als session-unabhängiges Re-Generierungs-Tool (CI/Cron/andere Dev). Ein `tsx`-Script kann keine Subagenten aufrufen, daher der API-Pfad für Automatisierung.

**Kosten:** Erstlauf 0 € (Subscription). API-Pfad ~Cent-Bereich pro Volllauf (155 kurze Prompts). Inkrementell (`inputHash`) regeneriert nur geänderte Areas.

**Faktentreue-Gate:** `pnpm lint:profiles` (Story 11.7) prüft jede Zahl im Text gegen die Datenbasis und verbietet Gedankenstriche. Editorial-Gate = git-Diff-Review der committeten Files.

## Consequences

- Reproduzierbarkeit (Epic 4) bleibt gewahrt: der Build ist deterministisch, der nicht-deterministische LLM-Schritt ist durch Commit + Lint gekapselt.
- Kein US-Anbieter zur Laufzeit. Die Ausnahme ist eng auf die Offline-Authoring-Zeit begrenzt und hier dokumentiert.
- Profile veralten, wenn sich Daten ändern, bis ein erneuter Authoring-Lauf + Review erfolgt. `lint:profiles` meldet `stale` bei abweichendem `inputHash`.
- Der Prompt ist über den prompt-grader gehärtet (siehe `prompt-grader-runs/2026-06-07-0807-*`).

## Alternatives Considered

- **Lokales/EU-Modell:** strikt EU-FOSS, aber spürbar schwächerer deutscher Prosa-Output und lokaler Setup-Aufwand. Da die Generierung offline und einmalig/selten läuft, überwiegt der Qualitätsvorteil; bei Bedarf später nachrüstbar (nur der Generierungs-Backend tauscht, Files + Lint bleiben).
- **LLM zur Laufzeit/Build-Zeit:** verworfen. Würde EU-FOSS verletzen, den Build an API-Verfügbarkeit koppeln und Reproduzierbarkeit brechen.
- **Keine Profile, nur Tabellen:** verworfen, Owner-Befund „FAQ/Seiten zu generisch" (Quelle der Analyse).
