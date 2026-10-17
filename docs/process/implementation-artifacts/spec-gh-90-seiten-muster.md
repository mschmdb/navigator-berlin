---
story: GH-90
title: Kiez-, Layer-, Methodik- und weitere Seiten auf Linien-Muster
status: in-review
epic: GH-85
---

# Spec GH-90: Seiten auf Linien-Muster

Der Issue-Text mit Kommentar gilt als abgenommene Spec. Der Spec-Checkpoint wurde übersprungen, Matze prüft im PR.

## Ziel

Die Seiten folgen dem Muster des Inspectors (#88): Struktur über Abstand und Linien, Überschriften in Plex Sans 600/700, keine gleichförmigen Boxen. Ausnahmen mit Grund: der Kälte-Notfall-Block bleibt eine umrandete Fläche, Buttons bleiben Buttons.

## Akzeptanzkriterien und Tests

| AC | Umsetzung | Test |
|---|---|---|
| Kiez: Kennzahlen als Zeilen, kein Überlauf | `key-figure-tiles.svelte` als Liste mit Linie, Wert in Textgröße | `key-figure-tiles.svelte.test.ts` |
| Kiez: Score-Block-Dopplung weg, Reihenfolge Profil, Vergleich, Kennzahlen, Steckbrief | `kiez-details.svelte` mit `figures`-Snippet, Nachbarn ans Ende | `kiez-details.svelte.test.ts` |
| Kiez: Wahl-Verlauf als Tabelle | Tabelle je Wahl, Jahre als Spaltenköpfe | `kiez-wahl-verlauf.svelte.test.ts` |
| Kiez: Leerzeichen bei Nachbarn | seit #87 behoben, Regressionstest | `kiez-neighbors.svelte.test.ts` |
| Layer: Boxen zu Abschnitten, zweiter Karten-Link nur mit FAQ | `layer/[slug]/+page.svelte` | `layer/[slug]/page.svelte.test.ts` |
| /daten: keine Beschreibung, die den Link wiederholt | `isRedundantDescription` | `redundant-description.test.ts` |
| Methodik: eine Vorlage, keine nummerierten H2, Gewichte-Tabelle mit Köpfen | drei Methodik-Seiten | `methodik/*/page.svelte.test.ts` |
| Leseseiten: höchstens 70 Zeichen | `--measure`, Klasse `text-measure` | `reading-measure.test.ts` |
| /hitze: Orte in meiner Nähe zuerst, Listen statt Boxen | `hitze/+page.svelte` | `hitze/page.svelte.test.ts` |
| /kaelte: Notfall-Block einzige Box | `notfall-block.svelte` | `notfall-block.svelte.test.ts` |
| Wahlportal: Top-3 je Bezirk als Tabelle | `berlin-wahlen/[slug]/+page.svelte` | `wahl-detail-page.svelte.test.ts` |
| Startseite: Ring-Legende linksbündig | `kiez-score-ring.svelte` | `kiez-score-ring.svelte.test.ts` |

## Abgrenzung

Texte kürzen (#92), Score-Name (#93), Ranking-Tabelle (#94), Explore und Back (#91) gehören nicht dazu.

## Offen

- Sankey-Labels nutzen seit #86 den Dichte-Token. Auf Mobil schrumpft das SVG die Labels weiter (Eintrag in `deferred-work.md`). Das braucht einen Layout-Umbau, Labels aus dem skalierten SVG heraus.

## Triage-Log

- Selbst-Review (Codex-Limit bis 18:54 erreicht): Methodik-Erklärtexte von 14 auf 16 px, Notfall-Zeilen einheitlich eingerückt.
- Codex (gpt-6.1-sol), drei Linsen in einem Durchgang:
  - Umgesetzt: `isRedundantDescription` versteckte echte Zusätze („Radverkehrsnetz 2025 mit Vorrangrouten“, „Club oder Musikspielstätte“). Jetzt gilt nur dasselbe Wort in Ein- oder Mehrzahl als Dopplung.
  - Umgesetzt: Wahldaten-Text verwies auf „Abschnitt 4“ und „Abschnitt 6“, die es ohne Nummern nicht mehr gibt. Jetzt beim Namen.
  - Umgesetzt: e2e `key-figures` prüfte noch das Kachel-Raster und die alte Reihenfolge.
  - Umgesetzt: Normalisierungs- und Aggregations-Definitionen auf Methodik-Seiten von 14 auf 16 px.
  - Umgesetzt: Gewichte-Tabelle mit `caption` (sr-only), Snapshot ergänzt.
  - Umgesetzt: Tests für Top-3 mit fehlenden Plätzen, leerem Bezirk und EN-Spaltenköpfen.
  - Offen gelassen: Sankey-Labels auf Mobil (Layout-Umbau, siehe Offen).
  - Teilweise: Reihenfolge-Test der Kiez-Seite prüft Vergleich und Steckbrief im e2e, Nachbarn am Ende nur per Screenshot.

