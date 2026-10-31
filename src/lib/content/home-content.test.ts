import { describe, expect, it } from 'vitest';
import { HOME_DATA_SOURCES } from './home-data-sources.js';
import {
	HOME_SEARCH_EXAMPLES,
	buildQuickLinkHref,
	buildSearchTargetHref
} from './home-quick-links.js';

describe('HOME_DATA_SOURCES', () => {
	it('liefert 6 Quellen mit Lizenz-Marker', () => {
		expect(HOME_DATA_SOURCES).toHaveLength(6);
		for (const s of HOME_DATA_SOURCES) {
			expect(s.name.length).toBeGreaterThan(2);
			expect(s.license.length).toBeGreaterThan(2);
		}
	});
});

describe('HOME_SEARCH_EXAMPLES', () => {
	const BERLIN_LNG = [13.0, 13.8] as const;
	const BERLIN_LAT = [52.3, 52.7] as const;

	it('liefert drei Beispiele innerhalb der Stadt-Bbox', () => {
		expect(HOME_SEARCH_EXAMPLES.map((e) => e.label)).toEqual([
			'Hermannplatz',
			'Kollwitzplatz',
			'Frohnau'
		]);
		for (const q of HOME_SEARCH_EXAMPLES) {
			expect(q.lng).toBeGreaterThanOrEqual(BERLIN_LNG[0]);
			expect(q.lng).toBeLessThanOrEqual(BERLIN_LNG[1]);
			expect(q.lat).toBeGreaterThanOrEqual(BERLIN_LAT[0]);
			expect(q.lat).toBeLessThanOrEqual(BERLIN_LAT[1]);
			expect(q.query).toMatch(/Berlin/);
		}
	});

	it('buildQuickLinkHref erzeugt parseAddress-konformes Query', () => {
		const link = HOME_SEARCH_EXAMPLES[0]!;
		const href = buildQuickLinkHref(link);
		expect(href.startsWith('/explore?')).toBe(true);
		expect(href).toContain(`address=${link.lng}%2C${link.lat}`);
		expect(href).toContain('q=');
	});
});

describe('buildSearchTargetHref', () => {
	it('Suchtreffer öffnet die Karte am Punkt mit Adresse als q', () => {
		const href = buildSearchTargetHref({
			displayName: 'Hermannplatz, Neukölln, Berlin',
			lng: 13.4243,
			lat: 52.4869
		});
		const url = new URL(href, 'https://x.test');
		expect(url.pathname).toBe('/explore');
		expect(url.searchParams.get('address')).toBe('13.4243,52.4869');
		expect(url.searchParams.get('q')).toBe('Hermannplatz, Neukölln, Berlin');
	});
});
