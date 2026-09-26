---
title: 'i18n Block B2: Shell und Startseite auf Englisch'
type: 'feature'
created: '2026-09-26'
status: 'in-progress'
baseline_commit: '0f2b46b88e1b37e0c7bf2cd9836945dc6ecadb65'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b-wahlportal.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Header, Mobile-Drawer, Footer, Meta-Links und Startseite sind auf allen `/en`-Seiten deutsch, obwohl sie außerhalb von `<main lang>` unter `<html lang="en">` stehen (WCAG 3.1.1). Interne Links der Shell und der Startseite führen von `/en` zurück auf DE (deferred aus Block A).

**Approach:** Shell- und Startseiten-Texte in Paraglide-Messages extrahieren und übersetzen (~150 bis 175 Keys, Muster Block B), interne Links über `localizedHref`, Top-Level-Konstanten (`meta-links.ts`, Home-Content-Module) zu Funktionen bzw. Label-Keys umbauen. Branch `feat/i18n-en`, Merge erst nach verifiziertem Launch.

## Boundaries & Constraints

**Always:**
- Entscheidungen Matze (Block B): Glossar (Kiez/Bezirk deutsch, Wahlbegriffe/Behörden wie Block B), übersetzte Seiten ohne Übersetzungs-Hinweis, kein Sprachzusatz an Links, DE-Ausgabe Zeichen für Zeichen gleich.
- Geteilte Bausteine (`address-search`, `KiezScoreRing`, `data-table-alternative`, `editorial-disclaimer`) behalten DE-Defaults; Shell und Startseite übergeben Labels per Prop (Lehre Block-B-Review #2).
- Datenschlüssel bleiben: Meta-Link-Gruppen bekommen eine feste `id` (Kontakt-Link hängt heute an `title === 'Sonstiges'`), Quick-Link-`query`, Update-`category`-Slugs, Wahl-Slugs, Query-Parameter (`?finder=1`, `?view=bezirke`, `&mode=hitze`), Plausible-Events.
- Datum über `src/lib/i18n/format.ts`; Update-Kategorien über Label-Map.
- TDD pro AC.
- Entscheidung Matze 26.09. 22:32 (1A): Shell (Header, Drawer, Footer, Skip-Link) ist auf allen `/en`-Seiten englisch, auch auf nicht übersetzten (WCAG 3.1.1, konsistente Navigation).
- Entscheidung Matze 26.09. 22:32 (2A): Startseite wird als übersetzt registriert (`{ pathname: '/', locale: 'en' }` ohne `prefix`). Update-Titel/-Summaries nutzen `title_en`/`summary_en`, wo vorhanden, sonst DE mit `lang="de"` am Element; Kiez-Profil-Auszüge ohne EN-Fassung ebenso mit `lang="de"`.

**Never:**
- Kein Atlas `/explore` inkl. Bookmark-Dialog (B3), keine Kiez/Bezirk/Layer-Detailseiten (B4), keine Fließtexte/Profile/Update-Bodies, keine OG-Karten (Block C).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/` und beliebige DE-Seite | Shell und Startseite wie vor B2 | N/A |
| EN-Shell | `/en/berlin-wahlen` | Header, Drawer, Footer englisch | N/A |
| EN-Links | Footer-Link „Methodology“ auf `/en/...` | Ziel `/en/methodik` | N/A |
| Kontakt-Link | Footer/Drawer auf `/en` | Kontakt-Link vorhanden (Gruppen-`id`, nicht Titel) | N/A |
| Quick-Link | EN-Startseite Quick-Link | Label englisch, `?q=` unverändert deutsch | N/A |
| Geteilter Baustein | `address-search` auf nicht übersetzter DE-Fallback-Seite ohne Prop | DE-Default | N/A |
| Startseite EN | `/en` | indexierbar, hreflang de/en/x-default, DE-Update-Titel mit `lang="de"` | N/A |
| Key-Parität | Key nur in `de.json` | Paritätstest schlägt an | Test |

</frozen-after-approval>

## Code Map

- Shell: `src/lib/components/atlas/site-header.svelte` (~9 Strings, Layer-/Bookmark-Trigger mit Zahl-Parameter, `AddressSearch variant="header"` ohne Placeholder-Prop :136, Links `/` :92, `/explore?finder=1` :72), `address-search-overlay.svelte` (2), `mobile-meta-drawer.svelte` (4, `group.title === 'Sonstiges'` :86), `meta-footer.svelte` (3 + Claim, :67), `internal/meta-links.ts` (14 Labels, 21 hrefs, Top-Level-Konstanten), `skip-link.svelte` (1), `internal/social-links.svelte` (4 aria-labels → 1 Key mit Parametern), `src/routes/+layout.svelte:88-89` (WebSite-JSON-LD-Beschreibung).
- `address-search.svelte` -- zusätzlich hart deutsch ohne Prop: „Adresse nicht gefunden …“ :109, „Keine Vorschläge“/„{n} Vorschläge“ :116 → neue Props mit DE-Default; Header, Overlay, Startseite und Wahlportal übergeben EN.
- Startseite: `src/routes/(with-header)/+page.svelte` (SEO :31-36), `+page.server.ts:180-183` (Updates `title_de`/`summary_de`), Komponenten unter `src/lib/components/home/` (hero 5, featured-score 2, finder-teaser 11, hook 4, steps 8, quick-links 2, wahl-teaser ~10, hitze-teaser 5, featured-bezirke 3, top-kieze 3, layer-teasers 2, updates-teaser 2 + Datum :26 + Kategorie, open-block 3), `atlas/charts/kiez-score-ring.svelte` (`DIMENSION_LABELS_DE`, „Gesamt“ :111/121 → Props).
- Content-Module `src/lib/content/home-layer-teasers.ts`, `home-featured-bezirke.ts`, `home-data-sources.ts`, `home-quick-links.ts` (`query` bleibt), `screenshot-manifest.ts` (~34 Texte, Top-Level).
- Links: alle festen Pfade der Startseite (hero, finder, hook, quick-links, wahl, hitze inkl. `buildExplorerDeepLink`, bezirke, top-kieze, layer, updates, open-block, featured `exploreHref` aus `+page.server.ts:124`).
- `src/lib/seo/translation-register.ts` -- Startseite ggf. `{ pathname: '/', locale: 'en' }` ohne `prefix`.
- Tests mit DE-Texten (~20 bis 30): `meta-footer.svelte.test.ts`, `site-header.svelte.test.ts:185`, `skip-link.svelte.test.ts`, `address-search.svelte.test.ts`, `home-*.svelte.test.ts`, `tests/e2e/tab-order.e2e.ts:36,44`, `i18n-routing.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [ ] `meta-links.ts` + Content-Module auf Funktionen/Label-Keys, Gruppen-`id` (+ Tests)
- [ ] Shell-Komponenten auf Messages, Links über `localizedHref` (+ Tests)
- [ ] `address-search`/`KiezScoreRing`: neue Label-Props mit DE-Default; Aufrufer übergeben Messages (+ Tests)
- [ ] Startseiten-Komponenten + SEO auf Messages, Datum/Kategorie über Formatter/Label-Map, Links über `localizedHref` (+ Tests)
- [ ] Register und e2e laut Entscheidungen; Key-Parität, `lint:wahl`
- [ ] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/berlin-wahlen`, when die Seite lädt, then sind Header, Drawer und Footer englisch, und jeder interne Shell-Link zeigt auf `/en/…`.
- Given `/en`, when die Startseite lädt, then sind alle UI-Texte englisch (außer Glossar, Eigennamen, Parteinamen und laut Entscheidung markierten DE-Inhalten).
- Given die DE-Seiten, when die bestehenden Tests laufen, then sind sie unverändert grün.

## Implementation Notes

- 26.09. 22:17 Start Planung, 22:17-22:21 Inventur (1 Subagent), 22:32 Fragen entschieden (1A, 2A), 22:33 Checkpoint 1 freigegeben (Matze).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build`, Preview, `i18n-routing.e2e.ts`, `tab-order.e2e.ts`, `a11y.e2e.ts` -- expected: grün (bekannte a11y-Fails ausgenommen)
