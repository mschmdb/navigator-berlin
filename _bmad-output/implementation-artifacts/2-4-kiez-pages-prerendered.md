# Story 2.4: Kiez-Pages prerendered

Status: ready-for-dev

## Story

As a Frieda (Datenjournalistin),
I want für jeden Berliner Kiez eine prerenderte Page mit Lead, Steckbrief, Karten-Embed mit Boundary-Highlight, Kiez-Score-Sektion (aus Story 1.28) und FAQ-Placeholder,
so that Long-Tail-Suchanfragen wie „Wohnlage Boxhagener Kiez" oder „Mobilität Schillerkiez" direkt eine ruhige, daten-dichte Page finden ohne JavaScript-Pflicht.

## Probleme heute

1. Keine Kiez-Page-Route existiert. Long-Tail-Suchen landen entweder auf der Atlas-Karten-Root (kein Lead, keine Steckbrief-Tabelle) oder gar nicht. FR28 ist unerfüllt.
2. Story 1.28 hat `static/kiez-scores/kiez-scores.json` mit 542 LOR-Planungsraum-Scores produziert. Diese Score-Daten werden im Inspector-Panel angezeigt, aber NICHT auf einer dedizierten Kiez-Page mit Permalink. Power-User können also keinen einzelnen Kiez via URL-Share weiterleiten.
3. **Daten-Inkonsistenz:** Epic-Wortlaut schreibt „138 LOR-Bezirksregionen". Aktueller Stand im Manifest: `lor-planungsraum` mit 542 Features vorhanden, `lor-bezirksregion` NICHT vorhanden. Story 1.10 hat LOR-Bezirksregion entfernt. `getKiezProfile` zeigt im Code-Stand auf `lor-bezirksregion` und ist damit Live-broken. Dieser Konflikt muss VOR Dev-Start geklärt sein (Open-Question 1).

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1141-1164.
- PRD: FR28 (`prd.md` Zeile 730), FR33 (Zeile 735), NFR-P1/P7/P8.
- UX-Layout: `ux-design-specification.md` Zeile 1185-1215 (gleiches Long-Form-Pattern wie Bezirks-Page).
- Story 2.3 (ready-for-dev): Bezirks-Page-Pattern, `bezirk-hero.svelte`, `map-embed.svelte`. Story 2.4 spiegelt das Pattern.
- Story 1.28 (review): `static/kiez-scores/kiez-scores.json` mit 542 LOR-Planungsraum-Scores, `src/lib/data/get-kiez-score.ts` als Runtime-Adapter, `kiez-score-section.svelte` als Inspector-Komponente.
- Bestehender Loader: `src/lib/data/get-kiez-profile.ts` mit `getKiezProfile(locale, slug, fetchFn)` → `KiezProfile`. Aktuell BROKEN weil `LOR_BR_SLUG = 'lor-bezirksregion'` im Manifest fehlt.
- Bestehender Typ: `src/lib/data/types.ts:102-112` (`KiezProfile` mit `bezirk: string`-Feld für Hierarchie).
- LOR-Layer im Manifest: `lor-planungsraum.{hash}.geojson` mit 542 Features (Polygon).
- Stories 2.0, 2.1, 2.2, 2.3 (alle ready-for-dev): Postgres-Aggregat (`kiez_stats`-Query), SeoHead, JsonLd-Generators, Bezirks-Page-Pattern als Vorlage.
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_kiez_score_naming.md`.

## Akzeptanz-Kriterien

1. **AC-1 (Daten-Quelle + Slug-Set entschieden, dann Route + entries):**
   **Given** die Daten-Inkonsistenz aus „Probleme heute #3"
   **When** User-Decision aus Open-Question 1 vorliegt, dann implementiere ich Route + Loader + entries-Hook entsprechend
   **Then** je nach Entscheidung:
   - **Variante A (138 LOR-Bezirksregion zurückholen, Recommended):** Pipeline-Eintrag `lor-bezirksregion` in `scripts/lib/sources.ts` re-introducen (ODIS-Endpoint `https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson`); Manifest hat danach 138 Features; `getKiezProfile` referenziert wieder gültigen Layer; entries-Hook liefert 138 Slugs × 2 Locales = 276 prerendered Routen unter `/kiez/{slug}`
   - **Variante B (542 LOR-Planungsraum als Kiez-Page-Set):** entries-Hook liefert 542 Slugs × 2 Locales = 1.084 prerendered Routen; `getKiezProfile` wird pivotiert auf `lor-planungsraum`-Layer; KiezProfile bekommt `bezirksregion: string`-Zwischen-Hierarchie; Build-Zeit-Risiko (Epic-Budget <5min wird sportlich)
   - **Variante C (lor-bezirksregion fetchen aber Kiez-Score weiter auf 542 berechnet, Score-Aggregation pro Kiez-Page):** Hybride aus A + B; pro 138er-Page wird Score aus enthaltenen 542er-Planungsräumen aggregiert (Flächen-gewichtetes Mittel oder dominante Klasse)
   - Slug-Konvention: kebab-case via `normalizeSlug`
   - Build-Verify: pro Variante korrekte Anzahl HTML-Files unter `build/prerendered/kiez/`

2. **AC-2 (Hybrid-Loader: Static-GeoJSON + Postgres-Aggregat + Kiez-Score):**
   **Given** Story 2.0 (`kiez_stats`-Tabelle) und Story 1.28 (`kiez-scores.json`-Asset)
   **When** ich `+page.server.ts` mit `prerender = true` und `load()` baue
   **Then**:
   - Loader ruft `getKiezProfile(locale, slug)` für Geo + Layer-Coverage (Source-of-Truth bleibt Static-GeoJSON)
   - Loader ruft `getKiezStats(slug)` aus `src/lib/server/db/queries/get-kiez-stats.ts` (Story 2.0)
   - Loader ruft `getKiezScore(slug)` aus `src/lib/data/get-kiez-score.ts` (Story 1.28-Adapter; existiert)
   - Falls Story 2.0 noch nicht durch: `kiezStats === null`, Steckbrief-Section rendert Placeholder
   - Falls Kiez-Score 404 (Build-Pipeline noch nicht gelaufen): `kiezScore === null`, Score-Section ausgeblendet (Story-1.28-Adapter macht das bereits graceful)
   - Loader gibt `KiezPageData = { profile: KiezProfile, stats: KiezStats | null, score: KiezScore | null }` zurück
   - Test: Loader-Snapshot Boxhagener Kiez

3. **AC-3 (Kiez-Hero-Komponente):**
   **Given** UX-DR43 Long-Form (gleicher Wireframe wie Bezirks-Page)
   **When** ich `src/lib/components/atlas/kiez-hero.svelte` implementiere
   **Then**:
   - Komponente nimmt `{ profile: KiezProfile, stats: KiezStats | null, score: KiezScore | null }` als Props
   - Rendert:
     - `<h1>` Plex-Serif mit Kiez-Name + Bezirks-Subline (`profile.name` + „in {profile.bezirk}")
     - Lead-Absatz Plex-Serif `--text-lg` max 72ch: i18n-Template mit Einwohner + Fläche + Bezirks-Hinweis
     - `map-embed.svelte` (Story 2.3-Komponente) mit 50vh, Boundary-Highlight des Kiez-Polygons
     - Steckbrief-Tabelle aus `kiez_stats` analog Bezirks-Hero (ohne Vertikal-Linien, Stand-Subline pro Wert)
     - Kiez-Score-Section (falls `score !== null`): wiederverwende `kiez-score-section.svelte` aus Story 1.28 (ggf. mit `variant="page"`-Prop für Long-Form-Layout). Alternativ: dedizierte `kiez-score-summary.svelte` für Page-Layout
     - Section-Placeholder „Häufige Fragen" mit Hinweis-Text (Story 2.5b befüllt)
   - DRY mit Bezirks-Hero wenn möglich (gemeinsame Steckbrief-Komponente extrahieren — siehe Open-Question 4)
   - Komponente <500 LOC

4. **AC-4 (Karten-Embed nutzt Story 2.3-Komponente):**
   **Given** `map-embed.svelte` aus Story 2.3 (ready-for-dev)
   **When** ich die Kiez-Karte einbinde
   **Then**:
   - Wiederverwendung von `map-embed.svelte` ohne Erweiterung
   - Boundary-Highlight Polygon = `profile.geometry`
   - fitBounds auf Kiez-Polygon-Bbox mit Padding 40
   - `<noscript>`-Fallback: OG-Image aus `static/og/kiez/{slug}.png` (Story 2.6 generiert; bis dahin SVG-Fallback)
   - Falls Story 2.3 noch nicht durch: Story-2.4-Spec verlangt Map-Embed-Komponenten-Build in dieser Story (Open-Question 2 für Reihenfolge)

5. **AC-5 (SEO-Head + JSON-LD):**
   **Given** Story 2.1 SeoHead, Story 2.2 JsonLd-Generators
   **When** ich Kiez-Page mit SEO + Structured-Data ausstatte
   **Then**:
   - `<SeoHead title={pageTitle} description={pageDescription} canonical locale ogImage />`
     - `pageTitle` DE: `Kiez {name} ({bezirk}) · navigator.berlin`
     - `pageDescription` DE: aus Lead-Template (140-160 chars)
   - `<JsonLd data={placeJsonLd} />` via `buildPlace({ origin, name, centroid, containedInPlaceName: profile.bezirk })`
   - `<JsonLd data={areaJsonLd} />` via `buildAdministrativeArea({ origin, name, parentName: profile.bezirk })`
   - `<JsonLd data={breadcrumbJsonLd} />` via `buildBreadcrumbList([{name:'Berlin', url:'/'}, {name: profile.bezirk, url:'/bezirk/'+bezirkSlug}, {name: profile.name, url:'/kiez/'+slug}])`
   - OG-Image-Meta: `${origin}/og/kiez/${slug}.png`
   - Tests pro Locale

6. **AC-6 (Sitemap-Registrierung):**
   **Given** Story 2.1 `SitemapSource`-Pattern
   **When** ich Kiez-Routen in Sitemap aufnehme
   **Then**:
   - Neue Source `KIEZ_PAGES_SOURCE` in `src/lib/seo/sources/kiez-pages.ts`
   - liest Kiez-Slugs aus dem entschiedenen Layer (138 LOR-BR oder 542 Planungsraum, je nach AC-1)
   - `lastmod` aus Layer-`sourceUpdatedAt`, `changefreq: 'monthly'`, `priority: 0.6`
   - Pure-Function-Test

7. **AC-7 (Build-Zeit-Budget Phase 1 < 5 Minuten):**
   **Given** dass Prerender für 276 (Variante A) oder 1.084 (Variante B) HTML-Files läuft
   **When** ich `pnpm build` ausführe
   **Then**:
   - Build-Time-Spotcheck: Gesamtbuild bleibt unter 5 Minuten auf lokaler Dev-Maschine (Annahme commodity, Hetzner-CPX22 wird ähnlich)
   - Falls Variante B (542 × 2 = 1.084 Routen): Spike-Test in T1, falls Build > 8 Minuten → Pivot zu Variante A oder C, in Sprint-Status dokumentieren
   - Karten-Embed wird Client-Hydrate; SSR rendert nur SVG-Fallback (NICHT MapLibre via JSDOM, das wäre Build-Killer)

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: `entries()`-Test mit korrekter Slug-Anzahl (138 oder 542)
   - AC-2: Loader-Snapshot für Boxhagener Kiez + 1 Edge-Case (Kiez ohne Score, z.B. wenn 1.28 noch nicht gebuildet)
   - AC-3: Komponenten-Test mit 3 Fixtures (mit Score, ohne Score, ohne Stats)
   - AC-4: Map-Embed-Smoke
   - AC-5: SEO + JSON-LD-Snapshots pro Locale
   - AC-6: Pure-Function-Test der Sitemap-Source
   - AC-7: Build-Time-Smoke (lokal, nicht in CI als Hard-Gate)
   - E2E `tests/e2e/kiez-page.e2e.ts`: Boxhagener Kiez lädt ohne JS, zeigt h1, Lead, Karten-Fallback, Steckbrief, Score-Section, FAQ-Placeholder; axe-Check Smoke
   - Coverage-Ziel: Hero-Komponente ≥80%, Loader ≥90%, Sitemap-Source 100%

## Tasks / Subtasks

- [ ] **T1: Slug-Set + Pipeline-Foundation** (AC: 1, 7)
  - [ ] T1.1: User-Decision zu Open-Question 1 einholen (Variante A/B/C)
  - [ ] T1.2: Variante A: `scripts/lib/sources.ts` ergänzt `lor-bezirksregion`-Pipeline-Eintrag, `pnpm data:fetch` produziert 138-Feature-Layer, Manifest-Update
  - [ ] T1.3: Variante B: `getKiezProfile` auf `lor-planungsraum` umstellen, `KiezProfile`-Typ erweitern, 542 Slugs als entries
  - [ ] T1.4: Build-Zeit-Spike (T1 Erstrun): Variante B mit 1.084 Routen unter 8 Minuten? Falls nein, Pivot
  - [ ] T1.5: Tests: entries-Hook + Slug-Count

- [ ] **T2: Loader + KiezPageData-Typ** (AC: 2, 8)
  - [ ] T2.1: `routes/(with-header)/kiez/[slug]/+page.server.ts` mit `prerender = true`, `entries()`, `load()`
  - [ ] T2.2: `KiezPageData`-Typ in `src/lib/data/types.ts`
  - [ ] T2.3: 3-Way-Hybrid: Static-GeoJSON + Postgres-Stats + Kiez-Score-JSON
  - [ ] T2.4: Loader-Tests

- [ ] **T3: Kiez-Hero-Komponente** (AC: 3, 8)
  - [ ] T3.1: `src/lib/components/atlas/kiez-hero.svelte`
  - [ ] T3.2: Lead-Template via Paraglide-Messages
  - [ ] T3.3: Steckbrief-Tabelle (DRY-Pattern mit Bezirks-Hero falls möglich, siehe Open-Q4)
  - [ ] T3.4: Kiez-Score-Section-Einbindung (re-use `kiez-score-section.svelte` oder dedizierte Page-Variante)
  - [ ] T3.5: FAQ-Placeholder
  - [ ] T3.6: Komponenten-Tests mit 3 Fixtures

- [ ] **T4: Karten-Embed** (AC: 4)
  - [ ] T4.1: Re-use `map-embed.svelte` aus Story 2.3 (falls 2.3 noch nicht durch: in 2.4 implementieren und Cross-Story-Hand-off in Dev-Notes vermerken)
  - [ ] T4.2: Boundary-Highlight + fitBounds + noscript-Fallback

- [ ] **T5: SEO + JSON-LD** (AC: 5)
  - [ ] T5.1: SeoHead-Einbindung mit Title, Description, Canonical, hreflang, OG-Image
  - [ ] T5.2: Place + AdministrativeArea + BreadcrumbList (Berlin → Bezirk → Kiez)
  - [ ] T5.3: Tests

- [ ] **T6: Sitemap-Source** (AC: 6)
  - [ ] T6.1: `src/lib/seo/sources/kiez-pages.ts`
  - [ ] T6.2: Pure-Function-Test
  - [ ] T6.3: Falls Story 2.1 mergt: Integration in Per-Sprache-Sitemap

- [ ] **T7: E2E + Final-Verifikation** (AC: 1-8)
  - [ ] T7.1: `tests/e2e/kiez-page.e2e.ts` Boxhagener-Kiez-Smoke + axe
  - [ ] T7.2: `pnpm test:unit -- --run` 100% grün
  - [ ] T7.3: `pnpm check` 0 Errors
  - [ ] T7.4: `pnpm build` läuft unter Budget, prerendered HTML-Files existieren
  - [ ] T7.5: Browser-Verify: `/kiez/boxhagener-kiez`, `/kiez/schillerkiez`, `/en/kiez/boxhagener-kiez`
  - [ ] T7.6: Sprint-Status-Eintrag

## Dev Notes

### Daten-Konflikt (Critical) — Open-Question 1

**Status quo:**

- Manifest enthält `lor-planungsraum` mit 542 Features (Polygon).
- `lor-bezirksregion` (138 Features) wurde mit Story 1.10 entfernt.
- `getKiezProfile` (Bestand) zeigt auf `lor-bezirksregion` → liefert HTTP 500 mit Message „lor-bezirksregion-Layer fehlt im Manifest".
- Story 1.28-Kiez-Score läuft auf 542 LOR-Planungsraum-Ebene.

**Drei Optionen für Story 2.4:**

| Variante | Slug-Set | Pages | Score-Quelle | Build-Risiko | Empfehlung |
|----------|----------|-------|--------------|--------------|------------|
| A | 138 LOR-Bezirksregion | 276 | aggregiert aus 542er | niedrig | ★ Recommended |
| B | 542 LOR-Planungsraum | 1.084 | direkt aus 1.28 | hoch (Budget!) | nur falls Build hält |
| C | 138 LOR-BR mit Score-Aggregation pro Page | 276 | aggregiert | mittel | wenn Aggregations-Logik leicht baubar |

**Empfehlung (A):**

1. `lor-bezirksregion` als Pipeline-Eintrag wieder einbauen (ODIS-Endpoint kommt aus alter Pipeline; siehe Git-History `scripts/lib/sources.ts` vor Story 1.10).
2. `getKiezProfile` zeigt wieder auf gültigen Layer.
3. Kiez-Score pro Kiez-Page: Score wird aus den 1-N Planungsräumen innerhalb der Bezirksregion aggregiert (Flächen-gewichtetes Mittel pro Dimension). Neuer Helper `aggregateKiezScoreToBezirksregion(bezirksregionSlug, planungsraumScores)`.
4. Alternative falls Aggregation kompliziert: Score-Section auf der Kiez-Page rendert „N Planungsräume" als Sub-Liste mit Per-Planungsraum-Scores statt Bezirksregion-Aggregat.

User-Entscheidung VOR Dev-Start einholen.

### Sub-Komponenten DRY mit Bezirks-Page (Open-Question 4)

Bezirks-Hero (Story 2.3) und Kiez-Hero (Story 2.4) haben fast identischen Wireframe:

- h1 + optional Subline
- Lead
- Karten-Embed
- Steckbrief
- (Score-Section nur Kiez)
- FAQ-Placeholder

Empfehlung: gemeinsame `place-hero.svelte`-Komponente mit Slot/Snippet-Props:

```svelte
<PlaceHero {profile} {stats}>
  {#snippet h1Subline()}{profile.bezirk ? `in ${profile.bezirk}` : ''}{/snippet}
  {#snippet extraSection()}{#if score}<KiezScoreSection {score} />{/if}{/snippet}
</PlaceHero>
```

Trade-off: Coupling zwischen 2 Stories; falls 2.3 zuerst gemerged wird, hat 2.4 weniger Reibung. Alternativ jede Story eigene Hero-Komponente und Code-Doppelung akzeptieren (MUST-Rule #5 verbietet premature abstraction nicht hier — drei ähnliche Stellen wären OK, zwei Stellen sind Grenzfall).

### Story-1.28-Kiez-Score-Asset-Wiederverwendung

`src/lib/data/get-kiez-score.ts` (Story 1.28) liefert pro Lat/Lng → `KiezScore | null`. Für Kiez-Page brauchen wir Score per Slug, nicht per Punkt.

Optionen:

- a) Helper `getKiezScoreBySlug(slug)` ergänzen, der `kiez-scores.json` direkt liest und Slug-Lookup macht
- b) Loader nimmt Kiez-Centroid und ruft existierenden Punkt-basierten `getKiezScore(lat, lng)`

Empfehlung (a): Slug-direkter Lookup ist schneller + deterministischer; Bestands-Adapter um Slug-Methode erweitern (kein Pivot, additive Erweiterung).

### Karten-Embed-Hand-off zu Story 2.3

`map-embed.svelte` ist Story-2.3-Scope. Falls Reihenfolge umgekehrt (2.4 vor 2.3) oder parallel: 2.4 implementiert die Komponente, 2.3 nutzt sie nur. Dev-Notes pro Story-Start aktualisieren wer die Komponente erstmalig anlegt.

### Build-Zeit-Risiko (Variante B)

542 Planungsräume × 2 Locales = 1.084 prerendered HTML-Files. SvelteKit prerendert sequenziell (oder partial parallel). Pro Page ~50-100ms Render + Daten-Load → ~1-2 Minuten. Plus MapLibre-Lazy-Load-Asset-Generierung. Realistisch wahrscheinlich unter 5 Minuten, aber Spike pflicht.

Falls Variante B gewählt: in T1.4 frühen Spike mit ~50 Routen messen + linear hochskalieren.

### Steckbrief-Werte aus `KiezStats` (Story 2.0)

Gleiche Sektionen wie Bezirks-Page (Story 2.3), nur auf Kiez-Ebene:

| Section | Wert | Quelle |
|---------|------|--------|
| Lärm | Mean L_DEN | `stats.laerm.meanLDen` |
| Luft | Mean NO2 | `stats.luft.meanNo2` |
| Klima | Mean PET | `stats.klima.meanPet` |
| Grün | Mean Versorgung | `stats.gruen.meanVersorgung` |
| ÖPNV | Stationen/km² | `stats.oepnv.stopsPerKm2` |
| Bildung | Kitas+Schulen/km² | `stats.bildung.*` |
| Wohnen | Dominante Wohnlage | `stats.wohnen.dominantWohnlage` |
| Soziale Lage | MSS-Gesamtindex dominante Gruppe | `stats.wohnen.dominantMssGroup` (Stigma-Disclaimer) |

### Kiez-Score-Section-Layout

Story-1.28-Komponente `kiez-score-section.svelte` ist für Inspector-Panel (schmaler Container, Plex-Mono-Header). Für Long-Form-Page brauchen wir möglicherweise andere Typografie (Plex-Serif h2, breiterer Container).

Optionen:

- a) Komponente bekommt `variant: 'inspector' | 'page'`-Prop
- b) Page baut eigene `kiez-score-page-section.svelte`-Wrapper-Komponente

Empfehlung (a) wenn Anpassung minimal, sonst (b). Entscheidung beim Dev-Start.

### Score-Section auf Kiez-Page bei Aggregation (Variante A oder C)

Falls Variante A/C: Score pro 138er-Kiez = Aggregat aus N Planungsräumen. Visualisierung:

- Aggregat-Wert pro Dimension (gewichtetes Mittel)
- Sub-Hinweis „aggregiert aus N Planungsräumen"
- Optional: Liste der Planungsräume mit Per-Planungsraum-Score (Disclosure)
- Soziale-Lage bleibt hart-neutral (keine Bewertung)

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Hero-Komponente ggf. splitten in Sub-Komponenten
- **#3 Bestehende Funktionen prüfen:** `getKiezProfile`, `getKiezScore`, `kiez-score-section.svelte`, `normalizeSlug`, `map-embed.svelte` (Story 2.3); keine Re-Implementation
- **#10 Cookieless:** Server-only-Render, kein Cookie
- **#13 A11y:** WCAG-AA, axe 0 Violations
- **#14 i18n-First:** Lead, Title, Description via Paraglide
- **#21 prerender + entries:** AC-1 enforced

### Open-Questions vor Dev-Start

1. **Slug-Set + Score-Quelle (Variante A/B/C):** Empfehlung A (138 Bezirksregion + Score-Aggregation aus 542 Planungsräumen). Build-Risiko niedrig, Pages-Anzahl im Long-Form-Budget. Akzeptabel?
2. **Reihenfolge zu Stories 2.0, 2.3:** 2.4 blockt formell auf 2.0 (Stats) + 2.3 (Hero-Pattern + map-embed). Vorgehen?
3. **Kiez-Score auf Page: Inspector-Variant re-use oder Page-Variant neu?** Empfehlung Inspector-Variant mit `variant`-Prop. OK?
4. **Hero-Komponente: DRY mit Bezirks-Hero (`place-hero.svelte`) oder zwei separate Komponenten?** Empfehlung: erst beide separat bauen, später (Phase 2) als gemeinsame Komponente extrahieren wenn 3. Use-Case (Layer-Konzept-Hero?) entsteht. Akzeptabel?
5. **Soziale Lage in Steckbrief: zeige ich „dominante Gruppe" pro Kiez?** Erhöht Stigma-Risiko gegenüber Inspector-Anzeige der einzelnen Adresse. Alternative: Soziale Lage NUR via Score-Section (kategorisch-neutral), NICHT im Steckbrief. Empfehlung Letzteres.

### Project Structure Notes

- Route: `src/routes/(with-header)/kiez/[slug]/+page.svelte` + `+page.server.ts`
- Komponente: `src/lib/components/atlas/kiez-hero.svelte`
- Helper: `src/lib/data/get-kiez-score.ts` um `getKiezScoreBySlug` erweitern
- Sitemap-Source: `src/lib/seo/sources/kiez-pages.ts`
- Pipeline-Anpassung (Variante A): `scripts/lib/sources.ts` ergänzt LOR-Bezirksregion
- i18n-Keys: neue Messages in `messages/de.json`

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1141-L1164](../planning-artifacts/epics.md)
- FR28 + FR33: [prd.md#L729-L735](../planning-artifacts/prd.md)
- UX-DR43: [ux-design-specification.md#L1185-L1215](../planning-artifacts/ux-design-specification.md)
- Story 2.0: [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.1: [./2-1-seo-foundation-sitemap-canonical-robots-txt.md](./2-1-seo-foundation-sitemap-canonical-robots-txt.md)
- Story 2.2: [./2-2-json-ld-generator-bibliothek.md](./2-2-json-ld-generator-bibliothek.md)
- Story 2.3: [./2-3-bezirks-pages-prerendered.md](./2-3-bezirks-pages-prerendered.md)
- Story 1.28: [./1-28-livability-index.md](./1-28-livability-index.md)
- Bestehender broken Loader: [src/lib/data/get-kiez-profile.ts:10](../../src/lib/data/get-kiez-profile.ts)
- Kiez-Score-Adapter: [src/lib/data/get-kiez-score.ts](../../src/lib/data/get-kiez-score.ts)
- Manifest LOR: [static/layers/MANIFEST.json](../../static/layers/MANIFEST.json) (Slug `lor-planungsraum`)
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_kiez_score_naming.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
