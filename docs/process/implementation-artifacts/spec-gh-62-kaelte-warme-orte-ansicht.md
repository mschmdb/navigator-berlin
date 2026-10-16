---
title: 'Kälte-Navigator: Ansicht warme Orte auf /kaelte (#62)'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: 'd1c0b66c36aacc534d866505cb84127144c69461'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
  - '{project-root}/docs/waerme-orte-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/kaelte` hat einen leeren Platzhalter, obwohl 227 belegte warme Orte vorliegen. Wer jemandem helfen will, sieht nicht, wo in der Nähe ein beheizter Ort ohne Konsumzwang offen ist (Epic #57).

**Approach:** Im Platzhalter `kaelte-platzhalter-orte` eine „In deiner Nähe“-Liste nach dem Muster von `/hitze` (Standort per Geolocation, nächste Orte, Kategorie-Filter), je Ort Winter-Angaben mit Quelle und ein Melde-Link, darunter ein Transparenz-Block. Daten aus `static/data/waerme-orte.geojson`.

**Entscheidung (Matze 16.10.2026):** Kein MANIFEST-Eintrag, kein Explorer-Layer, keine `/layer/waerme-orte`-Seite in #62. Die Liste lädt `/data/waerme-orte.geojson` direkt. Layer, Explorer-Karte und „auf der Karte ansehen“ folgen mit dem Launch in #63.

## Boundaries & Constraints

**Always:**
- Nur Angaben aus dem GeoJSON; `unknown` sichtbar als „nicht geprüft“, nie als Ja. Quelle und Prüfdatum je Ort sichtbar.
- Status „jetzt geöffnet“ nur aus OSM-`oh`; fehlt es, kein Status.
- Transparenz: Quellen (OpenStreetMap/ODbL, Redaktion navigator.berlin, DWD), Haltung, klarer Hinweis „keine Notübernachtungen, im Notfall Kältehilfe“, Link auf den Kältehilfe-Wegweiser (nur Link).
- Melde-Link je Ort als mailto mit Ortsname und ID im Betreff (Muster `buildErrorReportMailto`).
- Kühle-Orte-Komponenten wiederverwenden, wo sie generisch sind; Hitze-Verhalten und Hitze-Tests unverändert.
- DE/EN von Hand, WCAG 2.2 AA, keine em-dashes, Tests zuerst; `/kaelte` bleibt `noindex`.

**Never:**
- Keine Daten aus netzwerkderwaerme.de oder kaeltehilfe-berlin.de.
- Keine Änderung an Kühle-Orte-Daten oder -Filtern.
- Kein MANIFEST-Eintrag, keine Explorer-Konfiguration, kein Kartenlink (#63).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Standort erlaubt | Position in Mitte | 5 nächste warme Orte mit Distanz, Kategorie, Adresse, Winter-Angaben, Quelle | N/A |
| Kategorie-Filter | „Bibliothek“ aktiv | nur Bibliotheken, Zähler/Leertext wenn keine | N/A |
| Standort verweigert | Geolocation abgelehnt | Hinweis + Erklärung, kein Absturz | Fehlermeldung mit Retry |
| Unbelegt | `stay_without_purchase=unknown` | „Aufenthalt ohne Konsum: nicht geprüft“ | N/A |
| Ohne OSM-Zeiten | `oh` leer | kein Offen-Status, nur `opening_hours_note` falls vorhanden | N/A |
| Daten laden fehlgeschlagen | fetch 404/Netz | Fehlermeldung, Notfall-Block bleibt nutzbar | Retry |
| EN | `/en/kaelte` | UI englisch, Ortsnamen/Notizen deutsch mit `lang="de"` | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/kaelte/+page.svelte:67-68` -- Platzhalter `kaelte-platzhalter-orte` ersetzen; `page.svelte.test.ts` prüft ihn als leer.
- `src/lib/components/kuehle-orte/in-deiner-naehe.svelte` (+ Test) -- Vorlage: Geolocation (`$lib/utils/geolocation.js` `requestPosition`), 5 nächste, `formatDistance`, `getOpeningStatus`, Maps-Links; Props `requestPositionFn`, `loadIndex`, `now` für Tests. Gekoppelt an `KuehleOrt` und `nearestFilteredKuehleOrte` (AC/Sommer-Filter).
- `src/lib/data/get-kuehle-orte-index.ts` -- Muster für `get-waerme-orte-index.ts` (fetch `/data/waerme-orte.geojson`, Mapper, Cache + Inflight-Dedupe).
- `src/lib/components/kuehle-orte/category-label.ts` -- `naehe_cat_*`; fehlen „Mall“ und „Gotteshaus“ (Kühle-Orte nutzt „Mall/Center“). Ergänzen ohne bestehende Labels zu ändern.
- `src/lib/components/kuehle-orte/kuehle-orte-transparenz.svelte` + `transparenz-content.ts` -- Inhalt hitze-spezifisch (`transparenz_*`); für Kälte eigene Inhalte als Props oder eigene Komponente.
- `src/lib/utils/contact.ts:15,40` -- `buildErrorReportMailto`, `buildOptOutMailto` als Muster für Melde-Link.
- `src/lib/kaelte/hilfe-dienste.ts` -- `KAELTEHILFE_WEGWEISER_URL` wiederverwenden.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/get-waerme-orte-index.ts` + Test -- Typ `WaermeOrt`, Mapper, Cache.
- [x] Nächste-Orte-Logik (generisch oder eigene) + Test -- Distanz, Kategorie-Filter, Jetzt-offen nur mit `oh`.
- [x] `src/lib/components/kaelte/warme-orte-naehe.svelte` + Test -- Liste laut Matrix, Kategorie-Chips, Melde-Link.
- [x] `src/lib/components/kaelte/warme-orte-transparenz.svelte` + Test -- Quellen, Haltung, Notübernachtungs-Hinweis, Wegweiser-Link.
- [x] `src/routes/(with-header)/kaelte/+page.svelte` + Test -- Platzhalter ersetzen.
- [x] `messages/de.json`, `messages/en.json`, `category-label.ts` -- neue Keys, fehlende Kategorien.
- [x] `tests/e2e/kaelte.e2e.ts` -- Liste mit Geolocation-Mock (Playwright `geolocation`), axe.

**Acceptance Criteria:**
- Given ein Smartphone mit Standortfreigabe, when die Person „Orte in meiner Nähe“ antippt, then sieht sie die nächsten warmen Orte mit Entfernung und kann per Tipp die Navigation öffnen.
- Given ein Screenreader, when er die Liste vorliest, then sind Kategorie, Entfernung, Winter-Angaben und Quelle als Text verständlich.

## Implementation Notes

- Status-Text „laut OSM jetzt offen“, damit die Quelle sichtbar bleibt.
- E2E mit Playwright-Geolocation-Mock gegen manuell gestarteten Preview.

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Fokus fällt nach Phasenwechsel auf body (Locate/Retry-Button verschwindet) | medium | patch | WCAG 2.4.3; Button unmountet bei ready/denied/load-error. |
| 2 | Melde-Link: sichtbarer Text nicht Teil des aria-label | medium | patch | WCAG 2.5.3, „Fehler zu {name} melden“ vs. „Fehler melden“. |
| 3 | „schließt bald“ grün wie „offen“ | low | patch | Ternary kennt nur closed. |
| 4 | Ladefehler doppelt angesagt (role=alert + announceGlobal) | low | patch | Beide Kanäle aktiv. |
| 5 | Retry nach Ladefehler fragt Standort neu; kein „Standort aktualisieren“ in ready | low | patch | Position nicht gespeichert, kein Button. |
| 6 | Ansage nennt 5, Zähler „5 von 79“ | low | patch | `foundAnnouncement(items.length)`. |
| 7 | Leerer Datensatz zeigt Kategorie-Leertext | low | patch | Kein eigener Zweig für `index.length===0`. |
| 8 | Robustheit Laden: kein Timeout, Reject von requestPositionFn, kaputtes Feature wirft alles | low | patch | Hängender Zustand bzw. Totalausfall. |
| 9 | Melde-Mail nennt Prüfdatum „Datenstand“, Kategorie fehlt | low | patch | `fetchedAt: ort.checkedAt`. |
| 10 | EN: „Kältehilfe“ ohne `lang="de"`, Notfallzeile ohne Handlung | low | patch | WCAG 3.1.2. |
| 11 | `website` gemappt, nie gezeigt; ungenutzter Import `ExternalLink` | low | patch | Totes Feld, Lint. |
| 12 | Tests fehlen: Status closed/closing-soon, Fallback-Texte/unsupported, Datumswert, Inflight/Cache-Reset | low | patch | Regression gaps laut Verification-Gap. |
| 13 | E2E hängen an Live-Zählung, Maps-Link und Ladefehler-Pfad ungetestet | low | patch | `toHaveCount(5)` Museen, kein `page.route`-Fall. |
| 14 | Spec-Task „Nächste-Orte-Logik“ noch offen | low | patch | Direkt korrigiert. |
| 15 | UI- und E2E-Tests laufen nicht in CI | low | reject | Bereits in deferred-work (Spec #58/59) und #55. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte hitze kuehle-orte a11y` -- expected: grün außer bekanntem a11y „Escape löscht Selection“
