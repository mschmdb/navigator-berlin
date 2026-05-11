# navigator.berlin: Project-Level Claude Instructions

Diese Datei ergänzt `~/.claude/CLAUDE.md` mit projekt-spezifischen Hard-Rules. Wird in jeder Claude-Session für dieses Projekt automatisch geladen.

## TDD-Mandat (Pragmatic TDD)

**Alle Implementierungs-Stories ab Story 1.2 folgen Pragmatic TDD.** Quelle: ADR-012 (`docs/adr/ADR-012-tdd-mandate.md`).

### Scope: wo Test-First gilt

- Business-Logic-Module (Daten-Transform, Geocoding-Wrapper, Layer-Hit-Berechnung, URL-State-Sync, Cache-Logic)
- Svelte-Komponenten mit Logik (State-Management, Event-Handling, Conditional-Rendering)
- API-Boundaries (Remote-Functions, Server-Endpoints, WebMCP-Tools, Schema-Validation)
- Daten-Pipeline-Scripts (Build-Time-Transforms, Manifest-Generierung)

### Scope: wo Test-First NICHT gilt

- Setup/Config-Tasks (sv-add, package.json-Scripts, .editorconfig, .nvmrc, gitignore)
- Pure-CSS/Styling ohne Logik (Tailwind-Klassen, Design-Tokens, Layout-Tweaks)
- Statische Content-Files (ADR-Stubs, README-Sections, JSON-Translation-Files)
- Migrationen, Lockfile-Reproduktion, Infra-YAML (Coolify, Docker, GH-Actions-Workflows)

### Workflow pro Story

1. **AC-zu-Tests-Mapping:** Vor erster Implementation: pro Acceptance Criterion mind. 1 Test-Case identifizieren.
2. **Red:** Failing-Test schreiben. Verify dass er failt (`pnpm test:unit` oder `pnpm test:e2e`).
3. **Green:** Minimale Implementation um Test grün zu machen. Keine Extra-Features.
4. **Refactor:** Code-Struktur verbessern, Tests bleiben grün.
5. **Iterate:** Nächster AC, nächster Test-Cycle.

### Hand-off-Gates

Vor Story-Status `review`:
- Pro AC mind. 1 Test-File mit failing-then-passing History (im Commit nachvollziehbar)
- `pnpm test` 100% green (unit + e2e wo definiert)
- Coverage-Ziele (Story-Phase-2+): Daten-Transform ≥80%, kritische Pfade ≥90%, UI-Smoke E2E für Top-3-Journeys
- Dev Agent Record dokumentiert Test-Strategie + Coverage-Stand

### Exceptions

Setup-Stories (1.1, evtl. 4.1, 4.3) sind smoke-level. Tests existieren + lauffähig reicht. Wenn unsicher: im Dev-Story-Workflow vor Implementation fragen.

## Output-Konventionen

- **Keine em-dashes** (U+2014) in UI-Strings, Docs, Code-Comments oder Commit-Messages. Ersetze durch Komma, Doppelpunkt, neuer Satz, oder Mittelpunkt (`·`). Auch en-dash (U+2013) eher vermeiden, außer in Zahlen-Ranges.

## Sonstige Projekt-Regeln

Siehe auch:
- `~/.claude/CLAUDE.md` (User-globale Regeln: @lucide/svelte, Files <500, kein `any`, kein Hardcoded Data ohne Rückfrage)
- `docs/adr/` (Architectural Decision Records)
- `_bmad-output/planning-artifacts/architecture.md` (21 MUST-Rules: Enforcement Guidelines)
