---
title: 'Textbereinigung: interne Artefakte aus öffentlichen DE+EN-Texten'
type: 'refactor'
created: '2026-09-27'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/textbereinigung-review.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c2-layer-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Öffentliche Layer-, Methodik- und Update-Texte enthalten interne Artefakte in DE und EN. Seit C1 ist `/en/explore` indexierbar, das Problem steht also öffentlich im Netz. Vorkommen:
- Pfade als Text („Methodik: /methodik/kiez-score“)
- Story-, Epic-, FR- und ADR-Nummern
- „Option C“
- „Legacy-Slug“
- Slugs statt Layer-Namen
- Code-Bezeichner und OSM-Tags
- Palettennamen („Cloud-Dancer-Skala“)
- Der Rohwert `point-osm` auf `/layer`
- Links mit dem Pfad als sichtbarem Text

**Approach:** Wir setzen den Vorschlag `textbereinigung-vorschlag.json` (47 Einträge, DE alt/neu, EN neu) mit Matzes Entscheidungen um. Dazu bauen wir zwei echte Methodik-Links, eine Label-Map für die Aggregationsebene und sprechende Linktexte.

## Boundaries & Constraints

**Always:**
- Entscheidungen Matze 27.09. 12:04 („Ja“ zu den Empfehlungen):
  1. Die 6 Legacy-Layer ohne Manifest-Eintrag: Messages und DE-Referenzeinträge löschen statt bereinigen.
  2. „Würde-Prinzip gemäß FR50/51“ wird zu „Die Würde der Opfer steht über Vergleichbarkeit.“ (EN wie in C1 abgenommen).
  3. Versorgung: „vorläufig“ bleibt, der Story-Verweis fliegt raus.
  4. S-Bahn-OSM-Tags als Klartext („S-Bahnhöfe und Haltepunkte aus OpenStreetMap“).
  5. „mapshaper“ im Bezirke-Text streichen.
  6. Methodik-Pfad-Sätze streichen. Zwei echte Links auf `/methodik/kiez-score` (lokalisiert): Aside auf `/layer/kiez-score-*` und „Eigene Berechnung“ in der Legende bei Kiez-Score-Layern.
  7. Label-Map `aggregationLevel`: „Einzelstandort“/„individual site“, „Baublock“/„city block“, übrige Ebenen aus bestehendem Glossar. Danach entfällt `lang="de"` an diesem Feld.
  8. `/methodik/cross-layer-templates`: nur die Story-Nummer streichen, Seite bleibt noindex.
  9. Links mit Pfad als sichtbarem Text (8 Stellen) bekommen sprechenden Linktext.
  10. Denglisch bleibt für einen eigenen Durchgang.
- Zusätzlich:
  - Die DE-Anführungszeichen „…" in Methodik-Texten werden „…“ (C2-Review #13).
  - Die Update-Post-Überschrift „Was wir geändert haben“ (15.05.) wird ohne „Was“ formuliert.
- Paritätstests aus C1/C2 (Messages ↔ DE-Referenz) bleiben grün: Beide Seiten ändern sich gemeinsam.
- Nur das Artefakt ersetzen, Fakten, Zahlen, Quellen und Lizenzen unverändert. Keine em-dashes, `lint:wahl` grün.
- KI-Export und llms übernehmen die bereinigten DE-Texte automatisch, das ist gewollt.
- TDD pro AC.

**Never:**
- Kein Denglisch-Durchgang, keine Überarbeitung von `/methodik`-Fließtext über die gelisteten Stellen hinaus.
- Keine Änderung an WebMCP-Tool-Logik.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez-Score-Layer | Legende und `/layer/kiez-score-*`, DE/EN | kein Pfad im Text, echter Link auf `/methodik/kiez-score` bzw. `/en/methodik/kiez-score` | N/A |
| `/layer` Aggregation | `point-osm` DE/EN | „Einzelstandort“ / „individual site“ | unbekannter Enum: Rohwert mit `lang="de"` |
| Artefakt-Grep | `src/`, `messages/` (ohne Kommentare/Tests) | keine Treffer für `Story \d`, `Epic \d`, `FR5\d`, `Option C`, `Legacy-Slug`, `Cloud-Dancer`, `/methodik/` als Text | N/A |
| Legacy-Layer | 6 gelöschte Slugs | keine Messages, Tests ohne Referenz | N/A |
| Link-Texte | 8 Stellen | sprechender Text statt Pfad | N/A |

</frozen-after-approval>

## Code Map

- Quelle der Wortlaute: `_bmad-output/implementation-artifacts/textbereinigung-vorschlag.json` (je Eintrag alle Fundorte) und `textbereinigung-review.md`.
- Texte in `messages/{de,en}.json` (`layer_explain_*`, `layer_methodology_*`, `disclaimer_*`) plus DE-Referenzen in `inspector-panel/internal/layer-explain.ts` (`LAYER_EXPLAIN_DE`) und `src/lib/data/layer-methodology.ts` (Specs). Beide Seiten gemeinsam ändern.
- Links: `src/routes/(with-header)/layer/[slug]/+page.svelte` (Methodik-Aside), `src/lib/components/atlas/map-legend.svelte` („Eigene Berechnung“).
- Label-Map `aggregationLevel`: neue Messages, Nutzung auf `/layer/[slug]`.
- Linktexte: Wahlportal-Komponenten und Update-Posts, Fundorte laut Review-Datei, Frage 9.
- Update-Post 15.05.: `src/lib/content/updates/…` (Datei laut Review).
- `/methodik/cross-layer-templates/+page.svelte`: Story-Nummer.

## Tasks & Acceptance

**Execution:**
- [ ] 47 Einträge umsetzen (Messages DE/EN + DE-Referenzen), Paritätstests grün
- [ ] 6 Legacy-Layer löschen (Messages, Referenzen, Tests)
- [ ] Zwei Methodik-Links + Tests (DE/EN-Href)
- [ ] Label-Map `aggregationLevel` + Tests, `lang="de"` nur für unbekannte Werte
- [ ] 8 Linktexte, Update-Überschrift, cross-layer-templates Story-Nummer, Anführungszeichen
- [ ] Grep-Gate als Test oder Script (siehe Matrix)
- [ ] Zeitmessung

**Acceptance Criteria:**
- Given Legende, Inspector, `/layer` und `/methodik` in DE und EN, when die Seiten rendern, then erscheinen keine Pfade, Story-/Epic-/FR-Nummern, „Option C“, „Legacy“-Hinweise, Slugs oder Palettennamen im sichtbaren Text.
- Given ein Kiez-Score-Layer, when der Nutzer die Methodik sucht, then führt ein echter Link zur lokalisierten Methodik-Seite.

## Implementation Notes

- 27.09. 11:34-11:43 Vorschlag vorbereitet (1 Subagent außerhalb des Repos). 12:04 Freigabe Matze („Ja“ zu den 10 Empfehlungen), Checkpoint 1. Umsetzung nach dem C2-Commit (gleiche Dateien).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-layer-frame`, `i18n-atlas`, `i18n-routing` -- expected: grün
