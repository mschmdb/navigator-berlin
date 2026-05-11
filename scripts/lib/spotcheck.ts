// Berliner Sample-Punkte: bekannte WGS84-Koordinaten (lon, lat) + EPSG:25833 (x, y meter)
// Quellen: OpenStreetMap (WGS84) + EPSG.io transform tool fuer 25833-Werte.
// Toleranz 0.0001 Grad (~11m am Aequator, ~7m bei 52deg Nord).
export interface SpotcheckPoint {
	name: string;
	wgs84: [number, number];
	utm33: [number, number];
}

export const BERLIN_SPOTCHECK: SpotcheckPoint[] = [
	{
		name: 'Brandenburger Tor',
		wgs84: [13.37771, 52.51629],
		utm33: [389918, 5819701]
	},
	{
		name: 'Alexanderplatz Fernsehturm',
		wgs84: [13.40948, 52.52075],
		utm33: [392085, 5820149]
	},
	{
		name: 'Olympiastadion',
		wgs84: [13.23998, 52.51449],
		utm33: [380569, 5819720]
	},
	{
		name: 'Treptower Park (Sowjet-Ehrenmal)',
		wgs84: [13.46863, 52.485],
		utm33: [396014, 5816086]
	},
	{
		name: 'Tegeler See Nord',
		wgs84: [13.27108, 52.5856],
		utm33: [382868, 5827577]
	}
];

export const SPOTCHECK_TOLERANCE_DEG = 0.0001;
export const SPOTCHECK_TOLERANCE_METERS = 50; // grosszuegig fuer Roundtrip-Drift
