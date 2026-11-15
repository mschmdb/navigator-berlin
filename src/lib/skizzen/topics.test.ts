import { describe, expect, it } from 'vitest';
import {
	CHAPTERS,
	METRIC_SPECS,
	METRICS,
	chapterText,
	labelValueText,
	metricText,
	characterPoints,
	formatMetric,
	hintFor,
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
		expect(metricLead('kitas', 'X', 3, [3, 3], 'Kieze')).toBe(
			'Kitas in X: 3,0\u00a0je 10.000 Menschen.'
		);
	});
});

describe('chapter registry', () => {
	it('uses only known metrics and every metric has a spec', () => {
		for (const c of CHAPTERS) {
			for (const m of [...c.main, ...c.side]) expect(METRICS).toContain(m);
		}
		for (const m of METRICS) {
			expect(METRIC_SPECS[m].digits).toBeGreaterThanOrEqual(0);
			expect(metricText(m).label.length).toBeGreaterThan(0);
			expect(metricText(m, { locale: 'en' }).label.length).toBeGreaterThan(0);
		}
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

describe('hintFor', () => {
	it('marks quieter as good and names the comparison', () => {
		expect(hintFor('laermDb', 46.2, 49.1, 'Berlin-Median')).toEqual({
			dir: 'lower',
			tone: 'good',
			text: 'leiser als Berlin-Median',
			short: 'leiser'
		});
	});
	it('marks less green as bad', () => {
		expect(hintFor('gruenanlagen', 1.2, 5.3, 'Berlin-Median')?.tone).toBe('bad');
	});
	it('stays neutral for rent, density and crime', () => {
		expect(hintFor('bestandsmiete', 7.83, 7.62, 'X')).toEqual({
			dir: 'higher',
			tone: 'neutral',
			text: 'teurer als X',
			short: 'teurer'
		});
		expect(hintFor('dichte', 26000, 6000, 'X')?.tone).toBe('neutral');
		expect(hintFor('kriminalitaet', 4000, 3000, 'X')?.tone).toBe('neutral');
	});
	it('says roughly equal below the display precision', () => {
		expect(hintFor('laermDb', 46.21, 46.24, 'X')).toEqual({
			dir: 'same',
			tone: 'neutral',
			text: 'etwa wie X',
			short: 'etwa gleich'
		});
	});
	it('returns null without values', () => {
		expect(hintFor('pet', null, 30, 'X')).toBeNull();
	});
});

describe('English output', () => {
	const en = { locale: 'en' } as const;
	it('formats numbers and units with English separators', () => {
		expect(formatMetric('bestandsmiete', 7.834, en)).toBe('7.83\u00a0€/m²');
		expect(formatMetric('altbau', 77, en)).toBe('77% of homes');
		expect(formatMetric('altbau', null, en)).toBe('no data');
	});
	it('builds the lead sentence in English', () => {
		expect(metricLead('laermDb', 'Reuterstraße', 46, [46, 50, 52, 55, 44], 'Kieze', null, en)).toBe(
			"Traffic noise in Reuterstraße: 46.0\u00a0dB. That is quieter than in 60% of Berlin's Kieze."
		);
		expect(metricLead('altbau', 'X', 77, [], 'Kieze', { name: 'Rixdorf', value: 61 }, en)).toBe(
			'Old buildings in X: 77% of homes. That is 16\u00a0percentage points more old buildings than Rixdorf.'
		);
	});
	it('translates hints, chapters and category values', () => {
		expect(hintFor('laermDb', 46.2, 49.1, 'Berlin median', en)?.text).toBe(
			'quieter than Berlin median'
		);
		expect(chapterText('laerm', en).title).toBe('Noise and air');
		expect(labelValueText('sehr niedrig', en)).toBe('very low');
		expect(labelValueText('sehr niedrig')).toBe('sehr niedrig');
		expect(labelValueText('unbekannt', en)).toBe('unbekannt');
	});
	it('names characteristic points in English', () => {
		const base = Object.fromEntries(METRICS.map((m) => [m, 50])) as Record<string, number | null>;
		const make = (o: Record<string, number | null>) => ({ ...base, ...o }) as MetricValues;
		const all = [10, 20, 30, 40].map((v) => make({ dichte: v }));
		const own = make({ dichte: 99 });
		expect(characterPoints(own, [...all, own], 'Kieze', 1, en)).toEqual([
			"Population density: more densely populated than 80% of Berlin's Kieze"
		]);
	});
});
