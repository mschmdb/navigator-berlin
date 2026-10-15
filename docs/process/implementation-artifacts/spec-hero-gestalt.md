---
title: 'QA-Fix: Hero von Kiez- und Bezirksseiten nach Gestalt-Prinzipien, Score auf der Bezirkskarte erklären'
type: 'bugfix'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'bd54a5bf88c0f2449ee7bfa9698b6be13378fabc'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/implementation-artifacts/spec-l5-bezirksseite-karte-liste.md'
  - '{project-root}/docs/process/implementation-artifacts/spec-l2-kiez-hero.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Matze, QA 15.10.: Von der Topline bis zum Karten-Button folgt der Hero keinen Gestalt-Prinzipien. Befund (Screenshots `screenshots/hero-gestalt/vorher/`): Die Karte steht zentriert, alles andere linksbündig. Sie schwebt mit gleichem Abstand zu Fakten und Button. Die Legende klebt zwischen Karte und Button. Die Zeile „Stand Ende 2024“ steht unter allen Fakten, gehört aber nur zur Einwohnerzahl. Der Score („54/ 100“) ist anders gesetzt als die übrigen Fakten. Der Stärke-Satz hängt lose zwischen Karte und Button. Auf der Bezirksseite versteht niemand ohne Vorwissen, was die Farben der Karte bedeuten.

**Approach:** Der Hero bekommt zwei klar getrennte Gruppen. Die Textgruppe enthält Eyebrow, h1, Fakten und Stärke. Die Kartengruppe ist eine gerahmte Karte mit Titel, Erklärung, Grafik, Legende und Karten-Button. Desktop zeigt beide nebeneinander, mobil untereinander. Kiez- und Bezirksseite nutzen dasselbe Muster.

**Entscheidungen (Empfehlung zur Freigabe):**
- **Gemeinsame Region:** Grafik, Titel, Erklärung, Legende und Karten-Button stehen in einem Rahmen (Rand `rule`, leicht abgesetzter Hintergrund, Innenabstand). Der Button sitzt unten im Rahmen, weil er die Karte öffnet.
- **Ausrichtung:** Alles linksbündig auf einer Kante. Die Grafik füllt den Rahmen in der Breite und wird nicht frei zentriert.
- **Anordnung:** Ab `md` zwei Spalten, links Text (ca. 55 %), rechts Kartenrahmen (ca. 45 %), oben bündig. Mobil erst die Textgruppe, dann der Kartenrahmen. Bei 375×667 bleiben h1, Fakten und Button im ersten Bildschirm (bisherige AC aus L2/L5).
- **Ähnlichkeit:** Alle Fakten nutzen dieselbe Typo für Label, Wert und Zusatzzeile. Der Score steht als „54 von 100“ in derselben Größe wie die anderen Werte. Zusatzzeilen (Stand, Rang) stehen im jeweiligen `dd` direkt unter ihrem Wert, nie als eigene Zeile unter allen Fakten.
- **Nähe:** Kleiner Abstand innerhalb einer Gruppe, deutlich größerer zwischen den Gruppen. Der Stärke-Satz (Kiez) gehört zur Textgruppe, direkt unter die Fakten.
- **Score-Erklärung auf der Bezirkskarte:** Titel im Rahmen „Kiez-Score der Kieze“. Darunter ein Satz: „Die Farbe zeigt den Kiez-Score von 0 bis 100. Er fasst Ruhe und Luft, Grün und Hitze, Mobilität, Versorgung und Wohnschutz zusammen. Höher ist besser.“ Dazu ein Link „So entsteht der Score“ auf `/methodik/kiez-score` (geändert 15.10. im Review, siehe Spec Change Log). Die Legende hat die Überschrift „Kiez-Score“. Das Fakten-Label „Bezirks-Rang“ wird zu „Rang im Kiez-Score“.
- **Kartenrahmen auf der Kiez-Seite:** Titel „Lage im Bezirk {Bezirk}“, ohne Score-Erklärung (die Grafik zeigt keine Scores).

## Boundaries & Constraints

**Always:** DE und EN. Barrierefrei: Rahmen als `<figure>` mit `<figcaption>` (Titel und Erklärung), Kontrast der Rahmenlinie 3:1, Link-Text sprechend, Tab-Reihenfolge Text → Erklärungs-Link → Karten-Button. Testids aus L2/L5 bleiben. Farben und Tokens aus dem bestehenden Design-System, keine neuen Hex-Werte. Dateien unter 500 Zeilen.

**Never:** Keine Änderung an Daten, Scores, Klassengrenzen, Meta-Daten, `/explore`, Kacheln (L4), Nachbarn (L6), Liste (L5). Kein MapLibre.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bezirk Desktop | 1280 px | Text links, Kartenrahmen rechts, oben bündig; Rahmen mit Titel, Erklärung, Link, Grafik, Legende, Button | N/A |
| Bezirk mobil | 375×667 | Text, dann Rahmen; h1, Fakten und Button ohne Scrollen sichtbar | N/A |
| Kiez Desktop/mobil | wie oben | Rahmen „Lage im Bezirk …“, Stärke-Satz in der Textgruppe | N/A |
| Ohne Score | Build ohne DB | Erklärung und Legende bleiben, Kieze grau („ohne Score“); Rang-Fakt entfällt | N/A |
| EN | `/en/bezirk/pankow` | Titel, Erklärung, Link (`/en/methodik/kiez-score`), Legende auf EN | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/bezirk-hero.svelte` (103) -- `<header>` mit Textblock, `BezirkKiezeMap`, Button; „Stand“-Absatz unter der `dl` → in Einwohner-`dd`; Rang-Label ändern; Zwei-Spalten-Grid ab `md`; Button in den Kartenrahmen.
- `src/lib/components/atlas/bezirk-kieze-map.svelte` (116) -- `<figure>` mit SVG und Legenden-`figcaption`; wird zum Rahmen mit Titel, Erklärung, Link, Legende (Überschrift „Kiez-Score“) und Slot/Prop für den Button. `max-h-40`/`sm:max-h-80` für die mobile Höhe prüfen.
- `src/lib/components/atlas/kiez-hero.svelte` (170) -- Fakten-`dl` (Score „54/ 100“ mit kleinerem „/ 100“) angleichen; Stärke-Satz unter die Fakten; Button in den Rahmen.
- `src/lib/components/atlas/kiez-location-map.svelte` (62) -- als Rahmen mit Titel „Lage im Bezirk …“.
- Gemeinsamer Rahmen: neue kleine Komponente `hero-map-card.svelte` (Titel, optionale Beschreibung, Inhalt, Aktion), von beiden Karten genutzt, statt das Muster zu doppeln.
- `messages/de.json`, `messages/en.json` -- neue Keys für Titel, Erklärung, Link, Legenden-Überschrift; `bezirk_hero_fact_rang` umbenennen.
- Tests: `bezirk-hero.svelte.test.ts`, `bezirk-kieze-map.svelte.test.ts`, `kiez-hero.svelte.test.ts`; E2E `tests/e2e/bezirk-landing.e2e.ts`, `kiez-landing.e2e.ts` (Erstbildschirm 375×667 und 1280×800).

## Tasks & Acceptance

**Execution:**
- [x] `hero-map-card.svelte` + Test -- Rahmen mit `figure`/`figcaption`, Titel, optionaler Beschreibung, Inhalt und Aktion.
- [x] `bezirk-kieze-map.svelte`, `bezirk-hero.svelte` + Tests -- Rahmen, Score-Erklärung mit Link, Legenden-Überschrift, Rang-Label, Stand im Einwohner-`dd`, Zwei-Spalten-Layout.
- [x] `kiez-location-map.svelte`, `kiez-hero.svelte` + Tests -- Rahmen „Lage im Bezirk …“, Score-Fakt in einheitlicher Typo, Stärke in der Textgruppe, Zwei-Spalten-Layout.
- [x] `messages/de.json`, `messages/en.json`.
- [x] E2E anpassen: Erstbildschirm mobil und Desktop, Erklärungs-Link-Ziel DE/EN.
- [x] Screenshots nachher unter `docs/process/implementation-artifacts/screenshots/hero-gestalt/nachher/` (Kiez und Bezirk, 375×667 und 1280×900).

**Acceptance Criteria:**
- Given `/bezirk/friedrichshain-kreuzberg` ohne Vorwissen, when man den Kartenrahmen liest, then erklären Titel und Satz, dass die Farbe der Kiez-Score von 0 bis 100 ist, und ein Link führt zur Erklärung.
- Given Kiez- oder Bezirksseite auf 1280 px, when man den Hero ansieht, then stehen alle Elemente auf einer linken Kante pro Spalte, die Kartengruppe ist eingerahmt und der Button sitzt im Rahmen.

## Implementation Notes

- Neu: `hero-map-card.svelte` (Rahmen mit `figure`/`figcaption`, `rule-strong`, `bg-bg-elevated`), `internal/has-renderable-outline.ts` (gemeinsame Bedingung für Hero und Karte).
- Hero bleibt in `max-w-3xl` mit derselben linken Kante wie Breadcrumb und Abschnitte; zwei Spalten ab `md` (Text, Rahmen ~22rem), Rahmen oben bündig mit der Eyebrow; Grafik `xMinYMid`.
- Bezirk: Titel „Kiez-Score der Kieze“, Erklärsatz mit den UI-Labels der Dimensionen, Link „So entsteht der Score“ → `/methodik/kiez-score`, Legendenüberschrift nur für Screenreader, Rang-Label „Rang unter den Bezirken“.
- Kiez: Score „58 von 100“ in gleicher Typo, Stärke in der Textgruppe, Rahmen „Lage im Bezirk …“ mit Satz „Dunkel: {Kiez}. Hell: die übrigen Kieze im Bezirk.“
- Screenshots: `screenshots/hero-gestalt/vorher/` und `nachher/`.
- Verifikation: Unit 2.883 grün, `pnpm check` 0, Build mit DB, Epic-E2E 84/84.

## Spec Change Log

- 15.10., Umsetzung: Rahmenlinie `rule-strong` statt `rule` (nur so 3:1). Mobil steht der Karten-Button im Rahmen über der Grafik (CSS-`order`), ab `md` unten; sonst läge er bei 375×667 außerhalb des ersten Bildschirms.
- 15.10., Review: Erklärungs-Link zeigt auf `/methodik/kiez-score` statt `/umwelt-infrastruktur-score`. Der Linktext „So entsteht der Score“ verspricht die Methodik; die andere Seite ist die Rangliste. KEEP: Linktext, Titel, Erklärsatz.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Orchestrator, Blind | Hero `max-w-5xl`, Rest `max-w-3xl`: linke Kanten springen | high | patch |
| Blind | Erklärungs-Link zeigt auf Ranking statt Methodik | medium | patch (Ziel `/methodik/kiez-score`, Spec Change Log) |
| Blind, Edge | Legendenüberschrift dreifach, feste ID | low | patch |
| Blind | Dimensionsnamen weichen von UI-Labels ab | low | patch |
| Blind | „Rang im Kiez-Score“ missverständlich; veraltete Kommentare; Passthrough-Key | low | patch |
| Edge | Rang-`dd` ohne `tabular-nums` | low | patch |
| Blind, Edge, VerifGap | Kiez-Rahmen ohne Erklärung, aria ohne Bezirk-Fallback, Titel-Fallback ungetestet | low | patch |
| Edge | Grafik bei Höhenbegrenzung zentriert | low | patch (`xMinYMid`) |
| Blind, Edge, VerifGap | `hasMap` dupliziert Kinder-Bedingungen, Fälle ohne passenden Umriss ungetestet | medium | patch |
| Blind, Edge | Typo-Test vergleicht `className` | low | patch |
| Edge, VerifGap, Blind | E2E: Oberkante ungeprüft, Stärke-Check leer erfüllbar | low | patch |
| Edge | Button mobil über der Grafik statt unten im Rahmen | low | reject: bewusst für den ersten Bildschirm (AC L2/L5), Spec Change Log |
| Edge | Rahmen `rule-strong` statt `rule` | low | reject: `rule` erreicht kein 3:1 (Spec verlangt 3:1) |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/components/atlas` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config: `bezirk-landing`, `kiez-landing`, `i18n-profile-frame` -- expected: grün

**Manual checks:**
- Vorher/Nachher-Screenshots nebeneinander prüfen.
