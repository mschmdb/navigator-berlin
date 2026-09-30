import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { collatorLocale, columnLabel, type SortKey } from './score-ranking-i18n.js';

const EXPECTED: Record<'de' | 'en', Record<SortKey, string>> = {
	de: {
		name: 'Name',
		bezirk: 'Bezirk',
		composite: 'Score',
		ruheLuft: 'Ruhe & Luft',
		gruenHitze: 'Grün & Hitze',
		mobilitaet: 'Mobilität',
		versorgung: 'Versorgung',
		wohnschutz: 'Wohnschutz',
		kultur: 'Kultur'
	},
	en: {
		name: 'Name',
		bezirk: 'Bezirk',
		composite: 'Score',
		ruheLuft: 'Quiet & air',
		gruenHitze: 'Green & heat',
		mobilitaet: 'Mobility',
		versorgung: 'Local amenities',
		wohnschutz: 'Tenant protection',
		kultur: 'Culture'
	}
};

describe('columnLabel', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	for (const locale of ['de', 'en'] as const) {
		it(`liefert alle Spaltenköpfe in ${locale}`, () => {
			overwriteGetLocale(() => locale);
			for (const [key, label] of Object.entries(EXPECTED[locale])) {
				expect(columnLabel(key as SortKey), key).toBe(label);
			}
		});
	}
});

describe('collatorLocale', () => {
	it('bildet Seiten-Locales auf BCP-47-Collator-Locales ab', () => {
		expect(collatorLocale('de')).toBe('de-DE');
		expect(collatorLocale('en')).toBe('en-GB');
	});
});
