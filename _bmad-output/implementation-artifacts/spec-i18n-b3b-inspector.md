---
title: 'i18n Block B3b: Inspector auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'ff891961c92a3bafc2666854a3b0e7d5368ded5b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b3a-atlas-fundament.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Inspector unter `/en/explore` ist deutsch: rund 270 Strings in `inspector-panel` und 20 Unterkomponenten (Wahl, Demografie, Kühle Orte, Kiez-Score, Layer-Treffer, Klima, Hitze, ÖPNV, Share, Klima-Charts), feste de-DE-Formate, eigene Wahl-Label-Tabellen neben `wahl-labels.ts`. `explore` übergibt kein `lang`, deshalb zeigen Inspector-Links unter `/en` auf DE.

**Approach:** Inspector-Texte auf Paraglide-Messages + EN (~200 bis 230 Keys) nach B3a-Muster, B3a-Resolver/-Formatter mit `LocaleOptions` durchreichen, Locale im Inspector aus `getLocale()` statt Default `'de'`, `wahl-section` auf `wahl-labels.ts`/`format.ts`, alle Inspector-Links über `localizedHref`. Teil 2 von 3 des Atlas (B3c: Finder, Compare, Bookmarks); `/explore` kommt erst nach B3c ins Register.

## Boundaries & Constraints

**Always:**
- Freigabe und Entscheidungen durch Koordinator, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“).
- B3a-Linie: en-GB, Sentence Case, „Kiez“/„Bezirk“ deutsch, „Ortsteil“ → „locality“, geschlossene Kategorien übersetzen, Rohwerte (z.B. `agg.dominant`, Umweltatlas-Kategorien) roh, DE-Ausgabe Zeichen für Zeichen gleich, geteilte Helfer ohne Locale-Angabe DE (`score-membership.ts`, `formatBerlinDate`, `demografieBezugLabel` werden auch vom KI-Export genutzt), Datenschlüssel unverändert (`kom !== 'gültig'`, Layer-Slugs, testids).
- Koordinator-Entscheidung, Matze AFK: Ausnahme von der DE-Parität für den vorbestehenden Formatfehler in `climate-long-view`/`climate-sparkline` (DE zeigt heute „9.45 °C“ mit Punkt): Zahlen laufen über `format.ts`, DE bekommt Komma. In Implementation Notes vermerken.
- Koordinator-Entscheidung, Matze AFK: Kiez-/Bezirk-Links im Inspector werden lokalisiert, obwohl die Zielseiten erst mit B4 übersetzt werden (Linie Block B: Links immer lokalisiert, Zielseite zeigt Fallback-Hinweis).
- `#each`-Keys auf Labels (`layer-card:121`, `klima-pet-card:118`) auf Scope-IDs; `ContextRow` bekommt eine `id`.
- TDD pro AC.

**Never:**
- Kein Finder/Compare/Bookmarks (B3c), keine Fließtexte/Disclaimer (Block C), kein KI-Export-Text (Block D), kein Register-Eintrag `/explore`.
- Tote Komponenten (`layer-level-card`, `inspector-level-toggle`, `charts/kiez-score-hero`) nicht übersetzen; in `deferred-work.md` zur Prüfung vermerken.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/explore?address=…` Inspector | Texte wie vor B3b (Ausnahme: Klima-Chart-Zahlen mit Komma) | N/A |
| EN-Inspector | `/en/explore?address=…` | Panel, Karten, Wahl, Demografie, Klima, Share englisch | N/A |
| EN-Links | Layer-/Kiez-/Wahl-/Methodik-Link im Inspector unter `/en` | Ziel unter `/en/…` | N/A |
| Wahl-Labels | Wahl-Sektion unter `en` | Glossar aus Block B (party vote, House of Representatives …), Zahlen `28.2%` | N/A |
| KI-Export | Export aus dem Inspector | unverändert DE | N/A |
| Klima-Chart DE | Mittelwert 9,45 | „9,45 °C“ | N/A |
| Datenschlüssel | `kom === 'gültig'`, `agg.dominant` | unverändert | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/inspector-panel.svelte` (~28: contextText :261-264, `CARD_LABEL_SINGULAR` :270-275, :294, Share-Titel :439, aria :499-586, Profil-Links :618-660, :669-673, Hitze-Link :785 absolut, Druck-Footer :796-798 `toLocaleDateString('de-DE')`; Resolver ohne opts :278/300/382/384/717/742/766; `lang`-Default `'de'` :77 → `getLocale()`).
- `inspector-panel/`: `wahl-section` (~40; eigene Tabellen :23-34/:344-348 → `wahl-labels.ts`, neuer Key „Berlin gesamt“; Quellen :538-542 → `sourceDisplayLabel`, Lizenz-Resolver; Formate :144/149/155/272; Links :21/:480/:556), `demografie-block` (26, `Intl('de-DE')` :39-40, Link :35), `kuehle-orte-card` (29, `formatDistanceDe`/`formatOpeningHoursDe` → umbenannte B3a-Funktionen mit opts :166/:207), `kiez-score-section` (8, methodik :23), `kiez-score-dimension-row` (16, Delikt-Labels :32-42, `DIMENSION_LABELS_DE` :23, `scale.label` :86, Formate :43/148/175), `layer-hit-row` (12, `getLayerHitDisplay` ohne opts :41, `MauerSektorenDetail`/`ValueChip` Label-Props :251), `layer-card` (12, :40, `#each` :121), `klima-section` (5), `klima-pet-card` (11, :40, `#each` :118), `hitze-trinkbrunnen-toggle` (8), `nearest-stops-card` (11, `MODUS_LABEL` :22-27, Plural Minute :64, :114, `getMobilityRating` :59), `score-membership-badge` (3), `data-stand-banner` (3), `bottom-sheet` (3, DE-Default-Prop, auch `explore`/`layer-palette`/`bookmark-dialog`), `share-sheet` (12, `SHARE_STRINGS` :4-16, :20, :68).
- TS: `inspector-panel/internal/score-membership.ts` (`scoreDimensionLabelFor` → `dimensionLabel`, `LAYER_CONTEXT_NOTE`), `demografie-types.ts:36-40`, `internal/narrative-markers.ts:7-12`.
- Charts: `climate-sparkline.svelte` (~22, `announceGlobal` :107-109, `Intl` :95, `toFixed` :82), `climate-long-view.svelte` (~13, `toFixed` :66-243, Announce :110-112), `charts/score-bar.svelte` (2, Label-Props mit DE-Default).
- Tests (~280 DE-Assertions): `layer-hit-row` (72), `nearest-stops-card` (34), `inspector-panel` (24), `climate-sparkline` (21), `wahl-section` (18), `data-stand-banner` (15), `climate-long-view` (14) u.a.; e2e `i18n-atlas.e2e.ts` (auf Inspector erweitern), `climate-*`, `share-sheet`, `inspector-panel`, `kiez-score-flow`, `kuehle-orte`, `wahl-flow:61`.

## Tasks & Acceptance

**Execution:**
- [x] Inspector-Locale aus `getLocale()`, Resolver/Formatter mit opts durchreichen (+ Tests)
- [x] TS-Helfer (`score-membership`, `demografie-types`, `narrative-markers`) mit opts, DE-Default (+ Tests)
- [x] `wahl-section` auf `wahl-labels.ts`/`format.ts`/Messages (+ Tests)
- [x] Übrige Inspector-Komponenten und Klima-Charts auf Messages, Formate über `format.ts` (+ Tests, DE-Parität außer Klima-Ausnahme)
- [x] Links über `localizedHref`, `#each`-Keys/`ContextRow.id` (+ Tests)
- [x] e2e `/en/explore?address=…` Inspector EN, DE unverändert; Key-Parität, `lint:wahl`; tote Komponenten in `deferred-work.md`
- [x] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/explore?address=<Berliner Adresse>`, when der Inspector lädt, then sind Kopf, Karten, Wahl-, Demografie-, Klima- und Share-Texte englisch und alle Inspector-Links zeigen auf `/en/…`.
- Given `/explore?address=<Adresse>`, when die bestehenden Tests laufen, then sind sie grün und die DE-Texte unverändert (Ausnahme Klima-Zahlen).
- Given der KI-Export, when er aus dem EN-Inspector erzeugt wird, then bleibt sein Text deutsch wie bisher.

## Implementation Notes

- 27.09. 01:50 Start Planung, 01:50-01:54 Inventur (1 Subagent), 01:56 Checkpoint 1 durch Koordinator (Matze AFK).
- Umsetzung (kein Fan-out wegen gemeinsamer `messages/*.json`-Schreibzugriffe, Lehre Block B2/B3a): Fundament (Locale-Wiring `inspector-panel.svelte`, `getLocale()` statt `lang='de'`-Default), TS-Helfer (`score-membership.ts::scoreDimensionLabelFor`→`dimensionLabel`, `contextNoteFor` mit Message statt DE-String; `demografie-types.ts::demografieBezugLabel` mit optionalem `opts`, Default DE, KI-Export ruft weiter ohne `opts`; `narrative-markers.ts` neue `getNarrativeMarkers(opts?)`-Funktion neben unverändertem `BERLIN_NARRATIVE_MARKERS`), `wahl-section.svelte` komplett auf `wahl-labels.ts` (neuer Key `wahl_label_ebene_berlin`) + `format.ts` (`formatPercent`/`formatCount`/`formatWahlDate`) + 24 neue `inspector_wahl_*`-Messages, alle 15 übrigen Inspector-Komponenten (`demografie-block`, `kuehle-orte-card`, `hitze-trinkbrunnen-toggle`, `kiez-score-section`, `kiez-score-dimension-row`, `layer-hit-row`, `layer-card`, `klima-section`, `klima-pet-card`, `nearest-stops-card`, `score-membership-badge`, `data-stand-banner`, `bottom-sheet`, `share-sheet`) plus die zwei Klima-Charts (`climate-sparkline.svelte`, `climate-long-view.svelte`) auf Messages umgestellt, `ContextRow` (`layer-card.svelte`) um `id` erweitert (`#each`-Key von `label` auf `id`), `charts/score-bar.svelte` bekommt `valueLabel`-Prop (DE-Default, Fundament wie `anchorLabel`), gemeinsamer `severityDescriptions(opts?)`-Helfer in `value-severity-mapping.ts` ersetzt vier fast identische `ValueChip`-Kopien. Kiez-/Bezirk-Profil-Links auf `localizedHref` umgestellt (vormals `resolve()` ohne Locale-Präfix, Boundary-Fix analog B3a Task 3). Klima-Chart-Zahlen laufen jetzt über `formatDecimal`, DE bekommt bewusst ein Komma statt des vorbestehenden Punkt-Fehlers (Koordinator-Entscheidung, Boundary-Ausnahme).
- 271 neue Message-Keys (`inspector_*`, `atlas_palette_sheet_expand_label`/`_shrink_label`, `wahl_label_ebene_berlin`) in `messages/de.json`/`messages/en.json`, Key-Parität geprüft (923/923, keine fehlenden Keys je Seite, keine unreferenzierten Keys).
- Tests: jede geänderte Komponente/Helfer bekam neue `lang="en"`- und `getLocale()`-Default-Testfälle (Muster `overwriteGetLocale`) zusätzlich zu den unverändert grünen Bestands-DE-Tests; `charts/score-bar.svelte` bekam eine neue Testdatei (existierte vorher nicht).
- e2e: neue Datei `tests/e2e/i18n-inspector.e2e.ts`. Erste Fassung tippte über die Adress-Such-Combobox (Muster `kiez-score-flow.e2e.ts`) und scheiterte an einem vorbestehenden, story-fremden Hydration-Bug ("element was detached from the DOM", identisch an unverändertem `kiez-score-flow.e2e.ts` reproduziert). Koordinator-Anweisung: stattdessen per Deep-Link öffnen (`?address=lng,lat&q=…`, Story-2.12-Muster wie `home-quick-links.ts` und der Pariser-Platz-Default-Einstieg in `i18n-atlas.e2e.ts`) -- kein Geocoding-API-Mock nötig, `selection.set()` läuft synchron aus den URL-Params. Umgesetzt: 7 Tests (Kopf/Kiez-Score/Wahl/Demografie/Share/Layer-Card/Profil-Links EN + 1 DE-Kontrolltest), alle **7/7 grün**, sowohl gegen einen bereits laufenden als auch gegen einen von Playwright frisch gestarteten (kalten) Preview-Server. Nebenbefund beim Deep-Link-Debugging (Chrome-DevTools-Snapshot einer scheiternden Iteration): das Inspector-Öffnen ist im Selection-Effect an `rawMap` (geladene MapLibre-Instanz) gegated, ein kalter Server-Start kann das erste Map-/Tile-Laden über 15s verzögern -- Wait-Timeout in `i18n-inspector.e2e.ts` deshalb auf 30s gesetzt. Beim selben Debugging ein echter Review-Fund: `kiez-score-dimension-row.svelte`s `ValueChip` bekam `severityDescriptions` nicht übergeben (einzige der vier `ValueChip`-Call-Sites ohne den B3b-Helfer) -- gefixt, neue Regressions-Assertion in `kiez-score-section.svelte.test.ts` ergänzt. Voller `pnpm build` (Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) zweimal grün gelaufen. Einziges Prebuild-Nebenprodukt im Git-Tracking (`static/kiez-scores/region-composites.json`, nur `generatedAt`) beide Male per `git checkout` zurückgesetzt.
- Zeitmessung: Kontext/Inventur ca. 25 min, Fundament (Locale-Wiring + TS-Helfer + wahl-section) ca. 1h 10min, übrige 15 Komponenten + 2 Klima-Charts ca. 2h 40min, Top-Level `inspector-panel.svelte`-Verdrahtung ca. 40 min, Tests (neu + Verifikation je Datei) liefen komponentenweise mit, e2e-Datei (Combobox-Sackgasse + Deep-Link-Umbau + Cold-Start-Diagnose + severityDescriptions-Fix) ca. 1h 40min, Abschluss-Verifikation (voller Unit-Lauf, check, lint:wahl, Key-Parität, 2× Build+e2e) ca. 20 min, Review-Runde 1 Patch-Durchgang (21 Funde, Triage Route 1-21) ca. 1h 10min. Gesamt ca. 8h 10min.
- Review-Runde 1 Nacharbeiten (Fund #18): `SHARE_STRINGS`-Objekt (`share-sheet.svelte`) und die exportierte DE-Text-Konstante `LAYER_CONTEXT_NOTE` (`score-membership.ts`) wurden beim Umbau auf Messages ersatzlos entfernt -- beide hatten keine externen Importer (Grep-geprüft), kein Boundary-Verstoss. `LAYER_CONTEXT_NOTE_SLUGS` (score-membership.ts) ersetzt den Text-Record durch einen reinen Slug-Set-Check, der Text kommt aus `m.inspector_score_membership_laerm_note`.
- Review-Runde 1 Nacharbeiten (Fund #21): e2e-Status für `climate-chart-interaction.e2e.ts`, `climate-heritage.e2e.ts`, `share-sheet.e2e.ts`, `wahl-flow.e2e.ts`, `kiez-score-flow.e2e.ts` -- alle fünf sind vom vorbestehenden, story-fremden Adress-Such-Combobox-Hydration-Bug betroffen (`deferred-work.md`), unverändert durch B3b, nicht Teil dieser Story. `i18n-inspector.e2e.ts` (neu) umgeht den Bug per Deep-Link und lief 2× vollständig grün (Details oben).

- Zeitmessung gesamt (Koordinator): Planung 01:50-01:55 (5 min), Umsetzung 01:55-02:59 (64 min), e2e-Nachzug 02:59-03:13 (14 min), Review 3 Layer 03:13-03:17 (4 min), Patch-Runde 03:18-03:47 (29 min), Abschluss 03:50. Gesamt rund 2 h.
- Qualität: 21 Review-Funde, davon 2 high (6 Inspector-Links ohne /en, EN-Sparkline mit DE-Einheit), 20 gepatcht, 1 rejected. Endstand siehe Verifikation; e2e i18n-inspector/atlas/routing 64/64. Freigabe und Triage durch Koordinator (Matze AFK, Ansage 26.09. 22:57).


## Review Triage Log

Runde 1 (27.09.2026 03:17), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 8, Verification Gap (VG) 7 + 3. Koordinator-Triage (Matze AFK). P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Wahl-Detail-, Wahl-/Kiez-Score-Methodik-, Briefwahl-, Demografie-Learn-more- und Hitze-Link ohne `localizedHref` | high | AC „alle Inspector-Links /en“ verletzt, Tests prüfen nur Texte | P |
| 2 | BH/EC | EN-Sparkline zeigt Default-Einheit „Tage/Jahr“ | high | `klima-section` übergibt kein `unit` | P |
| 3 | EC/VG/BH | DE-Datum Kiez-Score „1.1.2025“ → „01.01.2025“ (+ Zeitzone) | medium | DE-Parität gebrochen, `formatWahlDate` wahl-spezifisch | P: neutraler `formatDate` mit altem DE-Verhalten |
| 4 | EC/VG | Share-Tokens DE „2,0k“ → „2k“ | medium | Zweig ≥ 1000 ungetestet | P |
| 5 | BH | Kontextzeilen-Zahlen (`String(share)`, dB, Gewicht) am Formatter vorbei, DE „66.7%“ | medium | | P: DE exakt wie vorher, EN über `format.ts` |
| 6 | BH | Eigene Locale-Weichen statt `format.ts` (`formatDeltaAbs`, `pct`, Druck-Footer) | medium | Boundary B3a | P |
| 7 | BH | Zahlen fest in Messages (1500m/600m, 1,3/4,8 km/h) | low | Drift bei Code-Änderung | P: Parameter |
| 8 | BH | Plural/Satzbau per Verkettung (Minute, Profil-Link-Suffix, Announce-Fragmente) | low | | P |
| 9 | BH | Viele Duplikat-Keys | low | Pflege | P: `inspector_common_*` |
| 10 | BH | EN-Fehler (cellar and burglary, locality klein, high critical, Burglary) | medium | | P |
| 11 | BH | „Latest:“ in DE-Messages | low | vorher fest im Code, DE-Parität | R (DE bleibt, Kandidat für DE-Textbereinigung) |
| 12 | BH | EN-Tests bestehen auch mit DE-Ausgabe (Median, Min:, Bookmark, Google Maps, U-Bahn, negativ-only) | gap | | P |
| 13 | BH/VG | e2e ohne Klima, Links, Profil-Link-Test überspringt still | gap | | P: harte Assertions EN+DE |
| 14 | VG | Kontextzeilen/Singular-Kartenlabels ungetestet | gap | | P |
| 15 | VG | Wahl-Delta-Title und DE-Prozent ungepinnt | gap | | P |
| 16 | VG | EN-Mobilitätsrating ungetestet | gap | | P |
| 17 | BH/VG | Kommentare widersprechen Code (`LAYER_CONTEXT_NOTE_DE`, `score-bar`) | low | | P |
| 18 | BH | Entfernte Exporte `SHARE_STRINGS`/`LAYER_CONTEXT_NOTE` nicht in Spec | low | keine externen Nutzer | P: Implementation Notes |
| 19 | BH | `klima-pet-card` Fallbacks hart statt Keys | low | Drift | P |
| 20 | EC/BH | Sparkline-Format-Fix-Test ohne Red-History, Kommentar falsch | low | galt nur für `climate-long-view` | P |
| 21 | BH | Spec-Hand-off: e2e-Läufe `climate-*`, `share-sheet`, `wahl-flow`, `kiez-score-flow` ohne Status | low | vorbestehender Combobox-Bug | P: Status dokumentieren |

Alle 21 Funde aus Runde 1 gepatcht (20) bzw. bewusst zurückgewiesen (1, Fund #11 -- "Latest:" bleibt DE, Kandidat für eine eigene DE-Textbereinigung ausserhalb dieser Story). Koordinator-Freigabe/Abschluss-Review steht noch aus.

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- **grün**: 459 Testdateien, 4490 Tests (0 Fehler; bekannter `winner-map`-Flake nicht aufgetreten in dieser Runde).
- `pnpm check` -- **0 Fehler** (7446 Dateien geprüft, `svelte-kit sync` inklusive).
- `pnpm lint:wahl` -- **0 Verstöße** (72 Dateien).
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) -- **grün** (2×).
- `pnpm preview` + `i18n-inspector.e2e.ts` (temporäre Config, `reuseExistingServer`) -- **grün, 7/7**, sowohl gegen warmen als auch gegen kalten Server-Start. `i18n-atlas.e2e.ts` + `i18n-routing.e2e.ts` liefen in einem früheren Lauf ebenfalls vollständig grün.

## Bekannte Restrisiken

- **Adress-Such-Combobox in E2E-Tests ("element was detached from the DOM")**: betrifft weiterhin (unverändert durch B3b) `kiez-score-flow.e2e.ts`, `share-sheet.e2e.ts`, `wahl-flow.e2e.ts`, `climate-chart-interaction.e2e.ts`, `climate-heritage.e2e.ts` -- alle tippen über die Combobox statt per Deep-Link zu öffnen. `tests/e2e/wahl-flow.e2e.ts` hatte denselben Fehlertyp bereits vor dieser Story (`deferred-work.md`, Story 17). `i18n-inspector.e2e.ts` (B3b) ist NICHT betroffen (Deep-Link-Ansatz, Koordinator-Anweisung). Detail in `deferred-work.md`.
- **Roh-Datenkategorien und Fließtexte bleiben unübersetzt** (Boundary, bewusst): `layer-explain.ts`-Kurz-/Langtexte, `EditorialDisclaimer`-Varianten, `source-shortener.ts`-Quellen-/Lizenz-Kürzel bleiben deutsch (Block C). Umweltatlas-`kategorie`, MSS-`si_v`/`di_v`, `wol`/`wol_mode`, Adress-/Namens-Freitext bleiben roh (wie B3a).
- **Tote Komponenten** (`layer-level-card.svelte`, `inspector-level-toggle.svelte`, `charts/kiez-score-hero.svelte`) bleiben unübersetzt, siehe `deferred-work.md`.
