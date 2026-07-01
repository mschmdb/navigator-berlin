# Story 15.6: Methodik-Doku, Kühle-Score-Transparenz und ADR

Status: ready-for-dev

> **Anker:** Epic 15 (Kühle Orte Berlin), ADR-012 (TDD), Vorbild-Doku `docs/kriminalitaetsdaten-methodik.md`, Vorbild-ADR `docs/adr/ADR-019-kriminalitaet-score-dimension.md`. Reine Dokumentations-/Transparenz-Story: schreibt die Source-of-Truth-Methodik, ergänzt die öffentliche Methodik-Route und legt das ADR für den neuen `kind: 'local'`-Pfad an.
> **Owner-Haltung (NFR8):** Angebot, kein Behörden-Ersatz, kein „besser als die Stadt", kein Rechtsanspruch. Diese Story gießt die Haltung in belegbare Doku.
> **Kein Code-Risiko:** Story berührt keine Layer-Pipeline-Logik. Methodik-Doku + ADR sind statische Content-Files. Einzige Logik-Berührung: ein Render-Abschnitt auf der Methodik-Route (test-first).

## Story

As a Nutzer und Maintainer,
I want die Methodik hinter Kühle-Score, Sommer-Verfügbarkeit und Datenherkunft transparent dokumentiert,
so that das Angebot ehrlich und nachvollziehbar bleibt.

## Kontext: Warum dieser Change

Der `kuehle-orte`-Layer mischt zwei Quell-Arten: OpenStreetMap-Geometrie (ODbL 1.0, Namensnennung) und eine redaktionelle Web-Recherche-Anreicherung (`enrichment.json`, 659 Objekte). Aus dieser Anreicherung entstehen wertende Felder: ein Kühle-Score 1–5, ein `summer_available`-Flag, ein AC-Status. Wertende Felder ohne offengelegte Rubrik sind ein Vertrauens- und Haftungsrisiko. Die AC-Belege sind dünn: nur 29 von 659 Objekten tragen `ac_status: yes`, der Rest steht auf `likely`/`unknown`/`no`. Diese Lücke muss die Doku ehrlich benennen, statt Klima-Sicherheit zu suggerieren.

Parallel führt Epic 15 eine neue Pipeline-Quell-Art `kind: 'local'` ein (Build-Merge aus lokalen JSON-Dateien statt Remote-Fetch). Diese Architektur-Entscheidung ist bisher nirgends festgehalten. Ein ADR sichert sie analog ADR-019 (Kriminalität) und ADR-018 (Kultur) ab und trennt die Lizenz-Verantwortung OSM gegen Anreicherung sauber.

**Verifiziert (2026-06-30):** `docs/kuehle-orte-methodik.md` existiert noch nicht. Das nächste freie ADR ist **ADR-020**. Der Layer ist noch nicht in `scripts/lib/sources.ts` verdrahtet (`kind: 'local'` fehlt), das gehört zu den Schwester-Stories 15.0–15.5; diese Story dokumentiert die dort gebaute Architektur.

## Acceptance Criteria

1. **AC-1 (Methodik-Doku als Source of Truth):**
   **Given** die neue Datenbasis (`enrichment.json` + `places-osm.json`)
   **When** `docs/kuehle-orte-methodik.md` neu angelegt wird (Frontmatter analog `docs/kriminalitaetsdaten-methodik.md`: `type: methodology`, `audience: both`, `last-verified: 2026-06-30`, `status`, `related`)
   **Then** sind erklärt: Kühle-Score-Rubrik (was 1 bis 5 bedeutet, welche Felder einfließen), `summer_available`-Definition (`yes`/`limited`/`no`/`unknown` mit Abwertungs-Effekt aus FR8), AC-Ehrlichkeit (29 Objekte mit `ac_status: yes` belegt, Rest `likely`/`unknown`/`no`, kein Klima-Versprechen), Datenherkunft (OSM ODbL 1.0 plus redaktionelle Web-Recherche-Anreicherung mit Stand-Datum), Caveats (kein Behörden-Ersatz, kein „besser als die Stadt", kein Rechtsanspruch/Hausrecht der Betreiber)
   **And** jede Zahl ist gegen `static/data/kuehle-orte/enrichment.json` belegt, kein erfundener Wert

2. **AC-2 (Öffentliche Methodik-Route aktualisiert):**
   **Given** die Methodik-Route `src/routes/(with-header)/methodik/+page.svelte`
   **When** ein „Kühle Orte"-Transparenz-Abschnitt ergänzt wird (oder die Lizenz-Sektion erweitert wird)
   **Then** nennt die öffentliche Seite die Score-Herkunft, die Anreicherung neben OSM (ODbL 1.0, Namensnennung), die AC-Ehrlichkeit und die Angebot-Haltung, mit Link auf die Source-of-Truth-Doku bzw. das ADR
   **And** die Daten-Tabelle listet den `kuehle-orte`-Layer korrekt (folgt automatisch aus dem MANIFEST-Eintrag der Schwester-Story), die WCAG-Überschriften-Hierarchie bleibt intakt

3. **AC-3 (ADR für `kind: 'local'`):**
   **Given** die Architektur-Entscheidung
   **When** `docs/adr/ADR-020-kuehle-orte-local-source.md` geschrieben wird (Vorbild ADR-019, Sections Context/Decision/Consequences/Alternatives-Considered)
   **Then** dokumentiert es den neuen `kind: 'local'`-Pfad in `scripts/lib/sources.ts` + `fetchSource()`, den `scripts/build-kuehle-orte.ts`-Merge (enrichment + places, Filter `suitable=false`/`still_exists=no`) und die Lizenz-Trennung OSM (ODbL 1.0) gegen redaktionelle Anreicherung
   **And** `docs/adr/INDEX.md` trägt die ADR-020-Zeile, Methodik-Doku und ADR sind wechselseitig verlinkt

4. **AC-4 (Forbidden-Token + Stil):**
   **Given** die Output-Konvention (`CLAUDE.md`)
   **When** die Doku geschrieben wird
   **Then** enthält sie keine em-dashes (U+2014), aktive Sprache, jede Quelle verlinkt, DE-only ohne i18n-Keys

## Tasks / Subtasks

- [ ] **Task 1: Methodik-Route-Abschnitt (test-first)** (AC: #2, #4)
  - [ ] 1.1 (RED) Test in `src/routes/(with-header)/methodik/page.svelte.test.ts` ergänzen: rendert die Seite mit einem Manifest, das einen `kuehle-orte`-Layer enthält, und assertet, dass der Kühle-Orte-Transparenz-Text (Score-Herkunft + Anreicherung + AC-Ehrlichkeit) und der Doku-/ADR-Link (`data-testid`) gerendert werden. Verify rot via `pnpm test:unit`.
  - [ ] 1.2 (GREEN) Abschnitt in `src/routes/(with-header)/methodik/+page.svelte` ergänzen: kurzer „Kühle Orte"-Block (Score-Rubrik in einem Satz, AC-Ehrlichkeit, OSM ODbL 1.0 + redaktionelle Anreicherung), Link auf die ausführliche Doku bzw. `/lizenzen`. Falls nötig `sections`-Array + Sprungmarke ergänzen. Test grün.
  - [ ] 1.3 (REFACTOR) Wenn `+page.svelte` durch den Abschnitt die 500-Zeilen-Grenze reißt (aktuell 379), Block in eine kleine Sibling-Komponente auslagern (Muster `methodik-daten-tabelle.svelte`). Tests bleiben grün.
- [ ] **Task 2: Source-of-Truth-Methodik-Doku** (AC: #1, #4) · statisches Content-File, kein Test-First (CLAUDE.md)
  - [ ] 2.1 `docs/kuehle-orte-methodik.md` anlegen, Frontmatter analog `docs/kriminalitaetsdaten-methodik.md` (`type: methodology`, `audience: both`, `last-verified: 2026-06-30`, `status: empfohlen`, `related: docs/adr/ADR-020-..., docs/scoring-methodology.md`).
  - [ ] 2.2 Abschnitt „Kühle-Score-Rubrik": was Stufe 1 bis 5 bedeutet, welche Felder (`cool_score`, `summer_available`, `ac_status`, `is_free`) in die Einordnung einfließen. Verteilung aus den Daten belegen (cool_score: 1=12, 2=135, 3=328, 4=180, 5=4).
  - [ ] 2.3 Abschnitt „Sommer-Verfügbarkeit": `summer_available`-Werte `yes`/`limited`/`no`/`unknown` definieren, Abwertungs-Effekt (FR8: `no` = „im Sommer geschlossen", abgewertet). Verteilung belegen (yes=528, limited=69, no=56, unknown=6).
  - [ ] 2.4 Abschnitt „AC-Ehrlichkeit": 29 Objekte `ac_status: yes` belegt, 151 `likely`, 372 `unknown`, 107 `no`. Klar: kein Klima-Garantie-Versprechen, AC-Status ist Indiz, nicht Zusage.
  - [ ] 2.5 Abschnitt „Datenherkunft + Lizenz-Trennung": OSM-Geometrie (`places-osm.json`, ODbL 1.0, Namensnennung), redaktionelle Web-Recherche-Anreicherung (`enrichment.json`, Stand-Datum, Methode), Join-Key `id` (`node/123`/`way/456`).
  - [ ] 2.6 Abschnitt „Caveats": kein Behörden-Ersatz, kein „besser als die Stadt", kein Rechtsanspruch, Hausrecht der Betreiber, Melde-Mechanik (`feedbackMailto`). Querverweis auf das ADR.
- [ ] **Task 3: ADR-020 für `kind: 'local'`** (AC: #3, #4) · statisches Content-File, kein Test-First
  - [ ] 3.1 `docs/adr/ADR-020-kuehle-orte-local-source.md` aus `docs/adr/ADR-000-template.md` ableiten, Frontmatter (`status: Accepted`, `date: 2026-06-30`, `deciders`, `relates`).
  - [ ] 3.2 Context: warum `kind: 'local'` statt Remote-Fetch (Merge aus committeten lokalen JSON-Dateien, keine Live-Quelle, deterministischer Build).
  - [ ] 3.3 Decision: `kind: 'local'` in `scripts/lib/sources.ts` + `fetchSource()`-Switch in `scripts/fetch-static.ts`, `scripts/build-kuehle-orte.ts`-Merge (Vorbild `scripts/build-klima-pet-points.ts`), Lizenz-Trennung OSM ODbL 1.0 gegen redaktionelle Anreicherung im MANIFEST.
  - [ ] 3.4 Consequences + Alternatives-Considered (verworfen: Overpass-Live-Layer ohne Anreicherung; reiner Remote-Fetch ohne Merge).
  - [ ] 3.5 `docs/adr/INDEX.md`-Tabellenzeile für ADR-020 ergänzen (analog ADR-019-Zeile, Epic 15).
- [ ] **Task 4: Querverlinkung + Forbidden-Token-Check** (AC: #1, #3, #4)
  - [ ] 4.1 Methodik-Doku ↔ ADR-020 wechselseitig verlinken; Methodik-Route verlinkt die Doku bzw. `/lizenzen`.
  - [ ] 4.2 Grep über die drei Files auf em-dashes (U+2014) und en-dashes außerhalb von Zahlen-Ranges, Passiv-Hotspots prüfen.
  - [ ] 4.3 `pnpm test:unit` 100% grün, `pnpm check` 0 Errors.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **`docs/kuehle-orte-methodik.md` existiert nicht.** Vorhandene Methodik-Docs: `kriminalitaetsdaten-methodik.md`, `muelldaten-methodik.md`, `wahldaten-methodik.md`, `scoring-methodology.md`. Frontmatter-Muster (Vorbild `kriminalitaetsdaten-methodik.md`): `type: methodology`, `audience: both`, `last-verified`, `status`, `related: [...]`.
- **Daten verifiziert** (`static/data/kuehle-orte/enrichment.json`, 659 Objekte):
  - `ac_status`: `unknown` 372, `likely` 151, `no` 107, `yes` **29** → deckt „29 belegt, Rest likely/unknown" exakt.
  - `summer_available`: `yes` 528, `limited` 69, `no` 56, `unknown` 6.
  - `suitable`: `true` 519, `false` 140 (Filter FR12).
  - `still_exists`: `yes` 631, `unknown` 17, `no` 11 (Filter FR12).
  - `cool_score`: 1=12, 2=135, 3=328, 4=180, 5=4.
  - Felder pro Objekt: `id, name, cat, suitable, suitable_reason, cool_score, ac_status, ac_source, is_free, summer_available, opening_hours_note, address_verified, website, still_exists, notes`. Join-Key `id` = `node/123`/`way/456`.
- **Methodik-Route:** `src/routes/(with-header)/methodik/+page.svelte` (379 Zeilen, unter 500). `sections`-Array steuert die Sprungmarken (Mission, Datenarchitektur, …, Lizenzen, Feedback). Lizenz-Sektion `id="lizenzen"` ab Zeile 350: nennt dl-de-Lizenzen und OSM-ODbL-Layer (Stolpersteine, ÖPNV, Trinkbrunnen, Radverkehr). Daten-Tabelle liest `manifest.layers`, listet also `kuehle-orte` automatisch, sobald der MANIFEST-Eintrag der Schwester-Story existiert. Test-Setup: `page.svelte.test.ts` rendert mit `vitest-browser-svelte` und einem `sampleManifest`.
- **Sub-Routen-Präzedenz:** `/methodik/wahldaten` und `/methodik/kiez-score` zeigen, dass tiefere Methodik-Themen eigene Routen bekommen können. Für Kühle Orte reicht ein Abschnitt plus Doku-Link; eine eigene Sub-Route wäre Scope-Creep.
- **ADR-Stand:** höchstes ADR ist **019** (`docs/adr/INDEX.md`). Nächstes frei: **ADR-020**. Workflow laut INDEX: `cp ADR-000-template.md`, Frontmatter, Sections Context/Decision/Consequences/Alternatives-Considered, Index-Zeile ergänzen.
- **Pipeline-Stand:** `scripts/lib/sources.ts` kennt nur `kind: 'odis' | 'fis-broker' | 'overpass'`. `kuehle-orte` und `kind: 'local'` sind noch NICHT verdrahtet (Schwester-Stories 15.0–15.5). Build-Vorbild: `scripts/build-klima-pet-points.ts`.
- **Bestands-kühle-Layer** (nicht duplizieren, in der Doku abgrenzen): `kultur-kino`, `kultur-museum`, `kultur-bibliothek`, `schwimmbaeder`, `trinkbrunnen` (seasonal).
- **Editorial-Config:** `src/lib/components/atlas/internal/editorial-config.ts` nutzt `disclaimerVariants` (`['legal']`, `['seasonal']`), `primarySourceUrl`, `feedbackMailto: true` (Melde-/Opt-out-Mechanik). Für die Caveat-Formulierung in der Doku als Referenz.

### Design-Entscheidung: Doku als Source of Truth, Route als Schaufenster

Zwei Ebenen, ein Inhalt. `docs/kuehle-orte-methodik.md` ist die ausführliche Source of Truth für Maintainer und prüfende Nutzer (alle Verteilungen, Lizenz-Trennung, Caveats im Detail). Die öffentliche Methodik-Route bekommt einen knappen, ehrlichen Abschnitt plus Link, statt die Prosa zu verdoppeln. Grund: `+page.svelte` steht bei 379 Zeilen, die 500-Zeilen-Grenze ist nah. Falls der Abschnitt sie reißt, Auslagerung in eine Sibling-Komponente (Muster `methodik-daten-tabelle.svelte`).

Das ADR folgt der ADR-019-Form (Context → Decision → Consequences → Alternatives-Considered). Kern-Aussage: `kind: 'local'` ist ein bewusster Pipeline-Pfad für vor-kuratierte, committete Daten, kein Remote-Fetch. Die Lizenz-Trennung (OSM ODbL 1.0 mit Namensnennung gegen redaktionelle Anreicherung) wird im MANIFEST und in der Doku sichtbar gemacht, nicht vermischt.

### Was nicht brechen darf

- **Kein Eingriff in die Layer-Pipeline-Logik.** Story berührt `scripts/lib/sources.ts`, `fetch-static.ts`, `build-kuehle-orte.ts` nicht. Sie dokumentiert die dort (Schwester-Stories) gebaute Architektur.
- **Daten-Tabelle der Methodik-Route bleibt manifest-getrieben.** Kein Hardcoding des `kuehle-orte`-Eintrags, der Layer erscheint über den MANIFEST-Eintrag.
- **Keine erfundenen Zahlen.** Jede Verteilung gegen `enrichment.json` belegt. Bei Daten-Refresh (NFR7) Zahlen + `last-verified` aktualisieren.
- **Keine em-dashes**, keine i18n-Keys (DE-only, NFR9), keine Score-Garantie-Sprache. AC-Status und Kühle-Score sind Einordnung, keine Zusage.
- **Bestands-Layer nicht als Dubletten darstellen.** Trinkbrunnen/Schwimmbäder/Kultur-Layer sind eigenständig, in der Doku abgrenzen (FR18).

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md] Story 15.6 (Zeilen 241–263), Requirements-Inventory FR7/FR8/FR12/FR13/FR18, NFR6/NFR7/NFR8/NFR9
- [Source: docs/kriminalitaetsdaten-methodik.md] Vorbild Methodik-Doku (Frontmatter, Quelle/Lizenz-Tabelle, Caveat-Abschnitt)
- [Source: docs/adr/ADR-019-kriminalitaet-score-dimension.md] Vorbild-ADR (Context/Decision/Consequences/Alternatives-Considered, Lizenz-Disziplin)
- [Source: docs/adr/ADR-000-template.md] ADR-Template
- [Source: docs/adr/INDEX.md] ADR-Tabelle (höchstes = 019), ADR-Workflow
- [Source: src/routes/(with-header)/methodik/+page.svelte] `sections`-Array, Lizenz-Sektion `id="lizenzen"` (ab Zeile 350), manifest-getriebene Daten-Tabelle, 379 Zeilen
- [Source: src/routes/(with-header)/methodik/page.svelte.test.ts] Test-Setup (`vitest-browser-svelte`, `sampleManifest`, `meta()`)
- [Source: src/routes/(with-header)/methodik/methodik-daten-tabelle.svelte] Auslagerungs-Muster, falls 500-Zeilen-Grenze gerissen wird
- [Source: static/data/kuehle-orte/enrichment.json] 659 Objekte, Felder + Verteilungen (ac_status yes=29, summer_available, cool_score, suitable, still_exists)
- [Source: scripts/lib/sources.ts] `SourceConfig`-Kinds `odis|fis-broker|overpass` (noch kein `local`)
- [Source: scripts/fetch-static.ts] `fetchSource()`-Switch, MANIFEST-Schreiben
- [Source: scripts/build-klima-pet-points.ts] Vorbild Build-Merge-Script
- [Source: src/lib/components/atlas/internal/editorial-config.ts] `disclaimerVariants`, `primarySourceUrl`, `feedbackMailto` (Melde-/Opt-out-Mechanik)
- [Source: CLAUDE.md] Output-Konventionen (keine em-dashes, TDD-Scope, DE-only, Files unter 500)

## Dev Agent Record

### Agent Model Used

_(vom Dev-Agent auszufüllen)_

### Completion Notes List

_(vom Dev-Agent auszufüllen)_

### File List

**Erwartet neu:**
- `docs/kuehle-orte-methodik.md`
- `docs/adr/ADR-020-kuehle-orte-local-source.md`

**Erwartet geändert:**
- `src/routes/(with-header)/methodik/+page.svelte` (Kühle-Orte-Abschnitt; ggf. neue Sibling-Komponente bei 500-Zeilen-Grenze)
- `src/routes/(with-header)/methodik/page.svelte.test.ts` (Render-Test)
- `docs/adr/INDEX.md` (ADR-020-Zeile)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-6 → review)

### Debug Log References

_(vom Dev-Agent auszufüllen)_

## Change Log

- 2026-06-30: Story 15.6 erstellt (ready-for-dev). Methodik-Doku als Source of Truth + öffentlicher Methodik-Route-Abschnitt + ADR-020 für `kind: 'local'`. AC-Ehrlichkeit gegen `enrichment.json` belegt (29 `ac_status: yes` von 659). Reine Doku-Story, keine Pipeline-Logik berührt.
