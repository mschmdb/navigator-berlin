---
title: 'gh-160: Data Stories, Handschrift festlegen'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: 'de175ab7b6a4e0f465073769a23a5572e73680ef'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Data Stories (Epic #159) brauchen feste Gestaltungsregeln. Sonst sieht jede Visualisierung anders aus, und keine wirkt wie navigator.

**Approach:** Ein Kapitel `docs/DESIGN.md` hält die Regeln fest. Sie stammen aus den Skizzen vom 28.–31.10. (Hub `topics/navigator-berlin/datenkunst-idee.md`). Ein typisiertes Token-Modul setzt die Regeln für den Code um. Jost (OFL) liegt selbst gehostet bereit. Die Lizenzseite nennt die Schrift.

Freigabe: Matze 31.10. pauschal („mach das alles in einem Rutsch“). Er prüft die Regeln danach.

## Boundaries & Constraints

**Always:**
- Regeln aus den Skizzen-Entscheidungen, nicht neu erfunden:
  - Warmer Papierton als Fläche, ein einfacher Rahmen, keine simulierten Papiertexturen (kein Korn, keine Flecken, keine Vignette).
  - Eine Farbe hat innerhalb einer Serie genau eine Bedeutung. Grün zeigt Grün.
  - Nur zwei Linienstärken pro Serie.
  - Kleine Zeichen unter 120 px vereinfachen: ohne Haarlinien und Punkte.
  - Sichtbar sind nur Bezirk, Kiez oder Menschen. Planungsräume bleiben Rechengrundlage.
  - „Bewohner“ statt „Dichte“.
  - Eine Aussage pro Bild.
  - Rang-Skalen nur bei großer Spanne, sonst absolute Skala.
  - Fußzeile mit „navigator.berlin“ links und der Quellenzeile rechts, immer mit „© OpenStreetMap-Mitwirkende“ / „© OpenStreetMap contributors“, sobald OSM-Daten drin sind.
  - Legende nennt Form und Bedeutung („Kreis: Grünversorgung“).
  - Schrift Jost in der Visualisierung, die Seite selbst bleibt IBM Plex.
  - Schreibweise normal (deutsche Groß- und Kleinschreibung). Ausnahme: Die Serie „Punkt, Linie, Kiez“ schreibt durchgehend klein, als Bauhaus-Zitat.
- Paletten pro Serie als Tokens:
  - Gemeinsam: Papier und Tinte.
  - „Punkt, Linie, Kiez“: Kreis Grün #3a8a55 (Grünversorgung), Quadrat Rot #cf4128 (Altbau), Dreieck Gelb #efbd2c (Lärm), Donut Blau #24579e (Clubs), Balken und Linien Tinte.
  - „Berliner Signete“: Patina #4f7152 (Grün), Gold #b88a2e (Clubs), Hitze Tinte → Ochsenblut #5e2b22 → Rot #9e2a2b, Tönung #d4c39e.
- Ein Test erzwingt: keine Farbe doppelt belegt innerhalb einer Serie, Tinte auf Papier mindestens 7:1 Kontrast, alle Werte gültige Hex-Farben.
- DE-Kapitel. Kein „Kunst“-Etikett.

**Never:** Keine Komponente, keine Route, kein Rendering (kommt mit #162/#163). Keine Änderung an den App-Tokens in `src/app.css` außer `@font-face` für Jost. Keine Fraktur, kein Schwarz-Weiß-Rot.

</frozen-after-approval>

## Code Map

- `docs/DESIGN.md` (neu): Kapitel „Berlin Data Stories: Handschrift“. In `docs/INDEX.md` verlinken.
- `src/lib/stories/tokens.ts` (neu): `STORY_PAPER`, `STORY_INK`, `STORY_FONT = "'Jost', 'IBM Plex Sans', sans-serif"`, `STORY_SERIES` als `Record<'punkt-linie-kiez' | 'signete', { colors: Record<string, { hex: string; meaning: string }>; lineWidths: readonly [number, number] }>`, `SMALL_MARK_PX = 120`. Werte aus `design-proposals/kunst-2026-10/grammatik-shapes.mjs` und `behrens.mjs` (lokal, nicht im Repo; Werte stehen oben im Frozen-Block). Papier: #efe6d2, Tinte #26221e.
- `src/lib/stories/tokens.test.ts` (neu): Regeln aus dem Frozen-Block. Kontrast über eine kleine lokale WCAG-Formel oder ein vorhandenes Util (vorher in `src/lib` nach `contrast` suchen).
- Jost: `pnpm add -D @fontsource-variable/jost`, die Latin- und Latin-ext-woff2 nach `static/fonts/jost-latin-var.woff2` und `jost-latin-ext-var.woff2` kopieren, `@font-face` in `src/app.css` nach dem Plex-Muster (Zeilen 6–35). Danach kann die Abhängigkeit bleiben (Quelle nachvollziehbar).
- `src/routes/(with-header)/lizenzen/+page.svelte`: Jost (OFL 1.1, github.com/indestructible-type/Jost) neben IBM Plex (ab Zeile ~460) eintragen, im selben Markup-Muster, DE/EN wie die Plex-Zeile.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/stories/tokens.test.ts` dann `tokens.ts`: Tokens nach Frozen-Block.
- [x] Jost-Dateien und `@font-face`.
- [x] Lizenzseite.
- [x] `docs/DESIGN.md` + `docs/INDEX.md`.

**Acceptance Criteria:**
- Given `tokens.ts`, when der Test läuft, then keine Farbe doppelt pro Serie, Kontrast Tinte/Papier ≥ 7:1.
- Given `/lizenzen` und `/en/lizenzen`, then steht Jost mit Lizenz und Quelle dort.
- Given `docs/DESIGN.md`, then enthält es jede Regel aus dem Frozen-Block, ohne em-dash und ohne „·“.

## Implementation Notes

- Jost aus `@fontsource-variable/jost` 5.3.0 (exakt gepinnt), woff2 nach `static/fonts/`, `unicode-range` aus `wght.css`.
- Linienstärken Signete 1,2 und 3 (Hub, Signet-Regeln 29.10.); „Punkt, Linie, Kiez“ bleibt Platzhalter für #163.
- Tests rot (fehlendes Modul) dann grün; 27 Tests in `src/lib/stories` und `src/lib/design`.

## Spec Change Log

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | VG | Jost-Lizenzhinweis ohne Test | low | Patch: positive Assertions in `typography-guards.test.ts`. |
| 2 | VG, BH | `@font-face`-URLs ungeprüft, woff2 untracked | medium | Patch: Existenz-Test für alle `url('/fonts/…')`; Dateien im Commit. |
| 3 | ECH | `unicode-range` weicht von Fontsource ab | low | Patch: Werte aus `wght.css`. |
| 4 | ECH, BH | Fontsource-Version driftet, Herkunft nicht reproduzierbar | low | Patch: exakt gepinnt, Version im Kommentar. |
| 5 | alle | Testname „ab 120 px“ | low | Patch. |
| 6 | alle | Tinte-Test redundant | low | Gelöscht. |
| 7 | ECH, BH | `toenung` ohne echte Bedeutung | low | Patch: „Leere Wabe“. |
| 8 | ECH, BH | Tinte trägt Daten, Widerspruch zu DESIGN.md | low | Patch: DESIGN.md klärt Tinte als Grundfarbe, Daten nur über Form. |
| 9 | BH | Gelb, Gold, Tönung unter 3:1 auf Papier | medium | Entscheidung über Kontur gehört zur Komponente; in DESIGN.md „Offen“ für #163, plus A11y-Abschnitt. Defer. |
| 10 | BH | em-dash in `docs/INDEX.md` | low | Patch. |
| 11 | BH | Lizenztext ordnet OFL nur Plex zu | low | Patch: Text nennt beide Schriften. |
| 12 | VG | Signete-Bedeutungen nicht im Test gepinnt | low | Change-Detector ohne Nutzen. Abgelehnt. |
| 13 | BH | Spec unvollständig | false | Wird beim Abschluss gefüllt. |
| 14 | BH | Legenden-Form nicht in Tokens kodiert | low | Gehört zur Komponente (#163). Abgelehnt. |

## Verification

Ergebnis 31.10.: 27 Tests grün, `pnpm check` 0 Fehler. Keine UI-Änderung außer Lizenztext, darum keine Design-Prüfung.

**Commands:**
- `pnpm vitest run src/lib/stories` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
