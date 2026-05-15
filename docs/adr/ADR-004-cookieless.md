---
status: Accepted
date: 2026-05-11
revised: 2026-05-15
deciders: solo-maintainer
---

# ADR-004: Cookieless-Architektur (URL-State only)

## Context

navigator.berlin ist ein öffentlicher Daten-Atlas für Berlin, der ohne Login, ohne Tracking und ohne Drittanbieter funktionieren soll. Die Architektur muss:

- DSGVO und TDDDG (Telekommunikation-Digitale-Dienste-Datenschutzgesetz, vormals TTDSG) ohne Cookie-Banner erfüllen.
- Permanent-Links unterstützen, damit Recherche-Ergebnisse teilbar bleiben (Wohnungssuche, Datenjournalismus, Verwaltungsanfragen).
- Keine US-Drittanbieter-Surface auf Client- oder Server-Seite akzeptieren (EU-FOSS-Linie, Schrems-II).
- Stateless deployment-bar (Hetzner/Coolify, kein Session-Store).

§25 Abs. 1 TDDDG verlangt Einwilligung für jede Speicherung in der Endeinrichtung der Nutzer:innen, die nicht "unbedingt erforderlich" für einen ausdrücklich gewünschten Dienst ist. Cookie-Banner sind die übliche Konsequenz. Wir wollen sie vermeiden, weil sie:

1. Unnötigen UX-Reibungspunkt darstellen (Privacy-Sandbox-Theater).
2. Architekturell signalisieren, dass Tracking grundsätzlich möglich wäre.
3. Wartung erzeugen (Consent-Renewal, Banner-Updates bei Regulierung-Änderung).

## Decision

**Persistente State wird ausschließlich in der URL kodiert** (Viewport, aktive Layer, Sprache, Adresse). Server setzt **keinen Cookie** (kein `Set-Cookie`-Header, kein Session-ID). Client-Code nutzt **kein `document.cookie`, `localStorage`, `sessionStorage`** für persistente Anwendungs-State.

State-Sharing zwischen Komponenten erfolgt via SvelteKit-**Context-API** (`createUiState()` in `+layout.svelte`, request-scoped, kein SSR-Leak). State-Persistenz erfolgt ausschließlich über die URL und über die Build-Zeit-Daten-Pipeline (Manifest, GeoJSON).

Webserver-Logs werden **IP-pseudonymisiert** mit 7-Tage-Rotation gespeichert (Caddy/nginx-Konfiguration in Coolify). Keine externen Analytics. Keine externen Fonts/Skripte/Tiles (Self-Hosted-PMTiles + Self-Hosted-Plex-Fonts).

### Ausnahme: User-initiierte clientseitige Bookmarks (Story 1.26)

**Diese Ausnahme erlaubt eine eng abgegrenzte Nutzung von `localStorage` für die Bookmark-Funktion**, ohne den Cookieless-Geist zu verletzen.

**Rechtliche Grundlage:**

- **§25 Abs. 2 Nr. 2 TDDDG** befreit Speicherung von der Einwilligungspflicht, wenn sie "unbedingt erforderlich ist, damit der Anbieter eines Telemediendienstes einen vom Nutzer ausdrücklich gewünschten Telemediendienst zur Verfügung stellen kann".
- **DSK-Orientierungshilfe Telemedien 2021** (S. 14): "Nutzer:innen wünschen Zusatzdienste und -funktionen erst, wenn sie diese explizit in Anspruch nehmen, z. B. einen Chatbot anklicken, eine **Merkliste anlegen** oder ein Formular ausfüllen."

Die Bookmark-Funktion ist eine "Merkliste" im Wortsinn der DSK-Orientierungshilfe.

**Scope-Beschränkungen, die diese Ausnahme rechtfertigen:**

1. **User initiiert die Speicherung explizit** durch Klick auf den Bookmark-Button. Kein impliziter Auto-Save, keine Hintergrund-Schreibvorgänge.
2. **Daten verbleiben ausschließlich clientseitig.** Niemals Server-Roundtrip, niemals Übertragung an Dritte, niemals serverseitige Auswertung.
3. **Datenumfang minimal:** `displayName`, `lat`, `lng`, `bezirk`, `postcode`, `createdAt`. Keine personenbezogenen Daten über die Adresse hinaus, keine Profilbildung, keine Tracking-Funktion.
4. **Storage-Key transparent:** `navigator-berlin.bookmarks.v1` (versioniert, dokumentiert in `docs/runbooks/`).
5. **User-Löschpfad jederzeit verfügbar:** UI-Aktion "Alle löschen" + Browser-Settings.
6. **Datenschutzerklärung benennt:** was, wo, wozu, wie löschen (Snippet als Artefakt unter `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md`, integriert in Compliance-Pages via Story 4.6).

**Konsequenz:** KEIN Cookie-Banner erforderlich. Die Voraussetzungen für Einwilligungsfreiheit nach §25 Abs. 2 Nr. 2 TDDDG sind erfüllt.

**Was diese Ausnahme NICHT erlaubt:**

- Kein `localStorage` für Analytics, Tracking, A/B-Tests, Feature-Flags-Persistenz, Login-Tokens oder vergleichbare Funktionen.
- Kein Auto-Save von Suchverläufen, Inspector-Hits oder Karten-Viewport-State (URL bleibt die einzige Persistenz für diese State).
- Keine Cookies, Session-Storage oder IndexedDB-Nutzung, solange kein eigenes ADR die nächste Ausnahme begründet.

## Consequences

**Positive:**

- Kein Cookie-Banner, keine Consent-Management-Plattform-Lizenzkosten, keine Banner-Wartung.
- DSGVO/TDDDG-Compliance durch Architektur, nicht durch Compliance-Theater.
- Deeplink-fähige App: jeder UI-State teilbar via Permalink.
- Stateless-Deployment, keine Session-Store-Infrastruktur, keine Server-Side-Personal-Data-Stores.
- Klare Linie für Code-Reviews: `localStorage` taucht in PRs auf → ADR-Verweis erforderlich.

**Negative / Trade-offs:**

- URLs werden länger (Layer-IDs, Adress-Koordinaten, Viewport-Parameter im Query-String).
- Keine geräteübergreifende Synchronisation (würde Login + Server-State erfordern, ist explizit ausgeschlossen).
- Bookmark-Ausnahme erfordert Disziplin: jede weitere `localStorage`-Nutzung muss ein eigenes ADR begründen, sonst droht Schrittweise-Aushöhlung der Cookieless-Linie.

**Operational:**

- CI-Gate (`.github/workflows/ci.yml`) prüft, dass keine `Set-Cookie`-Header in Production-Responses auftauchen (Story 4.3).
- `MUST-Rule #10` in `_bmad-output/planning-artifacts/architecture.md` annotiert die Bookmark-Exception inline.
- Code-Review-Konvention: `localStorage`/`sessionStorage`-Nutzung außerhalb von `src/lib/state/bookmark-store.ts` wird per Default abgelehnt.

## References

- [TDDDG §25](https://www.gesetze-im-internet.de/tddd_g/__25.html)
- [DSK-Orientierungshilfe Telemedien 2021 (PDF, S. 14)](https://www.datenschutzkonferenz-online.de/media/oh/20211220_oh_telemedien.pdf)
- [Story 1.26 — Adress-Bookmarks LocalStorage](../../_bmad-output/implementation-artifacts/1-26-adress-bookmarks-localstorage.md)
- [ADR-002 — WebMCP](ADR-002-webmcp.md) (kein Client-State-Bedarf)
- [ADR-008 — Context-API für State](ADR-008-context-api-state.md)
