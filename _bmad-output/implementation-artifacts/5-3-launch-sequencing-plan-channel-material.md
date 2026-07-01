# Story 5.3: Launch-Sequencing-Plan + Channel-Material

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Owner mit knappem Aufmerksamkeits-Budget,
I want einen dokumentierten 2-Phasen-Launch (Soft + Hard) mit pro Channel vorbereitetem Posting-Material (Slack-Markdown, Mastodon-Thread, LinkedIn-Long-Form, optional Newsletter), einem Lessons-Learned-Slot für T+30d, und einer Hebel-#2-Operationalisierung (Compliance-Showcase prominent im LinkedIn-Draft),
so that ich nicht in Launch-Improvisation falle, Resonanz-Reaktion strukturiert abgrasen kann, und die mtc-Beratungslinie sichtbar gemacht wird ohne die Persona-Trennung zwischen navigator.berlin und mtc.berlin zu zerreißen.

## Probleme heute

1. **Kein Launch-Plan dokumentiert.** Soft-Launch + Hard-Launch sind im Epic-Block als Konzept beschrieben, aber `docs/launch-plan.md` existiert nicht. Ohne T+0/T+14d/T+30d-Schedule gibt es kein Anker-Datum für Channel-Posts.
2. **Channel-Material fehlt vollständig.** Slack-Post-Markdown, Mastodon-Thread (max 4 Toots), LinkedIn-Long-Form-Draft, optional Newsletter-HTML existieren weder als Draft noch als Template. Live-Launch-Improvisation = Risiko schlechter erster Eindruck + Wording-Inkonsistenz zwischen Channels.
3. **Hebel-#2-Realisation hat keinen operativen Pfad.** Compliance-Showcase-Aspekt (cookieless, EU-FOSS-Hosting, GDPR-DPIA, ISO-Patterns) ist in PRD + Epic 4 angedacht, aber kein konkretes Pitch-Stück das eine mtc-Beratungs-Anfrage triggern kann.
4. **Resonanz-Bilanz hat keinen Slot.** T+30d-Lessons-Learned-Datei existiert nicht. Ohne strukturierten Slot verpufft anekdotische Resonanz.
5. **Posting-Disziplin ohne Lock.** Auto-Publish wäre falsch (Resonanz-Reaktion soll individuell sein). Ohne explizite Lock-Notiz kann Folge-Person/Folge-Sprint denken „lasst uns das automatisieren" und damit den Channel-Ton zerstören.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 2215-2240.
- Memory `project_i18n_phase_1_de_only.md`: Channel-Material **DE-only Phase 1**. EN-Pendants Phase 3.
- Memory `feedback_no_em_dashes.md`: keine em-dashes (U+2014) in Channel-Posts.
- Memory `feedback_no_lebenswert.md`: kein „lebenswert/Lebensqualität" in Posts.
- Memory `project_server_purchase_sequencing.md`: Phase-1 Coming-Soon → Phase-2 Beta → Phase-3 Hard. Soft-Launch = Phase 2 Übergang, Hard-Launch = Phase 3 Aktivierung.
- Memory `project_atlas_explore_route.md`: Atlas auf `/explore`, Brand-Lander auf `/`. Channel-Posts verlinken auf `/` als Einstieg (NICHT direkt auf `/explore`).
- Skill `no-ai-slop`: Channel-Posts brauchen redaktionelle Prosa. Keine Marketing-Floskeln, keine LinkedIn-Slop-Phrasen („I'm excited to announce", „game-changer", „revolutionary").
- Skill `de-konzept-erstellung`: deutsche Geschäftsprosa-Disziplin. Aktive Verben, kurze Sätze, kein Calque-Deutsch.
- Story 5.2 (ready-for-dev): Brand-Asset-Pack + Press-Kit. 5.3 KONSUMIERT 5.2-Assets (Wortmarke, OG-Default, LinkedIn-Banner, 1-Pager-PDF). 5.2 MUSS vor 5.3 done sein.
- Story 5.4 (backlog): Post-Launch-Monitoring. 5.3 T+30d-Bilanz konsumiert evtl. 5.4-Metrik-Snapshots.
- Story 5.7 (backlog): Sitemap-Submission + Search-Console-Setup. Soft-Launch-T+0 triggert Sitemap-Submission.
- Story 5.8 (ready-for-dev): Public-Update-Skill. Launch-Posts können als erstes Update-Entry in `_content/updates/` landen.
- Story 4.6 (ready-for-dev): Impressum/Datenschutz/Barrierefreiheit. LinkedIn-Long-Form verweist auf `/datenschutz` als Compliance-Beleg.
- Story 4.7 (ready-for-dev): Architektur-Page. LinkedIn-Long-Form verweist auf `/architektur` als EU-FOSS-Showcase.
- Story 2.13 (review, merged 2026-05-16): Updates-Route. Launch kann als Update-Entry `_content/updates/YYYY-MM-DD-launch.md` getrackt werden. Bereits 1 Entry vorhanden (`2026-05-16-launch.md` aus 2.13-Initial-Content).
- Bestand Contact: `src/lib/utils/contact.ts` `FEEDBACK_EMAIL = 'hey@navigator.berlin'`.
- Bestand User-Input: `_user-input/`-Verzeichnis existiert mit 5 Recherche-Dateien (Design, Logo, Projekt-Analyse). Channel-Material lands in `_user-input/launch-material/`.

## Akzeptanz-Kriterien

1. **AC-1 (Launch-Plan-Dokument `docs/launch-plan.md`):**
   **Given** Site-Production-Live nach Epic 4 abgeschlossen.
   **When** ich `docs/launch-plan.md` als Owner-Runbook anlege.
   **Then** Doku enthält:
   - **Frontmatter:** `status: draft`, `date: 2026-05-16`, `owner: Matze Schmidbauer`.
   - **Sektion T-7d Pre-Launch-Check:** 8-10 Items als Markdown-Checkliste (Domain-DNS-Sanity, Sitemap reachable, robots.txt-Phase-3-Stand, OG-Asset-Render, Lighthouse-Mobile-Score ≥ 90, alle critical-path Tests grün, Backup-Drill aus Story 5.5 gelaufen, GDPR-DPIA-Asset aus Story 5.6 verfügbar).
   - **Sektion T+0 Soft-Launch (Phase 2 Beta-Aktivierung):** Datum + Uhrzeit (Owner-Lock vor Dev-Start), Channel-Liste:
     - Civic-Tech-Slack (Code-for-Berlin oder OK Lab Berlin): Single-Markdown-Post + Reply-Hooks für Q&A.
     - Mastodon (Account-Handle TBD, Hashtags `#civictech`, `#berlin`, `#opendata`): Thread max 4 Toots.
     - Friends + Family DM (manuell, kein Asset).
     - NAVIGATOR_PHASE-ENV-Flip auf `beta` + Coolify-Re-Deploy (Operationaler Schritt, NICHT Asset).
   - **Sektion T+14d Hard-Launch (Phase 3 Aktivierung):** Datum + Uhrzeit, Channel-Liste:
     - LinkedIn (Matze-Profil + Tag mtc.berlin / Hashtag `#mtcberlin`): Long-Form-Post mit OG-Image aus Story 5.2.
     - Newsletter (wenn Newsletter-Liste existiert, sonst SKIP): HTML-Variante.
     - Mastodon-Boost des Original-Threads + neuer Thread mit Hard-Launch-Framing.
     - NAVIGATOR_PHASE-ENV-Flip auf `hard` + Coolify-Re-Deploy.
     - Sitemap-Submission an Google Search Console (Story 5.7) + Bing Webmaster Tools.
   - **Sektion T+30d Bilanz:** Schedule für `docs/launch-resonance.md`-Pflege (anekdotische Resonanz, Klick-Zahlen falls Monitoring aus Story 5.4 verfügbar, Anfragen-Inbound, Lessons-Learned).
   - **Sektion Rollback-Pfad:** falls Hard-Launch katastrophal scheitert (Site-Outage, kritischer Bug, juristische Reklamation): wie ENV zurück auf `beta` flippen + Channel-Statement vorbereiten.
   - **Sektion Owner-Energie-Lock:** Soft-Launch + Hard-Launch sind jeweils 1-Owner-Tag-Energie-Slot. KEIN paralleler Sprint-Push während Launch-Tag.
   - **Format-Disziplin:** Plex-Mono-Code-Blocks für Commands, Plex-Sans-Prose für Anweisungen, keine em-dashes, keine Marketing-Phrasen.
   - **Test:** Markdown-Validator + Section-Existenz-Check (`grep -c "^## "` ≥ 6).

2. **AC-2 (Slack-Post-Markdown):**
   **Given** Soft-Launch-Channel Civic-Tech-Slack.
   **When** ich `_user-input/launch-material/slack-soft-launch.md` schreibe.
   **Then**:
   - 1 Post-Body, ≤ 800 Zeichen (Slack-Lesbarkeits-Limit ohne „mehr anzeigen"-Cut).
   - Aufbau: 1-Satz-USP + 1-Satz-Was („zeigt Klima/Lärm/Wohnlagen/Verkehr/Geschichte für jeden Punkt der Stadt") + 1-Satz-Tech-Stichwort („SvelteKit + MapLibre + Postgres, cookieless, EU-FOSS-Hosting") + 1-Satz-Beta-Hinweis + Link auf `https://navigator.berlin/`.
   - Plain-Markdown, KEIN Slack-Block-Kit-JSON (Wartbarkeit + Kanal-Portabilität).
   - 3 vorbereitete Reply-Hooks als separate Sektion im selben File für häufige Fragen („Welche Daten?", „Open Source?", „Wo ist der Source-Code?").
   - **Schreib-Disziplin:** no-ai-slop. Aktive Verben, keine 3-Adjektiv-Stacks, keine „I'm excited"-Floskeln.

3. **AC-3 (Mastodon-Thread):**
   **Given** Mastodon als Soft-Launch-Hauptchannel für Civic-Tech-Reichweite.
   **When** ich `_user-input/launch-material/mastodon-soft-launch.md` schreibe.
   **Then**:
   - Maximal 4 Toots im Thread, jeder Toot ≤ 500 Zeichen (Mastodon-Standard-Cap).
   - Toot-Aufbau:
     - **Toot 1 (Hook):** 1-Satz-USP + Link auf `https://navigator.berlin/` + 2 Hashtags (`#civictech`, `#berlin`).
     - **Toot 2 (Was):** 5 Layer-Cluster als Bullet-Liste (Klima, Lärm, Wohnlagen, Verkehr, Geschichte). 1 Mini-Screenshot-Anhang (`og-default.png` aus 5.2).
     - **Toot 3 (Wie):** Tech-Stack-Stichworte (SvelteKit, MapLibre, Postgres, Hetzner, Coolify, EU-FOSS). 1 Lizenz-Note (AGPL Code, CC-BY Daten).
     - **Toot 4 (Kontakt):** Bug-Reports + Feedback an `hey@navigator.berlin` + Hinweis auf `/methodik` + `/lizenzen`. Hashtag `#opendata`.
   - Anhang-Datei: `og-default.png` aus Story 5.2 als Toot-2-Bild.
   - **Schreib-Disziplin:** kein „Drumroll", kein „Excited to share", keine em-dashes.

4. **AC-4 (LinkedIn-Long-Form-Draft mit Hebel-#2-Framing):**
   **Given** LinkedIn als Hard-Launch-Hauptchannel für professionelle Reichweite + mtc-Beratung-Pitch.
   **When** ich `_user-input/launch-material/linkedin-hard-launch.md` schreibe.
   **Then**:
   - 1 Post-Body, 1200-2000 Zeichen (LinkedIn Long-Form-Sweet-Spot).
   - Aufbau:
     - **Opener (1 Satz):** konkretes Problem ohne Tracking-Sicht („Berliner Adresse → 5 statistische Schichten in einer Karte"). KEIN „I'm thrilled to announce".
     - **Was steckt drin (3-4 Sätze):** Datensätze + Cluster + Aktualität + Methodik-Transparenz. Verweis auf `/methodik`.
     - **Tech-Stichwort-Block (1 Absatz):** SvelteKit + MapLibre + Postgres + Drizzle + Vitest + Playwright + Hetzner-CPX22 + Coolify + Traefik. Compliance-Aussage: „cookieless, EU-FOSS-Hosting, GDPR-DPIA dokumentiert (`/datenschutz`), Barrierefreiheits-Erklärung (`/barrierefreiheit`)."
     - **Hebel-#2-Block (1 Absatz, PROMINENT):** „Das Setup ist re-usable. Für Verwaltungen, Civic-Tech-Initiativen und Forschungs-Projekte, die einen vergleichbaren Datenraum für Mobilität, Klima oder Soziale Lage brauchen, biete ich Beratung über mtc.berlin an. Kontakt: `beratung@navigator.berlin` oder DM hier." (Wording final mit User).
     - **CTA-Schluss (1 Satz):** Link auf `https://navigator.berlin/` + Hinweis dass Bug-Reports willkommen sind.
     - **Hashtags-Footer:** `#civictech #berlin #opendata #svelte #postgres #eufoss #mtcberlin`.
   - **OG-Image-Anhang:** `og-default.png` aus Story 5.2 wird beim Posten als Featured Image hochgeladen (LinkedIn rendert dann automatisch das Card-Layout).
   - **Persona-Trennung:** Post wird vom Matze-Schmidbauer-Profil aus, NICHT vom mtc-berlin-Profil. mtc wird mit `#mtcberlin` und Inline-Erwähnung verlinkt. Begründung: navigator.berlin ist Civic-Tech-Asset, mtc ist Beratungs-Asset. Persona-Trennung muss visuell gewahrt bleiben.
   - **Schreib-Disziplin:** no-ai-slop + de-konzept-erstellung. Keine „nahtlos", „leistungsstark", „cutting-edge", keine „I'm honored", keine 3-Adjektiv-Stacks.

5. **AC-5 (Newsletter-HTML optional):**
   **Given** Newsletter-Versand ist OPTIONAL (nur wenn Liste existiert).
   **When** ich `_user-input/launch-material/newsletter-hard-launch.html` als Template anlege.
   **Then**:
   - **Stand-Decision-Lock:** Newsletter-Liste existiert HEUTE NICHT. AC-5 ist Stretch-Scope, kann als Template ohne Versand-Pflicht angelegt werden.
   - Template als Plain-HTML mit Inline-CSS (E-Mail-Client-Kompatibilität), max-width 600px, Cloud-Dancer-BG, Plex-Serif-Heading + Plex-Sans-Body.
   - Inhalt: 1 Hero-Headline + 5 Layer-Bullets + 1 Hebel-#2-Box (analog LinkedIn-Draft) + 1 Footer mit Unsubscribe-Hinweis (Pflicht-DSGVO).
   - Wenn Newsletter-Liste vor Hard-Launch nicht aufgesetzt wird: AC-5 wird auf „Template existiert, kein Versand" reduziert.
   - **NICHT Pflicht-Scope für Story-`done`-Status.**

6. **AC-6 (Resonanz-Bilanz-Slot):**
   **Given** T+30d-Lessons-Learned brauchen Schreib-Slot.
   **When** ich `docs/launch-resonance.md` als Stub anlege.
   **Then**:
   - Frontmatter mit `status: pending` (bis T+30d fertig dokumentiert).
   - Sektionen-Skelett: „Resonanz pro Channel", „Inbound-Anfragen (Bugs, Beratung, Press)", „Klick-Zahlen falls verfügbar (siehe Story 5.4)", „Lessons-Learned", „To-Do für nächsten Launch / Update-Push".
   - File wird T+30d gefüllt, NICHT in 5.3. 5.3 liefert nur das Skelett.
   - Verweis aus `docs/launch-plan.md` Sektion T+30d auf diese Datei.

7. **AC-7 (Posting-Disziplin: Auto-Publish-Verbot):**
   **Given** Resonanz-Reaktion soll individuell + manuell sein.
   **When** ich Posting-Disziplin codifiziere.
   **Then**:
   - In `docs/launch-plan.md` Sektion „Posting-Disziplin": explizite Notiz „Auto-Publish verboten. Jeder Channel-Post wird manuell ausgelöst, Reactions werden individuell beantwortet."
   - KEINE Buffer/Hootsuite/Zapier-Integration in 5.3-Scope.
   - KEIN GitHub-Action-Workflow für Auto-Tweet/Mastodon-API-Trigger.

8. **AC-8 (Asset-Cross-Reference auf Story 5.2):**
   **Given** Story 5.2 liefert Brand-Assets.
   **When** ich Channel-Material schreibe.
   **Then**:
   - Mastodon-Toot 2 referenziert `static/brand/og-default.png` (Pfad-Konstante in Markdown).
   - LinkedIn-Post referenziert `static/brand/og-default.png` als Featured-Image.
   - LinkedIn-Hebel-#2-Block kann optional auf `static/brand/press-kit.zip` und `static/brand/press-kit-1pager.pdf` verweisen.
   - Wenn Story 5.2 NICHT done vor 5.3-Implementation: 5.3 lockt einen Working-Draft mit Platzhalter-Pfaden, finaler Refresh in Folge-PR. Vorausgesetzte Sequencing-Lock: 5.2 done vor 5.3.

9. **AC-9 (Update-Entry für `/updates`):**
   **Given** Story 2.13 ist merged, `/updates`-Route existiert.
   **When** ich Soft-Launch + Hard-Launch dokumentiere.
   **Then**:
   - Vorhandenes File `_content/updates/2026-05-16-launch.md` wird inhaltlich auf Phase-1 / Phase-2 / Phase-3-Stand aktualisiert (NICHT neu angelegt, weil 2.13 dieses File bereits committed hat).
   - Soft-Launch-Tag = neuer Update-Entry `_content/updates/YYYY-MM-DD-soft-launch.md` mit category `feature`.
   - Hard-Launch-Tag = neuer Update-Entry `_content/updates/YYYY-MM-DD-hard-launch.md` mit category `feature`.
   - Beide Files sind in 5.3-Scope NUR als Template/Stub angelegt (Inhalt am Launch-Tag gefüllt).
   - Schema folgt Story-2.13-Frontmatter-Konvention (validiert via Valibot in `loadUpdatesFromModules`).

10. **AC-10 (Hebel-#2-Wording-Lock):**
    **Given** Compliance-Showcase soll prominent, Persona-Trennung gewahrt.
    **When** ich LinkedIn-Long-Form-Draft + Newsletter-Template schreibe.
    **Then**:
    - **Compliance-Liste muss konkret sein:** cookieless ✓, EU-FOSS-Hosting (Hetzner CPX22 Falkenstein) ✓, GDPR-DPIA dokumentiert (Story 5.6) ✓, Barrierefreiheits-Erklärung (Story 4.6) ✓, ISO 27001/9001-Patterns als Implementierungs-Disziplin (CLAUDE.md), AGPL Codebase ✓.
    - **mtc-Verweis** als Hashtag `#mtcberlin` + Inline-Mention, NICHT als Co-Author/Cross-Posting. Persona-Trennung-Lock.
    - **Beratungs-Email** in 5.3 lockt auf `beratung@navigator.berlin` als Pitch-Adresse. Wenn dieser Mail-Alias zum Hard-Launch nicht aktiv ist: Fallback auf `hey@navigator.berlin?subject=Beratungs-Anfrage` (siehe Story 2.12 AC-10 Open-Question 1).
    - **Kein Behauptungs-Overreach:** Compliance-Aussagen sind belegbar (Stories 4.6, 5.6, ADR-Verzeichnis). KEIN „GDPR-konform" als Marketing-Claim ohne `/datenschutz`-Link.

11. **AC-11 (Phase-1-DE-only-Lock):**
    **Given** Memory `project_i18n_phase_1_de_only.md`.
    **When** ich Channel-Material schreibe.
    **Then**:
    - Alle 4 Channel-Assets (Slack, Mastodon, LinkedIn, Newsletter): NUR DE-Wording in 5.3.
    - EN-Pendants für internationale Reichweite (Hacker News, internationales LinkedIn-Audience) sind Phase-3-Folge-Story (`5-3.1-channel-material-en`).
    - Stigma-Lint: keine em-dashes, kein „lebenswert/Lebensqualität", keine Funktionsverben („führt eine Analyse durch" → „analysiert").

12. **AC-12 (TDD-Mandat + Lint-Gates):**
    **Given** ADR-012 Pragmatic TDD.
    **When** ich diese Story implementiere.
    **Then**:
    - **Unit-Tests** sind hier WENIG sinnvoll (Story produziert primär Markdown + HTML-Templates). Stattdessen:
    - **Stigma-Lint-Test** `tests/lint/launch-material-stigma.test.ts`: scannt alle `_user-input/launch-material/*.md` und `docs/launch-*.md` auf em-dashes (U+2014) + „lebenswert" + 3-Adjektiv-Stacks. Fails bei Treffer.
    - **Wort-Counter-Test** für LinkedIn-Long-Form (1200-2000 Zeichen) + Slack-Post (≤ 800 Zeichen) + Mastodon-Toots (jeweils ≤ 500 Zeichen).
    - **Asset-Existenz-Test** für Cross-References auf Story 5.2 (`static/brand/og-default.png`, `static/brand/press-kit.zip`, `static/brand/press-kit-1pager.pdf`): wenn 5.2 done, Test grün; wenn 5.2 nicht done, Test xfail mit Markierung „blocked by 5.2".
    - **Update-Entry-Schema-Test:** neue `_content/updates/*-launch.md`-Stubs werden gegen Story-2.13-Valibot-Schema validiert.
    - **Markdown-Linter-Pass:** `markdownlint` oder vergleichbarer Pass auf neue MD-Dateien.

## Tasks / Subtasks

- [ ] **T1: Launch-Plan-Doku** (AC: 1, 7)
  - [ ] T1.1: Co-Design-Session mit User: T+0 + T+14d Datum-Slots locken.
  - [ ] T1.2: `docs/launch-plan.md` schreiben mit 6+ Sektionen (Pre-Launch-Check, T+0, T+14d, T+30d, Rollback, Posting-Disziplin, Owner-Energie-Lock).
  - [ ] T1.3: Plex-Mono-Code-Blocks für ENV-Flip-Commands + `pnpm`-Scripts.
  - [ ] T1.4: Markdown-Validator + Section-Count-Test.

- [ ] **T2: Slack-Soft-Launch-Material** (AC: 2)
  - [ ] T2.1: `_user-input/launch-material/slack-soft-launch.md` mit Post-Body + 3 Reply-Hooks.
  - [ ] T2.2: Wort-Counter-Test ≤ 800 Zeichen Body.
  - [ ] T2.3: Stigma-Lint-Pass.

- [ ] **T3: Mastodon-Thread** (AC: 3)
  - [ ] T3.1: `_user-input/launch-material/mastodon-soft-launch.md` mit 4 Toots als Markdown-Sektionen.
  - [ ] T3.2: Cross-Reference auf `static/brand/og-default.png` (5.2-Dependency).
  - [ ] T3.3: Per-Toot-Zeichen-Counter-Test ≤ 500.

- [ ] **T4: LinkedIn-Long-Form mit Hebel #2** (AC: 4, 10)
  - [ ] T4.1: Co-Design-Session: Hebel-#2-Wording-Lock mit User (mtc-Verweis, Beratungs-Email).
  - [ ] T4.2: `_user-input/launch-material/linkedin-hard-launch.md` mit 5 Absätzen (Opener, Was, Tech, Hebel #2, CTA) + Hashtag-Footer.
  - [ ] T4.3: Cross-Reference auf `static/brand/og-default.png` + optional `press-kit.zip` + `press-kit-1pager.pdf`.
  - [ ] T4.4: Wort-Counter 1200-2000 Zeichen.
  - [ ] T4.5: Persona-Trennung-Lock dokumentieren in File-Header-Kommentar.

- [ ] **T5: Newsletter-Template optional** (AC: 5)
  - [ ] T5.1: `_user-input/launch-material/newsletter-hard-launch.html` als HTML-Template mit Inline-CSS.
  - [ ] T5.2: Unsubscribe-Footer-Pflicht (DSGVO).
  - [ ] T5.3: Falls Newsletter-Liste nicht existiert: AC-5 als „Template-only, kein Versand" markieren.

- [ ] **T6: Resonanz-Bilanz-Stub** (AC: 6)
  - [ ] T6.1: `docs/launch-resonance.md` als Stub mit Sektionen-Skelett.
  - [ ] T6.2: Frontmatter `status: pending`.
  - [ ] T6.3: Cross-Reference aus `docs/launch-plan.md` Sektion T+30d.

- [ ] **T7: Update-Entries für Launch-Tags** (AC: 9)
  - [ ] T7.1: Vorhandenes `_content/updates/2026-05-16-launch.md` inhaltlich auf Phase-1-Stand aktualisieren (falls nötig).
  - [ ] T7.2: Stub `_content/updates/2026-MM-DD-soft-launch.md` mit Platzhalter-Datum (am Launch-Tag fertig gefüllt).
  - [ ] T7.3: Stub `_content/updates/2026-MM-DD-hard-launch.md` analog.
  - [ ] T7.4: Schema-Validation via `loadUpdatesFromModules` (Story 2.13).

- [ ] **T8: Lint-Gates** (AC: 12)
  - [ ] T8.1: `tests/lint/launch-material-stigma.test.ts` mit em-dash-Scan + Stigma-Wortliste + 3-Adjektiv-Stack-Heuristik.
  - [ ] T8.2: `tests/lint/launch-material-length.test.ts` mit Per-Channel-Zeichen-Counter.
  - [ ] T8.3: `markdownlint`-Pass als CI-Step (falls noch nicht integriert).

- [ ] **T9: Final-Verifikation** (AC: 1-12)
  - [ ] T9.1: `pnpm test:unit -- --run` 100% grün.
  - [ ] T9.2: `pnpm check` 0 Errors.
  - [ ] T9.3: Manual-Review der 4 Channel-Posts auf Stigma + AI-Slop + Floskeln.
  - [ ] T9.4: Cross-Reference-Audit auf Story-5.2-Assets (Existenz verifizieren oder blocked-by-Marker setzen).
  - [ ] T9.5: Sprint-Status-Eintrag.

## Dev Notes

### Scope-Abgrenzung

5.3 produziert **Markdown + HTML-Templates**, KEINE Code-Komponenten und KEINE Build-Pipelines. Auto-Publish-Verbot ist hartcodierte Disziplin (AC-7), keine technische Sperre.

Story-Output sind 4 Channel-Assets + 1 Launch-Plan + 1 Resonanz-Stub + 2-3 Update-Stubs. Alles unter `_user-input/launch-material/`, `docs/launch-plan.md`, `docs/launch-resonance.md`, `_content/updates/`.

### Persona-Trennung-Lock (Hebel #2)

`navigator.berlin` = Civic-Tech-Asset (Open-Source, kostenlos, Brand für Allgemeinheit).
`mtc.berlin` = Beratungs-Asset (Paid-Consulting, Persona).

LinkedIn-Post stammt vom Matze-Profil, NICHT vom mtc-Profil. `mtc.berlin` wird als Hashtag + Inline-Mention referenziert. Beratungs-Anfragen kommen via `beratung@navigator.berlin`-Alias, der auf mtc-Inbox routet (technisch: Mail-Alias-Konfiguration aus Story 4.1-Coolify-Setup, NICHT in 5.3-Scope).

**Begründung:** Wenn navigator.berlin-Brand zu sehr mit mtc-Beratungslinie verschmilzt, leidet die Civic-Tech-Glaubwürdigkeit. Hashtag-Reference reicht für Hebel-#2-Sichtbarkeit ohne Persona-Bruch.

### Bestehende Re-Use-Punkte (MUST-Rule #3)

- Story 5.2 Brand-Assets: `static/brand/og-default.png`, `static/brand/press-kit.zip`, `static/brand/press-kit-1pager.pdf`, `static/brand/wortmarke.svg`.
- Story 2.13 Update-Entry-Schema + `loadUpdatesFromModules`-Validator.
- `src/lib/utils/contact.ts` `FEEDBACK_EMAIL` als Fallback-Kontakt-Adresse.
- `_user-input/`-Verzeichnis als bestehender User-Input-Slot (Recherche, Designs).
- `docs/runbooks/`-Format-Vorlage für `docs/launch-plan.md`-Struktur.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen**: `docs/launch-plan.md` ≤ 300 LOC, Channel-Material-Files je ≤ 100 LOC.
- **#3 Bestehende Funktionen prüfen**: Re-Use 5.2 + 2.13-Assets.
- **#11 Kein US-Drittanbieter**: KEIN Buffer / Hootsuite / Zapier in 5.3-Scope.
- **#12 Provenance**: Compliance-Aussagen in LinkedIn-Post sind belegbar (Stories 4.6, 5.6).
- **#14 i18n-First**: Phase-1-DE-only-Lock, keine EN-Strings.
- **#20 ADR-Pflicht**: KEINE ADR nötig (kein Architektur-Entscheid).

### Co-Design-Sessions (Pflicht)

Drei Co-Design-Sessions mit User vor Massen-Implementation:

1. **Launch-Datum-Lock** (AC-1): T+0 + T+14d konkret im Kalender festlegen. Owner-Energie-Verfügbarkeit + externer Anker (z.B. Civic-Tech-Event in Berlin) berücksichtigen.
2. **Hebel-#2-Wording** (AC-4, 10): mtc-Verweis-Phrasing, Beratungs-Email-Alias, Compliance-Liste-Konkretisierung. Wortwahl auf Persona-Trennung prüfen.
3. **Slack-Channel-Selection** (AC-2): Welcher Slack? Code-for-Berlin oder OK Lab Berlin oder beide? Owner-Mitgliedschaft + Channel-Aktivität checken.

### Stigma + Editorial-Disziplin

- **Verboten in allen Channels:** „I'm excited", „I'm thrilled", „game-changer", „revolutionär", „nahtlos", „leistungsstark", „passionate", „cutting-edge", „lebenswert", „Lebensqualität".
- **Verboten Stil:** 3-Adjektiv-Stacks („schnell, einfach, intuitiv"), Funktionsverben („führt eine Analyse durch"), em-dashes (U+2014).
- **Pflicht:** aktive Verben, kurze Sätze (≤ 20 Wörter Durchschnitt), faktische Aussagen mit Belegen (Datensätze, Tools, ADRs, Stories).

### Cross-Story-Dependencies + Sequencing

| Vorgänger | Status | Auswirkung |
|-----------|--------|------------|
| 5.2 | ready-for-dev | Brand-Assets (OG, Wortmarke, Press-Kit, LinkedIn-Banner). MUSS done vor 5.3. |
| 2.13 | review (merged 2026-05-16) | Update-Entry-Schema. Direkt importieren. |
| 4.6 | ready-for-dev | Impressum + Datenschutz + Barrierefreiheit. Cross-Reference in LinkedIn-Post-Compliance-Block. |
| 4.7 | ready-for-dev | Architektur-Page. Cross-Reference in LinkedIn-Tech-Stack-Block. |
| 5.1 | ready-for-dev | Update-Cadence-Pattern (Format-Vorbild). |
| 5.4 | backlog | Post-Launch-Monitoring. T+30d-Bilanz konsumiert evtl. 5.4-Metriken. |
| 5.6 | backlog | GDPR-DPIA-Dokument. Cross-Reference in LinkedIn-Compliance-Block. |
| 5.7 | backlog | Sitemap-Submission. T+0-Soft-Launch-Trigger. |

**Empfehlung Reihenfolge:**
1. Epic 4 komplett done (Hetzner-Setup + Compliance-Pages + Architektur-Page).
2. Story 5.2 done (Brand-Assets).
3. Story 5.6 done (GDPR-DPIA als belegbare Cross-Reference).
4. Story 5.3 jetzt.
5. T+0 Soft-Launch nach 5.7 (Sitemap-Submission ready).

### Open-Questions vor Dev-Start

1. **Launch-Datum:** Welche Wochentage + Uhrzeiten für T+0 + T+14d? **Empfehlung:** Dienstag-Vormittag (Civic-Tech-Slack ist Vormittags aktiv), Donnerstag-Nachmittag (LinkedIn-Performance-Peak Mitteleuropa). User locked Datum.

2. **Slack-Channel:** Code-for-Berlin oder OK Lab Berlin oder beide? **Empfehlung:** Beide, mit angepasstem Wording pro Channel-Kultur. User bestätigt Mitgliedschaft.

3. **Mastodon-Account:** Welches Instance + Handle? Owner-existing-Account oder neuer Projekt-Account `@navigator-berlin@chaos.social` (oder ähnliches)? **Empfehlung:** Owner-Account auf `chaos.social` oder `mastodon.social`, weil Projekt-eigener Account ohne Follow-Base kalt startet. User bestätigt.

4. **`beratung@navigator.berlin`-Alias:** Ist dieser Mail-Alias zum Hard-Launch live? **Default-Decision:** Wenn nicht: `hey@navigator.berlin?subject=Beratungs-Anfrage` als Fallback (siehe Story 2.12 AC-10 Open-Question 1). User confirmiert Alias-Status.

5. **Newsletter-Liste:** Existiert Buttondown/Mailchimp/Listmonk-Setup? **Default-Decision:** Wenn nein, AC-5 ist Template-only (kein Versand). User confirmiert Listenstatus.

### Posting-Disziplin (Lock)

- **Auto-Publish verboten.** Kein Buffer, kein Zapier, kein GitHub-Action-Trigger für Tweet/Toot-API. Resonanz-Reaktion ist individuell und manuell.
- **Cross-Posting kontrolliert.** Slack-Post → Mastodon-Thread → LinkedIn-Long-Form sind je separate Voices, kein 1:1-Copy.
- **Reply-Disziplin.** Erste Replies in Channel-Posts werden zeitnah (≤ 4h) beantwortet, danach Standard-Cadence. Channel-Owner-Energie-Slot bewusst einplanen am Launch-Tag.

### References

- Epic-Block: `_bmad-output/planning-artifacts/epics.md#L2215-L2240`
- Story 5.2: `_bmad-output/implementation-artifacts/5-2-brand-asset-pack-press-kit.md`
- Story 2.13: `_bmad-output/implementation-artifacts/2-13-updates-route-rss-categories-jsonld.md`
- Story 4.6: `_bmad-output/implementation-artifacts/4-6-compliance-pages-impressum-datenschutz-barrierefreiheit-de-en.md`
- Story 4.7: `_bmad-output/implementation-artifacts/4-7-architektur-page-eu-foss-showcase-de-en.md`
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md`
- Memory `project_i18n_phase_1_de_only.md`, `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_atlas_explore_route.md`, `project_server_purchase_sequencing.md`
- Skills `no-ai-slop`, `de-konzept-erstellung`
- Bestand Contact: `src/lib/utils/contact.ts:1`
- Bestand User-Input: `_user-input/` (existing slot for user-curated material)
- Bestand Update-Entry: `_content/updates/2026-05-16-launch.md` (von Story 2.13)

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
