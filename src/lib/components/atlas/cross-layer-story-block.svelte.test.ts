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

	// spec-i18n-teiluebersetzung-banner.md: der Template-Fließtext
	// (`rendered.body`) bleibt bis Block C deutsch (WCAG 3.1.2). Review-Fund
	// (i18n Block C1): die Content-Locale folgt jetzt `resolveEffectiveLocale`
	// fuer den echten Rendering-Pfad (`/methodik/cross-layer-templates`, NICHT
	// registriert), statt `getLocale()` (URL-Locale). Auf dieser unregistrierten
	// Seite ist die effektive Locale IMMER DE, auch unter `/en/...` -- der
	// umgebende Rahmen (`<main lang>`, via `resolveFrameLocale` im Layout)
	// faellt dort ebenfalls auf DE zurueck, `body` braucht deshalb KEIN
	// eigenes `lang`-Override (kein Locale-Mismatch zum Rahmen).
	it('body hat KEIN lang-Attribut auf der unregistrierten Seite, auch wenn getLocale() "en" ist (Rahmen faellt dort selbst auf DE zurueck)', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, {
			rendered,
			sources: [],
			pathname: '/methodik/cross-layer-templates'
		});
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBeNull();
	});

	it('body hat KEIN lang-Attribut auf DE (Default)', async () => {
		render(CrossLayerStoryBlock, {
			rendered,
			sources: [],
			pathname: '/methodik/cross-layer-templates'
		});
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBeNull();
	});

	// Der eigentliche Review-Fund: `EditorialDisclaimer` (Variante
	// `cross-layer-template`) bekam vorher KEIN `locale`-Prop und folgte damit
	// `getLocale()` (URL-Locale) -- auf `/en/methodik/cross-layer-templates`
	// waere der Hinweis faelschlich englisch gewesen, obwohl die Seite (und
	// `rendered.body` daneben) deutsch bleibt. Jetzt bekommt er explizit die
	// effektive Locale der (unregistrierten) Seite.
	it('EditorialDisclaimer (cross-layer-template) bleibt deutsch auf der unregistrierten Seite, auch wenn getLocale() "en" ist', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, {
			rendered,
			sources: [],
			pathname: '/methodik/cross-layer-templates'
		});
		const disclaimer = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(disclaimer.textContent).toMatch(/Aggregat-Daten pro Planungsraum, nicht pro Adresse/);
	});

	it('EditorialDisclaimer (cross-layer-template) ist englisch auf einer registrierten Seite (z.B. /en/explore)', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, { rendered, sources: [], pathname: '/explore' });
		const disclaimer = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(disclaimer.textContent).toMatch(/Aggregate data per planning area, not per address/);
	});
});
