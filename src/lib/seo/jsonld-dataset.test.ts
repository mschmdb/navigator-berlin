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
		expect(out.creator['@type']).toBe('Organization');
		expect(out.creator.name).toBe('SenStadt Berlin');
	});

	it('Fallback-creator wenn creatorName leer: navigator.berlin', () => {
		const out = buildDataset({ ...baseInput, creatorName: undefined });
		expect(out.creator.name).toBe('navigator.berlin');
		expect(out.creator.url).toBe('https://navigator.berlin');
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
});
