import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { META_LINKS, META_LINK_GROUPS, metaLinkLabel, metaLinkGroupTitle } from './meta-links.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('metaLinkLabel', () => {
	it('DE: loest bekannte ids auf', () => {
		expect(metaLinkLabel('methodik')).toBe('Methodik');
		expect(metaLinkLabel('wahlen')).toBe('Wahlen');
	});

	it('EN: loest dieselben ids englisch auf', () => {
		overwriteGetLocale(() => 'en');
		expect(metaLinkLabel('methodik')).toBe('Methodology');
		expect(metaLinkLabel('wahlen')).toBe('Elections');
	});

	it('explizites { locale } hat Vorrang vor getLocale()', () => {
		expect(metaLinkLabel('methodik', { locale: 'en' })).toBe('Methodology');
	});
});

describe('metaLinkGroupTitle', () => {
	it('DE/EN', () => {
		expect(metaLinkGroupTitle('sonstiges')).toBe('Sonstiges');
		expect(metaLinkGroupTitle('sonstiges', { locale: 'en' })).toBe('Other');
	});
});

// Review-Fund (Spec i18n Block B2): Kontakt-Link haengt an einer festen
// Gruppen-`id` ('sonstiges'), nicht am (jetzt uebersetzten) Titel-Text.
describe('Datenschluessel-Kontrakt', () => {
	it('META_LINK_GROUPS hat die Gruppe mit id "sonstiges"', () => {
		expect(META_LINK_GROUPS.some((g) => g.id === 'sonstiges')).toBe(true);
	});

	it('META_LINKS/META_LINK_GROUPS-hrefs bleiben unuebersetzte Datenschluessel', () => {
		expect(META_LINKS.find((l) => l.id === 'methodik')?.href).toBe('/methodik');
		const erkunden = META_LINK_GROUPS.find((g) => g.id === 'erkunden');
		expect(erkunden?.links.find((l) => l.id === 'atlas')?.href).toBe('/explore');
	});
});
