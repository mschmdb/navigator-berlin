# Story 8.4: Compare-Mode-Multi-Level-Integration

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User der zwei Adressen vergleicht,
I want dass der Compare-Mode mit Multi-Level kombinierbar ist (Adresse A vs. Adresse B auf Kiez-Level),
so that „Wie vergleichen sich die Kieze meiner Adresse A und meines Compare-Targets B?" funktioniert.

## Acceptance Criteria

1. **Given** Story 1.27 Compare-Mode + Story 8.1 Level-Context, **When** User im Compare-Mode den Level wechselt, **Then** beide Adressen werden auf gleichem Level dargestellt (same-level-lock, kein Mismatch erlaubt). **And** Karten-Polygon-Highlight zeigt beide Kieze/Bezirke gleichzeitig.
2. **Given** evaluierbare vs. nicht-evaluierbare Layer (ADR-014 Abschnitt 5 / Spalte 4), **When** eine Compare-Aggregat-Card rendert, **Then** Diff-Indikator (Pfeil) nur bei `evaluierbar=ja`; categorical-neutral (Wohnlage, Bodenrichtwert) + Stigma-Layer (MSS, Stolpersteine, Kiez-Score-Composite) zeigen nur Nebeneinanderstellung, kein Richtungs-Pfeil.
3. **Given** Compare auf Kiez/Bezirk-Level, **When** A und B im selben Kiez/Bezirk liegen, **Then** das wird sauber dargestellt (gleiches Polygon, gleiche Aggregate) statt als künstlicher „Diff=0"-Fehlschluss.
4. **Given** Compare-Hero (Kiez-Score), **When** auf Kiez/Bezirk-Level verglichen wird, **Then** 5-Dim-Bar-Stack mit A/B-Paaren (kein Doppel-Ring, ADR-014 Abschnitt 5).
5. **Given** Backwards-Compat, **When** Compare ohne Level-Wechsel (Default address) genutzt wird, **Then** das heutige Compare-Verhalten (Story 1.27) ist unverändert.

## Tasks / Subtasks

- [ ] Task 1: Level-Context im Compare teilen + same-level-lock (AC: #1, #5)
  - [ ] Compare-Panel (`compare-panel/compare-panel.svelte`) liest denselben Level-Context (8.1). EIN globaler Level für beide Adressen, kein Per-Adresse-Level (same-level-lock, AC #1). Level-Toggle aus 8.1 steuert beide.
  - [ ] Bei address (Default): heutiges Compare bit-identisch (AC #5).
- [ ] Task 2: Compare-Sections auf Aggregat-Adapter (AC: #1, #2, #3)
  - [ ] `compare-panel/internal/merge-sections.ts` erweitern: bei Level≠address je Adresse das Aggregat über `aggregate-layer-for-level.ts` (8.2b) für den jeweiligen Kiez/Bezirk-Slug der Adresse holen, statt der Punkt-Hits. CompareRow trägt dann `aggregateA`/`aggregateB`.
  - [ ] `compare-row.svelte` rendert Compare-Aggregat-Cards: A + B im selben Visual (zwei Reihen) + Diff-Chip (ADR-014 Abschnitt 5). Nutzt 8.1b-Primitive.
  - [ ] Diff-Gate: bestehendes `EVALUATIVE_PROFILES`-Set + `getCompareProfile()` aus `src/lib/utils/layer-compare.ts` wiederverwenden und um die Aggregat-Level-Layer erweitern (ADR-014 Spalte 4). categorical-neutral + Stigma → kein Pfeil, nur Nebeneinander (AC #2). `NEUTRAL_CHIP_SLUGS` weiter respektieren.
  - [ ] Same-Kiez/Bezirk-Fall (AC #3): wenn A und B denselben Slug haben, nicht als Diff=0 framen, sondern „beide im selben Kiez X" o.ä. kennzeichnen.
- [ ] Task 3: Compare-Hero auf Bar-Stack (AC: #4)
  - [ ] `kiez-score-compare-block.svelte` nutzt 5-Dim-Bar-Stack mit A/B-Paaren (8.1b), kein Doppel-Ring. Auf Kiez/Bezirk-Level zieht es die aggregierten Kiez-Scores beider Adressen.
- [ ] Task 4: Karten-Doppel-Highlight (AC: #1)
  - [ ] Story-8.3-Highlight im Compare-Mode beide Polygone (A + B) gleichzeitig rendern. Highlight-Source nimmt FeatureCollection mit zwei Features, A/B optisch unterscheidbar (z.B. zwei Accent-Töne, beide stigma-neutral). Koordination mit 8.3 (gleiche Highlight-Source/Layer, nur 2 Features).
- [ ] Task 5: Tests (TDD, AC-Mapping)
  - [ ] `merge-sections.ts` erweitert: Level≠address mergt Aggregate korrekt, same-slug-Fall, fehlender Aggregat-Slug graceful. Unit ≥90%.
  - [ ] Diff-Gate-Test: evaluierbar→Pfeil, categorical-neutral/Stigma→kein Pfeil (reuse + erweiterte Layer-Liste). Das EVALUATIVE_PROFILES-Verhalten ist bereits getestet (Story 6.3/1.27); Erweiterung mit Tests absichern.
  - [ ] Backwards-Compat: address-Compare unverändert (Regressions-Test, AC #5).
  - [ ] Component-Smoke Compare-Aggregat-Card + Hero-Bar-Stack. KEIN fetch-Spy in *.svelte.test.ts.
  - [ ] Doppel-Highlight via E2E (compare-flow Suite).
  - [ ] Red-then-Green-History pro AC.

## Dev Notes

### Scope + Sequencing

Braucht 8.1 (Level-Context) + 8.2b (Aggregat-Adapter + Cards) + 8.1b (Primitive) + ideal 8.3 (Highlight, für AC #1 Doppel-Polygon). ADR-014 Wave-Plan: 8.4 in der dritten Welle parallel zu 8.2b/8.5. Praktisch hängt 8.4 an 8.2b (Adapter) — Reihenfolge im Dev: nach 8.2b.

### same-level-lock (ADR-014 Abschnitt 5 + 6)

EIN Level für beide Adressen. Kein Mismatch (A auf Kiez, B auf Bezirk) erlaubt. Der Level-Context ist global (8.1), der Compare teilt ihn. Das ist der zentrale Constraint.

### Diff-Gate (ADR-014 Abschnitt 5, Spalte 4) — bestehende Infrastruktur

- `src/lib/utils/layer-compare.ts`: `CompareProfile`-Union, `LAYER_COMPARE_PROFILE`-Record, `getCompareProfile()`.
- `compare-row.svelte`: `EVALUATIVE_PROFILES`-Set steuert ob Diff-Pfeil rendert; `NEUTRAL_CHIP_SLUGS` unterdrückt Severity-Färbung.
- Diese Logik wird WIEDERVERWENDET und um die Level-Aggregat-Layer ergänzt, nicht neu gebaut (Memory `project_compare_editorial_profiles`).
- Stigma-Lock: Wohnlage/Mietspiegel categorical-neutral, MSS/Stolpersteine/Kiez-Score-Composite kein Richtungs-Pfeil (ADR-014 Spalte 4).

### Compare-Hero (AC #4)

Ring mit zwei Datensätzen ist unleserlich (ADR-014 Abschnitt 5). Compare nutzt 5-Dim-Bar-Stack mit A/B-Paaren. `kiez-score-compare-block.svelte` ist die bestehende Vorlage, auf 8.1b-Bar-Stack-Primitive umstellen.

### Backwards-Compat (AC #5)

Compare ohne Level-Wechsel = heutiges Verhalten (Story 1.27). Additiver Adapter. Bestehende compare-flow-Tests grün halten (High-Risk, 50+ Tests-Awareness aus Epic-8-Intro).

### Project Structure Notes

- Touch: `compare-panel/compare-panel.svelte`, `compare-panel/internal/merge-sections.ts`, `compare-panel/compare-row.svelte`, `compare-panel/kiez-score-compare-block.svelte`, `src/lib/utils/layer-compare.ts` (Layer-Liste erweitern), Highlight-Koordination mit 8.3.
- Reuse: 8.1b-Primitive, 8.2b-Adapter, EVALUATIVE_PROFILES-Gate.
- Files <500 LOC, @lucide/svelte, kein `any`. svelte-autofixer nach Änderung.

### TDD (ADR-012)

merge-sections + Diff-Gate Test-First ≥90%. Regressions-Test address-Compare Pflicht. Component-Smoke + E2E für Doppel-Highlight.

### References

- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#5-compare-modus]
- [Source: docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md#6-backwards-compatibility]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.4]
- [Source: src/lib/components/atlas/compare-panel/compare-panel.svelte + internal/merge-sections.ts + compare-row.svelte]
- [Source: src/lib/utils/layer-compare.ts (CompareProfile + EVALUATIVE_PROFILES)]
- [Source: src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte]
- [Source: Story 8.1 / 8.1b / 8.2b / 8.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
