---
status: Accepted
date: 2026-06-30
deciders: solo-maintainer
relates: Epic 15
---

# ADR-020: Kühle Orte als lokal vorgebaute Layer-Quelle (`kind: 'local'`)

- Status: Accepted
- Date: 2026-06-30
- Deciders: solo-maintainer
- Relates: Epic 15 (Kühle Orte Berlin), docs/kuehle-orte-methodik.md

## Context

Der `kuehle-orte`-Layer entsteht nicht aus einem Live-Fetch, sondern aus zwei committeten lokalen JSON-Dateien: `static/data/kuehle-orte/places-osm.json` (OSM-Geometrie) und `enrichment.json` (redaktionelle Anreicherung, 659 Orte). Die bestehende Pipeline (`scripts/fetch-static.ts`) kannte nur die Quell-Arten `overpass`, `fis-broker`, `odis`, alle holen über das Netz. Für einen Layer aus lokalen, vorgebauten Daten fehlte ein Pfad.

Zusätzlich mischt der Layer zwei Lizenz-Verantwortungen: OSM-Geometrie (ODbL 1.0) und eine eigene redaktionelle Anreicherung ohne fremde Lizenz. Diese Trennung muss im MANIFEST und in der Doku sauber bleiben.

## Decision

Wir führen eine vierte Quell-Art `kind: 'local'` ein.

- **`scripts/lib/sources.ts`:** neuer `SourceConfig` mit `kind: 'local'` und `localPath` auf das vorgebaute GeoJSON.
- **`scripts/fetch-static.ts`:** `fetchSource()`-Switch um `case 'local'` erweitert. Der Fetcher (`scripts/lib/fetchers/local.ts`) liest die Datei von der Platte, kein Netz, keine Allowlist, kein Retry. Der Rest der Pipeline (Simplify `point`, Hash, MANIFEST-Eintrag) bleibt unverändert.
- **`scripts/build-kuehle-orte.ts`:** vorgelagerter Build-Schritt, Vorbild `scripts/build-klima-pet-points.ts`. Er merged `enrichment.json` und `places-osm.json` per `id`, filtert `suitable=false` und `still_exists=no` (mit Logging) und hängt Navi-Deep-Links (Google, Apple) an.
- **Lizenz-Trennung:** Das MANIFEST-Feld `license` trägt `ODbL 1.0` für den OSM-Anteil. Die redaktionelle Anreicherung wird als eigener Datensatz in `docs/kuehle-orte-methodik.md` und über `disclaimerVariants: ['kuehle-orte']` gekennzeichnet, nicht ins ODbL-Feld vermischt.

## Consequences

- Positive: Der Layer läuft durch dieselbe Simplify-/Hash-/Manifest-Mechanik wie jeder andere Punkt-Layer. Deterministischer Build, kein Live-Abruf-Risiko. Ein wiederverwendbarer `local`-Pfad für künftige vorgebaute Layer.
- Negative: Die Daten sind nur so aktuell wie der letzte Build-Lauf. Eine Änderung an OSM oder der Anreicherung erfordert `pnpm data:kuehle-orte` und einen neuen Fetch-Lauf.
- Migration: Kein Bruch an bestehenden Quell-Arten. Der `default`-Zweig im Switch wirft weiter für echte Unknown-Kinds.

## Alternatives-Considered

- **Overpass-Live-Layer ohne Anreicherung.** Verworfen: die wertenden Felder (Kühle-Score, AC-Status, Sommer-Verfügbarkeit) existieren nur in der redaktionellen Anreicherung, nicht in OSM.
- **Reiner Remote-Fetch ohne Merge.** Verworfen: es gibt keine einzelne Remote-Quelle, die Geometrie und Anreicherung zusammen liefert. Der Merge muss lokal zur Build-Zeit passieren.
