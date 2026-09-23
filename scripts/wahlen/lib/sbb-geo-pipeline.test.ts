import { describe, it, expect } from 'vitest';
import { rawGruppeSchluessel, dissolveGruppen } from './sbb-geo-pipeline.js';

describe('rawGruppeSchluessel', () => {
	it('ah16: liest BWB', () => {
		expect(rawGruppeSchluessel({ BEZ: '01', BWB: '011a' }, 'ah16')).toBe('01_011A');
	});

	it('btw17: liest BWB2', () => {
		expect(rawGruppeSchluessel({ BEZ: '05', BWB2: '2c' }, 'btw17')).toBe('05_2C');
	});

	it('ah21/ah26/bt25: liest BWB3', () => {
		expect(rawGruppeSchluessel({ BEZ: '09', BWB3: '7p' }, 'ah21')).toBe('09_7P');
		expect(rawGruppeSchluessel({ BEZ: '09', BWB3: '7p' }, 'ah26')).toBe('09_7P');
		expect(rawGruppeSchluessel({ BEZ: '09', BWB3: '1a' }, 'bt25')).toBe('09_1A');
	});

	it('null bei fehlendem BEZ, fehlendem Feld oder unbekanntem Geo-Slug', () => {
		expect(rawGruppeSchluessel({ BWB3: '1A' }, 'ah21')).toBeNull();
		expect(rawGruppeSchluessel({ BEZ: '01' }, 'ah21')).toBeNull();
		expect(rawGruppeSchluessel({ BEZ: '01', BWB3: '1A' }, 'ah23')).toBeNull();
	});
});

function square(x: number, y: number, props: Record<string, unknown>) {
	return {
		type: 'Feature' as const,
		properties: props,
		geometry: {
			type: 'Polygon' as const,
			coordinates: [
				[
					[x, y],
					[x + 1, y],
					[x + 1, y + 1],
					[x, y + 1],
					[x, y]
				]
			]
		}
	};
}

describe('dissolveGruppen', () => {
	it('dissolviert zwei angrenzende Urnen mit gleichem Briefwahlbezirk zu einer Fläche', async () => {
		const fc = {
			type: 'FeatureCollection',
			features: [
				square(0, 0, { BEZ: '09', BWB3: '7P', UWB3: '726' }),
				square(1, 0, { BEZ: '09', BWB3: '7P', UWB3: '727' }),
				square(5, 5, { BEZ: '09', BWB3: '9Z', UWB3: '900' })
			]
		};
		const out = JSON.parse(await dissolveGruppen(JSON.stringify(fc), 'ah21')) as {
			features: { properties: Record<string, unknown> }[];
		};
		expect(out.features).toHaveLength(2);
		const bwb3Values = out.features.map((f) => f.properties.BWB3).sort();
		expect(bwb3Values).toEqual(['7P', '9Z']);
		const gruppe7P = out.features.find((f) => f.properties.BWB3 === '7P');
		expect(gruppe7P?.properties.MEMBERS).toBe('726,727');
		expect(gruppe7P?.properties._GRP).toBeUndefined();
	});

	it('wirft bei leerer BWB-Spalte (Preflight "leere BWB")', async () => {
		const fc = {
			type: 'FeatureCollection',
			features: [square(0, 0, { BEZ: '09', UWB3: '900' })]
		};
		await expect(dissolveGruppen(JSON.stringify(fc), 'ah21')).rejects.toThrow('leere BWB');
	});
});
