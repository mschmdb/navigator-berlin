# Story 4.6: Compliance-Pages DE-only Phase 1 (Impressum + Datenschutz + Barrierefreiheit)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Bürger:in und Behörde-Adressat,
I want gesetzlich vorgeschriebene Compliance-Pages auf navigator.berlin erreichbar haben: **Impressum** nach §5 TMG, **Datenschutz** nach DSGVO Art. 13 inkl. Cookieless-Statement und Postgres-Hybrid-Erklärung, sowie **Barrierefreiheits-Erklärung** nach BFSG §16 mit Konformitäts-Niveau, Test-Methoden und Mailto-Feedback-Pfad,
so that gesetzliche Pflichten (TMG, DSGVO, TDDDG, BFSG) erfüllt sind, der EU-FOSS-Compliance-Showcase glaubwürdig steht für die mtc-Beratungs-Linie, und MetaFooter-Anchor-Links (`/impressum`, `/datenschutz`) nicht mehr auf 404 zeigen.

## Phase-1-Scope-Korrektur (User-Lock 2026-05-16)

**EN-Variante DEFERRED Phase 3:** Memory `project_i18n_phase_1_de_only` + ADR-014 (Story 4.4) fixieren Phase 1 auf DE-only. Epic-Text (epics.md Zeile 2079–2106) plant DE+EN-Implementation. **Phase 1: nur DE.** Phase-3-Reaktivierung über `docs/i18n-reactivation.md` (Story 3.1) mit Sub-Step für Compliance-Pages.

**Phase-1-Scope-Reduce:**

- ❌ EN-Variante (`/en/impressum`, `/en/datenschutz`, `/en/barrierefreiheit`)
- ❌ Translation-Quality-Disclaimer („Übersetzungen maschinell erstellt, manuell gegengelesen") — wird mit EN-Reaktivierung Phase 3 nötig
- ❌ FR55j Always-Reachable-Footer DE+EN (nur DE in Phase 1)
- ✅ 3 prerendered Pages DE: `/impressum`, `/datenschutz`, `/barrierefreiheit`
- ✅ MetaFooter-Anchor-Links erreichbar (`/barrierefreiheit` ergänzt — aktuell fehlt im MetaFooter)
- ✅ §5 TMG / DSGVO Art. 13 / BFSG §16 Pflichtangaben

**Sequence-Hand-offs:**

- **Story 1.26 Datenschutz-Snippet:** `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` (~80 Zeilen Bookmark-Exception-Text aus ADR-004) wird in Datenschutz-Page eingebettet
- **Story 2.0 / 2.1:** Postgres-Hybrid + Prerender-Foundation (entries-Hook in `svelte.config.js` muss neue Routes-Liste ergänzen)
- **Story 2.2:** SeoHead-Komponente pro Page (Canonical/Title/Description)
- **Story 4.1 / 4.2:** Postgres-Hybrid (für Datenschutz-Erklärung) + Security-Setup (für „keine personenbezogenen Daten in Logs"-Aussage)
- **Story 4.4 ADR-Index:** Compliance-Pages zitieren ADR-004 (Cookieless), ADR-013 (Postgres-Hybrid)

**Memory-Marker:** `project_i18n_phase_1_de_only`, `feedback_no_em_dashes`, `feedback_no_lebenswert`, `feedback_no_live_data`.

## Acceptance Criteria

**AC-1 (Impressum-Page nach §5 TMG):**

**Given** §5 TMG verlangt Diensteanbieter-Pflichtangaben für geschäftsmäßige Telemedien-Angebote (privates Hobby-Projekt: rechtlich nicht-zwingend, aber Beratungs-Showcase setzt Standard)
**When** ich `src/routes/(with-header)/impressum/+page.svelte` neu anlege mit `export const prerender = true` in `+page.ts`
**Then** Page enthält §5-TMG-Pflichtangaben:
  - **Diensteanbieter:** „Matze Schmidbauer" (natürliche Person, kein Unternehmen)
  - **Anschrift:** Postanschrift Berlin (Maintainer-Detail, ggf. Berufsanschrift mtc oder Privat-Anschrift — Open-Q1)
  - **Kontakt:** `hey@navigator.berlin` (aus `$lib/utils/contact.ts`), telefonisch optional (Open-Q1)
  - **Verantwortlich i.S.d. § 18 Abs. 2 MStV:** „Matze Schmidbauer, Anschrift wie oben" (Verantwortlich für journalistisch-redaktionelle Inhalte)
  - **Umsatzsteuer-ID:** entfällt (Privat-Projekt, keine USt-pflichtige Tätigkeit über die Site)
  - **Berufshaftpflichtversicherung:** entfällt (keine reglementierte Berufstätigkeit über die Site)
  - **Streitschlichtung (Art. 14 Abs. 1 ODR-VO, §36 VSBG):** Hinweis-Pflicht falls Site UGC oder Verbraucherverträge — navigator.berlin hat keine, daher Standard-Disclaimer „Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
  - **Haftungsausschluss (Inhalte/Links):** Standard-TMG-Disclaimer für externe Quellen (FIS-Broker, OSM, DWD)
**And** Page-Layout: Plex-Serif h1 „Impressum", strukturierte Sections, max-72ch-Text-Breite
**And** SeoHead: `title="Impressum · navigator.berlin"`, `description="Anbieter-Kennzeichnung nach §5 TMG für navigator.berlin"`, `canonical="https://navigator.berlin/impressum"`
**And** `pnpm check` grün
**And** axe-core 0 Violations (Story 4.3 Gate 7)

**AC-2 (Datenschutz-Page nach DSGVO Art. 13 + ADR-004 Cookieless + Postgres-Hybrid-Erklärung):**

**Given** DSGVO Art. 13 verlangt Informationspflichten bei Erhebung personenbezogener Daten + TDDDG §25 verlangt Cookie/Storage-Einwilligung (außer Bookmark-Exception)
**When** ich `src/routes/(with-header)/datenschutz/+page.svelte` neu anlege mit Prerender
**Then** Page enthält strukturiert (mind. 7 Sections):
  1. **Verantwortlicher (Art. 13 Abs. 1 lit. a):** „Matze Schmidbauer, Berlin, hey@navigator.berlin" (gleiche Person wie Impressum)
  2. **Datenschutz-Beauftragter:** entfällt (keine Pflicht, Single-Person-Project ohne ≥20-Personen-Datenverarbeitung)
  3. **Zwecke + Rechtsgrundlagen (Art. 13 Abs. 1 lit. c):**
     - **Server-Logs** (Art. 6 Abs. 1 lit. f berechtigtes Interesse): IP-pseudonymisiert (letztes Oktett gekürzt), 7d Rotation, kein Personenbezug nach Pseudonymisierung (Verweis auf Story 4.2 + ADR-004)
     - **Geocoding-Anfragen** (Art. 6 Abs. 1 lit. b Vertragserfüllung — Bürger fragt Karte, App antwortet): server-seitiger Proxy zu Nominatim-Public, IP-anonymisiert, keine Speicherung der Adress-Eingabe
  4. **Cookieless-Statement:** „Diese Site setzt **keinerlei Cookies** (kein Tracking, kein Session-State, kein Consent-Banner). Persistente Anwendungs-State wird ausschließlich über die URL kodiert. Rechtsgrundlage: TDDDG §25 Abs. 1 wird dadurch nicht ausgelöst, weil keine Speicherung in der Endeinrichtung der Nutzer:innen stattfindet."
  5. **Bookmark-Ausnahme (TDDDG §25 Abs. 2 Nr. 2):** vollständiger Text aus `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` (~80 Zeilen). Bookmark-Funktion = User-initiierte Merkliste = einwilligungsfrei nach §25 Abs. 2 Nr. 2 TDDDG (DSK-Orientierungshilfe Telemedien 2021 S. 14)
  6. **Postgres-Hybrid-Erklärung (NEU für 4.6, NICHT in 1.26-Snippet):** „Die Site nutzt eine Postgres-Datenbank ausschließlich für Build-Zeit-Aggregat-Berechnung öffentlicher Geo-Daten (Bezirks-Statistiken, Kiez-Score). Die Datenbank enthält **keine personenbezogenen Daten** zur Laufzeit. Schema + Migration sind öffentlich im Repo dokumentiert (ADR-013-postgres-hybrid-architecture)."
  7. **Drittanbieter / EU-FOSS-Statement:** „Keine US-Drittanbieter im Production-Pfad. Kein Cloudflare, kein AWS, kein Google. Hosting bei Hetzner-Frankfurt (DE). Tiles von OpenFreeMap (EU). Geocoding via Nominatim (OSM-Public-Instance, IP-anonymisiert geproxied)."
  8. **Betroffenenrechte (Art. 13 Abs. 2 lit. b–d, Art. 15–22):** Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei BlnBDI (Berliner Beauftragte für Datenschutz und Informationsfreiheit) — mit Verweis-URL
  9. **Speicherdauer (Art. 13 Abs. 2 lit. a):** Logs 7d, Bookmarks „solange User nicht löscht" (LocalStorage-User-Kontrolle), Build-Zeit-Aggregate „bis nächster Build"
**And** Page-Layout konsistent zu Impressum (Plex-Serif h1, 72ch, Hierarchie)
**And** Cross-Link auf `/impressum` + `/lizenzen` + `/architektur`
**And** SeoHead konsistent

**AC-3 (Barrierefreiheits-Erklärung nach BFSG §16):**

**Given** BFSG §16 verlangt Konformitäts-Erklärung für barrierefreie Web-Angebote (gilt seit Juni 2025; private Hobby-Projekte rechtlich-nicht-zwingend, aber Showcase-Pflicht)
**When** ich `src/routes/(with-header)/barrierefreiheit/+page.svelte` neu anlege mit Prerender
**Then** Page enthält:
  1. **Konformitätsstatus:** „WCAG 2.2 Level AA komplett, AAA wo möglich. BFSG-konform."
  2. **Geltungsbereich:** „Diese Erklärung gilt für die gesamte Website navigator.berlin inklusive aller Unterseiten und der Karten-Anwendung."
  3. **Test-Methoden:**
     - **Automatisiert:** `@axe-core/playwright` in GitHub-Actions-CI (Story 4.3 Gate 7), 0 Violations als Pflicht-Gate (NFR-A1)
     - **Compiler-Warnings:** Svelte-5-Compiler-A11y-Warnings als ESLint-Errors via `eslint-plugin-svelte` (CI-Gate 12, ~30% Catch-Rate per Geoff Rich)
     - **Manuell:** NVDA-Smoke-Test (Windows) + VoiceOver-Smoke-Test (macOS) per Maintainer-Selbst-Test gemäß Runbook `docs/runbooks/a11y-smoke-test.md`
     - **Lighthouse-CI:** A11y-Score ≥95 als CI-Gate (Story 4.3 Gate 8, NFR-A3)
  4. **Bekannte Einschränkungen / Nicht-Konformitäten:**
     - „MapLibre-Karten-Canvas: Tastatur-Pan via Pfeil-Tasten implementiert (SC 2.1.1 + 2.5.7 Drag-Alternative); Karten-Inhalt zusätzlich textuell im Inspector-Panel zugänglich. Screen-Reader-Workflow: Tab zu Adress-Suche → Adresse eingeben → Inspector-Panel announce'd alle Layer-Werte."
     - „Externe Datenquellen (FIS-Broker, ODIS): hochgeladene PDFs/Dokumente in Quell-Datensätzen ggf. nicht WCAG-konform — wir verlinken auf Originalquellen, beeinflussen deren A11y nicht."
  5. **Feedback-Mechanismus (BFSG §16):** „Barriere oder Hindernis gefunden? Schreiben Sie an `hey@navigator.berlin` mit Beschreibung der Barriere + Browser/Hilfsmittel-Information. Wir antworten innerhalb 14 Tagen und nehmen Optimierung in den nächsten Release-Zyklus auf."
  6. **Schlichtungsverfahren:** „Bei Streitigkeiten über Barrierefreiheit ist die Schlichtungsstelle der Berliner Senatsverwaltung für Inneres, Digitalisierung und Sport zuständig. Anschrift: Klosterstraße 47, 10179 Berlin." (Berlin-spezifisch per Berliner-Barrierefreiheits-IKT-Verordnung)
  7. **Erstellungs-Datum + Letzte-Prüfung:** „Erstellt: <YYYY-MM-DD>, Letzte-Prüfung: <YYYY-MM-DD>"
**And** Page-Layout konsistent
**And** Page selbst MUSS WCAG 2.2 AA konform sein (Self-Audit Pflicht via axe + manueller NVDA-Walk)

**AC-4 (MetaFooter-Erweiterung — Barrierefreiheits-Link):**

**Given** `src/lib/components/atlas/meta-footer.svelte` aktuell mit 6 Anchors (Methodik · Lizenzen · Datenschutz · Impressum · Architektur · Kontakt)
**When** ich `/barrierefreiheit`-Anchor ergänze
**Then** MetaFooter-Nav-Reihenfolge: `Methodik · Lizenzen · Datenschutz · Impressum · Barrierefreiheit · Architektur · Kontakt`
**And** Position zwischen Impressum und Architektur (gruppiert mit Rechts-Compliance-Links)
**And** Trennzeichen `·` (Mittelpunkt) konsistent
**And** Anchor-Text: „Barrierefreiheit"
**And** Bestehende Anchors unverändert

**AC-5 (Prerender-Foundation + entries-Hook):**

**Given** Story 2.1 hat `svelte.config.js` `kit.prerender.entries`-Liste + `handleHttpError` tolerant für yet-to-ship Routes
**When** ich neue 3 Routes hinzufüge
**Then** `svelte.config.js` Entries-Liste ergänzt um `/impressum`, `/datenschutz`, `/barrierefreiheit`
**And** `handleHttpError`-Tolerance-Liste reduziert um diese 3 Routes (jetzt existieren sie)
**And** `pnpm build` prerendert alle 3 Pages als statische HTMLs (`build/impressum/index.html` etc.)
**And** Sitemap-Source (Story 2.1) bekommt diese Routes als statische Einträge in `BEZIRK_PAGES_SOURCE`-Pattern oder eigener `COMPLIANCE_PAGES_SOURCE`-Konstante

**AC-6 (SeoHead pro Page):**

**Given** Story 2.1 + 2.2 SeoHead-Komponente
**When** ich pro Page SeoHead einbinde
**Then**:
  - **Impressum:** `title="Impressum · navigator.berlin"`, `description="Anbieter-Kennzeichnung nach §5 TMG"`, `canonical="https://navigator.berlin/impressum"`, `noindex: false`
  - **Datenschutz:** `title="Datenschutz · navigator.berlin"`, `description="Datenschutzerklärung nach DSGVO Art. 13. Cookieless, kein Tracking, keine US-Drittanbieter."`, `canonical="https://navigator.berlin/datenschutz"`, `noindex: false`
  - **Barrierefreiheit:** `title="Barrierefreiheit · navigator.berlin"`, `description="Erklärung zur Barrierefreiheit nach BFSG §16. WCAG 2.2 AA komplett, AAA wo möglich."`, `canonical="https://navigator.berlin/barrierefreiheit"`, `noindex: false`
**And** SeoHead-Pattern konsistent zu Lizenzen-Page (Story 4.5)
**And** Keine em-dashes in Titles/Descriptions

**AC-7 (Komponenten-Refactor: gemeinsames Compliance-Page-Layout):**

**Given** 3 Compliance-Pages teilen Struktur (Plex-Serif h1, max-72ch, Section-Hierarchie, optional ToC-Nav)
**When** ich eine gemeinsame Layout-Komponente in Betracht ziehe
**Then** Decision:
  - **Variante A (Recommended):** keine gemeinsame Komponente, 3 Pages haben jeweils inline-Markup mit konsistenten Tailwind-Classes (`prose max-w-[72ch]` oder ähnlich). Phase-1-Minimum.
  - **Variante B:** `compliance-page-layout.svelte` als Snippet-Wrapper mit `<header>` + `<main>` + `<aside>`-Slots. Phase-2-Refactor falls Komplexität wächst.
**And** Variante A wird umgesetzt. Variante B als Phase-2-Story dokumentiert in Open-Q4.

**AC-8 (Test-Coverage Smoke-Level):**

**Given** ADR-012 Pragmatic-TDD: Setup/Config-Stories smoke-level, Compliance-Pages = überwiegend Content-Pages mit minimaler Logik
**When** ich Test-Strategie umsetze
**Then** Smoke-Tests pro Page:
  - `routes/(with-header)/impressum/page.svelte.test.ts`: rendert h1 „Impressum", enthält „Matze Schmidbauer", enthält `hey@navigator.berlin`-Link
  - `routes/(with-header)/datenschutz/page.svelte.test.ts`: rendert h1 „Datenschutz", enthält „Cookieless"-Statement, enthält Bookmark-Section, enthält Postgres-Erklärung
  - `routes/(with-header)/barrierefreiheit/page.svelte.test.ts`: rendert h1 „Barrierefreiheit", enthält „WCAG 2.2"-Statement, enthält `hey@navigator.berlin`-Feedback-Link
**And** Pro Test ~5–8 Cases (h1 + key-content-strings + cross-link-rendering + a11y-smoke via axe-mock)
**And** `pnpm test:unit` grün

**AC-9 (E2E-Smoke gegen prerendered Build):**

**Given** Playwright-E2E-Suite (`tests/e2e/`)
**When** ich `tests/e2e/compliance-pages.e2e.ts` neu schreibe
**Then** 3 Test-Cases:
  - Test 1: navigate `/impressum` → Status 200, h1 sichtbar, Page-Title korrekt
  - Test 2: navigate `/datenschutz` → Status 200, „Cookieless"-Substring im Body sichtbar, Cookie-Header-Probe via Response-Headers KEIN `Set-Cookie`
  - Test 3: navigate `/barrierefreiheit` → Status 200, axe-core full-page-audit 0 Violations
**And** Test läuft in Story 4.3 CI-Gate 7 grün

**AC-10 (Phase-3-Reaktivierungs-Path):**

**Given** `docs/i18n-reactivation.md` aus Story 3.1
**When** ich Sub-Step für Compliance-Pages-EN-Variante ergänze
**Then** Doc enthält:
  - „**Compliance-Pages EN-Variante:** Pro Page (`/impressum`, `/datenschutz`, `/barrierefreiheit`) Content-Migration zu Paraglide-Messages (`messages/en.json`) ODER zu separaten `/en/<route>/+page.svelte`-Routes mit komplettem EN-Body. Recommendation: separate Pages (Compliance-Texte sind lang + benötigen redaktionelle Übersetzung, Paraglide-Messages werden für kurze UI-Strings genutzt). EN-Body braucht Translation-Quality-Disclaimer-Banner („Übersetzung manuell gegengelesen, Rechtsverbindlich ist die DE-Fassung")."
**And** Verweis auf BFSG §16 EN-Pflicht (BFSG ist deutsches Recht, EN-Page ist Service-Aspekt, keine gesetzliche Pflicht)
**And** Hinweis: §5 TMG gilt unverändert (verantwortlich-Person, Maintainer-Attribution, identische Inhalte)

## Tasks / Subtasks

- [ ] **Task 1: Maintainer-Detail-Kollektion (AC: #1, Open-Q1)**
  - [ ] Maintainer-Anschrift klären (Berufsanschrift mtc oder Privat — User-Decision)
  - [ ] Telefonnummer-Bereitschaft prüfen (Open-Q1)
  - [ ] Werte in `src/lib/data/legal-contact.ts` (neu) als Single-Source-of-Truth ablegen
  - [ ] Import in Impressum-Page und Datenschutz-Page

- [ ] **Task 2: Impressum-Page implementieren (AC: #1, #6, #8)**
  - [ ] `src/routes/(with-header)/impressum/+page.svelte` mit Plex-Serif h1, Sections
  - [ ] `src/routes/(with-header)/impressum/+page.ts` mit `export const prerender = true`
  - [ ] SeoHead einbinden
  - [ ] `page.svelte.test.ts` mit 5–8 Cases
  - [ ] axe-core smoke

- [ ] **Task 3: Datenschutz-Page implementieren (AC: #2, #6, #8)**
  - [ ] `src/routes/(with-header)/datenschutz/+page.svelte` mit 9 Sections
  - [ ] Bookmark-Exception-Text aus `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` einbetten (ggf. via Markdown-Loader oder direkt Inline mit Editorial-Polish)
  - [ ] Postgres-Erklärung (NEU für 4.6) hinzufügen
  - [ ] BlnBDI-Link einbinden (`https://www.datenschutz-berlin.de/`)
  - [ ] SeoHead + prerender
  - [ ] `page.svelte.test.ts`

- [ ] **Task 4: Barrierefreiheits-Page implementieren (AC: #3, #6, #8)**
  - [ ] `src/routes/(with-header)/barrierefreiheit/+page.svelte` mit 7 Sections
  - [ ] Erstellungs-Datum + Letzte-Prüfung als TypeScript-Constant (Build-Time-Override möglich)
  - [ ] Schlichtungsstelle-Anschrift Berlin-Senat
  - [ ] SeoHead + prerender
  - [ ] `page.svelte.test.ts`
  - [ ] Self-Audit: NVDA-Walk + axe-core 0 Violations

- [ ] **Task 5: MetaFooter-Erweiterung (AC: #4)**
  - [ ] `src/lib/components/atlas/meta-footer.svelte` editieren: `/barrierefreiheit`-Anchor zwischen Impressum und Architektur einfügen
  - [ ] `meta-footer.test.ts` (falls existiert) ergänzen — sonst Smoke-Test in `tests/e2e/compliance-pages.e2e.ts`

- [ ] **Task 6: svelte.config.js prerender-entries (AC: #5)**
  - [ ] `kit.prerender.entries`-Liste um 3 neue Routes erweitern
  - [ ] `handleHttpError`-Tolerance-Liste reduzieren (3 Routes existieren jetzt)
  - [ ] `pnpm build` verify alle 3 Pages prerendert

- [ ] **Task 7: Sitemap-Source (AC: #5)**
  - [ ] Story 2.1-`SitemapSource`-Pattern erweitern: `COMPLIANCE_PAGES_SOURCE` mit 3 Einträgen
  - [ ] `pnpm build` verify `/sitemap.xml` enthält 3 neue URLs

- [ ] **Task 8: E2E-Test (AC: #9)**
  - [ ] `tests/e2e/compliance-pages.e2e.ts` mit 3 Cases
  - [ ] `pnpm test:e2e` lokal grün

- [ ] **Task 9: i18n-Reactivation-Doc erweitern (AC: #10)**
  - [ ] `docs/i18n-reactivation.md` Sub-Step für Compliance-Pages
  - [ ] Recommendation separate `/en/<route>`-Pages dokumentieren

- [ ] **Task 10: Commit-Strategie**
  - [ ] Commits getrennt:
    1. `feat(legal): impressum-page nach §5 TMG (story 4.6 a)`
    2. `feat(legal): datenschutz-page nach DSGVO Art. 13 inkl. cookieless + postgres-hybrid (story 4.6 b)`
    3. `feat(legal): barrierefreiheits-erklärung nach BFSG §16 (story 4.6 c)`
    4. `chore(footer): barrierefreiheit-anchor + sitemap-source (story 4.6 d)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Compliance-Stand (vor Story 4.6)

- **Compliance-Pages:** ALLE 3 FEHLEN (`/impressum`, `/datenschutz`, `/barrierefreiheit` nicht existent)
- **MetaFooter Anchor-Links:** `/datenschutz` + `/impressum` + `/architektur` zeigen aktuell auf 404 (Anchors vorausgeschriebene aber Pages nicht implementiert). `/barrierefreiheit` fehlt komplett im MetaFooter.
- **BFSG-Footer-Statement:** existiert (`meta-footer.svelte` Zeilen 23–25: „BFSG-konform, WCAG 2.2 AA komplett, AAA wo möglich.")
- **Datenschutz-Snippet aus Story 1.26:** `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` (~80 Zeilen) bereitliegend zur Einbettung
- **ADR-004 Cookieless:** vollständig befüllt — liefert Rechtsgrundlage für Datenschutz-Page
- **ADR-013 Postgres-Hybrid (Story 4.4):** liefert Postgres-Erklärung für Datenschutz-Page
- **Lizenzen-Page (Story 4.5):** Pattern-Vorlage für Plex-Serif-Page-Layout

### Phase-1-Pivot vs Epic-Wortlaut

Epic-Text (Zeile 2079–2106) plant **DE + EN für alle 3 Pages**. Phase-1-Lock 2026-05-16 (Memory `project_i18n_phase_1_de_only`) reduziert auf DE-only. Story-Pivot: 3 Pages DE-only, EN-Variante deferred Phase 3 mit dokumentiertem Migration-Path (AC-10).

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #2 (Files <500 Zeilen):** Datenschutz-Page könnte 350-450 Zeilen werden (9 Sections inkl. Bookmark-Snippet) — splitten in Section-Sub-Components falls nötig
- **Rule #6 (Keine Comments außer nicht-offensichtliche WHYs):** Compliance-Pages haben Content, keine Code-Comments nötig
- **Rule #10 (Cookieless):** Datenschutz-Page dokumentiert MUST-Rule-Compliance
- **Rule #13 (A11y-First):** Compliance-Pages MÜSSEN A11y-konform sein (Self-Reference)
- **Rule #14 (i18n-First):** DEFERRED Phase 1 (Section-Titel + Body hardcoded DE)

**FR/NFR-Mapping:**

- **FR55j (Always-Reachable-Footer):** Phase-1-Partial (DE-only, AC-4 + AC-5)
- **NFR-PR6:** Datenschutzerklärung erreichbar — AC-2
- **NFR-PR7:** Impressum erreichbar — AC-1
- **NFR-A10:** BFSG-Konformität attestierbar — AC-3 + Footer-Statement
- **UX-DR51:** Footer-BFSG-Statement — bereits existent
- **UX-DR52:** Accessibility-Page — AC-3
- **UX-DR53:** Datenschutz-Page — AC-2
- **UX-DR54:** Impressum-Page — AC-1

### Memory-Bezug

- **`project_i18n_phase_1_de_only`:** DE-only-Scope
- **`feedback_no_em_dashes`:** Compliance-Texte ohne em-dashes (Kommata, Mittelpunkt)
- **`feedback_no_lebenswert`:** kein „lebenswert" in Compliance-Texten
- **`feedback_no_live_data`:** Datenschutz-Page erwähnt keine Live-Daten-Quellen (konsistent mit Stack)

### Editorial-Standard (no-ai-slop + de-konzept-erstellung)

Compliance-Texte sind **gesetzlich-relevante Prosa**. AI-Slop-Risiko: vage Formulierungen, falsche Rechtsquellen-Referenzen, Calques aus Englischer Datenschutz-Sprache.

**Disziplin pro Story-Implementation:**

- Rechtsquellen-Zitate exakt (§-Nummern, Art.-Nummern, Gesetzes-Kurz-Titel laut amtlicher Bezeichnung)
- BlnBDI-URL valide (https://www.datenschutz-berlin.de/)
- Berliner-Schlichtungsstelle-Anschrift verifiziert (Klosterstraße 47, 10179 Berlin)
- Standard-Disclaimer-Sätze (Streitschlichtung TMG, ODR-VO) Wortlaut-konform
- Aktive Verben, Hauptsätze, max 25 Wörter pro Satz
- Keine Verniedlichung („wir achten penibel auf...") oder Marketing-Phrasen
- Belege pro absolute Behauptung („sicher", „komplett", „nie") — entweder Source-Link oder Reformulieren

### Test-Strategie (ADR-012)

Compliance-Pages = überwiegend Content + minimaler Logik. ADR-012 sagt Setup-/Config-Stories smoke-level; Compliance-Pages sind dazwischen (Editorial-Content statt Logik). **Pragmatic-Approach:**

- **Smoke-Tests pro Page:** h1 + key-content-strings + SeoHead-correctness
- **E2E:** 3 Cases (HTTP-200 + key-Substring-Probe + axe-Audit)
- **Coverage-Goal:** nicht Coverage-relevant (kein Logic-Code), Test-Existenz reicht

### Previous Story Intelligence

- **Story 1.26 (Adress-Bookmarks):** liefert Datenschutz-Snippet als bereitliegende Vorlage
- **Story 2.1 (SEO-Foundation):** SeoHead + prerender + entries-Hook
- **Story 2.2 (JSON-LD-Lib):** BreadcrumbList-Generator könnte für Compliance-Pages genutzt werden (Sub-Page-Hierarchie) — Phase-2-Optional
- **Story 4.5 (Lizenzen-Page):** Plex-Serif h1 + max-72ch-Pattern als Vorlage
- **ADR-004 / ADR-013:** Rechtsgrundlage-Texte direkt aus ADRs übernommen
- **Memory `feedback_no_em_dashes`:** Compliance-Text-Disziplin

### File-List nach Story-Completion (erwartet)

**Modified:**

- `src/lib/components/atlas/meta-footer.svelte` (+ Barrierefreiheits-Anchor)
- `svelte.config.js` (prerender.entries + handleHttpError-Liste)
- `docs/i18n-reactivation.md` (+ Compliance-Pages Sub-Step)

**New:**

- `src/routes/(with-header)/impressum/+page.svelte`
- `src/routes/(with-header)/impressum/+page.ts`
- `src/routes/(with-header)/impressum/page.svelte.test.ts`
- `src/routes/(with-header)/datenschutz/+page.svelte`
- `src/routes/(with-header)/datenschutz/+page.ts`
- `src/routes/(with-header)/datenschutz/page.svelte.test.ts`
- `src/routes/(with-header)/barrierefreiheit/+page.svelte`
- `src/routes/(with-header)/barrierefreiheit/+page.ts`
- `src/routes/(with-header)/barrierefreiheit/page.svelte.test.ts`
- `src/lib/data/legal-contact.ts` (Maintainer-Anschrift/Kontakt-Single-Source)
- `tests/e2e/compliance-pages.e2e.ts`

**Untouched:**

- `src/lib/utils/contact.ts` (FEEDBACK_EMAIL bleibt)
- `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` (Source-Vorlage, kein Edit)
- `docs/adr/ADR-004-cookieless.md` (Source-Vorlage)
- `docs/adr/ADR-013-postgres-hybrid-architecture.md` (Source-Vorlage, aus Story 4.4)

### Project Structure Notes

Compliance-Pages folgen `(with-header)`-Layout-Group (gleich wie Lizenzen + Methodik + Layer-Detail). Anchors im MetaFooter konsistent zur Sitemap-Hierarchie.

`legal-contact.ts` in `$lib/data/` (Daten-Layer, kein Component-Layer). Single-Source verhindert Drift zwischen Impressum und Datenschutz.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.6` Zeilen 2079–2106] — Original-Story (Phase-1-reduziert in diesem Body)
- [Source: `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md`] — Bookmark-Exception-Text aus Story 1.26
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 1050–1073] — MUST-Rules
- [Source: `_bmad-output/planning-artifacts/prd.md` NFR-PR6/PR7, NFR-A10, FR55j] — Compliance-NFRs
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Zeilen 2033–2160] — A11y-Konformitätsziel
- [Source: `docs/adr/ADR-004-cookieless.md`] — Cookieless-Architektur, Bookmark-Exception
- [Source: `docs/adr/ADR-013-postgres-hybrid-architecture.md` (Story 4.4)] — Postgres-Erklärung
- [Source: `docs/adr/ADR-014-i18n-scope-reduce-de-only.md` (Story 4.4)] — i18n-Phase-1-Lock
- [Source: `src/lib/components/atlas/meta-footer.svelte`] — bestehende MetaFooter-Anchors
- [Source: `src/lib/utils/contact.ts`] — FEEDBACK_EMAIL
- [Source: `src/routes/(with-header)/lizenzen/+page.svelte` (Story 4.5)] — Page-Layout-Vorlage
- [Source: §5 TMG https://www.gesetze-im-internet.de/tmg/__5.html]
- [Source: DSGVO Art. 13 https://dsgvo-gesetz.de/art-13-dsgvo/]
- [Source: TDDDG §25 https://www.gesetze-im-internet.de/tddd_g/__25.html]
- [Source: BFSG §16 https://www.gesetze-im-internet.de/bfsg/__16.html]
- [Source: BlnBDI https://www.datenschutz-berlin.de/]
- [Source: Memory `project_i18n_phase_1_de_only`]
- [Source: Memory `feedback_no_em_dashes`]
- [Source: Memory `feedback_no_lebenswert`]
- [Source: Memory `feedback_no_live_data`]

## Open Questions / Pre-Dev-Clarifications

1. **Maintainer-Anschrift Impressum: Berufsanschrift mtc oder Privat?** §5 TMG verlangt ladungsfähige Anschrift. Optionen:
   - **A:** Privatanschrift Berlin → vollständige TMG-Konformität, aber Privat-Adresse-Öffentlich
   - **B:** Berufsanschrift mtc (falls applicable) → Trennung Privat/Beruf, aber Frage ob mtc-Adresse für persönliches Projekt zitierfähig ist
   - **C:** Postfach Berlin → Zwischen-Lösung
   - **Empfehlung:** User-Entscheidung. Falls C: Postfach einrichten (~ EUR 20/Jahr Deutsche Post).

2. **Telefonnummer im Impressum:** §5 TMG verlangt „schnelle elektronische Kontaktaufnahme + unmittelbare Kommunikation". E-Mail (`hey@navigator.berlin`) reicht typisch, aber Telefonnummer ist Best-Practice. **Empfehlung:** E-Mail-only Phase 1, Telefonnummer optional bei Beratungs-Pipeline-Anlauf.

3. **Datenschutz-Page Bookmark-Snippet inline einbetten oder Markdown-Loader?** Snippet ist Markdown, Page ist Svelte. Inline-Einbettung als Plain-Text/HTML (mit Editorial-Polish) ist einfacher. Markdown-Loader (z.B. mdsvex) wäre Overkill für 1 Snippet. **Empfehlung:** Inline mit Editorial-Polish.

4. **Compliance-Page-Layout-Komponente Phase 1 oder Phase 2?** 3 Pages teilen Layout. Variante A (inline pro Page) = Phase 1. Variante B (gemeinsame Komponente) = Phase 2 wenn Komplexität steigt. **Empfehlung:** Variante A für 4.6, Refactor in Phase-2-Story falls Lizenzen + Compliance + Architektur (4.7) zusammen >3 Pages mit Layout-Drift zeigen.

5. **Berliner-Schlichtungsstelle für BFSG: korrekte Anschrift?** Aktueller Stand 2025: „Schlichtungsstelle der Berliner Senatsverwaltung für Inneres, Digitalisierung und Sport, Klosterstraße 47, 10179 Berlin". **Verifikations-Pflicht** vor Implementierung — Senats-Webseite konsultieren. **Empfehlung:** Dev-Agent verifiziert vor Implementation per WebFetch und passt ggf. an.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
