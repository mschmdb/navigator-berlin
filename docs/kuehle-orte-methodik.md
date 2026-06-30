---
title: Kühle Orte, Methodik und Datenherkunft
status: aktiv
epic: 15
---

# Kühle Orte: Methodik und Datenherkunft

Der Layer `kuehle-orte` ist ein Angebot, kein Behörden-Ersatz. Er zeigt Orte in Berlin, an denen Menschen bei Hitze Abkühlung finden. Die Daten stammen aus zwei getrennten Quellen mit getrennten Lizenzen.

## Datensatz A: Geometrie und Basis-Tags (OpenStreetMap)

- **Quelle:** OpenStreetMap, abgerufen über die Overpass-API.
- **Lizenz:** ODbL 1.0. Attribution: `https://www.openstreetmap.org/copyright`.
- **Inhalt:** Standort (Punkt-Koordinaten), Name, Typ, Adresse, Öffnungszeiten-Tag, Rollstuhl-Tag, Website.
- **Verarbeitung:** Geometrie und OSM-Tags fließen unverändert in den Layer. Das MANIFEST-Feld `license` trägt `ODbL 1.0` für diesen Anteil.

## Datensatz B: Redaktionelle Anreicherung (navigator.berlin)

- **Quelle:** Eigene redaktionelle Recherche von navigator.berlin, gestützt auf öffentlich zugängliche Web-Quellen.
- **Status:** Redaktionell erhoben. Keine fremde Lizenz, kein amtlicher Datensatz. Eigenständiger Datensatz neben der OSM-Basis.
- **Inhalt je Ort:** Eignung als kühler Ort (`suitable`), Kühle-Score (1 bis 5), Klimatisierungs-Status (`ac_status`, nur wenn belegt), Zugang (kostenlos, Ticket, Konsum), Sommer-Verfügbarkeit (`summer_available`), verifizierte Adresse, Hinweise.
- **Ehrlichkeit:** Wo eine Aussage nicht belegbar war, steht `unknown`. Klimatisierung wird nur als gesichert markiert, wenn eine Quelle sie stützt.

## Trennung der Datensätze

Das MANIFEST kennt nur ein einzelnes `license`-Feld. Es bezieht sich ausschließlich auf den OSM-Anteil (Datensatz A). Die redaktionelle Anreicherung (Datensatz B) wird nicht in das ODbL-Feld vermischt. Im Atlas ist der Layer mit `disclaimerVariants: ['source']` gekennzeichnet.

## Was dieser Layer nicht ist

- Keine amtliche Liste, kein Anspruch auf Vollständigkeit.
- Kein Rechtsanspruch auf Zugang. Malls, Kinos und ähnliche Orte sind privat und üben Hausrecht aus.
- Kein Ersatz für die Hitze-Hinweise der Stadt Berlin, sondern eine ergänzende Hilfe.

## Trinkbrunnen

Trinkbrunnen sind ein eigener Layer (`trinkbrunnen`, BWB-Daten, eigener Saison-Disclaimer). Sie werden im `kuehle-orte`-Datensatz nicht dupliziert.

## Kühle-Score und Sommer-Verfügbarkeit

Die genaue Rubrik des Kühle-Scores und die Logik der Sommer-Verfügbarkeit beschreibt Story 15.6 (Methodik-Erweiterung). Kurzfassung: Eishalle 5, Mall/Kino/Schwimmhalle/Kaufhaus 4, Museum/Bibliothek 3, sonst niedriger. Orte mit Sommerpause oder Winter-Betrieb werden als im Sommer nicht nutzbar gekennzeichnet.
