---
title: 'Briefwahl-Gruppen als kleinste Kartenebene'
type: 'bugfix'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/wahldaten-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Stimmbezirks- und Kiez-Ebene zählen nur Urnenstimmen. 2026 fehlen dort 40,8 % der gültigen Stimmen, in 429 von 2542 Urnenbezirken zeigt die Karte einen anderen Sieger als Urne plus Briefwahl (AfD 823 statt 557 Bezirke). Die Verzerrung betrifft jede Wahl mit Geometrie (Briefwahl-Anteil 28 bis 47 %). Berlin- und Bezirkswerte sind korrekt.

**Approach:** Die kleinste Kartenebene wird die Briefwahl-Gruppe: alle Urnenbezirke mit gleichem Briefwahlbezirk plus dieser Briefwahlbezirk (wie Tagesspiegel: „Stimmbezirke 726, 727 und 7P“). Geometrie = Dissolve der Urnen-Polygone je Gruppe. Kiez-Aggregat und Analytik enthalten danach die Briefwahl.

## Boundaries & Constraints

**Always:**
- Entscheidung Matze 23.09. (A): Briefwahl-Gruppen, Briefwahl-Fix vor Story 16.
- Gilt für alle Wahlen mit Stimmbezirks-Geometrie (BTW 17/21/25, AGH/BVV 16/21/23/26).
- Summe aller Gruppen einer Wahl = amtliche Berlin-Summe (keine Stimme geht verloren); Build bricht ab, wenn ein Briefwahl-Stimmbezirk keiner Gruppe zugeordnet ist oder eine Urne ohne Gruppe bleibt.
- Kiez-Ebene: Urne → Kiez bleibt wie heute (Centroid); die Briefwahlstimmen einer Gruppe verteilen sich anteilig nach Wahlberechtigten auf ihre Urnen und damit auf deren Kieze. Methodik-Doku und Offenlegungstexte nennen diese Schätzung.
- Tooltip, Ergebnis-Panel und Inspector benennen die Gruppe („Stimmbezirke 726, 727 und Briefwahl 7P“).
- Briefwahl-Hinweise, die heute nur vor 2021 erscheinen, fallen weg oder werden korrekt für alle Jahre formuliert.

**Never:**
- Keine Änderung an Berlin-/Bezirks-Aggregaten (`buildAggregates`).
- Keine Schätzung auf Stimmbezirks-Ebene: die Karte zeigt echte Gruppen-Summen.
- Kein Urnen-only-Umschalter.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gruppe 7P AGH26 | 09W726 + 09W727 + 09B7P | eine Fläche, CDU 26,5 %, AfD 25,6 %, Sieger CDU | N/A |
| Punkt-Abfrage | Adresse in 09W727 | Ergebnis der Gruppe 7P | N/A |
| Summen-Check | alle Gruppen einer Wahl | Summe = Berlin-Aggregat | Abweichung → Build-Abbruch |
| Verwaister Briefwahlbezirk | B-Stimmbezirk ohne Urne in der Geometrie | kein stilles Weglassen | Build-Abbruch mit uwbId |
| Feld-Varianten | ah16 `BWB` voll, btw17 `BWB2`, ah21/ah26/bt25 `BWB3` | korrekter Gruppen-Schlüssel je Geo-Slug | unbekanntes Schema → Fehler |
| Kiez-Split | Gruppe mit Urnen in 2 Kiezen | Briefwahl anteilig nach Wahlberechtigten auf beide Kieze | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/data/wahl-geo-mapping.ts:19-158` -- `WAHL_TO_GEO`, `dbUwbIdFromGeo`, `pickUwb3`; hier `gruppeIdFromGeo` ergänzen (Schlüssel `BEZ + 'B' + BWB3`, entspricht DB-uwbId der Briefwahl-Stimmbezirke, z.B. `09B7P`; BTW-Format analog zu `dbUwbIdFromGeo` prüfen).
- `scripts/wahlen/lib/sbb-geo-pipeline.ts:26-46`, `scripts/build-wahl-geometries.ts` -- mapshaper ohne Dissolve; zusätzlicher Layer `wahlgruppen-<geo>.<hash>.geojson` per `-dissolve` (Properties: Gruppen-ID, Mitglieds-uwbIds), eigener MANIFEST-Eintrag.
- Neue Tabelle `wahl_stimmbezirk_gruppe (wahl_id, uwb_id, gruppe_id)` (Migration 0010), gefüllt im Kiez-Build aus der Geometrie; Briefwahl-Stimmbezirk zeigt auf sich selbst als Gruppe.
- `src/routes/api/wahl/winners/+server.ts:108` -- filtert Briefwahl weg; Stimmbezirks-Ebene summiert künftig je Gruppe.
- `src/routes/api/wahl/results-at-point/+server.ts:100-129`, `src/lib/data/get-wahl-results-at-point.ts` -- Punkt → Urne → Gruppe → Gruppen-Ergebnis.
- `scripts/build-wahl-kiez-aggregat.ts:91-115`, `scripts/wahlen/lib/kiez-mapper.ts:33-74` -- `ist_briefwahl_aggregat = false`-Filter ersetzen durch anteilige Briefwahl-Verteilung.
- `scripts/build-wahl-analytik.ts` -- keine eigene Logik, danach neu rechnen.
- Winner-Map (`winner-map*.svelte*`, `winner-map-data.ts:332-338` `aggregationHinweisText`), Detailseiten-Choropleth `WahlStimmbezirkChoropleth`, `ergebnis-panel.svelte:173-176` -- Gruppen-Layer laden, Texte anpassen.
- Caveats `jahr < 2021`: `wahl-section.svelte:162-164`, `webmcp/tools/wahl/get-election-result.ts:56-60`, `compare-elections.ts:46-50`.
- `get_voting_district_geometry` (WebMCP) -- liefert Gruppen-Geometrie, Beschreibung englisch anpassen.
- Nicht ändern: `buildAggregates`, Parser (`wb-csv-parser.ts`, `sbb-row-transformer.ts`, `row-transformer.ts`), Urnen-Layer (bleiben für Punkt-Abfrage).

## Tasks & Acceptance

**Execution:**
- [ ] Preflight-Script/Test: je Geo-Layer leere `BWB`, Gruppen über Bezirksgrenzen, Join-Abdeckung gegen DB-Briefwahl-Stimmbezirke aller 18 Wahlen mit Geometrie
- [ ] `wahl-geo-mapping.ts` (+ Test) -- `gruppeIdFromGeo` für alle Schema-Varianten
- [ ] Geo-Pipeline (+ Test) -- Dissolve-Layer je Geo-Slug
- [ ] Migration 0010 + Loader im Kiez-Build (+ Test) -- Gruppen-Zuordnung, Summen- und Verwaisten-Gate
- [ ] `build-wahl-kiez-aggregat.ts` (+ Test) -- Briefwahl anteilig nach Wahlberechtigten
- [ ] `winners`, `results-at-point` (+ Tests) -- Gruppen-Summen
- [ ] Winner-Map, Detailseiten-Choropleth, Ergebnis-Panel, Inspector, WebMCP (+ Tests) -- Gruppen-Layer, Gruppen-Label, Caveat-Texte
- [ ] `docs/wahldaten-methodik.md`, `technical-notes.md` -- Gruppen-Ebene, Kiez-Schätzung
- [ ] Lokaler Neubau: `data:wahl-geo`, `data:wahl-kiez`, `data:wahl-analytik`, `data:wahl-check`

**Acceptance Criteria:**
- Given AGH26 Zweitstimme, when die Stimmbezirks-Karte lädt, then zeigt die Gruppe 7P CDU als Sieger mit 26,5 %, und die Zahl der Gruppen-Sieger entspricht einer SQL-Gegenrechnung aus den Rohdaten.
- Given jede Wahl mit Geometrie, when die Kiez-Aggregate gebaut sind, then summieren sie sich (ohne Stimmbezirke außerhalb aller Kieze) auf die Berlin-Summe inklusive Briefwahl.
- Given `/berlin-wahlen` lokal, when Stimmbezirk- und Kiez-Ebene für 2021, 2023, 2026 gewählt werden, then rendern sie ohne Konsolen-Fehler.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Kiez-Split: Für Urne u in Gruppe g gilt `brief_u = brief_g × wb_u / Σ wb(g)` (wb = Wahlberechtigte). Ein Gruppen-Centroid würde Gruppen an Kiezgrenzen komplett einem Kiez zuschlagen; die Urnen-Zuordnung bleibt dadurch exakt, nur die Briefwahl ist geschätzt.

## Verification

**Commands:**
- `pnpm test:unit -- --run scripts/wahlen src/lib/data src/routes/api/wahl` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm data:wahl-check` -- expected: grün

**Manual checks:**
- `/berlin-wahlen` Stimmbezirk-Ebene AGH26: Treptow-Köpenick 7P zeigt CDU; Tooltip nennt 726, 727 und Briefwahl 7P.
