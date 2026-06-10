---
title_de: "Erfasste Kriminalität: neue Kontext-Dimension"
summary_de: "Der Kiez-Score zeigt jetzt die polizeilich erfasste Kriminalität pro Bezirksregion als eigenständigen Kontext. Sie ist kein Sicherheits-Urteil und zählt nicht in den Gesamt-Score."
date: 2026-06-10
category: feature
tags: [kiez-score, kriminalitaet, score, dimension, kontext]
---

Der Kiez-Score hat eine neue Kontext-Dimension: erfasste Kriminalität. Datenquelle ist der [Kriminalitätsatlas Berlin](https://www.kriminalitaetsatlas.berlin.de/) der Polizei Berlin (dl-de-by-2.0).

## Was gezeigt wird

Die Häufigkeitszahl, also Fälle pro 100.000 Einwohner, für ausgewählte wohn-relevante Delikte: Kieztaten, Wohnraumeinbruch, Sachbeschädigung, Straßenraub und Fahrraddiebstahl. „Kieztaten" ist dabei eine Sammelkategorie der Polizei Berlin für Delikte mit engem Bezug zum Wohngebiet. Pro Delikt bilden wir das Mittel der letzten drei Jahre, das dämpft Ausreißer einzelner Jahre.

Im Inspektor lässt sich die Dimension nach Delikt-Art aufklappen. Auf der Karte gibt es einen eigenen Layer in Indigo.

## Was die Zahl nicht ist

Die Häufigkeitszahl misst erfasste Fälle pro gemeldete Einwohner. Daraus folgen klare Grenzen:

- **Kein persönliches Risiko.** Die Zahl beschreibt Inzidenz pro Einwohner, keine Wahrscheinlichkeit für eine einzelne Person.
- **Touristen und Pendler verzerren.** Innenstadt-Orte wie Regierungsviertel oder Alexanderplatz haben wenige gemeldete Einwohner, aber viel Durchgangsverkehr. Ihre Häufigkeitszahl wirkt dadurch überzeichnet. Wir kappen diese Ausreißer in der Skala.
- **Nur das Hellfeld.** Erfasst sind angezeigte Fälle, das Anzeigeverhalten unterscheidet sich räumlich.

## Bezirksregion statt Adresse

Die Werte liegen pro Bezirksregion vor, nicht pro Adresse. Jeder Planungsraum erbt den Wert seiner Bezirksregion. Die Dimension ist damit gröber aufgelöst als die fünf Kern-Dimensionen.

## Nicht im Gesamt-Score

Erfasste Kriminalität fließt bewusst nicht in den Gesamt-Score und in kein Ranking. Ein hoher Wert heißt mehr erfasste Fälle, keine Wertung des Kiezes. Aus demselben Grund taucht die Dimension nicht in den Prosa-Profilen auf.

## Methodik

Delikt-Auswahl, Skala und alle Grenzen stehen unter [`/methodik/kiez-score`](/methodik/kiez-score).
