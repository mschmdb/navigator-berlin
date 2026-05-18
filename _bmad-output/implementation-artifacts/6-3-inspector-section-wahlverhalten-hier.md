# Story 6.3: Inspector-Section „Wahlverhalten hier" (Bars + Level-Switch + Slope-Sparkline)

Status: in-progress

<!-- Created 2026-05-18 nach Epic-6-Rewrite + UX-Recon (Datawrapper/NN/g/FT). Blocked by 6-0 (Schema+Queries) + 6-2 (Wahlbezirks-Lookup). Phase-1: lokaler Level-Switch in Wahl-Section; globaler Inspector-Level-Switch = Epic 8. -->

## Story

As a politik-interessierter Bürger,
I want im Inspektor-Panel eine Wahl-Sektion mit Top-5-Parteien als horizontale Stacked-Bars + Slope-Sparkline + Wahlbeteiligung + lokalem Level-Switch (Stimmbezirk/Kiez/Bezirk/Berlin),
so that ich auf einen Blick sehe wie meine Adresse politisch tickt UND ich die Detail-Tiefe (Adress-Punkt bis Berlin-Gesamt) selbst wählen kann.

## Quellen

- **UX-Recon-Report 2026-05-18:** Datawrapper Election-Donut-Academy + NN/g Chart-Choice + FT Visual-Vocabulary + Fossheim 2024 A11y-Election-Audit.
- **Story 6.0:** Schema + 6 Query-Module konsumieren.
- **Story 6.2:** `get-wahlbezirks-by-year.ts`-Lookup.
- **Story 1.27:** Compare-Mode-Integration mit `EVALUATIVE_PROFILES`-Lock-Pattern.
- **Memory `feedback_no_lebenswert`:** kein „Hochburg"-Wording, neutrale Sprache.
- **Memory `project_compare_editorial_profiles`:** Compare same-level-lock.
- **Memory `project_berlin_click_guard`:** Brandenburg-Punkte rendern keine Wahl-Section.
- **Memory `project_layerchart_v2`:** Sparkline via LayerChart, yBaseline=null, optimizeDeps.include.

## UX-Spec (per UX-Recon, hard locked)

- Chart-Type: **horizontale Stacked-Bars**, KEIN Donut.
- Default-Level: **Kiez (LOR)**.
- Wahltyp-Tabs oben: AGH / BTW / BVV.
- Level-Switch: ein Dropdown (Stimmbezirk/Kiez/Bezirk/Berlin) innerhalb der Section.
- Delta-Chips inline: vs Kiez · vs Bezirk · vs Berlin.
- Slope-Sparkline: kleine Multiples Top-5-Parteien (80×24px je).
- Direktmandats-Annotation: Wahlkreis-Info als Footer-Block (KEIN Level, nur Kontext).
- Briefwahl-Asymmetrie: dezenter Info-Badge + Confidence-Hairline am Bar-Ende (Story 6.5).
- WCAG: Stacked-Bar mit `<table>`-Fallback (visuell-hidden), Muster-Overlay gegen Achromatopsie.

## Acceptance Criteria

**AC-1 (wahl-section.svelte mit Wahltyp-Tabs + Level-Switch):**

**Given** die Wahl-Daten-Queries (Story 6.0) und Wahlbezirks-Lookup (Story 6.2)
**When** ich `src/lib/components/atlas/wahl-section.svelte` als Inspector-Section implementiere mit:
- Wahltyp-Tabs (AGH/BTW/BVV) als bits-ui-Tabs, Default = neueste verfügbare Wahl
- Level-Dropdown (Stimmbezirk → Kiez → Bezirk → Berlin) als bits-ui-Select, Default = Kiez
- Horizontale Stacked-Bars für Top-5-Parteien des gewählten Levels (Tailwind-only, kein extra Lib)
- Wahlbeteiligung als sub-Metrik unter den Bars
- Slope-Sparkline für letzte verfügbare Wahlen desselben Typs (LayerChart-Reuse)
- Delta-Chips: gewählter Level vs. die 3 anderen Levels (`+4,2pp`)
- Direktmandats-Annotation für AGH/BTW (Wahlkreis-ID + Direktkandidat + Partei)
**Then** Sektion erscheint nur wenn Wahldaten für Adresse existieren (FR59)

**AC-2 (WCAG + Screenreader-Table):**

**Given** Partei-Farben + Bars
**When** Bars rendern
**Then** Farben kommen aus zentralem `src/lib/data/partei-farben.ts` (CDU dunkelgrau, SPD rot, Grüne grün, Linke pink, AfD eigenes-Blau differenziert von navigator-accent-navy, FDP gelb, BSW lila, sonstige hellgrau)
**And** Bars haben dezente Muster-Overlay (Streifen/Punkte) als Achromatopsie-Fallback
**And** Screenreader-Table-Fallback (visuell hidden `<table>` mit Parteien + Anteilen)
**And** Color-Contrast erfüllt WCAG-AA für alle Partei-Farben gegen Inspector-BG

**AC-3 (Briefwahl-Asymmetrie):**

**Given** Stimmbezirks-Level + pre-2021-Wahl
**When** User Stimmbezirks-Level wählt
**Then** dezenter Info-Badge: „Stimmbezirks-Werte ohne Briefstimmen — Briefwähler nur als Bezirks-Aggregat"
**And** Bars zeigen Confidence-Hairline (4-6px schraffierte End-Zone)

**AC-4 (Brandenburg-Guard):**

**Given** Adresse außerhalb Berlin
**When** Inspector öffnet
**Then** Sektion wird gar nicht gerendert (consistent mit Story 1.27)

**AC-5 (pre-2017-Wahl-Stimmbezirks-Level-Disable):**

**Given** pre-2017-Wahl ohne Stimmbezirks-Geometrie
**When** User wählt Stimmbezirks-Level
**Then** Dropdown-Item ist disabled mit Hint „Stimmbezirks-Geometrie nicht verfügbar vor 2017" und Level snapt auf Bezirk

**AC-6 (Compare-Mode-Integration):**

**Given** Compare-Mode (Story 1.27)
**When** User vergleicht zwei Adressen
**Then** beide Wahl-Sections sind same-level-locked
**And** Wahltyp-Tab gilt für beide Adressen gleich
**And** Delta-Chips zeigen A vs B auf gewähltem Level

**AC-7 (Editorial-Sprache):**

**Given** Memory `feedback_no_lebenswert` + Compare-Editorial-Profile
**When** Texte rendern
**Then** keine Wertungs-Begriffe („Hochburg", „rote/blaue Bezirke", „Wahl-Sieger")
**And** Disclaimer-Section: „Daten beschreiben Stimmenanteile, keine Bewertung"
**And** Forbidden-Token-Lint (analog Story 5.8) blockt Wertungs-Tokens im Code

## Tasks/Subtasks

- [ ] T1: `src/lib/data/partei-farben.ts` zentrale Color-Tokens mit WCAG-Kontrast-Validation
- [ ] T2: `src/lib/components/atlas/wahl-section.svelte` Hauptkomponente (Tabs + Dropdown + Bars + Sparkline + Delta-Chips)
- [ ] T3: Sub-Komponenten: `wahl-stacked-bar.svelte`, `wahl-sparkline.svelte`, `wahl-delta-chips.svelte`, `wahl-direktmandat-annotation.svelte`
- [ ] T4: Screenreader-Table-Fallback-Komponente `wahl-result-table-a11y.svelte`
- [ ] T5: Briefwahl-Badge + Confidence-Hairline (Konsumiert Story 6.5)
- [ ] T6: Wiring in `inspector-panel.svelte` zwischen Compare-Trigger und Map-Legend
- [ ] T7: Vitest-Browser-Tests pro Sub-Komponente (Coverage ≥ 80%)
- [ ] T8: E2E Playwright-Test wahl-flow.e2e.ts (4 Cases: Level-Switch / Wahltyp-Switch / Compare-Mode / Brandenburg-Guard)
- [ ] T9: Editorial-Disclaimer-Section + Forbidden-Token-Lint-Integration

## Dev Notes

- **Tabs + Select:** bits-ui-Komponenten reuse, gleicher Style wie restlicher Inspector.
- **Stacked-Bar:** Tailwind-only mit `width: {anteil}%`-Inline-Styles. Kein extra Chart-Lib. Performance + Bundle-Size.
- **Sparkline:** LayerChart-Reuse aus Klima-Sparkline (Story 1.9). yBaseline=null wichtig.
- **Delta-Chip-Color:** NEUTRAL (kein grün/rot), nur Vorzeichen + Plex-Mono-Wert. Kein „besser/schlechter"-Framing.
- **Server-Load-Erweiterung:** `inspector-panel.svelte`-Server-Load lädt `getWahlbezirksByYear` + Top-3-Wahlen-Aggregate pro Level. ~12 Query-Aufrufe parallel, < 100ms total.
- **Compare-Mode-Wiring:** `comparisonAddress`-Context aus Story 1.27 erweitern um `wahlState: { typ, level }`.
