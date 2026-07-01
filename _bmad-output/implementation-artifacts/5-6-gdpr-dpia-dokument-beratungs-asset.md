# Story 5.6: GDPR-DPIA-Dokument als Beratungs-Asset

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Bürger mit Datenschutz-Sensibilität und Owner mit Hebel-#2-Ambition (mtc-Beratungslinie),
I want eine Datenschutz-Folgenabschätzung nach DSGVO Art. 35 als öffentlich einsehbares prerenderte Page (`/datenschutz/folgenabschaetzung`) plus statisches PDF-Asset (`static/brand/dpia.pdf`) plus MetaFooter-Sublink unter „Datenschutz", die die Verarbeitungs-Beschreibung, Notwendigkeits-/Verhältnismäßigkeits-Bewertung, Risikobetrachtung, technische und organisatorische Maßnahmen (Art. 32), Restrisiko-Bewertung und Verantwortlicher-Block belegbar dokumentiert und auf konkrete Repo-Evidence (ADR-004 Cookieless, ADR-017 Monitor-Wahl, Drill-Output aus 5.5, Hetzner-EU-Hosting aus 4.1) verweist,
so that Compliance-Showcase glaubwürdig steht, mtc-Beratungslinie ein konkretes Asset zum Zeigen hat, und die DPIA-Argumentation („sehr niedriges Restrisiko wegen cookieless + keine PII + Aggregate-only") nicht als Marketing-Behauptung sondern als belegbare Aussage liest.

## Probleme heute

1. **DPIA fehlt komplett.** Story 4.6 hat Datenschutz-Page (`/datenschutz`) nach DSGVO Art. 13 angelegt, ABER eine Folgenabschätzung nach Art. 35 ist eigene Pflicht-Dokumentation für Verarbeitungen mit potenziell hohem Risiko (Geolocation-Adress-Lookup ist genau so ein Grenzfall: Adresse + IP via Geocoder = personenbezogene Verarbeitung). Solo-Maintainer-Sicht: DPIA ist nicht streng Pflicht (Verhältnismäßigkeit), aber als Beratungs-Asset + Compliance-Showcase macht sie den Unterschied zwischen „glaubt mir" und „hier ist das Dokument".
2. **Hebel-#2-mtc-Beratungslinie hat heute KEIN belegbares Show-Case-Asset.** Story 5.3 LinkedIn-Long-Form sagt „GDPR-DPIA dokumentiert", aber bislang ist das nur ein Versprechen. DPIA-Dokument konkretisiert das.
3. **PDF-Asset fehlt.** Press-Anfragen, Beratungs-Kunden, externer Auditor wollen 1 PDF-Link auf E-Mail-Server-Vortrag oder Slide-Deck. HTML-Page reicht nicht für Audit-Trail.
4. **Cross-References auf konkrete Repo-Evidence sind unstrukturiert.** ADR-004 Cookieless, ADR-017 Monitor-Wahl, 5.5 Drill-Output, 4.1 Hetzner-EU sind alle da, aber nirgends als zusammenhängende Compliance-Story dokumentiert. DPIA bündelt das.
5. **Restrisiko-Begründung ist heute nirgends versioniert.** Argumentation „sehr niedrig" muss belegt sein, nicht behauptet. DPIA-Page macht das auditierbar.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2289-2313.
- Memory `project_i18n_phase_1_de_only.md`: EN-Variante (Epic-AC „DE+EN") wird zu **DE-only Phase 1**. EN-DPIA = Phase-3-Folge-Story.
- Memory `feedback_no_em_dashes.md`: keine em-dashes in DPIA-Body.
- Memory `feedback_no_lebenswert.md`: nicht relevant für DPIA-Text, aber Stigma-Lint sollte gegen DPIA-Page laufen.
- Memory `project_server_purchase_sequencing.md`: Hetzner CPX22 Phase-2-Beta-Setup. DPIA verweist auf Hetzner-EU-Hosting (Frankfurt) als TOM.
- Memory `project_atlas_explore_route.md`: Atlas auf `/explore`, statische Landing auf `/`. DPIA verweist auf URL-Topologie.
- Skill `no-ai-slop`: DPIA-Body ist juristisch-redaktioneller Text. Aktive Verben, kurze Sätze, keine Marketing-Floskeln.
- Skill `de-konzept-erstellung`: deutsche Geschäftsprosa, Pflicht-Level für DPIA.
- Story 4.6 (ready-for-dev): Datenschutz-Page nach Art. 13 als Parent-Page. DPIA ist Sub-Route `/datenschutz/folgenabschaetzung`. 4.6 MUSS done vor 5.6, weil DPIA auf Datenschutz-Page-Bookmark-Snippet + Postgres-Hybrid-Erklärung verweist.
- Story 4.1 (ready-for-dev): Hetzner CPX22 + Coolify + Postgres-Internal-Network. DPIA-TOM-Sektion verweist.
- Story 4.2 (ready-for-dev): Strict-CSP + TLS + CrowdSec + IP-Pseudonymisierung + GPG-Backup-Encryption. DPIA-TOM-Sektion verweist.
- Story 4.3 (ready-for-dev): CI-Gates inkl. Cookie-Leak-Check (NFR-PR1). DPIA-TOM-Sektion verweist.
- Story 4.4 (ready-for-dev): DR-Runbooks inkl. `postgres-restore.md`. DPIA-TOM-Sektion verweist.
- Story 5.1 (ready-for-dev): Update-Cadence-ADR. DPIA-Org-TOM-Sektion verweist auf Daten-Refresh-Disziplin als Aktualitäts-Garantie.
- Story 5.4 (ready-for-dev): ADR-017 Monitor-Wahl. DPIA-Sektion „Externe Dienstleister" verweist explizit auf healthchecks.io-EU + UptimeRobot-Fallback-Begründung.
- Story 5.5 (ready-for-dev): Backup-Restore-Drill-Output. DPIA-Sektion Art. 32 TOM zitiert Drill-RTO als gemessene Recovery-Evidence.
- Story 5.2 (ready-for-dev): Brand-Asset-Pack. DPIA-PDF wird optional via Brand-Asset-Pipeline als `static/brand/dpia.pdf` ausgespielt.
- ADR-004: `docs/adr/ADR-004-cookieless.md`. DPIA-Kern-Argumentation.
- Bestand Datenschutz-Page: `src/routes/(with-header)/datenschutz/+page.svelte` (von Story 4.6).
- Bestand MetaFooter: `src/lib/components/atlas/meta-footer.svelte` (Story 4.6 ergänzt Anchors).
- Bestand SEO: `src/lib/components/atlas/seo-head.svelte` (Story 2.1).
- Bestand Sitemap: `src/lib/seo/sitemap-builder.ts` `ALL_SOURCES`-Registry.
- Bestand Contact: `src/lib/utils/contact.ts:1` `FEEDBACK_EMAIL = 'hey@navigator.berlin'`.
- Berliner Datenschutzbeauftragte (BlnBDI): https://www.datenschutz-berlin.de — Cross-Reference für Beschwerdepfad.

## Akzeptanz-Kriterien

1. **AC-1 (DPIA-Page `/datenschutz/folgenabschaetzung`):**
   **Given** Datenschutz-Page existiert (Story 4.6), Sub-Route fehlt.
   **When** ich `src/routes/(with-header)/datenschutz/folgenabschaetzung/+page.svelte` und `+page.ts` anlege.
   **Then**:
   - `+page.ts`: `export const prerender = true;`.
   - Page-Layout: max-width 72ch (UX-DR43 Long-Form), Plex-Serif h1 + Plex-Sans Body, Plex-Mono für Cross-References.
   - **Sektionen (in Reihenfolge):**
     1. **Einleitung + Geltungsbereich** (2-3 Absätze): Was ist eine DPIA, warum ist sie hier freiwillig (keine strikte Art-35-Pflicht weil Aggregate-only-Verarbeitung), warum trotzdem dokumentiert (Transparenz + Compliance-Showcase).
     2. **Verantwortlicher** (Art. 35 Abs. 7 lit. a): „Matze Schmidbauer, Berlin, hey@navigator.berlin" (gleich wie Impressum + Datenschutz).
     3. **Beschreibung der Verarbeitungsvorgänge** (Art. 35 Abs. 7 lit. a): drei Hauptverarbeitungen:
        - **Adress-Lookup via Geocoding-Proxy:** Nutzer gibt Adresse ein, Server-Proxy ruft Nominatim mit IP-Anonymisierung, LRU-Cache 1000 Einträge, Rate-Limit 1 req/s. Personenbezug: User-IP wird auf `/24` getrunkiert vor Nominatim-Call. Aggregat-Output keine PII.
        - **Karten-Render mit MapLibre:** Tiles werden vom Hetzner-CDN (eigener Tile-Server) ausgespielt. Keine Embed-Drittanbieter. Personenbezug: keine, MapLibre rendert clientseitig ohne externe Calls.
        - **Aggregat-Daten-Visualisierung:** Klima/Lärm/Wohnlagen/Verkehr/Geschichte sind statische LOR-/Bezirks-Aggregate aus Berlin-Open-Data, KEINE Adress-genauen PII. Personenbezug: indirekt über Adress-Lookup (User wählt Punkt = User-Interesse, aber wird nicht persistiert).
     4. **Notwendigkeit + Verhältnismäßigkeit** (Art. 35 Abs. 7 lit. b): kurz fassen warum die Verarbeitung notwendig ist (Site-Funktion = Adress-bezogene Daten-Visualisierung) und warum sie verhältnismäßig ist (keine Alternative ohne Geocoding möglich, IP-Anonymisierung + Cache + Rate-Limit als Verhältnismäßigkeits-Stellschrauben).
     5. **Risiken für Rechte und Freiheiten Betroffener** (Art. 35 Abs. 7 lit. c): Risiko-Matrix mit 4 Risiken:
        - **R1 IP-Adress-Leak an Nominatim:** Eintrittswahrscheinlichkeit = niedrig (IP-Truncation greift vor Outbound-Call), Schadens-Schwere = niedrig (truncated-IP ist nicht-personenbezogen). **Gesamt: sehr niedrig.**
        - **R2 Adress-Eingabe als sensible Information** (z.B. politisch sensible Adresse): Eintrittswahrscheinlichkeit = mittel (User kann Adresse eingeben), Schadens-Schwere = niedrig (Server-Seite speichert keine User-Sessions, kein Tracking, kein Log mit Adress-Query nach Rotation). **Gesamt: niedrig.**
        - **R3 Cache-Hit-Pattern-Identifikation:** Eintrittswahrscheinlichkeit = sehr niedrig (LRU-Cache ist server-side, nicht user-attributable). Schadens-Schwere = sehr niedrig. **Gesamt: vernachlässigbar.**
        - **R4 Bookmarks im LocalStorage:** Eintrittswahrscheinlichkeit = mittel (User entscheidet aktiv für Bookmark), Schadens-Schwere = niedrig (lokaler Speicher, nicht Server-übertragen). **Gesamt: niedrig.** TDDDG §25 Abs. 2 Nr. 2-Ausnahme greift.
     6. **Abhilfemaßnahmen (Art. 32 + Art. 35 Abs. 7 lit. d):** 12 konkrete TOMs als nummerierte Liste mit Cross-Reference auf Repo-Evidence:
        - TOM 1 Cookieless (kein `Set-Cookie`): ADR-004, CI-Gate Cookie-Leak-Check (Story 4.3).
        - TOM 2 IP-Truncation `/24` vor Nominatim-Call: Architecture `GET /api/geocode`-Spec.
        - TOM 3 IP-Pseudonymisierung Traefik-Access-Logs: Story 4.2, Story 5.4 AC-5.
        - TOM 4 7-Tage-Log-Retention: Story 5.4 AC-5.
        - TOM 5 Postgres-Internal-Network only: Story 4.1.
        - TOM 6 Strict-CSP (script-src self, no inline): Story 4.2.
        - TOM 7 TLS 1.3 + HSTS: Story 4.2 + Let's-Encrypt aus 4.1.
        - TOM 8 CrowdSec-Brute-Force-Protection: Story 4.2.
        - TOM 9 GPG-verschlüsselte Postgres-Backups + Off-Server-Storage-Box: Story 4.1 + 4.2.
        - TOM 10 Backup-Restore-Drill halbjährlich (RTO < 30 Min): Story 5.5 Drill-Output + ADR-016-Cadence-Erweiterung.
        - TOM 11 Externes Monitoring server-zu-server (keine PII-Flows): Story 5.4 ADR-017 + healthchecks.io-EU-Wahl.
        - TOM 12 EU-FOSS-Hosting (Hetzner Frankfurt CPX22): Story 4.1 + ADR-018 (falls vergeben) oder Architecture-Doku.
     7. **Externe Dienstleister + Auftragsverarbeitungs-Status:** Liste mit Anbietern, Standorten, Rechtsgrundlage:
        - **Hetzner Online GmbH** (Frankfurt, DE): Hosting-Provider. AV-Vertrag nach Art. 28 DSGVO geschlossen oder zu schließen vor Hard-Launch.
        - **Coolify** (Self-Hosted, EU): Container-Orchestrierung. KEIN AV-Vertrag nötig (Self-Hosted auf Hetzner-VM).
        - **healthchecks.io** (FOSS, EU-Option `hc-ping.eu` oder US-Standard): Uptime-Monitoring. Server-zu-Server-Ping, kein User-Daten-Flow. Wenn US-Variante genutzt: Art. 6 Abs. 1 lit. f DSGVO berechtigtes Interesse Betreiber + Standardvertragsklauseln (EU-US-Datentransfer).
        - **UptimeRobot** (US, Fallback): nur Server-zu-Server, kein User-Daten-Flow. Art. 6 Abs. 1 lit. f.
        - **Nominatim/OSM** (DE/EU-OpenStreetMap-Foundation): Geocoding-Provider. KEINE PII-Übermittlung dank IP-Truncation. Art. 6 Abs. 1 lit. f.
        - **GitHub** (US, Microsoft): Code-Hosting. KEINE User-Daten von navigator.berlin auf GitHub. Codebase-only. Art. 6 Abs. 1 lit. f.
     8. **Restrisiko-Bewertung** (Art. 35 Abs. 7 lit. d): nach 12 TOMs **vernachlässigbar**. Begründung 2 Absätze. KEIN „Null-Risiko"-Anspruch (rechtlich unhaltbar), sondern „nach Stand der Technik + Verhältnismäßigkeit minimiert".
     9. **Konsultation der Aufsichtsbehörde** (Art. 36 Abs. 1): NICHT erforderlich, weil Restrisiko vernachlässigbar. Vermerkt mit Begründung.
     10. **Stand + Aktualisierungs-Cadence:** Datum letzte Überprüfung (commit-Datum), Cadence-Lock (jährliche Überprüfung + ad-hoc bei wesentlichen Verarbeitungsänderungen). Cross-Reference auf Story 5.1 ADR-016 + Story 5.5 ADR-Cadence-Erweiterung.
     11. **Beschwerdepfad:** Verweis auf Berliner Beauftragte für Datenschutz und Informationsfreiheit (BlnBDI), `https://www.datenschutz-berlin.de`.
   - **Komponente:** ≤ 400 LOC. Wenn länger: Subkomponenten `dpia-tom-list.svelte`, `dpia-risk-matrix.svelte`, `dpia-providers-table.svelte` extrahieren.
   - **Plain HTML / Svelte-Markup**, KEINE Markdown-Renderer-Dependency (wartbarer als MD-Parser-Stack).

2. **AC-2 (PDF-Export `static/brand/dpia.pdf`):**
   **Given** Press + Beratungs-Anfragen wollen PDF-Asset.
   **When** ich PDF aus Page-Source generiere.
   **Then**:
   - **Pfad:** `static/brand/dpia.pdf` (analog Story 5.2 `press-kit-1pager.pdf`-Pattern, in Brand-Verzeichnis).
   - **Inhalt:** identisch zur Page (alle 11 Sektionen).
   - **Format:** A4-Portrait, Plex-Serif Heading, Plex-Sans Body, Plex-Mono Code-References, schwarzer Text auf Cloud-Dancer (`--bg`), drucker-freundlich.
   - **Build-Pipeline-Wahl:** drei Optionen, Owner-Entscheidung in Open-Question 1:
     - **A) Pandoc + Markdown-Source:** schreibe Page-Inhalt zusätzlich als `docs/dpia.md`, Pipeline-Step `pandoc docs/dpia.md -o static/brand/dpia.pdf --pdf-engine=xelatex --variable=mainfont:"IBM Plex Serif"`. Vorteil: reproducible, versioned. Nachteil: pandoc + xelatex als Build-Dependency.
     - **B) Browser-Print-Export:** öffne `/datenschutz/folgenabschaetzung` in Chrome/Firefox, Print → Save as PDF mit Plex-Font-Embed. Vorteil: kein Build-Stack. Nachteil: manuelle Reproduktion, nicht reproducible in CI.
     - **C) Playwright PDF-Export:** Playwright-Skript `scripts/build-dpia-pdf.ts` rendert Page, exportiert PDF via `page.pdf({ format: 'A4' })`. Vorteil: reproducible + scriptbar in CI. Nachteil: Playwright als Build-Dep (ist eh schon Test-Dep).
     - **Empfehlung Option C** weil Playwright bereits Test-Dep ist + reproducible + Pipeline-friendly.
   - **PDF-Größe:** ≤ 600 KB.
   - **NPM-Script:** `pnpm build:dpia-pdf` als Convenience-Wrapper.
   - **Test:** `scripts/build-dpia-pdf.test.ts` prüft File-Existenz + Page-Count ≥ 6.

3. **AC-3 (MetaFooter-Sublink):**
   **Given** Story 4.6 hat MetaFooter um `/datenschutz`-Link erweitert.
   **When** ich DPIA-Sublink ergänze.
   **Then**:
   - **Option A (kompakt):** `/datenschutz`-Footer-Link bleibt unverändert, DPIA-Verweis nur INSIDE Datenschutz-Page als prominenter Anchor („Vollständige DSGVO-Folgenabschätzung → /datenschutz/folgenabschaetzung").
   - **Option B (expansiv):** zusätzlicher Footer-Anchor „DSGVO-Folgenabschätzung" als 8. Footer-Link.
   - **Empfehlung Option A** weil MetaFooter sonst zu dicht wird (Story 4.6 hat schon 7 Anchors: Methodik · Lizenzen · Datenschutz · Impressum · Barrierefreiheit · Architektur · Kontakt).
   - **Implementation:** `src/routes/(with-header)/datenschutz/+page.svelte` (Story 4.6) am Ende um Anchor-Block ergänzen, der auf `/datenschutz/folgenabschaetzung` verweist. Story 4.6 mit Cross-Ref-Note.
   - **Stretch:** wenn User Option B will, MetaFooter-Anchor zwischen „Datenschutz" und „Impressum" einfügen, 4.6-Footer-Test um 1 Case erweitern.

4. **AC-4 (SEO + Structured Data):**
   **Given** DPIA-Page ist öffentliches Compliance-Dokument.
   **When** ich `<svelte:head>` befülle.
   **Then**:
   - **Title:** „DSGVO-Folgenabschätzung · navigator.berlin".
   - **Meta-Description:** 1-Satz-Zusammenfassung („Datenschutz-Folgenabschätzung nach DSGVO Art. 35 für navigator.berlin. Cookieless, EU-FOSS, Aggregate-only, Restrisiko vernachlässigbar.").
   - **Canonical:** `https://navigator.berlin/datenschutz/folgenabschaetzung`.
   - **JSON-LD `WebPage`:** minimal (`@context`, `@type`, `name`, `url`, `inLanguage: de`).
   - **JSON-LD `Article`** als Stretch: `@type: Article`, `headline`, `author: {@type: Person, name: 'Matze Schmidbauer'}`, `datePublished`, `dateModified`. Suchmaschinen-Discoverable.
   - **Robots-Meta:** `index, follow` (Pflicht-Discoverable).
   - **hreflang:** NUR DE Phase 1, kein EN-Pendant.
   - **`og:image`:** `static/brand/og-default.png` aus Story 5.2 als Fallback.

5. **AC-5 (Sitemap-Integration):**
   **Given** Story 2.1 Sitemap-Source-Pattern + ALL_SOURCES Registry.
   **When** ich DPIA-Page in Sitemap aufnehme.
   **Then**:
   - Neue Source `src/lib/seo/sources/compliance-pages.ts` exportiert `COMPLIANCE_PAGES_SOURCE: SitemapSource` mit Einträgen für `/datenschutz/folgenabschaetzung` (priority 0.4, lastmod aus File-Mtime).
   - Registrierung in `ALL_SOURCES`-Array in `src/lib/seo/sitemap-builder.ts:131`.
   - Wenn Story 4.6 schon eine `COMPLIANCE_PAGES_SOURCE` hat: 5.6 ERWEITERT diese um `/datenschutz/folgenabschaetzung`-Eintrag (keine Doppel-Source).
   - Test: `compliance-pages.test.ts` prüft Eintrag-Existenz + Priority + lastmod-Form.

6. **AC-6 (Accessibility):**
   **Given** WCAG 2.2 AA Pflicht (NFR-A1) + DPIA ist Long-Form-Text.
   **When** Page geladen wird.
   **Then**:
   - Skip-Link „Direkt zum Inhalt" (Bestand aus Layout).
   - h1 als Page-Outline-Start, h2 pro Sektion (11 Sektionen).
   - Risiko-Matrix als `<table>` mit `<th scope="col">`-Headers + caption.
   - TOM-Liste als geordnete `<ol>` mit semantischen `<li>`-Items.
   - Externe Dienstleister als `<table>` mit Spalten Anbieter / Standort / Rechtsgrundlage.
   - Cross-Reference-Links mit `aria-label` falls Link-Text knapp ist („ADR-004" → aria-label „ADR-004 Cookieless").
   - `axe`-Audit 0 Violations (E2E-Test).
   - Reading-Level: B2-Stufe Deutsch, KEIN Juristen-Latein („mithin", „infolgedessen") außer wo unvermeidlich für DSGVO-Zitat-Präzision.

7. **AC-7 (DPIA-Konsistenz-Check gegen Repo-Evidence):**
   **Given** TOM-Liste verweist auf konkrete Repo-Artefakte.
   **When** ich Konsistenz prüfe.
   **Then**:
   - **Test** `tests/integration/dpia-evidence-consistency.test.ts`:
     - TOM 1 Cookieless → verifiziert dass `docs/adr/ADR-004-cookieless.md` existiert.
     - TOM 2 IP-Truncation → verifiziert dass `src/lib/utils/geocode.remote.ts` (oder Server-Geocode-Datei) IP-Truncation enthält (grep-Pattern).
     - TOM 10 Backup-Restore-Drill → verifiziert dass mindestens 1 `docs/runbooks/restore-drill-*.md` existiert (nach 5.5-Drill).
     - TOM 11 healthchecks.io → verifiziert dass `docs/adr/ADR-017-uptime-monitoring.md` existiert (nach 5.4).
     - TOM 12 EU-FOSS-Hosting → verifiziert dass Architecture-Doku „Hetzner Frankfurt CPX22" enthält.
   - Test fail = DPIA-Page enthält ein TOM ohne Repo-Evidence = Konsistenz-Bruch = blocker.

8. **AC-8 (Phase-1-DE-only-Lock):**
   **Given** Memory `project_i18n_phase_1_de_only.md`.
   **When** ich Doku schreibe.
   **Then**:
   - Page: NUR DE.
   - PDF: NUR DE.
   - `messages/de.json` für minimale UI-Strings (z.B. Sektion-Titel) wenn Paraglide-Setup-Reduce aus 3.1 gemerged ist, sonst hardcoded DE (Story-2.11-Pattern).
   - **EN-DPIA-Folge-Story** `5-6.1-dpia-en-variante` deferred Phase 3 Post-Hard-Launch.
   - Epic-AC sagt „DE+EN verfügbar (NFR-PR6)" → wird mit Phase-1-Lock-Note ÜBERSCHRIEBEN, EN-Refresh-Folge-Story angelegt.

9. **AC-9 (Datenschutz-Page-Cross-Reference):**
   **Given** Story 4.6 Datenschutz-Page existiert.
   **When** ich DPIA von Datenschutz-Page verlinke.
   **Then**:
   - Story 4.6 Datenschutz-Page am Ende: neuer Sektions-Block „Weiterführend" mit Anchor zur DPIA-Page.
   - Wording: „Ergänzend zu dieser Datenschutzerklärung dokumentiert die DSGVO-Folgenabschätzung die Verarbeitungs-Risiken und technischen Maßnahmen im Detail. → /datenschutz/folgenabschaetzung"
   - Cross-Reference-Test: `tests/integration/datenschutz-dpia-link.test.ts` prüft dass Datenschutz-Page-Render den DPIA-Anchor enthält.
   - **Sequencing:** 4.6 MUSS done sein. 5.6 modifiziert die existierende Page (kleiner Diff), keine Race-Condition.

10. **AC-10 (TDD-Mandat + Lint-Gates):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Komponenten-Test** `+page.svelte.test.ts`: Render-Smoke, h1-Existenz, „Matze Schmidbauer"-String, TOM-Liste-Count ≥ 12.
    - **Snapshot-Test** für JSON-LD-Output.
    - **Integration-Test** `dpia-evidence-consistency.test.ts` (siehe AC-7).
    - **Integration-Test** `datenschutz-dpia-link.test.ts` (siehe AC-9).
    - **E2E-Test** `tests/e2e/dpia-flow.e2e.ts`: Page-Load + axe-Check + PDF-Download-Anchor-Existenz.
    - **Markdown-Lint** auf DPIA-Body: em-dash-Check, Stigma-Wortliste (kein „lebenswert"), Reading-Level-Heuristik (Stretch).
    - **Build-Step** `pnpm build:dpia-pdf` als CI-Step, PDF-Existenz nach Build verifizieren.

11. **AC-11 (Aktualisierungs-Cadence-ADR-Erweiterung):**
    **Given** DPIA-Aktualität ist Pflicht (Art. 35 Abs. 11 DSGVO).
    **When** ich Cadence dokumentiere.
    **Then**:
    - Erweiterung der ADR-016-Sektion (oder ADR-018) um „DPIA-Aktualisierungs-Cadence (jährlich + ad-hoc)".
    - **Pflicht:** jährliche Überprüfung. Calendar-Reminder oder GitHub-Action-Issue-Auto-Open.
    - **Ad-hoc-Trigger:** wesentliche Verarbeitungsänderung (neue externe Dienstleister, neue PII-Verarbeitung, Wechsel des Hosting-Providers, Hinzufügen von User-Accounts oder UGC).
    - Cross-Reference aus DPIA-Page Sektion 10 auf diese ADR-Sektion.

12. **AC-12 (Owner-Kontakt + Beschwerdepfad):**
    **Given** Art. 35 Abs. 7 lit. a + Beschwerdepfad nach Art. 77.
    **When** ich Kontakt-Block schreibe.
    **Then**:
    - **Verantwortlicher:** „Matze Schmidbauer, Berlin, hey@navigator.berlin" (identisch zu Impressum + Datenschutz).
    - **Beschwerdepfad:** Verweis auf BlnBDI mit URL + Postadresse (`https://www.datenschutz-berlin.de` + Friedrichstr. 219, 10969 Berlin).
    - **Mailto-Link** mit Subject `?subject=DPIA-Anfrage` für direkten Kontakt.

## Tasks / Subtasks

- [ ] **T1: DPIA-Page schreiben** (AC: 1, 6, 8)
  - [ ] T1.1: Co-Design-Session mit User: 11 Sektionen-Wording, Risiko-Matrix-Bewertungen, TOM-Cross-References finalisieren.
  - [ ] T1.2: `src/routes/(with-header)/datenschutz/folgenabschaetzung/+page.ts` mit `prerender = true`.
  - [ ] T1.3: `src/routes/(with-header)/datenschutz/folgenabschaetzung/+page.svelte` mit 11 Sektionen.
  - [ ] T1.4: Optionale Subkomponenten `dpia-tom-list.svelte`, `dpia-risk-matrix.svelte`, `dpia-providers-table.svelte` wenn Page > 400 LOC.
  - [ ] T1.5: Komponenten-Test mit h1 + TOM-Count + Strings.
  - [ ] T1.6: Markdown-Lint + Stigma-Pass.

- [ ] **T2: SEO + Structured Data + Sitemap** (AC: 4, 5)
  - [ ] T2.1: `<svelte:head>` mit Title + Canonical + JSON-LD `WebPage` + `Article` + OG.
  - [ ] T2.2: `src/lib/seo/sources/compliance-pages.ts` erweitern oder neu anlegen mit `/datenschutz/folgenabschaetzung`-Eintrag.
  - [ ] T2.3: `ALL_SOURCES`-Registrierung in `sitemap-builder.ts:131`.
  - [ ] T2.4: Snapshot-Test für JSON-LD.

- [ ] **T3: PDF-Export-Pipeline** (AC: 2)
  - [ ] T3.1: Option C umsetzen: `scripts/build-dpia-pdf.ts` mit Playwright-PDF-Export.
  - [ ] T3.2: NPM-Script `pnpm build:dpia-pdf`.
  - [ ] T3.3: PDF in `static/brand/dpia.pdf` committed.
  - [ ] T3.4: PDF-Size-Test + Page-Count-Test.
  - [ ] T3.5: CI-Step für PDF-Build (optional, wenn Build-Pipeline-Time akzeptabel).

- [ ] **T4: Datenschutz-Page-Cross-Reference** (AC: 3, 9)
  - [ ] T4.1: Story 4.6 `src/routes/(with-header)/datenschutz/+page.svelte` am Ende um „Weiterführend"-Sektion erweitern (kleiner Diff).
  - [ ] T4.2: Anchor zu `/datenschutz/folgenabschaetzung` mit kurzem Lead-Text.
  - [ ] T4.3: Integration-Test `datenschutz-dpia-link.test.ts`.

- [ ] **T5: Evidence-Konsistenz-Test** (AC: 7)
  - [ ] T5.1: `tests/integration/dpia-evidence-consistency.test.ts` mit 5+ Repo-Pfad-Checks (ADR-004, IP-Truncation-grep, restore-drill-File-Existenz, ADR-017, Architecture-Hetzner-String).
  - [ ] T5.2: Test-Skip-Logic: wenn 5.4/5.5 noch nicht done → Test markiert betreffende Asserts als pending mit klarer Fehlermeldung.

- [ ] **T6: Cadence-ADR-Erweiterung** (AC: 11)
  - [ ] T6.1: ADR-016 (oder ADR-018) Erweiterung um DPIA-Cadence-Sektion.
  - [ ] T6.2: Cross-Reference aus DPIA-Page Sektion 10.

- [ ] **T7: Owner-Kontakt + Beschwerdepfad** (AC: 12)
  - [ ] T7.1: Kontakt-Block in DPIA-Page Sektion 2 + 11.
  - [ ] T7.2: BlnBDI-Verweis mit URL + Postadresse.
  - [ ] T7.3: Mailto-Link mit DPIA-Subject.

- [ ] **T8: E2E + Final-Verifikation** (AC: 10)
  - [ ] T8.1: `tests/e2e/dpia-flow.e2e.ts` mit Page-Load + axe + PDF-Anchor.
  - [ ] T8.2: `pnpm test:unit -- --run` 100% grün.
  - [ ] T8.3: `pnpm check` 0 Errors.
  - [ ] T8.4: `pnpm build` läuft, DPIA-Page prerendert, PDF im Output.
  - [ ] T8.5: Lighthouse-Run auf DPIA-Page: A11y ≥ 95, SEO ≥ 95.
  - [ ] T8.6: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung

5.6 produziert:
- 1 Long-Form-Page (`/datenschutz/folgenabschaetzung`).
- 1 PDF-Asset (`static/brand/dpia.pdf`).
- 1 Build-Skript (`scripts/build-dpia-pdf.ts`).
- 1 Sitemap-Source-Update.
- 1 Datenschutz-Page-Cross-Reference-Patch.
- 1 ADR-Cadence-Erweiterung.
- 3-5 Test-Files.
- 0-3 Subkomponenten (falls Page > 400 LOC).

KEIN App-Code-Refactor, KEIN Auth-System, KEINE neue Daten-Verarbeitung.

### Compliance-Showcase-Disziplin

DPIA ist **belegbares Asset**, nicht Marketing-Behauptung. Jede TOM-Aussage hat Repo-Cross-Reference. Restrisiko „vernachlässigbar" ist begründet, nicht behauptet.

KEIN:
- „Null-Risiko" (rechtlich unhaltbar)
- „100% sicher" (gleicher Grund)
- „nahtlos", „best-in-class", „enterprise-grade" Marketing-Phrasen
- AI-Slop-Floskeln („leveraging cutting-edge technologies")

PFLICHT:
- Konkrete Repo-Pfade als Belege.
- DSGVO-Artikel-Zitate für rechtliche Aussagen.
- Eingestandene Restrisiken (R2 + R4 als „niedrig", nicht „null").

### Hebel-#2-Pitch-Use

DPIA-PDF wird in folgenden Channels referenziert:
- Story 5.2 Press-Kit-1-Pager: Compliance-Bullet verweist auf DPIA-URL.
- Story 5.3 LinkedIn-Long-Form: Compliance-Liste enthält „GDPR-DPIA dokumentiert" → Link auf `/datenschutz/folgenabschaetzung` oder PDF-Asset.
- Beratungs-Pitch-Slides (zukünftige Story): DPIA als „so wird mein Setup auditiert" Show-Case.
- Civic-Tech-Initiative-Anfragen: DPIA als Template für eigene Open-Source-Civic-Tech-Compliance.

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- `src/lib/components/atlas/seo-head.svelte` für `<svelte:head>` (Story 2.1).
- `src/lib/seo/sitemap-builder.ts` `SitemapSource` + `ALL_SOURCES` (Story 2.1).
- `src/lib/seo/sources/compliance-pages.ts` (falls 4.6 schon eine angelegt hat).
- `src/routes/(with-header)/datenschutz/+page.svelte` (Story 4.6) als Cross-Ref-Patch-Target.
- `src/lib/utils/contact.ts` `FEEDBACK_EMAIL`.
- `static/brand/`-Verzeichnis (Story 5.2) für PDF-Asset-Pfad.
- Playwright als Test-Dep für PDF-Export-Pipeline.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen**: DPIA-Page ≤ 400 LOC, Subkomponenten falls nötig.
- **#3 Bestehende Funktionen prüfen**: Re-Use-Liste oben.
- **#7 TypeScript strict**: SeoHead-Props + Source-Schema typed.
- **#10 Cookieless**: DPIA-Page setzt KEIN `Set-Cookie` (verifiziert via Cookie-Leak-CI-Gate aus Story 4.3).
- **#11 Kein US-Drittanbieter**: Page lädt nur lokale Assets, kein CDN.
- **#12 Provenance**: TOM-Cross-References als belegbare Compliance-Story.
- **#13 A11y-First**: Long-Form mit semantischen Tabellen + Headings + Skip-Link.
- **#14 i18n-First**: Phase-1-DE-only-Lock.
- **#20 ADR-Pflicht**: Cadence-Erweiterung als ADR-Update.
- **#21 prerender**: DPIA-Page prerendered.

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 4.6 | ready-for-dev | Datenschutz-Page als Parent. MUSS done. |
| 4.1 | ready-for-dev | Hetzner-EU-Hosting + Postgres-Internal-Network als TOM-Evidence. |
| 4.2 | ready-for-dev | Strict-CSP + IP-Pseudonymisierung + GPG-Backup als TOM-Evidence. |
| 4.3 | ready-for-dev | Cookie-Leak-CI-Gate als TOM-Evidence. |
| 4.4 | ready-for-dev | postgres-restore-Runbook als TOM-Evidence. |
| 5.1 | ready-for-dev | ADR-016 als Cadence-Erweiterungs-Ziel. |
| 5.2 | ready-for-dev | `static/brand/`-Verzeichnis für PDF-Asset. |
| 5.4 | ready-for-dev | ADR-017 Monitor-Wahl als TOM-Evidence. |
| 5.5 | ready-for-dev | Drill-Output als TOM-Evidence + Art. 32 Recovery-Beleg. |
| 2.1 | review | SeoHead + Sitemap-Source. Direkt importieren. |

**Empfehlung Reihenfolge:**
1. Epic 4 komplett done (4.1 + 4.2 + 4.3 + 4.4 + 4.6 als Compliance-Foundation).
2. 5.1 done (ADR-016-Cadence-Anker).
3. 5.2 done (Brand-Asset-Verzeichnis für PDF).
4. 5.4 done (ADR-017-TOM-Evidence).
5. 5.5 done (Drill-Output als Art. 32-Evidence).
6. **5.6 jetzt**, alle Evidence-Quellen vorhanden.

### Co-Design-Sessions (Pflicht)

Eine Co-Design-Session mit User:

1. **DPIA-Wording-Finalisierung:** alle 11 Sektionen mit User durchgehen, Risiko-Matrix-Einstufungen lockern/verschärfen, TOM-Liste auf Vollständigkeit prüfen. Owner-Verantwortlicher-Block validieren.

### Open-Questions vor Dev-Start

1. **PDF-Build-Pipeline:** Option A (Pandoc), B (Browser-Print), C (Playwright)? **Empfehlung Option C** weil reproducible + bereits Test-Dep. Owner confirmiert.

2. **MetaFooter-Sublink:** Option A (kompakt, nur via Datenschutz-Page) oder Option B (extra Footer-Anchor)? **Empfehlung Option A** weil Footer-Dichte schon hoch. User confirmiert.

3. **JSON-LD `Article`-Stretch:** soll DPIA als `Article`-Schema getaggt sein für Suchmaschinen-Author-Attribution? **Empfehlung ja** weil minimaler Mehraufwand + sinnvoller SEO-Boost. User confirmiert.

4. **Restrisiko-Stufe „vernachlässigbar":** ist das Wording angemessen oder soll „niedrig" stehen (konservativer)? **Empfehlung „niedrig"** als konservativer Anker. „Vernachlässigbar" kann als Marketing-Overreach gelesen werden. User confirmiert.

5. **DPIA-Veröffentlichungs-Strategie:** soll DPIA-Veröffentlichung im Updates-Feed (Story 2.13) als Update-Entry angekündigt werden? **Empfehlung ja**, neuer Eintrag `_content/updates/YYYY-MM-DD-dpia-published.md` als Transparenz-Move. User confirmiert.

### Stigma + Editorial-Disziplin

- DPIA-Body: faktisch, juristisch sauber, ohne Marketing-Phrasen.
- Owner-Bio-Block (in Sektion 2) verzichtet auf „passionate" / „experienced" / 3-Adjektiv-Stacks.
- Externe-Dienstleister-Tabelle: faktisch (Standort + Rechtsgrundlage), keine Wertung („best-in-class provider").
- Restrisiko-Begründung: nüchtern, ohne „100% sicher".
- Keine em-dashes, kein „lebenswert" / „Lebensqualität" (kommt in DPIA eh nicht vor, aber Stigma-Lint läuft trotzdem).

### Aktualisierungs-Disziplin

DPIA-Stand-Datum wird bei jedem inhaltlichen Update automatisch auf Commit-Datum gesetzt (git-blame-basiert oder Frontmatter-Pflicht-Update durch Owner).

Bei wesentlichen Änderungen (neue externe Dienstleister, neue PII-Verarbeitung, Hosting-Wechsel): SOFORT-Update, NICHT bis zur jährlichen Überprüfung warten. ADR-Erweiterung (T6) lockt diese Pflicht.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2289-L2313`
- Story 4.6: `_bmad-output/implementation-artifacts/4-6-compliance-pages-impressum-datenschutz-barrierefreiheit-de-en.md` (Datenschutz-Page-Parent)
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup.md` (Hetzner-EU + Postgres-Internal-Network)
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-security-hardening-tls-csp-headers-crowdsec.md` (Strict-CSP + IP-Pseudonymisierung + GPG)
- Story 4.3: `_bmad-output/implementation-artifacts/4-3-github-actions-ci-8-gates-lefthook.md` (Cookie-Leak-CI-Gate)
- Story 4.4: `_bmad-output/implementation-artifacts/4-4-adr-nachzieher-disaster-recovery-runbooks.md` (postgres-restore-Runbook)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (ADR-016-Cadence)
- Story 5.2: `_bmad-output/implementation-artifacts/5-2-brand-asset-pack-press-kit.md` (Brand-Asset-Verzeichnis)
- Story 5.4: `_bmad-output/implementation-artifacts/5-4-post-launch-monitoring-eu-foss.md` (ADR-017 Monitor-Wahl)
- Story 5.5: `_bmad-output/implementation-artifacts/5-5-backup-restore-drill-staging.md` (Drill-Output)
- ADR-004: `docs/adr/ADR-004-cookieless.md`
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `project_atlas_explore_route.md`, `project_server_purchase_sequencing.md`
- Skills `no-ai-slop`, `de-konzept-erstellung`
- BlnBDI: https://www.datenschutz-berlin.de
- Bestand SeoHead: `src/lib/components/atlas/seo-head.svelte`
- Bestand Sitemap: `src/lib/seo/sitemap-builder.ts:131` ALL_SOURCES
- Bestand Contact: `src/lib/utils/contact.ts:1`
- Bestand Datenschutz-Page (4.6-Output): `src/routes/(with-header)/datenschutz/+page.svelte`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
