import { describe, expect, it, vi } from 'vitest';
import { queryPmtilesAt, type MapLibreLike } from './pmtiles-query.js';

function makeMap(opts: {
	hasLayer?: boolean;
	features?: Array<{ properties?: Record<string, unknown> | null }>;
}): MapLibreLike {
	return {
		getLayer: (_id: string) => (opts.hasLayer === false ? null : { id: _id }),
		project: ([lng, lat]) => ({ x: Math.round(lng * 1000), y: Math.round(lat * 1000) }),
		queryRenderedFeatures: vi.fn(() => opts.features ?? [])
	};
}

describe('queryPmtilesAt', () => {
	it('null wenn map null', () => {
		expect(queryPmtilesAt(null, 'navigator-layer-foo', 13.4, 52.5)).toBeNull();
	});

	it('null wenn Layer nicht in map (queryRenderedFeatures wirft sonst)', () => {
		const map = makeMap({ hasLayer: false });
		expect(queryPmtilesAt(map, 'navigator-layer-foo', 13.4, 52.5)).toBeNull();
	});

	it('null wenn keine Features in Bbox', () => {
		const map = makeMap({ features: [] });
		expect(queryPmtilesAt(map, 'navigator-layer-foo', 13.4, 52.5)).toBeNull();
	});

	it('liefert properties des ersten Features', () => {
		const map = makeMap({
			features: [
				{ properties: { wol: 'mittel', strasse: 'Bergmannstraße' } },
				{ properties: { wol: 'gut' } }
			]
		});
		expect(queryPmtilesAt(map, 'navigator-layer-wohnlagen', 13.4, 52.5)).toEqual({
			wol: 'mittel',
			strasse: 'Bergmannstraße'
		});
	});

	it('null wenn Feature properties=null', () => {
		const map = makeMap({ features: [{ properties: null }] });
		expect(queryPmtilesAt(map, 'navigator-layer-foo', 13.4, 52.5)).toBeNull();
	});

	it('Default-Tolerance 10px, override via opts', () => {
		const queryMock = vi.fn(() => []);
		const map: MapLibreLike = {
			getLayer: () => ({}),
			project: () => ({ x: 100, y: 200 }),
			queryRenderedFeatures: queryMock
		};
		queryPmtilesAt(map, 'l', 0, 0);
		expect(queryMock).toHaveBeenCalledWith(
			[
				[90, 190],
				[110, 210]
			],
			{ layers: ['l'] }
		);
		queryMock.mockClear();
		queryPmtilesAt(map, 'l', 0, 0, { tolerancePx: 5 });
		expect(queryMock).toHaveBeenCalledWith(
			[
				[95, 195],
				[105, 205]
			],
			{ layers: ['l'] }
		);
	});
});
