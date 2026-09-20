---
title: 'Sankey-Rework: Gebiets-Spalte, d3-sankey, Hover-Interaktion'
type: 'feature'
created: '2026-09-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '0fa3a04'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Story-8-Sankey-Fassung (gebündelte Partei-Übergänge, statisches Eigenbau-SVG ohne Interaktion) verfehlt die gewünschte Lesart; Matze 20.09.: „unfassbar schlecht in der jetzigen Fassung", komplett überarbeiten. Live-Belege (Matze 10:12, Screenshots): (a) die SPD-Bänder der AGH-Kiez-Ansicht kreuzen unlesbar durch die ganze Fläche, „versteht so niemand"; (b) die 2023er-Spalte wirkt wie ein Datenfehler („wo sind die anderen Parteien?"), weil die Sieger-Semantik (nur Parteien mit mindestens einem Platz-1-Gebiet erscheinen als Knoten) nirgends erklärt wird.

**Approach (Matze-Direktive 20.09. 08:01, REVIDIERT 12:07):** Spalten-Modell wie Story 8: **je Wahl der Reihe eine Spalte, Knoten = Parteien untereinander** (Wiederholungs-Merge-Regel gilt), Bänder = gebündelte Partei→Partei-Übergänge (ein Band je Paar, Bandbreite = Anzahl Gebiete). KEINE Gebiets-Spalte, keine Einzel-Bänder pro Gebiet: der Live-Test (Matze 12:07, Screenshots) zeigte, dass 143 Einzel-Bänder die Kiez-Ansicht in einen unlesbaren Filz verwandeln („jetzt ist nicht benutzbar; das Beschränken auf [gebündelte] Daten war vorher besser"). **Was bleibt (Matze: „mit d3 sieht es besser aus"): Umsetzung mit `d3-sankey`** (lazy, eigener Chunk) statt Eigenbau-Layout, mit **Tooltips und Mouseover-Highlight einzelner Flüsse** (Hover hebt ein Band, dimmt die übrigen), Fokus-Tooltips, Erklär-Satz zur Sieger-Semantik. Die Wahl-Reihe kommt aus der globalen Sticky-Leiste (Story 10); lokal bleibt nur der Ebenen-Toggle. Diese Direktive ersetzt die Story-8-Boundary „kein d3-sankey, eigene SVG-Primitives" für den Sankey; die Story-8-Regel „Flüsse nie pro Gebiet" gilt wieder.

## Boundaries & Constraints

**Always:**
- Datenmodell: pures Modul `internal/sankey-graph.ts` baut Nodes/Links aus der Bulk-Winners-Response VOR d3 (voll unit-testbar); d3-sankey macht ausschließlich das Layout. Die Daten-Invarianten der Story-8-Tests gelten auf dem Graph-Modul: Spaltensumme = Gebiete mit Daten in diesem Jahr; Partei→Partei gebündelt (ein Band je Paar); Eltern-Jahr nie als Spalte (2021→2023); Mittelspalten-Start; leere Eingabe ohne Crash. REVISION 12:07: keine Gebiets-Knoten/-Links mehr.
- `wechsel-data.ts`: `mergeEffectiveSeries`/`computeWechselFromRows`/`parentJahrFromParentSlug` bleiben unverändert (Parity-Test `wechsel-client-parity.test.ts` bleibt wörtlich gültig). REVISION 12:07: `gebietErsteWahlFromRows` (nur für die Gebiets-Spalte gebaut) wird samt Tests wieder entfernt, kein toter Code.
- d3-sankey: Dependency + `@types/d3-sankey`; in `vite.config.ts` eigene manualChunks-Regel `d3-sankey`/`d3-shape` → Chunk `sankey` VOR der layerchart-Regel; Lazy-Load im Controller (`await import('d3-sankey')`) mit injizierbarer Factory als Test-Naht (Muster `mapFactory` der MapLibre-Controller); nicht in `optimizeDeps.include`.
- REVISION 12:07: kein Geometrie-/Namens-Load im Sankey mehr (war nur für Gebiets-Knoten/-Liste nötig) -- Datenquelle bleibt allein die Bulk-Winners-Response.
- Interaktion: eigener `sankey-tooltip.svelte` nach `winner-map-tooltip.svelte`-Muster (relative-Wrapper, pointermove-Position, role="tooltip", aria-live polite); Hover-Highlight per Klassen (aktives Band volle Deckkraft, übrige gedimmt), Transitions nur `motion-safe:`; Tastatur: Bänder/Knoten sind fokussierbar (tabindex) und zeigen den Tooltip bei Fokus.
- Selbsterklärend: ein sichtbarer Erklär-Satz direkt am Sankey benennt die Sieger-Semantik (sinngemäß: „Jeder Knoten zeigt, in wie vielen Gebieten eine Partei stärkste Kraft war; Parteien ohne Platz-1-Gebiet erscheinen in dem Jahr nicht.", `lint:wahl`-konform); der Tooltip eines Partei-Knotens nennt „stärkste Kraft in N von M Gebieten". Das beantwortet die „Wo sind die anderen Parteien?"-Frage direkt in der Grafik.
- Layout-Dimensionen: kompakte SVG-Höhe wie Story 8 (Richtwert ~320-400 px, keine Gebiets-abhängige Höhe mehr, REVISION 12:07); Partei-Labels nur, wenn die Knoten-Höhe reicht; Label-Margin für Partei-Namen wie Bestand.
- Kontinuität: Testids `sankey-wahljahre`, `-svg`, `-empty`, `-error`, `-loading`, `-takeaway`, `-datenstand`, Fußnoten-Ids, `sankey-ebene`/`-kiez`/`-bezirk` und die Tabellen-Alternative (`table-toggle`/`data-table` mit Von/Nach/Jahr/Gebiete-Zeilen) bleiben erhalten (E2E + trends-kapitel-Tests hängen daran). REVISION 12:07: die zweite Tabelle „Gebiet · Gewinner erste Wahl" entfällt mit der Gebiets-Spalte.
- Zustands-/Loader-Muster unverändert: `KiezBezirkWinnersLoader` (Modul-Cache), Ebenen-Toggle kapitel-lokal mit bestehenden Testids, Lade-/Fehler-/Leer-Zustände, Datenstand-Zeile, Wiederholungs- und Coverage-Fußnoten (Coverage nur Kiez, `showCoverageHinweis`-Prop bleibt).
- `docs/wahldaten-methodik.md` Sankey-Absätze umschreiben (REVISION 12:07: gebündeltes Spalten-Modell wie Story 8 beschrieben; d3-sankey lazy statt „kein d3-sankey"; Sieger-Semantik-Absatz); `lint:wahl`; keine Em-Dashes; Dateien < 500 Zeilen.

**Never:**
- Kein Layout-Eigenbau mehr (`sankey-layout.ts` wird ersetzt/entfernt, seine Tests wandern als Daten-Invarianten auf `sankey-graph.ts`); keine Crossing-Optimierung von Hand (macht d3).
- Nie Stimmbezirks-Ebene (LOR-stabile Ebenen only); Bandbreiten zählen Gebiete, nie Personen; keine „Wählerwanderungs"-Sprache.
- Kein Umbau von Story-10-Artefakten (Sticky-Reihe, Karten-Steuerung, Badges), von `trends-kapitel.svelte` über den Sankey-Einbettungs-Block hinaus, oder der Winners-/Geometrie-Loader.
- Keine eigene Reihen-Auswahl am Sankey (Reihe ist global, Story 10).

## I/O & Edge-Case Matrix

REVISION 12:07: Zeilen zur Gebiets-Spalte gestrichen (Bezirk-/Kiez-Gebiets-Knoten, Hover Gebiets-Band).

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Partei-Spalten | AGH, Kiez oder Bezirk | Je Wahl der Reihe eine Spalte, Parteien untereinander, gebündelte Bänder (ein Band je Partei-Paar) | N/A |
| Hover Band | Mouseover Partei-Übergang | Band hebt sich, übrige dimmen, Tooltip „SPD → GRÜNE, 2023: N Gebiete"; mouseout stellt zurück | N/A |
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

**Execution (TDD: pro Task erst failing Test, dann Implementation; Liste REVIDIERT 12:07 -- ursprünglich stand hier das zurückgenommene Gebiets-Spalten-Modell, Wortlaut siehe git-History):**
- [x] `pnpm add d3-sankey @types/d3-sankey` + `vite.config.ts`-Chunk-Regel -- Build zeigt eigenen `sankey`-Chunk.
- [x] `internal/sankey-graph.ts` + Test -- Nodes/Links-Konstruktion (Partei-Spalten 0-basiert, gebündelte Übergänge; Invarianten aus sankey-layout.test übernommen).
- [x] `internal/sankey-d3.svelte.ts`/`sankey-d3-layout.ts` + Tests -- Lazy-Layout-Controller mit Factory-Naht; Anker-Ketten-Trick für Mittelspalten-Starts; deterministische Sortierung; kompakte Höhe (360 px), Breite je Spaltenzahl.
- [x] `internal/sankey-tooltip.svelte` + Test -- Tooltip-Komponente.
- [x] `sankey-wahljahre.svelte` + Tests -- Umbau: Graph→d3→SVG (Partei-Spalten, ·W-Label), Hover-/Fokus-Highlight (motion-safe), Tooltip-Verdrahtung (ohne SVG-`<title>`), Erklär-Satz (Sieger-Semantik), bestehende Zustände/Fußnoten/Toggle/Testids erhalten; `sankey-layout.ts` entfernen.
- [x] `docs/wahldaten-methodik.md` -- Sankey-Absätze umschreiben (gebündeltes Modell + d3 + Sieger-Semantik).
- [x] Tests/E2E -- bestehende Assertions grün (Tabelle Von/Nach/Jahr/Gebiete), neuer E2E-Hover-Smoke (Tooltip erscheint).

**Acceptance Criteria (REVISION 12:07):**
- Given eine Reihe mit Wahljahren, then zeigt der Sankey je Wahl eine Partei-Spalte (2021 nie als Spalte bei AGH) mit gebündelten Bändern; KEINE Gebiets-Spalte, keine Einzel-Bänder pro Gebiet.
- Given Hover oder Fokus auf einem Band, then hebt es sich hervor, die übrigen dimmen, und ein Tooltip nennt Von/Nach/Jahr/Anzahl; Knoten-Tooltips nennen „stärkste Kraft in N von M Gebieten".
- Given ein Dominanz-Jahr (AGH 2023), then erklären Erklär-Satz und Knoten-Tooltips die Sieger-Semantik sichtbar; kein Eindruck fehlender Daten.
- Given der Produktions-Build, then liegt d3-sankey in einem eigenen lazy Chunk; `pnpm lint:wahl`, Axe-E2E und der Parity-Test bleiben grün.

## Implementation Notes

**Architektur-Entscheidungen:**
- **d3-sankeys Spalten-Erkennung reicht nicht für unser Modell.** `d3-sankey` berechnet die Spalten-Zuordnung intern über die längste Kanten-Kette ab kantenlosen Wurzeln (BFS-Tiefe). Ein Gebiet, das seine erste Wahl erst in einer MITTLEREN Spalte hat (Coverage-Grenze), landet dann u. U. fälschlich eine Spalte zu früh, weil sein Partei-Knoten nur eine eingehende Gebiets-Kante (Tiefe 0) hat, nie eine Partei-Übergangs-Kante aus der Vorspalte. Fix: ein unsichtbares Null-Wert-Rückgrat aus Anker-Knoten (`__anchor__:0..C`, linear verkettet über alle Spalten) zwingt d3s intern berechnete Gesamt-Spaltenzahl auf mindestens `C+1`; die eigentliche Platzierung übernimmt ein eigener `nodeAlign`, der ausschließlich das vorab bekannte `column`-Feld zurückgibt (kein Clamping mehr möglich). Anker-Knoten werden vor der Rückgabe herausgefiltert. Regressions-Test dafür in `sankey-d3-layout.test.ts`.
- **`fixedValue` statt Kanten-Summe für die Knoten-Höhe.** Jeder d3-Knoten bekommt `fixedValue = anzahl` (unsere eigene Quelle der Wahrheit aus `parteiAnzahlProJahrFromRows`) statt die Höhe aus der Summe seiner Kanten herzuleiten -- robuster, unabhängig davon, ob jede Kante exakt aufsummiert.
- **Datei-Aufteilung `sankey-d3.svelte.ts` / `sankey-d3-layout.ts`.** `svelte/prefer-svelte-reactivity` flaggt jede `new Map()` in einer `.svelte.ts`-Datei, auch wenn sie rein lokal/nicht-reaktiv ist. Die eigentliche Layout-Berechnung (nutzt intern `Map`-Lookups) liegt deshalb in einem plain `.ts`-Modul (`sankey-d3-layout.ts`, Muster `wechsel-map-data.ts#buildNameBySlugMap`); `sankey-d3.svelte.ts` bleibt schlank und enthält nur noch den reaktiven `SankeyD3Controller` (Re-Export der Typen/Funktionen für Konsumenten). Aus demselben Grund lebt `columnXByJahrFromNodes` in `sankey-interaction.ts`, nicht als `$derived.by`-Block mit `new Map()` in der Komponente.
- (ENTFALLEN mit Revision 12:07: Gebiets-Disclosure-Liste und Gebiets-Knoten-Felder; Wortlaut siehe git-History.)
- **Outer-`<svg>`-Rolle `role="group"` statt `role="img"`.** Die interaktiven Bänder/Knoten (Boundary: fokussierbar, Tooltip bei Fokus) sind echte Nachfahren mit `tabindex`. `role="img"` verbietet fokussierbare Nachfahren (axe-Verstoß „Element has focusable descendants", WCAG 4.1.2) -- der Live-Fund kam über den Axe-Scan des Portals in `a11y.e2e.ts`. `role="group"` + `aria-label={figureLabel}` behält die sprechende Gesamt-Beschreibung, erlaubt aber fokussierbare Kinder.
- **E2E-Hover nutzt `dispatchEvent('pointermove', ...)` statt `hover()`.** Playwrights Actionability-Check für `hover()` hittestet die Mitte der Bounding-Box bzw. verlangt einen Viewport-Punkt für die echte Maus-Bewegung; bei einer gebogenen Bezier-Ribbon-Form (unser Band) ist das unzuverlässig (`Element is outside of the viewport`/„not visible", auch mit `force: true`) -- ein bekanntes Playwright/SVG-Pfad-Verhalten, kein Rendering-Fehler. Sowohl der Komponenten-Test als auch der neue E2E-Test lösen ein reales `pointermove`-Event direkt auf dem Element aus.

**Revision 12:07 umgesetzt:**
- Entfernt: Gebiets-Knoten (`kind: 'gebiet'`), Gebiets-Links (`kind: 'gebiet-erste-wahl'`), der `gebietNameBySlug`-Parameter von `buildSankeyGraph`, `gebietErsteWahlFromRows`/`GebietErsteWahl` samt Tests aus `wechsel-data.ts` (Diff gegen `0fa3a04` danach wieder leer), der Geometrie-Load im Sankey (`KiezBezirkGeometryLoader`/`buildNameBySlugMap`-Import + `$effect` raus aus `sankey-wahljahre.svelte`), die zweite Tabellen-Alternative „Gebiet · Gewinner erste Wahl" (Disclosure-Liste `sankey-gebiete-*`) inklusive `DISCLOSURE_LIMIT`, die Gebiets-abhängige Höhenformel und der `nodePadding`-Sonderfall für >40 Gebiete in `sankey-d3-layout.ts`.
- Typen vereinfacht: `SankeyGraphNode`/`SankeyGraphLink` verlieren `kind`/`gebietSlug` (nur noch eine Knoten-/Link-Art, keine Unterscheidung mehr nötig); Partei-Spalten sind jetzt 0-basiert (`column` = Index in `spalten`, vorher 1-basiert mit Spalte 0 = Gebiete). Der Anker-Ketten-Trick in `sankey-d3-layout.ts` bleibt (weiterhin nötig, wenn ein Partei-Knoten in einer Mittelspalte KEINE eingehende Übergangs-Kante hat, weil sein Gebiet die Reihe erst dort beginnt), Rückgrat-Spannweite auf `spalten.length - 1` angepasst.
- Geblieben: `d3-sankey`-Layout (lazy, eigener Chunk `sankey`, per Build bestätigt), Tooltips, Hover-/Fokus-Highlight, Erklär-Satz zur Sieger-Semantik, `totalGebiete`/`gebieteMitDatenByJahr` (Takeaway bzw. Knoten-Tooltip „stärkste Kraft in N von M Gebieten"), alle Kontinuitäts-Testids, die Daten-Invarianten-Tests (Spaltensummen, Bündelung, Eltern-Jahr, Mittelspalten-Start, leer).
- `computeSankeyDimensions` verliert den `totalGebiete`-Parameter (Höhe jetzt fest 360 px, unabhängig von der Gebietszahl); Breiten-Formel je Spaltenzahl unverändert.
- Nachtrag (Live-Fund Matze, Screenshot nach der Revision): der native Browser-Tooltip der SVG-`<title>`-Kinder legte sich über unseren eigenen `sankey-tooltip`. `<title>` aus den `sankey-band`-/`sankey-node`-Elementen entfernt (Bänder UND Knoten), `aria-label` + der eigene Tooltip tragen die Information weiter.
- `docs/wahldaten-methodik.md`: Sankey-Absatz erneut umgeschrieben auf das gebündelte Spalten-Modell (wie Story 8), Gebiets-Spalten-Beschreibung und `gebietErsteWahlFromRows` aus der Rechenkern-Aufzählung entfernt.
- Verifikation: `pnpm vitest run --project server`/`--project client` grün (302/2839 bzw. 121/992 Tests), `pnpm check` 0 Fehler, `pnpm lint:wahl` 0 Verstöße, `pnpm exec vite build` bestätigt den eigenen lazy `sankey`-Chunk, E2E (`berlin-wahlen.e2e.ts`, `berlin-wahlen-partei.e2e.ts`, `a11y.e2e.ts`) 24/26 grün, die 2 Fails sind die bekannten vorbestehenden a11y-Lücken (`/_dev/wortmarke` document-title, `/explore` Escape-Timeout), unabhängig von dieser Revision.

**Abweichungen von der Spec:**
- I/O-Matrix nennt „Mouseout stellt zurück" für Hover Band; umgesetzt über `pointerleave`+`blur` (Pointer Events statt Mouse Events, funktional äquivalent für Maus/Pen; Touch-Verhalten siehe Review Triage Log).

**Test-Strategie (Stand nach Revision 12:07):**
- `sankey-graph.test.ts` (server-Projekt, rein): Daten-Invarianten aus `sankey-layout.test.ts` übernommen (Spaltensummen, Bündelung, Eltern-Jahr, Mittelspalten-Start, leer, 0-basierte Spalten).
- `sankey-d3-layout.test.ts` (server-Projekt, rein, echter `d3-sankey`-Import): Positionierung, Mittelspalten-Regression, deterministische Sortierung, leerer Graph, Dimensions-Formel.
- `sankey-d3.svelte.test.ts` (client-Projekt, Runes): reaktiver `SankeyD3Controller` (Factory-Injektion, Stale-Guard).
- `sankey-tooltip.svelte.test.ts`, `sankey-interaction.test.ts`: Tooltip-Rendering bzw. reine Tooltip-Text-Logik.
- `sankey-wahljahre.svelte.test.ts`: bestehende 6 Tests erhalten (Zustände/Fußnoten/Toggle-Cache/Kontinuitäts-Assertions) + Hover-Tooltip per `pointermove`-Dispatch. Kein Geometrie-Load mehr, keine Manifest/Layer-Fixtures nötig.
- E2E: neuer Hover-Smoke-Test in `berlin-wahlen.e2e.ts`; bestehende Tabellen-Assertion unverändert grün.
- Nachtrag Stroke-Fix (Koordinator, 12:32, Live-Fund Matze BTW 2013→2017): Bänder werden als gestrokte `sankeyLinkHorizontal`-Mittellinien mit `stroke-width = band.width` gezeichnet statt als gefüllte offene Pfade -- gefüllt kollabierten horizontale Übergänge (gleiche Quell-/Ziel-Höhe) zur Haarlinie. Komponenten-Tests 7/7 grün, check 0 nach dem Fix.

## Spec Change Log

- 2026-09-20 12:07 (Matze, Live-Test auf dev, 2 Screenshots): Gebiets-Spalte zurückgenommen. Wörtlich sinngemäß: „mach rückgängig, vorher war besser; mit d3 sieht es besser aus, aber das Beschränken auf [gebündelte] Daten war vorher besser, jetzt ist es nicht benutzbar." 143 Einzel-Bänder erzeugten auf Kiez-Ebene einen unlesbaren Filz. Bleibt: d3-sankey, Tooltips, Hover-/Fokus-Highlight, Erklär-Satz. Entfällt: Gebiets-Knoten/-Bänder/-Liste, Geometrie-Load im Sankey, `gebietErsteWahlFromRows`, Gebiets-Höhenformel. Intent/Boundaries/Matrix/ACs entsprechend revidiert (Checkpoint-Inhaber hat neu verhandelt).

## Review Triage Log

Runde 1 (2026-09-20, nach Revision 12:07 + Stroke-Fix). Layer: Blind Hunter (N=10), Edge Case Hunter (24 Funde inkl. Deletion/Claims), Verification Gap (10 Gaps + 5 Nebenfunde). Die Reviewer prüften den Patch-Stand VOR dem Stroke-Fix; alle Nicht-Stroke-Funde wurden von ihnen gegen den Working Tree gegengeprüft.

| # | Fund | Quelle(n) | Verdict | Route |
|---|------|-----------|---------|-------|
| 0 | Bänder als gefüllte offene Pfade statt gestrokte Mittellinien; horizontale Übergänge kollabieren zur Haarlinie (BTW 2013→2017), Bandbreite nie gezeichnet; die dispatchEvent-Test-Workarounds hatten den Bug maskiert | Matze-Screenshot 12:31, BH#1 (strong), VG#1, ECH | high | BEHOBEN (Koordinator 12:32, stroke-width); Tests dazu in #8 |
| 1 | Stale-Layout bei Cache-Treffer: Loader setzt `response`/`loaded` synchron, `layout` bleibt alt; `isLoading`-Gate erkennt nur den Erstlauf; Jahres-Labels fallen auf x=0, Knoten-Tooltip mischt alte/neue Daten | BH#2 (strong), ECH#4 | high | patch: Controller bindet Layout an seinen Graph (`layoutFor`), Komponente derived `layout` nur bei Übereinstimmung; Test mit zwei nicht-leeren Graphen |
| 2 | `compute` ohne try/catch: rejectende Factory (Chunk-404 nach Deploy, offline) → Dauer-Spinner + unhandled rejection, nie `-error` | BH#3, ECH#3, VG#7 | high | patch: try/catch + `error`-State am Controller, `isError` einbeziehen; Tests mit rejectender Factory |
| 3 | `role="button"` + `tabindex` auf path/rect ohne Enter/Space-Aktivierung, Tooltip nicht per Escape schließbar (WCAG 4.1.2/1.4.13), kein Fokus-Indikator | BH#6, ECH#6, VG-Neben | high | patch: `role="img"` je Element (keine Aktions-Semantik), Escape schließt Tooltip, `pointercancel`-Handler, focus-visible-Outline |
| 4 | Partei-Labels liegen auf den abgehenden Bändern (alle rechts verankert), linker viewBox-Rand (-90px) tote Fläche | BH#10, ECH-Del#2 | medium | patch: erste Spalte Label links (`x0-6`, anchor end) wie Story-8-Fassung |
| 5 | Fokus-Tooltip-Position = Bounding-Box-ECKE statt Mitte (`#elementCenterPos` nimmt left/top); kein Rand-Clamping, Tooltip ragt rechts aus dem Container | BH#8, ECH#8/#9 | medium | patch: Mitte berechnen (left+width/2), x/y gegen Container-Maße klemmen |
| 6 | Hover-/Dimm-Zustand überlebt Graph-Wechsel (Ebene/Reihe): neue Bänder starten gedimmt, Tooltip zeigt alte Zahlen | ECH#5 | medium | patch: `$effect` reset der Interaction bei Graph-Wechsel |
| 7 | manualChunks: `d3-shape` im `sankey`-Chunk kettet den layerchart-Chunk an den sankey-Chunk; Home/Atlas laden d3-sankey mit; Kommentar-Begründung invertiert | BH#4, VG#6, ECH#22 | medium | patch: zwei Chunks (`d3-sankey → 'sankey'`, `d3-shape → 'd3-shape'`), Kommentar korrigieren, Build-Nachweis |
| 8 | Test-Lücken an den Kern-Zusagen: band.width/stroke-width ungepinnt, `isLinkDimmed` ohne Test, Dimmen/Fokus/pointerleave/Knoten-Tooltip nie im DOM geprüft, Stale-Guard-Test aussagearm, Coverage-Grenze-letzte-Spalte-Test beim Umzug verloren, Spalten-Sortier-Invariante ungepinnt | VG#1-#5, BH#9, ECH-Del#1/#4 | high | patch: Test-Paket (Unit + Komponenten-Tests mit 2-Bänder-Fixture) |
| 9 | Axe-Scan sieht den Sankey nie (a11y.e2e.ts mockt leere Elections); `role`-Umbau ungeprüft, Regression wiederholbar unentdeckt | VG#8 | medium | patch: a11y-Scan mit Winners-Mock + sichtbarem `sankey-band` vor `analyze()` |
| 10 | Beide Hover-Tests umgehen das Hit-Testing (dispatchEvent); `pointer-events: none` o. Overlay bliebe grün | VG#10, BH#9 | medium | patch: E2E zusätzlich echter `page.mouse.move` auf Punkt aus der Band-BoundingBox (nach Stroke-Fix breit genug) |
| 11 | Silent-Link-Drop bei Teil-Coverage × Wiederholungswahl (Gebiet ohne Wiederholungs-Row verliert seinen Übergang still); Verhalten identisch zur Story-8-Fassung, aber die alte Link-Anzahl-Invariante ging beim Test-Umzug verloren | VG#9, ECH#10 | medium | patch (Tests): dokumentierender Test des Ist-Verhaltens + Link-Anzahl-Invariante; Semantik-Klärung → deferred-work |
| 12 | Ein-Spalten-Graph: d3 `kx=(w-dx)/(x-1)` → NaN-Koordinaten (heute durch `isEmpty` verdeckt, aber Funktion ist exportiert); `?? 0` fängt NaN nicht | ECH#1/#2, BH#5 | medium | patch: early-return für `spalten.length < 2` + Anker-Spannweite über `max(column)` absichern + Tests |
| 13 | Spec-Datei-Hygiene: Tasks/Notes beschrieben noch das Gebiets-Modell, falscher axe-Verweis, Stroke-Fix unprotokolliert | ECH#17-21, VG-Neben | high | BEHOBEN (Koordinator, dieser Commit) |
| 14 | „Aktives Band volle Deckkraft": gehovertes Band bleibt bei 0.5 statt hervorgehoben | ECH#23 | low | patch: gehovertes Band 0.85 |
| 15 | Touch: Tap zeigt Tooltip nur flüchtig (pointerleave direkt nach Tap); WCAG 1.4.13-Aspekt teilweise offen | BH#7 | low | defer: Tabellen-Alternative trägt die Daten; Touch-Interaktions-Konzept portalweit klären |
| 16 | Anker-Kette kostet je Spalte ~1 nodePadding-Slot Nutzhöhe (~1%) | ECH#12, BH-Gegenprüfung | low | reject: kosmetisch, gemessen ~1,1% |
| 17 | Band überspringt Spalte: Tooltip nennt nur Ziel-Jahr (vonJahr fehlt im Link) | ECH#11 | low | defer: seltener Teil-Coverage-Fall, Band-Verlauf zeigt die Spannweite |
| 18 | `<title>`-Entfernung als AT-Risiko | ECH-Del#3 | false | reject: Matze-Direktive (nativer Tooltip kollidierte), `aria-label` bleibt |
| 19 | Ein-Spalten-Reihe zeigt Leer-Satz statt einer Spalte mit Gewinner-Daten | ECH#24 | maybe-false | defer: Produktfrage; heute hat jede Reihe ≥3 Wahljahre |
| 20 | Automatisierter Chunk-Wächter fehlt (kein Bundle-Check im Repo) | VG#6 | low | defer: kein Build-Gate/CI-Pfad im Repo; deferred-work |

## Design Notes

Die Testgrenze verschiebt sich bewusst: Graph-Konstruktion (rein, alle Daten-Invarianten) vs. d3-Layout (nur Smoke/Determinismus). Nach der Revision 12:07 ist der Sankey die kompakte gebündelte Ansicht (Partei-Spalten, ein Band je Partei-Paar); Tooltips, Hover-Highlight und der Erklär-Satz tragen die Detail-Lesbarkeit.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- `pnpm exec vite build` -- expected: eigener `sankey`-Chunk im Output, dann Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün
