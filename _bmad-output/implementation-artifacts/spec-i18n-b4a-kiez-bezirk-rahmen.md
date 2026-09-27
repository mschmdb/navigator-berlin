---
title: 'i18n Block B4a: Rahmen der Kiez- und Bezirk-Seiten auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/kiez/[slug]` und `/en/bezirk/[slug]` zeigen den Seitenrahmen deutsch. Betroffen sind Titel, Meta-Description, Hero, Steckbrief, Vergleichstabelle, Wahlverlauf, Listen, Breadcrumb und FAQ-Überschrift, zusammen rund 110 bis 140 Strings. Dazu kommen feste `de-DE`-Formate. Die internen Links führen ohne `/en`.

**Approach:** Wir stellen den Rahmen nach dem Muster aus Block B (`berlin-wahlen/[slug]`) und B3b/B3c auf Paraglide-Messages um und ergänzen EN. Der Server liefert Schlüssel, der Client baut die Labels. Geteilte Helfer bekommen `opts` mit DE-Default, Links laufen über `localizedHref`.

## Boundaries & Constraints

**Always:**
- Freigabe und Entscheidungen durch Koordinator, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“).
- B3-Linie:
  - en-GB, Sentence Case.
  - „Kiez“/„Bezirk“ bleiben deutsch, „Ortsteil“ → „locality“.
  - Geschlossene Kategorien übersetzen, Rohwerte roh.
  - DE-Ausgabe Zeichen für Zeichen gleich.
  - Geteilte Helfer mit DE-Default.
- Koordinator-Entscheidung, Matze AFK: Die Split-Grenze liegt beim Layer. B4a umfasst Kiez, Bezirk und ihre geteilten Komponenten. B4b (`/layer/[slug]` samt Dataset-JSON-LD) kommt nach `deferred-work.md`.
- Koordinator-Entscheidung, Matze AFK: Die Steckbrief-Describer in `faq-helpers/*.ts` bekommen `opts` mit DE-Default. Der Server-FAQ-Renderer ruft sie weiter ohne `opts` auf und bleibt deutsch.
- Koordinator-Entscheidung, Matze AFK: `score-comparison-table` erkennt die Kriminalitäts-Zeile am Schlüssel, nicht am Label. Mit Übersetzung würde der Label-Abgleich brechen.
- Datenschlüssel bleiben unverändert: Slugs, `SCORE_DIMS`-Keys, `pageType`, `bundleGroup`, Lizenz-IDs, Parteikürzel, Testids, JSON-LD-Property-Namen, OG-Bildpfade, Eigennamen.
- `#each`-Keys auf IDs. TDD pro AC.

**Never:**
- Keine Profil-Prosa (`src/lib/content`), keine FAQ-Frage/-Antwort-Inhalte aus `faq_qna`, kein `EditorialDisclaimer`, keine Methodik-Seiten (Block C). Kein KI-Export (D).
- Kein `/layer` (B4b).
- Koordinator-Entscheidung, Matze AFK: Keine Register-Einträge für `/kiez` und `/bezirk`. Solange Prosa und FAQ deutsch sind, zeigen die EN-Seiten den Fallback-Hinweis und bleiben noindex. Registrierung nach Block C.
- Keine EN-OG-Bilder (vorgeneriert, eigener Schritt, deferred).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/kiez/alexanderplatz`, `/bezirk/mitte` | Rahmen, Zahlen, Meta wie vor B4a | N/A |
| EN-Kiez | `/en/kiez/alexanderplatz` | Titel, Description, Hero, Steckbrief, Vergleich, Wahlverlauf, Geschwister, Breadcrumb, FAQ-Überschrift englisch; Zahlen `12,345` | Prosa/FAQ-Inhalt DE mit Fallback-Hinweis |
| EN-Bezirk | `/en/bezirk/mitte` | Hero, Kiez-Liste, Vergleich englisch | wie oben |
| EN-Links | interne Links auf `/en/…` | Breadcrumb, Kiez-/Bezirk-Links, Methodik, Rang-Link unter `/en` | N/A |
| Kriminalität | Vergleichstabelle EN | Fußnote bleibt an der Kriminalitäts-Zeile | N/A |
| Unbekannter Slug | `/en/kiez/gibtsnicht` | 404 mit EN-Meldung | DE-Route: DE-Meldung |
| Server-FAQ | FAQ-Renderer ohne `opts` | unverändert DE | N/A |

</frozen-after-approval>

## Code Map

- Routen `src/routes/(with-header)/`:
  - `kiez/[slug]/+page.svelte` (~10: Titel, Description-Template, ogAlt, `Intl('de-DE')`, Methodik-Link, Breadcrumb-Hrefs).
  - `kiez/[slug]/+page.server.ts` (`SCORE_DIMS` mit DE-Labels :97-108 → nur Keys liefern, 404-Text). FAQ bleibt `locale: 'de'`, Kommentar „Phase 1 DE-only“ aktualisieren.
  - `bezirk/[slug]/+page.svelte` (~7) und `+page.server.ts` (`SCORE_DIMS` :12-22, 404): analog.
- Komponenten `src/lib/components/atlas/`:
  - `kiez-hero.svelte` (~30: Lead, Eyebrow, Dimensionen über `dimensionLabel`, Steckbrief, Cluster-Namen, Zählerlabels, Quelle, FAQ-Platzhalter, `formatStand` → `format.ts`).
  - `bezirk-hero.svelte` (~20): Keys mit `kiez-hero` teilen.
  - `score-comparison-table.svelte` (~10): `isKriminalitaet(row.label)` → `key`, `ComparisonDimRow` bekommt `key`.
  - `kiez-wahl-verlauf` (6), `bezirk-kieze-list` (3), `kiez-siblings-list` (1), `breadcrumb` (aria „Brotkrumen“, Hrefs), `score-rank-link` (2), `faq-section` (Überschrift, Methodik-Satz; FAQPage-JSON-LD folgt dem DE-Inhalt), `error-feedback-mailto` (2).
- Helfer:
  - `src/lib/data/rank-format.ts` (2), `source-label.ts` (liest `LAYER_EXPLAIN_DE` direkt → `getLayerDisplayName(slug, opts)`), `steckbrief-extras.ts` (`de-DE`).
  - `src/lib/data/faq-helpers/{laerm,gruen,klima,oepnv,wohnen}.ts`: 14 `*De`-Describer, `opts?` mit DE-Default. Server-Nutzer `src/lib/server/faq/template-renderer.ts` bleibt unverändert.
- Wiederverwenden:
  - `format.ts`, `localized-href.ts`, `wahl-labels.ts`, `kiez-score-display.ts::dimensionLabel`/`scaleFor`, `atlas-label-options.ts`.
  - Muster aus `berlin-wahlen/[slug]/+page.svelte`: `m.*` für Meta, `localizedHref`, `inLanguage` über `localeToBcp47(resolveEffectiveLocale(…))`.
  - Key-Präfixe `profile_*` (geteilt Kiez/Bezirk), `kiez_page_*`, `bezirk_page_*`, `steckbrief_*`.
- Tests:
  - Unit: `kiez-hero`, `bezirk-hero`, `score-comparison-table`, `kiez-siblings-list`, `bezirk-kieze-list`, `breadcrumb`, `score-rank-link`, `faq-section`, `error-feedback-mailto`, `jsonld-*`, Key-Parität.
  - e2e: `i18n-routing.e2e.ts` öffnet `/en/kiez/alexanderplatz` bereits. Neu: `tests/e2e/i18n-profile-frame.e2e.ts` für Kiez + Bezirk, EN + DE-Kontrolle.

## Tasks & Acceptance

**Execution:**
- [ ] Helfer `rank-format`, `source-label`, `steckbrief-extras`, `faq-helpers/*`: `opts` mit DE-Default, Formate über `format.ts` (+ Tests, Server-FAQ unverändert)
- [ ] `+page.server.ts` Kiez/Bezirk: Keys statt DE-Labels, 404 lokalisiert (+ Tests)
- [ ] `kiez-hero`, `bezirk-hero`: auf Messages (+ Tests EN/DE)
- [ ] `score-comparison-table` (Key-Abgleich), `kiez-wahl-verlauf`, Listen, `breadcrumb`, `score-rank-link`, `faq-section`, `error-feedback-mailto`: auf Messages, Links über `localizedHref` (+ Tests)
- [ ] `+page.svelte` Kiez/Bezirk: Meta, ogAlt, Zahlen, Links, `inLanguage` (+ Tests)
- [ ] e2e `i18n-profile-frame.e2e.ts`, Key-Parität, `lint:wahl`. In `deferred-work.md`: B4b Layer, EN-OG-Bilder, Register `/kiez` + `/bezirk` nach Block C.
- [ ] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/kiez/<slug>`, when die Seite lädt, then ist der Rahmen englisch, alle internen Links zeigen auf `/en/…` und `<html lang>`/`inLanguage` stehen auf `en`.
- Given `/en/bezirk/<slug>`, when die Seite lädt, then sind Hero, Kiez-Liste und Vergleichstabelle englisch.
- Given die DE-Routen und der Server-FAQ-Renderer, when die bestehenden Tests laufen, then sind sie grün und die DE-Ausgabe ist unverändert.

## Implementation Notes

- 27.09. 04:52 Start Planung, 04:52-04:54 Inventur (1 Subagent), 04:55 Split B4a/B4b und Checkpoint 1 durch Koordinator (Matze AFK).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-profile-frame`, `i18n-routing`, `i18n-inspector`, `i18n-finder-compare` -- expected: grün
