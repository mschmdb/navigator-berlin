import { describe, expect, it } from 'vitest';
import { buildFaqPage } from './jsonld-faqpage.js';

describe('buildFaqPage', () => {
	const items = [
		{ question: 'Was zeigt navigator.berlin?', answer: 'Berliner Geo-Daten pro Adresse.' },
		{ question: 'Warum kein Score?', answer: 'Wir aggregieren keine Wohnqualitaet.' }
	];

	it('hat @type FAQPage mit mainEntity Question-Liste', () => {
		const out = buildFaqPage({ items });
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('FAQPage');
		expect(Array.isArray(out.mainEntity)).toBe(true);
		expect(out.mainEntity).toHaveLength(2);
		expect(out.mainEntity[0]['@type']).toBe('Question');
	});

	it('Question hat name + acceptedAnswer Answer.text', () => {
		const out = buildFaqPage({ items });
		expect(out.mainEntity[0].name).toBe('Was zeigt navigator.berlin?');
		expect(out.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
		expect(out.mainEntity[0].acceptedAnswer.text).toBe('Berliner Geo-Daten pro Adresse.');
	});

	it('leeres Items-Array → mainEntity Array leer', () => {
		const out = buildFaqPage({ items: [] });
		expect(out.mainEntity).toEqual([]);
	});
});
