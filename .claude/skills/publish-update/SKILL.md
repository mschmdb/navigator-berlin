---
name: publish-update
description: Manueller Changelog-Draft-Generator für /updates. Liest einen Commit-Range, klassifiziert relevante Commits, schreibt pro Commit eine Markdown-Draft-Datei nach `_content/updates/_drafts/`. Kein Auto-Commit, kein Auto-PR. Editorial-Gate beim Owner. Trigger via `/publish-update <commit-range>` oder `/publish-update --since=YYYY-MM-DD` oder `/publish-update --commit=<sha>`. Ohne Argument: letzte 24h.
---

# publish-update

## When to trigger

Nur auf explizite User-Invocation `/publish-update`. NICHT auto-trigger bei „lass uns einen Eintrag schreiben"-Konversation. Skill braucht klare Argumente.

## Preflight

1. Working-Tree clean (`git status --porcelain` muss leer sein, sonst bail).
2. `_content/updates/_drafts/` existiert (sonst anlegen).
3. `scripts/publish-update/system-prompt.txt` existiert.

## Argument-Parsing

- `HEAD~7..HEAD` ODER `<sha>..<sha>` = Range-Mode
- `--since=YYYY-MM-DD` = alle Commits seit Datum
- `--commit=<sha>` = single-commit
- kein Argument = `--since=heute-1Tag`

## Pipeline

Für jeden Commit im Range:

1. **Allowlist-Filter** (`scripts/publish-update/filter-commit.ts`): Commits mit ausschließlich denylisted Files (`.env`, `_bmad-output/`, `.claude/skills/`, `coolify.yml`, `lefthook.yml`, etc.) werden geskipped. Mixed-Commits (Allowlist + Denylist) ebenfalls geskipped mit Aufsplit-Hinweis.

2. **Subagent-Klassifikation** (`scripts/publish-update/invoke-classifier.ts`): Claude-CLI wird mit System-Prompt-Lock + Commit-Diff aufgerufen. Output: JSON nach `DraftResultSchema` (entweder `kind: skip` oder `kind: draft` mit category/title_de/summary_de/tags/body).

3. **Forbidden-Token-Lint** (`scripts/publish-update/forbidden-tokens.ts`): 14 Regex-Patterns (em-dash, „lebenswert", env-vars, hetzner, coolify, traefik, lefthook, github-actions-paths, commit-shas, docker, absolute-fs-paths, mietpreis-€/m²). Sammelt ALLE Verstöße inkl. Zeilennummer.

4. **Atomic Draft-Write** (`scripts/publish-update/write-draft.ts`): `_content/updates/_drafts/{YYYY-MM-DD}-{slug}.md`. Bei Lint-Verstoß Präfix `_FAIL_` + Markdown-Header mit Verstoß-Liste. Slug deterministisch aus title_de (DE-Umlaut-Translit).

## Output-Report

Pro Commit: Klassifizierung (✓/⏭/⚠) + SHA + Pfad oder Skip-Grund. Am Ende: Summary „X written, Y skipped, Z _FAIL_".

## CLI-Aufruf (intern via Bash-Tool)

```bash
pnpm publish-update HEAD~7..HEAD
pnpm publish-update --since=2026-05-09
pnpm publish-update --commit=abc1234
pnpm publish-update   # default: letzte 24h
```

## Editorial-Gate (NICHT teil dieses Skills)

Drafts in `_content/updates/_drafts/` sind gitignored. Owner reviewt manuell, dann:

```bash
git mv _content/updates/_drafts/2026-05-20-foo.md _content/updates/2026-05-20-foo.md
git add _content/updates/2026-05-20-foo.md
git commit -m "feat(updates): publish ..."
```

Bei `_FAIL_`-Drafts: Lint-Verstöße im Body korrigieren ODER Draft komplett verwerfen, NICHT promoten.

## Maintenance

- **Allowlist erweitern:** `scripts/publish-update/filter-commit.ts` → `ALLOWLIST_PATTERNS`-Array.
- **Forbidden-Tokens erweitern:** `scripts/publish-update/forbidden-tokens.ts` → `FORBIDDEN_PATTERNS`-Array + zugehöriger Test in `forbidden-tokens.test.ts`.
- **System-Prompt anpassen:** `scripts/publish-update/system-prompt.txt`. Änderungen führen zu unterschiedlichem Subagent-Output, daher nach Edit mindestens 1 manueller Test-Run mit Real-Commit.

## Memory-Marker

Konsumiert: `feedback_no_em_dashes`, `feedback_no_lebenswert`, `project_i18n_phase_1_de_only`, `project_server_purchase_sequencing`, `project_kiez_score_naming`.

## Story-Referenz

`_bmad-output/implementation-artifacts/5-8-public-update-skill.md`.
