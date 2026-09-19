---
title: 'Ergebnis-Panel und Zahlen-Transparenz'
type: 'feature'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '895f993346312fe85a4eb9495600c4aa8ce10853'
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Winner-Map hängt ohne Zahlen-Anker in der Luft (Matze-Direktive 19.09., Tagesspiegel-Referenz): Eine Winner-Karte ohne daneben stehende Stimmenanteile führt zu Fehlschlüssen (SPD 18,4 % stadtweit, aber kaum Flächen). Woher die Zahlen kommen, ist an der Karte nur verlinkt, nicht erklärt.

**Approach:** Neues `ergebnis-panel` im Karte-Kapitel: Ranking-Liste der Parteien für die aktive Auswahl (Berlin gesamt) mit Anteil, Farb-Balken in Partei-Farbe und Delta zur Vorwahl, dazu Datenstand, amtliche Quelle und ein Berechnungs-Disclosure. Datenbasis: die Series-API, additiv um `ebene=berlin` erweitert (ein Response pro Reihe, Deltas client-seitig aus den Jahres-Punkten). Desktop zweispaltig neben der Karte, mobil darunter.

## Boundaries & Constraints

**Always:**
- Series-API additiv: `ebene=berlin` akzeptiert (Parameter `gebiet` entfällt dann bzw. wird ignoriert), neue Query-Funktion nach dem `seriesFromKiez`-Muster über `wahl_aggregat_berlin` (Top-N der jüngsten Wahl, dann alle Jahre); Response-Shape identisch (points je Jahr×Partei, `coverage_ab`, license/source). Bestehende kiez/bezirk-Semantik byte-identisch.
- Panel-Inhalt für die aktive Auswahl (Reihe/Jahr/Stimmtyp aus dem Portal-Context): Rang, Partei (mit Farb-Swatch), Anteil (eine Dezimalstelle, `formatAnteilPct`), horizontaler Balken in Partei-Farbe (Breite = Anteil, `tabular-nums`), Delta zur unmittelbar vorherigen Wahl derselben Reihe als `±x,x Pp.`-Badge (erste Wahl der Reihe: kein Delta); Wiederholungswahl-Kontext im Delta-Label („vs. 2021").
- Panel zeigt Berlin gesamt; auf Kiez-/Bezirks-Anzeige-Ebene zusätzlich das per Adress-Suche hervorgehobene Gebiet als zweiter Block (Series-API mit `gebiet`); auf Stimmbezirks-Ebene bleibt es bei Berlin gesamt plus einem Satz, dass Stimmbezirks-Verteilungen auf den Detailseiten liegen.
- Kopfzeile im Tagesspiegel-Muster: Wahl-Bezeichnung, „Endgültiges Ergebnis", Datenstand/Quelle (`source_name`, license aus der API); reservierter, leerer Slot für Wahlbeteiligung (kommt mit der Beteiligungs-Story, `data-testid="ergebnis-panel-beteiligung-slot"`, rendert heute nichts Sichtbares).
- Berechnungs-Disclosure (bits-ui Accordion, Muster portal-quellen): 2-3 Sätze zur Herkunft (amtliche Summen für Berlin/Bezirk, Kiez als Flächen-Aggregat, Briefwahl-Behandlung) + Links /methodik/wahldaten und /lizenzen; Texte `lint:wahl`-konform.
- Layout: Karte-Kapitel wird auf Desktop (lg+) zweispaltig (Karte ~2/3, Panel ~1/3, Panel sticky innerhalb des Kapitels erlaubt), mobil Panel unter der Karte vor der Legende; A11y: Panel als `<section>` mit eigener Überschrift, Liste als echte Liste, Balken `aria-hidden` mit Text-Werten daneben.
- Loading/Fehler/DB-los nach Bestandsmuster: eigener Panel-Status (Lade-/Fehler-Hinweis), DB-los leerer Zustand ohne 5xx; Stale-Guards beim Reihe-Wechsel (Series-Cache pro Reihe×Stimmtyp).
- Deltas pure berechnet (`internal/ergebnis-panel-data.ts`): aus den Series-Punkten je Partei Anteil(jahr) − Anteil(vorjahr der Reihe); Parteien des aktiven Jahres nach Anteil absteigend, Gleichstand alphabetisch (Haus-Regel); Sonstige ans Ende.
- TDD (ADR-012): Berlin-Query + Routen-Zweig test-first (Muster series-Tests inkl. defensivem With-DB-Block), Panel-Datenaufbereitung pure test-first, Panel als Component-Test (Render, Delta-Badges, Beteiligungs-Slot leer, Disclosure), E2E-Erweiterung (Panel neben Karte, Werte aus Mock, Jahr-Wechsel aktualisiert Deltas ohne neuen Request). Dateien < 500 Zeilen; kein Push/Deploy (Freeze).

**Never:**
- Keine Wahlbeteiligungs-Zahlen (Daten fehlen bis zur Beteiligungs-Story); keine Sitz-/Koalitionsdarstellung (Non-Goal bis offizielle 2026er-Sitzzahlen).
- Keine Klick-auf-Karte-Gebietsauswahl (nur der bestehende Adress-Treffer); kein eigener Stimmbezirks-Verteilungs-Fetch.
- Keine Änderung an Winner-Map-Logik außer dem Layout-Einbau; bestehende Series-Responses für kiez/bezirk unverändert.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy Path | AGH 2023 aktiv | Panel: CDU 28,2 % (+10,2 Pp. vs. 2021), SPD 18,4 % (−2,9 Pp.) …, Balken proportional | N/A |
| Erste Wahl der Reihe | AGH 2011 (bzw. ältestes Jahr) | Anteile ohne Delta-Badges | N/A |
| Jahr-Wechsel | Chip 2016 | Panel aktualisiert aus dem geladenen Series-Response, kein neuer Request | N/A |
| Adress-Treffer auf Kiez-Ebene | Gebiet hervorgehoben | zweiter Block mit Gebiets-Verteilung (Series `gebiet`), Berlin-Block bleibt | Gebiet ohne Daten → Block mit Hinweis |
| Stimmbezirks-Ebene | Default-Ansicht | Berlin-Block + Satz zu Detailseiten, kein Gebiets-Block | N/A |
| API berlin | `ebene=berlin` | points aller Jahre der Reihe, `gebiet` ignoriert | ungültige Reihe → 400 wie bisher |
| DB-los | keine Daten | Panel-Leerzustand, keine 5xx | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/api/wahl/series/+server.ts` + `server.test.ts` -- `ebene`-Picklist um `berlin` erweitern; bei berlin `gebiet` optional/ignoriert, 404-Zweig entfällt; Response `gebiet: 'berlin'`.
- `src/lib/server/db/queries/wahl/get-series-for-gebiet.ts` + `wahl-queries.test.ts` -- neue Funktion `seriesFromBerlin` (Muster seriesFromKiez, `wahl_aggregat_berlin`, kein Slug-Filter) als dritter Zweig von `getSeriesForGebiet` (`ebene: 'berlin'`, gebietSlug ignoriert).
- `src/lib/components/wahl-portal/internal/ergebnis-panel-data.ts` (+ Test) -- pure: Series-Punkte → Panel-Rows des aktiven Jahres (Rang, Anteil, Delta zum Vorjahr der Reihe, Sortierung Anteil desc/alphabetisch, Sonstige ans Ende), Delta-Formatierung `±x,x Pp.` (de-DE Komma, U+00B1-frei: echtes Plus/Minus), Vorjahres-Label.
- `src/lib/components/wahl-portal/ergebnis-panel.svelte` (+ `.svelte.test.ts`) -- Panel: Kopf (Wahl-Label, Datenstand, Quelle, leerer Beteiligungs-Slot), Rows mit Swatch+Balken+Delta-Badge, optionaler Gebiets-Block, Berechnungs-Disclosure; Series-Fetch mit Cache pro Reihe×Stimmtyp×Ebene(berlin/gebiet) + Stale-Guards (Muster winner-map).
- `src/lib/components/wahl-portal/winner-map.svelte` -- Layout-Einbau: Kapitel-Grid lg:2-spaltig, Panel-Slot; `highlightedSlug`/Anzeige-Ebene an das Panel durchreichen (Props, kein neuer Context).
- `src/lib/data/partei-farben.ts` -- `parteiColor` für Swatches/Balken (Bestand); `formatAnteilPct` aus `winner-map-data`.
- `tests/e2e/berlin-wahlen.e2e.ts` -- Series-berlin-Mock; Assertions: Panel-Werte, Delta-Badge, Jahr-Wechsel ohne Zweit-Request (Request-Counter), Stimmbezirks-Hinweis-Satz.
- Nicht anfassen: winners-API, StimmbezirkLoader, Analytik, Steuerleiste.

## Tasks & Acceptance

**Execution:**
- [x] `get-series-for-gebiet.ts` Berlin-Zweig + Query-Tests zuerst (Fallback + defensiver With-DB-Block: AGH-Reihe liefert Punkte mehrerer Jahre, Anteile 0..1)
- [x] `/api/wahl/series` ebene=berlin + Routen-Tests (400-Fälle unverändert, DB-los leer, With-DB: AGH 2023 CDU ≈ 0.282)
- [x] `internal/ergebnis-panel-data.ts` + Test -- Rows/Deltas/Sortierung/Labels pure, test-first (Fixture-Reihe mit bekannten Deltas, Wiederholungswahl-Label, erste Wahl ohne Delta)
- [x] `ergebnis-panel.svelte` + Component-Tests (Render mit Fixture-Fetch, Delta-Badges, leerer Beteiligungs-Slot vorhanden, Disclosure öffnet, Gebiets-Block bei highlightedSlug, Stimmbezirks-Satz)
- [x] `winner-map.svelte` -- Grid-Einbau + Props-Durchreichung; bestehende Tests bleiben grün
- [x] E2E-Erweiterung (Panel sichtbar neben Karte, Werte, Jahr-Wechsel-Delta ohne neuen Request)
- [x] `pnpm lint:wahl` grün über neue Texte

**Acceptance Criteria:**
- Given der Series-berlin-Mock mit 2016/2021/2023, when 2023 aktiv ist, then zeigt das Panel die 2023er-Anteile mit korrekt berechneten Deltas zu 2021, und ein Jahr-Wechsel auf 2016 zeigt Deltas zu 2011 bzw. keine (ältestes Jahr) ohne neuen Series-Request.
- Given die echte DB, when `/api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=berlin` läuft, then enthalten die Punkte CDU 2023 mit Anteil ≈ 0,282 (With-DB-Test, defensiv).
- Given Stimmbezirks-Anzeige-Ebene, then rendert das Panel Berlin gesamt plus Detailseiten-Satz und keinen Gebiets-Block.
- Given `pnpm vitest run` (beide Projekte), `pnpm check`, `pnpm lint:wahl`, E2E gegen Build, then alles grün.

## Implementation Notes

**Series-API-Erweiterung:** `getSeriesForGebiet` bekommt einen dritten Zweig `seriesFromBerlin` (Muster `seriesFromKiez`, ohne Slug-Filter, `wahl_aggregat_berlin`). Die Route validiert `gebiet` weiterhin für kiez/bezirk (400 unverändert), lässt es für `ebene=berlin` optional/ignoriert und meldet `gebiet: 'berlin'` in der Response; der 404-Zweig gilt nur noch für kiez/bezirk.

**Delta-Berechnung:** `buildErgebnisPanelRows` (`internal/ergebnis-panel-data.ts`) bestimmt das Vorjahr als das nächstkleinere Jahr, das in den Punkten tatsächlich vorkommt (nicht `jahr - 1`) -- deckt Wiederholungswahlen und Wahlen mit Lücken korrekt ab. Parteien ohne Vorjahres-Row (neu in der Reihe) bekommen `deltaPp: null`, keinen erfundenen 0-Vergleich. Sortierung: Anteil absteigend, Gleichstand alphabetisch (de), „Sonstige" immer ans Ende. Delta-Label nutzt echtes `+`/`−` (U+2212), kein `±`.

**Ergebnis-Panel-Fetch:** `ergebnis-panel.svelte` lädt die Berlin-Reihe einmal pro Reihe×Stimmtyp (`ebene=berlin`) und cached sie; ein Jahr-Wechsel liest nur aus dem bereits geladenen Response (Deltas client-seitig), kein Zweit-Request -- Component- und E2E-Test decken das über einen Request-Counter ab. Der Gebiets-Block (kiez/bezirk mit Adress-Treffer) fetcht zusätzlich `ebene=kiez|bezirk&gebiet=<slug>`, gecacht pro Reihe×Stimmtyp×Ebene×Slug; auf Stimmbezirks-Ebene bleibt es bei Berlin gesamt + Detailseiten-Satz (Series-API kennt diese Ebene nicht).

**Winner-Map-Layout:** `winner-map.svelte` wird zum Grid-Container (Desktop lg+ zweispaltig: Karte+Legende/Tabelle links, Panel rechts sticky; mobil natürliche DOM-Reihenfolge Karte → Panel → Legende/Tabelle, keine CSS-`order`-Tricks nötig). Die Adress-Hervorhebung (Zustand + Handler, bisher inline) wanderte nach `internal/winner-map-address.svelte.ts` (eigene Klasse `AddressHighlight`, Muster `WinnerMapController`/`StimmbezirkLoader`) -- Datei-Zeilenlimit: `winner-map.svelte` wäre mit Panel-Einbau sonst auf 514 Zeilen gewachsen, jetzt 477. `highlightedSlug`/`highlightedName`/`anzeigeEbene` gehen als Props ans Panel (kein neuer Context), Stimmbezirk liefert bewusst `null` (Panel hat keinen Stimmbezirks-Zweig).

**Test-Strategie:** Server-Query + Route test-first (defensiver With-DB-Block, Muster `series/server.test.ts`); `ergebnis-panel-data.ts` pure mit Fixture-Reihe (2016/2021/2023, bekannte Deltas); Component-Tests über einen Context-Probe (`internal/ergebnis-panel-context-probe.svelte`, Muster `winner-map-context-probe.svelte`) inkl. Jahr-Wechsel-Request-Counter; E2E-Erweiterung in `tests/e2e/berlin-wahlen.e2e.ts` (Series-Mock, Werte, Delta-Badges, Jahr-Wechsel ohne Zweit-Request, Stimmbezirks-Hinweis). Alle Suiten grün: `pnpm vitest run` (server 288/2691, client 101/858), `pnpm check` (0/0), `pnpm lint:wahl` (26 Dateien, 0 Verstöße), Playwright gegen den Preview-Build (8/8 in `berlin-wahlen.e2e.ts`).

**Bekannte Flakiness (nicht Teil dieser Story, bereits in Story 5 dokumentiert):** `winner-map.svelte.test.ts` Test „Adress-Auswahl außerhalb Berlins" ist zeitbasiert (400ms-Debounce-Wait) und flakt beim Lauf der ganzen Datei -- verifiziert auch auf dem unveränderten Baseline-Stand (vor meinem Winner-Map-Refactor), also keine Regression dieser Story. Isoliert bzw. in kleineren Teilmengen läuft er zuverlässig grün.

## Spec Change Log

## Review Triage Log

Drei Layer (Blind Hunter N=10, Edge Case Hunter, Verification Gap) gegen `/tmp/story6-diff.patch`. 9 Patches angewendet, 5 Rejects, 3 Notes. Verifikation nach Patch-Runde: unit 3550/3550, check 0, lint:wahl 0, eslint 0, E2E 8/8.

| # | Quelle | Fund | Verdict | Maßnahme |
|---|--------|------|---------|----------|
| 1 | BH-1/2 | catch-Guards in `loadBerlinSeries`/`loadGebietSeries` prüften weniger Dimensionen als der Success-Pfad (stale Error konnte frischen State überschreiben) | accepted | Guards symmetrisch: typ+stimmtyp bzw. typ+stimmtyp+ebene+slug |
| 2 | EC-a/BH-6 | `AddressHighlight.select()` capturte `anzeigeEbene` vor dem `await`; Ebenen-Wechsel im Flug ließ das alte Ergebnis `reset()` überschreiben | accepted (HIGH) | Re-Check `getAnzeigeEbene() !== anzeigeEbene` nach dem `await`, early return |
| 3 | BH-3 | Gebiets-Block ohne „Veränderung vs. <Jahr>"-Caption (Berlin-Block hatte sie) | accepted | `ergebnis-panel-gebiet-vorjahr-label` ergänzt |
| 4 | BH-4 | Gebiets-Delta-Branch ungetestet (Fixture hatte nur ein Jahr) | accepted | `SERIES_GEBIET` + 2021-Punkt, Assertions `+6,0 Pp.` und „vs. 2021" |
| 5 | VG-1/BH-5 | Verdrahtung Adress-Suche → `gebietSlug` → Panel-Gebiets-Block auf keinem Pfad durch den echten Komponenten-Baum getestet | accepted | Neuer Component-Test in `winner-map.svelte.test.ts` (Adresse wählen, `ergebnis-panel-gebiet-block` + Gebiets-Anteil asserted) |
| 6 | EC-e | Retry-Loop im Kein-Gebiet-Test brach bei JEDEM Hint, nicht beim erwarteten Text | accepted | Break-Bedingung auf `includes('kein Gebiet')` |
| 7 | EC-f | Balken-`width` ohne unteren Clamp (negative Breite bei malformed `anteil`) | accepted | Beidseitig geclampt `Math.min(Math.max(…, 0), 100)` |
| 8 | BH-10 | 400-Message implizierte gebiet-Pflicht auch für `ebene=berlin` | accepted | Message präzisiert („gebiet zusätzlich für ebene=kiez\|bezirk") |
| 9 | BH-8 | Kein Live-Announcement bei Panel-Statuswechseln | accepted (low) | `role="status"` auf Loading-/Empty-Absätzen; Error hatte `role="alert"` |
| 10 | BH-7 | Legende/Tabelle aus der `<figure>` gelöst (A11y-Gruppierung) | rejected | Grid-Layout braucht direkte Kinder; Tabelle trägt eigene Caption, Legende eigenes Label. Semantik pro Einheit intakt |
| 11 | BH-9 | Retry-Loop verdecke echten Timing-Bug | rejected als Story-Blocker, note | Flake liegt im bits-ui-Combobox-Debounce im vitest-Harness, nicht im Produkt (E2E + Prod-Pfad sauber). Bereits in Story 5 dokumentiert |
| 12 | EC-b | Per-Point-Shape-Validierung fehlt (NaN-Labels möglich) | rejected | Same-Origin-API unter eigener Kontrolle; Array-Guard ist das Haus-Muster (winner-map identisch) |
| 13 | EC-c | `getSeriesForGebiet`: `gebietSlug` null wird für kiez/bezirk still zu `''` | rejected | Interner Vertrag; die Route validiert davor (400). Leerer Slug liefert leere Reihe, kein Crash |
| 14 | EC-d | Sortierung vergleicht rohe Floats vor dem Alpha-Tie-Break | rejected | Gleichstands-Regel bezieht sich auf echte Wertgleichheit; Runden vor dem Vergleich würde real verschiedene Anteile falsch ordnen |
| 15 | VG-note | Defensive With-DB-Assertions (CDU ≈ 0.282) laufen ohne lokale DB nicht | note | Haus-Muster (ADR-013-Konvention), kein Handlungsbedarf |

## Design Notes

Das Panel holt die ganze Reihe einmal (Series-berlin) und rechnet Deltas client-seitig; das deckt Jahr-Wechsel ohne weitere Requests und liefert Story 7 (Zeit-Animation) später denselben Datenpfad. Der leere Beteiligungs-Slot ist bewusst im Markup, damit die Beteiligungs-Story nur noch Daten einhängt statt Layout umzubauen.

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` -- expected: 0 Verstöße
- `pnpm exec vite build` + Preview + `playwright test tests/e2e/berlin-wahlen.e2e.ts --config <temp>` -- expected: grün
