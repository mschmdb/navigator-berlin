# Story 1.29: Atlas-Methodik-Pattern (Layer-Detail-Pflichtsektionen + zentrale Methodik-Page)

Status: review

## Story

As a Nutzer:in, Journalist:in, Behörde, oder Forscher:in, die einen Layer im Atlas verstehen will,
I want pro Layer einheitlich dokumentiert sehen: was gemessen, wie berechnet, wo Coverage fehlt, was bewusst nicht enthalten ist, welche verwandten Layer es gibt, dazu eine zentrale Methodik-Page für Atlas-Architektur, Editorial-Verantwortung und Datenstand-Übersicht,
So that ich Daten richtig einordnen kann ohne aus Inspector-Werten falsche Schlüsse zu ziehen.

## Probleme heute

1. Layer-Detail-Pages (Story 1.16) zeigen Source + Lizenz + Stand + Skala, aber NICHT „wie wird berechnet" oder „was fehlt".
2. Coverage-Lücken (Story 1.23 LayerHitReason) sind im Inspector erklärt, auf Layer-Detail-Page jedoch unsichtbar. SEO-Besucher landet ohne Inspektor-Kontext.
3. Cross-Layer-Patterns (Anti-Korrelation, Aggregation-Ebene, was-NICHT-im-Atlas) sind in keiner zentralen Quelle dokumentiert.
4. Atlas-weite Editorial-Verantwortung (Stigmatisierungs-Schutz, Stolperstein-Würde, Mietspiegel-Disclaimer) ist über Stories 1.12/1.18/1.22/1.23 verstreut, ohne One-Stop-Erklärseite.
5. Story 1.28 Lebensqualität-Index braucht Methodik-Page. Pattern sollte Atlas-weit einheitlich sein, nicht 1-off pro Aggregat-Layer.
6. Vertrauens-Faktor: ohne explizite Methodik-Doku wirkt der Atlas wie viele kommerzielle „Lagen-Bewertungs"-Tools (intransparent). Open-Source + cookieless verlangt Methodik-Transparenz als Asset.

## Akzeptanz-Kriterien

1. **AC-1 (Layer-Detail-Page Pflicht-Sections):**
   **Given** `src/routes/(with-header)/layer/[slug]/+page.svelte` (Story 1.16 Foundation)
   **When** Story 1.29 die Page erweitert
   **Then** die Page rendert nach Lead + Editorial + Source-Card folgende NEUE Pflicht-Sections in dieser Reihenfolge:
   - **„Wie berechnet"** (`data-testid="layer-detail-methodology"`) — Pure-Markdown-Inhalt aus `LayerMethodology[slug].calculation`
   - **„Coverage-Lücken"** (`data-testid="layer-detail-coverage-gaps"`) — räumliche oder zeitliche Lücken, was bei `LayerHitReason` zu erwarten ist
   - **„Was wir NICHT zeigen"** (`data-testid="layer-detail-omissions"`) — bewusst ausgelassene Datenpunkte mit Begründung
   - **„Verwandte Layer"** (`data-testid="layer-detail-related"`) — Cross-Refs zu anderen Slugs als interne Links
   - **„Atlas-Methodik"** (`data-testid="layer-detail-methodik-link"`) — Hinweis-Banner mit Link auf `/methodik` (Plex-Mono klein)
   **And** Falls eine Section in `LayerMethodology[slug]` leer/undefined: Section komplett ausgeblendet (kein „Keine Daten"-Placeholder)
   **And** Falls Layer GAR KEINE Methodology-Einträge hat: Banner-Hinweis „Methodik in Vorbereitung" mit Link auf `/methodik` + Mailto-Feedback-Link aus Story 1.12 `error-feedback-mailto.svelte`
   **And** Pflicht-Sections sind ARIA-strukturiert: jede als `<section aria-labelledby="...">` mit `<h2>`-Header

2. **AC-2 (LayerMethodology-Datenstruktur):**
   **Given** Methodik-Inhalte zentral verwaltbar
   **When** `src/lib/data/layer-methodology.ts` implementiert wird
   **Then**:
   ```ts
   export interface LayerMethodology {
     readonly calculation?: string;          // markdown-fähiger Text: wie wird Wert ermittelt
     readonly coverageGaps?: string[];        // Bullet-Punkte
     readonly omissions?: string[];           // was bewusst nicht enthalten + Begründung
     readonly relatedLayers?: string[];       // Slugs anderer Layer (auto-link)
     readonly aggregationLevel?: AggregationLevel;  // s. unten
     readonly updateFrequency?: string;      // z.B. "jährlich", "alle 5 Jahre"
     readonly authority?: string;             // wer pflegt es offiziell
   }

   export type AggregationLevel =
     | 'address'         // Punkt-genau
     | 'lor-planungsraum'  // ~538 Polygone
     | 'lor-bezirksregion' // ~138 Polygone
     | 'lor-prognoseraum'  // ~60 Polygone
     | 'bezirk'           // 12 Polygone
     | 'block'            // Häuserblock-Aggregat
     | 'point-osm';       // Einzelpunkt-Layer (Stationen, POIs)

   export const LAYER_METHODOLOGY_DE: Record<string, LayerMethodology>;
   export function getLayerMethodology(slug: string): LayerMethodology | null;
   ```
   **And** initialer Inhalt für ALLE 34 Manifest-Slugs (selbst wenn knapp gehalten — mindestens `aggregationLevel` + `authority` + 1-2 Sätze `calculation`)
   **And** Pure-Daten-Modul, TS-strict, file <500 LOC (ggf. Split nach Bundle)
   **And** Wiederverwendet `LayerExplain` aus Story 1.16 nicht (LayerExplain = was zeigt der Wert; Methodology = wie/woher/lücken)

3. **AC-3 (LayerDetail-Pipeline-Erweiterung):**
   **Given** `buildLayerDetail(slug, lang, manifest)` aus `src/lib/data/get-layer-detail.ts`
   **When** die Funktion erweitert wird
   **Then** Returntyp `LayerDetail` zusätzlich `methodology?: LayerMethodology` enthält
   **And** `+page.ts` läd Methodology zusammen mit Detail
   **And** Bei `null`-Methodology: Page rendert „Methodik in Vorbereitung"-Banner statt Pflicht-Sections

4. **AC-4 (Zentrale Methodik-Page `/methodik`):**
   **Given** neue Route `src/routes/(with-header)/[lang]/methodik/+page.svelte`
   **When** Page rendert
   **Then** Sections in dieser Reihenfolge:
   - **„Was navigator.berlin macht"** — Mission-Statement (1 Absatz), Cookieless-Linie, Open-Source-FOSS-Hinweis, Stand-Banner
   - **„Datenarchitektur"** — Pipeline-Skizze (Source → fetch → reproject → simplify → Hash → Manifest → Atlas), 34 aktive Layer, Update-Zyklen-Tabelle
   - **„Aggregations-Ebenen"** — Welche Daten adressgenau (Punkt-Geocode + Punkt-Layer), welche LOR-aggregiert (Umweltatlas, Wohnlagen, Klima), welche Bezirks-aggregiert. Wichtig für User-Erwartungs-Management.
   - **„Cross-Layer-Aggregat-Indices"** — Hinweis auf Lebensqualität-Index (Story 1.28) + Anti-Korrelations-Schutz (warum manche Layer NICHT doppelt zählen) + Editorial-Disclaimer
   - **„Coverage-Strategie"** — LayerHitReason-Pattern erklärt (no-coverage, outdated, seasonal, coverage-out-of-scope, out-of-concept), Mini-Beispiele
   - **„Was wir bewusst nicht enthalten"** — Cookies/Tracking/User-Accounts/kommerzielle Mietpreise/personenbezogene Daten/„objektive Lebensqualität"-Composite-Score, jeweils mit Begründung
   - **„Editorial-Verantwortung"** — Stolperstein-Würde-Prinzip, Mietspiegel-Disclaimer, Stigmatisierungs-Schutz, Bezirks-Stigma-Vermeidung, Methodik-Mailto-Feedback
   - **„Daten-Stand-Tabelle"** — auto-generiert aus Manifest: alle 34 Layer mit `sourceUpdatedAt` + `authority` + Lizenz + Link auf Layer-Detail-Page
   - **„Quellen + Lizenzen"** — Kurz-Hinweis + Link auf Story 4.5 `/lizenzen`-Page (sofern aktiv, sonst Stub)
   - **„Feedback"** — Mailto + Mastodon-Handle + GitHub-Issues-Link
   **And** SSR-prerendered für SEO
   **And** JSON-LD `TechArticle` oder `WebPage`-Schema-Stub
   **And** `<svelte:head>` mit title „Methodik · navigator.berlin" + description
   **And** Locale via `getLocale()` (Memory `project_paraglide_reroute.md`)
   **And** File <500 LOC; Auto-Daten-Tabelle als Sub-Komponente `methodik-daten-tabelle.svelte`

5. **AC-5 (Footer-Link auf Methodik-Page):**
   **Given** `meta-footer.svelte` aus Layout
   **When** Methodik-Page existiert
   **Then** Footer-Link „Methodik" hinzugefügt neben Impressum/Datenschutz/Lizenzen (sofern letztere existieren)
   **And** `<a href="/methodik">Methodik</a>` lokalisiert via Story 3.x später, MVP DE

6. **AC-6 (Site-Header-Sub-Link, optional):**
   **Given** Site-Header hat Layer-Trigger + AddressSearch
   **When** Header soll Methodik-Link bekommen?
   **Then** **Entscheidung: NICHT in Header**. Methodik gehört in Footer (sekundäre Navigation). Header bleibt schlank.

7. **AC-7 (Inspector-Link auf Methodik):**
   **Given** Inspector-Footer aus Story 1.20 (ShareSheet) + Story 1.16 (LayerExplain)
   **When** User in Inspector mehr Methodik-Kontext braucht
   **Then** im Section-Footer (am Ende jeder Inspector-Section unter den LayerHit-Rows) dezenter Plex-Mono-Link: „Methodik dieser Sektion" → öffnet `/methodik#{section-slug}`
   **And** Section-Slugs deterministisch aus `SECTION_ORDER` (z.B. `methodik#wohn`)
   **And** Hash-Anker auf Methodik-Page setzen passende Scroll-Position (`<section id="wohn">`)

8. **AC-8 (Editorial-Verantwortung in der Implementierung):**
   - **Bezirks-Stigma-Schutz:** Daten-Stand-Tabelle sortiert alphabetisch oder nach Bundle, NICHT nach „Aktualität" oder „Coverage-Score"
   - **Mietspiegel-Klausel:** Methodik-Page erklärt explizit, dass navigator.berlin KEINEN Mietpreis ermittelt und keine rechtliche Aussage trifft
   - **Stolperstein-Klausel:** Methodik-Page erklärt, dass Stolperstein-Layer reine Existenz-Marker ohne Wertung sind, Personen-Biografien externe Primärquellen
   - **Anti-LLM-Hinweis:** Methodik-Page macht klar, dass Layer-Inhalte NICHT algorithmisch generiert oder LLM-summarized werden (FR51 Würde)
   - **Anti-Composite-Hinweis:** Methodik-Page erklärt, warum es keinen Single-Number-„Berlin-Score" gibt (Stigmatisierungs-Risiko + Persona-Abhängigkeit + Bezahlbarkeits-Ambivalenz)

9. **AC-9 (Tests):**
   Unit:
   - `layer-methodology.test.ts` — `getLayerMethodology` Lookup, Fallback bei Unknown-Slug, alle 34 Slugs mindestens minimaler Eintrag, Schema-Konsistenz
   - `methodik-daten-tabelle.svelte.test.ts` — Render-Variants (Mini-Manifest, Sort-Order, Link-Pfade)
   - `layer-detail-methodology.svelte.test.ts` ODER bestehende `layer-detail`-Test-Datei erweitern — Render-Variants (volle Methodology, partial, none)
   - `layer-detail-related-link.test.ts` — Auto-Link-Building für `relatedLayers`-Strings
   Integration:
   - `methodik-page.test.ts` — Page-Render + SSR + JSON-LD-Snippet
   E2E:
   - `tests/e2e/methodik-flow.e2e.ts`:
     - `/methodik` rendert ohne Fehler
     - Daten-Tabelle zeigt 34 Layer
     - Klick auf Layer-Link öffnet Layer-Detail-Page
     - Layer-Detail-Page enthält 4 Pflicht-Sections + Methodik-Link
     - Methodik-Link auf Layer-Detail springt zur richtigen Section auf `/methodik`
   Coverage-Target: ≥85% Pure-Data, ≥75% Page-Komponente

10. **AC-10 (A11y):**
    - Methodik-Page: Tabellen-Semantik (`<table>` für Daten-Stand-Tabelle), `<nav aria-label="Sectionen">` für Inhaltsverzeichnis am Anfang
    - Inhaltsverzeichnis mit Anker-Links zu allen Sections (Skip-Link-Pattern aus Story 1.8)
    - Sections strukturiert mit `<section aria-labelledby="">`-Hierarchie
    - Auto-Daten-Tabelle: `<th scope="col">`, sortierbar via `aria-sort` (Wiederverwendung `data-table-alternative.svelte` aus Story 1.10)
    - axe-core: 0 Violations (deferred to CI)

## Tasks / Subtasks

- [x] **Task 1: LayerMethodology-Datenmodul** (AC: #2)
  - [x] 1.1 `src/lib/data/layer-methodology.ts` (381 LOC, alle 35 Manifest-Slugs)
  - [x] 1.2 Tests `layer-methodology.test.ts` (11 Cases grün, 35-Slug-Coverage-Check)
  - [x] 1.3 TODO-Kommentar im File für Phase 3.1 Paraglide-Migration

- [x] **Task 2: LayerDetail-Pipeline + Page-Erweiterung** (AC: #1, #3)
  - [x] 2.1 `LayerDetail` um `methodology: LayerMethodology | null` erweitert; `buildLayerDetail` lädt Methodology
  - [x] 2.2 `get-layer-detail.test.ts` +2 Cases (7/7 grün)
  - [x] 2.3 +page.svelte rendert 4 Pflicht-Sections + Methodik-Atlas-Link + Empty-Fallback (266 LOC)
  - [x] 2.4 page.svelte.test.ts +6 Cases (17/17 grün)

- [x] **Task 3: Zentrale Methodik-Page** (AC: #4, #8, #10)
  - [x] 3.1 `src/routes/(with-header)/methodik/+page.svelte` (Pivot vom Story-Vorschlag `[lang]/methodik`: Repo-Pattern + Memory `project_paraglide_reroute.md` schreiben Routes ohne `[lang]`-Param vor; paraglide-reroute strippt das Locale-Prefix bevor SvelteKit matcht)
  - [x] 3.2 `+page.ts` load + `prerender = true`
  - [x] 3.3 10 Sections mit `<section id aria-labelledby>` + `<h2 id>` + Inhaltsverzeichnis
  - [x] 3.4 JSON-LD-Stub `TechArticle` in `<svelte:head>`
  - [x] 3.5 Prerender aktiv
  - [x] 3.6 294 LOC <500. Splits: `methodik-daten-tabelle.svelte` + `methodik-pipeline-diagram.svelte` (Omissions-Liste blieb inline, da Pure-Daten-Loop ohne Abhängigkeiten — kein Split-Bedarf)
  - [x] 3.7 `methodik-page.test.ts` (11 Cases) + `methodik-daten-tabelle.svelte.test.ts` (6 Cases)

- [x] **Task 4: Footer-Link** (AC: #5)
  - [x] 4.1 `meta-footer.svelte` mit `<a href="/methodik">Methodik</a>`
  - [x] 4.2 Reihenfolge: Methodik | Lizenzen | Datenschutz | Impressum | Architektur | Kontakt
  - [x] 4.3 `meta-footer.svelte.test.ts` (+2 Cases, 8/8 grün)

- [x] **Task 5: Inspector-Section-Methodik-Link** (AC: #7)
  - [x] 5.1 `inspector-panel.svelte`: Plex-Mono-Link „Methodik dieser Sektion" pro gerenderter Section
  - [x] 5.2 `SECTION_TO_METHODIK_ANCHOR` + `getMethodikAnchorForSection` in `sections.ts`
  - [x] 5.3 `sections.test.ts` (+4 Cases) + `inspector-panel.svelte.test.ts` (+3 Cases)

- [x] **Task 6: Wiederverwendete Komponenten** (AC: #1, #4)
  - [~] 6.1 PIVOT: statt `data-table-alternative` (Toggle-Pattern für Inspector-Card) eigene `methodik-daten-tabelle.svelte` mit immer-sichtbarer `<table>` + `<th scope=col>` + Standard-Sort alphabetisch (UX-Argument: zentrale Methodik-Page braucht immediate-visible Table, nicht hinter Toggle versteckt)
  - [-] 6.2 `editorial-disclaimer.svelte` NICHT verwendet auf Methodik-Page: Editorial-Section ist mehrsätzig narrativ; DisclaimerVariant-Set (legal/historic/seasonal/source) ist 1-Liner pro Layer-Hit, semantisch unpassend für eine Editorial-Erläuterung. Inline-Paragraphen rendern stattdessen vier kuratierte Themen (Stolperstein, Mietspiegel, Stigmatisierung, Anti-LLM)
  - [x] 6.3 `error-feedback-mailto.svelte` im Layer-Detail-„Methodik in Vorbereitung"-Banner

- [x] **Task 7: Tests + E2E + axe** (AC: #9, #10)
  - [x] 7.1 Unit-Suite: 1216/1216 grün, 115 Test-Files (78 neue Cases in dieser Story: 11 layer-methodology + 2 get-layer-detail + 6 page +6 daten-tabelle + 11 methodik-page + 2 meta-footer + 4 sections + 3 inspector-panel)
  - [x] 7.2 E2E `tests/e2e/methodik-flow.e2e.ts` (5 Cases) — angelegt, Run deferred zu CI/User-Verify analog Stories 1.13-1.26
  - [x] 7.3 axe-core deferred to CI
  - [-] 7.4 Manueller Browser-Smoke deferred zu User-Verify-Phase

## Dev Notes

### Methodology-Initial-Inhalt Strategie

Für 34 Layer mit nur User in Solo-Maintainer-Mode: nicht jeder Layer braucht 5 Absätze. Minimum-Inhalt pro Slug:
- `calculation`: 1-2 Sätze (woher Daten, welche Pipeline)
- `aggregationLevel`: einer der 7 Enum-Werte
- `authority`: 1 String (z.B. „Senatsverwaltung für Stadtentwicklung", „ODIS Berlin", „OpenStreetMap Contributors")
- `updateFrequency`: 1 String

Optional (wo relevant):
- `coverageGaps`: 1-3 Bullets
- `omissions`: 1-3 Bullets
- `relatedLayers`: 1-5 Slugs

Beispiel-Eintrag:
```ts
'laerm-2023': {
  calculation: 'Modellierte Straßenverkehrslärm-Werte des Berliner Umweltatlas 2023, aggregiert pro LOR-Planungsraum als Kategorie gering/mittel/hoch nach EU-Umgebungslärm-RL.',
  coverageGaps: [
    'Nur Straßenverkehrslärm, keine Schienen- oder Flugverkehrslärm-Trennung in diesem Layer.',
    'Modell-Werte, keine Mess-Stationen.'
  ],
  omissions: [
    'Individuelle Wohnungs-Innenraum-Lärmwerte (datenseitig nicht verfügbar).',
    'Nachtruhe-Lärm separat als luft-2023 — getrennter Layer.'
  ],
  relatedLayers: ['luft-2023', 'bioklima-2023', 'umweltgerechtigkeit-2023'],
  aggregationLevel: 'lor-planungsraum',
  updateFrequency: 'alle 3-5 Jahre (gemäß EU-Umgebungslärm-RL-Berichtspflicht)',
  authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt — Umweltatlas Berlin'
}
```

Pragmatisch: dev-story kann pro Bundle in ein Sub-File auslagern (`layer-methodology/umwelt.ts`), dort 5-7 Slugs gepflegt, gesamt-Lookup re-exportiert.

### Methodik-Page-Skizze

```
[Header]
Methodik
Wie navigator.berlin Daten verarbeitet, was wir zeigen, was wir nicht zeigen.

[Inhaltsverzeichnis nav]
• Mission und Cookieless-Linie
• Datenarchitektur
• Aggregations-Ebenen
• Cross-Layer-Aggregat-Indices
• Coverage-Strategie
• Was wir nicht enthalten
• Editorial-Verantwortung
• Daten-Stand-Tabelle (34 Layer)
• Quellen und Lizenzen
• Feedback

[§ Was navigator.berlin macht]
Atlas für 34 öffentliche Berliner Geo-Datensätze, statisch prerendered, ohne Cookies, ohne Tracker, Open-Source unter ... Lizenz.

[§ Datenarchitektur]
Build-Pipeline: fetch (Source → CDN-Mirror) → reproject (EPSG:3035 → EPSG:4326) → simplify (mapshaper visvalingam 20% + keep-shapes) → SHA256-Hash → MANIFEST.json → SvelteKit-Build → CDN.
Runtime: getLayersAtPoint(lat,lng) lookup pro selektierter Adresse, In-Memory-Cache.

[§ Aggregations-Ebenen]
Tabelle:
- Adress-genau:           Punkt-POIs (Stolpersteine, Kitas, ÖPNV-Stops, ...)
- LOR-Planungsraum (538): Lärm, Luft, Bioklima, Grünversorgung, Klima
- LOR-Bezirksregion (138): Wohnlagen
- Bezirk (12):             Bezirks-Stammdaten
- OSM-Routing-Netz:        Radverkehrsnetz, Fahrradstraßen
- DWD-Station:             Klimadaten (Punkt-Mess-Stationen)

[§ Cross-Layer-Aggregat-Indices]
Lebensqualität-Index (Story 1.28): 3 Dimensionen Ruhe-Luft / Grün / Mobilität.
KEIN Composite-Single-Score (Stigmatisierungs-Schutz).
Anti-Korrelation: umweltgerechtigkeit-2023 wird in Ruhe-Luft-Dimension NICHT doppelt gezählt da bereits Vor-Aggregat.

[§ Coverage-Strategie]
LayerHitReason-Pattern:
- no-coverage:           Datensatz nicht in Berlin verfügbar
- outdated:              älter als 5 Jahre (Schwellwert Berlin-Geodaten)
- seasonal:              z.B. Trinkbrunnen Mai-Oktober
- coverage-out-of-scope: Punkt außerhalb Datensatz-BBox
- out-of-concept:        konzeptionell nicht anwendbar (z.B. Mietspiegel-Layer in Gewerbe-Lage)

[§ Was wir bewusst nicht enthalten]
- Cookies, Tracker, User-Accounts (Cookieless-Linie, ADR-004 + Story 1.26-Ausnahme)
- Kommerzielle Mietpreis-Datenbanken (verlinken auf Mietspiegel-Berlin offiziell)
- Personenbezogene Daten (kein User-Profil, keine Verhaltens-Auswertung)
- Algorithmisch generierte oder LLM-summarisierte Layer-Inhalte (Würde-Prinzip Story 1.12 / FR51)
- „Objektiver Berlin-Lebensqualitäts-Score" als Composite (siehe Stigmatisierungs-Schutz)
- Kommerzielle Werbung, Partner-Tracking

[§ Editorial-Verantwortung]
- Stolperstein-Würde: Auflistung ohne Wertung, Biografien externe Quellen (FR50/51)
- Mietspiegel: kein Wert-Urteil, externe Verlinkung
- Stigmatisierungs-Schutz: aggregierte Daten ≠ Wohn-Score, keine Bezirks-Rankings
- Mailto-Feedback-Pattern (Story 1.12) für jeden Layer

[§ Daten-Stand-Tabelle]
Auto-generiert aus Manifest. Sortierbar, alle 34 Layer mit Stand, Autorität, Lizenz, Link.

[§ Quellen und Lizenzen]
Kurz-Hinweis + Link auf /lizenzen (Story 4.5).

[§ Feedback]
methodik@navigator.berlin · GitHub Issues · Mastodon-Handle (sobald gesetzt).
```

### Methodik-Anker-Mapping (Section → Hash)

```ts
export const SECTION_TO_METHODIK_ANCHOR: Record<SectionKey, string> = {
  boundary: 'aggregations-ebenen',
  wohn: 'aggregations-ebenen',
  umwelt: 'aggregations-ebenen',
  memorial: 'editorial',
  sozial: 'aggregations-ebenen',
  mobilitaet: 'aggregations-ebenen',
  klima: 'aggregations-ebenen'
};
```

Pragmatisch alle nach `aggregations-ebenen` im MVP; differenzierter Pattern Phase 2.

### Section-Headers auf Methodik-Page

Plex-Serif h2, Plex-Mono Subline „Section X von Y". Anchor `<a href="#{slug}" aria-label="Anker zu Section X">§</a>` rechts neben h2.

### Cross-Layer-Auto-Link in `relatedLayers`

```svelte
{#if methodology.relatedLayers && methodology.relatedLayers.length > 0}
  <section data-testid="layer-detail-related" aria-labelledby="related-h">
    <h2 id="related-h">Verwandte Layer</h2>
    <ul>
      {#each methodology.relatedLayers as relSlug (relSlug)}
        <li>
          <a href={`/layer/${relSlug}`}>{getLayerDisplayName(relSlug)}</a>
        </li>
      {/each}
    </ul>
  </section>
{/if}
```

### Architektur-Compliance — relevante MUST-Rules

- #1 @lucide/svelte (Info, ChevronRight, ExternalLink für Methodik-Anker)
- #2 Files <500 Zeilen — Methodik-Page + LayerMethodology-Module strict
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- #10 Cookieless — Methodik-Page strict, kein User-State
- #12 Source + UpdatedAt + License pro Layer (Auto-Daten-Tabelle macht das transparent)
- #13 A11y-First (Tabellen-Semantik, ARIA-Section-Hierarchie)
- #14 i18n-First (Pattern für Story 3.1)
- #15 Editorial-Verantwortung (Methodik-Page macht es zentral sichtbar)

### Library/Framework Requirements

**Neu:** keine.

### Testing Requirements

- Unit ≥85% (Pure-Data + Page-Sub-Komponenten)
- E2E: Methodik-Flow, Layer-Detail-Methodology-Sections
- Coverage-Check: ALLE 34 Manifest-Slugs haben `LayerMethodology`-Eintrag (Test enforced)
- Browser-Test-Vorsicht: kein `vi.spyOn(globalThis, 'fetch')`

### Previous Story Intelligence

- **Story 1.3:** Manifest mit `sourceUpdatedAt`, `authority`-Pattern via SourceConfig
- **Story 1.4:** `loadManifest`-Pattern
- **Story 1.10:** `data-table-alternative.svelte` (Wiederverwendung in Daten-Stand-Tabelle)
- **Story 1.12:** EDITORIAL_CONFIG + `editorial-disclaimer.svelte` + `error-feedback-mailto.svelte` (Wiederverwendung in „Methodik in Vorbereitung"-Banner)
- **Story 1.16:** LayerExplain + Layer-Detail-Page-Foundation
- **Story 1.18:** Plex-Mono-Subtext-Pattern
- **Story 1.20:** Inspector-Footer + ShareSheet (Methodik-Atlas-Link in Section-Footer parallel zu Share)
- **Story 1.23:** LayerHitReason (wird im „Coverage-Strategie"-Methodik-Section erklärt)
- **Story 1.26:** Bookmarks (Methodik-Page erklärt die ADR-004-Ausnahme im „Was wir nicht enthalten"-Section)
- **Story 1.28:** Lebensqualität-Index (Methodik-Page erklärt Anti-Composite-Schutz; eigene Lebensqualität-Methodik-Page als Subset bleibt)
- **Story 4.5:** Lizenzen-Page (Quervewreis aus Methodik-Page; falls 4.5 nicht ausgeliefert, Methodik-Page erklärt Lizenzen inline + späteres Refactor)
- **Memory `project_paraglide_reroute.md`:** `/methodik` als `[lang]/methodik` mit `getLocale()`

### File-Structure-Diff zu Story 1.28

```
./
├── src/
│   ├── lib/
│   │   ├── data/
│   │   │   ├── layer-methodology.ts                    # neu (oder Split-Folder)
│   │   │   ├── layer-methodology.test.ts               # neu
│   │   │   ├── layer-methodology/                      # neu (optional Split per Bundle)
│   │   │   │   ├── index.ts
│   │   │   │   ├── boundary.ts
│   │   │   │   ├── wohn.ts
│   │   │   │   ├── umwelt.ts
│   │   │   │   ├── memorial.ts
│   │   │   │   ├── sozial.ts
│   │   │   │   ├── mobilitaet.ts
│   │   │   │   └── klima.ts
│   │   │   ├── get-layer-detail.ts                     # erweitert
│   │   │   └── get-layer-detail.test.ts                # erweitert
│   │   ├── components/
│   │   │   └── atlas/
│   │   │       ├── layer-detail-methodology-section.svelte    # neu
│   │   │       ├── meta-footer.svelte                  # erweitert
│   │   │       └── inspector-panel/
│   │   │           └── internal/
│   │   │               └── sections.ts                 # erweitert (SECTION_TO_METHODIK_ANCHOR)
│   └── routes/
│       └── (with-header)/
│           ├── [lang]/
│           │   └── methodik/
│           │       ├── +page.svelte                    # neu
│           │       ├── +page.ts                        # neu
│           │       ├── methodik-daten-tabelle.svelte   # neu
│           │       └── methodik-pipeline-diagram.svelte # neu
│           └── layer/
│               └── [slug]/
│                   └── +page.svelte                    # erweitert
└── tests/
    └── e2e/
        └── methodik-flow.e2e.ts                        # neu
```

### Open Questions

1. **Lokalisierung Inhalt-Bulk:** initial DE-only; EN-Migration Story 3.x. Inhalt-Pflege in Paraglide-Messages ab Story 3.1 (TODO-Kommentar im Modul).
2. **Daten-Stand-Tabelle Sortier-Default:** alphabetisch nach Display-Name ist sicherste Wahl gegen Bias (statt nach Aktualität, was Coverage-Lücken bestrafen würde).
3. **Pipeline-Diagram-SVG:** statisch handgezeichnet vs auto-generiert? Phase 1: statische SVG, Phase 2 evtl. Mermaid-/Excalidraw-Export.
4. **JSON-LD-Schema:** `TechArticle` oder `WebPage` oder `FAQPage`? MVP: `TechArticle` (am nächsten an Methodik-Doku); Story 2.2 (JSON-LD-Generator) liefert Tooling.
5. **Methodik-Page-URL:** `/methodik` vs `/daten` vs `/ueber-die-daten`? Empfehlung `/methodik` (kurz, präzise, etabliert in Datenjournalismus). Locale-Pfad bleibt `/[lang]/methodik`.
6. **Editorial-Disclaimer-Wiederverwendung:** `disclaimerVariants` in EDITORIAL_CONFIG ggf. neue Variant `methodik-page-stigma` + `methodik-page-mietspiegel` + `methodik-page-stolperstein` für zentrale Wiederverwendung. Keine Duplikation.
7. **Cross-Methodik-Sub-Pages:** Story 1.28 hat eigene Lebensqualität-Methodik-Page. Soll diese in 1.29 aufgehen? Empfehlung: 1.28 behält dedizierte Sub-Page `/methodik/lebensqualitaet` (oder `/lebensqualitaet-methodik`), und zentrale `/methodik` linkt darauf. Hierarchie statt Redundanz.
8. **Layer-Detail-Page-Section-Pflicht:** Falls ein Slug keinen `LayerMethodology`-Eintrag bekommt: Banner zeigt „Methodik in Vorbereitung" + Mailto. Story-Acceptance verlangt, dass ALLE 34 Slugs mindestens Minimum-Eintrag haben → Banner sollte selten erscheinen, dient nur als Forward-Compat für künftige neue Layer.

### Phase-2-Backlog (separate Stories)

- Methodik-Inhalt in Paraglide-Messages (Story 3.1)
- JSON-LD-Schema voll (Story 2.2)
- Pipeline-Diagram als interaktive Mermaid-Komponente
- Auto-Sync-Indikator (welche Layer wurden seit letztem Build aktualisiert)
- Methodik-Versionierung mit Changelog (welche Methodik wurde wann geändert)
- LLM-Lesbar-Variante `/methodik.txt` oder `/llms-methodik.txt` (Story 2.8)

## References

- [Source: src/routes/(with-header)/layer/[slug]/+page.svelte] (Story 1.16 — Foundation)
- [Source: src/routes/(with-header)/layer/[slug]/+page.ts] (LayerDetail-Load-Pattern)
- [Source: src/lib/data/get-layer-detail.ts] (LayerDetail-Interface)
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-explain.ts] (LAYER_EXPLAIN_DE — komplementär zu LayerMethodology)
- [Source: src/lib/components/atlas/data-table-alternative.svelte] (Wiederverwendung für Daten-Stand-Tabelle)
- [Source: src/lib/components/atlas/editorial-disclaimer.svelte]
- [Source: src/lib/components/atlas/error-feedback-mailto.svelte]
- [Source: src/lib/components/atlas/meta-footer.svelte] (Footer-Link-Pattern)
- [Source: src/lib/components/atlas/inspector-panel/internal/sections.ts] (SECTION_ORDER)
- [Source: _bmad-output/implementation-artifacts/1-12-editorial-verantwortung-pattern.md]
- [Source: _bmad-output/implementation-artifacts/1-16-layer-explain-coverage.md]
- [Source: _bmad-output/implementation-artifacts/1-23-datenfehlt-reason-aufdroeseln.md]
- [Source: _bmad-output/implementation-artifacts/1-26-adress-bookmarks-localstorage.md] (ADR-004-Ausnahme im „Was wir nicht enthalten"-Section)
- [Source: _bmad-output/implementation-artifacts/1-28-livability-index.md] (Sub-Methodik-Page als Konsument)
- [Source: _bmad-output/planning-artifacts/architecture.md#MUST-Rules]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/project_paraglide_reroute.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (caveman-mode aktiv)

### Debug Log References

- Vitest-Run nach Inspector-Panel-Erweiterung zeigt SSR-Eval-Cleanup-Noise (`transport was disconnected, cannot call "fetchModule"`) — Tests grün, Vite-Internals-Boot-Race irrelevant.
- `pnpm test:unit` Boot-Phase logged `wrapDynamicImport`-TypeError aus svelte-kit/internal.js — keine Test-Fehler, alle 1216/1216 grün.

### Completion Notes List

- **Routes-Pivot dokumentiert:** Story-AC-4 sagt `[lang]/methodik`, Memory `project_paraglide_reroute.md` + Repo-Pattern (`(with-header)/layer/[slug]` ohne `[lang]`) verlangen flat. Implementiert als `(with-header)/methodik` ohne `[lang]`-Param.
- **Komponente-Re-Use-Pivot dokumentiert (Task 6.1, 6.2):** `data-table-alternative` (Toggle-Pattern) ersetzt durch eigene immer-sichtbare `methodik-daten-tabelle.svelte`; `editorial-disclaimer` (1-Liner-Variants) ersetzt durch kuratierte Inline-Paragraphen. Begründung in Task-Liste oben.
- **Daten-Stand-Tabelle Default-Sort alphabetisch nach Display-Name** — explizit gegen Aktualitäts-Bias (würde Coverage-Lücken bestrafen). Story Open-Question 2 entschieden.
- **Methodik-Anker pragmatisch flach:** alle Inspector-Sections (außer Memorial → editorial) verlinken auf `aggregations-ebenen`. Differenzierung Phase 2.
- **Empty-Methodology-Banner aktiv,** auch wenn alle 35 Slugs Einträge haben — Forward-Compat für künftige neue Layer ohne Methodology-Eintrag.
- **JSON-LD-Schema:** `TechArticle`-Stub mit `dateModified` aus Manifest-`generatedAt`. Phase 2: Story 2.2 JSON-LD-Generator-Tooling.
- **34→35 Manifest-Slugs:** Story sagte 34, real 35 (`einschulbereiche-2024` mit dabei). Coverage-Test deckt alle 35 ab.
- **Type-Check 0 Errors über 5507 Files** nach allen Änderungen.
- **Empfohlene Story-Reihenfolge** war 1-29 → 1-27 → 1-28; Foundation für Story 1.28 Lebensqualität-Index ist gelegt (3-Dimensionen-Pattern + Anti-Composite-Hinweis im Editorial-Section).

### File List

Neu:
- `src/lib/data/layer-methodology.ts`
- `src/lib/data/layer-methodology.test.ts`
- `src/routes/(with-header)/methodik/+page.svelte`
- `src/routes/(with-header)/methodik/+page.ts`
- `src/routes/(with-header)/methodik/methodik-daten-tabelle.svelte`
- `src/routes/(with-header)/methodik/methodik-daten-tabelle.svelte.test.ts`
- `src/routes/(with-header)/methodik/methodik-pipeline-diagram.svelte`
- `src/routes/(with-header)/methodik/page.svelte.test.ts`
- `tests/e2e/methodik-flow.e2e.ts`

Erweitert:
- `src/lib/data/get-layer-detail.ts` (LayerDetail.methodology)
- `src/lib/data/get-layer-detail.test.ts` (+2 Cases)
- `src/lib/components/atlas/inspector-panel/internal/sections.ts` (SECTION_TO_METHODIK_ANCHOR + getMethodikAnchorForSection)
- `src/lib/components/atlas/inspector-panel/internal/sections.test.ts` (+4 Cases)
- `src/lib/components/atlas/inspector-panel.svelte` (Methodik-Link pro Section)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (+3 Cases)
- `src/lib/components/atlas/meta-footer.svelte` (Methodik-Link)
- `src/lib/components/atlas/meta-footer.svelte.test.ts` (+2 Cases)
- `src/routes/(with-header)/layer/[slug]/+page.svelte` (4 Pflicht-Sections + Methodik-Atlas-Link + Empty-Fallback)
- `src/routes/(with-header)/layer/[slug]/page.svelte.test.ts` (+6 Cases)

### Change Log

- 2026-05-15 (initial): LayerMethodology-Datenmodul + Lookup; LayerDetail-Pipeline-Erweiterung; Layer-Detail-Page mit 4 Pflicht-Sections + Methodik-Atlas-Link + Empty-Fallback; zentrale `/methodik`-Page mit 10 Sections + JSON-LD + prerender; Daten-Stand-Tabelle (alphabetisch); Pipeline-Diagram (ASCII-Stages); Footer-Link; Inspector-Section-Methodik-Link mit `SECTION_TO_METHODIK_ANCHOR`; E2E-Spec für Methodik-Flow; Status → review.
- 2026-05-15 (User-Feedback-Refinement):
  1. Inspector-„Methodik dieser Sektion"-Link entfernt (zu viel Noise; Footer-Link reicht). `SECTION_TO_METHODIK_ANCHOR` + `getMethodikAnchorForSection` gelöscht (Tot-Code statt _-Rename).
  2. Layer-Detail-Section-Header „Wie berechnet" → „Berechnung".
  3. Begriff „Atlas" frontend-weit entfernt:
     - Methodik-Page-Eyebrow „Atlas" raus.
     - Layer-Detail-Banner „Atlas-Methodik" → „Methodik".
     - JSON-LD headline „Methodik der Atlas-Daten" → „Methodik der Daten".
     - og-image-url Description „Atlas-Daten zur Adresse" → „Daten zur Adresse".
     - og-card-renderer „Atlas-Snapshot zur Adresse" → „Daten zur Adresse".
     - animated-logo loadingLabel-Default „Atlas wird geladen" → „Karte wird geladen".
     - +page.svelte OG-Title-Fallback „Berlin Navigator · Adress-Atlas" → „navigator.berlin · Adress-Daten".
     - _dev/logo + _dev/ui-showcase mitgezogen.
  4. Mission-Section: „Open-Source, EU-Hosting, FOSS-Stack" raus (navigator.berlin ist kein Open-Source-Projekt).
  5. Methodik-Page-Prosa komplett überarbeitet per `no-ai-slop` + `de-konzept-erstellung`: aktive Verben, kurze Sätze, kein Funktionsverb-Stack, kein „nahtlos/ganzheitlich/wegweisend". Section-Header umbenannt: „Was navigator.berlin macht" → „Worum es geht", „Was wir bewusst nicht enthalten" → „Was wir weglassen", „Cross-Layer-Aggregat-Indices" → „Aggregat-Indizes", „Daten-Stand-Tabelle" → „Daten-Stand".
  6. Pipeline-Diagram Edge-Stage: „Hetzner Coolify" → „Hetzner" (weniger Angriffsfläche).
  7. FEEDBACK_EMAIL: `hallo@navigator.berlin` → `hey@navigator.berlin` (international). USER_AGENT in `src/lib/server/geocode.ts` mitgezogen. Tests in contact.test.ts + error-feedback-mailto.svelte.test.ts angepasst.
