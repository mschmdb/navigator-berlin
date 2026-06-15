import { describe, it, expect } from 'vitest';
import {
	renderTemplate,
	type TemplateAggregate,
	type TemplateContext,
	type MetricContext
} from './template-renderer.js';
import type { FaqTemplate } from './template-schema.js';

const EMPTY_AGG = {
	laerm: { dominantCategory: null, categoryDistribution: null },
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: null,
		versorgungDistribution: null,
		gruenanlagenCount: null,
		spielplaetzeCount: null
	},
	klima: { meanPet: null, shareSehrHeiss: null },
	wohnen: {
		dominantWohnlage: null,
		wohnlageDistribution: null,
		dominantMss: null,
		mssDistribution: null
	},
	oepnv: { stopsPerKm2: null, uBahnCount: null, sBahnCount: null, tramCount: null, busCount: null },
	bildung: { kitasPerKm2: null, schulenPerKm2: null },
	heritage: { denkmalPerKm2: null, stolpersteinePerKm2: null }
} as unknown as TemplateAggregate;

function ctxWith(metric: MetricContext): TemplateContext {
	return {
		pageType: 'kiez',
		slug: 'test-kiez',
		name: 'Test-Kiez',
		locale: 'de',
		aggregate: EMPTY_AGG,
		metrics: new Map([['gruenHitze', metric]])
	};
}

const TEMPLATE: FaqTemplate = {
	id: 't',
	applicableTo: ['kiez'],
	requires: [],
	question: 'Wie grün ist {name}?',
	answer: '{name}: {gruenHitzeScore} von 100 ({gruenHitzeRang}), {gruenHitzeVergleich}.'
};

describe('template-renderer metrics slots (Story 11.3)', () => {
	it('füllt Score, Rang und Vergleich für starke Werte', () => {
		const out = renderTemplate(
			TEMPLATE,
			ctxWith({
				value: 72,
				rang: 12,
				quartil: 1,
				total: 143,
				compareValue: 65,
				compareLabel: 'Bezirksschnitt'
			})
		);
		expect(out?.answer).toBe('Test-Kiez: 72 von 100 (Platz 12 von 143), über dem Bezirksschnitt.');
	});

	it('Anti-Stigma: Quartil 4 → „unteres Viertel" statt letztem Rang', () => {
		const out = renderTemplate(
			TEMPLATE,
			ctxWith({
				value: 30,
				rang: 142,
				quartil: 4,
				total: 143,
				compareValue: 60,
				compareLabel: 'Bezirksschnitt'
			})
		);
		expect(out?.answer).toContain('unteres Viertel');
		expect(out?.answer).toContain('unter dem Bezirksschnitt');
		expect(out?.answer).not.toContain('Platz 142');
	});

	it('„etwa im" bei nahezu gleichem Wert', () => {
		const out = renderTemplate(
			TEMPLATE,
			ctxWith({
				value: 65,
				rang: 70,
				quartil: 2,
				total: 143,
				compareValue: 65,
				compareLabel: 'Bezirksschnitt'
			})
		);
		expect(out?.answer).toContain('etwa im Bezirksschnitt');
	});
});
