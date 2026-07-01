# Story 16.3: „In deiner Nähe" per Geolocation (nächste offene kühle Orte nach Distanz)

Status: ready-for-dev

> **Anker:** ADR-012 (Pragmatic TDD), Feature „Kühle Orte Berlin" (Epic 16). FR16, UX-DR7, NFR1, NFR3, NFR9.
> **Abhängigkeiten:** Story 15.1 (Build-GeoJSON mit Navi-Deep-Links + `cool_score`/`summer_available`/`opening_hours`), Story 15.4 (Live-Status `jetzt offen` / Saison-Logik), Story 16.1 (Landing-Route `/kuehle-orte` mit eingebetteter Karte). Diese Story hängt die „in deiner Nähe"-Sektion in das 16.1-Gerüst ein.
> **Reuse-Mandat:** Geolocation-Consent-Pattern aus `src/routes/(with-header)/explore/+page.svelte` (`onLocate`, Zeile 930-969), Distanz-Pattern aus `src/lib/utils/oepnv-walking.ts` (`haversineM`), `announceGlobal` aus `src/lib/utils/aria-live.ts`. Kein neuer Tooltip, kein neuer Geolocation-Stack.

## Story

As a Besucher unterwegs,
I want die nächsten geeigneten, jetzt-offenen kühlen Orte zu meinem Standort sortiert sehen, je mit Navi-Link,
so that ich den kürzesten Weg ins Kühle finde.

## Kontext: Warum dieser Change

Die Landing Page (Story 16.1) zeigt die ganze Karte. Ein Besucher bei 35°C will nicht scrollen, sondern den nächsten offenen kühlen Ort. FR16 + UX-DR7 fordern „in deiner Nähe" per Geolocation mit klarem Consent und sauberem Fallback ohne Standort.

Der Browser liefert nur die Koordinate. Die Sortierung nach Distanz und der Filter „jetzt offen" sind reine Logik, also test-first nach ADR-012. Die Geolocation-Anbindung folgt dem bereits gelandeten `onLocate`-Muster der Explore-Seite (Permission-Handling, `GeolocationPositionError`, Timeout). Kein zweiter Geolocation-Stack.

Distanz: `haversineM` existiert privat in `oepnv-walking.ts`. Diese Story hebt eine schlanke Distanz-/Sortier-Funktion in ein eigenes, getestetes Util (`nearest-cool-places.ts`), statt Turf in eine Client-Komponente zu ziehen. Luftlinie genügt für die Reihenfolge, kein Routing.

## Acceptance Criteria

1. **AC-1 (Consent → sortierte Nähe-Liste):**
   **Given** Geolocation-Consent erteilt
   **When** der Besucher „in meiner Nähe" wählt
   **Then** zeigt die Sektion die N nächsten Orte, die geeignet (`suitable=true`, `still_exists` ungleich `no`) UND jetzt offen sind, aufsteigend nach Luftlinien-Distanz, je mit sichtbarer Distanz und den Navi-Links (Google + Apple) aus Story 15.1.

2. **AC-2 (Filter „jetzt offen" + Sommer-Abwertung):**
   **Given** der Live-Status aus Story 15.4
   **When** die Nähe-Liste gebildet wird
   **Then** erscheinen nur Orte mit Status `jetzt offen` oder `schließt bald`; `summer_available=no`-Orte sind ausgeschlossen oder ans Listenende abgewertet (konsistent mit Story 15.5); Orte mit unbekannter Zeit erscheinen nicht in „jetzt offen", brechen aber nichts.

3. **AC-3 (Fallback ohne Standort):**
   **Given** verweigerter, nicht unterstützter oder fehlgeschlagener Standort
   **When** Geolocation nicht verfügbar ist
   **Then** zeigt die Sektion eine klare Fallback-Kommunikation (Hinweis + Verweis auf die ganze Karte / den Explorer-CTA aus 16.1), kein toter Zustand, kein endloser Lade-Spinner; die Ursache wird per `announceGlobal` für Screenreader gemeldet.

4. **AC-4 (Barrierefreiheit, DE-only, Typsicherheit):**
   **Given** WCAG (NFR1) und DE-only (NFR9)
   **When** die Sektion gerendert wird
   **Then** ist der Auslöse-Button tastaturbedienbar und beschriftet, Lade-/Fehler-/Ergebnis-Zustände werden per Live-Region angesagt, Distanz-Anzeige hat Text-Alternative; alle Strings stehen direkt deutsch im Code (keine i18n-Keys), kein `any`, Dateien unter 500 Zeilen.

5. **AC-5 (TDD):**
   **Given** ADR-012
   **When** die Distanz-/Sortier-/Filter-Logik getestet wird
   **Then** sind Nähe-Sortierung (Reihenfolge), Filter „jetzt offen", Sommer-Abwertung, Limit N, leeres/kein Treffer-Set und der Fehlerpfad (Permission denied, unsupported) abgedeckt; `pnpm test:unit` grün.

## Tasks / Subtasks

- [ ] **Task 1: Distanz-/Sortier-/Filter-Util (TDD)** (AC: #1, #2, #5)
  - [ ] 1.1 (RED) `src/lib/utils/nearest-cool-places.test.ts`: `haversineM`-Distanz (bekannte Berlin-Koordinaten), aufsteigende Sortierung, Filter auf `suitable=true`/`still_exists!=='no'`, Filter „jetzt offen" (Status-Input gemockt aus 15.4), `summer_available=no`-Abwertung/Ausschluss, Limit N, leeres Set → `[]`, identische Distanz → stabile Reihenfolge.
  - [ ] 1.2 (GREEN) `src/lib/utils/nearest-cool-places.ts`: reine Funktion `nearestOpenCoolPlaces(origin, places, opts)` → `{ place, distanceM }[]`. `haversineM` aus `oepnv-walking.ts` wiederverwenden oder dorthin als `export` heben (kein Duplikat). Kein DOM, kein `any`, Typen aus dem 15.1-Feature-Property-Shape.
- [ ] **Task 2: Geolocation-Anbindung (Reuse Explore-Pattern)** (AC: #1, #3, #4)
  - [ ] 2.1 `src/lib/utils/geolocation.ts` (oder colocated): das `onLocate`-Promise-Pattern aus `explore/+page.svelte` (Zeile 938-944) in eine getestete `requestPosition()`-Funktion extrahieren; Rückgabe diskriminierte Union `{ ok: true, lat, lng } | { ok: false, reason: 'unsupported' | 'denied' | 'error' }` (`GeolocationPositionError`-Mapping aus Zeile 960-964). Explore-Seite optional auf den Helper umstellen (nur wenn risikofrei, sonst unangetastet lassen).
  - [ ] 2.2 (RED/GREEN) `geolocation.test.ts`: `navigator.geolocation` gemockt → success, `PERMISSION_DENIED`, generischer Fehler, `navigator` undefined → `unsupported`.
- [ ] **Task 3: „In deiner Nähe"-Sektion (Svelte 5)** (AC: #1, #2, #3, #4)
  - [ ] 3.1 `src/lib/components/kuehle-orte/in-deiner-naehe.svelte` (Runes): Button „Orte in meiner Nähe", Zustände `idle | locating | ready | denied | unsupported | error` als `$state`, Ergebnis-Liste über `nearestOpenCoolPlaces`. Karten-/Navi-Buttons mit `@lucide/svelte` (MapPin, Navigation). Touch-große, tastaturbedienbare Links (UX-DR2/2). Distanz lesbar formatiert (z.B. „650 m", „1,2 km") mit `aria-label`.
  - [ ] 3.2 Fallback-Block bei `denied`/`unsupported`/`error`: Hinweistext + Link auf die ganze Karte / Explorer-CTA (16.1). `announceGlobal` für jeden Zustandswechsel.
  - [ ] 3.3 `in-deiner-naehe.svelte.test.ts` (vitest-browser-svelte): Button-Klick → Liste rendert, denied → Fallback rendert, leeres Treffer-Set → „keine offenen Orte in der Nähe"-Hinweis.
- [ ] **Task 4: Einbau in die Landing-Route** (AC: #1, #4)
  - [ ] 4.1 Sektion in `src/routes/(with-header)/kuehle-orte/+page.svelte` (Story 16.1) an der von UX-DR6 vorgesehenen Stelle einhängen; Orts-Daten aus dem 15.1-Build laden (gleiche Quelle wie die eingebettete Karte, kein zweiter Fetch-Pfad).
  - [ ] 4.2 `pnpm check` 0 Errors, `pnpm test:unit` grün, manueller Smoke (Consent + Deny) dokumentiert.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Geolocation-Pattern existiert** in `src/routes/(with-header)/explore/+page.svelte`, Funktion `onLocate` (Zeile 930-969): `navigator.geolocation`-Guard, `getCurrentPosition` als Promise (`enableHighAccuracy`, `timeout: 10_000`, `maximumAge: 30_000`), `GeolocationPositionError.PERMISSION_DENIED`-Mapping, `announceGlobal` bei Fehler, `locating`-State. Einziger Geolocation-Treffer im Repo → Vorlage, nicht neu erfinden.
- **Distanz:** `src/lib/utils/oepnv-walking.ts` hat privates `haversineM(lat1,lng1,lat2,lng2)` (Zeile 12) + `toRad`. `walkingDistanceM` = haversine × Detour-Faktor 1.3. Für die reine Reihenfolge genügt Luftlinie. `nearest-stops.ts` (`scripts/lib/kiez-score/`) zeigt das „nächster nach Distanz"-Muster (Zeile 58-76).
- **Aria-Live:** `src/lib/utils/aria-live.ts` exportiert `announceGlobal(text, level)` (Zeile 31), Levels `polite|assertive`. Für Lade-/Fehler-/Ergebnis-Ansagen nutzen.
- **Daten:** `static/data/kuehle-orte/enrichment.json` (659 Objekte) + `places-osm.json` (659, mit `lat`/`lon`). Join-Key `id` (`node/29040741`). Der nutzbare Layer-Input entsteht erst durch `scripts/build-kuehle-orte.ts` (Story 15.1, **noch nicht vorhanden**): merged beide, filtert `suitable=false`/`still_exists=no`, hängt Navi-Deep-Links an (`https://www.google.com/maps/dir/?api=1&destination=LAT,LON`, `https://maps.apple.com/?daddr=LAT,LON`). Diese Story konsumiert dieses Build-Output, baut es nicht.
- **Noch nicht vorhanden (Vorbedingungen, nicht Teil dieser Story):** Route `/kuehle-orte` (16.1), Build-Script + GeoJSON (15.1), Live-Status-Logik „jetzt offen"/Saison (15.4), `opening_hours`-Dependency (nicht in `package.json`). Falls 15.4 bei Start dieser Story noch offen ist: Status-Funktion als injizierbaren Parameter mocken, Verdrahtung gegen die echte 15.4-API nachziehen.
- **Test-Setup:** Runner vitest (`pnpm test:unit`), Logik-Tests colocated `*.test.ts`, Svelte-Komponenten `*.svelte.test.ts` via `vitest-browser-svelte`. Utils liegen flach in `src/lib/utils/`.

### Design-Entscheidung

- **Luftlinie statt Routing.** Reihenfolge der nächsten Orte braucht keine Wegezeit. `haversineM` reicht, deterministisch und ohne externen Call. Konsistent mit `nearest-stops.ts`.
- **Logik raus aus der Komponente.** `nearestOpenCoolPlaces` ist eine reine, getestete Funktion. Die Svelte-Komponente hält nur Geolocation-Zustand + Rendering. So greift TDD am AC-5-Kern, und die Komponente bleibt unter 500 Zeilen.
- **Geolocation-Helper extrahieren.** Das Promise-Pattern wird ein zweiter Consumer (Explore + Landing). Einmal als `requestPosition()` mit diskriminierter Union testbar machen. Explore-Seite nur umstellen, wenn risikofrei, sonst Pattern dupliziert dokumentieren statt brechen.
- **Status injizieren.** Der „jetzt offen"-Check kommt als Funktions-Parameter, nicht als Import-Hardwire. Entkoppelt von 15.4-Reihenfolge und macht den Filter test-first prüfbar.

### Was nicht brechen darf

- Kein Eingriff in die Explore-Geolocation, außer einer risikofreien Helper-Umstellung mit grünen Tests.
- Kein zweiter Daten-Fetch-Pfad: dieselbe 15.1-Quelle wie die eingebettete Karte (16.1).
- Keine i18n-Keys (NFR9), keine em-dashes (U+2014) in Strings/Docs/Comments, kein `any` (NFR3).
- Karten-/Layer-Filter unberührt: „in deiner Nähe" liest Daten, mutiert keinen globalen Layer-State.
- WCAG: Distanz und Status nie nur über Farbe, immer Text-Alternative (UX-DR3).

## References

- [Source: src/routes/(with-header)/explore/+page.svelte:930-969] Geolocation-Consent-Pattern `onLocate` (Reuse-Vorlage)
- [Source: src/lib/utils/oepnv-walking.ts:8-22] `haversineM`/`toRad`, Distanz-Util (Reuse)
- [Source: scripts/lib/kiez-score/nearest-stops.ts:58-76] „nächster nach Distanz"-Muster
- [Source: src/lib/utils/aria-live.ts:31] `announceGlobal` für Screenreader-Ansagen
- [Source: static/data/kuehle-orte/enrichment.json] 659 angereicherte Orte (Felder: id,name,cat,suitable,cool_score,summer_available,still_exists,…)
- [Source: static/data/kuehle-orte/places-osm.json] 659 Geometrie-Punkte (id,lat,lon,addr,oh,…)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md:327-345] Story 16.3 (AC-Quelle), FR16, UX-DR7
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md:109-131] Story 15.1 (Navi-Deep-Links, Build-Output)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md:189-215] Story 15.4 (Live-Status „jetzt offen", Saison)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md:283-305] Story 16.1 (Landing-Route, Explorer-CTA)
- [Source: docs/adr/ADR-012-tdd-mandate.md] Pragmatic-TDD-Mandat
- [Source: CLAUDE.md] Output-Konventionen (keine em-dashes, DE-only, <500 Zeilen, @lucide/svelte)

## Dev Agent Record

### Agent Model Used

_(beim Dev-Lauf ausfüllen)_

### Completion Notes List

_(beim Dev-Lauf ausfüllen)_

### File List

_Erwartet (beim Dev-Lauf bestätigen/anpassen):_

**Neu:**
- `src/lib/utils/nearest-cool-places.ts` (+ `.test.ts`)
- `src/lib/utils/geolocation.ts` (+ `.test.ts`)
- `src/lib/components/kuehle-orte/in-deiner-naehe.svelte` (+ `.svelte.test.ts`)

**Geändert:**
- `src/routes/(with-header)/kuehle-orte/+page.svelte` (Sektion eingehängt, Story 16.1)
- ggf. `src/lib/utils/oepnv-walking.ts` (`haversineM` als `export` gehoben)
- ggf. `src/routes/(with-header)/explore/+page.svelte` (auf `requestPosition()` umgestellt)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (16-3 → review)

### Debug Log References

_(beim Dev-Lauf ausfüllen)_

## Change Log

- 2026-06-30: Story 16.3 erstellt (ready-for-dev). Nähe-Sortier-/Filter-Util (TDD), Geolocation-Helper aus Explore-Pattern, „in deiner Nähe"-Sektion mit Fallback. Abhängig von 15.1/15.4/16.1.
