---
type: runbook
audience: owner
last-verified: 2026-05-17
---

# Runbook: Tile-Provider-Switch (OpenFreeMap zu Protomaps)

Status: Phase 1 Default OpenFreeMap, Hedge Protomaps.

## Trigger

- OpenFreeMap-Tiles >15 min nicht erreichbar (Tile-Requests-Timeout im Browser-Network-Tab)
- Performance-Issue (>2s pro Tile im 90.-Perzentil; Lighthouse oder real-user-Metrik)
- Lizenz- oder Politik-Aenderung
- Kosten-Schwelle: OpenFreeMap stellt Public-Hosting ein

## Switch-Procedure

1. **Env-Var aendern (Hetzner/Coolify):**
   - In Coolify-UI > App > Env-Vars: `PUBLIC_TILE_URL=https://api.protomaps.com/v3` (echter Protomaps-Endpoint, ggf. mit Region)
   - Falls Protomaps-API-Key noetig: `PUBLIC_TILE_API_KEY` ergaenzen
   - `.env.example` Default-Wert aktualisieren

2. **`static/map-style.json` anpassen** (Pull-Request im Repo):
   - `sources.openmaptiles.url` von OpenMapTiles-Format auf Protomaps-PMTiles-Format umstellen
   - Layer-`source-layer`-Namen pruefen (PMTiles-Schema weicht ab: `building`, `roads`, `pois` statt OpenMapTiles-Schema)
   - `glyphs`-URL ggf. anpassen (Protomaps hat eigene Font-Endpoints)

3. **Deploy:**
   - `git push origin main` > Coolify-Webhook auto-deployed
   - Build dauert ca. 3-5 min

4. **Verification:**
   - `curl https://navigator.berlin/api/healthz` muss 200 OK liefern
   - Visual-Check: `https://navigator.berlin/de/` zeigt Karte korrekt
   - Konsolen-Check: 0 Tile-404 im Network-Tab
   - Sample-Adresse suchen (Brandenburger Tor) und Karten-Fly-To verifizieren

5. **Rollback (bei Issue):**
   - Env-Var revertieren auf `PUBLIC_TILE_URL=https://tiles.openfreemap.org`
   - `git revert HEAD` falls Style-Anpassung problematisch
   - Re-Deploy

## Cost-Hinweis

- OpenFreeMap: kostenlos, Public-Instance ohne Quota-Cap
- Protomaps: 1M Tiles/Monat free, danach ca. 0.20 USD pro 1M Tiles
- Phase-2-Plan: Protomaps self-hosted via PMTiles-File auf Hetzner Object Storage falls Public-Quota knapp

## Maintainer-Notes

- Erster Switch-Test: TBD (geplant nach Phase-1-Launch)
- Falls beide Provider down: Static-Fallback-Tile-Server in `static/tiles-fallback/` (Phase-3-Option)
- Glyph-Pack-Quelle: derzeit `tiles.openfreemap.org/fonts/...` (Noto Sans Regular). Bei Plex-Cartography-Vollausbau (Phase 2 mit fontnik-fix): eigene `static/glyphs/`
