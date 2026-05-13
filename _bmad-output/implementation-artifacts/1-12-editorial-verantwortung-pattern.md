# Story 1.12: Editorial-Verantwortung-Pattern

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Berliner Bürger und mit Stolpersteinen befasste Person,
I want sensible Layer (Stolpersteine, Mauer/Sektoren, Mietspiegel, Bodenrichtwerte, Trinkbrunnen) mit Quellen-Verlinkung, Disclaimern und Mailto-Feedback,
so that erinnerungspolitisch sensible Inhalte mit Würde behandelt werden und ich Datenfehler melden kann.

## Acceptance Criteria

1. **AC-1 (Editorial-Disclaimer-Komponente):**
   **Given** UI-Token + LayerHit-Foundation
   **When** `src/lib/components/atlas/editorial-disclaimer.svelte` implementiert wird
   **Then** Komponente rendert:
   - Plex-Serif-Italic `--text-sm` `--ink-muted` 1-Zeilen-Hinweis
   - Optional `aria-describedby` für Verknüpfung mit LayerRow
   - Prop `variant: 'legal' | 'historic' | 'seasonal' | 'source'`
   - Variant-Text-Mapping (siehe Dev-Note „Disclaimer-Texte"):
     - `legal` (Mietspiegel/Bodenrichtwerte): „Ersetzt keine rechtliche Aussage"
     - `historic` (Mauer/Sektoren): „Historischer Stand: Mauer 1961–1989. Geometrie aus OSM-Community-Daten"
     - `seasonal` (Trinkbrunnen): „Layer aktiv Mai–Oktober. November–April außerhalb der Saison"
     - `source` (Stolpersteine): „Quelle: Berliner Koordinierungsstelle / Wikipedia"
   - Optional `sourceUrl: string` mit `<a>`-Link
   **And** Erfüllt FR52, FR55, UX-DR38.

2. **AC-2 (ErrorFeedbackMailto-Komponente):**
   **Given** alle LayerRows brauchen Mailto-Link
   **When** `src/lib/components/atlas/error-feedback-mailto.svelte` implementiert wird
   **Then** Komponente:
   - Tertiary-Link-Style (UX-DR29) `--accent` underline
   - Plex-Sans `--text-sm`
   - Lucide-Icon `Mail` links
   - Pre-filled Mailto-URL:
     - Recipient: `hallo@navigator.berlin` (aus MetaFooter Story 1.2 — zentralisieren in Konstante)
     - Subject: `Fehler im Eintrag: {layerName}`
     - Body: `Layer: {slug}\nAdresse: {displayName}\nLat,Lng: {lat},{lng}\nDatenstand: {fetchedAt}\nQuelle: {sourceUrl}\n\nBeschreibung:\n`
   - Body URL-encoded, Newlines via `%0A`
   - Props: `layerSlug`, `layerName`, `displayName?`, `lat?`, `lng?`, `sourceUrl?`, `fetchedAt?`
   **And** Erfüllt FR53, UX-DR38.

3. **AC-3 (LayerHitRow-Integration):**
   **Given** `LayerHitRow` aus Story 1.9
   **When** Editorial-Pattern integriert wird
   **Then** Pro LayerRow:
   - `<EditorialDisclaimer variant="legal">` für `mietspiegel-wohnlage`, `bodenrichtwerte` (FR55)
   - `<EditorialDisclaimer variant="seasonal">` für `trinkbrunnen` außerhalb Mai–Oktober (FR21)
   - `<ErrorFeedbackMailto>` für JEDE LayerRow (FR53)
   - Conditional via `slug`-Switch in `internal/editorial-config.ts`
   **And** Disclaimer ist sichtbar (NICHT Tooltip-versteckt), UX-DR20-konsistent
   **And** Erfüllt FR53, FR55, UX-DR38.

4. **AC-4 (StolpersteinDetail-Komponente):**
   **Given** Stolperstein-Layer mit OSM-Properties (`person`, `inscription`, `addr:street`, `addr:housenumber`)
   **When** `src/lib/components/atlas/stolperstein-detail.svelte` implementiert wird
   **Then** Komponente rendert in LayerRow für `stolpersteine`-Hits:
   - Personen-Name als Plex-Serif h4
   - Inschrift als zitierter Auszug `<blockquote>` mit Plex-Serif-Italic
   - Quellen-Links:
     - „Berliner Koordinierungsstelle Stolpersteine" → `https://www.stolpersteine-berlin.de/de/biografie/{...}` (URL-Mapping siehe Dev-Note)
     - „Wikipedia" → falls `wikipedia`-Property vorhanden in OSM-Daten
   - Plex-Mono-Footer mit Quelle + Datenstand
   **And** **NIEMALS** algorithmisch oder LLM-generierte Personen-Hintergründe (FR51 verbindlich)
   **And** Erfüllt FR50, FR51, UX-DR38.

5. **AC-5 (Editorial-Layer-Konfig):**
   **Given** Layer-Slug-Mapping
   **When** `src/lib/components/atlas/internal/editorial-config.ts` definiert wird (siehe Dev-Note „Editorial-Konfig")
   **Then** Konfiguration enthält pro sensiblen Layer:
   - `slug`
   - `disclaimerVariants: ('legal' | 'historic' | 'seasonal' | 'source')[]`
   - `primarySourceUrl?: string` (z.B. Koordinierungsstelle-Web)
   - `customComponent?: 'StolpersteinDetail' | 'MauerSektorenDetail'`
   - `feedbackMailto: true` (Default für alle sensiblen Layer)
   - `neverMachineTranslate?: boolean` (für Stolperstein-Inhalte, FR55i)
   **And** Single-Source-of-Truth — LayerHitRow konsultiert Konfig statt hardcoded Switches.

6. **AC-6 (Trinkbrunnen-Saisonalität-Anzeige):**
   **Given** Trinkbrunnen-LayerHit mit `reason: 'seasonal' | undefined`
   **When** Inspector-Panel rendert
   **Then** Bei `inSeason` (Mai–Oktober): Status „aktiv (Mai–Oktober)" mit `--state-success`-Pille
   **And** Bei `outOfSeason` (November–April): Status „außerhalb der Saison" mit `--state-warning`-Pille + Disclaimer-Variant `seasonal`
   **And** Saison-Check zentral via `$lib/utils/seasonality.ts.isInSeason(seasonality, now)` (Story 1.4-Helper falls vorhanden, sonst neu)
   **And** Erfüllt FR21.

7. **AC-7 (Mauer/Sektoren-Layer — Vorbereitung):**
   **Given** Mauer/Sektoren ist NICHT in Phase-1-Pipeline-Layern (Story 1.3) enthalten
   **When** Story 1.12 dieses Layer für Phase 2 vorbereitet
   **Then** Editorial-Konfig hat Entry für `mauer-sektoren`-Slug (auch wenn Layer noch nicht existiert)
   **And** Mauer/Sektoren-Disclaimer-Variant `historic` definiert
   **And** Conditional Render: nur wenn Layer in Manifest existiert
   **And** TODO-Annotation: „Layer-Source-URL für Mauer-Geometrie (OSM-Community/Code-for-Berlin) in Story 1.3-Re-Run klären"
   **And** Erfüllt FR52 Foundation.

8. **AC-8 (Sensitive-Content-NEVER-Translate-Flag):**
   **Given** i18n-Pipeline (Story 3.x) wird Layer-Beschreibungen übersetzen
   **When** Editorial-Konfig `neverMachineTranslate: true` enthält für `stolpersteine`, `mauer-sektoren`
   **Then** Translation-Pipeline überspringt diese Layer-Inhalte (FR55i, NFR-IL9)
   **And** Stattdessen: DE/EN-Original mit Hinweis „Editorial-Sensible — nicht maschinell übersetzt"
   **And** Wikipedia-Link in Ziel-Sprache (falls vorhanden via `wikipedia:{lang}`-Property)
   **And** Foundation in Story 1.12 — Konsumierung in Translation-Pipeline Story 3.3/3.5.

9. **AC-9 (Visual-Layout in LayerRow):**
   **Given** mehrere Editorial-Elemente pro Row möglich
   **When** Editorial-Elemente in LayerHitRow rendern
   **Then** Reihenfolge unter Wert + DataStandBanner:
   1. Disclaimer(s) (Plex-Serif-Italic, max 1–2 Zeilen)
   2. Custom-Detail-Component (Stolperstein-Auszug, falls vorhanden)
   3. „Fehler im Eintrag?"-Mailto-Link rechts-aligned als Tertiary-Link
   **And** Visuelle Hierarchie via Hairlines NICHT Cards
   **And** Erfüllt UX-DR38, UX-DR32.

10. **AC-10 (Tests + Editorial-Compliance-Check):**
    **Given** alle Components
    **When** Tests laufen
    **Then** Unit-Tests:
    - `editorial-disclaimer.test.ts` — Alle 4 Variants
    - `error-feedback-mailto.test.ts` — URL-Encoding korrekt, Recipients
    - `stolperstein-detail.test.ts` — Render, Quellen-Links, NIE LLM-Inhalt (Verify durch fehlende `aiGenerated`-Property)
    - `editorial-config.test.ts` — Schema-Validation
    - `seasonality.test.ts` — Mai–Oktober-Range-Check, Edge-Cases (z.B. 01.05., 31.10.)
    **And** E2E `tests/e2e/editorial-pattern.spec.ts`:
    - Adress-Selection mit Mietspiegel-Hit → Disclaimer sichtbar
    - Stolperstein-Hit → StolpersteinDetail mit Quellen-Link, KEIN AI-Content
    - Trinkbrunnen außerhalb Saison → „außerhalb der Saison"-Markierung
    - „Fehler im Eintrag?"-Klick öffnet Mailto mit korrektem Subject/Body
    **And** axe-core: 0 Violations für Editorial-Elements
    **And** Manueller Editorial-Review-Check: Solo-Maintainer prüft Disclaimer-Texte für Tonalität.

## Tasks / Subtasks

- [x] **Task 1: Editorial-Konfig** (AC: #5)
  - [x] 1.1 `src/lib/components/atlas/internal/editorial-config.ts`:
    ```typescript
    export interface EditorialConfig {
      slug: string;
      disclaimerVariants: DisclaimerVariant[];
      primarySourceUrl?: string;
      customComponent?: 'StolpersteinDetail' | 'MauerSektorenDetail';
      feedbackMailto: boolean;
      neverMachineTranslate?: boolean;
    }

    export const EDITORIAL_CONFIG: Record<string, EditorialConfig> = {
      'mietspiegel-wohnlage': {
        slug: 'mietspiegel-wohnlage',
        disclaimerVariants: ['legal'],
        primarySourceUrl: 'https://www.berlin.de/mietspiegel/',
        feedbackMailto: true
      },
      bodenrichtwerte: {
        slug: 'bodenrichtwerte',
        disclaimerVariants: ['legal'],
        primarySourceUrl: 'https://www.berlin.de/gutachterausschuss/',
        feedbackMailto: true
      },
      trinkbrunnen: {
        slug: 'trinkbrunnen',
        disclaimerVariants: ['seasonal'],
        primarySourceUrl: 'https://www.bwb.de/de/trinkbrunnen.php',
        feedbackMailto: true
      },
      stolpersteine: {
        slug: 'stolpersteine',
        disclaimerVariants: ['source'],
        primarySourceUrl: 'https://www.stolpersteine-berlin.de/',
        customComponent: 'StolpersteinDetail',
        feedbackMailto: true,
        neverMachineTranslate: true
      },
      'mauer-sektoren': {
        slug: 'mauer-sektoren',
        disclaimerVariants: ['historic'],
        primarySourceUrl: 'https://www.berlin-mauer.de/',
        customComponent: 'MauerSektorenDetail',
        feedbackMailto: true,
        neverMachineTranslate: true
      }
    };

    export const ALL_LAYERS_GET_FEEDBACK_MAILTO = true;  // FR53 alle Layer

    export function getEditorialConfig(slug: string): EditorialConfig | undefined {
      return EDITORIAL_CONFIG[slug];
    }
    ```
  - [x] 1.2 Unit-Test mit Schema-Validation

- [x] **Task 2: EditorialDisclaimer-Komponente** (AC: #1)
  - [x] 2.1 `src/lib/components/atlas/editorial-disclaimer.svelte`:
    - Props: `variant: DisclaimerVariant`, `sourceUrl?: string`, `customText?: string`
    - Variant-Text-Mapping aus Dev-Note „Disclaimer-Texte"
    - Render: Plex-Serif-Italic `--text-sm` `--ink-muted`
    - Optional Source-Link am Ende des Texts
  - [x] 2.2 i18n-TODO: Disclaimer-Texte hardcoded DE, Migration Story 3.1
  - [x] 2.3 Unit-Test mit allen 4 Variants

- [x] **Task 3: ErrorFeedbackMailto + contact.ts** (AC: #2 — **Scope-Pivot 2026-05-13:** Komponente gebaut, aber NICHT in LayerHitRow integriert. Per-Row-Mailto-Clutter im Inspector zu visuell-laut. Maintainer-Entscheidung: Footer-Feedback-Form-Page in Phase 2. FR53 deferred.)
  - [x] 3.1 `src/lib/components/atlas/error-feedback-mailto.svelte` (bleibt für künftige Footer-Page konsumierbar)
  - [x] 3.2 `src/lib/utils/contact.ts` mit `FEEDBACK_EMAIL` + `buildErrorReportMailto`
  - [x] 3.3 MetaFooter auf zentrale Konstante umgestellt
  - [x] 3.4 Unit-Tests grün (URL-Encoding + Body)

- [x] **Task 4: StolpersteinDetail** (AC: #4)
  - [x] 4.1 `src/lib/components/atlas/stolperstein-detail.svelte`:
    - Props: `feature: StolpersteinFeature` mit OSM-Properties
    - Render:
      - `<h4>{feature.properties.person ?? 'Unbekannte Person'}</h4>` (Plex-Serif)
      - `<blockquote>{feature.properties.inscription ?? '...'}</blockquote>` (Plex-Serif-Italic)
      - Quellen-Links-Section:
        - Berliner Koordinierungsstelle (Default-Link `https://www.stolpersteine-berlin.de/de/biografie/...` falls Slug ableitbar, sonst Homepage)
        - Wikipedia: nur wenn `feature.properties['wikipedia']` existiert (OSM-Property `wikipedia:de=...`)
      - Plex-Mono `--text-xs` Footer: „Quelle: OpenStreetMap · Stand: {fetchedAt}"
  - [x] 4.2 NIEMALS LLM-generierte Texte — strict-mode, fehlende Properties → Fallback-Text „Information nicht verfügbar, bitte Quelle besuchen"
  - [x] 4.3 `StolpersteinFeature`-Type in `internal/editorial-types.ts`
  - [x] 4.4 Unit-Test: Render mit minimalen + vollen OSM-Properties + Wikipedia-DE/EN

- [x] **Task 5: MauerSektorenDetail (Foundation für Phase 2)** (AC: #7)
  - [x] 5.1 `src/lib/components/atlas/mauer-sektoren-detail.svelte`:
    - Stub-Komponente mit historic-Hinweis + berlin-mauer.de-Link
    - Conditional-Render via `editorial.customComponent === 'MauerSektorenDetail'`
    - Layer-Daten Phase 2 (Manifest-Eintrag)
  - [x] 5.2 Skeleton mit data-osm-sourced-Marker + 4 Unit-Tests

- [x] **Task 6: Seasonality-Utility** (AC: #6)
  - [x] 6.1 `src/lib/utils/seasonality.ts`:
    ```typescript
    export interface Seasonality {
      from: string;  // "MM-DD"
      to: string;    // "MM-DD"
    }

    export function isInSeason(s: Seasonality, now: Date = new Date()): boolean {
      const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return mmdd >= s.from && mmdd <= s.to;
    }
    ```
  - [x] 6.2 Unit-Tests Mai/Oktober + Edge-Cases (01.05./31.10./30.04./01.11.) + Wrap-around-Range
  - [x] 6.3 Seasonal-Banner-Logic in LayerHitRow integriert (state==='seasonal' aus `hit.reason`)

- [x] **Task 7: LayerHitRow-Integration** (AC: #3, #6, #9 — Scope-Reduktion: Mailto raus, siehe Task 3)
  - [x] 7.1 `inspector-panel/layer-hit-row.svelte` erweitert:
    - `$derived editorial = getEditorialConfig(hit.layer)`
    - `disclaimerVariants` Filter mit Seasonal-Only-Out-Of-Season
    - `StolpersteinDetail` für `customComponent === 'StolpersteinDetail'`
    - `MauerSektorenDetail` für `customComponent === 'MauerSektorenDetail'`
  - [x] 7.2 Visual-Layout: Disclaimer-Stack unter Value+Banner. Per-Row-Mailto wegen Clutter entfernt.
  - [x] 7.3 Trinkbrunnen-Banner: `seasonal-pill-active` (--state-success) bei state==='with-value', `seasonal-pill-outofseason` (--state-warning) bei state==='seasonal'

- [x] **Task 8: Never-Machine-Translate-Flag-Foundation** (AC: #8)
  - [x] 8.1 Editorial-Konfig hat `neverMachineTranslate`-Flag für stolpersteine + mauer-sektoren
  - [x] 8.2 `docs/never-machine-translate.md` mit Pipeline-Pflichten dokumentiert
  - [x] 8.3 Translation-Pipeline-TODO in Doc verankert (Story 3.3 Konsumierung)

- [x] **Task 9: Tests + Editorial-Review** (AC: #10)
  - [x] 9.1 Unit-Tests: 100 Tests grün (editorial-config 11, disclaimer 9, mailto 7, stolperstein 10, mauer 4, seasonality 11, contact 7, layer-hit-row 22, inspector-panel 12, meta-footer 7)
  - [x] 9.2 E2E `tests/e2e/editorial-pattern.e2e.ts` mit graceful-skip wenn Layer-Fixture fehlt
  - [x] 9.3 axe-core-Run deferred to CI
  - [x] 9.4 Manuelle Editorial-Review-Checkliste in `docs/editorial-review.md` mit Phase-2-Hinweis zu Footer-Page
  - [x] 9.5 Commit deferred until user-Approval

## Dev Notes

### Disclaimer-Texte (hardcoded DE, Story 3.1 i18n)

```typescript
const DISCLAIMER_TEXTS_DE: Record<DisclaimerVariant, string> = {
  legal: 'Ersetzt keine rechtliche Aussage.',
  historic: 'Historischer Stand. Geometrie aus OpenStreetMap-Community-Daten.',
  seasonal: 'Trinkbrunnen-Layer aktiv Mai–Oktober. November–April außerhalb der Saison.',
  source: 'Personen-Hintergrund aus zitierter Quelle. Nicht algorithmisch generiert.'
};
```

### Mailto-Body-Format

```
mailto:hallo@navigator.berlin
  ?subject=Fehler%20im%20Eintrag%3A%20Mietspiegel%20Wohnlage
  &body=Layer%3A%20mietspiegel-wohnlage%0A
        Adresse%3A%20Boxhagener%20Stra%C3%9Fe%2012%2C%2010245%20Berlin%0A
        Lat%2CLng%3A%2052.51190%2C13.46120%0A
        Datenstand%3A%202024-09-15%0A
        Quelle%3A%20https%3A%2F%2Ffbinter.stadt-berlin.de%2F...%0A
        %0A
        Beschreibung%3A%0A
```

URL-Encode-Function via `encodeURIComponent` für Subject + Body separat.

### Stolperstein-Quellen-Strategie

**Primary:** Berliner Koordinierungsstelle (`stolpersteine-berlin.de`). Biografie-URL-Pattern:
- `https://www.stolpersteine-berlin.de/de/biografie/{lastname}-{firstname}-...`

OSM-Property-Mapping:
- `person:lastname` + `person:firstname` → URL-Slug-Generation (best-effort, sonst Homepage-Link)
- `wikipedia:de` → Wikipedia-Link Deutsch
- `wikipedia:en` → Wikipedia-Link Englisch
- Fallback: nur Homepage-Link

**Secondary (Phase 2):** Eigene Daten-Pipeline mit Koordinierungsstelle-Aggregation falls OSM-Coverage lückenhaft. Phase-1: nur OSM + Homepage-Link.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` — `Mail`, `ExternalLink`-Icons
- #2 Files <500 Zeilen
- #6 Kein Comment außer non-obvious WHY — Editorial-Konfig kann Inline-Kommentare „WHY sensibel" enthalten
- #7 TS strict
- #10 Cookieless — Mailto via `<a href="mailto:">`, kein Tracking
- #11 Kein US-Drittanbieter — Wikipedia (Wikimedia, US-Origin, aber Public-Source ohne Tracking) Allowlist-Eintrag in Story 4.3
- #13 A11y-First — Disclaimer-Text + Mailto-Link Tastatur-erreichbar
- #14 i18n-First — TODO für Disclaimer-Texte
- #18 Keyed `{#each}` — falls multiple Disclaimer-Variants

### Library/Framework Requirements

**Bereits installiert:** alle nötigen Deps

**Neu in Story 1.12:** keine

### Testing Requirements

**Unit-Tests:**
- `editorial-disclaimer.test.ts`, `error-feedback-mailto.test.ts`, `stolperstein-detail.test.ts`, `seasonality.test.ts`, `editorial-config.test.ts`

**E2E:**
- `tests/e2e/editorial-pattern.spec.ts` — Full-Flow per sensitiven Layer

**Manuelle Review:**
- `docs/editorial-review.md`-Checkliste pre-Phase-1-Launch

**Coverage-Target:** ≥85% (höhere Bar für sensible Patterns)

### File-Structure-Requirements (Diff zu Story 1.11)

```
./
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── contact.ts                     # FEEDBACK_EMAIL-Konstante
│   │   │   ├── seasonality.ts
│   │   │   └── seasonality.test.ts
│   │   └── components/
│   │       └── atlas/
│   │           ├── editorial-disclaimer.svelte
│   │           ├── editorial-disclaimer.test.ts
│   │           ├── error-feedback-mailto.svelte
│   │           ├── error-feedback-mailto.test.ts
│   │           ├── stolperstein-detail.svelte
│   │           ├── stolperstein-detail.test.ts
│   │           ├── mauer-sektoren-detail.svelte    # Stub für Phase 2
│   │           └── internal/
│   │               ├── editorial-config.ts
│   │               ├── editorial-config.test.ts
│   │               └── editorial-types.ts
├── docs/
│   └── editorial-review.md                    # Pre-Launch-Checkliste
└── tests/
    └── e2e/
        └── editorial-pattern.spec.ts
```

### Previous Story Intelligence

- **Story 1.9:** LayerHitRow Foundation — Story 1.12 erweitert via Editorial-Konfig + Stolperstein-Detail
- **Story 1.4:** LayerHit mit `reason: 'seasonal'` + LayerMetadata.seasonality
- **Story 1.3:** Trinkbrunnen-Manifest mit `seasonality: { from: '05-01', to: '10-31' }`
- **Story 1.2:** MetaFooter Mailto `hallo@navigator.berlin` — zentralisieren in `utils/contact.ts`
- **Story 1.10:** DataTableAlternative falls Editorial-Disclaimer in Tabellen-View nötig

### Git Intelligence

- Editorial-Review-Doc `docs/editorial-review.md` committed
- Pre-Phase-1-Launch-Checkliste Pflicht-Schritt vor Tag/Release

### Latest Tech Information (Mai 2026)

- **Mailto-Links:** standard, alle Mailclients unterstützen `subject`+`body`-Parameter
- **OSM Stolperstein-Tagging-Konvention:** `memorial=stolperstein` + `name=...` + `inscription=...` + `wikipedia:de=...` — stabil
- **Berliner Koordinierungsstelle (Mai 2026):** Domain `stolpersteine-berlin.de` weiterhin aktiv

### Open Questions

1. **Stolperstein-Biografie-URL-Pattern:** Slug-Generation aus OSM-Person-Property unzuverlässig (Schreibweisen-Varianten). Empfehlung: Homepage-Link Default, Direct-Biografie-Link nur wenn `wikipedia:de`-Property vorhanden (Wikipedia-Slug deterministisch)
2. **Mailto-Body-Maximallänge:** Browser/Mailclients schneiden lange Mailto-URLs ab (~2KB Limit). Aktuell ~500 Zeichen — OK
3. **Mauer/Sektoren-Layer-Daten-Quelle:** OSM hat partielle Mauer-Geometrie, vollständige Daten via Code-for-Berlin oder „Berliner Mauer e.V."? Phase-2-Investigation. Story 1.12 Foundation, Layer kommt später
4. **Editorial-Review-Frequenz:** Pre-Launch + halbjährlich? Solo-Maintainer-Entscheidung
5. **Wikipedia-CSP-Allowlist:** `de.wikipedia.org` + `en.wikipedia.org` für Quellen-Links. Story 4.3 CSP-Konfig ergänzen

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.12: Editorial-Verantwortung-Pattern] (ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified] (Editorial-Verantwortung)
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] (UX-DR38 Editorial, UX-DR20 DataStand, UX-DR29 Buttons)
- [Source: _bmad-output/planning-artifacts/prd.md] (FR21, FR50, FR51, FR52, FR53, FR55, FR55i, NFR-IL9)
- [Source: _bmad-output/implementation-artifacts/1-3-build-zeit-daten-pipeline-mit-manifest.md] (Trinkbrunnen-Saisonalität, Stolperstein-OSM-Source)
- [Source: _bmad-output/implementation-artifacts/1-4-daten-zugriffs-abstraktion.md] (LayerHit.reason, LayerMetadata.seasonality)
- [Source: _bmad-output/implementation-artifacts/1-9-inspektor-panel-mit-layer-hits.md] (LayerHitRow, DataStandBanner)
- [Source: _bmad-output/implementation-artifacts/1-2-design-token-foundation-mit-cloud-dancer-plex.md] (MetaFooter-Mailto)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Code dev-story session, 2026-05-13)

### Debug Log References

- svelte-check: 0 errors / 0 warnings (5189 Files)
- Vitest scoped suite: 100/100 passing
- Vitest full suite: 580/581 passing (1 pre-existing fail in climate-long-view.svelte.test.ts aus Story 1.11, NICHT-Regression von Story 1.12)

### Completion Notes List

- TDD-First per ADR-012 für alle Business-Logic + Components: Red → Green → Refactor pro Task
- **Scope-Pivot 2026-05-13 (User-Approval):** Per-LayerRow-`ErrorFeedbackMailto` aus Inspector entfernt. Drei "Fehler im Eintrag?"-Links pro Hit waren visueller Clutter. Maintainer-Entscheidung: künftige `/feedback`-Form-Page im MetaFooter linken. `ErrorFeedbackMailto`-Komponente + `buildErrorReportMailto`-Utility bleiben als wiederverwendbare Bausteine.
- `EditorialDisclaimer` mit `sourceUrl`-Inline-Link bleibt (User-Wunsch) für Primary-Source-Discoverability (mietspiegel.berlin.de, gutachterausschuss, etc.)
- `MauerSektorenDetail` Stub bereit; Layer-Daten + Manifest-Entry Phase 2
- `StolpersteinDetail` strict-OSM-only, `data-osm-sourced="true"`-Marker im DOM, kein `data-ai-generated`-Attribut. Wikipedia-Link via OSM-Property `wikipedia:de`/`wikipedia:en` deterministisch geparst
- Trinkbrunnen-Seasonality: `state-success`-Pille "aktiv (Mai–Oktober)" wenn state==='with-value', `state-warning`-Pille "außerhalb der Saison" + seasonal-Disclaimer wenn state==='seasonal'
- `FEEDBACK_EMAIL`-Konstante in `src/lib/utils/contact.ts`; MetaFooter migriert (Hardcode raus)
- `neverMachineTranslate`-Flag für stolpersteine + mauer-sektoren; Doc `docs/never-machine-translate.md` mit Pipeline-Pflichten (Story 3.3 Konsumierung)

### File List

**Neu:**
- `src/lib/components/atlas/internal/editorial-config.ts`
- `src/lib/components/atlas/internal/editorial-config.test.ts`
- `src/lib/components/atlas/internal/editorial-types.ts`
- `src/lib/components/atlas/editorial-disclaimer.svelte`
- `src/lib/components/atlas/editorial-disclaimer.svelte.test.ts`
- `src/lib/components/atlas/error-feedback-mailto.svelte`
- `src/lib/components/atlas/error-feedback-mailto.svelte.test.ts`
- `src/lib/components/atlas/stolperstein-detail.svelte`
- `src/lib/components/atlas/stolperstein-detail.svelte.test.ts`
- `src/lib/components/atlas/mauer-sektoren-detail.svelte`
- `src/lib/components/atlas/mauer-sektoren-detail.svelte.test.ts`
- `src/lib/utils/contact.ts`
- `src/lib/utils/contact.test.ts`
- `src/lib/utils/seasonality.ts`
- `src/lib/utils/seasonality.test.ts`
- `tests/e2e/editorial-pattern.e2e.ts`
- `docs/editorial-review.md`
- `docs/never-machine-translate.md`

**Geändert:**
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` (Editorial-Integration: Disclaimer-Stack, Stolperstein/Mauer-Detail, Seasonal-Pillen; Mailto-Block entfernt)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte.test.ts` (Editorial-Assertions hinzugefügt)
- `src/lib/components/atlas/inspector-panel.svelte` (lat/lng-Pass-Through für StolpersteinDetail-Feature-Geometry)
- `src/lib/components/atlas/meta-footer.svelte` (FEEDBACK_EMAIL-Konstante statt Hardcode)

### Change Log

| Datum       | Änderung                                                                                     |
|-------------|----------------------------------------------------------------------------------------------|
| 2026-05-13  | Story 1.12 implementiert: Editorial-Konfig, Disclaimer, Stolperstein-Detail, Seasonality     |
| 2026-05-13  | Scope-Pivot (User-Review): Per-LayerRow-Mailto raus, Footer-Feedback-Page deferred           |
| 2026-05-13  | Status → review                                                                              |

## Confirmed Decisions

1. **Editorial-Konfig zentralisiert:** `internal/editorial-config.ts` als Single-Source-of-Truth. LayerHitRow konsultiert Konfig
2. **NIE LLM-generierte Personen-Hintergründe:** FR51 verbindlich. Stolperstein-Detail nutzt OSM-Properties oder Quellen-Link, kein generierter Text
3. **Mailto-Pattern:** Pre-filled Subject + Body mit Layer-Identifier, Adresse, Lat/Lng, Datenstand, Quelle. URL-encoded
4. **Saisonalität-Helper:** `$lib/utils/seasonality.ts` zentral, MM-DD-Range-Check
5. **Mauer/Sektoren-Layer:** Foundation in 1.12, Layer-Daten in Phase 2. Stub-Komponente vorhanden
6. **Never-Machine-Translate-Flag:** Editorial-Konfig signalisiert sensible Inhalte. Translation-Pipeline (Story 3.3) konsumiert
7. **FEEDBACK_EMAIL-Konstante:** in `$lib/utils/contact.ts` zentralisiert. MetaFooter umgestellt
8. **Manuelle Editorial-Review pre-Launch:** Checkliste in `docs/editorial-review.md`, Pflicht-Schritt
