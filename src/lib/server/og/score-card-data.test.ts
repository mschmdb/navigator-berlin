import { describe, it, expect } from 'vitest';
import { buildScoreCardData, formatScoreValue } from './score-card-data.js';

describe('buildScoreCardData', () => {
	it('returns empty composite + 4 null dims when score is null', () => {
		const result = buildScoreCardData(null);
		expect(result.composite).toBeNull();
		expect(result.dims).toHaveLength(4);
		for (const dim of result.dims) expect(dim.value).toBeNull();
	});

	it('returns composite + 4 dim values (Ruhe / Grün / Mob. / Vers.) — Soziale Lage omitted', () => {
		const score = {
			composite: 43,
			ruheLuft: 27,
			gruen: 31,
			mobilitaet: 35,
			versorgung: 62
		};
		const result = buildScoreCardData(score);
		expect(result.composite).toBe(43);
		expect(result.dims.map((d) => d.label)).toEqual(['Ruhe', 'Grün', 'Mob.', 'Vers.']);
		expect(result.dims.map((d) => d.value)).toEqual([27, 31, 35, 62]);
		// Stigma-Schutz: Soziale Lage darf nicht im Score-Card-Output erscheinen
		expect(result.dims.some((d) => d.label.toLowerCase().includes('soz'))).toBe(false);
	});

	it('handles partial null dims', () => {
		const result = buildScoreCardData({
			composite: 50,
			ruheLuft: null,
			gruen: 40,
			mobilitaet: null,
			versorgung: 70
		});
		expect(result.composite).toBe(50);
		expect(result.dims.map((d) => d.value)).toEqual([null, 40, null, 70]);
	});
});

describe('formatScoreValue', () => {
	it('rounds positive numbers to integer', () => {
		expect(formatScoreValue(43.6)).toBe('44');
		expect(formatScoreValue(27.4)).toBe('27');
		expect(formatScoreValue(0)).toBe('0');
		expect(formatScoreValue(100)).toBe('100');
	});

	it('returns en-dash for null / undefined / NaN', () => {
		expect(formatScoreValue(null)).toBe('–');
		expect(formatScoreValue(undefined)).toBe('–');
		expect(formatScoreValue(NaN)).toBe('–');
	});

	it('never returns em-dash (memory feedback_no_em_dashes)', () => {
		expect(formatScoreValue(null)).not.toMatch(/—/);
	});
});
