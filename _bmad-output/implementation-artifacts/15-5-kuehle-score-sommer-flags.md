# Story 15.5: Kühle-Score, Sommer-Verfügbarkeit und ehrliche Flags

Status: ready-for-dev

> **Anker:** ADR-012 (Pragmatic TDD), Epic 15 (`epics-kuehle-orte.md`), FR7/FR8/FR9/FR10/FR11, UX-DR3/UX-DR4. Diese Story rendert die Vertrauens-Signale eines kühlen Orts: Kühle-Score mit Kurzbegründung, „im Sommer geschlossen"-Abwertung und die ehrlichen Flags (kostenlos/Ticket, klimatisiert nur wenn belegt, barrierefrei wenn bekannt).
> **Abhängigkeit:** Story 15.1 (`scripts/build-kuehle-orte.ts`) liefert die Feature-Properties, Story 15.3 liefert die Orts-Inspector-Card, in die das Badge-Set eingehängt wird. Diese Story baut die reine Mapping-Logik plus Badge-Komponente. Sie ist render-seitig auch ohne 15.3 testbar (Komponenten-Test isoliert).
> **Kein neuer Tooltip:** Wiederverwendung der bestehenden Inspector-Panel-Infrastruktur (`inspector-panel/`), Badge-Komponente als eigenständiges, einhängbares Teil analog `score-membership-badge.svelte`.

## Story

As a Nutzer,
I want pro Ort wissen, wie kühl er ist und ob er bei Hitze überhaupt nutzbar ist,
so that ich nicht vor einem im Sommer geschlossenen Eisstadion stehe.

## Kontext: Warum dieser Change

Die Daten sind ehrlich, aber roh: `cool_score` 1–5, `summer_available` (yes/limited/no/unknown), `is_free` (free/ticket/unknown), `ac_status` (yes/likely/no/unknown), `wheelchair` (yes/limited/no/leer). Ohne Aufbereitung liest niemand „summer_available=no" als „im Sommer geschlossen". Diese Story übersetzt die rohen Felder in barrierefreie Badges: Farbe UND Text, Screenreader-Alternative, kein Color-only-Signal. Sie hält die AC-Ehrlichkeit durch: „klimatisiert" erscheint nur bei belegtem `ac_status=yes` (29 von 659 Orten), nie bei `likely`/`unknown`.

Die Abwertung im Sommer geschlossener Orte (`summer_available=no`, 56 Orte, v. a. Eishallen und saisonale Bäder) ist Kern des Nutzer-Versprechens: solche Orte verschwinden nicht, sie ranken niedriger und tragen ein deutliches Warn-Badge.

## Acceptance Criteria

1. **AC-1 (Kühle-Score-Badge + Begründung):**
   **Given** `cool_score` (1–5) und eine ableitbare Kurzbegründung
   **When** der Ort im Inspector gerendert wird
   **Then** zeigt ein Badge den Score (z. B. „Kühle 4/5") plus Kurzbegründung (klimatisiert / Massivbau / am Wasser), die Begründung wird deterministisch aus `ac_status` und `cat` abgeleitet
   **And** das Badge trägt Farbe UND Text plus eine Screenreader-Alternative, nie nur Farbe

2. **AC-2 (Sommer-Verfügbarkeit + Abwertung):**
   **Given** `summer_available`
   **When** der Ort gerendert und sortiert wird
   **Then** trägt `no` ein deutliches Badge „im Sommer geschlossen" (danger-Severity), `limited` ein Badge „im Sommer eingeschränkt" (warning-Severity), `yes`/`unknown` kein Sommer-Badge
   **And** im Sommer geschlossene Orte (`no`) ranken in der Sortier-/Sichtbarkeits-Reihenfolge nach hinten (Sort-Gewicht), bleiben aber sichtbar

3. **AC-3 (Ehrliche Flags, nur wenn belegt):**
   **Given** `is_free`, `ac_status`, `wheelchair`
   **When** die Flags gerendert werden
   **Then** erscheint „kostenlos" (`free`) bzw. „Ticket" (`ticket`), `unknown` zeigt kein Zugangs-Flag
   **And** „klimatisiert" erscheint NUR bei `ac_status=yes`, niemals bei `likely`/`no`/`unknown`
   **And** ein Rollstuhl-Flag erscheint bei bekannter Barrierefreiheit (`yes` → „barrierefrei", `limited` → „teilweise barrierefrei", `no` → „nicht barrierefrei"), leeres Feld zeigt kein Flag
   **And** jedes Flag trägt eine Text-Alternative (kein Icon-only)

4. **AC-4 (TDD):**
   **Given** ADR-012
   **When** die Badge-Mapping-Logik getestet wird
   **Then** sind abgedeckt: alle 5 Score-Stufen, Begründungs-Ableitung, Sommer-Abwertung inkl. Sort-Gewicht, `limited`-Kennzeichnung, „AC nur wenn belegt" (yes vs. likely/no/unknown), `is_free`-Mapping inkl. `unknown`, alle `wheelchair`-Werte inkl. leer
   **And** `pnpm test:unit` 100% grün, keine Snapshot-Lücken bei Grenzwerten

## Tasks / Subtasks

- [ ] **Task 1: Reine Badge-Mapping-Logik (RED zuerst)** (AC: #1, #2, #3, #4)
  - [ ] 1.1 (RED) `src/lib/components/atlas/inspector-panel/internal/kuehle-orte-flags.test.ts`: Test-Cases pro AC mappen
    - `coolScoreBadge(score)`: 1..5 → `{ value: 'Kühle N/5', srText, severity }`, ungültig/`null` → `null`
    - `coolScoreReason({ ac_status, cat })`: `ac_status=yes` → „klimatisiert"; Wasser-Kategorien (`Schwimmzentrum`/`Bad`/`Wasserpark`) → „am Wasser"; Massivbau-Kategorien (`Museum`/`Bibliothek`) → „Massivbau"; sonst `null`
    - `summerBadge(summer_available)`: `no` → danger „im Sommer geschlossen"; `limited` → warning „im Sommer eingeschränkt"; `yes`/`unknown`/leer → `null`
    - `summerSortWeight(summer_available)`: `no` → niedrigstes Gewicht (rankt hinten), sonst neutral
    - `accessBadge(is_free)`: `free` → „kostenlos"; `ticket` → „Ticket"; `unknown`/leer → `null`
    - `acBadge(ac_status)`: `yes` → „klimatisiert"; `likely`/`no`/`unknown`/leer → `null`
    - `wheelchairBadge(wheelchair)`: `yes`/`limited`/`no` → Text-Alternative je Wert; leer/unbekannt → `null`
  - [ ] 1.2 (GREEN) `kuehle-orte-flags.ts` implementieren: typsichere Input-Typen (`KuehleOrtProps`), reine Funktionen, kein `any`, < 200 LOC. Badge-Descriptor-Typ `{ value: string; srText: string; severity: 'danger' | 'warning' | 'neutral' | 'success'; icon: string }`
  - [ ] 1.3 (REFACTOR) Severity-Token an bestehende `value-severity-mapping`/`SEVERITY_TEXT`-Konvention angleichen (`text-severity-*`), keine neuen Farb-Token erfinden

- [ ] **Task 2: Badge-Komponente (RED zuerst)** (AC: #1, #2, #3)
  - [ ] 2.1 (RED) `src/lib/components/atlas/inspector-panel/kuehle-orte-flags.svelte.test.ts`: rendert pro Beispiel-Ort die erwarteten Badges, prüft `data-testid`, sichtbaren Text UND `sr-only`-Alternative, „klimatisiert" fehlt bei `ac_status=likely`, „im Sommer geschlossen" sichtbar bei `no`
  - [ ] 2.2 (GREEN) `kuehle-orte-flags.svelte`: Svelte-5-Runes (`$props`, `$derived`), `@lucide/svelte`-Icons (`Snowflake` klimatisiert, `Accessibility` Rollstuhl, `Ticket`/`BadgeEuro` Zugang, `CalendarOff` Sommer, `Thermometer`/`Droplet` Score), jedes Badge = farbiger Chip mit sichtbarem Label + `<span class="sr-only">`-Alternative, Icons `aria-hidden`. Kein Color-only.
  - [ ] 2.3 Datei < 200 LOC, Badge-Liste aus den reinen Mapping-Funktionen ableiten (kein Logik-Duplikat in der Komponente)

- [ ] **Task 3: Einhängen in den Orts-Inspector** (AC: #1, #2, #3)
  - [ ] 3.1 In der Orts-Inspector-Card aus Story 15.3 (`kuehle-orte`-Hit-Pfad) `<KuehleOrteFlags props={...} />` rendern, gespeist aus `hit.value`-Properties (`cool_score`, `suitable_reason`, `summer_available`, `is_free`, `ac_status`, `wheelchair`)
  - [ ] 3.2 Falls 15.3 noch nicht gelandet: Komponente bleibt isoliert getestet, Einhängen wird als Hand-off-Notiz an 15.3 vermerkt (kein Block für diese Story)

- [ ] **Task 4: Sort-/Sichtbarkeits-Abwertung verdrahten** (AC: #2)
  - [ ] 4.1 `summerSortWeight` dort konsumieren, wo kühle Orte gelistet/sortiert werden (Inspector-Liste bzw. Landing „in deiner Nähe", Story 16.x); im Atlas-Pin-Rendering im Sommer geschlossene Orte optisch zurücknehmen via bestehendem Opacity-/Muted-Token, keine eigene Map-Styling-Infrastruktur
  - [ ] 4.2 Sicherstellen: abgewertete Orte bleiben sichtbar (keine Ausfilterung, nur Rang/Visuals)

- [ ] **Task 5: Abschluss** (AC: #4)
  - [ ] 5.1 `pnpm test:unit` grün, `pnpm check` 0 Errors, alle Dateien < 500 LOC, keine em-dashes in Strings/Kommentaren
  - [ ] 5.2 Dev Agent Record + Change Log füllen, `sprint-status.yaml` 15-5 → review

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Daten committed** unter `static/data/kuehle-orte/`:
  - `enrichment.json`: 659 Objekte. Relevante Felder dieser Story: `cool_score` (1: 12, 2: 135, 3: 328, 4: 180, 5: 4), `summer_available` (yes: 528, limited: 69, no: 56, unknown: 6), `is_free` (free: 360, ticket: 266, unknown: 33), `ac_status` (unknown: 372, likely: 151, no: 107, yes: 29), `suitable_reason` (Freitext), `cat`.
  - `places-osm.json`: 659 Objekte, liefert `wheelchair` (yes: 297, leer: 191, limited: 105, no: 66) und `ac` (leer: 619, yes: 29, no: 11). Join-Key `id` identisch in beiden Files.
  - **Konsequenz:** `ac_status=yes` (29) deckt sich mit `ac=yes` (29) und der Methodik-Aussage „29 belegt". Barrierefreiheit kommt aus `places-osm.json:wheelchair`, NICHT aus enrichment.
- **Kategorien** (`cat`): Museum 240, Bibliothek 145, Mall/Center 92, Kino 87, Schwimmzentrum 66, Kaufhaus 18, Eishalle 6, Bad 4, Wasserpark 1. Grundlage der „am Wasser"/„Massivbau"-Ableitung.
- **Kein `cool_score_reason`-Feld** in den Daten. Die Kurzbegründung muss deterministisch abgeleitet werden (`ac_status` + `cat`). `suitable_reason` bleibt der ausführliche Freitext für die Card, ersetzt aber nicht das knappe Score-Label.
- **Build-Script `scripts/build-kuehle-orte.ts` existiert noch nicht** (Story 15.1). Die Feature-Properties, die diese Story konsumiert, müssen aus 15.1 kommen. Vorbild-Build: `scripts/build-klima-pet-points.ts`.
- **Inspector-Routing:** `src/lib/components/atlas/inspector-panel.svelte` (Zeile 695–730) wählt pro `hit.layer` die Card: `klima-pet-2022` → `KlimaPetCard`, `CARD_SLUGS` → `LayerCard`, sonst `LayerHitRow`. Der `kuehle-orte`-Pfad ist Sache von 15.3; diese Story liefert die einhängbare Badge-Komponente.
- **Badge-Vorbild:** `inspector-panel/score-membership-badge.svelte` zeigt das Muster: kleiner farbiger Chip mit `data-testid`, Lucide-Icon `aria-hidden`, sichtbarer Text. `klima-pet-card.svelte` zeigt `SEVERITY_TEXT`-Mapping auf `text-severity-*`-Token.
- **Severity-Konvention:** `value-severity-mapping.ts` plus `SEVERITY_TEXT` in `klima-pet-card.svelte` (`success`, `success-soft`, `neutral`, `warning`, `danger`). Diese Token wiederverwenden, keine neuen Farben.
- **Saison/Status** (offen/zu, „jetzt offen"-Filter) gehört zu Story 15.4, NICHT hierher. Diese Story ist Score + statische Flags, kein Live-Status.

### Design-Entscheidung: Reine Mapping-Logik plus dünne Komponente

Die gesamte Übersetzungs-Logik (Roh-Feld → Badge-Descriptor) lebt in `internal/kuehle-orte-flags.ts` als reine, getestete Funktionen. Die Komponente `kuehle-orte-flags.svelte` rendert nur die Descriptor-Liste. Vorteil: AC-4 testet die Wahrheits-Regeln („AC nur wenn yes") ohne DOM, die Komponente bleibt trivial und barrierefrei.

**Kurzbegründung-Ableitung** (Priorität): `ac_status=yes` → „klimatisiert" (stärkstes belegtes Signal); sonst Wasser-Kategorie (`Schwimmzentrum`/`Bad`/`Wasserpark`) → „am Wasser"; sonst Massivbau-Kategorie (`Museum`/`Bibliothek`) → „Massivbau"; sonst keine Begründung (Badge zeigt nur Score). Keine erfundene Begründung bei dünner Datenlage.

**Abwertung** ist Rang plus Visual, keine Ausfilterung. `summer_available=no` bekommt das niedrigste Sort-Gewicht und ein danger-Badge. `limited` bleibt im normalen Rang, trägt aber ein warning-Badge. Ausfilterung (`suitable=false`, `still_exists=no`) ist Build-Sache (15.1), nicht diese Story.

**Barrierefreiheit ehrlich:** `wheelchair=no` wird als „nicht barrierefrei" gezeigt (bekannte Negativ-Info hilft Rollstuhlfahrenden), leeres Feld zeigt gar nichts (unbekannt ≠ negativ).

### Was nicht brechen darf

- Bestehende Inspector-Cards (`KlimaPetCard`, `LayerCard`, `LayerHitRow`) und das Routing in `inspector-panel.svelte` bleiben unangetastet. Reines Hinzufügen.
- Keine neuen Farb-Token, keine Color-only-Signale (NFR1/WCAG, UX-DR3).
- „klimatisiert" darf bei `likely`/`unknown` NICHT erscheinen (ehrliche Datenhaltung, NFR6/NFR8).
- Abgewertete Orte bleiben sichtbar; Abwertung ist nie Ausschluss.
- DE-only, keine i18n-Keys (NFR9). Keine em-dashes.

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md] (Story 15.5 Zeile 217–239; FR7/FR8/FR9/FR10/FR11 Zeile 26–29; UX-DR3/UX-DR4 Zeile 64–65)
- [Source: static/data/kuehle-orte/enrichment.json] (Felder `cool_score`, `summer_available`, `is_free`, `ac_status`, `suitable_reason`, `cat`)
- [Source: static/data/kuehle-orte/places-osm.json] (Feld `wheelchair`, Join-Key `id`)
- [Source: src/lib/components/atlas/inspector-panel/score-membership-badge.svelte] (Badge-Muster: Chip + Lucide aria-hidden + data-testid)
- [Source: src/lib/components/atlas/inspector-panel/klima-pet-card.svelte:68-74] (`SEVERITY_TEXT`-Mapping auf `text-severity-*`)
- [Source: src/lib/components/atlas/inspector-panel.svelte:695-730] (Card-Routing pro `hit.layer`, Einhäng-Punkt für 15.3)
- [Source: src/lib/components/atlas/inspector-panel/internal/value-severity-mapping.ts] (Severity-Konvention)
- [Source: docs/adr/ADR-012-tdd-mandate.md] (Pragmatic TDD, Test-first für Logik-Module)
- [Source: scripts/build-klima-pet-points.ts] (Vorbild Punkt-Build, Property-Pass-through für 15.1)

## Dev Agent Record

### Agent Model Used

_(beim Dev-Lauf füllen)_

### Completion Notes List

_(beim Dev-Lauf füllen)_

### File List

**Neu (erwartet):**
- `src/lib/components/atlas/inspector-panel/internal/kuehle-orte-flags.ts` (+ `.test.ts`)
- `src/lib/components/atlas/inspector-panel/kuehle-orte-flags.svelte` (+ `.svelte.test.ts`)

**Geändert (erwartet):**
- Orts-Inspector-Card aus Story 15.3 (Einhängen `<KuehleOrteFlags />`)
- Konsument der Sortier-Liste (Sort-Gewicht), sofern in Scope
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (15-5 → review)

### Debug Log References

_(beim Dev-Lauf füllen)_

## Change Log

- 2026-06-30: Story 15.5 erstellt (ready-for-dev). Kühle-Score-Badge + abgeleitete Kurzbegründung, Sommer-Abwertung (no/limited) inkl. Sort-Gewicht, ehrliche Flags (is_free, ac_status nur wenn yes, wheelchair wenn bekannt). Reine Mapping-Logik plus dünne Badge-Komponente, TDD-first.
