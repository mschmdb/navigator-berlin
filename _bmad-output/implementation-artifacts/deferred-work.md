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
