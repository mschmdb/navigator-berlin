"""Wärme-Orte (#61): zieht OSM-Kandidaten aus dem Geofabrik-Berlin-Extrakt.

Aufruf (Repo-Root):
  uv run -q --no-project --with osmium python -I scripts/osm/extract-waerme-orte.py \
    /tmp/osm-berlin/berlin-latest.osm.pbf static/data/waerme-orte/places-osm.json

Download des Extrakts: https://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf

Das Skript sammelt grob nach Kategorie-Tags. Die Ausschlussregeln liegen allein in
scripts/lib/waerme-orte/filter.ts. Ausgabe ist deterministisch: Der Stand stammt aus dem
PBF-Header, die Orte sind nach id sortiert, es gibt keinen Laufzeit-Zeitstempel.
"""

import json
import sys

import osmium

SOURCE = "Geofabrik Berlin-Extrakt (OpenStreetMap)"
EXTRACT_URL = "https://download.geofabrik.de/europe/germany/berlin-latest.osm.pbf"
ATTRIBUTION = "© OpenStreetMap-Mitwirkende, ODbL 1.0, https://www.openstreetmap.org/copyright"
FILTER_DESCRIPTION = (
    "amenity=library | shop=mall | shop=department_store | tourism=museum | "
    "amenity=community_centre | amenity=place_of_worship; Ausschlüsse in scripts/lib/waerme-orte/filter.ts; "
    "nur Punkte innerhalb der Landesgrenze (OSM-Relation 62422)"
)

# Nur diese Tags landen im Snapshot (Filter-Eingaben).
KEPT_TAGS = (
    "amenity",
    "shop",
    "tourism",
    "fee",
    "access",
    "community_centre",
    "social_facility",
    "religion",
)


def is_category(tags) -> bool:
    return (
        tags.get("amenity") in ("library", "community_centre", "place_of_worship")
        or tags.get("shop") in ("mall", "department_store")
        or tags.get("tourism") == "museum"
    )


def address(tags) -> str:
    street = tags.get("addr:street", "")
    number = tags.get("addr:housenumber", "")
    return f"{street} {number}".strip()


def build_place(object_id, lat, lon, tags):
    return {
        "id": object_id,
        "name": tags.get("name", ""),
        "lat": round(lat, 7),
        "lon": round(lon, 7),
        "addr": address(tags),
        "plz": tags.get("addr:postcode", ""),
        "oh": tags.get("opening_hours", ""),
        "wheelchair": tags.get("wheelchair", ""),
        "website": tags.get("website") or tags.get("contact:website") or "",
        "tags": {key: tags[key] for key in KEPT_TAGS if key in tags},
    }


def ring_area(points) -> float:
    """Fläche eines Rings (Shoelace), absolut."""
    total = 0.0
    for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1]):
        total += x0 * y1 - x1 * y0
    return abs(total) / 2


def ring_centroid(points):
    """Flächenschwerpunkt eines Rings aus (lon, lat)-Punkten (Shoelace), Fallback Mittel."""
    area2 = 0.0
    cx = 0.0
    cy = 0.0
    for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1]):
        cross = x0 * y1 - x1 * y0
        area2 += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(area2) < 1e-18:
        return (
            sum(p[0] for p in points) / len(points),
            sum(p[1] for p in points) / len(points),
        )
    return cx / (3 * area2), cy / (3 * area2)


BERLIN_RELATION_ID = 62422
# Plausibilitätsprüfung der Grenze: alle behaltenen Punkte liegen in dieser Box.
BERLIN_BBOX = (13.08, 52.33, 13.77, 52.68)


def point_in_rings(lon, lat, rings) -> bool:
    """Even-odd-Test über alle Ringe (Außen- und Innenringe, Löcher fallen heraus)."""
    inside = False
    for ring in rings:
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
    return inside


def selftest() -> None:
    square = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    hole = [(4.0, 4.0), (6.0, 4.0), (6.0, 6.0), (4.0, 6.0)]
    assert point_in_rings(1, 1, [square])
    assert not point_in_rings(11, 5, [square])
    assert not point_in_rings(5, 5, [square, hole])
    assert point_in_rings(2, 5, [square, hole])
    assert ring_area(square) == 100.0
    assert ring_centroid(square) == (5.0, 5.0)
    triangle = [(0.0, 0.0), (6.0, 0.0), (0.0, 6.0)]
    assert ring_centroid(triangle) == (2.0, 2.0)


def main(pbf_path: str, out_path: str) -> None:
    selftest()
    places = {}
    boundary_rings = []
    stats = {"nodes": 0, "ways": 0, "relations": 0, "ohne_mittelpunkt": 0}

    # Areas entstehen aus Ways und Relations, deshalb liest der Processor alle vier Typen.
    entity_types = osmium.osm.NODE | osmium.osm.WAY | osmium.osm.RELATION | osmium.osm.AREA
    processor = osmium.FileProcessor(pbf_path, entity_types).with_areas()
    for obj in processor:
        if obj.is_area() and not obj.from_way() and obj.orig_id() == BERLIN_RELATION_ID:
            for outer in obj.outer_rings():
                boundary_rings.append([(n.lon, n.lat) for n in outer])
                boundary_rings.extend(
                    [(n.lon, n.lat) for n in inner] for inner in obj.inner_rings(outer)
                )
            continue
        if not (obj.is_node() or obj.is_area()) or not is_category(obj.tags):
            continue
        tags = {tag.k: tag.v for tag in obj.tags}
        if obj.is_node():
            if not obj.location.valid():
                stats["ohne_mittelpunkt"] += 1
                continue
            places[f"node/{obj.id}"] = build_place(
                f"node/{obj.id}", obj.location.lat, obj.location.lon, tags
            )
            stats["nodes"] += 1
            continue
        kind = "way" if obj.from_way() else "relation"
        try:
            rings = [[(n.lon, n.lat) for n in ring] for ring in obj.outer_rings()]
            largest = max(rings, key=ring_area)
            lon, lat = ring_centroid(largest)
        except (RuntimeError, ValueError):
            stats["ohne_mittelpunkt"] += 1
            continue
        object_id = f"{kind}/{obj.orig_id()}"
        places[object_id] = build_place(object_id, lat, lon, tags)
        stats["ways" if kind == "way" else "relations"] += 1

    if not boundary_rings:
        sys.exit(f"Berliner Landesgrenze (relation/{BERLIN_RELATION_ID}) nicht im PBF")
    outside = sorted(
        key for key, p in places.items() if not point_in_rings(p["lon"], p["lat"], boundary_rings)
    )
    for key in outside:
        del places[key]
    stats["ausserhalb_berlin"] = len(outside)
    west, south, east, north = BERLIN_BBOX
    for p in places.values():
        assert west <= p["lon"] <= east and south <= p["lat"] <= north, p["id"]

    header = osmium.io.Reader(pbf_path).header()
    snapshot = {
        "meta": {
            "source": SOURCE,
            "extract_url": EXTRACT_URL,
            "osm_timestamp": header.get("osmosis_replication_timestamp"),
            "osm_attribution": ATTRIBUTION,
            "filter": FILTER_DESCRIPTION,
            "stats": {**stats, "gesamt": len(places)},
        },
        "places": [places[key] for key in sorted(places)],
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent="\t")
        handle.write("\n")
    print(f"{len(places)} Objekte geschrieben nach {out_path}; {stats}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Aufruf: extract-waerme-orte.py <berlin.osm.pbf> <places-osm.json>")
    main(sys.argv[1], sys.argv[2])
