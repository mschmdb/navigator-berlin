import { describe, expect, it } from 'vitest';
import { buildChapterFaq } from './faq';
import { LABELS, METRICS, type LabelValues, type MetricValues } from './topics';

const metrics = (o: Partial<Record<string, number | null>>) =>
	({ ...Object.fromEntries(METRICS.map((m) => [m, 10])), ...o }) as MetricValues;
const labels = (o: Partial<Record<string, string | null>>) =>
	({ ...Object.fromEntries(LABELS.map((l) => [l, 'mittel'])), ...o }) as LabelValues;

describe('buildChapterFaq', () => {
	const own = {
		name: 'Reuterstraße',
		metrics: metrics({ gruenanlagen: 1.2, gruenSchlecht: 80, haltestelle400m: 99, bahnhoefe: 2 }),
		labels: labels({ gruenversorgung: 'schlecht' })
	};
	const others = [metrics({ gruenanlagen: 5 }), metrics({ gruenanlagen: 8 }), own.metrics];
	const faq = buildChapterFaq(own, others, 'Kieze');

	it('orders questions by chapter and links each to its chapter', () => {
		expect(faq.map((f) => f.chapter?.id)).toEqual([
			'laerm',
			'gruen',
			'gruen',
			'wohnen',
			'unterwegs',
			'versorgung',
			'menschen'
		]);
	});
	it('answers from the same values as the chapter, so the page cannot contradict it', () => {
		const gruen = faq.find((f) => f.question === 'Wie grün ist Reuterstraße?');
		expect(gruen?.answer).toContain('1,2');
		expect(gruen?.answer).toContain('80');
		expect(gruen?.answer).toContain('„schlecht“');
		const oepnv = faq.find((f) => f.chapter?.id === 'unterwegs');
		expect(oepnv?.answer).toContain('2 U- und S-Bahnhöfe');
		expect(oepnv?.answer).not.toContain('Tram');
	});
	it('skips a question when its main value is missing', () => {
		const sparse = buildChapterFaq(
			{ ...own, metrics: metrics({ laermDb: null }) },
			others,
			'Kieze'
		);
		expect(sparse.some((f) => f.chapter?.id === 'laerm')).toBe(false);
	});
	it('writes questions, answers and class values in English', () => {
		const en = buildChapterFaq(own, others, 'Kieze', { locale: 'en' });
		const gruen = en.find((f) => f.question === 'How green is Reuterstraße?');
		expect(gruen?.answer).toContain('poor');
		expect(gruen?.answer).toContain('“poor”');
		expect(en[0].chapter?.title).toBe('Noise and air');
	});
});
