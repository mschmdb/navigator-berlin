---
title: 'Öffentliches Repo aufräumen'
type: 'chore'
created: '2026-10-15'
status: 'in-progress'
route: 'dispatch'
baseline_commit: '0f70d61'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent, do not modify unless human renegotiates">

## Intent

**Problem:** Das öffentliche Repo wirkt durcheinander. Prozessmaterial (`_bmad-output/`, 460 Dateien, 13,7 MB) liegt unter einem Werkzeug-Namen im Root, mit QA-Screenshots, Brainstorming-HTML, Rohdaten und internen Zahlen. Es fehlen `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS` und eine CI. Prettier meldet 266 unformatierte Dateien. `package.json` steht auf 0.1.0, obwohl v0.5.0 veröffentlicht ist.

**Approach:** Erzeugtes aus dem Index nehmen, Sensibles entschärfen, Prozessmaterial unter `docs/process/` bündeln (BMAD-Pfade per Override), Public-Dateien und minimale CI ergänzen, einmal alles formatieren.

**Entscheidungen (Matze 15.10.2026: „aufräumen gern eher mehr als weniger“, CI „minimal“, CODEOWNERS ja, Prettier-Altlasten angehen):**
1. `git rm --cached` + `.gitignore`: `_bmad-output/implementation-artifacts/screenshots/`, `_bmad-output/brainstorming/`, alle `.memlog.md`, Übersetzungs-Rohdaten (`*.json` in implementation-artifacts), Zwischenstände `c5-profiles-en/`, `c4d-updates-en/` und `spike-artifacts/`, sofern kein Code sie zur Laufzeit oder im Build liest (prüfen; sonst bleiben sie).
2. Sensibles entschärfen: konkrete Plausible-Zahlen (Besucher, Bounce, Sessions) in Planungs-/Audit-Dateien durch qualitative Aussagen ersetzen; `docs/runbooks/server-bootstrap.md` ohne echten Admin-Benutzer, Backup-Ziel außerhalb des Repos, Platzhalter statt Hostdetails; `/Users/matze`-Pfade und private Home-Pfade (auch in `AGENTS.md`) ersetzen.
3. `_bmad-output/` nach `docs/process/` (Unterordner beibehalten). BMAD-Pfade per Override in `_bmad/custom/config.toml`, `_bmad/config.toml` unverändert. Alle harten Pfade in Skripten, Tests, Doku, `CLAUDE.md`, `AGENTS.md`, Ignore-Dateien nachziehen; gemeinsame Pfad-Konstante für Skripte.
4. Public-Dateien: `SECURITY.md`, `CONTRIBUTING.md` (je kurz), `.github/CODEOWNERS` (`* @mschmdb`), README: Abschnitt zum Entwicklungsprozess (BMAD, wo Specs liegen, dass es Arbeitsprotokolle sind), veraltete Angaben korrigieren (Sprachen: DE und EN).
5. Minimale CI `.github/workflows/ci.yml`: bei PR und Push auf `main`; `pnpm install --frozen-lockfile`, `pnpm check`, `prettier --check`, Unit-Tests ohne Datenbank und ohne Browser. Kein E2E, kein Prod-Build.
6. Prettier über das ganze Repo als eigener Commit; Commit-SHA in `.git-blame-ignore-revs`.
7. `package.json` `version` auf `0.5.0`.

## Boundaries & Constraints

**Always:** Jede Pfadänderung mit grep verifizieren, `pnpm test:unit`/vitest grün, `pnpm check` 0 Fehler, Build grün. Nur belegte Texte. Commits je Schritt (Format-Commit separat). Keine em-dashes.

**Never:** Kein History-Rewrite. `.claude/skills/` und `_bmad/` bleiben (BMAD-Runtime, Worktrees brauchen sie). `static/` unverändert. Keine Produktänderung an der Seite. `_content/` bleibt (Code liest den Pfad).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BMAD nach Umzug | bmad-build rendert Spec | Ausgabe landet unter `docs/process/…` | Override greift nicht: berichten, Pfade zurück |
| Story-Map | `pnpm doc:story-map` | liest `docs/process/…/sprint-status.yaml` | N/A |
| Changelog-Filter | Commit nur in `docs/process/` | nicht relevant für Updates | Test angepasst |
| CI | PR auf `main` | grün in < 10 min | DB-/Browser-Tests ausgeschlossen |
| Docker | Build | Prozessmaterial nicht im Image | `.dockerignore` |

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [ ] Schritte 1-7.

**Acceptance Criteria:**
- Given das Repo auf GitHub, when man das Root und `docs/` ansieht, then gibt es kein `_bmad-output/`, keine Screenshots/Rohdaten im Index, `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS` und eine grüne CI.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run src scripts`, `pnpm check`, `pnpm exec prettier --check .`, `pnpm build`, `pnpm doc:story-map` -- expected: grün
