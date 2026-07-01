# Story 10.6: Lärm-dB-Upgrade · Spike (V6)

Status: done

> **Ergebnis:** Strategische Lärmkarten 2022 = WFS-Vektor (`ua_stratlaerm_2022`), KEIN Raster. dB als 3,8 Mio Fassadenpunkte (aa_fp_gesamt2022.ges_den), keine Iso-Flächen-Polygone; dc/da/db/dd/de sind Quell-Linien mit Verkehrsmengen ohne dB. Entscheidung: Folge-Story (kein Defer, da vektorbasiert/kein Tile-Blocker). 10-6b = Per-LOR-dB-Mittel zuerst (M-L), adress-genau via PMTiles später (L-XL). Doku: docs/spikes/laerm-db-upgrade-2026.md.

> **Anker:** Datenauflösungs-Audit 2026-05-21 (`_user-input/datenaufloesung-audit-2026-05-21.md`, Abschnitt V6, Zeilen 174-178). Hängt nicht von anderen Epic-10-Stories ab. Ergebnis entscheidet, ob eine Folge-Story (Tile-Integration) entsteht oder V6 bewusst deferred wird.

> **TDD-Ausnahme (ADR-012):** Spikes sind explizit vom Test-First-Mandat ausgenommen. Ergebnis ist Dokumentation + Entscheidung, kein Produktivcode. Falls ein Prototyp-Script entsteht, gilt TS strict (kein `any`), aber keine Red-Green-Pflicht.

## Story

As a Solo-Maintainer,
I want prüfen, ob die Strategischen Lärmkarten 2022 (fassadengenaue dB) den 3-Stufen-Umweltgerechtigkeits-Index ersetzen können,
so that ich entscheiden kann, ob „Ruhe & Luft" feiner auflöst oder V6 aus gutem Grund deferred bleibt.

## Kontext: Ist-Zustand und Auflösungs-Problem

Der aktuelle `laerm-2023`-Layer zieht `ua_umweltgerechtigkeit2023:a_laerm2023` (FIS-Broker WFS). Das Schema liefert:

```
plr_id · plr_name · kategorie (gering/mittel/hoch) · geom (MultiPolygon)
```

542 LOR-Planungsraum-Polygone, je ~7.500 Einwohner. Die `normalizeOrdinal3`-Funktion (`scripts/lib/kiez-score/normalize.ts`, Zeile 21-25) verarbeitet die drei Stufen direkt: gering = 100, mittel = 50, hoch = 0.

Das Problem: Lärm variiert straßenweise. Ein Polygon mittelt Hauptstraße und Hinterhof auf eine Stufe. Das ist laut Audit die größte einzelne Auflösungs-Schwäche im Score.

**Verfügbar:** Strategische Lärmkarten 2022 (`07.05` im Umweltatlas), L_DEN + L_Night, fassadengenaue dB, kontinuierlich. Quelle: `daten.berlin.de/datensaetze/strategische-larmkarten-2022-umweltatlas-wfs`.

Vergleichspräzedenz: `solarpotenzial` und `klimaanalyse` wurden wegen Tile-Last deferred (analoges Pattern für die Entscheidung).

## Acceptance Criteria

1. **AC-1 (Format + Größe evaluiert):**
   **Given** die Strategischen Lärmkarten 2022 (L_DEN + L_Night, Raster/GeoTIFF)
   **When** ich Format, Dateigröße und Struktur prüfe
   **Then** ein Spike-Dokument dokumentiert: Rasterauflösung, Dateivolumen (roh + komprimiert), verfügbare Koordinatensysteme und Lizenz

2. **AC-2 (Integrationsweg bewertet):**
   **Given** die Formatprüfung aus AC-1
   **When** ich den Integrationsweg evaluiere
   **Then** das Spike-Dokument hält fest: ob Tile-Pipeline (PMTiles/MVT) nötig ist, welcher Build-Aufwand entsteht, wie die Hit-Strategie für Adress-Lookup funktioniert (Punkt-in-Raster per GDAL oder WCS-Query)

3. **AC-3 (Entscheidung dokumentiert):**
   **Given** das Spike-Ergebnis
   **When** ich entscheide
   **Then** das Spike-Dokument schließt mit entweder: (a) Folge-Story-Spec (Tile-Integration, Aufwand-Schätzung, Link zur neuen Story-Datei) oder (b) bewusstem Defer mit Begründung analog `solarpotenzial`/`klimaanalyse` (Tile-Last, Komplexität, Nutzen-Kosten)

## Tasks / Subtasks

- [ ] **Task 1: Quelle prüfen** (AC: #1)
  - [ ] 1.1 WFS-Endpoint `daten.berlin.de/datensaetze/strategische-larmkarten-2022-umweltatlas-wfs` aufrufen, GetCapabilities lesen
  - [ ] 1.2 Layer-Namen für L_DEN und L_Night identifizieren (typeName-Muster wie `ua_laerm2022:l_den` oder ähnlich)
  - [ ] 1.3 Alternativ-Endpunkt für GeoTIFF/Raster prüfen (WCS oder direkter Download-Link auf daten.berlin.de)
  - [ ] 1.4 CRS dokumentieren (WGS84 oder UTM33, vergleiche ODIS-Praxis in `project_odis_crs_mixed`)
  - [ ] 1.5 Lizenzbedingungen festhalten (dl-de/zero oder by)

- [ ] **Task 2: Volumenschätzung** (AC: #1, #2)
  - [ ] 2.1 Rasterauflösung ermitteln (typisch 10m oder 25m Grid)
  - [ ] 2.2 Dateigröße roh ermitteln (wget mit `-S` oder HEAD-Request, nicht vollständig downloaden)
  - [ ] 2.3 PMTiles/MVT-Schätzung: bei Rasterdaten Größe nach rio-cogeo-Konvertierung grob abschätzen (Vergleich: `solarpotenzial`-GeoTIFF als Referenz-Benchmark, falls dokumentiert)
  - [ ] 2.4 WFS-Vektor-Alternative prüfen: liefert der Dienst auch Isoflächen-Polygone statt Raster? Falls ja, Komplexität und Attribut-Schema prüfen

- [ ] **Task 3: Hit-Strategie evaluieren** (AC: #2)
  - [ ] 3.1 Punkt-in-Raster via GDAL `gdallocationinfo`: Machbarkeit für Build-Time-Lookup (LOR-Centroid → dB-Wert)
  - [ ] 3.2 Alternativer Weg: WCS GetCoverage für Punkt-Query zur Build-Zeit (kein lokaler Download nötig)
  - [ ] 3.3 Normalisierungs-Strategie: dB-Wert (z.B. L_DEN 45-75 dB) auf 0-100 mappen via `normalizeNumericInverted` (bereits in `scripts/lib/kiez-score/normalize.ts`, Zeile 49-58)
  - [ ] 3.4 Aufwand-Vergleich: LOR-Centroid-Lookup (Build-Time, kein Tile-Serve) vs. fassadengenaue Live-Abfrage (Tile-Pipeline nötig)

- [ ] **Task 4: Entscheidung und Dokumentation** (AC: #3)
  - [ ] 4.1 Spike-Ergebnis-Dokument schreiben: `docs/spikes/laerm-db-upgrade-2026.md`
  - [ ] 4.2 Entscheidungs-Gate: Folge-Story oder Defer (Begründung vergleichbar mit deferred Tile-Layer in `sources.ts` Zeile 73-80)
  - [ ] 4.3 Falls Folge-Story: Story-Datei-Stub anlegen (`_bmad-output/implementation-artifacts/10-6b-laerm-tile-integration.md`), Aufwand schätzen (T-Shirt-Sizing: S/M/L/XL)
  - [ ] 4.4 Falls Defer: Memory-Update vorschlagen (analog `project_popover_overflow_clipping` Pattern)

## Dev Notes

### Ist-Zustand laerm-Layer

`scripts/lib/sources.ts`, Zeilen 110-120:
```ts
{
  slug: 'laerm-2023',
  kind: 'fis-broker',
  sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
  typeName: 'ua_umweltgerechtigkeit2023:a_laerm2023',
  license: 'dl-de/zero-2-0',
  bundleGroup: 'C: Umwelt',
  zoomThresholds: { min: 9, max: 18 },
  simplifyProfile: 'polygon',
  sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
}
```

Normalisierung in `scripts/lib/kiez-score/normalize.ts`:
```ts
export const ORDINAL_3 = { gering: 100, mittel: 50, hoch: 0 } as const;
```

`normalizeOrdinal3` (Zeile 21-25) prüft Membership in `ORDINAL_3` und gibt den Festwert zurück. Keine Interpolation. Das ist quellmäßig korrekt, aber die Quelle selbst ist das Problem.

### Quell-Vergleich

| Eigenschaft | Ist (Umweltgerechtigkeit 2023) | Soll (Strategische Lärmkarte 2022) |
|---|---|---|
| Granularität | 542 LOR-Polygone | Fassadengenau (Raster ~10-25m oder Punkt) |
| Metrik | 3-Stufen-Index (gering/mittel/hoch) | L_DEN / L_Night in dB(A) |
| Quelle | `ua_umweltgerechtigkeit2023:a_laerm2023` | Umweltatlas `07.05`, WFS/GeoTIFF |
| Auflösungs-Gewinn | Basis | Höchster Einzelgewinn im Score |
| Normalisierung | `normalizeOrdinal3` (fix 3 Punkte) | `normalizeNumericInverted` (kontinuierlich) |

### Tile-Strategie-Frage

ADR-001 (`docs/adr/ADR-001-tile-provider.md`) beschreibt den Self-Host-PMTiles-Pfad auf Hetzner Object Storage als Phase-2-Option. Raster-Lärmkarten erfordern entweder:

- **Build-Time-Lookup (bevorzugt falls machbar):** LOR-Centroids einmalig gegen Raster-Punkt abfragen (GDAL oder WCS). Ergebnis als JSON in der Build-Pipeline, kein Tile-Serve nötig. Analogie: `fetch-static.ts` mit `detectGeoJsonCrs`-Heuristik.
- **PMTiles-Pipeline (teurer):** GeoTIFF → PMTiles konvertieren, Hetzner Object Storage, `tilesserver`-Container. Analogie: `solarpotenzial`/`klimaanalyse`, die aus genau diesem Grund deferred wurden.

Der Build-Time-Lookup ist der Schlüsselpfad. Wenn L_DEN als WCS-Dienst Punkt-Queries erlaubt, entfällt die Tile-Pipeline. Das ist die zentrale Frage dieses Spikes.

### Normalisierungs-Vorbereitung

`normalizeNumericInverted` ist bereits implementiert (`normalize.ts`, Zeile 49-58). Plausible Parametrisierung für L_DEN:

- `bestAt`: 45 dB (WHO-Empfehlung Nacht, sehr ruhig)
- `worstAt`: 75 dB (starke Belastung, Hauptstraße Innenstadt)

Das sind Richtwerte. Der Spike soll den tatsächlichen Wertebereich aus den Berliner Daten ermitteln und Parametrisierung validieren. Keine feste Entscheidung vor der Recherche.

### Analogie-Precedenz: deferred Tile-Layer

`sources.ts`, Zeilen 73-80 (Kommentar zu `mietspiegel-wohnlage`):
```
// TODO: mietspiegel-wohnlage (~600k Adress-Polygone, 116MB simplified). Vertex-Simplify hilft nicht
// (Polygone bereits klein). Defer bis Tile-Strategy (PMTiles/MVT) oder Dissolve-by-wohnlage.
```

Gleiche Argumentationsstruktur soll für V6-Defer gelten, falls Tile-Pipeline unumgänglich und Aufwand unverhältnismäßig. Konkrete Begründung im Spike-Dokument.

### Output-Ort

Spike-Ergebnis nach `docs/spikes/laerm-db-upgrade-2026.md`. Das Verzeichnis existiert noch nicht. Task 4.1 legt es an. Kein eigener ADR nötig (Spike != Decision Record). Falls Defer: Begründung kann kurz in Dev Agent Record dieser Story stehen, Volltext in `docs/spikes/`.

### Architektur-MUST-Rules (relevant für Spike)

- **Rule #2:** Files <500 Zeilen. Spike-Dokument ist Prosa, kein Problem. Prototyp-Script falls erstellt ebenfalls.
- **Rule #7:** TS strict, kein `any`. Falls ein Prototyp-Script entsteht.
- **Rule #15:** Editorial-Verantwortung. dB ist metrisch, keine Besser-Richtung-Ambiguität: weniger Lärm = besser. Kein editorial-Review nötig vor dem Spike, aber vor Produktiv-Integration.

### Previous Story Intel

- **Story 1.10 (deferred):** `wohnlagen-2024` PMTiles-Pfad archiviert. Bewusster Tradeoff dokumentiert. Referenz-Pattern für Defer-Begründung.
- **Story 1.28:** `laerm-2023` erstmals integriert als Ersatz für `strassenlaerm-2022` (LineStrings). Der Kommentar in `sources.ts` Zeile 109 erklärt das.
- **Story 9.1:** `ruhe-luft`-Dimension enthält nur noch `laerm-2023` (0.5) + `luft-2023` (0.5). Bioklima ist raus. Upgrade würde `laerm-2023`-Eintrag in `sources.ts` und `dimension-config.ts` ersetzen.
- **Memory `project_odis_crs_mixed`:** Berlin-Geodaten mischen UTM33 und WGS84. CRS-Prüfung in Task 1.4 ist Pflicht.

### Scope-Grenze

Dieser Spike schreibt keinen Produktivcode, der in die App deployed wird. Der Scope endet mit dem Dokument in `docs/spikes/` und der Entscheidung. Eine Folge-Story-Stub ist Output, keine Implementierung.

## References

- [Source: _user-input/datenaufloesung-audit-2026-05-21.md#V6, Zeilen 174-178]
- [Source: _user-input/datenaufloesung-audit-2026-05-21.md#Lärm-grobe-Quelle, Zeilen 76-89]
- [Source: scripts/lib/sources.ts#laerm-2023, Zeilen 109-120]
- [Source: scripts/lib/kiez-score/normalize.ts#normalizeOrdinal3, Zeilen 1-25]
- [Source: scripts/lib/kiez-score/normalize.ts#normalizeNumericInverted, Zeilen 49-58]
- [Source: docs/adr/ADR-001-tile-provider.md#PMTiles-Self-Host]
- [Source: docs/adr/ADR-012-tdd-mandate.md] (Spike-Ausnahme)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-10.6, Zeilen 3520-3534]
- [Extern: https://daten.berlin.de/datensaetze/strategische-larmkarten-2022-umweltatlas-wfs]

## Dev Agent Record

### Agent Model Used

(noch nicht zugewiesen)

### Debug Log References

(Spike: kein Red/Green-Zyklus)

### Completion Notes List

### File List
