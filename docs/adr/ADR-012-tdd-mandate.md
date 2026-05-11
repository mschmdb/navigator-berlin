---
status: Accepted
date: 2026-05-11
deciders: solo-maintainer
---

# ADR-012: Pragmatic TDD als Story-Default ab Story 1.2

## Context

Während der Architecture-Phase (Mai 2026) wurde Testing-Strategie nur auf Coverage-Ebene definiert (NFR-M5 ≥80% Coverage Daten-Transform, axe-core-Gate für A11y, E2E Top-3-Journeys). Die *Reihenfolge* von Test- vs. Implementation-Code wurde nicht festgelegt. Stories 1.1 bis 1.12 enthalten Test-Tasks meist erst nach Implementation-Tasks.

Solo-Maintainer-Kontext: keine Code-Review-Peers, kein QA-Team. Ohne disziplinierte Test-First-Praxis besteht Risiko, dass Tests retroaktiv geschrieben werden (Confirmation-Bias gegenüber Implementation) oder ganz entfallen, weil ACs "augenscheinlich" erfüllt sind.

Architektur-Realitäten:
- Datenpipeline mit komplexer Transform-Logik (GeoJSON nach MapLibre-Sources, Hit-Berechnung, LRU-Cache, URL-State-Codec): hohe Bug-Wahrscheinlichkeit ohne Tests-First
- Svelte 5 Runes + `experimental.async` + `<svelte:boundary>`: neuartig, Edge-Cases unklar, Tests sichern Verhalten
- 8 Sprachen mit RTL (ar): Locale-Switching-Bugs nur durch Tests reproduzierbar

Strikter Red-Green-Refactor ist auch für Config-/Setup-Tasks (sv-add, gitignore, ADR-Anlagen) unverhältnismäßig, weil es nichts zu testen gibt. Pragmatic-TDD-Variante grenzt Scope ab.

## Decision

**Ab Story 1.2: Pragmatic TDD ist verbindlicher Default für alle Implementierungs-Stories.**

Scope:

| Story-Task-Typ | TDD-Pflicht? |
|----------------|--------------|
| Business-Logic-Module (Transform, Geocoding, Layer-Hits, Cache, URL-State) | ✅ Strict Test-First |
| Svelte-Komponenten mit Logik (State, Events, Conditional-Render) | ✅ Strict Test-First |
| API-Boundaries (Remote-Functions, +server.ts, WebMCP-Tools, Valibot-Schemas) | ✅ Strict Test-First |
| Daten-Pipeline-Scripts (Build-Time-Transforms, Manifest-Generator) | ✅ Strict Test-First |
| Setup/Config (sv-add, gitignore, package.json-Scripts, .editorconfig) | ❌ Smoke-Level reicht |
| Pure-CSS/Tailwind/Design-Tokens ohne Logik | ❌ Visual-Smoke reicht |
| Statische Content-Files (ADR-Stubs, JSON-Translations, README) | ❌ Keine Tests |
| Infra-YAML (Coolify, Docker, GH-Actions) | ❌ CI-Run dient als Test |

Workflow pro AC: (1) Failing-Test schreiben, (2) verify fail, (3) minimale Implementation, (4) verify pass, (5) refactor mit Tests grün.

Hand-off-Gate (vor Story-Status `review`): pro testpflichtigem AC mindestens 1 Test-File mit failing-then-passing History (Commit-Order nachvollziehbar), `pnpm test` 100% grün.

## Consequences

- **Positive:**
  - Höhere Regression-Sicherheit für Solo-Maintainer-Setup ohne Peer-Review
  - Tests dokumentieren Intent (Living-Spec) zusätzlich zu Stories
  - Refactor-Sicherheit ab Story 1.7 (URL-State, Layer-Cache) erheblich erhöht
  - A11y- und I18n-Tests werden nicht "nachträglich" angeflickt sondern strukturell verankert
- **Negative:**
  - Mehr Aufwand pro Story (+20 bis 40% Time-Estimate für Logic-heavy Stories)
  - Test-Tooling-Lernkurve: Vitest-Browser-Mode mit Svelte 5 + `@vitest/browser-playwright` ist neu
  - Bei Setup-Stories Versuchung, TDD-Ausnahmen zu erweitern. Scope-Tabelle oben ist Hard-Boundary
- **Migration:**
  - Story 1.1 (bereits review, kein Retro-Refactor)
  - Stories 1.2 bis 1.12: Dev-Story-Workflow erzwingt TDD beim Implementieren, keine Story-Spec-Anpassung nötig
  - Project-CLAUDE.md (Repo-Root) verankert Workflow für Claude-Code-Sessions
  - Bei zukünftigen Validate-Create-Story-Runs: Tasks-Sequenz so umstellen, dass Test-Subtasks vor Implementation-Subtasks stehen
