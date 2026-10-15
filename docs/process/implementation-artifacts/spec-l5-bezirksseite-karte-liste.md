---
title: 'L5: Bezirksseite mit Kiez-Karte, vollständiger Kiez-Liste und Karten-Button'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: 'e4c09acd474ef3dfed32ee299a7be9e16916a4a6'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/docs/process/implementation-artifacts/landing-investigation-l2-l6.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bezirksseiten haben die meisten Such-Impressionen (3 Monate) und einen hohen Absprung. Oben steht nur Text; die Kieze erscheinen erst nach dem FAQ und nur als Top 5; es gibt keinen Weg zur Karte mit diesem Bezirk. Suchende wollen Einwohnerzahl, Größe und Grenzen sehen.

**Approach:** Der erste Bildschirm zeigt Fakten, eine statische Karte des Bezirks mit seinen Kiezen und einen Button zur interaktiven Karte. Direkt darunter folgen alle Kieze des Bezirks als sortierbare Liste. Das FAQ rückt ans Ende.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Statische SVG-Karte, serverseitig gerendert, kein MapLibre (Epic-Entscheidung). Kieze eingefärbt nach Kiez-Score in den Klassen des Score-Layers (0/26/51/76, Palette `DIMENSION_RAMPS.gesamt`), ohne Score grau. Jeder Kiez in der SVG ist ein Link auf seine Kiez-Seite.
- Faktenzeile im Hero: Einwohner:innen, Fläche in km², Stand, Bezirks-Rang („Platz X von 12“, Anti-Stigma-Regel über `formatRank`).
- Primärbutton „{Bezirk} auf der Karte“ → `/explore?bezirk=<slug>` (lokalisiert).
- Kiez-Liste: alle Kieze, Spalten Name, Kiez-Score, Rang in Berlin; sortierbar nach Score (Standard, absteigend) und Name. Ohne Score: Strich, am Ende.
- Reihenfolge der Seite: Breadcrumb → Hero (h1, Fakten, SVG, Button) → Kiez-Liste → Prosa → Vergleich → Steckbrief → FAQ → Methodik.

## Boundaries & Constraints

**Always:** Barrierefrei: SVG mit `role="img"`/Titel oder als Gruppe von Links mit sprechendem Namen („Reuterstraße, Kiez-Score 41“); die Liste ist die gleichwertige Textalternative. Farben erfüllen 3:1 gegen den Hintergrund oder haben eine Kontur. Sortier-Buttons mit `aria-sort`. Prerender bleibt, Builds ohne DB funktionieren (ohne Scores grau, Liste nach Name). DE und EN. Testids aus der Inventur bleiben erhalten.

**Never:** Kein MapLibre auf der Seite, keine Änderung an `/explore`, an Title/Meta (L3) oder an Kiez-Seiten (L2). Keine neuen Datenquellen; neutrale Werte (Miete, Altbau) nicht als gut/schlecht färben.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal | `/bezirk/neukoelln`, DB vorhanden | Fakten, SVG mit allen Kiezen des Bezirks eingefärbt, Button, Liste aller Kieze nach Score | N/A |
| Ohne DB | Build ohne `DATABASE_URL` | SVG grau, Liste nach Name, kein Rang | N/A |
| Unteres Viertel | Bezirks-Rang Quartil 4 | `formatRank`-Wortlaut statt „Platz X“ | N/A |
| Dublette | Bezirk mit `heerstrasse-*` | Links mit disambiguiertem Slug | N/A |
| EN | `/en/bezirk/pankow` | Texte EN, Links mit `/en`-Präfix, Button auf `/en/explore?bezirk=pankow` | N/A |
| Sortieren | Klick „Name“ | Liste alphabetisch, `aria-sort` aktualisiert | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/bezirk/[slug]/+page.server.ts` (192) -- `tryLoadKieze` (80-144) lädt LOR + Composite; `pickTop(all, 5)` (138) entfernen, volle Liste plus Kiez-Geometrien des Bezirks liefern; `compositeRank` (L3 ergänzt `quartil`).
- `src/routes/(with-header)/bezirk/[slug]/+page.svelte` (149) -- Reihenfolge umbauen; FAQ aus `BezirkHero` herauslösen.
- `src/lib/components/atlas/bezirk-hero.svelte` (275) -- Hero verschlanken (Faktenzeile, SVG, Button); Steckbrief/FAQ ggf. in eigene Komponenten, Datei unter 500 Zeilen halten.
- `src/lib/components/atlas/bezirk-kieze-list.svelte` (57) -- zur sortierbaren Liste ausbauen (Testids `bezirk-kieze-list`, `bezirk-kieze-link` bleiben).
- Neu `src/lib/seo/region-outline-svg.ts` (rein, getestet): Polygone → SVG-Pfade mit äquirektangulärer Projektion (cos(Breite)-Korrektur), `@turf/bbox`; wird in L2 für den Kiez-Umriss wiederverwendet. Neu `bezirk-kieze-map.svelte` für die Darstellung.
- `src/lib/components/atlas/internal/dimension-ramps.ts`, `choropleth-family.ts:73`, `inspector-panel/internal/kiez-score-display.ts` (`scaleFor`) -- Farben/Klassen wiederverwenden.
- `src/lib/utils/url-state.ts` `buildRegionFocusHref` + `src/lib/i18n/localized-href.js` `localizedHref` -- Button-Link.
- `src/lib/data/rank-format.ts` `formatRank`; `src/lib/data/get-kieze-in-bezirk.ts` (`KiezRef`, `sortKieze`).
- Offener Punkt aus L1 (`deferred-work.md`): E2E, dass eine frühere Adressauswahl den Fokus nach Klick auf den Karten-Button nicht verdrängt.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/seo/region-outline-svg.test.ts`, `region-outline-svg.ts` -- Red/Green: Polygon/MultiPolygon → Pfad, Seitenverhältnis über cos(Breite), viewBox, leere Geometrie.
- [x] `bezirk/[slug]/+page.server.ts` -- volle Kiez-Liste + Geometrien; Test für Liste ohne DB (nach Name) und Dubletten-Slugs.
- [x] `bezirk-kieze-map.svelte` + Test -- Farben je Klasse, grau ohne Score, Links mit Namen, lokalisiert.
- [x] `bezirk-kieze-list.svelte` + Test -- Sortierung Score/Name, `aria-sort`, Strich ohne Score.
- [x] `bezirk-hero.svelte` + bestehender Test -- Faktenzeile, Rang mit Anti-Stigma, Button-Link DE/EN.
- [x] `bezirk/[slug]/+page.svelte` -- neue Reihenfolge, FAQ ans Ende.
- [x] `messages/de.json`, `messages/en.json` -- Texte.
- [x] E2E `tests/e2e/bezirk-landing.e2e.ts` -- erster Bildschirm (375 px) zeigt h1, Fakten, SVG und Button; Button führt zu `/explore?bezirk=` mit Ortskarte; nach vorheriger Adresswahl bleibt der Fokus aktiv; Liste sortierbar.
- [x] Screenshots Desktop + 375 px unter `docs/process/implementation-artifacts/screenshots/bezirk-landing/`.

**Acceptance Criteria:**
- Given `/bezirk/friedrichshain-kreuzberg` auf 375 px, when die Seite lädt, then sind Einwohnerzahl, Karte und Karten-Button ohne Scrollen sichtbar.
- Given die Kiez-Liste, when man per Tastatur sortiert, then ändert sich die Reihenfolge und der Screenreader hört die Sortierung.

## Implementation Notes

- Neue Bausteine: `src/lib/seo/region-outline-svg.ts` (Douglas-Peucker, Toleranz 1,2, ganzzahlig), `src/lib/data/bezirk-kieze-view.ts`, `get-kiez-composite-ranks.ts`, `score-class-color.ts` (`scoreClassStops`, auch von `layer-style-builder.ts` genutzt), `bezirk-kieze-map.svelte`, `bezirk-kieze-sort.ts`, `bezirk-details.svelte` (alter Hero ohne Kopf, per `git mv`).
- Karte ist `role="img"`, Links `tabindex="-1"`; die sortierbare Liste ist die zugängliche Alternative. Sortierwechsel per `announceGlobal`. Rang-Spalte nur, wenn Ränge vorhanden.
- HTML-Ziel < 100 KB nicht erreicht: Treptow-Köpenick 206 KB, Karte davon ~22 KB; ~79 KB entfallen auf das zweifach inline ausgelieferte Pixel-Logo (deferred).
- Mobil (375×667): Eyebrow, h1, Fakten, Karte (`max-h-40`) und Button im ersten Bildschirm (Screenshot `screenshots/bezirk-landing/mobile-375.png`).
- Verifikation: Unit 3.052 grün, `pnpm check` 0, Build mit DB, E2E 47/47 (bezirk-landing, i18n-profile-frame, profile-meta-fakten, explore-region-focus).

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge | Sortier-Buttons: `aria-label` verdrängt sichtbaren Text (WCAG 2.5.3) | medium | patch |
| Blind, Edge | `aria-label` auf `<span>` wirkungslos | medium | patch |
| Edge | Sortierwechsel ohne Ansage (AC) | medium | patch |
| Blind | Rang-Spalte nur Striche bei leerem `kiez_rank` | medium | patch |
| Edge | Sortierzustand überlebt Wechsel zwischen Bezirken | low | patch (`{#key}`) |
| Blind | Karte: ~20 Tab-Stopps, verdeckter Fokusrahmen, kleine Trefferflächen | medium | patch (Karte aus Tab-Reihenfolge, Liste ist Alternative) |
| Orchestrator | HTML 190-240 KB durch doppelte, unvereinfachte Pfade | medium | patch (Vereinfachung, Ziel < 100 KB) |
| Blind | H1 ohne Kontext „Bezirk“ | low | patch (Eyebrow) |
| Edge | km²-Formatierung doppelt | low | patch |
| Blind | `<article>` nur um Hero | low | patch |
| VerifGap | `getKiezCompositeRanks` ohne Test | medium | patch |
| VerifGap | Klassengrenzen doppelt zu `layer-style-builder` | medium | patch (Test) |
| Blind, Edge, VerifGap | `pickTop`, `bezirk_kieze_top5_label` tot | low | patch |
| Blind, VerifGap | E2E: FAQ-Check immer wahr, Screenshots ins Repo | low | patch |
| Blind | Hex-Farben umgehen Theme-Tokens | low | reject: gleiche Palette wie Score-Layer auf der Karte, Theme-Variante betrifft dort dasselbe |
| Blind | Legende zeigt immer alle Klassen | low | reject: Legende als vollständige Skala gewollt |
| Blind | Plural „1 Kieze“ | low | reject: jeder Bezirk hat mehrere Kieze |
| Edge | Leerer Pfad nach Rundung | low | reject: durch Vereinfachungs-Patch (Ringe < 3 Punkte verworfen) mit erledigt |
| Edge | viewBox mit Nullbreite | low | reject: Bezirks-/Kiez-Polygone haben immer Ausdehnung |
| Edge | doppelte Slugs im selben Bezirk | low | reject: Daten haben keine, `buildKiezSlugs` disambiguiert |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/seo src/lib/components/atlas src/lib/data` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, dann Preview auf 4173 und `playwright test` mit temporärer Config (repo-Config hat kein `reuseExistingServer`, webServer-Timeout 60 s zu kurz) -- expected: grün
