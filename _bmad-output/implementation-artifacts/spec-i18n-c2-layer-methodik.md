---
title: 'i18n Block C2: Layer-Methodik und Behörden auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: '5fe9a120c7e54bc462207c81c2738a4623229548'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en/layer/<slug>` sind die Methodik-Karten deutsch und mit `lang="de"` markiert. Betroffen sind Berechnung, Coverage-Lücken, „What we don't show“ und Aktualisierung aus `layer-methodology.ts` (44 Slugs, 155 Strings) sowie die Pflege-/Behördennamen aus `authorities.ts` (25 Einträge, Feld `en` leer).

**Approach:** Wir übernehmen die abgenommene Übersetzung aus `c2-uebersetzung.json` unverändert.
- Methodik-Texte werden Paraglide-Messages.
- Die Behörden bekommen ihr `en`-Feld.
- Der OSM-Suffix wird locale-fähig.
- `getLayerMethodology` bekommt einen optionalen Locale-Parameter mit DE-Default.
- Die UI von `/layer` übergibt die Seiten-Locale und entfernt dort `lang="de"`, wo übersetzt.
- WebMCP bleibt deutsch.

## Boundaries & Constraints

**Always:**
- Übersetzung und Abnahme: `_bmad-output/implementation-artifacts/c2-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen im Abschnitt „Abnahme“ von `c2-uebersetzung-review.md` (Matze 27.09. 10:59):
  - Offizielle englische Behördennamen laut berlin.de.
  - OSM-Suffix EN „· OpenStreetMap contributors (ODbL 1.0)“, DE unverändert.
  - Interne Verweise bleiben wörtlich.
- DE-Ausgabe Zeichen für Zeichen gleich. Parity-Test Messages ↔ bisherige DE-Werte für alle Slugs, Felder, Array-Elemente und Behörden.
- Nicht-UI-Konsumenten bleiben DE: `src/lib/webmcp/{adapter,mount}.ts`, `tools/get-layer-metadata.ts`. Test unter EN-Locale.
- `/layer`-JSON-LD `creatorName` bleibt DE bis zur Registrierung (B4b-Linie).
- `aggregationLevel` (Enum) und `relatedLayers` (Slugs) bleiben unverändert.
- Fehlendes Mapping schlägt im Test fehl, kein stiller DE-Fallback.
- TDD pro AC.

**Never:**
- Keine DE-Textänderung, keine inhaltliche Überarbeitung (Bereinigung ist vorgemerkt).
- Kein Register-Eintrag `/layer` (FAQ-Inhalte bleiben DE, eigener Block).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| `/layer` EN | `/en/layer/<slug>` mit Methodik | Berechnung, Lücken, Auslassungen, Pflege, Aktualisierung englisch, ohne `lang="de"` | N/A |
| OSM-Layer EN | Slug mit `authoritySuffix` | „… · OpenStreetMap contributors (ODbL 1.0)“ | N/A |
| DE unverändert | `/layer/<slug>` | Texte identisch | N/A |
| WebMCP | `get_layer_metadata` unter EN-Seite | DE wie bisher | N/A |
| Layer ohne Methodik | `/en/layer/<slug>` ohne Spec | Leerzustand wie B4b | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/data/layer-methodology.ts`:
  - `LAYER_METHODOLOGY_SPECS` (44).
  - `specToMethodology(spec, locale)` `:575`: löst die Authority schon locale-fähig auf, der Suffix ist aber fest.
  - `buildResolvedMap(locale)` `:591`, `LAYER_METHODOLOGY_DE` `:606`, `getLayerMethodology(slug)` `:608`: Locale ergänzen, DE-Map als Referenz-Export behalten.
- `src/lib/data/authorities.ts`: `AUTHORITIES` (25, `en?`), `resolveAuthority(key, locale)` `:117`, `AUTHORITY_SUFFIX_OSM_ODBL` `:130` → locale-fähig (Funktion oder Map).
- `src/lib/data/get-layer-detail.ts`: `lang` an `getLayerMethodology` durchreichen. JSON-LD bekommt eine DE-Quelle wie `deExplain` in C1.
- `src/routes/(with-header)/layer/[slug]/+page.svelte`: `lang="de"` an Methodik-Feldern entfernen, `contentLang` nur noch für echte DE-Reste (FAQ).
- WebMCP-Aufrufer ohne Locale lassen: `src/lib/webmcp/adapter.ts`, `mount.ts`, `tools/get-layer-metadata.ts`.
- Tests: `layer-methodology.test.ts`, `authorities`-Test, `get-layer-detail.test.ts`, `layer/[slug]/page.svelte.test.ts`, WebMCP-Tests, e2e `i18n-layer-frame`.

## Tasks & Acceptance

**Execution:**
- [x] Messages aus `c2-uebersetzung.json` erzeugen (Script oder manuell, DE wörtlich), Key-Parität
- [x] `layer-methodology.ts` + `authorities.ts` locale-fähig, Parity-Tests DE, EN-Vollständigkeit (+ Tests)
- [x] `get-layer-detail.ts` + `/layer`-Seite: Locale durchreichen, `lang="de"` entfernen, JSON-LD DE (+ Tests)
- [x] WebMCP bleibt DE (+ Test unter EN)
- [x] e2e `i18n-layer-frame`: Methodik EN, kein `lang="de"` an Methodik, DE-Kontrolle
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given `/en/layer/<slug>` mit Methodik, when die Seite lädt, then sind alle Methodik-Felder und die Pflege-Angabe englisch und ohne `lang="de"`.
- Given WebMCP `get_layer_metadata`, when es unter EN aufgerufen wird, then liefert es die DE-Methodik wie bisher.

## Implementation Notes

- 27.09. 10:36 Übersetzung vorgezogen (1 Subagent außerhalb des Repos, 10:37-10:41), Abnahme Matze 10:59. Spec 11:01, Umsetzung nach dem C1-Commit (gleiche Dateien). 11:26 Checkpoint 1 durch Matze („Freigeben weiter“).

- Umsetzung: Parität DE-Spalte `c2-uebersetzung.json` ↔ `LAYER_METHODOLOGY_SPECS`/`AUTHORITIES` vor jeder Änderung per Skript geprüft (Node-`eval` der TS-Objektliteral-Ausschnitte gegen die JSON-Übersetzung) -- 0 Abweichungen über alle 44 Methodik-Slugs (155 Strings: calculation + updateFrequency je 44, plus variable coverageGaps/omissions-Arrays) und alle 25 Behörden.
- `layer-methodology.ts`: 155 neue Paraglide-Messages (`layer_methodology_{slug}_{calculation|update_frequency|coverage_gap_N|omission_N}`) in `messages/de.json`/`en.json`. `LAYER_METHODOLOGY_MESSAGE` (Slug → Message-Funktionen, analog `LAYER_EXPLAIN_MESSAGE` aus C1) treibt einen neuen `resolveMethodologyForLocale()`-Pfad für Nicht-DE-Locales. `LAYER_METHODOLOGY_DE` bleibt unverändert direkt aus den rohen Spec-Strings gebaut (kein Message-Umweg), das garantiert DE-Parität unabhängig von der Message-Pipeline. Anders als C1 (stiller DE-Fallback bei fehlendem Mapping) wirft `resolveMethodologyForLocale()` bei fehlendem Mapping pro Feld (Boundary: „kein stiller DE-Fallback") -- ein `it.each`-Test über alle 44 Slugs erzwingt das.
- `authorities.ts`: alle 25 `en`-Felder befüllt (offizielle Senatsverwaltungs-Namen laut berlin.de, Abnahme). `AUTHORITY_SUFFIX_OSM_ODBL` von festem String auf `Record<Locale, string>` umgestellt -- der Suffix war fälschlich als "sprachneutral" behandelt und schrieb auf EN weiter die DE-Bindestrich-Form "OpenStreetMap-Contributors" statt "OpenStreetMap contributors". `LayerMethodologySpec.authoritySuffix` entsprechend typisiert (`Readonly<Record<Locale, string>>` statt `string`), keine Änderung an den 9 Slug-Einträgen nötig, die den Suffix referenzieren.
- `get-layer-detail.ts`: `getLayerMethodology(slug, { locale: lang })` statt ohne Opts.
- `/layer/[slug]/+page.svelte`: `contentLang`/`lang={contentLang}` komplett entfernt (7 Stellen: Berechnung, Aggregation, Pflege, Aktualisierung, Coverage-Lücken, Omissions). Review-Fund beim Selbst-Check: `creatorName` im Dataset-JSON-LD nutzte bis dahin `methodology?.authority` (den jetzt locale-folgenden Loader-Wert) -- das hätte auf `/en/layer/…` die Behörde englisch ins JSON-LD durchsickern lassen (Boundary: „`/layer`-JSON-LD `creatorName` bleibt DE"). Gefixt mit einer eigenen DE-only-Quelle `deMethodology = getLayerMethodology(detail.slug)` (kein `opts`), analog zu `deLayerName`/`deExplain`.
- WebMCP: `mount.ts` reicht `getLayerMethodology` unverändert ohne Locale-Arg durch (`defaultLocale()` wird dafür nicht verwendet) -- Boundary hält strukturell. Test ergänzt in `get-layer-metadata.test.ts`, der die ECHTE `getLayerMethodology` (nicht die Fixture) unter `overwriteGetLocale(() => 'en')` aufruft und DE-Text erwartet.
- Tests: `layer-methodology.test.ts` (+13, u.a. `it.each` über alle 44 Slugs für EN-Vollständigkeit, OSM-Suffix-Locale-Test), `authorities.test.ts` (Phase-1-Lock-Tests durch EN-Vollständigkeits-Tests ersetzt, OSM-Suffix-Locale-Test), `get-layer-detail.test.ts` (+1 EN/DE-Methodology-Test), `get-layer-metadata.test.ts` (+1 WebMCP-DE-unter-EN-Test), `page.svelte.test.ts` (EN-Methodik-Test umgebaut: kein `lang="de"` mehr, echter EN-Text; Creator-Fallback-Test auf unbekannten Slug umgestellt, da `creatorName` jetzt über reale Slug-Daten statt Props läuft; EN-JSON-LD-Boundary-Test um `creatorName`-Assertion ergänzt). `pnpm exec vitest run`: 470/471 Dateien grün, 4850/4851 Tests grün (1 vorbestehender `winner-map.svelte.test.ts`-Flake, isoliert erneut ausgeführt: 13/13 grün, gleicher Flake-Typ wie in C1 dokumentiert). `pnpm check` 0 Fehler. `pnpm lint:wahl` 0 Verstöße.

- Zeitmessung gesamt (Koordinator): Übersetzung 10:37-10:41, Abnahme Matze 10:59, Spec 11:01, Freigabe 11:26, Umsetzung 11:26-11:46 (20 min), Review 11:46-11:49, Patch-Runde 11:49-12:11 (22 min), Abschluss 12:12. Gesamt ohne Wartezeit rund 55 min.
- Qualität: 19 Review-Funde in 16 Einträgen (1 medium: Laufzeit-Throw bei fehlendem Mapping), 11 gepatcht, 1 deferred, 4 rejected. Abschluss: vitest 4903/4903 grün, check 0, lint:wahl 0, e2e 62/62.


## Review Triage Log

Runde 1 (27.09.2026 11:49), 3 Layer: Blind Hunter (BH) 12, Edge Case (EC) 4, Verification Gap (VG) 2 + 1. Triage Koordinator. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC | `requireMessage` wirft zur Laufzeit: neuer Spec-Slug ohne Mapping → 500 auf `/en/layer/…` | medium | Boundary meint Test, nicht Prod | P: Mapping per Typ an Spec-Slugs binden, zur Laufzeit DE-Fallback mit Markierung statt Throw |
| 2 | BH/VG | DE-Keys in `de.json` nie gelesen, keine Parität zu `LAYER_METHODOLOGY_SPECS` | gap | zwei DE-Quellen | P: Paritätstest |
| 3 | BH | Keine Prüfung auf verwaiste Messages/Array-Einträge | gap | | P |
| 4 | BH | `layer-methodology.ts` 1010 Zeilen, Datenschicht importiert Komponenten-Interna | low | Projektregel <500 Zeilen | P: Mapping auslagern, `message-options` statt `atlas-label-options` |
| 5 | BH/VG | WebMCP: veralteter Kommentar, ignoriertes `locale` undokumentiert, Mount-Verdrahtung ungetestet, `authority` unter EN ungetestet | gap | | P |
| 6 | VG | `/en/lizenzen` DataCatalog-JSON-LD: `creatorName` EN, `description` seit C1 EN | low | B4b-Linie: JSON-LD DE bis Registrierung | P: DE-Quellen für beide Felder |
| 7 | EC | `aggregationLevel`-Enum ohne `lang="de"` | low | Label-Map kommt mit Textbereinigung | P: `lang="de"` bis dahin zurück |
| 8 | BH | e2e DE-Kontrolle ohne Methodik, JSON-LD-e2e ohne `creator.name` | gap | | P |
| 9 | BH | EN-Behörden: Kriminalitätsatlas-Reihung, Gutachterausschuss-Langname, „social situation“ klein | low | Konsistenz mit übrigen Einträgen | P |
| 10 | BH | `AuthorityMeta.en` optional trotz Vollständigkeit, Testname widersprüchlich | low | | P |
| 11 | BH | Irreführende Fixtures in `page.svelte.test.ts` | low | | P |
| 12 | BH | Interner Jargon jetzt auch in EN | low | spiegelt DE | R (Textbereinigung) |
| 13 | BH | DE-Anführungszeichen „…" in Spec-Texten | low | DE-Änderung | D (Textbereinigung) |
| 14 | EC | Deutsche Klammerbegriffe in EN-Behördennamen ohne `lang` | low | übliche Nennung des Originalnamens | R |
| 15 | BH | Banner auf `/en/layer` pauschal | low | FAQ bleibt DE, Aussage stimmt | R |
| 16 | BH | Spec-Doku (Zeitmessung, Change Log, Zählungen) | low | Fix editiert Spec | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 470/471 Dateien, 4850/4851 Tests grün. 1 vorbestehender `winner-map.svelte.test.ts`-Flake (Datei unverändert von dieser Spec), isoliert erneut ausgeführt: 13/13 grün.
- `pnpm check` -- expected: 0 Fehler -- **grün**: 6541 Dateien, 0 Fehler, 0 Warnungen.
- `pnpm lint:wahl` -- expected: 0 Verstöße -- **grün**: 72 Dateien, 0 Verstöße.
- `pnpm build` + e2e `i18n-layer-frame`, `i18n-routing` -- expected: grün -- **`pnpm build` grün** (vollständiger Prebuild inkl. DB-Migration, Wahl-Fetch, 261 OG-Bilder gegen lokale Postgres, 0 Fehler; `static/kiez-scores/region-composites.json` bekam nur ein neues `generatedAt`, per `git checkout` zurückgesetzt). **e2e grün**: 60/61 (`i18n-layer-frame` 9/9 grün inkl. Methodik-EN ohne `lang="de"`, Coverage-Lücken/Omissions-Inhalte, DE-Kontrolle; `i18n-routing` 51/52, 1 vorbestehender Fokus-Flake bei „Escape schließt das Dropdown" -- kein C2-Bezug, isoliert erneut ausgeführt: grün). Playwright-`webServer` brauchte für den lokalen Lauf `reuseExistingServer: true` (Default-Timeout 60 s reicht nicht für den vollen Prebuild) -- Server separat mit `pnpm build && pnpm run preview` gestartet, Config-Zeile nach dem Lauf zurückgesetzt, keine dauerhafte Änderung.
