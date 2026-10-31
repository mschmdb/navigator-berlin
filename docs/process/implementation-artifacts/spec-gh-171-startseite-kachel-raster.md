---
title: 'gh-171: Startseite als Kachel-Raster'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '055de60f796851d6d63377a1cd8c17e06e3e01e4'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf dem Desktop wirkt die Startseite bieder. Titel, Satz und kleines Bild stehen bei allen vier Aufgaben gleich groß untereinander.

**Approach:** Die Aufgaben werden nach Mockup R (`design-proposals/startseite-2026-10/home-r.html`, lokal) zum Kachel-Raster:
- Eine breite Kachel „Eine Gegend prüfen“: Text 4/12, Finder-Bild 8/12.
- Ein Platz für die Data Stories (#162).
- Hitze und Wahlen als zwei gleich breite Kacheln mit eigenen Vorschauen im Format 6:5.
- Eine breite Kachel „Kieze und Bezirke vergleichen“ mit den 12 Bezirken als Links.
- Das Hero-Bild bleibt mit vollem Rahmen in der Inhaltsbreite (Matze 31.10.: „sollte nicht so am Rand kleben“, ersetzt den Anschnitt).
- Mobil bleibt alles einspaltig.

## Boundaries & Constraints

**Always:**
- Im DOM steht der Text vor dem Bild.
- Kacheln nutzen `bg-bg-elevated border border-rule rounded`.
- Den Wächter-Test `internal/line-list.test.ts` passen wir ausdrücklich für Kacheln an. Wir umgehen ihn nicht.
- Links in Kacheln nutzen `ctaPrimary` für den ersten Link und `ctaSecondary` für die übrigen.
- Bilder bleiben dekorative Links (`tabindex=-1`, `aria-hidden`). Sie zeigen kein CSS-Crop: Das Bildformat entsteht in `pnpm screenshots`.
- Hitze- und Wahl-Vorschau sind 1200×1000, je für DE und EN.
- Schriftgrößen kommen nur aus `--text-*`.
- Klickziele sind mindestens 24 px groß, die Zeilenlänge ist höchstens `--measure`.
- Keine Rohfarben, kein „·“, kein „→“, keine Versalien-Eyebrows.
- Neue Texte gibt es auf DE und EN.
- Der Data-Stories-Platz steht direkt nach der Gegend-Kachel, über Hitze und Wahlen (Matze, 31.10.). Bis #162 ist er nur ein Code-Kommentar und hat keine sichtbare Fläche.

**Never:**
- Kein Stories-Inhalt.
- Keine Änderung an Updates-Teaser, Vertrauensfuß, Suche oder `/explore`.
- Keine handgemachten Bilder.
- Bezirksdaten lädt der Server nicht zur Laufzeit, also kein GeoJSON im Home-Load.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop | ≥ md | Raster wie Mockup R, Hero-Bild in der Inhaltsbreite mit Rahmen | N/A |
| Mobil | < md | Kacheln einspaltig, Text über Bild, kein Hero-Bild, kein horizontaler Scroll | N/A |
| EN | `/en` | Bezirk-Links mit `/en`-Präfix, Bilder aus `static/home/en/` | N/A |
| Finder-Flag aus | `featureFlags.kiezFinder = false` | Gegend-Kachel ohne Finder-Bild und ohne Finder-Link, Text nimmt volle Breite | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/+page.svelte`: `article max-w-5xl` wird zu `max-w-6xl`. Der Stories-Kommentar wandert in `HomeTasks`, direkt nach die Gegend-Kachel.
- `src/lib/components/home/home-tasks.svelte`: Heute rendert eine Schleife alle vier Aufgaben gleich. Neu: Raster aus drei Kachel-Formen (breit mit Bild, halb mit Bild, breit mit Bezirksliste). Bei über 150 Zeilen eine Kachel-Komponente `home-task-tile.svelte` abspalten. Task-Daten und Tracking `trackLanding('task_link','home')` bleiben.
- `src/lib/components/home/home-search-hero.svelte`: Bild bleibt im vollen Rahmen, kein Anschnitt.
- `src/lib/components/home/home-preview-link.svelte`: Der Rahmen bleibt. Für die Kachel braucht es eine Variante ohne Außenrahmen, über die `class`-Prop.
- `src/lib/content/home-previews.ts`: `hitze` und `wahlen` bekommen 1200×1000. Die Pfade bleiben. Den Test `home-previews.test.ts` passen wir mit an.
- `scripts/home-screenshots.ts`:
  - `hitze`: Clip auf den Kartenteil links (x 0, Breite 948, Höhe 790 bei Viewport 1440×900) mit Legende.
  - `wahlen`: Clip 6:5 aus der Mitte der `.maplibregl-map`-Box.
  - Für beide `resize({width:1200})`.
- `src/lib/content/home-bezirke.ts` (neu): 12 Einträge `{slug,name}`, offizielle Bezirksnamen. Die Slugs müssen den Schlüsseln von `BEZIRK_SAMEAS` in `src/lib/seo/sources/bezirk-sameas.ts` entsprechen, das prüft ein Test. Ziel ist `/bezirk/{slug}`.
- `src/lib/components/home/internal/line-list.test.ts`: `ALLOWED` um das Kachel-Muster erweitern. Der Kommentar nennt Kacheln als bewusste Ausnahme (#171).
- `messages/de.json`, `messages/en.json`: Key `home_task_kieze_bezirke_list_label` für die Bezirksliste (aria-label).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/content/home-bezirke.ts` + Test: 12 Bezirke, Slugs gleich den `BEZIRK_SAMEAS`-Schlüsseln.
- [x] `src/lib/content/home-previews.ts` + Test: neue Maße für hitze und wahlen.
- [x] `scripts/home-screenshots.ts`: Kachel-Clips. Danach `pnpm screenshots --base http://localhost:5199` ausführen und die Bilder committen.
- [x] `src/lib/components/home/home-tasks.svelte` (+ Kachel-Komponente) + Tests: Raster, Bezirksliste, Reihenfolge Gegend, Stories-Slot, Hitze/Wahlen, Kieze; Flag-aus-Fall.
- [x] `src/lib/components/home/internal/line-list.test.ts`: Kachel-Muster erlauben.
- [x] `src/lib/components/home/home-search-hero.svelte`, `src/routes/(with-header)/+page.svelte`: Breite.
- [x] `messages/*.json`: Label DE/EN.

**Acceptance Criteria:**
- Given die Startseite, when axe-core läuft, then keine Verstöße.
- Given Desktop 1440 und Mobil 390, when die Design-Prüfung gegen den Dev-Server läuft, then kein Befund zu den Regeln 7, 14, 15, 17, 23 und 29, und kein horizontaler Scroll.
- Given die Tab-Taste, when man durch die Seite geht, then folgt der Fokus der Lesereihenfolge, und Bilder sind kein Tab-Stopp.

## Implementation Notes

- Neue Kachel-Komponente `home-task-tile.svelte`; `home-preview-link.svelte` hat `frame` (`full`, `none`).
- Bezirk-Links als unterstrichene Textlinks mit `--target-min`, mobil einspaltig, ab 30rem zwei Spalten.
- Hero-Anschnitt nach Matzes Einwand (31.10.) wieder entfernt, samt `overflow-x-clip`-Wrapper und `bleed-right`-Rahmen.
- Bilder hitze/wahlen DE+EN per `pnpm screenshots` neu, 1200×1000 WebP.

## Spec Change Log

- 31.10.: Matze verwirft den Hero-Anschnitt („sollte nicht so am Rand kleben“). Frozen-Block auf Entscheidung angepasst, Code Map nachgezogen.

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | BH, ECH, VG | Wächter `line-list.test.ts` liest zeilenweise; mehrzeiliges `class` der Kachel und `FRAMES`-Strings fallen heraus, `ALLOWED` toter Code | medium | Geprüft: `home-task-tile.svelte` Klassenliste über drei Zeilen. Patch: Dateiinhalt statt Zeilen, String-Literale mitprüfen. |
| 2 | VG (other) | E2E `a11y.e2e.ts:82` zählt `[data-testid^="home-task-"]` = 4, neue `home-task-links` verdoppeln | high | Geprüft. Patch: Locator auf `section[...]`. |
| 3 | eigene Prüfung | E2E `i18n-routing.e2e.ts:736` zählt `ul a` je Kachel; Kieze hat jetzt 15 Links | high | Gleiche Ursache wie 2 (Links-Liste ohne eigenen Selektor im E2E). Patch: `[data-testid="home-task-links"] a`. |
| 4 | VG, BH | Raster (wide/half, 4/8, 5/7) ungetestet | medium | Vorab verifiziert. Patch: Klassen-Assertions. |
| 5 | VG | `frame`-Varianten ungetestet | low | Vorab verifiziert, Fix nur Assertions. Patch. |
| 6 | BH | Halbe Kacheln: Bilder bei unterschiedlicher Textlänge nicht bündig | medium | Titel/Text in Hitze und Wahlen sind verschieden lang, Bild-Zeile `1fr` ohne Ausrichtung. Patch: Bild ans Kachelende. |
| 7 | BH, ECH | `fit: 'fill'` kann verzerren, `withoutEnlargement` entfernt | low | Direktkorrektur: Format prüfen und abbrechen, `withoutEnlargement` zurück. Patch. |
| 8 | BH, ECH | Hitze-Clip hart codiert | low | Direktkorrektur aus `VIEWPORT/HEADER/FOOTER` ableiten. Patch. |
| 9 | BH | `aria-label` „Liste der Bezirke“ doppelt angesagt | low | Direktkorrektur: Label „Bezirke“/„Districts“. Patch. |
| 10 | BH, ECH | Spec hakt Stories-Slot-Test und Hero-Datei ab, Code Map weicht ab | false | Fix wäre Spec-Edit; Abweichungen in Implementation Notes dokumentiert. Abgelehnt. |
| 11 | BH | Bezirksnamen dupliziert (`data-collector.ts`) | low | Quelle ist server-only, Namen amtlich und stabil; Fix bräuchte neues geteiltes Modul. Abgelehnt. |
| 12 | BH | Bezirk-Klicks im selben Tracking-Event | low | Neues Event wäre neue Fläche (Plausible-Goal). Abgelehnt. |
| 13 | BH | Button „Alle Bezirke“ neben der Bezirksliste doppelt | low | Übersicht `/bezirke` bleibt sinnvoller Einstieg. Abgelehnt. |
| 14 | ECH | Kachel mit `preview` und `aside` zugleich bzw. `half` mit `aside` bricht | low | Kein Aufrufer erreicht das. Abgelehnt. |
| 15 | VG | Tracking-Klick ohne Komponententest | low | Vorbestehend, in deferred-work. Defer. |
| 16 | BH | AC-Belege (axe, Design, Fokus) fehlen | false | Laufen nach dem Review (design-pruefung, codex-review). |
| 17 | Design-Prüfung | Regel 14: Updates-Einträge laufen bei `max-w-6xl` auf 140 Zeichen pro Zeile | medium | Durch die breitere Seite verursacht. Patch: `max-w-(--measure)` am Eintrag, Test rot dann grün. |
| 18 | codex-review | Diff enthält keine neuen WebP-Dateien | false | `static/home` war bewusst aus dem Review-Diff ausgeschlossen; Dateien sind 1200×1000 (sips, `home-previews.test.ts`). |

## Verification

Ergebnis 31.10.: 81 Tests grün, `pnpm check` 0 Fehler. Design-Prüfung DE/EN 1440 und 390: axe 0 Verstöße, keine AI-Look-Indizien, einziges kleines Klickziel ist der versteckte Skip-Link. codex-review (gpt-6.1-sol): einziger Befund verworfen (#18).

**Commands:**
- `pnpm vitest run src/lib/components/home src/lib/content/home-previews src/lib/content/home-bezirke` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks (if no CLI):**
- `/` und `/en` bei 390 und 1440 px am Dev-Server; Skill `design-pruefung`; `codex-review`.
