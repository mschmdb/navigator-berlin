#!/usr/bin/env python3
"""Generate navigator.berlin Logo-Geometrie aus echtem Berlin-GeoJSON.

Pipeline:
  1. bezirke.*.geojson laden (12 Bezirks-Polygone)
  2. Außenkontur via unary_union vereinen
  3. Hauptpolygon nach Area extrahieren
  4. Douglas-Peucker simplify auf ~32 Punkte
  5. Delaunay-Triangulation der Boundary-Punkte
  6. Innere Dreiecke filtern (Zentroid in Polygon)
  7. Auf 100×100 SVG-Canvas mappen (linear, Y-flip, mit Padding)

Output:
  - SVG-Files (static/logo-mark.svg, logo-mark-header.svg, favicon.svg)
  - TS-Geometry-Module (src/lib/data/logo-geometry.ts)
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from shapely.geometry import LineString, Point, Polygon, MultiPolygon, shape
from shapely.ops import transform, triangulate, unary_union

ROOT = Path(__file__).resolve().parent.parent
GEOJSON = ROOT / "static" / "layers" / "bezirke.c8a6e03b.geojson"
SVG_DIR = ROOT / "static"
TS_OUT = ROOT / "src" / "lib" / "data" / "logo-geometry.ts"

CANVAS = 100.0
PADDING = 8.0  # bleibt Platz für Stroke + Datenpunkte am Rand
TARGET_POINTS = 32

ACCENT = "#2A3F7C"
BG = "#ECEAE0"


def load_outer_polygon(path: Path) -> Polygon:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    geoms = [shape(feat["geometry"]) for feat in data["features"]]
    merged = unary_union(geoms)
    if isinstance(merged, Polygon):
        poly = merged
    elif isinstance(merged, MultiPolygon):
        poly = max(merged.geoms, key=lambda p: p.area)
    else:
        raise SystemExit(f"unexpected merged geometry type: {type(merged)}")
    # Cosine-Lat-Korrektur: 1° Lng ≈ cos(lat) × 1° Lat in Meter. Bei Berlin (52.5°N) ist
    # die Stadt ohne Korrektur ~2:1 breit-flach statt der echten ~1.2:1 Proportion.
    median_lat = (poly.bounds[1] + poly.bounds[3]) / 2
    cos_lat = math.cos(math.radians(median_lat))
    return transform(lambda x, y, z=None: (x * cos_lat, y), poly)


def simplify_to_n(poly: Polygon, target: int) -> Polygon:
    """Binary-search Douglas-Peucker tolerance bis Punkt-Anzahl in Zielbereich."""
    lo, hi = 0.00001, 0.05
    best = poly
    for _ in range(40):
        mid = (lo + hi) / 2
        candidate = poly.simplify(mid, preserve_topology=True)
        if isinstance(candidate, MultiPolygon):
            candidate = max(candidate.geoms, key=lambda p: p.area)
        n = len(candidate.exterior.coords) - 1  # -1 because closed ring repeats start
        if n > target:
            lo = mid
        elif n < target:
            hi = mid
        else:
            return candidate
        best = candidate
    return best


def map_to_canvas(coords, bounds, canvas: float, pad: float) -> list[tuple[float, float]]:
    """Linear scale lng/lat auf 100×100 mit Y-Flip + Padding. Aspekt erhalten."""
    minx, miny, maxx, maxy = bounds
    inner = canvas - 2 * pad
    sx = inner / (maxx - minx)
    sy = inner / (maxy - miny)
    s = min(sx, sy)
    # zentrieren wenn aspect mismatch
    used_w = (maxx - minx) * s
    used_h = (maxy - miny) * s
    offset_x = pad + (inner - used_w) / 2
    offset_y = pad + (inner - used_h) / 2
    mapped = []
    for x, y in coords:
        px = offset_x + (x - minx) * s
        py = offset_y + (maxy - y) * s  # Y-Flip: höhere lat = oben in SVG
        mapped.append((round(px, 2), round(py, 2)))
    return mapped


def interior_anchors(poly: Polygon, n_target: int = 4) -> list[tuple[float, float]]:
    """Wenige gleichmäßig verteilte Stützpunkte im Inneren, damit Delaunay nicht
    von einem zentralen Vertex aus fan-pattern produziert. Konzeptionell:
    Vermessungs-Triangulationspunkte. Halton-2-3-Sequenz auf Bounding-Box,
    gefiltert auf 'in Polygon' (mit Mindest-Abstand zur Boundary)."""
    minx, miny, maxx, maxy = poly.bounds
    w, h = maxx - minx, maxy - miny
    inset = poly.buffer(-min(w, h) * 0.08)  # Mindest-Abstand zur Boundary
    if inset.is_empty:
        inset = poly

    def halton(i: int, base: int) -> float:
        f, r = 1.0, 0.0
        while i > 0:
            f /= base
            r += f * (i % base)
            i //= base
        return r

    found: list[tuple[float, float]] = []
    i = 1
    while len(found) < n_target and i < 200:
        x = minx + halton(i, 2) * w
        y = miny + halton(i, 3) * h
        p = Point(x, y)
        if inset.contains(p) and all(p.distance(Point(q)) > min(w, h) * 0.18 for q in found):
            found.append((round(x, 2), round(y, 2)))
        i += 1
    return found


def delaunay_edges(boundary_pts: list[tuple[float, float]], anchor_pts: list[tuple[float, float]], canvas_poly: Polygon) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    """Triangulation aller (boundary + anchor) Punkte. Kanten behalten wenn:
    1. Komplette Edge liegt innerhalb canvas_poly (kein cut durch Außenraum)
    2. Edge ist NICHT ein Boundary-Segment (das zeichnen wir mit Outline)
    """
    all_pts = list(boundary_pts) + list(anchor_pts)
    multi = Polygon(boundary_pts)  # outer ring zum filter
    tris = triangulate(Polygon([Point(*p).coords[0] for p in all_pts]).buffer(0))
    # shapely triangulate brauch MultiPoint oder Polygon; bei Polygon nimmt es Vertices
    from shapely.geometry import MultiPoint
    tris = triangulate(MultiPoint(all_pts))
    edges: set[tuple[tuple[float, float], tuple[float, float]]] = set()
    for tri in tris:
        coords = list(tri.exterior.coords)[:-1]
        for i in range(3):
            a = tuple(round(v, 2) for v in coords[i])
            b = tuple(round(v, 2) for v in coords[(i + 1) % 3])
            edge = tuple(sorted((a, b)))
            edges.add(edge)

    # Boundary-Segmente (die in Outline-Path gerendert werden)
    boundary_segments: set[tuple[tuple[float, float], tuple[float, float]]] = set()
    for i in range(len(boundary_pts)):
        a = tuple(round(v, 2) for v in boundary_pts[i])
        b = tuple(round(v, 2) for v in boundary_pts[(i + 1) % len(boundary_pts)])
        boundary_segments.add(tuple(sorted((a, b))))

    inner: list[tuple[tuple[float, float], tuple[float, float]]] = []
    safe_poly = canvas_poly.buffer(0.5)  # toleranz an Boundary
    for edge in edges:
        if edge in boundary_segments:
            continue
        line = LineString(edge)
        # Nur behalten wenn komplette Linie innerhalb Polygon (strenger als nur Zentroid)
        if safe_poly.contains(line):
            inner.append(edge)
    return inner


def sharpest_corners(points: list[tuple[float, float]], n: int) -> list[int]:
    """Indizes der n schärfsten Polygon-Knicke (kleinster Innenwinkel)."""
    import math

    angles: list[tuple[float, int]] = []
    L = len(points)
    for i in range(L):
        prev = points[(i - 1) % L]
        curr = points[i]
        nxt = points[(i + 1) % L]
        v1 = (prev[0] - curr[0], prev[1] - curr[1])
        v2 = (nxt[0] - curr[0], nxt[1] - curr[1])
        dot = v1[0] * v2[0] + v1[1] * v2[1]
        n1 = math.hypot(*v1)
        n2 = math.hypot(*v2)
        if n1 == 0 or n2 == 0:
            continue
        cos_a = max(-1.0, min(1.0, dot / (n1 * n2)))
        ang = math.degrees(math.acos(cos_a))
        angles.append((ang, i))
    angles.sort(key=lambda t: t[0])
    return sorted([i for _, i in angles[:n]])


def points_path(points: list[tuple[float, float]]) -> str:
    head, *tail = points
    return "M " + f"{head[0]},{head[1]} " + " ".join(f"{x},{y}" for x, y in tail) + " Z"


def edges_lines_svg(edges, stroke_width: float, opacity: float, stroke_color: str = f"var(--accent, {ACCENT})") -> str:
    out = [f'\t<g stroke="{stroke_color}" stroke-width="{stroke_width}" opacity="{opacity}" fill="none" stroke-linecap="round">']
    for (x1, y1), (x2, y2) in edges:
        out.append(f'\t\t<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" />')
    out.append("\t</g>")
    return "\n".join(out)


def circles_svg(points, radius: float, fill: str = f"var(--accent, {ACCENT})", indent: str = "\t\t") -> str:
    out = [f'\t<g fill="{fill}">']
    for x, y in points:
        out.append(f'{indent}<circle cx="{x}" cy="{y}" r="{radius}" />')
    out.append("\t</g>")
    return "\n".join(out)


def anchor_circles_svg(points, radius: float, stroke: str = f"var(--accent, {ACCENT})", indent: str = "\t\t") -> str:
    """Anchor-Punkte als Open-Ring (visuell Vermessungs-Pfahl statt Boundary-Knoten)."""
    sw = round(radius * 0.6, 2)
    out = [f'\t<g fill="var(--bg, {BG})" stroke="{stroke}" stroke-width="{sw}">']
    for x, y in points:
        out.append(f'{indent}<circle cx="{x}" cy="{y}" r="{radius}" />')
    out.append("\t</g>")
    return "\n".join(out)


def write_master(points, edges, anchors) -> None:
    path_d = points_path(points)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="navigator.berlin">
\t<title>navigator.berlin</title>
\t<desc>Berlin-Außenkontur als Wireframe-Modell. {len(points)} Boundary-Punkte aus bezirke.geojson (ODIS / Senatsverwaltung, dl-de/zero-2-0), vereinfacht mit Douglas-Peucker. {len(anchors)} innere Vermessungs-Stützpunkte. {len(edges)} Delaunay-Kanten.</desc>
\t<rect width="100" height="100" fill="var(--bg, {BG})" />

{edges_lines_svg(edges, 0.4, 0.4)}

\t<path
\t\td="{path_d}"
\t\tfill="none"
\t\tstroke="var(--accent, {ACCENT})"
\t\tstroke-width="0.8"
\t\tstroke-linejoin="round"
\t\tstroke-linecap="round"
\t/>

{circles_svg(points, 1.2)}

{anchor_circles_svg(anchors, 0.9)}
</svg>
"""
    (SVG_DIR / "logo-mark.svg").write_text(svg, encoding="utf-8")


def write_header(points, edges, anchors) -> None:
    path_d = points_path(points)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="navigator.berlin">
\t<title>navigator.berlin</title>
\t<desc>Header-Variante. Verstärkte Strokes für 24–64 px Render.</desc>
\t<rect width="100" height="100" fill="var(--bg, {BG})" />

{edges_lines_svg(edges, 1.3, 0.55)}

\t<path
\t\td="{path_d}"
\t\tfill="none"
\t\tstroke="var(--accent, {ACCENT})"
\t\tstroke-width="1.9"
\t\tstroke-linejoin="round"
\t\tstroke-linecap="round"
\t/>

{circles_svg(points, 2.2)}

{anchor_circles_svg(anchors, 1.6)}
</svg>
"""
    (SVG_DIR / "logo-mark-header.svg").write_text(svg, encoding="utf-8")


def write_favicon(points, sharp_indices) -> None:
    path_d = points_path(points)
    sharp_points = [points[i] for i in sharp_indices]
    sharp_svg = circles_svg(sharp_points, 2.5, fill=ACCENT)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
\t<rect width="100" height="100" fill="{BG}" />
\t<path
\t\td="{path_d}"
\t\tfill="none"
\t\tstroke="{ACCENT}"
\t\tstroke-width="2"
\t\tstroke-linejoin="round"
\t\tstroke-linecap="round"
\t/>
{sharp_svg}
</svg>
"""
    (SVG_DIR / "favicon.svg").write_text(svg, encoding="utf-8")


def write_ts(points, edges, anchors, sharp_indices) -> None:
    points_lines = ",\n".join(f"\t[{x}, {y}]" for x, y in points)
    edges_lines = ",\n".join(f"\t[{a[0]}, {a[1]}, {b[0]}, {b[1]}]" for a, b in edges)
    anchors_lines = ",\n".join(f"\t[{x}, {y}]" for x, y in anchors)
    sharp_str = ", ".join(str(i) for i in sharp_indices)
    ts = f"""/**
 * navigator.berlin Logo-Geometrie.
 *
 * Reproduzierbar via `python3 scripts/generate-logo.py`.
 * Quelle: static/layers/bezirke.*.geojson (ODIS / Senatsverwaltung, dl-de/zero-2-0)
 * Pipeline:
 *   1. unary_union der 12 Bezirks-Polygone → Berlin-Außenkontur
 *   2. Cos-Lat-Projektion (Berlin ~52.5°N) → echte Proportion
 *   3. Douglas-Peucker simplify → {len(points)} Boundary-Punkte
 *   4. Halton-Sequenz im Inneren → {len(anchors)} Vermessungs-Stützpunkte
 *   5. Delaunay-Triangulation über (Boundary + Anchors) → {len(edges)} innere Kanten
 *   6. Canvas: SVG 100×100, Y-flip, Padding 8
 *
 * DO NOT EDIT MANUALLY. Regeneriere via Script.
 */

export type Point = readonly [x: number, y: number];
export type Edge = readonly [x1: number, y1: number, x2: number, y2: number];

/** {len(points)} Boundary-Punkte in Reihenfolge des Polygon-Umlaufs. */
export const BOUNDARY_POINTS: readonly Point[] = [
{points_lines}
];

/** {len(anchors)} Innere Vermessungs-Stützpunkte (Halton-2-3-Sequenz, im Polygon mit Mindest-Abstand zur Boundary). */
export const ANCHOR_POINTS: readonly Point[] = [
{anchors_lines}
];

/** {len(edges)} Delaunay-Kanten zwischen (Boundary + Anchor)-Punkten, gefiltert auf vollständig innerhalb des Polygons, Boundary-Segmente ausgeschlossen. */
export const DELAUNAY_EDGES: readonly Edge[] = [
{edges_lines}
];

/** SVG-Path-d für Berlin-Außenkontur (closed). Verwendet BOUNDARY_POINTS. */
export const BOUNDARY_PATH_D = (() => {{
\tconst [first, ...rest] = BOUNDARY_POINTS;
\tconst tail = rest.map(([x, y]) => `${{x}},${{y}}`).join(' ');
\treturn `M ${{first[0]}},${{first[1]}} ${{tail}} Z`;
}})();

/** Indizes der 8 schärfsten Knicke für Favicon-Reduktion. */
export const FAVICON_POINT_INDICES: readonly number[] = [{sharp_str}];
"""
    TS_OUT.write_text(ts, encoding="utf-8")


def main() -> None:
    if not GEOJSON.exists():
        raise SystemExit(f"GeoJSON not found: {GEOJSON}")

    poly = load_outer_polygon(GEOJSON)
    print(f"merged outer polygon: {len(poly.exterior.coords) - 1} Punkte, area={poly.area:.4f}", file=sys.stderr)

    simplified = simplify_to_n(poly, TARGET_POINTS)
    raw_coords = list(simplified.exterior.coords)[:-1]  # drop closing duplicate
    print(f"simplified to {len(raw_coords)} Punkte", file=sys.stderr)

    points = map_to_canvas(raw_coords, simplified.bounds, CANVAS, PADDING)
    canvas_poly = Polygon(points)

    anchors = interior_anchors(canvas_poly, n_target=4)
    print(f"{len(anchors)} interior anchors: {anchors}", file=sys.stderr)

    edges = delaunay_edges(points, anchors, canvas_poly)
    print(f"{len(edges)} inner Delaunay edges", file=sys.stderr)

    sharp = sharpest_corners(points, 8)
    print(f"sharpest corners (favicon): {sharp}", file=sys.stderr)

    write_master(points, edges, anchors)
    write_header(points, edges, anchors)
    write_favicon(points, sharp)
    write_ts(points, edges, anchors, sharp)
    print(f"wrote {SVG_DIR}/logo-mark.svg, logo-mark-header.svg, favicon.svg", file=sys.stderr)
    print(f"wrote {TS_OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
