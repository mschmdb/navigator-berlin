# Cross-Layer-Templates · Style-Guide

Story 6.7. Pflichtlektüre vor Erweiterung der Template-Bibliothek unter
`src/lib/data/cross-layer-templates/`.

## Grund-Prinzip

Templates verknüpfen Daten aus mehreren Layern (Wahl, Wohnlage, Lärm,
Mietspiegel, Kiez-Score, Klima, Versorgung) zu deterministischen
Beobachtungs-Texten. Daten werden **nebeneinander gestellt**, nicht kausal
verknüpft, nicht gewertet.

navigator.berlin ist eine Daten-Auskunfts-Plattform, kein Bewertungsdienst.

## Sprach-Regeln

1. **Keine Wertungs-Vokabel**: kein „besser/schlechter", „lebenswert",
   „beliebter Bezirk", „attraktives Quartier".
2. **Keine Sport-/Kampf-Metaphorik**: kein „dominiert", „Hochburg",
   „Wahlsieger", „klar gewonnen".
3. **Keine Distanz-Adjektive**: kein „weit vor", „knapp hinter",
   „deutlich gewonnen". Prozentpunkt-Differenz ohne Adjektiv nennen.
4. **Keine Personalisierung von Parteien-Farben**: kein „rote Bezirke",
   „grüne Kieze".
5. **Keine kausale Verknüpfung**: nicht „weil Wohnlage X gut ist,
   wählten Y stärker". Stattdessen: drei Werte sequentiell nennen.
6. **Keine em-dashes** (U+2014). Komma, Doppelpunkt, neuer Satz oder
   Mittelpunkt (`·`).

## Verbotene Tokens (linter-enforced)

Automatisch geblockt durch `pnpm lint:cross-layer-templates`:

- `hochburg`, `wahlsieger`, `wahlverlierer`, `stimmkönig`, `erdrutsch`,
  `wahldebakel`, `lebenswert*` (Memory `feedback_no_lebenswert`)
- `rote/blaue/grüne/schwarze Bezirke`
- `dominiert von`, `wird dominiert`
- `weit vor`, `knapp hinter`, `knapp vor`
- `klar gewonnen`, `deutlich verloren`, `geschlagen`
- `besser wohnen`, `bessere Adresse`, `besserer Kiez`
- em-dash (U+2014)

Linter scannt nur `body_de`-Felder. `editorialNote` darf zitierte
Anti-Patterns enthalten (in Anführungszeichen + Erklärung).

## Template-Schema-Pflichten

Jedes Template braucht:

- `id`: kebab-case, eindeutig pro Bundle
- `applicableTo`: mind. ein Scope aus `[bezirk, kiez]`
- `requires`: alle Daten-Schlüssel die der Renderer braucht. Render-Skip
  bei fehlenden Werten (siehe `canRender`).
- `body_de`: mind. 20 Zeichen. `{variable}`-Placeholders in
  snake_case.
- `editorialNote` (empfohlen): erklärt warum Template neutral bleibt.
- `tags` (optional): freier Tag-Array für Discovery.

## Co-Design-Review-Workflow

Vor jedem Roll-out neuer Templates auf produktive Kiez-/Bezirks-Pages:

1. **Pull-Request** mit Template-YAML-Diff erstellen.
2. **Self-Review**: Style-Guide-Checkliste am Ende dieses Dokuments
   abhaken. `pnpm lint:cross-layer-templates` grün.
3. **Editorial-Sign-off**: Review durch zweite Person mit Stigma-Fokus
   (Civic-Tech-/Datenjournalismus-Hintergrund bevorzugt).
4. **Render-Test**: gegen mind. 3 Bezirke + 5 Kieze mit unterschiedlichen
   Wahl-Ergebnis-Profilen rendern, Output sichten.
5. **Feature-Flag**: nach Merge bleibt Flag `featureFlags.crossLayerStoryBlock`
   default `false`. Aktivierung erst nach Co-Design-Sign-off.

## Self-Review-Checkliste

- [ ] body_de enthält keine Wertungs-Adjektive.
- [ ] Keine kausale Verknüpfung zwischen Layern.
- [ ] Quellen-Attribution kommt aus der Komponente, nicht aus body_de.
- [ ] editorialNote erklärt Stigma-Grenzen.
- [ ] requires-Array deckt alle `{placeholder}` ab.
- [ ] `pnpm lint:cross-layer-templates` 0 Violations.
- [ ] Renderer-Unit-Test deckt das Template ab.

## Bekannte Failure-Modes

- **Render-Substitution mit leerem String**: `canRender` muss alle
  Placeholders prüfen. Ohne diese Gates erzeugt fehlende Variable
  Texte wie „Im Kiez {kiez_name} kam {top_partei_label} auf {top_anteil_pct}".
- **Sparkline-Trend-Adjektive**: nie „steigend", „fallend",
  „rückläufig". Nur die Jahres-Werte sequentiell nennen.
- **Bezirks-Vergleich**: kein Berlin-Mittelwert als Maßstab. Bezirke
  unterscheiden sich strukturell, Vergleich erzeugt Wertung.
