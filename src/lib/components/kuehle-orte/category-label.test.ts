import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { categoryLabel } from './category-label.js';

const PAIRS: readonly (readonly [string, string])[] = [
	['Museum', 'Museum'],
	['Bibliothek', 'Library'],
	['Mall/Center', 'Shopping centre'],
	['Kino', 'Cinema'],
	['Schwimmzentrum', 'Swimming pool'],
	['Kirche', 'Church'],
	['Kaufhaus', 'Department store'],
	['Eishalle', 'Ice rink'],
	['Bad', 'Pool'],
	['Wasserpark', 'Water park'],
	['Stadtteilzentrum', 'Community centre']
];

describe('categoryLabel', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('DE liefert den Rohwert unverändert, ohne lang', () => {
		for (const [raw] of PAIRS) expect(categoryLabel(raw)).toEqual({ text: raw });
	});

	it('EN übersetzt alle bekannten Kategorien', () => {
		overwriteGetLocale(() => 'en');
		for (const [raw, en] of PAIRS) expect(categoryLabel(raw)).toEqual({ text: en });
	});

	it('unbekannter Wert bleibt Rohwert, auf EN mit lang="de"', () => {
		expect(categoryLabel('Sauna')).toEqual({ text: 'Sauna' });
		overwriteGetLocale(() => 'en');
		expect(categoryLabel('Sauna')).toEqual({ text: 'Sauna', lang: 'de' });
		expect(categoryLabel('constructor')).toEqual({ text: 'constructor', lang: 'de' });
	});
});
