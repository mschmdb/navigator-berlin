---
title: 'Briefwahl-Hinweise auf Story-17-Stand bringen'
type: 'bugfix'
created: '2026-09-27'
status: 'done'
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
- [x] `editorial-disclaimer.svelte` + Test: neuer Wortlaut (Test zuerst rot)
- [x] `wahl-renderer.ts` + Test: neuer Schlusssatz
- [x] `methodik/wahldaten/+page.svelte`: Abschnitte 3 und 4, Anker bleiben (+ Test, kein Seiten-Test existierte, neu angelegt: `page.svelte.test.ts`)
- [x] Grep-Gate: keine Treffer mehr für „Kiez-Aggregat ausgeschlossen“, „pre-2021“, „Briefwahl-Asymmetrie“, „Schraffur“ in `src/` (siehe Implementation Notes für 2 verbliebene, unbedenkliche Test-Titel-Treffer)
- [x] Zeitmessung

**Acceptance Criteria:**
- Given Inspector, Adress-Vergleich oder Wahl-Detailseite, when der Wahl-Hinweis erscheint, then nennt er Briefstimmen als enthalten und den Kiez-Wert als Schätzung.
- Given `/methodik/wahldaten`, when Abschnitte 3 und 4 gelesen werden, then stimmen sie mit Story 17 und `docs/wahldaten-methodik.md` überein.

## Implementation Notes

- 27.09. 07:57 Start Planung, Inventur Koordinator direkt (Grep), 08:06 Checkpoint 1 durch Matze freigegeben.
- Vier Texte korrigiert: `editorial-disclaimer.svelte` (Variante `wahl-stimmenanteile`), `wahl-renderer.ts` (llms-Schlusssatz), `methodik/wahldaten/+page.svelte` Abschnitt 3 (Titel + Nav-Link „Briefwahl-Gruppen“ statt „Briefwahl-Asymmetrie“, Text auf Gruppen-Logik umgestellt) und Abschnitt 4 (anteilige Verteilung statt Ausschluss). Anker `#wahldaten-briefwahl` und `#aggregation` unverändert.
- Grep-Gate zusätzlich auf 5 Stellen außerhalb der vier Kern-Texte angewandt, die dieselbe veraltete Behauptung trugen (reine Text-/Kommentar-Korrektur, keine Logik): `methodik/+page.svelte` Teaser-Absatz, `llms-builder.ts` Sitemap-Description, `webmcp/internal/manifest-builder.ts` Tool-Description `get_election_result`, sowie je ein stale JSDoc-Kommentar in `webmcp/tools/wahl/get-election-result.ts` und `compare-elections.ts` (die zugehörige Caveat-Logik war bereits korrekt, nur der Kommentar war stehen geblieben).
- 2 verbliebene Grep-Treffer für „pre-2021“ sind bewusst unangetastet: Test-Titel in `get-election-result.test.ts:109` und `wahl-section.svelte.test.ts:216` beschreiben korrekt, dass das alte pre-2021-Verhalten *nicht mehr* auftritt (Regressionstest), sie behaupten keinen falschen Fakt. Nicht Teil der Tasks-Liste, deshalb nur gemeldet statt umbenannt.
- `docs/wahldaten-methodik.md` war beim Start bereits auf Story-17-Stand (verifiziert, keine Änderung nötig) -- diente nur als Wortlaut-Quelle.
- Test-Datei für die Methodik-Seite musste `page.svelte.test.ts` heißen, nicht `+page.svelte.test.ts` (SvelteKit reserviert `+`-Präfixe auch für Test-Dateien im Routen-Ordner; `svelte-kit sync` bricht sonst ab). Nach Projekt-Konvention (`methodik/page.svelte.test.ts`) benannt.
- Verifikation: `pnpm exec vitest run` 445 Testdateien / 4114 Tests, 1 isolierter Flake (`winner-map.svelte.test.ts`, Timing-Timeout im Adress-Hint-Test, unabhängig verifiziert reproduzierbar grün sowohl vor als auch nach diesem Commit, keine Berührung mit den geänderten Dateien). `pnpm check` 0 Fehler/Warnungen. `pnpm lint:wahl` 70 Dateien, 0 Verstöße.

- Zeitmessung gesamt (Koordinator): Planung 07:57-08:06 (inkl. Freigabe Matze), Umsetzung 08:07-08:18, Review 08:18-08:20, Patch-Runde 08:21-08:24, Abschluss 08:25. Gesamt rund 28 min.
- Qualität: 18 Review-Funde in 13 Einträgen, 9 gepatcht (u.a. veraltete Defaults in `briefwahl-marker.svelte`, veraltetes `static/webmcp-manifest.json`), 4 rejected. Abschluss: vitest 4116 Tests grün (winner-map-Flake einmal rot, isoliert grün), check 0, lint:wahl 0.


## Review Triage Log

Runde 1 (27.09.2026 08:20), 3 Layer: Blind Hunter (BH) 11, Edge Case (EC) 6, Verification Gap (VG) 0 + 1. Triage Koordinator. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/VG | `static/webmcp-manifest.json:431` behält die alte pre-2021-Beschreibung | medium | Datei eingecheckt, nur Prebuild regeneriert | P |
| 2 | BH/EC | Kiez-Marker „Briefwahl geschätzt“ verlinkt `#wahldaten-briefwahl`, Abschnitt 3 erklärt die Kiez-Schätzung nicht | medium | Erklärung steht in `#aggregation` | P: Satz + Link in Abschnitt 3 |
| 3 | BH | „deshalb“ am falschen Satz in Abschnitt 3 | low | Kausalität falsch | P |
| 4 | BH | Zitat mit ASCII-Schlusszeichen und abweichendem Wortlaut („Briefwahl 7P“) | low | Doku: „Stimmbezirke 726, 727 und 7P“ | P |
| 5 | BH | Abschnitt 3 ohne Hinweis für Wahlen ohne Stimmbezirks-Geometrie | low | Halbsatz/Link auf Coverage | P |
| 6 | BH/EC | `briefwahl-marker.svelte` Defaults „Ohne Briefstimmen“ / „Stimmbezirks-Werte ohne Briefstimmen…“ | medium | falsche Aussage, jeder neue Aufrufer ohne Props zeigt sie | P: Default-Texte korrigieren (nur Text) |
| 7 | BH | `compare_elections`-Manifest-Eintrag ohne Briefwahl-Fakten | low | Tool-Beschreibung selbst vollständig, Manifest bewusst knapp | R |
| 8 | BH | Seiten-Test prüft den umbenannten TOC-Link nicht | gap | | P |
| 9 | BH/EC | Grep-Gate-Zahl in Implementation Notes falsch | low | Fix editiert Spec | R |
| 10 | BH | `--` und „reproduzierbar grün“ in Implementation Notes | low | Fix editiert Spec | R |
| 11 | BH | Disclaimer nennt Bezirk/Berlin nicht | low | Hinweis erscheint auch auf Bezirk-/Berlin-Ansichten | P: „auf allen Ebenen enthalten“ |
| 12 | EC | Abschnitt 4 verschweigt Gleichverteilungs-Fallback ohne Wahlberechtigte | low | `briefwahl-split.ts:129-133`, Doku :225-227 | P: Halbsatz |
| 13 | EC | llms „auf allen Ebenen enthalten“, Urnen außerhalb aller Kieze fehlen im Kiez | false | betrifft 1 Urne in 3 von 18 Wahlen, Summen-Gate dokumentiert; Aussage gilt für die Ebenen | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
