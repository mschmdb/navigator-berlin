import { describe, expect, it } from 'vitest';
import {
	CHAPTERS,
	METRIC_SPECS,
	METRICS,
	characterPoints,
	formatMetric,
	metricLead,
	type MetricValues
} from './topics';

describe('formatMetric', () => {
	it('formats with German decimals and unit', () => {
		expect(formatMetric('bestandsmiete', 7.834)).toBe('7,83\u00a0€/m²');
		expect(formatMetric('laermDb', 46.2)).toBe('46,2\u00a0dB');
		expect(formatMetric('altbau', null)).toBe('keine Angabe');
	});
});

describe('metricLead', () => {
	it('uses the lower word when most places are higher', () => {
		expect(metricLead('laermDb', 'Reuterstraße', 46, [46, 50, 52, 55, 44], 'Kieze')).toBe(
			'Verkehrslärm in Reuterstraße: 46,0\u00a0dB. Das ist leiser als in 60 % der Berliner Kieze.'
		);
	});
	it('uses the higher word when most places are lower', () => {
		expect(metricLead('bestandsmiete', 'X', 9, [6, 7, 8, 9], 'Bezirke')).toBe(
			'Miete in laufenden Verträgen in X: 9,00\u00a0€/m². Das ist teurer als in 75 % der Berliner Bezirke.'
		);
	});
	it('names the chosen comparison with the difference, then the Berlin field', () => {
		expect(
			metricLead('laermDb', 'Reuterstraße', 46.2, [46.2, 50, 52, 55, 44], 'Kieze', {
				name: 'Neukölln gesamt',
				value: 47.2
			})
		).toBe(
			'Verkehrslärm in Reuterstraße: 46,2\u00a0dB. Das ist 1,0\u00a0dB leiser als Neukölln gesamt, insgesamt leiser als in 60 % der Berliner Kieze.'
		);
	});
	it('uses percentage points for shares', () => {
		expect(metricLead('altbau', 'X', 77, [], 'Kieze', { name: 'Rixdorf', value: 61 })).toBe(
			'Altbau in X: 77\u00a0% der Wohnungen. Das ist 16\u00a0Prozentpunkte mehr Altbau als Rixdorf.'
		);
	});
	it('says so when there is no value', () => {
		expect(metricLead('pet', 'X', null, [1, 2], 'Kieze')).toBe('Für X gibt es dazu keine Angabe.');
	});
	it('keeps only the value sentence when all values are equal', () => {
		expect(metricLead('kitas', 'X', 3, [3, 3], 'Kieze')).toBe('Kitas in X: 3\u00a0im Gebiet.');
	});
});

describe('chapter registry', () => {
	it('uses only known metrics and every metric has a spec', () => {
		for (const c of CHAPTERS) {
			for (const m of [...c.main, ...c.side]) expect(METRICS).toContain(m);
		}
		for (const m of METRICS) expect(METRIC_SPECS[m].label.length).toBeGreaterThan(0);
	});
});

describe('characterPoints', () => {
	const base = Object.fromEntries(METRICS.map((m) => [m, 50])) as Record<string, number | null>;
	const make = (o: Record<string, number | null>) => ({ ...base, ...o }) as MetricValues;
	const all = [10, 20, 30, 40].map((v) => make({ dichte: v, altbau: v, laermDb: 50 }));

	it('names the most extreme metrics with direction and share', () => {
		const own = make({ dichte: 99, altbau: 1, laermDb: 50 });
		expect(characterPoints(own, [...all, own], 'Kieze', 2)).toEqual([
			'Altbau: weniger Altbau als 80 % der Berliner Kieze',
			'Einwohnerdichte: dichter besiedelt als 80 % der Berliner Kieze'
		]);
	});
	it('returns nothing when the place is ordinary everywhere', () => {
		const own = make({ dichte: 25, altbau: 25 });
		expect(characterPoints(own, all, 'Kieze')).toEqual([]);
	});
});
