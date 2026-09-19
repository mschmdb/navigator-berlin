---
title: 'Zeit-Animation mit Wechsel-Markierung'
type: 'feature'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '0cdca29871f39238d0e668cbc97bbb13e9cd3866'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Winner-Map zeigt immer nur ein Jahr; Besucher können den Wandel über eine Wahl-Reihe weder abspielen noch sehen, wo und wann die stärkste Kraft wechselte (CAP-3, CAP-4). Das Kapitel „Wechsel" ist ein Platzhalter.

**Approach:** Zeit-Leiste (Play/Pause + Jahr-Slider) unter der Winner-Map. Auf Kiez/Bezirk werden alle Jahre einmal als Feature-Properties gebacken; der Jahr-Wechsel ist nur noch `setPaintProperty` (Finder-Engine-Muster). Gebiete, deren Sieger im aktiven Jahr wechselte, bekommen eine Outline-Markierung. Das Wechsel-Kapitel zeigt eine eigene Karte (Färbung nach Wechsel-Häufigkeit) plus kompakte Liste (Gebiet, Jahr, von → nach). Von/Nach kommt client-seitig aus der Bulk-Winners-Response.

**Direktiven (Matze):** done_checkpoint (Abnahme am Ende, keine Spec-Zwischenfreigabe). Zeit-Animation nie auf Stimmbezirken (Zuschnitts-Wechsel zwischen Wahl-Generationen).

## Boundaries & Constraints

**Always:**
- Jahr-Wechsel auf kiez/bezirk färbt per `setPaintProperty` um; kein `setData`, kein Netz-Request pro Jahr. Karte wird nie zerstört oder re-initialisiert.
- `prefers-reduced-motion: reduce`: kein Timer-Lauf; der Play-Button steppt pro Klick genau ein Jahr weiter (reaktives matchMedia-Muster wie `pixel-logo.svelte`).
- A11y (ux-blueprint Z. 40): Play/Pause als echter Button mit `aria-pressed`; Slider als `<input type="range">` mit `aria-valuetext` = Jahr(+„Wiederholungswahl").
- URL trägt Reihe + Jahr; Reload stellt exakt diese Ansicht her. Während Play/Drag höchstens ~3 URL-Writes pro Sekunde; das finale Jahr landet immer in der URL.
- Wiederholungswahl-Regel: 2021→2023 (AGH/BVV) zählt nie als Wechsel; Wechsel rechnen auf der effektiven Reihe (2023 ersetzt 2021). Beim angezeigten Jahr 2021 ist kein Gebiet markiert.
- Anteils-Gleichstände deterministisch alphabetisch (localeCompare 'de'), identisch zur Server-Regel.
- Partei-Farben nur aus `partei-farben.ts`/API-`farbe_hex`; Formulierungen bestehen `lint:wahl`; alle Dateien < 500 Zeilen; keine Em-Dashes.
- Ein JS-Zwilling der Paint-Expression speist Tooltip/Tabelle/Takeaway; ein Test verklammert Zwilling und Expression (Finder-Muster).

**Never:**
- Keine Animation/Zeit-Leiste auf Stimmbezirks-Ebene; dort stattdessen ein Satz + Button „Zur Kiez-Ebene" (`setEbene`). Stimmbezirks-Datenpfad (jahrweise Winners, Geometrie-Swap, `setData`) bleibt unverändert.
- Keine neue Server-API, keine Schema-/Build-Script-Änderung: Von/Nach-Parteien und Wechsel-Jahre client-seitig aus der bereits geladenen Bulk-Winners-Response ableiten.
- Kein Autoplay beim Seiten-Load. Kein Umbau von Portal-Steuerleiste, Ergebnis-Panel oder AddressHighlight.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play-Durchlauf | Kiez-Ebene, AGH, Play | Jahre aufsteigend (~1,5 s/Jahr), Umfärbung ohne neuen winners-Request, am letzten Jahr Auto-Pause, URL trägt letztes Jahr | N/A |
| Slider-Drag | Range-Input auf 2016 | Sofortige Umfärbung, `aria-valuetext` „2016", Steuerleisten-Chip 2016 aktiv | N/A |
| Reduced Motion | `prefers-reduced-motion: reduce`, Klick auf Play | Genau ein Jahr weiter, kein Timer | N/A |
| Wechsel-Markierung | Aktives Jahr = Wechsel-Jahr des Gebiets | Outline am Gebiet sichtbar; andere Jahre: keine Outline | N/A |
| AGH 2021 aktiv | Wiederholungs-Slot | Kein Gebiet markiert (2021 in effektiver Reihe ersetzt) | N/A |
| Wechsel-Liste | Bulk-Winners mit 2016: SPD→2021: GRÜNE→2023(W): GRÜNE | Ein Wechsel: 2021 SPD → GRÜNE; 2023 erscheint nicht als Wechsel | N/A |
| DB-los / leer | Bulk-Winners leer | Wechsel-Kapitel zeigt Hinweis-Satz, keine leere Karte/Liste, kein Crash | Leer-Zustand |
| Stimmbezirk-Ebene | Default-Ansicht | Zeit-Leiste zeigt Hinweis + „Zur Kiez-Ebene"-Button statt Play/Slider | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/wahl-portal/winner-map.svelte` (477 Z., Limit 500!) -- Einbau Zeit-Leiste + Expression-Pfad; heutiger Jahr-Wechsel = `filterWinnersByJahr` → `joinWinnersToFeatures` → `ensureMap(setData)` (Z. 134-136, 265-278, 325-327). Winners-Bulk-Cache pro `typ-stimmtyp-ebene` (Z. 95-126) liefert ALLE Jahre.
- `src/lib/components/wahl-portal/internal/winner-map-maplibre.svelte.ts` -- `WinnerMapController`: `ensureMap` (nur setData nach Init), `setPatternsEnabled` (setPaintProperty-Vorbild), Layers `winners-fill`/`winners-highlight`, Paint heute `['get','farbe']` + Anteils-Opacity-Interpolate (Z. 190-207). Hier `setActiveJahr(...)` + Wechsel-Outline-Layer ergänzen; `MapLibreMapLike` hat `setPaintProperty` schon deklariert.
- `src/lib/components/wahl-portal/internal/winner-map-data.ts` (311 Z.) -- `WinnerApiRow`, `filterWinnersByJahr`, `joinWinnersToFeatures`, Slug/Namen-Arrays (`buildKiezSlugsForFeatures` etc.), `ANTEIL_OPACITY_RAMP`, `NEUTRAL_OPACITY/FARBE`, `opacityForAnteil`. Wiederverwenden, NICHT aufblähen: Neues in eigene Dateien.
- `src/lib/components/atlas/internal/kiez-finder-engine.ts` -- Referenz-Muster: Properties flach backen, Expression bauen, `setPaintProperty` statt `setData`, rAF+setTimeout-Frame-Coalescing (Z. 138-164; rAF feuert in versteckten Tabs nie), JS-Zwilling `computeFitJs` mit Klammer-Test.
- `src/lib/server/wahl/analytik.ts` -- Server-Referenz für den Client-Zwilling: `mergeRepeatElections` (ersetzt Eltern-Jahr in-place), `winningPartei` (alphabetischer Tie-Break). NICHT in Client importieren (`$lib/server`), Semantik spiegeln + testen.
- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- Kapitel „wechsel" aus `PLACEHOLDER_CHAPTERS` (Z. 110-147) herauslösen, analog `KARTE_CHAPTER` + eigener `KapitelSection`-Block (Z. 231-233); `NAV_CHAPTERS`-Reihenfolge (Z. 149-154) unverändert. URL-Sync-Doppel-Effect mit `untrack` (Z. 50-76) NICHT umbauen; jeder `setJahr` triggert `goto(replaceState)` → Write-Begrenzung gehört in die Zeit-Leiste (lokales Anzeige-Jahr, debounced `setJahr`-Commit, Karte hört aufs Anzeige-Jahr).
- `src/lib/state/wahl-portal-context.svelte.ts` -- `setJahr`, `currentJahr`, `jahreForReihe` (dedupliziert, ABSTEIGEND sortiert → für Slider umdrehen; enthält 2021 UND 2023).
- `src/lib/components/atlas/map-libre-canvas.svelte` -- generische Canvas; für die Wechsel-Kapitel-Karte Wiederverwendung prüfen, sonst schlanker Controller nach `WinnerMapController`-Muster (Basemap `/map-style.json`, maxBounds, minZoom 9).
- `src/lib/components/ui/pixel-logo.svelte:61-71` -- prefers-reduced-motion als reaktives matchMedia-Muster mit Listener.
- Tests-Bestand: `winner-map.svelte.test.ts` (Context-Probe, `fakeFetch(routes)`, Manifest/FC-Fixtures), `ergebnis-panel.svelte.test.ts:97-114` (`onRequest`-Counter), `tests/e2e/berlin-wahlen.e2e.ts` (page.route-Counter, Fixture `WINNERS_AGH_KIEZ` mit 2023+2021). Neue `wahl-portal/`-Dateien werden von `lint:wahl` automatisch gescannt.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [x] `src/lib/components/wahl-portal/internal/winner-map-expressions.ts` + Test -- Neu: `bakeJahrProperties(features, winnersAlleJahre)` (flache Keys `w_<jahr>_farbe|anteil|hw|wechsel`), `fillColorExpression(jahr)`, `fillOpacityExpression(jahr)` (Anteils-Ramp wie Bestand, Neutral-Fallback), `wechselOutlineExpression(jahr)`; JS-Zwilling `winnerForJahrJs(props, jahr)`; Klammer-Test Zwilling↔Expression-Semantik.
- [x] `src/lib/components/wahl-portal/internal/wechsel-data.ts` + Test -- Neu: Client-Zwilling `computeWechselFromRows(rows: WinnerApiRow[])` → pro Gebiet effektive Reihe (Wiederholungs-Merge), Wechsel-Liste `{gebietSlug, gebietName?, jahr, von, nach}`, `wechselCountByGebiet`; Tie-Break alphabetisch; Fixtures decken Matrix-Zeilen Wiederholung/Gleichstand/Lücken ab.
- [x] `src/lib/components/wahl-portal/internal/winner-map-maplibre.svelte.ts` -- `setActiveJahr(jahr)`: setzt fill-color/fill-opacity via Expressions + Wechsel-Outline-Layer (neuer line-Layer über `winners-fill`); kein Re-Init. Frame-Coalescing (rAF+setTimeout) bewusst NICHT ergänzt, siehe Implementation Notes.
- [x] `src/lib/components/wahl-portal/zeit-animation.svelte` + `internal/zeit-animation.svelte.ts` + Tests -- Neu: Leiste (Play/Pause `aria-pressed`, Range `aria-valuetext`, Jahr-Anzeige mit „·W"-Flag wie Steuerleiste); Controller: Timer ~1,5 s, Auto-Pause am Ende, reduced-motion-Step-Modus, lokales Anzeige-Jahr + debounced `setJahr`-Commit (finales Jahr garantiert).
- [x] `src/lib/components/wahl-portal/winner-map.svelte` + Test-Erweiterung -- kiez/bezirk: einmal `bakeJahrProperties`-FC je Reihe×Ebene bauen (`setData` nur bei Reihen-/Ebenen-/Geometrie-Wechsel), Jahr-Wechsel ruft `setActiveJahr`; Zeit-Leiste unter der Karte (stimmbezirk: Hinweis-Variante); Tooltip/Tabelle/Takeaway über JS-Zwilling bzw. bestehendes `winnersForJahr`; Datei < 500 Zeilen (Winners-/Geometrie-Fetch in eigene Loader-Klassen ausgelagert, 478 Zeilen).
- [x] `src/lib/components/wahl-portal/wechsel-kapitel.svelte` (+ internal-Controller falls nötig) + Tests -- Neu: eigene Karte (Kiez-Färbung nach Wechsel-Häufigkeit: 0 neutral / 1 / 2+, Legende, Tabellen-Alternative nach Winner-Map-Muster) + kompakte Liste (Gebiet, Jahr, von → nach; sortiert Häufigkeit desc, dann alphabetisch; Disclosure ab 20 Einträgen); Takeaway-Satz; Leer-Zustand.
- [x] `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- „wechsel" aus den Platzhaltern gelöst, `WechselKapitel` gemountet; Nav-Reihenfolge identisch.
- [x] `tests/e2e/berlin-wahlen.e2e.ts` -- Play-Durchlauf: `winnersRequestCount` bleibt 1, Canvas durchgehend sichtbar, `aria-pressed`-Toggle, URL trägt Endjahr; Wechsel-Kapitel rendert Liste aus Fixture.

**Acceptance Criteria:**
- Given Kiez-Ansicht mit geladener Reihe, when Play durchläuft, then färbt die Karte jedes Jahr ohne weiteren winners-Request um und pausiert am letzten Jahr (Matrix 1).
- Given `?reihe=agh&jahr=2016&ebene=kiez`, when Reload, then zeigen Karte, Slider und Steuerleiste 2016.
- Given das Wechsel-Kapitel, when Daten geladen, then nennt die Liste pro Wechsel Gebiet, Jahr und Von/Nach-Parteien und die Karte färbt nach Wechsel-Häufigkeit; `pnpm lint:wahl` besteht.
- Given Stimmbezirks-Default-Ansicht, when Besucher die Zeit-Leiste sieht, then gibt es keinen Play/Slider, sondern Hinweis + funktionierenden „Zur Kiez-Ebene"-Button.

## Implementation Notes

- **Wechsel-Jahr-Attribution geklärt:** `analytik.ts` (`mergeRepeatElections`) ersetzt bei einer Wiederholungswahl den Eltern-Eintrag vollständig durch den Wiederholungs-Eintrag, inkl. dessen `jahr`. Ein Wechsel zwischen zwei effektiven Positionen wird deshalb immer am Jahr der zuletzt gültigen (ggf. Wiederholungs-)Wahl gemeldet, nicht am Jahr des ursprünglichen Kalender-Wechsels. Für das I/O-Matrix-Beispiel „2016 SPD → 2021 GRÜNE → 2023(W) GRÜNE" bedeutet das: der eine Wechsel wird am Jahr 2023 gemeldet (nicht 2021), weil die Wiederholung die Position von 2021 übernimmt -- verifiziert 1:1 gegen `analytik.test.ts` (Zeile 42-50, identisches Fixture-Muster) und per Klammer-Test geklammert (`wechsel-client-parity.test.ts`). Zentral und unverändert bleibt die Kern-Garantie der Matrix-Zeile: **genau ein** Wechsel, die Wiederholung selbst erzeugt nie einen zusätzlichen.
- **Klammer-Test liegt in `src/lib/server/wahl/wechsel-client-parity.test.ts`, nicht neben `wechsel-data.ts`:** `src/lib/server/db/boundary.test.ts` verbietet jeden `$lib/server`-Import unter `src/lib/components/**`, auch in `.test.ts`-Dateien. Der Server-Test importiert stattdessen das Client-Modul (`$lib/components/wahl-portal/internal/wechsel-data.js`) -- die verbotene Richtung ist nur Client → Server.
- **Geteilter Winners-Cache nötig geworden:** `wechsel-kapitel.svelte` ist ein zweiter, unabhängig gemounteter Konsument derselben Bulk-Winners-Response (`ebene=kiez`). Ohne geteilten Cache hätte das die Bestands-AC „genau EIN Request je Kombination" verletzt (per E2E-Test aufgedeckt: 2 statt 1 Request). `KiezBezirkWinnersLoader` cached jetzt auf Modul-Ebene inkl. In-Flight-Dedupe (Muster `manifest.ts`/`layer-fetch.ts`), mit `_resetWinnersCache()` für Test-Isolation.
- **Frame-Coalescing (rAF+setTimeout, Finder-Muster) bewusst nicht in `setActiveJahr` ergänzt:** Jahr-Wechsel sind diskrete Schritte (Range-Input mit ganzzahligem Index, keine kontinuierliche Zahl wie bei den Finder-Gewichten) und bereits über `ZeitAnimationController` auf sinnvolle Kadenzen begrenzt (Play ~1,5 s, Drag-Commit gedrosselt). MapLibre puffert `setPaintProperty`-Aufrufe ohnehin bis zum nächsten eigenen Render-Tick. Ein sehr schneller Multi-Jahr-Drag kann dadurch mehrere `setActiveJahr`-Aufrufe pro Frame auslösen (funktional korrekt, letzter Aufruf gewinnt) -- falls das in der Praxis spürbar wird, ist eine nachträgliche rAF-Kapselung ein potenzieller Folge-Task.
- **Zweiter, unabhängiger `/api/wahl/winners?ebene=kiez`- und Geometrie-Request** des Wechsel-Kapitels gegenüber der Winner-Map: Winners sind jetzt gecacht/dedupliziert (siehe oben), die Kiez-Geometrie (`KiezBezirkGeometryLoader`, Manifest + `lor-bezirksregion`-Layer) nicht -- beide Chapter-Instanzen können bei exakt gleichzeitigem Mount je einen eigenen Manifest-/Layer-Request auslösen. Kein Test verlangt hier Request-Dedupe; potenzieller Folge-Task, falls relevant.
- **`prefer-writable-derived`/`no-unused-svelte-ignore` (ESLint):** `paintJahr` in `winner-map.svelte` ist kein reiner `jahr`-Spiegel (wird zwischen zwei `jahr`-Änderungen von der Zeit-Animation unabhängig geschrieben) -- gezielt per `eslint-disable-next-line` freigegeben. Die vorbestehende Diskrepanz zwischen `svelte-check` (0 Warnungen dank `svelte-ignore`) und `eslint-plugin-svelte`s `no-unused-svelte-ignore` (meldet dieselben Kommentare als "unused") existierte bereits vor dieser Story (10 Fälle auf `main`) und wurde durch neue, musterkonforme Loader-Instanzen (`winnersLoader`, `geometryLoader`) auf 20 Fälle in `winner-map.svelte` erweitert -- `pnpm check` bleibt bei 0 Fehlern/Warnungen, die genannte ESLint-Regel ist ein bekanntes, nicht-blockierendes Tooling-Detail.

## Spec Change Log

- **Matrix-Zeile „Wechsel-Liste" (frozen) vs. geshippte Server-Semantik:** Die Beispiel-Zeile nennt als Wechsel-Jahr 2021; `analytik.ts` (`mergeRepeatElections`, Matze-Entscheidung Option A: 2023 ersetzt 2021) meldet den Wechsel zwingend am Wiederholungs-Jahr 2023. Das Jahres-Label im frozen Beispiel war eine fehlerhafte Ableitung beim Spec-Schreiben; die Kern-Garantie der Zeile (genau EIN Wechsel, keine Verdopplung durch die Wiederholung) ist implementiert und getestet. Frozen-Block unangetastet; Klärung liegt Matze beim done-Checkpoint vor. KEEP: Client-Zwilling bleibt semantisch identisch zur Server-Regel (Klammer-Test `wechsel-client-parity.test.ts`).

## Review Triage Log

Drei Layer (Blind Hunter 13, Edge Case Hunter 20, Verification Gap 3+4). Dedupliziert nach Root Cause; Verdicts:

| # | Quelle | Fund | Verdict | Route |
|---|--------|------|---------|-------|
| 1 | VG-1, EC-1, EC-c2, BH-2-Teil | Nach kiez/bezirk→stimmbezirk bleiben `w_<jahr>_*`-Paint + Baked-Tooltip aktiv: Stimmbezirks-Karte neutral, Tooltip leer; kein Test beobachtet Paint | high | patch (`clearActiveJahr` + Test-Naht + Paint-Spy-Test) |
| 2 | VG-2 | Kein Test stellt sicher, dass ein Jahr-Schritt tatsächlich `setPaintProperty`/`setFilter` auslöst | medium | patch (Fake-Map-Naht, Muster kiez-finder-panel) |
| 3 | VG-3, BH-4-Teil | Reduced-Motion-Verdrahtung (echtes matchMedia) von keinem Test ausgeführt | medium | patch (E2E mit `reducedMotion: 'reduce'`) |
| 4 | EC-c1 | `togglePlay` steppt statt zu pausieren, wenn reducedMotion während laufender Wiedergabe true wird: Pause unmöglich | medium | patch (playing→pause zuerst) |
| 5 | BH-4 | Kein reaktives matchMedia-Muster (Boundary nennt pixel-logo explizit); Step-Modus-UI zeigt irreführend „Wiedergabe starten"/aria-pressed-Modell | medium | patch (Grenzfall zu bad_spec; kleinster Fix ist ein lokaler Listener + Label-Zweig, Re-Derivation unverhältnismäßig — Abwägung dokumentiert) |
| 6 | EC-5 | `flushPendingCommit` umgeht die Drossel: gehaltene Pfeiltaste = input+change je Key-Repeat, bis ~30 URL-Writes/s (Boundary ~3/s) | medium | patch (Flush respektiert Fenster, trailing Timer garantiert Endjahr) |
| 7 | BH-7, EC-6 | `destroy()` flusht `setJahr`→`goto` nach dem Teardown (Unmount/Navigation) | medium | patch (destroy cancelt statt flusht) |
| 8 | BH-6, EC-8, VG-O4 | Steuerleisten-Chip während Play: Karte folgt, Slider/Timer arbeiten vom alten Stand weiter (drei Jahre gleichzeitig sichtbar) | medium | patch (externe Änderung pausiert) |
| 9 | EC-2 | Reihen-Wechsel während Play: Tick mit `indexOf===-1` springt auf `jahre[0]` der neuen Reihe | medium | patch (Tick-Guard pausiert) |
| 10 | BH-5, EC-7 | Slider-Jahre aus Winners vs. `currentJahr` aus Wahl-Liste: Commit eines Nur-Winners-Jahres wird still verworfen, Effect reißt Karte zurück | medium | patch (zeitJahrOptions = Schnittmenge mit `jahreForReihe`) |
| 11 | EC-3, EC-4, BH-8 | `activeIndex===-1` → leerer aria-valuetext/Jahr-Anzeige; Play am letzten Jahr = toter Button | medium | patch (Fallbacks; Play startet am Ende von vorn) |
| 12 | BH-9, BH-10, EC-9, VG-O1 | Wechsel-Kapitel: Geometrie-Fehler stumm (leerer Kartenkasten), Takeaway „N von 0 Kiezen" vor Geometrie-Load, Singular-Grammatik falsch | medium | patch |
| 13 | EC-10 | `WechselMapController.destroy()` während schwebendem maplibre-Import: verwaiste Map-Instanz | low | patch (4-Zeilen-Flag, gleiche Datei ohnehin offen) |
| 14 | BH-2 | Wechsel-Outline ohne Tooltip-/Legenden-Erklärung; `winnerForJahrJs.wechsel` wird weggeworfen | medium | patch (Tooltip-Zeile + Legenden-Satz an der Zeit-Leiste; nicht-visuelle Liste existiert im Wechsel-Kapitel) |
| 15 | BH-3 | Wechsel-Karten-Farbstufen 1,54:1 (WCAG 1.4.11 braucht 3:1 zwischen Nachbar-Stufen); Legende zeigt pure Hex bei Karte-0,75 | medium | patch (Rampe neu rechnen, Legende in Karten-Optik). Pattern-Fallback-Teil rejected: sequenzielle Helligkeits-Rampe trägt ohne Muster |
| 16 | BH-13 | Disclosure-Button ohne `aria-expanded`/`aria-controls` | low | patch (trivial) |
| 17 | BH-12 | `buildZeitJahrOptions` ohne Unit-Test; Winners-Modul-Cache/In-Flight-Dedupe (trägt Ein-Request-AC) ungetestet; 2 falsch sitzende Kommentare | medium | patch |
| 18 | BH-1, EC-c5 | Frozen Matrix nennt Wechsel-Jahr 2021, Code (= Server-Semantik) meldet 2023; Change Log war leer | medium | Spec Change Log-Eintrag (oben); frozen bleibt, Matze-Vorlage beim done-Checkpoint. Dev-Agent-Record-Teil rejected: Implementation Notes in der Story-Datei sind die Repo-Konvention |
| 19 | BH-11, VG-O3, EC-14 | Wechsel-Kapitel mountet eager: zweite MapLibre-Instanz + doppelte Kiez-Geometrie-Downloads beim Seiten-Load (auch Stimmbezirks-Default) | medium | defer (Lazy-Mount per IntersectionObserver + `fetchLayer`-In-Flight-Dedupe = Bestandsmodul-Umbau; deferred-work.md) |
| 20 | EC-11 | `getFc()` null beim style-load-Event → Karte dauerhaft leer | false | Zustand nicht erreichbar: `geometry` wird nach Befüllung nie null; identisches Bestandsmuster im WinnerMapController |
| 21 | EC-12 | Unparsbarer `parent_slug` → Wiederholung belegt eigenen Slot | false | Slug-Format ist Server-Kontrakt (`slugOf`, stabil seit Story 2); Zwilling verhält sich bei parentJahr=null exakt wie der Server-Rechenkern |
| 22 | EC-13 | Gebiet ohne Wiederholungs-Row zeigt Outline bei 2021 (Boundary-Bruch) | false | In realen Daten flächendeckend Wiederholungs-Rows; WENN eine fehlte, wäre der letzte Stand des Gebiets 2021 und die 2021-Markierung datenehrlich korrekt, kein Defekt |
| 23 | EC-15 | Doppelte Testids `table-toggle`/`data-table` je Seite: künftige Strict-Mode-Fallen | low | rejected: aktuell gescoped und grün; generische Lösung = neue Komponenten-API-Fläche |
| 24 | EC-del1 | Modul-Winners-Cache friert Daten für die SPA-Session ein | low | rejected: Wahldaten ändern sich nur per Deploy (Build-Zeit-Aggregat); frischer Page-Load lädt neu |
| 25 | EC-c3 | Tie-Break-Task „alphabetisch" im Client nicht als Code sichtbar | false | Sieger-Tie-Break passiert im Server-SQL (Bestand Story 2/4); die Rows tragen bereits genau einen Sieger. Anzeige-Sortierung nutzt `localeCompare('de')` wie geboten |
| 26 | EC-c4 | „JS-Zwilling speist Tabelle/Takeaway" nicht wörtlich erfüllt; Klammer-Test prüft nur Keys | low | rejected: Task 5 erlaubte explizit „bzw. bestehendes winnersForJahr"; mit Patch 14 konsumiert der Tooltip den Zwilling real inkl. `wechsel`; Rampe ist über gemeinsame Konstanten (`ANTEIL_OPACITY_RAMP`) verklammert |
| 27 | VG-O2 | `wechsel-kapitel-canvas` beweist nicht, dass Source/Layer angelegt werden | low | rejected: Haus-Muster testet Karten-Controller nicht; Winner-Controller bekommt mit Patch 2 erstmals eine Naht |


## Design Notes

Von/Nach-Parteien kommen bewusst NICHT aus `/api/wahl/analytik` (dort fehlen sie; nur `wechsel_jahre`/`wechsel_count`): Die Bulk-Winners-Response derselben Reihe ist beim Karten-Load schon im Client und enthält alles. Der Client-Zwilling der Wiederholungs-Merge-Regel wird per Fixture-Test an die Server-Semantik (`analytik.ts`) geklammert. Jahres-Achse: Slider/Steuerleiste zeigen reale Jahre (2021 UND 2023), Wechsel rechnen auf der effektiven Reihe; darum ist bei aktivem 2021 nichts markiert.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße
- E2E: `pnpm exec vite build`, dann `pnpm preview --port 4173` (Background), temp Playwright-Config mit `testMatch: '**/*.e2e.{ts,js}'` + `baseURL http://localhost:4173`, `playwright test tests/e2e/berlin-wahlen.e2e.ts` -- expected: grün (webServer-Timeout 60 s reicht nicht für den vollen Build)
