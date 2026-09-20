---
title: 'Sankey-Rework: Gebiets-Spalte, d3-sankey, Hover-Interaktion'
type: 'feature'
created: '2026-09-20'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Story-8-Sankey-Fassung (gebündelte Partei-Übergänge, statisches Eigenbau-SVG ohne Interaktion) verfehlt die gewünschte Lesart; Matze 20.09.: „unfassbar schlecht in der jetzigen Fassung", komplett überarbeiten. Live-Belege (Matze 10:12, Screenshots): (a) die SPD-Bänder der AGH-Kiez-Ansicht kreuzen unlesbar durch die ganze Fläche, „versteht so niemand"; (b) die 2023er-Spalte wirkt wie ein Datenfehler („wo sind die anderen Parteien?"), weil die Sieger-Semantik (nur Parteien mit mindestens einem Platz-1-Gebiet erscheinen als Knoten) nirgends erklärt wird.

**Approach (Matze-Direktive 20.09. 08:01):** Neues Spalten-Modell: **Spalte 1 = ein Knoten je Gebiet der gewählten Ebene** (Kiez 143 / Bezirk 12), eingefärbt nach dem Gewinner der ersten effektiven Wahl der Reihe; **ab Spalte 2 je Wahl der Reihe die Parteien untereinander** (Spalte 2 = erste Wahl, chronologisch weiter, Wiederholungs-Merge-Regel gilt). Flüsse: Gebiet→Partei der ersten Wahl (ein Band je Gebiet, value 1), danach gebündelte Partei→Partei-Übergänge wie bisher. **Umsetzung mit `d3-sankey`** (neue Dependency, lazy geladen, eigener Chunk) statt Eigenbau-Layout, mit **Tooltips und Mouseover-Highlight einzelner Flüsse** (Hover hebt ein Band, dimmt die übrigen). Die Wahl-Reihe kommt aus der globalen Sticky-Leiste (Story 10); lokal bleibt nur der Ebenen-Toggle. Diese Direktive ersetzt die Story-8-Boundary „kein d3-sankey, eigene SVG-Primitives, Flüsse nie pro Gebiet" für den Sankey.

## Boundaries & Constraints

**Always:**
- Datenmodell: neues pures Modul `internal/sankey-graph.ts` baut Nodes/Links aus der Bulk-Winners-Response VOR d3 (voll unit-testbar); d3-sankey macht ausschließlich das Layout. Die Daten-Invarianten der Story-8-Tests wandern auf das Graph-Modul: Spaltensumme = Gebiete mit Daten in diesem Jahr; Partei→Partei gebündelt (ein Band je Paar); Eltern-Jahr nie als Spalte (2021→2023); Mittelspalten-Start; leere Eingabe ohne Crash; NEU: jeder Gebiets-Knoten hat genau einen ausgehenden Link, Summe der Gebiet-Links = Gebietszahl.
- `wechsel-data.ts`: Gebiets-Erste-Wahl über eine neue Funktion (oder Export von `groupByGebiet`/`pointsFromGebietRows`), NIEMALS die Merge-Logik duplizieren; `mergeEffectiveSeries`/`computeWechselFromRows`/`parentJahrFromParentSlug` bleiben unverändert (Parity-Test `wechsel-client-parity.test.ts` bleibt wörtlich gültig).
- d3-sankey: Dependency + `@types/d3-sankey`; in `vite.config.ts` eigene manualChunks-Regel `d3-sankey`/`d3-shape` → Chunk `sankey` VOR der layerchart-Regel; Lazy-Load im Controller (`await import('d3-sankey')`) mit injizierbarer Factory als Test-Naht (Muster `mapFactory` der MapLibre-Controller); nicht in `optimizeDeps.include`.
- Gebiets-Namen über `KiezBezirkGeometryLoader` + `buildNameBySlugMap` (Muster `wechsel-kapitel.svelte`); Gebiets-Knoten-Farbe ausschließlich `parteiColor(gewinnerErsteWahl)`.
- Interaktion: eigener `sankey-tooltip.svelte` nach `winner-map-tooltip.svelte`-Muster (relative-Wrapper, pointermove-Position, role="tooltip", aria-live polite); Hover-Highlight per Klassen (aktives Band volle Deckkraft, übrige gedimmt), Transitions nur `motion-safe:`; Tastatur: Bänder/Knoten sind fokussierbar (tabindex) und zeigen den Tooltip bei Fokus.
- Selbsterklärend: ein sichtbarer Erklär-Satz direkt am Sankey benennt die Sieger-Semantik (sinngemäß: „Jeder Knoten zeigt, in wie vielen Gebieten eine Partei stärkste Kraft war; Parteien ohne Platz-1-Gebiet erscheinen in dem Jahr nicht.", `lint:wahl`-konform); der Tooltip eines Partei-Knotens nennt „stärkste Kraft in N von M Gebieten". Das beantwortet die „Wo sind die anderen Parteien?"-Frage direkt in der Grafik.
- Layout-Dimensionen: SVG-Höhe wächst mit der Gebietszahl (Richtwert ≥ 8 px je Gebiets-Knoten, Kiez ~1150 px, Bezirk kompakt); Gebiets-Labels nur, wenn die Knoten-Höhe reicht (Bezirk ja, Kiez nein: dort tragen Tooltip + Tabelle die Namen); Label-Margin für Partei-Namen wie Bestand.
- Kontinuität: Testids `sankey-wahljahre`, `-svg`, `-empty`, `-error`, `-loading`, `-takeaway`, `-datenstand`, Fußnoten-Ids, `sankey-ebene`/`-kiez`/`-bezirk` und die Tabellen-Alternative (`table-toggle`/`data-table` mit Von/Nach/Jahr/Gebiete-Zeilen) bleiben erhalten (E2E + trends-kapitel-Tests hängen daran); ZUSÄTZLICH eine zweite Tabelle „Gebiet · Gewinner erste Wahl" als Alternative zur Gebiets-Spalte (Disclosure ab 20 Zeilen, Muster Wechsel-Liste).
- Zustands-/Loader-Muster unverändert: `KiezBezirkWinnersLoader` (Modul-Cache), Ebenen-Toggle kapitel-lokal mit bestehenden Testids, Lade-/Fehler-/Leer-Zustände, Datenstand-Zeile, Wiederholungs- und Coverage-Fußnoten (Coverage nur Kiez, `showCoverageHinweis`-Prop bleibt).
- `docs/wahldaten-methodik.md` Z. 270-274 umschreiben (neues Spalten-Modell, Erste-Spalte NICHT gebündelt: genau ein Band je Gebiet; Färbungs-Regel; d3-sankey lazy statt „kein d3-sankey"); `lint:wahl`; keine Em-Dashes; Dateien < 500 Zeilen.

**Never:**
- Kein Layout-Eigenbau mehr (`sankey-layout.ts` wird ersetzt/entfernt, seine Tests wandern als Daten-Invarianten auf `sankey-graph.ts`); keine Crossing-Optimierung von Hand (macht d3).
- Nie Stimmbezirks-Ebene (LOR-stabile Ebenen only); Bandbreiten zählen Gebiete, nie Personen; keine „Wählerwanderungs"-Sprache.
- Kein Umbau von Story-10-Artefakten (Sticky-Reihe, Karten-Steuerung, Badges), von `trends-kapitel.svelte` über den Sankey-Einbettungs-Block hinaus, oder der Winners-/Geometrie-Loader.
- Keine eigene Reihen-Auswahl am Sankey (Reihe ist global, Story 10).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bezirk-Ansicht | Ebene Bezirk, AGH | 12 Gebiets-Knoten (Gewinner-Farbe erste Wahl, Label sichtbar) → Partei-Spalten je Wahl; 12 Einzel-Bänder in Spalte 1→2, danach gebündelt | N/A |
| Kiez-Ansicht | Ebene Kiez | 143 Gebiets-Knoten (hohe SVG, ohne Einzel-Labels), Hover/Tooltip nennt Gebiet + Gewinner | N/A |
| Hover Band | Mouseover Partei-Übergang | Band hebt sich, übrige dimmen, Tooltip „SPD → GRÜNE, 2023: N Gebiete"; mouseout stellt zurück | N/A |
| Hover Gebiets-Band | Mouseover Spalte 1→2 | Tooltip „<Gebietsname>: <Partei> (erste Wahl <jahr>)" | N/A |
| Fokus statt Maus | Tab auf Band | Gleicher Tooltip bei Fokus, Highlight ohne Transition bei prefers-reduced-motion | N/A |
| Wiederholungswahl | AGH-Reihe | Spalten 2016, 2023 ·W (2021 ersetzt), identische Merge-Semantik wie bisher | N/A |
| Dominanz-Jahr | AGH 2023 (fast nur CDU/GRÜNE Platz 1) | Erklär-Satz + Knoten-Tooltip („stärkste Kraft in N von 143 Gebieten") machen klar, warum kleine Parteien fehlen; kein Eindruck eines Datenfehlers | N/A |
| Ebenen-Toggle | Kiez↔Bezirk | Umbau ohne neuen Request bei Cache-Hit, Layout-Höhe passt sich an | N/A |
| DB-los / leer | Winners leer | Bestehender Leer-Hinweis, kein d3-Import nötig | Leer-Zustand |
| Lazy-Chunk | Erster Render | d3-sankey lädt als eigener Chunk erst mit dem Sankey, nicht im Portal-Initial-Bundle | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/wahl-portal/sankey-wahljahre.svelte` (284 Z.) -- Bestand: Props `{fetchFn, showCoverageHinweis}`, Ebenen-Toggle (`sankey-ebene-*`, `nextRadioIndex`), Status-Gates, Fußnoten, Tabellen-Alternative (Von/Nach/Jahr/Gebiete, Sortierung jahr→anzahl→de), aria am `<svg role="img">`, `LABEL_MARGIN 90`/`LABEL_MIN_HEIGHT 10`; Derived-Kette rows→spalten/uebergaenge/parteiAnzahl→layout. Umbau auf Graph+d3+Tooltip; Datei-Limit beachten (Tooltip/Interaktion nach `internal/`).
- `internal/wechsel-data.ts` -- `computeUebergaengeFromRows`, `effectiveJahreFromRows`, `parteiAnzahlProJahrFromRows` wiederverwenden; privat: `pointsFromGebietRows`, `groupByGebiet` (für Gebiets-Erste-Wahl exportieren oder neue `gebietErsteWahlFromRows(rows): Map<slug, {jahr, partei}>` daneben).
- `internal/sankey-layout.ts` + Test -- wird ersetzt; Invarianten-Helper (`assertInvarianten`) und Fixtures aus `sankey-layout.test.ts` auf NEU `internal/sankey-graph.ts`+Test übertragen (Spaltensummen, Bündelung, Eltern-Jahr, Mittelspalten-Start, leer).
- NEU `internal/sankey-d3.svelte.ts` (Controller) -- lazy `await import('d3-sankey')`, injizierbare Factory (Test-Naht, Muster `winner-map-maplibre.svelte.ts` `mapFactory`); Node-Sortierung deterministisch (d3 `nodeSort`/`linkSort` mit de-Vergleich).
- NEU `internal/sankey-tooltip.svelte` -- Muster `winner-map-tooltip.svelte` (82 Z.: pointer-events-none absolute, pos+12px, role=tooltip, Testids analog `sankey-tooltip-*`).
- `src/lib/components/wahl-portal/internal/winner-map-geometry.svelte.ts` + `wechsel-map-data.ts#buildNameBySlugMap` -- Gebiets-Namen (Muster `wechsel-kapitel.svelte` Z. 28/77); Sankey lädt damit erstmals Geometrie: Component-Test-`fetchFn` braucht Manifest/Layer-Fixtures (Muster `wechsel-kapitel.svelte.test.ts`).
- `vite.config.ts` (manualChunks Z. 48-60) -- neue Regel `d3-sankey|d3-shape → 'sankey'` VOR layerchart; `package.json` + `pnpm add d3-sankey @types/d3-sankey`.
- Tests-Bestand: `sankey-wahljahre.svelte.test.ts` (6 Tests: Zustände/Fußnoten/Toggle-Cache bleiben; Struktur-Test aufs neue Spalten-Modell), `trends-kapitel.svelte.test.ts` (Testids `sankey-wahljahre-svg`/`-empty` müssen überleben), `tests/e2e/berlin-wahlen.e2e.ts` Z. 575-613 (Tabellen-Assertions 'Gebiete'/'SPD'/'GRÜNE'/'2023'), `wechsel-client-parity.test.ts` (NICHT anfassen).
- `docs/wahldaten-methodik.md` Z. 270-274 -- Absätze umschreiben (s. Boundaries).
- `internal/sankey-wahljahre-context-probe.svelte` -- `showCoverageHinweis` und ggf. `sankeyFactory` durchreichen.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [ ] `pnpm add d3-sankey @types/d3-sankey` + `vite.config.ts`-Chunk-Regel -- Build zeigt eigenen `sankey`-Chunk.
- [ ] `internal/wechsel-data.ts` + Test -- Gebiets-Erste-Wahl-Funktion (Merge-Regel via Bestands-Helfer, keine Duplikation; Parity-Test bleibt grün).
- [ ] `internal/sankey-graph.ts` + Test -- Nodes/Links-Konstruktion (Gebiets-Spalte + Partei-Spalten, Invarianten aus sankey-layout.test übernommen + Gebiets-Link-Invarianten).
- [ ] `internal/sankey-d3.svelte.ts` + Test -- Lazy-Layout-Controller mit Factory-Naht; deterministische Sortierung; Höhen-Formel (≥8 px/Gebiet, Bezirk kompakt).
- [ ] `internal/sankey-tooltip.svelte` + Test -- Tooltip-Komponente.
- [ ] `sankey-wahljahre.svelte` + Tests -- Umbau: Graph→d3→SVG (Gebiets-Knoten in Gewinner-Farbe, Partei-Spalten, ·W-Label), Hover-/Fokus-Highlight (motion-safe), Tooltip-Verdrahtung, Erklär-Satz (Sieger-Semantik), zweite Tabellen-Alternative „Gebiet · Gewinner erste Wahl" (Disclosure ab 20), bestehende Zustände/Fußnoten/Toggle/Testids erhalten; `sankey-layout.ts` entfernen.
- [ ] `docs/wahldaten-methodik.md` -- Sankey-Absätze umschreiben.
- [ ] Tests/E2E -- bestehende Assertions grün (Tabelle Von/Nach/Jahr/Gebiete), neuer E2E-Hover-Smoke (Tooltip erscheint), Component-Test mit Manifest/Layer-Fixtures.

**Acceptance Criteria:**
- Given Ebene Bezirk (AGH), then zeigt Spalte 1 zwölf benannte Gebiets-Knoten in der Farbe des Gewinners der ersten Wahl, gefolgt von Partei-Spalten je Wahl (2021 nie als Spalte); Hover auf einem Band hebt es hervor, dimmt die übrigen und zeigt einen Tooltip mit Von/Nach/Anzahl bzw. Gebietsname.
- Given Ebene Kiez, then rendert der Sankey 143 Gebiets-Knoten in angemessener Höhe; Gebietsnamen sind über Tooltip, Fokus und die Gebiets-Tabelle zugänglich.
- Given ein Dominanz-Jahr (AGH 2023), then erklären Erklär-Satz und Knoten-Tooltips die Sieger-Semantik sichtbar; kein Eindruck fehlender Daten.
- Given der Produktions-Build, then liegt d3-sankey in einem eigenen lazy Chunk; `pnpm lint:wahl`, Axe-E2E und der Parity-Test bleiben grün.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Die Testgrenze verschiebt sich bewusst: Graph-Konstruktion (rein, alle Daten-Invarianten) vs. d3-Layout (nur Smoke/Determinismus). Die Gebiets-Spalte macht die Spaltensummen-Invariante anschaulich: Summe der Gebiet-Links = Gebietszahl, danach bleiben die Partei-Übergänge gebündelt. Bei Kiez tragen Tooltip, Fokus-Reihenfolge und die Gebiets-Tabelle die Lesbarkeit (143 Knoten sind bewusst dicht, Matze-Direktive); Bezirk ist die kompakte, voll beschriftete Ansicht.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- `pnpm exec vite build` -- expected: eigener `sankey`-Chunk im Output, dann Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün
