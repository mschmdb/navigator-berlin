---
title: 'gh-173: Punkt, Linie, Kiez als Gesamtplakat aller 12 Bezirke'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '8aaca1a1b33ddabc8fa7a082279ffb5fb81b0995'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md', '{project-root}/docs/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Einzelplakate zeigen je einen Bezirk. Der eigentliche Reiz ist der Vergleich der Bezirke. Sebastian Lammers hat das auf Bluesky angeregt: „all districts in a grid, one legend … would look great on a wall“.

**Approach:** Ein zusätzliches Vektor-PDF mit allen 12 Bezirken im Raster und einer gemeinsamen Legende, auf DE und EN. Es entsteht aus derselben Geometrie wie Komponente und Einzelplakate. Der Download sitzt auf der Beitragsseite neben dem Einzel-Download und zählt in Plausible.

Freigabe: Matze hat die Idee am 31.10. selbst geteilt. Ich habe angefangen, ohne die Spec vorzulegen, Matze prüft vor dem Merge.

## Boundaries & Constraints

**Always:**
- Format 4:5 wie die Einzelplakate (400 × 500 mm), Papier, Rahmen und Jost nach `docs/DESIGN.md`. Die Serie schreibt klein.
- Raster 3 Spalten × 4 Zeilen, alphabetisch. Unter jeder Komposition steht der Bezirksname, darunter keine Werte. Die Formen erklärt eine gemeinsame Legende ohne Werte.
- Jede Komposition ist exakt die große Geometrie, verkleinert. Die Linien liegen hinten.
- Die Fußzeile nennt alle Quellen mit Stand, „© OpenStreetMap-Mitwirkende“ / „contributors“, den MIT-Hinweis und navigator.berlin. Das ist dieselbe Quelle wie beim Einzelplakat.
- Route `/stories/punkt-linie-kiez/{de|en}/alle-bezirke.pdf`, prerendert. Kein Konflikt mit Bezirks-Slugs, denn `alle-bezirke` ist kein Bezirk.
- Ein Link auf der Beitragsseite unter der Auswahl: „Alle 12 Bezirke als PDF“ / "All 12 districts as PDF", mindestens 24 px groß, mit `download`-Attribut. Sein Plausible-Event `Stories PDF Download` hat die Props `{ serie: 'punkt-linie-kiez', bezirk: 'alle', sprache }`.
- Ein Satz im Beitrag DE/EN unter „Zum Ausdrucken“ nennt das Gesamtplakat.

**Never:** Keine Werte auf dem Gesamtplakat, keine Änderung an den Einzelplakaten, keine Rasterbilder.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE | `/stories/punkt-linie-kiez/de/alle-bezirke.pdf` | PDF, 12 Kompositionen, deutsche Legende | N/A |
| EN | `…/en/alle-bezirke.pdf` | englische Legende und Fußzeile | N/A |
| Unbekannte Sprache | `…/fr/alle-bezirke.pdf` | 404 | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/stories/punkt-linie-kiez/poster-svg.ts`:
  - `posterSvg`, `wrapText` und die Legenden-Glyphen in Zeilen ~45–65.
  - Neu `overviewPosterSvg(bezirke, sources, locale)` im selben Modul oder einer Schwesterdatei. Die gemeinsamen Teile (Glyphen, Fußzeile, Rahmen) nutzen beide Plakate, kein Kopieren.
- `src/lib/stories/punkt-linie-kiez/composition-svg.ts` (`compositionElements`): Kompositionen ohne Werte.
- `src/lib/stories/punkt-linie-kiez/legend.ts`: Legendentexte. Für das Gesamtplakat ohne Wertzeile.
- `src/lib/server/stories/poster-pdf.ts` (`renderPosterPdf`): unverändert wiederverwenden.
- `src/routes/(with-header)/stories/punkt-linie-kiez/[lang]/[slug].pdf/+server.ts`:
  - `entries` um `alle-bezirke` je Sprache ergänzen.
  - Bei Slug `alle-bezirke` das Gesamtplakat liefern. Alternativ eine eigene statische Route `alle-bezirke.pdf`, die vor `[slug]` greift.
- `src/lib/components/stories/punkt-linie-kiez-auswahl.svelte`: Download-Bereich.
- `_content/stories/2026-10-31-punkt-linie-kiez-bezirke{,.en}.md`: ein Satz.
- `messages/de.json`, `messages/en.json`.

## Tasks & Acceptance

**Execution:**
- [x] `overviewPosterSvg` + Test: 12 Kompositionen, Namen, Legende ohne Werte, Quellen, OSM, Linien vor Formen in jeder Komposition, keine Elemente außerhalb des Blatts.
- [x] Route + Test: `application/pdf`, `%PDF`, 404 für fremde Sprache, `entries` enthält 2 Gesamtplakate.
- [x] Download-Link + Test (Event-Props).
- [x] Beitragstext DE/EN, Messages.

**Acceptance Criteria:**
- Given das PDF, when als PNG gerendert und angesehen, then zeigt es 12 lesbare Kompositionen mit Namen, eine Legende und eine Fußzeile, nichts abgeschnitten.
- Given `pnpm check`, then 0 Fehler. Given `pnpm exec prettier --check src`, then sauber.

## Implementation Notes

- Rahmen, Clip und Fußzeile sind jetzt gemeinsam für Einzel- und Gesamtplakat (`posterFrame`, `clipDefs`, `posterFooter`), Einzelplakat unverändert. `renderSvgPdf` als gemeinsamer PDF-Helfer.
- Nachkontrolle: Die Route exportierte `OVERVIEW_SLUG`, SvelteKit lehnt das ab (500 im Dev-Server, hätte den Build gebrochen). Export entfernt, Build prerendert beide Gesamtplakate.
- Tests mit der Implementierung geschrieben, kein belegter Red-Lauf.

## Spec Change Log

## Review Triage Log

## Verification

Ergebnis 31.10.: 144 Tests grün, `pnpm check` 0 Fehler, Prettier sauber, `vite build` ok mit 2 Gesamtplakaten. PDF DE gerendert und angesehen.

**Commands:**
- `pnpm vitest run src/lib/stories src/lib/components/stories src/lib/server/stories "src/routes/(with-header)/stories"` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
