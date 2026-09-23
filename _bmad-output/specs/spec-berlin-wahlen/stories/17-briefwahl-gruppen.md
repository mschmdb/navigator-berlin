---
title: 'Briefwahl-Gruppen als kleinste Kartenebene'
type: 'bugfix'
created: '2026-09-23'
status: 'done'
baseline_commit: '062cc0bf08dfd076887290d1b84ef872d0e8c9ed'
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
- [x] Preflight-Script/Test: je Geo-Layer leere `BWB`, Gruppen über Bezirksgrenzen, Join-Abdeckung gegen DB-Briefwahl-Stimmbezirke aller 18 Wahlen mit Geometrie
- [x] `wahl-geo-mapping.ts` (+ Test) -- `gruppeIdFromGeo` für alle Schema-Varianten
- [x] Geo-Pipeline (+ Test) -- Dissolve-Layer je Geo-Slug
- [x] Migration 0010 + Loader im Kiez-Build (+ Test) -- Gruppen-Zuordnung, Summen- und Verwaisten-Gate
- [x] `build-wahl-kiez-aggregat.ts` (+ Test) -- Briefwahl anteilig nach Wahlberechtigten
- [x] `winners`, `results-at-point` (+ Tests) -- Gruppen-Summen
- [x] Winner-Map, Detailseiten-Choropleth, Ergebnis-Panel, Inspector, WebMCP (+ Tests) -- Gruppen-Layer, Gruppen-Label, Caveat-Texte
- [x] `docs/wahldaten-methodik.md`, `technical-notes.md` -- Gruppen-Ebene, Kiez-Schätzung
- [x] Lokaler Neubau: `data:wahl-geo`, `data:wahl-kiez`, `data:wahl-analytik`, `data:wahl-check`

**Acceptance Criteria:**
- Given AGH26 Zweitstimme, when die Stimmbezirks-Karte lädt, then zeigt die Gruppe 7P CDU als Sieger mit 26,5 %, und die Zahl der Gruppen-Sieger entspricht einer SQL-Gegenrechnung aus den Rohdaten.
- Given jede Wahl mit Geometrie, when die Kiez-Aggregate gebaut sind, then summieren sie sich (ohne Stimmbezirke außerhalb aller Kieze) auf die Berlin-Summe inklusive Briefwahl.
- Given `/berlin-wahlen` lokal, when Stimmbezirk- und Kiez-Ebene für 2021, 2023, 2026 gewählt werden, then rendern sie ohne Konsolen-Fehler.

## Implementation Notes

Implementiert + gegen die lokale Dev-DB (23 Wahlen, alle 5 Geo-Layer) verifiziert. Highlights:

- `gruppeIdFromGeo`/`dbUwbIdFromGeo` (`wahl-geo-mapping.ts`) 1:1 gegen echte `stimmbezirk`-uwbIds aller 11 Wahl-Slugs abgeglichen (0 Abweichungen nach Fix: AGH16/BVV16 lieferten für Bezirk 08 kleingeschriebene BWB-Suffixe, `gruppeIdFromGeo` normalisiert jetzt auf Großbuchstaben).
- `wahl_stimmbezirk_gruppe` (Migration 0010) befüllt für alle 18 Wahlen mit Geometrie; Preflight-Gates (`gruppe-preflight.ts`) liefen ohne Verletzung.
- `stimmbezirk.wahlberechtigte` war geparst, aber nie persistiert -- Migration 0010 ergänzt die Spalte, `db-loader.ts` schreibt sie jetzt; ein voller Re-Ingest (`pnpm data:wahl-fetch`) hat alle 73.164 Rows befüllt (Briefwahl-Stimmbezirke selbst tragen 0/keinen Wert -- erwartet, Wahlberechtigte werden an der Urne geführt).
- Kiez-Split (`briefwahl-split.ts`, Largest-Remainder-Rundung) konserviert die Briefwahl-Summe exakt je Gruppe; realer Build-Lauf: 15/18 Wahlen mit 0 Rundungsdifferenz, 3/18 (btw17, agh16, bvv16) mit exakt 1 Urne ohne Kiez-Zuordnung (bestehender Centroid-Fallback, Boundary-Carve-out "ohne Stimmbezirke außerhalb aller Kieze").
- Dissolve-Layer `wahlgruppen-<geoSlug>` (5 Layer) gebaut, tragen `MEMBERS` (Komma-Liste der Urnen-UWB3) für den Tooltip-/Panel-Text „Stimmbezirke X, Y und Briefwahl Z".
- AC 1 (Gruppe 7P) live per SQL + `GET /api/wahl/winners` + `GET /api/wahl/results-at-point` verifiziert: CDU 471 Stimmen (26,5 %), AfD 456 (25,6 %) -- exakt der Spec-Vorgabe.
- Ein Teil der Frontend-/WebMCP-/Docs-Änderungen (ergebnis-panel.svelte, wahl-section.svelte, compare-panel, WebMCP-Caveat-Texte, geometry-Route, Detailseiten-Choropleth, Methodik-Doku) lief parallel durch eine zweite Agent-Instanz im selben Checkout; nach Zusammenführung: `pnpm test:unit -- --run` (437/437 Dateien, 4003/4003 Tests grün), `pnpm check` (0 Fehler), `pnpm lint:wahl` (0 Verstöße), `pnpm data:wahl-analytik` + `pnpm data:wahl-check` grün. `check-wahl-data.ts` zusätzlich um eine `wahl_stimmbezirk_gruppe`-Coverage-Prüfung ergänzt (ohne die hätte ein Re-Deploy auf einer bereits vollständigen Alt-DB die Gruppen-Tabelle nie befüllt).
- Nicht verifiziert: Coolify-Produktions-Deploy/Migration-Lauf; visuelle Kartenprüfung im echten Browser (nur Komponententests + reale API/DB-Checks).
- Nachtrag (Review-Fund): der Edge-Case-Matrix-Eintrag „Summen-Check" war bis dahin nur geloggt (`sum-ergebnis`/`sum-kiez`), nicht als Build-Abbruch-Gate umgesetzt. Ergänzt in `gruppe-preflight.ts#checkGruppenSummeGegenBerlin` (Gruppen-Summe vs. amtliche Berlin-Summe = Summe aller `ergebnis`-Rows der Wahl, identisch zum `wahl_aggregat_berlin`-Total ohne dessen Abhängigkeit) plus einer zweiten Invarianten in `briefwahl-split.ts#computeKiezStimmenMitBriefwahl` (neues `ohneKiezSumme`-Feld im Rückgabewert: `sumKiez + ohneKiezSumme === gruppenSumme`). Beide Gates in `build-wahl-kiez-aggregat.ts` verdrahtet, TDD (rot→grün), realer `pnpm data:wahl-kiez`-Lauf: alle 18 Wahlen bestehen beide Gates ohne Abweichung.

## Spec Change Log

## Review Triage Log

Runde 1 (23.09.2026), 3 Layer: Blind Hunter (BH) 13, Edge Case (EC) 20, Verification Gap (VG) 8 + 3; dazu 2 eigene Funde (OWN) aus Diff-Prüfung und SQL-Gegenrechnung. P1-P6 = Patch-Gruppen, D = defer, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Detailseiten-Choropleth: lokale `gruppenAnzeigeName`-Kopie liefert bei BTW „Briefwahl 075-01-1A-5“ | medium | Regex `/B(...)$/` greift nicht bei `-5`-Suffix; `winner-map-data.ts#briefCodeFromGruppeId` kann es | P1 |
| 2 | EC | Adress-Hint „Stimmbezirk 01B1A hervorgehoben“ | medium | `winner-map-address.svelte.ts:60` nutzt Gruppen-ID als Stimmbezirks-Namen | P1 |
| 3 | BH | Gruppen-Label „726 und 727 und Briefwahl 7P“ | low | Spec verlangt „Stimmbezirke 726, 727 und Briefwahl 7P“ | P1 |
| 4 | EC | BTW-21/25-Suffix mit „B…“ gekürzt | low | gleiche Ursache wie #1 (geteilte Label-Funktion) | P1 |
| 5 | VG | Compare-Panel „gleiches Aggregat“ vergleicht Urne statt Gruppe | medium | `wahl-compare-block.svelte:97-101` `uwbId`-Vergleich | P1 |
| 6 | OWN | Gleichstand in Gruppen nicht deterministisch (AGH26: 03B3F, 07B5H) | medium | `DISTINCT ON … ORDER BY stimmen DESC` ohne Tie-Break; Analytik bricht alphabetisch | P2 |
| 7 | BH/EC | Summen-Gate prüft gegen dieselben Rows statt amtliche Berlin-Summe | medium | `checkGruppenSummeGegenBerlin` summiert `ergebnisRows` doppelt | P2 |
| 8 | EC | Gruppen-ID ohne DB-Briefwahl-Row passiert still | medium | Preflight prüft nur DB-Brief → Mapping | P2 |
| 9 | EC | Geometrie-Urnen ohne DB-Row fließen in Split ein | medium | `urnenInfo` aus allen Mappings, wb null → Gleichverteilung der ganzen Gruppe | P2 |
| 10 | BH/EC | Doppel-Zuordnung einer Urne still verworfen (`onConflictDoNothing`, Dedup) | low | Widerspricht „kein stilles Weglassen“; Fix = throw | P2 |
| 11 | BH | Bezirksgrenzen-Preflight strukturell wirkungslos | low | `bezirkCode` stammt aus demselben `BEZ` wie die Gruppen-ID | P2 |
| 12 | BH/EC | Kiez-/Gruppen-Schreiben ohne Transaktion | medium | delete + Chunk-Inserts; Abbruch hinterlässt halbe Tabellen | P2 |
| 13 | VG | `wahlberechtigte`-Persistenz ungeprüft, Wegfall degradiert still | medium | beide Gates bleiben bei Gleichverteilung grün | P2 |
| 14 | EC | `wahlberechtigte = 0` nicht wie fehlend behandelt | low | direkte Korrektur in `briefwahl-split.ts` | P2 |
| 15 | BH | Kiez-Schätzung ohne Hinweis in Inspector/Compare/WebMCP | medium | Spec: Offenlegungstexte nennen die Schätzung | P3 |
| 16 | BH | Nutzersichtbar „Dissolvierte … (Story 17)“, `--`, Layer-Labels passen nicht zu allen Wahlen | low | `layer-explain.ts`, `DISCLOSURE_TEXT` | P3 |
| 17 | BH/VG | `is_gruppe` fehlt im WebMCP-Output-Schema, `UWB_FORMAT_HINT` ohne Gruppen-Format | low | `schemas.ts:447-470` | P3 |
| 18 | BH | Methodik-Doku: Rechenkern unvollständig, widersprüchlicher Abschnitt „vor 2021“, Largest-Remainder je Partei | low | direkte Doku-Korrekturen | P3 |
| 19 | BH | Performance-Kommentar „~2.300 Gruppen“ statt 1275 | low | Manifest `featureCount: 1275` | P3 |
| 20 | BH | Manifest `geometryType: 'Polygon'` hart | low | Dissolve erzeugt MultiPolygon | P3 |
| 21 | BH | `results-at-point` fragt seriell | low | `await` vor `Promise.all`, direkte Umstellung | P3 |
| 22 | VG | e2e-Fixtures nutzen Urnen-IDs, Stimmbezirks-e2e rot | gap | `tests/e2e/berlin-wahlen.e2e.ts:301-405` `01W100` | P4 |
| 23 | VG | Partei-Anteil auf Gruppen-Ebene ungeprüft | gap | Tests prüfen nur Partei-Name | P4 |
| 24 | VG | Detailseiten-Choropleth ohne Test | gap | kein Treffer in Tests | P4 |
| 25 | VG | `/api/wahl/geometry` Gruppen-Auflösung ohne Test | gap | Route ohne Testdatei | P4 |
| 26 | VG | Kiez-Build: Anteil-Berechnung und Gate-Verdrahtung ungetestet | gap | Build-Script ohne Test | P4 |
| 27 | BH | `results-at-point/server.test.ts` mit festem DB-Fallback, rot ohne DB | low | Zeile 18-19 | P4 |
| 28 | VG | Testtitel „summieren sich auf 100 %“ prüft keine Summe | low | kosmetisch | P4 |
| 29 | VG | `check-wahl-data`-Gruppen-Gate ohne Test | maybe-false | einzeiliges Gate; vor Prod-Deploy gegen Alt-DB prüfen | D |
| 30 | OWN | Portal-Hero „Datenstand“ nennt Landeswahlleiterin nicht | low | Rest aus Story 15, nicht von Story 17 verursacht | D |
| 31 | EC | BTW: gleicher BEZ+BWB in zwei BWK verschmilzt | false | VG prüfte alle 5 Layer: je Gruppe genau ein BWK | R |
| 32 | EC | Geometrie-Match-Key ohne BWK | false | wie #31 | R |
| 33 | EC | Groß-/Kleinschreibung innerhalb einer Gruppe | false | VG: kommt in keinem Layer vor | R |
| 34 | EC | Whitespace in BWB3 | low | reale Daten ohne Whitespace | R |
| 35 | EC | Re-Ingest behält `wahlberechtigte = null` | false | `clearWahlData` löscht vor `insertStimmbezirke` | R |
| 36 | EC | Briefwahl-Row ohne Ergebnis falsch klassifiziert | low | Briefwahlbezirke haben immer Ergebnis-Rows | R |
| 37 | EC | negative/nicht-ganzzahlige Stimmen | low | Parser liefert Ganzzahlen ≥ 0 | R |
| 38 | EC | Fallback, wenn Gruppen-Tabelle leer | false | `check-wahl-data` erzwingt Kiez-Build (Gate `wahlen-mit-gruppen`) | R |
| 39 | BH | DB-Tests enden mit `if (length === 0) return` | low | Bestandsmuster aller DB-Tests | R |
| 40 | BH | Manifest-Reihenfolge und `fetchedAt` neu | low | generiertes Artefakt, nur Rauschen | R |
| 41 | BH | Spec `in-review` trotz offener Prod-Verifikation | false | Prod-Deploy ist ausdrücklich außerhalb dieser lokalen Story | R |

## Design Notes

Kiez-Split: Für Urne u in Gruppe g gilt `brief_u = brief_g × wb_u / Σ wb(g)` (wb = Wahlberechtigte). Ein Gruppen-Centroid würde Gruppen an Kiezgrenzen komplett einem Kiez zuschlagen; die Urnen-Zuordnung bleibt dadurch exakt, nur die Briefwahl ist geschätzt.

## Verification

**Commands:**
- `pnpm test:unit -- --run scripts/wahlen src/lib/data src/routes/api/wahl` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm data:wahl-check` -- expected: grün

**Manual checks:**
- `/berlin-wahlen` Stimmbezirk-Ebene AGH26: Treptow-Köpenick 7P zeigt CDU; Tooltip nennt 726, 727 und Briefwahl 7P.
