---
title_de: "Hosting in Deutschland, Analytics ohne Cookies"
summary_de: "navigator.berlin läuft jetzt auf einem deutschen Server. Reichweiten-Messung ohne Cookies, ohne US-Anbieter, ohne Banner."
date: 2026-05-17
category: feature
tags: [hosting, privacy, analytics, eu-foss, transparenz]
---

## Hosting

Deutscher Server, europäischer Anbieter, Open-Source-Stack. Kein US-Cloud-Dienst. Details: [Architektur](/architektur).

## Analytics

Eigene [Plausible](https://plausible.io)-Instanz auf einem zweiten deutschen Server. Open Source, keine Cookies, keine dauerhafte IP-Speicherung, respektiert „Do Not Track". Kein Cookie-Banner nötig.

Gemessen wird pro Seitenaufruf: URL, Land/Region, Browser, Gerätetyp. Aggregiert, ohne Identifier.

Fünf Ereignisse zusätzlich:

- **Search**: Adresse gesucht und ausgewählt.
- **Bookmark**: Adresse gemerkt. Speicherung lokal im Browser.
- **Compare**: Vergleichs-Modus aktiviert.
- **Share**: Teilen-Sheet geöffnet.
- **Locate**: Standort-Button auf der Karte benutzt.

Keine Tracking-Cookies, keine Werbe-Cookies, keine Browser-Fingerprints, keine Cross-Site-Verknüpfung, keine Weitergabe an Dritte.

Details: [Datenschutz](/datenschutz).
