# Story 10.4: POI-Score von Nächste-Distanz auf Dichte (V5)

Status: done

> **Umsetzung:** poi-density-Normalisierung (count im Radius, cap, softTailFactor; >=cap→100, 0 POIs→weicher Tail über nächste Distanz). Umgestellt: kitas-2024, schulen-grundschule, schulen-weiterfuehrend, spielplaetze. krankenhaeuser-plan bleibt capacity-weighted (Dichte für Kliniken unsinnig). poi-density läuft als synthetic (liest ScoreInput.poiCounts), Pipeline berechnet poiCounts pro LOR via buildPoiDensityCounts (Specs aus DIMENSION_CONFIGS abgeleitet). Recompute 542 LOR < 4s (Perf-Test 3000 Punkte). 2015/2015 grün, 0 Type-Errors. Methodik aktualisiert.

> **Anker:** ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`, Pragmatic TDD). ADR-015 (`docs/adr/ADR-015-score-composition-umwelt-infra.md`, Accepted 2026-05-20) definiert den Versorgung-Scope. Diese Story ist der **letzte Versorgung-Refactor in Epic 10**: sie baut auf 10.1 (Kita-Plätze pro Kind), 10.2 (Krankenhaus-Betten) und 10.3 (Schulart-Differenzierung) auf und setzt voraus, dass alle drei gelandet sind. Epic 9 (Stories 9.1–9.6) muss abgeschlossen sein, da `dimension-config.ts` und `types.ts` dort final umgestellt wurden.

## Story

As a User,
I want dass mehrere Einrichtungen im Umkreis besser zählen als nur die nächste,
so that ein gut versorgter Kiez sich von einem mit genau einer Einrichtung unterscheidet.

## Kontext: Warum dieser Change

Der aktuelle Versorgung-Score berechnet pro POI-Layer (kita, schule, krankenhaus, spielplatz) die Distanz zum nächsten Punkt und normalisiert linear bis zur Schwelle. Ab Schwelle: hart 0. Das erzeugt zwei Probleme:

- **"Zweiter Punkt zählt 0":** Ein LOR mit zwei Kitas 300 m und 400 m apart scort identisch wie ein LOR mit einer Kita 300 m. Die zweite Kita ist vollständig unsichtbar.
- **Harter Distanz-Cliff:** Ein LOR, dessen nächste Kita 501 m statt 499 m entfernt ist, fällt von ~0 auf exakt 0. Kein weicher Übergang.

V5 des Audits (`_user-input/datenaufloesung-audit-2026-05-21.md`, Zeile 169-172) schlägt Radius-Zählung als Korrektur vor: Anzahl POIs im Radius, optional pro Kopf. Das ersetzt `poi-distance` durch eine neue Normalisierungsstrategie `poi-density`.

## Acceptance Criteria

1. **AC-1 (Dichte-Umstellung):**
   **Given** die POI-Layer `kitas-2024`, `schulen-2024`, `krankenhaeuser-plan`, `spielplaetze`
   **When** der Score von `poi-distance` (Distanz zum nächsten) auf `poi-density` (Anzahl im Radius) umgestellt wird
   **Then** entfällt der "zweiter Punkt zählt 0"-Effekt
   **And** ein LOR mit mehr POIs im Radius scort höher als ein LOR mit nur einem POI gleicher Distanz
   **And** der weiche Tail jenseits der Schwelle ersetzt den harten Cliff (Score fällt nicht auf 0, wenn kein POI im Radius, sondern nächster POI liegt knapp drüber)

2. **AC-2 (TDD: Dichte-Zählung + Radius + Normalisierung):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** Tests laufen
   **Then** Dichte-Zählung (mehrere POIs im Radius) ist mit mindestens 3 Test-Cases getestet
   **And** Radius-Konfigurierbarkeit pro Layer ist getestet (kita anderer Radius als krankenhaus)
   **And** Normalisierung (0 POIs im Radius → weicher Tail, viele POIs → 100) ist getestet
   **And** Missing-Data (Layer komplett absent) fällt sauber auf `null`
   **And** Tests folgen Red-First (Failing-Commit nachvollziehbar)

3. **AC-3 (Performance gegen große Point-Sets):**
   **Given** kitas-2024 (~1700 Punkte), spielplaetze (~2500 Punkte)
   **When** Dichte-Zählung für alle 542 LOR läuft
   **Then** Pipeline-Laufzeit pro LOR unter 5 ms (Spatial-Index oder vorsortierende Strategie)
   **And** ein Performance-Test mit synthetischen 3000-Punkt-Sets verifiziert die Grenze

4. **AC-4 (Konsistenz mit 10.1-10.3):**
   **Given** 10.1 (Kita-Plätze pro Kind), 10.2 (Krankenhaus-Betten), 10.3 (Schulart-Schwellen) sind gelandet
   **When** die Dichte-Umstellung ihre Layer-Konfiguration anpasst
   **Then** Pro-Kopf-Terme aus 10.1 bleiben kompatibel (Dichte-Zählung kann optional durch Kinder-0-6-Einwohner dividieren)
   **And** Kapazitäts-Gewichtung aus 10.2 bleibt kompatibel (Krankenhaus-Betten-Faktor multipliziert Zähl-Gewicht)
   **And** Schulart-Schwellen aus 10.3 bleiben kompatibel (pro Schulart eigener Radius)
   **And** `pnpm test` 100% grün nach der Umstellung

## Tasks / Subtasks

- [ ] **Task 1: Neue Normalisierungsstrategie `poi-density` in `types.ts`** (AC: #1, #2)
  - [ ] 1.1 (RED) `normalize.test.ts`: Test `normalizeDensity(count, cap)` — 0 POIs → weicher Tail (nicht null, nicht 0), `cap` POIs → 100, >cap → 100 (kein Overflow)
  - [ ] 1.2 (RED) `normalize.test.ts`: Test Schwellen-Fallback — kein POI im Radius aber nächster Punkt 10% jenseits → Score > 0 (weicher Tail via optional `nearestM` + `softTailFactor`)
  - [ ] 1.3 (RED) `normalize.test.ts`: Performance-Test mit 3000 Punkten
  - [ ] 1.4 (GREEN) `scripts/lib/kiez-score/types.ts` Z.40-49: neue Variante zur `NormalizationStrategy`-Union ergänzen:
    ```ts
    | {
        kind: 'poi-density';
        radiusM: number;
        /** Anzahl POIs bei der Score = 100 erreicht wird */
        cap: number;
        /** Weicher Tail: falls kein POI im Radius, normalisiert Distanz zum nächsten mit diesem Faktor (0-1) */
        softTailFactor?: number;
      }
    ```
  - [ ] 1.5 (GREEN) `scripts/lib/kiez-score/normalize.ts`: `normalizeDensity(count: number, nearestM: number | null, config: { cap: number; radiusM: number; softTailFactor?: number }): number` implementieren

- [ ] **Task 2: `ScoreInput` um POI-Density-Daten erweitern** (AC: #1, #3)
  - [ ] 2.1 (RED) `compute-score.test.ts`: Test dass `computeDimensionScore` `poiCounts` aus `ScoreInput` liest
  - [ ] 2.2 (GREEN) `scripts/lib/kiez-score/types.ts` Z.76-79: `ScoreInput` um optionales `poiCounts` erweitern:
    ```ts
    /** Ergebnis des räumlichen Radius-Joins, pro Layer-Slug */
    poiCounts?: Record<string, { count: number; nearestM: number | null }>;
    ```
  - [ ] 2.3 `scripts/lib/kiez-score/compute-score.ts` Z.51-96: `normalizeFromHit` um `case 'poi-density'` erweitern, liest `input.poiCounts[weight.layer]`

- [ ] **Task 3: `dimension-config.ts` auf `poi-density` umstellen** (AC: #1, #4)
  - [ ] 3.1 (RED) `dimension-config.test.ts`: Test dass `VERSORGUNG_CONFIG` keine `poi-distance`-Strategie mehr enthält
  - [ ] 3.2 (RED) `dimension-config.test.ts`: Test dass `poi-density`-Configs plausible Radii und Caps haben (kita radiusM ≤ 600, krankenhaus radiusM ≥ 1000)
  - [ ] 3.3 (GREEN) `scripts/lib/kiez-score/dimension-config.ts` Z.72-83: `VERSORGUNG_CONFIG` auf `poi-density` umstellen:
    ```ts
    { layer: 'kitas-2024',        weight: 0.3,  normalize: { kind: 'poi-density', radiusM: 500,  cap: 5,  softTailFactor: 0.3 } },
    { layer: 'schulen-2024',      weight: 0.3,  normalize: { kind: 'poi-density', radiusM: 800,  cap: 3,  softTailFactor: 0.3 } },
    { layer: 'krankenhaeuser-plan', weight: 0.25, normalize: { kind: 'poi-density', radiusM: 2000, cap: 2,  softTailFactor: 0.2 } },
    { layer: 'spielplaetze',      weight: 0.15, normalize: { kind: 'poi-density', radiusM: 400,  cap: 8,  softTailFactor: 0.4 } }
    ```
    Caps sind Schätzwerte. Editorial-Review vor Merge prüfen (AC-4 Kompatibilität 10.1-10.3 koordinieren).

- [ ] **Task 4: Pipeline-Spatial-Join für Dichte** (AC: #1, #3)
  - [ ] 4.1 (RED) Neuer Test in `scripts/lib/kiez-score/` oder `scripts/` für den Radius-Join: zählt Punkte korrekt im Radius, ignoriert Punkte außerhalb, gibt `nearestM` zurück
  - [ ] 4.2 (GREEN) Neues Modul `scripts/lib/kiez-score/poi-radius-join.ts` (< 150 Zeilen):
    - Eingabe: LOR-Centroid-Koordinate (lng/lat), POI-FeatureCollection, `radiusM: number`
    - Ausgabe: `{ count: number; nearestM: number | null }`
    - Verwendet `@turf/distance` oder Haversine inline (kein externer Join-Service)
    - Spatial-Index via geospatiales Vorsortieren (BBox-Filter vor Distanz-Berechnung): LOR-Bounding-Box + radiusM-Puffer als cheap early exit
  - [ ] 4.3 (GREEN) `scripts/lib/kiez-score/pipeline.ts` integriert `poi-radius-join` beim LOR-Loop: baut `poiCounts` für alle `poi-density`-Layer und schreibt in `ScoreInput`
  - [ ] 4.4 Performance-Verify: `pnpm test` mit synthetischem 3000-Punkt-Set < 5 ms pro LOR (aus Task 1.3)

- [ ] **Task 5: Abschluss + Methodik-Update** (AC: #4)
  - [ ] 5.1 Alle bestehenden `compute-score.test.ts`-Tests für Versorgung auf `poiCounts`-Input umschreiben (ersetzen `{ distanceM: ... }` durch `poiCounts`-Struktur)
  - [ ] 5.2 `docs/` Methodik-Update: Versorgung-Abschnitt erklärt Dichte-Ansatz + Radius-Werte + Soft-Tail
  - [ ] 5.3 `pnpm test` 100% grün, `pnpm check` ohne neue Errors

## Dev Notes

### Ist-Zustand (zu ändern)

**`scripts/lib/kiez-score/types.ts` (vollständig gelesen, Z.1-88):**
- `NormalizationStrategy`-Union Z.40-49: enthält `poi-distance` mit `threshold`. Kein `poi-density`.
- `ScoreInput` Z.76-79: hat `layerHits` + `nearestStops`, kein `poiCounts`.

**`scripts/lib/kiez-score/dimension-config.ts` (vollständig gelesen, Z.1-107):**
- `VERSORGUNG_CONFIG` Z.72-83: vier Layer mit `poi-distance`:
  - `kitas-2024` threshold 500 m, weight 0.3
  - `schulen-2024` threshold 800 m, weight 0.3
  - `krankenhaeuser-plan` threshold 2000 m, weight 0.25
  - `spielplaetze` threshold 400 m, weight 0.15
- Diese Konfiguration ist der einzige Änderungs-Scope in `dimension-config.ts` (RUHE_LUFT, GRUEN_HITZE, MOBILITAET, WOHNSCHUTZ bleiben unverändert).

**`scripts/lib/kiez-score/compute-score.ts` (vollständig gelesen, Z.1-257):**
- `normalizeFromHit` Z.51-96: switch auf `normalize.kind`. Case `poi-distance` Z.74-79: liest `distanceM` aus `hit.value` via `readDistanceMeters`.
- `normalizeSyntheticLayer` Z.101-135: verarbeitet `mode-distance` + `presence-any-of`. Kein Handling für `poi-density`.
- `computeDimensionScore` Z.159-222: iteriert `config.layers`, ruft `normalizeFromHit` oder `normalizeSyntheticLayer` je nach `normalize.kind`.

**`scripts/lib/kiez-score/normalize.ts` (vollständig gelesen, Z.1-63):**
- `normalizeDistance` Z.42-47: hartes 0 bei `meters >= threshold`. Das ist der Cliff, den V5 weich machen soll.
- Kein `normalizeDensity`. Neue Funktion muss hinzu.

**Bestehende Tests (Versorgung-Section in `compute-score.test.ts` Z.129-159):**
- Alle drei Tests erwarten `{ distanceM: ... }` als `hit.value`. Diese Tests müssen auf `poiCounts`-Input umgeschrieben werden (Task 5.1).
- Teststruktur: `makeHit(layer, { distanceM: ... })` → nach Umstellung: `poiCounts: { 'kitas-2024': { count: 3, nearestM: 200 } }`.

### Soft-Tail-Konzept (kritische Design-Entscheidung)

Das Problem: Bei 0 POIs im Radius soll Score nicht hart auf 0 fallen. Vorschlag:

```
score = (count / cap) * 100               wenn count >= 1
score = softTailFactor * normalizeDistance(nearestM, radiusM * 2)  wenn count == 0 und nearestM vorhanden
score = 0                                  wenn count == 0 und nearestM null
```

`softTailFactor` dämpft den Wert: ein LOR mit dem nächsten Spielplatz 450 m (Radius 400 m) scort noch ~20% statt 0. Werte: 0.2-0.4 je nach Layer-Priorität. Diese Logik ist in `normalizeDensity` zu kapseln.

**Annahme per CLAUDE.md:** `softTailFactor` aus Task 3.3 sind Schätzwerte. Falls Editorial nach Kalibrierung andere Balance will: Caps + Faktoren in `dimension-config.ts` anpassen, Normalisierungs-Invarianten (`count >= cap → 100`, `count = 0 + nearestM = null → 0`) halten.

### Spatial-Index-Strategie (Performance)

kitas-2024 hat ~1700 Punkte, spielplaetze ~2500. Für 542 LOR = bis zu 1.4M Distanz-Berechnungen pro Layer. Ohne Optimierung zu langsam.

Empfohlene BBox-Vorfilter-Strategie für `poi-radius-join.ts`:
1. Berechne axis-aligned BBox um LOR-Centroid + radiusM-Puffer (in Grad-Annäherung: `radiusM / 111320`).
2. Filtere POI-Liste auf BBox (Array-Scan, O(n) einmalig).
3. Distanz-Haversine nur auf den BBox-Kandidaten.

Alternativ: `@turf/points-within-polygon` oder KD-Tree (z.B. `kdbush`). Prüfen ob `kdbush` bereits im Projekt (kein neues Dependency ohne Rückfrage). Haversine-Inline-Fallback immer als Option.

Grenze: < 5 ms pro LOR bei 3000-Punkt-Set. Performance-Test aus Task 1.3 verifiziert.

### Kompatibilität 10.1-10.3 (kritisch)

10.1 fügt Pro-Kopf-Term für Kitas hinzu: `plätze / kinder-0-6`. Das ist ein separater `LayerWeight` in `VERSORGUNG_CONFIG` (eigener Layer-Slug wie `kitas-prokopf-2024`). Berührt `kitas-2024` nicht direkt. Dichte-Umstellung auf `kitas-2024` ist kompatibel.

10.2 fügt Kapazitäts-Gewichtung für Krankenhäuser hinzu. Falls 10.2 einen eigenen Layer-Slug (`krankenhaeuser-kapazitaet`) einführt: kein Konflikt. Falls 10.2 `krankenhaeuser-plan` mit einem Gewichtungs-Modifier anreichert: Koordination nötig. Vor Start von 10.4 prüfen, wie 10.2 die `LayerWeight`-Struktur erweitert hat.

10.3 differenziert Schulen nach Schulart. Falls 10.3 `schulen-2024` auf mehrere Sub-Layer splittet (`schulen-grundschule-2024`, `schulen-weiterfuehrend-2024`): `VERSORGUNG_CONFIG` in 10.4 muss diese Slugs kennen. Koordination vor Merge.

**Fazit:** 10.4 darf erst gemergt werden, nachdem 10.1-10.3 ihre finalen Layer-Slugs in `dimension-config.ts` geschrieben haben.

### Was nicht brechen darf

- `RUHE_LUFT_CONFIG`, `GRUEN_HITZE_CONFIG`, `MOBILITAET_CONFIG`, `WOHNSCHUTZ_CONFIG`: kein Anfassen.
- `computeKiezScore`, `computeOverallScore`: generisch, kein Anfassen.
- `normalizeSyntheticLayer`: kein Anfassen (Mobilität + Wohnschutz nutzen sie).
- `aggregate-to-larger-region.test.ts`: nicht betroffen, bleibt grün.
- `pnpm check` darf keine neuen Errors erzeugen (nur die pre-existing i18n-Errors aus 9.1 bleiben).

### Architektur-Compliance

- **MUST #2:** Dateien < 500 Zeilen. `poi-radius-join.ts` als eigenes Modul (Task 4.2), nicht in `pipeline.ts` einbetten.
- **MUST #7:** TS strict, kein `any`. `poiCounts: Record<string, { count: number; nearestM: number | null }>` ist typsicher.
- **MUST #6:** Kein Kommentar außer non-obvious WHY. Soft-Tail-Logik braucht kurzen WHY-Kommentar.
- **MUST #15 (editorial):** Kein neuer Score-Input ohne Besser-Richtung. Dichte hat eindeutige Besser-Richtung (mehr POIs im Radius = besser). Kein ADR-Konflikt.

### POI-Layer-Slugs (aus `scripts/lib/sources.ts`)

- `kitas-2024`: Z.328-337, kind `fis-broker`, `kita:kita`, ~1700 Punkte, Feld `e_platz` (10.1 nutzt es)
- `schulen-2024`: Z.339-348, `schulen:schulen`, Feld `schulart` (10.3 nutzt es)
- `krankenhaeuser-plan`: Z.360-370, `krankenhaeuser:plankrankenhaeuser`, Felder `betten`/`fachabteilungen` (10.2 nutzt sie)
- `spielplaetze`: Z.405-416, `gruenanlagen:spielplaetze`, ~2500 Polygone (Centroid für Distanz)

### Previous Story Intel

- **Story 9.1:** Versorgung-Config (`VERSORGUNG_CONFIG`) ist die aktuell gültige Quelle. Grünanlagen sind nach 9.1 in Grün & Hitze. `poi-distance` ist die aktuelle Strategie.
- **Story 8.2c (`8-2c-point-layer-density-count.md`):** Implementiert Dichte-Zählung für Inspector-Anzeige. Prüfen ob dort bereits ein Radius-Join-Utility existiert, das wiederverwendet werden kann (CLAUDE.md: vor neuem Code existierende Utilities prüfen).
- **Audit V5 (`_user-input/datenaufloesung-audit-2026-05-21.md` Z.169-172):** Quell-Anforderung für diese Story. "Behebt den zweiter-Punkt-zählt-0-Effekt."
- **Audit Score-Normalisierung (`_user-input/datenaufloesung-audit-2026-05-21.md` Z.111-119):** Dokumentiert den harten Cliff. `normalizeDistance` Z.45-46 in `normalize.ts`: `if (meters >= threshold) return 0` — das ist der Bug.

### Open Questions vor Start

1. Wie hat 10.2 die `LayerWeight`-Struktur für Krankenhaus-Kapazität erweitert? Eigener Slug oder Modifier auf `krankenhaeuser-plan`?
2. Wie hat 10.3 Schulart-Differenzierung implementiert? Eigene Sub-Layer-Slugs oder ein Multi-Value-Mapping auf `schulen-2024`?
3. Existiert in `scripts/lib/` bereits ein Spatial-Utility für Radius-Joins aus Story 8.2c? `find scripts/lib -name "*.ts" | xargs grep -l "radius\|distance\|haversine"` vor Task 4.2 laufen lassen.

## References

- `scripts/lib/kiez-score/types.ts` (NormalizationStrategy-Union Z.40-49, ScoreInput Z.76-79)
- `scripts/lib/kiez-score/normalize.ts` (normalizeDistance Z.42-47, Cliff-Logik)
- `scripts/lib/kiez-score/dimension-config.ts` (VERSORGUNG_CONFIG Z.72-83)
- `scripts/lib/kiez-score/compute-score.ts` (normalizeFromHit Z.51-96, poi-distance case Z.74-79)
- `scripts/lib/kiez-score/compute-score.test.ts` (Versorgung-Tests Z.129-159, umzuschreiben)
- `scripts/lib/sources.ts` (kitas-2024 Z.328, schulen-2024 Z.339, krankenhaeuser-plan Z.360, spielplaetze Z.405)
- `_user-input/datenaufloesung-audit-2026-05-21.md` (V5 Z.169-172, Score-Normalisierung Z.111-119)
- `_bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md` (Format-Vorbild, Wohnschutz-Pattern)
- `_bmad-output/implementation-artifacts/8-2c-point-layer-density-count.md` (potenzielle Spatial-Utility-Wiederverwendung)
- `docs/adr/ADR-012-tdd-mandate.md`
- `docs/adr/ADR-015-score-composition-umwelt-infra.md`

## Dev Agent Record

### Agent Model Used

_leer_

### Debug Log References

_leer_

### Completion Notes List

_leer_

### File List

_leer_

## Change Log

- 2026-05-21: Story 10.4 erstellt (POI-Score von Distanz auf Dichte). Basis: Audit V5 + Ist-Zustand aus gelesenen Quell-Dateien.
