# Epic: Kiez- und Bezirksseiten mit Ort, Zahl und Karte

Stand 14.10.2026. Quelle: Brainstorming `_bmad-output/brainstorming/brainstorm-kiez-bezirk-landing-2026-10-14/` und Audit `landing-audit-2026-10-14.md`.

## Ziel

Such-Einsteiger auf Kiez- und Bezirksseiten bleiben und klicken weiter. Ausgangswerte (Plausible, 16.09.-14.10.): Kiez 84,5 % Bounce bei 14 s, Bezirk 81,2 % bei 27 s. Layer-Seiten liegen bei 32,5 %, Explore bei 154 s Verweildauer.

Leitgedanke: Wer auf der Karte landet, bleibt. Kiez- und Bezirksseiten führen heute nicht dorthin.

## Search Console (Export 14.10.2026, letzte 3 Monate, Web)

| Seitentyp | Klicks | Impressionen | CTR | Ø Position | Seiten |
|---|---|---|---|---|---|
| Bezirk | 19 | 9.764 | 0,19 % | 17,6 | 24 |
| Kiez | 55 | 5.238 | 1,05 % | 12,4 | 232 |
| Layer | 45 | 5.184 | 0,87 % | 14,8 | 90 |

Suchabsicht (von 1.000 Top-Anfragen):
- **Einwohnerzahl und Größe:** 64 Anfragen, 1.537 Impressionen, 0 Klicks („kreuzberg einwohner“ 377, „pankow einwohner“ 133, „wie groß ist neukölln“). Die Bezirksseiten ranken auf Platz 7-11, aber das Snippet nennt die Zahl nicht.
- **Postleitzahlen:** 172 Anfragen, 1.141 Impressionen („10245 berlin friedrichshain“), Position meist über 30.
- **Grenze und Karte:** 64 Anfragen, 399 Impressionen („berlin lichtenberg friedrichshain grenze“).
- **Welcher Bezirk für eine Straße:** 19 Anfragen, 122 Impressionen („frankfurter allee bezirk“).
- Spitzenreiter: `/bezirk/friedrichshain-kreuzberg` 3.584 Impressionen, 0,14 % CTR; `/kiez/prenzlauer-berg-suedwest` 436, 0 Klicks.

Folgen für den Epic:
- L3 zuerst für Bezirke: Einwohnerzahl und Fläche in Title und Description, weil Google sonst nicht klickt.
- L2/L5: Einwohnerzahl als erster Fakt sichtbar, Umriss-SVG beantwortet „Grenze“.
- Neu als Kandidat (später): PLZ je Kiez/Bezirk und „Welche Straßen gehören dazu“. Datenquelle ungeprüft.

## Entscheidungen

- Kein MapLibre im Hero. Kiez-Umriss als statisches SVG, Karte über Deep-Link. Lazy-Karte erst prüfen, wenn die Messung eine Lücke zeigt (Neubewertung der Entscheidung vom 16.05.2026).
- Jede Story über bmad-build als voller Lauf, eigener Branch von `feat/landing-enhance`, DE und EN.

## Stories

| # | Story | Prio | Abhängig von |
|---|---|---|---|
| L1 | Deep-Link `/explore?kiez=<slug>` und `?bezirk=<slug>`: Karte zoomt auf den Umriss, hebt ihn hervor, Inspector zeigt Kiez-/Bezirkswerte | 1 | |
| L2 | Kiez-Hero neu: Umriss-SVG in Berlin, Score mit Rang „Platz X von 143“, stärkster Fakt (größte Abweichung vom Berlin-Schnitt), Primärbutton „<Kiez> auf der Karte“ | 1 | L1 |
| L3 | Title und Meta-Description von Kiez- und Bezirksseiten mit Score, Rang und einem Fakt | 1 | |
| L4 | Kennzahl-Kacheln offen statt Steckbrief in `<details>`: Miete, Altbau, Lärm, Grün, Hitze, ÖPNV, je mit Berlin-Wert und Link auf den Layer mit Kiez-Fokus | 2 | L1 |
| L5 | Bezirksseite: Karte der Kieze eingefärbt nach Score, alle Kieze als sortierbare Liste oben, FAQ ans Ende, Bezirks-Rang im Hero | 2 | L1 |
| L6 | Nachbar- und ähnliche Kieze mit Score und Link | 2 | |
| L7 | Layer-Seiten: Karten-Button in den Hero, Top-5/Flop-5 Kieze mit Links | 3 | L1 |
| L8 | Messung: Plausible-Events (Karten-Button, Nachbar-Klick, Kachel-Klick), Vorher/Nachher-Abfrage nach 4 Wochen, Search Console anbinden | 3 | |

## Später

Kiez-Duell, OG-Bild je Kiez, Charakter-Label („Gründerzeit-Kiez“), Seiten je Straße, Kartenvorschau-Bilder auf Layer-Seiten.

## Verworfen

Kommentare, Bewohner-Zitate ohne Quelle, KI-Chat.

## Bekannter Bug (separat)

`/layer/kiez-score-gesamt` zeigt Lärm-Fragen im FAQ und „Methodik in Vorbereitung“.
