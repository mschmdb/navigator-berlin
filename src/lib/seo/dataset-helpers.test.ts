import { describe, expect, it } from 'vitest';
import {
	bboxToGeoShapeBox,
	deriveTemporalCoverage,
	originOfUrl,
	stableDownloadPath
} from './dataset-helpers.js';

describe('deriveTemporalCoverage', () => {
	it('nimmt das Jahres-Suffix aus dem Slug', () => {
		expect(deriveTemporalCoverage({ slug: 'laerm-2023' })).toBe('2023');
	});

	it('nutzt sourceUpdatedAt nicht als Datenzeitraum', () => {
		expect(
			deriveTemporalCoverage({
				slug: 'kultur-museum',
				sourceUpdatedAt: '2025-03-02T10:00:00Z'
			} as never)
		).toBeUndefined();
	});

	it('liefert undefined ohne ableitbares Jahr', () => {
		expect(deriveTemporalCoverage({ slug: 'kultur-museum' })).toBeUndefined();
	});

	it('ignoriert Zahlen mitten im Slug und ungueltige Daten', () => {
		expect(deriveTemporalCoverage({ slug: 'lor-2021-planungsraum' })).toBeUndefined();
		expect(deriveTemporalCoverage({ slug: 'strasse-12345' })).toBeUndefined();
	});

	it('nutzt ein explizites Jahr', () => {
		expect(deriveTemporalCoverage({ year: 2026 })).toBe('2026');
	});
});

describe('bboxToGeoShapeBox', () => {
	it('formatiert als "südBreite westLänge nordBreite ostLänge"', () => {
		expect(bboxToGeoShapeBox([13.088, 52.338, 13.761, 52.675])).toBe('52.338 13.088 52.675 13.761');
	});
});

describe('originOfUrl', () => {
	it('liefert den Origin', () => {
		expect(originOfUrl('https://daten.odis-berlin.de/de/dataset/x/data.geojson')).toBe(
			'https://daten.odis-berlin.de'
		);
	});

	it('liefert undefined bei ungueltiger URL und nicht-http-Schemata', () => {
		expect(originOfUrl('kein url')).toBeUndefined();
		expect(originOfUrl('javascript:alert(1)')).toBeUndefined();
		expect(originOfUrl(undefined)).toBeUndefined();
	});
});

describe('stableDownloadPath', () => {
	it('baut /daten/<slug>.<ext> je Format', () => {
		expect(stableDownloadPath('laerm-2023', 'geojson')).toBe('/daten/laerm-2023.geojson');
		expect(stableDownloadPath('klima-pet-2022', 'pmtiles')).toBe('/daten/klima-pet-2022.pmtiles');
		expect(stableDownloadPath('laerm-2023')).toBe('/daten/laerm-2023.geojson');
	});
});
