# Story 1.24: Klima-Normalperioden 1961–1990 + 1991–2020 in Sparklines

Status: review

## Story

As a Nutzer:in, die Klima-Sparklines im Inspector liest,
I want zwei Vergleichs-Mittelwerte (1961–1990, 1991–2020) sehen,
so that aus „Latest 20 heiße Tage" eine Aussage über Vervierfachung gegenüber den Großeltern wird.

## Problem heute

Sparklines zeigen Min/Max/Latest. Klimawandel-Story fehlt: Was wären die Werte „normalerweise" gewesen? Aktuell muss die Person die Sparkline-Höhe zu „kenne 5 heiße Tage als alten Normal-Wert" mental übersetzen. Zwei Zahlen pro Indikator schließen die Lücke.

## Akzeptanz-Kriterien

1. **AC-1:** `getNormalperiodMean(series, from, to)`-Util berechnet Mittel über Jahresbereich (existiert teilweise in `llm-export-builder.ts`).

2. **AC-2:** `ClimateSparkline` zeigt unter Min/Max/Latest zwei Zeilen:
   ```
   Mittel 1961–1990: 5
   Mittel 1991–2020: 11
   ```
   Mit Plex-Mono-Schriftart + dezent (text-ink-subtle).

3. **AC-3:** Optional: Achsenmarkierung 1990 + 2020 in Sparkline-Linie als subtile vertikale Linien (1pt Rule-Strong, 50% opacity).

4. **AC-4:** Pro Indikator (Heiße Tage, Frost-Tage, Sommertage, Jahresmittel): Normalperioden-Berechnung. Fehlende Jahre in Range → null statt 0 (z.B. Tempelhof startet 1919, also nur Range-Teil).

5. **AC-5:** Tests Util + Sparkline-Render.

## Tasks

- [x] Task 1: `getNormalperiodMean`-Util refactor + dedupliziere (aus llm-export-builder rausziehen)
- [x] Task 2: `ClimateSparkline` Footer-Text mit Normalperioden-Zeilen
- [ ] Task 3: Optional Achsenmarkierungs-Variante (Phase 2 — deferred per Story-Spec)
- [x] Task 4: Tests
- [x] Task 5: Verify Berlin-Tempelhof (startet 1919) korrekt: alter Normal kürzer (1961–1990 voll, 1919–1960 mit-genutzt fürs Min nicht für Normal)

## Dev Agent Record

### Implementation Plan

TDD-Cycle pro AC. Pragmatic-TDD per ADR-012.

1. **Red:** `normalperiod.test.ts` mit 15 Cases (Konstanten, In-Range-Mean, Tempelhof, Teil-Coverage, leeres Array, `yearValuesToNumeric` count/temp/skip/NaN/undefined).
2. **Green:** `src/lib/utils/normalperiod.ts` mit `NORMAL_OLD`, `NORMAL_NEW`, `getNormalperiodMean`, `yearValuesToNumeric`, `NumericYearPoint`-Interface.
3. **Refactor:** `llm-export-builder.ts` lokale `NORMAL_*`, `toNumeric`, `meanInRange`, `NumericPoint` entfernt → Import aus neuem Util. Re-Run llm-export-builder Tests grün (20/20).
4. **Red:** Sparkline-Tests für Footer-Rendering, Plex-Mono-Style, Tempelhof-Frost, Empty-Range.
5. **Green:** `climate-sparkline.svelte` mit `normalOldMean`/`normalNewMean` derived + `<span data-testid="climate-sparkline-normal-{old,new}">` innerhalb `<figcaption>` (a11y figcaption-as-only-or-last-child-Constraint).
6. **Red+Green:** Gleiches Pattern für `climate-long-view.svelte` (AC-4: Jahres-Mittel auch).

### Completion Notes

- **AC-1:** `getNormalperiodMean(points, from, to)` in `src/lib/utils/normalperiod.ts` extrahiert; ersetzt lokales `meanInRange` in `llm-export-builder.ts` (Dedup). Zusätzlich `yearValuesToNumeric(values, 'count'|'temp')` aus ehem. `toNumeric` exportiert für Konsumierer.
- **AC-2:** Beide Sparkline-Footer-Zeilen rendern unter Min/Max/Latest mit Plex-Mono + `text-ink-subtle` (block-span innerhalb figcaption für HTML5-Compliance).
- **AC-3:** Achsenmarkierung 1990 + 2020 in Sparkline-Linie → bewusst deferred zu Phase 2 wie Task-3-Marker andeutet (Story-AC „Optional"); Sparkline-Layout-Disziplin (Footer kompakt) bevorzugt.
- **AC-4:** Sparklines (Sommer-/Frost-/Heiße Tage) UND LongView (Jahresmittel) bekommen Normalperioden. Bei fehlenden Jahren im Range → kein DOM-Element (testid fehlt) statt `0`-Anzeige; getestet via „Normalperiode fehlt wenn keine Jahre im Range".
- **AC-5:** 15 Util-Tests + 4 Sparkline-Tests + 3 LongView-Tests = 22 neue Cases grün.
- **Tempelhof-Test (Task 5):** explizit verifiziert: Stations-Start 1919, alter Normal 1961–1990 nutzt nur 3 In-Range-Jahre (18 Frost-Tage), 1919/1950-Werte nicht enthalten. Min/Max-Stat unverändert auf voller Range, nur Mean-Berechnung auf [from, to] beschränkt.
- **Regression:** 1107/1108 unit-suite grün; 1 flaky perf-smoke (nearest-oepnv-stop 10k-stops > 50 ms, Worker-Load-Variance) re-run isoliert grün (43 ms tests-time). Type-check 0 Errors über 5482 Files.
- **Scope-Notes:** Browser-Smoke + E2E + axe-CI-Run deferred zu CI/User-Verify-Phase. Achsenmarkierungs-Phase-2 backlogged.
- **Post-Initial-Review-Erweiterung (User-Feedback):** Sommertage (≥25 °C) zusätzlich in LLM-Export `## Klima`-Sektion aufgenommen (vorher nur Heiße Tage / Frost-Tage / Jahres-Mittelwert). 1 neuer Test `Sommertage mit Min/Max/Latest + Normalperioden 30 bzw 38`. Dev Notes von Story-Spec hatten Sommertage als optional markiert — explizit hochgestuft auf User-Request für Konsistenz zwischen Inspector-Sparkline und LLM-Export.

### File List

- `src/lib/utils/normalperiod.ts` (NEW)
- `src/lib/utils/normalperiod.test.ts` (NEW)
- `src/lib/utils/llm-export-builder.ts` (refactor: lokale Normal-Period-Konstanten + Helpers entfernt)
- `src/lib/components/atlas/climate-sparkline.svelte` (Footer-Zeilen + Imports)
- `src/lib/components/atlas/climate-sparkline.svelte.test.ts` (4 neue Cases)
- `src/lib/components/atlas/climate-long-view.svelte` (Footer-Zeilen + Imports)
- `src/lib/components/atlas/climate-long-view.svelte.test.ts` (3 neue Cases)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status-update)
- `_bmad-output/implementation-artifacts/1-24-klima-normalperioden-ui.md` (this story)

### Change Log

- 2026-05-14: Story 1.24 von ready-for-dev → in-progress → review. TDD-first pro ADR-012. `normalperiod`-Util extrahiert aus `llm-export-builder.ts` (Dedup). ClimateSparkline + ClimateLongView mit Normalperioden-Footer (1961-1990 + 1991-2020 Mittel, Plex-Mono dezent, innerhalb figcaption). 22 neue Tests grün. Phase-2-Backlog: Achsenmarkierungs-Variante.

## Dev Notes

- 1961–1990 = WMO „Alte Normalperiode" (Referenz Klimawandel-Vergleich)
- 1991–2020 = WMO „Aktuelle Normalperiode" (seit 2021 offiziell)
- Genau drei Indikatoren brauchen Normalperioden: Heiße Tage, Frost-Tage, Jahresmittel-Temperatur. Sommertage optional, weniger gängiger Klima-Indikator
- Sparkline-Layout-Disziplin: Footer kompakt halten, Linien-Breaks vermeiden

## References

- [Source: src/lib/components/atlas/climate-sparkline.svelte]
- [Source: src/lib/utils/llm-export-builder.ts] (Normalperiod-Util raus-ziehen)
- [Source: _bmad-output/implementation-artifacts/1-17-climate-charts-layerchart-rework.md]
- User-Review-Feedback Wave 2, Punkt 5 (2026-05-14)
