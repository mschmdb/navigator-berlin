---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
status: complete
completedAt: '2026-05-11T17:30:00Z'
releaseMode: phased
classification:
  projectType: web_app
  domain: govtech
  domainNotes: 'Civic-Tech-Spielart, EU-Rahmen (DSGVO, BFSG 2025, WCAG 2.2 AA/AAA, dl-de/zero) statt US (FedRAMP, Section 508)'
  complexity: high
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin.md
  - _bmad-output/planning-artifacts/product-brief-navigator.berlin-distillate.md
  - _user-input/berlin-atlas-recherche.md
  - _user-input/navigator-berlin-design.md
workflowType: 'prd'
projectName: 'navigator.berlin'
documentCounts:
  brief: 1
  distillate: 1
  research: 1
  designDirective: 1
  projectDocs: 0
projectType: greenfield
---

# Product Requirements Document — navigator.berlin

**Author:** Matze Schmidbauer
**Date:** 2026-05-11

## Inhalt

1. [Executive Summary](#executive-summary) — Vision, Differenzierer, Eigentümer
2. [Project Classification](#project-classification) — Typ, Domain, Komplexität, Kontext
3. [Success Criteria](#success-criteria) — qualitative Hebel + harte technische Schwellen
4. [Product Scope](#product-scope) — Phase-1/2/3-Boundary auf einen Blick
5. [User Journeys](#user-journeys) — 5 Narrativen plus Capability-Summary
6. [Domain-Specific Requirements](#domain-specific-requirements) — DSGVO, BFSG, EU-Hosting, Editorial-Verantwortung, Risiken
7. [Innovation & Novel Patterns](#innovation--novel-patterns) — WebMCP, Cross-Layer, 1719-Klima, EU-FOSS-Stack
8. [Web App — Specific Requirements](#web-app--specific-requirements) — Browser-Matrix, Responsive, Performance, SEO/AEO, Real-time, Accessibility, Architektur-Bauplan
9. [Project Scoping & Phased Development](#project-scoping--phased-development) — MVP-Strategie, Detail-Scope, Risk-Mitigation, Confirmation-Gate
10. [Functional Requirements](#functional-requirements) — Capability-Contract (FR1–FR67)
11. [Non-Functional Requirements](#non-functional-requirements) — Performance, Security, Privacy, Accessibility, Integration, Reliability, Maintainability

Quell-Dokumente: Brief + Distillat, Recherche-Doc (`berlin-atlas-recherche.md`), Design-Direktive (`navigator-berlin-design.md`). Alle Anforderungen in diesem PRD sind testbar oder als bewusste qualitative Entscheidung des Eigentümers markiert.

## Executive Summary

`navigator.berlin` ist eine SvelteKit-Web-App, in die jede Berliner Adresse eingegeben wird und die als Antwort sämtliche administrativen Grenzen und themenbezogenen Stadtdaten rund um diesen Punkt im selben Inspektor-Panel zeigt — Bezirk, LOR-Hierarchie, Mietspiegel-Wohnlage, Bodenrichtwert, Gebäudealter, Lärmkarte, Solarpotenzial, Stolpersteine, Trinkbrunnen, plus eine Klima-Zeitreihe der nächstgelegenen DWD-Station bis zurück zu 1719 (Berlin-Dahlem, älteste durchgehende DWD-Station Deutschlands).

Das Tool schließt eine reale Lücke in der Berliner Civic-Tech-Landschaft: Hunderte offene Geo-Layer existieren über `daten.berlin.de`, FIS-Broker und ODIS, sind aber in atomistischen Themen-Apps fragmentiert (Erfrischungskarte für Schatten, Gieß den Kiez für Bäume, Tagesspiegel-Lab für Wahlbezirks-Ergebnisse, milieuschutz.org für Milieuschutz). Eine Person, die nach „was ist hier eigentlich los?" fragt, muss heute zwischen 5–10 Tools wechseln. `navigator.berlin` macht keinen einzelnen Layer besser als die Spezialisten — es bündelt sie an der Adresse als gemeinsamem Schlüssel.

Owner ist Matze Schmidbauer persönlich (nicht sein Arbeitgeber mtc.berlin). Projekt ist nicht-kommerziell, EU-only, cookieless, FOSS-gestützt; es zahlt auf persönliche Sichtbarkeit und auf die DSGVO-/GEO-/AEO-affine Beratungslinie ein, ohne ein Produkt im Markt-Sinne zu sein. Phase 1 wird strikt static-first ausgeliefert; Live-Daten (BVG, BLUME, Wetter) und Wahlebene folgen in Phase 2.

### What Makes This Special

- **Cross-Layer im selben Inspektor-Panel.** Konkurrenz ist atomistisch — eine App pro Thema. `navigator.berlin` bringt Wahlbezirk × Mietspiegel-Wohnlage × Solaranlagen-Dichte × Fahrraddiebstähle in *dasselbe* Panel an *derselben* Adresse. Das ist der Datenjournalisten-Hebel und der Aha-Moment für Bürger.
- **LLM-bedienbar, nicht nur LLM-lesbar.** WebMCP (`webmcp.dev`) exponiert Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`), Resources (aktive Adresse, geladene Layer) und Prompt-Templates direkt für browserseitige MCP-Agenten — kein separater MCP-Server nötig. Ergänzt durch `llms.txt` + `llms-full.txt`, JSON-LD `Place`/`AdministrativeArea`/`Dataset`/`FAQPage`-Markup und dynamisch generierte FAQ-Sektionen pro Kiez und Bezirk (~1.000 strukturierte Q&As skaliert ohne redaktionellen Aufwand). Berliner Civic-Tech-Premiere; direkter Brückenschlag zur GEO/AEO-Beratungslinie.
- **Berlin-Spezifika konsequent.** Mietspiegel-Wohnlagen, Milieuschutzgebiete, LOR-3-Ebenen-Hierarchie (60 / 138 / 542), Mauer/Sektoren als historische Schicht, Bodenrichtwerte, Schatten- und Hitzedaten, plus 1719-Klima-Erbe (Dahlem) — Schichten, die kein NYC-/Amsterdam-Klon hätte.
- **Stille Designsprache.** IBM Plex Sans/Serif/Mono als durchgehende Schriftfamilie für UI, Map-Labels und Charts. Off-White-Palette mit AAA-Kontrasten und Indigo-Akzent, kein Dark Mode (bewusst). MapLibre-Plex-Cartography mit Hairline-Linien und Plex-Beschriftung. LayerChart v2 mit Okabe-Ito-Mehrserien-Palette. Gestalt-Prinzipien tragen Struktur statt Cards und Borders.
- **WCAG 2.2 AA komplett, AAA wo möglich.** BFSG-konform (gilt seit 2025), tastatur-bedienbare Karte, Screenreader-tauglich (axe-core CI, Playwright + axe). Konsequenter Standard, nicht Differenzierer — aber im Civic-Tech-Umfeld selten konsequent umgesetzt.
- **EU-FOSS-Architektur als Stellungnahme.** Hetzner-Frankfurt + Coolify + Traefik + CrowdSec. Bewusst kein Cloudflare (US/CLOUD Act). Cookieless by default, kein US-Drittanbieter im Pfad, kein `Set-Cookie`-Header. Domain unter persönlichem Namen, Footer „von Matze [Nachname]" statt Firmen-Logo.

**Core Insight:** ODIS / CityLAB / Technologiestiftung bauen bewusst thematische Apps statt eine Mega-Plattform — strategische Entscheidung. Diese Lücke ist offen, weil keine Institution sie schließen *will*. Ein persönliches Projekt kann sie komplementär füllen, ohne in Konkurrenz zu treten.

## Project Classification

- **Project Type:** Web App (SvelteKit mit `adapter-node`, prerendered Hybrid-Rendering, MapLibre, kein API-Backend in Phase 1)
- **Domain:** GovTech / Civic-Tech (Berliner Open-Data-Ökosystem). EU-Rahmen: DSGVO, BFSG 2025, WCAG 2.2 AA/AAA, Berlin-Open-Data-Verordnung mit Lizenz-Hierarchie dl-de/zero / dl-de/by / CC BY / ODbL
- **Complexity:** High — Multi-Source-Datenpipeline (FIS-Broker WFS, ODIS, DWD Climate Data, OSM Overpass), Reprojektion EPSG:25833 → 4326, Cross-Layer-Algorithmik, GEO/AEO-Stack (`llms.txt` + JSON-LD + FAQ + WebMCP), dynamic OG-Images, vollständige Barrierefreiheit
- **Project Context:** Greenfield (keine `docs/`, keine `package.json`, kein bestehender Code)
- **Owner-Modell:** Persönlich (nicht-kommerziell), Solo-Maintainer, Hebel = persönliche Sichtbarkeit + Compliance-Showcase. Bewusste Nicht-Mitigation für Bus-Faktor und Erfolgs-Metriken.

## Success Criteria

### User Success

Erfolg wird qualitativ aus Nutzer-Sicht definiert — kein Tracking, keine Visit-Zahlen:

- **Time-to-First-Insight unter 5 Sekunden.** Adresse eingeben → Inspektor-Panel mit Boundaries + Wohn-Daten + Umwelt-Layer + Klima-Sparkline sichtbar in unter 5s auf Standard-Verbindung. Aha-Moment messbar daran, dass der Nutzer 2–3 weitere Klicks/Toggles macht statt die Seite zu verlassen.
- **Cross-Layer-Aha:** Nutzer erkennt im Inspektor-Panel mindestens eine Information, die er aus den fragmentierten Themen-Apps nicht in einem Schritt bekommen hätte (z.B. Mietspiegel-Wohnlage + Lärm nachts + Trinkbrunnen-Saison + Stolperstein-Nähe gleichzeitig).
- **Tastatur-/Screenreader-Durchquerung vollständig.** Ein Nutzer mit Tastatur-only oder NVDA/VoiceOver kommt von Adress-Suche bis Layer-Detail ohne tote Endpunkte, ohne unsichtbaren Focus, ohne Karten-Black-Box.
- **Social-Sharing-Visualität.** Geteilter Link auf LinkedIn/Mastodon/BlueSky zeigt sofort dynamisches OG-Bild mit Karten-Snapshot und Top-3-Statistik — kein generisches Default-Preview.
- **LLM-Auffindbarkeit.** Anfragen wie „Mietspiegel-Wohnlage Boxhagener Kiez" in ChatGPT/Perplexity/Claude landen bei `navigator.berlin` als zitierte Quelle (informelle Verifikation, kein automatisiertes Monitoring).

### Business Success

Nicht-kommerzielles Projekt — kein Revenue, kein User-Growth-Ziel, kein Engagement-Funnel. Drei qualitative Hebel ersetzen klassische Business-Metriken:

- **Persönliche Sichtbarkeit.** Erwähnungen in der Berliner Civic-Tech-Community (ODIS, CityLAB, Tagesspiegel-Lab, Code-for-Berlin) als anekdotisches Signal. Konkretes 12-Monats-Ziel: mindestens 1 Konferenz-/Meetup-Talk-Einladung *oder* 1 redaktionelle Erwähnung *oder* 1 institutionelle Anfrage zu Kooperation/Wiederverwendung.
- **Compliance-Showcase für mtc.berlin GEO/AEO/DSGVO-Beratungslinie.** 12-Monats-Ziel: mindestens 1 Pitch-Deck und 1 Konferenz-Folie referenzieren `navigator.berlin` als praktischen Showcase. Architektur-Walk-Through (`llms.txt` + WebMCP + EU-FOSS-Hosting) als Talk-Material verfügbar.
- **Persönliche Bauspaß-Bilanz.** Selbst wenn das Projekt nach Phase 1 als gepflegtes Read-only-Artefakt liegen bleibt: Tech-Erfahrung mit SvelteKit Hybrid-Rendering, MapLibre Plex-Cartography, LayerChart v2, Drizzle-Schema-Setup, Hetzner-Coolify-CrowdSec, WebMCP ist persönlich akkumuliert und Lebenslauf-relevant.

### Technical Success

Harte, verifizierbare Schwellen — Phase-1-Pflicht:

- **WCAG 2.2 Level AA komplett.** axe-core CI ohne Violations, manuelle Tastatur-Durchquerung dokumentiert, Screenreader-Smoke-Test (NVDA + VoiceOver) bestanden. AAA-Kontraste für Body Text und Headings (≥ 7:1).
- **Lighthouse Accessibility ≥ 95.** Verifiziert in CI gegen alle prerenderten Top-Routes.
- **BFSG-Konformität** (Barrierefreiheits-Stärkungs-Gesetz, gilt seit 2025) erreicht und im Footer attestierbar.
- **DSGVO-Compliance durch Architektur.** Null `Set-Cookie`-Header verlassen den Server (verifiziert via Response-Header-Inspect). Keine Cookie-Banner-Pflicht, kein Tracking-Pixel, keine US-Drittanbieter-Domains im Network-Tab.
- **Core Web Vitals.** LCP < 2.5s Desktop und Mobile, INP < 200ms, CLS < 0.1 auf Mid-Tier-Devices in Berlin. MapLibre lazy nach Hydration, damit Initial-Paint nicht blockiert.
- **Bundle-Disziplin.** Initial JS gzipped ≤ 200 KB für Landing und Kiez-Routen.
- **Reproduzierbarer Build.** `pnpm install && pnpm fetch && pnpm build` liefert identisches Ergebnis (Datenstand-Manifest mit SHA pro Layer).
- **0 externe US-Dienste** in der Production-Toolchain. Selbst gehostete Plex-Fonts, eigener MapLibre-Style + Glyph-Pack, Hetzner-Hosting, kein Cloudflare.
- **Lizenz-Hygiene.** Pro Layer im Inspektor-Panel sichtbare Quellen-/Lizenz-Attribution. Zentrale Lizenz-Matrix unter `/lizenzen` automatisch aus `static/layers/MANIFEST.json` generiert.

### Measurable Outcomes

- **~200 prerenderte deutsche Basisrouten × 8 Sprachen = ~1.600 prerenderte SEO-Routen** für Bezirke (12) + LOR-Bezirksregionen (138) + Layer-Konzept-Erklärseiten (~25) + Phase-2-Wahl-Seiten (Vision) — alle mit eigenem Title, Meta-Description, JSON-LD, `hreflang`-Cluster und dynamischem OG-Bild.
- **~1.000 strukturierte FAQ-Q&As pro Sprache × 8 = ~8.000 FAQ-Q&As insgesamt** via JSON-LD `FAQPage`-Schema (≈ 150 Pages × 7 Fragen × 8 Sprachen), datengefüllt ohne redaktionellen Aufwand, Übersetzung lokal via Claude Code.
- **100% der eingegebenen Berliner Adressen** bekommen mindestens Boundary-Hits (Bezirk + LOR + PLZ). Daten-Coverage-Lücken werden explizit als „Daten nicht vorhanden" im Inspektor-Panel kommuniziert, nicht stillschweigend ausgelassen.
- **5+ funktionale WebMCP-Tools** registriert (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`), verifiziert über offizielle MCP-Spec-Tests im Browser-Inspector.

## Product Scope

Diese Sektion gibt die Phase-Boundary auf einen Blick. Detail-Strategie, Risk-Mitigation und Scope-Confirmation-Gate folgen in [Project Scoping & Phased Development](#project-scoping--phased-development).

### MVP — Minimum Viable Product (Phase 1)

Was muss live sein, damit das Projekt als „Beitrag" funktioniert:

- **Layer-Bundles A + B + C** — Boundaries (Bezirk, Ortsteil, LOR 3 Ebenen, PLZ), Wohn-Daten (Mietspiegel-Wohnlage, Bodenrichtwert, Gebäudealter), Umwelt + Memorial (Lärmkarte Tag/Nacht, Solarpotenzial, Klimaanalyse, Stolpersteine, Trinkbrunnen mit Saisonalitäts-Hinweis Mai–Oktober)
- **Klima-Zeitreihe** der nächstgelegenen DWD-Station (Dahlem 1719–heute Long-View, Hitze-/Frost-/Sommertage-Sparkline 1950–heute)
- **Adress-Suche** mit Geocoding (Nominatim oder selbst gehostet)
- **MapLibre-Karte** im Plex-Cartography-Style mit eigenem Style-JSON und selbst gebautem Glyph-Pack
- **Inspektor-Panel** für Adress-Klick mit allen Layer-Hits und Per-Layer-Datenstand-Banner („Stand: YYYY-MM, Quelle: X")
- **Prerenderte SEO-Seiten** (Bezirke, LOR-Bezirksregionen, Layer-Konzept-Erklärseiten) × 8 Sprachen ≈ 1.600 Routen, alle mit dynamischen OG-Images
- **Internationalization in 8 Sprachen** (DE, EN, TR, UK, AR, ES, FR, IT) ab Phase 1 — Sprach-Switcher im Always-Reachable-Footer, RTL-Layout für Arabisch, hreflang-Cluster, lokale Build-Zeit-Übersetzung via Claude Code
- **GEO/AEO-Stack** — `llms.txt` + `llms-full.txt` + JSON-LD `Place`/`AdministrativeArea`/`Dataset`/`FAQPage`-Markup + dynamische FAQ-Sektionen pro Kiez und Bezirk
- **WebMCP-Integration** mit mindestens 5 Tools + Resources + Prompt-Templates
- **WCAG 2.2 AA komplett + AAA wo möglich, BFSG-konform**, responsive Layout
- **EU-FOSS-Hosting-Stack** — Hetzner-Frankfurt + Coolify + Traefik + CrowdSec, cookieless
- **Editorial-Verantwortung-Behandlung** für sensible Layer (Stolpersteine mit Quellenverlinkung, Mauer/Sektoren mit Stand-Hinweis, Fehler-Melde-Mailto pro Layer)

### Growth Features (Phase 2)

Was das Projekt von „Beitrag" zu „spürbarer Civic-Tech-Position" hebt:

- **Live-Daten-Bundle** — BVG-Stops mit Echtzeit-Abfahrten (`v6.bvg.transport.rest`), BLUME-Luftqualität (`luftdaten.berlin.de`), Wetter (Bright Sky / Open-Meteo). Implementierung primär via SvelteKit `query.live` (sobald aus experimental), fallback klassisch via `load`-Funktionen mit 60-Sekunden-Polling
- **Wahlebene** mit historischer Tiefe (BVV / AGH / BTW / Volksentscheide), Sparkline pro Adresse — bewusst gebündelt mit anderen Layern, nicht als Konkurrenz zur Tagesspiegel-Wahlkarte
- **Cross-Data-Erzählungen** als deterministische Template-Texte pro Adresse (keine LLM-Generierung user-facing)
- **Zeit-Slider** für Layer mit historischer Tiefe (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete-Welle)
- **Embeddable Widgets / oEmbed-Endpoints** für Datenjournalismus (Tagesspiegel/RBB/Berliner Zeitung)
- **RADOLAN-Regenradar** via Python-Sidecar (FastAPI + `wradlib`)
- **Drizzle/Postgres-Backfill** für tabellarische Wahldaten und ergänzende Klima-Stationen — Geometrien bleiben statisch

### Vision (Phase 3)

Was das Projekt zur durable Berliner Daten-Infrastruktur macht:

- **PostGIS** mit räumlichen Cross-Layer-Aggregations-Queries
- **Memorial-Map** als kuratierte „was nicht mehr da ist"-Schicht
- **Daten-Quality-Layer** mit Aktualisierungs- und Lückenanzeige für Datenjournalisten
- **Redaktioneller Content-Layer** für Schreibt-Sich-Mit-Liebe-Datasets (aktive Berliner Clubs, lokale Geschichte pro Adresse)

## User Journeys

`navigator.berlin` hat bewusst keine spitze Primary Persona — das Tool wird für alle Berlin-Interessierten optimiert. Die folgenden Journeys decken die häufigsten Nutzungs-Anlässe und besonders kritische Erreichbarkeits-Pfade ab. Jede Journey schließt mit den daraus folgenden Capability-Anforderungen.

### Journey 1 — Anna, neugieriger Berliner (Primary Happy Path)

**Opening Scene:** Anna, 38, wohnt seit 6 Jahren in der Wühlischstr. in Friedrichshain. Sonntagnachmittag, sie sieht in einer Tagesspiegel-Story einen Hinweis auf `navigator.berlin` und denkt: „Schauen wir mal, was die eigentlich über meine Ecke sagen." Smartphone in der Hand, kein konkretes Ziel — Stöbern.

**Rising Action:** Sie öffnet `navigator.berlin`, sieht eine ruhige Landing-Seite in Plex Serif: „Wo wohnst du?". Tippt „Wühlischstr 17" — die Adress-Suche schlägt nach 2 Buchstaben passende Treffer vor. Tap auf den ersten Vorschlag. Karte und Inspektor-Panel öffnen sich seitlich, Karte zoomt sanft auf die Adresse. Auf dem Panel sieht sie sofort: Bezirk Friedrichshain-Kreuzberg, Boxhagener Kiez (LOR Bezirksregion), PLZ 10245. Scrollt im Panel — Mietspiegel-Wohnlage „gut", Bodenrichtwert „3.800 €/m² (Stand 2024)", Gebäudealter „1900–1918". Stutzt: gleich darunter Lärm-Tag/Nacht („sehr hoch / hoch") und Trinkbrunnen 240m entfernt, „aktiv Mai–Oktober". Ein Klick auf „Klima an deiner Station (Dahlem)": Sparkline der Sommertage seit 1950 — Anfang 8 pro Jahr, heute 18. Sie macht einen Screenshot, schickt ihn an ihren Mann.

**Climax:** Sie sieht auf dem Panel weiter unten „4 Stolpersteine im 200m-Radius" mit Vorschauen — klickt auf den ersten, eine kurze Personen-Beschreibung mit Verlinkung zur Berliner Koordinierungsstelle und Wikipedia. Sie wusste nicht, dass direkt vor ihrer Haustür einer liegt.

**Resolution:** Anna teilt den Link auf WhatsApp in ihre Familien-Gruppe. Der Link generiert sofort ein dynamisches OG-Bild mit Karten-Snapshot ihrer Adresse plus „Wühlischstraße 17 — Boxhagener Kiez · Wohnlage gut · 4 Stolpersteine in Sichtweite". Tochter antwortet: „krass, das mit den Sommertagen wusste ich nicht."

**Capability-Anforderungen aus Journey 1:**

- Adress-Suche mit Suggest-as-you-type (Geocoding)
- Karte mit sanftem Auto-Zoom auf ausgewählte Adresse
- Inspektor-Panel mit allen Phase-1-Layer-Hits, sortiert nach Relevanz/Hierarchie
- Klima-Sparkline pro nächstgelegener DWD-Station
- Stolperstein-Detail mit Quellen-Link
- Datenstand-Banner pro Layer
- Dynamisch gerenderte OG-Bilder pro Adresse für Social-Sharing
- Mobile-responsive Layout (Smartphone-Sonntag-Sofa-Use-Case)

### Journey 2 — Tobias, Wohnungssuchender (Edge Case, Vergleich)

**Opening Scene:** Tobias, 33, zieht von München zurück nach Berlin. Job in Mitte, sucht 2-Zimmer-Wohnung. Drei Exposés liegen vor: Reuterkiez, Reinickendorf-Ost, Steglitz-Mitte. Er sitzt am Laptop, will fundiert entscheiden, hat aber keine Zeit für Stadtteil-Touren.

**Rising Action:** Er tippt nacheinander die drei Kandidaten-Adressen in `navigator.berlin`. Pro Adresse bekommt er das Panel. Er fängt an, mental zu vergleichen: Reuterkiez hat Mietspiegel „mittel" und Lärm-Nacht „mittel"; Reinickendorf-Ost „einfach + lärm-bedingt", Steglitz-Mitte „gut + ruhig". Er notiert. Klickt auf die FAQ-Sektion unter Reinickendorf-Ost: „Wie laut ist es in Reinickendorf-Ost nachts?" — Antwort: konkrete Lärm-Werte plus Vergleich zum Berliner Durchschnitt. „Welche Wohnlage hat Reinickendorf-Ost?" — Erläuterung der Mietspiegel-Logik. Genau die Fragen, die er sich gestellt hat.

**Climax:** Er fragt seine ChatGPT-Browser-Extension: „Vergleich Verkehrsanbindung und Lärm zwischen Reuterkiez und Steglitz-Mitte." Die Extension nutzt WebMCP, ruft `cross_layer_query` auf beiden Adressen ab, antwortet mit strukturierten Daten — Quelle: `navigator.berlin`. Tobias merkt: die ChatGPT-Antwort hat genau die Datenpunkte aus dem Panel, weil sie aus derselben Quelle stammt.

**Resolution:** Reuterkiez. Tobias mietet, zieht ein, leitet `navigator.berlin` an seinen Vermieter weiter mit „Hier sieht man warum ich euer Lärm-Argument akzeptiert habe".

**Capability-Anforderungen aus Journey 2:**

- Konsistente Inspektor-Panel-Struktur (Vergleich braucht gleiche Layouts)
- FAQ-Pages pro Kiez/Bezirk mit datengefüllten Antworten und JSON-LD-`FAQPage`-Schema
- WebMCP-Integration mit `cross_layer_query`-Tool, das mehrere Adressen vergleicht
- Stabile URLs pro Kiez/Bezirk für Linkfähigkeit
- Numerische Werte mit Berlin-Median als Kontext

### Journey 3 — Frieda, Datenjournalistin (Desktop, Cross-Layer-Recherche)

**Opening Scene:** Frieda, Datenjournalistin beim Tagesspiegel-Lab, recherchiert zu Solar-Ausbau-Verteilung in Berlin. Frage: Korreliert Solarpotenzial-Nutzung mit Mietspiegel-Wohnlage und Gebäudealter? Sie hat normalerweise QGIS und Python für sowas, aber will schnell einen visuellen Einstieg.

**Rising Action:** Sie öffnet `navigator.berlin/bezirk/friedrichshain-kreuzberg`. Sieht eine ruhige Bezirks-Seite mit Plex Serif Headline, kurzem Lead, Karten-Embed mit Layer-Toggle, dahinter Daten-Steckbrief und FAQ-Sektion. Aktiviert via `/`-Tastatur-Shortcut die Layer-Palette, tippt „Solar", aktiviert Solarpotenzial. Zusätzlich Mietspiegel-Wohnlage. Beide Layer als sequentielle Indigo-Choropleth übereinander, transparent — Cross-Layer-Sicht. Sie sieht ein Muster: alte Wilhelminische Blöcke mit „gut/sehr gut" Wohnlage haben oft die niedrigsten Solar-Werte (Denkmalschutz-Kontext).

**Climax:** Sie scrollt zum Footer, findet einen Link „Daten teilen / embed". Klickt — bekommt ein `<iframe>`-Snippet für genau diese Karten-Sicht (Phase 2). Daneben sieht sie die Lizenz-Hinweise und Datenstand pro Layer. Sie kopiert das Snippet in ihren Artikel-Entwurf.

**Resolution:** Story geht eine Woche später beim Tagesspiegel-Lab online — mit `navigator.berlin`-Embed als interaktiver Bestandteil. Im Begleit-Text Erwähnung „Karten-Visualisierung via navigator.berlin". Frieda mailt: „könntet ihr Cross-Layer für Lärm × Bodenrichtwert auch noch ergänzen?"

**Capability-Anforderungen aus Journey 3:**

- Bezirks-/Kiez-Seiten als eigenständige SEO-/AEO-Routen
- Layer-Toggle-Palette via `/`-Shortcut (Linear-/Raycast-Stil)
- Mehrere Layer transparent übereinander mit sequentieller Skala
- Lizenz- und Datenstand-Anzeige pro Layer (auch für Embed-Use-Case)
- Embeddable Widgets / oEmbed (Phase 2) als geplantes Wachstum
- Kontakt-Mailto zur Direkt-Anfrage-Mechanik

### Journey 4 — Marek, blinder Stadtforscher (Accessibility / BFSG-Compliance)

**Opening Scene:** Marek arbeitet bei einer Berliner Forschungseinrichtung an einer Studie über soziale Erhaltungsgebiete. Er nutzt NVDA mit Edge. Adresse, die er prüfen will: Hermannstr. 49.

**Rising Action:** Marek lädt `navigator.berlin`. Erster Tab landet auf einem sichtbaren Skip-Link „Zum Hauptinhalt". Zweiter Tab auf der Adress-Suche, mit klar gelabeltem `<input>` „Adresse, Kiez oder Bezirk". Er tippt, hört per NVDA die Suggest-Liste, Enter selektiert. Die Karte fokussiert sich, NVDA liest die ARIA-Live-Region: „Adresse ausgewählt: Hermannstraße 49, 12049 Berlin, Bezirk Neukölln, LOR-Region Schillerpromenade." Marek tabt durch das Inspektor-Panel, hört pro Layer den Wert plus den Datenstand. Bei Bedarf öffnet er per Enter eine Daten-Tabelle als Alternative zur Karte — gleichwertig, sortierbar.

**Climax:** Marek will den Lärm-Layer auf der Karte sehen. Er weiß, dass MapLibre normalerweise visuell ist — aber `navigator.berlin` hat eine parallele DOM-Liste der POIs und Boundaries, die er per Tab durchwandern kann. Pro Polygon/Punkt ein semantischer Knopf mit voller Beschreibung. Er findet zwei Lärm-Klassifikations-Polygone, die sich überlagern, hört „Lärmkarte Schiene 60–65 dB, Stand 2022" und „Lärmkarte Straße 65–70 dB, Stand 2022". Genauere Werte als er gehofft hatte.

**Resolution:** Marek nimmt die Werte in seine Studie auf. Im Methodik-Kapitel schreibt er: „Die Daten wurden über navigator.berlin abgerufen, ein vollständig WCAG-2.2-AA-konformes Civic-Tech-Tool — bemerkenswert, weil Karten-Anwendungen in der Regel nicht barrierefrei nutzbar sind." Er mailt das Lob direkt an die Footer-Kontaktadresse.

**Capability-Anforderungen aus Journey 4:**

- Skip-Link als erstes fokussierbares Element
- Adress-Suche tastatur-bedienbar mit ARIA-Live-Updates
- ARIA-Live-Region für Inspektor-Panel-Änderungen
- Karte mit `role="application"` und `aria-describedby`-Anleitung
- Parallele DOM-Liste der Karten-Inhalte (POIs, Boundaries) für Screenreader
- Daten-Tabelle als gleichwertige Alternative zu jeder Visualisierung (Karte und Charts)
- Tastatur-Navigation durch Layer-Toggle, POIs, Boundaries
- Sichtbare und nicht-verdeckte Focus-Ringe (WCAG 2.2 SC 2.4.11/2.4.12)
- Plex-Mono auf allen Datenwerten für Screenreader-konsistente Aussprache („3 Komma 8 Tausend Euro pro Quadratmeter")

### Journey 5 — Claude-Browser-Extension (LLM-Agent via WebMCP)

**Opening Scene:** Ein Nutzer fragt seine Claude-Browser-Extension: „Vergleich die Klima-Entwicklung in Friedrichshain und Steglitz seit 1950." Die Extension navigiert auf `navigator.berlin`, erkennt via WebMCP die verfügbaren Tools.

**Rising Action:** Die Extension registriert sich als WebMCP-Client. Discovery ruft `list_tools()` auf, bekommt: `address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`. Sie wählt `get_kiez_profile` für beide Kieze, ruft parallel auf. Bekommt JSON-strukturierte Antworten mit Boundary-Daten, Wohn-Daten und Klima-Zeitreihen der jeweils nächstgelegenen DWD-Station (Dahlem für Steglitz, Tempelhof für Friedrichshain). Plus die JSON-LD-Strukturierung aus den prerenderten Pages als Resource-URI verfügbar.

**Climax:** Claude erhält ausreichend strukturierte Daten — 75 Jahre Hitze-Tage-Werte für beide Stationen — und formuliert eine Antwort mit Zahlen, Quellen-Attribution und Link zurück auf `navigator.berlin`. Der Nutzer klickt den Link, landet auf einer Bezirks-Page mit der gleichen Daten-Sicht visuell aufbereitet.

**Resolution:** Der Nutzer hat in 15 Sekunden eine sourced-zitierfähige Antwort. `navigator.berlin` wird in der Antwort als kanonische Quelle für Berlin-Geo-Fragen genannt — ohne dass die Site einen API-Endpoint anbieten musste. Pure WebMCP, im Browser, ohne Auth.

**Capability-Anforderungen aus Journey 5:**

- WebMCP-Setup mit `registerTool()` für 5+ Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`)
- WebMCP-Resources für aktive Adresse und geladene Layer als URI-adressierbare Daten
- WebMCP-Prompt-Templates („Was ist an dieser Adresse besonders?", „Vergleiche diese zwei Kieze")
- JSON-LD `Place` / `AdministrativeArea` / `Dataset` / `FAQPage` auf jeder prerenderten Page
- `llms.txt` + `llms-full.txt` für strukturierte Crawler-/Agent-Einstiegsseite
- Stabile, sprechende URL-Struktur (`/kiez/{slug}`, `/bezirk/{slug}`, `/layer/{slug}`)
- Quellen-Attribution pro Datenwert, sodass Citation-Mechanik der Agenten funktioniert

### Journey Requirements Summary

Die fünf Journeys offenbaren folgende Capability-Cluster, die Phase 1 erfüllen muss:

| Capability-Cluster | Quelle | Pflicht-/Optionales-Element |
|--------------------|--------|----------------------------|
| **Adress-Suche & Geocoding** | J1, J2, J4 | Pflicht: tastaturbedienbar, suggest-as-you-type, ARIA-Live |
| **MapLibre-Karte mit Plex-Cartography** | J1, J3, J4 | Pflicht: Auto-Zoom, lazy-load post-hydration, eigener Glyph-Pack |
| **Inspektor-Panel** | J1, J2, J4 | Pflicht: alle Phase-1-Layer-Hits, Datenstand pro Layer, ARIA-Live |
| **Layer-Toggle-Palette** | J3, J4 | Pflicht: `/`-Shortcut, tastaturbedienbar, mobil als Bottom-Sheet |
| **Cross-Layer-Darstellung** | J3, J5 | Pflicht: transparent übereinander, sequentielle/divergierende Skalen, Legende mit numerischen Werten |
| **Klima-Sparkline + Long-View** | J1, J3, J5 | Pflicht: pro Adresse nächstgelegene DWD-Station, statisches JSON |
| **Bezirks-/Kiez-Seiten (prerendered)** | J3, J5 | Pflicht: ~200 dt. Basisrouten × 8 Sprachen = ~1.600 SEO-Routen mit Lead, Steckbrief, FAQ, OG-Image, hreflang |
| **Internationalization (8 Sprachen)** | alle Journeys | Pflicht: DE/EN/TR/UK/AR/ES/FR/IT mit Sprach-Switcher, lokale Build-Zeit-Übersetzung, RTL für AR |
| **Always-Reachable Meta-Footer** | alle Journeys | Pflicht: Impressum, Datenschutz, Lizenzen, Kontakt, Architektur, Sprach-Switcher pro Sprache |
| **FAQ-Pages (datengefüllt)** | J2, J3 | Pflicht: ~1.000 Q&As, JSON-LD `FAQPage` |
| **Dynamic OG-Images** | J1, J5 | Pflicht: SSR-PNG pro Bezirk/Kiez/Layer-URL mit Karten-Snapshot |
| **WebMCP-Integration** | J5 | Pflicht: 5+ Tools, Resources, Prompts |
| **`llms.txt` + JSON-LD** | J5 | Pflicht: Place, AdministrativeArea, Dataset, FAQPage |
| **Accessibility-Layer für Karte/Charts** | J4 | Pflicht: parallele DOM-Listen, Daten-Tabellen-Alternative, ARIA |
| **Footer mit Lizenz/Quellen-Matrix** | J3, J4 | Pflicht: pro Layer Stand + Lizenz |
| **Mailto-Kontakt für Feedback** | J3, J4 | Pflicht: Editorial-Fehler-Meldepfad pro Layer |
| **Embeddable Widgets / oEmbed** | J3 | Phase 2 — nicht MVP, aber geplante Wachstums-Capability |
| **Cross-Adress-Vergleich via Tool** | J2, J5 | Phase 2 — WebMCP-Tool `cross_layer_query` für mehrere Adressen |

**Was bewusst KEINE Journey hat:**

- Admin/Operations — keine Backend-Verwaltung, keine User-Accounts, keine CMS-Pflege
- Moderation — kein User-Generated Content
- Support-Mitarbeiter — Solo-Maintenance, kein Helpdesk
- API-Consumer im klassischen Sinne — keine öffentliche REST/GraphQL-API; LLM-Agenten-Integration läuft über WebMCP (browser-side, Journey 5) statt über Server-API

## Domain-Specific Requirements

`navigator.berlin` operiert im EU-Civic-Tech / Open-Government-Data-Raum. Klassische US-Govtech-Concerns (FedRAMP, Section 508, Procurement-Rules, Security-Clearance) sind nicht zutreffend — ersetzt durch EU-Pendants und Berliner Spezifika.

### Compliance & Regulatorik

- **DSGVO (GDPR) — strict, durch Architektur.** Kein Tracking, kein Plausible/Matomo, keine externen Pixel, kein `Set-Cookie`-Header verlässt den Server. Keine personenbezogenen Daten werden erfasst, gespeichert oder verarbeitet (Adresseingabe bleibt clientseitig, Geocoding via Nominatim oder Selbst-Host wird IP-anonymisiert geproxied). Verifiziert via Response-Header-Inspect in CI.
- **BFSG (Barrierefreiheits-Stärkungsgesetz) — gilt seit Juni 2025.** Konformitätsanspruch im Footer attestierbar. Verbindlich für die App-Komponenten. WCAG 2.2 Level AA komplett als Implementierungs-Standard, AAA wo möglich (insbesondere Kontraste).
- **WCAG 2.2 AA komplett** — alle 50 Erfolgskriterien. Neue 2.2-Kriterien (SC 2.4.11/2.4.12 Focus Not Obscured, SC 2.5.7 Dragging Movements, SC 2.5.8 Target Size, SC 3.2.6 Consistent Help, SC 3.3.7 Redundant Entry, SC 3.3.8 Accessible Authentication) gesondert validiert.
- **Berliner Open-Data-Verordnung** — Lizenz-Hierarchie wird eingehalten:
  - `dl-de/zero-2-0` (CC0-äquivalent) — keine Attribution-Pflicht, im Footer trotzdem als Höflichkeit
  - `dl-de/by-2-0` — Quellenangabe „Geoportal Berlin / [Titel]" verpflichtend pro Layer
  - CC BY 3.0 DE / CC BY 4.0 — Attribution mit Lizenz-Link
  - ODbL 1.0 (OSM) — „© OpenStreetMap-Mitwirkende" + Link
  - CC-BY-SA 3.0/4.0 (Wikipedia) — wenn übernommen, mit Quellen-Link
- **EU-Hosting-Pflicht (selbst auferlegt).** Hetzner-Frankfurt als alleiniger Provider, kein US-Drittanbieter im Production-Pfad. Cloudflare bewusst ausgeschlossen wegen US-Firmensitz + CLOUD Act.

### Technische Constraints

- **Sicherheit (Layer 3/4):** Hetzner-eingebauter Layer-3/4-DDoS-Schutz, ausreichend für realistische Civic-Tech-Angriffsvektoren.
- **Sicherheit (Layer 7):** CrowdSec (FOSS, Sitz Paris, GDPR-nativ) als Traefik-Plugin in Streaming-Mode mit 60-Sekunden-Decision-Sync. Collections: `crowdsecurity/traefik`, `crowdsecurity/http-cve`, `crowdsecurity/whitelist-good-actors`, `crowdsecurity/base-http-scenarios`, `crowdsecurity/sshd`, `crowdsecurity/linux`. AppSec/WAF-Funktion verfügbar seit Plugin 1.2.0, einschaltbar bei Bedarf.
- **TLS:** Let's Encrypt via Traefik mit Auto-Renewal. TLS 1.3 erzwungen, ältere Protokolle deaktiviert.
- **Performance:** Caching ausschließlich via HTTP-Header und SvelteKit-statische Asset-Auslieferung. Static-GeoJSON-Layer mit `cache-control: public, max-age=2592000, immutable` (30 Tage), Cache-Invalidation per Filename-Hashing. HTML-Pages `cache-control: public, max-age=3600, must-revalidate`. In-Process `lru-cache` für berechnete Outputs falls nötig — kein Redis/Dragonfly.
- **Verfügbarkeit:** Single-Instance auf Hetzner-CX mit Coolify-Auto-Restart. Realistisches Verfügbarkeits-Ziel: 99% (≈ 87 Stunden Downtime/Jahr) — nicht-kommerziell, kein SLA. Kein externes Monitoring-Dashboard nötig (anti-Tracking-Linie).
- **Reproduzierbarkeit:** `pnpm install && pnpm fetch && pnpm build` liefert identisches Ergebnis. Datenstand-Manifest unter `static/layers/MANIFEST.json` mit Quelle, Stand, Lizenz und SHA-256 pro Layer-File.
- **CSP/Security-Header:** Strict Content-Security-Policy ohne `unsafe-inline`, ohne externe Script-Quellen. `X-Frame-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` defensiv konfiguriert.

### Integrations- und Datenquellen-Requirements

- **FIS-Broker WFS** (`fbinter.stadt-berlin.de/fb/wfs/...`) — Build-Zeit-Abruf via `derhuerst/query-fis-broker-wfs` oder eigenes Script. Reprojektion EPSG:25833 → EPSG:4326. Quell-Datensätze: Mietspiegel-Wohnlagen, Lärmkarten L_DEN/L_NIGHT, Solarpotenzial, Klimaanalyse, Bodenrichtwerte, Gebäudealter.
- **ODIS / `daten.odis-berlin.de`** — direkter GeoJSON-Download für Bezirke, Ortsteile, PLZ, LOR-3-Ebenen.
- **DWD Climate Data Center** (`opendata.dwd.de/climate_environment/CDC/`) — Build-Zeit-Abruf der Klima-Kennzahlen für Stationen 00403 (Dahlem 1719+), 00400 (Buch 1889+), 00433 (Tempelhof 1919+), 00427 (Brandenburg 1957+). Pfade: `observations_germany/climate/{annual,monthly}/kl/`, `climate_indices/kl/`.
- **OSM Overpass API** — täglicher Build-Zeit-Refresh für Stolpersteine (`memorial:type=stolperstein`) als Live-Geometrien-Ergänzung zu `daten.berlin.de/datensaetze/liste-der-stolpersteine-berlin`.
- **Nominatim** (selbst gehostet oder OSM-Public-Instance mit Rate-Limit-Respekt) — Geocoding der Adress-Eingabe. Bei Public-Instance: Anfragen serverseitig geproxied, IP-anonymisiert, lokale LRU-Cache der häufigsten Anfragen.
- **Phase-2-Quellen (nicht MVP):** `v6.bvg.transport.rest` (BVG/VBB), `luftdaten.berlin.de` (BLUME), `api.brightsky.dev` (DWD-Wetter), `daten.berlin.de` Wahlbezirks-Geometrien, `bundeswahlleiterin.de` Wahlergebnis-CSVs.
- **Per-Layer-Datenstand-Manifest:** jeder Layer trägt Source-URL, Abruf-Datum, Lizenz und SHA-256 im `MANIFEST.json`. Aktualisierungs-Kadenz definiert (z.B. „Mietspiegel-Wohnlagen quartalsweise prüfen, Stolpersteine wöchentlich").

### Editorial- und Erinnerungspolitische Verantwortung

`navigator.berlin` berührt sensibles Material — wird nicht wie ein generisches Geo-Tool behandelt:

- **Stolpersteine** — Quellenverlinkung zur Berliner Koordinierungsstelle (Dr. Silvija Kavcic) und Wikipedia ist verpflichtend pro Eintrag. Personen-Hintergründe werden zitiert (mit Quellen-URL), nicht algorithmisch oder LLM-generiert. „Fehler im Eintrag?"-Mailto pro Stolperstein.
- **Mauer- und Sektorengrenzen** — Datenquelle (OSM-Community, Code-for-Berlin) und historischer Stand-Hinweis verbindlich. Kein Wahlverhalten-Cross-Data-Layer wird automatisch gegen Mauer/Sektoren visualisiert (würde implizite Erzählungen erzeugen).
- **Cross-Data-Erzählungen (Phase 2)** — strikt deterministische Template-Texte aus Datenwerten, keine LLM-Generierung user-facing. Sensible Verknüpfungen wie „Wahlverhalten × Stolperstein-Dichte" oder „Wahlverhalten × Migrations-Hintergrund-Anteil" werden bewusst nicht algorithmisch gezogen.
- **Layer-spezifische Disclaimer-Texte:** Mietspiegel-Wohnlagen werden mit dem Hinweis ausgespielt, dass sie keine rechtliche Mietpreis-Aussage ersetzen. Bodenrichtwerte mit Aktualitäts-Hinweis und Verlinkung zum offiziellen Boden­richtwert-Atlas. Lärmkarten mit Stand-Jahr und Methodik-Hinweis (strategische Lärmkarte ≠ Live-Messung).
- **Datenfehler-Meldepfad:** sichtbarer „Fehler im Eintrag?"-Link pro Layer, technisch ein einfaches Mailto an die Footer-Adresse (kein Backend-Form, kein User-Account).

### Risiken und Mitigationen

| Risiko | Schweregrad | Mitigation |
|--------|-------------|------------|
| **Veraltete Mietspiegel-/Bodenrichtwert-Daten werden als aktuell gelesen** | Hoch (Schadens-relevant in Mietkontext) | Datenstand-Banner pro Layer Pflicht; quartalsweise Refresh-Check; Disclaimer „ersetzt keine rechtliche Aussage" |
| **Single-Point-of-Failure OpenFreeMap Tile-Provider** | Mittel-Hoch | Tile-Provider hinter Config-Variable; Protomaps-Fallback einmalig vorab getestet; Switch ist Config-Edit + Deploy |
| **Erinnerungspolitisch sensible Layer falsch verortet** | Mittel (Reputations-Risiko) | Quellenverlinkung pro Eintrag; Fehler-Mailto sichtbar; LLM-Generierung user-facing ausgeschlossen |
| **Doxing-Risiko bei politischer Visualisierung unter Eigennamen** | Niedrig-Mittel | Keine Cross-Data-Erzählung zwischen Wahlverhalten und ethnischen/Migrations-Daten in Phase 2; bewusste Sensibilität bei Story-Templates |
| **Solo-Maintainer-Decay (statistisch: 60% laut Tidelift 2024)** | Hoch (Brand-Risiko unter Eigennamen) | Akzeptiert (User-Entscheidung „nicht jetzt"); reproduzierbarer Build und FOSS-Repo ermöglichen Fork/Pflege durch andere |
| **Tile-Beschriftungs-Glyph-Pack-Build verzichtbar?** | Niedrig | Plex-Glyph-Pack via `fontnik` einmalig gebaut, ins Repo committet — kein laufendes Build-Risiko |
| **Datenquellen-Lizenz-Drift** (z.B. `dl-de/by` wird zu kommerzieller Lizenz) | Niedrig | Lizenz-Matrix versioniert im Repo; bei Lizenz-Änderung Layer-Entfernung dokumentiert |
| **WebMCP-Spec ändert sich Pre-1.0** | Mittel | WebMCP-Setup hinter eigener Adapter-Schicht; Spec-Version im Manifest dokumentiert |
| **EU-Datenschutzbehörden-Anfrage zu Geocoding-Proxy** | Niedrig | Selbst-gehosteter Nominatim, IP-anonymisierte Proxy-Schicht, keine Logs der eingehenden Adressen; auf Anfrage dokumentierbar |
| **CrowdSec-False-Positives blockieren Nutzer** | Niedrig | Captcha-Remediation als Default statt Hard-Ban; CrowdSec-Console-Logs prüfen monatlich |

## Innovation & Novel Patterns

### Detected Innovation Areas

`navigator.berlin` ist kein Forschungs-Projekt und kein technologischer Durchbruch — es ist eine bewusste Re-Kombination existierender Bausteine. Genau diese Kombinatorik enthält vier echte Innovations-Vektoren, die in dieser Form für Berliner Civic-Tech (und für die meisten europäischen Stadt-Atlanten) noch nicht implementiert sind:

**1. WebMCP-Integration als Civic-Tech-Premiere.**

Die meisten LLM-/AI-fähigen Sites bieten heute höchstens `llms.txt` plus etwas Structured Data — also LLM-*lesbar*. WebMCP (`webmcp.dev`) erlaubt es einer Site, sich selbst als **MCP-Server für browserseitige Agenten** zu exponieren — also LLM-*bedienbar*. Eine Claude-Browser-Extension, ChatGPT-Plugin oder eigene Agentin kann die Site öffnen und direkt `address_lookup`, `cross_layer_query` oder `get_kiez_profile` aufrufen, ohne dass ein separater Server existiert. Für Berliner Civic-Tech ist das nach aktuellem Recherchestand eine Premiere; gleichzeitig ist es der direkteste praktische Beweis für die GEO/AEO-Beratungs-These, die mtc.berlin verkauft.

**2. Cross-Layer-pro-Adresse als gemeinsamer Schlüssel statt thematischer Atomisierung.**

Berliner Civic-Tech ist atomistisch organisiert: jede Schicht hat ihre eigene App (Erfrischungskarte, Gieß den Kiez, Tagesspiegel-Wahlkarten, milieuschutz.org, KiezColors). Diese strategische Aufteilung wird von ODIS/CityLAB bewusst gepflegt, um FIS-Broker/Geoportal nicht zu duplizieren. `navigator.berlin` schließt diese Lücke explizit, indem es Wahlbezirk × Mietspiegel-Wohnlage × Solaranlagen-Dichte × Fahrraddiebstähle als *gleichzeitige* Sicht an *einer* Adresse zeigt. Nicht „die bessere Wahlkarte", sondern „die einzige Karte, auf der mehrere Themen-Layer im selben Inspektor-Panel zusammenfließen". Amsterdam Atlas hat dieses Pattern für NL, NYC Boundaries für US — Berlin hatte es bisher nicht.

**3. 1719–heute Klima-Zeitreihe als datengetriebene Erzähl-Schicht pro Adresse.**

Berlin-Dahlem (DWD-Station 00403) hat **die älteste durchgehende Klima-Zeitreihe Deutschlands** — 306 Jahre. Diese Zeitreihe ist öffentlich verfügbar, wird aber in keiner Civic-Tech-App pro Adresse visualisiert. Eine Sparkline „Sommertage 1950–heute an deiner nächsten Station" ist datenjournalistisch und persönlich resonant — der Berliner sieht den Klimawandel an seiner eigenen Adresse, nicht in einer abstrakten Statistik. Story-Hook für Konferenz-Talks („300 Jahre Berliner Wetter in einer SvelteKit-App").

**4. EU-FOSS-Hosting-Stack ohne Cloudflare als kompletter Civic-Tech-Architecture-Showcase.**

Die Kombination Hetzner-Frankfurt + Coolify + Traefik + CrowdSec + cookieless + kein US-Drittanbieter ist technisch keine Erfindung — alle Bausteine sind Standard. Innovativ ist die kompromisslose Komposition: eine produktive Civic-Tech-Site, die ohne *einen einzigen* US-Service auskommt, gleichzeitig WCAG 2.2 AA + BFSG erfüllt und WebMCP-fähig ist. In der DSGVO-/GEO-/AEO-Beratungs-Realität gibt es viele Behauptungen, aber wenige laufende Beispiele. `navigator.berlin` ist eines.

**Bonus-Pattern (kein Innovations-Anspruch, aber selten konsequent):** dynamisch aus Daten generierte FAQ-Pages pro Kiez/Bezirk mit JSON-LD `FAQPage`-Schema, dynamische OG-Images pro prerenderter URL mit Karten-Snapshot. Beides bekanntes Vorgehen, in Berliner Civic-Tech aber nicht etabliert.

### Market Context & Competitive Landscape

Bestehende Lösungen je Innovations-Vektor:

| Vektor | Bestehende Lösungen | navigator.berlin-Position |
|--------|---------------------|---------------------------|
| **WebMCP für Civic-Tech** | Keine bekannten produktiven Implementierungen für Berliner/deutsche Civic-Tech | Premiere, kein Wettbewerb |
| **Cross-Layer-Atlas pro Adresse** | `boundaries.beta.nyc` (lebt, 47k Users 2025); Amsterdam Atlas (FOSS, aber UX schwach); `kiezatlas.berlin` (legacy DeepaMehta, thematisch eng Jugendhilfe); CityLAB-Apps (atomistisch) | Erste integrierte Berlin-Variante mit Berlin-Daten-Spezifika |
| **Klima-Long-View 1719+ pro Adresse** | DWD CDC ist Rohquelle; keine Civic-Tech-App nutzt es pro Adresse | Premiere für narrative Klima-Visualisierung |
| **EU-FOSS-Hosting komplett ohne US** | Einzelbausteine etabliert (Hetzner, Coolify, CrowdSec); produktive Komposition als Civic-Tech-Showcase selten | Konferenz-/Beratungs-Material verfügbar |
| **Dynamic OG + JSON-LD FAQPage + llms.txt im Civic-Tech-Stack** | Standard in Marketing-/SaaS-Sites; in Berliner Civic-Tech nicht etabliert | Pragmatische Übernahme, nicht Erfindung |

### Validation Approach

Bewusste Nicht-Validierung über quantitative Metriken — das Projekt installiert kein Tracking. Validierung ist mehrschichtig qualitativ:

- **WebMCP-Validität:** offizielle MCP-Spec-Tests im Browser-Inspector; mindestens 5 Tools fertig registriert; manuelle Verifikation mit Claude Desktop Browser-Extension und ChatGPT-Plugin.
- **Cross-Layer-Aha:** anekdotische Resonanz aus Berliner Civic-Tech-Community (ODIS, CityLAB, Tagesspiegel-Lab); konkretes 12-Monats-Ziel: mindestens eine institutionelle/redaktionelle Erwähnung *oder* Konferenz-Talk-Einladung *oder* Kooperations-Anfrage.
- **Klima-Pro-Adresse:** Walk-Through mit Datenjournalisten (informell, persönliches Netzwerk); Vergleichs-Check mit DWD CDC-Quelldaten als Spotcheck.
- **EU-FOSS-Stack:** öffentlich dokumentierte Architektur-Page (`/stack` oder `/architektur`) mit allen Komponenten; LinkedIn-/Mastodon-Post zur Komposition als Test-Ballon für Reaktionen.

### Risk Mitigation

Innovations-Risiken mit konkreten Fallbacks:

- **WebMCP-Spec ist Pre-1.0 und ändert sich.** WebMCP-Setup hinter eigener Adapter-Schicht in `$lib/webmcp/`. Spec-Version im Manifest dokumentiert. Bei Breaking-Change: Adapter aktualisieren, Tools/Resources/Prompts bleiben semantisch stabil. Wenn WebMCP sich nicht durchsetzt: `llms.txt` + JSON-LD bleiben als stabile GEO/AEO-Schicht bestehen.
- **LLM-Crawler ignorieren `llms.txt`/JSON-LD.** SEO-Long-Tail trägt durch klassische Suche (Google, Bing) auch ohne LLM-Aufnahme. Die ~1.600 prerenderten URLs (8 Sprachen × ~200 Basisrouten) + ~8.000 FAQ-Q&As sind in jedem Fall durchsuchbar.
- **Cross-Layer-USP wird kopiert (CityLAB baut nach).** Realistisch erst nach 6–12 Monaten — falls überhaupt. Differenzierung verflacht, aber das Tool steht weiter. Personal-Brand-Hebel #1 (Sichtbarkeit) ist zu diesem Zeitpunkt bereits realisiert.
- **Klima-Long-View wird datenjournalistisch nicht aufgegriffen.** Bleibt als Inspektor-Panel-Detail bestehen und liefert weiterhin Aha-Momente für individuelle Nutzer.
- **EU-FOSS-Architektur-Showcase wird nicht gelesen als Beratungs-Showcase.** Architektur-Page bleibt persönlicher Lebenslauf-/Bewerbungs-Asset und Konferenz-Talk-Material.

**Innovations-Gesamteinschätzung:** Diese Innovationen sind nicht „world-changing", aber sie sind echt — neue Kombinationen mit nachvollziehbarem Nutzen, in einem nicht-kommerziellen Setting verlustfrei umsetzbar. Sie tragen den Personal-Brand-Hebel und sind als Talk-/Pitch-Material verfügbar, ohne dass das Projekt selbst kommerziell sein muss.

## Web App — Specific Requirements

### Project-Type Overview

`navigator.berlin` ist eine **SvelteKit-Hybrid-Web-App** (`adapter-node`) — kombiniert Prerendering für SEO-relevante Routes mit Client-Hydration für die interaktiven Karten- und Inspektor-Panel-Komponenten. Keine SPA im strikten Sinn, keine klassische MPA, sondern Route-für-Route entscheidbar: Bezirks-, Kiez- und Layer-Konzept-Seiten sind prerendered und ohne JavaScript lesbar; Adress-Lookup, Karten-Interaktion und Layer-Toggles laufen nach Hydration im Browser. Phase 1 ist serverseitig vollständig static-first (keine Live-Endpunkte, keine `query.live`-Volatilität).

### Browser-Matrix

Unterstützte Browser:

| Browser | Mindest-Version | Begründung |
|---------|-----------------|------------|
| Chrome / Edge / Firefox / Safari (Desktop) | Letzte 2 Major-Versionen | Standard für Civic-Tech-Sites in 2026 |
| Safari iOS | 16+ | iPhone-Smartphone-Use-Case (Journey 1 Sonntag-Sofa) |
| Chrome / Samsung Internet (Android) | Letzte 2 Major-Versionen | Android-Mobile |
| **Nicht unterstützt** | IE11, alle Browser < 2023 | Civic-Tech-Akzeptanz, keine Polyfill-Hölle |

Progressive Enhancement: Prerenderte Seiten (Bezirke, Kieze, Layer-Konzepte, FAQ) sind ohne JavaScript lesbar. Karte und Inspektor-Panel zeigen ohne JS einen statischen Fallback („Karte erfordert JavaScript — Bezirks-Daten unten als Tabelle"). Adress-Suche funktioniert ohne JS als klassisches Form-Submit gegen prerenderten Bezirks-Index.

### Responsive Design

- **Layout-Breakpoints:** Mobile-first mit drei Bruchstellen — bis 640px (Smartphone), 641–1024px (Tablet), >1024px (Desktop). Keine separate Mobile-Site; eine Codebase, fluide Layouts.
- **Karten-Verhalten:** Desktop = Karte links 60% + Inspektor-Panel rechts 40%. Tablet = Karte oben 50vh + Panel unten scroll. Smartphone = Karte oben 40vh + Panel als Bottom-Sheet swipe-up.
- **Layer-Toggle-Palette:** Desktop = via `/`-Tastatur-Shortcut Centered-Overlay. Mobile = Bottom-Sheet mit den 5 zuletzt genutzten Layern und Such-Input.
- **Typografie-Skala:** modulare Skala (Factor 1.250, Basis 16px) auf allen Breakpoints konstant — keine separate Mobile-Typografie. Hero-Text Landing-Page skaliert von 49px Desktop auf 31px Mobile.
- **Touch-Target-Minimum:** 44×44 CSS-Pixel für alle interaktiven Elemente (über WCAG 2.2 SC 2.5.8 24×24 hinaus). Karten-Marker mit erweitertem Klick-Halo via `cursor`-und-`hit-area`-Trick.
- **Sticky-Header-Vermeidung:** kein sticky Header oder Banner, der Focus-Ringe verdecken könnte (WCAG 2.2 SC 2.4.11).
- **Reduzierte Animation:** `prefers-reduced-motion` wird respektiert — alle Karten-Übergänge und Inspektor-Panel-Animationen entfallen, Endzustand sofort.

### Performance-Targets

Verifiziert in CI (Lighthouse + Web Vitals Tracker auf Mid-Tier-Geräten emuliert):

| Metrik | Ziel | Pflicht-/Soll-Bereich |
|--------|------|------------------------|
| **LCP (Largest Contentful Paint)** | < 2.5s | Pflicht für Landing, Bezirks-, Kiez-Routen |
| **INP (Interaction to Next Paint)** | < 200ms | Pflicht inkl. Karten-Klick und Layer-Toggle |
| **CLS (Cumulative Layout Shift)** | < 0.1 | Pflicht — keine Layout-Sprünge bei Karten- oder Panel-Updates |
| **TTFB (Time to First Byte)** | < 200ms Frankfurt-Edge | Soll — Hetzner-Frankfurt Latenz typisch 10–50ms |
| **Initial JS gzipped** | ≤ 200 KB | Pflicht — Bundle-Disziplin, MapLibre lazy nach Hydration |
| **Total page weight (Landing)** | ≤ 500 KB | Soll — Plex-Variable-Font, MapLibre lazy, Karte erst nach User-Action |
| **Lighthouse Performance** | ≥ 90 | Pflicht für CI-Gate |
| **Lighthouse Accessibility** | ≥ 95 | Pflicht für CI-Gate |
| **Lighthouse SEO** | ≥ 95 | Pflicht für CI-Gate |
| **Lighthouse Best Practices** | ≥ 95 | Pflicht für CI-Gate |

Performance-Optimierungs-Disziplin:

- **MapLibre lazy-loaded** nach Hydration — blockiert Initial-Paint nicht. Karte erscheint erst, wenn der Nutzer das Layout sieht.
- **Plex-Fonts subsettet** auf `latin` + `latin-ext` (deutsche Umlaute, polnische Diakritika für Stadtteilnamen wie Köpenick). Variable-Font für Sans und Serif, statisches Regular für Mono. `font-display: swap`.
- **Static-GeoJSON-Layer** mit Filename-Hashing für `immutable`-Caching (`max-age=2592000`).
- **Statische HTML-Seiten** mit `max-age=3600, must-revalidate`.
- **Bilder:** Dynamic OG-PNGs werden zur Build-Zeit gerendert (Satori oder `sharp`), nicht on-demand. Bei Inhalt-Updates Hash ändert sich, alte Versionen bleiben gecached.
- **Critical-CSS inline** für Above-the-Fold (Landing-Hero, Bezirks-Lead). Restliches CSS async geladen.

### SEO-Strategie

Kernziel: ~200 deutsche Basisrouten × 8 Sprachen = ~1.600 prerenderte SEO-Routen + ~8.000 FAQ-Q&As (1.000 × 8) müssen ranken für Long-Tail-Suchen in allen 8 Sprachen (Beispiele: „Wohnlage Boxhagener Kiez", „Mietspiegel Reinickendorf-Ost", „Lärm Schillerkiez nachts", „Stolpersteine Wedding", „Trinkbrunnen Friedrichshain" — plus die analogen Anfragen auf Englisch, Türkisch, Ukrainisch, Arabisch, Spanisch, Französisch, Italienisch).

**Technisches SEO-Setup (Phase 1 Pflicht):**

- **Pre-Rendering** via `export const prerender = true` in SvelteKit-Route-Files für: `/`, `/bezirk/[slug]`, `/kiez/[slug]`, `/layer/[slug]`, `/lizenzen`, `/architektur` (Stack-Showcase).
- **`<svelte:head>`** pro Route mit dynamischem `<title>` und `<meta description>` aus Daten generiert. Keine globalen Defaults — jede Page hat eigene SEO-Identität.
- **JSON-LD Structured Data** pro prerenderter Page:
  - `Place` mit Geo-Koordinaten für Bezirke und Kieze
  - `AdministrativeArea` für LOR-Hierarchie-Ebenen
  - `Dataset` für Layer-Konzept-Erklärseiten mit Lizenz-, Stand-, Quellen-Angaben
  - `FAQPage` für dynamisch generierte FAQ-Sektionen pro Kiez/Bezirk (~1.000 strukturierte Q&As)
  - `WebSite` mit `SearchAction` auf Adress-Suche
- **`sitemap.xml`** automatisch beim Build generiert mit allen prerenderten URLs.
- **`robots.txt`** mit explizitem `Allow: /` und `Sitemap`-Verweis. Keine restriktiven Disallows — Civic-Tech, alles soll crawlbar sein.
- **Canonical-URLs** pro Page, um Duplicate-Content über Subdomain-/Slash-Varianten zu vermeiden.
- **Open-Graph + Twitter-Cards** mit dynamisch gerenderten Bildern pro Page (siehe Performance-Sektion).
- **`hreflang`-Cluster** pro Sprache (8 Sprachen: DE, EN, TR, UK, AR, ES, FR, IT) auf jeder prerenderten Page gesetzt — siehe Internationalization-Sektion in den FRs/NFRs.
- **Strukturierte URLs** sprechend und stabil: `/kiez/boxhagener-kiez`, `/bezirk/friedrichshain-kreuzberg`, `/layer/mietspiegel-wohnlagen`. Keine Query-String-IDs in SEO-Routen.

**AEO-Setup (kombiniert mit GEO):**

- **`llms.txt`** im Root als kondensierte Navigations-Übersicht für LLM-Crawler.
- **`llms-full.txt`** mit den Bezirks-/Kiez-/Layer-Page-Inhalten als Single-File-Quelle.
- **JSON-LD `FAQPage`** dient gleichzeitig SEO (Google Rich Results) und AEO (ChatGPT/Perplexity/Claude Zitations-Quelle).
- **`Dataset`-JSON-LD** mit Lizenz, Stand, Quelle, Distribution-URL macht jedes Layer als Daten-Quelle zitierbar.

**Manuelle SEO-Disziplin:**

- Keyword-Validierung vor Launch — Spotcheck der Top-30 erwarteten Long-Tails gegen Google/Bing.
- Tagesspiegel-Lab-, Wikipedia- und berlin.de-Konkurrenz akzeptiert; Differenzierung über Cross-Layer-Tiefe und FAQ-Spezifität.
- Indexierungsstatus monatlich via Google Search Console und Bing Webmaster Tools (beides browser-bedienbar, kein Tracking).

### Real-time-Anforderungen

**Phase 1:** keine. Site ist strikt static-first. Klima-Sparkline ist statisches JSON pro Adresse, kein API-Call.

**Phase 2:** Live-Daten-Bundle (BVG, BLUME, Wetter) — primär via SvelteKit `query.live` (sobald aus experimental), Fallback klassisch via `load`-Funktionen mit 60-Sekunden-Polling. Update-Frequenzen:

- BVG-Stops: alle 30 Sekunden bei aktiver Adress-Selektion
- BLUME-Luftqualität: alle 5 Minuten
- Wetter (Bright Sky): alle 10 Minuten
- RADOLAN-Regenradar: alle 10 Minuten (via Python-Sidecar)

Health-Check pro externem Endpunkt mit graceful Skip im Inspektor-Panel: API-Ausfall lässt Panel nicht hängen, Layer wird ausgegraut mit „nicht verfügbar"-Hinweis.

### Accessibility-Level

**Konformitätsziel:** WCAG 2.2 Level AA komplett, AAA wo möglich, BFSG-konform. Bereits ausführlich im Design-Direktiv-Dokument und in der Domain-Sektion dokumentiert — hier nur web-app-spezifische Implementierungs-Mechanik:

- **Semantisches HTML zuerst** — alle interaktiven Elemente als `<button>`, `<a>`, `<input>`, `<details>` etc., keine `<div role="button">`-Workarounds.
- **Skip-Link** als erstes fokussierbares Element auf jeder Seite, target = `<main id="main">`.
- **Tastatur-Navigation** flächendeckend: Adress-Suche, Karten-Pan (Pfeiltasten), Karten-Zoom (`+`/`-`), Layer-Toggle-Palette (`/`-Shortcut), POI-Navigation (Tab durch DOM-Liste).
- **Karten-`role="application"`** mit `aria-describedby`-Anleitung („Pfeiltasten zum Verschieben, + und − zum Zoom").
- **Parallele DOM-Listen** der wichtigsten Karten-Inhalte (POIs, Boundaries) für Screenreader-Nutzer.
- **Daten-Tabelle als Alternative** zu jeder Visualisierung (Karte, Charts) per `<button>`-Toggle direkt unter dem Visualisierungs-Element erreichbar.
- **ARIA-Live-Region** für Inspektor-Panel-Updates bei Adress-Wechsel.
- **Focus-Management** in modalen Layer-Toggle-Paletten: Focus-Trap aktiv, Rückkehr-Fokus auf Trigger-Element nach Close.
- **`prefers-reduced-motion`** wird respektiert für alle Karten- und UI-Animationen.
- **`<html lang="de">`** und korrekte `lang`-Attribute bei englischen Begriffen (LOR ist Deutsch, „SvelteKit" englisch).
- **Validierung:** axe-core in CI (Playwright + axe-Plugin), Lighthouse-CI-Job mit Accessibility ≥ 95 als Gate, manuelle Tastatur-Durchquerung pro Major-Release dokumentiert, Screenreader-Smoke-Test (NVDA + VoiceOver) vor Phase-1-Launch.

### Technische Architektur — Phase 1 Bauplan

- **Framework:** SvelteKit v2.x mit Svelte 5 Runes (siehe Design-Direktive). Kein `@sveltejs/adapter-static` — `@sveltejs/adapter-node` mit pro-Route-Prerendering.
- **Build-Pipeline:** `pnpm` als Package-Manager, Vite als Bundler, mapshaper für GeoJSON-Simplifizierung zur Build-Zeit, `fontnik` für MapLibre-Glyph-Pack-Generierung (einmalig).
- **Datenpipeline:** `scripts/fetch-static.ts` ruft FIS-Broker-WFS, ODIS-GeoJSON, DWD-CDC, OSM-Overpass ab. Reprojiziert nach EPSG:4326. Simplifiziert. Hasht. Schreibt nach `static/layers/{name}.{sha}.geojson` plus `static/layers/MANIFEST.json` mit Metadaten.
- **Datenzugriffs-Abstraktion:** `$lib/data/` mit typesafem Interface `getLayersAtPoint(lat, lng): Promise<LayerHits>`. Phase 1 Turf.js auf GeoJSON, Phase 2/3 SQL-Swap ohne Component-Code-Änderung.
- **WebMCP-Adapter:** `$lib/webmcp/` mit `registerTool()`-Wrappern, Spec-Version im Manifest. Bei Pre-1.0-Breaking-Change einmalig Adapter aktualisieren.
- **Chart-Library:** LayerChart v2 (`layerchart@next`), Svelte-5-runes-nativ, Plex-Tokens als CSS-Variablen.
- **Map-Style:** eigener MapLibre-Style-JSON in `static/map-style.json`, Plex-Beschriftungen via selbst gebautem Glyph-Pack in `static/glyphs/`. Tile-Provider-URL via Env-Var (OpenFreeMap Phase 1, Protomaps + R2 als gehedgter Fallback).
- **CI/CD:** GitHub Actions oder Forgejo-Actions mit Lint, Type-Check, axe-core-Audit, Lighthouse-Gate, Build, Deploy auf Hetzner-Coolify.
- **Repository:** Public auf GitHub (oder Codeberg) mit MIT-Lizenz für Code, dl-de-Footer für Daten. README + ARCHITECTURE.md + ADR-Verzeichnis als „recruiter-readable" Artefakte.

### Implementation Considerations

- **Bewusst übersprungene Sektionen** (laut CSV `web_app` `skip_sections`): `native_features` (keine Desktop-/Mobile-App-Brücke nötig — Web-App ist die einzige Plattform), `cli_commands` (kein Developer-CLI nötig — Build-Skripte sind Repo-intern).
- **Browser-Inspector-WebMCP-Verifikation** als manuelle Validierung — kein Auto-Test verfügbar.
- **A/B-Side-by-Side-Vergleich** Plex-Style vs. OpenFreeMap-Liberty vor Phase-1-Launch zur Map-Style-Validierung (Design-Direktive).
- **Performance-Budget** wird in CI durchgesetzt; PR-Build mit > 200 KB Initial-JS schlägt fehl.
- **Backup-Tile-Provider-Switch** in Disaster-Recovery-Doku unter `/docs/runbooks/tile-provider-switch.md` mit Schritt-für-Schritt-Befehlen.

## Project Scoping & Phased Development

Diese Sektion vertieft die Phase-Boundary aus [Product Scope](#product-scope) um MVP-Strategie, User-Journey-Zuordnung, Risk-Mitigation und Scope-Confirmation-Gate.

### MVP Strategy & Philosophy

**MVP-Approach:** **Experience-MVP** mit **Architecture-Showcase-Anteil**. Das Phase-1-Release muss Nutzer überzeugen, dass die Cross-Layer-Sicht und die ruhige Plex-UI ein eigenständiger Beitrag sind — gleichzeitig muss die EU-FOSS-Architektur konsequent stehen, damit der Compliance-Showcase-Hebel funktioniert. Beide Anforderungen sind im selben Release verbindlich; ein „erst hässliche Funktion, später schön" widerspricht der Persona-Brand-Logik.

**Resource-Anforderungen:** Solo-Maintainer (Matze), Implementierungs-Velocity via Claude Code. Keine externen Mitstreiter, keine bezahlten Dienstleister. Hetzner-Hosting-Kosten und Domain-Renewal aus eigener Tasche (~10€/Monat all-in inklusive Domain-Anteil).

### MVP Feature Set (Phase 1)

**Unterstützte User Journeys:**

- Journey 1 — Anna, neugieriger Berliner (Primary Happy Path)
- Journey 3 — Frieda, Datenjournalistin (ohne Embed-Widget; das ist Phase 2)
- Journey 4 — Marek, blinder Stadtforscher (Accessibility / BFSG)
- Journey 5 — Claude-Browser-Extension via WebMCP

**Teil-unterstützt:** Journey 2 — Tobias, Wohnungssuchender. Inspektor-Panel und FAQ funktionieren für die Vergleichs-Schritte; das WebMCP-`cross_layer_query`-Tool ist verfügbar, aber ohne dedizierte Vergleichs-Sicht im UI. Vollausbau in Phase 2.

**Must-Have Capabilities (Phase 1 Pflicht):**

- **Adress-Suche** mit Suggest-as-you-type, tastatur- und screenreader-bedienbar
- **MapLibre-Karte** im Plex-Cartography-Style mit eigenem Style-JSON, selbst gebautem Glyph-Pack, Tile-Provider hinter Config-Variable
- **Inspektor-Panel** mit allen Phase-1-Layer-Hits, ARIA-Live, Per-Layer-Datenstand-Banner („Stand: YYYY-MM, Quelle: X")
- **Layer-Bundle A** — Bezirk, Ortsteil, LOR (3 Ebenen: Prognoseraum 60 / Bezirksregion 138 / Planungsraum 542), PLZ
- **Layer-Bundle B** — Mietspiegel-Wohnlage, Bodenrichtwert, Gebäudealter
- **Layer-Bundle C** — Lärmkarte L_DEN/L_NIGHT, Solarpotenzial, Klimaanalyse, Stolpersteine (mit Quellenverlinkung), Trinkbrunnen (mit Saisonalitäts-Hinweis Mai–Oktober)
- **Klima-Zeitreihe pro Adresse** — nächstgelegene DWD-Station (Dahlem 1719+, Buch 1889+, Tempelhof 1919+, Brandenburg 1957+), Hitze-/Frost-/Sommertage-Sparkline ab 1950, Jahresmitteltemperatur-Long-View
- **~200 deutsche Basisrouten × 8 Sprachen = ~1.600 prerenderte SEO-Routen** — Landing (1) + Bezirke (12) + Kieze/LOR-Bezirksregionen (138) + Layer-Konzept-Erklärseiten (~25) + Lizenz-/Architektur-Pages (~5), alle pro Sprache mit eigenem Title, Meta-Description, JSON-LD, hreflang-Cluster und dynamischem OG-Bild
- **Internationalization Phase 1 — 8 Sprachen** (DE/EN/TR/UK/AR/ES/FR/IT) mit Sprach-Switcher im Always-Reachable-Footer, RTL-Layout für Arabisch, lokale Build-Zeit-Übersetzung via Claude Code, `hreflang`-Cluster pro Page
- **Always-Reachable Meta-Footer** auf jeder Page in der aktiven Sprache: Impressum, Datenschutz, Lizenzen, Kontakt, Architektur, Sprach-Switcher
- **~1.000 dynamisch generierte FAQ-Q&As** pro Kiez und Bezirk mit JSON-LD `FAQPage`-Schema
- **Dynamic OG-Images** pro prerenderter URL — SSR-PNG mit Karten-Snapshot und Top-3-Statistik
- **GEO/AEO-Stack** — `llms.txt`, `llms-full.txt`, JSON-LD `Place`/`AdministrativeArea`/`Dataset`/`FAQPage`/`WebSite`-Markup pro Page
- **WebMCP-Integration** mit mindestens 5 Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`), Resources, Prompt-Templates
- **WCAG 2.2 AA komplett, AAA wo möglich, BFSG-konform** — Skip-Link, Tastatur-Pan/Zoom, ARIA-Live, parallele DOM-Listen für Karten-Inhalte, Daten-Tabellen-Alternative
- **Responsive Layout** Desktop + Tablet + Smartphone
- **EU-FOSS-Hosting** Hetzner-Frankfurt + Coolify + Traefik + CrowdSec, cookieless
- **Editorial-Verantwortung-Behandlung** für sensible Layer (Stolpersteine, Mauer/Sektoren)
- **Mailto-Feedback** „Fehler im Eintrag?" pro Layer
- **Footer mit Lizenz-/Quellen-Matrix** generiert aus `static/layers/MANIFEST.json`
- **Persönliche Attribution** „von Matze [Nachname]" mit Link auf Profil/LinkedIn
- **CI/CD-Gates** Lighthouse Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95, axe-core 0 Violations, Initial JS gzipped ≤ 200 KB

**Was bewusst NICHT in Phase 1 ist** (User-Entscheidungen, dokumentiert in vorigen Sektionen):

- Live-Daten (BVG, BLUME, Wetter) — Phase 2
- Wahl-Layer + Cross-Data-Erzählungen — Phase 2
- Zeit-Slider — Phase 2
- Embeddable Widgets / oEmbed — Phase 2
- RADOLAN-Regenradar — Phase 2
- Drizzle/Postgres — Phase 2
- PostGIS, Memorial-Map, Daten-Quality-Layer, Redaktioneller Content — Phase 3
- Eigener MCP-Server (vom User aktiv abgelehnt — WebMCP ersetzt das)
- Login, UGC, User-LLM-Features, Public API, Plausible/Matomo (Anti-Goals — i18n ist seit UX-Discovery aus den Anti-Goals raus, siehe Internationalization-FRs/NFRs)

### Post-MVP Features

**Phase 2 — geplant:**

- **Live-Daten-Bundle:** BVG-Stops mit Echtzeit-Abfahrten (`v6.bvg.transport.rest`), BLUME-Luftqualität (`luftdaten.berlin.de`), Wetter (Bright Sky / Open-Meteo). Implementierung primär via SvelteKit `query.live` (sobald aus experimental); Fallback klassisch via `load`-Funktionen mit 60-Sekunden-Polling. Health-Check pro externem Endpunkt mit graceful Skip.
- **Wahlebene:** historische Tiefe BVV / AGH / BTW / Volksentscheide, Sparkline pro Adresse, bewusst gebündelt mit anderen Layern (nicht als Konkurrenz zur Tagesspiegel-Wahlkarte). Briefwahl-Asymmetrie und Bezirksreform 2001 sauber dokumentiert.
- **Cross-Data-Erzählungen:** deterministische Template-Texte pro Adresse („wo Milieuschutz + hohe NO₂ + Wahlverhalten X"). Keine LLM-Generierung user-facing.
- **Zeit-Slider:** Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete-Welle. Slider mit 3–5 Jahresständen, nicht jährlich.
- **Embeddable Widgets / oEmbed:** `<iframe>`-Snippet plus oEmbed-Provider für Tagesspiegel/RBB/Berliner Zeitung. Pflicht: Attribution, Lizenz-Footer, Datenstand-Banner im Embed.
- **RADOLAN-Regenradar:** Python-Sidecar (FastAPI + `wradlib`) konvertiert Binary-RADOLAN zu PNG-Tiles oder GeoJSON. Update alle 10 Minuten.
- **Drizzle/Postgres-Backfill:** für tabellarische Wahldaten (~1.4M Datenpunkte) und ergänzende Klima-Stationen. Geometrien bleiben statisch.

**Phase 3 — Vision:**

- **PostGIS** mit räumlichen Cross-Layer-Aggregations-Queries für Datenjournalismus-Analytik („wo Milieuschutz × hohe NO₂ × niedrige Wahlbeteiligung?")
- **Memorial-Map** kuratiert als „was nicht mehr da ist"-Schicht — Berlin Club History (106 geschlossene Clubs), historische Tafeln, Stolperstein-Cluster.
- **Daten-Quality-Layer** mit Aktualisierungs- und Lückenanzeige für Datenjournalisten.
- **Redaktioneller Content-Layer** für „Schreibt-Sich-Mit-Liebe"-Datasets (aktive Berliner Clubs ~30–50, lokale Geschichte pro Adresse).

### Risk-Mitigation-Strategy

Bereits ausführlich in der **Domain-Sektion** dokumentiert. Hier nur die scope-relevanten Strang-Mitigationen:

- **Technische Risiken:**
  - WebMCP-Spec-Volatilität → Adapter-Schicht in `$lib/webmcp/`, Spec-Version im Manifest
  - OpenFreeMap Bus-Faktor → Tile-Provider-Config-Variable, Protomaps-Fallback einmalig vorab getestet, Switch-Runbook dokumentiert
  - `query.live` experimental → in Phase 1 ausgeschlossen, in Phase 2 mit Polling-Fallback
  - Performance-Drift → CI-Gate für Lighthouse + Bundle-Size, PR-Build schlägt fehl bei Überschreitung
- **Reputations-Risiken:**
  - Veraltete Mietspiegel-/Bodenrichtwert-Daten → Datenstand-Banner pro Layer Pflicht, quartalsweise Refresh
  - Erinnerungspolitisch sensible Layer → Quellenverlinkung pro Eintrag, Editorial-Verantwortung-Behandlung, keine LLM-Generierung user-facing
  - Solo-Maintainer-Decay → User-Entscheidung „akzeptiert", reproduzierbarer Build und FOSS-Repo als minimale Mitigation
- **Resource-Risiken:**
  - Solo-Bandbreite → keine Phase-2-Items in Phase 1 ziehen; Cap auf Soft-Limit, nicht hartes Deadline
  - Externe Datenquellen-Lizenz-Drift → Lizenz-Matrix versioniert im Repo, bei Lizenz-Änderung Layer-Entfernung dokumentiert
- **Markt-/Konkurrenz-Risiken:**
  - Tagesspiegel-Lab-Überlappung (Wahl-Layer) → bewusste Bündelung statt Konkurrenz, Differenzierung über Cross-Layer
  - Amsterdam-Atlas-Code als Inspiration ohne Fork → eigene Codebase auf SvelteKit-Stack, keine 1:1-Übertragung
  - CityLAB-Nachbau-Risiko → realistisch erst nach 6–12 Monaten, Personal-Brand-Hebel ist zu diesem Zeitpunkt bereits realisiert

### Scope-Confirmation-Gate

Alle User-spezifizierten Anforderungen aus Brief, Distillat, Recherche-Doc und Design-Direktive sind in den drei Phasen aufgenommen. **Nichts wurde stillschweigend de-scoped oder verschoben**. Phase-Zuordnungen folgen den expliziten User-Entscheidungen aus der Discovery-Session:

- WebMCP in Phase 1 ✓ (User-Wunsch)
- Dynamic OG-Images in Phase 1 ✓ (User-Wunsch)
- FAQ-Pages in Phase 1 ✓ (User-Wunsch)
- Live-Daten Bundle D auf Phase 2 ✓ (User-Wunsch „können auch nach phase 2")
- Klima-Zeitreihe (Dahlem 1719) in Phase 1 ✓ (User-Wunsch „ja: B aber nur Klima-Part")
- Eigener MCP-Server NICHT geplant ✓ (User-Wunsch „phase 2 mcp-server raus")
- Tagesspiegel-Wahl-Bündelung in Phase 2 ✓ (User-Wunsch „machen wir trotzdem")
- Bewusst breite Persona statt spitze Primary Persona ✓ (User-Wunsch „für alle optimiert")
- Vollständig accessible + responsive ✓ (User-Wunsch „fully accessible und somit auch responsiv")
- Keine Erfolgsmetriken-Tracking ✓ (User-Wunsch, anti-Goals dokumentiert)
- Keine Bus-Faktor-/Sunset-Planung ✓ (User-Wunsch „denk ich nicht drüber nach")

## Functional Requirements

Diese FRs sind der **Capability-Contract**: UX, Architektur und Epic-Breakdown bauen ausschließlich was hier gelistet ist. Phase-Zuordnung folgt der Scoping-Sektion (Phase 1 / 2 / 3); Phase ohne Marker = Phase 1.

### Adress-Discovery & Geocoding

- **FR1:** Ein Nutzer kann eine Berliner Adresse, einen Kiez-Namen oder einen Bezirks-Namen als Freitext eingeben.
- **FR2:** Während der Eingabe sieht der Nutzer passende Vorschläge ab dem zweiten getippten Zeichen.
- **FR3:** Der Nutzer kann einen Vorschlag per Maus-Klick, Tap, Enter-Taste oder Pfeiltasten+Enter selektieren.
- **FR4:** Bei nicht-eindeutiger Eingabe sieht der Nutzer eine Disambiguierungs-Liste mit bis zu 10 Treffern, sortiert nach Relevanz.
- **FR5:** Der Nutzer kann mit dem geografischen Mittelpunkt eines Bezirks/Kiezes statt einer Punkt-Adresse arbeiten.
- **FR6:** Bei unbekannter oder außerhalb-Berlin-liegender Eingabe sieht der Nutzer eine klare Fehlermeldung mit Vorschlag „nur Berliner Adressen unterstützt".

### Karten-Visualisierung

- **FR7:** Ein Nutzer sieht eine interaktive MapLibre-Karte im Plex-Cartography-Style (Off-White-Palette, Hairline-Linien, Plex-Beschriftung).
- **FR8:** Die Karte zoomt nach Adress-Auswahl automatisch auf einen passenden Zoom-Level (Punkt-Adresse, Kiez, Bezirk).
- **FR9:** Der Nutzer kann die Karte per Maus-Drag, Touch-Pan, Pfeiltasten oder dedizierten Pan-Buttons verschieben.
- **FR10:** Der Nutzer kann zoomen per Maus-Wheel, Pinch-Gesture, `+`/`−`-Tasten oder dedizierten Zoom-Buttons.
- **FR11:** Die ausgewählte Adresse wird auf der Karte mit einem klar erkennbaren Marker hervorgehoben.
- **FR11a:** Der Nutzer kann sich frei auf der Karte bewegen — Pan und Zoom unabhängig von einer Adress-Auswahl. Karten-Navigation ist Standalone-Capability, nicht Folge einer Suche.
- **FR11b:** Die geladenen Layer und sichtbaren POIs aktualisieren sich live entsprechend dem aktuellen Viewport (Bbox + Zoom-Level). Sichtbare Boundaries und Punkt-Daten werden bei Pan/Zoom on-the-fly neu gerendert.
- **FR11c:** Der Nutzer kann an einer beliebigen Karten-Position klicken/tappen und erhält ein Inspektor-Panel mit den Layer-Hits für genau diesen Punkt (Reverse-Geocoding + Punkt-in-Polygon).
- **FR11d:** Die aktuelle Viewport-Konfiguration (Bbox, Zoom, aktive Layer) wird in der URL als Query-Parameter gespiegelt — deeplinkbar und teilbar. Beim Aufruf einer URL mit Viewport-Parametern lädt die Karte exakt diesen Zustand.
- **FR11e:** Per Zoom-Level ändert sich automatisch die Layer-Granularität: niedriger Zoom = Bezirks-/Prognoseraum-Ebene, höherer Zoom = LOR-Bezirksregion/Planungsraum, höchster Zoom = POIs und Punkt-Daten. Schwellen sind im Layer-Manifest definiert.
- **FR12:** Die Boundary der ausgewählten LOR-Region/Bezirk wird als `--accent`-Outline hervorgehoben.
- **FR13:** Der Nutzer sieht in einer Karten-Legende die aktuell aktiven Layer mit ihrem numerischen Wertebereich und Farbskala.

### Layer-System & Inspektor-Panel

- **FR14:** Bei Adress-Auswahl öffnet sich ein Inspektor-Panel mit allen Treffer-Layern für diesen Punkt (Phase 1: Bundles A + B + C + Klima).
- **FR15:** Pro Layer im Panel sieht der Nutzer den Wert, eine kurze Erklärung, den Datenstand („Stand: YYYY-MM, Quelle: X") und einen „Fehler im Eintrag?"-Mailto-Link.
- **FR16:** Der Nutzer kann via Tastatur-Shortcut `/` eine Layer-Auswahl-Palette öffnen, einen Layer-Namen tippen und per Enter aktivieren/deaktivieren.
- **FR17:** Auf Mobile-Geräten erscheint die Layer-Auswahl als Bottom-Sheet mit den 5 zuletzt genutzten Layern + Such-Input.
- **FR18:** Aktive Layer werden auf der Karte transparent übereinander gerendert; sequentielle Skalen für ordinale Daten, divergierende für vorzeichenbehaftete Daten, Outline-only für Boundary-Kategorien.
- **FR19:** Der Nutzer kann zu jeder Karten-Visualisierung eine gleichwertige Daten-Tabelle aufrufen — sortierbar, tastatur-navigierbar.
- **FR20:** Layer-Hits ohne Daten-Coverage werden explizit als „Daten nicht vorhanden" ausgewiesen, nicht stillschweigend ausgelassen.
- **FR21:** Der Trinkbrunnen-Layer zeigt einen sichtbaren Saisonalitäts-Hinweis (Mai–Oktober aktiv); zwischen November und April wird die Verfügbarkeit explizit als „außerhalb der Saison" markiert.

### Klima-Heritage (DWD-Zeitreihen)

- **FR22:** Pro Adresse wird die nächstgelegene DWD-Station automatisch ermittelt und im Klima-Block angezeigt (Dahlem, Buch, Tempelhof oder Brandenburg-Schönefeld).
- **FR23:** Der Nutzer sieht eine Sparkline der Sommertage (T_max ≥ 25°C) pro Jahr seit 1950 für seine Station.
- **FR24:** Der Nutzer sieht analog Sparklines für Frosttage und heiße Tage (T_max ≥ 30°C).
- **FR25:** Für Berlin-Dahlem zusätzlich eine Long-View-Chart der Jahresmitteltemperatur ab 1719.
- **FR26:** Jede Klima-Sparkline ist als tastatur-navigierbare LayerChart-Komponente mit Daten-Tabellen-Alternative implementiert.

### Discovery-Surfaces (SEO/AEO-Pages)

- **FR27:** Jeder Berliner Bezirk hat eine eigene prerenderte URL `/bezirk/{slug}` mit Lead-Text, Steckbrief, Karten-Embed, FAQ-Sektion.
- **FR28:** Jede LOR-Bezirksregion (Kiez) hat eine eigene prerenderte URL `/kiez/{slug}` analog zu FR27.
- **FR29:** Jedes Layer-Konzept (Mietspiegel-Wohnlage, Bodenrichtwert, LOR, Milieuschutz, etc.) hat eine eigene prerenderte URL `/layer/{slug}` mit Erklär-Text, Lizenz-Hinweis, Beispiel-Visualisierung.
- **FR30:** Jede Bezirks-, Kiez- und Layer-URL trägt eine eigene FAQ-Sektion mit 5–10 datengefüllten Q&As im JSON-LD `FAQPage`-Format.
- **FR31:** Jede prerenderte URL hat ein dynamisch gerendertes Open-Graph-Bild mit Karten-Snapshot und Top-3-Statistik.
- **FR32:** Jede prerenderte URL trägt ein eigenes `<title>` und eine eigene `<meta description>`, generiert aus den Daten der Page.
- **FR33:** Der Nutzer kann jede prerenderte URL ohne JavaScript lesen (Progressive Enhancement); die interaktive Karte ist optionale Erweiterung.

### LLM-/Agent-Surfaces (GEO/AEO)

- **FR34:** Die Site exponiert eine `/llms.txt` mit kondensierter Navigations-Übersicht aller Bezirks-/Kiez-/Layer-Pages.
- **FR35:** Die Site exponiert eine `/llms-full.txt` mit den Bezirks-/Kiez-/Layer-Page-Inhalten als Single-File-Quelle.
- **FR36:** Jede prerenderte URL trägt JSON-LD Structured Data im Schema-Typ `Place`, `AdministrativeArea`, `Dataset`, `FAQPage` oder `WebSite` (je nach Page-Typ).
- **FR37:** Die Site registriert sich als WebMCP-Server (via `webmcp.dev`) mit mindestens 5 Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`, `get_layer_metadata`, `list_layers_at_point`).
- **FR38:** Die Site exponiert die aktive Adresse und die geladenen Layer als WebMCP-Resources mit URI-adressierbarem Datenmodell.
- **FR39:** Die Site bietet mindestens 3 WebMCP-Prompt-Templates an („Was ist an dieser Adresse besonders?", „Vergleiche diese zwei Kieze", „Erkläre den Layer X").
- **FR40:** Jeder Datenwert im Inspektor-Panel trägt eine maschinenlesbare Quellen-Attribution, damit LLM-Agenten die Site als zitierbare Quelle verwenden können.

### Accessibility & Responsiveness

- **FR41:** Jede Page hat einen Skip-Link als erstes fokussierbares Element, der zum Hauptinhalt springt.
- **FR42:** Der Nutzer kann alle Funktionen (Adress-Suche, Karten-Interaktion, Layer-Toggle, POI-Auswahl, Chart-Navigation) ausschließlich per Tastatur erreichen.
- **FR43:** Jede Karten-Interaktion (Adress-Auswahl, Layer-Aktivierung, POI-Fokus) löst eine ARIA-Live-Region-Update aus, sodass Screenreader die Änderung ansagen.
- **FR44:** Karten-Inhalte (POIs, Boundaries) sind parallel als semantische DOM-Liste mit `<button>`/`<a>`-Elementen zugänglich für Screenreader-Nutzer.
- **FR45:** Alle Drag-Operationen (Karten-Pan, Bottom-Sheet) haben eine alternative Single-Click/Tap-Bedienung (WCAG 2.2 SC 2.5.7).
- **FR46:** Alle interaktiven Elemente erfüllen ein Target-Size-Minimum von 44×44 CSS-Pixeln (über WCAG 2.2 SC 2.5.8 24×24 hinaus).
- **FR47:** Das Layout passt sich responsive an Desktop (>1024px), Tablet (641–1024px) und Smartphone (≤640px) an, ohne Funktionsverlust.
- **FR48:** Die Site respektiert `prefers-reduced-motion` — Karten-Übergänge und UI-Animationen entfallen, Endzustand sofort.
- **FR49:** Focus-Ringe sind sichtbar und werden nicht durch sticky Elemente verdeckt (WCAG 2.2 SC 2.4.11/2.4.12).

### Editorial-Integrität & Lizenz-Transparenz

- **FR50:** Jeder Stolperstein-Eintrag verlinkt zur Berliner Koordinierungsstelle und/oder Wikipedia als Primärquelle.
- **FR51:** Personen-Hintergründe zu Stolpersteinen werden als zitierter Auszug mit Quellen-URL ausgespielt, niemals algorithmisch oder LLM-generiert.
- **FR52:** Mauer-/Sektoren-Grenzen tragen einen historischen Stand-Hinweis und Datenquellen-Verlinkung.
- **FR53:** Pro Layer hat der Nutzer einen sichtbaren „Fehler im Eintrag?"-Mailto-Link zur Footer-Adresse.
- **FR54:** Der Footer zeigt eine Lizenz-Matrix mit Quelle, Stand, Lizenz pro Layer; die Matrix wird automatisch aus `static/layers/MANIFEST.json` generiert.
- **FR55:** Mietspiegel- und Bodenrichtwert-Layer zeigen einen Disclaimer „ersetzt keine rechtliche Aussage".

### Internationalization & Meta-Footer (Phase 1)

- **FR55a:** Die Site unterstützt 8 Sprachen ab Phase 1: Deutsch (Default), Englisch, Türkisch, Ukrainisch, Arabisch, Spanisch, Französisch, Italienisch. Sprachauswahl orientiert am Berliner Mikrozensus + touristischer Realität, bewusst breiter als `berlin.de` (das nur DE/EN/FR/IT bietet).
- **FR55b:** Jede URL trägt einen Sprach-Prefix (`/de/...`, `/en/...`, `/tr/...`, `/uk/...`, `/ar/...`, `/es/...`, `/fr/...`, `/it/...`). Sprach-Wechsel verändert nur den Prefix, behält Viewport-State, aktive Layer und ausgewählte Adresse bei.
- **FR55c:** Beim ersten Besuch wertet der Server den `Accept-Language`-Header aus und leitet zur passenden Sprach-Route weiter (302, kein Cookie). Bei nicht-unterstützter Browser-Sprache fällt der Default auf Deutsch zurück.
- **FR55d:** Der Sprach-Switcher ist als kompaktes Element im Always-Reachable-Footer auf jeder Page verfügbar, plus optional dezent in der Page-Top-Right-Ecke der Hero-Page. Tastatur-bedienbar, screenreader-zugänglich.
- **FR55e:** Pro prerenderter URL werden `<link rel="alternate" hreflang="...">`-Tags für alle 8 Sprachvarianten gesetzt; `hreflang="x-default"` zeigt auf die deutsche Version.
- **FR55f:** Die Site rendert korrekt im Right-to-Left-Layout für Arabisch (`<html lang="ar" dir="rtl">`). UI-Chrome (Inspektor-Panel-Position, Pan-Buttons, Bottom-Sheet-Richtung) flippt automatisch via Logical CSS Properties. Karten-Inhalt bleibt geografisch LTR; Karten-Beschriftung wird in Plex Arabic gerendert.
- **FR55g:** UI-Strings, FAQ-Q&As und Bezirks-/Kiez-/Layer-Erklärtexte sind in allen 8 Sprachen verfügbar. Übersetzung erfolgt im Build-Step lokal via Claude (kein Laufzeit-API-Spend, kein US-Drittanbieter im Production-Pfad).
- **FR55h:** Übersetzungen werden in `src/lib/i18n/{lang}.json`-Bundles committet, manuell pro Release reviewt (informeller Native-Speaker-Spotcheck für UK, TR, AR). Translation-Quality-Disclaimer im Footer-Datenschutz: „Übersetzungen maschinell-unterstützt erstellt, manuell gegengelesen."
- **FR55i:** Stolperstein-Personen-Hintergründe und Editorial-Texte zu erinnerungspolitisch sensiblen Layern werden NICHT maschinell übersetzt — Wikipedia-Quellen werden in der Zielsprache verlinkt, falls vorhanden, sonst bleibt DE/EN-Original mit klarem Hinweis sichtbar.
- **FR55j:** Der Always-Reachable-Meta-Footer auf jeder Page enthält in jeder Sprache: Impressum (§5 TMG), Datenschutz (DSGVO Art. 13 + Cookieless-Statement + Translation-Disclaimer), Lizenzen (Quellen-Matrix), Kontakt (Mailto), Architektur (Stack-Showcase) und den Sprach-Switcher.

### Phase-2-Capabilities (geplant, nicht MVP)

- **FR56 (P2):** Der Nutzer sieht für eine Adresse Echtzeit-BVG-Abfahrten der nächsten Stops mit Linie, Ziel und Minuten.
- **FR57 (P2):** Der Nutzer sieht den aktuellen BLUME-Luftqualitäts-Wert (NO₂, PM10, PM2.5) der nächstgelegenen Station mit Aktualisierungs-Zeit.
- **FR58 (P2):** Der Nutzer sieht aktuelles Wetter und 24h-Vorhersage über Bright Sky oder Open-Meteo.
- **FR59 (P2):** Der Nutzer sieht für eine Adresse die Wahlbezirks-Ergebnisse der letzten 3 BVV/AGH/BTW als Sparkline und detaillierte Auflistung.
- **FR59a (P2):** Der Zeit-Slider ist mit dem aktuellen Viewport synchronisiert — Layer-Daten aktualisieren sich bei Verschieben des Sliders für die aktuell sichtbare Karten-Region. Pan/Zoom und Time-Wert sind orthogonal navigierbar, beide Achsen werden in der URL gespiegelt.
- **FR60 (P2):** Der Nutzer kann via Zeit-Slider zwischen 3–5 Jahresständen ausgewählter Layer (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete) wechseln.
- **FR61 (P2):** Der Nutzer kann eine Cross-Data-Erzählung pro Adresse abrufen — deterministisch generierte Template-Texte aus Datenwerten.
- **FR62 (P2):** Datenjournalisten erhalten für jede Bezirks-/Kiez-Page einen Embed-Snippet (`<iframe>` oder oEmbed) mit eingebauter Attribution und Lizenz-Footer.
- **FR63 (P2):** Der Nutzer sieht ein RADOLAN-Regenradar-Overlay mit 1km-Raster und 10-Minuten-Aktualisierung über Berlin.

### Phase-3-Capabilities (Vision)

- **FR64 (P3):** Datenjournalisten können räumliche Cross-Layer-Aggregations-Queries ausführen („alle Adressen mit Milieuschutz + NO₂ > X + Wahlbeteiligung < Y").
- **FR65 (P3):** Der Nutzer sieht eine kuratierte Memorial-Map mit „was nicht mehr da ist"-Schicht (geschlossene Clubs, entfernte Tafeln, historische Stolperstein-Cluster).
- **FR66 (P3):** Datenjournalisten sehen einen Daten-Quality-Layer mit Aktualisierungs- und Lücken-Anzeige pro Layer pro Region.
- **FR67 (P3):** Der Nutzer sieht redaktionell kuratierte Geschichten pro Adresse („Schreibt-Sich-Mit-Liebe"-Datasets: aktive Berliner Clubs, lokale Mikrogeschichte).

## Non-Functional Requirements

Diese NFRs definieren *wie gut* das System arbeiten muss — testbare Schwellen, keine vagen Adjektive. Performance, Sicherheit, Privacy, Accessibility, Integration, Reliability und Maintainability sind die einschlägigen Kategorien. **Scalability bewusst weggelassen** — Solo-Civic-Tech-Projekt ohne Growth-Ambition, Single-Instance-Hetzner-Setup ist Auslegungs-Standard.

### Performance

- **NFR-P1:** LCP (Largest Contentful Paint) < 2.5 Sekunden auf Mid-Tier-Mobilgerät (Moto G Power, 4G Slow, emuliert in Lighthouse CI) für Landing, Bezirks-, Kiez-Routen.
- **NFR-P2:** INP (Interaction to Next Paint) < 200 Millisekunden für Layer-Toggle, Karten-Klick und Adress-Suggest-as-you-type.
- **NFR-P3:** CLS (Cumulative Layout Shift) < 0.1 auf allen prerenderten Routen.
- **NFR-P4:** TTFB (Time to First Byte) < 200ms Frankfurt-Edge im 50.-Perzentil; Hetzner-Frankfurt-Latenz typisch 10–50ms.
- **NFR-P5:** Initial JS gzipped ≤ 200 KB für Landing und Kiez-Routen; CI-Gate schlägt fehl bei Überschreitung.
- **NFR-P6:** Gesamt-Page-Weight Landing ≤ 500 KB inkl. Plex-Variable-Font (subsetet `latin` + `latin-ext`).
- **NFR-P7:** Lighthouse Performance ≥ 90 auf allen prerenderten Top-Routen — CI-Gate.
- **NFR-P8:** Lighthouse SEO ≥ 95, Best Practices ≥ 95 — CI-Gate.
- **NFR-P9:** MapLibre wird lazy nach Hydration geladen und blockiert den Initial-Paint nicht.
- **NFR-P10:** Statische GeoJSON-Layer werden mit `cache-control: public, max-age=2592000, immutable` (30 Tage) ausgeliefert; Cache-Invalidation per Filename-Hashing.

### Security

- **NFR-S1:** TLS 1.3 erzwungen; TLS 1.2 nur als Fallback, alle älteren Protokolle deaktiviert.
- **NFR-S2:** Let's Encrypt-Zertifikat mit Auto-Renewal via Traefik; Zertifikat-Ablauf-Lücke < 24h.
- **NFR-S3:** Strict Content-Security-Policy ohne `unsafe-inline`, ohne externe Script-/Style-Quellen außer selbst gehosteten Assets.
- **NFR-S4:** HTTP-Security-Header gesetzt: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, restriktive `Permissions-Policy`.
- **NFR-S5:** CrowdSec-Plugin in Traefik im Streaming-Mode mit Decision-Sync alle 60 Sekunden; Collections `crowdsecurity/traefik`, `crowdsecurity/http-cve`, `crowdsecurity/base-http-scenarios`, `crowdsecurity/sshd`, `crowdsecurity/linux`.
- **NFR-S6:** Hetzner-eingebauter Layer-3/4-DDoS-Schutz aktiv (kostenlos, ohne weitere Konfiguration).
- **NFR-S7:** Keine US-Drittanbieter-Domains in den Production-Network-Requests; verifiziert via Network-Tab-Audit und CI-Linter gegen Allowlist.
- **NFR-S8:** SSH-Zugang zum Hetzner-Host nur per Key-Auth, kein Passwort-Login, dedizierter Admin-Account ohne Root-Login.

### Privacy / DSGVO

- **NFR-PR1:** Null `Set-Cookie`-Header verlassen den Server in Production; verifiziert via Response-Header-Inspect-Test in CI.
- **NFR-PR2:** Keine personenbezogenen Daten werden gespeichert oder geloggt; Adress-Eingabe bleibt clientseitig, Geocoding-Anfragen werden serverseitig IP-anonymisiert geproxied (Nominatim).
- **NFR-PR3:** Keine Tracking-Pixel, kein Plausible, kein Matomo, keine Web-Analytics — auch nicht datenschutzfreundliche Varianten.
- **NFR-PR4:** Standard-Webserver-Access-Logs werden IP-pseudonymisiert (letztes Oktett gekürzt) und nach 7 Tagen rotiert/gelöscht.
- **NFR-PR5:** Keine Cookie-Banner-Pflicht — DSGVO-Konformität durch Architektur statt durch Consent-UI.
- **NFR-PR6:** Footer enthält DSGVO-Statement und eine Datenschutz-Erklärung mit klarer Aussage „diese Site speichert keinerlei personenbezogene Daten".
- **NFR-PR7:** Impressum nach §5 TMG vorhanden.

### Accessibility

- **NFR-A1:** WCAG 2.2 Level AA komplett — alle 50 Erfolgskriterien erfüllt, in CI via axe-core verifiziert (0 Violations).
- **NFR-A2:** AAA-Kontraste (≥ 7:1) für Body Text und Headings auf der Hauptpalette eingehalten.
- **NFR-A3:** Lighthouse Accessibility ≥ 95 auf allen prerenderten Routen — CI-Gate.
- **NFR-A4:** Tastatur-Navigation flächendeckend: Skip-Link, Adress-Suche, Karten-Pan via Pfeiltasten, Karten-Zoom via `+`/`−`, Layer-Toggle-Palette via `/`, POI-Navigation via Tab.
- **NFR-A5:** Screenreader-Smoke-Test (NVDA + VoiceOver) vor jedem Major-Release dokumentiert in `docs/runbooks/a11y-smoke-test.md`.
- **NFR-A6:** Target-Size ≥ 44×44 CSS-Pixel für alle sichtbaren interaktiven Elemente (über WCAG 2.2 SC 2.5.8 24×24 hinaus).
- **NFR-A7:** Focus-Ringe sind sichtbar (mindestens 2 px, Kontrast ≥ 3:1) und werden nicht durch sticky Elemente verdeckt (WCAG 2.2 SC 2.4.11/2.4.12).
- **NFR-A8:** `prefers-reduced-motion` wird respektiert — alle Karten-Übergänge und UI-Animationen entfallen, Endzustand sofort.
- **NFR-A9:** Charts und Karten haben gleichwertige Daten-Tabellen-Alternativen, per `<button>`-Toggle direkt unter dem Visualisierungs-Element erreichbar.
- **NFR-A10:** BFSG-Konformität (Barrierefreiheits-Stärkungs-Gesetz, gilt seit 2025) im Footer attestiert.

### Integration

- **NFR-I1:** Build-Zeit-Datenabruf von FIS-Broker-WFS, ODIS-GeoJSON, DWD Climate Data Center und OSM-Overpass; Retry mit exponentieller Backoff bei transienten Fehlern (3 Versuche, 1s/2s/4s).
- **NFR-I2:** Per Datenquelle wird ein Health-Check-Endpunkt während des Build-Skripts geprüft; bei Quellen-Ausfall wird der Build abgebrochen, nicht stillschweigend mit veralteten Daten fortgefahren.
- **NFR-I3:** Reprojektion EPSG:25833 → EPSG:4326 wird zur Build-Zeit fehlerfrei durchgeführt; verifiziert mit Spotcheck von 5 Sample-Punkten gegen erwartete Koordinaten.
- **NFR-I4:** Pro Layer wird Source-URL, Abruf-Datum, Lizenz und SHA-256 in `static/layers/MANIFEST.json` festgehalten.
- **NFR-I5:** Lizenz-Hierarchie wird eingehalten und automatisch in `/lizenzen` und im Footer ausgespielt: `dl-de/zero-2-0`, `dl-de/by-2-0`, CC BY 3.0 DE / 4.0, ODbL 1.0, CC-BY-SA.
- **NFR-I6:** Nominatim-Geocoding-Anfragen werden auf maximal 1 Request pro Sekunde rate-limitiert (OSM-Public-Instance-Compliance); lokaler LRU-Cache hält die häufigsten 1.000 Adress-Anfragen.
- **NFR-I7:** WebMCP-Spec-Version wird in einer `webmcp-manifest.json` dokumentiert; bei Breaking-Change wird die Adapter-Schicht in `$lib/webmcp/` aktualisiert, Tools/Resources/Prompts bleiben semantisch stabil.
- **NFR-I8 (P2):** Phase-2-Live-Endpunkte (BVG, BLUME, Bright Sky) werden mit Health-Check pro Request abgesichert; bei Endpunkt-Ausfall wird der entsprechende Layer im Inspektor-Panel ausgegraut, kein Hängen des Panels.

### Reliability

- **NFR-R1:** Realistisches Verfügbarkeits-Ziel: 99% Uptime pro Monat (≈ 7h 18min Downtime/Monat akzeptiert); nicht-kommerziell, kein SLA.
- **NFR-R2:** Coolify-Container-Auto-Restart bei Crash; Restart-Lücke < 60 Sekunden.
- **NFR-R3:** Graceful Degradation: bei Ausfall externer Live-Endpunkte (Phase 2) bleibt die Site lesbar; ausgefallene Layer werden mit „nicht verfügbar"-Hinweis statt Error-Page ausgespielt.
- **NFR-R4:** Daily Backup der Hetzner-Volumes via Coolify-Backup-Mechanism mit 7 Tagen Retention.
- **NFR-R5:** Domain-Renewal-Auto-Pay aktiviert; Erinnerung 60 Tage vor Ablauf zusätzlich per E-Mail.
- **NFR-R6:** Disaster-Recovery-Runbooks in `docs/runbooks/` für: Tile-Provider-Switch (OpenFreeMap → Protomaps), CrowdSec-False-Positive-Whitelist, Datenbank-Restore (Phase 2+), Hetzner-Failover (Phase 3+).

### Maintainability

- **NFR-M1:** Reproduzierbarer Build: `pnpm install && pnpm fetch && pnpm build` liefert identisches Artefakt; Datenstand-Manifest mit SHA pro Layer verifizierbar.
- **NFR-M2:** Repository Public auf GitHub (oder Codeberg) mit MIT-Lizenz für Code; README + ARCHITECTURE.md + ADR-Verzeichnis (Architecture Decision Records für jede signifikante Entscheidung).
- **NFR-M3:** TypeScript strict mode aktiviert; Type-Check-Fehler brechen den CI-Build.
- **NFR-M4:** ESLint + Prettier konfiguriert; Lint-Fehler brechen den CI-Build.
- **NFR-M5:** Test-Coverage-Erwartung: Unit-Tests für Daten-Transform-Logik (Reprojektion, Punkt-in-Polygon, Layer-Hit-Berechnung) bei ≥ 80% Coverage; UI-Smoke-Tests via Playwright für Top-3-Journeys.
- **NFR-M6:** Pro Major-Datenquelle eine Architecture-Decision-Record (z.B. ADR-001-tile-provider, ADR-002-webmcp, ADR-003-postgres-deferral).
- **NFR-M7:** Code-Disziplin gemäß CLAUDE.md: keine Backwards-Compat-Hacks, keine Premature-Abstractions, keine Comments außer für nicht-offensichtliche WHYs, Files < 500 Zeilen.
- **NFR-M8:** Drittanbieter-Dependencies werden monatlich auf Sicherheits-Updates geprüft; CVE-relevante Updates innerhalb 7 Tagen eingespielt.

### Internationalization

- **NFR-IL1:** 8 Sprachen Phase 1 (DE, EN, TR, UK, AR, ES, FR, IT) verbindlich; UI-Strings, FAQ-Q&As und prerenderte Erklärtexte in allen 8 Sprachen verfügbar.
- **NFR-IL2:** Translation lokal via Claude Code im Build-Step ausgeführt; keine Laufzeit-API-Calls an externe Translation-Services. Build-Output ist deterministisch und committet sich als `src/lib/i18n/{lang}.json`-Bundles ins Repo.
- **NFR-IL3:** Plex-Glyph-Packs decken alle 8 Sprachen ab: Latin (DE/EN/ES/FR/IT), Latin-ext (TR-spezifische Diakritika), Cyrillic (UK), Arabic (AR). Glyph-Packs werden einmalig via `fontnik` aus den OFL Plex-Variable-Files gebaut und in `static/glyphs/{fontstack}/{range}.pbf` deployed.
- **NFR-IL4:** RTL-Layout für Arabisch via `dir="rtl"` und CSS Logical Properties (`margin-inline-start`, `padding-inline-end`, etc.) — keine separate Arabisch-Stylesheet-Variante. UI-Chrome flippt automatisch, Karten-Inhalt bleibt LTR.
- **NFR-IL5:** Skalierung der prerenderten Routen: ~200 deutschsprachige Basisrouten × 8 Sprachen = ~1.600 prerendered HTML-Pages. FAQ-Q&As: ~1.000 × 8 = ~8.000 mit JSON-LD `FAQPage`-Schema pro Sprache. Build-Zeit-Budget < 15 Minuten auf Hetzner-Build-Runner.
- **NFR-IL6:** Sprach-Switcher-Pattern ist cookieless — Sprache wird ausschließlich über URL-Prefix gehalten, niemals über Cookie oder LocalStorage. Browser-Sprach-Erkennung über Server-Side `Accept-Language`-Auswertung bei Initial-Request mit 302-Redirect zur passenden Sprach-Route.
- **NFR-IL7:** `<html lang="...">` und `dir="ltr"`/`dir="rtl"` korrekt pro Sprache gesetzt. `<link rel="alternate" hreflang="...">`-Tags inkl. `x-default` (Deutsch) auf jeder prerenderten Page.
- **NFR-IL8:** Translation-Quality-Gate vor Release: manueller Spotcheck für UK, TR, AR (besonders RTL-Verifizierung) durch informelle Native-Speaker. Footer-Disclaimer „Übersetzungen maschinell-unterstützt erstellt, manuell gegengelesen". Mailto-Pfad für Fehlerhinweise pro Sprache.
- **NFR-IL9:** Erinnerungspolitisch sensible Inhalte (Stolpersteine-Personen-Hintergründe, Mauer/Sektoren-Erklärungen) werden NICHT maschinell übersetzt — Wikipedia-Quellen werden in der jeweiligen Zielsprache verlinkt, falls vorhanden, sonst bleibt DE/EN-Original mit klarem Hinweis sichtbar.
- **NFR-IL10:** Always-Reachable-Meta-Footer (Impressum, Datenschutz, Lizenzen, Kontakt, Architektur, Sprach-Switcher) auf jeder Page in der aktiven Sprache verfügbar; §5 TMG und DSGVO Art. 13 in allen 8 Sprachen ausgeliefert.
