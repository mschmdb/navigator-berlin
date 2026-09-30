import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import CrossLayerStoryBlock from './cross-layer-story-block.svelte';
import type { RenderedTemplate } from '$lib/data/cross-layer-templates/index.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const rendered: RenderedTemplate = {
	id: 'ruhe-hitze',
	body: 'Dieser Kiez ist ruhig und kühl zugleich.',
	editorialNote: null,
	missingVars: []
};

describe('cross-layer-story-block.svelte', () => {
	it('rendert den Body-Text', async () => {
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.textContent).toContain('ruhig und kühl');
	});

	it('rendert nichts wenn missingVars nicht leer ist', async () => {
		const { container } = render(CrossLayerStoryBlock, {
			rendered: { ...rendered, missingVars: ['foo'] },
			sources: []
		});
		expect(container.querySelector('[data-testid="cross-layer-story-block"]')).toBeNull();
	});

	// i18n C4a: `/methodik/cross-layer-templates` ist registriert, `rendered.body`
	// kommt vom Aufrufer bereits in der Seiten-Locale. Der Block setzt daher nie
	// ein eigenes `lang` (WCAG 3.1.2: Text und Rahmen teilen die Sprache).
	it('body hat kein lang-Attribut auf DE', async () => {
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBeNull();
	});

	it('body hat kein lang-Attribut auf EN', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBeNull();
	});

	it('EditorialDisclaimer (cross-layer-template) folgt der Seiten-Locale: DE', async () => {
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const disclaimer = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(disclaimer.textContent).toMatch(/Aggregat-Daten pro Planungsraum, nicht pro Adresse/);
	});

	it('EditorialDisclaimer (cross-layer-template) folgt der Seiten-Locale: EN', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const disclaimer = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(disclaimer.textContent).toMatch(/Aggregate data per planning area, not per address/);
	});

	describe('Rahmentexte', () => {
		const sources = [{ label: 'Quelle A', license: 'dl-de/by-2-0' }];

		it('DE: Quellen-Label, Lizenz-Präfix und Methodik-Link auf Deutsch', async () => {
			render(CrossLayerStoryBlock, { rendered, sources });
			const list = (await page
				.getByTestId('cross-layer-story-block-sources')
				.element()) as HTMLElement;
			expect(list.getAttribute('aria-label')).toBe('Quellen für diese Beobachtung');
			expect(list.textContent).toContain('Lizenz dl-de/by-2-0');
			const link = (await page
				.getByTestId('cross-layer-story-block-methodik-link')
				.element()) as HTMLAnchorElement;
			expect(link.textContent?.trim()).toBe('Methodik');
			expect(link.getAttribute('href')).toBe('/methodik');
		});

		it('EN: Quellen-Label, Lizenz-Präfix und Methodik-Link auf Englisch unter /en', async () => {
			overwriteGetLocale(() => 'en');
			render(CrossLayerStoryBlock, { rendered, sources });
			const list = (await page
				.getByTestId('cross-layer-story-block-sources')
				.element()) as HTMLElement;
			expect(list.getAttribute('aria-label')).toBe('Sources for this observation');
			expect(list.textContent).toContain('Licence dl-de/by-2-0');
			const link = (await page
				.getByTestId('cross-layer-story-block-methodik-link')
				.element()) as HTMLAnchorElement;
			expect(link.textContent?.trim()).toBe('Methodology');
			expect(link.getAttribute('href')).toBe('/en/methodik');
		});

		it('ein expliziter methodikHref bleibt unverändert', async () => {
			render(CrossLayerStoryBlock, { rendered, sources, methodikHref: '/x' });
			const link = (await page
				.getByTestId('cross-layer-story-block-methodik-link')
				.element()) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/x');
		});
	});
});
