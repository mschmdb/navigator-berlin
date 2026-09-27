---
title: 'Textbereinigung: interne Artefakte aus öffentlichen DE+EN-Texten'
type: 'refactor'
created: '2026-09-27'
status: 'done'
baseline_commit: '3370babc7d535e9bbd37794430dc585a5685badb'
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
- [x] 47 Einträge umsetzen (Messages DE/EN + DE-Referenzen), Paritätstests grün
- [x] 6 Legacy-Layer löschen (Messages, Referenzen, Tests)
- [x] Zwei Methodik-Links + Tests (DE/EN-Href)
- [x] Label-Map `aggregationLevel` + Tests, `lang="de"` nur für unbekannte Werte
- [x] 8 Linktexte, Update-Überschrift, cross-layer-templates Story-Nummer, Anführungszeichen
- [x] Grep-Gate als Test oder Script (siehe Matrix)
- [x] Zeitmessung

**Acceptance Criteria:**
- Given Legende, Inspector, `/layer` und `/methodik` in DE und EN, when die Seiten rendern, then erscheinen keine Pfade, Story-/Epic-/FR-Nummern, „Option C“, „Legacy“-Hinweise, Slugs oder Palettennamen im sichtbaren Text.
- Given ein Kiez-Score-Layer, when der Nutzer die Methodik sucht, then führt ein echter Link zur lokalisierten Methodik-Seite.

## Implementation Notes

- 27.09. 11:34-11:43 Vorschlag vorbereitet (1 Subagent außerhalb des Repos). 12:04 Freigabe Matze („Ja“ zu den 10 Empfehlungen), Checkpoint 1. Umsetzung nach dem C2-Commit (gleiche Dateien).
- Umsetzung: 46 der 47 Vorschlag-Einträge per Substring-Ersetzung angewendet (chirurgisch statt Volltext-Retyping, um Transkriptionsfehler an Sonderzeichen/Umlauten auszuschließen); B-09 bis B-14 (6 Legacy-Layer) stattdessen komplett gelöscht (Entscheidung 1): Messages (`messages/{de,en}.json`), `LAYER_EXPLAIN_DE`- und `LAYER_EXPLAIN_MESSAGE`-Einträge in `layer-explain.ts`. Deletion ist sicher, weil andere Datenschichten (`value-formatters.ts`, `applicability.ts`, `editorial-config.ts`, `feature-describer.ts`, `layer-compare.ts`) dieselben 6 Slugs unabhängig referenzieren (eigene Fixtures, kein Bezug zu `LAYER_EXPLAIN_DE`) -- deren Tests bleiben unberührt.
- C-22 (S-Bahn-OSM-Tags) weicht bewusst vom Vorschlag ab: Matze-Entscheidung 4 („S-Bahnhöfe und Haltepunkte aus OpenStreetMap") ersetzt den Vorschlag-Wortlaut („S-Bahn-Bahnhöfe aus OpenStreetMap.").
- DE-Anführungszeichen-Fix (C2-Review #13, „Zusätzlich"-Bullet) griff breiter als die 47 Einträge: alle `layer_explain_*`/`layer_methodology_*`/`disclaimer_*`-Messages mit dem Muster „…" (falsche gerade Schlussanführung) wurden auf „…“ korrigiert -- 16 Messages plus die DE-Referenzkopien in `layer-explain.ts`, `layer-methodology.ts` und `editorial-disclaimer.svelte` (Parität), plus 4 weitere Stellen auf der `/methodik/kiez-score`-Seite außerhalb der 47 Einträge (gleiche Textfamilie).
- Zwei echte Methodik-Links (Entscheidung 6): `src/lib/data/aggregation-level-label.ts` (neu, TDD: Test zuerst rot) kapselt die G-47-Label-Map; `/layer/[slug]/+page.svelte` verzweigt die Aside für `kiez-score-*`-Slugs auf `/methodik/kiez-score` (eigene Messages `layer_page_methodik_kiez_score_{link_label,suffix}`), `map-legend.svelte` verlinkt „Eigene Berechnung" ebenso (der `derived/`-Präfix in `sourceUrl` ist faktisch nur bei den 8 Kiez-Score-Layern gesetzt, kein zusätzlicher Slug-Filter nötig).
- G-47 Label-Map: „Einzelstandort“/„Individual site“ und „Baublock“/„City block“ nach Matze-Entscheidung 7 (nicht die ungeprüften Vorschlag-Varianten mit OSM-Klammerzusatz); übrige fünf Ebenen aus dem bestehenden LOR-Glossar. Unbekannte Enum-Werte kommen roh zurück und behalten `lang="de"` (Test deckt das ab).
- 8-Linktext-Stellen: 4 in `src/lib/components/wahl-portal/{portal-quellen,winner-map,ergebnis-panel,small-multiples}.svelte` (neue geteilte Message `wahl_portal_methodik_wahldaten_link_label`), 4 hart codiert in `methodik/+page.svelte` (2×) und `lizenzen/+page.svelte` (2×, DE-only). Die 4 Update-Posts mit `[/methodik/kiez-score](...)`-Linktext bleiben unangetastet (nicht Teil der 8, siehe Vorschlag Offene Frage 9).
- F-45 (relativer Pfad in `llms-full.txt`) brauchte echtes Origin-Threading statt reinem Textfix: `renderScoreSection()` (`aggregate-renderer.ts`) bekam einen `origin`-Parameter mit Default `https://navigator.berlin`, durchgereicht über `{Kiez,Bezirk}RenderInput.origin` (optional) bis zu `collectLlmsData`s vorhandenem `origin`-Parameter. F-46 (`llm-export-builder.ts`) bleibt trivial: der Builder kennt keinen Origin, deshalb feste absolute URL wie im Vorschlag.
- Grep-Gate: `scripts/lint-cleartext-artifacts.ts` (+Test) scannt bewusst NICHT das ganze Repo -- Code-Kommentare mit echten Story-Referenzen und `href`-Attributwerte (funktionierende Links) sind kein Artefakt im Sinne der Spec. Scannt `messages/{de,en}.json` (Werte) plus eine kuratierte Liste der Fundort-Dateien, vorher bereinigt um `<script>`-Blöcke/Kommentare, `href`-Attribute und Markdown-Linkziele.
- Test-Aufräumarbeiten durch die Legacy-Löschung und den D-29-Textwechsel: `layer-hit-row.svelte.test.ts` (2 Tests nutzten `mietspiegel-wohnlage` als Fixture für Explain-Text-Assertions, umgestellt auf `ortsteile`), `bezirk-hero.svelte.test.ts` (FAQ-Placeholder-Regex aktualisiert). Review-Fund beim Selbst-Check: eine der drei quote-fix-Stellen in `layer-methodology.ts` (kiez-score-kriminalitaet omission[1]) fehlte zunächst im Skript und brach den DE-Paritätstest -- nachgezogen.
- Zeitmessung: 27.09. 12:04 Freigabe -- Umsetzung direkt im Anschluss, Recherche + Implementierung + Tests + Verification in einer durchgehenden Session (kein Wartezeit-Log, da Einzel-Agent-Lauf ohne Koordinator-Zwischenstopps).

- Zeitmessung gesamt (Koordinator): Vorschlag 11:34-11:43, Freigabe Matze 12:04, Umsetzung 12:12-12:48 (36 min), Review 12:48-12:52, Patch-Runde 12:53-~13:11 (Agent ohne Hand-back beendet, Koordinator hat Stand 15:08 selbst geprüft), Abschluss-Verifikation 15:08-15:12.
- Qualität: 24 Review-Funde in 17 Einträgen (3 medium: Grep-Gate blind für Script-Strings, Update-Posts mit Pfad-Linktext, Faktenfehler im Versorgung-Text), 11 gepatcht, 4 deferred, 2 rejected. Versorgung-Kurztext an Methodik angeglichen, Wortlaut Matze gezeigt. Abschluss: vitest 5006/5007 (winner-map-Flake), check 0, lint:wahl 0, lint:cleartext 0, build grün, e2e 106/106.


## Review Triage Log

Runde 1 (27.09.2026 12:52), 3 Layer: Blind Hunter (BH) 13, Edge Case (EC) 8, Verification Gap (VG) 3. Triage Koordinator. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC/VG | Grep-Gate entfernt ganze `<script>`-Blöcke und übersieht sichtbare Strings (Kiez-Score-Seite, Disclaimer-Map) | medium | Gate grün trotz Artefakt | P |
| 2 | BH/EC | Gate: kuratierte Dateiliste, `FR5\d` zu eng, cwd-abhängig, kein `pnpm`-Script, Strip-Funktionen ungetestet | gap | | P |
| 3 | EC/BH | 5 Update-Posts zeigen `/methodik/kiez-score` als Linktext | medium | Entscheidung 9 | P |
| 4 | BH | Versorgung-Text im Inspector widerspricht Methodik (Distanz statt Dichte, Schule 800 m statt 600/1.200 m, Nahversorgung fehlt) | medium | Faktenfehler in bearbeitetem String | P: an Methodik angleichen, Matze informieren |
| 5 | BH | „Grobste“, „Daten-Build“ neben „Daten-Update“ | low | | P |
| 6 | BH | „Bezirksregion (143)“ vs. „138 in Berlin“ | maybe-false | Welche Zahl stimmt, braucht Datenprüfung | D |
| 7 | BH | EN-Linktext „Wahldaten methodology“, 3 Komponenten ohne Test | low | | P |
| 8 | BH/EC | Legende verlinkt jeden `derived`-Layer auf Kiez-Score-Methodik; doppelte Erkennung; Linktext „Eigene Berechnung“ nennt Ziel nicht (WCAG 2.4.4) | low | | P: gemeinsamer Helper, nur Kiez-Score, zugänglicher Name |
| 9 | VG/BH | Test für absolute Export-URL zu locker | gap | | P |
| 10 | BH | Label-Map: `font-mono`, Tests nur über Großschreibung | low | | P; Stilmix EN R (Glossar) |
| 11 | BH | `/methodik/kiez-score` nennt `pnpm data:aggregate-scores`, DB-Tabellen, „Phase 2“ | low | Never: keine weitere `/methodik`-Überarbeitung | D |
| 12 | BH | Denglisch | low | Entscheidung 10 | R |
| 13 | BH/EC | Legacy-Slugs stehen noch in Formattern, Compare, Editorial-Config | low | Spec: Messages/Referenzen/Tests, Code-Zweige harmlos | D |
| 14 | BH | Layernamen auf Kiez-Score-Seite hart codiert, „50 m“ nicht an Config gekoppelt | low | | D |
| 15 | VG/BH | `collectLlmsData`-Origin ungetestet, Origin mit Slash | low | Default Prod-URL | D |
| 16 | BH | Update-Überschrift wiederholt sich im ersten Satz | low | direkte Korrektur | P |
| 17 | BH | Zeitmessung ohne Messwerte | low | Fix editiert Spec | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 473/474 Dateien, 4962/4963 Tests grün. 1 vorbestehender `winner-map.svelte.test.ts`-Flake (Datei nur in einer Test-Assertion angepasst, Flake-Ursache unverändert), isoliert erneut ausgeführt: 13/13 grün.
- `pnpm check` -- expected: 0 Fehler -- **grün**: 6545 Dateien, 0 Fehler, 0 Warnungen.
- `pnpm lint:wahl` -- expected: 0 Verstöße -- **grün**: 72 Dateien, 0 Verstöße.
- `pnpm build` + e2e `i18n-layer-frame`, `i18n-atlas`, `i18n-routing` -- expected: grün -- **`pnpm build` grün** (voller Prebuild inkl. DB-Migration, Wahl-Fetch, 261 OG-Bilder, 0 Fehler; `static/kiez-scores/region-composites.json` bekam nur ein neues `generatedAt`, per `git checkout` zurückgesetzt). **e2e grün**: 72/72 (`i18n-layer-frame`, `i18n-atlas`, `i18n-routing`, inkl. des zuvor als Fokus-Flake dokumentierten „Escape schließt das Dropdown"-Tests, diesmal grün). Playwright-`webServer` brauchte `reuseExistingServer: true` für den lokalen Lauf (Default-Timeout reicht nicht für den vollen Prebuild) -- Server separat mit `pnpm build && pnpm run preview` gestartet, Config-Zeile nach dem Lauf zurückgesetzt, keine dauerhafte Änderung.
- Zusätzlich (nicht in der Spec gelistet, aber vor Abschluss geprüft): `pnpm exec eslint` auf allen geänderten/neuen Dateien -- 0 neue Fehler (die verbleibenden `svelte/no-navigation-without-resolve`-Meldungen sind ein projektweiter Bestand, der `localizedHref()`-Konvention folgt, keine Regression). `pnpm lint` (Prettier) hatte einen projektweiten Bestand von 301 unformatierten Dateien vor dieser Spec; 4 meiner Edits kamen neu dazu und wurden mit `prettier --write` auf genau diese 4 Dateien behoben (kein Formatting-Fix am restlichen Bestand, außerhalb des Auftrags).
