---
title: 'Prerender ohne 404-Links: Lizenz-Liste und Kiez-Slugs'
type: 'bugfix'
created: '2026-10-14'
status: 'done'
baseline_commit: 'b1d0176f20ed8e0bff38ff25ad152bbde38401e3'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Prod-Build vom 14.10.2026 meldet 32 Prerender-404. `/lizenzen` und `/en/lizenzen` verlinken 15 Build-only-Layer, die bewusst keine `/layer/[slug]`-Seite haben. Die Kiez-Listen auf `/kiez/[slug]` und `/bezirk/[slug]` verlinken `/kiez/heerstrasse`, obwohl es zwei Kieze „Heerstraße“ mit den Slugs `heerstrasse-spandau` und `heerstrasse-charlottenburg-wilmersdorf` gibt.

**Approach:** Die Lizenz-Liste führt weiter alle Layer mit ihrer Lizenz auf. Nur Layer mit Detailseite bekommen einen Link, die übrigen stehen als Text da. Die Regel „hat Detailseite“ steht an genau einer Stelle. Die Kiez-Listen bilden ihre Slugs mit `buildKiezSlugs`, wie Sitemap, OG und `entries`.

## Boundaries & Constraints

**Always:** Eine geteilte Funktion für „Layer hat Detailseite“, die alle bisherigen Kopien der Regel ersetzt. Kiez-Slugs Berlin-weit disambiguieren (über alle LOR-Features, nicht nur die des Bezirks). DE und EN verhalten sich gleich. Pragmatic TDD: erst roter Test, dann Fix.

**Never:** Keine Build-only-Layer aus der Lizenz-Liste entfernen (Lizenz-Transparenz). Keine neuen Detailseiten für Build-only-Layer. Keine Änderung an bestehenden, eindeutigen Kiez-Slugs (Canonical-Stabilität). Keine neuen UI-Texte.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Layer mit Seite | `mapRelevant: true` | Link auf `/layer/{slug}` bzw. `/en/layer/{slug}` | N/A |
| Build-only-Layer | `inspectorRelevant: false`, `mapRelevant: false` | Name als Text, kein `<a>` | N/A |
| Nur ein Flag false | `inspectorRelevant: false`, `mapRelevant` fehlt/true | Link (hat Seite) | N/A |
| Duplikat-Kiezname | „Heerstraße“ in Spandau und Charlottenburg-Wilmersdorf | Slugs `heerstrasse-spandau` / `heerstrasse-charlottenburg-wilmersdorf` | N/A |
| Eindeutiger Kiezname | „Charlottenburg Nord“ | Slug unverändert `charlottenburg-nord` | N/A |
| Score-Lookup | `kiez_score.slug = heerstrasse-spandau` | Composite wird gefunden (bisher `null`) | fehlender Score bleibt `null` |

</frozen-after-approval>

## Code Map

- `src/lib/data/get-layer-detail.ts:31` -- Regel `inspectorRelevant === false && mapRelevant === false` → `null`. Ort für die neue geteilte Funktion `hasLayerDetailPage(meta)`.
- `src/routes/(with-header)/layer/[slug]/+page.server.ts:31` -- `entries`-Filter, Kopie der Regel.
- `src/lib/seo/sitemap-builder.ts:195`, `src/lib/seo/llms-builder.ts:214` -- weitere Kopien der Regel.
- `src/routes/(with-header)/lizenzen/+page.svelte:155-165` -- Linkliste pro Lizenz; hier Link vs. Text.
- `src/routes/(with-header)/lizenzen/lizenzen-content.ts:86` `groupByLicense` -- bleibt unverändert (gruppiert weiter alle Layer).
- `src/routes/(with-header)/lizenzen/page.svelte.test.ts` -- bestehender Test-Stil (Fixture-Manifest, `a[href=...]`).
- `src/lib/data/get-kieze-in-bezirk.ts:59-77` `buildKiezeInBezirk` -- Slug per `normalizeSlug(name)`; Fix hier.
- `src/lib/data/internal/kiez-slug.ts` `buildKiezSlugs(refs: {name, bezirk}[])` -- wiederverwenden; `bezirk` darf der Bezirk-Slug sein (`normalizeSlug` ist idempotent).
- `src/lib/data/get-kieze-in-bezirk.test.ts` -- bestehende Tests, um Duplikat-Fall erweitern.
- Aufrufer `kiez/[slug]/+page.server.ts:170` und `bezirk/[slug]/+page.server.ts:132` -- Signatur bleibt, keine Änderung nötig.
- DB `kiez_score.slug` nutzt bereits die suffigierten Slugs (lokal geprüft).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/get-layer-detail.test.ts` -- Tests für `hasLayerDetailPage` (Matrix-Zeilen 1-3) -- Red.
- [x] `src/lib/data/get-layer-detail.ts` -- `hasLayerDetailPage` exportieren, `buildLayerDetail` nutzt sie -- eine Regel.
- [x] `layer/[slug]/+page.server.ts`, `sitemap-builder.ts`, `llms-builder.ts` -- Kopien durch `hasLayerDetailPage` ersetzen -- kein Drift.
- [x] `lizenzen/page.svelte.test.ts` -- Test: Build-only-Layer erscheint als Text ohne `<a>`, Layer mit Seite bleibt verlinkt -- Red.
- [x] `lizenzen/+page.svelte` -- Link nur bei `hasLayerDetailPage`, sonst `<span>` mit gleichem Namen.
- [x] `get-kieze-in-bezirk.test.ts` -- Duplikat- und Score-Lookup-Fall (Matrix-Zeilen 4-6) -- Red.
- [x] `get-kieze-in-bezirk.ts` -- Refs für alle Features bilden, `buildKiezSlugs` anwenden, dann nach Bezirk filtern.

**Acceptance Criteria:**
- Given ein Production-Build, when der Prerender-Crawler `/lizenzen`, `/en/lizenzen`, `/kiez/charlottenburg-nord` und `/bezirk/*` besucht, then meldet er kein 404 für `/layer/*` oder `/kiez/heerstrasse`.
- Given die Kiez-Seite eines Heerstraße-Nachbarn, when die Geschwister-Liste rendert, then zeigt der Link auf den suffigierten Slug, der als Seite existiert.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Evidenz | Route |
|---|---|---|---|---|
| Blind, Edge, VerifGap | `methodik/+page.svelte:30` behält Inline-Kopie der Build-only-Regel, kein Test | medium | Zeile 30 bestätigt; Tabelle verlinkt `/layer/{slug}`, Drift erzeugt wieder 404 | patch |
| Blind | `hasLayerDetailPage` liegt in schwerem Modul (`layer-explain`, `layer-methodology`, Atlas-Interna) | low | Imports in `get-layer-detail.ts:1-10` bestätigt; Methodik-Client-Seite würde sie mitladen | patch (mit Fund 1) |
| Edge, Blind, VerifGap | Kiez-Kandidaten verwerfen Features ohne Bezirk-Mapping, `kiez-slugs.ts` behält sie mit `bezirk: ''`; Reader weichen ab (numerischer BEZ, `name`-Key) | medium | `kiez-slugs.ts:50-58` bestätigt; heutige Daten konsistent, Drift-Risiko real | patch (+ Paritätstest gegen echte Daten) |
| Edge, Blind, VerifGap | Lizenz-Test: Span-Assertion zu schwach, kein EN-Lauf | low | Test prüft nur „irgendein Span mit Text“, kein `overwriteGetLocale('en')` | patch |
| VerifGap | Prerender-404 bricht den Build nicht, kein CI-Check | medium | `svelte.config.js` `handleHttpError` nur `console.warn`; vorbestehend, nicht durch diese Änderung | defer |
| Blind | DataCatalog-JSON-LD lässt Build-only-Layer weg, sichtbare Liste zeigt sie | false | Bestehende, dokumentierte Entscheidung (`lizenzen/+page.ts:12-16`): Dataset-`@id` darf nicht auf 404 zeigen | reject |
| Blind | AC 2 ohne Test auf Loader-Ebene | low | Helper-Tests + neuer Paritätstest decken Slug-Gleichheit; Loader reicht Slugs nur durch | reject |
| Blind | TDD-Spur nicht im Commit sichtbar | low | Red-Läufe im Implementierungsbericht belegt; Commit folgt nach Review | reject |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/data "src/routes/(with-header)/lizenzen" src/lib/seo` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build 2>&1 | grep '\[prerender\] 404'` -- expected: keine Treffer für `/layer/` oder `/kiez/heerstrasse`
