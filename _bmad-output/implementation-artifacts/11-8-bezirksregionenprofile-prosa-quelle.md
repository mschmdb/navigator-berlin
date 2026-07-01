# Story 11.8: Bezirksregionenprofile als externe Prosa-Quelle (optional)

Status: ready-for-dev

> **Anker:** Stufe 3.2, optional. Liefert sozialräumliche Tiefe aus amtlichen Profilen für die KI-Profile (11.6). Hoher Aufwand wegen PDF-Heterogenität → Pilot-Bezirk zuerst.
>
> **Abhängigkeiten:** Speist 11.6 (zusätzlicher Grounding-Input). Kein Hard-Block; 11.6 funktioniert auch ohne. Spike-Charakter.

## Story

As a Content-Maintainer,
I want sozialräumliche Tiefe aus den amtlichen Bezirksregionenprofilen einbinden,
so that KI-Profile über reine Zahlen hinaus Kontext bekommen.

## Acceptance Criteria

1. **AC-1 (Pilot-Extraktion):**
   **Given** Bezirksregionenprofile Teil I (offen, je Bezirk publiziert, 143-BZR-Grain, PDF, Struktur variiert je Bezirk)
   **When** ein Extraktionsschritt für EINEN Pilot-Bezirk je BZR Kern-Aussagen extrahiert
   **Then** entsteht ein strukturierter Auszug pro BZR (z.B. `static/data/bzrp-extract/{slug}.json`) mit quellbelegten Aussagen; Machbarkeit + Aufwand für die übrigen Bezirke ist dokumentiert

2. **AC-2 (Grounding-Input für 11.6):**
   **Given** der Pilot-Auszug
   **When** 11.6 ihn als zusätzlichen Input erhält
   **Then** nutzen Profile, wo vorhanden, amtliche Aussagen; fehlt ein Auszug, fällt 11.6 sauber auf reine Daten-Profile zurück

3. **AC-3 (Lizenz):**
   **Given** Lizenz-Disziplin
   **When** Profil-Inhalte genutzt werden
   **Then** ist Quelle + Lizenz je Bezirk in `/lizenzen` + Methodik dokumentiert

4. **AC-4 (Spike-Entscheidung):**
   **Given** der Pilot-Aufwand
   **When** die Story abgeschlossen ist
   **Then** liegt eine Go/No-Go-Empfehlung für die Skalierung auf alle 12 Bezirke vor (Aufwand vs. Mehrwert), in `docs/spikes/` dokumentiert

## Tasks / Subtasks

- [ ] **Task 1: Quellen-Recon** (AC: #1, #3)
  - [ ] 1.1 Pilot-Bezirk wählen (z.B. einer mit klar strukturierten PDFs), BZRP-Teil-I-PDFs lokalisieren, Lizenz prüfen
- [ ] **Task 2: Extraktion** (AC: #1)
  - [ ] 2.1 Extraktionsweg festlegen (PDF→Text, ggf. LLM-gestützte Strukturierung im selben Authoring-Modus wie 11.6)
  - [ ] 2.2 `static/data/bzrp-extract/{slug}.json` schreiben, quellbelegt (Seite/Abschnitt)
- [ ] **Task 3: 11.6-Integration** (AC: #2)
  - [ ] 3.1 `buildProfileInput` (11.6) um optionalen BZRP-Auszug erweitern
- [ ] **Task 4: Doku + Entscheidung** (AC: #3, #4)
  - [ ] 4.1 `docs/spikes/bezirksregionenprofile-2026.md` (Aufwand, Go/No-Go), `/lizenzen`-Eintrag

## Dev Notes

### Ist-Zustand + Kontext

- Bezirksregionenprofile sind per Bezirk auf berlin.de publiziert, Teil I = Analyse/Kerndaten, Teil II = Ziele. Grain = 143 BZR, deckungsgleich mit Kiez (LOR-BZR).
- Struktur variiert je Bezirksamt → kein einheitlicher Parser. Deshalb Pilot + Spike, nicht Big-Bang.
- Integration ist additiv zu 11.6: `buildProfileInput` bekommt einen optionalen `bzrpExcerpt`. 11.6 bleibt ohne lauffähig.
- Falls LLM-gestützte Strukturierung: gleicher Authoring-Modus wie 11.6 (Owner-getriggert, nicht prebuild), ADR-016 deckt die Ausnahme.

### Architektur-Compliance

- Optional, kein Deploy-Pfad. Auszüge sind committete statische Daten.
- Quellen-Attribution je Bezirk (FR40).

### Was nicht brechen darf

- 11.6 läuft ohne BZRP-Auszüge weiter (graceful). Kein Hard-Coupling.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.8]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 3.2 + externe Quellen (Bezirksregionenprofile)]
- [Source: https://www.berlin.de/ba-charlottenburg-wilmersdorf/verwaltung/service-und-organisationseinheiten/sozialraumorientierte-planungskoordination/region/bezirksregionenprofile-1278233.php]
- [Source: _bmad-output/implementation-artifacts/11-6-grounded-ki-profile-build-step.md] (Integrations-Punkt)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
