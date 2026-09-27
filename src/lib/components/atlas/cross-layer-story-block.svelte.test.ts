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
	// (`rendered.body`) bleibt bis Block C deutsch (WCAG 3.1.2).
	it('body bekommt lang="de" wenn getLocale() "en" ist', async () => {
		overwriteGetLocale(() => 'en');
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBe('de');
	});

	it('body hat KEIN lang-Attribut auf DE (Default)', async () => {
		render(CrossLayerStoryBlock, { rendered, sources: [] });
		const body = (await page.getByTestId('cross-layer-story-block-body').element()) as HTMLElement;
		expect(body.getAttribute('lang')).toBeNull();
	});
});
