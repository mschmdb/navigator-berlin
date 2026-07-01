# Story 2.6: OG-Image-Pipeline für Bezirk/Kiez/Layer

Status: ready-for-dev

## Story

As a Social-Media-Sharer / LLM-Crawler-Index,
I want pro Bezirks-, Kiez- und Layer-Route ein vor-gerendertes Open-Graph-Bild mit Karten-Snapshot und Top-Aggregat-Werten als statisches PNG-Asset,
so that geteilte Links visuell ansprechend mit Berlin-Kontext erscheinen, Twitter-/Facebook-/LinkedIn-/Mastodon-Cards funktionieren und kein Runtime-Generierungs-Last entsteht.

## Probleme heute

1. Bezirks-/Kiez-/Layer-Pages haben kein OG-Image-Asset. Story 2.3 + 2.4 + 2.5a setzen zwar `<meta property="og:image" content="/og/bezirk/{slug}.png">`, die Datei existiert aber nicht (404).
2. Adress-OG-Card existiert dynamisch via `routes/api/og/share/+server.ts` (Story 1.20). Pattern ist da, aber bisher nur User-Address-getriggert, nicht pre-gerendert pro Page.
3. Karten-Snapshots fehlen komplett. Satori rendert nur Text + Vektor-Inhalte (SVG), kein MapLibre-Tiles. Karten-PNGs müssen separat als Background-Asset entstehen.
4. Build-Zeit-Budget: ~190 Routen × 2 Locales = ~380 PNGs. Pro PNG ggf. Headless-MapLibre-Render (teuer) plus Satori-Overlay (günstig). Risiko Build-Zeit-Sprengung wenn ohne Cache-Strategie.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1224-1248.
- PRD: FR31 (`prd.md` Zeile 733).
- Bestehender OG-Endpoint: `src/routes/api/og/share/+server.ts` (Story 1.20, Adress-OG-Card).
- Bestehender Renderer: `src/lib/utils/og-card-renderer.ts` mit `validateOgParams`, `loadDefaultOgFonts`, `renderOgCardPng` (Satori + Resvg + wawoff2 für IBM-Plex-Fonts).
- Bestehender URL-Builder: `src/lib/utils/og-image-url.ts` (`buildOgImageUrl(input, baseUrl)` → `/api/og/share?...`).
- Installed deps: `satori@^0.26`, `@resvg/resvg-js@^2.6`, `wawoff2@^2.0`, `fontaine@^0.8` (devDeps).
- Memory `project_satori_font_pipeline.md`: kein woff2 + kein Variable-Font + sequenzielles wawoff2-Decoding, sonst Magic-Byte-Korruption.
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`.
- Stories 2.3/2.4/2.5a: setzen OG-Meta-Tags mit Pfad `${origin}/og/{type}/{slug}.png` (Story 2.6 produziert die Files).
- Story 2.0: Aggregat-Werte für Top-3-Statistik (`bezirk_stats`, `kiez_stats`).
- Story 1.20: bestehende Satori-Pipeline als Vorlage für die statischen Renderer.

## Akzeptanz-Kriterien

1. **AC-1 (Karten-Snapshot-Pipeline):**
   **Given** dass Satori keine MapLibre-Tiles rendern kann
   **When** ich `scripts/generate-og-snapshots.ts` als Pre-Step implementiere
   **Then**:
   - Skript rendert pro Bezirk + Kiez + Layer einen Karten-Hintergrund als PNG (1200×630, OG-Standard)
   - Implementierungs-Optionen (Open-Question 1):
     - **Variante A (Headless MapLibre + Playwright):** `playwright`-Browser rendert die Karte mit `static/map-style.json`, scriptbasiertem Viewport, Boundary-Highlight, screenshot in PNG
     - **Variante B (PMTiles + map-rendered):** `npm:map-rendered` direkt mit PMTiles (falls Setup einfach) ohne Browser
     - **Variante C (mapnik-cli / Static Map Service):** zu komplex, raus
   - Empfehlung A (Playwright bereits in Deps für E2E)
   - Output: `static/og/snapshots/{type}/{slug}.png` (1200×630, ~50-100 KB pro PNG nach JPEG-Encoding oder PNG-Optimierung mit `sharp` ggf.)
   - Idempotenz: Cache-Key aus Bezirk-Bbox + Map-Style-Hash; bei unverändertem Cache-Key → kein Re-Render
   - Layer-Snapshots: Karten-Snapshot mit aktivem Layer + neutralen Boundaries (z.B. Bezirke), zentriert auf Berlin-Mitte
   - Bezirks-Snapshots: Bezirks-Polygon highlighted, fitBounds auf Bezirks-Bbox
   - Kiez-Snapshots: Kiez-Polygon highlighted, fitBounds auf Kiez-Bbox
   - Build-Zeit-Spike: 190 Snapshots × ~500ms (Playwright-Headless) = ~95 Sek. + Cache-Hits → akzeptabel
   - Test: 1 Bezirk + 1 Kiez + 1 Layer Snapshot-Generation-Smoke

2. **AC-2 (OG-Image-Overlay-Pipeline):**
   **Given** Karten-Snapshots als PNG-Assets
   **When** ich `scripts/generate-og-images.ts` als zweiten Build-Step implementiere
   **Then**:
   - Skript liest pro Page-Type + Slug + Locale: Snapshot-PNG + Aggregat-Daten (Postgres oder Manifest)
   - Satori-Overlay mit:
     - Berlin-Brand-Mark (Wortmarke, Plex-Mono-Bold) oben links
     - Page-Titel (Plex-Serif, gross): Bezirks-Name / Kiez-Name / Layer-Name
     - Sub-Line: Bezirks-Hierarchie für Kieze, Bundle-Group für Layer
     - Top-3-Aggregat-Werte als 3 Stat-Cards (z.B. „L_DEN 58 dB", „PET 32 °C", „Stationen 8.2/km²")
     - Lizenz-Footer + URL `navigator.berlin/{type}/{slug}`
   - Satori-Pipeline reuse aus `og-card-renderer.ts` (gleiche Plex-Font-Loading + Satori + Resvg-Chain); neuer Layout-Template als sub-File `src/lib/server/og/page-card-template.ts`
   - Memory `project_satori_font_pipeline.md` einhalten: kein woff2 + kein Variable-Font + sequenzielles wawoff2 (gleiches Pattern wie 1.20)
   - Output: `static/og/{type}/{slug}.{locale}.png` (DE + EN getrennt für lokalisierte Texte)
   - Build-Zeit < 2 Minuten gesamt für ~380 PNGs (Epic-AC)
   - Idempotenz: Hash-basiert pro (snapshot-hash + aggregat-hash + template-hash), bei unverändertem Hash → Cache-Hit
   - Tests: Pure-Function-Tests des Layout-Templates mit Fixture-Aggregat, plus Smoke-Test mit 1 Bezirk PNG-Render

3. **AC-3 (Daten-Quelle Top-3-Aggregat):**
   **Given** Story 2.0 `bezirk_stats`/`kiez_stats` als Aggregat-Cache
   **When** ich Top-3-Werte pro Page wähle
   **Then**:
   - Bezirk/Kiez: 3 Top-Werte nach folgender Priorität (Open-Question 2 zur Auswahl):
     - **Variante A (Recommended, deterministisch):** fix `Lärm L_DEN` + `Klima PET` + `Mobilität Stationen/km²` (gleiche 3 Werte für jeden Bezirk/Kiez, einfach + konsistent)
     - **Variante B (kontextuell):** Top-3-Werte mit höchster Abweichung vom Berlin-Mittel (interessanter pro Page, aber höhere Komplexität)
   - Layer: Layer-Name + Authority + Lizenz + Stand-Datum als „Card-Werte" (kein Aggregat-Mittel pro Layer-Page, da Layer-Page das Konzept erklärt, nicht einen Bezirks-Wert)
   - Falls Story 2.0 noch nicht durch: Bezirk/Kiez-OG-Bilder rendern mit Placeholder-Cards „Daten ab Story 2.0 verfügbar"; Layer-Bilder können sofort gerendert werden
   - Locale: Card-Beschriftungen via Paraglide-Messages (DE Default, EN-Coverage Story 2.5a-Pattern)

4. **AC-4 (Meta-Tags pro Page korrekt gesetzt):**
   **Given** Stories 2.3/2.4/2.5a setzen OG-Meta bereits ein
   **When** ich finale Meta-Tags verifiziere
   **Then**:
   - `<meta property="og:image" content="${origin}/og/{type}/{slug}.{locale}.png">`
   - `<meta property="og:image:width" content="1200">`
   - `<meta property="og:image:height" content="630">`
   - `<meta property="og:image:type" content="image/png">`
   - `<meta property="og:image:alt" content="{Page-Titel} · navigator.berlin">`
   - Twitter-Card-Tags: `<meta name="twitter:card" content="summary_large_image">` + `<meta name="twitter:image" content="...">`
   - Falls SeoHead-Komponente aus Story 2.1 fertig: SeoHead-Prop `ogImage` füllt diese Tags zentral
   - Tests: pro Page-Type Snapshot der OG-Meta-Block

5. **AC-5 (Auslieferung mit `immutable`-Cache):**
   **Given** statische PNGs in `static/og/{type}/{slug}.{locale}.png`
   **When** SvelteKit / Coolify die Assets ausliefert
   **Then**:
   - Statische Files erhalten `cache-control: public, max-age=2592000, immutable` (30 Tage, gleiches Pattern wie GeoJSON-Layer per NFR-P10)
   - Da Pfade keinen Hash enthalten: Cache-Invalidation per Filename-Hash optional (z.B. `bezirk/mitte.de.{hash}.png`). Trade-off: Hash → Cache-Bust einfach, aber Meta-Tag-Pflege schwieriger; ohne Hash → Coolify-Deploy invalidet via neuer Build-Run. Empfehlung ohne Hash (siehe Open-Question 3)
   - KEIN Runtime-Endpoint `routes/api/og/{type}/{slug}.png` nötig (Adress-OG aus Story 1.20 bleibt dynamisch, dies hier ist Build-Time)
   - SvelteKit-Static-Adapter-Verhalten verifizieren: `static/og/`-Pfad muss bei Build erhalten bleiben (keine Filtering)

6. **AC-6 (Build-Step-Registrierung):**
   **Given** Existing-Build-Pipeline (`pnpm data:fetch && pnpm data:aggregate && pnpm build` aus Story 2.0)
   **When** OG-Pipeline integriert wird
   **Then**:
   - `package.json`-Scripts neu: `og:snapshots` (Karten-PNGs), `og:images` (Satori-Overlay), `og:all` (beide)
   - Reihenfolge: `data:fetch && data:aggregate && og:snapshots && og:images && build`
   - `prebuild`-Hook bleibt aus (zu teuer für Dev-HMR per Story-2.0-Pattern); CI ruft explizit auf
   - Doku in `docs/data-pipeline.md` ergänzt
   - Locale-Hinweis: `og:images` braucht Aggregat-Texte pro Locale; bei EN-Übersetzungs-Gap (Story 2.5a) rendert Pipeline EN mit DE-Fallback-Texten + Disclaimer-Hinweis nicht im PNG (PNG bleibt visuell EN, Text fällt zurück)

7. **AC-7 (Static-Serving-Pfad sauber):**
   **Given** dass `static/og/` git-committed wird (Cache-Pattern)
   **When** ich `.gitignore` und `static/og/.gitkeep`-Konvention setze
   **Then**:
   - `static/og/snapshots/` ist `.gitignore`d (Build-Zeit-generiert, kein Source-Control)
   - `static/og/{type}/` ist `.gitignore`d (PNGs sind Build-Output, kein Source-Control)
   - `static/og/.gitkeep` plus `static/og/README.md` mit Hinweis „Diese Files werden von `pnpm og:all` Build-Time generiert. Nicht von Hand bearbeiten."
   - `og-default.png` (Adress-Fallback aus Story 1.20) bleibt im Repo (`static/og-default.png` ist bestand, nicht im neuen Pfad)
   - Test: `.gitignore` prüfen, dass `static/og/snapshots/`, `static/og/bezirk/`, `static/og/kiez/`, `static/og/layer/` ausgeschlossen sind

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: Snapshot-Pipeline-Smoke-Test (1 Bezirk, 1 Kiez, 1 Layer)
   - AC-2: Pure-Function-Tests für Layout-Template + 1 echter PNG-Render-Smoke
   - AC-3: Top-3-Werte-Selector-Test (deterministische Auswahl)
   - AC-4: Page-Snapshot-Test der OG-Meta-Tags
   - AC-5: Static-Asset-Auslieferungs-Smoke (lokal `pnpm preview`)
   - AC-6: Build-Script-Existenz-Test
   - AC-7: `.gitignore`-Inhalt-Test
   - E2E-Optional: Karten-Snapshot-Visual-Diff (nicht im CI-Hard-Gate; lokal-only)
   - Coverage-Ziel: Layout-Template 100%, Renderer-Helpers ≥90%

## Tasks / Subtasks

- [ ] **T1: Karten-Snapshot-Pipeline** (AC: 1, 8)
  - [ ] T1.1: User-Decision Open-Question 1 (Playwright vs. PMTiles direkt)
  - [ ] T1.2: `scripts/generate-og-snapshots.ts` mit Map-Render-Logic (1200×630)
  - [ ] T1.3: Cache-Pattern: Hash aus (slug + bbox + map-style-hash + style-version)
  - [ ] T1.4: Iteration pro Page-Type × Slug
  - [ ] T1.5: Smoke-Test 3 Snapshots

- [ ] **T2: OG-Image-Layout-Template** (AC: 2, 3, 8)
  - [ ] T2.1: `src/lib/server/og/page-card-template.ts` mit Satori-JSX-Template (Bezirk/Kiez/Layer-Varianten oder unified mit Type-Switch)
  - [ ] T2.2: Top-3-Selector-Logic (`src/lib/server/og/top-stats-selector.ts`)
  - [ ] T2.3: Re-use `loadDefaultOgFonts` aus `og-card-renderer.ts` (Memory-Pflicht: kein woff2, kein Variable, sequenzielles wawoff2)
  - [ ] T2.4: Pure-Function-Tests pro Template-Variante

- [ ] **T3: Overlay-Pipeline + Cache** (AC: 2, 5)
  - [ ] T3.1: `scripts/generate-og-images.ts` mit Satori-Render + Snapshot-Compositing
  - [ ] T3.2: Cache-Hash-Detection
  - [ ] T3.3: Locale × Page × Slug-Iteration
  - [ ] T3.4: PNG-Output in `static/og/{type}/{slug}.{locale}.png`

- [ ] **T4: Page-Meta-Tags-Verify** (AC: 4)
  - [ ] T4.1: Stories 2.3/2.4/2.5a-Meta-Tag-Pfade konsistent prüfen
  - [ ] T4.2: SeoHead-Komponente (Story 2.1) `ogImage`-Prop bedienen falls Story durch
  - [ ] T4.3: Twitter-Card-Tags pro Page
  - [ ] T4.4: Snapshot-Tests pro Page-Type

- [ ] **T5: Build-Script + Pipeline-Integration** (AC: 6, 8)
  - [ ] T5.1: `package.json`-Scripts `og:snapshots`, `og:images`, `og:all`
  - [ ] T5.2: Doku in `docs/data-pipeline.md`
  - [ ] T5.3: Build-Verify: `pnpm og:all` produziert erwartete PNG-Anzahl

- [ ] **T6: Static-Pfad-Konvention** (AC: 7)
  - [ ] T6.1: `.gitignore`-Update
  - [ ] T6.2: `static/og/README.md` als Hinweis-File
  - [ ] T6.3: `static/og/.gitkeep`
  - [ ] T6.4: Test der `.gitignore`-Regeln

- [ ] **T7: Final-Verifikation** (AC: 1-8)
  - [ ] T7.1: `pnpm test:unit -- --run` 100% grün
  - [ ] T7.2: `pnpm check` 0 Errors
  - [ ] T7.3: `pnpm og:all && pnpm build` läuft, OG-PNGs existieren
  - [ ] T7.4: Spotcheck Twitter-Card-Validator + Facebook-Sharing-Debugger gegen Production-URL (manuell, nicht in CI)
  - [ ] T7.5: Browser-Verify Sharing aus 3 Pages (Bezirk/Kiez/Layer)
  - [ ] T7.6: Sprint-Status-Eintrag

## Dev Notes

### Karten-Snapshot-Implementierung (Open-Question 1)

| Variante | Setup | Build-Zeit | Risiko |
|----------|-------|------------|--------|
| A: Headless Playwright + MapLibre | Playwright in Deps; eigene `og-map-render.html`-Page lädt MapLibre headless | ~500ms/PNG → ~95s gesamt | Browser-Render-Flakiness, aber gut testbar |
| B: PMTiles direkt + map-rendered | npm-Package; kein Browser; rein Node | ~200ms/PNG → ~40s | Setup-Komplexität; Style-Konsistenz mit Frontend zu testen |
| C: External Static Map Service | Mapbox-Static-API / Maptiler | Cloud-Call | US-Vendor (NFR-S7 verletzt); raus |

**Empfehlung A** wegen bestehender Playwright-Deps + voller Style-Parity mit `static/map-style.json`. Headless-Setup: `playwright.config.ts` neue Project-Konfig „og-render" mit Viewport 1200×630, lokaler URL `localhost:4173/_dev/og-render/{type}/{slug}` (neue dev-only Route die Karte rendert, dann von Playwright gescreenshotted).

Alternativ ohne dev-Route: Playwright-Script lädt direkt eine HTML-Template-File mit MapLibre-Script-Tag und renderts.

### Top-3-Werte-Selector (Open-Question 2)

| Variante | Werte | Vor- | Nachteile |
|----------|-------|------|-----------|
| A: Fix 3 Werte je Type | Bezirk: L_DEN, PET, Stationen/km² | Konsistent, deterministisch | Boring, identisch pro Bezirk |
| B: Abweichungs-basiert | Top-3 mit höchster Σ-Standardabweichung zum Berlin-Mittel | Page-spezifisch interessant | Komplex, hängt von Berlin-Mittel-Berechnung ab |

**Empfehlung A** für MVP. Spätere Iteration kann B oben drauf, wenn UX-Wert klar.

### Karten-Snapshot-Reuse für Layer-OG-Bilder

Layer-Pages haben anderen Sinn: das Konzept (Mietspiegel, Lärm) wird erklärt, nicht ein Bezirks-Wert gezeigt. Layer-OG-Bild Idee:

- Karte mit aktivem Layer-Style über ganz Berlin (kein Bezirks-Boundary-Highlight)
- Layer-Name + Bundle-Group + Authority + Lizenz als Card-Texte
- Stand-Datum (sourceUpdatedAt) als Subline

Karten-Snapshot pro Layer ist ein eigener Render-Pfad: lädt das Layer-GeoJSON, rendert Berlin-fitBounds, Layer-Style aus `static/map-style.json`-Layer-Definition.

### Cache-Pattern + Filename-Hash (Open-Question 3)

Ohne Hash: `bezirk/mitte.de.png` (fester Pfad). Vorteile: Meta-Tag stabil, einfache Logik. Nachteile: Browser-Cache invalidet nicht automatisch bei neuem Build.

Mit Hash: `bezirk/mitte.{hash8}.de.png`. Vorteile: `immutable`-Cache hart, sichere Cache-Bust. Nachteile: Page-Meta-Tag muss Hash kennen → Manifest-Lookup zur Build-Zeit.

**Empfehlung ohne Hash + kurze `max-age=86400`** (24h statt 30d). Coolify-Deploy invalidet manuell beim Stake-Holder-Push.

### Memory-Pflicht: Satori-Font-Pipeline

Per Memory `project_satori_font_pipeline.md`:

- **KEIN woff2** an Satori geben → Magic-Byte-Korruption
- **KEIN Variable-Font** → muss instanced/static-Subset sein
- **wawoff2 sequenziell** decoden, nicht parallel mit `Promise.all`

`loadDefaultOgFonts` in `og-card-renderer.ts:244` ist bereits korrekt. Re-use, nicht neu schreiben (MUST-Rule #3).

### Build-Zeit-Budget

Phase 1 Kombination:

- 12 Bezirke × 2 Locales = 24 PNGs
- 138 Kieze × 2 Locales = 276 PNGs (Variante A aus Story 2.4)
- 42 Layer × 2 Locales = 84 PNGs
- Total ~384 PNGs
- Pro PNG: Snapshot (~500ms) + Overlay (~200ms) = ~700ms
- Build-Zeit: ~5 Minuten ohne Cache, sub-1-Minute mit Cache-Hits

Epic-AC sagt < 2 Min für ~380 PNGs. Realistisch ohne aggressives Caching ehrgeizig; mit Cache-Hit-Quote >50% gut machbar.

### Page-Type vs. Locale-Suffix

OG-PNGs sind locale-spezifisch (DE-Titel vs. EN-Titel). Empfohlene Pfad-Konvention:

```
static/og/
  bezirk/
    mitte.de.png
    mitte.en.png
    ...
  kiez/
    boxhagener-kiez.de.png
    boxhagener-kiez.en.png
    ...
  layer/
    laerm-2023.de.png
    laerm-2023.en.png
    ...
  snapshots/         # interne Pre-Step-Outputs, .gitignored
    bezirk-mitte.png
    ...
```

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Layout-Template ggf. pro Page-Type aufgeteilt
- **#3 Bestehende Funktionen prüfen:** `loadDefaultOgFonts`, `renderOgCardPng`, Satori-Setup aus 1.20
- **#7 TypeScript strict:** Aggregat-Typen via Story 2.0
- **#10 Cookieless:** statische PNGs, kein Cookie
- **#11 Kein US-Drittanbieter:** Mapbox/Maptiler-Static-API raus
- **#19 Remote Functions:** nicht relevant (statische Assets)

### Open-Questions vor Dev-Start

1. **Karten-Snapshot-Implementierung Variante A/B/C:** Empfehlung A (Headless Playwright). Akzeptabel?
2. **Top-3-Werte-Auswahl A/B:** Empfehlung A (fix 3 Werte). OK?
3. **Filename-Hash + Cache-Strategie:** ohne Hash + 24h Cache (Empfehlung) oder mit Hash + immutable. User-Decision?
4. **Build-Zeit-Skalierung Variante B (Story 2.4 mit 1.084 Kiez-Routen):** würde OG-Pipeline auf ~1.000 Kiez-PNGs hochziehen, Build-Zeit-Sprengung. Empfehlung: 2.6 wartet auf 2.4-Decision; falls Variante B → OG-Kiez-Generation auf Top-50-Kieze beschränken (siehe Bandbreite-Argument im epic).
5. **Static-Files committed oder Build-only?** Empfehlung Build-only (gitignored), Coolify-Build-Step erzeugt frisch. Vorteil: Repo-Größe niedrig. Nachteil: jeder Build muss Pipeline laufen lassen.

### Project Structure Notes

- Snapshot-Skript: `scripts/generate-og-snapshots.ts`
- Overlay-Skript: `scripts/generate-og-images.ts`
- Server-Helper: `src/lib/server/og/` (`page-card-template.ts`, `top-stats-selector.ts`)
- Re-use: `src/lib/utils/og-card-renderer.ts` (Font-Loader)
- Output: `static/og/{type}/{slug}.{locale}.png`
- Snapshots-Cache: `static/og/snapshots/` (gitignored)
- README: `static/og/README.md` (Hinweis "Build-generiert")
- Doku: Erweiterung in `docs/data-pipeline.md`

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1224-L1248](../planning-artifacts/epics.md)
- FR31: [prd.md#L733](../planning-artifacts/prd.md)
- Story 1.20 OG-Card-Renderer: [src/lib/utils/og-card-renderer.ts](../../src/lib/utils/og-card-renderer.ts)
- Story 1.20 OG-API-Endpoint: [src/routes/api/og/share/+server.ts](../../src/routes/api/og/share/+server.ts)
- Story 2.0 Aggregat: [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.3/2.4/2.5a OG-Meta-Tags: jeweilige Story-Files
- Memory `project_satori_font_pipeline.md`
- Map-Style: [static/map-style.json](../../static/map-style.json)

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
