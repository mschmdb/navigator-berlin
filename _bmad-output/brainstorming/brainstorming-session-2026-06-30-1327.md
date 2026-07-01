---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'Hitze-/Kühle-Orte-Feature für navigator.berlin, das Berlins basale Liste schlägt'
session_goals: 'Open-Data-Quellen identifizieren + divergente Ideen sammeln (welche Orte rein, wie das Öffnungszeiten-Problem lösen, eigene Kuratierung)'
selected_approach: 'AI-Recommended Progressive Flow'
techniques_used: ['Domain-Pivot-Divergenz', 'Orthogonale Kategorisierung']
ideas_generated: []
context_file: ''
date: '2026-06-30'
---

## Session Overview

**Topic:** Hitze-/Kühle-Orte-Feature für navigator.berlin
**Goals:** Datenquellen finden, Orte-Typen sammeln, das "selten offen, immer angezeigt"-Problem lösen, eigene Kuratierung gegen Berlins dünne Liste

### Auslöser

Hitzewelle Europa/Berlin Ende Juni 2026. Berlins Online-Hitzeangebot ist dünn: ~80 kuratierte Orte, ganze Bezirke leer, teils unsinnige Einträge (stinkende Toiletten, Chlorbrunnen). NYC-Benchmark zeigt Echtzeit-Routing zum nächsten offenen Cooling Center plus Heat Vulnerability Index.

---

## Datenquellen-Recherche (Open Data)

| Quelle | Was | Zugang | Eignung |
|--------|-----|--------|---------|
| daten.berlin.de | Trinkbrunnen BWB (~238), per Bezirk, Saison Mai–Okt, Rollstuhl-Flag | CKAN-API, DCAT-AP, WFS/WMS | Direkt nutzbar |
| OpenStreetMap / Overpass | Kinos, Malls, Möbelhäuser, Museen, Kirchen, Bibliotheken, Hallenbäder | Overpass-API | Hauptquelle für kühle Orte |
| OSM opening_hours | Öffnungszeiten-Tags | Overpass + opening_hours.js parsen | Löst "selten offen"-Problem |
| OSM air_conditioning=yes | AC-Kennzeichnung | Overpass | Selten getaggt → eigene Kuratierung nötig |
| Berliner Bäder-Betriebe | Hallen-/Freibäder | Web/Open Data | Saison + Öffnungszeiten |
| FIS-Broker / Umweltatlas | Verschattung, Versiegelung, Baumkataster | WFS (Geoportal, Auslauf Mitte 2025) | Für Kühle-Score + Vulnerabilität |
| Badegewässer Berlin | Badeseen, Strandbäder | Open Data | Wasser-Layer |
| navigator.berlin eigene | Kiez-Demografie, Versiegelung, Scores | intern | Hitze-Vulnerabilitäts-Layer |

**Kernerkenntnis:** Berlins Liste ist dünn, weil sie ~80 Orte per Hand kuratiert, statt den OSM-Layer maschinell zu nutzen. AC-Info fehlt fast überall → eigene Kuratierung ist der Wettbewerbsvorteil.

---

## Ideen: Kühle-Orte-Typen

### Klimatisiert & kommerziell (umsonst reingehen)
- Shoppingcenter: Alexa, Mall of Berlin, Gropius Passagen, East Side Mall, Schultheiss-Quartier
- Kinos (fast alle AC): Yorck-Gruppe, CineStar, UCI
- Möbelhäuser: IKEA, Höffner, XXXLutz — riesig, kühl, oft Gratis-Wasser
- Große Buchläden: Dussmann, Thalia
- Kaufhäuser: KaDeWe, Galeria
- Museen (klimatisiert wegen Exponaten)
- Sea Life / Aquarium

### Richtig kalt, nicht nur kühl
- Eishallen: Erika-Heß, Lankwitz (Minusgrade im Hochsommer)
- Hallenbäder der Berliner Bäder
- Tiefgaragen, Parkhaus-Unterebenen
- Markthallen, Großmarkthalle
- Weinkeller- / Brauereikeller-Lokale

### Massivbau, kühlt physikalisch
- Kirchen, Moscheen, Synagogen (dicke Mauern)
- Bibliotheken: ZLB, Stadtteilbüchereien
- Bürgerämter, Amts-Wartebereiche
- Uni-Foyers und Mensen

### Wasser statt nur Schatten
- Spielplätze mit Wasserspielen, Matschanlagen, Fontänen
- Freibäder, Strandbäder, Badeseen (Schlachtensee, Müggelsee, Weißensee)
- Springbrunnen zum Reinstehen
- BVG-Fähre F10, Spree-Fahrtwind

### Black Swan / ungewöhnlich
- Kühle U-Bahnhöfe, differenziert (manche sind Backöfen)
- Krankenhaus- und Hotel-Foyers
- BER-Terminal nachts
- Wald statt Park: Grunewald, Tegeler Forst (echter Kühleffekt)

---

## Ideen: Das "Öffnungszeiten"-Problem (Kern-Differenzierer)

- Pflichtfeld Öffnungszeiten + Live-Filter "jetzt offen"
- Ampel-Status: grün = jetzt offen & kühl, gelb = schließt bald, rot = zu
- Zeitachsen-Slider: "Wohin kann ich um 22 Uhr?"
- Nacht-Layer: Tropennacht-Hilfe (24h-Orte, Bahnhöfe, BER)
- Saison-Logik: Trinkbrunnen Mai–Okt, Freibäder nur in Saison auto-ausblenden
- Auslastung: überfüllt = nicht mehr kühl (Popular Times / Crowdsourcing)
- Konsumzwang-Flag: Mall umsonst vs Café kostet — ehrlich kennzeichnen

---

## Ideen: Was nur navigator.berlin kann

- Hitze-Vulnerabilitäts-Layer pro Kiez (eigene Demografie- + Versiegelungs-Daten, NYC-HVI-Stil)
- Routing zum nächsten jetzt-offenen kühlen Ort (nicht nur Liste)
- Kühle-Score je Ort: AC + Massivbau + Wassernähe + Verschattung, gewichtet
- Crowdsourcing: "war heute kühl / voll / zu" — löst Datenqualitäts-Problem des Senats
- Cool Walk: schattige Route von A nach B
- Filter: mit Kind, mit Hund, Rollstuhl, kostenlos
- Push bei DWD-Hitzewarnung mit nächstem Ort

---

---

## Datenvalidierung (Overpass live, 2026-06-30)

| Orte-Typ | Gesamt | mit Öffnungszeiten | Quote |
|----------|-------:|-------------------:|------:|
| Museen | 247 | 202 | 82% |
| Bibliotheken | 154 | 125 | 81% |
| Malls/Center | 106 | 66 | 62% |
| Kinos | 89 | 41 | 46% |
| Sakralbauten | 747 | 44 | 6% |
| Trinkbrunnen | 266 | Saison via daten.berlin | — |
| Hallen-/Freibäder | 270 | — | — |
| Möbelhäuser | 259 | — | — |

**Verdikt:** >1.000 maschinell ziehbare Orte vs Berlins ~80 Handarbeit. Basis trägt MVP.

## Deadline & Ziel
- Nächste Hitzewelle: ab Mitte KW nächste Woche (~07.07.2026)
- Ziel: eigener Kühle-Orte-Layer + Standalone-Landing-Page zur Medien-Verteilung

## MVP-Schnitt (lieferbar bis ~Mitte nächster Woche)
**Drin:** OSM-Pull + Trinkbrunnen-Layer · opening_hours.js "jetzt offen" + Ampel · Kühle-Score v0 (Eishalle 5/Mall-Kino-Schwimmhalle 4/Biblio-Museum-Kirche 3/Trinkbrunnen 2/Schatten 1) · Saison-Logik · Landing Page mit DWD-Banner + Presse-Zahlen
**Phase 2:** Crowdsourcing · Routing/Cool Walk · Push · Auslastung · voller Vulnerabilitäts-Layer

## Risiken (vor Bau)
- Öffnungszeiten lückenhaft (Kinos 46%) → Fallback "unbekannt"
- Sakralbauten 747, nur 44 mit Zeiten → kuratieren, nicht dumpen
- AC fehlt in OSM → kleine redaktionelle Liste, ehrlich labeln
- Hausrecht Malls/Kinos → Landing-Copy "kein Rechtsanspruch"

## Medien-Hook
"Berlin listet 80 Orte. Dieser Open-Data-Layer zeigt über 1.000, mit Live-Öffnungszeiten." Getimt auf Hitzewelle. Optional: Kiez-Vulnerabilitäts-Teaser.

## Offene Threads (für nächste Runde)
- Welcher Scope für MVP? (nur Karte+Öffnungszeiten vs voller Vulnerabilitäts-Layer)
- Crowdsourcing-Moderation vs Spam
- Rechtliches: Hausrecht von Malls/Kinos, dürfen wir sie als "kühlen Ort" listen?
- Datenpflege: wie AC-Status aktuell halten ohne Senats-Personal
