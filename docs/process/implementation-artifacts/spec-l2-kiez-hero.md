---
title: 'L2: Kiez-Hero mit Fakten, Umriss, Stärke und Karten-Button'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '0a74ae552ee6d7c38b6ff3d974b970dcd61c6a62'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/docs/process/implementation-artifacts/landing-investigation-l2-l6.md'
  - '{project-root}/docs/process/implementation-artifacts/spec-l5-bezirksseite-karte-liste.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kiez-Seiten verlieren die meisten Such-Einsteiger nach wenigen Sekunden. Der erste Bildschirm zeigt Eyebrow, h1 und einen Lead, der h1 wiederholt und mit „Daten zu … auf dieser Seite“ endet. Score steht 1,5 Bildschirme tiefer, Rang erst im letzten Link, ein Weg zur Karte fehlt.

**Approach:** Der Kiez-Hero übernimmt das Muster der Bezirksseite (L5): Fakten, statischer Umriss, ein Satz zur Stärke des Kiezes und ein Button zur Karte mit Ortsfokus.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Eyebrow „Kiez in {Bezirk}“ (Link auf die Bezirksseite), h1 Kiezname.
- Faktenzeile wie L5: Einwohner:innen, Fläche in km², Stand, Kiez-Score mit Rang („Platz X von 143“, im unteren Viertel `formatRank`-Wortlaut).
- Statische SVG: Bezirk mit allen Kiezen hellgrau, dieser Kiez in Akzentfarbe hervorgehoben. Nicht interaktiv (`role="img"`, Beschreibung „Lage von {Kiez} im Bezirk {Bezirk}“).
- Stärke-Satz: die Score-Dimension mit dem besten Berlin-Rang, z. B. „Stärke: Grün & Hitze, Platz 12 von 143 in Berlin.“ Nur wenn diese Dimension im oberen Viertel liegt; sonst entfällt der Satz. Keine Schwächen im Hero (Anti-Stigma).
- Primärbutton „{Kiez} auf der Karte“ → `/explore?kiez=<slug>` (lokalisiert).
- Der Lead-Satz mit Wiederholung und Meta-Satz entfällt; der bestehende Score-Block weiter unten bleibt.

## Boundaries & Constraints

**Always:** `region-outline-svg.ts` aus L5 wiederverwenden (inkl. Vereinfachung); Pfade so klein halten, dass Kiez-HTML nicht über 100 KB wächst. Farben 3:1 gegen Hintergrund. Builds ohne DB funktionieren (ohne Score, Rang, Stärke). DE und EN. Testids `kiez-hero`, `kiez-score`, `kiez-steckbrief`, `kiez-profile` bleiben. 375 px: h1, Fakten, Umriss und Button ohne Scrollen sichtbar.

**Never:** Kein MapLibre, keine Änderung an `/explore`, Title/Meta (L3) oder an der Bezirksseite. Neutrale Werte (Miete, Altbau) nicht als Stärke werten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal | `/kiez/reuterstrasse`, DB | Eyebrow, h1, Fakten mit Score und Rang, Umriss im Bezirk, Stärke-Satz falls oberes Viertel, Button | N/A |
| Keine Stärke | beste Dimension nicht im oberen Viertel | kein Stärke-Satz | N/A |
| Unteres Viertel | Composite-Quartil 4 | `formatRank`-Wortlaut statt „Platz X“ | N/A |
| Ohne DB | kein Score/Rang | Fakten ohne Score, kein Stärke-Satz, Umriss und Button da | N/A |
| Dublette | `heerstrasse-spandau` | Umriss im Bezirk Spandau, Button `?kiez=heerstrasse-spandau` | N/A |
| EN | `/en/kiez/reuterstrasse` | Texte EN, Links mit `/en` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/kiez-hero.svelte` (355) -- Kopfbereich neu nach Muster `bezirk-hero.svelte` (L5); Steckbrief/Prosa/Score-Block ggf. in `kiez-details.svelte` auslagern wie L5 (`bezirk-details.svelte`), Datei unter 500 Zeilen.
- `src/routes/(with-header)/kiez/[slug]/+page.server.ts` (272) -- liefert `profile.geometry`, `comparison` (Dimension, rang, quartil, total), `compositeRank` (L3: `toCompositeRank` mit `quartil`); Bezirks-Kiez-Geometrien wie in L5 (`buildKiezeWithGeometry` in `get-kieze-in-bezirk.ts`) laden.
- `src/lib/seo/region-outline-svg.ts` (L5) -- Pfade + Vereinfachung.
- `src/lib/seo/profile-meta.ts` `formatKm2`; `src/lib/data/rank-format.ts` `formatRank`; `inspector-panel/internal/kiez-score-display.ts` `dimensionLabel`.
- `src/lib/utils/url-state.ts` `buildRegionFocusHref` + `localizedHref`.
- Neu `src/lib/data/kiez-strength.ts` (rein, getestet): beste Dimension aus `comparison`, nur Quartil 1.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/kiez-strength.test.ts`, `kiez-strength.ts` -- Red/Green: beste Dimension, Gleichstand (erste nach fester Reihenfolge), kein oberes Viertel → null, leere Liste → null.
- [x] `kiez/[slug]/+page.server.ts` -- Bezirks-Kiez-Geometrien für den Umriss.
- [x] `kiez-hero.svelte` + Test -- Eyebrow-Link, Fakten, Umriss, Stärke, Button DE/EN; Anti-Stigma.
- [x] `kiez/[slug]/+page.svelte` -- Struktur, Lead-Satz entfernen.
- [x] `messages/de.json`, `messages/en.json`.
- [x] E2E `tests/e2e/kiez-landing.e2e.ts` -- 375 px erster Bildschirm, Button führt zu `/explore?kiez=` mit Ortskarte, EN-Präfix, HTML-Größe < 100 KB.
- [x] Screenshots Desktop + 375 px unter `test-results/` und ausgewählte unter `docs/process/implementation-artifacts/screenshots/kiez-landing/`.

**Acceptance Criteria:**
- Given `/kiez/prenzlauer-berg-suedwest` auf 375 px, when die Seite lädt, then sind Einwohnerzahl, Score, Umriss und Karten-Button ohne Scrollen sichtbar.
- Given eine Kiez-Seite im unteren Viertel, when sie rendert, then steht im Hero kein „Platz X von 143“ und kein Stärke-Satz.

## Implementation Notes

- Neu: `kiez-hero.svelte` (nur Kopf), `kiez-location-map.svelte` (`role="img"`, `non-scaling-stroke`), `src/lib/data/kiez-strength.ts` (nur `COMPOSITE_DIMENSIONS`, Quartil 1), `buildKiezContext` in `bezirk-kieze-view.ts`. Alter Hero per `git mv` als `kiez-details.svelte`, ohne zweite Composite-Zahl.
- Stärke nur bei Gesamt-Quartil 1-3 (null ausgeschlossen). Mobil Fakten zweispaltig, Score über volle Breite; geprüft mit Bottom-Quartile-Kiez `tempelhof-suedost` DE/EN bei 375×667.
- HTML-Gesamtgröße ~169 KB; Lage-Grafik < 8 KB (E2E). Rest ist das doppelt inline ausgelieferte Logo (deferred aus L5).
- `buildKiezeInBezirk` bleibt: kein Produktionsaufrufer, aber Paritätstest der Slugs hängt daran.
- E2E zu Score/Rang im ersten Bildschirm brauchen einen Build mit `DATABASE_URL`.
- Verifikation: Unit 2.816 grün, `pnpm check` 0, Build mit DB, E2E 61/61 (kiez-landing, bezirk-landing, i18n-profile-frame, i18n-d1, profile-meta-fakten, explore-region-focus).

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap | Stärke-Satz bei fehlendem Gesamt-Quartil (Anti-Stigma-Gate) | medium | patch |
| Blind, Edge | `kultur` kann Stärke werden, zählt nicht zum Score | low | patch |
| Blind | Sub-Pixel-Konturen mobil, 3:1 nicht erfüllt | medium | patch |
| Blind | Eyebrow-Linktext nennt Ziel nicht (WCAG 2.4.4) | medium | patch |
| Blind | Stand getrennt vom Einwohnerwert | low | patch |
| Blind | Mobil `grid-cols-3` bricht bei Bottom-Quartile/EN um | medium | patch (prüfen + E2E) |
| Blind | Score doppelt (Hero + Details) | low | patch |
| Blind, Edge | E2E prüft Score/Desktop-Erstbildschirm nicht, Testtitel irreführend | medium | patch |
| Blind | EN-Test Quartil 4 fehlt | low | patch |
| Blind | Log-Text „sibling-load failed“ veraltet | low | patch |
| VerifGap | `buildKiezeInBezirk` ohne Aufrufer | low | patch |
| Blind, VerifGap | Veraltete Kommentare, Variablenname `hero` | low | patch |
| Blind, Edge | HTML-Gesamtgröße > 100 KB, Task behauptet Prüfung | low | reject: Ursache ist das Logo (bereits deferred aus L5); Ist-Stand in Implementation Notes, Fix wäre Spec-Edit |
| Blind | Kein axe-Check | low | reject: kein axe im Repo, Kontraste nutzen bestehende Tokens |
| Edge | Rang verborgen, wenn Score fehlt aber Rang vorhanden | low | reject: Score und Rang stammen aus derselben DB-Ladung |
| Edge | „0,0 km²“ bei Flächen unter 5 ha | low | reject: kleinster Kiez ist um Größenordnungen größer |
| Blind | NaN-Composite-Test | low | reject: Composite ist in der DB numerisch |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/seo src/lib/components/atlas src/lib/data` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview auf 4173, `playwright test` mit temporärer Config (repo-Config ohne `reuseExistingServer`) -- expected: grün
