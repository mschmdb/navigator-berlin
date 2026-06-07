---
title_de: "Versorgung zählt jetzt Supermarkt, Apotheke und Post"
summary_de: "Der Versorgungs-Score misst neben Kita, Schule und Klinik jetzt die Nahversorgung im Kiez: Lebensmittel, Apotheke und Post aus OpenStreetMap."
date: 2026-06-07
category: feature
tags: [kiez-score, versorgung, nahversorgung, score, osm]
---

Die Versorgungs-Dimension des Umwelt- & Infrastruktur-Scores deckte bisher nur öffentliche Daseinsvorsorge ab: Kita, Schule, Krankenhaus, Spielplatz. Der häufigste Weg im Alltag fehlte: der Einkauf. Ab jetzt zählt auch die private Nahversorgung mit.

## Was neu zählt

Drei neue Terme fließen in die Versorgung ein, jeder als Dichte im Umkreis (Anzahl Geschäfte in Gehweite, nicht nur das nächste):

- **Lebensmittel** (Gewicht 0.12, 500 m): Supermarkt, Discounter, Spätkauf und Bäcker.
- **Apotheke** (0.07, 800 m).
- **Post- oder Paketstelle** (0.05, 1.000 m).

Die Standorte kommen aus OpenStreetMap (ODbL). Liegt nichts im Umkreis, greift ein weicher Übergang über die Distanz zur nächsten Einrichtung statt eines harten Abbruchs.

## Warum

Versorgung beschreibt jetzt den ganzen Alltag, öffentlich und privat. Ein Kiez mit Supermarkt, Apotheke und Post um die Ecke deckt den täglichen Bedarf kürzer ab. Das ist ein eigenständiger Faktor der Wohnqualität, unabhängig von der Nähe zur nächsten Kita oder Klinik.

## Was sich nicht ändert

Der Score bleibt bei fünf Dimensionen, jede zu 20 Prozent. Nur die interne Aufteilung der Versorgung wurde neu gewichtet, damit die Nahversorgung Platz bekommt. Wirtschaftliche Größen wie Bodenwerte oder Firmendichte fließen bewusst nicht ein: ein Kiez ist nicht „besser", weil dort mehr Kapital steckt.

## Methodik

Alle Terme, Gewichte und die Datenquellen: [`/methodik/kiez-score`](/methodik/kiez-score).
