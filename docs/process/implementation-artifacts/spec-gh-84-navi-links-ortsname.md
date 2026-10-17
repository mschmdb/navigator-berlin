---
title: 'Navi-Links öffnen den benannten Ort statt einer Stecknadel (#84)'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '97c156fbe89f8e2c7f307ffe31e9443d9b1c9c62'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Links „Google Maps“ und „Apple Maps“ bestehen nur aus Koordinaten (`destination=lat,lng`, `daddr=lat,lng`). Beide Apps zeigen dann eine gesetzte Stecknadel statt des Orts mit Name und Adresse. Apple behandelt den alten `daddr`-Link seit iOS 18.4 zudem nicht mehr zuverlässig (Apple-Forum, DTS-Antwort).

**Approach:** Google: Route mit Textziel `destination=<Name>, <Straße Nr>, <PLZ> Berlin` (Google Maps URLs API: „place name, address, or coordinates“); ohne Straße `<Name>, <PLZ> Berlin`. Apple: neues Unified-Schema `https://maps.apple.com/place?coordinate=<lat>,<lng>&name=<Name>`: exakte Stelle plus Name, Route per Tipp in der App. Links werden in der Pipeline gebaut, Daten neu erzeugt.

**Entscheidung (Matze 17.10.2026):** Warme und Kühle Orte (gleicher Builder); Kühle Orte ohne Straße bekommen bei Google `Name, PLZ Berlin`.

## Boundaries & Constraints

**Always:**
- URL-Parameter korrekt kodiert (`encodeURIComponent`), Reihenfolge lat,lng.
- Trinkbrunnen (kein Name) bleiben bei Koordinaten.
- Tests zuerst; Pipeline-Lauf + fetch-static; Layer-File-Test grün.

**Never:**
- Keine Änderung an Koordinaten, Namen oder Adressen in den Daten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mit Adresse | Heilandskirche, Thusnelda-Allee 1, 10555 | Google `…dir/?api=1&destination=Heilandskirche%2C%20Thusnelda-Allee%201%2C%2010555%20Berlin`; Apple `…/place?coordinate=52.52…,13.33…&name=Heilandskirche` | N/A |
| Ohne Straße | Name + PLZ | Google `Name, PLZ Berlin` | N/A |
| Sonderzeichen | „Café & Bar“, Umlaute | korrekt kodiert | N/A |
| Trinkbrunnen | kein Name | unverändert Koordinaten | N/A |

</frozen-after-approval>

## Code Map

- `scripts/lib/kuehle-orte/navi-links.ts` (+ Test) -- `buildNaviLinks(lat, lon, { name, street?, plz? })`; Fallback ohne Name auf Koordinaten.
- `scripts/lib/waerme-orte/merge.ts`, `scripts/lib/kuehle-orte/merge.ts` -- Aufrufer mit Name/Adresse/PLZ.
- `src/lib/utils/navi-links.ts` + `get-trinkbrunnen-index.ts` -- Trinkbrunnen bleiben; ggf. Apple auf `place?coordinate=` umstellen (ohne Name), da `daddr` veraltet.
- Pipeline: `data:waerme-orte` + `data:waerme-orte-fetch` sowie die Kühle-Orte-Pendants laut package.json; MANIFEST/Layer-Dateien neu. Nur die Link-Felder dürfen sich in den GeoJSONs ändern (per Diff prüfen).
- Komponenten nutzen `ort.googleMapsUrl`/`appleMapsUrl` direkt (`waerme-orte-card.svelte:275,286`, `warme-orte-naehe.svelte:294,303`) -- keine Änderung nötig.

## Tasks & Acceptance

**Execution:**
- [x] Builder + Tests (Matrix).
- [x] Merge-Aufrufer + Tests; Pipeline neu laufen lassen.
- [x] Trinkbrunnen-Apple-Link auf Unified-Schema.

**Acceptance Criteria:**
- Given die Warme-Orte-Karte, when die Person „Google Maps“ oder „Apple Maps“ tippt, then öffnet die App den Ort mit Namen statt einer Stecknadel.

## Implementation Notes

- Textziel nur mit PLZ; sonst Google auf Koordinaten (24 warme, 1 kühler Ort), Apple Koordinaten + Name. Kühle Orte nutzen `address_verified`, wenn parsbar.
- Nur Link-Felder geändert (JSON-Vergleich). Unit 6534 grün; E2E nicht gelaufen (Komponenten reichen URLs nur durch).

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Schwache Adressen: ohne PLZ wird Ziel „Name, Berlin“ (z. B. „Spree Center, Berlin“), `addr` nur Hausnummer („Galeria, 9, …“) | medium | patch | 19 warme Orte ohne addr+plz, 5× „Galeria“; Google geocodiert ins Ungefähre. Ohne PLZ Koordinaten behalten; Straße nur mit Buchstaben. |
| 2 | Kühle Orte nutzen `address_verified` nicht | medium | patch | 116 von 538 ohne PLZ, verifizierte Adresse liegt ungenutzt. |
| 3 | Kommas in Straße zerlegen das Ziel | low | patch | „Fasanenstraße 86,87,88“. |
| 4 | `e.name` nur Leerzeichen gewinnt über OSM-Name | low | patch | `e.name || place.name`. |
| 5 | Merge-Tests prüfen Name/PLZ/Straße nicht exakt | low | patch | `toContain` lässt Regressionen durch. |
| 6 | Kommentar „spiegelt“ veraltet, iOS-Aussage ohne Quelle | low | patch | Builder unterscheiden sich jetzt. |
| 7 | „Berlin“ fest codiert | low | reject | Alle PLZ 10xxx–14xxx geprüft. |
| 8 | Builder liegt unter `kuehle-orte` | low | reject | Kosmetik. |
| 9 | Apple öffnet Ortskarte statt Route | low | reject | Spec-Entscheidung. |
| 10 | Straße ohne Hausnummer | low | reject | Name + PLZ grenzt ausreichend ein. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
