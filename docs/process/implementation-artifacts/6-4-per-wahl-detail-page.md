# Story 6.4: Per-Wahl-Detail-Page

Status: in-progress

<!-- Created 2026-05-18. Blocked by 6-0 (Queries) + 6-2 (Geometrien). 12 prerendered Routes Phase 1 DE-only. -->

## Story

As a Datenjournalist und Suchender,
I want pro Wahl eine prerenderte Detail-Page mit Choropleth-Karte + Berlin-Gesamt-Stacked-Bar + Top-12-Bezirks-Tabelle + Methodik-Verweis,
so that ich Berlin-weite Wahl-Verteilung pro Wahl-Jahr und Wahl-Typ in einer zitierbaren URL `/wahl/{slug}` sehen kann.

## Quellen

- **Story 6.0:** `get-results-for-bezirk` + `get-results-for-berlin` + `get-wahl-list`.
- **Story 6.2:** Wahlbezirks-Geometrien für Choropleth (nur 2017+).
- **Story 5.9:** `buildDataset` + `buildBreadcrumbList` Reuse für SEO-JSON-LD.
- **Story 2.6 OG-Pipeline:** Satori-Card pro Wahl-Page.
- **Memory `project_i18n_phase_1_de_only`:** EN out-of-scope.

## Acceptance Criteria

**AC-1 (12 prerendered Routes):**

**Given** die 12 aktiven Wahlen (4 BTW + 4 AGH + 4 BVV)
**When** ich `routes/(with-header)/wahl/[slug]/+page.svelte` + `+page.server.ts` mit `prerender = true` + `entries`-Generator (slug-Format `{jahr}-{typ}` z.B. `2025-btw`) implementiere
**Then** alle 12 Wahl-URLs sind prerendered (`/wahl/2025-btw`, `/wahl/2021-bvv` etc.)
**And** Sitemap-Source `WAHL_DETAIL_SOURCE` registriert (priority 0.7, changefreq yearly)

**AC-2 (Choropleth-Karte):**

**Given** Wahl mit Stimmbezirks-Geometrie (2017+) UND Stimmbezirks-Ergebnissen
**When** Page rendert
**Then** MapLibre-Choropleth zeigt stärkste-Partei pro Stimmbezirk via Partei-Farben + Opazität nach Stimmen-Anteil
**And** Inspector-Click pro Stimmbezirk öffnet Tooltip mit Top-3 + Wahlbeteiligung

**AC-3 (pre-2017-Fallback):**

**Given** pre-2017-Wahl ohne Stimmbezirks-Geometrie
**When** Page rendert
**Then** Choropleth fällt auf Bezirks-Geometrie zurück (12 Polygone)
**And** Disclaimer-Banner: „Stimmbezirks-Geometrie nicht verfügbar vor 2017, Karte zeigt Bezirks-Aggregat"

**AC-4 (Berlin-Stacked-Bar + Top-12-Bezirks-Tabelle):**

**Given** Berlin-Gesamt-Aggregat + 12 Bezirks-Aggregate
**When** Page rendert
**Then** horizontale Stacked-Bar zeigt Berlin-Gesamt-Top-5 + Wahlbeteiligung
**And** Tabelle listet 12 Bezirke mit Top-3-Parteien + Wahlbeteiligung pro Bezirk + Link auf jeweilige Bezirks-Seite

**AC-5 (SEO + JSON-LD):**

**Given** Story-5.9-Builders
**When** Page rendert
**Then** SeoHead mit ogImage `/og/wahl/{slug}.png` + Dataset-JSON-LD (license=CC-BY, creator=Landeswahlleitung-Berlin oder Bundeswahlleiterin) + BreadcrumbList (Berlin › Wahlen › {Name})

**AC-6 (OG-Card via Satori):**

**Given** OG-Pipeline aus Story 2.6 + 5.9
**When** Build läuft (`pnpm og:images`)
**Then** pro Wahl wird `/og/wahl/{slug}.png` generiert: Stacked-Bar Berlin-Gesamt + Wahl-Typ + Jahr als Hero + Berlin-Outline-Watermark

**AC-7 (Wiederholungswahl-Marker):**

**Given** AGH 2023 mit `is_repeat_election = true`
**When** Page rendert
**Then** Badge „Wiederholungswahl der AGH 2021" + Link auf `/wahl/2021-agh`

## Tasks/Subtasks

- [ ] T1: `routes/(with-header)/wahl/[slug]/+page.server.ts` mit prerender + entries + load
- [ ] T2: `routes/(with-header)/wahl/[slug]/+page.svelte` Layout
- [ ] T3: `src/lib/components/atlas/wahl-choropleth.svelte` MapLibre-Komponente
- [ ] T4: `src/lib/components/atlas/wahl-bezirks-table.svelte` Tabelle
- [ ] T5: pre-2017-Fallback-Logic
- [ ] T6: `WAHL_DETAIL_SOURCE` in Sitemap-Builder
- [ ] T7: Satori-OG-Card-Template + Generator-Integration (Story 2.6 reuse)
- [ ] T8: Tests + E2E

## Dev Notes

- **MapLibre-Konfig:** Existing map-base reuse. Choropleth-Style als data-driven-expression via `match` auf Partei-ID.
- **Color-Scale:** Partei-Farben aus Story 6.3 `partei-farben.ts`. Opazität-Mapping anteil → 0.4..1.0.
- **Sitemap-Priority 0.7** weil Detail-Page, aber niedriger als Bezirk/Kiez weil seltener gefragt.
