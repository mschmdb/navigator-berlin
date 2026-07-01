# Story 5.7: Sitemap-Submission + Search-Console-Setup

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a SEO-Hoffender mit ~400 prerenderten Routes (Hero + Atlas + Bezirks/Kiez-Long-Forms + Layer-Pages + Methodik + Datenschutz + DPIA + Press + Architektur + Lizenzen + Impressum + Barrierefreiheit + Updates),
I want Google Search Console + Bing Webmaster Tools für `navigator.berlin` eingerichtet, die Sitemap aktiv submitted, Index-Status monitorbar als monatliche Owner-Routine codifiziert, IndexNow optional konfiguriert, und robots.txt-Sanity-Check als CI-Gate verankert,
so that Long-Tail-Suchanfragen Chancen kriegen die Routes zu finden, Owner Indexing-Lücken früh erkennt (Cadence-Pflicht aus 5.1), und kein restriktives `Disallow` versehentlich das Indexing blockt.

## Probleme heute

1. **Search Console nicht eingerichtet.** Domain `navigator.berlin` ist bei Google nicht als verifizierte Property eingetragen. Indexing läuft heute ad-hoc durch Crawler-Discovery (sehr langsam, oft unvollständig). Long-Tail-Routes (`/kiez/[slug]`, `/bezirk/[slug]`, `/layer/[slug]`) bleiben monatelang unindexed.
2. **Bing Webmaster Tools nicht eingerichtet.** Bing + DuckDuckGo (nutzt Bing-Index) bleiben ohne aktive Sitemap-Submission auf Discovery-Geschwindigkeit. Marktanteil DE-weit 5-8% (besser als nichts).
3. **Indexing-Status nicht monitorbar.** Ohne Search Console gibt es keinen Owner-Sichtbarkeits-Pfad für „wie viele meiner 400 Routes sind tatsächlich indexed". Risiko: 50% der Routes bleiben unindexed wegen Fehlern (404, Soft-404, Duplicate-Content, hreflang-Cluster-Bruch).
4. **robots.txt-Sanity-Check fehlt als CI-Gate.** Story 2.1 hat `robots.txt`-Route gebaut mit `Allow: /` + Sitemap-Verweis. ABER: versehentliche zukünftige Disallow-Erweiterung könnte Indexing brechen ohne dass es jemand merkt. CI-Gate erzwingt Indexing-Kompatibilität.
5. **IndexNow nicht konfiguriert.** Microsoft-Bing-Push-Protokoll erlaubt URL-Push bei Update statt Crawl-warten. Cheap + sinnvoll für `/updates`-Route (Story 2.13) wo neue Entries täglich-bis-wöchentlich entstehen.
6. **hreflang-Cluster-Validation fehlt.** Epic-AC sagt hreflang-Validation aus Story 3.3 (EN-Variante), aber Phase-1-DE-only-Lock cuts EN. hreflang-Validation Phase 1 = nur DE+x-default-Check (kein de-Return-Tag-Bruch).

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2315-2342.
- Memory `project_i18n_phase_1_de_only.md`: kein `sitemap-en.xml` Phase 1. hreflang-Cluster Phase 1 nur DE + `x-default`. EN-Variante Phase-3-Folge-Story.
- Memory `feedback_no_em_dashes.md`: keine em-dashes in Doku.
- Memory `project_atlas_explore_route.md`: Atlas auf `/explore`, Brand-Lander auf `/`. Sitemap muss beide enthalten (Story 2.11 AC-8).
- Memory `project_server_purchase_sequencing.md`: Sitemap-Submission ist Phase-2-Beta- bis Phase-3-Hard-Launch-Aktivität. Phase 1 Coming-Soon = `robots.txt` Disallow + Search Console eingerichtet aber Sitemap nicht submitted.
- Story 5.1 (ready-for-dev): ADR-016 Update-Cadence. 5.7 erweitert ADR-016 um „Index-Coverage-Check-Cadence (monatlich)".
- Story 5.3 (ready-for-dev): Launch-Plan T+0 + T+14d. 5.7 ist T+0-Trigger (Sitemap submitted + Index-Start).
- Story 5.4 (ready-for-dev): Monitoring. Sitemap-200-Check ist bereits 4. Check in `healthchecks-config.yml`.
- Story 5.6 (ready-for-dev): DPIA. Search Console + Bing Webmaster Tools sind US-Anbieter → DPIA „Externe Dienstleister"-Tabelle ergänzen.
- Story 2.1 (review): `robots.txt`-Route + `sitemap.xml` + `sitemap-de.xml` + `ALL_SOURCES`-Pattern. Bestand vorhanden, 5.7 nutzt + verifiziert.
- Story 2.13 (review, merged): Updates-Route + RSS-Feed. 5.7 IndexNow-Trigger für neue Updates.
- Bestand Sitemap: `src/routes/sitemap.xml/+server.ts` + `src/routes/sitemap-de.xml/+server.ts`.
- Bestand Robots: `src/routes/robots.txt/+server.ts` mit `Allow: /` + Sitemap-Verweis.
- Bestand Sources: `src/lib/seo/sources/updates.ts` + Sitemap-Builder-Registry.
- Google Search Console: `https://search.google.com/search-console`.
- Bing Webmaster Tools: `https://www.bing.com/webmasters`.
- IndexNow-Spec: `https://www.indexnow.org/documentation`.

## Akzeptanz-Kriterien

1. **AC-1 (Google Search Console Domain-Property + DNS-Verify):**
   **Given** Domain `navigator.berlin` läuft auf Hetzner-CPX22.
   **When** ich GSC-Domain-Property anlege.
   **Then**:
   - Property-Typ: **Domain-Property** (NICHT URL-Prefix), weil Domain-Property `https://navigator.berlin` + `https://www.navigator.berlin` + `http://...` + alle Subdomains zentral abdeckt.
   - **DNS-TXT-Verifizierung:** GSC liefert TXT-Record (Format `google-site-verification=...`), Owner trägt im DNS-Provider (vermutlich Hetzner-DNS oder INWX/Hetzner-Console) als TXT-Record auf Apex-Domain ein.
   - Verifikation Owner-Side prüfen: `dig TXT navigator.berlin +short` zeigt Record.
   - Verification-Klick in GSC bestätigt Property-Anlage.
   - **Doku:** `docs/runbooks/search-console-setup.md` mit Schritt-für-Schritt-Anleitung (DNS-Provider-spezifisch).
   - **TXT-Record-Pflege:** Record bleibt dauerhaft im DNS (nicht löschen, GSC kann re-verifyen).

2. **AC-2 (Sitemap-Submission an GSC):**
   **Given** GSC Property verifiziert.
   **When** ich Sitemap submitte.
   **Then**:
   - **Submitted-Sitemap:** `https://navigator.berlin/sitemap.xml` (Index-Sitemap, verweist intern auf `sitemap-de.xml`).
   - **NICHT submittet:** `sitemap-en.xml` Phase 1 (existiert nicht wegen DE-only-Lock).
   - Submission via GSC-Web-UI: „Sitemaps" → „Add new sitemap" → `sitemap.xml`.
   - **Verifikation 24-72h später:** Status „Erfolgreich" + URL-Count entspricht Sitemap-Inhalt.
   - **Fehler-Triage-Pfad:** wenn Status „Couldn't fetch": Owner prüft Sitemap-200-Check (Story 5.4 healthchecks.io Check 4) + `curl https://navigator.berlin/sitemap.xml` lokal + CSP-Header (Story 4.2) zulässt Crawler-User-Agent.

3. **AC-3 (Bing Webmaster Tools Setup):**
   **Given** Bing-Indexing-Marktanteil DE 5-8% (DuckDuckGo nutzt Bing).
   **When** ich Bing Webmaster Tools einrichte.
   **Then**:
   - **GSC-Import-Pfad:** Bing Webmaster Tools erlaubt 1-Klick-Import aus Google Search Console (spart DNS-Verify-Doppelarbeit). Owner nutzt diesen Pfad.
   - **Fallback:** wenn Import nicht funktioniert, manuelle DNS-TXT-Verifizierung (separates Bing-TXT-Record).
   - **Sitemap-Submission:** identisch zu GSC, `https://navigator.berlin/sitemap.xml`.
   - **Doku:** Erweiterung des `search-console-setup.md`-Runbooks um Bing-Sektion.

4. **AC-4 (robots.txt-Sanity-CI-Gate):**
   **Given** `src/routes/robots.txt/+server.ts` (Story 2.1).
   **When** ich CI-Gate hinzufüge.
   **Then**:
   - Test `tests/integration/robots-allow-all.test.ts`:
     - Lädt `robots.txt`-Response.
     - Prüft `Allow: /` ist enthalten.
     - Prüft `Sitemap: https://navigator.berlin/sitemap.xml` ist enthalten.
     - Prüft KEIN `Disallow: /`-Eintrag der Root blockiert (außer für explizite Sub-Routes wie `/healthz` aus Story 5.4 AC-7).
     - Prüft `Disallow: /healthz` IST enthalten (wenn 5.4 done).
   - **Phase-Variante:** Test passt sich an Phase an:
     - Phase 1 Coming-Soon: `Disallow: /` ist erlaubt + erwartet.
     - Phase 2 Beta + Phase 3 Hard: `Allow: /` Pflicht, `Disallow: /` verboten.
   - Test läuft als integration-test in CI.

5. **AC-5 (hreflang-Cluster-Validation Phase 1):**
   **Given** Phase-1-DE-only-Lock + hreflang-Cluster.
   **When** ich hreflang-Validation für DE+x-default ausführe.
   **Then**:
   - Test `tests/integration/hreflang-cluster-phase1.test.ts`:
     - Lädt 5 Sample-Pages (`/`, `/methodik`, `/datenschutz`, `/lizenzen`, `/impressum`).
     - Prüft `<link rel="alternate" hreflang="de" href="...">` ist gesetzt.
     - Prüft `<link rel="alternate" hreflang="x-default" href="...">` ist gesetzt.
     - Prüft KEIN `<link rel="alternate" hreflang="en" href="...">` (Phase-1-Lock).
   - **GSC-Validation-Run (manuell):** GSC „International Targeting" → „Language" → Owner prüft 1x manuell ob keine Cluster-Fehler („no return tag", „missing x-default") angezeigt werden.
   - **Phase-3-Folge-Story:** wenn EN-Variante kommt, hreflang-Cluster wird `de` + `en` + `x-default` mit Return-Tags zwischen DE+EN-Cluster.

6. **AC-6 (Index-Coverage-Cadence-Check):**
   **Given** ADR-016 (Story 5.1) lockt Update-Cadence-Pattern.
   **When** ich monatliche Index-Coverage-Cadence definiere.
   **Then**:
   - Erweiterung von ADR-016 (oder ADR-018) um „Index-Coverage-Check-Cadence (monatlich)".
   - **Cadence:** 1. Werktag jedes Monats, Owner-Calendar-Reminder oder GitHub-Action-Issue-Auto-Open (5.1-Pattern).
   - **Check-Schritte:**
     1. GSC-Coverage-Report öffnen: „Pages" → „Indexed" + „Not indexed".
     2. Bing-Webmaster-URL-Inspection auf Sample-Pages.
     3. Bei Index-Lücken (Routes unindexed seit > 30 Tagen): Notiz in `_user-input/seo-issues.md`.
   - **Lücken-Triage:**
     - Soft-404 (Page lädt aber Crawler liest leeren Content): Render-Disziplin prüfen (SSR vs CSR).
     - hreflang-Cluster-Bruch: Story-5.7-AC-5-Test re-laufen.
     - Crawl-Budget-Spread: zu viele Long-Tail-Routes → Sitemap-Priority-Refinement.
     - Duplicate-Content: Canonical-Tags prüfen.
   - **Folge-Story-Pfad:** systematische Lücken → eigene Folge-Story `5-7.1-seo-coverage-fix`.

7. **AC-7 (IndexNow-Push für Updates):**
   **Given** Story 2.13 Updates-Route + RSS-Feed.
   **When** neue `_content/updates/`-Entries committed werden.
   **Then**:
   - **IndexNow-Key generieren:** zufälliger Schlüssel (32 Zeichen hex), abgelegt als `static/<key>.txt` (Inhalt = Key selbst, Bing-Verifikations-Pflicht).
   - **IndexNow-Submit-Skript:** `scripts/indexnow-submit.ts` sendet `POST https://api.indexnow.org/indexnow` mit Body `{ host, key, keyLocation, urlList: ['https://navigator.berlin/updates/...'] }`.
   - **Trigger:** Manueller Trigger via `pnpm seo:indexnow <url>` (Owner führt nach Update-Commit aus).
   - **Stretch (Phase 3):** GitHub-Action-Workflow triggert automatisch IndexNow bei Push auf main wenn `_content/updates/*.md` geändert.
   - **Doku:** Erweiterung `search-console-setup.md` um IndexNow-Sektion.
   - **Phase-1-Lock:** IndexNow-Submit erst aktiv ab Phase 2 (Coming-Soon-Site soll nicht indexed werden).

8. **AC-8 (Sitemap-200-Check als Monitor):**
   **Given** Story 5.4 healthchecks.io-Setup.
   **When** Sitemap-200-Check konfiguriert wird.
   **Then**:
   - **Bestätigt:** Check 4 aus 5.4 AC-2 ist `https://navigator.berlin/sitemap.xml` mit Status-200 + Content-Type-XML.
   - **Erweitert für 5.7:** zusätzlicher Check 4b `https://navigator.berlin/sitemap-de.xml` mit gleichen Erwartungen.
   - **Konfiguration in 5.4 `healthchecks-config.yml`:** wenn 5.4 done, 5.7 ergänzt nur den Eintrag. Wenn 5.4 nicht done, 5.7 dokumentiert Pflicht-Aufnahme als Cross-Story-Note.

9. **AC-9 (Search-Engine-Crawler-Audit):**
   **Given** Server soll Crawler-Traffic unterscheiden können.
   **When** ich Traefik-Log auf Crawler-User-Agents prüfe.
   **Then**:
   - **Manueller Audit nach 7 Tagen Live-Crawl:** Owner ruft Traefik-Logs (IP-anonymisiert per Story 4.2 + 5.4 AC-5), grep auf User-Agents `Googlebot|Bingbot|DuckDuckBot|YandexBot|Applebot`.
   - **Erwartung:** Googlebot + Bingbot + DuckDuckBot regelmäßig sichtbar.
   - **Wenn KEIN Bot-Traffic nach 14 Tagen:** Indikation für Indexing-Problem (CSP-Block, Bot-Protection-Falsch-Positive, DNS-Mismatch).
   - **Doku:** Erweiterung `search-console-setup.md` um Sektion „Crawler-Audit-Workflow".

10. **AC-10 (DPIA-Cross-Reference auf GSC + Bing):**
    **Given** Story 5.6 DPIA „Externe Dienstleister"-Tabelle.
    **When** GSC + Bing Webmaster eingerichtet sind.
    **Then**:
    - DPIA-Tabelle erweitert um:
      - **Google Search Console** (US, Google LLC): SEO-Performance-Monitoring. Server-zu-Server-Crawler + Owner-Login. KEINE User-Daten-Übermittlung von navigator.berlin an Google. Art. 6 Abs. 1 lit. f DSGVO berechtigtes Interesse Betreiber.
      - **Bing Webmaster Tools** (US, Microsoft Corp): identisch zu GSC. Art. 6 Abs. 1 lit. f.
      - **IndexNow-API** (Microsoft Corp): URL-Push-Endpoint. KEINE User-Daten. Art. 6 Abs. 1 lit. f.
    - **Sequencing:** 5.7 produziert Cross-Reference-Note für 5.6-Dev-Story. 5.6 ergänzt Tabelle automatisch.

11. **AC-11 (Phase-1-DE-only-Lock):**
    **Given** Memory `project_i18n_phase_1_de_only.md`.
    **When** ich Konfiguration treffe.
    **Then**:
    - Submitted Sitemap: NUR `sitemap.xml` (Index-Sitemap, intern verweist auf `sitemap-de.xml`).
    - KEIN `sitemap-en.xml` submitted (existiert nicht).
    - hreflang-Cluster: NUR `de` + `x-default`, KEIN `en`.
    - Runbook `search-console-setup.md`: DE-only.
    - GSC-Property-Locale: DE als Default-Locale (Property-Settings).

12. **AC-12 (TDD-Mandat + Lint-Gates):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Integration-Test** `tests/integration/robots-allow-all.test.ts` (AC-4).
    - **Integration-Test** `tests/integration/hreflang-cluster-phase1.test.ts` (AC-5).
    - **Unit-Test** `scripts/indexnow-submit.test.ts`: Mock-Fetch verifiziert IndexNow-API-Call-Body + URL-Liste + Key.
    - **Markdown-Lint** auf `search-console-setup.md`: em-dash + Stigma-Lint.
    - **Secrets-Check:** IndexNow-Key MUSS in `.env`-Variable, NICHT im Repo. `secrets-audit.test.ts` (aus Story 5.4) scannt mit.

## Tasks / Subtasks

- [ ] **T1: GSC Domain-Property + DNS-Verify** (AC: 1, 11)
  - [ ] T1.1: GSC-Account anlegen oder existing nutzen.
  - [ ] T1.2: Domain-Property `navigator.berlin` initiieren.
  - [ ] T1.3: DNS-TXT-Record beim Provider eintragen.
  - [ ] T1.4: `dig TXT navigator.berlin +short` verifizieren.
  - [ ] T1.5: GSC-Verification-Klick.
  - [ ] T1.6: `docs/runbooks/search-console-setup.md` schreiben (≤ 150 Zeilen).

- [ ] **T2: Sitemap-Submission an GSC** (AC: 2)
  - [ ] T2.1: GSC „Sitemaps" → `sitemap.xml` adden.
  - [ ] T2.2: 24-72h warten, Status-Check.
  - [ ] T2.3: Bei Fehlern: Triage-Pfad aus AC-2 durchlaufen.

- [ ] **T3: Bing Webmaster Tools** (AC: 3)
  - [ ] T3.1: Bing-Webmaster-Account.
  - [ ] T3.2: GSC-Import-Pfad versuchen, sonst manuell.
  - [ ] T3.3: Sitemap submitten.
  - [ ] T3.4: Runbook um Bing-Sektion erweitern.

- [ ] **T4: robots.txt-CI-Gate** (AC: 4, 12)
  - [ ] T4.1: `tests/integration/robots-allow-all.test.ts` schreiben.
  - [ ] T4.2: Phase-Switch-Logic im Test (Coming-Soon vs Beta/Hard).
  - [ ] T4.3: CI-Step in `.github/workflows/test.yml`.

- [ ] **T5: hreflang-Cluster-Phase-1-Test** (AC: 5, 12)
  - [ ] T5.1: `tests/integration/hreflang-cluster-phase1.test.ts`.
  - [ ] T5.2: Sample-Pages-Liste konfigurieren.
  - [ ] T5.3: GSC „International Targeting" manuell prüfen nach Indexing.

- [ ] **T6: Index-Coverage-Cadence** (AC: 6)
  - [ ] T6.1: ADR-016 (oder ADR-018) Sektion „Index-Coverage-Cadence" erweitern.
  - [ ] T6.2: `_user-input/seo-issues.md` als leerer Initial-File anlegen.
  - [ ] T6.3: Owner-Calendar-Reminder oder GitHub-Action-Issue-Auto-Open konfigurieren.

- [ ] **T7: IndexNow-Setup** (AC: 7, 12)
  - [ ] T7.1: Zufalls-Key generieren (32-Hex), als `INDEXNOW_KEY`-Env-Var im Coolify.
  - [ ] T7.2: `static/<key>.txt` mit Key-Content (Build-Step erzeugt aus Env-Var, oder manuell committed mit non-secret-Pattern).
  - [ ] T7.3: `scripts/indexnow-submit.ts` mit Fetch-Call.
  - [ ] T7.4: NPM-Script `pnpm seo:indexnow`.
  - [ ] T7.5: Mock-Test für Submit-Skript.
  - [ ] T7.6: Runbook-Erweiterung.

- [ ] **T8: Sitemap-Monitor-Erweiterung** (AC: 8)
  - [ ] T8.1: Wenn 5.4 done: `healthchecks-config.yml` um `sitemap-de.xml`-Check 4b ergänzen.
  - [ ] T8.2: Wenn 5.4 nicht done: Cross-Story-Note in 5.4-Open-Items.

- [ ] **T9: Crawler-Audit-Workflow** (AC: 9)
  - [ ] T9.1: Runbook-Sektion mit grep-Command-Beispielen.
  - [ ] T9.2: Triage-Pfad bei fehlendem Bot-Traffic.

- [ ] **T10: DPIA-Cross-Reference** (AC: 10)
  - [ ] T10.1: Note in Story-5.6-Open-Items: 3 Externe-Dienstleister-Einträge (GSC, Bing, IndexNow) ergänzen.

- [ ] **T11: Final-Verifikation** (AC: 1-12)
  - [ ] T11.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T11.2: `pnpm check` 0 Errors.
  - [ ] T11.3: Manueller End-to-End-Test: Sitemap submitted, Status `Erfolgreich` in GSC + Bing.
  - [ ] T11.4: Erste Index-Coverage-Probe (10 Sample-URLs in GSC „URL Inspection" prüfen).
  - [ ] T11.5: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung

5.7 ist **Owner-Setup-heavy + Operational**. Code-Output:
- 1 Runbook `search-console-setup.md`.
- 2 Integration-Tests (robots + hreflang).
- 1 IndexNow-Submit-Skript + Mock-Test.
- 1 ADR-Erweiterung (Cadence-Sektion).
- 1 leerer `_user-input/seo-issues.md`.
- 1 `static/<indexnow-key>.txt` (Build-generiert oder committed).

Owner-Activity:
- GSC-Account + Domain-Property + DNS-Verify (~15 Min).
- Bing Webmaster Tools-Setup (~10 Min).
- Sitemap-Submission (~5 Min).
- 24-72h Wartezeit auf Indexing-Beginn.
- Monatliche Coverage-Routine ab T+30d Schedule.

### Phase-Sequencing-Lock

- **Phase 1 Coming-Soon:** GSC + Bing Webmaster EINGERICHTET, aber Sitemap NICHT submitted (Site soll nicht indexed werden). `robots.txt` hat `Disallow: /`.
- **Phase 2 Beta T+0:** Sitemap submitted, `robots.txt` auf `Allow: /` geflippt (via NAVIGATOR_PHASE-ENV in Story 2.11). Indexing startet.
- **Phase 3 Hard T+14d:** IndexNow-Push für `/updates/`-Entries aktiviert.

### Owner-Account-Voraussetzungen

- **Google-Account** auf Owner-Identität (Matze Schmidbauer). Empfehlung: dediziertes Google-Konto für `navigator.berlin`-Property, NICHT Privat-Account.
- **Microsoft-Account** für Bing Webmaster Tools. Gleiches Pattern.
- **DNS-Provider-Zugang** für TXT-Record-Pflege.

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `src/routes/sitemap.xml/+server.ts` + `src/routes/sitemap-de.xml/+server.ts` (Story 2.1) als Sitemap-Source.
- `src/routes/robots.txt/+server.ts` (Story 2.1) mit `Allow: /` + Sitemap-Verweis.
- `src/lib/seo/sitemap-builder.ts` `ALL_SOURCES` (Story 2.1) als Registry.
- `src/lib/components/atlas/seo-head.svelte` hreflang-Pattern.
- Story 5.4 `healthchecks-config.yml` für Sitemap-Monitor.
- Story 5.6 DPIA-Tabelle für Externe-Dienstleister-Erweiterung.
- ADR-016 (Story 5.1) für Cadence-Erweiterung.

### MUST-Rules-Anwendung

- **#7 TypeScript strict**: IndexNow-Skript + Tests typed.
- **#11 Kein US-Drittanbieter im Production-Pfad**: GSC + Bing sind US-Anbieter, aber Server-zu-Server-Crawler + Owner-Login. **KEINE User-Daten-Übermittlung von navigator.berlin an Google/Microsoft**, deshalb DPIA-konform. CI-Gate „kein US-Drittanbieter" gilt für Production-Runtime, nicht für Owner-SEO-Tools.
- **#12 Provenance**: ADR-Erweiterung + Runbook als belegbarer Setup-Pfad.
- **#14 i18n-First**: Phase-1-DE-only-Lock.
- **#20 ADR-Pflicht**: Cadence-Erweiterung als ADR-Update.

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 2.1 | review | Sitemap + robots.txt-Pattern. MUSS done. |
| 2.11 | ready-for-dev | NAVIGATOR_PHASE-ENV + `assertPhaseAllows`-Helper für Phase-1-Coming-Soon-Disallow. |
| 4.2 | ready-for-dev | CSP-Headers zulassen Crawler-User-Agents. |
| 5.1 | ready-for-dev | ADR-016 Cadence-Anker. |
| 5.3 | ready-for-dev | Launch-Plan T+0 (Sitemap-Submission-Trigger). |
| 5.4 | ready-for-dev | Sitemap-Monitor + healthchecks-config. |
| 5.6 | ready-for-dev | DPIA-Externe-Dienstleister-Tabelle. |
| 2.13 | review (merged) | Updates-Route für IndexNow-Targets. |
| 3.1 | ready-for-dev | hreflang-Pattern (DE-only Phase 1). |

**Empfehlung Reihenfolge:**
1. Epic 4 done + 2.1 done (SEO-Foundation).
2. 5.1 done (ADR-016).
3. 5.4 done (Monitoring).
4. 5.6 done (DPIA-Tabelle erweiterbar).
5. **5.7 jetzt**, vor 5.3 T+0-Launch.
6. T+0 Soft-Launch triggert eigentliche Sitemap-Submission.

### Open-Questions vor Dev-Start

1. **DNS-Provider-Zugang:** Welcher Anbieter (Hetzner-Console, INWX, ...)? Owner-Zugang verfügbar? **Default:** Hetzner-DNS-Console wenn Domain dort liegt. Sonst Provider-spezifischer Runbook-Step.

2. **GSC-Account-Strategie:** Privat-Google-Konto oder dediziertes? **Empfehlung dediziertes** für saubere Trennung. Owner confirmiert.

3. **IndexNow-Key-Strategie:** Owner committed Key im Repo (sichtbarer Hex-String, kein Secret-Risiko weil API nur Push erlaubt) oder ENV-only mit Build-Generierung des `static/<key>.txt`? **Empfehlung:** ENV-only + Build-Step, weil Key zwar nicht streng geheim aber Repo-Hygiene besser. User confirmiert.

4. **Monatliche Coverage-Routine-Mechanik:** Calendar-Reminder oder GitHub-Action-Issue-Auto-Open? **Empfehlung GitHub-Action** (5.1-Pattern, persistenter Audit-Trail). Owner confirmiert.

5. **IndexNow-Auto-Push aus GH-Action:** Stretch oder Pflicht? **Empfehlung Stretch** Phase 3, MVP ist manueller `pnpm seo:indexnow`-Trigger. User confirmiert.

### Stigma + Editorial-Disziplin

- Runbook: faktisch, kein SEO-Hype („boost rankings", „dominate search").
- Cadence-Notiz: realistisch („Long-Tail-Indexing dauert 2-6 Monate"), kein „instant indexing"-Versprechen.
- IndexNow-Doku: technisch-präzise, kein „push your URLs to billions of users"-Marketing-Slop.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2315-L2342`
- Story 2.1: `_bmad-output/implementation-artifacts/2-1-seo-foundation-sitemap-canonical-robots-txt.md` (Sitemap + robots)
- Story 2.11: `_bmad-output/implementation-artifacts/2-11-static-hero-landing-atlas-move-explore.md` (phase.ts)
- Story 2.13: `_bmad-output/implementation-artifacts/2-13-updates-route-rss-categories-jsonld.md` (Updates-Route)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (ADR-016)
- Story 5.3: `_bmad-output/implementation-artifacts/5-3-launch-sequencing-plan-channel-material.md` (Launch-Plan T+0)
- Story 5.4: `_bmad-output/implementation-artifacts/5-4-post-launch-monitoring-eu-foss.md` (Sitemap-Monitor)
- Story 5.6: `_bmad-output/implementation-artifacts/5-6-gdpr-dpia-dokument-beratungs-asset.md` (DPIA-Tabelle)
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `project_server_purchase_sequencing.md`, `project_atlas_explore_route.md`
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters
- IndexNow: https://www.indexnow.org/documentation
- Bestand Sitemap: `src/routes/sitemap.xml/+server.ts`, `src/routes/sitemap-de.xml/+server.ts`
- Bestand Robots: `src/routes/robots.txt/+server.ts`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
