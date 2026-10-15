---
title: 'L1: Deep-Link /explore?kiez= und ?bezirk= mit Ortsfokus'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '0ed1e0f638488ef40d79c12580cdb25bc434f895'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epic-landing-enhance.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kiez- und Bezirksseiten können nicht auf die Karte mit genau diesem Ort verlinken. `/explore` kennt nur Adresse, Ausschnitt, Layer und Finder. Die Karten-Buttons aus L2, L4, L5 und L7 brauchen deshalb einen Link mit Ortsfokus.

**Approach:** Neue URL-Parameter `kiez=<slug>` und `bezirk=<slug>`. Beim Laden zoomt die Karte auf den Umriss, zeigt ihn als Kontur und sagt den Ort für Screenreader an. Der Parameter bleibt in der URL und damit teilbar, bis die Person einen anderen Ort wählt.

**Entscheidung Matze 14.10.:** Kein Inspector beim Fokus, sondern eine kleine Kiez-Karte (Bezirk analog): Name, Bezirk, Kiez-Score mit Rang („Platz X von 143“, Bezirk „von 12“), Link „Zur Kiez-Seite“ bzw. „Zur Bezirksseite“ und Hinweis „Tippe in den Kiez für Werte an einer Adresse“. Fehlt ein Score, entfällt die Score-Zeile.

## Boundaries & Constraints

**Always:** Slugs exakt wie `buildKiezSlugs` (Kiez) und `normalizeSlug(Gemeinde_name)` (Bezirk). Bestehende Parameter (`layers`, `lead`, `address`, `q`, `bbox`, `zoom`, `center`, `finder`, `fw`, `fp`) funktionieren unverändert und lassen sich kombinieren. `fitBounds` respektiert reduced motion. Ansage über `announceGlobal`, Texte DE und EN.

**Never:** Kein Ändern des Slug-Vertrags, von `buildExplorerDeepLink` oder der `region-outline-*`-IDs. Keine Änderung an Kiez-, Bezirks- oder Layer-Seiten (Buttons kommen in L2, L4, L5, L7). Kein neuer Score oder neue Aggregat-Berechnung.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez | `?kiez=reuterstrasse` | Karte zeigt ganzen Kiez mit Rand, Kontur sichtbar, Ansage „Reuterstraße, Neukölln“ | N/A |
| Bezirk | `?bezirk=neukoelln` | Karte zeigt ganzen Bezirk, Kontur sichtbar, Ansage | N/A |
| Dubletten-Slug | `?kiez=heerstrasse-spandau` | richtiger Kiez | N/A |
| Mit Layer | `?kiez=x&layers=zensus-altbau-anteil-2022` | Layer aktiv, Fokus auf Kiez | N/A |
| Beides | `?kiez=x&bezirk=y` | Kiez gewinnt, `bezirk` wird ignoriert | N/A |
| Mit Adresse | `?kiez=x&address=lng,lat` | Adresse gewinnt wie heute (Inspector), Kiez-Parameter wird entfernt | N/A |
| Mit `bbox`/`zoom` | `?kiez=x&bbox=…` | Kiez-Fokus gewinnt beim ersten Laden | N/A |
| Unbekannt | `?kiez=gibtsnicht` | Karte startet normal, Parameter wird entfernt | kein Fehler, keine Ansage |
| Andere Wahl | Fokus aktiv, Person klickt Adresse/Karte | Kiez-Parameter und Kontur verschwinden, normaler Adress-Flow | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/explore/+page.ts:6-16` -- liest URL-State; hier `kiez`/`bezirk` parsen.
- `src/lib/utils/url-state.ts` -- Parser/Serializer (`parseAddress` 227, `parseLayers` 133); neue `parseRegionFocus` + Test in `url-state.test.ts`. `buildExplorerDeepLink` (222) nicht ändern; neuer Builder `buildRegionFocusHref(kind, slug, layers?)` für L2+.
- `src/routes/(with-header)/explore/+page.svelte` -- `onMount` (246-302, Priorität finder → address → Default; Fokus vor Default einreihen), Outline-Muster 536-605 (`containingFeature`, `COLORS.markerPin`, Stale-Guard) als Vorlage für eine eigene Fokus-Kontur, `clearMarker`/`placeMarker` (656/677) entfernen den Fokus, Sync via `goto('?…', {replaceState, keepFocus, noScroll})`. Datei ist groß: Logik in neues Modul `src/lib/components/atlas/internal/region-focus.ts` (Slug → Feature → Bbox, rein, getestet).
- `src/lib/data/internal/kiez-slug.ts` (`buildKiezSlugs` 23), `src/lib/components/wahl-portal/internal/winner-map-data.ts:116-150` (`buildKiezSlugsForFeatures`, `bezirkSlugsForFeatures`) -- index-gleiche Slug-Helfer für Client wiederverwenden.
- `src/lib/data/internal/layer-fetch.ts` (`fetchLayer`), `loadManifest` -- GeoJSON `lor-bezirksregion` (143) und `bezirke` (12) laden.
- `src/lib/components/atlas/map-libre-canvas.svelte:112` -- `mapHandle.fitBounds(bbox)`, reduced motion schon drin.
- `src/lib/data/region-display-names.ts:36` -- `buildRegionDisplayNames` für Anzeigenamen.
- `src/lib/utils/aria-live.ts` -- `announceGlobal`; Messages `atlas_route_announce_*` in `messages/de.json`/`en.json`.
- `src/lib/webmcp/` -- baut nur Finder-URLs; keine Änderung nötig.
- `src/lib/data/get-region-composites.ts` -- `loadRegionComposites` + `regionComposite(data, scope, kiezSlug, bezirkSlug)` für den Score. Rang = Position nach Composite absteigend; muss mit dem Rang auf `/kiez/<slug>` (`compositeRank`) übereinstimmen, Parität im Test gegen die Kiez-Seiten-Daten prüfen.
- Inspector (`inspector-panel.svelte`, `ui.selectedAddress`) bleibt unverändert; die Kiez-Karte ist eine neue Komponente `src/lib/components/atlas/region-focus-card.svelte` (Panel-Stil wie Inspector, Fokus-Ziel nach dem Laden nicht erzwingen).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/utils/url-state.test.ts`, `url-state.ts` -- Red/Green: `parseRegionFocus` (Kiez vor Bezirk, Slug-Validierung Format) und `buildRegionFocusHref`.
- [x] `src/lib/components/atlas/internal/region-focus.test.ts`, `region-focus.ts` -- Red/Green: Slug → Feature (inkl. Dublette), Bbox, unbekannt → null.
- [x] `src/lib/components/atlas/region-focus-card.svelte` + `.svelte.test.ts` -- Red/Green: Name, Bezirk, Score mit Rang, ohne Score keine Score-Zeile, Links auf Kiez-/Bezirksseite (lokalisiert), Hinweistext, schließbar per Tastatur.
- [x] `+page.ts`, `+page.svelte` -- Fokus in Mount-Reihenfolge, Kontur-Layer, Entfernen bei Adresswahl, unbekannten Slug aus URL tilgen.
- [x] `messages/de.json`, `messages/en.json` -- Ansage-Text.
- [x] `tests/e2e/explore-region-focus.test.ts` -- Kiez, Bezirk, unbekannt, Fokus verschwindet nach Adresswahl.

**Acceptance Criteria:**
- Given `/explore?kiez=reuterstrasse` auf Mobil (375 px) und Desktop, when die Seite lädt, then ist der ganze Kiez sichtbar und umrandet, und der Screenreader hört „Reuterstraße, Neukölln“, und die Kiez-Karte zeigt Score und denselben Rang wie `/kiez/reuterstrasse`.
- Given Fokus aktiv, when die Person die URL teilt, then landet die Empfängerin auf demselben Fokus.
- Given `/en/explore?bezirk=pankow`, when die Seite lädt, then kommt die Ansage auf Englisch.

## Implementation Notes

- E2E-Datei heißt `tests/e2e/explore-region-focus.e2e.ts`: `playwright.config.ts` matcht nur `*.e2e.{ts,js}`. 11 Fälle inkl. nachgereichter Matrix-Zeile „Mit bbox“.
- Neue Module: `region-focus.ts` (Slug → Feature/Bbox, `compositeRank` dicht wie `rankBy` aus `scripts/lib/ranking`, Paritätstest über alle 143 + 12), `region-focus-map.ts` (eigene IDs `region-focus-*`, `fitBounds` mit Padding, ohne Animation bei reduced motion), `region-focus-card.svelte` (Overlay oben links, kein Fokus-Klau, Escape/Button schließen). `bezCodeToBezirkName` aus `winner-map-data.ts` exportiert.
- Rang „Platz X von N“ für alle Ränge wie `ScoreRankLink` auf der Kiez-Seite; `formatRank`-Wortlaut („unteres Viertel“) nicht übernommen.
- Mobil liegt die Karte über der Map; `fitBounds` lässt oben 240 px frei.
- `+page.svelte` wächst auf ~1605 Zeilen (vorher ~1465), über der 500-Zeilen-Regel wie zuvor.
- Bekannt: `tests/e2e/inspector-panel.e2e.ts` (Adresssuche, Combobox nicht gefunden) scheitert laut Subagent schon auf dem Branch; nicht Teil dieser Story.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap | Fokus nur in onMount, Navigation innerhalb /explore ignoriert ihn | medium | patch |
| Edge, VerifGap | Finder öffnen: konkurrierende `goto` lassen `kiez` stehen, Card/Kontur bleiben neben Finder | medium | patch |
| Blind | Unbekannter Slug: kein Pariser-Platz-Default, leere Karte | medium | patch |
| Edge | Fetch-Fehler entfernt Parameter eines gültigen Links | low | patch (direkte Korrektur im selben Zweig) |
| Blind | Tastaturfokus fällt nach Schließen auf body (WCAG 2.4.3) | medium | patch |
| Blind | Compare-Modus lässt Fokus halb aktiv, Card kehrt zurück | low | patch |
| Edge | Route verlassen während Laden: addSource auf entfernte Karte | low | patch |
| Edge | Mobil-Padding größer als Querformat-Kartenhöhe, fitBounds bewegt nichts | medium | patch |
| Blind | `region_focus_card_aria_*` ungenutzt, Region ohne Typ | low | patch |
| Blind | 375-px-E2E flaky, `waitForTimeout`, Inspector/Button nicht geprüft | low | patch |
| VerifGap | Stale-Guard ohne Test | medium | patch (E2E mit verzögertem GeoJSON) |
| VerifGap | Kontur und z-order nur im Helper getestet, nicht auf der Seite | medium | defer (kein E2E-Zugriff auf Map-Layer) |
| VerifGap | Unterdrückung alter Auswahl beim Fokus ohne Test | medium | defer nach L2 (erst dort gibt es den In-App-Link) |
| Edge | `dropRegionFocusParams` vs. entprellter `syncViewport` aus altem href | maybe-false | defer: `syncViewport` liest `window.location` erst beim Ausführen; offen, ob `goto` bis dahin die URL ersetzt hat |
| Blind | `buildRegionFocusHref` ohne Locale, noch ohne Aufrufer | low | reject: L2+ hüllt in `localizedHref` wie alle Profil-Links; Hinweis in L2-Spec |
| Blind | `region-composites.json` fehlt im Diff | false | Datei ändert nur `generatedAt` durch lokalen Build, zurückgesetzt |
| Blind | `compositeRank` umgeht `regionComposite`-Fallback | false | Test löst alle 143 Composite-Keys als Fokus-Slugs auf, Parität über `rankBy` |
| Blind | Hinweis „Tippe …“ nur für Touch | low | reject: Wortlaut von Matze im frozen-Block freigegeben |
| Edge | Leerer Bezirkname erzeugt „Karte zeigt X, “ | low | reject: alle 143 Kieze haben BEZ-Code (Test löst alle auf) |
| Edge | `compositeRank` ignoriert null, Pipeline schreibt `?? 0` | low | reject: `region-composites.json` enthält 0 null-Werte |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/utils src/lib/components/atlas` -- expected: grün
- `pnpm test:e2e -- explore-region-focus` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks:**
- Dev-Server: `/explore?kiez=reuterstrasse`, `/explore?bezirk=neukoelln&layers=zensus-altbau-anteil-2022`, Screenshots unter `_bmad-output/implementation-artifacts/screenshots/explore-ortsfokus/`.
