---
title: 'Pixel-Logo leichter ausliefern (ca. 79 KB weniger HTML pro Seite)'
type: 'refactor'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '6cf6282444c4fb05dadc8600492c91debf33117e'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Jede Seite liefert das Pixel-Logo zweimal inline aus (Header 64 px, Footer 36 px), je ca. 39,5 KB. Jede der 296 Zellen wiederholt x, y, width, height, rx, fill und eine Style-Variable. Bezirksseiten wiegen dadurch über 200 KB HTML, davon ca. 79 KB Logo. Das bremst den mobilen ersten Aufbau, also genau die Such-Einsteiger mit hohem Absprung.

**Approach:** Header bleibt inline und animiert, aber kompakt: eine gemeinsame Zellform in `<defs>`, je Zelle nur ein `<use>` mit Position und Farbe. Der Footer zeigt die vorhandene statische Datei `static/logo-pixel.svg` als Bild (gecacht, ohne Animation). Aussehen, Preset, Palette und Seed bleiben unverändert.

**Entscheidungen (Empfehlung zur Freigabe):**
- Header: inline, Farbwechsel-Animation bleibt, Markup über `<defs>`/`<use>`; Ziel ≤ 14 KB.
- Footer: `<img src="/logo-pixel.svg" alt="">` innerhalb des bestehenden Links (Name kommt vom Link), keine Animation.
- Karten-Ladeanimation (`variant="loop"`, nur während die Karte lädt) bleibt inline, nutzt aber dasselbe kompakte Markup.

## Boundaries & Constraints

**Always:** PRESET, Seed, 296 Zellen, PALETTE unverändert (Kommentar in `pixel-logo-geometry.ts`: keine Umfärbung ohne Owner). SSR/Hydration deterministisch. `prefers-reduced-motion` stoppt die Animation. Loop-Variante behält `role="status"`. Header- und Footer-Link heißen weiter „navigator.berlin“. OG-Dateien (`logo-mark*.svg`) unverändert. `--header-height` 72 px.

**Never:** Keine neue Logo-Gestaltung, keine Änderung an Größe oder Position im Header/Footer.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Header | jede Seite | Logo sieht gleich aus, Farbwechsel läuft, Markup ≤ 14 KB | N/A |
| Footer | jede Seite | statisches Bild, gleiches Raster, Link-Name „navigator.berlin“ | Bild fehlt → Link bleibt bedienbar (alt leer, Name am Link) |
| Reduced Motion | Nutzereinstellung | keine Animation | N/A |
| Karte lädt | `/explore` | Loop-Animation wie bisher | N/A |
| Seitengewicht | `/bezirk/treptow-koepenick` | HTML mindestens 60 KB kleiner als vorher (206 KB) | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/ui/pixel-logo.svelte` (Z. 85-111 `{#each}` über 296 `<rect>`, `$effect`-Timer 75-85, Transition 127, Loop-Keyframes 131-155) -- auf `<defs><rect id>` + `<use>` umstellen; Farbe und `--d` am `<use>`. Zell-ID pro Instanz eindeutig (mehrere Logos auf einer Seite).
- `src/lib/data/pixel-logo-geometry.ts` -- PRESET (125), PALETTE (80), `initialFills` (183): nur lesen.
- `scripts/generate-pixel-logo.ts`, `static/logo-pixel.svg` (12 KB, bereits `<defs>`/`<use>`) -- Vorlage für das Markup; Footer nutzt die Datei.
- `src/lib/components/atlas/site-header.svelte:108-112`, `meta-footer.svelte:58-61`, `map-libre-canvas.svelte:219`.
- Tests: `pixel-logo.svelte.test.ts` (296 Zellen, viewBox, Palette, Determinismus, Rolle/Name, Farbwechsel) anpassen auf `<use>`; `site-header.svelte.test.ts:23-24` hängt an der Reihenfolge der Texttreffer.
- `tests/e2e/a11y.e2e.ts:76-82` öffnet `/_dev/wortmarke`, die Route ist nicht im Repo (prüft vermutlich eine 404-Seite) -- nicht Teil dieser Story, im Deferred notieren.

## Tasks & Acceptance

**Execution:**
- [x] `pixel-logo.svelte.test.ts` -- Red: Markup nutzt `<use>`, 296 Zellen, gleiche Fills wie vorher (Snapshot der Fill-Folge), Größe der SSR-Ausgabe ≤ 14 KB.
- [x] `pixel-logo.svelte` -- Green.
- [x] `meta-footer.svelte` + Test -- statisches Bild, Link-Name bleibt.
- [x] E2E: HTML-Größe `/bezirk/treptow-koepenick` < 146 KB; Header-Logo sichtbar; Footer-Bild lädt.

**Acceptance Criteria:**
- Given eine Bezirksseite, when man das HTML misst, then ist es mindestens 60 KB kleiner als vor der Änderung, und Header- und Footer-Logo sehen unverändert aus.

## Implementation Notes

- Header-Logo: eine Zellform in `<defs>`, 296 `<use>` mit Rasterposition (`Math.round`, Zeilen per `Map`), Farbe als Klasse `c0`–`c19` über CSS-Variablen aus `PALETTE`; CSS in globalem `pixel-logo.css` (Svelte-Hash-Klassen hätten ~6 KB je Logo gekostet). Status-Text nutzt Tailwind `sr-only`.
- Footer: `<img src="/logo-pixel.svg" alt="" loading="lazy" decoding="async">` im bestehenden Link.
- Tests: Zellpositionen gegen `buildGeometry` (Toleranz 0,05), Palette-Indizes, SSR-Ausgabe ≤ 14 KB, Gleichstand `static/logo-pixel.svg` mit `renderPixelSvg()`, Footer-Linkname DE.
- Ergebnis: `/bezirk/treptow-koepenick` 147.572 Byte (vorher ~206 KB), `/kiez/reuterstrasse` 111.254, `/` 77.633. Header und Footer visuell geprüft (Screenshot 3×).
- Verifikation: Unit 3.516 grün, `pnpm check` 0, Build mit DB, E2E 87/87.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| VerifGap, Blind, Edge | Zellpositionen ungeprüft; `Math.floor` aus gerundeten Werten, Zeilengruppierung, nachgerechnete Größe | medium | patch |
| Blind, Edge | `PALETTE.indexOf` kann -1 liefern, feste 20 CSS-Klassen | low | patch (Test) |
| Blind, VerifGap | `sr-only` kopiert, Verstecken ungetestet | low | patch |
| Blind | `static/logo-pixel.svg` kann vom Header abweichen | medium | patch (Snapshot-Test) |
| Blind | Footer-Bild ohne lazy/async; Test nur EN, Link-Name nicht geprüft | low | patch |
| Blind, Edge | E2E-Titel „höchstens“ vs. `toBeLessThan` | low | patch |
| Blind | Doppelte Kompakt-Logik in Komponente und Generator-Script | low | reject: Snapshot-Test sichert Gleichstand, gemeinsame Funktion wäre Umbau des Scripts |
| Blind | Palette als Inline-Variablen je Instanz (~260 B) | low | reject: zwei Instanzen pro Seite, vernachlässigbar |
| Blind | E2E misst Gesamt-HTML statt Logo-Anteil | low | reject: AC verlangt Gesamtgröße; Logo-Anteil sichert der SSR-Test |
| VerifGap, Blind | Reduced Motion für `use`-Zellen ungetestet, Kommentar ungenau | medium | defer: vorher ebenfalls ungetestet, braucht E2E-Kontext mit `reducedMotion` |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/components/ui src/lib/components/atlas` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config -- expected: grün
