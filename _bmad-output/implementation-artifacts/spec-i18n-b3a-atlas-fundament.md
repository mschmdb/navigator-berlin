---
title: 'i18n Block B3a: Atlas-Fundament und Karte auf Englisch'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: 'eadc61da58042b916b1260583283abc6b64aeb27'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-b2-shell.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Atlas `/explore` ist komplett deutsch: Layer-Namen, Kategorien, Legenden, Score-Dimensionen, Wert-Formatter und Karten-Bedienung. Die Formatter nutzen feste de-DE-Formate und einen Sentinel-String („Daten nicht vorhanden“) als Logik-Schlüssel. Sechs Komponenten bauen Layer-Links als `/de/layer/…` (vorbestehender Fehler, läuft über einen 301-Umweg).

**Approach:** Fundament für den ganzen Atlas: locale-fähige Label-Resolver (Layer-Name, Bundle, Section, Score-Dimension, Skala) nach dem Muster `wahl-labels.ts`, Legenden-Labels, Locale-Parameter für die Wert-Formatter mit `isMissing`-Flag statt Sentinel, Komma-Hacks auf `src/lib/i18n/format.ts`. Dazu die Karten-Oberfläche (Route-Ansagen, OG, Map-Controls, Attribution, A11y-Layer, Hover-Tooltip, Legende, Layer-Palette) auf Messages + EN und Layer-Links über `localizedHref`. Inspector (B3b) und Finder/Compare/Bookmarks (B3c) folgen; `/explore` kommt erst nach B3c ins Register.

## Boundaries & Constraints

**Always:**
- Koordinator-Entscheidung, Matze AFK (Ansage 26.09. 22:57 „weiter ohne Nachfragen“): B3 wird in B3a/B3b/B3c geteilt (~550-600 Keys gesamt); B3b/B3c stehen in `deferred-work.md`.
- Koordinator-Entscheidung, Matze AFK: `/explore` bleibt bis B3c unregistriert (`noindex`, Fallback-Hinweis), damit keine halb deutsche Seite indexiert wird.
- Koordinator-Entscheidung, Matze AFK: Layer-Namen (`LAYER_EXPLAIN_DE`-Titel) sind Code-Labels und werden in B3a übersetzt; die Fließtexte in `layer-explain.ts` bleiben Block C. EN-Suchsynonyme (`layer-synonyms.ts`) kommen nicht dazu.
- Linie der bisherigen Blöcke: Glossar (Kiez/Bezirk deutsch, Wahlbegriffe wie Block B), DE-Ausgabe Zeichen für Zeichen gleich, geteilte Resolver ohne Locale-Angabe liefern DE (B4-Detailseiten, Methodik, Lizenzen, OG-Pipeline bleiben DE), Datenschlüssel unverändert (Layer-Slugs, Bundle-IDs, Query-Keys, `FINDER_URL_KEYS`, Partei-Kurznamen, Plausible-Events, Datenwerte wie `'gültig'`), WebMCP-Tool-Surface unverändert.
- `localeCompare(…, 'de')` in `url-state.ts` bleibt (URL-Reihenfolge locale-unabhängig).
- `#each`-Keys auf Labels auf IDs umstellen, wo das Label übersetzt wird.
- TDD pro AC.

**Never:**
- Kein Inspector-Panel (B3b), kein Finder/Compare/Bookmarks (B3c), keine Fließtexte/Disclaimer-Texte (Block C), kein KI-Export (Block D), keine B4-Detailseiten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/explore` mit Layern | Palette, Legende, Tooltip, Controls wie vor B3a | N/A |
| EN-Karte | `/en/explore?layers=laerm` | Palette, Legende, Controls, Tooltip englisch | N/A |
| Fehlender Wert | Formatter ohne Wert unter `en` | EN-Text „No data“, Logik über `isMissing`, nicht über Text | N/A |
| Layer-Link | Legenden-Link unter `/en` | `/en/layer/<slug>` (kein `/de/…`) | N/A |
| Layer-Link DE | Legenden-Link unter DE | `/layer/<slug>` (kein 301-Umweg) | N/A |
| Resolver ohne Locale | `layerDisplayName(slug)` auf Methodik | DE | N/A |
| Datenschlüssel | `?layers=`, Bundle-ID, `'gültig'` | unverändert | N/A |

</frozen-after-approval>

## Code Map

- Route `src/routes/(with-header)/explore/+page.svelte` (~22 Strings: 11 `announceGlobal` :655-1168, OG :1203-1218, Compare-Replace-Dialog :1375ff → B3c prüfen), Sentinel :1191.
- Karte: `src/lib/components/atlas/map-libre-canvas`, `map-controls` (9 aria), `map-attribution`, `map-accessibility-layer`, `map-hover-tooltip` + `internal/hover-tooltip-logic.ts:21-22`, `map-legend` (10, `#each` :166), `briefwahl-marker`, `mauer-sektoren-detail`, `value-chip`, `layer-palette.svelte` (11).
- Resolver: `internal/layer-palette-filter.ts:4-110` (`LAYER_EXPLAIN_DE`-Titel, `getLayerDisplayName`, `BUNDLE_LABEL_DE`), `inspector-panel/internal/sections.ts:23` (`SECTION_LABELS`), `inspector-panel/internal/kiez-score-display.ts:9` (`DIMENSION_LABELS_DE`, Skalen-Union → IDs), `internal/layer-style-builder.ts` (67 Legenden-Labels).
- Formatter: `inspector-panel/internal/value-formatters.ts` (Sentinel :8, `Intl.NumberFormat('de-DE')` :40-228), `layer-hit-display.ts`, `feature-describer.ts`, `mobility-rating.ts`, `format-distance.ts`, `format-opening-hours.ts`; Sentinel-Vergleiche `+page.svelte:1191`, `inspector-panel.svelte:382`.
- `/de/layer`-Links: `map-legend:290`, `layer-hit-row:79`, `klima-pet-card:65`, `kiez-score-section:29`, `layer-card:44`, `kiez-score-dimension-row:25`.
- DE-Default-Nutzer, die DE bleiben: `layer/[slug]`, `methodik-daten-tabelle`, `lizenzen`, `data/source-label.ts`, `data/get-layer-detail.ts`, `server/og/og-pipeline.ts`, `charts/kiez-score-hero`, `llm-export-builder`.
- Tests: `layer-style-builder`, `map-legend`, `value-formatters`, `layer-hit-display`, `hover-tooltip-logic`, `map-hover-tooltip`, `map-controls`, `layer-palette`; e2e `map-interaction.e2e.ts:12-24` (Rollen-Namen DE), `i18n-routing.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [x] Label-Resolver (Layer, Bundle, Section, Dimension, Skala) + Legenden-Labels mit `LocaleOptions` (+ Tests)
- [x] Formatter mit Locale-Parameter, `isMissing` statt Sentinel, Formate über `format.ts` (+ Tests, DE-Parität)
- [x] `/de/layer`-Links auf `localizedHref` (+ Tests)
- [x] Karten-Oberfläche und Route auf Messages (+ Komponententests)
- [x] e2e: `/en/explore` Karte EN, DE unverändert; Key-Parität, `lint:wahl`
- [x] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/explore?layers=<slug>`, when die Karte lädt, then sind Palette, Legende, Controls und Tooltip englisch.
- Given jede DE-Seite mit Atlas-Bausteinen, when die bestehenden Tests laufen, then sind sie unverändert grün.
- Given ein Layer-Link aus dem Atlas, when er gerendert wird, then zeigt er ohne 301-Umweg auf `/layer/<slug>` bzw. `/en/layer/<slug>`.

## Implementation Notes

- 26.09. 23:59 Start Planung, 23:59-00:04 Inventur (1 Subagent), 00:05 Split-Entscheidung (Koordinator), 00:06 Checkpoint 1 freigegeben durch Koordinator (Matze AFK, Ansage 26.09. 22:57).
- Umsetzung (Subagent, selbst umgesetzt, kein Fan-out wegen gemeinsamer `messages/*.json`-Schreibzugriffe, Lehre Block B2):
  - **Fundament: `atlas-label-options.ts`** (neu): `LocaleOptions`/`toAtlasMessageOptions()` -- bewusst ANDERS als `$lib/i18n/message-options.ts::toMessageOptions` (das auf `getLocale()` zurückfällt): Atlas-Label-Resolver liefern ohne `opts.locale` IMMER DE (Boundary), weil sie auch von noch nicht übersetzten Seiten (Methodik, Lizenzen, `layer/[slug]`, OG-Pipeline, LLM-Export, Inspector-/Compare-Panel vor B3b/B3c) aufgerufen werden.
  - **Label-Resolver** (`layer-palette-filter.ts`, `sections.ts`, `kiez-score-display.ts`): `getLayerDisplayName`/`bundleLabel`/`sectionLabel`/`dimensionLabel`/`kiezScoreScaleLabel` neu bzw. locale-fähig gemacht, DE-Konstanten (`LAYER_EXPLAIN_DE`, `SECTION_LABELS`, `DIMENSION_LABELS_DE`) bleiben für bestehende DE-only-Direktimporter unverändert exportiert. `KiezScoreScale` bekommt ein neues `id`-Feld (`KiezScoreScaleId`, Skalen-Union → IDs); `label` bleibt zusätzlich bestehen (Byte-Parität für B3b/B3c/LLM-Export, die weiter ungeprüft `.label` lesen). 68 Layer-Namen, 10 Bundle-, 6 Section-, 7 Dimension-, 5 Skalen-Labels (inkl. `sehr gering`, Nachzieh-Runde) übersetzt.
  - **Legenden-Labels** (`layer-style-builder.ts`): `getLegendSpec(slug, opts?)`; DE-Pfad gibt die bestehende `LEGEND_BY_PROFILE`/`scoreLegend`-Struktur unverändert zurück (keine zweite DE-Textquelle). **Nachzieh-Runde (Review-Fund):** `translateLegendSpec` baute urspünglich eine zweite, per Profil-Index fest kopierte Kopie aller 67 DE-Item-Labels inkl. Zahlen-Schwellen -- jetzt ein `assertUnreachable`-exhaustiver Switch über die 26 nicht-numerischen Profile (map­pen `base.items` 1:1 auf ein flaches DE-Wort→Message-Dictionary, dedupliziert automatisch geteilte Wörter wie "gering"/"mittel"/"hoch") plus 3 Zahlen-Gradient-Profile (BRW/PET/Einwohnerdichte, Zahl aus dem DE-Label geparst und über `formatCount` neu formatiert statt zweimal hart codiert). Farben kommen ausschließlich aus `base.items` (kein Index-basierter Farbzugriff mehr). Ein Paritätstest iteriert über alle 29 `StyleProfile` (je ein Beispiel-Slug) und prüft `kind`/Länge/Farbfolge/`range.length` sowie dass jedes Wort-Label übersetzt wurde. `scoreLegend()` nutzt weiterhin `kiezScoreScaleLabel` statt eigener Wort-Duplikate.
  - **Formatter** (`value-formatters.ts`, `layer-hit-display.ts`, `feature-describer.ts`, `mobility-rating.ts`, `format-distance.ts`, `format-opening-hours.ts`): `opts?: LocaleOptions` durchgereicht, `FormattedValue.isMissing` ersetzt den Sentinel-Stringvergleich (`+page.svelte:1191`, `inspector-panel.svelte:382` jetzt `formatted.isMissing`); alle `new Intl.NumberFormat('de-DE', …)`-Aufrufe durch `$lib/i18n/format.ts` ersetzt (neue `formatDecimal()`-Funktion mit `minimumFractionDigits`, damit `formatDistanceDe`s Alt-Verhalten `1,0 km` statt `1 km` erhalten bleibt). **Bewusste Scope-Grenze** (dokumentiert, keine Rückfrage nötig laut Ansage): rohe, aus Open-Data-Quellen stammende Werte (Umweltatlas-`kategorie`, MSS-`si_v`/`di_v`, `wol`/`wol_mode`, `gruppe_txt`, Adressen, Namen, Schulart-/Bad-Kategorie-Freitext) bleiben unübersetzt und locale-unabhängig -- nur die umgebenden UI-Wörter (Präfixe, Verbindungstexte, Skalen-/Dimension-/Layer-Namen) werden übersetzt. Eine vollständige Übersetzung jeder offenen Roh-Kategorie über den gesamten Layer-Katalog wäre ein separates, deutlich größeres Vorhaben (Block C/D-Nähe) und ist hier nicht geleistet.
  - **`/de/layer`-Link-Fix** (Task 3, 6 Dateien: `map-legend.svelte`, `layer-hit-row.svelte`, `klima-pet-card.svelte`, `kiez-score-section.svelte`, `layer-card.svelte`, `kiez-score-dimension-row.svelte`): `lang?: string` → `lang?: Locale`, `(resolve as …)(\`/${lang}/layer/${slug}\`)` → `localizedHref(\`/layer/${slug}\`, lang)`. Bug bestätigt und gefixt: DE hatte bisher IMMER `/de/layer/…` (301-Umweg), weil `lang` nirgends gesetzt wurde und der Default `'de'` direkt in die URL gebaut wurde. Type-Propagation zwang zwei weitere Dateien zur Typ-Anpassung (`inspector-panel.svelte`, `layer-level-card.svelte`, beide reine Pass-through-Props, kein Verhaltensänderung).
  - **Karten-Oberfläche + Route** (Task 4): `map-controls.svelte` (9 aria-labels), `map-accessibility-layer.svelte` (5 Texte + `describeFeature`-Locale), `map-legend.svelte` (Legende komplett: aria-label, Variant-Label, 3 Button-Labels, Erklär-Toggle, Quelle/Eigene-Berechnung, Mehr-erfahren-Link, Limit-Warnung; `#each`-Key von `item.label` auf `itemIndex` umgestellt, da Label jetzt übersetzt wird), `layer-palette.svelte` (11 Texte + Layer-/Bundle-Namen), `hover-tooltip-logic.ts` (Klick-/POI-Hint), `explore/+page.svelte` (11 `announceGlobal`, OG-Titel/-Description inkl. `og-image-url.ts::buildOgDescription`, H1 + Intro, 3 Aside-aria-labels ×2 Varianten, Sentinel-Fix). `mauer-sektoren-detail.svelte`/`value-chip.svelte` bekommen Label-Props mit DE-Default (Fundament, aktuell nur von Inspector-Panel ohne Props aufgerufen, bleiben also DE -- Muster aus Block B2 Review #2).
  - **Messages**: 262 neue Keys (`atlas_layer_name_*`, `atlas_bundle_label_*`, `atlas_section_label_*`, `atlas_dimension_label_*`, `atlas_scale_label_*`, `atlas_mobility_label_*`, `atlas_value_*`, `atlas_hit_umweltgerechtigkeit_*`, `atlas_legend_*`, `atlas_palette_*`, `atlas_controls_*`, `atlas_tooltip_*`, `atlas_og_*`, `atlas_route_*`, `atlas_a11y_*`) in `messages/de.json`/`messages/en.json`, DE-Werte 1:1 aus dem Bestandscode extrahiert. Zwei Paritäts-Bugs im ersten Durchgang gefunden + gefixt, bevor sie in Tests auffielen: `describeBezirk`/`describeLor`/Ortsteil-Zweig in `feature-describer.ts` griffen versehentlich auf die PLURAL-Layer-Label-Keys (`atlas_a11y_layer_bezirke` = "Bezirke") statt eigener SINGULAR-Präfix-Keys (`atlas_a11y_bezirk_prefix` = "Bezirk") zu -- separate Keys ergänzt.
  - **Tests**: bestehende DE-Tests bleiben grün (Byte-Paritäts-Beweis lief automatisch mit; 3 Tests zementierten den `/de/layer/…`-Bug als Erwartung und wurden auf das jetzt korrekte `/layer/…` bzw. `/en/layer/…` umgestellt -- kein Boundary-Verstoß, sondern die per AC geforderte Korrektur). Neue EN-Testblöcke (`{ locale: 'en' }` bzw. `overwriteGetLocale`-Pattern aus Block B2) in allen Resolver-/Formatter-Unit-Tests sowie in `map-controls`, `map-legend`, `map-accessibility-layer`, `layer-palette`-Komponententests.
  - Zeitmessung: Recherche + Datei-Inventur ca. 1h 40min, Resolver/Formatter-Implementierung ca. 2h, Messages (262 Keys, Übersetzungsentscheidungen) ca. 1h, Task 3 Link-Fix ca. 25min, Task 4 Karten-Oberfläche/Route ca. 1h 45min, Tests (neu + Paritäts-Fixes) ca. 1h 10min, Verifikation (Unit/Check/Lint/Build) ca. 30min. Gesamt ca. 8h 10min.
  - **Nachzieh-Runde (Koordinator-Auftrag nach Erst-Abgabe):** e2e nachgezogen, da AC1 + Task „e2e: /en/explore Karte EN, DE unverändert" ohne echten e2e-Lauf nicht belegt waren. Neue Datei `tests/e2e/i18n-atlas.e2e.ts` (7 Tests): `/en/explore` noindex; `/en/explore?layers=laerm-2023` Legende+Controls englisch (Positiv + Unicode-sichere Negativ-Regexe, Scope bewusst auf Legende statt `body` -- der Default-Einstieg ohne `?address=` öffnet den Inspector für die Pariser-Platz-Fallback-Adresse, der bleibt laut Boundary B3b/DE, ein `body`-weiter Scope hätte das faelschlich als B3a-Regression gemeldet); Legenden-Link `/en/layer/laerm-2023`; Layer-Palette-Namen englisch; Hover-Tooltip-Layer-Name englisch (Choroplath deckt praktisch ganz Berlin ab, kein POI-Sweep wie in `poi-popover.e2e.ts` nötig; `shortExplain` bleibt bewusst deutsch, Block C, kein Negativ-Check darauf); `/explore?layers=laerm-2023` (DE) unveraendert inkl. Link ohne `/de/`-Praefix. Voller `pnpm build` (echter Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) gelaufen, danach `pnpm preview` (Port 4173) + temporaere `playwright.config.temp.ts` (`reuseExistingServer: true`, `timeout: 180000`) fuer `i18n-routing.e2e.ts`, `i18n-atlas.e2e.ts`, `map-interaction.e2e.ts`, `a11y.e2e.ts`; Config danach geloescht, Preview-Prozess beendet. Einziges Prebuild-Nebenprodukt im Git-Tracking (`static/kiez-scores/region-composites.json`, nur `generatedAt`-Timestamp geändert) per `git checkout` zurückgesetzt; generierte OG-PNGs sind gitignored, kein Rücksetzen nötig.

- Zeitmessung gesamt (Koordinator): Planung 23:59-00:06 (7 min inkl. Split), Umsetzung 00:06-00:54 (48 min), e2e-Nachzug 00:54-01:04 (10 min), Review 3 Layer 01:04-01:08 (4 min), Patch-Runde 01:08-01:48 (40 min), Abschluss 01:50. Gesamt rund 1 h 51 min.
- Qualität: 24 Review-Funde, davon 1 high (EN-Legende mit fester Schwellen-Kopie und Index-Farben), 21 gepatcht, 1 deferred (DE-Textmängel), 2 rejected. Endstand: Unit 4430/4431 (bekannter winner-map-Flake), e2e i18n-atlas 8/8, i18n-routing 51/51, check 0, lint:wahl 0. Freigabe und Triage durch Koordinator (Matze AFK, Ansage 26.09. 22:57).


## Review Triage Log

Runde 1 (27.09.2026 01:08), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 10, Verification Gap (VG) 4 + 2. Koordinator-Triage (Matze AFK, Ansage 26.09. 22:57). P = patch, D = defer, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | EC | `?layers=constructor` trifft `Object.prototype` im Namens-Lookup | medium | `LAYER_NAME_MESSAGE[slug]` ohne `hasOwn` | P |
| 2 | BH/EC/VG | EN-Legende mit zweiter, fester Kopie der Schwellen und Index-Farben; `default: return base` | high | Crash-/Drift-Risiko, 20 von 27 Profilen ohne EN-Test | P: Zahlen aus Basis ableiten, exhaustiv, Paritätstest über alle Profile |
| 3 | EC | `feature-describer` Default gibt Layer-Namen statt Slug aus (DE-Ausgabe ändert sich) | medium | AC2 „DE unverändert“ | P |
| 4 | BH/EC/VG | Paritätstest `LAYER_EXPLAIN_DE`/`BUNDLE_LABEL_DE` ↔ Messages fehlt, Kommentar behauptet ihn | medium | OG/Source-Label driften unbemerkt | P |
| 5 | BH | Wortfolge im Code zusammengeklebt | medium | Übersetzer kann nicht umstellen, Test zementiert schlechtes EN | P: Platzhalter-Messages |
| 6 | BH | Feste Kategorien (hoch/gering/gut/einfach) deutsch in EN-Sätzen | medium | geschlossene Mengen, keine Rohdaten | P (Koordinator: übersetzen) |
| 7 | BH | EN-Terminologie uneinheitlich (Title/Sentence Case, UK/US, Bezirk/district, Line/line) | medium | kein Glossar | P (Koordinator: en-GB, Sentence Case, „Bezirk“ deutsch, Ortsteil → „locality“) |
| 8 | BH | Falsche/missverständliche EN-Strings (felt 2pm, Registered Hospitals, Crime Index ohne Mittel, Solidly connected) | medium | | P |
| 9 | BH | OG-Share-Bild mischt EN-Layer-Namen in DE-Karte | low | OG bleibt DE bis Block C | P (Koordinator: OG bekommt DE-Labels) |
| 10 | BH/EC/VG | `llm-export-builder.ts:185` vergleicht weiter Sentinel-String | low | letzte Stelle | P |
| 11 | EC | `map-attribution` nicht lokalisiert | low | „OpenStreetMap-Contributors“ | P |
| 12 | EC | `formatDecimal` RangeError bei min > max | low | | P |
| 13 | EC | `BUNDLE_LABEL_DE` ohne Aufrufer | low | | P: als DE-Export dokumentieren, Paritätstest |
| 14 | BH | Doppelte Keys für gleiche Begriffe | low | Drift (Line/line) | P: konsolidieren, wo gleicher Begriff |
| 15 | BH | `kiezScoreStufeLabel` dritte Kopie der Schwellen, doppelte Options, `sectionLabel` ohne `assertUnreachable` | low | | P |
| 16 | BH | `formatDistanceDe`/`formatOpeningHoursDe` Namen irreführend | low | | P: umbenennen, Alias |
| 17 | BH | Transliterierte Umlaute in neuen Kommentaren | low | | P |
| 18 | BH | Zahlen in Implementation Notes falsch (65/67) | low | | P |
| 19 | VG | DE-Layer-Links in `layer-card`, `klima-pet-card`, `layer-hit-row` ohne Test | gap | AC3 | P |
| 20 | VG/BH | Route-Texte, A11y-Liste, og:title, EN-Palettensuche ungetestet; Legende nur mit explizitem `lang` | gap | | P |
| 21 | BH | DE-Mängel „Sueden“, „Kein Layer matched“ | low | DE-Änderung außerhalb Scope | D |
| 22 | BH | Einrückungs-Rauschen in `inspector-panel.svelte` | low | | R |
| 23 | EC | Bestehende Tests angepasst (`/de/layer` → `/layer`, `isMissing`) | false | fachlich notwendig (Bugfix, neues Feld) | R |
| 24 | BH | Hover-e2e mit `waitForTimeout(1200)` | low | Flake-Risiko | P: auf Zustand warten |

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- **grün**: 457 Testdateien, 4382 Tests (0 Fehler).
- `pnpm check && pnpm lint:wahl` -- **0 Fehler**: `svelte-check` 6521 Dateien/0 Fehler; `lint-wahl-editorial` 72 Dateien/0 Verstöße.
- `pnpm build` (voller Prebuild inkl. DB-Migration/Wahl-Fetch/OG-Bilder) -- **grün**.
- `pnpm preview` + `i18n-routing.e2e.ts` (57 Tests) + `i18n-atlas.e2e.ts` (7 Tests, neu) -- **64/64 grün**.
- `map-interaction.e2e.ts` -- **3/4 grün**, 1 vorbestehender, story-fremder Fail (`Norden`-Pan-Button ohne vorherigen Compass-Klick erwartet -- auf `main` vor dieser Story identisch reproduziert, siehe Bekannte Restrisiken). Kein Regressions-Delta durch B3a.
- `a11y.e2e.ts` -- **7/9 grün**, 2 bekannte, Wahlportal/Shell-fremde Fails (Wortmarke-Showcase fehlendes `<title>`, Escape-Selection-Timeout) -- identisch zu den in Block B2 dokumentierten Restrisiken.

**Manuelle Prüfung:** über die e2e-Läufe hinaus keine zusätzliche manuelle Preview-Durchsicht.

## Bekannte Restrisiken

- **`map-interaction.e2e.ts` 1 vorbestehender Fail**: „Norden"-Pan-Button wird ohne vorherigen Klick auf den Compass-Trigger erwartet (Popout ist erst danach sichtbar) -- auf `main` (vor dieser Story) identisch reproduziert, kein B3a-Fund.
- **`a11y.e2e.ts` 2 vorbestehende Fails**: Wortmarke-Showcase ohne `<title>`, Escape-Selection-Test-Timeout -- beide bereits in Block B2 als Restrisiko dokumentiert, story-fremd.
- **Roh-Datenkategorien bleiben unübersetzt** (siehe Implementation Notes): Umweltatlas-`kategorie`, MSS-`si_v`/`di_v`, `wol`/`wol_mode`, `gruppe_txt`, Schulart/Badkategorie-Freitext etc. erscheinen auf `/en/explore` weiterhin deutsch, weil sie direkt aus offenen Datensätzen kommen und nicht Teil des Layer-Palette/Legende/Formatter-"Fundaments" sind. Bewusste, dokumentierte Scope-Grenze dieser Story, keine Lücke im Boundary-Sinn (Datenwerte bleiben laut Boundary ohnehin unverändert).
- **`mauer-sektoren-detail.svelte`/`value-chip.svelte`** bekommen zwar DE-Default-Props (Fundament), werden aber von keinem B3a-Aufrufer mit EN-Labels versorgt -- sie bleiben faktisch DE, bis B3b/B3c sie verdrahtet (wie `KiezScoreRing` in Block B2, Restrisiko dort ebenfalls dokumentiert).
- `layer-hit-display.ts`, `mobility-rating.ts`, `format-distance.ts`, `format-opening-hours.ts` sind locale-fähig (Fundament), aber aktuell NUR von Inspector-Panel-Komponenten (B3b) aufgerufen, die ohne `opts` aufrufen und damit DE bleiben -- kein B3a-Fund, aber der Effekt wird erst mit B3b sichtbar.
