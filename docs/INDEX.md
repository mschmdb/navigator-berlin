---
type: architecture
audience: both
last-verified: 2026-06-30
related:
  - docs/recovery/wiedereinstieg.md
  - docs/architecture/system-map.md
  - docs/adr/INDEX.md
---

# docs/

Single-Entry für Owner + LLM-Agents. Alle System-Doku-Assets von navigator.berlin.

## Wiedereinstieg-Quickstart

Nach längerer Pause oder bei neuem Maintainer:

- [Wiedereinstieg-Playbook](./recovery/wiedereinstieg.md) — Local-Dev-Setup, Production-Access, Restart-Sequenz, häufige Bricks
- [Secrets-Map](./recovery/secrets-map.md) — Inventar aller Tokens/Passwörter mit Storage-Locations (keine Plaintext-Werte)

**Top-Runbooks bei akuten Problemen:**

- [server-bootstrap.md](./runbooks/server-bootstrap.md) — Hetzner-CPX22 von Null reproduzieren
- [add-update-entry.md](./runbooks/add-update-entry.md) — manueller Workflow für /updates-Einträge
- [publish-update-skill.md](./runbooks/publish-update-skill.md) — Skill-getriebener Workflow für /updates
- [indexnow-deploy-ping.md](./runbooks/indexnow-deploy-ping.md) — Bing-IndexNow-Push nach Deploy
- [local-postgres-setup.md](./runbooks/local-postgres-setup.md) — lokale Dev-DB bootstrappen
- [a11y-smoke-test.md](./runbooks/a11y-smoke-test.md) — Accessibility-Spot-Check

## Architektur

- [system-map.md](./architecture/system-map.md) — Service-Topology + Datenfluss + Build-Pipeline (Mermaid-Diagramme)
- [story-map.md](./architecture/story-map.md) — Tabelle aller Stories mit Status (auto-generiert via `pnpm doc:story-map`)
- [aeo-content-strategie.md](./architecture/aeo-content-strategie.md) — Kiez/Bezirk-Content + AEO (Epic 11): Ranking, Vergleich, KI-Profile, Pipeline, Quellen
- [ADR-Index](./adr/INDEX.md) — alle Architectural-Decision-Records mit Status

## Daten-Pipelines

- [pipelines/data-flow.md](./pipelines/data-flow.md) — Pro Layer: externe Quelle → Build-Step → Output-File (auto-generiert via `pnpm doc:pipelines`)
- [data-pipeline.md](./data-pipeline.md) — Legacy-Doku zur Aggregat-Schicht (in pipelines/ umziehen wenn überholt)
- [scoring-methodology.md](./scoring-methodology.md) — Kiez-Score-Berechnung (7 Dimensionen, 5 im Gesamt-Score + Kultur + Kriminalität eigenständig)
- [wahldaten-methodik.md](./wahldaten-methodik.md) — Wahldaten-Pipeline (Bundeswahlleiterin, Briefwahl, Aggregations-Strategie)
- [kriminalitaetsdaten-methodik.md](./kriminalitaetsdaten-methodik.md) — Kriminalitätsatlas Berlin (Polizei, HZ-Definition, Delikt-Auswahl, Caveats), siehe ADR-019
- [kuehle-orte-methodik.md](./kuehle-orte-methodik.md) — Kühle Orte (OSM ODbL 1.0 + redaktionelle Anreicherung, Kühle-Score, AC-Ehrlichkeit, Caveats), siehe ADR-020

## Operations

- [Runbooks-Ordner](./runbooks/) — alle Operations-Runbooks
- [Server-Bootstrap](./runbooks/server-bootstrap.md) — full Setup-Reproduktion
- [Update-Cadence-ADR](./adr/) — folgt mit 5-1/7-1-Stories

## Editorial-Regeln

- [editorial-review.md](./editorial-review.md) — Stil-Disziplin für Prosa
- [never-machine-translate.md](./never-machine-translate.md) — DE-only-Lock + Auto-Translate-Bann
- [faq-template-style-guide.md](./faq-template-style-guide.md) — FAQ-Template-Konventionen

## Skills (Claude-Code)

- `/publish-update` — Public-Changelog-Drafts aus Commit-Range (`scripts/publish-update/` + [SKILL.md](../.claude/skills/publish-update/SKILL.md))
- Geplant (Story 7.4 + 7.6): `/sync-pipeline-atlas`, `/sync-story-map` — Generator-basierte Doc-Refreshes

## Frontmatter-Convention (Story 7.2)

Jede `*.md` in `docs/` (außer ADRs, die haben eigenes Schema) trägt YAML-Frontmatter:

```yaml
---
type: architecture | adr | pipeline | recovery | runbook | editorial
audience: owner | llm | both
last-verified: YYYY-MM-DD
related: [docs/path-to-related.md]
---
```

`last-verified` älter als 90 Tage → Stale-Marker am File-Anfang (auto-inserted by Story 7.6).

## Meta

- Doku ist **intern-only** (Memory `project_epic_7_internal_only`). Hostnames, Secrets-Refs, Tool-Namen sind erlaubt. NICHT für Public-Konsum (das macht Site selbst via `/architektur`, `/datenschutz`, `/llms.txt`).
- Auto-Sync-Approach (Story 7.1): bewusst NICHT Lefthook-post-commit (siehe Memory `project_epic_7_approach`). Stattdessen narrow Slash-Skills für derivable Targets.
