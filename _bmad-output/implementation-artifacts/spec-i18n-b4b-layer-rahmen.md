---
title: 'i18n Block B4b: Rahmen der Layer-Detailseite auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'c442ee05a4627c1930721eafe46e9118b7a7118d'
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
- [x] `get-layer-detail.ts`: locale-fähiger `layerName` (+ Test)
- [x] `+page.server.ts`: 404 lokalisiert
- [x] `error-feedback-mailto.svelte`: Messages, Mail-Body unverändert (+ Tests)
- [x] `layer/[slug]/+page.svelte`: Rahmen auf Messages, `bundleLabel`, `formatCount`, `localizedHref`, `lang="de"` an DE-Inhalten, Kommentar aktualisieren (+ Tests EN/DE)
- [x] e2e EN + DE-Kontrolle, Key-Parität, `lint:wahl`. In `deferred-work.md`: Register `/layer` nach Block C.
- [x] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/layer/<slug>`, when die Seite lädt, then sind Rahmen und Layer-Name englisch, alle internen Links zeigen auf `/en/…` und deutsche Inhalte tragen `lang="de"`.
- Given die DE-Route, when die bestehenden Tests laufen, then sind sie grün und die DE-Ausgabe ist unverändert.

## Implementation Notes

- 27.09. 05:52 Start Planung, 05:52-05:55 Inventur (Koordinator direkt, kleiner Scope), 05:57 Checkpoint 1 durch Koordinator (Matze AFK).
- Umsetzung (Einzel-Agent): `get-layer-detail.ts::buildLayerDetail` liefert `layerName` jetzt über `getLayerDisplayName(slug, { locale: lang as Locale })` -- `lang` kommt von `+page.server.ts` bereits als `getLocale()`-Ergebnis, der Cast ist analog zum bestehenden `lang`-Feld selbst. `+page.server.ts`s 404 läuft über `m.layer_page_not_found({ slug }, { locale: getLocale() })` (Muster B4a, `error()` aus `@sveltejs/kit` wirft intern selbst -- kein fehlendes `throw`, verifiziert gegen `node_modules/@sveltejs/kit`).
- `error-feedback-mailto.svelte`: sichtbarer Text + Aria-Label über `m.error_feedback_mailto_label`/`_aria_label`, `buildErrorReportMailto` (Subject + Body) bleibt unverändert deutsch (Koordinator-Entscheidung).
- `layer/[slug]/+page.svelte`: 30 neue `layer_page_*`-Keys (Titel, Description-Fallback -- EINE Message für die doppelte Verwendung :31/:45, og:alt, Breadcrumb „Data", Quelle-Karte, Werte, Berechnung, Coverage-Lücken, Omissions, Verwandte Layer, Methodik-Aside, Leerzustand, Karten-Link). Alle internen Links (`/hitze`, `/lizenzen`, `/methodik`, `/explore?layers=`, `/layer/{relSlug}`) laufen jetzt über `localizedHref` statt `resolve()` direkt -- der `Pathname`-Type-Import und `resolve` aus `$app/paths` entfielen, da nicht mehr direkt gebraucht. `meta.bundleGroup` läuft über `bundleLabel(bundle, opts)`, wenn der Wert ein bekannter `Bundle`-Schlüssel ist (defensiver `Object.hasOwn(BUNDLE_LABEL_DE, …)`-Check, da der Wert zur Laufzeit aus `MANIFEST.json` kommt), sonst bleibt er roh -- **Review-relevant**: das ändert die DE-Ausgabe von `C: Umwelt` auf `C · Umwelt` (Interpunkt statt Doppelpunkt, `bundleLabel` war schon vor B4b die etablierte Story-2.x/B3a-Formatierung), eine bewusste, im Boundary-Abschnitt vorgegebene Ausnahme von der sonstigen "DE bleibt byte-identisch"-Regel. Bestehender Unit-Test `rendert Bundle-Group oberhalb h1` entsprechend auf `/C · Umwelt/` angepasst (Kommentar erklärt die Abweichung).
- `getLayerDisplayName(relSlug)` in der Verwandte-Layer-Liste bekam `localeOpts` -- vorher zeigte diese Liste auf `/en/layer/…` immer deutsche Namen (impliziter DE-Default ohne `opts`), jetzt korrekt lokalisiert.
- `lang="de"` (WCAG 3.1.2) gesetzt auf: `explain.long`-Lead, `explain.valueScaleExplain`, `methodology.calculation`/`aggregationLevel`/`authority`/`updateFrequency`, `coverageGaps`-/`omissions`-Listen, die `EditorialDisclaimer`-Section. FAQ bleibt unverändert (macht `faq-section.svelte` bereits selbst, seit B4a).
- Tests: `get-layer-detail.test.ts` (+1 EN-Fall), `error-feedback-mailto.svelte.test.ts` (+1 EN-Fall inkl. Beleg, dass Mailto-Subject/Body deutsch bleiben), `page.svelte.test.ts` (+9 EN-Fälle: Section-Chrome, `lang="de"`-Wraps beidseitig DE/EN, Verwandte-Layer-Link+Href, Inspector-/Methodik-Links, Hitze-CTA, Eigene-Berechnung-Zeile, Leerzustand+Mailto, Breadcrumb-/Dataset-JSON-LD). Alle grün, inkl. der einen angepassten DE-Assertion (Bundle-Label).
- Neue e2e-Datei `tests/e2e/i18n-layer-frame.e2e.ts` (7 Tests: EN-Rahmen mit Methodik, Coverage/Omissions-Headings, Verwandte-Layer-Klick, Methodik-/Inspector-Links, Leerzustand ohne Methodik (`kultur-museum`, kein `layer-methodology.ts`-Eintrag), Hitze-CTA (`kuehle-orte`), DE-Kontrolle).
- `deferred-work.md`: Register `/layer` nach Block C, EN-OG-Bilder (Boundary "Never"), Seiteneffekt-Notiz `/en/lizenzen` (jetzt übersetzte Layer-Namen im DataCatalog, Description-Fallback dort bleibt deutsch -- außerhalb der B4b-Code-Map), 3 vorbestehende `layer-explain-coverage.e2e.ts`-Fails außerhalb der Code-Map.
- Kein separater Review-Layer/Triage-Durchlauf in diesem Auftrag (Einzel-Agent-Implementierung ohne Koordinator-Zwischenschritte, analog B4a Erstumsetzung); Status bleibt bewusst `in-progress` bis zur Koordinator-Freigabe (Matze AFK).

**Fix-Runde nach Koordinator-Review (27.09. 06:20, siehe Spec Change Log + Review Triage Log):**
- `bundleGroupLabel`: DE zeigt jetzt wieder den rohen `meta.bundleGroup` unconditional; nur `locale !== 'de'` läuft über `bundleLabel()` (mit Roh-Fallback für unbekannte Werte, jetzt per Test abgesichert). Ursprüngliche DE-Test-Assertion (`/C: Umwelt/`) wiederhergestellt.
- Dataset- und Breadcrumb-JSON-LD laufen nicht mehr über die URL-Locale: neues `deLayerName = getLayerDisplayName(detail.slug)` (DE-Default) speist `datasetJsonLd.name`, den Description-Fallback (`jsonLdDescriptionFallback`, DE-forciert über `{ locale: 'de' }`) und den dritten Breadcrumb-Eintrag; der zweite Breadcrumb-Eintrag ist wieder das literale `'Daten'` statt einer Message. `layer_page_breadcrumb_daten` (jetzt ungenutzt) aus beiden Message-Dateien entfernt.
- `ErrorFeedbackMailto` bekam einen zweiten, optionalen Prop `ariaLayerName` (Default: `layerName`): der Aufrufer in `+page.svelte` übergibt `layerName={deLayerName}` (treibt Mailto-Subject/-Body, bleibt deutsch) und `ariaLayerName={detail.layerName}` (treibt nur das sichtbare Aria-Label, locale-fähig) -- verhindert eine gemischtsprachige Redaktions-Mail auf `/en`.
- `lang={locale === 'de' ? undefined : 'de'}` (9x wiederholt) durch eine Ableitung `contentLang` ersetzt.
- Pfeil im Karten-Link jetzt `<span aria-hidden="true">→</span>` statt nacktem Zeichen (Screenreader lasen zuvor „right arrow").
- `get-layer-detail.ts::buildLayerDetail`: `lang`-Parameter direkt als `Locale` typisiert, der `as Locale`-Cast entfällt. `LayerDetail.lang` ebenfalls auf `Locale` umgestellt. Keine Caller-Anpassung nötig (`+page.server.ts`, `lizenzen/+page.ts` übergeben bereits `getLocale()`; `get-layer-detail.test.ts`s String-Literale `'de'`/`'en'` bleiben zuweisungskompatibel).
- EN-Copy: `error_feedback_mailto_label` → „Error in this entry?", `_aria_label` → „Report an error in {layerName}" (ohne „the entry"), `layer_page_omissions_heading` → „What we don't show" (keine Versalien), `layer_page_methodology_empty_text` → „This layer is not fully documented yet." (natürlicher, kein wörtliches „in preparation"). `layer_page_methodik_suffix` geprüft, hatte bereits keine Versalien.
- Tests: `opts.locale (EN)`-Describes in `page.svelte.test.ts` und `error-feedback-mailto.svelte.test.ts` umbenannt auf `EN locale (getLocale() = "en")` (Komponenten lesen die globale Locale, keinen `opts`-Prop). Die DE-Negativ-Assertion („kein `lang=de`") aus dem EN-Describe entfernt (redundant) zugunsten einer neuen, umfassenden DE-Test „kein `lang`-Attribut an allen 9 gewrappten Elementen" (Lead, Editorial-Section, Skala, Berechnung, Aggregation, Pflege, Aktualisierung, Coverage-Lücken, Omissions) plus einer DE-Features-Zahl-Test (`12.345`). Der bestehende EN-`lang="de"`-Test bekam eine `editorial`-Fixture (Section + alle drei Methodik-`dd`s jetzt mitgeprüft). Neuer EN-Test für den `bundleGroup`-Roh-Fallback (unbekannter Wert bleibt roh). JSON-LD- und Leerzustand/Mailto-Tests auf die neue DE-Voll-JSON-LD- bzw. DE-Mailto-Subject-Erwartung umgeschrieben.
- `tests/e2e/i18n-layer-frame.e2e.ts`: neuer Test „Dataset- und Breadcrumb-JSON-LD bleiben auf /en vollständig deutsch". Copy-Assertions aktualisiert (`What we don't show`, `not fully documented yet`, `Error in this entry`, Mailto-Subject jetzt mit DE-Namen „Museen" statt EN-Namen). Gegen frischen `pnpm build` + `pnpm preview` erneut verifiziert (siehe Verification).
- Scope der Fix-Runde: nur die editierten Dateien getestet (`pnpm exec vitest run` gezielt + `pnpm check` + `pnpm lint:wahl`), kein voller Suite-Lauf -- Koordinator verifiziert vollständig separat (Auftrag).

- Zeitmessung gesamt (Koordinator): Planung 05:52-05:58 (6 min, Inventur direkt), Umsetzung 05:58-06:17 (19 min), Review 3 Layer 06:17-06:20 (3 min), Triage 06:20-06:21, Patch-Runde 06:21-06:30 (9 min), Abschluss-Verifikation 06:30-06:33. Gesamt rund 41 min.
- Qualität: 25 Review-Funde in 22 Einträgen (2 medium Code: DE-Eyebrow-Regression, gemischter Mailto-Betreff; 1 medium gemischtsprachiges Dataset-JSON-LD), 14 gepatcht, 3 deferred, 5 rejected. Abschluss: vitest 4683 Tests grün (winner-map-Flake einmal rot, isoliert grün), check 0, lint:wahl 0, e2e i18n-layer-frame/profile-frame/routing/inspector/atlas/finder-compare 93/93. `layer-explain-coverage` 3 vorbestehende Fails (deferred). Freigabe durch Koordinator (Matze AFK).


- 27.09. 06:20, Koordinator (Matze AFK), Review-Fund #19: Die Boundary „`bundleGroup` über `bundleLabel`“ änderte den DE-Eyebrow („C: Umwelt“ → „C · Umwelt“) und kollidierte mit „DE Zeichen für Zeichen gleich“. Auslegung: DE zeigt weiter den Rohwert, nur EN läuft über `bundleLabel`.
- 27.09. 06:20, Koordinator (Matze AFK), Review-Funde #3/#4: JSON-LD folgt `inLanguage` `de-DE` bis zur Registrierung. Dataset- und Breadcrumb-JSON-LD bleiben auf `/en` vollständig deutsch (DE-Layer-Name, DE-Fallback, „Daten“). Sonst entstehen gemischtsprachige Datensätze.

## Review Triage Log

Runde 1 (27.09.2026 06:20), 3 Layer: Blind Hunter (BH) 17, Edge Case (EC) 5, Verification Gap (VG) 1 + 2. Koordinator-Triage (Matze AFK). P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH | Spec-Status widerspricht Implementation Note | low | Fix editiert Spec | R |
| 2 | BH/VG/EC | Lokalisierte 404 ungetestet und in Produktion unerreichbar (`prerender = true`, adapter-node) | low | gilt auch für B4a | D |
| 3 | BH/EC | Breadcrumb-JSON-LD: EN-Namen mit DE-Pfaden | low | widerspricht `inLanguage` de-DE | P: JSON-LD bleibt DE (Spec Change Log) |
| 4 | BH | Dataset-JSON-LD: EN-Name/-Fallback bei `inLanguage` de-DE, Test pinnt die Mischung | medium | | P: wie #3 |
| 5 | BH | Meta-Description auf `/en` deutsch, wenn `explain.short` gesetzt | low | Inhalt Block C | D |
| 6 | BH | `lang`-Ausdruck 8× wiederholt | low | direkte Korrektur | P: `contentLang` |
| 7 | BH | `lang="de"` um ganze Editorial-Section statt in der Komponente | low | alle Layer-Varianten heute DE; Block C überarbeitet `EditorialDisclaimer` ohnehin | R |
| 8 | BH | Message-Aufrufe mal mit, mal ohne `localeOpts` | low | funktional gleich | R |
| 9 | BH | EN-Copy Mailto („Report an error?“, Aria holprig) | low | | P |
| 10 | BH | EN-Copy „What we do NOT show“ (Versalien), Leerzustand-Satz | low | | P |
| 11 | BH | Pfeil „→“ im Karten-Link ohne `aria-hidden` | low | Screenreader liest „right arrow“ | P |
| 12 | BH | DE-Test im EN-`describe`, irreführende describe-Namen | low | | P |
| 13 | BH/VG | `lang="de"` an Editorial-Section und 3 Methodik-`dd` ungetestet, DE-Negativ-Checks nur am Lead | gap | VG vorverifiziert | P |
| 14 | BH | Cast `lang as Locale` in `get-layer-detail.ts` | low | Parameter typisieren, direkte Korrektur | P |
| 15 | BH | Roh-Fallback von `bundleGroup` ungetestet | gap | | P |
| 16 | BH | Verifikationszahlen nicht nachvollziehbar | low | Fix editiert Spec | R |
| 17 | BH | `formatCount` nur EN getestet | gap | | P: DE `12.345` |
| 18 | BH | Evidenz für `layer-explain-coverage`-Fails schwach | low | Koordinator: Markup der Verwandte-Layer-Liste unverändert, nur Href/Name; Fails betreffen auch Footer/FAQ/Map-Legend | R |
| 19 | EC | DE-Eyebrow „C: Umwelt“ → „C · Umwelt“, DE-Test umgeschrieben | medium | DE-Parität | P: DE roh, EN `bundleLabel` (Spec Change Log) |
| 20 | EC | Mailto-Betreff auf `/en` mit EN-Layer-Name, Redaktions-Mail gemischt | medium | Boundary „Mail-Body bleibt deutsch“ | P: DE-Name an den Mailto-Builder |
| 21 | EC | Server serialisiert fertiges Label statt Schlüssel | false | Sprachwechsel lädt neu | R |
| 22 | VG | `/en/lizenzen`-Nebeneffekt ungetestet | low | bereits in `deferred-work.md` | D (vorhanden) |

## Verification

**Commands:**
- `pnpm exec vitest run` -- **grün**: 468 Testdateien, 4680 Tests (0 Fehler). Ein `winner-map.svelte.test.ts`-Flake einmal rot unter Vollast, isoliert 3x hintereinander grün (13/13) -- vorbestehend, unbeteiligte Datei (Wahlportal, nicht Teil dieser Spec), siehe B4a-Implementation-Notes für denselben Flake.
- `pnpm check` -- **0 Fehler** (6536 Dateien).
- `pnpm lint:wahl` -- **0 Verstöße** (72 Dateien).
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder gegen lokale Postgres) -- **grün**. `static/kiez-scores/region-composites.json` bekam wie in B3b/B3c/B4a nur ein neues `generatedAt` (Prebuild-Nebenprodukt), per `git checkout` zurückgesetzt.
- `pnpm preview` + neue `tests/e2e/i18n-layer-frame.e2e.ts` (temporäre lokale Playwright-Config, `reuseExistingServer`, danach gelöscht) -- **grün, 7/7**.
- Regressionslauf `i18n-profile-frame` + `i18n-routing` + `layer-explain-coverage` (72 Tests gesamt mit den neuen 7) -- **69/72 grün**, 3 Fails, alle nachweislich vorbestehend und außerhalb der B4b-Code-Map (siehe `deferred-work.md`):
  - `layer-explain-coverage.e2e.ts` „Detail-Page hat 0 axe-Violations": WCAG 2.5.8 `target-size`/`target-offset` an Verwandte-Layer-Links, FAQ-Accordion-Buttons, Footer-Meta-Links -- keines dieser Elemente von B4b verändert (nur Messages/`href` umgestellt, keine Größen-/Abstands-Klassen).
  - `layer-explain-coverage.e2e.ts` „Map-Legend: Click expandiert Panel..." und „Legend Expand-Panel hat 0 axe-Violations": Timeout beim Warten auf `legend-summary-*` auf `/explore` -- `map-legend.svelte` liegt komplett außerhalb der B4b-Code-Map, unverändert.
  - Alle 7 neuen `i18n-layer-frame`-Tests und alle 12 `i18n-profile-frame`-Tests (B4a-Regression) grün.
