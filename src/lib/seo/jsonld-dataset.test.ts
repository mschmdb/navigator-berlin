import { describe, expect, it } from 'vitest';
import { buildDataset } from './jsonld-dataset.js';

describe('buildDataset', () => {
	const baseInput = {
		origin: 'https://navigator.berlin',
		name: 'Lärmkarte 2023',
		description: 'Strategische Laermkartierung Berlin, Tag-Pegel.',
		license: 'dl-de/zero-2-0' as const,
		dateModified: '2024-06-01T00:00:00.000Z',
		creatorName: 'SenStadt Berlin',
		url: 'https://navigator.berlin/layer/laerm-2023',
		contentUrl: 'https://navigator.berlin/layers/laerm-2023.aaaa.geojson',
		encodingFormat: 'application/geo+json',
		keywords: ['umwelt', 'laerm']
	};

	it('hat @context + @type Dataset', () => {
		const out = buildDataset(baseInput);
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('Dataset');
	});

	it('uebernimmt name + description + dateModified', () => {
		const out = buildDataset(baseInput);
		expect(out.name).toBe('Lärmkarte 2023');
		expect(out.description).toBe('Strategische Laermkartierung Berlin, Tag-Pegel.');
		expect(out.dateModified).toBe('2024-06-01T00:00:00.000Z');
	});

	it('mappt license-code auf Schema.org-URL', () => {
		const out = buildDataset(baseInput);
		expect(out.license).toBe('https://www.govdata.de/dl-de/zero-2-0');
	});

	it('hat creator als Organization mit name', () => {
		const out = buildDataset(baseInput);
		expect(out.creator).toEqual({ '@type': 'Organization', name: 'SenStadt Berlin' });
	});

	it('Fallback-creator wenn creatorName leer: Verweis auf die Organization', () => {
		const out = buildDataset({ ...baseInput, creatorName: undefined });
		expect(out.creator).toEqual({
			'@type': 'Organization',
			'@id': 'https://navigator.berlin/#organization',
			name: 'navigator.berlin',
			url: 'https://navigator.berlin'
		});
	});

	it('hat distribution mit contentUrl + encodingFormat', () => {
		const out = buildDataset(baseInput);
		expect(out.distribution['@type']).toBe('DataDownload');
		expect(out.distribution.contentUrl).toBe(
			'https://navigator.berlin/layers/laerm-2023.aaaa.geojson'
		);
		expect(out.distribution.encodingFormat).toBe('application/geo+json');
	});

	it('keywords werden komma-getrennt als string serialisiert', () => {
		const out = buildDataset(baseInput);
		expect(out.keywords).toBe('umwelt, laerm');
	});

	it('inLanguage Default de-DE (Phase 1 DE-only-Lock)', () => {
		const out = buildDataset(baseInput);
		expect(out.inLanguage).toBe('de-DE');
	});

	it('inLanguage override fuer EN-Variante (Story 2.5a)', () => {
		const out = buildDataset({ ...baseInput, inLanguage: 'en-US' });
		expect(out.inLanguage).toBe('en-US');
	});

	describe('Google-Dataset-Search-Felder', () => {
		it('setzt url, isAccessibleForFree und includedInDataCatalog', () => {
			const out = buildDataset(baseInput);
			expect(out.url).toBe('https://navigator.berlin/layer/laerm-2023');
			expect(out.isAccessibleForFree).toBe(true);
			expect(out['@id']).toBe('https://navigator.berlin/layer/laerm-2023#dataset');
			expect(out.includedInDataCatalog).toEqual({
				'@type': 'DataCatalog',
				'@id': 'https://navigator.berlin/lizenzen#catalog',
				name: 'navigator.berlin Daten-Katalog',
				url: 'https://navigator.berlin/lizenzen'
			});
		});

		it('verweist auf den Katalog der Hauptdomain, auch von der Hitze-Subdomain', () => {
			const out = buildDataset({ ...baseInput, origin: 'https://hitze.navigator.berlin' });
			expect(out.includedInDataCatalog['@id']).toBe('https://navigator.berlin/lizenzen#catalog');
			expect(out.includedInDataCatalog.url).toBe('https://navigator.berlin/lizenzen');
		});

		it('setzt spatialCoverage als Place mit GeoShape box', () => {
			const out = buildDataset({ ...baseInput, bbox: [13.088, 52.338, 13.761, 52.675] });
			expect(out.spatialCoverage).toEqual({
				'@type': 'Place',
				name: 'Berlin',
				geo: { '@type': 'GeoShape', box: '52.338 13.088 52.675 13.761' }
			});
		});

		it('laesst spatialCoverage ohne bbox weg', () => {
			expect(buildDataset(baseInput)).not.toHaveProperty('spatialCoverage');
		});

		it('setzt temporalCoverage nur wenn uebergeben', () => {
			expect(buildDataset({ ...baseInput, temporalCoverage: '2023' }).temporalCoverage).toBe(
				'2023'
			);
			expect(buildDataset(baseInput)).not.toHaveProperty('temporalCoverage');
		});

		it('haengt creatorUrl an die Behoerde', () => {
			const out = buildDataset({ ...baseInput, creatorUrl: 'https://daten.odis-berlin.de' });
			expect(out.creator).toEqual({
				'@type': 'Organization',
				name: 'SenStadt Berlin',
				url: 'https://daten.odis-berlin.de'
			});
		});

		it('ignoriert creatorUrl beim navigator.berlin-Fallback', () => {
			const out = buildDataset({
				...baseInput,
				creatorName: undefined,
				creatorUrl: 'https://daten.odis-berlin.de'
			});
			expect(out.creator).toMatchObject({ '@id': 'https://navigator.berlin/#organization' });
		});
	});
});
