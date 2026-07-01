import { describe, expect, it } from 'vitest';
import { HITZE_FAQ } from './hitze-faq.js';

const ABSOLUTISMEN = ['einzige', 'vollständig', 'garantiert', 'beste', 'besser als die stadt'];

describe('HITZE_FAQ', () => {
	it('hat mehrere Q&A-Paare mit nicht-leerem Text', () => {
		expect(HITZE_FAQ.length).toBeGreaterThanOrEqual(4);
		for (const item of HITZE_FAQ) {
			expect(item.question.trim().length).toBeGreaterThan(0);
			expect(item.answer.trim().length).toBeGreaterThan(0);
		}
	});

	it('trifft Suchintention (kühle Orte, klimatisiert, Hitze)', () => {
		const blob = HITZE_FAQ.map((i) => `${i.question} ${i.answer}`.toLowerCase()).join(' ');
		expect(blob).toContain('kühle orte');
		expect(blob).toContain('klimatisiert');
		expect(blob).toContain('hitze');
	});

	it('kein em-dash, kein Absolutismus', () => {
		const blob = HITZE_FAQ.map((i) => `${i.question} ${i.answer}`).join(' ').toLowerCase();
		expect(blob).not.toContain('—');
		for (const token of ABSOLUTISMEN) expect(blob).not.toContain(token);
	});
});
