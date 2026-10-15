# Story 10.6b: Lärm-dB Per-LOR-Aggregat (Variante A aus Spike 10.6)

Status: done

> **Umsetzung:** build-laerm-db-lor.ts pagt 3,8 Mio Fassadenpunkte (ua_stratlaerm_2022:aa_fp_gesamt2022), ordnet via Point-in-Polygon (LOR nach UTM33 reprojiziert, BBox-Prefilter) zu, mittelt ges_den → 542 LOR (36-68 dB, Median 49), static/data/laerm-db-lor.json (45K). Ruhe-Luft-Score: laerm-2023 ordinal-3 → laerm-db numeric-inverted (bestAt 45 / worstAt 75) via perLorHits. laerm-2023 bleibt Map-Layer. aggregate-db.ts(+test, 5 grün), 2024/2024 Server-Suite, 0 Type-Errors. Methodik aktualisiert. Re-run: pnpm data:laerm-db (~570 MB WFS-Transfer, einmalig bei Quell-Update).

> **Quelle:** Spike 10.6 (`docs/spikes/laerm-db-upgrade-2026.md`). Strategische Lärmkarten 2022 = WFS-Vektor `ua_stratlaerm_2022`, dB als 3,8 Mio Fassadenpunkte `aa_fp_gesamt2022.ges_den` (L_DEN). Kein Raster, kein Tile-Zwang.

## Story

As a User,
I want dass „Ruhe & Luft" den Lärm in dB misst statt nur in 3 groben Stufen,
so that der Score feiner zwischen ruhigen und lauten Kiezen unterscheidet.

## Ansatz (Variante A)

Per-LOR-Mittel von `ges_den` (L_DEN) aus den Fassadenpunkten. Build-Time:
WFS-Paging über 3,8 Mio Punkte, Punkt→LOR via Point-in-Polygon (UTM33),
Mittel pro Planungsraum → kleines JSON. Score liest dB-Mittel via
`normalizeNumericInverted` (bestAt 45 dB, worstAt 75 dB) statt 3-Stufen-Ordinal.

`laerm-2023` (3-Stufen-Choropleth) bleibt als Map-Layer. Score-Input wechselt
auf dB. No-Data (LOR ohne Fassadenpunkt) → Term null, Ruhe-Luft fällt auf Luft.

## Acceptance Criteria

1. Build-Script aggregiert `ges_den` pro LOR (Mittel), schreibt `static/data/laerm-db-lor.json`.
2. Punkt→LOR-Zuordnung via Point-in-Polygon (UTM33), getestet (innen/außen/bbox-Prefilter).
3. Ruhe-Luft-Score nutzt dB-Mittel (`normalizeNumericInverted`, bestAt 45 / worstAt 75) statt `laerm-2023` ordinal.
4. No-Data-LOR → null, kein Crash. TDD für Aggregation + Normalisierungs-Anbindung.
5. Score neu berechnet, Tests grün, `pnpm check` 0 Errors.

## Dev Agent Record

### Completion Notes List

(wird ausgefüllt)
