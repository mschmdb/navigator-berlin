---
title: 'i18n Abschluss D1: /kiez, /bezirk, /layer registrieren und EN-Sitemap'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: '4c54ceb547e426cbce73a76e34f3bcb4275ffb17'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/kiez`, `/en/bezirk` und `/en/layer` sind inhaltlich übersetzt (B4a/b, C1-C3, C5), stehen aber nur im `PARTIAL_TRANSLATION_REGISTER`: Banner, `noindex`, JSON-LD bewusst DE. `sitemap-en.xml` enthält fast nichts, weil die Quellen für Nicht-DE `[]` liefern, auch für längst registrierte Seiten wie `/en/explore`, `/en/methodik`, `/en/updates`.

**Approach:** Die drei Routen wandern mit `prefix` ins `TRANSLATION_REGISTER`. Die letzten DE-Reste und das JSON-LD folgen der Seiten-Locale. Die Sitemap-Quellen liefern EN-URLs, das zentrale Register-Gate entscheidet, was in `sitemap-en.xml` landet.

## Boundaries & Constraints

**Always:**
- Register: `/kiez`, `/bezirk`, `/layer` mit `prefix: true` im `TRANSLATION_REGISTER`, raus aus dem Teil-Register. Die Teil-Register-Mechanik bleibt (leer) bestehen.
- Steckbrief-Verteilungen (`src/lib/data/steckbrief-extras.ts`) zeigen Kategorien in der Seiten-Locale, bestehende Messages wiederverwenden (Lärm/Grün: low/medium/high, Grün neutral wie Story 1.22; Wohnlage: simple/medium/good residential area).
- JSON-LD in der Seiten-Locale mit `inLanguage` (Konvention `localeToBcp47`): `/layer` (Name, Beschreibung, Creator, Breadcrumb inkl. „Daten“ → Message, Keywords), `/kiez`, `/bezirk` (Place/AdministrativeArea, Breadcrumb, `additionalProperty`-Namen), DataCatalog auf `/lizenzen` (`lizenzen/+page.ts`, `+page.svelte`). URLs in JSON-LD auf `/en/…`, wenn die Seite `/en` ist. Die „bleibt DE bis zur Registrierung“-Kommentare entfallen.
- Sitemap: `STATIC_PAGES_SOURCE`, `LAYER_DETAIL_SOURCE`, `KIEZ_PAGES_SOURCE`, `BEZIRK_PAGES_SOURCE`, `UPDATES_PAGES_SOURCE`, `RANKING_PAGE_SOURCE` liefern je Locale `localizedPathname(...)`; `sitemap-en.xml/+server.ts` lädt Kiez- und Bezirk-Slugs wie die DE-Route. Fehlende statische Seiten ergänzen (`/architektur`, `/methodik/kiez-score`), `noindex`-Seiten (`/methodik/cross-layer-templates`) nie. Nicht registrierte Seiten (`/impressum`, `/datenschutz`) nie in EN.
- Kleinkram aus `deferred-work.md` (B): DE-Tippfehler „Sueden“, „Kein Layer matched“ (`messages/de.json` ~607/615), Behördenname in `methodik_kiez_score_sources_p1` an `methodik_mss_p1` angleichen (DE und EN).
- Tests, die `/kiez`/`/bezirk`/`/layer` als „nicht übersetzt“ nutzen, auf `/impressum` bzw. `/datenschutz` umstellen. TDD pro AC.

**Never:**
- Kein EN-`llms.txt` (v1 bewusst DE), keine EN-OG-Bilder, keine 404-Lokalisierung (deferred).
- Mailto-Bodies an die Redaktion bleiben DE.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez EN | `/en/kiez/<slug>` | kein Banner, kein `noindex`, hreflang de/en/x-default, `<main lang="en">` | N/A |
| Layer EN | `/en/layer/<slug>` | wie oben, Dataset-JSON-LD englisch, `inLanguage` en-US | N/A |
| Steckbrief EN | Lärm-Verteilung | „Medium 67%“ statt „Mittel 67%“ | unbekannte Kategorie: Rohwert mit `lang="de"` |
| Sitemap EN | `/sitemap-en.xml` | alle registrierten EN-Seiten inkl. Kiez/Bezirk/Layer-Details, `/en/explore`, `/en/updates/*` | nicht registrierte und `noindex`-Seiten fehlen |
| Sitemap DE | `/sitemap-de.xml` | unverändert, mit EN-Alternates für registrierte Seiten | N/A |
| Lizenzen EN | `/en/lizenzen` | DataCatalog englisch, Datasets zeigen auf `/en/layer/…` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/seo/translation-register.ts:84-87` (Teil-Register), Kommentare; `translation-register.test.ts:12-, 134, 154, 163-205, 210`.
- `src/lib/data/steckbrief-extras.ts:19-28` (`toSegments`, `distributionText`); Aufrufer `kiez-hero.svelte:109,120,171`, `distribution-bar.svelte:26`.
- `src/routes/(with-header)/layer/[slug]/+page.svelte:64-138` (`deLayerName`, `deExplain`, `deMethodology`, `jsonLdDescriptionFallback`, Breadcrumb „Daten“ `:137`, Keywords `:128`); `:405` Mailto bleibt DE. `src/lib/seo/jsonld-dataset.ts:86` (`inLanguage`-Default).
- `src/lib/seo/jsonld-place.ts:58,61`, `jsonld-administrative-area.ts`, Kiez-/Bezirk-Seiten (Breadcrumb).
- `src/routes/(with-header)/lizenzen/+page.ts:11-37`, `+page.svelte:70-80`.
- `src/lib/seo/sitemap-builder.ts:167, 192, 216-219, 270-`, `src/lib/seo/sources/{bezirk-pages,kiez-pages,ranking-page,updates}.ts`, `src/routes/sitemap-en.xml/+server.ts` (Kommentar `:13-20`), Muster `sitemap-de.xml/+server.ts:4-5,29-31,52-53`.
- Tests: `sitemap-builder.test.ts:184,227,244,268-273`, `endpoints.test.ts:200-`, `llms-sitemap-consistency.test.ts:171-190`, `seo-head.svelte.test.ts:173-223`, `effective-locale.test.ts`, `translation-disclaimer.svelte.test.ts`; e2e `i18n-profile-frame.e2e.ts:94-114, 250-270`, `i18n-layer-frame.e2e.ts:83-103`, `i18n-routing.e2e.ts:173-190, 259-278`.
- `messages/de.json` ~607/615, `methodik_kiez_score_sources_p1`.

## Tasks & Acceptance

**Execution:**
- [x] Steckbrief-Kategorien locale-fähig (+ Tests)
- [x] JSON-LD `/layer`, `/kiez`, `/bezirk`, `/lizenzen` in Seiten-Locale (+ Tests)
- [x] Register umstellen, Kontroll-Tests auf `/impressum`/`/datenschutz` (+ Tests)
- [x] Sitemap-Quellen und `sitemap-en.xml` (+ Tests inkl. Konsistenz-Invarianten)
- [x] DE-Tippfehler, Behördenname
- [x] e2e: drei Routen ohne Banner, indexierbar, hreflang; `sitemap-en.xml` enthält Kiez/Bezirk/Layer/Explore/Updates, nicht `/en/impressum`
- [x] `deferred-work.md`: erledigte Einträge mit `resolved:` markieren
- [x] Zeitmessung

**Acceptance Criteria:**
- Given der Build, when `/en/kiez/<slug>`, `/en/bezirk/<slug>`, `/en/layer/<slug>` laden, then gibt es kein Banner, kein `noindex`, und `<main lang="en">`.
- Given `/sitemap-en.xml`, when der Build läuft, then enthält sie genau die registrierten, indexierbaren EN-Seiten.

## Implementation Notes

- 30.09. Audits 17:49-17:52, Glossar-Commit 4c54ceb 18:00, Spec 17:58, Abnahme Matze 18:03, Umsetzung 18:03-18:16, Review 18:16-18:19, Patches 18:19-18:24, Verifikation 18:24-18:40.
- Register: `/kiez`, `/bezirk`, `/layer` mit `prefix` im `TRANSLATION_REGISTER`, Teil-Register leer.
- Sitemap: alle Quellen je Locale, Register-Gate filtert; `sitemap-en.xml` 260 `<loc>` (143 Kiez, 12 Bezirk, 56 Layer, 13 Updates, statische Seiten). `llms.txt` (DE) um `/architektur`, `/methodik/kiez-score` ergänzt (Konsistenz-Invariante Sitemap ↔ llms).
- JSON-LD `/layer`, `/kiez`, `/bezirk`, `/lizenzen` in Seiten-Locale. `inLanguage` nur an CreativeWork-Typen (Dataset, DataCatalog, Breadcrumb/FAQ wo vorhanden), nicht an Place/AdministrativeArea (schema.org).
- Neue EN-Kurztexte ohne Übersetzungs-Abnahme: „Data“ (Breadcrumb), „Population“, „Area (ha)“, „navigator.berlin data catalogue“ + Beschreibung + Dataset-Fallback. DE-Property-Namen im JSON-LD jetzt „Einwohner“/„Fläche (ha)“ statt Bezeichnern.
- DE-Korrekturen: „Süden“, „Kein Layer passt zu …“, Behördenname Kiez-Score-Methodik.
- Bekannt, nicht geändert: Steckbrief-Dominant-Zeile nutzt „quiet/moderate/loud“ (FAQ-Helper), die Verteilung „Low/Medium/High“.
- Qualität: 30 Review-Funde in 13 Einträgen, 9 gepatcht, 4 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 18:19), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 10, Verification Gap (VG) 3 + 3. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | doppelte Each-Keys bei synonymen Rohwerten (EN) | medium | Label-Mapping n:1, Laufzeitfehler nur auf `/en` | P |
| 2 | EC | Lärm/Grün übersetzt Wohnlage-Wörter, `sehr niedrig`, Wohnlage-Varianten | low | | P |
| 3 | VG/BH | Kiez-/Bezirk-JSON-LD auf Seitenebene ungetestet | medium | nur Builder-Test | P |
| 4 | VG | Bezirk-Steckbrief EN ungetestet, Layer-Keywords ungeprüft | low | Fixtures ohne Verteilungen | P |
| 5 | BH/EC | `distributionText` tot, Testtitel falsch | low | | P |
| 6 | BH | DE-Messages `jsonld_property_*` mit Maschinen-Bezeichnern | low | | P: „Einwohner“, „Fläche (ha)“ |
| 7 | BH/EC | `/lizenzen`-`load` ohne `url`-Abhängigkeit, Messages ohne `localeOpts`, Paritätstest entfernt | low | | P |
| 8 | BH | EN-Konsistenztest Sitemap/llms aufgeweicht | low | | P |
| 9 | BH | veraltete Fixtures/Kommentare (`/impressum` als Teil-Übersetzung, „Register leer“, Phase-1-DE) | low | | P |
| 10 | BH/EC | `inLanguage` fehlt an Place/AdministrativeArea | low | schema.org: `inLanguage` gehört zu CreativeWork, nicht Place; Breadcrumb/FAQ/Dataset tragen es | R |
| 11 | BH | `/layer`-JSON-LD kann DE-Text mit en-US liefern | false | C1/C2-Tests erzwingen EN-Mapping für alle Slugs | R |
| 12 | BH | `llms.txt` DE um zwei Seiten erweitert, undokumentiert | low | nötig für Konsistenz-Invariante, in Implementation Notes | R |
| 13 | BH | Spec unvollständig | low | Step 5 | R |

## Design Notes

- Neue EN-Kurztexte (Breadcrumb „Data“, `additionalProperty`-Namen „Population“, „Area (ha)“) folgen dem bestehenden Glossar; keine eigene Übersetzungs-Abnahme, in der Zusammenfassung an Matze nennen.
- `kiez_rank` kann nach `vitest run` lokal leer sein; vor `lint:profiles`/Build ggf. `pnpm data:rank && pnpm data:comparison`.

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5354/5354
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:wahl`, `pnpm lint:cleartext`, `pnpm lint:profiles` -- expected: 0 Verstöße -- **grün**
- `pnpm build` (voll) + e2e `i18n-*` -- expected: grün; `build/…/sitemap-en.xml` stichprobenartig prüfen (Port 4173 belegt: temporäre Config, danach löschen; `static/kiez-scores/region-composites.json` zurücksetzen) -- **grün**: Build 0 Fehler, e2e 183/183 (2 Läufe), `sitemap-en.xml` 260 `<loc>`
