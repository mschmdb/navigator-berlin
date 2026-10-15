---
title: 'Geo-Mapping auf eine Quelle konsolidieren'
type: 'refactor'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'b3efbbcefa06fd171534664ba450ef0f29aca12d'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Wahl→Geometrie-Wissen (Wahl-Slug-Bildung, Wahl→Geo-Layer-Mapping, uwbId-Format-Konvertierung) existiert in bis zu sechs divergenten Kopien in Runtime, API-Routen, Komponente und Build-Skripten, fast ohne Tests. Jede neue Wahl (AGH/BVV 2026, nächste Woche) muss heute an allen Stellen nachgezogen werden.

**Approach:** `src/lib/data/wahl-geo-mapping.ts` wird die einzige Quelle (pure TS, keine `$lib`-Imports, damit Build-Skripte relativ importieren können). Alle Kopien delegieren dorthin. Kein Verhaltens-Change: bestehende Outputs bleiben identisch, nachgewiesen über die vorhandenen Tests plus neue Unit-Tests für das konsolidierte Modul.

## Boundaries & Constraints

**Always:**
- `wahl-geo-mapping.ts` bleibt reines TS ohne `$lib`/`$app`/`$env`-Imports (Vorbild `src/lib/data/internal/slug.ts`), damit `tsx`-Skripte es relativ importieren können.
- Verhalten bleibt exakt gleich: forward `dbUwbIdFromGeo` emittiert für AGH/BVV weiterhin OHNE `-W`-Suffix; reverse `candidateDbUwbIds` akzeptiert weiterhin beide Varianten.
- `scripts/wahlen/lib/kiez-mapper.test.ts` (14 Cases) bleibt als Kontrakt bestehen und muss grün bleiben.
- TDD: neue Modul-Tests zuerst (rot bei fehlendem Export), dann Umbau.

**Never:**
- Keine Änderung an API-Response-Shapes, Feldnamen oder Fehler-Codes.
- WebMCP-Module (`src/lib/webmcp/**`) nicht anfassen: die Architecture-Boundary `webmcp ↛ data` verbietet den Runtime-Import; der duplizierte Hint-String dort bleibt.
- `sbb-geo-sources.ts` behält Download-URLs, Lizenzen, Attribution (bleiben Script-Wissen).
- Kein Push, kein Deploy (Freeze bis 22.09. 02:00 CEST).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BTW25/21 forward | props `{BWK,BEZ,UWB3}`, wahlSlug `btw25` | `${BWK}-${BEZ}-${UWB3}-0` | fehlt BWK/BEZ → `null` |
| BTW17 forward | props, wahlSlug `btw17` | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0` | dito |
| AGH/BVV 16-23 forward | props `{BEZ,UWB3}`, wahlSlug `agh21` | `${BEZ}W${UWB3}` (ohne `-W`) | fehlt BEZ → `null` |
| Ohne Geometrie | wahlSlug `btw13`/`agh11` | forward `null`, `hasGeometry` false | N/A |
| Reverse-Lookup | props | Kandidatenliste inkl. `${BEZ}W${UWB3}-W` UND ohne `-W` | leere Liste bei fehlenden Props |
| UWB-Quellen | `UWB3` fehlt, `UWB`/`WB` 5-stellig | `pickUwb3` sliced auf 3 | `null` wenn nichts da |
| Jahr→Geo | 2025/2023/2021/2017/2016 | bt25/ah21/ah21/btw17/ah16 | unbekanntes Jahr → `null` |

</frozen-after-approval>

## Code Map

- `src/lib/data/wahl-geo-mapping.ts` -- wird die einzige Quelle; hat schon `WAHL_TO_GEO` (9 Einträge) + `wahlSlugFromTypJahr` (heute konsumentenlos). Neu dazu: `geoSlugForWahl`, `hasGeometry`, `geoSlugForYear`, `pickUwb3`, `dbUwbIdFromGeo(props, wahlSlug)`, `candidateDbUwbIds(props)`, `UWB_FORMAT_HINT`.
- `scripts/wahlen/lib/kiez-mapper.ts:25-66` -- Referenz-Implementierung von `dbUwbIdFromGeo`/`pickUwb3` (einziger Test!); delegiert künftig ans Modul. Toter `u.length === 3`-Zweig (Z. 61) entfällt durch Delegation. Doku-Tabelle Z. 13-24 behauptet `-W` fürs DB-Format AGH/BVV 21/23, Code liefert ohne: Kommentar korrigieren, Verhalten NICHT ändern.
- `scripts/wahlen/lib/sbb-geo-sources.ts` -- behält `GeoSource` (URLs/Lizenz); `consumesWahlen` wird aus dem Modul abgeleitet (`wahlenForGeo`) oder per Drift-Test verklammert; lokales `WAHL_TO_GEO` (Z. 84-86) re-exportiert das Modul.
- `src/routes/api/wahl/results-at-point/+server.ts:94-141` -- Kopien von (A)(B)(C) ersetzen; Achtung Z. 165/323: `wahlbezirks[geoSlug].uwbId` ist roher UWB3, so lassen.
- `src/routes/api/wahl/geometry/+server.ts:32-65,135` -- `geoSlugForYear`, `pickUwb3`, `candidateDbUwbIds`, Hint-String ersetzen.
- `src/routes/api/wahl/list/+server.ts:4-29` -- `GEO_AVAILABLE`-Set + fehlbenanntes `geoSlug()` ersetzen durch `hasGeometry(wahlSlugFromTypJahr(...))`.
- `src/lib/components/atlas/wahl-stimmbezirk-choropleth.svelte:35-63` -- lokale `pickUwb3`/`dbUwbIdFromGeo`-Closure ersetzen durch Modul-Import.
- `src/routes/(with-header)/wahl/[slug]/+page.server.ts:138-139` -- Inline-Slug-Bau durch `wahlSlugFromTypJahr` ersetzen.
- `src/lib/data/get-wahlbezirk-at-point.ts` + `.test.ts` -- toter Code mit abweichender sechster Variante: löschen (vorher import-Check).
- Nicht anfassen: `src/lib/webmcp/tools/wahl/get-voting-district-geometry.ts:35,47` (Boundary), `scripts/build-wahl-geometries.ts`, `scripts/build-wahl-kiez-aggregat.ts` (konsumieren nur weiter re-exportierte Symbole).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/wahl-geo-mapping.test.ts` -- neu, zuerst: alle 14 kiez-mapper-Cases gegen das Modul, plus Matrix-Fälle (reverse inkl. `-W`, `geoSlugForYear`-Parität zu `WAHL_TO_GEO`, `hasGeometry`) -- rot vor Implementierung
- [x] `src/lib/data/wahl-geo-mapping.ts` -- Modul-Erweiterung um (A)(B)(C)-Funktionen + Hint-String -- Test grün
- [x] `scripts/wahlen/lib/kiez-mapper.ts` -- auf Modul delegieren, Doku-Tabelle korrigiert -- kiez-mapper.test.ts bleibt grün
- [x] `scripts/wahlen/lib/sbb-geo-sources.ts` -- Mapping abgeleitet + re-exportiert (`wahlenForGeo`) -- eine Wahrheit
- [x] `src/routes/api/wahl/results-at-point/+server.ts`, `api/wahl/geometry/+server.ts`, `api/wahl/list/+server.ts` -- lokale Kopien durch Modul-Imports ersetzt -- Responses unverändert
- [x] `src/lib/components/atlas/wahl-stimmbezirk-choropleth.svelte`, `src/routes/(with-header)/wahl/[slug]/+page.server.ts` -- Modul-Imports -- Winner-Zuordnung unverändert
- [x] `src/lib/data/get-wahlbezirk-at-point.ts` + Test -- gelöscht nach Import-Check -- toter Code weg

**Acceptance Criteria:**
- Given die 20 Bestands-Wahlen, when `wahlSlugFromTypJahr`+`geoSlugForWahl` über alle laufen, then entsprechen die Paare exakt dem bisherigen `WAHL_TO_GEO` (9 mit Geometrie, Rest `null`).
- Given ein Grep nach `pickUwb3|dbUwbIdFromGeo|WAHL_TO_GEO|GEO_AVAILABLE|geoSlugForYear` über `src/` und `scripts/`, when die Story fertig ist, then existiert jede Logik genau einmal (Modul) plus Delegationen/Re-Exports; keine Inline-Kopie mehr.
- Given `pnpm vitest run --project server`, when alle Tests laufen, then grün, inkl. unverändertem `kiez-mapper.test.ts`.

## Implementation Notes

`src/lib/data/wahl-geo-mapping.ts` trägt jetzt alle sieben neuen Exporte: `geoSlugForWahl`,
`hasGeometry`, `wahlenForGeo`, `geoSlugForYear`, `pickUwb3`, `dbUwbIdFromGeo`,
`candidateDbUwbIds`, plus `UWB_FORMAT_HINT` und den `GeoUwbProps`-Typ.

- `scripts/wahlen/lib/kiez-mapper.ts` importiert `dbUwbIdFromGeo` + `GeoUwbProps` aus dem
  Modul und re-exportiert beide (`export { dbUwbIdFromGeo }` / `export type { GeoUwbProps }`),
  damit `kiez-mapper.test.ts` unverändert bleibt. Die Doku-Tabelle für AGH/BVV 21/23 ist
  korrigiert: Code liefert ohne `-W`-Suffix, DB kann mit Suffix gespeichert sein, der
  Reverse-Lookup in der geometry-Route deckt beide Varianten ab.
- `scripts/wahlen/lib/sbb-geo-sources.ts` re-exportiert `WAHL_TO_GEO` aus dem Modul und
  leitet `consumesWahlen` pro `GeoSource` über `wahlenForGeo(slug)` ab, statt vier
  handgepflegte Arrays zu halten. Reihenfolge der Einträge in `consumesWahlen` hat sich
  dadurch minimal geändert (Map-Insertion-Order statt Handreihenfolge); es gibt im Repo
  keine Konsumenten, die auf dieser Reihenfolge basieren (nur `WAHL_TO_GEO` selbst wurde
  daraus gebaut, das entfällt jetzt).
- `geoSlugForYear` ist über `WAHL_TO_GEO` implementiert (erster Treffer nach
  Einfüge-Reihenfolge, Suffix-Match auf die letzten zwei Jahres-Ziffern) statt einer
  eigenen if-Kette; verhält sich für alle fünf Bestandsjahre (2016/2017/2021/2023/2025)
  identisch zur alten Implementierung, inkl. `null` für alle anderen Jahre.
- `results-at-point/+server.ts`: lokale `dbUwbIdFromGeoForWahl`, `pickUwb3`, `wahlSlugFor`
  und die lokale `WAHL_TO_GEO`-Record-Kopie entfernt, durch Modul-Imports ersetzt. Die
  Stelle, an der `pickUwb3(props) ?? ''` den rohen UWB3 statt der vollen dbUwbId liefert
  (Zeile ~122, ehemals 165), ist unverändert stehen geblieben (Spec-Vorgabe).
- `geometry/+server.ts`: lokale `geoSlugForYear`, `pickUwb3`, `candidateDbUwbIds` sowie
  der inline Hint-String entfernt, durch Modul-Imports inkl. `UWB_FORMAT_HINT` ersetzt.
- `list/+server.ts`: `GEO_AVAILABLE`-Set + fehlbenanntes lokales `geoSlug()` entfernt,
  durch `hasGeometry(wahlSlugFromTypJahr(w.typ, w.jahr))` ersetzt.
- `wahl-stimmbezirk-choropleth.svelte`: lokale `pickUwb3`/`dbUwbIdFromGeo`-Closures
  entfernt; Aufruf übergibt jetzt `wahlSlug` explizit als zweites Argument statt es aus
  einer Closure über die Component-Props zu lesen.
- `+page.server.ts` (Wahl-Detailseite): inline `${typ}${jj}`-Slug-Bau durch
  `wahlSlugFromTypJahr(match.typ, match.jahr)` ersetzt; `WAHL_TO_GEO.get(...)` blieb
  unverändert (bereits Modul-Import).
- `src/lib/data/get-wahlbezirk-at-point.ts` + `.test.ts` gelöscht, nachdem ein Grep
  bestätigt hat, dass nur die eigene Testdatei importierte. Die genutzten Shared-Helper
  (`manifest.js`, `internal/layer-fetch.js`, `internal/spatial-index.js`) werden von
  anderen, weiterhin bestehenden Modulen benutzt und blieben unangetastet.
- WebMCP (`src/lib/webmcp/tools/wahl/get-voting-district-geometry.ts`) und die beiden
  Build-Skripte (`scripts/build-wahl-geometries.ts`, `scripts/build-wahl-kiez-aggregat.ts`)
  wurden wie in den Boundaries gefordert nicht angefasst; der WebMCP-Hint-String bleibt
  eine bewusste Dopplung.

Nach dem Review (Triage-Log unten) drei Patches angewendet: `geoSlugForYear`
vergleicht jahr-exakt (Volljahr 2000+jj) statt per Suffix-Match, Out-of-Range-
Jahre liefern wieder `null` (plus 4 neue Testfälle); zwei JSDoc-Präzisierungen
zu `-W`-Suffix-Abdeckung und bedingungslosem Reverse-Kandidaten.

## Spec Change Log

## Review Triage Log

| # | Layer | Finding | Verdict | Evidenz / Route |
|---|-------|---------|---------|-----------------|
| 1 | edge-case (2 Findings) + blind-hunter | `geoSlugForYear` matcht per Jahres-Suffix statt exakter Jahre; 1925/2125/-2025 lösen neu auf `bt25`/`ah21` auf statt `null` | medium | Verifiziert: Route prüft nur `Number.isFinite` (geometry/+server.ts:47), Suffix-Match ändert Output für Out-of-Range-Jahre; verletzt „Kein Verhaltens-Change". → **patch** (jahr-exakte Auflösung + Tests 1925/2125) |
| 2 | blind-hunter | Kommentar an `dbUwbIdFromGeo` überverspricht `-W`-Abdeckung („Reverse-Lookup deckt beide ab" gilt nur für die geometry-Route, nicht für Forward-Aufrufer) | low | Verifiziert: `candidateDbUwbIds` wird nur in geometry/+server.ts verwendet; Prod-Winner-Matching funktioniert forward, also speichert die DB ohne `-W`; Kommentar trotzdem unpräzise. → **patch** (Kommentar präzisieren) |
| 3 | blind-hunter | `candidateDbUwbIds` hängt `-W`-Kandidat bedingungslos an (auch für 16er) ohne erklärenden Satz | low | Verhalten identisch zum Alt-Code; reine Doku-Lücke. → **patch** (Ein-Satz-Kommentar) |
| 4 | blind-hunter | Löschung von `get-wahlbezirk-at-point.ts` sei unerklärter Scope-Creep | false | Die Löschung ist expliziter Spec-Task (Code Map + Task 7) mit Import-Check; kein unerklärter Drop. |
| 5 | blind-hunter | Test-Parität der 14 Cases nur per Kommentar, Suiten könnten driften | false | Beide Suiten testen via Re-Export DIESELBE Implementierung; es existiert keine zweite Implementierung mehr, die driften könnte. |
| 6 | blind-hunter | Keine API-Routen-Tests für geometry/results-at-point trotz ADR-012 | medium (pre-existing) | Lücke bestand vor der Story; Intent ist verhaltensgleiche Konsolidierung mit Modul-Tests (frozen). → **defer** |
| 7 | blind-hunter | Kein Komponenten-Test für `wahl-stimmbezirk-choropleth.svelte` | medium (pre-existing) | Lücke bestand vor der Story; Story 4 baut die Winner-Map ohnehin neu mit Tests. → **defer** |
| 8 | blind-hunter | kiez-mapper-JSDoc verlor die „Geo-Build-Rule"-Spalte | false | Die entfernte Spalte enthielt für alle mappbaren Zeilen identische Strings wie „DB-Format"; keine Information verloren. |
| 9 | verification-gap | Keine Gaps; alle Delegationen byte-identisch, 2680 Tests grün | — | Kein Finding. |

## Design Notes

Modell-Richtung: `WAHL_TO_GEO` (wahl→geo) bleibt kanonisch, `consumesWahlen` wird zur Ableitung. `geoSlugForYear` bleibt als API-Kompatibilitäts-Helfer (geometry-Route kennt nur `year`), implementiert über die kanonische Map; der Kommentar dokumentiert, dass er bricht, sobald ein Jahr zwei Geometrien hat.

## Verification

**Commands:**
- `pnpm vitest run --project server` -- expected: alle Tests grün, inkl. neuer wahl-geo-mapping-Tests und unverändertem kiez-mapper.test.ts
  → **Ergebnis: 275 Test-Dateien, 2561 Tests, alle grün** (inkl. 43 neuer Tests in
  `wahl-geo-mapping.test.ts` und weiterhin 15/15 grün in `kiez-mapper.test.ts`).
- `pnpm check` -- expected: 0 Errors
  → **Ergebnis: 6380 Files, 0 Errors, 0 Warnings.**
- `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Errors, keine neuen Warnings
  → **Ergebnis: 2 Errors in `wahl-stimmbezirk-choropleth.svelte`** (`Map` statt
  `SvelteMap`, unused `matched`-Var). Gegen Baseline-Commit `b3efbbc` geprüft: beide
  Findings existierten dort unverändert auf denselben Zeilen -- vorbestehend, nicht
  durch diese Story eingeführt. Alle anderen geänderten Dateien: 0 Errors, 0 Warnings.
- `grep -rn "pickUwb3\|dbUwbIdFromGeo\|WAHL_TO_GEO\|GEO_AVAILABLE\|geoSlugForYear" src scripts --include='*.ts' --include='*.svelte' | grep -v wahl-geo-mapping`
  → **Ergebnis: nur noch Delegations-/Import-/Re-Export-Stellen** (kiez-mapper.ts,
  sbb-geo-sources.ts, die drei API-Routen, die Choropleth-Komponente,
  build-wahl-kiez-aggregat.ts) plus kiez-mapper.test.ts. `GEO_AVAILABLE` kommt in keiner
  Datei mehr vor. Der WebMCP-Hint-String (nicht Teil des Grep-Patterns) blieb bewusst
  unangetastet.
