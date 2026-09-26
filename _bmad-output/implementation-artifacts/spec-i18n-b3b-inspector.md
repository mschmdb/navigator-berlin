---
title: 'i18n Block B3b: Inspector auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
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
- [ ] Inspector-Locale aus `getLocale()`, Resolver/Formatter mit opts durchreichen (+ Tests)
- [ ] TS-Helfer (`score-membership`, `demografie-types`, `narrative-markers`) mit opts, DE-Default (+ Tests)
- [ ] `wahl-section` auf `wahl-labels.ts`/`format.ts`/Messages (+ Tests)
- [ ] Übrige Inspector-Komponenten und Klima-Charts auf Messages, Formate über `format.ts` (+ Tests, DE-Parität außer Klima-Ausnahme)
- [ ] Links über `localizedHref`, `#each`-Keys/`ContextRow.id` (+ Tests)
- [ ] e2e `/en/explore?address=…` Inspector EN, DE unverändert; Key-Parität, `lint:wahl`; tote Komponenten in `deferred-work.md`
- [ ] Zeitmessung je Phase

**Acceptance Criteria:**
- Given `/en/explore?address=<Berliner Adresse>`, when der Inspector lädt, then sind Kopf, Karten, Wahl-, Demografie-, Klima- und Share-Texte englisch und alle Inspector-Links zeigen auf `/en/…`.
- Given `/explore?address=<Adresse>`, when die bestehenden Tests laufen, then sind sie grün und die DE-Texte unverändert (Ausnahme Klima-Zahlen).
- Given der KI-Export, when er aus dem EN-Inspector erzeugt wird, then bleibt sein Text deutsch wie bisher.

## Implementation Notes

- 27.09. 01:50 Start Planung, 01:50-01:54 Inventur (1 Subagent), 01:56 Checkpoint 1 durch Koordinator (Matze AFK).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- expected: grün (bekannter `winner-map`-Flake ausgenommen)
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build`, Preview, `i18n-atlas.e2e.ts`, `i18n-routing.e2e.ts`, `climate-*.e2e.ts`, `share-sheet.e2e.ts`, `wahl-flow.e2e.ts`, `kiez-score-flow.e2e.ts` -- expected: grün (bekannte Fails ausgenommen)
