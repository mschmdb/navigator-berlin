---
type: runbook
audience: owner
last-verified: 2026-05-17
---

# Runbook: A11y-Smoke-Test (NVDA + VoiceOver)

Erfüllt: NFR-A1, NFR-A5. Quelle: Story 1.8.

## Frequenz

Pflicht vor jedem Major-Release. Empfohlen bei größeren UI-Changes (Layer-Palette, Inspector, Karten-Interaktion).

## Vorbereitung

- Test-Build via `pnpm build && pnpm preview` lokal oder Staging-URL
- Browser: Firefox aktuell (NVDA) und Safari (VoiceOver). Chromium für axe-core (siehe `tests/e2e/a11y.e2e.ts`)
- Reduzierte Bewegung optional aktivieren (System-Setting), zur Verifikation der `prefers-reduced-motion`-Pfade

## NVDA (Windows 11, Firefox)

1. NVDA starten (Insert oder CapsLock = NVDA-Modifier)
2. Adresse aufrufen: `https://staging.navigator.berlin/de/`
3. Tab durch Page: erwartet
   - SkipLink (versteckt, sichtbar bei Focus, Text „Zum Hauptinhalt springen")
   - Logo-Link
   - AddressSearch-Combobox
   - (optionaler LanguageSwitcher)
   - Map-Container (`role="application"`)
   - MapAccessibilityLayer-Buttons (visible-bei-focus-within)
   - MapControls (Pan/Zoom-Buttons)
4. SkipLink Enter → Fokus springt zu `<main id="main">`, NVDA liest „Hauptinhalt, Region"
5. Tab zum Map-Container: NVDA liest „Berlin-Karte, anwendung. Pfeiltasten zum Verschieben…"
6. Pfeiltasten: Karte verschiebt sich. Plus/Minus zoomt
7. Tab → MapAccessibilityLayer wird sichtbar (focus-within-Pattern). NVDA liest Layer-Name + Beschreibung pro Button
8. Enter auf POI-Button → ARIA-Live-Region announcet `{Layer-Name}: {Beschreibung}`
9. Escape → Marker entfernt, Live-Region „Auswahl entfernt"
10. AddressSearch wählen → Karte zoomt + Live-Region „Karte gezoomt auf {displayName}, Bezirk {bezirk}"

### NVDA-Browse- vs. Focus-Mode

`role="application"` kann NVDA-Browse-Mode überschreiben. Workaround: NVDA+Space zwingt Focus-Mode. Im Runbook dokumentiert für User-Support.

## VoiceOver (macOS Tahoe, Safari)

1. VoiceOver starten (Cmd+F5)
2. Sequenz wie NVDA, jedoch:
   - VO+A bestätigt aktuelle Element-Description
   - VO+Cmd+Right Arrow durch POI-Liste navigieren
3. Erwartet: VoiceOver liest `aria-current="true"` als „ausgewählt"

## Erwartete Outputs

- Help-Region wird beim ersten Map-Fokus gelesen
- POI-Buttons sprechen „{Layer-Name}, {Beschreibung}" (z.B. „Bezirke, Bezirk: Mitte, 380.000 Einwohner")
- Live-Region announcet nach Selection
- Live-Region clear nach 5s (Auto-Clear, verhindert Stale-Announcements)
- Keine Doppel-Announcements
- Keine toten Foci (Tab landet überall)

## SC 2.5.7 Dragging Movements

Pan/Zoom hat Tasten-Alternative (`MapControls` Story 1.7): 4 Pfeil-Buttons + 2 Zoom-Buttons.

**TODO Story 1.10:** Bottom-Sheet Layer-Palette muss expliziten Toggle-Button bekommen, nicht nur Swipe-Geste.

**TODO Story 1.9 Phase 2:** Inspector-Panel-Resize via Button-Paar (Vergrößern/Verkleinern), nicht nur Drag-Handle.

## Focus-Ring & Sticky-Header

`scroll-margin-top: calc(var(--header-height) + 0.5rem)` schützt den Map-Container-Focus-Ring vor sticky-Header-Überdeckung. Token `--header-height: 56px` in `src/app.css`. Header enforced `min-height` via CSS-Custom-Property.

Visual-Check pre-Release: Tab zum Map-Container, Header verdeckt Outline nicht.

## Bekannte Issues

- NVDA-Browse-Mode überschreibt `role="application"`-Behavior — Workaround NVDA+Space für Focus-Mode
- VoiceOver liest `aria-current="true"` als „ausgewählt" — gewünschtes Verhalten
- MapAccessibilityLayer-Liste bleibt leer bis Story 1.10 (custom Layer noch nicht via `addSource`/`addLayer` registriert). Nach Story 1.10 testen, dass `queryRenderedFeatures` Bezirke/LOR/Stolperstein/Lärm zurückgibt

## Pre-Release-Checkliste

- [ ] NVDA-Walkthrough komplett, keine toten Foci
- [ ] VoiceOver-Walkthrough komplett
- [ ] Help-Region lesbar
- [ ] ARIA-Live announcet nach jedem Selection-Event
- [ ] Focus-Ring sichtbar trotz sticky-Header
- [ ] Lighthouse Accessibility-Score ≥ 95
- [ ] axe-core CI-Gate grün (`tests/e2e/a11y.e2e.ts`)
- [ ] Tab-Order-E2E grün (`tests/e2e/tab-order.e2e.ts`)

## Bei Failure

- GitHub-Issue mit Label `a11y` öffnen
- Release blockieren bis Critical-Findings (Level A/AA-Violations) gefixt
- Level-AAA-Findings dürfen Release nicht blockieren, dokumentieren als Follow-up
