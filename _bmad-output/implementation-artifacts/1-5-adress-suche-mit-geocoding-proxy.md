# Story 1.5: Adress-Suche mit Geocoding-Proxy

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Bürger,
I want eine Adress-Suche mit Suggest-as-you-type für Berliner Adressen,
so that ich nach 2 Zeichen passende Treffer sehe und per Tastatur oder Maus selektieren kann.

## Acceptance Criteria

1. **AC-1 (Server-Geocoding-Proxy):**
   **Given** SvelteKit-Setup + Env-Vars aus Story 1.1
   **When** `src/routes/api/geocode/+server.ts` als GET-Handler implementiert wird
   **Then** Proxy hat folgende Properties:
   - Query-Param `q` (mind. 2 Zeichen, Valibot-validiert)
   - Berlin-Bbox als Constraint: `viewbox=13.0883,52.6755,13.7611,52.3382&bounded=1` (W,N,E,S)
   - `User-Agent: navigator.berlin/1.0 (mailto:hallo@navigator.berlin)`
   - `Accept-Language` aus Request-Locale-Detection oder Default `de`
   - In-Process LRU-Cache (`lru-cache`, max 1.000 Einträge, TTL 24h)
   - Rate-Limit 1 req/s gegen Nominatim via Token-Bucket (siehe Dev-Note „Rate-Limit-Pattern")
   - KEIN Forward der Client-IP (NFR-PR2, NFR-I6)
   - Response: `{ suggestions: GeocodeSuggestion[] }`, max 10 Einträge sortiert nach Relevanz
   **And** Erfüllt NFR-I6, NFR-PR2, NFR-S7 (Allowlist-Eintrag in Story 4.3).

2. **AC-2 (Geocoding-Server-Logik in `$lib/server/`):**
   **Given** Proxy-Route
   **When** Server-Logik in `src/lib/server/geocode.ts` modularisiert wird
   **Then** Module exportiert:
   - `proxyNominatim(q: string, lang?: Locale): Promise<GeocodeSuggestion[]>`
   - LRU-Cache (Singleton, beim Module-Load erzeugt)
   - Rate-Limit-Token-Bucket (Singleton)
   - Berlin-Bbox-Filter Post-Query (Nominatim respektiert `bounded=1` nicht immer streng)
   **And** Bei Nominatim-Fehler oder Timeout (5s): Throw mit klarem Error-Code, wird in `+server.ts` zu 502/504 gemapped
   **And** Modul ist Server-Only — verifiziert durch Import-Test (`import` aus Component → Build-Error).

3. **AC-3 (Remote-Function-Wrapper):**
   **Given** Server-Endpoint
   **When** `src/lib/data/geocode.remote.ts` als SvelteKit `query()`-Remote-Function angelegt wird:
   ```typescript
   export const geocodeAddress = query(
     v.object({ q: v.pipe(v.string(), v.minLength(2), v.maxLength(120)) }),
     async ({ q }) => await proxyNominatim(q)
   );
   ```
   **Then** Components importieren `geocodeAddress` statt eigenes `fetch('/api/geocode')`
   **And** SvelteKit-internes Caching pro Argument-Set (gleicher `q` → kein Re-Fetch)
   **And** Erfüllt MUST-Rule #19.

4. **AC-4 (AddressSearch-Component):**
   **Given** Token-System, Bits-UI-Wrapper, Remote-Function
   **When** `src/lib/components/atlas/address-search.svelte` als Bits-UI-Combobox-basierte Komponente implementiert wird
   **Then** Komponente hat:
   - Prop `variant: 'hero' | 'header'` (UX-DR14)
   - Prop `placeholder?: string`, `value` als `$bindable()`
   - Callback `onSelect: (suggestion: GeocodeSuggestion) => void`
   - Debounce 250ms zwischen Input und `geocodeAddress`-Call (`lib/utils/debounce.ts`)
   - In-Memory-LRU für letzte 10 Anfragen (lokal in Komponente)
   - Suggest-Liste ab 2 Zeichen, max 10 Einträge
   - Tastatur-Navigation: Pfeil oben/unten, Enter, Escape — automatisch via Bits-UI-Combobox
   - Enter ohne Auswahl wählt erste Suggestion (UX-DR14)
   - ARIA-Live: Bits-UI-Combobox handelt das nativ; ergänzender `aria-live="polite"` Counter „N Vorschläge" für Status-Updates
   **And** Variant `hero`: groß zentriert, `--text-xl`-Input, kein Search-Icon
   **And** Variant `header`: kompakt, `--text-base`-Input, Lucide-Search-Icon (`@lucide/svelte`) links
   **And** Erfüllt FR1–FR4, UX-DR14.

5. **AC-5 (Error- + Empty-States):**
   **Given** AddressSearch
   **When** Nutzer unbekannte oder Außerhalb-Berlin-Adresse eingibt
   **Then** Anzeige eines Empty-State-Patterns (UX-DR35):
   - Bei null Suggestions: „Adresse konnte nicht gefunden werden — bitte korrigieren oder Bezirks-Mittelpunkt wählen."
   - Bei Außerhalb-Berlin-Marker: „Diese Adresse liegt außerhalb von Berlin"
   - Fallback-Action: Link „Bezirks-Mittelpunkt wählen" öffnet Bezirks-Liste (kommt aus `getLayersByBundle('A: Boundaries')` oder hardcoded 12 Bezirke)
   **And** Erfüllt FR5, FR6.

6. **AC-6 (Berlin-Bbox-Filter):**
   **Given** Nominatim-Response
   **When** Server-Logik Suggestions filtert
   **Then** Suggestions außerhalb Berlin-Bbox (S=52.3382, W=13.0883, N=52.6755, E=13.7611) werden verworfen
   **And** Suggestions mit `addresstype` aus Whitelist `['house', 'place', 'suburb', 'neighbourhood', 'city_district', 'postcode', 'road']` priorisiert; alles andere niedrigere Sortierung
   **And** Ergebnis-Schema: `GeocodeSuggestion = { id; displayName; lat; lng; type; addresstype; bezirk?; kiez?; postcode?; bbox?: [W,S,E,N] }`.

7. **AC-7 (Header-Komponente mit Logo + Wortmarke):**
   **Given** AddressSearch + Logo-Mark-SVG aus Story 1.2
   **When** `src/lib/components/atlas/site-header.svelte` erstellt wird
   **Then** Header enthält links: inline-`logo-mark.svg` (~32px Höhe) + Wortmarke `navigator.berlin` (siehe Dev-Note „Wortmarke-Schriftwahl")
   **And** Rechts: `<AddressSearch variant="header" />` (Compact-Variant)
   **And** Sprach-Switcher-Slot ganz rechts (Snippet-Prop, leer in Story 1.5 — Füllen in 3.2)
   **And** Hairline-Bottom-Border
   **And** Integriert in `+layout.svelte` zwischen `<SkipLink />` und `<main>`
   **And** **Landing-Page** (`src/routes/+page.svelte`) zeigt KEINEN Header (Hero-AddressSearch ist primary); andere Pages zeigen Header.

8. **AC-8 (Wortmarke-Schriftwahl + Visual-Test):**
   **Given** 6 Plex-Kandidaten aus Logo-Spec (A–F)
   **When** Test-Showcase in `src/routes/_dev/wortmarke/+page.svelte` rendert alle 6 Kandidaten mit echter Plex-Schrift in Header-Größen (24px / 28px) + Favicon-Größe (16px)
   **Then** Solo-Maintainer entscheidet Final-Kandidat anhand visueller Inspection
   **And** Entscheidung dokumentiert in `_user-input/navigator-berlin-logo.md` Sektion „Schrift für die Wortmarke" (Status → Decided)
   **And** Header verwendet finalen Schnitt + Tracking
   **And** Route `_dev/` per `+page.ts` `export const prerender = false` (nicht in Production-Sitemap, kommt aus Sitemap-Logik 2.1)

9. **AC-9 (A11y-Smoke):**
   **Given** AddressSearch + Header
   **When** Playwright + `@axe-core/playwright` gegen Landing + Header laufen
   **Then** 0 Violations (NFR-A1)
   **And** ARIA-Combobox-Pattern korrekt (Bits-UI-Default)
   **And** Skip-Link springt zu `<main>` trotz Header-Strip
   **And** Tab-Reihenfolge: SkipLink → Logo-Link → AddressSearch → Lang-Switcher-Slot → Main-Content.

## Tasks / Subtasks

- [ ] **Task 1: GeocodeSuggestion-Types + Schema** (Foundation)
  - [ ] 1.1 `src/lib/data/types.ts` ergänzen: `GeocodeSuggestion = { id; displayName; lat; lng; type; addresstype; bezirk?; kiez?; postcode?; bbox? }`
  - [ ] 1.2 `src/lib/server/geocode-schema.ts` mit Valibot-Schema für Nominatim-Response (siehe Dev-Note „Nominatim-Response-Schema")
  - [ ] 1.3 Re-Export in `src/lib/data/index.ts`

- [ ] **Task 2: Server-Geocoding-Modul** (AC: #2)
  - [ ] 2.1 `src/lib/server/geocode.ts`:
    - `proxyNominatim(q: string, lang?: Locale): Promise<GeocodeSuggestion[]>`
    - LRU-Cache `lru-cache` max 1000 Einträge, TTL 24h, Key `${q}|${lang}`
    - Rate-Limit-Singleton (siehe Dev-Note „Rate-Limit-Pattern")
    - Nominatim-URL aus `NOMINATIM_ENDPOINT` Env-Var (`$env/static/private`), Default `https://nominatim.openstreetmap.org`
    - Fetch mit AbortController 5s Timeout
    - Response-Validation via Valibot-Schema → Mapping zu `GeocodeSuggestion[]`
    - Berlin-Bbox-Post-Filter
    - Sort: `addresstype`-Whitelist-Priorität, dann Nominatim-Score
  - [ ] 2.2 `src/lib/server/rate-limit.ts`:
    - Token-Bucket-Class mit `take(): Promise<void>`
    - Default 1 req/s, Burst 2
    - Export Singleton `nominatimBucket`
  - [ ] 2.3 `.env.example` ergänzen:
    ```
    NOMINATIM_ENDPOINT=https://nominatim.openstreetmap.org
    ```

- [ ] **Task 3: GET /api/geocode Endpoint** (AC: #1)
  - [ ] 3.1 `src/routes/api/geocode/+server.ts`:
    - Valibot-Parse `q` aus URL-SearchParams
    - `lang` aus `Accept-Language`-Header parsen oder Default `de`
    - `proxyNominatim(q, lang)` aufrufen
    - Response `Response.json({ suggestions })`, Status 200
    - Error-Mapping: ValidationError → 400, Timeout/NetworkError → 502/504, RateLimit-Exhausted → 429
    - Cache-Header: `Cache-Control: private, max-age=300` (5min Client-Cache)
  - [ ] 3.2 KEIN Forward von `request.getClientAddress()` an Nominatim — verifiziert via Code-Review
  - [ ] 3.3 Smoke: `curl http://localhost:5173/api/geocode?q=Brandenburger` → 200 mit Suggestions-Liste

- [ ] **Task 4: Remote-Function** (AC: #3)
  - [ ] 4.1 `src/lib/data/geocode.remote.ts`:
    ```typescript
    import { query } from '$app/server';
    import * as v from 'valibot';
    import { proxyNominatim } from '$lib/server/geocode';

    export const geocodeAddress = query(
      v.object({ q: v.pipe(v.string(), v.minLength(2), v.maxLength(120)) }),
      async ({ q }) => await proxyNominatim(q)
    );
    ```
  - [ ] 4.2 Verify: `geocodeAddress` ist via `import { geocodeAddress } from '$lib/data/geocode.remote'` in Components verfügbar

- [ ] **Task 5: Debounce-Utility** (Helper)
  - [ ] 5.1 `src/lib/utils/debounce.ts`:
    ```typescript
    export function debounce<T extends (...args: never[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    }
    ```
  - [ ] 5.2 Unit-Test mit `vi.useFakeTimers()`

- [ ] **Task 6: AddressSearch-Komponente** (AC: #4, #5)
  - [ ] 6.1 `src/lib/components/atlas/address-search.svelte`:
    - Bits-UI `Combobox.Root` als Foundation
    - Internal-State: `$state` für `query`, `selectedSuggestion`
    - `$derived` für Suggestions via `geocodeAddress({ q })` (mit `await` + `<svelte:boundary>`)
    - Debounce 250ms zwischen Input und Remote-Call
    - LRU max 10 lokal (Map mit Insertion-Order)
    - Variant-Switching via Tailwind-Classes
    - Empty-State-Rendering bei `suggestions.length === 0` AND `query.length >= 2`
    - „Bezirks-Mittelpunkt wählen"-Link öffnet `<Dialog>` mit 12 Bezirken
  - [ ] 6.2 Lucide-Search-Icon nur in `variant="header"`: `import Search from '@lucide/svelte/icons/search'` (MUST-Rule #1 `@lucide/svelte`)
  - [ ] 6.3 i18n-Strings vorerst hardcoded DE, TODO-Annotation für Story 3.1-Migration
  - [ ] 6.4 File <500 Zeilen — bei Überschreitung splitten: `address-search.svelte` + `address-search-suggestion.svelte` + `address-search-empty.svelte`

- [ ] **Task 7: SiteHeader-Komponente** (AC: #7)
  - [ ] 7.1 `src/lib/components/atlas/site-header.svelte`:
    - Linke Section: `<a href="/" aria-label="navigator.berlin Startseite">` mit inline-SVG-Logo (klein, ~32px Höhe) + Wortmarke
    - Wortmarke: `<span class="font-{final}">navigator.berlin</span>` — Schriftklasse aus AC-8-Decision
    - Mitte/Rechts: `<AddressSearch variant="header" />`
    - Slot `langSwitcher` ganz rechts (Snippet-Prop)
    - Hairline-Bottom: `border-b border-rule`
    - Sticky `top-0 z-30 bg-bg/95 backdrop-blur-none` (keine Backdrop-Filter — Plex-Direktive)
  - [ ] 7.2 `+layout.svelte` ergänzen:
    - Header rendert NUR wenn Slot/Prop `showHeader` true (Landing setzt false)
    - `+layout.ts` exportiert default `showHeader: true`, Landing-`+page.ts` überschreibt false via Page-Data oder Layout-Prop
  - [ ] 7.3 Logo-Inline statt `<img>`: ermöglicht CSS-Hover-Effects (z.B. Punkt-Pulse bei Hover, falls gewünscht — Phase 2). Story 1.5 nutzt static SVG.

- [ ] **Task 8: Wortmarke-Test-Showcase + Decision** (AC: #8)
  - [ ] 8.1 `src/routes/_dev/wortmarke/+page.svelte`:
    - 6 Kandidaten-Renderings (A–F) gemäß Logo-Spec Sektion „Schrift für die Wortmarke"
    - Pro Kandidat: Header-Größe 24px + 28px, Favicon-Größe 16px
    - Vergleich nebeneinander, jeder mit echtem geladenem Plex (Story 1.2 stellt sicher dass Plex Light/ExtraLight als Variable-Font verfügbar)
  - [ ] 8.2 `src/routes/_dev/wortmarke/+page.ts`: `export const prerender = false`
  - [ ] 8.3 Browser-Inspection: Solo-Maintainer entscheidet
  - [ ] 8.4 Decision-Update in `_user-input/navigator-berlin-logo.md`:
    - Sektion „Schrift für die Wortmarke" → Status `Decided`
    - Final-Kandidat eingetragen mit Weight + Tracking
  - [ ] 8.5 `site-header.svelte` Wortmarken-Klasse auf finalen Kandidat setzen
  - [ ] 8.6 Optional: `_dev/wortmarke/` nach Decision in `archive/` verschieben oder behalten als Reference (Empfehlung: behalten + `+page.ts` prerender = false bleibt)

- [ ] **Task 9: Tests + A11y** (AC: #9, NFR-A1)
  - [ ] 9.1 Unit-Test `src/lib/server/geocode.test.ts`:
    - Cache-Hit/Miss
    - Rate-Limit-Backoff
    - Berlin-Bbox-Filter (Punkt in/out)
    - Nominatim-Mock via `vi.spyOn(global, 'fetch')`
  - [ ] 9.2 Unit-Test `src/lib/utils/debounce.test.ts`
  - [ ] 9.3 Component-Test `src/lib/components/atlas/address-search.test.ts` mit Vitest-Browser (oder Vitest + JSDOM):
    - Render hero/header-Variants
    - Input → Debounced Geocode-Call
    - Pfeil/Enter-Navigation
  - [ ] 9.4 Playwright E2E `tests/e2e/address-search.spec.ts`:
    - Hero-AddressSearch auf Landing
    - Tippe „Brandenburger" → ≥1 Suggestion sichtbar
    - Enter → URL ändert sich (`?address=...&bbox=...`)
    - `@axe-core/playwright` gegen Landing → 0 Violations
  - [ ] 9.5 Commit: `feat(address-search): nominatim proxy + bits-ui combobox + site-header (story 1.5)`

## Dev Notes

### Nominatim-Response-Schema (`src/lib/server/geocode-schema.ts`)

Nominatim API Response (für `format=jsonv2`):

```typescript
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: 'node' | 'way' | 'relation';
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  display_name: string;
  name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox: [string, string, string, string];  // [S, N, W, E] as strings
}
```

**Mapping NominatimResult → GeocodeSuggestion:**

```typescript
function mapToSuggestion(r: NominatimResult): GeocodeSuggestion {
  return {
    id: `${r.osm_type}-${r.osm_id}`,
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    type: r.type,
    addresstype: r.addresstype,
    bezirk: r.address.city_district,
    kiez: r.address.suburb,
    postcode: r.address.postcode,
    bbox: [parseFloat(r.boundingbox[2]), parseFloat(r.boundingbox[0]), parseFloat(r.boundingbox[3]), parseFloat(r.boundingbox[1])]  // → [W,S,E,N]
  };
}
```

### Rate-Limit-Pattern (`src/lib/server/rate-limit.ts`)

Token-Bucket Singleton:

```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(private capacity: number, private refillRatePerSec: number) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  async take(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil((1 - this.tokens) * 1000 / this.refillRatePerSec);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRatePerSec);
    this.lastRefill = now;
  }
}

export const nominatimBucket = new TokenBucket(2, 1);  // Burst 2, Refill 1/s
```

**Hinweis:** Single-Process-Solo-Maintainer-Setup OK. Bei Phase-2-Multi-Container: Redis-basiertes Rate-Limit oder pro-Container-Bucket (Trade-off Konsistenz vs. Komplexität).

### Berlin-Bbox-Konstante

```typescript
// src/lib/server/geocode.ts
const BERLIN_BBOX = {
  west: 13.0883,
  south: 52.3382,
  east: 13.7611,
  north: 52.6755
};

function isInBerlin(lat: number, lng: number): boolean {
  return lng >= BERLIN_BBOX.west && lng <= BERLIN_BBOX.east
      && lat >= BERLIN_BBOX.south && lat <= BERLIN_BBOX.north;
}
```

**Identisch zu Berlin-Bbox aus Story 1.4** (`get-layers-at-point.ts`) — DRY-Verletzung. Optional: Konstante in `$lib/data/constants.ts` zentralisieren. Falls in 1.5 nicht extrahiert, Story 1.6 (Karten) tut es zwingend.

### Header-Komponente — Landing-Exception

Landing-Page (`/`) zeigt Hero-AddressSearch ohne Header. Andere Pages (Adress-Sicht, Bezirks-Page, Lizenzen) zeigen Header.

**Pattern für Layout-Branching:**

```typescript
// src/routes/+layout.ts
export const load = async ({ url }) => {
  const showHeader = url.pathname !== '/' && url.pathname !== `/${lang}/`;
  return { showHeader };
};
```

ODER: Landing nutzt eigenes Layout `src/routes/(landing)/+layout.svelte` (SvelteKit Group-Layout-Pattern):

```
src/routes/
  +layout.svelte         # Root: SkipLink + main + Footer (kein Header)
  (with-header)/
    +layout.svelte       # Mit Header zwischen SkipLink und main
    bezirk/...
    kiez/...
  +page.svelte           # Landing (Root-Layout, kein Header)
```

**Empfehlung Story 1.5:** Group-Layout-Pattern, sauberer als Prop-Branching. Falls Group-Layout komplex wird: Prop-Branching als Fallback OK.

### Wortmarke-Schriftwahl — Test-Showcase

**Test-Kandidaten aus Logo-Spec:**

| ID | Schnitt | Tracking | Beschreibung |
|---|---|---|---|
| A | Plex Sans Light (300) | 0 | Standard-Slim |
| B | Plex Sans ExtraLight (200) | 0 | Schlanker |
| C | Plex Sans Light (300) | 0.02em | Slim + minimal offen |
| D | Plex Sans ExtraLight (200) | 0.04em | Editorial-Tracking |
| E | Plex Serif Light (300) | 0 | Serif-Slim |
| F | Plex Sans Thin (100) | 0 | Sehr filigran (Risiko-Kontrast) |

**Voraussetzungen:**
- Plex Variable Sans MUSS Weight 100–700 abdecken (Story 1.2 verwendet Variable-Font → erfüllt)
- Plex Variable Serif MUSS Weight 100–700 abdecken (Story 1.2 verwendet Variable-Font → erfüllt)
- `<link rel="preload">` (Story 1.2) lädt Latin-Subset vor Showcase-Render

**Showcase-Snippet (`src/routes/_dev/wortmarke/+page.svelte`):**

```svelte
<script lang="ts">
  const candidates = [
    { id: 'A', family: 'sans', weight: 300, tracking: '0' },
    { id: 'B', family: 'sans', weight: 200, tracking: '0' },
    { id: 'C', family: 'sans', weight: 300, tracking: '0.02em' },
    { id: 'D', family: 'sans', weight: 200, tracking: '0.04em' },
    { id: 'E', family: 'serif', weight: 300, tracking: '0' },
    { id: 'F', family: 'sans', weight: 100, tracking: '0' }
  ];
  const sizes = [16, 24, 28];
</script>

{#each candidates as c (c.id)}
  <section class="my-8">
    <h2 class="text-sm text-ink-muted">Kandidat {c.id}: Plex {c.family} {c.weight} / tracking {c.tracking}</h2>
    {#each sizes as size}
      <p style="font-family: var(--font-{c.family}); font-weight: {c.weight}; letter-spacing: {c.tracking}; font-size: {size}px;">
        navigator.berlin
      </p>
    {/each}
  </section>
{/each}
```

**Decision-Default:** Falls Solo-Maintainer auch nach Showcase unschlüssig → Empfehlung Kandidat C (Plex Sans Light 300, tracking 0.02em) als pragmatischer Mittelweg zwischen Eleganz und Lesbarkeit.

### `_dev/`-Routes-Konvention

`src/routes/_dev/` — Präfix-Underscore signalisiert „Dev-Only". `+page.ts` mit `export const prerender = false` verhindert Sitemap-Aufnahme. In Story 2.1 (Sitemap-Builder) explizit ausschließen via Path-Filter `!/^\/_dev\//`.

**Alternative:** Behind-the-Scenes Dev-Routes per `import.meta.env.DEV` Filter — komplexer, nicht nötig für Story 1.5.

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — AddressSearch split-fähig (Empty-State, Suggestion-Row als Sub-Components)
- #7 TypeScript strict — Valibot-Schemas, kein `any`
- #10 Cookieless — `Accept-Language`-Header für Sprach-Erkennung, kein Cookie
- #11 Kein US-Drittanbieter — Nominatim openstreetmap.org (EU). Allowlist-Eintrag in Story 4.3 ergänzen: `nominatim.openstreetmap.org`
- #13 A11y-First — Bits-UI-Combobox handelt ARIA-Pattern, axe-Gate in Task 9
- #14 i18n-First — TODO-Annotation für Strings (Migration Story 3.1)
- #19 Remote Functions — `geocode.remote.ts` statt Component-direktem `fetch()`
- #20 `await`-Expression + `<svelte:boundary>` — Suggestions-Lade-State

### Library/Framework Requirements

**Bereits installiert (Story 1.1):**
- `bits-ui` — Combobox.Root
- `valibot` — Schema-Validation
- `lru-cache` — Cache
- `@lucide/svelte` — Search-Icon

**Neu in Story 1.5:** Keine. Alle Deps aus 1.1.

**Env-Vars neu:**
- `NOMINATIM_ENDPOINT` (Default `https://nominatim.openstreetmap.org`) in `$env/static/private`

### Testing Requirements

**Unit-Tests:**
- `src/lib/server/geocode.test.ts` — proxyNominatim, LRU, Rate-Limit, Bbox-Filter
- `src/lib/server/rate-limit.test.ts` — TokenBucket
- `src/lib/utils/debounce.test.ts`

**Component-Tests:**
- `src/lib/components/atlas/address-search.test.ts` — Render-Variants, Debounce-Behavior, Tastatur

**E2E-Tests:**
- `tests/e2e/address-search.spec.ts` — End-to-End Geocoding-Flow
- `tests/e2e/accessibility.spec.ts` — axe-Gate gegen Landing (ergänzt um AddressSearch)

**Mock-Strategie:**
- Nominatim-Response-Fixtures in `src/lib/server/__fixtures__/nominatim-{query}.json`
- `vi.spyOn(global, 'fetch')` für Server-Tests
- E2E nutzt echten Nominatim (CI-Cost gering, Public-API, kein Rate-Hammering) ODER MSW-Setup falls Flaky

### File-Structure-Requirements (Diff zu Story 1.4)

**Neu in Story 1.5:**
```
./
├── src/
│   ├── lib/
│   │   ├── server/                              # Bisher leer
│   │   │   ├── geocode.ts
│   │   │   ├── geocode-schema.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── geocode.test.ts
│   │   │   ├── rate-limit.test.ts
│   │   │   └── __fixtures__/
│   │   │       └── nominatim-brandenburger.json
│   │   ├── data/
│   │   │   └── geocode.remote.ts                # SvelteKit Remote-Function
│   │   ├── components/
│   │   │   └── atlas/
│   │   │       ├── address-search.svelte
│   │   │       ├── address-search-suggestion.svelte   (falls split)
│   │   │       ├── address-search-empty.svelte       (falls split)
│   │   │       ├── address-search.test.ts
│   │   │       └── site-header.svelte
│   │   └── utils/
│   │       ├── debounce.ts
│   │       └── debounce.test.ts
│   └── routes/
│       ├── (with-header)/                       # Group-Layout (siehe Dev-Note)
│       │   └── +layout.svelte                   # Header-Slot
│       ├── _dev/
│       │   └── wortmarke/
│       │       ├── +page.svelte
│       │       └── +page.ts                     # prerender = false
│       └── api/
│           └── geocode/
│               └── +server.ts
├── tests/
│   └── e2e/
│       └── address-search.spec.ts
└── .env.example                                 # NOMINATIM_ENDPOINT ergänzen
```

### Previous Story Intelligence

- **Story 1.4:** `LayerHit`, `KiezProfile`, `BezirkProfile` verfügbar — AddressSearch kann nach Selection `getLayersAtPoint(lat, lng)` ODER `getBezirkProfile(slug)` aufrufen (Konsumenten-Code, kommt teilweise erst in 1.7)
- **Story 1.2:** `<MetaFooter>` + `<SkipLink>` im `+layout.svelte` — Header rangiert dazwischen, NACH SkipLink
- **Story 1.2:** Logo-Mark als `static/logo-mark.svg` verfügbar
- **Story 1.3:** Berlin-Bbox-Konstante existiert in `scripts/lib/` — Runtime-Duplicate-Strategie siehe Dev-Note „Berlin-Bbox-Konstante"
- **Story 1.1:** `valibot`, `bits-ui`, `lru-cache`, `@lucide/svelte` Runtime-Deps verfügbar

### Git Intelligence

- `_dev/wortmarke/`-Route bleibt im Repo committed — Reference für künftige Schrift-Diskussionen
- `_user-input/navigator-berlin-logo.md` ist gitignored (siehe Story 1.1) ABER für Decision-Update in `_user-input/` editierbar. Falls Logo-Spec versioniert sein soll: nach `docs/design/logo.md` verschieben

### Latest Tech Information (Mai 2026)

- **Nominatim Public-Instance (Mai 2026):** Stable, 1 req/s Public-Limit, `User-Agent` Pflicht. Bei Production-Traffic >1.000 req/Tag → Self-Host als Phase-2-Migration
- **SvelteKit `query()` Remote-Functions (v2.x):** Stable, automatisches Cache-pro-Argument-Set + Cleanup bei Unmount
- **Bits-UI v2 `Combobox.Root`:** Snippet-API, `bind:value` und `bind:open` als Bindings. Doku via `mcp__svelte__get-documentation` Query „bits-ui combobox" bei Detail-Fragen
- **`Accept-Language`-Parsing:** SvelteKit-`request.headers.get('accept-language')` + `accept-language-parser` (optional) oder manueller Parse (Quality-Werte ignorieren OK für Default-Locale-Lookup)

### Project Structure Notes

- **Group-Layout `(with-header)`:** SvelteKit-Konvention für Layout-Branching ohne URL-Änderung. Klammern werden vom Router ignoriert
- **`_dev/`-Routes:** Eigene Konvention, NICHT SvelteKit-Special. Underscore-Präfix-Routes prerender und routet normal — Filterung nur in Sitemap-Builder (Story 2.1)
- **AddressSearch in Hero (Landing):** Story 1.5 implementiert Hero-Variant inline auf `src/routes/+page.svelte` ODER als separates `<HeroAddressSearch>`. Empfehlung: AddressSearch nimmt `variant`-Prop, beide Surfaces nutzen gleiche Komponente

### Open Questions (für End-of-Story)

1. **`Accept-Language`-Parsing:** Story 1.5 nutzt naive First-Match. Vollwertige Quality-Werte-Logik kommt mit Story 3.1 (Paraglide-Setup) — derzeit reicht „de" / „en" / Fallback
2. **Group-Layout vs. Prop-Branching für Header-Conditional:** Empfehlung Group-Layout (sauberer), aber falls SvelteKit-Layout-Hierarchie für Lang-Routes (`[lang=lang]/(with-header)/...`) zu kompliziert wird, Prop-Branching reverten
3. **Bezirks-Mittelpunkt-Fallback:** Liste 12 Bezirke hardcoded ODER aus Manifest. Empfehlung: aus Manifest (`getLayersByBundle('A: Boundaries').find(l => l.slug === 'bezirke')`) — Single-Source-of-Truth
4. **AddressSearch-Submit-Verhalten:** Bei Submit-Selection: URL-Update via `goto(...)` mit `?address=...&bbox=...&zoom=...` (siehe FR11d). Story 1.5 setzt nur `onSelect`-Callback — URL-Sync kommt in Story 1.7 (Karten-Interaktion + URL-State-Sync)
5. **i18n-Strings:** Hardcoded DE in 1.5, Story 3.1 migriert. Welche Strings? `address.search.placeholder`, `address.search.empty.notFound`, `address.search.empty.outsideBerlin`, `address.search.empty.bezirkFallbackLink` — Liste in `i18n-todo.md` sammeln (in Repo-Root)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: Adress-Suche mit Geocoding-Proxy] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] (Geocoding-Endpoint, Rate-Limit, IP-Anonymisierung)
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] (`NOMINATIM_ENDPOINT` Env-Var)
- [Source: _bmad-output/planning-artifacts/architecture.md#SvelteKit Remote Functions] (`query()`-Pattern, Geocoding-Beispiel)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR14 AddressSearch-Varianten, UX-DR35 Empty-State)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR1–FR6, NFR-PR2, NFR-I6)
- [Source: _user-input/navigator-berlin-logo.md#Schrift für die Wortmarke] (6 Plex-Test-Kandidaten)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (Token-Foundation, Logo-Assets, Bits-UI-Wrappers)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (KiezProfile/BezirkProfile-Konsum, Centroid für Fallback)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Confirmed Decisions

1. **Geocoding-Backend:** Nominatim Public-Instance Phase 1, Env-Var-konfiguriert. Self-Host als Phase-2-Migration falls Reliability-Issue
2. **Rate-Limit-Pattern:** Single-Process Token-Bucket, Burst 2 / Refill 1/s. Multi-Container später
3. **IP-Anonymisierung:** Hard-Boundary — `request.getClientAddress()` NIE an Nominatim. Verifiziert via Code-Review-Checkbox (Task 3.2)
4. **AddressSearch-Variants:** `hero` (Landing) + `header` (mit Search-Icon, kompakt). Beide nutzen gleiche Komponente
5. **Header-Branching:** Group-Layout `(with-header)/`. Landing zeigt Hero-AddressSearch ohne Header
6. **Wortmarke-Decision:** in Story 1.5 final entschieden via `_dev/wortmarke/`-Showcase. Default-Empfehlung Kandidat C (Plex Sans Light 300, tracking 0.02em) falls Solo-Maintainer unschlüssig
7. **`_dev/`-Routes:** committed im Repo, prerender=false, Sitemap-Filter in Story 2.1
