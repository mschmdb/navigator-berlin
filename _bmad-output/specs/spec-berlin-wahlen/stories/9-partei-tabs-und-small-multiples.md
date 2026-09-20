---
title: 'Partei-Ansichten: Tabs und Small Multiples'
type: 'feature'
created: '2026-09-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'f212bf2'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Hero-Karte zeigt nur die stärkste Partei; Besucher können keine Einzel-Partei-Intensität sehen (Tagesspiegel-Muster „Gewinner | je Partei"). Das Kapitel „Stärkste und schwächste Gebiete" (CAP-7) ist ein Platzhalter.

**Approach:** (a) Partei-Tabs an der Winner-Map: „Gewinner" plus je ein Tab pro `FINDER_PARTIES`-Partei; im Partei-Modus färbt die Karte nach dem Anteil dieser Partei (Partei-Farbe, Deckkraft über eine partei-relative Rampe), auf allen drei Ebenen inkl. Stimmbezirk, Zeit-Animation funktioniert weiter. (b) Das Kapitel „Extreme" bekommt Small Multiples: eine SVG-Mini-Karte pro Partei (kein MapLibre; 3 GL-Kontexte laufen schon), gemeinsamer Ausschnitt, stärkster und schwächster Kiez benannt mit Anteil, responsive Raster 2-spaltig mobil / 3-4 Desktop. Dafür EINE additive Server-Erweiterung: `partei`-Param an `/api/wahl/winners` (Row-Shape unverändert, `anteil` = Anteil der gewählten Partei statt Sieger).

**Direktiven (Matze):** Parteien-Menge = `FINDER_PARTIES` (7); der ux-blueprint (bindend, „max. 7 Parteien") löst den Widerspruch zur CAP-7-Formulierung „jede Partei aus partei-farben.ts" auf; keine „Sonstige"-Mini-Karte (Sonstige-frei-Boundary). „Hochburg" bleibt verboten (`lint:wahl`).

## Boundaries & Constraints

**Always:**
- Server additiv: `partei`-Param (valibot-Picklist = `FINDER_PARTIES`) an `/api/wahl/winners`; Query nach dem Bauplan `get-winners-bulk.ts` OHNE `DISTINCT ON`, `WHERE p.kurzname = <partei>`; Stimmbezirk-Variante analog auf `ergebnis` (Briefwahl-Aggregate ausgefiltert wie Bestand); Response-Shape und `license`/`source_*`-Felder unverändert. Defensive With-DB-Tests nach Haus-Muster.
- Partei-Modus wiederverwendet die Bestands-Kette (`bakeJahrProperties`-Variante, `fillColorExpression`); NUR die Deckkraft bekommt eine partei-relative Rampe (normiert auf die Anteils-Spanne der Partei in der geladenen Ebene), die Legende nennt die echte Spanne in Prozent. Jahr-Wechsel bleibt reines `setPaintProperty`; Tab-Wechsel darf `setData` (neuer Datensatz, wie Ebenen-Wechsel); Karte wird nie zerstört.
- Im Partei-Modus: Wechsel-Outline aus (`NEVER_FILTER`; Sieger-Semantik), Legende/Takeaway/Tooltip/Tabelle partei-spezifisch formuliert (kein „Stärkste Partei"), Achromatopsie-Patterns bleiben zuschaltbar.
- Partei-Requests über einen Loader mit Modul-Cache (Key `typ-stimmtyp-ebene-partei`); die Small Multiples teilen sich diese Responses mit den Tabs; genau EIN Request je Key seitenweit.
- Small Multiples: pures GeoJSON→SVG-Projektions-Modul (Bounds → Web-Mercator-y → `d`-Pfade, gemeinsamer viewBox), Muster `sankey-layout.ts`, Node-Unit-Tests; jüngste Wahl der Reihe (`currentJahr`), Kiez-Ebene; Extrem-Kieze mit Anteil beschriftet, Gleichstand deterministisch alphabetisch (localeCompare 'de'); je Mini-Karte `role="img"` + sprechendes aria-label + gemeinsame Tabellen-Alternative (Partei, stärkster/schwächster Kiez, Anteile); Takeaway + Datenstand-Zeile.
- Datenlücken ehrlich: Partei ohne Daten in der Reihe (z. B. BSW vor 2023) zeigt neutralen Zustand + Hinweis statt leerer Karte; Kiez-Coverage- und Briefwahl-Caveats aus der Methodik zitieren; `docs/wahldaten-methodik.md` um einen Abschnitt Anteils-Intensität (Rampen-Normierung) fortschreiben.
- E2E in NEUER Datei `tests/e2e/berlin-wahlen-partei.e2e.ts` (Ordner-Konvention ein Flow pro Datei; `berlin-wahlen.e2e.ts` hat 735 Zeilen); geteilte Fixtures extrahieren statt duplizieren.
- Dateien < 500 Zeilen: `winner-map.svelte` steht bei 494; Partei-Tabs als eigene Komponente, Partei-Bake/Rampe nach `internal/`, nötigenfalls weiter extrahieren. Keine Em-Dashes; Zahlen de-DE, `tabular-nums`.

**Never:**
- Keine 7 zusätzlichen MapLibre-Instanzen; Small Multiples sind statisches SVG. Kein `d3-geo`/keine neue Dependency (Projektion selbst bauen, ~50 Zeilen).
- Kein Umbau von Portal-Steuerleiste (Tabs sind karten-lokal, nicht in der URL), Wechsel-/Trends-Kapitel, Ergebnis-Panel; `/api/wahl/kiez-shares` nicht als Datenquelle (bzrId-gekeyt, eine Wahl, ohne license).
- Kein Schema-/Build-Script-Umbau; nur die additive Query-/Routen-Erweiterung.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Partei-Tab Kiez | Tab „SPD", Ebene kiez | Karte färbt SPD-rot mit Deckkraft nach SPD-Anteil (relative Rampe), Legende nennt Spanne, Outline aus, ein Request `partei=SPD` (gecacht) | N/A |
| Zurück zu Gewinner | Tab „Gewinner" | Sieger-Ansicht exakt wie vor Story 9, kein neuer Winners-Request (Cache) | N/A |
| Partei-Tab Stimmbezirk | Default-Ebene, Tab „CDU" | Jahr-weise CDU-Anteile je Stimmbezirk, Briefwahl-Hinweis bleibt | N/A |
| Jahr-Wechsel im Partei-Modus | Zeit-Leiste Play | Umfärbung per setPaintProperty, kein Request | N/A |
| Partei ohne Daten | Tab „BSW", Reihe ohne BSW-Jahre | Neutrale Karte + Hinweis-Satz, kein Crash | Leer-Zustand |
| API-Validierung | `partei=Piraten` | 400 (Picklist) | 400 |
| Small Multiples | Extreme-Kapitel, AGH | 7 SVG-Mini-Karten, gemeinsamer Ausschnitt, je stärkster+schwächster Kiez mit Anteil benannt; 2-spaltig mobil | N/A |
| Extrem-Tie | Zwei Kieze mit identischem Anteil | Alphabetisch erster (de) wird benannt | N/A |
| DB-los / leer | Anteile leer | Kapitel-Hinweis statt leerer Minis, kein Crash | Leer-Zustand |

</frozen-after-approval>

## Code Map

- `src/lib/server/db/queries/wahl/get-winners-bulk.ts` -- Bauplan (Reihen-Auflösung, `sql.raw`-Identifier-Map kiez/bezirk); neue `get-partei-anteile-bulk.ts` ohne `DISTINCT ON` + `WHERE p.kurzname`; Stimmbezirk: `get-stimmbezirks-winners.ts` als Vorlage (ergebnis-Tabelle, `ist_briefwahl_aggregat=false`). Tabellen tragen alle Parteien je Gebiet (`wahl_aggregat_kiez/_bezirk`, `ergebnis`); `anteil` ist Bruch 0..1.
- `src/routes/api/wahl/winners/+server.ts` -- `QuerySchema` um `partei: v.optional(v.picklist(FINDER_PARTIES))`; Response-Mapping (jahr, parent_slug, license) 1:1 wiederverwendbar; `server.test.ts`-Muster (With-DB-Anker: AGH 2023 CDU-Berlin ≈ 0.282 als Referenzstil).
- `src/lib/components/atlas/internal/kiez-finder-engine.ts:81` -- `FINDER_PARTIES` = SPD, CDU, GRÜNE, FDP, AfD, Die Linke, BSW.
- `src/lib/components/wahl-portal/winner-map.svelte` (494 Z.!) -- Einbau-Punkte: Tabs über der Karte (nach AddressSearch), `joinedFc`-Verzweigung (Z.207-222), `paintJahr`-Effect (Z.327-333: im Partei-Modus Partei-Paint statt `setActiveJahr`-Sieger-Paint bzw. Parameter), Legende/Takeaway/Tabelle-Zweige; Auslagern nach `internal/` wo nötig.
- `src/lib/components/wahl-portal/internal/winner-map-expressions.ts` -- `jahrPropKeys`/`bakeJahrProperties` (Partei-Variante: Wechsel-Flags konstant 0), `fillColorExpression` wiederverwenden; NEU `parteiFillOpacityExpression(jahr, minAnteil, maxAnteil)` + JS-Zwilling; Spannen-Berechnung aus den geladenen Rows.
- `src/lib/components/wahl-portal/internal/winner-map-winners.svelte.ts` -- Loader-Muster (Modul-Cache, In-Flight-Dedupe, `_reset*`); Partei-Loader analog (Key inkl. partei); `StimmbezirkLoader` (`winner-map-stimmbezirk.svelte.ts`) für die Stimmbezirk-Partei-Variante erweitern (Key typ-stimmtyp-jahr-partei).
- `src/lib/components/wahl-portal/internal/winner-map-maplibre.svelte.ts` -- `setActiveJahr`/`clearActiveJahr`/`NEVER_FILTER`; `mapFactory`-DI; lokale Fake-Map im Controller-Test hat `setFilter`, die geteilte `internal/fake-maplibre-test-util.ts` NICHT (bei Bedarf dort ergänzen).
- NEU `internal/geo-svg.ts` + Test -- pure Projektion: FeatureCollection-Bounds → Web-Mercator-y, `pathD(feature)`, gemeinsamer viewBox; Muster `sankey-layout.ts`.
- NEU `small-multiples.svelte` (+ internal-Datenmodul + Context-Probe) + Tests -- 7 Mini-SVGs, Extrem-Kiez-Ermittlung (Tie alphabetisch), Labels mit `formatAnteilPct`, Grid `grid-cols-2 lg:grid-cols-4`, Tabellen-Alternative (`data-table-alternative`), Takeaway, Datenstand; Kapitel ersetzt Platzhalter `extreme-gebiete` in `+page.svelte:114-139` (Muster TRENDS_CHAPTER).
- `winner-map-legende.svelte` / `winner-map-tooltip.svelte` -- Partei-Modus-Beschriftung per Props, nicht duplizieren.
- `docs/wahldaten-methodik.md` -- Kiez-Aggregat/Briefwahl (Z.130-223) und Tie-Break (Z.254-274) zitieren; NEU Abschnitt Anteils-Intensität.
- Tests: `winner-map.svelte.test.ts` (Context-Probe, fakeFetch), `fake-maplibre-test-util.ts`; E2E-Muster `page.route('**/api/wahl/winners**', …)`; `ELECTIONS`-Fixture in geteiltes Modul ziehen.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [x] `get-partei-anteile-bulk.ts` + Stimmbezirk-Variante + Tests -- Queries (kiez/bezirk alle Jahre; stimmbezirk je Wahl), DB-los `[]`.
- [x] `winners/+server.ts` + `server.test.ts` -- `partei`-Param (Picklist, 400 sonst), Shape unverändert, With-DB-Block.
- [x] Partei-Loader (`internal/`) + `StimmbezirkLoader`-Erweiterung + Tests -- Modul-Cache je typ×stimmtyp×ebene×partei, Ein-Request-Garantie.
- [x] `internal/winner-map-expressions.ts` + Test -- Partei-Bake (Wechsel-Flags 0), `parteiFillOpacityExpression` + JS-Zwilling + Spannen-Helper.
- [x] `winner-map-partei-tabs.svelte` + Einbau `winner-map.svelte` + Tests -- radiogroup „Gewinner | 7 Parteien" (karten-lokal, `nextRadioIndex`), Verdrahtung: Tab-Wechsel → Partei-FC (setData) + Partei-Paint; zurück zu Gewinner = Bestand; Outline aus; Legende/Takeaway/Tooltip/Tabelle partei-spezifisch; Fake-Map-Verdrahtungstest (Tab-Klick → erwartete Paint-Keys); Datei-Limits einhalten.
- [x] `internal/geo-svg.ts` + Test -- Projektion, viewBox, Pfad-Determinismus.
- [x] `small-multiples.svelte` (+ Datenmodul + Probe) + Tests -- Extrem-Ermittlung (Tie de-alphabetisch), 7 Minis, Labels+Anteile, Leer-/Fehler-Zustände, Tabelle, Takeaway, Datenstand.
- [x] `+page.svelte` -- `extreme-gebiete` herauslösen, Nav unverändert.
- [x] `docs/wahldaten-methodik.md` -- Abschnitt Anteils-Intensität.
- [x] `tests/e2e/berlin-wahlen-partei.e2e.ts` -- Tab färbt um (ein `partei=`-Request, Sieger-Cache unangetastet), Rück-Tab ohne Request, Small Multiples rendern 7 Minis mit Extrem-Labels; Fixture-Sharing.

**Acceptance Criteria:**
- Given die Hero-Karte, when Tab „SPD" gewählt wird, then färbt die Karte nach SPD-Anteil (Partei-Farbe, relative Rampe, Spanne in der Legende), auf stimmbezirk wie kiez/bezirk; Tab „Gewinner" stellt exakt den Bestand wieder her.
- Given das Extreme-Kapitel, when Daten geladen, then zeigen 7 Mini-Karten mit gemeinsamem Ausschnitt je Partei den stärksten und schwächsten Kiez mit Anteil; „Hochburg" kommt nirgends vor (`lint:wahl` grün).
- Given der Partei-Modus, when die Zeit-Animation läuft, then färbt sie ohne weitere Requests um; die Ein-Request-Garantie je Cache-Key hält seitenweit.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Drei Layer (Blind Hunter 16+4, Edge Case Hunter 17, Verification Gap 4+3) + 2 Koordinator-Funde. Dedupliziert:

| # | Quelle | Fund | Verdict | Route |
|---|--------|------|---------|-------|
| 1 | VG-1, BH-13, EC-13-Nähe | Kiez/Bezirk-Partei-Pfad: der setActiveJahr-Effect liest `parteiRamp` nicht als Dependency (Tab-Klick ohne Jahr-/Ebenen-Wechsel repaintet die Deckkraft nicht); Verdrahtungs-Test lief nur Stimmbezirk, Rückwechsel Rampe→null auf kiez ungetestet | high | patch (Effect-Dependency, Controller-Test mit variabler Rampe + aktivem Jahr, Wiring-Test-Kiez-Variante) |
| 2 | BH-5, EC-1 | Opacity-Floor 0,08 unterbietet NEUTRAL_OPACITY 0,1: „kein Wert" heller als „niedrigster Wert" | medium | patch (minOpacity 0,15; bleibt weit unter dem alten 0,4, Matzes Live-Fund bleibt gelöst) |
| 3 | BH-3, BH-6, VG-2-Anm., EC-c3 | Spannen-Bezugsgröße inkonsistent: Karte reihen-weit, Minis jahres-weit, Takeaway mischt beides, Methodik behauptet gleiche Sprache | medium | patch (überall reihen-weite Spanne: macht Jahre in der Zeit-Animation vergleichbar; Minis ziehen nach; Texte nennen die Bezugsgröße explizit) |
| 4 | BH-4 | Legende verschweigt die partei-relative Normierung | medium | patch (Normierungs-Satz, mit #3) |
| 5 | EC-2, EC-3 | Partei mit Reihen- aber ohne Jahres-Daten (BSW 2016): leere Karte ohne Hinweis, Legende mit erfundener 0-100%-Rampe | medium | patch (hasData jahres-bezogen; Legende zeigt ohne Daten einen Hinweis statt Rampe) |
| 6 | BH-2, EC-5, VG-4 | figure/canvas-aria-label bleibt „stärkste Partei" im Partei-Modus; kein Live-Announcement beim Tab-Wechsel | medium | patch (Partei-Zweig im Label, role=status-Ansage, Label-Assertion im Wiring-Test) |
| 7 | EC-4 | Tab-Klick vor geladener Partei-Response: Karte zeigt kurz Sieger-Farben unter Partei-Tab, Texte fremde Spanne | medium | patch (Partei-FC/Texte nur aus zur Partei passender Response; bis dahin letzter Stand) |
| 8 | EC-6 | Zeit-Leiste verliert im Partei-Modus Jahre (Options aus Partei-Rows) | medium | patch (Options im Partei-Modus aus `jahreForReihe`) |
| 9 | EC-7 | `StimmbezirkLoader` ohne In-Flight-Dedupe (Doppel-Request je Key möglich) | medium | patch (Muster winners-Loader) |
| 10 | BH-9, EC-8 | Ein fehlgeschlagener/hängender Partei-Request killt alle 7 Minis | medium | patch (Status pro Mini; Kapitel-Error nur wenn alle scheitern) |
| 11 | BH-7 | Minis-Takeaway zählt Geometrie-Zellen statt gematchter Kieze | low | patch |
| 12 | BH-8 | Minis ohne Methodik-Link/Coverage-Caveat (Story-Boundary) | medium | patch |
| 13 | EC-11 | geo-svg: degenerierte 0-Box → Scale-Explosion | low | patch (Guard, Aufrufer zeigt Leerzustand) |
| 14 | EC-12 | Tabellen-Alternative: zwei Spalten heißen identisch „Anteil" | low | patch (präzise Labels) |
| 15 | BH-10, VG-O1 | solid-Textur (6 % transparente 1px-Punkte) kaum wahrnehmbar; Legenden-Swatch bleibt Vollfläche (Zwilling fehlt) | medium | patch (dichteres Raster, `patternPreviewStyle`-Zwilling) |
| 16 | BH-11, EC-10, VG-O2, Koord. | Die-Linke-Pattern 'diagonal' kollidiert mit FDP (Kollision nur verschoben) | medium | patch (neues Pattern 'diagonal-reverse' 135° für Die Linke inkl. Image-Builder + Preview-Zwilling + Eindeutigkeits-Test; Bestands-Kollisionen CDU/AfD und GRÜNE/BSW: defer) |
| 17 | BH-12, Koord. | Typo `WinnerMapPerteiTabs` | low | patch |
| 18 | BH-15, EC-9, VG-3 | Lazy-Mount ungeschützt (E2E würde Eager-Rückfall nicht bemerken); vor Intersect leere Section ohne Hinweis | medium | patch (E2E: vor Scroll 0 partei-Requests + Kapitel nicht im DOM; sichtbarer „lädt beim Scrollen"-Hinweis als Fallback; Requests-Share-Assertion nach Scroll) |
| 19 | VG-3 | `FINDER_PARTIES` als DB-Filter ohne Klammer an die Seed-Kurznamen | medium | patch (Unit-Test gegen `PARTEI_SEED`) |
| 20 | VG-2 | Mini-Zellen-Opacity (einzige Informationsachse) unassertiert | medium | patch (min/max/mittig-Assertions, mit #3) |
| 21 | BH-1, EC-c1 | `winner-map.svelte` 523 Zeilen (Boundary <500) | medium | patch (Tabellen-Spalten + Sichtbarkeits-Fassade nach `internal/`) |
| 22 | BH-min1, EC-c5 | Methodik-Abschnitt trägt Prozess-Sprech („Live-Fund 20.09.", Story-Nr.) und behauptet „jüngste Wahl" statt gewähltes Jahr | low | patch (Regeln statt Vorfall; „gewähltes Jahr") |
| 23 | BH-min3 | `SmallMultiplesLoaders.byPartei` verliert die Union | low | patch (typisierter Record) |
| 24 | BH-14 | Muster-Toggle im Partei-Modus „sinnlos" | rejected | Muster unterscheidet im Partei-Modus Daten-Flächen von Neutral-Flächen (mit #2 relevanter denn je); Boundary „Patterns bleiben zuschaltbar" bleibt |
| 25 | BH-min2 | `partei`-Echo-Feld in der Response | rejected | Boundary „Response-Shape unverändert"; der Filter steht in der URL |
| 26 | BH-min4 | `KEIN_ANTEIL`-Sentinel in Tabellen-Spalten | rejected (low) | funktional korrekt, `format` deckt beide Enden; nullable Accessor wäre API-Umbau der Bestands-Tabelle |
| 27 | EC-c2 | Ergebnis-Panel-Änderung bricht die „Never"-Boundary | rejected | Bewusster, von Matze live beauftragter Fix außerhalb des Story-Scopes (eigener Commit d6bb77f, eigene Tests grün); Boundary galt dem Implementierer |
| 28 | EC-c6 | Tooltip im Partei-Modus ohne Partei-Kennzeichnung | false | VG hat geprüft: Tooltip rendert Partei + Anteil aus den gebackenen Properties, kein Sieger-Framing |
| 29 | BH-16-Teil | Story-Metadaten (Status, Checkboxen, Notes) unvollständig | rejected | Prozess-Schritt step-05 nach der Patch-Runde |


## Design Notes

Der `partei`-Param statt eines Alle-Parteien-Bulks: Tabs laden lazy pro Partei (~430 Rows) statt ~3.500 auf Verdacht; die Small Multiples laden die 7 Parteien parallel und teilen den Cache mit den Tabs. Die partei-relative Deckkraft-Rampe ist die visuelle Kern-Entscheidung: die Sieger-Rampe (0,15-0,45) würde Einzel-Parteien wie FDP flächig auf Minimal-Deckkraft zeigen; Normierung auf die Partei-Spanne macht Unterschiede sichtbar, die Legende macht die Normierung transparent (Methodik-Abschnitt).

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- E2E: `pnpm exec vite build`, `pnpm preview --port 4173` (Background; Ports vorher freiräumen: verwaiste `vite preview` killen), temp Playwright-Config (`testMatch: '**/*.e2e.{ts,js}'`, baseURL 4173), `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts` -- expected: grün
