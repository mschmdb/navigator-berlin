import { describe, expect, it } from 'vitest';
import { formatWeightedMeanContext } from './weighted-mean-context.js';
import { CARD_SLUGS } from './card-slugs.js';

const agg = (mean: number | null) => ({ type: 'weighted-mean' as const, mean, wohnungen: 100 });

describe('formatWeightedMeanContext', () => {
	it('DE: "11,00 €/m²"', () => {
		expect(formatWeightedMeanContext(agg(11), { locale: 'de' })).toBe('11,00 €/m²');
	});

	it('EN: "11.00 €/m²"', () => {
		expect(formatWeightedMeanContext(agg(11), { locale: 'en' })).toBe('11.00 €/m²');
	});

	it('null: keine Angabe / no data', () => {
		expect(formatWeightedMeanContext(agg(null), { locale: 'de' })).toBe('keine Angabe');
		expect(formatWeightedMeanContext(agg(null), { locale: 'en' })).toBe('no data');
	});
});

describe('CARD_SLUGS', () => {
	it('enthält die Bestandsmiete (Kiez/Bezirk/Berlin-Kontextzeilen)', () => {
		expect(CARD_SLUGS.has('zensus-bestandsmiete-2022')).toBe(true);
	});
});
