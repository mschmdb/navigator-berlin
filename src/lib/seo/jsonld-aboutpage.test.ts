import { describe, expect, it } from 'vitest';
import { aboutPageId, buildAboutPage } from './jsonld-aboutpage.js';

const base = {
	origin: 'https://navigator.berlin',
	name: 'Über das Projekt',
	description: 'Beschreibung',
	urlPath: '/ueber',
	inLanguage: 'de-DE'
};

describe('buildAboutPage', () => {
	it('hat @context, @type AboutPage, @id und url', () => {
		const out = buildAboutPage(base);
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('AboutPage');
		expect(out['@id']).toBe('https://navigator.berlin/ueber#about');
		expect(out.url).toBe('https://navigator.berlin/ueber');
		expect(out.inLanguage).toBe('de-DE');
	});

	it('about und mainEntity zeigen auf die Organization-@id', () => {
		const out = buildAboutPage(base);
		expect(out.about['@id']).toBe('https://navigator.berlin/#organization');
		expect(out.mainEntity['@id']).toBe('https://navigator.berlin/#organization');
		expect(out.mainEntity.name).toBe('navigator.berlin');
	});

	it('die Organization trägt die volle Person als founder (Kante Organization zu Person)', () => {
		const founder = buildAboutPage(base).mainEntity.founder;
		expect(founder['@type']).toBe('Person');
		expect(founder['@id']).toBe('https://schmidbauer.dev/#person');
		expect(founder.sameAs).toHaveLength(2);
	});

	it('EN: eigene @id und url aus der lokalisierten Canonical-URL', () => {
		const out = buildAboutPage({ ...base, urlPath: '/en/ueber', inLanguage: 'en-US' });
		expect(out['@id']).toBe('https://navigator.berlin/en/ueber#about');
		expect(out.url).toBe('https://navigator.berlin/en/ueber');
	});

	it('konsolidiert die hitze-Subdomain auf die Hauptdomain, auch bei url und Organization', () => {
		const out = buildAboutPage({ ...base, origin: 'https://hitze.navigator.berlin/' });
		expect(out['@id']).toBe('https://navigator.berlin/ueber#about');
		expect(out.url).toBe('https://navigator.berlin/ueber');
		expect(out.mainEntity.url).toBe('https://navigator.berlin');
	});
});

describe('aboutPageId', () => {
	it('hängt #about an die lokalisierte Canonical-URL', () => {
		expect(aboutPageId('https://navigator.berlin/', '/en/ueber')).toBe(
			'https://navigator.berlin/en/ueber#about'
		);
	});
});
