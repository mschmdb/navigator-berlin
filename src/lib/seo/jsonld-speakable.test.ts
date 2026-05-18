import { describe, it, expect } from 'vitest';
import { buildSpeakableWebPage } from './jsonld-speakable.js';

describe('buildSpeakableWebPage', () => {
	const origin = 'https://navigator.berlin';

	it('rendert WebPage mit SpeakableSpecification + cssSelector-Array', () => {
		const jsonLd = buildSpeakableWebPage({
			origin,
			urlPath: '/methodik/kiez-score',
			name: 'Kiez-Score Methodik',
			cssSelectors: ['#worum', '#dimensionen', '#gewichte']
		});
		expect(jsonLd['@context']).toBe('https://schema.org');
		expect(jsonLd['@type']).toBe('WebPage');
		expect(jsonLd.url).toBe(`${origin}/methodik/kiez-score`);
		expect(jsonLd.name).toBe('Kiez-Score Methodik');
		expect(jsonLd.speakable['@type']).toBe('SpeakableSpecification');
		expect(jsonLd.speakable.cssSelector).toEqual([
			'#worum',
			'#dimensionen',
			'#gewichte'
		]);
	});

	it('strippt trailing-slash vom origin', () => {
		const jsonLd = buildSpeakableWebPage({
			origin: `${origin}/`,
			urlPath: '/methodik',
			name: 'Methodik',
			cssSelectors: ['#mission']
		});
		expect(jsonLd.url).toBe(`${origin}/methodik`);
	});

	it('default inLanguage de-DE', () => {
		const jsonLd = buildSpeakableWebPage({
			origin,
			urlPath: '/methodik',
			name: 'Methodik',
			cssSelectors: ['#mission']
		});
		expect(jsonLd.inLanguage).toBe('de-DE');
	});

	it('wirft Error bei leerer cssSelector-Liste', () => {
		expect(() =>
			buildSpeakableWebPage({
				origin,
				urlPath: '/methodik',
				name: 'Methodik',
				cssSelectors: []
			})
		).toThrow(/cssSelectors/);
	});
});
