---
title_de: "Wahldaten seit 2011"
summary_de: "Vier BTW, vier AGH, vier BVV. Wer hat in deinem Kiez gewählt, wer im Bezirk, wer auf deinem Stimmbezirk."
date: 2026-05-19
category: feature
tags: [wahlen, daten, btw, agh, bvv]
---

## Was drin ist

Zwölf Wahlen: Bundestag (2013, 2017, 2021, 2025), Abgeordnetenhaus (2011, 2016, 2021, 2023) und Bezirksverordneten-Versammlung (2011, 2016, 2021, 2023). Die Wiederholungswahlen 2023 stehen mit Verweis auf die ursprüngliche Wahl drin.

Quellen: Bundeswahlleiterin für die BTW, Amt für Statistik Berlin-Brandenburg für AGH und BVV. Beide unter Datenlizenz Deutschland 2.0.

## Wo das auftaucht

- Im Adress-Inspector unter „Wahlverhalten hier". Wechselbar zwischen Stimmbezirk, Kiez, Bezirk und Berlin gesamt. Ein Delta zeigt, wie sehr der Stimmbezirk vom Bezirk abweicht.
- Auf eigenen Seiten pro Wahl unter [`/wahl/2025-btw-zweitstimme`](/wahl/2025-btw-zweitstimme) und so weiter. Mit Berlin-gesamt-Balken, Top-3 pro Bezirk und einer Karte aller 3500 Stimmbezirke.
- Auf den Kiez-Seiten als „Wahl-Verlauf hier" mit den stärksten Parteien pro Jahr.

## Warum Stimmbezirk nicht alles ist

Bis 2017 (Bundestag) und 2016 (AGH, BVV) gab es Briefstimmen nur als Brief-Bezirks-Aggregat, ohne räumliche Zuordnung zu den Urnenwahl-Stimmbezirken. Auf Stimmbezirks-Ebene fehlen sie in dem Zeitraum.

Die Karte und der Inspector machen das sichtbar: schraffierter Streifen am Balken und ein „Ohne Briefstimmen"-Badge, der auf die Methodik linkt. Bezirks- und Berlin-Aggregat haben die Briefstimmen mit drin, die sind vollständig.

Ab 2021 verteilen die Wahlleitungen Briefstimmen auf eigene Brief-Wahlbezirke. Das Problem entfällt dann.

## Pre-2017 ohne Karte

Für BTW 2013 und AGH/BVV 2011 hat das Amt für Statistik keine Stimmbezirks-Geometrien öffentlich gemacht. Diese drei Wahlen haben deshalb nur Bezirks- und Berlin-Aggregat, keine Choropleth-Karte. Wenn FragDenStaat-Anfragen Material liefern, kommen sie nach.

## Für LLM-Agenten

Vier neue Tools im WebMCP-Manifest: `list_elections`, `get_election_result`, `compare_elections`, `get_voting_district_geometry`. Sinn: eine Frage wie „Wie wählte Friedrichshain bei der BTW 2025?" wird mit Quelle und Lizenz beantwortet, ohne HTML zu scrapen. Manifest unter [`/webmcp-manifest.json`](/webmcp-manifest.json).

## Methodik

Datenquellen, Cutoff-Begründung, Briefwahl-Detail, Aggregations-Strategie, Wiederholungswahl-Behandlung: [`/methodik/wahldaten`](/methodik/wahldaten).

Rückmeldung: [hey@navigator.berlin](mailto:hey@navigator.berlin).
