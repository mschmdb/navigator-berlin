# Story 9.5: Content-Migration (Methodik + wo-lebt-es-sich-gut)

Status: review

> **Anker:** ADR-015. **Voraussetzung:** 9.3 (neue Scores). **Parallel-möglich mit 9.4.** Editorial-Kern: ehrliche Kommunikation der neuen Komposition + Anti-Stigma-Begründung.

## Story

As a User,
I want dass Methodik-Seite und Ranking-Page die neue Komposition + Begründung erklären,
so that die Score-Logik transparent und ehrlich kommuniziert ist.

## Kontext

Die Methodik-Seite `/methodik/kiez-score`, die Ranking-Page `/wo-lebt-es-sich-gut` und der Aggregat-Indizes-Abschnitt der Atlas-Methodik `/methodik` erklären noch die fünf alten Dimensionen inkl. „Soziale Lage". ADR-015 ändert die Komposition und benennt den Score ehrlich als **Umwelt- & Infrastruktur-Score**. Diese Story aktualisiert die Texte: neue Dimensionen, neue Gewichte, und vor allem die **Anti-Stigma-Begründung** (warum Sozialstruktur NICHT gescort wird, warum Bezahlbarkeit bewusst draußen bleibt).

## Acceptance Criteria

1. **AC-1 (Methodik-Seite Dimensionen):**
   **Given** `/methodik/kiez-score/+page.svelte`
   **When** die Seite gerendert wird
   **Then**:
   - die fünf neuen Dimensionen sind erklärt: Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz
   - Gewichts-Tabelle zeigt 5 × 0.20 + interne Layer-Gewichte konsistent mit `dimension-config.ts` (9.1)
   - „Soziale Lage" erscheint NICHT mehr als Score-Dimension
   - die Layer-Bewegungen sind korrekt erklärt (Bioklima unter Grün & Hitze, Grünanlagen unter Grün & Hitze, Wohnschutz aus Milieuschutz)

2. **AC-2 (Anti-Stigma-Begründung):**
   **Given** ADR-015
   **When** die Methodik-Seite die Komposition erklärt
   **Then** ein Abschnitt erklärt explizit:
   - warum Sozialstruktur (MSS) **nicht** gescort wird (kein Qualitäts-Kriterium, Stigma-Schutz; ein Kiez mit niedrigem Sozialstatus ist nicht „schlechter zu leben")
   - dass MSS als **neutraler Kontext** weiter angezeigt wird, nur nicht im Score
   - warum **Bezahlbarkeit** bewusst draußen bleibt (kontestiert + keine belastbaren Adress-Daten)
   - die ehrliche Score-Benennung **Umwelt- & Infrastruktur-Score**
   **And** kein „Lebenswert" (Memory `feedback_no_lebenswert`), keine „Was…"-Headlines (Memory `feedback_no_was_headlines`)

3. **AC-3 (Ranking-Page Texte + Umbenennung):**
   **Given** `/wo-lebt-es-sich-gut/+page.svelte`
   **When** die Seite rendert
   **Then**:
   - **H1 + Score-Name umbenannt zu „Umwelt- & Infrastruktur-Score"** (verbindlich, überschreibt Memory `project_kiez_score_naming` H1 „Wo lebt es sich gut?"). Die alte Frage-Headline „Wo lebt es sich gut?" entfällt als Titel, weil sie eine soziale Lebensqualitäts-Wertung suggeriert, die der Score gerade NICHT mehr macht.
   - die Beschreibung der Score-Komposition nennt die fünf neuen Dimensionen (Accordion „fünf Dimensionen: …" umschreiben)
   - kein Verweis auf „Soziale Lage" als Score-Dimension
   - Ranking-Tabelle nutzt die in 9.4 migrierten Spalten (gruenHitze/wohnschutz) — diese Story liefert nur Texte/Labels, Daten-Mapping kommt aus 9.4
   - Body erklärt ehrlich: der Score misst Umwelt + Infrastruktur, keine soziale Wertung

   **And Route-Slug-Entscheidung (verbindlich):** Der Route-Slug `/wo-lebt-es-sich-gut` **bleibt** (SEO-Stabilität: indexiert via Sitemap/IndexNow/interne Links aus Epic 5). Nur die sichtbaren Texte (H1, `<title>`, Meta-Description, OG-Title) werden auf „Umwelt- & Infrastruktur-Score" umgestellt. Falls Owner einen Slug-Rename will (z. B. `/umwelt-infrastruktur-score`): separater SEO-Task mit 301-Redirect + Sitemap-Update + IndexNow-Re-Ping, NICHT Teil dieser Story (Begründung im Completion-Note dokumentieren).

4. **AC-4 (Atlas-Methodik Aggregat-Indizes):**
   **Given** `/methodik/+page.svelte` Abschnitt „Aggregat-Indizes"
   **When** der Abschnitt rendert
   **Then**:
   - nennt die fünf neuen Dimensionen statt „fünf Dimensionen … Soziale Lage"
   - der dedizierte Unterabschnitt „Soziale Lage (MSS 2025)" als Score-Bestandteil entfällt oder wird zu „neutraler Kontext, nicht im Score" umformuliert
   - Link auf `/methodik/kiez-score` bleibt

5. **AC-5 (LayerMethodology-Einträge):**
   **Given** `src/lib/data/layer-methodology.ts`
   **When** Layer-Detail-Pages der Score-Layer rendern
   **Then**:
   - Eintrag `kiez-score-gruen` → `kiez-score-gruen-hitze`, calculation erwähnt Hitze-Komponente (Bioklima + PET)
   - Eintrag `kiez-score-soziale-lage` entfernt
   - Eintrag `kiez-score-wohnschutz` neu: calculation aus Milieuschutz-Presence, relatedLayers `milieuschutz-erhaltungsmiete` + `milieuschutz-staedtebau`, omissions/coverageGaps sachgerecht
   - Eintrag `kiez-score-versorgung` calculation aktualisiert (Grünanlagen raus)
   - Eintrag `kiez-score-ruhe-luft` calculation aktualisiert (nur Lärm/Luft, kein Bioklima/Umweltgerechtigkeit-Fallback)

6. **AC-6 (Konsistenz + Disziplin):**
   **Given** alle Content-Surfaces
   **When** geprüft wird
   **Then**:
   - keine „Soziale Lage" als Score-Dimension irgendwo im Content
   - **Score-Name durchgängig „Umwelt- & Infrastruktur-Score"** (H1, Titel, Meta, OG, Methodik-Texte, Atlas-Methodik). Die Frage-Headline „Wo lebt es sich gut?" verschwindet als Titel. „Kiez-Score" darf als kurzer technischer Slug/Bezeichner in Code/Layer-IDs bestehen bleiben, aber NICHT als sichtbarer Marken-Titel der Ranking-Page.
   - Textstil: aktiv, keine Füllwörter, keine em-dashes (Projekt-Regel), keine „Was…"-Headlines
   - `pnpm check` grün; vorhandene Content-Tests (falls) grün
   - SEO-Surfaces konsistent: `<title>`/Meta-Description/OG-Title der Ranking-Page tragen den neuen Namen (keine verwaisten „Wo lebt es sich gut?"-Titel)

## Tasks / Subtasks

- [ ] **Task 1: Methodik-Seite kiez-score** (AC: #1, #2)
  - [ ] 1.1 `/methodik/kiez-score/+page.svelte`: Dimensions-Sections + Gewichts-Tabelle auf 5 neue
  - [ ] 1.2 Anti-Stigma-Abschnitt: MSS raus aus Score + warum, Bezahlbarkeit-Begründung, Umwelt- & Infrastruktur-Score-Benennung
  - [ ] 1.3 Layer-Bewegungen erklären (Bioklima/Grünanlagen → Grün & Hitze)
  - [ ] 1.4 H1 + Titel der Methodik-Seite auf „Umwelt- & Infrastruktur-Score" (war „Wo lebt es sich gut?")

- [ ] **Task 2: Ranking-Page Umbenennung + Texte** (AC: #3, #6)
  - [ ] 2.1 `/wo-lebt-es-sich-gut/+page.svelte`: H1 + sichtbarer Score-Name auf „Umwelt- & Infrastruktur-Score"
  - [ ] 2.2 `<title>`, Meta-Description, OG-Title auf neuen Namen (SeoHead-Props prüfen)
  - [ ] 2.3 Accordion + Beschreibung auf 5 neue Dimensionen; Body ehrlich umformulieren (Umwelt + Infrastruktur, keine soziale Wertung)
  - [ ] 2.4 Route-Slug `/wo-lebt-es-sich-gut` NICHT ändern (SEO-Stabilität); Begründung im Completion-Note

- [ ] **Task 3: Atlas-Methodik** (AC: #4)
  - [ ] 3.1 `/methodik/+page.svelte` Aggregat-Indizes: Dimensionen aktualisieren
  - [ ] 3.2 „Soziale Lage (MSS)"-Unterabschnitt zu neutralem Kontext umformulieren oder entfernen

- [ ] **Task 4: LayerMethodology** (AC: #5)
  - [ ] 4.1 `layer-methodology.ts`: gruen → gruen-hitze (calculation), soziale-lage raus, wohnschutz neu, versorgung + ruhe-luft calculation aktualisieren

- [ ] **Task 5: Konsistenz-Check** (AC: #6)
  - [ ] 5.1 grep Content auf „Soziale Lage" als Score, „Lebenswert", „Was…"-Headlines, em-dashes
  - [ ] 5.2 `pnpm check` grün

## Dev Notes

### Content-Surfaces (verifiziert)

- `src/routes/(with-header)/methodik/kiez-score/+page.svelte` (Sections ~25–61, Gewichte ~193–215): listet 5 Dimensionen + Gewichte
- `src/routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte` (~108–117): Accordion „fünf Dimensionen: Ruhe & Luft, Grün, Mobilität, Soziale Lage, Versorgung"
- `src/routes/(with-header)/methodik/+page.svelte` (~213–252): Aggregat-Indizes; ~216 „fünf Dimensionen"; ~239–251 Unterabschnitt „Soziale Lage (MSS 2025)"
- `src/lib/data/layer-methodology.ts`: Einträge kiez-score-ruhe-luft (~420), kiez-score-gruen (~435), kiez-score-soziale-lage (~472), kiez-score-versorgung (~488)

### LayerMethodology aktuell (zu ändern)

- `kiez-score-gruen` calculation: „Pro-Kopf-Grünversorgung (0.6) plus Kaltluft + Leitbahn (je 0.2)" → erweitern um Bioklima + PET + Grünanlagen, Hitze-Komponente benennen, Key → `kiez-score-gruen-hitze`
- `kiez-score-soziale-lage` (MSS, Stigma-Schutz-Text): **kompletter Eintrag raus** (kein Score-Layer mehr)
- `kiez-score-versorgung` relatedLayers: gruenanlagen raus
- `kiez-score-ruhe-luft` calculation: „Lärm 0.4, Luft 0.4, Bioklima 0.2, Fallback Umweltgerechtigkeit" → „Lärm 0.5, Luft 0.5"
- `kiez-score-wohnschutz` **neu**: calculation = Milieuschutz-Presence (innerhalb Erhaltungs-/Städtebau-Gebiet = Verdrängungsschutz vorhanden = positiv), relatedLayers milieuschutz-*, coverageGaps (Schutz-Status ≠ tatsächliche Mietentwicklung), omissions

### Editorial-Kern (ADR-015)

Der eigentliche Grund des Epics: der alte Score stigmatisierte. Die Methodik muss das ehrlich erklären. Kernsätze (sinngemäß, eigene Formulierung, aktiv, kein Behördenstil):

- Der Score misst Umwelt und Infrastruktur, nicht den sozialen Status.
- Ein Kiez mit niedrigem Sozialstatus lebt nicht „schlechter". Sozialstruktur ist kein Qualitäts-Kriterium.
- MSS bleibt sichtbar als neutraler Kontext, fließt aber nicht in die Bewertung.
- Bezahlbarkeit bleibt draußen: kontestiert und ohne belastbare Adress-Daten.

### Score-Name-Entscheidung

Verbindliche Entscheidung (User 2026-05-20): Der sichtbare Score-Name wird „Umwelt- & Infrastruktur-Score". Die bisherige Frage-Headline „Wo lebt es sich gut?" entfällt als Titel, weil sie eine soziale Lebensqualitäts-Wertung suggeriert, die der Score gerade NICHT mehr trifft. Das überschreibt Memory `project_kiez_score_naming` (alte H1). „Kiez-Score" darf als technischer Slug/Layer-ID bleiben, nicht als sichtbarer Marken-Titel.

Route-Slug `/wo-lebt-es-sich-gut` bleibt unverändert (SEO-Stabilität: indexiert via Sitemap/IndexNow/interne Links, Epic 5). Nur sichtbare Texte (H1, Titel, Meta, OG) wechseln. Memory `project_kiez_score_naming` nach Story-Abschluss aktualisieren (H1-Eintrag korrigieren).

### Stil-Regeln (Projekt + User)

- Keine em-dashes (U+2014): Komma, Doppelpunkt, Mittelpunkt oder neuer Satz
- Keine „Was…"-Headlines, keine Meta-Phrasen wie „Wo das auftaucht" (`feedback_no_was_headlines`)
- Aktiv, konkrete Subjekte, keine Füllwörter, Sätze ≤20 Wörter
- `neverMachineTranslate` auf Methodik-Header beibehalten (DE-only Phase 1, `project_i18n_phase_1_de_only`)
- no-ai-slop / de-konzept-erstellung Stil-Disziplin

### Architektur-Compliance

- #15 Editorial-Verantwortung (Methodik-Pflicht-Artefakt)
- a11y: Heading-Hierarchie, TOC-Anchor-IDs erhalten

### Previous Story Intelligence

- **Story 1.28 / 1.29:** Methodik-Page-Pattern, Pflicht-Sections, Atlas-Methodik-Verknüpfung
- **Story 1.31:** Score-Style-Familien (Kontext für Karten-Erklärung)
- **Memory `feedback_no_lebenswert`:** Begriff verboten
- **Memory `project_kiez_score_naming`:** H1 + UI-Marke
- **Memory `project_compare_editorial_profiles`:** neutral vs evaluativ
- **Memory `feedback_update_docs_per_story`:** nach der Story `doc:story-map` + `doc:pipelines` + manuelle Docs (data-pipeline.md, system-map.md) aktualisieren

## References

- [Source: docs/adr/ADR-015-score-composition-umwelt-infra.md]
- [Source: src/routes/(with-header)/methodik/kiez-score/+page.svelte]
- [Source: src/routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte]
- [Source: src/routes/(with-header)/methodik/+page.svelte]
- [Source: src/lib/data/layer-methodology.ts]
- [Source: _bmad-output/implementation-artifacts/9-3-pipeline-recompute-rerun.md]
- [Source: _bmad-output/implementation-artifacts/9-4-konsumenten-migration.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- `/tmp/check-95.log` — repo-weit nur 2 pre-existing de/en-Errors, 0 neue
- Methodik-Tests: 4 Files / 38 Tests grün (methodik-page, methodik-kiez-score-page, layer-methodology, get-layer-detail)

### Completion Notes List

- **Methodik-Seite `/methodik/kiez-score`:** H1 + Titel + Meta + Speakable-JsonLd auf „Umwelt- & Infrastruktur-Score". 5 neue Dimensionen erklärt (inkl. Layer-Bewegungen: Bioklima + Grünanlagen → Grün & Hitze, Wohnschutz aus Milieuschutz). Gewichts-Tabelle 5 × 0.20. Normalisierung: MSS-Status-Zeile raus, PET-invertiert rein. Anti-Stigma als erste Auslassung (Sozialstruktur) + Editorial-Abschnitt umformuliert.
- **Ranking-Page `/wo-lebt-es-sich-gut`:** H1 + Titel + Meta + OG + Dataset-JsonLd auf neuen Namen. Accordion + Intro auf 5 Dimensionen, „Sozialstruktur wird bewusst nicht gewertet". **Route-Slug bleibt** (SEO-Stabilität: Sitemap/IndexNow/interne Links, Epic 5); ein Slug-Rename wäre ein separater SEO-Task mit 301 + Sitemap + IndexNow-Re-Ping.
- **Atlas-Methodik `/methodik`:** Aggregat-Indizes-Para auf 5 Dimensionen + Anti-Stigma. Obsolete Umweltgerechtigkeit-Anti-Doppelzählung-Para ersetzt. „Soziale Lage (MSS)"-Unterabschnitt → „MSS 2025 als neutraler Kontext".
- **layer-methodology.ts:** kiez-score-gruen → kiez-score-gruen-hitze (calculation + relatedLayers inkl. Bioklima/PET/Grünanlagen), kiez-score-soziale-lage komplett raus, kiez-score-wohnschutz neu (Milieuschutz-Presence), versorgung (Grünanlagen raus), ruhe-luft (nur laerm/luft).
- Stil: no-ai-slop angewandt (aktiv, kurze Sätze, keine Füllwörter). em-dash in layer-methodology-Header-Kommentar entfernt. Kein „Lebenswert", keine „Was…"-Headlines.
- e2e kiez-score-flow: Methodik-H1-Assertion auf neuen Namen.
- **Memory-Followup:** `project_kiez_score_naming` (H1) + `project_kiez_score_dimensions` (Dimensions-Set) sind durch ADR-015 veraltet, werden aktualisiert.

### File List

**Geändert:**
- `src/routes/(with-header)/methodik/kiez-score/+page.svelte`
- `src/routes/(with-header)/wo-lebt-es-sich-gut/+page.svelte`
- `src/routes/(with-header)/methodik/+page.svelte`
- `src/lib/data/layer-methodology.ts`
- `tests/e2e/kiez-score-flow.e2e.ts` (Methodik-H1-Assertion)

## Change Log

- 2026-05-21: Story 9.5 Content-Migration. Methodik + Ranking-Page + Atlas-Methodik + layer-methodology auf ADR-015. Score-Name „Umwelt- & Infrastruktur-Score", Anti-Stigma-Begründung. Route-Slug bleibt. check grün (2 pre-existing de/en out-of-scope), 38 Methodik-Tests grün.
