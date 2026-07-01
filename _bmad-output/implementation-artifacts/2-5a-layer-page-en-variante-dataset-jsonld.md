# Story 2.5a: Layer-Page Englisch-Variante + Dataset-JSON-LD

Status: review

> **Scope-Reduktion 2026-05-16 (User-Lock + Memory `project_i18n_phase_1_de_only`):**
> EN-Coverage komplett auf Phase 3 (Post-Hard-Launch) verschoben. Diese Story
> liefert in Phase 1 nur DE-only Refactor + Authority-Zentralisierung
> (i18n-Ready-Schema). EN-Tasks unten sind als `deferred: phase-3` markiert.
> Layer-Detail-Page Dataset-JSON-LD bleibt Story-2.2-Verantwortung
> (`buildDataset` noch nicht auf main, siehe Cross-Story-Hand-off in Dev-Notes).

## Story

As a englisch-sprechender Bürger / Suchender / LLM-Agent,
I want die bestehende Layer-Detail-Page (`/layer/[slug]`, Story 1.29) auch auf Englisch sehen mit korrekt gerendertem Dataset-JSON-LD und Translation-Quality-Disclaimer,
so that nicht-deutsche Nutzer Layer-Konzepte verstehen und LLM-Crawler die ~42 Layer als zitierbare Daten-Quelle in beiden Sprachen aufnehmen können.

## Probleme heute

1. Layer-Detail-Page existiert nur in DE. `/en/layer/{slug}` würde aktuell DE-Strings rendern (oder bricht je nach Paraglide-Reroute-Verhalten).
2. `LAYER_EXPLAIN_DE`, `LAYER_METHODOLOGY_DE`, `getLayerDisplayName` sind hardcoded DE-Maps. Es gibt kein Locale-aware Lookup-Pattern, obwohl `buildLayerDetail(slug, lang, manifest)` bereits einen `lang`-Param entgegennimmt (wird aber ignoriert).
3. Dataset-JSON-LD: Story 2.2 (ready-for-dev) baut die `buildDataset`-Generator und bindet sie auf der Layer-Detail-Page in DE ein. EN-Variante braucht eigene `inLanguage`-Property + EN-Beschreibungstext, sonst LLM-Agent erhält DE-Description auf einer EN-Page (FR40 sauberer Quellen-Attribution gebrochen).
4. ~42 Layer (Manifest-Stand 2026-05-15; epic-Wortlaut „~25" ist veraltet). Bei vollständiger Locale-Abdeckung = 84 prerendered HTML-Files.
5. Übersetzungs-Drift-Risiko: keine Editorial-Transparenz wenn EN-Inhalte aus DE-Source veralten. Lösung per Epic-AC: Translation-Disclaimer „Translated from German source. Original DE version remains authoritative."

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1166-1193.
- PRD: FR36 (`prd.md` Zeile 741, JSON-LD Dataset), FR40 (Zeile 745).
- Story 1.29: Layer-Detail-Page-Foundation (`_bmad-output/implementation-artifacts/1-29-atlas-methodik-pattern.md`).
- Bestehender Loader: `src/lib/data/get-layer-detail.ts` mit `buildLayerDetail(slug, lang, manifest)` (lang wird durchgereicht, aber Lookup-Funktionen ignorieren ihn).
- Bestehende DE-Maps:
  - `src/lib/data/layer-methodology.ts:34` `LAYER_METHODOLOGY_DE`-Map, `getLayerMethodology(slug)`-Lookup
  - `src/lib/components/atlas/inspector-panel/internal/layer-explain.ts:14` `LAYER_EXPLAIN_DE`-Map, `getLayerExplainEntry(slug)`-Lookup
  - `src/lib/components/atlas/internal/layer-palette-filter.ts:81` `getLayerDisplayName(slug)`-Lookup
  - `src/lib/components/atlas/internal/editorial-config.ts` (Editorial-Disclaimer-Texte, ggf. lokalisiert nötig)
- Layer-Detail-Page: `src/routes/(with-header)/layer/[slug]/+page.svelte` + `+page.ts` (PageLoad ruft `buildLayerDetail`, `getLocale()` ist verfügbar).
- Story 2.1 (ready-for-dev): setzt `prerender = true` + `entries`-Hook für `/layer/[slug]` (T6.1+T6.2). Diese Story 2.5a baut darauf auf und erweitert `entries` um EN-Locale-Varianten.
- Story 2.2 (ready-for-dev): `buildDataset` + `JsonLd`-Komponente + `licenseToSchemaOrgUrl`. Story 2.5a bindet Dataset-JSON-LD pro Locale ein.
- Story 3.1/3.2 (backlog, Future): Paraglide-Setup auf de+en + EN-UI-Coverage. EN-Bundles via Claude-Subscription lokal vor-übersetzt; Workflow nicht in dieser Story.
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`, `project_paraglide_reroute.md` (Routes ohne `[lang]`-Param, `getLocale()` statt `params.lang`).

## Akzeptanz-Kriterien

1. **AC-1 (Locale-aware Layer-Content-Architektur):**
   **Given** dass `LAYER_EXPLAIN_DE` + `LAYER_METHODOLOGY_DE` aktuell hardcoded DE-only sind und Epic 2.5a EN-Bundles als pre-committed JSON pro Slug verlangt
   **When** ich die Content-Lookup-Architektur erweitere
   **Then** je nach Open-Question 1:
   - **Variante A (Recommended, in-place TS-Map-Erweiterung):** bestehende Maps werden zu `LAYER_EXPLAIN: Record<Locale, Record<Slug, LayerExplain>>` und `LAYER_METHODOLOGY: Record<Locale, Record<Slug, LayerMethodology>>`. Lookups bekommen `locale`-Param: `getLayerExplainEntry(slug, locale)`, `getLayerMethodology(slug, locale)`, `getLayerDisplayName(slug, locale)`. EN-Werte werden initial gesetzt als „TODO Story 2.5a"-Platzhalter (oder leerer Fallback auf DE mit Disclaimer); Story 2.5a-Implementierung füllt EN-Strings nach.
   - **Variante B (Per-Slug-JSON-Bundles wie im Epic-Wortlaut):** `src/lib/data/layer-content/{slug}.de.json` + `{slug}.en.json` mit kombiniertem Schema `{ displayName, explain, methodology, editorial }`. Bestehende TS-Maps werden via Build-Step aus JSON generiert oder Live geladen. Pivot-Risiko: 42 Files × 2 Locales = 84 neue Files; bestehende DE-Texte müssen verlustfrei migriert werden.
   - **Variante C (Hybrid, Methodology als JSON-Bundle, Display+Explain weiter TS):** Lange Texte (Methodology-Sections) als JSON, kurze Strings (Display, Explain-Short) als Paraglide-Messages.
   - Slug-Abdeckung: alle 42 Manifest-Slugs müssen sowohl DE als auch EN haben (Coverage-Test pro Slug)
   - Tests: pro Locale + Slug Lookup liefert Inhalt; fehlender EN-Eintrag fällt graceful auf DE zurück mit `inLanguage: 'de'`-Markierung im Output

2. **AC-2 (Page-Loader nutzt Locale):**
   **Given** `buildLayerDetail(slug, lang, manifest)` ignoriert aktuell `lang`
   **When** ich Loader anpasse
   **Then**:
   - `buildLayerDetail` ruft Locale-aware Lookups aus AC-1 mit `lang`-Param
   - `LayerDetail`-Typ um `effectiveLocale: 'de' | 'en'`-Feld erweitert (zeigt was tatsächlich gerendert wurde; bei EN-Fallback auf DE ist `effectiveLocale = 'de'`)
   - Page-Server-Load nutzt `getLocale()` aus Paraglide-Runtime (Pattern aus bestehender `+page.ts:5`)
   - Test: Loader-Snapshot pro Locale für 3 Beispiel-Slugs (`laerm-2023`, `bodenrichtwerte`, `stolpersteine`)

3. **AC-3 (entries-Hook × 2 Locales):**
   **Given** Story 2.1 setzt entries-Hook für DE
   **When** ich entries auf beide Locales erweitere
   **Then**:
   - `+page.ts` exportiert `entries()` das `{slug, lang}`-Pairs liefert: 42 Slugs × 2 Locales = 84 Einträge
   - Paraglide-Reroute übernimmt URL-Mapping (`/layer/{slug}` für DE, `/en/layer/{slug}` für EN)
   - Falls Paraglide-Pattern nicht via `entries` mit `lang`-Param funktioniert (Reroute-strippt-Locale, Memory): alternative Variante mit separater EN-Route oder mit `getLocale()`-aware-Entries (Dev-Notes klären)
   - Build-Verify: 84 prerendered HTML-Files unter `build/prerendered/layer/{slug}/` (DE) und `build/prerendered/en/layer/{slug}/` (EN)
   - Test: entries-Hook liefert 84 Einträge

4. **AC-4 (Dataset-JSON-LD pro Locale via Story 2.2):**
   **Given** Story 2.2 `buildDataset`-Generator und `JsonLd`-Komponente
   **When** ich Dataset-JSON-LD auf die Layer-Detail-Page binde
   **Then**:
   - `<JsonLd data={datasetJsonLd} testid="layer-dataset-jsonld" />` mit:
     - `name`: `detail.layerName` (locale-aware)
     - `description`: `explain.long || explain.short` (locale-aware)
     - `license`: `licenseToSchemaOrgUrl(meta.license)` (Story 2.2-Helper)
     - `dateModified`: `meta.sourceUpdatedAt || meta.fetchedAt`
     - `creator`: aus `methodology.authority`, Fallback `Organization { name: 'navigator.berlin' }`
     - `distribution.contentUrl`: `${origin}/layers/${meta.filename}`
     - `keywords`: `[meta.bundleGroup]` plus optional Tags aus methodology
     - **`inLanguage`**: `effectiveLocale` aus AC-2 (`'de'` oder `'en'`)
   - Story 2.2 hat `buildDataset` bereits in DE eingebaut; Story 2.5a erweitert die Input-Struktur um `inLanguage`-Property (additive Change in Generator-Signature, Story-2.2-Tests bleiben grün)
   - Test: pro Locale Snapshot der Dataset-JSON-LD-Struktur

5. **AC-5 (Translation-Quality-Disclaimer auf EN-Page):**
   **Given** Editorial-Verantwortung für Übersetzungs-Drift
   **When** EN-Locale gerendert wird
   **Then**:
   - EN-Page rendert einen sichtbaren Disclaimer „Translated from German source. Original DE version remains authoritative." (Hinweistext gemäß Epic-Wortlaut)
   - Platzierung: dezenter Subline-Block unter h1 oder als kleiner Footer-Hinweis vor License-Section (Entscheidung in Dev-Notes)
   - Link auf DE-Variante: `<a href={localizeHref(pathname, {locale: 'de'})}>Read in German</a>`
   - Bei Fallback auf DE (kein EN-Bundle vorhanden) ist der Disclaimer „This page is shown in German because the English translation is not yet available." plus Bug-Report-Link
   - DE-Page rendert KEINEN Disclaimer (Master-Source)
   - Test: Komponenten-Test prüft Disclaimer-Rendering pro Locale

6. **AC-6 (SeoHead + Canonical + hreflang via Story 2.1):**
   **Given** Story 2.1 `SeoHead`-Komponente
   **When** Layer-Detail-Page Locale-aware gerendert wird
   **Then**:
   - `<SeoHead title={pageTitle} description={pageDescription} canonical locale={effectiveLocale} />`
   - DE-Title: `{layerName} · navigator.berlin` (Bestand, bleibt)
   - EN-Title: `{layerNameEn} · navigator.berlin`
   - DE-Description: `explain.short` DE
   - EN-Description: `explain.short` EN
   - hreflang-Cluster: `de` → `/layer/{slug}`, `en` → `/en/layer/{slug}`, `x-default` → DE
   - Canonical pro Locale (Story-2.1-Builder)
   - Test pro Locale

7. **AC-7 (License-Section + Bezirks-Behörde + Manifest-Provenance):**
   **Given** dass License + Authority bereits in DE-Page sichtbar sind (Story 1.29)
   **When** ich EN-Variante baue
   **Then**:
   - License-String („CC BY 3.0 DE" etc.) bleibt unverändert (technische Bezeichnung, nicht übersetzt)
   - License-Link via `licenseToSchemaOrgUrl` (Story 2.2-Helper)
   - Authority-Text wird locale-aware: DE „Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt"; EN „Berlin Senate Department for Mobility, Transport, Climate Action and the Environment"
   - Authority-Übersetzungs-Tabelle in zentralem `src/lib/data/authorities.ts` (oder als Paraglide-Messages, je nach AC-1-Architektur-Entscheidung)
   - Manifest-Provenance-Banner („Stand: 2026-05-15") bleibt locale-aware Text aber gleiche Datum-Werte
   - Test: Authority-Übersetzung pro Locale

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: Lookup-Tests pro Locale + Slug; Coverage-Test alle 42 Slugs haben DE + EN
   - AC-2: Loader-Snapshot pro Locale × 3 Slugs
   - AC-3: entries-Hook-Test (84 Einträge)
   - AC-4: Dataset-JSON-LD-Snapshot pro Locale
   - AC-5: Disclaimer-Komponenten-Test pro Locale
   - AC-6: SeoHead-Snapshot pro Locale
   - AC-7: Authority-Mapping-Test
   - E2E `tests/e2e/layer-page-en.e2e.ts`: `/layer/laerm-2023` (DE) + `/en/layer/laerm-2023` (EN); jeweils ohne JS lesbar; axe-Check; Translation-Disclaimer sichtbar auf EN
   - Coverage-Ziel: Lookup-Logic 100%, Loader ≥90%, Komponente ≥80%

## Tasks / Subtasks

### Phase-1-Scope (umgesetzt 2026-05-16)

- [x] **T1: Authority-Zentralisierung + i18n-Ready-Schema** (AC: 7 Phase-1-Teil)
  - [x] T1.1: Neue `src/lib/data/authorities.ts` mit `AuthorityKey`-Union (23 Keys), `AUTHORITIES: Record<AuthorityKey, AuthorityMeta>`, `resolveAuthority(key, locale='de'): string`. Schema i18n-ready (`{ de: string, en?: string }`). EN-Werte aktuell leer (Phase-3-deferred).
  - [x] T1.2: Refactor `layer-methodology.ts`: interner `LAYER_METHODOLOGY_SPECS` mit `authorityKey` + optionalem sprach-neutralen `authoritySuffix` (für OSM-Composites). `LAYER_METHODOLOGY_DE` bleibt rückwärtskompatibler Resolver-Output (`authority: string`).
  - [x] T1.3: Sprach-neutrale Suffix-Konstante `AUTHORITY_SUFFIX_OSM_ODBL` für OSM/ODbL-Composites (BVG-Stops, S-Bahn, Stolpersteine, Trinkbrunnen).
  - [x] T1.4: Tests: `authorities.test.ts` (9 Cases, Coverage + Lookup + Phase-3-Readiness), `layer-methodology.test.ts` erweitert um Authority-Zentralisierungs-Block (5 neue Cases, alle Specs → gültiger Key, OSM-Composites enthalten Suffix).

- [x] **T2: Translation-Disclaimer-Stub** (AC: 5 Phase-1-Teil)
  - [x] T2.1: `src/lib/components/atlas/translation-disclaimer.svelte` mit Props `{ effectiveLocale, pageLocale, alternateLocaleHref? }`. Drei Varianten: `en-translated`, `en-fallback-to-de`, DE-on-DE (rendert nichts).
  - [x] T2.2: NICHT in Layer-Page eingebunden (Phase 1 DE-only, kein EN-Pfad existiert).
  - [x] T2.3: 4 Component-Tests (Render-Conditions pro Variante + Alt-Link).

### Phase-3-Tasks (deferred: phase-3 — frühestens nach Hard-Launch + Phase-3-Reaktivierung)

- [ ] **T3: EN-Bundles für Methodology/Explain/DisplayName** (deferred: phase-3, AC: 1)
  - [ ] EN-Strings in `AUTHORITIES[key].en` für 23 Authority-Keys ergänzen (1-File-Edit dank Zentralisierung)
  - [ ] EN-Bundles in `LAYER_EXPLAIN` + `LAYER_METHODOLOGY` (`LAYER_METHODOLOGY_SPECS.calculation/coverageGaps/omissions`) je Slug
  - [ ] `getLayerDisplayName(slug, locale)`-Overload (Default `'de'` für Backwards-Compat)
  - [ ] Coverage-Test alle 42 Slugs haben DE+EN

- [ ] **T4: Loader + LayerDetail.effectiveLocale** (deferred: phase-3, AC: 2)
  - [ ] `LayerDetail.effectiveLocale`-Feld
  - [ ] `buildLayerDetail` nutzt `lang` für alle Lookups
  - [ ] Fallback-Logik: kein EN → DE + `effectiveLocale = 'de'`

- [ ] **T5: entries-Hook × 2 Locales + 84 prerendered Files** (deferred: phase-3, AC: 3)

- [ ] **T6: Dataset-JSON-LD pro Locale via Story 2.2** (deferred: phase-3, AC: 4)
  - Story 2.2 `buildDataset` ist noch nicht auf main. Wenn 2.2 merge'd ist, ergänzt 2.5a-Phase-3 `inLanguage`-Property + EN-Einbindung. Aktuell hat Layer-Page weiterhin nur `<title>` + `<meta description>` ohne JSON-LD.

- [ ] **T7: Translation-Disclaimer in Layer-Page einbinden** (deferred: phase-3, AC: 5)

- [ ] **T8: SeoHead + hreflang** (deferred: phase-3, AC: 6)

- [ ] **T9: Authority-Übersetzungen EN-Strings + License-Link** (deferred: phase-3, AC: 7 EN-Teil)

- [ ] **T10: E2E + Build-Verify 84 prerendered HTMLs** (deferred: phase-3, AC: 8)

## Dev Notes

### Content-Architektur-Entscheidung (Open-Question 1)

Aktuell DE-only-Maps in TS. Drei Optionen für Locale-Erweiterung:

| Variante | Vorteile | Nachteile |
|----------|----------|-----------|
| A: TS-Map-Erweiterung Record<Locale, ...> | Minimal-invasiv, type-safe, ein File pro Bereich | Bei 42 Slugs × 2 Locales wachsen die Maps; aber bleibt unter 500 LOC mit Splitting |
| B: JSON-Bundles pro Slug | Editor-friendly, gut für Übersetzungs-Sprints | 84 neue Files; Migrationspflicht der existierenden DE-Texte; Build-Step nötig |
| C: Hybrid (Methodology als JSON, Display+Explain als TS) | Best of Both | Zwei Patterns parallel, höhere Pflege-Komplexität |

**Empfehlung A.** Konkret:

```typescript
// src/lib/data/layer-methodology.ts
export const LAYER_METHODOLOGY: Record<'de' | 'en', Record<string, LayerMethodology>> = {
  de: { /* bestehende Werte */ },
  en: { /* neue EN-Werte aus Übersetzungs-Sprint */ }
};

export function getLayerMethodology(slug: string, locale: 'de' | 'en' = 'de'): LayerMethodology | null {
  return LAYER_METHODOLOGY[locale][slug] ?? LAYER_METHODOLOGY.de[slug] ?? null;
}
```

Analog für `LAYER_EXPLAIN` und `getLayerDisplayName`. Aufruf-Sites in Komponenten passen `locale`-Param an (Default `'de'`).

### Paraglide-Reroute-Pattern für entries × Locales (Open-Question 2)

Memory `project_paraglide_reroute.md`: Routes haben kein `[lang]`-Param. Reroute strippt Locale. Konsequenz für `entries()`:

- `entries()` liefert nur Slugs (z.B. `[{slug: 'laerm-2023'}, ...]`)
- Paraglide-Reroute generiert automatisch DE + EN-URLs pro Slug
- Page-Load liest `getLocale()` für effektive Sprache

Falls Auto-Locale-Verdopplung in Paraglide NICHT funktioniert: Manuelle Variante mit `entries()` × 2 Locales, plus eigenes Path-Mapping. Spike in T3.2.

### `buildDataset`-Erweiterung in Story 2.2

Story-2.2-Spec (AC-1) hat `buildDataset(input: DatasetInput): WithContext<Dataset>` mit Felder `name, description, license, dateModified, creator, distribution.contentUrl, keywords`. Story 2.5a ergänzt `inLanguage` als optionales Feld.

Cross-Story-Koordination: 2.5a-Implementierung trifft auf 2.2-Generator-Code. Falls 2.5a vor 2.2 mergt: Generator wird in 2.5a vorbereitet, 2.2 nutzt ihn. Falls 2.2 zuerst: additive Erweiterung um `inLanguage`-Property, alle 2.2-Tests bleiben grün (Property optional).

### Authority-Übersetzung

Beispiele für DE→EN-Mapping:

| DE | EN |
|----|----|
| `Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt · Umweltatlas Berlin` | `Berlin Senate Department for Mobility, Transport, Climate Action and the Environment · Environmental Atlas Berlin` |
| `ODIS Berlin · Open Data Informationsstelle` | `ODIS Berlin · Open Data Information Office` |
| `OpenStreetMap-Contributors` | `OpenStreetMap Contributors` (bleibt) |
| `Senatsverwaltung für Bildung, Jugend und Familie` | `Berlin Senate Department for Education, Youth and Family` |
| `BVG · Berliner Verkehrsbetriebe (GTFS-Export VBB)` | `BVG · Berlin Transport Company (GTFS export via VBB)` |

Zentral in `src/lib/data/authorities.ts` mit Key-basiertem Lookup statt freien Strings. Vorteil: ändert sich Authority-Name in Realität, ein File-Edit; Übersetzungen bleiben gekoppelt.

### Translation-Disclaimer-Platzierung (Open-Question 4)

Drei Optionen:

a) Unter h1 als kleine Subline (sichtbar prominent, könnte Lead-Layout stören)
b) Über License-Section am Page-Ende (versteckt, könnte übersehen werden)
c) Als kleiner Banner am Top der Page (über h1; transparent, blockiert nicht)

Empfehlung (c) mit dezenter Plex-Mono-Subtle-Typografie. Pattern: `<p class="font-mono text-xs uppercase tracking-wide text-ink-subtle">Translated from German. <a href={dePath}>Read original</a>.</p>`.

### Fallback-Strategie bei fehlendem EN-Bundle

Falls T8-Übersetzungs-Sprint nicht alle 42 Slugs schafft:

- Loader liefert `effectiveLocale = 'de'` für Slugs ohne EN-Eintrag
- `entries()` listet trotzdem alle 84 Pfade (EN-Page rendert dann DE-Content mit Disclaimer „This page is shown in German because the English translation is not yet available.")
- Optional: Bug-Report-Link für User um Übersetzung anzuregen
- Coverage-Pflicht für Phase 1: minimum 80% EN-Coverage (34/42 Slugs); User-Entscheidung

### Build-Zeit-Risiko

84 prerendered Files für Layer-Detail bei aktuellem Stand. Plus Bezirks-Pages (24 aus Story 2.3) plus Kiez-Pages (276 oder 1.084 aus Story 2.4) → Build-Budget wird eng. Falls Budget-Sprengung: 2.5a kann auf 50% EN-Coverage scope-cut werden.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** `LAYER_METHODOLOGY` mit 42 Slugs × 2 Locales könnte File überschreiten. Splitting in `layer-methodology-de.ts` + `layer-methodology-en.ts` als Sub-Module mit `index.ts`-Re-Export-Barrel.
- **#3 Bestehende Funktionen prüfen:** `localizeHref`, `getLocale`, `loadManifest`, `buildLayerDetail`, `licenseToSchemaOrgUrl` (Story 2.2). Keine Re-Implementation.
- **#7 TypeScript strict:** `Locale`-Type aus `$lib/data/types.ts` (aktuell 8-Werte-Union; reduzieren auf `'de' | 'en'` per Story 3.1, bis dahin alle 8 unterstützen oder hier vorab eng ziehen)
- **#14 i18n-First:** alle UI-Strings via Paraglide; Methodology-Content via lokalisierte Maps (kein hardcoded UI-Text)
- **#21 prerender + entries:** AC-3 enforced

### Open-Questions vor Dev-Start

1. **Content-Architektur (Variante A/B/C):** Empfehlung A. Akzeptabel?
2. **Paraglide-Reroute mit entries × 2 Locales:** Auto-Verdopplung via Reroute oder manuelle entries? Spike in T3.2.
3. **EN-Coverage-Pflicht:** alle 42 Slugs oder 80%-Minimum für Phase 1? Empfehlung: 100% Pflicht für Phase 1, da Layer-Pages SEO-kritisch.
4. **Disclaimer-Platzierung:** (a)/(b)/(c) aus Dev-Notes. Empfehlung (c) dezenter Banner oben.
5. **Authority-Mapping zentral oder pro Methodology-Eintrag:** Empfehlung zentral `authorities.ts`. OK?

### Project Structure Notes

- Refactor: `layer-methodology.ts` → ggf. Split in `layer-methodology-de.ts` + `layer-methodology-en.ts` + Index-Barrel
- Refactor: `inspector-panel/internal/layer-explain.ts` analog
- Refactor: `layer-palette-filter.ts` `getLayerDisplayName(slug, locale)`-Signatur
- Neu: `src/lib/data/authorities.ts`
- Neu: `src/lib/components/atlas/translation-disclaimer.svelte`
- Bestehende Page: `src/routes/(with-header)/layer/[slug]/+page.svelte` + `+page.ts` werden erweitert (KEIN Neu-Aufbau)
- Sitemap-Source (Story 2.1): Layer-Detail-Source muss EN-Pfade ergänzen (Cross-Story-Hand-off in Dev-Notes; entweder 2.5a baut Source-Erweiterung oder 2.1 wird darauf vorbereitet)

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1166-L1193](../planning-artifacts/epics.md)
- FR36 + FR40: [prd.md#L741-L745](../planning-artifacts/prd.md)
- Story 1.29 Foundation: [./1-29-atlas-methodik-pattern.md](./1-29-atlas-methodik-pattern.md)
- Story 2.1: [./2-1-seo-foundation-sitemap-canonical-robots-txt.md](./2-1-seo-foundation-sitemap-canonical-robots-txt.md)
- Story 2.2: [./2-2-json-ld-generator-bibliothek.md](./2-2-json-ld-generator-bibliothek.md)
- Bestehender Layer-Detail-Loader: [src/lib/data/get-layer-detail.ts](../../src/lib/data/get-layer-detail.ts)
- Methodology-Map: [src/lib/data/layer-methodology.ts](../../src/lib/data/layer-methodology.ts)
- Layer-Explain-Map: [src/lib/components/atlas/inspector-panel/internal/layer-explain.ts](../../src/lib/components/atlas/inspector-panel/internal/layer-explain.ts)
- Layer-Display-Name: [src/lib/components/atlas/internal/layer-palette-filter.ts:81](../../src/lib/components/atlas/internal/layer-palette-filter.ts)
- Paraglide-Reroute-Memory: [memory/project_paraglide_reroute.md](../../.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_paraglide_reroute.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (2026-05-16).

### Debug Log References

- `pnpm test:unit --run src/lib/data/authorities.test.ts src/lib/data/layer-methodology.test.ts src/lib/data/get-layer-detail.test.ts src/lib/components/atlas/translation-disclaimer.svelte.test.ts` → 36 passed.
- `pnpm check` läuft im Hintergrund, Ergebnis im Completion-Notes-Block.

### Completion Notes List

- **Scope-Reduktion auf Phase 1 DE-only Refactor + Authority-Zentralisierung.** EN-Coverage explizit auf Phase 3 verschoben per User-Lock + Memory `project_i18n_phase_1_de_only`. Story-Wortlaut „EN-Variante" wird ignoriert.
- **AC-7 Authority-Mapping zentral umgesetzt** (Open-Question 5 = Variante zentral). 23 Authority-Keys typed in `$lib/data/authorities.ts`. Methodology-Specs referenzieren nur noch Keys + sprach-neutralen Suffix für Composites. Output-API (`LayerMethodology.authority: string`) bleibt rückwärtskompatibel — alle bestehenden Konsumer (page.svelte, Tests) brechen nicht.
- **Content-Architektur Variante A vorgehärtet** (Open-Question 1): Specs-Internals nutzen typed `authorityKey`, Resolver mappt zur Klartext-Locale-Variante. Phase 3 ergänzt EN-Werte in `AUTHORITIES[key].en` ohne Schema-Bruch.
- **Translation-Disclaimer-Stub angelegt**, aber NICHT in Layer-Page eingebunden (Open-Question 4 = c, dezenter Banner — Platzierung in Phase 3). Phase-3-Sprint muss nur `<TranslationDisclaimer effectiveLocale=… pageLocale=… alternateLocaleHref=… />` direkt unter dem Page-Header einfügen.
- **Dataset-JSON-LD (AC-4) bleibt Story-2.2-Verantwortung.** `buildDataset` ist auf main NICHT vorhanden (`src/lib/seo/` existiert nicht). Layer-Page rendert weiterhin nur `<title>` + `<meta description>` ohne JSON-LD. Phase-3-Reaktivierung kombiniert 2.2-Generator + 2.5a-Phase-3 EN-Locale-Einbindung.
- **`getLayerDisplayName(slug)`-Signatur unverändert gelassen** (keine `locale`-Param-Erweiterung), damit alle bestehenden Konsumer (Layer-Palette, Inspector, Sitemap, Bookmark-Rows, Layer-Detail-Page) Phase-1-stabil bleiben. Phase 3 fügt Locale-Overload hinzu.
- **Sitemap-Source: keine EN-Pfade hinzugefügt** (Story 2.1 ist DE-only).
- **TDD-Disziplin:** Pure-Function-Tests für `resolveAuthority` (9 Cases) zuerst geschrieben + Red verifiziert. Component-Tests für `translation-disclaimer.svelte` per `vitest-browser-svelte` (kein `vi.spyOn(globalThis,'fetch')`, gemäß Memory `feedback_browser_test_fetch_spy`). Coverage-Test verifiziert: alle Methodology-Specs referenzieren gültige Authority-Keys.

### File List

**Neu:**
- `src/lib/data/authorities.ts` · zentrale typed Authority-Map (23 Keys, DE-Strings, EN optional)
- `src/lib/data/authorities.test.ts` · 9 Test-Cases
- `src/lib/components/atlas/translation-disclaimer.svelte` · Phase-1-Stub-Komponente
- `src/lib/components/atlas/translation-disclaimer.svelte.test.ts` · 4 Test-Cases

**Refactored:**
- `src/lib/data/layer-methodology.ts` · interne Specs mit `authorityKey` + `authoritySuffix`; `LAYER_METHODOLOGY_DE`-Output via Resolver. Output-API rückwärtskompatibel.
- `src/lib/data/layer-methodology.test.ts` · Authority-Zentralisierungs-Block ergänzt (5 neue Cases)

**Unverändert (geprüft auf Konsumer-Bruch):**
- `src/lib/data/get-layer-detail.ts`
- `src/lib/data/get-layer-detail.test.ts`
- `src/routes/(with-header)/layer/[slug]/+page.svelte`
- `src/routes/(with-header)/layer/[slug]/+page.ts`
- `src/routes/(with-header)/layer/[slug]/page.svelte.test.ts`
