import { beforeEach, describe, expect, it } from 'vitest';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { _resetDemografieCache, getDemografieByScopeAt } from './get-kiez-demografie.js';
import { _resetKiezScoreCache } from './get-kiez-score.js';
import { _resetManifestCache } from './manifest.js';
import type { Manifest } from './types.js';

function squareLor(id: string, minLng: number, minLat: number, span = 0.01): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { plr_id: id },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[minLng, minLat],
					[minLng + span, minLat],
					[minLng + span, minLat + span],
					[minLng, minLat + span],
					[minLng, minLat]
				]
			]
		}
	};
}

const MANIFEST: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-06-15T00:00:00.000Z',
	layers: [
		{
			slug: 'lor-planungsraum',
			filename: 'lor-planungsraum.deadbeef.geojson',
			sourceUrl: 'https://example.org/lor.geojson',
			fetchedAt: '2026-06-15T00:00:00.000Z',
			license: 'dl-de/zero-2-0',
			sha256: 'a'.repeat(64),
			bundleGroup: 'A: Boundaries',
			zoomThresholds: { min: 11, max: 15 },
			geometryType: 'Polygon',
			featureCount: 1,
			mapRelevant: false,
			inspectorRelevant: false
		}
	]
};

const LOR: FeatureCollection = {
	type: 'FeatureCollection',
	features: [squareLor('01100101', 13.4, 52.5)]
};

const PAYLOAD = {
	schemaVersion: 2,
	generatedAt: '2026-06-15T00:00:00.000Z',
	stichtag: '2024-12-31',
	records: [
		{
			plrId: '01100101',
			gesamt: 3580,
			kinder0bis6: 165,
			kinder6bis12: 147,
			senioren65plus: 717,
			dichtePro_km2: 9756,
			jugendquotient: 17,
			altenquotient: 29.3,
			erwerbsanteil: 68.3
		}
	],
	kiez: {
		'beispiel-kiez': {
			gesamt: 27454,
			kinder0bis6: 1901,
			kinder6bis12: 2186,
			senioren65plus: 5475,
			dichtePro_km2: 13417,
			jugendquotient: 39.4,
			altenquotient: 34.7,
			erwerbsanteil: 57.4
		}
	},
	bezirk: {
		mitte: {
			gesamt: 274098,
			kinder0bis6: 14765,
			kinder6bis12: 16238,
			senioren65plus: 62441,
			dichtePro_km2: 3068,
			jugendquotient: 28.2,
			altenquotient: 37.8,
			erwerbsanteil: 60.2
		}
	}
};

function mockFetch(): typeof fetch {
	return (async (input: RequestInfo | URL): Promise<Response> => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.endsWith('MANIFEST.json'))
			return new Response(JSON.stringify(MANIFEST), { status: 200 });
		if (url.includes('lor-planungsraum')) return new Response(JSON.stringify(LOR), { status: 200 });
		if (url.includes('einwohner-lor'))
			return new Response(JSON.stringify(PAYLOAD), { status: 200 });
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
}

describe('getDemografieByScopeAt', () => {
	beforeEach(() => {
		_resetDemografieCache();
		_resetKiezScoreCache();
		_resetManifestCache();
	});

	it('liefert Standort (PLR), Kiez und Bezirk getrennt auf', async () => {
		const out = await getDemografieByScopeAt(52.505, 13.405, 'beispiel-kiez', 'mitte', mockFetch());
		expect(out.standort?.einwohner).toBe(3580);
		expect(out.kiez?.einwohner).toBe(27454);
		expect(out.bezirk?.einwohner).toBe(274098);
		expect(out.kiez?.dichteEwKm2).toBe(13417);
	});

	it('unbekannter Kiez-Slug → kiez null, Standort/Bezirk bleiben', async () => {
		const out = await getDemografieByScopeAt(52.505, 13.405, 'gibts-nicht', 'mitte', mockFetch());
		expect(out.kiez).toBeNull();
		expect(out.standort?.einwohner).toBe(3580);
		expect(out.bezirk?.einwohner).toBe(274098);
	});

	it('Punkt außerhalb aller PLR → standort null, Aggregate per Slug trotzdem', async () => {
		const out = await getDemografieByScopeAt(50.0, 10.0, 'beispiel-kiez', 'mitte', mockFetch());
		expect(out.standort).toBeNull();
		expect(out.kiez?.einwohner).toBe(27454);
	});

	it('null-Slugs → nur Standort', async () => {
		const out = await getDemografieByScopeAt(52.505, 13.405, null, null, mockFetch());
		expect(out.standort?.einwohner).toBe(3580);
		expect(out.kiez).toBeNull();
		expect(out.bezirk).toBeNull();
	});
});
