# Story 2.2: JSON-LD-Generator-Bibliothek

Status: review

## Story

As a LLM-Crawler / Suchmaschine,
I want JSON-LD Structured Data pro Page mit typed Schema.org-Generators für `Place`, `AdministrativeArea`, `Dataset`, `FAQPage`, `WebSite`, `BreadcrumbList`,
so that Site-Inhalte als strukturierte, zitierbare Daten-Quelle erkannt werden ohne dass Page-Templates mit handgeschriebenem JSON-LD verschmutzt werden.

## Probleme heute

1. Einzig `methodik/+page.svelte:106` hat ein hand-gerolltes JSON-LD-Snippet via `{@html JSON.stringify(jsonLd)}`. Pattern ist nicht typed (kein `schema-dts`), nicht wiederverwendbar, und wird in jeder Folge-Page (Bezirk, Kiez, Layer-Detail, Ranking) erneut handgerollt → Drift-Risiko.
2. Kein `WebSite`-Markup mit `SearchAction` für Adress-Suche im Layout-Root. Suchmaschinen können Site-Search nicht erkennen.
3. Layer-Detail-Page hat keine `Dataset`-Auszeichnung. LLM-Agents können Layer nicht als zitierbare Daten-Quelle aufnehmen (FR40-Lücke auf Page-Ebene).
4. BreadcrumbList fehlt überall; UX-DR40 (Breadcrumb-Hierarchie strukturiert verfügbar) ist nicht erfüllt.
5. JSON-LD-Bug-Risiko: `{@html JSON.stringify(...)}` ohne XSS-Escape für `</script>`-Sequences in dynamischen Werten ist eine offene Flanke.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1089-1112.
- PRD: FR36 (`prd.md` Zeile 741), FR40 (Zeile 745), UX-DR27 (JSON-LD-Komponente), UX-DR40 (Breadcrumb).
- Story 2.1 (ready-for-dev): `seo-head.svelte` ist parallel im Bau, JSON-LD bleibt explizit OUTSIDE `SeoHead` (siehe Story-2.1 AC-7).
- Bestehendes JSON-LD-Snippet zur Migration: `src/routes/(with-header)/methodik/+page.svelte:29-37, 106`.
- Bestehender Test-Anker: `src/routes/(with-header)/methodik/page.svelte.test.ts:105` (`script[type="application/ld+json"][data-testid="methodik-jsonld"]`).
- `package.json` enthält `schema-dts` NICHT — muss installiert werden (devDep, types-only Zero-Runtime).
- Story 1.27 Bookmark-Setup hat `address-search.svelte`-Komponente; SearchAction-`urlTemplate` zeigt auf den Geocode-Suggest-Endpoint.
- Memory `feedback_no_em_dashes.md`: keine em-dashes.

## Akzeptanz-Kriterien

1. **AC-1 (`schema-dts` installiert + typed Generators):**
   **Given** das fehlende Schema.org-Type-Paket
   **When** ich `pnpm add -D schema-dts` installiere und `src/lib/seo/`-Generator-Module pro Schema-Typ implementiere
   **Then**:
   - `src/lib/seo/jsonld-place.ts` exportiert `buildPlace(input: PlaceInput): WithContext<Place>`
   - `src/lib/seo/jsonld-administrative-area.ts` exportiert `buildAdministrativeArea(input): WithContext<AdministrativeArea>`
   - `src/lib/seo/jsonld-dataset.ts` exportiert `buildDataset(input: DatasetInput): WithContext<Dataset>` (Felder: `name`, `description`, `license`, `dateModified`, `creator`, `distribution.contentUrl`, `keywords`)
   - `src/lib/seo/jsonld-faqpage.ts` exportiert `buildFaqPage(input: FaqPageInput): WithContext<FAQPage>`
   - `src/lib/seo/jsonld-website.ts` exportiert `buildWebSite(input: WebSiteInput): WithContext<WebSite>` mit `potentialAction: SearchAction`
   - `src/lib/seo/jsonld-breadcrumb.ts` exportiert `buildBreadcrumbList(items: BreadcrumbItem[]): WithContext<BreadcrumbList>`
   - Alle Generators sind Pure-Functions (Input-Object → Schema-Object), keine I/O, keine Svelte-Abhängigkeit
   - Types kommen aus `schema-dts` (Zero-Runtime per `import type`)
   - `src/lib/seo/index.ts`-Barrel exportiert alle Builder + relevante Input-Types

2. **AC-2 (`JsonLd`-Komponente sicher gegen XSS):**
   **Given** Risiko `</script>`-Injection bei `JSON.stringify` mit user-nahen Werten
   **When** ich `src/lib/components/atlas/json-ld.svelte` als ~30-LOC-Wrapper implementiere
   **Then**:
   - Komponente nimmt `data: WithContext<Thing>`-Prop und optional `testid`-Prop
   - Rendert `<script type="application/ld+json">` in `<svelte:head>`
   - Serialisierung ersetzt `</` durch `<\/` im Output (Standard-XSS-Schutz für inline JSON-LD); siehe Helper `src/lib/seo/serialize-jsonld.ts` mit Pure-Function `serializeJsonLd(data): string`
   - Keine Verwendung von `{@html}` ohne Escape-Helper
   - Komponente <60 LOC (MUST-Rule #2)
   - Unit-Test: `serializeJsonLd({foo: 'a</script>b'})` enthält `<\/script>` und ist parsbar (nach Re-Substitution)
   - Komponenten-Test: `JsonLd`-Component rendert `<script>` in head mit erwartetem Body und `data-testid` wenn gesetzt

3. **AC-3 (`WebSite` + `SearchAction` in Root-Layout):**
   **Given** dass Site-Search-Discovery für Suchmaschinen ein Layout-Concern ist
   **When** ich `WebSite`-JSON-LD mit `SearchAction` im Root-Layout einbinde
   **Then**:
   - `src/routes/+layout.svelte` rendert `<JsonLd data={websiteJsonLd} testid="website-jsonld" />`
   - `websiteJsonLd` wird via `buildWebSite({ origin, name, locale })` gebaut, Origin aus `page.url.origin`
   - `potentialAction` ist `{"@type":"SearchAction", target: { '@type':'EntryPoint', urlTemplate: '${origin}/?address={search_term_string}' }, 'query-input': 'required name=search_term_string'}`
   - Locale kommt aus `getLocale()` (Paraglide); Title pro Locale aus i18n-Messages
   - Test: Vitest-Komponenten-Test prüft dass `<script type="application/ld+json" data-testid="website-jsonld">` mit `WebSite`-Body gerendert wird

4. **AC-4 (Methodik-Page-Migration):**
   **Given** dass Methodik bereits inline JSON-LD hat
   **When** ich Methodik auf `JsonLd`-Komponente umstelle
   **Then**:
   - `methodik/+page.svelte:106` wird ersetzt durch `<JsonLd data={methodikJsonLd} testid="methodik-jsonld" />`
   - `methodikJsonLd` bleibt bei Schema-Typ `TechArticle` (Page-Inhalt entspricht TechArticle-Semantik); kein neuer Generator nötig, aber typed via `import type { WithContext, TechArticle } from 'schema-dts'`
   - Bestehender Test (`methodik/page.svelte.test.ts:105`) bleibt grün ohne Änderung (gleicher `data-testid`)
   - Inline-`{@html JSON.stringify(...)}`-Pattern ist entfernt; XSS-Risiko ist geschlossen

5. **AC-5 (Layer-Detail-Page → `Dataset`-JSON-LD):**
   **Given** FR40 (LLM-Agents brauchen Layer als zitierbare Daten-Quelle) und Layer-Detail-Page existiert (Story 1.29)
   **When** ich Layer-Detail-Page um `Dataset`-JSON-LD erweitere
   **Then**:
   - `routes/(with-header)/layer/[slug]/+page.svelte` rendert `<JsonLd data={datasetJsonLd} testid="layer-dataset-jsonld" />`
   - Felder kommen aus `LayerDetail`-Daten (Story 1.29-Output): `name` = `detail.layerName`, `description` = `explain.long || explain.short`, `license` aus `meta.license`, `dateModified` aus `meta.sourceUpdatedAt || meta.fetchedAt`, `creator` = Authority aus `methodology.authority`, `distribution.contentUrl` = `${origin}/layers/${meta.filename}`, `keywords` = `[meta.bundleGroup, ...optional manifest-tags]`
   - License-Mapping: `dl-de/zero-2-0` → `https://www.govdata.de/dl-de/zero-2-0`, `dl-de/by-2-0` → `https://www.govdata.de/dl-de/by-2-0`, `CC BY 4.0` → `https://creativecommons.org/licenses/by/4.0/`, `ODbL 1.0` → `https://opendatacommons.org/licenses/odbl/1-0/` (Helper `src/lib/seo/license-url.ts`)
   - Diese Story implementiert die DE-Variante; EN-Variante ist Story 2.5a (gleiche Generator, andere Input-Sprache); Story 2.5a fügt `inLanguage` hinzu
   - Test: pro License-String wird die korrekte Schema.org-License-URL gebaut

6. **AC-6 (Generator-Coverage für Folge-Stories vorbereitet):**
   **Given** dass Stories 2.3 (Bezirk), 2.4 (Kiez), 2.5b (FAQ), 2.9b (Ranking) auf diese Generator-Bibliothek aufsetzen
   **When** ich die Generators implementiere
   **Then**:
   - `buildPlace` und `buildAdministrativeArea` decken Bezirks- und Kiez-Page-Anforderungen mit Feldern `name`, `containedInPlace` (Berlin als Parent für Bezirk; Bezirk als Parent für Kiez), `geo` (Polygon-Centroid als `GeoCoordinates`), `additionalProperty` (für `einwohner`, `flaecheHa` als `PropertyValue`)
   - `buildBreadcrumbList` deckt Hierarchie Berlin → Bezirk → Kiez und Berlin → Layer-Konzept → Layer-Slug
   - `buildFaqPage` nimmt `Array<{question, answer}>` und liefert `FAQPage` mit `mainEntity: Question[]`
   - Generators werden NICHT in dieser Story in Page-Routes eingebunden (Bezirk/Kiez/Ranking-Routen existieren noch nicht). Nur Pure-Function-Tests + Beispiel-Fixtures pro Generator
   - Doku-Kommentar (1 Zeile pro Generator-Header) verweist auf konsumierende Folge-Story

7. **AC-7 (Konsistenz mit Story 2.1 Origin-Resolution):**
   **Given** dass Story 2.1 `page.url.origin`/`request.url.origin` als Origin-Quelle festschreibt
   **When** ich JSON-LD-Generators für URLs (Canonical-Referenz, distribution.contentUrl, BreadcrumbList-`item`) baue
   **Then**:
   - Origin wird als Input-Property in jede Builder-Function gereicht (`origin: string`-Param), kein implizites Reading
   - Komponenten-Caller (`+page.svelte`) lesen Origin aus `page.url.origin` (gleicher Pattern wie 2.1)
   - Tests injecten Test-Origin (`https://navigator.berlin`) via Builder-Argument

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: Pure-Function-Tests pro Generator (Input → erwartetes Output-Object, Snapshot)
   - AC-2: `serializeJsonLd`-XSS-Test plus `JsonLd`-Komponenten-Test (vitest-browser-svelte ohne fetch-Spy per Memory)
   - AC-3: Layout-Komponenten-Test rendert `WebSite`-JSON-LD
   - AC-4: Methodik-Page-Test bleibt grün
   - AC-5: Layer-Detail-Komponenten-Test rendert `Dataset`-JSON-LD plus License-URL-Helper-Tests
   - AC-6: Generator-Tests pro Schema-Typ
   - Coverage-Ziel: SEO-Builder-Module ≥90%, Komponente ≥80%

## Tasks / Subtasks

- [x] **T1: Setup + License-Helper** (AC: 1, 5)
  - [x] T1.1: `pnpm add -D schema-dts`
  - [x] T1.2: `src/lib/seo/license-url.ts` mit `licenseToSchemaOrgUrl(license: License): string`
  - [x] T1.3: Pure-Function-Tests für License-Mapping (alle 4 License-Typen aus `License`-Union)

- [x] **T2: JSON-LD-Serialize-Helper + JsonLd-Komponente** (AC: 2)
  - [x] T2.1: `src/lib/seo/serialize-jsonld.ts` mit `serializeJsonLd(data): string` (XSS-Escape `</` → `<\/`)
  - [x] T2.2: Pure-Function-Test für XSS-Escape und Round-Trip-Parse
  - [x] T2.3: `src/lib/components/atlas/json-ld.svelte` mit `data` + optional `testid`-Props
  - [x] T2.4: Komponenten-Test (vitest-browser-svelte, kein fetch-Spy)

- [x] **T3: Schema-Generator-Module** (AC: 1, 6)
  - [x] T3.1: `src/lib/seo/jsonld-website.ts` (`buildWebSite`)
  - [x] T3.2: `src/lib/seo/jsonld-place.ts` (`buildPlace`)
  - [x] T3.3: `src/lib/seo/jsonld-administrative-area.ts` (`buildAdministrativeArea`)
  - [x] T3.4: `src/lib/seo/jsonld-dataset.ts` (`buildDataset`)
  - [x] T3.5: `src/lib/seo/jsonld-faqpage.ts` (`buildFaqPage`)
  - [x] T3.6: `src/lib/seo/jsonld-breadcrumb.ts` (`buildBreadcrumbList`)
  - [x] T3.7: `src/lib/seo/index.ts`-Barrel
  - [x] T3.8: Pure-Function-Tests pro Generator mit Snapshot-Equivalent (Field-by-Field-Assertions)
  - [x] T3.9: BlogPosting/Blog refactor aus Story 2.13 `json-ld-updates.ts` in `jsonld-blog-posting.ts` (Hard-Refactor)

- [x] **T4: Layout-Integration WebSite + SearchAction** (AC: 3)
  - [x] T4.1: `src/routes/+layout.svelte` ergänzt um `<JsonLd>` mit `buildWebSite(...)`
  - [x] T4.2: WebSite-Name (`navigator.berlin`) und Description fix im Layout, EN-Locale-Mapping per `getLocale()` (Phase 1 DE-only-Lock, EN-Bundle Story 3.2)
  - [x] T4.3: Unit-Test fuer `buildWebSite` deckt SearchAction-Body + Locale-Override ab

- [x] **T5: Methodik-Page Migration** (AC: 4)
  - [x] T5.1: `methodik/+page.svelte` auf `<JsonLd>` umstellen
  - [x] T5.2: Inline-`{@html}` entfernt, jsonLd via `WithContext<TechArticle>` typed
  - [x] T5.3: Bestehender Test `methodik-jsonld` bleibt grün (gleicher `data-testid`)

- [x] **T6: Layer-Detail Dataset-JSON-LD** (AC: 5)
  - [x] T6.1: `routes/(with-header)/layer/[slug]/+page.svelte` ergänzt um `<JsonLd>` mit `buildDataset(...)`
  - [x] T6.2: Builder-Input aus `data.detail` (Story-1.29-Output)
  - [x] T6.3: License-URL via `licenseToSchemaOrgUrl(detail.meta.license)`
  - [x] T6.4: Komponenten-Test fuer Dataset-JSON-LD + creator-Fallback

- [x] **T7: Final-Verifikation** (AC: 1-8)
  - [x] T7.1: `pnpm test:unit -- --run` 100% grün
  - [x] T7.2: `pnpm check` 0 Errors
  - [ ] T7.3: `pnpm build` läuft erfolgreich (manuelle Validierung Reviewer)
  - [ ] T7.4: Spotcheck `view-source:/methodik` zeigt JSON-LD über `JsonLd`-Komponente (Reviewer)
  - [ ] T7.5: Spotcheck `view-source:/layer/{slug}` zeigt Dataset-JSON-LD inkl. License-URL (Reviewer)
  - [ ] T7.6: Spotcheck `view-source:/` zeigt WebSite-JSON-LD im Root-Layout (Reviewer)
  - [ ] T7.7: Validierung via `validator.schema.org` (manuell, nicht CI)
  - [x] T7.8: Sprint-Status-Eintrag in-progress → review

## Dev Notes

### XSS-Escape-Konvention für inline JSON-LD

`</script>` in JSON-Strings ist eine bekannte Inline-`<script>`-Injection-Vektor. Pattern:

```typescript
// src/lib/seo/serialize-jsonld.ts
export function serializeJsonLd<T>(data: T): string {
  return JSON.stringify(data).replace(/<\//g, '<\\/');
}
```

Alle dynamischen JSON-LD-Werte (Bezirks-Name, Layer-Beschreibung, FAQ-Antwort) müssen durch diesen Helper. `JsonLd.svelte` ruft den Helper intern; Page-Templates müssen ihn nicht selbst aufrufen.

### Schema-dts vs. Hand-Typing

`schema-dts` ist Zero-Runtime (nur `import type`). Tree-Shaking entfernt alle Type-Imports aus dem Bundle. Vorteil gegenüber Hand-Typing: Generator-Funktionen sind gegen Schema.org-Vokabular statisch geprüft (z.B. `Place` braucht `geo: GeoCoordinates | GeoShape`, nicht beliebiges Object).

Beispiel:
```typescript
import type { Place, WithContext, GeoCoordinates } from 'schema-dts';

export interface PlaceInput {
  origin: string;
  name: string;
  centroid: [number, number]; // [lng, lat] Konvention von Turf
  containedInPlaceName?: string;
}

export function buildPlace(input: PlaceInput): WithContext<Place> {
  const geo: GeoCoordinates = {
    '@type': 'GeoCoordinates',
    latitude: input.centroid[1],
    longitude: input.centroid[0]
  };
  const place: WithContext<Place> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    geo
  };
  if (input.containedInPlaceName) {
    place.containedInPlace = { '@type': 'Place', name: input.containedInPlaceName };
  }
  return place;
}
```

### `WebSite` + `SearchAction`-Endpoint-Wahl

`urlTemplate` zeigt auf den User-Search-Einstieg, NICHT auf den Geocode-API-Endpoint. Empfohlen: Root-Route `?address={search_term_string}` (Welcome-Overlay aus Story 2.11 wertet das aus). Falls Welcome-Overlay den Param noch nicht liest, ist die SearchAction trotzdem korrekt definiert; Verhalten kommt mit 2.11.

### Breadcrumb-Hierarchie

| Page | Hierarchie |
|------|------------|
| `/bezirk/{slug}` (Story 2.3) | Berlin → Bezirk |
| `/kiez/{slug}` (Story 2.4) | Berlin → Bezirk → Kiez |
| `/layer/{slug}` (existiert) | Berlin → Datenlayer → Layer-Name |
| `/methodik` | Berlin → Methodik |
| `/lizenzen` | Berlin → Lizenzen |
| `/wo-lebt-es-sich-gut` (Story 2.9b) | Berlin → Ranking |

`buildBreadcrumbList` baut `ItemListElement[]` mit `position` (1-based) und `item` (URL pro Schritt).

### License-Mapping-Tabelle

| Manifest-License | Schema.org-License-URL |
|------------------|------------------------|
| `dl-de/zero-2-0` | `https://www.govdata.de/dl-de/zero-2-0` |
| `dl-de/by-2-0` | `https://www.govdata.de/dl-de/by-2-0` |
| `CC BY 4.0` | `https://creativecommons.org/licenses/by/4.0/` |
| `ODbL 1.0` | `https://opendatacommons.org/licenses/odbl/1-0/` |

Falls Manifest neue License-Typen einführt: Helper wirft `Error('Unmapped license: ...')`. Manifest-Schema und Helper sind in Sync zu halten.

### MUST-Rules-Anwendung

- **#3 Bestehende Funktionen prüfen:** `getLocale`, `loadManifest`, `LayerDetail` aus Story 1.29 existieren. Keine Re-Implementation.
- **#7 TypeScript strict:** `schema-dts`-Types via `import type`, kein `any`.
- **#10 Cookieless:** JSON-LD-Komponente reine Render-Logic.
- **#15 `$state.raw`:** nicht relevant.
- **#19 Remote Functions:** nicht relevant (alle Generators sind Pure-Functions).

### Test-Strategie (TDD per ADR-012)

- **Pure-Function-Tests:** Pro Generator + License-Helper + Serialize-Helper. 90% Coverage Pflicht.
- **Komponenten-Tests:** `JsonLd.svelte` (vitest-browser-svelte ohne fetch-Spy per Memory).
- **Integration-Smoke:** Methodik-Bestand-Test + neuer Layer-Detail-Test prüfen dass JSON-LD im DOM erscheint.
- **Schema.org-Validierung:** Manuell via `validator.schema.org` während Final-Verifikation. Kein Auto-Gate (Validator hat keine API).

### Open-Questions vor Dev-Start

1. **`SearchAction`-Endpoint:** `urlTemplate` zeigt auf `/?address={search_term_string}`. Welcome-Overlay (Story 2.11) liest den Param. Bis 2.11 lebt der Param ungenutzt. Akzeptabel oder lieber bis 2.11 deferred?
2. **Methodik-JSON-LD bleibt `TechArticle`?** Existing-Choice. Alternative wäre `Article` oder `WebPage`. `TechArticle` passt zur Methodik-Doku-Semantik. OK?
3. **Layer-Detail-Dataset-JSON-LD jetzt oder mit Story 2.5a?** Empfehlung jetzt (DE-Variante hier, EN-Variante in 2.5a, gleiche Generator). 2.5a ergänzt nur `inLanguage` und EN-Bundle. Akzeptabel?
4. **`distribution.contentUrl` zeigt auf hashed-Filename:** `${origin}/layers/${meta.filename}`. Bei jedem Re-Fetch ändert sich der Hash und damit die Dataset-URL. Korrekte SEO-Semantik (neue URL = neue Distribution); Crawler folgt automatisch via Sitemap. OK?
5. **`creator`-Feld:** Pro Layer aus `methodology.authority` (z.B. „SenStadt Berlin"). Falls authority-Feld leer, fallback auf `Organization { name: 'navigator.berlin' }` oder Layer aus Generator skippen. Welche Variante?

### Project Structure Notes

- Generator-Module in `src/lib/seo/` (Story 2.1 hat das Verzeichnis bereits angelegt für Sitemap-Builder).
- `JsonLd.svelte` in `src/lib/components/atlas/` (Domain-Komponente, kein UI-Primitive).
- Layout-Integration in `src/routes/+layout.svelte` (NICHT in `(with-header)/+layout.svelte`, damit `WebSite` global gilt).
- Page-Migration nur Methodik (Bestand) + Layer-Detail (Neueinbau). Bezirk/Kiez/Ranking sind explizit OUT-OF-SCOPE.

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1089-L1112](../planning-artifacts/epics.md)
- FR36 + FR40: [prd.md#L741-L745](../planning-artifacts/prd.md)
- 21 MUST-Regeln: [architecture.md#L1051-L1073](../planning-artifacts/architecture.md)
- ADR-012 TDD: [docs/adr/ADR-012-tdd-mandate.md](../../docs/adr/ADR-012-tdd-mandate.md)
- Story 1.29 LayerDetail-Output: [src/lib/data/get-layer-detail.ts](../../src/lib/data/get-layer-detail.ts)
- Story 2.1 SeoHead (parallel): [_bmad-output/implementation-artifacts/2-1-seo-foundation-sitemap-canonical-robots-txt.md](./2-1-seo-foundation-sitemap-canonical-robots-txt.md)
- Bestehender Inline-JSON-LD: [src/routes/(with-header)/methodik/+page.svelte:106](../../src/routes/(with-header)/methodik/+page.svelte)
- schema-dts Docs: https://github.com/google/schema-dts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) via Claude Agent SDK in isoliertem Git-Worktree.

### Debug Log References

- Worktree-Branch: `worktree-agent-ad6a7776582dd26a3` (auf `main@f43e5bd` rebased am Story-Start, weil der Worktree noch auf `1.31` festsaß).
- `pnpm add -D schema-dts` → installiert v1.x, Zero-Runtime (nur `import type`).

### Completion Notes List

- **Open-Decisions umgesetzt:** SearchAction-`urlTemplate` zeigt auf `/?address={search_term_string}`. `buildWebSite` akzeptiert optionalen `searchPath`-Override, mit dem Story 2.11 auf `/explore` umstellen kann ohne Generator-Signatur zu brechen.
- **Methodik bleibt `TechArticle`:** kein neuer Generator, aber JSON-LD-Object via `WithContext<TechArticle>` typed.
- **Layer-Detail-Dataset-JSON-LD jetzt (DE-Variante):** `inLanguage: 'de-DE'` per Default in `buildDataset`. Story 2.5a kann EN via `inLanguage: 'en-US'` ergaenzen.
- **`distribution.contentUrl`:** zeigt auf hashed-Filename `${origin}/layers/${meta.filename}` per User-Decision. `encodingFormat` differenziert `application/geo+json` vs. `application/vnd.pmtiles`.
- **`creator`-Fallback:** wenn `methodology.authority` leer ist, fallback auf `Organization { name: 'navigator.berlin', url: origin }`. Layer wird NICHT geskippt.
- **Hard-Refactor erledigt:** `$lib/seo/json-ld-updates.ts` (Story 2.13 Inline-Build, TODO-markiert) ist entfernt und durch `$lib/seo/jsonld-blog-posting.ts` in der zentralen Generator-Lib ersetzt. Konsumenten `updates/+page.svelte` und `updates/[slug]/+page.svelte` nutzen jetzt `buildBlogPosting` / `buildBlogIndex` aus `$lib/seo/index.js` und rendern via `<JsonLd>`-Komponente.
- **XSS-Hardening:** Inline-`{@html JSON.stringify(...)}`-Pattern aus 4 Stellen entfernt (`methodik`, `updates/+page`, `updates/[slug]/+page`, neu eingebautes Layer-Detail). Alle JSON-LD-Blocks laufen jetzt durch `serializeJsonLd` (`</` → `<\/`).

### Test-Strategie

- **Pure-Function-Tests (server-projekt, Node):** `license-url`, `serialize-jsonld`, `jsonld-website`, `jsonld-place`, `jsonld-administrative-area`, `jsonld-dataset`, `jsonld-faqpage`, `jsonld-breadcrumb`, `jsonld-blog-posting`. Coverage Pure-Logic geschaetzt ≥90% (alle Branches per Test geprueft, License-Error-Pfad inkl.).
- **Komponenten-Test (client-projekt, vitest-browser-svelte):** `json-ld.svelte.test.ts` deckt Render + Testid + XSS-Escape-Roundtrip.
- **Page-Integration-Tests:** Methodik (Bestand bleibt gruen) + Layer-Detail (neue Test-Cases fuer Dataset-JSON-LD + creator-Fallback).
- **Layout-Smoke:** kein separater Layout-Test geschrieben; `buildWebSite`-Unit-Tests + `JsonLd`-Komponenten-Test decken die Layout-Building-Blocks. Layout-Integration ist 4-LOC-Glue, wird per Spotcheck (T7.6) im Browser geprueft.

### File List

**Neu (Generator-Lib):**
- `src/lib/seo/license-url.ts` + `license-url.test.ts`
- `src/lib/seo/serialize-jsonld.ts` + `serialize-jsonld.test.ts`
- `src/lib/seo/jsonld-website.ts` + `jsonld-website.test.ts`
- `src/lib/seo/jsonld-place.ts` + `jsonld-place.test.ts`
- `src/lib/seo/jsonld-administrative-area.ts` + `jsonld-administrative-area.test.ts`
- `src/lib/seo/jsonld-dataset.ts` + `jsonld-dataset.test.ts`
- `src/lib/seo/jsonld-faqpage.ts` + `jsonld-faqpage.test.ts`
- `src/lib/seo/jsonld-breadcrumb.ts` + `jsonld-breadcrumb.test.ts`
- `src/lib/seo/jsonld-blog-posting.ts` + `jsonld-blog-posting.test.ts` (Refactor aus 2.13)
- `src/lib/components/atlas/json-ld.svelte` + `json-ld.svelte.test.ts`

**Modifiziert:**
- `src/lib/seo/index.ts` (Barrel erweitert)
- `src/routes/+layout.svelte` (WebSite-JSON-LD inkl. SearchAction)
- `src/routes/(with-header)/methodik/+page.svelte` (Inline-JSON-LD → JsonLd-Komponente)
- `src/routes/(with-header)/layer/[slug]/+page.svelte` (neues Dataset-JSON-LD via JsonLd)
- `src/routes/(with-header)/layer/[slug]/page.svelte.test.ts` (+ 2 Tests fuer Dataset-JSON-LD)
- `src/routes/(with-header)/updates/+page.svelte` (Inline-JSON-LD → JsonLd, neuer Import-Pfad)
- `src/routes/(with-header)/updates/[slug]/+page.svelte` (Inline-JSON-LD → JsonLd, neuer Import-Pfad)
- `package.json` (devDep `schema-dts`)

**Geloescht:**
- `src/lib/seo/json-ld-updates.ts` + `json-ld-updates.test.ts` (Inhalt → `jsonld-blog-posting.ts`)

## Change Log

| Datum | Stand | Notizen |
|-------|-------|---------|
| 2026-05-16 | in-progress → review | Story 2.2 implementiert, Tests gruen, `pnpm check` 0 Errors. |
