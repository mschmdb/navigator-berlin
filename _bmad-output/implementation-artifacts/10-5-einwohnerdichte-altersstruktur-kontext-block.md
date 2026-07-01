# Story 10.5: Einwohnerdichte + Altersstruktur als Kontext-Block (V4)

Status: done

> **Umsetzung:** DemografieBlock-Card im Inspector (categorical-neutral, kein Score). getKiezDemografieAt löst Adresse→Planungsraum→einwohner-lor.json. Zeigt Dichte, Alters-Anteile, Jugend-/Altenquotient. Als Card analog Layer-Cards (Border, Eye-Toggle für einwohner-dichte-2024-Map-Layer, Layer-Detail-Link), kein Severity-Chip. Ui-State-Feld kiezDemografie, Load in explore beim Adress-Select. User-Feedback umgesetzt: Card-Styling angeglichen, eye+link ergänzt, „Kontext"-Chip entfernt. 0 Type-Errors, Komponenten-Tests grün.

> **Anker:** ADR-015 (`docs/adr/ADR-015-score-composition-umwelt-infra.md`, Accepted 2026-05-20) legt fest: Einwohnerdichte hat keine Besser-Richtung, kein Score-Input. Demografie rendert categorical-neutral, analog MSS. **Hard-Dependency:** Story 10.0 (Einwohner-LOR-Join-Foundation) muss abgeschlossen sein, bevor diese Story implementierbar ist. ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`): Test-First-Pflicht für Komponenten-Logik.

## Story

As a User,
I want das Bevölkerungsprofil meines Kiezes als neutralen Kontext sehen,
so that ich "jung/alt, dicht/locker" verstehe, ohne dass es als Qualitätswertung erscheint.

## Kontext: Warum kein Score-Input

Einwohnerdichte ist kein Wohnqualitätsmerkmal. Ein dichter Kiez ist nicht besser oder schlechter als ein locker besiedelter. ADR-015 entscheidet: nur Größen mit eindeutiger Besser-Richtung kommen in den Score. Dichte und Altersstruktur sind Fakten, keine Wertungen.

Das Vorbild ist der MSS-Block (Story 1.30): `mss-gesamtindex-2025` scort `'neutral'` in `value-severity-mapping.ts` (Zeile 156), trägt `'categorical-neutral'` in `layer-compare.ts` (Zeile 39), und erscheint ohne Diff-Pfeil, ohne Severity-Color-Coding.

## Acceptance Criteria

1. **AC-1 (Demografie-Block rendert categorical-neutral):**
   **Given** 10.0 ist abgeschlossen und liefert pro LOR-Bezirksregion: Einwohnerdichte (EW/km²), Gesamt-Einwohner, Anteil Kinder 0-6, Anteil Kinder 6-12, Anteil Senioren 65+
   **When** der Inspector einen Demografie-Block für eine Adresse mit bekannter LOR-Bezirksregion anzeigt
   **Then** kein "besser"-Pfeil, keine Severity-Farbkodierung, kein Color-Coding der Werte

2. **AC-2 (Klare Kontext-Block-Trennung von Score-Dimensionen):**
   **Given** der Demografie-Block wird angezeigt
   **When** ein User die Section scannt
   **Then** der Block ist visuell und semantisch klar als Kontext-Block, nicht als Score-Dimension, erkennbar. Keine Verwechslungsgefahr mit den Score-Dimension-Cards in `kiez-score-section.svelte`.

3. **AC-3 (Datenstand + Quelle sichtbar):**
   **Given** der Block zeigt Daten
   **When** ein User die Details aufklappt
   **Then** sind Datenstand (31.12.2024), Quelle (Amt für Statistik Berlin-Brandenburg) und Lizenz (CC-BY) sichtbar.

4. **AC-4 (Null-Safe Rendering):**
   **Given** 10.0 ist noch nicht vollständig (LOR ohne Join-Treffer oder Adresse ausserhalb bekannter LOR)
   **When** `demografieData` null ist
   **Then** rendert der Block einen diskreten Leer-Hinweis ("Keine Bevölkerungsdaten vorhanden"), kein Crash, kein leerer Container.

5. **AC-5 (TDD, Komponenten-Tests grün):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** `pnpm test:unit` laeuft
   **Then**: Rendering mit Daten (dicht, ausgeglichen, Anteil-Felder) korrekt, Rendering ohne Daten (null-safe), keine Severity/Besser-Pfeil-Elemente im DOM, Datenstand/Quelle/Lizenz im detail-aufgeklappten Zustand sichtbar.

## Tasks / Subtasks

- [ ] **Task 1: Demografie-Typ + Util** (AC: #1, #4)
  - [ ] 1.1 (RED) `src/lib/components/atlas/inspector-panel/demografie-block.svelte.test.ts` anlegen. Prueft: mit Daten, null-safe, kein Severity-Element im DOM. Tests failen.
  - [ ] 1.2 (GREEN) Interface `KiezDemografieData` in `src/lib/components/atlas/inspector-panel/internal/demografie-types.ts` (NEU, <50 Zeilen):
    ```ts
    export interface KiezDemografieData {
      einwohner: number;
      dichteEwKm2: number;
      anteilKinder0bis6: number; // Anteil 0-6, Wert 0-1
      anteilKinder6bis12: number;
      anteilSenioren65plus: number;
      datenstand: string; // ISO-Date, "2024-12-31"
      quelle: string;
      lizenz: string;
    }
    ```
  - [ ] 1.3 Verify RED-Log: Tests failen vor Implementierung. Commit mit Failing-Tests.

- [ ] **Task 2: `demografie-block.svelte` Komponente** (AC: #1, #2, #3, #4)
  - [ ] 2.1 (GREEN) `src/lib/components/atlas/inspector-panel/demografie-block.svelte` (NEU, <200 Zeilen):
    - Props: `data: KiezDemografieData | null`
    - `null`-Guard: diskreter Leer-Hinweis, `data-testid="demografie-empty"`
    - Kein `<ValueChip>` mit Severity (kein Import von `value-severity-mapping.ts`)
    - Kein Diff-Pfeil (kein `compare`-Muster)
    - Daten-Zeilen als `<dl>`: Einwohnerdichte, Gesamt-Einwohner, Kinder-Anteile, Senioren-Anteil
    - Datenstand/Quelle/Lizenz in aufklappbarem Detail-Block, `data-testid="demografie-details"`
    - Mobile: `hyphens-auto`, `break-words`, responsive text-sizes (≤390px beachten)
    - Barrierefreiheit: semantisches `<section>` + `aria-label`, `<dl>`/`<dt>`/`<dd>`, Kontrast WCAG AA
    - Icon `@lucide/svelte`, kein `lucide-svelte`
  - [ ] 2.2 (GREEN) Tests aus Task 1 gruen ziehen

- [ ] **Task 3: Inspector-Integration** (AC: #2)
  - [ ] 3.1 `DemografieBlock` in `inspector-panel.svelte` importieren (Zeile ~34-35 bei anderen Section-Imports)
  - [ ] 3.2 `ui.kiezDemografie: KiezDemografieData | null` in `UiState` (`src/lib/state/ui-context.svelte.ts`, Zeile ~57) ergaenzen, Initialwert `null`
  - [ ] 3.3 Block im Template zwischen `<WahlSection>` (Zeile 541) und dem ersten `{#each sections}` einfuegen. Datenstrom: `demografieData={ui.kiezDemografie}`
  - [ ] 3.4 Inspector-Panel-Test `inspector-panel.svelte.test.ts` um einen Smoke-Test fuer `demografie-block` erweitern

- [ ] **Task 4: Daten-Anbindung aus 10.0-Payload** (AC: #1, #4)
  - [ ] 4.1 Pruefe wie der Inspector Kiez-Score-Daten erhaelt (Referenz: `get-kiez-score.ts` + `ui.kiezScore`). Analoges Muster fuer Demografie-Daten aus dem 10.0-Pipeline-Output.
  - [ ] 4.2 Wenn 10.0 einen separaten JSON-Endpunkt nutzt: `loadKiezDemografie()` in `src/lib/data/get-kiez-demografie.ts` (NEU). Wenn 10.0 den bestehenden Kiez-Score-JSON erweitert: Felder direkt aus `ui.kiezScore` lesen. Entscheid haengt vom 10.0-Output-Format ab (muss mit 10.0-Dev-Agent abgestimmt werden, bevor 4.1 implementiert wird).
  - [ ] 4.3 `$effect` in `inspector-panel.svelte` laedt Demografie-Daten beim Adress-Wechsel, analog `loadLayerAggregates()` (Zeile ~94-103). Null-Fallback bei Fetch-Fehler.

- [ ] **Task 5: value-severity + layer-compare Registrierung** (AC: #1)
  - [ ] 5.1 Slug `'einwohner-dichte-2024'` (oder den von 10.0 festgelegten Slug) als `'neutral'` in `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts` eintragen, analog `'mss-gesamtindex-2025'` (Zeile 156)
  - [ ] 5.2 Slug als `'categorical-neutral'` in `src/lib/utils/layer-compare.ts` eintragen, analog Zeile 39

## Dev Notes

### Ist-Zustand: Was existiert

**inspector-panel.svelte** (630 Zeilen): rendert `<KiezScoreSection>` (Zeile 535), dann `<WahlSection>` (Zeile 541), dann `{#each sections}`. `DemografieBlock` kommt direkt nach `<WahlSection>`. Datei ist bereits 630 Zeilen, neue Imports + ein Block-Aufruf kommen dazu. Kein Refactoring der Gesamtstruktur noetig.

**sections.ts** (111 Zeilen): `SectionKey`-Union + `SECTION_ORDER` kennt kein `demografie`. Der Demografie-Block ist kein `SectionKey`, kein `LayerHit`-basiertes Rendering. Er steht ausserhalb des `{#each sections}`-Loops, direkt als eigene Komponente.

**MSS-Vorbild (categorical-neutral):**
- `value-severity-mapping.ts`, Zeile 155-157: `'mss-gesamtindex-2025'` gibt `'neutral'` zurueck
- `layer-compare.ts`, Zeile 38-39: `'mss-gesamtindex-2025': 'categorical-neutral'`
- MSS erscheint in `inspector-panel.svelte` als `LayerCard` (in `CARD_SLUGS`-Set, Zeile 133). Der Demografie-Block ist jedoch KEINE `LayerCard` -- er hat keinen `LayerHit`, keine Layer-Karte. Er ist eine eigenstaendige Inspector-Section, analog `<KlimaSection>` oder `<WahlSection>`.

**UiState** (`src/lib/state/ui-context.svelte.ts`): aktuell 87 Initialfelder. `kiezDemografie: KiezDemografieData | null` wird als Story-6.3-analoges Feld hinzugefuegt (analog `wahlResults`, Zeile 56).

**KiezDemografieData-Felder:** kommen aus 10.0-Pipeline-Output. 10.0 verspricht: Gesamt-Einwohner, Kinder 0-6, Kinder 6-12, Senioren 65+, Einwohnerdichte (EW/km² aus LOR-Flaeche). Alter-Anteile als Prozentsatz berechnen (count / gesamt-einwohner).

**klima-section.svelte** (Vorbild fuer eigenstaendige Section-Komponente): Props `station` + `series`, rendert null-safe, hat eigenen Datenstand-Banner via `data-stand-banner.svelte`. Der Demografie-Block folgt demselben Muster.

**data-stand-banner.svelte**: erwartet `LayerHit` als Prop (inkl. `source`, `license`, `updatedAt`). Fuer den Demografie-Block direkte Ausgabe als `<p>` (kein `LayerHit`-Objekt). Datenstand "31.12.2024", Quelle "Amt fuer Statistik Berlin-Brandenburg", Lizenz "CC-BY".

### Was nicht brechen darf

- `inspector-panel.svelte` bricht bei fehlenden Svelte-5-`$props()`-Destructuring oder falschem `$state`-Ort
- `UiState`-Erweiterung erfordert konsequenten Initialwert `null` in `createUiState()` (Zeile 61-90), sonst TS-Error
- `kiez-score-section.svelte` und `wahl-section.svelte` bleiben unveraendert
- `sections.ts` bleibt unveraendert (kein neuer `SectionKey`)
- `pnpm check` muss gruen bleiben (kein `any`, strict TypeScript)

### Abhaengigkeit 10.0: Open Question

Die genaue Schnittstelle zwischen 10.0-Pipeline-Output und Inspector ist in Story 10.5 noch nicht festgelegt. Zwei Varianten:
1. **Erweiterter Kiez-Score-JSON** (`kiez-scores.json`): 10.0 fuegt Demografie-Felder pro PLR/BZR hinzu, `get-kiez-score.ts` liefert sie mit.
2. **Separater JSON-Endpunkt** (`/kiez-scores/kiez-demografie.json`): eigener Fetch, eigenes Cache-Modul analog `get-layer-aggregates.ts`.

**Entscheid vor Task 4.1 zwingend mit 10.0-Dev-Agent abstimmen.** Bis dahin: `KiezDemografieData`-Interface + Komponente (Tasks 1-3) sind 10.0-unabhaengig implementierbar.

### Architektur MUST-Rules

- Dateien <500 Zeilen (#2): `demografie-block.svelte` <200 Zeilen, `demografie-types.ts` <50 Zeilen
- Kein `any` (#7): `KiezDemografieData` vollstaendig typisiert
- `@lucide/svelte`, kein `lucide-svelte` (CLAUDE.md global)
- Kein Toast, keine Snackbar: Fehler-/Leer-Zustaende inline im Block
- Kein `console.log` in committed Code
- Mobile-first: `hyphens-auto break-words` auf allen Text-Elementen, responsive text-sizes

### Previous Story Intel

- **Story 1.30 (MSS):** Referenz-Implementation fuer categorical-neutral im Inspector. `mss-gesamtindex-2025` als `CARD_SLUG` (Zeile 133 inspector-panel.svelte), Severity `'neutral'` (value-severity-mapping.ts:156), compare-profile `'categorical-neutral'` (layer-compare.ts:39).
- **Story 6.3 (Wahl-Section):** Vorbild fuer eigenstaendige Inspector-Section mit eigenem Datenstrom ausserhalb `{#each sections}`. `WahlSection` Props `results: WahlResultsAtPoint | null`.
- **Story 1.28 (Kiez-Score):** Daten-Lade-Pattern via `$effect` + LRU-Cache, Null-Fallback.
- **ADR-012:** Red-Green-Commit-History zwingend. Failing-Test-Commit muss vor Implementierungs-Commit stehen.
- **Memory `feedback_no_lebenswert`:** Kein Wertungsvokabular. "Bevölkerungsprofil" statt "Lebensqualitaet durch Dichte".
- **Memory `feedback_mobile_first`:** `hyphens-auto`, `break-words`, `responsive text-sizes` von Beginn an.

## References

- `docs/adr/ADR-015-score-composition-umwelt-infra.md` (Dichte = neutral, kein Score-Input)
- `docs/adr/ADR-012-tdd-mandate.md` (TDD-Mandat)
- `src/lib/components/atlas/inspector-panel.svelte` (Zeilen 133, 535-541, 595-620: CARD_SLUGS, Section-Render-Order)
- `src/lib/components/atlas/inspector-panel/internal/sections.ts` (SectionKey-Union, unveraendert)
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts` (Zeilen 155-157: MSS-neutral-Muster)
- `src/lib/utils/layer-compare.ts` (Zeilen 38-39: categorical-neutral-Muster fuer MSS)
- `src/lib/components/atlas/inspector-panel/klima-section.svelte` (Vorbild fuer eigenstaendige Section-Komponente)
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte` (Datenstand-Ausgabe-Pattern)
- `src/lib/state/ui-context.svelte.ts` (UiState-Erweiterung, Zeilen 51-58)
- `_bmad-output/planning-artifacts/epics.md` Zeilen 3412-3436 (Story 10.0 ACs: LOR-Join, Alters-Bucketing, Dichte-Berechnung)
- `_bmad-output/planning-artifacts/epics.md` Zeilen 3504-3518 (Story 10.5 ACs)
- `_user-input/datenaufloesung-audit-2026-05-21.md` Zeilen 163-167 (V4: Einwohner-CSV analog MSS)

## Dev Agent Record

### Agent Model Used

_

### Debug Log References

_

### Completion Notes List

_

### File List

**Neu (Implementation):**
- `src/lib/components/atlas/inspector-panel/demografie-block.svelte`
- `src/lib/components/atlas/inspector-panel/internal/demografie-types.ts`

**Geaendert (Implementation):**
- `src/lib/state/ui-context.svelte.ts` (`kiezDemografie`-Feld in UiState + Initialwert)
- `src/lib/components/atlas/inspector-panel.svelte` (Import + Block-Aufruf nach WahlSection + ggf. `$effect` fuer Daten-Load)
- `src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts` (Demografie-Slug als `'neutral'`)
- `src/lib/utils/layer-compare.ts` (Demografie-Slug als `'categorical-neutral'`)
- _(optional, abhaengig von 10.0-Schnittstelle)_ `src/lib/data/get-kiez-demografie.ts`

**Neu (Tests):**
- `src/lib/components/atlas/inspector-panel/demografie-block.svelte.test.ts`

**Geaendert (Tests):**
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (Smoke-Test Demografie-Block)

## Change Log

- 2026-05-21: Story erstellt (Story 10.5, V4, Audit-Datei Zeile 163)
