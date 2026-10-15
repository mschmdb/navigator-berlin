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
- [x] Schritt 1: Zwischenstände aus dem Index (213 Dateien)
- [x] Schritt 2: Sensibles entschärft
- [x] Schritt 3: Umzug nach `docs/process/`, Override, Pfade
- [x] Schritt 4: SECURITY, CONTRIBUTING, CODEOWNERS, README
- [x] Schritt 5: minimale CI
- [x] Schritt 6: Prettier plus `.git-blame-ignore-revs`
- [x] Schritt 7: Version 0.5.0

**Acceptance Criteria:**
- Given das Repo auf GitHub, when man das Root und `docs/` ansieht, then gibt es kein `_bmad-output/`, keine Screenshots/Rohdaten im Index, `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS` und eine grüne CI.

## Implementation Notes

- Schritt 1: 213 Dateien aus dem Index (34 Screenshots, 155 `c5-profiles-en`, 13 `c4d-updates-en`, 8 JSON-Rohdaten, 3 Brainstorming/Memlog-Dateien). `spike-artifacts/` bleibt, weil `scripts/aggregate-wahl-data.ts` den Schema-Snapshot beim Drift-Check liest.
- Schritt 2: Plausible- und Search-Console-Zahlen in Audit, Epic, `spec-l3`, `spec-l5`, `spec-l7`, `deferred-work` und `landing-metrics.md` sind qualitative Aussagen. `server-bootstrap.md` nutzt `<admin-user>` und `<sicherer-ort-ausserhalb-des-repos>`. Home-Pfade in 12 Dateien sind Platzhalter.
- Schritt 3: `_bmad-output/` ist `docs/process/`. Override steht in `_bmad/custom/config.toml`, `_bmad/config.toml` bleibt unverändert. `scripts/lib/paths.ts` (mit Test) liefert die Pfade. `filter-commit.ts` sperrt `docs/process/` und das alte `_bmad-output/` (ältere Commits). Pfade in Doku und Prozessdateien sind per Suchen und Ersetzen angepasst (ausgenommen diese Spec). `_bmad/bmm/config.yaml` und `_bmad/core/config.yaml` nennen noch `_bmad-output`. Der Installer verwaltet sie, der Resolver liest nur TOML.
- Schritt 5: CI führt nur das vitest-Projekt `server` aus. `queries.test.ts` überspringt sich ohne `DATABASE_URL`. `scripts/aggregate-ranks.ts` startete `main()` beim Import im Test und leerte lokal die Rang-Tabellen. Jetzt gilt ein Entry-Guard.
- Schritt 6: `.prettierignore` nimmt `docs/process/`, `_bmad/`, `project.inlang/`, `drizzle/migrations/` und zwei generierte Docs aus. 16 Dateien formatiert.
- Review-Runde: `scripts/lib/is-main-entry.ts` (realpath, Symlink, fehlende Endung) ersetzt die Entry-Guards in sechs Skripten. DB-Tests nutzen `skipIf(!DATABASE_URL)` ohne Fallback-URL und ohne stille Rückgaben (harte Assertions). Probe: `DOTENV_CONFIG_PATH=/nonexistent env -u DATABASE_URL pnpm exec vitest run --project server` grün (35 übersprungen). `pnpm data:rank` läuft weiter (kiez_rank 2145 vorher und nachher). Weitere Hostnamen, Memory-Verweise und Besucherzahlen entfernt. Regressionstests für Pfad-Konsistenz. Skripte mit dem Muster `import.meta.url === file://${argv[1]}` bleiben unverändert (funktionieren, nicht Teil der Story).
- Zusatz: `npm`/`npx` in `package.json`, `playwright.config.ts` und Doku auf `pnpm` umgestellt.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Review 1 | Entry-Guard bricht bei Symlink oder fehlender Endung | high | patch (`isMainEntry`, Test) |
| Review 1 | DB-Tests ohne `skipIf`, Fallback-URLs, stille Rückgaben | high | patch |
| Review 1 | CI: `cancel-in-progress` auch auf `main`, Prettier nach Compile | medium | patch |
| Review 1 | Weitere Besucherzahlen, Hostnamen, `fliege`-Bezug | medium | patch |
| Review 1 | YAML-Configs und `.dockerignore` zeigen auf Altpfad | low | patch |
| Review 1 | Keine Regressionstests für die Pfade | medium | patch |
| Review 1 | Persönliche Details und Memory-Verweise in Docs, ADR-004 Cookie-Gate | medium | patch |
| Review 1 | README 503-Aussage, CONTRIBUTING-Testbefehl | low | patch |
| Review 1 | Layer-Zahl inkonsistent (39, 44, 73) | low | defer (`deferred-work.md`) |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts`, `pnpm check`, `pnpm exec prettier --check .`, `pnpm build`, `pnpm doc:story-map` -- expected: grün
