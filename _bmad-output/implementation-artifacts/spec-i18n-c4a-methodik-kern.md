---
title: 'i18n Block C4a: Methodik-Kern auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'a5fe3511952c3d3a9bb06c13e702c3c3cc72ec15'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c1-hinweise-layer-erklaerungen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/methodik`, `/en/methodik/kiez-score` und `/en/methodik/cross-layer-templates` zeigen deutschen Inhalt mit Fallback-Banner und `noindex`. Die Texte stehen hart im Svelte-Markup und in Script-Arrays, interne Links führen aus `/en` heraus.

**Approach:** Wir übernehmen die abgenommene Übersetzung aus `c4a-uebersetzung.json` als Paraglide-Messages. Die drei Seiten und ihre Komponenten lesen die Messages in der Seiten-Locale, interne Links laufen über `localizedHref`. Danach kommen die drei Routen als exakte Einträge ins `TRANSLATION_REGISTER`.

## Boundaries & Constraints

**Always:**
- Übersetzung: `_bmad-output/implementation-artifacts/c4a-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen in `c4a-uebersetzung-review.md`.
- DE-Ausgabe Zeichen für Zeichen gleich. Parity-Test: jede DE-Message gleich der DE-Spalte der Übersetzung.
- Zahlen und Daten aus dem Manifest (`layerCount`, `generatedAt`) als Message-Parameter, Formatierung über `$lib/i18n/format.ts`.
- Cross-Layer-Template: optionales Feld `body_en` im selben YAML, der Renderer wählt nach Locale. Ein Test erzwingt `body_en` für jedes Template. Fixture-Labels der Vorschauseite je Locale.
- JSON-LD der drei Seiten folgt der Seiten-Locale (wie `/` und `/berlin-wahlen` nach Registrierung).
- Register: `/methodik`, `/methodik/kiez-score`, `/methodik/cross-layer-templates` exakt, ohne `prefix` (`/methodik/wahldaten` folgt in C4b). Vorher Grep-Audit: kein DE-Rest in den gerenderten Komponenten, `lang="de"` nur, wo Inhalt deutsch bleibt.
- TDD pro AC.

- Entscheidung Matze 30.09. 08:11: DE-Fehler mitkorrigieren. Einzige DE-Änderungen: `omission_single_score_reason` („keine einzelne Zahl“) und `mss_p1` („Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen“). DE-Spalte in `c4a-uebersetzung.json` ist maßgeblich, der Parity-Test prüft gegen sie.

**Never:**
- Keine weitere DE-Textänderung, keine inhaltliche Überarbeitung.
- Kein `sitemap-en.xml`-Eintrag (Gate `STATIC_PAGES_SOURCE`, Abschluss-Block).
- `/methodik/wahldaten`, `/lizenzen` und die übrigen C4b/C4c-Seiten bleiben unberührt. OG-Bilder bleiben DE.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Methodik EN | `/en/methodik` | Inhalt englisch, kein Banner, kein `noindex`, hreflang de/en | N/A |
| Kiez-Score EN | `/en/methodik/kiez-score` | Inhalt und Dimensionsliste englisch | N/A |
| Vorschau EN | `/en/methodik/cross-layer-templates` | Template-Text und Fixture englisch, kein `lang="de"` | N/A |
| Link auf C4b | `/en/methodik` → Wahldaten-Link | führt auf `/en/methodik/wahldaten` (dort Banner bis C4b) | N/A |
| DE unverändert | `/methodik` | Texte identisch zu vorher | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/methodik/+page.svelte` (435 Z.) -- `sections`, `aggregationLevels`, `coverageReasons` u. a. Script-Arrays, Title/Description, TechArticle-JSON-LD, rohe `href` (`/methodik/kiez-score` `:274`, `/methodik/wahldaten` `:311`, `/berlin-wahlen#alle-wahlen` `:318`, `/lizenzen` `:341`, `:415`). Datei bleibt unter 500 Zeilen, Arrays ggf. in eine `methodik-content.ts` auslagern.
- `methodik-daten-tabelle.svelte`, `methodik-pipeline-diagram.svelte` -- Tabellenköpfe, Diagramm-Labels.
- `kiez-score/+page.svelte` (365 Z.) -- `sections`, `dimensions`, `omissions`, rohe `href` `:142`, `:322`, `:358`. Dimensionsnamen aus bestehenden Messages übernehmen, nicht duplizieren.
- `cross-layer-templates/+page.svelte` (`lang="de"` `:29`, roher Link `:24`) und `+page.server.ts` (Fixtures, `contextLabel`) -- Locale über `getLocale()`.
- `src/lib/data/cross-layer-templates/{schema,renderer}.ts`, `wahl/wahl.de.yaml` (1 Template) -- `body_en`, Renderer mit Locale. `src/lib/components/atlas/cross-layer-story-block.svelte` Default `methodikLinkLabel`/`methodikHref` prüfen.
- `src/lib/seo/translation-register.ts` -- drei exakte Einträge, Kommentar ergänzen. `translation-register.test.ts`.
- Tests: `methodik/page.svelte.test.ts`, `kiez-score/page.svelte.test.ts`, `methodik-daten-tabelle.svelte.test.ts`, `cross-layer-templates`-Renderer/Schema-Tests. e2e: `i18n-routing.e2e.ts:794-845` nutzt `/en/methodik` als „nicht übersetzte“ Kontrollseite, auf `/en/methodik/wahldaten` umstellen. `methodik-flow.e2e.ts` prüfen.

## Tasks & Acceptance

**Execution:**
- [x] Messages aus `c4a-uebersetzung.json` erzeugen, Parity-Test DE, EN-Vollständigkeit
- [x] `/methodik` + Komponenten auf Messages, `localizedHref`, JSON-LD (+ Tests)
- [x] `/methodik/kiez-score` auf Messages, `localizedHref` (+ Tests)
- [x] Cross-Layer-Template `body_en` + Renderer-Locale, Vorschauseite (+ Tests)
- [x] Grep-Audit, Register-Einträge (+ Test)
- [x] e2e: drei Seiten EN ohne Banner, indexierbar, Links unter `/en`; Kontrollseite in `i18n-routing` umstellen
- [x] Zeitmessung

**Acceptance Criteria:**
- Given `/en/methodik` im Build, when die Seite lädt, then fehlen Fallback-Banner und `noindex`, alle internen Links beginnen mit `/en`, und der Grep-Audit findet keinen DE-Text außerhalb von Eigennamen und Glossar.
- Given `/methodik` in DE, when die Seite lädt, then ist der sichtbare Text identisch zum Stand vor C4a.

## Implementation Notes

- 30.09. Inventur (Subagent) 06:50, Übersetzung 08:00-08:05, Spec 08:03, Abnahme Matze 08:11 (DE-Fehler mitkorrigieren), Umsetzung 08:11-08:33 (22 min), Review 08:33-08:37, Patches 08:37-08:39, Verifikation 08:39-08:52.
- 194 Messages `methodik_*`, Rich-Text-Platzhalter über `src/lib/i18n/rich-text.ts` + `rich-text.svelte` (ohne `{@html}`). Inhalte in `methodik-content.ts`, `kiez-score-content.ts`, `preview-fixtures.ts`.
- Cross-Layer-Template: `body_en` optional im Schema, Test erzwingt es für alle Templates. Story-Block ohne Effective-Locale (deferred).
- Nicht abgenommene EN-Texte (vom Implementierer): `cross_layer_story_sources_aria_label` „Sources for this observation“, `_license_prefix` „Licence“, `_methodik_link_label` „Methodology“. EN-Grammatik-Korrekturen aus Review-Fund 6 in `c4a-uebersetzung.json` nachgezogen.
- JSON-LD: `inLanguage` nach `localeToBcp47` (en-US, Projekt-Konvention), auch in DE neu. Vorschauseite behält ihr explizites `noindex`.
- DE-Parität: HTML-Vergleich vor/nach Umstellung (Skript, gelöscht), dauerhaft per Text-Snapshots `methodik-de.txt`, `kiez-score-de.txt`.
- e2e: `kiez-score-flow.e2e.ts` 4 rot (Combobox-Bug, deferred seit B3b). Link-Test in `i18n-methodik.e2e.ts` flakte unter Parallel-Last (0 Links direkt nach Load), wartet jetzt auf die Links.
- Qualität: 31 Review-Funde in 19 Einträgen, 8 gepatcht, 3 deferred, 8 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 08:37), 3 Layer: Blind Hunter (BH) 15, Edge Case (EC) 12, Verification Gap (VG) 2 + 2. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | VG/BH/EC | `/methodik`: DE-Snapshot verwaist, keine EN-/Link-/JSON-LD-Unit-Tests | medium | `page.svelte.test.ts` unverändert, AC 2 ungeschützt | P |
| 2 | EC | `editorialNote` DE auf `/en` ohne `lang="de"` | medium | WCAG 3.1.2, e2e prüft das Gegenteil | P |
| 3 | BH | unsichtbare Private-Use-Zeichen als Literal in `rich-text.ts` | low | `cat -v` bestätigt | P: Escapes |
| 4 | BH/EC | Close-Marker schließt beliebiges Tag | low | Fix trivial | P |
| 5 | BH/EC | Platzhalter-Parität nur für `methodik_*` | low | | P |
| 6 | BH | grammatisch falsche EN-Sätze, Klammer-Verschachtelung, „Recorded crime“ | low | sichtbar auf `/en`, EN-only | P |
| 7 | BH | verstümmelter e2e-Kommentar | low | | P |
| 8 | VG | Doc-Kommentar `editorial-disclaimer` veraltet | low | | P |
| 9 | BH/EC | Renderer fällt ohne `body_en` still auf DE zurück | low | `templates-body-en.test.ts` erzwingt `body_en` für alle Templates | R |
| 10 | EC | Story-Block ohne Effective-Locale, spätere Nutzung auf `/kiez` | low, unverifiziert | heute nur auf registrierter Seite montiert | D |
| 11 | BH/EC | Breadcrumb-Wurzel `/` nicht lokalisiert | low | gleiches Muster wie `/berlin-wahlen` | R |
| 12 | BH | Behörde in `methodik_kiez_score_sources_p1` („Senatsverwaltung Stadtentwicklung Berlin“) weicht vom korrigierten Namen ab | low | DE-Änderung außerhalb der Abnahme | D |
| 13 | BH | Linktext „/lizenzen“ auf `/en` | low | Ziel ist C4c-Seite | D (C4c) |
| 14 | BH | `/methodik/cross-layer-templates` noindex/axe ungetestet | low | explizites `noindex` vorbestehend | R |
| 15 | BH | Fixture-Werte als Messages | low | Vorschau-Fixture, keine Daten | R |
| 16 | BH | „Requires“, Pipeline-Stages literal | low | technische Bezeichner, in DE identisch | R |
| 17 | EC | EN-Layer-Namen fallen in Daten-Tabelle auf DE zurück | false | alle 56 sichtbaren Slugs haben `atlas_layer_name_*` in EN | R |
| 18 | BH/EC | Parity-Test gegen `c4a-uebersetzung.json` fehlt, Spec widersprüchlich | low | Design Note verbietet Artefakt-Tests; DE-Parität per HTML-Vergleich vor/nach und Snapshots belegt | R |
| 19 | BH | Spec ohne Notes/Zeitmessung | low | folgt in Step 5 | R |

## Design Notes

- Parity DE: Der Abgleich Messages ↔ DE-Spalte von `c4a-uebersetzung.json` läuft einmalig per Skript vor der Umstellung. Kein Test liest Dateien aus `_bmad-output/` (Review C3 Fund 5: bricht CI beim Archivieren). Dauerhafte Tests prüfen DE-Messages gegen die bisherigen DE-Texte (inline im Test oder per DOM-Vergleich) und EN-Vollständigkeit der Keys.

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5091/5091
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:wahl`, `pnpm lint:cleartext` -- expected: 0 Verstöße -- **grün**
- `pnpm build` + e2e `i18n-routing`, `methodik-flow`, neue C4a-Tests -- expected: grün (Port 4173 belegt: temporäre Config auf freiem Port, danach löschen; `static/kiez-scores/region-composites.json` nach dem Build zurücksetzen) -- **grün**: Build 0 Fehler, e2e `i18n-*` + `methodik-flow` 126/126 (3 Läufe)
