# Technische Notizen /berlin-wahlen

Destillat des Bestands-Inventars vom 19.09.2026. Pfade relativ zum Repo-Root.

## Datenbestand

- Postgres via Drizzle, Build-Zeit-Aggregat-Cache (ADR-013). 14 Wahlen / 23 `wahl`-Rows: BTW 2013/2017/2021/2025, AGH+BVV 2011/2016/2021/2023/2026 (2023 = Wiederholungswahl, `parent_election_id`; 2026 = `vorlaeufig: true` bis Endergebnis-Re-Ingest). Schema: `src/lib/server/db/schema/wahl/`.
- Ebenen: `stimmbezirk` → `kiez` (143 BZR) → `bezirk` (12) → `berlin`. Kiez/Stimmbezirk erst ab 2016 (AGH/BVV) bzw. 2017 (BTW).
- Geometrien: `static/layers/wahlbezirke-*.geojson`; `WAHL_TO_GEO` in `src/lib/data/wahl-geo-mapping.ts`; ah23 nutzt ah21-Polygone.
- Wahlbeteiligung/Wahlberechtigte/Ungültige: vom Transformer gelesen (`scripts/wahlen/lib/sbb-row-transformer.ts:10-12`), NICHT persistiert → CAP-15 braucht Migration + Loader-Erweiterung + Re-Ingest.
- Kein `partei_id`-Index außerhalb der PKs; bei neuen `WHERE partei_id`-Queries Index erwägen.

## Bestehende Bausteine (wiederverwenden, nicht neu bauen)

- Queries: `src/lib/server/db/queries/wahl/` (`get-wahl-list`, `get-results-for-*`, `get-sparkline-for-kiez`, `get-stimmbezirks-winners`, `get-kiez-shares-for-wahl`). Alle mit DB-losem Fallback (leere Liste).
- APIs: `/api/wahl/list`, `/api/wahl/results-at-point`, `/api/wahl/geometry`, `/api/wahl/kiez-shares`.
- UI: `wahl-section.svelte` (ARIA-Muster, Caveats), `wahl-stimmbezirk-choropleth.svelte` (Winner-Farb-Backen + Opacity-Expression), `wahl-bezirk-choropleth.svelte`, `home-wahl-teaser.svelte`, `/berlin-wahlen/[slug]`-Seite.
- Finder-Engine-Muster für GPU-Live-Umfärbung: `internal/kiez-finder-engine.ts` (`fitColorExpression`, JS-Zwilling, `NEUTRAL_METRIC`, `rankNormalize`), Daten-Bau `internal/kiez-finder-data.ts` (`buildParteiMetric`).
- Partei-Farben: `src/lib/data/partei-farben.ts` (einzige Render-Quelle, Patterns, `wcagAaPasses`).
- WebMCP: Tools rufen ausschließlich HTTP-APIs (`src/lib/webmcp/mount.ts` Composition-Root); Manifest via `scripts/build-webmcp-manifest.ts`.

## Neu zu bauen (Daten-Fundament)

1. Zeitreihen-Queries: Anteile pro Partei über alle Wahlen einer Reihe je Kiez/Bezirk/Berlin (heute nur Kiez-Sparkline).
2. Bulk-Winners-API: stärkste Partei je Gebiet für ALLE Jahre einer Reihe in einem Response (Zeit-Animation; heute nur SSR-Load pro Wahl).
3. Ähnlichkeits-Query für den politischen Zwilling (Partei-Anteils-Vektor, Kiez-Ebene).
4. Wechsel-/Trend-/Volatilitäts-Berechnung: bevorzugt Build-Zeit-Aggregat (ADR-013-Muster) statt Runtime-SQL.

## Geo-Mapping-Konsolidierung (Vorstory, Pflicht)

Mapping Wahl→Geometrie existiert 6-fach: `src/lib/data/wahl-geo-mapping.ts`, `scripts/wahlen/lib/sbb-geo-sources.ts:84-86`, `api/wahl/results-at-point/+server.ts:131-141`, `api/wahl/geometry/+server.ts:32-39`, `api/wahl/list/+server.ts:4-14`, `wahl-stimmbezirk-choropleth.svelte:46-63`. Auf EINE Quelle konsolidieren (Runtime-Modul, von Build-Skripten importierbar), sonst bricht „2026 ohne Umbau".

## Ingest AGH/BVV 2026 (erledigt 23.09.2026, Story 15)

Abweichung vom ursprünglichen Plan: Die Wahl lief tatsächlich am 20.09.2026
(nicht "nächste Woche"), und die Landeswahlleiterin liefert den
Wahlbezirks-Datenexport über `wahlen-berlin.de` (neues `wb-csv`-Format,
DSB-Legende + CSV), nicht über die SBB-XLSX-Pipeline wie 2011-2023. Details:
`docs/wahldaten-methodik.md` ("Wahlbezirks-Datenexport-Pipeline (wb-csv)").

1. ✅ `scripts/wahlen/lib/sources.ts`: `agh26`/`bvv26` als `kind: 'wb-csv'`, `vorlaeufig: true`. Download-URLs stabil (kein Hash), Geometrie-Hash-URL per Playwright-Recon.
2. ✅ Gate `scripts/check-wahl-data.ts`: `MIN_WAHLEN` 20→23, `MIN_WAHLEN_WITH_KIEZ_AGGREGAT` 15→18.
3. ✅ `scripts/wahlen/lib/wb-csv-parser.ts` löst DSB-Legende statt Drift-Snapshot; `assertPartySumMatchesGueltig` als Plausi-Ersatz.
4. ✅ Neue Parteien: keine -- Top-6 (Linke/CDU/AfD/GRÜNE/SPD/BSW) decken sich mit `FINDER_PARTIES`; Legenden-Langnamen als Alias in `partei-seed.ts` ergänzt.
5. ✅ Geo: `GEO_AH26` in `sbb-geo-sources.ts`, `dbUwbIdFromGeo` generisch (Jahrgang ≥16 statt Enumeration).
6. ✅ Doku, Fallback-Liste, Home-Teaser (2026er-Slugs) fortgeschrieben. OG-Images (`pnpm og:images --type=wahl`) und `list_elections`-Description-Zahl: noch offen, siehe Dev-Report.
7. ✅ `data:rank`/`data:comparison` unberührt (Boundary, nicht angefasst).
8. ✅ `parent_election_id`-Bug (agh23-Zweitstimme zeigte auf agh21-Erststimme) behoben: `parent-lookup.ts` filtert jetzt nach `stimmtyp`.
9. ✅ Vorläufig-Kennzeichnung (Matze-Entscheidung 23.09., 1B): `wahl.vorlaeufig` + `wahl.sourceUpdatedAt` (aus CSV `Datum`/`Zeit`, DST-korrekt `Europe/Berlin`), Badge in `/berlin-wahlen/[slug]`, `/berlin-wahlen` (`ergebnis-panel.svelte`), Inspector-Wahl-Sektion, `/api/wahl/list`, `list_elections`/`compare_elections`/`get_election_result`, LLM-Export (`llm-export-builder.ts`, `llms-full.txt`).
10. ⏳ Re-Ingest beim Endergebnis ist NICHT automatisch: `vorlaeufig`-Flag in `sources.ts` bleibt `true`, bis er von Hand entfernt wird, und das prebuild-Gate überspringt den Ingest sonst (23/18 bereits erfüllt). Checkliste: `docs/wahldaten-methodik.md` ("AGH/BVV 2026 (vorläufig)" → "Re-Ingest-Checkliste beim Endergebnis").

## Pflicht-Muster neues Portal (aus dem Bestand abgeleitet)

1. `docs/wahldaten-methodik.md` fortschreiben (Analytik-Methoden, ökologischer Fehlschluss, Zwilling-Metrik).
2. Section/Links in `/methodik`; Quelle+Lizenz in `/lizenzen` (Wahldaten-Section existiert).
3. `license` + `sourceUrl` in jeder neuen API- und Tool-Response.
4. Sitemap-Source + llms.txt (Konsistenz-Test `llms-sitemap-consistency.test.ts`); dabei Bestandslücke schließen: `/wahl`-Index und `/methodik/wahldaten` fehlen in `STATIC_PAGES_SOURCE`.
5. OG-Image für `/berlin-wahlen` (Satori-Pipeline `scripts/generate-og-images.ts`).
6. `lint:wahl`: neue Dateien in `TARGET_PATHS` (`scripts/lint-wahl-editorial.ts:7-13`) eintragen; prüfen, ob `lint:wahl` in die `lint`-Kette gehört.
7. Editorial-Bausteine: `editorial-disclaimer.svelte`, `data-stand-banner.svelte`, Caveat-Logik aus `get-election-result.ts:49-62`.

## Briefwahl-Gruppen (Story 17, erledigt)

Löst die Briefwahl-Lücke auf Stimmbezirks-/Kiez-Ebene (Zeile 8/10 oben
teilweise überholt): kleinste Kartenebene ist jetzt die Briefwahl-Gruppe
(Urnen-Stimmbezirke + ihr Briefwahlbezirk, Dissolve-Geometrie), Kiez-Aggregat
verteilt Briefstimmen anteilig nach Wahlberechtigten statt sie
auszuschließen. Löst nebenbei den CAP-15-Punkt aus Zeile 10: `wahlberechtigte`
ist jetzt Teil des `stimmbezirk`-Schemas und wird vom Loader persistiert.
Details: `docs/wahldaten-methodik.md` ("Briefwahl-Gruppen (Story 17)"),
Spec: `_bmad-output/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`.

## Bekannte Stolpersteine

- `get_election_result` liefert `updated_at` hart als `jahr-01-01` statt `wahl.source_updated_at` (`get-election-result.ts:121`); bei Tool-Arbeit mitfixen.
- Zwei Farbquellen (DB-Seed vs. `partei-farben.ts`): Entscheidung gefallen, nur `partei-farben.ts` rendern.
- `/berlin-wahlen/[slug]`-Detailseiten sind prerendered mit DB-losem Fallback über 20 Slugs; Portal-Prerender braucht dasselbe Muster.
- `layerchart` 227 KB gzip: nicht ins Portal-Initial-Bundle.
