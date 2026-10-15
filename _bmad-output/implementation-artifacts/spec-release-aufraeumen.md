---
title: 'Release-Aufräumen vor SEO-Deploy'
type: 'chore'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '22b5c25'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

<frozen-after-approval reason="human-owned intent, do not modify unless human renegotiates">

## Intent

**Problem:** `deferred-work.md` enthält kleine, sichtbare Fehler, die vor dem Release des SEO-Epics behoben sein sollten: falsche Fakten in Texten, fehlende Sprachangabe im JSON-LD, Datumsanzeige ohne Zeitzone, doppelte Logik, toter Code, ein E2E-Test auf eine nicht existierende Route.

**Approach:** Acht kleine Korrekturen, je ein Commit-würdiger Schritt, ohne Produktentscheid.

**Entscheidungen (Matze 15.10.2026: „mach da mal ein bisschen sauber vor dem release & deploy“):**
1. `lizenzen_klima_p1` DE/EN: Stationen korrekt benennen (Code nutzt Dahlem 00403, Buch 00400, Tempelhof 00433, Schönefeld 00427 in Brandenburg), „vier Berliner Wetterstationen“ durch „vier Wetterstationen in und um Berlin“ o. ä. ersetzen.
2. `layer_explain_lor_bezirksregion_short` DE/EN: 143 statt 138 (GeoJSON hat 143 Features).
3. DataCatalog auf `/berlin-wahlen`: `inLanguage` aus der Seiten-Locale.
4. `formatMonthYear`: `timeZone: 'Europe/Berlin'`.
5. `sourceName`-Duplikate in `get-election-result.ts` und `llm-export-builder.ts` auf den geteilten Helper (Server-Import-Grenzen beachten).
6. `/methodik/kiez-score`: Build-Interna (`pnpm data:aggregate-scores`, Tabellennamen) aus Nutzertexten DE/EN entfernen, Inhalt sonst gleich.
7. Tote Komponenten `layer-level-card`, `inspector-level-toggle`, `charts/kiez-score-hero` samt eigenen Tests entfernen, wenn wirklich unbenutzt.
8. `a11y.e2e.ts`: Fall für die nicht existierende Route `/_dev/wortmarke` entfernen.

## Boundaries & Constraints

**Always:** Nur belegte Werte. Tests zuerst, wo Logik betroffen ist (3, 4, 5). Snapshots nur für die betroffenen Texte aktualisieren. Je erledigtem Punkt `resolved:` in `deferred-work.md`.

**Never:** Keine Änderung an Layer-„Stand“ (Entscheid offen), keine E2E-Combobox-Reparatur, keine Wahlportal-Themen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lizenzen | `/lizenzen`, `/en/lizenzen` | keine Station als „Berliner“, die in Brandenburg liegt | N/A |
| Wahlportal EN | `/en/berlin-wahlen` | DataCatalog `inLanguage` `en-US` | N/A |
| Monat | `2023-01-01` in TZ westlich UTC | „Januar 2023“ | N/A |
| Tote Komponenten | Import-Suche | keine Referenzen außer eigenen Tests | sonst behalten |

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] Punkte 1-8.

**Acceptance Criteria:**
- Given der Release-Build, when man die acht Punkte prüft, then ist jeder behoben oder begründet zurückgestellt.

## Implementation Notes

1. Klima-Text DE/EN: vier Stationen laut `get-climate-station.ts` (Dahlem, Tempelhof, Buch, Schönefeld), Formulierung „in und um Berlin“.
2. `layer_explain_lor_bezirksregion_short` DE/EN: 138 auf 143 (GeoJSON `lor-bezirksregion.*.geojson` hat 143 Features).
3. Wahlportal-DataCatalog: `inLanguage: localeToBcp47(getLocale())`; Absicherung per E2E in `dataset-jsonld.e2e.ts` (de-DE, en-US).
4. `formatMonthYear`: `timeZone: 'Europe/Berlin'`; Unit-Test setzt `TZ=America/Los_Angeles` (war rot, jetzt grün).
5. `sourceName` nach `$lib/data/wahl-source-name.ts` verschoben (`$lib/server/` ist im Client-Bundle gesperrt); alle Nutzer umgestellt, zwei Duplikate entfernt.
6. `/methodik/kiez-score`: Pipeline-Absatz ohne Befehl und Tabellennamen, keine Code-Spans mehr; Tests und DE-Snapshot angepasst.
7. Gelöscht: `layer-level-card`, `inspector-level-toggle`, `charts/kiez-score-hero` samt Tests; Hero-Block aus `kiez-score-ring.svelte.test.ts` entfernt, Kommentar in `radiogroup-keyboard.ts` bereinigt.
8. `a11y.e2e.ts`: Wortmarke-Fall entfernt.

Review-Patches (15.10.2026):
- OG-Skript `generate-og-images.ts` nutzt `sourceName` aus `$lib/data/wahl-source-name.ts` (Landeswahlleiterin Berlin wird jetzt erkannt); OG-Bilder nicht neu erzeugt.
- `address-search.e2e.ts`: Showcase-Test gelöscht, SiteHeader-Test läuft auf `/lizenzen` (Link-Name `navigator.berlin` im Banner); kein Test ruft mehr `/_dev/` auf.
- Weitere tote Module gelöscht: `aggregate-layer-for-level`, `charts/coverage-bar` (Test-Block aus `chart-primitives.svelte.test.ts` entfernt), `count-points-in-polygon`, je mit Tests. Neu verwaiste Module der ersten Ebene: keine (chart-scale, chart-palette, inspector-level-context, layer-aggregates-types, value-severity-mapping, kiez-score-ring, layer-hit-row, editorial-disclaimer haben weitere Nutzer).
- `home_data_source_dwd_climate_data_center_description` DE/EN auf "in und um Berlin"; keine weiteren Treffer für "Berliner Wetterstation".
- `formatMonthYear`: Docblock korrigiert, Test für `2024-12-31T23:30:00Z` (Januar 2025).
- Methodik-Text DE/EN umformuliert, Snapshot nachgezogen.
- Kommentare 138 auf 143 in `sources.ts` und `aggregate-to-larger-region.ts`; `docs/kriminalitaetsdaten-methodik.md` bleibt (beschreibt die Zählung der Kriminalitätsatlas-Datei, nicht LOR 2021). Testname in `get-climate-station.test.ts` angepasst.
- Wahlportal-DataCatalog: `url` und Dataset-`urlPath` über `localizedPathname`; der Katalog hat keine `@id`, daher nichts anzugleichen (Lizenzen-`@id` ist über `dataCatalogId` DE-canonical). E2E prüft den Pfad.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Edge, VerifGap | OG-Skript mit eigener Quellen-Logik ohne Landeswahlleiterin | medium | patch |
| VerifGap | `address-search.e2e.ts` ruft `/_dev/wortmarke` weiter auf | medium | patch |
| Edge, VerifGap, Blind | Nach Löschung verwaiste Module (`aggregate-layer-for-level`, `coverage-bar`, `count-points-in-polygon`) | low | patch |
| Edge, VerifGap | Startseite nennt weiter „Berliner Wetterstationen“ | low | patch |
| Edge | `/en/berlin-wahlen` DataCatalog-URL auf DE-Pfad | low | patch |
| Blind | Methodik-Satz missverständlich („bei jedem Lauf gleich“) | low | patch |
| Edge, VerifGap | Docblock `formatMonthYear` veraltet, Monatsgrenze ungetestet | low | patch |
| Edge | „138“ in Code-Kommentaren | low | patch; `docs/kriminalitaetsdaten-methodik.md` bleibt (beschreibt die Zählung der Krim-Atlas-Datei) |
| Blind | `inLanguage` `en-US` vs. britische Schreibweise | low | reject: projektweite Konvention `en-US` |
| VerifGap | `wahl-section.svelte` mappt Quellnamen selbst | low | reject: korrekt und getestet |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts`, `pnpm check`, `NAVIGATOR_STRICT_BUILD=1 pnpm build`, Preview, E2E-Suiten -- expected: grün
