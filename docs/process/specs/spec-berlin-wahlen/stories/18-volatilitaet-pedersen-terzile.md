---
title: 'Volatilität als Pedersen-Index mit Terzil-Klassen'
type: 'bugfix'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/docs/wahldaten-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Volatilitäts-Karte im Trends-Kapitel ist immer komplett „hoch“. Die festen Schwellen 5 und 12 Pp. liegen unter dem Minimum jeder Reihe; die Metrik ist zudem die L1-Summe statt des üblichen Pedersen-Index (Matze-Live-Fund 23.09.).

**Approach:** Die Volatilität wird als Pedersen-Index (halbe L1-Distanz, „Stimmenwanderung netto“ in %) gerechnet. Die drei Klassen richten sich nach den Terzilen der jeweils angezeigten Reihe; Legende und Takeaway nennen die echten Spannen. Die Karte beantwortet damit, welche Kieze relativ zum Rest Berlins stabil oder wechselhaft sind. Methodik-Doku zieht mit (Entscheidung Matze 23.09. 18:49: „Pedersen + Terzile“).

</frozen-after-approval>

## Implementation Notes

- `src/lib/server/wahl/analytik.ts#computeVolatilitaet`: Pedersen-Index (halbe L1-Distanz). Analytik lokal neu gebaut, Kiez-Werte 8,7 bis 28,7 % über alle Reihen.
- `trends-map-data.ts`: feste Schwellen entfernt; `computeVolatilitaetTerzile` (lineare Interpolation, `null` bei < 3 Werten oder ohne Streuung), `volatilitaetTerzileFor` nur über Geometrie-Slugs mit echten Werten (0 = < 2 Legislaturen = keine Daten), `buildVolatilitaetLegende` mit echten Grenzen, „Keine Daten“ nur bei tatsächlich fehlenden Gebieten, einstufige Legende bei gerundet gleichen Grenzen. Takeaway nennt die Drittel-Grenzen.
- Label „x,x % Netto-Verschiebung“ statt „Stimmenwanderung netto“ (Review: der Begriff meint im Wahljournalismus Bruttoströme).
- `trends-map-expressions.ts` backt dieselben Terzile in die Live-Karte; `trends-kapitel.svelte` Legende datengetrieben, Hinweissatz per `aria-describedby`.
- Doku: Methodik-Abschnitte Volatilität/Schwellen, Hinweis zum ersten Prod-Deploy (SQL-Check `max(volatilitaet) < 0,5`); Kommentare in Schema und `/api/wahl/analytik`.
- Browser-Check BVV: drei Stufen sichtbar, Legende 17,9 / 21,0 %.

## Review Triage Log

Blind Hunter, 13 Funde:

| # | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|
| 1 | Prod zeigt bis zum Analytik-Neubau doppelte Werte | medium | Gate prüft nur Row-Zahl; Launch-Deploy fällt aber durch (Gruppen/2026 fehlen) und baut Analytik neu | patch: Doku-Hinweis + SQL-Check |
| 2 | Datum „bis 23.09.“ in Doku | low | direkte Korrektur | patch |
| 3 | Takeaway ohne echte Spannen | medium | Intent nennt Legende und Takeaway | patch |
| 4 | „Stabiler“ ähnelt „Keine Daten“ | medium | gleiche Farbe, nur Deckkraft; 4. Rampenstufe mit 3:1 zu beiden Nachbarn nicht möglich | patch: „Keine Daten“ nur bei fehlenden Gebieten |
| 5 | Wert 0 fließt in Terzile | low | Server-Semantik 0 = < 2 Legislaturen | patch |
| 6 | Karte und Legende auf unterschiedlicher Gebietsmenge | low | Terzile nun nur über Geometrie-Slugs | patch |
| 7 | `bakeTrendsProperties` ohne Terzil-Test | gap | alter Test mit 1 Gebiet | patch |
| 8 | Komponententest nur negativ | gap | positive Prüfung + null-Pfad | patch |
| 9 | Gerundet gleiche Grenzen | low | „18,5 bis 18,5 %“ | patch |
| 10 | Hinweis nicht per `aria-describedby` verknüpft | low | direkte Korrektur | patch |
| 11 | „Stimmenwanderung netto“ missverständlich | medium | Begriff = Bruttoströme | patch: „Netto-Verschiebung“ |
| 12 | Story-Datei ohne AC | false | Oneshot-Vorlage sieht nur Intent + Notes vor | reject |
| 13 | Alte Story-Texte beschreiben altes Label; Schema/API-Doku | low | alte Stories sind Historie; Schema/API-Kommentar ergänzt | patch (Schema/API), reject (Historie) |

Verifikation: Unit 4099/4100 (bekannter `winner-map`-Flake, isoliert 3/3 grün, deferred), check 0, lint:wahl 0.
