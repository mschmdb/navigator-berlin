---
title: 'Stimmbezirks-Ebene als Standard-Ansicht'
type: 'feature'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '73c6f2fae4d860fff3bae66e4a6f57450045546d'
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Winner-Map zeigt nur die abgeleiteten Kiez-/Bezirks-Aggregate. Matze-Direktive 19.09. (Tagesspiegel-Referenz): Die amtlichen Einheiten gehören in die Darstellung, Stimmbezirke als Standard-Ansicht.

**Approach:** Ebene `stimmbezirk` wird dritter Wert im Portal-URL-State und neuer Default. Die Winners-API bekommt einen Stimmbezirks-Zweig (pro Jahr, via bestehendem `getStimmbezirksWinners`), die Winner-Map einen Stimmbezirks-Pfad: Geometrie pro Wahl-Generation (`geoSlugForWahl`), Join über `dbUwbIdFromGeo`, Jahr-Wechsel swappt die Geometrie per `setData` auf der bestehenden Instanz. Jahre ohne Stimmbezirks-Daten fallen sichtbar auf die nächstbeste Ebene zurück.

## Boundaries & Constraints

**Always:**
- URL-State: `EBENE_VALUES = ['stimmbezirk','kiez','bezirk']`, `DEFAULT_EBENE = 'stimmbezirk'`, Label „Stimmbezirk"; Serialisierung weiter nur bei Abweichung vom Default (alte Links ohne `ebene` zeigen künftig Stimmbezirke, akzeptiert: Flag ist off).
- API: `/api/wahl/winners` akzeptiert zusätzlich `ebene=stimmbezirk` und verlangt DANN einen `jahr`-Parameter (400 ohne); Response-Rows wie bisher plus Top-Level-Feld `geo_slug` (aus `geoSlugForWahl`), `gebiet_slug` = DB-`uwbId`. Auflösung typ+stimmtyp+jahr → Wahl → `getStimmbezirksWinners(wahlId)`; Briefwahl-Aggregat-Rows (`istBriefwahlAggregat`) werden ausgefiltert (keine Geometrie). Jahr ohne Geometrie → 200 mit leeren `winners` + `geo_slug: null`. Bestehende kiez/bezirk-Semantik unverändert; `license`/`source_url` wie gehabt.
- Komponente: Winners-Cache für stimmbezirk pro `typ×stimmtyp×jahr` (abweichend vom Reihe-Bulk, dokumentiert); Geometrie-Cache pro `geo_slug` (`wahlbezirke-<geoSlug>` via `loadManifest`/`fetchLayer`); Join pure in `winner-map-data.ts` über `dbUwbIdFromGeo(props, wahlSlug)` (`wahlSlugFromTypJahr`); Anzeige-Name = `uwbId` mit Präfix „Stimmbezirk". Jahr-Wechsel kann Geometrie-Swap bedeuten: weiterhin `setData` auf der bestehenden Instanz, nie Re-Init (Bestands-Boundary).
- Fallback-Leiter sichtbar: hat das aktive Jahr keine Stimmbezirks-Geometrie/-Daten, rendert die Karte die nächstbeste verfügbare Ebene (kiez, sonst bezirk) und die Status-Zeile nennt das („2011: keine Stimmbezirks-Daten, Karte zeigt Bezirke"); der Ebene-Toggle bleibt auf dem Nutzer-Wunsch stehen (kein stilles Umschalten des States).
- Adress-Suche auf Stimmbezirks-Ebene: Punkt → Stimmbezirk über Point-in-Polygon auf der geladenen Geometrie (Turf/`getIndex`-Bestandsmuster), Hervorhebung + `data-highlighted-slug` = uwbId; kein Treffer → bestehender Hinweis.
- Transparenz: `aggregationHinweisText('stimmbezirk')` = amtliche Stimmbezirks-Ergebnisse (Urnenwahl; Briefwahl wird eigenen Briefwahlbezirken zugeordnet und ist nicht kartierbar) + bestehender Methodik-Link; Wiederholungswahl-Caption wie gehabt.
- Alle Bestands-Garantien der Winner-Map gelten weiter (Stale-Guards inkl. Jahr beim Stimmbezirks-Cache, Status-Zeile, Muster-Toggle mit coalesce, Tabelle, Legende); Tabelle trägt auf Stimmbezirks-Ebene die uwbId-Labels.
- Methodik-Doku: Absatz zur Stimmbezirks-Ansicht (amtliche Einheiten, Generationen-Geometrie, Briefwahl-Lücke) in `docs/wahldaten-methodik.md`; lint:wahl bleibt grün.
- TDD (ADR-012): URL-State-Defaults, API-Zweig (Routen-Test DB-los + valibot), Stimmbezirks-Join + Fallback-Leiter pure test-first; Component-Test Fallback-Hinweis; E2E: Stimmbezirks-Mock + Ebenen-Wechsel kiez↔stimmbezirk + Jahr-Wechsel-Geometrie-Swap ohne Karten-Verlust. Dateien < 500 Zeilen; kein Push/Deploy (Freeze).

**Never:**
- Keine Wahlkreis-Ebene (Geometrien fehlen, Backlog beim 2026-Ingest); keine Zeit-Animation (bleibt Kiez, Story 7); keine Änderung an Analytik/Zwilling (bleiben Kiez).
- Kein Bulk-Fetch aller Stimmbezirks-Jahre einer Reihe (Response-Größe); keine neuen DB-Tabellen oder Migrationen.
- `getStimmbezirksWinners`-Signatur und bestehende Response-Shapes für kiez/bezirk unverändert.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default-Ansicht | `/berlin-wahlen` ohne Params, AGH 2023 | Stimmbezirks-Choropleth (ah21-Geometrie), ~2.200 Flächen | N/A |
| Jahr-Wechsel mit Geo-Swap | AGH 2016 → 2021 | Geometrie wechselt ah16→ah21 per setData, Karte bleibt durchgehend sichtbar | N/A |
| Jahr ohne Stimmbezirke | BVV 2011 | Karte zeigt Bezirks-Ebene, Status-Zeile erklärt den Fallback, Toggle bleibt auf Stimmbezirk | N/A |
| API stimmbezirk ohne jahr | `ebene=stimmbezirk` ohne `jahr` | 400 (valibot) | N/A |
| Briefwahl-Rows | Wahl mit `istBriefwahlAggregat`-Rows | ausgefiltert, tauchen weder in Karte noch Tabelle auf | N/A |
| Adress-Treffer | Punkt in Berlin | zugehöriger Stimmbezirk hervorgehoben, uwbId benannt | Punkt ohne Feature → Hinweis |
| DB-los | `DATABASE_URL` fehlt | 200 mit leeren winners, Kapitel-Leerzustand wie gehabt | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/utils/wahl-portal-url-state.ts` + Test -- EBENE_VALUES/DEFAULT_EBENE/Labels erweitern; bestehende Default-Tests anpassen (Kaltstart-Erwartung kippt auf stimmbezirk).
- `src/routes/api/wahl/winners/+server.ts` + `server.test.ts` -- Stimmbezirks-Zweig (valibot-Variante mit Pflicht-`jahr`, `geoSlugForWahl`, `getStimmbezirksWinners`, Briefwahl-Filter); Query-Import `get-stimmbezirks-winners.ts` (unverändert).
- `src/lib/data/wahl-geo-mapping.ts` -- `wahlSlugFromTypJahr`, `geoSlugForWahl`, `dbUwbIdFromGeo` (Story-1-Konsolidierung, fertig; nur konsumieren).
- `src/lib/components/wahl-portal/internal/winner-map-data.ts` + Test -- neu: `joinStimmbezirkWinners(fc, wahlSlug, winners)` (Join via dbUwbIdFromGeo, Name „Stimmbezirk <uwbId>"), `resolveAnzeigeEbene(gewuenscht, verfuegbarkeit)` (Fallback-Leiter pure), `aggregationHinweisText`-Erweiterung um 'stimmbezirk'.
- `src/lib/components/wahl-portal/winner-map.svelte` -- Stimmbezirks-Pfad: winners-Fetch mit `jahr` (Cache-Key inkl. jahr, Stale-Guard inkl. jahr), Geometrie-Cache per geo_slug, Anzeige-Ebene via Fallback-Leiter, Status-Zeile für Fallback; Adress-Suche: Point-in-Polygon auf geladener FC (Bestandsmuster `spatial-index`/Turf) statt `resolveSpatialLevel`, wenn Anzeige-Ebene stimmbezirk.
- `src/lib/components/wahl-portal/portal-steuerleiste.svelte` -- keine Struktur-Änderung (Werte kommen aus EBENE_VALUES); Test-Snapshots anpassen.
- `tests/e2e/berlin-wahlen.e2e.ts` -- Mocks: winners-stimmbezirk-Route (jahr-Param), echte `wahlbezirke-ah21`-Geometrie aus dem Build; Ebenen-Wechsel- und Geo-Swap-Assertions; bestehende Tests auf neue Default-Ebene nachziehen (Mock liefert je nach `ebene`-Param).
- `docs/wahldaten-methodik.md` -- Absatz Stimmbezirks-Ansicht.
- Nicht anfassen: `get-winners-bulk.ts`, Analytik/Zwilling, Alt-Choroplethen, Zeit-Animations-Vorbereitung.

## Tasks & Acceptance

**Execution:**
- [x] `wahl-portal-url-state` -- Default/Values/Labels + Tests zuerst (rot: Kaltstart-Default kippt)
- [x] `winner-map-data`: `resolveAnzeigeEbene` + `joinStimmbezirkWinners` + Hinweis-Text, test-first gegen Fixture-FC mit BTW- und AGH-Formaten (Kontrakt: identische uwbIds wie kiez-mapper-Fixtures)
- [x] `/api/wahl/winners` Stimmbezirks-Zweig + Routen-Tests (400 ohne jahr, DB-los leer, Briefwahl-Filter per Fixture nicht testbar ohne DB → defensiver With-DB-Block nach Haus-Muster)
- [x] `winner-map.svelte` Stimmbezirks-Pfad (Fetch/Caches/Stale-Guards/Fallback/Adress-PiP) + Component-Tests (Fallback-Hinweis, Stimmbezirks-Render mit Fixture)
- [x] Steuerleisten-/Skeleton-Tests nachziehen (neue Default-Ebene in bestehenden Erwartungen)
- [x] E2E: Default-Stimmbezirk-Render, Ebenen-Wechsel stimmbezirk↔kiez, Jahr-Wechsel mit Geo-Swap ohne Karten-Verlust
- [x] `docs/wahldaten-methodik.md` -- Stimmbezirks-Absatz

**Acceptance Criteria:**
- Given Kaltstart ohne Params mit AGH-Daten, when die Seite lädt, then rendert die Karte Stimmbezirke und die URL bleibt param-frei.
- Given AGH 2016↔2021↔2023, when das Jahr wechselt, then swappt die Geometrie (ah16/ah21) auf der bestehenden Instanz und `winner-map-canvas` bleibt durchgehend sichtbar (E2E).
- Given ein Jahr ohne Stimmbezirks-Daten, when es gewählt wird, then zeigt die Karte die Fallback-Ebene und die Status-Zeile benennt das; der Toggle-State bleibt stimmbezirk.
- Given `pnpm vitest run` (beide Projekte), `pnpm check`, `pnpm lint:wahl`, E2E gegen Build, then alles grün.

## Implementation Notes

**Fallback-Ladder-Verfügbarkeit ohne Extra-Fetch:** `resolveAnzeigeEbene` bekommt für stimmbezirk/kiez dieselbe Verfügbarkeit (`hasStimmbezirkGeo`, aus `geoSlugForWahl`), weil Kiez-Aggregat laut Methodik-Doku ohne Stimmbezirks-Geometrie ebenfalls leer ist -- kein separater Kiez-Bulk-Fetch nur zur Verfügbarkeits-Prüfung nötig. Vor dem ersten Auflösen von `jahr` (Wahl-Liste lädt noch) gilt `hasStimmbezirkGeo = true` (unbekannt statt Nein), sonst würde der Kaltstart kurz auf `bezirk` rutschen und einen unnötigen Bezirks-Bulk-Request auslösen, bevor die Wahl-Liste da ist (per E2E-Regression gefunden und gefixt).

**Stimmbezirks-Fetch/Geometrie/Adress-PiP** ausgelagert nach `internal/winner-map-stimmbezirk.svelte.ts` (Datei-Zeilenlimit, Muster `winner-map-maplibre.svelte.ts`).

**Test-Strategie:** pure Funktionen (`winner-map-data.ts`) test-first mit Fixtures im BTW- und AGH-uwbId-Format; API-Route mit DB-losem Block + defensivem With-DB-Block (Haus-Muster `series/server.test.ts`, grün auch ohne lokale Postgres-Daten, prüft die Matrix wenn Daten da sind); Component-Tests für Default-Stimmbezirk-Render und Fallback-Hinweis; 7 E2E-Szenarien gegen den echten Preview-Build (reale `wahlbezirke-ah16`/`wahlbezirke-ah21`-Geometrie, kein Mock).

**Bekannte Flakiness (nicht Teil dieser Story):** `winner-map.svelte.test.ts` Test „Adress-Auswahl außerhalb Berlins" ist zeitbasiert (400ms-Debounce-Wait) und flakt auch auf dem Baseline-Commit vor dieser Story (verifiziert). Nicht angefasst.

Nach Review fünf Patches (Triage-Log), von mir angewendet: der High-Fund
(stale wahlSlug im Geometrie-Cache bei geteiltem geoSlug) plus Loader-Tests,
Adress-Lade-Hinweis, Doku-Präzisierung, parent_slug-Assertion (dabei den
bekannten parent_election_id-Datenbug live bestätigt, Fix bleibt Story 15).

## Spec Change Log

## Review Triage Log

| # | Layer | Finding | Verdict | Route |
|---|-------|---------|---------|-------|
| 1 | verification-gap + edge | Geometrie-Cache friert den ersten wahlSlug pro geoSlug ein; Reihe-Wechsel AGH→BTW auf geteiltem ah21 joint mit falschem uwbId-Format → komplett neutrale Karte | high | **patch**: wahlSlug pro Aufruf (auch Cache-Hit), Join-Guard auf wahlSlug, Loader-Test belegt beide Formate |
| 2 | blind (4 Findings) + edge | Kiez-Sprosse der Fallback-Leiter mit heutigem Datenbestand tot (Kiez-Aggregat setzt dieselbe Geometrie voraus); Doku/Hinweis-Text versprachen mehr | medium | **patch**: Doku präzisiert (faktisch Bezirk-Fallback, Leiter zukunftssicher); pure Funktion + 'Kieze'-Text bleiben bewusst zukunftsfähig |
| 3 | blind | StimmbezirkLoader ohne eigene Tests (ADR-012 Cache-Logic) | medium | **patch**: neue Testdatei (5 Tests: wahlSlug-Refresh, Winners-Cache, malformed, PiP hit/miss inkl. Format-Wechsel) |
| 4 | blind | Adress-Suche vor geladener Geometrie meldet fälschlich „kein Gebiet in Berlin" | low | **patch**: eigener „Karte lädt noch"-Hinweis |
| 5 | blind | Repeat-Election-Zweig (parent_slug) im Stimmbezirks-Handler ungetestet | low | **patch**: With-DB-Assertion; dabei live den pre-existing parent_election_id-Bug getroffen → Präfix-Assertion mit Verweis auf Ingest-Story 15 |
| 6 | edge | resolveAnzeigeEbene erzwingt 'bezirk' auch bei bezirk:false | rejected | Vertrags-Garantie (Bezirk immer verfügbar), dokumentiert; Guard wäre tote Defensive |
| 7 | edge | Manuell gewähltes kiez ohne Daten bekommt keinen Fallback | rejected | Spec verlangt die Leiter nur für den stimmbezirk-Wunsch; Status-Zeile deckt den Fall |
| 8 | edge | totalGebiete könnte beim Geo-Swap stale sein | false | Der Takeaway nutzt totalGebiete nur mit nicht-leeren Rows, die den geoSlug/wahlSlug-Guard voraussetzen; stale Kombination unerreichbar |
| 9 | blind | Story-Datei nicht im Review-Diff | false | _bmad-output ist bewusst aus dem Review-Diff ausgenommen (Prozess-Artefakt, wird committet) |


## Design Notes

Stimmbezirks-Winners pro Jahr statt pro Reihe: Eine AGH-Reihe wären ~7.000 Rows in einem Response; pro Jahr sind es ~2.200, und die Zeit-Animation (Story 7) läuft ohnehin auf Kiez. Die Fallback-Leiter ist eine reine Anzeige-Entscheidung; der Nutzer-State bleibt unangetastet, damit ein Jahr-Wechsel zurück zu 2023 wieder Stimmbezirke zeigt.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm exec vite build` + Preview + `playwright test tests/e2e/berlin-wahlen.e2e.ts --config <temp>` -- expected: grün (Story-3/4-Muster)
