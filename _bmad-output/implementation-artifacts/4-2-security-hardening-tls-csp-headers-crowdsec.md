# Story 4.2: Security-Hardening (TLS, CSP, Headers, CrowdSec, Postgres-Network, Backup-GPG)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Bürger und Maintainer,
I want eine ISO-27001-konform gehärtete Site mit TLS 1.3 / A+-Rating, Strict-CSP ohne `unsafe-inline`, vollständigem HTTP-Security-Header-Set (HSTS-Preload, X-Frame-DENY, Referrer-Policy, Permissions-Policy), CrowdSec-Layer-7-Schutz im Streaming-Mode mit Captcha-Remediation, IP-pseudonymisierten Traefik-Access-Logs (7d Rotation), netzwerk-isolierter Postgres mit `scram-sha-256`-Auth ohne Public-Port, und GPG-verschlüsselten pg_dump-Backups vor Off-Server-Replikation,
so that Verbindungen verschlüsselt sind, Angriffsvektoren defensiv abgewehrt werden, Logs keine personenbezogenen Daten enthalten (NFR-PR4 / DSGVO), und ein Storage-Box-Compromise keine Backup-Klartextdaten leakt.

## Phase-Kontext + Sequencing

**Hand-off von Story 4.1:** Hetzner CPX22 + Coolify + Traefik + Postgres + Let's-Encrypt-Minimal sind aktiv (Phase 1 Coming-Soon Production-Skelett). Story 4.2 hardent diese Foundation auf Production-Niveau, bevor Phase-2-Soft-Beta (Atlas auf `/explore` öffentlich) startet.

**Sequence-Empfehlung:** Story 3.1 (Paraglide-Reduce auf DE-only mit `["baseLocale"]`-Strategy) MUSS vor 4.2-CI-Cookie-Gate done sein, sonst `PARAGLIDE_LOCALE`-Cookie leakt durch und verletzt MUST-Rule #10 + NFR-PR1. Story 4.3-CI-Gate für `Set-Cookie`-Header wird in 4.3 implementiert, 4.2 verifiziert via Smoke-Test in AC-9 nur Production-State.

**Memory-Marker:** `feedback_no_em_dashes` (Header-Strings), keine Live-Daten-Implikation (`feedback_no_live_data` weiterhin gültig — CSP-Whitelist hat keine Live-Endpoint-Hosts).

## Acceptance Criteria

**AC-1 (TLS 1.3 forced + A+ Rating — NFR-S1):**

**Given** Traefik in Coolify-Compose aus Story 4.1
**When** ich Traefik-Static-Config (`traefik.yml` oder Coolify-Traefik-Override) editiere und TLS-Options definiere:
```yaml
tls:
  options:
    default:
      minVersion: VersionTLS12  # TLS 1.2 als Fallback
      preferredVersion: VersionTLS13  # TLS 1.3 Default
      cipherSuites:
        - TLS_AES_256_GCM_SHA384
        - TLS_AES_128_GCM_SHA256
        - TLS_CHACHA20_POLY1305_SHA256
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      curvePreferences:
        - X25519
        - CurveP384
      sniStrict: true
```
**Then** SSL Labs Test (https://www.ssllabs.com/ssltest/analyze.html?d=navigator.berlin) zeigt **A+ Rating** (NFR-S1)
**And** Mozilla Observatory (https://observatory.mozilla.org/analyze/navigator.berlin) zeigt mindestens **B+** (Default-Modus)
**And** Alle pre-TLS-1.2-Protokolle (TLS 1.1, TLS 1.0, SSLv3) deaktiviert
**And** Test-Ergebnis als Screenshot/Markdown in `docs/runbooks/security-audit-baseline.md` (neu) dokumentiert

**AC-2 (Let's Encrypt Auto-Renewal — NFR-S2):**

**Given** Traefik mit Let's-Encrypt-Resolver aus Story 4.1 (HTTP-01)
**When** ich Auto-Renewal-Verhalten verifiziere und prüfe ob Renewal-Threshold auf 30 Tage vor Expiry konfiguriert ist (Traefik-Default)
**Then** Zertifikat-Ablauf-Lücke <24h garantiert (NFR-S2)
**And** Renewal-Log in Coolify-Traefik-Container sichtbar
**And** Test: `curl --connect-timeout 10 -vI https://navigator.berlin 2>&1 | grep -E '(expire date|TLSv1\.3)'` zeigt validen Cert mit >30 Tagen Restlaufzeit
**And** Aspirations-Note: DNS-01-Challenge (epic.md Zeile 1928) wird **NICHT** in 4.2 umgesetzt — HTTP-01 reicht für Phase 1 ohne Wildcard-Cert. DNS-01-Migration als Phase-3-Story bei Bedarf (Open-Q4)

**AC-3 (Strict-CSP via SvelteKit-native `kit.csp` + Connect-Src-Allowlist — NFR-S3):**

**Given** SvelteKit `kit.csp`-Konfiguration in `svelte.config.js`
**When** ich CSP via SvelteKit-native Hash-Based-Mode konfiguriere:
```js
// svelte.config.js
kit: {
  csp: {
    mode: 'hash',
    directives: {
      'default-src': ['self'],
      'script-src': ['self', 'wasm-unsafe-eval'],  // wasm-unsafe-eval für PMTiles + MapLibre-WASM
      'style-src': ['self'],
      'font-src': ['self'],
      'img-src': ['self', 'data:'],  // data: für inline SVG-Icons (Lucide)
      'connect-src': [
        'self',
        'https://tiles.openfreemap.org'  // MapLibre Vector-Tiles + Glyphs
      ],
      'worker-src': ['self'],
      'frame-ancestors': ['none'],  // doppelt-Sicherung zu X-Frame-DENY
      'base-uri': ['self'],
      'form-action': ['self'],
      'object-src': ['none'],
      'upgrade-insecure-requests': true
    }
  }
}
```
**Then** SvelteKit injiziert CSP via `<meta http-equiv>` ODER Response-Header (mode `hash` nutzt Hash-basierte Allowlist für SvelteKit-Hydration-Inline-Scripts)
**And** CSP-Header in Browser-DevTools sichtbar als `Content-Security-Policy: ...`
**And** **Keine `unsafe-inline` für Script oder Style** — SvelteKit-Hash-Mode generiert SHA-256-Hashes für jeden Inline-Block
**And** Mozilla Observatory CSP-Test grün
**And** Build-Time-Fetch-URLs (FIS-Broker, ODIS, Overpass, DWD-CDC) sind NICHT in `connect-src` enumeriert — diese laufen in `scripts/`-Build-Step, NICHT Browser-Runtime

**AC-4 (HTTP-Security-Header via Traefik-Middleware — NFR-S4):**

**Given** Traefik-Dynamic-Config in Coolify-Compose
**When** ich eine `secure-headers`-Middleware definiere und auf den App-Router anwende:
```yaml
http:
  middlewares:
    secure-headers:
      headers:
        stsSeconds: 63072000  # 2 Jahre
        stsIncludeSubdomains: true
        stsPreload: true
        contentTypeNosniff: true
        forceSTSHeader: true
        frameDeny: true  # X-Frame-Options: DENY
        referrerPolicy: strict-origin-when-cross-origin
        permissionsPolicy: "geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        # contentSecurityPolicy NICHT hier setzen — SvelteKit kit.csp handlet CSP (Single-Source-of-Truth)
  routers:
    app:
      middlewares:
        - secure-headers
```
**Then** Response-Header gesetzt:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`
**And** HSTS-Preload-Submission bei https://hstspreload.org/ vorbereitet (NICHT Phase-1-AC-Pflicht — Hard-Launch-Trigger in Story 5.3, hier nur HSTS-Header korrekt gesetzt)
**And** Test via `curl -I https://navigator.berlin` zeigt alle 5 Header

**AC-5 (CrowdSec-Plugin in Traefik — NFR-S5):**

**Given** Traefik in Coolify-Compose aus Story 4.1
**When** ich CrowdSec-Bouncer als Traefik-Plugin installiere (`crowdsecurity/crowdsec-bouncer-traefik-plugin`) und folgende Collections aktiviere:
  - `crowdsecurity/traefik`
  - `crowdsecurity/http-cve`
  - `crowdsecurity/whitelist-good-actors`
  - `crowdsecurity/base-http-scenarios`
  - `crowdsecurity/sshd`
  - `crowdsecurity/linux`
**Then** CrowdSec-LAPI (Local API) läuft als eigener Coolify-Compose-Service auf Internal-Network
**And** Traefik-Plugin verbindet sich im **Streaming-Mode mit 60s Decision-Sync** zur LAPI (NFR-S5)
**And** Default-Remediation = **Captcha** statt Hard-Ban (User-freundlich, False-Positive-tolerant)
**And** AppSec/WAF-Funktion (Plugin 1.2.0+) **installiert aber deaktiviert** — Aktivierungs-Schalter in `traefik.yml`-Konfig dokumentiert für Phase-2-Reaktivierung bei Bedarf
**And** CrowdSec-Cscli-CLI auf Server verfügbar für Manual-Ops (`docker exec crowdsec cscli decisions list`)
**And** Test: simulierter HTTP-CVE-Probe-Request (z.B. `curl https://navigator.berlin/.env`) wird in CrowdSec-Decisions-Log eingetragen (NICHT als unmittelbarer Ban, da Whitelist-Good-Actors für SSL-Labs/Mozilla-Observatory greift)
**And** Runbook `docs/runbooks/crowdsec-whitelist.md` (False-Positive-Recovery) wird in Story 4.4 ergänzt — hier nur Verweis als Hand-off

**AC-6 (Hetzner-L3/4-DDoS-Schutz verifiziert — NFR-S6):**

**Given** Hetzner-Cloud-Instance aus Story 4.1
**When** ich Hetzner-Cloud-UI „Volume-Schutz / DDoS"-Status prüfe
**Then** Layer-3/4-DDoS-Schutz aktiv (Default-Setting, kostenlos)
**And** Status-Screenshot in `docs/runbooks/security-audit-baseline.md` festgehalten

**AC-7 (Traefik-Access-Logs IP-Pseudonymisierung + 7d Rotation — NFR-PR4):**

**Given** Traefik-Default-Access-Logs in Coolify-Compose
**When** ich Traefik-Config erweitere um IP-Pseudonymisierung (letztes Oktett gekürzt) und Log-Rotation:
```yaml
accessLog:
  filePath: /var/log/traefik/access.log
  format: json
  filters:
    statusCodes:
      - "200"
      - "300-302"
      - "400-499"
      - "500-599"
  fields:
    headers:
      defaultMode: drop  # alle Header standardmäßig droppen
      names:
        User-Agent: keep  # nur User-Agent behalten (Phase-1-Debug)
log:
  level: WARN
```
**Then** Access-Log enthält keine Vollständige-IP — Workaround: Coolify-Compose-Init-Script post-processet Logs mit `sed`-Pipeline die letztes IP-Oktett auf `0` setzt (`s/\.[0-9]{1,3} /\.0 /`), bevor Logs persistiert werden (Traefik selbst hat kein eingebautes IP-Pseudonymisierungs-Feature — siehe Open-Q1)
**And** Logrotate-Cron auf Server: `/etc/logrotate.d/traefik` mit `rotate 7`, `daily`, `compress`, `missingok`, `notifempty`
**And** Logrotate-Setup committed via `infra/logrotate/traefik` und Coolify-Cron registriert
**And** Test: nach 1 Request `cat /var/log/traefik/access.log | tail -1` zeigt `"ClientHost":"a.b.c.0"` (letztes Oktett 0)
**And** Logs werden nach 7 Tagen automatisch gelöscht (kein manuelles Cleanup)

**AC-8 (Postgres-Network-Hardening + scram-sha-256 + Least-Privilege):**

**Given** der Postgres-17-Service aus Story 4.1 (Coolify-Compose, `postgres:17-alpine` Image)
**When** ich Postgres-Network-Hardening verifiziere und nachschärfe
**Then** Compose-Service `postgres`:
  - **KEIN `ports:`-Mapping** (kein `5432:5432` auf Host) — Internal-Docker-Network only
  - **`environment` POSTGRES_HOST_AUTH_METHOD=scram-sha-256** explizit gesetzt (Default ab Postgres 14+ ist `scram-sha-256`, aber explizit für Audit-Trail)
  - **`pg_hba.conf`-Override** via Volume-Mount oder Init-Script: alle `trust`-Einträge entfernt, nur `host all all 0.0.0.0/0 scram-sha-256` für Internal-Network. Localhost via `host all all 127.0.0.1/32 scram-sha-256` (kein `local trust`)
  - **App-User `app`** hat KEIN SUPERUSER-Privileg (`CREATE USER app WITH PASSWORD ... NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`)
  - **Postgres-Owner-Role** ist separat (`navigator_owner` SUPERUSER-Role für Migrationen), App-User hat nur `CONNECT` + `USAGE` auf Schema + `SELECT/INSERT/UPDATE/DELETE` auf Tabellen (GRANT-Liste in `scripts/db/init-grants.sql` neu)
**And** Verifikation per `psql ... -c "SELECT rolname, rolsuper, rolcanlogin FROM pg_roles WHERE rolname IN ('app','navigator_owner');"` zeigt:
  ```
  rolname           | rolsuper | rolcanlogin
  ------------------+----------+-------------
  app               | f        | t
  navigator_owner   | t        | t
  ```
**And** External-Network-Scan: `nmap -p 5432 navigator.berlin` zeigt `filtered` oder `closed` (kein `open`)
**And** Drizzle-Migrationen laufen via `navigator_owner`-Role (separate DATABASE_URL in CI/Migration-Step), App-Runtime nutzt `app`-Role
**And** Migration-Connection-String dokumentiert in `.env.example` als optionaler `DATABASE_URL_MIGRATIONS` (Phase-1: kann gleich `DATABASE_URL` bleiben, Phase-2-Cleanup)

**AC-9 (pg_dump-GPG-Symmetric-Encryption vor Off-Server-Replikation):**

**Given** der `infra/backup/pg-backup.sh`-Cron aus Story 4.1 (nightly pg_dump 03:00 UTC) + `infra/backup/sync-off-server.sh` (rsync 04:00 UTC)
**When** ich `pg-backup.sh` erweitere um GPG-Symmetric-Verschlüsselung:
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/backups"
DATE=$(date -u +%Y%m%d)
PLAIN_FILE="${BACKUP_DIR}/pg-${DATE}.dump"
ENCRYPTED_FILE="${PLAIN_FILE}.gpg"

# pg_dump zu Plain-File
pg_dump -U app -d navigator -Fc -f "${PLAIN_FILE}"

# GPG-Symmetric-Encrypt mit Passphrase aus Env (Coolify-Secret BACKUP_GPG_PASSPHRASE)
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase-file <(printf '%s' "${BACKUP_GPG_PASSPHRASE}") \
    --output "${ENCRYPTED_FILE}" "${PLAIN_FILE}"

# Plain-File sofort löschen, nur Encrypted-File auf Disk
shred -u "${PLAIN_FILE}"

# Retention: 14d Encrypted-Files behalten
find "${BACKUP_DIR}" -name 'pg-*.dump.gpg' -mtime +14 -delete
```
**Then** `BACKUP_GPG_PASSPHRASE` ist Coolify-Secret (32-char-random, generated, separat zu POSTGRES_PASSWORD)
**And** Passphrase ist offline (Maintainer-Password-Manager) gespeichert für Disaster-Recovery
**And** Sync-Script `sync-off-server.sh` synchronisiert nur `*.dump.gpg`-Files (kein Plaintext)
**And** Test: `gpg --decrypt /backups/pg-<date>.dump.gpg | pg_restore --list` zeigt Tabellen-Liste (Decrypt + Restore-Stub funktioniert)
**And** Off-Server-Storage-Compromise leakt nur Encrypted-Files — Passphrase verbleibt nur in Coolify-Secret + Password-Manager
**And** Postgres-Restore-Runbook (`docs/runbooks/postgres-restore.md`, Story 4.4) wird erweitert um GPG-Decrypt-Step — hier nur Verweis als Hand-off

**AC-10 (CSP + Header Smoke-Test-Suite):**

**Given** Production-Deploy mit allen Hardening-Steps
**When** ich Manuell-Verifikation post-deploy durchführe:
**Then** alle Checks grün:
  - `curl -I https://navigator.berlin` zeigt alle 6 Security-Header (HSTS, X-CTO, X-Frame, Referrer, Permissions, plus CSP via SvelteKit)
  - `curl -I https://navigator.berlin | grep -i 'content-security-policy'` → Match mit `default-src 'self'`-Direktive
  - Browser-DevTools: keine CSP-Violations in Console beim Laden von Coming-Soon-Page (Phase 1) oder bei späterem `/explore`-Test (Phase 2)
  - SSL Labs A+ + Mozilla Observatory B+ (Screenshots in `security-audit-baseline.md`)
  - SecurityHeaders.com (https://securityheaders.com/?q=navigator.berlin) zeigt **A+ Grade**
  - `nmap -p 5432,8080,3000 navigator.berlin` → alle filtered/closed
  - CrowdSec-Test: simulated CVE-Probe in Decisions-Log nachvollziehbar
  - Backup-Verifikation: `gpg --decrypt <latest>.dump.gpg | head -c 100` zeigt PostgreSQL-Custom-Format-Magic-Bytes (`PGDMP`)
**And** Smoke-Test-Ergebnisse in `docs/runbooks/security-audit-baseline.md` festgehalten als „Production-Baseline 2026-XX-XX"

**AC-11 (Disaster-Recovery-Coordination-Hand-off zu Story 4.4):**

**Given** Story 4.4 erstellt 5 fehlende Runbooks
**When** ich 4.2-Implementation-Outputs für 4.4-Hand-off dokumentiere
**Then** in `docs/runbooks/security-audit-baseline.md` (4.2-Output) sind folgende Cross-Refs vorbereitet:
  - `crowdsec-whitelist.md` (4.4): False-Positive-Recovery-Pfad — 4.2 dokumentiert nur Decision-ID-Lookup-Command `docker exec crowdsec cscli decisions list`
  - `postgres-restore.md` (4.4): muss um GPG-Decrypt-Step erweitert werden (`gpg --decrypt --passphrase-file ... .dump.gpg | pg_restore ...`)
  - `drizzle-migration-rollback.md` (4.4): nicht direkt von 4.2 betroffen, nur Verweis
**And** Hand-off-Liste in 4.4-Story-File-Refs erkennbar (4.4-Dev-Agent muss diese Story-Outputs konsumieren)

## Tasks / Subtasks

- [ ] **Task 1: Traefik-TLS-Options + Cipher-Suites (AC: #1, #2)**
  - [ ] Coolify-Traefik-Config-Override anlegen (`infra/traefik/traefik-dynamic.yml` ODER Coolify-UI-Setting)
  - [ ] TLS-Options-Block einfügen (Code-Snippet AC-1)
  - [ ] Coolify-Re-Deploy
  - [ ] SSL Labs Test ausführen, A+ verifizieren
  - [ ] Mozilla Observatory Test ausführen
  - [ ] Screenshots in `docs/runbooks/security-audit-baseline.md`

- [ ] **Task 2: HTTP-Security-Headers via Traefik-Middleware (AC: #4)**
  - [ ] `infra/traefik/middlewares.yml` mit `secure-headers`-Middleware
  - [ ] App-Router-Definition referenziert `secure-headers`-Middleware
  - [ ] Coolify-Re-Deploy
  - [ ] `curl -I` test alle 5 Header

- [ ] **Task 3: SvelteKit Strict-CSP (AC: #3)**
  - [ ] `svelte.config.js` editieren: `kit.csp`-Block (Code-Snippet AC-3)
  - [ ] `pnpm build` lokal — kein CSP-Hash-Mode-Build-Error
  - [ ] `pnpm dev` lokal — Browser zeigt CSP-Header via DevTools
  - [ ] Smoke-Test: Coming-Soon-Page lädt ohne CSP-Violations
  - [ ] Smoke-Test mit MapLibre-Embed (falls in Phase 1 testbar): `https://tiles.openfreemap.org`-Tile-Fetches grün

- [ ] **Task 4: CrowdSec-Bouncer + LAPI in Coolify-Compose (AC: #5)**
  - [ ] `docker-compose.yml` erweitern um `crowdsec`-Service (Image `crowdsecurity/crowdsec:latest`)
  - [ ] Collections-Liste in `infra/crowdsec/acquis.yaml` (Acquisition-Config) + `infra/crowdsec/collections.yaml`
  - [ ] Traefik-Plugin `crowdsecurity/crowdsec-bouncer-traefik-plugin` aktivieren (in `traefik.yml`-Static-Config)
  - [ ] Default-Remediation = Captcha (Bouncer-Config)
  - [ ] AppSec installiert aber deaktiviert (Switch in Config dokumentiert)
  - [ ] Coolify-Re-Deploy
  - [ ] Smoke: `docker exec crowdsec cscli collections list` zeigt 6 Collections
  - [ ] Smoke: `curl https://navigator.berlin/.env` triggert CrowdSec-Detection (in Decisions-Log)

- [ ] **Task 5: Hetzner-DDoS-Status verifizieren (AC: #6)**
  - [ ] Hetzner-Cloud-UI → Server → Schutz prüfen
  - [ ] Screenshot in `security-audit-baseline.md`

- [ ] **Task 6: Traefik-Access-Log IP-Pseudonymisierung (AC: #7)**
  - [ ] Traefik-Static-Config erweitern (`accessLog`-Block, Code-Snippet AC-7)
  - [ ] Coolify-Cron-Task: post-process Log-File mit `sed`-Pipeline für letztes-Oktett-Truncation (siehe Open-Q1 für besseren Pfad)
  - [ ] `/etc/logrotate.d/traefik` mit 7d-Retention installieren
  - [ ] Smoke-Test: nach 1 Request `tail` zeigt `.0`-IP

- [ ] **Task 7: Postgres-Network-Hardening (AC: #8)**
  - [ ] `docker-compose.yml` `postgres`-Service: KEIN `ports:` (verifizieren AC-1-Output von 4.1)
  - [ ] `POSTGRES_HOST_AUTH_METHOD=scram-sha-256` Env-Var setzen
  - [ ] `pg_hba.conf`-Override via Volume-Mount oder Init-Script
  - [ ] `scripts/db/init-grants.sql` neu: `CREATE ROLE navigator_owner SUPERUSER LOGIN PASSWORD ...`, `CREATE ROLE app NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION LOGIN PASSWORD ...`, GRANT-Pfad für `app` auf Schema/Tables
  - [ ] Coolify-Secret `POSTGRES_OWNER_PASSWORD` neu (separat zu POSTGRES_PASSWORD)
  - [ ] `.env.example` ergänzen: `DATABASE_URL_MIGRATIONS` (für Drizzle-Migrationen via owner-role)
  - [ ] `pnpm db:migrate`-Script ggf. anpassen (Migration-Connection vs Runtime-Connection)
  - [ ] Smoke-Test: `psql ... pg_roles`-Query zeigt korrekte Privileg-Trennung
  - [ ] `nmap -p 5432 navigator.berlin` → filtered/closed

- [ ] **Task 8: pg_dump-GPG-Encryption (AC: #9)**
  - [ ] `infra/backup/pg-backup.sh` erweitern (Code-Snippet AC-9)
  - [ ] Coolify-Secret `BACKUP_GPG_PASSPHRASE` (32-char-random)
  - [ ] Passphrase offline in Password-Manager dokumentieren (NICHT im Repo, NICHT in Runbook im Klartext)
  - [ ] `sync-off-server.sh` editieren: Sync nur `*.dump.gpg`-Files
  - [ ] Smoke-Test: GPG-Decrypt + `pg_restore --list` funktioniert

- [ ] **Task 9: Smoke-Test-Suite + Audit-Baseline (AC: #10, #11)**
  - [ ] `docs/runbooks/security-audit-baseline.md` schreiben
  - [ ] SSL Labs + Mozilla Observatory + SecurityHeaders.com Screenshots
  - [ ] CrowdSec-Decisions-Log-Sample
  - [ ] Backup-Decrypt-Test-Output
  - [ ] Cross-Refs zu 4.4-Hand-off (crowdsec-whitelist.md, postgres-restore.md)

- [ ] **Task 10: Commit-Strategie**
  - [ ] 4 Commits getrennt:
    1. `feat(infra): traefik-tls-options + http-security-headers + crowdsec (story 4.2 a)`
    2. `feat(infra): svelte-kit strict-csp hash-mode (story 4.2 b)`
    3. `feat(infra): postgres-network-hardening + pg_hba scram-sha-256 + role-separation (story 4.2 c)`
    4. `feat(infra): pg_dump gpg-symmetric-encryption + access-log ip-pseudonymisierung (story 4.2 d)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Security-Stand (vor Story 4.2)

- **TLS:** Let's-Encrypt-Default via Story 4.1 (HTTP-01, Traefik-Default-TLS-Options ohne explizite Cipher-Suite-Konfiguration)
- **Security-Header:** keine. Traefik-Default-Headers, kein HSTS, kein X-Frame, kein Permissions-Policy
- **CSP:** keine. SvelteKit-Default-Behavior ohne `kit.csp`-Block
- **CrowdSec:** nicht installiert. Story 4.1 erwähnt Coolify-Compose mit Traefik+CrowdSec-Plugin, aber Plugin nicht aktiviert
- **Postgres-Network:** Story 4.1 implementiert Internal-Network only. `pg_hba.conf`-Override + Role-Separation noch nicht erfolgt
- **pg_dump-Backup:** Story 4.1 implementiert pg_dump nightly + rsync zu Storage-Box, aber Plaintext
- **Access-Logs:** Traefik-Default (Full-IP), keine Pseudonymisierung, keine 7d-Rotation
- **`hooks.server.ts`:** nur Paraglide-Middleware (Story 1.x), keine eigene Header-Injection

### Architektur-Constraints

**MUST-Rule-Mapping (`architecture.md` Zeilen 1050–1073):**

- **Rule #10 (Cookieless):** weiterhin aktiv. Sync mit Story 3.1 (Paraglide-Reduce). Story 4.2 setzt keinen Cookie.
- **Rule #11 (Kein US-Drittanbieter):** CSP `connect-src` Whitelist enthält keine US-Domains. `tiles.openfreemap.org` ist EU-FOSS (Hosted in EU).

**NFR-Mapping:**

- **NFR-S1 (TLS 1.3 A+):** AC-1
- **NFR-S2 (Cert <24h Lücke):** AC-2
- **NFR-S3 (Strict-CSP):** AC-3
- **NFR-S4 (HTTP-Security-Header):** AC-4
- **NFR-S5 (CrowdSec):** AC-5
- **NFR-S6 (Hetzner-DDoS):** AC-6
- **NFR-PR4 (IP-Pseudonymisierung 7d):** AC-7

**ISO 27001 / 9001 Patterns (CLAUDE.md, architecture.md Zeile 331):**

- Access-Control-Trennung: Hetzner-Admin ≠ Coolify-User ≠ Container-User ≠ Postgres-App-User ≠ Postgres-Owner-User (AC-8)
- Least-Privilege: App-Role NOSUPERUSER (AC-8)
- Audit-Logs: Coolify + CrowdSec-Decisions-Log
- Daily-Backup mit 7d Retention: aus 4.1, hier GPG-Encrypted (AC-9)
- Encryption-at-Rest für Backups: GPG-Symmetric AES256 (AC-9)
- Encryption-in-Transit: TLS 1.3 (AC-1)

### CSP-Mode-Decision: SvelteKit-Native `kit.csp` vs Traefik-Header

**Entscheidung:** SvelteKit-Native `kit.csp` mit Mode `hash`.

**Begründung:** SvelteKit injiziert Hydration-Inline-Scripts mit dynamischen Hashes pro Build. Traefik-statisches `contentSecurityPolicy`-Header würde diese Hashes nicht kennen und entweder `unsafe-inline` (verbotene Direktive) oder Hashes-Update-Bedarf bei jedem Build erfordern. SvelteKit-Native `kit.csp` generiert Hashes automatisch im Build-Step.

**Konsequenz:** Traefik-`secure-headers`-Middleware setzt CSP **NICHT**. CSP kommt aus SvelteKit-Adapter-Output. Alle anderen Security-Header (HSTS, X-Frame, etc.) bleiben in Traefik (Single-Source für Non-CSP-Header).

### Postgres-Role-Separation — Risiko-Analyse

Aktueller Stand (Story 4.1): einzelner `app`-User ist Postgres-Eigentümer + Runtime-User. Migrationen via `app`-User. Dies ist Phase-1-Minimum, aber **nicht ISO-27001-Least-Privilege**.

Story 4.2 trennt:

1. **`navigator_owner`** (SUPERUSER, separater Password) — nur für `pnpm db:migrate` (Drizzle-Migrationen)
2. **`app`** (NOSUPERUSER, ursprünglicher User) — Runtime, CRUD auf Tabellen, keine DDL

**Migration-Aufwand:** `pnpm db:migrate`-Script in `scripts/db/migrate.ts` muss `DATABASE_URL_MIGRATIONS` lesen (Fallback: `DATABASE_URL`). Coolify-Deploy-Pipeline ruft Migration-Step mit separatem URL auf.

**Phase-1-Vereinfachung:** falls Migration-Pipeline noch nicht in CI ist (Story 4.3-Scope), reicht für 4.2 dass Role-Separation in `init-grants.sql` exists + manuell anwendbar. Production-Migration läuft initial via SSH+`navigator_owner`-URL.

### Memory-Bezug

- **`feedback_no_em_dashes`:** Header-Wert `Referrer-Policy: strict-origin-when-cross-origin` nutzt Bindestriche (`-`), keine em-dashes — ok.
- **`feedback_no_live_data`:** CSP-Connect-Src enthält keine Live-Endpoints (kein BVG, kein Wetter, keine Luftqualität).
- **`project_server_purchase_sequencing`:** Server existiert (Story 4.1), 4.2 hardent.

### Test-Strategie (ADR-012)

Story 4.2 ist **überwiegend Infra-Config + Smoke-Test**. ADR-012 Exceptions: Infra-YAML.

- **Vitest:** keine neuen App-Code-Files in 4.2. Bestehender `healthz`-Test aus 4.1 bleibt grün.
- **Manuelle Smoke-Tests:** AC-10 (SSL Labs, Mozilla Observatory, SecurityHeaders.com, curl-Header-Checks, nmap, CrowdSec-Decisions, GPG-Decrypt)
- **CSP-Smoke:** Browser-DevTools-Console-Check während Coming-Soon-Page-Load. **Risiko:** SvelteKit-Hash-Mode kann bei MapLibre-Lazy-Load (PMTiles/WASM) brechen. Falls Coming-Soon-Phase kein MapLibre lädt (nur Brand-Footprint-Stub), wird CSP-MapLibre-Compatibility erst in Phase-2-Beta-Smoke verifiziert. Hand-off-Punkt zu Story 2.11 (Atlas auf `/explore`).
- **CrowdSec-Smoke:** `.env`-Probe + Decisions-Log-Check, kein Automated-Test

### Previous Story Intelligence

**Story 4.1 (Hetzner-Production-Setup, ready-for-dev):** Foundation für 4.2. `docker-compose.yml` + Traefik + Postgres + Backup-Cron existieren. 4.2 erweitert diese Files.

**Story 3.1 (Paraglide-Reduce, ready-for-dev):** Cookie-Strategy-Reduce auf `["baseLocale"]`. MUSS vor 4.2-Cookie-Smoke-Test done (Phase-Sequence-Empfehlung).

**Story 2.0 (Postgres-Foundation, review):** Drizzle-Schema + Migrations. 4.2 AC-8 modifiziert `scripts/db/migrate.ts` ggf. um separate `DATABASE_URL_MIGRATIONS` zu lesen.

### File-List nach Story-Completion (erwartet)

**Modified:**

- `svelte.config.js` (kit.csp-Block)
- `docker-compose.yml` (crowdsec-Service + postgres-pg_hba-Override + scram-sha-256)
- `infra/backup/pg-backup.sh` (GPG-Symmetric-Encrypt + shred Plain-File)
- `infra/backup/sync-off-server.sh` (nur *.dump.gpg syncen)
- `.env.example` (DATABASE_URL_MIGRATIONS, BACKUP_GPG_PASSPHRASE)
- `scripts/db/migrate.ts` (optional: lesen von DATABASE_URL_MIGRATIONS)

**New:**

- `infra/traefik/traefik-dynamic.yml` (TLS-Options + Middlewares)
- `infra/traefik/middlewares.yml` (secure-headers, falls separat)
- `infra/crowdsec/acquis.yaml` (CrowdSec Acquisition)
- `infra/crowdsec/collections.yaml` (Collections-Liste)
- `infra/postgres/pg_hba.conf` (Override)
- `infra/postgres/init-grants.sql` (Role-Separation)
- `scripts/db/init-grants.sql` (Wenn co-located mit Drizzle)
- `infra/logrotate/traefik` (7d-Rotation)
- `docs/runbooks/security-audit-baseline.md` (SSL Labs + Mozilla + Backup-Test Screenshots/Outputs)

### Project Structure Notes

`infra/`-Folder strukturiert sich:
```
infra/
├── traefik/
│   ├── traefik-dynamic.yml
│   └── middlewares.yml
├── crowdsec/
│   ├── acquis.yaml
│   └── collections.yaml
├── postgres/
│   ├── pg_hba.conf
│   └── init-grants.sql
├── backup/                       # aus Story 4.1
│   ├── pg-backup.sh             # erweitert in 4.2 (GPG)
│   ├── sync-off-server.sh       # erweitert in 4.2 (nur .gpg)
│   └── verify-backup.sh
└── logrotate/
    └── traefik
```

Konsistent mit Architecture-Doku `infra/`-Aspiration (nicht explizit dokumentiert, aber org-konform).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.2` Zeilen 1915–1960] — Story-Definition
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 322–331] — Security-Stack
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeile 1723] — CSP-Connect-Source-Whitelist konkretisieren (Architectural Action Item, hier umgesetzt)
- [Source: `_bmad-output/planning-artifacts/prd.md` NFR-S1 bis NFR-S6, NFR-PR4] — Sicherheits-NFRs
- [Source: `docs/adr/ADR-004-cookieless.md`] — Cookieless + Set-Cookie-Verbot
- [Source: `docs/adr/ADR-012-tdd-mandate.md`] — Infra-YAML-Exception
- [Source: `CLAUDE.md`] — ISO 27001 / 9001 Patterns
- [Source: `src/hooks.server.ts`] — aktueller Hook-State (nur Paraglide-Middleware)
- [Source: `static/map-style.json`] — tiles.openfreemap.org (CSP-connect-src)
- [Source: SvelteKit-CSP-Docs https://svelte.dev/docs/kit/configuration#csp]
- [Source: Traefik-Headers-Middleware https://doc.traefik.io/traefik/middlewares/http/headers/]
- [Source: CrowdSec-Traefik-Bouncer https://github.com/maxlerebourg/crowdsec-bouncer-traefik-plugin]
- [Source: GPG-Symmetric-Encryption https://gnupg.org/documentation/manuals/gnupg/Symmetric-Encryption.html]
- [Source: Memory `feedback_no_em_dashes`] — Output-Konvention
- [Source: Memory `feedback_no_live_data`] — CSP-Whitelist-Scope
- [Source: Memory `project_server_purchase_sequencing`]
- [Source: Story 4.1 File `4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup.md`] — Foundation

## Open Questions / Pre-Dev-Clarifications

1. **IP-Pseudonymisierung-Pfad: Traefik-Plugin oder Cron-sed-Post-Process?** Traefik selbst hat kein eingebautes IP-Truncation-Feature. Optionen:
   - **A (recommended):** Coolify-Sidecar-Container mit `logrotate` + `sed`-Pipeline auf rotierte Log-Files (Truncation passiert pre-rotation als prerotate-script)
   - **B:** Custom-Traefik-Plugin-Build (Go-Code), overkill für Solo-Project
   - **C:** Caddy als Reverse-Proxy statt Traefik (Caddy hat eingebaute IP-Anonymize-Funktion) — Stack-Wechsel, Epic-Scope-Bleed
   - **Empfehlung:** Option A für 4.2.

2. **CSP-Hash-Mode + MapLibre-WASM-Kompatibilität:** SvelteKit-Hash-Mode für CSP funktioniert für static Inline-Scripts. MapLibre lädt WASM via `wasm-unsafe-eval`. PMTiles ggf. weitere Worker. Phase-1-Coming-Soon-Page lädt keine Map, daher kein direkter Test. **Hand-off-Punkt:** Story 2.11 (Atlas auf `/explore`) muss CSP-Compatibility verifizieren. Falls Brechen: 4.2-Revision oder `worker-src 'self' blob:` ergänzen.

3. **CrowdSec-AppSec/WAF aktivieren oder deaktiviert lassen?** Plugin 1.2.0+ bietet AppSec/WAF. Performance-Cost + False-Positive-Risiko. **Empfehlung:** installiert aber deaktiviert (Schalter-Doku in Runbook). Aktivierung als Phase-3-Story bei Bedarf.

4. **DNS-01 vs HTTP-01 Let's-Encrypt-Challenge:** Epic-Spec sagt DNS-01 (Zeile 1928), 4.1 implementiert HTTP-01. DNS-01 brauchen nur bei Wildcard-Cert oder Internal-Network-Only-Cert. **Empfehlung:** HTTP-01 reicht, DNS-01 als Phase-3-Story falls Wildcard `*.navigator.berlin` nötig (z.B. Staging-Subdomain).

5. **`navigator_owner` vs `app`-Role-Separation in Phase 1 wirklich nötig?** ISO-27001 Least-Privilege empfiehlt es. Solo-Maintainer-Project kann auch Single-User akzeptieren (Audit-Risk niedrig). **Empfehlung:** Role-Separation einführen (AC-8 voll), auch wenn initial Migration-Pipeline manuell läuft. Beratungs-Asset-Showcase verstärkt durch ISO-Konformität.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
