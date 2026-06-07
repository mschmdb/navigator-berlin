---
title_de: "Kultur-Score: Bibliothek, Theater, Museum in Reichweite"
summary_de: "Eine eigenständige sechste Dimension misst Kulturorte im Umkreis aus OpenStreetMap. Sie zählt nicht in den Gesamt-Score, weil Kultur innenstadt-lastig ist."
date: 2026-06-07
category: feature
tags: [kiez-score, kultur, score, osm, dimension]
---

Der Kiez-Score hat eine sechste Dimension: Kultur. Sie misst, wie viele Kulturorte in Reichweite liegen.

## Bibliothek bis Club

Gezählt wird die Dichte im Umkreis. Der erste Ort zählt stark, weitere flachen ab:

- Bibliotheken, Theater und Bühnen, Museen, Kinos.
- Galerien, soziokulturelle Zentren, Kunst im Stadtraum, Clubs.

Die Standorte kommen aus OpenStreetMap (ODbL). Stolpersteine und Denkmale zählen bewusst nicht, das sind Gedenkorte, keine Kultur-Adressen.

## Eigene Dimension, nicht im Gesamt-Score

Kultur steht für sich und fließt nicht in den Umwelt- & Infrastruktur-Score ein. Grund: Kulturinfrastruktur konzentriert sich stark in der Innenstadt. Im Gesamt-Score würde sie jeden Außenbezirk nach unten ziehen. Ein niedriger Kultur-Wert heißt nur „weniger Kulturorte um die Ecke", keine Wertung des Kiezes.

## Auf der Karte

Neuer Layer „Kiez-Score · Kultur" pro Planungsraum, dazu die einzelnen Kulturorte als Punkte. Im Inspektor erscheint Kultur als sechster Ring neben den fünf Score-Dimensionen.

## Methodik

Gewichte, Dämpfung und Datenquellen stehen unter [`/methodik/kiez-score`](/methodik/kiez-score).
