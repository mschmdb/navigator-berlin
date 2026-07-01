# Story 12.1: Versorgung · Lebensmittel-Dichte als Nahversorgungs-Term

Status: review

> **Anker:** ADR-012 (TDD), ADR-015 (Score nur Größen mit eindeutiger Besser-Richtung). Nahversorgung ist bewohner-positiv und stigma-frei.
> **Hard-Block:** Story 12.0 muss `done` sein (`nahversorgung-lebensmittel`-Layer existiert + im PoiIndex).
> **Soft-Block:** Epic 9 + Epic 10.1–10.4 `done` (`dimension-config.ts` + `poi-density` stabil).

## Story

As a Bewohner,
I want dass die Versorgung zählt, wie viele Lebensmittelgeschäfte in Gehweite sind,
so that ein Kiez mit Supermarkt, Discounter und Spätkauf um die Ecke besser abschneidet als einer ohne.

## Kontext: Warum dieser Change

12.0 hat den `nahversorgung-lebensmittel`-Layer geholt und in den PoiIndex gehängt, aber noch kein `LayerWeight` referenziert ihn → kein Score-Effekt. Diese Story fügt den Lebensmittel-Term zur `VERSORGUNG_CONFIG` hinzu, mit der bestehenden `poi-density`-Strategy (Story 10.4). Damit fließt Lebensmittel-Dichte in den Versorgungs-Score.

**Wichtig zur Gewichtung:** Diese Story fügt den Term hinzu. Die finale interne Umgewichtung der Versorgungs-Dimension (Summe = 1.0) passiert gebündelt in **Story 12.3**, nachdem 12.1 + 12.2 alle neuen Terme gesetzt haben. 12.1 setzt ein vorläufiges Gewicht, 12.3 kalibriert.

## Acceptance Criteria

1. **AC-1 (Lebensmittel-Term):**
   **Given** 12.0 + `nahversorgung-lebensmittel` im PoiIndex
   **When** `VERSORGUNG_CONFIG` einen `poi-density`-`LayerWeight` für `nahversorgung-lebensmittel` erhält (Radius ~500 m)
   **Then** ein LOR mit hoher Lebensmittel-Dichte scort höher, weicher Tail jenseits des Cap (analog 10.4), kein harter Distanz-Cliff
   **And** `POI_DENSITY_SPECS` (pipeline.ts) nimmt den Slug automatisch auf (kein manueller Spec-Edit)

2. **AC-2 (TDD: Normalisierung):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** Radius, Cap, `softTailFactor` und Missing-Data (LOR ohne Lebensmittel-POI → weicher Tail / 0) sind getestet
   **And** `dimension-config.test.ts` verifiziert, dass `VERSORGUNG_CONFIG` den neuen Term enthält

3. **AC-3 (Inspector-Quelle):**
   **Given** FR15/FR40 (Wert + Stand + Quelle pro Layer)
   **When** ein Punkt getroffen wird
   **Then** Lebensmittel erscheint in der Versorgungs-Section als Quelle mit Wert + ODbL-Attribution
   **And** der Layer-Methodik-Eintrag `kiez-score-versorgung` erwähnt den Nahversorgungs-Term

4. **AC-4 (Gewichts-Konsistenz vorläufig):**
   **Given** die Versorgungs-Terme summieren intern auf 1.0
   **When** der Lebensmittel-Term mit vorläufigem Gewicht eingefügt wird
   **Then** `dimension-config.test.ts` Gewichts-Summen-Test bleibt grün (vorläufige Umverteilung, finale Kalibrierung in 12.3)
   **And** ein Kommentar markiert das Gewicht als „vorläufig, finalisiert in 12.3"

## Tasks / Subtasks

- [x] **Task 1: Term in VERSORGUNG_CONFIG** (AC: #1, #4)
  - [x] 1.1 (RED) `dimension-config.test.ts`: Test erwartet `nahversorgung-lebensmittel` mit `poi-density` in `VERSORGUNG_CONFIG`
  - [x] 1.2 (RED) `dimension-config.test.ts`: Gewichts-Summe `versorgung` = 1.0 nach Einfügen
  - [x] 1.3 (GREEN) `scripts/lib/kiez-score/dimension-config.ts` `VERSORGUNG_CONFIG` (Z.94–139): `LayerWeight` ergänzen:
    ```ts
    { layer: 'nahversorgung-lebensmittel', weight: 0.12, normalize: { kind: 'poi-density', radiusM: 500, cap: 4, softTailFactor: 0.3 } }
    ```
    Bestehende Gewichte vorläufig reduzieren, sodass Summe = 1.0 bleibt (finale Verteilung 12.3). Kommentar „vorläufig, 12.3".

- [x] **Task 2: Verify Pipeline-Pickup** (AC: #1)
  - [x] 2.1 `POI_DENSITY_SPECS` (`pipeline.ts` Z.22–31) zieht den Slug automatisch — verifizieren, kein Code-Edit nötig
  - [x] 2.2 `pnpm data:kiez-scores`: Recompute, Lebensmittel-Dichte beeinflusst Versorgungs-Werte (Spot-Check: Innenstadt-Kiez höher)

- [x] **Task 3: Inspector + Methodik** (AC: #3)
  - [x] 3.1 `src/lib/data/layer-methodology.ts` Eintrag `kiez-score-versorgung` (~Z.479): `calculation` erwähnt Lebensmittel-Nahversorgung, `coverageGaps` nennt OSM-Vollständigkeit (Crowdsourcing-Lücken)
  - [x] 3.2 Verify: Versorgungs-Section listet `nahversorgung-lebensmittel` als Quelle (data-driven über `DimensionScore.sources`, kein Hardcode nötig)

- [x] **Task 4: Abschluss** (AC: #2)
  - [x] 4.1 `pnpm test` 100% grün, `pnpm check` ohne neue Errors

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **`VERSORGUNG_CONFIG`** `dimension-config.ts` Z.94–139: kitas-2024 (0.15, poi-density 500/5), kitas-pro-kind (0.15), schulen-grundschule (0.15, poi-density 600/3), schulen-weiterfuehrend (0.15, poi-density 1200/3), krankenhaeuser-plan (0.25, capacity-weighted), spielplaetze (0.15, poi-density 400/8). Summe 1.0.
- **`poi-density`-Strategy** existiert: `types.ts` Z.61–62, `normalizeDensity` `normalize.ts` Z.107–118, synthetisches Handling `compute-score.ts` Z.136–152. **Kein neuer Code in normalize/compute-score nötig.**
- **`POI_DENSITY_SPECS`** `pipeline.ts` Z.22–31: flatMap über `DIMENSION_CONFIGS`, filtert `poi-density`. Neuer Term wird automatisch aufgenommen.
- **`normalizeDensity`-Logik:** `count>=1` → `(count/cap)*100` geclampt; `count===0` → `softTailFactor * normalizeDistance(nearestM, radiusM*2)`.

### Cap/Radius-Begründung (editorial, Assumption)

Radius 500 m = fußläufige Alltagsdistanz. Cap 4 = vier Lebensmittelgeschäfte in 500 m gelten als voll versorgt (Supermarkt + Discounter + 2 Spätis/Convenience). Schätzwerte, in 12.3 mit den anderen Termen kalibrieren. Per CLAUDE.md: Annahme dokumentiert, nicht gefragt.

### Was nicht brechen darf

- `DIMENSION_WEIGHTS` (5 × 0.20) bleibt — diese Story ändert nur einen Layer INNERHALB der Versorgungs-Dimension.
- Andere Dimensionen + andere Versorgungs-Terme: kein Anfassen außer Gewichts-Anteil.
- `compute-score.ts`, `normalize.ts`: kein Anfassen (poi-density bereits da).

### Architektur-Compliance

- **MUST #15:** Lebensmittel-Dichte hat eindeutige Besser-Richtung (mehr = besser). ADR-015-konform.
- **MUST #7:** typsicher über bestehende `LayerWeight`-Struktur.

## References

- `scripts/lib/kiez-score/dimension-config.ts` (VERSORGUNG_CONFIG Z.94–139)
- `scripts/lib/kiez-score/types.ts` (poi-density Z.61–62)
- `scripts/lib/kiez-score/normalize.ts` (normalizeDensity Z.107–118)
- `scripts/lib/kiez-score/compute-score.ts` (poi-density synthetic Z.136–152)
- `scripts/lib/kiez-score/pipeline.ts` (POI_DENSITY_SPECS Z.22–31)
- `src/lib/data/layer-methodology.ts` (kiez-score-versorgung ~Z.479)
- `docs/adr/ADR-012-tdd-mandate.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/10-4-poi-score-distanz-zu-dichte.md` (poi-density-Muster)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Debug Log References

- `dimension-config.test.ts`: neuer Term-Test (RED → GREEN). Gewichts-Summen-Guard (bestehend) bleibt grün.
- Recompute `pnpm data:kiez-scores`: Versorgung in 523/542 LOR verändert. Spot-Check LOR 10100101: versorgung 56.5 → 60, overall 38 → 38.7 (plausibel, Lebensmittel-Dichte trägt bei).
- Test-Fixture `compute-score.test.ts` (Versorgung-Kombi-Test) um `nahversorgung-lebensmittel`-poiCounts erweitert (sonst missingData).

### Completion Notes List

- Lebensmittel-Term in `VERSORGUNG_CONFIG`: `poi-density` (radiusM 500, cap 4, softTailFactor 0.3), Gewicht **0.12 vorläufig** (Kommentar „finale Kalibrierung in 12.3").
- Vorläufige Umverteilung (Summe 1.0): Krankenhaus 0.25 → 0.18, Spielplatz 0.15 → 0.10. Kita/Schule unverändert (reduziert 12.2).
- `POI_DENSITY_SPECS` zieht den Slug automatisch (kein Pipeline-Edit). `normalize`/`compute-score` unverändert (poi-density aus 10.4).
- Methodik `kiez-score-versorgung`: `calculation` nennt Lebensmittel-Nahversorgung + aktualisierte Gewichte (0.18/0.10), neuer coverageGap (OSM-Crowdsourcing), `relatedLayers` + `nahversorgung-lebensmittel`.
- Inspector-Quelle: data-driven über `DimensionScore.sources`, kein Hardcode nötig.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2782/2782 grün**.
- DB-Aggregat (`data:aggregate-scores`/`-rank`/`-comparison`) bewusst NICHT hier ausgeführt — gehört in die Recompute-Kette von Story 12.3 (DB-abhängig).

### File List

**Geändert:**
- `scripts/lib/kiez-score/dimension-config.ts` (Lebensmittel-Term + vorläufige Umgewichtung)
- `scripts/lib/kiez-score/dimension-config.test.ts` (Term-Test)
- `scripts/lib/kiez-score/compute-score.test.ts` (Fixture um neuen Term)
- `src/lib/data/layer-methodology.ts` (Versorgungs-calculation + coverageGap + relatedLayers)
- `static/kiez-scores/kiez-scores.json` (Recompute: Versorgung + Composite)
- `static/kiez-scores/layers/kiez-score-versorgung.geojson`, `kiez-score-gesamt.geojson` (Recompute)
- `static/layers/MANIFEST.json` (Re-Augment Kiez-Score-Layer)

## Change Log

- 2026-06-07: Story 12.1 erstellt (ready-for-dev). Lebensmittel als poi-density-Term in Versorgung. Gewicht vorläufig (0.12), finale Kalibrierung in 12.3.
- 2026-06-07: Story 12.1 implementiert (→ review). Lebensmittel-poi-density-Term (0.12 vorläufig), Krankenhaus/Spielplatz reduziert, Methodik + Recompute (523/542 LOR), Fixture-Fix. check 0 Errors, 2782/2782 grün.
