---
title_de: "Wahldaten seit 2011"
summary_de: "Vier Bundestags-, vier Abgeordnetenhaus- und vier BVV-Wahlen. Pro Adresse die stärkste Partei, pro Stimmbezirk eine Karte, pro Kiez der Verlauf über die Jahre."
date: 2026-05-19
category: feature
tags: [wahlen, daten, btw, agh, bvv]
---

Zwölf Wahlen liegen jetzt vor: Bundestag (2013, 2017, 2021, 2025), Abgeordnetenhaus (2011, 2016, 2021, 2023) und Bezirksverordneten-Versammlung (2011, 2016, 2021, 2023). Die Wiederholungswahlen vom Februar 2023 verweisen jeweils auf die ungültig erklärte September-2021-Wahl.

Quellen: Bundestagswahlen von der Bundeswahlleiterin, AGH und BVV vom Amt für Statistik Berlin-Brandenburg. Beide unter Datenlizenz Deutschland 2.0.

## Im Adress-Inspector

Suche eine Adresse, scrolle zum Block „Wahlverhalten hier". Umschaltbar zwischen Stimmbezirk, Kiez (Planungsraum), Bezirk und Berlin gesamt. Pro Partei steht daneben die Abweichung zur nächsthöheren Ebene, darunter eine kleine Linie mit dem Verlauf über die letzten Wahlen.

## Pro Wahl eine Seite

Unter [`/wahl`](/wahl) listet jede der 20 Wahl-Varianten (Erst- und Zweitstimme zählen einzeln). Pro Seite: Balken Berlin gesamt mit Top-5, Top-3 pro Bezirk und eine Karte mit allen 3500 Stimmbezirken, eingefärbt nach stärkster Partei.

## Pro Kiez der Verlauf

Auf jeder der 143 Kiez-Seiten taucht der Block „Wahl-Verlauf hier" auf. Pro Wahltyp eine Reihe Karten: 2017 → CDU, 2021 → CDU, 2025 → CDU. Daten kommen aus dem Kiez-Aggregat, das pro Planungsraum die Stimmen der enthaltenen Stimmbezirke zusammenfasst.

## Was bei pre-2021-Wahlen fehlt

Briefstimmen wurden bis 2017 (BTW) und 2016 (AGH, BVV) nur als getrennte Brief-Wahlbezirke gezählt, ohne räumliche Zuordnung. Auf Stimmbezirks-Ebene fehlen sie deshalb in dem Zeitraum. Karte und Inspector markieren das mit einem schraffierten Streifen am Balken plus einem „Ohne Briefstimmen"-Badge, der zur Methodik linkt. Bezirks- und Berlin-Werte enthalten die Briefstimmen vollständig.

Für BTW 2013 und AGH/BVV 2011 fehlen außerdem die Stimmbezirks-Polygone. Diese drei Wahlen haben keine Karte, nur Bezirks- und Berlin-Aggregat.

## Für LLM-Agenten

Vier neue Tools im WebMCP-Manifest: Wahlen auflisten, Ergebnis an einer Adresse abfragen, mehrere Wahlen am selben Ort vergleichen, Stimmbezirks-Polygon zu einer Distrikt-ID liefern. Ein Claude- oder ChatGPT-Plugin antwortet damit auf „Wie hat Friedrichshain bei der BTW 2025 gewählt?" mit Zahl, Quelle und Lizenz, statt HTML zu scrapen. Manifest: [`/webmcp-manifest.json`](/webmcp-manifest.json).

## Methodik und Rückfragen

Datenquellen, Aggregations-Logik, Briefwahl-Behandlung und Coverage-Lücken: [`/methodik/wahldaten`](/methodik/wahldaten). Rückmeldung: [hey@navigator.berlin](mailto:hey@navigator.berlin).
