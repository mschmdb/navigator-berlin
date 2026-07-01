# Story 15.4: Live-Öffnungsstatus, „jetzt offen"-Filter und Saison-Logik

Status: review

> **Anker:** FR5 (Öffnungszeiten + Live-Status), FR6 (Filter „jetzt offen"), FR19 (Saison-Logik), UX-DR3 (Status-Ampel mit Text-Alternative), UX-DR5 (Filter-Steuerelement). TDD-Mandat ADR-012. Reuse statt Neubau: Inspector-Panel-Rendering und vorhandene Saison-Util.
> **Abhängigkeit:** Stories 15.1–15.3 (Build-Merge, `kind: 'local'`-Layer, Inspector-Registrierung) liefern den `kuehle-orte`-Layer und das `oh`-Feld pro Ort. Diese Story setzt die Logik auf das Feld, blockt aber 15.5 nicht.

## Story

As a Nutzer bei Hitze,
I want sehen, was gerade offen ist, und Geschlossenes ausblenden,
so that ich keine vergeudeten Wege mache.

## Kontext: Warum dieser Change

Ein kühler Ort nützt nur, wenn er offen ist. Die OSM-Geometrie liefert pro Ort ein `oh`-Feld (`opening_hours`-Syntax, z. B. `Mo-Fr 10:00-19:30; Sa 10:00-14:00`). Roh ist dieser String für Nutzer unlesbar und maschinell nicht trivial auswertbar (Wochentage, Mehrfach-Slots, Saison-Selektoren `Apr-Oct`, Feiertage `PH`).

FR5 fordert einen Live-Status (jetzt offen / schließt bald / zu) aus `opening_hours`. Die etablierte Library dafür ist `opening_hours` (npm). Sie ist im Projekt **noch nicht** installiert (geprüft 2026-06-30: kein Eintrag in `package.json`, nicht in `node_modules`). Diese Story bringt die Library, kapselt sie hinter einem getesteten Logik-Modul und rendert daraus eine barrierefreie Ampel plus einen tastaturbedienbaren „jetzt offen"-Filter.

Saison: Berlin hat saisonale kühle Orte (Freibäder, saisonale Öffnung). Die `opening_hours`-Syntax kennt Monats-Selektoren, die die Library selbst auswertet. Für Layer-weite Saison (Vorbild `trinkbrunnen` Mai–Okt) existiert bereits `isInSeason` in `src/lib/utils/seasonality.ts`. Diese Util wird wiederverwendet, nicht neu gebaut.

## Acceptance Criteria

1. **AC-1 (Live-Ampel, Farbe UND Text):**
   **Given** das `oh`-Feld eines Orts (OSM-`opening_hours`-String)
   **When** der Status zur aktuellen Zeit berechnet wird
   **Then** liefert die Logik einen Zustand `open` („jetzt offen", grün), `closing-soon` („schließt bald", gelb) oder `closed` („zu", rot)
   **And** die Ampel zeigt Farbe **und** Text **und** ein Icon (nicht nur Farbe, WCAG 1.4.1, UX-DR3), `closing-soon` greift, wenn die nächste Schließung innerhalb eines konfigurierbaren Fensters (Default 30 min) liegt

2. **AC-2 (Fallback „Zeiten unbekannt"):**
   **Given** ein fehlendes (`oh` leer) oder von der Library als unplausibel/unparsebar gemeldetes Öffnungszeiten-Feld
   **When** der Status nicht bestimmbar ist
   **Then** liefert die Logik den Zustand `unknown` mit Label „Zeiten unbekannt" (neutrale Farbe), der Ort bleibt sichtbar und wird **nicht** vom „jetzt offen"-Filter entfernt
   **And** kein Crash bei `undefined`, `""`, Garbage-String oder reinem Kommentar

3. **AC-3 (Filter „jetzt offen", tastaturbedienbar + beschriftet):**
   **Given** der „jetzt offen"-Filter im Layer-Kontext des `kuehle-orte`-Layers
   **When** ich ihn aktiviere
   **Then** verschwinden Orte mit Zustand `closed` und `off-season` aus dem Layer, Orte mit `open`, `closing-soon` und `unknown` bleiben sichtbar (Fairness gegenüber Datenlücken)
   **And** das Steuerelement ist tastaturbedienbar, hat ein sichtbares Label „jetzt offen" und einen korrekten An/Aus-Zustand für Screenreader (UX-DR5, NFR1)

4. **AC-4 (Saison-Logik):**
   **Given** saisonale Orte (FR19), per `oh`-Monats-Selektor (z. B. `Apr-Oct 09:00-20:00`) oder per Layer-Saison (Vorbild Trinkbrunnen 05-01–10-31)
   **When** der Status außerhalb der Saison berechnet wird
   **Then** behandelt die Logik den Ort als `off-season` mit Label „saisonal geschlossen" (rot), in der Saison gilt die reguläre Tageslogik
   **And** die Layer-Saison nutzt `isInSeason` aus `src/lib/utils/seasonality.ts` (keine dritte Saison-Implementierung)

5. **AC-5 (TDD):**
   **Given** ADR-012
   **When** die Parser-/Status-Tests laufen
   **Then** sind offen, zu, Grenzzeiten (genau bei Öffnung/Schließung, „schließt bald"-Fenster), fehlende/kaputte Daten, Mehrfach-Slots, `PH`-Selektor und Saison-Randfälle (in/außer Saison, Monats-Selektor im `oh`) abgedeckt
   **And** `pnpm test:unit` 100% grün, Determinismus durch injizierbares `now` (keine Wall-Clock-Flakes)

## Tasks / Subtasks

- [ ] **Task 1: Dependency `opening_hours` installieren** (AC: #1, #2, #4)
  - [ ] 1.1 `pnpm add opening_hours` (Setup-Task, kein Test-First). Version pinnen, Lizenz prüfen (LGPL-3.0, reine Build-/Runtime-Lib, kein Distributions-Problem; in `docs/adr/` notieren falls relevant).
  - [ ] 1.2 Falls Types fehlen: `@types/opening_hours` prüfen, sonst minimale lokale `.d.ts`-Deklaration unter `src/lib/types/` (kein `any` im Konsum-Code, NFR3).

- [ ] **Task 2: Reines Status-Logik-Modul (TDD)** (AC: #1, #2, #4, #5)
  - [ ] 2.1 (RED) `src/lib/components/atlas/kuehle-orte/opening-status.test.ts`: Cases offen, zu, exakte Grenzzeit, `closing-soon`-Fenster (29 vs. 31 min Rest), leeres `oh` → `unknown`, Garbage → `unknown`, Mehrfach-Slots, `PH`, `Apr-Oct`-Selektor in/außer Saison, Layer-Saison via `seasonality`-Param. Alle mit injiziertem `now` (UTC-deterministisch).
  - [ ] 2.2 (GREEN) `src/lib/components/atlas/kuehle-orte/opening-status.ts`:
    - Typ `OpeningStatusState = 'open' | 'closing-soon' | 'closed' | 'off-season' | 'unknown'`.
    - Typ `OpeningStatus = { state: OpeningStatusState; label: string; tone: 'green' | 'yellow' | 'red' | 'neutral' }`.
    - `computeOpeningStatus(oh: string | undefined, opts?: { now?: Date; seasonality?: Seasonality; closingSoonMinutes?: number }): OpeningStatus`.
    - Reihenfolge: Layer-`seasonality` via `isInSeason` zuerst → bei außer-Saison `off-season`. Dann `opening_hours`-Parse in try/catch → Parse-Fehler/leer → `unknown`. Dann `getState(now)` + `getNextChange(now)` für `closing-soon`.
    - Library-Konstruktion mit `mode 0`/`nominatim`-frei, deutsche Labels als Konstanten (DE-only, NFR9). Keine em-dashes in Labels.
  - [ ] 2.3 (REFACTOR) Datei < 200 LOC halten, Labels in lokale `const`-Map auslagern.

- [ ] **Task 3: Ampel-Komponente (TDD)** (AC: #1, #2)
  - [ ] 3.1 (RED) `src/lib/components/atlas/kuehle-orte/opening-status-badge.svelte.test.ts`: rendert Text pro State, Farbe **und** Text vorhanden, `role`/`aria-label` gesetzt, Icon gerendert, `unknown` neutral.
  - [ ] 3.2 (GREEN) `src/lib/components/atlas/kuehle-orte/opening-status-badge.svelte` (Svelte 5 Runes, `$props()`): Prop `status: OpeningStatus`. Icon aus `@lucide/svelte` (z. B. `Clock`/`CircleCheck`/`CircleX`/`CircleHelp`). Farbe als Tailwind-Klasse plus sichtbarer Text plus `aria-label`. Kein Farb-only-Signal (WCAG 1.4.1).

- [ ] **Task 4: „jetzt offen"-Filter (TDD)** (AC: #3)
  - [ ] 4.1 (RED) Predicate-Test `src/lib/components/atlas/kuehle-orte/open-now-filter.test.ts`: `passesOpenNowFilter(status, active)` → bei `active=false` immer true; bei `active=true` true für `open`/`closing-soon`/`unknown`, false für `closed`/`off-season`.
  - [ ] 4.2 (GREEN) Reines Predicate in `open-now-filter.ts`.
  - [ ] 4.3 (RED) `open-now-toggle.svelte.test.ts`: Toggle hat Label „jetzt offen", `aria-pressed`/checked-State, Tastatur-Aktivierung emittiert Change.
  - [ ] 4.4 (GREEN) `open-now-toggle.svelte` (Runes, bindable `active`). Verdrahtung in die `kuehle-orte`-Layer-Filterung (Map-Source-Filter bzw. Feature-Liste aus 15.1–15.3) als minimaler Hook.

- [ ] **Task 5: Inspector-Einbindung (Reuse)** (AC: #1, #2, #4)
  - [ ] 5.1 Ampel in das bestehende Inspector-Rendering des `kuehle-orte`-Orts hängen (Titelzeile/Status-Slot, UX-DR1). Bestehende `layer-hit-row.svelte` / `value-formatters.ts` / `layer-hit-display.ts` wiederverwenden, **keine** neue Tooltip-Infrastruktur.
  - [ ] 5.2 Roh-`oh` lesbar formatiert daneben anzeigen (Öffnungszeiten-Klartext), Fallback „Zeiten unbekannt".

- [ ] **Task 6: Abschluss** (AC: #5)
  - [ ] 6.1 `pnpm test:unit` grün, `pnpm check` 0 Errors. Keine em-dashes in Strings/Comments. Dateien < 500 LOC.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **`opening_hours` fehlt:** Kein Eintrag in `package.json`, `node_modules/opening_hours` nicht vorhanden. Library muss diese Story bringen (`pnpm add opening_hours`).
- **Datenfeld `oh`:** `static/data/kuehle-orte/places-osm.json` (659 Objekte) trägt pro Ort `oh` als OSM-`opening_hours`-String. Beispiele: `Mo-Fr 10:00-19:30; Sa 10:00-14:00`, `Mo-Fr 09:00-18:00; Sa,Su,PH 10:00-18:00`, sowie viele leere `"oh": ""` (Fallback-Pflicht, AC-2). Join-Key `id` = `node/123` / `way/456`.
- **`enrichment.json`-Felder:** `opening_hours_note` ist **Prosa** (z. B. „Spielzeiten programmabhängig"), nicht maschinen-parsebar. Nicht als Status-Quelle nutzen; höchstens als Klartext-Ergänzung. `summer_available` (528 `yes`, 69 `limited`, 56 `no`, 6 `unknown`) gehört zu Story 15.5 („im Sommer geschlossen"-Badge), nicht zur Ampel hier.
- **Saison-Util existiert:** `src/lib/utils/seasonality.ts` → `isInSeason(s: Seasonality, now = new Date())`, `Seasonality = { from: string; to: string }` im `MM-DD`-Format, Wrap-around-fähig. Vorbild `trinkbrunnen`: `seasonality: { from: '05-01', to: '10-31' }` in `scripts/lib/sources.ts:197`, Inspector-Effekt in `src/lib/data/get-layers-at-point.ts:69` (außer Saison → `value: null`, `reason: 'seasonal'`).
- **Inspector-Reuse vorhanden:** `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte`, `internal/value-formatters.ts`, `internal/layer-hit-display.ts`. Keine Ampel-/Status-Badge-Komponente existiert bisher (Greenfield für `opening-status-badge.svelte`).
- **Konventionen geprüft:** lucide-Import-Stil `import { X } from '@lucide/svelte'`. Test-Runner vitest, colocated `*.test.ts`, Befehl `pnpm test:unit`.
- **Abhängige, noch offene Vorarbeit:** `scripts/build-kuehle-orte.ts` existiert noch nicht (Story 15.1). `kuehle-orte` ist in `editorial-config.ts` / `pin-icon-mapping.ts` / `layer-synonyms.ts` noch nicht registriert (15.2/15.3). `SourceKind` in `scripts/lib/types.ts:21` ist aktuell `'fis-broker' | 'odis' | 'overpass' | 'dwd'` (kein `'local'`, kommt mit 15.2). Diese Story baut das Logik-Fundament unabhängig vom Build und verdrahtet die Ampel, sobald der Layer steht.

### Design-Entscheidung

- **Library statt Eigen-Parser:** `opening_hours` deckt Wochentage, Mehrfach-Slots, `PH`, Monats-/Saison-Selektoren und Wrap-arounds ab. Eigen-Parser wäre fehleranfällig und dupliziert gelöste Arbeit. Kapselung hinter `computeOpeningStatus`, damit die Library nur an **einer** Stelle hängt (austauschbar, testbar).
- **`closing-soon` als reine Zeitlogik:** `getNextChange(now)` minus `now` ≤ `closingSoonMinutes` (Default 30) und `getState(now) === true`. Schwellwert konfigurierbar für deterministische Tests.
- **`unknown` bleibt sichtbar:** Datenlücken dürfen einen realen Ort nicht verstecken (NFR6/NFR8, ehrliche Haltung). Der Filter entfernt nur belegbar Geschlossenes (`closed`/`off-season`).
- **Saison-Reihenfolge:** Layer-`seasonality` schlägt `oh` vor. Außerhalb der Layer-Saison ist der Ort `off-season`, unabhängig vom Tages-`oh`. Innerhalb der Saison entscheidet `oh` (das selbst Monats-Selektoren tragen kann, von der Library ausgewertet).
- **DE-Labels als Konstanten:** Direkt-Deutsch, keine i18n-Keys (NFR9). Keine em-dashes.

### Was nicht brechen darf

- **Keine zweite/dritte Saison-Logik:** `isInSeason` aus `src/lib/utils/seasonality.ts` wiederverwenden. Die Duplikat-`inSeason` in `get-layers-at-point.ts` nicht als neue Quelle kopieren.
- **Kein neuer Tooltip-Stack:** Ampel in das bestehende Inspector-Panel-Rendering hängen (`layer-hit-row` / `value-formatters` / `layer-hit-display`).
- **Bestehende Layer unberührt:** `trinkbrunnen` und Kultur-Layer (`kultur-kino`, `kultur-museum`, `kultur-bibliothek`, `schwimmbaeder`) nicht verändern. Reines Hinzufügen unter `src/lib/components/atlas/kuehle-orte/`.
- **Determinismus:** Status-Funktion nie ungetestet gegen `new Date()` testen. `now` injizieren, sonst Mitternachts-/Saisongrenzen-Flakes.
- **Typsicherheit:** `opening_hours` ohne mitgelieferte Types → lokale `.d.ts`, kein `any` im Konsum-Code (NFR3). Dateien < 500 LOC (Module realistisch < 200).

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#story-154] (Story 15.4 + AC, Zeilen 189–215)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md] FR5/FR6/FR19 (Zeilen 23, 24, 37), UX-DR3/UX-DR5 (Zeilen 64, 66)
- [Source: src/lib/utils/seasonality.ts] `isInSeason`, `Seasonality` (Reuse für AC-4)
- [Source: scripts/lib/sources.ts:190-198] `trinkbrunnen` mit `seasonality: { from: '05-01', to: '10-31' }` (Saison-Vorbild)
- [Source: src/lib/data/get-layers-at-point.ts:21-28,69-71] vorhandene Saison-Auswertung (nicht als neue Quelle kopieren)
- [Source: static/data/kuehle-orte/places-osm.json] `oh`-Feld pro Ort, viele leere Werte (AC-2-Fallback)
- [Source: static/data/kuehle-orte/enrichment.json] `opening_hours_note` (Prosa), `summer_available` (Story 15.5, nicht hier)
- [Source: src/lib/components/atlas/inspector-panel/layer-hit-row.svelte] Inspector-Reuse-Ziel
- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts] Wert-Formatierung (Reuse)
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts] Hit-Display-Logik (Reuse)
- [Source: scripts/lib/types.ts:21] `SourceKind` (noch ohne `'local'`, kommt mit 15.2)
- [Source: CLAUDE.md] TDD-Mandat (ADR-012), keine em-dashes, DE-only, @lucide/svelte
- [Source: package.json:17-19] Test-Scripts (`pnpm test:unit`)

## Dev Agent Record

### Agent Model Used

_(bei Implementation ausfüllen)_

### Completion Notes List

_(bei Implementation ausfüllen)_

### File List

**Erwartet neu:**
- `src/lib/components/atlas/kuehle-orte/opening-status.ts` (+ `.test.ts`)
- `src/lib/components/atlas/kuehle-orte/opening-status-badge.svelte` (+ `.test.ts`)
- `src/lib/components/atlas/kuehle-orte/open-now-filter.ts` (+ `.test.ts`)
- `src/lib/components/atlas/kuehle-orte/open-now-toggle.svelte` (+ `.test.ts`)
- ggf. `src/lib/types/opening_hours.d.ts` (falls keine offiziellen Types)

**Erwartet geändert:**
- `package.json` (Dependency `opening_hours`)
- Inspector-Einbindung des `kuehle-orte`-Orts (Reuse-Punkt aus 15.2/15.3)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-4 → review)

### Debug Log References

_(bei Implementation ausfüllen)_

## Change Log

- 2026-06-30: Story 15.4 erstellt (ready-for-dev). Live-Öffnungsstatus-Ampel via `opening_hours`-Library, Fallback „Zeiten unbekannt", tastaturbedienbarer „jetzt offen"-Filter, Saison-Logik via vorhandener `isInSeason`-Util. TDD-first, 5 ACs.
