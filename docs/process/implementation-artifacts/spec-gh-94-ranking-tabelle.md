---
title: 'GH-94 Ranking-Tabelle passt bei 1440 px, Klickziele und Semantik'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'b6ffccbb385dd86195a2b026f6e14859e46206a6'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Ranking-Tabelle auf `/umwelt-infrastruktur-score` ist 903 px breit, ihr Container nur 864 px (`max-w-4xl`). Kriminalität ist nur per unsichtbarem Scroll erreichbar, 144 von 152 Klickzielen sind unter 24 px hoch. Die gedrehten Spaltenköpfe sparen keinen Platz, weil `transform` die Layoutbreite nicht ändert.

**Approach:** Gedrehte Köpfe zählen nicht mehr zur Spaltenbreite, Zahlenspalten bekommen eine feste schmale Breite, Kontext-Spalten (Kultur, Kriminalität, nicht im Score) setzt eine Linie ab. Klickziele mindestens 24 px. Auf Mobil darf die Tabelle scrollen: Scroll-Region per Tastatur bedienbar, mit Name und sichtbarem Hinweis.

Entscheidungen Matze (Issue-Kommentar 17.10.2026, gilt als abgenommene Spec): passt bei 1440 px ohne Scroll; Kontext-Dimensionen optisch absetzen ohne neue Farbe; Mobil darf scrollen mit sichtbarem Hinweis.

## Boundaries & Constraints

**Always:** Tokens statt Rohwerte (`--target-min`, Dichte-Skala). Sort- und View-Logik, URL-State und Quartils-Färbung bleiben unverändert. DE und EN.

**Never:** Score-Namen ändern (#93), Texte kürzen (#92), Seitenbreite `max-w-4xl` ändern, neue Farbe.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop | 1440 und 1920 px, Ansicht Kieze | Tabelle ≤ Container, kein horizontaler Scroll | N/A |
| Mobil | 390 px | Region scrollt, Hinweis sichtbar, Region fokussierbar | N/A |
| Sortierung | Klick auf Spaltenkopf | aktiver Kopf `aria-sort` ascending/descending, andere sortierbare `none` | N/A |
| Bezirke | Ansicht Bezirke (keine Bezirk-Spalte) | Layout bleibt stabil, kein Scroll auf Desktop | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/score-ranking-table.svelte` -- Tabelle, Köpfe (Z. 279-336), Zellen, scoped CSS `.score-col-th`/`.score-col-rot` (Z. 452-464). Pill-Klassen `PILL_BASE`/`pillClass`.
- `src/lib/components/atlas/score-ranking-table.svelte.test.ts` -- Komponententests (Browser, ohne Tailwind-CSS, scoped Styles laden).
- `src/routes/(with-header)/umwelt-infrastruktur-score/page.svelte.test.ts` + `__snapshots__/uis-de.txt` -- Text-Snapshot, ändert sich durch Caption/Hinweis.
- `messages/de.json`, `messages/en.json` -- neue Keys für Scroll-Region und Hinweis.
- `src/app.css:103` -- `--target-min: 24px`.
- Muster für `aria-sort`: `tests/e2e/bezirk-landing.e2e.ts:95`.

## Tasks & Acceptance

**Execution:**
- [ ] `score-ranking-table.svelte.test.ts` -- rote Tests: Zahlenkopf-Breite unabhängig vom Label, `aria-sort`, Caption, Scroll-Region (`tabindex=0`, `role=region`, `aria-label`), Hinweis bei Überlauf, Kontext-Spalten markiert, Klickziel-Klassen.
- [ ] `score-ranking-table.svelte` -- Umsetzung.
- [ ] `messages/*.json` -- Keys `uis_ranking_scroll_region_aria`, `uis_ranking_scroll_hint`.
- [ ] `__snapshots__/uis-de.txt` -- Snapshot nachziehen.

**Acceptance Criteria:**
- Given 1440 px, when die Seite lädt, then `scrollWidth` der Tabelle ≤ `clientWidth` des Containers.
- Given eine Zeile, when man Kiez-Link oder Sortierkopf misst, then Höhe ≥ 24 px.
- Given Kultur und Kriminalität, when man die Tabelle ansieht, then trennt eine Linie sie von den Score-Dimensionen.

## Implementation Notes

- Gedrehte Labels stehen absolut im Kopf (`position: absolute`), Zahlenspalten haben 3rem Inhaltsbreite. Das letzte Label bekommt 4.75rem Platz rechts, sonst ragt „Recorded crime“ (EN) aus dem Scroll-Container.
- Die Trennlinie vor Kultur steht nur in den Datenzeilen; im 8,5rem hohen Kopf wirkte sie zu lang.
- Hinweis und `tabindex` hängen an einem `ResizeObserver`; ohne Überlauf kein Hinweis und kein Tab-Stopp.
- Messung live (Dev-Server, echte Daten): Tabelle 903 px auf 864 px vorher, 864 px auf 864 px nachher bei 1440 und 1920 px, DE, EN und Bezirke. Klickziele unter 24 px: 144 von 152 vorher, 0 nachher.
- Der Text-Snapshot enthält Caption und Hinweis, weil die Tests ohne Tailwind laufen und die Tabelle dort überläuft.

## Spec Change Log

## Review Triage Log

Codex (`gpt-6.1-sol`) war wegen Nutzungslimit nicht erreichbar; die drei Linsen liefen inline.

| Linse | Befund | Verdict | Route |
|---|---|---|---|
| Blind | Region auch ohne Überlauf fokussierbar, nutzloser Tab-Stopp auf Desktop | medium | patch: `tabindex` nur bei Überlauf, Test erweitert |
| Edge Case | Hinweis erscheint erst nach Hydration, kleine Layout-Verschiebung auf Mobil | low | abgelehnt: eine Textzeile, nur bei Überlauf |
| Edge Case | Ansicht Bezirke ohne Bezirk-Spalte | false | gemessen: 864 auf 864 px, kein Hinweis |
| Edge Case | EN-Label „Recorded crime“ ragt über den Rand | high | patch: Platz rechts 4.75rem, gemessen 864 auf 864 px |
| Verification Gap | Breite bei 1440 px nur per Screenshot-Skript belegt, kein e2e-Test | low | abgelehnt: e2e läuft nicht in der CI, Messung im PR dokumentiert |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/components/atlas/score-ranking-table.svelte.test.ts "src/routes/(with-header)/umwelt-infrastruktur-score/page.svelte.test.ts"` -- grün
- `pnpm check` -- Exit 0
- `pnpm exec prettier --check src messages` -- Exit 0

**Manual checks:**
- Screenshots `/tmp/gh-94/nachher/` bei 1440, 1920, 390 px; Messung per `/tmp/gh-94-tools/shot.mjs`.
