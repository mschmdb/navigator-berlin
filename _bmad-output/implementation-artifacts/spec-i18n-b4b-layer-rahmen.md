---
title: 'i18n Block B4b: Rahmen der Layer-Detailseite auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/layer/[slug]` zeigt den Seitenrahmen deutsch. Betroffen sind Titel, Description-Fallback, ogAlt, Breadcrumb „Daten“, Kartenüberschriften (Quelle, Werte, Berechnung, Coverage-Lücken, „Was wir NICHT zeigen“, Verwandte Layer), dt-Labels, Methodik-Aside, Leerzustand, Hitze-CTA, Karten-Link und `error-feedback-mailto`. Dazu kommen `toLocaleString('de-DE')` und Links ohne `/en`. Der Layer-Name kommt serverseitig immer deutsch (`get-layer-detail.ts` ruft `getLayerDisplayName(slug)` ohne Locale).

**Approach:** Wir stellen den Rahmen nach dem B4a-Muster auf Paraglide-Messages um und ergänzen EN. Dazu gehören `localizedHref` für interne Links, `format.ts` für Zahlen, ein locale-fähiger Layer-Name und `lang="de"` an Inhalten, die bis Block C deutsch bleiben.

## Boundaries & Constraints

**Always:**
- Freigabe und Entscheidungen durch Koordinator, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“).
- B4a-Linie:
  - en-GB, Sentence Case, DE-Ausgabe Zeichen für Zeichen gleich.
  - Geteilte Helfer mit DE-Default.
  - Server liefert Schlüssel, Client baut Labels.
- Koordinator-Entscheidung, Matze AFK: Auf `/en` bekommen die deutsch bleibenden Inhalte `lang="de"`. Das sind `explain.long`/`short`/`valueScaleExplain`, `methodology.calculation`/`coverageGaps`/`omissions`/`authority`/`updateFrequency`/`aggregationLevel`, `EditorialDisclaimer`-Section und FAQ. Auch der Description-Fallback bleibt nur dann deutsch, wenn er aus `explain.short` kommt.
- Koordinator-Entscheidung, Matze AFK: Der Mail-Body von `buildErrorReportMailto` bleibt deutsch, er geht an die Redaktion. Übersetzt werden nur sichtbarer Text und Aria-Label.
- Koordinator-Entscheidung, Matze AFK: `meta.bundleGroup` im Eyebrow läuft über `bundleLabel(bundle, opts)`, wenn der Wert ein `Bundle`-Schlüssel ist. Sonst bleibt er roh. JSON-LD-`keywords` bleiben roh.
- Unverändert bleiben: Slugs, Lizenz-IDs, `sourceUrl`, `?layers=`-Parameter, Testids, OG-Pfade, `inLanguage` `de-DE` (wie B4a), `formatYearMonth` (sprachneutral `YYYY-MM`).
- TDD pro AC.

**Never:**
- Keine Übersetzung von layer-explain-Fließtext, layer-methodology-Inhalten, `EditorialDisclaimer`, FAQ-Inhalten (Block C). Kein KI-Export (D).
- Kein Register-Eintrag `/layer` (nach Block C).
- Keine EN-OG-Bilder.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/layer/<slug>` mit und ohne Methodik | Rahmen, Zahlen, Meta wie vor B4b | N/A |
| EN-Rahmen | `/en/layer/<slug>` mit Methodik | Überschriften, dt-Labels, Aside, Karten-Link englisch; Layer-Name EN; Features `12,345` | Inhalte DE mit `lang="de"` |
| EN-Leerzustand | `/en/layer/<slug>` ohne Methodik | „Methodology in preparation…“, Mailto-Label EN, Mail-Body DE | N/A |
| EN-Links | Verwandte Layer, Methodik, Lizenzen, Hitze, Karte | Ziel unter `/en/…`, `?layers=` erhalten | N/A |
| Eigene Berechnung | `sourceUrl` `https://navigator.berlin/derived…` | EN-Satz mit lokalisiertem Lizenzen-Link | N/A |
| Unbekannter Slug | `/en/layer/gibtsnicht` | 404 mit EN-Meldung | DE-Route: DE-Meldung |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/layer/[slug]/+page.svelte` (319):
  - Titel :28, Description-Fallback :31/:45 (doppelt, eine Message), ogAlt :75, Breadcrumb :62.
  - Eyebrow `meta.bundleGroup` :87, Hitze-CTA :101/:105, Quelle-Karte :121-154 (Anbieter, Eigene Berechnung + Lizenzen-Link über `resolve`, Lizenz, Datenstand, Features `toLocaleString('de-DE')` :154).
  - Werte :160-167, Berechnung/Aggregation/Pflege/Aktualisierung :184-201, Coverage-Lücken :217, „Was wir NICHT zeigen“ :237, Verwandte Layer :257-266 (Href roh, `getLayerDisplayName` ohne opts).
  - Methodik-Aside :277-282, Leerzustand :291-298, Karten-Link :315 (`inspectorHref` über `resolve`, auf `localizedHref` umstellen, Query erhalten).
  - JSON-LD-Kommentar :34-38 veraltet.
- `+page.server.ts`: 404-Text :54 (Muster B4a `m.*_not_found`), FAQ bleibt `locale: 'de'`.
- `src/lib/data/get-layer-detail.ts:34`: `layerName` auf `getLayerDisplayName(slug, { locale })`, die Locale kommt vom Aufrufer. Die Funktion bekommt laut Inventur bereits `getLocale()`.
- `src/lib/components/atlas/error-feedback-mailto.svelte` (30): Aria-Label, sichtbarer Text.
- Wiederverwenden: `format.ts::formatCount`, `localized-href.ts`, `layer-palette-filter.ts::getLayerDisplayName`/`bundleLabel`, `toAtlasMessageOptions`. Key-Präfix `layer_page_*`.
- Tests:
  - Unit: `layer/[slug]/page.svelte.test.ts` (211, DE-Assertions), `get-layer-detail.test.ts`, `error-feedback-mailto.svelte.test.ts`.
  - e2e: `layer-explain-coverage.e2e.ts`. Neu: Fälle in `tests/e2e/i18n-profile-frame.e2e.ts` oder eine eigene Datei `i18n-layer-frame.e2e.ts` (EN + DE-Kontrolle, Layer mit und ohne Methodik).

## Tasks & Acceptance

**Execution:**
- [ ] `get-layer-detail.ts`: locale-fähiger `layerName` (+ Test)
- [ ] `+page.server.ts`: 404 lokalisiert
- [ ] `error-feedback-mailto.svelte`: Messages, Mail-Body unverändert (+ Tests)
- [ ] `layer/[slug]/+page.svelte`: Rahmen auf Messages, `bundleLabel`, `formatCount`, `localizedHref`, `lang="de"` an DE-Inhalten, Kommentar aktualisieren (+ Tests EN/DE)
- [ ] e2e EN + DE-Kontrolle, Key-Parität, `lint:wahl`. In `deferred-work.md`: Register `/layer` nach Block C.
- [ ] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/layer/<slug>`, when die Seite lädt, then sind Rahmen und Layer-Name englisch, alle internen Links zeigen auf `/en/…` und deutsche Inhalte tragen `lang="de"`.
- Given die DE-Route, when die bestehenden Tests laufen, then sind sie grün und die DE-Ausgabe ist unverändert.

## Implementation Notes

- 27.09. 05:52 Start Planung, 05:52-05:55 Inventur (Koordinator direkt, kleiner Scope), 05:57 Checkpoint 1 durch Koordinator (Matze AFK).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-layer-frame` (bzw. erweiterte Datei), `i18n-profile-frame`, `i18n-routing`, `layer-explain-coverage` -- expected: grün
