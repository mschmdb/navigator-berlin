# Story 10.1: Versorgung · Kita-Plätze pro Kind (V1)

Status: done

> **Umsetzung:** Distanz-Term bleibt (0.15), Pro-Kopf-Term neu (0.15). Σ e_platz im LOR (Point-in-Polygon) ÷ Kinder 0-6 aus 10.0, normalize kita-pro-kind (KITA_BEST_AT 0.35). Generischer `perLorHits`-Pipeline-Pfad (wiederverwendbar 10.2-10.4). Score neu berechnet, 1994/1994 Tests grün, 0 Type-Errors. Module: scripts/lib/kiez-score/kita-supply.ts(+test), normalize/types/compute-score/dimension-config/pipeline, build-kiez-scores, layer-methodology.

> **Anker:** ADR-012 (TDD-Mandat), ADR-015 (Score nur Größen mit eindeutiger Besser-Richtung).
> **Hard-Block:** Story 10.0 (Einwohner-LOR-Join-Foundation) muss `done` sein. Ohne den Kinder-0-6-Datensatz pro LOR gibt es keinen Nenner.
> **Soft-Block:** Alle Epic-9-Stories (9.1–9.6) müssen `done` sein. `dimension-config.ts` ist nach Epic 9 stabil; ein paralleler Merge-Konflikt zerstört den Versorgung-Config-Block.
> **Epic-9-Status (2026-05-21):** Alle Stories 9.1–9.6 im Status `review`. Bis 10.1 gestartet wird, müssen sie `done` sein.

## Story

As a Familie,
I want dass die Kita-Versorgung das Platzangebot im Verhältnis zu den Kindern im Kiez misst,
so that ich sehe ob ich realistisch einen Platz bekomme, nicht nur wie weit die nächste Kita ist.

## Kontext: Warum dieser Change

Der Versorgung-Score misst aktuell nur die Luftlinie zur nächsten Kita. Eine 20-Platz-Kita und eine 200-Platz-Kita zählen identisch. Das beantwortet die falsche Nutzerfrage.

Der Audit 2026-05-21 (`_user-input/datenaufloesung-audit-2026-05-21.md`) zeigt: `e_platz` ist das Kapazitätsfeld in `kita:kita` und kommt bereits mit jedem Fetch. Es wird nirgends genutzt (99% gefüllt, n=500, Range 1–310, Median 30). Die Einwohner-CSV (Story 10.0) liefert Kinder 0–6 pro LOR. Der Nenner fehlt bis jetzt, weil wir ihn nie geholt haben.

Diese Story ergänzt die Versorgung-Dimension um einen **Pro-Kopf-Term**: Summe aller `e_platz` im LOR geteilt durch Kinder 0–6. Hoher Quotient scort besser. Der bisherige Distanz-Term für `kitas-2024` bleibt erhalten (Gewicht-Umverteilung, Summe = 1). Die Score-Semantik ändert sich damit konzeptionell; die Methodik-Seite muss erklärt werden.

## Acceptance Criteria

1. **AC-1 (Pro-Kopf-Term):**
   **Given** Story 10.0 liefert Kinder 0–6 pro LOR (`kinder_0_6: number | null`)
   **And** `kitas-2024`-Features tragen `e_platz` (string, 99% gefüllt)
   **When** die Pipeline den Versorgung-Score berechnet
   **Then** entsteht pro LOR ein Quotient `plaetze_pro_kind = sum(e_platz_im_lor) / kinder_0_6`
   **And** ein LOR mit hohem Platz-Kind-Verhältnis scort besser als ein unterversorgter
   **And** der Quotient ist vom reinen Distanz-Term unabhängig

2. **AC-2 (Normalisierung + Schwellen):**
   **Given** der Quotient `plaetze_pro_kind` (kontinuierlicher Wert ≥ 0)
   **When** `normalizeKitaProKind` die Funktion aufruft
   **Then** gilt:
   - `plaetze_pro_kind >= KITA_BEST_AT` (Vorschlag: 0.35 Plätze/Kind) → 100
   - `plaetze_pro_kind <= 0` → 0
   - linear dazwischen
   **And** die Schwelle ist als benannte Konstante (`KITA_BEST_AT`) in `normalize.ts` oder `dimension-config.ts` dokumentiert, nicht hardcoded

3. **AC-3 (Missing-Data-Handling):**
   **Given** TDD
   **When** Normalisierungs-Tests für Edge-Cases laufen
   **Then** sind alle vier Missing-Data-Szenarien getestet:
   - LOR ohne Kinder (`kinder_0_6 = 0` oder `null`) → `null` (Division-by-Zero-Safe)
   - LOR ohne Kitas (`sum(e_platz) = 0`) → Score 0 (kein Platzangebot)
   - `e_platz` nicht parsebar (leerer String, nicht-numerisch) → Kita zählt 0 Plätze, kein Crash
   - LOR mit `plaetze_pro_kind > KITA_BEST_AT` → Score 100 (geclampt)

4. **AC-4 (Config-Integration):**
   **Given** die aktuelle `VERSORGUNG_CONFIG` in `scripts/lib/kiez-score/dimension-config.ts` (Zeile 72–84)
   **When** der Kita-Pro-Kopf-Term integriert wird
   **Then** löst er den alten `poi-distance`-Term für `kitas-2024` ab ODER ergänzt ihn mit angepassten Gewichten (Summe aller `versorgung`-Layer-Gewichte = 1)
   **And** die neue `NormalizationStrategy`-Variante (`kita-pro-kind` o. ä.) ist im `types.ts`-Union ergänzt
   **And** `compute-score.ts` dispatcht den neuen Kind auf die neue Normalisierungs-Funktion

5. **AC-5 (ScoreInput-Erweiterung):**
   **Given** die neue Pro-Kopf-Logik braucht demografische Daten
   **When** `ScoreInput` erweitert wird
   **Then** trägt es ein optionales Feld `demographics?: { kinder_0_6: number | null }` (oder analoges Interface aus 10.0)
   **And** der Typ ist `strict`-TypeScript-kompatibel, kein `any`
   **And** alle bestehenden `ScoreInput`-Aufrufer kompilieren weiter (das Feld ist optional)

6. **AC-6 (TDD, Modul-Tests grün):**
   **Given** ADR-012 (Test-First)
   **When** die Tests in `scripts/lib/kiez-score/*.test.ts` laufen
   **Then**:
   - `normalize.test.ts` oder eine neue `normalize-kita.test.ts` deckt alle vier Missing-Data-Szenarien (AC-3) ab
   - `compute-score.test.ts` enthält mind. einen Case: Versorgung mit `plaetze_pro_kind`-Input → Score > 0
   - `dimension-config.test.ts` verifiziert die neuen Gewichte summieren zu 1
   - Tests folgen Red → Green (Failing-First im Commit nachvollziehbar)
   - `pnpm test:unit` 100% grün

7. **AC-7 (Methodik-Update):**
   **Given** die Score-Semantik ändert sich (Distanz + Pro-Kopf statt nur Distanz)
   **When** die Implementierung abgeschlossen ist
   **Then** ist der Eintrag `kiez-score-versorgung` in `src/lib/data/layer-methodology.ts` (Zeile 478) aktualisiert:
   - `calculation`-String erklärt Distanz-Terme UND den Pro-Kopf-Term
   - `coverageGaps` nennt: „Platz-Kind-Quotient basiert auf gemeldeten Kapazitäten (e_platz), keine Belegungsquoten"
   - `relatedLayers` bleibt unverändert

## Tasks / Subtasks

- [ ] **Task 1: Normalisierungs-Funktion** (AC: #2, #3)
  - [ ] 1.1 (RED) `normalize.test.ts`: Tests für `normalizeKitaProKind` schreiben (4 Edge-Cases aus AC-3 + Happy Path + Clamping)
  - [ ] 1.2 Verify Red: `pnpm test:unit` zeigt Fails auf neue Funktion
  - [ ] 1.3 (GREEN) `scripts/lib/kiez-score/normalize.ts`: `normalizeKitaProKind(plaetzeProKind: number | null, bestAt: number): number | null` ergänzen
  - [ ] 1.4 `KITA_BEST_AT`-Konstante in `normalize.ts` oder `dimension-config.ts` benennen (Vorschlag: 0.35)
  - [ ] 1.5 Tests grün verifizieren

- [ ] **Task 2: NormalizationStrategy-Typ** (AC: #4)
  - [ ] 2.1 (RED) `dimension-config.test.ts`: Test, der neue Strategy-Kind erwartet
  - [ ] 2.2 `scripts/lib/kiez-score/types.ts` (Zeile 40–49): neue Variante `{ kind: 'kita-pro-kind'; bestAt: number }` zur `NormalizationStrategy`-Union ergänzen
  - [ ] 2.3 Tests grün

- [ ] **Task 3: ScoreInput erweitern** (AC: #5)
  - [ ] 3.1 (RED) `compute-score.test.ts`: Test mit `demographics.kinder_0_6`-Feld im Input
  - [ ] 3.2 `scripts/lib/kiez-score/types.ts`: `ScoreInput` um optionales `demographics?: { kinder_0_6: number | null }` erweitern
  - [ ] 3.3 Verify: alle Aufrufer kompilieren (optional-Feld bricht keine bestehenden Call-Sites)

- [ ] **Task 4: compute-score.ts Dispatch** (AC: #4)
  - [ ] 4.1 (RED) `compute-score.test.ts`: Case Versorgung mit Pro-Kopf-Input → erwartet Score > 0
  - [ ] 4.2 `scripts/lib/kiez-score/compute-score.ts`: `case 'kita-pro-kind'` im `normalizeFromHit`-Switch ergänzen
  - [ ] 4.3 Liest `demographics.kinder_0_6` aus `ScoreInput`, berechnet `plaetze_pro_kind` aus `e_platz`-Parsing + Kinder-Nenner
  - [ ] 4.4 Tests grün

- [ ] **Task 5: dimension-config.ts** (AC: #1, #4)
  - [ ] 5.1 (RED) `dimension-config.test.ts`: Test für neue Versorgung-Config-Layer-Liste + Gewichts-Summe
  - [ ] 5.2 `scripts/lib/kiez-score/dimension-config.ts` (Zeile 72–84): `kitas-2024`-Layer von `poi-distance` auf `kita-pro-kind` umstellen (oder Hybrid mit Gewichtsanpassung)
  - [ ] 5.3 Gewichte neu balancieren (Summe = 1): Vorschlag `kitas-2024` 0.30 / `schulen-2024` 0.30 / `krankenhaeuser-plan` 0.25 / `spielplaetze` 0.15 bleibt, Strategy ändert sich
  - [ ] 5.4 Tests grün

- [ ] **Task 6: e_platz-Parsing** (AC: #3)
  - [ ] 6.1 `e_platz` ist `string` im WFS-Schema (Audit). Parsing-Hilfsfunktion `parseEPlatz(raw: unknown): number` schreiben: `parseInt(String(raw))`, NaN → 0
  - [ ] 6.2 Funktion in `compute-score.ts` oder eigenem `parse-kita.ts` platzieren (je nach Länge, Dateien <500 Zeilen)
  - [ ] 6.3 (RED/GREEN) Unit-Test für Parsing: `"20"` → 20, `""` → 0, `null` → 0, `"abc"` → 0

- [ ] **Task 7: Methodik-Update** (AC: #7)
  - [ ] 7.1 `src/lib/data/layer-methodology.ts` Zeile 478–493: `calculation` und `coverageGaps` für `kiez-score-versorgung` aktualisieren

- [ ] **Task 8: Pipeline-Integration + ADR-Notiz**
  - [ ] 8.1 Pipeline-Skript prüfen: `e_platz`-Feld überlebt den fetch/GeoJSON-Transform bis zur Score-Berechnung (falls nötig: `includedFields` in `sources.ts` erweitern)
  - [ ] 8.2 ADR-Notiz (Kommentar in `dimension-config.ts` oder neues ADR-stub in `docs/adr/`): Pro-Kopf-Versorgung ändert Semantik, Entscheidung dokumentieren
  - [ ] 8.3 `pnpm test` (unit + e2e server) vollständig grün

## Dev Notes

### Ist-Zustand (konkrete Dateipfade + Zeilen)

**`scripts/lib/kiez-score/dimension-config.ts` Zeilen 72–84 (post-9.1):**
```ts
export const VERSORGUNG_CONFIG: DimensionConfig = {
  dimension: 'versorgung',
  layers: [
    { layer: 'kitas-2024', weight: 0.3, normalize: { kind: 'poi-distance', threshold: 500 } },
    { layer: 'schulen-2024', weight: 0.3, normalize: { kind: 'poi-distance', threshold: 800 } },
    { layer: 'krankenhaeuser-plan', weight: 0.25, normalize: { kind: 'poi-distance', threshold: 2000 } },
    { layer: 'spielplaetze', weight: 0.15, normalize: { kind: 'poi-distance', threshold: 400 } }
  ]
};
```

Kitas tragen aktuell `{ kind: 'poi-distance', threshold: 500 }`. Diese Strategy muss auf `{ kind: 'kita-pro-kind', bestAt: KITA_BEST_AT }` umgestellt werden.

**`scripts/lib/kiez-score/types.ts` Zeilen 40–49 (`NormalizationStrategy`-Union):**
Neue Variante `{ kind: 'kita-pro-kind'; bestAt: number }` einfügen. Kein `field`-Param nötig: `e_platz` ist das kanonische Feld und wird im Dispatch direkt aus `hit.value` gelesen (analog `poi-distance`).

**`scripts/lib/kiez-score/types.ts` Zeilen 76–79 (`ScoreInput`):**
```ts
export interface ScoreInput {
  layerHits: readonly LayerHitLike[];
  nearestStops: Record<Modus, NearestStopLike | null> | null;
}
```
Erweitern um `demographics?: { kinder_0_6: number | null }`. Optional, damit bestehende Call-Sites nicht brechen.

**`scripts/lib/kiez-score/normalize.ts` (64 Zeilen, viel Platz):**
Neue Funktion `normalizeKitaProKind(plaetzeProKind: number | null, bestAt: number): number | null`:
- `null` → `null` (kein Nenner vorhanden)
- `<= 0` → `0`
- `>= bestAt` → `100`
- linear dazwischen: `Math.round(100 * (plaetzeProKind / bestAt) * 10) / 10`

**`scripts/lib/kiez-score/compute-score.ts`:**
Switch in `normalizeFromHit` (Zeile 58–86) bekommt einen neuen `case 'kita-pro-kind'`:
1. `e_platz`-Strings aus `hit.value` parsen (Kitas im LOR sind mehrere Features; die Summe kommt entweder bereits aggregiert aus der Pipeline oder muss hier gesammelt werden).
2. Kinder 0–6 aus `input.demographics?.kinder_0_6` lesen.
3. Quotient berechnen, `normalizeKitaProKind(quotient, normalize.bestAt)` aufrufen.

**`scripts/lib/sources.ts` Zeilen 327–337 (`kitas-2024`):**
`e_platz` ist ein WFS-Feld. Prüfen ob der Fetch-Mechanismus Felder filtert. Falls `includedFields` o. ä. existiert: `e_platz` explizit aufnehmen.

**`src/lib/data/layer-methodology.ts` Zeilen 478–493 (`kiez-score-versorgung`):**
`calculation`-String muss Pro-Kopf-Term erwähnen. `coverageGaps` um Hinweis auf gemeldete Kapazitäten (kein echtes Belegungsdatum) ergänzen.

### Schwellen-Entscheidung (editorial, Assumption)

Berliner Versorgungsrichtwert: ca. 0.33–0.35 Plätze pro Kind 0–6 (Senatsverwaltung). Vorschlag `KITA_BEST_AT = 0.35`. Das bedeutet: ein LOR mit mindestens einem Platz pro 3 Kinder scort voll. Falls editorial andere Schwelle gewünscht: benannte Konstante anpassen, Tests bleiben grün (Tests parametrisiert mit der Konstante, nicht hardcoded).

Per CLAUDE.md-Grundregel: Annahme dokumentieren, nicht fragen. `KITA_BEST_AT` als exportierte Konstante, sodass spätere Adjustierung ohne Code-Suche möglich ist.

### Was NICHT brechen darf

- Alle anderen Versorgung-Layer (`schulen-2024`, `krankenhaeuser-plan`, `spielplaetze`) bleiben unverändert auf `poi-distance`.
- `DIMENSION_WEIGHTS` bleibt 5 × 0.20 (diese Story ändert keine Dimensionen, nur die interne Strategy eines Layers).
- `dimension-config.test.ts` Gewichts-Summen-Test muss nach der Änderung noch grün bleiben.
- `compute-score.ts`-Dispatch ist generisch; der neue `case` darf keine anderen Dimensionen beeinflussen.
- Bestehende `ScoreInput`-Aufrufer (Pipeline, Tests) kompilieren ohne Änderung (optionales Feld).

### Architektur-MUST-Rules (aus `_bmad-output/planning-artifacts/architecture.md`)

- **#2:** Dateien <500 Zeilen. `normalize.ts` (64 Zeilen) und `dimension-config.ts` (108 Zeilen) haben Platz. `compute-score.ts` (257 Zeilen) ist im Limit. Wenn die Parsing-Logik den Switch merklich aufbläht: `parse-kita.ts` als eigenes Modul.
- **#7:** TS strict, kein `any`. `e_platz` kommt als `unknown` aus `hit.value`. Explizit auf `string | number` narrowen vor Parsing.
- **#15:** Editorial-Verantwortung. Pro-Kopf-Term ist ADR-015-konform: mehr Plätze pro Kind ist für jeden Bewohner positiv-eindeutig besser.
- **#6:** Kommentar nur für nicht-offensichtliche Entscheidungen. Schwellenwert-Kommentar (Berliner Richtwert) ist berechtigt.

### Previous Story Intel

- **Story 9.1 (review):** `VERSORGUNG_CONFIG` nach Epic-9-Stand: `kitas 0.30 / schulen 0.30 / krankenhaeuser 0.25 / spielplaetze 0.15`. Gewichte bleiben. Grünanlagen sind aus Versorgung raus (jetzt in Grün & Hitze). Kein Merge-Konflikt möglich, wenn 9.1 `done` ist.
- **Story 9.3 (review):** Pipeline-Recompute-Rerun. Nach 10.1 muss die Pipeline erneut laufen. Das ist kein 10.1-Scope, aber in der Story-Completion-Note erwähnen.
- **Story 10.0 (nicht gestartet):** Liefert `kinder_0_6: number | null` pro LOR als Join-Ergebnis. Die genaue Datenstruktur (Interface-Name, Feld-Bezeichnung) muss 10.1 von 10.0 konsumieren. Falls 10.0 ein anderes Feld-Naming wählt: in 10.1 anpassen, keine Annahmen hardcoden.
- **Audit-Befund `e_platz`:** string-Typ im WFS-Schema, Range 1–310, Median 30, 99% gefüllt (n=500). `parseInt` ist ausreichend; kein Float-Parsing nötig.

### Open Points (vor Dev-Start klären)

1. **Aggregation:** Liefert die Pipeline pro LOR bereits eine Liste aller Kita-Features (mit `e_platz`) oder nur den nächsten POI? Falls Letzteres: die Summe aller Plätze im LOR braucht einen neuen Aggregations-Schritt in der Pipeline (pre-Score). Das ist der größte Unsicherheitsfaktor.
2. **`e_platz`-Feldverfügbarkeit:** Prüfen ob `sources.ts` Kita-Features mit allen Feldern fetcht oder filtert. WFS-Quellen laden ggf. nur Geometrie + ausgewählte Properties.
3. **Interface aus 10.0:** Der genaue Typ von `kinder_0_6` im `ScoreInput` hängt von 10.0 ab. Erst nach 10.0-Implementation finalisieren.

### References

- `_user-input/datenaufloesung-audit-2026-05-21.md` Teil 1 Kita (Zeilen 27–37), V1 (Zeilen 147–151), Offene Punkte (Zeilen 255–261)
- `scripts/lib/kiez-score/dimension-config.ts` Zeilen 72–84 (VERSORGUNG_CONFIG)
- `scripts/lib/kiez-score/types.ts` Zeilen 40–49 (NormalizationStrategy), Zeilen 76–79 (ScoreInput), Zeilen 81–87 (DIMENSION_WEIGHTS)
- `scripts/lib/kiez-score/normalize.ts` (64 Zeilen, Muster für neue Funktion)
- `scripts/lib/kiez-score/compute-score.ts` Zeilen 58–86 (normalizeFromHit Switch)
- `scripts/lib/sources.ts` Zeilen 327–337 (kitas-2024 Source-Definition)
- `src/lib/data/layer-methodology.ts` Zeilen 478–493 (kiez-score-versorgung)
- `docs/adr/ADR-012-tdd-mandate.md` (Test-First-Pflicht)
- `docs/adr/ADR-015-score-composition-umwelt-infra.md` (positiv-eindeutig-Kriterium)
- `_bmad-output/implementation-artifacts/9-1-score-dimensions-foundation.md` (Epic-9-Fundament, File-List)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

_(auszufüllen)_

### Completion Notes List

_(auszufüllen)_

### File List

_(auszufüllen)_

## Change Log

- 2026-05-21: Story 10.1 erstellt (ready-for-dev). Hard-Block auf 10.0, Soft-Block auf Epic 9 (alle 9.1–9.6 in review). Pro-Kopf-Term als neue `kita-pro-kind`-NormalizationStrategy geplant, KITA_BEST_AT = 0.35 als Assumption dokumentiert.
