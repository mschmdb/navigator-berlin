# Story 4.4: ADR-Nachzieher (3 neu + 7 Stub-Befüllungen + 1 Supersede) + 5 Disaster-Recovery-Runbooks + Public-Repo-Hardening

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a future Maintainer / recruiter-readable Audience,
I want das `docs/adr/`-Verzeichnis konsistent auf Standard-Template-Stand bringen (7 Stub-ADRs Body-befüllen + 3 neue ADRs anlegen für Postgres-Hybrid/i18n-DE-only/Hetzner-CPX22 + ADR-003 als Superseded markieren), 5 fehlende Disaster-Recovery-Runbooks (`crowdsec-whitelist`/`data-source-failure`/`geocode-rate-limit-hit`/`postgres-restore`/`drizzle-migration-rollback`) mit Schritt-für-Schritt-Befehlen schreiben, sowie README.md aktualisieren auf Phase-1-Realität + `ARCHITECTURE.md` (recruiter-readable Stack-Showcase mit Postgres-Hybrid + Kiez-Score-System) ergänzen,
so that das Projekt selbsterklärend bleibt für Future-Me-in-12-Monaten und LLM-Agents mit Repo-Zugang, alle kritischen Operations bei Bedarf ausführbar sind, und der Public-GitHub-Repo als FOSS/Beratungs-Asset komplett strukturiert ist.

## Phase-Kontext + Scope-Korrekturen

**ADR-014-Lock-Drift:** Epic-Text (epics.md Zeile 2025) sagt „i18n-Scope-Reduce-Lock 2026-05-15 (8 Sprachen → de/en für Phase 1)". **Aktueller User-Lock ist 2026-05-16 (DE-only Phase 1, EN deferred Phase 3)** — siehe Memory `project_i18n_phase_1_de_only` und Story 3.1. ADR-014 reflektiert den **neueren Lock** (2026-05-16, DE-only), NICHT den älteren (2026-05-15, de+en). Epic-Text ist zum 4.4-Implementations-Zeitpunkt veraltet.

**ADR-Stub-Inventar (7 Files, status `Proposed`, leere/dünne Body):**

1. `ADR-003-postgres-deferral.md` — wird in 4.4 auf `Superseded by ADR-013` umgestellt (AC-3)
2. `ADR-005-i18n-paraglide.md` — wird in **Story 3.1** auf Accepted befüllt (Story 3.1 AC-11). Falls 3.1 zum 4.4-Implementations-Zeitpunkt noch NICHT done: 4.4 dokumentiert nur Cross-Refs, ADR-005-Befüllung bleibt 3.1-Scope. Falls done: 4.4 verifiziert nur konsistenten Stand.
3. `ADR-007-bits-ui.md` — Bits UI als Headless-Library-Decision
4. `ADR-008-context-api-state.md` — Context-API statt Module-Scope-State
5. `ADR-009-remote-functions.md` — Remote Functions statt ad-hoc fetch
6. `ADR-010-experimental-async.md` — `experimental.async = true` + `<svelte:boundary>`
7. `ADR-011-on-demand-layer-loading.md` — On-Demand-Layer-Fetch + LRUCache

Plus **`ADR-000-template.md`** bleibt unverändert (Template-Datei).

**Sequence-Hand-offs:**

- **Story 4.1 → Runbooks-Cross-Refs:** `postgres-restore.md` referenziert Story 4.1 pg_dump-Backup-Pfad
- **Story 4.2 → Runbooks-Cross-Refs:** `crowdsec-whitelist.md` referenziert Story 4.2 CrowdSec-Installation; `postgres-restore.md` braucht GPG-Decrypt-Step aus 4.2-AC-9
- **Story 2.0 → Runbooks-Cross-Refs:** `drizzle-migration-rollback.md` referenziert Story 2.0 Drizzle-Schema + Migration-Files
- **Story 3.1 → ADR-005-Befüllung:** Wird parallel oder vor 4.4 done sein; 4.4 verifiziert Konsistenz

**Memory-Marker:** `feedback_no_em_dashes`, `project_i18n_phase_1_de_only` (ADR-014-Lock), `project_server_purchase_sequencing` (ADR-015), `feedback_no_lebenswert` (keine NS-belastete Begriffe in Runbooks).

## Acceptance Criteria

**AC-1 (ADR-Bestand-Konsistenz — 7 Stubs auf Accepted befüllen):**

**Given** 7 ADR-Stub-Files mit `status: Proposed` und leerem/dünnem Body
**When** ich pro Stub den Body gemäß Standard-Template (Context/Decision/Consequences/Alternatives) befülle und Status auf `Accepted` aktualisiere
**Then** alle ADRs haben einheitlichen Aufbau:
  - **Frontmatter:** `status: Accepted`, `date: YYYY-MM-DD` (Original-Date beibehalten), `revised: 2026-05-16` (heute), `deciders: solo-maintainer`
  - **Titel-Section** (H1): `# ADR-NNN: <Titel>`
  - **Status-Liste:** Status, Date, Deciders (optional auch revised)
  - **Context:** ≥100 Wörter Beschreibung der Situation/Problem
  - **Decision:** konkrete Entscheidung in 1–3 Absätzen
  - **Consequences:** Positive + Negative + (optional) Migration/Trade-offs
  - **Alternatives:** mind. 1 verworfene Alternative mit Begründung
  - **References:** Cross-Links auf andere ADRs + relevante Source-Files

**Konkrete Befüllung pro Stub:**

- **ADR-007 (Bits UI):** Context = a11y-konforme Primitive ohne Style-Lock-in; Decision = Bits UI als Headless-Library-Default; Consequences = Tailwind-Compose-Style + Bring-your-own-Variants; Alternatives = Radix verworfen wegen React-Bias, shadcn-svelte verworfen wegen weniger maturity.
- **ADR-008 (Context-API):** Context = SSR-State-Leak-Risiko bei Module-Scope-`$state`; Decision = `createUiState()` + `getUiState()` pro Request via Context-API; Consequences = explicit Wiring, kein Module-Scope-Pollution; Alternatives = `$state.raw` Module-Scope verworfen wegen SSR-Leak.
- **ADR-009 (Remote Functions):** Context = SvelteKit `remoteFunctions: true` Experimental-Flag; Decision = `prerender`/`query`/`form`/`command`/`query.live` statt `+server.ts`-Endpoints; Consequences = Type-Safety, geringere Boilerplate; Alternatives = ad-hoc fetch verworfen wegen Type-Safety-Mangel.
- **ADR-010 (Experimental-Async):** Context = `experimental.async = true` + `await`-Expression in Svelte 5; Decision = `<svelte:boundary>` als Default für Async-Komponenten; Consequences = Granular-Loading-States, kein `{#await}`-Block bei neuen Komponenten; Alternatives = `{#await}`-Pattern verworfen wegen mangelhafter Error-Boundary-Integration.
- **ADR-011 (On-Demand-Layer-Loading):** Context = Build-Time-MANIFEST.json + Static-GeoJSON; Decision = Lazy-Load pro Layer + LRUCache (`lru-cache@11`); Consequences = niedrigere Initial-JS-Bundle-Size; Alternatives = Eager-Load aller Layer verworfen wegen >5MB-Initial-Bundle.

**And** Original-`date:`-Wert (2026-05-11) bleibt erhalten, `revised: 2026-05-16` markiert Body-Befüllung
**And** Files <500 Zeilen
**And** Keine em-dashes in Texten (CLAUDE.md Konvention)

**AC-2 (ADR-013 — Postgres-Hybrid-Architecture neu):**

**Given** der Postgres-Hybrid-Lock 2026-05-15 (Postgres als Build-Zeit-Aggregat-Cache statt Phase-2-Deferral)
**When** ich `docs/adr/ADR-013-postgres-hybrid-architecture.md` neu anlege
**Then** ADR enthält:
  - **Frontmatter:** `status: Accepted`, `date: 2026-05-15`, `deciders: solo-maintainer`
  - **Context:** Cross-Layer-Aggregate (Bezirks-/Kiez-Statistik, FAQ-Q&A, Score-Tables) brauchen Datenbank-Backing. Story 2.0 etabliert Postgres 17 + Drizzle-ORM als Phase-1-Foundation. ADR-003 ursprünglich verschoben Postgres auf Phase 2.
  - **Decision:** Postgres ist **Build-Zeit-Cache**, NICHT Source-of-Truth. Static GeoJSON in `static/layers/` bleibt Geo-Source-of-Truth (Pipeline aus Story 1.3). `data:aggregate`-Script (Story 2.0) liest Static-Files + schreibt Aggregat-Tabellen in Postgres. Hybrid: Geo-Daten aus Static-Files (Edge-fähig), Aggregat-Daten aus Postgres (Query-fähig für Bezirks/Kiez-Pages + FAQ + Ranking).
  - **Consequences:**
    - Positive: Drizzle-Schema versioniert, Type-Safe-Queries, Postgres-Hybrid als Talk-Material
    - Negative: zusätzlicher Coolify-Service + Backup-Komplexität (Story 4.1 + 4.2)
    - Operational: Schema-Migrationen via Drizzle, Backup via pg_dump+GPG (Story 4.2), Role-Separation `navigator_owner`/`app` (Story 4.2)
  - **Alternatives:**
    - **All-Postgres** (verworfen): Geo-Daten als PostGIS in Postgres laden würde Edge-Performance brechen und PostGIS-Skill-Overhead erzeugen
    - **All-Static** (verworfen): JSON-Aggregat-Files würden Query-Komplexität für Bezirks-Page (z.B. „Top 30 Kieze nach Score") an Client/Build verlagern
    - **SQLite statt Postgres** (verworfen): SQLite-Service-Embedded-Mode brincht Server-Side-Query-Performance, kein Concurrent-Write-Safety
  - **References:** ADR-003 (Superseded), Story 2.0 Foundation, Story 4.1 Coolify-Postgres-Service, Story 4.2 Network-Hardening, `docs/runbooks/local-postgres-setup.md`

**AC-3 (ADR-003 auf Superseded by ADR-013):**

**Given** `docs/adr/ADR-003-postgres-deferral.md` als Stub mit `status: Proposed`
**When** ich ADR-003 aktualisiere
**Then**:
  - **Frontmatter:** `status: Superseded by ADR-013`, `date: 2026-05-11`, `revised: 2026-05-15`, `deciders: solo-maintainer`
  - **Body kurz befüllt:** Context (ursprünglich Phase-2-Deferral aus Skalierbarkeits-Bedenken), Decision (Postgres auf Phase 2 verschoben), Consequences (kurze Notiz), **Superseded-Section** prominent mit Cross-Link auf ADR-013-Hybrid-Architecture
  - Body kann minimalistisch bleiben, Hauptpunkt ist Superseded-Hinweis
**And** Cross-Link in ADR-013 zurück verweist auf ADR-003

**AC-4 (ADR-014 — i18n-Scope-Reduce auf DE-only Phase 1 neu):**

**Given** der i18n-Scope-Reduce-Lock **2026-05-16** (DE-only Phase 1, EN deferred Phase 3 — Memory `project_i18n_phase_1_de_only`)
**When** ich `docs/adr/ADR-014-i18n-scope-reduce-de-only.md` neu anlege
**Then** ADR enthält:
  - **Frontmatter:** `status: Accepted`, `date: 2026-05-15`, `revised: 2026-05-16`, `deciders: solo-maintainer`
  - **Titel:** `ADR-014: i18n-Scope-Reduce auf DE-only Phase 1`
  - **Context:** 8-Sprachen-Architektur ursprünglich (FR55a–FR55j, NFR-IL1–IL10, ~1.600 prerendered Routes). Solo-Maintainer-Kapazität + Translation-Quality-Gate-Aufwand schätzen ~3–4 Wochen Solo-Equivalent. User-Lock 2026-05-15 reduziert initial auf DE+EN; User-Lock 2026-05-16 reduziert weiter auf **DE-only Phase 1** mit EN-Reaktivierung in Phase 3 (T+12w+).
  - **Decision:** Phase 1 = **DE-only**. Paraglide-Infrastruktur bleibt installiert (Vite-Plugin, Compile-Output) für Phase-3-Reaktivierung ohne Setup-from-scratch. Inlang-Settings reduziert auf `locales: ["de"]`, `baseLocale: "de"`. Strategy auf `["baseLocale"]` (cookieless). Story 3.1 implementiert.
  - **Consequences:**
    - Positive: Time-to-Launch verkürzt, kein Translation-Quality-Gate Phase 1, FR55a–FR55j formal deferred Phase 3
    - Negative: ~1.600-Route-Skalierung deferred Phase 3, EN-Markt-Adressierung Post-Hard-Launch
    - Operational: MUST-Rule #14 (i18n-First) Phase 1 DEFERRED, hardcoded-DE-Strings akzeptiert
  - **Alternatives:**
    - **8 Sprachen mit Auto-Translate ohne Polish** (verworfen): Quality-Risk + RTL-Verifizierung-Aufwand
    - **DE + EN (Lock 2026-05-15, verworfen 2026-05-16)**: EN-Translation-Sprint + Coverage-Gate für Solo-Maintainer-Phase-1 zu teuer
    - **Paraglide entfernen + hardcoded-only** (verworfen): Phase-3-Re-Setup würde Wochen kosten
  - **References:** ADR-005 (Paraglide-Foundation), Story 3.1 (Implementation), Future-Epic „i18n-Phase-3-EN-Coverage" (Stories 3.2–3.5 archiv), Memory `project_i18n_phase_1_de_only`

**AC-5 (ADR-015 — Hetzner-CPX22-statt-CX32 neu):**

**Given** der Hetzner-Server-Wahl 2026-05-15-PM (CX32 ARM → CPX22 AMD per Hetzner-UI-AMD-only-Verfügbarkeit)
**When** ich `docs/adr/ADR-015-hetzner-cpx22-amd.md` neu anlege
**Then** ADR enthält:
  - **Frontmatter:** `status: Accepted`, `date: 2026-05-15`, `deciders: solo-maintainer`
  - **Context:** Architecture-Doku (architecture.md Zeile 482) referenziert ursprünglich `CX32` (8GB RAM / 4 vCPU / 80GB SSD, ~12€/Mon). Hetzner-Cloud-UI 2026-05 zeigt CX32 nur ARM-Architektur verfügbar. Postgres-Hybrid (ADR-013) braucht stable amd64-Architektur für `postgres:17-alpine`-Image (offizielles Multi-Arch-Image, aber Coolify-Postgres-Service-Type bevorzugt amd64). EUR 9,51/Monat-Budget für Solo-Project.
  - **Decision:** Hetzner-**CPX22** (AMD, 8GB RAM / 2 vCPU / 80GB SSD, EUR 9,51/Monat, Frankfurt). 2 vCPU statt CX32-4-vCPU akzeptiert (Build-Runner-Workload via GitHub-Actions, nicht auf Server).
  - **Consequences:**
    - Positive: 2,49€/Monat günstiger als CX32, AMD-Architektur breit-supported, Hybrid-Postgres mit ~1,5–2GB RAM-Headroom in 8GB-Setup
    - Negative: 2 vCPU statt 4 vCPU — `data:aggregate`-CPU-Bound-Steps auf Build-Time-CI verlagert (Story 4.3 Gate 5)
    - Operational: Architecture-Doku Zeile 482 muss aktualisiert werden (CX32 → CPX22 — out-of-scope für 4.4, Phase-2-Story)
  - **Alternatives:**
    - **CX32 ARM** (verworfen 2026-05): AMD-only-Verfügbarkeit per Hetzner-UI 2026-05
    - **CPX32** (verworfen, EUR 16,65): Komfort-Variante mit 16GB RAM, overkill für Phase 1
    - **Externer-Postgres-Service (z.B. Neon, Supabase)** (verworfen): US-Anbieter, ADR-004-Cookieless-Linie-Konflikt
  - **References:** ADR-013 (Postgres-Hybrid), Story 4.1 (Production-Setup), Memory `project_server_purchase_sequencing`

**AC-6 (Runbook `crowdsec-whitelist.md` — False-Positive-Recovery):**

**Given** CrowdSec-Plugin aus Story 4.2 (Streaming-Mode, Captcha-Remediation)
**When** ich `docs/runbooks/crowdsec-whitelist.md` neu schreibe
**Then** Runbook enthält:
  - **Trigger:** legitimer User wird via Captcha gechallenged oder gebannt (User-Report via `hey@navigator.berlin`)
  - **Step 1 — Decision-ID lookup:** SSH zum Server, `docker exec crowdsec cscli decisions list --ip <REPORTED_IP>` → Output zeigt Decision-ID + Scenario
  - **Step 2 — Decision löschen (Quick-Fix):** `docker exec crowdsec cscli decisions delete --id <DECISION_ID>`
  - **Step 3 — Whitelist-Eintrag (dauerhaft) bei legitimen Bots/CIDR-Bereichen:** Editiere `infra/crowdsec/whitelists.yaml` (siehe Story 4.2 File-List) + commit:
    ```yaml
    name: navigator-berlin/custom-whitelist
    description: Custom-Whitelist für legitimate Crawler / Search-Console / User-Reports
    whitelist:
      reason: navigator.berlin specific allowlist
      ip:
        - "203.0.113.42"  # Beispiel User-IP
      cidr:
        - "192.0.2.0/24"  # Beispiel Crawler-Range
    ```
  - **Step 4 — Reload:** `docker exec crowdsec cscli hub upgrade && docker exec crowdsec systemctl restart crowdsec` ODER Container-Restart via Coolify-UI
  - **Step 5 — Verifikation:** `docker exec crowdsec cscli decisions list --ip <IP>` → empty list
  - **Anti-Pattern-Warnung:** keine Massen-Whitelisting (verletzt Defensive-Posture); nur dokumentierte False-Positives
  - **Cross-Refs:** Story 4.2 CrowdSec-Installation, ADR-004 Cookieless

**AC-7 (Runbook `data-source-failure.md` — FIS-Broker/ODIS/DWD-Ausfall):**

**Given** Build-Zeit-Datenquellen (FIS-Broker, daten.berlin.de, ODIS, Overpass, DWD-CDC) können kurzfristig ausfallen
**When** ich `docs/runbooks/data-source-failure.md` neu schreibe
**Then** Runbook enthält:
  - **Trigger:** `pnpm data:fetch` schlägt fehl mit HTTP-5xx oder Timeout
  - **Diagnostik:** `curl -I <source-url>` von Lokal-Dev → Status-Code prüfen
  - **Step 1 — Cached-MANIFEST.json-Fallback aktivieren:** falls letzter erfolgreicher Build auf Production läuft, KEIN Re-Deploy auslösen — bestehende `static/layers/`-Files bleiben aktiv
  - **Step 2 — Per-Layer-Stale-Banner aktivieren:** Editiere `src/lib/data/manifest-source-status.ts` (neu falls nicht existiert, Phase-2-Story) → setze `staleStatus: 'source-unreachable'` für betroffenen Layer, UI rendert Banner „Daten temporär nicht aktualisierbar"
  - **Step 3 — Manueller Re-Fetch (nach Recovery):** `pnpm data:fetch -- --only <layer-slug>` (Selective-Fetch ist Story-1.3-Pattern); falls erfolgreich: `pnpm data:aggregate` + Commit
  - **Step 4 — Source-Wechsel (Failover):** dokumentierte alternative Quellen pro Layer-Slug (z.B. wenn FIS-Broker dauerhaft down: Fallback auf ODIS-Endpoint falls Cross-Refresh-Quelle), Tabelle im Runbook
  - **Cross-Refs:** Story 1.3 Data-Pipeline-Foundation, Story 2.0 Aggregat-Pipeline, `scripts/fetch-static.ts`, `scripts/lib/fetchers/`

**AC-8 (Runbook `geocode-rate-limit-hit.md` — Nominatim-Rate-Limit):**

**Given** Nominatim-Public-Instance hat Rate-Limit (1 req/s per User-Agent, ggf. IP-Block bei Missbrauch)
**When** ich `docs/runbooks/geocode-rate-limit-hit.md` neu schreibe
**Then** Runbook enthält:
  - **Trigger:** `/api/geocode`-Endpoint liefert 429-Response oder verzögert sich >10s
  - **Step 1 — User-Agent-Header prüfen:** verify `src/lib/server/geocode.ts` Zeile 7 USER_AGENT-Konstante zeigt korrekte Mailto-Identifikation
  - **Step 2 — LRU-Cache-Hit-Rate prüfen:** Coolify-Logs grep auf `[geocode-cache-hit]` vs `[geocode-cache-miss]` → falls Hit-Rate <50%, Cache-Größe in `geocode.ts` erhöhen (aktuell `lru-cache@11`-Default)
  - **Step 3 — Temporärer Provider-Wechsel:** Coolify-Env `NOMINATIM_ENDPOINT` auf alternative Public-Instance (z.B. `https://nominatim.openstreetmap.de` — DE-Variante) oder Self-Hosted-Phase-2-Migration
  - **Step 4 — Permanenter Self-Host (Phase 2):** Verweis auf Phase-2-Story (siehe PRD Zeile 342, „Self-Host-Nominatim auf Hetzner verworfen — Phase-2-Reevaluation")
  - **Anti-Pattern-Warnung:** keine MapTiler-/Mapbox-/Google-Geocoder-Fallbacks (US-Drittanbieter, ADR-004-Konflikt)
  - **Cross-Refs:** Story 1.5 Geocoding-Proxy, ADR-004 Cookieless, PRD NFR-I6

**AC-9 (Runbook `postgres-restore.md` — pg_dump-Restore mit GPG-Decrypt):**

**Given** GPG-verschlüsselte pg_dump-Backups aus Story 4.2 (`/backups/pg-YYYYMMDD.dump.gpg`) und Off-Server-Replikation auf Hetzner-Storage-Box
**When** ich `docs/runbooks/postgres-restore.md` neu schreibe
**Then** Runbook enthält:
  - **Trigger:** Postgres-Data-Corruption / Versehentlicher `DROP TABLE` / Schema-Migration-Rollback nötig
  - **Step 1 — Latest-Backup-File identifizieren:** auf Server `ls -la /backups/ | tail -5` ODER von Storage-Box `sftp storagebox 'ls /backups/' | tail -5`
  - **Step 2 — Backup von Storage-Box pullen (falls Server-Local kompromittiert):** `sftp storagebox 'get /backups/pg-YYYYMMDD.dump.gpg /tmp/'`
  - **Step 3 — GPG-Decrypt:** `gpg --batch --decrypt --passphrase-file <(printf '%s' "${BACKUP_GPG_PASSPHRASE}") --output /tmp/pg-restore.dump /tmp/pg-YYYYMMDD.dump.gpg` (Passphrase aus Coolify-Secret `BACKUP_GPG_PASSPHRASE` oder Maintainer-Password-Manager)
  - **Step 4 — Smoke-Verifikation Restore-Stub:** `pg_restore --list /tmp/pg-restore.dump | head -20` → zeigt Tabellen-Liste (kein Corruption)
  - **Step 5 — App stoppen (Verhindert Inflight-Writes):** Coolify-UI → App-Service → Stop
  - **Step 6 — Postgres-DB droppen + neu anlegen:** `docker exec postgres psql -U navigator_owner -c "DROP DATABASE navigator;"` + `... CREATE DATABASE navigator OWNER navigator_owner;`
  - **Step 7 — pg_restore ausführen:** `docker exec -i postgres pg_restore -U navigator_owner -d navigator < /tmp/pg-restore.dump`
  - **Step 8 — Drizzle-Migration-Stand verifizieren:** `pnpm exec drizzle-kit migrate-status` (oder Custom-Query auf `__drizzle_migrations`-Tabelle) → letzter Migration-Stand zeigt
  - **Step 9 — App-Restart:** Coolify-UI → App-Service → Start
  - **Step 10 — Healthz-Smoke:** `curl https://navigator.berlin/healthz` → `{"status":"ok","db":"ok"}`
  - **Step 11 — `shred` Plain-File:** `shred -u /tmp/pg-restore.dump /tmp/pg-YYYYMMDD.dump.gpg` (kein Klartext auf Disk hinterlassen)
  - **Anti-Pattern-Warnung:** kein `--clean`-Flag in pg_restore ohne vorherige DB-Drop (Schema-Konflikte); keine Passphrase in Shell-History (`HISTCONTROL=ignoreboth`)
  - **Cross-Refs:** Story 4.1 Backup-Routine, Story 4.2 GPG-Encryption, Story 2.0 Drizzle-Schema, Story 5.5 Backup-Restore-Drill

**AC-10 (Runbook `drizzle-migration-rollback.md` — Fehlerhafte Migration rollback):**

**Given** Drizzle-Migrations in `drizzle/`-Folder + `pnpm db:migrate`-Script
**When** ich `docs/runbooks/drizzle-migration-rollback.md` neu schreibe
**Then** Runbook enthält:
  - **Trigger:** Migration applied + App schlägt fehl mit Schema-Drift / Production-Constraint-Violation / Data-Loss-Risk
  - **Step 1 — Migration-Stand identifizieren:** `docker exec postgres psql -U navigator_owner -d navigator -c "SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5;"`
  - **Step 2 — Rollback-Strategie wählen:**
    - **Strategie A (Restore-from-Backup, recommended für Data-Loss-Migration):** folge `postgres-restore.md` mit Backup von vor-der-Migration
    - **Strategie B (Hand-coded-Down-Migration):** Drizzle hat keine eingebauten Down-Migrations — manuell SQL schreiben in `drizzle/down/NNNN_revert_xxx.sql`
    - **Strategie C (Schema-Snapshot-Revert):** Git-Revert auf Migrations-Commit + manueller SQL-Cleanup
  - **Step 3 — Strategie A ausführen:** `postgres-restore.md` mit gestern-Backup → garantierter Pre-Migration-Stand
  - **Step 4 — Strategie B ausführen:** SQL-Down-Migration in `psql` ausführen, dann `__drizzle_migrations`-Eintrag manuell löschen: `DELETE FROM __drizzle_migrations WHERE hash = '<HASH>';`
  - **Step 5 — Git-Revert auf Migrations-Commit:** `git revert <COMMIT_SHA>` + Push → Coolify-Re-Deploy mit Pre-Migration-Code
  - **Step 6 — Coolify-Re-Deploy:** Coolify-UI → App-Service → Manual-Deploy + verify Healthz
  - **Anti-Pattern-Warnung:** kein `DROP COLUMN` ohne vorheriges Backup; keine Direct-`__drizzle_migrations`-DELETE ohne Backup
  - **Cross-Refs:** Story 2.0 Drizzle-Foundation, `postgres-restore.md`, Story 5.5 Backup-Restore-Drill

**AC-11 (README.md auf Phase-1-Realität aktualisieren):**

**Given** aktuelles README.md (24 Zeilen, „Paraglide v2 (8 Sprachen)"-Aussage outdated)
**When** ich README.md erweitere
**Then** README enthält:
  - **Titel + One-Liner:** unchanged
  - **GitHub-Link:** unchanged
  - **Setup-Section:** unchanged
  - **Stack-Section aktualisiert:** „Paraglide v2 (Phase 1 DE-only, EN/weitere Sprachen deferred Phase 3)" statt „8 Sprachen". Postgres-Hybrid + Kiez-Score erwähnt: „SvelteKit 2 · Svelte 5 (Runes) · TypeScript strict · Tailwind v4 · Paraglide v2 (Phase 1 DE-only) · MapLibre GL · LayerChart v2 · D3 · Turf · Bits UI · Postgres 17 (Hybrid-Aggregat-Cache via Drizzle) · WebMCP · Vitest · Playwright."
  - **Neue Section „Architecture":** kurzer Verweis auf `ARCHITECTURE.md` + `docs/adr/`
  - **Neue Section „Production-Hosting":** kurzer Verweis auf `docs/runbooks/server-bootstrap.md` + Stack-Statement „Hetzner-Frankfurt CPX22 + Coolify + Traefik + CrowdSec + Postgres 17 + Let's-Encrypt"
  - **Neue Section „Story-Highlights":** kurze Auswahl von 5–8 prominenten Stories (Cross-Layer-Inspector, Kiez-Score-System, 1719+ Klima-Zeitreihe, WebMCP-Integration, EU-FOSS-Stack), recruiter-readable
  - **Lizenz-Section:** unchanged
**And** README <100 Zeilen (Concise, weitere Details in ARCHITECTURE.md + ADRs)
**And** Keine em-dashes

**AC-12 (ARCHITECTURE.md — recruiter-readable Stack-Showcase neu):**

**Given** Public-GitHub-Repo als FOSS-Asset + Beratungs-Showcase
**When** ich `ARCHITECTURE.md` neu im Repo-Root anlege
**Then** Dokument enthält (mind. 200 Zeilen, max ~500 Zeilen):
  - **One-Liner + Mission:** navigator.berlin als Cross-Layer-Berlin-Atlas mit WebMCP + EU-FOSS-Stack
  - **Architecture-Map:** Mermaid-Diagram (oder ASCII-Block) der Service-Topology (Hetzner → Coolify-Compose → App+Traefik+CrowdSec+Postgres, mit Build-Time-Datenquellen + GitHub-Actions-CI-Pipeline)
  - **Data-Layer:** Static-GeoJSON (Source-of-Truth) + Postgres-Hybrid (Build-Zeit-Cache, kein Source-of-Truth) + Aggregat-Pipeline `data:fetch` → `data:aggregate` → DB-Write
  - **Frontend-Layer:** SvelteKit 2 + Svelte 5 Runes + MapLibre GL + Bits UI + Tailwind v4. Verweis auf MUST-Rules (`architecture.md` Zeilen 1050–1073)
  - **i18n-Layer:** Phase 1 DE-only (ADR-014), Paraglide-Infrastructure für Phase-3-Reaktivierung
  - **Hosting-Layer:** Hetzner-CPX22 + Coolify + Traefik + CrowdSec + Let's-Encrypt. Keine US-Drittanbieter, Cookieless (ADR-004). Backup mit GPG-Symmetric (Story 4.2) zu Hetzner-Storage-Box.
  - **Security-Layer:** TLS 1.3, Strict-CSP via SvelteKit-kit.csp, HSTS-Preload, Postgres-Role-Separation (`navigator_owner` ≠ `app`), ISO-27001-Patterns
  - **CI/CD-Layer:** GitHub-Actions mit 13 Quality-Gates (Story 4.3) + Lefthook Pre-Commit + Coolify-Deploy-Webhook auf Main
  - **WebMCP-Layer:** Browser-MCP-Server (Story 2.7 ready-for-dev), Civic-Tech-Premiere
  - **Compliance-Layer:** GDPR/TDDDG, Cookieless-by-default, Bookmark-Exception (§25 Abs. 2 Nr. 2 TDDDG), keine Tracking
  - **Innovation-Vektoren-Section:** 4 Vektoren aus PRD (WebMCP + Cross-Layer + Klima-1719+ + EU-FOSS-komplett-ohne-US)
  - **ADR-Index:** Tabelle mit allen ADRs (Title + Status + Date + 1-Zeile-Summary)
  - **Cross-Refs:** Links auf `docs/adr/`, `docs/runbooks/`, `_bmad-output/planning-artifacts/` (falls Public ggf. wegoptionieren), `README.md`
**And** Dokument ist recruiter-readable (kein BMad-Internal-Jargon, kein „User-Lock", stattdessen „Decision 2026-05-16")
**And** Mermaid-Block rendert auf GitHub correctly (validierbar via Browser-Preview)

**AC-13 (LICENSE-File Check + Repo-Hardening):**

**Given** existierendes `LICENSE`-File (MIT, Copyright Matze Schmidbauer 2026)
**When** ich Repo-Hardening verifiziere
**Then**:
  - LICENSE-File ist konsistent (MIT, korrekter Copyright-Owner)
  - `package.json` `license`-Field gesetzt auf `"MIT"` (verifizieren — falls nicht: setzen)
  - `package.json` `repository`-Field gesetzt auf `https://github.com/mschmdb/navigator-berlin` (verifizieren)
  - `.github/FUNDING.yml` neu (optional, falls Sponsor-Button gewünscht — Recommendation Open-Q3)
  - `CODE_OF_CONDUCT.md` (optional, falls Public-Contributions erwartet — Phase-3-Story)
  - Public-Repo-Settings (GitHub-UI-Action): Description gesetzt, Topics gesetzt (`sveltekit`, `civic-tech`, `berlin`, `open-data`, `webmcp`, `eu-foss`, `maplibre`, `postgres`)

**AC-14 (Cross-Doku-Verifikation):**

**Given** alle 10 neuen/modifizierten Files
**When** ich Cross-Refs validiere
**Then**:
  - Jede neue Runbook hat `Cross-Refs`-Section mit Verweisen auf relevante ADRs + Stories
  - ADR-013 cross-linked von ADR-003 (Superseded-by) + ADR-015 (Cross-Mention bei Postgres-Hybrid)
  - ADR-014 cross-linked von ADR-005 + Story 3.1 + Future-Epic-Verweise
  - ADR-015 cross-linked von ADR-013 (Co-Host-Anforderung) + Story 4.1
  - README.md + ARCHITECTURE.md zitieren alle 15 ADRs (Index-Tabelle)
  - Keine Broken-Links (manuelle Verify per `grep -rn '\](.*\.md)' docs/ README.md ARCHITECTURE.md` + Spot-Check)

## Tasks / Subtasks

- [ ] **Task 1: 7 Stub-ADRs befüllen (AC: #1)**
  - [ ] ADR-007 (Bits UI) Body schreiben + Status Accepted
  - [ ] ADR-008 (Context-API) Body schreiben + Status Accepted
  - [ ] ADR-009 (Remote-Functions) Body schreiben + Status Accepted
  - [ ] ADR-010 (Experimental-Async) Body schreiben + Status Accepted
  - [ ] ADR-011 (On-Demand-Layer-Loading) Body schreiben + Status Accepted
  - [ ] ADR-005-Status verifizieren (Story 3.1 erwartet befüllt zu haben) — falls nicht, NOTIZ in Hand-off-Section dieser Story
  - [ ] Linting/Markdown-Check: `pnpm exec prettier --check docs/adr/*.md`

- [ ] **Task 2: ADR-013 + ADR-014 + ADR-015 neu (AC: #2, #3, #4, #5)**
  - [ ] ADR-013 Postgres-Hybrid (Code-Snippet AC-2 als Vorlage)
  - [ ] ADR-014 i18n-Scope-Reduce DE-only (Code-Snippet AC-4)
  - [ ] ADR-015 Hetzner-CPX22-AMD (Code-Snippet AC-5)
  - [ ] ADR-003 auf Superseded by ADR-013 umstellen + Cross-Link

- [ ] **Task 3: 5 Runbooks neu (AC: #6, #7, #8, #9, #10)**
  - [ ] `docs/runbooks/crowdsec-whitelist.md`
  - [ ] `docs/runbooks/data-source-failure.md`
  - [ ] `docs/runbooks/geocode-rate-limit-hit.md`
  - [ ] `docs/runbooks/postgres-restore.md`
  - [ ] `docs/runbooks/drizzle-migration-rollback.md`
  - [ ] Pro Runbook: Schritt-für-Schritt-Befehle, Anti-Pattern-Warnung, Cross-Refs

- [ ] **Task 4: README.md aktualisieren (AC: #11)**
  - [ ] Stack-Section auf Phase-1-DE-only + Postgres-Hybrid
  - [ ] Architecture-Section neu
  - [ ] Production-Hosting-Section neu
  - [ ] Story-Highlights-Section neu

- [ ] **Task 5: ARCHITECTURE.md neu (AC: #12)**
  - [ ] Mission-Statement + One-Liner
  - [ ] Mermaid-Service-Topology
  - [ ] Data/Frontend/i18n/Hosting/Security/CI-CD/WebMCP/Compliance-Layer-Sections
  - [ ] Innovation-Vektoren-Section
  - [ ] ADR-Index-Tabelle
  - [ ] Cross-Refs

- [ ] **Task 6: Repo-Hardening (AC: #13)**
  - [ ] `package.json` `license`-Field + `repository`-Field verifizieren
  - [ ] LICENSE-File-Konsistenz verifizieren
  - [ ] Optional: `.github/FUNDING.yml` (User-Decision Open-Q3)
  - [ ] GitHub-UI: Repo-Description + Topics setzen (User-Action)

- [ ] **Task 7: Cross-Doku-Verifikation (AC: #14)**
  - [ ] `grep -rn '\](.*\.md)' docs/ README.md ARCHITECTURE.md` Output prüfen
  - [ ] Spot-Check 10 zufällige Links
  - [ ] Mermaid-Block validieren via GitHub-Preview-Render

- [ ] **Task 8: Commit-Strategie**
  - [ ] Commits getrennt:
    1. `docs(adr): befülle 7 stub-adrs auf accepted (story 4.4 a)`
    2. `docs(adr): add ADR-013 postgres-hybrid + ADR-014 i18n-de-only + ADR-015 hetzner-cpx22 (story 4.4 b)`
    3. `docs(adr): ADR-003 superseded by ADR-013 (story 4.4 c)`
    4. `docs(runbooks): 5 disaster-recovery runbooks (story 4.4 d)`
    5. `docs(repo): README phase-1 update + ARCHITECTURE.md neu (story 4.4 e)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Doku-Stand (vor Story 4.4)

- **`docs/adr/`:** 13 ADR-Files (ADR-000-template + ADR-001 bis ADR-012)
- **`Proposed`-Status:** 7 Stubs (003, 005, 007, 008, 009, 010, 011)
- **`Accepted`-Status:** 5 (001, 002, 004, 006, 012)
- **`docs/runbooks/`:** 5 vorhandene Runbooks (a11y-smoke-test, bookmark-storage, local-postgres-setup, tile-provider-switch, webmcp-verify)
- **`README.md`:** 24 Zeilen, „8 Sprachen"-Aussage outdated
- **`ARCHITECTURE.md`:** nicht existent
- **`LICENSE`:** MIT vorhanden

### ADR-014-Lock-Drift (KRITISCH)

Epic-Text (Zeile 2025) sagt „i18n-Scope-Reduce-Lock 2026-05-15 (8 Sprachen → de/en für Phase 1)". **Memory `project_i18n_phase_1_de_only` sagt User-Lock 2026-05-16 = DE-only Phase 1** (EN deferred Phase 3). Story 3.1 implementiert DE-only-Reduce.

**Resolution:** ADR-014 reflektiert den **neueren Lock** (2026-05-16, DE-only). Epic-Text ist zum 4.4-Implementations-Zeitpunkt outdated. Story 4.4 dokumentiert beide Locks chronologisch in Context-Section von ADR-014, Decision ist DE-only.

### Memory-Bezug

- **`feedback_no_em_dashes`:** alle Texte ohne `—` oder `–` (außer Zahlen-Ranges)
- **`project_i18n_phase_1_de_only`:** ADR-014-Decision DE-only
- **`project_server_purchase_sequencing`:** ADR-015-Decision CPX22 + 3-Phasen-Deployment-Mention
- **`feedback_no_lebenswert`:** keine NS-belasteten Begriffe in Runbooks/ADRs

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #2 (Files <500 Zeilen):** alle neuen ADRs/Runbooks bleiben unter 500 Zeilen
- **Rule #4 (Keine Backwards-Compat-Hacks):** ADR-003 wird Superseded markiert, NICHT gelöscht (Historie-Erhaltung)

**NFR-Mapping:**

- **NFR-M2 (Reproducible Build / Doku-Konsistenz):** alle ACs
- **NFR-M6 (Recruiter-readable Artefakte):** AC-11 (README) + AC-12 (ARCHITECTURE.md)
- **NFR-R6 (Disaster-Recovery dokumentiert):** AC-6 bis AC-10

### Test-Strategie (ADR-012)

Story 4.4 ist **Documentation-only**. Keine Code-Änderungen. ADR-012 Exceptions: ADR-Stubs, README-Sections, JSON-Translation-Files. **Smoke-Level-Verifikation:**

- Prettier-Format-Check auf `docs/**/*.md` + Root-MD-Files
- Markdown-Link-Validity (manueller `grep`-Spot-Check, AC-14)
- GitHub-Preview-Render-Check für Mermaid in ARCHITECTURE.md

Keine Vitest-Tests.

### Previous Story Intelligence

**Story 3.1 (Paraglide-Reduce, ready-for-dev):** AC-11 von 3.1 befüllt ADR-005. Story 4.4 verifiziert nur Konsistenz. Falls 3.1 noch nicht done bei 4.4-Implementation: 4.4 dokumentiert in Hand-off, ADR-005-Befüllung bleibt 3.1-Scope.

**Story 4.1 (Production-Setup, ready-for-dev):** liefert Backup-Routine-Foundation für `postgres-restore.md`. AC-9 nutzt 4.1 + 4.2-Outputs.

**Story 4.2 (Security-Hardening, ready-for-dev):** liefert CrowdSec-Installation für `crowdsec-whitelist.md`, GPG-Encryption für `postgres-restore.md`-Step-3.

**Story 4.3 (CI-Gates, ready-for-dev):** keine direkten Hand-offs.

### File-List nach Story-Completion (erwartet)

**Modified:**

- `docs/adr/ADR-003-postgres-deferral.md` (Superseded)
- `docs/adr/ADR-007-bits-ui.md` (Body)
- `docs/adr/ADR-008-context-api-state.md` (Body)
- `docs/adr/ADR-009-remote-functions.md` (Body)
- `docs/adr/ADR-010-experimental-async.md` (Body)
- `docs/adr/ADR-011-on-demand-layer-loading.md` (Body)
- `README.md` (Stack-Section + neue Sections)
- `package.json` (license/repository-Fields verifiziert)

**New:**

- `docs/adr/ADR-013-postgres-hybrid-architecture.md`
- `docs/adr/ADR-014-i18n-scope-reduce-de-only.md`
- `docs/adr/ADR-015-hetzner-cpx22-amd.md`
- `docs/runbooks/crowdsec-whitelist.md`
- `docs/runbooks/data-source-failure.md`
- `docs/runbooks/geocode-rate-limit-hit.md`
- `docs/runbooks/postgres-restore.md`
- `docs/runbooks/drizzle-migration-rollback.md`
- `ARCHITECTURE.md`
- (optional) `.github/FUNDING.yml`

**Untouched (verified konsistent):**

- `docs/adr/ADR-000-template.md`
- `docs/adr/ADR-001-tile-provider.md`
- `docs/adr/ADR-002-webmcp.md`
- `docs/adr/ADR-004-cookieless.md`
- `docs/adr/ADR-006-tailwind-v4.md`
- `docs/adr/ADR-012-tdd-mandate.md`
- `docs/runbooks/a11y-smoke-test.md`
- `docs/runbooks/bookmark-storage.md`
- `docs/runbooks/local-postgres-setup.md`
- `docs/runbooks/tile-provider-switch.md`
- `docs/runbooks/webmcp-verify.md`
- `LICENSE`

### Project Structure Notes

ADR-Convention: `ADR-NNN-<kebab-slug>.md` (3-Digit-Padding für Sortierung).
Runbook-Convention: `<kebab-slug>.md` flach in `docs/runbooks/`.
README/ARCHITECTURE als Repo-Root-MD-Files konvention für Public-Repo-Discoverability.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.4` Zeilen 2005–2044] — Story-Definition
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 1050–1073] — 21 MUST-Rules
- [Source: `_bmad-output/planning-artifacts/prd.md` Zeilen 371–426] — Innovation & Novel Patterns
- [Source: `docs/adr/ADR-000-template.md`] — Standard-Template
- [Source: `docs/adr/ADR-004-cookieless.md`] — Befüllter ADR-Pattern-Vorlage
- [Source: `docs/runbooks/tile-provider-switch.md`] — Befüllter Runbook-Pattern-Vorlage
- [Source: `README.md`] — Aktueller Stand (24 Zeilen)
- [Source: `LICENSE`] — MIT
- [Source: Story 3.1 File] — ADR-005-Hand-off
- [Source: Story 4.1 File] — Backup-Routine-Foundation
- [Source: Story 4.2 File] — GPG-Encryption + CrowdSec-Installation
- [Source: Memory `project_i18n_phase_1_de_only`] — ADR-014-Lock
- [Source: Memory `project_server_purchase_sequencing`] — ADR-015-Decision
- [Source: Memory `feedback_no_em_dashes`]
- [Source: Memory `feedback_no_lebenswert`]
- [Source: Mermaid GitHub-Render-Docs https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams]

## Open Questions / Pre-Dev-Clarifications

1. **ADR-005-Befüllung: 3.1 oder 4.4?** Story 3.1 AC-11 sagt ADR-005 wird in 3.1 befüllt. Story 4.4 AC-1 sagt ADR-Bestand-Konsistenz für 13 ADRs (inkl. 005). **Empfehlung:** ADR-005 bleibt 3.1-Scope, 4.4 verifiziert nur Konsistenz. Falls 3.1 nicht done bei 4.4-Implementation: 4.4-Dev dokumentiert Hand-off und überspringt ADR-005.

2. **ARCHITECTURE.md Public oder Internal?** `_bmad-output/planning-artifacts/architecture.md` ist 1.827-Zeilen-Internal-Doc (BMad-Workflow-Output). ARCHITECTURE.md Repo-Root soll public-readable Subset sein. **Empfehlung:** ARCHITECTURE.md Repo-Root als Subset/Showcase (200–500 Zeilen), `_bmad-output/`-File als Internal-Workflow-Doc (NICHT verlinkt von Public-Repo-Doku). Falls Public-Read gewünscht: separate Section in ARCHITECTURE.md mit Verweis.

3. **`.github/FUNDING.yml` Sponsor-Button erstellen?** GitHub-Sponsor-Button (z.B. ko-fi, GitHub-Sponsors, custom-URL). **Empfehlung:** NICHT in 4.4 (Phase-3-Story falls Beratungs-Pipeline anlaufen sollte). Solo-Maintainer-Bauspaß-Bilanz-Lock 2026-05-XX sagt nicht primär monetisiert.

4. **Mermaid-Diagram in ARCHITECTURE.md vs ASCII-Block?** Mermaid rendert auf GitHub korrekt seit 2023. **Empfehlung:** Mermaid für Service-Topology + ASCII-Block für Data-Flow (Build-Time-Pipeline). Beide gut readable.

5. **`postgres-restore.md` Test-Decrypt + Test-Restore in Story 5.5 (Backup-Drill) oder hier?** AC-9 dokumentiert Steps, aber kein Live-Test. Live-Test ist Story 5.5 (Backup-Restore-Drill auf Staging). **Empfehlung:** 4.4 dokumentiert nur Steps, 5.5 verifiziert auf Staging. Konsistent mit Test-Cadence.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
