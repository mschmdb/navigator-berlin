# Berlin Data Stories: Handschrift

Gestaltungsregeln für die Visualisierungen aus Epic #159. Quelle: Skizzen vom 28. bis 31.10.2026. Matze prüft die Regeln. Die Tokens stehen in `src/lib/stories/tokens.ts`, ein Test in `tokens.test.ts` erzwingt sie.

## Fläche und Rahmen

- Warmer Papierton als Fläche (`STORY_PAPER`, #efe6d2), Tinte (`STORY_INK`, #26221e) als Linien- und Textfarbe.
- Ein einfacher Rahmen.
- Keine simulierten Papiertexturen: kein Korn, keine Flecken, keine Vignette.
- Tinte ist die Basisfarbe für Text, Rahmen und Linien. Daten trägt sie nur über eine Form: in "Punkt, Linie, Kiez" der Balken (Bewohner), in den Signeten die unterste Hitzestufe.
- Tinte auf Papier erreicht mindestens 7:1 Kontrast.
- Keine Fraktur, kein Schwarz-Weiß-Rot.

## Farbe und Linie

- Eine Farbe hat innerhalb einer Serie genau eine Bedeutung. Grün zeigt Grün.
- Pro Serie gibt es nur zwei Linienstärken (dünn, kräftig).
- Kleine Zeichen unter 120 px (`SMALL_MARK_PX`) vereinfachen sich: ohne Haarlinien und Punkte. Ausnahme: In "Punkt, Linie, Kiez" ist eine Miniatur die große Komposition, verkleinert (Matze 31.10.). Geometrie, Reihenfolge und Farben sind identisch, nur die Strichstärke wächst. Linien liegen immer unter allen Formen. Kein Blend-Modus.

### Palette "Punkt, Linie, Kiez"

- Kreis, Grün #3a8a55: Grünversorgung
- Quadrat, Rot #cf4128: Altbau
- Dreieck, Gelb #efbd2c: Lärm
- Donut, Blau #24579e: Clubs
- Balken und Linien: Tinte

### Palette "Berliner Signete"

- Patina #4f7152: Grün
- Gold #b88a2e: Clubs
- Hitze: Tinte, dann Ochsenblut #5e2b22, dann Rot #9e2a2b
- Tönung #d4c39e

## Inhalt

- Sichtbar sind nur Bezirk, Kiez oder Menschen. Planungsräume bleiben Rechengrundlage.
- "Bewohner" statt "Dichte".
- Eine Aussage pro Bild.
- Rang-Skalen nur bei großer Spanne. Sonst gilt eine absolute Skala.

## Beschriftung

- Fußzeile: "navigator.berlin" links, Quellenzeile rechts.
- Sobald OSM-Daten im Bild sind, nennt die Quellenzeile "© OpenStreetMap-Mitwirkende" (DE) oder "© OpenStreetMap contributors" (EN).
- Die Legende nennt Form und Bedeutung, zum Beispiel "Kreis: Grünversorgung".
- Schrift in der Visualisierung: Jost (OFL 1.1, selbst gehostet, `STORY_FONT`). Die Seite selbst bleibt IBM Plex.
- Schreibweise normal, also deutsche Groß- und Kleinschreibung. Ausnahme: Die Serie "Punkt, Linie, Kiez" schreibt durchgehend klein, als Bauhaus-Zitat.
- Kein "Kunst"-Etikett.

## Barrierefreiheit

- Jede Visualisierung bekommt eine Textalternative, die ihre eine Aussage nennt (WCAG 1.1.1).
- Bedeutung tragen Form und Legende, nie Farbe allein.

## Offen

- Auf Papier liegen Gelb #efbd2c (1,41:1), Gold #b88a2e (2,52:1) und Tönung #d4c39e (1,40:1) unter 3:1 (WCAG 1.4.11). #163 entscheidet über eine Tintenkontur oder eine gleichwertige Lösung.

- „Berliner Signete“: Haarlinie 1,2 und kräftig 3 im 200er-Raster, aus den Signet-Regeln vom 29.10.
- „Punkt, Linie, Kiez“: Die Linienstärken (1 und 3) sind Platzhalter. Die Skizze nutzt 1,5 für Rahmen und Fußlinie. #163 legt die Werte mit der Komponente fest.
