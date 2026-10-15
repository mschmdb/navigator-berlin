---
title: "Product Brief: navigator.berlin"
status: "complete"
created: "2026-05-10T17:02:11Z"
updated: "2026-05-10T17:08:00Z"
inputs:
  - "_user-input/berlin-atlas-recherche.md"
  - "Session-Dialog Mary (BA) ↔ Matze, 2026-05-10"
---

## Executive Summary

`navigator.berlin` ist ein persönliches Civic-Tech-Projekt: eine Web-App, in die jede Berliner Adresse eingegeben werden kann und die als Antwort sämtliche relevanten administrativen Grenzen und themenbezogenen Stadtdaten rund um diesen Punkt zeigt — Bezirk, LOR-Hierarchie, Mietspiegel-Wohnlage, Bodenrichtwert, Gebäudealter, Lärmkarte, Solarpotenzial, Stolpersteine, Trinkbrunnen, plus eine Klima-Zeitreihe der nächstgelegenen DWD-Station bis zurück zu 1719 (Berlin-Dahlem). Inspiration ist `boundaries.beta.nyc`; das Pattern wird auf Berliner Realität gezogen. Phase 1 ist konsequent statisch ausgeliefert. Live-Daten (BVG, Luftqualität, Wetter) und Wahlebene folgen in Phase 2.

Die Daten sind komplett offen (`dl-de/zero-2-0` ≈ CC0). Einzelne Layer existieren in spezialisierten Tools — die Erfrischungskarte zeigt Schatten, Gieß den Kiez zeigt Bäume, das Tagesspiegel-Lab zeigt Wahlbezirks-Ergebnisse mit Adress-Lookup und historischem Verlauf. Was es nicht gibt: ein Tool, in dem all diese Layer im selben Inspektor-Panel an derselben Adresse zusammenfließen. `navigator.berlin` ist nicht die bessere Wahlkarte und nicht die bessere Schattenkarte — es ist das Tool, das Wahl + Schatten + Mietspiegel + Lärm + Stolperstein gleichzeitig pro Punkt zeigt. Mit Phase-2-Cross-Layer-Erzählungen ("wo wählt man wie, je nach Wohnlage und Verkehrsbelastung?") wird genau diese Schnitt-Sicht der Differenzierer.

Eigentümer ist Matze Schmidbauer persönlich, nicht sein Arbeitgeber mtc.berlin. Das Projekt ist bewusst nicht-kommerziell, EU-only, cookieless und FOSS-gestützt; es zahlt auf persönliche Sichtbarkeit und auf die DSGVO-affine Beratungslinie ein, ohne ein Produkt im Markt-Sinne zu sein.

## Das Problem

Berlin ist eine der am besten kartierten Städte Europas. Die Stadt veröffentlicht hunderte Open-Data-Geo-Layer über `daten.berlin.de`, FIS-Broker, ODIS und das Amt für Statistik Berlin-Brandenburg. Trotzdem ist es für eine interessierte Person heute praktisch unmöglich, *eine* Adresse einzugeben und auf einer Karte ohne Klick-Hopping zu sehen, in welchem Mietspiegel-Wohnlagen-Cluster sie liegt, welcher Bodenrichtwert dort gilt, wie laut es nachts ist, wann der nächste Trinkbrunnen aufgedreht wird und welcher Stolperstein um die Ecke liegt.

Was existiert, sind drei fragmentierte Klassen von Tools:

1. **Verwaltungs-Stadtpläne** (`berlin.de/stadtplan`) — ästhetisch konservativ, single-purpose Adresse → Bezirk
2. **Thematische Civic-Tech-Apps** (Erfrischungskarte, Gieß den Kiez, KiezColors, Tagesspiegel-Wahlkarten) — exzellent, aber jede ein eigenes Projekt mit eigenem Layer
3. **Datenportale** (`daten.berlin.de`, FIS-Broker, ODIS Geoexplorer) — primärer Adressat sind Entwickler, nicht Bürger

Wer sich für die *Schnittmenge* mehrerer Layer an einer konkreten Adresse interessiert, muss heute zwischen 5–10 Tools wechseln, Browser-Tabs jonglieren, Screenshots vergleichen. Für Datenjournalismus, Stadtforschung und schlicht für interessierte Bürger ist das die unbefriedigende Status-quo-Erfahrung.

## Die Lösung

Eine SvelteKit-Web-App auf der Domain `navigator.berlin`. Eine Adress-Suche oben, eine Karte mit MapLibre darunter, ein kontextuelles Inspektor-Panel an der Seite. Klickt jemand eine Adresse, lädt das Panel parallel:

- **Boundaries:** Bezirk, Ortsteil, LOR (Prognoseraum / Bezirksregion / Planungsraum), PLZ
- **Wohn-Daten:** Mietspiegel-Wohnlage, Bodenrichtwert, Gebäudealter
- **Umwelt + Memorial:** Lärmkarte (Tag/Nacht), Solarpotenzial, Klimaanalyse, Stolpersteine im Umkreis, Trinkbrunnen (mit Saisonalitäts-Hinweis Mai–Oktober)
- **Berliner Klima-Erbe:** an der nächstgelegenen DWD-Station (Berlin-Dahlem führt mit einer durchgehenden Zeitreihe seit 1719 — der ältesten in Deutschland) Hitze-, Frost- und Sommertage als Sparkline ab 1950, plus Jahresmitteltemperatur-Verlauf seit Beginn der Aufzeichnung. Story-Hook und visuelles Phase-1-Highlight.

Die Layer sind alle navigierbar: anschalten, ausschalten, übereinanderlegen. Pro Boundary-Region und pro Layer-Konzept (Milieuschutz, LOR, Mietspiegel) existiert eine eigene prerenderte HTML-Seite mit Erklärungstext, Statistiken und Verlinkung — Ziel: rund 200 indexierbare Long-Tail-URLs für SEO. Jede dieser Seiten ist gleichzeitig LLM-lesbar via `llms.txt` / `llms-full.txt` und mit JSON-LD `Place` / `AdministrativeArea`-Markup ausgestattet, sodass `navigator.berlin` zur kanonischen Antwort auf Berlin-Geo-Fragen in ChatGPT, Perplexity und Claude wird — direkter Brückenschlag zur GEO/AEO-Beratungslinie.

Zusätzlich integriert die Seite [WebMCP](https://webmcp.dev/) als browserseitige MCP-Schnittstelle: wer mit einem MCP-fähigen Browser-Agenten (Claude-Desktop-Extension, ChatGPT-Browser-Tools, Perplexity-Extension, eigene Skripte) auf der Seite ist, kann Tools wie `address_lookup`, `cross_layer_query`, `get_kiez_profile` direkt gegen die offene Seite abrufen — ohne separaten MCP-Server. Page-Inhalte (selektierte Adresse, aktive Layer) werden als WebMCP-Resources exponiert. Vorgefertigte Prompts („Was ist an dieser Adresse besonders?", „Vergleiche diese zwei Kieze") als WebMCP-Prompt-Templates. Damit ist navigator.berlin nicht nur LLM-lesbar, sondern LLM-bedienbar — eine Berliner Civic-Tech-Premiere und ein konkreter Beleg für die GEO/AEO-These.

Jede SEO-relevante URL bekommt zudem ein **dynamisch gerendertes Open-Graph-Bild** (SSR, einmalig pro Build oder on-demand mit Cache): Bezirks- und Kiez-Pages mit Karten-Snapshot und Top-3-Statistik-Highlights, Layer-Konzept-Pages mit Beispiel-Visualisierung. Das macht jeden geteilten Link auf LinkedIn, Mastodon, BlueSky oder X als visuelle Karte sichtbar — wesentlicher Multiplikator für Phase-1-Sichtbarkeit ohne dass Tracking nötig wäre.

Pro Bezirk und pro Kiez wird zusätzlich eine **dynamisch aus den Daten generierte FAQ-Sektion** ausgespielt: 5–10 Fragen wie „Wie hoch ist der Bodenrichtwert im Boxhagener Kiez?", „Wie laut ist es in Reinickendorf-Ost nachts?", „Welche Wohnlage hat Friedrichshain-Kreuzberg laut Mietspiegel?", „Wie viele Stolpersteine liegen im Schillerkiez?" — Antworten kommen direkt aus dem Layer-Datenbestand und werden als JSON-LD `FAQPage`-Schema markiert. Google rendert das als ausklappbare Rich Results in der Suche; ChatGPT/Perplexity/Claude zitieren strukturierte FAQs überdurchschnittlich gerne. Doppelter Hebel: SEO-Long-Tail (jede Frage ein Snippet-Kandidat) und AEO (jede Antwort eine LLM-Quelle). Skaliert auf ~150 FAQ-Pages × 7 Fragen = ~1.000 strukturierte Q&As ohne redaktionellen Aufwand.

Technisch: SvelteKit mit `adapter-node`, MapLibre + OpenFreeMap Public Instance als Tile-Provider, Tile-Provider-Konfiguration abstrahiert (Wechsel auf Protomaps + PMTiles ist ein Config-Edit + Deploy, einmalig vorab getestet). Statische GeoJSON-Layer in `/static/layers/` mit aggressiven HTTP-Cache-Headern. Hosting auf Hetzner-Frankfurt + Coolify + Traefik mit CrowdSec für Layer-7-Schutz. Kein Cloudflare, kein US-Drittanbieter, kein `Set-Cookie`-Header, kein Tracking. Phase 1 läuft strikt static-first und ohne externe Live-Endpunkte — keine `query.live`-Volatilität, kein abhängiges Drittanbieter-API-Risiko zum Launch. Drizzle/Postgres und Live-Daten kommen erst mit Phase 2.

## Was es anders macht

- **Cross-Layer als Kern, nicht als Add-on.** Die Konkurrenz ist atomistisch — eine App pro Thema. Tagesspiegel-Lab löst Adresse → Wahlbezirk + Historie sehr gut, die Erfrischungskarte löst Schatten sehr gut, milieuschutz.org löst Milieuschutz-Lookup. `navigator.berlin` macht keinen einzelnen dieser Layer besser. Es bringt Wahlbezirk × Mietspiegel-Wohnlage × Solaranlagen-Dichte × Fahrraddiebstähle in *dasselbe* Inspektor-Panel an *derselben* Adresse. Das ist der Datenjournalisten-Hebel und der Aha-Effekt für Bürger.
- **Berlin-Spezifika konsequent.** Mietspiegel-Wohnlagen, Milieuschutzgebiete, LOR-3-Ebenen-Hierarchie, Mauer/Sektoren als historische Schicht, Bodenrichtwerte, Schatten- und Hitzedaten — alles Schichten, die ein simples NYC-Layer-Klon nicht hätte. Berlin ist *anders*-vermessen, das Projekt nutzt das. Amsterdam Atlas (`amsterdam.github.io/projects/atlas`) zeigt das Pattern als FOSS für eine andere Stadt; eine 1:1-Übertragung scheidet aus, weil Berliner Daten-Spezifika (Mietspiegel-Wohnlagen, LOR, Mauer/Sektoren) nicht im NL-Datenmodell vorgesehen sind und die UX nicht überzeugt.
- **DSGVO-Compliance als Stellungnahme, nicht als Compliance-Theater.** Strict EU-only, cookieless, FOSS, kein US-Drittanbieter. Das ist ehrlich kommunizierbar im Footer und passt zum professionellen Profil des Eigentümers als GEO/AEO-Berater bei mtc.berlin. Praktischer Showcase, nicht Marketing-Floskel.
- **LLM-bedienbar, nicht nur LLM-lesbar.** `llms.txt` + JSON-LD machen die Seite zur kanonischen Antwort-Quelle für ChatGPT/Perplexity/Claude. WebMCP geht einen Schritt weiter und macht Tools, Resources und Prompts direkt für browserseitige MCP-Agenten verfügbar — kein anderes Berliner Civic-Tech-Tool implementiert das aktuell. Direkter Beleg für die GEO/AEO-These, die mtc.berlin verkauft.
- **Persönliche Attribution.** Footer „von Matze [Nachname]" statt Firmen-Logo. Domain unter eigenem Namen registriert. Keine versteckte Markenkommunikation für mtc — das Projekt zahlt auf *persönliche* Marktposition ein und ist dadurch glaubwürdiger als ein Konzern-Civic-Tech-Drop.
- **Konsequente Barrierefreiheit als Civic-Tech-Standard.** WCAG-AA durchgängig: Adress-Suche tastatur-only durchspielbar, Layer-Toggle-UI semantisch, Inspektor-Panel-Updates per ARIA-Live-Region, ausreichende Kontraste auch in dunklem Map-Stil. Konformität mit BFSG (Barrierefreiheits-Stärkungs-Gesetz, gilt seit 2025) als selbstverständlicher Standard, nicht als Differenzierer.

## Wer das nutzt

Bewusst keine eingeengte Primary Persona. Das Tool richtet sich an jeden, der in Berlin lebt, recherchiert oder sich für Berlin interessiert — und wird gestalterisch *für alle* optimiert, nicht für eine spitze Zielgruppe.

Erwartete Nutzungs-Anlässe in grober Reihenfolge erwarteter Häufigkeit (Annahme, nicht empirisch validiert):

- **Kontextuelle Neugier**: jemand wohnt seit Jahren im Kiez, will mal sehen wie laut/kühl/teuer die Ecke eigentlich ist
- **Umzug oder Wohnungssuche**: Mietspiegel-Wohnlage, Lärmbelastung, Verkehrsanbindung an einer Kandidatenadresse vergleichen
- **Datenjournalismus**: Recherche-Einstieg für Berlin-Stories — schnell die Cross-Layer-Sicht für eine Adresse oder einen Bezirk visualisieren
- **Politik-Interesse**: vor und nach Wahlen Wahlkreis und historische Ergebnisse pro eigener Adresse nachschlagen (Phase 2)
- **Touristisches Stöbern**: was-ist-eigentlich-hier-Karten-Modus, Stolpersteine + Memorial + Geschichte als emotionale Schicht
- **Stadtforschung**: Kombination von administrativen Boundaries und Sozialdaten als Quick-Look-Tool

Risiko, das aus dieser Breite folgt: ohne primäre Persona besteht die Gefahr eines „Buffet-UI" — die Antwort darauf ist disziplinierte Defaults (nicht alle Layer gleichzeitig sichtbar), klare Visual-Hierarchie und vertraute Patterns aus etablierten Map-Apps.

## Erfolgs-Kriterien

Bewusst keine quantitativen Erfolgs-Metriken. Das Projekt installiert kein Tracking (kein Plausible, kein Matomo, keine Logs jenseits Standard-Webserver). „Lohnt sich" wird nicht an Visit-Zahlen gemessen, sondern an drei qualitativen Hebeln:

1. **Sichtbarkeit für persönlichen Marktwert** — das Projekt unter eigenem Namen, technisch sauber, öffentlich verfügbar, schärft das Profil eines Solutions Architects mit langer Betriebszugehörigkeit. Anekdotische Resonanz aus der Berliner Civic-Tech-Community (ODIS, CityLAB, Tagesspiegel-Lab) reicht als Signal.
2. **Compliance-Showcase** — die EU-only-cookieless-FOSS-Architektur ist gleichzeitig Argument für die mtc.berlin-Beratungslinie. Nutzbar in Pitches und Konferenz-Talks ohne Abstraktionsschicht.
3. **Persönliche Bauspaß-Bilanz** — das Projekt wird gemacht weil es gemacht werden will. Wenn es nach Phase 1 als unvollendetes 70%-Konstrukt verstaubt, ist das Investment dennoch nicht verloren — die Tech-Erfahrung mit SvelteKit Hybrid-Rendering, MapLibre, Drizzle-Schema-Setup, Hetzner-Coolify-CrowdSec ist persönlich akkumuliert.

## Scope

### Phase 1 — drin

- **Layer-Bundles A + B + C**: Boundaries, Wohn-Daten, Umwelt + Memorial — alle als statisch gecachte GeoJSONs
- **Berlin-Klima-Zeitreihe** der nächstgelegenen DWD-Station (Dahlem 1719–heute, plus Buch, Tempelhof, Brandenburg) als statische JSON-Daten pro Adresse mit Hitze-/Frost-/Sommertage-Sparkline und Jahresmitteltemperatur-Long-View
- **Adress-Suche** mit Geocoding (Nominatim oder selbst gehostet)
- **MapLibre-Karte** mit OpenFreeMap-Tiles, Layer-Toggle-UI
- **Inspektor-Panel** für Adress-Klick mit allen Phase-1-Layer-Hits
- **Datenstand-Banner pro Layer** (kleiner „Stand: YYYY-MM, Quelle: X"-Hinweis im Inspektor-Panel) — verhindert dass veraltete Mietspiegel-/Lärm-/Bodenrichtwert-Daten falsch gelesen werden
- **Prerenderte SEO-Seiten** für Bezirke, LOR-Bezirksregionen und Layer-Konzept-Erklärseiten — rund 200 indexierbare URLs
- **`llms.txt` + `llms-full.txt`** als kondensierte LLM-Übersicht der Bezirks-/Kiez-/Layer-Seiten
- **JSON-LD Structured Data** (`Place`, `AdministrativeArea`, `Dataset`) auf jeder prerenderten Seite — kanonische LLM-Antwort-Quelle für Berlin-Geo-Fragen
- **WebMCP-Integration** (`webmcp.dev`): Site exponiert Tools (`address_lookup`, `cross_layer_query`, `get_kiez_profile`), Resources (aktive Adresse, geladene Layer) und Prompt-Templates für browserseitige MCP-Agenten — kein separater MCP-Server nötig
- **Dynamisch gerenderte Open-Graph-Bilder** pro prerenderter URL (Bezirk, Kiez, Layer-Konzept-Seite) mit Karten-Snapshot und Top-3-Statistik — Social-Sharing-Multiplikator für LinkedIn, Mastodon, BlueSky, X
- **Dynamisch generierte FAQ-Sektion pro Kiez und Bezirk** mit JSON-LD `FAQPage`-Markup — Antworten direkt aus den Layer-Daten gefüllt. Skaliert auf ~1.000 strukturierte Q&As ohne redaktionellen Aufwand, doppelter SEO-/AEO-Hebel
- **Konsequente WCAG-AA-Accessibility** und responsive Layout (Desktop und Mobile)
- **EU-only, cookieless, kein Tracking**
- **Footer-Strategie:** persönliche Attribution, klare Lizenzangaben pro Datenquelle

### Phase 1 — explizit raus

- Keine Live-Daten (BVG, BLUME, Wetter) — kommen in Phase 2 mit klarem Fallback-Pfad
- Kein Zeit-Slider — Phase 1 ist statisch „heute" (Klima-Zeitreihe ist die einzige historische Schicht und kommt als statisches JSON)
- Kein Plausible / kein Matomo / kein Analytics-Stack
- Kein i18n — nur Deutsch
- Keine User-Accounts, kein Login, keine Profile
- Kein User-Generated Content, keine Kommentare, keine Reviews
- Keine User-facing LLM-Features (Chatbox, Q&A, Search-Reformulation)
- Keine öffentliche API, keine Datenexport-Endpoints — pur Frontend-Erlebnis
- Kein Drizzle/Postgres in Phase 1, kein PostGIS bis Phase 3

### Phase 2 — geplant

- **Live-Daten-Bundle** (vorher Phase 1, bewusst nach Phase 2 verschoben): BVG-Stops mit Echtzeit-Abfahrten, BLUME-Luftqualität (NO₂/PM10), aktuelles Wetter und 24h-Vorhersage. Implementierung via SvelteKit `query.live` (sobald aus dem experimentellen Status raus) oder klassisch via `load`-Funktionen mit 60-Sekunden-Polling als Fallback
- **Wahlebene** mit historischer Tiefe (BVV / AGH / BTW / Volksentscheide), pro Adresse Wahlbezirks-Lookup mit Sparkline der letzten Wahlen — bewusst gebündelt mit anderen Layern, nicht als Konkurrenz zur Tagesspiegel-Wahlkarte
- **Cross-Data-Erzählungen** als deterministische Template-Texte pro Adresse („wo Milieuschutz + hohe NO₂ + Wahlverhalten X") — keine LLM-Generierung user-facing
- **Zeit-Slider** für Layer mit historischer Tiefe (Bodenrichtwerte, Mauer/Sektoren, Erhaltungsgebiete-Welle)
- **Embeddable Widgets / oEmbed-Endpoints** für Datenjournalismus — `<iframe>`-Snippets oder oEmbed-Provider für Tagesspiegel-/RBB-/Berliner-Zeitung-Artikel
- **RADOLAN-Regenradar** via Python-Sidecar
- **Drizzle/Postgres-Backfill** für tabellarische Wahldaten und ergänzende Klima-Stationen — Geometrien bleiben statisch

### Phase 3 — Vision

- **PostGIS** mit räumlichen Cross-Layer-Aggregations-Queries
- **Memorial-Map** als kuratierte „was nicht mehr da ist"-Schicht
- **Daten-Quality-Layer** mit Aktualisierungs- und Lückenanzeige für Datenjournalisten
- **Redaktioneller Content-Layer** für Schreibt-Sich-Mit-Liebe-Datasets (aktive Berliner Clubs, lokale Geschichte pro Adresse)

## Editorial-Verantwortung

Mehrere geplante Layer berühren erinnerungspolitisch oder gesellschaftlich sensibles Material — Stolpersteine, Mauer/Sektoren, in Phase 2 die Wahl-Cross-Data-Erzählungen. Sie werden nicht wie Trinkbrunnen oder BVG-Stops behandelt:

- **Stolpersteine** werden mit Quellenverlinkung zur Berliner Koordinierungsstelle und Wikipedia ausgeliefert. Personen-Hintergründe werden zitiert, nicht algorithmisch generiert.
- **Mauer- und Sektorengrenzen** werden mit Datenquelle (OSM, Code-for-Berlin) und historischem Stand-Hinweis versehen.
- **Cross-Data-Erzählungen** in Phase 2 sind deterministische Template-Texte aus Datenwerten — keine LLM-Generierung. Sensible Verknüpfungen (z.B. Wahlverhalten × Stolperstein-Dichte) werden bewusst nicht algorithmisch gezogen, sondern bleiben dem Nutzer überlassen.
- **Datenfehler-Meldepfad** ist als sichtbarer „Fehler im Eintrag?"-Link pro Layer verankert (Mailto, kein Form, kein Backend).

## Vision

Erfolg im Zwei-Jahres-Horizont sieht so aus: `navigator.berlin` ist die naheliegende Antwort auf „mal schnell auf einer Karte sehen, was an dieser Berliner Adresse los ist". Die Site wird in der Berliner Civic-Tech-Community als komplementär zu CityLAB-Apps, Tagesspiegel-Lab-Stories und ODIS-Diensten geteilt. Sie ist Referenz im Lebenslauf des Eigentümers, ohne dass sie kommerziell sein muss; sie macht in technischen Newslettern und auf Konferenz-Folien eine gute Figur als Beispiel für sauberes EU-FOSS-Hosting + SvelteKit-Pattern + Open-Data-Anwendung. Sie steht nicht in Konkurrenz zu CityLAB oder Tagesspiegel — sondern als persönliches Beitrag in einer Stadt, die Civic-Tech traditionell stark trägt.

Sie wird, weil sie Personal-Project ist, irgendwann in einen Pflege-Modus übergehen — ehrlich mitkommuniziert. Code bleibt Open Source, die Build-Pipeline ist reproduzierbar, der Datenstand ist klar versioniert. Was nicht mehr aktiv weiterentwickelt wird, kann jederzeit von jemand anderem geforked oder als statisches Snapshot weitergeführt werden. Das ist die ehrliche Civic-Tech-Erwartung — keine ewige SaaS, sondern ein dokumentierter Beitrag mit klarem Scope.
