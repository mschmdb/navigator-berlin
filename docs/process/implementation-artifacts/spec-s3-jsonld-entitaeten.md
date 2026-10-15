---
title: 'S3: JSON-LD-Entitäten (WebSite, Organization, Kiez/Bezirk als eine Entität)'
type: 'refactor'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'c59839ccf37f3505abf5308bdd2affd736c3f562'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/implementation-artifacts/seo-investigation-s2-s5.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Startseite gibt zwei WebSite-Blöcke mit zwei verschiedenen SearchAction-Zielen aus (`/?address=`, `/explore?address=`); keines ist eine Textsuche (`address` erwartet Koordinaten), und das Layout gibt den WebSite-Block zusätzlich auf jeder Seite aus. Es gibt keine `Organization`, Publisher werden in drei Buildern inline wiederholt. Kiez- und Bezirksseiten beschreiben denselben Ort als zwei getrennte Top-Level-Entitäten (`Place` und `AdministrativeArea`) ohne `@id`; der Bezug zum Bezirk ist nur ein Name.

**Approach:** Ein WebSite-Block nur auf der Startseite (DE und EN), ohne SearchAction, mit `publisher` → `Organization` (`@id` `https://navigator.berlin/#organization`, Name, URL, Logo als PNG). Andere Builder verweisen per `@id` auf diese Organization. Kiez und Bezirk werden je eine `AdministrativeArea` mit `@id` `<canonical>#place`; Kiez verweist mit `containedInPlace` per `@id` und `url` auf die Bezirksseite. Bezirke behalten `sameAs` (Wikidata/Wikipedia).

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Keine SearchAction (Google hat die Sitelinks-Searchbox eingestellt; die vorhandenen Ziele funktionieren nicht als Textsuche).
- Kieze bekommen kein `sameAs` (bewusste frühere Entscheidung: LOR-Bezirksregion ≠ Ortsteil, Kommentar in `bezirk-sameas.ts`).
- Logo-PNG 512×512 aus `static/logo-pixel.svg` per Skript erzeugt und committet (`static/logo-organization.png`), nicht zur Laufzeit.

## Boundaries & Constraints

**Always:** Bestehende Builder umbauen statt neue parallele schreiben. `inLanguage` bleibt je Seite korrekt. Tests zuerst. E2E, die bisher `website-jsonld` auf anderen Seiten lesen, auf einen vorhandenen Block (z. B. Breadcrumb) oder die Startseite umstellen.

**Never:** Keine Änderung an Dataset (S4), Sitemap (S5), Titeln (S6). Keine erfundenen Organisationsdaten (nur Name, URL, Logo).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Startseite | `/`, `/en` | genau ein WebSite-Block ohne `potentialAction`, `publisher.@id` = Organization; Organization-Block mit Logo | N/A |
| Unterseite | `/methodik` | kein WebSite-Block | N/A |
| Kiez | `/kiez/reuterstrasse` | genau eine `AdministrativeArea`, `@id` `…/kiez/reuterstrasse#place`, `containedInPlace.@id` `…/bezirk/neukoelln#place` | N/A |
| Bezirk | `/bezirk/pankow` | eine `AdministrativeArea` mit `@id`, `sameAs` Wikidata | N/A |
| EN | `/en/kiez/…` | `@id` mit `/en/`-Pfad, `containedInPlace` auf `/en/bezirk/…` | N/A |
| Publisher | BlogPosting, Dataset, DataCatalog | `publisher`/`creator`-Verweis `{"@id": ".../#organization"}` wo bisher navigator.berlin inline stand | N/A |

</frozen-after-approval>

## Code Map

Siehe `seo-investigation-s2-s5.md`, Abschnitt S3: `src/routes/+layout.svelte:86-94,111`, `(with-header)/+page.svelte:42-50,61`, `src/lib/seo/jsonld-website.ts:23,53-73`, `src/lib/seo/index.ts:23-27`; Inline-Publisher `jsonld-blog-posting.ts:57-63`, `jsonld-dataset.ts:67-69`, `jsonld-datacatalog.ts:102-104`; `jsonld-place.ts:60-107`, `jsonld-administrative-area.ts:22-28`; Kiez `kiez/[slug]/+page.svelte:71-101,126-127`, Bezirk `bezirk/[slug]/+page.svelte:65-96,120-121`; `src/lib/seo/sources/bezirk-sameas.ts`; Logo-Rendering mit `@resvg/resvg-js` (`src/lib/server/og/logo-loader.ts`). Tests: `jsonld-website.test.ts`, `jsonld-place.test.ts`, `jsonld-administrative-area.test.ts`, E2E `i18n-routing.e2e.ts:262-290,684-690`, `i18n-profile-frame.e2e.ts:351-369`. Absolute URLs nur über `localizedPathname` (S1-Guard in `jsonld-breadcrumb.ts` als Vorbild).

## Tasks & Acceptance

**Execution:**
- [x] Neuer Builder `jsonld-organization.ts` + Test; Logo-Skript + PNG.
- [x] `jsonld-website.ts` + Test -- ohne SearchAction, mit `publisher`-Verweis; Layout-Block entfernen, Startseite gibt WebSite + Organization aus.
- [x] Publisher-Verweise in BlogPosting, Dataset, DataCatalog + Tests.
- [x] Place/AdministrativeArea zu einer Entität mit `@id` und `containedInPlace` + Tests; Kiez- und Bezirksseite anpassen.
- [x] E2E anpassen (`i18n-routing`, `i18n-profile-frame`), neuer E2E-Fall: Startseite genau ein WebSite-Block, Kiez genau eine `AdministrativeArea`.

**Acceptance Criteria:**
- Given eine beliebige Seite außer der Startseite, when man die JSON-LD-Blöcke zählt, then gibt es keinen WebSite-Block und keine SearchAction.

## Implementation Notes

- Neu: `jsonld-organization.ts` (`@id` `/#organization`, Logo `static/logo-organization.png` 512×512 aus `logo-pixel.svg`, `description`, `sameAs` nur Projekt-Repository), `organization-logo.ts` (gemeinsame Konstanten), Skript `pnpm logo:organization` mit Byte-Vergleichstest.
- `organizationRef` liefert `@type`, `@id`, `name`, `url`; genutzt von BlogPosting, Blog, Dataset-Fallback, DataCatalog-Fallback, Hitze, Score, Methodik.
- WebSite nur auf der Startseite, ohne SearchAction, mit `@id` `/#website`; Layout-Block entfernt.
- Kiez/Bezirk: eine `AdministrativeArea`, `@id` sprachunabhängig, `containedInPlace` per `@id` auf den Bezirk (Slug aus Seitendaten), Bezirk → `City` Berlin (Wikidata Q64); `canonicalOrigin` in Place/WebSite.
- Nebenbei: Klartext-Lint lässt `localizedPathname(...)` zu (separater Commit, Regression aus S1).
- Verifikation: Unit 5.885 grün (inkl. `scripts`), `pnpm check` 0, Build ohne Fehler, E2E 177/177 (eine veraltete Erwartung im neuen S3-Test angepasst).

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, VerifGap | Nackte `@id`-Verweise ohne Organization-Knoten auf der Seite (author.name fehlt) | high | patch (Ref mit `@type`, `name`, `url`) |
| VerifGap | Hitze, Score, Methodik geben weiter Inline-Organization aus | medium | patch |
| Blind, Edge | Place-`@id` je Sprache verschieden | medium | patch |
| Edge | `@id`/`url` aus roher Origin (Hitze-Subdomain) | low | patch |
| Edge | `containedInPlace` über `normalizeSlug(bezirkName)` | medium | patch |
| Blind, Edge | `containedInPlaceRef` ohne Name verworfen | low | patch |
| Blind | Bezirk → Berlin ohne Identität | low | patch (Wikidata Q64) |
| Blind | Organization ohne `sameAs`/`description` | medium | patch (nur vorhandene Links) |
| Blind | WebSite ohne `@id` | low | patch |
| Blind, Edge, VerifGap | Logo nicht quadratisch erzwungen, Konstante doppelt, PNG kann veralten | low | patch |
| Blind, Edge | Tote Importe, verwaiste Message | low | patch |
| Blind, Edge | Effektive-Locale-Prüfung im JSON-LD entfallen | low | patch |
| Edge | Leerer Slug im Ref | low | reject: Slugs stammen aus `buildKiezSlugs`, nie leer |

## Verification

**Commands:**
- `pnpm exec vitest run src` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat (Log ohne `[500]`/`Cannot access`), Preview 4173, Playwright mit temporärer Config; `static/kiez-scores/region-composites.json` zurücksetzen -- expected: grün
