# Story 12.5: StEP-Zentren als Zentralitäts-Term · Spike (optional)

Status: ready-for-dev

> **Anker:** ADR-012 (Spike, kein Test-First — Ergebnis ist ein Dokument, nicht Code). Optional, unabhängig von 12.0–12.4.
> **Charakter:** Spike. Liefert eine Entscheidung + Folge-Story-Vorschlag, keine Score-Änderung.

## Story

As a Solo-Maintainer,
I want prüfen ob die StEP-Zentren (Zentrenhierarchie, FIS-Broker/Geoportal) als zusätzlicher „Nähe zum Versorgungszentrum"-Term taugen,
so that Einzelhandels-Zentralität die punktbasierte Nahversorgung ergänzt statt sie zu duplizieren.

## Kontext: Warum dieser Spike

12.0–12.3 messen Nahversorgung punktbasiert (OSM-POI-Dichte). StEP Zentren (Stadtentwicklungsplan Zentren 2030/2040) liefern eine planerische Zentren-Hierarchie (Hauptzentren, Stadtteil-/Ortsteilzentren, Fachmarktstandorte) als Geoportal-WFS. Frage: ergänzt „Nähe zum Versorgungszentrum" die POI-Dichte sinnvoll, oder dupliziert es sie (wo POI-Dichte hoch ist, ist meist auch ein Zentrum)?

## Acceptance Criteria

1. **AC-1 (Datenlage live geprüft):**
   **Given** StEP Zentren 2030/2040 (Geoportal Berlin / ex-FIS-Broker WFS, dl-de/by)
   **When** ich Format, Granularität (Punkt/Polygon der Zentren), Lizenz und WFS-Erreichbarkeit live prüfe
   **Then** dokumentiert: typeName(s), Geometrie-Typ, Feature-Zahl, Lizenz, Stand. (Hinweis: FIS-Broker wurde 2025-12-01 abgelöst durch Geoportal Berlin / Geodatensuche — aktuelle Endpoint-URL verifizieren)

2. **AC-2 (Mehrwert-Analyse):**
   **Given** die OSM-Nahversorgung aus 12.0–12.3
   **When** ich die Überlappung prüfe (korreliert Zentren-Nähe mit POI-Dichte?)
   **Then** dokumentiert: Mehrwert vs. Duplikation, möglicher Integrationsweg (poi-distance zum nächsten Zentrum als eigener Versorgungs-Term?), Aufwand vs. Auflösungsgewinn

3. **AC-3 (Entscheidung):**
   **Given** das Spike-Ergebnis
   **When** entschieden wird
   **Then** entweder Folge-Story (Zentralitäts-Term in Versorgung) oder bewusstes Defer mit Begründung, als kurzes Dokument in `docs/spikes/`

## Tasks / Subtasks

- [ ] **Task 1: Datenquelle verifizieren** (AC: #1)
  - [ ] 1.1 Geoportal Berlin / Geodatensuche nach „StEP Zentren 2030"/"2040" durchsuchen, WFS-typeName + Lizenz live prüfen (NICHT aus Recherche-Notiz übernehmen)
  - [ ] 1.2 Beispiel-Fetch (klein), Geometrie + Attribute begutachten

- [ ] **Task 2: Mehrwert-Analyse** (AC: #2)
  - [ ] 2.1 Zentren-Geometrie gegen LOR-Centroide: Distanz zum nächsten Zentrum pro LOR (Prototyp, kein Produktiv-Code)
  - [ ] 2.2 Korrelation zur bestehenden Nahversorgungs-Dichte prüfen (dupliziert es das Signal?)

- [ ] **Task 3: Spike-Doku** (AC: #3)
  - [ ] 3.1 `docs/spikes/step-zentren-versorgung-2026.md`: Datenlage, Mehrwert/Duplikation, Integrationsweg, Aufwand, Empfehlung (Folge-Story oder Defer)

## Dev Notes

### Kontext

- Integrationsmuster für FIS-Broker/Geoportal-WFS: `scripts/lib/sources.ts` `kind: 'fis-broker'`, Muster `kitas-2024` Z.340–349. Reprojektion EPSG:25833 → 4326 via WFS `srsName`.
- Ein Zentralitäts-Term wäre vermutlich `poi-distance` (Distanz zum nächsten Zentrum), nicht `poi-density` — Zentren sind wenige große Polygone, Dichte unsinnig (analog Krankenhaus `capacity-weighted-distance`).
- Lizenz dl-de/by → Footer-Zeile „Geoportal Berlin / StEP Zentren", anders als OSM ODbL.

### Abgrenzung

Kein Score-Change in diesem Spike. Nur Erkenntnis + Folge-Story-Vorschlag. Falls Defer: Begründung reicht (analog Story 10.6-Spike → 10.6b).

## References

- `scripts/lib/sources.ts` (fis-broker-Muster kitas-2024 Z.340–349)
- `docs/spikes/` (Spike-Doku-Ablage, Muster `laerm-db-upgrade-2026.md`)
- `_bmad-output/implementation-artifacts/10-6-laerm-db-upgrade-spike.md` (Spike-Muster)
- `docs/adr/ADR-012-tdd-mandate.md` (Spike-Ausnahme)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 12.5 erstellt (ready-for-dev). Optionaler Spike StEP-Zentren als Zentralitäts-Term. Ergebnis entscheidet Folge-Story oder Defer.
