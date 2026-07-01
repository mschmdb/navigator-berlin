import { describe, expect, it } from 'vitest';
import {
	parseAddress,
	parseLayers,
	parseViewport,
	serializeAddress,
	serializeLayers,
	serializeViewport,
	serializeComparison,
	parseComparison,
	buildComparePermalink,
	buildExplorerDeepLink
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

	it('aktiviert kuehle-orte per Deep-Link (FR20, Story 15.2)', () => {
		expect(parseLayers('kuehle-orte')).toContain('kuehle-orte');
		expect(parseLayers('kuehle-orte')).toEqual(['kuehle-orte']);
		expect(parseLayers(serializeLayers(['kuehle-orte']))).toEqual(['kuehle-orte']);
	});
});

describe('buildExplorerDeepLink', () => {
	it('baut /explore?layers=kuehle-orte (FR20, Story 16.1)', () => {
		expect(buildExplorerDeepLink(['kuehle-orte'])).toBe('/explore?layers=kuehle-orte');
	});

	it('serialisiert mehrere Slugs bundle-stabil, round-trip zu parseLayers', () => {
		const link = buildExplorerDeepLink(['kuehle-orte', 'trinkbrunnen']);
		expect(link.startsWith('/explore?layers=')).toBe(true);
		const csv = link.split('layers=')[1];
		expect(parseLayers(csv)).toEqual(['kuehle-orte', 'trinkbrunnen']);
	});

	it('leere Liste liefert /explore ohne Query', () => {
		expect(buildExplorerDeepLink([])).toBe('/explore');
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

describe('serializeComparison / parseComparison (Story 1.27)', () => {
	it('serialisiert a + b + active=true → a, b, compare=1', () => {
		const params = serializeComparison({
			a: [13.37771234, 52.51631234],
			b: [13.42201234, 52.51901234],
			active: true
		});
		expect(params.get('a')).toBe('13.37771,52.51631');
		expect(params.get('b')).toBe('13.42201,52.51901');
		expect(params.get('compare')).toBe('1');
	});

	it('active=false → kein compare-Param', () => {
		const params = serializeComparison({
			a: [13.4, 52.5],
			b: [13.5, 52.5],
			active: false
		});
		expect(params.get('compare')).toBeNull();
	});

	it('a ohne b mit active=true → a + compare=1, b weggelassen', () => {
		const params = serializeComparison({ a: [13.4, 52.5], active: true });
		expect(params.get('a')).toBe('13.40000,52.50000');
		expect(params.get('b')).toBeNull();
		expect(params.get('compare')).toBe('1');
	});

	it('leerer State → leere URLSearchParams', () => {
		const params = serializeComparison({ active: false });
		expect([...params.keys()]).toEqual([]);
	});

	it('parseComparison roundtrip mit beiden Adressen', () => {
		const original = {
			a: [13.37771, 52.51631] as [number, number],
			b: [13.42201, 52.51901] as [number, number],
			active: true
		};
		const params = serializeComparison(original);
		const parsed = parseComparison(params);
		expect(parsed.a).toEqual([13.37771, 52.51631]);
		expect(parsed.b).toEqual([13.42201, 52.51901]);
		expect(parsed.active).toBe(true);
	});

	it('parseComparison mit compare=1 aber ohne b → active=false (Fallback per AC-7)', () => {
		const parsed = parseComparison(new URLSearchParams('a=13.4,52.5&compare=1'));
		expect(parsed.a).toEqual([13.4, 52.5]);
		expect(parsed.b).toBeUndefined();
		expect(parsed.active).toBe(false);
	});

	it('parseComparison toleriert invalid Coordinates', () => {
		const parsed = parseComparison(new URLSearchParams('a=foo,bar&b=200,100&compare=1'));
		expect(parsed.a).toBeUndefined();
		expect(parsed.b).toBeUndefined();
		expect(parsed.active).toBe(false);
	});

	it('parseComparison toleriert komplett leere Params', () => {
		const parsed = parseComparison(new URLSearchParams(''));
		expect(parsed).toEqual({ active: false });
	});
});

describe('buildComparePermalink (Story 1.27)', () => {
	it('baut vollständigen Permalink mit a + b + compare=1', () => {
		const url = buildComparePermalink(
			'https://navigator.berlin',
			{
				a: [13.37771, 52.51631],
				b: [13.42201, 52.51901],
				active: true
			},
			[]
		);
		expect(url).toBe(
			'https://navigator.berlin/?a=13.37771%2C52.51631&b=13.42201%2C52.51901&compare=1'
		);
	});

	it('berücksichtigt Layer-CSV via `layers`-Param', () => {
		const url = buildComparePermalink(
			'https://navigator.berlin',
			{ a: [13.4, 52.5], b: [13.5, 52.5], active: true },
			['mietspiegel-wohnlage', 'laerm-night']
		);
		expect(url).toContain('layers=mietspiegel-wohnlage%2Claerm-night');
	});

	it('ohne active=true (single-mode) → kein compare=1', () => {
		const url = buildComparePermalink(
			'https://navigator.berlin',
			{ a: [13.4, 52.5], active: false },
			[]
		);
		expect(url).not.toContain('compare=1');
	});

	it('akzeptiert Origin mit Pfad-Suffix', () => {
		const url = buildComparePermalink(
			'https://navigator.berlin/de',
			{ a: [13.4, 52.5], b: [13.5, 52.5], active: true },
			[]
		);
		expect(url.startsWith('https://navigator.berlin/de')).toBe(true);
	});
});
