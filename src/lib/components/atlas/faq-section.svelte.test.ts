import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import FaqSection from './faq-section.svelte';
import type { FaqEntry } from '$lib/data/types.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const items: FaqEntry[] = [
	{
		question: 'Wie laut ist es in Mitte?',
		answer: 'Der Tages-Lärmpegel liegt im Berliner Mittel.'
	},
	{
		question: 'Wie viele Grünanlagen gibt es?',
		answer: 'In Mitte gibt es rund 200 öffentliche Grünanlagen.'
	}
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

	it('verlinkt die Methodik-Seite auf Detailseiten (Story 11.2 AC-2)', async () => {
		render(FaqSection, { items, pageType: 'kiez' });
		const link = document.querySelector('[data-testid="faq-methodik-link"] a');
		expect(link).not.toBeNull();
		expect(link?.getAttribute('href')).toBe('/methodik');
	});

	it('zeigt keinen Methodik-Link auf Layer-Seiten (Erklärungen stehen dort selbst)', async () => {
		render(FaqSection, { items, pageType: 'layer' });
		expect(document.querySelector('[data-testid="faq-methodik-link"]')).toBeNull();
	});

	it('Q&A-Accordion trägt kein lang-Attribut auf der DE-Seite', async () => {
		render(FaqSection, { items, pageType: 'kiez' });
		const accordion = document.querySelector(
			'[data-testid="faq-section"] .divide-y.divide-rule.border-y.border-rule'
		);
		expect(accordion?.hasAttribute('lang')).toBe(false);
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('Heading + Methodik-Link englisch mit /en-Href', async () => {
			overwriteGetLocale(() => 'en');
			render(FaqSection, { items, pageType: 'kiez' });
			const section = document.querySelector('[data-testid="faq-section"]');
			expect(section?.querySelector('h2')?.textContent).toMatch(/Frequently asked questions/i);
			const link = document.querySelector('[data-testid="faq-methodik-link"] a');
			expect(link?.getAttribute('href')).toBe('/en/methodik');
			expect(link?.textContent).toMatch(/methodology page/i);
		});

		it('Q&A-Inhalte bleiben deutsch, Accordion trägt lang="de" (WCAG 3.1.2), Heading bleibt ohne lang', async () => {
			overwriteGetLocale(() => 'en');
			render(FaqSection, { items, pageType: 'kiez' });
			const section = document.querySelector('[data-testid="faq-section"]');
			const heading = section?.querySelector('h2');
			expect(heading?.hasAttribute('lang')).toBe(false);
			const accordion = section?.querySelector('.divide-y.divide-rule.border-y.border-rule');
			expect(accordion?.getAttribute('lang')).toBe('de');
			expect(accordion?.textContent).toContain('Wie laut ist es in Mitte?');
		});
	});
});
