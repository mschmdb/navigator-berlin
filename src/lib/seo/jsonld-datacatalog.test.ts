import { describe, it, expect } from 'vitest';
import { buildDataCatalog } from './jsonld-datacatalog.js';

describe('buildDataCatalog', () => {
	const origin = 'https://navigator.berlin';

	it('rendert DataCatalog mit name, description, url, publisher', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'navigator.berlin Daten-Katalog',
			description: 'Alle 44 Geo-Layer der Plattform navigator.berlin.',
			urlPath: '/lizenzen',
			publisherName: 'Matze Schmidbauer',
			datasets: []
		});
		expect(jsonLd['@context']).toBe('https://schema.org');
		expect(jsonLd['@type']).toBe('DataCatalog');
		expect(jsonLd.name).toBe('navigator.berlin Daten-Katalog');
		expect(jsonLd.description).toContain('44');
		expect(jsonLd.url).toBe(`${origin}/lizenzen`);
		expect(jsonLd.publisher['@type']).toBe('Person');
		expect(jsonLd.publisher.name).toBe('Matze Schmidbauer');
	});

	it('emittiert dataset als reine @id-Referenzen auf die kanonische Layer-Page', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: [
				{ name: 'Lärm 2023', urlPath: '/layer/laerm-2023', license: 'dl-de/zero-2-0' },
				{ name: 'Wohnlagen 2024', urlPath: '/layer/wohnlagen-2024', license: 'dl-de/by-2-0' }
			]
		});
		expect(jsonLd.dataset).toHaveLength(2);
		// Reine Referenz: nur @id, kein @type Dataset (sonst verlangt Google
		// description/creator und ordnet das Dataset faelschlich /lizenzen zu).
		expect(jsonLd.dataset[0]).toEqual({ '@id': `${origin}/layer/laerm-2023` });
		expect(jsonLd.dataset[1]).toEqual({ '@id': `${origin}/layer/wohnlagen-2024` });
		expect(jsonLd.dataset[0]).not.toHaveProperty('@type');
		expect(jsonLd.dataset[0]).not.toHaveProperty('description');
	});

	it('strippt trailing-slash vom origin', () => {
		const jsonLd = buildDataCatalog({
			origin: `${origin}/`,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: []
		});
		expect(jsonLd.url).toBe(`${origin}/lizenzen`);
	});

	it('default inLanguage de-DE', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: []
		});
		expect(jsonLd.inLanguage).toBe('de-DE');
	});

	it('respektiert custom inLanguage', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: [],
			inLanguage: 'en-US'
		});
		expect(jsonLd.inLanguage).toBe('en-US');
	});
});
