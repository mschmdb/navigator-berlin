import { describe, expect, it } from 'vitest';
import {
	parseAddress,
	parseLayers,
	parseViewport,
	serializeAddress,
	serializeLayers,
	serializeViewport
} from './url-state.js';

describe('serializeViewport', () => {
	it('schreibt bbox mit 5 Nachkommastellen + zoom mit 2', () => {
		const params = serializeViewport({
			bbox: [13.08831234, 52.33821234, 13.76111234, 52.67551234],
			zoom: 14.567,
			center: [13.40501234, 52.52001234]
		});
		expect(params.get('bbox')).toBe('13.08831,52.33821,13.76111,52.67551');
		expect(params.get('zoom')).toBe('14.57');
		expect(params.get('center')).toBe('13.40501,52.52001');
	});

	it('akzeptiert nur center+zoom (bbox optional)', () => {
		const params = serializeViewport({ zoom: 10, center: [13.405, 52.52] });
		expect(params.get('bbox')).toBeNull();
		expect(params.get('zoom')).toBe('10.00');
		expect(params.get('center')).toBe('13.40500,52.52000');
	});
});

describe('parseViewport', () => {
	it('roundtrip mit serializeViewport', () => {
		const original = {
			bbox: [13.0883, 52.3382, 13.7611, 52.6755] as [number, number, number, number],
			zoom: 12.5,
			center: [13.405, 52.52] as [number, number]
		};
		const params = serializeViewport(original);
		const parsed = parseViewport(params);
		expect(parsed.bbox).toEqual([13.0883, 52.3382, 13.7611, 52.6755]);
		expect(parsed.zoom).toBeCloseTo(12.5, 2);
		expect(parsed.center).toEqual([13.405, 52.52]);
	});

	it('toleriert invalid bbox', () => {
		const params = new URLSearchParams('bbox=foo&zoom=14');
		const parsed = parseViewport(params);
		expect(parsed.bbox).toBeUndefined();
		expect(parsed.zoom).toBe(14);
	});

	it('toleriert fehlende Params', () => {
		const parsed = parseViewport(new URLSearchParams(''));
		expect(parsed.bbox).toBeUndefined();
		expect(parsed.zoom).toBeUndefined();
		expect(parsed.center).toBeUndefined();
	});

	it('lehnt bbox mit 3 Werten ab', () => {
		const parsed = parseViewport(new URLSearchParams('bbox=1,2,3'));
		expect(parsed.bbox).toBeUndefined();
	});

	it('lehnt zoom ausserhalb 0-22 ab', () => {
		expect(parseViewport(new URLSearchParams('zoom=-5')).zoom).toBeUndefined();
		expect(parseViewport(new URLSearchParams('zoom=99')).zoom).toBeUndefined();
	});
});

describe('serializeLayers / parseLayers', () => {
	it('CSV-Roundtrip', () => {
		const csv = serializeLayers(['mietspiegel-wohnlage', 'laerm-night']);
		expect(csv).toBe('mietspiegel-wohnlage,laerm-night');
		expect(parseLayers(csv)).toEqual(['mietspiegel-wohnlage', 'laerm-night']);
	});

	it('leere Liste → leerer String', () => {
		expect(serializeLayers([])).toBe('');
	});

	it('null/leerer Input → []', () => {
		expect(parseLayers(null)).toEqual([]);
		expect(parseLayers('')).toEqual([]);
	});

	it('trimmt + filtert empty', () => {
		expect(parseLayers('a, b ,, c')).toEqual(['a', 'b', 'c']);
	});

	it('dedupliziert', () => {
		expect(parseLayers('a,a,b')).toEqual(['a', 'b']);
	});
});

describe('sortLayerSlugsByBundle', () => {
	const LAYERS = [
		{ slug: 'stolpersteine', bundleGroup: 'D: Memorial' as const },
		{ slug: 'mietspiegel-wohnlage', bundleGroup: 'B: Wohn-Daten' as const },
		{ slug: 'plz', bundleGroup: 'A: Boundaries' as const },
		{ slug: 'bezirke', bundleGroup: 'A: Boundaries' as const },
		{ slug: 'laerm-night', bundleGroup: 'C: Umwelt' as const },
		{ slug: 'laerm-den', bundleGroup: 'C: Umwelt' as const }
	];

	it('sortiert nach Bundle A→B→C→D, alphabetisch innerhalb', async () => {
		const { sortLayerSlugsByBundle } = await import('./url-state.js');
		const sorted = sortLayerSlugsByBundle(
			['stolpersteine', 'plz', 'mietspiegel-wohnlage', 'bezirke', 'laerm-night'],
			LAYERS
		);
		expect(sorted).toEqual([
			'bezirke',
			'plz',
			'mietspiegel-wohnlage',
			'laerm-night',
			'stolpersteine'
		]);
	});

	it('unbekannte Slugs landen am Ende, deterministisch alphabetisch', async () => {
		const { sortLayerSlugsByBundle } = await import('./url-state.js');
		const sorted = sortLayerSlugsByBundle(['unknown-z', 'bezirke', 'unknown-a'], LAYERS);
		expect(sorted).toEqual(['bezirke', 'unknown-a', 'unknown-z']);
	});

	it('Idempotent: doppelter Sort liefert gleiches Ergebnis', async () => {
		const { sortLayerSlugsByBundle } = await import('./url-state.js');
		const a = sortLayerSlugsByBundle(['laerm-den', 'bezirke'], LAYERS);
		const b = sortLayerSlugsByBundle(a, LAYERS);
		expect(a).toEqual(b);
	});
});

describe('serializeAddress / parseAddress', () => {
	it('schreibt q + lng/lat mit 5 Nachkommastellen', () => {
		const patch = serializeAddress({ q: 'Pariser Platz 1', lat: 52.51631234, lng: 13.37771234 });
		expect(patch.get('address')).toBe('13.37771,52.51631');
		expect(patch.get('q')).toBe('Pariser Platz 1');
	});

	it('roundtrip', () => {
		const patch = serializeAddress({ lat: 52.5163, lng: 13.3777, q: 'Pariser Platz' });
		const parsed = parseAddress(patch);
		expect(parsed.lat).toBeCloseTo(52.5163, 4);
		expect(parsed.lng).toBeCloseTo(13.3777, 4);
		expect(parsed.q).toBe('Pariser Platz');
	});

	it('toleriert fehlende Params', () => {
		expect(parseAddress(new URLSearchParams(''))).toEqual({});
	});

	it('lehnt invalide lng/lat ab', () => {
		const parsed = parseAddress(new URLSearchParams('address=foo,bar'));
		expect(parsed.lat).toBeUndefined();
		expect(parsed.lng).toBeUndefined();
	});

	it('lehnt out-of-range coords ab', () => {
		const parsed = parseAddress(new URLSearchParams('address=200,100'));
		expect(parsed.lat).toBeUndefined();
		expect(parsed.lng).toBeUndefined();
	});

	it('serializeAddress ohne q schreibt nur address', () => {
		const patch = serializeAddress({ lat: 52.5, lng: 13.4 });
		expect(patch.get('q')).toBeNull();
		expect(patch.get('address')).toBe('13.40000,52.50000');
	});
});
