---
title_de: "Wahldaten: 12 Berliner Wahlen seit 2011"
summary_de: "Bundestags-, Abgeordnetenhaus- und BVV-Wahlen jetzt im Inspector, auf eigenen Wahl-Detail-Pages, im Kiez-Verlauf und als LLM-Tools."
date: 2026-05-19
category: feature
tags: [wahlen, daten, btw, agh, bvv, inspector, webmcp]
---

## Welche Wahlen

Vier Bundestagswahlen (2013, 2017, 2021, 2025), vier Abgeordnetenhauswahlen (2011, 2016, 2021, 2023) und vier BVV-Wahlen (2011, 2016, 2021, 2023). Wiederholungswahlen 2023 sind mit Verweis auf die jeweilige Original-Wahl markiert. Werte beschreiben Stimmenanteile, keine Bewertung.

## Wo es zu sehen ist

- **Inspector-Section „Wahlverhalten hier"**: pro Adresse Top-Parteien auf vier Ebenen wählbar — Stimmbezirk, Kiez, Bezirk, Berlin gesamt. Delta-Chips zeigen Abweichung zur nächsthöheren Ebene, eine Sparkline den Jahres-Verlauf.
- **Detail-Pages /wahl/{slug}**: 20 prerendered Seiten mit Stacked-Bar Berlin gesamt, Top-3 je Bezirk und einer Stimmbezirks-Choropleth-Karte (3500 Polygone, Farbe = stärkste Partei).
- **Kiez-Pages**: neuer Block „Wahl-Verlauf hier" zeigt pro Wahltyp die stärkste Partei pro Jahr.
- **Compare-Modus**: zwei Adressen seitenweise verglichen auf wählbarem Aggregations-Level.

## Briefwahl-Asymmetrie

Bis einschließlich 2017 (Bundestag) und 2016 (Abgeordnetenhaus, BVV) wurden Briefstimmen ohne räumlichen Bezug zu Urne-Stimmbezirken erfasst. Auf Stimmbezirks-Ebene fehlen sie deshalb. Inspector und Choropleth markieren das mit einem dezenten Schraffur-Streifen und einem Hinweis. Ab 2021 verteilen die Wahlleitungen Briefstimmen auf Brief-Wahlbezirks-Distrikte; die Asymmetrie entfällt.

## Quellen

- Bundestagswahlen: [Bundeswahlleiterin](https://bundeswahlleiterin.de) Wahlbezirksstatistik
- Abgeordnetenhaus und BVV: [Amt für Statistik Berlin-Brandenburg](https://statistik-berlin-brandenburg.de)
- Lizenz beider Quellen: Datenlizenz Deutschland Namensnennung 2.0

## LLM-Tools

Für LLM-Agenten (Claude-Browser-Extension, ChatGPT-Plugins) gibt es vier WebMCP-Tools: `list_elections`, `get_election_result`, `compare_elections`, `get_voting_district_geometry`. Tool-Manifest unter [/webmcp-manifest.json](/webmcp-manifest.json).

## Methodik

Vollständige Methodik zu Datenquellen, Cutoff, Briefwahl-Behandlung, Stimmbezirks-zu-Kiez-Aggregation, Wiederholungswahlen 2023 und Coverage-Lücken: [/methodik/wahldaten](/methodik/wahldaten).

Rückmeldung: [hey@navigator.berlin](mailto:hey@navigator.berlin).
