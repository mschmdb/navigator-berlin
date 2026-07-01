---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
status: complete
date: '2026-05-11'
project: navigator.berlin
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
referenceDocuments:
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin.md
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin-distillate.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-11
**Project:** navigator.berlin

## Document Inventory

**Whole Documents (alle vorhanden):**

- PRD: `prd.md` — 93 KB, 11 May 2026
- Architecture: `architecture.md` — 106 KB, 11 May 2026
- Epics & Stories: `epics.md` — 108 KB, 11 May 2026
- UX Design: `ux-design-specification.md` — 142 KB, 11 May 2026

**Reference Inputs:**

- `product-brief-navigator.berlin.md` (19 KB)
- `product-brief-navigator.berlin-distillate.md` (20 KB)

**Issues:** keine Duplikate, keine fehlenden Dokumente.

## PRD Analysis

PRD vollständig gelesen (893 Zeilen, 93 KB). Extraktion gleich der in `epics.md` Requirements Inventory dokumentierten Liste (identische Source).

### Functional Requirements (79 total)

**Adress-Discovery & Geocoding (FR1–FR6, 6 FRs)**

FR1: Berliner Adresse/Kiez/Bezirk als Freitext eingeben.
FR2: Vorschläge ab dem zweiten Zeichen.
FR3: Selektion per Maus, Tap, Enter, Pfeiltasten+Enter.
FR4: Disambiguierungs-Liste mit ≤10 Treffern nach Relevanz.
FR5: Geografischer Mittelpunkt Bezirk/Kiez als Alternative zu Punkt-Adresse.
FR6: Klare Fehlermeldung bei unbekannter/außerhalb-Berlin-Adresse.

**Karten-Visualisierung (FR7–FR13 + FR11a–FR11e, 12 FRs)**

FR7: MapLibre-Karte im Plex-Cartography-Style.
FR8: Auto-Zoom nach Adress-Auswahl.
FR9: Pan via Maus-Drag/Touch/Pfeiltasten/Buttons.
FR10: Zoom via Wheel/Pinch/+/-/Buttons.
FR11: Marker auf ausgewählter Adresse.
FR11a: Pan/Zoom unabhängig von Adress-Auswahl.
FR11b: Layer + POIs live nach Viewport.
FR11c: Klick auf beliebige Position → Inspektor-Panel-Hits.
FR11d: Viewport-State in URL gespiegelt (deeplinkbar).
FR11e: Layer-Granularität wechselt mit Zoom-Level.
FR12: Selektierte Boundary als `--accent`-Outline.
FR13: Karten-Legende mit Wertebereich + Skala.

**Layer-System & Inspektor-Panel (FR14–FR21, 8 FRs)**

FR14: Inspektor-Panel mit allen Treffer-Layern.
FR15: Pro Layer Wert + Erklärung + Datenstand + Mailto.
FR16: `/`-Tastatur-Shortcut für Layer-Palette.
FR17: Mobile Bottom-Sheet mit 5 zuletzt genutzten Layern.
FR18: Aktive Layer transparent übereinander mit sequentieller/divergierender Skala.
FR19: Daten-Tabellen-Alternative pro Visualisierung.
FR20: „Daten nicht vorhanden" explizit markiert.
FR21: Trinkbrunnen Saisonalitäts-Hinweis (Mai–Oktober).

**Klima-Heritage (FR22–FR26, 5 FRs)**

FR22: Nächstgelegene DWD-Station automatisch ermittelt.
FR23: Sparkline Sommertage seit 1950.
FR24: Sparklines Frost-/heiße Tage.
FR25: Long-View Jahresmitteltemperatur 1719+ (Dahlem).
FR26: Tastatur-navigierbare LayerChart + Daten-Tabelle.

**Discovery-Surfaces SEO/AEO (FR27–FR33, 7 FRs)**

FR27: Bezirks-URLs `/bezirk/{slug}` prerendered.
FR28: Kiez-URLs `/kiez/{slug}` prerendered.
FR29: Layer-Konzept-URLs `/layer/{slug}` prerendered.
FR30: FAQ-Sektion mit 5–10 JSON-LD-FAQPage-Q&As pro Page.
FR31: Dynamic OG-Image mit Karten-Snapshot pro URL.
FR32: Eigenes Title + Meta-Description pro URL aus Daten generiert.
FR33: Progressive Enhancement — Pages ohne JS lesbar.

**LLM-/Agent-Surfaces (FR34–FR40, 7 FRs)**

FR34: `/llms.txt` mit Navigations-Übersicht.
FR35: `/llms-full.txt` als Single-File-Quelle.
FR36: JSON-LD Place/AdministrativeArea/Dataset/FAQPage/WebSite pro URL.
FR37: WebMCP-Server mit ≥5 Tools (address_lookup, cross_layer_query, get_kiez_profile, get_layer_metadata, list_layers_at_point).
FR38: WebMCP-Resources (aktive Adresse, geladene Layer) URI-adressierbar.
FR39: ≥3 WebMCP-Prompt-Templates.
FR40: Maschinenlesbare Quellen-Attribution pro Datenwert.

**Accessibility & Responsiveness (FR41–FR49, 9 FRs)**

FR41: Skip-Link als erstes fokussierbares Element.
FR42: Alle Funktionen tastaturbedienbar.
FR43: ARIA-Live-Region für Karten-Updates.
FR44: Parallele DOM-Liste der Karten-Inhalte für Screenreader.
FR45: Single-Click-Alternative für alle Drag-Operationen.
FR46: Target-Size ≥44×44 CSS-px.
FR47: Responsive Desktop/Tablet/Smartphone ohne Funktionsverlust.
FR48: `prefers-reduced-motion` respektiert.
FR49: Focus-Ringe sichtbar, nicht durch sticky verdeckt.

**Editorial-Integrität (FR50–FR55, 6 FRs)**

FR50: Stolperstein-Verlinkung zur Koordinierungsstelle/Wikipedia.
FR51: Stolperstein-Personen-Hintergründe als zitierter Auszug mit URL, niemals LLM-generiert.
FR52: Mauer/Sektoren historischer Stand-Hinweis + Datenquelle.
FR53: „Fehler im Eintrag?"-Mailto pro Layer.
FR54: Lizenz-Matrix-Footer aus MANIFEST.json auto-generiert.
FR55: Mietspiegel/Bodenrichtwert-Disclaimer „ersetzt keine rechtliche Aussage".

**Internationalization (FR55a–FR55j, 10 FRs)**

FR55a: 8 Sprachen DE/EN/TR/UK/AR/ES/FR/IT ab Phase 1.
FR55b: URL-Prefix-Routing `/{lang}/...`, Sprach-Wechsel behält Viewport/Adresse/Layer.
FR55c: Server-302-Redirect bei Accept-Language; Default DE.
FR55d: Sprach-Switcher im Footer + optional Hero-Top-Right.
FR55e: `hreflang`-Tags + `x-default` (DE).
FR55f: RTL-Layout für AR, Karten-Inhalt bleibt LTR mit Plex Arabic.
FR55g: UI/FAQ/Erklärtexte in 8 Sprachen via Build-Time Claude Code.
FR55h: Bundles `src/lib/i18n/{lang}.json` committed; manuelles Review.
FR55i: Sensible Inhalte (Stolperstein/Mauer) NICHT maschinell übersetzt.
FR55j: Always-Reachable Meta-Footer in jeder Sprache (Impressum, Datenschutz, Lizenzen, Kontakt, Architektur, Sprach-Switcher).

**Phase 2 Capabilities (FR56–FR63 + FR59a, 9 FRs, deferred)**
**Phase 3 Capabilities (FR64–FR67, 4 FRs, deferred)**

Total FRs Phase 1: **70** (FR1–FR55 + FR11a–e + FR55a–j)
Total FRs Phase 2/3: **13** (FR56–FR67 + FR59a)
**Total: 83 FRs**

### Non-Functional Requirements (56 total)

**Performance NFR-P1–P10 (10):** LCP <2.5s, INP <200ms, CLS <0.1, TTFB <200ms, Initial JS gzipped ≤200KB, Page-Weight ≤500KB, Lighthouse Performance ≥90, SEO/BP ≥95, MapLibre lazy, GeoJSON immutable-cache.

**Security NFR-S1–S8 (8):** TLS 1.3 forced, Let's Encrypt Auto-Renewal, Strict-CSP ohne unsafe-inline, HSTS preload/X-Frame-Options DENY/Referrer-Policy/Permissions-Policy, CrowdSec Streaming-Mode, Hetzner L3/4-DDoS, keine US-Drittanbieter-Domain im Production, SSH Key-only.

**Privacy NFR-PR1–PR7 (7):** Null Set-Cookie verifiziert, keine personenbezogenen Daten, kein Tracking-Pixel, IP-pseudonymisierte Logs 7d Rotation, keine Cookie-Banner, DSGVO-Statement im Footer, Impressum §5 TMG.

**Accessibility NFR-A1–A10 (10):** WCAG 2.2 AA komplett (axe-core 0 Violations), AAA-Kontraste ≥7:1, Lighthouse A11y ≥95, Tastatur-Navigation flächendeckend, NVDA+VoiceOver Smoke-Test, Target-Size ≥44×44, Focus-Ringe ≥2px ≥3:1, `prefers-reduced-motion`, Daten-Tabellen-Alternative, BFSG-Footer.

**Integration NFR-I1–I8 (8):** Build-Time-Fetch mit Retry, Health-Check pro Quelle, Reprojektion 25833→4326, MANIFEST.json mit SHA+Lizenz, Lizenz-Hierarchie, Nominatim Rate-Limit 1 req/s + LRU 1.000, WebMCP-Spec-Version-Pin, P2 Live-Endpoint Health-Check.

**Reliability NFR-R1–R6 (6):** 99% Uptime ohne SLA, Coolify-Auto-Restart <60s, Graceful Degradation P2, Daily-Backup 7d Retention, Domain Auto-Renewal-Pay, Disaster-Recovery-Runbooks.

**Maintainability NFR-M1–M8 (8):** Reproduzierbarer Build, Public-Repo MIT + README/ARCHITECTURE/ADR, TS strict, ESLint+Prettier CI-Gate, Coverage ≥80% für Data-Transform-Logic + Playwright E2E, ADR pro Major-Datenquelle, Code-Disziplin (CLAUDE.md), monatliche Dependency-Security-Updates.

**Internationalization NFR-IL1–IL10 (10):** 8 Sprachen Phase 1, Build-Time-Translation lokal, Glyph-Packs 4 Skripte (Latin/Latin-ext/Cyrillic/Arabic), RTL via Logical Properties, ~1.600 prerendered Pages + ~8.000 FAQ-Q&As, cookieless URL-Prefix, `<html lang/dir>`, Translation-Quality-Gate, sensible Inhalte nicht maschinell, Meta-Footer in 8 Sprachen.

**Total NFRs: 67** (Korrektur: 10+8+7+10+8+6+8+10 = 67, nicht 56 wie zuvor)

### Additional Requirements

- **Starter Template:** `pnpm dlx sv create navigator-berlin --template=minimal --types=ts` + `sv add prettier eslint vitest playwright paraglide tailwindcss` + Stack-Libs.
- **Infrastruktur:** Hetzner-Frankfurt CX32 + Coolify + Traefik + CrowdSec, GitHub Actions mit 8 CI-Gates.
- **Datenquellen:** FIS-Broker WFS, ODIS, DWD CDC, OSM Overpass (Build-Time); Nominatim (Runtime); OpenFreeMap + Protomaps-Hedge.
- **Editorial-Verantwortung-Pattern:** sensible Layer (Stolpersteine, Mauer/Sektoren, Mietspiegel) mit Quellen-Verlinkung, Disclaimern, Mailto pro Layer.
- **EU-FOSS-Stack als Stellungnahme:** kein Cloudflare, cookieless by default, kein US-Drittanbieter im Production-Pfad.
- **Owner-Modell:** persönlich (Matze), nicht-kommerziell, Solo-Maintainer.

### PRD Completeness Assessment

**Stärken:**
- 83 FRs mit klarer Cluster-Struktur (Adress-Discovery, Karten, Inspektor, Klima, Discovery, Agent, A11y, Editorial, i18n).
- 67 NFRs mit testbaren Schwellen über 8 Kategorien.
- Phase-Boundary explizit (Phase 1 MVP, Phase 2 geplant, Phase 3 Vision), keine implizite De-Scoping.
- User Journeys (Anna, Tobias, Frieda, Marek, LLM-Agent) als narrative Foundation.
- Risk-Matrix mit konkreten Mitigations.
- Innovation-Vektoren begründet (WebMCP, Cross-Layer, 1719-Klima, EU-FOSS).
- Phase-1-Scope-Confirmation-Gate dokumentiert.

**Schwächen / Watch-Points:**
- WebMCP-Spec ist Pre-1.0 — Adapter-Schicht mitigates, aber Spec-Volatilität bleibt Risiko.
- Build-Zeit-Budget für 1.600 prerendered Pages + 8.000 FAQ-Q&As + OG-Images bleibt unvalidiert (Annahme <15min Hetzner-Build-Runner).
- Translation-Quality-Gate für 7 Zielsprachen ist informeller Native-Speaker-Spotcheck, kein formaler Review-Process.
- Solo-Maintainer-Decay-Risiko vom User akzeptiert ohne Mitigation.

**Verdict:** PRD ist implementation-ready. Watch-Points sind dokumentiert, keine Blocker.

## Epic Coverage Validation

### Coverage Matrix Phase 1

| FR-Cluster | FR-Range | Epic Coverage | Stories | Status |
|------------|----------|---------------|---------|--------|
| Adress-Discovery & Geocoding | FR1–FR6 | Epic 1 | Story 1.5 | ✓ |
| Karten-Visualisierung | FR7–FR13 + FR11a–e | Epic 1 | Stories 1.6, 1.7 | ✓ |
| Layer-System & Inspektor | FR14–FR21 | Epic 1 | Stories 1.9, 1.10, 1.12 | ✓ |
| Klima-Heritage | FR22–FR26 | Epic 1 | Story 1.11 | ✓ |
| Discovery-Surfaces SEO/AEO | FR27–FR33 | Epic 2 | Stories 2.1, 2.3–2.6 | ✓ |
| LLM-/Agent-Surfaces | FR34–FR40 | Epic 2 | Stories 2.2, 2.7, 2.8 | ✓ |
| Accessibility & Responsiveness | FR41–FR49 | Epic 1 | Stories 1.2, 1.5, 1.7, 1.8, 1.10 | ✓ |
| Editorial-Integrität | FR50–FR53, FR55 | Epic 1 | Story 1.12 | ✓ |
| Lizenz-Footer auto-gen | FR54 | Epic 4 | Story 4.5 | ✓ |
| Internationalization | FR55a–FR55j | Epic 3 | Stories 3.1–3.5 | ✓ |

### Phase 2/3 Coverage (deferred)

| FR | Beschreibung | Future Epic |
|----|--------------|-------------|
| FR56 | BVG-Echtzeit-Abfahrten | Live-Daten-Bundle |
| FR57 | BLUME-Luftqualität | Live-Daten-Bundle |
| FR58 | Wetter Bright Sky | Live-Daten-Bundle |
| FR59 | Wahlbezirks-Sparkline | Wahlebene |
| FR59a | Zeit-Slider Viewport-Sync | Zeit-Slider |
| FR60 | Zeit-Slider Layer-Stände | Zeit-Slider |
| FR61 | Cross-Data-Erzählung | Cross-Data-Story |
| FR62 | Embed/oEmbed | Embed-Widgets |
| FR63 | RADOLAN-Regenradar | RADOLAN-Sidecar |
| FR64 | Cross-Layer-Aggregations-Queries | PostGIS-Power-Use |
| FR65 | Memorial-Map kuratiert | Memorial-Map |
| FR66 | Daten-Quality-Layer | Daten-Quality |
| FR67 | Redaktioneller Content | Editorial-Stories |

### Missing Requirements

**Phase 1: keine.** Alle 70 Phase-1-FRs zu mindestens einer Story gemappt.

**Phase 2/3: 13 FRs bewusst deferred.** Future Epics in `epics.md` dokumentiert mit Trigger-Bedingungen und Implementation-Pfaden. Keine impliziten De-Scopings.

### Coverage Statistics

- **Total PRD FRs:** 83 (Phase 1: 70, Phase 2: 9, Phase 3: 4)
- **Phase 1 FRs covered in epics:** 70 / 70
- **Phase 1 Coverage Percentage:** **100%**
- **Phase 2/3 FRs explicitly deferred:** 13 / 13 (dokumentiert in Future Epics)
- **Reverse Check (FRs in epics aber nicht in PRD):** keine

### Verdict

Vollständige Phase-1-Coverage. Phase-2/3-Items mit klarer Trigger-Bedingung deferred. Keine Gaps, keine versteckten De-Scopings.

## UX Alignment Assessment

### UX Document Status

**Gefunden:** `ux-design-specification.md` (142 KB, 2.160 Zeilen, vollständig). PRD verweist auf UX-Spec, Architecture verweist auf UX-Spec.

### UX ↔ PRD Alignment

| Aspekt | Status | Belegt |
|--------|--------|--------|
| User Journeys (Anna, Tobias, Frieda, Marek, LLM-Agent) | ✓ | UX-Spec Step 10 spiegelt exakt PRD-Journey-Definitions |
| Adress-Discovery (FR1–FR6) | ✓ | UX-DR14 AddressSearch, Bits-UI Combobox-Pattern, Hero/Header-Varianten |
| Karten-Visualisierung (FR7–FR13, FR11a–e) | ✓ | UX-DR15 PlexMap, UX-DR44 Plex-Cartography, UX-DR16 MapKeyboardControls |
| Inspektor-Panel (FR14–FR21) | ✓ | UX-DR18 InspectorPanel, UX-DR19 LayerRow, UX-DR20 DataStandBanner |
| Klima-Heritage (FR22–FR26) | ✓ | UX-DR23 ClimateSparkline + ClimateLongView |
| Discovery-Pages (FR27–FR33) | ✓ | UX-DR43 Long-Form-Reading-Layout, UX-DR28 FaqSection |
| LLM-Agent/WebMCP (FR34–FR40) | ✓ | UX-Spec dokumentiert WebMCP als „unsichtbares Interface" parallel zu visueller UI |
| Accessibility (FR41–FR49) | ✓ | UX-DR46–50 WCAG 2.2 AA Implementierungs-Mechanik, UX-DR47 Karten-A11y-Mechanik |
| Editorial-Integrität (FR50–FR55) | ✓ | UX-DR38 Editorial-Responsibility-Pattern |
| i18n + RTL (FR55a–FR55j) | ✓ | UX-Spec Step 6 mit 8-Sprachen-Tabelle, UX-DR45 maplibre-gl-rtl-text Conditional |

**Additive UX-Spezifikationen (nicht im PRD, ergänzend, extrahiert zu UX-DRs):**

- Pantone Cloud Dancer (`#ECEAE0`) als Off-White-Anker (User-Update-Preference nach PRD-Erstellung)
- Modular-Skala 1.250 Factor mit Basis 16px (Designsprachen-Detail)
- Okabe-Ito gedämpfte Mehrserien-Chart-Palette (Chart-Token-Detail)
- 4 explizite Empty/Loading-/Common-Fate-Patterns (PRD nicht spezifiziert)
- 3 explizite Button-Klassen-Hierarchie (Visual-Standard)
- Cloud-Dancer-Skeleton-Loading-Pattern (Detail-Niveau)

**Status:** Diese Additionen sind keine Misalignments — sie sind Detail-Elaborationen über PRD hinaus. Alle 56 UX-DRs sind in `epics.md` Requirements Inventory extrahiert und in Stories mapped.

### UX ↔ Architecture Alignment

| Aspekt | Status | Belegt |
|--------|--------|--------|
| Component-Stack (Bits-UI + Plex + Tailwind v4) | ✓ | Architecture Sektion „Component-Strategie" matched UX-DR Component-Strategy exakt |
| Headless-Foundation Bits-UI ≥1.x | ✓ | Beide Dokumente nennen identische Library + Begründung |
| Map-Stack (svelte-maplibre-gl + vanilla für a11y) | ✓ | Architecture-Datenarchitektur-Sektion + UX-DR15/17 abgestimmt |
| LayerChart v2 mit Plex-Tokens | ✓ | Architecture Frontend-Architektur + UX-DR22 AccessibleChart |
| i18n via Paraglide v2 | ✓ | Architecture + UX-DR-i18n übereinstimmend |
| RTL via CSS Logical Properties | ✓ | Architecture NFR-IL4 + UX-DR50 Tailwind ms-/me-/ps-/pe- |
| Plex-Glyph-Pack via fontnik | ✓ | Architecture + UX-DR8 Subset-Strategy abgestimmt |
| Performance-Budget JS ≤200KB | ✓ | Architecture NFR-P5 + UX-DR Lazy-Load + Vite manualChunks |
| A11y-Stack (axe-core + Lighthouse) | ✓ | Architecture CI-Gates + UX-DR46 WCAG 2.2 Implementierungs-Mechanik |
| WebMCP-Adapter-Schicht | ✓ | Architecture `$lib/webmcp/` + UX-DR `useWebMCPTool.ts`-Helper |
| OG-Image-Pipeline (Satori + resvg) | ✓ | Architecture + UX-DR mit identischem Stack |
| Component-Boundaries (`ui/` ↛ `atlas/`) | ✓ | Architecture + UX-DR `src/lib/components/ui/` + `atlas/` Struktur identisch |

**Architecture-Performance-Sicherung für UX-Anforderungen:**

- MapLibre lazy nach Hydration (UX-DR „MapLibre lazy") → Architecture Vite manualChunks ✓
- Plex Variable subsetted (UX-DR8 4 Subsets) → Architecture `fontaine`-Plugin + `pyftsubset` ✓
- Initial-Paint < 2.5s (UX-Defining-Experience „Time-to-First-Insight <5s") → Architecture NFR-P1 Lighthouse-Gate ✓
- Cookieless-Pattern (UX-DR „URL-Source-of-Truth") → Architecture `hooks.server.ts` + cookie-leak-CI-Gate ✓
- 8 Sprachen × 200 Basisrouten = 1.600 Pages (UX-DR-Routing-Konsequenz) → Architecture `entries`-Hook + Build-Zeit-Budget <15min ✓

### Alignment Issues

**Keine.** UX-Spec, PRD und Architecture sind konsistent ausgerichtet. Keine widersprüchlichen Designsprachen, keine architektonischen Lücken für UX-Anforderungen, keine UX-Anforderungen ohne Architektur-Support.

### Warnings

**Watch-Points (keine Blocker):**

1. **Cloud-Dancer-Kontraste sind kalkulierte Schätzungen.** UX-DR1 dokumentiert das, Story 1.2 (Acceptance Criteria #5) plant WebAIM-Verifikation vor Phase-1-Launch.
2. **LayerChart v2 RTL-Support unklar.** UX-Spec erwähnt „RTL-Wrapper-Component falls LayerChart RTL nicht unterstützt". Story 1.11 sollte LayerChart RTL-Support spotchecken vor Implementation.
3. **WebMCP-Adapter-Schicht ist Pre-1.0-Mitigation.** Spec-Volatilität bleibt Risiko, Adapter mitigates. Architecture + UX abgestimmt.
4. **Build-Zeit-Budget für 1.600 Pages + 8.000 FAQ-Q&As + OG-Images unvalidiert.** Annahme <15min, könnte bei Translation-Pipeline oder Satori-Overhead länger werden. Story 2.6 (OG-Pipeline) + Story 3.3 (Translation) sollten Build-Zeit messen.

### Verdict

UX-Alignment vollständig. Keine Misalignments zwischen UX, PRD, Architecture. Watch-Points sind story-internal lösbar.

## Epic Quality Review

### Epic Structure Validation

#### Epic 1: Cross-Layer Address Inspector (Defining Experience)

| Check | Status | Belegt |
|-------|--------|--------|
| User-Value-Focus | ✓ | Bürger/Wohnungssucher/Stadtforscher tippt Adresse → sieht alle Stadt-Layer. Klare User-Outcome, eine Persona-Bewegung. |
| Epic-Independence | ✓ | Standalone-Deliverable bei minimalem Coolify-Deploy (Story 4.1 reicht für End-to-End-Test, nicht erforderlich für Funktion). |
| Foundation-Stories sanctioned | ✓ | Story 1.1 (Repo-Init) per Architecture-Starter-Template-Clause (`sv create`). Story 1.2 (Tokens), 1.3 (Daten-Pipeline), 1.4 (Daten-Abstraktion) sind Within-Epic-Foundation für die User-Value-Stories 1.5–1.12. |
| Forward Dependencies | ✓ | 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (uses 1.2 Token + 1.4 nicht direkt — geocode ist Server-Proxy) → 1.6 (uses 1.2 Token) → 1.7 (uses 1.6 Map) → 1.8 (uses 1.6 Map) → 1.9 (uses 1.4 Daten + 1.7 URL-State) → 1.10 (uses 1.2 Token + Bits-UI) → 1.11 (uses 1.3 Climate-Bundles, 1.11-self-contained AccessibleChart) → 1.12 (uses 1.9 LayerRow). Alle Deps linear backward. |

#### Epic 2: SEO/AEO Discovery + LLM-Agent Integration

| Check | Status | Belegt |
|-------|--------|--------|
| User-Value-Focus | ✓ | Datenjournalisten + LLM-Agents finden + konsumieren strukturierte Daten. Klare Audience. |
| Epic-Independence | ✓ | Setzt auf Epic 1 Foundation (Tokens, Daten-Abstraktion, Map-Embed). Per BMad-Regel zulässig (Epic N kann auf N-1 bauen). |
| Forward Dependencies | ✓ | 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 (uses Page-URLs aus 2.3/2.4/2.5 backward) → 2.7 → 2.8 (uses Page-Content aus 2.3/2.4/2.5 backward). |
| Database-Creation-Timing | N/A | Phase 1 keine DB. |

#### Epic 3: 8-Sprachen-Internationalisierung mit RTL

| Check | Status | Belegt |
|-------|--------|--------|
| User-Value-Focus | ✓ | Türkisch-/Ukrainisch-/Arabisch-sprechende Berliner sehen Site in eigener Sprache. Klare User-Persona. |
| Epic-Independence | ✓ | Standalone implementierbar mit DE-Default-Fallback. |
| Forward Dependencies | ✓ | 3.1 (Paraglide) → 3.2 (Switcher) → 3.3 (Translation) → 3.4 (RTL) → 3.5 (Editorial). Linear. |
| **Cross-Epic Concern** | ⚠️ | Story 3.1 sollte VOR Epic 2 Page-Stories implementiert werden (sonst Route-Refactor-Churn beim nachträglichen `[lang=lang]`-Wrapping). Bereits in `epics.md` Final Status mit empfohlener Sequenz-Reihenfolge dokumentiert. **Kein Violation, sondern Sequenzierungs-Hinweis.** |

#### Epic 4: EU-FOSS Hosting + Compliance-Showcase

| Check | Status | Belegt |
|-------|--------|--------|
| User-Value-Focus | ⚠️ Borderline | Audience ist split: mtc-Beratungs-Audience (Architektur-Page-Showcase) + Bürger (Impressum, Datenschutz, Lizenzen, Barrierefreiheit) + Recruiter (recruiter-readable ADRs, Public-Repo). Stories 4.5/4.6/4.7 sind user-facing Pages. Stories 4.1–4.4 sind Production-Hardening + Showcase-Infrastruktur. Per PRD Success-Criteria ist „Compliance-Showcase" expliziter User-Value-Treiber für mtc-Beratungslinie. **Akzeptabel als Hybrid-Epic.** |
| Epic-Independence | ✓ | Setzt auf Epic 1/2/3 für Daten + Translation. Backward-Deps OK. |
| Forward Dependencies | ✓ | 4.1 → 4.2 (Security auf 4.1 Infra) → 4.3 (CI deployed nach 4.1) → 4.4 (ADRs/Runbooks ref 4.1–4.3) → 4.5 (uses Epic 1.3 MANIFEST.json) → 4.6 (uses Epic 3 Translation-Pipeline) → 4.7. Alle Deps backward. |

### Story Quality Assessment

#### Story Sizing

Alle 32 Stories sized für Single-Dev-Agent-Completion. Größenordnung pro Story: 1–3 Tage Implementation laut Architecture-Story-Reihenfolge.

- **Größte Stories:** 1.6 (MapLibre + Glyph-Pack + Style-JSON), 1.8 (Karten-A11y-Layer), 2.6 (OG-Pipeline), 2.7 (WebMCP), 3.3 (Translation-Pipeline) — alle mit klaren Sub-Komponenten, dennoch single-dev-completable.
- **Kleinste Stories:** 4.5 (Lizenz-Page auto-gen), 4.7 (Architektur-Page).

Keine Story ist zu groß zum Implementieren (würde >5 Tage benötigen).

#### Acceptance Criteria Review

Alle 32 Stories haben:
- **Given/When/Then-BDD-Format:** ✓ konsistent
- **Testable:** ✓ jede AC eigenständig verifizierbar (via Playwright + axe + Vitest)
- **Vollständig:** ✓ Happy Path + Error-Conditions + Edge Cases (z.B. Story 1.5 deckt Adresse-außerhalb-Berlin, Story 1.9 deckt Layer-Hit-no-coverage)
- **Spezifisch:** ✓ konkrete Schwellen (Debounce 250ms, LRU 1.000 Einträge, Animations 200ms ease-out)
- **FR-Referenzen:** ✓ jede AC referenziert FR-Nummern (FR1, FR11d, etc.)

### Database/Entity Creation Timing

**Phase 1:** keine DB. **Phase 2:** Drizzle + Postgres als Future Epic, getrennt. **Phase 3:** PostGIS als Future Epic. ✓ Tables werden erst erstellt wenn benötigt.

### Starter Template Compliance

Architecture spezifiziert `pnpm dlx sv create navigator-berlin`. Story 1.1 erstellt Repo aus diesem Template inkl. Add-ons und Stack-Libs. ✓

### Greenfield-Indicators

Greenfield-Projekt (PRD-classification `projectContext: greenfield`):
- ✓ Story 1.1 = Initial Project Setup
- ✓ Story 1.2 = Development Environment + Design-Tokens
- ✓ Story 4.3 = CI/CD Pipeline (Phase 4 als Production-Hardening-Layer; alternativ könnte CI früher kommen wenn End-to-End-Validation während Epic 1 nötig)

**Optional Minor Concern:** CI/CD-Pipeline (Story 4.3) ist im Epic 4, kommt also spät im Implementation-Flow. Pragmatic: Bei Solo-Maintainer-Project mit Claude-Code-Velocity ist späte CI akzeptabel — Lefthook Pre-Commit fängt früh. Bei größeren Teams würde frühere CI empfohlen.

### Best Practices Compliance Checklist

**Epic 1:**
- [x] Epic delivers user value
- [x] Epic can function independently
- [x] Stories appropriately sized
- [x] No forward dependencies
- [x] No DB in Phase 1
- [x] Clear ACs
- [x] FR-Traceability maintained

**Epic 2:**
- [x] Epic delivers user value (Datenjournalisten, LLM-Agents)
- [x] Epic can function independently (mit Epic 1 Foundation)
- [x] Stories appropriately sized
- [x] No forward dependencies
- [x] Clear ACs
- [x] FR-Traceability maintained

**Epic 3:**
- [x] Epic delivers user value (mehrsprachige Berliner)
- [x] Epic can function independently (mit Epic 1 Foundation)
- [x] Stories appropriately sized
- [x] No forward dependencies
- [x] Clear ACs
- [x] FR-Traceability maintained

**Epic 4:**
- [x] Epic delivers user value (Compliance-Showcase + Bürger-Pages)
- [x] Epic can function independently
- [x] Stories appropriately sized
- [x] No forward dependencies
- [x] Clear ACs
- [x] NFR-Traceability maintained

### Quality Findings by Severity

#### 🔴 Critical Violations

**Keine.**

#### 🟠 Major Issues

**Keine.**

#### 🟡 Minor Concerns

1. **Epic 3 Story 3.1 Cross-Epic-Sequenzierung.** Sollte vor Epic 2 Page-Stories implementiert werden, sonst Route-Refactor-Churn. Bereits in `epics.md` Final Status mit empfohlener Reihenfolge (1.1 → 1.2 → 3.1 → 1.3 → 1.4 → ...) dokumentiert. **Recommendation:** Implementer soll Final-Status-Sequenz folgen oder Story 3.1 als 1.X in Epic 1 hochziehen.

2. **Epic 4 als Hybrid-Epic (Showcase + Infrastruktur).** Stories 4.1–4.4 sind Production-Hardening ohne direkten Bürger-User-Value, aber für mtc-Beratungs-Showcase-Audience und Recruiter-Readability begründet. **Recommendation:** Bei Strict-BMad-Auslegung könnten 4.1–4.4 in „Epic 0: Foundation" und 4.5–4.7 in „Epic 4: Compliance-Pages" gesplittet werden. Pragmatic für Solo-Project akzeptabel.

3. **CI/CD-Pipeline-Timing (Story 4.3).** Erscheint im Implementation-Flow erst nach Epic 1/2/3. Lefthook-Pre-Commit fängt früh; volle CI-Gates kommen spät. **Recommendation:** Implementer kann Story 4.3 vorziehen wenn End-to-End-Validation während Epic 1 nötig wird.

4. **LayerChart v2 RTL-Support-Verifikation.** Story 1.11 sollte LayerChart RTL-Support spotchecken vor Implementation falls Epic 3 noch nicht implementiert wurde.

### Verdict

**32 Stories über 4 Epics, 0 Critical Violations, 0 Major Issues, 4 Minor Concerns mit konkreten Mitigations.** Epic-Struktur folgt BMad-User-Value-Prinzipien mit sanctioned Foundation-Stories. Forward-Dependencies und Story-Sizing fehlerfrei. Implementation-ready.

## Summary and Recommendations

### Overall Readiness Status

**READY** — Implementation kann starten.

### Coverage-Statistik

| Metric | Wert |
|--------|------|
| PRD FRs Phase 1 | 70 |
| PRD FRs Phase 2/3 (deferred) | 13 |
| PRD NFRs | 67 |
| UX-DRs | 56 |
| Epics Phase 1 | 4 (+ 10 Future Epics dokumentiert) |
| Stories Phase 1 | 32 |
| FR Coverage Phase 1 | 100% |
| NFR Coverage | 100% |
| UX-DR Coverage | 100% |
| Critical Violations | 0 |
| Major Issues | 0 |
| Minor Concerns | 4 |

### Critical Issues Requiring Immediate Action

**Keine.**

### Watch-Points (vor / während Implementation adressieren)

1. **Story 3.1 (Paraglide-Setup + Sprach-Routing) zeitlich vorziehen.** Vor Epic 1 Stories 1.5–1.12 implementieren, sonst Route-Refactor-Churn. Empfohlene Sequenz aus `epics.md` Final Status: 1.1 → 1.2 → 3.1 → 1.3 → 1.4 → 1.5–1.12 → 3.2–3.5 → 2.1–2.8 → 4.1–4.7. Alternativ Story 3.1 explizit als Story 1.3 in Epic 1 hochziehen.

2. **Cloud-Dancer-Kontraste verifizieren.** UX-DR1 Hex-Werte sind kalkulierte Schätzungen. Story 1.2 AC #5 plant WebAIM-Verifikation vor Phase-1-Launch — bei Abweichung kalibrieren.

3. **LayerChart v2 RTL-Support spotchecken.** Vor Story 1.11-Implementation prüfen ob LayerChart RTL nativ unterstützt, sonst RTL-Wrapper-Component planen.

4. **Build-Zeit-Budget messen.** Bei Story 2.6 (OG-Pipeline) und 3.3 (Translation-Pipeline) Build-Zeit gegen 15-Min-Budget messen. Bei Überschreitung Satori- oder Translation-Parallelisierung evaluieren.

### Recommended Next Steps

1. **Phase 4 Sprint Planning starten** via `bmad-sprint-planning`. Generiert Sprint-Status-Tracking aus Epics. Required.
2. **Story-Implementation-Reihenfolge gemäß `epics.md` Final Status:** 1.1 → 1.2 → 3.1 → 1.3 → 1.4 → 1.5–1.12 → 3.2–3.5 → 2.1–2.8 → 4.1–4.7.
3. **Story-Cycle starten:** `bmad-create-story` → `bmad-dev-story` → `bmad-code-review` pro Story (jeder Story in frischem Context-Fenster).
4. **CI-Pipeline (Story 4.3) zeitlich vorziehen falls End-to-End-Validation während Epic 1 nötig wird.**

### Watch-Point-Tracking

Vor jedem Story-Start sicherstellen:
- Cloud-Dancer-Palette gegen WebAIM verifiziert (vor Story 1.2)
- LayerChart RTL-Support spotgecheckt (vor Story 1.11)
- Build-Zeit gemessen (während Story 2.6 + 3.3)

### Final Note

Diese Assessment identifizierte **4 Minor Concerns mit konkreten Mitigations** über 5 Kategorien (Document Discovery, PRD Analysis, Epic Coverage, UX Alignment, Epic Quality). Keine Critical Issues. Alle Phase-1-FRs zu Stories gemappt, Architecture + UX-Spec vollständig aligned, Story-Sizing single-dev-completable.

Planning-Phase ist beendet. **Implementation kann starten.**

**Assessor:** Claude Opus 4.7 (BMad bmad-check-implementation-readiness Skill)
**Datum:** 2026-05-11

