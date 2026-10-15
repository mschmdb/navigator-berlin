import proj4 from 'proj4';

const EPSG_3035 = 'EPSG:3035';
const EPSG_4326 = 'EPSG:4326';

proj4.defs(
	EPSG_3035,
	'+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs'
);

/** ETRS89-LAEA (EPSG:3035, Zensus-Gitter) nach WGS84 [lon, lat]. */
export function laeaToWgs84(x: number, y: number): [number, number] {
	const [lon, lat] = proj4(EPSG_3035, EPSG_4326, [x, y]);
	return [lon, lat];
}
