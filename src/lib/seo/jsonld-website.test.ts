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

	it('hat potentialAction SearchAction mit urlTemplate auf root-route', () => {
		const out = buildWebSite(baseInput);
		const action = out.potentialAction;
		expect(action['@type']).toBe('SearchAction');
		expect(action.target.urlTemplate).toBe(
			'https://navigator.berlin/?address={search_term_string}'
		);
		expect(action.target['@type']).toBe('EntryPoint');
		expect(action['query-input']).toBe('required name=search_term_string');
	});

	it('strippt trailing-slash aus origin fuer url + urlTemplate', () => {
		const out = buildWebSite({ ...baseInput, origin: 'https://navigator.berlin/' });
		expect(out.url).toBe('https://navigator.berlin');
		expect(out.potentialAction.target.urlTemplate).toBe(
			'https://navigator.berlin/?address={search_term_string}'
		);
	});

	it('akzeptiert optionalen searchPath-Override fuer Atlas-Pivot Story 2.11 → /explore', () => {
		const out = buildWebSite({ ...baseInput, searchPath: '/explore' });
		expect(out.potentialAction.target.urlTemplate).toBe(
			'https://navigator.berlin/explore?address={search_term_string}'
		);
	});
});
