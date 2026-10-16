---
title: 'Kälte-Navigator: Datengrundlage warme Orte (#61)'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '144f1982becd7d421092540bcfa039e56b933638'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
  - '{project-root}/docs/adr/ADR-020-kuehle-orte-local-source.md'
  - '{project-root}/docs/kuehle-orte-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Für `/kaelte` fehlt ein Datensatz öffentlicher, beheizter Orte, an denen man sich im Winter ohne Konsumzwang aufhalten kann (Epic #57).

**Approach:** Nach dem Muster der Kühlen Orte: ein OSM-Snapshot (`places-osm.json`) plus eine redaktionelle Winter-Anreicherung (`enrichment.json`), per Build zu `static/data/waerme-orte.geojson` gemerged. OSM-Kandidaten kommen aus dem Geofabrik-Berlin-Extrakt (Overpass ist aus Matzes Netz nicht erreichbar). Layer, Karte und Liste folgen in #62.

**Entscheidungen (Matze 16.10.2026):**
- Kategorien weit: Bibliotheken, Malls, Kaufhäuser, Museen mit `fee=no` und Museen ohne fee-Tag (Eintritt per Recherche klären), Stadtteilzentren der Typen `community_hall`, `social_centre`, `village_hall`, `cultural_centre`, `family_centre` sowie ohne Untertyp, jeweils mit Öffnungszeiten, und Orte mit `amenity=place_of_worship` und Öffnungszeiten.
- Winter-Recherche voll je Ort (Websites der Betreiber): Winter-Öffnung, Aufenthalt ohne Konsum, Eintritt, Begründung, Quelle, Prüfdatum. Vorhandene Kühle-Orte-Recherche für dieselbe OSM-ID als Ausgangspunkt nutzen, Winter-Felder trotzdem prüfen.

## Boundaries & Constraints

**Always:**
- Jede redaktionelle Angabe je Ort mit Quelle (URL) und Prüfdatum; was keine Quelle belegt, bleibt `unknown`, nie geraten.
- OSM-Anteil (ODbL, Namensnennung) und redaktioneller Anteil getrennt wie in ADR-020.
- OSM-Stand und Abrufweg (Geofabrik-Extrakt, Datum, Filter) in der Methodik-Doku und reproduzierbar per Skript.
- Ausgefilterte Orte mit Grund behalten (wie `suitable=false`), Build filtert.
- Tests zuerst für Filter, Merge und Validierung.

**Never:**
- Keine Daten aus netzwerkderwaerme.de oder kaeltehilfe-berlin.de übernehmen (nur verlinken, in #62).
- Keine Notübernachtungen (`social_facility=shelter`), keine Einrichtungen nur für bestimmte Gruppen (Jugendzentren, Vereinsheime, Pflege).
- Kein Live-Fetch zur Laufzeit; kein Layer, keine UI, kein MANIFEST-Eintrag (#62).
- Keine Behauptung „beheizt“ je Ort ohne Beleg.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bibliothek | `amenity=library`, öffentlich | Kandidat, Kategorie Bibliothek | N/A |
| Museum mit Eintritt | `tourism=museum`, `fee=yes` | kein Kandidat | N/A |
| Museum ohne fee-Tag | `tourism=museum`, kein `fee` | Kandidat; Recherche klärt Eintritt, mit Eintritt `suitable=false` | N/A |
| Kirche | `amenity=place_of_worship` mit `opening_hours` | Kandidat; ohne `opening_hours` kein Kandidat | N/A |
| Jugendzentrum | `community_centre=youth_centre` | kein Kandidat | N/A |
| Zugang privat | `access=private/members/customers` | kein Kandidat | N/A |
| Notübernachtung | `social_facility=shelter` | kein Kandidat | N/A |
| Ohne Koordinate | Way/Relation ohne Mittelpunkt | verworfen, gezählt | Zähler im Build-Log |
| Enrichment fehlt | OSM-Ort ohne Enrichment-Eintrag | nicht im GeoJSON, Build meldet | Build schlägt fehl bei Waisen in enrichment.json |
| Nicht belegt | Winter-Öffnung ohne Quelle | Feld `unknown` | N/A |

</frozen-after-approval>

## Code Map

- `static/data/kuehle-orte/places-osm.json`, `enrichment.json` -- Vorlage der Zwei-Datei-Struktur, Join über `id` (`node/…`, `way/…`); 678 Einträge, Überschneidungen bei Bibliothek, Mall, Kaufhaus, Museum, Kirche wiederverwendbar (`is_free`, `website`, `address_verified`, `still_exists`).
- `scripts/build-kuehle-orte.ts`, `scripts/lib/kuehle-orte/merge.ts` (+ Test) -- Muster für reinen Merge mit Drop-Zählern; `navi-links.ts` wiederverwenden.
- `scripts/lib/is-main-entry.ts` -- Entry-Guard für neue Skripte (nicht den alten `file://`-Vergleich).
- `docs/kuehle-orte-methodik.md`, `docs/adr/ADR-020-kuehle-orte-local-source.md` -- Vorlage für `docs/waerme-orte-methodik.md`.
- Neu: `scripts/osm/extract-waerme-orte.py` (pyosmium via `uv run --with osmium`, liest Geofabrik-PBF, schreibt `places-osm.json`), `scripts/build-waerme-orte.ts`, `scripts/lib/waerme-orte/{filter,merge}.ts` + Tests, `static/data/waerme-orte/`.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/osm/extract-waerme-orte.py` -- Kandidaten laut Kategorien und Ausschlüssen aus dem Geofabrik-PBF, Mittelpunkt für Ways/Relations, deterministisch sortiert.
- [x] `scripts/lib/waerme-orte/filter.ts` + Test -- Kategorie- und Ausschlussregeln als reine Funktion (Matrix), vom Python-Extrakt gespiegelt oder als Nachfilter.
- [x] `static/data/waerme-orte/places-osm.json` -- Snapshot mit Stand.
- [x] `static/data/waerme-orte/enrichment.json` -- Winter-Anreicherung je Ort (Recherche-Lauf, siehe Design Notes), je Ort Quelle und Prüfdatum.
- [x] `scripts/lib/waerme-orte/merge.ts` + Test, `scripts/build-waerme-orte.ts`, `package.json` (`data:waerme-orte`) -- Merge, Drop-Zähler, Waisen-Check, Output `static/data/waerme-orte.geojson`.
- [x] `docs/waerme-orte-methodik.md` -- Herkunft, Lizenz-Trennung, Filter, Felder, Grenzen, Stand.

**Acceptance Criteria:**
- Given der committete Snapshot, when `pnpm data:waerme-orte` läuft, then entsteht ein deterministisches GeoJSON, und jede Eigenschaft stammt aus OSM oder aus einem Enrichment-Eintrag mit Quelle.
- Given ein Ort ohne belegte Winter-Angabe, when er im GeoJSON steht, then trägt das Feld `unknown` statt einer Annahme.

## Implementation Notes

- Geofabrik-PBF liegt lokal unter `/tmp/osm-berlin/berlin-latest.osm.pbf` (Download 16.10.2026, ca. 100 MB, nicht committen). Overpass ist aus Matzes Netz nicht erreichbar. pyosmium läuft per `uv run -q --no-project --with osmium python -I <script> <pbf>`.

- Recherche (Orchestrator): 28 Batches + Nachlauf (12 Batches, 166 Orte) wegen WebFetch-Rate-Limit bei 20 parallelen Agenten. Ergebnis 220 von 678 geeignet. 14 Einträge mit Angaben ohne Quell-URL auf unknown zurückgesetzt, 12 namenlose OSM-Objekte mit Kategorie-Platzhalter benannt.
- Grenzfilter (Relation 62422) nachgezogen, 47 Orte außerhalb Berlins entfernt.
- Dev Agent Record, Test-Strategie: Pragmatic TDD für Filter, Merge und Enrichment-Validierung (Tests zuerst, Red-Lauf je Modul). Grenzfilter und Ring-Geometrie im Python-Skript über `selftest()` bei jedem Lauf. `data.test.ts` prüft die committete `enrichment.json` mit 0 Validierungsfehlern.
- Testzahlen: 54 Tests in `scripts/lib/waerme-orte/` (filter, merge, enrichment, data), alle grün. Fachliche Abdeckung: Matrix-Fälle, Dubletten, Waisen, Determinismus, Batchgröße, Kalenderdatum. Keine Coverage-Messung.
- Stand Build: 677 Kandidaten recherchiert, 219 geeignet, 216 im GeoJSON nach 3 Dubletten.

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | `suitable=true` ohne `source_url` passiert Validierung (Galeria Spandau im GeoJSON) | medium | patch | `claimsAnything` ignoriert `suitable`; way/5105769 mit leerer Quelle im Output. |
| 2 | Build validiert enrichment.json nicht, kein Datentest | medium | patch | `build-waerme-orte.ts` übergibt Daten ungeprüft; Handedit landet im GeoJSON. |
| 3 | Dubletten im GeoJSON (Node+Way, mehrere Ways) | medium | patch | Haselhorst, Nordmeile, Kieztreff, FHXB, Spree Center doppelt, < 50 m. |
| 4 | `notes` mit ungeprüften Zeiten im öffentlichen GeoJSON | medium | patch | merge kopiert `notes` 1:1; Doku sagt „nur in notes“. |
| 5 | `suitable=true` bei `winter_open=no` oder `is_free=ticket` erlaubt | low | patch | Validierung kennt die Methodik-Regeln nicht. |
| 6 | Robustheit Validierung: fehlende String-Felder, unmögliches Datum, doppelte IDs, Platzhalter-Name bei suitable | low | patch | TypeError bzw. stilles Durchlassen. |
| 7 | `--size` 0/negativ/NaN: Endlosschleife | low | patch | `start += batchSize`. |
| 8 | `--strict` schreibt GeoJSON vor dem Abbruch | low | patch | writeFile vor Exit. |
| 9 | `access=no` fehlt in Ausschlussliste | low | patch | `RESTRICTED_ACCESS` ohne `no`. |
| 10 | „Größter Außenring“ nach Knotenzahl statt Fläche | low | patch | `max(rings, key=len)`. |
| 11 | Hartkodierter Seiteneffekt `/tmp/waerme-orte-removed-ids.txt` | low | patch | Debug-Rest. |
| 12 | `localeCompare` macht Sortierung locale-abhängig | low | patch | Determinismus-Anspruch. |
| 13 | Dev-Record (Test-Strategie) fehlt in Spec | low | patch | Hand-off-Gate laut CLAUDE.md. |
| 14 | Python-Kategorien und `categoryOf` können auseinanderlaufen | low | defer | Greift erst bei Snapshot-Regen mit neuer Kategorie. |
| 15 | NACHLAUF-Einträge kommen nicht erneut in `batches` | low | defer | Kein Tooling-Pfad zum Nachrücken. |
| 16 | Unclosed Ways/Nicht-Multipolygon-Relationen fallen still weg | low | defer | Zähler unvollständig, betrifft Einzelfälle. |
| 17 | `cat` aus Enrichment statt `classifyPlace` | false | reject | Review prüfte alle 678: stimmen überein. |
| 18 | PBF-Header ohne Zeitstempel | low | reject | Geofabrik liefert ihn; Fix fügt Guard ohne gezeigten Fall. |
| 19 | `fee=conditional/donation` bleiben Kandidaten | false | reject | Gewollt: Recherche klärt Eintritt, Methodik nennt das. |

## Design Notes

Ablauf in zwei Phasen, weil ein Implementierungs-Agent keine Recherche-Agenten starten kann:
1. Implementierer: Extrakt-Skript, Snapshot, Filter, Merge, Build, Validierung, Methodik-Doku, dazu ein Enrichment-Schema und ein Skript, das Recherche-Batches (z. B. je 25 Orte) als JSON-Aufgabenlisten ausgibt und Ergebnis-Batches validiert und zusammenführt.
2. Orchestrator (Hauptsession): startet Recherche-Subagenten je Batch, lässt Ergebnisse validieren und führt sie zu `enrichment.json` zusammen; danach Build.

Enrichment-Felder je Ort (Vorschlag, Implementierer finalisiert): `id`, `name`, `cat`, `suitable`, `suitable_reason`, `winter_open` (yes/limited/no/unknown), `opening_hours_note`, `stay_without_purchase` (yes/no/unknown), `is_free` (free/ticket/unknown), `website`, `source_url`, `checked_at`, `still_exists`, `notes`.

## Verification

**Commands:**
- `pnpm exec vitest run scripts` -- expected: grün
- `pnpm data:waerme-orte` zweimal -- expected: identischer Output
- `pnpm check` und `pnpm exec prettier --check .` -- expected: 0 Fehler
