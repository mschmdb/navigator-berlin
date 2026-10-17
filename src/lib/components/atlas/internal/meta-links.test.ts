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

describe('Kälte-Navigator im Footer (#63)', () => {
	it('steht direkt nach Hitze in "erkunden" und verlinkt /kaelte', () => {
		const ids = META_LINK_GROUPS.find((g) => g.id === 'erkunden')?.links.map((l) => l.id) ?? [];
		expect(ids.indexOf('kaelte')).toBe(ids.indexOf('hitze') + 1);
		expect(META_LINKS.find((l) => l.id === 'kaelte')?.href).toBe('/kaelte');
	});

	it('DE/EN-Labels', () => {
		expect(metaLinkLabel('kaelte', { locale: 'de' })).toBe('Kälte-Navigator');
		expect(metaLinkLabel('kaelte', { locale: 'en' })).toBe('Cold Navigator');
	});
});

describe('Übersichtsseiten im Footer (S7)', () => {
	const erkunden = META_LINK_GROUPS.find((g) => g.id === 'erkunden');

	it('Gruppe "erkunden" behält die bestehenden Links in Reihenfolge und endet mit den drei Übersichten', () => {
		expect(erkunden?.links.map((l) => l.id)).toEqual([
			'atlas',
			'score',
			'wahlen',
			'hitze',
			'kaelte',
			'kieze',
			'bezirke',
			'daten'
		]);
		expect(erkunden?.links.slice(-3).map((l) => l.href)).toEqual(['/kieze', '/bezirke', '/daten']);
	});

	it('DE/EN-Labels', () => {
		expect(metaLinkLabel('kieze')).toBe('Alle Kieze');
		expect(metaLinkLabel('bezirke')).toBe('Alle Bezirke');
		expect(metaLinkLabel('daten')).toBe('Daten-Layer');
		expect(metaLinkLabel('kieze', { locale: 'en' })).toBe('All Kieze');
		expect(metaLinkLabel('bezirke', { locale: 'en' })).toBe('All Bezirke');
		expect(metaLinkLabel('daten', { locale: 'en' })).toBe('Data layers');
	});

	it('die flache Kompaktliste bleibt unverändert', () => {
		expect(META_LINKS.some((l) => l.href === '/kieze')).toBe(false);
	});
});

describe('Über-Seite im Footer', () => {
	it('Gruppe "transparenz" beginnt mit dem Link auf /ueber', () => {
		const transparenz = META_LINK_GROUPS.find((g) => g.id === 'transparenz');
		expect(transparenz?.links[0]).toEqual({ id: 'ueber', href: '/ueber' });
	});

	it('die flache Liste enthält /ueber', () => {
		expect(META_LINKS.find((l) => l.id === 'ueber')?.href).toBe('/ueber');
	});

	it('DE/EN-Labels', () => {
		expect(metaLinkLabel('ueber')).toBe('Über das Projekt');
		expect(metaLinkLabel('ueber', { locale: 'en' })).toBe('About the project');
	});
});
