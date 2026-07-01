# Story 11.9: Begriffs-Disclaimer + Bezirks-Komponenten-Audit + llms_content-Klärung

Status: review

> **Anker:** Schließt die offenen Punkte der Analyse. Begleitend zu Epic 11. Liefert das Bezirks-Audit, auf das 11.4/11.5 verweisen.
>
> **Abhängigkeiten:** Keine harte. Audit-Teil (AC-2) sollte früh laufen, weil 11.3-11.5 „gilt für Bezirk wie Kiez" voraussetzen.

## Story

As a User,
I want verstehen dass „Kiez" hier die amtliche LOR-Bezirksregion meint,
so that die Datenbasis transparent ist; und der Maintainer schließt offene Audit-Punkte.

## Acceptance Criteria

1. **AC-1 (Begriffs-Disclaimer):**
   **Given** der Konflikt „Kiez (bewohnerdefiniert) ≠ LOR-Bezirksregion"
   **When** die Methodik-Seite die Gleichsetzung erklärt
   **Then** verlinken Kiez-Detailseiten den Disclaimer; der Text macht transparent, dass „Kiez" hier die amtliche LOR-BZR 2021 meint

2. **AC-2 (Bezirks-Komponenten-Audit):**
   **Given** die offenen Audit-Punkte
   **When** `bezirk/[slug]/+page.svelte` + `+page.server.ts` gegen die Kiez-Variante geprüft werden
   **Then** sind Abweichungen dokumentiert; es ist bestätigt/hergestellt, dass die Stufe-1-Änderungen (11.3, 11.4, 11.5) für Bezirk wie Kiez gelten

3. **AC-3 (llms_content-Klärung):**
   **Given** `src/lib/server/db/schema/llms-content.ts` + `src/lib/server/llms/{kiez,bezirk}-renderer.ts`
   **When** die Rolle im Kiez/Bezirk-Kontext geklärt wird
   **Then** ist entschieden + dokumentiert, ob die neuen FAQ (11.3) und Profile (11.6) in `llms.txt`/`llms-full.txt` einfließen; falls ja, sind die Renderer entsprechend erweitert

## Tasks / Subtasks

- [x] **Task 1: Disclaimer** (AC: #1)
  - [x] 1.1 Methodik-Seite (`src/routes/(with-header)/methodik/`) um Kiez=LOR-BZR-Erklärung erweitern
  - [x] 1.2 Kiez-Detailseite verlinkt den Disclaimer (dezent, z.B. unter dem Steckbrief)
- [x] **Task 2: Bezirks-Audit** (AC: #2)
  - [x] 2.1 `bezirk/[slug]/+page.svelte` + `+page.server.ts` lesen, gegen Kiez-Variante diffen, Abweichungen notieren
  - [x] 2.2 Sicherstellen, dass 11.3-11.5 auf beiden Seiten greifen (gemeinsame Komponenten/Helper bevorzugen)
- [x] **Task 3: llms_content-Entscheidung** (AC: #3)
  - [x] 3.1 `llms-builder.ts` + `kiez-renderer.ts`/`bezirk-renderer.ts` prüfen: fließen FAQ/Profile schon ein?
  - [x] 3.2 Entscheidung dokumentieren; bei Ja: Renderer um FAQ/Profile erweitern, `llms-sitemap-consistency.test.ts` grün halten

## Dev Notes

### Ist-Zustand

- `src/lib/server/llms/kiez-renderer.ts` + `bezirk-renderer.ts` + `data-collector.ts` bauen den llms.txt-Inhalt; `src/lib/seo/llms-builder.ts` aggregiert. Routes `src/routes/llms.txt` + `llms-full.txt`.
- `bezirk/[slug]` spiegelt laut bisheriger Recherche die Kiez-Struktur (gleiche Schema-Tabellen `bezirk_stats`/`bezirk_score`, gleiche JSON-LD-Builder), aber das Detail-Audit steht aus → diese Story bestätigt es.
- Begriff „Kiez": laut berlin.de bewohnerdefiniert, nicht deckungsgleich mit LOR-BZR. Die Seiten nennen LOR-BZR „Kiez".

### Architektur-Compliance

- Disclaimer ist Content/Markup (TDD-ausgenommen), llms-Renderer-Änderung ist Logik (Test wo nötig, `llms-sitemap-consistency.test.ts` darf nicht brechen).

### Was nicht brechen darf

- `llms.txt`/`llms-full.txt` bleiben konsistent zur Sitemap (`llms-sitemap-consistency.test.ts`).
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 7.6:** llms-Konsum-Optimierung — Renderer-Struktur + Sitemap-Konsistenz-Test.
- **Story 9.6:** Build-only-Gating-Muster (Layer aus Frontend nehmen ohne DB-Cut) als Vorbild für saubere Sichtbarkeits-Entscheidungen.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.9]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Abschnitt 7 (offene Punkte) + Begriffs-Risiko]
- [Source: src/lib/server/llms/kiez-renderer.ts] (+ bezirk-renderer.ts, data-collector.ts)
- [Source: src/lib/seo/llms-builder.ts]
- [Source: src/routes/(with-header)/bezirk/[slug]/+page.svelte] (Audit-Ziel)
- [Source: src/routes/(with-header)/methodik/] (Disclaimer-Ort)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
