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

function ctxWith(metric: MetricContext, locale: TemplateContext['locale'] = 'de'): TemplateContext {
	return {
		pageType: 'kiez',
		slug: 'test-kiez',
		name: 'Test-Kiez',
		locale,
		aggregate: EMPTY_AGG,
		metrics: new Map([['gruenHitze', metric]])
	};
}

const TEMPLATE: FaqTemplate = {
	id: 't',
	applicableTo: ['kiez'],
	requires: [],
	question: 'Wie grün ist {name}?',
	answer:
		'Der Kiez kommt auf {gruenHitzeScore} von 100 Punkten, {gruenHitzeLage}. Das ist {gruenHitzeVergleich}.'
};

const m = (over: Partial<MetricContext>): MetricContext => ({
	value: 72,
	rang: 12,
	quartil: 1,
	total: 143,
	compareValue: 65,
	compareKind: 'bezirk',
	...over
});

describe('template-renderer metrics slots (Story 11.3, NAV-108)', () => {
	it('füllt Score, Lage und Vergleich für starke Werte', () => {
		expect(renderTemplate(TEMPLATE, ctxWith(m({})))?.answer).toBe(
			'Der Kiez kommt auf 72 von 100 Punkten, Platz 12 von 143 Kiezen. Das ist mehr als im Schnitt der Kieze im Bezirk.'
		);
	});

	it('Anti-Stigma: Quartil 4 nennt das untere Viertel, keinen Platz', () => {
		const out = renderTemplate(
			TEMPLATE,
			ctxWith(m({ value: 30, rang: 142, quartil: 4, compareValue: 60 }))
		);
		expect(out?.answer).toContain('im unteren Viertel der 143 Kieze');
		expect(out?.answer).toContain('weniger als im Schnitt');
		expect(out?.answer).not.toContain('Platz 142');
	});

	it('Gleichstand: geteilter Platz', () => {
		const out = renderTemplate(TEMPLATE, ctxWith(m({ rang: 7, geteiltMit: 2 })));
		expect(out?.answer).toContain('geteilter Platz 7 von 143 Kiezen');
	});

	it('etwa so viel bei nahezu gleichem Wert', () => {
		const out = renderTemplate(TEMPLATE, ctxWith(m({ value: 65, rang: 70, quartil: 2 })));
		expect(out?.answer).toContain('etwa so viel wie im Schnitt der Kieze im Bezirk');
	});

	it('ohne Rang fallen Score- und Vergleichssatz weg', () => {
		const out = renderTemplate(TEMPLATE, ctxWith(m({ rang: null, quartil: null })));
		expect(out?.answer).toBe('');
	});

	it('EN: Lage, Vergleich und Anti-Stigma-Formulierung', () => {
		const tpl = {
			...TEMPLATE,
			answer:
				'The Kiez gets {gruenHitzeScore} of 100 points, {gruenHitzeLage}. That is {gruenHitzeVergleich}.'
		};
		expect(renderTemplate(tpl, ctxWith(m({}), 'en'))?.answer).toBe(
			'The Kiez gets 72 of 100 points, rank 12 of 143 Kieze. That is more than the average of the Kieze in its district.'
		);
		const weak = renderTemplate(
			tpl,
			ctxWith(m({ value: 30, rang: 142, quartil: 4, compareValue: 60 }), 'en')
		);
		expect(weak?.answer).toContain('in the bottom quarter of the 143 Kieze');
		expect(weak?.answer).not.toContain('142');
		const same = renderTemplate(tpl, ctxWith(m({ value: 65, compareKind: 'berlin' }), 'en'));
		expect(same?.answer).toContain('about the same as the median Berlin district');
	});
});
