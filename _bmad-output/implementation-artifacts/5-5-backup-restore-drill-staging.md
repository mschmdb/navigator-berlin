# Story 5.5: Backup-Restore-Drill auf Staging

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer mit Disaster-Recovery-Verantwortung,
I want einen echten End-to-End-Backup-Restore-Drill auf einem isolierten Staging-Postgres durchführen, den `docs/runbooks/postgres-restore.md`-Runbook aus Story 4.4 unter Druck validieren, die Zeit-bis-Wiederherstellung (RTO, Ziel < 30 Min) messen, den Drill-Output als versioniertes `docs/runbooks/restore-drill-{date}.md` archivieren, gefundene Runbook-Bugs als PR-Diff committen, und die Halbjahres-Drill-Cadence in ADR-016 (Story 5.1) festziehen,
so that Disaster-Recovery nicht nur theoretisch dokumentiert ist sondern unter Real-Bedingungen funktioniert, das RTO-Versprechen aus NFR-R4 belegbar wird, und der Owner weiß welche Steps des Runbooks Tatsache + welche Wunschdenken sind.

## Probleme heute

1. **postgres-restore-Runbook ist ungetestet.** Story 4.4 hat 11-Steps-Runbook geschrieben (GPG-Decrypt + Drop + Create + pg_restore + Migration-Stand + Healthz-Smoke + shred). Steps wurden in Word-Editor recherchiert, NICHT auf einer echten Staging-DB ausgeführt. Risiko: Copy-Paste-Fehler, fehlende `--no-owner`-Flags, falsche Connection-String-Annahmen.
2. **RTO-Wert ist Schätzung.** NFR-R4 / Coolify-Restart sprechen von „< 30 Min Recovery". Bisher nie gemessen. Solo-Maintainer-Realität (Alert empfangen → Augen reiben → Laptop auf → SSH → ...) könnte 60+ Min sein.
3. **GPG-Decrypt-Pfad ist Hot-Path.** Passphrase-Handling über `--passphrase-file <(printf %s "$BACKUP_GPG_PASSPHRASE")` aus Coolify-Secret ist syntaktisch korrekt, aber unter Stress fehleranfällig (bash-history-Leak-Risiko, falsche Quote-Form). Live-Drill deckt auf was funktioniert.
4. **Drizzle-Migration-Stand-Check unklar.** Step 8 sagt „`pnpm exec drizzle-kit migrate-status` ODER Custom-Query auf `__drizzle_migrations`". Drizzle-Kit hat NICHT immer einen `migrate-status`-Command, je nach Version. Drill verifiziert echten Command.
5. **Drill-Cadence fehlt im ADR.** Story 5.1 ADR-016 lockt Daten-Refresh-Cadence pro Datenquelle, aber Backup-Restore-Drill-Cadence (Halbjahres-Pflicht) ist nicht codifiziert. Wenn 6 Monate vergehen ohne Drill, ist Recovery-Konfidenz erodiert.
6. **Staging-DB existiert nicht.** Coolify hat heute nur Production-Postgres. Für Drill braucht es einen isolierten Container (Compose-Service, lokales Docker, oder zweiter Coolify-Service mit `navigator_staging` Name).

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2268-2287.
- Memory `project_i18n_phase_1_de_only.md`: Drill-Doku DE-only.
- Memory `feedback_no_em_dashes.md`: keine em-dashes in Drill-Output.
- Memory `project_server_purchase_sequencing.md`: Hetzner CPX22 Phase-2-Beta-Setup ab Story 2.0 done. 5.5 sequenziert hinter 4.1 + 4.2 + 4.4 (alle DR-Vorarbeit muss done sein).
- Story 4.1 (ready-for-dev): pg_dump-Backup-Routine `infra/backup/pg-backup.sh`, Off-Server-Sync auf Hetzner-Storage-Box, weekly `pg_restore --list`-Smoke. 5.5 MUSS 4.1-Backup-File als Drill-Quelle nutzen.
- Story 4.2 (ready-for-dev): GPG-Encryption-Wrapper für pg_dump-Output, `BACKUP_GPG_PASSPHRASE`-Coolify-Secret. 5.5 testet GPG-Decrypt-Path.
- Story 4.4 (ready-for-dev): `docs/runbooks/postgres-restore.md` mit 11 Steps. 5.5 ist Live-Verifikation. 4.4 MUSS done vor 5.5.
- Story 5.1 (ready-for-dev): ADR-016 Update-Cadence. 5.5 ERWEITERT ADR-016 um Section „Backup-Restore-Drill-Cadence (Halbjahres-Pflicht)".
- Story 5.4 (ready-for-dev): Monitoring + Notifier. 5.5-Drill-Erfolg pingt healthchecks.io Backup-Cron-Check (siehe 5.4 AC-2 Check 6).
- Story 5.6 (backlog): GDPR-DPIA. Drill-Verifikation ist DPIA-Evidence (Art. 32 DSGVO „technische und organisatorische Maßnahmen", Backup + Restore-Test).
- Story 2.0 (review): Drizzle-Foundation + `__drizzle_migrations`-Tabelle.
- Bestand Backup-Scripts: `infra/backup/pg-backup.sh`, `infra/backup/sync-off-server.sh`, `infra/backup/verify-backup.sh` (Story 4.1).
- Bestand Runbook: `docs/runbooks/postgres-restore.md` (Story 4.4).
- Bestand Healthz: `src/routes/api/healthz/+server.ts`.
- Bestand Drizzle-Setup: `drizzle/`-Folder + `pnpm db:migrate`-Script.

## Akzeptanz-Kriterien

1. **AC-1 (Staging-Postgres-Setup):**
   **Given** Production-Postgres läuft, kein Staging-Container existiert.
   **When** ich Staging-Postgres als isolierten Container starte.
   **Then**:
   - **Option A (empfohlen für 5.5):** Lokaler Docker-Container auf Owner-Laptop oder dediziertem Drill-Server. `docker run --rm -d --name pg-staging-drill -e POSTGRES_PASSWORD=drill -e POSTGRES_DB=navigator_staging -p 55432:5432 postgres:17`.
   - **Option B (alternativ):** Coolify-Service `postgres-staging` parallel zu Production. Trennung über separates Network + separate Credentials.
   - **Wahl-Empfehlung:** Option A wegen Isolations-Strenge und Production-Risiko-Vermeidung. Drill-Owner kann auf Laptop ohne Production-Berührung üben.
   - Connection-String + Setup-Doku in `docs/runbooks/restore-drill-staging-setup.md` (siehe AC-6).
   - Test (manuell): `psql -h localhost -p 55432 -U postgres -d navigator_staging -c '\dt'` zeigt leere DB.

2. **AC-2 (End-to-End-Restore-Drill ausführen):**
   **Given** Staging-Postgres läuft + Production-Backup-File auf Storage-Box.
   **When** ich `docs/runbooks/postgres-restore.md` Steps 1-11 gegen Staging-DB ausführe.
   **Then**:
   - **Step 1 — Backup-File identifizieren:** Last-Daily-Backup aus `/backups/`-Volume oder Storage-Box (`sftp storagebox 'ls /backups/' | tail -5`). Note: KEIN Production-Backup-File schreibend zurück-mounten. Drill arbeitet mit READ-ONLY-Kopie.
   - **Step 2 — Backup-File auf Drill-Host pullen:** `sftp storagebox 'get /backups/pg-YYYYMMDD.dump.gpg /tmp/pg-drill.dump.gpg'`.
   - **Step 3 — GPG-Decrypt:** Drill-Owner gibt `BACKUP_GPG_PASSPHRASE` aus Password-Manager ein (NICHT aus Production-Coolify-Env, Drill testet auch Passphrase-Recovery-Pfad). `gpg --batch --decrypt --passphrase-file <(printf '%s' "$DRILL_PASSPHRASE") --output /tmp/pg-drill.dump /tmp/pg-drill.dump.gpg`.
   - **Step 4 — Smoke-Verify:** `pg_restore --list /tmp/pg-drill.dump | head -20`.
   - **Step 5 — Staging-DB neu anlegen:** Drop + Create gegen Staging (NICHT gegen Production!).
   - **Step 6 — pg_restore:** Gegen Staging. **Wichtig**: `--no-owner`-Flag testen, weil Staging-User ≠ Production-Owner.
   - **Step 7 — Drizzle-Migration-Stand:** Query auf `__drizzle_migrations` zeigt letzte Migration. **Live-Drill verifiziert ob Drizzle-Kit ein `migrate-status`-Command hat oder nur Custom-SQL nötig ist.**
   - **Step 8 — Spot-Check Daten:** Eigene Query gegen `bezirk_score` und `kiez_score`-Tabellen (z.B. `SELECT COUNT(*) FROM bezirk_score;`) verifiziert Row-Count-Plausibilität (Produktion sollte 12 Bezirke + 138 Kieze haben).
   - **Step 9 — App-Connect-Test auf Staging:** Lokale `pnpm dev`-Instanz mit `DATABASE_URL=postgres://postgres:drill@localhost:55432/navigator_staging` starten, `curl http://localhost:5173/healthz` → `{"status":"ok","db":"ok"}`.
   - **Step 10 — shred Plain-Files:** `shred -u /tmp/pg-drill.dump /tmp/pg-drill.dump.gpg`.
   - **Stoppuhr:** Drill-Owner startet Stoppuhr bei Step 1, stoppt nach Step 9 erfolgreich. Zeit dokumentiert in AC-3.
   - **Failure-Modus:** wenn ein Step fehlschlägt, Drill PAUSIERT, Fehler + Tatbestand in Drill-Output dokumentieren, Runbook-Diff vorbereiten, Drill wiederholen bis Pass.

3. **AC-3 (RTO-Messung + Dokumentation):**
   **Given** Drill abgeschlossen mit Stoppuhr-Daten.
   **When** ich Zeit-bis-Wiederherstellung dokumentiere.
   **Then**:
   - **Pflicht-Metriken im Drill-Output:**
     - **Gesamt-Zeit Step 1 bis Step 9:** Minuten + Sekunden.
     - **Step-Latenzen** für die 3 längsten Steps (typischerweise Step 2 Storage-Box-Pull, Step 6 pg_restore, Step 9 App-Connect).
     - **Stress-Faktor:** Owner-Bewertung 1-5 (1 = entspannt, 5 = Real-Panik). Inkl. anekdotischer Notiz („Passphrase erst nach 3 Versuchen, ENV-Var-Form vergessen").
   - **RTO-Vergleich gegen NFR-R4 (Ziel < 30 Min):**
     - Wenn gemessen < 30 Min: Pass, dokumentiert.
     - Wenn 30-60 Min: Pass mit Hinweis „RTO-Ziel knapp, Runbook-Optimierungspfade vorhanden".
     - Wenn > 60 Min: Fail, Runbook-Refactor als Folge-Story (`5-5.1-restore-runbook-optimization`).
   - **Doku-Pfad:** `docs/runbooks/restore-drill-2026-MM-DD.md` mit Frontmatter (`drill_date`, `drill_owner: Matze`, `rto_minutes`, `rto_target: 30`, `outcome: pass|fail|partial`).

4. **AC-4 (Runbook-Diff bei Fehlern):**
   **Given** Drill deckt Runbook-Bugs auf (falsche Befehls-Syntax, fehlende Flags, fehlerhafte Annahmen).
   **When** ich `docs/runbooks/postgres-restore.md` korrigiere.
   **Then**:
   - PR-Diff committed mit Title `fix(runbook): postgres-restore corrections from drill 2026-MM-DD`.
   - Commit-Body listet jede Korrektur als Bullet mit „Was war falsch im Runbook" + „Was wurde korrigiert" + „Wie aufgefallen im Drill".
   - Korrekturen sind MINIMAL (keine Style-Cleanups, kein Refactor), nur fakten-treue Bug-Fixes.
   - Wenn Drill 0 Runbook-Bugs aufdeckt: Drill-Output-File dokumentiert das („0 Runbook-Korrekturen erforderlich"), KEIN leerer Commit.

5. **AC-5 (Drill-Cadence-ADR-Erweiterung):**
   **Given** Story 5.1 ADR-016 lockt Daten-Refresh-Cadence.
   **When** ich ADR-016 um Backup-Restore-Drill-Cadence erweitere.
   **Then**:
   - Neue Sektion „Backup-Restore-Drill-Cadence (Halbjahres-Pflicht)" am Ende von ADR-016 oder als neuer ADR-018 falls ADR-016 zu groß wird (ADR-017 ist Monitor-Wahl aus 5.4).
   - **Cadence-Definition:** alle 6 Monate ein Drill, ausgelöst über Calendar-Reminder im Owner-Kalender oder GitHub-Action-Issue-Auto-Open (Story 5.1-Pattern).
   - **Trigger-Konditionen für ad-hoc Drill** (zusätzlich zu Halbjahres-Cron):
     - Major-Drizzle-Migration in Production (Schema-Change > 3 Spalten oder neue Tabelle).
     - Postgres-Major-Version-Upgrade (17 → 18).
     - Hetzner-Storage-Box-Wechsel oder Backup-Strategie-Refactor.
   - **Skip-Konditionen:** keine. Halbjahres-Drill ist hart, kein „läuft eh".
   - **Cross-Reference auf 5.5-Drill-Output-Pattern.**

6. **AC-6 (Staging-Setup-Runbook):**
   **Given** Drill-Owner braucht Reproduzier-Pfad für Staging-Postgres.
   **When** ich `docs/runbooks/restore-drill-staging-setup.md` schreibe.
   **Then**:
   - Runbook mit Steps:
     1. Docker-Voraussetzung-Check.
     2. `docker run`-Befehl für Staging-Postgres (Port 55432, isoliertes Network).
     3. `BACKUP_GPG_PASSPHRASE` aus Password-Manager holen.
     4. Storage-Box-SFTP-Connection-Test.
     5. Cleanup-Steps am Drill-Ende (`docker stop pg-staging-drill && docker rm pg-staging-drill`).
   - Runbook ≤ 100 Zeilen, Plex-Mono-Code-Blocks.
   - Cross-Reference auf `postgres-restore.md` (Story 4.4) und `docs/runbooks/restore-drill-2026-MM-DD.md`-Template.

7. **AC-7 (Drill-Output-Archive-Pattern):**
   **Given** Halbjahres-Cadence produziert wiederkehrend Drill-Outputs.
   **When** ich Archive-Pattern definiere.
   **Then**:
   - Pfad-Konvention: `docs/runbooks/restore-drill-YYYY-MM-DD.md` (Date im Filename).
   - **Index-Datei** `docs/runbooks/restore-drill-index.md` listet alle Drill-Outputs chronologisch mit RTO-Werten + Outcome (pass/fail/partial). Append-only, NIE löschen alte Einträge.
   - **Trend-Sektion** im Index: nach 3+ Drills zeigt RTO-Verlauf als Mini-Tabelle (Drill-Datum + RTO + Notiz).
   - Test: `restore-drill-index.test.ts` validiert dass Index alle vorhandenen `restore-drill-*.md`-Files referenziert (Cross-Sync-Check).

8. **AC-8 (Production-Schutz):**
   **Given** Drill-Pfad könnte Production-Postgres versehentlich treffen.
   **When** ich Drill durchführe.
   **Then**:
   - **Hart-Lock 1:** `psql`-Befehle im Drill verwenden NUR Staging-Connection-String mit Port 55432 (Production läuft auf 5432).
   - **Hart-Lock 2:** `pg_restore --dbname=navigator_staging` (NICHT `--dbname=navigator`).
   - **Hart-Lock 3:** kein `--clean` oder `--create` Flag mit Production-Connection-Strings.
   - **Audit-Pfad:** vor Drill-Start, Owner ruft `lsof -i :5432` und `lsof -i :55432` um Confusion auszuschließen.
   - **Doku im Drill-Output:** Audit-Pfade als verifizierter Step dokumentiert.
   - **NICHT-Stretch:** kein Network-Namespace-Isolation, kein iptables-Block. Pragmatik > Sicherheits-Theater.

9. **AC-9 (DPIA-Evidence):**
   **Given** Story 5.6 erstellt DPIA-Dokument.
   **When** Drill abgeschlossen.
   **Then**:
   - DPIA-Sektion „Technische und organisatorische Maßnahmen" (Art. 32 DSGVO) verweist auf:
     - `docs/runbooks/postgres-restore.md` als dokumentierter Recovery-Pfad.
     - `docs/runbooks/restore-drill-2026-MM-DD.md` als evidenter Drill-Output mit RTO-Messung.
     - ADR-016-Sektion „Backup-Restore-Drill-Cadence" als organisatorische Verpflichtung.
   - **Sequencing:** 5.5 produziert Drill-Output, 5.6-Dev-Story konsumiert als Cross-Reference. 5.5 muss VOR 5.6-Finalization sein.

10. **AC-10 (Phase-1-DE-only-Lock):**
    **Given** Memory `project_i18n_phase_1_de_only.md`.
    **When** ich Doku schreibe.
    **Then**:
    - Drill-Output `restore-drill-YYYY-MM-DD.md`: DE-only.
    - `restore-drill-staging-setup.md`: DE-only.
    - `restore-drill-index.md`: DE-only.
    - ADR-016-Erweiterung (oder ADR-018): DE-only.
    - Commit-Messages: DE-only-Convention (Conventional Commits + DE-Body).

11. **AC-11 (TDD-Mandat + Lint-Gates):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** für Drill-Skripte sind sehr begrenzt (Skripte sind operationsstrang, kein Code).
    - **Index-Sync-Test** `tests/integration/restore-drill-index.test.ts`: prüft dass `restore-drill-index.md` alle vorhandenen `restore-drill-*.md`-Files referenziert.
    - **Drill-Output-Schema-Test** `tests/integration/restore-drill-output-schema.test.ts`: prüft dass jeder `restore-drill-*.md`-File die Pflicht-Frontmatter-Felder hat (`drill_date`, `drill_owner`, `rto_minutes`, `rto_target`, `outcome`).
    - **Markdown-Lint** auf Drill-Output (em-dash + Stigma-Lint).
    - **Postgres-Restore-Runbook-Syntax-Check** (Stretch): `tests/integration/postgres-restore-runbook-syntax.test.ts` parsed Bash-Snippets aus `postgres-restore.md` mit `shellcheck` und meldet Syntax-Errors. Stretch weil shellcheck als Dev-Dependency nicht Pflicht.

12. **AC-12 (Owner-Energie-Lock + Drill-Slot):**
    **Given** Drill-Durchführung kostet 1-2 Stunden Owner-Energie + 30 Min Doku.
    **When** ich Drill-Schedule definiere.
    **Then**:
    - Drill wird auf einen ruhigen Vormittag gelegt (KEIN Launch-Tag, KEIN Sprint-Push-Tag).
    - **Vorbereitung:** Backup-File-Pfad, Passphrase, Storage-Box-Credentials VOR Drill-Start im Password-Manager auffindbar.
    - **Backup-Plan:** wenn Drill versehentlich Production trifft (siehe AC-8 Hart-Locks), Owner hat Off-Server-Backup als sekundären Recovery-Anker.
    - **Communications-Lock:** Drill ist Solo-Activity, KEINE Kalender-Block für andere Personen, KEIN Incident-Communications-Pfad nötig (kein User-Impact erwartet).

## Tasks / Subtasks

- [ ] **T1: Staging-Setup-Runbook** (AC: 1, 6, 10)
  - [ ] T1.1: `docs/runbooks/restore-drill-staging-setup.md` mit 5 Steps.
  - [ ] T1.2: Docker-Compose-Snippet als optionale Alternative zu `docker run`.
  - [ ] T1.3: Cleanup-Steps am Ende dokumentiert.

- [ ] **T2: End-to-End-Drill ausführen** (AC: 2, 3, 8)
  - [ ] T2.1: Staging-Container starten (Audit `lsof -i :5432` und `:55432`).
  - [ ] T2.2: Backup-File von Storage-Box pullen.
  - [ ] T2.3: GPG-Decrypt mit Drill-Passphrase aus Password-Manager.
  - [ ] T2.4: Smoke-Verify, Drop, Create, pg_restore gegen Staging.
  - [ ] T2.5: Drizzle-Migration-Stand verifizieren (Live-Test welcher Command funktioniert).
  - [ ] T2.6: Spot-Check Daten (`bezirk_score`, `kiez_score`-Row-Count).
  - [ ] T2.7: App-Connect-Test mit `DATABASE_URL`-Override + `/healthz`-Check.
  - [ ] T2.8: Stoppuhr-Daten dokumentieren.
  - [ ] T2.9: shred Plain-Files.

- [ ] **T3: Drill-Output dokumentieren** (AC: 3, 7, 10)
  - [ ] T3.1: `docs/runbooks/restore-drill-2026-MM-DD.md` mit Frontmatter + RTO-Messung + Step-Latenzen + Stress-Faktor + Outcome.
  - [ ] T3.2: `docs/runbooks/restore-drill-index.md` neu anlegen oder Append-Entry.
  - [ ] T3.3: Stigma-Lint + Markdown-Validator-Pass.

- [ ] **T4: Runbook-Korrekturen** (AC: 4)
  - [ ] T4.1: Bei Drill-aufgedeckten Bugs: `docs/runbooks/postgres-restore.md` korrigieren.
  - [ ] T4.2: PR-Diff mit Korrektur-Bullets + Drill-Date-Cross-Reference.
  - [ ] T4.3: Wenn 0 Bugs: Drill-Output-File dokumentiert das, KEIN leerer Commit.

- [ ] **T5: ADR-Cadence-Erweiterung** (AC: 5)
  - [ ] T5.1: Entscheidung: ADR-016-Erweiterung oder ADR-018 neu? Default: ADR-016-Sektion, kürzeres Diff.
  - [ ] T5.2: Sektion „Backup-Restore-Drill-Cadence" mit Halbjahres-Pflicht + Ad-hoc-Trigger.
  - [ ] T5.3: Cross-Reference auf Drill-Index.

- [ ] **T6: Tests** (AC: 11)
  - [ ] T6.1: `tests/integration/restore-drill-index.test.ts` Sync-Check.
  - [ ] T6.2: `tests/integration/restore-drill-output-schema.test.ts` Frontmatter-Validation.
  - [ ] T6.3: Optional shellcheck-Integration für Runbook-Bash-Snippets.

- [ ] **T7: DPIA-Cross-Reference** (AC: 9)
  - [ ] T7.1: Notiz in Story 5.6-Open-Items: Drill-Output + ADR-Cadence als Evidence-Liste.

- [ ] **T8: Healthchecks.io-Backup-Cron-Ping** (AC, optional, Cross 5.4)
  - [ ] T8.1: Wenn 5.4 done: `infra/backup/pg-backup.sh` um `curl -fsS https://hc-ping.com/{uuid}/start` am Anfang und `curl -fsS https://hc-ping.com/{uuid}/$?` am Ende erweitern.
  - [ ] T8.2: Stretch-Scope falls 5.4 noch nicht done.

- [ ] **T9: Final-Verifikation** (AC: 1-12)
  - [ ] T9.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T9.2: Drill-Output committed, Index aktualisiert.
  - [ ] T9.3: ADR-016 (oder ADR-018) committed.
  - [ ] T9.4: Etwaige Runbook-Korrektur-PR committed.
  - [ ] T9.5: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung

5.5 ist **Owner-Operational-Activity** mit minimalem Code-Output. Pflicht-Deliverables:

- 1 Drill-Output-File (`restore-drill-YYYY-MM-DD.md`).
- 1 Staging-Setup-Runbook.
- 1 Index-File.
- 1 ADR-Erweiterung (ADR-016 Sektion).
- Etwaige Runbook-Korrekturen als PR-Diff.
- 2-3 Test-Files für Schema + Sync-Check.

KEIN App-Code, KEINE neue Infra, KEINE Production-Berührung.

### Production-Schutz-Lock

Drill verwendet ausschließlich Staging-Postgres auf Port 55432. Production läuft auf Port 5432. AC-8 codifiziert Hart-Locks. Drill-Owner führt VOR Drill-Start `lsof -i :5432` und `lsof -i :55432` Audit aus.

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `docs/runbooks/postgres-restore.md` (Story 4.4) als Live-Test-Object.
- `infra/backup/pg-backup.sh` + `infra/backup/sync-off-server.sh` (Story 4.1) als Backup-Source.
- `BACKUP_GPG_PASSPHRASE`-Pattern (Story 4.2) für Decrypt-Pfad.
- `src/routes/api/healthz/+server.ts` für App-Connect-Test.
- `docs/runbooks/`-Verzeichnis als Format-Vorbild.

### MUST-Rules-Anwendung

- **#7 TypeScript strict**: Schema-Tests typed.
- **#11 Kein US-Drittanbieter**: Drill verwendet Hetzner-Storage-Box (Backup-Source), Postgres-Container (lokal/Coolify), keine Cloud-Restore-Services.
- **#12 Provenance**: Drill-Output ist Audit-Trail.
- **#14 i18n-First**: Phase-1-DE-only-Lock.
- **#19 NFR-R4**: RTO < 30 Min als belegbares Ziel.
- **#20 ADR-Pflicht**: ADR-016-Erweiterung für Cadence.

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 4.1 | ready-for-dev | Backup-Routine + Storage-Box-Sync. MUSS done vor 5.5. |
| 4.2 | ready-for-dev | GPG-Encryption für pg_dump. MUSS done. |
| 4.4 | ready-for-dev | `postgres-restore.md` Runbook. MUSS done. |
| 5.1 | ready-for-dev | ADR-016 für Cadence-Erweiterung. MUSS done. |
| 5.4 | ready-for-dev | Monitoring-Ping-Pattern (Backup-Cron-Check Stretch). |
| 5.6 | backlog | DPIA-Evidence. 5.5 muss VOR 5.6-Finalisierung sein. |
| 2.0 | review | Drizzle-Schema + `__drizzle_migrations`. |

**Empfehlung Reihenfolge:**
1. Epic 4 komplett done (4.1 + 4.2 + 4.4 als Backup-Foundation).
2. 5.1 done (ADR-016 als Cadence-Anker).
3. 5.4 done (Monitoring + Backup-Ping-Pattern).
4. 5.5 jetzt.
5. 5.6 nach 5.5 (DPIA-Cross-Reference).

### Open-Questions vor Dev-Start

1. **Staging-Container-Host:** Owner-Laptop, dedizierter Drill-Server, oder Coolify-Parallel-Service? **Empfehlung:** Owner-Laptop für 5.5-Initial-Drill, weil Isolations-Strenge maximiert ist und Production-Risiko minimal. Coolify-Parallel-Service nur für regelmäßige Auto-Drills (Phase 3 Folge-Story). Owner confirmiert.

2. **Drill-Datum:** Wann? **Empfehlung:** vor Hard-Launch (T-7d aus Story 5.3-Launch-Plan). Belegt RTO-Wert vor User-Sichtbarkeit. Owner lockt Datum.

3. **Backup-File-Auswahl:** Last-Daily-Backup oder älteres File? **Empfehlung:** Last-Daily, weil Real-Disaster-Recovery-Szenario nutzt last-known-good. Ältere Files als Stretch-Drill (Story `5-5.1-restore-drill-historical-backup`).

4. **Drizzle-Migrate-Status-Command:** Welche Drizzle-Kit-Version + welcher Command? **Live-Drill verifiziert.** Erwartung: Custom-SQL-Query auf `__drizzle_migrations`-Tabelle, weil `drizzle-kit migrate-status` nicht in allen Versionen verfügbar ist. Drill dokumentiert verifizierte Command-Variante.

5. **Drill-Output-Stress-Faktor-Skala:** 1-5 oder qualitativ? **Empfehlung:** 1-5 mit anekdotischer Notiz. Numeric-Skala erlaubt Trend-Vergleich über mehrere Drills.

### Stigma + Editorial-Disziplin

- Drill-Output: faktisch, nüchtern, keine Marketing-Phrasen.
- KEIN „seamless recovery", KEIN „best-in-class disaster prep", KEIN „enterprise-grade".
- Stress-Faktor-Notizen ehrlich („3 Versuche bis Passphrase saß" ≥ „smooth execution").

### Halbjahres-Drill-Cadence

ADR-016-Erweiterung lockt:
- **Pflicht:** Drill alle 6 Monate, Calendar-Reminder im Owner-Kalender.
- **Pflicht ad-hoc:** vor Major-Schema-Change, vor Postgres-Major-Upgrade, vor Backup-Strategie-Refactor.
- **Skip-Verboten:** kein „läuft eh seit 2 Jahren ohne Probleme"-Argument. Atrophie ist real.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2268-L2287`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup.md` (Backup-Routine)
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-security-hardening-tls-csp-headers-crowdsec.md` (GPG-Encryption)
- Story 4.4: `_bmad-output/implementation-artifacts/4-4-adr-nachzieher-disaster-recovery-runbooks.md` (postgres-restore-Runbook)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (ADR-016)
- Story 5.4: `_bmad-output/implementation-artifacts/5-4-post-launch-monitoring-eu-foss.md` (Backup-Ping-Pattern)
- Story 5.6: TBD (DPIA-Cross-Reference)
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `project_server_purchase_sequencing.md`
- Bestand Backup-Scripts: `infra/backup/pg-backup.sh`, `infra/backup/sync-off-server.sh`
- Bestand Runbook: `docs/runbooks/postgres-restore.md`
- Bestand Drizzle: `drizzle/`-Folder, `__drizzle_migrations`-Tabelle
- Bestand Healthz: `src/routes/api/healthz/+server.ts`
- ADR-Format-Vorbild: `docs/adr/ADR-013-score-aggregation-strategy.md`
- Runbook-Format-Vorbild: `docs/runbooks/postgres-restore.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
