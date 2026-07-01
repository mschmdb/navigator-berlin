# Story 14.6: City-Core-Verzerrung + Delikt-Set — Spike (optional)

Status: ready-for-dev

> **Anker:** ADR-019. Analog Story 13.6 (optionaler Spike), aber **sollte Input vor der 14.1-Normalisierung liefern** (City-Core-Behandlung).
> **Abhängigkeit:** braucht das BR-Aggregat (14.0) als Datenbasis; speist 14.1 (Normalisierung) + Owner-Review der Gewichte.

## Story

As a Solo-Maintainer,
I want die Touristen/Pendler-Verzerrung quantifizieren und das Delikt-Set validieren,
so that die Normalisierung die City-Cores fair behandelt und das Delikt-Set wohn-relevant ist.

## Kontext: Warum dieser Change

Die HZ bezieht nur gemeldete Einwohner. City-LOR (Regierungsviertel HZ 46.178, Alexanderplatz 28.817 vs. Berlin 12.882) sind einwohnerarm + stark frequentiert → Artefakt-Belastung. Vor der finalen Normalisierung (14.1) muss entschieden werden, wie diese LOR behandelt werden. Außerdem: ist „Kieztaten" allein das richtige Maß, oder die kuratierte Einzel-Auswahl?

## Acceptance Criteria

1. **AC-1 (Verzerrung quantifizieren):**
   **Given** die HZ-Werte pro LOR (aus 14.0)
   **When** ich City-Core-LOR (Regierungsviertel, Alexanderplatz, Ku'damm/Kurfürstendamm, Tiergarten Süd) gegen Wohn-LOR vergleiche
   **Then** dokumentiert ein Spike-Ergebnis die Verzerrungs-Größenordnung + die gewählte Behandlung (flaggen / kappen / separate Klasse / Winsorize) mit Begründung

2. **AC-2 (Delikt-Set validieren):**
   **Given** die Spalten-Auswahl
   **When** „Kieztaten" gegen die kuratierte Einzel-Auswahl (Wohnraumeinbruch, Sachbeschädigung, Straßenraub, Fahrraddiebstahl) verglichen wird
   **Then** entweder Bestätigung des Sets + Term-Gewichte oder begründete Anpassung; Owner-Review der finalen Gewichte dokumentiert

3. **AC-3 (Folge-Entscheidung):**
   **Given** das Spike-Ergebnis
   **When** entschieden wird
   **Then** fließt es als konkreter Parameter (Cap/Flag-Schwelle + Delikt-Gewichte) in 14.1 ein oder wird bewusst deferred mit Begründung

## Tasks / Subtasks

- [ ] **Task 1: Verzerrungs-Analyse** (AC: #1)
  - [ ] 1.1 City-Core- vs Wohn-LOR HZ-Verteilung, Ausreißer-Schwelle bestimmen
  - [ ] 1.2 Behandlungs-Optionen (flag/cap/winsorize) mit Auswirkung dokumentieren
- [ ] **Task 2: Delikt-Set-Validierung** (AC: #2)
  - [ ] 2.1 Korrelation Kieztaten vs Einzel-Delikte, Wohn-Relevanz prüfen, Gewichts-Vorschlag
- [ ] **Task 3: Ergebnis-Doku** (AC: #3)
  - [ ] 3.1 Spike-Notiz unter `docs/spikes/`, Parameter für 14.1, Owner-Review-Marker

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- Referenzwerte 2025 (HZ Straftaten insgesamt): Berlin 12.882, Regierungsviertel 46.178, Alexanderplatz 28.817, Tiergarten Süd 31.960 (`docs/kriminalitaetsdaten-methodik.md`).
- Spike-Doku-Muster: `docs/spikes/laerm-db-upgrade-2026.md`.

### Hinweis

Anders als 13.6 (rein optional/deferred) liefert dieser Spike Pflicht-Input für eine faire 14.1-Normalisierung. Wenn knapp: minimal die Cap/Flag-Schwelle bestimmen, Delikt-Set-Feintuning kann deferred werden.

## References

- `docs/kriminalitaetsdaten-methodik.md`, `docs/spikes/laerm-db-upgrade-2026.md`
- `docs/adr/ADR-019-kriminalitaet-score-dimension.md`
- `_bmad-output/implementation-artifacts/13-6-kulturdaten-berlin-anreicherung-spike.md` (Spike-Muster)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List

### Debug Log References

## Change Log

- 2026-06-09: Story 14.6 erstellt (ready-for-dev). Spike City-Core-Verzerrung + Delikt-Set, speist 14.1-Normalisierung.
