import { describe, expect, it } from 'vitest';
import { buildWebSite } from './jsonld-website.js';

describe('buildWebSite', () => {
	const baseInput = {
		origin: 'https://navigator.berlin',
		name: 'navigator.berlin',
		locale: 'de-DE',
		description: 'Berliner Geo-Datenlayer pro Adresse.'
	};

	it('hat @context + @type WebSite', () => {
		const out = buildWebSite(baseInput);
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('WebSite');
	});

	it('hat name, url, inLanguage, description', () => {
		const out = buildWebSite(baseInput);
		expect(out.name).toBe('navigator.berlin');
		expect(out.url).toBe('https://navigator.berlin');
		expect(out.inLanguage).toBe('de-DE');
		expect(out.description).toBe('Berliner Geo-Datenlayer pro Adresse.');
	});

	it('hat keine SearchAction', () => {
		const out = buildWebSite(baseInput) as unknown as Record<string, unknown>;
		expect(out.potentialAction).toBeUndefined();
	});

	it('verweist per @id auf die Organization', () => {
		expect(buildWebSite(baseInput).publisher).toEqual({
			'@type': 'Organization',
			'@id': 'https://navigator.berlin/#organization',
			name: 'navigator.berlin',
			url: 'https://navigator.berlin'
		});
	});

	it('hat @id <origin>/#website', () => {
		expect(buildWebSite(baseInput)['@id']).toBe('https://navigator.berlin/#website');
	});

	it('konsolidiert die hitze-Subdomain auf die Hauptdomain', () => {
		const out = buildWebSite({ ...baseInput, origin: 'https://hitze.navigator.berlin' });
		expect(out.url).toBe('https://navigator.berlin');
		expect(out['@id']).toBe('https://navigator.berlin/#website');
	});

	it('strippt trailing-slash aus origin', () => {
		const out = buildWebSite({ ...baseInput, origin: 'https://navigator.berlin/' });
		expect(out.url).toBe('https://navigator.berlin');
		expect(out.publisher['@id']).toBe('https://navigator.berlin/#organization');
	});
});
