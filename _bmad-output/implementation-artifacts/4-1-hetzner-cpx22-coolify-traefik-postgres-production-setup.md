# Story 4.1: Hetzner CPX22 + Coolify + Traefik + Postgres Production-Setup

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer,
I want produktives Hosting auf Hetzner-Falkenstein CPX22 (AMD Genoa, 4GB RAM / 2 vCPU / 80GB SSD, EUR 9,51/Monat) mit Coolify + Traefik + dediziertem Postgres-17-Service (Internal-Network only) inklusive Auto-Restart, Daily-Volume-Backup, nightly `pg_dump` mit Off-Server-Replikation, Let's-Encrypt-TLS via Traefik, `/healthz`-Probe (App + Postgres) und 3-Phasen-Deployment-Schema (Coming-Soon → Soft-Beta → Hard-Production),
so that Site mit 99% Uptime (NFR-R1) ohne SLA und ohne externes Monitoring betreibbar ist, Postgres-Aggregat-Schicht aus Story 2.0 deployed werden kann, `data:aggregate`-Build-Step gegen Production-Postgres läuft, und Domain-Footprint claim'd ist während Beta/Hard-Launch-Vorbereitung läuft.

## Phase-1-Kontext + Sequencing

**Server-Kauf-Trigger (Memory `project_server_purchase_sequencing`, User-Lock 2026-05-15-PM):** Hetzner CPX22 wird **NACH Epic 2 Story 2.0** beschafft (nicht erst zu Beginn von Epic 4). Story 2.0 hat Status `review` — Postgres-Drizzle-Schema und `scripts/aggregate-data.ts` existieren bereits. Server-Provisioning ist deployment-fähig. Story 4.1 wandert in der zeitlichen Sequenz **vor** alle anderen Epic-4-Stories und vor weitere Epic-2-Stories (parallel zu 2.1, 2.2, 2.3 etc.).

**3-Phasen-Deployment (epic.md Zeilen 1900–1913):**

- **Phase 1 = Coming-Soon-Skelett** (ab 4.1-Deploy): minimale Landing-Page mit Brand-Footprint, `robots.txt` mit `Disallow: /`, `<meta name="robots" content="noindex, nofollow">`, `/healthz` live, SSL + DNS aktiv. Story 2.11 implementiert NAVIGATOR_PHASE-Env-Switch + `home-coming-soon.svelte`-Komponente — 4.1 verifiziert dass `NAVIGATOR_PHASE=coming-soon` in Coolify-Env korrekt wirkt.
- **Phase 2 = Soft-Beta** (nach Epic 2 Stories 2.1–2.11 + Epic 3 done): Beta-Banner sichtbar, `noindex`-Meta bleibt, Friends-and-Family-Test-Pfad in `docs/launch-plan.md` (Epic 5).
- **Phase 3 = Hard-Production** (nach Epic 4 + Epic 5 done): `noindex`-Meta entfernt, Sitemap-Submission (Story 5.7), Beta-Banner entfernt, Hard-Launch-Material gepostet (Story 5.3).

**ADR-Status (Story 4.4 nachzieher):** ADR-015 (Hetzner-CPX22-statt-CX32) wird in Story 4.4 dokumentiert — Architecture-Doku (`architecture.md` Zeile 482) referenziert noch CX32 (ARM). Story 4.1 verwendet CPX22 (AMD) explizit per User-Lock 2026-05-15-PM, finale Bestätigung 2026-05-17-AM nach CX33-vs-CPX22-Recherche (CX-Gen3-Lotterie + Cross-Arch-Rescale-Block ausgeschlossen). ADR-013 (Postgres-Hybrid) und ADR-014 (i18n-Scope-Reduce) ebenfalls in 4.4.

**Aux-Server (Memory `project_cax21_aux_server`):** Bestehender CAX21 (ARM Ampere, 168.119.98.228) verfügbar als sekundäre Resource für kleine externe Dienste (z. B. off-server-rsync-Target alternativ zu Storage-Box, Status-Endpoint, leichte Monitoring-Aufgaben). Kein Primär-Production-Host für navigator.berlin — Trennung Production-Pfad bleibt CPX22-only. Cross-Arch (AMD ↔ ARM) verhindert Direkt-Cluster, aber Aux-Pfad via SSH-rsync/HTTPS unkritisch.

**Memory-Marker:** `project_server_purchase_sequencing`, `project_cax21_aux_server`, `project_i18n_phase_1_de_only` (i18n-Phase-1 ist DE-only — Coming-Soon-Skelett ist DE-only, kein `/en/...`-Variant).

## Acceptance Criteria

**AC-1 (Hetzner CPX22 provisioniert, SSH-Hardened — NFR-S8):**

**Given** ein Hetzner-Account und User-Lock-Server-Wahl 2026-05-15-PM (CPX22 AMD, finale Bestätigung 2026-05-17-AM nach Performance-Recherche)
**When** ich Hetzner-CPX22-Instance (AMD Genoa, 4GB RAM / 2 vCPU / 80GB SSD, Falkenstein, EUR 9,51/Monat) provisioniere und mit Standard-Image `Ubuntu 24.04 LTS` aufsetze
**Then** Server ist via SSH erreichbar mit:
  - SSH-Key-Auth-only (kein Passwort-Login)
  - Dedizierter Admin-Account (nicht `root`), Admin-User mit `sudo`-Privileg
  - Root-Login deaktiviert (`PermitRootLogin no` in `/etc/ssh/sshd_config`)
  - Hetzner-Cloud-Firewall: nur Ports `22`, `80`, `443` von extern offen, alle anderen geschlossen (auch `5432` Postgres + `8080` Coolify-Admin)
  - Coolify-Admin-UI nur via SSH-Tunnel (`ssh -L 8080:localhost:8000 admin@<server>`) erreichbar — Coolify-Default-Public-Expose deaktiviert
**And** Server-Hostname = `navigator-prod-01` oder ähnlich (dokumentiert in `docs/runbooks/server-bootstrap.md` neu)
**And** Hetzner-Layer-3/4-DDoS-Protection aktiviert (kostenlos, NFR-S6)

**AC-2 (Coolify installiert + Auto-Restart konfiguriert — NFR-R2):**

**Given** die Hetzner-Instance per AC-1
**When** ich Coolify gemäß offizieller Install-Doku (https://coolify.io/docs/installation) per `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` installiere
**Then** Coolify-Web-UI erreichbar via SSH-Tunnel auf `localhost:8080` (kein Public-Expose)
**And** Coolify-Auto-Restart bei Container-Crash konfiguriert mit Restart-Lücke <60s (NFR-R2)
**And** Coolify-Version dokumentiert in `docs/runbooks/server-bootstrap.md` (Stand zum Deploy-Zeitpunkt)

**AC-3 (Coolify-Compose mit App + Traefik + CrowdSec-Plugin + Postgres-17):**

**Given** Coolify-Web-UI per AC-2
**When** ich eine neue `docker-compose.yml` Resource in Coolify anlege, die folgende Services orchestriert:
  - **`app`** (SvelteKit Node-Adapter):
    - Build aus GitHub-Repo `mtcberlin/navigator.berlin`-Main-Branch
    - Coolify-Buildpack: Node 20+ (NIXPACKS oder explizites Dockerfile)
    - Healthcheck: `GET /healthz` alle 30s, 3 Failures = Restart
    - Env-Vars aus Coolify-Secrets: `NODE_ENV=production`, `DATABASE_URL=postgres://app:***@postgres:5432/navigator`, `NOMINATIM_ENDPOINT=https://nominatim.openstreetmap.org`, `NAVIGATOR_PHASE=coming-soon` (Initial), `ORIGIN=https://navigator.berlin`
    - Volume `app-data:/app/data` für SQLite-/Cache-Files (falls relevant; ggf. obsolet, dann weglassen)
  - **`traefik`** (Reverse-Proxy):
    - Coolify-Default-Traefik-Service (kein separater Container)
    - TLS-Termination via Let's Encrypt (siehe AC-7)
    - HTTP→HTTPS-Redirect erzwungen
    - Routet `navigator.berlin` (und `www.navigator.berlin` als CNAME-Variant) auf `app`-Service
  - **`postgres`** (Postgres 17):
    - Image: `postgres:17-alpine` (Official Postgres Docker Hub Image)
    - Kein `ports:`-Mapping (NICHT `5432:5432` exposen — Internal-Network only)
    - Network: gleiches Coolify-Internal-Network wie `app`
    - Env: `POSTGRES_DB=navigator`, `POSTGRES_USER=app`, `POSTGRES_PASSWORD` aus Coolify-Secrets (generated 32-char-random)
    - Volume: `postgres-data:/var/lib/postgresql/data` (für Persistence)
    - Healthcheck: `pg_isready -U app -d navigator` alle 30s
**Then** `docker-compose.yml` ist committed in Repo-Root mit ausreichend Inline-Kommentaren
**And** Deploy erfolgreich via Coolify-Webhook (siehe AC-9)
**And** App ist über `https://navigator.berlin` erreichbar (HTTPS 200)
**And** Postgres ist nur app-intern verbunden (`nmap -p 5432 navigator.berlin` von extern liefert „filtered/closed")
**And** `DATABASE_URL`-Env zeigt auf Internal-Service-Name `postgres:5432` (Docker-Internal-DNS)

**AC-4 (Domain + DNS-Setup, navigator.berlin):**

**Given** die Domain `navigator.berlin` (existierend, Registrar-Status zum Story-Start prüfen)
**When** ich DNS-Records bei aktuellem Registrar (oder Hetzner-DNS-Console, falls Transfer gewünscht — Open-Q5) konfiguriere
**Then** DNS-Records korrekt gesetzt:
  - `A navigator.berlin → <Hetzner-IPv4>`
  - `AAAA navigator.berlin → <Hetzner-IPv6>` (Dual-Stack)
  - `CNAME www.navigator.berlin → navigator.berlin` (Traefik-Redirect handled)
  - TTL `300` (5 Min für initiale Iteration, später `3600` stabil)
**And** DNS-Propagation verifiziert via `dig navigator.berlin @1.1.1.1` (Cloudflare-Public-Resolver verwendet, keine US-Tracking-Bedenken bei Lookup)
**And** Hetzner-rDNS gesetzt: `<Hetzner-IPv4> → navigator.berlin` (für sauberen SMTP-Future-Use, Mail wird derzeit nicht gehostet)

**AC-5 (Domain-Renewal-Pay-Sicherung — NFR-R5):**

**Given** Domain `navigator.berlin` mit Renewal-Deadline beim Registrar
**When** ich Auto-Renewal-Pay beim Registrar aktiviere
**Then** Auto-Renewal-Status verifiziert in Registrar-UI
**And** 60-Tage-Vorab-Erinnerung per E-Mail an `hey@navigator.berlin` (oder persönliche Maintainer-Mail) eingerichtet
**And** Renewal-Pfad dokumentiert in `docs/runbooks/domain-renewal.md` (neu, ergänzt 5 fehlende Runbooks aus Story 4.4 — diese Runbook ist nicht in 4.4-Scope, also hier eigenständig)
**And** Domain-Verlust durch versehentliches Ablaufen ausgeschlossen

**AC-6 (Daily-Volume-Backup + Nightly pg_dump + Off-Server-Replikation — NFR-R4):**

**Given** Coolify-Volumes für `app-data` und `postgres-data`
**When** ich Backup-Routine konfiguriere
**Then**:
  - **App-Volume-Backup:** Coolify-Built-in Daily-Backup für `app-data` mit 7d Retention (Recommendation Open-Q4)
  - **Postgres-Backup:** Cron-Job auf Server (oder Coolify-Scheduled-Task), nightly um 03:00 UTC: `pg_dump -U app -d navigator -Fc -f /backups/pg-$(date +%Y%m%d).dump` mit 14d Retention auf `/backups/`-Volume
  - **Off-Server-Replikation:** Hetzner-Storage-Box (1TB EUR 3,50/Monat — Recommendation Open-Q3) als sekundärer Sync-Target via `rsync` über SFTP, gleicher Cron um 04:00 UTC: alle Files aus `/backups/` synchronisiert
  - **Backup-Verifikation:** wöchentlicher Cron testet `pg_restore --list` gegen letztes Backup-File (Smoke-Test, kein Full-Restore — Full-Restore-Drill ist Story 5.5 Scope)
**And** Backup-Scripts committed in `infra/backup/` (ggf. `infra/backup/pg-backup.sh` + `infra/backup/sync-off-server.sh`)
**And** Restore-Pfad dokumentiert via Verweis auf `postgres-restore.md`-Runbook (Story 4.4 erstellt diesen — hier nur Verweis als Hand-off)
**And** GPG-Verschlüsselung des pg_dump-Output ist **NICHT** Scope von 4.1 (per Story 4.2 AC, Zeile 1958–1960) — Coolify-Env-Var `GPG_PASSPHRASE` und GPG-Encrypt-Wrapper kommt mit 4.2

**AC-7 (Let's Encrypt TLS via Traefik — NFR-S1, NFR-S2):**

**Given** Traefik in Coolify-Compose per AC-3
**When** ich Let's-Encrypt-Auto-Renewal via Traefik konfiguriere
**Then** TLS-Cert für `navigator.berlin` + `www.navigator.berlin` automatisch via HTTP-01-Challenge (oder DNS-01-Challenge bei Wildcard-Need, Phase 1 reicht HTTP-01) bezogen
**And** Auto-Renewal alle 60 Tage konfiguriert (Cert-Lücke <24h, NFR-S2)
**And** TLS 1.3 als Default + TLS 1.2 als Fallback (Story 4.2 hardenet weiter; hier 4.1-Minimum)
**And** `https://navigator.berlin` zeigt valides Cert in Browser (kein Self-Signed-Warn)
**And** HTTP→HTTPS-Redirect via Traefik `redirectScheme` Middleware aktiv (301)

**AC-8 (/healthz-Endpoint erweitert + Coolify-Probes — NFR-R2):**

**Given** der `/healthz`-Endpoint aus Story 1.1 (`src/routes/api/healthz/+server.ts` aktuell: `return new Response('ok', { status: 200 })`)
**When** ich `/healthz` erweitere um Postgres-Health-Check
**Then** Handler:
```ts
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return new Response(JSON.stringify({ status: 'ok', db: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'degraded', db: 'unreachable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
};
```
**And** Vitest-Test `src/routes/api/healthz/+server.test.ts` (neu) prüft 200-Response bei DB-Up + 503 bei DB-Down (mocked db.execute throws)
**And** Coolify-Container-Health-Check ruft `/healthz` alle 30s, 3 Failures = Restart
**And** Postgres-Health zusätzlich via Compose-Healthcheck `pg_isready -U app -d navigator` alle 30s (Service-Level, getrennt von App-Health)

**AC-9 (Initial-Deploy = Phase 1 Coming-Soon — robots Disallow, noindex):**

**Given** Deployment-Phasen-Strategie (epic.md Zeilen 1900–1904)
**When** ich erstes Deploy nach Server-Provisioning starte
**Then** Phase-1-State aktiv:
  - `NAVIGATOR_PHASE=coming-soon` in Coolify-Env-Vars gesetzt
  - `static/robots.txt` enthält:
    ```
    User-agent: *
    Disallow: /
    ```
    (aktuell: `User-agent: *\nDisallow:` — MUSS auf `Disallow: /` für Phase 1)
  - `<meta name="robots" content="noindex, nofollow">` global in `src/app.html` ODER bedingt in Root-Layout `+layout.svelte` für `NAVIGATOR_PHASE=coming-soon|beta` (Recommendation Open-Q1: bedingt, da Phase 3 noindex entfernt)
  - Coming-Soon-Skelett: Story 2.11 implementiert `src/lib/components/home/home-coming-soon.svelte`, `src/lib/config/phase.ts`, und `+page.server.ts` 503-Guard für `/explore`. Falls Story 2.11 zum 4.1-Implementations-Zeitpunkt noch NICHT done ist (aktuell `ready-for-dev`), implementiert 4.1-Dev als **temporäre Minimal-Variante**:
    - `src/routes/+page.svelte` zeigt Brand-Footprint („navigator.berlin · Berliner Daten-Atlas · Coming Soon · von Matze Schmidbauer"), Plex-Serif h1, Plex-Sans Subline
    - Alle anderen Routes (`/methodik`, `/layer/*`, `/lizenzen`, etc.) bleiben erreichbar aber `<meta robots noindex>`
    - Nach 2.11 done: Coming-Soon-Komponente wandert in `home-coming-soon.svelte`, Phase-Switch wird ENV-driven
**And** `/healthz`-Endpoint live für Monitoring-Probe
**And** SSL-Cert generiert (Let's-Encrypt-Issue innerhalb 60s nach DNS-Propagation)
**And** Domain-Footprint claim'd (HTTP-200 auf `https://navigator.berlin`)

**AC-10 (Phase-Transition-Pfade dokumentiert):**

**Given** 3-Phasen-Deployment-Strategie
**When** ich `docs/runbooks/phase-transition.md` erstelle
**Then** Runbook dokumentiert:
  - **Phase 1 → Phase 2 (Coming-Soon → Soft-Beta):** Trigger = Epic 2 Stories 2.1–2.11 + Epic 3 done. Coolify-Env-Var `NAVIGATOR_PHASE=beta` setzen, Deploy. Beta-Banner-Komponente (Story 2.11) wird active, Atlas auf `/explore` erreichbar. `robots.txt` bleibt `Disallow: /`, `noindex`-Meta bleibt.
  - **Phase 2 → Phase 3 (Soft-Beta → Hard-Production):** Trigger = Epic 4 Stories 4.2–4.7 + Epic 5 Stories 5.1–5.4 done. Coolify-Env-Var `NAVIGATOR_PHASE=hard` setzen, Deploy. `robots.txt` auf erlaubt-State, `noindex`-Meta entfernt, Sitemap-Submission (Epic 5 Story 5.7) ausgelöst.
  - **Rollback-Pfad:** Coolify-Compose-Revert + Env-Var-Reset (5-Minuten-Operation, dokumentiert mit konkreten Commands)
**And** Runbook ist in `docs/runbooks/`-Index gelistet

**AC-11 (Smoke-Test-Suite gegen Production-Domain):**

**Given** Production-Deploy per AC-3 + AC-7 + AC-9
**When** ich post-deploy folgende Manuell-Verifikation durchführe (NICHT automatisiert in CI, kommt mit Story 4.3)
**Then** alle Checks grün:
  - `curl -I https://navigator.berlin` → HTTP 200, `strict-transport-security`-Header gesetzt (Story 4.2 vollständig — hier nur Existenz minimal)
  - `curl https://navigator.berlin/healthz` → JSON `{"status":"ok","db":"ok"}`, Status 200
  - `curl -I http://navigator.berlin` → HTTP 301 → `https://navigator.berlin`
  - `curl https://navigator.berlin/robots.txt` → `User-agent: *\nDisallow: /` (Phase 1)
  - `curl -s https://navigator.berlin | grep -i noindex` → Match (noindex-Meta sichtbar)
  - `nmap -p 5432 navigator.berlin` → filtered/closed (Postgres nicht extern erreichbar)
  - `nmap -p 8080 navigator.berlin` → filtered/closed (Coolify-Admin nicht extern erreichbar)
  - `curl -I https://navigator.berlin` → KEIN `Set-Cookie`-Response-Header (ADR-004 + MUST-Rule #10 + NFR-PR1, abhängig von Story 3.1-Paraglide-Reduce — falls 3.1 NICHT done ist, ist `Set-Cookie: PARAGLIDE_LOCALE=...` möglicherweise gesetzt; in dem Fall: Coordination-Hand-off zu 3.1 dokumentiert in Dev-Notes)
  - Browser-Test: `https://navigator.berlin` zeigt Coming-Soon-Skelett ohne JavaScript-Errors in DevTools-Console
**And** Smoke-Test-Ergebnisse dokumentiert in `docs/runbooks/server-bootstrap.md` als „Post-Deploy-Checklist"

**AC-12 (Server-Bootstrap-Runbook + Repo-Documentation):**

**Given** komplettes Production-Setup per AC-1 bis AC-11
**When** ich `docs/runbooks/server-bootstrap.md` schreibe
**Then** Runbook ist reproduzierbar (Zukunfts-Maintainer oder ich-in-12-Monaten kann gesamten Setup wiederholen):
  - Hetzner-Account-Anforderungen + Server-Provisioning-Steps (CPX22 Falkenstein AMD, 4GB RAM / 2 vCPU / 80GB SSD)
  - SSH-Key-Setup + Admin-User + Firewall-Rules
  - Coolify-Install-Befehl + erste Konfiguration
  - DNS-Records-Liste (A, AAAA, CNAME, rDNS)
  - Coolify-Compose-Resource-Setup + Env-Vars (mit Platzhaltern für Secrets, kein Plaintext)
  - Deploy-Trigger via GitHub-Webhook-URL
  - Backup-Cron-Setup
  - Post-Deploy-Smoke-Checklist (AC-11)
  - Coolify-Version + Postgres-Image-Version zum Setup-Zeitpunkt
**And** README.md updated: kurzer Section „Production-Hosting" mit Verweis auf `server-bootstrap.md`
**And** `.env.example` updated mit Production-relevanten Env-Vars (NAVIGATOR_PHASE, ORIGIN — beide mit Phase-1-Default-Werten als Hinweis-Kommentar, KEINE Plaintext-Secrets)

**AC-13 (`data:aggregate`-Production-Validation gegen Production-Postgres):**

**Given** Production-Postgres aus AC-3 + Story 2.0 `aggregate-data.ts`-Script + `pnpm db:migrate`-Migration aus Story 2.0
**When** ich von lokaler Dev-Maschine via temporären SSH-Tunnel (`ssh -L 5433:postgres-internal:5432 admin@<server>`) gegen Production-Postgres `pnpm db:migrate` und `pnpm data:aggregate` ausführe (mit `DATABASE_URL=postgres://app:***@127.0.0.1:5433/navigator`)
**Then** Schema-Migrationen sind erfolgreich appliziert
**And** Cross-Layer-Aggregate sind in Production-Postgres geschrieben (`SELECT count(*) FROM bezirk_stats; -- 12` und `SELECT count(*) FROM kiez_stats; -- 143`)
**And** Production-Verifikation dokumentiert in `server-bootstrap.md`
**And** Ab diesem Punkt läuft Coming-Soon-Phase mit echtem Production-Postgres-State (Coming-Soon-Page selbst nutzt Aggregat-Daten NICHT, aber Stack ist deployment-ready für Beta-Phase)
**And** **SSH-Tunnel-Method ist temporär für Initial-Seed** — für laufende `data:aggregate`-Refreshes wird in Story 4.3 (GitHub-Actions-CI) ein Workflow eingerichtet, der gegen Production-Postgres via Coolify-Webhook + Container-internal-Run läuft (NICHT 4.1-Scope)

## Tasks / Subtasks

- [ ] **Task 1: Hetzner-Server-Provisioning + SSH-Hardening (AC: #1)**
  - [ ] Hetzner-Cloud-Account einloggen, neue Instance CPX22 Falkenstein AMD anlegen (Regular Performance, NICHT Cost-Optimized — CX-Gen3-Lotterie + Cross-Arch-Rescale-Block per Recherche 2026-05-17)
  - [ ] Ubuntu 24.04 LTS image, SSH-Key beim Setup hinterlegen
  - [ ] Admin-User per `adduser admin` + `usermod -aG sudo admin` anlegen
  - [ ] `/etc/ssh/sshd_config`: `PermitRootLogin no`, `PasswordAuthentication no` setzen + `systemctl restart sshd`
  - [ ] Hetzner-Cloud-Firewall anlegen: nur 22/80/443 inbound, Default deny
  - [ ] DDoS-Protection aktiviert verifizieren (Default an)
  - [ ] Server-Hostname setzen: `hostnamectl set-hostname navigator-prod-01`
  - [ ] 2 GB Swap-File anlegen (`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, `/etc/fstab`-Eintrag) — Puffer für 4 GB RAM unter pg_dump-Nacht + Docker-Layer-Rebuild

- [ ] **Task 2: Coolify-Install (AC: #2)**
  - [ ] `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` ausführen
  - [ ] Coolify-Admin-Account Setup via SSH-Tunnel `ssh -L 8080:localhost:8000 admin@<server>` + Browser
  - [ ] Coolify-Default-Public-Expose deaktivieren (UI-Setting oder Compose-Edit)
  - [ ] Auto-Restart bei Crash konfiguriert (Default an, verifizieren)
  - [ ] Coolify-Version notieren in `docs/runbooks/server-bootstrap.md`

- [ ] **Task 3: Domain + DNS-Setup (AC: #4, #5)**
  - [ ] Aktueller Registrar-Status `navigator.berlin` prüfen
  - [ ] DNS-Records setzen: A, AAAA, CNAME www, rDNS, TTL 300
  - [ ] DNS-Propagation verifizieren via `dig`
  - [ ] Auto-Renewal-Pay aktivieren beim Registrar
  - [ ] 60d-Reminder einrichten (Calendar-Reminder oder Registrar-Email)
  - [ ] `docs/runbooks/domain-renewal.md` schreiben

- [ ] **Task 4: docker-compose.yml + Coolify-Resource (AC: #3)**
  - [ ] `docker-compose.yml` in Repo-Root erstellen (App + Postgres-17, Traefik via Coolify-Default)
  - [ ] Inline-Comments für jede Service-Section
  - [ ] Coolify-UI: neue Resource `docker-compose`-Type anlegen, Source = GitHub-Repo Main-Branch
  - [ ] Coolify-Secrets erfassen: POSTGRES_PASSWORD, DATABASE_URL (intern, generated), NOMINATIM_ENDPOINT, NAVIGATOR_PHASE=coming-soon, ORIGIN
  - [ ] Coolify-Webhook-URL für Auto-Deploy on Push abrufen + in GitHub-Repo-Webhook-Settings eintragen (Repo-Owner-Action; optional manuelle Deploy-Trigger für Phase 1)
  - [ ] Initial-Deploy auslösen

- [ ] **Task 5: Let's-Encrypt + Traefik-TLS (AC: #7)**
  - [ ] Traefik-Config-Default in Coolify nutzen (kein eigener traefik.yml-Override für Phase 1)
  - [ ] Coolify-UI Domain-Setting auf `navigator.berlin` setzen → TLS-Cert via HTTP-01 wird auto-bezogen
  - [ ] Verify Cert via `curl -vI https://navigator.berlin 2>&1 | grep -i 'TLSv1\.3\|issuer'`

- [ ] **Task 6: /healthz erweitern + Postgres-Probe (AC: #8)**
  - [ ] `src/routes/api/healthz/+server.ts` editieren (Code-Snippet aus AC-8)
  - [ ] Vitest-Test `src/routes/api/healthz/+server.test.ts` neu (server-project, Node-Env)
  - [ ] Test: mocked `db.execute` resolves → 200 JSON; throws → 503 JSON
  - [ ] `pnpm test:unit` grün

- [ ] **Task 7: robots.txt Phase 1 + noindex-Meta (AC: #9)**
  - [ ] `static/robots.txt` editieren: `Disallow: /` für Phase 1
  - [ ] `src/app.html` ODER `src/routes/+layout.svelte`: bedingter `<meta robots noindex>` für `NAVIGATOR_PHASE in (coming-soon, beta)` (Recommendation Open-Q1: bedingt via Server-Layout + Env-Read; falls Story 2.11 noch nicht done, hardcoded für Phase 1)
  - [ ] Falls 2.11 NOT done: temporäres `+page.svelte` Coming-Soon-Skelett-Minimal (Brand-Footprint + Plex-Serif h1 + Subline)

- [ ] **Task 8: Backup-Routine + Off-Server-Sync (AC: #6)**
  - [ ] Coolify-Built-in Daily-Backup für `app-data`-Volume aktivieren (7d Retention)
  - [ ] `infra/backup/pg-backup.sh` schreiben: `pg_dump -Fc` nightly 03:00 UTC
  - [ ] `infra/backup/sync-off-server.sh` schreiben: `rsync` über SFTP zu Hetzner-Storage-Box 04:00 UTC
  - [ ] Cron-Job auf Server installieren (oder Coolify-Scheduled-Task)
  - [ ] Hetzner-Storage-Box provisioniert (1TB EUR 3,50/Monat, Recommendation Open-Q3)
  - [ ] SSH-Key-Auth-Setup zwischen Server und Storage-Box
  - [ ] Weekly-Verify-Cron: `pg_restore --list` auf jüngstem Backup-File

- [ ] **Task 9: Initial-Deploy + AC-11 Smoke-Verifikation (AC: #9, #11)**
  - [ ] Phase-1-State verifizieren: `NAVIGATOR_PHASE=coming-soon`, robots.txt Disallow, noindex-Meta
  - [ ] AC-11-Checklist alle 8 Checks durchgehen
  - [ ] Ergebnisse in `server-bootstrap.md` „Post-Deploy-Checklist"-Section festhalten

- [ ] **Task 10: Phase-Transition-Runbook (AC: #10)**
  - [ ] `docs/runbooks/phase-transition.md` schreiben
  - [ ] Phase 1→2 + Phase 2→3 + Rollback-Pfad mit konkreten Befehlen
  - [ ] In `docs/runbooks/`-Index aufnehmen (falls Index existiert)

- [ ] **Task 11: Production-Postgres-Seed (AC: #13)**
  - [ ] SSH-Tunnel `ssh -L 5433:postgres:5432 admin@<server>` öffnen (oder via Coolify-Compose-Internal exec)
  - [ ] Lokal: `DATABASE_URL=postgres://app:***@127.0.0.1:5433/navigator pnpm db:migrate`
  - [ ] Lokal: `pnpm data:aggregate` (~30 sec) → Aggregate in Production-Postgres
  - [ ] Verify: `psql ... -c "SELECT count(*) FROM bezirk_stats;"` → 12, `kiez_stats` → 143
  - [ ] In `server-bootstrap.md` dokumentieren

- [ ] **Task 12: Documentation-Wrap-Up (AC: #12)**
  - [ ] `docs/runbooks/server-bootstrap.md` finalisieren (alle 11 vorhergehenden Tasks dokumentiert)
  - [ ] `README.md` Production-Hosting-Section (kurz, ~10 Zeilen, Link auf bootstrap.md)
  - [ ] `.env.example` ergänzen: `NAVIGATOR_PHASE=coming-soon`, `ORIGIN=https://navigator.berlin` mit Kommentaren

- [ ] **Task 13: Commit-Strategie**
  - [ ] Commits getrennt in logische Häppchen:
    1. `feat(infra): docker-compose + healthz-postgres-probe + robots-phase1 (story 4.1 a)`
    2. `feat(infra): backup-scripts + phase-transition-runbook (story 4.1 b)`
    3. `docs(infra): server-bootstrap + domain-renewal runbooks (story 4.1 c)`
  - [ ] Alle Commits ohne em-dashes (CLAUDE.md output-konvention)

## Dev Notes

### Aktueller Stack-Stand (vor Story 4.1)

- **App-Code:** SvelteKit + Node-Adapter (`svelte.config.js`), bereits production-build-fähig (`pnpm build` produziert `build/`-Dir)
- **Postgres-Foundation:** Story 2.0 in `review` — Drizzle-Schema, `pnpm db:migrate`, `pnpm data:aggregate`, `scripts/aggregate-data.ts` existieren
- **`/healthz`:** existiert (`src/routes/api/healthz/+server.ts`), aktuell trivialer `"ok"`-Response — wird in 4.1-AC-8 erweitert
- **`robots.txt`:** aktuell `User-agent: *\nDisallow:` (allow all) — wird in 4.1-AC-9 auf `Disallow: /` umgestellt
- **`.env.example`:** enthält `NOMINATIM_ENDPOINT` + `DATABASE_URL` (lokale Postgres) — wird in 4.1-AC-12 erweitert
- **Kein `docker-compose.yml`, kein `Dockerfile`:** komplett neu in 4.1
- **Kein Production-Server:** Hetzner-Account existiert (Maintainer-User-Owned), Server-Provisioning erfolgt in 4.1-Task-1
- **`NAVIGATOR_PHASE`-Env:** Story 2.11 (status `ready-for-dev`) implementiert `src/lib/config/phase.ts` + `assertPhaseAllows()`-Helper + `home-coming-soon.svelte`. Falls 2.11 zum 4.1-Implementations-Zeitpunkt NICHT done: 4.1 implementiert temporäre Minimal-Variante (siehe AC-9 + Task 7)

### Architektur-Constraints

**MUST-Rule-Mapping (`architecture.md` Zeilen 1050–1073):**

- **Rule #10 (Cookieless):** Production-MUSS-Gate. Story 4.1 implementiert keine eigene Cookie-Logic. CI-Cookie-Gate (Story 4.3) verifiziert Set-Cookie-Header-Absence. Falls Story 3.1 (Paraglide-Reduce auf DE-only mit `["baseLocale"]`-Strategy) NICHT done ist, kann `PARAGLIDE_LOCALE`-Cookie gesetzt sein — Coordination-Hand-off zu 3.1 dokumentieren.
- **Rule #11 (Kein US-Drittanbieter):** Production-Pfad. CI-Gate in Story 4.3. Story 4.1 verwendet KEIN Cloudflare, KEIN AWS, KEIN GCP. Hetzner-Falkenstein + Hetzner-Storage-Box (Backup) sind EU-FOSS-konform. CAX21-Aux-Server (168.119.98.228, Hetzner-Falkenstein/Nürnberg, Memory `project_cax21_aux_server`) ebenfalls EU-FOSS-konform.

**NFR-Mapping:**

- **NFR-R1 (99% Uptime):** Single-Instance-Hetzner ist Auslegungs-Standard (PRD Zeile 802).
- **NFR-R2 (Auto-Restart <60s):** Coolify-Default, verifizieren in AC-2.
- **NFR-R4 (Daily-Backup 7d):** AC-6 implementiert.
- **NFR-R5 (Domain-Renewal-Sicherung):** AC-5 implementiert.
- **NFR-S6 (Hetzner-L3/4-DDoS):** AC-1 verifiziert (Default-On).
- **NFR-S8 (SSH-Key-only, kein Root):** AC-1 implementiert.
- **NFR-PR4 (IP-Pseudonymisierung 7d Logs):** Story 4.2-Scope, NICHT 4.1. Hier nur Coolify-Default-Logs aktiv.

**Memory-Bezug:**

- **`project_server_purchase_sequencing`:** Kauf-Trigger = Epic 2 Story 2.0 (review). 3-Phasen-Deployment Coming-Soon → Beta → Hard. Story 4.1 implementiert Phase 1.
- **`project_i18n_phase_1_de_only`:** Coming-Soon-Skelett ist DE-only. Keine `/en/...`-Variante in Phase 1.
- **`feedback_no_em_dashes`:** Coming-Soon-Skelett-Texte ohne em-dash. „Berliner Daten-Atlas · Coming Soon · von Matze Schmidbauer" mit Mittelpunkt `·`.

### Coolify-Postgres-Service-Type vs Compose-Service — Decision

Coolify bietet zwei Wege für Postgres:

1. **Coolify-Postgres-Service-Type (1-Klick):** Coolify-UI „Resources → Database → Postgres 17" anlegen, Auto-Backup, Auto-Restart, Connection-String generated. Internal-Network automatisch. **Vorteil:** weniger Ops, weniger YAML.
2. **Compose-Service (eigene `docker-compose.yml`-Entry):** mehr Control über Volume-Pfade, Backup-Scripts, pg_hba.conf-Override. **Vorteil:** explicit, versioniert im Repo.

**Recommendation:** Compose-Service. Reason: Postgres-Service-Definition versionierter im Repo, ADR-013-Stack-Showcase explizit, Backup-Scripts in `infra/backup/` co-located. Coolify-Postgres-Service-Type ist 1-Klick aber Versionskontrolle fehlt.

**Risiko:** Coolify-Built-in Daily-Backup funktioniert für Coolify-managed-Services besser als für eigene Compose-Volumes. Workaround: `infra/backup/pg-backup.sh` als Cron-Job (siehe AC-6 Task 8).

### Off-Server-Storage — Decision

Hetzner-Storage-Box (1TB für EUR 3,50/Monat, https://www.hetzner.com/storage/storage-box) ist EU-Hosted (Frankfurt/Nuremberg), SFTP/SSHFS/rsync/SCP-Zugriff, kein US-Anbieter. Recommendation für Off-Server-Replikation.

**Alternativen:**

- Hetzner-Cloud-Volume in zweiter Region (eu-central-2 Helsinki): teurer, gleicher Cloud-Anbieter (kein echtes Off-Server)
- Strato HiDrive: EU-Anbieter, aber teurer und weniger flexibel
- Eigene zweite Hetzner-Instance: overkill für Phase 1

**Recommendation:** Hetzner-Storage-Box BX10 (1TB, EUR 3,50/Mon).

### Test-Strategie (ADR-012)

Story 4.1 ist **überwiegend Infra-YAML + Setup-Task**. ADR-012 Exceptions umfassen Infra-YAML (Coolify, Docker, GH-Actions-Workflows) und Migrationen. **Smoke-Level-Tests:**

- **Vitest:** `src/routes/api/healthz/+server.test.ts` (1 File, 2 Cases: DB-Up → 200, DB-Down → 503)
- **Manuelle Smoke-Checklist:** AC-11 (8 curl/nmap-Checks gegen Production-Domain)
- **Backup-Verifikation:** weekly `pg_restore --list` Cron (kein Vitest, Ops-Tooling)

Coverage-Ziel: Smoke-Level reicht (NFR-M-Gate-Mapping).

### Previous Story Intelligence

**Story 3.1 (Paraglide-Reduce, ready-for-dev parallel):** Coordination-Punkt — falls 3.1 NICHT done bei 4.1-Deploy, könnte `PARAGLIDE_LOCALE`-Cookie gesetzt werden in Production (verletzt MUST-Rule #10). 4.1-AC-11-Smoke-Check curl deckt das auf. Empfehlung: Dev-Sequenz 3.1 vor 4.1-Deploy (oder mindestens vor 4.2 CI-Cookie-Gate).

**Story 2.0 (Postgres-Foundation, review):** Source of `db:migrate`, `data:aggregate`, Drizzle-Schema. 4.1 konsumiert direkt. Falls 2.0 nicht done bis 4.1-Implementation: AC-13 verschieben auf Phase-1.5 oder bis 2.0 review→done.

**Story 2.11 (Static-Hero-Landing, ready-for-dev):** Implementiert `src/lib/config/phase.ts` + Coming-Soon-Komponente. 4.1 koordiniert über `NAVIGATOR_PHASE`-Env. Falls 2.11 NICHT done: 4.1-Task-7 implementiert temporäre Minimal-Variante (siehe AC-9).

**Pattern-Konsistenz mit Story 1.31 / 2.0 / 3.1:** AC-Format Given/When/Then, Tasks mit AC-Refs, Memory-Marker explizit, Open-Questions am Ende.

### File-List nach Story-Completion (erwartet)

**Modified:**

- `static/robots.txt` (Phase 1 Disallow: /)
- `src/routes/api/healthz/+server.ts` (Postgres-Probe via Drizzle `SELECT 1`)
- `src/app.html` ODER `src/routes/+layout.svelte` (bedingte noindex-Meta für Phase 1/2)
- `.env.example` (`NAVIGATOR_PHASE`, `ORIGIN`)
- `README.md` (Production-Hosting-Section)

**New:**

- `docker-compose.yml` (Repo-Root, App + Postgres + Traefik via Coolify-Default)
- `Dockerfile` (App-Container — falls Coolify Nixpacks nicht reicht; ggf. optional)
- `infra/backup/pg-backup.sh` (Cron-Script Nightly pg_dump)
- `infra/backup/sync-off-server.sh` (Cron-Script Rsync zu Storage-Box)
- `infra/backup/verify-backup.sh` (Weekly `pg_restore --list`-Smoke)
- `src/routes/api/healthz/+server.test.ts` (Vitest server-test, 2 Cases)
- `docs/runbooks/server-bootstrap.md` (komplette Setup-Anleitung)
- `docs/runbooks/domain-renewal.md` (Domain-Renewal-Routine)
- `docs/runbooks/phase-transition.md` (Phase 1→2→3 mit Rollback)

**Temporär in 4.1 implementiert, wird in Story 2.11-Dev ersetzt (falls 2.11 nach 4.1 implementiert wird):**

- `src/routes/+page.svelte` Minimal-Coming-Soon (Brand-Footprint + Plex-Serif h1)

### Project Structure Notes

Architecture-Doku (`architecture.md` Zeilen 482, 1207–1209) referenziert `coolify.json` als Config-File und `docker-compose.yml` in Repo-Root. **Decision (für diese Story):** `docker-compose.yml` in Repo-Root anlegen (konsistent mit Architecture-Doku). `coolify.json` ist Coolify-internes Setup-File und wird ggf. nicht im Repo committed (Recommendation Open-Q2 — Coolify nutzt UI-State + Webhook-Trigger, `coolify.json` ist nicht offiziell-supported als Repo-File).

**Path-Alignment:** `infra/backup/`-Folder neu. Architecture-Doku hat keinen expliziten `infra/`-Path, aber Source-Tree (Zeile 1207) zeigt `docker-compose.yml` als Root-Top-Level — `infra/` als Subordnung passt zur Organisation.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.1` Zeilen 1864–1914] — Story-Definition
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic 4 Scope` Zeile 460] — Server-Kauf-Trigger nach 2.0, ADR-013/014/015 in 4.4
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 482–488] — Hosting-Stack (Hetzner, Coolify, Traefik), CX32-Referenz veraltet
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 322–331] — Security-Stack, ISO-27001-Patterns
- [Source: `_bmad-output/planning-artifacts/prd.md` NFR-S1 bis NFR-S8 + NFR-R1 bis NFR-R6 + NFR-PR1 bis NFR-PR4] — Sicherheits/Reliability-NFRs
- [Source: `docs/adr/ADR-004-cookieless.md`] — Cookieless-Architektur, MUST-Rule #10
- [Source: `docs/adr/ADR-012-tdd-mandate.md`] — Pragmatic-TDD, Infra-YAML-Exception
- [Source: `docs/runbooks/local-postgres-setup.md`] — Lokaler Dev-Postgres-Setup (Parallele Production-Doku)
- [Source: `src/routes/api/healthz/+server.ts`] — Bestehender Healthz-Stub (Story 1.1)
- [Source: `static/robots.txt`] — Aktueller robots-State (allow all → Disallow Phase 1)
- [Source: `svelte.config.js`] — Adapter-Node (Production-Build-Output)
- [Source: `.env.example`] — Aktuelle Env-Vars-Doku
- [Source: Memory `project_server_purchase_sequencing`] — 3-Phasen-Deployment + CPX22-Sequencing
- [Source: Memory `project_i18n_phase_1_de_only`] — Phase-1 DE-only
- [Source: Memory `feedback_no_em_dashes`] — Output-Konvention
- [Source: Coolify-Docs https://coolify.io/docs/installation]
- [Source: Hetzner-Storage-Box https://www.hetzner.com/storage/storage-box]
- [Source: Postgres-Docker-Image https://hub.docker.com/_/postgres]

## Open Questions / Pre-Dev-Clarifications

1. **noindex-Meta-Pfad: `src/app.html` (statisch) oder `src/routes/+layout.svelte` (env-bedingt)?** `app.html` ist einfacher (1 Edit, hardcoded), `+layout.svelte` ist phase-driven (passt zu 2.11). Recommendation: **+layout.svelte bedingt**, falls 2.11 done. Fallback: `app.html` hardcoded für Phase 1, später entfernt.

2. **`coolify.json` im Repo committen oder nicht?** Coolify-UI-State ist nicht offiziell als Repo-File supported. Recommendation: **nicht committen**, stattdessen Setup-Steps in `server-bootstrap.md` dokumentieren. Architecture-Doku-Referenz auf `coolify.json` (Zeile 1209) ist Aspiration, nicht aktuelle Realität.

3. **Off-Server-Storage: Hetzner-Storage-Box BX10 (1TB, EUR 3,50/Mon) oder kleinere Variante?** BX10 hat ausreichend Headroom für 14d Postgres-Backups + 7d App-Volume-Backups. Recommendation: **BX10**, auch wenn 50GB initial reichen — Headroom für Phase 3 Wahldaten-Layer (Epic 6).

4. **Coolify-Built-in Daily-Backup oder eigenes restic/borg?** Built-in ist 1-Klick, restic/borg ist mehr Control + Verschlüsselung. Recommendation: **Built-in für 4.1**, restic/borg-Migration als Phase-3-Story bei Bedarf. GPG-Verschlüsselung des pg_dump-Output kommt mit 4.2 AC.

5. **Domain `navigator.berlin` Registrar-Status?** Story setzt voraus dass Domain bereits registriert ist. Falls nicht: Task-3 erweitert sich um Registrierung (typ. INWX/Hetzner-DNS/Strato). Recommendation: **Hetzner-DNS-Console** für Konsistenz (Hetzner-Ökosystem + EU-Anbieter). Falls Domain bei externem Registrar (z.B. INWX): keine Transfer-Action nötig, nur DNS-Records bei aktuellem Registrar setzen.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
