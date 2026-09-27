---
title: 'Briefwahl-Hinweise auf Story-17-Stand bringen'
type: 'bugfix'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: '76e50ed59d4730d47ef8e5ed7758e472772f583f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/stories/17-briefwahl-gruppen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Seit Story 17 zählen Stimmbezirks- und Kiez-Ebene die Briefwahl mit. Die Stimmbezirks-Ebene nutzt dafür die Briefwahl-Gruppe. Im Kiez verteilen wir die Briefstimmen anteilig nach Wahlberechtigten, das ist eine Schätzung. Vier öffentliche Texte behaupten noch den alten Stand, dass Briefstimmen im Kiez fehlen oder erst ab 2021 räumlich zugeordnet sind. Diese Texte gehen mit dem Launch am 29.09. live.

**Approach:** Wir korrigieren die vier Texte auf `main` inhaltlich, knapp und im Wortlaut der Methodik-Doku und des Compare-Tooltips. Die Tests ziehen wir nach. Den Commit übernehmen wir danach in `feat/i18n-en` und übersetzen ihn dort (eigener Schritt).

## Boundaries & Constraints

**Always:**
- Freigabe durch Matze („zu 1: go“, 27.09. 07:57), Checkpoint geht an Matze.
- Fakten nur aus Story 17 und `docs/wahldaten-methodik.md`:
  - Bezirk und Berlin enthalten alle Stimmen.
  - Die kleinste Kartenebene ist die Briefwahl-Gruppe: Urnenwahlbezirke eines Briefwahlbezirks plus dieser Briefwahlbezirk.
  - Im Kiez sind Briefstimmen anteilig nach Wahlberechtigten verteilt: eine Schätzung, keine amtliche Aufteilung.
  - Das gilt für alle Wahlen mit Stimmbezirks-Geometrie.
- Anker `#wahldaten-briefwahl` und `#aggregation` bleiben erhalten (Briefwahl-Marker und Inspector verlinken sie).
- Editorial-Regeln: keine em-dashes, `lint:wahl` grün.

**Never:**
- Keine Code-Logik, keine Daten, keine Migrationen.
- Keine Übersetzung auf `main`.
- Keine weiteren Methodik-Abschnitte umschreiben (Geometrie-Coverage u.a.): nur Befund melden.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Inspector/Compare/Wahl-Detail | `EditorialDisclaimer variant="wahl-stimmenanteile"` | Text nennt Briefstimmen als enthalten, Kiez als Schätzung | N/A |
| llms-Wahltext | `wahl-renderer.ts` Markdown | Schlusssatz ohne „nicht in den Stimmbezirken pre-2021“ | N/A |
| Methodik Abschnitt 3 | `/methodik/wahldaten#wahldaten-briefwahl` | Briefwahl-Gruppen statt Asymmetrie-Beschreibung | N/A |
| Methodik Abschnitt 4 | `/methodik/wahldaten#aggregation` | anteilige Verteilung statt „ausgeschlossen“ | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/editorial-disclaimer.svelte:27-28`: Variante `wahl-stimmenanteile`. Die Variante rendert auf drei Oberflächen: `inspector-panel/wahl-section.svelte:546`, `compare-panel/wahl-compare-block.svelte:305`, `berlin-wahlen/[slug]/+page.svelte:323`. Test `editorial-disclaimer.svelte.test.ts:157` pinnt den alten Satz.
- `src/lib/server/llms/wahl-renderer.ts:104`: Schlusssatz. Test `wahl-renderer.test.ts:98` prüft nur `Brief-Stimmen` → auf den neuen Wortlaut umstellen.
- `src/routes/(with-header)/methodik/wahldaten/+page.svelte`:
  - Abschnitt 3 `:156-176` (Titel „Briefwahl-Asymmetrie“, „fehlen die Brief-Stimmen pre-2021“, „Schraffur-Streifen (Story 6.5)“, dessen UI mit Story 17 entfiel).
  - Abschnitt 4 `:190-196` („werden für das Kiez-Aggregat ausgeschlossen“).
  - Die Meta-Description `:12` nennt „Briefwahl“ und bleibt.
- Wortlaut-Quellen: `docs/wahldaten-methodik.md:216-228` und `:324-335`, Tooltip `wahl-compare-block.svelte` „Kiez-Werte verteilen die Briefwahl einer Gruppe anteilig nach Wahlberechtigten auf ihre Urnen: eine Schätzung, keine amtliche Aufteilung.“

## Design Notes

Textvorschläge (Richtung, Feinschliff erlaubt):
- Disclaimer: „Daten beschreiben Stimmenanteile, keine Bewertung. Briefstimmen sind enthalten: im Stimmbezirk über die Briefwahl-Gruppe, im Kiez anteilig nach Wahlberechtigten verteilt (Schätzung, keine amtliche Aufteilung).“
- llms: „Werte sind Stimmenanteile, keine Bewertung. Briefstimmen sind auf allen Ebenen enthalten; im Kiez sind sie anteilig nach Wahlberechtigten geschätzt.“
- Methodik 3, Titel „3. Briefwahl-Gruppen“: Berlin zählt Briefstimmen in eigenen Briefwahlbezirken ohne eigene Fläche. Bezirk und Berlin enthalten alle Stimmen. Auf der Karte ist deshalb die Briefwahl-Gruppe die kleinste Ebene: alle Urnenwahlbezirke eines Briefwahlbezirks plus dieser Briefwahlbezirk. Das gilt für alle Wahlen mit Stimmbezirks-Geometrie.
- Methodik 4, letzter Absatz: Briefstimmen fließen anteilig ein. Jede Urne einer Briefwahl-Gruppe erhält einen Anteil nach ihren Wahlberechtigten. Das ist eine Schätzung, keine amtliche Aufteilung.

## Tasks & Acceptance

**Execution:**
- [ ] `editorial-disclaimer.svelte` + Test: neuer Wortlaut (Test zuerst rot)
- [ ] `wahl-renderer.ts` + Test: neuer Schlusssatz
- [ ] `methodik/wahldaten/+page.svelte`: Abschnitte 3 und 4, Anker bleiben (+ Test, falls ein Seiten-Test existiert, sonst Unit-Test auf den Abschnittstext)
- [ ] Grep-Gate: keine Treffer mehr für „Kiez-Aggregat ausgeschlossen“, „pre-2021“, „Briefwahl-Asymmetrie“, „Schraffur“ in `src/`
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given Inspector, Adress-Vergleich oder Wahl-Detailseite, when der Wahl-Hinweis erscheint, then nennt er Briefstimmen als enthalten und den Kiez-Wert als Schätzung.
- Given `/methodik/wahldaten`, when Abschnitte 3 und 4 gelesen werden, then stimmen sie mit Story 17 und `docs/wahldaten-methodik.md` überein.

## Implementation Notes

- 27.09. 07:57 Start Planung, Inventur Koordinator direkt (Grep), 08:06 Checkpoint 1 durch Matze freigegeben.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
