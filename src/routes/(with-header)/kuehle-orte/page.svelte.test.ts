import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import {
	ariaLabels,
	internalHrefs,
	normalizedText,
	textLines
} from '../methodik/methodik-test-utils.js';

describe('Kühle-Orte-Landing (Story 16.1)', () => {
	it('hat genau ein h1 mit dem Seitentitel', async () => {
		render(Page);
		const h1 = page.getByRole('heading', { level: 1 });
		await expect.element(h1).toHaveTextContent('Kühle Orte in Berlin');
	});

	it('CTA ist ein echter Link auf den Explorer-Deep-Link (FR20)', async () => {
		render(Page);
		const cta = page.getByTestId('explorer-cta');
		await expect.element(cta).toHaveAttribute('href', '/explore?layers=kuehle-orte');
	});

	it('Intro trägt die Angebot-Haltung (kein Behörden-Ersatz)', async () => {
		render(Page);
		await expect
			.element(page.getByText(/kein Ersatz für die Hinweise der Stadt/))
			.toBeInTheDocument();
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page);
		const article = page.getByTestId('kuehle-orte-landing');
		const text = (await article.element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});
});

describe('kuehle-orte · DE-Parität (i18n C4c)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page);
		const root = document.querySelector('[data-testid="kuehle-orte-landing"]')!;
		await expect(textLines(root)).toMatchFileSnapshot('./__snapshots__/kuehle-orte-de-lines.txt');
		await expect(normalizedText(root)).toMatchFileSnapshot(
			'./__snapshots__/kuehle-orte-de-text.txt'
		);
		await expect(ariaLabels(root)).toMatchFileSnapshot('./__snapshots__/kuehle-orte-de-aria.txt');
	});

	it('Meta-Title bleibt der Baseline-Titel', async () => {
		render(Page);
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Kühle Orte in Berlin - navigator.berlin');
	});
});

describe('kuehle-orte · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(): Element {
		overwriteGetLocale(() => 'en');
		render(Page);
		return document.querySelector('[data-testid="kuehle-orte-landing"]')!;
	}

	it('H1, Intro, Karten-Hinweis und CTA sind englisch', () => {
		const root = renderEn();
		expect(root.querySelector('h1')?.textContent?.trim()).toBe('Cool places in Berlin');
		const text = root.textContent ?? '';
		expect(text).toContain('where can I cool down?');
		expect(text).toContain('Explore the map');
		expect(text).toContain('Opens the atlas with the cool places layer already active.');
		expect(text).not.toContain('Karte');
		expect(root.querySelector('[lang="de"]')).toBeNull();
	});

	it('CTA führt unter /en in den Explorer', () => {
		const root = renderEn();
		expect(internalHrefs(root)).toEqual(['/en/explore?layers=kuehle-orte']);
	});

	it('Karten-Einbettung trägt das englische Label', () => {
		const root = renderEn();
		expect(ariaLabels(root)).toContain('Map: Cool places in Berlin');
		expect(root.querySelector('figcaption')?.textContent).toContain(
			'Map view: Cool places in Berlin.'
		);
	});

	it('Meta-Title englisch', async () => {
		renderEn();
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Cool places in Berlin - navigator.berlin');
	});
});
