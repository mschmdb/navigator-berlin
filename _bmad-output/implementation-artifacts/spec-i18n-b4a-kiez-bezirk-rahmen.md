---
title: 'i18n Block B4a: Rahmen der Kiez- und Bezirk-Seiten auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: '9b59e4fa081c30855bf86e4ab4af873db3f4df64'
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
- [x] Helfer `rank-format`, `source-label`, `steckbrief-extras`, `faq-helpers/*`: `opts` mit DE-Default, Formate über `format.ts` (+ Tests, Server-FAQ unverändert)
- [x] `+page.server.ts` Kiez/Bezirk: Keys statt DE-Labels, 404 lokalisiert (+ Tests)
- [x] `kiez-hero`, `bezirk-hero`: auf Messages (+ Tests EN/DE)
- [x] `score-comparison-table` (Key-Abgleich), `kiez-wahl-verlauf`, Listen, `breadcrumb`, `score-rank-link`, `faq-section`: auf Messages, Links über `localizedHref` (+ Tests). `error-feedback-mailto` NICHT angefasst (siehe Implementation Notes: Code-Map-Korrektur, gehört zu B4b).
- [x] `+page.svelte` Kiez/Bezirk: Meta, ogAlt, Zahlen, Links (+ Tests). Kein neues `inLanguage`-Feld: `buildPlace`/`buildAdministrativeArea`/`buildBreadcrumbList` kennen das Feld nicht, und `/kiez`+`/bezirk` sind nicht im Übersetzungs-Register -- die vorhandene `resolveEffectiveLocale`-Mechanik (SeoHead, WebSite-JSON-LD) zeigt für sie weiterhin `de-DE`, siehe `i18n-routing.e2e.ts` (unverändert grün).
- [x] e2e `i18n-profile-frame.e2e.ts`, Key-Parität, `lint:wahl`. In `deferred-work.md`: B4b Layer (bereits vorhanden), EN-OG-Bilder, Register `/kiez` + `/bezirk` nach Block C, `error-feedback-mailto`-Scope-Korrektur, `toSegments`/`distributionText`-Rohkategorien.
- [x] Zeitmessung je Phase (siehe Implementation Notes)

**Acceptance Criteria:**
- Given `/en/kiez/<slug>`, when die Seite lädt, then ist der Rahmen englisch, alle internen Links zeigen auf `/en/…` und `<html lang>`/`inLanguage` stehen auf `en`.
- Given `/en/bezirk/<slug>`, when die Seite lädt, then sind Hero, Kiez-Liste und Vergleichstabelle englisch.
- Given die DE-Routen und der Server-FAQ-Renderer, when die bestehenden Tests laufen, then sind sie grün und die DE-Ausgabe ist unverändert.

## Implementation Notes

- 27.09. 04:52 Start Planung, 04:52-04:54 Inventur (1 Subagent), 04:55 Split B4a/B4b und Checkpoint 1 durch Koordinator (Matze AFK).
- Umsetzung (Einzel-Agent, ohne separate Review-Layer): `rank-format.ts`/`source-label.ts`/`steckbrief-extras.ts`/`faq-helpers/{laerm,gruen,klima,oepnv,wohnen}.ts` bekamen `opts?: LocaleOptions`/`LocaleFormatOptions` mit DE-Default nach dem B3a/B3c-Muster. `source-label.ts` liest jetzt `getLayerDisplayName()` statt direkt `LAYER_EXPLAIN_DE` (Review-Fund beim Schreiben: die vormalige `EXTRA_SOURCE_LABELS`-Ausnahme für `oepnv-composite` wanderte als regulärer Eintrag in `LAYER_EXPLAIN_DE`/`LAYER_NAME_MESSAGE`, der `prettifySlug`-Fallback für unbekannte Slugs entfiel zugunsten des Roh-Slug-Fallbacks von `getLayerDisplayName` -- Test entsprechend angepasst). Alle 14 `*De`-Describer bekamen `opts`, auch die vier, die ausschließlich vom Server-FAQ-Renderer aufgerufen werden (`laermErklaerungDe`, `gruenErklaerungDe`, `oepnvErklaerungDe`, `petErklaerungDe`, `describeMssDe`) -- für Konsistenz aller 14 Funktionen einer Datei-Gruppe, `template-renderer.ts` ruft weiterhin ohne `opts` auf und bleibt unverändert deutsch.
- `format.ts` bekam `formatMonthYear(iso, opts?)` (ersetzt das in `kiez-hero.svelte`/`bezirk-hero.svelte` duplizierte, fest auf `de-DE` verdrahtete `formatStand`; DE bleibt byte-identisch).
- `comparison-types.ts`: `label: string` → `key: KiezScoreDimension` (Boundary: Kriminalitäts-Erkennung am Schlüssel). Die `{ field, key }`-Zuordnung ist als `SCORE_DIMENSION_KEYS` EINE geteilte Konstante in `comparison-types.ts` (Review-Fund: vormals 3x dupliziert in beiden `+page.server.ts` und `kiez-hero.svelte`s `SCORE_DIM_KEYS`); `kiez-hero.svelte` filtert für die Score-Summary auf die `COMPOSITE_DIMENSIONS`-Teilmenge. `score-comparison-table.svelte` löst das Zeilen-Label über `dimensionLabel(row.key, opts)` auf (bereits aus B3a vorhanden). Test `comparison-types.test.ts` pinnt die field→key-Paare.
- `kiez-wahl-verlauf.svelte`: `WahlVerlaufRow` liefert jetzt `typ`/`stimmtyp` (Rohschlüssel) statt vorgefertigter `wahlTypLabel`/`stimmtypLabel`-Strings (Muster „Server liefert Schlüssel, Client baut Labels" aus `berlin-wahlen/[slug]`). Bewusst NICHT über `wahl-labels.ts` aufgelöst: dessen `wahlTypLabel`/`wahlStimmtypLabel` liefern SINGULAR-Institutionsnamen („Bundestagswahl", „Zweitstimme") für Seitentitel/H1, der Wahl-Verlauf braucht aber PLURAL („Bundestagswahlen", „Zweitstimmen") -- eigene Messages (`kiez_wahl_verlauf_typ_*`/`_stimmtyp_*`) analog zum B3c-Präzedenzfall `finder_election_label`. Quellen-/Lizenz-Zeile kombiniert dagegen wiederverwendete Resolver (`sourceDisplayLabel` aus `wahl-labels.ts` für die zwei Institutionsnamen, `wahl_portal_lizenz_suffix` mit dem rohen Lizenz-Code `dl-de/by-2-0` statt `licenseDisplayLabel`, damit die DE-Ausgabe „Lizenz dl-de/by-2-0" byte-identisch bleibt) und den bereits existierenden `wahl_detail_methodik_link_label` („Methodik · Wahldaten").
- `breadcrumb.svelte`: aria-label über Message, Hrefs über `localizedHref` (betrifft nur Kiez-/Bezirk-Seiten -- die einzigen beiden Konsumenten der sichtbaren Komponente; alle anderen Treffer für "Breadcrumb" im Repo waren `buildBreadcrumbList()`-Aufrufe für JSON-LD, nicht die Komponente).
- JSON-LD-Breadcrumb/-Place/-AdministrativeArea bekamen bewusst KEIN neues `inLanguage`-Feld (Code-Map-Formulierung „inLanguage über `localeToBcp47(resolveEffectiveLocale(…))`" bezog sich auf das bereits bestehende `berlin-wahlen`-Muster für `buildDataset`, nicht auf einen neuen Builder-Parameter): `/kiez` und `/bezirk` sind nicht im Übersetzungs-Register, die vorhandene Infra (`SeoHead`, WebSite-JSON-LD, Block A) zeigt für sie weiterhin `de-DE` -- exakt das von `i18n-routing.e2e.ts` gepinnte, unveränderte Verhalten. `<html lang>` bleibt die URL-Locale (Root-Layout, unberührt von B4a).
- Code-Map-Korrektur: `error-feedback-mailto.svelte` wurde NICHT übersetzt. Ihr einziger Aufrufer ist `/layer/[slug]/+page.svelte` (Boundary „Never: Kein `/layer` (B4b)"); die Inventur hatte die Komponente versehentlich als Kiez-/Bezirk-geteilt gelistet. In `deferred-work.md` vermerkt, gehört zu B4b.
- `steckbrief-extras.ts::toSegments`/`distributionText` bleiben bewusst unangetastet (rohe DE-Kategorie-Wörter aus den Verteilungs-Objekten, z. B. „Mittel 67%"): außerhalb der B4a-Code-Map, bräuchte eine Cluster-spezifische Kategorie-Tabelle. In `deferred-work.md` vermerkt (analog zum B3c-Fund `map-libre-canvas`-loadError).
- 126 neue Message-Keys in `messages/de.json`/`messages/en.json` (Präfixe `rank_format_*`, `faq_helper_*`, `breadcrumb_*`, `score_rank_link_*`, `faq_section_*`, `kiez_siblings_*`, `bezirk_kieze_*`, `score_comparison_*`, `kiez_wahl_verlauf_*`, `profile_*`, `steckbrief_*`, `kiez_page_*`, `bezirk_page_*`, plus `atlas_layer_name_oepnv_composite`), Key-Parität über `message-key-parity.test.ts` mitgeprüft (grün).
- Tests: jede geänderte Datei bekam neue EN-Testfälle (`overwriteGetLocale('en')`/`{ locale: 'en' }`) zusätzlich zu den unverändert grünen DE-Bestandstests. Neu angelegt (vorher ungetestet): `faq-helpers/{laerm,gruen,klima,oepnv,wohnen}.test.ts`, `kiez-wahl-verlauf.svelte.test.ts`. Keine neuen Tests für `+page.server.ts`/`+page.svelte` (Kiez/Bezirk) -- für diese Routen existierten vor B4a keine dedizierten Testdateien (DB-Mocking-Aufwand); Abdeckung läuft über die Komponenten-Unit-Tests plus den neuen e2e-Test.
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder, gegen eine lokal laufende, befüllte Postgres-Instanz) -- grün, ~5 min. `static/kiez-scores/region-composites.json` bekam wie in B3b/B3c nur ein neues `generatedAt` (Prebuild-Nebenprodukt), per `git checkout` zurückgesetzt.
- e2e: neue Datei `tests/e2e/i18n-profile-frame.e2e.ts` (10 Tests) gegen `pnpm preview` (temporäre lokale Playwright-Config mit `reuseExistingServer`, danach gelöscht). Erste Fassung erwartete absolute `/en/…`-Hrefs; `localizedHref` → SvelteKits `resolve()` liefert auf prerenderten Seiten aber RELATIVE Pfade (`../../en/kiez/x`) -- Assertions liefen deshalb auf Klick + `page.url()` um statt den rohen `href`-String zu prüfen. **10/10 grün** gegen echte DB-Daten (Alexanderplatz/Charlottenburg-Wilmersdorf mit Steckbrief, Vergleichstabelle, Wahl-Verlauf, FAQ). Regressionslauf `i18n-routing.e2e.ts` + `i18n-inspector.e2e.ts` + `i18n-atlas.e2e.ts` + `i18n-finder-compare.e2e.ts`: **73/73 grün**, keine Regression (insbesondere die bereits bestehende, Block-A-Pin „JSON-LD inLanguage auf `/en/kiez/…` bleibt de-DE" weiterhin grün).
- Kein separater Review-Layer/Triage-Durchlauf in diesem Auftrag (Einzel-Agent-Implementierung ohne Koordinator-Zwischenschritte); Status bleibt bewusst `in-progress` bis zur Koordinator-Freigabe.
- Fix-Runde nach Koordinator-Review (27.09.): `kiez-hero.svelte`/`bezirk-hero.svelte` (Profil-Prosa-Section) und `faq-section.svelte` (Accordion um die Q&A-Inhalte) bekamen `lang="de"` wenn die aktuelle Locale nicht `de` ist (WCAG 3.1.2) -- die übersetzte Überschrift bleibt bewusst ohne `lang`-Wrap. `faq-section.svelte`s Header-Kommentar und der `tryLoadFaq`-Kommentar in `kiez/[slug]/+page.server.ts` waren veraltet (behaupteten, `faq-section` zeige selbst den `TranslationDisclaimer`-Fallback-Hinweis; der rendert tatsächlich einmal pro Seite im Layout) -- korrigiert. `source-label.ts` hatte den `prettifySlug`-Fallback für unbekannte Slugs versehentlich fallen gelassen (Story-11.3/11.4-Vertrag verlangt IMMER einen lesbaren Namen) -- wiederhergestellt, Test zurückgesetzt auf „Foo Bar 2099". `score-comparison-table.svelte`s `valueLabel`-Default war hart deutsch (`'Wert'`) -- jetzt über `score_comparison_default_value_label` (DE/EN), Aufrufer mit „Kiez"/„Bezirk" (Glossar) unverändert. `SCORE_DIMENSION_KEYS` als geteilte Konstante extrahiert (siehe oben). EN-Copy-Korrekturen: MSS-Glossar ausgeschrieben, PET-Kategorien folgen jetzt konsistent der Hitzestress-Skala („no/moderate/heavy/strong heat stress" statt „thermally relaxed"/„heavily stressed"), Wohnlage „simple" statt „basic", `rank_format_bottom_quartile` klein geschrieben (matcht alle Aufrufer, nie Satzanfang), `kiez_wahl_verlauf_intro` behält „Kiez" vor dem Namen wie im Deutschen. Alle negativen `not.toMatch`/`not.toBe`-EN-Testassertions in `faq-helpers/*.test.ts` durch positive erwartete Strings ersetzt. `kiez-hero`/`bezirk-hero`-EN-Tests bekamen eine volle Steckbrief-Fixture (PET, ÖPNV, Wohnlage, MSS, Grünanlagen-Zähler) mit Zahlenformat-Assertions. e2e-Datei verschärft: keine `if (await x.count())`-Guards mehr, Berlin-Zell-Assertion für die Ruhe-&-Luft/Quiet-&-air-Zeile, Meta-Description + `og:image:alt`-Assertions, FAQ-Test umbenannt (nur die Section-Chrome ist englisch, die Q&A-Inhalte bleiben deutsch und werden jetzt auch positiv geprüft). Alle Tests für die editierten Dateien laufen grün (169 Unit-Tests), `pnpm check`/`lint:wahl` weiterhin 0 Fehler, e2e erneut gegen einen frischen `pnpm build` + `pnpm preview` verifiziert (siehe Verification).

- Zeitmessung gesamt (Koordinator): Planung 04:52-04:56 (4 min), Umsetzung 04:56-05:30 (34 min), Koordinator-Diff-Prüfung 05:30-05:31, Review 3 Layer 05:31-05:34 (3 min), Triage 05:34-05:35, Patch-Runde 05:35-05:50 (15 min), Abschluss-Verifikation 05:50-05:56. Gesamt rund 64 min.
- Qualität: 26 Review-Funde in 18 Einträgen (2 medium Code: Roh-Slug-Regression `sourceLabel`, fehlendes `lang="de"` an DE-Inhalt; sonst Copy und Testlücken), 11 gepatcht, 2 deferred, 5 rejected (1 davon Koordinator-Entscheidung `inLanguage`, Matze bestätigen). Abschluss: vitest 4669 Tests grün (winner-map-Flake einmal rot, isoliert 13/13), check 0, lint:wahl 0, e2e i18n-profile-frame/routing/inspector/atlas/finder-compare 85/85. Freigabe durch Koordinator (Matze AFK).


- 27.09. 05:35, Koordinator (Matze AFK), Review-Fund #1: AC 1 nennt `inLanguage` = `en`. Umsetzung und Koordinator halten `inLanguage`/Content-Locale für `/kiez` und `/bezirk` bei `de-DE`, solange die Routen nicht im Übersetzungs-Register stehen. Grund: Prosa und FAQ sind deutsch, die bestehende `resolveEffectiveLocale`-Mechanik und `i18n-routing.e2e.ts` pinnen genau das. Mit der Registrierung nach Block C wechselt `inLanguage` automatisch. Kein Code-Rückbau nötig. Matze bitte bestätigen.

- 27.09.: Tasks-Checkboxen auf erledigt gesetzt, Code-Map-Abweichung dokumentiert (`error-feedback-mailto` gehört zu B4b, kein neues `inLanguage`-JSON-LD-Feld).

## Review Triage Log

Runde 1 (27.09.2026 05:34), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 9, Verification Gap (VG) 3 + 2. Koordinator-Triage (Matze AFK). P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC | AC 1 `inLanguage` = `en` nicht erfüllt, aber abgehakt | medium | bewusst, siehe Spec Change Log | R (Koordinator-Entscheidung, kein Code-Fix) |
| 2 | BH | Spec-Status widerspricht Implementation Note | low | Fix editiert Spec | R |
| 3 | BH/VG | DE-Prosa und DE-FAQ unter `lang="en"` ohne `lang="de"` (WCAG 3.1.2), betrifft auch `faq-section` auf `/en/layer`, `/en/hitze` | medium | EN-Überschrift über DE-Inhalt | P: `lang="de"` an Prosa-Section und FAQ-Liste, wenn Locale ≠ de |
| 4 | BH | Kommentare behaupten `TranslationDisclaimer` in `faq-section`, Header veraltet „Phase-1 DE-only“ | low | Code hat keinen Disclaimer dort | P |
| 5 | BH | `formatMonthYear` fällt auf `getLocale()` statt `de` | false | alle `format.ts`-Funktionen nutzen `resolveLocale`, DE-Default gilt für Resolver außerhalb `format.ts` | R |
| 6 | BH/VG | Routen ohne Tests: Meta-Description, og:image:alt, `SCORE_DIMS` field→key | gap | VG: Vertauschen von `field`/`key` fiele nicht auf | P: e2e-Assertions Meta DE+EN, Ruhe-&-Luft-Zeile mit Zahl |
| 7 | VG | Lokalisierte 404 ungetestet | gap | Routen prerendered aus fester Slug-Liste | D |
| 8 | BH/VG | EN-Tests der Describer nur negativ; Hero-Fixtures ohne PET/ÖPNV/Wohnlage/MSS; `kiez-wahl-verlauf` EN-Labels/Aria ungeprüft | gap | | P |
| 9 | BH/EC | `valueLabel`-Default `'Wert'` fest DE | low | direkte Korrektur | P |
| 10 | BH | Satz-Fragmente um Links, Klammer-Suffixe und `Kiez ${name}` im Code | low | DE/EN korrekt, betrifft erst weitere Locales | R |
| 11 | BH | `SCORE_DIMS`-Mapping dreifach (2 Server, `kiez-hero`) | low | Drift bei neuer Dimension | P: eine geteilte Konstante |
| 12 | BH/EC | `sourceLabel` zeigt für unbekannte Slugs Roh-Slug statt Prettify, DE-FAQ-Ausgabe ändert sich | medium | Story-11.3/11.4-Vertrag, Test umgeschrieben | P: Prettify-Fallback zurück, alter Test wieder |
| 13 | BH | `*De`-Funktionsnamen und Typen passen nicht mehr | low | Umbenennen berührt Server-FAQ | R |
| 14 | BH | `localeOpts` uneinheitlich übergeben | low | funktional gleich | R |
| 15 | BH | EN-Copy: MSS ohne Erklärung, „thermally relaxed“, „basic“ statt „simple“, „Bottom quartile“ groß, Intro ohne „Kiez“ | low | | P |
| 16 | EC | `formatMonthYear` ohne `timeZone`, Monatsverschiebung westlich UTC | low | vorbestehend (`formatStand` identisch) | D |
| 17 | EC/VG | e2e ohne DB: Kiez-Tests hart, Bezirk/Wahl-Verlauf mit `if (count)` vakuum | gap | `pnpm build` braucht DB ohnehin (Prebuild) | P: Guards entfernen, harte Assertions, Voraussetzung im Datei-Kommentar |
| 18 | EC | `score-rank-link` Zweig `bezirke` unter EN ungetestet | gap | | P |

- Steht aus (Koordinator-Review, Matze AFK).

## Verification

**Commands:**
- `pnpm exec vitest run` -- **grün**: 467 Testdateien, 4656 Tests (0 Fehler).
- `pnpm check` -- **0 Fehler** (7680 Dateien geprüft, `svelte-kit sync` inklusive).
- `pnpm lint:wahl` -- **0 Verstöße** (72 Dateien).
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) -- **grün**.
- `pnpm preview` + `i18n-profile-frame.e2e.ts` (temporäre Config, `reuseExistingServer`) -- **grün, 10/10**.
- `i18n-routing`, `i18n-inspector`, `i18n-atlas`, `i18n-finder-compare` e2e (Regression) -- **73/73 grün**.

**Fix-Runde nach Koordinator-Review (27.09., s. Implementation Notes):** auf Weisung nur die Tests der editierten Dateien erneut ausgeführt (kein voller Suite-Lauf -- Koordinator verifiziert vollständig separat):
- `pnpm exec vitest run` gezielt auf alle 20 editierten/neuen Testdateien (Hero-Komponenten, `score-comparison-table`, `score-rank-link`, `faq-section`, `breadcrumb`, `kiez-siblings-list`, `bezirk-kieze-list`, `kiez-wahl-verlauf`, `comparison-types`, `rank-format`, `source-label`, `steckbrief-extras`, `format`, `layer-palette-filter`, `faq-helpers/*`) -- **grün, 169/169**.
- `message-key-parity.test.ts` -- **grün** (neuer Key `score_comparison_default_value_label` korrekt in DE+EN).
- `pnpm check` -- **0 Fehler** (6536 Dateien).
- `pnpm lint:wahl` -- **0 Verstöße**.
- `pnpm build` erneut voll durchlaufen (Fixes betreffen SSR-Code) -- **grün**.
- `pnpm preview` + `i18n-profile-frame.e2e.ts` (verschärfte Fassung, harte Assertions statt `count()`-Guards) -- **grün, 12/12** (2 neue Tests: Meta-Description/`og:image:alt` je Kiez/Bezirk-Seite).

## Bekannte Restrisiken

- **`/kiez` und `/bezirk` noch nicht im Übersetzungs-Register**: bewusst, siehe `deferred-work.md` (erst nach Block C, Prosa/FAQ-Übersetzung).
- **EN-OG-Bilder**: `/en/kiez/…` und `/en/bezirk/…` zeigen weiterhin die DE-Karte im `og:image` (siehe `deferred-work.md`).
- **`toSegments`/`distributionText` zeigen rohe DE-Kategorie-Wörter** im Steckbrief-Disclosure „Verteilung & Zahlen", auch unter `/en/…` (siehe `deferred-work.md`).
- **`error-feedback-mailto.svelte` bleibt deutsch**: gehört zu B4b (Layer-Detailseite), nicht B4a (siehe `deferred-work.md`).
- **Kein Multi-Layer-Review durchlaufen**: diese Umsetzung lief als Einzel-Agent-Auftrag ohne die sonst übliche Review-Runde (Blind Hunter/Edge Case/Verification Gap). Vor Freigabe empfiehlt sich ein regulärer `bmad-review`-Durchlauf.
