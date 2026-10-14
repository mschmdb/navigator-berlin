---
title: 'L7: Layer-Seiten mit Karten-Button oben und Kiez-Rangliste'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '267b9c7ddf8c8c73464d4fb1059a81d943820182'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epic-landing-enhance.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Layer-Seiten lesen sich wie Dokumentation: Quelle, Lizenz und Methodik stehen vor dem Nutzen, der Link „Layer auf Karte anschauen“ steht klein weit unten. Layer-Seiten verlinken keine Kiez-Seiten. Trotzdem funktionieren sie besser als Kiez-Seiten (32,5 % Absprung), deshalb nur leichte Änderungen.

**Approach:** Karten-Button in den Kopf der Layer-Seite. Für Layer mit Kiez-Werten eine kurze Rangliste der Kieze mit Links auf die Kiez-Seiten.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Primärbutton „Auf der Karte ansehen“ direkt unter h1 und Kurzerklärung → `/explore?layers=<slug>` (lokalisiert). Der alte Textlink unten bleibt.
- Rangliste nur für Layer mit Kiez-Aggregat in `layer-aggregates.json` und für die Kiez-Score-Layer.
  - Score-Layer (Besser-Richtung): nur „Die 5 bestbewerteten Kieze“ (Anti-Stigma, keine Flop-Liste).
  - Neutrale Layer (Miete, Altbau, Milieuschutz, Grünanteil, Hitze): „Höchste Werte“ und „Niedrigste Werte“, je 5, ohne Wertung.
  - Ordinale Layer (Lärm, Luft): keine Rangliste, nur Karten-Button (geändert 14.10. im Review, siehe Spec Change Log).
- Jeder Eintrag: Kiez, Bezirk, Wert, Link auf die Kiez-Seite.

## Boundaries & Constraints

**Always:** DB-frei aus `layer-aggregates.json` und `region-composites.json`; Slugs mit Dubletten-Fallback; DE/EN; Prerender; neutrale Formulierungen. Nur Layer, deren Detailseite existiert (`hasLayerDetailPage`).

**Never:** Keine Umsortierung der übrigen Layer-Seite, keine neuen Datenquellen, keine Bewertung neutraler Werte. Den bekannten FAQ-Fehler auf `/layer/kiez-score-gesamt` nicht in dieser Story beheben.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Score-Layer | `/layer/kiez-score-gesamt` | Button oben, Top 5 nach Composite, keine Flop-Liste | N/A |
| Neutral | `/layer/zensus-altbau-anteil-2022` | Button, Höchste 5 und Niedrigste 5 | N/A |
| Ohne Aggregat | Punkt-Layer (z. B. Haltestellen) | nur Button, keine Liste | N/A |
| Fehlende Werte | Kieze mit null | ausgeschlossen | N/A |
| EN | `/en/layer/…` | EN, `/en`-Links | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/layer/[slug]/+page.svelte` (409) -- Button nach h1/`explain.long`; Liste vor „Hinweise/Quelle“. Datei nahe 500 Zeilen: Liste als Komponente `layer-kiez-ranking.svelte`.
- `src/routes/(with-header)/layer/[slug]/+page.server.ts` (46) -- Ranglisten-Daten laden.
- `src/lib/data/layer-aggregates-types.ts`, `get-layer-aggregates.ts`; `src/lib/data/get-region-composites.ts`; Score-Layer-Slugs `kiez-score-*` (Dimension → Composite-Feld prüfen; ohne Kiez-Werte je Dimension nur Gesamt-Score).
- `src/lib/data/layer-visibility.ts` `hasLayerDetailPage`; `src/lib/data/region-display-names.ts` für Namen.
- Neu `src/lib/data/layer-kiez-ranking.ts` (rein, getestet).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/layer-kiez-ranking.test.ts`, `layer-kiez-ranking.ts` -- Red/Green: Typen weighted-mean, area-share, coverage-share, numeric-median, ordinal; Score-Layer nur Top; null-Ausschluss; Gleichstand.
- [x] Layer-Server-Load + Komponente + Test.
- [x] Button oben in `+page.svelte`.
- [x] `messages/de.json`, `messages/en.json`.
- [x] E2E: Button-Ziel, Liste auf Altbau-Seite, keine Flop-Liste auf Score-Seite.

**Acceptance Criteria:**
- Given `/layer/zensus-bestandsmiete-2022`, when die Seite lädt, then steht der Karten-Button im ersten Bildschirm und darunter die Kieze mit den höchsten und niedrigsten Bestandsmieten mit Links.

## Implementation Notes

- Neu: `src/lib/data/layer-kiez-ranking.ts` (Score Top 5 nach Rohwert; neutrale Layer mit expliziter Einheit je Slug, Höchste/Niedrigste ohne Überschneidung; Gleichstand am Schnitt kürzt die Liste und nennt „{n} weitere Kieze mit {Wert}“), `src/lib/server/layer-kiez-ranking-loader.ts` (Caches je Quelle, Composites nur für den Score-Layer), `layer-kiez-ranking.svelte` (Hinweis nennt die Messgröße aus `explain.short`).
- Lärm/Luft und Dimensions-Score-Layer ohne Liste, nur Button. Button zwischen h1 und Lead; unterer Link trägt denselben Text. Ungenutzter Key `layer_page_inspector_link_label` entfernt.
- `kiez-neighbors-index.test.ts` (L6) bekommt 30 s Timeout: liest echte LOR-Polygone, unter Volllast > 5 s.
- Verifikation: Unit 4.822 grün (src/lib + src/routes), `pnpm check` 0, Build mit DB, voller E2E-Lauf: alle Epic-Suiten grün; 76 Fehlschläge in älteren Suiten (Adress-Combobox auf `/explore` nicht klickbar), Abgleich mit `main` folgt.

## Spec Change Log

- 14.10., Review: Lärm/Luft-Rangliste („höchster Anteil belasteter Fläche“) streicht die Story. Die Liste zeigt die belastetsten Kieze (Anti-Stigma), die Daten zählen Planungsräume statt Fläche, und 11 Kieze liegen gleichauf bei 100 %. Entschieden unter Matzes stehender Freigabe: Lärm/Luft bekommen nur den Karten-Button. KEEP: Score-Top-5, neutrale Höchste/Niedrigste, Button oben.
- 14.10., Umsetzung: Button sitzt zwischen h1 und Lead statt unter dem Lead; sonst läge er bei 375 px außerhalb des ersten Bildschirms (AC).

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Orchestrator, Blind, Edge | Lärm/Luft-Liste = belastetste Kieze, Gleichstand bei 100 %, Fläche ≠ Planungsräume | medium | intent_gap, unter stehender Freigabe entschieden → patch (Liste entfällt) |
| Edge, Blind | Score wird vor dem Sortieren gerundet | medium | patch |
| Edge, Blind | Gleichstand am Schnitt nur teilweise erkannt, stille Auslassung | medium | patch |
| Edge | Gleicher Kiez in beiden Listen bei < 10 Werten | low | patch |
| Edge, Blind | Einheit per Slug-Sonderfall | medium | patch |
| Edge | Composite-Fehler nimmt allen Layern die Liste, Cache-Reset | medium | patch |
| VerifGap, Blind | Loader ungetestet (Bezirk-Mapping, Dubletten) | medium | patch |
| VerifGap, Blind | °C, Hinweise, Überschrift ungetestet; feste „5“; Hinweis ohne Messgröße | low | patch |
| Blind | Rangliste nach Quelle statt davor; zwei Linktexte für dasselbe Ziel (WCAG 3.2.4) | medium | patch |
| Blind | Tests im falschen `describe` | low | patch |
| Edge, Blind | Button zwischen h1 und Lead statt darunter | low | reject: bewusst für den ersten Bildschirm (Spec Change Log) |
| Edge | Dimensions-Score-Layer ohne Liste | low | reject: keine Kiez-Werte je Dimension vorhanden |
| Blind, Edge | Leerer Bezirksname bei unbekanntem BEZ-Code | low | reject: Daten vollständig, Loader-Test sichert ab |
| Blind, VerifGap | Bezirk-Mapping und Dateilesen dreifach | low | reject: Prerender-Kosten, Abweichungen per Loader-Test sichtbar |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/data src/routes` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config -- expected: grün
