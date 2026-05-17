---
title_de: "Hosting in Deutschland, Analytics ohne Cookies"
summary_de: "navigator.berlin läuft jetzt auf einem deutschen Server. Reichweiten-Messung ohne Cookies, ohne US-Anbieter, ohne Banner."
date: 2026-05-17
category: feature
tags: [hosting, privacy, analytics, eu-foss, transparenz]
---

## Was ist neu

Zwei Infrastruktur-Entscheidungen, die nach außen kaum sichtbar sind, aber den Charakter dieser Seite prägen.

### Hosting in Deutschland

navigator.berlin läuft jetzt auf einem deutschen Server bei einem europäischen Anbieter, mit Open-Source-Stack und automatisch erneuerten TLS-Zertifikaten. Kein US-Cloud-Dienst im Produktiv-Pfad, keine Drittanbieter-Komponenten, die personenbezogene Daten transitieren würden. Details und der genaue Stack: [Architektur](/architektur).

### Reichweiten-Messung ohne Cookies

Wir messen, welche Seiten aufgerufen werden, damit wir wissen, was wir verbessern müssen. Dafür läuft eine eigene Instanz von [Plausible Analytics](https://plausible.io) auf einem zweiten deutschen Server. Plausible ist Open Source, setzt keine Cookies, speichert keine IP-Adressen dauerhaft und respektiert „Do Not Track". Deshalb gibt es hier auch kein Cookie-Banner: weil nichts zu erlauben oder zu verweigern ist.

## Was gemessen wird

Pro Seitenaufruf: die aufgerufene URL, der grobe Standort (Land/Region, hergeleitet aus der IP, IP nicht gespeichert), Browser und Gerätetyp aggregiert.

Zusätzlich fünf Ereignisse, die uns helfen, die Nutzungs-Muster zu verstehen:

- **Search**: eine Adresse wurde gesucht und ausgewählt.
- **Bookmark**: eine Adresse wurde gemerkt (Speicherung passiert ausschließlich lokal im Browser).
- **Compare**: der Vergleichs-Modus wurde aktiviert.
- **Share**: das Teilen-Sheet wurde geöffnet.
- **Locate**: die Standort-Funktion auf der Karte wurde benutzt.

Diese Ereignisse landen ohne Identifier in einem Zähler. Keine Verknüpfung mit einer bestimmten Person, keine Cross-Site-Beobachtung.

## Was NICHT passiert

- Keine Tracking-Cookies, keine Werbe-Cookies, kein Local-Storage für Analytics
- Keine Browser-Fingerprints
- Keine Verknüpfung zwischen Sitzungen oder Geräten
- Keine Weitergabe an Dritte
- Kein Cookie-Banner

Die volle Erklärung steht im [Datenschutz](/datenschutz).

## Warum überhaupt messen

Aggregierte Statistiken helfen, die häufigsten Wege durch die Seite zu erkennen, kaputte Pfade zu finden und zu entscheiden, welche Daten-Schichten ausgebaut werden. Ohne diese Signale müssten wir raten. Plausible ist ein Kompromiss, der diese Erkenntnisse ermöglicht, ohne die Besucher zu identifizieren.

Anregungen oder Sorgen: [ms@fliege.dev](mailto:ms@fliege.dev).
