---
title: 'Ingest AGH/BVV 2026'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/technical-notes.md'
  - '{project-root}/docs/wahldaten-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Portal endet bei 2023. Die AGH- und BVV-Wahl vom 20.09.2026 fehlt, und die AGH-Zweitstimme 2023 zeigt per `parent_election_id` auf die falsche 2021er-Row (Erststimme). Deshalb zählt die Analytik 2021→2023 dort als echten Wechsel.

**Approach:** Die Pipeline bekommt einen Parser für den Datenexport von wahlen-berlin.de (Wahlbezirks-CSV mit `P01..Pnn` + DSB-Legende). Dazu kommen die Quellen `agh26` und `bvv26` und die Geometrie `RBS_OD_UWB_AH26`. Heute läuft ein lokaler Ingest mit den vorläufigen Zahlen. Den Parent-Lookup korrigieren wir pro Stimmtyp. Die neue Wahl erscheint im Portal ohne Portal-Code-Änderung (SPEC-Erfolgskriterium).

## Boundaries & Constraints

**Always:**
- Matze 23.09.: heute nur lokal. Kein `git push`, kein Deploy, kein Ingest gegen Prod-DB.
- Partei-Zuordnung nur aus der amtlichen DSB-Datensatzbeschreibung, nie raten. AGH und BVV haben getrennte Legenden.
- Download-URLs nur per Recon belegt (Hash-URL der Geometrie per Playwright, `docs/wahldaten-methodik.md` Recon-Muster).
- TDD pro AC (ADR-012), Fixtures klein und inline oder unter `tests/fixtures/wahlen/`.
- Parteien unter 3 % bleiben `Sonstige` (Checkliste Punkt 4). Das betrifft Tierschutz 2,1 % und Volt.
- Entscheidung Matze 23.09. (1B): Vorläufige Zahlen gehen mit dem nächsten Deploy live. Sie tragen eine Kennzeichnung „vorläufig“ plus Stand-Datum in Portal, `/wahl/[slug]` und Tool-/API-Responses. WebMCP-Tool-Surface bleibt Englisch (`provisional`, `source_updated_at`). Beim Endergebnis ist ein Re-Ingest Pflicht, der die Kennzeichnung entfernt. Wir passen SPEC.md:72/86 entsprechend an.
- Entscheidung Matze 23.09. (2A): Der Home-Teaser verlinkt die 2026er-Wahlen.
- Entscheidung Matze 23.09. (3): Die Spec bleibt ungesplittet (ca. 2400 Tokens), weil Parser, Geo und Parent-Fix denselben Re-Ingest teilen.

**Never:**
- `buildAggregates`, Einstimme-Slot-Fix und Kiez-Slug-Disambiguierung nicht anfassen.
- Keine 2026er-Umrechnung älterer Wahlen (`DL_BE_AGH2026_AGH2023.xlsx`), kein Strukturdaten-Import.
- Keine Scores/Rank-Tabellen neu rechnen (`data:rank`/`data:comparison` unberührt).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| AGH-Zweitstimme | W-CSV, 4114 Zeilen, `WBezArt` W/B | 2542 Urnen- + 1572 Briefwahlbezirke, Parteien via Legende | N/A |
| BVV lokale Liste | P19 nur in Spandau > 0 | Stimmen landen bei `Sonstige`, andere Bezirke 0 | N/A |
| Unbesetzter P-Code | P10 in AGH (Legende leer) | Spalte ignoriert, Summe Parteien = `Gueltig` | Abweichung Summe ≠ Gueltig → Abbruch mit Zeilen-Adresse |
| Unbekannter P-Code | CSV hat Pxx ohne Legenden-Eintrag, Wert > 0 | kein stilles Sonstige | Fehler mit Code + Datei |
| Parent-Lookup | agh23 Zweitstimme | zeigt auf agh21 Zweitstimme | N/A |
| Vorläufig-Kennzeichnung | `agh26` mit `vorlaeufig: true`, Stand 21.09. 03:33 | Badge „vorläufig, Stand 21.09.2026“ an der Wahl; 2023er ohne Badge | N/A |
| Neue Wahl ohne Geo-Slug | `dbUwbIdFromGeo('ah26', …)` | liefert ID, nicht `null` | Test deckt das ab |

</frozen-after-approval>

## Code Map

- `scripts/wahlen/lib/sources.ts:4-22,147-187` -- `WahlSource`-Typ, `WAHL_SOURCES`. Neues `kind: 'wb-csv'` mit Pfad zur DSB-Legende.
- `scripts/lib/allowlist.ts:9-10` -- Host-Allowlist: `wahlen-berlin.de` fehlt.
- `scripts/aggregate-wahl-data.ts:195-265` -- `processSbbXlsx` als Muster für den `wb-csv`-Zweig. `lookupParentWahlId` ohne `stimmtyp`, einmal pro Quelle (`:205`) = Bug.
- `scripts/wahlen/lib/sbb-row-transformer.ts:59-146` -- UWB-ID (`Adresse` = `01W101`), Briefwahl-Erkennung, Einstimme-Slot. Diese Logik wiederverwenden, nicht duplizieren.
- `scripts/wahlen/lib/partei-seed.ts:12-98` -- `resolveParteiKurzname` auf die Legenden-Namen anwenden (`BÜNDNIS 90/DIE GRÜNEN`, `Die Linke`, BSW-Langname). Fehlende Aliase ergänzen.
- `src/lib/data/wahl-geo-mapping.ts:19-31,66,122-131` -- `WAHL_TO_GEO`, `geoSlugForYear`, `dbUwbIdFromGeo` (Slug-Liste hart, liefert sonst `null`).
- `scripts/wahlen/lib/sbb-geo-sources.ts:38-85` -- neue `GeoSource` `ah26`.
- `scripts/check-wahl-data.ts:24-27` -- `MIN_WAHLEN` 20→23, `MIN_WAHLEN_WITH_KIEZ_AGGREGAT` 15→18.
- `scripts/build-wahl-analytik.ts:~103` + `src/lib/server/wahl/analytik.ts:32` -- `mergeRepeatElections` greift nach dem Parent-Fix, keine Code-Änderung erwartet.
- `src/routes/(with-header)/wahl/[slug]/+page.server.ts:55-69` -- DB-lose Fallback-Slugs um die drei 2026er ergänzen.
- `docs/wahldaten-methodik.md:17-25,144-156` -- Slug-, Coverage- und Geometrie-Tabellen (Geometrie-Tabelle ist schon heute falsch: „ah23“).
- Drift-Check: gibt es nur im BWL-Pfad. Für `wb-csv` übernimmt die Header-Prüfung gegen die DSB-Legende diese Rolle (siehe Design Notes).
- `src/lib/server/db/schema/wahl/wahl.ts:23-24`, `scripts/wahlen/lib/db-loader.ts:75-91` -- `sourceUpdatedAt` existiert, wird nie gesetzt; neues Feld `vorlaeufig` (Migration 0009) plus Stand aus CSV-`Datum`/`Zeit`.
- `src/routes/api/wahl/list/+server.ts`, `src/lib/webmcp/tools/wahl/get-election-result.ts:121` -- `vorlaeufig` + `source_updated_at` ausgeben (Stolperstein `jahr-01-01` mitfixen).
- `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte`, `src/lib/components/atlas/editorial-disclaimer.svelte` -- bestehende Bausteine für die Kennzeichnung nutzen.
- `src/lib/components/home/home-wahl-teaser.svelte:17-36` -- `CARDS` auf 2026er-Slugs.
- Nicht ändern: `buildAggregates`, `kiez-mapper.ts`, Portal-Komponenten (datengetrieben über `/api/wahl/list`).

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/wahlen/lib/wb-csv-parser.ts` (+ `.test.ts`) -- parst DSB-Legende (cp1252) und W-CSV (UTF-8-BOM, `;`, Dezimalkomma) in SBB-kompatible Zeilen-Objekte -- ein Transformer statt zwei
- [ ] `scripts/wahlen/lib/sources.ts`, `scripts/lib/allowlist.ts` -- `agh26` (Erst/Zweit), `bvv26` als `wb-csv`, Host freigeben
- [ ] `scripts/wahlen/lib/parent-lookup.ts` (+ Test) -- `lookupParentWahlId` herausziehen, `stimmtyp` filtern, Aufruf pro Stimmtyp in `aggregate-wahl-data.ts`
- [ ] `scripts/aggregate-wahl-data.ts` -- `wb-csv`-Zweig; Plausi: Parteisumme = `Gueltig` je Zeile
- [ ] `partei-seed.ts` (+ Test) -- Aliase der 2026er-Legendennamen
- [ ] `sbb-geo-sources.ts`, `wahl-geo-mapping.ts` (+ Test) -- `ah26` per Recon-URL, `agh26/bvv26 → ah26`, `dbUwbIdFromGeo` generisch
- [ ] `wahl.ts` + `drizzle/migrations/0009_*`, `db-loader.ts`, `sources.ts` -- `vorlaeufig`-Flag und `sourceUpdatedAt` je Quelle setzen -- Kennzeichnung ohne Heuristik
- [ ] `api/wahl/list`, `get-election-result.ts`, Portal/`wahl/[slug]` via `data-stand-banner` (+ Tests) -- Badge „vorläufig, Stand …“, zugänglich (Text, nicht nur Farbe)
- [ ] `home-wahl-teaser.svelte` (+ Test) -- 2026er-Slugs
- [ ] `check-wahl-data.ts`, `wahl/[slug]/+page.server.ts`, `docs/wahldaten-methodik.md`, `technical-notes.md`, `SPEC.md` -- Gates, Fallbacks, Doku inkl. Vorläufig-Regel und Re-Ingest-Pflicht
- [ ] Lokaler Lauf: `data:wahl-fetch --only=agh23,agh26,bvv26`, `data:wahl-geo --only=ah26`, `data:wahl-kiez`, `data:wahl-analytik`, `data:wahl-check`

**Acceptance Criteria:**
- Given lokale DB, when die Pipeline läuft, then enthält `/api/wahl/list` `2026-agh-erststimme`, `2026-agh-zweitstimme` und `2026-bvv`, und das Berlin-Aggregat trifft die amtlichen Werte (Linke 25,7, CDU 18,8, AfD 16,3, Grüne 14,3, SPD 12,1, BSW 4,7 %; BVV Linke 24,1 %) auf 0,1 Punkte.
- Given `/berlin-wahlen` lokal, when 2026 gewählt ist, then zeigen Winner-Map (Stimmbezirk + Kiez), Zeit-Animation, Trends und Übergänge 2026 ohne Konsolen-Fehler.
- Given `agh26`/`bvv26` vorläufig, when Portal, `/wahl/2026-bvv` oder `get_election_result` sie zeigen, then steht dort „vorläufig“ mit Stand-Datum; bei 2023 nicht.
- Given der Parent-Fix, when `/api/wahl/list` gelesen wird, then hat `2023-agh-zweitstimme` `parent_slug = '2021-agh-zweitstimme'`.

## Design Notes

Der `wb-csv`-Parser mappt `P<nn>` über die Legende auf Parteinamen. Die Ausgabe hat die Spaltennamen, die `transformSbbRow` erwartet. Damit laufen UWB-ID, Briefwahl und Einstimme-Slot unverändert. Wichtig: `transformSbbRow` behandelt jede unbekannte Spalte als Partei. Der Parser gibt deshalb nur Identifier-Spalten und aufgelöste Parteispalten weiter, keine `…p`-Prozentspalten und keine Metaspalten (`StimmArt`, `Datum`, `Zeit`, `WberA1..3`).

## Verification

**Commands:**
- `pnpm test:unit -- --run scripts/wahlen src/lib/data/wahl-geo-mapping` -- expected: grün, neue Tests zuerst rot im Commit-Verlauf
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm data:wahl-check` -- expected: Gate grün mit 23 Wahlen / 18 mit Kiez

**Manual checks:**
- `/berlin-wahlen` lokal im Browser: 2026 wählbar, Karte gefüllt, Kiez-Tooltip plausibel.
