# Story 1.10d: Mietspiegel-Preis-Lookup

Status: review

## Lizenz-Blocker (2026-05-13)

**Mietspiegel-Tabelle 2024 ist NICHT offen lizenziert.** Pruefe vor Implementation:

- **Berlin Open Data (daten.berlin.de)** hat NUR Wohnlagen-Klassifikation (dl-de/zero), keine €-Tabelle
- **mietspiegel.berlin.de PDF** ohne explizite Lizenz, nur PDF-Download
- **§ 5(2) UrhG** „amtliche Werke im amtlichen Interesse" — strittig für Mietspiegel
- **§ 558c BGB** regelt nur Erstellung, kein Urheberrecht

User-Anforderung: „wirklich nur offene daten, die wir auch nutzen dürfen!"

→ Tabellen-Übernahme aus PDF NICHT durchgeführt. Original-Scope verworfen.

## Neuer Scope (Empfehlung)

Statt Tabellen-Übernahme: **externer Verweis** auf offiziellen Mietspiegel-Rechner. Inspector-Row zeigt:

> Mietpreise: siehe [Berliner Mietspiegel 2024](https://mietspiegel.berlin.de/)

Vorteile:
- Rechtlich sauber (nur Link, keine Datenübernahme)
- Immer aktuell (offizielle Quelle)
- User kann mit Baujahr/Größe selbst rechnen
- Keine jährliche Wartung

Nachteile:
- Kein Inline-€-Wert im Inspector
- User muss Tool wechseln

## Alternative Quellen geprueft

| Quelle | License | €-Werte? | Geeignet? |
|---|---|---|---|
| daten.berlin.de Wohnlagen-WFS | dl-de/zero | nein | bereits genutzt (Klassifikation) |
| mietspiegel.berlin.de PDF | unklar | ja | rechtlich grau, übernommen wäre Risiko |
| IBB Wohnmarktbericht PDF | unklar | aggregiert | Lizenz nicht explizit |
| Statistik Berlin-Brandenburg | je Datensatz | teils | nicht spezifisch Mieten/m² |
| ImmobilienScout24 etc. | proprietary | ja | NICHT open |

## Story

As a Mobile-Nutzerin (Anna) und Datenjournalistin (Frieda),
I want für meine Adresse einen verlässlichen Verweis auf die offizielle Mietspiegel-Tabelle zu sehen,
so that ich Mietpreise nachschlagen kann ohne dass die App rechtsunsichere Daten übernimmt.

## Acceptance Criteria (revidiert)

As a Mobile-Nutzerin (Anna) und Datenjournalistin (Frieda),
I want für meine Adresse die typische Nettokaltmiete in €/m² zu sehen,
so that ich Mietpreise einschätzen + mit angebotenen Preisen vergleichen kann.

## Acceptance Criteria

1. **AC-1 (Mietspiegel-Tabelle als statisches JSON):**
   **Given** Berliner Mietspiegel 2024 (https://stadt.berlin.de/mietspiegel/)
   **When** Tabelle als statische JSON-Datei `static/mietspiegel/2024.json` eingebunden wird
   **Then** Struktur:
   ```json
   {
     "stichtag": "2024-09-01",
     "license": "Berliner Mietspiegel 2024, SenStadtWohn",
     "felder": [
       {
         "baujahr": "vor 1918",
         "groesse": "unter 40m²",
         "wohnlage": "einfach",
         "mittelwert_eur_qm": 6.93,
         "spanne_min": 5.10,
         "spanne_max": 9.62,
         "ausreichend_belegt": true
       }
     ]
   }
   ```
   **And** ~108 Einträge (6 Baualtersklassen × 4 Größen × 3 Wohnlagen, minus „nicht ausreichend belegt"-Zellen)
   **And** License-Hinweis im JSON-Top-Level + im Inspector („© Berliner Mietspiegel 2024, SenStadtWohn")

2. **AC-2 (Lookup-Library):**
   **Given** Mietspiegel-JSON
   **When** `src/lib/data/mietspiegel-2024.ts` implementiert wird
   **Then** Exports:
   - `loadMietspiegel(fetchFn): Promise<MietspiegelTable>`
   - `lookupMietspiegelByWohnlage(wol: 'einfach'|'mittel'|'gut'): MietspiegelSummary` mit:
     - `min_mittelwert` (kleinster Mittelwert über alle Baualtersklassen × Größen)
     - `max_mittelwert` (größter Mittelwert)
     - `median_mittelwert` (Median)
     - `count_felder` (Anzahl ausgewerteter Felder)
   **And** Unit-Tests mit Mini-Fixture (alle 3 Wohnlagen)

3. **AC-3 (Inspector-Integration für wohnlagen-2024):**
   **Given** Adresse-Klick liefert wohnlagen-2024-Hit mit `wol_mode`
   **When** Inspector den Mietspiegel-Hit rendert
   **Then** `formatLayerValue('wohnlagen-2024', value)` erweitert:
   - Bisher: „Wohnlage überwiegend mittel · Karlshorst Süd (45 mittel)"
   - Neu: ergänzt um „Mietpreise: 7.50 – 12.40 €/m² (Median 9.80) — Berliner Mietspiegel 2024"
   - Werte aus `lookupMietspiegelByWohnlage(wol_mode)`
   **And** Bei `wol_mode === 'unbekannt'`: kein Preis-Range, Standard-Text bleibt

4. **AC-4 (Mietspiegel-Sektion im Inspector — optional sichtbare Detail-Panel):**
   **Given** Mietspiegel-Werte für Wohnlage verfügbar
   **When** Nutzer in Inspector-Wohnlage-Row auf „Details" klickt
   **Then** Aufklapp-Panel zeigt Voll-Tabelle für die Wohnlage:
   - Spalten: Baujahr · Größe · Mittelwert · Spanne (min – max)
   - Zeilen: 6 × 4 = 24 (mit „nicht belegt"-Markierung wo applicable)
   - Quelle + Lizenz-Hinweis im Footer
   **And** Tastatur-zugänglich (`<details>`-Element + `<summary>`-Trigger)
   **And** Phase-1-Optional: kann Phase 2 sein, falls Aufwand zu groß

5. **AC-5 (Cookieless-Compliance + Provenance):**
   **Given** Mietspiegel-Daten sind statisch im Repo
   **When** geladen via `loadMietspiegel`
   **Then** Quelle dokumentiert in ADR oder Story-Notes:
   - URL: https://stadt.berlin.de/mietspiegel/
   - Stichtag: 1. September 2024
   - License: Daten frei nutzbar (öffentliches Verzeichnis nach § 558c BGB)
   - Manuelle Datenentnahme aus PDF (kein Auto-Refresh-Mechanismus möglich)
   **And** Doku in Manifest oder separater Mietspiegel-Konfig-Datei

6. **AC-6 (Tests + axe):**
   **Given** alle Module + UI-Anpassungen
   **When** Tests laufen
   **Then** Unit-Tests:
   - `mietspiegel-2024.test.ts` — Tabelle laden, Wohnlage-Lookup, Summary-Berechnung
   - `value-formatters.test.ts` — Wohnlagen-Formatter mit Mietspiegel-Integration (3 Cases pro Wohnlage)
   **And** axe-core gegen Inspector mit aktivem Wohnlage-Hit → 0 Violations
   **And** E2E (deferred to CI): Adress-Click → Inspector zeigt Wohnlage + Preis-Range

## Tasks / Subtasks

- [ ] **Task 1: Mietspiegel-Tabelle extrahieren** (AC: #1, #5)
  - [ ] 1.1 Berliner Mietspiegel 2024 PDF herunterladen (https://stadt.berlin.de/mietspiegel/, „Mietspiegeltabelle")
  - [ ] 1.2 Manuell Tabelle 1 (Mittelwerte + Spannen) extrahieren in `static/mietspiegel/2024.json`
  - [ ] 1.3 License + Quellen-Hinweis im JSON-Top-Level
  - [ ] 1.4 Verifizieren: stichproben-Check 3 Felder gegen PDF
  - [ ] 1.5 README + ADR-Note: manueller Extract-Workflow für Mietspiegel-Updates (jährlich)

- [ ] **Task 2: Lookup-Library** (AC: #2)
  - [ ] 2.1 `src/lib/data/mietspiegel-2024.ts`: `loadMietspiegel`, `lookupMietspiegelByWohnlage`, `MietspiegelTable`-Type
  - [ ] 2.2 `mietspiegel-2024.test.ts`: 3 Cases (einfach/mittel/gut) gegen Mini-Fixture
  - [ ] 2.3 Cache analog `loadManifest` (1× pro Session geladen)
  - [ ] 2.4 Export aus `src/lib/data/index.ts`

- [ ] **Task 3: Inspector-Integration** (AC: #3)
  - [ ] 3.1 `value-formatters.ts` → `formatWohnlage` erweitern um Mietspiegel-Range
  - [ ] 3.2 Async-Aufruf an `lookupMietspiegelByWohnlage` — Lookup synchron NACH `loadMietspiegel`
  - [ ] 3.3 Inspector-Hit zeigt Preis-Range als zusätzliche Zeile in LayerHitRow
  - [ ] 3.4 Source-Attribution: „Berliner Mietspiegel 2024" als Quelle

- [ ] **Task 4: Detail-Panel (Optional Phase 1)** (AC: #4)
  - [ ] 4.1 `inspector-panel/mietspiegel-detail.svelte`: aufklappbares `<details>`-Element
  - [ ] 4.2 Tabelle: Baujahr × Größe Matrix mit Mittelwert + Spanne
  - [ ] 4.3 Tastatur-Navigation + axe-Pass
  - [ ] 4.4 i18n-Stubs für deutsche Labels (Phase 2 Story 3.1)

- [ ] **Task 5: Tests + Story-Doku** (AC: #6)
  - [ ] 5.1 Unit-Tests pro Modul
  - [ ] 5.2 Backwards-Compat: alle existing-Tests grün
  - [ ] 5.3 E2E-Spec `tests/e2e/mietspiegel-inspector.e2e.ts` (deferred to CI)
  - [ ] 5.4 Commit: `feat(data): mietspiegel 2024 €-lookup (story 1.10d)`

## Dev Notes

### Datenquelle

**Berliner Mietspiegel 2024:** https://stadt.berlin.de/mietspiegel/

Format: PDF mit 9-Felder-Matrix:
- 6 Baualtersklassen: vor 1918, 1918-1949, 1950-1964, 1965-1990, 1991-2002, 2003+
- 4 Größenklassen: <40m², 40-60m², 60-90m², 90m²+
- 3 Wohnlage-Klassen: einfach, mittel, gut
- Pro Feld: Mittelwert + Spanne (min/max)
- Einige Felder „nicht ausreichend belegt" (z.B. Neubau einfach)

Aktualisierung: jährlich, manuelle PDF-Extraktion. Kein WFS/API verfügbar (politisch).

### Lookup-Strategie

Phase 1: nur per-Wohnlage-Aggregat. Adresse hat `wol_mode` aus 1.10c-Aggregat (LOR-Mode), kein Baujahr/Größe-Match möglich (Info nicht in Daten). Wir liefern Range über alle Baujahre+Größen für die Wohnlage.

Phase 2: User-Input (Baujahr + Größe + Ausstattung) → präziser Lookup. Story 1.10e wenn relevant.

### License-Aspekt

Berliner Mietspiegel ist amtliches Verzeichnis nach § 558c BGB. Daten dürfen frei genutzt werden mit Quellenangabe „Berliner Mietspiegel 2024, Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen". Keine separate Open-Data-License — public domain de facto.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — Info-Icon falls Tooltip nötig
- #2 Files <500 Zeilen
- #7 TS strict
- #10 Cookieless — statische JSON-Datei, kein Tracking
- #12 Provenance — Quelle + Stichtag + License im JSON + Inspector-Footer
- #13 A11y-First — `<details>` ist nativ tastatur-zugänglich

### Library/Framework Requirements

Keine neuen Dependencies.

### Testing Requirements

**Unit:** mietspiegel-2024.test.ts (lookup-Korrektheit), value-formatters.test.ts (Format-Integration)
**E2E (deferred to CI):** mietspiegel-inspector.e2e.ts

**Coverage-Target:** ≥80%

### File-Structure-Requirements

```
./
├── static/
│   └── mietspiegel/
│       └── 2024.json
├── src/
│   └── lib/
│       └── data/
│           ├── mietspiegel-2024.ts
│           └── mietspiegel-2024.test.ts
└── docs/
    └── adr/
        └── ADR-NNN-mietspiegel-manual-extract.md  # optional
```

### Open Questions

1. **Detail-Panel Phase 1 oder Phase 2?** Empfehlung: Phase 1 nur Inline-Range, Detail-Panel Phase 2.
2. **Mietspiegel-Updates jährlich:** wer triggert manuelle Re-Extraktion? Empfehlung: Issue-Template + Reminder in `_bmad-output/operations.md`.
3. **PDF-Parser automatisieren?** PDFs sind tabellenbasiert, `pdfplumber` (Python) oder `pdf-parse` (Node) könnten extrahieren. Phase-2-Story falls Wartungs-Aufwand zu hoch.
4. **Sub-Wohnlagen?** Berliner Mietspiegel kennt seit 2024 auch „einfach-mittel" + „mittel-gut" als Zwischen-Stufen — Wert verstehen. Phase 2 prüfen.

### References

- [Mietspiegel Berlin 2024 (PDF)](https://stadt.berlin.de/mietspiegel/)
- [Mietspiegelgesetz § 558c BGB](https://www.gesetze-im-internet.de/bgb/__558c.html)
- [Story 1.10c](./1-10c-pmtiles-pipeline.md) — Wohnlagen-2024 als Polygon-Aggregat (Mode-Klasse pro LOR)
- [Story 1.10](./1-10-layer-toggle-palette.md) — Inspector-Pipeline + Layer-Hits

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code dev-story workflow, 2026-05-13)

### Debug Log References

- Mietspiegel-PDF aus mietspiegel.berlin.de via WebFetch heruntergeladen + pdftotext-Extraktion (163 Zeilen Tabelle, alle 3 Wohnlagen, granulare Wohnfläche-Klassen)
- Lizenz-Pruefung: daten.berlin.de hat NUR Wohnlagen-Klassifikation als dl-de/zero, keine €-Tabelle. PDF auf mietspiegel.berlin.de ohne explizite Open-Data-License
- Original-Scope (statische JSON-Tabelle + Lookup-Library) → verworfen
- Pivot-Scope: externer Link statt Datenübernahme. Rechtlich sauber.

### Completion Notes List

- **Lizenz-Block:** Mietspiegel-Tabelle 2024 ist nicht offen lizenziert. § 5(2) UrhG-Status strittig für Mietspiegel (kein klares „amtliches Werk"). Daten-Übernahme nicht risikofrei.
- **Pivot-Scope:** statt Tabellen-JSON nun nur externer Link zu offiziellem Mietspiegel-Rechner. User klickt → externe Seite mit Eingabe-Form (Baujahr, Größe).
- **Implementation:** 1 neue Datenstruktur (`LAYER_EXTERNAL_LINK` mit `getLayerExternalLink(slug)`), 1 Inspector-Render-Pfad ergänzt (LayerHitRow zeigt unterhalb der Wohnlage-Werte einen Link „Mietpreise im Berliner Mietspiegel-Rechner nachschlagen").
- **Erweiterbar:** Pattern kann für künftige Layer mit externer Quelle wiederverwendet werden (z.B. detail-Karten auf gdi.berlin.de).
- **LAYER_EXPLAIN_DE** für `wohnlagen-2024` ergänzt: Hinweis dass nur Klassifikation + Verweis auf Rechner.
- **Bestehende Open-Data unverändert genutzt:** Wohnlagen-Klassifikation aus Story 1.10c (dl-de/zero, LOR-Aggregat). Keine Lizenz-Verletzung.

### File List

**Geändert:**
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` — `LayerExternalLink`-Type, `LAYER_EXTERNAL_LINK`-Map, `getLayerExternalLink(slug)`-Helper, explain-Text für wohnlagen-2024 ergänzt
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` — `getLayerExternalLink`-Import, $derived `externalLink`, optionaler Link-Render (target=_blank, rel=noopener noreferrer)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts` — 3 Cases ergänzt (Link für wohnlagen-2024, kein Link für andere Layer, kein Link bei no-coverage)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1-10d review

## Change Log

| Datum | Änderung | Begründung |
|---|---|---|
| 2026-05-13 | Story 1.10d created (ready-for-dev) | Wohnlage-Klassifikation alleine reicht User nicht — €/m²-Mieten erwartet. Mietspiegel als statische Lookup-Tabelle. |
| 2026-05-13 | Scope-Revision: Lizenz-Block | Mietspiegel-PDF nicht offen lizenziert. User-Anforderung „nur offene Daten" → Tabellen-Übernahme aufgegeben. |
| 2026-05-13 | Implementation: externer Link statt Daten-Übernahme | LayerHitRow rendert für wohnlagen-2024 einen Link zu mietspiegel.berlin.de. User klickt → externe Rechner-Seite mit Baujahr/Größe-Eingabe. Rechtlich sauber. 3 neue Tests (474 grün). |

## Confirmed Decisions

1. **Datenquelle:** Berliner Mietspiegel 2024 als statisches JSON, manuell aus PDF extrahiert. Kein Auto-Refresh.
2. **Lookup-Granularität Phase 1:** per Wohnlage (Range über alle Baujahre/Größen). Phase 2 mit User-Input für präziseren Lookup.
3. **License:** § 558c BGB, frei nutzbar mit Quellenangabe.
4. **Detail-Panel:** Phase 1 nur Inline-Range. Voll-Tabelle Phase 2.
5. **Update-Workflow:** jährlich manuell. Reminder als Operations-TODO.
