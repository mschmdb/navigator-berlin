# Story 5.4: Post-Launch-Monitoring (EU-FOSS, kostenlos)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer ohne Tracking + ohne Plausible/Matomo + mit ISO-27001/-9001-Disziplin,
I want externes Uptime-Monitoring (healthchecks.io EU-Hosted oder UptimeRobot als Fallback), das den `/healthz`-Endpoint + Root-200-Check alle 5 Minuten pingt, einen Down-Event-Webhook an Coolify und/oder direkten Notifier-Channel (Email, Telegram, Matrix) feuert, ohne Cookies oder personenbezogene Daten zu setzen, plus einen ADR-017-Eintrag der die Monitor-Anbieter-Wahl + Selbst-Hosting-Folgestand dokumentiert,
so that Site-Decay nicht ungemerkt passiert, Reaktions-Latenz auf Stunden statt Tage bleibt, Tracking-Verzicht weiterhin verteidigbar ist (NFR-PR1, NFR-PR4) und die EU-FOSS-Linie konsistent bleibt.

## Probleme heute

1. **Externes Monitoring fehlt komplett.** Coolify hat interne Health-Probes (Story 4.1 AC-8: `/healthz` alle 30s, 3 Failures = Restart), aber wenn Coolify selbst oder der Hetzner-Host down ist, gibt es keinen externen Beobachter. Owner würde Down-Events erst beim nächsten manuellen Site-Besuch bemerken.
2. **Down-Event-Notifier-Pfad ist undokumentiert.** Coolify kann Webhooks senden, aber es gibt keinen versionierten Notifier-Pfad (Email-Adresse, Telegram-Bot, Matrix-Room) der den Owner alarmiert. Aktuell: stiller Restart-Loop bei Container-Crash, kein Alert.
3. **Tracking-freie Resonanz-Indikatoren fehlen.** Plausible/Matomo bewusst verworfen (NFR-PR1: keine Cookies, keine Personenbezogenen-Daten). Nach Launch braucht es trotzdem Indikatoren („sind heute 5 oder 500 Leute auf der Site?"). Hetzner-Bandbreite + Container-CPU im Coolify-Dashboard sind als grobe Anker geeignet, aber Workflow ist undokumentiert.
4. **Monitor-Anbieter-Wahl ist nicht codifiziert.** EU-FOSS-Linie verlangt Begründung warum UptimeRobot (US-Anbieter, Server-zu-Server-Ping, keine User-Daten) akzeptabel ist oder warum healthchecks.io (FOSS, EU-Hosted-Option) vorzuziehen ist. Ohne ADR ist die Wahl revisionsanfällig.
5. **PII-Risiko in Log-Aggregation.** Coolify schreibt Container-Logs, Traefik-Access-Logs enthalten IP-Adressen. Ohne explizite Konfiguration laufen IPs in Klartext-Logs auf den Server, das verletzt NFR-PR4 (keine PII in Logs).
6. **Notifier-Pfad fehlt im Disaster-Recovery-Runbook.** Story 4.4 hat 5 Runbooks angelegt (`data-source-failure.md` u.a.), aber Down-Event-Notifier ist nicht referenziert. Notifier-Konfiguration + Test-Pfad müssen in DR-Runbook landen, damit Recovery-Flow lückenlos ist.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2242-2267.
- Memory `project_i18n_phase_1_de_only.md`: Monitor-Setup ist Tech-Asset, ADR + Runbooks DE-only Phase 1.
- Memory `feedback_no_em_dashes.md`: keine em-dashes in ADR + Runbooks.
- Memory `project_server_purchase_sequencing.md`: Hetzner CPX22 Phase-2-Beta-Setup ab Story 2.0 done. 5.4 sequenziert hinter 4.1 (Hetzner-Live), kann parallel zu 4.2/4.4 laufen.
- Story 4.1 (ready-for-dev): `/healthz`-Endpoint `src/routes/api/healthz/+server.ts` mit Postgres-Probe `{"status":"ok","db":"ok"}`. 5.4 KONSUMIERT diesen Endpoint. 4.1 MUSS vor 5.4-Aktivierung done sein.
- Story 4.2 (ready-for-dev): Security-Hardening TLS + CSP-Headers + CrowdSec. 5.4 verlangt keine CSP-Anpassung (externer Monitor ist Server-zu-Server-Ping, keine Browser-Embed). Cross-Reference auf 4.2-Headers für Konsistenz.
- Story 4.4 (ready-for-dev): ADR-Nachzieher + 5 Disaster-Recovery-Runbooks. 5.4 ERWEITERT Runbook `data-source-failure.md` (oder neuer `monitoring-down-event.md`) um Notifier-Konfiguration. ADR-017 wird in 5.4 angelegt (ADR-013 bis ADR-016 sind belegt: 013-Score-Aggregation, 014/015 aus 4.4-Scope, 016 aus 5.1-Scope).
- Story 5.1 (ready-for-dev): GitHub-Actions-Schedule + Auto-PR. 5.4 kann optional einen GitHub-Action-Cron-Workflow nutzen als Fallback-Pinger wenn UptimeRobot/healthchecks.io ausfällt. Stretch-Scope.
- Story 5.5 (backlog): Backup-Restore-Drill. 5.4-Monitoring soll Backup-Job-Erfolg via `pg_dump`-Cron-Pings melden (healthchecks.io Cron-Monitoring-Pattern). Cross-Reference.
- Story 5.6 (backlog): GDPR-DPIA. 5.4-Monitor-Wahl ist DPIA-relevant (Server-zu-Server-Ping, kein User-Daten-Flow, aber Anbieter-Standort + Auftragsverarbeitungs-Vertrag).
- Bestand Healthz: `src/routes/api/healthz/+server.ts` (Story 1.1 + 4.1-Erweiterung).
- Bestand Contact: `src/lib/utils/contact.ts:1` `FEEDBACK_EMAIL = 'hey@navigator.berlin'`. Down-Event-Alert-Ziel.
- Bestand ADR-Verzeichnis: `docs/adr/`. Letzte belegte ID = ADR-013. ADR-014/015 reserviert für 4.4, ADR-016 für 5.1. **5.4 nutzt ADR-017.**
- Bestand Runbooks: `docs/runbooks/`. Format-Vorbild für `monitoring-down-event.md`.

## Akzeptanz-Kriterien

1. **AC-1 (Monitor-Anbieter-Wahl + ADR-017):**
   **Given** EU-FOSS-Linie + ISO-27001/-9001-Disziplin + NFR-PR1/PR4.
   **When** ich `docs/adr/ADR-017-uptime-monitoring.md` schreibe.
   **Then**:
   - **Frontmatter:** `status: Accepted`, `date: 2026-05-16`, `deciders: solo-maintainer`.
   - **Context:** Solo-Maintainer + Production-Site auf Hetzner CPX22 + NFR-PR1 (cookieless) + NFR-PR4 (kein PII in Logs) + EU-FOSS-Linie. Risiko: Coolify-Restart-Loop + Hetzner-Host-Down ohne externen Beobachter.
   - **Decision:** **Primär healthchecks.io** (Open-Source-FOSS Python/Django, kostenloser Plan 20 Checks, EU-Hosted-Option auf hc-ping.eu oder Self-Hosted-Pfad als Phase-3-Stretch). **Fallback UptimeRobot** (US-Anbieter, kostenlos 50 Monitor-Slots, akzeptabel weil Server-zu-Server-Ping keine User-Daten betrifft; nutzbar wenn healthchecks.io-EU-Variante nicht erreichbar). Entscheidung: healthchecks.io zuerst probieren, UptimeRobot als 5-Minuten-Fallback.
   - **Alternativen verworfen:**
     - Plausible/Matomo: User-Tracking, verletzt NFR-PR1.
     - Self-Hosted Uptime-Kuma: zusätzlicher Service auf CPX22, Single-Point-of-Failure (wenn CPX22 down, ist auch der Monitor down).
     - GitHub-Action-Cron als alleiniger Pinger: nur Best-Effort (GA-Free-Tier-SLA), Alerting-Lücken bei GA-Outages.
   - **Konsequenzen:** keine Cookies, kein PII-Flow, externe Beobachter-Latenz ≤ 5 Min, monatliche Kosten 0 EUR. Wenn Self-Hosted-healthchecks.io ausgerollt wird (Phase 3): Setup-Aufwand + zusätzlicher Container, dafür voller Daten-Souveränitäts-Anspruch.
   - **Cross-Reference:** PRD NFR-PR1, NFR-PR4, NFR-R2 (Healthcheck-Recovery aus 4.1).
   - Test: ADR-Frontmatter-Validation + Section-Existenz-Check.

2. **AC-2 (healthchecks.io Check-Setup):**
   **Given** ADR-017 lockt healthchecks.io als Primär-Provider.
   **When** ich Monitor-Slots konfiguriere (über healthchecks.io-Web-UI oder API).
   **Then**:
   - **Check 1 — Healthz:** GET `https://navigator.berlin/healthz`, erwartet Status 200 + JSON-Body enthält `"status":"ok"` und `"db":"ok"`. Intervall 5 Min, Grace-Period 2 Min (Restart-Toleranz).
   - **Check 2 — Root-200:** GET `https://navigator.berlin/`, erwartet Status 200 (oder 503 in Coming-Soon-Phase, dann Check pausieren). Intervall 5 Min, Grace 2 Min.
   - **Check 3 — Atlas-Tool:** GET `https://navigator.berlin/explore`, erwartet Status 200 (oder 503 in Phase 1). Intervall 5 Min, Grace 2 Min.
   - **Check 4 — Sitemap:** GET `https://navigator.berlin/sitemap.xml`, erwartet Status 200 + Content-Type `application/xml`. Intervall 1h.
   - **Check 5 — RSS-Feed:** GET `https://navigator.berlin/updates/rss.xml`, erwartet Status 200 + Content-Type `application/xml` oder `application/rss+xml`. Intervall 1h.
   - **Check 6 — Backup-Cron** (Stretch, hängt an Story 5.5): pg_dump-Job-Skript pingt `https://hc-ping.com/{uuid}/start` und `https://hc-ping.com/{uuid}/{exit_code}` nach Job-Ende.
   - **Konfiguration als Code:** `infra/monitoring/healthchecks-config.yml` mit YAML-Manifest aller 5-6 Checks (Name, URL, Method, Expected-Status, Expected-Body-Substring, Schedule, Grace-Period). Lockfile für Reproduktion bei Provider-Wechsel.
   - **Manual-Provisioning für MVP:** API-Provisioning ist Stretch, MVP wird über Web-UI manuell konfiguriert und das YAML-Manifest dient als versioned Source-of-Truth + Audit-Trail.

3. **AC-3 (Down-Event-Notifier-Channel):**
   **Given** Down-Event detected wird (Check-Status `down` länger als Grace-Period).
   **When** healthchecks.io / UptimeRobot Webhook feuert.
   **Then**:
   - **Primär-Channel Email:** Webhook → Coolify (oder direkter Provider-Email-Integration) → Email an `hey@navigator.berlin` mit Subject `[ALERT] navigator.berlin Check '<name>' down` + Body mit Check-Name, Down-Since-Timestamp, Hetzner-Region, Restart-Hinweis (Coolify-Container-Restart-Pfad).
   - **Sekundär-Channel Telegram oder Matrix (User-Wahl):** Webhook in Telegram-Bot-Chat oder Matrix-Room. **Default-Decision:** Telegram-Bot, weil Push-Notification-Latenz niedriger als Email. Matrix als FOSS-Alternative für Phase 3.
   - **Notifier-Konfiguration:** `infra/monitoring/notifiers.yml` mit YAML-Manifest (Channel-Type, Endpoint-Token-Reference auf `.env`-Variable, Severity-Schwelle).
   - **Secrets-Management:** Telegram-Bot-Token + healthchecks.io-API-Token als Coolify-Env-Vars, NICHT im Repo. `.env.example` listet Variablen-Namen ohne Werte.
   - **Test (manuell):** healthchecks.io „Pause"-Button auf Check 1 für 7 Min → Down-Alert erwartet → Email + Telegram-Push empfangen → Alert-Latenz dokumentiert in Runbook.

4. **AC-4 (Hetzner-Stats als Resonanz-Indikator):**
   **Given** Tracking-frei + grobe Resonanz-Indikator-Bedarf.
   **When** ich `docs/runbooks/post-launch-resonance-indicators.md` schreibe.
   **Then**:
   - Runbook beschreibt 3 anekdotische Indikator-Pfade:
     1. **Hetzner-Cloud-Console:** Bandbreite-Graph + CPU-Auslastung (5-Min-Resolution, 7-Tag-Window). Owner-Zugang via Hetzner-Web-UI.
     2. **Coolify-Dashboard:** Container-CPU + RAM + Network-IO. Eingebaute Metric-Charts.
     3. **healthchecks.io-Ping-Latenz:** Healthz-Endpoint-Response-Time als sekundärer Performance-Signal (Spikes deuten auf Last-Probleme hin).
   - **Workflow Bilanz-Slot T+30d (Story 5.3):** Owner kopiert Bandbreite-Graph-Screenshot in `docs/launch-resonance.md`-Sektion „Klick-Zahlen falls verfügbar", verbal kommentiert.
   - **KEIN Daten-Export, KEINE Aggregation, KEINE Logs-Parser.** Strikt anekdotisch, weil sonst PII-Risiko (Traefik-Access-Logs enthalten IPs).
   - **NFR-PR4-Lock:** Wenn Owner tiefer einsteigen will (Per-Page-Hits, Geo-Verteilung), MUSS DPIA-Update aus Story 5.6 vorausgehen. 5.4 lockt diesen Pfad explizit als „nicht ohne DPIA-Refresh".

5. **AC-5 (PII-Lock in Logs):**
   **Given** NFR-PR4 (keine PII in Logs).
   **When** ich Traefik + Coolify-Log-Konfiguration prüfe.
   **Then**:
   - **Traefik-Access-Log:** standard-mäßig enthält Client-IP. Konfiguration `traefik.toml` oder Coolify-Traefik-Override: IP entweder auf `0.0.0.0` setzen ODER IP-Anonymisierung via `/24`-Truncation (Format `192.168.1.0`).
   - **Coolify-Container-Log:** App-Log darf KEIN `req.headers['x-forwarded-for']` oder `event.request.headers.get('cf-connecting-ip')` loggen. Audit: `grep -rn "x-forwarded-for\|cf-connecting-ip\|client.address" src/` darf nur DPIA-konforme Treffer liefern (z.B. in Rate-Limit-Logic, wo IP nur in-memory verarbeitet wird).
   - **Log-Retention:** Coolify-Log-Files maximal 7 Tage Retention. Konfiguration in Coolify-Dashboard.
   - **Doku im Runbook:** `docs/runbooks/post-launch-resonance-indicators.md` Sektion „PII-Lock" beschreibt Konfiguration + Audit-Pfad.

6. **AC-6 (Notifier-Pfad im Disaster-Recovery-Runbook):**
   **Given** Story 4.4 hat 5 Disaster-Recovery-Runbooks angelegt.
   **When** ich Notifier-Pfad in DR-Workflow integriere.
   **Then**:
   - Entweder: Erweiterung von `docs/runbooks/data-source-failure.md` (oder anderem 4.4-Runbook) um Sektion „Down-Event-Eingang", die den Notifier-Flow beschreibt.
   - Oder neuer Runbook `docs/runbooks/monitoring-down-event.md` mit:
     - **Step 1: Alert empfangen** (Email oder Telegram-Push)
     - **Step 2: Erste Triage** (`curl https://navigator.berlin/healthz` → ist Endpoint wirklich down?)
     - **Step 3: Coolify-Dashboard öffnen** (Container-Status, Restart-Counter, Logs)
     - **Step 4: Hetzner-Cloud-Console** (Host-Status, Network-Ausfall?)
     - **Step 5: Restart-Pfad** (Coolify-Container-Restart oder Hetzner-Server-Reboot)
     - **Step 6: Post-Mortem-Notiz** in `docs/incidents/YYYY-MM-DD-<slug>.md` falls Outage > 15 Min.
   - **Empfehlung:** neuer Runbook `monitoring-down-event.md`, weil Notifier-Flow konzeptionell vom Data-Source-Failure-Flow getrennt ist. Story 4.4 mit auf Cross-Reference erweitern.
   - Test: Runbook-Section-Count + Cross-Reference-Check.

7. **AC-7 (Healthz-Endpoint-Härtung):**
   **Given** `/healthz` aus Story 4.1 ist Phase-1-Stand mit `{"status":"ok","db":"ok"}`.
   **When** ich Monitor-Konsum prüfe.
   **Then**:
   - Endpoint ist UNAUTHENTICATED (Public-GET), damit healthchecks.io / UptimeRobot ohne Token zugreifen können.
   - Endpoint enthält KEINE sensiblen Daten (kein DB-Schema-Echo, keine Env-Vars, keine User-Counts).
   - Response-Time-Budget: ≤ 200ms (Postgres-Ping inklusive). Wenn DB-Probe langsam ist (> 500ms), Monitor-Latenz steigt + Grace-Period reicht nicht.
   - **Robots-Konfiguration:** `/healthz` wird in `robots.txt` mit `Disallow: /healthz` ausgeschlossen, damit kein Crawler-Polling die Coolify-Metriken verfälscht.
   - **Sitemap-Exclude:** `/healthz` darf NICHT in `sitemap.xml` auftauchen. Verify in `src/lib/seo/sitemap-builder.ts:131` `ALL_SOURCES`.

8. **AC-8 (GitHub-Action-Cron als Stretch-Fallback):**
   **Given** Stretch-Pfad: GitHub-Action-Cron als zweite Beobachter-Linie.
   **When** ich `.github/workflows/healthz-cron.yml` anlege.
   **Then**:
   - Workflow läuft alle 15 Min (`cron: '*/15 * * * *'`).
   - Step: `curl --fail https://navigator.berlin/healthz` + Body-Validation auf `"status":"ok"`.
   - Bei Failure: GitHub-Issue auf Repo eröffnen mit Label `monitoring-failure` (verhindert Dupe via Title-Check).
   - **NICHT Pflicht-Scope für `done`-Status,** Stretch-Pfad falls healthchecks.io-Setup hängt.

9. **AC-9 (DPIA-Cross-Reference auf Story 5.6):**
   **Given** Story 5.6 erstellt DPIA-Dokument.
   **When** Monitor-Provider gewählt wird.
   **Then**:
   - DPIA-Dokument aus 5.6 ergänzt Sektion „Externe Dienstleister" um healthchecks.io (und UptimeRobot als Fallback) mit Anbieter-Standort, Datenkategorie (URL-Pings, kein User-Daten-Flow), Rechtsgrundlage (Art. 6 Abs. 1 lit. f DSGVO berechtigtes Interesse Betreiber).
   - **Sequencing-Lock:** 5.4 darf vor 5.6 starten, ABER DPIA-Section-Refresh muss vor Phase-3-Hard-Launch passieren. 5.6-Dev-Story ergänzt diese Sektion automatisch via Cross-Reference auf ADR-017.

10. **AC-10 (Phase-1-DE-only-Lock):**
    **Given** Memory `project_i18n_phase_1_de_only.md`.
    **When** ich Doku schreibe.
    **Then**:
    - ADR-017: DE-only.
    - `docs/runbooks/monitoring-down-event.md`: DE-only.
    - `docs/runbooks/post-launch-resonance-indicators.md`: DE-only.
    - YAML-Manifest-Files (`healthchecks-config.yml`, `notifiers.yml`): Kommentare DE.
    - Alert-Email-Subject DE: „[ALERT] navigator.berlin Check '<name>' down".

11. **AC-11 (TDD-Mandat + Lint-Gates):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** für `/healthz`-Endpoint sind in Story 4.1 abgedeckt. 5.4 fügt KEINE neuen Endpoint-Tests hinzu.
    - **YAML-Schema-Test** `infra/monitoring/healthchecks-config.test.ts`: Lädt `healthchecks-config.yml`, validiert Schema (Name, URL, Method, Expected-Status, Schedule), prüft alle URLs auf Plausibilität (HTTPS, Domain `navigator.berlin`).
    - **YAML-Schema-Test** `infra/monitoring/notifiers.test.ts`: Lädt `notifiers.yml`, validiert Channel-Type + Token-Reference (Token-Wert nicht im Repo!).
    - **Secrets-Audit-Test** `infra/monitoring/secrets-audit.test.ts`: scannt `infra/monitoring/*.yml` auf Klartext-Tokens (Heuristik: Strings mit `[A-Za-z0-9]{30,}` nicht in `{{ env.* }}`-Pattern). Fails bei Treffer.
    - **Markdown-Lint** auf ADR-017 + 2 Runbooks (em-dash + Stigma-Lint).
    - **Robots.txt-Test** `tests/integration/robots-healthz-exclude.test.ts`: prüft dass `/healthz` in `robots.txt` `Disallow`-Block steht.
    - **Sitemap-Test** `tests/integration/sitemap-healthz-exclude.test.ts`: prüft dass `/healthz` NICHT in `sitemap.xml` auftaucht.

## Tasks / Subtasks

- [ ] **T1: ADR-017 schreiben** (AC: 1, 10)
  - [ ] T1.1: `docs/adr/ADR-017-uptime-monitoring.md` mit Frontmatter + Context + Decision + Alternativen + Konsequenzen + Cross-Reference.
  - [ ] T1.2: DE-only-Lint-Pass.
  - [ ] T1.3: ADR-Section-Existenz-Check.

- [ ] **T2: healthchecks.io-Account + Check-Konfiguration** (AC: 2)
  - [ ] T2.1: Account erstellen auf healthchecks.io (EU-Hosted-Variante falls verfügbar, sonst US-Standard).
  - [ ] T2.2: 5 Checks manuell konfigurieren (Healthz, Root, Atlas, Sitemap, RSS).
  - [ ] T2.3: `infra/monitoring/healthchecks-config.yml` mit YAML-Manifest aller Checks.
  - [ ] T2.4: YAML-Schema-Test.

- [ ] **T3: Notifier-Channel-Setup** (AC: 3, 10)
  - [ ] T3.1: Email-Webhook konfigurieren (healthchecks.io-Email-Integration auf `hey@navigator.berlin`).
  - [ ] T3.2: Telegram-Bot erstellen (BotFather), Bot-Token in Coolify-Env-Var `HEALTHCHECKS_TG_BOT_TOKEN`, Chat-ID in `HEALTHCHECKS_TG_CHAT_ID`.
  - [ ] T3.3: Telegram-Webhook in healthchecks.io eintragen.
  - [ ] T3.4: `infra/monitoring/notifiers.yml` mit Channel-Manifest.
  - [ ] T3.5: `.env.example` um Env-Var-Namen ergänzen.
  - [ ] T3.6: Manueller Pause-Test → Down-Alert empfangen → Latenz dokumentieren.

- [ ] **T4: Down-Event-Runbook** (AC: 6, 10)
  - [ ] T4.1: `docs/runbooks/monitoring-down-event.md` mit 6 Steps (Alert → Triage → Coolify → Hetzner → Restart → Post-Mortem).
  - [ ] T4.2: Cross-Reference aus Story-4.4-Runbooks anlegen (Symlink-Verweis oder Markdown-Link).
  - [ ] T4.3: DE-only + Stigma-Lint.

- [ ] **T5: Resonanz-Indikator-Runbook** (AC: 4, 5, 10)
  - [ ] T5.1: `docs/runbooks/post-launch-resonance-indicators.md` mit 3 Indikator-Pfaden + PII-Lock-Sektion.
  - [ ] T5.2: Hetzner-Cloud-Console + Coolify-Dashboard-Screenshots als optionale Asset-Hinweise (NICHT committed wegen Account-PII).
  - [ ] T5.3: Cross-Reference auf `docs/launch-resonance.md` (Story 5.3 T+30d-Slot).

- [ ] **T6: Healthz-Endpoint-Audit + Robots/Sitemap-Exclude** (AC: 7)
  - [ ] T6.1: Verify `/healthz` Response-Body enthält keine PII / Schema-Echo / Env-Vars.
  - [ ] T6.2: Verify `/healthz` Response-Time ≤ 200ms gegen Production-Build.
  - [ ] T6.3: `static/robots.txt` (oder `src/routes/robots.txt/+server.ts`) um `Disallow: /healthz` ergänzen.
  - [ ] T6.4: `src/lib/seo/sitemap-builder.ts` Cross-Check: `/healthz` ist nicht in `ALL_SOURCES`.
  - [ ] T6.5: Integration-Tests `tests/integration/robots-healthz-exclude.test.ts` + `tests/integration/sitemap-healthz-exclude.test.ts`.

- [ ] **T7: Traefik + Coolify PII-Hardening** (AC: 5)
  - [ ] T7.1: Traefik-Konfiguration: Access-Log mit IP-Anonymisierung (Truncation `/24`) ODER Access-Log komplett aus.
  - [ ] T7.2: App-Log-Audit via `grep -rn "x-forwarded-for\|cf-connecting-ip" src/` und Triage jedes Treffers.
  - [ ] T7.3: Coolify-Log-Retention auf 7 Tage konfigurieren.
  - [ ] T7.4: Doku in `post-launch-resonance-indicators.md` Sektion „PII-Lock".

- [ ] **T8: GitHub-Action-Cron-Fallback** (AC: 8, Stretch)
  - [ ] T8.1: `.github/workflows/healthz-cron.yml` mit `cron: '*/15 * * * *'`.
  - [ ] T8.2: `curl --fail`-Step + Body-Validation.
  - [ ] T8.3: Issue-Creation-Step bei Failure (dedup via Title-Check).
  - [ ] T8.4: **NICHT Pflicht für `done`-Status**, kann nach Hard-Launch nachgezogen werden.

- [ ] **T9: Secrets-Audit + Lint-Gates** (AC: 11)
  - [ ] T9.1: `infra/monitoring/secrets-audit.test.ts` mit Heuristik-Scan.
  - [ ] T9.2: Markdown-Lint auf ADR-017 + Runbooks (em-dash, Stigma).
  - [ ] T9.3: `pnpm check` 0 Errors über alle neuen Files.

- [ ] **T10: Final-Verifikation** (AC: 1-11)
  - [ ] T10.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T10.2: Manueller End-to-End-Test: Coolify-Container 2 Min stoppen → healthchecks.io detect Down → Email + Telegram-Alert empfangen → Container restart → Up-Alert → Latenz dokumentiert.
  - [ ] T10.3: DPIA-Cross-Reference-Note in Story 5.6 Open-Items hinterlegen.
  - [ ] T10.4: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung

5.4 ist **Owner-Setup-heavy**: Account-Erstellung, Provider-Konfiguration, Token-Management, manueller End-to-End-Test. Code-Output ist minimal (2 YAML-Manifests, 2 Runbooks, 1 ADR, optional 1 GH-Action-Workflow, 3-4 Test-Files).

KEINE App-Code-Änderungen außer evtl. robots.txt + sitemap-Exclude-Test.

### Provider-Wahl-Reasoning

healthchecks.io vs UptimeRobot:

| Aspekt | healthchecks.io | UptimeRobot |
|--------|-----------------|-------------|
| Standort | EU-Option (hc-ping.eu) verfügbar, sonst US | US (Bukarest-Ausnahme) |
| Lizenz | BSD-3-Clause (Open-Source) | Closed-Source |
| Free-Tier | 20 Checks, alle Features | 50 Checks, eingeschränkte Features |
| API | gut dokumentiert | gut dokumentiert |
| Cron-Monitoring | Erstklassig (Backup-Job-Pings via /start + /exit) | Schwächer (nur Heartbeat-Style) |
| Self-Hosting | möglich (Phase-3-Stretch) | nicht möglich |
| Notifier-Channels | 30+ inkl. Matrix, Signal, Telegram | 15+ inkl. Telegram, Slack, Discord |

**Default-Lock: healthchecks.io primär**, UptimeRobot nur falls EU-Variante nicht erreichbar.

### EU-FOSS-Linie-Begründung

UptimeRobot ist US-Anbieter (FL, USA), wäre für User-Daten-Flow ein No-Go. Aber: **Server-zu-Server-Ping ohne User-Daten-Beteiligung** ist datenschutzrechtlich vertretbar (Anbieter sieht nur Pong-Response der Site, kein User-Verkehr). DPIA-Sektion in 5.6 kann das mit Art. 6 Abs. 1 lit. f DSGVO begründen.

healthchecks.io ist FOSS + EU-Hostable, deshalb defaulted. UptimeRobot-Fallback ist sauber, weil keine PII-Pfade beteiligt sind.

### Self-Hosted-healthchecks.io-Phase-3-Stretch

Phase 3 Hard-Launch + Owner-Wunsch nach voller Daten-Souveränität: Self-Hosted-healthchecks.io-Container auf Hetzner CPX22 ausrollen. ABER: Single-Point-of-Failure-Risiko (wenn CPX22 down, ist auch Monitor down). Lösung: zweiter Hetzner-Mikro-Server in zweiter Region (Falkenstein vs Nürnberg) als Monitor-Host. Phase-3-Folge-Story `5-4.1-self-hosted-healthchecks-io-deployment`.

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `src/routes/api/healthz/+server.ts` (Story 1.1 + 4.1-Erweiterung) als Monitor-Probe-Endpoint.
- `src/lib/seo/sitemap-builder.ts` `ALL_SOURCES` für Sitemap-Exclude-Verifikation.
- `static/robots.txt` (oder Dynamic-Route aus Story 2.1) für Robots-Exclude.
- `src/lib/utils/contact.ts` `FEEDBACK_EMAIL` als Alert-Email-Ziel.
- `docs/adr/`-Verzeichnis + ADR-013-Format als Format-Vorbild.
- `docs/runbooks/`-Verzeichnis + bestehende Runbooks (bookmark-storage, tile-provider-switch) als Format-Vorbild.

### MUST-Rules-Anwendung

- **#7 TypeScript strict**: YAML-Schema-Tests typed via Valibot oder Zod.
- **#10 Cookieless**: Monitor-Wahl explizit ohne Cookies.
- **#11 Kein US-Drittanbieter**: healthchecks.io primär (EU-Option), UptimeRobot nur als Fallback mit Server-zu-Server-Begründung.
- **#12 Provenance**: ADR-017 dokumentiert Provider-Wahl belegbar.
- **#14 i18n-First**: Phase-1-DE-only-Lock auf Doku.
- **#19 NFR-PR4**: PII-Lock in Logs als AC-5 hartcodiert.
- **#20 ADR-Pflicht**: ADR-017 für Provider-Wahl.

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 4.1 | ready-for-dev | `/healthz`-Endpoint + Postgres-Probe + Coolify-Container-Healthcheck. MUSS done vor 5.4-Aktivierung. |
| 4.2 | ready-for-dev | TLS + CSP-Headers. Keine direkte 5.4-Dependency. |
| 4.4 | ready-for-dev | DR-Runbooks-Verzeichnis. Cross-Reference. |
| 5.1 | ready-for-dev | ADR-016 + GitHub-Actions-Schedule-Pattern. Format-Vorbild für ADR-017 + GH-Action-Cron-Stretch. |
| 5.3 | ready-for-dev | Launch-Plan + Resonanz-Bilanz-Stub. 5.4 liefert Resonanz-Indikator-Workflow. |
| 5.5 | backlog | Backup-Restore-Drill. 5.4 ergänzt Backup-Job-Ping als 6. Check. |
| 5.6 | backlog | GDPR-DPIA. 5.4-ADR-017 wird in 5.6-DPIA referenziert. |
| 2.1 | review | `robots.txt` + Sitemap-Endpoint. 5.4 verifiziert Exclude. |

**Empfehlung Reihenfolge:**
1. Epic 4 komplett done.
2. 5.4 jetzt, nach 4.1 + 4.4 done.
3. 5.5 sequenziell hinter 5.4 (Backup-Job-Cron-Ping als 6. Check).
4. 5.6 nach 5.4 (DPIA-Cross-Reference auf ADR-017).

### Open-Questions vor Dev-Start

1. **Notifier-Channel-Wahl:** Email reicht oder Telegram-Push zusätzlich? **Default-Decision:** beide. Email als Audit-Trail, Telegram als Push-Latenz-Killer. User confirmiert Telegram-Bereitschaft (Bot-Setup-Pflicht).

2. **healthchecks.io-Free-Tier-Limit:** 20 Checks. Bei wachsendem Setup (Backup-Cron, Sub-Routen-Checks) potenziell knapp. **Default-Decision:** mit 5-6 Checks starten, falls > 20 nötig → Paid-Tier (3 USD/Monat) oder Self-Hosting Phase 3.

3. **Self-Hosted-Pfad-Timing:** Phase 3 oder vorziehen? **Empfehlung:** Phase 3, weil Single-Point-of-Failure-Risiko mit Self-Host auf gleichem CPX22 sinnlos ist. Erfordert zweiten Hetzner-Server, separate Story.

4. **GitHub-Action-Cron-Stretch:** Pflicht oder nicht? **Default-Decision:** Stretch, kann nach Hard-Launch nachgezogen werden. Issue-Spam-Risiko bei GA-Failure-Loops ist nicht-trivial.

5. **Traefik-Access-Log-Strategie:** Komplett aus oder IP-Anonymisierung? **Empfehlung:** IP-Anonymisierung via `/24`-Truncation, damit Debug-Workflow (z.B. „kommt der Bot-Traffic aus einem Subnet?") noch funktioniert ohne PII-Bruch. User confirmiert Strategie.

### Stigma + Editorial-Disziplin

- ADR + Runbooks: aktive Verben, kurze Sätze.
- KEIN „best-in-class", KEIN „nahtlos", KEIN „state-of-the-art" in ADR-Begründung.
- Provider-Aussagen sind faktisch (Lizenz, Standort, Tier-Limits).

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2242-L2267`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup.md` (Healthz + Coolify-Probe)
- Story 4.4: `_bmad-output/implementation-artifacts/4-4-adr-nachzieher-disaster-recovery-runbooks.md` (DR-Runbook-Verzeichnis)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (ADR-Format + GH-Action-Pattern)
- Story 5.3: `_bmad-output/implementation-artifacts/5-3-launch-sequencing-plan-channel-material.md` (Resonanz-Bilanz-Slot)
- Story 5.5: TBD (Backup-Drill, Cross-Reference für Backup-Cron-Ping)
- Story 5.6: TBD (DPIA-Cross-Reference auf ADR-017)
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `project_server_purchase_sequencing.md`
- Bestand Healthz: `src/routes/api/healthz/+server.ts`
- Bestand Robots: `static/robots.txt` (Phase-1-Stand) oder `src/routes/robots.txt/+server.ts` (Story 2.1)
- Bestand Sitemap: `src/lib/seo/sitemap-builder.ts`
- Bestand Contact: `src/lib/utils/contact.ts:1`
- ADR-Format-Vorbild: `docs/adr/ADR-013-score-aggregation-strategy.md`
- Runbook-Format-Vorbild: `docs/runbooks/bookmark-storage.md`, `docs/runbooks/tile-provider-switch.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
