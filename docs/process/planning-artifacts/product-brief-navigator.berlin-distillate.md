---
title: "Product Brief Distillate: navigator.berlin"
type: llm-distillate
source: "product-brief-navigator.berlin.md"
created: "2026-05-10T17:09:00Z"
purpose: "Token-efficient context für downstream PRD creation"
---

# Distillat — navigator.berlin

Kondensierter Detail-Pack mit allem Overflow aus Discovery + Recherche-Doc + Reviewer-Findings, der nicht in den Executive Brief gehört.

## Eigentümer & Hebel-Logik

- Owner: Matze Schmidbauer, Solutions Architect bei mtc.berlin (Berliner Agentur, GEO/AEO/DSGVO-Beratung). Projekt persönlich, NICHT Firmen-Asset.
- Drei Hebel: (1) persönliche Sichtbarkeit für Gehaltsgespräch akut, (2) Marktwert-Antidot mittelfristig nach 20 Jahren bei einem Arbeitgeber, (3) persönliche Brand langfristig.
- Footer = "von Matze [Nachname]" + Link auf Profil/LinkedIn (nicht mtc.berlin-Logo). Eigentümerschaft in Wahrnehmung wichtig.
- "Erfolgsmetriken sind irrelevant" — bewusste User-Entscheidung. Cluster-A-Risiko (Brand-Schaden bei verfallender Site unter Eigennamen) explizit nicht adressiert auf Wunsch.

## Persona-Stance

- **Bewusst keine Primary Persona.** User explizit: "kann ich nicht sagen. ist auch egal. die seite wird für alle irgendwie optimiert".
- Rejected: Repositioning auf "Tool für Datenjournalisten" als Primär-Frame (Opportunity-Reviewer-Vorschlag).
- 6 Nutzungs-Anlässe als Erzähl-Hilfe, nicht als Persona-Steckbriefe: Kontextuelle Neugier, Umzug/Wohnungssuche, Datenjournalismus, Politik-Interesse, Touristisches Stöbern, Stadtforschung.
- Risiko: "Buffet-UI" — Mitigation per disziplinierten Defaults (nicht alle Layer gleichzeitig sichtbar).

## Stack-Entscheidungen (gefällt, nicht verhandelbar)

- **SvelteKit + `adapter-node`** (NICHT `adapter-static`) — Phase 1 strikt static-first ausgeliefert, Live-Daten erst Phase 2.
- **Velocity-Annahme:** Claude Code baut. 4-Wochenenden-Cap aus Recherche-Doc ist Soft-Limit, nicht harter Constraint.
- **MapLibre + OpenFreeMap Public Instance** als Tile-Provider Phase 1.
- **Tile-Provider-Abstraktion:** Wechsel auf Protomaps + PMTiles ist Config-Edit + Deploy, einmalig vorab getestet als Hedge gegen OpenFreeMap-Bus-Faktor (Zsolt Ero, One-Man-Project).
- **Hosting:** Hetzner-Frankfurt + Coolify + Traefik. **Bewusst kein Cloudflare** (US/CLOUD Act, Default-Cookies). EU-only-Linie kompromisslos.
- **Layer-7-Schutz:** CrowdSec (FOSS, Paris), als Traefik-Plugin (nicht Container) seit 2024 empfohlen, AppSec-Funktionen verfügbar in Plugin 1.2.0+.
- **Layer-3/4-Schutz:** Hetzner-eingebaut, kostenlos, ausreichend für realistische Civic-Tech-Angriffsvektoren.
- **Cookieless by default:** kein `Set-Cookie`-Header verlässt den Server. SvelteKit, Traefik, CrowdSec setzen alle keine Cookies.
- **Caching ohne CDN:** Browser-Cache via HTTP-Header (Static-Layers `max-age=2592000`, Cache-Invalidation per Filename-Hashing), SvelteKit-Static-Files via Traefik aggressiv gecached, In-Process LRUCache (`lru-cache` npm) für berechnete Outputs falls nötig.
- **Datenarchitektur Phase 1:** 25+ Layer als simplifiziertes GeoJSON in `static/layers/`, je 100KB-2MB. Reprojektion EPSG:25833 → EPSG:4326 via WFS `srsName` oder `proj4js`. Build-Skript `scripts/fetch-static.ts`.
- **Datenzugriffs-Abstraktion:** `$lib/data/` mit `getBoundariesAtPoint(lat, lng): Promise<LayerHits>`. Phase 1 Turf.js auf GeoJSON, Phase 2/3 SQL-Swap ohne Component-Code-Änderung.
- **Drizzle/Postgres:** Phase 1 raus (Skeleton würde Surface unnötig vergrößern). Phase 2 für tabellarische Wahldaten + Klima-Stationen. PostGIS erst Phase 3 mit konkretem Cross-Layer-Use-Case.
- **WebMCP-Integration:** Phase 1, Tools `address_lookup` / `cross_layer_query` / `get_kiez_profile`, Resources (aktive Adresse, geladene Layer), Prompt-Templates.
- **Dynamic OG-Images:** SSR-PNG, Stack-Optionen Satori (Vercel) oder Sharp + Map-Tile-Snapshot. Pro Bezirk/Kiez/Layer-Konzept-URL.
- **JSON-LD-Schema:** `Place`, `AdministrativeArea`, `Dataset`, `FAQPage` (für FAQ-Sektionen pro Kiez/Bezirk).
- **`llms.txt` + `llms-full.txt`** als Crawler-/LLM-Übersicht.

## Abgelehnte Ideen (mit Begründung)

- **Redis / Dragonfly Cache** — abgelehnt. Browser+Static-File-Caching > Redis-Roundtrip. WebMCP/`query.live` haben Server-Side-Deduplication. LRUCache in-process reicht solange Single-Instance.
- **Cloudflare CDN/WAF** — abgelehnt. US-Firma + CLOUD Act + Default-`__cf_bm`-Cookies untergraben EU-only-cookieless-Linie.
- **Eigener MCP-Server** (`navigator-berlin-mcp`) — explizit abgelehnt durch User. WebMCP (Browser-side) bleibt als Phase-1-Feature.
- **Bus-Faktor-/Sunset-Planung** — User: "denk ich nicht drüber nach". Reviewer-Cluster-A-Risiken (Brand-Schaden, Solo-Maintainer-Decay) sind dokumentiert aber nicht im Brief adressiert.
- **Server-Log-Aggregate als Evidenz-Quelle** — implizit nicht gewählt. Hebel #1 (Marktwert) ohne Resonanz-Signal bleibt Glaubenssache.
- **Repositioning auf Primär-Persona Datenjournalist** — abgelehnt. "Für alle optimiert" gewählt.
- **Forken Amsterdam Atlas** — abgelehnt. User hat Code geskimmt, "war nicht beeindruckt". Kurzer Code-Blick okay als Inspiration, kein Fork.
- **i18n / Englische Version** — abgelehnt. Nur Deutsch.
- **Plausible / Matomo / sonstiges Analytics** — abgelehnt. Cookieless-Linie kompromisslos.
- **User-facing LLM-Features (Chatbox, Q&A, Search-Reformulation)** — abgelehnt. Pur datenbasiert. `llms.txt` für Crawler ist okay, kein User-LLM.
- **Public API / Downloads** — abgelehnt. Reines Frontend-Erlebnis.
- **User-Accounts / UGC / Kommentare** — abgelehnt.
- **Zeit-Slider in Phase 1** — abgelehnt. Phase 1 statisch heute. Klima-Zeitreihe ist die einzige historische Schicht und kommt als statisches JSON.
- **Live-Daten in Phase 1** (BVG / BLUME / Wetter) — bewusst auf Phase 2 verschoben. Reduziert Surface (kein experimental `query.live`, keine Drittanbieter-API-Health-Checks Phase 1).
- **Mobile sekundär / Desktop priorisiert** — abgelehnt. Vollständig responsiv + zugänglich (BFSG-konform).
- **Feature-Flags / Backwards-Compat-Shims** — implizit abgelehnt durch CLAUDE.md-Style.

## Anti-Goals (explizit)

- Kein Auth, kein UGC, kein Tracking
- Kein i18n, nur Deutsch
- Kein User-facing LLM
- Keine Public API / Downloads
- Kein PostGIS bis Phase 3
- Kein Drizzle/Postgres in Phase 1
- Kein Bus-Faktor-Mitigation-Plan (User-Entscheidung)
- Keine Erfolgsmetriken (User-Entscheidung)

## Scope-Signale

### Phase 1 — drin (Layer-Bundles)

- **Bundle A — Boundaries (Pflicht):** Bezirk + LOR (3 Ebenen: Prognoseraum 60 / Bezirksregion 138 / Planungsraum 542) + PLZ + Ortsteile.
- **Bundle B — Wohn-Daten:** Mietspiegel-Wohnlagen + Bodenrichtwerte + Gebäudealter.
- **Bundle C — Umwelt + Memorial:** Lärmkarten (L_DEN + L_NIGHT) + Solarpotenzial + Klimaanalyse + Stolpersteine + Trinkbrunnen (Saisonalität Mai–Oktober im UI reflektieren!).
- **Klima-Zeitreihe:** Berlin-Dahlem 1719–heute (älteste durchgehende DWD-Station Deutschlands) plus Buch (1889+), Tempelhof (1919+), Brandenburg-Schönefeld (1957+). Hitze-/Frost-/Sommertage-Sparkline ab 1950, Jahresmitteltemperatur-Long-View ab 1719.
- **WebMCP-Integration**, **Dynamic OG-Images**, **FAQ-Pages pro Kiez/Bezirk** mit JSON-LD `FAQPage`.

### Phase 1 — explizit raus

- Live-Daten (Bundle D) — kommen Phase 2.
- Zeit-Slider, Drizzle/Postgres, PostGIS.
- Plausible/Matomo, i18n, Auth, UGC, User-LLM, Public API.

### Phase 2 — geplant

- Live-Daten-Bundle (BVG via `v6.bvg.transport.rest`, BLUME via `luftdaten.berlin.de`, Wetter via Bright Sky / Open-Meteo). Implementierung via `query.live` sobald aus experimental, sonst klassisch via `load`-Funktionen mit 60-Sekunden-Polling.
- Wahlebene mit historischer Tiefe (BVV / AGH / BTW / Volksentscheide).
- Cross-Data-Erzählungen als deterministische Template-Texte (KEINE LLM-Generierung user-facing).
- Zeit-Slider für historische Layer (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete-Welle).
- Embeddable Widgets / oEmbed für Datenjournalismus.
- RADOLAN-Regenradar via Python-Sidecar (FastAPI + `wradlib`).
- Drizzle/Postgres-Backfill für tabellarische Daten.

### Phase 3 — Vision

- PostGIS für räumliche Cross-Layer-Aggregation.
- Memorial-Map kuratiert.
- Daten-Quality-Layer.
- Redaktioneller Content-Layer (~30–50 aktive Berliner Clubs als JSON committen).

## Datenquellen — konkrete Endpunkte

### Statisch / Boundaries

- **`daten.odis-berlin.de`** (Geoexplorer): direkter Download GeoJSON/Shapefile/KML für LOR (3 Ebenen), Bezirke, Ortsteile, PLZ, Verkehrszellen, Straßen-Polygone.
- **FIS-Broker WFS:** `https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/...` — alle Spezial-Layer (Mietspiegel-Wohnlagen, Lärmkarten, Bodenrichtwerte, Bäume, Solarpotenzial, Kriminalitätsatlas).
- **`daten.berlin.de`** (CKAN-API): Metadaten + DCAT-AP.de.
- **`tifa365/awesome-berlin-data`** (CC0): Master-Inventar aller Berlin-Open-Data-Projekte. Macht 80% weiterer Recherche obsolet.
- **`tifa365/berlin-opendata-mcp`**: existierender MCP-Server für 2.500+ Datensätze, 6 Tools für CKAN-Suche.

### WFS-Tools

- `derhuerst/query-fis-broker-wfs` (Node, GeoJSON-Output)
- `milafrerichs/fis_broker_helper` (Node)
- `patperu/fisbroker_data` (R, fertige Konversionen LOR/Bodenrichtwerte/Gebäudealter/EW-Dichte)
- ODIS WFS Explorer (browser-Tool, frisch 2025)

### Live (Phase 2)

- **BVG/VBB:** `v6.bvg.transport.rest` und `v6.vbb.transport.rest` (derhuerst). Kein Key, CORS offen, 100 req/min. Endpunkte: `/locations`, `/stops/:id/departures`, `/radar?bbox=...`, `/journeys`.
- **BLUME-Luftqualität:** `luftdaten.berlin.de` API seit Mai 2022. 17 Stationen, 5-Min-Werte für PM10/PM2.5/NO2/NOx/O3/SO2. dl-de/zero.
- **Wetter:** Bright Sky `api.brightsky.dev` (DWD-Wrapper, kein Key, CORS, 2M+ req/Tag verträgt) ODER Open-Meteo `api.open-meteo.com` (CC-BY 4.0, gleichwertig, mehr Modelle).

### Klima historisch

- DWD Climate Data Center: `opendata.dwd.de/climate_environment/CDC/`. Stationen wie 00403 Berlin-Dahlem (1719+), 00400 Berlin-Buch (1889+), 00433 Tempelhof (1919+).
- Pfade: `observations_germany/climate/{annual,monthly,daily,hourly,10_minutes}/`. Klima-Kennzahlen: `climate_indices/kl/` (Tropennächte, Frosttage, Sommertage, heiße Tage, Eistage).

### Memorial

- **Stolpersteine:** `daten.berlin.de/datensaetze/liste-der-stolpersteine-berlin` (~5.000 Steine, gepflegt von Dr. Silvija Kavcic) + OSM Overpass `memorial:type=stolperstein` (täglich aktuell) + Wikipedia für Personen-Hintergrund.
- **Mauer/Sektoren:** GeoJSON in OSM/Code-for-Berlin-Repos.
- **Berliner Denkmale:** `daten.berlin.de/datensaetze/koordinaten-berliner-denkmale` (KML mit Mittelpunkten).

### Trinkbrunnen

- **`daten.berlin.de/datensaetze/trinkwasserbrunnen-wfs-47dba2c3`** — offiziell von Berlin Wasserbetriebe, dl-de/zero, letzte Aktualisierung Februar 2026. Brunnentypen: Botsch, Kaiser, Wiener, Bituma (behindertengerecht).
- **Saisonalität Mai–Oktober** — UI-Pflicht, sonst zeigt Karte im Februar nicht-nutzbare Brunnen.

### Schatten / Hitze

- **Berliner Erfrischungskarte** (`erfrischungskarte.odis-berlin.de`) — Code Open Source: `technologiestiftung/erfrischungskarte-frontend` + `-daten`.
- Klimaanalysekarten 2014 als FIS-Broker-WFS.

## Lizenz-Hierarchie

- **Mehrheit dl-de/zero-2-0** ≈ CC0. Keine Attribution-Pflicht, kommerziell, abgeleitet, sub-lizenziert alles erlaubt.
- **dl-de/by-2-0** für ältere Datensätze. Footer-Zeile reicht: "Geoportal Berlin / [Titel]".
- **CC BY 3.0 DE / CC BY 4.0** vereinzelt (LOR-Hierarchie auf manchen Portalen).
- **OSM-Daten:** ODbL 1.0, Footer "© OpenStreetMap contributors".
- **Wikipedia/Wikimedia Commons:** CC-BY-SA 3.0/4.0.
- **BVG/VBB-API:** kein Key, CORS offen, 100 req/min, faktisch frei nutzbar.
- **Lizenz-Disziplin Phase 1:** Per-Layer-Attribution im Inspektor-Panel + zentrale Lizenz-Matrix-Page (`/lizenzen` oder `/datenquellen`).

## Wettbewerbs-Intel

- **Tagesspiegel-Lab BTW 2025 Berlin-Karte:** macht Adress-Suche → Stimmbezirk → historische Ergebnisse seit Wiedervereinigung. Direkter Overlap mit Phase-2-Wahllayer. Repositioning: Wahl-Layer ist Bündelung mit anderen Layern, nicht "die bessere Wahlkarte". Cross-Layer-Story (Wahl × Diebstahl × Solar) ist USP.
- **Amsterdam Atlas** (`amsterdam.github.io/projects/atlas`): FOSS, 1:1 dasselbe Pattern (single search → layered municipal APIs). User hat Code geskimmt, "nicht beeindruckt". Kurzer Code-Blick als Inspiration okay, kein Fork. UX nicht überzeugend, NL-Datenmodell hat Berliner Spezifika (Mietspiegel-Wohnlagen, LOR, Mauer) nicht.
- **`boundaries.beta.nyc`:** lebt, 47k Users 2025 laut BetaNYC-EOY-Report, organisationell gesichert bis 2026. Aktiver Peer, nicht Reliquie.
- **Kiezatlas (`kiezatlas.berlin`):** seit 2003, DeepaMehta 4 Stack (legacy), thematisch eng (Jugendhilfe/Sozialraumdaten), läuft auf institutioneller Lebenserhaltung (outreach gGmbH). Sub-Use-Case, kein Wettbewerber.
- **CityLAB / Technologiestiftung** (Erfrischungskarte, Gieß den Kiez, KiezColors, Wahlbezirke-Prototype, QTrees): thematische Apps, KEINE Mega-Plattform-Strategie. Komplementär. Könnten in 4 Wochen nachbauen wollen sie nicht.
- **Stadtplan Wien** (`wien.gv.at/stadtplan`): städtisch betrieben, breit, ernst. Closest peer for ambition.
- **London Datastore:** Daten-Portal mit per-Ward-Atlas-Profilen, kein integriertes Adress-Lookup.
- **APUR Atlas of Greater Paris:** institutionell, 300+ Karten über 130 Communes.

## Tech-Stack Reality-Check (Web-Recherche)

- **SvelteKit `query.live`:** experimental, NICHT semver. Breaking Changes Februar 2026 (`buttonProps` raus) + Mai 2026 (v2.56: client-requested refresh permissions, run() method, await-outside-render disallowed) + v2.57 (`requested` property shape). Erwarte Refactors alle paar Monate. → Phase 2 Live-Daten haben Polling-Fallback dokumentiert.
- **OpenFreeMap:** überstand 3B-Requests-in-24h-Spike (wplace.live, August 2025) mit Cloudflare-Bandbreite-Sponsoring + 2 Hetzner-Servern. Kapazität robust, Bus-Faktor (Zsolt Ero / hyperknot) bleibt. → Tile-Provider-Abstraktion + Protomaps-Fallback einmalig vorab getestet als Hedge.
- **Protomaps:** non-commercial gratis (~1M Tiles/Monat via `api.protomaps.com` mit Key). Commercial nur via GitHub Sponsors. Kein SaaS-Upgrade-Pfad. PMTiles-Selbst-Host als Fallback.
- **CrowdSec 2026:** Plugin (nicht Container) ist offizieller Weg, Streaming-Mode (60s Decision-Sync), AppSec/WAF seit Plugin 1.2.0 + CrowdSec 1.6.0. Captcha oder Ban als Remediation.
- **OSS-Sustainability:** Tidelift 2024 — 60% Solo-OSS-Maintainer wollen aufhören oder haben aufgehört. Ingress NGINX verliert März 2026 Security-Patches wegen Maintainer-Burnout. Code-for-Germany-Projekte ohne institutionellen Anker sterben in 2-3 Jahren. → Bewusste Nicht-Mitigation per User-Entscheidung.

## Reviewer-Risiken (informational, nicht im Brief gelandet)

- **Cluster A — Risiko-Floor / Brand-Schutz:** Domain unter Eigennamen + null Sunset-Plan + Solo-Maintenance = Asymmetrie. Bei Decay nach 18 Monaten persistenter Brand-Schaden (statistisch wahrscheinlich laut Code-for-Germany / Tidelift).
- **Reputations-Risiko:** veraltete Mietspiegel-Daten zeigen "Wohnlage einfach" für Adresse, die seit 2 Jahren "mittel" ist — schadensrelevant in Mietkontexten. Mitigation: Datenstand-Banner pro Layer (im Brief implementiert).
- **Erinnerungspolitisches Risiko:** Stolpersteine + Mauer/Sektoren sensibel. Mitigation: Editorial-Verantwortung-Absatz (im Brief implementiert).
- **Doxing-Risiko:** Personal-Domain + Klarnamen-Footer + politische Layer + virales Teilen in Wahlkampf-/Mietendeckel-Debatten = potentiell. Nicht im Brief.
- **Stack-Wartungssurface:** experimental `query.live` + OpenFreeMap-Bus-Faktor + Hetzner-self-host + Drizzle-Setup-on-Tag-1 = ~1 Wartungs-Wochenende pro Quartal nur um stehen zu bleiben. → Phase 2 für Live-Daten reduziert das Phase-1-Risiko.
- **Hidden Dependencies:** Nominatim Rate-Limits oder Self-Host-Aufwand, BVG/BLUME/DWD als Drittanbieter ohne dokumentierten Health-Check (Phase 2 relevant), Domain-Renewal-Verpasser-Szenario unter Eigennamen.

## Offene Fragen (durch User-Entscheidung deferiert)

- **Cluster A** (Sunset-Plan, Server-Log-Aggregate, CHANGELOG-Evidenz für Hebel #1): nicht entschieden, im Brief offen.
- **Bus-Faktor 1:** User "denke ich nicht drüber nach". Kein Backup-Maintainer, kein Auto-Sunset-Mechanismus, keine Übergabe-Doku-Klausel.
- **Personal/mtc-Trennung:** im Brief deklariert, aber Hebel #2 (DSGVO-Showcase für mtc-Beratungslinie) durchbricht Trennung. Nicht aufgelöst.
- **Launch-Sequencing:** Soft-Launch (Civic-Tech-Slack/Mastodon) vs. Hard-Launch (LinkedIn/Newsletter) — nicht festgelegt.
- **Hebel-#1-Evidenz:** ohne Tracking + ohne Server-Log-Aggregate keine quantitative Grundlage für Gehaltsgespräch. "Anekdotische Resonanz" akzeptiert.
- **Datenjournalist-Persona-Validierung:** keiner ist gesprochen worden ob das Tool wirklich genutzt würde. Cross-Layer-Datenjournalismus-These ist Annahme.
- **SEO-Long-Tail-Validierung:** ~200 prerenderte URLs + ~1.000 FAQ-Q&As. Keine Keyword-Recherche vorab — könnte rankings-leer bleiben gegen berlin.de/Wikipedia/Tagesspiegel.

## Detailed User Scenarios

- **Kontextueller Bürger:** "Wohne seit 8 Jahren in Reuterkiez. Wie ist eigentlich die Wohnlage hier laut Mietspiegel? Wie laut ist es nachts? Wann gehen die Trinkbrunnen wieder an?" — Adresse rein, Inspektor-Panel zeigt 5–10 Layer.
- **Umzieher:** "Schaue zwei Adressen an, eine in Schöneberg, eine in Wedding. Welche ist verkehrstechnisch besser? Wo ist die Lärmbelastung niedriger? Wie sind die Bodenrichtwerte?" — Vergleichs-Modus (Phase 3? oder Phase 2?).
- **Datenjournalist:** "Ich recherchiere zu Solar-Ausbau in Friedrichshain-Kreuzberg vs. Steglitz-Zehlendorf. Wo sind die Solarpotenzial-Karten plus Bodenrichtwerte plus Gebäudealter pro LOR-Bezirksregion?" — Cross-Layer auf einer Karte, Embed-Widget für den Artikel (Phase 2).
- **Politik-Interessierter:** "Wer hat in meinem Wahlbezirk in den letzten 5 BTW gewählt? Wie hängt das mit der Wohnlage und der Lärmbelastung zusammen?" — Phase 2.
- **Tourist:** "Welche Stolpersteine sind im Umkreis von 500m um meine Adresse? Welche historischen Kontexte gibt es?" — Memorial-Layer, Wikipedia-Links per Knopfdruck.
- **Stadtforscher:** "Wie korrelieren Milieuschutzgebiete mit Wahlverhalten und Demographic-Indikatoren?" — Phase 3 PostGIS.

## Empfohlene Tools für PRD-/Implementation-Phase

- **OG-Image-Rendering:** Satori (Vercel, JSX → SVG → PNG, Node-kompatibel) ODER `node-canvas` + `sharp` falls SVG-Rendering nicht reicht.
- **JSON-LD-Generierung:** structured-data Pakete oder eigene typesafe Templates in `$lib/seo/`.
- **GeoJSON-Reprojektion:** `proj4js` oder direkt im WFS-Request via `srsName=EPSG:4326`.
- **GeoJSON-Simplifizierung:** `mapshaper` (CLI) für Build-Zeit, `turf.js` für Runtime falls nötig.
- **Address-Lookup-Punkt-in-Polygon:** Turf.js (`@turf/boolean-point-in-polygon` + R-Tree-Index für Performance).
- **DWD-Klima-Parser:** eigenes TypeScript-Skript, CSV-Parser. Keine externen DWD-Wrapper nötig für statisches Phase-1-Caching.
- **WebMCP-Library:** `webmcp` npm — `registerTool()`, `registerResource()`, `registerPrompt()`, `registerSampling()`.
- **CrowdSec-Setup:** Hetzner-Tutorial Januar 2026 als Vorlage (`community.hetzner.com/tutorials/coolify-crowdsec-traefik-supavisor-protection/`).
- **MapLibre-Lazy-Load:** nach Hydration, sonst blockiert Initial-Paint → schadet Core Web Vitals → schadet SEO.
- **Caching-Header:** Static-Layers `cache-control: public, max-age=2592000, immutable`. HTML-Pages `max-age=3600, must-revalidate`.

## Sustainability / Project Discipline

- **Build-Pipeline reproduzierbar:** ein anderer Mensch muss in 5 Jahren `pnpm install && pnpm fetch && pnpm build` ausführen können und eine identische Site bekommen.
- **Datenstand klar versioniert:** `static/layers/MANIFEST.json` mit Quelle, Stand, Lizenz, SHA pro Layer.
- **Open Source:** Repository public, MIT-Lizenz, README + ARCHITECTURE.md + ADR-Verzeichnis als "recruiter-readable" Artefakte.
- **Pflege-Modus:** wird kommuniziert wenn er kommt. Konkrete Trigger nicht festgelegt (User-Entscheidung).
- **Code-Disziplin:** Tests-First nicht erzwungen, aber Code "wieder-verstehbar in 6 Monaten ohne Claude" als Selbst-Anspruch (CLAUDE.md user-instructions: keine Backwards-Compat-Hacks, keine Premature-Abstraction, no comments unless WHY non-obvious).
