# Story 2.9b: Ranking-Page „Wo lebt es sich gut?"

Status: ready-for-dev

## Story

As a interessierter Bürger / Wohnungssucher / Datenjournalist,
I want eine prerenderte Ranking-Page die Top-N-Kieze (und Top-N-Bezirke) nach Kiez-Score / Bezirks-Score sortiert zeigt mit Methodik-Disclosure und Komponenten-Breakdown,
so that ich Berliner Kieze datenbasiert vergleichen kann und die Methodik nachvollziehbar bleibt, ohne dass der Begriff „lebenswert" auftaucht oder ein Composite-Single-Score normativ wirkt.

## Probleme heute

1. Es existiert keine Cross-Kiez/Cross-Bezirk-Vergleichs-Ansicht. Alle Bezirks-/Kiez-Pages sind isoliert; Ranking-Long-Tail-Suchen („beste Kieze Berlin", „ruhigste Bezirke") finden nichts.
2. Story 2.9a befüllt `bezirk_score` und `kiez_score`-Tabellen; ohne Konsument bleibt der Wert unsichtbar.
3. Editorial-Risiko: Ranking-Pages tendieren zum „guter/schlechter Kiez"-Framing. Memory `feedback_no_lebenswert.md` verbietet „lebenswert/Lebensqualität". Page-H1 muss diese Disziplin spiegeln.
4. Stigma-Disziplin: Soziale-Lage-Dimension darf nicht als Rangordnungs-Filter angeboten werden (würde stigmatisieren).

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1337-1365.
- PRD: FR36 (Schema.org Dataset + ItemList), FR40 (Provenance).
- Memory `feedback_no_lebenswert.md` (Begriffs-Disziplin), `project_kiez_score_naming.md` (Page-H1 „Wo lebt es sich gut?" zulässig, „lebenswert" verboten).
- Story 2.9a (ready-for-dev): `bezirk_score` + `kiez_score`-Tabellen mit 5 Dimensionen aus 1.28.
- Story 1.28 (review): Score-Methodik + `/methodik/kiez-score`-Page mit 8 Sections.
- Story 2.1: SeoHead, Sitemap.
- Story 2.2: `buildPlace`, `buildDataset`, `buildBreadcrumbList`, `JsonLd`.
- Story 2.4: Kiez-Page-Slugs als Link-Ziele (138 LOR-BR).
- Story 2.3: Bezirks-Page-Slugs als Link-Ziele (12 Bezirke).
- Story 2.6: OG-Image-Pipeline; Ranking-Page bekommt OG-Image (z.B. Top-3-Kieze-Card).
- Story 2.8: llms.txt registriert Ranking-Page-URL.

## Akzeptanz-Kriterien

1. **AC-1 (Route + prerender DE + EN):**
   **Given** Paraglide-Reroute-Pattern
   **When** ich `routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte` + `+page.server.ts` mit `prerender = true` implementiere
   **Then**:
   - DE-URL: `/wo-lebt-es-sich-gut`
   - EN-URL: `/en/where-life-is-good` (Default-Vorschlag) ODER `/en/quality-of-life-ranking` (Final-Wording-Lock per User-Decision, Open-Question 1)
   - `<title>` DE: „Wo lebt es sich gut? · navigator.berlin"
   - `<title>` EN: „Where life is good · navigator.berlin"
   - 2 prerendered HTML-Files (1 DE + 1 EN)
   - Loader liest aus `bezirk_score` + `kiez_score`-Tabellen (Story 2.9a)
   - Page-H1 DE: „Wo lebt es sich gut?" (Memory `project_kiez_score_naming.md`)
   - Page-H1 EN: „Where life is good in Berlin?" oder Final-Wording aus Open-Question 1

2. **AC-2 (Loader-Daten + Top-N-Sortierung):**
   **Given** `bezirk_score`-Tabelle 12 Rows, `kiez_score`-Tabelle 138 Rows
   **When** ich Loader baue
   **Then**:
   - Default-View: Top-30 Kieze nach `overall`-Score absteigend
   - Toggle-View: alle 12 Bezirke nach `overall`-Score absteigend (vollständige Liste, kein Top-N-Cut)
   - Beide Listen mit allen 5 Dimensionen pro Row sowie Slug-Link zu Bezirks-/Kiez-Page
   - Sortier-State im URL-Query-Param: `?sort={dimension|overall}&dir={asc|desc}&view={kieze|bezirke}`
   - Default `?view=kieze&sort=overall&dir=desc`
   - Kieze mit `overall: null` (insufficient-data per 2.9a) werden ans Listen-Ende gehängt mit „—" als Wert
   - Test: Loader-Snapshot mit Mock-Postgres-Response

3. **AC-3 (Ranking-Tabelle Komponente):**
   **Given** UX-DR43 Long-Form + Hairline-Design
   **When** ich `src/lib/components/atlas/score-ranking-table.svelte` implementiere
   **Then**:
   - Spalten: Rang, Kiez-/Bezirks-Name (mit Link), Bezirks-Zuordnung (nur in Kiez-View), Overall-Score (0-100), 5 Dimensionen
   - Hairline-Tabelle ohne Vertikal-Linien (Design-Direktive)
   - Plex-Sans für Werte, Plex-Mono für Score-Zahlen (Tabular)
   - Sortier-Button pro Spalten-Header: Klick togglet `?sort=&dir=` URL-Param
   - Tastatur-bedienbar: `tab` durch Header-Buttons, `Enter` togglet Sortier
   - URL-Sync via `goto({replaceState: true})` ohne Page-Reload
   - Score-Werte 0-100 mit ordinal-4-Klassifikation visuelle Indikator (Punkt-Cluster oder dezenter Bar, kein Rot-Grün-Verlauf — Memory: keine evaluative Bedienung von Sozialer Lage; alle Dim außer Soziale-Lage dürfen Severity-Familie „Gut", Soziale-Lage zwingend „Strukturell" per Story 1.31 Choropleth-Skalen-System)
   - Soziale-Lage-Spalte: explizit neutraler Stil (Plex-Mono-Zahl ohne Färbung)
   - „Mehr anzeigen"-Button am Tabellen-Ende lädt weitere Kieze (Phase-2 falls Top-30 zu wenig; MVP Top-30 hart)
   - Komponente <400 LOC (MUST-Rule #2); falls Sortier-Logic + Render Tabelle splittet → `score-ranking-row.svelte`

4. **AC-4 (View-Toggle Kieze ↔ Bezirke):**
   **Given** Bezirks-Toggle laut Epic-AC
   **When** Toggle-UI eingebaut wird
   **Then**:
   - Toggle-Buttons oben über Tabelle: „138 Kieze" (Default) / „12 Bezirke"
   - Toggle-State im URL-Query-Param `?view=kieze|bezirke`
   - Beim Wechsel werden Spalten-Header angepasst (z.B. „Bezirk"-Spalte fällt in Bezirks-View weg)
   - Tastatur-bedienbar (Bits-UI-ToggleGroup oder vanilla `role="radiogroup"`)
   - Test: Toggle-State-Sync mit URL

5. **AC-5 (Methodik-Disclosure + Editorial-Disclaimer):**
   **Given** Story-2.9a Methodik-Doku und Anti-Black-Box-Prinzip
   **When** Page rendert
   **Then**:
   - Oberhalb der Tabelle: Disclosure-Komponente „Wie wird der Score berechnet?" (re-use existierende `ui/disclosure.svelte` Bits-UI-Pattern)
   - Disclosure-Body: 5-Dimensionen-Kurzfassung, Aggregations-Hinweis (542 LOR-PR → 138 BR → 12 Bezirk, Flächen-gewichtet), Link „Vollständige Methodik" auf `/methodik/kiez-score`
   - Editorial-Disclaimer-Banner am Page-Top (zwischen H1 und Tabelle): „Score ist statistisch, nicht normativ. Lebensqualität bemisst sich an persönlichen Prioritäten." (DE) / EN-Pendant
   - Editorial-Disclaimer-Variant aus `editorial-config.ts` (re-use Pattern aus Story 1.12) — neue Variant `kiez-score-ranking-disclaimer` oder re-use existing `kiez-score-explainer` aus 1.28
   - Stolperstein-Würde-Anlehnung: KEINE „beste Adresse"-Sprache, neutral „höchster Score" stattdessen
   - Test: Disclaimer-Render-Snapshot

6. **AC-6 (SEO + JSON-LD):**
   **Given** Story 2.1 SeoHead, Story 2.2 JsonLd-Generators
   **When** ich Page mit Structured-Data ausstatte
   **Then**:
   - `<SeoHead title pageTitle description={pageDescription} canonical locale ogImage />` mit ogImage `/og/page/wo-lebt-es-sich-gut.{locale}.png` (Story 2.6 generiert)
   - `<JsonLd data={datasetJsonLd} testid="ranking-dataset-jsonld" />` via `buildDataset({name: 'Kiez-Score Ranking Berlin', description, license: 'CC BY 4.0', dateModified: kiezScore.computedAt, ...})`
   - `<JsonLd data={itemListJsonLd} testid="ranking-itemlist-jsonld" />` als `ItemList` mit Top-30-Kiezen als `ListItem`-Array (`@type: 'ListItem', position, item: {@type: 'Place', name, url}`)
   - `<JsonLd data={breadcrumbJsonLd} />` `Berlin → Ranking`
   - Sitemap-Source ergänzen: `RANKING_PAGE_SOURCE` in `src/lib/seo/sources/ranking-page.ts`
   - llms.txt-Eintrag (Story 2.8) registriert Ranking-Page
   - Tests Snapshot pro Locale

7. **AC-7 (Editorial + Stigma-Schutz):**
   **Given** Memory + Story 2.5b/2.8 Stigma-Lint-Pattern
   **When** Page-Inhalte gerendert werden
   **Then**:
   - Begriff „lebenswert/Lebensqualität" NIRGENDS (Lint-Check)
   - Soziale-Lage-Dimension: NUR als Spalten-Wert, NICHT als alleiniger Sortier-Default; Sortier per Soziale-Lage ist technisch erlaubt (Tabellen-Sortier), aber Default ist `overall`
   - Bei Sortier per Soziale-Lage: Disclaimer-Banner-Erweiterung „Soziale Lage ist Aggregat, kein Bewertungs-Filter."
   - Page setzt KEIN Composite-Score-Choropleth (keine Karte hier, nur Tabelle)
   - „Schlechtester Kiez"-Framing vermeiden: Sortier-Toggle nutzt „Score hoch → niedrig" / „niedrig → hoch", nicht „best/worst"

8. **AC-8 (TDD-Mandat + E2E):**
   **Given** ADR-012
   **When** ich diese Story implementiere
   **Then**:
   - AC-2: Loader-Snapshot pro View (Kieze/Bezirke) + Sort-Param-Tests
   - AC-3: Komponenten-Test `score-ranking-table.svelte` mit Fixture
   - AC-4: View-Toggle-Tests (URL-State-Sync)
   - AC-5: Disclosure-Render + Disclaimer-Snapshot
   - AC-6: JSON-LD-Snapshot pro Block
   - AC-7: Stigma-Lint-Test gegen Page-Source
   - E2E `tests/e2e/ranking-page.e2e.ts`: Page lädt ohne JS, Tabelle sichtbar, Sortier funktioniert nach Hydration, axe-Check
   - Coverage-Ziel: Komponente ≥80%, Loader ≥90%

## Tasks / Subtasks

- [ ] **T1: Route + Loader** (AC: 1, 2, 8)
  - [ ] T1.1: `routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte` + `+page.server.ts` mit `prerender = true`
  - [ ] T1.2: Loader liest `bezirk_score` + `kiez_score` via Story-2.9a-Queries
  - [ ] T1.3: Sort/View-Param-Parsing aus URL
  - [ ] T1.4: Top-30 + insufficient-data-Handling
  - [ ] T1.5: Loader-Snapshot-Tests

- [ ] **T2: Ranking-Tabelle Komponente** (AC: 3, 4, 8)
  - [ ] T2.1: `src/lib/components/atlas/score-ranking-table.svelte` mit Spalten + Sortier
  - [ ] T2.2: Optional `score-ranking-row.svelte` falls LOC-Limit
  - [ ] T2.3: URL-Sync via `goto({replaceState: true})`
  - [ ] T2.4: Soziale-Lage-Spalte Strukturell-Stil (Story 1.31 Family-Mapping)
  - [ ] T2.5: View-Toggle-UI
  - [ ] T2.6: Tastatur-Bedienung + axe-Check
  - [ ] T2.7: Komponenten-Tests

- [ ] **T3: Methodik-Disclosure + Disclaimer** (AC: 5, 7, 8)
  - [ ] T3.1: Disclosure-Section am Page-Top
  - [ ] T3.2: Editorial-Disclaimer-Variant (neu oder re-use)
  - [ ] T3.3: Stigma-Lint-Test gegen Page-Source

- [ ] **T4: SEO + JSON-LD + Sitemap** (AC: 6, 8)
  - [ ] T4.1: SeoHead-Einbindung (Story 2.1)
  - [ ] T4.2: Dataset + ItemList + Breadcrumb-JSON-LD via Story-2.2-Generators
  - [ ] T4.3: `RANKING_PAGE_SOURCE` für Sitemap + llms.txt
  - [ ] T4.4: Snapshot-Tests

- [ ] **T5: E2E + Final-Verifikation** (AC: 1-8)
  - [ ] T5.1: `tests/e2e/ranking-page.e2e.ts` no-JS + Sortier-Smoke + axe
  - [ ] T5.2: `pnpm test:unit -- --run` 100% grün
  - [ ] T5.3: `pnpm check` 0 Errors
  - [ ] T5.4: `pnpm build` läuft, 2 HTML-Files prerendered
  - [ ] T5.5: Browser-Verify (DE + EN), Sortier-Toggle + View-Toggle, OG-Card im Sharing-Test
  - [ ] T5.6: Sprint-Status-Eintrag

## Dev Notes

### EN-URL-Wording (Open-Question 1)

| Variante | URL | H1 | Kommentar |
|----------|-----|-----|-----------|
| A | `/en/where-life-is-good` | „Where life is good in Berlin?" | folgt DE-Wortlaut |
| B | `/en/quality-of-life-ranking` | „Quality-of-life ranking Berlin" | SEO-stärker, neutral |
| C | `/en/kiez-score-ranking` | „Kiez Score Ranking Berlin" | Brand-Term, klar |

**Empfehlung B** für SEO-Volumen; falls Brand-Term gewünscht (C). „lebenswert/quality of life" ist OK auf EN (no NS-Belastung), aber Disclaimer bleibt.

### Sortier-Param-Konvention

URL `?view=kieze&sort=overall&dir=desc`. Sort-Keys = Dimension-IDs aus 1.28 (`ruhe-luft`, `gruen`, `mobilitaet`, `soziale-lage`, `versorgung`) plus `overall`. Validierung auf Server-Side gegen Whitelist (kein Reflektion-XSS).

### Soziale-Lage als Sortier-Option

Soziale-Lage ist eine der 5 Dimensionen. Sortier-Toggle muss sie technisch erlauben (sonst inkonsistent). Aber UX-Disziplin:

- Default ist `overall` (nie `soziale-lage`)
- Bei aktivem Sort `soziale-lage`: Disclaimer-Banner-Erweiterung wird sichtbar
- Spalten-Werte bleiben Strukturell-Stil (Plex-Mono Zahl, kein Severity-Indikator)

### Karte vs. nur Tabelle

Epic-AC verlangt nur Tabelle. KEINE Karte auf der Ranking-Page (würde Composite-Score-Choropleth implizieren, gegen Memory). Falls User Karte will: separate Folge-Story.

### Top-30 vs. Top-N

Phase 1 hart Top-30 (Epic-AC). Phase 2 könnte „Mehr anzeigen"-Pagination + Filter (Bezirk-Filter, Dimension-Filter). Nicht in 2.9b.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Komponente splitten falls nötig
- **#3 Bestehende Funktionen prüfen:** `getBezirkScore`/`getKiezScore` (2.9a), `Disclosure` (1.x), SeoHead (2.1), JsonLd (2.2), `editorial-disclaimer` (1.12)
- **#7 TypeScript strict:** Sort-Param-Validation typed
- **#10 Cookieless:** keine Cookies
- **#13 A11y-First:** Tastatur + axe 0 Violations
- **#14 i18n-First:** Title/Description/Disclaimer via Paraglide
- **#21 prerender:** AC-1 enforced

### Open-Questions vor Dev-Start

1. **EN-URL-Wording:** A/B/C aus Dev-Notes. Empfehlung B.
2. **Top-N-Cutoff:** Top-30 hart oder Top-50? Epic-AC sagt Top-30, OK?
3. **Karte auf Ranking-Page:** raus oder dezente Berlin-Karte mit nur Bezirks-Boundary als Visual-Anker? Empfehlung raus.
4. **„Mehr anzeigen"-Pagination:** Phase 2 oder MVP-Stretch? Empfehlung Phase 2.
5. **Soziale-Lage als Sortier-Option:** erlauben + Disclaimer (Recommendation), oder Sortier-Button für diese Spalte deaktivieren? Empfehlung erlauben + Disclaimer.

### Project Structure Notes

- Route: `src/routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte` + `+page.server.ts`
- EN-Reroute via Paraglide; URL-Mapping via `src/lib/paraglide/runtime`
- Komponente: `src/lib/components/atlas/score-ranking-table.svelte` (+ optional `score-ranking-row.svelte`)
- Sitemap-Source: `src/lib/seo/sources/ranking-page.ts`
- Editorial-Disclaimer-Variant: in `editorial-config.ts` ergänzen (oder re-use)

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1337-L1365](../planning-artifacts/epics.md)
- Story 2.9a: [./2-9a-kiez-score-bezirks-score-aggregat-berechnung.md](./2-9a-kiez-score-bezirks-score-aggregat-berechnung.md)
- Story 1.28: [./1-28-livability-index.md](./1-28-livability-index.md)
- Story 2.1 + 2.2 + 2.6 + 2.8: jeweilige Story-Files
- Memory `feedback_no_lebenswert.md`, `project_kiez_score_naming.md`
- Methodik-Page: [src/routes/(with-header)/methodik/kiez-score/+page.svelte](../../src/routes/(with-header)/methodik/kiez-score/+page.svelte) (Story 1.28)

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
