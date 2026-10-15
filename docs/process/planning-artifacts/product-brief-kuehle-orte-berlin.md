# Product Brief: Kühle Orte Berlin

**Status:** Draft v2 · **Datum:** 2026-06-30 · **Autor:** Mary (BA) mit Matze
**Termin:** Live vor der nächsten Hitzewelle, ab ~07.07.2026
**Übergeordnetes Produkt:** navigator.berlin

---

## Executive Summary

Bei 38 Grad braucht ein Mensch eine schnelle, ehrliche Antwort: Wohin jetzt, um runterzukühlen? navigator.berlin macht dazu ein Angebot. Ein Kühle-Orte-Layer zieht über 1.000 Orte aus OpenStreetMap und Berlins Open Data: Kinos, Malls, Bibliotheken, Museen, Hallenbäder, Trinkbrunnen. Jeder Ort zeigt, ob er jetzt offen ist, wie kühl er wirklich ist, die exakte Adresse und einen Navi-Link zu Google und Apple Maps.

Das ist kein Konkurrenzprodukt zur Stadt und kein Anspruch, es besser zu machen. Es ist ein modernes, hilfreiches Angebot auf guter Datenbasis: zeigen, welche Möglichkeiten es gibt, und Menschen bei Hitze schnell weiterhelfen. NYC zeigt mit seiner Extreme-Heat-Seite, wie nutzerfreundlich so etwas sein kann. Eine eigene Landing Page in dem Geist macht das zugänglich, getimt auf die nächste Hitzewelle.

## Das Problem

Bei Hitze hilft kein PDF, sondern eine Antwort in den nächsten zehn Minuten: Wohin?

- Wer keine kühle Wohnung hat, sucht spontan: Mall, Kino, U-Bahn, Bibliothek. Dieses Wissen ist verstreut, nicht auf einer Karte
- Statische Listen sagen nicht, ob ein Ort gerade offen ist
- Niemand liefert Adresse plus Navi-Link in einem Tap
- Verletzliche Gruppen, Alte, Familien mit Kleinkindern, brauchen passende Filter und ehrliche Angaben

Wir füllen diese Lücke mit einem freundlichen, modernen Werkzeug.

## Die Lösung

Ein Kartenlayer in navigator.berlin plus eigenständige, nutzerorientierte Landing Page im Geist der NYC-Seite.

**Auf der Karte:** alle kühlen Orte, filterbar nach „jetzt offen", mit Ampel-Status und ehrlichem Kühle-Score.

**Im Tooltip jedes Orts:**
- Name und Typ (Kino, Bibliothek, Hallenbad, Trinkbrunnen …)
- Exakte Adresse zum Lesen und Kopieren
- Navi-Links: ein Tap öffnet Google Maps oder Apple Maps mit Route
- Öffnungszeiten plus Live-Status: jetzt offen, schließt bald, zu
- Kühle-Score und warum: klimatisiert, Massivbau, am Wasser, verschattet
- Ehrliche Flags: kostenlos vs Konsum, barrierefrei ja/nein, „klimatisiert, redaktionell geprüft"
- Teilen-Link direkt auf den Ort
- **„Gibt's nicht mehr / stimmt nicht"-Melde-Link** pro Ort, hält die Daten ehrlich

**Auf der Landing Page:**
- DWD-Hitzewarn-Banner, live
- Die Karte, eingebettet, mobil zuerst
- „In deiner Nähe": Geolocation zeigt die nächsten offenen Orte
- Klare, freundliche Erklärung: ein Angebot, kein Behörden-Ersatz
- **Mail-Link für Institutionen**, die nicht gelistet werden wollen: ein Klick, austragen
- Transparenz-Hinweis: Datenquellen offen genannt

## Was das Angebot bietet

Statt Vergleich mit der Stadt: das ist die Liste dessen, was wir liefern.

- Über 1.000 Orte aus offenen Daten, statt einer kurzen Handliste
- Live-Öffnungszeiten und „jetzt offen"-Filter
- Exakte Adresse, immer, kopierbar
- Ein-Tap-Navigation zu Google und Apple Maps
- Ehrlicher, transparent gewichteter Kühle-Score
- Konsumzwang ehrlich gekennzeichnet
- Barrierefreiheit pro Ort
- „In deiner Nähe" per Geolocation
- Melde- und Austrag-Mechanik für saubere, faire Daten

Der unfaire Vorteil ist Ausführung, nicht Technik: navigator.berlin hat Karten-Infrastruktur und Kiez-Daten schon. Wir verschneiden vorhandene Bausteine mit Open Data und kuratieren die Spitze redaktionell.

## Wen das bedient

- **Hitze-Betroffene jetzt:** schnelle, ehrliche Antwort. Erfolg: in unter einer Minute zum nächsten offenen kühlen Ort
- **Verletzliche Gruppen:** Filter für Rollstuhl, mit Kind, kostenlos
- **Institutionen:** faire Behandlung, einfacher Opt-out per Mail
- **navigator.berlin selbst:** Profil als hilfsbereiter, offener Daten-Akteur

## Vorgehen (Reihenfolge)

1. **Daten sammeln zuerst.** Rohdaten aus Overpass und daten.berlin ziehen, dann den redaktionellen Subagent-Schwarm konzipieren und laufen lassen. Ergebnis: ein sauberes, angereichertes Datenset
2. **Layer bauen** auf dem fertigen Datenset
3. **Landing Page bauen**, nutzerorientiert nach NYC-Vorbild

## Redaktionelle Recherche als Subagent-Fan-out

Die Datenqualität ist der Kern, und sie ist Fließarbeit. Sie läuft als paralleler Subagent-Schwarm auf der Subscription, gründlich, nicht token-sparsam. Fokus auf benannte, recherchierbare Orte (Malls, Kinos, Eishallen, Kaufhäuser, Hallenbäder). Trinkbrunnen und Standard-Kategorien laufen deterministisch über Regeln.

Aufgaben pro Orte-Batch:
- **AC-Verifikation:** wirklich klimatisiert? Quelle prüfen, Flag setzen
- **Öffnungszeiten-Lücken füllen** aus offiziellen Quellen (OSM lückenhaft, Kinos nur 46%)
- **Qualitäts-Check:** ungeeignete Einträge aussortieren
- **Kühle-Score verfeinern:** Bauart, Verschattung, Wassernähe
- **Adress- und Navi-Validierung:** Deep-Links stichprobenhaft testen

Jeder Subagent bekommt einen Batch, gibt strukturiertes JSON zurück. Adversariale Verifikation: ein zweiter Agent prüft jede AC-Behauptung, bevor sie ins Live-Datenset geht.

## Erfolgskriterien

- **Termin gehalten:** Layer und Landing Page live vor der Hitzewelle ~07.07.2026
- **Abdeckung:** >1.000 Orte, alle mit Adresse und Navi-Link, Mehrheit mit Öffnungszeiten
- **Ehrlichkeit:** kein Datenmüll, jeder gelistete Ort ist real geeignet
- **Nutzung:** messbare Klicks auf Navi-Links als Beleg, dass Leute hingehen
- **Fairness:** Opt-out und Melde-Mechanik funktionieren ab Tag eins

## Scope

**Drin (MVP, bis ~07.07.):**
- OSM-Overpass-Pull + daten.berlin-Trinkbrunnen, angereichert per Schwarm
- `opening_hours.js`-Parsing: „jetzt offen", Ampel, Saison-Logik
- Tooltip mit Adresse, Google/Apple-Navi, Kühle-Score, Flags, Melde-Link
- Kühle-Score v0, kategoriebasiert und transparent
- Landing Page: DWD-Banner, Karte, Geolocation, Opt-out-Mail, Transparenz
- Redaktionell geprüfte AC-Kennzeichnung für die benannten Top-Orte

**Bewusst raus (Phase 2):**
- Crowdsourcing „war heute kühl/voll/zu"
- Routing / Cool Walk
- Push bei Hitzewarnung
- Auslastungs-Daten
- Voller Kiez-Hitze-Vulnerabilitäts-Layer (Teaser möglich)

## Risiken

- **Öffnungszeiten lückenhaft** (Kinos 46%) → Fallback „Zeiten unbekannt", Ort bleibt sichtbar
- **Sakralbauten:** 747 in OSM, nur 44 mit Zeiten → kuratieren, nicht dumpen
- **AC fehlt in OSM** → redaktioneller Schwarm für benannte Orte
- **Hausrecht** Malls/Kinos → Copy „öffentlich zugänglich, kein Rechtsanspruch", plus Opt-out
- **Datenfrische** → Refresh-Skript, OSM-Snapshot datieren, Melde-Link als Korrektiv

## Vision

Aus dem Hitze-Layer wird das freundliche Stadt-Cockpit für Extremwetter. Heute kühle Orte, morgen schattige Routen, Tropennacht-Hilfe, optional ein Kiez-Risiko-Teaser. navigator.berlin bleibt dabei Angebot und Helfer, nicht Konkurrent.

---

## Daten-Anhang (Overpass live, 2026-06-30)

| Orte-Typ | Gesamt | mit Öffnungszeiten |
|---|---:|---:|
| Museen | 247 | 202 |
| Bibliotheken | 154 | 125 |
| Malls/Center | 106 | 66 |
| Kinos | 89 | 41 |
| Sakralbauten | 747 | 44 |
| Trinkbrunnen | 266 | Saison via daten.berlin |
| Hallen-/Freibäder | 270 | — |
| Möbelhäuser | 259 | — |

**Quellen:** [berlin.de/hitzeschutz](https://www.berlin.de/hitzeschutz/) · [daten.berlin.de Trinkbrunnen](https://daten.berlin.de/datensaetze?tags=Trinkbrunnen) · OpenStreetMap Overpass · NYC-Vorbild [nyc.gov Extreme Heat](https://www.nyc.gov/site/em/ready/extreme-heat.page)
