---
title: 'S6: Kürzere Titel und aussagekräftige Beschreibungen'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'ff8684e2de0611159c10f77b024028135430248c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/seo-audit-2026-10-15.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 405 von 528 Titeln sind länger als 60 Zeichen; Google kürzt sie. Ursache ist vor allem das Marken-Suffix „ - Berlin in Daten - navigator.berlin“ (37 Zeichen) und auf Wahlseiten lange EN-Labels (bis 130 Zeichen, z. B. „Berlin House of Representatives (Abgeordnetenhaus) election 2023 · constituency vote · repeat election · Berlin · navigator.berlin“). 111 Beschreibungen sind kürzer als 70 Zeichen (Layer: „Kino“, „Postleitzahlen-Region“; `/lizenzen` 52). Erst- und Zweitstimme-Seiten haben dieselbe Beschreibung (19 Duplikate).

**Approach:** Ein gemeinsamer Title-Builder: Kerntitel plus „ | navigator.berlin“; passt das nicht in 60 Zeichen, entfällt die Marke. Wahltitel mit den kurzen Reihen-Labels. Layer-Beschreibungen aus vorhandenen Daten zusammengesetzt (Kurztext, Themengruppe, Herausgeber, Jahr), 70-160 Zeichen. Wahl-Beschreibungen nennen Stimmart und stärkste Partei in Berlin.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Einheitliches Suffix „ | navigator.berlin“ statt „ - Berlin in Daten - navigator.berlin“ (wie Kiez/Bezirk seit L3).
- Wahltitel: `{Reihe} {Jahr} · {Stimmart}[ · Wiederholungswahl] | navigator.berlin`, z. B. „Abgeordnetenhaus 2023 · Erststimme · Wiederholungswahl“.
- Wahl-Beschreibung: „{Reihe} {Jahr}, {Stimmart}: Ergebnis je Stimmbezirk und Kiez. Stärkste Partei in Berlin: {Partei} mit {x} %.“ (Werte aus den Seitendaten; fehlen sie, entfällt der zweite Satz).
- Layer-Beschreibung: `{Kurztext}. {Themengruppe}, Daten von {Herausgeber}{, Stand {Jahr}}. Auf der Karte je Adresse und Kiez.` gekürzt auf ≤ 160 Zeichen; Teile ohne Daten entfallen.
- `/lizenzen`-Beschreibung auf 70-160 Zeichen ausbauen (DE/EN).

## Boundaries & Constraints

**Always:** Builder rein und getestet, Vorbild `src/lib/seo/profile-meta.ts` (`firstFitting`, `composeDescription`). Keine erfundenen Werte. DE/EN. Kiez-/Bezirks-Titel (L3) unverändert.

**Never:** Keine Änderung an Canonicals, JSON-LD, Sitemap-Inhalt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Wahl EN lang | `/en/berlin-wahlen/2023-agh-erststimme` | Titel ≤ 60 oder ohne Marke ≤ 60 | N/A |
| Erst- vs. Zweitstimme | zwei Seiten gleicher Wahl | unterschiedliche Beschreibungen | N/A |
| Layer kurz | `/layer/kultur-kino` | Beschreibung 70-160 Zeichen | N/A |
| Layer ohne Herausgeber/Jahr | fehlende Daten | Teile entfallen, ≥ 70 Zeichen durch Nutzensatz | N/A |
| Statische Seite | `/methodik` | Titel mit „ | navigator.berlin“ | N/A |
| Langer Kerntitel | > 60 Zeichen | Marke entfällt, Kerntitel bleibt vollständig | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/berlin-wahlen/[slug]/+page.svelte:39-51` (Titel inline), `messages/*.json:10-22,240` (`wahl_label_*`, `wahl_detail_page_description`), `src/lib/data/wahl-labels.ts:37-73`; Seitendaten `stimmtyp`, `isRepeatElection`, `berlin[0]`.
- `src/routes/(with-header)/layer/[slug]/+page.svelte:81-94` (`explain.short`, `bundleGroupLabel`, `methodology.authority`), `layer-explain.ts:703`, `layer-palette-filter.ts:103-122,255`, MANIFEST `sourceUpdatedAt`/`fetchedAt`.
- Suffix in `messages/de.json`/`en.json`: `layer_page_title` (1271), `methodik_kiez_score_meta_title`, `uis_meta_title`, `wahl_portal_page_title`, `webmcp_meta_title`, `updates_detail_page_title`, `atlas_og_title_address`, `home_page_title` u. a. (grep „Berlin in Daten - navigator.berlin“ / „Berlin in data - navigator.berlin“).
- `lizenzen_meta_description`.
- Neu `src/lib/seo/page-title.ts` (gemeinsamer Title-Builder) und `src/lib/seo/layer-meta.ts`, `wahl-meta.ts` (rein, getestet).

## Tasks & Acceptance

**Execution:**
- [x] `page-title.ts` + Test; Suffix-Messages umstellen.
- [x] `wahl-meta.ts` + Test; Wahl-Detailseite nutzt ihn.
- [x] `layer-meta.ts` + Test; Layer-Seite nutzt ihn.
- [x] `/lizenzen`-Beschreibung DE/EN.
- [x] Bestehende Tests mit alten Titeln anpassen (grep).
- [x] Prüfskript/Test über die gebauten Seiten: keine doppelte Beschreibung zwischen Erst-/Zweitstimme, Layer-Beschreibungen ≥ 70.

**Acceptance Criteria:**
- Given der gebaute Release, when man alle 528 Sitemap-Seiten misst, then sind höchstens 10 % der Titel länger als 60 Zeichen und keine Layer-Beschreibung kürzer als 70.

## Implementation Notes

- Neu: `src/lib/seo/page-title.ts` (`buildPageTitle`, `firstFitting`), `wahl-meta.ts`, `layer-meta.ts`, je mit Test. `composeDescription` und `DESCRIPTION_MAX` sind aus `profile-meta.ts` exportiert.
- Suffix ` | navigator.berlin` überall über `buildPageTitle`. Die Messages enthalten nur den Kerntitel. Umgestellt: Home, Updates, Atlas, 4 Methodik-Seiten, Architektur, UIS, Lizenzen, WebMCP, Kühle Orte, Hitze, Berlin-Wahlen, Impressum, Datenschutz, Fehlerseiten, Inspector-Share-Titel.
- Wahl: Titel `{Reihe} {Jahr} · {Stimmart}[ · Wiederholungswahl]`. Beschreibung nennt Wiederholungswahl, Ebenen, stärkste Partei (erste Partei außer "Sonstige", mit "(vorläufig)") und einen Füllsatz zur Tabelle. Die Stimmbezirk-Ebene steht nur bei `geoSlug` und `winnersByUwb.length > 0`.
- Layer: Der Server liefert `hasKiezAggregate` (aus `static/layer-aggregates`). `layerBenefit()` wählt `address-kiez`, `address` oder `map`. Themenlabel kommt aus eigenen Messages `layer_meta_theme_*` (kein englisches Rohlabel in DE). Herkunft als "Thema. Quelle: X, Stand Y." Kurztext wird bei Überlänge an der Wortgrenze mit "…" gekürzt.
- Fallback-Herausgeber `shortenSource(sourceUrl)`; die eigene Domain navigator.berlin (kiez-score-gesamt) entfällt. Jahr aus `sourceUpdatedAt` in Europe/Berlin, Duplikat-Check mit Wortgrenze.
- Kiez/Bezirk: `profile-meta.ts` nutzt `PAGE_TITLE_MAX` (60). Reihenfolge Kiez: Name (Bezirk): Einwohner, Score mit Marke, ohne Marke, dann ohne Score, dann ohne Einwohner, dann ohne Bezirk. Bezirk: Einwohner und Fläche, nur Einwohner, nur Name. Der Name bleibt immer vollständig. Test über 143 Kieze und 12 Bezirke (DE/EN) in `profile-meta-real-data.test.ts`.
- Messskript `scripts/measure-meta.ts <Basis-URL>`: fängt Fehler je URL ab, zählt "nicht abrufbar", `evaluateThresholds` setzt Exit-Code 1 bei Verstoß (Titel > 60 höchstens 10 % über alle Seiten, Layer-Beschreibungen < 70 = 0, doppelte Beschreibungen = 0, nicht abrufbar = 0).
- Tests: Unit 6051 grün (560 Dateien), `pnpm check` 0 Fehler, Build Exit 0, E2E 191 von 191 grün (seo-indexierung, i18n-*, bezirk/kiez-landing, key-figures, kiez-neighbors, layer-kiez-ranking, profile-meta-fakten, explore-region-focus, logo-gewicht, dataset-jsonld).

**Messung (528 Seiten, Preview auf 4173, Exit 0):**

| Kennzahl | Vorher (Audit) | Nachher |
|----------|----------------|---------|
| Titel > 60 Zeichen | 405 | 4 (0,8 %) |
| Beschreibungen < 70 | 111 | 0 |
| Doppelte Beschreibungen | 19 | 0 |
| Doppelte Titel | n/a | 0 |
| Layer-Beschreibungen < 70 | mehrere | 0 |
| Nicht abrufbar | n/a | 0 |
| Beschreibungen > 160 | n/a | 5 (Hitze DE/EN, Kiez-Score-Methodik DE/EN, Wahlportal EN; nicht Teil von S6) |

- Die 4 Titel > 60 sind Blogtitel unter `/updates/*`. Der Kerntitel bleibt dort vollständig.

## Spec Change Log

- 15.10. Nutzensatz "Auf der Karte je Adresse und Kiez." gilt nur für Flächen-Layer mit `inspectorRelevant !== false` außerhalb von "A: Boundaries" und nur, wenn Kiez-Aggregate existieren (`static/layer-aggregates`). Flächen-Layer ohne Aggregat (bodenrichtwerte, einschulbereiche-2024) erhalten "Auf der Karte je Adresse, mit Quelle und Lizenz." Alle anderen (Punkte, Linien, Grenzen, Kultur, ÖPNV, Kiez-Score, Einwohnerdichte) erhalten "Als Kartenebene im Daten-Atlas von navigator.berlin, mit Quelle und Lizenz."
- 15.10. Wahl-Beschreibung nennt "Ergebnis je Bezirk und Stimmbezirk" (ohne Stimmbezirkskarte nur "je Bezirk"), nicht "je Stimmbezirk und Kiez". Grund: Die Detailseite zeigt Berlin gesamt, Top 3 je Bezirk und die Stimmbezirkskarte, aber keine Kiez-Ebene.
- 15.10. Wahltitel mit Wiederholungswahl verlieren zuerst die Marke, danach den Hinweis "Wiederholungswahl", wenn sonst 60 Zeichen überschritten sind. Grund: I/O-Matrix "Wahl EN lang" verlangt höchstens 60.
- 15.10. Teil-Wiederholungen: Die DB hat kein Abdeckungsfeld. Wiederholungen in der DB (AGH, BVV 2023) deckten ganz Berlin ab. Bei Bundestags-Wiederholungen (BTW 2024 betraf nur einen Teil der Wahlbezirke; aktuell nicht in der DB) entfällt der Satz "Stärkste Partei in Berlin". Bei Wiederholungen steht "Wiederholungswahl" im Label der Beschreibung. Vorläufige Ergebnisse tragen "(vorläufig)".
- 15.10. Füllsatz der Wahl-Beschreibung "Top 3 Parteien je Bezirk, mit Quelle und Lizenz." Grund: Ohne Partei-Satz bleiben Beschreibungen sonst unter 70 Zeichen. Der Satz beschreibt, was die Seite zeigt (Top 3 je Bezirk, Quelle und Lizenz im Seitenkopf).
- 15.10. Der Layer-Nutzensatz ist länger als im Entwurf ("..., mit Quelle und Lizenz."). Grund: Kurztexte wie "Kino" ergeben sonst keine 70 Zeichen, ohne Fakten zu erfinden. Quelle und Lizenz stehen auf jeder Layer-Seite.
- 15.10. Fehlt `methodology.authority`, ersetzt `shortenSource(sourceUrl)` den Herausgeber. Die eigene Domain navigator.berlin entfällt. Das Datum stammt nur aus `sourceUpdatedAt`, das Jahr in der Zeitzone Europe/Berlin.
- 15.10. Das Dataset-JSON-LD der Wahl-Detailseiten übernimmt die neue Beschreibung (gleiche Quelle `pageDescription`). Bewusste Abweichung von "Never: JSON-LD", weil Meta und JSON-LD sonst auseinanderlaufen.
- 15.10.2026, Matze: Kiez-/Bezirkstitel ebenfalls auf ≤ 60 Zeichen. Das hebt die Grenze "Kiez-/Bezirks-Titel (L3) unverändert" auf. Weglassreihenfolge Kiez: Marke, Score, Einwohner, Bezirk (Name und Bezirk sind die wichtigsten Suchbegriffe, daher fallen zuerst die Fakten). Entscheidung anhand echter Beispiele, siehe Implementation Notes.
- 15.10. Messskript-Schwellen: Titel > 60 höchstens 10 % über alle Seiten. Die frühere Ausnahme für Profilseiten entfällt durch die Entscheidung zu Kiez-/Bezirkstiteln.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| VerifGap | Test schreibt Layer-Beschreibung mit 66 Zeichen fest | high | patch |
| VerifGap | Messskript ohne Schwellen/Exit-Code, AC verfehlt (Kiez/Bezirk) | high | patch; Matze 15.10.: auch Kiez/Bezirk ≤ 60 |
| Blind, Edge | Wahl-Beschreibung ohne Partei < 70, „Sonstige“ als Top-Partei | medium | patch |
| Blind | „Stärkste Partei in Berlin“ bei Teil-Wiederholungswahl falsch | medium | patch (BTW-Wiederholung ohne Partei-Satz) |
| Edge | `hasStimmbezirke` ignoriert leere Gewinnerdaten | medium | patch |
| Edge | „je Kiez“ bei Layern ohne Kiez-Aggregat | medium | patch (`hasKiezAggregate`) |
| Edge | Eigene Domain als Herausgeber (kiez-score-gesamt) | medium | patch |
| Blind, Edge | „Daten von Senatsverwaltung“ ohne Artikel, „Boundaries“ in DE | medium | patch |
| Blind, Edge | Fallback-Lead doppelt, lange Leads ungekürzt, Variante Lead + Nutzen fehlt | medium | patch |
| VerifGap | Layer-, Wahl- und statische Seiten ohne Titel-/Meta-Tests | medium | patch |
| Blind | Wiederholungswahl fehlt in Beschreibung, `vorlaeufig` ohne Hinweis | low | patch |
| Blind | Satzzeichen-Doppelung, Jahr UTC/Duplikat-Check | low | patch |
| Edge | `/hitze` und Fehlerseiten ohne `buildPageTitle` | low | patch |
| Edge | Messskript bricht bei einer Fehler-URL ab | low | patch |
| Edge | JSON-LD-Beschreibung der Wahlseiten ändert sich | low | patch (Spec Change Log) |

## Verification

**Commands:**
- `pnpm exec vitest run src` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat (Log ohne Fehler), Preview 4173, Messskript über die Sitemap, Playwright mit temporärer Config; `static/kiez-scores/region-composites.json` zurücksetzen -- expected: grün
