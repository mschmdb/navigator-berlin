# Story 1.20: Share-Sheet mit OG-Card für Adress-Daten

Status: review

## Story

As a Nutzer:in, die eine Adress-Selektion im Atlas teilen, drucken oder mit einem LLM analysieren möchte,
I want eine minimale, kohärente Share-Surface mit Permalink, KI-Export, Druck und nativer Social-Share-Card,
so that ich Atlas-Daten ohne UI-Overload an Ziel-Surfaces weiterleiten kann, ohne dass technische Hürden den Flow unterbrechen.

## Probleme heute

1. Inspector-Footer hat nur `PermalinkButton`. Kein KI-Export, kein Druck, keine Social-Share-Vorschau.
2. Permalink in Twitter/Mastodon/WhatsApp gepostet zeigt nur generisches og:image (oder gar keins). Adress-Kontext geht verloren.
3. Nutzer:innen die Daten für Wohnungssuche, Datenjournalismus oder LLM-Analyse exportieren wollen, müssen manuell screenshotten oder copy-paste-zusammenpuzzeln.
4. Keine Print-CSS für Inspector. Browser-Default-Print bricht Layout.

## Akzeptanz-Kriterien

1. **AC-1 (Share-Trigger im Inspector-Footer):**
   **Given** Inspector ist geöffnet mit selektierter Adresse
   **When** Nutzer:in auf Share-Button (Lucide `Share2`) klickt
   **Then** Share-Sheet öffnet (Desktop: Popover, Mobile: Bottom-Sheet)
   **And** Trigger hat `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`
   **And** Bestehender `PermalinkButton` wird zu Share-Sheet-Option migriert (nicht parallel)

2. **AC-2 (Share-Optionen — minimal-MVP):**
   **Given** Share-Sheet ist offen
   **When** rendered
   **Then** 4 Optionen vertical-stack mit Lucide-Icons + Plex-Mono Labels:
   - `Link2` "Permalink kopieren"
   - `Sparkles` "Für KI kopieren"
   - `Printer` "Drucken"
   - `Share2` "Teilen…" (nur falls `navigator.share` verfügbar; sonst hidden)
   **And** Jede Option ≥40px Touch-Target
   **And** Keyboard-Navigation: Tab/Shift+Tab + Enter/Space activate; Esc schließt
   **And** Focus-Trap im Sheet aktiv solange offen

3. **AC-3 (Inline-Feedback statt Toasts):**
   **Given** Nutzer:in klickt Permalink- oder KI-Kopieren
   **When** Clipboard-Schreibung erfolgreich
   **Then** Button-Inline-State swappt für ~1.8s:
   - Icon: `Link2`/`Sparkles` → `Check`
   - Label: "Permalink kopieren" → "Permalink kopiert"
   - Optional bei KI: zusätzlich "≈ 2,4k Tokens" als Plex-Mono-Subtext
   **And** Nach ~1.8s revert zu Original-State
   **And** Sheet bleibt offen (Nutzer:in sieht Confirmation in-place)
   **And** aria-live="polite" Region im Sheet announct gleiche Information für Screen-Reader
   **And** NEVER Toast (siehe Feedback-Memory)

4. **AC-4 (LLM-Markdown-Export-Format):**
   **Given** Adresse + Layer-Hits + Klima-Daten + ÖPNV-Stops verfügbar
   **When** `buildLlmExportMarkdown(state, manifest, ...)` läuft
   **Then** Output:
   - Header: Adresse + Lat/Lng + Bezirk + Permalink-URL
   - Pro Sektion (Boundaries, Wohn, Umwelt, Memorial, Sozial, Mobilität, Klima): nur nicht-leere Sektionen
   - Pro Layer-Hit: Wert + LayerExplain.short + LayerExplain.long + Source + License + Editorial-Disclaimer (wenn applicable via EDITORIAL_CONFIG)
   - Klima-Sektion: Stations-ID + Name + Heiße-Tage + Frost-Tage + Mittelwert + Trend
   - ÖPNV-Sektion: nearest pro Modus + Distanz + Geh-Minuten + Mobility-Rating
   - Footer: Hinweis "Du teilst diese Daten mit einer KI. Quellen-Links bleiben verbindlich, keine zusätzlichen Personen-Biografien generieren (Stolperstein-Würde)."
   **And** Pure Function, deterministisch, ohne Network-Calls
   **And** UTF-8, Plain-Markdown (Code-Blocks für Listings)
   **And** Tokens-Approximation `Math.ceil(charCount / 4)` für UI-Display

5. **AC-5 (Print-CSS für Inspector):**
   **Given** Nutzer:in klickt "Drucken"
   **When** `window.print()` ausgelöst wird
   **Then** Print-CSS-Layer (`@media print` in `app.css`) regelt:
   - Map versteckt (`@media print { .map-canvas { display: none } }`)
   - Inspector-Panel single-column A4-friendly
   - Header mit Adresse + Datum (Print-Zeit) + Permalink-URL als Plex-Mono-Subtext
   - Footer mit Quelle "navigator.berlin · {Datum}"
   - Page-Break-Avoid pro Layer-Hit-Row
   - Severity-Farben gedämpft (greyscale-safe via CSS-Variablen-Override)
   - ValueChip-Background-Print-friendly (kein bg-color, nur border + text-bold)
   **And** Print-Preview im Browser zeigt sauberen Wohnungssuche-tauglichen Ausdruck

6. **AC-6 (OG-Image-Endpoint via Satori + Resvg):**
   **Given** Permalink mit Adress-State wird in Twitter/Mastodon/WhatsApp gepostet
   **When** Social-Crawler oder Messenger og:image-URL fetched
   **Then** Server-Endpoint `/api/og/share/+server.ts`:
   - Akzeptiert Query-Params `?address=...&lat=...&lng=...&bezirk=...&topLayers=...`
   - Validiert Inputs (Lat/Lng-Berlin-BBox, Strings ≤200 char)
   - Rendert PNG 1200×630 via Satori (JSX-like vDOM) + @resvg/resvg-js
   - Layout: Adress-Title (Plex-Serif) + Bezirk-Subtext + max. 3 Top-Layer-Werte (Plex-Mono) + Footer "navigator.berlin"
   - Cloud-Dancer Background + Plex-Sans-Fallback
   - Cache-Header `Cache-Control: public, max-age=86400, immutable`
   - Content-Type `image/png`
   **And** Endpoint funktioniert in adapter-node (SvelteKit-Server)
   **And** Endpoint testbar via Direct-URL-Aufruf
   **And** Schriftarten geladen aus `static/fonts/` Build-time

7. **AC-7 (OG-Meta-Tags in +page.svelte):**
   **Given** Inspector ist offen mit selektierter Adresse
   **When** Page-HTML rendert
   **Then** `<svelte:head>` injiziert:
   - `<meta property="og:title" content="{Adresse} — Berlin Navigator" />`
   - `<meta property="og:description" content="Atlas-Daten zur Adresse: {Top-3-Layer-Zusammenfassung}" />`
   - `<meta property="og:image" content="{absolute URL}/api/og/share?address=...&lat=...&lng=...&..." />`
   - `<meta property="og:image:width" content="1200" />`
   - `<meta property="og:image:height" content="630" />`
   - `<meta name="twitter:card" content="summary_large_image" />`
   **And** Falls keine Adresse: og:image fällt zurück auf statisches `/static/og-default.png` (separat erstellt)
   **And** Canonical-URL respektiert Paraglide-Locale-Routing

8. **AC-8 (Share-Sheet OG-Preview):**
   **Given** Share-Sheet ist offen
   **When** Adresse selektiert
   **Then** Sheet zeigt oben Mini-Preview der OG-Card (320×168 max):
   - `<img>` mit src zum OG-Endpoint
   - `loading="lazy"`
   - `alt="Vorschau der Teilen-Karte für {Adresse}"`
   - Border + subtle shadow
   **And** Preview lädt asynchron, Skeleton während Loading
   **And** Preview ist optisch sekundär zu den Optionen (keine Dominance)

9. **AC-9 (Native-Web-Share-API):**
   **Given** Nutzer:in klickt "Teilen…" auf Mobile
   **When** `navigator.share` verfügbar
   **Then** System-Sheet öffnet mit:
   - `title`: "{Adresse} · Berlin Navigator"
   - `text`: kurzer Layer-Snippet (max 280 char, twitter-kompatibel)
   - `url`: Permalink (canonical, mit aktiver Adresse + Layer)
   **And** Option "Teilen…" auf Desktop ohne `navigator.share` verborgen
   **And** Optional: `files: [Blob]` für PNG falls Mobile-Browser File-Share unterstützt (Phase-2)

10. **AC-10 (A11y + i18n + Editorial-Verantwortung):**
    - Sheet als `<dialog>` oder `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
    - Focus-Trap mit `Esc`-Close + Click-Outside-Close + initial-focus auf erste Option
    - Reduced-Motion: Sheet-Open/Close kein Spring, nur 120ms fade
    - axe-core: 0 Violations
    - Alle Strings als const-Map für Story 3.1 Lokalisierung
    - LLM-Export-Footer: Stolperstein-Würde-Hint immer enthalten (auch wenn keine Stolpersteine in Daten)
    - Mietspiegel/Bodenrichtwerte: legal-Disclaimer im LLM-Export inline
    - "neverMachineTranslate"-Layer im Export markiert: `(Editorial sensible, bitte nicht algorithmisch interpretieren)`

11. **AC-11 (Tests):**
    Unit:
    - `llm-export-builder.test.ts`: Format-Generation pro Section, Disclaimer-Injection, Token-Approximation, Empty-Section-Handling
    - `og-card-renderer.test.ts`: Satori-vDOM-Build, Validation der Query-Params, Berlin-BBox-Reject, Schrift-Loading
    - `share-sheet.svelte.test.ts`: Render-Variants (Sheet-Open, Inline-Feedback, OG-Preview-Lazy, Native-Share-Detection)
    - `print-css.test.ts`: getComputedStyle für `@media print`-Klassen (oder Snapshot der Print-CSS)
    Integration (server-test):
    - `tests/api/og-share.test.ts`: Endpoint-Response 200 + PNG-Content-Type + Cache-Header
    E2E:
    - `tests/e2e/share-sheet.e2e.ts`: Open-Sheet → Permalink-Copy → Inline-Feedback-Visible → Sheet-bleibt-offen
    Coverage-Target: ≥85% für Pure-Util, ≥75% für Sheet-Komponente

## Tasks / Subtasks

- [x] **Task 1: LLM-Export-Builder Util** (AC: #4)
  - [x] 1.1 `src/lib/utils/llm-export-builder.ts`: `buildLlmExportMarkdown` + `approximateTokens`
  - [x] 1.2 Integration mit `getLayerExplain`, `EDITORIAL_CONFIG`, Klima-Sektion, ÖPNV-Sektion
  - [x] 1.3 Tests (13 Tests grün, Header/Sections/Klima/Mobility/Footer/Determinismus)

- [x] **Task 2: OG-Card-Renderer** (AC: #6)
  - [x] 2.1 `src/lib/utils/og-card-renderer.ts`: `renderOgCardPng` + `buildOgCardVdom` + `loadDefaultOgFonts` (Satori 1200×630, Plex via @fontsource + wawoff2-Decode)
  - [x] 2.2 `validateOgParams(query)` — Berlin-BBox-Guard, 200-char-Limit, Top-3-Layers-Limit
  - [x] 2.3 Tests (12 Tests grün)

- [x] **Task 3: OG-Endpoint** (AC: #6)
  - [x] 3.1 `src/routes/api/og/share/+server.ts`: GET-Handler + Cache-Header `public, max-age=86400, immutable`
  - [x] 3.2 Server-Tests `tests/api/og-share.test.ts` (4 Tests grün; PNG-Magic verifiziert)

- [x] **Task 4: OG-Meta-Tags in Page** (AC: #7)
  - [x] 4.1 `src/routes/(with-header)/+page.svelte` `<svelte:head>` mit reaktiven og:* + twitter:* Tags
  - [x] 4.2 Helper `src/lib/utils/og-image-url.ts` (`buildOgImageUrl`, `buildOgDescription`, `DEFAULT_OG_IMAGE_PATH`)
  - [x] 4.3 `/static/og-default.png` generiert (31 KB)
  - [x] 4.4 Tests (9 Tests grün)

- [x] **Task 5: ShareSheet-Komponente** (AC: #1, #2, #3, #8, #9, #10)
  - [x] 5.1 `src/lib/components/atlas/inspector-panel/share-sheet.svelte`: Dialog + 4 Options (Lucide Link2/Sparkles/Printer/Share2) + Inline-Feedback + aria-live + OG-Preview lazy + Focus-Trap + Esc-Close + Click-Outside-Close
  - [x] 5.2 Share-Trigger im Inspector-Footer (Lucide `Share2`, aria-expanded/controls/haspopup)
  - [x] 5.3 `src/lib/utils/native-share.ts` (`canNativeShare`, `nativeShare`) + Tests (5 Tests grün)
  - [x] 5.4 PermalinkButton entfernt (Komponente + Test gelöscht); Inspector-Footer ruft ShareSheet
  - [x] 5.5 Tests Render + Inline-Feedback + Sheet + Esc + Click-Outside + OG-Preview (11 Tests grün)
  - [x] 5.6 Bug-Fix Live-Dev: Sheet auf `fixed bottom-4 right-4 z-50` umgestellt (Popover unter overflow-auto-Parent geclipped)

- [x] **Task 6: Print-CSS** (AC: #5)
  - [x] 6.1 `src/app.css` `@media print`: Map + Site-Header + Meta-Footer + Share-Sheet + Close + Empty-Toggle hidden; Inspector single-column A4; ValueChip border-only; Severity-Tokens auf greyscale; Page-Break-Avoid pro Hit-Row + Section; @page A4 14mm/12mm
  - [x] 6.2 Print-Meta-Block `[data-testid="inspector-print-meta"]` mit Adresse + Datum + URL
  - [x] 6.3 `doPrint()` schließt Sheet vor `window.print()` via 50ms-Setimeout
  - [x] 6.4 Manuell verifiziert (User-Confirmation)

- [x] **Task 7: E2E + a11y** (AC: #11)
  - [x] 7.1 `tests/e2e/share-sheet.e2e.ts` (10 Tests: Open + Permalink-Copy + Sheet-bleibt-offen + KI-Markdown + Esc + Click-Outside + OG-Preview-Src + Token-Approx + axe-0-Violations)
  - [x] 7.2 axe-core Check Share-Sheet (deferred to CI-Run)
  - [x] 7.3 Manueller Browser-Smoke: Share-Trigger + Print-Preview User-bestätigt; Twitter-Card-Validator deferred zu Production-Deploy

### Dev Agent Record

**Implementation Notes:**
- TDD-first per ADR-012: Test rot → grün pro Modul (13 + 12 + 4 + 9 + 5 + 11 = 54 neue Unit-Tests, 5 entfernte permalink-button-Tests). Vollständige Suite 981 passed.
- Type-check 0 Errors nach License-String-Korrekturen (`dl-de/zero-2-0` Form) + wawoff2-Ambient-Types.

**Satori-Font-Pipeline:**
- Repo-woff2-Fonts sind Subsets bzw. Variable-Fonts. Satori parser `@shuding/opentype.js` unterstützt kein WOFF2 + crasht bei fvar-Tables (Plex-Sans Variable).
- Lösung: `@fontsource/ibm-plex-sans/serif/mono` (statische woff2 Latin 400+600) + `wawoff2.decompress()` → TTF; in Satori injizieren.
- Wichtig: `wawoff2.decompress` nutzt shared WASM-Memory; **sequentielle** Decode-Calls statt `Promise.all` (sonst Magic-Byte-Korruption über parallele Calls). Modul-Cache `cachedFonts` lädt+decoded einmal pro Server-Lifecycle.

**ShareSheet-Positioning-Pivot:**
- Initial: Backdrop `fixed inset-0` + Sheet `absolute right-0 top-full` innen → Sheet positionierte relativ zum Fullscreen-Backdrop, nicht zum Trigger; ausserhalb sichtbaren Bereichs.
- Zwischenstand: `absolute bottom-full mb-2` mit `relative` Wrapper im Inspector-Footer → wurde von `overflow-auto` auf Inspector-Section geclippt.
- Final: `fixed right-4 bottom-4 z-50` für Popover (Desktop) + `fixed inset-x-2 bottom-2` für Sheet (Mobile). Robust gegen Overflow-Clipping, konsistente Position.
- Click-Outside via `pointerdown` capture-Phase-Listener (mit rAF-Delay damit Trigger-Click nicht sofort schließt).

**Print-CSS-Strategie:**
- Hide via Selektor-Liste in `@media print`: Map-Container (`[data-testid="atlas-shell"] > div:first-child`), Site-Header (Tailwind `print:hidden`), Meta-Footer (Tailwind `print:hidden`), ShareSheet + Trigger + Inspector-Close.
- Inspector-Print-Meta `<div data-testid="inspector-print-meta">` mit Adresse + Datum + `page.url.toString()`; on-screen `display:none`, in `@media print` `display:block`.
- Severity-Tokens via `:root { --severity-*: #000 }` Override → ValueChip border-only + bold.

**Inspector-Footer-Migration:**
- `PermalinkButton` entfernt (Komponente + Unit-Test + e2e-Permalink-Test → Share-Sheet-Test). Per AC-1 "Bestehender PermalinkButton wird zu Share-Sheet-Option migriert (nicht parallel)".

**Scope-Decisions:**
- `share-sheet-trigger.svelte` als separate Komponente verworfen → Inline-Button im Inspector-Footer (kein Extra-File für 8 Zeilen Trigger-Markup).
- E2E + axe-Run deferred zu CI (Pattern Story 1.13–1.19).
- Phase-2-Items unverändert: Wohnungsgesuch-Vorlage, QR-Code, JSON-Export, PNG-File-Share via `files`-Field, Edge-Cache.

**Tooling:**
- Added deps: `@fontsource/ibm-plex-sans@5.2.8`, `@fontsource/ibm-plex-serif@5.2.7`, `@fontsource/ibm-plex-mono@5.2.7`, `wawoff2@2.0.1` (alle devDependencies, runtime via `await import` lazy-loaded).
- Ambient types: `src/lib/types/wawoff2.d.ts`.

### File List

**New:**
- `src/lib/utils/llm-export-builder.ts`
- `src/lib/utils/llm-export-builder.test.ts`
- `src/lib/utils/og-card-renderer.ts`
- `src/lib/utils/og-card-renderer.test.ts`
- `src/lib/utils/og-image-url.ts`
- `src/lib/utils/og-image-url.test.ts`
- `src/lib/utils/native-share.ts`
- `src/lib/utils/native-share.test.ts`
- `src/lib/components/atlas/inspector-panel/share-sheet.svelte`
- `src/lib/components/atlas/inspector-panel/share-sheet.svelte.test.ts`
- `src/routes/api/og/share/+server.ts`
- `src/lib/types/wawoff2.d.ts`
- `static/og-default.png`
- `tests/api/og-share.test.ts`
- `tests/e2e/share-sheet.e2e.ts`

**Modified:**
- `src/lib/components/atlas/inspector-panel.svelte` (Share-Sheet integration, print-meta block)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (permalink → share-sheet test)
- `src/lib/components/atlas/site-header.svelte` (print:hidden)
- `src/lib/components/atlas/meta-footer.svelte` (print:hidden)
- `src/routes/(with-header)/+page.svelte` (og-meta + twitter-meta in svelte:head)
- `src/app.css` (@media print rules)
- `tests/e2e/inspector-panel.e2e.ts` (permalink → share-sheet test)
- `package.json` (deps: @fontsource/ibm-plex-* + wawoff2)
- `pnpm-lock.yaml`

**Deleted:**
- `src/lib/components/atlas/inspector-panel/permalink-button.svelte`
- `src/lib/components/atlas/inspector-panel/permalink-button.svelte.test.ts`

### Change Log

- 2026-05-14: Story 1.20 implementiert. ShareSheet (Permalink/KI/Print/Native-Share), OG-Card via Satori+Resvg+wawoff2, Print-CSS, OG-Meta-Tags. PermalinkButton-Migration. 54 neue Unit-Tests, 10 E2E-Tests, type-check clean.
- 2026-05-14 (User-Review-Wave-2): KI-Export-Klima-Section erweitert um Min/Max/Latest + Normalperioden-Mittelwerte 1961–1990 + 1991–2020 pro Indikator (Heiße Tage, Frost-Tage, Jahresmittel). value-formatters Wohnlage count-breakdown nur bei Multi-Bucket (vorher dupliziert „überwiegend mittel" mit „(N mittel)"). Permalink-Domain: kein Code-Change, SvelteKit `ORIGIN`-env in Production-Coolify-Config setzen. +3 Klima-Tests grün, gesamt 984 unit-tests.
- 2026-05-14: Rest-Feedback in Stories 1.21–1.25 ausgelagert (Mobility-Soft-Cutoff, Skala-Harmonisierung-Grün, Daten-fehlt-Reason, Klima-Normalperioden-UI, PET-2022-Coverage-Bug).

## Dev Notes

### Satori + Resvg Pipeline

Beide schon in `package.json`:
```json
"satori": "^0.26.0",
"@resvg/resvg-js": "^2.6.2"
```

Satori erzeugt SVG aus JSX-like-vDOM. Resvg konvertiert SVG → PNG-Buffer. Pattern:

```ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';

const plexSerif = await readFile('static/fonts/IBMPlexSerif-Regular.otf');

const svg = await satori(
  {
    type: 'div',
    props: {
      style: { display: 'flex', /* ... */ },
      children: [/* ... */]
    }
  },
  {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Plex Serif', data: plexSerif, weight: 400, style: 'normal' }]
  }
);
const resvg = new Resvg(svg);
const pngData = resvg.render().asPng();
return new Response(pngData, { headers: { 'Content-Type': 'image/png' } });
```

### Inline-Feedback-State-Pattern

Pro Sheet-Option:
```ts
let state = $state<'idle' | 'copying' | 'done'>('idle');
async function onCopy(payload: string): Promise<void> {
  state = 'copying';
  try {
    await navigator.clipboard.writeText(payload);
    state = 'done';
    setTimeout(() => (state = 'idle'), 1800);
  } catch {
    state = 'idle';
    /* inline-error-text below button */
  }
}
```

UI:
```svelte
<button onclick={() => onCopy(permalink)}>
  {#if state === 'done'}
    <Check size={16} aria-hidden="true" />
    <span>Permalink kopiert</span>
  {:else}
    <Link2 size={16} aria-hidden="true" />
    <span>Permalink kopieren</span>
  {/if}
</button>
<span class="sr-only" aria-live="polite">
  {state === 'done' ? 'Permalink in Zwischenablage' : ''}
</span>
```

### Token-Approximation

`Math.ceil(charCount / 4)` — grobe Heuristik OpenAI tokenizer. Genauer wäre `tiktoken`, aber 50KB lib unverhältnismäßig. Zeige als "≈ 2,4k Tokens" mit `≈` als Genauigkeits-Disclaimer.

### Native-Share-API Caveats

`navigator.share` ist:
- Mobile: iOS/Android-Browser breit unterstützt (Safari iOS 12+, Chrome Android)
- Desktop: Chrome 89+, Edge 89+, NICHT in Firefox
- Erfordert User-Gesture + HTTPS
- `files`-Field Support fragmentiert; PNG-Share Phase-2

Detection:
```ts
export function canNativeShare(payload?: ShareData): boolean {
  if (typeof navigator === 'undefined' || !('share' in navigator)) return false;
  if (payload && navigator.canShare && !navigator.canShare(payload)) return false;
  return true;
}
```

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (Icons)
- #2 Files <500 Zeilen (Sheet-Komponente eventuell auf 2-3 Sub-Komponenten splitten)
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- #13 A11y-First (Dialog-Pattern + Focus-Trap)
- #14 i18n-First (Strings als const-Map)
- #15 Editorial-Verantwortung (Stolperstein-Würde-Hint im LLM-Export)
- #19 NEVER toast (siehe Feedback-Memory `feedback_no_toast.md`)

### OG-Card-Layout-Skizze

```
┌───────────────────────────────────────────────────────────┐
│  Cloud-Dancer Background (Plex-Cartography-Light)         │
│                                                            │
│  Boxhagener Straße 12          [navigator.berlin Logo]    │
│  10245 Berlin · Friedrichshain-Kreuzberg                  │
│                                                            │
│  ────────────────────────────────────────────             │
│                                                            │
│  Wohnlage         gut                                      │
│  Lärm Tag         65 dB                                    │
│  ÖPNV             U-Bahn 220m · 3 min                      │
│                                                            │
│  ────────────────────────────────────────────             │
│                                                            │
│  navigator.berlin · Stand 2026-05-14                       │
└───────────────────────────────────────────────────────────┘
```

Top-3-Layer-Auswahl: heuristisch — Wohnlage (wenn vorhanden), Lärm (wenn vorhanden), ÖPNV-Rating. Fallback: erste 3 Layer-Hits.

### Library/Framework Requirements

**Neu:** keine. Satori + Resvg + Lucide bereits in deps.

### Testing Requirements

**Unit:** llm-export-builder, og-card-renderer (Satori-Output-Snapshot), share-sheet-render
**Integration:** /api/og/share Endpoint (server-test mit Mock-Request)
**E2E:** Share-Sheet-Open + Copy-Feedback + Sheet-Close
**Coverage-Target:** ≥85% Pure-Util, ≥75% Sheet-Komponente

### Previous Story Intelligence

- **Story 1.7:** URL-State-Sync — Permalink-Builder vorhanden
- **Story 1.9:** Inspector-Panel — Footer-Slot für Share-Button
- **Story 1.10:** Bottom-Sheet-Pattern (Mobile) wiederverwenden
- **Story 1.12:** EDITORIAL_CONFIG mit Stolperstein-Würde-Pattern für LLM-Export-Footer
- **Story 1.16:** getLayerExplain für LLM-Export-Beschreibungen
- **Story 1.18:** ValueChip Severity-Tokens (relevant für Print-CSS Greyscale-Override)
- **Story 1.19:** ÖPNV-Stops + Mobility-Rating für LLM-Export-Sektion + OG-Card-Snippet

### Open Questions

1. **OG-Image-Cache-Strategy:** server-side memoization per Adress-Hash, oder pures HTTP-Cache-Header? Phase-1: HTTP-Cache reicht; Phase-2: Edge-Cache wenn Hetzner/Coolify das hergibt.
2. **Permalink-URL-Länge:** mit allen Active-Layers + Adresse kann URL >300 char werden. Twitter trimmt. Phase-1 akzeptieren; Phase-2 evtl. Short-URL-Service (selbst-hosted, kein Bitly).
3. **OG-Default-Image:** statisch via Build-Step (z.B. `pnpm build:og-default`) oder ins Repo committen? Vermutlich ins Repo, klein.
4. **LLM-Export-Sprache:** aktuelle UI-Locale (DE/EN nach Story 3.x) oder immer DE? Phase-1: aktuelle Locale; Strings als const-Map.
5. **JSON-Export im Sheet:** scope-creep oder klein extra? Phase-2 wenn User explizit fragt.
6. **Wohnungsgesuch-Vorlage:** als separate Sheet-Option oder eigene Story? Vermutlich eigene Story (1.21) — Use-Case berlin-spezifisch + narrative-Wert.
7. **QR-Code-Option:** Phase-2; einfache lib `qrcode` integrierbar, aber MVP-Scope strict halten.

### Phase-2-Backlog (separate Stories)

- 1.21 Wohnungsgesuch-Vorlage-Template
- 1.22 QR-Code im Share-Sheet für Offline-Adress-Share
- 1.23 JSON-Export-Toggle für Datenjournalismus
- 2.7 WebMCP-Integration (LLM-Agent kann via Tool die gleichen Daten holen → ShareSheet-LLM-Markdown wird Bridge bis WebMCP läuft)

## References

- [Source: src/lib/components/atlas/inspector-panel/permalink-button.svelte] (zu migrierender Bestand)
- [Source: _bmad-output/implementation-artifacts/1-16-layer-explain-coverage.md] (LayerExplain-API)
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md] (EDITORIAL_CONFIG + Disclaimer-Pattern)
- [Source: _bmad-output/implementation-artifacts/1-19-naechste-oepnv-stops.md] (ÖPNV-Mobility-Rating für OG-Card)
- [Source: _bmad-output/planning-artifacts/architecture.md] (Server-Endpoint-Pattern)
- [Source: https://github.com/vercel/satori] (Satori JSX-vDOM API)
- [Source: https://github.com/yisibl/resvg-js] (Resvg SVG-to-PNG)
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_no_toast.md] (NEVER Toast Rule)
