import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

describe('Hitze-Home (Spin-off-Route)', () => {
	it('hat genau ein h1 mit dem Hitze-Titel', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Hitze-Navigator Berlin');
	});

	it('CTA führt auf den Kühle-Orte-Explorer-Deep-Link', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByTestId('hitze-cta'))
			.toHaveAttribute('href', '/explore?layers=kuehle-orte&mode=hitze');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page, { data: { warning: null } });
		const text = (await page.getByTestId('hitze-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});
});
