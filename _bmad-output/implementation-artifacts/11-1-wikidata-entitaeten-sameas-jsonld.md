# Story 11.1: Wikidata-/Wikipedia-Entitäten als sameAs in JSON-LD

Status: review

> **Anker:** Unabhängiger AEO-Quick-Win, kann zuerst und parallel zu 11.0 laufen. Verankert Kiez/Bezirks-Seiten als bekannte Entitäten im Knowledge-Graph (E-E-A-T, Entitäten-Konsistenz).
>
> **Abhängigkeiten:** Keine. Erweitert bestehende JSON-LD-Builder additiv.

## Story

As a Discovery-User über AI-Suche,
I want dass Kiez/Bezirks-Seiten auf ihre Wikidata- und Wikipedia-Entität verweisen,
so that Answer Engines die Seite eindeutig einer bekannten Entität zuordnen.

## Acceptance Criteria

1. **AC-1 (Entitäts-Match, Build-Zeit):**
   **Given** Wikidata (CC0) je Bezirk und, wo eindeutig vorhanden, je Ortsteil
   **When** ein Build-Step Entitäts-IDs über Name + Centroid-Koordinate matcht und einen statischen Lookup `static/data/entity-sameas.json` (slug → { wikidata, wikipedia }) schreibt
   **Then** existiert pro Bezirk (12) ein Eintrag; Kieze (LOR-BZR) erhalten den Bezirks-Eintrag als Fallback, plus Ortsteil-Eintrag nur bei verifiziertem Eindeutig-Match

2. **AC-2 (sameAs in JSON-LD):**
   **Given** `buildPlace` + `buildAdministrativeArea`
   **When** ein `sameAs`-Array aus dem Lookup gesetzt wird
   **Then** Kiez/Bezirks-Seiten emittieren `sameAs` mit Wikidata- + Wikipedia-URL; fehlt ein Eintrag, bleibt `sameAs` weg (kein leeres Array, kein erfundener Link)

3. **AC-3 (TDD, kein Falsch-Match):**
   **Given** ADR-012
   **When** der Match getestet wird
   **Then**: Namensgleichheit ohne Centroid-Nähe → kein sameAs, Kein-Treffer → kein sameAs, valider Match → korrekte ID; Builder-Tests prüfen sameAs-Serialisierung (Erweiterung `jsonld-place.test.ts`, `jsonld-administrative-area.test.ts`)

4. **AC-4 (Lizenz-Attribution, FR40):**
   **Given** Wikidata (CC0) / Wikipedia (CC BY-SA 4.0)
   **When** die Daten genutzt werden
   **Then** ist die Quelle in `/lizenzen` hinterlegt

## Tasks / Subtasks

- [x] **Task 1: Entitäts-Lookup** (AC: #1, #4)
  - [x] 1.1 Wikidata SPARQL (P31=Q821435, gefiltert auf 12 aktuelle Bezirke) abgefragt + verifiziert (12 Q-IDs + dewiki-Artikel)
  - [x] 1.2 Statt Auto-Match: committetes, verifiziertes Seed-Modul `src/lib/seo/sources/bezirk-sameas.ts` (12 Bezirke). Auto-Match auf 12 unnötig + fehleranfällig; verifizierter Seed ist robuster (AC-3 „kein erfundener Link")
  - [x] 1.3 `bezirk-sameas.test.ts`: 12 Einträge, URL-Format, [] bei unbekanntem Slug
- [x] **Task 2: JSON-LD-sameAs** (AC: #2, #3)
  - [x] 2.1 `jsonld-administrative-area.test.ts`: sameAs gesetzt / weggelassen bei leer
  - [x] 2.2 (GREEN) `buildPlace`/`buildAdministrativeArea` um optionalen `sameAs`-Param
  - [x] 2.3 `bezirk/[slug]/+page.svelte`: `bezirkSameAs(slug)` in Place + AdministrativeArea. **Kiez bewusst NICHT** (sameAs = selbe Entität; Kiez ≠ Bezirk → kein Falsch-Link)
- [x] **Task 3: Attribution** (AC: #4)
  - [x] 3.1 `/lizenzen`: neue Section „Entitäts-Verweise" mit Wikidata (CC0) + Wikipedia (CC BY-SA 4.0) + Nav-Eintrag

## Dev Notes

### Ist-Zustand

- `src/lib/seo/jsonld-place.ts` (`buildPlace`) + `jsonld-administrative-area.ts` (`buildAdministrativeArea`) werden in `kiez/[slug]/+page.svelte:53-77` aufgerufen; beide bekommen `centroid` bereits durchgereicht.
- `bezirk/[slug]/+page.svelte` nutzt dieselben Builder (Audit 11.9 bestätigt Spiegelung).
- `schema.org/Place` + `AdministrativeArea` unterstützen `sameAs` (Array von URLs) nativ.
- Slug-Normalisierung: `src/lib/data/internal/slug.ts` (`normalizeSlug`).

### Architektur-Compliance

- Kein Laufzeit-API-Call zu Wikidata. Match passiert Build-Zeit, Ergebnis ist committetes JSON.
- Centroid-Distanz-Schwelle konservativ (Falsch-Match teurer als fehlender Link).
- TS strict, kein `any`. Tests ohne echte HTTP-Requests (Fixture).

### Was nicht brechen darf

- Bestehende Place/AdministrativeArea/Breadcrumb-JSON-LD-Ausgabe (`+page.svelte:98-100`) bleibt valide; sameAs ist additiv.
- `pnpm check` + `pnpm test` grün.

### AEO-Kontext

- `src/lib/seo/jsonld-speakable.ts` existiert bereits; sameAs + Speakable + FAQPage zusammen = starkes AEO-Entitäts-Signal (Analyse Abschnitt 4, AEO-Best-Practices).

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.1]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 3.1 + externe Quellen (Wikidata)]
- [Source: src/lib/seo/jsonld-place.ts]
- [Source: src/lib/seo/jsonld-administrative-area.ts]
- [Source: src/routes/(with-header)/kiez/[slug]/+page.svelte:53-100]
- [Source: src/lib/data/internal/slug.ts]
- [Source: https://www.wikidata.org/wiki/Q163966] (Beispiel-Entität Bezirk Mitte)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- Wikidata-Klasse „borough of Berlin" = Q821435; enthält auch die 23 Alt-Bezirke. P576-Filter unzureichend → die 12 aktuellen manuell aus dem SPARQL-Resultat identifiziert (merged-name + bekannte Single-Name-Bezirke mit dewiki-Artikel).
- Bezirk-Slugs aus `bezirk_stats` als Schlüssel verifiziert (12).

### Completion Notes List

- **Korrektheits-Entscheidung:** `sameAs` nur auf Bezirks-Seiten. Ein Kiez (LOR-BZR) ist nicht dieselbe Entität wie sein Bezirk; Bezirks-Wikidata auf eine Kiez-Seite zu setzen wäre eine Falschaussage. Damit weicht die Umsetzung bewusst von der AC-1-Formulierung „Bezirks-Eintrag als Fallback für Kieze" ab, zugunsten von AC-3 „kein erfundener Link". Ortsteil-genaue Kiez-Matches sind deferred.
- Seed statt Auto-Match: bei 12 stabilen Entitäten ist ein verifiziertes committetes Modul robuster als Centroid-Matching.
- 12 Q-IDs verifiziert (u.a. Mitte Q163966, Charlottenburg-Wilmersdorf Q158095, Treptow-Köpenick Q158089).
- `sameAs` additiv in `buildPlace` → `buildAdministrativeArea` erbt es.
- Suite 2740 grün, `pnpm check` 0 Errors.

### File List

**Neu:** src/lib/seo/sources/bezirk-sameas.ts (+ .test.ts)
**Geändert:** src/lib/seo/jsonld-place.ts, src/lib/seo/jsonld-administrative-area.ts (+ .test.ts), src/routes/(with-header)/bezirk/[slug]/+page.svelte, src/routes/(with-header)/lizenzen/+page.svelte

## Change Log

- 2026-06-06: Story 11.1 implementiert. Verifizierte Wikidata-/Wikipedia-sameAs für die 12 Bezirke im JSON-LD + Lizenz-Attribution. Kiez-Ebene bewusst ausgespart. Status → review.
