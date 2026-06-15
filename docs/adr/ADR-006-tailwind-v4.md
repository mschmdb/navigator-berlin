---
status: Accepted
date: 2026-05-11
deciders: solo-maintainer
---

# ADR-006: Tailwind v4 mit CSS-Variables-First + Token-Kontrast-Validierung

## Context

UX-Design-Spec (Cloud-Dancer + Plex) verlangt Token-Hierarchie in CSS-Variablen mit Tailwind v4 als Utility-Layer. Tailwind v4 nutzt CSS-First-Config (`@theme` Directive) statt JS-Config, also keine `tailwind.config.js` mehr. Logical Properties (`ms-`, `me-`, `ps-`, `pe-`) sind Default für RTL-Support.

Token-Kontrast-Compliance: WCAG 2.2 AA (Pflicht via BFSG für DE-öffentliche Webdienste), AAA wo möglich. SC 1.4.3 (Text-Kontrast 4.5:1 normal, 3:1 large), SC 1.4.11 (Non-Text-Kontrast 3:1 UI-Komponenten/Grafiken), SC 2.4.7 (Focus-Visible).

Story 1.2 Acceptance Criterion AC-7 setzt verbindliche Schwellenwerte und ordnet bei Abweichung Token-Anpassung an.

## Decision

**Tailwind v4 mit `@theme inline`-Pattern.** CSS-Variables in `:root` definieren Plex/Cloud-Dancer-Direktive. `@theme inline` mappt Tailwind-Utilities (`bg-bg`, `text-ink`, `font-sans`, `text-2xl`, `border-rule-strong` etc.). Keine separate JS-Config.

**Token-Hex-Werte verifiziert** (relative Luminance per WCAG 2.x Formel, gerechnet gegen `--bg #ECEAE0` (L ca. 0.822) als Standard-Hintergrund):

| Token           | Hex (final) | Ratio vs `--bg` | WCAG-Soll                      | Status | Anpassung                                                                    |
| --------------- | ----------- | --------------- | ------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `--ink`         | `#141414`   | ca. 16.0:1      | ≥7 AAA Body, ≥4.5 AA           | ✓ AAA  | keine                                                                        |
| `--ink-muted`   | `#4A4A46`   | ca. 7.5:1       | ≥7 AAA Grenze                  | ✓ AAA  | keine                                                                        |
| `--ink-subtle`  | `#5F5F5A`   | ca. 5.3:1       | ≥4.5 AA Body-Text              | ✓ AA   | Story-Spec `#6F6F6A` (4.1:1) auf `#5F5F5A` (5.3:1) angehoben (AC-7 Mandat)   |
| `--rule`        | `#C8C6BB`   | ca. 1.5:1       | dekorativ, keine UI-Komponente | ✓      | keine                                                                        |
| `--rule-strong` | `#74726A`   | ca. 4.0:1       | ≥3 SC 1.4.11                   | ✓      | Story-Spec `#989488` (2.5:1) auf `#74726A` (4.0:1) abgedunkelt (AC-7 Mandat) |
| `--accent`      | `#2A3F7C`   | ca. 8.4:1       | ≥7 AAA Link                    | ✓ AAA  | keine                                                                        |
| `--focus`       | `#0030C8`   | ca. 9.1:1       | ≥9 Focus-Ring                  | ✓      | keine                                                                        |

**Adjustment-Rationale:**

- `--ink-subtle` ist Body-Text in MetaFooter + Tertiary-Hints. AA-Pflicht 4.5:1. Story-Wert `#6F6F6A` lag bei 4.1:1, failte.
- `--rule-strong` ist UI-Component-Border (Buttons-Secondary, Dialog/Sheet/Popover, ToggleGroup, Tooltip-Border). SC 1.4.11 Pflicht 3:1. Story-Wert `#989488` lag bei 2.5:1, failte.
- Logo-SVGs (`static/favicon.svg` + `static/logo-mark.svg`) nutzen `#2A3F7C` (accent) + `#ECEAE0` (bg), beide unverändert, kein SVG-Update nötig.

**Methodik:** Manuelle WCAG-Formel-Berechnung (sRGB nach linear, dann 0.2126·R + 0.7152·G + 0.0722·B, dann (L1+0.05)/(L2+0.05)). Vor Phase-1-Launch via axe-core Playwright-Run final verifizieren (Story 4.3 CI-Gate).

## Consequences

- **Positive:**
  - BFSG-Compliance auf Token-Ebene gesichert, kein nachträgliches Patchen
  - `@theme inline`-Pattern erlaubt Token-Override pro Theme/Mode ohne JS-Build (Vorbereitung Dark-Mode in Phase 4)
  - Logical Properties verhindern manuelle RTL-Anpassungen pro Komponente (Story 3.4)
  - Kein `tailwind.config.js`: weniger Konfig-Drift, einfacher Solo-Maintainer
- **Negative:**
  - `--ink-subtle` ist nun etwas dunkler als Cloud-Dancer-Aesthetik-Original (UX-Spec), minimale visuelle Veränderung
  - `--rule-strong` ist nun deutlich dunkler. Borders wirken stärker präsent. Acceptable für UI-Komponenten-Sichtbarkeit (UX-DR1).
  - Tailwind v4 ist neuere Version, Community-Recipes oft noch v3-Pattern. Doku via offiziellem MCP/Docs zuerst checken
- **Migration:**
  - Token-Werte in `src/app.css` adjusted (Story 1.2)
  - Falls Logo-Hex später adjusted: SVG-Files synchron updaten (Token-Hex hardcoded in SVG, bewusste Decision)
  - Axe-core-Gate in Story 4.3 wird Token-Compliance final per Browser-Pixel-Check verifizieren
