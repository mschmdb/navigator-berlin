import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FaqSection from './faq-section.svelte';
import type { FaqEntry } from '$lib/data/types.js';

const items: FaqEntry[] = [
	{ question: 'Wie laut ist es in Mitte?', answer: 'Der Tages-Lärmpegel liegt im Berliner Mittel.' },
	{ question: 'Wie viele Grünanlagen gibt es?', answer: 'In Mitte gibt es rund 200 öffentliche Grünanlagen.' }
];

describe('FaqSection.svelte', () => {
	it('rendert nichts wenn items leer ist', async () => {
		render(FaqSection, { items: [], pageType: 'bezirk' });
		expect(document.querySelector('[data-testid="faq-section"]')).toBeNull();
	});

	it('rendert Section + Heading + ein Accordion-Item pro Q&A', async () => {
		render(FaqSection, { items, pageType: 'bezirk' });
		const section = document.querySelector('[data-testid="faq-section"]');
		expect(section).not.toBeNull();
		const heading = section?.querySelector('h2');
		expect(heading?.textContent).toMatch(/Häufige Fragen/i);
		const triggers = section?.querySelectorAll('[data-faq-question]');
		expect(triggers?.length).toBe(2);
		expect(triggers?.[0].textContent).toMatch(/Wie laut ist es in Mitte/);
	});

	it('rendert FAQPage-JSON-LD im Head', async () => {
		render(FaqSection, { items, pageType: 'kiez' });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="faq-jsonld"]'
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed['@type']).toBe('FAQPage');
		expect(parsed.mainEntity).toHaveLength(2);
		expect(parsed.mainEntity[0]['@type']).toBe('Question');
		expect(parsed.mainEntity[0].name).toBe('Wie laut ist es in Mitte?');
		expect(parsed.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
	});

	it('erste Q&A ist SSR-offen damit Crawler ohne JS Antwort sieht', async () => {
		render(FaqSection, { items, pageType: 'layer' });
		const firstAnswer = document.querySelector('[data-faq-answer-index="0"]');
		expect(firstAnswer).not.toBeNull();
		expect(firstAnswer?.getAttribute('hidden')).toBeNull();
	});

	it('zeigt einen pageType-spezifischen data-attribute für späteres Tracking/Styling', async () => {
		render(FaqSection, { items, pageType: 'bezirk' });
		const section = document.querySelector('[data-testid="faq-section"]');
		expect(section?.getAttribute('data-page-type')).toBe('bezirk');
	});
});
