- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: API-Routen-Tests für /api/wahl/geometry und /api/wahl/results-at-point fehlen (ADR-012 nennt Server-Endpoints als Test-first-Scope).
  evidence: Lücke bestand schon vor Story 1 (nur kiez-shares hat einen Routen-Test); Story 2 des berlin-wahlen-Epics baut neue Wahl-APIs test-first und ist der natürliche Ort, die Bestandsrouten mitzuziehen.
- source_spec: `_bmad-output/specs/spec-berlin-wahlen/stories/1-geo-mapping-auf-eine-quelle-konsolidieren.md`
  summary: Komponenten-Test für wahl-stimmbezirk-choropleth.svelte fehlt (Winner-Zuordnung, matched-Zähler); außerdem 2 pre-existing ESLint-Errors (SvelteMap, unused matched).
  evidence: Beides bestand vor Story 1; Story 4 (Winner-Map) baut die Komponente neu und deckt es dann ab.
