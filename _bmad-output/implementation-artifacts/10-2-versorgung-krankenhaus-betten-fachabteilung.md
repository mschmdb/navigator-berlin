# Story 10.2: Versorgung · Krankenhaus nach Betten/Fachabteilung (V2)

Status: done

> **Umsetzung:** capacity-weighted-distance-Normalisierung (Distanz × Faktor 0.5+0.3·Betten+0.2·Fach). parseBettenCapacity (string/int→null-safe), maxBetten 1500. krankenhaeuser-plan über pointValueLayers geroutet (Hit trägt distanceM + betten_insgesamt; build-helpers buildNearestPointValueHits führt jetzt distanceM mit). plan-Layer hat kein fachabteilungen-Feld → optional weggelassen. Score neu berechnet, 2003/2003 grün, 0 Type-Errors. Methodik-Satz aktualisiert.

> **Anker:** ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`, TDD-Pflicht). ADR-013 (`docs/adr/ADR-013-score-aggregation-strategy.md`, Aggregations-Strategie A). ADR-015 (`docs/adr/ADR-015-score-composition-umwelt-infra.md`, Score-Dimensionen + VERSORGUNG_CONFIG). Diese Story erweitert `VERSORGUNG_CONFIG` in `scripts/lib/kiez-score/dimension-config.ts` um eine kapazitätsgewichtete Krankenhaus-Normalisierung. Sie ist ein **Standalone-Verbesserungs-Ticket** innerhalb von Epic 10 und setzt stabilen Epic-9-Abschluss voraus.

**Abhängigkeiten:**

- **Harte Voraussetzung (Read-Only-Nutzung):** Epic 9 vollständig abgeschlossen. Die `VERSORGUNG_CONFIG` in `dimension-config.ts` enthält nach Epic 9 `krankenhaeuser-plan` mit Gewicht 0.25 und `normalize: { kind: 'poi-distance', threshold: 2000 }` (Zeile 78-81). Merge-Konflikt in `dimension-config.ts` droht, wenn Epic 9 noch läuft.
- **Keine Abhängigkeit von Story 10.0:** Felder `betten_insgesamt`, `betten`, `fachabteilungen` sind im WFS bereits vorhanden (Audit 2026-05-21, `_user-input/datenaufloesung-audit-2026-05-21.md` Zeile 54-60). Story 10.0 (WFS-Feld-Erweiterung) ist kein Blocker.
- **Layer-Slugs:** `krankenhaeuser-plan` (TypeName `plankrankenhaeuser`, Feld `betten_insgesamt` als string) + `krankenhaeuser-weitere` (TypeName `weitere_krankenhaeuser`, Felder `betten` als int + `fachabteilungen`). Beide Slugs in `scripts/lib/sources.ts` Zeilen 361-381.

---

## Story

As a User,
I want dass ein großes Versorgungs-Klinikum stärker zählt als eine kleine Fachklinik,
so that der Versorgungs-Score reale Kapazität abbildet statt nur Distanz.

## Acceptance Criteria

1. **AC-1 (Kapazitätsgewichtung im Score):**
   **Given** `betten_insgesamt` (string, TypeName `plankrankenhaeuser`) und `betten` (int, TypeName `weitere_krankenhaeuser`) sowie `fachabteilungen` sind im Feature-Hit vorhanden
   **When** der Krankenhaus-Term den Distanz-Score berechnet
   **Then** fließt die normalisierte Bettenkapazität als Multiplikator in den Distanz-Score ein: ein Krankenhaus mit mehr Betten erzielt bei gleicher Distanz einen höheren Beitrag als ein kleineres
   **And** `fachabteilungen` erhöht den Beitrag zusätzlich, sofern das Feld vorhanden ist
   **And** der kombinierte Beitrag bleibt im Wertebereich 0-100

2. **AC-2 (Einheitliches Betten-Parsing):**
   **Given** `betten_insgesamt` ist ein string (z.B. `"350"`, `"1200"`, `""`, `null`) bei `krankenhaeuser-plan`
   **And** `betten` ist ein int (oder fehlt) bei `krankenhaeuser-weitere`
   **When** die Parsing-Funktion aufgerufen wird
   **Then** liefert sie für beide Felder eine Zahl oder `null` (bei leerem String, `null`, `undefined`, nicht-numerischem String)
   **And** ein valider numerischer String (`"350"`) wird zu `350` (number) geparst
   **And** eine negative Zahl oder `0` gibt `null` zurück (semantisch ungültige Kapazität)

3. **AC-3 (Missing-Data-Robustheit):**
   **Given** ein Krankenhaus-Hit ohne Bettenfeld (Feld fehlt oder `null`)
   **When** der Score berechnet wird
   **Then** fällt die Normalisierung auf reinen Distanz-Score zurück (kein Absturz, kein `null`-Beitrag wegen fehlendem Kapazitätsfeld)
   **And** `missingData` enthält keinen Eintrag für den Krankenhaus-Layer, wenn Distanz vorhanden ist

4. **AC-4 (TDD, Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** Tests in `scripts/lib/kiez-score/*.test.ts` laufen
   **Then** decken neue Tests ab:
   - Parsing `betten_insgesamt` (string): valide Zahlen, leerer String, `null`, negativer Wert
   - Parsing `betten` (int): valider int, `0`, `null`
   - Gewichtungslogik: großes Krankenhaus (viele Betten) scort bei gleicher Distanz höher als kleines
   - `fachabteilungen`: vorhanden erhöht Score, fehlend fällt auf Basis-Distanz zurück
   - Missing-Data: kein Betten-Feld, Distanz vorhanden → kein missingData-Eintrag
   **And** alle Tests folgen Red (Failing-First nachvollziehbar im Commit) → Green

5. **AC-5 (Scope-Gate):**
   **Given** die Änderung liegt ausschließlich in `scripts/lib/kiez-score/`
   **When** Story abgeschlossen ist
   **Then** kompiliert das Modul (`tsc --noEmit` auf `scripts/lib/kiez-score/`)
   **And** `pnpm test:unit` bleibt 100% grün (alle bestehenden + neue Tests)
   **And** repo-weiter `pnpm check` bleibt grün (diese Story bricht keine Typ-Inferenz außerhalb des Moduls)

---

## Tasks / Subtasks

- [ ] **Task 1: Parsing-Funktion für Betten-Felder** (AC: #2)
  - [ ] 1.1 (RED) `normalize.test.ts`: neuen `describe('parseBettenCapacity')`-Block ergänzen
    - Cases: `"350"` → 350, `""` → null, `null` → null, `"abc"` → null, `0` → null, `-5` → null, `350` (int) → 350
    - Sicherstellen, dass Tests failen (`pnpm test:unit`, log nach `/tmp/vitest-10-2-red.log`)
  - [ ] 1.2 (GREEN) `scripts/lib/kiez-score/normalize.ts`: `parseBettenCapacity(value: unknown): number | null` ergänzen
    - Akzeptiert string und number, verwirft `<= 0`, parst string via `parseInt` mit Radix 10
    - Datei bleibt unter 500 Zeilen (aktuell 64 Zeilen, unkritisch)
  - [ ] 1.3 Verify Tests grün

- [ ] **Task 2: Neue Normalisierungs-Strategie für kapazitätsgewichtete POI-Distanz** (AC: #1, #3)
  - [ ] 2.1 (RED) `normalize.test.ts`: `describe('normalizeCapacityWeightedDistance')`-Block
    - Case: Distanz 500m, threshold 2000m, Betten 1000, maxBetten 1500, Fachabteilungen 10, maxFachabteilungen 20 → erwarteter Wert (vorher berechnen)
    - Case: Distanz 500m, threshold 2000m, Betten null, Fachabteilungen null → fallback reiner Distanz-Score
    - Case: Distanz >= threshold → 0 unabhängig von Kapazität
    - Case: Distanz 0 mit Maximalkapazität → 100
  - [ ] 2.2 (GREEN) `scripts/lib/kiez-score/normalize.ts`: `normalizeCapacityWeightedDistance` ergänzen
    - Signatur: `(distanceM: number | null, threshold: number, betten: number | null, maxBetten: number, fachabteilungen: number | null, maxFachabteilungen: number): number | null`
    - Logik: Distanz-Score (0-100) × Kapazitäts-Faktor (0.5 + 0.3 × betten/maxBetten + 0.2 × fachabteilungen/maxFachabteilungen), geclampmt auf 0-100
    - Fehlender Betten-Wert: Kapazitäts-Faktor = 0.5 (neutral, kein Boost, kein Abzug)
    - Fehlende Fachabteilungen: Fachabteilungs-Anteil = 0
  - [ ] 2.3 `NormalizationStrategy` in `scripts/lib/kiez-score/types.ts`: neuen Kind-Zweig ergänzen:
    ```ts
    | {
        kind: 'capacity-weighted-distance';
        threshold: number;
        bettenField: string;
        maxBetten: number;
        fachabteilungenField?: string;
        maxFachabteilungen?: number;
      }
    ```
  - [ ] 2.4 Verify Tests grün

- [ ] **Task 3: compute-score.ts Dispatch für neuen Kind** (AC: #1, #3)
  - [ ] 3.1 (RED) `compute-score.test.ts`: neuen `describe('computeDimensionScore — Versorgung mit Kapazitäts-Gewichtung')`-Block
    - Case: großes Krankenhaus (1200 Betten, 18 Fachabteilungen, 500m) vs. kleines (80 Betten, 2 Fachabteilungen, 500m) → großes scort höher
    - Case: Krankenhaus ohne `betten_insgesamt` → kein missingData-Eintrag, nur Distanz-Fallback
    - Case: Distanz > threshold → 0
  - [ ] 3.2 (GREEN) `scripts/lib/kiez-score/compute-score.ts`: `case 'capacity-weighted-distance'` in `normalizeFromHit` ergänzen
    - `parseBettenCapacity` auf `getProp(hit.value, normalize.bettenField)` anwenden
    - Falls `normalize.fachabteilungenField`: `getProp(hit.value, normalize.fachabteilungenField)` als `number | null` lesen
    - `normalizeCapacityWeightedDistance` aufrufen
  - [ ] 3.3 Verify Tests grün, alle bestehenden Tests weiterhin grün

- [ ] **Task 4: dimension-config.ts: VERSORGUNG_CONFIG anpassen** (AC: #1)
  - [ ] 4.1 (RED) `dimension-config.test.ts`: bestehenden Versorgung-Test anpassen
    - Prüft, dass `krankenhaeuser-plan` jetzt `kind: 'capacity-weighted-distance'` nutzt (nicht mehr `poi-distance`)
    - Prüft `bettenField: 'betten_insgesamt'`, `maxBetten`, `fachabteilungenField` nicht gesetzt (plan-Layer hat kein fachabteilungen-Feld)
  - [ ] 4.2 (GREEN) `scripts/lib/kiez-score/dimension-config.ts`: `krankenhaeuser-plan` Layer-Entry ändern:
    ```ts
    {
      layer: 'krankenhaeuser-plan',
      weight: 0.25,
      normalize: {
        kind: 'capacity-weighted-distance',
        threshold: 2000,
        bettenField: 'betten_insgesamt',
        maxBetten: 1500
      }
    }
    ```
    - `krankenhaeuser-weitere` bleibt vorerst reines `poi-distance` (liegt außerhalb Versorgung-Dimension; falls in scope: separater Task)
  - [ ] 4.3 Verify Gewichts-Summen-Test (Task 2.4 in dimension-config.test.ts) weiterhin grün

- [ ] **Task 5: Scope-Gate + Scope-Note** (AC: #5)
  - [ ] 5.1 `pnpm test:unit` 100% grün, log nach `/tmp/vitest-10-2-green.log`
  - [ ] 5.2 `tsc --noEmit` auf `scripts/lib/kiez-score/` grün
  - [ ] 5.3 Completion-Note in Dev Agent Record: geänderte Dateien, Gewichts-Formel dokumentiert, `maxBetten`-Wahl begründet

---

## Dev Notes

### Ist-Zustand der zu ändernden Dateien

**`scripts/lib/kiez-score/dimension-config.ts` (Zeilen 72-84, nach Epic 9):**
`VERSORGUNG_CONFIG` enthält `krankenhaeuser-plan` mit `normalize: { kind: 'poi-distance', threshold: 2000 }` und Gewicht 0.25. Diese Story ändert genau diesen Eintrag auf `capacity-weighted-distance`. Die übrigen Layer (kitas 0.30, schulen 0.30, spielplaetze 0.15) bleiben unverändert. Dateigröße: 108 Zeilen, weit unter 500.

**`scripts/lib/kiez-score/normalize.ts` (aktuell 64 Zeilen):**
Enthält `normalizeDistance`, `normalizeNumericInverted`, `normalizePresence`, `normalizeOrdinal3/4`. Keine Krankenhaus-Logik. `parseBettenCapacity` und `normalizeCapacityWeightedDistance` werden hier ergänzt. Datei bleibt unter 150 Zeilen.

**`scripts/lib/kiez-score/compute-score.ts` (aktuell 256 Zeilen):**
`normalizeFromHit` (Zeile 51-96) dispatcht via `switch (normalize.kind)`. Der neue `case 'capacity-weighted-distance'` kommt direkt nach `case 'poi-distance'` (Zeile 74-79). `getProp` (Zeile 31-34) und `readDistanceMeters` (Zeile 24-29) sind wiederverwendbar, kein Duplicate-Code.

**`scripts/lib/kiez-score/types.ts` (aktuell 88 Zeilen):**
`NormalizationStrategy` (Zeile 40-49) ist eine Typ-Union. Neuer Zweig `capacity-weighted-distance` wird angehängt. TS strict, kein `any`.

**`scripts/lib/kiez-score/normalize.test.ts` (aktuell 116 Zeilen):**
Bestehende Tests für `normalizeDistance`, `normalizeNumericInverted`, `normalizePresence`. Neue `describe`-Blöcke kommen am Ende der Datei.

**`scripts/lib/kiez-score/compute-score.test.ts` (aktuell ~230 Zeilen):**
Versorgung-Block liegt bei Zeile 129-158. Neuer Kapazitäts-Block kommt danach, vor dem `computeKiezScore`-Block.

### Daten-Kontext aus dem Audit

Aus `_user-input/datenaufloesung-audit-2026-05-21.md` Zeilen 51-60:

| TypeName | Feld | Typ | Nutzung bisher |
|---|---|---|---|
| `plankrankenhaeuser` | `betten_insgesamt` | string | Inspector-Text |
| `plankrankenhaeuser` | `kkh` | string | Inspector |
| `weitere_krankenhaeuser` | `betten` | int | Inspector-Text |
| `weitere_krankenhaeuser` | `fachabteilungen` | string/int | ungenutzt |

Open Point (Audit Zeile 259): `betten_insgesamt` ist string, `betten` ist int. Parsing muss beide Typen einheitlich behandeln.

`krankenhaeuser-plan` hat keinen `fachabteilungen`-Eintrag. Die Kapazitäts-Formel lässt `fachabteilungenField` optional: fehlt es in der Config, entfällt der Fachabteilungs-Anteil stillschweigend.

### Kapazitäts-Formel (Begründung)

**Distanz-Score:** `max(0, 100 × (1 − distanceM / threshold))` bei threshold = 2000m (aus bestehender Config).

**Kapazitäts-Faktor:** `0.5 + 0.3 × (betten / maxBetten) + 0.2 × (fachabteilungen / maxFachabteilungen)`

- Basis 0.5: ein Krankenhaus ohne Kapazitätsdaten zählt halb so stark, nicht gar nicht. Verhindert, dass fehlende Daten den Score auf 0 drücken.
- Betten-Anteil 0.3: stärkster Kapazitäts-Indikator.
- Fachabteilungs-Anteil 0.2: Breite des Angebots.
- Summe Faktor bei Maximum: 0.5 + 0.3 + 0.2 = 1.0. Score-Range bleibt 0-100.

**`maxBetten = 1500`:** Charité Mitte hat ca. 1.200 Betten, das Vivantes Klinikum Neukölln ca. 1.000. 1500 als konservative Obergrenze verhindert Clamp-Effekte bei den größten Berliner Häusern. Wenn neue Datenlagen andere Maxima zeigen: Konstante in `dimension-config.ts` exportieren und in Tests direkt referenzieren.

**Finaler Score-Beitrag:** `round(distanzScore × kapazitätsFaktor, 1)`, geclampmt 0-100.

### Architektur-Compliance: relevante MUST-Rules

- `#2` Dateien unter 500 Zeilen: alle betroffenen Dateien bleiben weit darunter.
- `#7` TS strict, kein `any`: `parseBettenCapacity` nimmt `unknown`, gibt `number | null` zurück. Neue Strategy-Union ist vollständig typisiert.
- `#6` Kein Kommentar außer non-obvious WHY: Formel-Begründung (warum 0.5 als Basis) ist ein non-obvious WHY-Kommentar, legitim.
- `#15` Editorial-Verantwortung: Kapazität ist positiv-eindeutig (mehr Betten = bessere Versorgung für jeden Bewohner). Kein Stigmatisierungsrisiko analog MSS.

### Was nicht brechen darf

- Alle 81 bestehenden Modul-Tests aus Story 9.1 müssen weiterhin grün bleiben.
- `VERSORGUNG_CONFIG`-Gewichts-Summe muss 1.0 bleiben (0.30 + 0.30 + 0.25 + 0.15 = 1.0, unverändert).
- `computeKiezScore`-Logik (`compute-score.ts` Zeile 224-243) ist generisch und iteriert `DIMENSION_CONFIGS`. Keine Änderung dort nötig.
- Der `poi-distance`-Case in `normalizeFromHit` (Zeile 74-79) bleibt unberührt.

### Previous Story Intelligence

- **Story 9.1 (9-1-score-dimensions-foundation.md):** liefert die stabile `VERSORGUNG_CONFIG` mit Gewichten kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15. Completion-Note bestätigt: 81 Tests grün, `dimension-config.ts` 108 Zeilen.
- **Story 1.28 (1-28-livability-index.md):** Score-Foundation. `normalizeDistance`-Pattern (linear, clamped 0-100) ist das Basis-Pattern für den Distanz-Anteil der neuen Formel.
- **Story 9.1 Completion-Note:** `normalizeNumericInverted` (PET) zeigt das Muster für eine zusätzliche numerische Normalisierungs-Funktion. `parseBettenCapacity` folgt demselben TDD-Stil.
- **Audit Open Point (Zeile 259):** `betten_insgesamt` string vs. `betten` int ist der primäre Parsing-Risk. AC-2 und Task 1 adressieren ihn explizit.

### Scope-Klarstellung

Diese Story ändert ausschließlich:
- `scripts/lib/kiez-score/normalize.ts` (neue Funktionen)
- `scripts/lib/kiez-score/types.ts` (neuer Union-Zweig)
- `scripts/lib/kiez-score/compute-score.ts` (neuer Dispatch-Case)
- `scripts/lib/kiez-score/dimension-config.ts` (ein Layer-Entry)

Keine Änderungen an DB-Schema, Pipeline, UI-Konsumenten, Methodikseite. Methodik-Update (Audit Zeile 260) ist ein Follow-up außerhalb dieser Story.

`krankenhaeuser-weitere` (Slug, Zeile 372 in `sources.ts`) ist derzeit kein Versorgungs-Layer in `VERSORGUNG_CONFIG`. Er bleibt unberührt. Falls er künftig einbezogen werden soll, ist das eine separate Story.

---

## References

- `_user-input/datenaufloesung-audit-2026-05-21.md` (Zeilen 51-70, 153-156, 259)
- `scripts/lib/kiez-score/dimension-config.ts` (Zeilen 72-84: VERSORGUNG_CONFIG)
- `scripts/lib/kiez-score/normalize.ts` (Zeilen 42-47: normalizeDistance als Basis-Pattern)
- `scripts/lib/kiez-score/compute-score.ts` (Zeilen 51-96: normalizeFromHit, Dispatch-Switch)
- `scripts/lib/kiez-score/types.ts` (Zeilen 40-49: NormalizationStrategy Union)
- `scripts/lib/kiez-score/compute-score.test.ts` (Zeilen 129-158: bestehender Versorgung-Block)
- `scripts/lib/kiez-score/normalize.test.ts` (Zeilen 62-84: normalizeDistance-Pattern als Vorlage)
- `scripts/lib/sources.ts` (Zeilen 361-381: krankenhaeuser-plan + krankenhaeuser-weitere)
- `docs/adr/ADR-012-tdd-mandate.md`
- `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md`

---

## Dev Agent Record

### Agent Model Used

_wird nach Implementierung ausgefüllt_

### Debug Log References

- RED: `/tmp/vitest-10-2-red.log` (erwartet: neue Tests failen)
- GREEN: `/tmp/vitest-10-2-green.log` (erwartet: alle Tests grün)

### Completion Notes List

_wird nach Implementierung ausgefüllt_

### File List

_wird nach Implementierung ausgefüllt_

## Change Log

- 2026-05-21: Story 10.2 erstellt (Versorgung · Krankenhaus nach Betten/Fachabteilung V2).
