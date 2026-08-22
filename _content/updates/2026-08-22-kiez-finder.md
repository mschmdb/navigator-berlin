---
title_de: 'Kiez-Finder: Sag der Karte, was du suchst'
summary_de: 'Neun Regler statt Suchfeld: gewichte Ruhe, Grün, S-Bahn-Nähe oder Wahlverhalten, die Karte färbt alle 542 Planungsräume live beim Ziehen.'
date: 2026-08-22
category: feature
tags: [karte, kiez-score, kiez-finder, wahlen]
---

Bisher beantwortete navigator.berlin die Frage "Wie ist es an dieser Adresse?". Der neue Kiez-Finder dreht die Richtung um: Du sagst der Karte, was dir wichtig ist, und sie zeigt dir, wo Berlin dazu passt.

Das Panel öffnet sich über den Kiez-Finder-Link im Header oder direkt über die Startseite. Neun Regler stehen bereit:

- **Ruhe & Luft, Grün & Hitzeschutz, Mobilität, Versorgung, Wohnschutz, Kulturangebot:** die sechs Kiez-Score-Dimensionen, jeweils von "möglichst wenig" bis "möglichst viel". Wer Ruhe sucht, zieht nach rechts. Wer bewusst Trubel will, nach links.
- **Bebauung & Dichte:** von locker bis dicht besiedelt, gerechnet aus Einwohnern pro Fläche.
- **S-Bahn-Nähe:** bewertet den Fußweg zur nächsten Station, von fünf Gehminuten aufwärts.
- **Wahlverhalten ähnlich:** findet Gegenden, in denen eine gewählte Partei bei der Bundestagswahl 2025 vergleichsweise stark abschnitt, auf Basis der Zweitstimmen.

Der Kern ist die Live-Mechanik: Die Karte wartet nicht auf einen Absenden-Knopf. Jede Regler-Bewegung färbt sofort alle 542 Planungsräume neu, dunkel heißt hohe Passung. Die Berechnung läuft dafür direkt auf der Grafikkarte deines Geräts, die Daten sind nach dem ersten Laden vollständig im Browser. Eine Top-5-Liste im Panel nennt die Planungsräume mit der besten Passung beim aktuellen Regler-Stand.

Damit feine Unterschiede sichtbar bleiben, spannt sich die Farbskala über die tatsächliche Verteilung der Passungswerte statt über eine feste Spanne. Auch wenn die halbe Stadt ähnlich gut passt, zeigt die Karte, wo es am besten passt.

Auf dem Handy sitzt der Finder im aufziehbaren Panel am unteren Rand, auf großen Bildschirmen in der Seitenleiste. Ein Klick auf die Karte öffnet wie gewohnt den Adress-Inspektor; die Regler-Einstellung bleibt dabei erhalten und kommt beim Schließen zurück.

Eine Einordnung ist uns wichtig: Die Passung ist deine eigene Gewichtung offener Daten, keine Bewertung von Nachbarschaften oder Menschen. Es gibt kein "gutes" oder "schlechtes" Ergebnis, nur eine Antwort auf deine Kriterien. Kriminalitätsdaten haben wir bewusst nicht aufgenommen; sie bleiben als eigene Karte mit Kontext verfügbar, taugen aber nicht als Ranking-Zutat. Und das Partei-Kriterium beschreibt Ähnlichkeit im Wahlverhalten, keine Empfehlung.

Die Datengrundlage ist dieselbe wie überall auf navigator.berlin: Kiez-Score-Dimensionen aus offenen Berliner Quellen, Einwohnerdaten des Amts für Statistik, S-Bahn-Stationen aus OpenStreetMap, Wahlergebnisse der Bundeswahlleiterin.
