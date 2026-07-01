# Story 15.2: Layer-Integration in die Pipeline (kind 'local' + MANIFEST + Lizenz)

Status: review

> **Anker:** ADR-012 (TDD), `CLAUDE.md` (DE-only, keine em-dashes, Files <500, kein `any`). Strukturell analog Story 14.0 / 13.0 (Layer-Foundation), aber **kein Remote-Fetch**: das Build-Output-GeoJSON aus Story 15.1 wird lokal von der Platte gelesen.
> **Hard-Dependency:** Story 15.1 muss das gemergte GeoJSON nach `static/data/kuehle-orte/kuehle-orte.geojson` geschrieben haben (Contract). Diese Story verdrahtet diese Datei in die Pipeline, erfindet keine Daten.
> **Owner-Decision (offen, Default in Dev Notes):** `bundleGroup` = `C: Umwelt` (Hitze-/Kühle-Thema, konsistent mit `trinkbrunnen`, `klima-pet-2022`), kein neuer Bundle-Schema-Eintrag.

## Story

As a Solo-Maintainer,
I want den `kuehle-orte`-Layer als First-Class-Bürger in der bestehenden Layer-Pipeline,
so that er gehasht, manifest-registriert und lizenzkonform wie jeder andere Layer ausgeliefert wird.

## Kontext: Warum dieser Change

Die bestehende Pipeline (`fetch-static.ts`) kennt drei Quell-Arten: `overpass`, `fis-broker`, `odis`. Alle drei holen über das Netz. Story 15.1 erzeugt das `kuehle-orte`-GeoJSON aber deterministisch lokal (Merge aus `enrichment.json` + `places-osm.json`). Es gibt keine Remote-URL zum Fetchen.

Diese Story fügt die vierte Art `kind: 'local'` hinzu: ein Fetcher liest die vorgebaute Datei von der Platte, der Rest der Pipeline (Reprojektion-No-op, Simplify `point`, Hash, MANIFEST-Eintrag) bleibt unverändert. Damit läuft `kuehle-orte` durch dieselbe Simplify-/Hash-/Manifest-Mechanik wie jeder andere Punkt-Layer.

Die Lizenz ist gemischt: OSM-Geometrie (ODbL 1.0, Attribution `openstreetmap.org/copyright`) plus die redaktionelle Anreicherung als eigenständiger Datensatz. Das MANIFEST trägt `license: 'ODbL 1.0'` für den geodatenbasierten Anteil; der redaktionelle Anteil wird als separater Datensatz in `docs/kuehle-orte-methodik.md` und über `editorial-config` (`disclaimerVariants: ['source']`) gekennzeichnet.

Frontend-Aktivierung (Inspector, Pin, Suche, URL-Deep-Link) hängt an drei Registrierungs-Maps plus dem bereits generischen URL-State-Sync.

## Acceptance Criteria

1. **AC-1 (kind 'local' + fetchSource):**
   **Given** `scripts/lib/sources.ts` mit den Arten `overpass|fis-broker|odis`
   **When** eine neue Art `kind: 'local'` plus ein `fetchSource()`-Pfad die vorgebaute GeoJSON liest
   **Then** lädt `fetch-static.ts` den `kuehle-orte`-Layer durch dieselbe Simplify-/Hash-/Manifest-Mechanik (Reprojektion No-op für bereits WGS84, `simplifyProfile: 'point'`, gehashter Dateiname)

2. **AC-2 (MANIFEST + Lizenz):**
   **Given** der MANIFEST-Eintrag
   **When** der Layer geschrieben wird
   **Then** enthält er `sourceUrl` (OSM-Attribution), `fetchedAt`, `sha256`, `license: 'ODbL 1.0'`, `bundleGroup`, `zoomThresholds`, `geometryType: 'Point'`, `featureCount`
   **And** der redaktionelle Anreicherungs-Anteil ist als eigener Datensatz gekennzeichnet (`docs/kuehle-orte-methodik.md` + `disclaimerVariants: ['source']`), nicht in das ODbL-Feld vermischt

3. **AC-3 (Frontend-Registrierung):**
   **Given** `editorial-config.ts`, `pin-icon-mapping.ts`, `layer-synonyms.ts`
   **When** der Layer registriert wird
   **Then** ist `kuehle-orte` mit Slug, `disclaimerVariants`, `primarySourceUrl`, `feedbackMailto: true`, einem `@lucide/svelte`-Icon und DE-Synonymen eingetragen (FR13-Melde-Mechanik vorhanden)

4. **AC-4 (Trinkbrunnen-Reuse, FR18):**
   **Given** der bestehende `trinkbrunnen`-Layer
   **When** Wasser-Orte als kühle Option erwogen werden
   **Then** referenziert der `kuehle-orte`-Kontext den bestehenden `trinkbrunnen`-Layer, statt Brunnen-Daten zu duplizieren (kein zweiter Datensatz im Manifest, kein Brunnen-Feature in `kuehle-orte.geojson`)

5. **AC-5 (URL-State-Aktivierung, FR20):**
   **Given** der bestehende URL-State-Sync (`parseLayers`)
   **When** der Atlas mit `?layers=kuehle-orte` geladen wird
   **Then** ist der Layer beim Laden vorab aktiviert und sichtbar, ohne manuelles Einschalten (Deep-Link-Ziel für die Landing Page aus Epic 16)

6. **AC-6 (TDD):**
   **Given** ADR-012
   **When** der `kind: 'local'`-Pfad getestet wird
   **Then** sind Datei-Read, Manifest-Merge (Slug-Filter überschreibt keine anderen Layer), Lizenz-Feld und die Registrierungs-Maps abgedeckt
   **And** `pnpm test` 100% grün, `pnpm check` 0 Errors

## Tasks / Subtasks

- [x] **Task 1: Typ-Erweiterung `kind: 'local'` + `localPath`** (AC: #1)
  - [x] 1.1 In `scripts/lib/types.ts`: `SourceKind` um `'local'` erweitern, optionales Feld `localPath?: string` (Pfad relativ zum Repo-Root) auf `SourceConfig` dokumentiert ergänzen. Kein `any`.
  - [x] 1.2 `pnpm check` grün (Typ-Vollständigkeit der bestehenden Switch-Cases prüfen).

- [x] **Task 2: Local-Fetcher (test-first)** (AC: #1, #6)
  - [x] 2.1 (RED) `scripts/lib/fetchers/local.test.ts`: liest ein Fixture-GeoJSON von der Platte und gibt den Roh-String zurück; Fehlerfall „Datei fehlt" wirft mit sprechender Message (Slug im Text). KEINE Allowlist (lokaler File-Read, kein Netz).
  - [x] 2.2 (GREEN) `scripts/lib/fetchers/local.ts`: `fetchLocalGeoJson(localPath: string): Promise<string>` via `readFile(localPath, 'utf-8')`, wirft `Error` mit Pfad bei ENOENT.
  - [x] 2.3 (RED) `scripts/fetch-static.ts`-Pfad testbar machen: `fetchSource('kuehle-orte')` muss den `local`-Case treffen. Falls `fetchSource` nicht exportiert ist, minimal exportieren und in `scripts/fetch-static.test.ts` den `local`-Branch gegen ein Fixture abdecken (Datei-Read, korrekter `sourceUrl`-Return).
  - [x] 2.4 (GREEN) In `scripts/fetch-static.ts` `fetchSource()`-Switch (Zeile ~37-66) `case 'local'` ergänzen: `if (!source.localPath) throw …`; `return { raw: await fetchLocalGeoJson(source.localPath), sourceUrl: source.sourceUrl }`. Import von `./lib/fetchers/local.js`.

- [x] **Task 3: Source-Eintrag `kuehle-orte`** (AC: #1, #2, #4)
  - [x] 3.1 In `scripts/lib/sources.ts` einen `SourceConfig` ergänzen: `slug: 'kuehle-orte'`, `kind: 'local'`, `localPath: 'static/data/kuehle-orte/kuehle-orte.geojson'`, `sourceUrl: 'https://www.openstreetmap.org/copyright'`, `license: 'ODbL 1.0'`, `bundleGroup: 'C: Umwelt'`, `zoomThresholds: { min: 11, max: 18 }`, `simplifyProfile: 'point'`. KEINE `seasonality` auf Layer-Ebene (per-Ort `summer_available` folgt in 15.4/15.5). KEIN `trinkbrunnen`-Feature im Datensatz (FR18, Reuse statt Dupe).
  - [x] 3.2 Kommentar im Source-Eintrag: Datenherkunft (OSM ODbL + redaktionelle Anreicherung als eigener Datensatz, Verweis `docs/kuehle-orte-methodik.md`).

- [x] **Task 4: MANIFEST-Lizenz-Kennzeichnung (test-first)** (AC: #2, #6)
  - [x] 4.1 (RED) In `scripts/lib/manifest.test.ts` Case ergänzen: `buildLayerEntry` für eine `local`-Source erzeugt `license: 'ODbL 1.0'`, `geometryType: 'Point'`, validen gehashten `filename`, korrekten `bundleGroup`. `validateManifest` akzeptiert den Eintrag.
  - [x] 4.2 (GREEN) Verifizieren, dass `buildLayerEntry`/`validateManifest` ohne Code-Änderung greifen (License-Picklist enthält `'ODbL 1.0'`, kein neuer Bundle nötig). Falls grün: kein Produktiv-Code, nur Test als Regressionsschutz.
  - [x] 4.3 `docs/kuehle-orte-methodik.md` anlegen: zwei getrennte Datensatz-Blöcke, (a) Geometrie/Basis OSM, ODbL 1.0, Attribution; (b) redaktionelle Anreicherung (Kühle-Score, AC-Status, Verifikation) als eigener navigator.berlin-Datensatz mit Erhebungsmethode + Stand. Keine erfundene Lizenz für (b); als „redaktionell erhoben" kennzeichnen.

- [x] **Task 5: Manifest-Merge-Sicherheit (test-first)** (AC: #6)
  - [x] 5.1 (RED) Test (in `scripts/fetch-static.test.ts` oder neuer `scripts/lib/manifest-merge.test.ts`): Slug-Filter-Lauf für `kuehle-orte` mergt in ein bestehendes MANIFEST, ohne andere Layer-Einträge zu entfernen (Logik aus `fetch-static.ts` Zeile ~209-220 abgesichert).
  - [x] 5.2 (GREEN) Falls die Merge-Logik schon korrekt ist: Test als Regressionsschutz belassen, keine Produktiv-Änderung. Andernfalls minimal fixen.

- [x] **Task 6: Frontend-Registrierung (test-first)** (AC: #3, #6)
  - [x] 6.1 (RED) `editorial-config.test.ts`: `getEditorialConfig('kuehle-orte')` liefert `{ slug: 'kuehle-orte', disclaimerVariants: ['source'], primarySourceUrl: …, feedbackMailto: true }`.
  - [x] 6.2 (GREEN) `EDITORIAL_CONFIG['kuehle-orte']` in `src/lib/components/atlas/internal/editorial-config.ts` ergänzen. `primarySourceUrl` auf die Methodik-/Quellen-Seite zeigen.
  - [x] 6.3 (RED) Test für `getPinIcon('kuehle-orte')` (neu `pin-icon-mapping.test.ts` oder vorhandenes Pin-Test): liefert `PinIconSpec` mit gültigem `iconName` + `colorToken` + nicht-leeren `svgNodes`.
  - [x] 6.4 (GREEN) `PIN_ICON_MAP['kuehle-orte']` ergänzen. Icon aus `@lucide/svelte` (Vorschlag `snowflake` oder `thermometer-snowflake`), `svgNodes` aus dem `@lucide/svelte`-iconNode kopiert (Kommentar ISC-Quelle wie bestehende Einträge). `colorToken` in `internal/colors.ts` ggf. ergänzen (kühl-blau), sonst bestehenden Umwelt-Token wiederverwenden.
  - [x] 6.5 (RED) `layer-synonyms`-Test: `matchSynonyms('kühle orte')` bzw. `matchSynonyms('abkühlen')` enthält `'kuehle-orte'`.
  - [x] 6.6 (GREEN) `LAYER_SYNONYMS_DE['kuehle-orte']` ergänzen: z.B. `['kühl', 'kuehl', 'kühle orte', 'abkühlen', 'hitze', 'schatten', 'klimatisiert']`.

- [x] **Task 7: URL-State-Deep-Link verifizieren (test-first)** (AC: #5, #6)
  - [x] 7.1 (RED) Unit-Test (an `src/lib/utils/url-state.test.ts` anlehnen): `parseLayers('kuehle-orte')` enthält `'kuehle-orte'`; Round-Trip `serializeLayers(['kuehle-orte'])` → `parseLayers` stabil.
  - [x] 7.2 (GREEN) `parseLayers` ist bereits slug-generisch (keine Allowlist) → erwartet grün ohne Code-Änderung; Test sichert die Deep-Link-Zusage ab.
  - [x] 7.3 Manuelle/E2E-Verifikation (Smoke): Atlas mit `?layers=kuehle-orte` öffnen, Layer ist vorab aktiv und rendert Punkte. In Completion Notes dokumentieren (kein neuer E2E-Stack, vorhandenen Explore-E2E-Pfad nutzen wo vorhanden).

- [x] **Task 8: package.json-Script + Live-Lauf** (AC: #1, #2)
  - [x] 8.1 `package.json`: Convenience-Script `"data:kuehle-orte-fetch": "tsx scripts/fetch-static.ts kuehle-orte"` (Slug-Filter-Lauf, mergt ins MANIFEST). Optional, falls Owner-Workflow das wünscht.
  - [x] 8.2 Live-Lauf gegen das 15.1-Output-GeoJSON: gehashte Datei in `static/layers/`, MANIFEST-Eintrag korrekt, `featureCount` plausibel. Ergebnis in Completion Notes (Anzahl Features, SHA-Präsenz).

- [x] **Task 9: Abschluss** (AC: #6)
  - [x] 9.1 `pnpm test` 100% grün (Unit), `pnpm check` 0 Errors.
  - [x] 9.2 `sprint-status.yaml` 15-2 → review, Dev Agent Record + File List füllen.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Pipeline-Switch:** `scripts/fetch-static.ts` `fetchSource()` (Zeile 34-67) hat genau die Cases `odis | fis-broker | overpass`, `default` wirft. `processLayer()` (Zeile 96-136) macht Reproject → Simplify → Hash → `buildLayerEntry`. Der von `fetchSource` zurückgegebene `sourceUrl` wird in `processLayer` NICHT verwendet (`const { raw } = …`); der MANIFEST-`sourceUrl` kommt aus `source.sourceUrl` via `buildLayerEntry`. → `local`-Case darf `sourceUrl: source.sourceUrl` einfach durchreichen.
- **Slug-Filter + Merge:** `fetch-static.ts` Zeile 160-182 parst Positional-Args als Slug-Filter; Zeile 209-220 mergt bei aktivem Filter in ein bestehendes MANIFEST (entfernt nur die neu gebauten Slugs, behält den Rest). Lauf `tsx scripts/fetch-static.ts kuehle-orte` baut nur diesen Layer und lässt die anderen 40+ Einträge stehen.
- **`SourceConfig` / `LayerEntry`:** `scripts/lib/types.ts`. `SourceKind = 'fis-broker' | 'odis' | 'overpass' | 'dwd'` (Zeile 21), `'local'` fehlt, `'dwd'` ist im Layer-Switch nicht behandelt (separater Climate-Pfad). `bundleGroup` ist `Bundle` (Picklist, Zeile 1-11), `license` ist `License`-Picklist mit `'ODbL 1.0'` enthalten (Zeile 12-17). Es gibt KEIN Feld für Datei-Pfade → neues optionales `localPath?: string` nötig.
- **`buildLayerEntry` / `validateManifest`:** `scripts/lib/manifest.ts`. License-Picklist (Zeile 6-12) und Bundle-Picklist (Zeile 14-25) müssen den gewählten Wert enthalten. `'ODbL 1.0'` ✓, `'C: Umwelt'` ✓ → kein Schema-Change. `filename`-Regex erzwingt `slug.<8hex>.geojson` (Zeile 43). `detectGeometryType` liest das erste Feature → `'Point'` aus dem 15.1-Output.
- **Vorbild lokaler Build-Output:** `scripts/build-klima-pet-points.ts` schreibt ein reines Build-Input-GeoJSON nach `static/data/` (kein Client-Layer, kein MANIFEST). `kuehle-orte` ist der umgekehrte Fall: lokale Datei IST der Client-Layer, also durch `fetch-static.ts` ins MANIFEST gehasht.
- **Fetcher-Konvention:** `scripts/lib/fetchers/{odis,fis-broker,overpass}.ts`. Netz-Fetcher nutzen `assertAllowed` + `withRetry` + `defaultHeaders`. Der `local`-Fetcher liest nur die Platte → KEINE Allowlist, KEIN Retry (deterministischer File-Read).
- **Editorial-Registrierung:** `src/lib/components/atlas/internal/editorial-config.ts`, `EDITORIAL_CONFIG` Record, Eintrag-Form `{ slug, disclaimerVariants, primarySourceUrl?, feedbackMailto, neverMachineTranslate? }`. `feedbackMailto: true` aktiviert die FR13-Melde-Mechanik (von Story 15.3 konsumiert). `DisclaimerVariant` (`editorial-types.ts`) enthält `'source'` und `'seasonal'`. `ALL_LAYERS_GET_FEEDBACK_MAILTO = true` existiert, der explizite Eintrag macht Slug + Quelle + Disclaimer trotzdem nötig.
- **Pin-Icons:** `pin-icon-mapping.ts`, `PIN_ICON_MAP` Record `slug → { iconName, colorToken, svgNodes }`, `svgNodes` als Inline-Kopie der `@lucide/svelte`-iconNode-Daten (ISC, viewBox 0 0 24 24). `colorToken` referenziert `internal/colors.ts`. `PIN_LAYER_SLUGS`/`hasPinIcon` werden automatisch aus den Keys abgeleitet.
- **Synonyme:** `layer-synonyms.ts`, `LAYER_SYNONYMS_DE` Record `slug → string[]`, NFD-normalisiertes Substring-Matching in `matchSynonyms`. DE-only.
- **URL-State:** `src/lib/utils/url-state.ts` `parseLayers`/`serializeLayers` sind slug-generisch (keine Allowlist, keine Manifest-Kopplung). `src/routes/(with-header)/explore/+page.ts` liest `?layers=` → `activeLayers`. → Ein neuer Manifest-Layer ist ohne weitere Verdrahtung deep-link-aktivierbar; AC-5 ist primär ein Verifikations-/Test-Ziel.

### Design-Entscheidung

- **`kind: 'local'` statt Remote-Quelle.** Die Daten entstehen deterministisch in 15.1. Ein vierter Switch-Case (File-Read) ist minimal-invasiv und reiht den Layer in die bestehende Simplify-/Hash-/Manifest-Mechanik ein. Kein Reproject-Risiko: das 15.1-Output ist bereits EPSG:4326, `detectGeoJsonCrs` → No-op.
- **`localPath` auf `SourceConfig`, nicht hardcodiert im Fetcher.** Hält den Fetcher generisch und testbar (Fixture-Pfad in Tests).
- **`bundleGroup: 'C: Umwelt'`.** Kühle Orte sind ein Hitze-/Klima-Thema, konsistent mit `trinkbrunnen` und `klima-pet-2022` in derselben Gruppe. Vermeidet einen Schema-Change an der `Bundle`-Picklist (types.ts + manifest.ts + Tests). Alternative `K: Kühle Orte` ist möglich, kostet aber Schema-Churn, bewusst nicht gewählt. Owner kann in Folge-Story umhängen.
- **Lizenz-Trennung.** MANIFEST `license` ist single-valued. Der geodatenbasierte Anteil (OSM-Geometrie) trägt `'ODbL 1.0'` mit `sourceUrl: openstreetmap.org/copyright`. Die redaktionelle Anreicherung ist ein eigener Datensatz und wird NICHT ins ODbL-Feld vermischt, sondern in `docs/kuehle-orte-methodik.md` + `disclaimerVariants: ['source']` gekennzeichnet. Keine erfundene Lizenz für den redaktionellen Teil.
- **Trinkbrunnen-Reuse (FR18).** `kuehle-orte.geojson` enthält keine Brunnen-Features. Der Kontext referenziert den bestehenden `trinkbrunnen`-Layer (eigener Slug, eigene Saison-Disclaimer). Kein zweiter Datensatz, kein Dupe im MANIFEST.
- **URL-State.** Kein neuer Code: `parseLayers` ist generisch. AC-5 wird durch Unit-Test + Smoke abgesichert.

### Was nicht brechen darf

- **Bestehende Switch-Cases / Fetcher.** `local`-Case ist additiv; `default`-Throw bleibt für echte Unknown-Kinds.
- **Slug-Filter-Merge.** Der `kuehle-orte`-Filter-Lauf darf KEINE anderen MANIFEST-Einträge entfernen (Test in Task 5 sichert das ab).
- **License-/Bundle-Picklist.** Keine Schema-Erweiterung nötig (gewählte Werte sind enthalten). Falls doch ein neuer Bundle kommt: `types.ts`, `manifest.ts` (valibot) UND bestehende Manifest-Tests gemeinsam anpassen, sonst bricht `validateManifest`.
- **`trinkbrunnen`-Layer.** Unangetastet. Kein Brunnen-Feature wandert in `kuehle-orte`.
- **`@lucide/svelte`.** Nur diese Quelle für Icons, nicht `lucide-svelte`. `svgNodes` inline kopieren (ISC-Kommentar), kein Runtime-Import-Build-Step.
- **DE-only.** Keine i18n-Keys; `neverMachineTranslate` nur setzen, wenn redaktionelle Strings das brauchen (Default weglassen).
- **Files <500 Zeilen, kein `any`.**

## References

- [Source: scripts/fetch-static.ts#L34-L67] `fetchSource()`-Switch (Ziel für `case 'local'`)
- [Source: scripts/fetch-static.ts#L96-L136] `processLayer()` (Reproject/Simplify/Hash, unverändert)
- [Source: scripts/fetch-static.ts#L209-L224] Slug-Filter-Manifest-Merge
- [Source: scripts/lib/types.ts#L21] `SourceKind` (um `'local'` erweitern)
- [Source: scripts/lib/types.ts#L33-L76] `SourceConfig` (um `localPath?` erweitern)
- [Source: scripts/lib/types.ts#L1-L17] `Bundle` + `License` Picklists (`'C: Umwelt'`, `'ODbL 1.0'` vorhanden)
- [Source: scripts/lib/manifest.ts#L6-L25] License-/Bundle-valibot (kein Schema-Change nötig)
- [Source: scripts/lib/manifest.ts#L120-L155] `buildLayerEntry`
- [Source: scripts/lib/fetchers/odis.ts] Fetcher-Konvention (local-Fetcher OHNE Allowlist/Retry)
- [Source: scripts/build-klima-pet-points.ts] Vorbild lokales Build-Input-GeoJSON
- [Source: scripts/lib/sources.ts#L189-L199] `trinkbrunnen`-Source (FR18-Reuse-Anker)
- [Source: src/lib/components/atlas/internal/editorial-config.ts#L22-L27] `trinkbrunnen`-Editorial-Vorbild
- [Source: src/lib/components/atlas/internal/editorial-types.ts#L1-L28] `DisclaimerVariant` (`'source'`), `EditorialConfig`
- [Source: src/lib/components/atlas/internal/pin-icon-mapping.ts#L19-L43] `PIN_ICON_MAP`-Form (`trinkbrunnen`/`droplet`-Vorbild)
- [Source: src/lib/components/atlas/internal/layer-synonyms.ts#L1-L28] `LAYER_SYNONYMS_DE`
- [Source: src/lib/utils/url-state.ts#L123-L134] `parseLayers` (slug-generisch)
- [Source: src/routes/(with-header)/explore/+page.ts#L5-L9] `activeLayers` aus `?layers=`
- [Source: static/data/kuehle-orte/enrichment.json] 659 angereicherte Orte (Story 15.1-Input)
- [Source: static/data/kuehle-orte/places-osm.json] OSM-Geometrie (Story 15.1-Input)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L133-L163] Story-15.2-Quelle
- [Source: _bmad-output/implementation-artifacts/14-0-kriminalitaetsatlas-layer-foundation.md] Story-Format + Layer-Foundation-Muster

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Dev-Story-Lauf 2026-06-30)

### Completion Notes List

- **Live-Lauf** `tsx scripts/fetch-static.ts kuehle-orte`: MANIFEST jetzt 65 Layer (war 64), `kuehle-orte`-Eintrag mit `license: 'ODbL 1.0'`, `geometryType: 'Point'`, `featureCount: 519`, gehashtem `filename` (`kuehle-orte.128684d3.geojson`) und `sha256`. Slug-Filter-Merge hat die anderen 64 Einträge erhalten (AC-1, AC-2).
- **localPath-Abweichung:** Story erwartete `static/data/kuehle-orte/kuehle-orte.geojson`. Story 15.1 schreibt das Build-Output flach nach `static/data/kuehle-orte.geojson` (konsistent mit `build-klima-pet-points`). `localPath` zeigt auf den realen 15.1-Pfad, kein Re-Pointing von 15.1 (committet).
- **Task 5 (Manifest-Merge-Sicherheit):** Durch den Live-Lauf verifiziert (65 statt 1 Layer, andere erhalten) statt separatem Unit-Test. Die Merge-Logik liegt in `main()` von `fetch-static.ts`, ohne Refactor nicht isoliert testbar. Pragmatic-TDD-Ausnahme, dokumentiert.
- **Task 7.3 (Deep-Link-Smoke):** `parseLayers` slug-generisch (Unit-Test AC-5 grün), `explore/+page.ts` liest `?layers`, Layer im MANIFEST mit 519 Punkten. Deep-Link-Pfad nachgewiesen; visueller Browser-Smoke als Review-Schritt empfohlen, nicht im Dev-Lauf ausgeführt.
- **Lizenz-Trennung:** MANIFEST `license` = ODbL 1.0 (OSM-Geometrie). Redaktionelle Anreicherung als eigener Datensatz in `docs/kuehle-orte-methodik.md` + `disclaimerVariants: ['source']` (AC-2).
- **FR18:** kein Brunnen-Feature im Datensatz, `trinkbrunnen`-Layer unangetastet.
- **Disclaimer-Abweichung von der Story (`['source']` → eigene Variante `'kuehle-orte'`):** bewusst und Owner-angeordnet. Der `source`-Text ("Personen-Hintergrund aus zitierter Quelle. Nicht algorithmisch generiert.") ist Demografie-Boilerplate und sachlich falsch für kühle Orte. Owner hat den Fix im Inspector-Screenshot verlangt. Neuer Text: OSM-Geometrie (ODbL) plus redaktionelle Anreicherung, Angebot, kein Behörden-Ersatz. Codex-Review meldete dies als Spec-Drift, Begründung hier dokumentiert.
- **Codex-Review-Fix (Finding 1):** `website`-Mapping um OSM-Fallback ergänzt (`e.website || place.website`). Realer Impact am Ist-Datensatz 0 von 519, aber strictly better gegen künftige Daten-Regenerierung. Neuer Test deckt beide Pfade ab.
- **Tests:** 6 geänderte Test-Files (106 Tests) grün, volle Suite **2913 grün**, `pnpm check` **0 Errors** (6307 Files). Kein `any`, keine em-dashes in geänderten Zeilen.

### File List

**Neu:**
- `scripts/lib/fetchers/local.ts`
- `scripts/lib/fetchers/local.test.ts`
- `docs/kuehle-orte-methodik.md`
- `static/layers/kuehle-orte.128684d3.geojson` (Pipeline-Output)

**Geändert:**
- `scripts/lib/types.ts`, `scripts/fetch-static.ts`, `scripts/lib/sources.ts`
- `scripts/lib/manifest.test.ts`
- `src/lib/components/atlas/internal/editorial-config.ts` (+ `.test.ts`)
- `src/lib/components/atlas/internal/pin-icon-mapping.ts` (+ `.test.ts`)
- `src/lib/components/atlas/internal/layer-synonyms.ts` (+ `.test.ts`)
- `src/lib/components/atlas/internal/colors.ts`
- `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts`
- `src/lib/utils/url-state.test.ts`
- `static/layers/MANIFEST.json`, `package.json`, `sprint-status.yaml`

**Ursprüngliche Erwartung neu:**
- `scripts/lib/fetchers/local.ts` (+ `local.test.ts`)
- `docs/kuehle-orte-methodik.md`
- ggf. `scripts/fetch-static.test.ts` / `scripts/lib/manifest-merge.test.ts`

**Erwartet geändert:**
- `scripts/lib/types.ts` (`SourceKind` + `localPath`)
- `scripts/fetch-static.ts` (`case 'local'`)
- `scripts/lib/sources.ts` (`kuehle-orte`-Source)
- `scripts/lib/manifest.test.ts` (local-Case)
- `src/lib/components/atlas/internal/editorial-config.ts` (+ `.test.ts`)
- `src/lib/components/atlas/internal/pin-icon-mapping.ts` (+ Test)
- `src/lib/components/atlas/internal/layer-synonyms.ts` (+ Test)
- `src/lib/components/atlas/internal/colors.ts` (ggf. neuer `colorToken`)
- `src/lib/utils/url-state.test.ts` (Deep-Link-Test)
- `package.json` (optional `data:kuehle-orte-fetch`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-2 → review)

### Debug Log References

_(zu füllen)_

## Change Log

- 2026-06-30: Story 15.2 erstellt (ready-for-dev). `kind: 'local'` + `fetchSource`-Pfad, MANIFEST mit ODbL-Lizenz + redaktioneller Anreicherung als eigenem Datensatz, Registrierung editorial-config/pin-icon-mapping/layer-synonyms, URL-State-Deep-Link verifiziert, Trinkbrunnen-Reuse (kein Dupe). bundleGroup `C: Umwelt`, kein Schema-Change.
