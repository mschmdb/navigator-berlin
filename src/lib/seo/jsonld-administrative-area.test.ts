import { describe, expect, it } from 'vitest';
import { buildAdministrativeArea } from './jsonld-administrative-area.js';

describe('buildAdministrativeArea', () => {
	it('hat @context + @type AdministrativeArea', () => {
		const out = buildAdministrativeArea({
			origin: 'https://navigator.berlin',
			name: 'Berlin',
			centroid: [13.4, 52.5]
		});
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('AdministrativeArea');
	});

	it('uebernimmt name, geo, optional containedInPlace + additionalProperty', () => {
		const out = buildAdministrativeArea({
			origin: 'https://navigator.berlin',
			name: 'Kreuzberg',
			centroid: [13.4, 52.5],
			containedInPlaceName: 'Berlin',
			einwohner: 270_000,
			flaecheHa: 953,
			slug: 'kreuzberg',
			urlBasePath: '/bezirk'
		});
		expect(out.name).toBe('Kreuzberg');
		expect(out.geo['@type']).toBe('GeoCoordinates');
		expect(out.containedInPlace?.name).toBe('Berlin');
		expect(out.url).toBe('https://navigator.berlin/bezirk/kreuzberg');
		expect(Array.isArray(out.additionalProperty)).toBe(true);
	});
});
