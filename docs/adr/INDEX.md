---
type: adr
audience: both
last-verified: 2026-05-17
related:
  - docs/INDEX.md
---

# ADR-Index

Architectural-Decision-Records für navigator.berlin. Format folgt [ADR-000-template.md](./ADR-000-template.md).

| # | Titel | Status | Datum | Superseded-By |
|---|---|---|---|---|
| [001](./ADR-001-tile-provider.md) | Tile-Provider (MapLibre + OpenFreeMap) | accepted | 2025-12 | — |
| [002](./ADR-002-webmcp.md) | WebMCP-Integration (mcp-b als Polyfill) | accepted | 2026-01 | — |
| [003](./ADR-003-postgres-deferral.md) | Postgres erst ab Story 2.0 (Phase-1-Foundation) | accepted | 2026-02 | — |
| [004](./ADR-004-cookieless.md) | Cookieless by Design | accepted | 2026-02 | — |
| [005](./ADR-005-i18n-paraglide.md) | Paraglide-JS für i18n | accepted | 2026-03 | (DE-only-Reduce per `project_i18n_phase_1_de_only`) |
| [006](./ADR-006-tailwind-v4.md) | Tailwind v4 + Token-System | accepted | 2026-03 | — |
| [007](./ADR-007-bits-ui.md) | Bits-UI als Headless-Component-Library | accepted | 2026-03 | — |
| [008](./ADR-008-context-api-state.md) | Context-API für UI-State (statt Stores) | accepted | 2026-04 | — |
| [009](./ADR-009-remote-functions.md) | SvelteKit Remote-Functions für Server-Calls | accepted | 2026-04 | — |
| [010](./ADR-010-experimental-async.md) | Experimental-Async-Routing | accepted | 2026-04 | — |
| [011](./ADR-011-on-demand-layer-loading.md) | On-Demand-Layer-Loading | accepted | 2026-05 | — |
| [012](./ADR-012-tdd-mandate.md) | Pragmatic-TDD-Mandat ab Story 1.2 | accepted | 2026-05 | — |
| [013](./ADR-013-score-aggregation-strategy.md) | Score-Aggregation-Strategie (5 Dim, flächen-gewichtet) | accepted | 2026-05 | — |
| [014](./ADR-014-multi-level-inspector-aggregat-strategie.md) | Multi-Level-Inspector: Aggregat-Strategie + Visual-Typ + Compare pro Layer | proposed | 2026-05 | Epic 8 |
| [015](./ADR-015-score-composition-umwelt-infra.md) | Score-Komposition als Umwelt- & Infrastruktur-Score (Anti-Stigma) | accepted | 2026-05 | Epic 9 |
| [016](./ADR-016-llm-authoring-eu-foss-exception.md) | LLM-Profile zur Authoring-Zeit (EU-FOSS-Ausnahme) | accepted | 2026-06 | Epic 11 |
| [017](./ADR-017-versorgung-nahversorgung.md) | Versorgung um private Nahversorgung erweitern (öffentlich + privat) | accepted | 2026-06 | Epic 12 |

## Geplant / Pending

- ADR-015 i18n-Scope-Reduce (DE-only Phase 1), Memory `project_i18n_phase_1_de_only` als Stub
- ADR-015 Hetzner-CPX22-statt-CX32 (Performance-Recherche 2026-05-17) — Memory `project_server_purchase_sequencing` als Stub
- ADR-016 (vorgemerkt) — Plausible-Self-Host statt SaaS

## ADR-Workflow

1. Neues ADR-File: `ADR-NNN-kurz-titel.md` mit `cp ADR-000-template.md ADR-NNN-...md`
2. Frontmatter ausfüllen: status, decision-date
3. Sections: Context, Decision, Consequences, Alternatives-Considered
4. Diese Index-Tabelle ergänzen
5. Bei Supersede: Status auf `superseded` setzen, `Superseded-By`-Spalte verlinken
