# Story 14.7: Epic-14-Dokumentation + Updates-Eintrag

Status: review

> **Anker:** Epic-7-Doku-Muster, ADR-019. Analog Story 13.7.
> **Hard-Block:** nach 14.0–14.6.

## Story

As a Solo-Maintainer,
I want Epic 14 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag,
so that kein Wissens-Drift entsteht und Nutzer die Dimension richtig (als Kontext, nicht als Sicherheits-Urteil) einordnen.

## Kontext: Warum dieser Change

Abschluss-Story: generierte Doku-Artefakte (Pipeline-Atlas, Story-Map) neu, INDEX-Verweise, Konsistenz-Sweep, plus ein `/updates`-Eintrag in Nutzersprache mit klaren Grenzen.

## Acceptance Criteria

1. **AC-1 (Generierte Doku):**
   **Given** die neue Dimension + den Kriminalitätsatlas-Layer
   **When** `pnpm doc:pipelines` + `pnpm doc:story-map` laufen
   **Then** erscheinen der Atlas-Layer + die Dimension im Pipeline-Atlas, `docs/INDEX.md` + System-Map verweisen darauf, Frontmatter gesetzt

2. **AC-2 (Konsistenz-Sweep):**
   **Given** Doku-Konsistenz
   **When** geprüft wird
   **Then** sind `docs/scoring-methodology.md`, ADR-019, `docs/kriminalitaetsdaten-methodik.md` verlinkt + stimmig, Stigma-Framing + Caveats durchgängig, keine „Sicherheits-Score"-Stelle

3. **AC-3 (Updates-Eintrag):**
   **Given** die `/updates`-Route
   **When** ein redaktioneller Changelog-Eintrag geschrieben wird
   **Then** existiert `_content/updates/2026-MM-DD-kriminalitaet-kontext.md` (category `feature`), erklärt die Dimension in Nutzersprache + Grenzen (HZ ≠ Gefährlichkeit, Touristen/Pendler-Verzerrung, **nicht im Gesamt-Score**, BR-Granularität), verlinkt `/methodik/kiez-score`, hält die Forbidden-Token-Konvention (keine em-dashes, **kein „gefährlich"/„sicher" als Wertung**, kein „lebenswert")

4. **AC-4 (Feeds):**
   **Given** der Eintrag
   **When** `/updates` + Feeds (RSS/Atom/JSON) prerendern
   **Then** erscheint er chronologisch, Feed-Tests grün, kein Build-Fehler durch Frontmatter

## Tasks / Subtasks

- [x] **Task 1: Generatoren** (AC: #1)
  - [x] 1.1 `pnpm doc:pipelines` + `doc:story-map` neu (story-map listet 14er-Stories); `docs/INDEX.md` auf 7 Dimensionen gezogen + `kriminalitaetsdaten-methodik.md` verlinkt. (data-flow.md = sources.ts-basiert, Build-Aggregat kriminalitaet wie laerm-db nicht enthalten — Generator-Scope, dokumentiert)
- [x] **Task 2: Konsistenz-Sweep** (AC: #2)
  - [x] 2.1 scoring-methodology ↔ ADR-019 ↔ kriminalitaetsdaten-methodik verlinkt + stimmig. „Sicherheits-Score"-Sweep: nur Negationen/Caveats (ADR-Verworfen, „kein Sicherheits-Score"), kein Missbrauch
- [x] **Task 3: Updates-Eintrag** (AC: #3, #4)
  - [x] 3.1 `_content/updates/2026-06-10-kriminalitaet-kontext.md` (category feature): Grenzen (HZ ≠ Risiko, Touristen/Pendler, nicht im Gesamt-Score, BR-Granularität), Link /methodik/kiez-score, kein „gefährlich/sicher"-Urteil, kein em-dash, kein „lebenswert"
  - [x] 3.2 Feeds (RSS/Atom/JSON) + Updates-Tests grün, kein Build-Fehler

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-09)

- Updates-Schema: Story 2.13 (`_content/updates/`, category, Frontmatter, RSS/Atom/JSON). Forbidden-Tokens: `src/lib/seo/banned-words.ts` + `forbidden-tokens.ts`.
- Doku-Generatoren: `pnpm doc:pipelines`, `doc:story-map`.

### Forbidden-Token-Ergänzung

Der Updates-Eintrag darf Kriminalität nur als Kontext beschreiben. „gefährlich"/„sicher" als Kiez-Wertung sind zu vermeiden (ggf. Banned-Words erweitern, koordiniert mit 14.8-Lint).

## References

- Story 2.13 (Updates-Schema), `src/lib/seo/banned-words.ts`
- `docs/scoring-methodology.md`, `docs/kriminalitaetsdaten-methodik.md`, `docs/adr/ADR-019-...md`
- `_bmad-output/implementation-artifacts/13-7-epic-13-dokumentation-updates.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-14-kriminalitaet`.

### Completion Notes List

- **Generatoren:** `doc:pipelines` (data-flow.md, Datum-Bump) + `doc:story-map` (story-map.md, 143 Stories inkl. 14er) neu. `docs/INDEX.md`: scoring-methodology-Zeile „6 → 7 Dimensionen (+ Kriminalität)", neue Zeile `kriminalitaetsdaten-methodik.md` mit ADR-019-Verweis.
- **Generator-Scope-Notiz:** `data-flow.md` wird aus `scripts/lib/sources.ts` generiert; das Kriminalitäts-Build-Aggregat (`build-kriminalitaet-lor.ts` → `kriminalitaet-lor.json`) ist wie `laerm-db` ein Standalone-Build-Step ausserhalb von sources.ts und erscheint daher nicht im Layer-Atlas. Konsistent mit dem bestehenden Muster, kein Eingriff.
- **Konsistenz-Sweep:** scoring-methodology ↔ ADR-019 ↔ kriminalitaetsdaten-methodik verlinkt. grep „Sicherheits-Score|gefährlichste|sicherster Kiez": nur explizite Negationen/Caveats (ADR-019 verwirft „Sicherheits-Score", scoring-methodology sagt „kein Sicherheits-Score", Methodik-Caveat warnt vor naivem Ranking). Keine wertende Stelle.
- **Updates-Eintrag** `2026-06-10-kriminalitaet-kontext.md` (category feature): Nutzersprache, alle Grenzen (kein persönliches Risiko, Touristen/Pendler-Verzerrung + Kappung, Hellfeld, BR statt Adresse, nicht im Gesamt-Score, kein Ranking, nicht in Profilen), Link /methodik/kiez-score. Forbidden-Token eingehalten: kein „gefährlich/sicher"-Urteil, kein em-dash, kein „lebenswert".
- **AC-4:** Feed- (RSS/Atom/JSON) + Updates-Loader/Schema/Component-Tests grün. `pnpm check` 0 Errors, Unit-Suite **2841/2841 grün**.
- **14.6 entfällt** (Owner-Decision 2026-06-10): Normalisierung + Delikt-Gewichte sind owner-bestätigt (14.1/14.5), der Spike-Zweck ist erfüllt.

### File List

**Neu:**
- `_content/updates/2026-06-10-kriminalitaet-kontext.md`

**Geändert (generiert/manuell):**
- `docs/pipelines/data-flow.md`, `docs/architecture/story-map.md` (Generatoren)
- `docs/INDEX.md` (7 Dimensionen + kriminalitaetsdaten-methodik-Verweis)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-7 → review, 14-6 → cancelled)

### Debug Log References

- Sweep „Sicherheits-Score": 3 Treffer, alle Negation/Caveat (ADR-019, scoring-methodology, kriminalitaetsdaten-methodik).

## Change Log

- 2026-06-09: Story 14.7 erstellt (ready-for-dev). Doku-Abschluss + /updates-Eintrag mit klaren Grenzen.
- 2026-06-10: Story 14.7 implementiert (→ review). Doc-Generatoren + INDEX + Konsistenz-Sweep + /updates-Eintrag. check 0, 2841 grün. 14.6 entfällt (Owner).
