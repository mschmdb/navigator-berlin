import proj4 from 'proj4';
import type { FeatureCollection, Geometry, Position } from 'geojson';

const EPSG_4326 = 'EPSG:4326';
const EPSG_25833 = 'EPSG:25833';

proj4.defs(
	EPSG_25833,
	'+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);

export function utm33ToWgs84(x: number, y: number): [number, number] {
	const [lon, lat] = proj4(EPSG_25833, EPSG_4326, [x, y]);
	return [lon, lat];
}

export function wgs84ToUtm33(lon: number, lat: number): [number, number] {
	const [x, y] = proj4(EPSG_4326, EPSG_25833, [lon, lat]);
	return [x, y];
}

type CRS = 'EPSG:4326' | 'EPSG:25833';

const convert = (from: CRS, to: CRS) => (pos: Position): Position => {
	const [x, y] = proj4(from, to, [pos[0], pos[1]]);
	return pos.length === 3 ? [x, y, pos[2]] : [x, y];
};

function mapGeometry(geom: Geometry, fn: (p: Position) => Position): Geometry {
	switch (geom.type) {
		case 'Point':
			return { ...geom, coordinates: fn(geom.coordinates) };
		case 'MultiPoint':
		case 'LineString':
			return { ...geom, coordinates: geom.coordinates.map(fn) };
		case 'MultiLineString':
		case 'Polygon':
			return { ...geom, coordinates: geom.coordinates.map((ring) => ring.map(fn)) };
		case 'MultiPolygon':
			return {
				...geom,
				coordinates: geom.coordinates.map((poly) => poly.map((ring) => ring.map(fn)))
			};
		case 'GeometryCollection':
			return { ...geom, geometries: geom.geometries.map((g) => mapGeometry(g, fn)) };
	}
}

export function reprojectGeoJSON(fc: FeatureCollection, from: CRS, to: CRS): FeatureCollection {
	if (from === to) return fc;
	const fn = convert(from, to);
	return {
		...fc,
		features: fc.features.map((f) => ({
			...f,
			geometry: f.geometry ? mapGeometry(f.geometry, fn) : f.geometry
		}))
	};
}
