---
title: 'Warme Orte: Öffnungsstatus aus Recherche-Zeiten (#80)'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '25b938f7609b7040bdafc44bdd9b04cd32f2fccc'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
  - '{project-root}/docs/waerme-orte-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Status („laut OSM offen/geschlossen“) und Filter „jetzt offen“ rechnen nur mit OSM-`oh`. Die redaktionelle Recherche (`opening_hours_note`, 214 Orte, mit Quelle und Prüfdatum) ist oft aktueller. Samstagmittag erscheinen Heilandskirche (Recherche Sa 11–13) und Schultheiss Quartier (Recherche Mo–Sa 10–20) als geschlossen, obwohl die Karte darunter die Recherche-Zeiten zeigt (Epic #57).

**Approach:** Neues Feld `oh_recherche` (OSM-opening_hours-Syntax) in `enrichment.json`, abgeleitet aus `opening_hours_note`. Status und Filter nutzen `oh_recherche`, sonst `oh`. Das Label nennt die Quelle: „laut Recherche offen“ bzw. „laut OSM offen“.

## Boundaries & Constraints

**Always:**
- Ableitung nur, wenn die Notiz einen eindeutigen Wochenplan nennt. Keine erfundenen Zeiten. Jeder Wert parst mit dem Paket `opening_hours` (Berlin-Kontext wie `opening-status.ts`).
- Notiz vorhanden, aber nicht eindeutig übertragbar (z. B. „nach Gottesdienst“, „saisonal“, „zu Veranstaltungen“): `oh_recherche: "unklar"`; dann zeigt die Karte **keinen** Status und der Filter blendet den Ort aus. OSM-`oh` widerspräche sonst der sichtbaren Notiz.
- Keine Notiz: Status wie bisher aus OSM-`oh`.
- Pipeline neu laufen lassen (`data:waerme-orte`, `data:waerme-orte-fetch`), Validierung prüft `oh_recherche`.
- Transparenz- und Methodiktexte nennen beide Quellen. DE/EN von Hand, keine em-dashes, Tests zuerst.

**Never:**
- Keine Änderung an OSM-`oh`, an `opening_hours_note`, Winter-/Aufenthalt-/Eintritt-Angaben oder an der Ortsauswahl.
- Keine Änderung an Kühlen Orten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Recherche eindeutig | Heilandskirche, Sa 12:17 | „laut Recherche offen“, im Filter „jetzt offen“ | N/A |
| Recherche eindeutig | Schultheiss Quartier, Sa 12:17 | „laut Recherche offen“ | N/A |
| Recherche „unklar“ | Notiz ohne festen Plan | kein Status, Filter blendet aus | N/A |
| Nur OSM | keine Notiz, `oh` gesetzt | „laut OSM offen/geschlossen“ wie bisher | N/A |
| Ungültiger Wert | `oh_recherche` parst nicht | Validierung schlägt fehl, Build bricht ab | Fehlermeldung mit ID |

</frozen-after-approval>

## Code Map

- `static/data/waerme-orte/enrichment.json` -- Quelle; neues Feld je Ort mit Notiz. Ableitung per Agent, Ergebnis Teil des Diffs; Statistik (übertragen / unklar) in Implementation Notes.
- `scripts/lib/waerme-orte/types.ts:41-56` -- `WaermeEnrichment.oh_recherche?: string`.
- `scripts/lib/waerme-orte/enrichment.ts:59,84` -- `validateEnrichment`: Typ, `"unklar"` erlaubt, sonst Parse-Check mit `opening_hours`; Test `enrichment.test.ts`; `data.test.ts` validiert echte Daten.
- `scripts/lib/waerme-orte/merge.ts:13-31,146-166` -- Property `oh_recherche` durchreichen (sonst fällt das Feld weg); Test `merge.test.ts`.
- `scripts/build-waerme-orte.ts`, `scripts/fetch-static.ts` -- neu laufen lassen; `static/layers/MANIFEST.json` + gehashte Layer-Datei ändern sich; `waerme-orte-layer-file.test.ts` muss grün bleiben.
- `src/lib/data/get-waerme-orte-index.ts:19,28-29,47,66,74` -- Mapper: `openingHours` + `hoursSource: 'recherche' | 'osm' | 'unklar' | null`.
- `src/lib/kaelte/nearest-waerme-orte.ts:13,33,45-46,55` -- Status/Filter aus effektiven Zeiten; `unklar` → Status `null`, Filter raus.
- `src/lib/kaelte/waerme-ort-labels.ts:10-15` -- `statusText` mit Quelle; neue Keys `kaelte_orte_status_*_recherche` (DE/EN), bestehende OSM-Keys bleiben.
- `src/lib/components/kaelte/warme-orte-naehe.svelte:237-239`, `inspector-panel/waerme-orte-card.svelte:231-234` -- Quelle an `statusText` übergeben.
- `messages/*.json:2417` (`kaelte_orte_transparenz_osm_detail`), `src/lib/data/layer-methodology.ts:422-430`, `layer-methodology-messages.ts:227ff`, `docs/waerme-orte-methodik.md:17,69,85` -- Texte: Status aus Recherche-Zeiten, sonst OSM.
- Nicht ändern: `poi-summary-builder.ts` (Popup nutzt `oh` nicht), `filter.ts:68`.

## Tasks & Acceptance

**Execution:**
- [x] Pipeline-Typ, Validierung, Merge + Tests.
- [x] `enrichment.json`: `oh_recherche` für alle Orte mit Notiz ableiten; Pipeline + fetch-static laufen lassen.
- [x] App: Index-Mapper, Status/Filter, Labels + Tests (inkl. Heilandskirche/Schultheiss als Fixture mit fester Zeit Sa 12:17).
- [x] Texte Transparenz/Methodik DE/EN + Doku.
- [x] E2E bestehend grün; Status-Text-Assertions ggf. anpassen.

**Acceptance Criteria:**
- Given Samstag 12:17, when die Person die Warme-Orte-Karte an der Thusnelda-Allee öffnet, then zeigt sie Heilandskirche und Schultheiss Quartier als „laut Recherche offen“.
- Given eine Notiz ohne festen Plan, when die Karte den Ort zeigt, then behauptet sie keinen Öffnungsstatus.

## Implementation Notes

- `oh_recherche` abgeleitet für 217 geeignete, bestehende Orte mit Notiz: 174 übertragen, 43 `unklar`. Orte ohne Notiz und ungeeignete Orte tragen das Feld nicht.
- `unklar`: mehrere Bereiche in einer Notiz, widersprüchliche Quellen, "ca."/"meist", Sonntag "nicht genannt", Gottesdienst/Aushang, Schließung ab Dez 2026.
- Datierte Schließtage aus der Notiz stehen als `off`-Regeln drin. Unbestimmte ("Putzwoche", "einzelne Schließtage", "Adventssamstage") fehlen.
- Heilandskirche `We 12:00-18:00; Sa 11:00-13:00`, Schultheiss `Mo-Sa 10:00-20:00`.
- Tests: Pipeline (enrichment, merge, data), Index-Mapper, nearest (Fixture Sa 12:17), Labels, Komponente.

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Einhorn `node/12396794880`: zweite Regel überschreibt Di-Do-Vormittag | medium | patch | Parser: Di 11:00 geschlossen. Daten-Audit + Blind Hunter. |
| 2 | Saisonale Notizen ganzjährig übertragen (`node/2335146075`, `way/53125939`) | medium | patch | Apr-Sep erfunden. |
| 3 | `Mo PH` erzeugt Parser-Warnung, Pfingstmontag falsch (`node/545074057`, `node/8428338215`) | low | patch | `getWarnings()`. |
| 4 | Uneinheitlich: „Sonntag nicht genannt“ teils `unklar`, teils übertragen; klare Pläne mit Datumsregel/Zusatz als `unklar`; undatierte Folder-Quellen uneinheitlich; „während Ausstellungszeiten“ übertragen | low | patch | Daten-Audit, 8 IDs. |
| 5 | Datierte Schließtage teils ohne Jahr, wiederholen sich jährlich | low | patch | `Oct 03-04 off` gilt jedes Jahr. |
| 6 | Recherche-Zeiten verlieren OSM-`PH off`: 59 Orte, 36 „offen“ am 25.12. | medium | patch | Notizen nennen Feiertage selten; OSM-`PH off` anhängen, wenn Recherche keine PH-Regel hat. |
| 7 | Validator nutzt zeitabhängige Status-Funktion aus Komponenten-Modul, ignoriert Warnungen und Unknown-Zustände | medium | patch | Build-Ergebnis hängt von Uhrzeit ab. |
| 8 | Nächster Recherche-Merge löscht `oh_recherche` still; Feld nicht an Notiz gekoppelt; verwaiste Werte bauen durch | medium | patch | `mergeEnrichmentResults` ersetzt Eintrag ganz; Regel nur in `data.test.ts`. |
| 9 | Inspector-Karte ohne Test für „laut Recherche“ | low | patch | Fixture nur `hoursSource: null`. |
| 10 | `statusText` mit Default `'osm'` | low | patch | Vergessenes Argument nennt falsche Quelle. |
| 11 | Transparenztext doppelt und unter falscher Quelle | low | patch | OSM-Absatz erklärt Recherche. |
| 12 | Widersprüchliche Quellen übertragen (5 IDs) | low | reject | Notiz nennt jeweils die Primärquelle; Abweichung zu OSM ist der Anlass dieser Story. |
| 13 | Mall mit Dachterrasse übertragen | low | reject | Mall-Zeiten sind der Aufenthaltsort. |
| 14 | 38 Orte mit OSM-Zeiten ohne Status (`unklar`) | false | reject | Spec-Entscheidung. |
| 15 | Status-Abdeckung ohne Zahlen im Methodiktext | low | reject | Hartcodierte Zahlen bereits deferred (#71). |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte kaelte-explorer orte-layer-modus a11y` -- expected: grün außer bekanntem „Escape löscht Selection“ (und flaky Root-axe, deferred)
