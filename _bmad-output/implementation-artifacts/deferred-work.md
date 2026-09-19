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
