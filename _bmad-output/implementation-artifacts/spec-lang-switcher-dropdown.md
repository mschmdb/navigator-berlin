---
title: 'Sprachumschalter als Dropdown im Header'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: '183d61d3a70c6a024ce5771dfd5f6c444859afdc'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Sprachumschalter im Header ist eine Linkliste („Deutsch English“). Das skaliert schlecht auf weitere Sprachen (es/tr geplant) und wirkt im Header unruhig. Matze wünscht einen Umschalter wie https://shadcn-svelte-extras.com/docs/components/language-switcher: ein Knopf mit Sprach-Icon und ein Dropdown mit den Sprachen.

**Approach:** Wir bauen die Komponente nach, nicht per jsrepo, weil das Projekt kein shadcn-svelte-Setup hat.
- Neuer Wrapper `ui/dropdown-menu.svelte` auf bits-ui DropdownMenu im Projekt-Design, analog `ui/popover.svelte`.
- `lang-switcher.svelte` bekommt eine Variante `dropdown`. Sie gilt im Header.
- Mobile-Drawer und Footer behalten die Linkliste.

## Boundaries & Constraints

**Always:**
- Freigabe Ansatz Matze 27.09. 09:02 („einverstanden“).
- Trigger:
  - `Languages`-Icon aus `@lucide/svelte` plus Locale-Kürzel („DE“/„EN“).
  - Zugänglicher Name aus Message, z.B. „Sprache: Deutsch“/„Language: English“.
- Einträge:
  - Echte `<a>`-Links auf `localizedHref(currentPath, locale)` mit `data-sveltekit-reload`, `lang`, `hreflang`.
  - Sprachname in der Zielsprache (`Intl.DisplayNames`).
  - Aktive Sprache mit Häkchen, `aria-current="true"` und sr-only-Hinweis, nicht als Link.
- Ohne JavaScript bleibt ein funktionierender Weg: SSR rendert einen Fallback-Link oder die Liste für no-JS.
- Tastatur und Fokus über bits-ui: Enter/Space/Pfeile/Escape, Fokus zurück auf den Trigger.
- WCAG 2.2: Zielgröße ≥ 24px, sichtbarer Fokus, Kontrast wie im Header.
- N-Locale-fähig (Iteration über `locales`).
- Bestehende Testids (`lang-switcher`, `lang-switcher-link`, `lang-switcher-current`) bleiben erhalten. `i18n-routing.e2e.ts` läuft weiter grün, Anpassung nur, wo das Dropdown erst geöffnet werden muss.
- TDD pro AC.

**Never:**
- Kein shadcn-svelte-/jsrepo-Setup, kein `components.json`, keine neuen Abhängigkeiten außer bereits vorhandenen (bits-ui, @lucide/svelte).
- Keine Client-seitige Locale-Umschaltung ohne Reload.
- Footer- und Drawer-Darstellung nicht ändern.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Header DE | `/explore` | Knopf „DE“ mit Icon; Dropdown: „Deutsch ✓“ (aktuell), „English“ → `/en/explore` | N/A |
| Header EN | `/en/kiez/x` | Knopf „EN“; „Deutsch“ → `/kiez/x` | N/A |
| Tastatur | Tab auf Knopf, Enter, Pfeil, Enter | Seite wechselt Sprache (Reload) | Escape schließt, Fokus zurück |
| Mobile | Viewport < sm | Header-Dropdown unsichtbar, Drawer zeigt Liste wie heute | N/A |
| Footer | jede Seite | Liste wie heute | N/A |
| Ohne JS | Seite ohne Hydration | Sprachwechsel weiter möglich | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/lang-switcher.svelte` (Linkliste, Props `currentPath`, `landmark`): neue Prop `variant: 'list' | 'dropdown'`, Default `list`. Die Liste bleibt unverändert.
- Neu `src/lib/components/ui/dropdown-menu.svelte` (bits-ui `DropdownMenu`, Stil wie `ui/popover.svelte`: `border-rule-strong`, `bg-bg-elevated`, `text-ink`, kein Schatten). Export in `ui/index.ts`.
- `src/routes/(with-header)/+layout.svelte:89-103`: Das `langSwitcher`-Snippet geht an `site-header` und `MobileMetaDrawer`. Header und Drawer brauchen verschiedene Varianten: zwei Snippets oder ein Parameter. `site-header.svelte:216-217` (Header-Slot, `hidden sm:block`) bekommt `dropdown`, `:241` Drawer bekommt `list`.
- `src/routes/+layout.svelte:102-108` Footer: bleibt `list`.
- Messages: `lang_switcher_label`, `lang_switcher_current` vorhanden. Neu: Trigger-Name.
- Tests: `lang-switcher.svelte.test.ts`, `tests/e2e/i18n-routing.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `ui/dropdown-menu.svelte` + Test (Öffnen, Escape, Fokus-Rückgabe)
- [x] `lang-switcher.svelte` Variante `dropdown` + Tests (Links, aktive Sprache, Namen in Zielsprache, no-JS-Fallback)
- [x] Layout/Header-Verdrahtung: Header `dropdown`, Drawer und Footer `list`
- [x] e2e: Sprachwechsel über das Dropdown (Maus und Tastatur), bestehende i18n-routing-Tests grün
- [x] Zeitmessung

**Acceptance Criteria:**
- Given eine Seite mit Header auf Desktop, when der Nutzer den Sprachknopf öffnet und „English“ wählt, then lädt dieselbe Seite unter `/en/…`.
- Given Tastaturbedienung, when der Nutzer das Dropdown mit Enter öffnet, mit Pfeiltasten wählt und Escape drückt, then schließt es und der Fokus liegt wieder auf dem Knopf.
- Given Mobile-Drawer und Footer, when sie rendern, then zeigen sie die Linkliste wie bisher.

## Implementation Notes

- 27.09. 09:03 Start Planung, Inventur Koordinator direkt. Umsetzung nach dem Banner-Commit (gleiches Layout). 09:03 Checkpoint 1 durch Matze („freigeben weiter“).
- 27.09. 09:36 Umsetzung fertig (TDD pro AC, Red→Green je Datei): `ui/dropdown-menu.svelte` (neuer Wrapper), `lang-switcher.svelte` Variante `dropdown`, Header/Drawer-Verdrahtung über zwei getrennte Snippet-Props (`langSwitcher`/`langSwitcherDrawer`) an `site-header.svelte`. `pnpm exec vitest run` (4749 Tests) und `pnpm check` grün. `pnpm build` + volle `i18n-routing`-e2e-Suite (51 Tests, inkl. 3 neuer Dropdown-Tests + 1 No-JS-Fallback-Test mit `javaScriptEnabled: false`) 4× wiederholt grün.
- Ein Flake gefunden und gefixt (nicht in der Spec vorgesehen, aber blockierend für „e2e grün"): bits-ui verschiebt beim Öffnen den DOM-Fokus asynchron auf das erste Menu-Item; ein sofortiges Escape traf gelegentlich einen Zwischenzustand und der Fokus-Rücksprung auf den Trigger schlug fehl. Fix: kurze Wartezeit (100ms) zwischen Öffnen und Escape im Tastatur-Test, siehe Kommentar dort.

- Zeitmessung gesamt (Koordinator): Planung 09:03 (inkl. Freigabe Matze), Umsetzung 09:15-09:41 (26 min), Review 09:41-09:43, Patch-Runde 09:43-09:58 (15 min), Abschluss 09:59. Gesamt rund 45 min.
- Qualität: 25 Review-Funde in 15 Einträgen (3 medium Barrierefreiheit: ARIA-Menü, Label in Name, Fokus), 11 gepatcht, 4 rejected. Abschluss: vitest 4753/4754 (winner-map-Flake), check 0, e2e i18n-routing 52/52 (4× wiederholt).


## Review Triage Log

Runde 1 (27.09.2026 09:43), 3 Layer: Blind Hunter (BH) 11, Edge Case (EC) 10, Verification Gap (VG) 1 + 2. Triage Koordinator. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Aktive Sprache als `<div aria-current>` direkt in `role="menu"` | medium | ARIA `aria-required-children`, per Pfeiltaste unerreichbar | P: deaktiviertes Menü-Item mit Häkchen und sr-only-Hinweis |
| 2 | BH/EC | Label in Name: sichtbar „DE“, Name „Sprache: Deutsch“ | medium | WCAG 2.5.3 | P: Name beginnt mit sichtbarem Kürzel |
| 3 | BH | Kein sichtbarer Tastaturfokus an Trigger und Items | medium | WCAG 2.4.7 | P |
| 4 | BH/EC | Ohne JS toter Trigger neben `<noscript>`-Liste | low | | P: Trigger erst nach Mount |
| 5 | EC | Menü-Portal außerhalb des Sprach-Landmarks | low | übliches Portal-Verhalten, Header clippt sonst | R |
| 6 | EC | Menü offen, Viewport schrumpft unter sm | low | selten, Escape/Klick schließt | R |
| 7 | BH/EC | e2e mit `waitForTimeout` statt Zustands-Warten | gap | Flake-Risiko | P |
| 8 | BH/EC | Tastatur-e2e prüft Pfeiltaste nicht, Selektoren setzen genau 2 Locales voraus | gap | N-Locale-Ziel | P |
| 9 | BH | `Record<string, unknown>` statt bits-ui-Typen | low | Projektregel typsicher | P |
| 10 | BH | Wrapper-Tests ohne `bind:open`/`class`, `landmark={false}` im Dropdown ungetestet | gap | | P |
| 11 | BH | `static/kiez-scores/region-composites.json` Build-Artefakt im Diff | low | | P: zurücksetzen |
| 12 | BH | Prettier-Hunks in `site-header` | low | | R |
| 13 | BH | Veralteter Zeilenverweis im Layout-Kommentar | low | | P |
| 14 | BH | Zeitmessung/Change Log in Spec | low | Fix editiert Spec | R |
| 15 | VG | Drawer-Verdrahtung (`langSwitcherDrawer`) ohne Test | gap | VG vorverifiziert | P: Mobile-e2e |

## Verification

**Commands (alle ausgeführt, 27.09.):**
- `pnpm exec vitest run` → 4749 Tests grün (0 fehlgeschlagen).
- `pnpm check` → 0 Fehler, 0 Warnungen.
- `pnpm build` + `pnpm exec playwright test tests/e2e/i18n-routing.e2e.ts` → 51/51 grün, 4× in Folge wiederholt zur Flake-Kontrolle.
