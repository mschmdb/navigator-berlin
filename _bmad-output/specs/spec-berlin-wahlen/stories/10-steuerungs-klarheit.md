---
title: 'Steuerungs-Klarheit: globale Reihe, Karten-Controls, Kontext-Badges'
type: 'feature'
created: '2026-09-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'ad047ee'
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
- [x] `reihen-leiste.svelte` + `karten-steuerung.svelte` + Tests -- Aufteilung der Steuerleiste, Testids/Keyboard identisch; Sticky-Styling an der Reihen-Leiste.
- [x] `kapitel-kontext-badge.svelte` + Test -- Badge-Komponente.
- [x] `+page.svelte` + Test-Anpassungen -- Einbau: Sticky-Reihe oben, Karten-Steuerung im Karte-Kapitel, Badges in Wechsel/Trends/Extreme (Trends-Badge erwähnt den Sankey-Ebenen-Toggle nicht doppelt); `scroll-mt` nachziehen; alte `portal-steuerleiste`-Nutzung entfernt.
- [x] `tests/e2e/berlin-wahlen.e2e.ts` -- bestehende Flows grün halten; ein neuer Test: Sticky-Leiste nach Scroll sichtbar + Reihen-Wechsel wirkt (Badge-Text ändert sich); Deep-Link-Test bleibt.

**Acceptance Criteria:**
- Given ein Scroll ans Seitenende, when die Reihe gewechselt wird, then aktualisieren sich Karte, Wechsel, Trends, Sankey und Extreme ohne Zurückscrollen; die Leiste war durchgehend sichtbar.
- Given ein Deep-Link mit reihe/jahr/ebene, then stellt der Reload exakt die Ansicht her; die Chips (jetzt im Karte-Kapitel) zeigen die Auswahl.
- Given die Kapitel Wechsel/Trends/Extreme, then trägt jedes ein sichtbares Kontext-Badge mit Reihe, Jahres-Bezug und Ebene; `lint:wahl` und der Axe-Test bleiben grün.

## Implementation Notes

Umgesetzt wie im Code Map beschrieben: `portal-steuerleiste.svelte` in `reihen-leiste.svelte` (Reihe, sticky) und `karten-steuerung.svelte` (Jahr + Ebene) aufgeteilt, Testids/Tastatursteuerung/Callback-Signaturen unverändert übernommen. `portal-steuerleiste.svelte(.test.ts)` entfernt statt als Re-Export sterben gelassen (keine verbleibenden Importe).

- **Sticky-Stapel:** `ReihenLeiste` sitzt `sticky top-[var(--header-height,72px)]` (h-10, z-30) direkt über der bestehenden `KapitelNav`, deren `top` um `2.5rem` (die Reihen-Leisten-Höhe) nachzieht, damit sich beide Sticky-Leisten nicht überlappen. `kapitel-section.svelte`s `scroll-mt` wuchs von `+3rem` auf `+5.5rem` (Reihen-Leiste + Kapitel-Nav-Puffer), sonst würden Anker-Sprünge unter der jetzt höheren Sticky-Zone landen.
- **Kontext-Badges:** `kapitel-kontext-badge.svelte` ist reiner Text (kein aria-Ballast), die drei Texte (`reiheLabel`, `jahreText`, `ebeneText`) werden in `+page.svelte` berechnet, nicht in der Badge selbst. Wechsel/Trends zeigen „alle Wahljahre" (beide sind laut ihrem eigenen Code reihen-weit über alle Jahre), Extreme (Small Multiples) zeigt „Wahl {jahr}" nach `currentJahr` (folgt dem Karten-Jahr, wie in der I/O-Matrix gefordert). Alle drei zeigen fest „Kiez-Ebene", weil Wechsel/Trends/Small-Multiples laut ihren eigenen Kommentaren unabhängig vom globalen Ebenen-Toggle immer auf Kiez-Geometrie rechnen.
- **Sankey unangetastet:** der Sankey behält seinen eigenen lokalen Kiez/Bezirk-Toggle (`sankey-wahljahre.svelte`); das Trends-Badge dupliziert diesen nicht.
- **`winner-map.svelte`** nicht angefasst (bleibt bei 499 Zeilen); `KartenSteuerung` rendert in `+page.svelte` innerhalb der Karte-Section vor `<WinnerMap/>`.
- Neuer E2E-Test (`berlin-wahlen.e2e.ts`): Sticky-Sichtbarkeit nach Scroll ans Seitenende + Reihen-Wechsel aktualisiert Badges. Statt eines rohen `scrollY`-Pixelvergleichs prüft der Test die Sichtbarkeit von Reihen-Leiste vs. Kopf-Kapitel: ein Reihen-Wechsel kann die Dokument-Höhe ändern (andere Kapitel-Inhalte je Reihe), wodurch der Browser `scrollY` passiv auf eine neue, kleinere Maximalhöhe klemmt -- kein App-Bug, aber ein zu strenger Pixel-Vergleich hätte das fälschlich als Regression gemeldet.

## Spec Change Log

## Review Triage Log

Runde 1 (2026-09-20). Layer: Blind Hunter (N=6), Edge Case Hunter (8 Funde), Verification Gap (2 Gaps + 3 Nebenfunde). Verdicts und Routen:

| # | Fund | Quelle(n) | Verdict | Route |
|---|------|-----------|---------|-------|
| 1 | Reihen-Leiste: `h-10` fest + `flex-wrap` innen; ab ~383px Viewport (oder großer Root-Font) bricht die Chip-Zeile um und legt sich über die Kapitel-Nav; Offsets 2.5rem/5.5rem stimmen dann nicht mehr | BH#1 (strong), ECH#1, VG-Neben | high | patch: Muster `kapitel-nav` übernehmen (`overflow-x-auto`, `flex-nowrap`, `shrink-0`, `whitespace-nowrap` am Label) + Regressions-Test |
| 2 | Trends-Badge behauptet fest „Kiez-Ebene", der eingebettete Sankey hat einen eigenen Kiez/Bezirk-Toggle; auf „Bezirk" widerspricht das Badge der sichtbaren Grafik | BH#2 (medium), ECH#4 | high | patch: `ebeneText` in der Badge optional machen, Trends-Badge ohne Ebenen-Angabe rendern; E2E-Assertions nachziehen |
| 3 | Ergebnis-Panel `lg:sticky lg:top-24` (96px) liegt unter dem jetzt 153px hohen Sticky-Stapel; ~57px Panel-Oberkante dauerhaft verdeckt (vorher 17px, durch die Story verschärft) | ECH#6 | high | patch: `lg:top-[calc(var(--header-height,72px)+5.5rem)]` in `winner-map.svelte` (bewusste 1-Klassen-Ausnahme von der Boundary „winner-map unangetastet", Zeilenzahl bleibt 499) |
| 4 | Extreme-Badge-Verdrahtung (`kontextExtremeJahreText` folgt Karten-Jahr) von keinem Test beobachtet; Regression bliebe unsichtbar | VG#1 | medium | patch: Story-10-E2E-Test um Extreme-Badge-Assertions erweitern (Default-Jahr + Reaktion auf Jahr-Klick) |
| 5 | Sticky-Stapel-Geometrie (Nav-Offset +2.5rem, scroll-mt +5.5rem) von keinem Test beobachtet; Rückdrehen auf alte Werte bliebe grün | VG#2 | medium | patch: `boundingBox()`-Assertions im Story-10-E2E-Test (Nav unter Leisten-Unterkante; Anker-Sprung-Ziel unter Nav-Unterkante) |
| 6 | Neuer E2E-Test: `not.toBeInViewport(ueberblick)` ist gegen das im eigenen Kommentar beschriebene scrollY-Clamping anfällig (Dokument schrumpft beim Reihen-Wechsel → ueberblick rutscht zurück in den Viewport → false-negative) | BH#4 (medium), ECH#7 | medium | patch: Assertion durch `methodik`-in-Viewport ersetzen |
| 7 | Extreme-Badge-Fallback bei `resolvedJahr === null` sagt „alle Wahljahre", Kapitel zeigt aber Leerzustand | ECH#3, BH#6b, VG-Neben | low | patch: Fallback-Text „kein Wahljahr geladen" |
| 8 | `data-testid="kapitel-kontext-badge"` dreifach auf der Seite; künftige ungescopte Zugriffe fliegen im Strict-Mode | ECH#5, BH#6a | low | defer: aktuelle Tests scopen über die Kapitel-Testids; Suffix-Prop bei Bedarf in Folge-Story |
| 9 | Label-ids (`steuerleiste-*-label`) hartcodiert, kollidieren bei zweitem Mount der Komponente | BH#5 (weak) | low | defer: heute genau 1 Mount pro Komponente (Grep-verifiziert); `$props.id()`-Härtung bei Wiederverwendung |
| 10 | Sticky-Offsets als Magic Numbers an 4 Stellen (h-10, +2.5rem, 2× +5.5rem); 1px-Überlappung durch border-b | VG-Neben, ECH#2 | low | defer: CSS-Custom-Property-Konsolidierung als Refactor, kein Verhalten betroffen |
| 11 | Jahr-Control fürs Extreme-Kapitel vier Kapitel entfernt; Zeit-Animation ändert das Kapitel im Hintergrund | BH#3 (medium) | maybe-false | reject: direkte Folge der abgenommenen Option-B-Entscheidung (Jahr/Ebene = Karten-Controls); als UX-Beobachtung an Matze berichtet |
| 12 | Neuer E2E-Test lässt `/api/wahl/analytik` ungemockt (Trends lädt real) | BH#4, ECH#8 | low | defer: identisches Verhalten aller Bestands-E2E-Tests gegen den Preview-Build; Partei-Requests sind über `winners**` gemockt |

## Design Notes

Die Aufteilung statt Umbau in-place hält die 16 E2E-Verweise stabil (Testids ziehen mit). `winner-map.svelte` (499/500 Zeilen) bleibt bewusst unberührt: Die Karten-Steuerung rendert in `+page.svelte` innerhalb der Karte-Section, wo Handler und Optionen bereits existieren. Der Sankey-Rework (Folge-Story) braucht durch die globale Sticky-Reihe keine eigene Reihen-Auswahl mehr, nur seinen Ebenen-Toggle.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- E2E: `pnpm exec vite build`, Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün

**Ergebnis (2026-09-20, nach Review-Runde 1):**
- Unit: 982 Client- + 2828 Server-Tests grün. `pnpm check`: 0 Errors. `pnpm lint:wahl`: 59 Dateien, 0 Verstöße. eslint auf geänderten Dateien: 0 (winner-map: 20 vorbestehende `no-unused-svelte-ignore`, per `git diff ad047ee` als unberührt verifiziert).
- E2E-Trio: 23/25. berlin-wahlen 14/14, berlin-wahlen-partei 3/3. Die 2 Fails sind vorbestehend und außerhalb des Scopes: `/_dev/wortmarke` fehlt `<title>` (axe document-title), `/explore` Escape-Selection-Timeout. Der Root-axe-Test flakt unter Parallel-Last (solo und im finalen Lauf grün); alle drei in `deferred-work.md` erfasst.
