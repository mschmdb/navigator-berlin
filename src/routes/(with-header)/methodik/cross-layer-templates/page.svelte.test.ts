import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import type { PageData } from './$types';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function buildData(body: string, missingVars: string[] = []): PageData {
	return {
		totalTemplates: 2,
		previews: [
			{
				id: 'wahl-trend-zeit-kiez',
				scope: 'kiez',
				rendered: { id: 'wahl-trend-zeit-kiez', body, editorialNote: null, missingVars: [] },
				contextLabel: 'Kiez Friedrichshain Nord',
				contextJson: '{}',
				requires: ['a.b'],
				editorialNote: 'Note',
				tags: ['wahl', 'trend', 'zeitreihe', 'custom']
			},
			{
				id: 'skip-me',
				scope: 'bezirk',
				rendered: { id: 'skip-me', body: 'x', editorialNote: null, missingVars },
				contextLabel: 'Bezirk Pankow',
				contextJson: '{}',
				requires: [],
				editorialNote: null,
				tags: []
			}
		]
	} as unknown as PageData;
}

const root = () => document.querySelector('[data-testid="cross-layer-templates-preview"]')!;

describe('cross-layer-templates +page.svelte · DE', () => {
	it('bleibt deutsch, der H1 trägt kein redundantes lang="de"', () => {
		render(Page, { data: buildData('Deutscher Text.', ['a']) });
		expect(root().querySelector('h1')?.textContent?.trim()).toBe('Cross-Layer-Templates · Preview');
		expect(root().querySelector('[lang]')).toBeNull();
		expect(root().textContent).toContain('Render-Vorschau der 2 Templates.');
		expect(root().textContent).toContain('Render-Skip wegen fehlender Variablen: a');
		expect(root().textContent).toContain('Editorial-Note');
		expect(root().textContent).toContain('Schema-Details');
		expect(root().querySelector('header a')?.getAttribute('href')).toBe('/methodik');
	});

	it('zeigt Tags und Quellen deutsch', () => {
		render(Page, { data: buildData('Text.') });
		expect(root().textContent).toContain('wahl');
		expect(root().textContent).toContain('Wahlbezirksstatistik');
		expect(root().textContent).toContain('Lizenz dl-de/by-2-0');
	});
});

describe('cross-layer-templates +page.svelte · EN', () => {
	it('rendert Rahmen, Hinweise und Quellen englisch, nur die deutsche editorialNote trägt lang="de"', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: buildData('English text.', ['a', 'b']) });
		const germanParts = [...root().querySelectorAll('[lang="de"]')];
		expect(germanParts).toHaveLength(1);
		expect(germanParts[0]?.textContent).toBe('Note');
		expect(root().textContent).toContain('Render preview of the 2 templates.');
		expect(root().textContent).toContain('Render skipped because of missing variables: a, b');
		expect(root().textContent).toContain('Editorial note');
		expect(root().textContent).toContain('Schema details');
		expect(root().textContent).toContain('Render context');
		expect(root().textContent).toContain('Polling district statistics');
		expect(root().textContent).toContain('Licence dl-de/by-2-0');
		expect(root().textContent).toContain('· Co-design stage');
	});

	it('übersetzt bekannte Tags und lässt unbekannte stehen', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: buildData('English text.') });
		const text = root().textContent ?? '';
		expect(text).toContain('election');
		expect(text).toContain('time series');
		expect(text).toContain('custom');
	});

	it('verlinkt Methodik unter /en, Code-Spans bleiben unverändert', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: buildData('English text.') });
		expect(root().querySelector('header a')?.getAttribute('href')).toBe('/en/methodik');
		expect(
			root()
				.querySelector('[data-testid="block-wahl-trend-zeit-kiez-kiez-methodik-link"]')
				?.getAttribute('href')
		).toBe('/en/methodik');
		const codes = [...root().querySelectorAll('header code')].map((c) => c.textContent);
		expect(codes).toEqual([
			'crossLayerStoryBlock',
			'docs/cross-layer-templates-style-guide.md',
			'pnpm lint:cross-layer-templates'
		]);
	});
});
