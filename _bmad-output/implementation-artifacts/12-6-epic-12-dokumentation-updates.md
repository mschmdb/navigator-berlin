# Story 12.6: Epic-12-Dokumentation + Updates-Eintrag (Owner + LLM + User)

Status: review

> **Anker:** Abschluss-Story Epic 12. Epic-7-Doku-Muster (`project_epic_7_approach`: Narrative von Hand, Derivable via Generator, KEIN Auto-Hook) + User-facing `/updates`-Changelog (Story 2.13). Läuft zuletzt, nach 12.0–12.5.
> **Hard-Block:** Alle anderen Epic-12-Stories (dokumentiert deren Ergebnis). Insbesondere 12.3 (finale Gewichte) + 12.4 (Methodik/ADR).

## Story

As a Solo-Maintainer,
I want Epic 12 im `docs/`-Tree dokumentiert und als User-facing Changelog-Eintrag auf `/updates` veröffentlicht,
so that kein Wissens-Drift entsteht (Epic-7-Muster) und Nutzer die erweiterte Versorgung verstehen.

## Kontext: Warum dieser Change

Epic 12 hat die Versorgungs-Dimension um Alltagsökonomie (OSM-Nahversorgung) erweitert. 12.4 hat scoring-methodology + ADR + Methodik-Page gemacht. Diese Story schließt das Epic ab: Pipeline-Atlas + Story-Map neu generieren (neue Layer sichtbar machen), Doku-Konsistenz prüfen, und einen redaktionellen `/updates`-Eintrag schreiben, der die erweiterte Versorgung in Nutzersprache erklärt.

## Acceptance Criteria

1. **AC-1 (Generatoren + Pipeline-Atlas):**
   **Given** die neuen OSM-Nahversorgungs-Layer + die erweiterte Versorgungs-Dimension
   **When** `pnpm doc:pipelines` + `pnpm doc:story-map` laufen
   **Then** die neuen Layer (`nahversorgung-lebensmittel/-apotheke/-post`) erscheinen im Data-Flow-Doc, die Story-Map enthält Epic 12, `docs/INDEX.md` verweist auf die Änderungen, Frontmatter (`type/audience/last-verified`) je neuer/geänderter Datei gesetzt

2. **AC-2 (Doku-Konsistenz):**
   **Given** scoring-methodology + ADR aus 12.4
   **When** die Konsistenz geprüft wird
   **Then** sind Methodik + ADR verlinkt und stimmig, keine „Versorgung = nur Daseinsvorsorge"-Stelle übrig (Grep = 0)

3. **AC-3 (Updates-Eintrag):**
   **Given** die `/updates`-Route (`_content/updates/YYYY-MM-DD-{slug}.md`)
   **When** ein redaktioneller Changelog-Eintrag geschrieben wird
   **Then** existiert `_content/updates/2026-MM-DD-nahversorgung-versorgung.md` mit gültigem Frontmatter (`title_de` ≤ 80, `summary_de` ≤ 160, `date` ISO, `category: feature`, `tags` ≤ 8 kebab)
   **And** der Body erklärt die Nahversorgungs-Terme (Supermarkt, Apotheke, Post) + die Umgewichtung in Nutzersprache, verlinkt `/methodik/kiez-score`
   **And** er hält die Forbidden-Token-Konvention (keine em-dashes, kein „lebenswert", keine Infra-/Stack-Interna, keine €/m²-Mietpreise)

4. **AC-4 (Feeds + Render):**
   **Given** der Eintrag
   **When** `/updates`, `/updates/[slug]` + Feeds (rss.xml/atom.xml/feed.json) prerendern
   **Then** der Eintrag erscheint chronologisch oben, Feed-Tests + `updates`-Sitemap-Source-Test grün, kein Build-Fehler durch Frontmatter-Validierung

## Tasks / Subtasks

- [x] **Task 1: Generatoren + INDEX** (AC: #1)
  - [x] 1.1 `pnpm doc:pipelines` (`scripts/generate-data-flow-doc.ts`) — neue Layer im Atlas verifizieren
  - [x] 1.2 `pnpm doc:story-map` (`scripts/generate-story-map.ts`) — Epic 12 in der Story-Map
  - [x] 1.3 `docs/INDEX.md` Verweise ergänzen, Frontmatter prüfen/setzen

- [x] **Task 2: Konsistenz-Sweep** (AC: #2)
  - [x] 2.1 Grep nach „nur Daseinsvorsorge" / veralteten Versorgungs-Beschreibungen = 0
  - [x] 2.2 scoring-methodology + ADR (aus 12.4) verlinkt + stimmig

- [x] **Task 3: Updates-Eintrag schreiben** (AC: #3)
  - [x] 3.1 `_content/updates/2026-MM-DD-nahversorgung-versorgung.md` (Datum = Merge-Tag). Frontmatter: `title_de`, `summary_de`, `date`, `category: feature`, `tags: [kiez-score, versorgung, nahversorgung, score, osm]`
  - [x] 3.2 Body redaktionell (no-ai-slop + de-konzept-Stil): was neu (Supermarkt/Apotheke/Post zählen jetzt), warum (Alltagsökonomie als Lebensqualität), Verweis `/methodik/kiez-score`. Quelle OSM/ODbL nennen
  - [x] 3.3 Forbidden-Token-Check gegen `scripts/publish-update/forbidden-tokens.ts` (manuell oder via Skill)

- [x] **Task 4: Verify** (AC: #4)
  - [x] 4.1 `pnpm test` (updates-Loader, Feed-Tests, `seo/sources/updates.test.ts`) grün
  - [x] 4.2 `pnpm check` / Build: `/updates` + Feeds prerendern ohne Fehler

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

- **Updates-Mechanik:** `_content/updates/YYYY-MM-DD-{slug}.md`, geladen via `import.meta.glob` → `load-updates.ts` (`loadUpdatesFromModules`). Frontmatter-Schema `src/lib/content/updates/frontmatter-schema.ts`: `title_de` ≤80, `summary_de` ≤160, `date` `YYYY-MM-DD`, `category` Enum (`daten-update|feature|methodik|datenquelle|lizenz`), `tags` ≤8 kebab, `lang` default `de`.
- **Routen:** `/updates` (`+page.server.ts/.svelte`), `/updates/[slug]`, Feeds `updates/rss.xml`, `atom.xml`, `feed.json`. SEO-Source `src/lib/seo/sources/updates.ts` (+test).
- **Vorbild-Eintrag:** `_content/updates/2026-05-21-umwelt-infrastruktur-score.md` (category `feature`, erklärt Score-Recomposition, verlinkt `/methodik/kiez-score`). Stil-Vorlage.
- **Generatoren:** `pnpm doc:pipelines` (`scripts/generate-data-flow-doc.ts`), `pnpm doc:story-map` (`scripts/generate-story-map.ts`, parst `sprint-status.yaml` per Line-Parse — Format der 12-x-Zeilen nicht verändern).
- **Forbidden-Tokens:** `scripts/publish-update/forbidden-tokens.ts` (em-dash, „lebenswert", Hetzner/Coolify/Traefik, env-vars, Commit-SHAs, €/m²).

### Abgrenzung zu 12.4

12.4 = scoring-methodology.md + Methodik-Page + ADR (Score-Semantik). 12.6 = Generatoren/Pipeline-Atlas + Konsistenz-Sweep + `/updates`-Eintrag (User-facing). Kein Doppel-Edit derselben Datei: 12.6 verifiziert 12.4-Ergebnis, ergänzt nicht.

### Architektur-Compliance

- **Content-First-Doku** (Memory `project_epic_7_approach`): Narrative von Hand, Derivable via Generator, kein Auto-Hook.
- **Keine em-dashes** in Docs + Updates (Projekt-Output-Konvention).
- **DE-only** (Memory `project_i18n_phase_1_de_only`): nur `title_de`/`summary_de`.
- Updates-Body folgt no-ai-slop + de-konzept-Stil (aktive Sprache, keine Floskeln).

### Was nicht brechen darf

- `doc:story-map` Line-Parse → 12-x-Zeilen-Format in `sprint-status.yaml` stabil.
- Frontmatter-Limits (title 80 / summary 160) — sonst Build-Fehler.

## References

- `src/lib/content/updates/frontmatter-schema.ts` (Schema), `load-updates.ts`
- `_content/updates/2026-05-21-umwelt-infrastruktur-score.md` (Stil-Vorbild)
- `src/routes/(with-header)/updates/`, `src/routes/updates/{rss,atom,feed}` (Routen)
- `src/lib/seo/sources/updates.ts` (Sitemap-Source)
- `scripts/generate-data-flow-doc.ts` (doc:pipelines), `scripts/generate-story-map.ts` (doc:story-map)
- `scripts/publish-update/forbidden-tokens.ts`
- `docs/INDEX.md`, `docs/scoring-methodology.md`
- `_bmad-output/implementation-artifacts/11-10-epic-11-dokumentation.md` (Doku-Muster)
- `_bmad-output/implementation-artifacts/12-4-methodik-doku-nahversorgung.md` (Abgrenzung)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Completion Notes List

- `pnpm doc:pipelines`: `docs/pipelines/data-flow.md` neu, die drei `nahversorgung-*`-Layer erscheinen (overpass, ODbL).
- `pnpm doc:story-map`: `docs/architecture/story-map.md` neu, Epic-12-Stories mit Status enthalten.
- `docs/INDEX.md` verweist bereits auf `adr/INDEX.md` (→ ADR-017) + `scoring-methodology.md`; keine zusätzliche Verweis-Zeile nötig.
- Konsistenz-Sweep: keine „nur Daseinsvorsorge"-Stelle mehr (scoring-methodology + Methodik-Page in 12.4 aktualisiert).
- **`/updates`-Eintrag** `_content/updates/2026-06-07-nahversorgung-versorgung.md` (category `feature`): erklärt Lebensmittel/Apotheke/Post + Umgewichtung in Nutzersprache, nennt OSM/ODbL, verlinkt `/methodik/kiez-score`. Frontmatter-Schema-konform (title_de ≤80, summary_de ≤160). Keine em-dashes, kein „lebenswert", keine Infra-/Stack-Interna, keine €/m².
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2784/2784 grün** (inkl. updates-Loader, Feed-/Sitemap-Tests).

### File List

**Neu:**
- `_content/updates/2026-06-07-nahversorgung-versorgung.md`

**Geändert (generiert):**
- `docs/pipelines/data-flow.md`
- `docs/architecture/story-map.md`

## Change Log

- 2026-06-07: Story 12.6 erstellt (ready-for-dev). Epic-12-Doku-Closure (Generatoren, INDEX, Konsistenz) + redaktioneller `/updates`-Eintrag zur erweiterten Versorgung.
- 2026-06-07: Story 12.6 implementiert (→ review). Doc-Generatoren neu (Nahversorgung im Atlas, Epic 12 in Story-Map), /updates-Changelog-Eintrag. check 0 Errors, 2784/2784 grün.
