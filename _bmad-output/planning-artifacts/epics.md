---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-05-11'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# navigator.berlin - Epic Breakdown

> **User-Lock 2026-05-16 — i18n-Deferral:** EN-Coverage komplett verschoben in Future-Epic „i18n-Phase-3-EN-Coverage" (Phase 3, Post-Hard-Launch). Phase 1 ist DE-only. Alle „DE+EN", „EN-Variante", „Locale-aware-Routes" in Epic 2/4/6-Story-Bodies sind in der aktuellen Phase NICHT zu implementieren. Story-spezifische DE-Reduktion: 2.3/2.4/2.5a entfallen EN-Pages, 2.11/2.12 entfallen EN-Strings, 2.5b entfällt EN-FAQ-Templates, 4.5/4.6/4.7 entfallen EN-Varianten, 6.4 entfällt EN-Wahl-Detail-Page. Routes ohne `[lang]`-Param (Memory `project_paraglide_reroute.md`). Reaktivierung Phase 3 wenn Search-Console oder LLM-Referrer EN-Demand zeigen. Siehe Future-Epics-Section.

## Overview

This document provides the complete epic and story breakdown for navigator.berlin, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Adress-Discovery & Geocoding**

FR1: Nutzer kann Berliner Adresse, Kiez-Namen oder Bezirks-Namen als Freitext eingeben.
FR2: Nutzer sieht ab dem zweiten getippten Zeichen passende Vorschläge (Suggest-as-you-type).
FR3: Nutzer kann Vorschlag per Maus-Klick, Tap, Enter oder Pfeiltasten+Enter selektieren.
FR4: Bei nicht-eindeutiger Eingabe sieht Nutzer Disambiguierungs-Liste mit bis zu 10 Treffern, sortiert nach Relevanz.
FR5: Nutzer kann mit geografischem Mittelpunkt eines Bezirks/Kiezes statt Punkt-Adresse arbeiten.
FR6: Bei unbekannter oder außerhalb-Berlin-liegender Eingabe sieht Nutzer klare Fehlermeldung mit Vorschlag „nur Berliner Adressen unterstützt".

**Karten-Visualisierung**

FR7: Nutzer sieht interaktive MapLibre-Karte im Plex-Cartography-Style (Off-White-Palette, Hairline-Linien, Plex-Beschriftung).
FR8: Karte zoomt nach Adress-Auswahl automatisch auf passenden Zoom-Level (Punkt-Adresse, Kiez, Bezirk).
FR9: Nutzer kann Karte per Maus-Drag, Touch-Pan, Pfeiltasten oder dedizierten Pan-Buttons verschieben.
FR10: Nutzer kann zoomen per Maus-Wheel, Pinch-Gesture, +/−-Tasten oder dedizierten Zoom-Buttons.
FR11: Ausgewählte Adresse wird auf Karte mit klar erkennbarem Marker hervorgehoben.
FR11a: Nutzer kann sich frei auf Karte bewegen — Pan und Zoom unabhängig von Adress-Auswahl.
FR11b: Geladene Layer und sichtbare POIs aktualisieren sich live entsprechend aktuellem Viewport (Bbox + Zoom-Level).
FR11c: Nutzer kann an beliebiger Karten-Position klicken/tappen und erhält Inspektor-Panel mit Layer-Hits für genau diesen Punkt.
FR11d: Aktuelle Viewport-Konfiguration (Bbox, Zoom, aktive Layer) wird in URL als Query-Parameter gespiegelt — deeplinkbar und teilbar.
FR11e: Per Zoom-Level ändert sich automatisch Layer-Granularität: niedriger Zoom = Bezirks-/Prognoseraum, höher = LOR-Bezirksregion/Planungsraum, höchster = POIs/Punkt-Daten.
FR12: Boundary der ausgewählten LOR-Region/Bezirk wird als --accent-Outline hervorgehoben.
FR13: Nutzer sieht in Karten-Legende aktuell aktive Layer mit numerischem Wertebereich und Farbskala.

**Layer-System & Inspektor-Panel**

FR14: Bei Adress-Auswahl öffnet sich Inspektor-Panel mit allen Treffer-Layern (Phase 1: Bundles A + B + C + Klima).
FR15: Pro Layer im Panel: Wert, kurze Erklärung, Datenstand („Stand: YYYY-MM, Quelle: X"), „Fehler im Eintrag?"-Mailto-Link.
FR16: Nutzer kann via Tastatur-Shortcut `/` Layer-Auswahl-Palette öffnen, Layer-Namen tippen, per Enter aktivieren/deaktivieren.
FR17: Auf Mobile-Geräten erscheint Layer-Auswahl als Bottom-Sheet mit 5 zuletzt genutzten Layern + Such-Input.
FR18: Aktive Layer werden auf Karte transparent übereinander gerendert; sequentielle Skalen für ordinale Daten, divergierende für vorzeichenbehaftete, Outline-only für Boundary-Kategorien.
FR19: Nutzer kann zu jeder Karten-Visualisierung gleichwertige Daten-Tabelle aufrufen — sortierbar, tastatur-navigierbar.
FR20: Layer-Hits ohne Daten-Coverage werden explizit als „Daten nicht vorhanden" ausgewiesen.
FR21: Trinkbrunnen-Layer zeigt sichtbaren Saisonalitäts-Hinweis (Mai–Oktober aktiv); November–April als „außerhalb der Saison" markiert.

**Klima-Heritage (DWD-Zeitreihen)**

FR22: Pro Adresse wird nächstgelegene DWD-Station automatisch ermittelt und im Klima-Block angezeigt (Dahlem, Buch, Tempelhof, Brandenburg-Schönefeld).
FR23: Nutzer sieht Sparkline der Sommertage (T_max ≥ 25°C) pro Jahr seit 1950 für seine Station.
FR24: Nutzer sieht analog Sparklines für Frosttage und heiße Tage (T_max ≥ 30°C).
FR25: Für Berlin-Dahlem zusätzlich Long-View-Chart der Jahresmitteltemperatur ab 1719.
FR26: Jede Klima-Sparkline ist tastatur-navigierbare LayerChart-Komponente mit Daten-Tabellen-Alternative.

**Discovery-Surfaces (SEO/AEO-Pages)**

FR27: Jeder Berliner Bezirk hat eigene prerenderte URL `/bezirk/{slug}` mit Lead-Text, Steckbrief, Karten-Embed, FAQ-Sektion.
FR28: Jede LOR-Bezirksregion (Kiez) hat eigene prerenderte URL `/kiez/{slug}` analog zu FR27.
FR29: Jedes Layer-Konzept hat eigene prerenderte URL `/layer/{slug}` mit Erklär-Text, Lizenz-Hinweis, Beispiel-Visualisierung.
FR30: Jede Bezirks-, Kiez- und Layer-URL trägt eigene FAQ-Sektion mit 5–10 datengefüllten Q&As im JSON-LD `FAQPage`-Format.
FR31: Jede prerenderte URL hat dynamisch gerendertes Open-Graph-Bild mit Karten-Snapshot und Top-3-Statistik.
FR32: Jede prerenderte URL trägt eigenes `<title>` und eigene `<meta description>`, generiert aus Daten der Page.
FR33: Nutzer kann jede prerenderte URL ohne JavaScript lesen (Progressive Enhancement); interaktive Karte ist optionale Erweiterung.

**LLM-/Agent-Surfaces (GEO/AEO)**

FR34: Site exponiert `/llms.txt` mit kondensierter Navigations-Übersicht aller Bezirks-/Kiez-/Layer-Pages.
FR35: Site exponiert `/llms-full.txt` mit Bezirks-/Kiez-/Layer-Page-Inhalten als Single-File-Quelle.
FR36: Jede prerenderte URL trägt JSON-LD Structured Data im Schema-Typ `Place`, `AdministrativeArea`, `Dataset`, `FAQPage` oder `WebSite`.
FR37: Site registriert sich als WebMCP-Server (via webmcp.dev) mit mindestens 5 Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`).
FR38: Site exponiert aktive Adresse und geladene Layer als WebMCP-Resources mit URI-adressierbarem Datenmodell.
FR39: Site bietet mindestens 3 WebMCP-Prompt-Templates an („Was ist an dieser Adresse besonders?", „Vergleiche diese zwei Kieze", „Erkläre den Layer X").
FR40: Jeder Datenwert im Inspektor-Panel trägt maschinenlesbare Quellen-Attribution für LLM-Agent-Zitation.

**Accessibility & Responsiveness**

FR41: Jede Page hat Skip-Link als erstes fokussierbares Element, der zum Hauptinhalt springt.
FR42: Nutzer kann alle Funktionen ausschließlich per Tastatur erreichen.
FR43: Jede Karten-Interaktion (Adress-Auswahl, Layer-Aktivierung, POI-Fokus) löst ARIA-Live-Region-Update aus.
FR44: Karten-Inhalte (POIs, Boundaries) sind parallel als semantische DOM-Liste mit `<button>`/`<a>`-Elementen zugänglich.
FR45: Alle Drag-Operationen (Karten-Pan, Bottom-Sheet) haben alternative Single-Click/Tap-Bedienung (WCAG 2.2 SC 2.5.7).
FR46: Alle interaktiven Elemente erfüllen Target-Size-Minimum von 44×44 CSS-Pixeln.
FR47: Layout passt sich responsive an Desktop (>1024px), Tablet (641–1024px), Smartphone (≤640px) an, ohne Funktionsverlust.
FR48: Site respektiert `prefers-reduced-motion` — Karten-Übergänge und UI-Animationen entfallen, Endzustand sofort.
FR49: Focus-Ringe sind sichtbar und werden nicht durch sticky Elemente verdeckt (WCAG 2.2 SC 2.4.11/2.4.12).

**Editorial-Integrität & Lizenz-Transparenz**

FR50: Jeder Stolperstein-Eintrag verlinkt zur Berliner Koordinierungsstelle und/oder Wikipedia als Primärquelle.
FR51: Personen-Hintergründe zu Stolpersteinen werden als zitierter Auszug mit Quellen-URL ausgespielt, niemals algorithmisch oder LLM-generiert.
FR52: Mauer-/Sektoren-Grenzen tragen historischen Stand-Hinweis und Datenquellen-Verlinkung.
FR53: Pro Layer hat Nutzer sichtbaren „Fehler im Eintrag?"-Mailto-Link zur Footer-Adresse.
FR54: Footer zeigt Lizenz-Matrix mit Quelle, Stand, Lizenz pro Layer; auto-generiert aus `static/layers/MANIFEST.json`.
FR55: Mietspiegel- und Bodenrichtwert-Layer zeigen Disclaimer „ersetzt keine rechtliche Aussage".

**Internationalization & Meta-Footer**

FR55a: Site unterstützt 8 Sprachen ab Phase 1: DE (Default), EN, TR, UK, AR, ES, FR, IT.
FR55b: Jede URL trägt Sprach-Prefix (`/de/...`, `/en/...`, etc.). Sprach-Wechsel verändert nur Prefix, behält Viewport, aktive Layer, Adresse bei.
FR55c: Beim ersten Besuch wertet Server `Accept-Language`-Header aus und leitet zur passenden Sprach-Route weiter (302, kein Cookie). Default DE bei nicht-unterstützter Browser-Sprache.
FR55d: Sprach-Switcher als kompaktes Element im Always-Reachable-Footer auf jeder Page; optional dezent in Hero-Page-Top-Right. Tastatur-bedienbar, screenreader-zugänglich.
FR55e: Pro prerenderter URL `<link rel="alternate" hreflang="...">`-Tags für alle 8 Sprachvarianten; `hreflang="x-default"` zeigt auf deutsche Version.
FR55f: Site rendert korrekt im Right-to-Left-Layout für Arabisch (`<html lang="ar" dir="rtl">`). UI-Chrome flippt automatisch via Logical CSS Properties; Karten-Inhalt bleibt LTR; Karten-Beschriftung in Plex Arabic.
FR55g: UI-Strings, FAQ-Q&As und Erklärtexte in allen 8 Sprachen verfügbar. Übersetzung im Build-Step lokal via Claude (kein Laufzeit-API-Spend, kein US-Drittanbieter).
FR55h: Übersetzungen in `src/lib/i18n/{lang}.json`-Bundles committet, manuell pro Release reviewt. Translation-Quality-Disclaimer im Footer-Datenschutz.
FR55i: Stolperstein-Personen-Hintergründe und Editorial-Texte werden NICHT maschinell übersetzt — Wikipedia-Quellen in Zielsprache verlinkt; sonst DE/EN-Original mit Hinweis.
FR55j: Always-Reachable-Meta-Footer auf jeder Page enthält in jeder Sprache: Impressum (§5 TMG), Datenschutz (DSGVO Art. 13 + Cookieless-Statement + Translation-Disclaimer), Lizenzen, Kontakt (Mailto), Architektur (Stack-Showcase), Sprach-Switcher.

**Phase-2-Capabilities (geplant, nicht MVP)**

FR56 (P2): Echtzeit-BVG-Abfahrten der nächsten Stops mit Linie, Ziel, Minuten.
FR57 (P2): Aktueller BLUME-Luftqualitäts-Wert (NO₂, PM10, PM2.5) der nächstgelegenen Station mit Aktualisierungs-Zeit.
FR58 (P2): Aktuelles Wetter und 24h-Vorhersage über Bright Sky oder Open-Meteo.
FR59 (P2): Wahlbezirks-Ergebnisse der letzten 3 BVV/AGH/BTW als Sparkline und detaillierte Auflistung.
FR59a (P2): Zeit-Slider mit aktuellem Viewport synchronisiert — Layer-Daten aktualisieren sich bei Slider-Bewegung; beide Achsen in URL gespiegelt.
FR60 (P2): Zeit-Slider zwischen 3–5 Jahresständen ausgewählter Layer (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete).
FR61 (P2): Cross-Data-Erzählung pro Adresse — deterministisch generierte Template-Texte aus Datenwerten.
FR62 (P2): Embed-Snippet (`<iframe>` oder oEmbed) pro Bezirks-/Kiez-Page mit Attribution und Lizenz-Footer.
FR63 (P2): RADOLAN-Regenradar-Overlay mit 1km-Raster und 10-Minuten-Aktualisierung über Berlin.

**Phase-3-Capabilities (Vision)**

FR64 (P3): Räumliche Cross-Layer-Aggregations-Queries für Datenjournalisten.
FR65 (P3): Kuratierte Memorial-Map mit „was nicht mehr da ist"-Schicht.
FR66 (P3): Daten-Quality-Layer mit Aktualisierungs- und Lücken-Anzeige pro Layer pro Region.
FR67 (P3): Redaktionell kuratierte Geschichten pro Adresse („Schreibt-Sich-Mit-Liebe"-Datasets).

### NonFunctional Requirements

**Performance**

NFR-P1: LCP < 2.5s auf Mid-Tier-Mobilgerät (Moto G Power, 4G Slow, Lighthouse CI) für Landing, Bezirks-, Kiez-Routen.
NFR-P2: INP < 200ms für Layer-Toggle, Karten-Klick, Adress-Suggest.
NFR-P3: CLS < 0.1 auf allen prerenderten Routen.
NFR-P4: TTFB < 200ms Frankfurt-Edge im 50.-Perzentil.
NFR-P5: Initial JS gzipped ≤ 200 KB für Landing und Kiez-Routen; CI-Gate.
NFR-P6: Gesamt-Page-Weight Landing ≤ 500 KB inkl. Plex Variable Font (subsetet).
NFR-P7: Lighthouse Performance ≥ 90 auf allen prerenderten Top-Routen — CI-Gate.
NFR-P8: Lighthouse SEO ≥ 95, Best Practices ≥ 95 — CI-Gate.
NFR-P9: MapLibre lazy nach Hydration geladen, blockiert Initial-Paint nicht.
NFR-P10: Statische GeoJSON-Layer mit `cache-control: public, max-age=2592000, immutable`; Cache-Invalidation per Filename-Hashing.

**Security**

NFR-S1: TLS 1.3 erzwungen; TLS 1.2 nur als Fallback.
NFR-S2: Let's Encrypt-Zertifikat mit Auto-Renewal via Traefik; Ablauf-Lücke < 24h.
NFR-S3: Strict Content-Security-Policy ohne `unsafe-inline`, ohne externe Script-/Style-Quellen außer self-hosted Assets.
NFR-S4: HTTP-Security-Header gesetzt: HSTS preload, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy defensiv.
NFR-S5: CrowdSec-Plugin in Traefik (Streaming-Mode, 60s Decision-Sync); Collections für Traefik, http-cve, base-http, sshd, linux.
NFR-S6: Hetzner-eingebauter Layer-3/4-DDoS-Schutz aktiv.
NFR-S7: Keine US-Drittanbieter-Domains in Production-Network-Requests; verifiziert via Network-Tab-Audit und CI-Linter gegen Allowlist.
NFR-S8: SSH-Zugang nur per Key-Auth, dedizierter Admin-Account ohne Root-Login.

**Privacy / DSGVO**

NFR-PR1: Null `Set-Cookie`-Header verlassen Server in Production; Response-Header-Inspect-Test in CI.
NFR-PR2: Keine personenbezogenen Daten gespeichert/geloggt; Adress-Eingabe clientseitig, Geocoding IP-anonymisiert geproxied.
NFR-PR3: Keine Tracking-Pixel, kein Plausible/Matomo, keine Web-Analytics.
NFR-PR4: Webserver-Access-Logs IP-pseudonymisiert (letztes Oktett gekürzt), 7d Rotation.
NFR-PR5: Keine Cookie-Banner-Pflicht — DSGVO-Konformität durch Architektur.
NFR-PR6: Footer enthält DSGVO-Statement und Datenschutz-Erklärung.
NFR-PR7: Impressum nach §5 TMG vorhanden.

**Accessibility**

NFR-A1: WCAG 2.2 Level AA komplett — alle 50 Erfolgskriterien, in CI via axe-core verifiziert (0 Violations).
NFR-A2: AAA-Kontraste (≥ 7:1) für Body Text und Headings auf Hauptpalette.
NFR-A3: Lighthouse Accessibility ≥ 95 — CI-Gate.
NFR-A4: Tastatur-Navigation flächendeckend: Skip-Link, Adress-Suche, Karten-Pan/Zoom, Layer-Palette, POI-Tab.
NFR-A5: Screenreader-Smoke-Test (NVDA + VoiceOver) vor jedem Major-Release in `docs/runbooks/a11y-smoke-test.md`.
NFR-A6: Target-Size ≥ 44×44 CSS-Pixel für alle interaktiven Elemente.
NFR-A7: Focus-Ringe sichtbar (mindestens 2 px, Kontrast ≥ 3:1), nicht durch sticky Elemente verdeckt.
NFR-A8: `prefers-reduced-motion` respektiert.
NFR-A9: Charts und Karten haben gleichwertige Daten-Tabellen-Alternativen, per `<button>`-Toggle direkt unter Visualisierung.
NFR-A10: BFSG-Konformität im Footer attestiert.

**Integration**

NFR-I1: Build-Zeit-Datenabruf von FIS-Broker-WFS, ODIS-GeoJSON, DWD CDC, OSM-Overpass; Retry mit exponentieller Backoff (3×, 1s/2s/4s).
NFR-I2: Per Datenquelle Health-Check während Build; Build-Abbruch bei Quellen-Ausfall.
NFR-I3: Reprojektion EPSG:25833 → EPSG:4326 zur Build-Zeit; Spotcheck mit 5 Sample-Punkten.
NFR-I4: Pro Layer Source-URL, Abruf-Datum, Lizenz, SHA-256 in `static/layers/MANIFEST.json`.
NFR-I5: Lizenz-Hierarchie eingehalten und in `/lizenzen` und Footer ausgespielt.
NFR-I6: Nominatim-Geocoding-Anfragen rate-limitiert auf 1 req/s; lokaler LRU-Cache für 1.000 häufigste Adressen.
NFR-I7: WebMCP-Spec-Version in `webmcp-manifest.json`; Adapter-Schicht in `$lib/webmcp/` bei Breaking-Change aktualisierbar.
NFR-I8 (P2): Phase-2-Live-Endpunkte mit Health-Check pro Request; bei Ausfall Layer ausgegraut, kein Hängen.

**Reliability**

NFR-R1: Verfügbarkeits-Ziel 99% Uptime/Monat; nicht-kommerziell, kein SLA.
NFR-R2: Coolify-Container-Auto-Restart bei Crash; Restart-Lücke < 60s.
NFR-R3: Graceful Degradation bei Ausfall externer Live-Endpunkte (Phase 2); Layer mit „nicht verfügbar"-Hinweis.
NFR-R4: Daily Backup der Hetzner-Volumes via Coolify mit 7d Retention.
NFR-R5: Domain-Renewal-Auto-Pay aktiviert; Erinnerung 60 Tage vor Ablauf per E-Mail.
NFR-R6: Disaster-Recovery-Runbooks in `docs/runbooks/` für Tile-Provider-Switch, CrowdSec-False-Positive-Whitelist, DB-Restore (P2+), Hetzner-Failover (P3+).

**Maintainability**

NFR-M1: Reproduzierbarer Build: `pnpm install && pnpm fetch && pnpm build` liefert identisches Artefakt; Manifest mit SHA pro Layer.
NFR-M2: Public-Repository auf GitHub mit MIT-Lizenz; README + ARCHITECTURE.md + ADR-Verzeichnis.
NFR-M3: TypeScript strict mode aktiviert; Type-Check-Fehler brechen CI-Build.
NFR-M4: ESLint + Prettier konfiguriert; Lint-Fehler brechen CI-Build.
NFR-M5: Unit-Tests für Daten-Transform-Logik bei ≥ 80% Coverage; UI-Smoke-Tests via Playwright für Top-3-Journeys.
NFR-M6: Pro Major-Datenquelle eine ADR (z.B. ADR-001-tile-provider, ADR-002-webmcp, ADR-003-postgres-deferral).
NFR-M7: Code-Disziplin gemäß CLAUDE.md: keine Backwards-Compat-Hacks, keine Premature-Abstractions, Comments nur für nicht-offensichtliche WHYs, Files < 500 Zeilen.
NFR-M8: Drittanbieter-Dependencies monatlich auf Sicherheits-Updates geprüft; CVE-relevante Updates innerhalb 7 Tagen eingespielt.

**Internationalization**

NFR-IL1: 8 Sprachen Phase 1 (DE, EN, TR, UK, AR, ES, FR, IT) verbindlich; UI-Strings, FAQ-Q&As, Erklärtexte in allen 8 Sprachen.
NFR-IL2: Translation lokal via Claude Code im Build-Step; keine Laufzeit-API-Calls. Bundles committet als `src/lib/i18n/{lang}.json`.
NFR-IL3: Plex-Glyph-Packs decken 4 Skripte: Latin (DE/EN/ES/FR/IT), Latin-ext (TR), Cyrillic (UK), Arabic (AR). Via `fontnik` einmalig gebaut, deployed als `static/glyphs/{fontstack}/{range}.pbf`.
NFR-IL4: RTL-Layout für Arabisch via `dir="rtl"` und CSS Logical Properties; UI-Chrome flippt automatisch, Karten-Inhalt bleibt LTR.
NFR-IL5: Skalierung ~200 deutsche Basisrouten × 8 Sprachen = ~1.600 prerendered HTML-Pages; FAQ ~1.000 × 8 = ~8.000 mit JSON-LD `FAQPage`. Build-Zeit-Budget < 15 min.
NFR-IL6: Sprach-Switcher cookieless — Sprache via URL-Prefix, niemals Cookie/LocalStorage. Browser-Sprach-Erkennung über Server-Side `Accept-Language`-Auswertung mit 302-Redirect.
NFR-IL7: `<html lang="...">` und `dir="ltr"`/`dir="rtl"` korrekt pro Sprache; `<link rel="alternate" hreflang="...">` inkl. `x-default` (DE).
NFR-IL8: Translation-Quality-Gate vor Release: Native-Speaker-Spotcheck für UK, TR, AR. Footer-Disclaimer + Mailto-Pfad für Fehlerhinweise.
NFR-IL9: Erinnerungspolitisch sensible Inhalte werden NICHT maschinell übersetzt — Wikipedia-Quellen in Zielsprache verlinkt, sonst DE/EN-Original mit Hinweis.
NFR-IL10: Always-Reachable-Meta-Footer auf jeder Page in aktiver Sprache; §5 TMG und DSGVO Art. 13 in allen 8 Sprachen.

### Additional Requirements

**Starter Template (Architecture-Decision):** Projekt wird via offizielles Svelte CLI initialisiert: `pnpm dlx sv create navigator-berlin --template=minimal --types=ts`, dann via `sv add prettier eslint vitest playwright paraglide tailwindcss`. Adapter `@sveltejs/adapter-node` interaktiv selektiert. Stack-spezifische Libs nachgezogen (maplibre-gl, layerchart@next, @turf/*, rbush, lru-cache, @lucide/svelte, bits-ui, webmcp, valibot; dev: mapshaper, fontnik, proj4, satori, @resvg/resvg-js, @axe-core/playwright, @lhci/cli, size-limit, lefthook). **Entscheidet Epic 1 Story 1.1.**

**Infrastruktur & Deployment**

- Hetzner-Frankfurt CX32 (8GB RAM / 4 vCPU / 80GB SSD) als Single-Instance-Hosting.
- Coolify als Container-Orchestration mit Auto-Restart und Daily-Backup (7d Retention).
- Traefik als Reverse-Proxy mit Let's-Encrypt-Auto-Renewal und CrowdSec-Plugin.
- GitHub Actions als CI/CD: lint, typecheck, vitest (80% coverage), build, e2e+axe, lighthouse-ci (P≥90/A11y≥95/SEO≥95/BP≥95), bundle-size-check (≤200KB), us-domain-allowlist-check, cookie-leak-check, deploy-on-main via Coolify-Webhook.
- Phase-2-Erweiterung: Drizzle+Postgres-Container, RADOLAN Python-FastAPI-Sidecar.
- Environment via `$env/static/private` und `$env/static/public`: PUBLIC_TILE_URL, NOMINATIM_ENDPOINT, WEBMCP_SPEC_VERSION, BUILD_DATA_SOURCES.

**Integration mit externen Systemen**

- FIS-Broker WFS (Build-Time): Mietspiegel-Wohnlagen, Lärm L_DEN/L_NIGHT, Solarpotenzial, Klimaanalyse, Bodenrichtwerte, Gebäudealter.
- ODIS GeoJSON (Build-Time): Bezirke, Ortsteile, PLZ, LOR-3-Ebenen.
- DWD CDC (Build-Time): Stationen 00403 (Dahlem 1719+), 00400 (Buch), 00433 (Tempelhof), 00427 (Brandenburg).
- OSM Overpass (Build-Time, daily): Stolpersteine.
- Nominatim (Runtime): Geocoding via Server-Proxy mit IP-Anonymisierung, LRU-Cache, 1 req/s Rate-Limit.
- OpenFreeMap (Runtime): Map-Tiles; Protomaps als Hedge-Fallback hinter Env-Var.
- Phase-2: BVG/VBB v6, BLUME, Bright Sky/Open-Meteo.

**Daten-Manifest und Setup**

- `static/layers/MANIFEST.json` mit pro Layer: Source-URL, Abruf-Datum, Lizenz, SHA-256, Zoom-Schwellen, Saisonalitäts-Hinweis.
- `static/climate/` mit JSON-Bundles pro DWD-Station.
- `static/glyphs/` mit MapLibre-Glyph-Pack für 4 Skripte.
- `static/fonts/` mit Plex Variable subsetted (`@fontsource-variable/ibm-plex-*` ins `static/fonts/` kopiert; eigene `@font-face` mit `unicode-range` pro Subset; `fontaine` für Fallback-Metrics).
- `static/map-style.json` mit Plex-Cartography-Style.
- `static/webmcp-manifest.json` mit Spec-Version-Pin.

**Monitoring/Logging**

- IP-pseudonymisierte Traefik-Access-Logs mit 7d-Rotation.
- Coolify-Container-Health-Dashboard.
- `/healthz`-Endpoint für Container-Health.
- Kein externes Monitoring (Anti-Tracking-Linie); Real-User-Monitoring nicht.

**API & Communication**

- Keine Public-API für Drittnutzer.
- Server-Endpoints minimal: `GET /api/geocode`, `GET /api/og/[type]/[slug].png`, `GET /healthz`.
- Server-Communication via SvelteKit Remote Functions (`prerender`/`query`/`form`/`command`/`query.live`).
- WebMCP browser-side via `@mcp-b/global` Polyfill (conditional, Chrome 146+ native) + `@mcp-b/webmcp-ts-sdk`.

**Implementation Patterns (verbindlich für AI Agents)**

- 21 verbindliche „MUST"-Regeln aus Architecture-Doc Sektion „Enforcement Guidelines" (u.a. `@lucide/svelte` statt `lucide-svelte`, Files <500 Zeilen, TS strict, kein `any`, Svelte-5-Runes-Patterns, Cookieless, kein US-Drittanbieter, A11y-First, i18n-First, `$state.raw` für große Objekte, Context-API statt Module-Scope-State, `$derived` über `$effect`, Remote Functions statt ad-hoc fetch, Async via `await`+`<svelte:boundary>`, prerender-`entries`-Hook).
- 8 CI-Gates: Lint, Type, Format, A11y, Bundle, Cookie, US-Domain, Lighthouse.
- ADR-Verzeichnis (`docs/adr/ADR-NNN-*.md`) für Architektur-Decisions.
- Disaster-Recovery-Runbooks in `docs/runbooks/`.

### UX Design Requirements

**Design-Token-System (Cloud Dancer + Plex)**

UX-DR1: Token-Hierarchie in `src/app.css` mit Pantone Cloud Dancer (`#ECEAE0`) als Off-White-Anker. Vollständige Palette: `--bg`, `--bg-elevated`, `--ink`, `--ink-muted`, `--ink-subtle`, `--rule`, `--rule-strong`, `--accent` (`#2A3F7C`), `--accent-soft`, `--focus` (`#0030C8`). Kontrast-Verifizierung gegen Cloud Dancer via WebAIM/axe vor Phase-1-Launch (alle Hex-Werte sind kalkulierte Schätzungen).
UX-DR2: Semantische State-Tokens: `--state-error` (`#A12626`), `--state-warning` (`#9E5520`), `--state-success` (`#0E6549`), `--state-info` (= `--accent`). Alle AAA gegen Cloud Dancer.
UX-DR3: Chart-Token-Layer mit Plex-Aliases: `--chart-grid`, `--chart-axis`, `--chart-axis-text`, `--chart-line`, `--chart-line-secondary`, `--chart-area`, `--chart-point`, `--chart-tooltip-bg`/`-ink`, `--chart-annotation`. Tooltip-Polarität umgekehrt (`#141414` bg, `#ECEAE0` ink).
UX-DR4: Mehrserien-Palette „Okabe-Ito gedämpft": `--chart-cat-1` bis `--chart-cat-6` (Indigo, Vermillion, Bluish Green, Reddish Purple, Amber, Sky Blue), max 6 Serien gleichzeitig, alle AAA gegen Cloud Dancer.
UX-DR5: Choropleth-Regeln durchgängig: Sequentiell (single-hue Cloud Dancer → Accent), Divergierend (Vermillion ↔ Indigo mit Cloud Dancer Mitte), Kategorial (max 5–6 Okabe-Ito; niemals 12 Knallfarben). Patterns/Schraffuren für Extremwerte (SC 1.4.1).

**Typografie-System (IBM Plex)**

UX-DR6: IBM Plex (OFL 1.1) als integrierte Familie: Serif (Headings, Lead, Annotations), Sans (Body, UI, Buttons), Mono (Zahlen, Bodenrichtwerte, Datumsangaben, Stand-Hinweise). Plus Plex Sans Arabic als separate Familie für `locale === 'ar'`, conditional load.
UX-DR7: Modular Größen-Skala (Factor 1.250, Basis 16 px) als CSS-Variablen `--text-xs` bis `--text-4xl`. Hero-`--text-4xl` skaliert auf Mobile ≤640px auf `--text-2xl`. Sonstige Größen konstant.
UX-DR8: Plex-Variable-Fonts subsetted via `pyftsubset` auf 4 Subsets: `latin` (U+0000-024F), `latin-ext` (TR), `cyrillic`+`cyrillic-ext` (UK), `arabic`. Lade-Strategie: Plex Sans/Serif Variable + Plex Mono Regular immer; Plex Sans Arabic conditional bei `locale === 'ar'`. `font-display: swap`, `<link rel="preload">` für Initial-Subset.

**Spacing & Layout-Foundation**

UX-DR9: Spacing-Tokens basis 4px (`--space-1` bis `--space-24`). Modulare Skala 4/8/12/16/24/32/48/64/96 px.
UX-DR10: Drei Breakpoints: Mobile (≤640px), Tablet (641–1024px), Desktop (>1024px), optional Large Desktop (>1440px). Mobile-First mit Tailwind v4. Container-Padding pro Breakpoint definiert.
UX-DR11: Karten-Inspektor-Panel-Layout pro Breakpoint: Desktop CSS Grid `6fr 4fr`, Tablet `50vh 1fr`, Mobile `40vh 1fr` mit swipe-up-Bottom-Sheet (Snap 40vh / 70vh / 100vh).
UX-DR12: Reading-Content max-width `72ch` (Bezirks-/Kiez-/Layer-Pages, Lead-Texte, FAQ); Map-Layout `100%`; Footer-Content `1440px` zentriert.

**Custom-Komponenten Phase 1 (13 Stück)**

UX-DR13: `SkipLink` — Erstes fokussierbares Element auf jeder Page, springt zu `<main id="main">`. Versteckt via clip-rect, sichtbar bei `:focus-visible`.
UX-DR14: `AddressSearch` — bits-ui `Combobox.Root` mit Plex/Cloud-Dancer-Theming. Varianten: *hero* (groß, zentriert) und *header* (kompakt, mit Search-Icon). Debounce 250ms, In-Memory-LRU für letzte 10 Anfragen, Enter ohne Auswahl wählt erste Suggestion.
UX-DR15: `PlexMap` — MapLibre-Wrapper im Plex-Cartography-Style mit `role="application"`, `aria-describedby`, eigenem Style-JSON, Plex-Glyph-Pack. Auto-Zoom 300ms ease-out, Click-Anywhere → Reverse-Geocoding+Marker, Pan/Zoom synct URL-Bbox (debounced 500ms), Layer-Granularität wechselt nach Zoom-Level. Varianten: *primary* / *embed* (Bezirks-Page 50vh).
UX-DR16: `MapKeyboardControls` — dedizierte Pan/Zoom-Buttons (Pfeil-Pan, +/− Zoom).
UX-DR17: `MapA11yLayer` — parallele DOM-Liste sichtbarer POIs/Boundaries als semantische `<button>`-Reihe mit ARIA-Live, vanilla MapLibre (kein deklaratives Wrapper-Pattern).
UX-DR18: `InspectorPanel` — `<aside aria-live="polite" aria-atomic="false">`. Header mit Plex-Serif h2 + Adresse + Hairline. Sektionen in fester Reihenfolge: Boundaries → Wohn-Daten → Umwelt → Memorial → Klima. Progressives Slot-für-Slot-Update (kein Full-Re-Mount). Permalink-Button.
UX-DR19: `LayerRow` — `<div role="group" aria-label="{Layer}: {Wert}">`. Layer-Name (Plex Sans Medium), Wert (Sans SemiBold für kategorisch / Mono für Zahlen), Plex-Serif-Erläuterung (1 Zeile, max 80 Zeichen, `--ink-muted`), DataStandBanner, Inline-Aktionen. States: with-value / no-coverage / outdated (>2 Jahre → Warning-Pille).
UX-DR20: `DataStandBanner` — Plex-Mono `--text-xs` `--ink-subtle`. Format: „Stand: 2024-09 · Quelle: FIS-Broker · `dl-de/zero`". Direkt unter Layer-Wert, nicht als Tooltip versteckt. Bei Stand >2 Jahre Warning-Pille rechts.
UX-DR21: `LayerPalette` — bits-ui `Dialog.Root` (Desktop, `/`-Shortcut, Centered Overlay, Focus-Trap) oder `Sheet.Root` (Mobile, Bottom-Sheet 40/70/100vh). Combobox-Filter, ToggleGroup nach Bundles gruppiert. URL-Layer-Parameter wechselt bei Auswahl.
UX-DR22: `AccessibleChart` — Wrapper um LayerChart v2 mit `<figure role="img" aria-labelledby>`, SVG `<title>`/`<desc>`, Toggle „Als Tabelle ansehen". Annotations als Plex-Serif-Italic.
UX-DR23: `ClimateSparkline` + `ClimateLongView` — Wrappen `AccessibleChart`. Sparkline schmal mit drei Werten (Sommer-/Frost-/heiße Tage). Long-View groß ab 1719 mit annotierter Achse und narrative Markers (Industrielle Revolution, 1980er-Beschleunigung).
UX-DR24: `MetaFooter` — `<footer role="contentinfo">`. Hairline oben, Inline-Links: Impressum · Datenschutz · Lizenzen · Architektur · Kontakt + Sprach-Switcher rechts. Plex-Sans `--text-xs` `--ink-subtle`. Disclaimer-Zeile.
UX-DR25: `LanguageSwitcher` — bits-ui `Combobox` oder `NavigationMenu`. 8 Sprachen jeweils in eigener Sprache geschrieben (Deutsch, English, Türkçe, Українська, العربية, Español, Français, Italiano). Aktuelle Sprache visuell markiert. Cookieless URL-Prefix-Wechsel.
UX-DR26: `DataTable` — `svelte-headless-table` oder `@careswitch/svelte-data-table` als Basis. Semantisches `<table>` mit `<th scope="col">` und `<caption>`. Sortier-Buttons im Header, ARIA-Sort-States, optional Pagination >100 Zeilen.
UX-DR27: `JsonLd` — Typesafe Wrapper (~30 LOC) mit `schema-dts`. Varianten: `Place`, `AdministrativeArea`, `Dataset`, `FAQPage`, `WebSite`+`SearchAction`. Rendert `<script type="application/ld+json">` in `<svelte:head>`.
UX-DR28: `FaqSection` — `<section>` mit Plex-Serif h2 „Häufige Fragen". bits-ui `Disclosure` für jede Q&A. 5–10 Q&As pro Page. JSON-LD `FAQPage` via `JsonLd`.

**Visual-Standardisierung (Pattern-Konsistenz)**

UX-DR29: Drei Button-Klassen verbindlich: Primary (`--accent` bg, sparsam, max 1 pro Sicht), Secondary (transparent + 1px `--rule-strong` border, Standard), Tertiary-Link (nur Plex Sans + `--accent` Text, navigationsähnlich). Mindest-Klickfläche 44×44 CSS-px, niemals icon-only ohne `aria-label`.
UX-DR30: Vier Feedback-Patterns inline (keine Toasts): Success (`role="status"`), Error (`role="alert"`), Warning, Info — jeweils mit Lucide-Icon + Text (nie nur Farbe; SC 1.4.1).
UX-DR31: Keine Border-Radius >4px (Default 0, Buttons optional 4px); keine Box-Shadows; keine Gradients (Ausnahme: subtile Area-Charts); keine Glow-Effekte; keine Decorative-Animations.
UX-DR32: Hairline-Borders 1px solid `var(--rule)` (nicht-interaktiv) bzw. `var(--rule-strong)` (interaktiv) statt Cards/Schatten/Containers.
UX-DR33: Modal-Backgrounds nicht dimmen — Plex-Serif-Heading + größere Schrift als Figur-vs-Grund-Trennung. Dialog Desktop: zentriert, max-width 600px, max-height 80vh, X-Button + Esc + Click-außerhalb. Bottom-Sheet Mobile: swipe-up, Snap-Punkte, swipe-down/X/Esc.
UX-DR34: Keine globale Site-Suche Phase 1; Phase 3 optional Pagefind. Adress-Suche ist einzige Such-Surface.
UX-DR35: Empty-State-Pattern: Plex-Serif-Heading + Plex-Sans-Erläuterung + Lucide-Icon, Cloud-Dancer-Hintergrund, viel Whitespace. Niemals leere Tabellen/Listen/schwarzes Loch.
UX-DR36: Loading-State-Pattern: Cloud-Dancer-Skeleton-Felder mit subtilem Shimmer (200ms, `prefers-reduced-motion`-respektierend), max 1–2s sichtbar, dann Recovery-State. Karte: „Karte wird geladen…", Fallback nach 5s falls Tile-Provider unerreichbar.
UX-DR37: Common-Fate-Animation-Pattern: Layer-Aktivierung fadet alle Polygone gleichzeitig (200ms ease-out), nicht polygon-für-polygon. Inspektor-Panel-Updates ebenso. Bei `prefers-reduced-motion` Endzustand sofort.
UX-DR38: Editorial-Responsibility-Pattern: Stolperstein-Zitat + Quellen-Link, Mauer/Sektoren historischer Stand-Hinweis + Datenquelle, „Fehler im Eintrag?"-Mailto pro LayerRow als Tertiary-Link mit pre-filled subject + Layer-Identifier, sensible Inhalte niemals maschinell übersetzt.
UX-DR39: Sprach-Wechsel-Pattern: URL-Prefix wechselt, alle Parameter (Bbox/Adresse/Layer) erhalten. Kurze Info-Meldung „Übersetzungen maschinell-unterstützt erstellt" nach Wechsel (Plex-Sans `--text-xs` `--ink-subtle`, fade-out 6s).
UX-DR40: Breadcrumbs-Pattern (Bezirks-/Kiez-/Layer-Pages): Plex-Sans `--text-sm` `--ink-muted`, „·" als Trenner, alle außer letztem Eintrag als `--accent`-Links. `BreadcrumbList` JSON-LD.

**Layout-Archetypen (3 Page-Typen)**

UX-DR41: Hero/Landing (`/{locale}/`): Plex-Serif-Hero (h1 `--text-4xl`), bits-ui Combobox-Suche mit Placeholder, Beispiele unter Suche (Plex-Sans `--text-sm` `--ink-muted` mit `--accent`-Links), Hairline-Trenner zum Footer. Kein Submit-Button. Skip-Link versteckt fokussierbar oben. Focus auf Input nach Page-Load (mit `prefers-reduced-motion`-Respekt).
UX-DR42: Adresse/Karten-Sicht (`/{locale}/explore?address=...&bbox=...&zoom=...`): Header-Strip (Skip-Link, Adress-Suche, Sprache), Karte + Inspektor-Panel-Layout pro Breakpoint, Footer. (User-Lock 2026-05-15-PM: Atlas wandert von `/` auf `/explore`, siehe Story 2.11.)
UX-DR43: Bezirk/Kiez/Layer Long-Form: Header, Plex-Serif h1, Lead-Absatz (`--text-lg`, max 72ch), Karten-Embed mit Boundary-Highlight (50vh), Steckbrief als Tabelle ohne Vertikal-Linien, FAQ-Sektion organisch eingebettet als Page-Schluss, Footer.

**MapLibre RTL & Cartography**

UX-DR44: MapLibre Plex-Cartography-Style in `static/map-style.json` mit Cloud-Dancer-kalibrierten Werten (`background = #ECEAE0`, etc.). A/B-Side-by-Side Plex-Cartography vs OpenFreeMap-Liberty vor Phase-1-Launch.
UX-DR45: `maplibre-gl-rtl-text` Plugin conditional bei `locale === 'ar'` für korrekte Arabic-Label-Shaping.

**WCAG 2.2 + BFSG-Konformität (Implementierungs-Mechanik)**

UX-DR46: WCAG 2.2 AA komplett (alle 50 Erfolgskriterien); AAA wo möglich (Body-Text-Kontrast ≥7:1, Breadcrumbs, Section Headings, Concurrent Input). Neue 2.2-Kriterien gesondert validiert: SC 2.4.11/2.4.12 Focus Not Obscured, SC 2.4.13 Focus Appearance, SC 2.5.7 Dragging, SC 2.5.8 Target Size 24×24 (wir setzen 44×44), SC 3.2.6 Consistent Help (Kontakt-Link in Meta-Footer auf allen Pages), SC 3.3.7 Redundant Entry, SC 3.3.8 Accessible Authentication.
UX-DR47: Karten-A11y-Implementierungs-Mechanik: `role="application"` + verstecktes `<p id="map-help">` mit Steuerungs-Anleitung; ARIA-Live-Region für Selektions-Updates; parallele DOM-Liste der POIs/Boundaries; Daten-Tabelle als gleichwertige Alternative pro Karten-Layer; Pfeiltasten-Pan, +/− Zoom, Tab durch POI-Liste, Enter/Esc.
UX-DR48: Charts-A11y-Implementierungs-Mechanik: `<figure role="img">` + SVG `<title>`/`<desc>`; Daten-Tabellen-Toggle direkt unter Chart; tastatur-navigierbar; LayerChart RTL-Support oder RTL-Wrapper-Component; Plex-Mono auf Datenwerten für Screenreader-konsistente Aussprache.
UX-DR49: Form-Patterns (Phase 2 ready): Labels immer sichtbar (kein Placeholder-only), Help-Text unter Label, Error-Inline mit Lucide-Icon + `aria-describedby`, Input-Border 1px `--rule-strong` → 2px `--focus` bei `:focus-visible`, Required-Marker mit `aria-required`, Validierung via Valibot im Server-Action-Handler.
UX-DR50: `<svelte:head>` mit `lang`-Attribut pro Sprache. ARIA-Live-Regions sparsam — eine globale Channel in `+layout.svelte`. `forced-colors`-Media-Query für High-Contrast-Mode-Support. `prefers-reduced-motion`-Media-Query deaktiviert alle Transitions. `prefers-color-scheme: dark` NICHT unterstützt (eine Palette, optimiert).

**Compliance-Pages (vor Phase-1-Launch verbindlich)**

UX-DR51: Footer-Statement „BFSG-konform — WCAG 2.2 Level AA komplett, AAA wo möglich".
UX-DR52: Accessibility-Page (`/{locale}/barrierefreiheit`) mit Konformitäts-Erklärung, Test-Methoden, Mailto-Kontakt bei Hindernissen (BFSG §16).
UX-DR53: Datenschutz-Page (`/{locale}/datenschutz`) mit DSGVO-Art-13-Pflichtangaben + Cookieless-Statement + Translation-Disclaimer.
UX-DR54: Impressum-Page (`/{locale}/impressum`) nach §5 TMG.
UX-DR55: Lizenzen-Page (`/{locale}/lizenzen`) mit auto-generierter Quellen-/Lizenz-Matrix aus `MANIFEST.json`.
UX-DR56: Architektur-Page (`/{locale}/architektur`) mit EU-FOSS-Hosting-Stack-Erklärung als sichtbares Showcase für mtc-Beratungs-Pitches.

### FR Coverage Map

**Phase 1 (MVP)**

- FR1–FR6 (Adress-Discovery & Geocoding) → Epic 1
- FR7–FR13, FR11a–FR11e (Karten-Visualisierung) → Epic 1
- FR14–FR21 (Layer-System & Inspektor-Panel) → Epic 1
- FR22–FR26 (Klima-Heritage) → Epic 1
- FR27–FR33 (Discovery-Surfaces SEO/AEO) → Epic 2
- FR34–FR40 (LLM-/Agent-Surfaces, WebMCP) → Epic 2
- FR41–FR49 (Accessibility & Responsiveness) → Epic 1 (Implementierungs-Mechanik); CI-Gates Epic 4
- FR50–FR53 (Editorial-Integrität, Stolperstein-Quellen, Mauer-Stand-Hinweis, Mailto pro Layer) → Epic 1
- FR54 (Lizenz-Matrix-Footer auto-generiert aus MANIFEST.json) → Epic 4
- FR55 (Mietspiegel/Bodenrichtwert-Disclaimer) → Epic 1
- FR55a–FR55j (Internationalization 8 Sprachen + RTL + Meta-Footer) → Epic 3

**NFR Coverage**

- NFR-P1–P10 (Performance) → Epic 1 (Lazy-Load, Bundle-Disziplin); CI-Gates Epic 4
- NFR-S1–S8 (Security) → Epic 4
- NFR-PR1–PR7 (Privacy/DSGVO) → Epic 4 (cookieless-Verifikation, IP-Pseudo-Logs); Datenschutz-Page Epic 4
- NFR-A1–A10 (Accessibility) → Epic 1 (Implementierung); axe/Lighthouse-CI-Gates Epic 4; BFSG-Footer Epic 4
- NFR-I1–I7 (Integration) → Epic 1 (Build-Pipeline, Daten-Manifest, WebMCP-Adapter)
- NFR-I8 (P2 Live-Endpoint Health-Check) → Future Epic
- NFR-R1–R6 (Reliability) → Epic 4
- NFR-M1–M8 (Maintainability) → Epic 4 (Repo-Setup, ADRs, CI-Gates, Coverage)
- NFR-IL1–IL10 (Internationalization) → Epic 3

**UX-DR Coverage**

- UX-DR1–UX-DR12 (Token-System, Typografie, Spacing, Layout) → Epic 1 (Foundation)
- UX-DR13–UX-DR28 (13 Custom-Komponenten) → primär Epic 1 (Karte, Inspektor, Panel, Klima, A11y, Footer); JsonLd + FaqSection Epic 2; LanguageSwitcher Epic 3
- UX-DR29–UX-DR40 (Visual-Standardisierung Patterns) → Epic 1
- UX-DR41–UX-DR43 (Layout-Archetypen) → Epic 1 (Hero, Karten-Sicht); Long-Form Epic 2
- UX-DR44–UX-DR45 (MapLibre Plex-Cartography + RTL) → Epic 1; RTL-Plugin-Conditional Epic 3
- UX-DR46–UX-DR50 (WCAG-Implementierungs-Mechanik) → Epic 1
- UX-DR51–UX-DR56 (Compliance-Pages: BFSG-Footer, Barrierefreiheit, Datenschutz, Impressum, Lizenzen, Architektur) → Epic 4

**Phase 2/3 (deferred — Future Epics)**

- FR56 (BVG-Echtzeit-Abfahrten) → Future Epic „Live-Daten-Bundle"
- FR57 (BLUME-Luftqualität) → Future Epic „Live-Daten-Bundle"
- FR58 (Wetter Bright Sky) → Future Epic „Live-Daten-Bundle"
- FR59 (Wahlbezirks-Sparkline) → Future Epic „Wahlebene"
- FR59a (Zeit-Slider Viewport-Sync) → Future Epic „Zeit-Slider"
- FR60 (Zeit-Slider Layer-Stände) → Future Epic „Zeit-Slider"
- FR61 (Cross-Data-Erzählung) → Future Epic „Cross-Data-Story"
- FR62 (Embed-Snippet/oEmbed) → Future Epic „Embed-Widgets"
- FR63 (RADOLAN-Regenradar) → Future Epic „RADOLAN-Sidecar"
- FR64 (Cross-Layer-Aggregations-Queries) → Future Epic „PostGIS-Power-Use"
- FR65 (Memorial-Map kuratiert) → Future Epic „Memorial-Map"
- FR66 (Daten-Quality-Layer) → Future Epic „Daten-Quality"
- FR67 (Redaktioneller Content) → Future Epic „Editorial-Stories"

## Epic List

### Epic 1: Cross-Layer Address Inspector (Defining Experience)

**User Outcome:** Bürger (Anna), Wohnungssucher (Tobias), blinder Stadtforscher (Marek) tippt Berliner Adresse oder klickt Karten-Punkt → Inspektor-Panel zeigt alle Stadt-Layer (Boundaries, Wohn-Daten, Umwelt, Memorial, Klima-Heritage 1719+) im selben Surface mit Cross-Layer-Sicht. Tastatur- und Screenreader-vollständig, responsive über Mobile/Tablet/Desktop. Layer-Toggle-Palette via `/`-Shortcut (Desktop) bzw. Bottom-Sheet (Mobile). Editorial-Verantwortung für sensible Layer (Stolpersteine, Mauer/Sektoren).

**Scope:** Includes Foundation (Repository-Init via `sv create`, Design-Token-Setup mit Cloud Dancer + Plex, Bits-UI-Wrapper, MetaFooter-Skeleton, SkipLink), Daten-Pipeline (FIS-Broker WFS + ODIS + DWD CDC + OSM Overpass + MANIFEST.json), Daten-Zugriffs-Abstraktion (`$lib/data/getLayersAtPoint`), MapLibre Plex-Cartography mit eigenem Style-JSON + Glyph-Pack + Map-A11y-Layer (parallele DOM-Liste), Inspektor-Panel mit ARIA-Live + LayerRow + DataStandBanner, Layer-Palette, Klima-Sparkline + Long-View, Daten-Tabellen-Alternative, Editorial-Pattern (Stolperstein-Quellen, Disclaimer, „Fehler im Eintrag?"-Mailto). Minimaler Coolify-Deploy für End-to-End-Validierung.

**FRs covered:** FR1–FR26, FR11a–FR11e, FR41–FR53, FR55. Performance-NFRs (NFR-P1–P10) und Accessibility-NFRs (NFR-A1–A10) Implementierungs-seitig. Integration-NFRs (NFR-I1–I7).

### Epic 2: Discovery-Surface + Aggregat-Layer (SEO/AEO/LLM)

**User Outcome:** Datenjournalisten (Frieda) und Stadtforscher finden Site via Google/Perplexity und landen auf prerendered Bezirks-/Kiez-Pages mit Lead, Steckbrief, Karten-Embed, FAQ-Sektion (datengefüllte Q&As aus Templates) und JSON-LD Structured Data. Die bestehende Layer-Detail-Page (`/layer/[slug]`, Story 1.29) wird um englische Variante, Dataset-JSON-LD und FAQ-Section erweitert. Ein Cross-Layer-Score (Kiez-Score auf LOR-Ebene, Bezirks-Score auf 12-Bezirke-Ebene) wird Build-Zeit aggregiert und auf einer eigenen Ranking-Page „Wo lebt es sich gut?" als Top-N-View zugänglich. LLM-Agents (Claude-Browser-Extension, ChatGPT-Plugin) erkennen WebMCP-Manifest, rufen Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`) direkt im Browser-Kontext auf und erhalten strukturierte JSON-Antworten mit Quellen-Attribution. `/llms.txt` + `/llms-full.txt` aggregieren alle Page-Inhalte als kondensierte LLM-Quelle.

**Scope:** Postgres-Aggregat-Foundation als Build-Zeit-Cache (Drizzle-Schema + Migrations + `data:aggregate`-Build-Step, kein Source-of-Truth), SEO/AEO-Stack (`<svelte:head>` mit Title/Meta pro Route, JSON-LD-Generator-Bibliothek für `Place`/`AdministrativeArea`/`Dataset`/`FAQPage`/`WebSite`/`BreadcrumbList`, `llms.txt` + `llms-full.txt`, Sitemap-Index + Per-Sprache-Sitemaps de/en, robots.txt, Canonical-URLs), Bezirks-/Kiez-Page-Templates mit Long-Form-Reading-Layout, FaqSection als pures Template mit Daten-Slots (kein LLM-Polish zur Build-Zeit, Inhalte aus `faq_qna`-Aggregat), Layer-Page-Enhancement (EN-Variante via lokal vor-übersetzter Bundles + Dataset-JSON-LD + FAQ-Section), OG-Image-Pipeline für Bezirks-/Kiez-/Layer-Routes (Build-Zeit-Pre-Generation per Satori, Cache-Header `immutable`), WebMCP-Adapter-Schicht in `$lib/webmcp/` mit 5 Tools + Resources (`navigator://address/{slug}`, `navigator://layers/active`) + 3 Prompt-Templates, Kiez-Score- und Bezirks-Score-Aggregat-Berechnung mit Methodik-Disclosure, Ranking-Page „Wo lebt es sich gut?" als Top-N-View. i18n auf de/en beschränkt (User-Lock 2026-05-15: 8-Sprachen-Scope verworfen, RTL/Plex Sans Arabic verschoben in Future). Coolify-Postgres-Service-Setup + Backup wird parallel als Infra-Hand-Arbeit erledigt, nicht als Story getrackt.

**FRs covered:** FR27–FR40, FR55a–FR55b (de/en-Subset). Phase-2-Scope-Cut: FR55c–FR55j (6 weitere Sprachen + RTL) verschoben.

### Epic 3: i18n Paraglide-Foundation auf DE-only (Phase 1)

**User-Lock 2026-05-16:** EN-Coverage komplett verschoben in Future-Epic „i18n-Phase-3-EN-Coverage" (Phase 3, Post-Hard-Launch, T+12w+). Begründung: i18n-Aufwand Phase-1-EN-Variante (Epic 3 + EN-Anteil Epic 2/4/6) ≈ 3-4 Wochen Solo-Equivalent. Hebel-zu-Aufwand schlecht: Personas Anna/Tobias/Marek/Frieda alle DE-sprachig, Berlin-Civic-Tech-Discovery läuft auf DE, Beratungs-Asset-Demand DE-Berlin-Kunden ≥95%, LLM-Discovery rangiert auch DE-Content. Post-Launch-Reaktivierung wenn Search-Console + LLM-Referrer EN-Demand zeigen.

**User Outcome:** Solo-Maintainer hat einen sauberen Paraglide-Setup auf DE-only-Master ohne Tot-Code-Drift, aber i18n-Infrastruktur (Paraglide-Vite-Plugin, Inlang-Setup, Routing-Pattern) bleibt installiert für späteren EN-Reaktivierungs-Sprint ohne Setup-from-scratch. Phase 1 zeigt die Site ausschließlich auf Deutsch; alle Stories in Epic 2/4/6 entfallen EN-Varianten.

**Scope:** Inlang-Settings reduzieren auf `locales: ["de"]` + `baseLocale: "de"`, alle Non-DE-Bundles (`en/ar/fr/es/it/pl/tr`) löschen, Paraglide neu kompilieren so dass `src/lib/paraglide/messages/` nur noch `_index.js + de.js` enthält, Component-Audit dass alle UI-Strings über Paraglide-Messages laufen (Architecture „MUST"-Regel #14). KEIN LanguageSwitcher, KEIN hreflang-Cluster, KEIN Accept-Language-Redirect, KEIN Translation-Workflow, KEIN EN-UI-Coverage-Check in Phase 1. Paraglide-Vite-Plugin + Routing-Helper bleiben unverändert installiert.

**FRs covered:** keine direkten FRs in Phase 1. FR55a–FR55j (alle i18n-FRs inkl. de/en + 6 weitere Sprachen + RTL) komplett verschoben in Future-Epic „i18n-Phase-3-EN-Coverage" (Phase 3) bzw. „i18n-Expansion 6+ Sprachen + RTL" (Future ohne Datum).

### Epic 4: EU-FOSS Hosting + Compliance-Showcase

**User Outcome:** Site läuft produktiv auf Hetzner-Frankfurt **CPX22** (AMD, 8GB/2vCPU/80GB, EUR 9,51/Monat) + Coolify + Traefik + CrowdSec mit dedizierter Postgres-Aggregat-Schicht — ohne US-Drittanbieter im Production-Pfad. Alle 8 CI-Gates aktiv (Lint/Type/Format/A11y/Bundle/Cookie/US-Domain/Lighthouse) — PR schlägt fehl bei Verletzung. Auto-generierte Lizenz-Matrix im Footer und unter `/lizenzen` aus `MANIFEST.json` (DE bereits implementiert in Story 4.5-Vorzug). Compliance-Pages (Impressum nach §5 TMG, Datenschutz nach DSGVO Art. 13 + Cookieless-Statement, Barrierefreiheit nach BFSG §16, Architektur als EU-FOSS-Stack-Showcase) erreichbar via Always-Reachable-Footer in DE + EN. Reproduzierbarer Build (`pnpm install && pnpm fetch && pnpm data:aggregate && pnpm build`), Daily-Backup für App-Volume + Postgres-pg_dump, Disaster-Recovery-Runbooks.

**Scope:** Hetzner-CPX22-Setup (AMD-only-Verfügbarkeit, Kauf-Trigger nach Epic 2 Story 2.0 — Postgres-Foundation existiert, Stack ist deployment-fähig — User-Lock revidiert 2026-05-15-PM), Coolify-Compose mit Traefik + CrowdSec-Plugin (Streaming-Mode + 60s Decision-Sync) + dediziertem Postgres-Service (kein Public-Port, Internal-Network), Let's-Encrypt-Auto-Renewal, HTTP-Security-Header (HSTS preload, X-Frame-Options DENY, Permissions-Policy defensiv), Strict-CSP ohne `unsafe-inline`, IP-pseudonymisierte Access-Logs (7d Rotation), `/healthz`-Endpoint, GitHub-Actions-Pipeline mit allen Gates inklusive cookie-leak-check, us-domain-allowlist-check, Postgres-Service-Container für Aggregat-Build-Tests, Bundle-Size-Check (size-limit), Lighthouse-CI (`@lhci/cli`), 5 Disaster-Recovery-Runbooks (3 davon bereits implementiert: Tile-Provider-Switch, A11y-Smoke-Test, Bookmark-Storage). Nachzuziehen: `crowdsec-whitelist.md`, `data-source-failure.md`, `geocode-rate-limit-hit.md`, `postgres-restore.md`, `drizzle-migration-rollback.md`. ADR-Verzeichnis: 12 ADRs bereits implementiert (ADR-000 bis ADR-012), Story 4.4 fügt ADR-013 (Postgres-Hybrid-Architecture), ADR-014 (i18n-Scope-Reduce de/en) und ADR-015 (Hetzner-CPX22-statt-CX32) hinzu — plus markiert ADR-003-postgres-deferral als „Superseded by ADR-013". Lefthook Pre-Commit, Public-Repo MIT + README + ARCHITECTURE.md. Compliance-Pages: Impressum (mit Matze Schmidbauer-Attribution), Datenschutz (mit Cookieless + Postgres-Build-Time-only-Erklärung), Barrierefreiheit, Architektur (mit Postgres-Hybrid + Kiez-Score-System), Lizenzen (DE existiert, EN-Variante via Epic-3-Translation-Workflow). i18n-Scope auf DE + EN beschränkt (User-Lock 2026-05-15).

**FRs covered:** FR54. Primary NFR-Coverage: NFR-S1–S8, NFR-PR1–PR7, NFR-R1–R6, NFR-M1–M8, NFR-P5/P7/P8 (CI-Gates), NFR-A1/A3/A10 (axe/Lighthouse-CI + BFSG-Footer). UX-DR51–UX-DR56 (Compliance-Pages).

### Epic 5: Distribution + Pflege + Owner-Realisation

**User Outcome:** Site geht produktiv online mit dokumentierter Update-Cadence pro Datenquelle, finalem Brand-Asset-Pack, getriggertem Launch in Civic-Tech- und LinkedIn-Channels, externem Uptime-Monitoring (EU-FOSS-konform), durchgeführtem Backup-Restore-Drill, GDPR-DPIA-Dokument als Beratungs-Asset und Sitemap-Submission zu Search Engines. Owner-Hebel (#1 persönliche Sichtbarkeit, #2 mtc-Beratungslinie, #3 langfristige Brand) sind operationalisiert, nicht nur konzipiert.

**Scope:** Update-Cadence-ADR mit Cron-Definitionen pro Datenquelle (Klima jährlich, BRW alle 2J, Wohnlagen alle 4J, Stolpersteine täglich-OSM-Sync, etc.) als GitHub-Actions-Schedule, Brand-Asset-Pack (Logo final aus `_dev/logo`, Wortmarke aus `_dev/wortmarke`, Default-OG-Bild, 1-Pager-PDF, Profil-Bio, LinkedIn-Banner), Launch-Sequencing-Plan (Soft-Launch Civic-Tech-Slack/Mastodon T+0, Hard-Launch LinkedIn/Newsletter T+14d, Material pro Channel), Post-Launch-Monitoring via UptimeRobot oder healthchecks.io (kostenlos, EU-FOSS-konform) mit Coolify-Notifier-Webhook für Down-Events, echter Backup-Restore-Drill auf Staging-Postgres mit Runbook-Validierung, GDPR-DPIA-Dokument nach Art 35 (Cookieless reduziert Bedarf, dokumentierte DPIA als beratbares Asset für Hebel #2), Sitemap-Submission zu Google Search Console + Bing Webmaster Tools mit hreflang-Validation und Index-Status-Monitoring.

**Bewusst NICHT enthalten (User-Lock 2026-05-15):** Bus-Faktor-/Sunset-Plan, Server-Log-Aggregate für Hebel-#1-Evidenz, Persona-Validierung mit echten Datenjournalisten, Plausible/Matomo-Tracking.

**FRs covered:** keine direkten FRs (Epic 5 ist Phase-1-Realisation-Layer für PRD-Sektionen „Sustainability/Project Discipline", „Risk-Mitigation-Strategy" und Brief-Hebel-Logik, nicht FR-getrieben).

### Epic 6: Wahldaten + Cross-Layer-Story

**User Outcome:** Politik-interessierter Bürger und Datenjournalist sieht für jede Berliner Adresse die Wahlergebnisse der letzten 5 Wahlen (BVV, AGH, BTW) als Sparkline + Top-3-Parteien + Wahlbeteiligung im Inspektor-Panel. Pro Wahl existiert eine prerenderte Detail-Page mit Choropleth-Karte nach Top-Partei. Bezirksreform 2001 (23 Alt-Bezirke → 12 Neu-Bezirke) und Briefwahl-Asymmetrie sind als UI-Pattern + Methodik-Doku transparent. Volksentscheide (Berlin enteignen, Tegel-Volksentscheid, Mietendeckel-Initiative etc.) als separater Sub-Layer mit Ja/Nein-Visualisierung. Cross-Layer-Story-Templates verknüpfen Wahlverhalten mit Wohnlage, Lärm, Solar-Potenzial („Wo Milieuschutz × hohe Linke-Stimmen × niedrige Wohnlage"). LLM-Agents fragen Wahldaten via WebMCP-Tools ab. JSON-LD Dataset macht Wahldaten als Quelle zitierbar.

**Scope:** Wahl-Daten-Pipeline (Aggregat aus `wahlen-berlin.de` + `bundeswahlleiter.de` + ODIS-Wahlbezirks-Geometrien), Drizzle-Schema-Erweiterung (`wahl`, `wahlbezirk`, `partei`, `ergebnis`-Tabellen), Bezirksreform-2001-Mapping als Lookup-Table + `docs/wahl-historie.md`, Wahlbezirks-Geometrie-Layer als statisches GeoJSON + Adress→Wahlbezirk-Lookup (Punkt-in-Polygon analog zu LOR-Lookup), Inspector-Section „Wahlverhalten hier" mit Sparkline-Komponente + Top-3-Stack-Bar + Wahlbeteiligung, Per-Wahl-Detail-Page `/wahl/[jahr]-[typ]` (z.B. `/wahl/2025-btw`) prerendered DE+EN, Briefwahl-Asymmetrie-UI-Pattern (Inline-Disclaimer pro Wahl), Volksentscheide als separater Sub-Layer mit Ja/Nein-Visualisierung, Cross-Layer-Story-Templates mit Wahl-Variablen (FR61-Anteil), WebMCP-Tools (`get_election_result`, `compare_elections`, `get_voting_district_geometry`), JSON-LD Dataset + Methodik-Sektion auf `/methodik#wahldaten`. Postgres-Production-Setup (Epic 4 Story 4.1) ist hard-Voraussetzung weil ~1.4M Datenpunkte zu groß für In-Memory.

**Differenzierung gegen Tagesspiegel-Wahlkarte:** Wahl ist gebündelt mit Wohnlage/Lärm/Solar (Cross-Layer-USP), nicht als Konkurrenz zur dedizierten Wahlkarte. Bewusste Bündelung statt Best-of-Breed.

**FRs covered:** FR59 (Wahl-Sparkline), FR61-Anteil (Cross-Data-Story-Templates für Wahl-Variablen). Phase-Zuordnung: Phase 2a (eigenständig vor anderen Phase-2-Items wegen USP-Aufbau-Priorität).

### Epic 7: System-Dokumentation (Owner + LLM-Konsum)

**User Outcome:** Solo-Maintainer (Matze) kann nach 12-Monaten-Lücke wieder einsteigen ohne Knowledge-Decay zu spüren, weil `docs/`-Tree-Hub im Repo-Root System-Map, Pipeline-Atlas, Recovery-Playbook und Secrets-Map konsolidiert. LLM-Agents mit Repo-Zugang (Claude-Code, GitHub-Copilot, lokal-laufende Coding-Assistants) finden über `docs/INDEX.md` strukturierte Single-Entry zu allen Doku-Assets. Auto-Doc-Skill (Lefthook post-commit-Hook) klassifiziert nach jedem Commit den Diff, schreibt/erweitert relevante `docs/*.md`-Files und erzeugt Follow-up-Commit `docs(auto): sync from <sha> [skip auto-doc]` — Endless-Loop verhindert durch Skip-Marker-Check im Hook selbst. Doku driftet nicht weil Sync-Pflicht im Commit-Loop sitzt, nicht in Sprint-Reviews.

**Scope:** Auto-Doc-Skill als Foundation-Story (Claude-Subagent + Lefthook post-commit + Klassifizierungs-Rules pro Code-Domain: `scripts/lib/sources.ts`-Diff → `docs/pipelines/data-flow.md`, neue `*.env`-Variable → `docs/recovery/secrets-map.md`, neuer ADR-würdiger Pattern-Wechsel → ADR-Vorschlag in `docs/adr/`, neue Route-File → `docs/architecture/routes.md`), `docs/`-Tree-Refactor (existing `docs/adr/`, `docs/runbooks/`, `docs/editorial-review.md`, `docs/never-machine-translate.md` bleiben + neue Sub-Trees `docs/architecture/`, `docs/pipelines/`, `docs/recovery/`), `docs/INDEX.md` als Single-Entry für LLMs + Owner-Wiedereinstieg, System-Map mit Mermaid-Diagrammen (Hetzner-CPX22 / Coolify-Services / Postgres / GH-Actions / Cron-Schedules / Datenquellen-Mesh), Data-Pipeline-Atlas auto-generiert aus `scripts/lib/sources.ts` + `static/layers/MANIFEST.json` (Quelle → Build-Step → Output-Mapping), Owner-Recovery-Playbook (Local-Dev-Setup nach 12 Monaten, Restart-Sequenz, häufigste Bricks, Secrets-Map mit Bitwarden-Refs ohne Plaintext), LLM-Konsum-Optimierung (Frontmatter-Convention `type/audience/last-verified` pro Doku-File, Story-Map auto-aktuell, `CLAUDE.md`-Verweis auf `docs/INDEX.md`). Kein SvelteKit-`/docs`-Route, kein Pagefind, kein DE/EN-Split — reines Repo-Markdown für Konsumenten mit Repo-Zugriff.

**FRs covered:** keine direkten FRs (Epic 7 ist Maintenance-/Knowledge-Layer für Solo-Maintainer-Realität und LLM-Crawl-Effizienz, nicht FR-getrieben). Komplementär zu Epic 4 (Compliance-Pages = public-facing) und Epic 5 (Update-Cadence-ADR + Backup-Drill). Phase-Zuordnung: Phase 1, parallel zu Epic 4/5, weil Knowledge-Decay-Risiko mit Production-Launch startet — nicht erst danach.

### Future Epics (Phase 2b/3 — out of scope)

- **Story 11.8 — Bezirksregionenprofile als Prosa-Quelle** (Future-Task, deferred 2026-06-07): amtliche Bezirksregionenprofile Teil I (143-BZR-Grain, PDFs, je Bezirk uneinheitlich strukturiert) als zusätzlicher grounded Input für die KI-Profile (11.6). Aufwand hoch wegen PDF-Heterogenität → Spike-Charakter, Pilot-Bezirk zuerst. Epic 11 ist ohne 11.8 vollständig deployt; 11.8 nur ziehen, wenn die Profile mehr sozialräumliche Tiefe brauchen. Story-Body in `_bmad-output/implementation-artifacts/11-8-bezirksregionenprofile-prosa-quelle.md`.
- **i18n-Phase-3-EN-Coverage** (NEU 2026-05-16, Phase 3 Post-Hard-Launch, T+12w+): Reaktivierung der EN-Variante als eigenes Epic. Story-Pool aus verschobenen Epic-3-Stories (3.2 EN-UI-Coverage komplett, 3.3 LanguageSwitcher + hreflang-Cluster de/en, 3.4 Accept-Language-Redirect cookieless, 3.5 Translation-Workflow + Editorial-Sensible-Pattern) PLUS EN-Varianten der Phase-1-Stories: 2.3-EN (Bezirks-Pages 12 Routes), 2.4-EN (Kiez-Pages 138/542 Routes), 2.5a-EN (Layer-Detail-Pages 42 Routes), 2.5b-EN (FAQ-Templates), 2.11-EN (Hero-Landing-Strings), 2.12-EN (Hero-Content-Befüllung + EN-Screenshots), 4.5-EN (Lizenzen-Page), 4.6-EN (Impressum/Datenschutz/Barrierefreiheit), 4.7-EN (Architektur-Page), 6.4-EN (Wahl-Detail-Pages). Trigger: Search-Console- oder LLM-Referrer-Daten zeigen EN-Demand nach Hard-Launch. Aufwand-Schätzung ≈ 3-4 Wochen Solo-Equivalent. Setup-from-scratch entfällt weil Paraglide-Infrastruktur via Story 3.1 erhalten bleibt. Story-Bodies 3.2-3.5 sind unter „[ARCHIV]"-Heading in Epic 3 konserviert.
- **i18n-Expansion 6+ Sprachen + RTL** (FR55c–FR55j, NFR-IL3, NFR-IL4, NFR-IL8 für 6 weitere Sprachen): Türkisch, Ukrainisch, Arabisch, Spanisch, Französisch, Italienisch (oder Polnisch), Plex Sans Arabic Conditional Load, `maplibre-gl-rtl-text`, CSS Logical Properties RTL-Sweep, Translation-Workflow auf 7 Zielsprachen erweitern, Editorial-Sensible-Pattern für je Wikipedia-Lokalsprache, Native-Speaker-Spotcheck-Prozess. Verschoben aus Epic 3 nach User-Lock 2026-05-15 (Phase-1-Scope auf de/en konzentriert). Nach 2026-05-16-Lock: setzt auf „i18n-Phase-3-EN-Coverage" auf (Phase 4+).
- **Zeit-Slider** (FR59a, FR60): Layer-Stände (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete) + Viewport-Sync
- **Cross-Data-Story** (FR61, Restanteil): deterministische Template-Texte für Nicht-Wahl-Layer-Kombinationen. Wahl-Anteil ist von Epic 6 absorbiert.
- **Embed-Widgets / oEmbed** (FR62): Tagesspiegel/RBB-Einbettung mit Attribution + Lizenz-Footer
- **PostGIS-Power-Use** (FR64): räumliche Cross-Layer-Aggregations-Queries
- **Memorial-Map kuratiert** (FR65): „was nicht mehr da ist"-Schicht (geschlossene Clubs, historische Tafeln, Stolperstein-Cluster)
- **Daten-Quality-Layer** (FR66): Aktualisierungs-/Lücken-Anzeige für Datenjournalisten
- **Editorial-Stories** (FR67): redaktionell kuratierte Inhalte pro Adresse („Schreibt-Sich-Mit-Liebe"-Datasets, Berliner Clubs, Mikrogeschichte)

### Verworfene Items (User-Lock 2026-05-15, nicht Future-Epic)

- **Live-Daten-Bundle** (FR56-FR58): Live-BVG/Bahn/Bus, Live-BLUME-Luftqualität, Live-Wetter Bright Sky/Open-Meteo. **Anti-Goal:** Live-Pattern (`query.live` experimental + Polling + 4× externe Quelle Health-Checks) zieht massive Wartungs-Surface die Solo-Maintainer-Realität nicht trägt. Static-only-Strategie liefert besseren ROI für Owner-Hebel.
- **RADOLAN-Regenradar** (FR63): Python-Sidecar FastAPI + wradlib. **Anti-Goal:** Polyglot-Stack-Risk + 10-Min-Update-Cadence + Binary-RADOLAN-Parsing. Gleicher Live-Pattern-Cluster wie FR56-58. Verworfen.
- **Bus-Faktor-/Sunset-Plan**: User-Entscheidung „denke ich nicht drüber nach". Cluster-A-Risiko Brand-Schaden bei Decay nach 18 Monaten ist akzeptiert.

## Epic 1: Cross-Layer Address Inspector (Defining Experience)

Bürger, Wohnungssucher und Stadtforscher tippt Berliner Adresse oder klickt Karten-Punkt und sieht im Inspektor-Panel alle Stadt-Layer (Boundaries, Wohn-Daten, Umwelt, Memorial, Klima-Heritage 1719+) als gleichzeitige Cross-Layer-Antwort. Tastatur- und Screenreader-vollständig, responsive Mobile/Tablet/Desktop.

### Story 1.1: Repository-Initialisierung mit Stack-Foundation

As a Solo-Maintainer,
I want ein reproduzierbar initialisiertes SvelteKit-Repository mit dem vollständigen Stack,
So that alle nachfolgenden Stories auf einer deterministischen Foundation aufsetzen können.

**Acceptance Criteria:**

**Given** keine bestehende `package.json`
**When** ich `pnpm dlx sv create navigator-berlin --template=minimal --types=ts --no-install` ausführe
**Then** ein minimales SvelteKit-Skelett mit TypeScript-strict wird erstellt
**And** ich `@sveltejs/adapter-node` interaktiv selektiere

**Given** das initialisierte Repository
**When** ich `pnpm dlx sv add prettier eslint vitest playwright paraglide tailwindcss` ausführe
**Then** alle 6 Add-ons sind konfiguriert mit Default-Templates

**Given** die Add-ons installiert sind
**When** ich Stack-spezifische Libs nachziehe (`pnpm add maplibre-gl layerchart@next d3-scale d3-interpolate d3-array @turf/boolean-point-in-polygon @turf/helpers @turf/distance rbush lru-cache @lucide/svelte bits-ui webmcp valibot` und `pnpm add -D mapshaper fontnik proj4 satori @resvg/resvg-js @axe-core/playwright @lhci/cli size-limit lefthook`)
**Then** alle Dependencies sind in `pnpm-lock.yaml` festgehalten
**And** `pnpm install --frozen-lockfile` reproduziert das Setup

**Given** das vollständige Setup
**When** ich `experimental.async = true` in `svelte.config.js` aktiviere und `pnpm dev` starte
**Then** der Dev-Server startet ohne Fehler auf Port 5173
**And** die Default-Hello-World-Page rendert mit TypeScript-strict ohne Type-Errors
**And** `svelte-check` läuft fehlerfrei durch

**Given** das initialisierte Repo
**When** ich `docs/adr/`-Verzeichnis anlege mit `ADR-000-template.md` und Stub-Files für ADR-001 bis ADR-011
**Then** das ADR-Verzeichnis ist verfügbar für nachfolgende Decision-Records (NFR-M2, NFR-M6)

### Story 1.2: Design-Token-Foundation mit Cloud Dancer + Plex

As a Designer/Entwickler,
I want eine vollständige Design-Token-Hierarchie in CSS-Variablen + Tailwind v4 + Bits-UI-Wrapper,
So that alle UI-Komponenten konsistent auf der Plex/Cloud-Dancer-Direktive aufsetzen können.

**Acceptance Criteria:**

**Given** das initialisierte Repository
**When** ich `src/app.css` mit Token-Hierarchie befülle (`--bg`, `--bg-elevated`, `--ink`, `--ink-muted`, `--ink-subtle`, `--rule`, `--rule-strong`, `--accent`, `--accent-soft`, `--focus`, plus `--state-*`-Aliase, plus `--chart-*`-Tokens inkl. Okabe-Ito `--chart-cat-1` bis `--chart-cat-6`, plus `--text-xs` bis `--text-4xl` Modular-Skala 1.250, plus `--space-1` bis `--space-24`, plus `--font-sans`, `--font-serif`, `--font-mono`)
**Then** alle Token sind global verfügbar und in Tailwind v4 `@theme`-Directive gemappt (UX-DR1–UX-DR9)

**Given** die Token-Layer
**When** ich Plex Variable Fonts (Sans, Serif, Mono) sowie Plex Sans Arabic via `pyftsubset` auf 4 Subsets reduziere (latin, latin-ext, cyrillic, arabic) und nach `static/fonts/` committe
**Then** `@font-face` mit explizitem `unicode-range` pro Subset ist in `app.css` definiert
**And** `font-display: swap` ist gesetzt
**And** `<link rel="preload" as="font" crossorigin>` für Initial-Sprache-Subset ist im `app.html`
**And** `fontaine` Vite-Plugin ist konfiguriert für Fallback-Metrics-Overrides (NFR-IL3, UX-DR8)

**Given** Bits-UI installiert
**When** ich Wrapper-Komponenten in `src/lib/components/ui/` anlege (Button, Dialog, Combobox, Popover, Tooltip, ToggleGroup, ScrollArea, Skeleton, Tabs, Sheet, AlertDialog, Disclosure)
**Then** jeder Wrapper trägt die Plex/Cloud-Dancer-Klassen via Tailwind-Utilities
**And** keine Bits-UI-Default-Styles werden vererbt
**And** alle interaktiven Wrapper haben Touch-Target ≥ 44×44 CSS-Pixel (UX-DR29, FR46)

**Given** die Wrapper-Komponenten
**When** ich `SkipLink` als erste fokussierbare Komponente und `MetaFooter` (mit Hairline + Plex-Sans `--text-xs` + Disclaimer-Zeile, Sprach-Switcher-Slot leer) als Layout-Skeleton in `+layout.svelte` einbaue
**Then** Skip-Link springt zu `<main id="main">` bei `:focus-visible` (FR41, UX-DR13, UX-DR24)
**And** MetaFooter erscheint auf jeder Page

**Given** die Token-Werte
**When** ich Kontraste gegen `#ECEAE0` mit WebAIM oder axe-core verifiziere
**Then** `--ink` ≥ 16:1 (AAA), `--ink-muted` ≥ 7:1 (AAA), `--ink-subtle` ≥ 4.5:1 (AA), `--rule-strong` ≥ 3:1 (SC 1.4.11), `--accent` ≥ 7:1 (AAA), `--focus` ≥ 9:1 (NFR-A2, UX-DR1)
**And** Abweichungen werden in Token-Werte einkalibriert vor Phase-1-Launch

### Story 1.3: Build-Zeit-Daten-Pipeline mit MANIFEST

As a Solo-Maintainer,
I want eine deterministische Build-Zeit-Pipeline die alle Phase-1-Layer aus FIS-Broker, ODIS, DWD CDC und OSM Overpass abruft,
So that die Site reproduzierbar mit aktuellen Berliner Geo-Daten gebaut werden kann.

**Acceptance Criteria:**

**Given** das initialisierte Repository
**When** ich `scripts/fetch-static.ts` mit Retry-Backoff (3×, 1s/2s/4s) für FIS-Broker WFS (Mietspiegel-Wohnlagen, Lärm L_DEN/L_NIGHT, Solarpotenzial, Klimaanalyse, Bodenrichtwerte, Gebäudealter), ODIS-GeoJSON (Bezirke, Ortsteile, PLZ, LOR-3-Ebenen), DWD CDC (Stationen 00403/00400/00433/00427) und OSM Overpass (Stolpersteine, Trinkbrunnen) implementiere
**Then** `pnpm fetch` lädt alle Quellen herunter
**And** Build bricht ab bei Quellen-Ausfall, läuft nicht stillschweigend mit veralteten Daten weiter (NFR-I1, NFR-I2)

**Given** die abgerufenen Quell-Daten
**When** Reprojektion EPSG:25833 → EPSG:4326 via WFS `srsName=EPSG:4326` wo möglich, sonst `proj4` als Fallback ausgeführt wird
**Then** alle GeoJSON-Files liegen in WGS84 vor
**And** Spotcheck mit 5 Sample-Punkten gegen erwartete Koordinaten besteht (NFR-I3)

**Given** die reprojizierten GeoJSON-Files
**When** mapshaper-Simplifizierung ausgeführt wird ohne visuelle Verluste
**Then** GeoJSON-Größe ist signifikant reduziert
**And** Hash-basierte Filename-Suffixe (`{layer}.{sha}.geojson`) ermöglichen `immutable`-Caching (NFR-P10)

**Given** alle simplified Files
**When** `scripts/build-manifest.ts` `static/layers/MANIFEST.json` generiert
**Then** pro Layer Source-URL, Abruf-Datum (ISO-8601), Lizenz (`dl-de/zero-2-0` / `dl-de/by-2-0` / CC BY / ODbL), SHA-256, Filename, Zoom-Schwellen (FR11e), Saisonalitäts-Hinweis (Trinkbrunnen Mai–Oktober, FR21) sind enthalten (NFR-I4)

**Given** die Build-Pipeline
**When** `pnpm install && pnpm fetch && pnpm build` zweimal hintereinander ausgeführt wird
**Then** das Output ist identisch (Build-Reproduzierbarkeit, NFR-M1)

### Story 1.4: Daten-Zugriffs-Abstraktion

As a Komponenten-Entwickler,
I want eine typesafe Daten-Zugriffs-Abstraktion in `$lib/data/`,
So that Komponenten Layer-Hits via einheitlichem Interface abrufen können — und Phase-2/3-SQL-Swap ohne Component-Code-Änderung möglich ist.

**Acceptance Criteria:**

**Given** `static/layers/MANIFEST.json` existiert
**When** ich `$lib/data/types.ts` mit `LayerHit`, `KiezProfile`, `ClimateData`, `LayerMetadata`-Interfaces definiere
**Then** alle Daten-Typen sind TypeScript-strict typed mit Source-Provenienz pro Wert (`{ layer, value, source, updatedAt, license, reason? }`)

**Given** die Typen
**When** ich `$lib/data/manifest.ts` als typed Loader für `MANIFEST.json` und `$lib/data/get-layers-at-point.ts` mit `@turf/boolean-point-in-polygon` + `rbush` R-Tree-Index implementiere
**Then** `getLayersAtPoint(lat, lng): Promise<LayerHit[]>` liefert alle Layer-Hits für einen Punkt
**And** R-Tree wird einmal beim Hydrate-Time pro Layer gebaut, danach Punkt-in-Polygon-Lookup O(log n)
**And** In-Process LRU-Cache (`lru-cache`, max 200 Einträge) cached Berechnungs-Outputs

**Given** die `getLayersAtPoint`-Function
**When** ein Punkt außerhalb aller Layer-Coverage liegt
**Then** der Hit wird als `{ layer, value: null, reason: 'no-coverage' }` zurückgegeben statt als Error (FR20)

**Given** die Daten-Abstraktion
**When** ich Unit-Tests in `$lib/data/get-layers-at-point.test.ts` schreibe für 5 bekannte Berlin-Punkte mit erwarteten Layer-Hits
**Then** alle Tests laufen via `pnpm test` durch
**And** Coverage für `$lib/data/`-Module liegt bei ≥ 80% (NFR-M5)

**Given** die Daten-Abstraktion
**When** ich `getKiezProfile(lang, slug)`, `getBezirkProfile(lang, slug)`, `getLayerMetadata(layer)` als typed Reader implementiere
**Then** alle Helper sind via `$lib/data/`-Index importierbar und Phase-2-SQL-Swap-fähig (Implementation hinter Interface austauschbar ohne Konsumenten-Code-Änderung)

### Story 1.5: Adress-Suche mit Geocoding-Proxy

As a Bürger,
I want eine Adress-Suche mit Suggest-as-you-type für Berliner Adressen,
So that ich nach 2 Zeichen passende Treffer sehe und per Tastatur oder Maus selektieren kann.

**Acceptance Criteria:**

**Given** das Token-System und die UI-Wrapper
**When** ich `src/lib/components/atlas/address-search.svelte` als Bits-UI-Combobox-Variante (hero + header) implementiere
**Then** ich kann Berliner Adresse, Kiez-Namen oder Bezirks-Namen als Freitext eingeben (FR1, UX-DR14)
**And** Suggest-Liste mit ≤ 10 Treffern erscheint ab dem 2. Zeichen (FR2, FR4)
**And** ich kann per Maus-Klick, Tap, Enter (= erste Suggestion) oder Pfeiltasten + Enter selektieren (FR3)

**Given** der AddressSearch
**When** ich `routes/api/geocode/+server.ts` als Server-Proxy implementiere mit IP-Anonymisierung, In-Process LRU (1.000 Einträge), Rate-Limit 1 req/s gegen Nominatim-Public-Instance, User-Agent-Header
**Then** keine personenbezogenen Daten (insb. Client-IP) verlassen den Server-Proxy (NFR-PR2, NFR-I6)

**Given** der Geocoding-Proxy
**When** ich `$lib/data/geocode.remote.ts` als SvelteKit `query()`-Remote-Function mit Valibot-Schema (`v.object({ q: v.pipe(v.string(), v.minLength(2)) })`) anlege
**Then** AddressSearch-Komponente nutzt Remote-Function statt direktem `fetch()`
**And** Debounce 250ms zwischen Tippen und Geocoding-Aufruf

**Given** die Adress-Suche
**When** ein Nutzer eine Adresse außerhalb Berlin oder unbekannte Adresse eingibt
**Then** klare Fehlermeldung „Diese Adresse liegt außerhalb von Berlin" oder „Adresse konnte nicht gefunden werden — bitte korrigieren oder Bezirks-Mittelpunkt wählen" erscheint (FR6)
**And** der Nutzer kann mit dem geografischen Mittelpunkt eines Bezirks/Kiezes statt Punkt-Adresse arbeiten (FR5)

**Given** die AddressSearch-Komponente
**When** ich axe-core via Playwright gegen sie laufe
**Then** 0 Violations (Combobox-Pattern via Bits-UI ARIA-konform, NFR-A1)
**And** ARIA-Live announct neue Suggestions

### Story 1.6: MapLibre Plex-Cartography mit Glyph-Pack

As a Bürger,
I want eine ruhige MapLibre-Karte im Plex-Cartography-Style mit Karten-Beschriftung in derselben Schrift wie die UI,
So that Karte und UI als visuelles Stück erscheinen und nicht wie „schicke Webseite plus Standard-Mapbox-Tile" wirken.

**Acceptance Criteria:**

**Given** Plex Variable Fonts in `static/fonts/`
**When** ich `scripts/build-glyphs.ts` via `fontnik` einmalig ausführe und `static/glyphs/{fontstack}/{range}.pbf` für 4 Skripte (Latin, Latin-ext, Cyrillic, Arabic) generiere
**Then** Glyph-Pack ist committed im Repo
**And** MapLibre kann Plex-Beschriftung rendern (NFR-IL3, UX-DR44)

**Given** das Glyph-Pack
**When** ich `static/map-style.json` als eigenen Plex-Cartography-Style mit Cloud-Dancer-Werten (background `#ECEAE0`, place_country.halo `#ECEAE0`, hairline-Linien, Plex-Beschriftung) und Tile-Provider hinter Env-Var (`PUBLIC_TILE_URL` = OpenFreeMap default) erstelle
**Then** Karte rendert im Plex-Cartography-Style (FR7, UX-DR44)

**Given** der Map-Style
**When** ich `src/lib/components/atlas/map-libre-canvas.svelte` mit `svelte-maplibre-gl` als deklaratives Wrapping und Dynamic-Import (`await import('maplibre-gl')`) im `onMount` implementiere
**Then** MapLibre wird lazy nach Hydration geladen (NFR-P9)
**And** Vite `manualChunks` bündelt MapLibre in eigene Async-Chunk → Initial-JS gzipped ≤ 200 KB (NFR-P5)

**Given** die Karten-Komponente
**When** sie auf Landing-Page geladen wird
**Then** Karte ist sofort sichtbar nach Hydration
**And** Karten-Beschriftung wird in Plex Sans gerendert (Latin-Subset bei DE-Default)

**Given** OpenFreeMap als Default-Tile-Provider und Protomaps als Hedge-Fallback
**When** ich `docs/runbooks/tile-provider-switch.md` mit Schritt-für-Schritt-Befehlen für Provider-Switch dokumentiere
**Then** Disaster-Recovery-Switch ist als Config-Edit + Deploy ausführbar (NFR-R6)

### Story 1.7: Karten-Interaktion + URL-State-Sync

As a Bürger,
I want die Karte frei panen, zoomen und anklicken können — und der Viewport-Zustand wird in der URL gespiegelt,
So that ich beliebige Karten-Sichten deeplinken und teilen kann, und Layer-Granularität automatisch dem Zoom folgt.

**Acceptance Criteria:**

**Given** die MapLibre-Komponente
**When** ich Pan/Zoom-Steuerung via Maus-Drag, Touch-Pan, `+`/`−`-Tasten und dedizierte Pan/Zoom-Buttons implementiere
**Then** Karten-Navigation funktioniert mit allen Eingabe-Modi (FR9, FR10)
**And** Pan und Zoom funktionieren unabhängig von Adress-Auswahl (FR11a)

**Given** die Karten-Interaktion
**When** der Nutzer pant oder zoomt
**Then** Bbox + Zoom-Level werden in der URL als Query-Parameter (`?bbox=...&zoom=...`) gespiegelt via `goto()` mit `replaceState: true`, `keepFocus: true`, `noScroll: true`, debounced 500ms (FR11d, UX-DR15)
**And** beim Aufruf einer URL mit Viewport-Parametern lädt die Karte exakt diesen Zustand

**Given** das Layer-Manifest mit Zoom-Schwellen
**When** der Nutzer zoomt
**Then** Layer-Granularität wechselt automatisch: niedriger Zoom = Bezirks-/Prognoseraum-Ebene, mittlerer Zoom = LOR-Bezirksregion/Planungsraum, höchster Zoom = POIs/Punkt-Daten (FR11e)
**And** sichtbare Boundaries und Punkt-Daten werden bei Pan/Zoom on-the-fly neu gerendert basierend auf aktuellem Viewport (FR11b)

**Given** die Karte mit Click-Handler
**When** der Nutzer an beliebiger Karten-Position klickt
**Then** MapLibre `map.queryRenderedFeatures` ermittelt klickte Layer
**And** Reverse-Geocoding via Nominatim-Proxy ermittelt nächstgelegene Adresse
**And** Marker erscheint, Boundary-Highlight via `--accent`-Outline wird gesetzt (FR11, FR11c, FR12)
**And** URL bekommt `?address=...`-Parameter (FR11d)

**Given** die selektierte Adresse
**When** Karte auto-zoomt
**Then** Zoom auf passenden Level (Punkt-Adresse Zoom 17, Kiez Zoom 14, Bezirk Zoom 12) mit 300ms ease-out, `prefers-reduced-motion`-respektierend (FR8, NFR-A8)

**Given** die Karten-Legende
**When** mehrere Layer aktiv sind
**Then** Karten-Legende zeigt aktuell aktive Layer mit numerischem Wertebereich und Farbskala (FR13)

### Story 1.8: Karten-Accessibility-Layer

As a blinder Stadtforscher (Marek),
I want die Karte vollständig per Tastatur und Screenreader bedienen können — Pan/Zoom via Tasten, parallele DOM-Liste der POIs/Boundaries,
So that ich alle Karten-Inhalte ohne Maus erreiche und keine „Karten-Black-Box" entsteht.

**Acceptance Criteria:**

**Given** die MapLibre-Komponente
**When** ich Container als `<div role="application" aria-label="Berlin-Karte" aria-describedby="map-help">` umschließe und verstecktes `<p id="map-help">` mit Steuerungs-Anleitung („Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen, Tab durch Punkte und Grenzen") einfüge
**Then** Screenreader liest Karten-Beschreibung beim Fokus-Eintritt (FR43, NFR-A4, UX-DR15)

**Given** die `role="application"`-Karte
**When** ich Tastatur-Pan via Pfeiltasten und Zoom via `+`/`−` einbinde
**Then** alle Karten-Interaktionen sind tastatur-erreichbar (FR42, FR9, FR10, NFR-A4)

**Given** die sichtbaren POIs/Boundaries
**When** ich `src/lib/components/atlas/map-accessibility-layer.svelte` als parallele DOM-Liste mit `<button>`/`<a>`-Elementen pro POI/Boundary implementiere (vanilla MapLibre, kein deklaratives Wrapper-Pattern)
**Then** Screenreader-Nutzer kann via Tab durch alle sichtbaren Karten-Inhalte navigieren (FR44, NFR-A4, UX-DR17)
**And** pro Polygon/Punkt ein semantischer Knopf mit voller Beschreibung („Lärmkarte Schiene 60–65 dB, Stand 2022")

**Given** die Karten-Selektion
**When** der Nutzer eine Adresse selektiert oder einen POI fokussiert
**Then** ARIA-Live-Region announcet die Änderung („Adresse ausgewählt: Hermannstraße 49, 12049 Berlin, Bezirk Neukölln, LOR-Region Schillerpromenade") (FR43, UX-DR47)
**And** ARIA-Live-Politeness ist `polite` für Inspektor-Updates, `assertive` nur für Errors

**Given** alle Drag-Operationen (Karten-Pan, Bottom-Sheet)
**When** ich Single-Click/Tap-Alternativen (Pan-Buttons, Bottom-Sheet-Toggle-Button) anbiete
**Then** WCAG 2.2 SC 2.5.7 ist erfüllt (FR45, NFR-A4)

**Given** die Karten-Komponente
**When** ich Playwright + axe-core gegen die Karten-Sicht laufe
**Then** 0 Violations für ARIA-Application-Pattern (NFR-A1)
**And** manuelle NVDA + VoiceOver Smoke-Test dokumentiert in `docs/runbooks/a11y-smoke-test.md` (NFR-A5)

### Story 1.9: Inspektor-Panel mit Layer-Hits

As a Bürger,
I want bei Adress-Auswahl ein Inspektor-Panel mit allen Treffer-Layern in fester semantischer Reihenfolge (Boundaries → Wohn-Daten → Umwelt → Memorial → Klima),
So that ich die Cross-Layer-Sicht für meine Adresse als gleichzeitige Antwort sehe — mit Datenstand, Quellenangabe und Mailto-Feedback pro Wert.

**Acceptance Criteria:**

**Given** die Daten-Zugriffs-Abstraktion
**When** ich `src/lib/components/atlas/inspector-panel.svelte` als `<aside aria-live="polite" aria-atomic="false">` mit Header (Plex-Serif h2 + Adresse + Hairline) und Sektionen (Boundaries → Wohn-Daten → Umwelt → Memorial → Klima) implementiere
**Then** Panel öffnet sich bei Adress-Auswahl mit allen Phase-1-Layer-Hits (Bundles A + B + C + Klima) (FR14, UX-DR18)

**Given** das Inspektor-Panel
**When** ich `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` als `<div role="group" aria-label="{Layer}: {Wert}">` mit Layer-Name (Plex Sans Medium), Wert (Sans SemiBold für kategorisch / Plex Mono für Zahlen), Plex-Serif-Erläuterung (max 80 Zeichen, `--ink-muted`), DataStandBanner und Inline-Aktionen („→ Mehr erfahren"-Link, „Fehler im Eintrag?"-Mailto) implementiere
**Then** jeder Layer-Hit zeigt Wert + Erläuterung + Datenstand + Aktionen (FR15, UX-DR19)

**Given** der DataStandBanner
**When** ich `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte` als Plex-Mono `--text-xs` `--ink-subtle` mit Format „Stand: 2024-09 · Quelle: FIS-Broker · `dl-de/zero`" implementiere
**Then** Datenstand erscheint direkt unter dem Layer-Wert, nicht als Tooltip versteckt (UX-DR20)
**And** bei Stand > 2 Jahre wird Warning-Pille `--state-warning` rechts angedockt (UX-DR19)

**Given** die `getLayersAtPoint`-Function
**When** ein Layer-Hit `{ value: null, reason: 'no-coverage' }` zurückgibt
**Then** Panel zeigt explizit „Daten nicht vorhanden" statt den Layer auszulassen (FR20)

**Given** das Inspektor-Panel
**When** der Nutzer eine andere Adresse selektiert
**Then** Inhalt wird Slot-für-Slot via Svelte-5-Reaktivität ausgetauscht (kein Full-Re-Mount)
**And** ARIA-Live announcet neue Adresse (FR43, UX-DR18)

**Given** das `$lib/state/ui-context.ts`
**When** ich Cross-Component-State (Inspektor-Open-State, ausgewählte Layer-Hits) via Context-API (`setContext`/`getContext`) verwalte und in `+layout.svelte` einmal per Request initialisiere
**Then** kein SSR-State-Leak zwischen Requests (Architecture-Pattern)

**Given** das Inspektor-Panel
**When** ich Permalink-Button als Footer einfüge der URL inkl. Bbox/Zoom/Locale kopiert
**Then** Nutzer kann Adresse + Sicht teilen

### Story 1.10: Layer-Toggle-Palette

As a Datenjournalistin (Frieda) und Mobile-Nutzer (Anna),
I want via `/`-Tastatur-Shortcut (Desktop) oder Bottom-Sheet (Mobile) Layer aktivieren/deaktivieren,
So that ich Cross-Layer-Stacks zusammenstellen kann ohne Sidebar-Wand.

**Acceptance Criteria:**

**Given** das Token-System und Bits-UI
**When** ich `src/lib/components/atlas/layer-palette.svelte` mit Bits-UI `Dialog.Root` (Desktop, Centered Overlay, Focus-Trap) und `Sheet.Root` (Mobile, Bottom-Sheet mit Snap-Punkten 40vh / 70vh / 100vh) implementiere
**Then** Palette öffnet sich auf Desktop via `/`-Shortcut (preventDefault wenn aktiver Focus in Input) und auf Mobile via sichtbarem „Layer"-Button (FR16, FR17, UX-DR21)

**Given** die offene Palette
**When** ich Combobox-Filter mit Volltext-Substring-Match auf Layer-Namen + ToggleGroup für aktive Layer gruppiert nach Bundles (Boundaries / Wohn-Daten / Umwelt / Memorial) anbiete
**Then** Nutzer kann Layer-Namen tippen und per Enter aktivieren/deaktivieren (FR16)
**And** Mobile-Bottom-Sheet zeigt 5 zuletzt genutzte Layer + Such-Input (FR17)

**Given** die Layer-Auswahl
**When** der Nutzer einen Layer toggled
**Then** URL-Layer-Parameter (`?layers=mietspiegel,laerm-night`) wird via `goto()` ergänzt
**And** aktive Layer werden auf Karte transparent übereinander gerendert: sequentielle Skala für ordinale Daten (Cloud Dancer → Accent), divergierende für vorzeichenbehaftete (Vermillion ↔ Indigo), Outline-only für Boundary-Kategorien (FR18, UX-DR5)
**And** Common-Fate-Animation (200ms ease-out) fadet alle Polygone gleichzeitig, `prefers-reduced-motion`-respektierend (UX-DR37, FR48)

**Given** die Palette
**When** Nutzer Esc drückt oder X-Button klickt
**Then** Palette schließt, Focus kehrt zum Trigger-Element zurück (Focus-Trap via Bits-UI, UX-DR21)

**Given** die Karten-Visualisierung
**When** ich `src/lib/components/atlas/data-table-alternative.svelte` als gleichwertige Tabellen-Sicht via `svelte-headless-table` mit semantischem `<table>` + `<th scope="col">` + Sortier-Buttons + ARIA-Sort-States implementiere
**Then** Toggle „Als Tabelle ansehen" direkt unter jeder Karte/Chart erreichbar (FR19, NFR-A9, UX-DR26)

### Story 1.11: Klima-Heritage-Visualisierung

As a Bürger,
I want pro Adresse die Klima-Zeitreihe der nächstgelegenen DWD-Station als Sparklines (Sommertage/Frosttage/heiße Tage seit 1950) und für Berlin-Dahlem zusätzlich die Long-View-Jahresmitteltemperatur ab 1719 sehen,
So that ich den Klimawandel an meiner eigenen Adresse erkenne — der emotionale Schlüssel-Aha-Moment.

**Acceptance Criteria:**

**Given** die DWD-CDC-Daten in `static/climate/`
**When** ich `$lib/utils/nearest-station.ts` mit Haversine-Distanz und `$lib/data/get-climate-station.ts` implementiere
**Then** pro Adresse wird automatisch eine von Dahlem (00403, 1719+), Buch (00400, 1889+), Tempelhof (00433, 1919+), Brandenburg (00427, 1957+) als nächste Station ermittelt (FR22)

**Given** die Klima-Bundles pro Station
**When** ich `$lib/data/get-climate-series.ts` als typed Reader implementiere
**Then** Klima-Daten werden statisch geladen, kein Runtime-API-Call

**Given** die Daten
**When** ich `src/lib/components/atlas/accessible-chart.svelte` als Wrapper um LayerChart v2 mit `<figure role="img" aria-labelledby="chart-title-{id}">`, SVG `<title>`+`<desc>`, Toggle „Als Tabelle ansehen" implementiere
**Then** alle Charts sind tastatur-navigierbar mit gleichwertiger Daten-Tabellen-Alternative (FR26, NFR-A9, UX-DR22, UX-DR48)

**Given** der AccessibleChart-Wrapper
**When** ich `src/lib/components/atlas/climate-sparkline.svelte` als schmale Sparkline für Sommertage (T_max ≥ 25°C), Frosttage und heiße Tage (T_max ≥ 30°C) ab 1950 implementiere
**Then** drei Sparklines erscheinen nebeneinander in Klima-Sektion des Inspektor-Panels (FR23, FR24, UX-DR23)
**And** Plex-Mono auf Zahlen, Plex-Serif-Italic auf Annotations

**Given** die Dahlem-Daten ab 1719
**When** ich `src/lib/components/atlas/climate-long-view.svelte` als große Long-View-Chart der Jahresmitteltemperatur ab 1719 mit annotierter Achse und narrative Markers (Industrielle Revolution, 1980er-Beschleunigung, Mauerfall 1989) implementiere
**Then** Long-View erscheint zusätzlich nur bei Stationen mit ≥ 1900 Daten (Dahlem) (FR25, UX-DR23)

**Given** die Charts
**When** ich Daten-Tabellen-Toggle direkt unter Visualisierung einbaue
**Then** Tabelle zeigt Jahr + Wert sortierbar (FR26, NFR-A9)

### Story 1.12: Editorial-Verantwortung-Pattern

As a Berliner Bürger und mit Stolpersteinen befasste Person,
I want sensible Layer (Stolpersteine, Mauer/Sektoren, Mietspiegel, Bodenrichtwerte, Trinkbrunnen) mit Quellen-Verlinkung, Disclaimern und Mailto-Feedback,
So that erinnerungspolitisch sensible Inhalte mit Würde behandelt werden und ich Datenfehler melden kann.

**Acceptance Criteria:**

**Given** die Stolperstein-Daten
**When** ich `src/lib/components/atlas/stolperstein-detail.svelte` implementiere
**Then** jeder Stolperstein-Eintrag verlinkt zur Berliner Koordinierungsstelle (Dr. Silvija Kavcic) und/oder Wikipedia als Primärquelle (FR50, UX-DR38)
**And** Personen-Hintergründe werden als zitierter Auszug mit Quellen-URL ausgespielt, niemals algorithmisch oder LLM-generiert (FR51)

**Given** der Mauer/Sektoren-Layer
**When** ich `src/lib/components/atlas/editorial-disclaimer.svelte` als wiederverwendbare Disclaimer-Komponente implementiere und im Mauer/Sektoren-LayerRow einbinde
**Then** Mauer/Sektoren-Grenzen tragen historischen Stand-Hinweis und Datenquellen-Verlinkung zur OSM-Community oder Code-for-Berlin (FR52, UX-DR38)

**Given** Mietspiegel- und Bodenrichtwert-LayerRows
**When** ich Disclaimer „ersetzt keine rechtliche Aussage" via `editorial-disclaimer.svelte` einbinde
**Then** Disclaimer erscheint pro Layer-Wert sichtbar (FR55)

**Given** der Trinkbrunnen-Layer
**When** das aktuelle Datum innerhalb Mai–Oktober liegt
**Then** Trinkbrunnen-Layer zeigt Status „aktiv (Mai–Oktober)" (FR21, UX-DR-Manifest)
**And** zwischen November und April wird die Verfügbarkeit explizit als „außerhalb der Saison" markiert

**Given** jede LayerRow
**When** ich `src/lib/components/atlas/error-feedback-mailto.svelte` als Tertiary-Link mit pre-filled subject + Layer-Identifier + Adresse einfüge
**Then** Nutzer kann „Fehler im Eintrag?" klicken und Mail mit vorausgefülltem Betreff an Footer-Mailto senden (FR53, UX-DR38)

**Given** alle sensiblen Layer
**When** das Inspektor-Panel rendert
**Then** Editorial-Pattern ist konsistent: Quellen-Link + Disclaimer + Mailto, niemals LLM-generierte Inhalte für Stolpersteine (FR50, FR51)

### Story 1.26: Adress-Bookmarks (lokal, LocalStorage)

As a wiederkehrende Nutzer:in, die mehrere Berliner Adressen recherchiert,
I want gesuchte Adressen lokal im Browser als Bookmarks speichern, in einem Dialog wiederfinden, auswählen oder löschen können,
So that ich nicht jedes Mal neu tippen muss und meine Recherche-Shortlist über Sessions hinweg behalte.

**Acceptance Criteria:**

**Given** `site-header.svelte` mit AddressSearch + Layer-Trigger
**When** Bookmark-Trigger neben Layer-Trigger erscheint (Lucide Bookmark) mit Badge für Anzahl gespeicherter Bookmarks
**Then** Klick öffnet Bookmark-Dialog (Desktop: vanilla role=dialog, Mobile: Bottom-Sheet), Pattern wie LayerPalette, Save-Action für aktuelle Adresse + Liste sortiert nach createdAt desc

**Given** TDDDG §25 Abs. 2 Nr. 2 (technisch notwendig für vom Nutzer ausdrücklich gewünschten Dienst) und DSK-OH-Telemedien 2021 („Merkliste anlegen" als Beispiel)
**When** ADR-004 erweitert wird um Ausnahme „User-initiierte clientseitige Bookmarks"
**Then** Architektur-MUST-Rule #10 (Cookieless) explizit erweitert, KEIN Cookie-Banner nötig, Datenschutzerklärung-Snippet als Artefakt für Story 4.6 angelegt

**Given** Bookmark-Liste persistiert in LocalStorage unter `navigator-berlin.bookmarks.v1`
**When** Schema-Wrapper mit `schemaVersion: 1` + valibot-validation + SSR-safe Load + Quota-Limit 50 + Dedup nach lat/lng-6-Dezimal implementiert
**Then** Cross-Tab-Sync via `storage`-Event, Quota-Failure-Banner inline, NEVER Toast (Memory feedback_no_toast.md)

**Given** Bookmark ausgewählt
**When** synthetic GeocodeSuggestion erzeugt + ui.selectedAddress gesetzt + Inspector geöffnet + Map fliegt zur Adresse + URL synced
**Then** gleiche Pfad wie AddressSearch-Select, Dialog schließt automatisch

**Given** Lösch-Aktion pro Row
**When** Inline-Confirm-State (kein Browser-Alert, kein Modal-Stack) mit 8s-Auto-Revert
**Then** Bookmark entfernt, aria-live announct, LocalStorage geschrieben

**Bezug:** Enabler für Story 1.27 (Adress-Vergleich Bookmark-Pick).

### Story 1.27: Adress-Vergleich (Side-by-Side)

As a Nutzer:in mit Umzugs- oder Zuzugsentscheidung,
I want zwei Berliner Adressen parallel mit allen relevanten Layer-Werten und visuellen Diff-Indikatoren vergleichen,
So that ich Unterschiede in Lärm, Wohnlage, Bodenrichtwert, Grünversorgung, Klima, Mobilität, Familie auf einen Blick erfasse.

**Acceptance Criteria:**

**Given** Inspector offen mit Adresse A + featureFlags.compareMode = true
**When** Compare-Trigger im Inspector-Footer (Lucide GitCompare) klickt
**Then** UI wechselt in Two-Column-Layout (Desktop) oder Stacked mit Tab-Switcher (Mobile <1024px), Adresse-B-Slot mit „Suchen"-Input und „Aus Bookmarks wählen"-Action (1.26-Konsument im pick-comparison-Modus)

**Given** Adresse B selektiert
**When** Parallel-Fetch via Promise.all (Layer-Hits + OepnvStops + ClimateStation) + Map fitBounds beider Punkte + Marker A/B mit Plex-Mono-Labels
**Then** Compare-Table als `<table>` mit caption/th-scope-Semantik (NFR-A9), Section-Loop SECTION_ORDER, ValueChip-Reuse (1.18)

**Given** Compare-Logic-Library `src/lib/utils/layer-compare.ts`
**When** 8 Profile-Dispatchers implementiert (numeric-lower-better, numeric-no-judgment für Bodenrichtwerte, ordinal-higher-better, ordinal-lower-better, distance-lower-better, presence-neutral-positive, categorical-neutral, count-no-judgment für Stolpersteine)
**Then** Diff-Pfeil (ArrowUp/Down/Minus) + Δ-Label + Editorial-Disclaimer pro sensibler Section (Stolperstein-Würde, Mietspiegel, Bodenrichtwerte, Bezirks-Stigma)

**Given** URL-State
**When** `?a=lng,lat&b=lng,lat&l=layers&compare=1`
**Then** Reload-fähig, Permalink-Builder erweitert, DisplayName via reverseGeocode rekonstruiert

**Bezug:** abhängig von Story 1.26 (Bookmark-Pick); FR48a (PRD-Update separat).

### Story 1.28: „Wo lebt es sich gut?"-Index (Cross-Layer-Score MVP)

As a Nutzer:in, die Berliner Lagen datengestützt verstehen will,
I want pro LOR-Planungsraum (build-time) und pro Adresse (runtime) einen erklärbaren Cross-Layer-Score in drei Dimensionen (Ruhe-Luft, Grün, Mobilität),
So that ich Lagen schnell einordne, ohne in Einzel-Layer-Detail-Werten verloren zu gehen, und die Methodik zurückverfolgen kann.

**Acceptance Criteria:**

**Given** LOR-Planungsraum-Geometrie (538 Polygone)
**When** Story re-introducet LOR-Planungsraum als Build-Only-Source (neuer Flag `mapRelevant: false`) + Pipeline-Script `scripts/build-livability-scores.ts`
**Then** Output `static/livability/livability-scores.json` mit { lorId → LivabilityScore } für Persona „allgemein"

**Given** drei Dimensionen mit Layer-Mapping (Ruhe-Luft: laerm/luft/bioklima; Grün: gruenversorgung + Kaltluft + Leitbahn; Mobilität: nearest U/S/Tram/Bus + Radverkehr)
**When** computeLivabilityScore() Layer-Werte normalisiert (Ordinal-3, Ordinal-4, Distance-Linear, Presence) und gewichtet
**Then** DimensionScore.value 0-100 + sources + missingData + dataStand; Coverage-Fallback umweltgerechtigkeit-2023 wenn Ruhe-Luft-Triple komplett fehlt; Doppel-Zählung via Anti-Korrelations-Schutz dokumentiert

**Given** Runtime-Adapter `getLivabilityScore(lat, lng)`
**When** Spatial-Lookup welcher LOR enthält Punkt + Mobilität-Override mit exaktem Adress-Punkt + Result-Cache
**Then** Inspector-Section „Lebensqualität-Index" oberste Section mit ValueChip pro Dimension + Quellen-Expand + Methodik-Link

**Given** Karten-Layer-Surface
**When** drei separate Choropleth-Layer (`livability-ruhe-luft`, `-gruen`, `-mobilitaet`) im neuen Bundle „G: Lebensqualität" in LayerPalette
**Then** KEIN Composite-Single-Score-Layer (Stigmatisierungs-Schutz), severity-token-Farben, LayerExplain-Disclaimer

**Given** Editorial-Verantwortung
**When** Methodik-Page `/de/lebensqualitaet-methodik` Pflicht-Artefakt
**Then** Page erklärt Dimensions-Definition + Gewichts-Tabelle + Normalisierung + Was fehlt + Warum (Bezahlbarkeit + Familie absichtlich nicht in MVP) + Datenquellen + Editorial-Disclaimer

**Scope-Cut MVP:** kein Persona-Switcher, keine Bezahlbarkeit-Dimension, keine Familie-Dimension, kein Composite-Score, keine Bezirks-/Kiez-Ranking-Tabellen (alles Phase 2 / Epic 2).

### Story 1.29: Atlas-Methodik-Pattern (Layer-Detail-Pflichtsektionen + zentrale Methodik-Page)

As a Nutzer:in, Journalist:in, Behörde oder Forscher:in,
I want pro Layer einheitlich dokumentiert sehen (was, wie, woher, was fehlt, was bewusst nicht enthalten) sowie eine zentrale Methodik-Page für Atlas-Architektur und Editorial-Verantwortung,
So that ich Daten richtig einordnen kann ohne aus Inspector-Werten falsche Schlüsse zu ziehen, und der Atlas sich nicht wie ein intransparentes kommerzielles Lagen-Tool anfühlt.

**Acceptance Criteria:**

**Given** Layer-Detail-Page-Foundation aus Story 1.16
**When** `LayerMethodology`-Datenmodul implementiert (`calculation`, `coverageGaps`, `omissions`, `relatedLayers`, `aggregationLevel`, `updateFrequency`, `authority`) und alle 34 Manifest-Slugs mindestens Minimum-Eintrag haben
**Then** Layer-Detail-Page rendert Pflicht-Sections nach Source-Card: „Wie berechnet" + „Coverage-Lücken" + „Was wir nicht zeigen" + „Verwandte Layer" (auto-Link auf andere Layer-Slugs) + „Atlas-Methodik"-Banner mit Cross-Link

**Given** neue Route `src/routes/(with-header)/[lang]/methodik/+page.svelte`
**When** Page rendert (SSR-prerendered, JSON-LD `TechArticle`-Stub)
**Then** Sections: Mission/Cookieless, Datenarchitektur (Pipeline-Skizze), Aggregations-Ebenen (Adress-genau vs LOR vs Bezirk), Cross-Layer-Aggregat-Indices (Anti-Composite-Schutz für Story 1.28), Coverage-Strategie (LayerHitReason aus Story 1.23 erklärt), Was-wir-nicht-enthalten (Cookies/Tracker/User-Accounts/kommerzielle Mietpreise/LLM-Inhalte/objektiver Berlin-Score), Editorial-Verantwortung, Daten-Stand-Tabelle aus Manifest (sortierbar via `data-table-alternative`), Quellen+Lizenzen, Feedback

**Given** Inspector-Sections
**When** Section-Footer einen Plex-Mono-Link „Methodik dieser Sektion" enthält
**Then** Hash-Anker auf Methodik-Page springt zur passenden Section (SECTION_TO_METHODIK_ANCHOR Map)

**Given** Footer-Navigation
**When** `meta-footer.svelte` erweitert wird
**Then** Footer-Link „Methodik" sichtbar neben Lizenzen/Datenschutz/Impressum

**Editorial-Verantwortung:**
- Daten-Stand-Tabelle sortiert alphabetisch (kein Bias durch Aktualitäts-Ranking)
- Methodik-Page erklärt explizit warum es keinen Composite-Score gibt
- Methodik-Page erklärt explizit dass Layer-Inhalte nicht algorithmisch generiert oder LLM-summarized werden (FR51 Würde)
- Bezirks-Stigma-Schutz: kein Ranking, keine Bezirks-Bewertungs-Tabelle

**Bezug:** Foundation für Story 1.28 (Sub-Methodik-Page Lebensqualität als Konsument); Wiederverwendung `data-table-alternative.svelte` (1.10), `editorial-disclaimer.svelte` (1.12), `error-feedback-mailto.svelte` (1.12).

### Epic 1 Status

16 Stories total (12 ursprünglich + 1.13–1.25 + 1.26–1.29 als GH-Issue-getriebene Erweiterungen + Atlas-Methodik-Pattern), Foundation für Epic 2/3/4 gelegt.

## Epic 2: Discovery-Surface + Aggregat-Layer (SEO/AEO/LLM)

Datenjournalisten (Frieda) und Stadtforscher finden Site via Google/Perplexity und landen auf prerendered Bezirks-/Kiez-Pages mit Lead, Steckbrief, Karten-Embed, FAQ-Sektion und JSON-LD Structured Data. Bestehende Layer-Detail-Page (`/layer/[slug]`, Story 1.29) wird um englische Variante, Dataset-JSON-LD und FAQ-Section erweitert. Postgres dient als Build-Zeit-Aggregat-Cache (Kiez-Score, Bezirks-Score, FAQ-Daten, llms-Aggregate), nicht als Source-of-Truth. LLM-Agents erkennen WebMCP-Manifest und rufen 5 Tools direkt im Browser-Kontext auf. `/llms.txt` + `/llms-full.txt` aggregieren alle Page-Inhalte. Ranking-Page „Wo lebt es sich gut?" zeigt Top-N-Kieze mit Methodik-Disclosure. i18n-Scope auf de/en beschränkt (User-Lock 2026-05-15, RTL/8-Sprachen-Pivot in Future-Epic).

### Story 2.0: Postgres-Aggregat-Foundation mit Drizzle + Build-Step

As a Solo-Maintainer,
I want eine production-ready Postgres-Aggregat-Schicht mit Drizzle-ORM-Schema, Migrations und einem `data:aggregate`-Build-Step der aus Static-GeoJSON Cross-Layer-Werte berechnet,
So that Bezirks-/Kiez-/Score-/FAQ-Pages auf einer konsistenten, deterministischen Aggregat-Datenquelle aufsetzen können ohne den statischen GeoJSON-Pfad zu ersetzen.

**Acceptance Criteria:**

**Given** lokale Postgres 17 (Homebrew) ohne PostGIS und Coolify-Postgres-17-Service in Production (parallel als Infra-Hand-Arbeit eingerichtet, nicht Story-Scope)
**When** ich `pnpm add drizzle-orm postgres` und `pnpm add -D drizzle-kit` installiere und `drizzle.config.ts` mit `DATABASE_URL`-Env-Var-Lookup anlege
**Then** Drizzle ist eingebunden ohne dass irgendein bestehender Static-GeoJSON-Pfad bricht

**Given** das Schema-Verzeichnis `src/lib/db/schema/`
**When** ich Tabellen `bezirk_stats`, `kiez_stats`, `bezirk_score`, `kiez_score`, `faq_qna`, `llms_content` mit Drizzle-Schema-DSL definiere und in `src/lib/db/index.ts` einen `db`-Client mit Connection-Pool exportiere
**Then** Schema ist typesafe und via `pnpm db:generate` zu SQL-Migrations kompilierbar
**And** `pnpm db:migrate` wendet Migrations idempotent an

**Given** das Migrations-Setup
**When** ich `scripts/aggregate-data.ts` als CLI-Script implementiere das die 35 Static-GeoJSON-Layer einliest, pro Bezirk + Kiez Cross-Layer-Statistiken berechnet (Lärm-Mittel, Grün-Versorgung, ÖPNV-Dichte, etc.) und in die Aggregat-Tabellen schreibt
**Then** `pnpm data:aggregate` ist idempotent und reproduzierbar
**And** der Build-Step ist als `prebuild`-Hook in `package.json` registriert

**Given** die Aggregat-Tabellen befüllt sind
**When** ich `src/lib/db/queries/`-Module pro Aggregat-Typ implementiere (`get-bezirk-stats.ts`, `get-kiez-stats.ts`, `get-bezirk-score.ts`, `get-kiez-score.ts`, `get-faq-qna.ts`)
**Then** Page-Server-Loader können typesafe aus DB lesen und prerendern
**And** Test-Fixtures pro Query existieren mit Snapshot-Coverage für Friedrichshain-Kreuzberg + Boxhagener Kiez

**Given** Production-Deploy
**When** der Build-Container `pnpm install && pnpm fetch && pnpm data:aggregate && pnpm build` ausführt
**Then** Postgres wird Build-Zeit befüllt und Static-Build geschrieben
**And** Runtime liest nur statische HTML, kein Postgres-Connection-Roundtrip nötig

### Story 2.1: SEO-Foundation mit Sitemap + Canonical + robots.txt

As a Suchmaschine,
I want eine sauber strukturierte Site mit dynamischen Title/Meta pro Route, Canonical-URLs, Sitemap-Index und robots.txt,
So that ich alle prerendered Pages effizient indexieren kann ohne Duplicate-Content.

**Acceptance Criteria:**

**Given** SvelteKit-Routing
**When** ich `<svelte:head>`-Pattern in jeder Route mit dynamischem `<title>` und `<meta description>` aus Daten generiert einbinde
**Then** keine globalen Defaults — jede Page hat eigene SEO-Identität (FR32)

**Given** alle prerendered Routes
**When** ich pro Page Canonical-URL via `<link rel="canonical">` setze
**Then** Duplicate-Content über Subdomain-/Slash-Varianten wird vermieden

**Given** super-sitemap installiert
**When** ich `routes/sitemap.xml/+server.ts` als Sitemap-Index und `routes/sitemap-[lang]/+server.ts` als Per-Sprache-Sitemap implementiere mit prerender-aware Generation
**Then** 1 Index + 2 Per-Sprache-Sitemaps (de/en) werden Build-Time generiert mit allen prerendered URLs

**Given** SEO-Setup
**When** ich `routes/robots.txt/+server.ts` mit explizitem `Allow: /` und `Sitemap`-Verweis implementiere
**Then** keine restriktiven Disallows, alles crawlbar

**Given** prerendered Routes
**When** ich `prerender = true` in `+page.server.ts` für `/`, `/bezirk/[slug]`, `/kiez/[slug]`, `/layer/[slug]`, `/methodik`, `/lizenzen`, `/wo-lebt-es-sich-gut` setze
**Then** alle SEO-Routen sind statisch ausgeliefert und ohne JS lesbar (FR33, NFR-P1)

### Story 2.2: JSON-LD-Generator-Bibliothek

As a LLM-Crawler / Suchmaschine,
I want JSON-LD Structured Data pro Page mit Schema.org-Typen,
So that ich Site-Inhalte als strukturierte Quellen erkennen und zitieren kann.

**Acceptance Criteria:**

**Given** `schema-dts` installiert
**When** ich `$lib/seo/`-Module für JSON-LD-Generation implementiere: `jsonld-place.ts`, `jsonld-administrative-area.ts`, `jsonld-dataset.ts`, `jsonld-faqpage.ts`, `jsonld-website.ts`, `jsonld-breadcrumb.ts`
**Then** alle Generators sind typed via `schema-dts`, Zero-Runtime-Kosten (nur Types)

**Given** die Generators
**When** ich `src/lib/components/atlas/json-ld.svelte` als ~30-LOC Wrapper implementiere der `<script type="application/ld+json">` in `<svelte:head>` rendert
**Then** Komponenten können typesafe JSON-LD pro Page einbinden (FR36, UX-DR27)

**Given** WebSite-Typ
**When** ich `WebSite` mit `SearchAction` für Adress-Suche in Layout-Root einbinde
**Then** Suchmaschinen erkennen Site-Search

**Given** Bezirks-/Kiez-/Layer-Pages
**When** ich `BreadcrumbList`-JSON-LD pro Page einbinde
**Then** Breadcrumb-Hierarchie ist strukturiert verfügbar (UX-DR40, AAA SC 2.4.8)

### Story 2.3: Bezirks-Pages prerendered

As a Frieda (Datenjournalistin),
I want für jeden der 12 Berliner Bezirke eine prerenderte Page mit Lead, Steckbrief, Karten-Embed mit Boundary-Highlight,
So that ich via Google nach Bezirks-Themen suchen kann und sofort eine ruhige, daten-dichte Übersicht bekomme.

**Acceptance Criteria:**

**Given** die Daten-Abstraktion (`getBezirkProfile` + `getBezirkStats` aus Postgres-Aggregat aus Story 2.0)
**When** ich `routes/(with-header)/bezirk/[slug]/+page.svelte` und `+page.server.ts` mit `prerender = true` implementiere
**Then** jeder Bezirk hat eigene URL `/bezirk/{slug}` (FR27)

**Given** die Page
**When** ich `entries`-Hook in `+page.server.ts` für 12 Bezirke × 2 Sprachen (de/en) = 24 Routen anlege (Paraglide-reroute strippt Locale, EN über `/en/bezirk/{slug}`)
**Then** Build-Step prerendert alle 24 Bezirks-Routen

**Given** die Bezirks-Page
**When** ich `src/lib/components/atlas/bezirk-hero.svelte` mit Plex-Serif h1, Lead-Absatz (`--text-lg`, max 72ch), Karten-Embed mit Boundary-Highlight (`PlexMap` variant=embed, 50vh), Steckbrief-Tabelle ohne Vertikal-Linien aus `bezirk_stats`-Aggregat implementiere
**Then** Page rendert im Long-Form-Reading-Layout (UX-DR43)

**Given** die Bezirks-Page
**When** ich `JsonLd` mit `Place` + `AdministrativeArea` + `BreadcrumbList` einbinde
**Then** strukturierte Daten verfügbar für Suchmaschinen + LLM-Crawler (FR36)

**Given** das bestehende `SiteHeader`-Skeleton (Story 1.x)
**When** Header bleibt konsistent integriert mit Skip-Link, Adress-Suche (kompakt) und Sprach-Switcher (de/en)
**Then** Bezirks-Page hat konsistente Top-Navigation auf allen Breakpoints

### Story 2.4: Kiez-Pages prerendered

As a Frieda (Datenjournalistin),
I want für jede der 138 LOR-Bezirksregionen (Kieze) eine prerenderte Page,
So that ich Long-Tail-Suchanfragen wie „Wohnlage Boxhagener Kiez" direkt beantworte.

**Acceptance Criteria:**

**Given** die Daten-Abstraktion (`getKiezProfile` + `getKiezStats` aus Postgres-Aggregat aus Story 2.0)
**When** ich `routes/(with-header)/kiez/[slug]/+page.svelte` und `+page.server.ts` mit `prerender = true` implementiere
**Then** jede LOR-Bezirksregion hat eigene URL `/kiez/{slug}` (FR28)

**Given** die Page
**When** ich `entries`-Hook für 138 Kieze × 2 Sprachen (de/en) = 276 Routen anlege
**Then** Build-Step prerendert alle 276 Kiez-Routen
**And** Build-Zeit-Budget < 5 Minuten auf Hetzner-Build-Runner (Phase-1-Scope deutlich kleiner als ursprünglich 1.104 Routen)

**Given** die Kiez-Page
**When** ich `src/lib/components/atlas/kiez-hero.svelte` analog zu Bezirks-Hero implementiere mit `kiez_stats`-Aggregat-Daten
**Then** konsistente Long-Form-Reading-Struktur (UX-DR43)

**Given** die Kiez-Page
**When** ich `JsonLd` mit `Place` + `AdministrativeArea` + `BreadcrumbList` einbinde
**Then** Hierarchie Berlin → Bezirk → Kiez strukturiert verfügbar (FR36)

### Story 2.5a: Layer-Page Englisch-Variante + Dataset-JSON-LD

As a englisch-sprechender Bürger / Suchender,
I want die bestehende Layer-Detail-Page (`/layer/[slug]`, Story 1.29) auch auf Englisch sehen mit Dataset-JSON-LD,
So that nicht-deutsche Nutzer Layer-Konzepte verstehen und Suchmaschinen + LLM-Agents Layer als zitierbare Datenquelle erkennen.

**Acceptance Criteria:**

**Given** die bestehende `/layer/[slug]`-Route in DE (Story 1.29) mit `getLayerMetadata` und `layer-methodology`
**When** ich pro Layer-Slug eine englische Inhalts-Variante als pre-committed JSON-Bundle in `src/lib/data/layer-content/{slug}.en.json` ablege (vor-übersetzt lokal via Claude-Subscription, nicht zur Build-Zeit)
**Then** EN-Variante ist verfügbar und committet, kein Runtime- oder Build-API-Call nötig

**Given** Paraglide-reroute liefert `getLocale()` korrekt
**When** ich `+page.server.ts` so erweitere dass `getLayerMetadata(slug, locale)` + `getLayerMethodology(slug, locale)` aufgerufen wird und EN-Bundle bei `locale === 'en'` greift
**Then** `/en/layer/{slug}` rendert englischen Inhalt, `/layer/{slug}` rendert deutsch
**And** `entries`-Hook für ~25 Layer × 2 Sprachen = ~50 Routen prerendered

**Given** die Layer-Page
**When** ich `JsonLd` mit `Dataset` (`name`, `description`, `license`, `dateModified`, `creator`, `distribution.contentUrl`, `keywords`) einbinde
**Then** Layer ist als Daten-Quelle für LLM-Agents und Google-Dataset-Search zitierbar (FR36)

**Given** Schema-Konsistenz
**When** Lizenz-Werte aus `MANIFEST.json` (Story 1.3) auf Schema.org-License-URLs gemappt werden (`https://creativecommons.org/licenses/by/3.0/de/` etc.)
**Then** keine Hardcoded-Lizenz-Strings, alles aus Manifest abgeleitet

**Given** Translation-Quality-Disclaimer
**When** EN-Page einen Hinweis zeigt „Translated from German source. Original DE version remains authoritative."
**Then** Editorial-Verantwortung für Übersetzungs-Drift ist transparent

### Story 2.5b: FAQ-Section pure Template mit Daten-Slots

As a interessierter Bürger / Suchender,
I want auf Bezirks-, Kiez- und Layer-Pages eine FAQ-Sektion mit datengefüllten Q&As die aus Templates und Aggregat-Werten gerendert werden,
So that Long-Tail-Suchanfragen wie „Wie laut ist es im Boxhagener Kiez?" direkte, datenbasierte Antworten finden.

**Acceptance Criteria:**

**Given** das Postgres-Aggregat (Story 2.0) mit `bezirk_stats`, `kiez_stats`, `bezirk_score`, `kiez_score`
**When** ich `src/lib/data/faq-templates/`-Verzeichnis pro Cluster (Lärm, Luft, Klima, Wohnen, Grün, Verkehr, Bildung, Heritage, Score) mit `*.de.yaml` und `*.en.yaml` als Template-Bibliothek anlege (Q-Templates + A-Templates mit `{slot}`-Platzhaltern)
**Then** Template-Inventar ist source-controlled, deterministisch und ohne LLM-Polish reproduzierbar

**Given** die Templates und Aggregat-Daten
**When** ich `scripts/render-faq.ts` als Build-Step implementiere der pro Bezirk × Kiez × Layer × Cluster die Templates mit Aggregat-Werten füllt und in die `faq_qna`-Postgres-Tabelle schreibt
**Then** ~5–10 Q&As pro Page sind deterministisch generiert
**And** Snapshot-Test pro Bezirk + 5 Beispiel-Kieze prüft Render-Stabilität

**Given** die `faq_qna`-Tabelle befüllt ist
**When** ich `src/lib/components/atlas/faq-section.svelte` mit Plex-Serif h2 „Häufige Fragen" / „Frequently Asked", Bits-UI-Disclosure pro Q&A und `JsonLd` mit `FAQPage` implementiere
**Then** Disclosure-Pattern ist tastatur-bedienbar mit `aria-expanded` und Q&As werden auf Bezirks-, Kiez- und Layer-Pages eingebunden (FR30, UX-DR28)

**Given** Q-Template-Co-Design
**When** der erste Cluster-Pilot (Empfehlung: Lärm) mit User Matze in Co-Design-Session erarbeitet wird vor Roll-out auf 8 weitere Cluster
**Then** Q-Template-Schema und Style-Guide sind etabliert bevor Massen-Generierung startet

**Given** Cluster-Skalierung
**When** alle 9 Cluster × 3 Page-Types (Bezirk/Kiez/Layer) × 5 Q&As × 2 Sprachen abgeschlossen sind
**Then** ergibt sich ein Korpus von ~270 Q-Templates und ~3.000 gerenderten Q&As gesamt

### Story 2.6: OG-Image-Pipeline für Bezirk/Kiez/Layer-Routes

As a Social-Media-Sharer,
I want pro Bezirks-/Kiez-/Layer-Route ein vor-gerendertes Open-Graph-Bild mit Karten-Snapshot und Top-3-Statistik,
So that geteilte Links visuell ansprechend mit Berlin-Kontext erscheinen, ohne Runtime-Generierungs-Last.

**Acceptance Criteria:**

**Given** der bestehende `routes/api/og/share/+server.ts`-Endpoint (Story 1.x, für Adress-Bookmark-Share) als Referenz-Implementierung mit Satori + `@resvg/resvg-js`
**When** ich `scripts/generate-og-snapshots.ts` mit headless MapLibre (oder vorab-statisch via PMTiles + map-rendered) Karten-PNGs pro Bezirk/Kiez/Layer als `static/og/{type}/{slug}.png` implementiere
**Then** Karten-Snapshots sind Build-Time pre-gerendert (~24 Bezirk + 138 Kiez + ~25 Layer = ~190 PNGs)

**Given** die Karten-Snapshots
**When** ich `scripts/generate-og-images.ts` mit Satori als Overlay mit Plex-Text + Bezirks-/Kiez-Name + Top-3-Aggregat-Wert (aus Postgres-Story-2.0) implementiere
**Then** OG-Bild pro Route existiert mit Hash-basierter Cache-Invalidation (FR31)
**And** Output respektiert die Satori-Font-Pipeline-Constraints (kein woff2, kein Variable-Font, sequenzielles wawoff2)

**Given** die OG-Pipeline
**When** `<svelte:head>` pro Bezirks-/Kiez-/Layer-Page `<meta property="og:image">` und Twitter-Card-Tags setzt
**Then** Social-Media-Plattformen zeigen vor-gerendertes OG-Bild beim Sharen
**And** OG-Generation bleibt < 2 Min auf commodity CI für ~190 Routen × 2 Sprachen = ~380 PNGs

**Given** Auslieferung
**When** statische PNG aus `static/og/` mit `cache-control: public, max-age=2592000, immutable` ausgeliefert wird
**Then** kein Runtime-OG-Endpoint nötig (Adressen-OG bleibt dynamisch via existierendem `api/og/share`)

### Story 2.7: WebMCP-Integration mit Tools, Resources, Prompts

As a Claude-Browser-Extension / ChatGPT-Plugin,
I want via WebMCP-Manifest 5+ Tools, URI-adressierbare Resources und Prompt-Templates,
So that ich strukturierte JSON-Antworten mit Quellen-Attribution direkt im Browser-Kontext abrufen kann ohne separate API.

**Acceptance Criteria:**

**Given** `webmcp` und `@mcp-b/global` installiert
**When** ich `$lib/webmcp/adapter.ts` als Adapter-Schicht mit Spec-Version-Pin implementiere und Conditional Polyfill-Load (`'modelContext' in navigator`-Check, Chrome 146+ native) in `+layout.svelte`
**Then** WebMCP-Server ist im Browser registriert (FR37, NFR-I7)

**Given** der Adapter
**When** ich 5 Tools in `$lib/webmcp/tools/` implementiere: `address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point` mit JSON-Schema-strict Inputs (`snake_case`-Naming, Englisch-Beschreibungen)
**Then** Tools delegieren an `$lib/data/`-Functions, kein eigener Datenpfad (FR37)

**Given** die Tools
**When** ich Resources in `$lib/webmcp/resources/` implementiere: `active-address.ts`, `loaded-layers.ts` mit URI-Schema `navigator://address/{slug}` und `navigator://layers/active`
**Then** Site exponiert URI-adressierbare Daten als Resources (FR38)

**Given** die Resources
**When** ich 3 Prompt-Templates in `$lib/webmcp/prompts/` implementiere: `address-overview` („Was ist an dieser Adresse besonders?"), `compare-kieze` („Vergleiche diese zwei Kieze"), `explain-layer` („Erkläre den Layer X")
**Then** Site bietet mindestens 3 Prompt-Templates (FR39)

**Given** alle Layer-Hits im Inspektor-Panel
**When** Layer-Hit serialisiert wird
**Then** maschinenlesbare Quellen-Attribution (`source`, `updatedAt`, `license`) ist pro Datenwert vorhanden für LLM-Agent-Zitation (FR40)

**Given** der WebMCP-Server
**When** ich `static/webmcp-manifest.json` und `routes/webmcp-manifest.json/+server.ts` mit Spec-Version dokumentiere
**Then** Spec-Pin ermöglicht Adapter-Update bei Pre-1.0-Breaking-Change ohne Tool-Code-Änderung (NFR-I7)

**Given** die WebMCP-Integration
**When** ich manuell mit Claude-Browser-Extension `list_tools()` und `get_kiez_profile({slug: 'boxhagener-kiez'})` aufrufe
**Then** strukturierte JSON-Antwort mit Quellen-Attribution erscheint
**And** Verifikation in `tests/e2e/webmcp.spec.ts` dokumentiert

### Story 2.8: llms.txt + llms-full.txt-Endpoints

As a LLM-Crawler,
I want eine kondensierte Site-Übersicht (`/llms.txt`) und eine Single-File-Quelle (`/llms-full.txt`) mit Bezirks-/Kiez-/Layer-Inhalten,
So that ich Site-Inhalt effizient als strukturierte Wissens-Quelle aufnehmen kann.

**Acceptance Criteria:**

**Given** alle prerendered Routes und das Manifest
**When** ich `routes/llms.txt/+server.ts` als Build-Time-generierten Markdown-Index aller Bezirks-/Kiez-/Layer-Pages implementiere
**Then** `/llms.txt` liefert kondensierte Navigations-Übersicht (FR34)

**Given** die Page-Inhalte
**When** ich `routes/llms-full.txt/+server.ts` als Single-File-Quelle mit allen Bezirks-/Kiez-/Layer-Page-Inhalten implementiere
**Then** `/llms-full.txt` liefert vollständige Inhalte für LLM-Aufnahme (FR35)

**Given** beide Endpoints
**When** ich `$lib/seo/llms-builder.ts` als Builder-Bibliothek implementiere die aus dem gleichen Manifest wie super-sitemap zieht und Aggregat-Inhalte aus `llms_content`-Tabelle (Story 2.0) zieht
**Then** Konsistenz zwischen Sitemap und llms.txt ist garantiert

### Story 2.9a: Kiez-Score + Bezirks-Score Aggregat-Berechnung

As a Solo-Maintainer und Daten-Konsument,
I want eine deterministische, dokumentierte Cross-Layer-Score-Berechnung für 138 Kieze und 12 Bezirke die Build-Zeit in Postgres aggregiert wird,
So that die Ranking-Page (Story 2.9b) und die Bezirks-/Kiez-Pages auf einer konsistenten, methodisch transparenten Score-Quelle aufsetzen können.

**Acceptance Criteria:**

**Given** das Postgres-Schema (Story 2.0) mit `kiez_score` und `bezirk_score`-Tabellen
**When** ich `src/lib/scoring/`-Modul mit Score-Komponenten pro Cluster (Lärm-Score, Luft-Score, Klima-Score, Grün-Score, ÖPNV-Score, Bildungs-Score) implementiere die jeweils auf 0–100 normieren
**Then** jede Komponente ist isoliert testbar und hat definierte Eingangs- und Ausgangs-Wertebereiche

**Given** die Score-Komponenten
**When** ich `src/lib/scoring/composite.ts` als gewichtete Aggregation implementiere mit explizitem `WEIGHTS`-Konstanten-Objekt und Standard-Gewichtung (z.B. Lärm=0.15, Luft=0.15, Klima=0.15, Grün=0.20, ÖPNV=0.20, Bildung=0.15)
**Then** Gesamt-Score ist transparent dokumentiert und in `docs/scoring-methodology.md` ausführlich erklärt

**Given** die Composite-Funktion
**When** `scripts/aggregate-data.ts` (Story 2.0) erweitert wird um `bezirk_score` und `kiez_score`-Compute + Insert
**Then** beide Score-Tabellen sind nach `pnpm data:aggregate` befüllt
**And** Idempotenz ist getestet (zweimal aufrufen liefert gleiche Werte)

**Given** Edge-Cases
**When** ein Kiez/Bezirk fehlende Daten in einer Komponente hat (z.B. kein Lärm-Layer-Hit)
**Then** Score-Funktion verwendet definierten Fallback (Bezirk-Mittel oder explizit `null` mit Score-Anteil-Reduktion)
**And** Test-Coverage prüft Fallback-Pfade

**Given** die fertigen Scores
**When** Bezirks-Page (Story 2.3) und Kiez-Page (Story 2.4) den Score in Steckbrief-Tabelle einbinden
**Then** jede Page zeigt Gesamt-Score + Komponenten-Breakdown + Methodik-Link

### Story 2.9b: Ranking-Page „Wo lebt es sich gut?"

As a interessierter Bürger / Wohnungssucher / Datenjournalist,
I want eine prerenderte Ranking-Page die Top-N-Kieze (und Top-N-Bezirke) nach Kiez-Score / Bezirks-Score zeigt mit Methodik-Disclosure und Komponenten-Breakdown,
So that ich Berlin-Kieze datenbasiert vergleichen kann und die Methodik nachvollziehbar bleibt.

**Acceptance Criteria:**

**Given** die Score-Aggregat-Tabellen (Story 2.9a)
**When** ich `routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte` und `+page.server.ts` mit `prerender = true` implementiere die Top-30-Kieze nach Score sortiert lädt
**Then** Page hat URL `/wo-lebt-es-sich-gut` (DE) und `/en/where-life-is-good` (EN, alternativ `/en/quality-of-life-ranking` nach Final-Wording-Lock)

**Given** die Page
**When** ich `src/lib/components/atlas/score-ranking-table.svelte` mit sortierbarer Tabelle (Score / Komponenten-Breakdown / Bezirks-Zuordnung) implementiere
**Then** Tastatur-bedienbar, Sortier-State spiegelt sich im URL-Query-Param wider
**And** Bezirks-Toggle (alternative View für 12-Bezirke-Ranking) ist verfügbar

**Given** Methodik-Transparenz
**When** ich oberhalb der Tabelle einen ausklappbaren Disclosure „Wie wird der Score berechnet?" mit Verweis auf `/methodik#kiez-score` und Gewichtungs-Übersicht implementiere
**Then** keine Black-Box-Wahrnehmung
**And** `/methodik`-Page (Story 1.29) wird um Sektion `#kiez-score` erweitert mit ausführlicher Methodik-Beschreibung

**Given** Editorial-Disclaimer
**When** Page einen Hinweis zeigt „Score ist statistisch, nicht normativ. Lebensqualität bemisst sich an persönlichen Prioritäten."
**Then** keine deterministische Wert-Aussage über Stadtteile, Begriffs-Sensibilität gewahrt (kein „lebenswert"-Begriff verwendet)

**Given** SEO + LLM-Discovery
**When** `JsonLd` mit `Dataset` (Score-Methodik als Datensatz) + `Place`-Liste (Top-N als ItemList) eingebunden wird
**Then** Page ist als zitierbare Daten-Quelle für LLM-Agents und Suchmaschinen erkennbar (FR36)

### Story 2.11: Static Hero-Landing auf `/` + Atlas-Move auf `/explore`

As a Erstbesucher / SEO-Traffic-Lander auf `/`,
I want eine schnelle, statisch prerenderte Homepage mit Wertversprechen, Adress-Suche und Beispiel-Einstiegen, die mich gezielt in den Atlas auf `/explore` führt,
So that ich sofort verstehe was Navigator Berlin ist, ohne dass die schwere Karten-Anwendung beim ersten Aufruf geladen wird; LCP und Initial-JS-Budget werden mühelos getroffen, der Atlas wird zur dedizierten Tool-Route mit klarer URL-Semantik (`navigator.berlin/explore`).

**Pivot-Hintergrund (2026-05-15-PM Decision-Log):** Welcome-Overlay-Pattern verworfen. Begründung: Modal über Karte ist UX-Antipattern (Skip-Reflex statt Lesetiefe), MapLibre auf `/` belastet NFR-P1/P5/P6 unnötig, Adress-Suche dreifach redundant (Header + Hero + Overlay). Static-`/` + Atlas-auf-`/explore` löst alle drei Probleme: Brand+SEO+Editorial-Bühne auf `/`, Tool sauber unter eigener Route. `/explore` passt semantisch zur Domain `navigator.berlin` (navigate + explore).

**Route-Naming-Lock:** `/explore` bleibt in beiden Locales identisch (`/explore` DE und `/en/explore` EN), KEIN Paraglide-Reroute zu `/erkunden`. Begründung: ein-Wort-Deep-Link, Sprach-Switch ohne Pfad-Brechen, keine Paraglide-Reroute-Komplexität, „explore" ist als englisches Lehnwort im deutschen Markt-Sprachgebrauch etabliert (vgl. Spotify, Apple, Notion).

**Acceptance Criteria:**

**Given** die bestehende Root-Route `routes/(with-header)/+page.svelte` mit MapLibre-Canvas + Inspector-Panel
**When** ich das aktuelle Atlas-Layout nach `routes/(with-header)/explore/+page.svelte` verschiebe (Datei-Move inkl. zugehöriger `+page.ts`, `+page.svelte.test.ts`, Screenshot-Ordner)
**Then** Atlas-Funktionalität (Karte, Inspector, Address-Search, Layer-Palette, URL-State-Sync) bleibt unverändert, nur unter neuer URL `/explore` (DE) und `/en/explore` (EN) erreichbar
**And** alle Atlas-Query-Parameter (`?address=...&bbox=...&zoom=...&layer=...`) funktionieren identisch wie zuvor unter `/`

**Given** der Naked-Aufruf von `/explore` (oder `/en/explore`) ohne Query-Parameter
**When** Nutzer die Route ohne Pre-Selection lädt
**Then** Karte rendert mit Default-Viewport „ganz Berlin" (identisch zum heutigen Verhalten auf `/` ohne Parameter), Inspector-Panel zeigt Empty-State, keine Adress-Marker, keine URL-Parameter-Reflektion
**And** Default-Viewport-Werte (Bbox, Zoom, Center) sind als Konstanten in `src/lib/components/atlas/internal/default-viewport.ts` extrahiert und dokumentiert
**Note (Finetuning-Backlog):** Default-Viewport-Werte werden in Folge-Story / Tweak-Commit feinjustiert (Optimierung für Aspect-Ratios Desktop/Tablet/Mobile, Berücksichtigung der Inspector-Panel-Breite auf Desktop, evtl. leichter Padding-Offset gegen Brandenburg-Rand). Story 2.11 selbst übernimmt aktuelle Werte 1:1.

**Given** die jetzt freie Root-Route `/`
**When** ich `routes/(with-header)/+page.svelte` als statische Hero-Landing neu implementiere mit `export const prerender = true` in `+page.ts`
**Then** Page enthält keinen MapLibre-Import, keinen Inspector-Code, keinen Address-Search-`load`-Trigger; nur HTML + minimaler Hydrations-JS (Address-Combobox-Submit + Skip-Link-Fokus)
**And** Initial-JS gzipped ≤ 50 KB (NFR-P5 unterboten), Page-Weight ≤ 200 KB inkl. Plex-Variable-Font-Subset (NFR-P6 unterboten), LCP < 1.5s auf Moto G Power 4G Slow (NFR-P1 unterboten)

**Given** die Hero-Landing
**When** sie Inhalt zeigt
**Then** folgende Sektionen sind im prerendered HTML enthalten:
1. Hero-Block: Plex-Serif h1 (`--text-4xl` bis `--text-6xl` responsive) „Berlin in Schichten." (DE) / „Berlin in layers." (EN), Plex-Sans Lead (`--text-lg`, max 60ch) „Tippe eine Adresse oder wähle einen Bezirk. Du siehst Klima, Lärm, Wohnlagen, Verkehr und Geschichte für jeden Punkt der Stadt. Quellen offen, Code offen, ohne Tracking."
2. Address-Combobox (bits-ui, `address-search.svelte` *hero*-Variante aus UX-DR14), submitter goto-t nach `/explore?address={slug}` (DE) bzw. `/en/explore?address={slug}` (EN)
3. Beispiel-Einstiege: 5 kuratierte Quick-Links als `<a href="/explore?address=...">` (z.B. Brandenburger Tor, Alexanderplatz, Görlitzer Park, Tempelhofer Feld, Schloss Charlottenburg), Plex-Sans `--text-sm` `--ink-muted` mit `--accent`-Hover
4. „Was kann man sehen?"-Sektion: 5 Layer-Teaser (Klima, Lärm, Wohnlagen, Verkehr, Geschichte) als Karten-Grid mit Mini-OG-Bild + Lead → Layer-Long-Form-Pages aus Story 2.5a
5. „Top-Kieze"-Teaser: 5 Kiez-Score-Top-Einträge aus `kiez_score`-Aggregat (Story 2.9a) → Verlinkung zur Ranking-Page (Story 2.9b „Wo lebt es sich gut?")
6. Editorial Bezirks-Featured (3-4 Bezirks-Cards) → Bezirks-Long-Form (Story 2.3)
7. „Offen + ohne Tracking"-Block: Brand-Anker mit Verweis auf `/methodik`, `/lizenzen`, GitHub-Repo, Open-Data-Quellen
8. FAQ-Sektion (FAQ-Section pure Template aus Story 2.5b, 5-7 Top-Level-Fragen) im Plex-Serif/Sans-Mix
9. Updates-Teaser (Top-3-Latest aus Story 2.13 `/updates`-Route, „Was sich ändert" / „What's changing" + CTA zu Vollarchiv)
10. Hairline-Trenner zum Footer

**Given** die Hero-Address-Combobox
**When** Nutzer eine Adresse auswählt
**Then** Navigation per `goto('/explore?address=' + encodeURIComponent(slug))` (DE) bzw. `goto('/en/explore?address=' + encodeURIComponent(slug))` (EN) mit `keepFocus: false`
**And** MapLibre-Chunk wird erst beim Atlas-Page-Load asynchron geladen (NFR-P9 erfüllt)

**Given** die Beispiel-Quick-Links
**When** Crawler oder LLM-Agent ohne JS die Page liest
**Then** alle 5 Links sind als reguläre `<a href>`-Tags im HTML auffindbar und navigierbar (kein JS-Event-Hijack)

**Given** der SiteHeader auf `/`
**When** Nutzer Page lädt
**Then** Logo verlinkt auf `/` (selbst), „Atlas öffnen"-Button rechts verlinkt auf `/explore`, Sprach-Wechsler präsent
**And** SiteHeader auf `/explore` zeigt Logo-Link nach `/`, kompakte Address-Search inline (UX-DR14 *header*-Variante)

**Given** SEO + AEO + Crawler-Discovery
**When** `<svelte:head>` der Root-Route gesetzt wird
**Then** folgendes wird gerendert:
- Title: „Navigator Berlin · Stadt-Schichten für jeden Punkt" (DE) / „Navigator Berlin · City layers for every point" (EN)
- Meta-Description: Lead-Absatz-Variante (max 160 Zeichen)
- Canonical: `https://navigator.berlin/` (DE) bzw. `https://navigator.berlin/en/` (EN)
- JSON-LD `WebSite` mit `SearchAction` (`target: https://navigator.berlin/explore?address={search_term_string}`, `query-input: required name=search_term_string`)
- JSON-LD `AboutPage` mit Brand-Beschreibung + Open-Data-Statement
- JSON-LD `BreadcrumbList` (nur Root-Element)
- Open-Graph + Twitter-Card Tags mit Default-OG-Bild aus Story 2.6
- hreflang-Links zu `/` und `/en/` (FR32, FR36)

**Given** `/explore` als Tool-Route
**When** `<svelte:head>` von `routes/(with-header)/explore/+page.svelte` gesetzt wird
**Then** Title abhängig von URL-State („Berlin Atlas · {Adresse}" wenn `?address=` gesetzt, sonst „Berlin Atlas"), Canonical auf URL ohne dynamische Bbox-Parameter, JSON-LD minimaler `WebPage`-Typ
**And** robots-Meta initial `index, follow` (Phase-1-Coming-Soon-Override durch globalen Meta-Robots-Switch aus Story 2.1)

**Given** Sitemap-Generierung (Story 2.1)
**When** `routes/sitemap-de.xml/+server.ts` und `routes/sitemap-en.xml/+server.ts` Build-Time generieren
**Then** beide enthalten `/` (bzw. `/en/`) und `/explore` (bzw. `/en/explore`) als eigene `<url>`-Einträge mit Priority 1.0 (Hero) und 0.9 (Atlas)

**Given** Phase-Sequencing (Phase 1 Coming-Soon → Phase 2 Beta → Phase 3 Hard-Launch)
**When** Phase 1 aktiv ist
**Then** `/` zeigt minimale Coming-Soon-Variante (Brand-Footprint, Owner-Attribution, „Bald verfügbar"-Hinweis, kein Atlas-Link), `/explore` antwortet mit 503 oder redirected auf `/`, `robots.txt` Disallow, `noindex,nofollow`
**And** Phase-Transition zu Phase 2/3 ist ein Inhalts-Swap auf `/` und Aktivierung von `/explore`, keine Architektur-Migration

**Given** Mobile-Breakpoint (<640px)
**When** Hero-Landing geladen wird
**Then** Hero-Block staked vertikal, Address-Combobox volle Breite, Quick-Links als Liste mit Touch-Target ≥44×44px, Layer-Teaser-Grid einspaltig, „Atlas öffnen"-CTA im SiteHeader als Icon-only

**Given** Accessibility
**When** Page geladen wird
**Then** Skip-Link „Direkt zum Inhalt" als erstes fokussierbares Element (visually-hidden bis Fokus), Fokus springt nach Hydration auf Address-Combobox-Input (nur wenn `prefers-reduced-motion: no-preference`), h1 als dokument-Outline-Start, alle interaktiven Elemente tastatur-bedienbar, axe-Audit 0 Errors (NFR-A1)

**Given** EN-Locale (`/en/`)
**When** Hero-Landing in EN gerendert wird
**Then** alle Texte via Paraglide-Messages aus Story 3.2 (h1, Lead, Sektions-Titel, Quick-Link-Labels, FAQ-Fragen), Quick-Link-Targets bleiben gleiche Adress-Slugs (geocoded-IDs sprachneutral), Canonical + hreflang korrekt gesetzt

**Given** Bookmarks (Story 1.26)
**When** Nutzer in Phase-2/3 eine Adresse als Bookmark speichert
**Then** Bookmark-URL nutzt `/explore?address=...`-Schema (nicht mehr `/?address=...`); bestehende LocalStorage-Einträge aus Pre-Launch-Tests werden via Migration-Helper (`bookmark-migrate-v2.ts`) beim ersten Load auf neues Schema umgeschrieben oder verworfen falls ungültig

**Given** Performance-Budget (NFR-P1/P5/P6) auf `/`
**When** Lighthouse-CI gegen Production-Build läuft
**Then** LCP < 1.5s, Initial-JS gzipped < 50 KB, Page-Weight < 200 KB, Performance-Score ≥ 95 (mobile)
**And** CI-Gate blockt Merge wenn Budget überschritten

### Story 2.12: Hero-Landing Content + Atlas-Screenshot-Assets

As a Site-Owner,
I want den finalen Hero-Landing-Content (Texte, Quick-Links, Layer-Teaser, Top-Kieze-Strategie, Bezirks-Card-Auswahl, FAQ-Top-5, Brand-Block, optionaler Hebel-#2-CTA) zusammen mit kuratierten Atlas-Screenshot-Assets,
So that Story 2.11 nicht mit Lorem-Ipsum live geht; jede Sektion hat verifizierten Text, jeder Layer-Teaser hat ein visuelles Anker-Bild, und Such-Maschinen + LLM-Agents lesen substantiellen, einzigartigen Content statt Skelett-Markup.

**Scope-Abgrenzung:** Story 2.11 baut die Sektions-Struktur + Komponenten + SEO-Skeleton. Story 2.12 liefert die Inhalte hinein (Paraglide-Messages + MD-Slots + Bild-Assets). Story 2.12 hängt sequenziell hinter 2.11 (Komponenten existieren → Slots befüllbar).

**Screenshot-Strategie (User-Lock 2026-05-15-PM):** Atlas-Screenshots werden HÄNDISCH erstellt und ins Repo committed. Keine automatisierte Pipeline (Playwright/mbgl-renderer) in Phase 1. Begründung: Aufwand der Pipeline (Tile-Cache, deterministischer Style-Render, CI-Integration) übersteigt Phase-1-Nutzen; manuelle Kuration garantiert visuelle Qualität.

**Acceptance Criteria:**

**Given** Hero-Block Final-Copy
**When** ich `src/lib/paraglide/messages/de.js` und `en.js` mit den Keys `home_hero_h1`, `home_hero_lead`, `home_hero_address_placeholder`, `home_hero_address_submit_label`, `home_hero_examples_label` befülle
**Then** alle Hero-Texte sind via Paraglide-Resolution typesafe abrufbar
**And** Texte sind Plex-Serif-h1-tauglich (knapp, ≤ 30 Zeichen) und Lead Plex-Sans ≤ 60ch
**And** Texte folgen Output-Konventionen (keine em-dashes, kein Begriff „lebenswert")

**Given** Quick-Link-Beispiel-Adressen
**When** ich 5 Berlin-bekannte Adressen kuratiere und ihre Geocoder-Slug-IDs in `src/lib/data/home-quick-links.ts` als typed Array exportiere
**Then** Array enthält pro Eintrag `slug` (Geocoder-ID), `label_de`, `label_en`, `coords` (für SSR-Pre-Fetch-Hint)
**And** Targets aus initialer Quick-Link-Liste validiert via Geocoder-Test: Brandenburger Tor, Alexanderplatz, Görlitzer Park, Tempelhofer Feld, Schloss Charlottenburg

**Given** Layer-Teaser-Sektion
**When** ich `src/lib/content/home-layer-teasers.ts` mit 5 Teaser-Einträgen anlege (Klima, Lärm, Wohnlagen, Verkehr, Geschichte)
**Then** pro Eintrag liegt vor: `layerId` (Verweis auf Layer-Long-Form-Page Story 2.5a), `title_de/en`, `lead_de/en` (max 140 Zeichen), `screenshot` (Pfad zu manuell erstelltem Asset)
**And** Lead-Texte sind redaktionell verfasst, nicht aus Layer-Manifest dupliziert (einzigartiger Content für Crawler)

**Given** Atlas-Screenshot-Asset-Konventionen
**When** ich händisch Screenshots im laufenden Atlas mache und ins Repo committe
**Then** Assets liegen unter `static/screenshots/home/{slug}.webp` (Standard 1×) und `static/screenshots/home/{slug}@2x.webp` (Retina 2×)
**And** Naming-Convention: `slug` = kebab-case (`klima.webp`, `laerm.webp`, `wohnlagen.webp`, `verkehr.webp`, `geschichte.webp`, `hero-default.webp`, `og-default.webp`)
**And** Aspect-Ratios definiert: Layer-Teaser-Card 4:3 (1200×900 / 600×450), Hero-Above-Fold 16:9 (1920×1080), OG-Default 1.91:1 (1200×630), Mobile-Hero 9:16 optional (1080×1920)
**And** Format WebP mit `quality=85`, Fallback `.png` nur falls WebP-Decoder-Probleme (kein JPEG)
**And** Asset-Manifest `src/lib/content/screenshot-manifest.ts` exportiert typesafe Pfade pro Slug + Aspect → Komponenten konsumieren Manifest statt Hardcoded-Pfade
**And** Screenshot-Workflow ist in `docs/runbooks/atlas-screenshot-workflow.md` dokumentiert (Browser-Zoom, Bbox-Setzen, MapLibre-Style, Optimizer-Befehl `cwebp -q 85`)

**Given** Top-Kieze-Auswahl-Strategie auf Hero-Landing
**When** ich `src/lib/content/home-top-kieze.ts` implementiere
**Then** Strategie nutzt automatische Top-5 aus `kiez_score`-Aggregat (Story 2.9a) sortiert nach Total-Score absteigend
**And** Build-Time-Resolution liest aktuelle Score-Werte → Hero-Top-Kieze aktualisieren sich bei Re-Build automatisch ohne Code-Änderung
**And** Disclaimer-Microcopy: „Score ist statistisch, nicht normativ" (re-use String aus Story 2.9b) als Tooltip auf Sektions-Titel

**Given** Bezirks-Featured-Auswahl auf Hero-Landing
**When** ich `src/lib/content/home-featured-bezirke.ts` als manuell-kuratierte Liste von 4 Bezirks-Slugs implementiere
**Then** Auswahl ist editorial-fix: 4 Bezirks-Slugs als Konstanten (initial-Wahl dokumentiert mit Rationale-Kommentar pro Eintrag)
**And** Rotations-Mechanismus expliziert NICHT in Phase 1 (Aufwand vs Nutzen)

**Given** „Offen + ohne Tracking"-Block
**When** ich Paraglide-Messages `home_open_block_title`, `home_open_block_lead`, `home_open_block_bullet_1..4` befülle plus `src/lib/content/home-data-sources.ts` mit Liste der Daten-Lieferanten (Berlin Open Data, ODIS, OpenStreetMap, Stolpersteine-Initiative, geoportal.berlin.de, etc.)
**Then** Block rendert Headline + Lead + 4 Bullets + Source-Text-Liste (kein Logo-Strip in Phase 1; reduziert Maintenance + Brand-Risiken)
**And** Verlinkungen auf `/methodik`, `/lizenzen` und GitHub-Repo-URL als sekundäre Links eingebettet

**Given** FAQ-Sektion auf Hero-Landing
**When** ich aus dem FAQ-Inventar (`faq_qna`-Aggregat aus Story 2.5b) 5 Top-Level-Fragen für Homepage kuratiere
**Then** Auswahl in `src/lib/content/home-faq-selection.ts` als geordnete Liste von `faq_qna.id`-Verweisen, max 5 Einträge
**And** Fragen-Inhalte werden NICHT dupliziert (Single-Source-of-Truth = `faq_qna`-Aggregat), Komponente resolved zur Render-Zeit
**And** FAQ-Sektion-Heading auf Hero ist „Häufig gefragt" (DE) / „Frequently asked" (EN) mit Verweis-Link zu vollem FAQ-Archiv falls existent

**Given** Hebel-#2-Beratungs-CTA (Decision-Lock 2026-05-15-PM: JA, dezent, vor Footer)
**When** ich `src/lib/components/home/consulting-cta.svelte` als schmalen Block vor dem Footer implementiere
**Then** Block enthält Plex-Serif h2 („Datenraum für Verwaltung und Civic-Tech"), Plex-Sans Lead (1-2 Sätze über Beratungs-Angebot DPIA/Open-Data-Strategie/Atlas-Anpassung), Sekundär-Button „Anfrage senden" verlinkt auf `mailto:beratung@navigator.berlin?subject=Datenraum-Beratungsanfrage` (oder Production-Mail)
**And** Block ist visuell schmaler als Hero-Sektionen darüber, kein Hervorheben mit Akzent-Hintergrund (dezent, nicht Marketing-CTA-Pattern)

**Given** Default-OG-Bild für Homepage
**When** ich `static/screenshots/home/og-default.webp` (1200×630) als händisch erstelltes Atlas-Screenshot mit Brand-Overlay erstelle
**Then** Bild zeigt Atlas-Render mit Plex-Wortmarke + Tagline („Berlin in Schichten · Open Data ohne Tracking"), referenziert in Open-Graph-Meta + Twitter-Card auf `/` und `/en/`
**And** Falls Brand-Overlay komplex: Satori-OG-Pipeline (Story 2.6) generiert Brand-Layer, Hintergrund bleibt manueller Screenshot

**Given** Performance-Budget mit Bild-Assets (NFR-P6 Page-Weight ≤ 500 KB Landing, neue Story-2.12-Story-2.11-Kombi ≤ 200 KB Ziel)
**When** ich alle Screenshots mit `cwebp -q 85` komprimiere und mit `loading="lazy"` (außer Hero-Above-Fold) sowie `srcset`-1×/2× einbinde
**Then** Hero-Above-Fold-Bild Eager-Load mit max 80 KB WebP, alle weiteren Bilder Lazy, gesamte Below-Fold-Bild-Last < 300 KB
**And** Lighthouse-CI bestätigt Budget unter NFR-P6

**Given** Content-Maintainer-Workflow
**When** ich `docs/runbooks/home-landing-content-update.md` dokumentiere
**Then** Runbook beschreibt: (1) Paraglide-Message-Edit, (2) Quick-Link-Liste anpassen, (3) Bezirks-Featured-Liste tauschen, (4) Screenshot-Update-Prozess, (5) FAQ-Auswahl ändern, (6) CTA-Copy-Edit
**And** kein Code-Deploy für reinen Content-Change nötig (alle Content-Slots in TS-Konstanten + Paraglide → Re-Build genügt)

### Story 2.13: Updates-Route mit RSS + Categories + JSON-LD

As a Site-Visitor / Daten-Nutzer / LLM-Agent / RSS-Subscriber,
I want eine dedizierte `/updates`-Route die strukturiert auflistet was sich an Daten, Features und Methodik geändert hat,
So that ich (a) als Bürger über Daten-Refreshes informiert bin, (b) als Civic-Tech-Entwickler Feature-Releases verfolgen kann, (c) als RSS-Subscriber per Feed-Reader Bescheid kriege, (d) als LLM-Agent strukturierte Update-Historie via Schema.org `BlogPosting` zitieren kann.

**Scope-Lock (User-Lock 2026-05-15-PM):** Route-Name `/updates` (DE+EN identisch, KEIN Paraglide-Reroute). MVP-Scope: RSS + Atom + JSON-Feed + Categories + JSON-LD ALLES Phase 1.

**Acceptance Criteria:**

**Given** Updates-Content-Quelle
**When** ich `_content/updates/` als Verzeichnis für Markdown-Dateien einführe
**Then** Datei-Naming-Convention `YYYY-MM-DD-{slug}.md` (z.B. `2026-05-20-stolpersteine-osm-sync-erweitert.md`)
**And** Frontmatter pro Datei: `title_de`, `title_en`, `date` (ISO-8601), `category` (enum: `daten-update` | `feature` | `methodik` | `datenquelle` | `lizenz`), `summary_de`, `summary_en` (max 160 Zeichen für Meta-Description-Fitness), `tags` (Array, optional), `lang` (default `de`, falls EN-Variante mit eigenem Body: separate Datei mit Suffix `.en.md`)
**And** Body ist regulärer Markdown (Mietspiegel-Update-Notes, Feature-Changelog, Methodik-Erläuterung) mit optional eingebetteten Links auf Layer-Pages, Methodik-Sektionen, GitHub-Commits

**Given** `/updates`-Route-Implementation
**When** ich `routes/(with-header)/updates/+page.svelte` + `+page.ts` mit `export const prerender = true` implementiere und `_content/updates/**/*.md` Build-Time via `import.meta.glob` einlese
**Then** Route rendert chronologisch absteigend (neueste zuerst) als Long-Form-Layout (UX-DR43): Plex-Serif h1 „Updates" (DE) / „Updates" (EN), Lead-Absatz erklärt was hier zu sehen ist + Verweis auf RSS-Feed
**And** jeder Entry rendert: Datum (Plex-Sans `--text-sm` `--ink-muted`), Category-Badge (5 Farben pro Category), Plex-Serif h2 Title, Summary-Lead, „Mehr lesen"-Toggle-Disclosure für Body-Markdown
**And** Filter-Komponente oberhalb der Liste mit Category-Toggle-Group (bits-ui `ToggleGroup.Root`, multi-select): „Alle / Daten-Update / Feature / Methodik / Datenquelle / Lizenz"
**And** Filter-State in URL als Query-Parameter `?cat=feature,methodik` reflektiert, deeplink-fähig

**Given** Per-Entry-Detail-Routen
**When** ich `routes/(with-header)/updates/[slug]/+page.svelte` + `+page.ts` mit Server-Load aus MD-Frontmatter und Body-Render implementiere
**Then** jeder Update-Entry hat eigene URL `/updates/{slug}` mit voller Markdown-Render, Breadcrumb (Home › Updates › Entry-Title), `prerender = true`
**And** Per-Entry-`<svelte:head>`: Title aus Frontmatter, Meta-Description aus Summary, Canonical, hreflang DE/EN

**Given** RSS-Feed
**When** ich `routes/updates/rss.xml/+server.ts` mit Content-Type `application/rss+xml; charset=utf-8` und prerender implementiere
**Then** Feed enthält alle Updates der letzten 50 Einträge (oder alle falls < 50), pro Entry: `<title>`, `<link>`, `<guid isPermaLink="true">`, `<pubDate>` (RFC-822), `<description>` (Summary), `<category>`
**And** Feed-Channel-Meta: `<title>Navigator Berlin · Updates</title>`, `<link>https://navigator.berlin/updates</link>`, `<description>Daten-Updates, Features, Methodik-Änderungen.</description>`, `<language>de-DE</language>`
**And** Build-Time-Generation, kein Runtime-Serving (statisch ausgeliefert)

**Given** Atom-Feed (Spec-Parity)
**When** ich `routes/updates/atom.xml/+server.ts` mit Content-Type `application/atom+xml; charset=utf-8` implementiere
**Then** Atom-1.0-Spec-konform mit `<feed>`, `<entry>`, `<author>`, `<updated>`-Tags, `<id>`-URIs nach RFC-4287

**Given** JSON-Feed (modern reader convenience)
**When** ich `routes/updates/feed.json/+server.ts` mit Content-Type `application/feed+json` und JSON-Feed-1.1-Spec implementiere
**Then** Feed enthält `version`, `title`, `home_page_url`, `feed_url`, `items[]` mit `id`, `url`, `title`, `content_text`, `summary`, `date_published`, `tags`

**Given** Feed-Discovery
**When** Hero-Landing-`/` und `/updates`-Route gerendert werden
**Then** `<svelte:head>` enthält `<link rel="alternate" type="application/rss+xml" title="Navigator Berlin Updates (RSS)" href="https://navigator.berlin/updates/rss.xml">`, analog Atom und JSON-Feed
**And** Auto-Discovery via Browser-Extensions / Feed-Reader funktioniert

**Given** JSON-LD Structured Data pro Entry
**When** ich Story-2.2-Generator-Lib (`src/lib/jsonld/`) um `BlogPosting`-Generator erweitere und in `routes/(with-header)/updates/[slug]/+page.svelte` einbinde
**Then** Per-Entry JSON-LD: `BlogPosting` mit `headline`, `datePublished`, `dateModified`, `author` (Organization: Navigator Berlin), `publisher`, `mainEntityOfPage`, `articleSection` (= Category), `description`, `inLanguage`, optional `keywords` (= Tags)
**And** `/updates`-Index-Route trägt JSON-LD `Blog` mit `name`, `url`, `description`, `inLanguage`, `blogPost`-Liste (verkürzt, Top-10) (FR36)

**Given** Sitemap-Integration
**When** Story-2.1-Sitemap-Generator läuft
**Then** `/updates`, `/en/updates`, alle `/updates/{slug}` und `/en/updates/{slug}` werden in `sitemap-de.xml` bzw. `sitemap-en.xml` mit `<lastmod>` aus Frontmatter-`date` und Priority 0.6 (Index) / 0.7 (Per-Entry) eingetragen

**Given** Top-3-Latest-Updates-Teaser auf Hero-Landing
**When** ich `src/lib/components/home/updates-teaser.svelte` implementiere und in Story-2.11 Hero-Landing einbinde
**Then** Sektion zwischen FAQ und Brand-Block rendert: Plex-Serif h2 „Was sich ändert" (DE) / „What's changing" (EN), 3 neueste Entries als Card-Liste (Datum, Category-Badge, Title, Summary, Link auf Detail-Route), CTA-Link „Alle Updates" → `/updates`
**And** Teaser-Daten via Build-Time-Resolution aus selben `import.meta.glob`-MD-Load (kein doppelter Parse-Pfad)

**Given** Footer-Link
**When** Footer auf allen Routen rendert
**Then** Footer enthält `<a href="/updates">Updates</a>` (DE) / `Updates` (EN) zwischen `/methodik` und `/lizenzen`-Links

**Given** EN-Locale-Variante
**When** Nutzer `/en/updates` aufruft
**Then** alle UI-Strings (Filter-Labels, Headings, Footer-CTA) via Paraglide-Messages aus Story 3.2 lokalisiert
**And** Pro Entry: wenn separate `.en.md`-Datei existiert → EN-Body, sonst Fallback auf DE-Body mit Disclaimer-Banner „This update is currently only available in German"
**And** Hreflang-Cross-Links Per-Entry

**Given** Phase-Sequencing
**When** Phase 1 Coming-Soon aktiv ist
**Then** `/updates` antwortet mit 503 oder redirected auf `/` (analog `/explore`)
**And** Erst-Update-Entry für Hard-Launch existiert als `_content/updates/2026-XX-XX-launch.md` (Beta) und `2026-XX-XX-hard-launch.md` (Phase 3)

**Given** Accessibility
**When** Updates-Route gerendert wird
**Then** Filter-Toggle-Group hat `role="group"` + `aria-label`, jeder Toggle-Button hat `aria-pressed`, Disclosure-Toggles haben `aria-expanded`, h1+h2-Outline ist semantisch korrekt
**And** axe-Audit 0 Errors (NFR-A1)

**Given** Maintainer-Workflow
**When** Owner einen neuen Update-Entry hinzufügen will
**Then** `docs/runbooks/add-update-entry.md` dokumentiert: (1) MD-Datei in `_content/updates/` mit korrektem Datums-Prefix anlegen, (2) Frontmatter-Felder ausfüllen, (3) Body schreiben, (4) `pnpm dev` lokal verifizieren, (5) commit + push, (6) Build triggert Sitemap + Feed-Regen automatisch
**And** Keine DB-Interaktion nötig (Markdown-First-Workflow)

### Epic 2 Status

15 Stories total: 2.0 Postgres-Foundation, 2.1 SEO-Foundation, 2.2 JSON-LD-Generator, 2.3 Bezirk-Pages, 2.4 Kiez-Pages, 2.5a Layer-Page-EN-Variante, 2.5b FAQ-Section pure Template, 2.6 OG-Image-Pipeline, 2.7 WebMCP-Integration, 2.8 llms.txt + llms-full.txt, 2.9a Kiez-Score + Bezirks-Score Aggregat, 2.9b „Wo lebt es sich gut?"-Ranking-Page, 2.11 Static Hero-Landing auf `/` + Atlas-Move auf `/explore`, 2.12 Hero-Landing Content + Atlas-Screenshot-Assets, 2.13 Updates-Route mit RSS + Categories + JSON-LD.

FR27–FR40 vollständig adressiert. FR55a–FR55b (de/en-Subset). i18n-Scope auf de/en beschränkt (User-Lock 2026-05-15, FR55c–FR55j verschoben in Future-Epic).

Sequence: 2.0 zuerst (blockt 2.3/2.4/2.5b/2.9a/2.9b). 2.1 + 2.2 parallel. 2.3 → 2.4 → 2.5a/2.5b. 2.6 nach 2.3-2.5. 2.9a → 2.9b. 2.7 + 2.8 am Ende. 2.11 nach 2.3/2.5a/2.5b/2.9a (konsumiert Bezirks-Cards, Layer-Teaser, FAQ-Section, Kiez-Score-Top-N, Story 1.26 Bookmark-URL-Migration auf `/explore`-Schema). 2.13 parallel zu 2.11 möglich (eigenständige Route, nur Footer-Link + Hero-Teaser-Slot bei 2.11). 2.12 nach 2.11 (Komponenten existieren → Slots befüllbar) und nach 2.13 (Updates-Teaser-Slot in Hero-Landing).

Postgres-Production-Setup (Coolify-Service + pg_dump-Backup + Network-Hardening) wird formell in Epic 4 Story 4.1 + 4.2 dokumentiert. **Story 4.1 wandert nach Story 2.0** (User-Lock-Revision 2026-05-15-PM) — Server-Kauf direkt nach Postgres-Foundation existent. Epic 2 entwickelt zunächst gegen lokale Postgres 17 (Homebrew, ohne PostGIS); ab Story 4.1-Abschluss läuft `data:aggregate` parallel gegen Production-Postgres als Coming-Soon-Phase-Validation.

## Epic 3: i18n Paraglide-Foundation auf DE-only (Phase 1)

**User-Lock 2026-05-16:** EN-Coverage komplett verschoben in Future-Epic „i18n-Phase-3-EN-Coverage". Phase 1 zeigt Site ausschließlich auf Deutsch. Paraglide-Infrastruktur bleibt installiert für späteren Reaktivierungs-Sprint ohne Setup-from-scratch.

Begründung: i18n-Aufwand Phase-1-EN-Variante (Epic 3 = 5 Stories + EN-Anteil in Epic 2/4/6 Stories) wurde auf ≈ 3-4 Wochen Solo-Equivalent geschätzt. Personas Anna/Tobias/Marek/Frieda alle DE-sprachig, Berlin-Civic-Tech-Discovery läuft auf DE, Beratungs-Asset-Demand DE-Berlin-Kunden ≥95%, LLM-Discovery rangiert auch DE-Content für DACH-Antworten. Post-Hard-Launch-Reaktivierung (Phase 3, T+12w+) wenn Search-Console- oder LLM-Referrer-Daten EN-Demand zeigen.

Sequencing: Epic 3 ist nicht mehr Blocker für Epic 2. Stories 2.3/2.4/2.5a/2.11/2.12 entfallen EN-Varianten. Epic 3 = 1 Story (Foundation-Cleanup) — parallel zu anderen Epics möglich, blockiert nichts.

### Story 3.1: Paraglide-Setup-Reduce auf DE-only

As a Solo-Maintainer,
I want den aktuellen 8-Sprachen-Paraglide-Setup auf DE-only reduzieren ohne die Paraglide-Infrastruktur rauszubauen, alle Non-DE-Bundles löschen und Paraglide neu kompilieren,
So that wir auf einem klaren, scope-konsistenten DE-only-Setup für Phase 1 aufsetzen ohne Tot-Code-Drift, und EN-Reaktivierung in Phase 3 ohne Setup-from-scratch möglich bleibt.

**Acceptance Criteria:**

**Given** der bestehende Inlang-Setup in `project.inlang/settings.json` mit 8 Locales (`en`, `de`, `fr`, `es`, `it`, `pl`, `tr`, `ar`) und `baseLocale: "en"`
**When** ich `settings.json` auf `locales: ["de"]` und `baseLocale: "de"` reduziere
**Then** Inlang-Konfiguration spiegelt User-Lock 2026-05-16 (DE-only, Phase 1)

**Given** die existierenden Message-Bundles in `messages/`
**When** ich `messages/{en,ar,fr,es,it,pl,tr}.json` lösche und nur `de.json` behalte
**Then** keine toten Bundles im Repo
**And** Git-History bewahrt die gelöschten Bundles für Future-Epic „i18n-Phase-3-EN-Coverage"-Rebase

**Given** der bestehende Paraglide-Compile-Output in `src/lib/paraglide/messages/`
**When** ich `pnpm paraglide:compile` (oder Vite-Plugin-Auto-Recompile) neu laufen lasse
**Then** `src/lib/paraglide/messages/` enthält nur noch `_index.js` und `de.js`
**And** keine Komponente referenziert mehr eine gelöschte Locale

**Given** der bestehende Paraglide-Vite-Plugin-Setup
**When** ich verifiziere dass `vite.config.ts` keine Multi-Locales-Hardcode-Liste enthält und Reroute-Hook korrekt für Single-Locale arbeitet
**Then** Build-Step bleibt grün ohne Locale-Ref-Errors
**And** Paraglide-Vite-Plugin bleibt installiert (keine Deps-Removal)

**Given** die DE-Master-Strings in `messages/de.json`
**When** ich Existenz aller benötigten UI-Keys gegen Component-Usage prüfe (`grep -r "m\." src/lib/components/ src/routes/`)
**Then** alle Komponenten nutzen Paraglide-Messages statt hardcoded Strings (Architecture „MUST"-Regel #14)
**And** keine fehlenden Keys

**Given** Routing-Pattern (Memory `project_paraglide_reroute.md`)
**When** SvelteKit-Routes durchlaufen Paraglide-Reroute-Hook
**Then** Routes ohne `[lang]`-Param funktionieren weiterhin
**And** `getLocale()` liefert konstant `"de"` ohne URL-Prefix-Logic

**Given** Future-EN-Reaktivierung
**When** dokumentiert werden muss wie EN später wieder hinzugefügt wird
**Then** `docs/i18n-reactivation.md` Stub-Datei dokumentiert: Inlang-locales-Array erweitern, Paraglide-Recompile, Translation-Workflow neu aufsetzen, hreflang-Cluster aktivieren, LanguageSwitcher-Komponente bauen (Verweis auf Future-Epic-3-Phase-3-Story-Liste)

<!-- ENTFERNTE STORIES (User-Lock 2026-05-16): Stories 3.2 EN-UI-Coverage, 3.3 LanguageSwitcher + hreflang, 3.4 Accept-Language-Redirect, 3.5 Translation-Workflow + Editorial-Sensible-Pattern verschoben in Future-Epic „i18n-Phase-3-EN-Coverage". Originaltext aus Git-History abrufbar (Commit vor 2026-05-16). -->

### Story 3.2-3.5: VERSCHOBEN nach Future-Epic „i18n-Phase-3-EN-Coverage"

Stories 3.2 (EN-UI-Coverage), 3.3 (LanguageSwitcher + hreflang), 3.4 (Accept-Language-Redirect), 3.5 (Translation-Workflow + Editorial-Sensible-Pattern) sind per User-Lock 2026-05-16 in Future-Epic „i18n-Phase-3-EN-Coverage" verschoben. Reaktivierung Post-Hard-Launch (Phase 3, T+12w+). Siehe Future-Epics-Section am Anfang der Datei.

### Original-Story-Bodies (Archiv für Future-Epic-Rebase)

Die folgenden Story-Bodies waren bis 2026-05-16 in Epic 3 enthalten. Sie werden hier zur leichteren Rebase aus Future-Epic „i18n-Phase-3-EN-Coverage" konserviert, sind aber NICHT Teil des aktuellen Phase-1-Scopes.

#### [ARCHIV] Story 3.2: EN-UI-Coverage komplett

As a englisch-sprechender Berliner,
I want jeden DE-UI-String auch auf Englisch sehen können — keine Mischung aus DE-Originalen und EN-Strings,
So that die englische Site-Variante als vollwertige Erfahrung wirkt.

**Acceptance Criteria:**

**Given** die DE-Master-Strings in `messages/de.json`
**When** ich `scripts/i18n-coverage-check.ts` als CLI-Script implementiere das jeden DE-Key gegen den EN-Bundle prüft
**Then** Coverage-Test schlägt fehl bei jedem fehlenden EN-Key
**And** `pnpm i18n:check` ist als Pre-Commit-Hook (Lefthook) registriert

**Given** der Coverage-Check zeigt fehlende EN-Keys
**When** ich lokal in einer Claude Code Sub-Session `scripts/translate.ts --target=en --diff-only` ausführe um nur die Diff-Keys zu übersetzen
**Then** Output schreibt fehlende Keys in `messages/en.json` und ich committe das Result

**Given** die finalen EN-Bundles
**When** ich `pnpm i18n:check` erneut ausführe
**Then** Coverage = 100%
**And** Coverage-Report wird in CI als Gate enforced

**Given** Edge-Cases bei Übersetzung
**When** Begriffe ohne 1:1-EN-Pendant existieren (z.B. „Kiez", „Bezirk", „Mietspiegel")
**Then** EN-Bundle behält DE-Original mit erklärender Klammer-Annotation („Kiez (neighborhood)", „Mietspiegel (rent index)")
**And** Style-Guide für Berlin-Spezifika ist in `docs/i18n-style-guide.md` dokumentiert

**Given** die EN-Coverage
**When** ich `/en` (oder `/en/`) im Browser aufrufe
**Then** alle UI-Chrome-Strings (Header, Footer, Inspector, MapControls, AddressSearch, LayerPalette) erscheinen englisch
**And** kein DE-Fallback-String sichtbar

#### [ARCHIV] Story 3.3: LanguageSwitcher + hreflang-Cluster (de/en)

As a mehrsprachiger Berliner,
I want einen Sprach-Switcher im SiteHeader mit 2 Optionen (Deutsch / English in Eigen-Sprache) — Sprach-Wechsel behält Viewport, Adresse und aktive Layer,
So that ich Sprache wechseln kann ohne Geo-Kontext zu verlieren.

**Acceptance Criteria:**

**Given** Paraglide und das de/en-Routing
**When** ich `src/lib/components/atlas/lang-switcher.svelte` als Bits-UI-Komponente mit 2 Optionen implementiere (Deutsch, English jeweils in Eigen-Sprache)
**Then** aktuelle Sprache ist visuell markiert mit `--accent` Text (FR55d, UX-DR25)
**And** Switcher ist tastatur-bedienbar und screenreader-zugänglich (`aria-current="page"` für aktive Sprache)

**Given** der LanguageSwitcher
**When** Nutzer die andere Sprache wählt
**Then** URL-Prefix wechselt zwischen `/` (DE) und `/en/`, alle anderen URL-Parameter (Bbox, Adresse, Layer) bleiben erhalten
**And** Page lädt neu mit übersetztem Inhalt aber identischem Geo-Zustand (FR55b, UX-DR39)

**Given** der LanguageSwitcher
**When** ich ihn im bestehenden `SiteHeader` als kompaktes Element rechts-bündig integriere (statt MetaFooter wie ursprünglich geplant, weil SiteHeader-Skeleton schon existiert und prominentere Sichtbarkeit hat)
**Then** Switcher ist auf jeder Page erreichbar (FR55d, FR55j)

**Given** alle prerendered Pages
**When** ich `<link rel="alternate" hreflang="de">` + `<link rel="alternate" hreflang="en">` + `<link rel="alternate" hreflang="x-default" href="...de-URL...">` pro Page in `<svelte:head>` setze
**Then** Suchmaschinen erkennen Sprach-Cluster (FR55e, NFR-IL7)
**And** `x-default` zeigt auf die DE-Variante (Master-Locale)

**Given** der LanguageSwitcher
**When** Nutzer Sprache zum ersten Mal wechselt
**Then** kurze Inline-Info-Meldung „Übersetzungen maschinell erstellt" erscheint (Plex Sans `--text-xs` `--ink-subtle`, sticky bis User-Dismiss, kein Toast wegen [[feedback-no-toast]]) (UX-DR39)

#### [ARCHIV] Story 3.4: Accept-Language-Redirect cookieless

As a Berliner mit englischer Browser-Sprache,
I want beim ersten Besuch automatisch zur englischen Route weitergeleitet werden — ohne dass ein Cookie gesetzt wird,
So that ich die Site sofort in meiner Sprache sehe und Cookieless-by-default-Architektur gewahrt bleibt.

**Acceptance Criteria:**

**Given** das de/en-Routing
**When** ich `src/routes/+layout.server.ts` mit Accept-Language-Header-Auswertung und 302-Redirect zur passenden `/en/`-Route nur bei Root-Aufruf (`/`) implementiere
**Then** Browser mit `en-*`-Präferenz wird beim ersten Besuch zu `/en/` weitergeleitet
**And** Browser mit `de-*`-Präferenz oder unbekannter Sprache bleibt auf `/` (DE-Default)
**And** kein Cookie wird gesetzt (NFR-PR1, NFR-IL6)

**Given** der Redirect
**When** Nutzer eine spezifische Route mit Sprach-Prefix aufruft (z.B. `/en/bezirk/mitte`)
**Then** kein Auto-Redirect, User-Choice respektiert
**And** auch keine Auto-Redirects auf Deep-Links ohne Sprach-Prefix die per Bookmark/Share kommen (z.B. `/bezirk/mitte` bleibt DE auch für EN-Browser)

**Given** das Layout-Wrapping
**When** ich `<html lang="de">` und `<html lang="en">` korrekt pro Locale in `app.html` und Root-Layout dynamisch setze
**Then** Screenreader und Browser-Reader interpretieren Sprache korrekt (NFR-IL7)

**Given** Test-Coverage
**When** ich Playwright-Spec `tests/e2e/i18n-redirect.spec.ts` mit Accept-Language-Header-Override-Variants implementiere (`en-US`, `en-GB`, `de-DE`, `fr-FR`, leerer Header)
**Then** Redirect-Logik ist regression-getestet
**And** Cookie-Audit zeigt 0 Cookies nach Redirect

#### [ARCHIV] Story 3.5: Translation-Workflow + Editorial-Sensible-Pattern

As a Solo-Maintainer,
I want einen idempotenten lokalen Translation-Workflow der DE-Master + Content-Files in EN übersetzt und Sensible-Content-Pattern enforced,
So that ich neue UI-Strings effizient via Sub-Session übersetzen kann und sensible Inhalte nicht ungewollt maschinell übersetzt werden.

**Acceptance Criteria:**

**Given** der DE-Master in `messages/de.json` und Content-Files in `src/lib/data/layer-content/{slug}.de.json` + `src/lib/data/faq-templates/*.de.yaml`
**When** ich `scripts/translate.ts` implementiere das einen Diff-Report aller fehlenden EN-Keys und Content-Files erzeugt und in `_translation-workdir/{date}/` als strukturierten Markdown-Prompt ablegt
**Then** Script ist idempotent (zweimal aufrufen liefert gleichen Diff bei unverändertem Source)
**And** ich kopiere den Prompt in eine Claude Code Sub-Session, übersetze, committe das Result manuell

**Given** der Workflow
**When** ich `pnpm i18n:translate-diff` als Convenience-Command in `package.json` registriere
**Then** Solo-Maintainer-Loop ist dokumentiert in `docs/i18n-workflow.md`

**Given** sensible Inhalte (Stolperstein-Personen-Texte, Mauer/Sektoren-Erklärungen)
**When** Translation-Workflow läuft
**Then** diese Inhalte werden NICHT in den Diff-Report aufgenommen (FR55i, NFR-IL9)
**And** stattdessen markiert das Script in `_translation-workdir/sensible-content-redirects.md` welche Wikipedia-EN-URLs als Fallback gelten

**Given** Stolperstein-Personen
**When** EN-User eine Stolperstein-Detail aufruft
**Then** wird DE-Original-Text mit Hinweis „Original German source — translation withheld out of editorial respect" angezeigt
**And** Wikipedia-EN-Link wird verlinkt falls vorhanden, sonst Wikipedia-DE als Quelle
**And** kein automatisch generierter EN-Text

**Given** Mauer/Sektoren-Erklärungen
**When** sie auf EN-Page angezeigt werden
**Then** historischer Stand-Hinweis bleibt verlinkt zur Originalquelle (OSM-Community, Code-for-Berlin)
**And** keine maschinelle Übersetzung des Erklär-Texts

**Given** das MetaFooter-Datenschutz-Element
**When** ich Translation-Quality-Disclaimer in DSGVO-Statement integriere
**Then** Footer-Disclaimer „Übersetzungen maschinell erstellt, manuell gegengelesen. Bei Fehlern: Mailto-Kontakt." erscheint in DE und EN (FR55j, NFR-IL10)
**And** Mailto-Adresse ist Editorial-Fehler-Meldepfad

### Epic 3 Status

**Phase 1 Scope:** 1 Story (3.1 Paraglide-Setup-Reduce auf DE-only).

**Verschoben in Future-Epic „i18n-Phase-3-EN-Coverage" (User-Lock 2026-05-16):** Stories 3.2 EN-UI-Coverage komplett, 3.3 LanguageSwitcher + hreflang-Cluster (de/en), 3.4 Accept-Language-Redirect cookieless, 3.5 Translation-Workflow + Editorial-Sensible-Pattern. Story-Bodies oben unter „[ARCHIV]"-Heading als Rebase-Reference erhalten.

FRs covered Phase 1: keine direkten FRs. FR55a–FR55j komplett verschoben. Phase-1-Scope ist reines Setup-Cleanup ohne user-facing EN-Coverage.

Sequencing: Story 3.1 blockiert nichts und wird von nichts blockiert. Empfohlener Run: T+0 als Quick-Win (1-2 Tage Solo, smoke-level, da Paraglide-Setup existing).

FR55a–FR55b adressiert (de/en-Subset). FR55c–FR55j (6+ weitere Sprachen + RTL) verschoben in Future-Epic „i18n-Expansion". NFR-IL1, NFR-IL2 (kompiliert für 2 Locales), NFR-IL6 (cookieless), NFR-IL7 (hreflang + html-lang), NFR-IL8 (Quality-Disclaimer für EN), NFR-IL9 (Editorial-Pattern für EN-Wikipedia-Fallback), NFR-IL10 (Footer-Disclaimer + Mailto) implementiert. NFR-IL3 (Plex Sans Arabic), NFR-IL4 (CSS Logical Properties für RTL) verschoben.

Sequencing: läuft VOR Epic 2. Stories 3.1 + 3.2 müssen abgeschlossen sein bevor Epic 2 Stories 2.3/2.4/2.5a (Bezirks-/Kiez-/Layer-EN-Variante) gestartet werden. Stories 3.3-3.5 können parallel zu Epic 2 laufen.

## Epic 4: EU-FOSS Hosting + Compliance-Showcase

Site läuft produktiv auf Hetzner-Frankfurt + Coolify + Traefik + CrowdSec ohne US-Drittanbieter. Alle 8 CI-Gates aktiv. Auto-generierte Lizenz-Matrix. Compliance-Pages (Impressum, Datenschutz, Barrierefreiheit, Architektur, Lizenzen) als sichtbares Beratungs-Showcase. Reproduzierbarer Build, Disaster-Recovery dokumentiert.

### Story 4.1: Hetzner CPX22 + Coolify + Traefik + Postgres Production-Setup

As a Solo-Maintainer,
I want produktives Hosting auf Hetzner-Frankfurt CPX22 (AMD) mit Coolify + Traefik + dediziertem Postgres-Service mit Auto-Restart, Daily-Backup und pg_dump-Routine,
So that Site mit 99% Uptime ohne SLA und ohne externes Monitoring betreibbar ist und Postgres-Aggregat-Schicht (Epic 2 Story 2.0) deployed werden kann.

**Acceptance Criteria:**

**Given** ein Hetzner-Account und User-Lock-Server-Wahl 2026-05-15
**When** ich Hetzner-CPX22-Instance (AMD, 8GB RAM / 2 vCPU / 80GB SSD, Frankfurt, EUR 9,51/Monat) provisioniere (Kauf-Trigger: nach Epic 2 Story 2.0, weil Postgres-Foundation/Drizzle-Schema dann existiert und Production-Postgres-Service definitionsfähig ist; AMD-only-Verfügbarkeit per Hetzner-UI 2026-05)
**Then** Server ist via SSH (Key-Auth, kein Passwort, dedizierter Admin-Account ohne Root-Login) erreichbar (NFR-S8)

**Given** die Hetzner-Instance
**When** ich Coolify als Container-Orchestration installiere
**Then** Coolify-Web-UI erreichbar, Auto-Restart bei Crash mit Restart-Lücke <60s konfiguriert (NFR-R2)

**Given** Coolify
**When** ich `docker-compose.yml` mit App-Container + Traefik + CrowdSec-Plugin + dediziertem Postgres-17-Service (kein PostGIS, kein Public-Port, nur Internal-Network erreichbar) definiere und deploye
**Then** App ist über `navigator.berlin` erreichbar
**And** Traefik terminiert TLS
**And** Postgres ist nur app-intern verbunden (`DATABASE_URL=postgres://app:***@postgres:5432/navigator`)

**Given** Coolify-Volumes für App-State und Postgres-Daten
**When** ich Daily-Backup mit 7d Retention für App-Volume und nightly `pg_dump` mit 14d Retention für Postgres konfiguriere und auf separate Hetzner-Storage-Box (oder vergleichbarer Off-Server-Storage) replizieren lasse
**Then** Backup läuft täglich automatisch (NFR-R4)
**And** Restore-Pfad ist via `postgres-restore.md`-Runbook (Story 4.4) dokumentiert

**Given** die Domain `navigator.berlin`
**When** ich Auto-Renewal-Pay aktiviere und 60-Tage-Vorab-Erinnerung per E-Mail einrichte
**Then** Domain-Verlust durch versehentliches Ablaufen ausgeschlossen (NFR-R5)

**Given** der `/healthz`-Endpoint aus Story 1.1
**When** Coolify-Health-Check ihn abfragt
**Then** Container-Health-Dashboard zeigt App + Postgres-Status (NFR-R2)
**And** Postgres-Health via `pg_isready` als zusätzliche Probe

**Given** Deployment-Phasen-Strategie (User-Lock-Revision 2026-05-15-PM)
**When** ich erstes Deploy nach Server-Provisioning starte
**Then** Phase 1 = **Coming-Soon-Skelett**: minimale `routes/+page.svelte` mit Brand-Footprint + Owner-Attribution + „Coming Soon"-Hinweis, `robots.txt` mit `Disallow: /`, kein Sitemap-Submit, `<meta name="robots" content="noindex, nofollow">`
**And** `/healthz`-Endpoint live für Monitoring-Probe
**And** SSL-Cert generiert, DNS propagiert, Domain-Footprint claim'd

**Given** die Coming-Soon-Phase läuft und Epic 2 Stories 2.1-2.11 + Epic 3 abgeschlossen sind
**When** ich auf Phase 2 = **Soft-Production / Closed-Beta** umschalte
**Then** Beta-Banner visible („Beta — Daten teilweise in Iteration"), `<meta name="robots" content="noindex, nofollow">` bleibt aktiv, robots.txt erlaubt Crawler aber Sitemap noch nicht submitted
**And** Friends-and-Family-Test-Pfad dokumentiert in `docs/launch-plan.md`

**Given** Epic 4 Stories 4.2-4.7 + Epic 5 Story 5.1-5.4 abgeschlossen sind
**When** ich auf Phase 3 = **Hard-Production** umschalte (Epic 5 Story 5.3 Launch-Day)
**Then** noindex-Meta entfernt, Sitemap-Submission zu Search Console (Epic 5 Story 5.7), Beta-Banner entfernt, Hard-Launch-Material gepostet

### Story 4.2: Security-Hardening (TLS, CSP, Headers, CrowdSec)

As a Bürger,
I want eine sicher konfigurierte Site mit TLS 1.3, Strict-CSP, restriktiven HTTP-Headers und CrowdSec-Layer-7-Schutz,
So that meine Verbindung verschlüsselt ist und die Site Angriffsvektoren defensiv abwehrt.

**Acceptance Criteria:**

**Given** Traefik
**When** ich TLS 1.3 forced + TLS 1.2 als Fallback + ältere Protokolle deaktiviert konfiguriere
**Then** TLS-Test (z.B. SSL Labs) zeigt A+ Rating (NFR-S1)

**Given** Traefik
**When** ich Let's Encrypt via DNS-Challenge mit Auto-Renewal konfiguriere
**Then** Zertifikat-Lücke < 24h (NFR-S2)

**Given** SvelteKit `hooks.server.ts`
**When** ich Strict Content-Security-Policy ohne `unsafe-inline`, ohne externe Script-/Style-Quellen außer self-hosted Plex-Fonts und Glyph-Pack implementiere
**Then** CSP wird per Response-Header gesetzt (NFR-S3)
**And** `connect-src`-Whitelist enumeriert OpenFreeMap-Tiles, Nominatim-Public, FIS-Broker (Build-Time only)

**Given** Traefik
**When** ich HTTP-Security-Header injiziere: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, defensive `Permissions-Policy` (geolocation/camera/microphone disabled)
**Then** alle Responses tragen die Security-Header (NFR-S4)

**Given** Traefik
**When** ich CrowdSec-Plugin im Streaming-Mode mit 60s Decision-Sync und Collections (`crowdsecurity/traefik`, `crowdsecurity/http-cve`, `crowdsecurity/whitelist-good-actors`, `crowdsecurity/base-http-scenarios`, `crowdsecurity/sshd`, `crowdsecurity/linux`) installiere
**Then** Layer-7-Schutz aktiv mit Captcha-Remediation als Default statt Hard-Ban (NFR-S5)
**And** AppSec/WAF-Funktion (Plugin 1.2.0+) einschaltbar bei Bedarf

**Given** Hetzner
**When** ich Layer-3/4-DDoS-Schutz aktiviere (kostenlos, ohne weitere Konfiguration)
**Then** DDoS-Basisschutz aktiv (NFR-S6)

**Given** Traefik-Access-Logs
**When** ich IP-Pseudonymisierung (letztes Oktett gekürzt) und 7d-Rotation konfiguriere
**Then** keine personenbezogenen Daten in Logs (NFR-PR4)

**Given** der Postgres-Service (Story 4.1)
**When** ich Postgres-Network-Hardening verifiziere: kein Public-Port (kein `5432`-Expose nach außen), nur Internal-Docker-Network, App-User mit eingeschränkten Privilegien (kein SUPERUSER), keine `trust`-Auth in `pg_hba.conf`, `scram-sha-256` als Auth-Method
**Then** Postgres ist nur intern erreichbar
**And** kein Postgres-Port in `nmap`-Scan von außen sichtbar

**Given** der Postgres pg_dump-Backup-Output (Story 4.1)
**When** ich pg_dump-Files via GPG-Symmetric mit Passphrase aus Coolify-Env-Var verschlüssele bevor Off-Server-Replikation
**Then** Backup-Files sind at-rest verschlüsselt, Off-Server-Storage-Compromise leakt keine Daten

### Story 4.3: GitHub-Actions-CI mit 8 Gates + Lefthook

As a Code-Author,
I want eine CI-Pipeline mit allen 8 Gates die PRs und main-Pushs validiert,
So that keine Drift bei Performance, A11y, Bundle-Size, Cookies oder US-Drittanbietern unbemerkt durchrutscht.

**Acceptance Criteria:**

**Given** das GitHub-Repository
**When** ich `.github/workflows/ci.yml` mit folgender Pipeline implementiere (inkl. Postgres-17-Service-Container für Aggregat-Build):
1. checkout + `pnpm install --frozen-lockfile`
2. **services**: Postgres 17 als CI-Service-Container (port 5432, ephemeral DB pro Run, no PostGIS needed)
3. lint (ESLint + Prettier --check) — NFR-M4
4. typecheck (`svelte-check` strict) — NFR-M3
5. unit-test (vitest --run --coverage ≥80%) — NFR-M5
6. **db:migrate** (Drizzle-Migrations gegen CI-Postgres) — Epic 2 Story 2.0
7. **data:aggregate** (`pnpm fetch` + `pnpm data:aggregate`) — Epic 2 Story 2.0
8. build (`pnpm build`) — NFR-I1, NFR-M1
9. e2e (playwright + `@axe-core/playwright`, 0 Violations) — NFR-A1
10. lighthouse-ci (`@lhci/cli`, Performance ≥90, A11y ≥95, SEO ≥95, Best Practices ≥95) — NFR-P7, NFR-P8, NFR-A3
11. bundle-size-check (size-limit, Initial-JS ≤200KB gzipped) — NFR-P5
12. us-domain-allowlist-check (Build-Asset-URLs gegen Allowlist) — NFR-S7
13. cookie-leak-check (Response-Header-Test gegen `Set-Cookie`) — NFR-PR1
14. i18n-coverage-check (DE/EN-Bundle-Diff, Epic 3 Story 3.2)
**Then** PR-Build schlägt fehl bei jeder Verletzung
**And** Compiler-A11y-Warnings als ESLint-Errors via `eslint-plugin-svelte` (UX-DR-A11y-Test)

**Given** die CI-Pipeline
**When** ich `.github/workflows/deploy.yml` für Coolify-Webhook auf main-Branch implementiere
**Then** Deploy nur nach erfolgreichem main-Branch-Build

**Given** Lefthook installiert
**When** ich `lefthook.yml` mit Pre-Commit-Hooks (Lint, Format, Typecheck) konfiguriere
**Then** lokale Pre-Commit-Validation vor Push, vermeidet CI-Round-Trip für triviale Fehler

**Given** SvelteKit-Konfiguration
**When** ich `lighthouserc.cjs` mit Schwellen Performance ≥ 90, A11y ≥ 95, SEO ≥ 95, Best Practices ≥ 95 konfiguriere
**Then** Lighthouse-CI prüft alle Top-Routes als Gate

**Given** Vite + size-limit
**When** ich Initial-JS-Bundle gegen 200KB-gzipped-Limit prüfe (inkl. Vite `manualChunks` für MapLibre/LayerChart/Turf in eigene Async-Chunks)
**Then** PR-Build schlägt fehl bei Überschreitung (NFR-P5)

### Story 4.4: ADR-Nachzieher + fehlende Disaster-Recovery-Runbooks

As a future Maintainer / recruiter-readable Audience,
I want das ADR-Verzeichnis um drei nachzuziehende Decisions erweitern (Postgres-Hybrid, i18n-Scope-Reduce, Hetzner-CPX22) und die fünf fehlenden Disaster-Recovery-Runbooks vervollständigen,
So that das Projekt selbsterklärend bleibt und alle kritischen Operations bei Bedarf ausführbar sind.

**Acceptance Criteria:**

**Given** das bestehende `docs/adr/`-Verzeichnis mit ADR-000-template + ADR-001 bis ADR-012 (alle bereits implementiert in Epic 1)
**When** ich verifiziere dass alle 13 vorhandenen ADRs den Standard-Template-Stand entsprechen (Title/Status/Context/Decision/Consequences/Alternatives)
**Then** ADR-Bestand ist konsistent (NFR-M2, NFR-M6)

**Given** der Postgres-Hybrid-Lock 2026-05-15 (Postgres in Epic 2 als Aggregat-Cache statt Phase-2-Deferral)
**When** ich `ADR-013-postgres-hybrid-architecture.md` mit Status: Accepted, Context (Cross-Layer-Aggregate brauchen DB), Decision (Postgres als Build-Zeit-Cache, Static GeoJSON bleibt Source-of-Truth für Geo), Consequences (Drizzle-Schema, Coolify-Service, pg_dump-Backup), Alternatives (All-Postgres verworfen) anlege
**Then** ADR-013 dokumentiert Postgres-Hybrid (NFR-M2)

**Given** ADR-003-postgres-deferral existiert
**When** ich ADR-003 Status auf „Superseded by ADR-013" updates und Cross-Link einfüge
**Then** ADR-Historie bleibt nachvollziehbar ohne Widerspruch

**Given** der i18n-Scope-Reduce-Lock 2026-05-15 (8 Sprachen → de/en für Phase 1)
**When** ich `ADR-014-i18n-scope-reduce-de-en.md` mit Status: Accepted, Context (Solo-Maintainer-Kapazität, Übersetzungs-Quality-Sicherung), Decision (Phase 1 nur de+en, Future-Epic für 6+ Sprachen + RTL), Consequences (Inlang-Settings reduziert, Bundles gelöscht), Alternatives (8 Sprachen mit Auto-Translate ohne Polish verworfen) anlege
**Then** ADR-014 dokumentiert i18n-Scope (NFR-M2)

**Given** der Hetzner-Server-Wahl 2026-05-15 (CX32 ARM → CPX22 AMD)
**When** ich `ADR-015-hetzner-cpx22-amd.md` mit Status: Accepted, Context (Hetzner-AMD-only-Verfügbarkeit per UI 2026-05, EUR 9,51/Monat-Budget, Postgres-Co-Host-Anforderung), Decision (CPX22 8GB/2vCPU/80GB), Consequences (ausreichend für Phase 1 + Hybrid-Postgres mit 1.5-2GB Headroom, fliege-dev separat), Alternatives (CPX32 EUR 16,65 als Komfort-Variante, CX32 ARM verworfen wegen AMD-only-Verfügbarkeit) anlege
**Then** ADR-015 dokumentiert Server-Wahl (NFR-M2)

**Given** das `docs/runbooks/`-Verzeichnis mit 3 bereits vorhandenen Runbooks (`tile-provider-switch.md`, `a11y-smoke-test.md`, `bookmark-storage.md`)
**When** ich die fehlenden Runbooks mit Schritt-für-Schritt-Befehlen erstelle:
- `crowdsec-whitelist.md` (False-Positive-Recovery: Decision-ID lookup, Whitelist-YAML editieren, Reload)
- `data-source-failure.md` (FIS-Broker/ODIS/DWD-Ausfall: Cached-MANIFEST.json fallback, Stale-Banner aktivieren, Manueller Re-Fetch)
- `geocode-rate-limit-hit.md` (Nominatim-Rate-Limit-Recovery: User-Agent prüfen, alternativen Geocoder-Provider aktivieren, LRU-Cache-Hit-Rate erhöhen)
- `postgres-restore.md` (NEU: pg_dump-Restore-Pfad, GPG-Decrypt, Drizzle-Migration-Stand verifizieren, App-Restart)
- `drizzle-migration-rollback.md` (NEU: fehlerhafte Migration zurückrollen, Schema-Snapshot wiederherstellen, Coolify-Re-Deploy)
**Then** Disaster-Recovery ist ausführbar (NFR-R6)

**Given** das Public-GitHub-Repository
**When** ich README.md (recruiter-readable, Stack-Showcase mit Postgres-Hybrid + Kiez-Score erwähnt) und `ARCHITECTURE.md` und MIT-LICENSE prüfe und ergänze
**Then** Repo ist als Open-Source-Artefakt strukturiert (NFR-M2)

### Story 4.5: Lizenzen-Page EN-Variante + Auto-Gen-Coverage-Test

As a englisch-sprechender Datenjournalist / Editor,
I want die bestehende Lizenzen-Page (DE bereits implementiert in Story 4.5-Vorzug, commit `1e71180`) auch auf Englisch verfügbar mit verifizierter Auto-Generation aus `MANIFEST.json`,
So that EN-Nutzer Lizenz-Hierarchie verstehen und keine hardcoded License-Strings im Code drift bringen.

**Acceptance Criteria:**

**Given** die bestehende DE-Lizenzen-Page in `routes/(with-header)/lizenzen/+page.svelte` (Story 4.5-Vorzug)
**When** ich verifiziere dass alle License-Strings, Quellen-Hinweise und Layer-Metadaten ausschließlich aus `static/layers/MANIFEST.json` stammen (keine Hardcoded-Fallbacks im Komponenten-Code)
**Then** Coverage-Test `routes/(with-header)/lizenzen/page.server.test.ts` schlägt fehl wenn ein License-String hardcoded auftaucht (FR54, NFR-I5)

**Given** die DE-Page als Referenz
**When** ich EN-Variante via Epic-3-Translation-Workflow (Story 3.5) erzeuge: UI-Strings (Heading „Licenses", Section-Headers, Disclaimer) in `messages/en.json`, License-Type-Beschreibungen in `src/lib/data/license-content/{type}.en.json` (`dl-de/zero`, `dl-de/by`, `cc-by`, `cc-by-sa`, `odbl`)
**Then** `/en/lizenzen` rendert vollständig englisch mit gleicher MANIFEST-Datenquelle

**Given** die Lizenz-Hierarchie
**When** Page (DE und EN) rendert
**Then** korrekte Attribution für alle Lizenz-Typen erscheint:
- `dl-de/zero-2-0` (CC0-äquivalent) — keine Pflicht, im Footer als Höflichkeit
- `dl-de/by-2-0` — „Geoportal Berlin / [Titel]" verpflichtend
- CC BY 3.0 DE / CC BY 4.0 — Attribution + Lizenz-Link
- ODbL 1.0 (OSM) — „© OpenStreetMap-Mitwirkende" + Link
- CC-BY-SA 3.0/4.0 (Wikipedia) — Quellen-Link

**Given** das `SiteHeader`/`MetaFooter`-Skeleton (existiert)
**When** ich verifiziere dass `license-footer.svelte`-Komponente (oder äquivalent) Lizenz-Übersicht mit Link auf `/lizenzen` integriert
**Then** Lizenz-Hinweis ist auf jeder Page erreichbar (FR54, NFR-I5)

**Given** die Lizenzen-Page
**When** sie in DE + EN prerendered wird
**Then** 2 lokalisierte Versionen verfügbar mit hreflang-Cluster (Story 3.3)

### Story 4.6: Compliance-Pages (Impressum + Datenschutz + Barrierefreiheit) DE+EN

As a Bürger und Behörde,
I want gesetzlich vorgeschriebene Compliance-Pages (Impressum nach §5 TMG, Datenschutz nach DSGVO Art. 13, Barrierefreiheit nach BFSG §16) in DE und EN,
So that rechtliche Pflichten erfüllt sind und Compliance-Showcase glaubwürdig steht.

**Acceptance Criteria:**

**Given** die Compliance-Anforderungen
**When** ich `routes/(with-header)/impressum/+page.svelte` mit §5-TMG-Pflichtangaben (persönliche Attribution „Matze Schmidbauer", Kontakt-E-Mail, Verantwortlicher) implementiere und prerendere
**Then** Impressum erreichbar in DE + EN (NFR-PR7, UX-DR54)

**Given** die DSGVO-Anforderungen und der Postgres-Hybrid (Story 2.0)
**When** ich `routes/(with-header)/datenschutz/+page.svelte` mit DSGVO-Art-13-Pflichtangaben + Cookieless-Statement („diese Site speichert keinerlei personenbezogene Daten") + Postgres-Erklärung („Postgres dient Build-Zeit-Aggregation öffentlicher Geo-Daten, enthält keine personenbezogenen Daten zur Laufzeit") + Translation-Disclaimer implementiere
**Then** Datenschutz-Page erreichbar in DE + EN (NFR-PR6, UX-DR53)
**And** Translation-Quality-Disclaimer „Übersetzungen maschinell erstellt, manuell gegengelesen" enthalten

**Given** BFSG §16
**When** ich `routes/(with-header)/barrierefreiheit/+page.svelte` mit Konformitäts-Erklärung (WCAG 2.2 AA komplett, AAA wo möglich, Test-Methoden, axe-core in CI, manuelle NVDA/VoiceOver-Smoke-Tests aus Runbook `a11y-smoke-test.md`, Mailto-Kontakt bei Hindernissen) implementiere
**Then** Accessibility-Page erreichbar in DE + EN (UX-DR52, NFR-A10)

**Given** der `SiteHeader` und `MetaFooter`
**When** ich BFSG-Konformität-Statement „BFSG-konform · WCAG 2.2 Level AA komplett, AAA wo möglich" einbinde
**Then** Statement attestierbar im Footer auf jeder Page (NFR-A10, UX-DR51)

**Given** alle Compliance-Pages
**When** ich Links im MetaFooter (Impressum · Datenschutz · Lizenzen · Architektur · Methodik · Barrierefreiheit · Kontakt + LanguageSwitcher) einbinde
**Then** Footer ist Always-Reachable auf jeder Page in DE + EN (FR55j, NFR-IL10)

### Story 4.7: Architektur-Page als EU-FOSS-Showcase DE+EN

As a mtc-Beratungs-Lead und persönliche Sichtbarkeit,
I want eine dedizierte `/architektur`-Page die EU-FOSS-Hosting-Stack erklärt (Hetzner CPX22 + Coolify + Traefik + CrowdSec + Postgres-Hybrid + cookieless + WebMCP + Kiez-Score-System),
So that Pitch-Decks und Konferenz-Talks die Site als praktischen Compliance-Showcase referenzieren können.

**Acceptance Criteria:**

**Given** die fertige Architektur
**When** ich `routes/(with-header)/architektur/+page.svelte` mit Plex-Serif h1, Lead-Absatz, Stack-Erklärung implementiere und prerendere — Stack-Komponenten enumeriert:
- Hosting: Hetzner-Frankfurt CPX22 (AMD), Coolify-Compose, Traefik mit Let's-Encrypt + CrowdSec
- Daten-Layer: Static GeoJSON (Source-of-Truth) + Postgres-Hybrid (Build-Zeit-Aggregat-Cache, kein Source-of-Truth)
- ORM: Drizzle (typesafe Schema + Migrations)
- App-Framework: SvelteKit + Svelte 5 Runes, TypeScript strict
- Karten: MapLibre + Plex-Cartography + OpenFreeMap-Tiles
- Compute: Kiez-Score + Bezirks-Score (Build-Zeit, dokumentierte Methodik)
- Discovery: WebMCP-Server (5 Tools + 2 Resources + 3 Prompts), llms.txt + llms-full.txt
- CI/CD: GitHub Actions mit 14 Gates, Lefthook Pre-Commit
- Compliance: cookieless-by-default, kein US-Drittanbieter, BFSG-konform
**Then** Architektur-Page erreichbar in DE + EN mit hreflang-Cluster (UX-DR56)

**Given** die Page
**When** ich auf alle Stack-Komponenten zu Quell-Repos und Dokumentation verlinke (Hetzner, Coolify, Traefik, CrowdSec, Postgres, Drizzle, SvelteKit, MapLibre, IBM Plex, OpenFreeMap, FIS-Broker, ODIS, DWD CDC, WebMCP)
**Then** Page funktioniert als Lebenslauf-Asset und Konferenz-Talk-Material

**Given** das `SiteHeader`/`MetaFooter`
**When** ich persönliche Attribution „von Matze Schmidbauer" mit Link auf LinkedIn/persönliches Profil im MetaFooter einbinde
**Then** Owner-Modell sichtbar (PRD-Anforderung Owner-Attribution)

**Given** die Architektur-Page
**When** ich JSON-LD `WebSite`-Schema mit `SearchAction` (Adress-Suche) und `BreadcrumbList` einbinde
**Then** Page ist als Showcase strukturiert auffindbar (FR36)

### Epic 4 Status

7 Stories total: 4.1 Hetzner CPX22 + Coolify + Traefik + Postgres Production-Setup, 4.2 Security-Hardening (TLS, CSP, Headers, CrowdSec, Postgres-Network), 4.3 GitHub-Actions-CI mit 14 Gates + Lefthook (inkl. Postgres-Service-Container und data:aggregate-Step), 4.4 ADR-Nachzieher (013/014/015) + 5 fehlende Runbooks, 4.5 Lizenzen-Page EN-Variante + Auto-Gen-Coverage-Test (DE bereits implementiert), 4.6 Compliance-Pages DE+EN (Impressum + Datenschutz mit Postgres-Erklärung + Barrierefreiheit), 4.7 Architektur-Page DE+EN als EU-FOSS-Showcase (mit Postgres-Hybrid + Kiez-Score-System).

NFRs vollständig abgedeckt: NFR-S1–S8 (Security inkl. Postgres-Network-Hardening), NFR-PR1–PR7 (Privacy + Postgres-Build-Zeit-only-Disclosure), NFR-R1–R6 (Reliability inkl. pg_dump-Backup + Postgres-Restore-Runbook), NFR-M1–M8 (Maintainability), CI-Gates für NFR-P5/P7/P8 + NFR-A1/A3/A10. FR54 (Lizenz-Footer auto-gen, DE bereits implementiert) und UX-DR51–UX-DR56 (Compliance-Pages) implementiert.

Sequencing (User-Lock-Revision 2026-05-15-PM): **Story 4.1 wandert vor**, Trigger nach Epic 2 Story 2.0 (Postgres-Foundation existiert). Begründung: Coolify+Traefik+CrowdSec+Postgres-Network-Hardening sind 4 bewegliche Teile — alle parallel debug'en zum Hard-Launch ist Risiko-Spike. Früh-Deploy mit Coming-Soon-Skelett (Phase 1) reduziert Risiko + claim't Domain-Footprint früh. Cost ~9,51€/Monat × ~3 Monate Pre-Launch = ~30€, vernachlässigbar.

Drei Deployment-Phasen:
1. **Phase 1 Coming-Soon** (nach Epic 2 Story 2.0 + Story 4.1 + 4.2): Brand-Skelett, robots Disallow, noindex-Meta, /healthz-Probe live
2. **Phase 2 Soft-Production / Closed-Beta** (nach Epic 2 + Epic 3 komplett + Epic 4 Stories 4.3-4.7): Beta-Banner, noindex bleibt, Friends-and-Family-Pfad
3. **Phase 3 Hard-Production / Launch** (nach Epic 5 Story 5.1-5.4): noindex weg, Sitemap-Submit, Beta-Banner weg, Hard-Launch (Epic 5 Story 5.3)

Stories 4.5/4.6/4.7 abhängig von Epic 3 Stories 3.2 (EN-Coverage) + 3.5 (Translation-Workflow). Story 4.3 (CI) abhängig von Epic 2 Story 2.0 (Postgres-Schema vorhanden für CI-Service-Container).

Coolify-Postgres-Service-Setup + Backup wird Teil der Story 4.1 (statt parallel als ungetrackte Infra-Hand-Arbeit wie ursprünglich für Epic 2 vermerkt) — Server existiert dann sowieso wegen Story 4.1-Vorzug.

## Epic 5: Distribution + Pflege + Owner-Realisation

Site geht produktiv online mit dokumentierter Update-Cadence pro Datenquelle, finalem Brand-Asset-Pack, getriggertem Launch in Civic-Tech- und LinkedIn-Channels, externem Uptime-Monitoring (EU-FOSS-konform), durchgeführtem Backup-Restore-Drill, GDPR-DPIA-Dokument als Beratungs-Asset und Sitemap-Submission zu Search Engines. Owner-Hebel (#1 persönliche Sichtbarkeit, #2 mtc-Beratungslinie, #3 langfristige Brand) sind operationalisiert, nicht nur konzipiert.

### Story 5.1: Update-Cadence-ADR + GitHub-Actions-Schedule pro Datenquelle

As a Solo-Maintainer,
I want eine codifizierte Update-Cadence pro Datenquelle als ADR-016 + GitHub-Actions-Schedule-Cron,
So that Site-Daten nicht ungemerkt veralten und Refresh-Verantwortung nicht im Kopf hängenbleibt.

**Acceptance Criteria:**

**Given** die 35 Static-GeoJSON-Layer aus Epic 1 + Epic 2 Aggregat-Pipeline
**When** ich `ADR-016-update-cadence.md` mit Status: Accepted, Context (jede Datenquelle hat eigene Refresh-Logik), Decision (pro Quelle Cadence-Tabelle), Consequences (automatisierte Cron-Jobs statt Manual-Refresh) anlege
**Then** Cadence-Matrix dokumentiert: DWD-Klima jährlich (Februar), BRW alle 2 Jahre (Stichtag-Q1), Mietspiegel-Wohnlagen alle 4 Jahre, Stolpersteine täglich (OSM-Overpass-Sync), LOR/Bezirke ad-hoc bei Reform, OEPNV-Stops monatlich, alle weiteren Layer mit konkretem Trigger

**Given** die Cadence-Matrix
**When** ich `.github/workflows/data-refresh-{quelle}.yml`-Workflows pro Cadence implementiere mit `schedule:`-Cron-Trigger und Auto-PR-Erstellung bei Daten-Diff
**Then** Refresh läuft automatisch, ich review nur PRs

**Given** die Refresh-PRs
**When** Diff zu groß ist (z.B. >20% Feature-Loss in einem Layer)
**Then** Workflow setzt PR auf `data-refresh:requires-review`-Label und blockt Auto-Merge
**And** Lefthook-Pre-Commit-Hook prüft `MANIFEST.json`-Update bei manuellen Daten-Pushs

**Given** die Aggregat-Pipeline (Epic 2 Story 2.0)
**When** Datenquelle refresht wird
**Then** `pnpm data:aggregate` als Folge-Step ausgeführt + Postgres-Aggregate aktualisiert + Snapshot-Tests prüfen ob Score-Werte plausibel bleiben (kein >10% Sprung pro Bezirk ohne Begründung)

### Story 5.2: Brand-Asset-Pack + Press-Kit

As a Owner mit Hebel-Ambition (Sichtbarkeit + mtc-Beratung + Brand),
I want einen finalen Brand-Asset-Pack mit Logo, Wortmarke, Default-OG, Press-Kit-PDF und LinkedIn-Banner,
So that ich konsistent über Channels kommunizieren und Material auf Anfrage liefern kann.

**Acceptance Criteria:**

**Given** das bestehende `_dev/logo` und `_dev/wortmarke` aus Epic 1
**When** ich finale Versionen in `static/brand/` ablege: `logo.svg` (mit Light/Dark-Variants), `wortmarke.svg`, `og-default.png` (1200×630, mit Plex-Schrift, Berlin-Karten-Backdrop), `favicon.svg` + `favicon-32.png` + `apple-touch-icon.png`
**Then** alle Brand-Assets sind ein-Quelle-of-Truth in `static/brand/`

**Given** der Brand-Asset-Pack
**When** ich `static/press-kit.zip` mit allen Logo-Varianten + 1-Pager-PDF (Site-Beschreibung, USP, Tech-Stack, Owner-Bio, Contact) bündle
**Then** Press-Anfragen werden mit Link beantwortbar

**Given** Owner-Bio
**When** ich `docs/owner-bio.md` (DE+EN) mit kurzer und langer Variante (50 Wörter / 200 Wörter) anlege inkl. LinkedIn-URL und Profil-Foto-Quelle
**Then** Bio ist re-usable für Channels

**Given** LinkedIn-Banner
**When** ich `static/brand/linkedin-banner.png` (1584×396) im konsistenten Plex-Cartography-Stil generiere
**Then** Owner-Profil hat visuell konsistenten Auftritt

**Given** alle Assets
**When** ich `routes/(with-header)/presse/+page.svelte` als öffentliche Press-Page implementiere und prerendere
**Then** Press-Material ist auch ohne ZIP-Download erreichbar (FR-relevant für Hebel #1 + #2)

### Story 5.3: Launch-Sequencing-Plan + Channel-Material

As a Owner mit knappem Aufmerksamkeits-Budget,
I want einen 2-Phasen-Launch (Soft + Hard) mit pro Channel vorbereitetem Material,
So that ich nicht in Launch-Improvisation falle und Reactions-Resonanz strukturiert abgrasen kann.

**Acceptance Criteria:**

**Given** die Site-Production-Live (Epic 4 abgeschlossen)
**When** ich `docs/launch-plan.md` mit T+0 / T+14d / T+30d-Schedule anlege
**Then** Launch-Sequencing ist dokumentiert:
- T+0 Soft-Launch: Civic-Tech-Slack (Code-for-Berlin), Mastodon (#civictech, #berlin), Friends&Family-DM
- T+14d Hard-Launch: LinkedIn-Post (Owner-Profil + Tag mtc.berlin), Newsletter (wenn vorhanden), Mastodon-Boost
- T+30d Bilanz: anekdotische Resonanz dokumentiert in `docs/launch-resonance.md`, Lessons-Learned

**Given** der Plan
**When** ich pro Channel ein Material-Asset vorbereite (Slack-Post-Markdown, Mastodon-Thread max 4 Toots, LinkedIn-Long-Form-Draft mit OG-Image, optional Newsletter-HTML)
**Then** Material liegt in `_user-input/launch-material/` bereit

**Given** Hebel-#2-Realisation (mtc-Beratungslinie)
**When** ich LinkedIn-Long-Form-Draft so schneide dass Compliance-Showcase-Aspekt (cookieless, EU-FOSS, GDPR-DPIA) prominent steht
**Then** Hebel #2 wird operationalisiert ohne Persona-mtc-Trennung zu zerreißen

**Given** Launch-Day
**When** Soft-Launch-Slot ausgelöst wird
**Then** alle Material-Assets werden manuell gepostet (kein Auto-Publish, weil Resonanz-Reaktion individuell sein soll)

### Story 5.4: Post-Launch-Monitoring (EU-FOSS, kostenlos)

As a Solo-Maintainer ohne Tracking + ohne Plausible/Matomo,
I want externes Uptime-Monitoring das mich bei Down-Events alert ohne Cookies oder personenbezogene Daten zu setzen,
So that Site-Decay nicht ungemerkt passiert und ich Reaktions-Latenz auf Stunden statt Tage halte.

**Acceptance Criteria:**

**Given** die Production-Site auf Hetzner-CPX22 (Epic 4)
**When** ich UptimeRobot (kostenloser Plan, 50 Monitor-Slots, 5-Min-Intervall) oder healthchecks.io (FOSS, EU-Hosted-Option) konfiguriere für `/healthz`-Endpoint und Root-Page-200-Check
**Then** externes Monitoring aktiv

**Given** das Monitoring
**When** Down-Event detected wird
**Then** Webhook-Notifier in Coolify schickt Email an Owner (oder Telegram/Matrix-Notification) mit Decision-ID + Restart-Hinweis
**And** Notifier-Pfad ist im Disaster-Recovery-Runbook (Story 4.4 `data-source-failure.md`-Erweiterung) dokumentiert

**Given** keine Plausible/Matomo-Tracking
**When** ich nach Launch grobe Resonanz-Indikatoren brauche
**Then** Hetzner-Stats (Bandbreite + Container-CPU) im Coolify-Dashboard reichen für anekdotische Auswertung
**And** keine personenbezogenen Daten in Logs (NFR-PR1, NFR-PR4)

**Given** EU-FOSS-Linie
**When** ich Monitor-Anbieter wähle
**Then** UptimeRobot ist akzeptabel weil Server-zu-Server-Pings keine User-Daten betreffen, healthchecks.io vorzuziehen wenn EU-Hosting verfügbar

### Story 5.5: Backup-Restore-Drill auf Staging

As a Solo-Maintainer,
I want einen echten Backup-Restore-Drill auf Staging-Postgres durchführen und das Runbook validieren,
So that Disaster-Recovery nicht nur theoretisch dokumentiert ist sondern unter Druck funktioniert.

**Acceptance Criteria:**

**Given** der `postgres-restore.md`-Runbook (Story 4.4) und ein pg_dump-Backup-Sample
**When** ich auf einer separaten Staging-DB (Coolify-Service oder lokal) den Restore-Pfad komplett ausführe (pg_dump-Decrypt → Drop → Create → Restore → Migration-Stand verifizieren → App-Connect-Test)
**Then** Drill abgeschlossen mit dokumentierter Zeit-bis-Wiederherstellung (Ziel: <30 Min)

**Given** der Drill-Output
**When** Runbook-Schritte unklar oder fehlerhaft waren
**Then** Runbook-Update als PR-Diff committet
**And** Drill-Ergebnis in `docs/runbooks/restore-drill-{date}.md` archiviert

**Given** Drill-Wiederholung
**When** ich nach 6 Monaten erneut ausführe
**Then** Cadence dokumentiert in Story 5.1 ADR-016 (Halbjahres-Drill)

### Story 5.6: GDPR-DPIA-Dokument als Beratungs-Asset

As a Bürger mit Datenschutz-Sensibilität und Owner mit Hebel-#2-Ambition (mtc-Beratung),
I want eine Datenschutz-Folgenabschätzung nach DSGVO Art 35 als öffentlich einsehbares Dokument,
So that Compliance-Showcase belastbar ist und mtc-Beratungslinie ein konkretes Asset zum Zeigen hat.

**Acceptance Criteria:**

**Given** die cookieless + Postgres-Build-Zeit-only-Architektur (Epic 1-4)
**When** ich `routes/(with-header)/datenschutz/folgenabschaetzung/+page.svelte` als prerenderte DPIA-Page implementiere mit Sektionen:
- Verarbeitungs-Beschreibung (Adress-Lookup, Geo-Visualisierung, statische Aggregat-Daten)
- Notwendigkeits-/Verhältnismäßigkeits-Bewertung (kein Tracking, kein UGC, kein Auth)
- Risiken für Betroffenen-Rechte (sehr niedrig wegen cookieless + keine PII)
- Abhilfe-Maßnahmen (Strict-CSP, IP-Pseudonymisierung, kein Set-Cookie, Postgres-Internal-Network)
- Restrisiko-Bewertung
- Verantwortlicher (Matze Schmidbauer, Kontakt)
**Then** DPIA ist DE+EN verfügbar (NFR-PR6)

**Given** Hebel-#2-Realisation
**When** ich DPIA als PDF-Export `static/dpia.pdf` (mit gleichem Inhalt) generiere
**Then** Press/Beratungsanfragen können DPIA als Asset zitieren

**Given** der MetaFooter
**When** ich Datenschutz-Folgenabschätzung-Link unter „Datenschutz" einbinde
**Then** DPIA ist auffindbar ohne Suche

### Story 5.7: Sitemap-Submission + Search-Console-Setup

As a SEO-Hoffender mit ~400 prerenderten Routes,
I want Sitemap aktiv zu Google + Bing submitted und Index-Status monitorbar,
So that Long-Tail-Suchanfragen Chancen kriegen die Routes zu finden.

**Acceptance Criteria:**

**Given** die Sitemap.xml + 2 Per-Sprache-Sitemaps (Epic 2 Story 2.1)
**When** ich Google Search Console für `navigator.berlin` einrichte (DNS-TXT-Verifizierung) und Sitemap submitte
**Then** Google-Indexing aktiv mit `sitemap-de.xml` + `sitemap-en.xml` als Quelle

**Given** Bing Webmaster Tools
**When** ich gleichen Setup-Pfad für Bing einrichte
**Then** Bing-Indexing aktiv

**Given** der hreflang-Cluster (Epic 3 Story 3.3)
**When** ich Search-Console-hreflang-Validation-Tool laufen lasse
**Then** keine Cluster-Fehler („no return tag", „missing x-default")

**Given** Index-Status
**When** ich monatlich (Cadence-Story 5.1) Search-Console-Coverage-Report prüfe
**Then** Index-Lücken dokumentiert
**And** bei systematischen Lücken: Investigation-Task in `_user-input/seo-issues.md`

**Given** robots.txt (Epic 2 Story 2.1)
**When** ich verifiziere dass `Allow: /` + Sitemap-Verweis korrekt
**Then** keine restriktiven Disallows blocken Indexing

### Story 5.8: Public-Update-Skill (Manual-Trigger Changelog-Draft-Generator)

As a Solo-Maintainer / Site-Owner,
I want einen manuellen Claude-Code-Skill `/publish-update` der aus einem Commit-Range Draft-Entries für `/updates` generiert ohne Internals (Env-Vars, Server-Hostnames, interne Tooling-Namen) zu leaken,
So that ich Changelog-Disziplin auf der `/updates`-Route halte ohne manuelle Markdown-Datei-Disziplin gegenüber Story 2.13 zu pflegen, und vor jedem Public-Release ein Editorial-Gate steht.

**Scope-Lock (User-Decision 2026-05-16, Mary-Konsultation):** Eigener Skill, separat vom Auto-Doc-Skill Story 7.1 (verschiedene Trust-Levels). Manual-Trigger only Phase 1, Auto-Hook Phase 2 nach 4-6 Wochen Stabilität. DE-only Output (Phase 1 i18n-Lock). One-Commit = One-Draft, kein Aggregation. Output landet ausschließlich in `_content/updates/_drafts/` (`.gitignore`d). Editorial-Gate via manuelle `git mv`-Promote.

**Acceptance Criteria (Kurz-Summary, vollständige Spec in `_bmad-output/implementation-artifacts/5-8-public-update-skill.md`):**

**Given** Claude-Code-Skill-Konvention
**When** ich `.claude/skills/publish-update/SKILL.md` mit Frontmatter (`name: publish-update`, `description`) + Body (Preflight + Argument-Parsing + Subagent-Call-Anweisung) anlege
**Then** Skill triggert via `/publish-update <commit-range>` oder `--since=YYYY-MM-DD` oder `--commit=<sha>`

**Given** Argument-Parser
**When** `scripts/publish-update/resolve-commit-range.ts` läuft
**Then** Range, Since, Single-Commit, Default (24h) werden zu SHA-Liste resolved
**And** invalid-SHA wird klar gemeldet

**Given** Allowlist-Filter + Denylist-Override + Mixed-Commit-Schutz
**When** `scripts/publish-update/filter-commit.ts` läuft
**Then** nur Commits mit Files in Allowlist (`src/routes/`, `src/lib/components/`, `src/lib/data/`, `src/lib/seo/`, `src/lib/content/`, `static/layers/MANIFEST.json`, `_content/`) und ohne Denylist-Files (`.env*`, `lefthook.yml`, `coolify.*`, `docker-compose.*`, `docs/recovery/`, `docs/adr/`, `.github/workflows/`, `scripts/lib/sources.ts`, `_bmad-output/`, `_bmad/`, `.claude/skills/`) gelten als public-relevant
**And** Mixed-Commit (sowohl Allowlist als auch Denylist) wird zu Owner-Split-Hinweis abgelehnt

**Given** Subagent-Call via `claude --print --append-system-prompt`
**When** Skill `scripts/publish-update/system-prompt.txt` mit 6 Constraints (kein-Internals, 5-Category-Lock, DE-Brand-Tone, Forbidden-Tokens-Body, 200-800-Wort-Body, strict-JSON-Output) übergibt
**Then** Subagent liefert `{ kind: 'skip' | 'draft', category, title_de, summary_de, tags, body }` validiert gegen Valibot-Schema
**And** Output-Frontmatter wird durch `parseFrontmatter()` aus `src/lib/content/updates/frontmatter-schema.ts` (Story 2.13 Schema-Reuse) gefiltert

**Given** Forbidden-Token-Lint als Defense-in-Depth
**When** `scripts/publish-update/forbidden-tokens.ts` über Body läuft
**Then** Verstöße gegen em-dash (U+2014), „Lebenswert"-Lemma, Env-Var-UPPER-Names, Hetzner/CPX, Coolify, Lefthook, Traefik, CrowdSec, DATABASE_URL, Docker, Commit-SHAs (7-40 hex), Mietpreis-€/m², absolute-FS-Paths werden zeilen-genau gemeldet

**Given** Draft-Datei-Schreiben atomic
**When** `scripts/publish-update/write-draft.ts` läuft
**Then** Output landet als `_content/updates/_drafts/{commit-date}-{slug}.md` mit deterministic-slugify + Kollisions-Suffix kurz-sha-6
**And** bei Lint-Verstoß: `_FAIL_`-Präfix + Markdown-Header mit Verstoß-Liste

**Given** Editorial-Gate-Pflicht
**When** Owner Drafts reviewt
**Then** Promote via `git mv _content/updates/_drafts/<file>.md _content/updates/<file>.md` (manuelle Handlung, kein Auto-Commit)
**And** `_content/updates/_drafts/.gitignore` enthält `*` + `!.gitignore` (Drafts NICHT versioniert)

**Given** TDD-Pflicht ADR-012
**When** Implementation läuft
**Then** Test-First für 6 Pure-Functions (resolve-commit-range, filter-commit, forbidden-tokens, slugify, write-draft, draft-result-schema) + 1 Subagent-Wrapper (invoke-classifier mit Mock)
**And** Coverage ≥ 90% für `scripts/publish-update/`

**Given** Maintainer-Doku
**When** ich Doku schreibe
**Then** Neuer Runbook `docs/runbooks/publish-update-skill.md` mit Trigger + Review-Schritt + Anti-Patterns
**And** Update `docs/runbooks/add-update-entry.md` mit „Skill-Workflow-Alternative"-Section
**And** `scripts/publish-update/README.md` mit Allowlist-/Forbidden-Token-Pflege-Workflow

### Epic 5 Status

8 Stories total: 5.1 Update-Cadence-ADR + GitHub-Actions-Schedule pro Datenquelle, 5.2 Brand-Asset-Pack + Press-Kit, 5.3 Launch-Sequencing-Plan + Channel-Material, 5.4 Post-Launch-Monitoring (EU-FOSS, kostenlos), 5.5 Backup-Restore-Drill auf Staging, 5.6 GDPR-DPIA-Dokument als Beratungs-Asset, 5.7 Sitemap-Submission + Search-Console-Setup, 5.8 Public-Update-Skill (Manual-Trigger Changelog-Draft-Generator).

Keine direkten FRs, sondern Phase-1-Realisation-Layer für PRD-Sektionen „Sustainability/Project Discipline" und „Risk-Mitigation-Strategy" sowie Brief-Hebel-Logik. Story 5.8 (NEU 2026-05-16) ist Tooling-Hebel auf die in Story 2.13 etablierte `/updates`-Pipeline; reduziert Maintainer-Last für Changelog-Disziplin ohne Brand-Risk-Asymmetrie zu Auto-Doc-Skill Story 7.1.

Sequencing: Epic 5 startet erst nach Epic 4 (Production-Live). Story 5.1 sollte gleich am Anfang weil Cron-Setup künftiges Maintenance reduziert. Story 5.5 hard-blocked durch Epic 4 Story 4.1 (Postgres-Production existiert). Story 5.8 soft-blocked durch Story 2.13 (Schema-Source, done/review) und Story 5.1 (Cadence-Heuristik-Hint, ready-for-dev); NICHT abhängig von Epic 7 Story 7.1 (orthogonale Trust-Boundary, eigenes Output-Target).

**Bewusst NICHT enthalten** (User-Lock 2026-05-15): Bus-Faktor-/Sunset-Plan, Server-Log-Aggregate für Hebel-#1-Evidenz, Persona-Validierung mit echten Datenjournalisten, Plausible/Matomo-Tracking.

## Epic 6: Wahldaten + Cross-Layer-Story

**Rewrite 2026-05-18** nach Recon-Phase (Daten-Quellen + UX-Patterns + Scope-Reduce). Original-Epic siehe Git-History; Delta zum Original-Plan:

- **Volksentscheide gestrichen** (User-Decision 2026-05-18: nicht im Phase-1-Scope, ggf. Phase-2-Backlog).
- **Bezirksreform-2001-Mapping (alt 6-1) gestrichen** weil Daten-Cutoff jetzt 2011+ (post-Reform); ursprüngliches Mapping wurde durch echte Daten obsolet.
- **Chart-Type-Decision: horizontale Stacked-Bars statt Donuts** per UX-Recon (Datawrapper-Academy + NN/g + FT-Visual-Vocabulary: Längenvergleich schlägt Winkelvergleich bei Multi-Level + 5+ Parteien).
- **Level-Switch lokal in Wahl-Section, NICHT global im Inspector** (User-Decision 2026-05-18: globaler Multi-Level-Inspector-Redesign = Phase-2 Epic 8).
- **Wahlbezirks-Geometrien nur 2017+** (daten.berlin.de hat keine pre-2017-Geometrien; FragDenStaat-Request = Phase-2-Backlog).
- **Default-Level beim ersten Aufruf: Kiez (LOR)** weil statistisch stabil + matched Kiez-Score-Mental-Model.

Politik-interessierter Bürger und Datenjournalist sieht für jede Berliner Adresse die Wahlergebnisse der letzten Wahlen (BVV/AGH/BTW) als Stacked-Bar mit Top-5-Parteien + Sparkline + Wahlbeteiligung + Briefwahl-Marker im Inspektor-Panel. Level-Switch (Stimmbezirk/Kiez/Bezirk/Berlin) erlaubt Detail-Tiefe-Selektion innerhalb der Wahl-Section. Vergleich via inline Delta-Chips (`+4,2pp`). Pro Wahl existiert eine prerenderte Detail-Page mit Choropleth-Karte. Briefwahl-Asymmetrie als dezenter Badge + Confidence-Hairline. Cross-Layer-Story-Templates verknüpfen Wahlverhalten mit Wohnlage, Lärm, Soziale-Lage. LLM-Agents fragen Wahldaten via WebMCP-Tools ab.

**Daten-Cutoff:**

- BTW (Stimmbezirks-Level): 2013, 2017, 2021, 2025 (2009 nur PDF — verworfen)
- AGH: 2011, 2016, 2021, 2023 (Wiederholungswahl, `is_repeat_election`-Flag pflicht)
- BVV: 2011, 2016, 2021, 2023 (parallel zu AGH-Wahltagen)
- Volksentscheide: out-of-scope
- Wahlbezirks-Geometrien: 2017+ direkt, 2011/2013/2016 nur als Bezirks-Aggregat darstellen oder via FragDenStaat-Request beschaffen (Phase-2-Backlog)

**Daten-Quellen (CC-BY, Attribution in Footer pflicht):**

- `statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W1|W2>.csv` (z.B. `Berlin_AH21_W1.csv`, `Berlin_BVV21.csv`, `Berlin_BT21_W1.csv`)
- `daten.berlin.de` (Geometrien-ZIPs als Shapefile, EPSG:25833)
- `bundeswahlleiterin.de/bundestagswahlen/{jahr}/ergebnisse/opendata/btw{yy}/csv/` (BTW-Backup-Quelle)

**Schema-Gotchas:**

- W1 = Erststimme (Direktkandidat/Wahlkreis), W2 = Zweitstimme (Landesliste). Separate Files.
- Briefwahl pro Stimmbezirk erst ab 2021. Vor 2021 nur Bezirks-Aggregat.
- Parteien-Naming-Drift: PDS → Linkspartei.PDS → DIE LINKE; AfD ab 2013; BSW ab 2024. `party_alias`-Mapping-Table pflicht.
- Stimmbezirks-UWB-IDs ändern sich pro Wahl: Cross-Wahl-Vergleich auf Stimmbezirks-Ebene NICHT 1:1, nur via Aggregation auf Kiez/Bezirk/Berlin.
- AGH 2023 = Wiederholungswahl, NICHT neue Wahl. `is_repeat_election` + `parent_election_id` pflicht.

**Differenzierung gegen Tagesspiegel-Wahlkarte:** Wahl ist gebündelt mit anderen Layern (Cross-Layer-USP), nicht als Konkurrenz zur dedizierten Wahlkarte.

**Memory-Marker:** `feedback_no_lebenswert` (kein „AfD-Hochburg"-Wording), `feedback_no_em_dashes`, `project_kiez_score_dimensions`, `project_i18n_phase_1_de_only` (EN-Mentions in Story-Texten ignorieren), `project_simplify_keep_shapes` (mapshaper pflicht für Wahlbezirks-Geometrien), `project_compare_editorial_profiles` (Compare-Mode same-level-lock).

### Story 6.0: Wahl-Daten-Schema + Pipeline-Foundation + Spike

As a Solo-Maintainer,
I want zuerst einen Daten-Spike (1 CSV pulldown + parse + Schema-Validate) und dann ein vollständiges Drizzle-Schema für Wahldaten plus idempotenten Build-Step,
So that wir vor der vollständigen Pipeline echte Schema-Realität gegen Annahmen validieren und Wahldaten genau wie LOR/Klima behandeln (statisch, reproduzierbar, getestet) statt als Live-API.

**Acceptance Criteria:**

**Spike-First (AC-0, Pflicht vor Schema-Implementation):**

**Given** die Recon-Annahme dass `statistik-berlin-brandenburg.de/opendata/Berlin_<TYP><YY>_<W1|W2>.csv` einheitliches CSV-Schema liefert
**When** ich `scripts/wahlen/spike-fetch-ah21.ts` implementiere das `Berlin_AH21_W1.csv` herunterlädt, parsed und einen Snapshot-JSON in `_bmad-output/spike-artifacts/wahl-schema-snapshot.json` schreibt
**Then** echtes Schema (Spalten, Encoding, Trennzeichen, Briefwahl-UWB-Range) ist verifiziert
**And** Schema-Drift zwischen Wahljahren wird einmalig manuell geprüft (`Berlin_AH16_W1.csv` + `Berlin_BVV21.csv` + `Berlin_BT21_W1.csv` als Stichproben)

**Schema (AC-1):**

**Given** die Postgres-Foundation (Epic 2 Story 2.0)
**When** ich Drizzle-Schema-Tabellen anlege:
- `wahl` (id, jahr, typ ∈ {btw, agh, bvv}, stimmtyp ∈ {erststimme, zweitstimme, einstimme}, is_repeat_election BOOL, parent_election_id NULLABLE, source_url, license, source_updated_at, computed_at)
- `stimmbezirk` (wahl_id, uwb_id, bezirk_code, wahlkreis_id NULLABLE)
- `partei` (id, kurzname, vollname, farbe_hex, first_seen_year, last_seen_year)
- `partei_alias` (partei_id, alias_label, jahr) — mappt PDS → Linkspartei.PDS → DIE LINKE
- `ergebnis` (wahl_id, uwb_id, partei_id, stimmen, anteil, ist_briefwahl_aggregat BOOL) — `ist_briefwahl_aggregat = true` markiert pre-2021-Wahlen wo Briefstimmen nur auf Bezirks-Ebene aggregiert sind
- `wahl_aggregat_kiez` (wahl_id, kiez_slug, partei_id, stimmen, anteil) — Build-Time-Cache analog kiez_score
- `wahl_aggregat_bezirk` (wahl_id, bezirk_slug, partei_id, stimmen, anteil)
- `wahl_aggregat_berlin` (wahl_id, partei_id, stimmen, anteil)
**Then** Schema deckt BTW/AGH/BVV ab (Volksentscheide raus per Scope-Decision)
**And** Drizzle-Migrationen sind reproduzierbar (`pnpm db:migrate`)

**Aggregator-Pipeline (AC-2):**

**Given** die Daten-Quellen + Schema
**When** ich `scripts/aggregate-wahl-data.ts` als CLI-Script implementiere das pro Wahl die Roh-CSV lädt, parsed, gegen Zod-Schema validiert, Parteien-Naming-Drift via `partei_alias` resolved und in Postgres schreibt (TRUNCATE+Insert pro Wahl für Idempotenz)
**Then** `pnpm data:wahl-fetch` ist idempotent und reproduzierbar
**And** Pipeline läuft alle 12 Wahlen (4 BTW + 4 AGH + 4 BVV) in unter 5 Minuten

**Build-Aggregate (AC-3):**

**Given** die Stimmbezirks-Ergebnisse + LOR-Bezirksregions-Geometrien
**When** Aggregat-Build pro Wahl die Stimmbezirks-Werte räumlich auf Kiez (LOR-BR) + Bezirk + Berlin aggregiert (Stimmbezirks-Centroid → enthaltenes Kiez/Bezirk → SUM-Aggregation)
**Then** `wahl_aggregat_kiez` + `wahl_aggregat_bezirk` + `wahl_aggregat_berlin` sind befüllt
**And** Aggregation-Methodik in `docs/wahldaten-methodik.md` dokumentiert (Centroid-Strategie statt anteiliger Polygon-Verteilung, da Stimmbezirke ≪ Kieze)

**Briefwahl-Behandlung (AC-4):**

**Given** Briefwahl-Asymmetrie (pro Stimmbezirk erst ab 2021, vorher nur Bezirks-Aggregat)
**When** Aggregator Briefstimmen-Rows aus pre-2021-Daten findet
**Then** sie werden in `ergebnis` mit `ist_briefwahl_aggregat = true` markiert und Stimmbezirks-Werte sind `null`
**And** UI-Layer kann differenziert rendern: Urnenwerte exakt, Briefwerte als „Bezirks-Schätzung" gekennzeichnet

**Tests (AC-5):**

**Given** die Pipeline
**When** ich Test-Fixtures pro Wahl-Typ anlege (1 BTW, 1 AGH, 1 BVV mit je 5 Stimmbezirken + 3 Parteien) plus Snapshot-Coverage gegen den Spike-Schema-Snapshot
**Then** Pipeline ist regression-getestet
**And** `pnpm test:unit` validiert Schema-Drift-Detection bei Real-Run

**Query-Modul (AC-6):**

**Given** das Schema
**When** ich `src/lib/server/db/queries/wahl/`-Module implementiere:
- `get-wahl-list` → alle aktiven Wahlen sortiert nach Jahr desc
- `get-results-for-stimmbezirk(wahlId, uwbId)` → Top-5-Parteien + Wahlbeteiligung
- `get-results-for-kiez(wahlId, kiezSlug)` → aus wahl_aggregat_kiez
- `get-results-for-bezirk(wahlId, bezirkSlug)` → aus wahl_aggregat_bezirk
- `get-results-for-berlin(wahlId)` → aus wahl_aggregat_berlin
**Then** Page-Server-Loader können typesafe lesen
**And** Tests pro Query mit Coverage ≥ 90%

### Story 6.1: ENTFÄLLT (Bezirksreform-2001-Mapping)

**Status:** cancelled per Scope-Reduce 2026-05-18. Daten-Cutoff ist jetzt 2011+ (post-Bezirksreform 2001), historisches Mapping nicht mehr nötig. Falls in Phase-2 pre-2001-Daten via FragDenStaat-Request beschaffbar werden, kann diese Story reaktiviert werden.

### Story 6.2: Wahlbezirks-Geometrie-Layer + Adress-Lookup

As a Adress-Sucher,
I want dass für jede Adresse der korrekte Wahlbezirk pro Wahl bestimmt wird,
So that Wahlergebnisse präzise zugeordnet werden statt nur auf Bezirks-Ebene.

**Scope-Reduce 2026-05-18:** Nur 2017+ Geometrien. Pre-2017-Geometrien (2011/2013/2016) sind auf daten.berlin.de nicht direkt verfügbar; FragDenStaat-Request = Phase-2-Backlog. Für pre-2017-Wahlen rendert UI „Wahlbezirks-Geometrie nicht verfügbar, nur Bezirks-Aggregat zeigbar".

**Acceptance Criteria:**

**Given** die daten.berlin.de Wahlbezirks-Geometrien (Shapefile, EPSG:25833)
**When** ich pro Wahl-Jahr ab 2017 die Wahlbezirks-Geometrie als Static-GeoJSON in `static/layers/wahlbezirke-{jahr}.{hash}.geojson` ablege (Wahlbezirks-Schnitte ändern sich pro Wahl) und ins MANIFEST.json einhänge
**Then** Geometrien für 2017/2021/2023/2025 sind verfügbar (~500-900 KB pro Layer nach simplify)
**And** mapshaper-simplify mit `keep-shapes` läuft pro Layer (siehe [[project-simplify-keep-shapes]])
**And** Reprojection EPSG:25833 → WGS84 erfolgt im Fetch-Step

**Given** die Geometrien
**When** ich `src/lib/data/get-wahlbezirk-at-point.ts` als Punkt-in-Polygon-Lookup analog zu LOR-Lookup implementiere
**Then** für jede `(lat, lng, jahr)` der korrekte Wahlbezirk geliefert wird

**Given** Inspector-Integration
**When** Adress-Lookup läuft
**Then** Wahlbezirks-IDs für alle Wahl-Jahre ab 2017 werden aufgelöst und an Wahl-Result-Query übergeben
**And** für pre-2017-Wahlen wird `wahlbezirkId = null` zurückgegeben + UI fällt auf Bezirks-Aggregat zurück (Story 6.3 AC)

### Story 6.3: Inspector-Section „Wahlverhalten hier" (Bars + Level-Switch + Slope-Sparkline)

As a politik-interessierter Bürger,
I want im Inspektor-Panel eine Wahl-Sektion mit Top-5-Parteien als horizontale Stacked-Bars + Slope-Sparkline + Wahlbeteiligung + lokalem Level-Switch (Stimmbezirk/Kiez/Bezirk/Berlin),
So that ich auf einen Blick sehe wie meine Adresse politisch tickt UND ich die Detail-Tiefe (Adress-Punkt bis Berlin-Gesamt) selbst wählen kann.

**UX-Spec 2026-05-18** (per Recon: Datawrapper/NN/g/FT-Visual-Vocabulary):

- **Chart-Type: horizontale Stacked-Bars** statt Donut. Längenvergleich schlägt Winkelvergleich bei Multi-Level + 5+ Parteien.
- **Default-Level: Kiez (LOR)**, weil statistisch stabil + matched Kiez-Score-Mental-Model.
- **Level-Switch: EIN Dropdown** in der Wahl-Section („Stimmbezirk 401-23 (~1900 Wähler) ▾"). Lokal innerhalb der Section, NICHT global im Inspector (Globaler Multi-Level-Redesign = Phase-2 Epic 8).
- **Wahltyp-Tabs oben:** AGH / BTW / BVV.
- **Vergleichs-Delta-Chips inline:** „vs Kiez · vs Bezirk · vs Berlin → GRÜNE +4,2pp · CDU -1,1pp · AfD -2,3pp". Keine 4× parallele Charts.
- **Sparkline:** Slope-Chart kleine Multiples (Top-5-Parteien × 80×24px), Achsen-Labels nur an Endpunkten.
- **Direktmandats-Annotation:** Wahlkreis-Info als kleiner Footer-Block („Direktmandat Wahlkreis 1 → Canan Bayram (GRÜNE)"). Wahlkreis ist KEIN Level, sondern Annotation.

**Acceptance Criteria:**

**Given** die Wahl-Daten-Queries (Story 6.0) und Wahlbezirks-Lookup (Story 6.2)
**When** ich `src/lib/components/atlas/wahl-section.svelte` als Inspector-Section implementiere mit:
- Wahltyp-Tabs (AGH/BTW/BVV), Default = neueste verfügbare Wahl
- Level-Dropdown (Stimmbezirk → Kiez → Bezirk → Berlin), Default = Kiez
- Horizontale Stacked-Bars für Top-5-Parteien des gewählten Levels
- Wahlbeteiligung als sub-Metrik unter den Bars
- Slope-Sparkline für letzte verfügbare Wahlen desselben Typs
- Delta-Chips: gewählter Level vs. die 3 anderen Levels (+/-pp)
- Direktmandats-Annotation für AGH/BTW (Wahlkreis-ID + Direktkandidat + Partei)
**Then** Sektion erscheint nur wenn Wahldaten für Adresse existieren (FR59)

**Given** Partei-Farben mit WCAG-Kontrast
**When** Bars rendern
**Then** Farben sind aus zentralem `src/lib/data/partei-farben.ts` (CDU dunkelgrau, SPD rot, Grüne grün, Linke pink, AfD-Blau differenziert von navigator-accent-navy, FDP gelb, BSW lila, sonstige hellgrau)
**And** Bars haben dezente Muster-Overlay (Streifen/Punkte) als Achromatopsie-Fallback
**And** Screenreader-Table-Fallback (visuell hidden `<table>` mit Parteien + Anteilen)

**Given** Stimmbezirks-Level + Briefwahl-Asymmetrie (pre-2021)
**When** User wählt Stimmbezirks-Level UND Wahl ist pre-2021 (Briefwerte nur Bezirks-Aggregat)
**Then** dezenter Info-Badge unter der Wahlbeteiligungs-Zeile: „Stimmbezirks-Werte ohne Briefstimmen — Briefwähler nur als Bezirks-Aggregat verfügbar"
**And** Confidence-Hairline am Bar-Ende signalisiert Schätz-Unsicherheit

**Given** die Sektion
**When** Adresse in Brandenburg liegt (siehe [[project-berlin-click-guard]])
**Then** Sektion wird gar nicht gerendert

**Given** pre-2017-Wahlen ohne Stimmbezirks-Geometrie
**When** User wählt Stimmbezirks-Level für pre-2017-Wahl
**Then** Dropdown-Item ist disabled mit Hint „Stimmbezirks-Geometrie nicht verfügbar vor 2017" und Level snapt auf Bezirk

**Given** Compare-Mode (Story 1.27)
**When** User vergleicht zwei Adressen
**Then** beide Wahl-Sections sind same-level-locked (gemeinsamer Level-Dropdown wirkt auf beide; gemeinsamer Wahltyp-Tab)

**Given** Anti-Pattern-Sprache (Memory [[feedback-no-lebenswert]] + Compare-Editorial-Profile)
**When** Texte rendern
**Then** keine Wertungs-Begriffe („Hochburg", „rote/blaue Bezirke", „Wahl-Sieger") — stattdessen „Stärkste Partei", „Stimmenanteil", „Vergleich zum Bezirk"

### Story 6.4: Per-Wahl-Detail-Page

As a Datenjournalist und Suchender,
I want pro Wahl eine prerenderte Detail-Page mit Choropleth-Karte,
So that ich Berlin-weite Wahl-Verteilung pro Wahl-Jahr und Wahl-Typ sehen kann.

**Acceptance Criteria:**

**Given** die Wahl-Daten + Wahlbezirks-Geometrien (Story 6.0+6.2)
**When** ich `routes/(with-header)/wahl/[slug]/+page.svelte` und `+page.server.ts` mit `prerender = true` implementiere (slug-Format `{jahr}-{typ}` z.B. `2025-btw`)
**Then** jede Wahl hat eigene URL `/wahl/{slug}` (12 Routes Phase 1)

**Given** die Page
**When** ich Choropleth-Karte (MapLibre + Color-Scale nach stärkste Partei pro Wahlbezirk, Opazität nach Stimmen-Anteil) + horizontale Stacked-Bar Berlin-Gesamt + Tabelle Top-12-Bezirke + Methodik-Verweis implementiere
**Then** Page rendert im Long-Form-Reading-Layout

**Given** pre-2017-Wahlen ohne Stimmbezirks-Geometrie
**When** Page für 2011/2013/2016-Wahl rendert
**Then** Choropleth fällt auf Bezirks-Geometrie zurück (12 Polygone statt ~2000) + Disclaimer „Stimmbezirks-Geometrie nicht verfügbar"

**Given** SEO + JSON-LD
**When** ich `Dataset` + `BreadcrumbList` einbinde (Story 5.9 buildBreadcrumbList + buildDataset)
**Then** Wahl-Page ist als zitierbarer Datensatz strukturiert
**And** OG-Image generiert via existing Satori-Pipeline (Story 2.6 + 5.9): Stacked-Bar Berlin-Gesamt + Wahl-Typ + Jahr als Hero

**Given** Phase-1 DE-only (Memory [[project-i18n-phase-1-de-only]])
**Then** EN-Variante out-of-scope (war in alt-Epic erwähnt, jetzt cancelled)

### Story 6.5: Briefwahl-Asymmetrie-Pattern (dezenter Badge + Confidence-Hairline)

As a politik-interessierter Bürger der Daten-Genauigkeit ernst nimmt,
I want klar verstehen können dass Briefstimmen nicht pro Wahlbezirk zugeordnet sind sondern aggregiert geschätzt — aber ohne modalen Disclaimer der jeden Wert blockiert,
So that ich Werte nicht überinterpretiere und Methodik-Trust gewahrt bleibt, ohne dass die UI von Warnings überschwemmt wird.

**UX-Spec 2026-05-18:** dezenter Badge + Confidence-Hairline-Pattern (per UX-Recon), KEIN modaler Disclaimer pro Wert.

**Acceptance Criteria:**

**Given** Briefwahl-Asymmetrie (Stimmbezirks-Werte pre-2021 ohne Briefstimmen, Briefstimmen nur als Bezirks-Aggregat)
**When** ich `src/lib/components/atlas/briefwahl-marker.svelte` als kleinen Inline-Badge implementiere (Plex-Mono-Text + Info-Icon)
**Then** Badge erscheint nur bei Stimmbezirks-Level + pre-2021-Wahl mit Text „ohne Briefstimmen, ~38% Briefwähler nur als Bezirks-Aggregat"
**And** Stacked-Bars zeigen Confidence-Hairline (4-6px schraffierte End-Zone) statt fester End-Linie

**Given** Methodik-Page (Story 1.29 + 6.9)
**When** ich Section `#wahldaten-briefwahl` ergänze
**Then** ausführliche Erklärung der Briefwahl-Asymmetrie und warum pre-2021-Werte unsicher sind

**Given** das Badge-Pattern
**When** Wahl-Daten Briefstimmen pro Stimmbezirk vorliegen (2021+) ODER Level ≠ Stimmbezirk
**Then** Badge wird unterdrückt (Conditional-Rendering)
**And** Confidence-Hairline entfällt

### Story 6.6: ENTFÄLLT (Volksentscheide als separater Sub-Layer)

**Status:** cancelled per User-Decision 2026-05-18. Volksentscheide nicht im Phase-1-Scope. Reaktivierungs-Trigger: nach Hard-Launch wenn Capacity + User-Demand. Originaler Scope-Text siehe Git-History.

### Story 6.7: Cross-Layer-Story-Templates mit Wahl-Variablen

As a Datenjournalist,
I want deterministische Template-Texte die Wahl mit anderen Layern verknüpfen,
So that ich für eine Adresse oder einen Kiez eine vorformulierte Cross-Layer-Beobachtung kriege ohne wertendes Framing.

**Acceptance Criteria:**

**Given** die Aggregat-Daten (Kiez-Score + Wahl + Wohnlage + Lärm + Soziale Lage)
**When** ich `src/lib/data/cross-layer-templates/wahl-{slug}.de.yaml` mit deskriptiven Templates wie „Im {kiez} kam {top_partei} bei der {jahr} {typ}-Wahl auf {anteil}%. Mietspiegel-Wohnlage hier: {wohnlage_label}. Lärm-Stufe: {laerm_label}." anlege
**Then** Template-Bibliothek deckt 5-10 Cross-Layer-Story-Patterns ab
**And** alle Templates pflicht-reviewed gegen Stigma-Lint (Memory [[feedback-no-lebenswert]] + Stimm-Stigma-Pattern)

**Given** die Templates
**When** Bezirks-Page (Epic 2 Story 2.3) oder Kiez-Page (Epic 2 Story 2.4) gerendert wird
**Then** Cross-Layer-Story-Block mit kontextspezifischem Template-Text erscheint
**And** Phase-1 DE-only (EN out-of-scope)

**Given** Editorial-Verantwortung
**When** Template eine wertende Aussage triften könnte
**Then** Template-Style-Guide in `docs/cross-layer-templates-guide.md` schreibt vor: nur deskriptive Werte, keine Bewertung, keine Begriffe wie „Hochburg", „rote/blaue Bezirke", „dominiert von"
**And** Template-Review vor Roll-out auf alle 143 Kieze (Co-Design analog FAQ Story 2.5b)
**And** Forbidden-Token-Lint (analog Story 5.8 publish-update-Skill) blockt wertende Begriffe automatisch

### Story 6.8: WebMCP-Tools für Wahldaten

As a LLM-Agent (Claude-Browser-Extension),
I want spezielle WebMCP-Tools um Wahldaten strukturiert abzufragen,
So that ich „Wie wählte Friedrichshain in der BTW 2025?" mit präzisen Daten + Quellen-Attribution beantworten kann.

**Acceptance Criteria:**

**Given** der WebMCP-Adapter (Story 2.7)
**When** ich folgende Tools in `$lib/webmcp/tools/wahl/` ergänze:
- `get_election_result(address, election_slug, level)` → liefert Top-5-Parteien + Wahlbeteiligung + Quelle für den gewählten Level (stimmbezirk/kiez/bezirk/berlin)
- `compare_elections(address, election_slugs[], level)` → liefert Sparkline-Daten für mehrere Wahlen auf demselben Level
- `get_voting_district_geometry(district_id, year)` → liefert GeoJSON für Wahlbezirk (nur 2017+)
- `list_elections()` → liefert alle 12 verfügbaren Wahlen mit Jahr + Typ + Stimmbezirks-Coverage-Flag
**Then** alle Tools haben strict JSON-Schema-Inputs (snake_case-Naming, Englisch-Beschreibungen)
**And** Volksentscheide-Tool gestrichen (Story 6.6 cancelled)

**Given** Source-Attribution
**When** Tool-Output gerendert wird
**Then** jeder Datenwert hat `source` (`statistik-berlin-brandenburg.de` oder `bundeswahlleiterin.de`), `updatedAt` (Wahl-Datum), `license` (`CC-BY`) (FR40)

**Given** Caveat-Handling
**When** Briefwahl-Asymmetrie Tool-Output betrifft
**Then** Tool-Response enthält `caveats: ["Stimmbezirks-Werte ohne Briefstimmen — Briefwähler nur als Bezirks-Aggregat (pre-2021)"]`-Feld

**Given** Phase-1-Limits
**When** Stimmbezirks-Geometrie für pre-2017-Wahl angefragt wird
**Then** Tool antwortet mit `error: "geometry_not_available"` + `available_levels: ["bezirk", "berlin"]`-Hint

### Story 6.9: JSON-LD Dataset + Methodik-Doku

As a Suchmaschine / LLM-Crawler,
I want Wahldaten als strukturierten Dataset mit dokumentierter Methodik erkennen,
So that Wahl-Pages als zitierbare Quellen indexierbar sind.

**Acceptance Criteria:**

**Given** die Wahl-Detail-Pages (Story 6.4)
**When** ich `JsonLd` mit `Dataset`-Schema (`name`, `description`, `license = CC-BY`, `dateModified` = Wahl-Datum, `creator` = Berlin Landeswahlleitung / Bundeswahlleiterin, `distribution.contentUrl` → Roh-CSV-URL, `keywords` mit Wahl-Typ + Jahr) via Story-5.9-`buildDataset` einbinde
**Then** jede Wahl ist als Datenset für Google-Dataset-Search + LLM-Crawler erkennbar

**Given** die Methodik-Page (Story 1.29)
**When** ich Sektion `#wahldaten` mit Unterabschnitten ergänze (Datenquellen, Daten-Cutoff-Begründung 2011+/2013+, Briefwahl-Asymmetrie-Methodik, Stimmbezirks-Aggregation-auf-Kiez-Strategie, Wiederholungswahl-2023-Behandlung, Update-Cadence-Verweis auf Story 5.1)
**Then** Methodik ist transparent dokumentiert
**And** Cross-Layer-Templates-Guide (Story 6.7) verlinkt aus dieser Section

**Given** llms.txt + llms-full.txt (Story 2.8)
**When** Builder läuft
**Then** Wahl-Pages sind in llms.txt aggregiert
**And** llms-full.txt enthält Wahl-Methodik-Section + Beispiel-Aggregat pro Wahl-Typ (Berlin-Gesamt + 1 Bezirk + 1 Kiez als Sample)

### Epic 6 Status (Rewrite 2026-05-18)

**8 aktive Stories** (von 10 ursprünglich): 6.0 Wahl-Daten-Schema + Pipeline-Foundation + Spike, 6.2 Wahlbezirks-Geometrie-Layer + Adress-Lookup (2017+), 6.3 Inspector-Section „Wahlverhalten hier" (Bars + Level-Switch + Slope-Sparkline), 6.4 Per-Wahl-Detail-Page, 6.5 Briefwahl-Asymmetrie-Pattern (dezenter Badge), 6.7 Cross-Layer-Story-Templates mit Wahl-Variablen, 6.8 WebMCP-Tools für Wahldaten, 6.9 JSON-LD Dataset + Methodik-Doku.

**2 gestrichene Stories:** 6.1 Bezirksreform-2001-Mapping (Cutoff 2011+ macht Mapping obsolet), 6.6 Volksentscheide als separater Sub-Layer (out-of-scope Phase 1).

FRs covered: FR59 (Wahl-Sparkline) komplett, FR61-Anteil (Cross-Data-Story-Templates für Wahl-Variablen).

**Sequencing (Phase 1):**

- **Spike + Foundation:** 6.0 hard-block (Daten-Spike vor Schema-Implementation, Schema vor Pipeline, Pipeline vor Aggregat-Build).
- **Geometrie + Lookup:** 6.2 nach 6.0.
- **UI + WebMCP parallel:** 6.3 + 6.4 + 6.5 + 6.7 + 6.8 parallel nach 6.2.
- **Discovery-Surface:** 6.9 zuletzt (braucht alle Pages für vollständige Sitemap-Coverage).

Wave-Plan-Vorschlag (analog Epic 2):
- Wave 1 = 6.0 (sequenziell)
- Wave 2 = 6.2 (sequenziell)
- Wave 3 = 6.3 + 6.4 + 6.5 + 6.7 + 6.8 (parallel)
- Wave 4 = 6.9 (sequenziell)

**Out-of-Scope Phase 1 (Phase-2-Future-Epic-Kandidaten):**

- Globaler Multi-Level-Inspector-Redesign (alle Sections adaptieren auf Level-Switch, Karten-Polygon-Highlight) — Epic 8.
- Volksentscheide (Story 6.6 reactivate).
- Pre-2017-Wahlbezirks-Geometrien via FragDenStaat.
- pre-2011-Wahldaten (Bezirksreform-Backfill).
- EN-Locale-Coverage.
- Live-Wahl-Auszählungs-Updates (Static-only-Strategie per Memory [[feedback-no-live-data]]).

**Differenzierung gegen Tagesspiegel-Wahlkarte:** bewusste Bündelung mit Lärm/Wohnlage/Soziale-Lage/Kiez-Score (Cross-Layer-USP), nicht als Konkurrenz zur dedizierten Wahlkarte. Tagesspiegel hat 8-Person-Team und ist primäre Wahl-Surface; navigator.berlin ist Kontext-Annotation in einem breiteren Daten-Atlas.

## Epic 7: System-Dokumentation (Owner + LLM-Konsum)

Solo-Maintainer (Matze) plus LLM-Agents mit Repo-Zugang finden über `docs/INDEX.md` strukturierte Single-Entry zu allen System-Doku-Assets (Architektur-Map, Data-Pipeline-Atlas, Recovery-Playbook, Secrets-Map, ADRs, Runbooks). Auto-Doc-Skill (Lefthook post-commit-Hook) synct nach jedem Commit die Doku gegen Code-Diff, kein Drift. Endless-Loop ausgeschlossen durch Skip-Marker-Check.

Komplementär zu Epic 4 (public-facing Compliance-Pages) und Epic 5 (Update-Cadence-ADR + Backup-Drill). Phase-1-Scope weil Knowledge-Decay mit Launch startet, nicht erst nach 12 Monaten Schweigen.

### Story 7.1: Auto-Doc-Skill (Foundation)

As a Solo-Maintainer,
I want einen automatischen Lefthook post-commit-Hook der einen Claude-Subagent triggert, der Code-Diff klassifiziert und passende Doku-Files updated,
So that ich bei jedem Commit garantiert eine aktuelle Doku habe ohne manuelle Sync-Disziplin.

**Acceptance Criteria:**

**Given** Lefthook ist im Projekt installiert (Epic 4 Story 4.3)
**When** ich `lefthook.yml` um eine `post-commit`-Section ergänze die `pnpm doc:auto-sync` aufruft
**Then** Hook triggert nach jedem lokalen Commit
**And** Hook checked Commit-Message vor Execution: enthält Subject `docs(auto):` oder Body `[skip auto-doc]` → exit 0 ohne Skill-Aufruf (Endless-Loop-Guard)

**Given** der Hook triggert
**When** `scripts/doc-auto-sync.ts` läuft mit `git diff HEAD~1 HEAD --stat` und `git diff HEAD~1 HEAD` als Input
**Then** Script ruft Claude-CLI-Subagent (`claude --print --append-system-prompt "<doc-classifier-prompt>"`) mit Diff + `docs/INDEX.md` als Kontext auf
**And** Subagent-Output ist JSON mit `{ updates: [{ target: "docs/pipelines/data-flow.md", action: "append-section" | "replace-section" | "create", content: "..." }], skip_reason?: string }`

**Given** Subagent klassifiziert Diff als doku-relevant
**When** Script die Updates ausführt (write/append zu Target-Files)
**Then** Script staged geänderte `docs/`-Files und macht Follow-up-Commit mit Message
`docs(auto): sync from <kurz-sha>

<Liste der geänderten Files + Kurz-Begründung>

[skip auto-doc]`
**And** Follow-up-Commit triggert post-commit-Hook erneut, der durch `[skip auto-doc]`-Marker früh terminiert (Loop-Guard verifiziert per Test-Case)

**Given** Subagent klassifiziert Diff als nicht-doku-relevant (z.B. Style-only, Test-only ohne Logic-Change, dependency-bump)
**When** Script `skip_reason` empfängt
**Then** kein Follow-up-Commit, kein File-Change
**And** stderr-Log `[doc-auto-sync] skipped: <reason>` für Debug-Trace

**Given** Klassifizierungs-Rules pro Domain
**When** ich `scripts/doc-auto-sync-rules.ts` mit Domain-Mapping-Tabelle anlege:
- `scripts/lib/sources.ts` oder `static/layers/MANIFEST.json` → `docs/pipelines/data-flow.md`
- neue `.env.example`-Variable → `docs/recovery/secrets-map.md`
- neuer ADR-würdiger Pattern-Wechsel (heuristisch: neue Library in `package.json`, neuer Architektur-Sub-Ordner) → ADR-Vorschlag in `docs/adr/`
- neue Route-File unter `src/routes/` → `docs/architecture/routes.md`
- neuer Skill in `.claude/skills/` → `docs/architecture/skills.md`
- neue `lefthook.yml`- oder `.github/workflows/`-Sektion → `docs/architecture/ci-cd.md`
**Then** Subagent-System-Prompt enthält Rule-Tabelle und respektiert sie strikt

**Given** Auto-Apply-Risiko (Subagent halluziniert / falsch klassifiziert)
**When** Subagent-Output validiert wird
**Then** Hard-Limits gelten: max 5 Files pro Commit, max 200 LOC pro File-Change, kein Delete-Operation (nur write/append/replace-section)
**And** Limit-Verletzung → skip + Log statt Apply

**Given** Owner-Override
**When** ich `git commit -m "feat: foo [skip auto-doc]"` verwende
**Then** Hook terminiert sofort ohne Subagent-Call

**Given** TDD-Pflicht (CLAUDE.md TDD-Mandat, ADR-012)
**When** ich Story 7.1 implementiere
**Then** Test-Cases existieren für: Loop-Guard (zwei aufeinanderfolgende Hooks → zweiter skipped), Hard-Limits (Subagent-Output mit 6 Files → reject), Klassifizierungs-Rules (Diff in `scripts/lib/sources.ts` → Target = data-flow.md)

### Story 7.2: `docs/`-Tree-Struktur + INDEX

As a Solo-Maintainer und LLM-Agent mit Repo-Zugang,
I want eine konsolidierte `docs/`-Ordner-Struktur mit zentralem `docs/INDEX.md` als Single-Entry,
So that ich (und Claude-Code/Copilot) ohne Such-Aufwand alle System-Doku-Assets finde.

**Acceptance Criteria:**

**Given** existing `docs/`-Tree (`docs/adr/`, `docs/runbooks/`, `docs/editorial-review.md`, `docs/never-machine-translate.md`)
**When** ich Sub-Ordner anlege: `docs/architecture/`, `docs/pipelines/`, `docs/recovery/`
**Then** Tree-Struktur ist:
```
docs/
  INDEX.md            ← Single-Entry für Owner + LLMs
  architecture/       ← System-Map, Routes, CI/CD, Skills
  adr/                ← existing 12 ADRs + auto-skill-generierte
  pipelines/          ← Data-Flow-Atlas
  recovery/           ← Wiedereinstieg-Playbook + Secrets-Map
  runbooks/           ← existing Operations-Runbooks
  editorial-review.md ← existing
  never-machine-translate.md  ← existing
```

**Given** Frontmatter-Convention für LLM-Konsum
**When** ich jede `*.md`-Datei (existing + neu) mit YAML-Frontmatter ergänze:
```yaml
---
type: architecture | adr | pipeline | recovery | runbook | editorial
audience: owner | llm | both
last-verified: YYYY-MM-DD
related: [docs/path-to-related.md]
---
```
**Then** LLM-Agents können Frontmatter parsen und Doku-Type/Aktualität bewerten
**And** Auto-Doc-Skill (Story 7.1) updated `last-verified` bei Sync-Operationen

**Given** `docs/INDEX.md` als Hub
**When** ich Index mit Sections anlege:
- **Wiedereinstieg-Quickstart** (Link zu `recovery/wiedereinstieg.md` + 3-5 Top-Runbooks)
- **Architektur** (Verlinkung System-Map, Routes, CI/CD, Skills, ADR-Index)
- **Daten-Pipelines** (Verlinkung data-flow.md + Sub-Sections pro Pipeline)
- **Operations** (Verlinkung Runbooks + Backup-Drill + Update-Cadence)
- **Editorial-Regeln** (existing editorial-review.md + never-machine-translate.md)
- **Auto-Doc-Skill-Status** (Verlinkung Story 7.1 + Skill-Config + letzter Sync)
**Then** Single-Entry für Owner-Wiedereinstieg + LLM-Crawl

**Given** CLAUDE.md-Integration
**When** ich `CLAUDE.md` (root) um Verweis ergänze: „System-Doku: siehe `docs/INDEX.md`"
**Then** jede Claude-Session lädt Index implizit via CLAUDE.md-Auto-Inclusion

**Given** ADR-Index in `docs/adr/`
**When** ich `docs/adr/INDEX.md` anlege mit Tabelle (Code, Titel, Status, Datum, Superseded-By)
**Then** ADR-Übersicht ist eine Datei statt 12 Einzel-Lookups

### Story 7.3: System-Map + Service-Topology

As a Solo-Maintainer nach 12 Monaten Lücke,
I want eine zentrale System-Map die zeigt was wo läuft (Hetzner, Coolify, Postgres, GH-Actions, Cron, Datenquellen),
So that ich in 5 Minuten Service-Topology rekonstruieren kann ohne Coolify-UI zu durchwühlen.

**Acceptance Criteria:**

**Given** Production-Stack (Hetzner-CPX22 + Coolify + Traefik + CrowdSec + Postgres + GH-Actions)
**When** ich `docs/architecture/system-map.md` mit Mermaid-Diagrammen anlege:
- **Service-Topology:** Hetzner-Node → Coolify → Container (App, Postgres, Traefik, CrowdSec)
- **Datenfluss-Mesh:** Externe Quellen (FIS-Broker, ODIS, DWD, OSM, Wahlen-Berlin) → Build-Time-Aggregation → Static-Files + Postgres → SvelteKit-Server-Loader → Inspector/Pages
- **Build-Pipeline:** GitHub-Push → GH-Actions (Lint/Type/Test/A11y/Bundle/Cookie/Domain-Allowlist/Lighthouse) → Coolify-Webhook → Container-Rebuild
- **Cron-Schedules:** GH-Actions-Cron pro Datenquelle (Klima jährlich, BRW alle 2J, Stolpersteine täglich-OSM-Sync) + Backup-Daily
**Then** alle Diagramme als Mermaid-Code-Blocks (LLM-parsebar, GitHub-renderbar)

**Given** Secrets + Env-Vars sind sensibel
**When** System-Map Service-Beziehungen zeigt
**Then** keine Plaintext-Secrets, keine konkreten Token-Werte
**And** Secret-Slots verweisen auf `docs/recovery/secrets-map.md` (Story 7.5)

**Given** Update-Cadence
**When** Production-Stack-Änderung passiert (neuer Service, geänderte Port-Map, neue Cron-Definition)
**Then** Auto-Doc-Skill (Story 7.1) erkennt Diff in `lefthook.yml` / `.github/workflows/` / `coolify.yaml` und schlägt System-Map-Update vor

### Story 7.4: Data-Pipeline-Atlas

As a Solo-Maintainer und LLM-Agent,
I want einen Atlas der für jede Datenquelle Quelle → Build-Step → Output-File zeigt,
So that ich bei „Datenquelle XY down" sofort weiß welche Build-Steps + Output-Files betroffen sind.

**Acceptance Criteria:**

**Given** existing `scripts/lib/sources.ts` als Source-of-Truth für externe Datenquellen
**When** ich `docs/pipelines/data-flow.md` als Atlas anlege mit Tabelle pro Layer:
| Layer-Slug | Externe Quelle | Build-Step (CLI) | Output-File | Update-Cadence | Fallback bei Down |
**Then** alle ~20+ Layer (Bezirke, LOR, BRW, Klima, Stolpersteine, Wahlen, etc.) sind tabellarisch erfasst

**Given** Auto-Sync
**When** ich `scripts/generate-data-flow-doc.ts` anlege das aus `scripts/lib/sources.ts` + `static/layers/MANIFEST.json` automatisch die Tabelle generiert
**Then** Atlas ist regenerierbar via `pnpm doc:pipelines`
**And** Auto-Doc-Skill (Story 7.1) ruft den Generator bei `sources.ts`- oder MANIFEST-Diff auf

**Given** Cross-Reference zu Runbooks
**When** Atlas-Zeile auf Quellen-Down-Szenario verweist
**Then** Link zu passendem Runbook (z.B. `docs/runbooks/data-source-failure.md` aus Epic 4)

**Given** TDD-Pflicht
**When** ich `scripts/generate-data-flow-doc.ts` implementiere
**Then** Test-Cases prüfen: alle MANIFEST-Layer im Atlas erfasst, Tabelle ist Markdown-valide, Update-Cadence-Werte aus `sources.ts` korrekt

### Story 7.5: Owner-Recovery-Playbook + Secrets-Map

As a Solo-Maintainer der nach 12 Monaten wieder einsteigt,
I want ein Playbook das Local-Dev-Setup, Restart-Sequenz, häufigste Bricks und Secrets-Inventar zentral abbildet,
So that Wiedereinstieg in unter 2 Stunden möglich ist statt 2 Tage Suche durch Repo + Coolify-UI + Vault.

**Acceptance Criteria:**

**Given** Wiedereinstieg-Szenario
**When** ich `docs/recovery/wiedereinstieg.md` anlege mit Sections:
- **Local-Dev-Setup-Walkthrough** (Node-Version, pnpm-Install, `.env.local`-Bootstrap, `pnpm dev`, Postgres-lokal-Setup-Verweis)
- **Production-Access-Sequenz** (SSH zu Hetzner, Coolify-Login, GH-Actions-Tab, Sentry/Monitoring-falls-vorhanden)
- **Restart-Sequenz** (Coolify-App-Restart, Postgres-Restart, Cache-Invalidation)
- **Häufige Bricks** (TopN-Issues aus Runbooks + Symptome → Fix-Pfad)
- **Verifikations-Checks** (welche Routes/Endpoints muss ich nach Restart manuell prüfen)
**Then** Playbook ist linear durchlaufbar

**Given** Secrets-Inventar
**When** ich `docs/recovery/secrets-map.md` anlege mit Tabelle:
| Secret-Name | Wo verwendet (Service/Script) | Quelle (Bitwarden-Ref) | Rotations-Cadence | Restore-bei-Verlust |
**Then** jeder Secret-Slot dokumentiert, kein Plaintext, Bitwarden-Item-Name + Vault-Pfad als Pointer

**Given** TDD nicht anwendbar (pure Doku-Story)
**When** Story 7.5 implementiert wird
**Then** Skip-Marker im Story-Plan dokumentiert (siehe CLAUDE.md TDD-Scope: „Pure Content-Files" ausgenommen)

**Given** Auto-Doc-Skill (Story 7.1)
**When** Diff in `.env.example` oder neue Env-Var-Referenz in `src/lib/server/` erkannt wird
**Then** Skill schlägt Secrets-Map-Update vor (neuer Slot ergänzen, ohne Plaintext-Wert)

### Story 7.6: LLM-Konsum-Optimierung

As a LLM-Agent mit Repo-Zugang (Claude-Code, Copilot, lokal-laufender Coding-Assistant),
I want strukturierte Doku-Metadaten und Story-Map-Aktualität,
So that ich bei Coding-Tasks nicht halluziniere weil veraltete Doku gelesen wurde.

**Acceptance Criteria:**

**Given** Frontmatter-Convention aus Story 7.2
**When** Auto-Doc-Skill (Story 7.1) Files updated
**Then** `last-verified: YYYY-MM-DD` wird auf Sync-Datum gesetzt

**Given** Story-Map-Bedarf
**When** ich `docs/architecture/story-map.md` als kompakte Tabelle anlege:
| Story-ID | Status (planned / review / done / superseded) | Epic | Kurz-Beschreibung | Code-Refs |
**Then** LLM-Agent kann auf einer Page Story-Stand sehen ohne `_bmad-output/`-Tree zu crawlen
**And** Auto-Doc-Skill regeneriert Story-Map bei Diff in `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Given** CLAUDE.md-Verweis
**When** ich `CLAUDE.md` (root) erweitere um Sektion „LLM-Quick-Refs"
**Then** Sektion verlinkt: `docs/INDEX.md`, `docs/architecture/story-map.md`, `docs/pipelines/data-flow.md`, `docs/adr/INDEX.md`, `docs/recovery/secrets-map.md`

**Given** Doku-Stale-Warnung für LLM
**When** Frontmatter `last-verified` älter als 90 Tage ist
**Then** Doku-File hat Marker-Section am Anfang: „Last-verified vor >90 Tagen. Aktualität gegen Code-Stand prüfen vor Vertrauen."
**And** Auto-Doc-Skill prüft Marker-Insertion als Side-Effect bei jedem Sync-Run

### Epic 7 Status

6 Stories total: 7.1 Auto-Doc-Skill (Foundation), 7.2 docs/-Tree-Struktur + INDEX, 7.3 System-Map + Service-Topology, 7.4 Data-Pipeline-Atlas, 7.5 Owner-Recovery-Playbook + Secrets-Map, 7.6 LLM-Konsum-Optimierung.

FRs covered: keine direkten FRs. Epic 7 ist Maintenance-/Knowledge-Layer für Solo-Maintainer-Realität und LLM-Crawl-Effizienz.

Sequencing: Story 7.1 ist Hard-Foundation (alle anderen Stories profitieren vom Auto-Sync). Stories 7.2 + 7.5 sind Content-First (kein TDD), Stories 7.3 + 7.4 + 7.6 brauchen 7.1 für Auto-Sync-Hooks. Empfohlene Reihenfolge: 7.1 → 7.2 → 7.5 → 7.3 → 7.4 → 7.6.

Phase-Zuordnung: Phase 1, parallel zu Epic 4 + Epic 5. Start frühestens nach Epic 4 Story 4.3 (Lefthook-Setup existiert), sonst Hook-Mechanik in 7.1 nicht andockbar.

Loop-Guard-Pattern: post-commit-Hook checked Commit-Message auf `docs(auto):`-Subject oder `[skip auto-doc]`-Marker im Body → früh terminieren ohne Subagent-Call. Verifiziert per Unit-Test (zwei aufeinanderfolgende Commits → zweiter triggert nicht). Hard-Limits (max 5 Files, max 200 LOC, kein Delete) schützen vor Subagent-Halluzinations-Cascade.

## Final Status

**Phase 1 Stories Total:** 51 (Epic 1: 16, Epic 2: 13, Epic 3: 1, Epic 4: 7, Epic 5: 8, Epic 7: 6)
**Phase 2a Stories Total:** 10 (Epic 6 Wahldaten)
**Phase 3 Stories Total:** 14 (Epic „i18n-Phase-3-EN-Coverage", siehe Future-Epics)

Stand 2026-05-16 nach Sprint-Refactor (Epic 2/3/4 DE-only Phase 1 + Postgres-Hybrid + CPX22 + Epic 5/6/7 NEU + i18n-Deferral):
- **Epic 1** (Phase 1): 16 Stories (1.1–1.12 + 1.13–1.25 GH-Issue-Erweiterungen + 1.26–1.29 Polish), Foundation gelegt, alle in `review`
- **Epic 2** (Phase 1): 13 Stories — NEU 2.0 Postgres-Foundation + 2.5 gesplittet zu 2.5a/b + 2.9 gesplittet zu 2.9a/b + 2.11 Welcome-Overlay. **DE-only ab 2026-05-16** (EN-Varianten in Phase-3-Epic).
- **Epic 3** (Phase 1): 1 Story — auf Story 3.1 Paraglide-Setup-Reduce auf DE-only reduziert ab 2026-05-16. Stories 3.2-3.5 verschoben in Future-Epic „i18n-Phase-3-EN-Coverage".
- **Epic 4** (Phase 1): 7 Stories — CPX22 + Postgres-aware + 4.4 shrink (ADRs done) + 4.5 shrink (DE done). **DE-only ab 2026-05-16** für 4.5/4.6/4.7.
- **Epic 5** (Phase 1, NEU): 8 Stories — Distribution + Pflege + Owner-Realisation (Update-Cadence, Brand, Launch, Monitoring, Drill, DPIA, Sitemap-Submission, Public-Update-Skill). Story 5.8 (NEU 2026-05-16) ist manuelles Tooling auf Story 2.13 `/updates`-Pipeline mit Allowlist + Forbidden-Token-Lint + Editorial-Gate, orthogonal zu Epic 7 Auto-Doc-Skill.
- **Epic 6** (Phase 2a, NEU): 10 Stories — Wahldaten + Cross-Layer-Story als eigenständiges Epic (war FR59 in Future-List). **DE-only ab 2026-05-16** für 6.4.
- **Epic 7** (Phase 1, NEU 2026-05-16): 6 Stories — System-Dokumentation mit Auto-Doc-Skill als Foundation (Story 7.1, Lefthook post-commit + Claude-Subagent + Loop-Guard via Skip-Marker), docs/-Tree-Hub + INDEX, System-Map, Pipeline-Atlas, Recovery-Playbook + Secrets-Map, LLM-Konsum-Optimierung
- **i18n-Phase-3-EN-Coverage** (Phase 3, NEU 2026-05-16): 14 Stories — 4 Epic-3-Archiv (3.2-3.5) + 10 EN-Varianten aus Epic 2/4/6. Reaktivierung Post-Hard-Launch wenn EN-Demand-Signal vorliegt.

**Coverage:**
- Phase-1-FRs (FR1–FR55 + FR11a–e + FR55a–b + FR54): vollständig adressiert über Epics 1-4
- Phase-2a-FRs (FR59 + FR61-Anteil für Wahl-Variablen): adressiert in Epic 6
- FR55c–FR55j (6+ weitere Sprachen + RTL): verschoben in Future-Epic „i18n-Expansion" (User-Lock 2026-05-15)
- NFRs: Implementierungs-seitig in Epic 1 (Performance, A11y, Integration), Architektur-seitig in Epic 4 (Security, Privacy, Reliability, Maintainability), i18n-spezifisch in Epic 3, Operations-/Pflege-seitig in Epic 5
- UX-DR1–UX-DR56: vollständig abgedeckt (Tokens + Komponenten + Patterns + Compliance-Pages + Welcome-Overlay)

**Verworfen (User-Lock 2026-05-15, nicht Future-Epic, nicht in Roadmap):**
- FR56-FR58 Live-Daten-Bundle (Live-BVG/Bahn/Bus + Live-BLUME-Luftqualität + Live-Wetter): Anti-Goal Live-Pattern wegen Wartungs-Surface
- FR63 RADOLAN-Regenradar: Anti-Goal Polyglot-Stack + Live-Pattern
- Bus-Faktor-/Sunset-Plan: User-Entscheidung „nicht drüber nachdenken"

**Phase 2b/3 (FR59a, FR60-FR67 minus verworfene und absorbierte) + i18n-Expansion:** als Future Epics dokumentiert, nicht in Phase-1/2a-Scope.

**Cross-Epic Dependencies (User-Lock-Revision 2026-05-16, i18n-Deferral):**
- Epic 2/3/4 setzen auf Epic 1 Foundation (Repo, Tokens, Komponenten, Daten-Abstraktion)
- ~~Epic 3 (Stories 3.1+3.2) blockt Epic 2 EN-Variante-Stories (2.3/2.4/2.5a/2.11)~~ **AUFGEHOBEN 2026-05-16**: Epic 3 auf 1 Story reduziert, EN-Varianten in Phase 3 verschoben. Epic 2 startet ohne i18n-Block. Story 3.1 läuft als 1-2-Tage-Smoke parallel ohne Dep.
- Epic 2 Story 2.0 (Postgres-Foundation lokal) blockt Epic 4 Story 4.1 (Production-Postgres-Service definitionsfähig)
- **Epic 4 Story 4.1 (Hetzner-CPX22-Kauf) wandert nach Epic 2 Story 2.0** — Coming-Soon-Phase-Deploy reduziert Risk-Spike, claim't Domain-Footprint früh
- Epic 4 Story 4.3 (CI) braucht Epic 2 Story 2.0 (Postgres-Schema)
- Epic 5 startet nach Epic 4 Stories 4.1-4.7 + Epic 2/3 komplett (Hard-Production-Vorbereitung)
- Epic 6 hard-blocked durch Epic 4 Story 4.1 (Production-Postgres für 1.4M Wahl-Datenpunkte)
- Epic 7 Story 7.1 (Auto-Doc-Skill) soft-blocked durch Epic 4 Story 4.3 (Lefthook im Projekt installiert). Stories 7.2/7.5 sind Content-First und können auch ohne 7.1 starten. Volle Effizienz ab 7.1-Roll-out
- **i18n-Phase-3-EN-Coverage** läuft Post-Hard-Launch (T+12w+) wenn Demand-Signal. Story 3.1 (DE-only-Cleanup) ist trotzdem Phase-1-Pflicht — schafft saubere Foundation für spätere EN-Reaktivierung ohne Setup-from-scratch.

**Empfohlene Gesamt-Sequenz (T+0 = jetzt, Update 2026-05-16):**
1. **T+0** → Epic 3 Story 3.1 (Paraglide-Reduce auf DE-only, ~1-2 Tage Smoke) + Epic 2 Story 2.0 (Postgres-Foundation) parallel
2. **T+~1 Woche** → Epic 4 Stories 4.1+4.2 (Server-Kauf + Coming-Soon-Deploy + Security)
3. **T+~2-4 Wochen** → Epic 2 Stories 2.1-2.13 (DE-only) + Epic 4 Story 4.3 (CI parallel zu Inhaltsaufbau)
4. **T+~5-6 Wochen** → Epic 4 Stories 4.4-4.7 (ADRs + Compliance-Pages DE-only + Architektur), Soft-Production-Phase + Epic 7 Story 7.1 (Auto-Doc-Skill, sobald Lefthook via 4.3 läuft)
5. **T+~6-7 Wochen** → Epic 7 Stories 7.2-7.6 (docs/-Tree + System-Map + Pipeline-Atlas + Recovery-Playbook + LLM-Konsum-Optimierung), parallel zu Epic 5
6. **T+~7-8 Wochen** → Epic 5 Stories 5.1-5.4 (Pflege + Monitoring), Hard-Production-Vorbereitung
7. **T+~9 Wochen** → Epic 5 Stories 5.5-5.7 + Hard-Launch (Story 5.3)
8. **T+~10 Wochen+** → Epic 6 Wahldaten als Phase 2a (DE-only), frei wann Kapazität
9. **T+~12 Wochen+ (Phase 3, optional)** → „i18n-Phase-3-EN-Coverage" wenn Search-Console- oder LLM-Referrer-Daten EN-Demand zeigen

**Phase-1-Verkürzung durch i18n-Deferral:** Sequenz verkürzt sich um ~2-3 Wochen gegenüber 2026-05-15-Plan, weil Epic 3 von 5 auf 1 Story shrinkt und EN-Anteil in Epic 2/4/6 Stories entfällt (geschätzt ~30% Story-Aufwand bei 2.3/2.4/2.5a/2.11/2.12 + ~50% bei 4.5/4.6/4.7 + ~20% bei 6.4).

- Innerhalb Epic 1: 1.4 (Daten-Abstraktion) blockt 1.7/1.9/1.11; 1.2 (Tokens) blockt UI-Komponenten 1.5–1.12 (Epic 1 bereits done, hier nur Historie)
- Epic 4 Stories 4.6/4.7 (Compliance-Pages) sind ab 2026-05-16 DE-only — kein Epic-3-Translation-Pipeline-Block

**Final Validation passed.** Alle Coverage-Checks abgeschlossen, Stories ready für Development.

## Epic 8: Multi-Level-Inspector + Karten-Polygon-Highlight (Phase 2, Post-Hard-Launch)

**Status:** authored 2026-05-18 nach Epic-6-Recon-Phase. Aus Epic-6-Story-6.3-UX-Diskussion ausgegliedert: User-Wunsch globaler Level-Switch + alle Sections adaptieren + Karten-Polygon-Highlight ist 3-5x größer als Epic 6 Story 6.3 selbst und würde Bestehendes brechen (Compare-Mode, Bookmarks, WebMCP, Editorial-Disclaimer). Daher eigenes Epic, sequenziert nach Hard-Launch + Epic 6.

**Problem:**

Inspector zeigt aktuell Adress-Punkt-Daten (Layer-Hits per Point-in-Polygon). Aggregat-Sections (Kiez-Score, Bezirks-Stats) existieren als Annotationen, sind aber nicht als wählbarer Spatial-Level integriert. User-Mental-Model „Wie wählt MEIN Kiez im Vergleich zur Stadt?" wird nicht unterstützt — User muss zwischen Adress-Inspector + Bezirks-Page + Kiez-Page + Wo-lebt-es-sich-gut-Ranking wechseln statt im selben Surface zu cascaden.

**Vision:**

Inspector wird Multi-Spatial-Context-Surface:

- **Globaler Level-Selector** oben im Inspector: Adresse / Kiez / Bezirk / Berlin.
- **Alle Sections adaptieren** auf den gewählten Level. Punkt-Layer (Lärm, Luft, Bioklima, BRW, Wohnlage) werden pro Level zu Aggregaten (Median, Modus, Verteilung) statt Punkt-Werten.
- **Karte zeigt entsprechendes Polygon-Highlight** beim Level-Wechsel (Kiez-Border, Bezirk-Border, Berlin-Outline).
- **Compare-Mode** funktioniert über alle Levels gleich (same-level-lock).

**Risiko-Awareness:**

Globaler Inspector-Redesign ist High-Risk-Surface:

- Bricht garantiert Layer-Compare (Story 1.27), Bookmark-Inspector (Story 1.26), WebMCP-Tools (Story 2.7), Editorial-Disclaimer-Logik (Story 1.27).
- 50+ Tests müssten re-architected werden.
- Editorial-Decisions pro Layer (was bedeutet „Bodenrichtwert im Bezirk"? Avg ist irreführend. Stolpersteine „im Kiez" = Count? Density?).
- Geschätzte Effort: 3-4 Wochen Fokus-Arbeit ohne andere Stories.

**Hard-Constraints:**

- NICHT vor Hard-Launch.
- NICHT vor Epic 6 (Wahldaten brauchen die Multi-Level-Foundation erst nach eigenem Schiff).
- Wave-1-Architektur-ADR PFLICHT vor Implementation-Start (Layer-Aggregat-Strategie pro Layer dokumentieren + reviewen).

### Story 8.0: Multi-Level-Architektur-ADR + Layer-Aggregat-Strategy

As a Solo-Maintainer der nichts Bestehendes kaputt machen will,
I want vor jeder Implementation einen Architektur-ADR der pro Layer die Aggregat-Strategie definiert (numerisch=Median, ordinal=Modus, count=Density etc.) und die Backwards-Compatibility-Strategie für Compare/Bookmark/WebMCP festlegt,
so that wir nicht in 4 Wochen Hacks 50 Tests umschreiben.

**Acceptance Criteria:**

**Given** alle Inspector-Layer (Lärm, Luft, Bioklima, BRW, Wohnlage, Stolpersteine, Kitas, Schulen, ÖPNV-Stops, MSS-Soziale-Lage, Wahldaten)
**When** ich `docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md` schreibe
**Then** pro Layer ist die Aggregat-Strategie definiert (numerisch/ordinal/count/categorical-neutral) plus „nicht-sinnvoll-aggregierbar"-Flags
**And** Editorial-Disclaimer pro Layer ist spezifiziert (z.B. „Bodenrichtwert-Median im Bezirk ist methodisch fragwürdig, deshalb verzichten wir auf Bezirks-Aggregat")

**Given** bestehende Stories 1.26 (Bookmarks), 1.27 (Compare), 2.7 (WebMCP)
**When** ich die Backwards-Compatibility-Strategie definiere
**Then** Migrations-Plan steht: welche Sections kriegen Level-Switch sofort, welche bleiben adress-only, wie funktioniert Compare über Level-Wechsel, wie reagieren WebMCP-Tools auf Level-Parameter

### Story 8.1: Inspector globaler Level-Switch (Foundation)

As a User,
I want oben im Inspector einen globalen Level-Selector (Adresse/Kiez/Bezirk/Berlin),
so that ich die Spatial-Context-Tiefe für alle Sections gleichzeitig wählen kann.

**Acceptance Criteria:**

**Given** der ADR aus Story 8.0
**When** ich `inspector-level-context.svelte.ts` als Svelte-Runes-Context implementiere mit globalem `currentLevel: 'address' | 'kiez' | 'bezirk' | 'berlin'`
**Then** alle Inspector-Sections können via Context den aktuellen Level lesen und reagieren

**Given** der Context
**When** ich `inspector-level-toggle.svelte` oben im Inspector platziere (Segmented-Control oder Dropdown)
**Then** Level-Switch ist ein Klick, Default = Adresse (Backwards-Compatibility)

**Given** Backwards-Compatibility
**When** Inspector ohne Level-Context-Konsumenten rendert (z.B. Adress-Layer-Hits-Section)
**Then** Sections funktionieren exakt wie vorher (Adresse-Default-Behavior)

### Story 8.1b: Inspector-Card-System + Visual-Primitives

As a User,
I want dass jede Inspector-Sektion als Card mit aussagekräftigem Visual-Summary erscheint (auch im eingeklappten Zustand),
so that ich auf einen Blick erfasse was eine Sektion enthält, ohne sie aufklappen zu müssen.

**Hintergrund:** Foundation-Story für das visuelle Redesign (User-Decision 2026-05-20, mehr Daten-Dichte, Datenjournalismus-Look). Baut die geteilten Bausteine einmal, bevor 8.2b-Layer-Cards + Kiez-Score-Hero + Wahl-Card sie konsumieren. Verhindert doppelt gebaute Chart-Primitive + uneinheitliche Collapsible-Logik.

**Acceptance Criteria:**

**Given** der Visual-Summary-Constraint aus ADR-014 (Abschnitt 4)
**When** ich eine `inspector-card.svelte` mit collapsed/expanded-State implementiere
**Then** der collapsed-State rendert immer einen Visual-Summary-Slot + Kernwert, kein blindes Collapsible. Hero (Kiez-Score) ist default expanded, thematische Cards default collapsed.

**Given** die Visual-Typen aus ADR-014 Spalte 3
**When** ich die Chart-Primitive baue (Score-Bar mit Median-Anker, Verteilungs-Balken, Coverage-Bar, Distanz-Ring, Kiez-Score-Ring, Sparkline-reuse aus Story 6.3)
**Then** jedes Primitive ist eine eigenständige a11y-taugliche Komponente mit sr-only-Daten-Tabelle, konsistenter stigma-sicherer Palette (kein Rot-Grün-Wertung, Memory `project_compare_editorial_profiles`)

**Given** Kiez-Score-Hero
**When** das Hero rendert
**Then** Ring-Darstellung (User-Tendenz 2026-05-20) mit Gesamt-Score zentral + 5 Dimensionen. Compare-Fallback auf 5-Dim-Bar-Stack mit A/B-Paaren (Ring mit zwei Datensätzen unleserlich).

**Given** Performance-Constraint
**When** viele Cards collapsed mit Mini-Visual rendern
**Then** Visuals werden lazy gerendert (collapsed-Visual leichtgewichtig, schweres Detail erst bei expand)

### Story 8.2a: Layer-Aggregat-Pipeline (Build-Time-Pre-Aggregation)

As a Solo-Maintainer,
I want eine Build-Time-Stage die pro Inspector-Layer und Level (Kiez/Bezirk/Berlin) die Aggregate vorberechnet und persistiert,
so that der Inspector zur Laufzeit fertige Aggregat-Werte liest statt teure Spatial-Queries über große GeoJSONs zu fahren.

**Hintergrund (Lücken-Analyse 2026-05-20):** Nur Kiez-Score (ADR-013-JSON) und Wahldaten (DB-Tabellen) sind heute vor-aggregiert. Lärm, Luft, Wohnlage, Bioklima, MSS, Klima-Coverage etc. existieren nur als Polygon-GeoJSON ohne Pre-Aggregat. Ohne diese Stage hätte Story 8.2b keine Input-Daten.

**Acceptance Criteria:**

**Given** ADR-014-Aggregat-Strategie pro Layer (numeric-median, ordinal-distribution, coverage-share, area-share)
**When** ich eine Build-Time-Stage (`pnpm data:layer-aggregate` oder analog) implementiere die pro aggregierbarem Layer × {kiez, bezirk, berlin} die Aggregate aus den Source-GeoJSONs rechnet
**Then** Output liegt als JSON oder Postgres-Cache vor, deterministisch reproduzierbar, mit Missing-Data-Threshold 50% (ADR-013-Regel)

**Given** Point-Layer (Kitas, ÖPNV-Stops, Stolpersteine)
**When** die Pipeline läuft
**Then** Point-Layer sind ausgenommen (Runtime-Count/Distanz im Polygon ist günstig genug), nur Polygon-Aggregate werden vorberechnet

**Given** not-aggregatable Layer (Bodenrichtwert)
**When** die Pipeline läuft
**Then** kein Aggregat wird erzeugt, Layer ist als `not-aggregatable` markiert (ADR-014)

### Story 8.2b: Layer-Sections Multi-Level-Adapter (Numeric + Ordinal)

As a User,
I want dass numerische Layer (Lärm, Luft, Bioklima) und ordinale Layer (Wohnlage) pro Level entsprechend adaptiert dargestellt werden,
so that „Lärm im Kiez" als Median + Verteilung statt einzelner Punkt-Wert zeigt.

**Acceptance Criteria:**

**Given** die Pre-Aggregate aus Story 8.2a + ADR-014-Visual-Typ pro Layer
**When** ich `aggregate-layer-for-level.ts` als Pure-Function implementiere die pro Level-Slug das passende Aggregat liefert (liest Pre-Aggregate, kein Live-Spatial)
**Then** Inspector-Sections konsumieren Aggregate via einheitliches Interface

**Given** der visuelle Card-Stil (User-Decision 2026-05-20, mehr Daten-Dichte)
**When** eine Card rendert
**Then** collapsed-State trägt Mini-Visual + Kernwert (Verteilungs-Balken / Score-Bar mit Median-Anker / Coverage-Bar), kein blindes Collapsible

**Given** Editorial-Disclaimer pro Layer
**When** ein Layer für ein Level nicht sinnvoll aggregierbar ist (z.B. BRW-Bezirks-Median)
**Then** Section rendert „auf diesem Level nicht sinnvoll" + Begründung statt fake-Aggregat

### Story 8.3: Karten-Polygon-Highlight beim Level-Switch

As a User,
I want dass die Karte beim Level-Wechsel das entsprechende Polygon zeigt (Kiez-Outline, Bezirk-Outline, Berlin-Outline),
so that ich räumlich verstehe was „Kiez" oder „Bezirk" gerade konkret meint.

**Acceptance Criteria:**

**Given** der globale Level-Context aus Story 8.1
**When** Level auf Kiez/Bezirk/Berlin wechselt
**Then** MapLibre-Highlight-Layer rendert das entsprechende Polygon mit subtilem Accent-Stroke + Semi-Transparent-Fill
**And** Adress-Marker bleibt sichtbar
**And** Bei Level=Adresse wird kein Polygon-Highlight gerendert

**Given** Performance-Constraints
**When** Polygon-Daten geladen werden (Kieze und Bezirke sind bereits in Layer-Pipeline)
**Then** Highlight nutzt existierende Source-Daten, kein extra Fetch

### Story 8.4: Compare-Mode-Multi-Level-Integration

As a User der zwei Adressen vergleicht,
I want dass der Compare-Mode mit Multi-Level kombinierbar ist (Adresse A vs. Adresse B auf Kiez-Level),
so that „Wie vergleichen sich die Kieze meiner Adresse A und meines Compare-Targets B?" funktioniert.

**Acceptance Criteria:**

**Given** Story 1.27 Compare-Mode + Story 8.1 Level-Context
**When** User im Compare-Mode den Level wechselt
**Then** beide Adressen werden auf gleichem Level dargestellt (same-level-lock, kein Mismatch erlaubt)
**And** Karten-Polygon-Highlight zeigt beide Kieze/Bezirke gleichzeitig

### Story 8.5: WebMCP-Tools Multi-Level-Parameter

As a LLM-Agent,
I want alle existierenden WebMCP-Tools um optionalen `level`-Parameter erweitern,
so that „Wie ist die Lärm-Belastung im Kiez X?" mit gleichem Tool funktioniert wie „an Adresse Y".

**Acceptance Criteria:**

**Given** die existierenden WebMCP-Tools (Story 2.7 + Story 6.8)
**When** ich pro Tool optional `level: 'address' | 'kiez' | 'bezirk' | 'berlin'` ergänze
**Then** Tools liefern Aggregat-Werte entsprechend ADR-014-Strategie
**And** Backwards-Compatibility: ohne Level-Param ist Default = address

### Epic 8 Status

7 Stories total: 8.0 ADR + Layer-Aggregat-Strategy (Pflicht-Foundation, ADR-014 geschrieben 2026-05-20), 8.1 Globaler Level-Switch, 8.1b Card-System + Visual-Primitives (NEU 2026-05-20), 8.2a Layer-Aggregat-Pipeline (Pre-Aggregation, NEU nach Lücken-Analyse 2026-05-20), 8.2b Layer-Sections-Adapter, 8.3 Karten-Polygon-Highlight, 8.4 Compare-Mode-Integration, 8.5 WebMCP-Multi-Level.

Sequencing: Epic 8 ist Phase 2b, sequenziert NACH Hard-Launch + NACH Epic 6 Wahldaten. 8.0 ADR ist Pflicht-Block vor jeder Implementation (erledigt). 8.1 hard-block für 8.1b/8.2b/8.3/8.4. 8.1b hard-block für 8.2b (Layer-Cards brauchen Primitive). 8.2a hard-block für 8.2b und 8.5 (beide brauchen die Pre-Aggregate, static JSON laut ADR-014 Abschnitt 8). Parallel-möglich: 8.1 + 8.2a + 8.3 als erste Welle, dann 8.1b, dann 8.2b + 8.4 + 8.5.

Wave-Plan:
- Wave 1: 8.0 (sequenziell, ADR + Review)
- Wave 2: 8.1 (sequenziell, Context-Foundation)
- Wave 3: 8.2 + 8.3 + 8.4 + 8.5 (parallel)

**Hard-Constraints:** kein Start vor Hard-Launch + Epic 6 done.

**Out-of-Scope (Phase 3 Epic 9 Kandidaten):**

- 3D-Inspector-Cascade-Animation
- Inspector als Floating-Window statt Fixed-Panel
- Cross-Device-State-Sync (Mobile-↔-Desktop-Hand-off)
- Multi-Bookmark-Compare (3+ Adressen)

## Epic 9: Score-Recomposition (Umwelt- & Infrastruktur-Score)

**Status:** authored 2026-05-20. Quelle: `docs/adr/ADR-015-score-composition-umwelt-infra.md`. Ausgelöst durch Inspector-Redesign-Diskussion (Epic 8 Multi-Level-Toggle verworfen): beim Aufräumen fiel der Kern-Widerspruch des Kiez-Scores auf.

**Problem:**

Der Kiez-Score (ADR-013, Story 1.28) wichtet „Soziale Lage" (MSS-Strukturdaten) als Dimension mit ein, behauptet im Disclaimer aber „keine Wohnqualität". Das beißt sich: ein Kiez mit höherem Sozialstatus scort „besser" und stigmatisiert damit Kieze mit niedrigem Status als „schlechter zu leben" — genau die rote Linie, die das Projekt sich gesetzt hat (`feedback_no_lebenswert`, `project_compare_editorial_profiles`). Zusätzlich mischt der Score eine value-geladene, kontestierte Größe in ein sonst klar gerichtetes Set.

**Vision (ADR-015):**

Der Score misst nur Größen mit eindeutiger Besser-Richtung für jeden Bewohner (Luft, Ruhe, Grün, Hitzeschutz, Erreichbarkeit, Verdrängungsschutz). Sozialstruktur ist kein Qualitäts-Kriterium → raus aus dem Score, rein als neutraler Kontext. Ehrliche Benennung: **Umwelt- & Infrastruktur-Score**.

- **Score-Dimensionen (5 × 0.20):** Ruhe & Luft · Grün & Hitze · Mobilität · Versorgung · Wohnschutz (Milieuschutz, positiv-eindeutig).
- **Neutraler Kontext (nicht gescort):** MSS/Soziale Lage, Umweltgerechtigkeit, Wohnlage, Bodenrichtwert. Bezahlbarkeit bleibt bewusst draußen.
- **Persona-Gewichtung (Idee B):** separates späteres Epic, `persona`-Slot bleibt.

**Risiko-Awareness:**

Größter Single-Change des Projekts. Blast-Radius ~45 Files: Pipeline, DB-Schema (`kiez_score`/`bezirk_score`-Spalten), alle Score-Komponenten, Choropleth-/Map-Score-Layer, Ranking-Tabelle, OG-Cards, LLM-Renderer, Methodik-Seite, „wo-lebt-es-sich-gut". Strikt dependency-getrieben sequenzieren, jede Stufe grün vor der nächsten.

**Hard-Constraints:**

- ADR-015 ist der Anker (Accepted). Supersedet die Dimensions-Festlegung aus ADR-013 (Aggregations-Strategie A bleibt gültig).
- Stigma-Disziplin: MSS/Wohnlage/Bodenrichtwert/Umweltgerechtigkeit bleiben wertungsneutral, kein „besser".
- 9.1 hard-block für alle folgenden (Typ-Union ist Fundament). 9.2 vor 9.3. 9.3 (Re-Run) vor 9.4/9.5.

### Story 9.1: Score-Dimensions-Foundation (Typ-Union + Config + Gewichte)

As a Solo-Maintainer,
I want die Score-Dimensionen zentral auf das neue Set umstellen (Typ-Union + dimension-config + Gewichte),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren können.

**Acceptance Criteria:**

**Given** ADR-015
**When** ich `scripts/lib/kiez-score/types.ts` `KiezScoreDimension` auf `'ruhe-luft' | 'gruen-hitze' | 'mobilitaet' | 'versorgung' | 'wohnschutz'` umstelle
**Then** `soziale-lage` ist entfernt, `gruen` → `gruen-hitze` umbenannt, `wohnschutz` neu, `KIEZ_SCORE_DIMENSIONS` + `DIMENSION_WEIGHTS` (5 × 0.20) konsistent

**Given** `dimension-config.ts`
**When** ich die Layer-Zuordnung pro Dimension neu setze
**Then** Grün & Hitze enthält gruenversorgung/gruenanlagen/bioklima/klima-pet/kaltluft/leitbahn, Wohnschutz enthält milieuschutz-* (presence, positiv), Ruhe & Luft nur laerm/luft. MSS + Umweltgerechtigkeit sind KEINE Score-Inputs mehr.

**Given** TDD (ADR-012)
**When** compute-score/dimension-config-Tests laufen
**Then** Tests spiegeln das neue Set, Gewichts-Summe = 1, kein Verweis mehr auf soziale-lage als Score-Input

### Story 9.2: DB-Schema-Migration (kiez_score + bezirk_score)

As a Solo-Maintainer,
I want das Postgres-Schema auf die neuen Dimensions-Spalten migrieren,
so that der Build-Time-Cache die neue Komposition persistiert.

**Acceptance Criteria:**

**Given** die Foundation aus 9.1
**When** ich eine Drizzle-Migration schreibe
**Then** `kiez_score` + `bezirk_score`: `soziale_lage` entfernt, `gruen` → `gruen_hitze`, `wohnschutz` neu (doublePrecision, nullable), `composite` bleibt

**Given** die Migration
**When** `pnpm db:migrate` läuft
**Then** Schema ist konsistent, bestehende Queries (`getKiezScore`/`getBezirkScore`) kompilieren gegen die neuen Spalten

### Story 9.3: Pipeline-Recompute + Re-Run

As a Solo-Maintainer,
I want die Score-Pipeline auf das neue Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die neue Komposition enthalten.

**Acceptance Criteria:**

**Given** 9.1 + 9.2
**When** ich `compute-score.ts`/`build-kiez-scores.ts`/`aggregate-scores.ts` auf das neue Set anpasse
**Then** `pnpm data:kiez-scores` + `data:aggregate-scores` produzieren deterministische Outputs mit den 5 neuen Dimensionen, Wohnschutz aus Milieuschutz-Presence

**Given** Re-Run
**When** die Pipeline durchläuft
**Then** `static/kiez-scores/kiez-scores.json` + DB-Tabellen neu, MSS/Umweltgerechtigkeit erscheinen NICHT als Score-Dimension

### Story 9.4: Konsumenten-Migration (UI + Map + OG + LLM)

As a User,
I want dass alle Score-Darstellungen das neue Dimensions-Set zeigen,
so that Inspector, Compare, Ranking, Karte, OG-Cards und LLM-Export konsistent sind.

**Acceptance Criteria:**

**Given** die neuen Scores aus 9.3
**When** ich `kiez-score-display.ts` (Labels), Inspector-Score (Hero/Ring/Section), `kiez-score-compare-block`, `score-ranking-table`, Choropleth-Score-Layer (`choropleth-family`/`layer-style-builder`/`layer-synonyms`/`layer-palette-filter`), `score-card-data` (OG), LLM-Renderer migriere
**Then** überall erscheinen Ruhe & Luft / Grün & Hitze / Mobilität / Versorgung / Wohnschutz; kein „Soziale Lage" als Score-Dimension mehr

**Given** Stigma-Disziplin
**When** MSS/Wohnlage/Bodenrichtwert/Umweltgerechtigkeit als neutraler Kontext gerendert werden
**Then** keine Severity-Wertung, kein „besser"-Pfeil (categorical-neutral)

### Story 9.5: Content-Migration (Methodik + wo-lebt-es-sich-gut)

As a User,
I want dass Methodik-Seite und Ranking-Page die neue Komposition + Begründung erklären,
so that die Score-Logik transparent und ehrlich kommuniziert ist.

**Acceptance Criteria:**

**Given** ADR-015
**When** ich `/methodik/kiez-score` aktualisiere
**Then** die 5 neuen Dimensionen + Gewichte sind erklärt, plus der Anti-Stigma-Grund (warum Sozialstruktur NICHT gescort wird, Bezahlbarkeit bewusst draußen)

**Given** `/wo-lebt-es-sich-gut`
**When** die Seite die neuen Scores nutzt
**Then** Ranking + Texte spiegeln die neue Komposition, kein Verweis auf „Soziale Lage" als Score-Dimension

### Story 9.6: Erinnerung-Layer aus Frontend entfernen

As a User,
I want dass Denkmal + Stolpersteine nicht mehr im Frontend erscheinen,
so that der Inspector auf Lebensqualität fokussiert bleibt (Erinnerungs-Orte passen konzeptionell nicht zwischen Umwelt/Wohn-Daten).

**Acceptance Criteria:**

**Given** User-Decision 2026-05-20
**When** ich Denkmal (`denkmal-2024`) + Stolpersteine (`stolpersteine`) aus Inspector, Map-Palette und Section-Mapping entferne
**Then** sie erscheinen nicht mehr im Frontend (Inspector-Section, Layer-Palette, Map-Layer), zugehörige Custom-Components (StolpersteinDetail) + Memorial-Section entfallen oder werden inert

**Given** Backwards-Compat
**When** die Layer entfernt sind
**Then** keine Broken-Links/leeren Sections, Tests grün, Daten-Pipeline (falls Layer noch gefetcht) entweder bereinigt oder als nicht-inspector-relevant markiert

**Sequencing:** 9.1 → 9.2 → 9.3 (Foundation→Schema→Re-Run, strikt sequenziell). Danach 9.4 + 9.5 parallel-möglich. 9.6 (Erinnerung-Removal) ist unabhängig, kann jederzeit (auch zuerst als Warm-up).

## Epic 10: Daten-Tiefe & -Auflösung (vorhandene Layer ausreizen)

**Status:** authored 2026-05-21. Quelle: `_user-input/datenaufloesung-audit-2026-05-21.md`. Ausgelöst durch Audit-Frage „basic oder verbesserbar" + vier Layer-Render-Befunde aus Screenshots.

**Problem:**

Die Pipeline holt reiche Quelldaten und wirft Auflösung weg, um schnell zu liefern. Drei Muster:

- **Versorgung-Score = reine Luftlinie.** Kapazitätsfelder kommen mit, fließen nie in den Score. Live geprüft: `kita.e_platz` zu 99% gefüllt (Range 1–310, Median 30), `krankenhaeuser.betten`/`betten_insgesamt` + `fachabteilungen` vorhanden, `schulen.schulart` ungenutzt im Score. Eine 20-Platz-Kita zählt wie eine 200-Platz-Kita.
- **Kein Nenner.** Keine Einwohnerzahl, kein Pro-Kopf. Einwohner-CSV (542 LOR-Planungsräume, Altersjahre, CC-BY, 31.12.2024) joint trivial über `plr_id` auf vorhandene LOR-Geometrie.
- **Render-Bugs maskieren Datenqualität.** Umweltgerechtigkeit zeigt 35% weiße Polygone (Kategorie-Mapping-Bug, nicht Auflösung), Milieuschutz ist durch blasses Styling fast unsichtbar, PET-Lücken sind quellbedingt und unerklärt.

**Vision:**

Versorgung von „wie weit zur nächsten Einrichtung" zu „wie viel Angebot pro Kopf". Neutraler Demografie-Kontext aus vorhandenem CSV. Render-Bugs raus, damit die Daten zeigen was sie können.

**Hard-Constraints:**

- **Abhängig von Epic 9.** Stories 10.1–10.4 ändern die Versorgung-Dimension. Epic 9 (Score-Recomposition) muss gelandet sein, sonst Merge-Konflikt im `dimension-config.ts`. Render-Bug-Stories (10.7–10.9) sind score-unabhängig und können sofort.
- **Anti-Stigma (ADR-015).** Einwohnerdichte + Altersstruktur sind neutraler Kontext, KEIN Score-Input (Dichte hat keine Besser-Richtung). Wie MSS rendern.
- **Pro-Kopf ändert Score-Semantik.** Methodik-Seite anpassen, ADR-Notiz für die Versorgung-Neudefinition.
- **TDD (ADR-012).** Normalisierung + Join + Mapping-Fix sind Business-Logic → Test-First. Reines Styling (10.8) ist ausgenommen.

### Story 10.0: Einwohner-LOR-Join-Foundation

As a Solo-Maintainer,
I want die Einwohner-CSV pro LOR-Planungsraum als joinbaren Demografie-Datensatz in die Pipeline holen,
so that Pro-Kopf-Metriken und ein Demografie-Kontext-Block eine einzige Datenquelle teilen.

**Acceptance Criteria:**

**Given** die CSV „Einwohner LOR-Planungsräume 31.12.2024" (CC-BY, Amt für Statistik)
**When** ein Fetch+Parse-Schritt sie über die 8-stellige LOR-ID auf `plr_id` joint
**Then** entsteht ein deterministischer Datensatz pro 542 LOR mit abgeleiteten Aggregaten: Gesamt-Einwohner, Kinder 0–6, Kinder 6–12, Senioren 65+, Einwohnerdichte (EW/km² aus LOR-Fläche)

**Given** TDD
**When** Parser-/Join-Tests laufen
**Then** Altersjahr-Bucketing + Dichte-Berechnung sind getestet, fehlende/unplausible LOR fallen sauber auf `null` (kein Crash)

**Given** Lizenz-Disziplin
**When** der Datensatz publiziert wird
**Then** CC-BY-Attribution „Amt für Statistik Berlin-Brandenburg" ist in der Quellen-/Methodik-Doku hinterlegt

### Story 10.1: Versorgung — Kita-Plätze pro Kind (V1)

As a Familie,
I want dass die Kita-Versorgung das Platzangebot im Verhältnis zu den Kindern im Kiez misst,
so that ich sehe ob ich realistisch einen Platz bekomme, nicht nur wie weit die nächste Kita ist.

**Acceptance Criteria:**

**Given** 10.0 + `kita.e_platz` (99% gefüllt)
**When** die Versorgung-Dimension einen Pro-Kopf-Term „Kita-Plätze pro Kind 0–6 im LOR" erhält
**Then** ein LOR mit hohem Platz-Kind-Verhältnis scort besser, ein unterversorgter schlechter, unabhängig von der reinen Distanz

**Given** TDD
**When** Normalisierungs-Tests laufen
**Then** Verhältnis-Berechnung + Schwellen + Missing-Data (LOR ohne Kinder/ohne Kita) sind getestet

**Given** Score-Semantik-Änderung
**When** die Methodik aktualisiert wird
**Then** „Versorgung" erklärt Distanz UND Pro-Kopf-Angebot

### Story 10.2: Versorgung — Krankenhaus nach Betten/Fachabteilung (V2)

As a User,
I want dass ein großes Versorgungs-Klinikum stärker zählt als eine kleine Fachklinik,
so that der Versorgungs-Score reale Kapazität abbildet.

**Acceptance Criteria:**

**Given** `betten`/`betten_insgesamt` + `fachabteilungen` (vorhanden, ungenutzt)
**When** der Krankenhaus-Term den Distanz-Score um Kapazität/Breite gewichtet
**Then** Bettenzahl + Fachabteilungs-Breite fließen ein, `betten_insgesamt` (string) + `betten` (int) werden einheitlich geparst

**Given** TDD
**When** Tests laufen
**Then** Parsing beider Felder + Gewichtung + Missing-Data getestet

### Story 10.3: Versorgung — Schulart-Differenzierung (V3)

As a Familie,
I want dass Grundschul-Nähe anders zählt als Gymnasium-Nähe,
so that der Versorgungs-Score zur Lebensphase passt.

**Acceptance Criteria:**

**Given** `schulen.schulart` (vorhanden, nur als Text genutzt)
**When** der Schul-Term nach Schulart eigene Distanz-Schwellen nutzt
**Then** Grundschule (kurze Schwelle) und weiterführende Schule (längere Schwelle) werden getrennt bewertet statt in einem Topf

**Given** TDD
**When** Tests laufen
**Then** Schulart-Mapping + getrennte Schwellen getestet, unbekannte Schulart fällt auf neutralen Default

### Story 10.4: POI-Score von Nächste-Distanz auf Dichte (V5)

As a User,
I want dass mehrere Einrichtungen im Umkreis besser zählen als nur die nächste,
so that ein gut versorgter Kiez sich von einem mit genau einer Einrichtung unterscheidet.

**Acceptance Criteria:**

**Given** die POI-Layer (kita/schule/krankenhaus/spielplatz)
**When** der Score von „Distanz zum nächsten" auf „Anzahl im Radius (optional pro Kopf)" umgestellt wird
**Then** der „zweiter Punkt zählt 0"-Effekt entfällt, der weiche Tail jenseits der Schwelle ersetzt den harten Cliff

**Given** TDD
**When** Tests laufen
**Then** Dichte-Zählung + Radius + Normalisierung getestet, Performance gegen große Point-Sets geprüft

**Given** Konsistenz
**When** 10.1–10.3 schon gelandet sind
**Then** die Pro-Kopf-/Kapazitäts-Terme bleiben kompatibel mit der Dichte-Umstellung

### Story 10.5: Einwohnerdichte + Altersstruktur als Kontext-Block (V4)

As a User,
I want das Bevölkerungsprofil meines Kiezes als neutralen Kontext sehen,
so that ich „jung/alt, dicht/locker" verstehe, ohne dass es als Qualitätswertung erscheint.

**Acceptance Criteria:**

**Given** 10.0 + ADR-015 (Dichte = neutral, kein Score-Input)
**When** der Inspector einen Demografie-Block zeigt (Einwohnerdichte, Altersstruktur)
**Then** er rendert categorical-neutral wie MSS, kein „besser"-Pfeil, keine Severity

**Given** Konsistenz-Disziplin
**When** der Block angezeigt wird
**Then** klare Trennung: Kontext-Block ≠ Score-Dimension, Stand + Quelle (CC-BY) sichtbar

### Story 10.6: Lärm-dB-Upgrade — Spike (V6)

As a Solo-Maintainer,
I want prüfen ob die Strategischen Lärmkarten 2022 (fassadengenaue dB) den 3-Stufen-Umweltgerechtigkeits-Index ersetzen können,
so that „Ruhe & Luft" feiner auflöst statt 542 LOR-Mittelwerte.

**Acceptance Criteria:**

**Given** Strategische Lärmkarten 2022 (L_DEN + L_Night, Raster/GeoTIFF)
**When** ich Format, Größe und Integrationsweg evaluiere
**Then** ein Spike-Ergebnis dokumentiert: Datenvolumen, ob Tile-Pipeline (PMTiles/MVT) nötig, Aufwand vs. Auflösungsgewinn, Hit-Strategie für Adress-Lookup

**Given** das Spike-Ergebnis
**When** entschieden wird
**Then** entweder Folge-Story (Tile-Integration) oder bewusstes Defer mit Begründung, analog solarpotenzial/klimaanalyse

### Story 10.7: Umweltgerechtigkeit — Kategorie-Mapping-Fix

As a User,
I want dass alle 542 LOR der Umweltgerechtigkeit korrekt eingefärbt sind,
so that die Karte nicht 35% weiße Lücken zeigt, die keine sind.

**Acceptance Criteria:**

**Given** die Quell-Kategorien `keine starke Belastung` (187), `einfach`, `zweifach`, `dreifach`, `vierfach`, `fünffach` (3)
**When** ich `choropleth-mehrfach` (`layer-style-builder.ts:444`) korrigiere
**Then** `keine starke Belastung` + `fünffach` bekommen eigene Farben, kein Polygon fällt mehr auf `COLORS.bg`, die 5-/6-stufige Skala ist vollständig

**Given** die Legende
**When** sie gerendert wird
**Then** Labels spiegeln die echten Kategorien (`keine starke Belastung` statt `keinfach`, `fünffach` ergänzt)

**Given** TDD
**When** Mapping-Tests laufen
**Then** jede Quell-Kategorie hat einen Match, Default greift nur bei echt unbekanntem Wert

### Story 10.8: Milieuschutz-Sichtbarkeit — Styling-Fix

As a User,
I want dass Milieuschutz-Gebiete auf der Karte klar erkennbar sind,
so that ich den Verdrängungsschutz (Score-Input Wohnschutz) tatsächlich sehe.

**Acceptance Criteria:**

**Given** Family `polygon-outline-soft` (`#E0E4F0` × Opacity 0.35, fast unsichtbar)
**When** ich Erhaltungsmiete + Städtebau ein kräftigeres Fill + erkennbare Umriss-Linie gebe
**Then** beide Layer sind auf dem hellen Basemap klar lesbar, mit ausreichendem Kontrast (WCAG)

**Given** zwei Milieuschutz-Typen
**When** beide gleichzeitig aktiv sind
**Then** sie sind visuell unterscheidbar (Farbe oder Muster), Legende benennt beide

### Story 10.9: Gefühlte Temperatur — flächendeckend (Straße + Grünfläche mergen)

As a User,
I want eine PET-Karte ohne Lücken,
so that ich die Hitzebelastung überall sehe, nicht nur auf Wohnblöcken.

**Acceptance Criteria:**

**Given** der Klimaanalyse-WFS publiziert PET in drei Flächen-Varianten mit identischem `pet14h`-Feld (live geprüft 2026-05-21): `pa_ua_pet_siedlg_2022` (Siedlung, genutzt), `pb_ua_pet_str_2022` (Straßenraum), `pc_ua_pet_grfrei_2022` (Grün-/Freifläche)
**When** ich `pb` + `pc` zusätzlich fetche und mit `pa` zu einem Layer merge
**Then** PET deckt Berlin flächendeckend ab (Siedlung + Straße + Grünfläche = vollständige, überschneidungsfreie Partition), die Lücken im Screenshot entfallen

**Given** der gemergte Layer
**When** die Score-Berechnung den PET-Hit liest
**Then** Adressen treffen direkt häufiger (Straßenraum/Hof jetzt abgedeckt), der `nearestPolygonFallbackKm`-Workaround greift seltener, Hit-Rate steigt

**Given** Dateivolumen
**When** der Merge die Feature-Zahl erhöht
**Then** Simplify-Profil + Größe geprüft, ggf. `keep-shapes` analog PET-Story 1.25

**Given** Rest-Lücken (Wasserflächen ohne PET)
**When** der Layer aktiv ist
**Then** Layer-Text erklärt verbliebene Leerflächen (Gewässer), kein Datenfehler

**Optionale Erweiterung:** UTCI (`ra/rb/rc_ua_utci_2022`) liegt im selben WFS als alternativer, moderner Wärmebelastungs-Index vor. Spike-würdig, ob UTCI PET als Score-Input ablöst. Separate Entscheidung, nicht Teil dieser Story.

**Sequencing:** 10.7 + 10.8 + 10.9 sind score-unabhängige Quick-Wins, sofort machbar (auch als Warm-up). 10.0 ist Hard-Block für 10.1 + 10.5. 10.2 + 10.3 brauchen nur WFS-Felder (kein 10.0). 10.1–10.4 hängen an Epic 9 (stabile Versorgung-Dimension). 10.4 zuletzt im Versorgung-Block (umfassendster Refactor). 10.6 ist ein Spike, Ergebnis entscheidet über Folge-Story.

## Epic 11: Kiez/Bezirk Content-Tiefe & AEO (Discovery-Surface aufwerten)

**Status:** authored 2026-06-06. Quelle: `_user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md`. Ausgelöst durch Owner-Befund „FAQ generisch" + Analyse aus SEO-, AEO- und User-Perspektive. Stories hier in Format der bestehenden Epics, Voll-Ausformulierung pro Story später separat.

**Problem:**

Die Kiez- (143 LOR-BZR) und Bezirks-Seiten (12) sind datenstark, aber sprachlos. Drei Muster:

- **FAQ generisch.** FAQ = YAML-Templates × Aggregat-Wert (`scripts/render-faq.ts`, `src/lib/data/faq-templates/*/*.de.yaml`). Im Lärm-Cluster haben 6 von 8 Templates `requires: []`, also null Kiez-Bezug: identischer Erklärtext auf allen 155 Seiten. Für Answer Engines ist das Duplicate-Content. Die 2 spezifischen Templates liefern nur einen Ordinalwert pro Cluster.
- **Daten verschenkt.** `kiez_stats`/`kiez_score` halten 8 Cluster, 5 Score-Dimensionen, Verteilungen und Zähldaten. Die Seite zeigt nur den Dominant-Wert je Cluster (`src/lib/components/atlas/kiez-hero.svelte:188`). Kein Rang, kein Vergleich, keine Verteilung, keine konkrete Zahl.
- **Keine Entitäten-Konsistenz.** JSON-LD liefert Place/AdministrativeArea/Breadcrumb (`+page.svelte:98-100`) und FAQPage (`faq-section.svelte:35`), aber kein `sameAs` zu Wikidata/Wikipedia. E-E-A-T- und Entitäten-Signal für AEO fehlt.

**Vision:**

Jede Kiez/Bezirks-Seite trägt einzigartige, vergleichende, belegte Aussagen statt wiederholter Erklärungen. Ranking („Platz 12 von 143 bei Grün"), Vergleich (Kiez ↔ Bezirk ↔ Berlin) und konkrete Zahlen aus eigenen Daten. Optional grounded KI-Profile in Prosa. Externe Entitäten verankern die Seiten in der Knowledge-Graph-Welt.

**Hard-Constraints:**

- **DE-only (User-Lock i18n-Phase-1).** Keine EN-Varianten. Neue FAQ-Templates und Profile nur `de`.
- **TDD (ADR-012).** Ranking-Berechnung, Vergleichs-Berechnung, FAQ-Render-Änderungen, Profil-Generierung und Fakten-Lint sind Business-Logic → Test-First. Reines Styling/Markup ausgenommen.
- **Anti-Stigma (ADR-015).** Ranking und Vergleich dürfen schwache Kieze nicht stigmatisieren. Framing neutral (über/unter Schnitt), kein „schlechtester Kiez". Bei schwachen Werten Quartil statt exaktem letztem Rang (kein „Platz 143 von 143"). Editorial-Verantwortung wie bei MSS.
- **Quellen-Attribution (FR40).** Jeder neu gezeigte Wert behält sein `AggregateValue`-Triple (value/layer/sourceUpdatedAt). Externe Quellen mit Lizenz dokumentiert.
- **AEO-Duplicate-Content.** Erklär-FAQ (`requires: []`) gehört auf Methodik-Seiten, nicht 155-fach auf Detailseiten.
- **KI-Grounding.** Profile nur über vorhandene Werte. Fakten-Lint gated den Build (nicht den Publish). Editorial-Gate-Muster existiert: `lint:wahl`, `scripts/publish-update/forbidden-tokens.ts`.
- **Profil-Generierung entkoppelt vom Deploy (Owner-Decision 2026-06-06).** Generierung läuft NICHT in `prebuild`. Eigener Script `pnpm data:profiles`, Owner-getriggert lokal (oder manueller GH-Action), nur bei Daten-Änderung. Inkrementell per Input-Hash (Aggregat + Ranking), regeneriert nur Geändertes. Output sind committete Content-Files `src/lib/content/kiez-profile/*.md` (im PR reviewbar, reproduzierbar, Build liest statisch, null LLM-Calls beim Deploy).
- **Modellwahl Claude API zur Authoring-Zeit (Owner-Decision 2026-06-06).** US-Anbieter nur offline beim Generieren, nicht im Production-Pfad. EU-FOSS-Ausnahme (Epic 4) in neuer ADR dokumentiert, weil Authoring-Zeit ≠ Production-Pfad (analog CI).
- **Begriff.** „Kiez" ist bewohnerdefiniert, nicht deckungsgleich mit LOR-BZR. Gleichsetzung auf Methodik-Seite transparent machen.

**Abhängigkeiten:** 11.0 (Ranking) ist Hard-Block für 11.3, 11.4 und 11.6. 11.1 (Wikidata) ist unabhängig, Quick-Win zuerst. 11.7 gated 11.6. 11.8 ist optional und speist 11.6.

### Story 11.0: Ranking- & Quartil-Foundation (Build-Step)

As a Solo-Maintainer,
I want pro Score-Dimension und Schlüssel-Metrik einen deterministischen Rang und ein Quartil über alle 143 Kieze (und 12 Bezirke),
so that Detailseiten und FAQ vergleichende Aussagen ohne Laufzeit-Berechnung ziehen können.

**Acceptance Criteria:**

**Given** `kiez_score`/`kiez_stats` mit 143 Zeilen
**When** ein Aggregat-Schritt pro Dimension (ruheLuft, gruenHitze, mobilitaet, versorgung, wohnschutz) und pro Schlüssel-Metrik den Rang 1..143 und das Quartil ableitet
**Then** entsteht ein deterministischer Datensatz pro Kiez mit Rang + Quartil je Dimension, analog für 12 Bezirke

**Given** TDD
**When** Ranking-/Quartil-Tests laufen
**Then** Tie-Handling, Missing-Data (Dimension `null`) und Quartil-Grenzen aus `docs/scoring-methodology.md` sind getestet, kein Crash bei Lücken

**Given** Anti-Stigma (ADR-015)
**When** der Rang gespeichert wird
**Then** das Schema trägt Rang + Quartil neutral, ohne wertende Labels; Framing entsteht erst im Render

### Story 11.1: Wikidata-/Wikipedia-Entitäten als sameAs in JSON-LD

As a Discovery-User über AI-Suche,
I want dass Kiez/Bezirks-Seiten auf ihre Wikidata- und Wikipedia-Entität verweisen,
so that Answer Engines die Seite eindeutig einer bekannten Entität zuordnen.

**Acceptance Criteria:**

**Given** Wikidata (CC0) und Wikipedia je Bezirk und, wo vorhanden, je Ortsteil
**When** ein Build-Schritt Entitäts-IDs über Name/Koordinate matcht und in das Place/AdministrativeArea-JSON-LD als `sameAs` schreibt
**Then** die Seite trägt `sameAs`-Links, ohne falsche Zuordnung bei Namensgleichheit (Match per Centroid verifiziert)

**Given** TDD
**When** der Entitäts-Match getestet wird
**Then** Mehrdeutigkeit und Kein-Treffer fallen sauber auf „kein sameAs" (kein erfundener Link)

**Given** Lizenz-Disziplin
**When** Entitäts-Daten genutzt werden
**Then** Quelle Wikidata (CC0) / Wikipedia (CC-BY-SA) ist in der Methodik-/Quellen-Doku hinterlegt

### Story 11.2: FAQ-Entrümpelung — Erklär-Templates auf Methodik bündeln

As a Discovery-User,
I want auf der Kiez/Bezirks-Seite nur kiez-spezifische Fragen sehen,
so that die Seite einzigartig ist und allgemeine Erklärungen einmal zentral stehen.

**Acceptance Criteria:**

**Given** FAQ-Templates mit `requires: []` (z.B. `laerm-was-bedeutet-lden`, `laerm-warum-nacht-schaedlicher`)
**When** diese aus pageType `kiez` und `bezirk` entfernt und auf Methodik-/Layer-Seiten gebündelt werden
**Then** Detailseiten zeigen nur Templates mit echtem Aggregat-Bezug; Erklär-Inhalte sind von der Detailseite verlinkt

**Given** TDD
**When** der FAQ-Render-Lauf getestet wird
**Then** kein Detailseiten-FAQ mehr ohne `requires`-Bezug; FAQPage-JSON-LD bleibt valide

**Given** AEO
**When** zwei beliebige Kiez-Seiten verglichen werden
**Then** ihre FAQ-Texte unterscheiden sich substanziell (kein identischer Block über Seiten hinweg)

### Story 11.3: Daten-FAQ mit Ranking, Vergleich und konkreter Zahl

As a Discovery-User,
I want FAQ-Antworten, die meinen Kiez einordnen statt nur einen Ordinalwert zu nennen,
so that ich und Answer Engines eine zitierfähige, spezifische Aussage bekommen.

**Acceptance Criteria:**

**Given** 11.0 (Rang/Quartil) + `kiez_stats`
**When** neue Templates Rang, Vergleich und konkrete Zahl kombinieren (Muster: „Wie grün ist {name}?" → „Platz X von 143, Y Grünanlagen, Z% gute Versorgung, über/unter Bezirksschnitt")
**Then** die Antwort steht in den ersten 40–60 Wörtern nach der Frage (AEO) und nennt mindestens Rang + eine absolute Zahl

**Given** TDD
**When** der Template-Renderer getestet wird
**Then** Interpolation von Rang/Quartil/Zahl, Skip bei Missing-Data und Anti-Stigma-Framing (neutrale Formulierung bei niedrigem Rang) sind getestet

**Given** FR40
**When** eine Antwort einen Wert nennt
**Then** Quelle + Stand sind aus dem `AggregateValue`-Triple abgeleitet und im Text oder Methodik-Link belegt

### Story 11.4: Vergleichswerte Kiez ↔ Bezirk ↔ Berlin im Steckbrief

As a User,
I want sehen wie mein Kiez relativ zum Bezirk und zu Berlin steht,
so that ein Einzelwert eine Bedeutung bekommt.

**Acceptance Criteria:**

**Given** 11.0 + `bezirk_stats` + alle Kieze
**When** der Build je Kiez Bezirks-Schnitt und Berlin-Median je Dimension/Metrik berechnet
**Then** der Steckbrief (`kiez-hero.svelte`) zeigt Kiez-Wert, Bezirks-Schnitt und Berlin-Median nebeneinander, barrierefrei (kein Farb-only-Signal)

**Given** TDD
**When** die Vergleichs-Berechnung getestet wird
**Then** Mittel/Median, Missing-Data und Rundung sind getestet

**Given** Anti-Stigma + A11y
**When** der Vergleich rendert
**Then** Abweichungen sind neutral beschriftet (über/unter Schnitt) mit Text-Label, nicht nur Farbe

### Story 11.5: Verteilungen & Zähldaten im Steckbrief sichtbar machen

As a User,
I want statt nur „dominant: mittel" die Verteilung und die konkreten Zähldaten sehen,
so that ich die reale Lage statt einer Ordinal-Spitze verstehe.

**Acceptance Criteria:**

**Given** vorhandene, ungenutzte Felder (`categoryDistribution`, `wohnlageDistribution`, U/S/Tram/Bus-Counts, kitasPerKm2, schulenPerKm2, spielplaetzeCount, stolpersteinePerKm2)
**When** der Steckbrief Verteilung („70% mittel, 20% hoch") und Zähldaten rendert
**Then** je Cluster erscheint mindestens eine Verteilung oder konkrete Zahl zusätzlich zum Dominant-Wert

**Given** A11y
**When** Verteilungen visualisiert werden
**Then** Werte sind als Text zugänglich, nicht nur als Balken/Farbe

**Given** FR40
**When** Zähldaten erscheinen
**Then** Layer-Quelle + Stand bleiben attribuiert

### Story 11.6: Grounded KI-Profile pro Kiez/Bezirk (Build-Step)

As a Discovery-User,
I want pro Kiez ein kurzes Prosa-Profil, das die Daten erzählt,
so that die Seite menschlich lesbar und für LLMs zitierfähig ist.

**Acceptance Criteria:**

**Given** 11.0 + 11.4 (Rang + Vergleich) als Input, optional 11.8 (externe Prosa)
**When** ein eigener Script `pnpm data:profiles` (NICHT in `prebuild`, Owner-getriggert) je Kiez/Bezirk ein 2–3-Absatz-Profil grounded auf Aggregat, Wahlverlauf und Ranking via Claude API generiert
**Then** das Profil wird als committetes Content-File `src/lib/content/kiez-profile/{slug}.md` geschrieben; jede genannte Zahl existiert im Aggregat; der Build liest die Files statisch (null LLM-Calls beim Deploy)

**Given** Grounding-Disziplin
**When** das Modell schreibt
**Then** Eingabe sind ausschließlich vorhandene Werte als Beleg-Anker; keine freien Fakten, keine Wertung über Anti-Stigma hinaus

**Given** Inkrementalität + Kosten
**When** der Script läuft
**Then** ein Input-Hash je Kiez (Aggregat + Ranking) entscheidet, ob neu generiert wird; unveränderte Kieze werden übersprungen

**Given** EU-FOSS-Ausnahme (Epic 4)
**When** Claude API zur Authoring-Zeit genutzt wird
**Then** eine neue ADR dokumentiert die Ausnahme (Authoring-Zeit ≠ Production-Pfad), Modellwahl und Kostenrahmen

### Story 11.7: Fakten-Lint & Editorial-Gate für generierte Profile

As a Solo-Maintainer,
I want dass kein KI-Profil ungeprüft online geht,
so that Faktentreue und Stil gesichert sind.

**Acceptance Criteria:**

**Given** generierte Profil-Content-Files aus 11.6
**When** ein Lint jede Zahl im Prosa-Text gegen die Datenbasis prüft (analog `lint:wahl`, `forbidden-tokens.ts`)
**Then** ein Profil mit nicht-belegter Zahl oder Forbidden-Token (em-dash, Absolutismen) failt den Build, nicht den Publish

**Given** TDD
**When** der Fakten-Lint getestet wird
**Then** belegte Zahl passt, erfundene Zahl failt, Edge-Cases (gerundete Werte, Bereichsangaben) sind getestet

**Given** Editorial-Gate via git-Diff
**When** `data:profiles` neue/geänderte Content-Files erzeugt
**Then** der Owner reviewt sie als PR-Diff, bevor sie gemerged und prerendered werden; ungeprüfte Profile sind nicht im Main-Branch

### Story 11.8: Bezirksregionenprofile als externe Prosa-Quelle (optional)

As a Content-Maintainer,
I want sozialräumliche Tiefe aus den amtlichen Bezirksregionenprofilen einbinden,
so that KI-Profile über reine Zahlen hinaus Kontext bekommen.

**Acceptance Criteria:**

**Given** Bezirksregionenprofile Teil I (offen, je Bezirk, 143-BZR-Grain, PDF, Struktur variiert)
**When** ein Extraktionsschritt je BZR relevante Kern-Aussagen extrahiert und 11.6 als zusätzlichen grounded Input anbietet
**Then** Profile nutzen, wo vorhanden, amtliche Aussagen; fehlende Profile fallen sauber auf reine Daten-Profile zurück

**Given** Lizenz-Disziplin
**When** Profil-Inhalte genutzt werden
**Then** Quelle + Lizenz je Bezirk dokumentiert

**Given** Aufwand
**When** die Story geplant wird
**Then** PDF-Heterogenität ist als Spike-Risiko markiert; zuerst 1 Bezirk als Pilot

### Story 11.9: Begriffs-Disclaimer + Bezirks-Komponenten-Audit + llms_content-Klärung

As a User,
I want verstehen dass „Kiez" hier die amtliche LOR-Bezirksregion meint,
so that die Datenbasis transparent ist; und der Maintainer schließt offene Audit-Punkte.

**Acceptance Criteria:**

**Given** der Begriffs-Konflikt (Kiez bewohnerdefiniert ≠ LOR-BZR)
**When** die Methodik-Seite die Gleichsetzung erklärt
**Then** Detailseiten verlinken den Disclaimer

**Given** offene Audit-Punkte aus der Analyse
**When** die Bezirks-Komponente (`bezirk/[slug]`) gegen die Kiez-Komponente geprüft wird
**Then** Abweichungen sind dokumentiert und alle Stufe-1-Änderungen (11.3–11.5) gelten für Bezirk wie Kiez

**Given** `llms_content` (`src/lib/server/db/schema/llms-content.ts`)
**When** seine Rolle im Kiez/Bezirk-Kontext geklärt wird
**Then** Entscheidung dokumentiert, ob Profile/FAQ in `llms.txt` einfließen

### Story 11.10: Epic-11-Dokumentation (Owner + LLM-Konsum)

As a Solo-Maintainer,
I want Epic 11 vollständig im `docs/`-Tree dokumentiert,
so that nach einer Wissens-Lücke alles auffindbar ist und kein Drift entsteht (Epic-7-Muster).

**Acceptance Criteria:**

**Given** Ranking/Quartil (11.0) + Vergleichs-Logik (11.4)
**When** `docs/scoring-methodology.md` erweitert wird
**Then** Rang-, Quartil- und Vergleichs-Berechnung sind dort beschrieben, inkl. Anti-Stigma-Framing (Quartil statt letztem Rang)

**Given** FAQ-Entrümpelung (11.2) + neue Daten-FAQ (11.3)
**When** `docs/faq-template-style-guide.md` aktualisiert wird
**Then** das neue Template-Muster (Rang + Vergleich + Zahl, Erklär-FAQ nur auf Methodik) ist dokumentiert

**Given** die KI-Profil-Pipeline (11.6/11.7) + sameAs (11.1)
**When** eine neue Doc `docs/architecture/aeo-content-strategie.md` entsteht
**Then** sie beschreibt Stufen 1–3, die `data:profiles`-Pipeline (Entkopplung vom Deploy, Content-Files, Input-Hash), das Editorial-Gate und die externen Quellen mit Lizenz

**Given** die EU-FOSS-LLM-Ausnahme
**When** ADR-016 final geschrieben wird
**Then** sie dokumentiert Claude-API-Authoring-Ausnahme, Modellwahl, Kostenrahmen und Production-Pfad-Abgrenzung

**Given** der `docs/`-Tree + Generatoren
**When** die Doku abgeschlossen wird
**Then** `docs/INDEX.md` verweist auf die neuen/aktualisierten Docs, `pnpm doc:pipelines` + `pnpm doc:story-map` sind neu generiert, Frontmatter (`type/audience/last-verified`) ist gesetzt

**Sequencing:** 11.1 ist unabhängiger Quick-Win, zuerst. 11.0 ist Hard-Block für 11.3, 11.4, 11.6. 11.2 (FAQ-Entrümpelung) sofort, score-unabhängig. 11.3–11.5 nach 11.0. 11.6 nach 11.0 + 11.4, gated durch 11.7. 11.8 optional, Pilot-Bezirk zuerst, speist 11.6. 11.9 begleitend, schließt offene Punkte. 11.10 zuletzt, dokumentiert das gesamte Epic. Stufen-Mapping zur Analyse: 11.1=Stufe 3.1, 11.2–11.5=Stufe 1, 11.6–11.7=Stufe 2, 11.8=Stufe 3.2.

## Epic 12: Lokale Versorgung — Nahversorgung als Wirtschafts-Linse (Versorgungs-Dimension erweitern)

**Status:** authored 2026-06-07 (Mary, Business-Analyst-Agent). Quelle: Analyst-Session „offene Wirtschaftsdaten Berlin". Ausgelöst durch Owner-Frage „passt ein Wirtschafts-Score ins Konzept".

**Problem:**

Der Atlas misst Lebensqualität dicht, Wirtschaft fast gar nicht. Drei Befunde aus der Daten-Recherche:

- **„Wirtschaftskraft" als eigener Score widerspricht dem Konzept.** Ein hoher Wirtschafts-Score auf Kapital-Intensität (Bodenwerte, Firmendichte) kollidiert mit der bestehenden Wohnschutz-Dimension (Milieuschutz vorhanden = gut) und mit ADR-015 (Bodenrichtwerte liegen bewusst in Strukturell-Indigo, nicht in „gut-grün"). Wirtschaftlich „stark" heißt für Bestandsbewohner oft Verdrängung, nicht Gewinn. Eine eigene Wirtschafts-Dimension bricht „statistisch, nicht normativ".
- **Sozioökonomische Rohindikatoren sind stigma-gesperrt.** SGB-II-Quote und Kinderarmut pro Kiez als eigene Layer verletzen das Anti-Stigma-Mandat. Genau deshalb führt der Score den MSS-*Gesamtindex* abstrahiert als „Soziale Lage", nicht die Einzelindikatoren.
- **Echte Lücke: Alltagsökonomie.** Die Versorgungs-Dimension misst Daseinsvorsorge (Kita, Schule, Krankenhaus, Spielplatz), aber keinen Alltagseinkauf. Supermarkt, Apotheke, Post fehlen komplett, obwohl sie die häufigsten Wege im Kiez sind und bewohner-positiv und stigma-frei bewertbar bleiben.

**Vision:**

Wirtschaft kommt nur über die Versorgungs-Linse in den Score, nicht als eigene Dimension. Die Versorgungs-Dimension wird von „Daseinsvorsorge" zu „Alltagsversorgung, öffentlich und privat" erweitert: Lebensmittel, Apotheke, Post als Nahversorgungs-Terme aus OSM, gleiche Dichte-Methodik wie Kita/Schule/Spielplatz. Kapital-Signale (Bodenwert, Firmendichte) bleiben in der Strukturell-Familie, nicht im „gut"-Score.

**Hard-Constraints:**

- **Keine neue Dimension.** Owner-Decision 2026-06-07: Erweiterung der bestehenden Versorgungs-Dimension, NICHT 6. Dimension. `KiezScoreDimension`-Union, `DIMENSION_WEIGHTS` (5 × 0.20) und das `kiez_score`/`bezirk_score`-Schema bleiben unberührt. Umverteilung passiert nur *intern* in `VERSORGUNG_CONFIG`.
- **Abhängig von Epic 9 + Epic 10.** Die Versorgungs-Dimension muss stabil sein (Epic 9 Score-Recomposition gelandet, Epic 10.1–10.4 Versorgung-Ausbau gelandet), sonst Merge-Konflikt im `dimension-config.ts`. `poi-density`-Strategy existiert bereits aus Story 10.4 und wird wiederverwendet, keine neue `NormalizationStrategy` nötig.
- **Anti-Stigma (ADR-015).** Nahversorgung ist bewohner-positiv und stigma-frei. KEINE Kapital-Intensität (Bodenwert, Firmendichte, Gewerbemiete) als Score-Input. KEINE sozioökonomischen Rohindikatoren (SGB II, Kinderarmut, Einkommen).
- **Score-Semantik ändert sich.** „Versorgung" deckt jetzt öffentlich (Daseinsvorsorge) UND privat (Nahversorgung). Methodik-Seite und `docs/scoring-methodology.md` anpassen, ADR-Notiz zur Versorgung-Neudefinition.
- **Lizenz-Disziplin.** OSM-Daten ODbL 1.0, Footer „© OpenStreetMap contributors", schon im Stack via `overpass.js`. Keine neue Lizenz-Gattung.
- **TDD (ADR-012).** Overpass-Fetch-Parsing, Radius-Join, Normalisierung und Umgewichtung sind Business-Logic → Test-First.
- **Doppel-Penalty-Guard.** Ein datenarmer Außenbezirk-Kiez darf nicht doppelt verlieren (wenig Kita UND wenig Supermarkt). Spreizungs-Effekt der Umgewichtung prüfen, Missing-Data-Policy (≥ 50 % Member non-null) greift.

**Abhängigkeiten:** 12.0 (Layer-Foundation) ist Hard-Block für 12.1 + 12.2. 12.3 (Umgewichtung) nach 12.1 + 12.2, weil sie deren Terme gewichtet. 12.4 (Methodik/Doku) zuletzt. 12.5 (StEP-Zentren) ist optionaler Spike, unabhängig.

### Story 12.0: Nahversorgungs-Layer-Foundation (Overpass-Fetch + Radius-Join)

As a Solo-Maintainer,
I want die Nahversorgungs-POIs (Lebensmittel, Apotheke, Post) als deterministische OSM-Layer in der Pipeline und im Dichte-Radius-Join,
so that die Versorgungs-Dimension sie wie Kita/Schule/Spielplatz als `poi-density`-Term lesen kann.

**Acceptance Criteria:**

**Given** der `overpass.js`-Fetcher (vorhanden, ODbL)
**When** ein Fetch+Parse-Schritt die Tags `shop=supermarket|convenience|grocery` (Lebensmittel), `amenity=pharmacy` (Apotheke) und `amenity=post_office` (Post) live abruft
**Then** entstehen drei deterministische Punkt-Layer mit MANIFEST-Einträgen (Quelle, Stand, SHA, Lizenz ODbL), Tags vorab gegen die Live-Overpass-API verifiziert (nicht aus dem Gedächtnis)

**Given** die `poiCounts`-Radius-Join-Logik (Story 10.4)
**When** die neuen Layer in den Build-Join aufgenommen werden
**Then** pro 542 LOR-Planungsraum liefern sie `{ count, nearestM }` je Layer-Slug, kompatibel mit `poi-density`

**Given** TDD
**When** Parse-/Join-Tests laufen
**Then** Tag-Filter, Punkt-Zählung im Radius und Missing-Data (LOR ohne POI) sind getestet, kein Crash bei leerem Treffer-Set

**Given** Lizenz-Disziplin
**When** die Layer publiziert werden
**Then** ODbL-Attribution „© OpenStreetMap contributors" ist in MANIFEST + Quellen-/Methodik-Doku hinterlegt

### Story 12.1: Versorgung — Lebensmittel-Dichte als Nahversorgungs-Term

As a Bewohner,
I want dass die Versorgung zählt, wie viele Lebensmittelgeschäfte in Gehweite sind,
so that ein Kiez mit Supermarkt, Discounter und Spätkauf um die Ecke besser abschneidet als einer ohne.

**Acceptance Criteria:**

**Given** 12.0 + die Lebensmittel-Layer
**When** `VERSORGUNG_CONFIG` einen `poi-density`-Term „Lebensmittel im 500-m-Radius" erhält
**Then** ein LOR mit hoher Lebensmittel-Dichte scort besser, weicher Tail jenseits des Cap (analog Story 10.4), kein harter Distanz-Cliff

**Given** TDD
**When** Normalisierungs-Tests laufen
**Then** Radius, Cap, `softTailFactor` und Missing-Data sind getestet

**Given** die Inspector-Versorgungs-Section
**When** ein Punkt getroffen wird
**Then** Lebensmittel erscheint als Quelle mit Wert + Stand + ODbL-Attribution (FR15/FR40)

### Story 12.2: Versorgung — Apotheke + Post als Nahversorgungs-Terme

As a Bewohner,
I want dass Apotheke und Post-/Paketstelle in Reichweite in die Versorgung einfließen,
so that gesundheitsnahe und behördennahe Alltagswege im Score sichtbar werden.

**Acceptance Criteria:**

**Given** 12.0 + die Apotheke- und Post-Layer
**When** `VERSORGUNG_CONFIG` zwei `poi-density`-Terme erhält (Apotheke ~800 m, Post ~1000 m)
**Then** beide zählen als Dichte im Radius, jeweils mit eigenem Cap, plausibel zur typischen Erreichbarkeit

**Given** TDD
**When** Tests laufen
**Then** beide Terme, Radien, Caps und Missing-Data sind getestet

**Given** Term-Inflation-Risiko
**When** Bäcker (`shop=bakery`) erwogen wird
**Then** Entscheidung dokumentiert: in den Lebensmittel-Bucket falten oder bewusst weglassen, kein eigener Term ohne Begründung

### Story 12.3: Versorgung — interne Umgewichtung (öffentlich + privat)

As a Solo-Maintainer,
I want die Versorgungs-Dimension intern neu gewichten, damit die Nahversorgungs-Terme Platz bekommen ohne die Dimension zu sprengen,
so that Daseinsvorsorge und Alltagsversorgung in einem nachvollziehbaren Verhältnis stehen.

**Acceptance Criteria:**

**Given** die Versorgungs-Terme summieren intern auf 1.0
**When** die Nahversorgung (~0.24) aufgenommen wird und die Bestands-Terme schrumpfen
**Then** gilt der Vorschlag (Owner-Review-pflichtig): Kita 0.30→0.24, Schule 0.30→0.24, Krankenhaus 0.25→0.18, Spielplatz 0.15→0.10, Nahversorgung 0.24 (Lebensmittel 0.12, Apotheke 0.07, Post 0.05), Summe 1.00

**Given** der Doppel-Penalty-Guard
**When** die Umgewichtung gerechnet wird
**Then** der Spreizungs-Effekt ist geprüft (datenarme Außenbezirk-Kieze verlieren nicht doppelt), Missing-Data-Policy (≥ 50 % non-null) dokumentiert

**Given** TDD
**When** Tests laufen
**Then** die Gewichts-Summe = 1.0 ist asserted, Score-Recompute ist deterministisch (idempotent, nur `computed_at` ändert sich)

**Given** Konsumenten-Konsistenz
**When** `data:aggregate-scores` + `data:rank` + `data:comparison` neu laufen
**Then** Composite, Versorgungs-Rang und Vergleichswerte (Epic 11) aktualisieren sich, Schema unverändert

### Story 12.4: Methodik + Doku — Versorgung-Neudefinition

As a User,
I want auf der Methodik-Seite verstehen, dass Versorgung jetzt öffentliche und private Alltagsversorgung mischt,
so that der erweiterte Score transparent und belegt bleibt.

**Acceptance Criteria:**

**Given** die erweiterte Versorgungs-Dimension
**When** `docs/scoring-methodology.md` + die Methodik-Page aktualisiert werden
**Then** „Versorgung" erklärt Daseinsvorsorge UND Nahversorgung, listet die neuen Terme mit Gewichten und Quelle (OSM/ODbL)

**Given** die Score-Semantik-Änderung
**When** eine ADR-Notiz entsteht
**Then** die Versorgung-Neudefinition (öffentlich + privat) ist als bewusste Entscheidung dokumentiert, mit Anti-Stigma-Abgrenzung (keine Kapital-Intensität, keine sozioökonomischen Rohindikatoren)

**Given** der `docs/`-Tree
**When** die Doku abgeschlossen wird
**Then** `docs/INDEX.md` verweist auf die Änderung, Frontmatter (`type/audience/last-verified`) gesetzt

### Story 12.5: StEP-Zentren als Zentralitäts-Term — Spike (optional)

As a Solo-Maintainer,
I want prüfen ob die StEP-Zentren (Zentrenhierarchie, FIS-Broker) als zusätzlicher „Nähe zum Versorgungszentrum"-Term taugen,
so that Einzelhandels-Zentralität die punktbasierte Nahversorgung ergänzt statt sie zu duplizieren.

**Acceptance Criteria:**

**Given** StEP Zentren 2030/2040 (FIS-Broker WFS, dl-de/by)
**When** ich Format, Granularität (Punkt/Polygon der Zentren-Hierarchie) und Lizenz live prüfe
**Then** ein Spike-Ergebnis dokumentiert: Integrationsweg, Mehrwert gegenüber OSM-Nahversorgung (Überlappung?), Aufwand vs. Auflösungsgewinn

**Given** das Spike-Ergebnis
**When** entschieden wird
**Then** entweder Folge-Story (Zentralitäts-Term) oder bewusstes Defer mit Begründung

### Story 12.6: Epic-12-Dokumentation + Updates-Eintrag (Owner + LLM + User)

As a Solo-Maintainer,
I want Epic 12 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag auf `/updates` veröffentlicht,
so that kein Wissens-Drift entsteht (Epic-7-Muster) und Nutzer die erweiterte Versorgung verstehen.

**Acceptance Criteria:**

**Given** die neuen OSM-Nahversorgungs-Layer + die erweiterte Versorgungs-Dimension
**When** der Data-Pipeline-Atlas + die Generatoren neu laufen
**Then** `pnpm doc:pipelines` + `pnpm doc:story-map` sind neu generiert, die neuen Layer erscheinen im Pipeline-Atlas, `docs/INDEX.md` verweist auf die Änderungen, Frontmatter (`type/audience/last-verified`) gesetzt

**Given** die Score-Semantik-Änderung (Versorgung = öffentlich + privat, aus 12.4)
**When** die Doku-Konsistenz geprüft wird
**Then** scoring-methodology.md + ADR (aus 12.4) sind verlinkt und stimmig, keine „Versorgung = nur Daseinsvorsorge"-Stelle übrig

**Given** die `/updates`-Route (`_content/updates/YYYY-MM-DD-{slug}.md`, Frontmatter `title_de/summary_de/date/category/tags`)
**When** ein redaktioneller Changelog-Eintrag geschrieben wird
**Then** existiert `_content/updates/2026-MM-DD-nahversorgung-versorgung.md` (category `feature`), erklärt die neuen Nahversorgungs-Terme + Umgewichtung in Nutzersprache, verlinkt `/methodik/kiez-score`, hält die Forbidden-Token-Konvention (keine em-dashes, kein „lebenswert", keine Infra-/Stack-Interna)

**Given** der Eintrag
**When** `/updates` + Feeds (RSS/Atom/JSON) prerendern
**Then** der Eintrag erscheint chronologisch, Feed-Tests grün, kein Build-Fehler durch Frontmatter

**Sequencing:** 12.0 ist Hard-Block für 12.1 + 12.2. 12.1 + 12.2 parallel-möglich nach 12.0. 12.3 nach 12.1 + 12.2 (gewichtet deren Terme), umfassendster Eingriff. 12.4 dokumentiert die Neudefinition (Methodik + ADR). 12.5 optionaler Spike, unabhängig. 12.6 zuletzt: Doku-Closure + `/updates`-Eintrag, nach allen anderen. Voraussetzung gesamt: Epic 9 + Epic 10.1–10.4 gelandet (stabile Versorgungs-Dimension).

## Epic 13: Kultur-Score (6. Score-Dimension)

**Status:** authored 2026-06-07 (Mary, Business-Analyst-Agent). Quelle: Analyst-Session „offene Kulturdaten Berlin". Ausgelöst durch Owner-Wunsch „Kultur-Score fehlt seit langem".

**Problem:**

Der Score misst Umwelt, Mobilität, Versorgung und Wohnschutz, aber keinen Kultur-Zugang. Kulturelle Teilhabe (Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur) ist ein eigenständiger Lebensqualitäts-Faktor mit eindeutiger Besser-Richtung für Bewohner, fehlt aber komplett. Drei Befunde aus der Daten-Recherche:

- **Daten existieren offen und geocodiert.** OSM Overpass (ODbL, schon im Stack) deckt ~90 % ab: `tourism=artwork` (2.736), `tourism=gallery` (354), `tourism=museum` (246), `amenity=theatre` (198), `amenity=library` (154), `amenity=nightclub` (140), `amenity=arts_centre` (134), `amenity=cinema` (89). Aggregiert sauber auf LOR, gleiche `poi-density`-Methodik wie Versorgung.
- **Anders als Wirtschaft ist Kultur sauber bewohner-positiv.** Zugang zu Kulturinfrastruktur ist Lebensqualität, kein Verdrängungs-Proxy, kaum kontestiert. Rechtfertigt eine eigene 6. Dimension statt Verstecken in Versorgung.
- **Center-Bias ist real.** Kulturinfrastruktur ballt sich in Mitte/Innenstadt. Ein Außenbezirk-Kiez scort fast null. Das ist faktisch korrekt und nicht stigmatisierend (Amenity, nicht Person), erzeugt aber ein starkes Innen-Außen-Gefälle, das die Normalisierung bewusst behandeln muss.

**Vision:**

Eine 6. Score-Dimension „Kultur": gewichtete Dichte kulturkollektiver POIs aus OSM, gleiche Methodik wie Versorgung, bewohner-positiv und stigma-frei. **Owner-Decision 2026-06-07 (Option C): Kultur ist eine eigenständige, sichtbare Dimension (eigener Choropleth, Inspector, Rang), fließt aber NICHT in den Gesamt-/Composite-Score.** Begründung: der Composite heißt „Umwelt- & Infrastruktur-Score" und Kultur ist innenstadt-lastig (Center-Bias) — als Headline-Treiber würde sie jeden Außenbezirk-Gesamt-Score drücken. Präzedenz: ADR-015 behandelt Soziale Lage genauso (sichtbar, nicht im Composite). Strukturell analog zu Epic 9 (Score-Recomposition): zentrale Foundation, DB-Migration, Re-Run, Konsumenten-Migration, Content. Optional spätere Anreicherung über `kulturdaten.berlin` (CC BY).

**Risiko-Awareness:**

Großer Single-Change analog Epic 9. Blast-Radius: Typ-Union + Composite-Filter (Kultur aus `computeOverallScore` ausschließen, KEIN Rebalance der fünf), DB-Schema (`kiez_score`/`bezirk_score`-Spalte), Score-Ring (5→6 Segmente, Mitte bleibt Composite der fünf), Compare-Block, Ranking-Tabelle (`ranking-types`), Choropleth-Score-Layer, OG-Score-Card, LLM-Renderer, Methodik-Seite, „wo-lebt-es-sich-gut". Strikt dependency-getrieben sequenzieren, jede Stufe grün vor der nächsten.

**Hard-Constraints:**

- **Eigene Dimension, kein Versorgungs-Term.** Owner-Decision 2026-06-07: Kultur ist eigenständig, nicht in Versorgung gefaltet (anders als Epic 12 Nahversorgung). Touchiert das Score-Schema (neue Spalte) und alle Dimensions-Konsumenten.
- **Kultur NICHT im Composite (Option C).** Owner-Decision 2026-06-07: Kultur wird gerechnet, aggregiert, als Layer + Rang geführt und angezeigt, zählt aber NICHT in den Gesamt-Score (`computeOverallScore`). Die fünf Composite-Dimensionen bleiben bei 0.20, `kultur` bekommt Gewicht 0 / steht außerhalb der Composite-Whitelist. Kein Rename des „Umwelt- & Infrastruktur-Score" nötig.
- **Editorial-Ausschlüsse.** Stolpersteine + Denkmale (Memorial/Heritage, Epic-9-Story-9.6-Removal) sind KEINE Kultur-Amenity. Sammlungs-/Objekt-Metadaten (DDB, digiS OpenGLAM) sind keine Orte, raus. `amenity=community_centre` (818) ist verrauscht (Kitas, Bürgerämter), hart filtern oder weglassen.
- **Lizenz-Disziplin.** OSM ODbL, Footer „© OpenStreetMap contributors", schon im Stack. `clubkataster.de` (Clubcommission) hat KEINE offene Lizenz, nicht scrapen, nicht nutzen. `kulturdaten.berlin` ist CC BY (Attribution + Per-Record-Terms prüfen), nur optionale Anreicherung.
- **Center-Bias-Dämpfung.** Normalisierung muss das Innen-Außen-Gefälle bewusst behandeln (Log-Skala oder großzügiger Cap), damit Außenbezirk-Kieze nicht flächendeckend auf null fallen. Entscheidung „dämpfen vs. real abbilden" dokumentiert.
- **Anti-Stigma (ADR-015).** Kultur ist wohltuend → Choropleth-Familie „Gut-Grün", kein „Last", kein Stigma. Niedriger Kultur-Wert heißt „weniger Kulturorte in Reichweite", keine Wertung der Bewohner.
- **TDD (ADR-012).** Overpass-Fetch, Radius-Join, Normalisierung (inkl. Dämpfung), Composite-Ausschluss und Recompute sind Business-Logic → Test-First.

**Abhängigkeiten:** 13.0 (Layer) + 13.1 (Foundation) sind Hard-Block für alles Weitere. 13.1 → 13.2 → 13.3 strikt sequenziell (Foundation → Schema → Re-Run). Danach 13.4 + 13.5 parallel-möglich. 13.6 optionaler Spike. Voraussetzung: Epic 9 gelandet (5-Dimensions-Set als Ausgangspunkt).

### Story 13.0: Kultur-Layer-Foundation (Overpass-Fetch + Radius-Join)

As a Solo-Maintainer,
I want die Kultur-POIs als deterministische OSM-Layer in der Pipeline und im Dichte-Radius-Join,
so that die neue Kultur-Dimension sie als `poi-density`-Terme lesen kann.

**Acceptance Criteria:**

**Given** der `overpass.js`-Fetcher (vorhanden, ODbL)
**When** ein Fetch+Parse-Schritt die Kultur-Tags live abruft (`tourism=artwork|gallery|museum`, `amenity=theatre|library|cinema|arts_centre|nightclub`), Tags vorab gegen die Live-Overpass-API verifiziert
**Then** entstehen Punkt-Layer mit MANIFEST-Einträgen (Quelle, Stand, SHA, Lizenz ODbL), `community_centre` bewusst ausgeschlossen oder hart gefiltert (Begründung dokumentiert)

**Given** die `poiCounts`-Radius-Join-Logik (Story 10.4)
**When** die neuen Layer in den Build-Join aufgenommen werden
**Then** pro 542 LOR liefern sie `{ count, nearestM }` je Layer-Slug, kompatibel mit `poi-density`

**Given** TDD
**When** Parse-/Join-Tests laufen
**Then** Tag-Filter, Zählung im Radius, Missing-Data (LOR ohne Kultur-POI) getestet, kein Crash bei leerem Set

**Given** Lizenz-Disziplin
**When** die Layer publiziert werden
**Then** ODbL-Attribution in MANIFEST + Methodik-Doku, Clubkataster explizit NICHT verwendet

### Story 13.1: Kultur-Dimensions-Foundation (Typ-Union + Config + Gewichte + Dämpfung)

As a Solo-Maintainer,
I want die Kultur-Dimension zentral als 6. Dimension anlegen (Typ-Union + dimension-config + Gewichte),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren.

**Acceptance Criteria:**

**Given** das 5-Dimensions-Set aus Epic 9
**When** ich `scripts/lib/kiez-score/types.ts` `KiezScoreDimension` um `'kultur'` erweitere
**Then** `KIEZ_SCORE_DIMENSIONS` enthält 6 Einträge (Kultur wird gerechnet + angezeigt + gerankt), die fünf Composite-Dimensionen bleiben bei `DIMENSION_WEIGHTS` 0.20, `kultur: 0`
**And** Kultur ist über eine Composite-Whitelist (`COMPOSITE_DIMENSIONS`) aus `computeOverallScore` ausgeschlossen (Option C); der Gesamt-Score bleibt das Mittel der fünf, unabhängig vom Kultur-Wert

**Given** `dimension-config.ts`
**When** ich `KULTUR_CONFIG` mit `poi-density`-Termen pro Kultur-Layer setze
**Then** die Terme sind gewichtet (z. B. Bibliothek/Theater/Museum höher als nightclub/artwork), Radien plausibel, Summe der Term-Gewichte = 1.0

**Given** der Center-Bias
**When** die Normalisierung gesetzt wird
**Then** sie dämpft das Innen-Außen-Gefälle (Log-Skala oder großzügiger Cap), Entscheidung „dämpfen vs. real" dokumentiert, Außenbezirk-Kieze fallen nicht flächendeckend auf null

**Given** TDD (ADR-012)
**When** compute-score/dimension-config-Tests laufen
**Then** Tests spiegeln das 6er-Set, Dimensions-Gewichts-Summe = 1, Dämpfungs-Kurve getestet

### Story 13.2: DB-Schema-Migration (kiez_score + bezirk_score)

As a Solo-Maintainer,
I want das Postgres-Schema um die Kultur-Spalte erweitern,
so that der Build-Time-Cache die neue Dimension persistiert.

**Acceptance Criteria:**

**Given** die Foundation aus 13.1
**When** ich eine Drizzle-Migration schreibe
**Then** `kiez_score` + `bezirk_score` erhalten `kultur` (doublePrecision, nullable), `composite` bleibt, bestehende Spalten unverändert

**Given** die Migration
**When** `pnpm db:migrate` läuft
**Then** Schema konsistent, `getKiezScore`/`getBezirkScore` kompilieren gegen die neue Spalte

### Story 13.3: Pipeline-Recompute + Re-Run

As a Solo-Maintainer,
I want die Score-Pipeline auf das 6er-Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die Kultur-Dimension enthalten.

**Acceptance Criteria:**

**Given** 13.0 + 13.1 + 13.2
**When** ich `compute-score.ts`/`build-kiez-scores.ts`/`aggregate-scores.ts` auf das 6er-Set anpasse
**Then** `pnpm data:kiez-scores` + `data:aggregate-scores` produzieren deterministische Outputs mit 6 Dimensionen inkl. Kultur

**Given** Re-Run + Konsistenz
**When** `data:rank` + `data:comparison` (Epic 11) neu laufen
**Then** Composite, Kultur-Rang und Vergleichswerte aktualisieren sich, Spot-Check plausibel (Innenstadt-Kieze hoch, Außenbezirk gedämpft statt null)

### Story 13.4: Konsumenten-Migration (UI + Map + OG + LLM)

As a User,
I want dass alle Score-Darstellungen die Kultur-Dimension zeigen,
so that Inspector, Compare, Ranking, Karte, OG-Cards und LLM-Export konsistent sind.

**Acceptance Criteria:**

**Given** die neuen Scores aus 13.3
**When** ich `kiez-score-display.ts` (Labels), Score-Ring (5→6 Segmente), Inspector-Section, `kiez-score-compare-block`, `score-ranking-table` (`ranking-types`), Choropleth-Score-Layer, `score-card-data` (OG), LLM-Renderer migriere
**Then** überall erscheint „Kultur" als 6. Dimension, Ring/Tabellen/Cards rendern 6 Werte ohne Layout-Bruch

**Given** Anti-Stigma + A11y
**When** Kultur als Choropleth + Ring gerendert wird
**Then** „Gut-Grün"-Familie, kein „besser"-Pfeil-Stigma, Farbe nicht alleiniger Informationsträger (WCAG)

### Story 13.5: Content-Migration (Methodik + wo-lebt-es-sich-gut + ADR)

As a User,
I want dass Methodik-Seite und Ranking-Page die Kultur-Dimension erklären,
so that die erweiterte Score-Logik transparent ist.

**Acceptance Criteria:**

**Given** die 6. Dimension
**When** ich `/methodik/kiez-score` + `docs/scoring-methodology.md` aktualisiere
**Then** Kultur-Dimension, ihre Terme/Gewichte, Quelle (OSM/ODbL) und die Center-Bias-Dämpfung sind erklärt

**Given** die Score-Erweiterung
**When** eine ADR entsteht (analog ADR-015)
**Then** sie dokumentiert die Kultur-Dimension als bewusste Entscheidung, die editorialen Ausschlüsse (Memorial/Heritage, Sammlungsdaten, Clubkataster) und die Dämpfungs-Wahl

**Given** `/wo-lebt-es-sich-gut`
**When** die Seite die neuen Scores nutzt
**Then** Ranking + Texte spiegeln das 6er-Set inkl. Kultur

### Story 13.6: kulturdaten.berlin als Anreicherung — Spike (optional)

As a Solo-Maintainer,
I want prüfen ob `kulturdaten.berlin` (CC BY) die OSM-Kulturdaten sinnvoll ergänzt,
so that Lücken (Clubs, kleine Spielstätten) und eine reichere Taxonomie den Score verbessern.

**Acceptance Criteria:**

**Given** die kulturdaten.berlin-API (CC BY, 3.261 Locations, ohne Koordinaten)
**When** ich Geocoding-Aufwand, Überlappung mit OSM, Per-Record-Lizenzterme und Mehrwert prüfe
**Then** ein Spike-Ergebnis dokumentiert: Integrationsweg (Adress-Geocoding), Dedupe gegen OSM, Aufwand vs. Abdeckungsgewinn

**Given** das Spike-Ergebnis
**When** entschieden wird
**Then** entweder Folge-Story (Anreicherung + Attribution) oder bewusstes Defer mit Begründung

### Story 13.7: Epic-13-Dokumentation + Updates-Eintrag (Owner + LLM + User)

As a Solo-Maintainer,
I want Epic 13 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag auf `/updates` veröffentlicht,
so that kein Wissens-Drift entsteht (Epic-7-Muster) und Nutzer den neuen Kultur-Score verstehen.

**Acceptance Criteria:**

**Given** die 6. Dimension + die neuen OSM-Kultur-Layer
**When** der Data-Pipeline-Atlas + die Generatoren neu laufen
**Then** `pnpm doc:pipelines` + `pnpm doc:story-map` sind neu generiert, die Kultur-Layer + die 6. Dimension erscheinen im Pipeline-Atlas, `docs/INDEX.md` + System-Map verweisen darauf, Frontmatter gesetzt

**Given** die Score-Erweiterung (aus 13.5: scoring-methodology + ADR)
**When** die Doku-Konsistenz geprüft wird
**Then** Methodik + ADR sind verlinkt und stimmig, keine „fünf Dimensionen"-Stelle übrig, die Center-Bias-Dämpfung + editorialen Ausschlüsse (Memorial/Heritage, Sammlungsdaten, Clubkataster) sind dokumentiert

**Given** die `/updates`-Route
**When** ein redaktioneller Changelog-Eintrag geschrieben wird
**Then** existiert `_content/updates/2026-MM-DD-kultur-score.md` (category `feature`), erklärt die neue Kultur-Dimension in Nutzersprache (Bibliothek/Theater/Museum/Kino in Reichweite), nennt die OSM-Quelle + den Center-Bias-Hinweis (Innenstadt-lastig), verlinkt `/methodik/kiez-score`, hält die Forbidden-Token-Konvention (keine em-dashes, kein „lebenswert", keine Infra-/Stack-Interna)

**Given** der Eintrag
**When** `/updates` + Feeds (RSS/Atom/JSON) prerendern
**Then** der Eintrag erscheint chronologisch, Feed-Tests grün, kein Build-Fehler durch Frontmatter

### Story 13.8: Prosa-Profile-Regeneration nach Score-Erweiterung (Cross-Epic-Capstone)

As a Discovery-User,
I want dass die Kiez-/Bezirks-Prosa-Profile die erweiterte Versorgung und den neuen Kultur-Score widerspiegeln,
so that kein Profil veraltete oder unvollständige Aussagen über die Datenbasis macht.

**Acceptance Criteria:**

**Given** der Grounding-Input-Builder (`scripts/lib/profiles/build.ts` + `input.ts`, Story 11.6, geteilt mit dem Lint)
**When** er erweitert wird
**Then** enthält der Profil-Input die Kultur-Dimension + Kultur-Rang + Kultur-Vergleich; die geänderten Versorgungs-Werte fließen automatisch (gleicher Dimensions-Key)

**Given** der Fakten-Lint (`scripts/lib/profiles/fact-lint.ts`, Story 11.7)
**When** er erweitert wird
**Then** validiert er die Kultur-Zahl (und etwaige Nahversorgungs-Bezüge) gegen die Datenbasis; `pnpm lint:profiles` akzeptiert sie, halluzinierte Werte failen weiter

**Given** der Generator-Prompt (`scripts/build-kiez-profiles.ts`, prompt-grader-gehärtet)
**When** er aktualisiert wird
**Then** darf das Modell die 6. Dimension (Kultur) + die erweiterte Versorgung grounded erwähnen, ohne Anti-Stigma zu verletzen (Center-Bias bei Kultur neutral, kein „kulturlos")

**Given** die neue Score-Datenbasis (nach 12.3 + 13.3)
**When** `pnpm data:profiles` läuft
**Then** triggert der geänderte `inputHash` die Regenerierung der betroffenen Profile (Inkrementalität, `--force` für alle 155); committete Content-Files in `src/lib/content/{kiez-profile,bezirk-profile}/`

**Given** das Editorial-Gate (PR-git-Diff) + EU-FOSS-Constraint
**When** die regenerierten Profile reviewt werden
**Then** `lint:profiles` grün, Anti-Stigma gehalten, KEIN API-Call im Deploy/prebuild (Owner-Decision 11.6 bleibt), Diff der 155 Profile im PR reviewbar

**Sequencing:** 13.0 + 13.1 sind Fundament (Layer + Typ-Union). 13.1 → 13.2 → 13.3 strikt sequenziell (Foundation → Schema → Re-Run, jede Stufe grün vor der nächsten, analog Epic 9). Danach 13.4 + 13.5 parallel-möglich. 13.6 optionaler Spike, unabhängig. 13.7 dokumentiert das Epic + `/updates`. **13.8 ist der allerletzte Schritt beider Epics:** Hard-Block auf ALLE Stories Epic 12 + Epic 13 (insb. 12.3 + 13.3 Recompute + 13.5 Kultur in Rang/Vergleich). Die Profile referenzieren den ganzen Score, daher einmal am Ende regenerieren statt zweimal (Kosten). Falls Epic 13 deferred wird: 13.8 greift trotzdem für die Versorgungs-Änderung allein (Kultur-Teile werden No-op). Voraussetzung gesamt: Epic 9 gelandet (5-Dimensions-Set) + Epic 11.6/11.7 (Profil-Pipeline + Fakten-Lint). Epic 12 und Epic 13 sind unabhängig voneinander, berühren aber beide `dimension-config.ts` → nicht gleichzeitig mergen, sonst Konflikt.

## Epic 14: Kriminalitäts-Kontext (Stigma-geschützte Dimension)

**Status:** authored 2026-06-09 (Mary, Business-Analyst-Agent). Quelle: Analyst-Session „Kriminalität als Dimension?". Ausgelöst durch Owner-Wunsch nach einer Sicherheits-Perspektive. Entscheidungs-Grundlage: ADR-019 + `docs/kriminalitaetsdaten-methodik.md`.

**Problem:**

Der Score misst Umwelt, Mobilität, Versorgung, Wohnschutz (Composite) plus Kultur (Option C). Eine Kriminalitäts-/Sicherheits-Perspektive fehlt. Anders als bei Müll (verworfen, `docs/muelldaten-methodik.md`) ist die Datenlage hier erstklassig. Vier Befunde:

- **Daten existieren offen + geocodiert.** Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0): 12 Bezirke + 138/143 Bezirksregionen (LOR), Zeitreihe 2016–2025, jährlich zum 31.12., Fallzahlen + Häufigkeitszahl (HZ, pro 100.000 Einwohner), 17 Delikte + kuratierte „Kieztaten", eine XLSX, joinbar über LOR-Schlüssel.
- **Stigma-sensibel, anders als Kultur.** Kriminalitätsbelastung ist die Lehrbuch-Stigma-Variable (Redlining-Risiko). Gehört zur Haltung von Soziale Lage / Bodenrichtwerte (ADR-015, Strukturell-Kontext), nicht zur bewohner-positiven Kultur-Logik (ADR-018).
- **Touristen/Pendler-Verzerrung.** Die HZ bezieht nur gemeldete Einwohner. City-LOR (Regierungsviertel HZ 46.178, Alexanderplatz 28.817 vs. Berlin 12.882) erscheinen artefakt-belastet. In den Headline-Score gebacken würde das das „wo lebt es sich gut"-Ranking verzerren.
- **Granularität gröber.** Atlas liefert nur Bezirksregion (143), nicht Planungsraum (542). Keine PLR-native Dimension; BR-Wert muss auf PLR gespiegelt werden.

**Vision:**

Eine eigenständige, sichtbare **Kriminalitäts-Kontext-Dimension**: HZ einer wohn-relevanten Delikt-Auswahl pro LOR, 3-Jahres-Mittel. **Owner-Decision 2026-06-09 (ADR-019): Option-C-Mechanik wie Kultur (gerechnet, aggregiert, angezeigt, NICHT im Composite), aber Stigma-Framing wie Soziale Lage (Strukturell-Indigo, kein „Gut-Grün", keine „sicher/gefährlich"-Wertung, NICHT in die Prosa-Profile gewoben).** Strukturell analog zu Epic 9/13: zentrale Foundation, DB-Migration, Re-Run, Konsumenten-Migration, Content.

**Risiko-Awareness:**

Großer Single-Change analog Epic 9/13. Blast-Radius: Typ-Union + Composite-Filter (Kriminalität aus `computeOverallScore` ausschließen, KEIN Rebalance der fünf), DB-Schema (`kiez_score`/`bezirk_score`-Spalte), Inspector-Section, Choropleth-Score-Layer (Indigo), Compare-Block, Methodik-Seite, LLM-Renderer. **Zusätzliches Risiko gegenüber Kultur: Stigma.** Jede Darstellung muss Redlining vermeiden — falsches Framing ist hier kein Layout-Bug, sondern ein ethischer Fehler. Strikt dependency-getrieben sequenzieren.

**Hard-Constraints:**

- **Eigene Dimension, NICHT im Composite (Option C).** `KIEZ_SCORE_DIMENSIONS` enthält `kriminalitaet`; `DIMENSION_WEIGHTS.kriminalitaet = 0`; außerhalb der `COMPOSITE_DIMENSIONS`-Whitelist. Die fünf bleiben bei 0.20. Kein Rebalance, kein Rename.
- **Stigma-Schutz (ADR-015 + ADR-019).** Choropleth-Familie **Strukturell-Indigo**, NICHT Gut-Grün. Kein „besser"-Pfeil, keine „sicher/gefährlich"-Labels. Bezeichnung neutral: „erfasste Kriminalität (Häufigkeitszahl)". KEIN Score-Ring-Segment mit Gut-Wertung.
- **NICHT in die Prosa-Profile.** Default: die Kiez-/Bezirks-Profile erwähnen Kriminalität nicht. Karten-Layer + Inspector-Kontext only. Verhindert Redlining im generierten Fließtext.
- **BR-Granularität, auf PLR gespiegelt.** Atlas-Wert pro Bezirksregion → jeder enthaltene PLR erbt den BR-Wert (konstant innerhalb der BR). Bestehende flächen-gewichtete Aggregation (ADR-013) reproduziert den BR-Wert. Sichtbar gröber als die fünf PLR-nativen Dimensionen, dokumentieren.
- **Delikt-Auswahl statt „Straftaten insgesamt".** Kuratierte Kieztaten + Wohnraumeinbruch + Sachbeschädigung + Straßenraub + Fahrraddiebstahl. Finales Set Owner-Review-pflichtig. HZ als Maß, 3-Jahres-Mittel gegen Volatilität.
- **Touristen/Pendler-Verzerrung behandeln.** City-Core-LOR mit Einwohner-Nenner-Artefakt flaggen oder kappen; Entscheidung dokumentiert.
- **Methodik-Caveats dokumentieren.** Touristen/Pendler nicht im Nenner, Tatortprinzip (Taschendiebstahl ausgeschlossen), Dunkelfeld, kleine Fallzahlen volatil, HZ ≠ persönliches Risiko.
- **Lizenz-Disziplin.** Kriminalitätsatlas dl-de-by-2.0 / cc-by-sa, Namensnennung „Polizei Berlin" in MANIFEST + Methodik.
- **TDD (ADR-012).** XLSX-Parse, Delikt-Auswahl, HZ-3-Jahres-Mittel, BR→PLR-Spiegelung, Normalisierung, Composite-Ausschluss, Recompute sind Business-Logic → Test-First.

**Abhängigkeiten:** 14.0 (Atlas-Layer) + 14.1 (Foundation) sind Hard-Block für alles Weitere. 14.1 → 14.2 → 14.3 strikt sequenziell. Danach 14.4 + 14.5 parallel-möglich. 14.6 optionaler Spike. Voraussetzung: Epic 9 gelandet (5-Dimensions-Set), Epic 13 gelandet empfohlen (Option-C-Mechanik + `COMPOSITE_DIMENSIONS`-Whitelist existiert bereits, sonst hier mitziehen). Berührt `dimension-config.ts` → nicht gleichzeitig mit Epic 12/13 mergen.

### Story 14.0: Kriminalitätsatlas-Layer-Foundation (XLSX-Fetch + Parse + BR-Join)

As a Solo-Maintainer,
I want den Kriminalitätsatlas als deterministischen Daten-Layer in der Pipeline,
so that die neue Kriminalitäts-Dimension die HZ-Werte pro Bezirksregion lesen kann.

**Acceptance Criteria:**

**Given** die offene XLSX (`Fallzahlen&HZ 2016-2025.xlsx`, dl-de-by-2.0, Sheets `HZ_<jahr>` + `Fallzahlen_<jahr>`)
**When** ein Fetch+Parse-Schritt die HZ-Sheets der letzten drei Jahre lädt und die wohn-relevanten Delikt-Spalten (Kieztaten, Wohnraumeinbruch, Sachbeschädigung, Straßenraub, Fahrraddiebstahl) je LOR-Schlüssel extrahiert
**Then** entsteht ein BR-Layer mit MANIFEST-Eintrag (Quelle, Stand, SHA, Lizenz dl-de-by-2.0, „Polizei Berlin"), `-`-Werte als null, Berlin-gesamt + „nicht zuzuordnen" gesondert behandelt

**Given** die LOR-Hierarchie (BZR_ID = erste 6 Zeichen der PLR_ID)
**When** der BR-Wert auf die enthaltenen Planungsräume gespiegelt wird
**Then** jeder PLR erbt den HZ-Wert seiner Bezirksregion (konstant innerhalb der BR), kompatibel mit der flächen-gewichteten Aggregation (ADR-013)

**Given** TDD
**When** Parse-/Spiegelungs-Tests laufen
**Then** Spalten-Auswahl, 3-Jahres-Mittel, `-`/Missing-Handling, BR→PLR-Spiegelung und City-Core-Sonderfälle getestet, kein Crash bei null-Sets

**Given** Lizenz-Disziplin
**When** der Layer publiziert wird
**Then** dl-de-by-2.0-Attribution „Polizei Berlin" in MANIFEST + Methodik-Doku

### Story 14.1: Kriminalitäts-Dimensions-Foundation (Typ-Union + Config + Option C + Stigma)

As a Solo-Maintainer,
I want die Kriminalitäts-Dimension zentral anlegen (Typ-Union + Config + Composite-Ausschluss + Stigma-Familie),
so that alle Konsumenten gegen eine einzige Quelle der Wahrheit migrieren.

**Acceptance Criteria:**

**Given** das bestehende Dimensions-Set (5 Composite + Kultur)
**When** ich `KiezScoreDimension` um `'kriminalitaet'` erweitere
**Then** `KIEZ_SCORE_DIMENSIONS` enthält die neue Dimension (gerechnet + angezeigt), `DIMENSION_WEIGHTS.kriminalitaet = 0`, die fünf Composite-Dimensionen bleiben 0.20
**And** Kriminalität ist über die `COMPOSITE_DIMENSIONS`-Whitelist aus `computeOverallScore` ausgeschlossen (Option C); der Gesamt-Score bleibt das Mittel der fünf

**Given** `dimension-config.ts`
**When** ich `KRIMINALITAET_CONFIG` mit der Delikt-Auswahl + Gewichten setze
**Then** die Terme spiegeln die wohn-relevante Auswahl (Kieztaten + Wohnraumeinbruch/Sachbeschädigung/Straßenraub/Fahrraddiebstahl), Term-Gewichts-Summe = 1.0, HZ-3-Jahres-Mittel als Input

**Given** Stigma-Schutz (ADR-019) + Touristen-Verzerrung
**When** die Normalisierung + Choropleth-Familie gesetzt werden
**Then** Familie ist **Strukturell-Indigo** (nicht Gut-Grün), Normalisierung 0–100 für den Choropleth, City-Core-LOR-Verzerrung geflaggt oder gekappt, Entscheidung dokumentiert

**Given** TDD (ADR-012)
**When** compute-score/dimension-config-Tests laufen
**Then** Tests spiegeln das erweiterte Set, Composite-Ausschluss verifiziert (Gesamt-Score unverändert vom Kriminalitäts-Wert), Gewichts-Summe = 1, Normalisierungs-Kurve + City-Core-Behandlung getestet

### Story 14.2: DB-Schema-Migration (kiez_score + bezirk_score)

As a Solo-Maintainer,
I want das Postgres-Schema um die Kriminalitäts-Spalte erweitern,
so that der Build-Time-Cache die neue Dimension persistiert.

**Acceptance Criteria:**

**Given** die Foundation aus 14.1
**When** ich eine Drizzle-Migration schreibe
**Then** `kiez_score` + `bezirk_score` erhalten `kriminalitaet` (doublePrecision, nullable), `composite` bleibt, bestehende Spalten unverändert

**Given** die Migration
**When** `pnpm db:migrate` läuft
**Then** Schema konsistent, `getKiezScore`/`getBezirkScore` kompilieren gegen die neue Spalte

### Story 14.3: Pipeline-Recompute + Re-Run

As a Solo-Maintainer,
I want die Score-Pipeline auf das erweiterte Set umstellen und neu rechnen,
so that `kiez-scores.json` + DB die Kriminalitäts-Dimension enthalten.

**Acceptance Criteria:**

**Given** 14.0 + 14.1 + 14.2
**When** ich `compute-score.ts`/`build-kiez-scores.ts`/`aggregate-scores.ts` auf das erweiterte Set anpasse
**Then** `pnpm data:kiez-scores` + `data:aggregate-scores` produzieren deterministische Outputs inkl. Kriminalität, Composite unverändert

**Given** Re-Run + Konsistenz
**When** `data:rank` + `data:comparison` (Epic 11) neu laufen
**Then** der Composite-Rang bleibt unverändert (Kriminalität zählt nicht rein), der Kriminalitäts-Kontext-Wert ist verfügbar, Spot-Check plausibel (BR-Wert konstant über enthaltene PLR, City-Cores als Verzerrung erkennbar behandelt)

### Story 14.4: Konsumenten-Migration (Inspector + Map + Compare, Stigma-konform)

As a User,
I want die Kriminalitäts-Dimension als neutralen Kontext sehen,
so that Inspector, Karte und Vergleich sie ohne Stigma darstellen.

**Acceptance Criteria:**

**Given** die neuen Werte aus 14.3
**When** ich Inspector-Section, Choropleth-Score-Layer, `kiez-score-compare-block` und LLM-Renderer migriere
**Then** Kriminalität erscheint als eigene Kontext-Dimension, **Strukturell-Indigo-Familie**, neutrale Bezeichnung „erfasste Kriminalität (Häufigkeitszahl)", KEIN Composite-Ring-Segment mit Gut-Wertung, OG-Score-Card bleibt Composite-only

**Given** Stigma-Schutz + A11y
**When** Kriminalität gerendert wird
**Then** kein „sicher/gefährlich"-Label, kein „besser"-Pfeil, Methodik-Caveat (HZ ≠ Risiko, Touristen-Verzerrung) im Inspector verlinkt, Farbe nicht alleiniger Informationsträger (WCAG), BR-Granularität sichtbar gekennzeichnet

### Story 14.5: Content-Migration (Methodik + ADR + wo-lebt-es-sich-gut)

As a User,
I want dass die Methodik-Seite die Kriminalitäts-Dimension + ihre Grenzen erklärt,
so that die Darstellung transparent und nicht stigmatisierend ist.

**Acceptance Criteria:**

**Given** die neue Dimension
**When** ich `/methodik/kiez-score` + `docs/scoring-methodology.md` aktualisiere
**Then** Kriminalitäts-Dimension, Delikt-Auswahl/Gewichte, Quelle (Kriminalitätsatlas/Polizei Berlin, dl-de-by-2.0), HZ-Definition, 3-Jahres-Mittel, BR-Granularität und alle Caveats (Touristen/Pendler, Tatortprinzip, Dunkelfeld, kleine Fallzahlen) sind erklärt; explizit: nicht im Composite, kein „Sicherheits-Ranking"

**Given** die Score-Erweiterung
**When** ADR-019 referenziert wird
**Then** Methodik + ADR sind verlinkt und stimmig, Option-C-Mechanik + Stigma-Framing dokumentiert

**Given** `/wo-lebt-es-sich-gut`
**When** die Seite die Scores nutzt
**Then** der Composite-Rang bleibt unverändert; falls Kriminalität als Kontext gezeigt wird, dann Indigo + Caveat, ohne Rang-Wertung

### Story 14.6: City-Core-Verzerrung + Delikt-Set — Spike (optional)

As a Solo-Maintainer,
I want die Touristen/Pendler-Verzerrung quantifizieren und das Delikt-Set validieren,
so that die Normalisierung die City-Cores fair behandelt und das Set wohn-relevant ist.

**Acceptance Criteria:**

**Given** die HZ-Werte pro LOR
**When** ich die City-Core-LOR (Regierungsviertel, Alexanderplatz, Ku'damm, Tiergarten Süd) gegen Wohn-LOR vergleiche
**Then** ein Spike-Ergebnis dokumentiert die Verzerrungs-Größenordnung + die gewählte Behandlung (flaggen / kappen / separate Klasse) mit Begründung

**Given** Delikt-Set-Auswahl
**When** „Kieztaten" gegen die kuratierte Einzel-Auswahl verglichen wird
**Then** entweder Bestätigung des Sets oder begründete Anpassung; Owner-Review der finalen Gewichte

### Story 14.7: Epic-14-Dokumentation + Updates-Eintrag

As a Solo-Maintainer,
I want Epic 14 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag,
so that kein Wissens-Drift entsteht (Epic-7-Muster) und Nutzer die Dimension richtig einordnen.

**Acceptance Criteria:**

**Given** die neue Dimension + den Atlas-Layer
**When** der Data-Pipeline-Atlas + die Generatoren neu laufen
**Then** `pnpm doc:pipelines` + `pnpm doc:story-map` sind neu generiert, der Kriminalitätsatlas-Layer + die Dimension erscheinen, `docs/INDEX.md` + System-Map verweisen darauf, Frontmatter gesetzt

**Given** die Doku-Konsistenz
**When** geprüft wird
**Then** Methodik + ADR-019 + `docs/kriminalitaetsdaten-methodik.md` sind verlinkt und stimmig, Stigma-Framing + Caveats durchgängig, keine „Sicherheits-Score"-Stelle

**Given** die `/updates`-Route
**When** ein redaktioneller Changelog-Eintrag geschrieben wird
**Then** existiert `_content/updates/2026-MM-DD-kriminalitaet-kontext.md` (category `feature`), erklärt die Dimension in Nutzersprache + die Grenzen (HZ ≠ Gefährlichkeit, Touristen-Verzerrung, nicht im Gesamt-Score), verlinkt `/methodik/kiez-score`, hält die Forbidden-Token-Konvention (keine em-dashes, kein „gefährlich"/„sicher" als Wertung)

**Given** der Eintrag
**When** `/updates` + Feeds prerendern
**Then** der Eintrag erscheint chronologisch, Feed-Tests grün, kein Build-Fehler

### Story 14.8: Profile-Konsistenz nach Score-Erweiterung (crime-exkludiert)

As a Discovery-User,
I want dass die Prosa-Profile durch die neue Dimension NICHT verfälscht oder stigmatisierend werden,
so that Kriminalität als Karten-Kontext existiert, ohne in den Fließtext zu lecken.

**Acceptance Criteria:**

**Given** der Grounding-Input-Builder (`scripts/lib/profiles/build.ts` + `input.ts`)
**When** das erweiterte Score-Schema einliest
**Then** die Kriminalitäts-Dimension wird **bewusst NICHT** in den Profil-Input aufgenommen (Stigma-Schutz, ADR-019); Default-Entscheidung dokumentiert

**Given** der Fakten-Lint (`scripts/lib/profiles/fact-lint.ts`)
**When** er läuft
**Then** er failt, falls ein Profil Kriminalitäts-/Sicherheits-Aussagen enthält (kein „gefährlicher/sicherer Kiez"), Stigma-Token-Liste erweitert

**Given** die geänderte Score-Datenbasis (nach 14.3)
**When** `pnpm data:profiles` prüft, ob Regeneration nötig ist
**Then** da Kriminalität nicht im Profil-Input ist, ändert sich der `inputHash` NICHT durch diese Dimension → keine unnötige Regeneration; falls doch (z. B. Schema-Reihenfolge), Diff der betroffenen Profile crime-frei verifiziert

**Given** das Editorial-Gate (PR-git-Diff) + EU-FOSS-Constraint
**When** reviewt wird
**Then** `lint:profiles` grün, kein Profil erwähnt Kriminalität, KEIN API-Call im Deploy/prebuild (Owner-Decision 11.6 bleibt)

**Sequencing:** 14.0 + 14.1 sind Fundament (Atlas-Layer + Typ-Union/Stigma-Config). 14.1 → 14.2 → 14.3 strikt sequenziell (Foundation → Schema → Re-Run, jede Stufe grün vor der nächsten, analog Epic 9/13). Danach 14.4 + 14.5 parallel-möglich. 14.6 optionaler Spike, sollte aber vor 14.1-Finalisierung der Normalisierung Input liefern (City-Core-Behandlung). 14.7 dokumentiert das Epic + `/updates`. 14.8 ist der Capstone: anders als 13.8 KEINE teure Profil-Regeneration, sondern die bewusste Absicherung, dass Kriminalität crime-frei aus der Prosa bleibt. Voraussetzung: Epic 9 gelandet (5-Dimensions-Set), Epic 13 empfohlen (Option-C-Mechanik + `COMPOSITE_DIMENSIONS`-Whitelist existiert; sonst hier mitziehen). Berührt `dimension-config.ts` → nicht gleichzeitig mit Epic 12/13 mergen, sonst Konflikt. Entscheidungs-Grundlage: ADR-019.
