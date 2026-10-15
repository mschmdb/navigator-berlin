---
title: 'S4: Dataset-JSON-LD vollständig für Google Dataset Search'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'ae9d17098b1f057e5836cd489d5652dc4720d459'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/seo-investigation-s2-s5.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 58 Layer-Seiten, die Wahl-Detailseiten, die Score-Seite und `/hitze` geben `Dataset`-JSON-LD aus, dem für die Google Dataset Search wichtige Angaben fehlen: `url`, `spatialCoverage`, `temporalCoverage`, `isAccessibleForFree`, `includedInDataCatalog`, eine Herausgeber-URL. `contentUrl` zeigt auf eine Datei mit Hash im Namen, die sich bei jedem Daten-Update ändert. Wahl-Datasets setzen `dateModified` auf den 1. Januar des Wahljahrs, obwohl der echte Datenstand vorliegt.

**Approach:** Den Dataset-Builder um die fehlenden Felder erweitern und alle Aufrufer mit vorhandenen Daten füttern. Eine stabile Download-Adresse je Layer (`/daten/<slug>.geojson`, leitet auf die aktuelle Hash-Datei weiter). `DataCatalog` bekommt eine `@id`, auf die Datasets verweisen.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- `url` = Canonical der jeweiligen Seite (absolut, `localizedPathname`).
- `spatialCoverage`: `Place` „Berlin“ mit `geo` als `GeoShape box` aus der Bounding Box der Bezirksgrenzen (beim Build berechnet, nicht hart codiert).
- `temporalCoverage`: nur wenn ableitbar: `sourceUpdatedAt`-Jahr oder Jahres-Suffix im Slug (`laerm-2023` → `2023`), Wahl = Wahljahr; sonst weglassen.
- `creator`: Name der Behörde wie bisher, `url` = Origin der `sourceUrl` aus dem MANIFEST (keine erfundenen Behörden-URLs).
- `isAccessibleForFree: true`; `includedInDataCatalog: {"@id": "https://navigator.berlin/lizenzen#catalog"}`; Katalog auf `/lizenzen` mit dieser `@id`.
- Stabile URL `/daten/<slug>.geojson`: Server-Route mit 302 auf `/layers/<hash-datei>`, unbekannter Slug 404; nicht unter `/api/`.

## Boundaries & Constraints

**Always:** Werte nur aus vorhandenen Quellen (MANIFEST, Layer-Methodik, Wahl-Daten). Felder weglassen statt raten. Tests zuerst. Bestehende `@id` der Datasets (`/layer/<slug>`) bleiben.

**Never:** Keine Änderung an WebSite/Organization/Place (S3), Sitemap (S5). Keine Kopie der GeoJSON-Dateien.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Layer mit Jahr | `/layer/laerm-2023` | `temporalCoverage` „2023“, `url`, `spatialCoverage`, `isAccessibleForFree`, `includedInDataCatalog`, `distribution.contentUrl` `/daten/laerm-2023.geojson` | N/A |
| Layer ohne Jahr | `/layer/kultur-museum` ohne `sourceUpdatedAt` | kein `temporalCoverage` | N/A |
| Wahl | `/berlin-wahlen/2026-agh-zweitstimme` | `dateModified` = `sourceUpdatedAt`, `temporalCoverage` „2026“ | fehlt `sourceUpdatedAt` → bisheriges Verhalten |
| Download | `GET /daten/laerm-2023.geojson` | 302 auf aktuelle Hash-Datei | unbekannt → 404 |
| Katalog | `/lizenzen` | `DataCatalog` mit `@id` `…/lizenzen#catalog` | N/A |

</frozen-after-approval>

## Code Map

Siehe `seo-investigation-s2-s5.md`, Abschnitt S4: `src/lib/seo/jsonld-dataset.ts:64-92`; Aufrufer `layer/[slug]/+page.svelte:103-116`, `berlin-wahlen/[slug]/+page.svelte:70-87`, `umwelt-infrastruktur-score/+page.svelte:29-41`, `hitze/+page.svelte`; MANIFEST-Typ `src/lib/data/types.ts:26-52`; `jsonld-datacatalog.ts:86-115`, `lizenzen/+page.svelte:74`, `berlin-wahlen/+page.svelte:205`; `server.js:29-31` (Cache `/layers/`). Absolute URLs über `localizedPathname`.

## Tasks & Acceptance

**Execution:**
- [x] `jsonld-dataset.ts` + Test -- neue Felder, Weglassen bei fehlenden Daten.
- [x] Helfer für `temporalCoverage` und Berlin-Bounding-Box + Tests.
- [x] Route `/daten/[file]` + Test (302, 404, kein Prerender).
- [x] Aufrufer (Layer, Wahl, Score, Hitze) + bestehende Tests.
- [x] `jsonld-datacatalog.ts` `@id` + Test.
- [x] E2E: Layer-Seite enthält die neuen Felder; Download-Route leitet weiter.

**Acceptance Criteria:**
- Given eine Layer-Seite, when man das Dataset-JSON-LD liest, then enthält es `url`, `spatialCoverage`, `isAccessibleForFree`, `includedInDataCatalog` und eine stabile `contentUrl`.

## Implementation Notes

- `buildDataset` ergänzt `@id` (`<url>#dataset`), `url`, `isAccessibleForFree`, `spatialCoverage` (`Place` Berlin, `GeoShape box`), `temporalCoverage` (nur Slug-Jahr oder explizites Jahr), `includedInDataCatalog` (`@type`, `@id`, `name`, `url`).
- Bounding Box: `pnpm data:berlin-bbox` erzeugt `src/lib/data/berlin-bbox.generated.ts` aus den Bezirksgrenzen; Drift-Test in `berlin-bbox.test.ts`. Kein Laufzeit-Zugriff auf `static/` (fehlt im Docker-Image).
- Route `/daten/[file]`: 302 auf die Hash-Datei unter `/layers/` (`no-cache`), unbekannt 404, Manifest-Fehler 503 (`no-store`); bewusst nicht in der Sitemap.
- Hitze: Dataset aus MANIFEST (`kuehle-orte`), `creator` = Methodik-Authority wie auf der Layer-Seite, `creatorUrl` = Origin der `sourceUrl`. Fehlt der MANIFEST-Eintrag, entfällt das Dataset-JSON-LD.
- Nach Review: Build brach an `export const` in `hitze/+page.server.ts` ab (nur SvelteKit-Exporte erlaubt), Export entfernt. E2E-Erwartung an `includedInDataCatalog` auf den vollen Verweis angepasst.
- Verifikation: Unit 5.923 grün (inkl. `scripts`, DB-Rangtabellen vorher neu befüllt), `pnpm check` 0, Build ohne Fehler, E2E 184/184.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge | Bbox zur Laufzeit aus `static/` gelesen (fehlt im Docker-Image), Fehlschlag gecacht | high | patch (Build-Zeit-Konstante mit Drift-Test) |
| Blind | `temporalCoverage` aus `sourceUpdatedAt` | medium | patch |
| Blind | `includedInDataCatalog` nackte `@id`, Dataset ohne `@id` | medium | patch |
| Blind | Hitze: `dateModified` hart codiert, `contentUrl` = Seite, kein `creatorUrl` | medium | patch |
| Blind, Edge | `/daten`-Route: Manifest-Fehler → 500, Redirect-Cache 300 s, Ausschluss undokumentiert | low | patch |
| VerifGap | Wahl/Hitze/UIS-Dataset-Felder ungetestet | medium | patch |
| Blind | JSDoc verrutscht, `?? undefined`, sequentielles Laden | low | patch (entfällt mit Konstante) |
| Blind | Import-Zeile unformatiert | low | patch |

## Verification

**Commands:**
- `pnpm exec vitest run src` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat (Log ohne `[500]`/`Cannot access`), Preview 4173, Playwright mit temporärer Config; `static/kiez-scores/region-composites.json` zurücksetzen -- expected: grün
