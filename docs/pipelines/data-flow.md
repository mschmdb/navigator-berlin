---
type: pipeline
audience: both
last-verified: 2026-06-07
related:
  - docs/INDEX.md
  - docs/recovery/wiedereinstieg.md
---

# Data-Flow-Atlas

Auto-generiert via `pnpm doc:pipelines` aus `scripts/lib/sources.ts`. Stand: 2026-06-07.

**50 Layer total**, gruppiert nach Bundle.

## Pro-Bundle-Übersicht
### A: Boundaries

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `bezirke` | odis | daten.odis-berlin.de/de/dataset/bezirksgrenzen/data.geojson | dl-de/zero-2-0 | 2024-01-01 |
| `ortsteile` | odis | daten.odis-berlin.de/de/dataset/ortsteile/data.geojson | dl-de/zero-2-0 | 2024-01-01 |
| `plz` | odis | daten.odis-berlin.de/de/dataset/plz/data.geojson | dl-de/zero-2-0 | 2024-01-01 |
| `lor-bezirksregion` | odis | daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson | dl-de/zero-2-0 | 2021-01-01 |
| `lor-planungsraum` | odis | daten.odis-berlin.de/de/dataset/lor_planungsgraeume_2021/data.geojson | dl-de/zero-2-0 | 2021-01-01 |

### B: Wohn-Daten

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `bodenrichtwerte` | fis-broker | gdi.berlin.de/services/wfs/brw2026 | dl-de/by-2-0 | 2026-01-01 |
| `wohnlagen-2024` | fis-broker | gdi.berlin.de/services/wfs/wohnlagenadr2024 | dl-de/by-2-0 | 2024-06-10 |
| `milieuschutz-erhaltungsmiete` | fis-broker | gdi.berlin.de/services/wfs/erhaltungsverordnungsgebiete | dl-de/zero-2-0 | 2025-01-01 |
| `milieuschutz-staedtebau` | fis-broker | gdi.berlin.de/services/wfs/erhaltungsverordnungsgebiete | dl-de/zero-2-0 | 2025-01-01 |
| `mss-gesamtindex-2025` | fis-broker | gdi.berlin.de/services/wfs/mss_2025 | dl-de/zero-2-0 | 2024-12-01 |

### C: Umwelt

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `laerm-2023` | fis-broker | gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023 | dl-de/zero-2-0 | 2024-01-01 |
| `luft-2023` | fis-broker | gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023 | dl-de/zero-2-0 | 2024-01-01 |
| `gruenversorgung-2023` | fis-broker | gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023 | dl-de/zero-2-0 | 2024-01-01 |
| `bioklima-2023` | fis-broker | gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023 | dl-de/zero-2-0 | 2024-01-01 |
| `umweltgerechtigkeit-2023` | fis-broker | gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023 | dl-de/zero-2-0 | 2024-01-01 |
| `trinkbrunnen` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `klima-pet-2022` | fis-broker | gdi.berlin.de/services/wfs/ua_klimaanalyse_2022 | dl-de/zero-2-0 | 2024-06-01 |
| `klima-kaltlufteinwirkbereich-2022` | fis-broker | gdi.berlin.de/services/wfs/ua_klimaanalyse_2022 | dl-de/zero-2-0 | 2024-06-01 |
| `klima-leitbahnkorridor-2022` | fis-broker | gdi.berlin.de/services/wfs/ua_klimaanalyse_2022 | dl-de/zero-2-0 | 2024-06-01 |
| `gruenanlagen` | fis-broker | gdi.berlin.de/services/wfs/gruenanlagen | dl-de/zero-2-0 | 2026-04-09 |

### D: Memorial

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `stolpersteine` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `denkmal-2024` | fis-broker | gdi.berlin.de/services/wfs/denkmale | dl-de/by-2-0 | 2024-01-01 |

### E: Soziale Infrastruktur

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `nahversorgung-lebensmittel` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `nahversorgung-apotheke` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `nahversorgung-post` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kitas-2024` | fis-broker | gdi.berlin.de/services/wfs/kita | dl-de/zero-2-0 | 2024-12-31 |
| `schulen-2024` | fis-broker | gdi.berlin.de/services/wfs/schulen | dl-de/zero-2-0 | 2025-01-01 |
| `einschulbereiche-2024` | fis-broker | gdi.berlin.de/services/wfs/schulen | dl-de/zero-2-0 | 2025-01-01 |
| `krankenhaeuser-plan` | fis-broker | gdi.berlin.de/services/wfs/krankenhaeuser | dl-de/zero-2-0 | 2023-03-30 |
| `krankenhaeuser-weitere` | fis-broker | gdi.berlin.de/services/wfs/krankenhaeuser | dl-de/zero-2-0 | 2023-03-30 |
| `sportanlagen-2024` | fis-broker | gdi.berlin.de/services/wfs/sportstandorte | dl-de/zero-2-0 | 2025-07-30 |
| `spielplaetze` | fis-broker | gdi.berlin.de/services/wfs/gruenanlagen | dl-de/zero-2-0 | 2026-04-09 |
| `schwimmbaeder` | fis-broker | gdi.berlin.de/services/wfs/schwimmbaeder_berlin | dl-de/zero-2-0 | 2026-04-21 |

### F: Mobilität

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `radverkehrsnetz-2025` | fis-broker | gdi.berlin.de/services/wfs/radverkehrsnetz | dl-de/zero-2-0 | 2025-07-07 |
| `fahrradstrassen-2024` | fis-broker | gdi.berlin.de/services/wfs/fahrradstrassen | dl-de/zero-2-0 | 2024-06-07 |
| `ubahn-stationen` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `sbahn-stationen` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `tram-haltestellen` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `bus-haltestellen` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `ubahn-netz` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `tram-netz` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `sbahn-netz` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |

### J: Kultur

| Slug | Kind | Source | Lizenz | Stand |
|---|---|---|---|---|
| `kultur-museum` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-galerie` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-kunst-im-raum` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-theater` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-bibliothek` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-kino` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-soziokultur` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |
| `kultur-club` | overpass | overpass-api.de/api/interpreter | ODbL 1.0 | — |

