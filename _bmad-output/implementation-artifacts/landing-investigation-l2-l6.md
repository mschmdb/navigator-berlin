# Code-Inventur für L2-L6 (14.10.2026)

Grundlage für die Specs der Stories L2-L6 aus `../planning-artifacts/epic-landing-enhance.md`.

## Dateien und Größen
- Kiez-Route `src/routes/(with-header)/kiez/[slug]/+page.server.ts` (272 Zeilen), `+page.svelte` (163)
- Bezirk-Route `bezirk/[slug]/+page.server.ts` (192), `+page.svelte` (149)
- `src/lib/components/atlas/`: `kiez-hero.svelte` 355, `bezirk-hero.svelte` 275, `kiez-siblings-list.svelte` 37, `bezirk-kieze-list.svelte` 57, `score-comparison-table.svelte` 123, `score-rank-link.svelte` 43
- `src/lib/data/get-kieze-in-bezirk.ts` 103

## L2 Kiez-Hero
- `KiezPageData` (server.ts:85-97): `profile`, `stats` (`kiez_stats`, null ohne DB), `score` (composite + Dimensionen), `faq`, `siblings`, `wahlVerlauf`, `comparison: ComparisonDimRow[]` (value, bezirkMean, berlinMedian, rang, quartil, total), `compositeRank {rang,total}` (:253-257), `profileProse`. DB-Loader `tryLoad*` fallen auf null/[] zurück.
- `KiezProfile`/`BezirkProfile` (`src/lib/data/types.ts:102-124`) haben `centroid` und `geometry` (Polygon/MultiPolygon), heute nur für JSON-LD.
- Berlin-Umriss: nur serverseitig aus `static/layers/bezirke.*.geojson` (12, 112 KB) oder `lor-bezirksregion.*.geojson` (143). fs-Lesemuster in kiez server.ts:170-218 über `MANIFEST.json`.
- Kein SVG-Geometrie-Rendering vorhanden, kein d3-geo. Installiert: `@turf/area|bbox|boolean-point-in-polygon|center|distance|helpers|intersect`, `d3-scale`, `d3-array`. `@turf/bbox` + einfache äquirektanguläre Projektion (cos(lat)-Korrektur) reicht.
- Score-Block inline in `kiez-hero.svelte:252-278` (`text-5xl` + „/ 100“, `dl` mit `COMPOSITE_DIMENSIONS`), ohne Farbe, ohne Rang. Rang nur unten via `ScoreRankLink` (`m.score_rank_link_placed`).
- Farbe: `DIMENSION_RAMPS.gesamt` (`atlas/internal/dimension-ramps.ts:51-53`, `COLORS.scaleGut1-5`), Klassen 0/26/51/76 (`choropleth-family.ts:73`); `scaleFor`/`scaleForOverall`/`dimensionLabel` in `inspector-panel/internal/kiez-score-display.ts`.
- `formatRank` (`src/lib/data/rank-format.ts`): Quartil 4 nur „unteres Viertel“ (Anti-Stigma, ADR-015). Gilt auch für „Platz X von 143“.
- Stärkster Fakt: Kandidat `comparison` (value vs. berlinMedian) oder Layer-Aggregate.

## L3 Title/Meta
- Kiez `+page.svelte:46-66` (`m.kiez_page_title_with_bezirk`/`_no_bezirk`, `m.profile_page_description`, `kiez_page_description_bezirk_part`, `profile_lead_*`); Bezirk `+page.svelte:44-61` (`m.bezirk_page_title`). Keys in `messages/de.json` ~1141-1180, `en.json`.
- Ausgabe über `seo-head.svelte` (hreflang/canonical/noindex nicht anfassen). Kein Unit-Test für Title/Description; E2E `tests/e2e/i18n-profile-frame.e2e.ts`, `i18n-d1`, `i18n-routing`.
- Bezirksseite hat keinen Score in den Page-Daten, nur `compositeRank` und `comparison`.

## L4 Kennzahl-Kacheln
- `buildSteckbrief()` doppelt in `kiez-hero.svelte:97-194` und `bezirk-hero.svelte:83-~180`; Tabelle mit `<details>`. Quelle `kiez_stats` JSONB (`src/lib/server/db/schema/aggregate-types.ts`). Kein Berlin-Wert.
- DB-frei mit Berlin-Wert: `static/layer-aggregates/layer-aggregates.json` (`loadLayerAggregates`, Typen `layer-aggregates-types.ts`), je Layer `kiez[slug]`, `bezirk[slug]`, `berlin`: Bestandsmiete 7,66 (neutral), Altbau 39,49 % (neutral), `laerm-2023`/`luft-2023` ordinal, `gruenversorgung-2023` ordinal, `gruenanlagen` area-share, `klima-pet-2022` Median 36, außerdem `bioklima`, `milieuschutz-*`, `denkmal`, `mss`, `wohnlagen`.
- ÖPNV nur in `kiez_stats.oepnv.stopsPerKm2` (DB) + `kiez_rank` Metrik `stopsPerKm2`; kein Berlin-Median.
- Heutiger Vergleich: `ScoreComparisonTable` (nur Score-Dimensionen).

## L5 Bezirksseite
- Reihenfolge: Breadcrumb → `BezirkHero` (Lead, Prosa, Vergleich, Steckbrief, FAQ) → `BezirkKiezeList` → `ScoreRankLink`. FAQ steckt im Hero.
- `tryLoadKieze` (server.ts:80-144) lädt LOR + Composite via drizzle, `pickTop(all, 5)` (:138). `KiezRef {slug,name,composite|null}`, `sortKieze`.
- Bezirks-Rang via `getBezirkRank` (von 12). Kiez-Polygone des Bezirks müssen aus LOR geladen werden.

## L6 Geschwister
- `tryLoadSiblings` (kiez server.ts:170-218) ruft `buildKiezeInBezirk` mit leeren Scores, `pickSiblings(...,3)` alphabetisch. `KiezSiblingsList` zeigt nur Namen.
- Keine Nachbarschaftsdaten; `@turf/boolean-intersects|touches` nicht installiert. Ähnlichkeit nur über Wahl (`/api/wahl/similar-kieze`, DB).

## Tests und Testids
- Unit: `kiez-hero.svelte.test.ts`, `bezirk-hero.svelte.test.ts`, `kiez-siblings-list…`, `bezirk-kieze-list…`, `score-comparison-table…`, `score-rank-link…`, `get-kieze-in-bezirk{,.parity}.test.ts`, `src/lib/seo/sources/{kiez,bezirk}-pages.test.ts`, `jsonld-*`, `src/lib/server/og/*`.
- Testids erhalten: `kiez-hero`, `kiez-score`, `kiez-steckbrief`, `kiez-profile`, `bezirk-hero`, `bezirk-steckbrief`, `kiez-siblings-list`, `kiez-sibling-link`, `bezirk-kieze-list`, `bezirk-kieze-link`, `score-rank-link`, `score-comparison`, `kiez-*-jsonld`.

## Prerender
- Beide Routen `prerender = true`, entries aus `readKiezSlugsFromGeoJson()`/`readBezirkSlugsFromGeoJson()`. `prebuild` füllt DB-Tabellen (aggregate, rank, comparison, faq, og:images).

## Nicht ändern
`formatRank`-Anti-Stigma, `SCORE_DIMENSION_KEYS`, `tryLoad*`-Fallbacks, SeoHead-Logik, `buildKiezSlugs`, neutrale Aggregate nicht als gut/schlecht werten.
