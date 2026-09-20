---
title: 'Steuerungs-Klarheit: globale Reihe, Karten-Controls, Kontext-Badges'
type: 'feature'
created: '2026-09-20'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '0e6a3d1'
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Kopf-Steuerleiste (Reihe/Jahr/Ebene) suggeriert, für die ganze Seite zu gelten. Tatsächlich folgt nur die Wahl-Reihe allen Kapiteln; Jahr gilt nur für Karte/Panel/Small-Multiples, Ebene nur für die Karte. Wechsel, Trends und Sankey sind konzeptionell reihen-weit bzw. Kiez-fix. Das ist irreführend (Matze 20.09.).

**Approach (Matze-Entscheidung „B", 20.09.):** (1) Die Wahl-Reihe wird der einzige globale Zustand und bleibt dauerhaft sichtbar: schlanke Sticky-Leiste (nur Bundestag | Abgeordnetenhaus | BVV) unter dem Header. (2) Jahr- und Ebenen-Chips ziehen als Karten-Controls in das Karte-Kapitel (über die Winner-Map, zu Partei-Tabs/Zeit-Leiste). (3) Jedes andere Kapitel deklariert seinen Datenbezug sichtbar über ein Kontext-Badge (z. B. „Abgeordnetenhaus · alle Wahljahre · Kiez-Ebene"); der Sankey behält seinen Ebenen-Toggle. Diese Entscheidung ersetzt die ux-blueprint-Z.45-Vorgabe (mobile Sticky-Bottom-Leiste mit allen drei Reglern): mobil wird nur die Reihen-Leiste sticky.

## Boundaries & Constraints

**Always:**
- URL-Kontrakt unverändert: `?reihe=…&jahr=…&ebene=…` bleiben vollständig erhalten (Deep-Links, Reload-Wiederherstellung, Inspector-Links); nur die UI-Platzierung ändert sich. Der URL-Sync-Doppel-Effect in `+page.svelte` (untrack-Muster) bleibt unangetastet.
- Bestehende Testids bleiben stabil (`steuerleiste-reihe-*`, `steuerleiste-jahr-*`, `steuerleiste-ebene-*`): 16 E2E-Stellen hängen daran; die Chips ziehen mit ihren Ids um.
- Sticky-Reihen-Leiste: `role="radiogroup"` + `nextRadioIndex`-Tastatursteuerung wie Bestand; sticky unter dem Header (Bestands-Muster `scroll-mt`/`--header-height`), unaufdringlich (eine Zeile, font-mono), z-index über den Karten; mobil identisch sticky top (ersetzt Blueprint-Z.45).
- Jahr/Ebene-Controls rendern im Karte-Kapitel VOR der Winner-Map (in `+page.svelte`, wo die Handler schon leben); `winner-map.svelte` bleibt unangetastet (steht bei 499/500 Zeilen).
- Kontext-Badge: eine kleine wiederverwendbare Komponente (Props: Texte), gerendert in den Kapiteln Wechsel, Trends (inkl. Sankey-Bezug), Stärkste/schwächste Gebiete; Formulierungen bestehen `lint:wahl`; Badge nennt Reihe (reaktiv), Jahres-Bezug („alle Wahljahre" bzw. „Wahl <jahr>") und Ebene.
- A11y: Badge als Text (kein aria-Ballast), Sticky-Leiste behält Fokus-Reihenfolge vor dem Inhalt; Axe-E2E der Route bleibt grün.
- Keine Em-Dashes; Dateien < 500 Zeilen; bestehende Component-/E2E-Tests werden angepasst, nicht gelöscht (Verhalten identisch, Platzierung neu).

**Never:**
- Kein neuer URL-Parameter, keine Entfernung von Jahr/Ebene aus dem URL-State, kein Umbau der Kapitel-Datenlogik (reine Steuerungs-/Anzeige-Umstrukturierung).
- Kein Umbau von Winner-Map-Interna, Ergebnis-Panel, Sankey-Logik (dessen Rework ist die Folge-Story).
- Kapitel-Nav (Leselinien-Scroll-Spy) nicht anfassen, außer die Sticky-Offsets müssen wegen der neuen Leiste nachziehen (`scroll-mt`-Werte).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sticky-Reihe | Scroll bis Methodik | Reihen-Leiste bleibt sichtbar, Wechsel BVV wirkt sofort auf alle Kapitel | N/A |
| Karten-Controls | Karte-Kapitel | Jahr- und Ebenen-Chips stehen über der Karte, funktionieren wie bisher (URL-Sync, Fallback-Leiter) | N/A |
| Deep-Link | `?reihe=bvv&jahr=2016&ebene=bezirk` | Reload stellt exakt diese Ansicht her, Chips zeigen die Auswahl | N/A |
| Kontext-Badge Trends | Reihe AGH | Badge „Abgeordnetenhaus · alle Wahljahre · Kiez-Ebene", wechselt reaktiv mit der Reihe | N/A |
| Kontext-Badge Extreme | Jahr 2016 gewählt | Badge nennt „Wahl 2016" (folgt dem Karten-Jahr) | N/A |
| Mobile | schmaler Viewport | Nur die Reihen-Leiste sticky; Jahr/Ebene scrollen mit dem Karte-Kapitel | N/A |
| Scroll-Spy | Kapitel-Nav-Klick | Anker treffen weiterhin unter der (höheren) Sticky-Zone (scroll-mt angepasst) | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/wahl-portal/portal-steuerleiste.svelte` (209 Z.) -- drei radiogroups (Reihe/Jahr/Ebene, `nextRadioIndex`, Testids `steuerleiste-*`); aufteilen: Reihen-Teil in neue `reihen-leiste.svelte` (sticky), Jahr+Ebene-Teil in neue `karten-steuerung.svelte`; Testids und Props-Callbacks unverändert übernehmen; `portal-steuerleiste.svelte(.test)` danach entfernen oder als dünner Re-Export sterben lassen (Tests auf die neuen Komponenten heben).
- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- rendert `PortalSteuerleiste` (Z.232) mit Handlern `handleReiheChange/handleJahrChange/handleEbeneChange` + `jahrOptions`/`steuerleisteDisabled`; neu: ReihenLeiste sticky oberhalb des Inhalts, KartenSteuerung in der KapitelSection „karte" VOR `<WinnerMap/>`; Kontext-Badges in den Sections wechsel/trends/extreme-gebiete; `scroll-mt`-Offsets der Sections um die Leisten-Höhe erhöhen.
- NEU `src/lib/components/wahl-portal/kapitel-kontext-badge.svelte` + Test -- kleine Text-Komponente (font-mono xs, Mittelpunkte `·`), Props `{ reiheLabel, jahreText, ebeneText }`.
- `REIHE_LABELS`/`EBENE_LABELS` aus `wahl-portal-url-state.ts`; `currentJahr` für den Extreme-Badge.
- Tests: `portal-steuerleiste.svelte.test.ts` (auf neue Komponenten aufteilen), `tests/e2e/berlin-wahlen.e2e.ts` (16 `steuerleiste-*`-Stellen bleiben per Testid stabil; ggf. Scroll ins Karte-Kapitel vor Jahr-Klicks nötig, Playwright klickt aber auch außerhalb des Viewports); Axe-E2E `a11y.e2e.ts`-Muster.
- `src/lib/components/wahl-portal/kapitel-nav.svelte` -- nur falls Offsets brechen (Leselinien-Logik selbst nicht anfassen).

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [ ] `reihen-leiste.svelte` + `karten-steuerung.svelte` + Tests -- Aufteilung der Steuerleiste, Testids/Keyboard identisch; Sticky-Styling an der Reihen-Leiste.
- [ ] `kapitel-kontext-badge.svelte` + Test -- Badge-Komponente.
- [ ] `+page.svelte` + Test-Anpassungen -- Einbau: Sticky-Reihe oben, Karten-Steuerung im Karte-Kapitel, Badges in Wechsel/Trends/Extreme (Trends-Badge erwähnt den Sankey-Ebenen-Toggle nicht doppelt); `scroll-mt` nachziehen; alte `portal-steuerleiste`-Nutzung entfernt.
- [ ] `tests/e2e/berlin-wahlen.e2e.ts` -- bestehende Flows grün halten; ein neuer Test: Sticky-Leiste nach Scroll sichtbar + Reihen-Wechsel wirkt (Badge-Text ändert sich); Deep-Link-Test bleibt.

**Acceptance Criteria:**
- Given ein Scroll ans Seitenende, when die Reihe gewechselt wird, then aktualisieren sich Karte, Wechsel, Trends, Sankey und Extreme ohne Zurückscrollen; die Leiste war durchgehend sichtbar.
- Given ein Deep-Link mit reihe/jahr/ebene, then stellt der Reload exakt die Ansicht her; die Chips (jetzt im Karte-Kapitel) zeigen die Auswahl.
- Given die Kapitel Wechsel/Trends/Extreme, then trägt jedes ein sichtbares Kontext-Badge mit Reihe, Jahres-Bezug und Ebene; `lint:wahl` und der Axe-Test bleiben grün.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Die Aufteilung statt Umbau in-place hält die 16 E2E-Verweise stabil (Testids ziehen mit). `winner-map.svelte` (499/500 Zeilen) bleibt bewusst unberührt: Die Karten-Steuerung rendert in `+page.svelte` innerhalb der Karte-Section, wo Handler und Optionen bereits existieren. Der Sankey-Rework (Folge-Story) braucht durch die globale Sticky-Reihe keine eigene Reihen-Auswahl mehr, nur seinen Ebenen-Toggle.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- E2E: `pnpm exec vite build`, Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün
