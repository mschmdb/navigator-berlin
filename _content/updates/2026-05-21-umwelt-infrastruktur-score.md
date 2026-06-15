---
title_de: 'Umwelt- & Infrastruktur-Score: neu zusammengesetzt'
summary_de: 'Fünf gleich gewichtete Dimensionen, ein Gesamt-Layer auf der Karte und ein neu gebauter Inspektor mit klickbarem Score-Ring.'
date: 2026-05-21
category: feature
tags: [kiez-score, umwelt-infrastruktur-score, inspektor, karte, score]
---

Der Cross-Layer-Score heißt jetzt Umwelt- & Infrastruktur-Score. Er bündelt fünf Dimensionen pro Planungsraum, jede mit 20 Prozent Gewicht. Die Seite liegt unter [`/umwelt-infrastruktur-score`](/umwelt-infrastruktur-score). Alte Links leiten per 301 dorthin weiter.

## Die fünf Dimensionen

- **Ruhe & Luft**: Lärm- und Luftbelastung aus dem Umweltatlas.
- **Grün & Hitze**: Grünversorgung und thermische Belastung.
- **Mobilität**: Nähe zu U-Bahn, S-Bahn, Tram, Bus und Radnetz.
- **Versorgung**: Distanz zu Kita, Schule, Krankenhaus, Spielplatz und Grünanlage.
- **Wohnschutz**: Lage in einem Milieuschutzgebiet.

Jede Dimension bleibt einzeln abrufbar. Im Inspektor klappt sie zu ihren Quell-Layern auf, mit normalisiertem Wert und Gewicht pro Quelle.

## Gesamt-Score auf der Karte

Neu: Der Gesamt-Wert liegt als eigener Karten-Layer vor. „Kiez-Score · Gesamt" färbt alle 542 Planungsräume nach dem Mittel der fünf Dimensionen. So sieht man auf einen Blick, wo Umwelt und Infrastruktur zusammen stark oder schwach sind, ohne erst eine Adresse zu suchen.

## Inspektor neu gebaut

Der Adress-Inspektor wurde von Grund auf überarbeitet. Der Score sitzt jetzt als Aktivitäts-Ring oben im Block: ein Ring pro Dimension, die Gesamt-Zahl in der Mitte. Ein Klick auf einen Ring oder eine Zeile öffnet die Quell-Layer darunter.

Die einzelnen Daten-Layer rendern als kompakte Karten statt langer Zeilen. Einrichtungen wie Kita, Schule oder Krankenhaus zeigen Name und Adresse, dazu Karten-Schalter und einen Link auf die Layer-Details. Auch die Klima-Sektion der DWD-Station folgt jetzt diesem Karten-Stil.

## Nicht im Score

Soziale Lage (Monitoring Soziale Stadtentwicklung) und Umweltgerechtigkeit zählen nicht mehr in die Score-Zahl. Beide bleiben als Kontext im Inspektor sichtbar, fließen aber nicht in die Gewichtung. Grund: Der Score misst nur Größen mit eindeutiger Besser-Richtung. Sozialstruktur und Bezahlbarkeit lassen sich nicht ohne Wertung in eine Richtung kippen.

## Methodik

Dimensionen, Normalisierung, Gewichte und die Farbskala der Karte: [`/methodik/kiez-score`](/methodik/kiez-score).
