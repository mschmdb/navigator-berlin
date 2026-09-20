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
