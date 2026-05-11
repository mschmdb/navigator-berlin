import { describe, expect, it } from 'vitest';
import { buildWfsUrl } from './fis-broker.js';
import { buildOverpassRequest } from './overpass.js';
import { buildDwdZipUrlSimple } from './dwd-cdc.js';

describe('FIS-Broker WFS URL-Builder', () => {
	it('setzt WFS-Standard-Params', () => {
		const url = buildWfsUrl(
			'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_plz',
			'fis:s_plz'
		);
		const u = new URL(url);
		expect(u.searchParams.get('SERVICE')).toBe('WFS');
		expect(u.searchParams.get('VERSION')).toBe('2.0.0');
		expect(u.searchParams.get('REQUEST')).toBe('GetFeature');
		expect(u.searchParams.get('typeNames')).toBe('fis:s_plz');
		expect(u.searchParams.get('srsName')).toBe('EPSG:4326');
		expect(u.searchParams.get('outputFormat')).toBe('application/json');
	});

	it('respektiert bestehende Path-Segmente', () => {
		const url = buildWfsUrl(
			'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_solar',
			'fis:s_solar'
		);
		expect(url).toContain('/fb/wfs/data/senstadt/s_solar');
	});
});

describe('Overpass POST-Body-Builder', () => {
	it('url-encoded Body mit data=Prefix', () => {
		const ql = '[out:json];(node["amenity"="drinking_water"](52,13,53,14););out;';
		const { url, body } = buildOverpassRequest('https://overpass-api.de/api/interpreter', ql);
		expect(url).toBe('https://overpass-api.de/api/interpreter');
		expect(body.startsWith('data=')).toBe(true);
		expect(decodeURIComponent(body.slice(5))).toBe(ql);
	});

	it('wirft bei nicht-allowlisted endpoint', () => {
		expect(() =>
			buildOverpassRequest('https://evil.example.com/api', '[out:json];')
		).toThrow(/allowlist/);
	});
});

describe('DWD ZIP-URL-Builder', () => {
	it('pad-left station-id auf 5 chars + hist suffix', () => {
		const url = buildDwdZipUrlSimple('403', 'historical');
		expect(url).toBe(
			'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical/tageswerte_KL_00403_hist.zip'
		);
	});

	it('recent variante mit akt suffix', () => {
		const url = buildDwdZipUrlSimple('00400', 'recent');
		expect(url).toContain('/recent/tageswerte_KL_00400_akt.zip');
	});
});
