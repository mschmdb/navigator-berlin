---
title: 'Kälte-Navigator: Filter „Jetzt offen“ in der Warme-Orte-Karte (#75)'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'f360030d63ef1b7fb72bfcf5d34e059e73734f15'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Warme-Orte-Karte im Kälte-Modus (#73) filtert nur nach Kategorie. Die Kühle-Orte-Karte im Hitze-Modus hat zusätzlich „jetzt offen“. Wer jetzt einen warmen Ort sucht, sieht auch geschlossene (Epic #57).

**Approach:** Die Warme-Orte-Karte bekommt einen Umschalt-Chip „jetzt offen“ / „open now“. Er wirkt zusätzlich zum Kategorie-Filter (UND). Grundlage ist nur OSM-`oh`. Orte ohne `oh` oder mit unlesbarem `oh` fallen bei aktivem Filter heraus (215 von 227 haben `oh`).

## Boundaries & Constraints

**Always:**
- „Offen“ heißt `open` oder `closing-soon` laut `getOpeningStatus`, wie bei Kühlen Orten (`isOpenNow`).
- Zähler-Ansage und Leertext berücksichtigen den Filter.
- Chip mit `aria-pressed`, Tastatur bedienbar, WCAG 2.2 AA; DE/EN von Hand; keine em-dashes; Tests zuerst.

**Never:**
- Keine Änderung an der Liste auf `/kaelte`, am Hitze-Modus, an der Kühle-Orte-Karte, am Default-Inspector.
- Keine Datenänderung.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Filter aus | Standard | wie bisher: 5 nächste, alle Status | N/A |
| Filter an | „jetzt offen“ gedrückt | nur Orte mit Status offen/schließt bald, nächste 5 | N/A |
| Kombiniert | „jetzt offen“ + „Bibliothek“ | nur offene Bibliotheken | N/A |
| Ohne `oh` | Ort ohne Öffnungszeiten | bei aktivem Filter ausgeblendet | N/A |
| Nichts offen | z. B. nachts | Leertext „Gerade ist kein passender Ort offen …“ statt Liste | N/A |
| EN | `/en/explore?…&mode=kaelte` | Chip „open now“ | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/kaelte/nearest-waerme-orte.ts` -- `nearestWaermeOrte(from, places, { category, limit, now })` bekommt optional `onlyOpen?: boolean` (Default false). Filtert vor Sortierung; `total` zählt die gefilterte Auswahl. `/kaelte` (`warme-orte-naehe.svelte:63`) ruft ohne `onlyOpen` auf und bleibt gleich. Test: `nearest-waerme-orte.test.ts`.
- `src/lib/components/atlas/inspector-panel/internal/opening-status.ts:33` -- `isOpenNow` wiederverwenden.
- `src/lib/components/atlas/inspector-panel/waerme-orte-card.svelte:52-74,150-175,279-282` -- State `onlyOpen`, Chip vor den Kategorie-Chips im selben `role="group"` (Gruppen-Label anpassen, da nicht mehr nur Kategorie), `announceGlobal` beim Umschalten, Leertext bei aktivem Filter. testid `waerme-orte-filter-offen`. Test: `waerme-orte-card.svelte.test.ts` mit `now`-Steuerung über Fake-Timer oder Fixture-`oh`.
- Muster: `kuehle-orte-card.svelte:66-75,99,160-180` (Chip-Klassen, `aria-pressed`); Label `inspector_kuehle_orte_filter_jetzt_offen` wiederverwenden.
- `messages/de.json`, `messages/en.json` -- neu `inspector_waerme_orte_empty_offen`; `inspector_waerme_orte_filter_group_aria_label` → „Warme Orte filtern“ / „Filter warm places“.
- `tests/e2e/kaelte-explorer.e2e.ts` -- Chip sichtbar, Umschalten setzt `aria-pressed`, Liste bleibt oder Leertext erscheint (zeitunabhängig prüfen).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/kaelte/nearest-waerme-orte.ts` + Test -- `onlyOpen` mit Fällen offen, schließt bald, geschlossen, ohne `oh`, kombiniert mit Kategorie, `total`.
- [x] `waerme-orte-card.svelte` + Test -- Chip, Kombination, Leertext, Ansage, EN.
- [x] Messages DE/EN.
- [x] E2E-Ergänzung in `kaelte-explorer.e2e.ts`.

**Acceptance Criteria:**
- Given der Kälte-Modus mit gewählter Adresse, when die Person „jetzt offen“ drückt, then zeigt die Karte nur laut OSM gerade geöffnete warme Orte und meldet die Anzahl per Screenreader.
- Given `/kaelte` oder der Hitze-Modus, when die Seite lädt, then verhalten sie sich wie vor dieser Änderung.

## Implementation Notes

- Umschalter „jetzt offen“ steht vor „Alle“, getrennt durch einen `aria-hidden`-Trenner.
- Bei 0 Treffern meldet die Live-Region den Leertext statt „0 von 0“, auch beim Kategorie-Wechsel.
- E2E: a11y „Root (Karte)“ einmal flaky (3x rot, danach 4x grün ohne Änderung); „Escape löscht Selection“ bekannt rot.

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Ansage „0 von 0 Orten“, wenn nichts offen ist | medium | patch | `toggleOnlyOpen` ruft immer `counterText`; Sehende lesen den Leertext. Spec: Ansage berücksichtigt Filter. |
| 2 | „Alle“ und „jetzt offen“ gleichzeitig gedrückt, gleiche Optik in einer Reihe | low | patch | Zwei Bedienlogiken (Umschalter vs. Kategorie-Auswahl) ohne Trennung; Gestalt Gleichartigkeit. |
| 3 | Leertext empfiehlt andere Kategorie, auch wenn „Alle“ aktiv ist | low | patch | Text neutral formulieren. |
| 4 | EN-Leertext und Leertext bei Filter aus ungetestet | low | patch | Nur DE-Fall mit Filter an geprüft. |
| 5 | Liste ändert sich minütlich ohne Ansage | low | reject | Gleiches Verhalten bei Kühle-Orte-Karte; Fix bräuchte zusätzlichen Effect. |
| 6 | Kein Hinweis, dass Orte ohne Öffnungszeiten herausfallen | low | reject | Muster Kühle-Orte-Karte; Methodik-Text nennt OSM-Grundlage. |
| 7 | E2E prüft Filter tageszeitabhängig und nicht inhaltlich | low | reject | Komponenten- und Unit-Tests decken Inhalt mit fester Zeit ab. |
| 8 | Filterzustand nicht in der URL | low | reject | Kategorie-Filter ebenso; nicht gefordert. |
| 9 | Message-Key der Kühle-Orte-Karte wiederverwendet | low | reject | Spec verlangt Wiederverwendung. |
| 10 | Testhelfer `itemNames()` greift erstes `span` | low | reject | Nur Testcode, heute korrekt. |
| 11 | Chip-Klassen und Ansage dreifach bzw. doppelt | low | reject | Kosmetik ohne benannten Schaden. |
| 12 | Leertext „jetzt offen“ bei fehlender Adresse oder leerem Index | low | reject | Karte rendert nur mit Adresse; leerer Index praktisch ausgeschlossen. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte-explorer kaelte kuehle-orte a11y` -- expected: grün außer bekanntem „Escape löscht Selection“
