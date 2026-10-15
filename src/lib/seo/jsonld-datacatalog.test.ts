import { describe, it, expect } from 'vitest';
import { buildDataCatalog, dataCatalogId } from './jsonld-datacatalog.js';

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

	it('emittiert vollstaendige Dataset-Nodes mit Pflichtfeldern name + description', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: [
				{
					name: 'Lärm 2023',
					description: 'Umgebungslärm der EU-Kartierung 2022 in Berlin.',
					urlPath: '/layer/laerm-2023',
					license: 'dl-de/zero-2-0',
					creatorName: 'SenMVKU'
				}
			]
		});
		expect(jsonLd.dataset).toHaveLength(1);
		// Google inferiert @type Dataset aus der dataset-Range und verlangt
		// name + description. @id = kanonische Layer-Page → Linked-Data-Merge.
		expect(jsonLd.dataset[0]).toMatchObject({
			'@type': 'Dataset',
			'@id': `${origin}/layer/laerm-2023#dataset`,
			url: `${origin}/layer/laerm-2023`,
			name: 'Lärm 2023',
			description: 'Umgebungslärm der EU-Kartierung 2022 in Berlin.',
			creator: { '@type': 'Organization', name: 'SenMVKU' }
		});
		expect(jsonLd.dataset[0].license).toContain('govdata.de');
	});

	it('faellt ohne creatorName auf einen Verweis auf die Organization zurueck', () => {
		const jsonLd = buildDataCatalog({
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: [
				{
					name: 'Wohnlagen 2024',
					description: 'Wohnlagen-Einstufung Berlin 2024.',
					urlPath: '/layer/wohnlagen-2024',
					license: 'dl-de/by-2-0'
				}
			]
		});
		expect(jsonLd.dataset[0].creator).toEqual({
			'@type': 'Organization',
			'@id': `${origin}/#organization`,
			name: 'navigator.berlin',
			url: origin
		});
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

	it('setzt @id nur wenn catalogId uebergeben wird', () => {
		const base = {
			origin,
			name: 'Test',
			description: 'Test',
			urlPath: '/lizenzen',
			publisherName: 'Tester',
			datasets: []
		};
		expect(buildDataCatalog(base)).not.toHaveProperty('@id');
		expect(buildDataCatalog({ ...base, catalogId: dataCatalogId(origin) })['@id']).toBe(
			`${origin}/lizenzen#catalog`
		);
	});

	it('dataCatalogId nutzt die Hauptdomain und ist locale-unabhaengig', () => {
		expect(dataCatalogId('https://hitze.navigator.berlin/')).toBe(
			'https://navigator.berlin/lizenzen#catalog'
		);
	});
});
