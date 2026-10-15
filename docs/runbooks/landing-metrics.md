# Runbook: Messung der Landing-Seiten

Vergleicht Kiez-, Bezirks- und Layer-Seiten vor und nach dem Epic "Landing-Enhance". Der erste Vergleich läuft 4 Wochen nach dem Deploy.

## Events

Jeder Klick sendet ein Plausible-Event `Landing` mit zwei Properties. Es gibt keine Slugs, Cookies oder IDs.

| `action` | Klickziel |
|---|---|
| `map_button` | Karten-Button (Kiez, Bezirk, Layer-Hero) |
| `map_link_bottom` | Karten-Link am Ende der Layer-Seite |
| `key_figure` | Link in einer Kennzahl-Kachel |
| `neighbor` | Link zu einem angrenzenden Kiez |
| `similar` | Link zu einem ähnlichen Kiez |
| `list_sort` | Sortier-Button der Kiez-Liste (Bezirk) |
| `list_link` | Kiez-Link in der Liste (Bezirk) |
| `map_link` | Kiez-Link in der Bezirkskarte |
| `ranking_link` | Kiez-Link in der Rangliste (Layer) |
| `eyebrow_link` | Bezirks-Link über der Kiez-Überschrift |

`page_type` ist `kiez`, `bezirk` oder `layer`.

### Einrichtung in Plausible

- Goal `Landing` anlegen.
- In den Site Settings die Custom Properties `action` und `page_type` freischalten. Ohne Freischaltung zeigt Plausible nur die Summe des Goals.

### Bounce bleibt vergleichbar

Das Event geht mit `interactive: false` raus. Es beendet den Bounce also nicht. Sonst würde jede Session mit einem Klick ab Deploy zur Nicht-Bounce-Session, und Zeitraum B wäre mit A nicht vergleichbar. Das ausgelieferte Plausible-Script unterstützt die Option (geprüft am 15.10.2026). Nach einem Plausible-Update erneut prüfen.

### Was nicht gemessen wird

- Verwandte Layer, Hitze-Link und Methodik-Links auf den Layer-Seiten
- Mittelklick und Strg/Cmd-Klick (neuer Tab) lösen kein Event aus
- Tastatur-Aktivierung zählt, weil sie ein Klick-Event auslöst

## Abfrage ausführen

Spaltennamen geprüft am 15.10.2026 (`DESCRIBE TABLE sessions_v2`): `entry_page`, `is_bounce`, `duration`, `pageviews`, `start`, `sign`, `site_id`. Nach einem Plausible-Update erneut prüfen; weichen sie ab, zuerst `scripts/landing-metrics.ts` anpassen.

1. SQL erzeugen. Die Zeiträume sind inklusive, Format `YYYY-MM-DD:YYYY-MM-DD`. Die Tagesgrenzen gelten in Berliner Zeit (`Europe/Berlin`). B muss nach dem Ende von A beginnen. Bei ungleicher Länge warnt das Skript auf stderr.

   ```sh
   pnpm metrics:landing --a <vorher-von>:<vorher-bis> --b <nachher-von>:<nachher-bis> --site-id <site-id>
   ```

   Ohne `--site-id` steht der Platzhalter `<site_id>` im SQL. Die Site-ID steht in der Plausible-Datenbank (Tabelle `sites`).

2. SQL auf dem Plausible-Server ausführen. Das Skript verbindet sich nicht selbst und läuft nie automatisch gegen Produktion.

   ```sh
   pnpm --silent metrics:landing --a ... --b ... --site-id <site-id> \
     | ssh <plausible-host> "docker exec -i <clickhouse-container> clickhouse-client --format PrettyCompact --multiquery"
   ```

   Host und Container-Name stehen im Passwortmanager, nicht im Repo.

3. Ergebnis lesen: eine Zeile je Seitentyp und Zeitraum (`A` = vorher, `B` = nachher) mit Besuchen, Bounce in Prozent, Ø Dauer in Sekunden und Seiten pro Besuch. Die Abfrage gewichtet über `sign` und zählt nach Einstiegsseite.

4. Klickverteilung je `action` für Zeitraum B: dasselbe Kommando mit `--events` und nur `--b`. Es liest `events_v2` (`name = 'Landing'`, Properties über `meta.key`/`meta.value`). Spaltennamen `name`, `timestamp`, `site_id`, `meta.key`, `meta.value` geprüft am 15.10.2026.

   ```sh
   pnpm --silent metrics:landing --events --b <nachher-von>:<nachher-bis> --site-id <site-id> | ssh ...
   ```

Baseline vom 14.10.2026: `_bmad-output/planning-artifacts/landing-audit-2026-10-14.md`.

## Search Console

Für dieselben zwei Zeiträume exportieren:

- Leistung, Tab "Seiten": Klicks, Impressionen, CTR, Position
- Leistung, Tab "Suchanfragen": Top-Anfragen für `/kiez/`, `/bezirk/` und `/layer/`

Filter: Seite enthält `/kiez/`, `/bezirk/` oder `/layer/`. Die Export-CSV bleibt außerhalb des Repos.

## Auswertung eintragen

Ergebnis als Tabelle ins Epic-Dokument `_bmad-output/planning-artifacts/epic-landing-enhance.md` unter einem neuen Abschnitt "Messung" nachtragen: Zeiträume, Zahlen je Seitentyp, Klickverteilung je `action`, Lesart in drei Sätzen.

Fallzahlen sind klein (rund 60 Kiez-Einstiege in 28 Tagen). Tendenzen nennen, keine Prozentpunkte als Beweis.
