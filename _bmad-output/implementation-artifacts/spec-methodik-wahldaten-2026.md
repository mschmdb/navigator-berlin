---
title: 'Methodik Wahldaten auf den Stand der Wahlen 2026 bringen'
type: 'bugfix'
created: '2026-09-28'
status: 'in-progress'
baseline_commit: '7f7e8dfbb32b162d43cb1e8657d41bbef199b5ed'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/stories/15-ingest-agh-bvv-2026.md'
  - '{project-root}/docs/wahldaten-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/methodik/wahldaten` ist seit dem Launch am 28.09. öffentlich veraltet. Hinweis von Matze am 28.09. Die Seite hat vier Probleme:
- Abschnitt 2 listet AGH und BVV ohne 2026. Er spricht von „Phase 1“ und einem „FragDenStaat-Backlog für Phase 2“.
- Abschnitt 6 nennt die Stimmbezirks-Geometrie ohne 2026 (`ah26`). Er behauptet „pre-2011 AGH/BVV ohne Geometrie“, obwohl auch 2011 keine hat.
- Abschnitt 7 erklärt die vorläufigen Ergebnisse 2026 nicht. Er verweist auf „Memory project_simplify_keep_shapes“ und listet `pnpm`-Befehle.
- Die vorläufige Kennzeichnung aus Story 15 fehlt ganz.

**Approach:** Die Seite gleichen wir an die Daten in Prod an (23 Wahlen, AGH/BVV 2026 vorläufig, Geometrie `ah26`) und an `docs/wahldaten-methodik.md`. Interne Verweise entfernen wir. Das ist eine reine Textänderung auf `main`, die später in den i18n-Branch übernommen wird.

## Boundaries & Constraints

**Always:**
- Fakten nur aus der Prod-DB bzw. aus `WAHL_TO_GEO`, Story 15 und `docs/wahldaten-methodik.md`:
  - BTW 2013, 2017, 2021, 2025
  - AGH und BVV 2011, 2016, 2021, 2023 (Wiederholung), 2026 (vorläufig)
  - Geometrie: BTW 2017/2021/2025, AGH/BVV 2016, 2021 (auch 2023), 2026
  - Ohne Geometrie: BTW 2013 und AGH/BVV 2011
- Die Kennzeichnung „vorläufig“ bekommt einen kurzen Absatz mit dem Endergebnis-Zeitraum laut Doku: BVV voraussichtlich Ende September, AGH Anfang Oktober 2026.
- Keine internen Verweise im Text (Phase, Backlog, Memory-Namen, `pnpm`-Befehle), `lint:cleartext`-Stil.
- Anker unverändert (`#cutoff`, `#geometrien`, `#update-cadence` usw.).
- Keine em-dashes, `lint:wahl` grün, TDD: Page-Test pinnt die Jahreslisten und die vorläufig-Aussage.

**Never:**
- Keine Code- oder Datenänderung, kein Umbau anderer Abschnitte.
- Keine Übersetzung (C4 auf dem i18n-Branch).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Abschnitt 2 | `/methodik/wahldaten#cutoff` | AGH und BVV mit „2026 (vorläufig)“, ohne Phase/Backlog | N/A |
| Abschnitt 6 | `#geometrien` | Geometrie inkl. 2026, „ohne Geometrie: BTW 2013, AGH/BVV 2011“ | N/A |
| Abschnitt 7 | `#update-cadence` | Absatz zu vorläufigen Ergebnissen und Endergebnis-Re-Ingest, ohne Memory-Verweis und Befehle | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/methodik/wahldaten/+page.svelte`: `:139-152` Abschnitt 2, `:222-234` Abschnitt 6 (Memory-Verweis `:233`), `:236-250` Abschnitt 7 (Befehle `:245-249`).
- Test: `src/routes/(with-header)/methodik/wahldaten/page.svelte.test.ts` (existiert seit dem Briefwahl-Fix).
- Fakten: `src/lib/data/wahl-geo-mapping.ts` (`WAHL_TO_GEO`), `docs/wahldaten-methodik.md` (Re-Ingest-Checkliste, Endergebnis-Termine).

## Tasks & Acceptance

**Execution:**
- [ ] Page-Test für die drei Abschnitte (rot), dann Texte anpassen (grün)
- [ ] Grep: kein „Phase 1“, „Backlog“, „Memory“, `pnpm` im sichtbaren Text der Seite
- [ ] `lint:wahl` grün

**Acceptance Criteria:**
- Given `/methodik/wahldaten`, when die Abschnitte 2, 6 und 7 gelesen werden, then stimmen Jahreslisten, Geometrie und vorläufig-Hinweis mit den Prod-Daten überein.

## Implementation Notes

- 28.09. 20:52 Hinweis Matze, 20:55 Inventur Koordinator (Grep + `WAHL_TO_GEO`), 20:53 Checkpoint 1 durch Matze („freigeben weiter“).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run "src/routes/(with-header)/methodik"` -- expected: grün
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm check` -- expected: 0 Fehler
