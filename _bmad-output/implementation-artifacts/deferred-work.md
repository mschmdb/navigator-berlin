- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: API-Routen-Tests für /api/wahl/geometry und /api/wahl/results-at-point fehlen (ADR-012 nennt Server-Endpoints als Test-first-Scope).
  evidence: Lücke bestand schon vor Story 1 (nur kiez-shares hat einen Routen-Test); Story 2 des berlin-wahlen-Epics baut neue Wahl-APIs test-first und ist der natürliche Ort, die Bestandsrouten mitzuziehen.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: Komponenten-Test für wahl-stimmbezirk-choropleth.svelte fehlt (Winner-Zuordnung, matched-Zähler); außerdem 2 pre-existing ESLint-Errors (SvelteMap, unused matched).
  evidence: Beides bestand vor Story 1; Story 4 (Winner-Map) baut die Komponente neu und deckt es dann ab.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/2-daten-fundament-zeitreihen-und-bulk-winners.md`
  summary: Drei verbliebene sourceName-Duplikate auf den geteilten Helper src/lib/server/wahl/source-label.ts umziehen (webmcp/tools/wahl/get-election-result.ts, server/llms/data-collector.ts, utils/llm-export-builder.ts).
  evidence: Verification-Gap-Layer: byte-identische Ternaries, Tests pinnen nur den Output, Drift bei künftiger Regel-Änderung bliebe unbemerkt. Passt zu Story 9 (WebMCP-Tools).
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/2-daten-fundament-zeitreihen-und-bulk-winners.md`
  summary: Test-Strategie für DB-abhängige Tests schärfen: defensive if-empty-return-Tests no-open ohne geseedetes Postgres; Build-Script-Verdrahtung (build-wahl-analytik) ungetestet.
  evidence: Haus-Muster seit wahl-queries.test.ts; CI ohne befüllte DB meldet grüne Tests, die nichts prüfen. Entscheidung über Seed-Fixtures oder Testcontainer gehört zu einer eigenen Infra-Story.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/3-portal-skeleton-berlin-wahlen.md`
  summary: Coverage-Nachzügler Portal-Skeleton: Scroll-Spy-Berechnung (computeActive) ohne direkten Unit-Test, noindex-Flag-Wiring ohne Head-Check-Test, lint-wahl-editorial collectScanFiles-Rekursion ungetestet.
  evidence: Review-Layer Story 3; Klick-Pfad ist per Component- und E2E-Test gedeckt, der Rest braucht ein Head-Check-/Script-Test-Muster, das im Repo noch nicht existiert.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories.yaml`
  summary: Wahlkreis-Ebene für die Winner-Map (AGH-/BTW-Wahlkreise als Darstellungs-Einheit; Wahlkreis-Codes liegen in stimmbezirk.wahlkreis, Geometrien fehlen komplett).
  evidence: Matze-Direktive 19.09. (amtliche Einheiten); braucht neue AfS-Geometrie-Quelle + Wahlkreis-Aggregation, sinnvoll gebündelt mit dem 2026-Ingest (Story 15), wenn ohnehin AfS-Geodaten gezogen werden.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/4-winner-map-mit-ebenen-und-adress-suche.md`
  summary: Winner-Map-Coverage-Nachzügler: Hover-Pipeline (echtes mousemove→tooltipData-Mapping) und ein Tastatur-/Touch-Pfad auf die Pro-Gebiet-Info der Karte selbst; dazu die UX-Frage, ob der Achromatopsie-Muster-Toggle in die URL gehört.
  evidence: Review-Layer Story 4; Tabelle ist der A11y-Pfad laut Haus-Muster, echte MapLibre-Hit-Tests brauchen ein neues E2E-Muster.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/7-zeit-animation-mit-wechsel-markierung.md`
  summary: Wechsel-Kapitel lazy mounten (IntersectionObserver) und Kiez-Geometrie-Requests deduplizieren (fetchLayer-In-Flight-Map), damit der Seiten-Load nicht eager eine zweite MapLibre-Instanz plus doppelte Layer-Downloads startet.
  evidence: Review Story 7 (Blind Hunter 11, Verification Gap Other 3, Edge Case Hunter 14): wechsel-kapitel.svelte laedt Winners, Manifest, bezirke- und lor-bezirksregion-Layer beim Seiten-Load, auch in der Stimmbezirks-Default-Ansicht; Winners sind seit Story 7 dedupliziert, die Geometrie nicht (fetchLayer ist Bestandsmodul).
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Kontraste-Kapitel (CAP-6) als eigene Folge-Story bauen: Ausgeglichenheits-Karte (Marge Platz 1/2), schaerfste Nachbar-Grenzen, AGH-vs-BVV-Vergleich und Erst-/Zweitstimmen-Splitting.
  evidence: Split-Entscheidung Matze 20.09. (Story-8-Checkpoint): drei neue Daten-Fundamente noetig, die es nicht gibt: /api/wahl/winners um runner_up/margin_pp erweitern; Build-Zeit-Adjazenz aus lor-bezirksregion/bezirke-GeoJSONs (kein Nachbarschafts-Datensatz im Repo, kein turf-boolean-touches); Anteile-Bulk fuer Splitting-Differenzen (kiez-shares ist bzrId-gekeyt und nur eine Wahl). Sieger-Splitting (Erst- vs. Zweitstimmen-Sieger) waere sofort aus Winners-Bulk machbar; Portal-Stimmtyp kennt erststimme nicht, kapitel-lokal halten.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Portal-Kapitel lazy mounten und Kiez-Geometrie-Loads seitenweit deduplizieren; das Trends-Kapitel startet als dritter eager Konsument eine weitere MapLibre-Instanz plus eigene Manifest-/lor-bezirksregion-Downloads (Geometrie-Cache ist instanz-lokal).
  evidence: Review Story 8 (Blind Hunter 12, Verification Gap Other 6, Edge Case Hunter 17); verschaerft den bestehenden Story-7-Defer (fetchLayer-In-Flight-Map + IntersectionObserver-Lazy-Mount).
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Die drei fast identischen MapLibre-Kapitel-Controller (winner-map-, wechsel-kapitel-, trends-kapitel-maplibre) auf eine gemeinsame Basis konsolidieren (BERLIN_MAX_BOUNDS, mapFactory, fitBounds, Init-/Destroy-Lifecycle inkl. Container-Remount-Guard).
  evidence: Review Story 8 (Blind Hunter 13); Copy-Paste vervielfaeltigt auch Lifecycle-Luecken: der Container-Remount-Guard aus Story 8 fehlt im Wechsel-Kapitel-Controller weiterhin (Boundary verbot dort den Umbau).
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Sankey komplett ueberarbeiten (Matze-Direktive 20.09., eigene Story): Wahl-Reihe und Ebene am Sankey auswaehlbar; erste Spalte = Gebiets-Knoten der Ebene (eingefaerbt nach Gewinner der juengsten bzw. ersten Wahl), ab Spalte 2 je Wahl der Reihe die Parteien untereinander; Umsetzung mit d3-sankey (lazy geladen) inkl. Tooltips und Mouseover-Highlight einzelner Fluesse.
  evidence: Matze 20.09. 08:01, woertlich sinngemaess "unfassbar schlecht in der jetzigen fassung"; die Story-8-Fassung (gebuendelte Partei-Uebergaenge, statisches Eigenbau-SVG ohne Interaktion) verfehlt die gewuenschte Lesart. d3-sankey ist ~10 kB, d3-scale/d3-array sind bereits Dependencies, Lazy-Load-Muster existiert (home-featured-score.svelte). Achtung Kiez-Ebene: 143 Gebiets-Knoten in Spalte 1, Layout muss dichte Knoten vertragen (duenne Baender, Hover-Highlight traegt die Lesbarkeit).
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/9-partei-tabs-und-small-multiples.md`
  summary: Achromatopsie-Muster-Vokabular erweitern, Bestands-Doppelbelegungen CDU/AfD ('stripes') und GRÜNE/BSW ('dots') auflösen (4 Muster für 7+ Parteien; Story 9 hat 'diagonal-reverse' eingeführt und Die Linke/FDP getrennt).
  evidence: Review Story 9 (Blind Hunter 11, Edge Case Hunter 10, Verification Gap Other 2, Koordinator): mit nur 4 Pattern-Typen (solid/stripes/dots/diagonal[-reverse]) für 7 FINDER_PARTIES bleiben zwei Doppel bestehen; Fix-Scope dieser Runde war auf die EXAKTE Kollision (Die Linke/FDP, beide 'diagonal') begrenzt.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/9-partei-tabs-und-small-multiples.md`
  summary: Nach Freeze-Ende (22.09. 02:00) auf Prod einmalig die vier BVV-Wahlen neu ingesten (pnpm data:wahl-fetch -- --only=bvv11 / bvv16 / bvv21 / bvv23) plus data:wahl-kiez und data:wahl-analytik, damit die reparierten Stimmbezirks-Anteile (vorher ueberall 0) auch in Prod landen.
  evidence: BVV-Anteil-Bug 20.09. (transformSbbRow gueltig-Slot); der prebuild fetcht nur, wenn data:wahl-check KEINE Daten findet, ein normaler Deploy repariert die Prod-Rows daher nicht.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/10-steuerungs-klarheit.md`
  summary: Steuerungs-Haertung als Sammel-Refactor; Kontext-Badge-Testid instanz-suffixen (dreifach identisch auf der Seite, Strict-Mode-Falle), Label-ids der Radiogroups per $props.id() instanzbinden (brechen bei zweitem Mount), Sticky-Offsets (h-10 / +2.5rem / 2x +5.5rem / winner-map-Panel) auf eine gemeinsame CSS-Custom-Property ziehen.
  evidence: Review Story 10 (Triage #8/#9/#10); heute kollisionsfrei (Grep-verifiziert, E2E scoped ueber Kapitel-Testids), reine Vorsorge ohne Verhaltens-Aenderung.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/10-steuerungs-klarheit.md`
  summary: a11y-E2E-Suite reparieren; /_dev/wortmarke fehlt das <title>-Element (axe document-title, serious), /explore Escape-Selection-Test laeuft ins Timeout, Root-axe-Test flakt unter Parallel-Last (solo gruen).
  evidence: Verifikationslaeufe Story 10 (20.09.); alle drei ausserhalb des Story-Scopes und vorbestehend bzw. lastabhaengig, Portal-Seiten (berlin-wahlen) durchgehend gruen.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/11-sankey-rework.md`
  summary: Sankey-Folgethemen aus Review-Runde 1; (a) Semantik Teil-Coverage x Wiederholungswahl klaeren (Gebiet ohne Wiederholungs-Row verliert seinen Uebergang still, Verhalten identisch zu Story 8, dokumentierender Test existiert); (b) Touch-Interaktions-Konzept (Tap zeigt Tooltip nur fluechtig, WCAG 1.4.13 teilweise offen, Tabellen-Alternative traegt die Daten); (c) automatisierter Chunk-Waechter (kein Bundle-Check im Repo, Lazy-Kriterium nur per Hand belegt); (d) Sprung-Band-Tooltip nennt nur das Ziel-Jahr (vonJahr im Link mitfuehren); (e) Ein-Spalten-Reihe zeigt Leer-Satz statt Gewinner-Spalte (Produktfrage, heute hat jede Reihe >=3 Wahljahre).
  evidence: Review Story 11 Runde 1 (Triage #11, #15, #17, #19, #20); Details und Quell-Reviewer im Triage-Log der Story.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/11-sankey-rework.md`
  summary: Kontrast-Luecken in Kapitel-Nav und Steuerleiste (`color-contrast`, WCAG 1.4.3) -- `kapitel-nav-link-ueberblick` (2.73:1) und `steuerleiste-jahr-2023-wiederholung` (`·W`-Suffix, 2.86:1), beide unter 4.5:1.
  evidence: Review-Patch-Runde P9 (Axe-Scan sieht den Sankey jetzt): der neue a11y-Scan im Trends-Kapitel-Zustand (Wiederholungswahl-Jahr selektiert) deckte beide erstmals auf, kein bisheriger a11y-Test scannte diesen Seiten-Zustand. Betrifft Kapitel-Nav/Steuerleiste, nicht den Sankey selbst -- `color-contrast` fuer diesen einen Test deaktiviert (`tests/e2e/a11y.e2e.ts`), Fix gehoert in eine eigene Steuerungs-/Kapitel-Nav-Story.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/12-portal-feinschliff.md`
  summary: Karten-Folgethemen und Prozess-Notizen aus Review-Runde 1; (a) Resize-/Rotations-Handler fuer die Kapitel-Karten (maxBounds/minZoom passen nach Fenster-Aenderung nicht mehr, vorbestehend, kein Controller hat einen); (b) Kamera-E2E (Pan/Zoom haelt Berlin im Canvas) braucht einen Test-Hook auf die Map-Instanz, bis dahin manueller Browser-Check je Story; (c) stories.yaml-IDs laufen seit Story 10 gegen die Story-Datei-Nummern (yaml-10 = Dein Kiez, Datei-10 = Steuerung), betrifft nur bmad-Tooling; (d) lint:wahl liegt ausserhalb des pnpm-test-Pfads, laeuft nur manuell je Story-Verifikation.
  evidence: Review Story 12 Runde 1 (Triage #16-#19); Kern-Fund #1 (Over-Constraining) wurde stattdessen direkt gepatcht.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Volatilitäts-Karte (Trends-Kapitel) auf Pedersen-Index (L1/2) umstellen und Klassen per Terzil je Reihe mit echten Spannen in der Legende bilden.
  evidence: Matze-Live-Fund 23.09.: Karte immer komplett „hoch“. Feste Schwellen 5/12 Pp. (trends-map-data.ts) liegen unter dem Minimum aller Reihen (19,7 bis 26,8 Pp., Median 35 bis 44 Pp., lokale DB inkl. 2026). Methodik-Doku, Abschnitte „Volatilität“ und „Klassifizierungs-Schwellen der Trend-/Volatilitäts-Karte“, mitziehen.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Prozess-Smoke-Test für den `isMain`-Guard in `scripts/aggregate-wahl-data.ts`.
  evidence: maybe-false (medium, unverifiziert). Weicht `argv[1]` vom realpath ab (Symlink, anderer Loader), endet `data:wahl-fetch` still mit Exit 0. Klärt: Spawn mit `--only=gibtsnicht` erwartet Exit 2.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: `sourceName` für Wahlquellen in ein geteiltes Modul unter `$lib/data/` ziehen statt vier Kopien.
  evidence: Kopien in `source-label.ts`, `get-election-result.ts`, `llm-export-builder.ts`, `wahl-section.svelte`; beim nächsten Quellwechsel driften die Labels.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Ingest-Gate, das bei einem Legendennamen über 3 % ohne Partei-Alias abbricht oder warnt.
  evidence: maybe-false (medium, unverifiziert). Aliase matchen exakt; schreibt die Endergebnis-Legende den BSW-Langnamen mit anderem Strich, landen 4,7 % still in Sonstige, die Summen-Plausi merkt es nicht.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Reproduzierbare Abnahme der Berlin-Aggregate gegen die amtlichen Werte beim Endergebnis-Re-Ingest.
  evidence: AC-Werte (Linke 25,7 usw.) nur per SQL manuell geprüft; `data:wahl-check` zählt nur Rows.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: OG-Images für die 2026er-Wahlen erzeugen und die Wahlenzahl in der `list_elections`-Description anpassen.
  evidence: technical-notes Punkt 6, von Story 15 nicht erledigt.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Flaky Test `winner-map.svelte.test.ts:347` (Adress-Hint „Hansaviertel hervorgehoben.“) stabilisieren; dazu die Unhandled Rejection in `wahl-bezirk-choropleth.svelte` beim Unmount (async fetch nach Container-Abbau).
  evidence: Voller Vitest-Lauf 23.09. zweimal rot (Matcher-Timeout unter Last), isoliert 3/3 grün; Story 15 ändert an der Datei nur Fixture-Felder. Choropleth-Rejection meldete der Story-15-Agent aus `wahl-detail-page.svelte.test.ts`.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: Gruppen-Gate in `check-wahl-data.ts` als pure Funktion testen und vor dem ersten Prod-Deploy gegen eine Alt-DB ohne `wahl_stimmbezirk_gruppe` prüfen.
  evidence: maybe-false (medium, unverifiziert). Fehlt die Bedingung, überspringt der Prod-Build `data:wahl-kiez`, und die Stimmbezirks-Karte bleibt leer.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: Portal-Hero „Datenstand“ um „Landeswahlleiterin Berlin“ ergänzen.
  evidence: Browser-Check 23.09.: Zeile nennt nur Bundeswahlleiterin und Amt für Statistik, obwohl AGH/BVV 2026 von wahlen-berlin.de stammen (Rest aus Story 15).

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: `tests/e2e/wahl-flow.e2e.ts` reparieren: alle 5 Tests hängen am Klick in die Adresssuche auf `/explore` („element was detached from the DOM“, 30 s Timeout).
  evidence: 23.09. auf Story-17-Branch und auf `main` vor Story 17 (6e5eb13, eigener Worktree-Build) identisch 5/5 rot; vorbestehend, nicht Teil des bisher geprüften E2E-Trios.

- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/19-finder-agh26.md`
  summary: `get_finder_state` und `set_finder_weights` sollen Wahl-Slug, `provisional` und `source_updated_at` im Output liefern.
  evidence: Agenten sehen heute nur über `list_elections`, dass die Finder-Rangliste auf vorläufigen AGH-2026-Zahlen beruht; Output-Felder wären neue Tool-Surface (englisch), daher nicht im Oneshot.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-a-infra-routing.md`
  summary: Interne Links auf `/en`-Seiten lokalisieren (`localizeHref` bzw. gemeinsamer Helper), damit Navigation in EN bleibt.
  evidence: Header, Karten, Teaser und Footer nutzen rohe `href`; von `/en/…` führt jeder Klick zurück auf DE. Gehört in Block B, weil die Extraktion jede Komponente ohnehin anfasst.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-a-infra-routing.md`
  summary: Prerenderte `/de/…`-URLs antworten 200 statt 301 (Stale-Locale-Redirect greift nur für nicht prerenderte Routen).
  evidence: adapter-node liefert Prerender-Dateien vor `handle`, Paraglides `deLocalizeUrl` entfernt auch das Base-Präfix `de`; vorbestehend (hooks.ts unverändert). Canonical zeigt korrekt auf die Präfix-lose URL, SEO-Schaden gering. Fix bräuchte Reroute-Anpassung oder Redirect im `server.js` vor dem Handler.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b-wahlportal.md`
  summary: `lint:wahl` in einen regulären Prüfpfad hängen (prebuild, `test` oder CI).
  evidence: Der Lint prüft seit Block B auch die Message-Dateien inkl. EN-Tabuwörter, läuft aber nur manuell; ein „stronghold“ in `en.json` würde ausgeliefert.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b2-shell.md`
  summary: Test für den sichtbaren „Adresse nicht gefunden“/„Address not found“-Text im `address-search`-Popover (DE-Default und übergebenes EN-Label).
  evidence: Nur der sr-only-Pfad ist getestet; der Popover-Leerzustand braucht ein Interaktions-Gerüst (Fokus, Eingabe, 0 Treffer), das die Testdatei noch nicht hat.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3b-inspector.md`
  summary: Tote Komponenten `layer-level-card.svelte`, `inspector-level-toggle.svelte`, `charts/kiez-score-hero.svelte` bleiben unübersetzt (DE) -- prüfen, ob sie noch gebraucht werden, bevor sie ins nächste i18n-Paket aufgenommen oder entfernt werden.
  evidence: Boundary Spec i18n B3b ("Never"): keine aktiven Aufrufer in `inspector-panel.svelte`/Section-Rendering gefunden (Grep, 27.09.); falls sie doch reaktiviert werden, brauchen sie dieselbe `lang`/`localeOpts`-Behandlung wie ihre B3b-Geschwister (`kiez-score-dimension-row`, `wahl-section`, `charts/score-bar`).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3b-inspector.md`
  summary: Adress-Such-Combobox in E2E-Tests ist breiter kaputt als der bisher dokumentierte `wahl-flow.e2e.ts`-Fall: `getByRole('combobox').click()` auf `/explore` schlägt reproduzierbar mit „element was detached from the DOM" fehl -- auch mit `--workers=1` (keine Parallel-Last) und auch mit vorherigem `expect(input).toBeVisible()`. Betroffen: `kiez-score-flow.e2e.ts`, `share-sheet.e2e.ts`, `climate-chart-interaction.e2e.ts`, `climate-heritage.e2e.ts` (alle vier von B3b unverändert). `tests/e2e/i18n-inspector.e2e.ts` (neu, B3b) umgeht das Problem per Deep-Link (`?address=lng,lat&q=…`, Story-2.12-Muster wie `home-quick-links.ts`/`i18n-atlas.e2e.ts`-Default-Einstieg) statt über die Combobox zu tippen und ist NICHT mehr betroffen (7/7 grün, sowohl gegen einen bereits laufenden als auch gegen einen frisch von Playwright gestarteten Preview-Server).
  evidence: Reproduziert 27.09. gegen vollen `pnpm build` + `pnpm preview` (Node-Adapter, kein Dev-Server): `kiez-score-flow.e2e.ts` (von B3b unverändert) scheitert an `input.click()`. Verdacht: Hydration ersetzt die SSR-Combobox der Adress-Suche kurz nach Load durch einen neuen DOM-Knoten (`header-search-trigger-mobile` legt eine `sm:hidden`-Variante nahe, die auf einen JS-Viewport-Check statt reinem CSS hindeutet); root cause nicht abschließend verifiziert, klar aber: unabhängig von i18n B3b (reproduziert an unverändertem Code). Zusätzlicher, separater Befund beim Deep-Link-Debugging: das Öffnen des Inspectors ist im Selection-Effect (`explore/+page.svelte`) an `rawMap` (geladene MapLibre-Instanz) gegated -- ein kalter Preview-Server-Start kann das erste Map-/Tile-Laden über 15s verzögern; `i18n-inspector.e2e.ts` wartet deshalb bis zu 30s auf das Map-Skeleton-Detach.

- source_spec: none
  summary: i18n Block B3c „Finder, Compare, Bookmarks“: kiez-finder-panel + kiez-finder-data, compare-panel/-row, wahl-compare-block, kiez-score-compare-block, layer-compare.ts, bookmark-dialog/-row auf Messages + EN (~110 Keys); danach /explore ins Übersetzungs-Register.
  evidence: Split aus B3 (Koordinator-Entscheidung 27.09. 00:05, Matze AFK); /explore erst nach B3a-c registrieren, sonst indexierbar halb deutsch.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3a-atlas-fundament.md`
  summary: DE-Textmängel im Atlas korrigieren: aria-label „Karte nach Sueden verschieben“ (Umlaut), Palette-Leerzustand „Kein Layer matched“ (Denglisch).
  evidence: Beim Migrieren in Messages aufgefallen; B3a hält die DE-Ausgabe bewusst Zeichen für Zeichen gleich, daher eigene kleine Korrektur.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: `/explore` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit die `/en/explore`-Seite als echt übersetzt gilt (kein `TranslationDisclaimer`-Fallback-Hinweis, `hreflang`/Sitemap-Eintrag).
  evidence: Koordinator-Entscheidung 27.09. (Matze AFK): Compare- und Inspector-`EditorialDisclaimer`-Varianten (Bodenrichtwerte, Milieuschutz, Stolperstein, Stigma-Footer, Kiez-Score-Explainer, Wahl-Stimmenanteile) bleiben bis Block C deutsch -- eine indexierte `/en/explore` waere damit editorial halb deutsch. Registrierung erst nach Block C (EditorialDisclaimer-Uebersetzung).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: Kiez-Finder-Slider S-Bahn-Nähe und Wahlverhalten ohne `aria-valuetext`, Screenreader lesen nur 0/1/2.
  evidence: Review B3c Fund #6; bipolare Slider haben `aria-valuetext`, unipolare seit jeher nicht. `stufenText` liefert den Text schon.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: `map-libre-canvas.svelte` loadError-Block („Karte konnte nicht geladen werden…“, „Unbekannter Karten-Fehler“, „Neu laden“) auf Messages + EN.
  evidence: Review B3c Fund #7; lag außerhalb der B3c-Code-Map, `/en/explore` zeigt ihn bei Kartenfehler deutsch. Vor Register-Eintrag `/explore` erledigen.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: Wahl-Vergleich zeigt bei |Diff| < 0,05 pp „+0,0“ bzw. „höher in A“ statt „±0,0“/„gleich“.
  evidence: Review B3c Fund #19; Vorzeichen kommt aus dem Rohwert, Anzeige aus dem gerundeten Wert. Vorbestehend, B3c änderte nur die Formatierung.


- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: i18n Block B4b „Layer-Detailseite“: Rahmen von `/layer/[slug]` (~30 Strings: Quelle/Lizenz/Datenstand, Werte/Skala, Berechnung, Coverage-Lücken, „Was wir NICHT zeigen“, Verwandte Layer, Methodik-Aside, Leerzustand, Hitze-CTA, `toLocaleString('de-DE')`, rohe Hrefs) plus Dataset-JSON-LD (`inLanguage`, Description-Fallback) auf Messages + EN.
  evidence: Split aus B4 (Koordinator-Entscheidung 27.09. 04:55, Matze AFK); Layer-Seite teilt keine Komponenten mit Kiez/Bezirk, eigenes PR-fähiges Paket.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `/kiez` und `/bezirk` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit die `/en/kiez/…`- und `/en/bezirk/…`-Seiten als echt übersetzt gelten (kein `TranslationDisclaimer`-Fallback-Hinweis, indexierbar).
  evidence: Koordinator-Entscheidung 27.09. (Matze AFK): Prosa (`profileProse`) und FAQ-Inhalte (`faq_qna`) bleiben bis Block C deutsch -- eine indexierte `/en/kiez/…`-Seite wäre editorial halb deutsch. Registrierung erst nach Block C (Prosa/FAQ-Übersetzung).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: EN-OG-Bilder für `/kiez/[slug]` und `/bezirk/[slug]` (eigener vorgenerierter Schritt, `scripts/generate-og-images.ts` bleibt DE).
  evidence: Boundary Spec i18n B4a ("Never"): keine EN-OG-Bilder in B4a. `/en/kiez/…` und `/en/bezirk/…` zeigen weiterhin die DE-Karte im `og:image` (ADR-005: alle Locales nutzen die DE-Karte, keine übersetzten Slugs).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `toSegments`/`distributionText` (`steckbrief-extras.ts`) zeigen die Verteilungs-Segmente (Lärm-/Grün-/Wohnlage-Kategorien im Steckbrief-Disclosure „Verteilung & Zahlen") weiterhin als rohe DE-Kategorie-Wörter, auch unter `/en/…`.
  evidence: Außerhalb der B4a-Code-Map (dort nur die `de-DE`-Zahlenformatierung in `countsText` benannt); Übersetzung bräuchte eine Cluster-spezifische Kategorie-Tabelle (Lärm-/Grün-/Wohnlage-Rohwerte unterscheiden sich je Layer) statt der generischen `capitalize()`. Analog zum B3c-Fund `map-libre-canvas`-loadError: bewusst zurückgestellt, kein Blocker für B4a.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `error-feedback-mailto.svelte` bleibt deutsch (Fehler-Melden-Link + Aria-Label), gehört zu B4b (Layer-Detailseite), nicht zu B4a.
  evidence: Der Inventur-Code-Map von B4a listete die Komponente versehentlich mit, ihr einziger Aufrufer ist `/layer/[slug]/+page.svelte` (explizit "Never: Kein `/layer` (B4b)"). Übersetzung gehört in den B4b-Task.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: Lokalisierte 404-Meldung auf `/en/kiez/…` und `/en/bezirk/…` per Test absichern.
  evidence: Review B4a Fund #7; Routen sind prerendered, 404 selten erreichbar, kein Route-Test vorhanden.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `formatMonthYear` (vormals `formatStand`) ohne `timeZone`: Datums-ISO wie `2023-01-01` zeigt westlich von UTC den Vormonat, Prerender und Client können abweichen.
  evidence: Review B4a Fund #16; vorbestehend, B4a hat nur die Locale geöffnet. Fix: `timeZone: 'Europe/Berlin'` wie `formatShortDate`.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/layer` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit `/en/layer/…`-Seiten als echt übersetzt gelten (kein `TranslationDisclaimer`-Fallback-Hinweis, indexierbar).
  evidence: Koordinator-Entscheidung (Matze AFK): Layer-Explain-Fließtext (`explain.*`) und Methodik-Inhalte (`methodology.*`) bleiben bis Block C deutsch -- eine indexierte `/en/layer/…`-Seite wäre editorial halb deutsch. Registrierung erst nach Block C (Explain-/Methodik-Übersetzung).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: EN-OG-Bilder für `/layer/[slug]` (eigener vorgenerierter Schritt, `scripts/generate-og-images.ts` bleibt DE).
  evidence: Boundary Spec i18n B4b ("Never"): keine EN-OG-Bilder in B4b. `/en/layer/…` zeigt weiterhin die DE-Karte im `og:image` (ADR-005: alle Locales nutzen die DE-Karte).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/en/lizenzen` zeigt seit B4b bereits übersetzte Layer-Namen im DataCatalog-JSON-LD (Nebeneffekt der `getLayerDisplayName(slug, { locale })`-Korrektur in `get-layer-detail.ts`), die Dataset-`description`-Fallback-Zeile (`Geo-Datensatz {layerName} in Berlin im Daten-Atlas navigator.berlin.`) bleibt dort aber weiterhin hart deutsch.
  evidence: `/lizenzen` liegt außerhalb der B4b-Code-Map (kein Boundary-Auftrag dafür); der Layer-Name-Fix wirkt dort nur als Seiteneffekt. Volle `/lizenzen`-Übersetzung ist ein eigener Block.
  update: 30.09.2026 (C4c). Die Seite ist übersetzt und registriert. Das DataCatalog-JSON-LD bleibt bewusst komplett DE (Datasets zeigen auf `/layer/…`), auch auf `/en/lizenzen`: `+page.ts` ruft `buildLayerDetail(…, 'de', …)` fest auf. Offen bis zum Abschluss-Block, der `/layer` registriert.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `layer-explain-coverage.e2e.ts` hat 3 vorbestehende, B4b-unabhängige Fails: „Detail-Page hat 0 axe-Violations" (WCAG 2.5.8 `target-size`/`target-offset` an Verwandte-Layer-Links, FAQ-Accordion-Buttons und Footer-Meta-Links -- keine dieser Elemente wurde von B4b berührt), „Map-Legend: Click expandiert Panel..." und „Legend Expand-Panel hat 0 axe-Violations" (Timeout beim Warten auf `legend-summary-*`, `/explore`-Map-Legend, komplett außerhalb der B4b-Code-Map).
  evidence: `git status` zeigt B4b änderte nur `layer/[slug]/+page(.server).svelte/ts`, `get-layer-detail.ts`, `error-feedback-mailto.svelte`, Messages -- weder `map-legend.svelte`, `faq-section.svelte` noch die Footer-Komponente. Verifiziert per Ad-hoc-Axe-Scan auf `/kiez/alexanderplatz` (0 Violations) vs. `/de/layer/laerm-2023` (29 `target-size`-Knoten, überwiegend Footer/FAQ/Related-Layer) -- Layout-abhängig, nicht B4b-spezifisch. Braucht eigenen Fix-Task (Touch-Target-Größe global oder je Layout).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: Lokalisierte 404-Meldungen von `/kiez`, `/bezirk`, `/layer` sind in Produktion unerreichbar (`prerender = true`, adapter-node liefert unbekannte Slugs nie an `load`); 404-Seite selbst lokalisieren statt `error()`-Text.
  evidence: Review B4b Fund #2 (VG, `builder.generateManifest` filtert prerenderte Routen); ergänzt den B4a-Eintrag zur ungetesteten 404.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/en/layer/…` sendet `meta description`/`og:description` deutsch, wenn `explain.short` gesetzt ist.
  evidence: Review B4b Fund #5; `explain.short` ist layer-explain-Inhalt (Block C). Mit der Übersetzung in Block C erledigt, dann prüfen.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: B4a prüfen: Place-/AdministrativeArea-/Breadcrumb-JSON-LD auf `/en/kiez` und `/en/bezirk` mit EN-Namen bei `inLanguage` de-DE angleichen (B4b-Linie: JSON-LD bleibt bis zur Registrierung DE).
  evidence: Review B4b Funde #3/#4, Koordinator-Entscheidung 27.09. 06:20; B4a nicht nachgezogen, um den abgeschlossenen Block nicht zu öffnen.


- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: DE-Textbereinigung: „Cloud-Dancer-Skala“ in `layer-explain.ts` (`kiez-score-ruhe-luft`) ist ein interner Farbskalen-Name und für Nutzer unverständlich, in DE und EN ersetzen.
  evidence: C1-Übersetzungsreview, Matze 27.09. 09:21; C1 ändert DE-Texte bewusst nicht.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: DE+EN-Textbereinigung Layer-Texte: rohe Pfade („Methodik: /methodik/kiez-score“, 8 Kiez-Score-Texte), „Option C“, Slug statt Name („wohnlagen-2024“), „Legacy-Slug“-Hinweise, „Cloud-Dancer-Skala“, interne Verweise in Methodik („Story 10.6b“, „Epic 12 Story 12.3“, „FR50/FR51“). Pfade als lokalisierte Links statt Text.
  evidence: Review C1 Fund #9 und C2-Übersetzungsreview; Texte spiegeln das DE-Original, C1/C2 überarbeiten DE bewusst nicht. `/en/explore` ist jetzt indexierbar.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: Registrierte EN-Seiten (`/en`, `/en/explore`, `/en/berlin-wahlen/…`) als eigene `<loc>` in `sitemap-en.xml` aufnehmen; `STATIC_PAGES_SOURCE` liefert für Nicht-Basis-Locales `[]`.
  evidence: Review C1 Fund #5; heute erscheinen sie nur als hreflang-Alternate am DE-Eintrag.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: Compare-Replace-Dialog auf `/en/explore` per e2e oder Page-Test absichern (5 Strings).
  evidence: Review C1 Fund #8; braucht Map-Klick plus Compare-State.

- source_spec: `_bmad-output/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: Zählung Bezirksregionen prüfen: `kiez_score_kriminalitaet_coverage_gap_0` sagt „Bezirksregion (143)“, `layer_explain_lor_bezirksregion_short` „138 in Berlin“.
  evidence: Review Textbereinigung #6; eine der Zahlen ist falsch, Datenprüfung nötig.

- source_spec: `_bmad-output/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: `/methodik/kiez-score` ohne Build-Interna: `pnpm data:aggregate-scores`, Tabellennamen `bezirk_score`/`kiez_score`, „Persona-Switcher … Phase 2“; Layernamen dort aus `getLayerDisplayName` statt Literalen.
  evidence: Review Textbereinigung #11/#14; Spec schloss weitere `/methodik`-Überarbeitung aus.

- source_spec: `_bmad-output/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: Code-Zweige der 6 gelöschten Legacy-Layer entfernen (`value-formatters.ts`, `applicability.ts`, `feature-describer.ts`, `layer-compare.ts`, `editorial-config.ts`, Tests).
  evidence: Review Textbereinigung #13; nur Texte gelöscht, Zweige sind toter Code.

- source_spec: `_bmad-output/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: `collectLlmsData` reicht `origin` an Kiez-/Bezirks-Markdown weiter: Test ergänzen, Origin mit Schluss-Slash normalisieren.
  evidence: Review Textbereinigung #15; Default ist Prod-URL, wirkt nur auf Staging/Preview.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: `renderAll` in `scripts/render-faq.ts` filtert Templates nicht nach Cluster: jede Layer-Seite bekommt alle 17 Layer-Templates (`applicableTo: [layer]`, `requires: []`), unabhängig vom Cluster des Layers. Cluster-Filter über das Layer-Bundle ergänzen.
  evidence: C3-Spec, Never-Liste; bewusst nicht Teil von C3, wirkt gleich auf DE und EN.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: `getFaqQna` hat kein ORDER BY, die FAQ-Reihenfolge auf Kiez-, Bezirk- und Layer-Seiten hängt von der physischen Zeilenfolge nach TRUNCATE+INSERT ab.
  evidence: Review C3 (Edge Case). Unverifiziert, ob Postgres die Einfügereihenfolge je ändert. Ein ORDER BY `template_id` würde die redaktionelle Reihenfolge ändern, sauber wäre eine `sort_order`-Spalte aus der YAML-Position (Migration).
  resolved: 30.09.2026. Spalte `sort_order` (Cluster-Folge, dann YAML-Position), `getFaqQna` sortiert danach. Spec: `_bmad-output/implementation-artifacts/spec-faq-reihenfolge.md`.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: FAQ `laerm-welche-quellen` sagt, die Karte zeige nur Straßenverkehrslärm LDEN; `layer_explain_laerm_2023_long` sagt „Straßen-, Schienen- und Fluglärm“. Eine der beiden Aussagen ist falsch (DE und EN).
  evidence: Review C3 (Blind Hunter). Unverifiziert: Datensatz-Beschreibung im Umweltatlas 2023 prüfen, dann FAQ oder Layer-Erklärung korrigieren.
  resolved: 30.09.2026. Umweltgerechtigkeitsatlas 2023/2024 (SenMVKU-Broschüre, Flyer): Gesamtverkehrslärm aus Straßen-, Schienen- und Flugverkehr, LDEN, einwohnergewichtet, Klassen nach Quartilen. FAQ und Methodik korrigiert, Layer-Erklärung stimmte.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: Methodik `gruenversorgung-2023` (`layer-methodology.ts:212`) nennt „Skala gering bis sehr hoch“, die Daten haben `kategorie` gut/mittel/schlecht.
  evidence: Beim C3-Abgleich gefunden (Datenwerte gezählt: gut 291, schlecht 136, mittel 113). DE und EN-Message korrigieren.
  resolved: 30.09.2026. Methodik, Layer-Erklärung und FAQ-Helper nutzen jetzt einheitlich die neutrale Skala aus Story 1.22 (gering, mittel, hoch). Skalentexte von Lärm, Luft, Bioklima (drei Klassen) und Umweltgerechtigkeit (keine starke bis fünffache Belastung) mitkorrigiert.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `cross-layer-story-block.svelte` löst seit C4a keine Effective-Locale mehr auf; montiert man ihn auf einer nicht registrierten Seite (z. B. `/kiez`), entsteht ein EN-Rahmen in deutschem `<main>`.
  evidence: Review C4a (Edge Case). Heute nur auf `/methodik/cross-layer-templates` (registriert) montiert. Vor einer Nutzung auf Profilseiten Effective-Locale wieder einbauen.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `methodik_kiez_score_sources_p1` nennt „Senatsverwaltung Stadtentwicklung Berlin“, `methodik_mss_p1` seit C4a „Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen“ (DE und EN angleichen).
  evidence: Review C4a (Blind Hunter). DE-Änderung lag außerhalb der Abnahme vom 30.09. 08:11.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `/methodik` und `/methodik/kiez-score` zeigen auf `/en` den Pfad „/lizenzen“ als sichtbaren Linktext; mit C4c durch ein Label ersetzen.
  evidence: Review C4a (Blind Hunter). Messages `methodik_licences_full_list`, `methodik_kiez_score_sources_p1`.
  resolved: 30.09.2026 (C4c). Linktext heißt „Lizenzen-Seite“ bzw. „licences page“ (Messages DE und EN, Snapshots nachgezogen).

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `/hitze` reicht `explorerHref={localizedHref(explorerLink)}` an `InDeinerNaehe`; kein Seiten-Test deckt die Fallback-Phasen (verweigert, leer, Fehler) ab.
  evidence: Review C4c (Verification Gap). Seite exponiert `requestPositionFn` nicht, Harness-Aufwand.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `lizenzen_klima_p1` nennt „vier Berliner Wetterstationen (Dahlem, Tempelhof, Buch, Brandenburg)“; „Brandenburg“ ist keine Berliner Station.
  evidence: Review C4c (Blind Hunter). Unverifiziert: Stationsliste der Klima-Quelle (DWD) prüfen, DE und EN korrigieren.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `sitemap-builder.test.ts` nutzt `/layer/mietspiegel-2024` als Seite ohne EN-Alternate; bei der `/layer`-Registrierung im Abschluss-Block eine andere Kontrolle wählen.
  evidence: Review C4c (Edge Case). `/impressum` ist keine Sitemap-Quelle.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: Kategorie-Filter auf `/updates` reagiert im Build nicht auf Toggle-Klicks; ein Effect setzt den Zustand sofort auf den URL-Wert zurück. Vorbestehend, DE und EN gleich, vermutlich auch auf Prod.
  evidence: Beim C4d-e2e gefunden (Implementierer). `?cat=` in der URL filtert. Fix gehört auf `main`.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: `scripts/publish-update/main.ts` hat keinen Test; EN-Lint-Verdrahtung und Erfolg/Fehler-Zweig sind nur über die Helfer geprüft.
  evidence: Review C4d (Verification Gap). Braucht injizierbare Git- und Dateisystem-Seams.

- source_spec: `_bmad-output/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: `tests/e2e/a11y.e2e.ts` hat vorbestehende Fails: `/_dev/wortmarke` ohne `<title>` (axe document-title), „Escape löscht Selection“ (30-s-Timeout auf `/explore`), „Root (Karte)“ flaky.
  evidence: Beim C4d-Verifikationslauf erstmals mitgelaufen; keine der Seiten von C3-C4d berührt.
