# Story 14.4: Konsumenten-Migration (Inspector + Map + Compare, Stigma-konform)

Status: review

> **Anker:** ADR-015 (Anti-Stigma), ADR-019, Story 1.31 (Choropleth-Familien). Analog Story 13.4, aber **Strukturell-Indigo statt Gut-Grün** und **kein Composite-Ring-Segment**.
> **Hard-Block:** Story 14.3 `done`. Parallel zu 14.5 möglich.

## Story

As a User,
I want die Kriminalitäts-Dimension als neutralen Kontext sehen,
so that Inspector, Karte und Vergleich sie ohne Stigma und ohne Verfälschung des Gesamt-Scores darstellen.

## Kontext: Warum dieser Change

Kultur (13.4) wurde als 6. Ring-Segment + Gut-Grün-Choropleth + Ranking-Spalte ausgerollt. Kriminalität ist anders: **Kontext-Layer, nicht gefeierte Dimension.** Sie bekommt einen eigenen Choropleth (Strukturell-Indigo), eine Inspector-Section und Compare, aber **kein Gut-Wertungs-Ring-Segment** und bleibt von der OG-Score-Card fern. Framing folgt der MSS-Soziale-Lage-Behandlung (Disclaimer, kein „besser"-Pfeil).

## Acceptance Criteria

1. **AC-1 (Surfacing als Kontext):**
   **Given** die Werte aus 14.3
   **When** ich Inspector-Section, Choropleth-Score-Layer (`kiez-score-kriminalitaet`), `kiez-score-compare-block` und LLM-Renderer migriere
   **Then** erscheint Kriminalität als eigene Kontext-Dimension mit neutraler Bezeichnung „Erfasste Kriminalität (Häufigkeitszahl)", **Strukturell-Indigo-Familie** (Story-1.31-Tokens), **kein Gut-Grün**, **kein Composite-Ring-Gut-Segment**, OG-Score-Card bleibt Composite-only

2. **AC-2 (Stigma-Schutz + Disclaimer):**
   **Given** ADR-019 (Redlining-Schutz)
   **When** Kriminalität gerendert wird
   **Then** kein „sicher/gefährlich"-Label, kein „besser"-Pfeil; ein Disclaimer (analog MSS, `layer-explain.ts` / `editorial-disclaimer.svelte`) erklärt HZ ≠ persönliches Risiko, Touristen/Pendler-Verzerrung, Dunkelfeld
   **And** die **BR-Granularität** ist sichtbar gekennzeichnet (Wert gilt pro Bezirksregion, nicht adress-genau)

3. **AC-3 (A11y):**
   **Given** WCAG
   **When** der Choropleth + Inspector rendern
   **Then** Farbe ist nicht alleiniger Informationsträger (Wert/Label sichtbar), Kontrast erfüllt, Tastatur-Fokus konsistent

## Tasks / Subtasks

- [x] **Task 1: Inspector + Choropleth** (AC: #1, #2, #3)
  - [x] 1.1 Inspector-Section: `kriminalitaet`-Row mit **neutraler** Severity (scaleFor dimension-aware) + Stigma-Disclaimer (`kriminalitaet-aggregat`) wenn Wert vorliegt
  - [x] 1.2 Choropleth-Layer `kiez-score-kriminalitaet` als `choropleth-kiez-score-strukturell-4` (Indigo, Story-1.31-Tokens) — Commit 9b8a0b4
  - [x] 1.3 `layer-explain.ts`: Eintrag (Quelle Polizei Berlin, HZ-Definition, BR-Granularität, Touristen-Caveat) — Commit d91dbba
- [x] **Task 2: Compare + LLM** (AC: #1, #2)
  - [x] 2.1 `kiez-score-compare-block`: Kriminalität als Kontext-Zeile, neutrale Chips (kein Gut-Pfeil)
  - [x] 2.2 `aggregate-renderer.ts`: neutraler Satz + Hinweis (HZ ≠ Risiko, BR-Granularität, Touristen-Verzerrung), kein Wertungs-Wording
- [x] **Task 3: Ring-/OG-Abgrenzung** (AC: #1)
  - [x] 3.1 Verify: Score-Ring (eigene 6-Dim-Liste) zeigt KEIN Kriminalitäts-Segment, Overall-Meta „5/5", OG-Card unberührt (kein kriminalitaet-Feld)
- [x] **Task 4: TDD/Verify** (AC: #3)
  - [x] 4.1 Tests: scaleFor neutral für kriminalitaet, Section-Disclaimer + neutrale Chip, kein Disclaimer ohne Wert. `pnpm test` grün (2833)

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- **Stigma-Vorbild MSS:** `layer-explain.ts` Z.50–53 (MSS-Texte), `aggregate-renderer.ts` Z.113–116 (LLM-Hinweis „niedriger Status ≠ schlechter Kiez"), `editorial-disclaimer.svelte` Z.18, `score-ranking-table.svelte` Z.168/341 (Strukturell-Family-Tokens Story 1.31), `distribution-bar.svelte` Z.14 (Indigo-Töne).
- **Label:** `kiez-score-display.ts` `DIMENSION_LABELS_DE` Z.9–15 (aus 14.1).

### Unterschied zu 13.4 (Kultur)

Kultur: Ring-Segment 6, Gut-Grün, Ranking-Spalte. Kriminalität: **kein Gut-Ring-Segment**, Indigo, Kontext-Disclaimer wie Soziale Lage. Falls eine Ranking-Darstellung gewünscht ist, dann ohne Gut-Wertung + mit Disclaimer (Owner-Entscheidung in 14.5/14.6).

### Was nicht brechen darf

- Composite-Ring + OG-Card unverändert. Kein „grün = sicher".

## References

- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts` (Z.50–53), `kiez-score-display.ts`
- `src/lib/components/atlas/editorial-disclaimer.svelte`, `score-ranking-table.svelte` (Z.168, 341), `distribution-bar.svelte`
- `src/lib/server/llms/internal/aggregate-renderer.ts` (Z.113–116)
- `docs/adr/ADR-015-...md`, `ADR-019-...md`, Story 1.31 (Choropleth-Familien)
- `_bmad-output/implementation-artifacts/13-4-konsumenten-migration-ui-map-og-llm.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- **Map (Commit 9b8a0b4, Review-getrieben):** Layer rendert als `choropleth-kiez-score-strukturell-4` (Indigo-Fläche statt Grenz-Linie), Tooltip mit Display-Name + neutralem Magnitude-Wert (`Erfasste Kriminalität: Stufe hoch (84/100)`) statt Roh-JSON.
- **Inspector (AC-1/2/3):** `scaleFor` ist jetzt dimension-aware → Kriminalität liefert **immer `neutral`-Severity** (grau), nie grün/orange. Damit kein „besser/schlechter"-Signal, egal ob Wert hoch oder niedrig. Eigener Stigma-Disclaimer (`kriminalitaet-aggregat`) erscheint, sobald ein Kriminalitäts-Wert vorliegt: HZ ≠ persönliches Risiko, Touristen/Pendler-Verzerrung, Dunkelfeld, BR-Granularität, kein Sicherheits-Ranking.
- **Compare:** `kriminalitaet` als Kontext-Zeile in `kiez-score-compare-block` ergänzt. Block hat keinen Gut-Pfeil, nur A/B-Chips → mit neutraler Severity automatisch stigma-konform.
- **LLM:** `aggregate-renderer` rendert „Erfasste Kriminalität (Häufigkeitszahl): X/100 (eigene Dimension, nicht im Composite)" + neutralen Hinweis (analog MSS-Soziale-Lage).
- **Ring/OG (AC-3.1):** Score-Ring nutzt eine eigene 6-Dimensions-Liste (ohne kriminalitaet) → kein Gut-Segment, Overall-Meta bleibt „5/5". OG-Card baut aus festen Composite-Feldern → kein kriminalitaet, unverändert. Beides ohne Code-Touch verifiziert.
- **A11y:** ValueChip zeigt Label + Wert (Farbe nicht alleiniger Träger), `neutral`-Severity hat eigene Kontrast-Tokens, Fokus/Tastatur identisch zu anderen Score-Rows.
- **Verifikation:** `pnpm check` 0 Errors / 6290 Files, Unit-Suite **2833/2833 grün** (neue Tests: scaleFor neutral, Section-Disclaimer + neutrale Chip, kein Disclaimer ohne Wert).

### File List

**Geändert (dieser Commit):**
- `src/lib/components/atlas/inspector-panel/internal/kiez-score-display.ts` (scaleFor dimension-aware) + `.test.ts`
- `src/lib/components/atlas/inspector-panel/kiez-score-section.svelte` (Stigma-Disclaimer conditional) + `.svelte.test.ts`
- `src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte` (Kontext-Zeile)
- `src/lib/components/atlas/internal/editorial-types.ts` + `editorial-disclaimer.svelte` (Variante `kriminalitaet-aggregat`)
- `src/lib/server/llms/internal/aggregate-renderer.ts` (ScoreLike + neutrale Zeile)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-4 → review)

**Vorab (Commit 9b8a0b4):** layer-style-builder, layer-palette-filter, value-formatters (Choropleth-Indigo + Tooltip).
**Vorab (Commit d91dbba):** layer-explain.ts (Coverage-Guard-Entry).

### Debug Log References

- Review-Finding 1: Layer als Grenz-Linie → fehlendes Style-Profil, Fix choropleth-kiez-score-strukturell-4.
- Review-Finding 2: Tooltip Roh-JSON → fehlender Display-Name + Value-Formatter.

## Change Log

- 2026-06-09: Story 14.4 erstellt (ready-for-dev). Strukturell-Indigo, kein Gut-Ring-Segment, MSS-Disclaimer-Muster, BR-Granularität gekennzeichnet.
- 2026-06-10: Story 14.4 implementiert (→ review). Choropleth-Indigo + Tooltip + neutrale Inspector-Severity + Stigma-Disclaimer + Compare-Zeile + LLM-Hinweis. Ring/OG unberührt. check 0 Errors, 2833 grün.
