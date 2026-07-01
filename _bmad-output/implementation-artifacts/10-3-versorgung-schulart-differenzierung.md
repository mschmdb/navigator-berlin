# Story 10.3: Versorgung · Schulart-Differenzierung (V3)

Status: done

> **Umsetzung (Abweichung von Story-Plan):** Statt `poi-distance-by-schulart`-Strategy (die am Single-Nearest-Hit scheitert) wurden Schulen beim Build nach Schulart in zwei POI-Layer gesplittet (schulen-grundschule 600m / schulen-weiterfuehrend 1200m), je 0.15. Nutzt bestehendes poi-distance, korrekter (nächste Grundschule UND nächste weiterführende getrennt). classifySchulart: nur exakt „Grundschule" → grundschule. 2008/2008 grün, 0 Type-Errors. schul-supply.ts(+test), dimension-config, build-kiez-scores, Methodik.

> **Anker:** ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`, TDD-Mandat). ADR-015 (`docs/adr/ADR-015-score-composition-umwelt-infra.md`, Score-Komposition) definiert Versorgung als eine von fünf gleichgewichteten Dimensionen (0.20). Diese Story verfeinert den Schul-Term innerhalb `VERSORGUNG_CONFIG` ohne die Dimension selbst umzubauen. **Hard-Dependency auf Epic-9-Abschluss:** `dimension-config.ts` muss den Epic-9-Stand zeigen (kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15). Kein Merge-Konflikt-Risiko mit 10.0 (nutzt nur das Feld `schulart`, kein eigener Layer-Import).

## Story

As a Familie,
I want dass Grundschul-Nähe anders zählt als Gymnasium-Nähe,
so that der Versorgungs-Score zur Lebensphase passt.

## Kontext

`schulen-2024` (WFS `schulen:schulen`) liefert das Feld `schulart` mit den Werten `Grundschule`, `ISS`, `Gymnasium`, `Förder`. Im Datensatz gibt es keine Schülerzahl und keine Kapazität (Audit `_user-input/datenaufloesung-audit-2026-05-21.md`, Zeilen 39-49). Aktuell fließen alle Schulen als ein einziger `poi-distance`-Term mit Schwelle 800m in den Score. Das ist blind für den Unterschied: eine Grundschule in 800m ist für Familien mit Grundschulkindern existenziell, ein Gymnasium in der gleichen Distanz optional. Die Differenzierung schärft die Score-Aussage ohne neue Daten zu benötigen.

**Aktueller Stand `VERSORGUNG_CONFIG` (nach Epic 9, `scripts/lib/kiez-score/dimension-config.ts`, Zeilen 72-84):**

```ts
export const VERSORGUNG_CONFIG: DimensionConfig = {
    dimension: 'versorgung',
    layers: [
        { layer: 'kitas-2024',          weight: 0.3,  normalize: { kind: 'poi-distance', threshold: 500 } },
        { layer: 'schulen-2024',         weight: 0.3,  normalize: { kind: 'poi-distance', threshold: 800 } },
        { layer: 'krankenhaeuser-plan',  weight: 0.25, normalize: { kind: 'poi-distance', threshold: 2000 } },
        { layer: 'spielplaetze',         weight: 0.15, normalize: { kind: 'poi-distance', threshold: 400 } }
    ]
};
```

**Ziel:** Den `schulen-2024`-Term (0.30) in zwei Sub-Terme aufteilen: Grundschule (0.15, Schwelle 600m) und Weiterführend (0.15, Schwelle 1200m). Gewichtssumme der vier Versorgungsfelder bleibt 1 (0.30 + 0.30 + 0.25 + 0.15 = 1.00).

## Acceptance Criteria

1. **AC-1 (Schulart-Mapping):**
   **Given** `schulen-2024`-Layer-Hits mit Feld `schulart`
   **When** der Score die Hits verarbeitet
   **Then** gilt:
   - `Grundschule` zählt als Grundschul-Term (Schwelle 600m)
   - `ISS`, `Gymnasium` zählen als Weiterführend-Term (Schwelle 1200m)
   - `Förder` zählt als Weiterführend-Term (Schwelle 1200m)
   - Unbekannte oder fehlende Schulart zählt als Weiterführend-Term (neutraler Default, Schwelle 1200m)

2. **AC-2 (Getrennte Distanz-Schwellen):**
   **Given** eine Schule vom Typ `Grundschule` in 500m und eine ISS in 1000m
   **When** `computeDimensionScore` für `VERSORGUNG_CONFIG` läuft
   **Then** wird der Grundschul-Term positiv bewertet (500m < 600m) und der ISS-Term positiv bewertet (1000m < 1200m)
   **And** beide Terme tragen mit Gewicht 0.15 zum Versorgungsscore bei

3. **AC-3 (Gewichtssumme stabil):**
   **Given** die geänderte `VERSORGUNG_CONFIG`
   **When** die internen Layer-Gewichte summiert werden
   **Then** ergibt die Summe 1.0 (kitas 0.30 + grundschule 0.15 + weiterfuehrend 0.15 + krankenhaeuser 0.25 + spielplaetze 0.15 = 1.00)
   **And** das Gesamt-Dimensionsgewicht (`DIMENSION_WEIGHTS.versorgung`) bleibt 0.20

4. **AC-4 (Unbekannte Schulart fällt auf Default):**
   **Given** ein Hit mit `schulart` = `""` oder `undefined` oder einem unbekannten Wert
   **When** das Schulart-Mapping ausgeführt wird
   **Then** zählt der Hit als Weiterführend (neutraler Default)
   **And** kein Fehler wird geworfen

5. **AC-5 (TDD, Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** `pnpm test:unit --reporter=verbose` läuft
   **Then**:
   - Schulart-Mapping-Funktion ist unit-getestet (alle vier Schularten + unbekannt)
   - Getrennte Schwellen sind getestet (Grundschule 600m, Weiterführend 1200m)
   - `VERSORGUNG_CONFIG`-Gewichtssumme = 1 in `dimension-config.test.ts` bleibt grün
   - `computeDimensionScore`-Versorgungstest in `compute-score.test.ts` deckt Schulart-Differenzierung ab
   - Alle 81 bestehenden Modul-Tests laufen weiter grün (kein Regression)

## Tasks / Subtasks

- [ ] **Task 1: NormalizationStrategy erweitern** (AC: #1, #2)
  - [ ] 1.1 (RED) Test in `normalize.test.ts`: `normalizeSchulart` mit allen vier Schulart-Werten + unbekannt
  - [ ] 1.2 (RED) Test in `normalize.test.ts`: Mapping-Tabelle liefert korrekte Schwelle (`SCHULART_THRESHOLD`)
  - [ ] 1.3 (GREEN) `scripts/lib/kiez-score/normalize.ts`: Funktion `mapSchulartToThreshold(schulart: unknown): number` exportieren
    - `Grundschule` → 600
    - `ISS` | `Gymnasium` | `Förder` | unbekannt/leer → 1200
  - [ ] 1.4 Verify RED → GREEN (Commit mit Failing-Log + Passing-Log)

- [ ] **Task 2: Neue NormalizationStrategy `poi-distance-by-schulart`** (AC: #1, #2)
  - [ ] 2.1 (RED) `dimension-config.test.ts`: erwartet zwei Sub-Terme `schulen-grundschule` und `schulen-weiterfuehrend` in `VERSORGUNG_CONFIG`
  - [ ] 2.2 (RED) `compute-score.test.ts`: Versorgungstest mit getrennten Schulart-Hits
  - [ ] 2.3 (GREEN) `scripts/lib/kiez-score/types.ts`: neue Strategie-Variante hinzufügen:
    ```ts
    | { kind: 'poi-distance-by-schulart'; grundschule: number; weiterfuehrend: number }
    ```
  - [ ] 2.4 (GREEN) `scripts/lib/kiez-score/compute-score.ts`: Case `poi-distance-by-schulart` in `normalizeFromHit` ergänzen, ruft `mapSchulartToThreshold` auf Hit-Prop `schulart`, dann `normalizeDistance`
  - [ ] 2.5 Verify alle Tests grün

- [ ] **Task 3: VERSORGUNG_CONFIG umstellen** (AC: #2, #3)
  - [ ] 3.1 (RED) `dimension-config.test.ts`: Test ergänzen, der prüft dass kein einzelner `schulen-2024`-Eintrag mehr da ist, stattdessen `schulen-grundschule` (0.15) und `schulen-weiterfuehrend` (0.15)
  - [ ] 3.2 (GREEN) `scripts/lib/kiez-score/dimension-config.ts`: `VERSORGUNG_CONFIG` umschreiben:
    ```ts
    { layer: 'kitas-2024',             weight: 0.30, normalize: { kind: 'poi-distance', threshold: 500 } },
    { layer: 'schulen-grundschule',    weight: 0.15, normalize: { kind: 'poi-distance-by-schulart', grundschule: 600, weiterfuehrend: 1200 } },
    { layer: 'schulen-weiterfuehrend', weight: 0.15, normalize: { kind: 'poi-distance-by-schulart', grundschule: 600, weiterfuehrend: 1200 } },
    { layer: 'krankenhaeuser-plan',    weight: 0.25, normalize: { kind: 'poi-distance', threshold: 2000 } },
    { layer: 'spielplaetze',           weight: 0.15, normalize: { kind: 'poi-distance', threshold: 400 } }
    ```
    - `schulen-grundschule`: filtert Hits wo `schulart === 'Grundschule'`, nutzt Schwelle 600m
    - `schulen-weiterfuehrend`: filtert Hits wo `schulart` nicht `Grundschule`, nutzt Schwelle 1200m
  - [ ] 3.3 Gewichtssumme-Invariante in `dimension-config.test.ts` prüfen (0.30+0.15+0.15+0.25+0.15 = 1.00)
  - [ ] 3.4 Verify alle 81+ Tests grün

- [ ] **Task 4: compute-score Hit-Routing für virtuelle Layer-Slugs** (AC: #1, #2, #4)
  - [ ] 4.1 `compute-score.ts`: `hitFor`-Funktion erfordert keine Änderung, aber die neue `poi-distance-by-schulart`-Case-Logik muss den richtigen Schwellenwert pro virtuellem Layer-Slug wählen
  - [ ] 4.2 Interner Filter in Case `poi-distance-by-schulart`: `schulen-grundschule` liest nur Hits mit `schulart === 'Grundschule'`, `schulen-weiterfuehrend` liest Hits ohne `Grundschule`-Wert
  - [ ] 4.3 Leerer Hit-Satz (keine Schule im Polygon) → `missingData` enthält `schulen-grundschule` oder `schulen-weiterfuehrend`, kein Fehler
  - [ ] 4.4 (RED) Edge-case-Test: `schulart` fehlt komplett im Hit → Default Weiterführend

- [ ] **Task 5: Modul-Tests finalisieren + Regression-Check** (AC: #5)
  - [ ] 5.1 Alle bestehenden Tests in `compute-score.test.ts` auf neue Config-Namen anpassen (falls nötig)
  - [ ] 5.2 `pnpm test:unit` vollständig grün (kein Skip)
  - [ ] 5.3 Completion-Note mit Test-Count + Coverage-Stand

## Dev Notes

### Ist-Zustand (gelesene Dateien)

**`scripts/lib/kiez-score/dimension-config.ts` (Zeilen 72-84, Stand nach Epic 9):**

```ts
export const VERSORGUNG_CONFIG: DimensionConfig = {
    dimension: 'versorgung',
    layers: [
        { layer: 'kitas-2024',          weight: 0.3,  normalize: { kind: 'poi-distance', threshold: 500 } },
        { layer: 'schulen-2024',         weight: 0.3,  normalize: { kind: 'poi-distance', threshold: 800 } },
        { layer: 'krankenhaeuser-plan',  weight: 0.25, normalize: { kind: 'poi-distance', threshold: 2000 } },
        { layer: 'spielplaetze',         weight: 0.15, normalize: { kind: 'poi-distance', threshold: 400 } }
    ]
};
```

**`scripts/lib/kiez-score/types.ts` (Zeilen 40-49) `NormalizationStrategy`-Union:**

```ts
export type NormalizationStrategy =
    | { kind: 'ordinal-3'; field: string }
    | { kind: 'ordinal-4'; field: string }
    | { kind: 'mss-status-4'; field: string }
    | { kind: 'presence' }
    | { kind: 'mode-distance'; mode: Modus; threshold: number }
    | { kind: 'presence-any-of'; layers: string[] }
    | { kind: 'poi-distance'; threshold: number }
    | { kind: 'numeric-inverted'; field: string; bestAt: number; worstAt: number };
```

**`scripts/lib/kiez-score/compute-score.ts` (Zeilen 51-96) `normalizeFromHit`:** Switch über `normalize.kind`. Neue Case `poi-distance-by-schulart` wird hier ergänzt.

**`scripts/lib/kiez-score/normalize.ts` (Zeilen 42-47) `normalizeDistance`:** Generisch, keine Änderung. Neue Export-Funktion `mapSchulartToThreshold` kommt dazu.

**`scripts/lib/sources.ts` (Zeilen 339-348) `schulen-2024`:** Source-URL `schulen:schulen`, Feld `schulart` liefert `Grundschule`/`ISS`/`Gymnasium`/`Förder`. Keine Schülerzahl vorhanden (Audit Zeilen 41-49).

### Architektur-Entscheidungen für diese Story

**Virtuelle Layer-Slugs statt neuer echter Layer:**
Der Layer `schulen-2024` bleibt unverändert in `sources.ts`. Die Config-Ebene führt zwei virtuelle Slugs ein: `schulen-grundschule` und `schulen-weiterfuehrend`. Diese Slugs existieren nicht in `sources.ts`, sondern sind Alias-Terme für denselben physischen Layer. `compute-score.ts` leitet den `poi-distance-by-schulart`-Case vom Schulart-Wert im Hit ab, nicht von zwei separaten Layer-Quellen.

Dieses Muster ist analog zu `radverkehr-presence` (virtueller Slug, der `presence-any-of` auf reale Slugs mapped). Bevorzugt gegenüber zwei echten Quell-Layern, weil der WFS-Pull einmalig bleibt.

**Gewichtsaufteilung:** Der bisherige Schul-Term (0.30) wird symmetrisch geteilt (je 0.15). Begründung: Ohne Bevölkerungsstruktur-Daten wäre eine Vorabgewichtung zugunsten einer Schulform editorial unbegründet. Sollte eine spätere Story LOR-Alterskohorten integrieren, kann die Balance angepasst werden.

**Default für unbekannte Schulart:** Weiterführend (1200m) statt Grundschule (600m), weil der strengere Schwellenwert bei der Grundschule eine Unterschätzung verursachen würde (falsches Negativ). Der großzügigere Schwellenwert ist der sichere Default.

### Was nicht brechen darf

- `pnpm test:unit`: alle 81 bestehenden Modul-Tests in `scripts/lib/kiez-score/` laufen weiter grün
- `DIMENSION_WEIGHTS` Summe = 1 (5 × 0.20): kein Eingriff in `types.ts` nötig
- `VERSORGUNG_CONFIG`-Gewichtssumme = 1.00 (0.30 + 0.15 + 0.15 + 0.25 + 0.15): `dimension-config.test.ts` Zeile 45-49 prüft das generisch für alle Configs
- `compute-score.test.ts` Zeile 145-148: Test erwartet dass `schulen-2024` nicht mehr als einziger Slug vorkommt. Dieser Test muss auf die neuen virtuellen Slugs angepasst werden.
- Repo-weiter `pnpm check`: Nach Epic 9 grün (AC-5 in 9.1). Diese Story darf keine neuen Type-Errors einführen.

### Code-Grounding (Datei:Zeile)

| Datei | Zeile | Relevanz |
|-------|-------|----------|
| `scripts/lib/kiez-score/dimension-config.ts` | 72-84 | `VERSORGUNG_CONFIG` (schulen-2024 → zwei Terme) |
| `scripts/lib/kiez-score/types.ts` | 40-49 | `NormalizationStrategy`-Union (neue Variante ergänzen) |
| `scripts/lib/kiez-score/compute-score.ts` | 51-96 | `normalizeFromHit` switch (neuer Case) |
| `scripts/lib/kiez-score/compute-score.ts` | 170-174 | synthetic-Layer-Check (mode-distance/presence-any-of): neuer kind muss hier NICHT aufgeführt werden, weil `poi-distance-by-schulart` direkt einen `layerHit` liest |
| `scripts/lib/kiez-score/normalize.ts` | 42-47 | `normalizeDistance` (unverändert nutzen) |
| `scripts/lib/sources.ts` | 339-348 | `schulen-2024` Source-Definition (kein Eingriff) |
| `scripts/lib/kiez-score/compute-score.test.ts` | 129-158 | Versorgungstests (auf neue Slugs anpassen) |
| `scripts/lib/kiez-score/dimension-config.test.ts` | 41-50 | Gewichtssummen-Test (muss weiter grün sein) |
| `_user-input/datenaufloesung-audit-2026-05-21.md` | 39-49 | Befund: kein Kapazitätsfeld, `schulart` vorhanden |

### Schwellenwert-Begründung

| Schulart-Gruppe | Schwelle | Rationale |
|----------------|----------|-----------|
| Grundschule | 600m | Gehweg ~8 min für Kind; Einschulbereiche in Berlin typisch 500-800m |
| ISS / Gymnasium | 1200m | Weiterführende Schulen haben größeres Einzugsgebiet, ÖPNV-Nutzung ab 10 J. üblich |
| Förder | 1200m | Kleinere Gesamtzahl, Fahrservice üblich; konservative Schwelle |
| unbekannt/leer | 1200m | Sicherer Default (kein falsches Negativ durch zu engen Schwellenwert) |

Diese Schwellen sind ein begründeter Ausgangswert. Falls Editorial andere Werte wünscht, stehen sie als benannte Konstanten in `dimension-config.ts` (analog `MOBILITAET_DISTANCE_THRESHOLD_M`, Zeile 36).

### Architektur-MUST-Rules (aus architecture.md)

- #2: Dateien unter 500 Zeilen. `dimension-config.ts` ist 108 Zeilen, bleibt nach Umbau unter 130.
- #6: Keine Kommentare außer non-obvious WHY. Die Schwellenwert-Konstanten brauchen einen Kommentar.
- #7: TS strict, kein `any`. Neue Funktion `mapSchulartToThreshold(schulart: unknown): number` behandelt `unknown`.
- #15: Editorial-Verantwortung. Keine Richtungsumkehr der Score-Semantik.

### Previous Story Intelligence

- **Story 9.1** (Completion Note, `9-1-score-dimensions-foundation.md`): `VERSORGUNG_CONFIG` ist auf kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15 fixiert. Grünanlagen sind nach Grün & Hitze gewandert. Diese Config ist der Startpunkt für 10.3.
- **Story 1.28** (Kiez-Score Foundation): `normalizeDistance` generisch implementiert, bleibt unverändert. `poi-distance`-Pattern ist der Vorläufer.
- **Audit `_user-input/datenaufloesung-audit-2026-05-21.md`, Zeile 49:** "Keine Schülerzahl/Kapazität im Datensatz" bestätigt, dass kapazitätsbasierte Gewichtung (V1-Analog für Schulen) nicht möglich ist.
- **Memory `project_kiez_score_dimensions`:** Nach Epic 9 aktuell (5 Dimensionen, `versorgung` = 0.20). Kein Konflikt.

### TDD-Hinweis (ADR-012)

Schulart-Mapping und Schwellen-Routing sind Business Logic. Test-First ist Pflicht. Reihenfolge:

1. `normalize.test.ts`: `mapSchulartToThreshold` RED
2. `normalize.ts`: Funktion implementieren GREEN
3. `dimension-config.test.ts`: neue Slugs RED
4. `types.ts`: neue Strategy RED, `compute-score.ts`: neue Case GREEN
5. `dimension-config.ts`: `VERSORGUNG_CONFIG` umbasteln GREEN
6. `compute-score.test.ts`: Versorgungstest auf neue Slugs anpassen GREEN

Commit nach jedem RED-GREEN-Paar, damit die failing-then-passing History nachvollziehbar ist.

## References

- `scripts/lib/kiez-score/dimension-config.ts` (Zeilen 72-84, VERSORGUNG_CONFIG)
- `scripts/lib/kiez-score/types.ts` (Zeilen 40-49, NormalizationStrategy)
- `scripts/lib/kiez-score/compute-score.ts` (Zeilen 51-96, normalizeFromHit)
- `scripts/lib/kiez-score/normalize.ts` (normalizeDistance, neue mapSchulartToThreshold)
- `scripts/lib/sources.ts` (Zeilen 339-348, schulen-2024)
- `scripts/lib/kiez-score/compute-score.test.ts` (Zeilen 129-158, Versorgungstests)
- `scripts/lib/kiez-score/dimension-config.test.ts` (Zeilen 41-50, Gewichtssummen)
- `_user-input/datenaufloesung-audit-2026-05-21.md` (Zeilen 39-49, schulen-Befund)
- `docs/adr/ADR-012-tdd-mandate.md`
- `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md`
- `_bmad-output/planning-artifacts/epics.md` (Zeilen 3468-3482, Story 10.3)

## Dev Agent Record

### Agent Model Used

_leer_

### Debug Log References

_leer_

### Completion Notes List

_leer_

### File List

**Zu ändern (Implementation):**

- `scripts/lib/kiez-score/normalize.ts` (neue Funktion `mapSchulartToThreshold`)
- `scripts/lib/kiez-score/types.ts` (neue Strategie `poi-distance-by-schulart` in `NormalizationStrategy`)
- `scripts/lib/kiez-score/compute-score.ts` (neuer Case in `normalizeFromHit`)
- `scripts/lib/kiez-score/dimension-config.ts` (`VERSORGUNG_CONFIG`: schulen-2024 → zwei Terme)

**Zu ändern (Tests):**

- `scripts/lib/kiez-score/normalize.test.ts` (neue Tests für `mapSchulartToThreshold`)
- `scripts/lib/kiez-score/compute-score.test.ts` (Versorgungstest auf neue Slugs anpassen)
- `scripts/lib/kiez-score/dimension-config.test.ts` (neue Slugs in VERSORGUNG_CONFIG prüfen)

## Change Log

_leer_
