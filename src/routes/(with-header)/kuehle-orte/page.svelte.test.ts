import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

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
