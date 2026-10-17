---
title: 'gh-103: Bezirk-Karte ohne verschachtelte Links im Bild'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
baseline_commit: '1be77a22c11044203102437b861925b987a5cefc'
route: 'dispatch'
review_loop_iteration: 2
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** axe meldet auf `/bezirk/…` den Verstoß `nested-interactive` (serious), Desktop und Mobil. Das `<svg role="img">` in `bezirk-kieze-map.svelte` enthält Links je Kiez; `role="img"` hat präsentationale Kinder, die Links sind trotzdem interaktiv (Issue #103).

**Approach:** Die Karte bleibt für Hilfstechnik ein einziges Bild mit Namen. Die Kiez-Links im SVG werden für Hilfstechnik verborgen und bleiben nur Mausziele. Tastatur und Screenreader erreichen dieselben Seiten über die Kiez-Liste daneben, die schon heute die gleichwertige Textalternative ist (Variante b aus dem Issue).

## Boundaries & Constraints

**Always:** Kein zusätzlicher Tab-Stopp. Mausklick auf einen Kiez führt weiter zur Kiez-Seite und zählt das Plausible-Ziel `map_link`. Der Kiez-Name mit Score bleibt für Mausnutzer beim Überfahren sichtbar (SVG-`<title>`). DE und EN unverändert.

**Never:** Keine Änderung an Kiez-Liste, Legende, Farben oder Layout. Kein Wechsel auf `role="group"` mit fokussierbaren Links (doppelter Weg zur selben Seite für Tastatur und Screenreader, Leitlinie 2).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Screenreader | Karte gerendert | Ein Bild „Kieze in {Bezirk}“, keine Links darin im Accessibility-Tree | N/A |
| Tastatur | Tab durch die Seite | Kein Fokus auf Kartenflächen, Liste bleibt erreichbar | N/A |
| Maus | Klick auf Kiez-Fläche | Navigation zu `/kiez/{slug}` bzw. `/en/kiez/{slug}`, Tracking feuert | N/A |
| Kiez ohne Score | composite null | Tooltip „{Name}, ohne Kiez-Score“ | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/bezirk-kieze-map.svelte` -- SVG heute mit `role="img"` und `<a tabindex="-1" aria-label>` je Kiez. Neu: SVG ohne Rolle mit `aria-hidden="true"` (ganze Grafik für Hilfstechnik verborgen); davor ein leeres, `sr-only` gesetztes Element mit `role="img"` und `aria-label={m.bezirk_map_aria(...)}`: das benannte Bild für Hilfstechnik, ohne Kinder. Links behalten `tabindex="-1"`, `aria-label` weicht einem `<title>` als Maus-Tooltip. Header-Kommentar anpassen.
- `src/lib/components/atlas/bezirk-kieze-map.svelte.test.ts` -- Label-Tests (3 Stellen) auf `<title>` umstellen; Test „beschriftet die Gruppe“ prüft heute `role="img"` und wird zu: SVG `aria-hidden="true"` ohne `role`; ein Geschwister-Element `role="img"` ohne Kinder trägt den Namen mit Bezirk.
- `src/lib/components/atlas/landing-tracking.svelte.test.ts:104` -- klickt `bezirk-map-link`, muss grün bleiben (nicht ändern).
- `tests/e2e/a11y.e2e.ts` -- AxeBuilder-Muster (`withTags(['wcag2a','wcag2aa','wcag22aa'])`). Neuer Fall für `/bezirk/friedrichshain-kreuzberg` (gleicher Bezirk wie `bezirk-landing.e2e.ts` und der Live-Befund); vor dem Scan warten, bis Karten-Links im DOM sind.
- `tests/e2e/bezirk-landing.e2e.ts:92` -- prüft `aria-label` am Karten-Link; auf `<title>`-Text umstellen.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/components/atlas/bezirk-kieze-map.svelte.test.ts` -- failing Tests: SVG `aria-hidden="true"` ohne `role`; benanntes `role="img"`-Element ohne Kinder mit Bezirk; Links mit `tabindex="-1"` und `<title>`, ohne `aria-label` -- TDD rot
- [x] `tests/e2e/a11y.e2e.ts` -- axe-Fall für `/bezirk/friedrichshain-kreuzberg`, wartet auf Karten-Links -- Regressionsschutz auf Seitenebene
- [x] `tests/e2e/bezirk-landing.e2e.ts` -- Assertion `aria-label` auf `<title>`-Text umstellen -- Vertrag folgt der Komponente
- [x] `src/lib/components/atlas/bezirk-kieze-map.svelte` -- SVG verbergen, benanntes `role="img"`-Geschwister, `<title>` statt `aria-label`, Kommentar -- behebt `nested-interactive`

**Acceptance Criteria:**
- Given die Bezirk-Seite, when axe mit WCAG 2.2 AA läuft, then meldet es 0 Verstöße.
- Given die Karte, when ein Mausnutzer einen Kiez überfährt, then zeigt der Browser „{Name}, Kiez-Score {n}“ als Tooltip.
- Given ein Screenreader, when er die Karte erreicht, then findet er ein Bild „Karte der Kieze im Bezirk …“ und keine Kiez-Links.

## Implementation Notes

- Iteration 1: `aria-hidden` nur an den Links reichte nicht (siehe Spec Change Log).
- Iteration 2: Das benannte Bild ist ein eigenes, leeres `role="img"`-Element neben der verborgenen Grafik. So bleibt der eingefrorene Approach („ein einziges Bild mit Namen“) erfüllt, ohne Links im Bild.
- `winner-map.svelte.test.ts` (Adress-Hinweis) schlug in einem vollen Lauf fehl und bei Einzelläufen 2 von 3 Mal; ohne Bezug zu dieser Änderung, nach `deferred-work.md`.
- Review-Layer liefen als kontextfreie `codex exec`-Läufe (`gpt-6.1-sol`, read-only), weil dieser Lauf keine Subagenten starten darf. Danach `codex-review` (`gpt-6.1-sol`): keine Befunde, APPROVE.
- Spec-Checkpoint übersprungen (Matze abwesend, autonomes Arbeiten freigegeben). Issue-Text gilt als Spec, bitte prüfen.
- E2E lokal nicht lauffähig: Build braucht `DATABASE_URL`, im Worktree nicht gesetzt. axe-Verhalten per Playwright-Probe mit axe-core 4.11.4 belegt.

## Spec Change Log

- **Iteration 1** · Auslöser: Edge Case Hunter, „axe getFocusableDescendants zählt Links mit href und tabindex=-1 unabhängig von aria-hidden“. Belegt per Probe (axe-core 4.11.4): `svg role=img` + `a[aria-hidden][tabindex=-1]` → `nested-interactive`; `svg aria-hidden` ohne Rolle → 0 Verstöße; `role=group` → 0 Verstöße. Geändert: Code Map, Tasks, AC, Design Notes; SVG wird als Ganzes verborgen statt nur die Links. Vermiedener Zustand: Fix, der den axe-Verstoß nicht behebt. KEEP: `<title>`-Tooltip statt `aria-label`; Links bleiben `tabindex="-1"` und klickbar mit Tracking; neuer axe-E2E-Fall; Label-Tests prüfen `<title>`.

- **Iteration 2** · Auslöser: Edge Case Hunter, „Approach verlangt ein einziges Bild mit Namen, Code liefert nur einen sr-only-Absatz“. Geändert: Code Map, Tasks, AC, Design Notes, Implementation Notes; das sr-only-Element wird ein leeres `role="img"` mit `aria-label`. Vermiedener Zustand: Code weicht vom eingefrorenen Intent ab. KEEP: alles aus Iteration 1, dazu SVG `aria-hidden` ohne Rolle, E2E-Warten auf Karten-Links, `<title>`-Assertion in `bezirk-landing.e2e.ts`.

## Review Triage Log

| # | Layer | Befund | Verdict | Beleg |
|---|---|---|---|---|
| 1 | edge | `aria-hidden` an Links behebt `nested-interactive` nicht | high | Playwright-Probe mit axe-core 4.11.4: Variante „hidden“ meldet weiter `nested-interactive` → bad_spec, Loopback |
| 2 | edge | E2E scannt f-k statt der in der Spec genannten Neukölln-Seite | low | Abweichung real; f-k ist der Live-Befund und Bezirk der übrigen E2E → Code Map angepasst |
| 3 | blind, vg | `bezirk-landing.e2e.ts:92` prüft weiter `aria-label` | medium | Zeile 92 gelesen: `toHaveAttribute('aria-label', …)` würde fehlschlagen → in Tasks aufgenommen |
| 4 | blind | axe-Scan wartet nur auf Wrapper, leeres SVG würde bestehen | low | real, direkte Korrektur (Warten auf Links) → in Code Map aufgenommen |
| 5 | blind | Kein Test, dass jede Karten-Destination einen Listen-Link hat und per Tastatur bedienbar ist | low | `bezirk-landing.e2e.ts:90` prüft gleiche Anzahl, Liste unverändert; Ausbau fügt Testumfang ohne Bezug zum Defekt hinzu → verworfen |
| 6 | edge (R2) | Approach „ein Bild mit Namen“ nicht erfüllt, nur sr-only-Absatz | medium | Komponente gelesen: `<p class="sr-only">` statt benanntem Bild → bad_spec, Iteration 2 |
| 7 | blind (R2) | Links unter `aria-hidden` per Mausklick fokussierbar | low | Klick navigiert sofort weg; Abwehr bräuchte zusätzliche Handler → verworfen |
| 8 | blind (R2) | E2E prüft nicht Gleichwertigkeit von Karte und Liste | low | carried, wie #5 → verworfen |
| 9 | blind (R2) | axe-E2E besteht auch ohne Beschreibung | low | Unit-Test prüft Name mit Bezirk am `role="img"`-Element → verworfen |
| 10 | blind (R3) | Fokuskonflikt `aria-hidden` und klickbare Links | low | carried, wie #7 → verworfen |
| 11 | blind (R3) | E2E prüft Gleichwertigkeit Karte und Liste nicht | low | carried, wie #8 → verworfen |
| 12 | blind (R3) | Kein E2E-Klick auf eine Kiez-Fläche | low | `href` und Pointer-Verhalten unverändert; `landing-tracking.svelte.test.ts:104` klickt den Link → verworfen |
| 13 | edge, vg (R3) | keine Befunde | - | - |

## Design Notes

axe-Regel `nested-interactive` (Check `no-focusable-content`) sammelt Nachkommen mit Widget-Rolle, die fokussierbar sind, auch mit `tabindex="-1"` und unabhängig von `aria-hidden` am Nachkommen. Darum darf das Element mit präsentationalen Kindern (`role="img"`) keine Links enthalten. Lösung: Die Grafik trägt keine Rolle und ist als Ganzes `aria-hidden`; `aria-hidden-focus` greift nicht, weil die Links nicht in der Tab-Reihenfolge liegen. Das benannte Bild ist ein leeres `role="img"`-Element davor (Probe: 0 Verstöße).

## Verification

**Commands:**
- `pnpm check` -- 0 Fehler
- `pnpm test:unit --run` -- grün
- Playwright-Probe mit axe-core 4.11.4 auf das Markup der Komponente (temporär, nicht committen) -- 0 Verstöße
- `pnpm test:e2e -- tests/e2e/a11y.e2e.ts` -- grün, falls die E2E-Umgebung lokal läuft
