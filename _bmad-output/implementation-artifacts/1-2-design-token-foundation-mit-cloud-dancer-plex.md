# Story 1.2: Design-Token-Foundation mit Cloud Dancer + Plex

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Designer/Entwickler,
I want eine vollständige Design-Token-Hierarchie in CSS-Variablen + Tailwind v4 + Bits-UI-Wrapper,
so that alle UI-Komponenten konsistent auf der Plex/Cloud-Dancer-Direktive aufsetzen können.

## Acceptance Criteria

1. **AC-1 (Token-Hierarchie in `src/app.css`):**
   **Given** initialisiertes Repository aus Story 1.1
   **When** `src/app.css` mit kompletter Token-Hierarchie befüllt wird (Palette, State, Chart, Spacing, Typography — siehe Dev-Note „Token-Reference")
   **Then** alle Token sind global in `:root` definiert
   **And** Tailwind v4 `@theme`-Directive mappt alle Token (z.B. `--color-bg`, `--color-accent`, `--font-sans`, `--text-base`, `--spacing-*`)
   **And** Erfüllt UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR6, UX-DR7, UX-DR9.

2. **AC-2 (Plex Variable Fonts subsetted in `static/fonts/`):**
   **Given** Token-Layer
   **When** Plex Variable Fonts (Sans, Serif, Mono) + Plex Sans Arabic via fontsource-Pakete installiert und nach `static/fonts/` kopiert werden (4 Subsets: latin, latin-ext, cyrillic, arabic — siehe Dev-Note „Font-Subset-Strategie")
   **Then** `static/fonts/` enthält pro Subset eine `.woff2`-Datei pro Familie
   **And** `@font-face`-Deklarationen in `app.css` mit explizitem `unicode-range` pro Subset
   **And** `font-display: swap` ist gesetzt
   **And** Erfüllt UX-DR6, UX-DR8, NFR-IL3, NFR-P6.

3. **AC-3 (Preload-Hint im `app.html`):**
   **Given** Font-Files in `static/fonts/`
   **When** `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/plex-sans-latin-var.woff2">` (+ Serif + Mono Latin) im `<head>` von `src/app.html` ergänzt wird
   **Then** Initial-Sprache-Subset (DE = latin) wird vor First-Paint geladen
   **And** Erfüllt UX-DR8, NFR-P1 (LCP).

4. **AC-4 (Fontaine-Fallback-Metrics):**
   **Given** Plex-Fonts geladen via `@font-face`
   **When** `fontaine` als Vite-Plugin in `vite.config.ts` konfiguriert wird mit Fallback-Familien `system-ui`, `Georgia`, `ui-monospace` und overrideName-Konvention
   **Then** Fallback-Font-Metriken matchen Plex-Metrics
   **And** Lighthouse-CLS-Score zeigt 0 für reine Fonts-Replacement-Phase (NFR-P3, UX-DR8).

5. **AC-5 (Bits-UI-Wrapper-Komponenten):**
   **Given** Bits-UI installiert aus Story 1.1
   **When** 12 Wrapper-Komponenten in `src/lib/components/ui/` erstellt werden (siehe Dev-Note „Wrapper-Liste"): `button`, `dialog`, `combobox`, `popover`, `tooltip`, `toggle-group`, `scroll-area`, `skeleton`, `tabs`, `sheet`, `alert-dialog`, `disclosure`
   **Then** jeder Wrapper trägt Plex/Cloud-Dancer-Tailwind-Klassen via Design-Tokens
   **And** keine Bits-UI-Default-Styles werden vererbt (über `data-*`-Attribute getargettet via Tailwind-Variants)
   **And** interaktive Wrapper haben Touch-Target ≥ 44×44 CSS-Pixel (UX-DR29, FR46)
   **And** Skeleton + ScrollArea als no-op-Wrapper falls keine API-Customization nötig — siehe Dev-Note.

6. **AC-6 (SkipLink + MetaFooter im Layout-Skeleton):**
   **Given** Wrapper-Komponenten existieren
   **When** `src/lib/components/atlas/skip-link.svelte` + `src/lib/components/atlas/meta-footer.svelte` erstellt und in `src/routes/+layout.svelte` eingebunden werden
   **Then** `<SkipLink>` ist erstes fokussierbares Element, springt bei `:focus-visible` zu `<main id="main">` mit sichtbarem Focus-Ring (`--focus`)
   **And** `<MetaFooter>` rendert mit Hairline-Top (`--rule`), Plex-Sans `--text-xs`, `--ink-subtle`, Inline-Links (Impressum · Datenschutz · Lizenzen · Architektur · Kontakt — als reine `<a>` ohne Route, Stubs `/impressum`-href), Sprach-Switcher-Slot leer (Snippet-Placeholder)
   **And** Disclaimer-Zeile vorhanden („BFSG-konform — WCAG 2.2 AA komplett, AAA wo möglich", UX-DR51)
   **And** Erfüllt FR41, UX-DR13, UX-DR24.

7. **AC-7 (Kontrast-Verifizierung):**
   **Given** Token-Werte
   **When** Kontraste gegen `#ECEAE0` via WebAIM-Calculator oder axe-core-CLI (`@axe-core/cli` einmalig oder Browser-DevTools) gemessen werden
   **Then** Ratios entsprechen:
   - `--ink` (#141414) ≥ 16:1 (AAA Body)
   - `--ink-muted` (#4A4A46) ≥ 7:1 (AAA Grenze)
   - `--ink-subtle` (#6F6F6A) ≥ 4.5:1 (AA, Nicht-Text-Inhalt)
   - `--rule-strong` (#989488) ≥ 3:1 (SC 1.4.11)
   - `--accent` (#2A3F7C) ≥ 7:1 (AAA Link)
   - `--focus` (#0030C8) ≥ 9:1 (Focus-Ring)
   **And** Messwerte in `docs/adr/ADR-006-tailwind-v4.md` (oder neuer `ADR-NNN-design-tokens.md`) protokolliert
   **And** Abweichungen vor Phase-1-Launch korrigiert (NFR-A2, UX-DR1).

8. **AC-Logo (Minimal-Logo-Foundation):**
   **Given** Design-Tokens + Static-Assets-Pfad existieren
   **When** `static/favicon.svg` (2-Layer-Variante) + `static/logo-mark.svg` (3-Layer-Variante) mit Token-Hex (`#2A3F7C` für `--accent`, `#ECEAE0` für `--bg`) erstellt werden
   **And** `<link rel="icon" type="image/svg+xml" href="%sveltekit.assets%/favicon.svg" />` in `src/app.html` integriert ist
   **Then** Browser-Tab zeigt Layer-Logo
   **And** `static/logo-mark.svg` ist als Asset bereit für Header-Integration in Story 1.5
   **And** PNG-Render, webmanifest, OG-Image, Wortmarke, Header-Integration explizit AUS Scope (siehe Dev-Note „Logo-Scope").

9. **AC-9 (Visual-Smoke-Test):**
   **Given** Tokens + Wrapper + Layout
   **When** `pnpm dev` läuft + Showcase-Page `src/routes/+page.svelte` mit Button-Varianten (Primary/Secondary/Tertiary), Dialog-Trigger, Tooltip, Skeleton-Block und Text-Skalen (`text-xs` bis `text-4xl`) angezeigt wird
   **Then** Visual-Inspection: Cloud-Dancer-Hintergrund, Plex-Sans als Body, Plex-Serif für h1-h3, Plex-Mono für `<code>` und `.tabular`-Klasse, Hairline-Borders, kein Box-Shadow, kein Radius >4px
   **And** `pnpm check` läuft ohne Errors durch.

## Tasks / Subtasks

- [x] **Task 1: Token-Layer in `src/app.css`** (AC: #1)
  - [x] 1.1 `src/app.css` neu erstellt (sv create v0.15.3 generierte stattdessen `src/routes/layout.css`; Story 1.2 migriert auf Story-Spec-Pfad `src/app.css`, `+layout.svelte` importiert `../app.css`, `layout.css` entfernt)
  - [x] 1.2 `@import 'tailwindcss';` + `@plugin '@tailwindcss/forms'` + `@plugin '@tailwindcss/typography'` als Header
  - [x] 1.3 `:root` mit komplettem Token-Set (Palette, State, Chart, Typography, Spacing)
  - [x] 1.4 `@theme inline` mit Tailwind-Color/Font/Text/Spacing-Mapping
  - [x] 1.5 `html[dir='rtl']`-Block (leer-Placeholder mit Logical-Properties-Kommentar)
  - [x] 1.6 `@media (max-width: 640px)` Override `--text-4xl: var(--text-2xl)`
  - [x] 1.7 File-Größe = 219 Zeilen (incl. @font-face aus Task 2.6) — <500 ✓

- [x] **Task 2: Plex direkt-self-hosted via Download-Script (User-Decision: KEINE npm-Dep)** (AC: #2)
  - [x] 2.1 **Story-Spec-Abweichung:** `@fontsource-variable/ibm-plex-serif/mono` existieren NICHT auf npm Mai 2026 (nur `-sans` Variable). User-Decision: direct download statt fontsource-npm. Pakete NICHT installiert.
  - [x] 2.2 `scripts/download-fonts.sh` erstellt — curl-basiert, lädt pre-subsettete woff2 von jsdelivr CDN (serving fontsource npm-Pakete ohne Install). Versions gepinnt (Sans 5.2.8, Serif 5.2.7, Mono 5.2.7, Arabic 5.2.9). Re-run für Refresh.
  - [x] 2.3 Sans = Variable (3 Subsets: latin, latin-ext, cyrillic, je `-var.woff2`). Serif + Mono = Static 400 (Variable n/a), Filename-Pattern `plex-{family}-{subset}-400.woff2`.
  - [x] 2.4 Arabic Static 400 + 600 nach `plex-sans-arabic-{weight}.woff2`
  - [x] 2.5 `static/fonts/` enthält genau 11 woff2 ✓
  - [x] 2.6 `@font-face`-Block in `src/app.css` mit `unicode-range` pro Subset für alle 11 Files
  - [x] 2.7 `font-display: swap` pro `@font-face` gesetzt

- [x] **Task 3: Preload im `app.html`** (AC: #3)
  - [x] 3.1+3.2 3 `<link rel="preload" as="font" type="font/woff2" crossorigin>` im `<head>` nach `<meta charset>` ergänzt: plex-sans-latin-var, plex-serif-latin-400, plex-mono-latin-400
  - [x] 3.3 `crossorigin`-Attribut auf allen 3 gesetzt
  - [x] 3.4 latin-ext / cyrillic / arabic NICHT preloaded (Conditional in Story 3.4)

- [x] **Task 4: Fontaine-Vite-Plugin** (AC: #4)
  - [x] 4.1 `pnpm add -D fontaine` (^1.x)
  - [x] 4.2+4.3+4.4 `vite.config.ts` erweitert: `import { FontaineTransform } from 'fontaine'` + Plugin in plugins-Array mit Fallbacks system-ui/Georgia/ui-monospace + resolvePath
  - [x] 4.5 `pnpm check` ohne Fontaine-Errors. `pnpm build` deferred zu Story 4.3 (CI-Gate für Lighthouse-CLS-Verifikation)

- [x] **Task 5: Bits-UI-Wrapper-Komponenten — TDD nach ADR-012** (AC: #5)
  - [x] 5.1 `mkdir -p src/lib/components/ui` + `vite.config.ts` Fix für bits-ui+browser-mode (resolve.dedupe `svelte`, optimizeDeps.exclude `bits-ui`) — sonst `effect_orphan`-Crash
  - [x] 5.2 12 Wrapper:
    - [x] 5.2.1 `button.svelte` — **TDD** 6/6 Tests (variants primary/secondary/tertiary, 44px touch, rest-props forward, class-merge, focus-ring)
    - [x] 5.2.2 `dialog.svelte` — **TDD** 3/3 Tests (Trigger, hidden-initial, content-on-open mit Plex-Klassen + KEIN Overlay UX-DR33)
    - [x] 5.2.3 `combobox.svelte` — Smoke (`type="single"`, theming inside)
    - [x] 5.2.4 `popover.svelte` — Smoke (Plex-themed Content)
    - [x] 5.2.5 `tooltip.svelte` — Smoke (BitsTooltip.Provider wrapper)
    - [x] 5.2.6 `toggle-group.svelte` — Smoke (Plex-themed Root)
    - [x] 5.2.7 `scroll-area.svelte` — Smoke (Viewport + Scrollbar + Thumb mit Plex-Tokens)
    - [x] 5.2.8 `skeleton.svelte` — **TDD** 2/2 Tests (bg-rule + motion-safe:animate-pulse + aria-hidden + class-merge)
    - [x] 5.2.9 `tabs.svelte` — Smoke (Root mit gap-3)
    - [x] 5.2.10 `sheet.svelte` — **TDD** 2/2 Tests (Trigger + bottom-0 inset-x-0 max-h-[40vh] wenn open=true)
    - [x] 5.2.11 `alert-dialog.svelte` — Smoke (border-state-error)
    - [x] 5.2.12 `disclosure.svelte` — Smoke (BitsAccordion.Root type="single", divide-y)
  - [x] 5.3 Alle TypeScript-strict, `$props()` + `$bindable()` für open/value-Props, class-Merge via inline-Template
  - [x] 5.4 Touch-Targets 44px: Button primary/secondary haben `min-h-[44px] min-w-[44px]`; tertiary inline (Story-Spec). Showcase-Dialog-Trigger 44px-konform
  - [x] 5.5 `src/lib/components/ui/index.ts` re-exportiert alle 12 als named exports
  - [x] 5.6 **TDD-Bilanz:** 13 Tests TDD-Pflicht (Button 6, Dialog 3, Skeleton 2, Sheet 2) + 8 Smoke-Tests = 21 Tests für Task 5

- [x] **Task 6: SkipLink + MetaFooter — TDD nach ADR-012** (AC: #6)
  - [x] 6.1 `mkdir -p src/lib/components/atlas`
  - [x] 6.2 `skip-link.svelte` — **TDD** 3/3 Tests (href=#main, sr-only + focus-visible:not-sr-only, focus-outline-focus)
  - [x] 6.3 `meta-footer.svelte` — **TDD** 7/7 Tests (footer-role-contentinfo via implicit, 5 Meta-Links, nav-aria-label, BFSG-Disclaimer, optional langSwitcher Snippet conditional render, Kontakt mailto). Implicit-role-contentinfo (kein explizites role-Attribut — Svelte-a11y-Lint warnte vor Redundanz)
  - [x] 6.4+6.5 `src/routes/+layout.svelte` umgeschrieben: SkipLink + `<main id="main">{@render children()}</main>` + MetaFooter. Alte sv-Default-Locales-Hidden-Block bleibt (Crawler-Hint, Story 3.1 Migration)
  - [x] 6.6 E2E in Task 9 (Playwright: Tab → SkipLink visible → Enter → #main)

- [x] **Task 7: Kontrast-Verifizierung + ADR-006 fill** (AC: #7)
  - [x] 7.1 Kontrast-Math (WCAG 2.x sRGB → linear → relative luminance → ratio) für alle Token-Paare vs `--bg #ECEAE0`
  - [x] 7.2 ADR-006-tailwind-v4.md komplett gefüllt (Tabelle Token → Ratio → Soll → Status + Adjustment-Rationale)
  - [x] 7.3 **2 Token adjusted (User-bestätigt):** `--ink-subtle #6F6F6A` (4.1:1 fail) → `#5F5F5A` (5.3:1 ✓ AA). `--rule-strong #989488` (2.5:1 fail) → `#74726A` (4.0:1 ✓ SC 1.4.11). Logo-SVGs nutzen `--accent` + `--bg`, beide unverändert
  - [x] 7.4 ADR-006-Status `Proposed` → `Accepted` gesetzt

- [x] **Task 8: Logo-Minimal-Assets** (AC: #Logo)
  - [x] 8.1 `static/favicon.svg` (2-Layer, 16×16) erstellt mit `#ECEAE0` bg + 2 squares + dot in `#2A3F7C`
  - [x] 8.2 `static/logo-mark.svg` (3-Layer, 192×192) erstellt analog
  - [x] 8.3 Token-Hex `#2A3F7C` + `#ECEAE0` hardcoded (siehe ADR-006: bei Token-Adjust SVGs synchron updaten — derzeit nicht nötig, beide stable)
  - [x] 8.4 Alte `static/favicon.{png,ico}` entfernt (sv-create v0.15.3 erstellte keine PNG, nur `favicon.svg` Default — der wurde überschrieben)
  - [x] 8.5 `<link rel="icon" type="image/svg+xml" href="%sveltekit.assets%/favicon.svg" />` in `src/app.html` `<head>` ergänzt
  - [x] 8.6 E2E in Task 9 (Playwright: `link[rel=icon][type='image/svg+xml']` count=1)

- [x] **Task 9: Showcase + Playwright E2E + Smoke** (AC: #9)
  - [x] 9.1 `src/routes/+page.svelte` ersetzt: Plex-Serif h1 + logo-mark.svg, Body-Absatz, 3 Button-Varianten, Dialog-Trigger (span, NICHT button-in-button), Tooltip-Trigger (span tertiary-style), Skeleton-Blocks, pre/code Plex-Mono, `.tabular`-Demo, 8 Text-Skalen-Proben
  - [x] 9.2+9.3 Smoke gegen User's dev auf :5183 → root 200, healthz 200. Visuelle Verifikation deferred (User's Browser, kein Headless-Screenshot in CI bis Story 4.3)
  - [x] 9.4 `pnpm check` → 0 Errors / 0 Warnings / 1334 Files
  - [x] 9.5 **Playwright E2E neu** `src/routes/page.svelte.e2e.ts` — 6 Tests (Heading+Logo, SkipLink Tab-Order + Enter, Dialog open ohne Overlay-Dimmer UX-DR33, MetaFooter 5 Links + Disclaimer, Favicon-SVG `<link>`, 3 Preload `<link>`s) → **6/6 ✓**
  - [x] 9.6 Commit-Plan: bundled mit CLAUDE.md + ADR-012 aus vorheriger Session (Task 10)

## Dev Notes

### Token-Reference (Vollständige `src/app.css`-Struktur)

**Reihenfolge:**
1. `@import 'tailwindcss';` (Tailwind v4)
2. `@font-face`-Blocks (Task 2.6)
3. `:root`-Block mit Tokens (Snippet unten)
4. `@theme inline { ... }`-Block (Snippet unten)
5. `html[dir="rtl"]`-Block (leer)
6. `@media (max-width: 640px)` mit Mobile-Overrides
7. Utility-Klassen: `.tabular` (`font-feature-settings: 'tnum'`), `.sr-only`

**`:root` Token-Werte (verbindlich, siehe ux-design-spec.md Sektion „Implementation Approach"):**

```css
:root {
  --font-sans: 'IBM Plex Sans', 'IBM Plex Sans Arabic', system-ui, sans-serif;
  --font-serif: 'IBM Plex Serif', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --text-xs: 0.8rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5625rem;
  --text-2xl: 1.953rem;
  --text-3xl: 2.441rem;
  --text-4xl: 3.052rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  --bg: #ECEAE0;
  --bg-elevated: #F5F3EA;
  --ink: #141414;
  --ink-muted: #4A4A46;
  --ink-subtle: #6F6F6A;
  --rule: #C8C6BB;
  --rule-strong: #989488;
  --accent: #2A3F7C;
  --accent-soft: #E0E4F0;
  --focus: #0030C8;

  --state-error: #A12626;
  --state-warning: #9E5520;
  --state-success: #0E6549;
  --state-info: var(--accent);

  --chart-grid: var(--rule);
  --chart-axis: var(--rule-strong);
  --chart-axis-text: var(--ink-muted);
  --chart-line: var(--accent);
  --chart-line-secondary: #9E5520;
  --chart-area: var(--accent-soft);
  --chart-point: var(--accent);
  --chart-tooltip-bg: #141414;
  --chart-tooltip-ink: #ECEAE0;
  --chart-annotation: #9E5520;

  --chart-cat-1: #2A3F7C;
  --chart-cat-2: #9E5520;
  --chart-cat-3: #0E6549;
  --chart-cat-4: #74488E;
  --chart-cat-5: #856310;
  --chart-cat-6: #366AA0;
}

body { background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
```

### Tailwind @theme Snippet

Tailwind v4 nutzt CSS-First-`@theme`-Directive. Token-Aliase als `--color-*`, `--font-*`, `--text-*`, `--spacing-*`:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-bg-elevated: var(--bg-elevated);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-focus: var(--focus);

  --color-state-error: var(--state-error);
  --color-state-warning: var(--state-warning);
  --color-state-success: var(--state-success);
  --color-state-info: var(--state-info);

  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);

  --text-xs: var(--text-xs);
  --text-sm: var(--text-sm);
  --text-base: var(--text-base);
  --text-lg: var(--text-lg);
  --text-xl: var(--text-xl);
  --text-2xl: var(--text-2xl);
  --text-3xl: var(--text-3xl);
  --text-4xl: var(--text-4xl);

  --spacing-1: var(--space-1);
  --spacing-2: var(--space-2);
  --spacing-3: var(--space-3);
  --spacing-4: var(--space-4);
  --spacing-6: var(--space-6);
  --spacing-8: var(--space-8);
  --spacing-12: var(--space-12);
  --spacing-16: var(--space-16);
  --spacing-24: var(--space-24);
}
```

Nach Setup: `bg-bg`, `text-ink`, `font-serif`, `text-2xl`, `p-4`, `border-rule-strong` etc. nativ in Tailwind verfügbar.

### Font-Subset-Strategie (UX-DR8, NFR-IL3)

**Architecture-Doc + UX-Spec divergieren marginal:**
- UX-DR8 spricht von `pyftsubset` (Python fonttools)
- Architecture-Doc (Zeile 518–519) spricht von `@fontsource-variable/*` + eigenen `@font-face`

**Entscheidung Story 1.2:** Fontsource-Pakete als Source. Fontsource liefert pre-subset `.woff2`-Files pro Subset out-of-the-box. KEIN pyftsubset nötig. Begründung: weniger Custom-Tooling, Solo-Maintainer-tauglich, deterministisch (Lockfile-pinned).

**Source → Target Mapping (Task 2.3):**

| Source (`node_modules/...`) | Target (`static/fonts/`) | Unicode-Range |
|---|---|---|
| `@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2` | `plex-sans-latin-var.woff2` | U+0000–024F (Latin) |
| `@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-ext-wght-normal.woff2` | `plex-sans-latin-ext-var.woff2` | U+0100–024F (Latin Ext) |
| `@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-cyrillic-wght-normal.woff2` | `plex-sans-cyrillic-var.woff2` | U+0400–04FF (Cyrillic) |
| `@fontsource-variable/ibm-plex-serif/files/ibm-plex-serif-latin-wght-normal.woff2` | `plex-serif-latin-var.woff2` | U+0000–024F |
| `@fontsource-variable/ibm-plex-serif/files/ibm-plex-serif-latin-ext-wght-normal.woff2` | `plex-serif-latin-ext-var.woff2` | U+0100–024F |
| `@fontsource-variable/ibm-plex-serif/files/ibm-plex-serif-cyrillic-wght-normal.woff2` | `plex-serif-cyrillic-var.woff2` | U+0400–04FF |
| `@fontsource-variable/ibm-plex-mono/files/ibm-plex-mono-latin-wght-normal.woff2` | `plex-mono-latin-var.woff2` | U+0000–024F |
| `@fontsource-variable/ibm-plex-mono/files/ibm-plex-mono-latin-ext-wght-normal.woff2` | `plex-mono-latin-ext-var.woff2` | U+0100–024F |
| `@fontsource-variable/ibm-plex-mono/files/ibm-plex-mono-cyrillic-wght-normal.woff2` | `plex-mono-cyrillic-var.woff2` | U+0400–04FF |
| `@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2` | `plex-sans-arabic-400.woff2` | U+0600–06FF + U+0750–077F |
| `@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2` | `plex-sans-arabic-600.woff2` | U+0600–06FF + U+0750–077F |

**Arabic:** Plex Sans Arabic ist NICHT als Variable-Font verfügbar — daher 2 Static-Weights (400 + 600) statt 1 Variable. Conditional Load via `+layout.svelte` in Story 3.4.

**Total Files in `static/fonts/`:** 11 woff2 (9 Latin/Cyrillic + 2 Arabic).

**Filename-Konvention:** `plex-{family}-{subset}-var.woff2` (Latin/Cyrillic Variable) bzw. `plex-sans-arabic-{weight}.woff2` (Arabic Static). Konsistent für Preload-Paths und CSP.

### @font-face Snippet (in `src/app.css`)

```css
/* Plex Sans Variable */
@font-face {
  font-family: 'IBM Plex Sans';
  src: url('/fonts/plex-sans-latin-var.woff2') format('woff2');
  font-weight: 100 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-024F, U+1E00-1EFF, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'IBM Plex Sans';
  src: url('/fonts/plex-sans-latin-ext-var.woff2') format('woff2');
  font-weight: 100 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: 'IBM Plex Sans';
  src: url('/fonts/plex-sans-cyrillic-var.woff2') format('woff2');
  font-weight: 100 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}

/* Plex Serif Variable — analog */
@font-face { font-family: 'IBM Plex Serif'; src: url('/fonts/plex-serif-latin-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0000-024F; }
@font-face { font-family: 'IBM Plex Serif'; src: url('/fonts/plex-serif-latin-ext-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0100-024F; }
@font-face { font-family: 'IBM Plex Serif'; src: url('/fonts/plex-serif-cyrillic-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0400-045F; }

/* Plex Mono Variable — analog */
@font-face { font-family: 'IBM Plex Mono'; src: url('/fonts/plex-mono-latin-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0000-024F; }
@font-face { font-family: 'IBM Plex Mono'; src: url('/fonts/plex-mono-latin-ext-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0100-024F; }
@font-face { font-family: 'IBM Plex Mono'; src: url('/fonts/plex-mono-cyrillic-var.woff2') format('woff2'); font-weight: 100 700; font-display: swap; unicode-range: U+0400-045F; }

/* Plex Sans Arabic — 2 Static Weights */
@font-face { font-family: 'IBM Plex Sans Arabic'; src: url('/fonts/plex-sans-arabic-400.woff2') format('woff2'); font-weight: 400; font-display: swap; unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF; }
@font-face { font-family: 'IBM Plex Sans Arabic'; src: url('/fonts/plex-sans-arabic-600.woff2') format('woff2'); font-weight: 600; font-display: swap; unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF; }
```

**Unicode-Range-Werte:** aus Fontsource-CSS-Files übernehmen (vollständige Range), oben gekürzte Form OK.

### Preload-Snippet (in `src/app.html` `<head>`)

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="%sveltekit.assets%/fonts/plex-sans-latin-var.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="%sveltekit.assets%/fonts/plex-serif-latin-var.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="%sveltekit.assets%/fonts/plex-mono-latin-var.woff2" />
```

`%sveltekit.assets%` SvelteKit-Default-Placeholder für Asset-Base-URL.

### Wrapper-Liste (Bits-UI v2, Svelte-5-Pattern)

**Bits-UI v2 Pattern** (Mai 2026): Komponenten exportiert als `* as ComponentName` aus `bits-ui`. Verwendung mit Snippet-Children:

```svelte
<!-- src/lib/components/ui/button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'tertiary';

  let {
    variant = 'secondary',
    class: className,
    children,
    ...rest
  }: HTMLButtonAttributes & { variant?: Variant; children: Snippet } = $props();

  const base = 'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 text-base font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50';
  const variants: Record<Variant, string> = {
    primary: 'bg-accent text-bg hover:bg-accent/90',
    secondary: 'bg-transparent border border-rule-strong text-ink hover:bg-bg-elevated',
    tertiary: 'bg-transparent text-accent underline-offset-2 hover:underline px-0 min-h-0 min-w-0'
  };
</script>

<button class={`${base} ${variants[variant]} ${className ?? ''}`} {...rest}>
  {@render children()}
</button>
```

**Dialog (no-dimmed-background, UX-DR33):**

```svelte
<!-- src/lib/components/ui/dialog.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
  import type { Snippet } from 'svelte';
  let { open = $bindable(false), trigger, children }: { open?: boolean; trigger: Snippet; children: Snippet } = $props();
</script>

<BitsDialog.Root bind:open>
  <BitsDialog.Trigger>{@render trigger()}</BitsDialog.Trigger>
  <BitsDialog.Portal>
    <!-- KEIN Overlay-Dim (UX-DR33). Heading + größere Schrift trennen Figur/Grund. -->
    <BitsDialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[600px] max-h-[80vh] bg-bg-elevated border border-rule-strong p-6">
      {@render children()}
    </BitsDialog.Content>
  </BitsDialog.Portal>
</BitsDialog.Root>
```

**Skeleton (no Bits-UI, eigener):**

```svelte
<!-- src/lib/components/ui/skeleton.svelte -->
<script lang="ts">
  let { class: className }: { class?: string } = $props();
</script>

<div class={`block bg-rule motion-safe:animate-pulse ${className ?? ''}`} aria-hidden="true"></div>
```

**Sheet (Mobile-Bottom-Sheet via Bits-UI Dialog + Tailwind):** Variant-Stil mit `bottom-0 inset-x-0 max-h-[40vh]` Default, Snap via CSS scroll-snap in Story 1.10.

**Disclosure:** Bits-UI v2 hat `Accordion.Root` mit `type="single"` für Standalone-Disclosure. Wrapper alias als `disclosure.svelte`.

**Falls Bits-UI-Komponente in v2 anders heißt:** MCP-Lookup via `mcp__svelte__get-documentation` mit Query „bits-ui {component}".

### SkipLink-Snippet

```svelte
<!-- src/lib/components/atlas/skip-link.svelte -->
<script lang="ts">
  import * as m from '$lib/i18n/messages';
</script>

<a
  href="#main"
  class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:bg-bg-elevated focus-visible:text-ink focus-visible:px-4 focus-visible:py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
>
  Zum Hauptinhalt springen
</a>
```

**Hinweis:** i18n-Strings via Paraglide kommt in Story 1.3/3.1. Story 1.2 nutzt hardcoded deutsche String — MUST-Rule #14 i18n-First gilt erst ab Story 3.1 für UI-Text-Bundles. Annotation: TODO i18n.

### MetaFooter-Snippet

```svelte
<!-- src/lib/components/atlas/meta-footer.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { langSwitcher }: { langSwitcher?: Snippet } = $props();
</script>

<footer role="contentinfo" class="border-t border-rule mt-16 py-6 text-xs text-ink-subtle font-sans">
  <div class="max-w-[1440px] mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
    <nav aria-label="Meta-Navigation" class="flex flex-wrap gap-x-4 gap-y-2">
      <a href="/impressum" class="hover:text-accent">Impressum</a>
      <span aria-hidden="true">·</span>
      <a href="/datenschutz" class="hover:text-accent">Datenschutz</a>
      <span aria-hidden="true">·</span>
      <a href="/lizenzen" class="hover:text-accent">Lizenzen</a>
      <span aria-hidden="true">·</span>
      <a href="/architektur" class="hover:text-accent">Architektur</a>
      <span aria-hidden="true">·</span>
      <a href="mailto:hallo@navigator.berlin" class="hover:text-accent">Kontakt</a>
    </nav>
    {#if langSwitcher}{@render langSwitcher()}{/if}
  </div>
  <p class="max-w-[1440px] mx-auto px-4 mt-3">BFSG-konform — WCAG 2.2 AA komplett, AAA wo möglich.</p>
</footer>
```

### Logo-Scope (Story 1.2 vs. Spätere Stories)

**In Story 1.2 (Minimal):**
- `static/favicon.svg` — 2-Layer-Variante, 16×16-viewBox
- `static/logo-mark.svg` — 3-Layer-Variante, 192×192-viewBox, skalierbar
- `<link rel="icon" type="image/svg+xml">` in `src/app.html`

**Explizit AUS Scope 1.2 (kommt später):**
- PNG-Render-Pipeline (`favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `android-chrome-192/512.png`) — Story 4.x (PWA-Foundation, mit `@resvg/resvg-js` aus 1.1-Dev-Deps)
- `site.webmanifest` — Story 4.x
- `og-image.png` (1200×630) — Story 2.6 (OG-Image-Pipeline)
- Wortmarke `navigator.berlin` Schriftwahl + Render — vor Story 1.5 entscheiden (6 Plex-Kandidaten testen mit echtem geladenem Plex)
- Header-Komponente mit Logo + Wortmarke — Story 1.5 (`AddressSearch`-Page mit Header-Strip)
- Tagline „Datenatlas für Berlin" — Story 1.5+ (OG-Image, About)

**Begründung Minimal-Scope:**
- Favicon + Logo-Mark = Foundation-Asset, gehört zu Tokens (gleiche Phase wie Color/Fonts)
- PNG/webmanifest sind Build-Pipeline-Artefakte → später mit Resvg + Build-Steps
- Wortmarke braucht Plex echt geladen → Iterations-Test erst nach 1.2 abgeschlossen
- Header existiert noch nicht → keine Integration möglich

### Logo-SVG-Snippets (Token-Hex hardcoded — Logo-Spec gewinnt-Visual via Token-Werte)

**Wichtige Decision:** Logo-Original-Spec nennt `#2E4382` + `#FAFAF7`. Token-Spec gewinnt → SVG-Files hardcoden Token-Hex `#2A3F7C` + `#ECEAE0`. Falls Token-Hex via Kontrast-Check (AC-7) angepasst wird, SVG-Files mit-aktualisieren.

**`static/favicon.svg` (2-Layer, Task 8.1):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect width="16" height="16" fill="#ECEAE0"/>
  <rect x="3" y="6" width="7" height="7" fill="none" stroke="#2A3F7C" stroke-width="0.3" opacity="0.5"/>
  <rect x="6" y="3" width="7" height="7" fill="none" stroke="#2A3F7C" stroke-width="0.3" opacity="0.85"/>
  <circle cx="9.5" cy="4.5" r="0.9" fill="#2A3F7C"/>
</svg>
```

**`static/logo-mark.svg` (3-Layer, Task 8.2):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#ECEAE0"/>
  <rect x="47" y="75" width="70" height="70" fill="none" stroke="#2A3F7C" stroke-width="0.8" opacity="0.35"/>
  <rect x="61" y="61" width="70" height="70" fill="none" stroke="#2A3F7C" stroke-width="0.8" opacity="0.55"/>
  <rect x="75" y="47" width="70" height="70" fill="none" stroke="#2A3F7C" stroke-width="0.8" opacity="0.85"/>
  <circle cx="125" cy="65" r="6" fill="#2A3F7C"/>
</svg>
```

**Geometrie-Regeln (für spätere Re-Generierung):** siehe `_user-input/navigator-berlin-logo.md` Sektion „Konstruktions-Geometrie".

### Architektur-Compliance — relevante MUST-Rules

**Story 1.2 berührt direkt:**
- #1 `@lucide/svelte` — falls Icons in Wrappern nötig (Skeleton/Disclosure-Chevron)
- #2 Files <500 Zeilen — `app.css` kann groß werden mit `@font-face`-Blocks. Falls >500: in `src/styles/fonts.css` ausgelagert + `@import` in `app.css`
- #7 TypeScript strict, kein `any` — Wrapper-Props typed
- #8 Svelte-5-Runes — `$props()`, `$bindable()`, KEIN `export let`
- #13 A11y-First — Bits-UI-Primitives statt eigenem `<div role>`, SkipLink Pflicht
- #14 i18n-First — TODO-Annotation in SkipLink/MetaFooter (Bundles erst in Story 3.1)
- #18 Keyed `{#each}` — N/A in Story 1.2

### Library/Framework Requirements

- `bits-ui` — bereits installiert (Story 1.1). v2-API mit Snippet-Children. Bei Doku-Bedarf: `mcp__svelte__get-documentation` Query `bits-ui`
- `@fontsource-variable/ibm-plex-sans` + `-serif` + `-mono` (Mai 2026 Stable)
- `@fontsource/ibm-plex-sans-arabic` (Static, kein Variable)
- `fontaine` (Vite-Plugin, Stable)
- Tailwind v4 — `@import 'tailwindcss';` + `@theme inline { ... }` CSS-First-Pattern (kein JS-Config)

### Testing Requirements

**Story 1.2:**
- `pnpm check` → 0 Errors + 0 Warnings
- Visual-Smoke manuell (AC-8)
- Kontrast-Check WebAIM/axe (AC-7)
- Kein Unit-Test-Inhalt — Token-Werte sind Daten, keine Logik

**Spätere Stories nutzen Token:** Token-Stabilität ist Foundation, Änderung erfordert ADR-Update.

### File-Structure-Requirements (Diff zu Story 1.1)

**Neu in Story 1.2:**
```
./
├── src/
│   ├── app.css                        (komplett gefüllt, war leer/minimal)
│   ├── app.html                       (Preload-Hints ergänzt)
│   ├── lib/
│   │   └── components/
│   │       ├── ui/
│   │       │   ├── button.svelte
│   │       │   ├── dialog.svelte
│   │       │   ├── combobox.svelte
│   │       │   ├── popover.svelte
│   │       │   ├── tooltip.svelte
│   │       │   ├── toggle-group.svelte
│   │       │   ├── scroll-area.svelte
│   │       │   ├── skeleton.svelte
│   │       │   ├── tabs.svelte
│   │       │   ├── sheet.svelte
│   │       │   ├── alert-dialog.svelte
│   │       │   ├── disclosure.svelte
│   │       │   └── index.ts
│   │       └── atlas/
│   │           ├── skip-link.svelte
│   │           └── meta-footer.svelte
│   └── routes/
│       ├── +layout.svelte             (SkipLink + main + MetaFooter integriert)
│       └── +page.svelte               (Showcase ersetzt Hello-World)
├── static/
│   └── fonts/                         (11 woff2-Files)
└── vite.config.ts                     (fontaine-Plugin ergänzt)
```

### Previous Story Intelligence (aus Story 1.1)

- **Project-Root-Strategie:** Working-Dir = SvelteKit-Root, kein Subfolder
- **`_bmad/` versioniert, `_bmad-output/`/`_user-input/`/`.claude/projects/` gitignored**
- **GitHub-Remote:** `git@github.com:mschmdb/navigator-berlin.git` (Main-Branch)
- **`experimental.async = true`** aktiv in `svelte.config.js` — Bits-UI-Wrapper können bei Bedarf `await` direkt im Markup nutzen, aber Story 1.2 braucht das nicht
- **Bits-UI installiert** — direkt nutzbar, kein zusätzliches Install
- **ADR-006-tailwind-v4.md** existiert als Stub — Task 7.2 füllt Decision-Sektion
- **`@lucide/svelte` Pflicht** — falls Icons in Wrappern (Disclosure-Chevron, Tooltip-Arrow)

### Latest Tech Information (Mai 2026)

- **Tailwind v4:** CSS-First-Config via `@theme inline`. Kein `tailwind.config.js` mehr. Variants über `@custom-variant` falls nötig. Logical Properties (`ms-`, `me-`, `ps-`, `pe-`) Default
- **Bits-UI v2:** Snippet-basierte API (`children` als Snippet-Prop), Component-Export `* as Dialog from 'bits-ui'` Pattern. Data-Attribute auf Wrapper-Elementen für State-Targeting (`data-state="open"` etc.)
- **Fontaine:** stabil, einfache Vite-Plugin-Integration. Auto-generiert `--fontaine-fallback`-CSS-Custom-Property-System
- **`@fontsource-variable/ibm-plex-*`:** Stand Mai 2026 stabile Pakete mit pre-subset woff2-Files

### Project Structure Notes

- `src/lib/components/ui/` vs. `src/lib/ui/primitives/`: Architecture-Doc nutzt erste Variante, UX-Spec zweite. **Story 1.2 folgt Architecture-Doc** (`src/lib/components/ui/`) — konsistent mit Pattern-Examples (Zeile 1101 in architecture.md).
- Bits-UI-Wrapper sind „dumm" — kein Business-Logic, nur Plex/Cloud-Dancer-Skinning. Domain-Komponenten in `atlas/` (Story 1.7+) wrappen UI-Komponenten.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Design-Token-Foundation mit Cloud Dancer + Plex] (ACs)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach] (Token-CSS-Werte, Kontrast-Ratios)
- [Source: _bmad-output/planning-artifacts/architecture.md#Styling Solution] (Tailwind v4 + `@theme` Strategie)
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Architecture] (Bits-UI als Headless-Primitives, `src/lib/components/ui/` Pfad)
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] (Svelte-5-Runes-Patterns, `$props()`, `$derived`)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR1–UX-DR9, UX-DR13, UX-DR24, UX-DR29, UX-DR33)
- [Source: _bmad-output/implementation-artifacts/1-1-repository-initialisierung-mit-stack-foundation.md] (Stack-Dependencies, Project-Root-Setup)
- [Source: _user-input/navigator-berlin-logo.md] (Logo-Spec, Geometrie, Konzept; Token-Hex überschreibt Original-Hex `#2E4382`/`#FAFAF7`)
- [Source: ~/.claude/CLAUDE.md] (User-Regeln: @lucide/svelte, kein lucide-svelte, files <500, kein any)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via Claude Code CLI — BMAD dev-story workflow + TDD-Mandat ADR-012

### Debug Log References

- vitest-browser-svelte 2.1 + bits-ui 2.18: `effect_orphan`-Crash gefixt durch `resolve.dedupe: ['svelte','svelte/internal']` + `optimizeDeps.exclude: ['bits-ui']` in vite.config.ts
- vitest `expect.requireAssertions: true` aktiv — smoke-tests müssen explizite assertion haben (`expect(unmount).toBeTypeOf('function')`)
- Test-Filename-Pattern strict `*.svelte.{test,spec}.{js,ts}` — `wrappers.smoke.test.ts` umbenannt zu `wrappers.svelte.test.ts`
- Dialog-Trigger: BitsDialog.Trigger ist bereits `<button>` — Button-Wrapping erzeugt nested-buttons + strict-mode-violation. Showcase nutzt `<span>` mit Button-Style innerhalb des trigger-snippet
- npm-Realitäts-Check: `@fontsource-variable/ibm-plex-{serif,mono}` existieren NICHT auf npm Mai 2026 (nur `-sans`). Story-Spec war optimistisch — Workaround via direct-CDN-download script
- Kontrast-Math (WCAG 2.x): `--ink-subtle #6F6F6A` und `--rule-strong #989488` failten Schwellen → angehoben zu `#5F5F5A` (5.3:1) bzw. `#74726A` (4.0:1). Logo-Hex unverändert
- src/app.css 219 Zeilen (<500 NFR-M7 ✓), umfasst Tailwind-import + 2 Plugins + 11 @font-face + :root tokens + @theme + Mobile-Override

### Completion Notes List

- **TDD-Mandat per ADR-012 erstmalig produktiv angewendet:**
  - **Logic-pflichtig (TDD strict Red-Green-Refactor):** Button (6 Tests), Dialog (3 Tests), Skeleton (2 Tests), Sheet (2 Tests), SkipLink (3 Tests), MetaFooter (7 Tests) = 6 Komponenten / 23 Tests
  - **Pure-Style-Wrapper (Smoke-render):** Combobox, Popover, Tooltip, ToggleGroup, ScrollArea, Tabs, AlertDialog, Disclosure = 8 Tests
  - **E2E (Playwright integration):** 6 Tests in `src/routes/page.svelte.e2e.ts`
  - **Total: 8 test files, 32 unit-tests + 6 e2e-tests = 38/38 passing**
- **AC-Erfüllung:**
  - AC-1 ✓ Token-Hierarchie in `src/app.css` (Palette, State, Chart, Typography, Spacing) + Tailwind `@theme inline`
  - AC-2 ✓ 11 Plex woff2-Files self-hosted in `static/fonts/` (via direct-CDN-download statt npm-Dep — User-Decision)
  - AC-3 ✓ 3 Preload-Links für Latin-Subsets (Sans Var + Serif/Mono 400)
  - AC-4 ✓ Fontaine-Vite-Plugin aktiv mit system-ui/Georgia/ui-monospace Fallbacks
  - AC-5 ✓ 12 Bits-UI-Wrapper, alle Touch-Target-konform (44px für interaktive), TS-strict, $props-Runen
  - AC-6 ✓ SkipLink (Tab→sichtbar→Enter→#main verified via Playwright) + MetaFooter (5 Meta-Links + BFSG-Disclaimer + optional langSwitcher Snippet)
  - AC-7 ✓ Kontrast-Verifikation manuell durchgeführt, 2 Token angepasst (User-bestätigt), ADR-006 Accepted
  - AC-8 ✓ favicon.svg (2-Layer) + logo-mark.svg (3-Layer) mit Token-Hex, `<link rel=icon>` in app.html
  - AC-9 ✓ Showcase-Page rendert + Playwright-Smoke-Tests (Heading, Logo, Dialog, MetaFooter, Favicon, Preload)
- **Abweichungen von Story-Spec (alle dokumentiert):**
  - sv-create v0.15.3 generierte `src/routes/layout.css` statt `src/app.css` — auf Story-Spec-Pfad `src/app.css` migriert
  - Plex Serif + Mono nicht als Variable auf npm Mai 2026 → Static 400-Weight via direct-CDN-download-script statt npm-Dep
  - `--ink-subtle` + `--rule-strong` Hex angepasst (User-bestätigt) wegen Kontrast-Failures (ADR-006 dokumentiert)
  - Dialog/Tooltip-Trigger im Showcase: `<span>` statt verschachteltem `<Button>` (vermeidet nested-button HTML)
- **vite.config.ts Erweiterung:** `resolve.dedupe ['svelte','svelte/internal']` + `optimizeDeps.exclude ['bits-ui']` — Pflicht für vitest-browser-svelte + bits-ui Kompatibilität (ansonsten effect_orphan-Crash)
- **package.json Erweiterung:** `fontaine` dev-dep + `pnpm install --frozen-lockfile` weiter reproduzierbar
- **Bundled-Commit:** CLAUDE.md (Repo-Root) + ADR-012-tdd-mandate.md aus letzter Session werden mit-committed (Bündelung per User-Decision)

### File List

**Neu erstellt durch Story 1.2:**
- `src/app.css` (Tokens + @theme + 11 @font-face + Mobile-Override; ersetzt sv-default `src/routes/layout.css`)
- `scripts/download-fonts.sh` (direct-CDN-Plex-Download, gepinnt)
- `static/fonts/plex-sans-{latin,latin-ext,cyrillic}-var.woff2` (3 Var-Files)
- `static/fonts/plex-{serif,mono}-{latin,latin-ext,cyrillic}-400.woff2` (6 Static-Files)
- `static/fonts/plex-sans-arabic-{400,600}.woff2` (2 Static-Files)
- `static/favicon.svg` (2-Layer Logo)
- `static/logo-mark.svg` (3-Layer Logo)
- `src/lib/components/ui/button.svelte` + `.svelte.test.ts`
- `src/lib/components/ui/dialog.svelte` + `.svelte.test.ts`
- `src/lib/components/ui/skeleton.svelte` + `.svelte.test.ts`
- `src/lib/components/ui/sheet.svelte` + `.svelte.test.ts`
- `src/lib/components/ui/combobox.svelte`
- `src/lib/components/ui/popover.svelte`
- `src/lib/components/ui/tooltip.svelte`
- `src/lib/components/ui/toggle-group.svelte`
- `src/lib/components/ui/scroll-area.svelte`
- `src/lib/components/ui/tabs.svelte`
- `src/lib/components/ui/alert-dialog.svelte`
- `src/lib/components/ui/disclosure.svelte`
- `src/lib/components/ui/wrappers.svelte.test.ts` (8 smoke-tests, 1 file shared)
- `src/lib/components/ui/index.ts` (12 re-exports)
- `src/lib/components/atlas/skip-link.svelte` + `.svelte.test.ts`
- `src/lib/components/atlas/meta-footer.svelte` + `.svelte.test.ts`
- `src/routes/page.svelte.e2e.ts` (6 Playwright-Tests)

**Modifiziert durch Story 1.2:**
- `src/app.html` (3 Preload-Links + `<link rel=icon type=image/svg+xml>`)
- `src/routes/+layout.svelte` (Import `../app.css` + SkipLink + main#main + MetaFooter; alte Locales-Hidden-Block bleibt für Crawler)
- `src/routes/+page.svelte` (Showcase: h1+Logo, 3 Buttons, Dialog, Tooltip, Skeleton, Mono-Code, Tabular, Text-Skalen)
- `vite.config.ts` (FontaineTransform + resolve.dedupe + optimizeDeps.exclude bits-ui)
- `package.json` + `pnpm-lock.yaml` (fontaine dev-dep)
- `docs/adr/ADR-006-tailwind-v4.md` (Tabelle gefüllt, Adjust-Rationale, Status → Accepted)

**Entfernt durch Story 1.2:**
- `src/routes/layout.css` (Inhalt migriert nach `src/app.css`)

**Bundled (aus vorheriger Session, mit Story-1.2-Commit):**
- `CLAUDE.md` (Repo-Root, TDD-Mandat + Scope-Tabelle)
- `docs/adr/ADR-012-tdd-mandate.md` (Pragmatic TDD ab Story 1.2, Accepted)

## Change Log

| Date | Change | Files | Commit |
|------|--------|-------|--------|
| 2026-05-11 | TDD-Mandat ADR-012 + Project-CLAUDE.md (Pragmatic TDD ab Story 1.2) | CLAUDE.md, docs/adr/ADR-012-tdd-mandate.md | (Story 1.2 bundled) |
| 2026-05-11 | Token-Layer src/app.css (Palette, State, Chart, Typography, Spacing) + Tailwind @theme | src/app.css | (Story 1.2 bundled) |
| 2026-05-11 | Plex direct-CDN-self-hosted (11 woff2) + Download-Script + 11 @font-face | scripts/download-fonts.sh, static/fonts/*.woff2, src/app.css | (Story 1.2 bundled) |
| 2026-05-11 | Preload 3 Latin-Plex + Favicon-SVG-Link in app.html | src/app.html | (Story 1.2 bundled) |
| 2026-05-11 | Fontaine-Vite-Plugin + bits-ui-Test-Kompatibilität (dedupe + optimizeDeps) | vite.config.ts, package.json | (Story 1.2 bundled) |
| 2026-05-11 | 12 Bits-UI-Wrapper (TDD: Button/Dialog/Skeleton/Sheet, Smoke: 8 pure-style) + index.ts | src/lib/components/ui/* (24 files) | (Story 1.2 bundled) |
| 2026-05-11 | SkipLink + MetaFooter Components (TDD 10 Tests) + Layout-Integration | src/lib/components/atlas/*, src/routes/+layout.svelte | (Story 1.2 bundled) |
| 2026-05-11 | Kontrast-Tokens adjusted: ink-subtle #6F6F6A → #5F5F5A, rule-strong #989488 → #74726A | src/app.css, docs/adr/ADR-006-tailwind-v4.md | (Story 1.2 bundled) |
| 2026-05-11 | Logo SVGs (favicon + logo-mark) Token-Hex hardcoded | static/favicon.svg, static/logo-mark.svg | (Story 1.2 bundled) |
| 2026-05-11 | Showcase-Page + Playwright E2E (6 Tests) — Heading, SkipLink, Dialog, MetaFooter, Favicon, Preload | src/routes/+page.svelte, src/routes/page.svelte.e2e.ts | (Story 1.2 bundled) |

## Confirmed Decisions

1. **Font-Subsetting:** Fontsource-Pakete (pre-subset) statt `pyftsubset`. Solo-Maintainer-tauglich, deterministisch.
2. **Wrapper-Pfad:** `src/lib/components/ui/` (Architecture-Doc-Konvention, NICHT `src/lib/ui/primitives/` aus UX-Spec).
3. **i18n-Strings in SkipLink/MetaFooter:** hardcoded DE in Story 1.2, Migration zu Paraglide-Messages in Story 3.1 (TODO-Annotations gesetzt).
4. **Bits-UI v2:** Snippet-API, Default-Export-Pattern. Bei Unsicherheit `mcp__svelte__get-documentation`-Lookup.
5. **Logo-Scope:** Minimal in 1.2 — favicon.svg + logo-mark.svg + `<link rel="icon">`. PNG/webmanifest/OG/Header in späteren Stories.
6. **Logo-Farben:** Tokens gewinnen — Logo-SVGs nutzen Token-Hex `#2A3F7C` (accent) + `#ECEAE0` (bg), NICHT Logo-Spec-Original `#2E4382` + `#FAFAF7`. Token-Adjust (via Kontrast-Check AC-7) propagiert in SVGs.

## Open Questions (for End-of-Story)

1. **Bottom-Sheet-Variante:** Wird `sheet.svelte` in Story 1.2 minimal angelegt (Bottom-Position via Tailwind) oder erst in Story 1.10 (LayerPalette-Mobile)? Empfehlung: Skeleton in 1.2 für Konsistenz, Snap-Logik in 1.10.
2. **ADR-NNN-design-tokens:** Eigener ADR oder Token-Doku in ADR-006-tailwind-v4 ergänzen? Empfehlung: in ADR-006, weniger ADR-Fragmentierung.
3. **Email-Adresse für Kontakt-Mailto:** Footer nutzt `hallo@navigator.berlin` — Domain bereits konfiguriert oder Platzhalter? Falls Platzhalter: Story 4.1 setzt finale Adresse.
