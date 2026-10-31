- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: API-Routen-Tests für /api/wahl/geometry und /api/wahl/results-at-point fehlen (ADR-012 nennt Server-Endpoints als Test-first-Scope).
  evidence: Lücke bestand schon vor Story 1 (nur kiez-shares hat einen Routen-Test); Story 2 des berlin-wahlen-Epics baut neue Wahl-APIs test-first und ist der natürliche Ort, die Bestandsrouten mitzuziehen.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: Komponenten-Test für wahl-stimmbezirk-choropleth.svelte fehlt (Winner-Zuordnung, matched-Zähler); außerdem 2 pre-existing ESLint-Errors (SvelteMap, unused matched).
  evidence: Beides bestand vor Story 1; Story 4 (Winner-Map) baut die Komponente neu und deckt es dann ab.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/2-daten-fundament-zeitreihen-und-bulk-winners.md`
  summary: Drei verbliebene sourceName-Duplikate auf den geteilten Helper src/lib/server/wahl/source-label.ts umziehen (webmcp/tools/wahl/get-election-result.ts, server/llms/data-collector.ts, utils/llm-export-builder.ts).
  evidence: Verification-Gap-Layer: byte-identische Ternaries, Tests pinnen nur den Output, Drift bei künftiger Regel-Änderung bliebe unbemerkt. Passt zu Story 9 (WebMCP-Tools).
  resolved: Release-Aufräumen 15.10.2026, Helper nach `src/lib/data/wahl-source-name.ts` verschoben, drei Duplikate ersetzt
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/2-daten-fundament-zeitreihen-und-bulk-winners.md`
  summary: Test-Strategie für DB-abhängige Tests schärfen: defensive if-empty-return-Tests no-open ohne geseedetes Postgres; Build-Script-Verdrahtung (build-wahl-analytik) ungetestet.
  evidence: Haus-Muster seit wahl-queries.test.ts; CI ohne befüllte DB meldet grüne Tests, die nichts prüfen. Entscheidung über Seed-Fixtures oder Testcontainer gehört zu einer eigenen Infra-Story.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/3-portal-skeleton-berlin-wahlen.md`
  summary: Coverage-Nachzügler Portal-Skeleton: Scroll-Spy-Berechnung (computeActive) ohne direkten Unit-Test, noindex-Flag-Wiring ohne Head-Check-Test, lint-wahl-editorial collectScanFiles-Rekursion ungetestet.
  evidence: Review-Layer Story 3; Klick-Pfad ist per Component- und E2E-Test gedeckt, der Rest braucht ein Head-Check-/Script-Test-Muster, das im Repo noch nicht existiert.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories.yaml`
  summary: Wahlkreis-Ebene für die Winner-Map (AGH-/BTW-Wahlkreise als Darstellungs-Einheit; Wahlkreis-Codes liegen in stimmbezirk.wahlkreis, Geometrien fehlen komplett).
  evidence: Matze-Direktive 19.09. (amtliche Einheiten); braucht neue AfS-Geometrie-Quelle + Wahlkreis-Aggregation, sinnvoll gebündelt mit dem 2026-Ingest (Story 15), wenn ohnehin AfS-Geodaten gezogen werden.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/4-winner-map-mit-ebenen-und-adress-suche.md`
  summary: Winner-Map-Coverage-Nachzügler: Hover-Pipeline (echtes mousemove→tooltipData-Mapping) und ein Tastatur-/Touch-Pfad auf die Pro-Gebiet-Info der Karte selbst; dazu die UX-Frage, ob der Achromatopsie-Muster-Toggle in die URL gehört.
  evidence: Review-Layer Story 4; Tabelle ist der A11y-Pfad laut Haus-Muster, echte MapLibre-Hit-Tests brauchen ein neues E2E-Muster.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/7-zeit-animation-mit-wechsel-markierung.md`
  summary: Wechsel-Kapitel lazy mounten (IntersectionObserver) und Kiez-Geometrie-Requests deduplizieren (fetchLayer-In-Flight-Map), damit der Seiten-Load nicht eager eine zweite MapLibre-Instanz plus doppelte Layer-Downloads startet.
  evidence: Review Story 7 (Blind Hunter 11, Verification Gap Other 3, Edge Case Hunter 14): wechsel-kapitel.svelte laedt Winners, Manifest, bezirke- und lor-bezirksregion-Layer beim Seiten-Load, auch in der Stimmbezirks-Default-Ansicht; Winners sind seit Story 7 dedupliziert, die Geometrie nicht (fetchLayer ist Bestandsmodul).
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Kontraste-Kapitel (CAP-6) als eigene Folge-Story bauen: Ausgeglichenheits-Karte (Marge Platz 1/2), schaerfste Nachbar-Grenzen, AGH-vs-BVV-Vergleich und Erst-/Zweitstimmen-Splitting.
  evidence: Split-Entscheidung Matze 20.09. (Story-8-Checkpoint): drei neue Daten-Fundamente noetig, die es nicht gibt: /api/wahl/winners um runner_up/margin_pp erweitern; Build-Zeit-Adjazenz aus lor-bezirksregion/bezirke-GeoJSONs (kein Nachbarschafts-Datensatz im Repo, kein turf-boolean-touches); Anteile-Bulk fuer Splitting-Differenzen (kiez-shares ist bzrId-gekeyt und nur eine Wahl). Sieger-Splitting (Erst- vs. Zweitstimmen-Sieger) waere sofort aus Winners-Bulk machbar; Portal-Stimmtyp kennt erststimme nicht, kapitel-lokal halten.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Portal-Kapitel lazy mounten und Kiez-Geometrie-Loads seitenweit deduplizieren; das Trends-Kapitel startet als dritter eager Konsument eine weitere MapLibre-Instanz plus eigene Manifest-/lor-bezirksregion-Downloads (Geometrie-Cache ist instanz-lokal).
  evidence: Review Story 8 (Blind Hunter 12, Verification Gap Other 6, Edge Case Hunter 17); verschaerft den bestehenden Story-7-Defer (fetchLayer-In-Flight-Map + IntersectionObserver-Lazy-Mount).
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Die drei fast identischen MapLibre-Kapitel-Controller (winner-map-, wechsel-kapitel-, trends-kapitel-maplibre) auf eine gemeinsame Basis konsolidieren (BERLIN_MAX_BOUNDS, mapFactory, fitBounds, Init-/Destroy-Lifecycle inkl. Container-Remount-Guard).
  evidence: Review Story 8 (Blind Hunter 13); Copy-Paste vervielfaeltigt auch Lifecycle-Luecken: der Container-Remount-Guard aus Story 8 fehlt im Wechsel-Kapitel-Controller weiterhin (Boundary verbot dort den Umbau).
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/8-trends-volatilitaet-sankey.md`
  summary: Sankey komplett ueberarbeiten (Matze-Direktive 20.09., eigene Story): Wahl-Reihe und Ebene am Sankey auswaehlbar; erste Spalte = Gebiets-Knoten der Ebene (eingefaerbt nach Gewinner der juengsten bzw. ersten Wahl), ab Spalte 2 je Wahl der Reihe die Parteien untereinander; Umsetzung mit d3-sankey (lazy geladen) inkl. Tooltips und Mouseover-Highlight einzelner Fluesse.
  evidence: Matze 20.09. 08:01, woertlich sinngemaess "unfassbar schlecht in der jetzigen fassung"; die Story-8-Fassung (gebuendelte Partei-Uebergaenge, statisches Eigenbau-SVG ohne Interaktion) verfehlt die gewuenschte Lesart. d3-sankey ist ~10 kB, d3-scale/d3-array sind bereits Dependencies, Lazy-Load-Muster existiert (home-featured-score.svelte). Achtung Kiez-Ebene: 143 Gebiets-Knoten in Spalte 1, Layout muss dichte Knoten vertragen (duenne Baender, Hover-Highlight traegt die Lesbarkeit).
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/9-partei-tabs-und-small-multiples.md`
  summary: Achromatopsie-Muster-Vokabular erweitern, Bestands-Doppelbelegungen CDU/AfD ('stripes') und GRÜNE/BSW ('dots') auflösen (4 Muster für 7+ Parteien; Story 9 hat 'diagonal-reverse' eingeführt und Die Linke/FDP getrennt).
  evidence: Review Story 9 (Blind Hunter 11, Edge Case Hunter 10, Verification Gap Other 2, Koordinator): mit nur 4 Pattern-Typen (solid/stripes/dots/diagonal[-reverse]) für 7 FINDER_PARTIES bleiben zwei Doppel bestehen; Fix-Scope dieser Runde war auf die EXAKTE Kollision (Die Linke/FDP, beide 'diagonal') begrenzt.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/9-partei-tabs-und-small-multiples.md`
  summary: Nach Freeze-Ende (22.09. 02:00) auf Prod einmalig die vier BVV-Wahlen neu ingesten (pnpm data:wahl-fetch -- --only=bvv11 / bvv16 / bvv21 / bvv23) plus data:wahl-kiez und data:wahl-analytik, damit die reparierten Stimmbezirks-Anteile (vorher ueberall 0) auch in Prod landen.
  evidence: BVV-Anteil-Bug 20.09. (transformSbbRow gueltig-Slot); der prebuild fetcht nur, wenn data:wahl-check KEINE Daten findet, ein normaler Deploy repariert die Prod-Rows daher nicht.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/10-steuerungs-klarheit.md`
  summary: Steuerungs-Haertung als Sammel-Refactor; Kontext-Badge-Testid instanz-suffixen (dreifach identisch auf der Seite, Strict-Mode-Falle), Label-ids der Radiogroups per $props.id() instanzbinden (brechen bei zweitem Mount), Sticky-Offsets (h-10 / +2.5rem / 2x +5.5rem / winner-map-Panel) auf eine gemeinsame CSS-Custom-Property ziehen.
  evidence: Review Story 10 (Triage #8/#9/#10); heute kollisionsfrei (Grep-verifiziert, E2E scoped ueber Kapitel-Testids), reine Vorsorge ohne Verhaltens-Aenderung.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/10-steuerungs-klarheit.md`
  summary: a11y-E2E-Suite reparieren; /_dev/wortmarke fehlt das <title>-Element (axe document-title, serious), /explore Escape-Selection-Test laeuft ins Timeout, Root-axe-Test flakt unter Parallel-Last (solo gruen).
  evidence: Verifikationslaeufe Story 10 (20.09.); alle drei ausserhalb des Story-Scopes und vorbestehend bzw. lastabhaengig, Portal-Seiten (berlin-wahlen) durchgehend gruen.
  resolved: Release-Aufräumen 15.10.2026, Wortmarke-Fall entfernt; Escape-Timeout und Root-Flake bleiben offen
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/11-sankey-rework.md`
  summary: Sankey-Folgethemen aus Review-Runde 1; (a) Semantik Teil-Coverage x Wiederholungswahl klaeren (Gebiet ohne Wiederholungs-Row verliert seinen Uebergang still, Verhalten identisch zu Story 8, dokumentierender Test existiert); (b) Touch-Interaktions-Konzept (Tap zeigt Tooltip nur fluechtig, WCAG 1.4.13 teilweise offen, Tabellen-Alternative traegt die Daten); (c) automatisierter Chunk-Waechter (kein Bundle-Check im Repo, Lazy-Kriterium nur per Hand belegt); (d) Sprung-Band-Tooltip nennt nur das Ziel-Jahr (vonJahr im Link mitfuehren); (e) Ein-Spalten-Reihe zeigt Leer-Satz statt Gewinner-Spalte (Produktfrage, heute hat jede Reihe >=3 Wahljahre).
  evidence: Review Story 11 Runde 1 (Triage #11, #15, #17, #19, #20); Details und Quell-Reviewer im Triage-Log der Story.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/11-sankey-rework.md`
  summary: Kontrast-Luecken in Kapitel-Nav und Steuerleiste (`color-contrast`, WCAG 1.4.3) -- `kapitel-nav-link-ueberblick` (2.73:1) und `steuerleiste-jahr-2023-wiederholung` (`·W`-Suffix, 2.86:1), beide unter 4.5:1.
  evidence: Review-Patch-Runde P9 (Axe-Scan sieht den Sankey jetzt): der neue a11y-Scan im Trends-Kapitel-Zustand (Wiederholungswahl-Jahr selektiert) deckte beide erstmals auf, kein bisheriger a11y-Test scannte diesen Seiten-Zustand. Betrifft Kapitel-Nav/Steuerleiste, nicht den Sankey selbst -- `color-contrast` fuer diesen einen Test deaktiviert (`tests/e2e/a11y.e2e.ts`), Fix gehoert in eine eigene Steuerungs-/Kapitel-Nav-Story.
- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/12-portal-feinschliff.md`
  summary: Karten-Folgethemen und Prozess-Notizen aus Review-Runde 1; (a) Resize-/Rotations-Handler fuer die Kapitel-Karten (maxBounds/minZoom passen nach Fenster-Aenderung nicht mehr, vorbestehend, kein Controller hat einen); (b) Kamera-E2E (Pan/Zoom haelt Berlin im Canvas) braucht einen Test-Hook auf die Map-Instanz, bis dahin manueller Browser-Check je Story; (c) stories.yaml-IDs laufen seit Story 10 gegen die Story-Datei-Nummern (yaml-10 = Dein Kiez, Datei-10 = Steuerung), betrifft nur bmad-Tooling; (d) lint:wahl liegt ausserhalb des pnpm-test-Pfads, laeuft nur manuell je Story-Verifikation.
  evidence: Review Story 12 Runde 1 (Triage #16-#19); Kern-Fund #1 (Over-Constraining) wurde stattdessen direkt gepatcht.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Volatilitäts-Karte (Trends-Kapitel) auf Pedersen-Index (L1/2) umstellen und Klassen per Terzil je Reihe mit echten Spannen in der Legende bilden.
  evidence: Matze-Live-Fund 23.09.: Karte immer komplett „hoch“. Feste Schwellen 5/12 Pp. (trends-map-data.ts) liegen unter dem Minimum aller Reihen (19,7 bis 26,8 Pp., Median 35 bis 44 Pp., lokale DB inkl. 2026). Methodik-Doku, Abschnitte „Volatilität“ und „Klassifizierungs-Schwellen der Trend-/Volatilitäts-Karte“, mitziehen.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Prozess-Smoke-Test für den `isMain`-Guard in `scripts/aggregate-wahl-data.ts`.
  evidence: maybe-false (medium, unverifiziert). Weicht `argv[1]` vom realpath ab (Symlink, anderer Loader), endet `data:wahl-fetch` still mit Exit 0. Klärt: Spawn mit `--only=gibtsnicht` erwartet Exit 2.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: `sourceName` für Wahlquellen in ein geteiltes Modul unter `$lib/data/` ziehen statt vier Kopien.
  evidence: Kopien in `source-label.ts`, `get-election-result.ts`, `llm-export-builder.ts`, `wahl-section.svelte`; beim nächsten Quellwechsel driften die Labels.
  resolved: Release-Aufräumen 15.10.2026, Helper unter `$lib/data/wahl-source-name.ts`; `wahl-section.svelte` bleibt (mappt über Message-Labels)

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Ingest-Gate, das bei einem Legendennamen über 3 % ohne Partei-Alias abbricht oder warnt.
  evidence: maybe-false (medium, unverifiziert). Aliase matchen exakt; schreibt die Endergebnis-Legende den BSW-Langnamen mit anderem Strich, landen 4,7 % still in Sonstige, die Summen-Plausi merkt es nicht.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Reproduzierbare Abnahme der Berlin-Aggregate gegen die amtlichen Werte beim Endergebnis-Re-Ingest.
  evidence: AC-Werte (Linke 25,7 usw.) nur per SQL manuell geprüft; `data:wahl-check` zählt nur Rows.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: OG-Images für die 2026er-Wahlen erzeugen und die Wahlenzahl in der `list_elections`-Description anpassen.
  evidence: technical-notes Punkt 6, von Story 15 nicht erledigt.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md`
  summary: Flaky Test `winner-map.svelte.test.ts:347` (Adress-Hint „Hansaviertel hervorgehoben.“) stabilisieren; dazu die Unhandled Rejection in `wahl-bezirk-choropleth.svelte` beim Unmount (async fetch nach Container-Abbau).
  evidence: Voller Vitest-Lauf 23.09. zweimal rot (Matcher-Timeout unter Last), isoliert 3/3 grün; Story 15 ändert an der Datei nur Fixture-Felder. Choropleth-Rejection meldete der Story-15-Agent aus `wahl-detail-page.svelte.test.ts`.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: Gruppen-Gate in `check-wahl-data.ts` als pure Funktion testen und vor dem ersten Prod-Deploy gegen eine Alt-DB ohne `wahl_stimmbezirk_gruppe` prüfen.
  evidence: maybe-false (medium, unverifiziert). Fehlt die Bedingung, überspringt der Prod-Build `data:wahl-kiez`, und die Stimmbezirks-Karte bleibt leer.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: Portal-Hero „Datenstand“ um „Landeswahlleiterin Berlin“ ergänzen.
  evidence: Browser-Check 23.09.: Zeile nennt nur Bundeswahlleiterin und Amt für Statistik, obwohl AGH/BVV 2026 von wahlen-berlin.de stammen (Rest aus Story 15).

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md`
  summary: `tests/e2e/wahl-flow.e2e.ts` reparieren: alle 5 Tests hängen am Klick in die Adresssuche auf `/explore` („element was detached from the DOM“, 30 s Timeout).
  evidence: 23.09. auf Story-17-Branch und auf `main` vor Story 17 (6e5eb13, eigener Worktree-Build) identisch 5/5 rot; vorbestehend, nicht Teil des bisher geprüften E2E-Trios.

- source_spec: `docs/process/specs/spec-berlin-wahlen/stories/19-finder-agh26.md`
  summary: `get_finder_state` und `set_finder_weights` sollen Wahl-Slug, `provisional` und `source_updated_at` im Output liefern.
  evidence: Agenten sehen heute nur über `list_elections`, dass die Finder-Rangliste auf vorläufigen AGH-2026-Zahlen beruht; Output-Felder wären neue Tool-Surface (englisch), daher nicht im Oneshot.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-a-infra-routing.md`
  summary: Interne Links auf `/en`-Seiten lokalisieren (`localizeHref` bzw. gemeinsamer Helper), damit Navigation in EN bleibt.
  evidence: Header, Karten, Teaser und Footer nutzen rohe `href`; von `/en/…` führt jeder Klick zurück auf DE. Gehört in Block B, weil die Extraktion jede Komponente ohnehin anfasst.
  resolved: 15.10.2026 geprüft. `site-header.svelte`, `meta-footer.svelte`, die Home-Teaser und `updates-entry-card.svelte` nutzen `localizeHref`/`localizedHref` (85 Dateien in `src`).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-a-infra-routing.md`
  summary: Prerenderte `/de/…`-URLs antworten 200 statt 301 (Stale-Locale-Redirect greift nur für nicht prerenderte Routen).
  evidence: adapter-node liefert Prerender-Dateien vor `handle`, Paraglides `deLocalizeUrl` entfernt auch das Base-Präfix `de`; vorbestehend (hooks.ts unverändert). Canonical zeigt korrekt auf die Präfix-lose URL, SEO-Schaden gering. Fix bräuchte Reroute-Anpassung oder Redirect im `server.js` vor dem Handler.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b-wahlportal.md`
  summary: `lint:wahl` in einen regulären Prüfpfad hängen (prebuild, `test` oder CI).
  evidence: Der Lint prüft seit Block B auch die Message-Dateien inkl. EN-Tabuwörter, läuft aber nur manuell; ein „stronghold“ in `en.json` würde ausgeliefert.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b2-shell.md`
  summary: Test für den sichtbaren „Adresse nicht gefunden“/„Address not found“-Text im `address-search`-Popover (DE-Default und übergebenes EN-Label).
  evidence: Nur der sr-only-Pfad ist getestet; der Popover-Leerzustand braucht ein Interaktions-Gerüst (Fokus, Eingabe, 0 Treffer), das die Testdatei noch nicht hat.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3b-inspector.md`
  summary: Tote Komponenten `layer-level-card.svelte`, `inspector-level-toggle.svelte`, `charts/kiez-score-hero.svelte` bleiben unübersetzt (DE) -- prüfen, ob sie noch gebraucht werden, bevor sie ins nächste i18n-Paket aufgenommen oder entfernt werden.
  evidence: Boundary Spec i18n B3b ("Never"): keine aktiven Aufrufer in `inspector-panel.svelte`/Section-Rendering gefunden (Grep, 27.09.); falls sie doch reaktiviert werden, brauchen sie dieselbe `lang`/`localeOpts`-Behandlung wie ihre B3b-Geschwister (`kiez-score-dimension-row`, `wahl-section`, `charts/score-bar`).
  resolved: Release-Aufräumen 15.10.2026, drei Komponenten samt Tests entfernt (keine Referenzen)

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3b-inspector.md`
  summary: Adress-Such-Combobox in E2E-Tests ist breiter kaputt als der bisher dokumentierte `wahl-flow.e2e.ts`-Fall: `getByRole('combobox').click()` auf `/explore` schlägt reproduzierbar mit „element was detached from the DOM" fehl -- auch mit `--workers=1` (keine Parallel-Last) und auch mit vorherigem `expect(input).toBeVisible()`. Betroffen: `kiez-score-flow.e2e.ts`, `share-sheet.e2e.ts`, `climate-chart-interaction.e2e.ts`, `climate-heritage.e2e.ts` (alle vier von B3b unverändert). `tests/e2e/i18n-inspector.e2e.ts` (neu, B3b) umgeht das Problem per Deep-Link (`?address=lng,lat&q=…`, Story-2.12-Muster wie `home-quick-links.ts`/`i18n-atlas.e2e.ts`-Default-Einstieg) statt über die Combobox zu tippen und ist NICHT mehr betroffen (7/7 grün, sowohl gegen einen bereits laufenden als auch gegen einen frisch von Playwright gestarteten Preview-Server).
  evidence: Reproduziert 27.09. gegen vollen `pnpm build` + `pnpm preview` (Node-Adapter, kein Dev-Server): `kiez-score-flow.e2e.ts` (von B3b unverändert) scheitert an `input.click()`. Verdacht: Hydration ersetzt die SSR-Combobox der Adress-Suche kurz nach Load durch einen neuen DOM-Knoten (`header-search-trigger-mobile` legt eine `sm:hidden`-Variante nahe, die auf einen JS-Viewport-Check statt reinem CSS hindeutet); root cause nicht abschließend verifiziert, klar aber: unabhängig von i18n B3b (reproduziert an unverändertem Code). Zusätzlicher, separater Befund beim Deep-Link-Debugging: das Öffnen des Inspectors ist im Selection-Effect (`explore/+page.svelte`) an `rawMap` (geladene MapLibre-Instanz) gegated -- ein kalter Preview-Server-Start kann das erste Map-/Tile-Laden über 15s verzögern; `i18n-inspector.e2e.ts` wartet deshalb bis zu 30s auf das Map-Skeleton-Detach.

- source_spec: none
  summary: i18n Block B3c „Finder, Compare, Bookmarks“: kiez-finder-panel + kiez-finder-data, compare-panel/-row, wahl-compare-block, kiez-score-compare-block, layer-compare.ts, bookmark-dialog/-row auf Messages + EN (~110 Keys); danach /explore ins Übersetzungs-Register.
  evidence: Split aus B3 (Koordinator-Entscheidung 27.09. 00:05, Matze AFK); /explore erst nach B3a-c registrieren, sonst indexierbar halb deutsch.
  resolved: B3c umgesetzt (15.10.2026 geprüft). kiez-finder-panel nutzt `m.finder_*`-Messages, `/explore` steht im `TRANSLATION_REGISTER` (Block C1).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3a-atlas-fundament.md`
  summary: DE-Textmängel im Atlas korrigieren: aria-label „Karte nach Sueden verschieben“ (Umlaut), Palette-Leerzustand „Kein Layer matched“ (Denglisch).
  evidence: Beim Migrieren in Messages aufgefallen; B3a hält die DE-Ausgabe bewusst Zeichen für Zeichen gleich, daher eigene kleine Korrektur.
  resolved: 30.09.2026 (D1). „Süden“ mit Umlaut, Palette-Leerzustand „Kein Layer passt zu …“.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: `/explore` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit die `/en/explore`-Seite als echt übersetzt gilt (kein `TranslationDisclaimer`-Fallback-Hinweis, `hreflang`/Sitemap-Eintrag).
  evidence: Koordinator-Entscheidung 27.09. (Matze AFK): Compare- und Inspector-`EditorialDisclaimer`-Varianten (Bodenrichtwerte, Milieuschutz, Stolperstein, Stigma-Footer, Kiez-Score-Explainer, Wahl-Stimmenanteile) bleiben bis Block C deutsch -- eine indexierte `/en/explore` waere damit editorial halb deutsch. Registrierung erst nach Block C (EditorialDisclaimer-Uebersetzung).
  resolved: 15.10.2026 geprüft. `{ pathname: '/explore', locale: 'en' }` steht in `src/lib/seo/translation-register.ts:112` (Block C1).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: Kiez-Finder-Slider S-Bahn-Nähe und Wahlverhalten ohne `aria-valuetext`, Screenreader lesen nur 0/1/2.
  evidence: Review B3c Fund #6; bipolare Slider haben `aria-valuetext`, unipolare seit jeher nicht. `stufenText` liefert den Text schon.
  resolved: 15.10.2026 geprüft. `kiez-finder-panel.svelte:505` setzt `aria-valuetext={stufenText(def.family, …)}` für alle Slider-Familien.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: `map-libre-canvas.svelte` loadError-Block („Karte konnte nicht geladen werden…“, „Unbekannter Karten-Fehler“, „Neu laden“) auf Messages + EN.
  evidence: Review B3c Fund #7; lag außerhalb der B3c-Code-Map, `/en/explore` zeigt ihn bei Kartenfehler deutsch. Vor Register-Eintrag `/explore` erledigen.
  resolved: 15.10.2026 geprüft. `map-libre-canvas.svelte` nutzt `m.map_load_error_timeout()`, `m.map_load_error_unknown()` und `m.map_load_error_reload_button()`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b3c-finder-compare-bookmarks.md`
  summary: Wahl-Vergleich zeigt bei |Diff| < 0,05 pp „+0,0“ bzw. „höher in A“ statt „±0,0“/„gleich“.
  evidence: Review B3c Fund #19; Vorzeichen kommt aus dem Rohwert, Anzeige aus dem gerundeten Wert. Vorbestehend, B3c änderte nur die Formatierung.


- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: i18n Block B4b „Layer-Detailseite“: Rahmen von `/layer/[slug]` (~30 Strings: Quelle/Lizenz/Datenstand, Werte/Skala, Berechnung, Coverage-Lücken, „Was wir NICHT zeigen“, Verwandte Layer, Methodik-Aside, Leerzustand, Hitze-CTA, `toLocaleString('de-DE')`, rohe Hrefs) plus Dataset-JSON-LD (`inLanguage`, Description-Fallback) auf Messages + EN.
  evidence: Split aus B4 (Koordinator-Entscheidung 27.09. 04:55, Matze AFK); Layer-Seite teilt keine Komponenten mit Kiez/Bezirk, eigenes PR-fähiges Paket.
  resolved: 15.10.2026 geprüft. `layer/[slug]/+page.svelte` nutzt Messages (`layer_page_*`), `/layer` ist mit `prefix: true` registriert (D1), Dataset-JSON-LD trägt die Seiten-Locale.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `/kiez` und `/bezirk` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit die `/en/kiez/…`- und `/en/bezirk/…`-Seiten als echt übersetzt gelten (kein `TranslationDisclaimer`-Fallback-Hinweis, indexierbar).
  evidence: Koordinator-Entscheidung 27.09. (Matze AFK): Prosa (`profileProse`) und FAQ-Inhalte (`faq_qna`) bleiben bis Block C deutsch -- eine indexierte `/en/kiez/…`-Seite wäre editorial halb deutsch. Registrierung erst nach Block C (Prosa/FAQ-Übersetzung).
  resolved: 30.09.2026 (D1). `/kiez`, `/bezirk` und `/layer` stehen mit `prefix: true` im `TRANSLATION_REGISTER`, das Teil-Register ist leer (Spec `spec-i18n-d1-register-sitemap.md`).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: EN-OG-Bilder für `/kiez/[slug]` und `/bezirk/[slug]` (eigener vorgenerierter Schritt, `scripts/generate-og-images.ts` bleibt DE).
  evidence: Boundary Spec i18n B4a ("Never"): keine EN-OG-Bilder in B4a. `/en/kiez/…` und `/en/bezirk/…` zeigen weiterhin die DE-Karte im `og:image` (ADR-005: alle Locales nutzen die DE-Karte, keine übersetzten Slugs).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `toSegments`/`distributionText` (`steckbrief-extras.ts`) zeigen die Verteilungs-Segmente (Lärm-/Grün-/Wohnlage-Kategorien im Steckbrief-Disclosure „Verteilung & Zahlen") weiterhin als rohe DE-Kategorie-Wörter, auch unter `/en/…`.
  evidence: Außerhalb der B4a-Code-Map (dort nur die `de-DE`-Zahlenformatierung in `countsText` benannt); Übersetzung bräuchte eine Cluster-spezifische Kategorie-Tabelle (Lärm-/Grün-/Wohnlage-Rohwerte unterscheiden sich je Layer) statt der generischen `capitalize()`. Analog zum B3c-Fund `map-libre-canvas`-loadError: bewusst zurückgestellt, kein Blocker für B4a.
  resolved: 30.09.2026 (D1). `toSegments` lokalisiert Lärm-, Grün- und Wohnlage-Kategorien nach Seiten-Locale, unbekannte Rohwerte behalten `lang="de"`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `error-feedback-mailto.svelte` bleibt deutsch (Fehler-Melden-Link + Aria-Label), gehört zu B4b (Layer-Detailseite), nicht zu B4a.
  evidence: Der Inventur-Code-Map von B4a listete die Komponente versehentlich mit, ihr einziger Aufrufer ist `/layer/[slug]/+page.svelte` (explizit "Never: Kein `/layer` (B4b)"). Übersetzung gehört in den B4b-Task.
  resolved: 15.10.2026 geprüft. Die Komponente nutzt `m.error_feedback_mailto_label()` und `m.error_feedback_mailto_aria_label()`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: Lokalisierte 404-Meldung auf `/en/kiez/…` und `/en/bezirk/…` per Test absichern.
  evidence: Review B4a Fund #7; Routen sind prerendered, 404 selten erreichbar, kein Route-Test vorhanden.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4a-kiez-bezirk-rahmen.md`
  summary: `formatMonthYear` (vormals `formatStand`) ohne `timeZone`: Datums-ISO wie `2023-01-01` zeigt westlich von UTC den Vormonat, Prerender und Client können abweichen.
  evidence: Review B4a Fund #16; vorbestehend, B4a hat nur die Locale geöffnet. Fix: `timeZone: 'Europe/Berlin'` wie `formatShortDate`.
  resolved: Release-Aufräumen 15.10.2026, `timeZone: 'Europe/Berlin'` ergänzt, Test mit TZ westlich UTC

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/layer` in `$lib/seo/translation-register.ts` (`TRANSLATION_REGISTER`) eintragen, damit `/en/layer/…`-Seiten als echt übersetzt gelten (kein `TranslationDisclaimer`-Fallback-Hinweis, indexierbar).
  evidence: Koordinator-Entscheidung (Matze AFK): Layer-Explain-Fließtext (`explain.*`) und Methodik-Inhalte (`methodology.*`) bleiben bis Block C deutsch -- eine indexierte `/en/layer/…`-Seite wäre editorial halb deutsch. Registrierung erst nach Block C (Explain-/Methodik-Übersetzung).
  resolved: 15.10.2026 geprüft. `{ pathname: '/layer', locale: 'en', prefix: true }` in `translation-register.ts:125` (D1).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: EN-OG-Bilder für `/layer/[slug]` (eigener vorgenerierter Schritt, `scripts/generate-og-images.ts` bleibt DE).
  evidence: Boundary Spec i18n B4b ("Never"): keine EN-OG-Bilder in B4b. `/en/layer/…` zeigt weiterhin die DE-Karte im `og:image` (ADR-005: alle Locales nutzen die DE-Karte).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/en/lizenzen` zeigt seit B4b bereits übersetzte Layer-Namen im DataCatalog-JSON-LD (Nebeneffekt der `getLayerDisplayName(slug, { locale })`-Korrektur in `get-layer-detail.ts`), die Dataset-`description`-Fallback-Zeile (`Geo-Datensatz {layerName} in Berlin im Daten-Atlas navigator.berlin.`) bleibt dort aber weiterhin hart deutsch.
  evidence: `/lizenzen` liegt außerhalb der B4b-Code-Map (kein Boundary-Auftrag dafür); der Layer-Name-Fix wirkt dort nur als Seiteneffekt. Volle `/lizenzen`-Übersetzung ist ein eigener Block.
  update: 30.09.2026 (C4c). Die Seite ist übersetzt und registriert. Das DataCatalog-JSON-LD bleibt bewusst komplett DE (Datasets zeigen auf `/layer/…`), auch auf `/en/lizenzen`: `+page.ts` ruft `buildLayerDetail(…, 'de', …)` fest auf. Offen bis zum Abschluss-Block, der `/layer` registriert.
  resolved: 30.09.2026 (D1). DataCatalog-JSON-LD folgt der Seiten-Locale, Datasets zeigen auf `/en/layer/…` (`+page.ts`, `+page.svelte`).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `layer-explain-coverage.e2e.ts` hat 3 vorbestehende, B4b-unabhängige Fails: „Detail-Page hat 0 axe-Violations" (WCAG 2.5.8 `target-size`/`target-offset` an Verwandte-Layer-Links, FAQ-Accordion-Buttons und Footer-Meta-Links -- keine dieser Elemente wurde von B4b berührt), „Map-Legend: Click expandiert Panel..." und „Legend Expand-Panel hat 0 axe-Violations" (Timeout beim Warten auf `legend-summary-*`, `/explore`-Map-Legend, komplett außerhalb der B4b-Code-Map).
  evidence: `git status` zeigt B4b änderte nur `layer/[slug]/+page(.server).svelte/ts`, `get-layer-detail.ts`, `error-feedback-mailto.svelte`, Messages -- weder `map-legend.svelte`, `faq-section.svelte` noch die Footer-Komponente. Verifiziert per Ad-hoc-Axe-Scan auf `/kiez/alexanderplatz` (0 Violations) vs. `/de/layer/laerm-2023` (29 `target-size`-Knoten, überwiegend Footer/FAQ/Related-Layer) -- Layout-abhängig, nicht B4b-spezifisch. Braucht eigenen Fix-Task (Touch-Target-Größe global oder je Layout).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: Lokalisierte 404-Meldungen von `/kiez`, `/bezirk`, `/layer` sind in Produktion unerreichbar (`prerender = true`, adapter-node liefert unbekannte Slugs nie an `load`); 404-Seite selbst lokalisieren statt `error()`-Text.
  evidence: Review B4b Fund #2 (VG, `builder.generateManifest` filtert prerenderte Routen); ergänzt den B4a-Eintrag zur ungetesteten 404.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: `/en/layer/…` sendet `meta description`/`og:description` deutsch, wenn `explain.short` gesetzt ist.
  evidence: Review B4b Fund #5; `explain.short` ist layer-explain-Inhalt (Block C). Mit der Übersetzung in Block C erledigt, dann prüfen.
  resolved: S6 (15.10.2026). `buildLayerMeta` (`src/lib/seo/layer-meta.ts`) baut die Description mit Seiten-Locale, `lead` kommt aus dem übersetzten `explain.short`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-b4b-layer-rahmen.md`
  summary: B4a prüfen: Place-/AdministrativeArea-/Breadcrumb-JSON-LD auf `/en/kiez` und `/en/bezirk` mit EN-Namen bei `inLanguage` de-DE angleichen (B4b-Linie: JSON-LD bleibt bis zur Registrierung DE).
  evidence: Review B4b Funde #3/#4, Koordinator-Entscheidung 27.09. 06:20; B4a nicht nachgezogen, um den abgeschlossenen Block nicht zu öffnen.
  resolved: 30.09.2026 (D1). Place, AdministrativeArea, Breadcrumb und `additionalProperty`-Namen folgen der Seiten-Locale; `/layer`-JSON-LD ebenso mit `inLanguage` en-US.


- source_spec: `docs/process/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: DE-Textbereinigung: „Cloud-Dancer-Skala“ in `layer-explain.ts` (`kiez-score-ruhe-luft`) ist ein interner Farbskalen-Name und für Nutzer unverständlich, in DE und EN ersetzen.
  evidence: C1-Übersetzungsreview, Matze 27.09. 09:21; C1 ändert DE-Texte bewusst nicht.
  resolved: 15.10.2026 geprüft. `Cloud-Dancer` steht nur noch in Code-Kommentaren (`score-ranking-table.svelte`, `partei-farben.ts`), nicht mehr in `messages/*.json` oder `layer-explain.ts`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: DE+EN-Textbereinigung Layer-Texte: rohe Pfade („Methodik: /methodik/kiez-score“, 8 Kiez-Score-Texte), „Option C“, Slug statt Name („wohnlagen-2024“), „Legacy-Slug“-Hinweise, „Cloud-Dancer-Skala“, interne Verweise in Methodik („Story 10.6b“, „Epic 12 Story 12.3“, „FR50/FR51“). Pfade als lokalisierte Links statt Text.
  evidence: Review C1 Fund #9 und C2-Übersetzungsreview; Texte spiegeln das DE-Original, C1/C2 überarbeiten DE bewusst nicht. `/en/explore` ist jetzt indexierbar.
  resolved: 15.10.2026 geprüft. Grep nach „Option C“, „Story 1x.“, „Epic 12“, „FR50/FR51“, „Legacy-Slug“ und „Methodik: /“ liefert in `messages/de.json` und `messages/en.json` keine Treffer.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: Registrierte EN-Seiten (`/en`, `/en/explore`, `/en/berlin-wahlen/…`) als eigene `<loc>` in `sitemap-en.xml` aufnehmen; `STATIC_PAGES_SOURCE` liefert für Nicht-Basis-Locales `[]`.
  evidence: Review C1 Fund #5; heute erscheinen sie nur als hreflang-Alternate am DE-Eintrag.
  resolved: 30.09.2026 (D1). Alle Sitemap-Quellen liefern je Locale `localizedPathname`, das Register-Gate filtert; `sitemap-en.xml` lädt Kiez- und Bezirk-Slugs.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md`
  summary: Compare-Replace-Dialog auf `/en/explore` per e2e oder Page-Test absichern (5 Strings).
  evidence: Review C1 Fund #8; braucht Map-Klick plus Compare-State.

- source_spec: `docs/process/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: Zählung Bezirksregionen prüfen: `kiez_score_kriminalitaet_coverage_gap_0` sagt „Bezirksregion (143)“, `layer_explain_lor_bezirksregion_short` „138 in Berlin“.
  evidence: Review Textbereinigung #6; eine der Zahlen ist falsch, Datenprüfung nötig.
  resolved: Release-Aufräumen 15.10.2026, 143 Features im GeoJSON, Layer-Text DE/EN auf 143

- source_spec: `docs/process/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: `/methodik/kiez-score` ohne Build-Interna: `pnpm data:aggregate-scores`, Tabellennamen `bezirk_score`/`kiez_score`, „Persona-Switcher … Phase 2“; Layernamen dort aus `getLayerDisplayName` statt Literalen.
  evidence: Review Textbereinigung #11/#14; Spec schloss weitere `/methodik`-Überarbeitung aus.
  resolved: Release-Aufräumen 15.10.2026, Build-Interna (Befehl, Tabellennamen) DE/EN entfernt; Persona-Switcher-Text und Layernamen-Helper nicht Teil dieses Punkts

- source_spec: `docs/process/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: Code-Zweige der 6 gelöschten Legacy-Layer entfernen (`value-formatters.ts`, `applicability.ts`, `feature-describer.ts`, `layer-compare.ts`, `editorial-config.ts`, Tests).
  evidence: Review Textbereinigung #13; nur Texte gelöscht, Zweige sind toter Code.

- source_spec: `docs/process/implementation-artifacts/spec-textbereinigung-layer-texte.md`
  summary: `collectLlmsData` reicht `origin` an Kiez-/Bezirks-Markdown weiter: Test ergänzen, Origin mit Schluss-Slash normalisieren.
  evidence: Review Textbereinigung #15; Default ist Prod-URL, wirkt nur auf Staging/Preview.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: `renderAll` in `scripts/render-faq.ts` filtert Templates nicht nach Cluster: jede Layer-Seite bekommt alle 17 Layer-Templates (`applicableTo: [layer]`, `requires: []`), unabhängig vom Cluster des Layers. Cluster-Filter über das Layer-Bundle ergänzen.
  evidence: C3-Spec, Never-Liste; bewusst nicht Teil von C3, wirkt gleich auf DE und EN.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: `getFaqQna` hat kein ORDER BY, die FAQ-Reihenfolge auf Kiez-, Bezirk- und Layer-Seiten hängt von der physischen Zeilenfolge nach TRUNCATE+INSERT ab.
  evidence: Review C3 (Edge Case). Unverifiziert, ob Postgres die Einfügereihenfolge je ändert. Ein ORDER BY `template_id` würde die redaktionelle Reihenfolge ändern, sauber wäre eine `sort_order`-Spalte aus der YAML-Position (Migration).
  resolved: 30.09.2026. Spalte `sort_order` (Cluster-Folge, dann YAML-Position), `getFaqQna` sortiert danach. Spec: `docs/process/implementation-artifacts/spec-faq-reihenfolge.md`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: FAQ `laerm-welche-quellen` sagt, die Karte zeige nur Straßenverkehrslärm LDEN; `layer_explain_laerm_2023_long` sagt „Straßen-, Schienen- und Fluglärm“. Eine der beiden Aussagen ist falsch (DE und EN).
  evidence: Review C3 (Blind Hunter). Unverifiziert: Datensatz-Beschreibung im Umweltatlas 2023 prüfen, dann FAQ oder Layer-Erklärung korrigieren.
  resolved: 30.09.2026. Umweltgerechtigkeitsatlas 2023/2024 (SenMVKU-Broschüre, Flyer): Gesamtverkehrslärm aus Straßen-, Schienen- und Flugverkehr, LDEN, einwohnergewichtet, Klassen nach Quartilen. FAQ und Methodik korrigiert, Layer-Erklärung stimmte.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c3-faq.md`
  summary: Methodik `gruenversorgung-2023` (`layer-methodology.ts:212`) nennt „Skala gering bis sehr hoch“, die Daten haben `kategorie` gut/mittel/schlecht.
  evidence: Beim C3-Abgleich gefunden (Datenwerte gezählt: gut 291, schlecht 136, mittel 113). DE und EN-Message korrigieren.
  resolved: 30.09.2026. Methodik, Layer-Erklärung und FAQ-Helper nutzen jetzt einheitlich die neutrale Skala aus Story 1.22 (gering, mittel, hoch). Skalentexte von Lärm, Luft, Bioklima (drei Klassen) und Umweltgerechtigkeit (keine starke bis fünffache Belastung) mitkorrigiert.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `cross-layer-story-block.svelte` löst seit C4a keine Effective-Locale mehr auf; montiert man ihn auf einer nicht registrierten Seite (z. B. `/kiez`), entsteht ein EN-Rahmen in deutschem `<main>`.
  evidence: Review C4a (Edge Case). Heute nur auf `/methodik/cross-layer-templates` (registriert) montiert. Vor einer Nutzung auf Profilseiten Effective-Locale wieder einbauen.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `methodik_kiez_score_sources_p1` nennt „Senatsverwaltung Stadtentwicklung Berlin“, `methodik_mss_p1` seit C4a „Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen“ (DE und EN angleichen).
  evidence: Review C4a (Blind Hunter). DE-Änderung lag außerhalb der Abnahme vom 30.09. 08:11.
  resolved: 30.09.2026 (D1). Behördenname in DE und EN an `methodik_mss_p1` angeglichen.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4a-methodik-kern.md`
  summary: `/methodik` und `/methodik/kiez-score` zeigen auf `/en` den Pfad „/lizenzen“ als sichtbaren Linktext; mit C4c durch ein Label ersetzen.
  evidence: Review C4a (Blind Hunter). Messages `methodik_licences_full_list`, `methodik_kiez_score_sources_p1`.
  resolved: 30.09.2026 (C4c). Linktext heißt „Lizenzen-Seite“ bzw. „licences page“ (Messages DE und EN, Snapshots nachgezogen).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `/hitze` reicht `explorerHref={localizedHref(explorerLink)}` an `InDeinerNaehe`; kein Seiten-Test deckt die Fallback-Phasen (verweigert, leer, Fehler) ab.
  evidence: Review C4c (Verification Gap). Seite exponiert `requestPositionFn` nicht, Harness-Aufwand.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `lizenzen_klima_p1` nennt „vier Berliner Wetterstationen (Dahlem, Tempelhof, Buch, Brandenburg)“; „Brandenburg“ ist keine Berliner Station.
  evidence: Review C4c (Blind Hunter). Unverifiziert: Stationsliste der Klima-Quelle (DWD) prüfen, DE und EN korrigieren.
  resolved: Release-Aufräumen 15.10.2026, Stationen laut `get-climate-station.ts`: Dahlem, Tempelhof, Buch, Schönefeld; „in und um Berlin“ DE/EN

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md`
  summary: `sitemap-builder.test.ts` nutzt `/layer/mietspiegel-2024` als Seite ohne EN-Alternate; bei der `/layer`-Registrierung im Abschluss-Block eine andere Kontrolle wählen.
  evidence: Review C4c (Edge Case). `/impressum` ist keine Sitemap-Quelle.
  resolved: 30.09.2026 (D1). Der Test prüft jetzt, dass `/impressum` und `/datenschutz` fehlen, und dass registrierte Detailseiten den vollen hreflang-Cluster tragen.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: Kategorie-Filter auf `/updates` reagiert im Build nicht auf Toggle-Klicks; ein Effect setzt den Zustand sofort auf den URL-Wert zurück. Vorbestehend, DE und EN gleich, vermutlich auch auf Prod.
  evidence: Beim C4d-e2e gefunden (Implementierer). `?cat=` in der URL filtert. Fix gehört auf `main`.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: `scripts/publish-update/main.ts` hat keinen Test; EN-Lint-Verdrahtung und Erfolg/Fehler-Zweig sind nur über die Helfer geprüft.
  evidence: Review C4d (Verification Gap). Braucht injizierbare Git- und Dateisystem-Seams.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c4d-updates.md`
  summary: `tests/e2e/a11y.e2e.ts` hat vorbestehende Fails: `/_dev/wortmarke` ohne `<title>` (axe document-title), „Escape löscht Selection“ (30-s-Timeout auf `/explore`), „Root (Karte)“ flaky.
  evidence: Beim C4d-Verifikationslauf erstmals mitgelaufen; keine der Seiten von C3-C4d berührt.
  resolved: Release-Aufräumen 15.10.2026, Wortmarke-Fall entfernt; Escape-Timeout und Root-Flake bleiben offen

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c5-profile.md`
  summary: Generator-Prompt (`scripts/build-kiez-profiles.ts` SYSTEM_PROMPT) um die neutrale Grünversorgungs-Skala ergänzen (gering/mittel/hoch statt gut/schlecht) und DE-Lint-Muster dafür, sonst bringt eine Neu-Generierung „schlecht“/„gut“ zurück.
  evidence: Review C5 (Blind Hunter). Korrektur am 30.09. nur in den Texten (64 Dateien DE+EN).

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c5-profile.md`
  summary: Zahlen-Lint erfasst ausgeschriebene Zahlen („Rang fünf“, „rank five“) nicht.
  evidence: Review C5 (Blind Hunter). Betrifft DE und EN gleichermaßen.

- source_spec: `docs/process/implementation-artifacts/spec-i18n-c5-profile.md`
  summary: Nach `pnpm exec vitest run` ist die lokale Tabelle `kiez_rank` leer (0 Zeilen); `pnpm lint:profiles` meldet dann ungedeckte Rang-Zahlen. Vermutlich leert ein DB-Test (CASCADE) die Tabelle.
  evidence: 30.09. reproduziert: vor `data:rank` 0 Zeilen und EN failed=142, danach 2145 Zeilen und failed=0. Betrifft nur lokale Dev-DB.

- source_spec: `docs/process/implementation-artifacts/spec-fix-prerender-404-links.md`
  summary: Prerender-404 im Build sichtbar machen (CI-Schritt oder `handleHttpError` mit Fehler), damit tote interne Links nicht wieder unbemerkt live gehen.
  evidence: `svelte.config.js` loggt Prerender-404 nur per `console.warn`; die 32 Treffer vom 14.10.2026 fielen nur zufällig im Coolify-Log auf.
  resolved: S5 (15.10.2026). `svelte.config.js` nutzt `createHandleHttpError` (`src/lib/build/strict-build.js`), das im Strict-Build (`NAVIGATOR_STRICT_BUILD=1`, Dockerfile) bei Prerender-HTTP-Fehlern wirft; Allowlist leer.

- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Zensus-Folge-Story 1 · Bestandsmiete als 100m-Raster (PMTiles, Muster klima-pet-2022) für die Detail-Ansicht; KLAMMERN-Zellen dämpfen oder ausblenden; PMTiles ist im Zwei-Karten-Regelwerk immer Fläche.
  evidence: Owner-Entscheidung 14.10.2026: Kiez-/PLR-Aggregat zuerst, Raster als eigene Story (Recherche 3.1 + Nachtrag 22.08.).
  resolved: überholt durch die Entscheidung Matze 14.10.2026 (Eintrag „ENTSCHIEDEN … Folge-Story 1“ weiter unten), nicht umsetzen.
- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Zensus-Folge-Story 2 · Leerstandsquote und marktaktive Leerstandsquote als PLR-Choropleth (Leerstandsquote_in_Gitterzellen.zip, Marktaktive_Leerstandsquote_in_Gitterzellen.zip).
  evidence: Owner-Entscheidung 14.10.2026; Pipeline aus der Bestandsmiete-Story wiederverwenden.
  resolved: überholt durch die Entscheidung Matze 14.10.2026 (Eintrag „ENTSCHIEDEN … Folge-Story Leerstand“ weiter unten), nicht umsetzen.
- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Zensus-Folge-Story 3 · Gebäudealter (Gebaeude_nach_Baujahr_Jahrzehnte.zip bzw. Wohnungen_nach_Baujahresklassen) als PLR-Choropleth, z. B. Anteil Altbau vor 1949.
  evidence: Owner-Entscheidung 14.10.2026; Kennzahl vor Umsetzung festlegen.
- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Zensus-Folge-Story 4 · Heizungsart/Energieträger als Anteil Fernwärme bzw. Wärmepumpe pro PLR (Zensus2022_Heizungsart.zip, Zensus2022_Energietraeger.zip), anschlussfähig an Wärmeplanung.
  evidence: Owner-Entscheidung 14.10.2026.
  resolved: überholt durch die Entscheidung Matze 14.10.2026 (Eintrag „ENTSCHIEDEN … Heizungsart/Energieträger“ weiter unten), nicht umsetzen.
- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Kiez-, Bezirks- und Layer-Seiten grundsätzlich attraktiver machen, damit Einsteiger bleiben und weiterklicken (Bestandsmiete ist nur ein Baustein); Ausgangspunkt Brainstorming, dann Epic-Schnitt.
  evidence: Bounce-Befund Plausible 08.10.2026 (Kiez-Seiten springen fast immer sofort ab); Matze 14.10.2026: „müssen generell besser und attraktiver werden“, Prio-Thema.
  resolved: Landing-Epic L1-L8 (15.10.2026). Specs `spec-l1-explore-ortsfokus.md` bis `spec-l7-layer-seiten.md` plus S7/S8 (`spec-s7-uebersichtsseiten.md`, `spec-s8-hub-links.md`) liegen vor, Epic-Suiten grün.

- source_spec: `docs/process/implementation-artifacts/spec-zensus-miete-farben.md`
  summary: Größen-Symbole bei kleinsten Faktoren (Einwohnerdichte 0,3, Wohnlagen 0,45) haben nur einen Sub-Pixel-Rand; auf dunklen Flächenklassen (Bestandsmiete Klasse 4/5) prüfen, ob Mindest-Randbreite oder Mindestgröße nötig ist.
  evidence: maybe-false (medium), unverifiziert. `buildScoreDotSvg` 1,5 px auf 18-px-Basis skaliert mit `icon-size`; klären per Screenshot bei kleinster Symbolgröße auf Klasse 5 (Zoom-Stufen durchgehen).

- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: ENTSCHIEDEN 14.10.2026, nicht umsetzen: Zensus-Folge-Story 1 (Bestandsmiete als 100m-Raster). Matze: Unterschied zum Planungsraum-Layer für Nutzer nicht verständlich, zwei fast gleiche Inspector-Karten verwirren.
  evidence: Prototyp lief (28.463 Zellen, 1,74 MB PMTiles), wurde verworfen. Kosten: eigener PMTiles-Layer, Ein-PMTiles-Regel, Werte nur im sichtbaren Ausschnitt. Falls später: als Zoom-Detail desselben Layers mit einer Inspector-Karte („Planungsraum x · diese Zelle y“), nicht als eigener Slug.
  resolved: entschieden, nicht umsetzen (Matze 14.10.2026)

- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: Präzisierung Zensus-Folge-Story 2 (Matze 14.10.2026): EIN Layer „Leerstand (Zensus 2022)“ mit der normalen Leerstandsquote; die marktaktive Leerstandsquote (Destatis: leer und innerhalb von drei Monaten wieder verfügbar) entfällt, weil der Begriff Nutzern nichts sagt.
  evidence: Destatis-Datensatzbeschreibung `Marktaktive_Leerstandsquote_in_Gitterzellen.zip`; Matze: „marktaktive Leerstandsquote wtf?“.
  resolved: überholt durch die Entscheidung Matze 14.10.2026 (Leerstand gesamt nicht umsetzen, Eintrag weiter unten).

- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: ENTSCHIEDEN 14.10.2026, nicht umsetzen: Zensus-Folge-Story Leerstand. Datenqualität auf Planungsraum-Ebene zu schwach.
  evidence: Leerstandsquote-Gitter Berlin-BBox: 51.435 von 57.698 Zellen „–“ (= 0), von ~6.300 Zellen mit Wert 5.690 KLAMMERN; gewichtet (Wohnungen aus Wohnungen_nach_Zahl_der_Raeume) 1,55 % gegen amtlich 1,97 % (Abgeordnetenhaus S19/20607). Unterschiede zwischen PLR wären überwiegend Rauschen.
  resolved: entschieden, nicht umsetzen (Matze 14.10.2026)

- source_spec: `docs/process/implementation-artifacts/spec-zensus-bestandsmiete-kiez.md`
  summary: ENTSCHIEDEN 14.10.2026, nicht umsetzen: Zensus-Folge-Story Heizungsart/Energieträger.
  evidence: Heizart folgt in Berlin weitgehend dem Baujahr (redundant zum Altbau-Anteil); Wärmepumpen-/Solaranteil 2022 vermutlich klein (ungeprüft, Rausch-Risiko wie Leerstand); Stand Mai 2022 seit GEG schnell veraltet; Nutzen eher wohnungs- als kiezbezogen. Falls später: als Brücke zur kommunalen Wärmeplanung neu bewerten.
  resolved: entschieden, nicht umsetzen (Matze 14.10.2026)

- source_spec: `docs/process/implementation-artifacts/spec-l1-explore-ortsfokus.md`
  summary: Fokus-Kontur `region-focus-line` und ihre Lage über Choroplethen sind nur im Helper-Unit-Test und per Screenshot geprüft, nicht auf der Seite.
  evidence: Kein E2E-Zugriff auf MapLibre-Layer im Repo (kein Map-Handle auf window); Entfernen von `showRegionFocusOutline` oder `moveLayer(REGION_FOCUS_LINE_ID)` ließe alle Tests grün.

- source_spec: `docs/process/implementation-artifacts/spec-l1-explore-ortsfokus.md`
  summary: In L2 testen, dass eine frühere Adressauswahl den Fokus nach In-App-Navigation auf `/explore?kiez=` nicht verdrängt (`suppressedSelectionId` im Fokus-Zweig).
  evidence: Alle L1-E2E starten mit frischem `page.goto`; erst der Karten-Button aus L2 erzeugt die clientseitige Navigation mit erhaltener Auswahl.

- source_spec: `docs/process/implementation-artifacts/spec-l1-explore-ortsfokus.md`
  summary: Prüfen, ob ein entprellter `syncViewport`/`syncLayers` nach `dropRegionFocusParams` den `kiez`-Parameter aus einem alten href zurückschreibt (unverifiziert, wäre medium).
  evidence: Beide lesen `window.location.href` erst beim Ausführen; offen ist, ob SvelteKits `goto(replaceState)` die URL bis dahin ersetzt hat. Klären per E2E: Fokus schließen und sofort danach die Karte verschieben, dann URL prüfen.

- source_spec: `docs/process/implementation-artifacts/spec-l3-title-meta-fakten.md`
  summary: E2E für Score- und Rang-Satz in Kiez-/Bezirks-Meta-Descriptions braucht einen DB-gestützten Build (heute nur Unit-Tests).
  evidence: Playwright baut ohne `DATABASE_URL`; `tryLoadKiezScore`/`tryLoadBezirkRank` liefern dann null, der Satz entfällt. Ein Wiring-Fehler (Score oder Quartil nicht durchgereicht) bliebe in E2E unsichtbar.

- source_spec: `docs/process/implementation-artifacts/spec-l5-bezirksseite-karte-liste.md`
  summary: Pixel-Logo wird zweimal inline als SVG ausgeliefert (je ~39,5 KB, zusammen ~79 KB pro Seite); Bezirksseiten bleiben dadurch über 200 KB HTML.
  evidence: Messung L5 (14.10.2026): Treptow-Köpenick 206 KB HTML, davon Bezirkskarte nur ~22 KB. Logo als externe, gecachte SVG-Datei oder vereinfachtes Raster würde jede Seite um ~75 KB entlasten; relevant für mobilen Absprung.
  resolved: Logo-Gewicht-Story (15.10.2026); Messung Release-Preview: Logo einmal je Seite, ~13 KB, Bezirk Pankow 130 KB HTML (32 KB gzip). /explore zeigt es bewusst zweimal (Header + Karten-Ladeanimation).

- source_spec: `docs/process/implementation-artifacts/spec-l7-layer-seiten.md`
  summary: Ältere E2E-Suiten (share-sheet, inspector-panel, tab-order, wahl-flow, address-search, compare-flow, bookmark-flow, climate-*, u. a.) scheitern, weil `getByRole('combobox')` auf `/explore` nicht klickbar wird; 76 Fehlschläge im vollen Lauf.
  evidence: Gegenprobe 14.10.2026 auf `main` (69d8588): dieselben Suiten 26 failed / 5 passed mit demselben Fehlerbild, also vor dem Landing-Epic entstanden. Die Epic-Suiten (explore-region-focus, profile-meta-fakten, bezirk-landing, kiez-landing, key-figures, kiez-neighbors, layer-kiez-ranking, i18n-profile-frame, i18n-d1) sind grün.

- source_spec: `docs/process/implementation-artifacts/spec-logo-gewicht.md`
  summary: Reduced-Motion für das Pixel-Logo (Loop-Zellen und Farbwechsel) per E2E mit `reducedMotion: 'reduce'` absichern.
  evidence: Selektoren wechselten von `rect` auf `use`; weder vorher noch nachher prüft ein Test, dass Animation und Farbwechsel unter Reduced Motion stoppen.

- source_spec: `docs/process/implementation-artifacts/spec-logo-gewicht.md`
  summary: `tests/e2e/a11y.e2e.ts` („Wortmarke-Showcase“) öffnet `/_dev/wortmarke`, die Route ist nicht im Repo.
  evidence: Der Test prüft vermutlich eine 404-Seite mit axe und sagt nichts über die Wortmarke aus; entweder Route anlegen oder Test entfernen.
  resolved: Release-Aufräumen 15.10.2026, Test entfernt

- source_spec: `docs/process/implementation-artifacts/spec-s3-jsonld-entitaeten.md`
  summary: DataCatalog auf `/berlin-wahlen` übergibt kein `inLanguage` und meldet auf `/en/berlin-wahlen` `de-DE`.
  evidence: Fund aus der S3-Umsetzung (15.10.2026); Builder-Aufruf `berlin-wahlen/+page.svelte:205` ohne Locale.
  resolved: Release-Aufräumen 15.10.2026, `inLanguage` aus Seiten-Locale, E2E-Test ergänzt

- source_spec: `docs/process/implementation-artifacts/spec-s5-sitemap-build-haerte.md`
  summary: Layer-`lastmod` nimmt `sourceUpdatedAt` vor `fetchedAt`. 15 Layer tragen Jahres-Platzhalter (`YYYY-01-01`), zwei am 14.10.2026 neu geholte Layer melden 2022-05-15. Entscheidung für Matze: Platzhalter verwerfen oder das spätere der beiden Daten nehmen.
  evidence: Edge-Case-Review S5 (15.10.2026), `static/layers/MANIFEST.json`; Spec-Entscheidung „Layer: sourceUpdatedAt, sonst fetchedAt“ bewusst nicht eigenmächtig geändert.
  resolved: S8 (15.10.2026), fetchedAt ersetzt sourceUpdatedAt nur bei fehlendem, ungültigem oder Jahres-Platzhalter-Wert (YYYY-01-01); Zukunftsdaten entfallen

- source_spec: `docs/process/implementation-artifacts/spec-s5-sitemap-build-haerte.md`
  summary: Sitemap-Prerender lädt die Datenquellen viermal (Index lädt DE und EN zusätzlich zu den Teil-Sitemaps); Kiez- und Bezirks-Source bauen die `lastmod`-Schleife doppelt.
  evidence: Blind- und Edge-Review S5; Build-Zeit unkritisch, Memoisierung oder gemeinsamer Helfer bei nächster Änderung.

- source_spec: `docs/process/implementation-artifacts/spec-s7-uebersichtsseiten.md`
  summary: `tests/e2e/a11y.e2e.ts` „Escape löscht Selection“ scheitert reproduzierbar mit Timeout auf `[role="application"]` (Karte auf `/?address=…`); „SkipLink springt zu main“ flaky.
  evidence: S7-Läufe 15.10.2026; S7 ändert weder Karte noch Startseite noch `/explore`. Vorher-Vergleich auf `main` steht aus, vermutlich gleiche Ursache wie die bekannten combobox-Fehler auf `/explore`.

- source_spec: `docs/process/implementation-artifacts/spec-s8-hub-links.md`
  summary: Layer-Seite, Hitze-Dataset und WebMCP `get-layer-metadata` nutzen für Stand/`dateModified` weiter `sourceUpdatedAt ?? fetchedAt`; die Sitemap seit S8 `lastmodOfLayer` (Platzhalter `YYYY-01-01` → `fetchedAt`). Bei Platzhalter-Layern zeigen Seite und Sitemap verschiedene Daten.
  evidence: Verification-Gap-Review S8 (15.10.2026); `layer/[slug]/+page.svelte:133,254`, `hitze/+page.server.ts:30`, `get-layer-metadata.ts:54`.

- source_spec: `docs/process/implementation-artifacts/spec-repo-public-cleanup.md`
  summary: Layer-Anzahl ist inkonsistent: `llms-builder.ts` und `site-intro-renderer.ts` sagen "rund 39 Layer", `home-data-sources.ts` nennt 44, `static/layers/MANIFEST.json` zählt 73 Einträge (README nennt 73).
  evidence: Review-Fund beim Aufräumen (15.10.2026); gemeint ist je eine andere Zählweise (Karte, Quellen, Manifest). Eine Zahl festlegen und aus dem Manifest ableiten statt von Hand pflegen.

- source_spec: `docs/process/implementation-artifacts/spec-gh-58-59-kaelte-grundgeruest.md`
  summary: KARUNA-Hotline zeigt an gesetzlichen Feiertagen in Berlin „Jetzt erreichbar“, obwohl sie dann vermutlich geschlossen ist.
  evidence: `serviceStatus` prüft nur ISO-Wochentage; ein Fix braucht eine Feiertagsberechnung inkl. Oster-abhängiger Tage.

- source_spec: `docs/process/implementation-artifacts/spec-gh-58-59-kaelte-grundgeruest.md`
  summary: CI führt das vitest-client-Projekt und Playwright-E2E nicht aus, Regressionen im Notfall-Block bleiben in der PR grün.
  evidence: `.github/workflows/ci.yml` läuft nur `vitest --project server`; gilt auch für /hitze, gehört zum Backlog CI-Tests (#55).

- source_spec: `docs/process/implementation-artifacts/spec-gh-58-59-kaelte-grundgeruest.md`
  summary: `kaelte.navigator.berlin/en` (und `hitze.navigator.berlin/en`) zeigt die EN-Startseite statt der Saisonseite.
  evidence: `kaelteReroute` und `hitzeReroute` greifen nur bei pathname `/`.

- source_spec: `docs/process/implementation-artifacts/spec-gh-58-59-kaelte-grundgeruest.md`
  summary: Zweitquelle der KARUNA-Nummer (Pressemitteilung Bezirksamt Charlottenburg-Wilmersdorf) steht ohne URL und Datum in `hilfe-dienste.ts`.
  evidence: Die Quelle hat kein `url`-Feld; bei der Kältebus-Prüfung (planning#9) mit nachtragen.

- source_spec: `docs/process/implementation-artifacts/spec-gh-60-kaelte-dwd-warnungen.md`
  summary: Die 30-Sekunden-TTL des Negativ-Caches für DWD-Warnungen (Hitze und Kälte) ist ungetestet.
  evidence: Tests prüfen nur, dass der zweite Aufruf nicht fetcht; ohne `{ ttl: ERROR_TTL_MS }` bliebe alles grün. Braucht eine steuerbare Uhr für lru-cache.

- source_spec: `docs/process/implementation-artifacts/spec-gh-61-kaelte-warme-orte-daten.md`
  summary: Grobe Kategorie-Sammlung in `extract-waerme-orte.py` und `categoryOf` in `filter.ts` können auseinanderlaufen; kein Test prüft, dass der Snapshot eine Obermenge ist.
  evidence: Review-Fund 16.10.2026; greift erst bei Snapshot-Regen mit neuer Kategorie.

- source_spec: `docs/process/implementation-artifacts/spec-gh-61-kaelte-warme-orte-daten.md`
  summary: 59 Wärme-Orte mit `NACHLAUF:` können nicht per `batches` erneut recherchiert werden; ein Flag für offene NACHLAUF-Einträge fehlt.
  evidence: `buildResearchBatches` überspringt alle IDs mit Enrichment; Methodik verspricht „können nachrücken“.

- source_spec: `docs/process/implementation-artifacts/spec-gh-61-kaelte-warme-orte-daten.md`
  summary: Ungeschlossene Ways und Nicht-Multipolygon-Relationen mit Kategorie-Tags fallen im Extrakt still weg und fehlen im Zähler `ohne_mittelpunkt`.
  evidence: pyosmium-Area-Handler liefert für sie keine Fläche; Einzelfälle, Ausmaß ungeprüft.

- source_spec: none
  summary: Launch von /kaelte (#63): noindex entfernen, Sitemap, llms.txt, Footer- und Startseiten-Link, Updates-Eintrag DE/EN.
  evidence: Beim Start von #63 als eigenständig auslieferbares Ziel abgetrennt (16.10.2026); zuerst Explorer-Layer in #71.

- source_spec: `docs/process/implementation-artifacts/spec-gh-71-warme-orte-explorer.md`
  summary: POI-Popups im Explorer (warme Orte, kühle Orte, Trinkbrunnen) zeigen auf /en deutsche Texte; `getPopoverSummary` kennt keine Locale.
  evidence: Review-Fund 16.10.2026; betrifft alle POI-Builder in `poi-summary-builder.ts`.

- source_spec: `docs/process/implementation-artifacts/spec-gh-71-warme-orte-explorer.md`
  summary: Zahlen in der Wärme-Orte-Methodik (677/230/227/212/97) stehen hart in `layer-methodology.ts` und Messages und driften beim nächsten Datenlauf.
  evidence: Kein Test gleicht sie mit GeoJSON oder MANIFEST ab; aus Daten ableiten.

- source_spec: `docs/process/implementation-artifacts/spec-gh-73-kaelte-explorer-modus.md`
  summary: Link „Alle Layer und Daten im vollen navigator.berlin“ (Hitze und Kälte) führt auf `/explore` ohne `mode=default` und ohne Adresse; auf hitze./kaelte.navigator.berlin bleibt der reduzierte Modus aktiv.
  evidence: Review-Fund 17.10.2026; `resolveAppMode` fällt ohne Override auf den Host zurück. Für beide Modi gemeinsam fixen.

- source_spec: `docs/process/implementation-artifacts/spec-gh-73-kaelte-explorer-modus.md`
  summary: Kälte-Host `kaelte.navigator.berlin/explore` ohne Inspector-Test; Sektions-Zähler zählt im reduzierten Modus versteckte Treffer; Warme-Orte-Karte ohne Retry-Button und sichtbaren Zähler.
  evidence: Review-Funde 17.10.2026; Zähler und fehlender Retry entsprechen dem bestehenden Hitze-Muster.

- source_spec: `docs/process/implementation-artifacts/spec-gh-63-kaelte-launch.md`
  summary: E2E „Root (Karte) hat 0 axe-Violations“ ist flaky: axe misst Kontrast im Inspector während der Einblend-Animation (Farben #b8b7b0/#c0beb7 auf #f5f3ea).
  evidence: 17.10.2026 mehrfach rot/grün ohne Codeänderung; Fix: auf Ende der Animation warten oder `prefers-reduced-motion` im Test setzen.
- source_spec: `docs/process/implementation-artifacts/spec-gh-86-redesign-fundament.md`
  summary: Ring-Legende im Kiez-Score ordnet Dimensionen nur über die Reihenfolge den Ringen zu; #88 (Inspector nach Mockup) soll die Zuordnung sichtbar machen.
  evidence: Ringfarbe zeigt die Stufe, nicht die Dimension; mehrere Ringe können gleich gefärbt sein (Codex-Review GH-86).
- source_spec: `docs/process/implementation-artifacts/spec-gh-86-redesign-fundament.md`
  summary: Sankey-Labels im Wahlportal skalieren im responsiven SVG auf Mobil auf rund 4,8 px; Labels gehören aus dem skalierten SVG heraus (#90).
  evidence: codex-review GH-86 (gpt-6.1-sol), Messung bei 390 px Viewport; bestand vor dem Diff.
- source_spec: `docs/process/implementation-artifacts/spec-gh-103-bezirk-karte-a11y.md`
  summary: `winner-map.svelte.test.ts` „Adress-Auswahl: Punkt im Gebiet …“ ist instabil und findet `winner-map-address-hint` zeitweise nicht.
  evidence: Am 17.10.2026 in einem vollen `pnpm test:unit --run` und in 2 von 3 Einzelläufen rot, im dritten grün; die Datei importiert nichts aus dieser Änderung.
- source_spec: `docs/process/implementation-artifacts/spec-gh-104-quellen-komma.md`
  summary: Der Hinweis „öffnet neuen Tab“ an Kältehilfe-Quellen liegt neben dem Link statt darin und fehlt im Accessible Name.
  evidence: `quellen-zeile.svelte` (vorher `notfall-block.svelte`) setzt das `sr-only`-Span nach `</a>`; in Link-Listen von Screenreadern fehlt der Hinweis.

- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: Startseiten-Klicks (task_link, search_example) je Aufgabe/Link unterscheidbar machen und per Komponententest absichern.
  evidence: Alle 11 Aufgaben-Links senden dieselbe Aktion; Tests prüfen nur `trackLanding` direkt.
- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: Startseiten-Aufgabe „Gegend prüfen“ mit ausgeschaltetem kiezFinder-Flag testen.
  evidence: Unit- und E2E-Test prüfen nur Flag an.
- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: AddressSearch fängt Geocoder-Fehler nicht ab (Header und Startseite).
  evidence: maybe-false; `address-search.svelte` nutzt try/finally ohne catch. Klären mit einem Test, der geocode rejecten lässt und auf unhandled rejection prüft.
- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: Screenshots `static/berlin-navigator-multilayer.webp` und `-kiez-finder.webp` nach Startseiten-Umbau prüfen und ggf. mit README-Verweisen entfernen.
  evidence: Kein Code nutzt sie mehr, README referenziert sie noch.
- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: E2E-Test für die Startseiten-Suche mit echtem Geocoder/goto (DE und /en), sobald der Combobox-Hydration-Bug gelöst ist.
  evidence: maybe-false; Unit-Test injiziert geocode/navigate. `tests/e2e/i18n-inspector.e2e.ts` dokumentiert „element was detached“ bei fill().
- source_spec: `docs/process/implementation-artifacts/spec-gh-169-startseite-neu.md`
  summary: `home_page_og_alt` nutzt „·“ und den alten Slogan „Berlin in Daten“.
  evidence: Vorbestehender String, verstößt gegen die „·“-Regel in CLAUDE.md.
- source_spec: `docs/process/implementation-artifacts/spec-gh-170-startseite-vorschauen.md`
  summary: Inspector-Score-Ring auf /en zeigt deutsche Dimensionsnamen („Ruhe & Luft“, „Wohnschutz“) und „Gesamt“.
  evidence: Sichtbar in `static/home/en/kiez-score.webp` (Aufnahme 31.10.); Liste darunter ist korrekt englisch.
  resolved: 31.10.2026, Inspector-Section reicht übersetzte Labels an den Ring durch; EN-Vorschauen neu aufgenommen.
- source_spec: `docs/process/implementation-artifacts/spec-gh-171-startseite-kachel-raster.md`
  summary: Kein Komponententest prüft, dass Task- und Bezirk-Links `trackLanding('task_link','home')` auslösen.
  evidence: Grep über alle Tests findet `trackLanding` nur in `plausible.test.ts`; Fix: Modul in `home-tasks.svelte.test.ts` mocken.
- source_spec: `docs/process/implementation-artifacts/spec-gh-160-stories-handschrift.md`
  summary: Gelb #efbd2c, Gold #b88a2e und Tönung #d4c39e liegen unter 3:1 auf Papier (WCAG 1.4.11); #163 entscheidet über Tinten-Kontur oder Ähnliches.
  evidence: Kontrast gerechnet im Review gh-160 (1,41 / 2,52 / 1,40 zu 1); steht in `docs/DESIGN.md` unter „Offen“.
- source_spec: `docs/process/implementation-artifacts/spec-gh-162-stories-route.md`
  summary: Stories-Seiten nutzen das Startseiten-OG-Bild, der Alt-Text beschreibt etwas anderes.
  evidence: `/og/page/home.png` in Übersicht und Beitrag; eigenes Bild gehört zu #165.
- source_spec: `docs/process/implementation-artifacts/spec-gh-161-stories-kennzahlen.md`
  summary: `haltestelle400mAnteil` (400 m, alle Verkehrsmittel) trennt die Kieze kaum; 53 von 143 liegen bei 99 % oder mehr. Für #163 prüfen, ob ein Wert nur für Schiene sinnvoller ist.
  evidence: Review gh-161, ausgezählt in `static/data/stories-kennzahlen.json`.
- source_spec: `docs/process/implementation-artifacts/spec-gh-161-stories-kennzahlen.md`
  summary: `gruen` ist flächengewichtet wie in den Skizzen; einwohnergewichtet wäre näher an der Bedeutung „Grünversorgung pro Einwohner“. Frage an Matze.
  evidence: Review gh-161; große, dünn besiedelte Planungsräume dominieren sonst den Kiezwert.
