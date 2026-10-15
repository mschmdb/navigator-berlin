import { describe, expect, it } from 'vitest';
import { buildRegionOverview } from './region-overview.js';

const BEZIRKE_FC = {
	features: [
		{ properties: { Schluessel_gesamt: '11000005', Gemeinde_name: 'Spandau' } },
		{ properties: { Schluessel_gesamt: '11000001', Gemeinde_name: 'Mitte' } },
		{ properties: { Schluessel_gesamt: '11000004', Gemeinde_name: 'Charlottenburg-Wilmersdorf' } }
	]
};

const LOR_FC = {
	features: [
		{ properties: { BZR_NAME: 'Zehlendorfer  Weg', BEZ: '05' } },
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' } },
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '04' } },
		{ properties: { BZR_NAME: 'Älterer Kiez', BEZ: '01' } },
		{ properties: { BZR_NAME: 'Brunnenstraße', BEZ: '01' } },
		{ properties: { BEZ: '01' } }
	]
};

const COMPOSITES = {
	kiez: {
		'heerstrasse-spandau': 41.4,
		'heerstrasse-charlottenburg-wilmersdorf': null,
		brunnenstrasse: 50.5
	},
	bezirk: { mitte: 44.2, spandau: 38 }
};

const EINWOHNER = new Map([
	['mitte', 390000],
	['spandau', 250000]
]);

describe('buildRegionOverview', () => {
	const { bezirke: result } = buildRegionOverview({
		lorFc: LOR_FC,
		bezirkeFc: BEZIRKE_FC,
		composites: COMPOSITES,
		einwohner: EINWOHNER
	});

	it('sortiert Bezirke alphabetisch', () => {
		expect(result.map((b) => b.slug)).toEqual(['charlottenburg-wilmersdorf', 'mitte', 'spandau']);
	});

	it('gruppiert Kieze nach Bezirk und sortiert sie alphabetisch', () => {
		const mitte = result.find((b) => b.slug === 'mitte');
		expect(mitte?.kieze.map((k) => k.name)).toEqual(['Älterer Kiez', 'Brunnenstraße']);
	});

	it('nutzt disambiguierte Slugs und glaettet Whitespace in Namen', () => {
		const spandau = result.find((b) => b.slug === 'spandau');
		expect(spandau?.kieze.map((k) => k.slug)).toEqual(['heerstrasse-spandau', 'zehlendorfer-weg']);
		expect(spandau?.kieze.map((k) => k.name)).toContain('Zehlendorfer Weg');
	});

	it('rundet Scores auf ganze Zahlen, fehlender oder null-Score bleibt null', () => {
		const mitte = result.find((b) => b.slug === 'mitte');
		expect(mitte?.composite).toBe(44);
		expect(mitte?.kieze.find((k) => k.slug === 'brunnenstrasse')?.composite).toBe(51);
		expect(mitte?.kieze.find((k) => k.slug === 'aelterer-kiez')?.composite).toBeNull();
		const cw = result.find((b) => b.slug === 'charlottenburg-wilmersdorf');
		expect(cw?.kieze[0]?.composite).toBeNull();
	});

	it('uebernimmt Einwohner, fehlender Wert bleibt null', () => {
		expect(result.find((b) => b.slug === 'mitte')?.einwohner).toBe(390000);
		expect(result.find((b) => b.slug === 'charlottenburg-wilmersdorf')?.einwohner).toBeNull();
	});

	it('funktioniert ohne Composite-Datei (alle Scores null)', () => {
		const { bezirke: noScores } = buildRegionOverview({
			lorFc: LOR_FC,
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: new Map()
		});
		expect(noScores.every((b) => b.composite === null)).toBe(true);
		expect(noScores.flatMap((b) => b.kieze).every((k) => k.composite === null)).toBe(true);
		expect(noScores.flatMap((b) => b.kieze)).toHaveLength(5);
	});

	it('ordnet Kieze ohne bekannten Bezirk keinem Bezirk zu', () => {
		const { bezirke: r, problems } = buildRegionOverview({
			lorFc: { features: [{ properties: { BZR_NAME: 'Waise', BEZ: '99' } }] },
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: new Map()
		});
		expect(r.flatMap((b) => b.kieze)).toHaveLength(0);
		expect(problems.some((p) => p.includes('Waise'))).toBe(true);
	});

	it('normalisiert einstellige BEZ-Codes mit führender Null', () => {
		const { bezirke: r, problems } = buildRegionOverview({
			lorFc: { features: [{ properties: { BZR_NAME: 'Kurz', BEZ: '1' } }] },
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: new Map()
		});
		expect(r.find((b) => b.slug === 'mitte')?.kieze.map((k) => k.slug)).toEqual(['kurz']);
		expect(problems).toEqual([]);
	});

	it('meldet leere und doppelte Kiez-Slugs', () => {
		const { problems } = buildRegionOverview({
			lorFc: {
				features: [
					{ properties: { BZR_NAME: '***', BEZ: '01' } },
					{ properties: { BZR_NAME: 'Doppelt', BEZ: '01' } },
					{ properties: { BZR_NAME: 'Doppelt', BEZ: '01' } }
				]
			},
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: new Map()
		});
		expect(problems.some((p) => p.includes('leeren Slug'))).toBe(true);
		expect(problems.some((p) => p.includes('doppelt'))).toBe(true);
	});

	it('meldet fehlende Composite-Werte nur bei vorhandener Datei', () => {
		const withFile = buildRegionOverview({
			lorFc: LOR_FC,
			bezirkeFc: BEZIRKE_FC,
			composites: COMPOSITES,
			einwohner: EINWOHNER
		});
		expect(withFile.problems.some((p) => p.includes('Kiez-Scores'))).toBe(true);
		expect(withFile.problems.some((p) => p.includes('Bezirks-Scores'))).toBe(true);
		const withoutFile = buildRegionOverview({
			lorFc: LOR_FC,
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: new Map()
		});
		expect(withoutFile.problems.some((p) => p.includes('Scores'))).toBe(false);
	});

	it('meldet fehlende Einwohnerzahlen nur mit requireEinwohner', () => {
		const base = {
			lorFc: LOR_FC,
			bezirkeFc: BEZIRKE_FC,
			composites: null,
			einwohner: EINWOHNER
		};
		expect(buildRegionOverview(base).problems).toEqual([]);
		const strict = buildRegionOverview({ ...base, requireEinwohner: true });
		expect(strict.problems.some((p) => p.includes('charlottenburg-wilmersdorf'))).toBe(true);
	});
});
