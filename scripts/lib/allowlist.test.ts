import { describe, expect, it } from 'vitest';
import { isAllowed, assertAllowed } from './allowlist.js';

describe('allowlist', () => {
	it('akzeptiert FIS-Broker WFS host', () => {
		expect(isAllowed('https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_plz')).toBe(true);
	});

	it('akzeptiert ODIS host', () => {
		expect(isAllowed('https://daten.odis-berlin.de/de/dataset/bezirksgrenzen')).toBe(true);
	});

	it('akzeptiert DWD CDC opendata host', () => {
		expect(isAllowed('https://opendata.dwd.de/climate_environment/CDC/observations_germany/')).toBe(
			true
		);
	});

	it('akzeptiert Overpass primary + mirror', () => {
		expect(isAllowed('https://overpass-api.de/api/interpreter')).toBe(true);
		expect(isAllowed('https://overpass.kumi.systems/api/interpreter')).toBe(true);
	});

	it('akzeptiert Subdomain via dot-suffix-Match', () => {
		expect(isAllowed('https://sub.fbinter.stadt-berlin.de/x')).toBe(true);
	});

	it('blockt unbekannte Hosts', () => {
		expect(isAllowed('https://example.com/x')).toBe(false);
		expect(isAllowed('https://cloudflare.com/x')).toBe(false);
		expect(isAllowed('https://googleapis.com/x')).toBe(false);
	});

	it('blockt typo-ahnlichen Host (Subdomain-Fake)', () => {
		expect(isAllowed('https://fbinter.stadt-berlin.de.evil.example.com/x')).toBe(false);
	});

	it('blockt invalide URL', () => {
		expect(isAllowed('not-a-url')).toBe(false);
	});

	it('assertAllowed wirft bei Block, ist still bei Pass', () => {
		expect(() => assertAllowed('https://example.com/x')).toThrow(/allowlist/);
		expect(() => assertAllowed('https://daten.odis-berlin.de/x')).not.toThrow();
	});
});
