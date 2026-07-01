# Story 4.7: Architektur-Page als EU-FOSS-Showcase (Phase 1 DE-only)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a mtc-Beratungs-Lead und Konferenz-Talk-Reviewer,
I want eine dedizierte `/architektur`-Page auf navigator.berlin, die den EU-FOSS-Hosting-Stack narrativ erklärt (Hetzner CPX22 + Coolify + Traefik + CrowdSec + Postgres-Hybrid + Cookieless + WebMCP + Kiez-Score-System) mit Quell-Repos und Dokumentations-Links zu allen Stack-Komponenten, JSON-LD-Strukturierung (WebSite + BreadcrumbList) für Discoverability sowie Owner-Attribution „von Matze Schmidbauer" mit Profil-Link im MetaFooter,
so that Pitch-Decks und Konferenz-Talks die Site als praktisches Compliance-Showcase referenzieren können, Lebenslauf-Asset-Charakter sichtbar wird, und Cross-Refs zwischen Page-Inhalt und Source-Repos (Hetzner-Docs, Coolify-Repo, ADR-013/015 etc.) den Beratungs-Pipeline-Hebel stützen.

## Phase-1-Scope-Korrektur (User-Lock 2026-05-16)

**EN-Variante DEFERRED Phase 3:** Memory `project_i18n_phase_1_de_only` + ADR-014 (Story 4.4) fixieren Phase 1 auf DE-only. Epic-Text (epics.md Zeile 2108–2139) plant DE+EN-Implementation + hreflang-Cluster. **Phase 1: nur DE.** Phase-3-Reaktivierung über `docs/i18n-reactivation.md` (Story 3.1) mit Sub-Step für Architektur-Page.

**Phase-1-Scope-Reduce:**

- ❌ EN-Variante (`/en/architektur`)
- ❌ hreflang-Cluster Story 3.3 (archiv)
- ✅ DE-only `/architektur` prerendered
- ✅ Owner-Attribution im MetaFooter (Phase-1 mit Mailto/LinkedIn-URL, User-Decision Open-Q1)
- ✅ JSON-LD BreadcrumbList (WebSite-Schema bereits global aus Story 2.2 Root-Layout)
- ✅ Stack-Komponenten-Cross-Refs zu Quell-Repos

**Verhältnis zu Story 4.4-AC-12 ARCHITECTURE.md (Repo-Root):**

- **ARCHITECTURE.md (Repo-Root, Story 4.4):** GitHub-Readable-Markdown, technische Tiefe, ADR-Index-Tabelle, Mermaid-Service-Topology, primär für Future-Maintainer + LLM-Agents
- **`/architektur`-Page (Story 4.7):** Site-Public-Facing, narrative Plex-Serif-Prosa, Pitch-Referenzierbar, für Bürger:innen + Konferenz-Publikum + Beratungs-Pipeline
- **Kein Duplikat:** ARCHITECTURE.md verlinkt auf `/architektur`, Page verlinkt auf ARCHITECTURE.md (Repo-Tiefe-Trail)

**Sequence-Hand-offs:**

- **Story 2.1:** SeoHead + prerender + entries-Hook + Sitemap-Source
- **Story 2.2:** WebSite-Schema (Root-Layout) + BreadcrumbList-Generator
- **Story 4.4:** ARCHITECTURE.md Repo-Root + ADR-013/014/015
- **Story 4.6:** Methodik-Page-Layout-Vorlage (`/methodik`-Pattern existiert)
- **Story 4.1 / 4.2:** Hetzner CPX22 + Coolify + Traefik + CrowdSec + Postgres als zitierfähiger Production-State

**Memory-Marker:** `project_i18n_phase_1_de_only`, `feedback_no_em_dashes`, `feedback_no_lebenswert`, `feedback_no_live_data`.

## Acceptance Criteria

**AC-1 (Page-Struktur + Plex-Serif h1 + ToC-Nav):**

**Given** Pattern aus `/methodik`-Page (Story 1.29 done, `+page.svelte` mit Plex-Serif h1 + ToC-Nav + Sections + JSON-LD-Block)
**When** ich `src/routes/(with-header)/architektur/+page.svelte` neu anlege mit `export const prerender = true` in `+page.ts`
**Then** Page enthält strukturiert 9 Sections (ToC-Nav-Items):
  1. **Mission** (id `mission`): Kurz-Beschreibung navigator.berlin als Cross-Layer-Atlas + EU-FOSS-Statement
  2. **Hosting-Stack** (id `hosting`): Hetzner-Frankfurt CPX22 (AMD, 8GB/2vCPU/80GB, EUR 9,51/Mon) + Coolify-Compose + Traefik mit Let's-Encrypt + CrowdSec-Plugin
  3. **Daten-Layer** (id `daten-layer`): Static GeoJSON (Source-of-Truth) + Postgres-Hybrid (Build-Zeit-Aggregat-Cache, kein Source-of-Truth) + Drizzle-ORM
  4. **App-Framework** (id `app-framework`): SvelteKit 2 + Svelte 5 Runes + TypeScript strict + Vite + Tailwind v4
  5. **Karten-Layer** (id `karten`): MapLibre GL + Plex-Cartography + OpenFreeMap-Vector-Tiles + PMTiles für Heavy-Layer
  6. **Compute / Kiez-Score** (id `kiez-score`): Kiez-Score (5 Dimensionen, 138 LOR-BR) + Bezirks-Score (12 Bezirke) als Build-Zeit-Aggregat, Methodik-Cross-Link
  7. **Discovery** (id `discovery`): WebMCP-Server (5 Tools + 2 Resources + 3 Prompts), llms.txt + llms-full.txt, JSON-LD pro Page-Type
  8. **CI/CD** (id `ci-cd`): GitHub-Actions mit 13 Gates (Story 4.3) + Lefthook Pre-Commit + Coolify-Deploy-Webhook
  9. **Compliance** (id `compliance`): Cookieless-by-default (ADR-004), kein US-Drittanbieter (NFR-S7), BFSG-konform (Story 4.6), DSGVO-Art-13-erfüllt
**And** Plex-Serif h1 „Architektur" + ToC-Nav (Hash-Anchors) konsistent zu `/methodik`-Page
**And** Max-72ch-Text-Breite für lesbare Prosa
**And** Page-Layout-Konsistenz zu Compliance-Pages (Story 4.6)

**AC-2 (Stack-Komponenten-Cross-Refs — alle 14 Quell-Repos / Docs verlinkt):**

**Given** Epic-Text spezifiziert 14 Stack-Komponenten (Zeile 2130)
**When** ich Page-Sections schreibe
**Then** pro Komponente externer Link auf authoritative Quelle:
  - **Hetzner Cloud:** `https://www.hetzner.com/cloud/` + Verweis auf CPX22-Server-Type
  - **Coolify:** `https://coolify.io/` + GitHub-Repo `https://github.com/coollabsio/coolify`
  - **Traefik:** `https://traefik.io/traefik/` + GitHub-Repo `https://github.com/traefik/traefik`
  - **CrowdSec:** `https://www.crowdsec.net/` + GitHub `https://github.com/crowdsecurity/crowdsec`
  - **Postgres:** `https://www.postgresql.org/` + Drizzle-ORM `https://orm.drizzle.team/`
  - **SvelteKit:** `https://svelte.dev/docs/kit/` + Svelte 5 `https://svelte.dev/docs/svelte/`
  - **MapLibre GL:** `https://maplibre.org/` + GitHub `https://github.com/maplibre/maplibre-gl-js`
  - **IBM Plex:** `https://github.com/IBM/plex` (OFL-Lizenz)
  - **OpenFreeMap:** `https://openfreemap.org/`
  - **OpenMapTiles-Schema:** `https://openmaptiles.org/`
  - **WebMCP-Spec:** `https://webmcp.dev/` + ADR-002-Repo-Link (intern)
  - **FIS-Broker:** `https://fbinter.stadt-berlin.de/fb/` (Berlin-Geo-Source)
  - **ODIS (Open Data Informationsstelle Berlin):** `https://daten.odis-berlin.de/`
  - **DWD CDC:** `https://www.dwd.de/DE/leistungen/cdc/cdc.html` (Klima-Daten)
**And** Alle Links `rel="noopener external"` für Sicherheit
**And** Link-Text-Konvention: Komponenten-Name als Anchor-Text, kein „klick hier"
**And** Externe Links visuell markiert (UX-DR-External-Link-Pattern, falls existent — sonst Plex-Sans-Mono-Indicator)

**AC-3 (Owner-Attribution + MetaFooter-Erweiterung):**

**Given** PRD-Anforderung (Zeile 78): „Footer ‚von Matze [Nachname]' statt Firmen-Logo"
**When** ich MetaFooter erweitere
**Then** **Variante A (Recommended):** Owner-Statement als zusätzlicher Footer-Subtext nach Nav-Anchors, vor BFSG-Statement:
```svelte
<p class="mx-auto mt-2 max-w-[1440px] px-4 text-ink-subtle">
  navigator.berlin · von <a href="https://www.linkedin.com/in/matze-schmidbauer/" rel="noopener external">Matze Schmidbauer</a>
</p>
```
**And** LinkedIn-URL als User-Decision (Open-Q1) — falls LinkedIn nicht gewünscht: Alternative `mailto:hey@navigator.berlin` oder persönliche Page-URL
**And** Anchor-Text „Matze Schmidbauer" (voller Name, kein Initial-only)
**And** Position zwischen Nav-Anchors und BFSG-Statement (FR-Anforderung Owner-Modell sichtbar)
**And** Tests `meta-footer.test.ts` (falls existiert) ergänzen für Owner-Attribution-Sichtbarkeit

**AC-4 (JSON-LD BreadcrumbList):**

**Given** Story 2.2 `buildBreadcrumbList`-Generator existiert
**When** ich Architektur-Page-JSON-LD einbinde
**Then** BreadcrumbList rendert Hierarchie:
  - `[Home] / [Architektur]`
  - JSON-LD via `<JsonLd>`-Komponente aus Story 2.2 (XSS-Escape-Helper inkludiert)
**And** WebSite-Schema kommt aus Root-Layout (Story 2.2), nicht doppelt auf Page-Level
**And** SearchAction-Part des WebSite-Schemas verweist auf Atlas-Suche (Adress-Suche auf `/explore`, Story 2.11-Pattern)
**And** Optional: `TechArticle`-JSON-LD analog `/methodik` für strukturierte Such-Auffindbarkeit (Story-2.2-Generator falls existent oder Inline)

**AC-5 (SeoHead pro Page):**

**Given** Story 2.1 SeoHead-Komponente
**When** ich SeoHead einbinde
**Then**:
  - `title="Architektur · navigator.berlin"`
  - `description="EU-FOSS-Hosting-Stack von navigator.berlin: Hetzner-Frankfurt, Coolify, Traefik, CrowdSec, Postgres-Hybrid, Cookieless, WebMCP."`
  - `canonical="https://navigator.berlin/architektur"`
  - `noindex: false`
**And** OG-Image: Standard `og-default.png` oder Custom-Variante mit „Architektur"-Label (Story 2.6 OG-Pipeline — falls Custom-OG-Bilder pro Page existieren)
**And** Twitter-Card: `summary` (kein `summary_large_image` ohne Custom-OG)

**AC-6 (Prerender + Sitemap-Source):**

**Given** Story 2.1 `kit.prerender.entries` + Sitemap-Source-Pattern
**When** ich Architektur-Page hinzufüge
**Then**:
  - `svelte.config.js` `kit.prerender.entries`-Liste erweitert um `/architektur`
  - `handleHttpError`-Tolerance-Liste reduziert (Route existiert jetzt)
  - Sitemap-Source ergänzt (`COMPLIANCE_PAGES_SOURCE` aus Story 4.6 erweitern um `/architektur` ODER eigene `META_PAGES_SOURCE`-Konstante)
  - `pnpm build` prerendert `build/architektur/index.html`
  - `pnpm build` Sitemap enthält `<url><loc>https://navigator.berlin/architektur</loc></url>`

**AC-7 (Narrative-Content-Disziplin — no-ai-slop + de-konzept-erstellung):**

**Given** Architektur-Page ist Pitch-Asset, nicht generisches Tech-Marketing
**When** ich Section-Texte schreibe
**Then** Editorial-Standard:
  - **Aktive Verben:** „navigator.berlin läuft auf Hetzner Frankfurt" statt „Die Plattform wird auf Hetzner Frankfurt bereitgestellt"
  - **Konkrete Zahlen + Quellen:** „Hetzner CPX22, 2 vCPU, 8 GB RAM, EUR 9,51 monatlich" statt „dimensioniert für aktuelle Last"
  - **Belege bei absoluten Aussagen:** „Kein US-Drittanbieter im Production-Pfad" → Verweis auf NFR-S7 + CI-Gate (Story 4.3 Gate 10) + Whitelist-Quelle
  - **Hauptsätze, max 25 Wörter:** keine Schachtelsätze, keine Funktionsverbgefüge
  - **Keine em-dashes:** Kommata, Doppelpunkt, Mittelpunkt (`·`)
  - **Kein „lebenswert":** Memory `feedback_no_lebenswert`
  - **Keine generischen Behauptungen:** „performant", „skalierbar", „enterprise-grade" → ersetzen durch konkrete Metriken (NFR-P4 TTFB <200ms, NFR-P5 Initial-JS <200KB, NFR-R1 Uptime-Ziel 99%)
  - **Innovations-Vektoren narrativ einarbeiten:** WebMCP-Civic-Tech-Premiere, Cross-Layer-Aha, 1719+-Klima-Long-View, EU-FOSS-komplett-ohne-US (PRD Zeilen 377–404)
**And** Skill-Empfehlung: Dev-Agent aktiviert `no-ai-slop` + `de-konzept-erstellung` während Section-Schreibung
**And** Page-Länge-Ziel: ~600–900 Wörter (lesbar in 5 Minuten, ausreichend für Pitch-Referenz)

**AC-8 (Cross-Links zu internen Ressourcen):**

**Given** ADRs + Runbooks + Story-Docs sind im Repo verlinkt
**When** ich Architektur-Page-Inhalt schreibe
**Then** Cross-Links auf relevante Internal-Resources:
  - **ADR-001** (Tile-Provider): aus Karten-Section
  - **ADR-002** (WebMCP): aus Discovery-Section
  - **ADR-004** (Cookieless): aus Compliance-Section
  - **ADR-013** (Postgres-Hybrid, Story 4.4): aus Daten-Layer-Section
  - **ADR-015** (Hetzner-CPX22, Story 4.4): aus Hosting-Section
  - **`/methodik`-Page:** aus Compute-Section (Kiez-Score-Methodik)
  - **`/methodik/kiez-score`:** aus Compute-Section
  - **`/lizenzen`-Page:** aus Daten-Layer-Section (Lizenz-Hierarchie)
  - **GitHub-Repo `https://github.com/mschmdb/navigator-berlin`:** aus Hero-Section + Compliance-Section
  - **README.md / ARCHITECTURE.md (Repo-Root, Story 4.4):** aus Mission-Section („Mehr Tiefe im Repo")
**And** Interne Links via SvelteKit-`<a href="/lizenzen">`-Pattern (Reroute-konform)
**And** ADR-Links als `https://github.com/mschmdb/navigator-berlin/blob/main/docs/adr/ADR-XXX-*.md`

**AC-9 (Test-Coverage Smoke-Level):**

**Given** Architektur-Page ist Content-Page mit minimaler Logik
**When** ich Tests schreibe
**Then** `routes/(with-header)/architektur/page.svelte.test.ts` mit Cases:
  - Test 1: rendert h1 „Architektur"
  - Test 2: enthält ToC-Nav mit 9 Section-Anchors
  - Test 3: enthält mind. 5 externe Stack-Komponenten-Links (Stichprobe: hetzner.com, coolify.io, svelte.dev, maplibre.org, postgresql.org)
  - Test 4: enthält Cross-Link auf `/methodik` und `/lizenzen`
  - Test 5: JSON-LD BreadcrumbList wird gerendert (Probe `<script type="application/ld+json">`-Element + JSON-Parse-Smoke)
  - Test 6: keine em-dashes in Sektion-Headings (Regex `/[—–]/.test(text)` === false)
**And** E2E-Smoke optional in `tests/e2e/compliance-pages.e2e.ts` (Story 4.6) erweitern um `/architektur`-Case (HTTP 200 + h1 sichtbar + axe-core 0 Violations)

**AC-10 (Phase-3-Reaktivierungs-Path):**

**Given** `docs/i18n-reactivation.md` aus Story 3.1
**When** ich Sub-Step für Architektur-Page-EN ergänze
**Then** Doc enthält:
  - „**Architektur-Page EN-Variante:** Content-Migration zu Paraglide-Messages (`messages/en.json`) für UI-Strings (Section-Headers, Nav-Items, Footer-Owner-Attribution) ODER separate `/en/architektur/+page.svelte`-Route mit kompletter EN-Body. Recommendation: **Paraglide-Messages für UI-Strings + separate EN-Page für Body-Prosa** (Body ist redaktionelle Übersetzung, UI-Strings sind kurze Labels). EN-Body braucht KEIN Translation-Quality-Disclaimer (Pitch-Asset, kein Rechts-Text), aber Hinweis dass DE die Master-Variante ist."
**And** Cross-Link auf Story 3.1 `docs/i18n-reactivation.md` + ADR-014

## Tasks / Subtasks

- [ ] **Task 1: `/architektur`-Route + Page-Skeleton (AC: #1, #5, #6)**
  - [ ] `src/routes/(with-header)/architektur/+page.svelte` mit Plex-Serif h1 + 9 Sections
  - [ ] `src/routes/(with-header)/architektur/+page.ts` mit `export const prerender = true`
  - [ ] SeoHead-Komponente einbinden
  - [ ] `svelte.config.js` prerender.entries + handleHttpError-Tolerance aktualisieren
  - [ ] Sitemap-Source-Eintrag

- [ ] **Task 2: Content-Sections schreiben (AC: #2, #7, #8)**
  - [ ] Skill aktivieren: `/no-ai-slop` + `/de-konzept-erstellung`
  - [ ] Pro Section ~80-120 Wörter Prosa (gesamt ~600-900 Wörter)
  - [ ] 14 Stack-Komponenten-Links (AC-2 Liste) einbauen
  - [ ] Cross-Links zu internen Ressourcen (AC-8)
  - [ ] Konkrete Zahlen/Belege statt generischer Aussagen
  - [ ] Stigma/Lebenswert-Check (Memory)
  - [ ] em-dash-Check (Memory)

- [ ] **Task 3: JSON-LD BreadcrumbList (AC: #4)**
  - [ ] `buildBreadcrumbList`-Import aus Story 2.2 `$lib/seo/json-ld.ts`
  - [ ] BreadcrumbList-Generator mit Hierarchie Home → Architektur
  - [ ] `<JsonLd>`-Komponente einbinden
  - [ ] Optional: TechArticle-JSON-LD analog Methodik

- [ ] **Task 4: Owner-Attribution im MetaFooter (AC: #3)**
  - [ ] User-Decision für LinkedIn-URL ODER Alternative klären (Open-Q1)
  - [ ] `src/lib/components/atlas/meta-footer.svelte` editieren: Owner-Statement vor BFSG-Statement
  - [ ] `meta-footer.test.ts` (falls existiert) ergänzen
  - [ ] Phase-3-i18n-Hand-off: Owner-Statement bleibt DE-only Phase 1 (kein Paraglide-Refactor)

- [ ] **Task 5: Test-Coverage (AC: #9)**
  - [ ] `routes/(with-header)/architektur/page.svelte.test.ts` mit 6 Cases
  - [ ] E2E-Erweiterung in `tests/e2e/compliance-pages.e2e.ts` (Story 4.6) optional
  - [ ] `pnpm test:unit` + `pnpm test:e2e` grün

- [ ] **Task 6: i18n-Reactivation-Doc erweitern (AC: #10)**
  - [ ] `docs/i18n-reactivation.md` Sub-Step für Architektur-Page

- [ ] **Task 7: Visual-Smoke + Pitch-Review (AC: #7)**
  - [ ] `pnpm dev` → `/architektur` lokal anschauen
  - [ ] Lesbar in 5 Minuten?
  - [ ] Pitch-Referenzierbar (Section-Anchors für Quick-Link)?
  - [ ] Self-Review gegen Editorial-Standard

- [ ] **Task 8: Commit-Strategie**
  - [ ] Commits getrennt:
    1. `feat(showcase): architektur-page mit stack-komponenten-cross-refs (story 4.7 a)`
    2. `feat(footer): owner-attribution matze schmidbauer (story 4.7 b)`
    3. `chore(seo): breadcrumblist json-ld + sitemap-source architektur (story 4.7 c)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Stand (vor Story 4.7)

- **`/architektur`-Route:** existiert NICHT (MetaFooter-Anchor zeigt aktuell auf 404, vorausgeschriebener Anchor wie `/datenschutz`/`/impressum`)
- **MetaFooter Owner-Attribution:** FEHLT — aktueller MetaFooter hat nur Nav-Anchors + BFSG-Statement, kein „von Matze Schmidbauer"
- **`/methodik`-Page (Story 1.29):** vollständig implementiert, Pattern-Vorlage für Architektur-Page
- **ARCHITECTURE.md (Repo-Root, Story 4.4):** wird parallel/davor erstellt — keine Duplikate, Cross-Refs nur
- **JSON-LD-Generators (Story 2.2):** `buildBreadcrumbList`, `buildDataset`, etc. — Architektur-Page nutzt BreadcrumbList
- **SeoHead-Komponente (Story 2.1):** wiederverwendbar
- **Stack-State zum Implementations-Zeitpunkt:** abhängig von Story 4.1/4.2/4.3-Implementation-Stand. Falls 4.1 noch nicht deployed: Section „Hosting-Stack" bleibt aspirational (User-Lock 2026-05-15-PM dokumentiert)

### Verhältnis zu Story 4.4-AC-12 ARCHITECTURE.md

**Klare Trennung:**

| Aspekt | ARCHITECTURE.md (Story 4.4) | `/architektur`-Page (Story 4.7) |
|--------|----------------------------|--------------------------------|
| Format | Markdown, GitHub-rendered | Svelte-Page, Plex-Serif, prerendered |
| Zielgruppe | Future-Maintainer, LLM-Agents, Recruiter | Bürger:innen, Konferenz-Publikum, Beratungs-Pipeline |
| Tiefe | Tech-Detail, ADR-Index, Mermaid-Diagram | Narrative Prosa, Stack-Storytelling |
| Tone | Recruiter-readable, structured-list-heavy | Pitch-asset, narrative-flow-heavy |
| Cross-Refs | ADRs, Stories, BMad-Artifacts | ADRs, `/methodik`, `/lizenzen`, externe Quellen |
| Wartung | Mit ADR-Updates synchron | Mit Stack-Veränderungen synchron |

**Cross-Refs zwischen beiden:**

- ARCHITECTURE.md verlinkt auf `https://navigator.berlin/architektur` (Public-Showcase)
- `/architektur`-Page verlinkt auf `https://github.com/mschmdb/navigator-berlin/blob/main/ARCHITECTURE.md` (Repo-Tiefe)

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #2 (Files <500 Zeilen):** `+page.svelte` ~300-400 Zeilen, splitten falls nötig
- **Rule #11 (Kein US-Drittanbieter):** Cross-Refs auf externe Seiten zulässig (Hetzner, Coolify etc.) — alle EU-FOSS
- **Rule #13 (A11y-First):** Page muss WCAG 2.2 AA konform sein (Self-Audit, axe-core in CI)
- **Rule #14 (i18n-First):** DEFERRED Phase 1

**FR/NFR-Mapping:**

- **FR36 (JSON-LD-Strukturierung):** BreadcrumbList + ggf. TechArticle — AC-4
- **UX-DR56:** Architektur-Page DE+EN — Phase-1-Partial (DE-only)
- **NFR-S7 (Kein US-Drittanbieter):** Page demonstriert + dokumentiert Compliance
- **NFR-M2 (Recruiter-readable Artefakte):** Page + ARCHITECTURE.md

### Memory-Bezug

- **`project_i18n_phase_1_de_only`:** DE-only Scope
- **`feedback_no_em_dashes`:** Editorial-Disziplin AC-7
- **`feedback_no_lebenswert`:** keine Pseudo-Empathie-Begriffe
- **`feedback_no_live_data`:** Architektur-Page erklärt Static-only-Strategie, NICHT Live-Daten

### Editorial-Standard (no-ai-slop + de-konzept-erstellung)

Architektur-Page = Pitch-Asset für Beratungs-Pipeline. AI-Slop-Risiko: vage Tech-Floskeln, generische Stack-Beschreibungen, Calques aus Englisch („leverage", „best-in-class", „state-of-the-art").

**Disziplin pro Section:**

- **Konkret statt generisch:** „CPX22 AMD, 2 vCPU, 8 GB RAM, EUR 9,51/Monat" statt „leistungsstarker Cloud-Server"
- **Belege pro Behauptung:** „Zero US-Drittanbieter im Production-Pfad" → Verweis auf CI-Gate 10 (Story 4.3) + ALLOWED_HOSTS-Liste
- **Aktive Verben:** „navigator.berlin läuft auf Hetzner" statt „Die Plattform wird bei Hetzner gehostet"
- **Hauptsätze:** max 25 Wörter/Satz
- **Keine Marketing-Adjektive:** kein „enterprise-grade", „performant", „skalierbar" ohne Zahlen-Beleg
- **Innovations-Vektoren narrativ:** PRD Zeilen 377–404 (WebMCP-Premiere, Cross-Layer-Aha, Klima-1719+, EU-FOSS-Komplett)

### Test-Strategie (ADR-012)

Story 4.7 = überwiegend Content-Page mit minimaler Logik. ADR-012 Pragmatic-TDD: Smoke-Level.

- **Smoke-Tests:** h1 + ToC + Stack-Links + Cross-Links + JSON-LD-Existence (AC-9)
- **E2E:** optional in 4.6-E2E-File erweitern
- **No Coverage-Goal:** Content-Page ohne Logic-Code

### Previous Story Intelligence

- **Story 1.29 (Methodik-Page, done):** Pattern-Vorlage. Same Layout, ToC-Nav, Plex-Serif h1, JSON-LD-Block
- **Story 4.4 (ARCHITECTURE.md):** Cross-Refs, Klare Trennung
- **Story 4.6 (Compliance-Pages):** MetaFooter-Erweiterungs-Pattern (Owner-Attribution wird hier ergänzt)
- **Story 2.1 / 2.2:** SeoHead + JSON-LD-Generators

### File-List nach Story-Completion (erwartet)

**Modified:**

- `src/lib/components/atlas/meta-footer.svelte` (+ Owner-Attribution)
- `svelte.config.js` (prerender.entries + handleHttpError)
- `docs/i18n-reactivation.md` (+ Architektur-Page Sub-Step)
- Sitemap-Source-File (aus Story 2.1 oder 4.6, hier Eintrag erweitern)

**New:**

- `src/routes/(with-header)/architektur/+page.svelte`
- `src/routes/(with-header)/architektur/+page.ts`
- `src/routes/(with-header)/architektur/page.svelte.test.ts`

**Untouched (Cross-Ref-Targets):**

- `docs/adr/ADR-*.md` (alle, Cross-Refs Read-Only)
- `_bmad-output/planning-artifacts/architecture.md` (Internal-Workflow-Doc, kein Public-Verweis)
- `ARCHITECTURE.md` Repo-Root (aus Story 4.4)

### Project Structure Notes

`(with-header)`-Layout-Group konsistent zu Lizenzen + Methodik + Compliance-Pages.

Owner-Attribution in MetaFooter zentral statt pro-Page-Wiederholung. Footer-Pattern bleibt single-source.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.7` Zeilen 2108–2139] — Original-Story (Phase-1-reduziert hier)
- [Source: `_bmad-output/planning-artifacts/architecture.md`] — Internal-Stack-Doku (Cross-Ref-Quelle)
- [Source: `_bmad-output/planning-artifacts/prd.md` Zeilen 377–426] — Innovation-Vektoren
- [Source: `_bmad-output/planning-artifacts/prd.md` Zeile 78] — Owner-Attribution-Anforderung
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Zeile 103] — Architektur-Page-Showcase-Direktive
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` Zeile 2162] — Architektur-Page-UX-Spec
- [Source: `src/routes/(with-header)/methodik/+page.svelte`] — Pattern-Vorlage
- [Source: `src/lib/components/atlas/meta-footer.svelte`] — Owner-Attribution-Target
- [Source: `docs/adr/ADR-001-tile-provider.md`] — Cross-Ref Karten-Section
- [Source: `docs/adr/ADR-002-webmcp.md`] — Cross-Ref Discovery-Section
- [Source: `docs/adr/ADR-004-cookieless.md`] — Cross-Ref Compliance-Section
- [Source: `docs/adr/ADR-013-postgres-hybrid-architecture.md` (Story 4.4)] — Daten-Layer
- [Source: `docs/adr/ADR-015-hetzner-cpx22-amd.md` (Story 4.4)] — Hosting-Section
- [Source: `ARCHITECTURE.md` (Story 4.4)] — Cross-Link-Target Repo-Tiefe
- [Source: Memory `project_i18n_phase_1_de_only`]
- [Source: Memory `feedback_no_em_dashes`]
- [Source: Memory `feedback_no_lebenswert`]
- [Source: Memory `feedback_no_live_data`]
- [Source: Skill `no-ai-slop` (Anti-AI-slop writing rules)]
- [Source: Skill `de-konzept-erstellung` (deutsche Geschäftsprosa-Disziplin)]

## Open Questions / Pre-Dev-Clarifications

1. **Owner-Attribution-Link: LinkedIn-Profil oder Alternative?** Epic + PRD nennen LinkedIn. Solo-Maintainer-User-Decision: LinkedIn-URL `https://www.linkedin.com/in/matze-schmidbauer/` ODER persönliche Website ODER Mailto-only ODER GitHub-Profil. **Empfehlung:** LinkedIn (Recruiter-Visibility) + Mailto-Fallback im Footer-Kontakt-Anchor.

2. **TechArticle-JSON-LD analog `/methodik` einbinden?** Methodik-Page hat TechArticle-Block (Code-Snippet aus Story 1.29). Architektur-Page könnte analog gestaltet werden für SEO. **Empfehlung:** Ja, einbinden — bessere Search-Discoverability als Tech-Article, konsistent zu Methodik-Pattern.

3. **OG-Image: Standard oder Custom?** Story 2.6 OG-Pipeline plant Custom-OG-Bilder pro Page. Architektur-Page kann mit Stack-Komponenten-Visual werben. **Empfehlung:** Phase-1 = `og-default.png`, Phase-2-Story für Custom-OG falls Beratungs-Pipeline-Traffic über LinkedIn-Shares.

4. **Section-Reihenfolge optimal für Pitch-Flow?** Vorgeschlagene Reihenfolge (Mission → Hosting → Daten → Framework → Karten → Compute → Discovery → CI/CD → Compliance). Alternative: Compliance vor CI/CD (rechtlicher Showcase-Aspekt prominenter). **Empfehlung:** vorgeschlagene Reihenfolge, da Compliance als finale Pointe wirkt („Alle Bausteine, alle Compliance-Pflichten erfüllt").

5. **Page-Länge — wann ist „zu lang" erreicht?** Pitch-Asset braucht Verdaubarkeit. 600-900 Wörter = 5 Min Lese-Zeit. **Empfehlung:** Hard-Cap 1.000 Wörter Phase 1. Falls mehr Detail nötig: Cross-Link auf ARCHITECTURE.md (Repo-Tiefe).

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
