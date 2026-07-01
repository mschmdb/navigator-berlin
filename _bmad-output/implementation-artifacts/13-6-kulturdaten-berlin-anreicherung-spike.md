# Story 13.6: kulturdaten.berlin als Anreicherung · Spike (optional)

Status: ready-for-dev

> **Anker:** ADR-012 (Spike, Ergebnis ist ein Dokument). Optional, unabhängig von 13.0–13.5.
> **Charakter:** Spike. Liefert Entscheidung + Folge-Story-Vorschlag, keine Score-Änderung.

## Story

As a Solo-Maintainer,
I want prüfen ob `kulturdaten.berlin` (CC BY) die OSM-Kulturdaten sinnvoll ergänzt,
so that Lücken (Clubs, kleine Spielstätten) und eine reichere Taxonomie den Score verbessern.

## Kontext: Warum dieser Spike

OSM deckt ~90 % der Kultur-Layer ab (13.0). `kulturdaten.berlin` (Technologiestiftung Berlin, CC BY) hat eine offene API mit 3.261 Locations + reicher Taxonomie, aber **keine Koordinaten** (nur Adresse + Bezirk → selbst geocodieren). Frage: lohnt der Geocoding-Aufwand für die Abdeckungs-Lücken, vor allem bei Clubs/kleinen Spielstätten (wo OSM dünn ist und Clubkataster geschlossen)?

## Acceptance Criteria

1. **AC-1 (API live geprüft):**
   **Given** die kulturdaten.berlin-API (`https://api-v2.kulturdaten.berlin/api/locations`, no-auth)
   **When** ich Datenmodell, Location-Count, Lizenz (CC BY + Per-Record-Provider-Terme) und das Fehlen von Koordinaten live prüfe
   **Then** dokumentiert: Feld-Struktur (`address{streetAddress,postalCode,addressLocality}` + `borough`), Count, Lizenz-Details, Attribution-Pflicht

2. **AC-2 (Mehrwert + Geocoding):**
   **Given** die OSM-Kultur-Layer aus 13.0
   **When** ich Überlappung, Geocoding-Weg (Adresse → Punkt) und Dedupe gegen OSM prüfe
   **Then** dokumentiert: welche Sub-Themen profitieren (Clubs/kleine Spielstätten?), Geocoding-Aufwand + -Qualität, Dedupe-Strategie, Per-Record-Lizenz-Risiko

3. **AC-3 (Entscheidung):**
   **Given** das Spike-Ergebnis
   **When** entschieden wird
   **Then** entweder Folge-Story (Anreicherung + Attribution + Geocoding-Pipeline) oder bewusstes Defer mit Begründung, als Dokument in `docs/spikes/`

## Tasks / Subtasks

- [ ] **Task 1: API verifizieren** (AC: #1)
  - [ ] 1.1 `GET https://api-v2.kulturdaten.berlin/api/locations` live, Datenmodell + Count prüfen (Docs `kulturdaten.readme.io`, Source `github.com/technologiestiftung/kulturdaten-api`)
  - [ ] 1.2 Lizenz + Per-Record-Provider-Terme klären (CC BY, aber pro Datensatz abweichend möglich)

- [ ] **Task 2: Mehrwert + Geocoding** (AC: #2)
  - [ ] 2.1 Stichprobe Adressen geocodieren (bestehender Geocoding-Pfad prüfen: `src/lib/data/geocode.remote.ts` / Nominatim), Qualität/Rate-Limit bewerten
  - [ ] 2.2 Überlappung mit OSM-Layern messen (Dedupe nach Name+Position), Netto-Zugewinn pro Sub-Thema
  - [ ] 2.3 Fokus Clubs/kleine Spielstätten (OSM-Schwäche)

- [ ] **Task 3: Spike-Doku** (AC: #3)
  - [ ] 3.1 `docs/spikes/kulturdaten-berlin-anreicherung-2026.md`: Datenmodell, Lizenz, Geocoding-Aufwand, Dedupe, Mehrwert, Empfehlung (Folge-Story oder Defer)

## Dev Notes

### Kontext

- **Keine Koordinaten** in kulturdaten.berlin → Geocoding-Pflicht. Das ist der Haupt-Aufwand + Hauptrisiko (Qualität, Rate-Limit, falsche Treffer).
- **CC BY** (nicht CC0/dl-de) → Attribution-Pflicht, anders als ODbL-OSM. Per-Record-Terme können abweichen.
- Falls Folge-Story: die Daten würden als zusätzliche POI-Layer in die bestehenden Kultur-Slugs (13.0) gemergt oder als eigene Layer, mit Dedupe gegen OSM. `poi-density`-Infrastruktur bleibt.
- **Clubkataster** bleibt ausgeschlossen (keine offene Lizenz) — kulturdaten.berlin ist der einzige offene Weg, die Club/Live-Lücke teilweise zu schließen.

### Abgrenzung

Kein Score-Change im Spike. Nur Erkenntnis + Folge-Story-Vorschlag. Defer ist ein legitimes Ergebnis (OSM allein trägt den Score laut 13.0).

## References

- API: `https://api-v2.kulturdaten.berlin/api/locations` (live, no-auth), Source `github.com/technologiestiftung/kulturdaten-api`
- `src/lib/data/geocode.remote.ts` (bestehender Geocoding-Pfad)
- `scripts/lib/sources.ts` (Layer-Integration falls Folge-Story)
- `docs/spikes/` (Ablage), `_bmad-output/implementation-artifacts/13-0-kultur-layer-foundation.md`
- `docs/adr/ADR-012-tdd-mandate.md` (Spike-Ausnahme)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.6 erstellt (ready-for-dev). Optionaler Spike kulturdaten.berlin-Anreicherung (CC BY, Geocoding nötig). Ergebnis entscheidet Folge-Story oder Defer.
