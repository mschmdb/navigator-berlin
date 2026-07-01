# Story 13.7: Epic-13-Dokumentation + Updates-Eintrag (Owner + LLM + User)

Status: ready-for-dev

> **Anker:** Abschluss-Story Epic 13. Epic-7-Doku-Muster + User-facing `/updates`-Changelog (Story 2.13). Läuft zuletzt, nach 13.0–13.6.
> **Hard-Block:** Alle anderen Epic-13-Stories. Insbesondere 13.3 (Kultur befüllt), 13.5 (Methodik/ADR).

## Story

As a Solo-Maintainer,
I want Epic 13 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag auf `/updates` veröffentlicht,
so that kein Wissens-Drift entsteht (Epic-7-Muster) und Nutzer den neuen Kultur-Score verstehen.

## Kontext: Warum dieser Change

Epic 13 hat Kultur als 6. Score-Dimension eingeführt (Option C: eigenständig, nicht im Gesamt-Score). 13.5 hat scoring-methodology + ADR + Methodik-Page gemacht. Diese Story schließt das Epic ab: Pipeline-Atlas + Story-Map + System-Map neu generieren (Kultur-Layer + 6. Dimension sichtbar), Doku-Konsistenz prüfen (sechs Dimensionen, fünf im Gesamt-Score, Kultur separat), und einen redaktionellen `/updates`-Eintrag schreiben, der den Kultur-Score in Nutzersprache erklärt.

## Acceptance Criteria

1. **AC-1 (Generatoren + Pipeline-Atlas + System-Map):**
   **Given** die 6. Dimension + die neuen OSM-Kultur-Layer
   **When** `pnpm doc:pipelines` + `pnpm doc:story-map` laufen
   **Then** die Kultur-Layer + die 6. Dimension erscheinen im Data-Flow-Doc, die Story-Map enthält Epic 13, `docs/INDEX.md` + `docs/architecture/system-map.md` verweisen darauf, Frontmatter gesetzt

2. **AC-2 (Doku-Konsistenz):**
   **Given** scoring-methodology + ADR aus 13.5
   **When** die Konsistenz geprüft wird
   **Then** die Unterscheidung „sechs Dimensionen / fünf im Gesamt-Score" (Kultur separat, Option C) ist überall konsistent; keine Stelle behauptet Kultur sei im Composite
   **And** Center-Bias-Dämpfung + editoriale Ausschlüsse (Memorial/Heritage, Sammlungsdaten, Clubkataster) + der Composite-Ausschluss (Option C) sind in der Doku festgehalten

3. **AC-3 (Updates-Eintrag):**
   **Given** die `/updates`-Route
   **When** ein redaktioneller Changelog-Eintrag geschrieben wird
   **Then** existiert `_content/updates/2026-MM-DD-kultur-score.md` mit gültigem Frontmatter (`title_de` ≤ 80, `summary_de` ≤ 160, `date` ISO, `category: feature`, `tags` ≤ 8 kebab)
   **And** der Body erklärt die Kultur-Dimension in Nutzersprache (Bibliothek/Theater/Museum/Kino/Galerie/Soziokultur in Reichweite), nennt die OSM-Quelle, erwähnt fair den Center-Bias (Kultur ballt sich in der Innenstadt), ordnet Kultur als eigene Dimension neben dem Gesamt-Score ein (nicht darin enthalten, Option C), verlinkt `/methodik/kiez-score`
   **And** er hält die Forbidden-Token-Konvention (keine em-dashes, kein „lebenswert", keine Infra-/Stack-Interna)

4. **AC-4 (Feeds + Render):**
   **Given** der Eintrag
   **When** `/updates`, `/updates/[slug]` + Feeds prerendern
   **Then** der Eintrag erscheint chronologisch oben, Feed-Tests + `updates`-Sitemap-Source-Test grün, kein Build-Fehler

## Tasks / Subtasks

- [ ] **Task 1: Generatoren + INDEX + System-Map** (AC: #1)
  - [ ] 1.1 `pnpm doc:pipelines` — Kultur-Layer + 6. Dimension im Atlas
  - [ ] 1.2 `pnpm doc:story-map` — Epic 13 in der Story-Map
  - [ ] 1.3 `docs/INDEX.md` + `docs/architecture/system-map.md` Verweise, Frontmatter

- [ ] **Task 2: Konsistenz-Sweep** (AC: #2)
  - [ ] 2.1 Grep-Sweep (auch Docs): Kultur nirgends als Gesamt-Score-Bestandteil dargestellt; „fünf im Gesamt" / „sechs gesamt" konsistent
  - [ ] 2.2 Dämpfung + Ausschlüsse in scoring-methodology + ADR (aus 13.5) verifizieren

- [ ] **Task 3: Updates-Eintrag schreiben** (AC: #3)
  - [ ] 3.1 `_content/updates/2026-MM-DD-kultur-score.md` (Datum = Merge-Tag). Frontmatter: `title_de`, `summary_de`, `date`, `category: feature`, `tags: [kiez-score, kultur, score, osm, dimension]`
  - [ ] 3.2 Body redaktionell: neue 6. Dimension Kultur, was zählt (Kulturorte in Reichweite), OSM-Quelle, fairer Center-Bias-Hinweis, Verweis `/methodik/kiez-score`
  - [ ] 3.3 Forbidden-Token-Check gegen `scripts/publish-update/forbidden-tokens.ts`

- [ ] **Task 4: Verify** (AC: #4)
  - [ ] 4.1 `pnpm test` (updates-Loader, Feeds, sitemap) grün
  - [ ] 4.2 Build: `/updates` + Feeds prerendern fehlerfrei

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

Identische Updates-Mechanik wie Story 12.6:
- Schema `src/lib/content/updates/frontmatter-schema.ts` (`title_de` ≤80, `summary_de` ≤160, `category` Enum inkl. `feature`, `tags` ≤8 kebab).
- Loader `load-updates.ts`, Routen `/updates` + `[slug]` + Feeds, SEO-Source `src/lib/seo/sources/updates.ts`.
- Vorbild `_content/updates/2026-05-21-umwelt-infrastruktur-score.md` (Score-Feature-Eintrag, Stil-Vorlage).
- Generatoren `doc:pipelines` / `doc:story-map` (Line-Parse von `sprint-status.yaml` → 13-x-Format stabil halten).
- Forbidden-Tokens `scripts/publish-update/forbidden-tokens.ts`.

### Updates-Body: Center-Bias fair kommunizieren

Der Eintrag soll den Center-Bias offen nennen (Kulturinfrastruktur ist innenstadt-lastig, Außenbezirke scoren niedriger). Das ist Teil der ehrlichen, nicht-stigmatisierenden Kommunikation: niedriger Kultur-Wert = weniger Kulturorte in Reichweite, keine Wertung der Bewohner. Analog zum „Nicht im Score"-Abschnitt des Vorbild-Eintrags.

### Abgrenzung zu 13.5

13.5 = scoring-methodology + Methodik-Page + ADR + Server-Loader. 13.7 = Generatoren/Pipeline-Atlas/System-Map + Konsistenz-Sweep + `/updates`-Eintrag. Kein Doppel-Edit: 13.7 verifiziert 13.5.

### Architektur-Compliance

- Content-First-Doku, kein Auto-Hook. Keine em-dashes. DE-only. no-ai-slop + de-konzept-Stil im Updates-Body.

### Was nicht brechen darf

- `doc:story-map` Line-Parse → 13-x-Zeilen-Format stabil.
- Frontmatter-Limits.

## References

- `src/lib/content/updates/frontmatter-schema.ts`, `load-updates.ts`
- `_content/updates/2026-05-21-umwelt-infrastruktur-score.md` (Stil-Vorbild)
- `src/routes/(with-header)/updates/`, `src/routes/updates/{rss,atom,feed}`
- `src/lib/seo/sources/updates.ts`
- `scripts/generate-data-flow-doc.ts`, `scripts/generate-story-map.ts`
- `scripts/publish-update/forbidden-tokens.ts`
- `docs/INDEX.md`, `docs/architecture/system-map.md`, `docs/scoring-methodology.md`
- `_bmad-output/implementation-artifacts/11-10-epic-11-dokumentation.md` (Doku-Muster)
- `_bmad-output/implementation-artifacts/13-5-content-migration-methodik-adr.md` (Abgrenzung)

## Dev Agent Record

### Agent Model Used

_(auszufüllen)_

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-07: Story 13.7 erstellt (ready-for-dev). Epic-13-Doku-Closure (Generatoren, INDEX, System-Map, Konsistenz) + redaktioneller `/updates`-Eintrag zum Kultur-Score inkl. fairem Center-Bias-Hinweis.
