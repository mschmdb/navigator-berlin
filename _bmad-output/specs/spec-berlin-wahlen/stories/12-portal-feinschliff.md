---
title: 'Portal-Feinschliff: Karten-Sitz, Sankey-Kapitel, Erklär-Subtexte'
type: 'feature'
created: '2026-09-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '29e5698'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem (Matze 20.09. 15:41):** Drei Bedien-Lücken im Portal. (1) In den Kapiteln Wechsel und Trends sitzt die Karte nicht ordentlich im Canvas und lässt sich zu weit verschieben: Berlin kann fast aus dem Sichtfenster gepannt werden. (2) Der Sankey „Wahljahre im Übergang" fehlt im Kapitel-Menü, er versteckt sich als Unterabschnitt im Trends-Kapitel. (3) Die Kapitel starten ohne Erklärung: Überschrift, dann direkt Grafik; ein kurzer Erklär-Subtext fehlt überall.

**Approach:** (1) Wechsel- und Trends-Karte nach dem initialen `fitBounds` auf die Layer-Bbox festzurren: `maxBounds` = gepufferte Fit-Bbox, `minZoom` = Fit-Zoom, damit die Stadt nie den Canvas verlässt und der Erst-Eindruck sauber gerahmt ist. (2) Der Sankey wird ein eigenes Kapitel „Übergänge" (eigene `KapitelSection` + Nav-Eintrag zwischen Trends und Extreme, eigenes Kontext-Badge wie das Trends-Badge ohne Ebenen-Angabe). (3) Jedes Kapitel bekommt 1-2 Sätze neutralen Erklär-Subtext direkt unter der Überschrift.

## Boundaries & Constraints

**Always:**
- Karten-Sitz: Änderung NUR in `internal/wechsel-kapitel-maplibre.svelte.ts` und `internal/trends-kapitel-maplibre.svelte.ts`. Nach dem bestehenden `fitBounds(fitTo, ...)`: `maxBounds` auf die Fit-Bbox plus kleinem Puffer (~10-15% je Achse) setzen und `minZoom` auf den nach dem Fit erreichten Zoom (`getZoom()`), damit weder Weg-Pannen noch Heraus-Zoomen die Stadt aus dem Canvas schiebt. Gemeinsame pure Helper-Funktion (z. B. `internal/map-fit-constraints.ts`: `paddedMaxBounds(bbox)`) statt Copy-Paste in beide Controller; unit-testbar (reine Bbox-Arithmetik). Das Interface `MapLibreMapLike` beider Controller darf um `setMaxBounds`/`setMinZoom`/`getZoom` wachsen; die Fake-Map-Test-Utility zieht mit.
- `winner-map-maplibre.svelte.ts` bleibt UNANGETASTET (Adress-Suche/flyTo brauchen den größeren Spielraum; Matze hat nur Wechsel/Trends genannt).
- Sankey-Kapitel: neues Kapitel `{ id: 'uebergaenge', label: 'Übergänge' }` zwischen Trends und Extreme in `+page.svelte` (NAV_CHAPTERS + `KapitelSection` mit Titel „Wahljahre im Übergang", Testid `wahl-portal-chapter-uebergaenge`); `<SankeyWahljahre/>` zieht aus `trends-kapitel.svelte` (Einbettungs-Block Z. ~376 entfernen, Import raus) in die neue Section; `showCoverageHinweis` entfällt als Sonderfall (Sankey rendert eigenständig, Default `true` greift; prüfe, ob das Trends-Kapitel seine eigene Coverage-Fußnote behält, keine Doppel-Anzeige innerhalb EINES Kapitels). Kontext-Badge fürs neue Kapitel wie das Trends-Badge (Reihe · „alle Wahljahre", OHNE Ebenen-Angabe, der Sankey hat den eigenen Toggle).
- Die `sankey-wahljahre-context-probe` und alle `sankey-*`-Testids bleiben unverändert; E2E-/a11y-Stellen, die den Sankey über `wahl-portal-chapter-trends` scopen (Hover-Smoke, Axe-Scan, Trends-Fixture-Test), ziehen auf das neue Kapitel-Testid um. `trends-kapitel.svelte.test.ts`-Assertions auf Sankey-Testids entfallen dort bzw. wandern in einen Section-Test.
- Erklär-Subtexte: `kapitel-section.svelte` bekommt ein optionales `subtext`-Prop (string; rendert als `<p>` zwischen Überschrift und Inhalt, Testid `${testid}-subtext`, ruhige Typo analog Kontext-Badge/Prosa-Stil). Jedes Kapitel inkl. Karte, Wechsel, Trends, Übergänge, Extreme und Methodik bekommt 1-2 Sätze; auch der Überblick-Header darf einen bekommen, wenn er nicht redundant zur bestehenden `pageDescription` ist. Inhalte: was zeigt das Kapitel, wie liest man es; neutral, `lint:wahl`-konform (keine „Hochburg"/„Wählerwanderung"), keine Absolutismen, kein Prozess-Sprech, keine em-dashes.
- Planungs-Hygiene (Teil dieser Story, kein Code): `stories.yaml` Story 10 („Dein Kiez, Zwilling und Wahl-x-Layer") als gestrichen markieren (`status`-/Kommentar-Konvention der Datei folgen, nicht löschen); Kontraste bleibt nur in `deferred-work.md`.

**Never:**
- Kein Umbau der Karten-Interaktion selbst (Hover, Klick, Animation), keine Controller-Konsolidierung (bleibt deferred), kein Anfassen von `winner-map`-Dateien.
- Keine neuen Datenpfade/APIs; Subtexte sind statische Strings in `+page.svelte`.
- URL-Kontrakt, Reihen-Leiste, Karten-Steuerung, Badges (Story 10) unverändert; Sankey-Verhalten (Story 11) unverändert, nur der Einbau-Ort wechselt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Karten-Rahmen | Wechsel-/Trends-Karte initial geladen | Berlin füllt den Canvas (Fit-Bbox + Padding), kein Verschnitt | N/A |
| Pan-Grenze | Nutzer pannt/zoomt in Wechsel/Trends | Stadt bleibt im Sichtfenster (maxBounds = gepufferte Fit-Bbox, minZoom = Fit-Zoom) | N/A |
| Ebenen-/Reihen-Wechsel | Layer-Bbox ändert sich (falls neuer fitBounds-Lauf) | Grenzen ziehen mit dem neuen Fit nach | N/A |
| Nav-Eintrag | Klick auf „Übergänge" im Kapitel-Menü | Scrollt zum Sankey-Kapitel, Scroll-Spy markiert es | N/A |
| Deep-Link | `#uebergaenge`-Anker | Landet unter dem Sticky-Stapel korrekt (scroll-mt der Section greift) | N/A |
| Subtexte | Jedes Kapitel | 1-2 Sätze unter der Überschrift, vor dem Inhalt; auch in Lade-/Leer-Zuständen sichtbar | N/A |
| Bestands-E2E | Trends-Kapitel ohne Sankey | Trends-Tests (Karte/Volatilität) grün; Sankey-Tests laufen im neuen Kapitel | N/A |

</frozen-after-approval>

## Code Map

- `internal/wechsel-kapitel-maplibre.svelte.ts` (Z. 95-97 Init, Z. 130 fitBounds) + `internal/trends-kapitel-maplibre.svelte.ts` (Z. 142-144, Z. 180) -- nach `fitBounds`: `setMaxBounds(paddedMaxBounds(fitTo))` + `setMinZoom(getZoom())`; `MapLibreMapLike` + `fake-maplibre-test-util.ts` erweitern.
- NEU `internal/map-fit-constraints.ts` + Test -- reine Bbox-Puffer-Arithmetik.
- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- NAV_CHAPTERS (Z. ~155-190), neue Section `uebergaenge` mit Badge, Subtext-Strings aller Kapitel.
- `src/lib/components/wahl-portal/kapitel-section.svelte` (32 Z.) + Test -- optionales `subtext`-Prop.
- `src/lib/components/wahl-portal/trends-kapitel.svelte` (Z. 48 Import, Z. ~376 Einbettung) + `trends-kapitel.svelte.test.ts` -- Sankey-Auszug.
- `tests/e2e/berlin-wahlen.e2e.ts` (Sankey-Hover-Smoke, Trends-Fixture-Test) + `tests/e2e/a11y.e2e.ts` (Sankey-Axe-Scan) -- Kapitel-Scope umziehen; neuer kurzer Test: Nav-Eintrag „Übergänge" scrollt zum Kapitel.
- `docs/wahldaten-methodik.md` -- nur falls Kapitel-Struktur dort erwähnt ist (prüfen, sonst unberührt).
- `_bmad-output/specs/spec-berlin-wahlen/stories.yaml` -- Story 10 als gestrichen markieren.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [x] `internal/map-fit-constraints.ts` + Test -- Puffer-Arithmetik; Controller-Tests: nach Fit werden `setMaxBounds`/`setMinZoom` mit den erwarteten Werten gerufen (Fake-Map).
- [x] Wechsel-/Trends-Controller -- Constraints nach `fitBounds` setzen.
- [x] `kapitel-section.svelte` + Test -- `subtext`-Prop.
- [x] `+page.svelte` -- neues Kapitel „Übergänge" (Nav + Section + Badge + Sankey-Einbau), Subtexte aller Kapitel; `trends-kapitel.svelte` verliert die Einbettung.
- [x] Tests/E2E -- Kapitel-Scopes umziehen, neuer Nav-Test „Übergänge", `lint:wahl` für die Subtexte.
- [x] `stories.yaml` -- Story 10 gestrichen markieren.

**Acceptance Criteria:**
- Given die Wechsel- oder Trends-Karte, when der Nutzer maximal pannt oder herauszoomt, then bleibt Berlin vollständig oder nahezu vollständig im Canvas; der initiale Rahmen zeigt die Stadt ohne Verschnitt.
- Given das Kapitel-Menü, then existiert der Eintrag „Übergänge", Klick und `#uebergaenge`-Anker landen auf dem Sankey-Kapitel unter dem Sticky-Stapel; das Trends-Kapitel enthält keinen Sankey mehr.
- Given ein beliebiges Kapitel, then steht unter der Überschrift ein 1-2-sätziger, `lint:wahl`-konformer Erklär-Subtext.
- Given die Bestands-Suiten, then bleiben Unit, check, lint:wahl und das E2E-Trio grün (bis auf die 2 bekannten vorbestehenden a11y-Fails).

## Implementation Notes

**Karten-Anschlag-Grenzen (Task 1+2):** Neue reine Helper-Funktion `internal/map-fit-constraints.ts` (`paddedMaxBounds`, `FitBounds`-Typ) puffert die Fit-Bbox um 12% je Achse (innerhalb des vorgegebenen 10-15%-Korridors), mit Mindest-Puffer 0,01 Grad gegen eine degenerierte (punktförmige) Bbox. `wechsel-kapitel-maplibre.svelte.ts` und `trends-kapitel-maplibre.svelte.ts` rufen nach `fitBounds` neu `setMaxBounds(paddedMaxBounds(fitTo))` und `setMinZoom(getZoom())`; `MapLibreMapLike` wuchs in beiden um `setMaxBounds`/`setMinZoom`/`getZoom`. `WechselMapController` bekam zusätzlich eine `mapFactory`-DI-Option (Muster bereits im Trends-Controller vorhanden) -- ohne diese Testnaht ließ sich die neue Controller-Logik nicht ohne echtes `maplibre-gl` testen; Verhalten in Produktion unverändert (Default bleibt der echte `import('maplibre-gl')`). `fake-maplibre-test-util.ts` wuchs um `setMaxBoundsCalls`/`setMinZoomCalls`/`getZoom()` (fixer Rückgabewert `FAKE_ZOOM_AFTER_FIT = 11.4`).
TDD-Nachweis: `map-fit-constraints.test.ts` (4 Tests) erst gegen ein fehlendes Modul rot, dann grün nach Implementation. `wechsel-kapitel-maplibre.svelte.test.ts` (neu, 3 Tests) und die neuen Tests in `trends-kapitel-maplibre.svelte.test.ts` erst rot (`setMaxBoundsCalls`/`setMinZoomCalls` leer bzw. TS-Fehler auf `mapFactory`), dann grün.

**Kapitel-Subtext (Task 3):** `kapitel-section.svelte` bekam ein optionales `subtext`-Prop (string), gerendert als `<p data-testid="${testid}-subtext">` zwischen Überschrift und `takeaway`/Inhalt. TDD-Nachweis: zwei neue Fälle in `kapitel-section.svelte.test.ts` (ohne Prop kein Block; mit Prop `<p>` mit Text) erst rot (Prop existierte nicht), dann grün.

**Übergänge-Kapitel + Subtexte (Task 4):** `+page.svelte` bekam ein neues Kapitel `{ id: 'uebergaenge', label: 'Übergänge' }` zwischen Trends und dem Kontraste-Platzhalter (NAV_CHAPTERS + eigene `KapitelSection`, Testid `wahl-portal-chapter-uebergaenge`, Titel „Wahljahre im Übergang", Kontext-Badge wie Trends ohne `ebeneText`). `<SankeyWahljahre />` rendert dort jetzt ohne `showCoverageHinweis`-Override (Default `true`) -- eigenständige Coverage-Fußnote im neuen Kapitel, Trends behält seine eigene (`trends-kapitel-coverage-hinweis`), keine Dopplung innerhalb eines Kapitels. `trends-kapitel.svelte` verlor Import und Einbettungs-Block des Sankeys; `fetchFn`-Prop bleibt (weiterhin für Analytik/Geometrie gebraucht). Alle sechs verlangten Kapitel (Karte, Wechsel, Trends, Übergänge, Extreme, Methodik) bekamen einen Subtext; der Überblick-Header bewusst NICHT, weil `pageDescription` denselben Zweck (Scope-Erklärung) bereits abdeckt -- ein zusätzlicher Subtext dort wäre redundant gewesen.

**Test-/E2E-Migration (Task 5):** `trends-kapitel.svelte.test.ts` verlor den Test „Sankey rendert eigenständig, auch wenn die Analytik leer bleibt" (Redundant: `sankey-wahljahre.svelte.test.ts` deckt das Standalone-Verhalten inkl. Default-`showCoverageHinweis` bereits ab) und die Sankey-Assertion am Ende des I/O-Matrix-Tests. In `tests/e2e/berlin-wahlen.e2e.ts`: der Trends-Fixture-Test wurde geteilt in „Trends-Kapitel: rendert Karte aus Fixtures..." (Karte/Takeaway/Toggle, ohne Sankey) und einen neuen „Übergänge-Kapitel: rendert den Sankey aus Fixtures, eigener Nav-Eintrag" (Sankey-SVG/Tabelle, scoped auf `wahl-portal-chapter-uebergaenge`); der Sankey-Hover-Test navigiert jetzt über `kapitel-nav-link-uebergaenge`; ein neuer, kurzer Test prüft den Nav-Eintrag „Übergänge" (Klick, `aria-current`, Anker landet unter der Sticky-Nav, Muster Review Triage Log #5). In `tests/e2e/a11y.e2e.ts` zog der Sankey-Axe-Scan auf das Übergänge-Kapitel um (Testtitel entsprechend umbenannt).

**Planungs-Hygiene:** `stories.yaml` Story 10 („Dein Kiez, Zwilling und Wahl-x-Layer") bekam `status: dropped` plus Datums-/Grund-Kommentar (Matze 20.09.), nicht gelöscht.

**Finale Subtext-Formulierungen:**
- Karte: „Die Färbung zeigt die stärkste Kraft je Gebiet, die Deckkraft ihren Stimmenanteil. Jahr und Ebene gelten nur für dieses Kapitel."
- Wechsel: „Die Karte zählt, wie oft ein Gebiet seit 2011 die stärkste Kraft wechselte. Die Liste darunter nennt jeden Wechsel mit Jahr, alter und neuer Partei."
- Trends: „Die Karte zeigt Richtung und Stärke der Stimmenanteil-Entwicklung je Partei, wahlweise die Volatilität aller Parteien zusammen. Toggle und Partei-Chips wechseln nur die Einfärbung, kein neuer Datenabruf."
- Übergänge: „Jede Spalte steht für ein Wahljahr, jedes Band für Gebiete, die von einer Partei zur nächsten wechselten. Hover oder Fokus auf Band oder Knoten zeigt die genauen Zahlen."
- Extreme: „Die Karten zeigen je Partei das Gebiet mit dem höchsten und dem niedrigsten Stimmenanteil im gewählten Jahr."
- Methodik: „Hier stehen Quellen, Lizenzen und Datenstand aller Wahl-Datensätze, dazu Erläuterungen zu Aggregation und Wiederholungswahlen."

**Verifikations-Zahlen:**
- `pnpm vitest run --project server`: 303 Testdateien, 2852 Tests, grün.
- `pnpm vitest run --project client`: 123 Testdateien, 1014 Tests, grün.
- `pnpm check`: 0 Errors, 0 Warnings.
- `pnpm lint:wahl`: 65 Dateien gescannt, 0 Verstöße.
- `pnpm exec eslint <geänderte Dateien>`: 0 Fehler (8 vorbestehende `svelte/no-unused-svelte-ignore`-Treffer in `trends-kapitel.svelte`, Zeilen unverändert gegenüber Baseline `29e5698`, ausgenommen).
- `pnpm exec vite build`: erfolgreich.
- E2E-Trio (`berlin-wahlen.e2e.ts` + `berlin-wahlen-partei.e2e.ts` + `a11y.e2e.ts`): 27 von 29 grün; die 2 Fails sind die bekannten vorbestehenden (`/_dev/wortmarke` document-title, Escape-Timeout auf der Explore-Karte); der Root-Axe-Scan flackerte einmal unter Parallel-Last und war solo grün (wie in der Spec vorgesehen).

**Ergebnis (2026-09-20, nach Review-Runde 1):**
- Kern-Fund der Review: die erste Fassung der Karten-Grenzen BESCHNITT Berlin (maxBounds auf die Daten-Bbox zwang MapLibre zum Rein-Zoomen, minZoom fror das ein; Browser-bestätigt, 63% sichtbar). Gepatcht: Grenzen aus den sichtbaren Bounds nach dem Fit, Fit-Zoom vor dem Grenzen-Setzen erfasst, Konstruktions-minZoom 8. Koordinator-Screenshot-Verifikation nach der Patch-Runde: beide Karten zeigen Berlin vollstaendig.
- Platzhalter-Kapitel Kontraste/Dein Kiez/Atlas aus Nav und Seite entfernt (Matze 15:41); pageDescription + llms-Beschreibung vom Koordinator auf die realen Kapitel umgestellt.
- Verifikation final: 2854 Server- + 1019 Client-Tests gruen, check 0, lint:wahl 0, E2E 28/30 (2 bekannte vorbestehende a11y-Fails).

## Spec Change Log

## Review Triage Log

Runde 1 (2026-09-20). Layer: Blind Hunter (N=8), Edge Case Hunter (19 Funde), Verification Gap (3 Gaps + 5 Nebenfunde). Koordinator-Verifikation im echten Browser (dev 5177, 1440px): Berlin ist in der Wechsel-Karte oben/unten BESCHNITTEN -- der Kern-Fund ist bestätigt, der Ist-Stand schlechter als vor der Story.

| # | Fund | Quelle(n) | Verdict | Route |
|---|------|-----------|---------|-------|
| 1 | `setMaxBounds(paddedMaxBounds(fitTo))` auf die schmale DATEN-Bbox zwingt MapLibre auf breiten Canvases zum Rein-Zoomen (constrainInternal: shouldZoomIn), `setMinZoom(getZoom())` liest den bereits verbogenen Zoom NACH setMaxBounds und friert den Beschnitt ein; Konstruktions-minZoom 9 klemmt zusätzlich den echten Fit-Zoom 8.70; Browser-bestätigt (63% sichtbar bei 864px) | BH#1/#2 (strong, MapLibre-Quelltext-Beleg), ECH#4/#5/#19, VG-Neben, Koordinator-Screenshot | high | patch: Grenzen aus den SICHTBAREN Bounds nach dem Fit (`getBounds()` + kleiner Puffer) statt der Daten-Bbox; Reihenfolge resize→fitBounds→fitZoom erfassen→setMaxBounds→setMinZoom(fitZoom); Konstruktions-minZoom senken |
| 2 | Leere FeatureCollection: turf-bbox liefert Infinity, Grenzen/Fit laufen trotzdem; `setMinZoom` wirft bei NaN im load-Handler (ready bleibt false) | ECH#1/#2/#3, BH#4 | high | patch: Empty-Guard vor Fit/Grenzen, Finite-Guards in Helper und Controllern |
| 3 | Factory-/Import-Reject im Wechsel-Controller: `#initializing` bleibt true, kein Fehlerzustand, unhandled rejection | ECH#8 | medium | patch: try/catch im Init-Pfad |
| 4 | Wechsel-Controller ohne Remount-Guard (Trends hat ihn): Reihen-Wechsel unmountet den Canvas (Loading-Zweig), Map hängt am toten Div, Grenzen bleiben vom ersten Fit | BH#8 (vorbestehend, durch die Story folgenreicher) | medium | patch: Trends-Muster portieren (#mountedContainer + destroy/Neustart) + Test |
| 5 | Subtexte fachlich falsch: Karte gilt nur im Gewinner-Tab (Partei-Tabs färben anders), Wechsel „seit 2011" stimmt für BTW (ab 2013) nicht + „jeden Wechsel" vs. Disclosure-20, Übergänge „wechselten" ist falsch (Bänder bündeln auch Partei→dieselbe-Partei), Methodik verspricht Datenstand/Erläuterungen, die die Section nicht zeigt | BH#5/#6/#7, ECH#10/#11 | high | patch: vier Formulierungen mode-/reihen-neutral korrigieren, Methodik gegen PortalQuellen-Ist prüfen |
| 6 | Platzhalter-Kapitel „Kontraste"/„Dein Kiez"/„Atlas" stehen weiter in Nav+Sections, obwohl Matze 15:41 die Stories strich; zudem ohne Subtext (AC-Widerspruch „jedes Kapitel") | ECH#12/#17, Koordinator | high | patch: alle drei Platzhalter aus Nav und Seite entfernen (kommen mit ihren Stories zurück); E2E-/Test-Referenzen prüfen |
| 7 | `status: dropped` in stories.yaml verstößt gegen das Schema („No status field, ever"); Konsument liest den Status ohnehin aus den Story-Frontmattern | VG-Neben, ECH#13, BH#3 | medium | patch: Feld entfernen, Kommentar trägt die Streichung |
| 8 | Fake-Map sieht `fitBounds` nicht (No-op ohne Aufzeichnung, getZoom konstant): Wiring-Tests beweisen Reihenfolge/Argumente nicht; Default-Factory-Pfad (defaultMapFactory) läuft in keinem Test; kein Test prüft MapLibre-erzeugtes DOM | VG#1/#2 | medium | patch: Fake um fitBoundsCalls/getBounds erweitern, Reihenfolge-Assertions; E2E: `canvas.maplibregl-canvas` sichtbar in Wechsel- UND Trends-Kapitel |
| 9 | Kein Test prüft die sechs Subtexte auf der Seite | VG#3 | medium | patch: E2E-Assertions (Sichtbarkeit aller 6 + 1 Textprobe) |
| 10 | Neue E2E-Tests (Nav „Übergänge", Übergänge-Kapitel) stubben `/api/wahl/analytik` nicht: Trends lädt real, Flake-/Layout-Shift-Risiko | ECH#14, BH-Reste | low | patch: Analytik-Stub ergänzen |
| 11 | Trends-Badge nennt keine Ebene mehr, der Grund (Sankey-Toggle im Kapitel) ist mit dem Umzug entfallen; Trends ist reine Kiez-Ebene | ECH#15, BH-Reste | low | patch: `ebeneText` am Trends-Badge wieder setzen, E2E-Assertions anpassen; stale Kommentare (+page-Badge-Begründung, showCoverageHinweis-Doc) bereinigen |
| 12 | Re-Fit beim setData-Pfad fehlt (Grenzen des alten Fits) | ECH#6 | maybe-false | reject: beide Kapitel sind Kiez-fixiert, die Bbox ist konstant; der Remount-Guard (#4) erzwingt bei echtem Remount ohnehin einen neuen Fit |
| 13 | Grenzen um BERLIN_MAX_BOUNDS klippen (Geometrie-Ausreißer) | ECH#7 | low | defer: LOR-Geometrie liegt vollständig in Berlin, kein realer Datenfall |
| 14 | Subtext bleibt in Lade-/Leer-Zuständen sichtbar | ECH#9 | false | reject: bewusst statisch (beschreibt das Kapitel, nicht den Datenstand) |
| 15 | 12%-Puffer erlaubt weiterhin Rand-Verschiebung | ECH#18 | false | reject: der Puffer IST der gewollte Pan-Spielraum |
| 16 | Kein Resize-/Rotations-Handler: Grenzen passen nach Fenster-Änderung nicht mehr | VG-Neben, BH#4-Teil | low | defer: vorbestehend (kein Resize-Handler in keinem Kapitel-Controller), deferred-work |
| 17 | Kamera-Verhalten (Pan/Zoom hält Berlin im Canvas) nicht automatisiert prüfbar (kein Map-Handle im E2E) | VG#1-Teil | low | defer: Koordinator-Browser-Check nach der Patch-Runde ersetzt die Assertion manuell; Hook-Idee in deferred-work |
| 18 | stories.yaml-IDs laufen seit Story 10 gegen die Story-Datei-Nummern (yaml-10 = Dein Kiez, Datei-10 = Steuerung) | BH#3-Teil | low | defer: Prozess-Notiz in deferred-work; betrifft nur bmad-Tooling, kein Produkt-Code |
| 19 | lint:wahl liegt außerhalb des `pnpm test`-Pfads | VG-Neben | low | defer: Konvention „manuell je Story-Verifikation" bleibt; deferred-work |

## Design Notes

Die Karten-Constraints koppeln bewusst an die Fit-Bbox statt an eine feste Berlin-Box: dieselbe generische `BERLIN_MAX_BOUNDS`-Box erlaubt heute ~40% Leerlauf um die Stadt, was sich in den kleinen Kapitel-Canvases als „Karte verrutscht" anfühlt. Die Winner-Map behält den größeren Spielraum wegen Adress-Suche/flyTo. „Übergänge" als eigenes Kapitel entlastet zugleich das überladene Trends-Kapitel (Karte + Volatilität + Sankey).

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- E2E: `pnpm exec vite build`, Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün bis auf die 2 bekannten vorbestehenden Fails
