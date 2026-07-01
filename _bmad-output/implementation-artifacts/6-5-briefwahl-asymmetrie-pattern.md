# Story 6.5: Briefwahl-Asymmetrie-Pattern (dezenter Badge + Confidence-Hairline)

Status: backlog

<!-- Created 2026-05-18. Konsumiert von 6-3 (Inspector-Section) + 6-4 (Detail-Page). UX-Spec: NICHT modaler Disclaimer pro Wert. -->

## Story

As a politik-interessierter Bürger der Daten-Genauigkeit ernst nimmt,
I want klar verstehen können dass Stimmbezirks-Werte pre-2021 ohne Briefstimmen sind und Briefstimmen nur als Bezirks-Aggregat verfügbar,
so that ich Werte nicht überinterpretiere — ohne dass jeder Wert von modalem Disclaimer überdeckt wird.

## Quellen

- **Story 6.0 AC-4:** `ist_briefwahl_aggregat`-Flag im Schema.
- **Story 6.3 AC-3:** Briefwahl-Badge-Konsumption.
- **Story 1.29:** Methodik-Page für `#wahldaten-briefwahl`-Section.

## Acceptance Criteria

**AC-1 (Badge + Confidence-Hairline-Komponente):**

**Given** Briefwahl-Asymmetrie als methodisches Issue
**When** ich `src/lib/components/atlas/briefwahl-marker.svelte` als kleinen Inline-Badge implementiere (Plex-Mono-Text + Info-Icon, ~12px)
**Then** Badge ist konsumierbar via Boolean-Prop `showBadge` + Tooltip-Text-Prop

**AC-2 (Confidence-Hairline):**

**Given** Stacked-Bar-Komponente (Story 6.3)
**When** Briefwahl-Asymmetrie aktiv ist
**Then** Bars zeigen 4-6px schraffierte End-Zone (CSS-Hairline-Pattern, nicht JS)
**And** Hairline-Style ist accessibility-konform (kein color-only-meaning, kombiniert mit Badge-Text)

**AC-3 (Conditional-Rendering):**

**Given** das Pattern
**When** Wahl-Daten Briefstimmen pro Stimmbezirk vorliegen (2021+) ODER User-Level ≠ Stimmbezirk
**Then** Badge wird unterdrückt (kein-Op)
**And** Confidence-Hairline entfällt

**AC-4 (Methodik-Page-Section):**

**Given** Methodik-Page (Story 1.29)
**When** ich Section `#wahldaten-briefwahl` ergänze
**Then** ausführliche Erklärung der Briefwahl-Asymmetrie (warum pre-2021 nur Bezirks-Aggregat, wie ab 2021 pro Stimmbezirk, Datenquelle-Verweis)

**AC-5 (Tests):**

- Badge rendert nur bei `showBadge=true`
- Hairline-CSS-Class applied bei Confidence-Mode
- Accessibility: aria-describedby + Tooltip-Trigger keyboard-fähig

## Tasks/Subtasks

- [ ] T1: `briefwahl-marker.svelte` mit Badge + Tooltip
- [ ] T2: CSS-Hairline-Pattern in `wahl-stacked-bar.svelte` (Story 6.3 Erweiterung)
- [ ] T3: Methodik-Page-Section `#wahldaten-briefwahl`
- [ ] T4: Tests (Badge-Conditional + Hairline-Class + a11y)
