---
type: methodology
audience: both
last-verified: 2026-06-30
status: empfohlen
related:
  - docs/adr/ADR-020-kuehle-orte-local-source.md
  - docs/scoring-methodology.md
---

# Kühle-Orte-Methodik

Der `kuehle-orte`-Layer zeigt Orte in Berlin, an denen Menschen bei Hitze Abkühlung finden. Er ist ein Angebot, kein Behörden-Ersatz. Diese Seite legt offen, wie die Werte entstehen und wo ihre Grenzen liegen.

Grundlage sind 659 recherchierte Orte. In den Layer wandern die 519 geeigneten (`suitable=true`), die restlichen 140 werden ausgefiltert.

## Datenherkunft und Lizenz-Trennung

Der Datensatz mischt zwei Quell-Arten mit getrennter Verantwortung:

- **Geometrie und Basis-Tags: OpenStreetMap.** Standort, Name, Typ, Adresse, Öffnungszeiten-Tag stammen aus OSM (`places-osm.json`). Lizenz: ODbL 1.0, Namensnennung `openstreetmap.org/copyright`. Das MANIFEST-Feld `license` bezieht sich ausschließlich auf diesen Anteil.
- **Redaktionelle Anreicherung: navigator.berlin.** Kühle-Score, AC-Status, Zugang, Sommer-Verfügbarkeit und die Eignungs-Prüfung stammen aus eigener Web-Recherche (`enrichment.json`, Stand 2026-06-30). Dieser Anteil ist ein eigener redaktioneller Datensatz, keine amtliche Quelle, und wird nicht in das ODbL-Feld vermischt.

Join-Key beider Dateien ist `id` in der Form `node/29040741` oder `way/456`. Der Build (`scripts/build-kuehle-orte.ts`) merged beide, filtert `suitable=false` und `still_exists=no` und hängt die Navi-Deep-Links an. Details der Pipeline-Einbindung beschreibt [ADR-020](adr/ADR-020-kuehle-orte-local-source.md).

## Kühle-Score-Rubrik

Der Kühle-Score von 1 bis 5 ordnet ein, wie stark ein Ort kühlt. Er folgt der Bauart und dem Typ, nicht einer Messung:

- **5, sehr kalt:** Eishallen mit gekühlter Fläche.
- **4, deutlich kühl:** klimatisierte Orte (Kino, Mall, Kaufhaus) oder Wasser-Orte (Schwimmhalle).
- **3, kühl:** Massivbauten wie Bibliotheken, Museen, Kirchen.
- **2 und darunter:** geringerer Kühleffekt.

Verteilung im Datensatz (659 Orte): Score 1: 12, Score 2: 135, Score 3: 328, Score 4: 180, Score 5: 4.

Der Score ist eine Einordnung, keine gemessene Temperatur. Er kombiniert Typ, Bauart, Wassernähe und den AC-Status.

## Sommer-Verfügbarkeit

Das Feld `summer_available` sagt, ob ein Ort während einer Sommer-Hitzewelle nutzbar ist:

- **yes:** ganzjährig nutzbar (528 Orte).
- **limited:** eingeschränkt oder saisonal (69 Orte).
- **no:** im Sommer geschlossen, etwa Eishallen im Winterbetrieb oder Schwimmhallen mit Sommerpause (56 Orte).
- **unknown:** nicht belegbar (6 Orte).

Orte mit `no` tragen im Inspector das Badge „im Sommer geschlossen" und werden abgewertet (FR8). Ein Ort kann einen hohen Kühle-Score haben und trotzdem im Sommer geschlossen sein, genau dann, wenn man ihn braucht.

## AC-Ehrlichkeit

Klimatisierung ist selten belegbar. Der `ac_status` unterscheidet:

- **yes, belegt klimatisiert:** 29 Orte.
- **likely, wahrscheinlich klimatisiert:** 151 Orte (typisch für Malls und Kinos).
- **unknown:** 372 Orte.
- **no:** 107 Orte.

Der Inspector zeigt das Badge „klimatisiert" nur bei `yes`. Der AC-Status ist ein Indiz, keine Zusage. Wir versprechen keine garantierte Kühlung.

## Zugang

Das Feld `is_free` kennzeichnet den Zugang: kostenlos (360 Orte), Ticket (266), unbekannt (33). Malls und Bibliotheken sind frei zugänglich, Kinos und Bäder kosten Eintritt.

## Caveats

- **Kein Behörden-Ersatz.** Der Layer ergänzt die Angebote der Stadt Berlin, er ersetzt sie nicht.
- **Kein Anspruch, es besser zu machen.** Ein Angebot auf offenen Daten, keine amtliche Vollständigkeit.
- **Kein Rechtsanspruch auf Zugang.** Private Orte wie Malls und Kinos üben Hausrecht aus.
- **Meldung erwünscht.** Jeder Ort trägt einen Melde-Link (`feedbackMailto`) für Fehler oder Änderungen.
- **Trinkbrunnen bleiben eigener Layer.** Der `trinkbrunnen`-Layer wird nicht dupliziert.

## Quellen

- OpenStreetMap, ODbL 1.0: `https://www.openstreetmap.org/copyright`
- Redaktionelle Anreicherung navigator.berlin, Stand 2026-06-30
- Architektur-Entscheidung: [ADR-020](adr/ADR-020-kuehle-orte-local-source.md)
