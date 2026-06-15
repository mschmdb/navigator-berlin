import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import BezirkKiezeList from './bezirk-kieze-list.svelte';
import type { KiezRef } from '$lib/data/get-kieze-in-bezirk.js';

const KIEZE: KiezRef[] = [
	{ slug: 'prenzlauer-berg', name: 'Prenzlauer Berg', composite: 78 },
	{ slug: 'pankow-zentrum', name: 'Pankow Zentrum', composite: 55 },
	{ slug: 'buchholz', name: 'Buchholz', composite: null }
];

describe('bezirk-kieze-list.svelte', () => {
	it('rendert Headline + Liste mit allen Kiezen', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const h2 = page.getByRole('heading', { level: 2 });
		await expect.element(h2).toHaveTextContent(/Kieze im Bezirk Pankow/);
		const links = page.getByTestId('bezirk-kieze-link');
		await expect.element(links.first()).toHaveTextContent('Prenzlauer Berg');
	});

	it('Links verweisen auf /kiez/{slug}', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const link = (await page
			.getByTestId('bezirk-kieze-link')
			.first()
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/kiez/prenzlauer-berg');
	});

	it('zeigt composite-Wert wenn vorhanden', async () => {
		render(BezirkKiezeList, { kieze: KIEZE, bezirkName: 'Pankow' });
		const section = (await page.getByTestId('bezirk-kieze-list').element()) as HTMLElement;
		expect(section.textContent).toContain('78');
		expect(section.textContent).toContain('55');
	});

	it('rendert nichts wenn Kieze leer', async () => {
		render(BezirkKiezeList, { kieze: [], bezirkName: 'Mitte' });
		expect(document.querySelector('[data-testid="bezirk-kieze-list"]')).toBeNull();
	});
});
