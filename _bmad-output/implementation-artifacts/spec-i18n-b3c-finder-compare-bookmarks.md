---
title: 'i18n Block B3c: Finder, Compare, Bookmarks auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
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
- [ ] `layer-compare.ts`, `kiez-finder-data.ts`, `merge-sections.ts`: opts mit DE-Default, Formate über `format.ts` (+ Tests)
- [ ] `kiez-finder-panel.svelte`: auf Messages umstellen (+ Tests EN/DE)
- [ ] `compare-panel`, `compare-row`, `wahl-compare-block`, `kiez-score-compare-block`: auf Messages, Resolver mit opts, Links über `localizedHref` (+ Tests, 1 neue Testdatei)
- [ ] `bookmark-dialog`, `bookmark-row`: auf Messages, `BottomSheet`-Labels, Datenschutz-Link (+ Tests, 1 neue Testdatei)
- [ ] `map-libre-canvas.svelte`: sr-only-Beschreibung auf Messages (+ Test)
- [ ] e2e `i18n-finder-compare.e2e.ts` (EN + DE-Kontrolle), Key-Parität, `lint:wahl`. In `deferred-work.md`: `/explore`-Register nach Block C.
- [ ] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/explore` mit Finder-Parametern, when der Finder öffnet, then sind alle Finder-Texte englisch und die URL-Parameter unverändert.
- Given `/en/explore` mit zwei Adressen im Vergleich, when der Vergleich lädt, then sind Kopf, Zeilen, Deltas, Wahl- und Kiez-Score-Block englisch und alle Links zeigen auf `/en/…`.
- Given eine `/en`-Seite mit Header, when der Bookmark-Dialog öffnet, then sind Dialog, Zeilen, Bestätigungen und Screenreader-Ansagen englisch.
- Given die DE-Routen, when die bestehenden Tests laufen, then sind sie grün und die DE-Texte unverändert.

## Implementation Notes

- 27.09. 03:50 Start Planung, 03:50-03:52 Inventur (1 Subagent), 03:54 Checkpoint 1 durch Koordinator (Matze AFK). Spec rund 1700 Tokens, bewusst behalten (eine Nutzerfunktion, Split würde Compare-Nachbarn trennen).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + `i18n-finder-compare`, `i18n-inspector`, `i18n-atlas`, `i18n-routing`, `compare-flow`, `bookmark-flow` e2e -- expected: grün (Combobox-Bug bekannt, siehe `deferred-work.md`)
