import { describe, expect, it } from 'vitest';
import { buildInput, countSharedRanks, DIMS } from './build.js';
import { hashInput } from './input.js';

const NO_NAMES = { kiez: new Map<string, string>(), bezirk: new Map<string, string>() };

/**
 * Story 14.8: Kriminalität ist Karten-Kontext, fließt bewusst NICHT in den Profil-Input
 * (Stigma-Schutz, ADR-019). Dadurch bleibt der inputHash stabil → keine Regeneration.
 */
function area(scoreOverrides: Record<string, number | null> = {}) {
	return {
		slug: 'test-kiez',
		bezirkSlug: 'mitte',
		score: {
			composite: 50,
			ruheLuft: 60,
			gruenHitze: 40,
			mobilitaet: 70,
			versorgung: 55,
			wohnschutz: 80,
			kultur: 65,
			...scoreOverrides
		},
		stats: {},
		ranks: new Map(),
		cmps: new Map()
	};
}

describe('DIMS (Profil-Grounding-Dimensionen)', () => {
	it('enthält Kriminalität NICHT (Stigma-Schutz, Story 14.8)', () => {
		expect(DIMS.map((d) => d.key)).not.toContain('kriminalitaet');
		expect(DIMS.map((d) => d.label)).not.toContain('Erfasste Kriminalität');
	});

	it('listet genau die sechs Profil-Dimensionen (5 Composite + Kultur)', () => {
		expect(DIMS.map((d) => d.key)).toEqual([
			'ruheLuft',
			'gruenHitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz',
			'kultur'
		]);
	});
});

describe('buildInput Kriminalitäts-Exklusion', () => {
	it('nimmt keine Kriminalitäts-Dimension in den Input', () => {
		const input = buildInput('kiez', area({ kriminalitaet: 95 }), NO_NAMES);
		expect(input.dims.some((d) => /kriminalit/i.test(d.label))).toBe(false);
		expect(input.dims).toHaveLength(6);
	});

	it('inputHash ist stabil gegenüber dem Kriminalitäts-Wert', () => {
		const ohne = hashInput(buildInput('kiez', area(), NO_NAMES));
		const niedrig = hashInput(buildInput('kiez', area({ kriminalitaet: 5 }), NO_NAMES));
		const hoch = hashInput(buildInput('kiez', area({ kriminalitaet: 100 }), NO_NAMES));
		expect(niedrig).toBe(ohne);
		expect(hoch).toBe(ohne);
	});
});

describe('buildInput Anzeigenamen (#96)', () => {
	const names = {
		kiez: new Map([['suedliche-luisenstadt', 'Südliche Luisenstadt']]),
		bezirk: new Map([['friedrichshain-kreuzberg', 'Friedrichshain-Kreuzberg']])
	};

	it('nimmt Kiez- und Bezirksnamen aus den GeoJSON-Anzeigenamen', () => {
		const input = buildInput(
			'kiez',
			{ ...area(), slug: 'suedliche-luisenstadt', bezirkSlug: 'friedrichshain-kreuzberg' },
			names
		);
		expect(input.name).toBe('Südliche Luisenstadt');
		expect(input.bezirk).toBe('Friedrichshain-Kreuzberg');
	});

	it('nimmt für Bezirksprofile den Bezirks-Anzeigenamen', () => {
		const input = buildInput(
			'bezirk',
			{ ...area(), slug: 'friedrichshain-kreuzberg', bezirkSlug: null },
			names
		);
		expect(input.name).toBe('Friedrichshain-Kreuzberg');
		expect(input.bezirk).toBeNull();
	});
});

describe('geteilte Ränge im Profil-Input', () => {
	const rank = (metricKey: string, rang: number | null, geteiltMit = 0) => ({
		metricKey,
		rang,
		quartil: 1,
		total: 143,
		geteiltMit
	});

	it('zählt pro Metrik, wie viele andere Gebiete denselben Rang haben', () => {
		const shared = countSharedRanks([
			{ slug: 'a', metricKey: 'composite', rang: 1 },
			{ slug: 'b', metricKey: 'composite', rang: 1 },
			{ slug: 'c', metricKey: 'composite', rang: 1 },
			{ slug: 'd', metricKey: 'composite', rang: 4 },
			{ slug: 'a', metricKey: 'kultur', rang: 1 },
			{ slug: 'e', metricKey: 'kultur', rang: null },
			{ slug: 'f', metricKey: 'kultur', rang: null }
		]);
		expect(shared('composite', 1)).toBe(2);
		expect(shared('composite', 4)).toBe(0);
		expect(shared('kultur', 1)).toBe(0);
		expect(shared('kultur', null)).toBe(0);
	});

	it('setzt rangGeteiltMit nur bei geteiltem Rang', () => {
		const input = buildInput(
			'kiez',
			{
				...area(),
				ranks: new Map([
					['composite', rank('composite', 1, 4)],
					['kultur', rank('kultur', 2, 1)],
					['ruheLuft', rank('ruheLuft', 2)]
				])
			},
			NO_NAMES
		);
		expect(input.composite).toEqual({ score: 50, rang: 1, total: 143, rangGeteiltMit: 4 });
		const byLabel = Object.fromEntries(input.dims.map((d) => [d.label, d]));
		expect(byLabel['Kultur'].rangGeteiltMit).toBe(1);
		expect('rangGeteiltMit' in byLabel['Ruhe & Luft']).toBe(false);
	});
});
