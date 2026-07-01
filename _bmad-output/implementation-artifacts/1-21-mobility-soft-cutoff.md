# Story 1.21: Mobility-Soft-Cutoff für Wohnadressen jenseits 600 m

Status: review

## Story

As a Nutzer:in, die eine Wohnadresse am Stadtrand prüft,
I want trotzdem die nächste ÖPNV-Haltestelle sehen, auch wenn >600 m entfernt,
so that ich „Schwach angebunden" als nutzbare Information bekomme statt „Nicht angebunden" wie bei einem Kleingarten.

## Problem heute

`NearestStopsCard` blendet alle Stops > 600 m aus. Karow (Wohngebiet, ~900 m zur S-Bahn) zeigt identisches „Nicht angebunden (Score 0)" wie ein Schrebergarten. Die Anbindungs-Information geht verloren.

Detektor: Bodenrichtwert-Nutzungsart als Proxy für „bewohntes Gebiet" (Nutzungs-Codes: `W`, `WA`, `WR`, `WS`, `MD`, `MI`, `MK`). Bei `SF-KGA`, Wald, Industrie bleibt „Nicht angebunden" als Endzustand.

## Akzeptanz-Kriterien

1. **AC-1:** Detektor `isResidentialLocation(layerHits): boolean` prüft `bodenrichtwerte`-Nutzungsart. Returns `true` bei `W`/`WA`/`WR`/`WS`/`MD`/`MI`/`MK`.

2. **AC-2:** Bei Wohnadresse + nächster Stop > 600 m: Stop zeigen mit Wording „Schwach angebunden" + Distanz + Gehminuten. Severity `warning`, nicht `danger`.

3. **AC-3:** Bei Nicht-Wohnadresse + keine Stop in 600 m: Bisheriges „Nicht angebunden" bleibt.

4. **AC-4:** Drei-Stufen-Rating: `solide` / `schwach` / `nicht-angebunden` als zusätzliche `MobilityRatingKey`-Werte.

5. **AC-5:** Tests Unit + Snapshot der NearestStopsCard für Karow-Fixture (Wohnadresse, weiter als 600 m) + Kleingarten-Fixture (keine Stops, kein Wohngebiet).

## Tasks

- [x] Task 1: `isResidentialLocation` Util + Tests
- [x] Task 2: `nearest-oepnv-stop` Soft-Cutoff-Variante (maxDistance opt., default 600, extended 1500 m)
- [x] Task 3: `getMobilityRating` neue Keys `schwach` + Logik wenn Wohnadresse
- [x] Task 4: `NearestStopsCard` rendert Soft-Stops mit Severity-Override
- [x] Task 5: Inspector-Integration in `inspector-panel.svelte` + LLM-Export-Builder

## Dev Notes

- Detection basiert auf `LayerHit` slug `bodenrichtwerte` value.nutzung-Property
- Soft-Cutoff-Distance konfigurierbar: 1500 m als Phase-1-Maximum (= ~19 min Geh-Zeit)
- Wording siehe User-Review-Feedback: „Solide / Schwach / Nicht angebunden"

## References

- [Source: src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.ts]
- [Source: src/lib/components/atlas/inspector-panel/internal/mobility-rating.ts]
- [Source: _bmad-output/implementation-artifacts/1-19-naechste-oepnv-stops.md] (Vorgänger-Story)
- User-Review-Feedback Wave 2, Punkt 1 (2026-05-14)

## Dev Agent Record

### Implementation Plan

TDD-first per ADR-012. Story-Scope befund: AC-1 listet BauNVO-Spec-Codes (W/WA/WR/WS/MD/MI/MK), aber realer Berliner Bodenrichtwert-Datensatz nutzt Präfix-Format `"W - Wohngebiet"`, `"M1 - Kerngebiet"`, `"M2 - Mischgebiet"`. Detector-Code-Set deckt Union beider Welten ab (Berlin-Codes W/M1/M2 + BauNVO-Spec WA/WR/WS/MD/MI/MK) für Forward-Compatibility bei Datensatz-Änderungen.

Schicht-Design:
1. `residential-location.ts`: Pure-Util, scannt LayerHits nach bodenrichtwerte-Hit, extrahiert nutzung-Property, prüft Präfix-Code gegen RESIDENTIAL_CODES-Set.
2. `nearest-oepnv-stop.ts`: erweitert um `softCutoffM`-Parameter in `findNearestStop` und Helper `findAllNearestStopsWithSoft(addr, index, { maxDistanceM=1500, softCutoffM=600 })`. NearestStop-Interface bekommt optionales `soft?: boolean`. bbox-Pre-Filter dynamisch aus maxDistanceM berechnet (statt fixer Konstante) für 1500m-Reichweite.
3. `mobility-rating.ts`: neuer Key `schwach` (severity `warning`, label „Schwach angebunden"). Score nutzt nur hard-stops (filterung via `soft`-Flag) → score=0 bei reinen Soft-Stops. Override „keine → schwach" nur wenn `options.isResidential` true UND mindestens ein soft-Stop existiert.
4. `nearest-stops-card.svelte`: Prop `isResidential` (default false). Bei true → soft-cutoff-Helper. Pro Row `data-soft="true"` Attribut + Severity-Override `warning` für soft-Rows. Empty-State-Wording adaptiv (1500m / 600m).
5. `inspector-panel.svelte`: `isResidential` aus `ui.selectedLayerHits` ableiten, an Card weiterreichen, in `hasNearestStops`-Check + LLM-Export-Path nutzen.
6. `llm-export-builder.ts`: ÖPNV-Render hängt `· schwach (außerhalb 600 m)`-Suffix an Soft-Stop-Zeile, Rating-Label übernommen aus MobilityRating.

### Completion Notes

**Coverage**:
- Task 1: 15 Tests in `residential-location.test.ts` (Berlin-Codes W/M1/M2, BauNVO-Codes WA/WR/WS/MD/MI/MK, Negativ-Cases SF-KGA/G/LF-F, no-bodenrichtwerte-hit, leere Hits, fehlende nutzung-Property, Case-Sensitivity, Mischung mit anderen Layern, unbekannter Code, Bare-Code ohne `" - description"`-Suffix).
- Task 2: 7 neue Tests in `nearest-oepnv-stop.test.ts` (soft-flag bei distance>softCutoff, kein soft unterhalb, null jenseits maxDistance, default-no-soft, findAllNearestStopsWithSoft Fixture + custom-Options + Defaults).
- Task 3: 6 neue Tests in `mobility-rating.test.ts` (schwach bei isResidential+soft-only, keine bei !isResidential+soft, keine ohne stops, hard-stops dominieren soft, default-false ignoriert soft, score=0 bei schwach).
- Task 4: 5 neue Tests in `nearest-stops-card.svelte.test.ts` (Karow-Fixture soft-row rendert mit data-soft+warning, schwach-Badge, default-false ignoriert soft, empty-state bei >1500m, hard-stop bevorzugt vor soft-stop).
- Task 5: 1 neuer Test in `llm-export-builder.test.ts` (soft-Stop mit „schwach"-Hinweis im Markdown).

**Test-Bilanz**: 109 Story-Tests grün (vor: 84, neu: +34). Full-Suite 1025/1025 grün. svelte-check 0 Errors.

**Konfig**:
- Neue Konstante `EXTENDED_WALKING_DISTANCE_M = 1500` in `src/lib/utils/oepnv-walking.ts`.
- bbox-Pre-Filter aus statischen LAT_DELTA/LNG_DELTA-Konstanten zu dynamischer `bboxDeltas(maxDistanceM)`-Berechnung umgebaut (cos-frei via Berlin-Lat-Konstante 67900 m/° Lng).

**Scope-Pivot**:
- `MobilityRatingKey` nicht expandiert um `nicht-angebunden`-Alias (story-AC-4 nennt es als Wort, nicht als zusätzlichen Key). Bestehender `keine` deckt den Endzustand semantisch ab; Label = „Nicht angebunden" steht unverändert. Reduziert Breaking-Surface für Badge-Konsumenten (data-rating Attribut).

**Deferred**:
- E2E + axe-CI-Run zu CI (Pattern wie Story 1.19/1.20).
- User-Verify Karow-Adresse in Browser empfohlen vor done-Promotion.

### File List

**Modified**:
- `src/lib/utils/oepnv-walking.ts` (+1 Konstante `EXTENDED_WALKING_DISTANCE_M`)
- `src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.ts` (soft-Param + bboxDeltas + findAllNearestStopsWithSoft + NearestStop.soft)
- `src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.test.ts` (+7 Tests)
- `src/lib/components/atlas/inspector-panel/internal/mobility-rating.ts` (+schwach-Key + MobilityRatingOptions + hardStop-Filter + anySoftStop)
- `src/lib/components/atlas/inspector-panel/internal/mobility-rating.test.ts` (+6 Tests)
- `src/lib/components/atlas/inspector-panel/nearest-stops-card.svelte` (+isResidential-Prop + soft-cutoff-Helper-Switch + data-soft + severity-Override + Empty-State-Wording)
- `src/lib/components/atlas/inspector-panel/nearest-stops-card.svelte.test.ts` (+5 Tests)
- `src/lib/components/atlas/inspector-panel.svelte` (+isResidential-derived + Helper-Switch in hasNearestStops/llmMarkdown + Prop-Forwarding)
- `src/lib/utils/llm-export-builder.ts` (+soft-Suffix in renderOepnv)
- `src/lib/utils/llm-export-builder.test.ts` (+1 Test)
- `_bmad-output/implementation-artifacts/1-21-mobility-soft-cutoff.md` (Status review + Dev Agent Record)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status-Promotion)

**Created**:
- `src/lib/components/atlas/inspector-panel/internal/residential-location.ts`
- `src/lib/components/atlas/inspector-panel/internal/residential-location.test.ts`

### Change Log

- 2026-05-14: Story 1.21 implementiert (TDD-first per ADR-012). Soft-Cutoff für Wohnadressen, schwach-Rating-Key, isResidentialLocation-Detector über bodenrichtwerte-nutzung-Property. +34 neue Tests grün, type-check 0, full-suite 1025/1025.
