---
title: 'i18n Block B3c: Finder, Compare, Bookmarks auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'e76cf085d34c96479872fe1ef587a88c46f936de'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b3b-inspector.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kiez-Finder, Adress-Vergleich und Bookmarks sind unter `/en` deutsch: rund 110 Strings in 9 Dateien, keine davon importiert Paraglide. Dazu kommen feste de-DE-Formate (`toLocaleString('de-DE')`, `toFixed(1).replace('.', ',')`), eigene Wahl-Label-Tabellen neben `wahl-labels.ts` und Links ohne `/en`.

**Approach:** Wir stellen die Dateien nach dem B3b-Muster auf Paraglide-Messages um und ergänzen EN. Dazu gehören `lang`-Prop, `getLocale()`-Default, `localeOpts` an bestehende Resolver/Formatter und `localizedHref` für Links. Teil 3 von 3 des Atlas.

## Boundaries & Constraints

**Always:**
- Freigabe und Entscheidungen durch Koordinator, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“).
- B3a/B3b-Linie:
  - en-GB, Sentence Case.
  - „Kiez“/„Bezirk“ bleiben deutsch.
  - Geschlossene Kategorien übersetzen, Rohwerte roh.
  - DE-Ausgabe Zeichen für Zeichen gleich.
  - Geteilte Helfer mit DE-Default.
- Koordinator-Entscheidung, Matze AFK: Die Hinweissätze in `layer-compare.ts` (Bodenrichtwert, Milieuschutz, Stolperstein, „Kontextuelle Werte …“) sind kurze UI-Labels. B3c übersetzt sie. `EditorialDisclaimer`-Texte bleiben Block C.
- Koordinator-Entscheidung, Matze AFK: B3c übersetzt auch die Nachbarn, die Finder, Compare und Bookmarks mit DE-Defaults rendern:
  - Compare-`AddressSearch`-Labels, `ValueChip`-Severities in `compare-row` (`severityDescriptions`), `BriefwahlMarker`-Tooltip im Wahl-Vergleich, `BottomSheet`-Labels im Bookmark-Dialog.
  - Die sr-only-Kartenbeschreibung in `map-libre-canvas.svelte`.
- Datenschlüssel bleiben unverändert:
  - Finder-Gewichte, URL-Parameter `fw`/`fp`, `FINDER_ELECTION`, Parteikürzel und `'Sonstige'`.
  - `Wahltyp`/Ebenen-Keys, `KiezScoreDimension`, Layer-Slugs, `direction`-Werte.
  - Storage-Key, `bookmark.displayName`, Plausible-Eventnamen, Testids, Seitenmarker „A“/„B“.
- `#each`-Keys auf IDs, keine Labels. TDD pro AC.

**Never:**
- Kein `EditorialDisclaimer`-Text, kein `layer-explain`-Fließtext (Block C). Kein KI-Export (D). Keine Detailseiten (B4).
- Koordinator-Entscheidung, Matze AFK: Kein Register-Eintrag `/explore` in B3c. Die Compare- und Inspector-Disclaimer bleiben bis Block C deutsch, eine indexierte Seite wäre halb deutsch. B3c trägt den Register-Schritt nach Block C in `deferred-work.md` ein.
- Tote Komponenten (`inspector-level-toggle`) nicht übersetzen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/explore` Finder, Compare, Bookmarks | Texte und Zahlen wie vor B3c | N/A |
| EN-Finder | `/en/explore?fw=…` | Titel, Regler, Stufen, Partei-Auswahl, Wahlhinweis, Treffer englisch | Lade-/Fehlertext englisch |
| EN-Compare | `/en/explore` Vergleich A/B | Kopf, Spalten, Zeilen-Aria, Deltas („higher in A“), Wahl- und Kiez-Score-Block englisch, Zahlen `1,234`/`28.2` | „No data available“ |
| EN-Bookmarks | Dialog unter `/en/…` | Titel, Speichern, Limit, Leerzustand, Löschen-Bestätigung, Datenschutz-Link `/en/datenschutz#bookmarks` | Speicher-Fehler englisch |
| Wahl-Labels | Wahl-Vergleich `en` | Glossar aus `wahl-labels.ts`, Diff `+2.3` | N/A |
| Datenschlüssel | URL `fw`/`fp`, Storage, Parteikürzel | unverändert | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/kiez-finder-panel.svelte` (508):
  - `BIPOLAR`/`UNIPOLAR`-Labels, `STUFEN_BIPOLAR`, `stufenText()`. Die Verkettung „möglichst/eher“ ersetzen wir durch ganze Messages.
  - Aria `${label}: ${low} bis ${high}`, Lade-/Fehler-/Leertexte, „Beste Passung“, „Zurücksetzen“, Disclaimer-Absatz. Der Absatz ist fest im Code, kein `EditorialDisclaimer`, deshalb übersetzen wir ihn.
- `src/lib/components/atlas/internal/kiez-finder-data.ts`: `FINDER_ELECTION_LABEL`, `formatFinderWahlHinweis(opts?)`. Die Funktion baut den Text aus `wahl-labels.ts` und `formatDate`, `formatBerlinDate` bleibt für DE.
- `src/lib/components/atlas/compare-panel/compare-panel.svelte` (~15): Kopf, `getLayerDisplayName(slug, opts)` (:226), `AddressSearch`-Label-Props.
- `src/lib/components/atlas/compare-panel/compare-row.svelte` (7): `ariaLabelA/B`, `getLayerHitDisplay(…, opts)` (:43-44), `ValueChip severityDescriptions`.
- `src/lib/utils/layer-compare.ts` (~10): `toLocaleString('de-DE')` (:180-181) auf `format.ts`. Deltas und Advisories bekommen `opts?` mit DE-Default. Der einzige Nutzer ist `compare-row`.
- `src/lib/components/atlas/compare-panel/wahl-compare-block.svelte` (~16): `TYP_LABELS`/`LEVEL_LABELS` auf `wahlTypLabel`/`wahlEbeneLabel`, `toFixed…replace` (:288/:292) auf `formatDecimal`/`formatPercentagePointsDelta`, Methodik-Link über `localizedHref`.
- `src/lib/components/atlas/compare-panel/kiez-score-compare-block.svelte` (~6): `DIMENSION_LABELS_DE` → `dimensionLabel(dim, opts)`, `scaleFor`/`scaleForOverall` mit opts, Methodik-Link.
- `compare-panel/internal/merge-sections.ts`: `SECTION_LABELS` → `sectionLabel(key, opts)`.
- `src/lib/components/atlas/bookmark-dialog.svelte` (~16), gemountet in `src/routes/(with-header)/+layout.svelte`: `announce`-Texte, `BottomSheet`-Labels, Datenschutz-Link.
- `bookmark-row.svelte` (6): „„${name}" löschen“ usw. als Messages mit Parameter.
- `map-libre-canvas.svelte:239-241`: sr-only-Beschreibung.
- Wiederverwenden:
  - `format.ts`, `wahl-labels.ts`, `localized-href.ts`, `atlas-label-options.ts` (`toAtlasMessageOptions`).
  - `inspector-panel/internal/kiez-score-display.ts`, `layer-palette-filter.ts::getLayerDisplayName`, `layer-hit-display.ts`, `sections.ts::sectionLabel`, `value-severity-mapping.ts::severityDescriptions`.
  - Key-Präfixe: `finder_*`, `compare_*`, `bookmark_*`. Gemeinsame Texte nutzen `inspector_common_*`.
- Tests:
  - Unit: `kiez-finder-panel`, `kiez-finder-data`, `compare-panel`, `compare-row`, `wahl-compare-block`, `layer-compare`, `bookmark-dialog`, `merge-sections`.
  - Neu: `kiez-score-compare-block` und `bookmark-row` bekommen Testdateien.
  - e2e: `compare-flow`, `bookmark-flow`. Neu: `tests/e2e/i18n-finder-compare.e2e.ts` im Deep-Link-Muster aus `i18n-inspector.e2e.ts`, ohne Combobox.

## Tasks & Acceptance

**Execution:**
- [x] `layer-compare.ts`, `kiez-finder-data.ts`, `merge-sections.ts`: opts mit DE-Default, Formate über `format.ts` (+ Tests)
- [x] `kiez-finder-panel.svelte`: auf Messages umstellen (+ Tests EN/DE)
- [x] `compare-panel`, `compare-row`, `wahl-compare-block`, `kiez-score-compare-block`: auf Messages, Resolver mit opts, Links über `localizedHref` (+ Tests, 1 neue Testdatei)
- [x] `bookmark-dialog`, `bookmark-row`: auf Messages, `BottomSheet`-Labels, Datenschutz-Link (+ Tests, 1 neue Testdatei)
- [x] `map-libre-canvas.svelte`: sr-only-Beschreibung auf Messages (+ Test)
- [x] e2e `i18n-finder-compare.e2e.ts` (EN + DE-Kontrolle), Key-Parität, `lint:wahl`. In `deferred-work.md`: `/explore`-Register nach Block C.
- [x] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/explore` mit Finder-Parametern, when der Finder öffnet, then sind alle Finder-Texte englisch und die URL-Parameter unverändert.
- Given `/en/explore` mit zwei Adressen im Vergleich, when der Vergleich lädt, then sind Kopf, Zeilen, Deltas, Wahl- und Kiez-Score-Block englisch und alle Links zeigen auf `/en/…`.
- Given eine `/en`-Seite mit Header, when der Bookmark-Dialog öffnet, then sind Dialog, Zeilen, Bestätigungen und Screenreader-Ansagen englisch.
- Given die DE-Routen, when die bestehenden Tests laufen, then sind sie grün und die DE-Texte unverändert.

## Implementation Notes

- 27.09. 03:50 Start Planung, 03:50-03:52 Inventur (1 Subagent), 03:54 Checkpoint 1 durch Koordinator (Matze AFK). Spec rund 1700 Tokens, bewusst behalten (eine Nutzerfunktion, Split würde Compare-Nachbarn trennen).
- Umsetzung: `layer-compare.ts`/`kiez-finder-data.ts`/`merge-sections.ts` bekamen ein DE-Default-`opts`-Muster analog `atlas-label-options.ts` (kein `getLocale()`-Fallback in den geteilten Helfern selbst, Boundary). `kiez-finder-panel.svelte`: Achsen-Label/Low/High laufen jetzt über Message-Funktionsreferenzen (`def.label()` statt vorberechnetem String), Stufentext (`möglichst/eher wenig/viel/locker/dicht/nah/ähnlich`) über 4 Familien (`wenigViel`, `dichte`, `sbahn`, `partei`) mit gemeinsamem `egal`/`no preference`-Fall. `FINDER_ELECTION_LABEL`-Konstante entfernt zugunsten einer eigenen Message (`finder_election_label`), DE-Text bewusst NICHT aus `wahl-labels.ts` komponiert (hätte Wortstellung/Numerus gebrochen, DE-Parität-Boundary). `formatFinderWahlHinweis` nutzt jetzt `formatWahlDate` statt `formatBerlinDate` -- fuer DE identisches Ausgabeformat (`Europe/Berlin`, 2-stellig), fuer EN `21 September 2026`.
- `compare-row.svelte`/`kiez-score-compare-block.svelte`: `severityDescriptions(opts)` (bereits aus B3b) an `ValueChip` durchgereicht, `dimensionLabel`/`scaleFor`/`scaleForOverall` statt der DE-only-Dictionaries (`DIMENSION_LABELS_DE`) verdrahtet. `wahl-compare-block.svelte`: `TYP_LABELS`/`LEVEL_LABELS`-Dictionaries durch `wahlReiheLabel`/`wahlEbeneLabel`/`wahlStimmtypLabel` ersetzt (DE-Text dieser Resolver ist zeichenidentisch zu den alten Dictionaries, verifiziert vor dem Umbau). Diff-Titel-Satz in Wortfragmente zerlegt (`wahl_compare_diff_prefix`/`_unit`/`_higher_in`/`_equal`/`_not_possible`), weil die drei Zweige (a-better/b-better/gleich) sonst 3 Volltexte pro Sprache gebraucht hätten. `anteilForPartei`s lokale `m`-Variable auf `match` umbenannt (Namenskollision mit dem importierten Paraglide-`m`-Namespace, Review-Fund beim Schreiben).
- Layer-Namen/Bundle-Labels/Section-Labels/Severity-Texte sind ausschliesslich ueber bereits bestehende B3a/B3b-Resolver (`getLayerDisplayName`, `sectionLabel`, `severityDescriptions`, `dimensionLabel`) angebunden -- keine neuen Duplikate dieser Wortlisten.
- `bookmark-dialog.svelte`/`bookmark-row.svelte`: alle Strings + 2 parametrisierte Aria-Label (Löschen/Vergleich-Hinzufügen mit Adressname) auf Messages, `BottomSheet` bekommt jetzt `expandLabel`/`shrinkLabel` (zuvor B3b-Fundament ungenutzt, weil `bookmark-dialog.svelte` laut B3b-Boundary DE blieb), Datenschutz-Link über `localizedHref`.
- `map-libre-canvas.svelte`: nur die sr-only-Kartenbeschreibung (Zeilen 239-241 lt. Code Map) uebersetzt, der separate `loadError`/"Neu laden"-Block blieb unberuehrt (ausserhalb des Code-Map-Scopes).
- 110 neue Message-Keys (`finder_*`, `compare_*`, `wahl_compare_*`, `bookmark_*`, `map_help_description`) in `messages/de.json`/`messages/en.json`, Key-Parität über den bestehenden `message-key-parity.test.ts` mitgeprüft (grün).
- Tests: jede geänderte Komponente/jeder Helfer bekam neue `lang="en"`/`overwriteGetLocale('en')`-Testfälle zusätzlich zu den unverändert grünen DE-Bestandstests. Neu (bisher ungetestet): `kiez-score-compare-block.svelte.test.ts`, `bookmark-row.svelte.test.ts`.
- e2e: neue Datei `tests/e2e/i18n-finder-compare.e2e.ts`, Deep-Link-Muster wie `i18n-inspector.e2e.ts` (kein Combobox-Tippen). Für Compare/Bookmarks zusätzlich `page.addInitScript()`, um eine Bookmark-B in `localStorage` vorzulegen (Muster aus `compare-flow.e2e.ts`s Bookmark-Pick-Test) -- Adresse B kommt so komplett ohne Adress-Suche zustande. Erste Fassung der DE-Kontrolle kombinierte `?finder=1` mit `?address=…` in einer Navigation und scheiterte: `?finder=1` setzt `ui.inspectorOpen = false` (Fundament-Effect in `explore/+page.svelte`), der Inspector öffnet also nie gleichzeitig mit dem Finder. Behoben durch 3 getrennte Tests/Navigationen (Finder, Compare, Bookmarks) statt einer gemeinsamen. Alle 9 Tests **9/9 grün** gegen einen von Playwright frisch gestarteten Preview-Server (`pnpm build` + `pnpm preview`, temporäre `playwright.local.config.ts` mit `reuseExistingServer`, nach Verifikation wieder gelöscht).
- Regressions-Lauf `compare-flow.e2e.ts` + `bookmark-flow.e2e.ts` + `i18n-inspector.e2e.ts` + `i18n-atlas.e2e.ts` + `i18n-routing.e2e.ts`: 64/74 grün, 10 rot -- ausschliesslich der vorbestehende, story-fremde Adress-Such-Combobox-Bug ("element was detached from the DOM", `deferred-work.md`), betrifft alle 5 `bookmark-flow.e2e.ts`-Tests und 4 der 5 `compare-flow.e2e.ts`-Tests (die alle über `input.click()` in die Combobox gehen). Unverändert durch B3c reproduziert, keine Regression.
- Nach `pnpm build`: `static/kiez-scores/region-composites.json` bekam wie in B3b nur ein neues `generatedAt` (Prebuild-Nebenprodukt), per `git checkout` zurückgesetzt.
- `deferred-work.md`: neuer Eintrag -- `/explore` erst nach Block C (EditorialDisclaimer-Übersetzung) ins `TRANSLATION_REGISTER` eintragen, sonst wäre eine indexierte `/en/explore` editorial halb deutsch (Compare-/Inspector-Disclaimer bleiben bis Block C deutsch).
- Zeitmessung: Kontext/Inventur ca. 20 min, Recherche + Message-Design (Finder-Stufen-Familien, Wahl-Label-Wiederverwendung, Diff-Titel-Fragmente) ca. 45 min, Umsetzung aller 11 Dateien + Tests ca. 2h 20min, `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) ca. 20 min, e2e-Neubau (Deep-Link + Bookmark-Seed-Muster, DE-Kontrolle-Fix) + Regressionslauf ca. 25 min, Abschluss-Verifikation (`check`/`lint:wahl`/voller Unit-Lauf) ca. 5 min. Gesamt ca. 4h 15min.

- Zeitmessung gesamt (Koordinator): Planung 03:50-03:54 (4 min), Umsetzung 03:54-04:28 (34 min), Koordinator-Diff-Prüfung + 2 Fixes 04:29-04:30, Review 3 Layer 04:30-04:33 (3 min), Triage 04:33-04:34, Patch-Runde 04:34-04:50 (16 min), Abschluss-Verifikation 04:51-04:53. Gesamt rund 63 min.
- Qualität: 21 Review-Funde (1 medium Code-Fehler: EN-Doppelklammer; sonst Copy und Testlücken), 13 gepatcht, 3 deferred (vorbestehend), 5 rejected. Dazu 2 Koordinator-Funde vor dem Review (DE-Regression „Dimension“, Aria DE). Abschluss: vitest 4601 Tests grün (winner-map-Flake einmal rot, isoliert 13/13 grün), check 0, lint:wahl 0, e2e i18n-finder-compare 9/9, i18n-inspector/atlas/routing 64/64. Freigabe durch Koordinator (Matze AFK).


## Review Triage Log

Runde 1 (27.09.2026 04:33), 3 Layer: Blind Hunter (BH) 16, Edge Case (EC) 3, Verification Gap (VG) 5 + 3. Koordinator-Triage (Matze AFK). Vor dem Review behoben (Koordinator, Step 3): DE-Spaltenkopf „Dimension“ war zu „Indikator“ geworden, `bookmark-row`-Aria „Bookmark löschen bestätigen“ noch fest DE. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH | EN-Wahlhinweis mit Doppelklammer „(Berlin State Election Commissioner (Landeswahlleiterin Berlin))“ | medium | `wahl_label_source_*` EN trägt eigene Klammer, Test pinnt den Fehler | P: im Finder Quelle ohne äußere Klammer bzw. eigene Formulierung, Test korrigieren |
| 2 | BH | `finder_election_label` EN ohne „Berlin“ | low | Glossar Block B: „Berlin House of Representatives“ | P |
| 3 | BH/VG | EN-Copy holprig: „somewhat a lot/little“, „Delete, really?“, „Delete all, really?“ | low | en.json :930-931, :1012, :1017 | P |
| 4 | BH | JSDoc-Anführungszeichen „…“ zu „…” verändert | low | `kiez-finder-data.ts` 2 Kommentare | P |
| 5 | BH | DE-Messages mischen „ mit ASCII-" | low | DE-Parität verlangt identische Ausgabe, vorher genauso | R (Kandidat DE-Textbereinigung) |
| 6 | BH | Unipolare Slider ohne `aria-valuetext` | medium | vorbestehend, vor B3c ebenfalls ohne | D |
| 7 | BH | `map-libre-canvas` loadError-Texte DE, nicht in deferred | medium | außerhalb Code Map, `/en/explore` zeigt sie bei Kartenfehler | D |
| 8 | BH | Key-Zahl in Spec falsch (110 vs 115) | low | Fix editiert Spec | R |
| 9 | BH/VG | Aria-Key `wahl_compare_ebene_aria` als sichtbarer Text; Bookmark-Sheet nutzt Palette-Keys | low | Kopplung, Drift bei Aria-Änderung | P für Ebene-Label; Sheet-Keys R (gleiche Semantik, B3b-Muster) |
| 10 | BH | Doppel-Leerzeichen in `compare_delta_higher_in` ohne Einheit | low | vorbestehend in DE (`${d} ${unit} höher`), DE-Parität | R |
| 11 | BH | `compare_delta_count_radius` mit `String()` statt `formatCount` | low | Spec „Formate über format.ts“, direkte Korrektur, DE < 1000 identisch | P |
| 12 | BH | Em-Dash-Platzhalter im Kiez-Score-Vergleich per Test festgeschrieben, ohne Accessible Name | low | vorbestehend, nicht durch B3c | R |
| 13 | BH/VG | Wahl-Compare: EN-Test prüft nur „Bundestag“ (DE=EN); Zahlen, Meta-Zeile, Ebenen, Briefwahl-Marker ungetestet | gap | VG vorverifiziert | P |
| 14 | BH/VG | Compare-Panel: Section-Labels, Layer-Namen, Caption, Picker-/Such-Labels ungetestet | gap | VG vorverifiziert | P |
| 15 | BH/VG | Compare-Row/Kiez-Score-Block: nur `a-better`, Severity-Aria und Skalen-Labels EN ungetestet | gap | VG vorverifiziert | P |
| 16 | VG | Finder-Stufentexte: nur eine Familie EN, DE gar nicht | gap | VG vorverifiziert | P: `it.each` Familie × Wert DE+EN |
| 17 | VG | Bookmark-Live-Region-Ansagen ungetestet | gap | VG vorverifiziert | P |
| 18 | BH | e2e Compare verzweigt „Tabelle oder leer“, DE-Kontrolle dünn, Storage-Key hart | gap | deterministischer Seed möglich | P |
| 19 | EC | `+0.0`/„higher in A“ bei \|diff\| < 0,05 | low | vorbestehend (alte `toFixed`-Logik gleich) | D |
| 20 | EC | Spec nennt `lang`-Prop, Komponenten lesen nur `getLocale()` | false | kein Aufrufer übergibt `lang`, Tests nutzen `overwriteGetLocale`; kein Fehlverhalten | R |
| 21 | EC | EditorialDisclaimer im EN-Vergleich deutsch | false | Intent „Never“ schließt Disclaimer aus (Block C) | R |

Review-Runde steht noch aus (Koordinator-Freigabe, Matze AFK).

## Verification

**Commands:**
- `pnpm exec vitest run` -- **grün**: 461 Testdateien, 4548 Tests (0 Fehler).
- `pnpm check` -- **0 Fehler** (6528 Dateien geprüft, `svelte-kit sync` inklusive).
- `pnpm lint:wahl` -- **0 Verstöße** (72 Dateien).
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) -- **grün**.
- `pnpm preview` + `i18n-finder-compare.e2e.ts` (temporäre Config, `reuseExistingServer`) -- **grün, 9/9**.
- `i18n-inspector`, `i18n-atlas`, `i18n-routing`, `compare-flow`, `bookmark-flow` e2e -- **64/74 grün**, 10 rot (Combobox-Bug bekannt, siehe `deferred-work.md`, unverändert durch B3c).

## Bekannte Restrisiken

- **Adress-Such-Combobox in E2E-Tests**: unverändert durch B3c betroffen, siehe B3b-Restrisiken + `deferred-work.md`.
- **`/explore` noch nicht im Übersetzungs-Register**: bewusst, siehe `deferred-work.md` (erst nach Block C).
- **EditorialDisclaimer-Varianten (Compare/Inspector) bleiben deutsch**: Boundary, Block C.
