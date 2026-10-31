---
title: 'gh-170: Startseite zeigt echte App-Vorschauen'
type: 'feature'
created: '2026-10-31'
status: 'in-review'
baseline_commit: '5d3091fd45ad48b31e74a979706eb8d84916a80d'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die neue Startseite (#169) hat keine Bilder. Besucher sehen nicht, was sie in der App bekommen.

**Approach:** Die vier per `pnpm screenshots` aus der echten App erzeugten Vorschauen in `static/home/` einbinden: Kiez-Score neben der Suche, Kiez-Finder bei „Eine Gegend prüfen“, Hitze bei „Hitze, Kälte und weitere Ebenen“, Wahlkarte bei „Wahlergebnisse ansehen“. Jedes Bild ist ein Link auf genau den gezeigten App-Zustand.

## Boundaries & Constraints

**Always:** Bilder exakt aus `static/home/*.webp`; `width`/`height` gesetzt (kein Layout-Sprung); Alt-Text DE/EN beschreibt den Inhalt; Bild-Link führt per `localizedHref` auf denselben Zustand wie im Skript `scripts/home-screenshots.ts` (Pfade dort als einzige Quelle exportieren und wiederverwenden); Rahmen nach bestehendem Muster `overflow-hidden rounded border border-rule bg-bg-muted` (Wächter-Test `internal/line-list.test.ts`); Hero-Bild nur ab `md` sichtbar (`hidden md:block` mit `loading="lazy"`: Browser laden verborgene Lazy-Bilder nicht); Aufgaben-Bilder `loading="lazy"`; Klickziel des Bild-Links = ganzes Bild.

**Never:** Neue Screenshots per Hand; eigene Grafiken statt App-Bildern; Skript in die CI hängen; Änderungen an `/explore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop | ≥ md | Hero zweispaltig mit Kiez-Score-Bild; vier Aufgaben, drei mit Bild | N/A |
| Mobil | < md | Kein Hero-Bild; Aufgaben-Bilder unter dem Text | N/A |
| EN | `/en` | Alt-Texte EN, Bild-Links mit `/en`-Präfix | N/A |
| Kiez-Finder-Flag aus | `featureFlags.kiezFinder = false` | Kein Finder-Bild | N/A |

</frozen-after-approval>

## Code Map

- `scripts/home-screenshots.ts` -- `SHOTS` mit `name` und `path`; Pfade in ein kleines Modul `src/lib/content/home-previews.ts` auslagern (Name, Pfad, Bilddatei, Breite, Höhe) und im Skript importieren.
- `src/lib/components/home/home-search-hero.svelte` -- heute einspaltig (`grid items-center gap-10`); Bild rechts ergänzen.
- `src/lib/components/home/home-tasks.svelte` -- Aufgaben mit `id` `gegend`, `kieze`, `klima`, `wahlen`; Bild je Aufgabe außer `kieze`.
- `src/lib/components/home/internal/line-list.test.ts` -- erlaubt nur `overflow-hidden rounded border border-rule bg-bg-muted` als gerahmte Fläche.
- `messages/de.json`, `messages/en.json` -- neue Keys `home_preview_*_alt`.
- `static/home/` -- `kiez-score.webp`, `finder.webp`, `hitze.webp` (1600×878), `wahlen.webp` (1132×1036).

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/content/home-previews.ts` + Test -- Vorschau-Daten als einzige Quelle; Test: jede Datei existiert in `static/home/`, Maße stimmen, Pfade beginnen mit `/`.
- [ ] `scripts/home-screenshots.ts` -- Pfade aus `home-previews.ts` beziehen.
- [ ] `src/lib/components/home/home-search-hero.svelte` + Test -- Kiez-Score-Bild als Link, ab `md`.
- [ ] `src/lib/components/home/home-tasks.svelte` + Test -- Bild-Links bei gegend, klima, wahlen.
- [ ] `messages/de.json`, `messages/en.json` -- Alt-Texte.

**Acceptance Criteria:**
- Given die Startseite, when axe-core läuft, then keine Verstöße.
- Given die Design-Prüfung gegen den Dev-Server, then kein Befund zu Regeln 7, 15, 17, 23.

## Implementation Notes

- Nach Review: Patches 1, 3–8 umgesetzt. Matze 31.10.: herausgezoomtes Kiez-Score-Bild bleibt (Befund 2 bewusst nicht umgesetzt, Link öffnet Adressansicht); Höhenbegrenzung der Aufgaben-Bilder zurückgenommen („Wahlbild verschlechtert“).
- Bilder je Sprache: `static/home/{de,en}/*.webp`, `homePreviewSrc(preview, locale)`, Skript nimmt beide Sprachen auf.
- Auffällig in der EN-Aufnahme: Score-Ring im Inspector zeigt deutsche Dimensionsnamen und „Gesamt“ (vorbestehender i18n-Fehler der App, nicht Teil dieser Story).

## Spec Change Log

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | ECH, BH | Finder-Bild mit maximalen Reglern, Link öffnet Standardwerte | medium | Verletzt Intent „Link auf genau den gezeigten Zustand“; `fw`-Parameter existiert. Patch: Pfad mit `fw=2,2,…`, Skript ohne Regler-Interaktion. |
| 2 | ECH, BH | Kiez-Score-Bild herausgezoomt, Link öffnet Adressansicht | medium | `center`/`zoom` greifen neben `address` nicht. Patch: Zoom-out im Skript entfernen. |
| 3 | BH | Alt-Texte enthalten „Ein Klick öffnet …“ | low | Rolle wird vom Screenreader genannt; Direktkorrektur. Patch. |
| 4 | ECH, BH | Bild-Links doppeln Text-Links (zusätzlicher Tab-Stopp) | low | Direktkorrektur per tabindex/aria-hidden. Patch. |
| 5 | ECH, BH, VG | Bildklick als `task_link` nicht unterscheidbar | low | Kleine Typ-Erweiterung, Zweck der Vorschauen messbar. Patch. |
| 6 | ECH | `block` und `hidden md:block` auf demselben Element | medium | Reihenfolge der Utilities unbestimmt, Hero-Bild könnte mobil erscheinen. Patch. |
| 7 | VG, ECH, BH | Flag-aus-Fall ohne Test | low | Matrix-Zeile verlangt Abdeckung. Patch. |
| 8 | BH | Wahlbild fast quadratisch, füllt Handyhöhe | low | Direktkorrektur per Höhenbegrenzung. Patch. |
| 9 | BH | Kein `srcset`/`sizes` | low | Bandbreite, Fix bräuchte Bildvarianten im Skript. Abgelehnt. |
| 10 | ECH | Bild lädt nicht, leerer Rahmen | false | `home-previews.test.ts` prüft Existenz der Dateien. |
| 11 | BH | WebP-Dateien evtl. nicht committet | false | In 4374216 und 5d3091f committet. |
| 12 | VG | Klick-Tracking ohne Komponententest | low | Vorbestehendes Muster, bereits in deferred-work. Abgelehnt. |
| 13 | VG | Bildinhalt kann vom Link-Zustand abdriften | low | Gemeinsame Quelle `home-previews.ts` mindert; manuelles Skript. Abgelehnt. |

## Verification

**Commands:**
- `pnpm vitest run src/lib/components/home src/lib/content/home-previews` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks (if no CLI):**
- Dev-Server `/` und `/en`, 390 px und 1440 px; Skill `design-pruefung`; `codex-review`.
