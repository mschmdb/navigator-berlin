# Story 10.7: Umweltgerechtigkeit · Kategorie-Mapping-Fix

Status: done

> **Anker:** Audit-Befund B1 (`_user-input/datenaufloesung-audit-2026-05-21.md`, Zeilen 197-219). Score-unabhängiger Quick-Win. Keine Epic-9-Abhängigkeit, keine DB-Berührung. Einzige Änderungszone: `layer-style-builder.ts` + zugehöriger Test.

## Story

As a User,
I want dass alle 542 LOR der Umweltgerechtigkeit korrekt eingefärbt sind,
so that die Karte keine 35% weißen Lücken zeigt, die keine Datenlücken sind.

## Acceptance Criteria

1. **AC-1 (Match-Werte korrigiert):**
   **Given** die Quell-Kategorien `keine starke Belastung` (187), `einfach` (147), `zweifach` (92), `dreifach` (86), `vierfach` (27), `fünffach` (3)
   **When** ich `choropleth-mehrfach` in `layer-style-builder.ts` (Zeile 444) korrigiere
   **Then** erhalten `keine starke Belastung` und `fünffach` eigene Farben aus der `scaleLast`-Palette
   **And** kein Polygon fällt mehr auf `COLORS.bg` (weiß/Hintergrund)
   **And** der Default-Fallback greift ausschließlich bei echt unbekannten Werten

2. **AC-2 (Legende vollständig):**
   **Given** die Legende für `choropleth-mehrfach` in `LEGEND_BY_PROFILE` (Zeile 186-196)
   **When** sie gerendert wird
   **Then** zeigt sie 6 Einträge: `keine starke Belastung`, `einfach`, `zweifach`, `dreifach`, `vierfach`, `fünffach`
   **And** der bisherige falsche Label `keinfach` ist entfernt
   **And** `fünffach` ist als sechste Stufe ergänzt

3. **AC-3 (TDD: alle Quell-Kategorien gedeckt):**
   **Given** ADR-012 (Pragmatic TDD)
   **When** die Tests in `layer-style-builder.test.ts` laufen
   **Then** deckt mindestens ein Test jede der 6 Quell-Kategorien ab (einzeln prüfbar über den paint-JSON)
   **And** ein Test verifiziert, dass kein Kategorie-Wert `COLORS.bg` als Farbe produziert
   **And** ein Test verifiziert, dass der Default-Fallback für einen echt unbekannten Wert weiterhin `COLORS.bg` liefert
   **And** Tests folgen Red → Green (Failing-First im Commit nachvollziehbar)

## Tasks / Subtasks

- [ ] **Task 1: Test-First — Failing-Tests schreiben** (AC: #3)
  - [ ] 1.1 (RED) In `layer-style-builder.test.ts`: bestehenden Test `choropleth-mehrfach für umweltgerechtigkeit-2023 nutzt vierfach-Skala` (Zeile 136-142) auf alle 6 Kategorien erweitern. Folgende Assertions ergänzen:
    - `flat` enthält `keine starke Belastung` (bisher nicht vorhanden → RED)
    - `flat` enthält `fünffach` (bisher nicht vorhanden → RED)
    - `flat` enthält NICHT `keinfach` (bisher vorhanden → RED)
  - [ ] 1.2 (RED) Neuen Test ergänzen: `choropleth-mehrfach produziert COLORS.bg nur für unbekannte Kategorien`. Prüft, dass der paint-JSON für `keine starke Belastung` NICHT `COLORS.bg` (`#ECEAE0`) enthält.
  - [ ] 1.3 (RED) Neuen Test ergänzen: `choropleth-mehrfach Legende hat 6 Einträge`. Ruft `getLegendSpec('umweltgerechtigkeit-2023')` auf, erwartet `items.length === 6`, `items[0].label === 'keine starke Belastung'`, `items[5].label === 'fünffach'`.
  - [ ] 1.4 Verifizieren, dass alle neuen Assertions failen (`pnpm test:unit --project browser`; NICHT `--project server`, Browser-Zombie vermeiden per Memory `feedback_browser_test_fetch_spy` ist hier nicht relevant, da kein fetch-spy).

- [ ] **Task 2: Fix — Match-Werte korrigieren** (AC: #1)
  - [ ] 2.1 In `layer-style-builder.ts`, `case 'choropleth-mehrfach'` (Zeile 444-471): `match`-Array anpassen:
    - `'keinfach'` → `'keine starke Belastung'` mit Farbe `COLORS.scaleLast1`
    - `'einfach'` → `COLORS.scaleLast2` (unverändert, nur Position verschiebt sich)
    - `'zweifach'` → `COLORS.scaleLast3`
    - `'dreifach'` → `COLORS.scaleLast4`
    - `'vierfach'` → `COLORS.scaleLast5` (bisher letzter Match)
    - `'fünffach'` neu ergänzen mit Farbe `COLORS.scaleLast5` (tiefste Belastungs-Stufe, selbe Farbe da Palette 5-stufig ist)
    - Default `COLORS.bg` bleibt als Fallback für unbekannte Werte

- [ ] **Task 3: Fix — Legende anpassen** (AC: #2)
  - [ ] 3.1 In `layer-style-builder.ts`, `LEGEND_BY_PROFILE['choropleth-mehrfach']` (Zeile 186-196): `items`-Array auf 6 Einträge erweitern:
    - Index 0: `{ color: COLORS.scaleLast1, label: 'keine starke Belastung' }` (ersetzt `keinfach`)
    - Index 1: `{ color: COLORS.scaleLast2, label: 'einfach' }`
    - Index 2: `{ color: COLORS.scaleLast3, label: 'zweifach' }`
    - Index 3: `{ color: COLORS.scaleLast4, label: 'dreifach' }`
    - Index 4: `{ color: COLORS.scaleLast5, label: 'vierfach' }`
    - Index 5: `{ color: COLORS.scaleLast5, label: 'fünffach' }` (neu)

- [ ] **Task 4: Green verifizieren** (AC: #1, #2, #3)
  - [ ] 4.1 `pnpm test:unit` läuft grün.
  - [ ] 4.2 `pnpm check` bleibt auf bisherigem Stand (kein neuer Type-Error).
  - [ ] 4.3 Im Browser kurz prüfen: Layer `umweltgerechtigkeit-2023` aktivieren, Karte zeigt keine weißen Flächen mehr.

## Dev Notes

### Ist-Zustand (Befund B1, Audit 2026-05-21)

`src/lib/components/atlas/internal/layer-style-builder.ts`:

- **Zeile 81:** `'umweltgerechtigkeit-2023': 'choropleth-mehrfach'` (korrekt, kein Änderungsbedarf)
- **Zeilen 186-196:** `LEGEND_BY_PROFILE['choropleth-mehrfach']` mit 5 Items, Labels: `keinfach` / `einfach` / `zweifach` / `dreifach` / `vierfach`. Falsch: erster Label heißt `keinfach`, nicht `keine starke Belastung`. Sechste Stufe `fünffach` fehlt.
- **Zeilen 444-471:** `case 'choropleth-mehrfach'` mit `match`-Ausdruck über Property `kategorie`. Aktuell 5 Match-Paare: `'keinfach'` / `'einfach'` / `'zweifach'` / `'dreifach'` / `'vierfach'`. Default: `COLORS.bg`.

**Folge:** `keine starke Belastung` (187 Polygone, 34,5%) und `fünffach` (3 Polygone) matchen keinen Wert und erhalten `COLORS.bg` (`#ECEAE0`). Auf hellem Basemap = unsichtbar weiß.

**Quell-Property:** `kategorie` (wird korrekt via `['get', 'kategorie']` abgerufen, keine Änderung nötig).

**Verdikt Audit:** Die Quelle (`umweltgerechtigkeit-2023`) hat nur LOR-Planungsraum-Auflösung. Feinere Auflösung gibt sie nicht her. Die weißen Flächen sind ein Mapping-Bug, kein Auflösungsproblem.

### Farbstrategie für `fünffach`

`COLORS.scaleLast` hat genau 5 Stufen (`scaleLast1` bis `scaleLast5`). Da `fünffach` die höchste Belastung beschreibt, bekommt es `scaleLast5` (tiefster Dunkelton der Last-Familie, `#8C2A14`). Das ist dieselbe Farbe wie `vierfach`. Redaktionelle Vertretbarkeit: `fünffach` tritt in Berlin nur in 3 LOR auf; die minimale visuelle Differenz ist akzeptabel. Alternative (neues `scaleLast6`-Token) wäre Over-Engineering für 3 Polygone.

### Test-Datei: bestehende Tests nicht brechen

`layer-style-builder.test.ts` Zeile 136-142 testet aktuell nur auf `vierfach`/`dreifach`/`einfach`. Der Test failt nach dieser Story nicht, weil er keine negativen Assertions enthält. Trotzdem erweitern (AC-3).

Der Test in Zeile 253-283 prüft `StyleProfile`-Union-Länge (`expect(profiles).toHaveLength(26)`). `choropleth-mehrfach` ist bereits in der Union (Zeile 11). Kein neues Profil wird eingeführt. Länge bleibt 26. Kein Änderungsbedarf.

### Was nicht brechen darf

- Alle anderen `StyleProfile`-Cases in `buildLayerSpec` (keine Berührung)
- `getLegendSpec` und `getStyleProfile` (Export-Signaturen unverändert)
- `LAYER_STYLE_PROFILE`-Map (Slug-Zuordnung korrekt, kein Änderungsbedarf)
- Alle anderen Layer-Tests (keine gemeinsamen Fixtures)

### Architektur-Compliance — relevante MUST-Rules

- **#2:** Datei `layer-style-builder.ts` ist lang. Vor Änderung Zeilen zählen; nach dem Fix prüfen ob <500 Zeilen. Stand: ~760 Zeilen. Die Datei überschreitet bereits das Limit. Kein Refactor-Mandat in dieser Story (scope-gebunden). Hinweis für nächste Story dokumentieren.
- **#6:** Kommentar im `case 'choropleth-mehrfach'` auf neue Stufen-Zahl anpassen (5-stufige Palette für 6-stufige Skala).
- **#7:** TS strict, kein `any`. Kein neuer Typ eingeführt, kein Risiko.
- **#15:** Last-Familie (Vermillion) für Umweltbelastung ist editorial korrekt (ADR-015: Umwelt-Schaden ist Schaden, kein Stigma).

### Previous Story Intelligence

- **Story 1.31 (`choropleth-family.ts`):** Last-Familie-Tokens (`scaleLast1`-`scaleLast5`) eingeführt. Farbwerte: `#8F7972` / `#90675B` / `#905545` / `#8F412E` / `#8C2A14`. Kontrast gegen `COLORS.bg` (`#ECEAE0`) geprüft (check-scale-contrast.ts). 6. Stufe (gleiches `scaleLast5`) ist akzeptabel.
- **Story 1.31 (layer-style-builder.ts):** `choropleth-mehrfach` mit 5 Match-Paaren eingeführt. Dieser Fix korrigiert die falsch gesetzten Quell-Strings.
- **Memory `project_kiez_score_naming`:** `umweltgerechtigkeit-2023` ist kein Score-Input mehr (AC-2 Story 9.1). Der Layer bleibt als standalone-Explorationsschicht aktiv.

### References

- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L81] (Slug-Zuordnung)
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L186-196] (LEGEND_BY_PROFILE choropleth-mehrfach)
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts#L444-471] (case choropleth-mehrfach)
- [Source: src/lib/components/atlas/internal/layer-style-builder.test.ts#L136-142] (bestehender Test)
- [Source: src/lib/components/atlas/internal/colors.ts#L45-49] (scaleLast-Tokens)
- [Source: _user-input/datenaufloesung-audit-2026-05-21.md#L197-219] (Befund B1)
- [Source: _bmad-output/planning-artifacts/epics.md#L3536-3554] (Story 10.7 ACs)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code)

### Debug Log References

- RED: 3 fail / 22 pass (keinfach-Match + 5-stufige Legende vorhanden, neue 6-Kategorien-Assertions failen)
- GREEN: 25/25 pass
- `pnpm check`: 0 Errors, 1 pre-existing Warning (mobile-meta-drawer a11y)

### Completion Notes List

- `choropleth-mehrfach` match-Wert `keinfach` → `keine starke Belastung` (echter Quell-String), `fünffach` ergänzt (teilt scaleLast5 mit vierfach, nur 3 LOR).
- Legende `LEGEND_BY_PROFILE['choropleth-mehrfach']` auf 6 Einträge, falscher Label `keinfach` entfernt.
- 190 Polygone (35%) fallen nicht mehr auf COLORS.bg. Default greift nur noch bei echt unbekannten Werten.
- Hinweis: `layer-style-builder.ts` ~760 Zeilen (MUST-Rule #2 verletzt, pre-existing). Refactor-Folge-Story empfohlen, nicht Teil von 10.7.
- Browser-Verify (AC-4.3) ausstehend: visueller Check Layer-Aktivierung lokal durch Owner.

### File List

**Geändert:**
- `src/lib/components/atlas/internal/layer-style-builder.ts` (match + Legende choropleth-mehrfach)
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (4 Tests: 6 Kategorien, kein bg-Match, Default-bg, Legende 6 Einträge)
