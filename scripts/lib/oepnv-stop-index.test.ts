import { describe, it, expect } from 'vitest';
import type { Feature, Point } from 'geojson';
import {
	extractStopFromFeature,
	dedupeStops,
	buildOepnvStopIndex,
	type Modus,
	type RawStop
} from './oepnv-stop-index.js';

function makeFeature(
	props: Record<string, unknown>,
	lng: number,
	lat: number
): Feature<Point, Record<string, unknown>> {
	return {
		type: 'Feature',
		properties: props,
		geometry: { type: 'Point', coordinates: [lng, lat] }
	};
}

describe('extractStopFromFeature', () => {
	it('extracts U-Bahn stop with name + line', () => {
		const f = makeFeature(
			{ name: 'Zoologischer Garten', line: 'U9', station: 'subway' },
			13.333,
			52.5058
		);
		const stop = extractStopFromFeature(f, 'ubahn');
		expect(stop).toEqual({
			name: 'Zoologischer Garten',
			lat: 52.5058,
			lng: 13.333,
			lines: ['U9']
		});
	});

	it('splits semicolon-separated lines', () => {
		const f = makeFeature(
			{ name: 'Berliner Straße', line: 'U7;U9', station: 'subway' },
			13.331,
			52.487
		);
		const stop = extractStopFromFeature(f, 'ubahn');
		expect(stop?.lines).toEqual(['U7', 'U9']);
	});

	it('returns null if name missing', () => {
		const f = makeFeature({ station: 'subway' }, 13.0, 52.5);
		expect(extractStopFromFeature(f, 'ubahn')).toBeNull();
	});

	it('returns null if geometry not Point', () => {
		const f = {
			type: 'Feature',
			properties: { name: 'X' },
			geometry: { type: 'LineString', coordinates: [[13, 52]] }
		} as unknown as Feature<Point>;
		expect(extractStopFromFeature(f, 'ubahn')).toBeNull();
	});

	it('extracts S-Bahn stop (light_rail)', () => {
		const f = makeFeature({ name: 'Tiergarten', station: 'light_rail' }, 13.336, 52.514);
		expect(extractStopFromFeature(f, 'sbahn')).toEqual({
			name: 'Tiergarten',
			lat: 52.514,
			lng: 13.336
		});
	});

	it('extracts Tram stop (railway=tram_stop)', () => {
		const f = makeFeature(
			{ name: 'Boxhagener Straße', railway: 'tram_stop', tram: 'yes' },
			13.46,
			52.51
		);
		expect(extractStopFromFeature(f, 'tram')).toEqual({
			name: 'Boxhagener Straße',
			lat: 52.51,
			lng: 13.46
		});
	});

	it('extracts Bus stop (highway=bus_stop)', () => {
		const f = makeFeature({ name: 'Londoner Straße', highway: 'bus_stop' }, 13.342, 52.5635);
		expect(extractStopFromFeature(f, 'bus')).toEqual({
			name: 'Londoner Straße',
			lat: 52.5635,
			lng: 13.342
		});
	});

	it('rejects bus feature for ubahn modus (tag mismatch)', () => {
		const f = makeFeature({ name: 'X', highway: 'bus_stop' }, 13, 52);
		expect(extractStopFromFeature(f, 'ubahn')).toBeNull();
	});

	it('trims name whitespace', () => {
		const f = makeFeature({ name: '  Frankfurter Tor  ', station: 'subway' }, 13.45, 52.51);
		expect(extractStopFromFeature(f, 'ubahn')?.name).toBe('Frankfurter Tor');
	});
});

describe('dedupeStops', () => {
	it('merges stops with same name + coord within ~110m bucket (3-decimal)', () => {
		const stops: RawStop[] = [
			{ name: 'Alex', lat: 52.5219, lng: 13.4132 },
			{ name: 'Alex', lat: 52.5221, lng: 13.4134 }
		];
		expect(dedupeStops(stops)).toHaveLength(1);
	});

	it('keeps distinct stops with same name but coord >110m apart', () => {
		const stops: RawStop[] = [
			{ name: 'Bornholmer', lat: 52.5537, lng: 13.4138 },
			{ name: 'Bornholmer', lat: 52.5552, lng: 13.4158 }
		];
		expect(dedupeStops(stops)).toHaveLength(2);
	});

	it('merges lines when deduping', () => {
		const stops: RawStop[] = [
			{ name: 'A', lat: 52.5, lng: 13.4, lines: ['U1'] },
			{ name: 'A', lat: 52.5, lng: 13.4, lines: ['U3'] }
		];
		const merged = dedupeStops(stops);
		expect(merged).toHaveLength(1);
		expect(merged[0].lines?.sort()).toEqual(['U1', 'U3']);
	});

	it('handles empty input', () => {
		expect(dedupeStops([])).toEqual([]);
	});

	it('preserves first stop coord on merge', () => {
		const stops: RawStop[] = [
			{ name: 'B', lat: 52.5, lng: 13.4 },
			{ name: 'B', lat: 52.50001, lng: 13.40001 }
		];
		const merged = dedupeStops(stops);
		expect(merged[0].lat).toBe(52.5);
		expect(merged[0].lng).toBe(13.4);
	});
});

describe('buildOepnvStopIndex', () => {
	it('aggregates features per modus into an index', () => {
		const ubahnFC = {
			type: 'FeatureCollection',
			features: [makeFeature({ name: 'Alex', station: 'subway' }, 13.41, 52.52)]
		};
		const sbahnFC = {
			type: 'FeatureCollection',
			features: [makeFeature({ name: 'Hbf', station: 'light_rail' }, 13.37, 52.52)]
		};
		const tramFC = {
			type: 'FeatureCollection',
			features: [
				makeFeature({ name: 'Boxhagener', railway: 'tram_stop', tram: 'yes' }, 13.46, 52.51)
			]
		};
		const busFC = {
			type: 'FeatureCollection',
			features: [makeFeature({ name: 'Londoner', highway: 'bus_stop' }, 13.342, 52.5635)]
		};
		const index = buildOepnvStopIndex({
			ubahn: ubahnFC,
			sbahn: sbahnFC,
			tram: tramFC,
			bus: busFC
		});
		expect(index.ubahn).toHaveLength(1);
		expect(index.sbahn).toHaveLength(1);
		expect(index.tram).toHaveLength(1);
		expect(index.bus).toHaveLength(1);
		expect(index.ubahn[0].name).toBe('Alex');
	});

	it('filters invalid features without crashing', () => {
		const fc = {
			type: 'FeatureCollection',
			features: [
				makeFeature({ station: 'subway' }, 13, 52),
				makeFeature({ name: 'Valid', station: 'subway' }, 13.1, 52.1)
			]
		};
		const empty = { type: 'FeatureCollection' as const, features: [] };
		const index = buildOepnvStopIndex({
			ubahn: fc,
			sbahn: empty,
			tram: empty,
			bus: empty
		});
		expect(index.ubahn).toHaveLength(1);
	});

	it('dedupes per modus', () => {
		const fc = {
			type: 'FeatureCollection',
			features: [
				makeFeature({ name: 'X', highway: 'bus_stop' }, 13.4, 52.5),
				makeFeature({ name: 'X', highway: 'bus_stop' }, 13.4002, 52.5002)
			]
		};
		const empty = { type: 'FeatureCollection' as const, features: [] };
		const index = buildOepnvStopIndex({
			ubahn: empty,
			sbahn: empty,
			tram: empty,
			bus: fc
		});
		expect(index.bus).toHaveLength(1);
	});
});
