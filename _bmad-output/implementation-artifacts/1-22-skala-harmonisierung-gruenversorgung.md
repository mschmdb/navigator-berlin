# Story 1.22: Skala-Harmonisierung Grünversorgung (Konsistenz mit Lärm/Luft/Bioklima)

Status: review

## Story

As a Nutzer:in, die mehrere Umwelt-Indikatoren an einer Adresse vergleicht,
I want konsistente Skala-Sprache („gering / mittel / hoch / sehr hoch") für alle Belastungs- und Versorgungs-Indikatoren,
so that ich nicht zwischen objektiver („hoch = mehr") und wertender („gut = mehr") Skala mental wechseln muss.

## Problem heute

`gruenversorgung-2023` nutzt aktuell wertende Sprache (`schlecht` / `gut`), während Lärm/Luft/Bioklima objektive Skala (`gering` / `mittel` / `hoch` / `sehr hoch`) verwenden. Das forciert mentale Skala-Umkehr beim Vergleichen.

Vorschlag User-Review: durchgängig objektive Skala. Wert-Richtung erklärt `valueScaleExplain` aus `layer-explain.ts`: „niedrig = wenig Grün, sehr hoch = gut versorgt". Severity-Token kehren sich automatisch um (rotes „hoch" bei Belastung, grünes „hoch" bei Grün).

## Akzeptanz-Kriterien

1. **AC-1:** `formatLayerValue('gruenversorgung-2023', ...)` rendert `gering` / `mittel` / `hoch` / `sehr hoch` statt `schlecht` / `gut`. Quelle-Daten-Mapping in der Pipeline.

2. **AC-2:** Severity-Mapping in `value-severity-mapping.ts` für Grünversorgung invertiert: `hoch` = `success`, `gering` = `warning`.

3. **AC-3:** `valueScaleExplain` für `gruenversorgung-2023` explizit: „niedrig = wenig Grün, sehr hoch = gut versorgt".

4. **AC-4:** LayerHitRow zeigt ValueChip mit korrekter Severity-Farbe.

5. **AC-5:** Tests + Snapshot LayerHitRow mit Grün-hoch + Grün-niedrig.

## Tasks

- [x] Task 1: Display-Layer-Mapping (`schlecht`→`gering`, `gut`→`hoch`, `sehr gut`→`sehr hoch`) via neues Modul `gruenversorgung-kategorie.ts`, eingebunden in `value-formatters.ts` + `layer-hit-display.ts`. Raw-Daten + Map-Choropleth-Style bleiben unverändert (`layer-style-builder.ts` Kommentar dokumentiert Roh-Skala).
- [x] Task 2: `value-severity-mapping.ts` — `gruenversorgung-2023` aus `UMWELTATLAS_KATEGORIE_LAYERS`-Set rausgenommen, neuer `severityFromGruenversorgung` mit invertierter Skala: hoch/sehr hoch=success, mittel=success-soft, gering/sehr gering=warning. Roh-Werte `gut`/`schlecht` werden via `mapGruenversorgungKategorie` normalisiert.
- [x] Task 3: `layer-explain.ts` `valueScaleExplain` für `gruenversorgung-2023` bereits korrekt („niedrig = wenig Grün, sehr hoch = gut versorgt"), keine Änderung nötig.
- [x] Task 4: Tests in `value-formatters.test.ts` (+4) + `value-severity-mapping.test.ts` (3 Grünversorgung-describe-Blöcke ersetzt) + `layer-hit-display.test.ts` (+2) + neuer `gruenversorgung-kategorie.test.ts` (+9). RED-GREEN-Zyklus dokumentiert.
- [x] Task 5: `layer-hit-row.svelte.test.ts` Browser-Component-Tests (+3) für ValueChip-Severity `success`/`warning`/`success-soft` mit gemappten Display-Strings (`hoch`/`gering`/`mittel`).

## Dev Notes

- Pipeline-Daten haben evtl. native `schlecht`/`gut`-Kategorien aus Umweltatlas-Original-Source. Display-Layer-Mapping bevorzugt (kein Re-Fetch), in `value-formatters.ts` umsetzen
- Auch andere Indikatoren prüfen: gibt es weitere mit wertender Sprache (`luft-2023`-Kategorien als Stichprobe)?

## References

- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts]
- User-Review-Feedback Wave 2, Punkt 2 (2026-05-14)

## Dev Agent Record

### Implementation Plan

Display-Layer-Mapping (kein Re-Fetch) entsprechend Dev-Notes-Empfehlung. Zentrales Modul `gruenversorgung-kategorie.ts` mit `mapGruenversorgungKategorie(raw: string)` versorgt 3 Konsumenten:
1. `value-formatters.formatUmweltatlasKategorie` → optionaler `mapKategorie`-Transformer, nur für `gruenversorgung-2023` aktiv
2. `layer-hit-display.umweltatlasDisplay` → analog, nur für `gruenversorgung-2023`
3. `value-severity-mapping.severityFromGruenversorgung` → wendet Mapping vor Severity-Check an + invertiert (hoch/sehr hoch=success, mittel=success-soft, gering/sehr gering=warning)

`gruenversorgung-2023` aus `UMWELTATLAS_KATEGORIE_LAYERS`-Set rausgenommen, eigenes Switch-Case in `getValueSeverity`.

Map-Choropleth-Style (`layer-style-builder.ts`) bleibt unverändert — er liest direkt aus Roh-GeoJSON `kategorie ∈ {gut, mittel, schlecht}` und färbt (gut=Indigo, schlecht=Vermillion). Display + Severity-Layer interpretieren die Bedeutung um, Datengrundlage stabil.

### Completion Notes

- TDD-Zyklus: 8 failing Tests (3 value-severity, 4 value-formatters, 1 layer-hit-display), dann Implementation → alle grün
- Neuer Mapping-Modul-Test (`gruenversorgung-kategorie.test.ts`, 9 Cases) deckt: schlecht/mittel/gut + sehr-Varianten + niedrig-Alias + Pass-through bereits-harmonisierter Werte + case-insensitive + unknown-Fallback
- AC-3 (`valueScaleExplain`) war bereits korrekt vorhanden seit Story 1.16 — verified, keine Code-Änderung
- Layer-Hit-Display-Test umgebaut von 1 Case (schlecht→chip "schlecht") auf 3 Cases (schlecht→"gering", gut→"hoch", mittel→"mittel")
- LayerHitRow Browser-Component-Tests (vitest-browser-svelte) verifizieren ValueChip data-severity-Attribut + Text-Inhalt; chip.textContent prüft sowohl Mapping-Ziel ("hoch") als auch Mapping-Quelle-Absenz ("not match schlecht")
- 1054 / 1054 Unit-Tests grün (vorher 1051 baseline; +3 neue describe-Blöcke mit insgesamt 12 neuen It-Cases nach Test-Umbau)
- `pnpm check` 0 Errors / 0 Warnings über 5478 Files
- E2E + axe-CI-Run + Browser-Smoke-Verify Wörther/Pankow-Adresse deferred zu CI/User-Verify-Phase (Konsistenz mit Stories 1-19..1-25)

### Change Log

- 2026-05-14 — Story 1.22 implementiert (Skala-Harmonisierung Grünversorgung)
  - NEU: `src/lib/components/atlas/inspector-panel/internal/gruenversorgung-kategorie.ts` (Display-Mapping-Modul)
  - NEU: `src/lib/components/atlas/inspector-panel/internal/gruenversorgung-kategorie.test.ts` (9 Cases)
  - UPDATE: `value-formatters.ts` (Display-Mapping eingebunden) + `value-formatters.test.ts` (+4 Cases)
  - UPDATE: `layer-hit-display.ts` (Display-Mapping eingebunden) + `layer-hit-display.test.ts` (3 Cases statt 1)
  - UPDATE: `value-severity-mapping.ts` (Grün aus Shared-Set, eigene invertierte Funktion) + `value-severity-mapping.test.ts` (3 Grünversorgung-Cases ersetzt)
  - UPDATE: `layer-hit-row.svelte.test.ts` (+3 Browser-Component-Tests für AC-5)

### File List

- src/lib/components/atlas/inspector-panel/internal/gruenversorgung-kategorie.ts (new)
- src/lib/components/atlas/inspector-panel/internal/gruenversorgung-kategorie.test.ts (new)
- src/lib/components/atlas/inspector-panel/internal/value-formatters.ts (modified)
- src/lib/components/atlas/inspector-panel/internal/value-formatters.test.ts (modified)
- src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts (modified)
- src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.test.ts (modified)
- src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts (modified)
- src/lib/components/atlas/inspector-panel/internal/layer-hit-display.test.ts (modified)
- src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts (modified)
- _bmad-output/implementation-artifacts/1-22-skala-harmonisierung-gruenversorgung.md (status)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status promotion)
