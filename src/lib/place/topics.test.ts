import { describe, expect, it } from 'vitest';

// 20 Werte: Prozentangaben gelten erst ab 20 Orten, darunter zählt die Seite („3 von 12“).
const FIELD_20 = [...Array(12).fill(50), ...Array(8).fill(44)];
const RENT_20 = [...Array(15).fill(7), ...Array(5).fill(9)];
import {
	CHAPTERS,
	METRIC_SPECS,
	METRICS,
	chapterText,
	labelValueText,
	metricText,
	formatMetric,
	hintFor,
	metricLead
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
		expect(metricLead('laermDb', 'Reuterstraße', 46, FIELD_20, 'Kieze')).toBe(
			'In Reuterstraße liegt der Verkehrslärm im Mittel bei 46,0\u00a0dB. Das ist leiser als in 60 % der Berliner Kieze.'
		);
	});
	it('uses the higher word when most places are lower', () => {
		expect(metricLead('bestandsmiete', 'X', 9, RENT_20, 'Bezirke')).toBe(
			'In X kostet die Miete in laufenden Verträgen 9,00\u00a0€/m² kalt. Das ist teurer als in 75 % der Berliner Bezirke.'
		);
	});
	it('names the chosen comparison with the difference, then the Berlin field', () => {
		expect(
			metricLead('laermDb', 'Reuterstraße', 46.2, FIELD_20, 'Kieze', {
				name: 'Neukölln gesamt',
				value: 47.2
			})
		).toBe(
			'In Reuterstraße liegt der Verkehrslärm im Mittel bei 46,2\u00a0dB. Das ist 1,0\u00a0dB leiser als Neukölln gesamt, insgesamt leiser als in 60 % der Berliner Kieze.'
		);
	});
	it('uses percentage points for shares', () => {
		expect(metricLead('altbau', 'X', 77, [], 'Kieze', { name: 'Rixdorf', value: 61 })).toBe(
			'Altbau in X: 77\u00a0% der Wohnungen. Das ist 16\u00a0Prozentpunkte mehr Altbau als Rixdorf.'
		);
	});
	it('counts instead of percent for the 12 Bezirke', () => {
		expect(
			metricLead(
				'laermDb',
				'Spandau',
				46.4,
				[46.4, 47, 48, 49, 45, 50, 51, 52, 53, 54, 55, 56],
				'Bezirke'
			)
		).toBe(
			'In Spandau liegt der Verkehrslärm im Mittel bei 46,4\u00a0dB. Das ist leiser als 10 von 12 Bezirken.'
		);
	});
	it('says so when there is no value', () => {
		expect(metricLead('pet', 'X', null, [1, 2], 'Kieze')).toBe('Für X gibt es dazu keine Angabe.');
	});
	it('writes a full sentence for every chapter lead metric', () => {
		const lead = (id: Parameters<typeof metricLead>[0], v: number) =>
			metricLead(id, 'X', v, [], 'Kieze').split('. ')[0];
		expect(lead('gruenanlagen', 1.2)).toBe(
			'Parks und Grünanlagen bedecken in X 1,2\u00a0% der Fläche.'
		);
		expect(lead('pet', 35.3)).toBe(
			'An einem heißen Sommernachmittag fühlt es sich in X an wie 35,3\u00a0°C.'
		);
		expect(lead('haltestellenKm2', 23.9)).toBe(
			'In X gibt es 23,9 Haltestellen je Quadratkilometer.'
		);
		expect(lead('lebensmittel10k', 19)).toBe(
			'In X kommen 19,0 Lebensmittelgeschäfte auf 10.000 Menschen.'
		);
		expect(lead('dichte', 26507)).toBe('In X leben 26.507 Menschen je Quadratkilometer.');
	});
	it('compares counts with more and less', () => {
		expect(metricLead('haltestellenKm2', 'X', 20, FIELD_20, 'Kieze')).toMatch(
			/Das ist (mehr|weniger) als in \d+ % der Berliner Kieze\.$/
		);
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
		expect(metricLead('laermDb', 'Reuterstraße', 46, FIELD_20, 'Kieze', null, en)).toBe(
			"Traffic noise in Reuterstraße averages 46.0\u00a0dB. That is quieter than in 60% of Berlin's Kieze."
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
});

import { CHAPTERS as ALL_CHAPTERS, DIM_CHAPTER_ANCHOR, chapterAnchorForSort } from './topics';

describe('chapterAnchorForSort', () => {
	it('jumps into the matching chapter for a sorted area', () => {
		expect(chapterAnchorForSort('gruenHitze')).toBe('#gruen');
		expect(chapterAnchorForSort('ruheLuft')).toBe('#laerm');
	});
	it('adds no anchor for the default sort, names or unknown keys', () => {
		expect(chapterAnchorForSort('composite')).toBe('');
		expect(chapterAnchorForSort('name')).toBe('');
	});
	it('only points at anchors that exist on the pages', () => {
		const ids = new Set([
			...ALL_CHAPTERS.map((c) => c.id),
			'ueberblick',
			'wahlen',
			'nachbarn',
			'fragen'
		]);
		for (const a of Object.values(DIM_CHAPTER_ANCHOR)) expect(ids.has(a)).toBe(true);
	});
});
