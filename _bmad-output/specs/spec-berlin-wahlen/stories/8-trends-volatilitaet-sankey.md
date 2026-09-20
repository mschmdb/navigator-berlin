---
title: 'Analyse-Kapitel Trends und Volatilität mit Sankey'
type: 'feature'
created: '2026-09-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '94b664a'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Kapitel „Trends" ist ein Platzhalter; Besucher sehen weder Anteils-Trends pro Partei noch, wie stabil oder wechselhaft ein Gebiet wählt (CAP-5, CAP-8). Matzes Volatilitäts-Sankey (19.09.) fehlt.

**Approach:** Das Trends-Kapitel bekommt (a) eine Kiez-Choropleth mit Toggle Trend|Volatilität: Trend-Steigung der gewählten Partei als Diverging-Rampe, Volatilität als Indigo-Rampe, Partei-Auswahl als Chips; (b) als Herzstück einen selbstgebauten SVG-Sankey über die Wahljahre: Spalten = Jahre der effektiven Legislatur-Reihe, Knoten = Parteien in Partei-Farbe, Bandbreite = Anzahl Gebiete je Partei-Übergang (gebündelt, nie pro Gebiet), Kiez/Bezirk kapitel-lokal toggelbar. Jedes Modul trägt Takeaway-Satz, Deltas als +/−x,x Pp. und Datenstand.

**Direktiven (Matze):** Sankey nur auf LOR-stabilen Ebenen Kiez/Bezirk, NIE Stimmbezirke. Flüsse pro Partei-Übergang bündeln. Wiederholungswahl-Regel der Analytik gilt (2023 ersetzt 2021 als Legislatur-Slot). Partei-Farben nur aus `partei-farben.ts`; layerchart nur lazy, eigene SVG-Primitives bevorzugt. Split entschieden (Matze 20.09., „1"): Diese Story deckt nur CAP-5+CAP-8; das Kontraste-Kapitel (CAP-6) ist als Folge-Story abgespalten (deferred-work.md).

## Boundaries & Constraints

**Always:**
- Sankey: Eigenbau-SVG (Knoten-Rechtecke + kubische Bézier-Bänder), pures Layout-Modul mit Node-Unit-Tests; kein `d3-sankey`, kein layerchart. Knoten/Bänder in `parteiColor(...)`; nie `farbe_hex` aus der API rendern.
- Sankey-Spalten folgen der effektiven Reihe (Merge-Regel-Zwilling aus `wechsel-data.ts` wiederverwenden, NICHT duplizieren; Parity-Test bleibt gültig); Wiederholungs-Spalte trägt das „·W"-Flag; Legende zitiert den Wiederholungs-Satz aus `docs/wahldaten-methodik.md` Z. 258.
- Trend-/Volatilitäts-Choropleth: NIE Partei-Farbe für Nicht-Partei-Metriken; Diverging- bzw. Strukturell-Indigo-Tokens; Kontrast benachbarter Stufen ≥3:1 in effektiver Darstellung (Muster `wechsel-map-data.ts`-Helper).
- A11y: jede Karte/Grafik `role="img"` + sprechendes `aria-label` + Tabellen-Alternative mit denselben Werten (sr-only- oder `data-table-alternative`-Muster); Toggles als `role="radiogroup"` mit `radiogroup-keyboard.ts`; Zahlen de-DE, `tabular-nums`, Minus als U+2212.
- Takeaways/Deltas über die Bestands-Helfer (`ergebnis-panel-data.ts`: `deltaPpBetween`-Semantik, `formatDeltaLabel`, `formatAnteilPct`); Formulierungen bestehen `lint:wahl` (kein „Hochburg", „Wahlsieger", „Wählerwanderung" ebenfalls vermeiden: es sind Gebiets-Wechsel, keine Personen-Ströme).
- Datenlücken ehrlich: Kiez-Daten erst ab 2016 (AGH/BVV) bzw. 2017/2013-Grenzen laut Methodik; Fußnote am Sankey und an der Trend-Karte; DB-lose Leere ohne Crash.
- Requests über die geteilten Loader (`KiezBezirkWinnersLoader` Modul-Cache, `KiezBezirkGeometryLoader`); genau EIN Winners-Request je typ×stimmtyp×ebene bleibt seitenweit garantiert. Analytik-Fetch bekommt einen eigenen Loader mit demselben Modul-Cache-Muster.
- `docs/wahldaten-methodik.md` um einen Sankey-Absatz fortschreiben (Bündelung pro Partei-Übergang, Ebenen-Beschränkung, effektive Reihe); Dateien < 500 Zeilen; keine Em-Dashes.

**Never:**
- Keine neue Server-API und keine Schema-/Build-Script-Änderung: Sankey aus der Bulk-Winners-Response, Trend/Volatilität aus `/api/wahl/analytik` (Kiez-only, wie in der Methodik dokumentiert; kein Bezirk-Toggle an der Choropleth).
- Kein Kontraste-Kapitel in dieser Story (Ausgeglichenheit, Nachbar-Grenzen, AGH-vs-BVV, Splitting sind abgespalten, siehe deferred-work).
- Kein Umbau von Portal-Steuerleiste, Winner-Map, Wechsel-Kapitel oder Ergebnis-Panel; globaler Ebenen-Toggle bleibt unangetastet (Sankey-Ebene ist kapitel-lokal).
- Keine Hover-Animationen, die `prefers-reduced-motion` verletzen; der Sankey ist statisch, Highlights ohne Transition bei reduce.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sankey AGH Kiez | Winners-Bulk 2016/2021/2023(W) | Spalten 2016, 2023 (·W, 2021 ersetzt); Bänder je Partei-Paar mit Gebiets-Anzahl; Summe je Spalte = Anzahl Gebiete mit Daten | N/A |
| Sankey-Bündelung | 3 Kieze SPD→GRÜNE, 1 Kiez SPD→SPD | Ein Band SPD→GRÜNE (3), ein Band SPD→SPD (1); nie 4 Einzel-Bänder | N/A |
| Ebenen-Toggle | Klick „Bezirk" | Sankey rechnet auf Bezirks-Winners um (eigener Cache-Key), kein zweiter Request bei Rückwechsel | N/A |
| Trend-Karte | Partei-Chip „GRÜNE", Toggle „Trend" | Kieze nach slope×100 (Pp./Jahr) in Diverging-Rampe; Takeaway nennt Anzahl steigender/fallender Kieze | N/A |
| Volatilitäts-Karte | Toggle „Volatilität" | Indigo-Rampe nach `volatilitaet`; Takeaway nennt stabilste/wechselhafteste Spanne neutral formuliert | N/A |
| Tabellen-Alternative | Toggle Tabelle | Sankey: Von/Nach/Jahr/Anzahl-Zeilen; Karte: Gebiet+Wert-Zeilen; Werte identisch zur Grafik | N/A |
| DB-los / leer | Analytik/Winners leer | Kapitel zeigt Hinweis-Satz, keine leere Grafik, kein Crash | Leer-Zustand |
| Coverage-Grenze | BVV Kiez (Daten ab 2016) | Sankey startet bei 2016, Fußnote nennt die Grenze | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- `trends` aus `PLACEHOLDER_CHAPTERS` lösen (Muster `WECHSEL_CHAPTER`, Story 7); Nav-Reihenfolge unverändert; Kapitel-Takeaway zieht in die Kapitel-Komponente.
- `src/lib/components/wahl-portal/internal/wechsel-data.ts` -- `mergeEffectiveSeries`/`GebietPoint` exportieren + neue `computeUebergaengeFromRows(rows)` → gebündelte Übergänge `{vonJahr, nachJahr, von, nach, anzahl}` je benachbarter Spalten; Parity-Test `wechsel-client-parity.test.ts` bleibt gültig.
- `src/lib/components/wahl-portal/internal/winner-map-winners.svelte.ts` -- `KiezBezirkWinnersLoader` (Modul-Cache, In-Flight-Dedupe) für Sankey-Daten wiederverwenden; `_resetWinnersCache` in Tests.
- `src/lib/components/wahl-portal/internal/winner-map-geometry.svelte.ts` -- Namen für Karten/Tabellen (`buildNameBySlugMap` aus `wechsel-map-data.ts`).
- NEU `internal/sankey-layout.ts` + Test (server-Projekt) -- pures Layout: Spalten aus effektiver Reihe, Knoten-Positionen/Höhen (Anzahl Gebiete), Band-Pfade (kubische Bézier), deterministische Knoten-Sortierung (Anzahl desc, dann alphabetisch de).
- NEU `internal/trends-analytik.svelte.ts` + Test -- `AnalytikLoader` (Modul-Cache pro typ×stimmtyp, Muster `KiezBezirkWinnersLoader`) für `/api/wahl/analytik` (Response-Shape: `gebiete[].{kiez_slug, wechsel_count, wechsel_jahre, volatilitaet, trends[].{partei, slope}}`).
- NEU `internal/trends-map-data.ts` + Test -- Join slope/volatilitaet auf Kiez-FC (Muster `wechsel-map-data.ts`), Diverging-/Indigo-Rampen mit Kontrast-Helpern (`blendOverBasemap`, `contrastRatio` von dort), Tabellen-Rows, Takeaway-Sätze (slope×100 = Pp./Jahr, 1 Nachkommastelle).
- NEU `sankey-wahljahre.svelte` (+ internal-Layout), `trends-kapitel.svelte` (+ `internal/trends-kapitel-maplibre.svelte.ts` nach `wechsel-kapitel-maplibre`-Muster, + `internal/trends-kapitel-context-probe.svelte`) + Component-Tests.
- `src/lib/data/partei-farben.ts` -- `parteiColor`/`parteiPattern` (Fallback „Sonstige" immer definiert); `src/lib/components/wahl-portal/internal/radiogroup-keyboard.ts` für Toggles.
- Chart-/Test-Muster: `src/lib/components/atlas/charts/` (sr-only-Tabelle, `chart-scale.ts`), `chart-primitives.svelte.test.ts`, Kapitel-Test-Muster `wechsel-kapitel.svelte.test.ts` (Manifest/GeoJSON-Fixtures, `_reset*`-Hooks).
- `docs/wahldaten-methodik.md` -- Abschnitt „Analytik-Methoden" (Z. 254-266) zitieren; neuen Sankey-Absatz ergänzen.
- `tests/e2e/berlin-wahlen.e2e.ts` -- Fixture-Muster `WINNERS_WECHSEL_KAPITEL`; Kapitel-Scoping wegen doppelter `table-toggle`-Testids beachten.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [x] `internal/wechsel-data.ts` + Test -- `mergeEffectiveSeries` exportieren, `computeUebergaengeFromRows` (Bündelung, Matrix-Zeilen Sankey/Bündelung/Coverage).
- [x] `internal/sankey-layout.ts` + Test -- Spalten/Knoten/Band-Geometrie pur; Summen-Invariante je Spalte; deterministische Sortierung.
- [x] `sankey-wahljahre.svelte` + Test -- SVG-Rendering, Partei-Farben, ·W-Spalte, `role="img"`+aria-label, Tabellen-Alternative, Kiez/Bezirk-radiogroup (kapitel-lokal), Fußnoten (Coverage + Wiederholungs-Satz).
- [x] `internal/trends-analytik.svelte.ts` + Test -- Loader mit Modul-Cache + Stale-Guard; DB-los leer.
- [x] `internal/trends-map-data.ts` + Test -- Joins, Rampen (Kontrast-Assert ≥3:1), Takeaway-Sätze, Tabellen-Rows.
- [x] `trends-kapitel.svelte` (+ maplibre-Controller + Context-Probe) + Test -- Partei-Chips, Toggle Trend|Volatilität, Karte (setPaintProperty bei Toggle/Chip-Wechsel, kein Re-Init), Legende, Tabellen-Alternative, Sankey eingebettet, Leer-/Fehler-Zustände (auch Geometrie-Fehler sichtbar).
- [x] `+page.svelte` -- Trends-Kapitel mounten, Platzhalter raus, Nav unverändert.
- [x] `docs/wahldaten-methodik.md` -- Sankey-Absatz (Bündelung, Ebenen, effektive Reihe).
- [x] `tests/e2e/berlin-wahlen.e2e.ts` -- Trends-Kapitel rendert Karte+Sankey aus Fixtures; Toggle wechselt ohne neuen Analytik-Request; Sankey-Tabelle nennt Von/Nach/Anzahl.

**Acceptance Criteria:**
- Given AGH-Kiez-Fixtures, when das Kapitel lädt, then zeigt der Sankey gebündelte Bänder mit Gebiets-Anzahlen, die Spaltensummen gleich der Gebietszahl sind, und 2021 erscheint nicht als eigene Spalte (2023 ·W ersetzt).
- Given Partei-Chip + Toggle, when gewechselt wird, then färbt die Karte per setPaintProperty um, ohne neuen `/api/wahl/analytik`-Request (ein Request je Reihe×Stimmtyp).
- Given jedes Modul, then existieren Takeaway-Satz, Datenstand-Zeile und Tabellen-Alternative; `pnpm lint:wahl` besteht.

## Implementation Notes

- **`wechsel-data.ts` erweitert, nicht dupliziert:** `mergeEffectiveSeries`/`GebietPoint` sind jetzt exportiert; `computeUebergaengeFromRows` und `effectiveJahreFromRows` teilen sich mit `computeWechselFromRows` die neue private `pointsFromGebietRows`-Extraktion. `computeUebergaengeFromRows` bündelt EIN Eintrag je `(vonJahr, nachJahr, von, nach)` über alle Gebiete -- ein unveränderter Übergang (Partei A -> Partei A) zählt ebenfalls, sonst würde die Spaltensumme im Sankey nicht mehr der Gebietszahl entsprechen. `effectiveJahreFromRows` bildet die Spalten als VEREINIGUNG der effektiven Jahre über alle Gebiete (nicht nur eines), damit Gebiete mit kürzerer Datenhistorie (Coverage-Grenze) keine Spalte unterschlagen, die andere Gebiete tragen.
- **Sankey-Node-Anzahl je Spalte -- erste Spalte aus ausgehenden, alle weiteren aus eingehenden Übergängen** (`sankey-layout.ts`): das deckt Gebiete ab, deren Datenhistorie erst später beginnt, ohne eine dritte "wie viele Gebiete gibt es insgesamt in Jahr X"-Quelle zu brauchen. Band-Sub-Segmente je Knoten werden deterministisch sortiert zugeteilt (ausgehend nach Ziel-Partei, eingehend nach Quell-Partei, beide `localeCompare('de')`) -- keine Crossing-Minimierung (wäre für eine Handvoll Parteien/Jahre unverhältnismäßig), aber reproduzierbar und voll unit-testbar.
- **Diverging-Rampe für Trend luminanz-identisch zur Wechsel-Indigo-Rampe konstruiert:** Es gibt im Repo keinen fertigen Diverging-Farbsatz. Statt neue, ungeprüfte Hex-Werte zu raten, wurden `TREND_FALLEND_HELL`/`_DUNKEL` (Vermillion-Hue) per Bisektion exakt auf dieselbe relative Luminanz wie `WECHSEL_FARBE_STUFE_1`/`_2_PLUS` (Indigo) gebracht -- der Kontrast zwischen Nachbarstufen ist dadurch PER KONSTRUKTION identisch zur bereits kontrastgeprüften Wechsel-Rampe (≥3:1, siehe `trends-map-data.test.ts`). Volatilität nutzt dieselbe Indigo-Rampe unverändert (3 Stufen: neutral/stufe1/stufe2+), keine neue 5-Stufen-Skala -- ein Versuch mit `scaleStrukturell1..5` (5-Stufen-Familie aus `dimension-ramps.ts`) zeigte beim Nachrechnen nur ≈1,25:1 zwischen Nachbarstufen, das Bestandsmuster erreicht ≥3:1 nur mit 3 weit gespreizten Stufen.
- **Map-Repaint ist wörtlich `setPaintProperty`, kein `setData`:** Volatilität + Trend jeder `FINDER_PARTIES`-Partei werden EINMAL gebacken (`bakeTrendsProperties`, Muster `winner-map-expressions.ts#bakeJahrProperties`), ein Toggle-/Chip-Wechsel liest danach nur eine andere `['get', <key>]`-Expression. Das erfüllt die AC wörtlich (kein zweiter Analytik-Request, kein Re-Init) und ist per Fake-Map-Test (`trends-kapitel-maplibre.svelte.test.ts`) geklammert.
- **Sankey-Ebene ist bewusst nicht Teil des globalen Portal-State:** ein lokales `$state<'kiez'|'bezirk'>` in `sankey-wahljahre.svelte`, weil die Direktive "Sankey-Ebene ist kapitel-lokal" (Boundaries) den globalen Ebenen-Toggle explizit unangetastet lässt. Der Request-Cache bleibt trotzdem geteilt (`KiezBezirkWinnersLoader`-Modul-Cache), ein Rückwechsel kiez->bezirk->kiez verursacht keinen dritten Request.
- **`WinnersApiResponse`/`AnalytikApiResponse` um `license`/`source_name`/`source_url` erweitert** (beide vorher nur das jeweilige Daten-Array): AC "Datenstand-Zeile je Modul" verlangt diese Felder auch am Sankey und am Trends-Kapitel; die Server-Endpunkte lieferten sie bereits, der Client-Typ hat sie nur nicht abgebildet. Rückwärtskompatibel (optionale Felder), `wechsel-kapitel.svelte`/`winner-map.svelte` unverändert.
- **E2E-Kapitel-Scoping:** Das Trends-Kapitel mountet wie das Wechsel-Kapitel eager auf jeder Portal-Seite und bringt eine eigene `DataTableAlternative` (`table-toggle`/`data-table`) mit. Ein vorbestehender E2E-Test (`Winner-Map (Ebene stimmbezirk): Default-Ansicht`) nutzte noch das unskopte `page.getByTestId('table-toggle')` und wurde auf `wahl-portal-chapter-karte` gescoped (Playwright-Strict-Mode-Fehler sonst: 2 Treffer).
- **Bekanntes, nicht-blockierendes Tooling-Detail (identisch zu Story 7):** `svelte-ignore state_referenced_locally` auf den neuen Loader-Instanzen (`winnersLoader`, `analytikLoader`, `geometryLoader`) wird von `eslint-plugin-svelte`s `svelte/no-unused-svelte-ignore` als "unused" gemeldet, obwohl `svelte-check`/`pnpm check` die Warnung tatsächlich braucht und mit 0 Fehlern/Warnungen durchläuft (bereits vor dieser Story 25 Fälle in `winner-map.svelte`/`wechsel-kapitel.svelte`, jetzt zusätzlich in `sankey-wahljahre.svelte`/`trends-kapitel.svelte`). `pnpm exec eslint <Datei>` zeigt diese Zeilen als Fehler; `pnpm check` bleibt grün.

## Spec Change Log

## Review Triage Log

Drei Layer (Blind Hunter 15, Edge Case Hunter 22, Verification Gap 3+7). Dedupliziert nach Root Cause:

| # | Quelle | Fund | Verdict | Route |
|---|--------|------|---------|-------|
| 1 | VG-1, VG-O1, EC-1..4, EC-c1, EC-c2, BH-3 | Sankey-Layout strukturell falsch bei heterogener Datenhistorie: Knoten-Zählung (erste Spalte aus `von`, Rest aus `nach`) verliert Gebiete mit Start in Mittelspalten, Bänder werden still gedroppt bzw. skalieren über die Zeichenfläche hinaus, Spaltensummen-Invariante bricht; ein Test klammert die Untererfassung als Soll | high | patch (Knoten-Anzahl aus neuer Quelle `parteiAnzahlProJahrFromRows` je Jahr×Partei aus den effektiven Gebiets-Reihen; Clamp; heterogene Test-Fixtures; irreführenden Test umschreiben). Grenzfall zu bad_spec: die Spec ließ die Knoten-Zählquelle offen; Fix ist lokal im Layout-Modul, Re-Derivation des 2800-Zeilen-Diffs unverhältnismäßig, Abwägung dokumentiert |
| 2 | EC-5, EC-c4 | `effectiveJahreFromRows`: fehlt EINEM Gebiet die Wiederholungs-Row, bleibt 2021 als eigene Spalte (AC-Bruch) | medium | patch (global ersetzte Eltern-Jahre aus der Spalten-Vereinigung entfernen) |
| 3 | BH-1, EC-7, VG-O2 | `KIEZ_COVERAGE_HINWEIS` nennt den falschen Grund (LOR-Kiez-Geometrie ist stabil; es fehlen die Stimmbezirks-Geometrien vor 2016, darum ist das Kiez-Aggregat leer), erscheint auch auf Bezirk-Ebene und doppelt auf dem Schirm | medium | patch (Text korrigieren, im Sankey nur bei `ebene==='kiez'`, Doppelung auflösen) |
| 4 | BH-2, EC-8 | Sankey kodiert Parteien nur über Farbe (kein Label, keine Legende; `<title>` nicht tastatur-erreichbar) | medium | patch (sichtbare Knoten-Labels als `<text>`, sprechende aria-labels mit Ebene/Jahren/Gebietszahl) |
| 5 | BH-4 | Volatilitäts-Label „8,4 Pp." methodisch irreführend (L1-Summe über alle Parteien, keine einzelne Verschiebung) | medium | patch (Label „x,x Pp. Gesamtverschiebung je Wahl" überall; Methodik präzisiert) |
| 6 | BH-5 | Klassifizierungs-Schwellen (0,2/1,0 Pp./Jahr; 0,05/0,12) unsichtbar und undokumentiert | medium | patch (Legende nennt Schwellen, Methodik-Absatz ergänzt sie) |
| 7 | BH-6 | Legende ohne „Keine Daten"-Eintrag; datenlose Kieze lesen sich als „Stabil"/„Gering" | medium | patch |
| 8 | BH-7 | Legenden-Swatches (CSS-opacity über Seitengrund) zeigen andere Farben als die Karte (Blend über Basemap); 8 handkopierte Einträge | low | patch (Swatch-Farben per `blendOverBasemap` vorberechnet, Legende datengetrieben; Wechsel-Kapitel-Pendant bleibt unangetastet, Boundary) |
| 9 | BH-8 | Methodik-Absatz trägt „Story 8"-Vokabular, ein 200-Wort-Block, Schwellen/Parity-Klammer fehlen | medium | patch (mit #5/#6) |
| 10 | BH-9, VG-O3 | Analytik-Fehler/-Leere reißt den Sankey mit (er braucht nur Winners); Fehler-/Leer-Zustände ohne Datenstand/Fußnote | medium | patch (Sankey aus dem Analytik-Gate lösen, rendert eigenständig) |
| 11 | EC-15 | Geometrie-Fehler bei leerer Analytik erscheint als „noch keine Daten" statt als Fehler | medium | patch (isError ohne `gebiete.length`-Guard) |
| 12 | BH-10 | Partei-Chips im Volatilitäts-Modus bedienbar-aussehend ohne Wirkung, ohne Erklärung | low | patch (aria-describedby-Hinweissatz) |
| 13 | EC-13, EC-14 | Controller überlebt Container-Unmount (Loading-Zyklus nach Reihen-Wechsel → Karte am abgehängten Div, dauerhaft leerer Kasten); rAF-resize nach destroy | medium | patch (Remount-Guard + rAF-Guard + Test). Gleiches latentes Muster im Wechsel-Kapitel: defer (Boundary: kein Umbau dort) |
| 14 | VG-2 | Verdrahtung Toggle/Chip → `setPaintProperty` von keinem Test ausgeführt (Effect löschbar, alles bleibt grün) | medium | patch (mapFactory-Prop an der Komponente, Fake-Map-Komponententest) |
| 15 | VG-3 | `ensureMap`-setData-Refresh-Zweig (Reihen-Wechsel) läuft in keinem Test | medium | patch (vierter Controller-Test) |
| 16 | VG-O4 | `deltaPpBetween` exportiert ohne Konsument; JSDoc behauptet Sankey-Nutzung fälschlich | low | patch (Export zurück, JSDoc korrigieren) |
| 17 | EC-18 | „+0,0/−0,0 Pp." in der Tabelle möglich | low | patch (Clamp in `buildTrendsTableRows`) |
| 18 | EC-12 | Volatilitäts-Takeaway bei Gleichstand benennt willkürlich Extreme | low | patch (Gleichstands-Zweig) |
| 19 | BH-11 | Doppelte aria-Labels (figure+svg/div); Labels ohne Werte; `tabular-nums` fehlt an Zahlen | low | patch (Label-Dedupe, sprechende Labels, tabular-nums). Teil „role=img über interaktiver Karte" rejected: identisches Haus-Muster aller Portal-Karten seit Story 4 |
| 20 | BH-12, VG-O6, EC-17 | Eager-Mount der dritten MapLibre-Instanz + dritte Geometrie-Loader-Instanz beim Seiten-Load | medium | defer (deferred-work-Eintrag Story 8; Lazy-Mount + fetchLayer-Dedupe sind der bestehende Story-7-Defer, verschärft) |
| 21 | BH-13 | Dritter fast identischer MapLibre-Controller (Copy-Paste-Basis) | medium | defer (Konsolidierungs-Refactor über 3 Bestandsdateien, eigener deferred-Eintrag) |
| 22 | BH-15-Teil | E2E prüft Sankey-Tabelle nur auf Überschrift | low | patch (Von/Nach/Anzahl-Werte assertieren, mit #1) |
| 23 | EC-c3 | Kontrast fallend↔steigend gleicher Stufe nur 1,007:1 | rejected | By design: Luminanz-Gleichheit macht die Stärke-Stufen vergleichbar, die Richtungs-Unterscheidung läuft über die CVD-sichere Blau-Orange-Achse (Indigo vs. Vermillion); Boundary verlangte ≥3:1 zwischen Nachbar-STUFEN (erfüllt, getestet). Tabelle liefert exakte Werte |
| 24 | EC-9, EC-10, EC-11 | Defensive Shape-Guards (`trends ?? []`, `Number.isFinite`, valibot am Client) | rejected | Same-Origin-API unter eigener Kontrolle; Array-Guard ist das Haus-Muster (Stories 4-7 identisch triagiert) |
| 25 | EC-16 | Leere FeatureCollection nach Geometrie-Load | rejected | Zustand nicht erreichbar (Layer-Dateien tragen immer Features; Manifest-Fehler läuft in den error-Pfad) |
| 26 | VG-O5 | `thinFc`-Doppel-Join pro Toggle-Klick | rejected | 143 Features joinen kostet Millisekunden; Vereinheitlichung brächte Kopplung ohne spürbaren Nutzen |
| 27 | BH-14 | `source_url` typisiert aber ungerendert; „Datenstand:" nennt Quelle statt Datum | rejected | Bestands-Konvention seit Story 6 (Ergebnis-Panel identisch); Link-Aufwertung wäre portalweite Design-Entscheidung |
| 28 | BH-15-Teil | Story-Metadaten (`status`, Memlog-Event) fehlen | rejected | Prozess-Schritt step-05, passiert nach der Patch-Runde |
| 29 | VG-O7 | `pnpm exec eslint` meldet `svelte/no-unused-svelte-ignore` auf neuen Dateien | rejected als Story-Blocker | Vorbestehendes, dokumentiertes Tooling-Detail (Story 7 Implementation Notes); `pnpm check` ist die maßgebliche Gate und grün |


## Design Notes

Sankey bewusst ohne `d3-sankey` (nicht installiert, ~Bundle-Risiko) und ohne layerchart: zwei Spalten-Typen (Knoten-Rechtecke, Bézier-Bänder) sind mit ~100 Zeilen purem Layout abbildbar und damit voll unit-testbar. Trend/Volatilität bleiben Kiez-only, weil `/api/wahl/analytik` per Methodik-Doku „bewusst nur ebene=kiez" liefert; der Sankey bekommt den Bezirk-Toggle trotzdem, weil er aus der Winners-Bulk-Response rechnet (beide Ebenen vorhanden). „Wählerwanderung" als Begriff vermeiden: die Bänder zählen Gebiete, nicht Personen; Beschriftung „X Gebiete" je Band.

## Verification

**Commands (alle ausgeführt, Ergebnis dokumentiert):**
- `pnpm vitest run --project server` -- 295 Test-Dateien, 2752 Tests, grün.
- `pnpm vitest run --project client` -- 110 Test-Dateien, 914 Tests, grün. (Ein Einzellauf von `winner-map.svelte.test.ts` außerhalb dieser Story flackerte im Voll-Suite-Parallellauf einmal timing-bedingt bei der Adress-Highlight-Assertion und war isoliert erneut grün -- nicht von dieser Story berührt.)
- `pnpm check` -- 6483 Dateien, 0 Errors, 0 Warnings.
- `pnpm lint:wahl` -- 45 Dateien gescannt, 0 Verstöße.
- `pnpm exec eslint <alle neuen/geänderten Dateien>` -- 0 Fehler bis auf das bekannte `svelte/no-unused-svelte-ignore`-Tooling-Detail (siehe Implementation Notes, identisch zu Story 7, `pnpm check` bleibt grün).
- E2E: `pnpm exec vite build`, `pnpm preview --port 4173` (Background), temp Playwright-Config (`testMatch: '**/*.e2e.{ts,js}'`, `baseURL http://localhost:4173`), `pnpm exec playwright test tests/e2e/berlin-wahlen.e2e.ts` -- 13/13 Tests grün, inkl. neuem Test „Trends-Kapitel: rendert Karte + Sankey aus Fixtures, Toggle wechselt ohne neuen Analytik-Request".

**Nicht verifiziert / Risiko:**
- Kein Review-Durchlauf (Blind Hunter/Edge Case/Verification Gap) in dieser Session -- die Story ist implementiert und lokal grün, aber nicht durch eine zweite Perspektive gegengelesen (siehe Story 7 zum Vergleich, dort deckte der Review 27 Funde auf).
- Die Sankey-Band-Zuteilung (Cursor-Reihenfolge nach Ziel-/Quell-Partei alphabetisch) minimiert keine Band-Kreuzungen; bei vielen gleichzeitigen Partei-Übergängen kann das visuell unruhiger wirken als eine echte Sankey-Bibliothek. Bewusster Trade-off (Boundary: kein `d3-sankey`), bei Bedarf nachschärfbar ohne API-Bruch.
- Die Partei-Chip-Liste nutzt `FINDER_PARTIES` (7 Parteien); eine Partei, die nur als „Sonstige" oder außerhalb dieser Liste auftaucht, hat keinen Trend-Chip und bleibt in der Sankey trotzdem als Knoten sichtbar (Sankey kennt keine Partei-Beschränkung, Trend-Karte schon) -- Inkonsistenz ist beabsichtigt (Trend-Karte braucht eine Partei-Auswahl, Sankey nicht), aber nicht explizit in den Boundaries verhandelt.
