---
story: GH-88
title: Redesign 3, Inspector nach Mockup
status: in-review
epic: GH-85
---

# Spec GH-88: Inspector nach Mockup

Quelle: Issue #88, abgenommenes Mockup `design-proposals/inspector.html` (lokal, nicht im Repo), Entscheidungen Matze 17.10.2026. Der Spec-Checkpoint ist übersprungen, Issue und Mockup gelten als Spec.

## Entscheidungen (eingefroren)

- Kein Escape-Schließen für den Desktop-Inspector.
- Stufenfarben einheitlich: gut grün, mittel neutral, niedrig orange (bei Belastungs-Layern: hohe Belastung bleibt rot).
- Dichte bleibt. Indigo-Akzent, nur Light Mode.
- Keine Textkürzungen (#92), keine Score-Umbenennung (#93), keine anderen Seiten (#90).

## Akzeptanzkriterien

1. **Linien statt Karten.** Datensätze im Inspector haben keinen Rahmen, keinen Radius, keinen Hintergrund. Eine Linie trennt Datensätze.
2. **Score-Zugehörigkeit nur über Gruppen.** Kontext-Datensätze tragen kein Label. Score-Inputs zeigen eine Textzeile „Im Kiez-Score: {Dimension}“ in Akzentfarbe unter dem Titel, ohne Box. Die Dimensionsliste im Score-Block hat zwei Gruppen: „Im Kiez-Score“ (Composite-Dimensionen) und „Zusätzlich, nicht im Score“ (Kultur, Kriminalität).
3. **Quelle & Details einmal pro Gruppe.** Kein „Quelle & Details“ und kein Mehr-Info-Icon pro Datensatz. Der Datensatz-Titel verlinkt auf die Layer-Seite. Pro Sektion gibt es eine aufklappbare Liste „Quellen und Details“ mit Erklärung, externer Quelle, Datenstand, Lizenz und redaktionellen Hinweisen je Datensatz. Lizenz-Angaben bleiben damit im Inspector erreichbar.
4. **Ring-Legende ordnet eindeutig zu.** Die Legende sagt sichtbar, in welcher Reihenfolge sie die Ringe beschreibt (von außen nach innen), statt das nur über die Reihenfolge zu implizieren.
5. **Ein Zahlformat.** Prozent, Meter, Dezibel und Euro je Fläche laufen über `$lib/i18n/format.ts`: DE „53,1 %“, „293 m“, „57,4 dB“, „60.000 €/m²“. Zahl und Einheit trennt ein Leerzeichen im Text, nicht nur ein Rand.
6. **Stufenfarben einheitlich.** „mittel“ ist bei Datensätzen neutral, wie bei den Dimensionen.
7. **`inspector-panel.svelte` unter 500 Zeilen**, aufgeteilt per Komposition in `inspector-panel/`.

## Testideen

- AC1: `layer-card` ohne `rounded`/`border `-Rahmenklassen; `layer-hit-row` ohne Box.
- AC2: `score-membership-badge` rendert für Kontext-Slugs nichts; Score-Slug zeigt „Im Kiez-Score: …“ ohne Hintergrundklasse. `kiez-score-section` rendert `kiez-score-group-score` und `kiez-score-group-context`.
- AC3: `layer-card` hat kein `card-details-toggle`, Titel ist Link auf `/layer/{slug}`; neue `section-sources` listet je Datensatz Stand und Quelle.
- AC4: Ring-Legende hat sichtbare Reihenfolge-Zeile.
- AC5: `formatShare`/Kontextzeilen liefern „66,7 %“; Nearest-Stops zeigen „293 m“; ValueChip-Text enthält Leerzeichen vor der Einheit.
- AC6: `getValueSeverity('luft-2023', 'mittel') === 'neutral'`.
- AC7: Zeilenzahl-Guard für `inspector-panel.svelte`.

## Triage-Log

Drei Review-Layer per `codex exec --model gpt-6.1-sol` (Forks dürfen keine Subagenten starten).

| Layer | Befund | Entscheidung |
|---|---|---|
| Blind | Status-Text und Aktionen drücken den Titel auf schmalen Ansichten zusammen | gepatcht: Fehltexte stehen unter dem Titel |
| Blind | Titel-Links unter 24 px | gepatcht: `min-h-(--target-min)` |
| Edge | `kuehle-orte` fehlt in den Sektions-Quellen | gepatcht: Quellenliste bekommt alle Hits der Sektion |
| Edge | lange Fehltexte überlaufen im Bottom-Sheet | gepatcht, siehe oben |
| Gap | Quellenliste nur isoliert getestet | gepatcht: Integrationstest im Panel (ein Toggle pro Sektion, Stand, Lizenz, Quelle, legal-Hinweise) |
| Gap | numerische Lärmwerte ohne Formatter („57.4 dB") | gepatcht: `formatDecimal`, Test mit Rohwerten |
| Gap | Spezial-Datensätze (Haltestellen, Klima, Bevölkerung) noch als Box | gepatcht, Guard-Test; Kühle/Warme Orte (Hitze-/Kälte-Modus) bleiben Box, außerhalb des Mockups |
| Gap | gelöschte Tests nicht gleichwertig ersetzt | gepatcht: Einklappen, externe Links je Reason, legal für alle drei Slugs, PET-Erklärung |
| Gap | externe Datenquelle nur als Kürzel | gepatcht: Link auf `hit.source` je Datensatz |
| Gap | Beta-Label im Diff | verworfen: kam aus veraltetem `origin/main`, nach Rebase weg |

Bewusst offen: Numerische Lärm-/PET-Schwellen (55 bis 65 dB, 30 bis 35 °C) bleiben orange, sie sind keine „mittel"-Kategorie. Die Dimensionszeilen im Score-Block behalten ihr Layer-Link-Icon.
