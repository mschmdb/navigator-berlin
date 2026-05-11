---
status: Accepted
date: 2026-05-11
deciders: solo-maintainer
---

# ADR-001: Tile-Provider OpenFreeMap mit Protomaps-Hedge

## Context

Phase 1 navigator.berlin braucht Vector-Tile-Source fuer MapLibre. Anforderungen:

- Public-API ohne API-Key fuer Solo-Maintainer-Setup
- EU-Hosting bevorzugt (NFR-S7 vermeidet US-Drittanbieter, aber Tile-CDN-Geo-Fallback erlaubt)
- OpenMapTiles-kompatibles Schema (Standard fuer Vector-Tiles seit Mai 2020+)
- Brand-neutral, kein Logo-Overlay
- Cost-Cap moeglichst kostenfrei in Phase 1, vorhersehbar in Phase 2

Alternativen: self-host PMTiles (Hetzner Object Storage + tilesserver-Container), Mapbox (closed-source, US, API-Key), MapTiler (kostenfrei limitiert, API-Key), Stadia Maps (kostenfrei limitiert).

## Decision

**Default Phase 1: OpenFreeMap (`https://tiles.openfreemap.org`).**

- OpenMapTiles-Schema-kompatibel: Style-JSON aus OpenMapTiles-Beispielen direkt nutzbar
- Public-Instance ohne Quota, kein API-Key
- Glyphs-Hosting kostenfrei mit (Noto Sans Regular verfuegbar fuer Phase-1-Cartography-Baseline)
- EU-Edge-Nodes via Fastly-CDN (Fastly = US-Konzern, aber edge-cached in EU)

**Hedge Phase 1+: Protomaps (`https://api.protomaps.com/v3`).**

- PMTiles-Format (single-file, optimiert), schnellerer Tile-Delivery
- 1M Tiles/Monat free
- Switch via Env-Var `PUBLIC_TILE_URL` + Style-JSON-Anpassung. Runbook: `docs/runbooks/tile-provider-switch.md`

**Style-Cartography:** eigener Plex-Cartography-Style in `static/map-style.json`, Cloud-Dancer-Hintergrund (`#ECEAE0`), Hairline-Roads. Glyphs derzeit von `tiles.openfreemap.org/fonts/Noto Sans Regular/...` weil fontnik-Native-Build auf macOS arm64 blockiert (Mason-Toolchain S3 403). Plex-Glyphs deferred bis fontnik-Fix oder Alternative-Tool (MapLibre FontMaker, build_pbf_glyphs).

**Side-by-Side-Vergleich:** `/_dev/map-style/`-Route rendert Plex-Style links + OpenFreeMap-Liberty-Style rechts fuer Visual-Diff.

## Consequences

### Positive

- Cost-frei Phase 1, vorhersehbar Phase 2 (Protomaps-pay-per-tile)
- Env-Var-Switch erlaubt Provider-Wechsel ohne Code-Change
- OpenMapTiles-Schema bedeutet Style portabel zu anderen Providern
- Cloud-Dancer-Cartography eigen, kein Standard-Mapbox-Look

### Negative

- Public-API-Dependency: OpenFreeMap-Ausfall = navigator.berlin-Karte down (Mitigation: 15-min-Threshold + Runbook fuer Switch)
- Tile-CDN-Edge via Fastly (US-Konzern): nicht 100% NFR-S7-konform aber pragmatisch akzeptiert. Phase-2-Option: self-host PMTiles auf Hetzner
- Plex-Cartography-Vollausbau (eigene Glyphs) blockiert bis fontnik-Issue geloest (Phase 2)
- Style-Schema-Drift bei Protomaps-Switch: source-layer-Namen weichen ab, Style-JSON braucht Anpassung

### CSP-Implikationen (Story 4.2 Setup)

- `connect-src` Required: `tiles.openfreemap.org` (Phase 1), `api.protomaps.com` (Hedge), `self` (Glyphs nach Plex-Fix)
- `img-src` Required: `tiles.openfreemap.org`, `self`, `data:` (MapLibre inline-Sprites falls genutzt)
- `font-src` Required: `self` (Plex woff2)
- `style-src` Required: `self`, `unsafe-inline` (MapLibre injiziert inline-Styles)

### Static-Headers (Story 4.2 Setup)

- `static/glyphs/**`: `Cache-Control: public, max-age=2592000, immutable` (30 Tage, da Glyphs nur via Fontnik-Re-Build invalidiert)
- `static/map-style.json`: `Cache-Control: public, max-age=3600, must-revalidate` (Style-Updates wahrscheinlicher als Glyphs)

## Migration

- Phase 1: OpenFreeMap default, Plex-Cartography-Baseline mit Noto-Sans-Glyphs
- Phase 1+: bei Provider-Issue Env-Var-Switch auf Protomaps (Runbook befolgen)
- Phase 2: Plex-Glyphs lokal nach fontnik-Fix oder Alternative-Tool
- Phase 3: self-host PMTiles falls Cost oder Reliability Issue
